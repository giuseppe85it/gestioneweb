import {
  normalizeNextMezzoTarga,
  readNextAnagraficheFlottaSnapshot,
  type NextAnagraficheFlottaMezzoItem,
} from "../nextAnagraficheFlottaDomain";
import { readNextLibrettiExportSnapshot } from "../domain/nextLibrettiExportDomain";
import type {
  InternalAiLibrettoPreview,
  InternalAiLibrettoPreviewBucket,
  InternalAiLibrettoPreviewItem,
  InternalAiPreviewState,
  InternalAiVehicleReportCard,
  InternalAiVehicleReportSource,
} from "./internalAiTypes";

export type InternalAiLibrettoPreviewReadResult =
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
      preview: InternalAiLibrettoPreview;
    };

export type InternalAiLibrettoPreviewVehicleContext = NextAnagraficheFlottaMezzoItem & {
  librettoStoragePath: string | null;
};

type InternalAiLibrettoPreviewBuildInput = {
  mezzo: InternalAiLibrettoPreviewVehicleContext;
  flottaLimitations: string[];
  fileAvailabilityDataset: string;
  fileAvailabilityLimitations: string[];
  sourceModeLabel?: string | null;
};

function takeNotes(notes: string[] | undefined, limit = 3): string[] {
  return (notes ?? []).filter(Boolean).slice(0, limit);
}

function formatDateLabel(value: string, timestamp: number | null): string {
  if (timestamp) {
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(timestamp));
  }

  return value || "non disponibile";
}

function pushIfPresent(
  target: InternalAiLibrettoPreviewItem[],
  entry: InternalAiLibrettoPreviewItem | null,
): void {
  if (entry) {
    target.push(entry);
  }
}

function hasReadableLibrettoFile(mezzo: InternalAiLibrettoPreviewVehicleContext): boolean {
  return Boolean(mezzo.librettoUrl);
}

