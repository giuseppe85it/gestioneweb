// Writer stock canonico condiviso per il carico in inventario (@inventario).
//
// Riusa il contratto canonico (stockKey, stockLoadKeys, normalizzazione unità)
// e replica fedelmente la shape record del Magazzino (buildInventarioRecord),
// così il carico dagli ARRIVI ("Materiali da ordinare") produce ESATTAMENTE le
// stesse voci del carico dalle FATTURE già esistente in NextMagazzinoPage:
// una sola giacenza, dedup condiviso via stockLoadKeys, nessun doppione.
//
// Gestisce inoltre la memoria alias sinonimi (es. "adblue" = "tank ad blue"):
// la risoluzione automatica via @stock_alias e la conferma interattiva quando
// trova un articolo "simile" non ancora abbinato.

import { getItemSync, setItemSync } from "../../utils/storageSync";
import {
  areNextMagazzinoUnitsCompatible,
  buildNextMagazzinoProcurementArrivoLoadKey,
  buildNextMagazzinoStockKey,
  hasNextMagazzinoStockLoadKey,
  mergeNextMagazzinoStockLoadKeys,
  normalizeNextMagazzinoMaterialIdentity,
  normalizeNextMagazzinoStockUnit,
  normalizeNextMagazzinoStockUnitLoose,
} from "./nextMagazzinoStockContract";
import {
  findStockAlias,
  readStockAliasRecords,
  saveStockAlias,
  type StockAliasRecord,
} from "../nextStockAliasStore";

const INVENTARIO_KEY = "@inventario";

type RawDatasetRecord = Record<string, unknown>;
type StoredArrayShape = "array" | "items" | "value" | "value.items";

type InventarioItem = {
  id: string;
  descrizione: string;
  quantita: number;
  unita: string;
  stockKey: string | null;
  stockLoadKeys: string[];
  fornitore: string | null;
  fotoUrl: string | null;
  fotoStoragePath: string | null;
  sogliaMinima?: number;
};

export type RigaArrivoInput = {
  descrizione: string;
  fornitore: string | null;
  unita: string;
  quantita: number | null;
  // Data dell'arrivo (stesso campo del flusso Magazzino: material.arrivalDateLabel),
  // entra nella chiave anti-doppione condivisa. Stringa vuota = NODATE.
  data: string | null;
  // Identificatori ordine/materiale: compongono sourceDocId `${orderId}:${materialId}`,
  // identico alla chiave usata dal carico lato Magazzino (dedup condiviso).
  orderId: string;
  materialId: string;
};

export type SimileTrovatoInfo = {
  descrizioneArrivo: string;
  candidato: {
    descrizione: string;
    fornitore: string | null;
    unita: string;
    quantita: number;
  };
};

export type CaricoRigaEsito = {
  descrizione: string;
  esito: "creato" | "consolidato" | "gia_caricato" | "bloccato";
  motivo?: string;
  aliasCreato?: boolean;
};

export type CaricoReport = {
  righe: CaricoRigaEsito[];
  creati: number;
  consolidati: number;
  giaCaricati: number;
  bloccati: number;
  aliasCreati: number;
  inventarioAggiornato: boolean;
};

// ---- helper replicati fedelmente da NextMagazzinoPage (stessa shape dati) ----

function getObjectRecord(raw: unknown): RawDatasetRecord | null {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as RawDatasetRecord) : null;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.trim().replace(/\s+/g, "").replace(",", ".");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function generateId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function detectStoredArrayShape(raw: unknown): StoredArrayShape {
  if (Array.isArray(raw)) return "array";
  if (typeof raw === "object" && raw !== null) {
    const record = raw as { items?: unknown; value?: unknown };
    if (Array.isArray(record.items)) return "items";
    if (Array.isArray(record.value)) return "value";
    if (
      typeof record.value === "object" &&
      record.value !== null &&
      Array.isArray((record.value as { items?: unknown[] }).items)
    ) {
      return "value.items";
    }
  }
  return "array";
}

function unwrapStoredArray(raw: unknown): unknown[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object" && raw !== null) {
    const record = raw as { items?: unknown; value?: unknown };
    if (Array.isArray(record.items)) return record.items;
    if (Array.isArray(record.value)) return record.value;
    if (
      typeof record.value === "object" &&
      record.value !== null &&
      Array.isArray((record.value as { items?: unknown[] }).items)
    ) {
      return (record.value as { items: unknown[] }).items;
    }
  }
  return [];
}

