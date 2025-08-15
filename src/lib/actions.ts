// src/lib/actions.ts
// THIS IS NOW A CLIENT-SIDE LIBRARY, NOT SERVER ACTIONS

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
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase'; // Using the client-side SDK
import { DayLog, Meal, Symptom } from './types';
import { format, parse } from 'date-fns';

// --- Re-implemented client-side functions ---

export async function getMonthDayLogs(year: number, month: number): Promise<DayLog[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);
  const startDateString = format(startDate, 'yyyy-MM-dd');
  const endDateString = format(endDate, 'yyyy-MM-dd');
  const userId = 'anonymous'; // Hardcoded for now

  try {
    const logQuery = query(
      collection(db, 'dailyLogs'),
      where('userId', '==', userId),
      where('date', '>=', startDateString),
      where('date', '<', endDateString)
    );

    const querySnapshot = await getDocs(logQuery);
    
    return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt as Timestamp; // Firestore timestamp
        // Ensure createdAt is serialized to string for client-side use
        const serializedCreatedAt = createdAt ? createdAt.toDate().toISOString() : new Date(0).toISOString();
        return { ...data, id: doc.id, createdAt: serializedCreatedAt } as DayLog;
    });
  } catch (error) {
    console.error("Error fetching month's day logs: ", error);
    // In a real app, you might want a more sophisticated error handling
    return [];
  }
}

async function findDayLogDocRef(date: string, userId: string = 'anonymous') {
    const logQuery = query(
      collection(db, 'dailyLogs'),
      where('date', '==', date),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(logQuery);
    if (querySnapshot.empty) {
      return null;
    }
    return querySnapshot.docs[0].ref;
}

export async function upsertDayLog(date: string, data: Partial<Omit<DayLog, 'id' | 'date' | 'userId'>>) {
    const userId = 'anonymous';
    try {
        const docRef = await findDayLogDocRef(date, userId);

        if (docRef) {
            // Document exists, update it
            await updateDoc(docRef, {
                ...data,
                // Use arrayUnion for meals to avoid overwriting
                ...(data.meals && { meals: arrayUnion(...data.meals) })
            });
        } else {
            // Document doesn't exist, create it
            const newLogData = {
                date: date,
                userId: userId,
                createdAt: Timestamp.now(),
                wellbeingRating: data.wellbeingRating ?? 0,
                meals: data.meals ?? [],
                symptoms: data.symptoms ?? [],
            };
            await addDoc(collection(db, 'dailyLogs'), newLogData);
        }
        return { success: true };
    } catch (error: any) {
        console.error("Error in upsertDayLog:", error);
        return { success: false, message: error.message };
    }
}


export async function removeMealFromDayLog(date: string, mealToRemove: Meal) {
    try {
        const docRef = await findDayLogDocRef(date);
        if (!docRef) {
            throw new Error("Log document not found.");
        }
        await updateDoc(docRef, {
            meals: arrayRemove(mealToRemove)
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error removing meal:", error);
        return { success: false, message: error.message };
    }
}


export async function getAllergenWatchlist(userId: string = 'anonymous'): Promise<string[]> {
    try {
        const settingsRef = doc(db, 'userSettings', userId);
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return data.allergenWatchlist || [];
        }
        return [];
    } catch (error) {
        console.error("Error fetching allergen watchlist:", error);
        return [];
    }
}

export async function updateAllergenWatchlist(newList: string[], userId: string = 'anonymous') {
    try {
        const settingsRef = doc(db, 'userSettings', userId);
        await setDoc(settingsRef, { allergenWatchlist: newList }, { merge: true });
        return { success: true };
    } catch (error: any) {
        console.error("Error updating allergen watchlist:", error);
        return { success: false, message: error.message };
    }
}
