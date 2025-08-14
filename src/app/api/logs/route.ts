// src/app/api/logs/route.ts
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin'; // Use the new function
import { DayLog } from '@/lib/types';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  if (!year || !month) {
    return NextResponse.json({ message: 'Year and month are required' }, { status: 400 });
  }

  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 1);
  const startDateString = format(startDate, 'yyyy-MM-dd');
  const endDateString = format(endDate, 'yyyy-MM-dd');

  try {
    const adminDb = getAdminDb(); // Get the DB instance
    const logQuery = adminDb.collection('dailyLogs')
      .where('date', '>=', startDateString)
      .where('date', '<', endDateString)
      .where('userId', '==', 'anonymous');

    const querySnapshot = await logQuery.get();
    
    const logs = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt as import('firebase-admin').firestore.Timestamp | undefined;
        const serializedCreatedAt = createdAt ? createdAt.toDate().toISOString() : new Date(0).toISOString();
        return { ...data, id: doc.id, createdAt: serializedCreatedAt } as DayLog;
    });

    return NextResponse.json(logs, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching month's day logs: ", error);
    return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}
