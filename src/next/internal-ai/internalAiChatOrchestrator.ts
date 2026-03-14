import { readInternalAiVehicleReportPreview } from "./internalAiVehicleReportFacade";
import type {
  InternalAiChatExecutionStatus,
  InternalAiChatIntent,
  InternalAiChatMessageReference,
  InternalAiVehicleReportPreview,
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
        preview: InternalAiVehicleReportPreview;
      }
    | {
        status: "invalid_query" | "not_found";
        normalizedTarga: string | null;
        message: string;
        preview: null;
      }
    | null;
};

type ParsedIntent =
  | {
      intent: "report_targa";
      extractedTarga: string | null;
    }
  | {
      intent: "capabilities" | "non_supportato" | "richiesta_generica";
      extractedTarga: null;
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
  "report targa",
  "preview targa",
  "analizza la targa",
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

function parseIntent(prompt: string): ParsedIntent {
  const normalized = normalizePrompt(prompt);
  const extractedTarga = extractTarga(prompt);

  if (HELP_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return { intent: "capabilities", extractedTarga: null };
  }

  if (UNSUPPORTED_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return { intent: "non_supportato", extractedTarga: null };
  }

  if (REPORT_PATTERNS.some((pattern) => normalized.includes(pattern)) || extractedTarga) {
    return { intent: "report_targa", extractedTarga };
  }

  return { intent: "richiesta_generica", extractedTarga: null };
}

function buildCapabilitiesResponse(): InternalAiChatTurnResult {
  return {
    intent: "capabilities",
    status: "completed",
    assistantText:
      "Posso aiutarti solo con capacita gia attive e sicure del sottosistema IA interno.\n\n" +
      "Oggi posso:\n" +
      "- creare una anteprima report per targa in sola lettura;\n" +
      "- aprire dalla home una anteprima di analisi economica mezzo, basata su layer clone-safe e snapshot legacy salvato;\n" +
      "- spiegare quali fonti vengono lette e quali dati mancano;\n" +
      "- indirizzarti verso l'archivio artifact IA locale del clone;\n" +
      "- chiarire quando una funzione non e ancora disponibile.\n\n" +
      "Non posso ancora modificare codice, scrivere sui dati business, usare provider IA reali o inviare alert esterni.",
    references: [
      {
        type: "capabilities",
        label: "Capacita reali della chat controllata",
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

function buildGenericResponse(): InternalAiChatTurnResult {
  return {
    intent: "richiesta_generica",
    status: "partial",
    assistantText:
      "Ho capito la richiesta, ma al momento la chat controllata supporta solo una parte del perimetro.\n\n" +
      "Se vuoi, puoi chiedermi:\n" +
      '- "crea report targa AB123CD"\n' +
      '- "fammi una preview per la targa TI123456"\n' +
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

async function buildReportResponse(extractedTarga: string | null): Promise<InternalAiChatTurnResult> {
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

  const result = await readInternalAiVehicleReportPreview(extractedTarga);

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

export async function runInternalAiChatTurn(prompt: string): Promise<InternalAiChatTurnResult> {
  const parsed = parseIntent(prompt);

  switch (parsed.intent) {
    case "capabilities":
      return buildCapabilitiesResponse();
    case "non_supportato":
      return buildUnsupportedResponse();
    case "report_targa":
      return buildReportResponse(parsed.extractedTarga);
    default:
      return buildGenericResponse();
  }
}
