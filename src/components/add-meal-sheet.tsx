'use client'

import * as React from 'react'
import { useForm, useFormState } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { PlusCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { upsertDayLog } from '@/lib/actions'
import { MEAL_TYPES, Meal } from '@/lib/types'

const addMealSchema = z.object({
  date: z.string().min(1, 'La data è obbligatoria.'),
  time: z.string().min(1, "L'orario è obbligatorio."),
  mealType: z.string().min(1, 'Il tipo di pasto è obbligatorio.'),
  description: z.string().min(3, 'La descrizione è troppo corta.'),
})

function SubmitButton() {
  const { isSubmitting } = useFormState()
  return (
    <Button type="submit" disabled={isSubmitting} className="w-full">
      {isSubmitting ? 'Aggiungendo...' : 'Aggiungi Pasto'}
    </Button>
  )
}

export function AddMealSheet({
  date,
  onMealAdded,
}: {
  date: string
  onMealAdded?: () => void
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof addMealSchema>>({
    resolver: zodResolver(addMealSchema),
    defaultValues: {
      date: date,
      time: format(new Date(), 'HH:mm'),
      mealType: 'snack',
      description: '',
    },
  })

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        date: date,
        time: format(new Date(), 'HH:mm'),
        mealType: 'snack',
        description: '',
      })
    }
  }, [isOpen, date, form])

  const onSubmit = async (values: z.infer<typeof addMealSchema>) => {
    const meal: Omit<Meal, 'analysis' | 'id'> = {
      description: values.description,
      time: `${values.date}T${values.time}`,
      type: values.mealType,
    }

    const result = await upsertDayLog(values.date, { meal })

    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: result.message,
      })
    } else {
      toast({
        title: 'Successo!',
        description: 'Il tuo pasto è stato salvato correttamente.',
      })
      if (onMealAdded) {
        onMealAdded() // Call the callback on success
      }
      setIsOpen(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Aggiungi Pasto
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Aggiungi Pasto</SheetTitle>
          <SheetDescription>
            Descrivi cosa hai mangiato. L'IA analizzerà ingredienti e macro per
            te.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <input type="hidden" {...form.register('date')} />

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
            <FormField
              control={form.control}
              name="mealType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo di pasto</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MEAL_TYPES.map((type) => (
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
  )
}