function buildDirectItems(args: {
  mezzo: InternalAiLibrettoPreviewVehicleContext;
  fileAvailabilityDataset: string;
}): InternalAiLibrettoPreviewItem[] {
  const items: InternalAiLibrettoPreviewItem[] = [];
  const hasLibrettoFile = hasReadableLibrettoFile(args.mezzo);

  pushIfPresent(
    items,
    hasLibrettoFile
      ? {
          id: "libretto-file-diretto",
          title: "File libretto disponibile",
          valueLabel: args.mezzo.librettoStoragePath
            ? "URL disponibile con fallback Storage"
            : "URL disponibile",
          classification: "diretto",
          sourceLabel: args.fileAvailabilityDataset,
          traceabilityLabel: `${args.mezzo.sourceKey} / ${args.mezzo.targa}`,
          notes: [
            args.mezzo.librettoStoragePath
              ? "Storage fallback disponibile in sola lettura."
              : "Solo librettoUrl disponibile nel clone.",
          ],
        }
      : null,
  );
  pushIfPresent(
    items,
    args.mezzo.telaio
      ? {
          id: "libretto-telaio",
          title: "Telaio",
          valueLabel: args.mezzo.telaio,
          classification: "diretto",
          sourceLabel: "@mezzi_aziendali",
          traceabilityLabel: `${args.mezzo.sourceKey} / ${args.mezzo.targa}`,
          notes: ["Campo strutturato gia leggibile nel mezzo clone-safe."],
        }
      : null,
  );
  pushIfPresent(
    items,
    args.mezzo.dataImmatricolazione
      ? {
          id: "libretto-immatricolazione",
          title: "Prima immatricolazione",
          valueLabel: formatDateLabel(
            args.mezzo.dataImmatricolazione,
            args.mezzo.dataImmatricolazioneTimestamp,
          ),
          classification: "diretto",
          sourceLabel: "@mezzi_aziendali",
          traceabilityLabel: `${args.mezzo.sourceKey} / ${args.mezzo.targa}`,
          notes: [
            args.mezzo.dataImmatricolazioneTimestamp
              ? "Data parseabile dal layer clone-safe."
              : "Data disponibile come stringa grezza.",
          ],
        }
      : null,
  );
  pushIfPresent(
    items,
    args.mezzo.dataScadenzaRevisione
      ? {
          id: "libretto-revisione",
          title: "Scadenza revisione",
          valueLabel: formatDateLabel(
            args.mezzo.dataScadenzaRevisione,
            args.mezzo.dataScadenzaRevisioneTimestamp,
          ),
          classification: "diretto",
          sourceLabel: "@mezzi_aziendali",
          traceabilityLabel: `${args.mezzo.sourceKey} / ${args.mezzo.targa}`,
          notes: [
            args.mezzo.dataScadenzaRevisioneTimestamp
              ? "Scadenza parseabile dal layer clone-safe."
              : "Scadenza disponibile come stringa grezza.",
          ],
        }
      : null,
  );
  pushIfPresent(
    items,
    args.mezzo.dataUltimoCollaudo
      ? {
          id: "libretto-ultimo-collaudo",
          title: "Ultimo collaudo",
          valueLabel: formatDateLabel(
            args.mezzo.dataUltimoCollaudo,
            args.mezzo.dataUltimoCollaudoTimestamp,
          ),
          classification: "diretto",
          sourceLabel: "@mezzi_aziendali",
          traceabilityLabel: `${args.mezzo.sourceKey} / ${args.mezzo.targa}`,
          notes: [
            args.mezzo.dataUltimoCollaudoTimestamp
              ? "Ultimo collaudo parseabile dal layer clone-safe."
              : "Ultimo collaudo disponibile come stringa grezza.",
          ],
        }
      : null,
  );
  pushIfPresent(
    items,
    args.mezzo.massaComplessiva
      ? {
          id: "libretto-massa",
          title: "Massa complessiva",
          valueLabel: args.mezzo.massaComplessiva,
          classification: "diretto",
          sourceLabel: "@mezzi_aziendali",
          traceabilityLabel: `${args.mezzo.sourceKey} / ${args.mezzo.targa}`,
          notes: ["Dato strutturato disponibile in lettura diretta sul mezzo."],
        }
      : null,
  );

  return items;
}

