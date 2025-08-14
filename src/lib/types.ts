// src/lib/types.ts
import { type extractMealInfo } from '@/ai/flows/extract-meal-info';

export const MEAL_TYPES: { value: string; label: string }[] = [
  { value: 'breakfast', label: 'Colazione' },
  { value: 'lunch', label: 'Pranzo' },
  { value: 'dinner', label: 'Cena' },
  { value: 'snack', label: 'Spuntino' },
];

export const SYMPTOM_CATEGORIES = {
  GI: 'Gastrointestinale',
  SKIN: 'Cutanei',
  RESPIRATORY: 'Respiratori',
  NEUROLOGICAL: 'Neurologici',
  ENERGY_MOOD: 'Energia/Umore',
  SLEEP: 'Sonno',
} as const;

export type SymptomCategory = keyof typeof SYMPTOM_CATEGORIES;

/**
 * Represents the analysis object returned by the AI for a meal.
 * Note the updated structure for allergens.
 */
export type MealAnalysis = Omit<Awaited<ReturnType<typeof extractMealInfo>>, 'allergens'> & {
    allergens: {
        name: string;
        reason: string;
    }[];
};

/**
 * Represents a single meal entry.
 */
export type Meal = {
  type: string;
  time: string; // ISO-like string e.g., "2024-05-21T08:00"
  description: string;
  analysis?: MealAnalysis;
};

export type Symptom = {
  category: SymptomCategory;
  intensity: number; // e.g., 1-3
};

export type DayLog = {
  id: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  wellbeingRating: number; // 0-5
  symptoms: Symptom[];
  meals: Meal[];
  createdAt: string; // ISO 8601 string format
};
