import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import {
  NEXT_ANAGRAFICHE_FLOTTA_DOMAIN,
  normalizeNextMezzoTarga,
} from "../nextAnagraficheFlottaDomain";
import {
  type NextMezzoOperativitaTecnicaSnapshot,
  readNextMezzoOperativitaTecnicaSnapshot,
} from "../nextOperativitaTecnicaDomain";
import {
  type NextDocumentiCostiLegacyViewItem,
  type NextDocumentiCostiProcurementSupportSnapshot,
  type NextMezzoDocumentiCostiSnapshot,
  mapNextDocumentiCostiItemsToLegacyView,
  readNextDocumentiCostiProcurementSupportSnapshot,
  readNextMezzoDocumentiCostiSnapshot,
} from "./nextDocumentiCostiDomain";
import {
  buildNextLavoriLegacyDossierView,
  type NextLavoriLegacyViewItem,
  type NextMezzoLavoriSnapshot,
  readNextMezzoLavoriSnapshot,
} from "./nextLavoriDomain";
import type { NextScheduledMaintenance } from "./nextManutenzioniDomain";
import {
  buildNextGommeStateByAsse,
  buildNextGommeStraordinarieEvents,
  type NextGommePerAsseStatus,
  type NextGommeStraordinarioEvent,
  type NextManutenzioneLegacyViewItem,
  type NextMezzoManutenzioniGommeSnapshot,
  mapNextManutenzioniItemsToLegacyView,
  readNextMezzoManutenzioniGommeSnapshot,
} from "./nextManutenzioniGommeDomain";
import {
  buildNextMaterialiMovimentiLegacyDossierView,
  buildNextMezzoMaterialiMovimentiSnapshot,
  type NextMaterialiMovimentiLegacyDossierItem,
  type NextMezzoMaterialiMovimentiSnapshot,
  readNextMaterialiMovimentiSnapshot,
} from "./nextMaterialiMovimentiDomain";
import {
  type NextMezzoRifornimentiSnapshot,
  readNextMezzoRifornimentiSnapshot,
} from "./nextRifornimentiDomain";

const STORAGE_COLLECTION = "storage";
const MEZZI_DATASET_KEY = "@mezzi_aziendali";
const ANALISI_ECONOMICA_COLLECTION = "@analisi_economica_mezzi";

type RawRecord = Record<string, unknown>;

type NextLegacyDatasetShape =
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "missing"
  | "unsupported";

export type NextDossierDomainSectionState<TSnapshot> = {
  status: "idle" | "loading" | "success" | "error";
  snapshot: TSnapshot | null;
  error: string | null;
};

export type NextDossierMezzoIdentity = {
  id: string;
  targa: string;
  anno: string | null;
  categoria: string | null;
  massaComplessiva: string | null;
  dataImmatricolazione: string | null;
  dataScadenzaRevisione: string | null;
  marca: string | null;
  modello: string | null;
  marcaModello: string | null;
  colore: string | null;
  telaio: string | null;
  proprietario: string | null;
  assicurazione: string | null;
  cilindrata: string | null;
  potenza: string | null;
  note: string | null;
  fotoUrl: string | null;
  fotoStoragePath: string | null;
  fotoPath: string | null;
  autistaNome: string | null;
  manutenzioneContratto: string | null;
  manutenzioneDataInizio: string | null;
  manutenzioneDataFine: string | null;
  manutenzioneKmMax: string | null;
  manutenzioneProgrammata: boolean;
  librettoUrl: string | null;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof MEZZI_DATASET_KEY;
  datasetShape: NextLegacyDatasetShape;
  quality: "certo" | "parziale" | "da_verificare";
  flags: string[];
};

export type NextDossierAnalisiEconomicaSavedRecord = {
  riepilogoBreve: string | null;
  analisiCosti: string | null;
  anomalie: string | null;
  fornitoriNotevoli: string | null;
  updatedAtTimestamp: number | null;
  targa: string | null;
  sourceCollection: typeof ANALISI_ECONOMICA_COLLECTION;
  sourceDocId: string;
  quality: "certo" | "parziale" | "non_disponibile";
  flags: string[];
};

export type NextDossierAnalisiEconomicaSupportSnapshot = {
  mezzoTarga: string;
  savedAnalysis: NextDossierAnalisiEconomicaSavedRecord | null;
  documentCounts: {
    total: number;
    preventivi: number;
    fatture: number;
    withAmount: number;
    withUnknownCurrency: number;
  };
  sourceCollection: typeof ANALISI_ECONOMICA_COLLECTION;
  sourceDocId: string;
  limitations: string[];
};

