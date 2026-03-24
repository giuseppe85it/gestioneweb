import {
  createDefaultInternalAiReportPeriodInput,
  createInternalAiCustomPeriodInput,
} from "./internalAiReportPeriod";
import { readNextMezzoByTarga } from "../nextAnagraficheFlottaDomain";
import { readNextMezzoOperativitaTecnicaSnapshot } from "../nextOperativitaTecnicaDomain";
import { readNextStatoOperativoSnapshot } from "../domain/nextCentroControlloDomain";
import { readInternalAiVehicleCapabilityCatalog } from "./internalAiVehicleCapabilityCatalog";
import {
  isInternalAiUnifiedIntelligenceCandidate,
  runInternalAiUnifiedIntelligenceQuery,
} from "./internalAiUnifiedIntelligenceEngine";
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
        status: "invalid_query" | "not_found";
        normalizedTarga: string | null;
        message: string;
        preview: null;
      }
    | {
        status: "ready";
        normalizedDriverQuery: string;
        message: string;
        preview: InternalAiReportPreview;
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
      intent: "report_targa";
      extractedTarga: string | null;
    }
  | {
      intent: "stato_operativo_mezzo";
      extractedTarga: string | null;
    }
  | {
      intent: "repo_understanding" | "capabilities" | "non_supportato" | "richiesta_generica";
      extractedTarga: null;
    };

type PrudentDomainGuidance = {
  code: "D03" | "D04" | "D05" | "D06" | "D07" | "D08" | "D09";
  title: string;
  statusLabel: "BLOCCANTE PER IMPORTAZIONE" | "SENSIBILE" | "DA VERIFICARE";
  detectionPatterns: string[];
  mainFiles: string[];
  capabilityToday: string[];
  notReady: string[];
  nextStep: string;
};

type DomainDecoration =
  | {
      domainLabel: string;
      reliabilityLabel: string;
      structuredOutputLabel: string;
    }
  | null;

const DOMAIN_REFERENCE_PREFIX = "Dominio rilevato: ";
const RELIABILITY_REFERENCE_PREFIX = "Affidabilita: ";
const OUTPUT_REFERENCE_PREFIX = "Output suggerito: ";
const FIRST_VERTICAL_DOMAIN_LABEL = "D01 + D10 + D02 prima verticale mezzo/Home/tecnica";

const HELP_PATTERNS = [
  "aiuto",
  "cosa puoi fare",
  "che report puoi creare",
  "quali report puoi creare",
  "capacita",
  "capacità",
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
  "fammi un report",
  "report mezzo",
  "report targa",
  "report della targa",
  "report pdf",
  "pdf mezzo",
  "pdf targa",
  "anteprima report",
  "preview targa",
  "preview report",
  "apri il report",
];

const VEHICLE_STATUS_PATTERNS = [
  "stato mezzo",
  "stato targa",
  "stato del mezzo",
  "come sta",
  "come sta oggi",
  "che situazione ha",
  "situazione mezzo",
  "situazione targa",
  "problemi del mezzo",
  "problemi della targa",
  "problemi mezzo",
  "problemi targa",
  "quadro operativo",
  "quadro mezzo",
  "analizza la targa",
  "stato operativo",
  "alert",
  "revisione",
  "revisioni",
  "lavori",
  "manutenzioni",
];

const HOME_ANALYSIS_PATTERNS = [
  "analizza la home",
  "analizza home",
  "analisi home",
  "spiegami la home",
  "home operativa",
  "alert della home",
  "revisioni della home",
  "stato operativo home",
];

const FILE_TOUCH_PATTERNS = [
  "quale file tocco",
  "quale file devo toccare",
  "quali file devo toccare",
  "quali moduli sono coinvolti",
  "quali moduli coinvolti",
  "file coinvolti",
  "moduli coinvolti",
  "file da toccare",
  "mappa file",
];

const REPO_UNDERSTANDING_PATTERNS = [...HOME_ANALYSIS_PATTERNS, ...FILE_TOUCH_PATTERNS];

