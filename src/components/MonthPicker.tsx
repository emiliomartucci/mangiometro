'use client';
import { Dispatch, SetStateAction } from 'react';

export function MonthPicker({
  year, month, setYear, setMonth
}: {
  year: number; month: number;
  setYear: Dispatch<SetStateAction<number>>;
  setMonth: Dispatch<SetStateAction<number>>;
}) {
  const months = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

  function prev() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  return (
    <div className="flex items-center gap-3 mb-4">
      <button onClick={prev} className="px-3 py-1 rounded border">←</button>
      <div className="text-lg font-medium">{months[month-1]} {year}</div>
      <button onClick={next} className="px-3 py-1 rounded border">→</button>
    </div>
  );
}
