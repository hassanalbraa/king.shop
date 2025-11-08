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
import { Separator } from '../ui/separator';

const formSchema = z.object({
  email: z.string().email({ message: 'الرجاء إدخال بريد إلكتروني صحيح' }),
  password: z.string().min(1, { message: 'كلمة المرور مطلوبة' }),
});

export function LoginForm() {
  const { login, setView } = useAppContext();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    const result = await login(values.email, values.password);
    if (!result.success) {
      setError(result.message);
      form.reset();
    }
    setIsLoading(false);
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline">أهلاً بك</CardTitle>
        <CardDescription>سجّل الدخول للمتابعة إلى KING STORE</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
            <Alert variant="destructive" className="mb-6">
                <Terminal className="h-4 w-4" />
                <AlertTitle>خطأ في تسجيل الدخول</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>البريد الإلكتروني</FormLabel>
                  <FormControl>
                    <Input placeholder="أدخل بريدك الإلكتروني" {...field} />
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
                    <Input type="password" placeholder="أدخل كلمة المرور" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full !mt-8 bg-primary hover:bg-accent text-primary-foreground rounded-full text-lg py-6">
              {isLoading && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
              دخول
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          ليس لديك حساب؟{' '}
          <Button variant="link" className="p-0 h-auto" onClick={() => setView('register')}>
            سجل الآن
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
