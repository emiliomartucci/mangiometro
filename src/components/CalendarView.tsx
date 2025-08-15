'use client';
import * as React from 'react';
import {
  eachDayOfInterval, endOfMonth, startOfMonth, format, isToday, isSameDay, isSameMonth,
  addMonths, subMonths, parse, startOfWeek, endOfWeek // Added missing functions
} from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayLog } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const wellbeingColors: { [key: number]: string } = {
  1: 'bg-red-400', 2: 'bg-orange-400', 3: 'bg-yellow-400', 4: 'bg-green-400', 5: 'bg-blue-400',
};

export function CalendarView({ logs, onDayClick, currentDate, setCurrentDate }: {
  logs: DayLog[],
  onDayClick: (log: DayLog) => void,
  currentDate: Date,
  setCurrentDate: (date: Date) => void
}) {
  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  
  // This code will now work correctly
  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }),
    end: endOfWeek(lastDayOfMonth, { weekStartsOn: 1 }),
  });

  return (
    <div className="shadow-lg rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline text-2xl text-primary">
          {format(currentDate, 'MMMM yyyy', { locale: it })}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-sm font-medium text-muted-foreground">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => <div key={day} className="py-2">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map(day => {
          const logForDay = logs.find(log => log.date === format(day, 'yyyy-MM-dd'));
          const dayRating = logForDay?.wellbeingRating || 0;
          return (
            <button
              key={day.toString()}
              onClick={() => onDayClick(logForDay || {
                id: '', userId: '', date: format(day, 'yyyy-MM-dd'),
                wellbeingRating: 0, symptoms: [], meals: [], createdAt: new Date().toISOString(),
              })}
              className={cn(
                'relative aspect-square p-1 rounded-md transition-all hover:ring-2 hover:ring-accent',
                !isSameMonth(day, currentDate) && 'opacity-50',
                isToday(day) && 'ring-2 ring-primary ring-offset-2',
                dayRating > 0 ? wellbeingColors[dayRating] : 'bg-gray-200'
              )}
            >
              <time dateTime={format(day, 'yyyy-MM-dd')} className="font-semibold text-xs text-black/70">
                  {format(day, 'd')}
              </time>
              {logForDay?.meals?.length > 0 && (
                  <div className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-blue-600"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
