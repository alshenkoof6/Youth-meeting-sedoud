import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
});

const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function inspect() {
  console.log('Signing in with email/password...');
  try {
    const cred = await signInWithEmailAndPassword(auth, 'ad000001@youthchurch.internal', 'Admin@2026');
    console.log('Signed in as uid:', cred.user.uid, cred.user.email);
  } catch (authErr: any) {
    console.error('Email sign in error:', authErr.code, authErr.message);
  }

  console.log('--- Inspecting Firestore Collections ---');
  const collectionsToCheck = [
    'meetings',
    'trips',
    'events',
    'generalEvents',
    'calendarEvents',
    'users'
  ];

  for (const col of collectionsToCheck) {
    try {
      const snap = await getDocs(collection(db, col));
      console.log(`Collection "${col}": ${snap.size} documents`);
      snap.docs.forEach((doc) => {
        const d = doc.data();
        console.log(`  - ID: ${doc.id} | Title/Name: ${d.title || d.displayName || 'No title'} | Date: ${d.date || d.startDate || 'N/A'}`);
      });
    } catch (err: any) {
      console.error(`Collection "${col}" error:`, err?.message || err);
    }
  }
}

inspect().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

