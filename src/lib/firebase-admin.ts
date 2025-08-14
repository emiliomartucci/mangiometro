import admin from 'firebase-admin';

/**
 * A function that initializes the Firebase Admin SDK if not already initialized
 * and returns the Firestore database instance.
 * This approach is more robust for serverless environments.
 */
export const getAdminDb = () => {
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    return admin.firestore();
};
