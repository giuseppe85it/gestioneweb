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

type LegacyPeriodSelection = {
  input: InternalAiReportPeriodInput;
  label: string;
  explicitRequested: boolean;
  resolved: boolean;
};

const DOMAIN_REFERENCE_PREFIX = "Dominio rilevato: ";
const RELIABILITY_REFERENCE_PREFIX = "Affidabilita: ";
const OUTPUT_REFERENCE_PREFIX = "Output suggerito: ";
const FIRST_VERTICAL_DOMAIN_LABEL = "D01 + D10 + D02 prima verticale mezzo/Home/tecnica";
const MONTH_NAME_TO_INDEX: Record<string, number> = {
  gennaio: 0,
  febbraio: 1,
  marzo: 2,
  aprile: 3,
  maggio: 4,
  giugno: 5,
  luglio: 6,
  agosto: 7,
  settembre: 8,
  ottobre: 9,
  novembre: 10,
  dicembre: 11,
};

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

const FLOW_ANALYSIS_PATTERNS = [
  "semplificare il flusso",
  "semplifico questo flusso",
  "spiegami i moduli collegati a questo flusso",
  "moduli collegati a questo flusso",
  "quali moduli e file sono collegati",
  "dove conviene intervenire",
  "flusso rifornimenti",
  "quali dipendenze rischio di rompere",
];

const DOSSIER_IMPACT_PATTERNS = [
  "dossier mezzo",
  "dossier mezzi",
  "se modifico il dossier mezzo",
  "quali moduli e file rischio di impattare",
  "rischio di impattare",
];

const MODULE_INSERTION_PATTERNS = [
  "nuovo modulo",
  "aggiungere un nuovo modulo",
  "aggiungere modulo",
  "dove lo dovrei inserire",
  "dove va inserito",
  "dove va messo",
  "quali moduli esistenti toccherebbe",
];

const PERIMETER_ANALYSIS_PATTERNS = [
  "questa logica vive",
  "vive nella madre",
  "vive nella next",
  "backend ia",
  "domain layer",
  "domain/read model",
  "read model",
  "renderer",
  "quali file devo leggere per capirla bene",
];

const LIVE_BOUNDARY_PATTERNS = [
  "lo stai leggendo live",
  "lo stai leggendo dal clone",
  "live o dal clone",
  "lettura live verificata",
  "live-read",
  "live read",
  "snapshot read-only",
  "read-only del clone",
  "read model della next",
  "read model next",
  "perimetro reale della lettura backend ia",
  "la ia sta leggendo davvero tutti i dati attuali",
  "questa funzione usa live-read",
  "questa funzione usa live read",
  "lettura backend ia",
];

const IA_INTEGRATION_PATTERNS = [
  "nuova funzione ia",
  "funzione ia legata ai flussi operativi",
  "punto corretto di integrazione",
  "integrazione ia",
  "capability ia",
];

const REPO_UNDERSTANDING_PATTERNS = [
  ...HOME_ANALYSIS_PATTERNS,
  ...FILE_TOUCH_PATTERNS,
  ...FLOW_ANALYSIS_PATTERNS,
  ...DOSSIER_IMPACT_PATTERNS,
  ...MODULE_INSERTION_PATTERNS,
  ...LIVE_BOUNDARY_PATTERNS,
  ...PERIMETER_ANALYSIS_PATTERNS,
  ...IA_INTEGRATION_PATTERNS,
];

