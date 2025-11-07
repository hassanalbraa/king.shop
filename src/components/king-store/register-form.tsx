"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2 } from 'lucide-react';

const formSchema = z.object({
  username: z.string().min(3, { message: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' }),
  email: z.string().email({ message: "الرجاء إدخال بريد إلكتروني صحيح" }),
  password: z.string().min(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }),
});

export function RegisterForm() {
  const { register, setView } = useAppContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    const result = await register(values.username, values.email, values.password);
    if (!result.success) {
      setError(result.message);
      form.setValue('username', '');
    }
     setIsLoading(false);
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline">إنشاء حساب جديد</CardTitle>
        <CardDescription>املأ البيانات التالية للانضمام إلى KING STORE</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
               <Alert variant="destructive">
                 <Terminal className="h-4 w-4" />
                 <AlertTitle>خطأ في التسجيل</AlertTitle>
                 <AlertDescription>
                   {error}
                 </AlertDescription>
               </Alert>
            )}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المستخدم</FormLabel>
                  <FormControl>
                    <Input placeholder="اختر اسم مستخدم" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="أدخل بريدك الإلكتروني" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="اختر كلمة مرور (6+ أحرف)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full !mt-8 bg-primary hover:bg-accent text-primary-foreground rounded-full text-lg py-6">
              {isLoading && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
              تسجيل
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          لديك حساب بالفعل؟{' '}
          <Button variant="link" className="p-0 h-auto" onClick={() => setView('login')}>
            تسجيل الدخول
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