function buildPlausibleItems(args: {
  mezzo: InternalAiLibrettoPreviewVehicleContext;
  fileAvailabilityDataset: string;
}): InternalAiLibrettoPreviewItem[] {
  const items: InternalAiLibrettoPreviewItem[] = [];
  const hasLibrettoFile = hasReadableLibrettoFile(args.mezzo);

  if (!hasLibrettoFile) {
    items.push({
      id: "libretto-file-assente",
      title: "File libretto",
      valueLabel: "assente nel clone",
      classification: "plausibile",
      sourceLabel: args.fileAvailabilityDataset,
      traceabilityLabel: `${args.mezzo.sourceKey} / ${args.mezzo.targa}`,
      notes: ["Serve verifica manuale: nessun librettoUrl gia leggibile sul mezzo."],
    });
  }

  if (!args.mezzo.telaio) {
    items.push({
      id: "libretto-telaio-assente",
      title: "Telaio",
      valueLabel: "non disponibile",
      classification: "plausibile",
      sourceLabel: "@mezzi_aziendali",
      traceabilityLabel: `${args.mezzo.sourceKey} / ${args.mezzo.targa}`,
      notes: ["Campo core libretto assente nel record mezzo attuale."],
    });
  }

  if (!args.mezzo.dataImmatricolazione) {
    items.push({
      id: "libretto-immatricolazione-assente",
      title: "Prima immatricolazione",
      valueLabel: "non disponibile",
      classification: "plausibile",
      sourceLabel: "@mezzi_aziendali",
      traceabilityLabel: `${args.mezzo.sourceKey} / ${args.mezzo.targa}`,
      notes: ["Data assente nel record mezzo; nessuna ricostruzione OCR attivata."],
    });
  }

  if (args.mezzo.flags.includes("immatricolazione_non_parseabile")) {
    items.push({
      id: "libretto-immatricolazione-non-parseabile",
      title: "Prima immatricolazione",
      valueLabel: args.mezzo.dataImmatricolazione || "stringa non disponibile",
      classification: "plausibile",
      sourceLabel: "@mezzi_aziendali",
      traceabilityLabel: `${args.mezzo.sourceKey} / ${args.mezzo.targa}`,
      notes: ["Valore presente ma non parseabile nel formato legacy corrente."],
    });
  }

  if (!args.mezzo.dataScadenzaRevisione) {
    items.push({
      id: "libretto-revisione-assente",
      title: "Scadenza revisione",
      valueLabel: "non disponibile",
      classification: "plausibile",
      sourceLabel: "@mezzi_aziendali",
      traceabilityLabel: `${args.mezzo.sourceKey} / ${args.mezzo.targa}`,
      notes: ["Scadenza assente nel record mezzo; nessun recupero esterno attivato."],
    });
  }

  if (args.mezzo.flags.includes("revisione_non_parseabile")) {
    items.push({
      id: "libretto-revisione-non-parseabile",
      title: "Scadenza revisione",
      valueLabel: args.mezzo.dataScadenzaRevisione || "stringa non disponibile",
      classification: "plausibile",
      sourceLabel: "@mezzi_aziendali",
      traceabilityLabel: `${args.mezzo.sourceKey} / ${args.mezzo.targa}`,
      notes: ["Valore presente ma non parseabile nel formato legacy corrente."],
    });
  }

  if (args.mezzo.marcaModello) {
    items.push({
      id: "libretto-contesto-marca-modello",
      title: "Contesto mezzo",
      valueLabel: args.mezzo.marcaModello,
      classification: "plausibile",
      sourceLabel: "@mezzi_aziendali",
      traceabilityLabel: `${args.mezzo.sourceKey} / ${args.mezzo.targa}`,
      notes: ["Supporto contestuale per revisione umana; non sostituisce il dato libretto core."],
    });
  }

  return items;
}

function createOutOfScopeItems(
  mezzo: InternalAiLibrettoPreviewVehicleContext,
): InternalAiLibrettoPreviewItem[] {
  return [
    {
      id: "libretto-fuori-perimetro-ocr",
      title: "OCR e Cloud Run libretto",
      valueLabel: "disattivati",
      classification: "fuori_perimetro",
      sourceLabel: "runtime legacy escluso",
      traceabilityLabel: "src/pages/IA/IALibretto.tsx / Cloud Run esterno",
      notes: [
        "Nessun OCR reale o analisi immagine attivata nel clone.",
        "Nessun riuso runtime del backend legacy o Cloud Run esterno.",
      ],
    },
    {
      id: "libretto-fuori-perimetro-scritture",
      title: "Upload e salvataggio su mezzo",
      valueLabel: "bloccati",
      classification: "fuori_perimetro",
      sourceLabel: "@mezzi_aziendali + Storage",
      traceabilityLabel: `${mezzo.sourceKey} / ${mezzo.targa}`,
      notes: [
        "Nessuna scrittura su @mezzi_aziendali.",
        "Nessun upload file su Storage business.",
      ],
    },
    {
      id: "libretto-fuori-perimetro-provider",
      title: "Provider reali e segreti",
      valueLabel: "fuori perimetro",
      classification: "fuori_perimetro",
      sourceLabel: "configurazione esclusa",
      traceabilityLabel: "@impostazioni_app/gemini / provider reali",
      notes: [
        "Nessun provider reale attivato nel clone.",
        "Nessuna gestione chiavi lato client nel blocco preview.",
      ],
    },
  ];
}

function createBucket(args: {
  id: string;
  title: string;
  summary: string;
  items: InternalAiLibrettoPreviewItem[];
  emptyNote: string;
  extraNotes?: string[];
}): InternalAiLibrettoPreviewBucket {
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
    status: args.directCount > 0 ? "preview_ready" : "revision_requested",
    updatedAt: new Date().toISOString(),
    note:
      args.directCount > 0 || args.plausibleCount > 0
        ? "Preview libretto costruita in sola lettura sui layer clone-safe gia attivi, senza OCR, upload o scritture business."
        : "Nessun dato libretto utile leggibile nel perimetro sicuro iniziale: la preview resta prudenziale e solo diagnostica.",
  };
}

