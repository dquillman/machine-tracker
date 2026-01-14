import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDEv7aIQrhNgVAMOV3zmIUxBVYLzJyaSDg",
    authDomain: "gym-machine-tracker-daveq.firebaseapp.com",
    projectId: "gym-machine-tracker-daveq",
    storageBucket: "gym-machine-tracker-daveq.firebasestorage.app",
    messagingSenderId: "566966059218",
    appId: "1:566966059218:web:3b3b7f5b2aea6fbb86ed0b"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = initializeFirestore(app, {});
