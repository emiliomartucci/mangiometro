'use client';

import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { DayLog, Meal } from '@/lib/types';
import { format, parse } from 'date-fns';
import { it } from 'date-fns/locale';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { removeMealFromLog } from '@/data/logs';
import { AddMealSheet } from './AddMealSheet';
import { RateDaySheet } from './RateDaySheet';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const wellbeingMap: { [key: number]: { label: string; color: string } } = {
  0: { label: 'Non valutato', color: 'bg-gray-400' }, 1: { label: 'Malissimo', color: 'bg-red-500' },
  2: { label: 'Male', color: 'bg-orange-500' }, 3: { label: 'Normale', color: 'bg-yellow-500' },
  4: { label: 'Bene', color: 'bg-green-500' }, 5: { label: 'Molto Bene', color: 'bg-blue-500' },
};

function MealAnalysisDetails({ meal }: { meal: Meal }) {
    if (!meal.analysis) {
        return <p className="text-sm text-muted-foreground italic px-4 pb-4">Nessuna analisi AI disponibile per questo pasto.</p>;
    }
    const { ingredients = [], allergens = [], macros } = meal.analysis;
    return (
        <div className="space-y-4 text-sm px-4 pb-4">
            <div>
                <strong className="block mb-2 text-primary">Ingredienti Stimati:</strong>
                <div className="flex flex-wrap gap-1">
                    {ingredients.map(ing => <Badge key={ing} variant="secondary">{ing}</Badge>)}
                </div>
            </div>
            <div>
                <strong className="block mb-2 text-destructive">Allergeni Rilevati:</strong>
                <div className="flex flex-wrap gap-2 items-center">
                    {allergens.map(a => <Badge key={a.name} variant="destructive">{a.name}</Badge>)}
                </div>
            </div>
            <div>
                <strong className="block mb-2 text-primary">Macro (Stima):</strong>
                <div className="flex gap-4 text-muted-foreground">
                    <span>Carb: {macros?.carbohydrates ?? 'N/A'}g</span>
                    <span>Pro: {macros?.protein ?? 'N/A'}g</span>
                    <span>Fat: {macros?.fat ?? 'N/A'}g</span>
                </div>
            </div>
        </div>
    );
}

export function DayDetailsSheet({ open, onOpenChange, log, onDataChange }: { open: boolean, onOpenChange: (open: boolean) => void, log: DayLog, onDataChange: () => void }) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [mealToDelete, setMealToDelete] = React.useState<Meal | null>(null);
  const { toast } = useToast();

  if (!log) return null;
  
  const dateObj = parse(log.date, 'yyyy-MM-dd', new Date());
  const { label, color } = wellbeingMap[log.wellbeingRating] || wellbeingMap[0];
  
  const handleDeleteMeal = async () => {
    if (!mealToDelete) return;
    setIsDeleting(true);
    try {
      await removeMealFromLog(log.date, mealToDelete);
      toast({ title: "Pasto eliminato" });
      onDataChange();
      if (log.meals?.length === 1) {
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Errore", description: error.message });
    } finally {
      setIsDeleting(false);
      setMealToDelete(null);
    }
  };
  
  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[380px] sm:w-[540px] flex flex-col">
          <SheetHeader className="px-6 pt-6">
            <SheetTitle className="flex items-center gap-3">
              {format(dateObj, 'EEEE, d MMMM yyyy', { locale: it })}
              <Badge className={cn('text-white', color)}>{label}</Badge>
            </SheetTitle>
            <SheetDescription>Rivedi e aggiorna i dati della giornata.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 py-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2 px-6">Pasti</h3>
            {log.meals && log.meals.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {log.meals.map((meal, index) => (
                  <AccordionItem key={index} value={`meal-${index}`}>
                    <div className="flex items-center w-full pr-6 pl-6">
                      <AccordionTrigger className="flex-1 text-left py-4">
                        <div className="flex-1">
                          <span className="font-semibold capitalize">{meal.type}</span>
                          <p className="text-sm text-muted-foreground font-normal truncate">{meal.description}</p>
                        </div>
                        <span className="text-muted-foreground text-sm mx-4">{format(new Date(meal.time), 'HH:mm')}</span>
                      </AccordionTrigger>
                      <Button variant="ghost" size="icon" onClick={() => setMealToDelete(meal)} aria-label="Elimina pasto" className="shrink-0 ml-2">
                          <Trash2 className="h-4 w-4 text-destructive"/>
                      </Button>
                    </div>
                    <AccordionContent>
                        <MealAnalysisDetails meal={meal} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : ( <p className="text-sm text-muted-foreground px-6">Nessun pasto registrato.</p> )}
          </div>
          <SheetFooter className="mt-auto p-4 border-t bg-background">
            <div className="grid grid-cols-2 gap-4 w-full">
              <RateDaySheet log={log} onDataChange={onDataChange} />
              <AddMealSheet date={log.date} onDataChange={onDataChange} />
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <AlertDialog open={!!mealToDelete} onOpenChange={(open) => !open && setMealToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Sei sicuro?</AlertDialogTitle><AlertDialogDescription>Questa azione è permanente.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setMealToDelete(null)}>Annulla</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteMeal} disabled={isDeleting}>
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Elimina
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
