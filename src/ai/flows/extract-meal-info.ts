'use server';

/**
 * @fileOverview This file defines a Genkit flow for extracting meal information from free text descriptions.
 *
 * The flow takes a meal description as input and uses an AI model to extract
 * ingredients, estimate macros, and identify potential allergens.
 *
 * @exports {
 *   extractMealInfo,
 *   ExtractMealInfoInput,
 *   ExtractMealInfoOutput,
 * }
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractMealInfoInputSchema = z.object({
  mealDescription: z
    .string()
    .describe('A free text description of the meal consumed.'),
  allergenWatchlist: z
    .array(z.string())
    .optional()
    .describe('An optional list of allergens to watch out for.'),
});
export type ExtractMealInfoInput = z.infer<typeof ExtractMealInfoInputSchema>;

const ExtractMealInfoOutputSchema = z.object({
  ingredients: z.array(z.string()).describe('A list of ingredients identified in the meal description.'),
  macros: z
    .object({
      carbohydrates: z.number().describe('Estimated carbohydrates in grams.'),
      protein: z.number().describe('Estimated protein in grams.'),
      fat: z.number().describe('Estimated fat in grams.'),
      fiber: z.number().optional().describe('Estimated fiber in grams, if available.'),
    })
    .describe('Estimated macro breakdown of the meal.'),
  allergens: z
    .array(z.string())
    .describe('A list of potential allergens identified in the meal description based on the watchlist.'),
});
export type ExtractMealInfoOutput = z.infer<typeof ExtractMealInfoOutputSchema>;

const extractMealInfoPrompt = ai.definePrompt({
  name: 'extractMealInfoPrompt',
  input: {schema: ExtractMealInfoInputSchema},
  output: {schema: ExtractMealInfoOutputSchema},
  prompt: `You are a nutrition expert. Extract the ingredients, estimate macros (carbohydrates, protein, and fat), and identify potential allergens from the following meal description.

Meal Description: {{{mealDescription}}}

{% if allergenWatchlist %}
Allergen Watchlist: {{{allergenWatchlist}}}
{% endif %}

Return the information in JSON format.
`,
});

const extractMealInfoFlow = ai.defineFlow(
  {
    name: 'extractMealInfoFlow',
    inputSchema: ExtractMealInfoInputSchema,
    outputSchema: ExtractMealInfoOutputSchema,
  },
  async input => {
    const {output} = await extractMealInfoPrompt(input);
    return output!;
  }
);

export async function extractMealInfo(input: ExtractMealInfoInput): Promise<ExtractMealInfoOutput> {
  return extractMealInfoFlow(input);
}

