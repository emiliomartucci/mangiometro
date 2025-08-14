'use client';

import * as React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DayLog, Meal } from '@/lib/types';
import { format, parse } from 'date-fns';
import { it } from 'date-fns/locale';
import { X, Loader2, Trash2 } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';
import { getAllergenWatchlist } from '@/lib/actions'; 
import { AddMealSheet } from './add-meal-sheet';
import { RateDaySheet } from './rate-day-sheet';
import { cn } from '@/lib/utils';


function MealEditor({ date, meal, onDataChange }: { date: string, meal: Meal, onDataChange: () => void }) {
    const [watchlist, setWatchlist] = React.useState<string[]>([]);
    const [isSaving, setIsSaving] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const { toast } = useToast();

    React.useEffect(() => {
        getAllergenWatchlist().then(list => setWatchlist(list || []));
    }, []);

    const handleAllergenChange = async (newAllergens: { name: string; reason: string }[]) => {
        if (!meal.analysis) return;
        setIsSaving(true);

        const updatedMeal: Meal = {
            ...meal,
            analysis: { ...meal.analysis, allergens: newAllergens }
        };
        
        try {
            const response = await fetch(`/api/logs/${date}/meals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meal: updatedMeal, isUpdate: true })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Server Error');
            }

            toast({ title: "Allergeni aggiornati." });
            onDataChange();
        } catch (error: any) {
             toast({ variant: "destructive", title: "Errore", description: error.message || "Impossibile aggiornare gli allergeni." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveAllergen = (allergenNameToRemove: string) => {
        const currentAllergens = meal.analysis?.allergens || [];
        if (Array.isArray(currentAllergens)) {
            const newAllergens = currentAllergens.filter(a => a.name !== allergenNameToRemove);
            handleAllergenChange(newAllergens);
        }
    };

    const handleAddAllergen = (allergenNameToAdd: string) => {
        const currentAllergens = meal.analysis?.allergens || [];
        if (Array.isArray(currentAllergens)) {
            if (currentAllergens.some(a => a.name === allergenNameToAdd)) return;
            const newAllergen = { name: allergenNameToAdd, reason: "Aggiunto manualmente" };
            handleAllergenChange([...currentAllergens, newAllergen]);
        } else {
             const newAllergen = { name: allergenNameToAdd, reason: "Aggiunto manualmente" };
             handleAllergenChange([newAllergen]);
        }
        setSearchQuery("");
    };

    if (!meal.analysis) {
        return <p className="text-sm text-muted-foreground">Analisi AI non disponibile.</p>;
    }
    
    const allergens = Array.isArray(meal.analysis.allergens) ? meal.analysis.allergens : [];
    const ingredients = Array.isArray(meal.analysis.ingredients) ? meal.analysis.ingredients : [];
    
    const availableToAdd = watchlist.filter(w => 
        !allergens.some(a => a.name.toLowerCase() === w.toLowerCase()) &&
        w.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-4 text-sm">
        <div>
            <strong className="block mb-2">Ingredienti Stimati:</strong>
            <div className="flex flex-wrap gap-1">
                {ingredients.map(ing => <Badge key={ing} variant="secondary">{ing}</Badge>)}
            </div>
        </div>
        <div>
            <strong className="block mb-2">Macro Nutrienti (Stima):</strong>
            <div className="flex gap-4">
                <span><strong>Carb:</strong> {meal.analysis.macros?.carbohydrates ?? 'N/A'}g</span>
                <span><strong>Pro:</strong> {meal.analysis.macros?.protein ?? 'N/A'}g</span>
                <span><strong>Fat:</strong> {meal.analysis.macros?.fat ?? 'N/A'}g</span>
            </div>
        </div>
        <div>
            <div className="flex items-center justify-between mb-2">
                <strong className="block text-destructive">Allergeni:</strong>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <div className="flex flex-wrap gap-2 items-center border rounded-md p-2">
                <TooltipProvider>
                    {allergens.map(allergen => (
                        <Tooltip key={allergen.name}>
                            <TooltipTrigger>
                                <Badge variant="destructive" className="flex items-center gap-1 p-1">
                                    <span className="cursor-help">{allergen.name}</span>
                                    <div role="button" onClick={() => handleRemoveAllergen(allergen.name)} className="rounded-full hover:bg-white/20 p-0.5">
                                        <X className="h-3 w-3" />
                                    </div>
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent><p>{allergen.reason}</p></TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>
            <div className="mt-2">
                <Input 
                    placeholder="Aggiungi allergene..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && availableToAdd.length > 0 && (
                    <div className="mt-1 border rounded-md max-h-32 overflow-y-auto">
                        {availableToAdd.slice(0, 5).map(item => (
                            <div 
                                key={item} 
                                onClick={() => handleAddAllergen(item)}
                                className="p-2 cursor-pointer hover:bg-accent"
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    );
}

export function DayDetailsSheet({ open, onOpenChange, log, onDataChange }: { open: boolean, onOpenChange: (open: boolean) => void, log: DayLog, onDataChange: () => void }) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [mealToDelete, setMealToDelete] = React.useState<Meal | null>(null);
  const { toast } = useToast();

  // --- START DEBUGGING LOG ---
  React.useEffect(() => {
    if (log) {
      console.log("[DayDetailsSheet] Received log prop:", log);
      console.log("[DayDetailsSheet] Meals in received log:", log.meals);
    }
  }, [log]);
  // --- END DEBUGGING LOG ---

  if (!log) return null;
  const meals = log.meals || [];
  
  const dayDate = parse(log.date, 'yyyy-MM-dd', new Date());
  const { label, color } = wellbeingMap[log.wellbeingRating] || wellbeingMap[0];
  
  const handleDeleteMeal = async () => {
    if (!mealToDelete) return;

    setIsDeleting(true);

    try {
        const response = await fetch(`/api/logs/${log.date}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mealToRemove: mealToDelete }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Server error');
        }

        toast({ title: "Pasto eliminato", description: "Il pasto è stato rimosso con successo." });
        onDataChange(); 

        if (meals.length === 1) {
            onOpenChange(false);
        }
    } catch (error: any) {
        toast({ 
            variant: "destructive", 
            title: "Errore", 
            description: error.message || "Impossibile eliminare il pasto." 
        });
    } finally {
        setIsDeleting(false);
        setMealToDelete(null);
    }
  };
  
  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[350px] sm:w-[540px] flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              {format(dayDate, 'EEEE, d MMMM yyyy', { locale: it })}
              <Badge className={cn('text-white', color)}>{label}</Badge>
            </SheetTitle>
            <SheetDescription>
              Rivedi i dettagli della giornata, inclusi pasti, sintomi e valutazione del benessere.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 py-4 overflow-y-auto pr-6">
            <h3 className="text-lg font-semibold mb-2">Pasti</h3>
            {meals.length > 0 ? (
              <Accordion type="single" collapsible className="w-full" defaultValue={`meal-0`}>
                {meals.map((meal, index) => (
                  <AccordionItem key={meal.time + index} value={`meal-${index}`}>
                    <AccordionTrigger className="p-4 w-full">
                       <div className="flex w-full items-center justify-between gap-2">
                         <div className="flex-1 text-left">
                            <span className="font-semibold capitalize">{meal.type}</span>
                         </div>
                         <span className="text-muted-foreground text-sm">{format(new Date(meal.time), 'HH:mm')}</span>
                         <div 
                             role="button"
                             aria-label="Elimina pasto"
                             className="p-1 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700"
                             onClick={(e) => { 
                                 e.stopPropagation();
                                 e.preventDefault();
                                 setMealToDelete(meal);
                             }}
                          >
                             <Trash2 className="h-4 w-4 text-destructive"/>
                         </div>
                       </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <p className="italic text-muted-foreground mb-4">"{meal.description}"</p>
                      <MealEditor date={log.date} meal={meal} onDataChange={onDataChange} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : ( <p className="text-sm text-muted-foreground">Nessun pasto registrato.</p> )}
          </div>
          <SheetFooter className="mt-auto p-4 border-t bg-background">
            <div className="grid grid-cols-2 gap-4 w-full">
              <RateDaySheet log={log} />
              <AddMealSheet date={log.date} onMealAdded={onDataChange} />
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!mealToDelete} onOpenChange={(open) => !open && setMealToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Questa azione non può essere annullata. Questo eliminerà permanentemente il pasto.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMealToDelete(null)}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMeal} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const wellbeingMap: { [key: number]: { label: string; color: string } } = {
  0: { label: 'Non valutato', color: 'bg-gray-400' },
  1: { label: 'Malissimo', color: 'bg-red-500' },
  2: { label: 'Male', color: 'bg-orange-500' },
  3: { label: 'Normale', color: 'bg-yellow-500' },
  4: { label: 'Bene', color: 'bg-green-500' },
  5: { label: 'Molto Bene', color: 'bg-blue-500' },
};
