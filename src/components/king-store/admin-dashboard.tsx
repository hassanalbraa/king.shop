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
