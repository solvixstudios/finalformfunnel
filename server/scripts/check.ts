import { db } from './src/config/firebase';

async function check() {
    const usersSnap = await db.collection('users').get();
    for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        const stores = await db.collection('users').doc(userId).collection('stores').get();
        if (stores.empty) continue;
        console.log(`\nUser: ${userId}`);

        const assignments = await db.collection('users').doc(userId).collection('assignments').get();
        console.log(`  Assignments: ${assignments.size}`);
        for (const a of assignments.docs) {
            console.log(`    - ${a.id}: storeId: ${a.data().storeId}, formId: ${a.data().formId}, type: ${a.data().assignmentType}, isActive: ${a.data().isActive}`);
        }

        const forms = await db.collection('users').doc(userId).collection('forms').get();
        console.log(`  Forms: ${forms.size}`);
        for (const f of forms.docs) {
            console.log(`    - ${f.id}: name: "${f.data().name}", status: "${f.data().status}"`);
        }
    }
}
check().catch(console.error).then(() => process.exit(0));
