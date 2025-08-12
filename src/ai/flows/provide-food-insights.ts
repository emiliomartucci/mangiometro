'use server';

/**
 * @fileOverview An AI agent that provides insights into potential connections between food intake and negative symptoms.
 *
 * - provideFoodInsights - A function that generates AI-powered insights based on user's food intake and symptoms.
 * - FoodInsightsInput - The input type for the provideFoodInsights function.
 * - FoodInsightsOutput - The return type for the provideFoodInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FoodInsightsInputSchema = z.object({
  dailyLogs: z.array(
    z.object({
      date: z.string().describe('The date of the log (YYYY-MM-DD).'),
      wellbeingRating: z
        .number()
        .min(1)
        .max(4)
        .describe('Well-being rating for the day (1-4, malissimo to bene).'),
      symptoms: z.array(
        z.object({
          category: z.string().describe('Category of the symptom (GI, cutanei, etc.).'),
          intensity: z
            .number()
            .min(1)
            .max(3)
            .describe('Intensity of the symptom (1-3, L/M/H).'),
        })
      ),
      meals: z.array(
        z.object({
          time: z.string().describe('Time of the meal (HH:MM).'),
          description: z.string().describe('Free text description of the meal.'),
        })
      ),
    })
  ).describe('An array of daily logs, including wellbeing rating, symptoms, and meals.'),
});

export type FoodInsightsInput = z.infer<typeof FoodInsightsInputSchema>;

const FoodInsightsOutputSchema = z.object({
  insights: z.array(
    z.object({
      insight: z.string().describe('A synthesized insight relating food intake to symptoms.'),
    })
  ).
describe('An array of insights about potential connections between food and symptoms.'),
  disclaimer: z
    .string()
    .describe('A disclaimer that this is not medical advice and should not be taken as such.'),
});

export type FoodInsightsOutput = z.infer<typeof FoodInsightsOutputSchema>;

export async function provideFoodInsights(input: FoodInsightsInput): Promise<FoodInsightsOutput> {
  return provideFoodInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'foodInsightsPrompt',
  input: {schema: FoodInsightsInputSchema},
  output: {schema: FoodInsightsOutputSchema},
  prompt: `You are a health and wellness assistant providing insights about potential connections between food intake and symptoms.

  Analyze the following daily logs to identify potential trigger foods and their correlation to negative symptoms.
  Remember to always include a disclaimer that this is not medical advice and should not be taken as such.

  Daily Logs:
  {{#each dailyLogs}}
  Date: {{date}}
  Well-being Rating: {{wellbeingRating}}
  Symptoms:
  {{#each symptoms}}
  - Category: {{category}}, Intensity: {{intensity}}
  {{/each}}
  Meals:
  {{#each meals}}
  - Time: {{time}}, Description: {{description}}
  {{/each}}
  {{/each}}

  Based on the provided data, generate insights about potential connections between food intake and symptoms. Focus on identifying patterns and correlations.
  Provide the insights in a structured format.
  Include a disclaimer that this is not medical advice.
  `,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const provideFoodInsightsFlow = ai.defineFlow(
  {
    name: 'provideFoodInsightsFlow',
    inputSchema: FoodInsightsInputSchema,
    outputSchema: FoodInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
