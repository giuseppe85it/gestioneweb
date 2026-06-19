// Anagrafica delle categorie personalizzate di scadenza (storage/@scadenze_categorie).
//
// È un semplice catalogo di NOMI riusabili: serve a poter scegliere nel modulo
// "Nuova scadenza" una categoria già definita (niente nomi riscritti a mano, niente
// doppioni per maiuscole/refusi). Non influenza pagina/home/PDF, che restano dinamiche
// e mostrano un settore solo quando ha almeno una scadenza.

import { getItemSync } from "../../utils/storageSync";

export const SCADENZE_CATEGORIE_KEY = "@scadenze_categorie" as const;

export type ScadenzaCategoriaRecord = {
  id: string;
  nome: string;
  updatedAt?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function unwrapCategorieArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (isRecord(raw) && Array.isArray(raw.value)) return raw.value;
  if (isRecord(raw) && Array.isArray(raw.items)) return raw.items;
  return [];
}

export function normalizeCategoriaRecord(raw: unknown): ScadenzaCategoriaRecord | null {
  if (!isRecord(raw)) return null;
  const id = String(raw.id ?? "").trim();
  const nome = String(raw.nome ?? "").trim();
  if (!id || !nome) return null;
  return {
    id,
    nome,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : undefined,
  };
}

export async function readScadenzeCategorie(): Promise<ScadenzaCategoriaRecord[]> {
  const raw = await getItemSync(SCADENZE_CATEGORIE_KEY);
  return unwrapCategorieArray(raw)
    .map(normalizeCategoriaRecord)
    .filter((record): record is ScadenzaCategoriaRecord => record !== null)
    .sort((left, right) => left.nome.localeCompare(right.nome, "it"));
}