const PRUDENT_DOMAIN_GUIDANCE: readonly PrudentDomainGuidance[] = [
  {
    code: "D03",
    title: "Autisti, sessioni ed eventi di campo",
    statusLabel: "BLOCCANTE PER IMPORTAZIONE",
    detectionPatterns: [
      "autista",
      "autisti",
      "sessione",
      "sessioni",
      "eventi di campo",
      "log accessi",
      "cambio mezzo",
      "segnalazioni",
      "richiesta attrezzature",
      "controlli autisti",
      "badge autista",
    ],
    mainFiles: [
      "src/next/domain/nextCentroControlloDomain.ts",
      "src/next/NextAutistiInboxHomePage.tsx",
      "src/next/NextAutistiAdminPage.tsx",
      "src/next/components/NextAutistiEventoModal.tsx",
    ],
    capabilityToday: [
      "riconoscere il dominio e orientare sui moduli principali",
      "indicare i file NEXT piu rilevanti e il legame con il cockpit D10",
      "dichiarare i limiti senza promuovere D03 a dominio canonico della chat",
    ],
    notReady: [
      "il dominio e marcato BLOCCANTE PER IMPORTAZIONE nei documenti dati",
      "la sorgente canonica degli eventi autisti non e ancora chiusa in modo definitivo",
    ],
    nextStep:
      "aprire un audit separato sul feed autisti e sulla sorgente canonica eventi prima di renderlo operativo in chat.",
  },
  {
    code: "D04",
    title: "Rifornimenti e consumi",
    statusLabel: "SENSIBILE",
    detectionPatterns: [
      "rifornimenti",
      "rifornimento",
      "carburante",
      "gasolio",
      "diesel",
      "consumi",
      "litri",
    ],
    mainFiles: [
      "src/next/domain/nextRifornimentiDomain.ts",
      "src/next/nextRifornimentiConsumiDomain.ts",
      "src/next/NextDossierRifornimentiPage.tsx",
      "src/next/NextRifornimentiEconomiaSection.tsx",
    ],
    capabilityToday: [
      "riconoscere il dominio e mostrare i reader/domain NEXT gia presenti",
      "chiarire il confine tra dossier rifornimenti, feed operativi e analisi",
      "orientare sui file/moduli senza aprire report fuori prima verticale",
    ],
    notReady: [
      "il dominio resta SENSIBILE per la convivenza tra canonico e feed tmp",
      "la chat non ha ancora un percorso consolidato su consumi o anomalie fuori prima verticale",
    ],
    nextStep:
      "aprire un task dedicato sul perimetro read-only di D04 prima di rendere il dominio forte nel thread.",
  },
  {
    code: "D05",
    title: "Magazzino, inventario e movimenti materiali",
    statusLabel: "BLOCCANTE PER IMPORTAZIONE",
    detectionPatterns: [
      "magazzino",
      "inventario",
      "materiali",
      "movimenti materiali",
      "materiali consegnati",
      "attrezzature",
    ],
    mainFiles: [
      "src/next/domain/nextMaterialiMovimentiDomain.ts",
      "src/next/domain/nextInventarioDomain.ts",
      "src/next/NextInventarioPage.tsx",
      "src/next/NextMaterialiConsegnatiPage.tsx",
    ],
    capabilityToday: [
      "riconoscere il dominio e orientare sui moduli globali principali",
      "spiegare quali reader NEXT esistono gia in sola lettura",
      "dichiarare perche non e ancora un dominio consolidato della chat",
    ],
    notReady: [
      "il dominio e marcato BLOCCANTE PER IMPORTAZIONE nei documenti dati",
      "stock, movimenti e consegne restano ancora troppo accoppiati per una chat affidabile",
    ],
    nextStep:
      "separare con un task dedicato stock, movimenti e consegne prima di aprire una capability IA piu forte.",
  },
  {
    code: "D06",
    title: "Procurement, ordini, preventivi e fornitori",
    statusLabel: "SENSIBILE",
    detectionPatterns: [
      "procurement",
      "ordini",
      "ordine",
      "arrivi",
      "preventivi",
      "preventivo",
      "fornitori",
      "fornitore",
      "acquisti",
      "listino",
    ],
    mainFiles: [
      "src/next/domain/nextProcurementDomain.ts",
      "src/next/domain/nextFornitoriDomain.ts",
      "src/next/NextAcquistiPage.tsx",
      "src/next/NextDettaglioOrdinePage.tsx",
      "src/next/NextFornitoriPage.tsx",
    ],
    capabilityToday: [
      "riconoscere il dominio e mostrare dove passano ordini e fornitori nella NEXT",
      "indicare i file/moduli principali senza inventare report procurement nel thread",
      "dichiarare il confine con preventivi e approvazioni ancora non consolidati in chat",
    ],
    notReady: [
      "il dominio resta SENSIBILE nei documenti dati",
      "preventivi e allegati procurement non hanno ancora un percorso IA consolidato nella chat",
    ],
    nextStep:
      "aprire un task separato sul solo dominio D06 per decidere se portare prima ordini/fornitori o preventivi.",
  },
  {
    code: "D07",
    title: "Documentale IA, libretti e configurazione IA",
    statusLabel: "DA VERIFICARE",
    detectionPatterns: [
      "documenti",
      "documento",
      "allegati",
      "libretto",
      "libretti",
      "copertura libretti",
      "configurazione ia",
      "api key",
    ],
    mainFiles: [
      "src/next/domain/nextDocumentiCostiDomain.ts",
      "src/next/domain/nextLibrettiExportDomain.ts",
      "src/next/NextIADocumentiPage.tsx",
      "src/next/NextIALibrettoPage.tsx",
    ],
    capabilityToday: [
      "riconoscere il dominio documentale e i moduli NEXT gia presenti",
      "orientare tra documenti, libretti export e superficie IA clone",
      "dichiarare con prudenza cosa e documentale e cosa e configurazione IA",
    ],
    notReady: [
      "il dominio e marcato DA VERIFICARE nei documenti dati",
      "la chat della prima verticale non consolida ancora documenti, libretti o configurazione IA come capability forte",
    ],
    nextStep:
      "aprire un audit separato sul perimetro documentale per distinguere intake, libretti e configurazione IA.",
  },
  {
    code: "D08",
    title: "Costi e analisi economica",
    statusLabel: "SENSIBILE",
    detectionPatterns: [
      "costi",
      "costo",
      "spese",
      "analisi economica",
      "economica",
      "economico",
      "fatture",
      "fattura",
    ],
    mainFiles: [
      "src/next/domain/nextDocumentiCostiDomain.ts",
      "src/next/NextAnalisiEconomicaPage.tsx",
      "src/next/NextCapoCostiMezzoPage.tsx",
      "src/next/internal-ai/internalAiEconomicAnalysisFacade.ts",
    ],
    capabilityToday: [
      "riconoscere il dominio economico e indicare i moduli principali gia presenti",
      "chiarire che oggi la chat puo solo orientare sul perimetro e sui file candidati",
      "dichiarare il confine con la prima verticale operativa mezzo/Home/tecnica",
    ],
    notReady: [
      "il dominio resta SENSIBILE nei documenti dati",
      "costi e analisi economica non hanno ancora una capability consolidata nel thread principale",
    ],
    nextStep:
      "aprire un task separato su D08 per decidere se consolidare prima costi diretti o analisi economica.",
  },
  {
    code: "D09",
    title: "Cisterna specialistica",
    statusLabel: "DA VERIFICARE",
    detectionPatterns: ["cisterna", "caravate", "schede test", "cisterna ia"],
    mainFiles: [
      "src/next/domain/nextCisternaDomain.ts",
      "src/next/NextCisternaPage.tsx",
      "src/next/NextCisternaIAPage.tsx",
      "src/next/NextCisternaSchedeTestPage.tsx",
    ],
    capabilityToday: [
      "riconoscere il dominio specialistico e mostrare i file NEXT dedicati",
      "orientare sul perimetro senza mescolare Cisterna con la prima verticale mezzo/Home/tecnica",
      "dichiarare in modo esplicito che il dominio resta separato e specialistico",
    ],
    notReady: [
      "il dominio e marcato DA VERIFICARE nei documenti dati",
      "la chat principale non deve trattare Cisterna come dominio gia consolidato",
    ],
    nextStep:
      "mantenere Cisterna in un task dedicato e specialistico prima di aprire capability IA forti nel thread.",
  },
] as const;

