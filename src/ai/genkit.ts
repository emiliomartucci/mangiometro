// src/ai/genkit.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Simplified configuration to avoid build issues.
// The API key will be loaded directly from the process environment,
// which is populated by the secrets we configured in Google Cloud.

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
  model: 'googleai/gemini-pro',
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
