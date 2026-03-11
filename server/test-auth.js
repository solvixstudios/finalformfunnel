const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require('./finalformfunnel-service-account.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'finalformfunnel'
  });
  console.log('App initialized');
  const db = admin.firestore();
  db.listCollections().then(cols => {
    console.log('Cols:', cols.length);
    process.exit(0);
  }).catch(e => {
    console.error('Firestore Error:', e);
    process.exit(1);
  });
} catch (e) {
  console.error('Init Error:', e);
  process.exit(1);
}
