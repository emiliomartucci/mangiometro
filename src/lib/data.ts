'use server';

import { DayLog, Meal, Symptom } from '@/lib/types';
import { format, subDays, addDays, parseISO } from 'date-fns';
import { randomUUID } from 'crypto';

// In-memory store for demo purposes
let logs: DayLog[] = [];

// Function to generate some initial mock data
function initializeMockData() {
  const today = new Date();
  const mockLogs: DayLog[] = [];

  // Day with good rating
  const day1 = subDays(today, 3);
  mockLogs.push({
    date: format(day1, 'yyyy-MM-dd'),
    wellbeing: 4,
    meals: [
      { id: randomUUID(), type: 'breakfast', time: '08:00', description: 'Yogurt con frutta e semi di chia', analysis: { ingredients: ['Yogurt', 'Frutta', 'Semi di chia'], macros: { carbohydrates: 30, protein: 15, fat: 10 }, allergens: [] }},
      { id: randomUUID(), type: 'lunch', time: '13:00', description: 'Insalata di pollo con verdure miste', analysis: { ingredients: ['Pollo', 'Insalata', 'Verdure'], macros: { carbohydrates: 10, protein: 30, fat: 15 }, allergens: [] }},
    ],
    symptoms: [],
    notes: 'Giornata piena di energia!',
  });

  // Day with bad rating and dairy
  const day2 = subDays(today, 2);
  mockLogs.push({
    date: format(day2, 'yyyy-MM-dd'),
    wellbeing: 1,
    meals: [
      { id: randomUUID(), type: 'breakfast', time: '09:00', description: 'Cappuccino e brioche', analysis: { ingredients: ['Latte', 'Caffè', 'Farina', 'Zucchero', 'Burro'], macros: { carbohydrates: 50, protein: 8, fat: 20 }, allergens: ['latticini'] }},
      { id: randomUUID(), type: 'lunch', time: '13:30', description: 'Pasta al formaggio', analysis: { ingredients: ['Pasta', 'Formaggio'], macros: { carbohydrates: 70, protein: 20, fat: 25 }, allergens: ['latticini', 'glutine'] }},
    ],
    symptoms: [
      { id: randomUUID(), category: 'GI', intensity: 3 },
      { id: randomUUID(), category: 'SKIN', intensity: 2 },
    ],
    notes: 'Mi sento molto gonfio e la pelle è irritata.',
  });

  // Neutral day
  const day3 = subDays(today, 1);
  mockLogs.push({
    date: format(day3, 'yyyy-MM-dd'),
    wellbeing: 3,
    meals: [
       { id: randomUUID(), type: 'dinner', time: '20:00', description: 'Salmone al forno con patate', analysis: { ingredients: ['Salmone', 'Patate'], macros: { carbohydrates: 40, protein: 35, fat: 20 }, allergens: [] }},
    ],
    symptoms: [],
  });

  // Today (empty)
  mockLogs.push({
    date: format(today, 'yyyy-MM-dd'),
    wellbeing: 3,
    meals: [],
    symptoms: [],
  });
  
    // Another bad day to test correlation
  const day4 = subDays(today, 5);
  mockLogs.push({
    date: format(day4, 'yyyy-MM-dd'),
    wellbeing: 1,
    meals: [
      { id: randomUUID(), type: 'dinner', time: '21:00', description: 'Pizza con mozzarella e salame piccante', analysis: { ingredients: ['Farina', 'Mozzarella', 'Pomodoro', 'Salame'], macros: { carbohydrates: 80, protein: 30, fat: 40 }, allergens: ['latticini', 'glutine'] }},
    ],
    symptoms: [
      { id: randomUUID(), category: 'GI', intensity: 2 },
    ],
    notes: 'Bruciore di stomaco notturno.',
  });


  logs = mockLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Initialize once
if (logs.length === 0) {
  initializeMockData();
}

// Data access functions
export async function getLogs(): Promise<DayLog[]> {
  return Promise.resolve(logs);
}

export async function getLogByDate(date: string): Promise<DayLog | undefined> {
  return Promise.resolve(logs.find(log => log.date === date));
}

export async function upsertDayRating(
  date: string,
  wellbeing: 1 | 2 | 3 | 4,
  symptoms: Omit<Symptom, 'id'>[],
  notes: string
): Promise<DayLog> {
  let log = await getLogByDate(date);
  if (log) {
    log.wellbeing = wellbeing;
    log.symptoms = symptoms.map(s => ({ ...s, id: randomUUID() }));
    log.notes = notes;
  } else {
    log = {
      date,
      wellbeing,
      symptoms: symptoms.map(s => ({ ...s, id: randomUUID() })),
      notes,
      meals: [],
    };
    logs.push(log);
    logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  return Promise.resolve(log);
}

export async function addMeal(date: string, meal: Omit<Meal, 'id'>): Promise<DayLog> {
  let log = await getLogByDate(date);
  const newMeal: Meal = { ...meal, id: randomUUID() };

  if (log) {
    log.meals.push(newMeal);
  } else {
    log = {
      date,
      wellbeing: 3, // Default to normal
      meals: [newMeal],
      symptoms: [],
    };
    logs.push(log);
    logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  return Promise.resolve(log);
}

// Correlational analysis for "Red Weeks"
export async function getCorrelatedIngredients(allLogs: DayLog[]) {
  const redDays = allLogs.filter(log => log.wellbeing === 1).map(log => log.date);
  
  if (redDays.length === 0) {
    return { ingredients: [], allergens: [] };
  }

  const correlatedIngredients: Record<string, number> = {};
  const correlatedAllergens: Record<string, number> = {};

  redDays.forEach(redDate => {
    const redDayDate = parseISO(redDate);
    const startDate = format(subDays(redDayDate, 2), 'yyyy-MM-dd'); // 48 hours before
    const endDate = format(redDayDate, 'yyyy-MM-dd');

    const logsInWindow = allLogs.filter(log => log.date >= startDate && log.date <= endDate);

    const ingredientsInWindow = new Set<string>();
    const allergensInWindow = new Set<string>();

    logsInWindow.forEach(log => {
      log.meals.forEach(meal => {
        meal.analysis?.ingredients.forEach(ing => ingredientsInWindow.add(ing.toLowerCase()));
        meal.analysis?.allergens.forEach(alg => allergensInWindow.add(alg.toLowerCase()));
      });
    });

    ingredientsInWindow.forEach(ing => {
      correlatedIngredients[ing] = (correlatedIngredients[ing] || 0) + 1;
    });
    allergensInWindow.forEach(alg => {
      correlatedAllergens[alg] = (correlatedAllergens[alg] || 0) + 1;
    });
  });

  const sortedIngredients = Object.entries(correlatedIngredients)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([item, frequency]) => ({ item, frequency }));

  const sortedAllergens = Object.entries(correlatedAllergens)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([item, frequency]) => ({ item, frequency }));

  return { ingredients: sortedIngredients, allergens: sortedAllergens };
}
