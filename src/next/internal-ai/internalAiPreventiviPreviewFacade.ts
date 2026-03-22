import { readNextMezzoByTarga, normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";
import {
  readNextDocumentiCostiProcurementSupportSnapshot,
  readNextMezzoDocumentiCostiSnapshot,
  type NextDocumentiCostiProcurementSupportSnapshot,
  type NextDocumentiCostiReadOnlyItem,
  type NextMezzoDocumentiCostiSnapshot,
} from "../domain/nextDocumentiCostiDomain";
import type {
  InternalAiPreventiviPreview,
  InternalAiPreventiviPreviewBucket,
  InternalAiPreventiviPreviewItem,
  InternalAiPreviewState,
  InternalAiVehicleReportCard,
  InternalAiVehicleReportSource,
} from "./internalAiTypes";

export type InternalAiPreventiviPreviewReadResult =
  | {
      status: "invalid_query";
      normalizedTarga: null;
      message: string;
      preview: null;
    }
  | {
      status: "not_found";
      normalizedTarga: string;
      message: string;
      preview: null;
    }
  | {
      status: "ready";
      normalizedTarga: string;
      message: string;
      preview: InternalAiPreventiviPreview;
    };

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

function formatFlag(flag: string): string {
  return flag.replace(/_/g, " ").trim();
}

function mapPreventivoItem(args: {
  item: NextDocumentiCostiReadOnlyItem;
  classification: InternalAiPreventiviPreviewItem["classification"];
  collegamentoLabel: string;
}): InternalAiPreventiviPreviewItem {
  const { item, classification, collegamentoLabel } = args;
  const summary =
    item.supplier && item.descrizione
      ? `${item.descrizione} Fornitore ${item.supplier}.`
      : item.descrizione || item.title;

  return {
    id: item.id,
    title: item.title,
    classification,
    summary,
    sourceLabel: item.sourceLabel,
    datasetLabel: item.sourceKey,
    dateLabel: item.dateLabel,
    amountLabel: formatCurrencyAmount(item.amount, item.currency),
    collegamentoLabel,
    traceabilityLabel: item.sourceDocId
      ? `${item.sourceKey} / ${item.sourceDocId}`
      : item.sourceKey,
    notes: [
      item.fileUrl ? "Allegato leggibile nel clone." : "Allegato non disponibile nel clone.",
      ...item.flags.slice(0, 2).map(formatFlag),
    ].filter(Boolean),
  };
}

function buildSupportItems(
  procurement: NextDocumentiCostiProcurementSupportSnapshot,
): InternalAiPreventiviPreviewItem[] {
  const items: InternalAiPreventiviPreviewItem[] = [];

  if (procurement.counts.preventiviMatchForte > 0) {
    items.push({
      id: "supporto-procurement-match-forte",
      title: "Preventivi procurement con match forte sulla targa",
      classification: "plausibile",
      summary:
        "Il supporto procurement rileva record globali con match forte sulla targa, ma il workflow resta separato dal blocco preventivi diretti.",
      sourceLabel: "Supporto procurement separato",
      datasetLabel: "@preventivi",
      dateLabel: null,
      amountLabel: `${procurement.counts.preventiviMatchForte} match forti`,
      collegamentoLabel: "Supporto separato con match forte",
      traceabilityLabel: "snapshot clone-safe procurement",
      notes: takeNotes(procurement.limitations, 2),
    });
  }

  if (procurement.counts.approvazioniMezzo > 0) {
    items.push({
      id: "supporto-approvazioni-mezzo",
      title: "Approvazioni collegate alla targa",
      classification: "plausibile",
      summary:
        "Le approvazioni sono leggibili come stato informativo separato, ma non vengono promosse a preventivo diretto del blocco IA.",
      sourceLabel: "Supporto approvativo separato",
      datasetLabel: "@preventivi_approvazioni",
      dateLabel: null,
      amountLabel: `${procurement.counts.approvazioniMezzo} approvazioni`,
      collegamentoLabel: "Stato approvativo separato",
      traceabilityLabel: "snapshot clone-safe procurement",
      notes: [
        `${procurement.counts.approvazioniSuPreventiviGlobali} approvazioni su preventivi globali.`,
        `${procurement.counts.approvazioniSuDocumentiDiretti} approvazioni su documenti/costi diretti.`,
      ],
    });
  }

  if (items.length === 0 && procurement.counts.preventiviGlobali > 0) {
    items.push({
      id: "supporto-procurement-globale",
      title: "Procurement globale disponibile",
      classification: "plausibile",
      summary:
        "Nel repo esistono preventivi globali leggibili, ma per questa targa non emerge ancora un collegamento forte dimostrabile.",
      sourceLabel: "Supporto procurement separato",
      datasetLabel: "@preventivi",
      dateLabel: null,
      amountLabel: `${procurement.counts.preventiviGlobali} preventivi globali`,
      collegamentoLabel: "Supporto globale non dimostrabile",
      traceabilityLabel: "snapshot clone-safe procurement",
      notes: takeNotes(procurement.limitations, 2),
    });
  }

  return items;
}

function buildOutOfScopeItems(): InternalAiPreventiviPreviewItem[] {
  return [
    {
      id: "preventivi-fuori-perimetro-parsing-ia",
      title: "Parsing IA reale e ingestione file",
      classification: "fuori_perimetro",
      summary:
        "Il primo blocco preventivi non esegue OCR, parsing AI reale o acquisizione di nuovi allegati PDF/immagini.",
      sourceLabel: "Runtime legacy escluso",
      datasetLabel: "src/pages/Acquisti.tsx / estraiPreventivoIA",
      dateLabel: null,
      amountLabel: null,
      collegamentoLabel: "Bloccato nel clone",
      traceabilityLabel: "legacy preventivi",
      notes: [
        "Nessun backend legacy usato come canale canonico.",
        "Nessun provider reale attivato.",
      ],
    },
    {
      id: "preventivi-fuori-perimetro-scritture",
      title: "Scritture e upload procurement",
      classification: "fuori_perimetro",
      summary:
        "Restano bloccati upload Storage, scritture su @preventivi, @preventivi_approvazioni e qualsiasi salvataggio su @documenti_*.",
      sourceLabel: "Dataset business esclusi",
      datasetLabel: "@preventivi / @preventivi_approvazioni / @documenti_* / Storage",
      dateLabel: null,
      amountLabel: null,
      collegamentoLabel: "Writer bloccati",
      traceabilityLabel: "guard rail clone read-only",
      notes: [
        "Nessuna scrittura business riaperta nel clone.",
        "Nessun upload file o side effect esterno.",
      ],
    },
    {
      id: "preventivi-fuori-perimetro-pdf-timbrati",
      title: "Workflow approvativo e PDF timbrati",
      classification: "fuori_perimetro",
      summary:
        "Capo Costi Mezzo, timbri PDF e workflow approvativi restano fuori dal primo assorbimento preventivi IA.",
      sourceLabel: "Perimetro approvativo separato",
      datasetLabel: "src/pages/CapoCostiMezzo.tsx / stamp_pdf",
      dateLabel: null,
      amountLabel: null,
      collegamentoLabel: "Fuori perimetro",
      traceabilityLabel: "workflow approvativo legacy",
      notes: [
        "Le approvazioni restano solo supporto informativo read-only.",
        "Nessun PDF timbrato generato dal clone.",
      ],
    },
  ];
}

function createBucket(args: {
  id: string;
  title: string;
  summary: string;
  items: InternalAiPreventiviPreviewItem[];
  emptyNote: string;
  extraNotes?: string[];
}): InternalAiPreventiviPreviewBucket {
  return {
    id: args.id,
    title: args.title,
    status: args.items.length > 0 ? "completa" : "vuota",
    summary: args.items.length > 0 ? args.summary : args.emptyNote,
    items: args.items,
    notes: (args.extraNotes ?? []).filter(Boolean),
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
        ? "Preview preventivi costruita in sola lettura sui layer clone-safe gia attivi, senza parsing AI, upload o scritture business."
        : "Nessun preventivo leggibile o supporto forte disponibile nel perimetro sicuro iniziale: la preview resta solo diagnostica.",
  };
}

function buildCards(args: {
  directItems: NextDocumentiCostiReadOnlyItem[];
  supportItems: InternalAiPreventiviPreviewItem[];
  plausibleDocumentItems: NextDocumentiCostiReadOnlyItem[];
  outOfScopeItems: InternalAiPreventiviPreviewItem[];
}): InternalAiVehicleReportCard[] {
  const importiLeggibili =
    args.directItems.filter((item) => item.amount !== null).length +
    args.plausibleDocumentItems.filter((item) => item.amount !== null).length;

  return [
    {
      label: "Preventivi diretti",
      value: `${args.directItems.length}`,
      meta: "Record gia mezzo-centrici e direttamente collegabili alla targa.",
      tone: args.directItems.length > 0 ? "success" : "warning",
    },
    {
      label: "Supporti separati",
      value: `${args.plausibleDocumentItems.length + args.supportItems.length}`,
      meta: "Record plausibili o supporti procurement letti senza fonderli nel blocco diretto.",
      tone: args.plausibleDocumentItems.length + args.supportItems.length > 0 ? "warning" : "success",
    },
    {
      label: "Fuori perimetro",
      value: `${args.outOfScopeItems.length}`,
      meta: "Flussi esclusi dal primo assorbimento preventivi IA.",
      tone: "warning",
    },
    {
      label: "Importi leggibili",
      value: `${importiLeggibili}`,
      meta: "Preventivi con importo gia leggibile nei layer clone-safe.",
      tone: importiLeggibili > 0 ? "success" : "warning",
    },
  ];
}

function buildSources(args: {
  directItems: NextDocumentiCostiReadOnlyItem[];
  plausibleDocumentItems: NextDocumentiCostiReadOnlyItem[];
  documentSnapshot: NextMezzoDocumentiCostiSnapshot;
  procurement: NextDocumentiCostiProcurementSupportSnapshot;
}): InternalAiVehicleReportSource[] {
  const directDatasets = Array.from(
    new Set(
      args.directItems.length
        ? args.directItems.map((item) => item.sourceKey)
        : ["@costiMezzo", "@documenti_mezzi"],
    ),
  );
  const plausibleDatasets = Array.from(
    new Set(
      args.plausibleDocumentItems.length
        ? args.plausibleDocumentItems.map((item) => item.sourceKey)
        : ["@documenti_magazzino", "@documenti_generici"],
    ),
  );

  return [
    {
      id: "fonte-preventivi-diretti",
      title: "Preventivi mezzo-centrici gia leggibili",
      status: args.directItems.length > 0 ? "disponibile" : "parziale",
      description:
        "Fonte primaria del blocco: preventivi gia mezzo-centrici letti dal layer clone-safe documenti/costi, senza parsing IA.",
      datasetLabels: directDatasets,
      countLabel: `${args.directItems.length} record`,
      notes: takeNotes(args.documentSnapshot.limitations, 2),
      periodStatus: "non_applicabile",
      periodNote: "Il primo step preventivi non apre ancora un filtro periodo dedicato.",
    },
    {
      id: "fonte-preventivi-supporti",
      title: "Supporti plausibili e procurement separato",
      status:
        args.plausibleDocumentItems.length > 0 || args.procurement.counts.preventiviGlobali > 0
          ? "disponibile"
          : "parziale",
      description:
        "Supporto prudenziale da preventivi non pienamente mezzo-centrici e da procurement globale letto come contesto separato.",
      datasetLabels: [...plausibleDatasets, ...args.procurement.datasets],
      countLabel: `${args.procurement.counts.preventiviMatchForte} match forti / ${args.procurement.counts.preventiviGlobali} globali`,
      notes: takeNotes(args.procurement.limitations, 2),
      periodStatus: "non_applicabile",
      periodNote:
        "Il procurement resta supporto separato: non viene promosso automaticamente a base diretta del blocco preventivi.",
    },
    {
      id: "fonte-preventivi-fuori-perimetro",
      title: "Flussi esclusi dal primo step",
      status: "parziale",
      description:
        "Parsing IA reale, upload, scritture, approvazioni e PDF timbrati restano fuori dal primo assorbimento preventivi IA.",
      datasetLabels: ["@preventivi", "@preventivi_approvazioni", "@documenti_*", "Storage"],
      countLabel: null,
      notes: [
        "Nessun backend legacy usato come canale canonico.",
        "Nessun provider reale o side effect esterno attivato.",
      ],
      periodStatus: "non_applicabile",
      periodNote: "Il clone resta preview-first, read-only e reversibile.",
    },
  ];
}

function buildMissingData(args: {
  directItems: NextDocumentiCostiReadOnlyItem[];
  plausibleDocumentItems: NextDocumentiCostiReadOnlyItem[];
  supportItems: InternalAiPreventiviPreviewItem[];
  procurement: NextDocumentiCostiProcurementSupportSnapshot;
}): string[] {
  const missing: string[] = [];

  if (args.directItems.length === 0) {
    missing.push("Nessun preventivo direttamente collegabile e gia mezzo-centrico disponibile per la targa selezionata.");
  }
  if (args.plausibleDocumentItems.length === 0 && args.supportItems.length === 0) {
    missing.push("Nessun supporto plausibile o procurement separato rilevante emerso nel perimetro corrente.");
  }
  if (args.directItems.length > 0 && args.directItems.every((item) => item.amount === null)) {
    missing.push("I preventivi diretti letti non espongono ancora importi parsabili.");
  }
  if (args.directItems.length > 0 && args.directItems.every((item) => !item.fileUrl)) {
    missing.push("I preventivi diretti letti non espongono ancora un allegato leggibile nel clone.");
  }
  if (args.procurement.counts.preventiviMatchForte > 0) {
    missing.push(
      `Esistono ${args.procurement.counts.preventiviMatchForte} match forti nel procurement globale, ma il workflow resta separato dal blocco diretto.`,
    );
  }

  return missing;
}

function buildPreview(args: {
  documentSnapshot: NextMezzoDocumentiCostiSnapshot;
  procurement: NextDocumentiCostiProcurementSupportSnapshot;
  categoria: string | null;
  marcaModello: string | null;
}): InternalAiPreventiviPreview {
  const allPreventivi = args.documentSnapshot.groups.preventivi;
  const directItems = allPreventivi.filter(
    (item) => item.sourceType === "costo_mezzo" || item.sourceType === "documento_mezzo",
  );
  const plausibleDocumentItems = allPreventivi.filter(
    (item) => item.sourceType === "documento_magazzino" || item.sourceType === "documento_generico",
  );
  const supportItems = buildSupportItems(args.procurement);
  const outOfScopeItems = buildOutOfScopeItems();

  return {
    mezzoTarga: args.documentSnapshot.mezzoTarga,
    title: `Preview preventivi IA per ${args.documentSnapshot.mezzoTarga}`,
    subtitle:
      "Primo assorbimento prudente della capability legacy preventivi: solo letture clone-safe, distinzione esplicita tra diretti, supporti separati e fuori perimetro.",
    generatedAt: new Date().toISOString(),
    header: {
      targa: args.documentSnapshot.mezzoTarga,
      categoria: args.categoria,
      marcaModello: args.marcaModello,
      preventiviDiretti: directItems.length,
      supportiPlausibili: plausibleDocumentItems.length + supportItems.length,
      fuoriPerimetro: outOfScopeItems.length,
    },
    cards: buildCards({
      directItems,
      supportItems,
      plausibleDocumentItems,
      outOfScopeItems,
    }),
    buckets: [
      createBucket({
        id: "preventivi-diretti",
        title: "Preventivi direttamente collegabili",
        summary: `${directItems.length} preventivi gia mezzo-centrici disponibili nel clone per questa targa.`,
        items: directItems.map((item) =>
          mapPreventivoItem({
            item,
            classification: "diretto",
            collegamentoLabel: "Diretto mezzo-centrico",
          }),
        ),
        emptyNote: "Nessun preventivo diretto mezzo-centrico disponibile per la targa selezionata.",
        extraNotes: [
          "I record diretti provengono solo dai layer clone-safe gia attivi su documenti/costi.",
        ],
      }),
      createBucket({
        id: "preventivi-plausibili",
        title: "Preventivi plausibili o supporti separati",
        summary:
          `${plausibleDocumentItems.length + supportItems.length} elementi leggibili richiedono prudenza o restano nel supporto procurement separato.`,
        items: [
          ...plausibleDocumentItems.map((item) =>
            mapPreventivoItem({
              item,
              classification: "plausibile",
              collegamentoLabel: "Plausibile ma non diretto",
            }),
          ),
          ...supportItems,
        ],
        emptyNote: "Nessun preventivo plausibile o supporto separato rilevante disponibile per questa targa.",
        extraNotes: [
          "Il procurement globale non viene fuso nel blocco diretto finche non esiste un layer mezzo-centrico dedicato.",
        ],
      }),
      createBucket({
        id: "preventivi-fuori-perimetro",
        title: "Preventivi fuori perimetro",
        summary:
          "Parsing IA, upload, scritture, approvazioni e PDF timbrati restano esplicitamente esclusi dal primo blocco preventivi IA.",
        items: outOfScopeItems,
        emptyNote: "Nessun elemento fuori perimetro da segnalare in questa preview iniziale.",
        extraNotes: [
          "Il runtime legacy preventivi resta solo riferimento tecnico, non backend canonico del clone.",
        ],
      }),
    ],
    safePerimeter: [
      "Lettura read-only dei preventivi gia mezzo-centrici esposti dal layer clone-safe documenti/costi.",
      "Supporto prudenziale da procurement globale e approvazioni solo come contesto separato, non come base diretta.",
      "Distinzione esplicita tra record diretti, supporti plausibili e flussi fuori perimetro.",
      "Nessun parsing AI reale, nessun upload Storage e nessuna scrittura su dataset business.",
    ],
    outOfScope: [
      "Runtime legacy preventivi in src/pages/Acquisti.tsx e callable legacy estraiPreventivoIA.",
      "OCR reale, parsing AI, ingestione nuovi file e upload su Storage.",
      "Scritture su @preventivi, @preventivi_approvazioni, @documenti_* o altri dataset business.",
      "Workflow approvativo, PDF timbrati e provider reali come backend canonico del blocco preventivi.",
    ],
    missingData: buildMissingData({
      directItems,
      plausibleDocumentItems,
      supportItems,
      procurement: args.procurement,
    }),
    sources: buildSources({
      directItems,
      plausibleDocumentItems,
      documentSnapshot: args.documentSnapshot,
      procurement: args.procurement,
    }),
    previewState: buildPreviewState({
      directCount: directItems.length,
      plausibleCount: plausibleDocumentItems.length + supportItems.length,
    }),
  };
}

export async function readInternalAiPreventiviPreview(
  targa: string,
): Promise<InternalAiPreventiviPreviewReadResult> {
  const normalizedTarga = normalizeNextMezzoTarga(targa);

  if (!normalizedTarga) {
    return {
      status: "invalid_query",
      normalizedTarga: null,
      message: "Inserisci una targa valida prima di aprire la preview preventivi IA.",
      preview: null,
    };
  }

  const mezzo = await readNextMezzoByTarga(normalizedTarga);
  if (!mezzo) {
    return {
      status: "not_found",
      normalizedTarga,
      message: `Nessun mezzo reale trovato nel clone per la targa ${normalizedTarga}.`,
      preview: null,
    };
  }

  const [documentSnapshot, procurement] = await Promise.all([
    readNextMezzoDocumentiCostiSnapshot(normalizedTarga),
    readNextDocumentiCostiProcurementSupportSnapshot(normalizedTarga),
  ]);

  const preview = buildPreview({
    documentSnapshot,
    procurement,
    categoria: mezzo.categoria || null,
    marcaModello: mezzo.marcaModello || null,
  });

  return {
    status: "ready",
    normalizedTarga,
    message:
      preview.header.preventiviDiretti > 0 || preview.header.supportiPlausibili > 0
        ? `Preview preventivi pronta per ${normalizedTarga}: ${preview.header.preventiviDiretti} diretti, ${preview.header.supportiPlausibili} supporti plausibili/separati e ${preview.header.fuoriPerimetro} elementi fuori perimetro dichiarati.`
        : `Preview preventivi pronta per ${normalizedTarga}: nessun preventivo diretto disponibile, ma limiti e supporti separati sono dichiarati in modo esplicito.`,
    preview,
  };
}
