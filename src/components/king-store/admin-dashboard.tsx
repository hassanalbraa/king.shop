
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Save, Users, Tag, History, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/data';
import type { Transaction } from '@/context/app-context';
import { collection, query, where, orderBy, collectionGroup } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Skeleton } from '../ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

const addOfferSchema = z.object({
  name: z.string().min(1, { message: 'اسم اللعبة مطلوب' }),
  description: z.string().min(1, { message: 'الوصف مطلوب' }),
  price: z.coerce.number().min(1, { message: 'السعر يجب أن يكون أكبر من 0' }),
});

function AllTransactionsHistory() {
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `transactions`), orderBy('transactionDate', 'desc'));
  }, [firestore]);

  const { data: transactions, isLoading } = useCollection<Omit<Transaction, 'id'>>(transactionsQuery);

  return (
    <div>
      <h3 className="text-xl font-headline mb-4 flex items-center gap-2"><History className="h-5 w-5" />سجل جميع المعاملات</h3>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم المستخدم</TableHead>
              <TableHead>ID اللاعب</TableHead>
              <TableHead>المنتج</TableHead>
              <TableHead>السعر</TableHead>
              <TableHead>التاريخ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex flex-col gap-2 py-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && transactions && transactions.length > 0 ? (
              transactions.map((tx, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{tx.username}</TableCell>
                  <TableCell className="font-mono text-xs">{tx.playerId}</TableCell>
                  <TableCell>{tx.gameOfferName} - {tx.gameOfferDescription}</TableCell>
                  <TableCell>{tx.amount.toFixed(0)} ج.س</TableCell>
                  <TableCell>{tx.transactionDate ? new Date(tx.transactionDate.seconds * 1000).toLocaleString('ar-SD') : 'قيد التنفيذ'}</TableCell>
                </TableRow>
              ))
            ) : (
              !isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    لا يوجد معاملات لعرضها.
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

function AddOfferForm() {
    const { addOffer } = useAppContext();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof addOfferSchema>>({
        resolver: zodResolver(addOfferSchema),
        defaultValues: {
            name: '',
            description: '',
            price: 0,
        },
    });

    async function onSubmit(values: z.infer<typeof addOfferSchema>) {
        setIsLoading(true);
        try {
            await addOffer(values);
            toast({ title: "تم بنجاح!", description: "تمت إضافة العرض الجديد." });
            form.reset();
        } catch (error) {
            toast({ variant: "destructive", title: "خطأ", description: "فشلت إضافة العرض." });
        } finally {
            setIsLoading(false);
        }
    }
    
    return (
        <div className="mt-6">
            <h4 className="text-lg font-headline mb-4 flex items-center gap-2"><PlusCircle className="h-5 w-5" />إضافة عرض جديد</h4>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 border rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>اسم اللعبة</FormLabel>
                                    <FormControl>
                                        <Input placeholder="مثال: PUBG" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الوصف</FormLabel>
                                    <FormControl>
                                        <Input placeholder="مثال: 60 شدة" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>السعر</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="مثال: 3500" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'جاري الإضافة...' : 'إضافة العرض'}
                    </Button>
                </form>
            </Form>
        </div>
    );
}


export function AdminDashboard() {
  const { offers, updateBalance, updateOfferPrice, deleteOffer, logout, deleteUser } = useAppContext();
  const { toast } = useToast();
  const firestore = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null; // Wait until firestore is available
    return query(collection(firestore, 'users'), where('isAdmin', '==', false));
  }, [firestore]);
  
  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);

  const [editableUsers, setEditableUsers] = useState<EditableUser[]>([]);
  const [editableOffers, setEditableOffers] = useState<EditableOffer[]>([]);
  const [itemToDelete, setItemToDelete] = useState<{type: 'offer' | 'user', data: any} | null>(null);
  
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
        toast({ variant: "destructive", title: "خطأ", description: "الرجاء إدخال رقم صحيح للسعر." });
      }
    }
  };
  
  const handleDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'offer') {
        try {
            await deleteOffer(itemToDelete.data.id);
            toast({ title: "تم الحذف!", description: "تم حذف العرض بنجاح." });
        } catch (error) {
            toast({ variant: "destructive", title: "خطأ", description: "فشل حذف العرض." });
        }
    } else if (itemToDelete.type === 'user') {
        try {
            await deleteUser(itemToDelete.data.id);
            toast({ title: "تم الحذف!", description: "تم حذف المستخدم بنجاح." });
        } catch (error) {
            toast({ variant: "destructive", title: "خطأ", description: "فشل حذف المستخدم." });
        }
    }
    setItemToDelete(null);
  };


  return (
    <Card className="w-full mx-auto px-4 sm:px-6 lg:px-8 border-0 shadow-none sm:border sm:shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-3xl font-headline">لوحة تحكم الأدمن</CardTitle>
          <CardDescription>إدارة المستخدمين والعروض والمعاملات</CardDescription>
        </div>
        <Button variant="destructive" onClick={logout}>
          <LogOut className="ms-2 h-4 w-4" />
          خروج
        </Button>
      </CardHeader>
      <CardContent className="space-y-8">
        <AlertDialog onOpenChange={(open) => {if (!open) setItemToDelete(null)}}>
          <div>
            <h3 className="text-xl font-headline mb-4 flex items-center gap-2"><Users className="h-5 w-5" />إدارة المستخدمين</h3>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم المستخدم</TableHead>
                    <TableHead>الرصيد</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
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
                      <TableCell className="text-left flex gap-2 justify-end">
                        <Button size="sm" onClick={() => saveUserBalance(user.id)}>
                          <Save className="ms-2 h-4 w-4" />
                          حفظ
                        </Button>
                         <AlertDialogTrigger asChild>
                           <Button size="sm" variant="destructive" onClick={() => setItemToDelete({type: 'user', data: user})}>
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        </AlertDialogTrigger>
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
                    <TableHead className="text-left">إجراءات</TableHead>
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
                        <TableCell className="text-left flex gap-2 justify-end">
                          <Button size="sm" onClick={() => saveOfferPrice(offer.id)}>
                            <Save className="ms-2 h-4 w-4" />
                            حفظ
                          </Button>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" onClick={() => setItemToDelete({type: 'offer', data: offer})}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <AddOfferForm />
          </div>

          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                  <AlertDialogDescription>
                    {itemToDelete?.type === 'user' && `هل أنت متأكد من رغبتك في حذف المستخدم "${itemToDelete.data.username}"؟ سيتم حذف بياناته بشكل نهائي.`}
                    {itemToDelete?.type === 'offer' && `هل أنت متأكد من رغبتك في حذف عرض "${itemToDelete.data.name} - ${itemToDelete.data.description}"؟`}
                    لا يمكن التراجع عن هذا الإجراء.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      تأكيد الحذف
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AllTransactionsHistory />
      </CardContent>
    </Card>
  );
}

      const deleteOffer = async (offerId: string) => {
    if (!firestore) return;
    const confirmed = confirm('هل أنت متأكد من حذف هذا العرض؟');
    if (!confirmed) return;
    try {
      await deleteDoc(doc(firestore, 'game_offers', offerId));
      setEditableOffers(prev => prev.filter(o => o.id !== offerId));
      toast({ title: "تم الحذف!", description: "تم حذف العرض بنجاح." });
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل حذف العرض." });
      console.error(err);
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
        {/* إدارة المستخدمين */}
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
                    <TableCell className="text-left flex gap-2">
                      <Button size="sm" onClick={() => saveUserBalance(user.id)}>
                        <Save className="ms-2 h-4 w-4" />
                        حفظ
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteUser(user.id)}>
                        <Trash2 className="ms-2 h-4 w-4" />
                        حذف
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* إدارة العروض */}
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
                    <TableCell className="text-left flex gap-2">
                       <Button size="sm" onClick={() => saveOfferPrice(offer.id)}>
                        <Save className="ms-2 h-4 w-4" />
                        حفظ
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteOffer(offer.id)}>
                        <Trash2 className="ms-2 h-4 w-4" />
                        حذف
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
