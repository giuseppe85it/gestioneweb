import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";
import {
  readNextDocumentiCostiProcurementSupportSnapshot,
  readNextMezzoDocumentiCostiSnapshot,
  type NextDocumentiCostiProcurementSupportSnapshot,
  type NextDocumentiCostiReadOnlyItem,
  type NextMezzoDocumentiCostiSnapshot,
} from "../domain/nextDocumentiCostiDomain";
import type {
  InternalAiDocumentPreviewItem,
  InternalAiDocumentsPreview,
  InternalAiDocumentsPreviewBucket,
  InternalAiPreviewState,
  InternalAiVehicleReportCard,
  InternalAiVehicleReportSource,
} from "./internalAiTypes";

export type InternalAiDocumentsPreviewReadResult =
  | {
      status: "invalid_query";
      normalizedTarga: null;
      message: string;
      preview: null;
    }
  | {
      status: "ready";
      normalizedTarga: string;
      message: string;
      preview: InternalAiDocumentsPreview;
    };

const MAX_BUCKET_ITEMS = 6;

function takeNotes(notes: string[] | undefined, limit = 3): string[] {
  return (notes ?? []).filter(Boolean).slice(0, limit);
}

function formatCurrencyAmount(amount: number | null, currency: string): string | null {
  if (amount === null || !Number.isFinite(amount)) {
    return null;
  }

  const formattedAmount = new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (currency === "UNKNOWN") {
    return `${formattedAmount} valuta da verificare`;
  }

  return `${currency} ${formattedAmount}`;
}

function formatQuality(value: NextDocumentiCostiReadOnlyItem["quality"]): string {
  switch (value) {
    case "certo":
      return "Qualita record certa.";
    case "ricostruito":
      return "Qualita record ricostruita dal layer clone-safe.";
    default:
      return "Qualita record non pienamente disponibile.";
  }
}

function formatCategory(value: NextDocumentiCostiReadOnlyItem["category"]): string {
  switch (value) {
    case "preventivo":
      return "Preventivo";
    case "fattura":
      return "Fattura";
    default:
      return "Documento utile";
  }
}

function formatFlag(flag: string): string {
  return flag.replace(/_/g, " ").trim();
}

function classifyItem(item: NextDocumentiCostiReadOnlyItem): InternalAiDocumentPreviewItem["classification"] {
  return item.sourceType === "documento_magazzino" || item.sourceType === "documento_generico"
    ? "plausibile"
    : "diretto";
}

function mapDocumentItem(item: NextDocumentiCostiReadOnlyItem): InternalAiDocumentPreviewItem {
  const classification = classifyItem(item);
  const amountLabel = formatCurrencyAmount(item.amount, item.currency);
  const sourceSummary =
    item.supplier && item.descrizione
      ? `${item.descrizione} Fornitore ${item.supplier}.`
      : item.descrizione || item.title;

  return {
    id: item.id,
    title: item.title,
    classification,
    summary: sourceSummary,
    sourceLabel: item.sourceLabel,
    datasetLabel: item.sourceKey,
    categoryLabel: formatCategory(item.category),
    dateLabel: item.dateLabel,
    amountLabel,
    fileLabel: item.fileUrl ? "Allegato leggibile" : "Allegato non disponibile",
    traceabilityLabel: item.sourceDocId
      ? `${item.sourceKey} / ${item.sourceDocId}`
      : item.sourceKey,
    notes: [formatQuality(item.quality), ...item.flags.slice(0, 2).map(formatFlag)].filter(Boolean),
  };
}

