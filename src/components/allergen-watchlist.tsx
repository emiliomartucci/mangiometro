'use client';

import * as React from 'react';
import { X, PlusCircle, Loader2, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getAllergenWatchlist, updateAllergenWatchlist } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { commonAllergens } from '@/lib/common-allergens'; // We will create this file next

export function AllergenWatchlist() {
    const [watchlist, setWatchlist] = React.useState<string[]>([]);
    const [newItem, setNewItem] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const { toast } = useToast();

    React.useEffect(() => {
        const fetchWatchlist = async () => {
            setIsLoading(true);
            const list = await getAllergenWatchlist();
            setWatchlist(list);
            setIsLoading(false);
        };
        fetchWatchlist();
    }, []);

    const handleAddItem = () => {
        if (newItem && !watchlist.includes(newItem)) {
            setWatchlist([...watchlist, newItem.trim()]);
            setNewItem('');
        }
    };

    const handleRemoveItem = (itemToRemove: string) => {
        setWatchlist(watchlist.filter(item => item !== itemToRemove));
    };
    
    // New function to load the common allergens
    const handleLoadCommon = () => {
        // Use a Set to avoid duplicates if some are already present
        const combined = new Set([...watchlist, ...commonAllergens]);
        setWatchlist(Array.from(combined).sort());
         toast({
            title: 'Lista caricata!',
            description: 'La lista di allergeni comuni è stata caricata. Ricordati di salvare.',
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        const result = await updateAllergenWatchlist(watchlist);
        if (result.success) {
            toast({
                title: 'Successo!',
                description: 'La tua watchlist di allergeni è stata salvata.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Errore',
                description: result.message || 'Impossibile salvare la watchlist.',
            });
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Allergeni da Monitorare</CardTitle>
                    <CardDescription>Caricamento...</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Allergeni da Monitorare</CardTitle>
                <CardDescription>
                    Aggiungi qui gli allergeni o le sostanze che vuoi tenere sotto controllo. 
                    L'IA li userà per darti analisi più accurate.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Es. Nichel, Lattosio..."
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); }}}
                    />
                    <Button onClick={handleAddItem} variant="outline" size="icon" aria-label="Aggiungi">
                        <PlusCircle className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2 border p-4 rounded-md min-h-[100px]">
                    {watchlist.length > 0 ? watchlist.map(item => (
                        <Badge key={item} variant="secondary" className="text-md py-1">
                            {item}
                            <div role="button" onClick={() => handleRemoveItem(item)} className="ml-2 rounded-full hover:bg-destructive/20 p-0.5" aria-label={`Rimuovi ${item}`}>
                                <X className="h-3 w-3" />
                            </div>
                        </Badge>
                    )) : <p className="text-sm text-muted-foreground">La tua watchlist è vuota.</p>}
                </div>
                
                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salva Watchlist
                    </Button>
                     <Button onClick={handleLoadCommon} variant="outline">
                        <ListPlus className="mr-2 h-4 w-4" />
                        Carica lista comune
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
