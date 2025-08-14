export const dynamic = 'force-dynamic';

import { NewDashboardView } from '@/components/new-dashboard-view';
import { BottomNav } from '@/components/bottom-nav';

export default function DashboardPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
             <header className="p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <h1 className="text-4xl font-bold font-headline text-primary">
                Dashboard
                </h1>
                <p className="text-muted-foreground">Analizza i tuoi progressi e scopri nuovi spunti.</p>
            </header>
            <main className="flex-1 p-4 mb-20">
               <NewDashboardView />
            </main>
            <BottomNav />
        </div>
    )
}
