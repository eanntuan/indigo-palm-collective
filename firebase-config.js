// Firebase Configuration for Desert Edit Dashboard
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.GOOGLE_API_KEY,
  authDomain: "indigo-palm-collective.firebaseapp.com",
  projectId: "indigo-palm-collective",
  storageBucket: "indigo-palm-collective.firebasestorage.app",
  messagingSenderId: "908153205708",
  appId: "1:908153205708:web:a02fc89fb3f361e7c4e369"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (our database)
const db = getFirestore(app);

// Export for use in other files
export { db };
