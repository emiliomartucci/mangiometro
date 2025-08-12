'use client';

import * as React from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  parseISO,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DayLog } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DayDetailsSheet } from '@/components/day-details-sheet';

function getWellbeingColor(wellbeing: DayLog['wellbeing']) {
  switch (wellbeing) {
    case 1: return 'bg-red-400'; // malissimo
    case 2: return 'bg-orange-400'; // male
    case 4: return 'bg-green-400'; // bene
    case 3:
    default:
      return 'bg-gray-200'; // normale or not filled
  }
}

export function CalendarView({ logs }: { logs: DayLog[] }) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedDayLog, setSelectedDayLog] = React.useState<DayLog | null>(null);

  const firstDayOfCurrentMonth = startOfMonth(currentMonth);
  const lastDayOfCurrentMonth = endOfMonth(currentMonth);

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayOfCurrentMonth, { locale: it }),
    end: endOfWeek(lastDayOfCurrentMonth, { locale: it }),
  });

  const nextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  
  const handleDayClick = (day: Date) => {
    const log = logs.find(l => isSameDay(parseISO(l.date), day));
    const dayLog : DayLog = log || { date: format(day, 'yyyy-MM-dd'), wellbeing: 3, meals: [], symptoms: []};
    setSelectedDayLog(dayLog);
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-2xl text-primary">
          {format(currentMonth, 'MMMM yyyy', { locale: it })}
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 text-center text-sm font-medium text-muted-foreground">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const logForDay = logs.find(l => isSameDay(parseISO(l.date), day));
            const hasMealsOrNotes = logForDay && (logForDay.meals.length > 0 || (logForDay.notes && logForDay.notes.length > 0));

            return (
              <div
                key={day.toString()}
                className={cn(
                  'relative aspect-square p-1 rounded-md transition-all cursor-pointer hover:ring-2 hover:ring-accent',
                  getWellbeingColor(logForDay?.wellbeing ?? 3),
                  !isSameMonth(day, currentMonth) && 'opacity-50',
                  isSameDay(day, new Date()) && 'ring-2 ring-primary ring-offset-2'
                )}
                onClick={() => handleDayClick(day)}
              >
                <time dateTime={format(day, 'yyyy-MM-dd')} className="font-semibold text-xs text-black/70">
                  {format(day, 'd')}
                </time>
                {hasMealsOrNotes && (
                  <div className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-blue-600" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
      {selectedDayLog && (
        <DayDetailsSheet 
            open={!!selectedDayLog} 
            onOpenChange={(isOpen) => !isOpen && setSelectedDayLog(null)} 
            log={selectedDayLog} 
        />
      )}
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