function createOutOfScopeItems(
  procurement: NextDocumentiCostiProcurementSupportSnapshot,
): InternalAiDocumentPreviewItem[] {
  const items: InternalAiDocumentPreviewItem[] = [
    {
      id: "fuori-perimetro-procurement",
      title: "Procurement globale e approvazioni",
      classification: "fuori_perimetro",
      summary:
        procurement.perimeterDecision === "parziale"
          ? "Sono presenti segnali procurement collegabili alla targa, ma il workflow resta separato dal primo blocco documenti IA."
          : "Il procurement globale resta fuori dal primo blocco documenti IA e non viene promosso a backend canonico.",
      sourceLabel: "Supporto procurement separato",
      datasetLabel: "@preventivi + @preventivi_approvazioni",
      categoryLabel: "Fuori perimetro",
      dateLabel: null,
      amountLabel: `${procurement.counts.preventiviGlobali} preventivi globali`,
      fileLabel: "Nessun allegato aperto da questo blocco",
      traceabilityLabel: "supporto clone-safe separato",
      notes: takeNotes(procurement.limitations, 2),
    },
    {
      id: "fuori-perimetro-ocr-upload",
      title: "OCR, upload e salvataggio documenti",
      classification: "fuori_perimetro",
      summary:
        "Il blocco preview non usa OCR reale, non carica file su Storage e non scrive nei dataset documentali business.",
      sourceLabel: "Capability legacy esclusa",
      datasetLabel: "runtime legacy documenti",
      categoryLabel: "Fuori perimetro",
      dateLabel: null,
      amountLabel: null,
      fileLabel: "Upload disattivato",
      traceabilityLabel: "src/pages/IA/IADocumenti.tsx / functions/estrazioneDocumenti.js",
      notes: [
        "Nessun riuso runtime del flusso legacy.",
        "Nessuna scrittura su @documenti_mezzi, @documenti_magazzino o @documenti_generici.",
      ],
    },
    {
      id: "fuori-perimetro-provider",
      title: "Provider reali e configurazione segreti",
      classification: "fuori_perimetro",
      summary:
        "Il primo assorbimento non legge @impostazioni_app/gemini e non apre provider o chiavi lato client.",
      sourceLabel: "Configurazione esclusa",
      datasetLabel: "@impostazioni_app/gemini",
      categoryLabel: "Fuori perimetro",
      dateLabel: null,
      amountLabel: null,
      fileLabel: "Non applicabile",
      traceabilityLabel: "segreti e provider fuori perimetro",
      notes: [
        "Nessun backend legacy usato come canale canonico.",
        "Preview solo read-only e reversibile.",
      ],
    },
  ];

  return items;
}

function createBucket(args: {
  id: string;
  title: string;
  summary: string;
  items: InternalAiDocumentPreviewItem[];
  emptyNote: string;
  extraNotes?: string[];
}): InternalAiDocumentsPreviewBucket {
  const visibleItems = args.items.slice(0, MAX_BUCKET_ITEMS);
  const hiddenItems = args.items.length - visibleItems.length;
  const notes = [
    ...(args.extraNotes ?? []),
    hiddenItems > 0 ? `Altri ${hiddenItems} record disponibili nel layer ma non esposti in questa preview iniziale.` : null,
  ].filter((entry): entry is string => Boolean(entry));

  return {
    id: args.id,
    title: args.title,
    status: args.items.length > 0 ? "completa" : "vuota",
    summary: args.items.length > 0 ? args.summary : args.emptyNote,
    items: visibleItems,
    notes,
  };
}

function buildPreviewState(args: {
  directCount: number;
  plausibleCount: number;
}): InternalAiPreviewState {
  return {
    status: args.directCount > 0 || args.plausibleCount > 0 ? "preview_ready" : "revision_requested",
    updatedAt: new Date().toISOString(),
    note:
      args.directCount > 0 || args.plausibleCount > 0
        ? "Preview documenti costruita in sola lettura sopra layer clone-safe gia esistenti, senza OCR, upload o scritture business."
        : "Nessun documento leggibile collegato alla targa nel perimetro sicuro iniziale: la preview resta vuota ma conferma i limiti di copertura.",
  };
}

function buildCards(args: {
  directItems: NextDocumentiCostiReadOnlyItem[];
  plausibleItems: NextDocumentiCostiReadOnlyItem[];
  outOfScopeItems: InternalAiDocumentPreviewItem[];
}): InternalAiVehicleReportCard[] {
  const fileLeggibili = [...args.directItems, ...args.plausibleItems].filter((item) =>
    Boolean(item.fileUrl),
  ).length;

  return [
    {
      label: "Documenti diretti",
      value: `${args.directItems.length}`,
      meta: "Record mezzo-centrici gia leggibili nei layer clone-safe del clone.",
      tone: args.directItems.length > 0 ? "success" : "warning",
    },
    {
      label: "Documenti plausibili",
      value: `${args.plausibleItems.length}`,
      meta: "Record con targa leggibile ma nati fuori dalla collezione documenti mezzo.",
      tone: args.plausibleItems.length > 0 ? "success" : "warning",
    },
    {
      label: "Fuori perimetro",
      value: `${args.outOfScopeItems.length}`,
      meta: "Flussi o dataset esclusi dal primo assorbimento prudente.",
      tone: "warning",
    },
    {
      label: "Allegati leggibili",
      value: `${fileLeggibili}`,
      meta: "File URL gia esposti dai layer clone-safe, senza upload o download nuovi.",
      tone: fileLeggibili > 0 ? "success" : "warning",
    },
  ];
}