function wrapStoredArray(shape: StoredArrayShape, items: unknown[]): unknown {
  switch (shape) {
    case "items":
      return { items };
    case "value":
      return { value: items };
    case "value.items":
      return { value: { items } };
    case "array":
    default:
      return items;
  }
}

function normalizeInventarioItem(raw: unknown, index: number): InventarioItem | null {
  const record = getObjectRecord(raw);
  if (!record) return null;
  const descrizione =
    normalizeOptionalText(record.descrizione) ??
    normalizeOptionalText(record.label) ??
    normalizeOptionalText(record.nome);
  const quantita = normalizeNumber(record.quantitaTotale) ?? normalizeNumber(record.quantita);
  if (!descrizione || quantita === null) return null;

  const fornitore =
    normalizeOptionalText(record.fornitore) ??
    normalizeOptionalText(record.fornitoreLabel) ??
    normalizeOptionalText(record.nomeFornitore);
  const unita = normalizeNextMagazzinoStockUnitLoose(record.unita) || "pz";
  const sogliaMinima = normalizeNumber(record.sogliaMinima);

  return {
    id: normalizeOptionalText(record.id) ?? `inventario_${index}`,
    descrizione,
    quantita,
    unita,
    stockKey:
      buildNextMagazzinoStockKey({
        stockKey: record.stockKey,
        descrizione,
        fornitore,
        unita,
      }) ?? null,
    stockLoadKeys: mergeNextMagazzinoStockLoadKeys(
      record.stockLoadKeys ?? record.stockSourceKeys,
      null,
    ),
    fornitore,
    fotoUrl: normalizeOptionalText(record.fotoUrl),
    fotoStoragePath: normalizeOptionalText(record.fotoStoragePath),
    sogliaMinima: sogliaMinima ?? undefined,
  };
}

function buildInventarioRecord(
  baseRecord: RawDatasetRecord | undefined,
  item: InventarioItem,
): RawDatasetRecord {
  const nextRecord: RawDatasetRecord = {
    ...(baseRecord ?? {}),
    id: item.id,
    descrizione: item.descrizione,
    quantita: item.quantita,
    quantitaTotale: item.quantita,
    unita: normalizeNextMagazzinoStockUnit(item.unita) ?? item.unita,
    stockKey: item.stockKey ?? null,
    stockLoadKeys: item.stockLoadKeys,
    fotoUrl: item.fotoUrl ?? null,
    fotoStoragePath: item.fotoStoragePath ?? null,
    fornitore: item.fornitore ?? null,
    fornitoreLabel: item.fornitore ?? null,
    nomeFornitore: item.fornitore ?? null,
  };

  if (typeof item.sogliaMinima === "number" && Number.isFinite(item.sogliaMinima)) {
    nextRecord.sogliaMinima = item.sogliaMinima;
  } else {
    delete nextRecord.sogliaMinima;
  }

  return nextRecord;
}

function sameMaterialIdentity(
  left: { descrizione?: string | null; fornitore?: string | null },
  right: { descrizione?: string | null; fornitore?: string | null },
): boolean {
  return (
    normalizeNextMagazzinoMaterialIdentity(left.descrizione) ===
      normalizeNextMagazzinoMaterialIdentity(right.descrizione) &&
    (normalizeNextMagazzinoMaterialIdentity(left.fornitore) || "NOFORNITORE") ===
      (normalizeNextMagazzinoMaterialIdentity(right.fornitore) || "NOFORNITORE")
  );
}

function findInventarioIndexByDescriptor(
  inventario: InventarioItem[],
  descriptor: { stockKey?: string | null; descrizione?: string | null; fornitore?: string | null; unita?: string | null },
): number {
  if (descriptor.stockKey) {
    const byStockKey = inventario.findIndex((item) => item.stockKey === descriptor.stockKey);
    if (byStockKey >= 0) return byStockKey;
  }
  return inventario.findIndex(
    (item) =>
      Boolean(descriptor.unita) &&
      areNextMagazzinoUnitsCompatible(item.unita, descriptor.unita) &&
      sameMaterialIdentity(item, descriptor),
  );
}

function sortInventarioItems(items: InventarioItem[]): InventarioItem[] {
  return [...items].sort((left, right) =>
    left.descrizione.localeCompare(right.descrizione, "it", { sensitivity: "base" }),
  );
}

