'use client';

import * as React from 'react';
import { DayLog, Meal } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format, subDays, parse } from 'date-fns';

// Definiamo la struttura dati per le nostre statistiche avanzate
type AllergenFrequency = { [allergenName: string]: number };
type WellbeingStats = {
  count: number;
  allergenFrequency: AllergenFrequency;
};

const wellbeingMeta: { [key: number]: { label: string; color: string } } = {
    5: { label: 'Giornate "Molto Bene"', color: 'bg-blue-500' },
    4: { label: 'Giornate "Bene"', color: 'bg-green-500' },
    3: { label: 'Giornate "Normali"', color: 'bg-yellow-500' },
    2: { label: 'Giornate "Male"', color: 'bg-orange-500' },
    1: { label: 'Giornate "Malissimo"', color: 'bg-red-500' },
};

// --- LA NUOVA, POTENTE FUNZIONE DI ANALISI ---
const analyzeCorrelations = (logs: DayLog[]): { [rating: number]: WellbeingStats } => {
  const stats: { [rating: number]: WellbeingStats } = {
    1: { count: 0, allergenFrequency: {} },
    2: { count: 0, allergenFrequency: {} },
    3: { count: 0, allergenFrequency: {} },
    4: { count: 0, allergenFrequency: {} },
    5: { count: 0, allergenFrequency: {} },
  };

  // 1. Creiamo una mappa per un accesso ultra-veloce ai log per data (O(1))
  const logsByDate = new Map(logs.map(log => [log.date, log]));

  // 2. Iteriamo su ogni log per analizzarlo
  for (const log of logs) {
    const rating = log.wellbeingRating;
    if (rating < 1 || rating > 5) continue; // Ignoriamo i giorni non valutati

    stats[rating].count++;

    // 3. Identifichiamo i giorni da ispezionare (oggi e ieri)
    const logsToInspect: DayLog[] = [log];
    const currentDateObj = parse(log.date, 'yyyy-MM-dd', new Date());
    const prevDateStr = format(subDays(currentDateObj, 1), 'yyyy-MM-dd');
    if (logsByDate.has(prevDateStr)) {
      logsToInspect.push(logsByDate.get(prevDateStr)!);
    }

    // 4. Estraiamo e contiamo gli allergeni dai pasti dei giorni identificati
    for (const inspectionLog of logsToInspect) {
      if (inspectionLog.meals && inspectionLog.meals.length > 0) {
        for (const meal of inspectionLog.meals) {
          if (meal.analysis && meal.analysis.allergens) {
            for (const allergen of meal.analysis.allergens) {
              const freq = stats[rating].allergenFrequency;
              freq[allergen.name] = (freq[allergen.name] || 0) + 1;
            }
          }
        }
      }
    }
  }
  return stats;
};

// --- Sub-componente per visualizzare la lista di allergeni ---
function AllergenFrequencyList({ frequency }: { frequency: AllergenFrequency }) {
    const sortedAllergens = Object.entries(frequency)
        .sort(([, a], [, b]) => b - a); // Ordina per frequenza, dal più alto al più basso

    if (sortedAllergens.length === 0) {
        return <p className="text-sm text-muted-foreground">Nessun allergene rilevato nei pasti associati.</p>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {sortedAllergens.map(([allergen, count]) => (
                <Badge key={allergen} variant="secondary" className="text-sm font-normal">
                    {allergen} <span className="ml-2 font-semibold bg-primary text-primary-foreground rounded-full px-1.5 text-xs">{count}x</span>
                </Badge>
            ))}
        </div>
    );
}


export function MoodDashboard({ logs, isLoading }: { logs: DayLog[], isLoading: boolean }) {
    const stats = React.useMemo(() => analyzeCorrelations(logs), [logs]);
    const totalRatedDays = logs.filter(l => l.wellbeingRating > 0).length;

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Riepilogo Correlazioni (Ultimo Mese)</h2>
            {totalRatedDays > 0 ? (
                Object.entries(wellbeingMeta)
                    .sort(([a], [b]) => Number(a) - Number(b)) // Ordina da "Malissimo" a "Molto Bene"
                    .map(([rating, meta]) => {
                        const stat = stats[Number(rating)];
                        if (stat.count === 0) return null; // Non mostrare card per valutazioni senza giorni
                        return (
                            <Card key={rating}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-5 h-5 rounded-full", meta.color)} />
                                            <span className="text-lg">{meta.label}</span>
                                        </div>
                                        <Badge className="text-lg">{stat.count} giorni</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <h4 className="font-semibold mb-2 text-muted-foreground">Allergeni più frequenti (nei pasti del giorno stesso e precedente):</h4>
                                    <AllergenFrequencyList frequency={stat.allergenFrequency} />
                                </CardContent>
                            </Card>
                        )
                    })
            ) : (
                <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground">Nessun dato di valutazione disponibile per generare un riepilogo.</p></CardContent></Card>
            )}
        </div>
    );
}
