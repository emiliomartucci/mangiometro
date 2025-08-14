'use client';

import * as React from 'react';
import { DayLog } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { subMonths, format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AllergenWatchlist } from '@/components/allergen-watchlist';
import { useToast } from '@/hooks/use-toast';

// Helper function to fetch logs from our API to avoid duplication
const fetchLogsForMonth = async (year: number, month: number): Promise<DayLog[]> => {
    const response = await fetch(`/api/logs?year=${year}&month=${month}`);
    if (!response.ok) {
        console.error(`Failed to fetch logs for ${year}-${month}`);
        // Return empty array on error to prevent crashes
        return []; 
    }
    return response.json();
};

type AllergenFrequency = { [allergen: string]: number };
type WellbeingStats = {
  count: number;
  allergenFrequency: AllergenFrequency;
};

const wellbeingMeta: { [key: number]: { label: string; color: string } } = {
    5: { label: 'Molto Bene', color: 'bg-blue-500' },
    4: { label: 'Bene', color: 'bg-green-500' },
    3: { label: 'Normale', color: 'bg-yellow-500' },
    2: { label: 'Male', color: 'bg-orange-500' },
    1: { label: 'Malissimo', color: 'bg-red-500' },
};

const analyzeLogs = (logs: DayLog[]): { [key: number]: WellbeingStats } => {
    const stats: { [key: number]: WellbeingStats } = {};
    const logsByDate = new Map(logs.map(log => [log.date, log]));
    for (const log of logs) {
        const rating = log.wellbeingRating;
        if (rating === 0) continue;
        if (!stats[rating]) {
            stats[rating] = { count: 0, allergenFrequency: {} };
        }
        stats[rating].count++;
        const datesToInspect = [log.date];
        const prevDayDate = new Date(log.date);
        prevDayDate.setDate(prevDayDate.getDate() - 1);
        const prevDay = format(prevDayDate, 'yyyy-MM-dd');

        if (logsByDate.has(prevDay)) {
            datesToInspect.push(prevDay);
        }
        for (const date of datesToInspect) {
            const currentLog = logsByDate.get(date);
            if (currentLog) {
                const meals = currentLog.meals || [];
                for (const meal of meals) {
                    if (meal.analysis?.allergens) {
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

const AllergenList = ({ frequency }: { frequency: AllergenFrequency }) => {
    const sortedAllergens = Object.entries(frequency).sort(([, a], [, b]) => b - a);
    if (sortedAllergens.length === 0) {
        return <p className="text-sm text-muted-foreground">Nessun allergene rilevato.</p>;
    }
    return (
        <div className="flex flex-wrap gap-2">
            {sortedAllergens.map(([allergen, count]) => (
                <Badge key={allergen} variant="secondary" className="text-sm">
                    {allergen} <span className="ml-2 font-semibold">{count}x</span>
                </Badge>
            ))}
        </div>
    );
};


export function NewDashboardView() {
    return (
        <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Riepilogo</TabsTrigger>
                <TabsTrigger value="watchlist">Watchlist Allergeni</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
                <DashboardOverview />
            </TabsContent>
            <TabsContent value="watchlist" className="mt-4">
                <AllergenWatchlist />
            </TabsContent>
        </Tabs>
    );
}

function DashboardOverview() {
    const { toast } = useToast();
    const [stats, setStats] = React.useState<{ [key: number]: WellbeingStats } | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchAndAnalyzeData = async () => {
            setIsLoading(true);
            try {
                const today = new Date();
                const lastMonth = subMonths(today, 1);
                
                // Fetch data for the current and previous month in parallel
                const [logsThisMonth, logsLastMonth] = await Promise.all([
                    fetchLogsForMonth(today.getFullYear(), today.getMonth() + 1),
                    fetchLogsForMonth(lastMonth.getFullYear(), lastMonth.getMonth() + 1)
                ]);
                
                // Deduplicate logs in case of overlap
                const allLogs = [...logsThisMonth, ...logsLastMonth].filter((log, index, self) => 
                    index === self.findIndex((t) => (t.id === log.id))
                );
                
                const analyzedStats = analyzeLogs(allLogs);
                setStats(analyzedStats);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
                toast({
                    title: "Errore",
                    description: "Impossibile caricare i dati della dashboard.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchAndAnalyzeData();
    }, [toast]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Riepilogo dell'Ultimo Mese</h2>
            {stats && Object.keys(stats).length > 0 ? (
                Object.entries(wellbeingMeta)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([rating, meta]) => {
                        const stat = stats[Number(rating)];
                        if (!stat) return null;
                        return (
                            <Card key={rating}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-4 h-4 rounded-full", meta.color)} />
                                            <span>{meta.label}</span>
                                        </div>
                                        <Badge className="text-lg">{stat.count} giorni</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <h4 className="font-semibold mb-2">Allergeni più Frequenti (giorno stesso e precedente):</h4>
                                    <AllergenList frequency={stat.allergenFrequency} />
                                </CardContent>
                            </Card>
                        )
                    })
            ) : (
                <p>Non ci sono abbastanza dati per generare un'analisi. Prova a registrare più giornate!</p>
            )}
        </div>
    );
}
