import type { InternalAiReportPeriodInput } from "../../../internal-ai/internalAiTypes";
import type {
  MezzoDossierCardData,
  MezzoDossierStructuredCard,
} from "../../../internal-ai/internalAiTypes";
import type { NextAnagraficheFlottaMezzoItem } from "../../../nextAnagraficheFlottaDomain";
import type { NextMezzoOperativitaTecnicaSnapshot } from "../../../nextOperativitaTecnicaDomain";
import type { NextMezzoLavoriSnapshot } from "../../../domain/nextLavoriDomain";
import type { NextMezzoRifornimentiSnapshot } from "../../../domain/nextRifornimentiDomain";
import type { NextMezzoMaterialiMovimentiSnapshot } from "../../../domain/nextMaterialiMovimentiDomain";
import type { D10Snapshot } from "../../../domain/nextCentroControlloDomain";
import type { NextMezzoSegnalazioniControlliSnapshot } from "../../../domain/nextSegnalazioniControlliDomain";
import type { NextMezzoDocumentiSnapshot } from "../../../domain/nextDocumentiMezzoDomain";
import type { ChatIaReport, ChatIaTable } from "../../core/chatIaTypes";

export type ChatIaMezzoIntent =
  | "stato"
  | "timeline"
  | "materiali"
  | "documenti"
  | "report_mezzo_singolo"
  | "report_mezzo_periodo";

export type ChatIaMezzoTargaMatch =
  | {
      status: "found";
      requestedTarga: string;
      resolvedTarga: string;
      matchKind: "exact" | "fuzzy";
    }
  | {
      status: "ambiguous";
      requestedTarga: string;
      candidates: string[];
    }
  | {
      status: "not_found";
      requestedTarga: string;
    };

export type ChatIaMezzoSnapshot = {
  requestedTarga: string;
  targa: string;
  matchKind: "exact" | "fuzzy";
  mezzo: NextAnagraficheFlottaMezzoItem;
  operativita: NextMezzoOperativitaTecnicaSnapshot;
  lavori: NextMezzoLavoriSnapshot;
  rifornimenti: NextMezzoRifornimentiSnapshot;
  materiali: NextMezzoMaterialiMovimentiSnapshot;
  statoOperativo: D10Snapshot;
  segnalazioniControlli: NextMezzoSegnalazioniControlliSnapshot;
  documenti: NextMezzoDocumentiSnapshot;
  generatedAt: string;
  sources: Array<{ label: string; path?: string; domainCode?: string }>;
  missingData: string[];
};

export type ChatIaMezzoDataResult =
  | { ok: true; match: Extract<ChatIaMezzoTargaMatch, { status: "found" }>; snapshot: ChatIaMezzoSnapshot }
  | { ok: false; match: Exclude<ChatIaMezzoTargaMatch, { status: "found" }>; snapshot: null };

export type ChatIaMezzoTimelineSource =
  | "evento"
  | "segnalazione"
  | "controllo"
  | "rifornimento"
  | "manutenzione"
  | "lavoro";

export type ChatIaMezzoTimelineEvent = {
  id: string;
  source: ChatIaMezzoTimelineSource;
  title: string;
  detail: string | null;
  dateLabel: string | null;
  timestamp: number | null;
  severity: "neutral" | "ok" | "warning" | "danger";
  sourceLabel: string;
  sourceId: string | null;
};

export type ChatIaMezzoReportBuildArgs = {
  snapshot: ChatIaMezzoSnapshot;
  timeline: ChatIaMezzoTimelineEvent[];
  period: InternalAiReportPeriodInput | null;
  prompt: string;
};

export type ChatIaMezzoVisualModel = {
  card: MezzoDossierStructuredCard;
  cardData: MezzoDossierCardData;
  timeline: ChatIaMezzoTimelineEvent[];
  materialsTable: ChatIaTable;
  documentsTable: ChatIaTable;
  report: ChatIaReport | null;
};
