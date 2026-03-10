import { db } from './src/config/firebase';

async function check() {
    const shopDomain = 'baraaelectromenager-com.myshopify.com';

    // Check store_domains
    console.log("--- store_domains collection ---");
    const lookup = await db.collection('store_domains').doc(shopDomain).get();
    if (lookup.exists) {
        console.log("Global Lookup:", lookup.data());
    } else {
        console.log("No global lookup found for", shopDomain);
    }

    // Check user's stores
    if (lookup.exists) {
        const userId = lookup.data()!.userId;
        console.log(`\n--- users/${userId}/stores collection ---`);
        const stores = await db.collection('users').doc(userId).collection('stores').get();
        stores.forEach(s => {
            console.log(`Store ID: ${s.id}, Domain: ${s.data().shopifyDomain}`);
        });

        console.log(`\n--- users/${userId}/assignments collection ---`);
        const assignments = await db.collection('users').doc(userId).collection('assignments').get();
        assignments.forEach(a => {
            console.log(`Assignment ID: ${a.id}, Store ID: ${a.data().storeId}, Product ID: ${a.data().productId}`);
        });
    }

    process.exit(0);
}

check();
