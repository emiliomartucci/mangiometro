'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SmilePlus, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger,
} from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { updateLogRating } from '@/data/logs';
import { DayLog, Symptom, SYMPTOM_CATEGORIES } from '@/lib/types';

const rateDaySchema = z.object({
  wellbeingRating: z.string().min(1, 'Devi selezionare una valutazione.'),
  symptoms: z.array(z.object({
    category: z.string().min(1, 'Categoria richiesta.'),
    intensity: z.string().min(1, 'Intensità richiesta.'),
  })),
});
type RateDayFormValues = z.infer<typeof rateDaySchema>;

const wellbeingOptions = [
  { value: '5', label: 'Molto bene' }, { value: '4', label: 'Bene' }, { value: '3', label: 'Normale' },
  { value: '2', label: 'Male' }, { value: '1', label: 'Malissimo' },
];
const intensityOptions = [
    { value: '1', label: 'Leggera' }, { value: '2', label: 'Media' }, { value: '3', label: 'Forte' },
];

export function RateDaySheet({ log, onDataChange }: { log: DayLog, onDataChange: () => void }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<RateDayFormValues>({
    resolver: zodResolver(rateDaySchema),
    defaultValues: {
      wellbeingRating: log.wellbeingRating?.toString() ?? '',
      symptoms: log.symptoms?.map(s => ({ category: s.category, intensity: s.intensity.toString() })) || [],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'symptoms' });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        wellbeingRating: log.wellbeingRating?.toString() ?? '',
        symptoms: log.symptoms?.map(s => ({ category: s.category, intensity: s.intensity.toString() })) || [],
      });
    }
  }, [isOpen, log, form]);

  const onSubmit = async (values: RateDayFormValues) => {
    const rating = parseInt(values.wellbeingRating, 10);
    const symptoms: Symptom[] = values.symptoms.map(s => ({
        category: s.category as keyof typeof SYMPTOM_CATEGORIES,
        intensity: parseInt(s.intensity, 10)
    }));
    await updateLogRating(log.date, rating, symptoms);
    toast({ title: 'Successo!', description: 'Valutazione salvata.' });
    onDataChange();
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full"><SmilePlus className="mr-2 h-4 w-4" /> Valuta Giornata</Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Come ti sei sentito?</SheetTitle>
          <SheetDescription>Aggiorna la tua valutazione e aggiungi eventuali sintomi.</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="rate-day-form" className="flex-1 overflow-y-auto space-y-6 py-4 pr-6">
            <FormField
              control={form.control} name="wellbeingRating"
              render={({ field }) => (
                <FormItem><FormLabel>Valutazione generale</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">{wellbeingOptions.map(opt => (<FormItem key={opt.value} className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value={opt.value} /></FormControl><FormLabel className="font-normal">{opt.label}</FormLabel></FormItem>))}</RadioGroup></FormControl></FormItem>
              )}
            />
            <div>
              <FormLabel>Sintomi</FormLabel>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <FormField control={form.control} name={`symptoms.${index}.category`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Categoria</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger></FormControl><SelectContent>{Object.entries(SYMPTOM_CATEGORIES).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}</SelectContent></Select></FormItem>)} />
                      <FormField control={form.control} name={`symptoms.${index}.intensity`} render={({ field }) => (<FormItem><FormLabel className="text-xs">Intensità</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger></FormControl><SelectContent>{intensityOptions.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent></Select></FormItem>)} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ category: '', intensity: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Sintomo</Button>
            </div>
          </form>
        </Form>
        <SheetFooter className="pt-4 border-t">
            <Button type="submit" form="rate-day-form" disabled={form.formState.isSubmitting} className="w-full">
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {form.formState.isSubmitting ? 'Salvando...' : 'Salva Valutazione'}
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