const PRUDENT_DOMAIN_GUIDANCE: readonly PrudentDomainGuidance[] = [
  {
    code: "D03",
    title: "Autisti, sessioni ed eventi di campo",
    statusLabel: "DA VERIFICARE",
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
      "src/next/domain/nextAutistiDomain.ts",
      "src/next/domain/nextStatoOperativoDomain.ts",
      "src/next/NextCentroControlloPage.tsx",
      "src/next/autisti/*",
    ],
    capabilityToday: [
      "leggere in sola lettura badge, sessioni, eventi e segnali autisti con confine madre/clone esplicito",
      "spiegare quale autista e collegato a una targa quando l'aggancio e forte o prudente",
      "distinguere i segnali madre dai dati solo locali del clone autisti",
    ],
    notReady: [
      "il fallback legacy autisti_eventi resta solo prudenziale",
      "i dati salvati nel clone autisti non sono sincronizzati con la madre",
    ],
    nextStep:
      "estendere D03 alle superfici admin/inbox root del clone senza riaprire scritture o sincronizzazioni.",
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
    statusLabel: "SENSIBILE",
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
      "src/next/domain/nextAttrezzatureCantieriDomain.ts",
      "src/next/NextOperativitaGlobalePage.tsx",
      "src/next/NextInventarioPage.tsx",
      "src/next/NextMaterialiConsegnatiPage.tsx",
    ],
    capabilityToday: [
      "riconoscere il dominio D05 come area clone-safe in sola lettura per inventario, movimenti materiali e attrezzature",
      "distinguere stock critico affidabile, collegamenti mezzo forti o prudenziali e tracking attrezzature parziale",
      "rispondere in chat su materiali collegati ai mezzi, segnali magazzino e confine read-only del dominio",
    ],
    notReady: [
      "il dominio resta solo read-only per la parte scrivente e non va promosso a writer NEXT",
      "stock, movimenti, manutenzioni e ordini non sono ancora una catena transazionale unica: alcuni collegamenti restano prudenziali",
    ],
    nextStep:
      "chiudere in task separati i legami causali tra D05, D02 e D06 prima di aprire suggerimenti operativi scriventi o approvvigionamenti automatici.",
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
      "src/next/domain/nextDocumentiCostiDomain.ts",
      "src/next/domain/nextFornitoriDomain.ts",
      "src/pages/Acquisti.tsx",
      "src/next/NextAcquistiPage.tsx",
      "src/next/NextDettaglioOrdinePage.tsx",
      "src/next/NextCapoCostiMezzoPage.tsx",
      "src/next/NextFornitoriPage.tsx",
    ],
    capabilityToday: [
      "leggere in modo read-only ordini, arrivi e dettaglio ordine come workbench D06 realmente navigabile nel clone",
      "distinguere tra superfici navigabili, preview prudenziali e CTA bloccate su preventivi, listino, approvazioni e PDF timbrati",
      "rispondere in chat sullo stato reale di procurement, Capo Costi e confine read-only del dominio",
    ],
    notReady: [
      "il dominio resta SENSIBILE nei documenti dati",
      "preventivi, approvazioni e listino non sono ancora un workflow operativo completo nella NEXT",
    ],
    nextStep:
      "mantenere D06 onesto come workbench read-only e aprire workflow scriventi solo dopo un layer canonico separato per approvazioni, PDF timbrati e conferme business.",
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

type RepoUnderstandingFocus =
  | "home_analysis"
  | "file_touch"
  | "flow_analysis"
  | "dossier_impact"
  | "module_integration"
  | "live_boundary"
  | "perimeter_analysis"
  | "ia_integration"
  | "repo_support";

