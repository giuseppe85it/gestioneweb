// Writer dell'anagrafica categorie di scadenza (storage/@scadenze_categorie).
// Pattern coerente con gli altri writer NEXT: write-barrier obbligatoria.

import { runWithCloneWriteScopedAllowance } from "../utils/cloneWriteBarrier";
import { getItemSync, setItemSync } from "../utils/storageSync";
import {
  SCADENZE_CATEGORIE_KEY,
  normalizeCategoriaRecord,
  unwrapCategorieArray,
  type ScadenzaCategoriaRecord,
} from "./domain/nextScadenzeCategorieDomain";

export const SCADENZE_CATEGORIE_WRITE_SCOPE = "scadenze_categorie_write_scope";

async function readRecords(): Promise<ScadenzaCategoriaRecord[]> {
  const raw = await getItemSync(SCADENZE_CATEGORIE_KEY);
  return unwrapCategorieArray(raw)
    .map(normalizeCategoriaRecord)
    .filter((record): record is ScadenzaCategoriaRecord => record !== null);
}

async function writeRecords(records: ScadenzaCategoriaRecord[]): Promise<void> {
  await runWithCloneWriteScopedAllowance(SCADENZE_CATEGORIE_WRITE_SCOPE, () =>
    setItemSync(SCADENZE_CATEGORIE_KEY, records),
  );
}

function generateId(): string {
  return `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Crea una categoria. Se esiste già un nome equivalente (case-insensitive) la restituisce. */
export async function saveScadenzaCategoria(nome: string): Promise<ScadenzaCategoriaRecord> {
  const trimmed = String(nome ?? "").trim();
  if (!trimmed) {
    throw new Error("Inserisci il nome della categoria.");
  }
  const records = await readRecords();
  const existing = records.find(
    (record) => record.nome.toLocaleLowerCase("it") === trimmed.toLocaleLowerCase("it"),
  );
  if (existing) return existing;

  const record: ScadenzaCategoriaRecord = { id: generateId(), nome: trimmed, updatedAt: Date.now() };
  await writeRecords([...records, record]);
  return record;
}

/** Elimina una categoria dall'anagrafica. Le scadenze esistenti con quel nome NON vengono toccate. */
export async function deleteScadenzaCategoria(id: string): Promise<boolean> {
  const target = String(id ?? "").trim();
  if (!target) {
    throw new Error("Id categoria mancante.");
  }
  const records = await readRecords();
  const next = records.filter((record) => record.id !== target);
  if (next.length === records.length) {
    return false;
  }
  await writeRecords(next);
  return true;
}