type RepoUnderstandingFocus = "home_analysis" | "file_touch" | "repo_support";

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

function detectPrudentDomainGuidance(prompt: string): PrudentDomainGuidance | null {
  const normalized = normalizePrompt(prompt);
  const match = PRUDENT_DOMAIN_GUIDANCE.find((entry) =>
    entry.detectionPatterns.some((pattern) => normalized.includes(pattern)),
  );
  return match ?? null;
}

function collectReferenceLabels(result: InternalAiChatTurnResult): Set<string> {
  return new Set(result.references.map((reference) => reference.label));
}

function hasReferenceWithPrefix(result: InternalAiChatTurnResult, prefix: string): boolean {
  return result.references.some((reference) => reference.label.startsWith(prefix));
}

function buildDomainDecoration(
  prompt: string,
  result: InternalAiChatTurnResult,
): DomainDecoration {
  const prudentDomain = detectPrudentDomainGuidance(prompt);
  if (prudentDomain) {
    return {
      domainLabel: `${prudentDomain.code} ${prudentDomain.title}`,
      reliabilityLabel: "Da verificare",
      structuredOutputLabel: "analisi strutturata prudente",
    };
  }

  if (result.intent === "report_targa" || result.intent === "mezzo_dossier") {
    return {
      domainLabel: FIRST_VERTICAL_DOMAIN_LABEL,
      reliabilityLabel: "Affidabile",
      structuredOutputLabel: result.intent === "report_targa" ? "report targa" : "analisi strutturata",
    };
  }

  if (result.intent === "repo_understanding") {
    return {
      domainLabel: detectRepoUnderstandingFocus(prompt) === "home_analysis"
        ? "D10 Stato operativo, alert e promemoria"
        : FIRST_VERTICAL_DOMAIN_LABEL,
      reliabilityLabel: "Parziale",
      structuredOutputLabel: "analisi strutturata",
    };
  }

  if (result.intent === "capabilities") {
    return {
      domainLabel: FIRST_VERTICAL_DOMAIN_LABEL,
      reliabilityLabel: "Parziale",
      structuredOutputLabel: "risposta breve",
    };
  }

  return null;
}

