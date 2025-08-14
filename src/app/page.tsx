// src/app/page.tsx
import { getMonthDayLogs } from '@/lib/actions';
import { CalendarView } from '@/components/calendar-view';
import { BottomNav } from '@/components/bottom-nav';

// By making this an async component, Next.js knows to wait for data fetching.
// The `loading.tsx` file will be shown automatically during this time.
export default async function HomePage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() is 0-indexed
  
  // Fetch data on the server.
  const logs = await getMonthDayLogs(year, month);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <h1 className="text-4xl font-bold font-headline text-primary">
          Calendario
        </h1>
        <p className="text-muted-foreground">Tieni traccia del tuo benessere giorno per giorno.</p>
      </header>

      <main className="flex-1 p-4 mb-20">
        {/* Pass the server-fetched data down to the Client Component. */}
        <CalendarView initialLogs={logs} />
      </main>

      <BottomNav />
    </div>
  );
}