export type NextDossierMezzoOverview = {
  mezzoTarga: string;
  importedBlockLabels: string[];
  excludedBlockLabels: string[];
  nextConvergenceLabels: string[];
  readerLabels: string[];
  statusLabel: string;
  statusMeta: string;
  keySignals: string[];
  technicalLimitations: string[];
  refuelLimitations: string[];
  documentCostLimitations: string[];
  analysisLimitations: string[];
  procurementLimitations: string[];
};

export type NextDossierRifornimentoLegacyItem = {
  id: string;
  targaCamion?: string | null;
  data?: number | null;
  litri?: number | null;
  km?: number | null;
  tipo?: string | null;
  autistaNome?: string | null;
  badgeAutista?: string | null;
};

export type NextDossierFatturaPreventivoLegacyItem =
  NextDocumentiCostiLegacyViewItem;

export type NextDossierManutenzioneLegacyItem =
  NextManutenzioneLegacyViewItem;

export type NextDossierMezzoLegacyViewState = {
  mezzo: NextDossierMezzoIdentity | null;
  lavoriDaEseguire: NextLavoriLegacyViewItem[];
  lavoriInAttesa: NextLavoriLegacyViewItem[];
  lavoriEseguiti: NextLavoriLegacyViewItem[];
  movimentiMateriali: NextMaterialiMovimentiLegacyDossierItem[];
  rifornimenti: NextDossierRifornimentoLegacyItem[];
  documentiCosti: NextDossierFatturaPreventivoLegacyItem[];
  manutenzioni: NextDossierManutenzioneLegacyItem[];
  gommePerAsse: NextGommePerAsseStatus[];
  gommeStraordinarie: NextGommeStraordinarioEvent[];
  scheduledMaintenance: NextScheduledMaintenance | null;
};

export type NextAnalisiEconomicaLegacyViewState = {
  mezzo: NextDossierMezzoIdentity | null;
  documentiCosti: NextDossierFatturaPreventivoLegacyItem[];
  analisiIA: NextDossierAnalisiEconomicaSavedRecord | null;
};

export type NextDossierMezzoCompositeSnapshot = {
  mezzo: NextDossierMezzoIdentity;
  technical: NextDossierDomainSectionState<NextMezzoOperativitaTecnicaSnapshot>;
  lavori: NextDossierDomainSectionState<NextMezzoLavoriSnapshot>;
  materialiMovimenti: NextDossierDomainSectionState<NextMezzoMaterialiMovimentiSnapshot>;
  maintenance: NextDossierDomainSectionState<NextMezzoManutenzioniGommeSnapshot>;
  refuels: NextDossierDomainSectionState<NextMezzoRifornimentiSnapshot>;
  documentCosts: NextDossierDomainSectionState<NextMezzoDocumentiCostiSnapshot>;
  procurementPerimeter: NextDossierDomainSectionState<NextDocumentiCostiProcurementSupportSnapshot>;
  analisiEconomica: NextDossierDomainSectionState<NextDossierAnalisiEconomicaSupportSnapshot>;
  overview: NextDossierMezzoOverview;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "si";
  }
  if (typeof value === "number") return value === 1;
  return false;
}