function buildSources(args: {
  snapshot: NextMezzoDocumentiCostiSnapshot;
  procurement: NextDocumentiCostiProcurementSupportSnapshot;
  directItems: NextDocumentiCostiReadOnlyItem[];
  plausibleItems: NextDocumentiCostiReadOnlyItem[];
}): InternalAiVehicleReportSource[] {
  const directDatasets = Array.from(
    new Set(
      args.directItems.length
        ? args.directItems.map((item) => item.sourceKey)
        : ["@documenti_mezzi", "@costiMezzo"],
    ),
  );
  const plausibleDatasets = Array.from(
    new Set(
      args.plausibleItems.length
        ? args.plausibleItems.map((item) => item.sourceKey)
        : ["@documenti_magazzino", "@documenti_generici"],
    ),
  );

  return [
    {
      id: "fonte-documenti-diretti",
      title: "Documenti diretti mezzo-centrici",
      status: args.directItems.length > 0 ? "disponibile" : "parziale",
      description:
        "Lettura read-only dei record documentali gia mezzo-centrici, senza OCR e senza passare dal runtime legacy documenti.",
      datasetLabels: directDatasets,
      countLabel: `${args.directItems.length} record`,
      notes: takeNotes(args.snapshot.limitations, 2),
      periodStatus: "non_applicabile",
      periodNote: "La preview iniziale non apre ancora un filtro periodo dedicato: ordina solo i record gia datati.",
    },
    {
      id: "fonte-documenti-plausibili",
      title: "Documenti plausibili con targa leggibile",
      status: args.plausibleItems.length > 0 ? "disponibile" : "parziale",
      description:
        "Supporto prudenziale da documenti magazzino o generici solo quando il layer clone-safe espone gia una targa leggibile.",
      datasetLabels: plausibleDatasets,
      countLabel: `${args.plausibleItems.length} record`,
      notes: [
        "Nessuna inferenza debole da file name o testo libero.",
        args.snapshot.materialCostSupport.documentCount > 0
          ? `Documenti magazzino di supporto disponibili: ${args.snapshot.materialCostSupport.documentCount}.`
          : "Nessun documento magazzino di supporto disponibile per questa targa.",
      ],
      periodStatus: "non_applicabile",
      periodNote: "I record plausibili restano separati dai diretti e non vengono promossi automaticamente.",
    },
    {
      id: "fonte-documenti-fuori-perimetro",
      title: "Flussi esclusi dal primo assorbimento",
      status: "parziale",
      description:
        "Procurement globale, OCR/upload legacy e configurazione provider restano fuori dal perimetro iniziale del blocco documenti IA.",
      datasetLabels: ["@preventivi", "@preventivi_approvazioni", "@impostazioni_app/gemini"],
      countLabel: `${args.procurement.counts.preventiviGlobali} preventivi globali`,
      notes: takeNotes(args.procurement.limitations, 2),
      periodStatus: "non_applicabile",
      periodNote: "Queste sorgenti non diventano backend canonico del sottosistema IA interno.",
    },
  ];
}

function buildMissingData(args: {
  directItems: NextDocumentiCostiReadOnlyItem[];
  plausibleItems: NextDocumentiCostiReadOnlyItem[];
  procurement: NextDocumentiCostiProcurementSupportSnapshot;
  snapshot: NextMezzoDocumentiCostiSnapshot;
}): string[] {
  const missing: string[] = [];

  if (args.directItems.length === 0) {
    missing.push("Nessun documento diretto mezzo-centrico leggibile nel perimetro iniziale.");
  }
  if (args.plausibleItems.length === 0) {
    missing.push("Nessun documento plausibile con targa leggibile da magazzino o documenti generici.");
  }
  if (args.snapshot.counts.withFile === 0) {
    missing.push("I record oggi letti non espongono ancora un file URL leggibile nella preview.");
  }
  if (args.snapshot.counts.withReliableDate === 0 && args.snapshot.counts.total > 0) {
    missing.push("I record letti non espongono ancora una data affidabile utile per un ordinamento forte.");
  }
  if (args.procurement.counts.preventiviMatchForte > 0) {
    missing.push(
      `Esistono ${args.procurement.counts.preventiviMatchForte} segnali procurement con match forte sulla targa, ma restano fuori dal perimetro diretto di questa preview.`,
    );
  }

  return missing;
}

