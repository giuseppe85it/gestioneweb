import {
  findInternalAiExactVehicleMatch,
  readInternalAiVehicleLookupCatalog,
} from "./internalAiVehicleLookup";
import {
  findInternalAiExactDriverMatch,
  readInternalAiDriverLookupCatalog,
} from "./internalAiDriverLookup";
import { readInternalAiCombinedReportPreview } from "./internalAiCombinedReportFacade";
import { readInternalAiDriverReportPreview } from "./internalAiDriverReportFacade";
import {
  createDefaultInternalAiReportPeriodInput,
  createInternalAiCustomPeriodInput,
} from "./internalAiReportPeriod";
import { readInternalAiVehicleCapabilityCatalog } from "./internalAiVehicleCapabilityCatalog";
import { runInternalAiVehicleDossierHook } from "./internalAiVehicleDossierHookFacade";
import { readInternalAiVehicleReportPreview } from "./internalAiVehicleReportFacade";
import type {
  InternalAiChatExecutionStatus,
  InternalAiChatIntent,
  InternalAiChatMessageReference,
  InternalAiReportPeriodInput,
  InternalAiReportPreview,
} from "./internalAiTypes";

export type InternalAiChatTurnResult = {
  intent: InternalAiChatIntent;
  status: InternalAiChatExecutionStatus;
  assistantText: string;
  references: InternalAiChatMessageReference[];
  report:
    | {
        status: "ready";
        normalizedTarga: string;
        message: string;
        preview: InternalAiReportPreview;
      }
    | {
        status: "ready";
        normalizedDriverQuery: string;
        message: string;
        preview: InternalAiReportPreview;
      }
    | {
        status: "invalid_query" | "not_found";
        normalizedTarga: string | null;
        message: string;
        preview: null;
      }
    | {
        status: "invalid_query" | "not_found";
        normalizedDriverQuery: string | null;
        message: string;
        preview: null;
      }
    | {
        status: "ready";
        normalizedTarga: string;
        normalizedDriverQuery: string;
        message: string;
        preview: InternalAiReportPreview;
      }
    | {
        status: "invalid_query" | "not_found";
        normalizedTarga: string | null;
        normalizedDriverQuery: string | null;
        message: string;
        preview: null;
      }
    | null;
};

type ParsedIntent =
  | {
      intent: "report_combinato";
      extractedTarga: string | null;
      extractedDriverQuery: string | null;
    }
  | {
      intent: "report_targa";
      extractedTarga: string | null;
      extractedDriverQuery: null;
    }
  | {
      intent: "report_autista";
      extractedTarga: null;
      extractedDriverQuery: string | null;
    }
  | {
      intent: "repo_understanding" | "capabilities" | "non_supportato" | "richiesta_generica";
      extractedTarga: null;
      extractedDriverQuery: null;
    };

const HELP_PATTERNS = [
  "aiuto",
  "cosa puoi fare",
  "che report puoi creare",
  "quali report puoi creare",
  "capacita",
  "capacitá",
];

const UNSUPPORTED_PATTERNS = [
  "modifica il codice",
  "modifica codice",
  "salva in produzione",
  "manda un alert",
  "whatsapp",
  "analizza github",
  "scrivi sui dati",
  "scrivi nei dati",
  "applica la patch",
  "fai una pr",
  "fai un merge",
];

const REPORT_PATTERNS = [
  "crea report",
  "fammi una preview",
  "fammi un report",
  "analizza il mezzo",
  "analizza mezzo",
  "report mezzo",
  "report targa",
  "preview targa",
  "analizza la targa",
];

const DRIVER_REPORT_PATTERNS = [
  "report autista",
  "analizza autista",
  "fammi un report per l'autista",
  "fammi un report autista",
  "preview autista",
];

const COMBINED_REPORT_PATTERNS = [
  "report combinato",
  "mezzo con autista",
  "autista sul mezzo",
];

