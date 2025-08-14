// src/app/page.tsx
import { CalendarView } from '@/components/calendar-view';
import { BottomNav } from '@/components/bottom-nav';
import { FunFactBox } from '@/components/fun-fact-box';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <h1 className="text-4xl font-bold font-headline text-primary">
          Mangiometro
        </h1>
        <p className="text-muted-foreground">Il tuo diario alimentare intelligente.</p>
      </header>

      <main className="flex-1 p-4 mb-20">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main content area for the calendar */}
          <div className="lg:flex-grow">
            <CalendarView />
          </div>

          {/* Sidebar area for the fun fact box */}
          <div className="lg:w-80 lg:shrink-0">
            <FunFactBox />
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
