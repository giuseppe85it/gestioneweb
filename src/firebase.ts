// src/firebase.ts

// Firebase core
import { initializeApp } from "firebase/app";

// Firestore
import { getFirestore } from "firebase/firestore";

// Storage
import { getStorage } from "firebase/storage";

// CONFIGURAZIONE DEL TUO PROGETTO (già corretta)
const firebaseConfig = {
  apiKey: "AIzaSyD5UVGv-sdjYQnLrva35EQLYxxhjWNGMV4",
  authDomain: "gestionemanutenzione-934ef.firebaseapp.com",
  databaseURL: "https://gestionemanutenzione-934ef-default-rtdb.europe-west1.firebased...",
  projectId: "gestionemanutenzione-934ef",
  storageBucket: "gestionemanutenzione-934ef.appspot.com",
  messagingSenderId: "71684576...",
  appId: "1:71684576:web:xxxxxxxxxxxx",
};

// INIZIALIZZA APP E ESPORTA
export const app = initializeApp(firebaseConfig);

// FIRESTORE
export const db = getFirestore(app);

// STORAGE (serve per foto materiali + PDF + allegati)
export const storage = getStorage(app, "gestionemanutenzione-934ef.firebasestorage.app");

