"use client";

import { useState } from 'react';
import type { GameOffer } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface GameCardProps {
  offer: GameOffer;
}

export function GameCard({ offer }: GameCardProps) {
  const { purchaseOffer } = useAppContext();
  const { toast } = useToast();
  const [playerId, setPlayerId] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handlePurchase = () => {
    if (!playerId.trim()) {
       toast({
        variant: "destructive",
        title: "خطأ",
        description: "الرجاء إدخال ID اللاعب الخاص بك.",
      });
      return;
    }
    const result = purchaseOffer(offer.id, playerId);
    if (result.success) {
      toast({
        title: "نجاح!",
        description: result.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: result.message,
      });
    }
    setPlayerId('');
    setIsDialogOpen(false);
  };

  return (
    <>
      <Card className="bg-secondary border border-transparent transition-all hover:border-accent hover:shadow-md flex flex-col">
        <CardContent className="p-4 flex-grow">
          <CardTitle className="text-lg font-headline text-secondary-foreground mb-1">{offer.name}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{offer.description}</CardDescription>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div className="text-primary font-bold text-lg">
            {offer.price.toFixed(0)} ج.س
          </div>
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
               <Button size="sm">
                <ShoppingCart className="ms-2 h-4 w-4" />
                شراء
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد عملية الشراء</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم خصم {offer.price.toFixed(0)} ج.س من رصيدك. الرجاء إدخال ID اللاعب الخاص بك في الحقل أدناه لإتمام العملية.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                  <Label htmlFor="playerId" className="text-right mb-2 block">
                    ID اللاعب
                  </Label>
                  <Input
                    id="playerId"
                    value={playerId}
                    onChange={(e) => setPlayerId(e.target.value)}
                    placeholder="أدخل ID الخاص بك هنا"
                  />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPlayerId('')}>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handlePurchase}>تأكيد الشراء</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </>
  );
}