function decorateChatTurnResult(
  prompt: string,
  result: InternalAiChatTurnResult,
): InternalAiChatTurnResult {
  const decoration = buildDomainDecoration(prompt, result);
  if (!decoration) {
    return result;
  }

  const labels = collectReferenceLabels(result);
  const references = [...result.references];

  if (
    !labels.has(`${DOMAIN_REFERENCE_PREFIX}${decoration.domainLabel}`) &&
    !hasReferenceWithPrefix(result, DOMAIN_REFERENCE_PREFIX)
  ) {
    references.unshift({
      type: "architecture_doc",
      label: `${DOMAIN_REFERENCE_PREFIX}${decoration.domainLabel}`,
      targa: null,
    });
  }

  if (
    !labels.has(`${RELIABILITY_REFERENCE_PREFIX}${decoration.reliabilityLabel}`) &&
    !hasReferenceWithPrefix(result, RELIABILITY_REFERENCE_PREFIX)
  ) {
    references.push({
      type: "safe_mode_notice",
      label: `${RELIABILITY_REFERENCE_PREFIX}${decoration.reliabilityLabel}`,
      targa: null,
    });
  }

  if (!labels.has(`${OUTPUT_REFERENCE_PREFIX}${decoration.structuredOutputLabel}`)) {
    references.push({
      type: "capabilities",
      label: `${OUTPUT_REFERENCE_PREFIX}${decoration.structuredOutputLabel}`,
      targa: null,
    });
  }

  return {
    ...result,
    references,
  };
}

function buildPrudentDomainResponse(domain: PrudentDomainGuidance): InternalAiChatTurnResult {
  return {
    intent: "non_supportato",
    status: "not_supported",
    assistantText:
      `${DOMAIN_REFERENCE_PREFIX}${domain.code} ${domain.title}\n` +
      `${RELIABILITY_REFERENCE_PREFIX} Da verificare\n\n` +
      "File/moduli principali oggi:\n" +
      domain.mainFiles.map((entry) => `- ${entry}`).join("\n") +
      "\n\nCosa posso fare oggi:\n" +
      domain.capabilityToday.map((entry) => `- ${entry}.`).join("\n") +
      "\n\nCosa non e ancora pronto:\n" +
      [`- stato dominio nei documenti: ${domain.statusLabel}.`, ...domain.notReady.map((entry) => `- ${entry}.`)].join("\n") +
      `\n\nProssimo passo corretto:\n- ${domain.nextStep}`,
    references: [
      {
        type: "architecture_doc",
        label: `${DOMAIN_REFERENCE_PREFIX}${domain.code} ${domain.title}`,
        targa: null,
      },
      {
        type: "safe_mode_notice",
        label: `${RELIABILITY_REFERENCE_PREFIX} Da verificare`,
        targa: null,
      },
      {
        type: "capabilities",
        label: `${OUTPUT_REFERENCE_PREFIX} analisi strutturata prudente`,
        targa: null,
      },
      {
        type: "safe_mode_notice",
        label: `Stato dominio: ${domain.statusLabel}`,
        targa: null,
      },
    ],
    report: null,
  };
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

  if (HELP_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return { intent: "capabilities", extractedTarga: null };
  }

  if (!extractedTarga && REPO_UNDERSTANDING_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return { intent: "repo_understanding", extractedTarga: null };
  }

  if (UNSUPPORTED_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return { intent: "non_supportato", extractedTarga: null };
  }

  if (detectPrudentDomainGuidance(prompt)) {
    return { intent: "non_supportato", extractedTarga: null };
  }

  if (REPORT_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return { intent: "report_targa", extractedTarga };
  }

  if (VEHICLE_STATUS_PATTERNS.some((pattern) => normalized.includes(pattern)) || extractedTarga) {
    return { intent: "stato_operativo_mezzo", extractedTarga };
  }

  return { intent: "richiesta_generica", extractedTarga: null };
}

