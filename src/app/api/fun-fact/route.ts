// src/app/api/fun-fact/route.ts
import { NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

export const runtime = 'nodejs'; // Forza il runtime Node.js
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const llmResponse = await ai.generate({
      prompt: `
        Scrivi un fun fact interessante e scientificamente accurato sul cibo vegetariano, 
        concentrandoti su uno di questi temi:
        - Fonti sorprendenti di proteine vegetali
        - Combinazioni alimentari che creano proteine complete
        - Nutrienti inaspettati negli alimenti vegetali
        - Miti sfatati sulla dieta vegetariana
        - Curiosità storiche o culturali sul vegetarianismo
        Il fun fact deve essere:
        - Breve (2-3 frasi)
        - Educativo ma accessibile
        - Sorprendente o contro-intuitivo
        - Supportato da dati quando possibile
        Esempio di formato:
        '🌱 Fun Fact: [Fatto interessante]. [Spiegazione o contesto].'
      `,
      temperature: 0.9,
    });
    const funFact = llmResponse.text();
    return NextResponse.json({ funFact });
  } catch (error: any) {
    console.error('Error generating fun fact:', error);
    return NextResponse.json(
      { error: 'Failed to generate fun fact.' },
      { status: 500 }
    );
  }
}
