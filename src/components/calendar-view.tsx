'use client';

import * as React from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  startOfMonth,
  format,
  isToday,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  parse,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayLog } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DayDetailsSheet } from './day-details-sheet';
import { getMonthDayLogs } from '@/lib/actions';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

const wellbeingColors: { [key: number]: string } = {
  1: 'bg-red-400',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-green-400',
  5: 'bg-blue-400',
};

export function CalendarView({ initialLogs }: { initialLogs: DayLog[] }) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [logs, setLogs] = React.useState<DayLog[]>(initialLogs || []);
  const [selectedLog, setSelectedLog] = React.useState<DayLog | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  
  // **DEFINITIVE FIX**: Handle potential errors from date-fns in weird environments
  let daysInMonth = [];
  try {
    daysInMonth = eachDayOfInterval({
      start: startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }),
      end: endOfWeek(lastDayOfMonth, { weekStartsOn: 1 }),
    });
  } catch (error) {
    console.error("Could not generate days for the month", error);
    // Fallback to an empty array to prevent crash
    daysInMonth = [];
  }


  React.useEffect(() => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      getMonthDayLogs(year, month).then(newLogs => setLogs(newLogs || []));
  }, [currentDate]);
  
  const handleDayClick = (day: Date) => {
    let logForDay = logs.find(log => isSameDay(parse(log.date, 'yyyy-MM-dd', new Date()), day));
    
    if (!logForDay) {
        logForDay = {
            id: '',
            userId: 'anonymous',
            date: format(day, 'yyyy-MM-dd'),
            wellbeingRating: 0,
            symptoms: [],
            meals: [],
            createdAt: new Date().toISOString(),
        };
    }
    
    setSelectedLog(logForDay);
    setIsSheetOpen(true);
  };

  const handleSheetChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setSelectedLog(null);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      getMonthDayLogs(year, month).then(newLogs => setLogs(newLogs || []));
    }
  };
  
  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-headline text-2xl text-primary">
            {format(currentDate, 'MMMM yyyy', { locale: it })}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 text-center text-sm font-medium text-muted-foreground">
            {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => <div key={day} className="py-2">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {/* Add a safety check here to ensure daysInMonth is an array */}
            {Array.isArray(daysInMonth) && daysInMonth.map(day => {
              const logForDay = logs.find(log => isSameDay(parse(log.date, 'yyyy-MM-dd', new Date()), day));
              
              const meals = logForDay?.meals || [];
              const hasMeals = meals.length > 0;
              const hasCompleteAnalysis = hasMeals && meals.every(m => m.analysis && Array.isArray(m.analysis.allergens) && m.analysis.allergens.length > 0);
              
              const dayRating = logForDay?.wellbeingRating || 0;

              return (
                <div
                  key={day.toString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    'relative aspect-square p-1 rounded-md transition-all cursor-pointer hover:ring-2 hover:ring-accent',
                    !isSameMonth(day, currentDate) && 'opacity-50',
                    isToday(day) && 'ring-2 ring-primary ring-offset-2',
                    dayRating > 0 ? wellbeingColors[dayRating] : 'bg-gray-200'
                  )}
                >
                  <time dateTime={format(day, 'yyyy-MM-dd')} className="font-semibold text-xs text-black/70">
                    {format(day, 'd')}
                  </time>
                  {hasMeals && (
                    <div className={cn(
                        "absolute bottom-1 right-1 h-2 w-2 rounded-full",
                        hasCompleteAnalysis ? "bg-blue-600" : "bg-yellow-400"
                    )}></div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {selectedLog && (
        <DayDetailsSheet
          open={isSheetOpen}
          onOpenChange={handleSheetChange}
          log={selectedLog}
        />
      )}
    </>
  );
}