function detectRepoUnderstandingFocus(prompt: string): RepoUnderstandingFocus {
  const normalized = normalizePrompt(prompt);

  if (FILE_TOUCH_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "file_touch";
  }

  if (HOME_ANALYSIS_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "home_analysis";
  }

  return "repo_support";
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
      "La chat V1 e consolidata solo sulla prima verticale mezzo/Home/tecnica.\n\n" +
      "Oggi posso:\n" +
      `${capabilityLines}\n` +
      "- spiegare alert, revisione e stato operativo di una targa leggendo D10 senza usare pagine legacy come reader canonico;\n" +
      "- analizzare la Home operativa indicando superfici UI coinvolte e reader canonici D10, D01 e D02;\n" +
      "- indicare quali file e moduli toccare nel perimetro mezzo/Home senza allargare il dominio;\n" +
      "- dichiarare in modo esplicito cosa resta fuori verticale e quale dominio esterno richiederebbe consolidamento.\n\n" +
      "Non posso modificare codice in automatico, scrivere sui dati business o aprire domini esterni non ancora consolidati.",
    references: [
      {
        type: "capabilities",
        label: "Catalogo capability della prima verticale",
        targa: null,
      },
      {
        type: "safe_mode_notice",
        label: "Perimetro consolidato: D01 anagrafica, D10 stato operativo, D02 operativita tecnica",
        targa: null,
      },
    ],
    report: null,
  };
}

function buildUnsupportedResponse(prompt: string): InternalAiChatTurnResult {
  const prudentDomain = detectPrudentDomainGuidance(prompt);
  if (prudentDomain) {
    return buildPrudentDomainResponse(prudentDomain);
  }

  const limitText =
    "Questa richiesta non e ancora disponibile nella chat controllata del sottosistema IA.\n\n" +
    "In questa fase posso lavorare solo in modalita preview e sola lettura dentro il clone sulla prima verticale D01 + D10 + D02. " +
    "Non posso modificare codice, salvare in produzione, inviare alert o scrivere sui dati business.";

  return {
    intent: "non_supportato",
    status: "not_supported",
    assistantText: limitText,
    references: [
      {
        type: "safe_mode_notice",
        label: "Funzione non attiva nel perimetro controllato",
        targa: null,
      },
    ],
    report: null,
  };
}

