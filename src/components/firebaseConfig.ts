import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

function firebaseInit() {
    const firebaseKey = process.env.REACT_APP_FIREBASE_API_KEY;

    const firebaseConfig = {
    apiKey: 'AIzaSyAok5CHwsVoXvW9UvRwaBNLo3EYnVbTTqI',
    authDomain: "hawaiisurf-60fce.firebaseapp.com",
    projectId: "hawaiisurf-60fce",
    storageBucket: "hawaiisurf-60fce.appspot.com",
    messagingSenderId: "62107046505",
    appId: "1:62107046505:web:b0fa894a7f52c2b21488f8",
    measurementId: "G-YTB4X4RG9J"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);

    // Initialize Firebase Analytics (Google Analytics)
    const analytics = getAnalytics(app);

    // Initialize Firebase Authentication and get a reference to the service
    const auth = getAuth(app);
}

export default firebaseInit;