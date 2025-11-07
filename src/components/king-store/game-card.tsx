"use client";

import type { GameOffer } from '@/lib/data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart } from 'lucide-react';

interface GameCardProps {
  offer: GameOffer;
}

export function GameCard({ offer }: GameCardProps) {
  const { purchaseOffer } = useAppContext();
  const { toast } = useToast();

  const handlePurchase = () => {
    const result = purchaseOffer(offer.id);
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
  };

  return (
    <Card className="bg-secondary border border-transparent transition-all hover:border-accent hover:shadow-md flex flex-col">
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-headline text-secondary-foreground mb-1">{offer.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">{offer.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="text-primary font-bold text-lg">
          {offer.price.toFixed(0)} ج.س
        </div>
        <Button size="sm" onClick={handlePurchase}>
           <ShoppingCart className="ms-2 h-4 w-4" />
           شراء
        </Button>
      </CardFooter>
    </Card>
  );
}
