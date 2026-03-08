import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

// Attempt to initialize using a service account credentials string or file
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const projectId = process.env.FIREBASE_PROJECT_ID;

try {
    let credential;

    // Option 1: Base64/JSON string from env var (better for production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        const serviceAccountJson = JSON.parse(
            Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'base64').toString('ascii')
        );
        credential = admin.credential.cert(serviceAccountJson);
    }
    // Option 2: Path to JSON file
    else if (serviceAccountPath) {
        // Resolve absolute path
        const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
        const serviceAccount = require(resolvedPath);
        credential = admin.credential.cert(serviceAccount);
    } else {
        // Option 3: Default env (Google Cloud / Firebase default credentials)
        credential = admin.credential.applicationDefault();
    }

    admin.initializeApp({
        credential,
        projectId: projectId || undefined
    });

    console.log('🔥 Firebase Admin initialized successfully');
} catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    // Optional: Add logic to let the app continue locally if skipping firebase validation for testing
}

export const db = admin.firestore();
export const auth = admin.auth();
