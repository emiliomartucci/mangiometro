'use server'

import { revalidatePath } from 'next/cache'
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  addDoc,
  arrayUnion,
  Timestamp,
  doc,
  setDoc,
  getDoc,
  arrayRemove,
} from 'firebase/firestore'
import { db } from './firebase'
import { DayLog, Meal, Symptom, MealAnalysis } from './types'
import { extractMealInfo } from '@/ai/flows/extract-meal-info'
import { provideFoodInsights } from '@/ai/flows/provide-food-insights'


async function findDayLogDoc(date: string, userId: string) {
  const logQuery = query(
    collection(db, 'dailyLogs'),
    where('date', '==', date),
    where('userId', '==', userId)
  )
  const querySnapshot = await getDocs(logQuery)
  if (querySnapshot.empty) {
    return null
  }
  return querySnapshot.docs[0]
}

export async function upsertDayLog(
  date: string,
  data: { 
    wellbeingRating?: number; 
    meal?: Omit<Meal, 'analysis' | 'id'>;
    symptoms?: Symptom[];
  }
) {
  try {
    const userId = 'anonymous';
    const existingDoc = await findDayLogDoc(date, userId);
    let mealToSave: Meal | undefined = undefined;

    if (data.meal) {
      try {
        const allergenWatchlist = await getAllergenWatchlist(userId);
        const analysis = await extractMealInfo({ 
            mealDescription: data.meal.description,
            allergenWatchlist: allergenWatchlist 
        });
        mealToSave = { ...data.meal, analysis };
      } catch (e: any) {
        console.error("AI meal analysis failed. Saving meal without analysis.", e);
        return { success: false, message: `AI Analysis Error: ${e.message}` };
      }
    }

    if (existingDoc) {
      const docRef = existingDoc.ref;
      const updateData: { [key: string]: any } = {};
      if (data.wellbeingRating !== undefined) {
        updateData.wellbeingRating = data.wellbeingRating
      }
      if (mealToSave) {
        updateData.meals = arrayUnion(mealToSave)
      }
      if (data.symptoms !== undefined) {
        updateData.symptoms = data.symptoms
      }
      
      if (Object.keys(updateData).length > 0) {
        await updateDoc(docRef, updateData)
      }
    } else {
      const newLogData: Omit<DayLog, 'id' | 'createdAt'> & { createdAt: Timestamp } = {
        date: date,
        wellbeingRating: data.wellbeingRating ?? 0,
        meals: mealToSave ? [mealToSave] : [],
        symptoms: data.symptoms ?? [],
        userId: userId,
        createdAt: Timestamp.now(),
      }
      await addDoc(collection(db, 'dailyLogs'), newLogData)
    }

    revalidatePath('/')
    revalidatePath('/dashboard')
    return { success: true, message: 'Log updated successfully.' }
  } catch (error: any) {
    console.error('Error in upsertDayLog database operation:', error)
    return { success: false, message: `Failed to update log: ${error.message}` }
  }
}

