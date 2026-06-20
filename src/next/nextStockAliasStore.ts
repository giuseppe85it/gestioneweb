// Archivio alias articoli di magazzino (memoria sinonimi).
//
// Scopo: ricordare che descrizioni scritte in modo diverso indicano lo STESSO
// articolo di inventario (es. "adblue" = "tank ad blue"). Quando l'utente
// conferma al carico "è lo stesso di X?", salviamo qui l'abbinamento, così le
// volte successive il carico aggancia automaticamente la voce canonica.
//
// Dataset Firestore: documento storage/@stock_alias. NB: setItemSync avvolge il
// valore in { value: ... } e getItemSync lo srotola, quindi nel codice si lavora
// sempre con l'ARRAY nudo di AliasRecord (il wrapper { value } resta nel doc).
// La scrittura passa per il write barrier del clone (vedi cloneWriteBarrier.ts).

import { getItemSync, setItemSync } from "../utils/storageSync";
import { normalizeNextMagazzinoMaterialIdentity } from "./domain/nextMagazzinoStockContract";

const STOCK_ALIAS_KEY = "@stock_alias";

export type StockAliasRecord = {
  id: string;
  // Identità normalizzata della descrizione "sorgente" (la variante).
  aliasIdentity: string;
  // Voce canonica a cui la variante deve agganciarsi.
  canonicalDescrizione: string;
  canonicalStockKey: string | null;
  fornitore: string | null;
  unita: string | null;
  createdAt: number;
};

function unwrapAliasArray(raw: unknown): unknown[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object" && raw !== null) {
    const record = raw as { items?: unknown; value?: unknown };
    if (Array.isArray(record.items)) return record.items;
    if (Array.isArray(record.value)) return record.value;
  }
  return [];
}

function normalizeAliasRecord(raw: unknown): StockAliasRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const aliasIdentity = normalizeNextMagazzinoMaterialIdentity(record.aliasIdentity);
  const canonicalDescrizione =
    typeof record.canonicalDescrizione === "string" ? record.canonicalDescrizione.trim() : "";
  if (!aliasIdentity || !canonicalDescrizione) return null;

  return {
    id: typeof record.id === "string" && record.id.trim() ? record.id.trim() : aliasIdentity,
    aliasIdentity,
    canonicalDescrizione,
    canonicalStockKey:
      typeof record.canonicalStockKey === "string" && record.canonicalStockKey.trim()
        ? record.canonicalStockKey.trim()
        : null,
    fornitore:
      typeof record.fornitore === "string" && record.fornitore.trim()
        ? record.fornitore.trim()
        : null,
    unita: typeof record.unita === "string" && record.unita.trim() ? record.unita.trim() : null,
    createdAt:
      typeof record.createdAt === "number" && Number.isFinite(record.createdAt)
        ? record.createdAt
        : 0,
  };
}

export async function readStockAliasRecords(): Promise<StockAliasRecord[]> {
  const raw = await getItemSync(STOCK_ALIAS_KEY);
  return unwrapAliasArray(raw)
    .map((entry) => normalizeAliasRecord(entry))
    .filter((entry): entry is StockAliasRecord => Boolean(entry));
}

export function findStockAlias(
  aliases: StockAliasRecord[],
  descrizione: unknown,
): StockAliasRecord | null {
  const identity = normalizeNextMagazzinoMaterialIdentity(descrizione);
  if (!identity) return null;
  return aliases.find((entry) => entry.aliasIdentity === identity) ?? null;
}

// Salva (o aggiorna) un alias. createdAt è un audit-stamp tecnico, non un dato
// business, quindi può derivare da Date.now() (regola TIMESTAMP-MAI-DA-CLICK ok).
export async function saveStockAlias(input: {
  descrizioneSorgente: string;
  canonicalDescrizione: string;
  canonicalStockKey: string | null;
  fornitore: string | null;
  unita: string | null;
  nowMs: number;
}): Promise<void> {
  const aliasIdentity = normalizeNextMagazzinoMaterialIdentity(input.descrizioneSorgente);
  if (!aliasIdentity) return;

  const existing = await readStockAliasRecords();
  const record: StockAliasRecord = {
    id: aliasIdentity,
    aliasIdentity,
    canonicalDescrizione: input.canonicalDescrizione.trim(),
    canonicalStockKey: input.canonicalStockKey,
    fornitore: input.fornitore,
    unita: input.unita,
    createdAt: Number.isFinite(input.nowMs) ? input.nowMs : 0,
  };

  const next = [record, ...existing.filter((entry) => entry.aliasIdentity !== aliasIdentity)];
  await setItemSync(STOCK_ALIAS_KEY, next);
}

// Rimuove un alias memorizzato (per correggere un abbinamento sbagliato).
export async function deleteStockAlias(descrizioneSorgente: string): Promise<void> {
  const aliasIdentity = normalizeNextMagazzinoMaterialIdentity(descrizioneSorgente);
  if (!aliasIdentity) return;
  const existing = await readStockAliasRecords();
  const next = existing.filter((entry) => entry.aliasIdentity !== aliasIdentity);
  if (next.length === existing.length) return;
  await setItemSync(STOCK_ALIAS_KEY, next);
}
