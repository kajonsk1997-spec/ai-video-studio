import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, indexedDBLocalPersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDrv4p8tUKJgpaliBXP-lOvlHy9h_2z6D4",
  authDomain: "one-shop-e5139.firebaseapp.com",
  projectId: "one-shop-e5139",
  storageBucket: "one-shop-e5139.firebasestorage.app",
  messagingSenderId: "907267899596",
  appId: "1:907267899596:web:709fb0830c3e1a7e410269",
  measurementId: "G-Q9EEN2V94D"
};

// Initialize Firebase (Prevent duplicate initialization)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Fix for internal assertion & pending promise error in Next.js / Turbopack
let auth: any;
try {
  auth = getAuth(app);
} catch (e) {
  auth = initializeAuth(app, {
    persistence: indexedDBLocalPersistence
  });
}

const db = getFirestore(app);

// Initialize Analytics safely for browser environment
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, analytics };