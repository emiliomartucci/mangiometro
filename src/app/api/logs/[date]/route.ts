// src/app/api/logs/[date]/route.ts
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Meal } from '@/lib/types';

export const runtime = 'nodejs'; // Forza il runtime Node.js
export const dynamic = 'force-dynamic';

async function findDayLogDoc(date: string, userId: string) {
    const adminDb = getAdminDb();
    const logQuery = adminDb.collection('dailyLogs')
      .where('date', '==', date)
      .where('userId', '==', userId);
    const querySnapshot = await logQuery.get();
    if (querySnapshot.empty) {
      return null;
    }
    return querySnapshot.docs[0];
}

export async function DELETE(
    request: Request,
    { params }: { params: { date: string } }
) {
    const { date } = params;
    const { mealToRemove }: { mealToRemove?: Meal } = await request.json();
    const userId = 'anonymous';

    if (!date) {
        return NextResponse.json({ message: 'Date parameter is required' }, { status: 400 });
    }
    if (!mealToRemove) {
        return NextResponse.json({ message: 'Request body must contain mealToRemove' }, { status: 400 });
    }

    try {
        const existingDoc = await findDayLogDoc(date, userId);
        if (!existingDoc) {
            return NextResponse.json({ message: 'Log document not found' }, { status: 404 });
        }
        const docRef = existingDoc.ref;
        await docRef.update({
            meals: FieldValue.arrayRemove(mealToRemove)
        });
        return NextResponse.json({ message: 'Meal removed successfully' }, { status: 200 });
    } catch (error: any) {
        console.error("Error deleting day log entry:", error);
        return NextResponse.json({ message: `Internal Server Error: ${error.message}` }, { status: 500 });
    }
}
