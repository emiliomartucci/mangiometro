// src/data/logs.ts
import { db } from '@/lib/firebase-client';
import {
  collection, addDoc, getDocs, query, where, limit, doc, updateDoc, onSnapshot,
  Timestamp, arrayUnion, arrayRemove, Unsubscribe
} from 'firebase/firestore';
import { DayLog, Meal, Symptom } from '@/lib/types';
import { format } from 'date-fns';

const LOGS_COLLECTION = 'dailyLogs';
const USER_ID = 'anonymous';

// Trova (o crea) il documento per una data specifica
async function findDayLogRef(date: string) {
  const q = query(
    collection(db, LOGS_COLLECTION),
    where('userId', '==', USER_ID),
    where('date', '==', date),
    limit(1)
  );
  
  const snap = await getDocs(q);
  if (snap.empty) {
    const [year, month] = date.split('-').map(Number);
    const newLogData = {
      userId: USER_ID,
      date, year, month,
      createdAt: Timestamp.now(),
      wellbeingRating: 0,
      meals: [],
      symptoms: [],
    };
    const docRef = await addDoc(collection(db, LOGS_COLLECTION), newLogData);
    return docRef;
  } else {
    return snap.docs[0].ref;
  }
}

// Funzione REALTIME che filtra per mese usando le stringhe di data
export function watchLogsByMonth(
  year: number,
  month: number,
  callback: (logs: DayLog[]) => void
): Unsubscribe {
  const startDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd');
  const endDate = format(new Date(year, month, 1), 'yyyy-MM-dd');

  const q = query(
    collection(db, LOGS_COLLECTION),
    where('userId', '==', USER_ID),
    where('date', '>=', startDate),
    where('date', '<', endDate)
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DayLog[];
    callback(logs);
  });

  return unsubscribe;
}

// Funzioni di scrittura che usano il campo 'date'
export async function addMealToLog(date: string, meal: Omit<Meal, 'id'>) {
  const docRef = await findDayLogRef(date);
  await updateDoc(docRef, { meals: arrayUnion(meal) });
}

export async function updateLogRating(date: string, rating: number, symptoms: Symptom[]) {
  const docRef = await findDayLogRef(date);
  await updateDoc(docRef, { wellbeingRating: rating, symptoms: symptoms });
}

export async function removeMealFromLog(date: string, meal: Meal) {
  const docRef = await findDayLogRef(date);
  await updateDoc(docRef, { meals: arrayRemove(meal) });
}
