import type {
  ChatIaEntityRef,
  ChatIaRouterDecision,
  ChatIaSectorId,
  ChatIaMessage,
} from "./chatIaTypes";
import {
  extractBadge,
  extractNamedEntity,
  extractPeriodHint,
  extractTarga,
  normalizePromptText,
} from "./chatIaText";

type RouteChatIaPromptArgs = {
  prompt: string;
  previousMessages: ChatIaMessage[];
  now: Date;
};

const SECTOR_KEYWORDS: Record<ChatIaSectorId, { primary: string[]; secondary: string[] }> = {
  mezzi: {
    primary: ["targa", "mezzo", "dossier", "stato operativo"],
    secondary: ["revisione", "libretto", "veicolo"],
  },
  autisti: {
    primary: ["autista", "autisti", "badge", "collega"],
    secondary: ["sessione autista", "eventi autisti"],
  },
  manutenzioni_scadenze: {
    primary: ["manutenzioni", "manutenzione", "scadenze", "lavori"],
    secondary: ["gomme", "collaudo", "attenzione oggi", "precollaudo"],
  },
  materiali: {
    primary: ["magazzino", "stock", "materiali", "attrezzature"],
    secondary: ["adblue", "inventario", "scorte"],
  },
  costi_fatture: {
    primary: ["costi", "fatture", "spese", "preventivi", "ordini", "fornitori"],
    secondary: ["rifornimenti", "rifornimento", "carburante", "gasolio"],
  },
  documenti: {
    primary: ["documenti", "documento", "allegati", "pdf"],
    secondary: ["libretti", "libretto"],
  },
  cisterna: {
    primary: ["cisterna", "caravate", "schede test"],
    secondary: ["adblue cisterna", "parametri cisterna"],
  },
};

function includesKeyword(prompt: string, keyword: string): boolean {
  return prompt.includes(keyword);
}

function scoreSector(prompt: string, sector: ChatIaSectorId, entities: ChatIaEntityRef[]): number {
  const keywords = SECTOR_KEYWORDS[sector];
  let score = 0;

  if (sector === "mezzi" && entities.some((entity) => entity.kind === "targa")) score += 5;
  if (sector === "autisti" && entities.some((entity) => entity.kind === "autista")) score += 5;
  if (sector === "costi_fatture" && entities.some((entity) => entity.kind === "fornitore")) score += 5;
  if (sector === "materiali" && entities.some((entity) => entity.kind === "materiale")) score += 5;
  if (sector === "cisterna" && entities.some((entity) => entity.kind === "cisterna")) score += 5;

  score += keywords.primary.filter((keyword) => includesKeyword(prompt, keyword)).length * 3;
  score += keywords.secondary.filter((keyword) => includesKeyword(prompt, keyword)).length;
  return score;
}

function getConfidence(score: number): ChatIaRouterDecision["confidence"] {
  if (score >= 5) return "alta";
  if (score >= 2) return "media";
  if (score > 0) return "bassa";
  return "nessuna";
}

function pickSector(scores: Record<ChatIaSectorId, number>): ChatIaSectorId | null {
  const entries = Object.entries(scores) as Array<[ChatIaSectorId, number]>;
  const best = entries.sort((left, right) => right[1] - left[1])[0];
  return best && best[1] > 0 ? best[0] : null;
}

export function routeChatIaPrompt(args: RouteChatIaPromptArgs): ChatIaRouterDecision {
  const normalized = normalizePromptText(args.prompt);
  const entities: ChatIaEntityRef[] = [];
  const targa = extractTarga(args.prompt);
  const autista = extractBadge(args.prompt);
  const fornitore = extractNamedEntity(args.prompt, "fornitore");
  const materiale = extractNamedEntity(args.prompt, "materiale");
  const cisterna = normalized.includes("cisterna") ? extractNamedEntity(args.prompt, "cisterna") ?? "cisterna" : null;
  const asksArchive = /\b(archivio|mostra report|riapri report|report salvati)\b/.test(normalized);
  const asksReport = /\b(report|riepilogo|mensile|periodico)\b/.test(normalized);

  if (targa) entities.push({ kind: "targa", value: targa });
  if (autista) entities.push({ kind: "autista", value: autista.value, badge: autista.badge ?? null });
  if (fornitore) entities.push({ kind: "fornitore", value: fornitore });
  if (materiale) entities.push({ kind: "materiale", value: materiale });
  if (cisterna) entities.push({ kind: "cisterna", value: cisterna });

  if (!normalized) {
    return {
      sector: null,
      confidence: "nessuna",
      entities,
      period: null,
      asksReport: false,
      asksArchive: false,
      reason: "prompt_vuoto",
    };
  }

  const scores: Record<ChatIaSectorId, number> = {
    mezzi: scoreSector(normalized, "mezzi", entities),
    autisti: scoreSector(normalized, "autisti", entities),
    manutenzioni_scadenze: scoreSector(normalized, "manutenzioni_scadenze", entities),
    materiali: scoreSector(normalized, "materiali", entities),
    costi_fatture: scoreSector(normalized, "costi_fatture", entities),
    documenti: scoreSector(normalized, "documenti", entities),
    cisterna: scoreSector(normalized, "cisterna", entities),
  };

  if (asksArchive) {
    if (targa) scores.mezzi += 4;
    if (autista) scores.autisti += 4;
  }

  if (targa && Math.max(...Object.values(scores).filter((score) => score !== scores.mezzi)) <= scores.mezzi) {
    scores.mezzi = Math.max(scores.mezzi, 5);
  }

  const sector = pickSector(scores);
  const score = sector ? scores[sector] : 0;

  return {
    sector,
    confidence: getConfidence(score),
    entities,
    period: extractPeriodHint(args.prompt),
    asksReport,
    asksArchive,
    reason: sector
      ? `settore_${sector}_score_${score}_messaggi_${args.previousMessages.length}_ora_${args.now.toISOString()}`
      : "nessun_settore_riconosciuto",
  };
}
