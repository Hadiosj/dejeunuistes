import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// PASTE YOUR FIREBASE CONFIG HERE
const firebaseConfig = {
  apiKey: "AIzaSyBlD9MMnTtBfS9-XiUyAQajWDvaY4X0w5o",
  authDomain: "pixel-resto-paris.firebaseapp.com",
  projectId: "pixel-resto-paris",
  storageBucket: "pixel-resto-paris.firebasestorage.app",
  messagingSenderId: "91229551048",
  appId: "1:91229551048:web:6ab11f4a346fa17b7da8fd"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);