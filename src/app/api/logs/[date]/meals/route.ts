// src/app/api/logs/[date]/meals/route.ts
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Meal, MealAnalysis } from '@/lib/types';
import { getAllergenWatchlist } from '@/lib/actions'; 
import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const runtime = 'nodejs'; // Forza il runtime Node.js
export const dynamic = 'force-dynamic';

const mealAnalysisSchema = z.object({
  ingredients: z.array(z.string()).describe('A list of estimated ingredients in the meal'),
  allergens: z
    .array(z.object({ name: z.string(), reason: z.string() }))
    .describe('A list of potential allergens and the reason for the warning'),
  macros: z
    .object({
      carbohydrates: z.number(),
      protein: z.number(),
      fat: z.number(),
    })
    .describe('Estimated macronutrient content (carbs, protein, fat) in grams'),
});

async function extractMealInfo(input: { mealDescription: string; allergenWatchlist: string[] }): Promise<MealAnalysis> {
  const llmResponse = await ai.generate({
    prompt: `
      Analyze the following meal description: "${input.mealDescription}".
      Consider the user's allergen watchlist: ${input.allergenWatchlist.join(', ')}.
      Based on the description and watchlist, identify potential ingredients, 
      allergens, and estimate the macronutrient content.
      Pay close attention to the watchlist. If an item from the watchlist appears 
      to be in the meal, add it to the allergens list with a clear reason.
      Provide your analysis in the following JSON format.
    `,
    format: 'json',
    output: { schema: mealAnalysisSchema },
    temperature: 0.3,
  });
  return llmResponse.output()!;
}

async function findDayLogDoc(date: string, userId: string) {
    const adminDb = getAdminDb();
    const logQuery = adminDb.collection('dailyLogs')
      .where('date', '==', date)
      .where('userId', '==', userId);
    const querySnapshot = await logQuery.get();
    if (querySnapshot.empty) {
      return null;
    }
    return querySnapshot.docs[0];
}

export async function POST(
    request: Request,
    { params }: { params: { date: string } }
) {
    const { date } = params;
    const { meal, isUpdate }: { meal: Meal, isUpdate: boolean } = await request.json();
    const userId = 'anonymous';

    if (!date || !meal) {
        return NextResponse.json({ message: 'Date and meal are required' }, { status: 400 });
    }

    try {
        let mealToSave: Meal;
        if (isUpdate) {
            mealToSave = meal;
        } else {
            try {
                const allergenWatchlist = await getAllergenWatchlist(userId);
                const analysis = await extractMealInfo({
                    mealDescription: meal.description,
                    allergenWatchlist: allergenWatchlist
                });
                mealToSave = { ...(meal as Omit<Meal, 'analysis' | 'id'>), analysis };
            } catch (e: any) {
                console.error("AI meal analysis failed. Saving meal without analysis.", e);
                mealToSave = { ...(meal as Omit<Meal, 'analysis' | 'id'>), analysis: undefined };
            }
        }
        
        const existingDoc = await findDayLogDoc(date, userId);
        if (!existingDoc) {
             return NextResponse.json({ message: 'Log document not found' }, { status: 404 });
        }
        
        const logData = existingDoc.data();
        const currentMeals = logData?.meals || [];
        const mealIndex = currentMeals.findIndex((m: Meal) => m.time === meal.time);
        let newMealsArray;
        if (mealIndex !== -1) {
            newMealsArray = [...currentMeals];
            newMealsArray[mealIndex] = mealToSave;
        } else {
            newMealsArray = [...currentMeals, mealToSave];
        }
        await existingDoc.ref.update({ meals: newMealsArray });
        return NextResponse.json({ message: 'Meal saved successfully' }, { status: 200 });
    } catch (error: any) {
        console.error("Error saving meal:", error);
        return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