async function buildRepoUnderstandingFallbackResponse(
  prompt: string,
): Promise<InternalAiChatTurnResult> {
  const focus = detectRepoUnderstandingFocus(prompt);

  if (focus === "home_analysis") {
    const snapshot = await readNextStatoOperativoSnapshot();
    return {
      intent: "repo_understanding",
      status: "partial",
      assistantText:
        "Posso leggere la Home operativa senza usare la pagina legacy come reader canonico.\n\n" +
        "Quadro D10 letto oggi:\n" +
        `- Alert visibili: ${snapshot.counters.alertsVisible}.\n` +
        `- Revisioni urgenti: ${snapshot.revisioniUrgenti.length}.\n` +
        `- Controlli KO: ${snapshot.counters.controlliKo}.\n` +
        `- Segnalazioni nuove: ${snapshot.counters.segnalazioniNuove}.\n` +
        `- Sessioni attive: ${snapshot.counters.sessioniAttive}.\n` +
        `- Mezzi incompleti: ${snapshot.counters.mezziIncompleti}.\n` +
        `- Eventi importanti: ${snapshot.counters.eventiImportanti}.\n\n` +
        "Superfici UI coinvolte:\n" +
        "- src/next/NextHomePage.tsx -> src/pages/Home.tsx.\n" +
        "- src/next/NextCentroControlloClonePage.tsx -> src/pages/CentroControllo.tsx.\n" +
        "- src/next/NextDossierMezzoPage.tsx.\n\n" +
        "Reader canonico IA:\n" +
        "- src/next/domain/nextCentroControlloDomain.ts.\n\n" +
        "Limite dichiarato: la superficie Home/NEXT monta ancora il clone della madre; per la chat il punto di verita resta il read model D10, non la pagina UI.",
      references: [
        {
          type: "architecture_doc",
          label: "Reader canonico Home: src/next/domain/nextCentroControlloDomain.ts",
          targa: null,
        },
        {
          type: "repo_understanding",
          label: "Superficie clone Home: src/next/NextHomePage.tsx",
          targa: null,
        },
        {
          type: "repo_understanding",
          label: "Superficie clone Centro Controllo: src/next/NextCentroControlloClonePage.tsx",
          targa: null,
        },
      ],
      report: null,
    };
  }

  if (focus === "file_touch") {
    return {
      intent: "repo_understanding",
      status: "partial",
      assistantText:
        "Per dirti quali file toccare senza allargare il perimetro, separo solo le zone che contano nella prima verticale.\n\n" +
        "Superfici Home:\n" +
        "- src/next/NextHomePage.tsx\n" +
        "- src/pages/Home.tsx\n" +
        "- src/utils/homeEvents.ts\n\n" +
        "Reader canonici NEXT:\n" +
        "- src/next/domain/nextCentroControlloDomain.ts\n" +
        "- src/next/nextAnagraficheFlottaDomain.ts\n" +
        "- src/next/nextOperativitaTecnicaDomain.ts\n\n" +
        "Chat IA interna NEXT:\n" +
        "- src/next/internal-ai/internalAiChatOrchestrator.ts\n" +
        "- src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts\n" +
        "- src/next/internal-ai/internalAiVehicleDossierHookFacade.ts\n" +
        "- src/next/internal-ai/internalAiVehicleReportFacade.ts\n" +
        "- src/next/internal-ai/internalAiOutputSelector.ts\n" +
        "- src/next/NextInternalAiPage.tsx\n\n" +
        "Da evitare come reader canonici IA: pagine legacy aggregate, Mezzo360 e compositi fuori D01 + D10 + D02.",
      references: [
        {
          type: "repo_understanding",
          label: "Home clone: src/pages/Home.tsx",
          targa: null,
        },
        {
          type: "architecture_doc",
          label: "Reader canonici NEXT: D01, D10, D02",
          targa: null,
        },
        {
          type: "repo_understanding",
          label: "IA interna: src/next/internal-ai/internalAiChatOrchestrator.ts",
          targa: null,
        },
      ],
      report: null,
    };
  }

  return {
    intent: "repo_understanding",
    status: "partial",
    assistantText:
      "Nel perimetro V1 tengo il focus su due richieste repo/UI davvero utili: analisi Home operativa e mappa file/moduli da toccare.\n\n" +
      "Qui la regola e semplice: le pagine UI spiegano la superficie, ma i reader canonici per la chat restano i layer NEXT read-only D10, D01 e D02.\n\n" +
      'Prova con: "analizza la home operativa" oppure "quali file devo toccare nel perimetro mezzo/Home".',
    references: [
      {
        type: "repo_understanding",
        label: "Perimetro repo/UI V1: Home operativa e file da toccare",
        targa: null,
      },
      {
        type: "safe_mode_notice",
        label: "Reader canonici: D10, D01 e D02 NEXT read-only",
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
      "Per tenere la V1 chiara e affidabile, qui gestisco solo la prima verticale mezzo/Home/tecnica.\n\n" +
      "Richieste consigliate:\n" +
      '- "Dimmi lo stato del mezzo AB123CD"\n' +
      '- "Come sta oggi la targa AB123CD"\n' +
      '- "Spiegami alert e revisione della targa AB123CD"\n' +
      '- "Che lavori e manutenzioni aperte ha AB123CD"\n' +
      '- "Fammi un report della targa AB123CD ultimi 30 giorni"\n' +
      '- "Analizza la home operativa"\n' +
      '- "Quali file devo toccare nel perimetro mezzo/Home"\n\n' +
      "Se la richiesta sconfina su autisti, rifornimenti, costi, documenti o preventivi, dichiaro il limite e non invento coperture fuori dominio.",
    references: [
      {
        type: "capabilities",
        label: "Prima verticale consolidata: stato mezzo, report targa, Home operativa e file/moduli",
        targa: null,
      },
    ],
    report: null,
  };
}

function formatValueOrCheck(value: string | null | undefined): string {
  const normalized = String(value ?? "").trim();
  return normalized || "DA VERIFICARE";
}

function takeTopLines(items: string[], limit: number = 3): string[] {
  return items.filter(Boolean).slice(0, limit);
}

async function buildVehicleOperationalStatusResponse(
  extractedTarga: string | null,
): Promise<InternalAiChatTurnResult> {
  if (!extractedTarga) {
    return {
      intent: "mezzo_dossier",
      status: "partial",
      assistantText:
        "Posso comporre lo stato operativo mezzo solo sulla prima verticale D01 + D10 + D02, ma nella richiesta manca una targa valida.\n\n" +
        'Esempio: "dimmi lo stato del mezzo AB123CD".',
      references: [
        {
          type: "capabilities",
          label: "Capability canonica: stato_operativo_mezzo",
          targa: null,
        },
        {
          type: "architecture_doc",
          label: `${DOMAIN_REFERENCE_PREFIX}${FIRST_VERTICAL_DOMAIN_LABEL}`,
          targa: null,
        },
        {
          type: "safe_mode_notice",
          label: `${RELIABILITY_REFERENCE_PREFIX} Parziale`,
          targa: null,
        },
      ],
      report: null,
    };
  }

  const mezzo = await readNextMezzoByTarga(extractedTarga);
  if (!mezzo) {
    return {
      intent: "mezzo_dossier",
      status: "partial",
      assistantText:
        `Non ho trovato una targa leggibile nel clone per ${extractedTarga}.\n\n` +
        "Posso riprovare se mi dai una targa diversa.",
      references: [
        {
          type: "capabilities",
          label: "Capability canonica: stato_operativo_mezzo",
          targa: extractedTarga,
        },
        {
          type: "architecture_doc",
          label: `${DOMAIN_REFERENCE_PREFIX}${FIRST_VERTICAL_DOMAIN_LABEL}`,
          targa: extractedTarga,
        },
        {
          type: "safe_mode_notice",
          label: `${RELIABILITY_REFERENCE_PREFIX} Parziale`,
          targa: extractedTarga,
        },
      ],
      report: null,
    };
  }

  const [statoOperativo, operativitaTecnica] = await Promise.all([
    readNextStatoOperativoSnapshot(),
    readNextMezzoOperativitaTecnicaSnapshot(mezzo.targa),
  ]);

  const revisioneItem =
    statoOperativo.revisioni.find((entry) => entry.targa === mezzo.targa) ?? null;
  const alertItems = statoOperativo.alerts.filter((entry) => entry.mezzoTarga === mezzo.targa);
  const focusItems = statoOperativo.focusItems.filter((entry) => entry.mezzoTarga === mezzo.targa);
  const d10Linked = Boolean(revisioneItem) || alertItems.length > 0 || focusItems.length > 0;
  const reliabilityLabel = d10Linked ? "Affidabile" : "Parziale";

  const alertLines = takeTopLines(
    alertItems.map(
      (entry) =>
        `${entry.title}: ${formatValueOrCheck(entry.detailText)}${entry.dateLabel ? ` (${entry.dateLabel})` : ""}`,
    ),
  );
  const focusLines = takeTopLines(
    focusItems.map(
      (entry) =>
        `${entry.title}: ${formatValueOrCheck(entry.detailText)}${entry.dateLabel ? ` (${entry.dateLabel})` : ""}`,
    ),
  );
  const lavoroLines = takeTopLines(
    operativitaTecnica.lavoriAperti.map(
      (entry) =>
        `${formatValueOrCheck(entry.descrizione)}${entry.urgenza ? ` | urgenza: ${entry.urgenza}` : ""}${
          entry.dataInserimento ? ` | inserito: ${entry.dataInserimento}` : ""
        }`,
    ),
  );
  const manutenzioneLines = takeTopLines(
    operativitaTecnica.manutenzioni.map(
      (entry) =>
        `${formatValueOrCheck(entry.descrizione ?? entry.tipo)}${
          entry.data ? ` | data: ${entry.data}` : ""
        }${entry.km !== null ? ` | km: ${entry.km}` : ""}`,
    ),
  );

  const limitLines = [
    !d10Linked
      ? "DA VERIFICARE: D10 non espone oggi alert, focus o revisione collegati in modo pienamente affidabile a questa targa."
      : null,
    ...statoOperativo.limitations.slice(0, 2),
    "La capability `stato_operativo_mezzo` legge solo D01, D10 e D02; report targa, documenti, costi, rifornimenti e altri domini restano fuori da questo percorso canonico.",
  ].filter((entry): entry is string => Boolean(entry));

  return {
    intent: "mezzo_dossier",
    status: d10Linked ? "completed" : "partial",
    assistantText:
      "Identita mezzo:\n" +
      `- Targa: ${mezzo.targa}\n` +
      `- Categoria: ${formatValueOrCheck(mezzo.categoria)}\n` +
      `- Marca/modello: ${formatValueOrCheck(mezzo.marcaModello)}\n` +
      `- Autista: ${formatValueOrCheck(mezzo.autistaNome)}\n` +
      `- Revisione anagrafica: ${formatValueOrCheck(mezzo.dataScadenzaRevisione)}\n\n` +
      "Stato operativo attuale:\n" +
      `- Segnali D10 collegati: ${d10Linked ? "presenti" : "parziali o assenti"}\n` +
      `- Alert letti: ${alertItems.length}\n` +
      `- Focus letti: ${focusItems.length}\n` +
      `- Revisione urgente in D10: ${revisioneItem ? "si" : "no o non collegabile"}\n\n` +
      "Alert / priorita:\n" +
      (alertLines.length || focusLines.length
        ? [...alertLines, ...focusLines].map((entry) => `- ${entry}`).join("\n")
        : "- Nessun alert o focus D10 collegato in modo certo oggi.") +
      "\n\nLavori / manutenzioni aperte:\n" +
      `- Lavori aperti: ${operativitaTecnica.counts.lavoriAperti}\n` +
      `- Manutenzioni lette: ${operativitaTecnica.counts.manutenzioni}\n` +
      (lavoroLines.length
        ? lavoroLines.map((entry) => `- ${entry}`).join("\n")
        : "- Nessun lavoro aperto letto su D02.") +
      "\n" +
      (manutenzioneLines.length
        ? manutenzioneLines.map((entry) => `- ${entry}`).join("\n")
        : "- Nessuna manutenzione letta su D02.") +
      "\n\nLimiti / DA VERIFICARE:\n" +
      limitLines.map((entry) => `- ${entry}`).join("\n"),
    references: [
      {
        type: "capabilities",
        label: "Capability canonica: stato_operativo_mezzo",
        targa: mezzo.targa,
      },
      {
        type: "architecture_doc",
        label: `${DOMAIN_REFERENCE_PREFIX}${FIRST_VERTICAL_DOMAIN_LABEL}`,
        targa: mezzo.targa,
      },
      {
        type: "architecture_doc",
        label: "Reader canonici: D01 nextAnagraficheFlottaDomain, D10 nextCentroControlloDomain, D02 nextOperativitaTecnicaDomain",
        targa: mezzo.targa,
      },
      {
        type: "safe_mode_notice",
        label: `${RELIABILITY_REFERENCE_PREFIX} ${reliabilityLabel}`,
        targa: mezzo.targa,
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
        "Posso creare il report della prima verticale, ma nella richiesta manca una targa valida.\n\n" +
        'Esempio: "crea report targa AB123CD".',
      references: [
        {
          type: "report_preview",
          label: "Serve una targa valida per avviare il report",
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
      `Ho preparato il report della prima verticale per la targa ${result.normalizedTarga}.\n\n` +
      "Quadro rapido:\n" +
      `- Periodo: ${result.report.periodContext.label}\n` +
      "- Percorso dati: reader canonici NEXT D01 + D10 + D02 in sola lettura\n" +
      `- Fonti lette: ${result.report.sources.length}\n` +
      `- Dati mancanti: ${result.report.missingData.length}\n` +
      `- Evidenze raccolte: ${result.report.evidences.length}\n\n` +
      "Ti apro l'anteprima PDF read-only e lascio in chat solo il quadro sintetico.",
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

export async function runInternalAiChatTurn(
  prompt: string,
  fallbackPeriodInput?: InternalAiReportPeriodInput,
): Promise<InternalAiChatTurnResult> {
  if (isInternalAiUnifiedIntelligenceCandidate(prompt)) {
    const unifiedResult = await runInternalAiUnifiedIntelligenceQuery(prompt, fallbackPeriodInput);
    if (unifiedResult) {
      return decorateChatTurnResult(prompt, unifiedResult);
    }
  }

  const parsed = parseIntent(prompt);

  switch (parsed.intent) {
    case "repo_understanding":
      return decorateChatTurnResult(prompt, await buildRepoUnderstandingFallbackResponse(prompt));
    case "capabilities":
      return decorateChatTurnResult(prompt, buildCapabilitiesResponse());
    case "non_supportato":
      return decorateChatTurnResult(prompt, buildUnsupportedResponse(prompt));
    case "stato_operativo_mezzo":
      return decorateChatTurnResult(
        prompt,
        await buildVehicleOperationalStatusResponse(parsed.extractedTarga),
      );
    case "report_targa":
      return decorateChatTurnResult(
        prompt,
        await buildReportResponse(parsed.extractedTarga, prompt, fallbackPeriodInput),
      );
    default:
      return decorateChatTurnResult(prompt, buildGenericResponse());
  }
}