function buildPreview(args: {
  targa: string;
  snapshot: NextMezzoDocumentiCostiSnapshot;
  procurement: NextDocumentiCostiProcurementSupportSnapshot;
}): InternalAiDocumentsPreview {
  const directItems = args.snapshot.items.filter(
    (item) => item.sourceType === "documento_mezzo" || item.sourceType === "costo_mezzo",
  );
  const plausibleItems = args.snapshot.items.filter(
    (item) => item.sourceType === "documento_magazzino" || item.sourceType === "documento_generico",
  );
  const outOfScopeItems = createOutOfScopeItems(args.procurement);

  return {
    mezzoTarga: args.targa,
    title: `Preview documenti IA per ${args.targa}`,
    subtitle:
      "Primo assorbimento prudente della capability legacy documenti: sola lettura clone-safe, distinzione esplicita tra diretto, plausibile e fuori perimetro.",
    generatedAt: new Date().toISOString(),
    header: {
      targa: args.targa,
      documentiDiretti: directItems.length,
      documentiPlausibili: plausibleItems.length,
      fuoriPerimetro: outOfScopeItems.length,
      fileLeggibili: args.snapshot.counts.withFile,
    },
    cards: buildCards({
      directItems,
      plausibleItems,
      outOfScopeItems,
    }),
    buckets: [
      createBucket({
        id: "documenti-diretti",
        title: "Documenti diretti",
        summary: `${directItems.length} record documentali gia mezzo-centrici disponibili nel clone.`,
        items: directItems.map(mapDocumentItem),
        emptyNote: "Nessun documento diretto mezzo-centrico disponibile per la targa selezionata.",
        extraNotes: [
          `Dataset diretti letti: ${Array.from(new Set(directItems.map((item) => item.sourceKey))).join(", ") || "@documenti_mezzi, @costiMezzo"}.`,
        ],
      }),
      createBucket({
        id: "documenti-plausibili",
        title: "Documenti plausibili",
        summary: `${plausibleItems.length} record correlati con targa leggibile ma nati fuori dalla collezione mezzo.`,
        items: plausibleItems.map(mapDocumentItem),
        emptyNote: "Nessun documento plausibile disponibile nel perimetro prudenziale corrente.",
        extraNotes: [
          "I record plausibili restano separati dai diretti e non vengono promossi automaticamente.",
          args.snapshot.materialCostSupport.documentCount > 0
            ? `Supporto righe magazzino disponibile su ${args.snapshot.materialCostSupport.documentCount} documenti.`
            : "Nessun supporto righe magazzino esposto per questa targa.",
        ],
      }),
      createBucket({
        id: "documenti-fuori-perimetro",
        title: "Fuori perimetro",
        summary:
          "Flussi legacy, procurement globale e configurazione provider restano esplicitamente esclusi dal primo blocco documenti IA.",
        items: outOfScopeItems,
        emptyNote: "Nessun elemento fuori perimetro da segnalare in questa preview iniziale.",
        extraNotes: [
          "Questo bucket non diventa backend canonico e non riattiva il runtime legacy documenti.",
        ],
      }),
    ],
    safePerimeter: [
      "Lettura read-only di @documenti_mezzi e dei record gia mezzo-centrici in @costiMezzo.",
      "Supporto prudenziale da @documenti_magazzino e @documenti_generici solo se la targa e gia leggibile nel layer clone-safe.",
      "Traceability sempre esposta con sourceKey e sourceDocId quando disponibili.",
      "Nessun OCR reale, nessun upload Storage e nessuna scrittura su dataset business.",
    ],
    outOfScope: [
      "Runtime legacy src/pages/IA/IADocumenti.tsx e functions/estrazioneDocumenti.js.",
      "OCR reale, classificazione automatica, upload Storage e salvataggio su @documenti_*.",
      "@impostazioni_app/gemini, provider reali e segreti lato client.",
      "Procurement globale e approvazioni come backend canonico del blocco documenti.",
    ],
    missingData: buildMissingData({
      directItems,
      plausibleItems,
      procurement: args.procurement,
      snapshot: args.snapshot,
    }),
    sources: buildSources({
      snapshot: args.snapshot,
      procurement: args.procurement,
      directItems,
      plausibleItems,
    }),
    previewState: buildPreviewState({
      directCount: directItems.length,
      plausibleCount: plausibleItems.length,
    }),
  };
}

export async function readInternalAiDocumentsPreview(
  targa: string,
): Promise<InternalAiDocumentsPreviewReadResult> {
  const normalizedTarga = normalizeNextMezzoTarga(targa);

  if (!normalizedTarga) {
    return {
      status: "invalid_query",
      normalizedTarga: null,
      message: "Inserisci una targa valida prima di aprire la preview documenti IA.",
      preview: null,
    };
  }

  const [snapshot, procurement] = await Promise.all([
    readNextMezzoDocumentiCostiSnapshot(normalizedTarga),
    readNextDocumentiCostiProcurementSupportSnapshot(normalizedTarga),
  ]);

  const preview = buildPreview({
    targa: normalizedTarga,
    snapshot,
    procurement,
  });

  return {
    status: "ready",
    normalizedTarga,
    message:
      preview.header.documentiDiretti > 0 || preview.header.documentiPlausibili > 0
        ? `Preview documenti pronta per ${normalizedTarga}: ${preview.header.documentiDiretti} diretti, ${preview.header.documentiPlausibili} plausibili e ${preview.header.fuoriPerimetro} elementi fuori perimetro dichiarati.`
        : `Preview documenti pronta per ${normalizedTarga}: nessun record leggibile nel perimetro iniziale, limiti e flussi esclusi dichiarati in modo esplicito.`,
    preview,
  };
}
