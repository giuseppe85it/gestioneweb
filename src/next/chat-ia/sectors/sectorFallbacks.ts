import type { ChatIaFallbackResponse, ChatIaRouterDecision, ChatIaSectorId } from "../core/chatIaTypes";

const FALLBACKS: Record<ChatIaSectorId, string> = {
  mezzi:
    "Ho riconosciuto un contesto mezzo. Nell'ossatura posso restare sul mezzo e preparare la base per schede, stato operativo e report.",
  autisti:
    "Ho riconosciuto un contesto autista. Nell'ossatura posso restare su badge, nome e sessioni autista senza aprire altri settori.",
  manutenzioni_scadenze:
    "Ho riconosciuto manutenzioni o scadenze. Nell'ossatura posso restare su lavori, gomme, revisioni e collaudi.",
  materiali:
    "Ho riconosciuto un contesto materiali. Nell'ossatura posso restare su magazzino, stock, attrezzature e inventario.",
  costi_fatture:
    "Ho riconosciuto un contesto costi. Nell'ossatura posso restare su fatture, preventivi, ordini, fornitori o rifornimenti.",
  documenti:
    "Ho riconosciuto un contesto documenti. Nell'ossatura posso restare su documenti, allegati, PDF e libretti.",
  cisterna:
    "Ho riconosciuto un contesto cisterna. Nell'ossatura posso restare su schede test, caravate e parametri cisterna.",
};

function buildExamples(decision: ChatIaRouterDecision): string[] {
  if (decision.sector === "mezzi" && decision.entities.some((entity) => entity.kind === "targa")) {
    return ["Posso partire dalla scheda mezzo e dallo stato operativo nella spec Mezzi."];
  }
  if (decision.sector === "costi_fatture") {
    return ["Posso restare sul tema economico richiesto, inclusi rifornimenti se il prompt li cita."];
  }
  if (decision.sector) {
    return [`Posso restare nel settore ${decision.sector} senza mostrare capacita fuori contesto.`];
  }
  return ["Dimmi una targa, un autista o il tema operativo che vuoi controllare."];
}

export function buildChatIaFallback(args: {
  prompt: string;
  decision: ChatIaRouterDecision;
}): ChatIaFallbackResponse {
  const normalizedPrompt = args.prompt.trim().toLowerCase();
  if (!args.decision.sector) {
    return {
      sector: null,
      text:
        normalizedPrompt === "ciao"
          ? "Dimmi una targa, un autista o il tema operativo che vuoi controllare."
          : "Non ho riconosciuto un settore operativo preciso. Scrivi una targa, un autista o un tema specifico.",
      examples: buildExamples(args.decision),
    };
  }

  if (normalizedPrompt.includes("rifornimenti")) {
    return {
      sector: args.decision.sector,
      text:
        "Ho riconosciuto una richiesta sui rifornimenti. Nell'ossatura resto su quel tema e non mostro capacita fuori contesto.",
      examples: ["Scrivi un periodo o una targa se vuoi restringere il controllo rifornimenti."],
    };
  }

  return {
    sector: args.decision.sector,
    text: FALLBACKS[args.decision.sector],
    examples: buildExamples(args.decision),
  };
}
