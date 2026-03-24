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
  "dove la metteresti",
  "dove metteresti",
  "come migliorare",
];

const HOME_ANALYSIS_PATTERNS = [
  "analizza la home",
  "analizza home",
  "analisi home",
  "spiegami la home",
  "migliorare i flussi",
  "dimmi come migliorare i flussi",
  "flussi home",
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

const INTEGRATION_PATTERNS = [
  "integra",
  "integrazione",
  "aggiungi",
  "aggiungere",
  "metti",
  "mettere",
  "inserisci",
  "inserire",
  "portalo nella next",
  "mettilo nella next",
];

const CONFIRMATION_PATTERNS = [
  "rendilo stabile",
  "fallo stabile",
  "confermo integrazione",
  "procedi con integrazione",
  "portalo nella next",
  "mettilo nella next",
  "aggiungilo nella next",
  "prepara l'integrazione",
];

function normalizePrompt(prompt: string): string {
  return prompt.toLowerCase().replace(/\s+/g, " ").trim();
}

function hasAnyPattern(prompt: string, patterns: string[]): boolean {
  return patterns.some((pattern) => prompt.includes(pattern));
}

function hasRecentIntegrationContext(messages: InternalAiChatMessage[]): boolean {
  return messages
    .slice(-4)
    .reverse()
    .some(
      (message) =>
        message.role === "assistente" &&
        (message.outputMode === "ui_integration_proposal" ||
          message.outputMode === "next_integration_confirmation_required" ||
          message.references.some(
            (reference) =>
              reference.type === "integration_guidance" ||
              reference.type === "integration_confirmation",
          )),
    );
}

function buildDefaultReason(result: InternalAiChatTurnResult): string {
  if (result.intent === "capabilities" || result.intent === "non_supportato") {
    return "La richiesta e breve o di perimetro: la risposta resta direttamente nel thread.";
  }

  if (result.intent === "repo_understanding") {
    return "La richiesta riguarda repo, UI o flussi: conviene una risposta strutturata nel thread.";
  }

  if (result.intent === "mezzo_dossier") {
    return "La richiesta e mezzo-centrica e spiegabile: la risposta resta leggibile in chat, con fonti e limiti dichiarati.";
  }

  return "La risposta resta nel thread perche non richiede un artifact separato o una proposta di integrazione.";
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
      return "La richiesta riguarda la Home: la risposta resta strutturata in chat e segnala che la memoria osservata va aggiornata.";
    }

    if (args.memoryFreshness === "partial") {
      return "La richiesta riguarda la Home: la risposta resta strutturata in chat usando la memoria osservata ma dichiarando i limiti.";
    }

    return "La richiesta riguarda la Home: conviene una risposta strutturata in chat con blocchi, collegamenti mezzo/targa e file principali.";
  }

  if (fileTouchRequested) {
    if (args.memoryFreshness === "stale") {
      return "La richiesta punta ai file da toccare: la risposta resta strutturata in chat, ma segnala che il mapping osservato va aggiornato.";
    }

    if (args.memoryFreshness === "partial") {
      return "La richiesta punta ai file da toccare: la risposta resta strutturata in chat separando Home, dominio mezzo e IA interna, con limiti dichiarati.";
    }

    return "La richiesta punta ai file da toccare: la risposta resta strutturata in chat separando Home, dominio mezzo e IA interna.";
  }

  if (args.memoryFreshness === "stale") {
    return "La richiesta riguarda repo, UI o flussi: la risposta resta in chat ma segnala che la memoria osservata e da aggiornare.";
  }

  if (args.memoryFreshness === "partial") {
    return "La richiesta riguarda repo, UI o flussi: la risposta resta in chat usando la memoria osservata ma dichiarando i limiti.";
  }

  return "La richiesta riguarda repo, UI o flussi: la risposta resta in chat in forma strutturata e leggibile.";
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
  const recentIntegrationContext = hasRecentIntegrationContext(args.previousMessages);
  const repoUiRequested =
    hasAnyPattern(normalizedPrompt, REPO_UI_PATTERNS) || Boolean(args.memoryHints?.repoUiRequested);
  const integrationRequested = hasAnyPattern(normalizedPrompt, INTEGRATION_PATTERNS);
  const confirmationRequested = hasAnyPattern(normalizedPrompt, CONFIRMATION_PATTERNS);
  const homeAnalysisRequested = hasAnyPattern(normalizedPrompt, HOME_ANALYSIS_PATTERNS);
  const fileTouchRequested = hasAnyPattern(normalizedPrompt, FILE_TOUCH_PATTERNS);
  const reportReady = args.result.report?.status === "ready";
  const reportIntent =
    args.result.intent === "report_targa" ||
    args.result.intent === "report_autista" ||
    args.result.intent === "report_combinato";

  if (reportReady || reportIntent) {
    return {
      mode: "report_pdf",
      reason:
        "La richiesta e un report mezzo-centrico: il contenuto lungo viene spostato in artifact e anteprima PDF read-only del percorso NEXT.",
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

  if (confirmationRequested || (recentIntegrationContext && normalizedPrompt.includes("stabile"))) {
    return {
      mode: "next_integration_confirmation_required",
      reason:
        "La richiesta punta a un cambiamento stabile della NEXT: serve una proposta confermabile, non un'azione automatica.",
    };
  }

  if (integrationRequested && (repoUiRequested || args.repoUnderstandingReady)) {
    return {
      mode: "ui_integration_proposal",
      reason: args.runtimeObserverObserved
        ? "La richiesta riguarda un punto di integrazione nella NEXT: conviene una proposta strutturata guidata da repo understanding e osservatore runtime."
        : "La richiesta riguarda un punto di integrazione nella NEXT: conviene una proposta strutturata guidata dal repo understanding controllato.",
    };
  }

  if (repoUiRequested) {
    return {
      mode: "chat_structured",
      reason: buildRepoUiReason({
        prompt: args.prompt,
        memoryFreshness: args.memoryHints?.memoryFreshness,
      }),
    };
  }

  if (
    args.result.intent === "mezzo_dossier" &&
    (normalizedPrompt.includes("elenca") ||
      normalizedPrompt.includes("riepiloga") ||
      normalizedPrompt.includes("spiega") ||
      normalizedPrompt.includes("analizza"))
  ) {
    return {
      mode: "chat_structured",
      reason:
        "La richiesta mezzo-centrica ha piu elementi utili: conviene una risposta strutturata nel thread senza aprire un documento separato.",
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
