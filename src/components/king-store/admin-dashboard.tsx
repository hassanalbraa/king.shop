
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Save, Users, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/data';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Skeleton } from '../ui/skeleton';

interface EditableUser extends UserProfile {
  editableBalance: string;
}

interface EditableOffer {
  id: string;
  name: string;
  description: string;
  price: number;
  editablePrice: string;
}

export function AdminDashboard() {
  const { offers, updateBalance, updateOfferPrice, logout } = useAppContext();
  const { toast } = useToast();
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('isAdmin', '==', false));
  }, [firestore]);
  
  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

  const [editableUsers, setEditableUsers] = useState<EditableUser[]>([]);
  const [editableOffers, setEditableOffers] = useState<EditableOffer[]>([]);
  
  useEffect(() => {
    if (users) {
      setEditableUsers(users.map(u => ({ ...u, editableBalance: u.balance.toString() })));
    }
  }, [users]);
  
  useEffect(() => {
    if (offers) {
      setEditableOffers(offers.map(o => ({ ...o, editablePrice: o.price.toString() })));
    }
  }, [offers]);

  const handleUserBalanceChange = (userId: string, value: string) => {
    setEditableUsers(prev => prev.map(u => u.id === userId ? { ...u, editableBalance: value } : u));
  };

  const handleOfferPriceChange = (offerId: string, value: string) => {
    setEditableOffers(prev => prev.map(o => o.id === offerId ? { ...o, editablePrice: value } : o));
  };
  
  const saveUserBalance = (userId: string) => {
    const user = editableUsers.find(u => u.id === userId);
    if (user) {
      const newBalance = parseFloat(user.editableBalance);
      if (!isNaN(newBalance)) {
        updateBalance(userId, newBalance);
        toast({ title: "تم الحفظ!", description: `تم تحديث رصيد ${user.username}.` });
      } else {
        setEditableUsers(prev => prev.map(u => u.id === userId ? { ...u, editableBalance: u.balance.toString() } : u));
        toast({ variant: "destructive", title: "خطأ", description: "الرجاء إدخال رقم صحيح للرصيد." });
      }
    }
  };

  const saveOfferPrice = (offerId: string) => {
    const offer = editableOffers.find(o => o.id === offerId);
    if (offer) {
      const newPrice = parseFloat(offer.editablePrice);
      if (!isNaN(newPrice)) {
        updateOfferPrice(offerId, newPrice);
        toast({ title: "تم الحفظ!", description: `تم تحديث سعر ${offer.name}.` });
      } else {
        setEditableOffers(prev => prev.map(o => o.id === offerId ? { ...o, editablePrice: o.price.toString() } : o));
        toast({ variant: "destructive", title: "خطأ", description: "الرجاء إدخال رقم صحيح للسعر." });
      }
    }
  };

  return (
    <Card className="w-full max-w-5xl border-0 shadow-none sm:border sm:shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-3xl font-headline">لوحة تحكم الأدمن</CardTitle>
          <CardDescription>إدارة المستخدمين والعروض</CardDescription>
        </div>
        <Button variant="destructive" onClick={logout}>
          <LogOut className="ms-2 h-4 w-4" />
          خروج
        </Button>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h3 className="text-xl font-headline mb-4 flex items-center gap-2"><Users className="h-5 w-5" />إدارة المستخدمين</h3>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المستخدم</TableHead>
                  <TableHead>الرصيد</TableHead>
                  <TableHead className="text-left">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading && (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <div className="flex flex-col gap-2 py-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!usersLoading && editableUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={user.editableBalance}
                        onChange={(e) => handleUserBalanceChange(user.id, e.target.value)}
                        onBlur={() => saveUserBalance(user.id)}
                        className="h-8 w-24"
                      />
                    </TableCell>
                    <TableCell className="text-left">
                      <Button size="sm" onClick={() => saveUserBalance(user.id)}>
                        <Save className="ms-2 h-4 w-4" />
                        حفظ
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-headline mb-4 flex items-center gap-2"><Tag className="h-5 w-5" />إدارة العروض</h3>
           <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم العرض</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead className="text-left">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editableOffers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell className="font-medium">{offer.name} - {offer.description}</TableCell>
                    <TableCell>
                       <Input
                        type="number"
                        value={offer.editablePrice}
                        onChange={(e) => handleOfferPriceChange(offer.id, e.target.value)}
                        onBlur={() => saveOfferPrice(offer.id)}
                        className="h-8 w-24"
                      />
                    </TableCell>
                    <TableCell className="text-left">
                       <Button size="sm" onClick={() => saveOfferPrice(offer.id)}>
                        <Save className="ms-2 h-4 w-4" />
                        حفظ
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
