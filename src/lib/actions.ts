'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { addMeal, upsertDayRating, getLogs } from '@/lib/data';
import { MealType, SymptomCategory, DayLog } from '@/lib/types';
import { extractMealInfo } from '@/ai/flows/extract-meal-info';
import { provideFoodInsights } from '@/ai/flows/provide-food-insights';

const rateDaySchema = z.object({
  date: z.string().date(),
  wellbeing: z.coerce.number().min(1).max(4),
  symptoms: z.array(z.object({
    category: z.string(),
    intensity: z.coerce.number().min(1).max(3),
  })),
  notes: z.string().optional(),
});

export async function rateDayAction(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  
  const symptoms = Object.keys(rawData)
    .filter(key => key.startsWith('symptoms.'))
    .map(key => {
      const [_, index, field] = key.split('.');
      return { index: parseInt(index), field, value: rawData[key] };
    })
    .reduce((acc, { index, field, value }) => {
      if (!acc[index]) acc[index] = {};
      acc[index][field] = value;
      return acc;
    }, [] as any[]);

  const validatedFields = rateDaySchema.safeParse({
    date: rawData.date,
    wellbeing: rawData.wellbeing,
    symptoms: symptoms.map(s => ({ category: s.category, intensity: s.intensity })),
    notes: rawData.notes
  });

  if (!validatedFields.success) {
    console.error(validatedFields.error);
    return { error: 'Invalid data' };
  }

  const { date, wellbeing, symptoms: parsedSymptoms, notes } = validatedFields.data;

  await upsertDayRating(
    date,
    wellbeing as 1 | 2 | 3 | 4,
    parsedSymptoms as { category: SymptomCategory; intensity: 1 | 2 | 3 }[],
    notes ?? ''
  );
  revalidatePath('/');
  revalidatePath('/dashboard');
}

const addMealSchema = z.object({
  date: z.string().date(),
  time: z.string(),
  mealType: z.string(),
  description: z.string().min(3),
});

export async function addMealAction(formData: FormData) {
  const validatedFields = addMealSchema.safeParse({
    date: formData.get('date'),
    time: formData.get('time'),
    mealType: formData.get('mealType'),
    description: formData.get('description'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid data' };
  }
  
  const { date, time, mealType, description } = validatedFields.data;

  try {
    const analysis = await extractMealInfo({ mealDescription: description, allergenWatchlist: ['latticini', 'glutine', 'noci'] });
    
    await addMeal(date, {
      type: mealType as MealType,
      time,
      description,
      analysis,
    });

    revalidatePath('/');
    revalidatePath('/dashboard');
  } catch (error) {
    console.error("AI meal analysis failed:", error);
    return { error: 'Failed to analyze meal.' };
  }
}

export async function getInsightsAction() {
    const logs = await getLogs();

    const formattedLogs = logs.map(log => ({
        date: log.date,
        wellbeingRating: log.wellbeing,
        symptoms: log.symptoms.map(s => ({ category: s.category, intensity: s.intensity })),
        meals: log.meals.map(m => ({ time: m.time, description: m.description })),
    }));

    try {
        const insights = await provideFoodInsights({ dailyLogs: formattedLogs });
        return insights;
    } catch(e) {
        console.error(e);
        return { insights: [], disclaimer: "Error generating insights."}
    }
}
