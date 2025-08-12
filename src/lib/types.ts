import { type extractMealInfo } from '@/ai/flows/extract-meal-info';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEAL_TYPES: { value: MealType; label: string }[] = [
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

export type Meal = {
  id: string;
  type: MealType;
  time: string; // "HH:mm"
  description: string;
  analysis?: Awaited<ReturnType<typeof extractMealInfo>>;
};

export type Symptom = {
  id: string;
  category: SymptomCategory;
  intensity: 1 | 2 | 3; // L/M/H
};

export type DayLog = {
  date: string; // "YYYY-MM-DD"
  wellbeing: 1 | 2 | 3 | 4; // 1: malissimo, 2: male, 3: normale, 4: bene
  symptoms: Symptom[];
  meals: Meal[];
  notes?: string;
};
