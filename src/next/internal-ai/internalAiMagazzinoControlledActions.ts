import { runWithCloneWriteScopedAllowance } from "../../utils/cloneWriteBarrier";
import { getItemSync, setItemSync } from "../../utils/storageSync";
import {
  readNextDocumentiCostiFleetSnapshot,
  type NextDocumentiMagazzinoSupportDocument,
} from "../domain/nextDocumentiCostiDomain";
import { readNextProcurementSnapshot } from "../domain/nextProcurementDomain";
import {
  areNextMagazzinoUnitsCompatible,
  buildNextMagazzinoStockKey,
  buildNextMagazzinoStockLoadKey,
  hasNextMagazzinoStockLoadKey,
  looksLikeNextMagazzinoAdBlueMaterial,
  mergeNextMagazzinoStockLoadKeys,
  normalizeNextMagazzinoMaterialIdentity,
  normalizeNextMagazzinoStockUnit,
  normalizeNextMagazzinoStockUnitLoose,
  type NextMagazzinoStockUnit,
} from "../domain/nextMagazzinoStockContract";
import type { InternalAiUniversalHandoffPayload } from "./internalAiUniversalTypes";

const INVENTARIO_KEY = "@inventario";
const PROCUREMENT_DEDUP_WINDOW_DAYS = 14;
const INTERNAL_AI_MAGAZZINO_INLINE_SCOPE = "internal_ai_magazzino_inline_magazzino";

type RawDatasetRecord = Record<string, unknown>;
type StoredArrayShape = "array" | "items" | "value" | "value.items";

type ProcurementStockRow = {
  id: string;
  orderId: string;
  orderReference: string;
  materialId: string;
  descrizione: string;
  supplierName: string | null;
  quantita: number | null;
  unita: string | null;
  arrivalDateLabel: string | null;
};

export type InternalAiMagazzinoInlineDecision =
  | "riconcilia_senza_carico"
  | "carica_stock_adblue"
  | "da_verificare"
  | "fuori_perimetro";