function parseDateFlexible(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "object" && value !== null) {
    const maybe = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };

    if (typeof maybe.toDate === "function") {
      const date = maybe.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime())
        ? date
        : null;
    }

    if (typeof maybe.seconds === "number") {
      const date = new Date(maybe.seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof maybe._seconds === "number") {
      const date = new Date(maybe._seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;

  const dmyMatch = raw.match(
    /^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2}))?$/
  );
  if (!dmyMatch) return null;

  const yearRaw = Number(dmyMatch[3]);
  const year = dmyMatch[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
  const month = Number(dmyMatch[2]) - 1;
  const day = Number(dmyMatch[1]);
  const hours = Number(dmyMatch[4] ?? "12");
  const minutes = Number(dmyMatch[5] ?? "00");
  const date = new Date(year, month, day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toTimestamp(value: unknown): number | null {
  const parsed = parseDateFlexible(value);
  return parsed ? parsed.getTime() : null;
}

function unwrapStorageArray(
  rawDoc: Record<string, unknown> | unknown[] | null
): { datasetShape: NextLegacyDatasetShape; items: unknown[] } {
  if (!rawDoc) {
    return { datasetShape: "missing", items: [] };
  }

  if (Array.isArray(rawDoc)) {
    return { datasetShape: "array", items: rawDoc };
  }

  if (Array.isArray(rawDoc.items)) {
    return { datasetShape: "items", items: rawDoc.items };
  }

  if (Array.isArray((rawDoc.value as { items?: unknown[] } | undefined)?.items)) {
    return {
      datasetShape: "value.items",
      items: (rawDoc.value as { items: unknown[] }).items,
    };
  }

  if (Array.isArray(rawDoc.value)) {
    return { datasetShape: "value", items: rawDoc.value };
  }

  return { datasetShape: "unsupported", items: [] };
}

function buildMezzoId(raw: RawRecord, targa: string, index: number): string {
  const directId = normalizeText(raw.id);
  if (directId) return directId;
  return `mezzo:${targa || index}:${index}`;
}

function deriveMezzoQuality(args: {
  marca: string | null;
  modello: string | null;
  telaio: string | null;
  dataImmatricolazione: string | null;
  dataScadenzaRevisione: string | null;
}): NextDossierMezzoIdentity["quality"] {
  const { marca, modello, telaio, dataImmatricolazione, dataScadenzaRevisione } =
    args;

  if (marca && modello && telaio && dataImmatricolazione && dataScadenzaRevisione) {
    return "certo";
  }

  if (marca || modello || telaio || dataImmatricolazione || dataScadenzaRevisione) {
    return "parziale";
  }

  return "da_verificare";
}

function mapRawMezzoToIdentity(
  raw: RawRecord,
  index: number,
  datasetShape: NextLegacyDatasetShape
): NextDossierMezzoIdentity | null {
  const targa = normalizeNextMezzoTarga(raw.targa);
  if (!targa) return null;

  const marca = normalizeOptionalText(raw.marca);
  const modello = normalizeOptionalText(raw.modello);
  const telaio = normalizeOptionalText(raw.telaio);
  const dataImmatricolazione = normalizeOptionalText(raw.dataImmatricolazione);
  const dataScadenzaRevisione = normalizeOptionalText(raw.dataScadenzaRevisione);
  const derivedMarcaModello = [marca, modello].filter(Boolean).join(" ").trim();
  const marcaModello =
    normalizeOptionalText(raw.marcaModello) ?? (derivedMarcaModello || null);
  const flags: string[] = [];

  if (!marca) flags.push("marca_assente");
  if (!modello) flags.push("modello_assente");
  if (!telaio) flags.push("telaio_assente");
  if (!dataImmatricolazione) flags.push("immatricolazione_assente");
  if (!dataScadenzaRevisione) flags.push("revisione_assente");
  if (!normalizeOptionalText(raw.fotoUrl)) flags.push("foto_assente");
  if (!normalizeOptionalText(raw.librettoUrl)) flags.push("libretto_assente");
  if (!normalizeOptionalText(raw.marcaModello) && marcaModello) {
    flags.push("marca_modello_ricostruito");
  }
  if (datasetShape === "unsupported") flags.push("dataset_shape_non_supportata");

  return {
    id: buildMezzoId(raw, targa, index),
    targa,
    anno: normalizeOptionalText(raw.anno),
    categoria: normalizeOptionalText(raw.categoria),
    massaComplessiva: normalizeOptionalText(raw.massaComplessiva),
    dataImmatricolazione,
    dataScadenzaRevisione,
    marca,
    modello,
    marcaModello,
    colore: normalizeOptionalText(raw.colore),
    telaio,
    proprietario: normalizeOptionalText(raw.proprietario),
    assicurazione: normalizeOptionalText(raw.assicurazione),
    cilindrata: normalizeOptionalText(raw.cilindrata),
    potenza: normalizeOptionalText(raw.potenza),
    note: normalizeOptionalText(raw.note),
    fotoUrl: normalizeOptionalText(raw.fotoUrl),
    fotoStoragePath: normalizeOptionalText(raw.fotoStoragePath),
    fotoPath: normalizeOptionalText(raw.fotoPath),
    autistaNome: normalizeOptionalText(raw.autistaNome),
    manutenzioneContratto: normalizeOptionalText(raw.manutenzioneContratto),
    manutenzioneDataInizio: normalizeOptionalText(raw.manutenzioneDataInizio),
    manutenzioneDataFine: normalizeOptionalText(raw.manutenzioneDataFine),
    manutenzioneKmMax: normalizeOptionalText(raw.manutenzioneKmMax),
    manutenzioneProgrammata: normalizeBoolean(raw.manutenzioneProgrammata),
    librettoUrl: normalizeOptionalText(raw.librettoUrl),
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: MEZZI_DATASET_KEY,
    datasetShape,
    quality: deriveMezzoQuality({
      marca,
      modello,
      telaio,
      dataImmatricolazione,
      dataScadenzaRevisione,
    }),
    flags,
  };
}

async function readNextDossierMezzoIdentity(
  targa: string
): Promise<NextDossierMezzoIdentity | null> {
  const mezzoTarga = normalizeNextMezzoTarga(targa);
  if (!mezzoTarga) return null;

  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, MEZZI_DATASET_KEY));
  const rawDoc = snapshot.exists()
    ? ((snapshot.data() as Record<string, unknown>) ?? null)
    : null;
  const dataset = unwrapStorageArray(rawDoc);

  const items = dataset.items
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      return mapRawMezzoToIdentity(
        entry as RawRecord,
        index,
        dataset.datasetShape
      );
    })
    .filter((entry): entry is NextDossierMezzoIdentity => Boolean(entry));

  return items.find((item) => item.targa === mezzoTarga) ?? null;
}

