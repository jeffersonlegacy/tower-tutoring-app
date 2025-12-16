import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBQAjV9LYgB_HUPLONqdhFEHg0K9mmR_TQ",
  authDomain: "towertutoring-e48ac.firebaseapp.com",
  projectId: "towertutoring-e48ac",
  storageBucket: "towertutoring-e48ac.firebasestorage.app",
  messagingSenderId: "962909548649",
  appId: "1:962909548649:web:8be51e20d7f6c852c172f8",
  measurementId: "G-GLYM0J95KZ"


};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
