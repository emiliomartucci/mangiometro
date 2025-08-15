'use client';
import { useState } from 'react';

export function FunFactBox() {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string>('');
  const [error, setError] = useState<string>('');

  async function fetchFunFact() {
    try {
      setLoading(true); setError('');
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'Dimmi un fun fact breve sulla nutrizione.' })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'AI error');
      setText(json.text || '(nessun testo)');
    } catch (e: any) {
      setError(e?.message || 'errore inatteso');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="font-semibold">Fun Fact (AI)</div>
      <button className="px-3 py-1 rounded border" onClick={fetchFunFact} disabled={loading}>
        {loading ? 'Carico…' : 'Genera'}
      </button>
      {error && <div className="text-sm text-red-600">Errore: {error}</div>}
      {text && <div className="text-sm whitespace-pre-wrap">{text}</div>}
    </div>
  );
}
