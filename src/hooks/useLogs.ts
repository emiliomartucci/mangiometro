'use client';
import { useEffect, useState } from 'react';
import { watchLogsByMonth } from '@/data/logs';
import { DayLog } from '@/lib/types';

export function useLogs(year: number, month: number) {
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    // watchLogsByMonth ora restituisce direttamente la funzione di unsubscribe.
    const unsubscribe = watchLogsByMonth(year, month, (newLogs) => {
      setLogs(newLogs);
      setIsLoading(false); // Imposta il caricamento a false quando i dati arrivano.
    });

    // La funzione di cleanup di useEffect chiamerà unsubscribe quando
    // il componente viene smontato o le dipendenze cambiano.
    return () => unsubscribe();
    
  }, [year, month]); // L'effetto si riattiva solo se anno o mese cambiano.

  return { logs, isLoading };
}