function deriveAnalisiEconomicaQuality(args: {
  riepilogoBreve: string | null;
  analisiCosti: string | null;
  anomalie: string | null;
  fornitoriNotevoli: string | null;
  updatedAtTimestamp: number | null;
}): NextDossierAnalisiEconomicaSavedRecord["quality"] {
  const {
    riepilogoBreve,
    analisiCosti,
    anomalie,
    fornitoriNotevoli,
    updatedAtTimestamp,
  } = args;

  const contentFields = [
    riepilogoBreve,
    analisiCosti,
    anomalie,
    fornitoriNotevoli,
  ].filter(Boolean).length;

  if (contentFields >= 2 && updatedAtTimestamp !== null) {
    return "certo";
  }

  if (contentFields > 0) {
    return "parziale";
  }

  return "non_disponibile";
}

function mapSavedAnalisiEconomicaRecord(
  raw: RawRecord,
  mezzoTarga: string
): NextDossierAnalisiEconomicaSavedRecord {
  const riepilogoBreve = normalizeOptionalText(raw.riepilogoBreve);
  const analisiCosti = normalizeOptionalText(raw.analisiCosti);
  const anomalie = normalizeOptionalText(raw.anomalie);
  const fornitoriNotevoli = normalizeOptionalText(raw.fornitoriNotevoli);
  const updatedAtTimestamp = toTimestamp(raw.updatedAt);
  const flags: string[] = [];

  if (!riepilogoBreve) flags.push("riepilogo_assente");
  if (!analisiCosti) flags.push("analisi_costi_assente");
  if (!anomalie) flags.push("anomalie_assenti");
  if (!fornitoriNotevoli) flags.push("fornitori_notevoli_assenti");
  if (updatedAtTimestamp === null) flags.push("updated_at_assente");

  return {
    riepilogoBreve,
    analisiCosti,
    anomalie,
    fornitoriNotevoli,
    updatedAtTimestamp,
    targa: normalizeOptionalText(raw.targa) ?? mezzoTarga,
    sourceCollection: ANALISI_ECONOMICA_COLLECTION,
    sourceDocId: mezzoTarga,
    quality: deriveAnalisiEconomicaQuality({
      riepilogoBreve,
      analisiCosti,
      anomalie,
      fornitoriNotevoli,
      updatedAtTimestamp,
    }),
    flags,
  };
}

async function readSavedAnalisiEconomicaRecord(
  mezzoTarga: string
): Promise<NextDossierAnalisiEconomicaSavedRecord | null> {
  const snapshot = await getDoc(doc(db, ANALISI_ECONOMICA_COLLECTION, mezzoTarga));
  if (!snapshot.exists()) return null;
  return mapSavedAnalisiEconomicaRecord(
    (snapshot.data() as RawRecord) ?? {},
    mezzoTarga
  );
}