const REPO_UNDERSTANDING_PATTERNS = [
  "repository",
  "repo",
  "modulo",
  "moduli",
  "pagina",
  "pagine",
  "schermata",
  "schermate",
  "ui",
  "interfaccia",
  "layout",
  "componente",
  "componenti",
  "shell next",
  "shell",
  "route",
  "route next",
  "percorso",
  "percorsi",
  "pattern ui",
  "stile del gestionale",
  "convenzioni visive",
  "dossier",
  "centro controllo",
  "analisi economica",
  "semplificare il gestionale",
  "capire il repo",
];

function normalizePrompt(prompt: string): string {
  return prompt.toLowerCase().replace(/\s+/g, " ").trim();
}

function extractTarga(prompt: string): string | null {
  const matches = prompt.toUpperCase().match(/[A-Z]{2}\s*\d{3,6}\s*[A-Z]{0,2}/g);
  if (!matches || !matches.length) {
    return null;
  }

  return matches[0].replace(/\s+/g, "");
}

function extractDriverQuery(prompt: string): string | null {
  const normalized = prompt
    .replace(/[“”"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const match =
    normalized.match(/autista\s+(.+)$/i) ??
    normalized.match(/report\s+per\s+(.+)$/i);
  if (!match?.[1]) {
    return null;
  }

  return stripTrailingPeriodContext(match[1]) || null;
}

function stripTrailingPeriodContext(value: string): string {
  return value
    .replace(
      /\s+(?:ultimi\s+30\s+giorni|ultimi\s+90\s+giorni|ultimo mese(?: chiuso)?|dal\s+\d{1,4}[./-]\d{1,2}[./-]\d{1,4}\s+(?:al|a)\s+\d{1,4}[./-]\d{1,2}[./-]\d{1,4})$/i,
      "",
    )
    .replace(/[?.!,;:]+$/g, "")
    .trim();
}

function extractCombinedDriverQuery(prompt: string): string | null {
  const normalized = prompt
    .replace(/[â€œâ€"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const patterns = [
    /con autista\s+(.+)$/i,
    /autista\s+(.+?)\s+sul mezzo\s+[A-Z0-9\s]+$/i,
    /(?:analizza|report|fammi report|fammi un report)\s+(.+?)\s+sul mezzo\s+[A-Z0-9\s]+$/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const cleaned = stripTrailingPeriodContext(match[1]);
      if (cleaned) {
        return cleaned;
      }
    }
  }

  return null;
}

function extractPeriodInput(prompt: string, fallback?: InternalAiReportPeriodInput) {
  const normalized = normalizePrompt(prompt);
  if (normalized.includes("ultimi 30 giorni")) {
    return {
      input: {
        preset: "last_30_days",
        fromDate: null,
        toDate: null,
      } as const,
      label: "ultimi 30 giorni",
    };
  }

  if (normalized.includes("ultimi 90 giorni")) {
    return {
      input: {
        preset: "last_90_days",
        fromDate: null,
        toDate: null,
      } as const,
      label: "ultimi 90 giorni",
    };
  }

  if (normalized.includes("ultimo mese")) {
    return {
      input: {
        preset: "last_full_month",
        fromDate: null,
        toDate: null,
      } as const,
      label: "ultimo mese chiuso",
    };
  }

  const customMatch = prompt.match(
    /(?:dal|da)\s+(\d{1,4}[./-]\d{1,2}[./-]\d{1,4})\s+(?:al|a)\s+(\d{1,4}[./-]\d{1,2}[./-]\d{1,4})/i,
  );
  if (customMatch?.[1] && customMatch?.[2]) {
    return {
      input: createInternalAiCustomPeriodInput(customMatch[1], customMatch[2]),
      label: `intervallo ${customMatch[1]} - ${customMatch[2]}`,
    };
  }

  return {
    input: fallback ?? createDefaultInternalAiReportPeriodInput(),
    label: "tutto lo storico disponibile",
  };
}

function parseIntent(prompt: string): ParsedIntent {
  const normalized = normalizePrompt(prompt);
  const extractedTarga = extractTarga(prompt);
  const extractedDriverQuery = extractDriverQuery(prompt);
  const extractedCombinedDriverQuery = extractCombinedDriverQuery(prompt);

  if (HELP_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return { intent: "capabilities", extractedTarga: null, extractedDriverQuery: null };
  }

  if (REPO_UNDERSTANDING_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return { intent: "repo_understanding", extractedTarga: null, extractedDriverQuery: null };
  }

  if (UNSUPPORTED_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return { intent: "non_supportato", extractedTarga: null, extractedDriverQuery: null };
  }

  if (
    (extractedTarga && extractedCombinedDriverQuery) ||
    (COMBINED_REPORT_PATTERNS.some((pattern) => normalized.includes(pattern)) &&
      (extractedTarga || extractedCombinedDriverQuery))
  ) {
    return {
      intent: "report_combinato",
      extractedTarga,
      extractedDriverQuery: extractedCombinedDriverQuery,
    };
  }

  if (
    DRIVER_REPORT_PATTERNS.some((pattern) => normalized.includes(pattern)) ||
    (normalized.includes("autista") && !extractedTarga && extractedDriverQuery)
  ) {
    return {
      intent: "report_autista",
      extractedTarga: null,
      extractedDriverQuery,
    };
  }

  if (REPORT_PATTERNS.some((pattern) => normalized.includes(pattern)) || extractedTarga) {
    return { intent: "report_targa", extractedTarga, extractedDriverQuery: null };
  }

  return { intent: "richiesta_generica", extractedTarga: null, extractedDriverQuery: null };
}

function buildCapabilitiesResponse(): InternalAiChatTurnResult {
  const vehicleCapabilities = readInternalAiVehicleCapabilityCatalog();
  const capabilityLines = vehicleCapabilities
    .map((entry) => {
      const filterLabel = [
        entry.requiredFilters.includes("targa") ? "targa" : null,
        entry.optionalFilters.includes("periodo") ? "periodo opzionale" : null,
      ]
        .filter(Boolean)
        .join(", ");

      return `- ${entry.title}: ${filterLabel || "perimetro mezzo-centrico read-only"}.`;
    })
    .join("\n");

  return {
    intent: "capabilities",
    status: "completed",
    assistantText:
      "Posso aiutarti solo con capacita gia attive e sicure del sottosistema IA interno.\n\n" +
      "Oggi posso:\n" +
      `${capabilityLines}\n` +
      "- creare una anteprima report per autista in sola lettura, anche con periodo;\n" +
      "- creare una anteprima report combinata mezzo + autista + periodo, dichiarando il livello di affidabilita del legame;\n" +
      "- spiegare il repository, le schermate principali e alcuni pattern UI del clone quando il backend server-side reale e disponibile;\n" +
      "- chiarire quali fonti vengono lette, cosa e parziale e cosa resta fuori perimetro.\n\n" +
      "Non posso modificare codice in automatico, scrivere sui dati business o inviare alert esterni.",
    references: [
      {
        type: "capabilities",
        label: "Catalogo capability mezzo-centriche governate",
        targa: null,
      },
      {
        type: "safe_mode_notice",
        label: "Safe mode del sottosistema IA interno",
        targa: null,
      },
    ],
    report: null,
  };
}

function buildUnsupportedResponse(): InternalAiChatTurnResult {
  return {
    intent: "non_supportato",
    status: "not_supported",
    assistantText:
      "Questa richiesta non e ancora disponibile nella chat controllata del sottosistema IA.\n\n" +
      "In questa fase posso solo lavorare in modalita preview e sola lettura dentro il clone. " +
      "Non posso modificare codice, salvare in produzione, inviare alert, usare IA reale o scrivere sui dati business.",
    references: [
      {
        type: "safe_mode_notice",
        label: "Funzione non attiva in safe mode",
        targa: null,
      },
    ],
    report: null,
  };
}

function buildRepoUnderstandingFallbackResponse(): InternalAiChatTurnResult {
  return {
    intent: "repo_understanding",
    status: "partial",
    assistantText:
      "Posso aiutarti a leggere il repository e i pattern UI del gestionale solo quando il backend server-side controllato e disponibile.\n\n" +
      "In fallback locale posso solo confermare il perimetro sicuro: niente patch automatiche, niente scritture business e niente uso dei backend legacy come canale canonico.\n\n" +
      'Se il backend e attivo, prova con richieste come "spiegami la shell NEXT", "quali pattern UI posso riusare" oppure "come sono collegate le schermate principali".',
    references: [
      {
        type: "repo_understanding",
        label: "Comprensione controllata repo/UI disponibile solo via backend server-side",
        targa: null,
      },
      {
        type: "safe_mode_notice",
        label: "Nessuna modifica automatica del repository",
        targa: null,
      },
    ],
    report: null,
  };
}

function buildGenericResponse(): InternalAiChatTurnResult {
  return {
    intent: "richiesta_generica",
    status: "partial",
    assistantText:
      "Ho capito la richiesta, ma al momento la chat controllata supporta solo una parte del perimetro.\n\n" +
      "Se vuoi, puoi chiedermi:\n" +
      '- "crea report targa AB123CD ultimi 30 giorni"\n' +
      '- "fammi un report per l\'autista Mario Rossi ultimo mese"\n' +
      '- "fammi report mezzo TI123456 con autista Mario Rossi ultimi 30 giorni"\n' +
      '- "fammi una preview per la targa TI123456 ultimi 90 giorni"\n' +
      '- "dimmi lo stato del mezzo TI123456"\n' +
      '- "riepiloga i rifornimenti del mezzo TI123456 ultimi 30 giorni"\n' +
      '- "elenca i documenti del mezzo TI123456"\n' +
      '- "riepiloga i costi del mezzo TI123456 ultimi 90 giorni"\n' +
      '- "spiegami la shell NEXT e le schermate principali"\n' +
      '- "quali pattern UI del repo posso riusare"\n' +
      '- "cosa puoi fare"',
    references: [
      {
        type: "capabilities",
        label: "Prompt supportati",
        targa: null,
      },
    ],
    report: null,
  };
}

async function buildReportResponse(
  extractedTarga: string | null,
  rawPrompt: string,
  fallbackPeriodInput?: InternalAiReportPeriodInput,
): Promise<InternalAiChatTurnResult> {
  if (!extractedTarga) {
    return {
      intent: "report_targa",
      status: "partial",
      assistantText:
        "Posso creare una anteprima report per targa, ma nella richiesta manca una targa valida.\n\n" +
        'Esempio: "crea report targa AB123CD".',
      references: [
        {
          type: "report_preview",
          label: "Serve una targa valida per avviare la preview",
          targa: null,
        },
      ],
      report: {
        status: "invalid_query",
        normalizedTarga: null,
        message: "Inserisci una targa valida prima di avviare l'anteprima.",
        preview: null,
      },
    };
  }

  const periodSelection = extractPeriodInput(rawPrompt, fallbackPeriodInput);
  const result = await readInternalAiVehicleReportPreview(extractedTarga, periodSelection.input);

  if (result.status !== "ready") {
    return {
      intent: "report_targa",
      status: result.status === "not_found" ? "partial" : "failed",
      assistantText:
        result.status === "not_found"
          ? `Non ho trovato un mezzo leggibile nel clone per la targa ${extractedTarga}.\n\nPosso riprovare se mi dai una targa diversa.`
          : "Non sono riuscito ad avviare la preview perche la targa non e valida.",
      references: [
        {
          type: "report_preview",
          label: "Esito preview targa",
          targa: result.normalizedTarga,
        },
      ],
      report: {
        status: result.status,
        normalizedTarga: result.normalizedTarga,
        message: result.message,
        preview: null,
      },
    };
  }

  return {
    intent: "report_targa",
    status: "completed",
    assistantText:
      `Ho creato la preview in sola lettura per la targa ${result.normalizedTarga}.\n\n` +
      `${result.report.title}\n` +
      `- Periodo: ${result.report.periodContext.label}\n` +
      `- Fonti lette: ${result.report.sources.length}\n` +
      `- Dati mancanti: ${result.report.missingData.length}\n` +
      `- Evidenze raccolte: ${result.report.evidences.length}\n\n` +
      "Ho aggiornato anche la sezione di anteprima report qui sotto. Se vuoi, puoi salvare il risultato nell'archivio artifact IA locale.",
    references: [
      {
        type: "report_preview",
        label: `Preview report ${result.normalizedTarga}`,
        targa: result.normalizedTarga,
      },
      {
        type: "artifact_archive",
        label: "Archivio artifact IA locale",
        targa: result.normalizedTarga,
      },
    ],
    report: {
      status: "ready",
      normalizedTarga: result.normalizedTarga,
      message: result.message,
      preview: result.report,
    },
  };
}

async function buildDriverReportResponse(
  extractedDriverQuery: string | null,
  rawPrompt: string,
  fallbackPeriodInput?: InternalAiReportPeriodInput,
): Promise<InternalAiChatTurnResult> {
  if (!extractedDriverQuery) {
    return {
      intent: "report_autista",
      status: "partial",
      assistantText:
        "Posso creare una anteprima report per autista, ma nella richiesta manca un nome o badge valido.\n\n" +
        'Esempio: "fammi un report per l\'autista Mario Rossi".',
      references: [
        {
          type: "report_preview",
          label: "Serve un autista reale selezionabile",
          targa: null,
        },
      ],
      report: {
        status: "invalid_query",
        normalizedDriverQuery: null,
        message: "Inserisci un autista reale oppure selezionalo dal lookup guidato.",
        preview: null,
      },
    };
  }

  const driverCatalog = await readInternalAiDriverLookupCatalog();
  const exactDriver = findInternalAiExactDriverMatch(driverCatalog, extractedDriverQuery);
  const periodSelection = extractPeriodInput(rawPrompt, fallbackPeriodInput);
  const result = await readInternalAiDriverReportPreview(
    exactDriver,
    extractedDriverQuery,
    periodSelection.input,
  );

  if (result.status !== "ready") {
    return {
      intent: "report_autista",
      status: result.status === "not_found" ? "partial" : "failed",
      assistantText:
        result.status === "not_found"
          ? `Non ho trovato un autista leggibile nel clone per "${extractedDriverQuery}".\n\nPosso riprovare se mi dai il nome completo oppure il badge.`
          : "Non sono riuscito ad avviare la preview autista perche la richiesta non e valida.",
      references: [
        {
          type: "report_preview",
          label: "Esito preview autista",
          targa: null,
        },
      ],
      report: {
        status: result.status,
        normalizedDriverQuery: result.normalizedDriverQuery,
        message: result.message,
        preview: null,
      },
    };
  }

  return {
    intent: "report_autista",
    status: "completed",
    assistantText:
      `Ho creato la preview in sola lettura per l'autista ${result.report.header.nomeCompleto}.\n\n` +
      `${result.report.title}\n` +
      `- Periodo: ${result.report.periodContext.label}\n` +
      `- Fonti lette: ${result.report.sources.length}\n` +
      `- Dati mancanti: ${result.report.missingData.length}\n` +
      `- Evidenze raccolte: ${result.report.evidences.length}\n\n` +
      "Ho aggiornato anche la sezione di anteprima report qui sotto. Se vuoi, puoi salvare il risultato nell'archivio artifact IA locale.",
    references: [
      {
        type: "report_preview",
        label: `Preview report ${result.report.header.nomeCompleto}`,
        targa: result.report.header.ultimoMezzoNoto,
      },
      {
        type: "artifact_archive",
        label: "Archivio artifact IA locale",
        targa: result.report.header.ultimoMezzoNoto,
      },
    ],
    report: {
      status: "ready",
      normalizedDriverQuery: result.normalizedDriverQuery,
      message: result.message,
      preview: result.report,
    },
  };
}

async function buildCombinedReportResponse(
  extractedTarga: string | null,
  extractedDriverQuery: string | null,
  rawPrompt: string,
  fallbackPeriodInput?: InternalAiReportPeriodInput,
): Promise<InternalAiChatTurnResult> {
  if (!extractedTarga || !extractedDriverQuery) {
    return {
      intent: "report_combinato",
      status: "partial",
      assistantText:
        "Posso creare una anteprima combinata mezzo + autista, ma nella richiesta manca almeno uno dei due riferimenti necessari.\n\n" +
        'Esempio: "fammi report mezzo TI123456 con autista Mario Rossi ultimi 30 giorni".',
      references: [
        {
          type: "report_preview",
          label: "Servono sia mezzo sia autista per la preview combinata",
          targa: extractedTarga,
        },
      ],
      report: {
        status: "invalid_query",
        normalizedTarga: extractedTarga,
        normalizedDriverQuery: extractedDriverQuery,
        message: "Per il report combinato servono sia una targa valida sia un autista reale selezionabile.",
        preview: null,
      },
    };
  }

  const [vehicleCatalog, driverCatalog] = await Promise.all([
    readInternalAiVehicleLookupCatalog(),
    readInternalAiDriverLookupCatalog(),
  ]);
  const exactVehicle = findInternalAiExactVehicleMatch(vehicleCatalog, extractedTarga);
  const exactDriver = findInternalAiExactDriverMatch(driverCatalog, extractedDriverQuery);
  const periodSelection = extractPeriodInput(rawPrompt, fallbackPeriodInput);
  const result = await readInternalAiCombinedReportPreview({
    driverCandidate: exactDriver,
    rawTarga: exactVehicle?.targa ?? extractedTarga,
    rawDriverQuery: extractedDriverQuery,
    periodInput: periodSelection.input,
  });

  if (result.status !== "ready") {
    return {
      intent: "report_combinato",
      status: result.status === "not_found" ? "partial" : "failed",
      assistantText:
        result.status === "not_found"
          ? `Non sono riuscito a comporre una preview combinata leggibile per ${extractedTarga} + ${extractedDriverQuery}.\n\nControlla che mezzo e autista siano reali e selezionabili nel clone.`
          : "Non sono riuscito ad avviare la preview combinata perche i riferimenti o il periodo non sono validi.",
      references: [
        {
          type: "report_preview",
          label: "Esito preview combinata",
          targa: result.normalizedTarga,
        },
      ],
      report: {
        status: result.status,
        normalizedTarga: result.normalizedTarga,
        normalizedDriverQuery: result.normalizedDriverQuery,
        message: result.message,
        preview: null,
      },
    };
  }

  return {
    intent: "report_combinato",
    status: "completed",
    assistantText:
      `Ho creato la preview combinata in sola lettura per ${result.report.header.targa} + ${result.report.header.nomeCompletoAutista}.\n\n` +
      `${result.report.title}\n` +
      `- Periodo: ${result.report.periodContext.label}\n` +
      `- Affidabilita legame: ${result.report.cards[0]?.value ?? "non disponibile"}\n` +
      `- Fonti lette: ${result.report.sources.length}\n` +
      `- Dati mancanti: ${result.report.missingData.length}\n\n` +
      "Ho aggiornato anche la sezione di anteprima report qui sotto. Se vuoi, puoi salvare il risultato nell'archivio artifact IA locale.",
    references: [
      {
        type: "report_preview",
        label: `Preview combinata ${result.report.header.targa} + ${result.report.header.nomeCompletoAutista}`,
        targa: result.report.header.targa,
      },
      {
        type: "artifact_archive",
        label: "Archivio artifact IA locale",
        targa: result.report.header.targa,
      },
    ],
    report: {
      status: "ready",
      normalizedTarga: result.normalizedTarga,
      normalizedDriverQuery: result.normalizedDriverQuery,
      message: result.message,
      preview: result.report,
    },
  };
}

export async function runInternalAiChatTurn(
  prompt: string,
  fallbackPeriodInput?: InternalAiReportPeriodInput,
): Promise<InternalAiChatTurnResult> {
  const parsed = parseIntent(prompt);

  switch (parsed.intent) {
    case "repo_understanding":
      return buildRepoUnderstandingFallbackResponse();
    case "capabilities":
      return buildCapabilitiesResponse();
    case "non_supportato":
      return buildUnsupportedResponse();
    case "report_combinato":
      return buildCombinedReportResponse(
        parsed.extractedTarga,
        parsed.extractedDriverQuery,
        prompt,
        fallbackPeriodInput,
      );
    case "report_targa":
      return (
        (await runInternalAiVehicleDossierHook(prompt, fallbackPeriodInput)) ??
        buildReportResponse(parsed.extractedTarga, prompt, fallbackPeriodInput)
      );
    case "report_autista":
      return buildDriverReportResponse(parsed.extractedDriverQuery, prompt, fallbackPeriodInput);
    default:
      return (await runInternalAiVehicleDossierHook(prompt, fallbackPeriodInput)) ?? buildGenericResponse();
  }
}
