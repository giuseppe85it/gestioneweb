import type { ChatIaReport, ChatIaSectorId } from "../../core/chatIaTypes";
import { generateChatIaReportPdf } from "../../reports/chatIaReportPdf";
import { parseChatIaToolDate } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type SectionInput = { title?: unknown; body?: unknown };
type GenerateReportPdfInput = { title?: unknown; sections?: unknown; sector?: unknown };

const VALID_SECTORS: ChatIaSectorId[] = ["mezzi", "autisti", "manutenzioni_scadenze", "materiali", "costi_fatture", "documenti", "cisterna"];

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function sector(value: unknown): ChatIaSectorId {
  const raw = text(value);
  return VALID_SECTORS.includes(raw as ChatIaSectorId) ? (raw as ChatIaSectorId) : "mezzi";
}

function buildSections(value: unknown): ChatIaReport["sections"] {
  const rows = Array.isArray(value) ? (value as SectionInput[]) : [];
  return rows.map((row, index) => ({
    id: `section-${index + 1}`,
    title: text(row.title, `Sezione ${index + 1}`),
    summary: text(row.body),
    bullets: [],
    status: text(row.body) ? "complete" : "empty",
  }));
}

function buildReport(input: GenerateReportPdfInput, nowIso: string): ChatIaReport {
  const title = text(input.title, "Report Chat IA");
  const reportSector = sector(input.sector);
  const generatedAtMs = parseChatIaToolDate(nowIso)?.getTime() ?? Date.now();
  return {
    id: `chat-ia-${generatedAtMs}`,
    sector: reportSector,
    type: "puntuale",
    target: { kind: "targa", value: "chat-ia" },
    title,
    summary: title,
    generatedAt: nowIso,
    period: null,
    preview: null,
    sections: buildSections(input.sections),
    sources: [{ label: "Chat IA NEXT", path: "src/next/chat-ia/reports/chatIaReportPdf.ts" }],
    missingData: [],
  };
}

export const toolGenerateReportPdf: ChatIaToolHandler<GenerateReportPdfInput> = {
  name: "generate_report_pdf",
  descriptionForOpenAi:
    "Genera un PDF di report a partire da contenuto strutturato della chat. Usa quando l'utente chiede un report PDF o una stampa della risposta.",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string" },
      sections: { type: "array", items: { type: "object", properties: { title: { type: "string" }, body: { type: "string" } }, required: ["title", "body"], additionalProperties: false } },
      sector: { type: "string" },
    },
    required: ["title", "sections"],
    additionalProperties: false,
  },
  outputKindHint: "report",
  async run(input, context) {
    const report = buildReport(input, context.nowIso);
    const result = await generateChatIaReportPdf({ report });
    return { blob: result.blob, blobSize: result.blob.size, fileName: result.fileName, report };
  },
};
