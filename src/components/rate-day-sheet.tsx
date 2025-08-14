'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFormState, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SmilePlus, PlusCircle, Trash2 } from 'lucide-react'

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { upsertDayLog } from '@/lib/actions'
import { DayLog, Symptom, SYMPTOM_CATEGORIES } from '@/lib/types'

// Updated schema to include symptoms
const rateDaySchema = z.object({
  date: z.string(),
  wellbeingRating: z.string().min(1, 'Devi selezionare una valutazione.'),
  symptoms: z.array(
    z.object({
      category: z.string().min(1, 'Categoria richiesta.'),
      intensity: z.string().min(1, 'Intensità richiesta.'),
    })
  ),
})

type RateDayFormValues = z.infer<typeof rateDaySchema>

const wellbeingOptions = [
  { value: '5', label: 'Molto bene' },
  { value: '4', label: 'Bene' },
  { value: '3', label: 'Normale' },
  { value: '2', label: 'Male' },
  { value: '1', label: 'Malissimo' },
]

const intensityOptions = [
    { value: '1', label: 'Leggera' },
    { value: '2', label: 'Media' },
    { value: '3', label: 'Forte' },
]

function SubmitButton() {
  const { isSubmitting } = useFormState()
  return (
    <Button type="submit" disabled={isSubmitting} className="w-full">
      {isSubmitting ? 'Salvando...' : 'Salva Valutazione'}
    </Button>
  )
}

export function RateDaySheet({ log }: { log: DayLog }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<RateDayFormValues>({
    resolver: zodResolver(rateDaySchema),
    defaultValues: {
      date: log.date,
      wellbeingRating: log.wellbeingRating?.toString() ?? '3',
      symptoms: log.symptoms?.map(s => ({
          category: s.category,
          intensity: s.intensity.toString()
      })) || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'symptoms',
  })
  
  React.useEffect(() => {
    form.reset({
        date: log.date,
        wellbeingRating: log.wellbeingRating?.toString() ?? '3',
        symptoms: log.symptoms?.map(s => ({ category: s.category, intensity: s.intensity.toString() })) || [],
    });
  }, [isOpen, log, form]);


  const onSubmit = async (values: RateDayFormValues) => {
    const rating = parseInt(values.wellbeingRating, 10)
    const symptoms: Symptom[] = values.symptoms.map(s => ({
        category: s.category as keyof typeof SYMPTOM_CATEGORIES,
        intensity: parseInt(s.intensity, 10)
    }))

    const result = await upsertDayLog(values.date, { wellbeingRating: rating, symptoms })

    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: result.message,
      })
    } else {
      toast({
        title: 'Successo!',
        description: 'La tua valutazione è stata salvata.',
      })
      router.refresh()
      setIsOpen(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full">
          <SmilePlus className="mr-2 h-4 w-4" />
          Valuta Giornata
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Come ti sei sentito?</SheetTitle>
          <SheetDescription>
            Aggiorna la tua valutazione e aggiungi eventuali sintomi.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 flex-1 overflow-y-auto pr-4">
            <input type="hidden" {...form.register('date')} />
            
            <FormField
              control={form.control}
              name="wellbeingRating"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Valutazione generale</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                      {wellbeingOptions.map((opt) => (
                        <FormItem key={opt.value} className="flex items-center space-x-3 space-y-0">
                          <FormControl><RadioGroupItem value={opt.value} /></FormControl>
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
                  <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <FormField
                        control={form.control}
                        name={`symptoms.${index}.category`}
                        render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Categoria</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger></FormControl>
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
                          <FormItem><FormLabel className="text-xs">Intensità</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Seleziona..." /></SelectTrigger></FormControl>
                               <SelectContent>
                                {intensityOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ category: '', intensity: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Aggiungi Sintomo
              </Button>
            </div>
            
            <SheetFooter className="pt-4 bg-background sticky bottom-0">
              <SubmitButton />
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
