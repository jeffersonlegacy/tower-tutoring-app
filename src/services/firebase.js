import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app, db, storage, auth, analytics;

try {
  // Validate Config
  if (!firebaseConfig.apiKey) {
    throw new Error("Firebase API Key is missing via import.meta.env");
  }

  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
  analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

  console.log("Firebase Initialized Successfully");
} catch (error) {
  console.error("CRITICAL: Firebase Initialization Failed", error);
  // Do not re-throw, allows app to mount and hit ErrorBoundary later
}

export { app, db, storage, auth, analytics };
export default app;
