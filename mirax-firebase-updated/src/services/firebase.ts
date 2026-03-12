import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration — mirax-inside project
const firebaseConfig = {
  apiKey: "AIzaSyB7nP-MjpRjPvro5NgMcigEk9FI0r2wcJc",
  authDomain: "mirax-inside.firebaseapp.com",
  databaseURL: "https://mirax-inside-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "mirax-inside",
  storageBucket: "mirax-inside.firebasestorage.app",
  messagingSenderId: "158345721290",
  appId: "1:158345721290:web:cbd3d1b702ffffae5d0b33",
  measurementId: "G-9LQTDTTWT6"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