function buildAnalisiEconomicaSupportSnapshot(args: {
  mezzoTarga: string;
  documentCostsSnapshot: NextMezzoDocumentiCostiSnapshot | null;
  savedAnalysis: NextDossierAnalisiEconomicaSavedRecord | null;
  readError: string | null;
}): NextDossierAnalisiEconomicaSupportSnapshot {
  const { mezzoTarga, documentCostsSnapshot, savedAnalysis, readError } = args;
  const items = documentCostsSnapshot?.items ?? [];
  const withUnknownCurrency = items.filter(
    (item) => item.importo !== null && item.valuta === "UNKNOWN"
  ).length;

  return {
    mezzoTarga,
    savedAnalysis,
    documentCounts: {
      total: documentCostsSnapshot?.counts.total ?? 0,
      preventivi: documentCostsSnapshot?.counts.preventivi ?? 0,
      fatture: documentCostsSnapshot?.counts.fatture ?? 0,
      withAmount: documentCostsSnapshot?.counts.withAmount ?? 0,
      withUnknownCurrency,
    },
    sourceCollection: ANALISI_ECONOMICA_COLLECTION,
    sourceDocId: mezzoTarga,
    limitations: [
      "Il supporto Analisi clone resta read-only: usa documenti/costi gia normalizzati e l'eventuale analisi legacy salvata, senza rigenerare IA.",
      documentCostsSnapshot?.counts.total
        ? null
        : "Nessun documento costo utile collegato alla targa: l'analisi economica resta senza base documentale.",
      savedAnalysis
        ? null
        : "Nessuna analisi legacy salvata in `@analisi_economica_mezzi` per questa targa.",
      savedAnalysis && savedAnalysis.updatedAtTimestamp === null
        ? "L'analisi legacy salvata non espone un `updatedAt` leggibile."
        : null,
      readError,
      ...(documentCostsSnapshot?.limitations ?? []),
    ].filter((entry): entry is string => Boolean(entry)),
  };
}

function buildSectionState<TSnapshot>(args: {
  settled: PromiseSettledResult<TSnapshot>;
  error: string;
}): NextDossierDomainSectionState<TSnapshot> {
  return args.settled.status === "fulfilled"
    ? {
        status: "success",
        snapshot: args.settled.value,
        error: null,
      }
    : {
        status: "error",
        snapshot: null,
        error: args.error,
      };
}

