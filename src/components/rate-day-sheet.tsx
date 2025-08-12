'use client';

import * as React from 'react';
import { useForm, useFieldArray, useFormState } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Smile, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { rateDayAction } from '@/lib/actions';
import { DayLog, SYMPTOM_CATEGORIES, SymptomCategory } from '@/lib/types';
import { Input } from './ui/input';

const wellbeingOptions = [
  { value: 4, label: 'Bene' },
  { value: 3, label: 'Normale' },
  { value: 2, label: 'Male' },
  { value: 1, label: 'Malissimo' },
];

const intensityOptions = [
  { value: 1, label: 'Leggera' },
  { value: 2, label: 'Media' },
  { value: 3, label: 'Forte' },
];

const rateDaySchema = z.object({
  date: z.string(),
  wellbeing: z.string(),
  symptoms: z.array(z.object({
    category: z.string(),
    intensity: z.string(),
  })),
  notes: z.string().optional(),
});

type RateDayFormValues = z.infer<typeof rateDaySchema>;

function SubmitButton() {
  const { isSubmitting } = useFormState();
  return (
    <Button type="submit" disabled={isSubmitting} className="w-full">
      {isSubmitting ? 'Salvando...' : 'Salva Valutazione'}
    </Button>
  );
}

export function RateDaySheet({ date, log }: { date: string, log?: DayLog }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<RateDayFormValues>({
    resolver: zodResolver(rateDaySchema),
    defaultValues: {
      date: date,
      wellbeing: log?.wellbeing.toString() ?? "3",
      symptoms: log?.symptoms.map(s => ({ category: s.category, intensity: s.intensity.toString() })) ?? [],
      notes: log?.notes ?? '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'symptoms',
  });

  const onSubmit = async (values: RateDayFormValues) => {
    const formData = new FormData();
    formData.append('date', values.date);
    formData.append('wellbeing', values.wellbeing);
    formData.append('notes', values.notes || '');
    values.symptoms.forEach((symptom, index) => {
      formData.append(`symptoms.${index}.category`, symptom.category);
      formData.append(`symptoms.${index}.intensity`, symptom.intensity);
    });

    const result = await rateDayAction(formData);

    if (result?.error) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: result.error,
      });
    } else {
      toast({
        title: 'Successo!',
        description: 'La tua valutazione è stata salvata.',
      });
      setIsOpen(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="icon" className="rounded-full h-14 w-14 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg">
          <Smile className="h-6 w-6" />
          <span className="sr-only">Valuta la giornata</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Come ti senti oggi?</SheetTitle>
          <SheetDescription>
            Valuta la tua giornata e aggiungi eventuali sintomi o note.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="wellbeing"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Valutazione generale</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {wellbeingOptions.map(opt => (
                        <FormItem key={opt.value} className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={opt.value.toString()} />
                          </FormControl>
                          <FormLabel className="font-normal">{opt.label}</FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Sintomi</FormLabel>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-end">
                    <FormField
                      control={form.control}
                      name={`symptoms.${index}.category`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(SYMPTOM_CATEGORIES).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name={`symptoms.${index}.intensity`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Intensità" /></SelectTrigger>
                            </FormControl>
                             <SelectContent>
                              {intensityOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
               <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => append({ category: 'GI', intensity: '1' })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Aggiungi Sintomo
                </Button>
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note aggiuntive</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Scrivi qui le tue note..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <input type="hidden" {...form.register('date')} />

            <SheetFooter className="pt-4">
              <SubmitButton />
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
