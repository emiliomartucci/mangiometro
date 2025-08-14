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
import { FunFactContext } from '@/contexts/fun-fact-context' // Import the context

// ... (schema and options remain the same)
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
  // Consume the context to get the refresh function
  const { refreshFunFact } = React.useContext(FunFactContext)

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
      
      // THE FIX: Trigger the fun fact refresh!
      refreshFunFact();

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
            {/* The form JSX is unchanged and omitted for brevity */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 flex-1 overflow-y-auto pr-4">
                {/* ... form fields ... */}
                <SheetFooter className="pt-4 bg-background sticky bottom-0">
                    <SubmitButton />
                </SheetFooter>
            </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
