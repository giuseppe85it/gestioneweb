import { createChatIaReportArchiveEntry } from "../../reports/chatIaReportArchive";
import type { ChatIaArchiveEntry, ChatIaReport } from "../../core/chatIaTypes";
import type { ChatIaMezzoReportBuildArgs, ChatIaMezzoSnapshot } from "./chatIaMezziTypes";

function formatCount(label: string, value: number): string {
  return `${label}: ${value}`;
}

function buildIdentityBullets(snapshot: ChatIaMezzoSnapshot): string[] {
  return [
    `Targa: ${snapshot.targa}`,
    `Categoria: ${snapshot.mezzo.categoria || "non indicata"}`,
    `Marca/modello: ${snapshot.mezzo.marcaModello || "non indicato"}`,
    `Autista: ${snapshot.mezzo.autistaNome || "non assegnato"}`,
    `Revisione: ${snapshot.mezzo.dataScadenzaRevisione || "non indicata"}`,
  ];
}

function buildOperationsBullets(snapshot: ChatIaMezzoSnapshot): string[] {
  return [
    formatCount("Lavori aperti", snapshot.operativita.counts.lavoriAperti),
    formatCount("Lavori chiusi", snapshot.operativita.counts.lavoriChiusi),
    formatCount("Manutenzioni", snapshot.operativita.counts.manutenzioni),
    formatCount("Rifornimenti", snapshot.rifornimenti.counts.total),
    formatCount("Materiali consegnati", snapshot.materiali.counts.total),
  ];
}

function buildDocumentsBullets(snapshot: ChatIaMezzoSnapshot): string[] {
  return [
    formatCount("Documenti totali", snapshot.documenti.counts.total),
    formatCount("Libretti", snapshot.documenti.counts.libretti),
    formatCount("Fatture", snapshot.documenti.counts.fatture),
    formatCount("Certificati", snapshot.documenti.counts.certificati),
    formatCount("Documenti con file", snapshot.documenti.counts.withFile),
  ];
}

export function buildChatIaMezzoReport(args: ChatIaMezzoReportBuildArgs): ChatIaReport {
  const hasPeriod = Boolean(args.period?.fromDate || args.period?.toDate || args.period?.preset);
  const type: ChatIaReport["type"] = hasPeriod
    ? args.period?.preset === "last_full_month"
      ? "mensile"
      : "periodico"
    : "puntuale";
  const periodLabel = args.period
    ? [args.period.preset, args.period.fromDate, args.period.toDate].filter(Boolean).join(" ")
    : null;
  const title = hasPeriod
    ? `Report mezzo ${args.snapshot.targa} - ${periodLabel ?? "periodo"}`
    : `Report mezzo ${args.snapshot.targa}`;
  const timelineCount = args.timeline.length;

  return {
    id: `report-mezzo-${args.snapshot.targa}-${Date.now()}`,
    sector: "mezzi",
    type,
    target: { kind: "targa", value: args.snapshot.targa },
    title,
    summary: `Snapshot mezzo ${args.snapshot.targa} generato da prompt: ${args.prompt}`,
    generatedAt: new Date().toISOString(),
    period: args.period,
    preview: null,
    sections: [
      {
        id: "identita",
        title: "Identita mezzo",
        summary: "Anagrafica, autista e scadenze principali.",
        bullets: buildIdentityBullets(args.snapshot),
        status: "complete",
      },
      {
        id: "operativita",
        title: "Operativita",
        summary: "Lavori, manutenzioni, rifornimenti e materiali.",
        bullets: buildOperationsBullets(args.snapshot),
        status: "complete",
      },
      {
        id: "documenti",
        title: "Documenti",
        summary: "Documenti completi collegati al mezzo.",
        bullets: buildDocumentsBullets(args.snapshot),
        status: args.snapshot.documenti.counts.total > 0 ? "complete" : "empty",
      },
      {
        id: "timeline",
        title: "Timeline",
        summary: "Eventi unificati dalle 5 sorgenti dichiarate.",
        bullets: [formatCount("Eventi timeline", timelineCount)],
        status: timelineCount > 0 ? "complete" : "empty",
      },
    ],
    sources: args.snapshot.sources,
    missingData: args.snapshot.missingData,
  };
}

export async function saveChatIaMezzoReport(args: {
  prompt: string;
  report: ChatIaReport;
  pdfBlob?: Blob | null;
}): Promise<ChatIaArchiveEntry> {
  return createChatIaReportArchiveEntry({
    prompt: args.prompt,
    report: args.report,
    pdfBlob: args.pdfBlob ?? null,
  });
}
