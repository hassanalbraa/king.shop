
"use client";

import { useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { GameCard } from './game-card';
import { LogOut, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GameOffer, Transaction } from '@/context/app-context';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

function TransactionHistory() {
  const { currentUser } = useAppContext();
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return query(collection(firestore, `users/${currentUser.id}/transactions`), orderBy('transactionDate', 'desc'));
  }, [firestore, currentUser]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  return (
    <div className="pt-4">
      <h3 className="text-xl font-headline mb-4">سجل الطلبات</h3>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المنتج</TableHead>
              <TableHead>ID اللاعب</TableHead>
              <TableHead>السعر</TableHead>
              <TableHead>التاريخ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="flex flex-col gap-2 py-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && transactions && transactions.length > 0 ? (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.gameOfferName} - {tx.gameOfferDescription}</TableCell>
                  <TableCell className="font-mono text-xs">{tx.playerId}</TableCell>
                  <TableCell>{tx.amount.toFixed(0)} ج.س</TableCell>
                  <TableCell>{tx.transactionDate ? new Date(tx.transactionDate.seconds * 1000).toLocaleDateString('ar-SD') : 'قيد التنفيذ'}</TableCell>
                </TableRow>
              ))
            ) : (
              !isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    لا يوجد سجل طلبات حتى الآن.
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function UserDashboard() {
  const { currentUser, offers, logout, setView, isUserLoading } = useAppContext();

  const groupedOffers = useMemo(() => {
    return offers.reduce((acc, offer) => {
      const key = offer.name;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(offer as GameOffer);
      return acc;
    }, {} as Record<string, GameOffer[]>);
  }, [offers]);
  
  const gameNames = useMemo(() => Object.keys(groupedOffers), [groupedOffers]);

  if (isUserLoading || !currentUser) {
    return (
      <Card className="w-full mx-auto px-4 sm:px-6 lg:px-8 border-0 shadow-none sm:border sm:shadow-lg">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-7 w-36 mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mx-auto px-4 sm:px-6 lg:px-8 border-0 shadow-none sm:border sm:shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-3xl font-headline">مرحباً, {currentUser.username}!</CardTitle>
          <CardDescription className="text-lg mt-2">
            رصيدك الحالي: <span className="font-bold text-primary">{currentUser.balance.toFixed(0)} ج.س</span>
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setView('settings')} aria-label="الإعدادات">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="destructive" size="icon" onClick={logout} aria-label="خروج">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="offers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="offers">أحدث العروض</TabsTrigger>
            <TabsTrigger value="history">سجل الطلبات</TabsTrigger>
          </TabsList>
          <TabsContent value="offers">
            {gameNames.length > 0 ? (
              <Tabs defaultValue={gameNames[0]} className="w-full pt-4">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                  {gameNames.map((gameName) => (
                    <TabsTrigger key={gameName} value={gameName} className="text-sm py-2">
                      {gameName}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {gameNames.map((gameName) => (
                  <TabsContent key={gameName} value={gameName}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4">
                      {groupedOffers[gameName].map((offer) => (
                        <GameCard key={offer.id} offer={offer} />
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <p className="text-center py-8">لا توجد عروض متاحة حالياً.</p>
            )}
          </TabsContent>
          <TabsContent value="history">
            <TransactionHistory />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
