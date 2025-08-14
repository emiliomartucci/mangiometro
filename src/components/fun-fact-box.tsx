// src/components/fun-fact-box.tsx
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FunFactContext } from '@/contexts/fun-fact-context';

// This is the new provider component that holds all the logic
export function FunFactBox() {
    const [funFact, setFunFact] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    // The fetch function is now defined in the provider itself.
    const fetchFunFact = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/fun-fact');
            if (!response.ok) throw new Error('Failed to fetch fun fact');
            const data = await response.json();
            setFunFact(data.funFact);
        } catch (error) {
            console.error(error);
            toast({
                title: 'Errore AI',
                description: 'Impossibile generare un nuovo fun fact.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    // Fetch the first fact on component mount
    React.useEffect(() => {
        fetchFunFact();
    }, [fetchFunFact]);

    return (
        // The provider now passes the actual fetch function down
        <FunFactContext.Provider value={{ refreshFunFact: fetchFunFact }}>
            <Card className="shadow-lg relative">
                <CardHeader>
                    <CardTitle className="font-headline text-lg text-primary flex items-center justify-between">
                    <span>Curiosità del Giorno</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={fetchFunFact} // The button calls the function directly
                        disabled={isLoading}
                        aria-label="Aggiorna fun fact"
                    >
                        <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                    </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                    ) : (
                    <p className="text-sm text-muted-foreground">{funFact}</p>
                    )}
                </CardContent>
            </Card>
        </FunFactContext.Provider>
    );
}