function buildCards(args: {
  directItems: InternalAiLibrettoPreviewItem[];
  plausibleItems: InternalAiLibrettoPreviewItem[];
  outOfScopeItems: InternalAiLibrettoPreviewItem[];
  mezzo: InternalAiLibrettoPreviewVehicleContext;
}): InternalAiVehicleReportCard[] {
  const hasLibrettoFile = hasReadableLibrettoFile(args.mezzo);

  return [
    {
      label: "Dati diretti",
      value: `${args.directItems.length}`,
      meta: "Campi libretto gia leggibili in modo strutturato nel clone.",
      tone: args.directItems.length > 0 ? "success" : "warning",
    },
    {
      label: "Dati plausibili",
      value: `${args.plausibleItems.length}`,
      meta: "Campi incompleti, grezzi o solo contestuali da verificare.",
      tone: args.plausibleItems.length > 0 ? "warning" : "success",
    },
    {
      label: "Fuori perimetro",
      value: `${args.outOfScopeItems.length}`,
      meta: "Flussi esclusi dal primo assorbimento prudente del libretto.",
      tone: "warning",
    },
    {
      label: "File libretto",
      value: hasLibrettoFile ? "Presente" : "Assente",
      meta: hasLibrettoFile
        ? args.mezzo.librettoStoragePath
          ? "URL disponibile con fallback Storage read-only."
          : "URL disponibile senza fallback Storage."
        : "Nessun file libretto gia leggibile nel clone.",
      tone: hasLibrettoFile ? "success" : "warning",
    },
  ];
}

function buildSources(args: {
  mezzo: InternalAiLibrettoPreviewVehicleContext;
  flottaLimitations: string[];
  fileAvailabilityDataset: string;
  fileAvailabilityLimitations: string[];
  sourceModeLabel?: string | null;
}): InternalAiVehicleReportSource[] {
  const hasLibrettoFile = hasReadableLibrettoFile(args.mezzo);

  return [
    {
      id: "fonte-libretto-mezzo",
      title: "Anagrafica mezzo clone-safe",
      status: "disponibile",
      description:
        "Fonte primaria del blocco libretto: lettura read-only del mezzo in @mezzi_aziendali, senza writer o OCR.",
      datasetLabels: [args.mezzo.sourceKey],
      countLabel: `${args.mezzo.flags.length} flag tecnici`,
      notes: [
        ...takeNotes(args.flottaLimitations, 2),
        ...(args.sourceModeLabel ? [args.sourceModeLabel] : []),
      ],
      periodStatus: "non_applicabile",
      periodNote: "Il blocco libretto iniziale non apre un filtro periodo dedicato.",
    },
    {
      id: "fonte-libretto-preview-file",
      title: "Preview file libretto gia disponibile",
      status: hasLibrettoFile ? "disponibile" : "parziale",
      description:
        "Supporto clone-safe per capire se esiste gia un librettoUrl o un fallback Storage, senza aprire upload o download nuovi.",
      datasetLabels: [args.fileAvailabilityDataset],
      countLabel: hasLibrettoFile
        ? args.mezzo.librettoStoragePath
          ? "URL + fallback Storage"
          : "Solo URL"
        : "Nessun file libretto",
      notes: takeNotes(args.fileAvailabilityLimitations, 2),
      periodStatus: "non_applicabile",
      periodNote: "Il blocco mostra solo disponibilita e copertura file, non genera PDF o viewer dedicati.",
    },
    {
      id: "fonte-libretto-fuori-perimetro",
      title: "Flussi esclusi dal primo step",
      status: "parziale",
      description:
        "OCR, Cloud Run esterno, upload e scritture business restano fuori dal perimetro iniziale della capability libretto.",
      datasetLabels: ["@mezzi_aziendali", "Storage business", "Cloud Run esterno"],
      countLabel: null,
      notes: [
        "Nessun backend legacy usato come canale canonico.",
        "Nessuna scrittura o upload riaperti nel clone.",
      ],
      periodStatus: "non_applicabile",
      periodNote: "Queste sorgenti non vengono attivate dal blocco preview-first.",
    },
  ];
}

