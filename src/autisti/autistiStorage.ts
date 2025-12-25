// src/autisti/autistiStorage.ts

const AUTISTA_KEY = "@autista_attivo_local";
const MEZZO_KEY = "@mezzo_attivo_autista_local";
const REVOKE_KEY = "@autista_revoca_local";

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

export function getLastRevokedAt(badge: string) {
  if (!badge) return 0;
  const raw = localStorage.getItem(REVOKE_KEY);
  if (!raw) return 0;
  try {
    const data = JSON.parse(raw);
    const value = data?.[badge];
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export function setLastRevokedAt(badge: string, ts: number) {
  if (!badge || !Number.isFinite(ts)) return;
  const raw = localStorage.getItem(REVOKE_KEY);
  let data: Record<string, number> = {};
  if (raw) {
    try {
      data = JSON.parse(raw) || {};
    } catch {
      data = {};
    }
  }
  data[badge] = ts;
  localStorage.setItem(REVOKE_KEY, JSON.stringify(data));
}
