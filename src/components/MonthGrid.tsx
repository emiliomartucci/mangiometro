'use client';
import { Log, Mood } from '@/data/logs';

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate(); // month è 1-12
}
function nextMood(m: Mood | undefined) : Mood | undefined {
  if (!m) return 'bad';
  if (m === 'bad') return 'ok';
  if (m === 'ok') return 'good';
  return undefined; // 'good' -> clear
}

export function MonthGrid({
  year, month, logs, onToggle
}: {
  year: number; month: number; logs: Log[];
  onToggle: (day: number, next: Mood | undefined) => void;
}) {
  const dmax = daysInMonth(year, month);
  const map = new Map<string, Log>();
  for (const l of logs) map.set(l.date, l);

  const cells = [];
  for (let d = 1; d <= dmax; d++) {
    const dateKey = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const mood = map.get(dateKey)?.mood as Mood | undefined;

    let bg = 'bg-gray-100';
    if (mood === 'bad') bg = 'bg-red-200';
    if (mood === 'ok')  bg = 'bg-gray-300';
    if (mood === 'good') bg = 'bg-green-200';

    cells.push(
      <button
        key={d}
        className={`h-16 rounded-md border flex items-center justify-center ${bg}`}
        onClick={() => onToggle(d, nextMood(mood))}
        title={`Giorno ${d} (${mood ?? '—'})`}
      >
        <span className="font-medium">{d}</span>
      </button>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {cells}
    </div>
  );
}
