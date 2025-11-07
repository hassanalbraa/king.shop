"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  newPassword: z.string().min(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }),
});

export function SettingsPage() {
  const { currentUser, setView, changePassword } = useAppContext();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    changePassword(values.newPassword);
    toast({
      title: "نجاح!",
      description: "تم تغيير كلمة المرور بنجاح.",
    })
    const targetView = currentUser?.isAdmin ? 'admin_dashboard' : 'user_dashboard';
    setView(targetView);
  }

  const handleBack = () => {
    const targetView = currentUser?.isAdmin ? 'admin_dashboard' : 'user_dashboard';
    setView(targetView);
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-lg">
      <CardHeader>
        <CardTitle className="text-3xl font-headline">الإعدادات</CardTitle>
        <CardDescription>تغيير كلمة المرور الخاصة بك</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>كلمة المرور الجديدة</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="أدخل كلمة المرور الجديدة" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col-reverse sm:flex-row gap-2 !mt-8">
              <Button type="button" variant="outline" onClick={handleBack} className="w-full">
                <ArrowRight className="ms-2 h-4 w-4" />
                رجوع
              </Button>
              <Button type="submit" className="w-full">
                تغيير كلمة المرور
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
