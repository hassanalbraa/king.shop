"use client";

import { useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { GameCard } from './game-card';
import { LogOut, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GameOffer } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';

export function UserDashboard() {
  const { currentUser, offers, logout, setView, isUserLoading } = useAppContext();

  const groupedOffers = useMemo(() => {
    return offers.reduce((acc, offer) => {
      const key = offer.name;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(offer);
      return acc;
    }, {} as Record<string, GameOffer[]>);
  }, [offers]);
  
  const gameNames = useMemo(() => Object.keys(groupedOffers), [groupedOffers]);

  if (isUserLoading || !currentUser) {
    return (
      <Card className="w-full max-w-7xl border-0 shadow-none sm:border sm:shadow-lg">
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
    <Card className="w-full max-w-7xl border-0 shadow-none sm:border sm:shadow-lg">
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
        <h2 className="text-2xl font-headline mb-6 text-center sm:text-right">أحدث العروض</h2>
        {gameNames.length > 0 ? (
          <Tabs defaultValue={gameNames[0]} className="w-full">
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
          <p>لا توجد عروض متاحة حالياً.</p>
        )}
      </CardContent>
    </Card>
  );
}