// Match "simile" per i sinonimi: stessa unità, fornitore compatibile, e una
// descrizione compattata (senza spazi) contenuta nell'altra (es. ADBLUE ⊂ TANKADBLUE).
function compactIdentity(value: unknown): string {
  return normalizeNextMagazzinoMaterialIdentity(value).replace(/\s+/g, "");
}

function findSimileIndex(
  inventario: InventarioItem[],
  descrizione: string,
  fornitore: string | null,
  unita: string,
): number {
  const target = compactIdentity(descrizione);
  // Soglia conservativa: evita falsi "simili" su token corti/comuni (OLIO, GAS…).
  if (target.length < 5) return -1;
  const targetForn = normalizeNextMagazzinoMaterialIdentity(fornitore) || "NOFORNITORE";

  return inventario.findIndex((item) => {
    if (!areNextMagazzinoUnitsCompatible(item.unita, unita)) return false;
    const itemForn = normalizeNextMagazzinoMaterialIdentity(item.fornitore) || "NOFORNITORE";
    if (targetForn !== "NOFORNITORE" && itemForn !== "NOFORNITORE" && targetForn !== itemForn) {
      return false;
    }
    const candidate = compactIdentity(item.descrizione);
    if (candidate.length < 5 || candidate === target) return false;
    return candidate.includes(target) || target.includes(candidate);
  });
}

// ---- API pubblica ----

export type CaricaArriviArgs = {
  righe: RigaArrivoInput[];
  // Chiamata quando si trova un articolo "simile" non ancora abbinato.
  // Ritorna "unisci" (consolida sul simile + memorizza alias) o "nuovo" (crea voce nuova).
  onSimileTrovato?: (info: SimileTrovatoInfo) => Promise<"unisci" | "nuovo">;
  // Audit-stamp tecnico per la creazione degli alias (non è un dato business).
  nowMs: number;
};

