'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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

// The output schema for allergens is now an object with a name and a reason.
const AllergenObjectSchema = z.object({
    name: z.string().describe("The name of the potential allergen."),
    reason: z.string().describe("A brief explanation of why this allergen might be present.")
});

const ExtractMealInfoOutputSchema = z.object({
  ingredients: z.array(z.string()).describe('A list of ingredients identified in the meal description.'),
  macros: z
    .object({
      carbohydrates: z.number().describe('Estimated carbohydrates in grams.'),
      protein: z.number().describe('Estimated protein in grams.'),
      fat: z.number().describe('Estimated fat in grams.'),
    })
    .describe('Estimated macro breakdown of the meal.'),
  // The 'allergens' field is now an array of the new object type.
  allergens: z
    .array(AllergenObjectSchema)
    .describe('A list of potential allergens, each with a name and a reason for its inclusion.'),
});
export type ExtractMealInfoOutput = z.infer<typeof ExtractMealInfoOutputSchema>;

// The prompt is updated to be more precise and to require a reason for each allergen.
const extractMealInfoPrompt = ai.definePrompt({
  name: 'extractMealInfoPrompt',
  input: { schema: ExtractMealInfoInputSchema },
  output: { schema: ExtractMealInfoOutputSchema },
  prompt: `You are a nutrition expert. Analyze the meal description to extract ingredients, estimate macros, and identify potential allergens.

Meal Description: {{{mealDescription}}}

**Crucial Instructions for Allergen Identification:**
1.  For each allergen you identify, you MUST provide a brief "reason" explaining why it might be present (e.g., "Yogurt is a dairy product.").
2.  Pay VERY close attention to negating words like "senza", "lactose-free", "gluten-free", etc. If an ingredient is explicitly described as free from an allergen, DO NOT list that allergen. For example, for "yogurt senza lattosio", you should not identify "Lattosio" nor "latte".

{{#if allergenWatchlist}}
Pay special attention to the following list of allergens to watch for: {{{allergenWatchlist}}}.
{{/if}}

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
    const { output } = await extractMealInfoPrompt(input);
    return output!;
  }
);

export async function extractMealInfo(input: ExtractMealInfoInput): Promise<ExtractMealInfoOutput> {
  return extractMealInfoFlow(input);
}
