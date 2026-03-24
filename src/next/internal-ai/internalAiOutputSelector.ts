import type { InternalAiChatTurnResult } from "./internalAiChatOrchestrator";
import type {
  InternalAiChatMemoryHints,
  InternalAiChatMessage,
  InternalAiOutputSelection,
} from "./internalAiTypes";

const BRIEF_PATTERNS = [
  "aiuto",
  "cosa puoi fare",
  "perimetro",
  "limite",
  "limiti",
  "stato progetto",
  "stato del progetto",
];

const REPO_UI_PATTERNS = [
  "repo",
  "repository",
  "ui",
  "modulo",
  "moduli",
  "pagina",
  "pagine",
  "schermata",
  "schermate",
  "route",
  "layout",
  "pattern",
  "flusso",
  "flussi",
  "madre",
  "next",
  "home",
  "screen",
  "schermo",
  "file tocco",
  "quale file",
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
  "file coinvolti",
  "moduli coinvolti",
  "file da toccare",
  "mappa file",
];

const DOMAIN_REFERENCE_PREFIX = "dominio rilevato:";
const RELIABILITY_REFERENCE_PREFIX = "affidabilita:";
const UNIFIED_ENGINE_REFERENCE = "motore: unified intelligence engine";

function normalizePrompt(prompt: string): string {
  return prompt.toLowerCase().replace(/\s+/g, " ").trim();
}

function hasAnyPattern(prompt: string, patterns: string[]): boolean {
  return patterns.some((pattern) => prompt.includes(pattern));
}

function hasStructuredDomainGuidance(result: InternalAiChatTurnResult): boolean {
  return result.references.some((reference) => {
    const label = reference.label.toLowerCase();
    return label.startsWith(DOMAIN_REFERENCE_PREFIX) || label.startsWith(RELIABILITY_REFERENCE_PREFIX);
  });
}

function hasUnifiedEngineMarker(result: InternalAiChatTurnResult): boolean {
  return result.references.some((reference) =>
    reference.label.toLowerCase().includes(UNIFIED_ENGINE_REFERENCE),
  );
}

function buildDefaultReason(result: InternalAiChatTurnResult): string {
  if (result.intent === "capabilities" || result.intent === "non_supportato") {
    return "La richiesta chiede perimetro, limiti o confini della verticale: la risposta resta nel thread.";
  }

  if (result.intent === "repo_understanding") {
    return "La richiesta riguarda Home o file/moduli del perimetro mezzo: conviene una risposta strutturata in chat.";
  }

  if (result.intent === "mezzo_dossier") {
    return "La richiesta riguarda stato mezzo, alert o backlog tecnico: la risposta resta leggibile in chat con fonti e limiti dichiarati.";
  }

  return "La risposta resta nel thread perche non richiede un artifact separato oltre ai casi report.";
}

function buildRepoUiReason(args: {
  prompt: string;
  memoryFreshness?: InternalAiChatMemoryHints["memoryFreshness"];
}): string {
  const normalizedPrompt = normalizePrompt(args.prompt);
  const homeRequested = hasAnyPattern(normalizedPrompt, HOME_ANALYSIS_PATTERNS);
  const fileTouchRequested = hasAnyPattern(normalizedPrompt, FILE_TOUCH_PATTERNS);

  if (homeRequested) {
    if (args.memoryFreshness === "stale") {
      return "La richiesta riguarda la Home operativa: la risposta resta strutturata in chat e segnala che la memoria osservata va aggiornata.";
    }

    if (args.memoryFreshness === "partial") {
      return "La richiesta riguarda la Home operativa: la risposta resta strutturata in chat usando la memoria osservata ma dichiarando i limiti.";
    }

    return "La richiesta riguarda la Home operativa: conviene una risposta strutturata in chat con superfici UI, reader canonici e confini di dominio.";
  }

  if (fileTouchRequested) {
    if (args.memoryFreshness === "stale") {
      return "La richiesta punta ai file da toccare: la risposta resta strutturata in chat e segnala che il mapping osservato va aggiornato.";
    }

    if (args.memoryFreshness === "partial") {
      return "La richiesta punta ai file da toccare: la risposta resta strutturata in chat separando superfici Home, reader canonici e file IA, con limiti dichiarati.";
    }

    return "La richiesta punta ai file da toccare: la risposta resta strutturata in chat separando superfici Home, reader canonici e file IA del perimetro mezzo.";
  }

  if (args.memoryFreshness === "stale") {
    return "La richiesta riguarda Home o file del clone: la risposta resta in chat ma segnala che la memoria osservata e da aggiornare.";
  }

  if (args.memoryFreshness === "partial") {
    return "La richiesta riguarda Home o file del clone: la risposta resta in chat usando la memoria osservata ma dichiarando i limiti.";
  }

  return "La richiesta riguarda Home o file del clone: la risposta resta in chat in forma strutturata e leggibile.";
}