function buildMissingData(args: {
  mezzo: InternalAiLibrettoPreviewVehicleContext;
}): string[] {
  const missing: string[] = [];
  const hasLibrettoFile = hasReadableLibrettoFile(args.mezzo);

  if (!hasLibrettoFile) {
    missing.push("Nessun file libretto gia leggibile associato al mezzo nel clone.");
  }
  if (!args.mezzo.telaio) {
    missing.push("Il campo telaio non e disponibile nel record mezzo attuale.");
  }
  if (!args.mezzo.dataImmatricolazione) {
    missing.push("La prima immatricolazione non e disponibile nel record mezzo attuale.");
  }
  if (!args.mezzo.dataScadenzaRevisione) {
    missing.push("La scadenza revisione non e disponibile nel record mezzo attuale.");
  }
  if (args.mezzo.flags.includes("immatricolazione_non_parseabile")) {
    missing.push("La prima immatricolazione e presente ma non parseabile nel formato legacy corrente.");
  }
  if (args.mezzo.flags.includes("revisione_non_parseabile")) {
    missing.push("La scadenza revisione e presente ma non parseabile nel formato legacy corrente.");
  }

  return missing;
}

export function buildInternalAiLibrettoPreviewReadyMessage(
  preview: InternalAiLibrettoPreview,
): string {
  return preview.header.datiDiretti > 0
    ? `Preview libretto pronta per ${preview.header.targa}: ${preview.header.datiDiretti} dati diretti, ${preview.header.datiPlausibili} plausibili e file libretto ${preview.header.fileLibretto}.`
    : `Preview libretto pronta per ${preview.header.targa}: nessun dato diretto forte, ma limiti e segnali plausibili sono dichiarati in modo esplicito.`;
}

