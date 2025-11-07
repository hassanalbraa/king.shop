
"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import type { UserProfile } from '@/lib/data';
import { initialOffers as localInitialOffers } from '@/lib/data';
import { 
  useUser, 
  useAuth, 
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updatePassword,
} from 'firebase/auth';
import { doc, collection, setDoc, writeBatch, updateDoc, query, onSnapshot, addDoc, serverTimestamp, getDoc, deleteDoc, getDocs, where } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type View = 'login' | 'user_dashboard' | 'admin_dashboard' | 'settings' | 'register';

interface GameOffer {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
}

interface NewGameOffer {
  name: string;
  description: string;
  price: number;
}

export interface Transaction {
  id: string;
  userId: string;
  username?: string;
  gameOfferId: string;
  gameOfferName: string;
  gameOfferDescription: string;
  transactionDate: any;
  amount: number;
  playerId: string;
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
  addOffer: (offer: NewGameOffer) => Promise<void>;
  deleteOffer: (offerId: string) => Promise<void>;
  changePassword: (newPassword: string) => void;
  purchaseOffer: (offerId: string, playerId: string) => { success: boolean; message: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>('login');
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const { user, isUserLoading: isAuthLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const isUserLoading = isAuthLoading || isProfileLoading;
  
  const offersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'game_offers'));
  }, [firestore]);

  const { data: offersData, isLoading: offersLoading } = useCollection<GameOffer>(offersQuery);
  const offers = useMemo(() => offersData || [], [offersData]);

  useEffect(() => {
    const populateInitialOffers = async () => {
        if (firestore && !offersLoading && offers.length === 0 && localInitialOffers.length > 0) {
            const batch = writeBatch(firestore);
            let isAdminCreated = false;

            const adminRoleRef = doc(firestore, 'roles_admin', 'AxEOSZWy1mbzGn36kbhNGvHUhZB2');
            const adminRoleSnap = await getDoc(adminRoleRef);
            if (!adminRoleSnap.exists()) {
                batch.set(adminRoleRef, { isAdmin: true });
            }

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
        }
    };
    if (firestore && !offersLoading) {
      populateInitialOffers();
    }
  }, [firestore, offers, offersLoading]);


  useEffect(() => {
    if (!firestore) return;
    if (user) {
      setIsProfileLoading(true);
      const userDocRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userProfile = { id: docSnap.id, ...docSnap.data()} as UserProfile;
          setCurrentUserProfile(userProfile);
          setView(userProfile.isAdmin ? 'admin_dashboard' : 'user_dashboard');
        } else {
          // This can happen briefly on new user creation, especially with Google sign-in
        }
        setIsProfileLoading(false);
      }, (error) => {
        console.error("Error fetching user data:", error);
        const contextualError = new FirestorePermissionError({
            operation: 'get',
            path: `users/${user.uid}`,
        });
        errorEmitter.emit('permission-error', contextualError);
        setIsProfileLoading(false);
      });
      
      return () => unsubscribe();
    } else {
      setCurrentUserProfile(null);
      setView('login');
      setIsProfileLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, firestore]);
  
  const createUserProfile = async (uid: string, username: string, email: string) => {
    if (!firestore) throw new Error("Firestore not initialized");

    const isAdmin = email.toLowerCase() === 'admin@king.store';
    const newUserProfile: Omit<UserProfile, 'id'> = {
        username,
        balance: 0,
        isAdmin,
    };

    const userDocRef = doc(firestore, "users", uid);

    try {
        await setDoc(userDocRef, newUserProfile);
        if (isAdmin) {
            const adminRoleRef = doc(firestore, 'roles_admin', uid);
            await setDoc(adminRoleRef, { isAdmin: true });
        }
    } catch (error) {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'create',
            requestResourceData: newUserProfile,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }
  };


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
        // Check if username already exists
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return { success: false, message: 'اسم المستخدم هذا موجود بالفعل. الرجاء اختيار اسم آخر.' };
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password_provided);
        await createUserProfile(userCredential.user.uid, username, email);
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
    signOut(auth);
  };
  
  const updateBalance = (userId: string, newBalance: number) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', userId);
    const dataToUpdate = { balance: newBalance };
    
    updateDoc(userDocRef, dataToUpdate)
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
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: offerDocRef.path,
          operation: 'update',
          requestResourceData: dataToUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const addOffer = async (offer: NewGameOffer) => {
    if (!firestore) {
      throw new Error("Firestore not available");
    }
    const offersCollection = collection(firestore, 'game_offers');
    const newOfferData = {
        ...offer,
        imageUrl: '', // Default or derive as needed
    };

    try {
        await addDoc(offersCollection, newOfferData);
    } catch (error) {
        const permissionError = new FirestorePermissionError({
            path: 'game_offers',
            operation: 'create',
            requestResourceData: newOfferData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError; // Re-throw to be caught in the form
    }
  };

  const deleteOffer = async (offerId: string) => {
    if (!firestore) {
        throw new Error("Firestore not available");
    }
    const offerDocRef = doc(firestore, 'game_offers', offerId);
    try {
        await deleteDoc(offerDocRef);
    } catch (error) {
        const permissionError = new FirestorePermissionError({
            path: offerDocRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError; // Re-throw to be caught in the UI
    }
};

  
  const changePassword = (newPassword: string) => {
    if (auth.currentUser) {
      updatePassword(auth.currentUser, newPassword).catch(error => {
        console.error("Error changing password:", error);
      });
    }
  };

  const purchaseOffer = (offerId: string, playerId: string): { success: boolean; message: string } => {
    if (!currentUserProfile || !user || !firestore) {
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
    const userDocRef = doc(firestore, 'users', user.uid);
    updateDoc(userDocRef, { balance: newBalance }).catch(error => {
       const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: { balance: newBalance },
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    const transactionData: Omit<Transaction, 'id'> = {
      userId: user.uid,
      username: currentUserProfile.username,
      gameOfferId: offer.id,
      gameOfferName: offer.name,
      gameOfferDescription: offer.description,
      amount: offer.price,
      transactionDate: serverTimestamp(),
      playerId: playerId,
    };

    const transactionRef = collection(firestore, `users/${user.uid}/transactions`);
    addDoc(transactionRef, transactionData).catch(error => {
        const permissionError = new FirestorePermissionError({
          path: `users/${user.uid}/transactions`,
          operation: 'create',
          requestResourceData: transactionData,
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Failed to log user-specific transaction:", error);
    });

    const flatTransactionsRef = collection(firestore, 'transactions');
    addDoc(flatTransactionsRef, { ...transactionData, id: ''}).catch(error => {
        const permissionError = new FirestorePermissionError({
          path: `transactions`,
          operation: 'create',
          requestResourceData: transactionData,
        });
        errorEmitter.emit('permission-error', permissionError);
        console.error("Failed to log to flat transactions collection:", error);
    });
    
    return { success: true, message: 'تمت عملية الشراء بنجاح! سيقوم الأدمن بشحن حسابك قريباً.' };
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
    addOffer,
    deleteOffer,
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

    