function normalizePrompt(prompt: string): string {
  return prompt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatIsoDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function hasExplicitPeriodCue(normalizedPrompt: string): boolean {
  if (
    normalizedPrompt.includes("oggi") ||
    normalizedPrompt.includes("questa settimana") ||
    normalizedPrompt.includes("questo mese") ||
    normalizedPrompt.includes("ultimo mese") ||
    normalizedPrompt.includes("ultimi 30 giorni") ||
    normalizedPrompt.includes("ultimi 90 giorni") ||
    normalizedPrompt.includes("prossimi 30 giorni")
  ) {
    return true;
  }

  if (/(?:dal|da)\s+\d{1,4}[./-]\d{1,2}[./-]\d{1,4}\s+(?:al|a)\s+\d{1,4}[./-]\d{1,2}[./-]\d{1,4}/i.test(normalizedPrompt)) {
    return true;
  }

  return new RegExp(`\\b(${Object.keys(MONTH_NAME_TO_INDEX).join("|")})\\s+(?:19|20)\\d{2}\\b`, "i").test(
    normalizedPrompt,
  );
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
      domainLabel:
        detectRepoUnderstandingFocus(prompt) === "home_analysis"
          ? "D10 Stato operativo, alert e promemoria"
          : "Repo, flussi e integrazione NEXT",
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

  if (
    !labels.has(`${OUTPUT_REFERENCE_PREFIX}${decoration.structuredOutputLabel}`) &&
    !hasReferenceWithPrefix(result, OUTPUT_REFERENCE_PREFIX)
  ) {
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

function extractPeriodInput(prompt: string, fallback?: InternalAiReportPeriodInput): LegacyPeriodSelection {
  const normalized = normalizePrompt(prompt);
  if (normalized.includes("ultimi 30 giorni")) {
    return {
      input: {
        preset: "last_30_days",
        fromDate: null,
        toDate: null,
      } as const,
      label: "ultimi 30 giorni",
      explicitRequested: true,
      resolved: true,
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
      explicitRequested: true,
      resolved: true,
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
      explicitRequested: true,
      resolved: true,
    };
  }

  if (normalized.includes("questo mese")) {
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      input: createInternalAiCustomPeriodInput(formatIsoDate(from), formatIsoDate(to)),
      label: "mese corrente",
      explicitRequested: true,
      resolved: true,
    };
  }

  if (normalized.includes("oggi")) {
    const today = new Date();
    return {
      input: createInternalAiCustomPeriodInput(formatIsoDate(today), formatIsoDate(today)),
      label: "oggi",
      explicitRequested: true,
      resolved: true,
    };
  }

  if (normalized.includes("questa settimana")) {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const from = new Date(today);
    from.setDate(today.getDate() + mondayOffset);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    return {
      input: createInternalAiCustomPeriodInput(formatIsoDate(from), formatIsoDate(to)),
      label: "settimana corrente",
      explicitRequested: true,
      resolved: true,
    };
  }

  if (normalized.includes("prossimi 30 giorni")) {
    const today = new Date();
    const to = new Date(today);
    to.setDate(today.getDate() + 29);
    return {
      input: createInternalAiCustomPeriodInput(formatIsoDate(today), formatIsoDate(to)),
      label: "prossimi 30 giorni",
      explicitRequested: true,
      resolved: true,
    };
  }

  const customMatch = prompt.match(
    /(?:dal|da)\s+(\d{1,4}[./-]\d{1,2}[./-]\d{1,4})\s+(?:al|a)\s+(\d{1,4}[./-]\d{1,2}[./-]\d{1,4})/i,
  );
  if (customMatch?.[1] && customMatch?.[2]) {
    return {
      input: createInternalAiCustomPeriodInput(customMatch[1], customMatch[2]),
      label: `intervallo ${customMatch[1]} - ${customMatch[2]}`,
      explicitRequested: true,
      resolved: true,
    };
  }

  const monthYearMatch = normalized.match(
    new RegExp(`\\b(${Object.keys(MONTH_NAME_TO_INDEX).join("|")})\\s+((?:19|20)\\d{2})\\b`, "i"),
  );
  if (monthYearMatch?.[1] && monthYearMatch?.[2]) {
    const monthIndex = MONTH_NAME_TO_INDEX[monthYearMatch[1].toLowerCase()];
    const year = Number(monthYearMatch[2]);
    if (monthIndex != null && Number.isFinite(year)) {
      const from = new Date(year, monthIndex, 1);
      const to = new Date(year, monthIndex + 1, 0);
      return {
        input: createInternalAiCustomPeriodInput(formatIsoDate(from), formatIsoDate(to)),
        label: `${monthYearMatch[1]} ${monthYearMatch[2]}`,
        explicitRequested: true,
        resolved: true,
      };
    }
  }

  if (hasExplicitPeriodCue(normalized)) {
    return {
      input: fallback ?? createDefaultInternalAiReportPeriodInput(),
      label: "periodo esplicito non risolto",
      explicitRequested: true,
      resolved: false,
    };
  }

  return {
    input: fallback ?? createDefaultInternalAiReportPeriodInput(),
    label: "tutto lo storico disponibile",
    explicitRequested: false,
    resolved: true,
  };
}

function parseIntent(prompt: string): ParsedIntent {
  const normalized = normalizePrompt(prompt);
  const extractedTarga = extractTarga(prompt);

  if (HELP_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return { intent: "capabilities", extractedTarga: null };
  }

  if (LIVE_BOUNDARY_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return { intent: "repo_understanding", extractedTarga: null };
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

  if (LIVE_BOUNDARY_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "live_boundary";
  }

  if (IA_INTEGRATION_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "ia_integration";
  }

  if (PERIMETER_ANALYSIS_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "perimeter_analysis";
  }

  if (MODULE_INSERTION_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "module_integration";
  }

  if (DOSSIER_IMPACT_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "dossier_impact";
  }

  if (FLOW_ANALYSIS_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return "flow_analysis";
  }

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
      "La console IA usa ora un planner gestionale read-only sopra il motore unificato gia esistente.\n\n" +
      "Oggi posso:\n" +
      `${capabilityLines}\n` +
      "- rispondere in focus rifornimenti, scadenze/collaudi, criticita/priorita o quadro completo mezzo senza allargare automaticamente tutto a stato generale mezzo;\n" +
      "- incrociare in sola lettura scadenze, alert, segnalazioni, lavori aperti e manutenzioni per classifiche e priorita mezzi;\n" +
      "- riusare report/PDF gia esistenti quando la richiesta chiede un artifact strutturato;\n" +
      "- dichiarare in linguaggio semplice i limiti quando un dominio resta prudente o parziale.\n\n" +
      "Resta tutto read-only: nessuna scrittura business, nessun segreto lato client, nessuna azione automatica fuori perimetro.",
    references: [
      {
        type: "capabilities",
        label: "Catalogo capability console IA gestionale",
        targa: null,
      },
      {
        type: "safe_mode_notice",
        label: "Perimetro consolidato: D01, D10, D02 forti; D04 operativo; altri domini ancora prudenti",
        targa: null,
      },
      {
        type: "capabilities",
        label: `${OUTPUT_REFERENCE_PREFIX} analisi strutturata`,
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

function buildRepoStructuredFallback(args: {
  summary: string[];
  modules: string[];
  routes?: string[];
  readFirst: string[];
  uiFiles?: string[];
  domainFiles?: string[];
  backendFiles?: string[];
  legacyFiles?: string[];
  domainReaders?: string[];
  perimeter: string[];
  whereIntervene: string[];
  impact: string[];
  integrationPoint: string[];
  action: string[];
  references: InternalAiChatMessageReference[];
}): InternalAiChatTurnResult {
  const sections = [
    `Sintesi breve:\n${args.summary.map((entry) => `- ${entry}`).join("\n")}`,
    `Moduli collegati:\n${args.modules.map((entry) => `- ${entry}`).join("\n")}`,
    ...(args.routes?.length ? [`Route coinvolte:\n${args.routes.map((entry) => `- ${entry}`).join("\n")}`] : []),
    `File/layer da leggere prima:\n${args.readFirst.map((entry) => `- ${entry}`).join("\n")}`,
    ...(args.uiFiles?.length
      ? [`File UI coinvolti:\n${args.uiFiles.map((entry) => `- ${entry}`).join("\n")}`]
      : []),
    ...(args.domainFiles?.length
      ? [
          `File domain/read-model coinvolti:\n${args.domainFiles
            .map((entry) => `- ${entry}`)
            .join("\n")}`,
        ]
      : []),
    ...(args.backendFiles?.length
      ? [
          `File backend IA coinvolti:\n${args.backendFiles
            .map((entry) => `- ${entry}`)
            .join("\n")}`,
        ]
      : []),
    ...(args.legacyFiles?.length
      ? [
          `File madre di riferimento:\n${args.legacyFiles
            .map((entry) => `- ${entry}`)
            .join("\n")}`,
        ]
      : []),
    ...(args.domainReaders?.length
      ? [
          `Lettori dominio usati:\n${args.domainReaders
            .map((entry) => `- ${entry}`)
            .join("\n")}`,
        ]
      : []),
    `Perimetro logica:\n${args.perimeter.map((entry) => `- ${entry}`).join("\n")}`,
    `Dove intervenire:\n${args.whereIntervene.map((entry) => `- ${entry}`).join("\n")}`,
    `Rischio impatto:\n${args.impact.map((entry) => `- ${entry}`).join("\n")}`,
    `Punto consigliato di integrazione:\n${args.integrationPoint.map((entry) => `- ${entry}`).join("\n")}`,
    `Azione consigliata:\n${args.action.map((entry) => `- ${entry}`).join("\n")}`,
  ];

  return {
    intent: "repo_understanding",
    status: "partial",
    assistantText: sections.join("\n\n"),
    references: args.references,
    report: null,
  };
}

async function buildRepoUnderstandingFallbackResponse(
  prompt: string,
): Promise<InternalAiChatTurnResult> {
  const focus = detectRepoUnderstandingFocus(prompt);

  if (focus === "live_boundary") {
    return {
      intent: "repo_understanding",
      status: "completed",
      assistantText:
        "Oggi il live-read business del backend IA e chiuso.\n\n" +
        "Perimetro reale della lettura:\n" +
        "- clone/read model NEXT: SI;\n" +
        "- snapshot D01 seedata dal clone: SI;\n" +
        "- snapshot Dossier mezzo seedata dal clone: SI;\n" +
        "- snapshot repo/UI curata del backend IA: SI;\n" +
        "- Firestore business live: NO;\n" +
        "- Storage business live: NO.\n\n" +
        "Regola pratica:\n" +
        "- se vedi `retrieval server-side`, non significa live-read business: significa snapshot read-only dedicata o snapshot repo/UI curata;\n" +
        "- se vedi `clone-safe` o `read-only`, il dato arriva dai layer NEXT gia governati;\n" +
        "- se il dato non e abbastanza forte, la console lo dichiara come prudente o parziale e non lo promuove a live.\n\n" +
        "Verdetto operativo: backend IA separato e UI usano solo clone/read model e snapshot read-only dedicate. Nessun bridge live Firestore/Storage e oggi ammesso come fonte business attiva.",
      references: [
        {
          type: "repo_understanding",
          label: `${DOMAIN_REFERENCE_PREFIX} Confine backend IA / clone / live-read`,
          targa: null,
        },
        {
          type: "repo_understanding",
          label: `${RELIABILITY_REFERENCE_PREFIX} Affidabile`,
          targa: null,
        },
        {
          type: "safe_mode_notice",
          label: "Live-read business chiuso: solo clone/read model e snapshot seedate",
          targa: null,
        },
        {
          type: "repo_understanding",
          label: "Backend IA: nessun Firestore/Storage live business",
          targa: null,
        },
        {
          type: "architecture_doc",
          label: "Confine IA: clone/read model, non live business",
          targa: null,
        },
      ],
      report: null,
    };
  }

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

  if (focus === "flow_analysis") {
    return buildRepoStructuredFallback({
      summary: [
        "Il flusso rifornimenti non va semplificato partendo dalla pagina madre o dal thread IA.",
        "Il punto corretto e il layer D04 della NEXT, perche da li passano Dossier Mezzo, dossier rifornimenti, analisi economica e output IA fuel.",
      ],
      modules: [
        "Dossier Mezzo",
        "Dossier Rifornimenti",
        "Analisi Economica",
        "IA interna NEXT",
      ],
      routes: ["/next/dossier/:targa", "/next/analisi-economica/:targa", "/next/ia/interna"],
      readFirst: [
        "docs/data/DOMINI_DATI_CANONICI.md",
        "docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md",
        "src/next/domain/nextRifornimentiDomain.ts",
        "src/next/nextRifornimentiConsumiDomain.ts",
        "src/next/domain/nextDossierMezzoDomain.ts",
        "src/next/NextDossierRifornimentiPage.tsx",
        "src/next/NextRifornimentiEconomiaSection.tsx",
        "src/pages/DossierRifornimenti.tsx",
      ],
      uiFiles: [
        "src/next/NextDossierMezzoPage.tsx",
        "src/next/NextDossierRifornimentiPage.tsx",
        "src/next/NextRifornimentiEconomiaSection.tsx",
        "src/next/NextAnalisiEconomicaPage.tsx",
      ],
      domainFiles: [
        "src/next/domain/nextRifornimentiDomain.ts",
        "src/next/nextRifornimentiConsumiDomain.ts",
        "src/next/domain/nextDossierMezzoDomain.ts",
      ],
      backendFiles: [
        "backend/internal-ai/server/internal-ai-repo-understanding.js",
        "backend/internal-ai/server/internal-ai-adapter.js",
      ],
      legacyFiles: ["src/pages/DossierRifornimenti.tsx", "src/pages/DossierMezzo.tsx"],
      domainReaders: [
        "src/next/domain/nextRifornimentiDomain.ts",
        "src/next/nextRifornimentiConsumiDomain.ts",
      ],
      perimeter: [
        "Madre: `src/pages/DossierRifornimenti.tsx` serve solo per capire il flusso reale, non per patchare.",
        "NEXT: `src/next/*` e il perimetro dove correggere lettura, mapping e superfici read-only.",
        "Domain/read model: D04 nella NEXT e il punto di verita del clone per rifornimenti e consumi.",
        "Backend IA: legge e spiega il risultato del read model, non deve ricostruire D04 da zero.",
      ],
      whereIntervene: [
        "Prima sul layer D04 e sulla normalizzazione dei rifornimenti, poi sulle pagine dossier/rifornimenti e solo infine sui renderer IA.",
      ],
      impact: [
        "ELEVATO: una modifica sbagliata su D04 si riflette su dossier, analisi economica e capability IA rifornimenti.",
      ],
      integrationPoint: [
        "Reader D04 e read model NEXT, non nuova logica sparsa nelle pagine o nel backend IA.",
      ],
      action: [
        "Mappa sorgenti, regole di normalizzazione e consumatori del dato fuel; poi accorpa la logica duplicata nel layer NEXT e lascia la UI come renderer.",
      ],
      references: [
        {
          type: "architecture_doc",
          label: "D04 Rifornimenti e consumi",
          targa: null,
        },
        {
          type: "repo_understanding",
          label: "File chiave: src/next/domain/nextRifornimentiDomain.ts",
          targa: null,
        },
        {
          type: "repo_understanding",
          label: "File chiave: src/next/nextRifornimentiConsumiDomain.ts",
          targa: null,
        },
        {
          type: "integration_guidance",
          label: "Integrazione consigliata: Dossier Mezzo",
          targa: null,
        },
      ],
    });
  }

  if (focus === "dossier_impact") {
    return buildRepoStructuredFallback({
      summary: [
        "Il Dossier Mezzo e un aggregatore detail-first: modificarlo non tocca solo una pagina, ma piu viste targa-centriche collegate.",
        "Il rischio principale e rompere il read model condiviso tra dettaglio mezzo, rifornimenti, analisi economica e capability IA mezzo-centriche.",
      ],
      modules: [
        "Lista Dossier Mezzi",
        "Dossier Mezzo",
        "Dossier Rifornimenti",
        "Dossier Gomme",
        "Analisi Economica",
        "IA interna NEXT",
      ],
      routes: ["/next/dossiermezzi", "/next/dossier/:targa", "/next/analisi-economica/:targa"],
      readFirst: [
        "docs/STATO_ATTUALE_PROGETTO.md",
        "docs/product/STATO_MIGRAZIONE_NEXT.md",
        "docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md",
        "src/next/domain/nextDossierMezzoDomain.ts",
        "src/next/NextMezziDossierPage.tsx",
        "src/next/NextDossierMezzoPage.tsx",
        "src/next/NextDossierRifornimentiPage.tsx",
        "src/next/NextAnalisiEconomicaPage.tsx",
        "src/next/internal-ai/internalAiVehicleDossierHookFacade.ts",
        "src/pages/DossierMezzo.tsx",
      ],
      uiFiles: [
        "src/next/NextMezziDossierPage.tsx",
        "src/next/NextDossierMezzoPage.tsx",
        "src/next/NextDossierRifornimentiPage.tsx",
        "src/next/NextAnalisiEconomicaPage.tsx",
      ],
      domainFiles: [
        "src/next/domain/nextDossierMezzoDomain.ts",
        "src/next/domain/nextRifornimentiDomain.ts",
        "src/next/domain/nextDocumentiCostiDomain.ts",
      ],
      backendFiles: [
        "src/next/internal-ai/internalAiVehicleDossierHookFacade.ts",
        "backend/internal-ai/server/internal-ai-repo-understanding.js",
      ],
      legacyFiles: ["src/pages/DossierMezzo.tsx", "src/pages/AnalisiEconomica.tsx"],
      domainReaders: ["src/next/domain/nextDossierMezzoDomain.ts"],
      perimeter: [
        "Madre: la pagina legacy dossier serve come riferimento del flusso reale.",
        "NEXT: qui vivono il clone dossier e le sue estensioni read-only.",
        "Domain/read model: `src/next/domain/nextDossierMezzoDomain.ts` e il nodo da controllare prima di cambiare la UI.",
        "Backend IA: i casi mezzo-centrici leggono il dossier tramite hook/facade, quindi vanno verificati a valle.",
      ],
      whereIntervene: [
        "Prima sul domain/read model del dossier, poi su `NextDossierMezzoPage.tsx` e infine sulle pagine/section derivate.",
      ],
      impact: [
        "ELEVATO: puoi impattare ingressi lista, blocchi dossier, rifornimenti, analisi economica e capability IA mezzo-centriche.",
      ],
      integrationPoint: [
        "Il punto corretto resta il read model dossier nella NEXT, con superfici collegate che lo consumano in sola lettura.",
      ],
      action: [
        "Verifica sempre ingressi, estensioni dossier e hook IA collegati prima di toccare il dettaglio mezzo.",
      ],
      references: [
        {
          type: "repo_understanding",
          label: "File chiave: src/next/domain/nextDossierMezzoDomain.ts",
          targa: null,
        },
        {
          type: "repo_understanding",
          label: "File chiave: src/next/NextDossierMezzoPage.tsx",
          targa: null,
        },
        {
          type: "repo_understanding",
          label: "File chiave: src/next/internal-ai/internalAiVehicleDossierHookFacade.ts",
          targa: null,
        },
        {
          type: "integration_guidance",
          label: "Integrazione consigliata: Dossier Mezzo",
          targa: null,
        },
      ],
    });
  }

  if (focus === "module_integration") {
    return buildRepoStructuredFallback({
      summary: [
        "Un nuovo modulo non va inserito partendo da una route nuova a caso.",
        "Il primo passo corretto e classificare l'owner del flusso: Dossier se targa-centrico, Centro di Controllo se globale/priorita, Gestione Operativa se workbench condiviso, IA interna se funzione assistiva.",
      ],
      modules: [
        "Shell NEXT",
        "Dossier Mezzo",
        "Centro di Controllo",
        "Gestione Operativa",
        "IA interna NEXT",
      ],
      routes: ["/next/centro-controllo", "/next/dossier/:targa", "/next/gestione-operativa", "/next/ia/interna"],
      readFirst: [
        "docs/STRUTTURA_COMPLETA_GESTIONALE.md",
        "docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md",
        "docs/product/STATO_MIGRAZIONE_NEXT.md",
        "src/next/NextShell.tsx",
        "src/next/nextStructuralPaths.ts",
        "src/next/NextDossierMezzoPage.tsx",
        "src/next/NextCentroControlloPage.tsx",
        "src/next/NextInternalAiPage.tsx",
      ],
      uiFiles: [
        "src/next/NextShell.tsx",
        "src/next/nextStructuralPaths.ts",
        "src/next/NextCentroControlloPage.tsx",
        "src/next/NextDossierMezzoPage.tsx",
        "src/next/NextOperativitaGlobalePage.tsx",
        "src/next/NextInternalAiPage.tsx",
      ],
      domainFiles: [
        "src/next/domain/nextCentroControlloDomain.ts",
        "src/next/domain/nextDossierMezzoDomain.ts",
        "src/next/domain/nextMaterialiMovimentiDomain.ts",
      ],
      backendFiles: ["backend/internal-ai/server/internal-ai-repo-understanding.js"],
      domainReaders: [
        "src/next/domain/nextCentroControlloDomain.ts",
        "src/next/domain/nextDossierMezzoDomain.ts",
        "src/next/domain/nextMaterialiMovimentiDomain.ts",
      ],
      perimeter: [
        "Madre: utile solo per capire dove il flusso esiste gia davvero.",
        "NEXT: qui scegli macro-area owner, route e superficie del nuovo modulo.",
        "Domain/read model: se il modulo legge dati nuovi o sporchi, serve un layer dedicato prima della UI.",
        "Backend IA: da toccare solo se il modulo e una capability assistiva o un retrieval server-side controllato.",
      ],
      whereIntervene: [
        "Parti dalla macro-area owner del flusso e non da una pagina autonoma creata in anticipo.",
      ],
      impact: [
        "ELEVATO: se sbagli ownership crei duplicazioni tra dossier, cockpit, workbench globali e IA.",
      ],
      integrationPoint: [
        "Macro-area owner nella NEXT; route, tab, card o capability arrivano solo dopo la classificazione del modulo.",
      ],
      action: [
        "Scegli owner, sorgente dati e read model; poi apri il minimo innesto coerente nella NEXT.",
      ],
      references: [
        {
          type: "repo_understanding",
          label: "File chiave: src/next/nextStructuralPaths.ts",
          targa: null,
        },
        {
          type: "integration_guidance",
          label: "Integrazione consigliata: Shell NEXT / macro-area owner",
          targa: null,
        },
        {
          type: "architecture_doc",
          label: "Struttura completa del gestionale",
          targa: null,
        },
      ],
    });
  }

  if (focus === "perimeter_analysis") {
    return buildRepoStructuredFallback({
      summary: [
        "Per capire dove vive una logica devi separare madre, NEXT, backend IA, domain/read model e renderer UI.",
        "La regola pratica e: documentazione prima, read model NEXT dopo, UI clone come superficie, madre come riferimento storico e backend IA solo se la capability passa dal server.",
      ],
      modules: [
        "Madre legacy",
        "NEXT clone read-only",
        "Backend IA separato",
        "Domain/read model NEXT",
        "Renderer/UI",
        "Documentazione di verita",
      ],
      routes: ["/next/centro-controllo", "/next/dossier/:targa", "/next/ia/interna"],
      readFirst: [
        "docs/STATO_ATTUALE_PROGETTO.md",
        "docs/data/DOMINI_DATI_CANONICI.md",
        "docs/product/STATO_MIGRAZIONE_NEXT.md",
        "src/next/domain/nextDossierMezzoDomain.ts",
        "src/next/NextDossierMezzoPage.tsx",
        "src/pages/DossierMezzo.tsx",
        "backend/internal-ai/server/internal-ai-adapter.js",
        "backend/internal-ai/server/internal-ai-repo-understanding.js",
      ],
      uiFiles: ["src/next/NextDossierMezzoPage.tsx", "src/next/NextCentroControlloPage.tsx"],
      domainFiles: [
        "src/next/domain/nextDossierMezzoDomain.ts",
        "src/next/domain/nextCentroControlloDomain.ts",
      ],
      backendFiles: [
        "backend/internal-ai/server/internal-ai-adapter.js",
        "backend/internal-ai/server/internal-ai-repo-understanding.js",
      ],
      legacyFiles: ["src/pages/DossierMezzo.tsx", "src/pages/Home.tsx"],
      domainReaders: [
        "src/next/domain/nextDossierMezzoDomain.ts",
        "src/next/domain/nextCentroControlloDomain.ts",
      ],
      perimeter: [
        "Madre: `src/pages/*` descrive il flusso legacy reale ma non si modifica.",
        "NEXT: `src/next/*` e il perimetro di evoluzione del clone.",
        "Domain/read model: e il punto corretto per logica, mapping e normalizzazione.",
        "Renderer/UI: mostra la superficie ma non dovrebbe essere il reader canonico.",
        "Backend IA: serve per orchestrazione, repo understanding e retrieval server-side controllato.",
      ],
      whereIntervene: [
        "Intervieni nel layer owner: domain per logica, backend IA per orchestrazione server-side, UI per rendering.",
      ],
      impact: [
        "NORMALE se rispetti l'ordine di lettura; sale a ELEVATO se confondi page clone, logica dati e backend IA.",
      ],
      integrationPoint: [
        "Il layer owner del flusso, non il primo file UI che trovi aperto.",
      ],
      action: [
        "Leggi i file nell'ordine corretto e non far nascere la logica dal renderer.",
      ],
      references: [
        {
          type: "architecture_doc",
          label: "Stato attuale del progetto",
          targa: null,
        },
        {
          type: "repo_understanding",
          label: "File chiave: backend/internal-ai/server/internal-ai-repo-understanding.js",
          targa: null,
        },
        {
          type: "repo_understanding",
          label: "File chiave: src/next/domain/nextDossierMezzoDomain.ts",
          targa: null,
        },
      ],
    });
  }

  if (focus === "ia_integration") {
    return buildRepoStructuredFallback({
      summary: [
        "Una nuova funzione IA sui flussi operativi non va agganciata direttamente alla madre o a una pagina business.",
        "Il punto corretto e sopra il read model NEXT e dentro l'orchestrazione IA, con output selector e pagina IA come renderer finale.",
      ],
      modules: [
        "IA interna NEXT",
        "Backend IA separato",
        "Dossier Mezzo",
        "Centro di Controllo",
      ],
      routes: ["/next/ia/interna", "/next/dossier/:targa", "/next/centro-controllo"],
      readFirst: [
        "docs/product/CHECKLIST_IA_INTERNA.md",
        "docs/product/STATO_MIGRAZIONE_NEXT.md",
        "docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md",
        "src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts",
        "src/next/internal-ai/internalAiChatOrchestrator.ts",
        "src/next/internal-ai/internalAiOutputSelector.ts",
        "src/next/NextInternalAiPage.tsx",
        "backend/internal-ai/server/internal-ai-adapter.js",
      ],
      uiFiles: [
        "src/next/NextInternalAiPage.tsx",
        "src/next/internal-ai/internalAiOutputSelector.ts",
      ],
      domainFiles: [
        "src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts",
        "src/next/internal-ai/internalAiChatOrchestrator.ts",
      ],
      backendFiles: [
        "backend/internal-ai/server/internal-ai-adapter.js",
        "backend/internal-ai/server/internal-ai-repo-understanding.js",
      ],
      domainReaders: [
        "src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts",
        "src/next/internal-ai/internalAiChatOrchestrator.ts",
      ],
      perimeter: [
        "Madre: non deve diventare il backend della capability IA.",
        "NEXT: contiene read model, orchestrazione locale e renderer della console IA.",
        "Backend IA: va toccato solo se serve retrieval o chat server-side controllata.",
        "Domain/read model: la capability deve leggere dati gia spiegabili e normalizzati.",
      ],
      whereIntervene: [
        "Prima definisci il read model sorgente, poi l'orchestrazione IA e solo infine il wiring UI.",
      ],
      impact: [
        "ELEVATO: se integri la capability nel punto sbagliato sporchi il nucleo business o trasformi l'IA in una UI parallela.",
      ],
      integrationPoint: [
        "Read model NEXT -> orchestratore/motore IA -> output selector -> `NextInternalAiPage.tsx`; backend IA solo quando serve davvero lato server.",
      ],
      action: [
        "Definisci input, output e limiti della capability prima di aprire nuovo wiring nel layer IA.",
      ],
      references: [
        {
          type: "repo_understanding",
          label: "File chiave: src/next/internal-ai/internalAiChatOrchestrator.ts",
          targa: null,
        },
        {
          type: "repo_understanding",
          label: "File chiave: src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts",
          targa: null,
        },
        {
          type: "integration_guidance",
          label: "Integrazione consigliata: IA interna NEXT",
          targa: null,
        },
      ],
    });
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
      "Nel perimetro attuale posso aiutarti anche su repo, flussi, integrazione e dependency map, ma resto dentro un mapping controllato e read-only del clone.\n\n" +
      "Regola pratica: documentazione di verita e read model NEXT vengono prima della UI, la madre resta solo leggibile e il backend IA serve per orchestrazione o repo understanding, non per scritture business.\n\n" +
      'Prova con: "Se voglio semplificare il flusso rifornimenti...", "Se modifico il Dossier Mezzo...", "Questa logica vive nella madre, nella NEXT o nel backend IA?" oppure "Voglio aggiungere un nuovo modulo nel gestionale".',
    references: [
      {
        type: "repo_understanding",
        label: "Perimetro repo/flussi/integrazione clone-safe",
        targa: null,
      },
      {
        type: "safe_mode_notice",
        label: "Madre read-only, NEXT come perimetro di evoluzione, backend IA separato",
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
      '- "Quali file devo toccare nel perimetro mezzo/Home"\n' +
      '- "Quali autisti hanno oggi segnali o eventi che richiedono attenzione?"\n' +
      '- "Questa targa a quale autista risulta collegata?"\n' +
      '- "Se modifico il Dossier Mezzo, quali moduli e file rischio di impattare?"\n' +
      '- "Voglio aggiungere un nuovo modulo nel gestionale: dove lo dovrei inserire?"\n' +
      '- "Questa logica vive nella madre, nella NEXT o nel backend IA?"\n' +
      '- "Questo dato lo stai leggendo live o dal clone?"\n\n' +
      "Se la richiesta sconfina su domini non ancora chiusi, dichiaro il limite e non invento coperture fuori dominio.",
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
  if (periodSelection.explicitRequested && !periodSelection.resolved) {
    return {
      intent: "report_targa",
      status: "partial",
      assistantText:
        "Ho rilevato una richiesta con periodo esplicito, ma il periodo non e stato interpretato in modo affidabile.\n\n" +
        "Per evitare di allargare il report allo storico completo, fermo qui la preview e ti chiedo di indicare il periodo in modo piu chiaro, ad esempio \"questo mese\", \"marzo 2026\" oppure \"dal 01 03 2026 al 31 03 2026\".",
      references: [
        {
          type: "report_preview",
          label: "Periodo esplicito non interpretato: preview fermata per evitare storico completo",
          targa: extractedTarga,
        },
      ],
      report: {
        status: "invalid_query",
        normalizedTarga: extractedTarga,
        message: "Periodo esplicito non interpretato: preview non avviata per evitare storico completo.",
        preview: null,
      },
    };
  }
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
  const parsed = parseIntent(prompt);

  if (parsed.intent === "repo_understanding") {
    return decorateChatTurnResult(prompt, await buildRepoUnderstandingFallbackResponse(prompt));
  }

  if (isInternalAiUnifiedIntelligenceCandidate(prompt)) {
    const unifiedResult = await runInternalAiUnifiedIntelligenceQuery(prompt, fallbackPeriodInput);
    if (unifiedResult) {
      return decorateChatTurnResult(prompt, unifiedResult);
    }
  }

  switch (parsed.intent) {
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
