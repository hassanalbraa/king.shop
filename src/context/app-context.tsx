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
                                                                              deleteUser: (userId: string) => Promise<void>;
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