export function selectInternalAiOutputMode(args: {
  prompt: string;
  result: InternalAiChatTurnResult;
  previousMessages: InternalAiChatMessage[];
  repoUnderstandingReady: boolean;
  runtimeObserverObserved: boolean;
  memoryHints?: InternalAiChatMemoryHints;
}): InternalAiOutputSelection {
  const normalizedPrompt = normalizePrompt(args.prompt);
  const repoUiRequested =
    hasAnyPattern(normalizedPrompt, REPO_UI_PATTERNS) || Boolean(args.memoryHints?.repoUiRequested);
  const homeAnalysisRequested = hasAnyPattern(normalizedPrompt, HOME_ANALYSIS_PATTERNS);
  const fileTouchRequested = hasAnyPattern(normalizedPrompt, FILE_TOUCH_PATTERNS);
  const reportReady = args.result.report?.status === "ready";
  const reportIntent = args.result.intent === "report_targa";

  if (reportReady || reportIntent) {
    return {
      mode: "report_pdf",
      reason:
        "La richiesta genera un artifact operativo read-only: il contenuto lungo viene spostato nell'anteprima PDF/modale della console unificata NEXT.",
    };
  }

  if (hasUnifiedEngineMarker(args.result)) {
    return {
      mode: "chat_structured",
      reason:
        "La richiesta passa dal motore unificato read-only: conviene una risposta strutturata nel thread con priorita, fonti e limiti dichiarati.",
    };
  }

  if (args.result.intent === "repo_understanding" || homeAnalysisRequested || fileTouchRequested) {
    return {
      mode: "chat_structured",
      reason: buildRepoUiReason({
        prompt: args.prompt,
        memoryFreshness: args.memoryHints?.memoryFreshness,
      }),
    };
  }

  if (
    args.result.intent === "mezzo_dossier"
  ) {
    return {
      mode: "chat_structured",
      reason:
        "La capability canonica stato_operativo_mezzo usa un quadro piccolo D01 + D10 + D02: conviene sempre una risposta strutturata nel thread.",
    };
  }

  if (
    hasStructuredDomainGuidance(args.result) &&
    (args.result.intent === "non_supportato" || args.result.status === "partial")
  ) {
    return {
      mode: "chat_structured",
      reason:
        "La richiesta e stata classificata per dominio ma il dominio non e ancora consolidato: conviene una risposta strutturata e prudente nel thread.",
    };
  }

  if (
    args.result.intent === "capabilities" ||
    args.result.intent === "non_supportato" ||
    args.result.status === "partial" ||
    args.result.status === "not_supported"
  ) {
    return {
      mode: "chat_brief",
      reason:
        "La richiesta richiede solo orientamento, limiti o un chiarimento rapido: la risposta breve in chat e il formato piu adatto.",
    };
  }

  if (hasAnyPattern(normalizedPrompt, BRIEF_PATTERNS)) {
    return {
      mode: "chat_brief",
      reason:
        "La richiesta e semplice o di perimetro: non serve aprire artifact o proposte dedicate.",
    };
  }

  return {
    mode:
      repoUiRequested || args.memoryHints?.repoUiRequested
        ? "chat_structured"
        : args.result.references.length > 2
          ? "chat_structured"
          : "chat_brief",
    reason: buildDefaultReason(args.result),
  };
}