function buildOverview(args: {
  mezzo: NextDossierMezzoIdentity;
  technical: NextDossierDomainSectionState<NextMezzoOperativitaTecnicaSnapshot>;
  lavori: NextDossierDomainSectionState<NextMezzoLavoriSnapshot>;
  materialiMovimenti: NextDossierDomainSectionState<NextMezzoMaterialiMovimentiSnapshot>;
  maintenance: NextDossierDomainSectionState<NextMezzoManutenzioniGommeSnapshot>;
  refuels: NextDossierDomainSectionState<NextMezzoRifornimentiSnapshot>;
  documentCosts: NextDossierDomainSectionState<NextMezzoDocumentiCostiSnapshot>;
  procurementPerimeter: NextDossierDomainSectionState<NextDocumentiCostiProcurementSupportSnapshot>;
  analisiEconomica: NextDossierDomainSectionState<NextDossierAnalisiEconomicaSupportSnapshot>;
}): NextDossierMezzoOverview {
  const {
    mezzo,
    technical,
    lavori,
    materialiMovimenti,
    maintenance,
    refuels,
    documentCosts,
    procurementPerimeter,
    analisiEconomica,
  } = args;

  const importedBlockLabels = [
    "Scheda identita mezzo",
    lavori.status === "success" ? "Lavori mezzo-centrici" : null,
    materialiMovimenti.status === "success"
      ? "Materiali e movimenti mezzo-centrici"
      : null,
    maintenance.status === "success" ? "Storico manutenzioni e gomme" : null,
    refuels.status === "success" ? "Rifornimenti recenti del mezzo" : null,
    documentCosts.status === "success" ? "Documenti e costi collegati alla targa" : null,
    analisiEconomica.status === "success" ? "Supporto Analisi Economica read-only" : null,
  ].filter((entry): entry is string => Boolean(entry));

  const excludedBlockLabels = [
    "nessuna scrittura clone",
    "nessuna rigenerazione IA dal clone",
    "nessun workflow approvativo o magazzino madre",
    "procurement e approvazioni fuori dal perimetro base del dossier",
    "nessun merge debole in UI",
  ];

  const nextConvergenceLabels = [
    "riuso dell'aggregatore per Dossier e Analisi",
    "chiusura delle ultime letture raw nelle pagine clone centrali",
    "base dati piu pulita per sintesi IA read-only future",
    "limiti legacy espliciti dentro il dominio clone",
  ];

  const readerLabels = [
    `Identita mezzo: ${NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.activeReadOnlyDataset}`,
    "Lavori: layer read-only @lavori",
    "Materiali/movimenti: layer read-only @materialiconsegnati",
    "Manutenzioni/gomme: layer read-only @manutenzioni + @mezzi_aziendali con convergenza prudente di @cambi_gomme_autisti_tmp e @gomme_eventi",
    "Rifornimenti: ricostruzione read-only da @rifornimenti e feed campo",
    "Documenti e costi diretti: @costiMezzo + collezioni documentali",
    "Procurement e approvazioni: audit perimetrale read-only su @preventivi e @preventivi_approvazioni",
    "Snapshot analisi economica legacy salvata: @analisi_economica_mezzi",
  ];

  const keySignals = [
    lavori.status === "success"
      ? lavori.snapshot?.counts.total
        ? `Lavori collegati: ${lavori.snapshot.counts.total} record, ${lavori.snapshot.counts.inAttesa} in attesa.`
        : "Nessun lavoro letto per questa targa."
      : "Lavori non disponibili dal layer read-only.",
    materialiMovimenti.status === "success"
      ? materialiMovimenti.snapshot?.counts.total
        ? `Movimenti materiali collegati: ${materialiMovimenti.snapshot.counts.total} record (${materialiMovimenti.snapshot.counts.matchedStrong} match forti, ${materialiMovimenti.snapshot.counts.matchedPlausible} plausibili).`
        : "Nessun movimento materiali collegato al mezzo."
      : "Materiali/movimenti non disponibili dal layer read-only.",
    maintenance.status === "success"
      ? maintenance.snapshot?.scheduledMaintenance.enabled
        ? `Manutenzione programmata ${maintenance.snapshot.scheduledMaintenance.status}.`
        : "Nessuna manutenzione programmata attiva sul mezzo."
      : "Stato manutentivo non disponibile dal layer clone.",
    refuels.status === "success"
      ? refuels.snapshot?.counts.total
        ? `Rifornimenti letti: ${refuels.snapshot.counts.total} record utili.`
        : "Nessun rifornimento utile letto per questa targa."
      : "Rifornimenti non disponibili dal layer clone.",
    documentCosts.status === "success"
      ? documentCosts.snapshot?.counts.total
        ? `Documenti/costi diretti: ${documentCosts.snapshot.counts.total} record (${documentCosts.snapshot.counts.withReliableDate} con data affidabile).`
        : "Nessun documento/costo utile letto per questa targa."
      : "Documenti/costi non disponibili dal layer clone.",
    procurementPerimeter.status === "success"
      ? procurementPerimeter.snapshot?.perimeterDecision === "fuori_perimetro"
        ? `Procurement globale fuori perimetro: ${procurementPerimeter.snapshot.counts.preventiviGlobali} preventivi letti, ${procurementPerimeter.snapshot.counts.preventiviMatchForte} match forti sulla targa.`
        : procurementPerimeter.snapshot?.perimeterDecision === "parziale"
        ? `Procurement solo parziale: ${procurementPerimeter.snapshot.counts.preventiviMatchForte} preventivi con match forte ma workflow globale non mezzo-centrico.`
        : "Procurement leggibile con match forte."
      : "Supporto procurement/approvazioni non disponibile dal clone.",
    analisiEconomica.status === "success"
      ? analisiEconomica.snapshot?.savedAnalysis
        ? "Analisi economica legacy salvata presente e leggibile dal clone."
        : "Nessuna analisi economica legacy salvata per questa targa."
      : "Supporto Analisi Economica non completamente leggibile dal clone.",
  ];

  const successfulBlocks = [
    technical,
    lavori,
    materialiMovimenti,
    maintenance,
    refuels,
    documentCosts,
    procurementPerimeter,
    analisiEconomica,
  ].filter((entry) => entry.status === "success").length;

  const statusLabel =
    successfulBlocks >= 6
      ? "Quadro mezzo consolidato"
      : successfulBlocks >= 3
      ? "Quadro mezzo parziale"
      : "Quadro mezzo limitato";

  const statusMeta =
    successfulBlocks >= 6
      ? "Dossier e Analisi leggono ora un aggregatore clone unico read-only."
      : "Il clone resta mezzo-centrico anche quando una sezione non e disponibile.";

  const technicalLimitations = [
    mezzo.quality !== "certo"
      ? "L'anagrafica mezzo resta parziale su alcuni campi legacy non valorizzati."
      : null,
    technical.status === "error" ? technical.error : null,
    lavori.status === "error" ? lavori.error : null,
    ...(lavori.snapshot?.limitations ?? []),
    maintenance.status === "error" ? maintenance.error : null,
    ...(maintenance.snapshot?.limitations ?? []),
  ].filter((entry): entry is string => Boolean(entry));

  const refuelLimitations = [
    refuels.status === "error" ? refuels.error : null,
    ...(refuels.snapshot?.limitations ?? []),
    materialiMovimenti.status === "error" ? materialiMovimenti.error : null,
    ...(materialiMovimenti.snapshot?.limitations ?? []),
  ].filter((entry): entry is string => Boolean(entry));

  const documentCostLimitations = [
    documentCosts.status === "error" ? documentCosts.error : null,
    ...(documentCosts.snapshot?.limitations ?? []),
  ].filter((entry): entry is string => Boolean(entry));

  const analysisLimitations = [
    analisiEconomica.status === "error" ? analisiEconomica.error : null,
    ...(analisiEconomica.snapshot?.limitations ?? []),
  ].filter((entry): entry is string => Boolean(entry));

  const procurementLimitations = [
    procurementPerimeter.status === "error" ? procurementPerimeter.error : null,
    ...(procurementPerimeter.snapshot?.limitations ?? []),
  ].filter((entry): entry is string => Boolean(entry));

  return {
    mezzoTarga: mezzo.targa,
    importedBlockLabels,
    excludedBlockLabels,
    nextConvergenceLabels,
    readerLabels,
    statusLabel,
    statusMeta,
    keySignals,
    technicalLimitations,
    refuelLimitations,
    documentCostLimitations,
    analysisLimitations,
    procurementLimitations,
  };
}

