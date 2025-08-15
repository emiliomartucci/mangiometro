'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Utensils, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger,
} from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { addMealToLog } from '@/data/logs';
import { Meal, MealAnalysis } from '@/lib/types';
import { parse } from 'date-fns';
import { getAllergenWatchlist } from '@/data/settings';
import { commonAllergens } from '@/lib/common-allergens';

const mealSchema = z.object({
  type: z.string().min(1, 'Tipo di pasto richiesto.'),
  description: z.string().min(3, 'Descrizione troppo corta.').max(500, 'Descrizione troppo lunga.'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato ora non valido (HH:mm).'),
});
type MealFormValues = z.infer<typeof mealSchema>;

async function getMealAnalysis(description: string, toast: (options: any) => void): Promise<MealAnalysis | undefined> {
  try {
    const watchlist = await getAllergenWatchlist();
    const prompt = `
      Sei un esperto nutrizionista. Analizza la seguente descrizione di un pasto: "${description}".
      Contesto:
      - Allergeni comuni da considerare: ${commonAllergens.join(', ')}.
      - Watchlist personale utente: ${watchlist.length > 0 ? watchlist.join(', ') : 'Nessuna'}.
      Istruzioni:
      1. Identifica ingredienti e potenziali allergeni.
      2. Se un allergene della WATCHLIST è presente, DEVE essere incluso.
      3. Fornisci stima macronutrienti.
      4. Restituisci ESCLUSIVAMENTE un blocco JSON con: {"ingredients": [], "allergens": [{"name": "", "reason": ""}], "macros": {"carbohydrates": 0, "protein": 0, "fat": 0}}
    `;
    const response = await fetch('/api/ai/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
    if (!response.ok) throw new Error('API request failed');
    const { text } = await response.json();
    if (!text) throw new Error("AI returned empty text");
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) throw new Error("Could not find JSON in AI response");
    const jsonString = text.substring(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonString) as MealAnalysis;
  } catch (error) {
    console.error("Failed to get or parse meal analysis:", error);
    toast({ title: "Errore Analisi AI", description: "Pasto salvato senza dettagli.", variant: "destructive" });
    return undefined;
  }
}

export function AddMealSheet({ date, onDataChange }: { date: string, onDataChange: () => void }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<MealFormValues>({
    resolver: zodResolver(mealSchema),
    defaultValues: { type: '', description: '', time: new Date().toTimeString().substring(0, 5) },
  });

  const onSubmit = async (values: MealFormValues) => {
    const dateObj = parse(date, 'yyyy-MM-dd', new Date());
    const [hours, minutes] = values.time.split(':').map(Number);
    const mealTime = new Date(dateObj);
    mealTime.setHours(hours, minutes);
    
    const analysis = await getMealAnalysis(values.description, toast);
    const newMeal: Omit<Meal, 'id'> = {
      type: values.type as Meal['type'],
      description: values.description,
      time: mealTime.toISOString(),
    };
    if (analysis) { newMeal.analysis = analysis; }

    await addMealToLog(date, newMeal);
    toast({ title: 'Successo!', description: 'Pasto aggiunto correttamente.' });
    onDataChange();
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button className="w-full"><Utensils className="mr-2 h-4 w-4" /> Aggiungi Pasto</Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Aggiungi un nuovo pasto</SheetTitle>
          <SheetDescription>Descrivi cosa hai mangiato. Verrà analizzato dall'IA.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="add-meal-form" className="flex-1 overflow-y-auto space-y-4 py-4 pr-6">
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="breakfast">Colazione</SelectItem><SelectItem value="lunch">Pranzo</SelectItem><SelectItem value="dinner">Cena</SelectItem><SelectItem value="snack">Spuntino</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrizione</FormLabel><FormControl><Textarea placeholder="Es. Pasta al pesto con fagiolini..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="time" render={({ field }) => (<FormItem><FormLabel>Ora</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </form>
        </Form>
        <SheetFooter className="pt-4 border-t">
          <Button type="submit" form="add-meal-form" disabled={form.formState.isSubmitting} className="w-full">
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {form.formState.isSubmitting ? 'Analizzando...' : 'Aggiungi Pasto'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
