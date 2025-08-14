'use server'

import { revalidatePath } from 'next/cache'
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from './firebase-admin'
import { DayLog, Meal, Symptom } from './types'
// No longer importing any AI flows directly
// import { extractMealInfo } from '@/ai/flows/extract-meal-info'
// import { provideFoodInsights } from '@/ai/flows/provide-food-insights'

async function findDayLogDoc(date: string, userId: string) {
  const adminDb = getAdminDb();
  const logQuery = adminDb.collection('dailyLogs')
    .where('date', '==', date)
    .where('userId', '==', userId)
  const querySnapshot = await logQuery.get()
  if (querySnapshot.empty) {
    return null
  }
  return querySnapshot.docs[0]
}

// This function is still used by the <RateDaySheet> and <AddMealSheet> components
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
    
    // Since this function no longer calls the AI, we can simplify it.
    // The AI analysis is now handled by the POST /api/logs/[date]/meals endpoint.
    const mealToSave = data.meal ? { ...data.meal, analysis: undefined } : undefined;

    if (existingDoc) {
      const docRef = existingDoc.ref;
      const updateData: { [key: string]: any } = {};
      if (data.wellbeingRating !== undefined) {
        updateData.wellbeingRating = data.wellbeingRating
      }
      if (mealToSave) {
        updateData.meals = FieldValue.arrayUnion(mealToSave)
      }
      if (data.symptoms !== undefined) {
        updateData.symptoms = data.symptoms
      }
      
      if (Object.keys(updateData).length > 0) {
        await docRef.update(updateData)
      }
    } else {
      const adminDb = getAdminDb();
      const newLogData: Omit<DayLog, 'id' | 'createdAt'> & { createdAt: FieldValue } = {
        date: date,
        wellbeingRating: data.wellbeingRating ?? 0,
        meals: mealToSave ? [mealToSave] : [],
        symptoms: data.symptoms ?? [],
        userId: userId,
        createdAt: FieldValue.serverTimestamp(),
      }
      await adminDb.collection('dailyLogs').add(newLogData)
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
        const adminDb = getAdminDb();
        const settingsRef = adminDb.collection('userSettings').doc(userId);
        const docSnap = await settingsRef.get();
        if (docSnap.exists) {
            const data = docSnap.data();
            if (data && Array.isArray(data.allergenWatchlist)) {
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
        const adminDb = getAdminDb();
        const settingsRef = adminDb.collection('userSettings').doc(userId);
        await settingsRef.set({ allergenWatchlist: newList }, { merge: true });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Error updating allergen watchlist:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return { success: false, message: errorMessage };
    }
}
