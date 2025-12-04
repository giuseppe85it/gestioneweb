// src/firebase.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// CONFIGURAZIONE CORRETTA SENZA SEGNAPOSTI
const firebaseConfig = {
  apiKey: "AIzaSyD5UVGv-sdjYQnLrva35EQLYxxhjWNGMV4",
  authDomain: "gestionemanutenzione-934ef.firebaseapp.com",
  databaseURL: "https://gestionemanutenzione-934ef-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gestionemanutenzione-934ef",
  storageBucket: "gestionemanutenzione-934ef.firebasestorage.app",
  messagingSenderId: "716845762405",
  appId: "1:716845762405:web:1db7e030d07aaf5ac3e326"
};

// INIZIALIZZA APP
export const app = initializeApp(firebaseConfig);

// FIRESTORE
export const db = getFirestore(app);

// STORAGE
export const storage = getStorage(app, firebaseConfig.storageBucket);

// CLOUD FUNCTIONS
export const functions = getFunctions(app);
