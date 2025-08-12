import { getLogs } from '@/lib/data';
import { CalendarView } from '@/components/calendar-view';
import { RateDaySheet } from '@/components/rate-day-sheet';
import { AddMealSheet } from '@/components/add-meal-sheet';
import { BottomNav } from '@/components/bottom-nav';
import { format } from 'date-fns';

export default async function HomePage() {
  const logs = await getLogs();
  const today = format(new Date(), 'yyyy-MM-dd');
  const logForToday = logs.find(l => l.date === today);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <h1 className="text-4xl font-bold font-headline text-primary">
          GiornoBene
        </h1>
        <p className="text-muted-foreground">Il tuo diario di benessere quotidiano.</p>
      </header>

      <main className="flex-1 p-4 mb-16">
        <CalendarView logs={logs} />
      </main>

      <div className="fixed bottom-24 right-4 flex flex-col items-center gap-4 z-20">
        <RateDaySheet date={today} log={logForToday} />
        <AddMealSheet />
      </div>

      <BottomNav />
    </div>
  );
}
