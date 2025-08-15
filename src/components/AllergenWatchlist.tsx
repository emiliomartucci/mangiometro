'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// Corrected the import to use the correct casing
import { commonAllergens } from '@/lib/common-allergens';
import { getAllergenWatchlist, updateAllergenWatchlist } from '@/data/settings';

export function AllergenWatchlist() {
    const [watchlist, setWatchlist] = React.useState<string[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [newItem, setNewItem] = React.useState('');
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

    const handleSave = async (newList: string[]) => {
        setIsSaving(true);
        const result = await updateAllergenWatchlist(newList);
        if (result.success) {
            setWatchlist(newList);
            toast({ title: 'Watchlist aggiornata.' });
        } else {
            toast({
                variant: 'destructive',
                title: 'Errore',
                description: result.message || 'Impossibile aggiornare la watchlist.',
            });
        }
        setIsSaving(false);
    };

    const handleAdd = () => {
        if (newItem && !watchlist.includes(newItem)) {
            handleSave([...watchlist, newItem]);
            setNewItem('');
        }
    };

    const handleRemove = (itemToRemove: string) => {
        handleSave(watchlist.filter((item) => item !== itemToRemove));
    };
    
    // Corrected the usage to use the correct casing
    const availableSuggestions = commonAllergens.filter(
      (allergen) => !watchlist.includes(allergen) && allergen.toLowerCase().startsWith(newItem.toLowerCase())
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Watchlist Allergeni</CardTitle>
                <CardDescription>
                    Aggiungi allergeni che sospetti possano causarti problemi. Questi verranno usati in future analisi AI.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <div className="flex flex-wrap gap-2">
                        {watchlist.map((item) => (
                            <Badge key={item} variant="secondary" className="text-lg">
                                {item}
                                <button onClick={() => handleRemove(item)} className="ml-2 rounded-full hover:bg-destructive/80 p-0.5">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
                 <div className="w-full">
                    <div className="flex w-full max-w-sm items-center space-x-2">
                      <Input
                          type="text"
                          placeholder="Nuovo allergene..."
                          value={newItem}
                          onChange={(e) => setNewItem(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                      />
                      <Button onClick={handleAdd} disabled={isSaving || !newItem}>
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aggiungi'}
                      </Button>
                    </div>
                     {newItem && availableSuggestions.length > 0 && (
                      <div className="mt-2 border rounded-md max-h-32 overflow-y-auto w-full max-w-sm">
                          {availableSuggestions.slice(0, 5).map(item => (
                              <div 
                                  key={item} 
                                  onClick={() => {
                                      handleSave([...watchlist, item]);
                                      setNewItem('');
                                  }}
                                  className="p-2 cursor-pointer hover:bg-accent"
                              >
                                  {item}
                              </div>
                          ))}
                      </div>
                    )}
                 </div>
            </CardFooter>
        </Card>
    );
}
