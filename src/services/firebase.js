import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL
};

let app, db, rtdb, storage, auth, analytics;

try {
  app = initializeApp(firebaseConfig);
  // Critical: Access the named Firestore-Native database
  db = getFirestore(app, "towertutoring");
  // Initialize Realtime Database
  rtdb = getDatabase(app);
  storage = getStorage(app);
  auth = getAuth(app);
  analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

  console.log("Firebase Initialized Successfully");

  // Sign in anonymously for Storage/Firestore/RTDB access
  signInAnonymously(auth).then(() => {
    console.log("Signed in anonymously");
  }).catch((error) => {
    console.error("Anonymous sign-in failed:", error);
  });
} catch (error) {
  console.error("CRITICAL: Firebase Initialization Failed", error);
}

export { app, db, rtdb, storage, auth, analytics };
export default app;
