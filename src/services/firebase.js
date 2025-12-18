import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBQAjV9LYgB_HUPLONqdhFEHg0K9mmR_TQ",
  authDomain: "towertutoring-e48ac.firebaseapp.com",
  projectId: "towertutoring-e48ac",
  storageBucket: "towertutoring-e48ac.firebasestorage.app",
  messagingSenderId: "962909548649",
  appId: "1:962909548649:web:8be51e20d7f6c852c172f8",
  measurementId: "G-GLYM0J95KZ"
};

let app, db, storage, auth, analytics;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
  analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

  console.log("Firebase Initialized Successfully");

  // Sign in anonymously for Storage/Firestore access
  signInAnonymously(auth).then(() => {
    console.log("Signed in anonymously");
  }).catch((error) => {
    console.error("Anonymous sign-in failed:", error);
  });
} catch (error) {
  console.error("CRITICAL: Firebase Initialization Failed", error);
}

export { app, db, storage, auth, analytics };
export default app;
