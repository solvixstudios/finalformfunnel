/**
 * Firebase Database Cloning Script (PROD -> BETA)
 * 
 * Securely copies all documents and subcollections from the production database
 * into the beta database. This provides a safe way to test against real data.
 * 
 * Run with: npm run clone-db
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as readline from 'readline';

// ── Configuration ───────────────────────────────────────────────
const prodAccountPath = path.resolve(__dirname, '../finalformfunnel-service-account.json');
const devAccountPath = path.resolve(__dirname, '../finalformfunnel-beta-service-account.json');

// ── Firebase Init ───────────────────────────────────────────────
console.log('🔄 Initializing dual-database connections...');

const prodApp = admin.initializeApp({
    credential: admin.credential.cert(require(prodAccountPath)),
    projectId: 'finalformfunnel'
}, 'PROD');
const prodDb = prodApp.firestore();

const devApp = admin.initializeApp({
    credential: admin.credential.cert(require(devAccountPath)),
    projectId: 'finalformfunnel-beta'
}, 'DEV');
const devDb = devApp.firestore();

// ── Helpers ─────────────────────────────────────────────────────
async function confirm(message: string): Promise<boolean> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        rl.question(message, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

async function deleteDocumentRecursively(docRef: admin.firestore.DocumentReference): Promise<number> {
    let deleted = 0;
    const subcollections = await docRef.listCollections();
    for (const subCol of subcollections) {
        deleted += await deleteCollection(subCol);
    }
    await docRef.delete();
    return deleted + 1;
}

async function deleteCollection(collectionRef: admin.firestore.CollectionReference): Promise<number> {
    let deleted = 0;
    const docRefs = await collectionRef.listDocuments();
    for (const docRef of docRefs) {
        deleted += await deleteDocumentRecursively(docRef);
    }
    return deleted;
}

let docsCopied = 0;

async function cloneDocumentRecursively(docRefProd: admin.firestore.DocumentReference, docRefDev: admin.firestore.DocumentReference) {
    // Copy the document data
    const docData = await docRefProd.get();
    if (docData.exists) {
        await docRefDev.set(docData.data() as any);
        docsCopied++;
    }

    // Recursively copy all subcollections
    const subcollections = await docRefProd.listCollections();
    for (const subCol of subcollections) {
        await cloneCollection(subCol, docRefDev.collection(subCol.id));
    }
}

async function cloneCollection(colRefProd: admin.firestore.CollectionReference, colRefDev: admin.firestore.CollectionReference) {
    const docRefs = await colRefProd.listDocuments();
    for (const docRef of docRefs) {
        await cloneDocumentRecursively(docRef, colRefDev.doc(docRef.id));
    }
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
    console.log('');
    console.log('🔥 Firebase Database Cloning');
    console.log('   Source: finalformfunnel');
    console.log('   Target: finalformfunnel-beta');
    console.log('');
    console.log('   ⚠️  WARNING: This will overwrite data in the BETA database if document IDs collide!');
    console.log('   It is highly recommended to run `npm run clean` on dev first.');
    console.log('');

    const ok = await confirm('   Are you sure you want to pull LIVE PROD data into BETA? (y/N): ');
    
    if (!ok) {
        console.log('❌ Cancelled.');
        process.exit(0);
    }

    console.log('');
    console.log('🧹 Step 1: Wiping existing BETA database...');
    const existingDevCollections = await devDb.listCollections();
    for (const col of existingDevCollections) {
        process.stdout.write(`   🗑️  Deleting collection: ${col.id}...`);
        const count = await deleteCollection(devDb.collection(col.id));
        console.log(` ${count} docs deleted.`);
    }

    console.log('');
    console.log('🚀 Step 2: Cloning PROD into BETA. This may take a while...');
    
    const rootCollections = await prodDb.listCollections();
    
    if (rootCollections.length === 0) {
        console.log('   Prod database is empty. Nothing to clone.');
        process.exit(0);
    }

    for (const col of rootCollections) {
        process.stdout.write(`   📦 Cloning collection: ${col.id}...`);
        await cloneCollection(col, devDb.collection(col.id));
        console.log(' Done.');
    }

    console.log('');
    console.log(`✅ Success! Copied ${docsCopied} total documents from PROD to BETA.`);
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Error during cloning:', err);
    process.exit(1);
});
