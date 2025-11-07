"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import type { UserProfile } from '@/lib/data';
import { initialOffers as localInitialOffers } from '@/lib/data';
import { 
  useUser, 
  useAuth, 
  useFirestore,
  errorEmitter,
  FirestorePermissionError
} from '@/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updatePassword,
} from 'firebase/auth';
import { doc, collection, setDoc, getDoc, writeBatch, updateDoc, getDocs, DocumentData, query, Query } from 'firebase/firestore';

type View = 'login' | 'user_dashboard' | 'admin_dashboard' | 'settings' | 'register';

interface GameOffer {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

interface AppContextType {
  currentUser: UserProfile | null;
  offers: GameOffer[];
  view: View;
  isUserLoading: boolean;
  login: (email: string, password_provided: string) => Promise<{success: boolean, message: string}>;
  register: (username: string, email: string, password_provided: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  setView: (view: View) => void;
  updateBalance: (userId: string, newBalance: number) => void;
  updateOfferPrice: (offerId: string, newPrice: number) => void;
  changePassword: (newPassword: string) => void;
  purchaseOffer: (offerId: string) => { success: boolean; message: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

async function fetchCollection<T>(q: Query): Promise<(T & { id: string })[]> {
  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T & { id: string }));
  } catch (error) {
    console.error("Error fetching collection:", error);
    if (error instanceof Error && (error.name === 'FirebaseError' || /permission-denied/i.test(error.message))) {
        const path = (q as any)._query.path.canonicalString();
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: path,
        });
        errorEmitter.emit('permission-error', contextualError);
    }
    return [];
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('login');
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [offers, setOffers] = useState<GameOffer[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const { user, isUserLoading: isAuthLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const isUserLoading = isAuthLoading || (!!user && isDataLoading);

  const fetchAndMaybePopulateOffers = useCallback(async () => {
    if (!firestore) return;
    const offersQuery = query(collection(firestore, 'game_offers'));
    const fetchedOffers = await fetchCollection<GameOffer>(offersQuery);

    if (fetchedOffers.length === 0) {
      console.log("No offers found, populating initial offers...");
      const batch = writeBatch(firestore);
      localInitialOffers.forEach(offer => {
          const offerRef = doc(firestore, 'game_offers', offer.id);
          const offerData = {
            id: offer.id,
            name: offer.name,
            description: offer.description,
            price: offer.price,
            imageUrl: offer.image?.imageUrl || ''
          };
          batch.set(offerRef, offerData);
      });
      await batch.commit();
      const populatedOffers = await fetchCollection<GameOffer>(offersQuery);
      setOffers(populatedOffers);
    } else {
      setOffers(fetchedOffers);
    }
  }, [firestore]);


  useEffect(() => {
    const manageUserSession = async () => {
        setIsDataLoading(true);
        if (!user || !firestore) {
            setCurrentUserProfile(null);
            setView('login');
            setOffers([]);
            setIsDataLoading(false);
            return;
        }

        try {
            const userDocRef = doc(firestore, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists()) {
                const userProfile = docSnap.data() as UserProfile;
                setCurrentUserProfile(userProfile);
                await fetchAndMaybePopulateOffers();
                setView(userProfile.isAdmin ? 'admin_dashboard' : 'user_dashboard');
            } else {
                console.warn("User document not found for logged in user. Logging out.");
                logout();
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            if (error instanceof Error && (error.name === 'FirebaseError' || /permission-denied/i.test(error.message))) {
                const contextualError = new FirestorePermissionError({
                    operation: 'get',
                    path: `users/${user.uid}`,
                });
                errorEmitter.emit('permission-error', contextualError);
            }
            logout();
        } finally {
            setIsDataLoading(false);
        }
    };

    manageUserSession();
  }, [user, firestore, fetchAndMaybePopulateOffers]);


  const login = async (email: string, password_provided: string): Promise<{success: boolean, message: string}> => {
    if (!auth) return { success: false, message: "Authentication service is not available." };
    try {
      await signInWithEmailAndPassword(auth, email, password_provided);
      return { success: true, message: "تم تسجيل الدخول بنجاح" };
    } catch (error: any) {
      console.error(error);
      return { success: false, message: "البريد الإلكتروني أو كلمة المرور غير صحيحة." };
    }
  };

  const register = async (username: string, email: string, password_provided: string): Promise<{ success: boolean; message: string }> => {
    if (!auth || !firestore) return { success: false, message: "A core service is not available." };
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password_provided);
        const firebaseUser = userCredential.user;
        const isAdmin = email.toLowerCase() === 'admin@king.store';
        
        const newUserProfile: UserProfile = {
            id: firebaseUser.uid,
            username,
            balance: 0,
            isAdmin: isAdmin,
        };

        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        
        await setDoc(userDocRef, newUserProfile)
          .catch((error) => {
              const permissionError = new FirestorePermissionError({
                  path: userDocRef.path,
                  operation: 'create',
                  requestResourceData: newUserProfile,
              });
              errorEmitter.emit('permission-error', permissionError);
              throw permissionError; // Rethrow to be caught by the outer try/catch
          });
        return { success: true, message: 'تم التسجيل بنجاح!' };

    } catch (error: any) {
        console.error("Registration error details:", error);
        if (error.code === 'auth/email-already-in-use') {
            return { success: false, message: 'هذا البريد الإلكتروني مستخدم بالفعل.' };
        }
        if (error.code === 'auth/weak-password') {
            return { success: false, message: 'كلمة المرور ضعيفة جدًا (6+ أحرف).' };
        }
        if (error instanceof FirestorePermissionError) {
          return { success: false, message: 'فشل التسجيل بسبب مشكلة في الأذونات.' };
        }
        return { success: false, message: 'فشل التسجيل. يرجى المحاولة مرة أخرى.' };
    }
  };

  const logout = () => {
    if (!auth) return;
    signOut(auth).then(() => {
        setCurrentUserProfile(null);
        setOffers([]);
        setView('login');
    });
  };
  
  const updateBalance = (userId: string, newBalance: number) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', userId);
    const dataToUpdate = { balance: newBalance };
    
    updateDoc(userDocRef, dataToUpdate)
      .then(() => {
        // If the updated user is the current user, update local state
        if (currentUserProfile && currentUserProfile.id === userId) {
            setCurrentUserProfile(prev => prev ? { ...prev, balance: newBalance } : null);
        }
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };
  
  const updateOfferPrice = (offerId: string, newPrice: number) => {
    if (!firestore) return;
    const offerDocRef = doc(firestore, 'game_offers', offerId);
    const dataToUpdate = { price: newPrice };
    
    updateDoc(offerDocRef, dataToUpdate)
      .then(() => {
          setOffers(prevOffers => prevOffers.map(o => o.id === offerId ? {...o, price: newPrice} : o));
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: offerDocRef.path,
          operation: 'update',
          requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };
  
  const changePassword = (newPassword: string) => {
    if (auth.currentUser) {
      updatePassword(auth.currentUser, newPassword).catch(error => {
        console.error("Error changing password:", error);
      });
    }
  };

  const purchaseOffer = (offerId: string): { success: boolean; message: string } => {
    if (!currentUserProfile || !user) {
      return { success: false, message: 'يجب عليك تسجيل الدخول أولاً.' };
    }

    const offer = offers.find(o => o.id === offerId);
    if (!offer) {
      return { success: false, message: 'العرض غير موجود.' };
    }

    if (currentUserProfile.balance < offer.price) {
      return { success: false, message: 'رصيدك غير كافٍ لإتمام عملية الشراء.' };
    }

    const newBalance = currentUserProfile.balance - offer.price;
    updateBalance(user.uid, newBalance);
    
    return { success: true, message: 'تمت عملية الشراء بنجاح!' };
  };

  const value: AppContextType = {
    currentUser: currentUserProfile,
    offers,
    view,
    isUserLoading,
    login,
    register,
    logout,
    setView,
    updateBalance,
    updateOfferPrice,
    changePassword,
    purchaseOffer,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