export async function readNextDossierMezzoCompositeSnapshot(
  targa: string
): Promise<NextDossierMezzoCompositeSnapshot | null> {
  const mezzoTarga = normalizeNextMezzoTarga(targa);
  if (!mezzoTarga) {
    return null;
  }

  const mezzo = await readNextDossierMezzoIdentity(mezzoTarga);
  if (!mezzo) {
    return null;
  }

  const [
    technicalResult,
    lavoriResult,
    materialiBaseResult,
    maintenanceResult,
    refuelsResult,
    documentCostsResult,
    procurementPerimeterResult,
    savedAnalysisResult,
  ] = await Promise.allSettled([
    readNextMezzoOperativitaTecnicaSnapshot(mezzoTarga),
    readNextMezzoLavoriSnapshot(mezzoTarga),
    readNextMaterialiMovimentiSnapshot({ includeCloneOverlays: false }),
    readNextMezzoManutenzioniGommeSnapshot(mezzoTarga),
    readNextMezzoRifornimentiSnapshot(mezzoTarga),
    readNextMezzoDocumentiCostiSnapshot(mezzoTarga),
    readNextDocumentiCostiProcurementSupportSnapshot(mezzoTarga),
    readSavedAnalisiEconomicaRecord(mezzoTarga),
  ]);

  const technical = buildSectionState({
    settled: technicalResult,
    error: "Impossibile leggere il blocco tecnico dal reader canonico clone.",
  });
  const lavori = buildSectionState({
    settled: lavoriResult,
    error: "Impossibile leggere il blocco lavori dal layer read-only dedicato.",
  });
  const maintenance = buildSectionState({
    settled: maintenanceResult,
    error:
      "Impossibile leggere il blocco manutenzioni/gomme dal layer read-only dedicato.",
  });
  const refuels = buildSectionState({
    settled: refuelsResult,
    error:
      "Impossibile leggere il blocco rifornimenti dal layer di normalizzazione clone.",
  });
  const documentCosts = buildSectionState({
    settled: documentCostsResult,
    error:
      "Impossibile leggere il blocco documenti/costi dal layer read-only dedicato.",
  });
  const procurementPerimeter = buildSectionState({
    settled: procurementPerimeterResult,
    error:
      "Impossibile leggere il supporto procurement/approvazioni dal clone in sola lettura.",
  });

  const materialiMovimenti:
    NextDossierDomainSectionState<NextMezzoMaterialiMovimentiSnapshot> =
    materialiBaseResult.status === "fulfilled"
      ? {
          status: "success",
          snapshot: buildNextMezzoMaterialiMovimentiSnapshot({
            baseSnapshot: materialiBaseResult.value,
            targa: mezzoTarga,
            mezzoId: mezzo.id,
            materialCostSupportDocuments:
              documentCosts.snapshot?.materialCostSupport.documents ?? [],
          }),
          error: null,
        }
      : {
          status: "error",
          snapshot: null,
          error:
            "Impossibile leggere il blocco materiali/movimenti dal layer read-only dedicato.",
        };

  const savedAnalysis =
    savedAnalysisResult.status === "fulfilled" ? savedAnalysisResult.value : null;
  const analisiEconomica: NextDossierDomainSectionState<NextDossierAnalisiEconomicaSupportSnapshot> =
    {
      status: savedAnalysisResult.status === "fulfilled" ? "success" : "error",
      snapshot: buildAnalisiEconomicaSupportSnapshot({
        mezzoTarga,
        documentCostsSnapshot: documentCosts.snapshot,
        savedAnalysis,
        readError:
          savedAnalysisResult.status === "fulfilled"
            ? null
            : "Impossibile leggere il documento legacy `@analisi_economica_mezzi` dal clone.",
      }),
      error:
        savedAnalysisResult.status === "fulfilled"
          ? null
          : "Impossibile leggere il documento legacy `@analisi_economica_mezzi` dal clone.",
    };

  return {
    mezzo,
    technical,
    lavori,
    materialiMovimenti,
    maintenance,
    refuels,
    documentCosts,
    procurementPerimeter,
    analisiEconomica,
    overview: buildOverview({
      mezzo,
      technical,
      lavori,
      materialiMovimenti,
      maintenance,
      refuels,
      documentCosts,
      procurementPerimeter,
      analisiEconomica,
    }),
  };
}

