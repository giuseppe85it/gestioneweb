import type { InternalAiReportPeriodInput } from "../../../internal-ai/internalAiTypes";
import type {
  MezzoDossierCardData,
  MezzoDossierStructuredCard,
} from "../../../internal-ai/internalAiTypes";
import type { NextAnagraficheFlottaMezzoItem } from "../../../nextAnagraficheFlottaDomain";
import type { NextMezzoOperativitaTecnicaSnapshot } from "../../../nextOperativitaTecnicaDomain";
import type { NextMezzoManutenzioniSnapshot } from "../../../domain/nextManutenzioniDomain";
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

export type ChatIaMezzoLavoriCompatItem = {
  id: string;
  gruppoId: string | null;
  targa: string | null;
  mezzoTarga: string | null;
  descrizione: string | null;
  dettagli: string | null;
  dataInserimento: string | null;
  timestampInserimento: number | null;
  dataEsecuzione: string | null;
  timestampEsecuzione: number | null;
  eseguito: boolean;
  stato: "daFare" | "programmata" | "eseguita" | "chiusa_da_evento";
  urgenza: "bassa" | "media" | "alta" | null;
  segnalatoDa: string | null;
  chiHaEseguito: string | null;
};

export type ChatIaMezzoLavoriCompatSnapshot = {
  domainCode: NextMezzoManutenzioniSnapshot["domainCode"];
  domainName: NextMezzoManutenzioniSnapshot["domainName"];
  mezzoTarga: string;
  logicalDatasets: NextMezzoManutenzioniSnapshot["logicalDatasets"];
  activeReadOnlyDataset: "@manutenzioni";
  normalizationStrategy: "manutenzioni-dafare-compat";
  outputContract: "chat-ia-mezzo-lavori-compat-da-manutenzioni";
  datasetShape: "items";
  items: ChatIaMezzoLavoriCompatItem[];
  daEseguire: ChatIaMezzoLavoriCompatItem[];
  inAttesa: ChatIaMezzoLavoriCompatItem[];
  eseguiti: ChatIaMezzoLavoriCompatItem[];
  counts: {
    total: number;
    daEseguire: number;
    inAttesa: number;
    eseguiti: number;
    chiuseDaEvento: number;
    apertiSenzaGruppo: number;
    withDettagli: number;
    withDataEsecuzione: number;
    withChiHaEseguito: number;
    sourceSegnalazioni: number;
    sourceControlli: number;
  };
  limitations: string[];
};

export type ChatIaMezzoSnapshot = {
  requestedTarga: string;
  targa: string;
  matchKind: "exact" | "fuzzy";
  mezzo: NextAnagraficheFlottaMezzoItem;
  operativita: NextMezzoOperativitaTecnicaSnapshot;
  lavori: ChatIaMezzoLavoriCompatSnapshot;
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
