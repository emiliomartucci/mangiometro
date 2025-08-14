// src/ai/genkit.ts
// This is the definitive configuration file.
// It ensures the Google AI plugin is initialized with the necessary API key.

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      // This line is essential. It tells Genkit to use the key
      // you provided in the .env.local file.
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