export function buildNextDossierMezzoLegacyView(
  snapshot: NextDossierMezzoCompositeSnapshot
): NextDossierMezzoLegacyViewState {
  const lavori = snapshot.lavori.snapshot
    ? buildNextLavoriLegacyDossierView(snapshot.lavori.snapshot)
    : {
        lavoriDaEseguire: [],
        lavoriInAttesa: [],
        lavoriEseguiti: [],
      };

  const rifornimenti: NextDossierRifornimentoLegacyItem[] =
    snapshot.refuels.snapshot?.items.map((entry) => ({
      id: entry.id,
      targaCamion: entry.targa,
      data: entry.timestamp,
      litri: entry.litri,
      km: entry.km,
      tipo: entry.tipo,
      autistaNome: entry.autista,
      badgeAutista: entry.badgeAutista,
    })) ?? [];

  const kmAttuali =
    (snapshot.refuels.snapshot?.items ?? [])
      .map((entry) => ({
        km: typeof entry.km === "number" && Number.isFinite(entry.km) ? entry.km : null,
        timestamp: entry.timestamp ?? 0,
      }))
      .filter((entry): entry is { km: number; timestamp: number } => entry.km !== null)
      .sort((left, right) => (right.timestamp ?? 0) - (left.timestamp ?? 0))[0]?.km ?? null;

  const gommePerAsse = snapshot.maintenance.snapshot
    ? buildNextGommeStateByAsse({
        categoria: snapshot.mezzo.categoria,
        maintenanceItems: snapshot.maintenance.snapshot.maintenanceItems,
        kmAttuali,
      })
    : [];

  const gommeStraordinarie = snapshot.maintenance.snapshot
    ? buildNextGommeStraordinarieEvents({
        categoria: snapshot.mezzo.categoria,
        maintenanceItems: snapshot.maintenance.snapshot.maintenanceItems,
      })
    : [];

  return {
    mezzo: snapshot.mezzo,
    lavoriDaEseguire: lavori.lavoriDaEseguire,
    lavoriInAttesa: lavori.lavoriInAttesa,
    lavoriEseguiti: lavori.lavoriEseguiti,
    movimentiMateriali: snapshot.materialiMovimenti.snapshot
      ? buildNextMaterialiMovimentiLegacyDossierView(
          snapshot.materialiMovimenti.snapshot
        )
      : [],
    rifornimenti,
    documentiCosti: snapshot.documentCosts.snapshot
      ? mapNextDocumentiCostiItemsToLegacyView(snapshot.documentCosts.snapshot.items)
      : [],
    manutenzioni: snapshot.maintenance.snapshot
      ? mapNextManutenzioniItemsToLegacyView(
          snapshot.maintenance.snapshot.maintenanceItems
        )
      : [],
    gommePerAsse,
    gommeStraordinarie,
    scheduledMaintenance:
      snapshot.maintenance.snapshot?.scheduledMaintenance ?? null,
  };
}

export function buildNextAnalisiEconomicaLegacyView(
  snapshot: NextDossierMezzoCompositeSnapshot
): NextAnalisiEconomicaLegacyViewState {
  return {
    mezzo: snapshot.mezzo,
    documentiCosti: snapshot.documentCosts.snapshot
      ? mapNextDocumentiCostiItemsToLegacyView(snapshot.documentCosts.snapshot.items)
      : [],
    analisiIA: snapshot.analisiEconomica.snapshot?.savedAnalysis ?? null,
  };
}

