// src/app/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

// This component will be automatically shown by Next.js while the page data is loading.
export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <h1 className="text-4xl font-bold font-headline text-primary">
          Calendario
        </h1>
        <p className="text-muted-foreground">Tieni traccia del tuo benessere giorno per giorno.</p>
      </header>
      <main className="flex-1 p-4 mb-20">
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                </div>
            </div>
            {/* Calendar Skeleton */}
            <div className="grid grid-cols-7 text-center text-sm font-medium text-muted-foreground">
                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
                    <div key={day} className="py-2"><Skeleton className="h-5 w-8 mx-auto" /></div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-md" />
                ))}
            </div>
        </div>
      </main>
      {/* We don't need to show the full BottomNav skeleton, the page loads fast enough */}
    </div>
  );
}
