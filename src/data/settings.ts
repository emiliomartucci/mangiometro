// src/data/settings.ts
import { db } from '@/lib/firebase-client';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SETTINGS_COLLECTION = 'userSettings';
const USER_ID = 'anonymous';

export async function getAllergenWatchlist(): Promise<string[]> {
  const settingsRef = doc(db, SETTINGS_COLLECTION, USER_ID);
  const docSnap = await getDoc(settingsRef);
  if (docSnap.exists()) {
    return docSnap.data().allergenWatchlist || [];
  }
  return [];
}

export async function updateAllergenWatchlist(newList: string[]): Promise<{ success: boolean; message?: string }> {
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, USER_ID);
    await setDoc(settingsRef, { allergenWatchlist: newList }, { merge: true });
    return { success: true };
  } catch (error: any) {
    console.error("Error updating watchlist:", error);
    return { success: false, message: error.message };
  }
}
