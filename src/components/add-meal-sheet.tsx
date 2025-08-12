'use client';

import * as React from 'react';
import { useForm, useFormState } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { addMealAction } from '@/lib/actions';
import { MEAL_TYPES } from '@/lib/types';

const addMealSchema = z.object({
  date: z.string(),
  time: z.string(),
  mealType: z.string(),
  description: z.string().min(3, 'La descrizione è troppo corta.'),
});

function SubmitButton() {
  const { isSubmitting } = useFormState();
  return (
    <Button type="submit" disabled={isSubmitting} className="w-full">
      {isSubmitting ? 'Aggiungendo...' : 'Aggiungi Pasto'}
    </Button>
  );
}

export function AddMealSheet() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof addMealSchema>>({
    resolver: zodResolver(addMealSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      mealType: 'snack',
      description: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof addMealSchema>) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const result = await addMealAction(formData);

    if (result?.error) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: result.error,
      });
    } else {
      toast({
        title: 'Successo!',
        description: 'Pasto aggiunto e analizzato con successo.',
      });
      form.reset();
      setIsOpen(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="icon" className="rounded-full h-14 w-14 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
          <Plus className="h-6 w-6" />
          <span className="sr-only">Aggiungi Pasto</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Aggiungi Pasto</SheetTitle>
          <SheetDescription>
            Descrivi cosa hai mangiato. L'IA analizzerà ingredienti e macro per te.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orario</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="mealType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo di pasto</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MEAL_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione del pasto</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Es. 200g yogurt greco con miele e noci; pane integrale"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SheetFooter className="pt-4">
              <SubmitButton />
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