export async function getAllergenWatchlist(userId: string = 'anonymous'): Promise<string[]> {
    try {
        const settingsRef = doc(db, 'userSettings', userId);
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (Array.isArray(data.allergenWatchlist)) {
                return data.allergenWatchlist;
            }
        }
        return [];
    } catch (error) {
        console.error("Error fetching allergen watchlist:", error);
        return [];
    }
}
export async function updateAllergenWatchlist(newList: string[], userId: string = 'anonymous'): Promise<{ success: boolean; message?: string }> {
    try {
        const settingsRef = doc(db, 'userSettings', userId);
        await setDoc(settingsRef, { allergenWatchlist: newList }, { merge: true });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Error updating allergen watchlist:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return { success: false, message: errorMessage };
    }
}
export async function deleteDayLogEntry(
  date: string,
  data: { mealToRemove?: Meal; resetRating?: boolean }
): Promise<{ success: boolean; message?: string }> {
  try {
    const userId = 'anonymous';
    const existingDoc = await findDayLogDoc(date, userId);

    if (!existingDoc) {
      return { success: false, message: "Log document not found for that date." };
    }

    const docRef = existingDoc.ref;
    const updateData: { [key: string]: any } = {};

    if (data.mealToRemove) {
      updateData.meals = arrayRemove(data.mealToRemove);
    }

    if (data.resetRating) {
      updateData.wellbeingRating = 0;
    }
    
    await updateDoc(docRef, updateData);

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting day log entry:", error);
    return { success: false, message: `Failed to delete entry: ${error.message}` };
  }
}
export async function getMonthDayLogs(
  year: number,
  month: number
): Promise<DayLog[]> {
  // **DEFINITIVE FIX**: Define date strings in the function scope
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);
  const startDateString = format(startDate, 'yyyy-MM-dd');
  const endDateString = format(endDate, 'yyyy-MM-dd');

  try {
    const logQuery = query(
      collection(db, 'dailyLogs'),
      where('date', '>=', startDateString),
      where('date', '<', endDateString),
      where('userId', '==', 'anonymous')
    );

    const querySnapshot = await getDocs(logQuery);
    
    return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt as Timestamp | undefined;
        const serializedCreatedAt = createdAt ? createdAt.toDate().toISOString() : new Date(0).toISOString();
        return { ...data, id: doc.id, createdAt: serializedCreatedAt } as DayLog;
    });

  } catch (error) {
    if ((error as any).code === 'failed-precondition') {
        console.warn("Firestore index not ready, falling back to client-side filtering.");
        const fallbackQuery = query(collection(db, 'dailyLogs'));
        const snapshot = await getDocs(fallbackQuery);
        const logs = snapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt as Timestamp | undefined;
            const serializedCreatedAt = createdAt ? createdAt.toDate().toISOString() : new Date(0).toISOString();
            return { ...data, id: doc.id, createdAt: serializedCreatedAt } as DayLog;
        });
        // Now this filter is safe because the date strings are in scope.
        return logs.filter(log => log.userId === 'anonymous' && log.date >= startDateString && log.date < endDateString);
    }
    console.error("Error fetching month's day logs: ", error);
    return [];
  }
}

export async function getInsightsAction(): Promise<{
  insights?: { insight: string }[];
  disclaimer?: string;
  error?: string;
}> {
  try {
    const logQuery = query(
      collection(db, 'dailyLogs'),
      where('userId', '==', 'anonymous')
    )
    const querySnapshot = await getDocs(logQuery)
    const allLogs = querySnapshot.docs.map((doc) => doc.data() as DayLog)

    if (allLogs.length < 3) {
      return { insights: [], disclaimer: 'Aggiungi più dati per avere analisi più accurate.' };
    }
    
    const result = await provideFoodInsights({ dailyLogs: allLogs });

    revalidatePath('/dashboard');
    return result || { insights: [], error: 'Failed to get insights from AI.' };
  } catch (error) {
    console.error("Error getting insights:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return { error: `Failed to get insights: ${errorMessage}` };
  }
}

export async function updateMealInDayLog(
  date: string,
  updatedMeal: Meal,
  userId: string = 'anonymous'
): Promise<{ success: boolean; message?: string }> {
  try {
    const existingDoc = await findDayLogDoc(date, userId);
    if (!existingDoc) {
      return { success: false, message: "Log document not found." };
    }

    const logData = existingDoc.data() as DayLog;
    
    const newMealsArray = logData.meals.map(meal => {
      if (meal.time === updatedMeal.time && meal.description === updatedMeal.description) {
        return updatedMeal;
      }
      return meal;
    });

    const docRef = existingDoc.ref;
    await updateDoc(docRef, { meals: newMealsArray });

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("Error updating meal:", error);
    return { success: false, message: `Failed to update meal: ${error.message}` };
  }
}

export async function removeMealFromDayLog(
  date: string,
  mealToRemove: { time: string; description: string },
  userId: string = 'anonymous'
): Promise<{ success: boolean; message?: string }> {
  try {
    const existingDoc = await findDayLogDoc(date, userId);
    if (!existingDoc) {
      return { success: false, message: "Log document not found." };
    }

    const logData = existingDoc.data() as DayLog;
    
    const newMealsArray = logData.meals.filter(meal => 
      !(meal.time === mealToRemove.time && meal.description === mealToRemove.description)
    );

    const docRef = existingDoc.ref;
    await updateDoc(docRef, { meals: newMealsArray });

    revalidatePath('/');
    revalidatePath('/dashboard');
    return { success: true, message: 'Meal removed successfully.' };
  } catch (error: any) {
    console.error("Error removing meal:", error);
    return { success: false, message: `Failed to remove meal: ${error.message}` };
  }
}


function format(date: Date, formatStr: string): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (formatStr === 'yyyy-MM-dd') {
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }
    return date.toISOString();
}