export type InternalAiMagazzinoInlineInventoryItem = {
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

export type InternalAiMagazzinoInlineCandidate = {
  id: string;
  sourceDocId: string;
  rowIndex: number;
  documentLabel: string;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  nomeFile: string | null;
  fileUrl: string | null;
  daVerificareDocumento: boolean;
  descrizione: string;
  fornitore: string | null;
  quantita: number | null;
  data: string | null;
  unita: string | null;
  unitaSource: "inventario" | "procurement" | "missing";
  stockKey: string | null;
  inventoryMatchId: string | null;
  procurementCoverageOrderId: string | null;
  procurementCoverageReason: string | null;
  procurementCoverageAlreadyLoaded: boolean;
  sourceLoadKey: string;
  duplicateBySource: boolean;
  isInvoiceDocument: boolean;
  isAdBlueCandidate: boolean;
  hasUnitConflict: boolean;
  canReconcileWithoutLoad: boolean;
  decision: InternalAiMagazzinoInlineDecision;
  decisionReason: string | null;
  blockedReason: string | null;
  canLoad: boolean;
  prezzoUnitario: number | null;
  importoDocumento: number | null;
};

export type InternalAiMagazzinoInlineResolution =
  | {
      status: "pronto";
      candidate: InternalAiMagazzinoInlineCandidate;
      message: string;
    }
  | {
      status: "da_verificare";
      candidate: InternalAiMagazzinoInlineCandidate | null;
      message: string;
    };

export type InternalAiMagazzinoInlineOutcome = {
  action: "riconcilia_senza_carico" | "carica_stock_adblue";
  title: string;
  message: string;
  documentLabel: string;
  materialLabel: string;
  quantita: number | null;
  unita: string | null;
  inventoryLabel: string | null;
  inventoryQuantityAfter: number | null;
  documentLinked: boolean;
  stockChanged: boolean;
  prezzoUnitario: number | null;
  importoDocumento: number | null;
  finalState: string;
};

export type InternalAiMagazzinoInlineContext = {
  loadedAt: string;
  inventoryItems: InternalAiMagazzinoInlineInventoryItem[];
  inventoryRawMap: Record<string, RawDatasetRecord>;
  inventoryShape: StoredArrayShape;
  candidates: InternalAiMagazzinoInlineCandidate[];
};

function generateId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
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

function getObjectRecord(value: unknown): RawDatasetRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as RawDatasetRecord;
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

function buildRawMapById<T extends { id: string }>(
  items: T[],
  records: RawDatasetRecord[],
): Record<string, RawDatasetRecord> {
  return items.reduce<Record<string, RawDatasetRecord>>((acc, item, index) => {
    const record = records[index];
    if (record) {
      acc[item.id] = record;
    }
    return acc;
  }, {});
}

function parseStoredDate(value: string | null | undefined): Date | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const parsed = new Date(`${normalized}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parts = normalized.replace(/\//g, " ").split(/\s+/).filter(Boolean);
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    const parsed = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function absDateDiffDays(left: string | null | undefined, right: string | null | undefined): number | null {
  const leftDate = parseStoredDate(left);
  const rightDate = parseStoredDate(right);
  if (!leftDate || !rightDate) return null;
  return Math.abs(Math.round((leftDate.getTime() - rightDate.getTime()) / 86400000));
}

function sameMaterialIdentity(
  left: {
    descrizione?: string | null | undefined;
    fornitore?: string | null | undefined;
    supplierName?: string | null | undefined;
  },
  right: {
    descrizione?: string | null | undefined;
    fornitore?: string | null | undefined;
    supplierName?: string | null | undefined;
  },
) {
  return (
    normalizeNextMagazzinoMaterialIdentity(left.descrizione) ===
      normalizeNextMagazzinoMaterialIdentity(right.descrizione) &&
    (normalizeNextMagazzinoMaterialIdentity(left.fornitore ?? left.supplierName) ||
      "NOFORNITORE") ===
      (normalizeNextMagazzinoMaterialIdentity(right.fornitore ?? right.supplierName) ||
        "NOFORNITORE")
  );
}

function looksLikeDocumentoMagazzinoFattura(value: unknown): boolean {
  return normalizeNextMagazzinoMaterialIdentity(value).includes("FATTURA");
}

function buildDocumentoStockLabel(args: {
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  nomeFile: string | null;
  sourceDocId: string;
}): string {
  return (
    [args.tipoDocumento, args.numeroDocumento, args.nomeFile]
      .map((entry) => normalizeText(entry))
      .filter(Boolean)
      .join(" · ") || args.sourceDocId
  );
}

function matchesDocumentoHint(value: unknown, hint: unknown): boolean {
  const left = normalizeNextMagazzinoMaterialIdentity(value);
  const right = normalizeNextMagazzinoMaterialIdentity(hint);
  return Boolean(left && right && (left.includes(right) || right.includes(left)));
}

function resolveUniqueSupportedUnit(
  values: Array<string | null | undefined>,
): NextMagazzinoStockUnit | null {
  const unique = Array.from(
    new Set(
      values
        .map((value) => normalizeNextMagazzinoStockUnit(value))
        .filter((value): value is NextMagazzinoStockUnit => Boolean(value)),
    ),
  );
  return unique.length === 1 ? unique[0] : null;
}

function normalizeInventoryItem(
  raw: unknown,
  index: number,
): InternalAiMagazzinoInlineInventoryItem | null {
  const record = getObjectRecord(raw);
  if (!record) return null;
  const descrizione =
    normalizeOptionalText(record.descrizione) ??
    normalizeOptionalText(record.label) ??
    normalizeOptionalText(record.nome);
  const quantita =
    normalizeNumber(record.quantitaTotale) ?? normalizeNumber(record.quantita);
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

function sortInventoryItems(
  items: InternalAiMagazzinoInlineInventoryItem[],
): InternalAiMagazzinoInlineInventoryItem[] {
  return [...items].sort((left, right) =>
    left.descrizione.localeCompare(right.descrizione, "it", {
      sensitivity: "base",
    }),
  );
}

function buildInventarioRecord(
  baseRecord: RawDatasetRecord | undefined,
  item: InternalAiMagazzinoInlineInventoryItem,
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

function findInventoryIndexByDescriptor(
  inventory: InternalAiMagazzinoInlineInventoryItem[],
  descriptor: {
    inventarioRefId?: string | null;
    stockKey?: string | null;
    descrizione?: string | null;
    fornitore?: string | null;
    unita?: string | null;
  },
): number {
  if (descriptor.inventarioRefId) {
    const byId = inventory.findIndex((item) => item.id === descriptor.inventarioRefId);
    if (byId >= 0) return byId;
  }

  if (descriptor.stockKey) {
    const byStockKey = inventory.findIndex((item) => item.stockKey === descriptor.stockKey);
    if (byStockKey >= 0) return byStockKey;
  }

  return inventory.findIndex(
    (item) =>
      Boolean(descriptor.unita) &&
      areNextMagazzinoUnitsCompatible(item.unita, descriptor.unita) &&
      sameMaterialIdentity(item, descriptor),
  );
}

async function persistInventoryItems(
  context: InternalAiMagazzinoInlineContext,
  nextItems: InternalAiMagazzinoInlineInventoryItem[],
): Promise<Record<string, RawDatasetRecord>> {
  const records = nextItems.map((item) => buildInventarioRecord(context.inventoryRawMap[item.id], item));
  await setItemSync(INVENTARIO_KEY, wrapStoredArray(context.inventoryShape, records));
  const savedValue = unwrapStoredArray(await getItemSync(INVENTARIO_KEY));
  if (JSON.stringify(savedValue) !== JSON.stringify(records)) {
    throw new Error("Persistenza inventario non confermata.");
  }
  return buildRawMapById(nextItems, records);
}

function buildProcurementArrivedRows(
  procurementSnapshot: Awaited<ReturnType<typeof readNextProcurementSnapshot>>,
): ProcurementStockRow[] {
  return (procurementSnapshot.orders ?? []).flatMap((order) =>
    order.materials
      .filter((material) => material.arrived)
      .map((material) => ({
        id: `${order.id}:${material.id}`,
        orderId: order.id,
        orderReference: order.orderReference,
        materialId: material.id,
        supplierName: normalizeOptionalText(order.supplierName),
        descrizione: material.descrizione,
        quantita: material.quantita,
        unita: normalizeOptionalText(normalizeNextMagazzinoStockUnitLoose(material.unita)),
        arrivalDateLabel: material.arrivalDateLabel,
      })),
  );
}

function buildInvoiceCandidates(args: {
  supportDocs: NextDocumentiMagazzinoSupportDocument[];
  inventoryItems: InternalAiMagazzinoInlineInventoryItem[];
  procurementRows: ProcurementStockRow[];
}): InternalAiMagazzinoInlineCandidate[] {
  const { supportDocs, inventoryItems, procurementRows } = args;

  return supportDocs.flatMap((documento) => {
    const candidates: InternalAiMagazzinoInlineCandidate[] = [];
    documento.voci.forEach((row, rowIndex) => {
      const descrizione = normalizeText(row.descrizione);
      if (!descrizione) return;

      const candidateId = `${documento.sourceDocId}:${rowIndex}`;
      const inventoryMatches = inventoryItems.filter((item) =>
        sameMaterialIdentity(item, {
          descrizione,
          fornitore: documento.fornitore,
        }),
      );
      const procurementMatches = procurementRows.filter((entry) =>
        sameMaterialIdentity(entry, {
          descrizione,
          fornitore: documento.fornitore,
        }),
      );

        const inventoryUnit = resolveUniqueSupportedUnit(
          inventoryMatches.map((item) => item.unita),
        );
        const procurementUnit = resolveUniqueSupportedUnit(
          procurementMatches.map((entry) => entry.unita),
        );
        const resolvedUnit = inventoryUnit ?? procurementUnit;
        const unitaSource: InternalAiMagazzinoInlineCandidate["unitaSource"] = inventoryUnit
          ? "inventario"
          : procurementUnit
            ? "procurement"
            : "missing";
        const hasUnitConflict =
          Boolean(resolvedUnit) &&
          (inventoryMatches.some(
            (item) => normalizeNextMagazzinoStockUnit(item.unita) !== resolvedUnit,
          ) ||
            procurementMatches.some(
              (entry) => normalizeNextMagazzinoStockUnit(entry.unita) !== resolvedUnit,
            ));
        const stockKey =
          resolvedUnit
            ? buildNextMagazzinoStockKey({
                descrizione,
                fornitore: documento.fornitore,
                unita: resolvedUnit,
              })
            : null;
        const inventoryIndex =
          stockKey || resolvedUnit
            ? findInventoryIndexByDescriptor(inventoryItems, {
                stockKey,
                descrizione,
                fornitore: documento.fornitore,
                unita: resolvedUnit,
              })
            : -1;
        const inventoryMatchId = inventoryIndex >= 0 ? inventoryItems[inventoryIndex].id : null;
        const sourceLoadKey = buildNextMagazzinoStockLoadKey({
          sourceType: "DOCUMENTO_MAGAZZINO",
          sourceDocId: documento.sourceDocId,
          rowIndex,
          descrizione,
          fornitore: documento.fornitore,
          unita: resolvedUnit ?? "",
          quantita: row.quantita,
          data: documento.data,
        });
        const duplicateBySource = inventoryItems.some((item) =>
          hasNextMagazzinoStockLoadKey(item.stockLoadKeys, sourceLoadKey),
        );
        const documentLabel = buildDocumentoStockLabel({
          tipoDocumento: documento.tipoDocumento,
          numeroDocumento: documento.numeroDocumento,
          nomeFile: documento.nomeFile,
          sourceDocId: documento.sourceDocId,
        });
        const isInvoiceDocument = looksLikeDocumentoMagazzinoFattura(
          documento.tipoDocumento ?? documentLabel,
        );
        const isAdBlueCandidate =
          looksLikeNextMagazzinoAdBlueMaterial(descrizione) ||
          looksLikeNextMagazzinoAdBlueMaterial(documento.fornitore) ||
          looksLikeNextMagazzinoAdBlueMaterial(documentLabel) ||
          inventoryMatches.some((item) => looksLikeNextMagazzinoAdBlueMaterial(item.descrizione));
        const procurementCoverage = procurementMatches.find((entry) => {
          if (!resolvedUnit || !areNextMagazzinoUnitsCompatible(entry.unita, resolvedUnit)) {
            return false;
          }
          if (
            typeof row.quantita !== "number" ||
            !Number.isFinite(row.quantita) ||
            typeof entry.quantita !== "number" ||
            !Number.isFinite(entry.quantita)
          ) {
            return false;
          }
          if (Math.abs(entry.quantita - row.quantita) > 0.001) {
            return false;
          }
          const dateDiff = absDateDiffDays(documento.data, entry.arrivalDateLabel);
          return dateDiff !== null && dateDiff <= PROCUREMENT_DEDUP_WINDOW_DAYS;
        });
        const procurementCoverageLoadKey = procurementCoverage
          ? buildNextMagazzinoStockLoadKey({
              sourceType: "PROCUREMENT_ARRIVO",
              sourceDocId: procurementCoverage.id,
              descrizione: procurementCoverage.descrizione,
              fornitore: procurementCoverage.supplierName,
              unita: resolvedUnit ?? procurementCoverage.unita,
              quantita: procurementCoverage.quantita,
              data: procurementCoverage.arrivalDateLabel,
            })
          : null;
        const procurementCoverageAlreadyLoaded =
          procurementCoverageLoadKey !== null &&
          inventoryItems.some((item) =>
            hasNextMagazzinoStockLoadKey(item.stockLoadKeys, procurementCoverageLoadKey),
          );

      let blockedReason: string | null = null;
      let canLoad = false;
      let canReconcileWithoutLoad = false;
      let decision: InternalAiMagazzinoInlineDecision = "da_verificare";
      let decisionReason: string | null = null;

        if (documento.daVerificare) {
          blockedReason =
            "Documento marcato `DA VERIFICARE`: nessuna azione automatica consentita.";
          decisionReason = blockedReason;
        } else if (row.quantita === null || row.quantita <= 0) {
          blockedReason = "Quantita documento non leggibile.";
          decisionReason = blockedReason;
        } else if (!isInvoiceDocument) {
          blockedReason = "La deroga scrivente e limitata alle fatture di magazzino.";
          decision = "fuori_perimetro";
          decisionReason = blockedReason;
        } else if (!resolvedUnit) {
          blockedReason = "Unita di misura non abbastanza forte per una conferma inline sicura.";
          decisionReason = blockedReason;
        } else if (hasUnitConflict) {
          blockedReason = "Unita incoerente con materiale o arrivo gia presenti: blocco automatico.";
          decisionReason = blockedReason;
        } else if (duplicateBySource) {
          blockedReason =
            "Questa riga documento risulta gia consolidata su inventario: niente doppio carico.";
          decisionReason = blockedReason;
        } else if (procurementCoverage && inventoryMatchId && procurementCoverageAlreadyLoaded) {
          canReconcileWithoutLoad = true;
          decision = "riconcilia_senza_carico";
          decisionReason =
            "Arrivo procurement compatibile e materiale gia presente: collega la fattura senza aumentare lo stock.";
        } else if (procurementCoverage && inventoryMatchId) {
          blockedReason =
            "Arrivo procurement compatibile e materiale inventario trovati, ma la sorgente procurement non risulta ancora consolidata a stock: non usare la sola riconciliazione documento.";
          decisionReason = blockedReason;
        } else if (procurementCoverage) {
          blockedReason =
            "Arrivo procurement compatibile rilevato ma manca una voce inventario coerente da riconciliare: `DA VERIFICARE`.";
          decisionReason = blockedReason;
        } else if (!isAdBlueCandidate) {
          blockedReason =
            "Scrittura da fattura aperta solo per AdBlue non ancora caricato o per riconciliazioni senza carico.";
          decision = "fuori_perimetro";
          decisionReason = blockedReason;
        } else if (resolvedUnit !== "lt") {
          blockedReason = "AdBlue rilevato con unita non coerente: atteso `lt`, aggiornamento bloccato.";
          decisionReason = blockedReason;
        } else {
          canLoad = true;
          decision = "carica_stock_adblue";
          decisionReason = inventoryMatchId
            ? "Fattura AdBlue pronta: aumenta la giacenza della voce inventario esistente."
            : "Fattura AdBlue pronta: crea o aggiorna il materiale AdBlue in inventario e aumenta la giacenza.";
        }

      candidates.push({
        id: candidateId,
        sourceDocId: documento.sourceDocId,
        rowIndex,
        documentLabel,
        tipoDocumento: documento.tipoDocumento,
        numeroDocumento: documento.numeroDocumento,
        nomeFile: documento.nomeFile,
        fileUrl: documento.fileUrl,
        daVerificareDocumento: documento.daVerificare,
        descrizione,
        fornitore: documento.fornitore,
        quantita: row.quantita,
        data: documento.data,
        unita: resolvedUnit,
        unitaSource,
        stockKey: stockKey ?? null,
        inventoryMatchId,
        procurementCoverageOrderId: procurementCoverage?.orderId ?? null,
        procurementCoverageReason: procurementCoverage
          ? `Ordine ${procurementCoverage.orderReference} · arrivo ${procurementCoverage.arrivalDateLabel || "-"}`
          : null,
        procurementCoverageAlreadyLoaded,
        sourceLoadKey,
        duplicateBySource,
        isInvoiceDocument,
        isAdBlueCandidate,
        hasUnitConflict,
        canReconcileWithoutLoad,
        decision,
        decisionReason,
        blockedReason,
        canLoad,
        prezzoUnitario: row.prezzoUnitario,
        importoDocumento: row.importo,
      });
    });
    return candidates;
  });
}

export async function loadInternalAiMagazzinoInlineContext(): Promise<InternalAiMagazzinoInlineContext> {
  const [inventoryRaw, documentiCostiSnapshot, procurementSnapshot] = await Promise.all([
    getItemSync(INVENTARIO_KEY),
    readNextDocumentiCostiFleetSnapshot({ includeCloneDocuments: false }),
    readNextProcurementSnapshot({ includeCloneOverlays: false }),
  ]);

  const rawItems = unwrapStoredArray(inventoryRaw);
  const inventoryItems: InternalAiMagazzinoInlineInventoryItem[] = [];
  const inventoryRawMap: Record<string, RawDatasetRecord> = {};

  rawItems.forEach((entry, index) => {
    const normalized = normalizeInventoryItem(entry, index);
    if (!normalized) return;
    inventoryItems.push(normalized);
    const record = getObjectRecord(entry);
    if (record) {
      inventoryRawMap[normalized.id] = { ...record };
    }
  });

  const procurementRows = buildProcurementArrivedRows(procurementSnapshot);
  const candidates = buildInvoiceCandidates({
    supportDocs: documentiCostiSnapshot.materialCostSupport.documents ?? [],
    inventoryItems,
    procurementRows,
  });

  return {
    loadedAt: new Date().toISOString(),
    inventoryItems,
    inventoryRawMap,
    inventoryShape: detectStoredArrayShape(inventoryRaw),
    candidates,
  };
}

export function resolveInternalAiMagazzinoInlineRoute(args: {
  context: InternalAiMagazzinoInlineContext;
  handoffPayload: InternalAiUniversalHandoffPayload | null;
}): InternalAiMagazzinoInlineResolution | null {
  const payload = args.handoffPayload;
  if (!payload) return null;

  const isWarehouseInvoiceFlow =
    normalizeText(payload.prefillCanonico.warehouseInvoiceHint) === "1" ||
    normalizeText(payload.prefillCanonico.flusso) === "fatture_magazzino";
  if (!isWarehouseInvoiceFlow) {
    return null;
  }

  const documentHint =
    normalizeText(payload.prefillCanonico.documentoNome) ||
    normalizeText(payload.datiEstrattiNormalizzati.fileName);
  const supplierHint = normalizeText(payload.prefillCanonico.fornitore);
  const materialHint =
    normalizeText(payload.prefillCanonico.materiale) ||
    normalizeText(payload.prefillCanonico.queryMateriale);
  const modeHint = normalizeText(payload.prefillCanonico.warehouseInvoiceMode);

  const scoredCandidates = args.context.candidates
    .map((candidate) => {
      let score = 0;
      if (
        documentHint &&
        [
          candidate.nomeFile,
          candidate.numeroDocumento,
          candidate.sourceDocId,
          candidate.documentLabel,
        ].some((value) => matchesDocumentoHint(value, documentHint))
      ) {
        score += 6;
      }
      if (supplierHint && matchesDocumentoHint(candidate.fornitore, supplierHint)) {
        score += 3;
      }
      if (
        materialHint &&
        [candidate.descrizione, candidate.documentLabel, candidate.nomeFile].some((value) =>
          matchesDocumentoHint(value, materialHint),
        )
      ) {
        score += 3;
      }
      if (modeHint === "carica_stock_adblue" && candidate.decision === "carica_stock_adblue") {
        score += 2;
      }
      if (
        modeHint === "riconcilia_o_verifica" &&
        candidate.decision === "riconcilia_senza_carico"
      ) {
        score += 1;
      }
      return { candidate, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  if (scoredCandidates.length === 0) {
    return {
      status: "da_verificare",
      candidate: null,
      message:
        "Nessuna riga fattura di magazzino ha un match abbastanza forte con il documento allegato.",
    };
  }

  const bestScore = scoredCandidates[0]?.score ?? 0;
  if (bestScore < 6) {
    return {
      status: "da_verificare",
      candidate: null,
      message:
        "Il match documento/materiale non e abbastanza forte per un'esecuzione inline sicura.",
    };
  }

  const bestCandidates = scoredCandidates.filter((entry) => entry.score === bestScore);
  if (bestCandidates.length !== 1) {
    return {
      status: "da_verificare",
      candidate: null,
      message:
        "Il documento aggancia piu righe compatibili: serve verifica manuale prima di qualsiasi scrittura.",
    };
  }

  const selected = bestCandidates[0].candidate;
  if (selected.canReconcileWithoutLoad || selected.canLoad) {
    return {
      status: "pronto",
      candidate: selected,
      message:
        selected.decisionReason ??
        "La fattura selezionata puo essere gestita inline nel perimetro controllato Magazzino.",
    };
  }

  return {
    status: "da_verificare",
    candidate: selected,
    message:
      selected.blockedReason ??
      selected.decisionReason ??
      "Il match della fattura non e abbastanza forte per una scrittura automatica.",
  };
}

export async function executeInternalAiMagazzinoInlineAction(args: {
  context: InternalAiMagazzinoInlineContext;
  candidate: InternalAiMagazzinoInlineCandidate;
}): Promise<{
  context: InternalAiMagazzinoInlineContext;
  outcome: InternalAiMagazzinoInlineOutcome;
}> {
  const { context, candidate } = args;
  if (!candidate.unita) {
    throw new Error("Unita non disponibile per l'azione inline.");
  }

  if (
    candidate.decision !== "riconcilia_senza_carico" &&
    candidate.decision !== "carica_stock_adblue"
  ) {
    throw new Error("Azione inline fuori perimetro.");
  }

  let nextItems = context.inventoryItems;
  let updatedItemId: string | null = null;

  if (candidate.decision === "riconcilia_senza_carico") {
    const targetIndex = findInventoryIndexByDescriptor(context.inventoryItems, {
      inventarioRefId: candidate.inventoryMatchId,
      stockKey: candidate.stockKey,
      descrizione: candidate.descrizione,
      fornitore: candidate.fornitore,
      unita: candidate.unita,
    });
    if (targetIndex < 0) {
      throw new Error("Inventario target non trovato per la riconciliazione.");
    }

    updatedItemId = context.inventoryItems[targetIndex].id;
    nextItems = context.inventoryItems.map((item, index) => {
      if (index !== targetIndex) return item;
      return {
        ...item,
        unita: candidate.unita ?? item.unita,
        stockKey: candidate.stockKey ?? item.stockKey,
        fornitore: candidate.fornitore ?? item.fornitore,
        stockLoadKeys: mergeNextMagazzinoStockLoadKeys(item.stockLoadKeys, candidate.sourceLoadKey),
      } satisfies InternalAiMagazzinoInlineInventoryItem;
    });
  } else {
    if (candidate.quantita === null) {
      throw new Error("Quantita non disponibile per il carico AdBlue.");
    }

    const targetIndex = findInventoryIndexByDescriptor(context.inventoryItems, {
      inventarioRefId: candidate.inventoryMatchId,
      stockKey: candidate.stockKey,
      descrizione: candidate.descrizione,
      fornitore: candidate.fornitore,
      unita: candidate.unita,
    });
    if (targetIndex >= 0) {
      updatedItemId = context.inventoryItems[targetIndex].id;
      nextItems = context.inventoryItems.map((item, index) => {
        if (index !== targetIndex) return item;
        return {
          ...item,
          quantita: item.quantita + candidate.quantita!,
          unita: candidate.unita!,
          stockKey: candidate.stockKey ?? item.stockKey,
          fornitore: candidate.fornitore ?? item.fornitore,
          stockLoadKeys: mergeNextMagazzinoStockLoadKeys(item.stockLoadKeys, candidate.sourceLoadKey),
        } satisfies InternalAiMagazzinoInlineInventoryItem;
      });
    } else {
      updatedItemId = generateId();
      nextItems = [
        ...context.inventoryItems,
        {
          id: updatedItemId,
          descrizione: candidate.descrizione,
          quantita: candidate.quantita,
          unita: candidate.unita,
          stockKey: candidate.stockKey,
          stockLoadKeys: mergeNextMagazzinoStockLoadKeys([], candidate.sourceLoadKey),
          fornitore: candidate.fornitore ?? null,
          fotoUrl: null,
          fotoStoragePath: null,
        } satisfies InternalAiMagazzinoInlineInventoryItem,
      ];
    }
  }

  const sortedItems = sortInventoryItems(nextItems);
  await runWithCloneWriteScopedAllowance(INTERNAL_AI_MAGAZZINO_INLINE_SCOPE, async () => {
    await persistInventoryItems(context, sortedItems);
  });

  const refreshedContext = await loadInternalAiMagazzinoInlineContext();
  const updatedItem = refreshedContext.inventoryItems.find((item) => item.id === updatedItemId) ?? null;
  const inventoryQuantityAfter = updatedItem?.quantita ?? null;

  const outcome: InternalAiMagazzinoInlineOutcome =
    candidate.decision === "riconcilia_senza_carico"
      ? {
          action: "riconcilia_senza_carico",
          title: "Riconciliazione completata nel modale IA",
          message:
            "Documento collegato alla voce inventario esistente senza aumentare lo stock.",
          documentLabel: candidate.documentLabel,
          materialLabel: candidate.descrizione,
          quantita: candidate.quantita,
          unita: candidate.unita,
          inventoryLabel: updatedItem?.descrizione ?? candidate.descrizione,
          inventoryQuantityAfter,
          documentLinked: true,
          stockChanged: false,
          prezzoUnitario: candidate.prezzoUnitario,
          importoDocumento: candidate.importoDocumento,
          finalState: "Riconciliato senza aumento stock",
        }
      : {
          action: "carica_stock_adblue",
          title: "Carico AdBlue completato nel modale IA",
          message:
            "Materiale AdBlue aggiornato in inventario e documento collegato nel perimetro consentito.",
          documentLabel: candidate.documentLabel,
          materialLabel: updatedItem?.descrizione ?? candidate.descrizione,
          quantita: candidate.quantita,
          unita: candidate.unita,
          inventoryLabel: updatedItem?.descrizione ?? candidate.descrizione,
          inventoryQuantityAfter,
          documentLinked: true,
          stockChanged: true,
          prezzoUnitario: candidate.prezzoUnitario,
          importoDocumento: candidate.importoDocumento,
          finalState: "Carico AdBlue eseguito",
        };

  return {
    context: refreshedContext,
    outcome,
  };
}