export async function caricaArriviInInventario(args: CaricaArriviArgs): Promise<CaricoReport> {
  const rawDoc = await getItemSync(INVENTARIO_KEY);
  const shape = detectStoredArrayShape(rawDoc);
  const rawList = unwrapStoredArray(rawDoc);

  const items: InventarioItem[] = [];
  const rawById = new Map<string, RawDatasetRecord | undefined>();
  // Voci inventario non normalizzabili (es. quantità assente) NON vanno perse:
  // le ripersistiamo invariate, dato che riscriviamo l'intero array @inventario.
  const passthroughRaw: unknown[] = [];
  rawList.forEach((entry, index) => {
    const item = normalizeInventarioItem(entry, index);
    if (item) {
      items.push(item);
      rawById.set(item.id, getObjectRecord(entry) ?? undefined);
    } else {
      passthroughRaw.push(entry);
    }
  });

  const aliases: StockAliasRecord[] = await readStockAliasRecords();
  const aliasDaSalvare: Array<{
    descrizioneSorgente: string;
    canonicalDescrizione: string;
    canonicalStockKey: string | null;
    fornitore: string | null;
    unita: string;
  }> = [];

  const esiti: CaricoRigaEsito[] = [];
  let modificato = false;

  for (const riga of args.righe) {
    const descrizione = normalizeText(riga.descrizione);
    if (!descrizione) {
      esiti.push({ descrizione: riga.descrizione, esito: "bloccato", motivo: "Descrizione mancante." });
      continue;
    }
    const unita = normalizeNextMagazzinoStockUnit(riga.unita);
    if (!unita) {
      esiti.push({
        descrizione,
        esito: "bloccato",
        motivo: `Unità "${riga.unita}" non supportata (ammesse: pz, lt, kg, mt).`,
      });
      continue;
    }
    const quantita = riga.quantita;
    if (quantita === null || !Number.isFinite(quantita) || quantita <= 0) {
      esiti.push({ descrizione, esito: "bloccato", motivo: "Quantità arrivo non valida." });
      continue;
    }

    const fornitore = normalizeOptionalText(riga.fornitore);

    // 1) Risoluzione alias memorizzato → descrizione/stockKey canonici.
    const alias = findStockAlias(aliases, descrizione);
    let descrizioneCanonica = alias?.canonicalDescrizione || descrizione;
    let stockKeyTarget =
      alias?.canonicalStockKey ||
      buildNextMagazzinoStockKey({ descrizione: descrizioneCanonica, fornitore, unita }) ||
      null;

    const sourceLoadKey = buildNextMagazzinoProcurementArrivoLoadKey({
      sourceDocId: `${riga.orderId}:${riga.materialId}`,
      descrizione,
      fornitore,
      unita,
      quantita,
      data: riga.data ?? "",
    });

    // 2) Aggancio voce esistente (id/stockKey/identità esatta).
    let targetIndex = findInventarioIndexByDescriptor(items, {
      stockKey: stockKeyTarget,
      descrizione: descrizioneCanonica,
      fornitore,
      unita,
    });

    let aliasCreato = false;

    // 3) Se nessun aggancio e nessun alias noto, cerca un "simile" e chiedi conferma.
    if (targetIndex < 0 && !alias && args.onSimileTrovato) {
      const simileIndex = findSimileIndex(items, descrizione, fornitore, unita);
      if (simileIndex >= 0) {
        const simile = items[simileIndex];
        const scelta = await args.onSimileTrovato({
          descrizioneArrivo: descrizione,
          candidato: {
            descrizione: simile.descrizione,
            fornitore: simile.fornitore,
            unita: simile.unita,
            quantita: simile.quantita,
          },
        });
        if (scelta === "unisci") {
          targetIndex = simileIndex;
          descrizioneCanonica = simile.descrizione;
          stockKeyTarget = simile.stockKey ?? stockKeyTarget;
          aliasDaSalvare.push({
            descrizioneSorgente: descrizione,
            canonicalDescrizione: simile.descrizione,
            canonicalStockKey: simile.stockKey,
            fornitore: simile.fornitore,
            unita: simile.unita,
          });
          aliasCreato = true;
        }
      }
    }

    // 4) Dedup: se questa identica riga d'arrivo è già stata caricata, salta.
    if (targetIndex >= 0 && hasNextMagazzinoStockLoadKey(items[targetIndex].stockLoadKeys, sourceLoadKey)) {
      esiti.push({ descrizione, esito: "gia_caricato" });
      continue;
    }

    // 5) Applica: consolida o crea.
    if (targetIndex >= 0) {
      const target = items[targetIndex];
      items[targetIndex] = {
        ...target,
        quantita: target.quantita + quantita,
        unita,
        stockKey: target.stockKey ?? stockKeyTarget,
        fornitore: target.fornitore ?? fornitore,
        stockLoadKeys: mergeNextMagazzinoStockLoadKeys(target.stockLoadKeys, sourceLoadKey),
      };
      esiti.push({ descrizione, esito: "consolidato", aliasCreato });
    } else {
      items.push({
        id: generateId(),
        descrizione: descrizioneCanonica,
        quantita,
        unita,
        stockKey: stockKeyTarget,
        stockLoadKeys: mergeNextMagazzinoStockLoadKeys([], sourceLoadKey),
        fornitore,
        fotoUrl: null,
        fotoStoragePath: null,
      });
      esiti.push({ descrizione, esito: "creato", aliasCreato });
    }
    modificato = true;
  }

  if (modificato) {
    const sorted = sortInventarioItems(items);
    const records = [
      ...sorted.map((item) => buildInventarioRecord(rawById.get(item.id), item)),
      ...passthroughRaw,
    ];
    await setItemSync(INVENTARIO_KEY, wrapStoredArray(shape, records));
    // Readback di conferma: setItemSync ingoia il blocco del write barrier e gli
    // errori Firestore, quindi senza rilettura un carico fallito verrebbe
    // riportato come riuscito. Se non risulta persistito, segnaliamo errore.
    const savedRaw = await getItemSync(INVENTARIO_KEY);
    if (JSON.stringify(unwrapStoredArray(savedRaw)) !== JSON.stringify(records)) {
      throw new Error(
        "Carico in magazzino non confermato: la scrittura dell'inventario non risulta salvata.",
      );
    }
  }

  for (const alias of aliasDaSalvare) {
    await saveStockAlias({
      descrizioneSorgente: alias.descrizioneSorgente,
      canonicalDescrizione: alias.canonicalDescrizione,
      canonicalStockKey: alias.canonicalStockKey,
      fornitore: alias.fornitore,
      unita: alias.unita,
      nowMs: args.nowMs,
    });
  }

  return {
    righe: esiti,
    creati: esiti.filter((e) => e.esito === "creato").length,
    consolidati: esiti.filter((e) => e.esito === "consolidato").length,
    giaCaricati: esiti.filter((e) => e.esito === "gia_caricato").length,
    bloccati: esiti.filter((e) => e.esito === "bloccato").length,
    aliasCreati: aliasDaSalvare.length,
    inventarioAggiornato: modificato,
  };
}
