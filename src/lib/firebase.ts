import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp({
        apiKey: firebaseConfigJson.apiKey,
        authDomain: firebaseConfigJson.authDomain,
        projectId: firebaseConfigJson.projectId,
        storageBucket: firebaseConfigJson.storageBucket,
        messagingSenderId: firebaseConfigJson.messagingSenderId,
        appId: firebaseConfigJson.appId,
      });
    }
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    const databaseId = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
      ? firebaseConfigJson.firestoreDatabaseId
      : undefined;
    
    try {
      if (typeof window !== 'undefined') {
        db = initializeFirestore(
          firebaseApp,
          {
            localCache: persistentLocalCache({
              tabManager: persistentMultipleTabManager()
            }),
            experimentalAutoDetectLongPolling: true,
          },
          databaseId
        );
      } else {
        db = databaseId ? getFirestore(firebaseApp, databaseId) : getFirestore(firebaseApp);
      }
    } catch {
      // Fallback to getFirestore if already initialized or custom settings unsupported
      db = databaseId ? getFirestore(firebaseApp, databaseId) : getFirestore(firebaseApp);
    }
  }
  return db;
}
