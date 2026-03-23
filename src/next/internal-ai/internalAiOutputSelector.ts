import type { InternalAiChatTurnResult } from "./internalAiChatOrchestrator";
import type { InternalAiChatMessage, InternalAiOutputSelection } from "./internalAiTypes";

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
  "shell",
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
  "madre",
  "next",
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
  "modale",
  "tab",
  "card",
  "bottone",
  "sezione",
  "file",
  "pagina",
  "hook",
  "dove conviene",
  "dove va",
  "dove metteresti",
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

export function selectInternalAiOutputMode(args: {
  prompt: string;
  result: InternalAiChatTurnResult;
  previousMessages: InternalAiChatMessage[];
  repoUnderstandingReady: boolean;
  runtimeObserverObserved: boolean;
}): InternalAiOutputSelection {
  const normalizedPrompt = normalizePrompt(args.prompt);
  const recentIntegrationContext = hasRecentIntegrationContext(args.previousMessages);
  const repoUiRequested = hasAnyPattern(normalizedPrompt, REPO_UI_PATTERNS);
  const integrationRequested = hasAnyPattern(normalizedPrompt, INTEGRATION_PATTERNS);
  const confirmationRequested = hasAnyPattern(normalizedPrompt, CONFIRMATION_PATTERNS);
  const reportReady = args.result.report?.status === "ready";
  const reportIntent =
    args.result.intent === "report_targa" ||
    args.result.intent === "report_autista" ||
    args.result.intent === "report_combinato";

  if (reportReady || reportIntent) {
    return {
      mode: "report_pdf",
      reason:
        "La richiesta e reportistica o comparativa: il contenuto lungo viene spostato in artifact e anteprima PDF dedicata.",
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

  if (args.result.intent === "repo_understanding" || repoUiRequested) {
    return {
      mode: "chat_structured",
      reason:
        "La richiesta riguarda repo, UI o flussi: la risposta resta in chat ma in forma piu strutturata e leggibile.",
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
    mode: args.result.references.length > 2 ? "chat_structured" : "chat_brief",
    reason: buildDefaultReason(args.result),
  };
}
