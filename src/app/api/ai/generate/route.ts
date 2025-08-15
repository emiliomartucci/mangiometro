// src/app/api/ai/generate/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = { prompt: string };

export async function POST(req: Request) {
  try {
    const { prompt } = (await req.json()) as Body;

    // 1. Controlla se la chiave API è disponibile nell'ambiente
    // Funziona sia in locale (.env.local) che in produzione (apphosting.yaml)
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('La chiave API di Google non è configurata sul server.');
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Il prompt non può essere vuoto.' }, { status: 400 });
    }

    const model = 'gemini-1.5-flash-latest';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // 2. Chiama direttamente l'API di Google
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Errore dalla API di Google:', errorBody);
      throw new Error(`La richiesta all'API di Google è fallita con stato ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    
    return NextResponse.json({ text });

  } catch (e: any) {
    console.error("Errore interno nell'API /api/ai/generate:", e);
    // Fornisce un messaggio di errore chiaro al client
    return NextResponse.json({ error: e.message || 'Errore inaspettato del server.' }, { status: 500 });
  }
}
