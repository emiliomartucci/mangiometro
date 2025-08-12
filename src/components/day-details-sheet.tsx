'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from '@/components/ui/badge';
import { DayLog, SYMPTOM_CATEGORIES } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { BrainCircuit, HeartPulse, Sparkles, Wind, BatteryCharging, BedDouble } from 'lucide-react';
import { cn } from '@/lib/utils';

const symptomIcons: Record<keyof typeof SYMPTOM_CATEGORIES, React.ElementType> = {
    GI: HeartPulse,
    SKIN: Sparkles,
    RESPIRATORY: Wind,
    NEUROLOGICAL: BrainCircuit,
    ENERGY_MOOD: BatteryCharging,
    SLEEP: BedDouble,
};

const wellbeingMap = {
    1: { label: 'Malissimo', color: 'bg-red-500' },
    2: { label: 'Male', color: 'bg-orange-500' },
    3: { label: 'Normale', color: 'bg-gray-500' },
    4: { label: 'Bene', color: 'bg-green-500' },
}

export function DayDetailsSheet({ open, onOpenChange, log }: { open: boolean, onOpenChange: (open: boolean) => void, log: DayLog }) {
  if (!log) return null;

  const dayDate = parseISO(log.date);
  const { label, color } = wellbeingMap[log.wellbeing];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[350px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
             {format(dayDate, 'EEEE, d MMMM yyyy', { locale: it })}
             <Badge className={cn("text-white", color)}>{label}</Badge>
          </SheetTitle>
          {log.notes && <SheetDescription className="pt-2 text-left">"{log.notes}"</SheetDescription>}
        </SheetHeader>
        <div className="py-4 space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Sintomi</h3>
                {log.symptoms.length > 0 ? (
                    <div className="space-y-2">
                        {log.symptoms.map(symptom => {
                            const Icon = symptomIcons[symptom.category];
                            return (
                                <div key={symptom.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-5 w-5 text-primary" />
                                        <span>{SYMPTOM_CATEGORIES[symptom.category]}</span>
                                    </div>
                                    <Badge variant="secondary">Intensità: {symptom.intensity}/3</Badge>
                                </div>
                            )
                        })}
                    </div>
                ) : <p className="text-sm text-muted-foreground">Nessun sintomo registrato.</p>}
            </div>

            <div>
                 <h3 className="text-lg font-semibold mb-2">Pasti</h3>
                 {log.meals.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {log.meals.map(meal => (
                            <AccordionItem key={meal.id} value={meal.id}>
                                <AccordionTrigger>
                                    <div className="flex justify-between w-full pr-4">
                                        <span className="font-semibold capitalize">{meal.type}</span>
                                        <span className="text-muted-foreground">{meal.time}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p className="italic text-muted-foreground mb-4">"{meal.description}"</p>
                                    {meal.analysis ? (
                                        <div className="space-y-2 text-sm">
                                            <p><strong>Ingredienti:</strong> {meal.analysis.ingredients.join(', ')}</p>
                                            <div className="flex gap-4">
                                                <span><strong>Carb:</strong> {meal.analysis.macros.carbohydrates}g</span>
                                                <span><strong>Pro:</strong> {meal.analysis.macros.protein}g</span>
                                                <span><strong>Fat:</strong> {meal.analysis.macros.fat}g</span>
                                            </div>
                                            {meal.analysis.allergens.length > 0 && <p><strong>Allergeni:</strong> <span className="font-semibold text-red-600">{meal.analysis.allergens.join(', ')}</span></p>}
                                        </div>
                                    ) : <p className="text-sm text-muted-foreground">Analisi non disponibile.</p>}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                 ): <p className="text-sm text-muted-foreground">Nessun pasto registrato.</p>}
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