export function buildInternalAiLibrettoPreviewFromVehicleContext(
  args: InternalAiLibrettoPreviewBuildInput,
): InternalAiLibrettoPreview {
  const directItems = buildDirectItems({
    mezzo: args.mezzo,
    fileAvailabilityDataset: args.fileAvailabilityDataset,
  });
  const plausibleItems = buildPlausibleItems({
    mezzo: args.mezzo,
    fileAvailabilityDataset: args.fileAvailabilityDataset,
  });
  const outOfScopeItems = createOutOfScopeItems(args.mezzo);

  return {
    mezzoTarga: args.mezzo.targa,
    title: `Preview libretto IA per ${args.mezzo.targa}`,
    subtitle:
      "Primo assorbimento prudente della capability legacy libretto: solo letture clone-safe, distinzione tra dati diretti, plausibili e fuori perimetro.",
    generatedAt: new Date().toISOString(),
    header: {
      targa: args.mezzo.targa,
      datiDiretti: directItems.length,
      datiPlausibili: plausibleItems.length,
      fuoriPerimetro: outOfScopeItems.length,
      fileLibretto: hasReadableLibrettoFile(args.mezzo) ? "presente" : "assente",
    },
    cards: buildCards({
      directItems,
      plausibleItems,
      outOfScopeItems,
      mezzo: args.mezzo,
    }),
    buckets: [
      createBucket({
        id: "libretto-diretti",
        title: "Dati libretto diretti",
        summary: `${directItems.length} dati strutturati gia leggibili nel clone per questa targa.`,
        items: directItems,
        emptyNote: "Nessun dato diretto sufficientemente strutturato disponibile nel perimetro iniziale.",
        extraNotes: ["Il blocco usa solo @mezzi_aziendali e preview file clone-safe gia esistenti."],
      }),
      createBucket({
        id: "libretto-plausibili",
        title: "Dati plausibili o incompleti",
        summary: `${plausibleItems.length} segnali richiedono verifica manuale o completamento del dato.`,
        items: plausibleItems,
        emptyNote: "Nessun dato plausibile o incompleto aggiuntivo da segnalare per questa targa.",
        extraNotes: ["Nessuna ricostruzione OCR o inferenza esterna viene attivata in questo step."],
      }),
      createBucket({
        id: "libretto-fuori-perimetro",
        title: "Fuori perimetro",
        summary:
          "OCR, Cloud Run, upload e scritture business restano esplicitamente esclusi dal primo blocco libretto IA.",
        items: outOfScopeItems,
        emptyNote: "Nessun elemento fuori perimetro da segnalare in questa preview iniziale.",
        extraNotes: ["Il runtime legacy libretto resta solo riferimento tecnico, non backend canonico."],
      }),
    ],
    safePerimeter: [
      "Lettura read-only dei campi gia presenti su @mezzi_aziendali per il mezzo selezionato.",
      "Verifica clone-safe della sola disponibilita del file libretto gia presente, senza upload o OCR.",
      "Distinzione esplicita tra dato diretto, dato plausibile e flusso fuori perimetro.",
      "Nessuna scrittura su @mezzi_aziendali, nessun upload Storage e nessun backend legacy riattivato.",
      ...(args.sourceModeLabel
        ? [args.sourceModeLabel]
        : []),
    ],
    outOfScope: [
      "Runtime legacy src/pages/IA/IALibretto.tsx e Cloud Run esterno per estrazione libretto.",
      "OCR reale, analisi immagine, upload foto libretto e salvataggio automatico sul mezzo.",
      "Scritture su @mezzi_aziendali o path Storage business del libretto.",
      "Provider reali, segreti lato client e qualunque backend IA canonico esterno al clone.",
    ],
    missingData: buildMissingData({
      mezzo: args.mezzo,
    }),
    sources: buildSources({
      mezzo: args.mezzo,
      flottaLimitations: args.flottaLimitations,
      fileAvailabilityDataset: args.fileAvailabilityDataset,
      fileAvailabilityLimitations: args.fileAvailabilityLimitations,
      sourceModeLabel: args.sourceModeLabel,
    }),
    previewState: buildPreviewState({
      directCount: directItems.length,
      plausibleCount: plausibleItems.length,
    }),
  };
}

export async function readInternalAiLibrettoPreview(
  targa: string,
): Promise<InternalAiLibrettoPreviewReadResult> {
  const normalizedTarga = normalizeNextMezzoTarga(targa);

  if (!normalizedTarga) {
    return {
      status: "invalid_query",
      normalizedTarga: null,
      message: "Inserisci una targa valida prima di aprire la preview libretto IA.",
      preview: null,
    };
  }

  const [flottaSnapshot, librettiSnapshot] = await Promise.all([
    readNextAnagraficheFlottaSnapshot(),
    readNextLibrettiExportSnapshot(),
  ]);
  const mezzo = flottaSnapshot.items.find((entry) => entry.targa === normalizedTarga) ?? null;

  if (!mezzo) {
    return {
      status: "not_found",
      normalizedTarga,
      message: `Nessun mezzo reale trovato nel clone per la targa ${normalizedTarga}.`,
      preview: null,
    };
  }

  const librettoRow = librettiSnapshot.items.find((entry) => entry.targa === normalizedTarga) ?? null;
  const preview = buildInternalAiLibrettoPreviewFromVehicleContext({
    mezzo: {
      ...mezzo,
      librettoStoragePath: librettoRow?.librettoStoragePath ?? null,
    },
    flottaLimitations: flottaSnapshot.limitations,
    fileAvailabilityDataset: librettiSnapshot.activeReadOnlyDataset,
    fileAvailabilityLimitations: librettiSnapshot.limitations,
  });

  return {
    status: "ready",
    normalizedTarga,
    message: buildInternalAiLibrettoPreviewReadyMessage(preview),
    preview,
  };
}
