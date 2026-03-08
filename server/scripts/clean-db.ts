/**
 * Firebase Database Cleanup Script
 * 
 * Recursively deletes ALL documents and subcollections from Firestore.
 * Run with: npm run clean:db
 * 
 * ⚠️  WARNING: This is DESTRUCTIVE and IRREVERSIBLE.
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

dotenv.config();

// ── Firebase Init ───────────────────────────────────────────────
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const projectId = process.env.FIREBASE_PROJECT_ID;

let credential: admin.credential.Credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const json = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'base64').toString('ascii'));
    credential = admin.credential.cert(json);
} else if (serviceAccountPath) {
    const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
    const serviceAccount = require(resolvedPath);
    credential = admin.credential.cert(serviceAccount);
} else {
    credential = admin.credential.applicationDefault();
}

admin.initializeApp({ credential, projectId: projectId || undefined });
const db = admin.firestore();

// ── Helpers ─────────────────────────────────────────────────────
async function deleteDocumentRecursively(docRef: admin.firestore.DocumentReference): Promise<number> {
    let deleted = 0;

    // First, recursively delete all subcollections
    const subcollections = await docRef.listCollections();
    for (const subCol of subcollections) {
        deleted += await deleteCollection(subCol);
    }

    // Then delete the document itself
    await docRef.delete();
    deleted += 1;

    return deleted;
}

async function deleteCollection(collectionRef: admin.firestore.CollectionReference): Promise<number> {
    let deleted = 0;

    // listDocuments() finds BOTH real docs AND "phantom" parents that only have subcollections.
    // This is critical — .get() misses documents that were deleted but still have subcollection data.
    const docRefs = await collectionRef.listDocuments();

    for (const docRef of docRefs) {
        deleted += await deleteDocumentRecursively(docRef);
    }

    return deleted;
}

async function confirm(message: string): Promise<boolean> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        rl.question(message, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
    // Discover all top-level collections
    const collections = await db.listCollections();
    const collectionIds = collections.map(c => c.id);

    console.log('');
    console.log('🔥 Firebase Database Cleanup');
    console.log(`   Project: ${projectId}`);
    console.log('');

    if (collectionIds.length === 0) {
        console.log('   Database is already empty! Nothing to delete.');
        process.exit(0);
    }

    console.log('   Found collections:');
    collectionIds.forEach(c => console.log(`   • ${c}`));
    console.log('');
    console.log('   This will recursively delete ALL documents and subcollections.');
    console.log('');

    // Skip confirmation if --force flag is passed
    if (!process.argv.includes('--force')) {
        const ok = await confirm('⚠️  Are you sure? This is IRREVERSIBLE. (y/N): ');
        if (!ok) {
            console.log('❌ Cancelled.');
            process.exit(0);
        }
    }

    console.log('');
    let totalDeleted = 0;

    for (const col of collections) {
        process.stdout.write(`   🗑️  Deleting ${col.id}...`);
        const count = await deleteCollection(col);
        console.log(` ${count} docs deleted`);
        totalDeleted += count;
    }

    console.log('');
    console.log(`✅ Done! Deleted ${totalDeleted} documents total.`);
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
