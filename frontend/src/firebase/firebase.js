import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC1YDP5rdP9jEQoHMg0h9pYxJiUJeR5zfo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hospital-management-syst-3bdbc.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hospital-management-syst-3bdbc",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hospital-management-syst-3bdbc.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "784410643245",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:784410643245:web:07236f43746ea86e1461a4",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-R1S4LDQMEX"
};

export const IS_MOCKED = false; // Set to false to enable real Firebase connection

export const app = initializeApp(firebaseConfig);
export const authInstance = getAuth(app);
export const dbInstance = getFirestore(app);

export default firebaseConfig;
