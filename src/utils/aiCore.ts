import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase";
import { assertCloneWriteAllowed } from "./cloneWriteBarrier";

const functions = getFunctions(app, "europe-west3");

// Funzione generica che chiama aiCore
export async function callAICore(task: string, payload: any = {}) {
  assertCloneWriteAllowed("functions.aiCore", { task });

  const aiCore = httpsCallable(functions, "aiCore");

  const res: any = await aiCore({ task, payload });

  if (!res.data || res.data.error) {
    throw new Error(res.data?.error || "Errore IA");
  }

  return res.data;
}

// Funzione specifica per il PDF IA universale
export async function generaPDFconIA(tipo: string, dati: any) {
  assertCloneWriteAllowed("functions.aiCore.pdf_ia", { tipo });

  const result = await callAICore("pdf_ia", {
    tipo,
    dati
  });

  return result.data; // Questo è il JSON del PDF
}
