'use client';
import * as React from 'react';
import { useLogs } from '@/hooks/useLogs';
import { CalendarView } from './CalendarView';
import { DayDetailsSheet } from './DayDetailsSheet';
import { DayLog } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AllergenWatchlist } from './AllergenWatchlist';
import { MoodDashboard } from './MoodDashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const now = React.useMemo(() => new Date(), []);
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  
  // L'hook ora restituisce sia i log che lo stato di caricamento
  const { logs, isLoading } = useLogs(year, month);
  
  const [selectedLog, setSelectedLog] = React.useState<DayLog | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  
  const forceRefresh = () => {
    // Il refresh ora è gestito automaticamente dall'hook in tempo reale.
    // Questa funzione può rimanere per eventuali refresh manuali futuri se necessario.
  };

  const handleDayClick = (log: DayLog) => {
    setSelectedLog(log);
    setIsSheetOpen(true);
  };

  const handleSheetChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setSelectedLog(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline text-primary">Mangiometro</h1>
        <p className="text-muted-foreground">Registra pasti e sintomi per scoprire correlazioni.</p>
      </div>
      
      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
          <TabsTrigger value="dashboard">Riepilogo</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist Allergeni</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="mt-4">
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <CalendarView
              logs={logs}
              onDayClick={handleDayClick}
              currentDate={new Date(year, month - 1)}
              setCurrentDate={(date) => {
                setYear(date.getFullYear());
                setMonth(date.getMonth() + 1);
              }}
            />
          )}
        </TabsContent>
        
        <TabsContent value="dashboard" className="mt-4">
          <MoodDashboard logs={logs} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="watchlist" className="mt-4">
          <AllergenWatchlist />
        </TabsContent>
      </Tabs>

      {selectedLog && (
        <DayDetailsSheet
          open={isSheetOpen}
          onOpenChange={handleSheetChange}
          log={selectedLog}
          onDataChange={forceRefresh}
        />
      )}
    </div>
  );
}
