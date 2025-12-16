// src/autisti/autistiStorage.ts

const AUTISTA_KEY = "@autista_attivo_local";
const MEZZO_KEY = "@mezzo_attivo_autista_local";

export function saveAutistaLocal(data: any) {
  localStorage.setItem(AUTISTA_KEY, JSON.stringify(data));
}

export function getAutistaLocal() {
  const raw = localStorage.getItem(AUTISTA_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function removeAutistaLocal() {
  localStorage.removeItem(AUTISTA_KEY);
}

export function saveMezzoLocal(data: any) {
  localStorage.setItem(MEZZO_KEY, JSON.stringify(data));
}

export function getMezzoLocal() {
  const raw = localStorage.getItem(MEZZO_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function removeMezzoLocal() {
  localStorage.removeItem(MEZZO_KEY);
}
