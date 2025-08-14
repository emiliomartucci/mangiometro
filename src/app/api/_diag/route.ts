// src/app/api/_diag/route.ts
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getAdminDb();
    // Esegue una lettura leggera per verificare la connessione e i permessi
    await db.collection('userSettings').limit(1).get();
    
    // Controlla la presenza della variabile d'ambiente critica per l'IA
    const apiKeyPresent = !!process.env.GOOGLE_API_KEY;

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'OK',
      checks: {
        adc_firestore_connection: 'Success',
        google_api_key_present: apiKeyPresent,
      }
    });
  } catch (e: any) {
    console.error("Diagnostic check failed:", e);
    // Restituisce un errore 500 ma con un corpo JSON utile per il debug
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'ERROR',
      checks: {
        adc_firestore_connection: 'Failed',
        error_message: e.message,
        google_api_key_present: !!process.env.GOOGLE_API_KEY,
      }
    }, { status: 500 });
  }
}
