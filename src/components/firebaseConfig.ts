import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Firebase Config 
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyAok5CHwsVoXvW9UvRwaBNLo3EYnVbTTqI",
  authDomain: "hawaiisurf-60fce.firebaseapp.com",
  projectId: "hawaiisurf-60fce",
  storageBucket: "hawaiisurf-60fce.appspot.com",
  messagingSenderId: "62107046505",
  appId: "1:62107046505:web:b0fa894a7f52c2b21488f8",
  measurementId: "G-YTB4X4RG9J"
};

const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Analytics ONLY in browser (avoid SSR build crash)
if (typeof window !== "undefined") {
  try {
    getAnalytics(app);
  } catch (err) {
  }
}

getAuth(app);


export default app;
