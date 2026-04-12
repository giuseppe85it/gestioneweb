import { useEffect, useMemo, useRef, useState } from "react";
import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { assertCloneWriteAllowed } from "../utils/cloneWriteBarrier";
import type { Ordine } from "../types/ordini";
import { v4 as uuidv4 } from "uuid";
import {
  EUROMECC_AREAS,
  EUROMECC_AREA_KEYS,
  type EuromeccAreaStatic,
  type EuromeccAreaType,
} from "./euromeccAreas";
import {
  addEuromeccDoneTask,
  addEuromeccIssue,
  addEuromeccPendingTask,
  closeEuromeccIssue,
  daysAgo,
  deriveEuromeccCementTypeShortLabel,
  deleteEuromeccDoneTask,
  deleteEuromeccIssue,
  deleteEuromeccPendingTask,
  getAreaStatus,
  getSubStatus,
  readEuromeccSnapshot,
  saveEuromeccAreaCementType,
  updateEuromeccDoneTask,
  updateEuromeccIssue,
  updateEuromeccPendingTask,
  withinRange,
  type EuromeccDoneTask,
  type EuromeccIssue,
  type EuromeccIssueType,
  type EuromeccPendingTask,
  type EuromeccPriority,
  type EuromeccRange,
  type EuromeccSnapshot,
  type EuromeccStatus,
  type UpdateEuromeccDoneTaskInput,
  type UpdateEuromeccIssueInput,
  type UpdateEuromeccPendingTaskInput,
} from "./domain/nextEuromeccDomain";
import { formatDateInput, formatDateUI } from "./nextDateFormat";
import "./next-euromecc.css";

type TabKey = "home" | "maintenance" | "issues" | "report" | "relazioni";
type DataManagerTabKey = "issues" | "pending" | "done";

type MapNodeLayout = {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type SiloGroupLayout = {
  key: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  items: readonly MapNodeLayout[];
};

type SiloHotspot = {
  key: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dotX?: number;
  dotY?: number;
  labelX?: number;
  labelY?: number;
};

type KpiItem = {
  label: string;
  value: string;
  meta: string;
};

type CementPreset = {
  full: string;
  short: string;
};

type DoneEditState = Omit<UpdateEuromeccDoneTaskInput, "nextDate"> & {
  nextDate: string;
};

type IssueEditState = Omit<UpdateEuromeccIssueInput, "closedDate"> & {
  closedDate: string;
};

type EuromeccExtraComponent = {
  areaKey: string;
  subKey: string;
  name: string;
  code: string;
  addedFrom: string;
  addedAt: string;
  addedBy: string;
};

type EuromeccRelazioneDoc = {
  id: string;
  fileName: string;
  fileType: "pdf" | "image";
  dataIntervento: string;
  tecnici: string[];
  note: string;
  statoImportazione: "bozza" | "confermata" | "parziale";
  doneCount: number;
  pendingCount: number;
  extraComponentsCount: number;
  fileUrl?: string | null;
  fileStoragePath?: string | null;
  fileSize?: number | null;
  ordineId?: string | null;
  ordineMateriali?: number | null;
};

type RelazioneItemMatched = {
  kind: "matched";
  areaKey: string;
  subKey: string;
  areaLabel: string;
  subLabel: string;
  title: string;
  tipoIntervento: string;
  doneDate: string;
  by: string;
  note: string;
  nextDate: string | null;
  selected: boolean;
};

type RelazioneItemPartial = {
  kind: "partial";
  rawText: string;
  suggestedAreaKey: string | null;
  suggestedSubKey: string | null;
  editAreaKey: string;
  editSubKey: string;
  editName: string;
  editCode: string;
  editTitle: string;
  editTipoIntervento: string;
  editDoneDate: string;
  editBy: string;
  editNote: string;
  ignored: boolean;
};

type RelazioneItemPending = {
  kind: "pending";
  rawText: string;
  suggestedAreaKey: string | null;
  suggestedSubKey: string | null;
  editAreaKey: string;
  editSubKey: string;
  editTitle: string;
  editPriority: "alta" | "media" | "bassa";
  editDueDate: string | null;
  editNote: string;
  selected: boolean;
  ignored: boolean;
};

type RelazioneAiPayload = {
  dataIntervento: string;
  tecnici: string[];
  matched: RelazioneItemMatched[];
  partial: RelazioneItemPartial[];
  pending: RelazioneItemPending[];
};

type RicambiAiItem = {
  descrizione: string;
  quantita: number;
  unita: string;
  codiceArticolo: string;
  note: string;
  selected: boolean;
};

type RicambiAiPayload = {
  dataDocumento: string;
  azienda: string;
  items: RicambiAiItem[];
};

type RelazioniTabState = {
  phase: "idle" | "uploading" | "analyzing" | "review" | "saving" | "done";
  file: File | null;
  filePreviewUrl: string | null;
  fileType: "pdf" | "image" | null;
  payload: RelazioneAiPayload | null;
  noteGenerali: string;
  bozzaId: string | null;
  error: string | null;
  documentoTipo: "relazione" | "ricambi";
  ricambiPayload: RicambiAiPayload | null;
};

type RiepilogoCardData = {
  areaKey: string;
  areaLabel: string;
  areaCode: string;
  areaType: EuromeccAreaType;
  status: EuromeccStatus;
  pendingItems: EuromeccPendingTask[];
  doneItems: EuromeccDoneTask[];
  openIssues: EuromeccIssue[];
  hasUrgency: boolean;
};

const STATUS_COLORS: Record<EuromeccStatus, string> = {
  ok: "#22c55e",
  check: "#facc15",
  issue: "#fb923c",
  maint: "#ef4444",
  done: "#3b82f6",
  obs: "#8b5cf6",
};

const STATUS_LABELS: Record<EuromeccStatus, string> = {
  ok: "OK",
  check: "Da controllare",
  issue: "Problema",
  maint: "Manutenzione",
  done: "Fatto di recente",
  obs: "Osservazione",
};

const PRIORITY_LABELS: Record<EuromeccPriority, string> = {
  alta: "Alta",
  media: "Media",
  bassa: "Bassa",
};

const ISSUE_TYPE_LABELS: Record<EuromeccIssueType, string> = {
  criticita: "Criticita",
  anomalia: "Anomalia",
  osservazione: "Osservazione",
};

const RANGE_OPTIONS: Array<{ value: EuromeccRange; label: string }> = [
  { value: "30", label: "Ultimi 30 giorni" },
  { value: "60", label: "Ultimi 60 giorni" },
  { value: "90", label: "Ultimi 90 giorni" },
  { value: "all", label: "Tutto" },
];

const TAB_ITEMS: Array<{ key: TabKey; label: string }> = [
  { key: "home", label: "Home" },
  { key: "maintenance", label: "Manutenzione" },
  { key: "issues", label: "Problemi" },
  { key: "report", label: "Riepilogo" },
  { key: "relazioni", label: "Relazioni" },
];

const DATA_MANAGER_TABS: Array<{ key: DataManagerTabKey; label: string }> = [
  { key: "issues", label: "Segnalazioni" },
  { key: "pending", label: "Da fare" },
  { key: "done", label: "Fatte" },
];

const MAP_SILOS: readonly MapNodeLayout[] = [
  { key: "silo1", x: 84, y: 110, width: 112, height: 174 },
  { key: "silo3", x: 500, y: 110, width: 112, height: 174 },
  { key: "silo4", x: 658, y: 110, width: 112, height: 174 },
  { key: "silo5", x: 816, y: 110, width: 112, height: 174 },
  { key: "silo7", x: 1246, y: 110, width: 112, height: 174 },
] as const;

const MAP_SILO_GROUPS: readonly SiloGroupLayout[] = [
  {
    key: "silo2",
    label: "Silo 2",
    x: 232,
    y: 100,
    width: 248,
    height: 184,
    items: [
      { key: "silo2a", x: 244, y: 132, width: 100, height: 128 },
      { key: "silo2b", x: 356, y: 132, width: 100, height: 128 },
    ] as const,
  },
  {
    key: "silo6",
    label: "Silo 6",
    x: 976,
    y: 100,
    width: 248,
    height: 184,
    items: [
      { key: "silo6a", x: 988, y: 132, width: 100, height: 128 },
      { key: "silo6b", x: 1100, y: 132, width: 100, height: 128 },
    ] as const,
  },
] as const;

const MAP_GENERIC: readonly MapNodeLayout[] = [
  { key: "carico1", x: 244, y: 528, width: 212, height: 62 },
  { key: "carico2", x: 630, y: 528, width: 212, height: 62 },
  { key: "caricoRail", x: 958, y: 528, width: 268, height: 62 },
  { key: "compressore", x: 118, y: 726, width: 250, height: 62 },
  { key: "fluidificanti", x: 650, y: 726, width: 306, height: 62 },
  { key: "plc",              x: 958,  y: 676, width: 250, height: 56 },
  { key: "buffer",           x: 958,  y: 746, width: 250, height: 56 },
  { key: "compressore2",     x: 384,  y: 726, width: 250, height: 62 },
  { key: "scaricoFornitore", x: 1246, y: 610, width: 180, height: 62 },
] as const;

const SILO_HOTSPOTS: readonly SiloHotspot[] = [
  { key: "filtro", label: "Filtro", x: 250, y: 46, width: 220, height: 58 },
  { key: "livMax", label: "Livello alto", x: 498, y: 138, width: 132, height: 58 },
  { key: "livMin", label: "Livello basso", x: 498, y: 226, width: 132, height: 58 },
  { key: "fluid", label: "Fluidificanti", x: 112, y: 382, width: 160, height: 58 },
  { key: "scarico", label: "Scarico", x: 300, y: 382, width: 132, height: 58 },
  { key: "coclea", label: "Coclea", x: 268, y: 474, width: 200, height: 48 },
  { key: "motore", label: "Motore", x: 84, y: 472, width: 144, height: 54 },
  { key: "ingrasso", label: "Ingrassaggi", x: 492, y: 472, width: 144, height: 54 },
] as const;

const CARICO_HOTSPOTS: readonly SiloHotspot[] = [
  { key: "filtro",              label: "Filtro silo",
    x: 331, y: 258, width: 160, height: 52,
    dotX: 331, dotY: 284, labelX: 510, labelY: 230 },
  { key: "valvolaFarfalla",     label: "Valvola farfalla",
    x: 320, y: 408, width: 160, height: 52,
    dotX: 320, dotY: 415, labelX: 510, labelY: 300 },
  { key: "proboscide",          label: "Proboscide",
    x: 339, y: 450, width: 160, height: 52,
    dotX: 320, dotY: 460, labelX: 510, labelY: 360 },
  { key: "torex",               label: "Torex / vibratore",
    x: 339, y: 510, width: 160, height: 52,
    dotX: 320, dotY: 520, labelX: 510, labelY: 420 },
  { key: "sensori",             label: "Sensori",
    x: 339, y: 540, width: 160, height: 52,
    dotX: 320, dotY: 555, labelX: 510, labelY: 480 },
  { key: "calzacoclea",         label: "Calza gomma",
    x: 320, y: 590, width: 160, height: 52,
    dotX: 320, dotY: 592, labelX: 510, labelY: 540 },
  { key: "scaricatoreCondensa", label: "Scaricatore condensa",
    x: 170, y: 442, width: 130, height: 52,
    dotX: 170, dotY: 442, labelX: 30,  labelY: 310 },
  { key: "gruppoFR",            label: "Gruppo FR",
    x: 170, y: 462, width: 130, height: 52,
    dotX: 170, dotY: 467, labelX: 30,  labelY: 370 },
] as const;

// Subkey validi in compressore/compressore2: blower, filtroAria, lubrificazione,
// filtroOlio, filtroScambiatore, essiccatore, cinghie, byPass.
// accumulatore e scaricatoreCondensa esclusi — non presenti nelle aree.
const SALA_COMPRESSORI_HOTSPOTS: readonly SiloHotspot[] = [
  { key: "blower",            label: "Blower / vite",       x: 288, y: 340, width: 160, height: 52, dotX: 370, dotY: 420, labelX: 620, labelY: 360 },
  { key: "filtroAria",        label: "Filtro aria",         x: 288, y: 340, width: 160, height: 52, dotX: 350, dotY: 460, labelX: 620, labelY: 390 },
  { key: "lubrificazione",    label: "Lubrificazione",      x: 288, y: 340, width: 160, height: 52, dotX: 310, dotY: 480, labelX: 620, labelY: 420 },
  { key: "filtroOlio",        label: "Filtro olio",         x: 288, y: 340, width: 160, height: 52, dotX: 330, dotY: 500, labelX: 620, labelY: 450 },
  { key: "filtroScambiatore", label: "Filtro scambiatore",  x: 288, y: 340, width: 160, height: 52, dotX: 360, dotY: 510, labelX: 620, labelY: 480 },
  { key: "essiccatore",       label: "Essiccatore",         x: 296, y: 248, width: 148, height: 88, dotX: 370, dotY: 290, labelX: 560, labelY: 160 },
  { key: "cinghie",           label: "Cinghie",             x: 288, y: 340, width: 160, height: 52, dotX: 430, dotY: 370, labelX: 100, labelY: 340 },
  { key: "byPass",            label: "By-pass",             x: 288, y: 340, width: 160, height: 52, dotX: 420, dotY: 400, labelX: 100, labelY: 380 },
  { key: "accumulatore",      label: "Accumulatore aria",   x:  38, y:  78, width: 110, height: 420, dotX:  93, dotY: 220, labelX: 100, labelY: 200 },
  { key: "scaricatoreCondensa", label: "Scaricatore condensa", x: 38, y: 78, width: 110, height: 420, dotX: 93, dotY: 490, labelX: 100, labelY: 460 },
] as const;

const SCARICO_FORNITORE_HOTSPOTS: readonly SiloHotspot[] = [
  { key: "tubazioniScarico",   label: "Tubazioni scarico",  x: 90,  y: 280, width: 80, height: 40, dotX: 136, dotY: 300, labelX: 560, labelY: 180 },
  { key: "valvoleScarico",     label: "Valvole scarico",    x: 230, y: 645, width: 80, height: 40, dotX: 270, dotY: 658, labelX: 560, labelY: 370 },
  { key: "attaccioFornitore",  label: "Attacco fornitore",  x: 325, y: 620, width: 80, height: 40, dotX: 354, dotY: 637, labelX: 560, labelY: 490 },
] as const;

const CARICO_TRENO_HOTSPOTS: readonly SiloHotspot[] = [
  { key: "filtro",              label: "Filtro anti-polvere", x: 272, y: 82,  width: 160, height: 52, dotX: 300, dotY: 100, labelX: 80,  labelY: 62  },
  { key: "proboscide",          label: "Proboscide",          x: 282, y: 340, width: 160, height: 52, dotX: 300, dotY: 490, labelX: 80,  labelY: 490 },
  { key: "scaricatoreTelesc",   label: "Scaricatore telesc.", x: 282, y: 340, width: 160, height: 52, dotX: 300, dotY: 520, labelX: 80,  labelY: 530 },
  { key: "cartucce",            label: "Cartucce",            x: 282, y: 340, width: 160, height: 52, dotX: 300, dotY: 550, labelX: 80,  labelY: 570 },
  { key: "gruppoFR",            label: "Gruppo FR",           x: 282, y: 340, width: 160, height: 52, dotX: 300, dotY: 420, labelX: 510, labelY: 420 },
  { key: "scaricatoreCondensa", label: "Scaricatore condensa",x: 282, y: 340, width: 160, height: 52, dotX: 300, dotY: 395, labelX: 510, labelY: 360 },
] as const;

const EMPTY_PENDING_FORM = {
  title: "",
  priority: "media" as EuromeccPriority,
  dueDate: formatDateInput(new Date()),
  note: "",
};

const EMPTY_DONE_FORM = {
  title: "",
  doneDate: formatDateInput(new Date()),
  by: "",
  nextDate: "",
  note: "",
  closePending: true,
};

const EMPTY_ISSUE_FORM = {
  title: "",
  check: "",
  type: "anomalia" as EuromeccIssueType,
  reportedAt: formatDateInput(new Date()),
  reportedBy: "",
  note: "",
};

const EMPTY_CEMENT_TYPE = "";
const EMPTY_CEMENT_TYPE_SHORT = "";

const CEMENT_TYPE_PRESETS: readonly CementPreset[] = [
  { full: "CEM I 42.5 R", short: "I 42.5R" },
  { full: "CEM II/A-L 42.5 R", short: "II/A-L 42.5R" },
  { full: "CEM II/B-L 32.5 R", short: "II/B-L 32.5R" },
  { full: "CEM III/A 42.5 N", short: "III/A 42.5N" },
  { full: "CEM IV/A 32.5 R", short: "IV/A 32.5R" },
] as const;

function badgeClass(status: EuromeccStatus) {
  return `eur-badge eur-badge-${status}`;
}

function miniPriorityClass(priority: EuromeccPriority) {
  return `eur-mini-badge eur-mini-badge--${priority}`;
}

function miniIssueClass(type: EuromeccIssueType) {
  return `eur-mini-badge eur-mini-badge--${type}`;
}

function formatHomeMapSiloLabel(value: string) {
  return value.replace(/\b0+(\d+[A-Z]?)\b/g, "$1");
}

function firstComponentKey(areaKey: string): string | null {
  return EUROMECC_AREAS[areaKey]?.components[0]?.key ?? null;
}

function areaMeta(areaKey: string, snapshot: EuromeccSnapshot) {
  const lastDone =
    snapshot.done
      .filter((item) => item.areaKey === areaKey)
      .sort((left, right) => right.doneDate.localeCompare(left.doneDate))[0]?.doneDate ?? null;

  const pendingNext =
    snapshot.pending
      .filter((item) => item.areaKey === areaKey)
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate))[0]?.dueDate ?? null;

  const scheduledNext =
    snapshot.done
      .filter((item) => item.areaKey === areaKey && item.nextDate)
      .sort((left, right) => String(left.nextDate).localeCompare(String(right.nextDate)))[0]
      ?.nextDate ?? null;

  return { lastDone, nextDue: pendingNext ?? scheduledNext };
}

function componentMeta(areaKey: string, subKey: string, snapshot: EuromeccSnapshot) {
  const lastDone =
    snapshot.done
      .filter((item) => item.areaKey === areaKey && item.subKey === subKey)
      .sort((left, right) => right.doneDate.localeCompare(left.doneDate))[0]?.doneDate ?? null;

  const pendingNext =
    snapshot.pending
      .filter((item) => item.areaKey === areaKey && item.subKey === subKey)
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate))[0]?.dueDate ?? null;

  const scheduledNext =
    snapshot.done
      .filter((item) => item.areaKey === areaKey && item.subKey === subKey && item.nextDate)
      .sort((left, right) => String(left.nextDate).localeCompare(String(right.nextDate)))[0]
      ?.nextDate ?? null;

  return { lastDone, nextDue: pendingNext ?? scheduledNext };
}

function formatDue(dateStr: string | null) {
  if (!dateStr) return "-";
  const delta = daysAgo(dateStr);
  if (!Number.isFinite(delta)) return "-";
  if (delta < 0) return `scade tra ${Math.abs(delta)} giorni`;
  if (delta === 0) return "scade oggi";
  return `scaduta da ${delta} giorni`;
}

function formatCementTypeFullLabel(value: string) {
  return value.trim() || "NON IMPOSTATO";
}

function formatAgo(dateStr: string | null) {
  if (!dateStr) return "-";
  const delta = daysAgo(dateStr);
  if (!Number.isFinite(delta)) return "-";
  if (delta < 0) return `tra ${Math.abs(delta)} giorni`;
  if (delta === 0) return "oggi";
  return `${delta} giorni fa`;
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function toPendingEditState(item: EuromeccPendingTask): UpdateEuromeccPendingTaskInput {
  return {
    id: item.id,
    areaKey: item.areaKey,
    subKey: item.subKey,
    title: item.title,
    priority: item.priority,
    dueDate: item.dueDate,
    note: item.note,
  };
}

function toDoneEditState(item: EuromeccDoneTask): DoneEditState {
  return {
    id: item.id,
    areaKey: item.areaKey,
    subKey: item.subKey,
    title: item.title,
    doneDate: item.doneDate,
    by: item.by,
    note: item.note,
    nextDate: item.nextDate ?? "",
    closedPending: item.closedPending,
  };
}

function toIssueEditState(item: EuromeccIssue): IssueEditState {
  return {
    id: item.id,
    areaKey: item.areaKey,
    subKey: item.subKey,
    title: item.title,
    check: item.check,
    type: item.type,
    state: item.state,
    reportedAt: item.reportedAt,
    reportedBy: item.reportedBy,
    note: item.note,
    closedDate: item.closedDate ?? "",
  };
}

function KpiGrid({ items }: { items: KpiItem[] }) {
  return (
    <section className="eur-kpis">
      {items.map((item) => (
        <article key={item.label} className="eur-kpi">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <small>{item.meta}</small>
        </article>
      ))}
    </section>
  );
}

function ComponentSelector(props: {
  areaKey: string;
  snapshot: EuromeccSnapshot;
  selectedKey: string | null;
  onSelect: (subKey: string) => void;
}) {
  const area = EUROMECC_AREAS[props.areaKey];

  return (
    <div className="eur-selector-list">
      {area.components.map((component) => {
        const status = getSubStatus(area.key, component.key, component.base, props.snapshot);
        return (
          <button
            key={component.key}
            type="button"
            className={`eur-selector-item ${props.selectedKey === component.key ? "active" : ""}`}
            onClick={() => props.onSelect(component.key)}
          >
            <div>
              <strong>{component.name}</strong>
              <span>{component.code}</span>
            </div>
            <span className={badgeClass(status)}>{STATUS_LABELS[status]}</span>
          </button>
        );
      })}
    </div>
  );
}

function TaskRows(props: {
  items: Array<EuromeccPendingTask | EuromeccDoneTask | EuromeccIssue>;
  emptyLabel: string;
  kind: "pending" | "done" | "issue-open" | "issue-closed";
  onDeletePending?: (id: string) => void;
  onCloseIssue?: (id: string) => void;
  busy?: boolean;
}) {
  if (props.items.length === 0) {
    return <p className="eur-empty">{props.emptyLabel}</p>;
  }

  return (
    <>
      {props.items.map((item) => {
        if (props.kind === "pending") {
          const pending = item as EuromeccPendingTask;
          return (
            <article key={pending.id} className="eur-task-item">
              <div>
                <strong>{pending.title}</strong>
                <div className="eur-task-meta">
                  <span>{formatDateUI(pending.dueDate)}</span>
                  <span>{formatDue(pending.dueDate)}</span>
                  <span>{pending.note || "Nessuna nota"}</span>
                </div>
              </div>
              <div className="eur-task-actions">
                <span className={miniPriorityClass(pending.priority)}>
                  {PRIORITY_LABELS[pending.priority]}
                </span>
                {props.onDeletePending ? (
                  <button
                    type="button"
                    onClick={() => props.onDeletePending?.(pending.id)}
                    disabled={props.busy}
                  >
                    Elimina
                  </button>
                ) : null}
              </div>
            </article>
          );
        }

        if (props.kind === "done") {
          const done = item as EuromeccDoneTask;
          return (
            <article key={done.id} className="eur-task-item">
              <div>
                <strong>{done.title}</strong>
                <div className="eur-task-meta">
                  <span>{done.subLabel}</span>
                  <span>{formatDateUI(done.doneDate)}</span>
                  <span>{done.by}</span>
                  <span>{formatAgo(done.doneDate)}</span>
                </div>
              </div>
              <span className={badgeClass("done")}>Fatto</span>
            </article>
          );
        }

        const issue = item as EuromeccIssue;
        const closed = props.kind === "issue-closed";
        return (
          <article key={issue.id} className="eur-task-item">
            <div>
              <strong>{issue.title}</strong>
              <div className="eur-task-meta">
                <span>{ISSUE_TYPE_LABELS[issue.type]}</span>
                <span>{formatDateUI(closed ? issue.closedDate ?? issue.reportedAt : issue.reportedAt)}</span>
                <span>{closed ? issue.reportedBy : issue.check}</span>
                {issue.note ? <span>{issue.note}</span> : null}
              </div>
            </div>
            <div className="eur-task-actions">
              <span className={miniIssueClass(issue.type)}>
                {closed ? "Chiusa" : ISSUE_TYPE_LABELS[issue.type]}
              </span>
              {!closed && props.onCloseIssue ? (
                <button
                  type="button"
                  onClick={() => props.onCloseIssue?.(issue.id)}
                  disabled={props.busy}
                >
                  Chiudi
                </button>
              ) : null}
            </div>
          </article>
        );
      })}
    </>
  );
}

function MapSvg(props: {
  snapshot: EuromeccSnapshot;
  currentArea: string;
  onSelectArea: (key: string) => void;
}) {
  const renderSingleSilo = (layout: MapNodeLayout) => {
    const area = EUROMECC_AREAS[layout.key];
    const status = getAreaStatus(area.key, [...area.components], props.snapshot);
    const active = props.currentArea === layout.key;
    const centerX = layout.x + layout.width / 2;
    const bottomY = layout.y + layout.height;
    const cementTypeShort = props.snapshot.cementTypeShortByArea[layout.key] || "NON IMPOSTATO";
    const cementEmpty = !props.snapshot.cementTypeShortByArea[layout.key];

    return (
      <g
        key={layout.key}
        className={`eur-node ${active ? "active" : ""}`}
        onClick={() => props.onSelectArea(layout.key)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            props.onSelectArea(layout.key);
          }
        }}
      >
        <line x1={centerX} y1={78} x2={centerX} y2={layout.y} stroke="#9ab0c7" strokeWidth="4.5" />
        <line x1={centerX} y1={bottomY} x2={centerX} y2={450} stroke="#9ab0c7" strokeWidth="4.5" />
        <rect
          className="eur-selectable"
          x={layout.x}
          y={layout.y}
          width={layout.width}
          height={layout.height}
          rx="34"
          fill="#ffffff"
          stroke={active ? "#0f6fff" : "#2d5278"}
          strokeWidth={active ? "4" : "2.4"}
        />
        <text x={centerX} y={layout.y + 84} textAnchor="middle" className="eur-map-silo-title">
          {formatHomeMapSiloLabel(area.title)}
        </text>
        <text x={centerX} y={layout.y + 108} textAnchor="middle" className="eur-map-silo-code">
          {area.code}
        </text>
        <text
          x={centerX}
          y={layout.y + 148}
          textAnchor="middle"
          className={`eur-map-silo-cement ${cementEmpty ? "eur-map-silo-cement--empty" : ""}`}
        >
          {cementTypeShort}
        </text>
        <circle cx={layout.x + layout.width - 16} cy={layout.y + 16} r="11" fill={STATUS_COLORS[status]} />
      </g>
    );
  };

  const renderDoubleSiloGroup = (group: SiloGroupLayout) => {
    const groupCenter = group.x + group.width / 2;
    return (
      <g key={group.key}>
        <line x1={groupCenter} y1={78} x2={groupCenter} y2={group.y} stroke="#9ab0c7" strokeWidth="4.5" />
        <rect
          x={group.x}
          y={group.y}
          width={group.width}
          height={group.height}
          rx="38"
          fill="none"
          stroke="#2d5278"
          strokeWidth="2.4"
        />
        <text x={groupCenter} y={group.y + 24} textAnchor="middle" className="eur-map-group-title">
          {group.label}
        </text>
        {group.items.map((layout) => {
          const area = EUROMECC_AREAS[layout.key];
          const status = getAreaStatus(area.key, [...area.components], props.snapshot);
          const active = props.currentArea === layout.key;
          const centerX = layout.x + layout.width / 2;
          const bottomY = layout.y + layout.height;
          const cementTypeShort =
            props.snapshot.cementTypeShortByArea[layout.key] || "NON IMPOSTATO";
          const cementEmpty = !props.snapshot.cementTypeShortByArea[layout.key];
          return (
            <g
              key={layout.key}
              className={`eur-node ${active ? "active" : ""}`}
              onClick={() => props.onSelectArea(layout.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  props.onSelectArea(layout.key);
                }
              }}
            >
              <line x1={centerX} y1={bottomY} x2={centerX} y2={450} stroke="#9ab0c7" strokeWidth="4.5" />
              <rect
                className="eur-selectable"
                x={layout.x}
                y={layout.y}
                width={layout.width}
                height={layout.height}
                rx="28"
                fill="#ffffff"
                stroke={active ? "#0f6fff" : "#2d5278"}
                strokeWidth={active ? "4" : "2.2"}
              />
              <text x={centerX} y={layout.y + 60} textAnchor="middle" className="eur-map-silo-title">
                {formatHomeMapSiloLabel(area.shortLabel)}
              </text>
              <text x={centerX} y={layout.y + 84} textAnchor="middle" className="eur-map-silo-code">
                {area.code}
              </text>
              <text
                x={centerX}
                y={layout.y + 112}
                textAnchor="middle"
                className={`eur-map-silo-cement ${cementEmpty ? "eur-map-silo-cement--empty" : ""}`}
              >
                {cementTypeShort}
              </text>
              <circle
                cx={layout.x + layout.width - 16}
                cy={layout.y + 16}
                r="11"
                fill={STATUS_COLORS[status]}
              />
            </g>
          );
        })}
      </g>
    );
  };

  const renderGenericNode = (layout: MapNodeLayout) => {
    const area = EUROMECC_AREAS[layout.key];
    const status = getAreaStatus(area.key, [...area.components], props.snapshot);
    const active = props.currentArea === layout.key;
    const centerX = layout.x + layout.width / 2;

    return (
      <g
        key={layout.key}
        className={`eur-node ${active ? "active" : ""}`}
        onClick={() => props.onSelectArea(layout.key)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            props.onSelectArea(layout.key);
          }
        }}
      >
        <rect
          className="eur-selectable"
          x={layout.x}
          y={layout.y}
          width={layout.width}
          height={layout.height}
          rx="16"
          fill="#ffffff"
          stroke={active ? "#0f6fff" : "#2d5278"}
          strokeWidth={active ? "3.6" : "2.2"}
        />
        <text
          x={centerX}
          y={layout.y + 34}
          textAnchor="middle"
          className="eur-map-generic-title"
        >
          {area.title.length > 20 ? area.shortLabel : area.title}
        </text>
        <text
          x={centerX}
          y={layout.y + 53}
          textAnchor="middle"
          className="eur-map-generic-code"
        >
          {area.code}
        </text>
        <circle cx={layout.x + layout.width - 18} cy={layout.y + 18} r="11" fill={STATUS_COLORS[status]} />
      </g>
    );
  };

  return (
    <svg className="eur-map" viewBox="0 0 1480 860" aria-label="Mappa impianto Euromecc">
      <text x="54" y="44" className="eur-map-structure-label">
        Linea centralizzata / collettore superiore
      </text>
      <line x1="124" y1="74" x2="1360" y2="74" className="eur-map-line" />

      {MAP_SILOS.map((item) => renderSingleSilo(item))}
      {MAP_SILO_GROUPS.map((group) => renderDoubleSiloGroup(group))}

      <line x1="128" y1="450" x2="1360" y2="450" className="eur-map-line" />
      <line x1="240" y1="450" x2="240" y2="528" className="eur-map-link-line" />
      <line x1="736" y1="450" x2="736" y2="528" className="eur-map-link-line" />
      <line x1="1092" y1="450" x2="1092" y2="528" className="eur-map-link-line" />
      <line x1="240" y1="450" x2="240" y2="640" className="eur-map-link-line" />
      <line x1="576" y1="450" x2="576" y2="726" className="eur-map-link-line" />
      <line x1="1092" y1="450" x2="1092" y2="802" className="eur-map-link-line" />

      <rect x="82" y="324" width="1278" height="36" rx="12" className="eur-map-family-bar" />
      <text x="721" y="347" textAnchor="middle" className="eur-map-family-label">
        Filtri silo - famiglia trasversale
      </text>

      <rect x="82" y="378" width="1278" height="36" rx="12" className="eur-map-family-bar" />
      <text x="721" y="401" textAnchor="middle" className="eur-map-family-label">
        Coclee / motori / ingrassaggi linee
      </text>

      <rect x="240" y="612" width="918" height="36" rx="12" className="eur-map-family-bar" />
      <text x="699" y="635" textAnchor="middle" className="eur-map-family-label">
        Filtri punti di carico
      </text>

      {MAP_GENERIC.map((item) => renderGenericNode(item))}
    </svg>
  );
}

function SiloDiagram(props: {
  area: EuromeccAreaStatic;
  snapshot: EuromeccSnapshot;
  currentSub: string | null;
  onSelectSub: (key: string) => void;
}) {
  const renderHotspotLabel = (label: string) => {
    const parts = label.split(" ");
    if (parts.length <= 1) {
      return [label];
    }
    return [parts[0], parts.slice(1).join(" ")];
  };

  return (
    <svg viewBox="0 0 720 560" className="eur-silo-diagram" aria-label={`Schema ${props.area.title}`}>
      <rect x="280" y="110" width="160" height="220" rx="20" fill="#eef5fb" stroke="#a9bfd4" strokeWidth="4" />
      <path d="M280 330 L360 430 L440 330" fill="#eef5fb" stroke="#a9bfd4" strokeWidth="4" />
      <rect x="320" y="18" width="80" height="90" rx="18" fill="#eef5fb" stroke="#a9bfd4" strokeWidth="4" />
      <line x1="180" y1="499" x2="545" y2="499" stroke="#95a9bf" strokeWidth="10" strokeLinecap="round" />
      <line x1="155" y1="318" x2="155" y2="512" stroke="#95a9bf" strokeWidth="10" strokeLinecap="round" />
      <circle cx="154" cy="500" r="26" fill="#d9e4ef" stroke="#95a9bf" strokeWidth="4" />
      {SILO_HOTSPOTS.map((spot) => {
        const status = getSubStatus(
          props.area.key,
          spot.key,
          props.area.components.find((item) => item.key === spot.key)?.base ?? props.area.base,
          props.snapshot,
        );
        const active = props.currentSub === spot.key;
        const labelLines = renderHotspotLabel(spot.label);
        const statusY = spot.y + (labelLines.length > 1 ? 51 : 45);
        return (
          <g
            key={spot.key}
            className={`eur-hotspot ${active ? "active" : ""}`}
            onClick={() => props.onSelectSub(spot.key)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                props.onSelectSub(spot.key);
              }
            }}
          >
            <rect
              className="eur-hot-fill"
              x={spot.x}
              y={spot.y}
              width={spot.width}
              height={spot.height}
              rx="18"
              fill={active ? "rgba(15,111,255,.08)" : "rgba(255,255,255,.72)"}
              stroke={STATUS_COLORS[status]}
              strokeWidth={active ? "4" : "2.5"}
            />
            <text x={spot.x + 16} y={spot.y + 25} className="eur-hotspot-label">
              {labelLines.map((line, index) => (
                <tspan
                  key={`${spot.key}-${line}`}
                  x={spot.x + 16}
                  dy={index === 0 ? 0 : 15}
                >
                  {line}
                </tspan>
              ))}
            </text>
            <text x={spot.x + 16} y={statusY} className="eur-hotspot-status">
              {STATUS_LABELS[status]}
            </text>
            <circle cx={spot.x + spot.width - 18} cy={spot.y + 18} r="10" fill={STATUS_COLORS[status]} />
          </g>
        );
      })}
    </svg>
  );
}

function CaricoDiagram(props: {
  area: EuromeccAreaStatic;
  snapshot: EuromeccSnapshot;
  currentSub: string | null;
  onSelectSub: (key: string) => void;
}) {
  return (
    <svg width="100%" viewBox="0 0 680 700" className="eur-silo-diagram" aria-label={`Schema ${props.area.title}`}>
      {/* COLLETTORE SUPERIORE */}
      <rect x="30" y="98" width="400" height="18" rx="4" fill="#B0B8C4" stroke="#7A8290" strokeWidth="1.2" />
      <rect x="30" y="112" width="400" height="5" rx="0" fill="#7A8290" opacity="0.3" />

      {/* SILO SFONDO */}
      <rect x="30" y="60" width="110" height="380" rx="8" fill="#C8CDD4" stroke="#8A9099" strokeWidth="1.5" />
      <ellipse cx="85" cy="60" rx="55" ry="18" fill="#B8BEC6" stroke="#8A9099" strokeWidth="1.5" />
      <rect x="118" y="60" width="22" height="380" rx="0" fill="#A8ADB4" opacity="0.4" />

      {/* COCLEA INCLINATA */}
      <line x1="143" y1="116" x2="318" y2="290" stroke="#7A8290" strokeWidth="20" strokeLinecap="round" opacity="0.2" />
      <line x1="140" y1="113" x2="315" y2="287" stroke="#B0B8C4" strokeWidth="16" strokeLinecap="round" />
      <line x1="138" y1="109" x2="313" y2="283" stroke="#D8DDE4" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
      <line x1="140" y1="113" x2="315" y2="287" stroke="#6A7280" strokeWidth="2" strokeDasharray="8 5" strokeLinecap="round" opacity="0.5" />
      <ellipse cx="162" cy="136" rx="12" ry="5" transform="rotate(-45 162 136)" fill="none" stroke="#7A8290" strokeWidth="1.5" opacity="0.7" />
      <ellipse cx="240" cy="210" rx="12" ry="5" transform="rotate(-45 240 210)" fill="none" stroke="#7A8290" strokeWidth="1.5" opacity="0.7" />

      {/* CORPO FILTRO */}
      <rect x="294" y="265" width="88" height="160" rx="8" fill="#7A8290" opacity="0.2" />
      <rect x="287" y="258" width="88" height="160" rx="8" fill="#C8CDD4" stroke="#8A9099" strokeWidth="1.8" />
      <rect x="287" y="258" width="20" height="160" rx="8" fill="#D8DDE4" opacity="0.6" />
      <rect x="278" y="245" width="106" height="20" rx="5" fill="#B8BEC6" stroke="#8A9099" strokeWidth="1.5" />
      <rect x="283" y="236" width="96" height="14" rx="4" fill="#C8CDD4" stroke="#8A9099" strokeWidth="1.2" />
      <line x1="287" y1="310" x2="375" y2="310" stroke="#8A9099" strokeWidth="1" strokeDasharray="5 3" opacity="0.6" />
      <circle cx="291" cy="275" r="3" fill="#8A9099" opacity="0.7" />
      <circle cx="291" cy="395" r="3" fill="#8A9099" opacity="0.7" />
      <circle cx="371" cy="275" r="3" fill="#8A9099" opacity="0.7" />
      <circle cx="371" cy="395" r="3" fill="#8A9099" opacity="0.7" />
      <path d="M375 265 Q410 290 405 340" fill="none" stroke="#C03020" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />

      {/* PIATTAFORMA */}
      <rect x="190" y="385" width="250" height="16" rx="2" fill="#A0A8B2" stroke="#7A8290" strokeWidth="1.5" />
      <line x1="194" y1="385" x2="194" y2="355" stroke="#8A9099" strokeWidth="2.5" />
      <line x1="440" y1="385" x2="440" y2="355" stroke="#8A9099" strokeWidth="2.5" />
      <line x1="194" y1="355" x2="440" y2="355" stroke="#8A9099" strokeWidth="2" />
      <line x1="194" y1="370" x2="440" y2="370" stroke="#8A9099" strokeWidth="1" opacity="0.5" />
      <line x1="240" y1="385" x2="240" y2="355" stroke="#8A9099" strokeWidth="1.5" opacity="0.6" />
      <line x1="290" y1="385" x2="290" y2="355" stroke="#8A9099" strokeWidth="1.5" opacity="0.6" />
      <line x1="340" y1="385" x2="340" y2="355" stroke="#8A9099" strokeWidth="1.5" opacity="0.6" />
      <line x1="390" y1="385" x2="390" y2="355" stroke="#8A9099" strokeWidth="1.5" opacity="0.6" />

      {/* STRUTTURA PORTANTE */}
      <rect x="196" y="401" width="12" height="185" rx="2" fill="#9A9FA8" stroke="#7A8290" strokeWidth="1" />
      <rect x="432" y="401" width="12" height="185" rx="2" fill="#9A9FA8" stroke="#7A8290" strokeWidth="1" />
      <rect x="196" y="440" width="248" height="8" rx="1" fill="#8A9099" opacity="0.5" />
      <rect x="196" y="490" width="248" height="8" rx="1" fill="#8A9099" opacity="0.5" />
      <rect x="196" y="540" width="248" height="8" rx="1" fill="#8A9099" opacity="0.5" />
      <line x1="208" y1="401" x2="432" y2="448" stroke="#8A9099" strokeWidth="2" opacity="0.4" />
      <line x1="444" y1="401" x2="208" y2="448" stroke="#8A9099" strokeWidth="2" opacity="0.4" />
      <line x1="208" y1="448" x2="432" y2="498" stroke="#8A9099" strokeWidth="2" opacity="0.4" />
      <line x1="444" y1="448" x2="208" y2="498" stroke="#8A9099" strokeWidth="2" opacity="0.4" />
      <line x1="208" y1="498" x2="432" y2="548" stroke="#8A9099" strokeWidth="2" opacity="0.4" />
      <line x1="444" y1="498" x2="208" y2="548" stroke="#8A9099" strokeWidth="2" opacity="0.4" />

      {/* BRACCIO TELESCOPICO */}
      <rect x="301" y="418" width="38" height="90" rx="5" fill="#B8BEC6" stroke="#8A9099" strokeWidth="1.8" />
      <rect x="301" y="418" width="10" height="90" rx="5" fill="#D0D5DC" opacity="0.5" />
      <rect x="308" y="492" width="24" height="60" rx="4" fill="#C8CDD4" stroke="#8A9099" strokeWidth="1.5" />
      <rect x="313" y="536" width="14" height="50" rx="3" fill="#D0D5DC" stroke="#8A9099" strokeWidth="1.2" />

      {/* CALZA GOMMA */}
      <ellipse cx="320" cy="590" rx="14" ry="6" fill="#404850" stroke="#303840" strokeWidth="1.5" opacity="0.8" />
      <rect x="307" y="584" width="26" height="14" rx="3" fill="#404850" stroke="#303840" strokeWidth="1.2" opacity="0.7" />
      <ellipse cx="320" cy="598" rx="12" ry="5" fill="#303840" opacity="0.6" />

      {/* QUADRO FR */}
      <rect x="148" y="415" width="44" height="55" rx="5" fill="#C8CDD4" stroke="#8A9099" strokeWidth="1.5" />
      <rect x="148" y="415" width="44" height="14" rx="5" fill="#A0A8B2" />
      <circle cx="154" cy="446" r="2.5" fill="#8A9099" opacity="0.6" />
      <circle cx="186" cy="446" r="2.5" fill="#8A9099" opacity="0.6" />
      <circle cx="154" cy="458" r="2.5" fill="#8A9099" opacity="0.6" />
      <circle cx="186" cy="458" r="2.5" fill="#8A9099" opacity="0.6" />

      {/* VALVOLA FARFALLA */}
      <circle cx="320" cy="415" r="11" fill="#B8BEC6" stroke="#7A8290" strokeWidth="1.8" />
      <line x1="311" y1="407" x2="329" y2="423" stroke="#7A8290" strokeWidth="2" />
      <circle cx="320" cy="415" r="3" fill="#7A8290" />

      {/* SUOLO */}
      <rect x="0" y="600" width="500" height="100" fill="#B8B4A8" opacity="0.4" />
      <line x1="0" y1="600" x2="500" y2="600" stroke="#A0998A" strokeWidth="2.5" />

      {CARICO_HOTSPOTS.map((spot) => {
        const status = getSubStatus(
          props.area.key,
          spot.key,
          props.area.components.find((item) => item.key === spot.key)?.base ?? props.area.base,
          props.snapshot,
        );
        const active = props.currentSub === spot.key;
        const hasLeader = spot.labelX !== undefined && spot.labelY !== undefined;
        const cx = spot.dotX ?? (spot.x + spot.width / 2);
        const cy = spot.dotY ?? (spot.y + spot.height / 2);

        if (hasLeader) {
          const lx = spot.labelX as number;
          const ly = spot.labelY as number;
          return (
            <g
              key={spot.key}
              className={`eur-hotspot ${active ? "active" : ""}`}
              onClick={() => props.onSelectSub(spot.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  props.onSelectSub(spot.key);
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <line
                x1={cx} y1={cy}
                x2={lx} y2={ly}
                stroke={STATUS_COLORS[status]}
                strokeWidth="1"
                strokeDasharray="4 3"
                opacity="0.7"
              />
              <circle
                cx={cx} cy={cy} r="7"
                fill={STATUS_COLORS[status]}
                stroke={active ? "#0f6fff" : "white"}
                strokeWidth={active ? "3" : "1.5"}
              />
              <circle cx={cx} cy={cy} r="18" fill="transparent" />
              <text
                x={lx} y={ly - 6}
                className="eur-hotspot-label"
                fontSize="12"
                fill="var(--color-text-primary)"
                fontWeight={active ? "600" : "400"}
              >
                {spot.label}
              </text>
              <text
                x={lx} y={ly + 8}
                className="eur-hotspot-status"
                fontSize="11"
                fill={STATUS_COLORS[status]}
              >
                {STATUS_LABELS[status]}
              </text>
            </g>
          );
        }

        // fallback box — sicurezza locale del componente, SiloDiagram non coinvolto
        const labelLines = spot.label.includes(" ")
          ? [spot.label.substring(0, spot.label.indexOf(" ")), spot.label.substring(spot.label.indexOf(" ") + 1)]
          : [spot.label];
        const statusY = spot.y + (labelLines.length > 1 ? 51 : 45);
        return (
          <g
            key={spot.key}
            className={`eur-hotspot ${active ? "active" : ""}`}
            onClick={() => props.onSelectSub(spot.key)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                props.onSelectSub(spot.key);
              }
            }}
          >
            <rect
              className="eur-hot-fill"
              x={spot.x} y={spot.y} width={spot.width} height={spot.height} rx="18"
              fill={active ? "rgba(15,111,255,.08)" : "rgba(255,255,255,.72)"}
              stroke={STATUS_COLORS[status]}
              strokeWidth={active ? "4" : "2.5"}
            />
            <text x={spot.x + 16} y={spot.y + 25} className="eur-hotspot-label">
              {labelLines.map((line, i) => (
                <tspan key={`${spot.key}-${line}`} x={spot.x + 16} dy={i === 0 ? 0 : 15}>{line}</tspan>
              ))}
            </text>
            <text x={spot.x + 16} y={statusY} className="eur-hotspot-status">
              {STATUS_LABELS[status]}
            </text>
            <circle
              cx={spot.x + spot.width - 18} cy={spot.y + 18} r="10"
              fill={STATUS_COLORS[status]}
            />
          </g>
        );
      })}
    </svg>
  );
}

function SalaCompressoriDiagram(props: {
  area: EuromeccAreaStatic;
  snapshot: EuromeccSnapshot;
  currentSub: string | null;
  onSelectSub: (key: string) => void;
}) {
  return (
    <svg width="100%" viewBox="0 0 760 640" className="eur-silo-diagram" aria-label={`Schema ${props.area.title}`}>
      {/* CONTAINER */}
      <rect x="20" y="20" width="720" height="580" rx="4" fill="#D8D4CC" stroke="#A0998A" strokeWidth="2" />
      <rect x="20" y="20" width="720" height="40" rx="4" fill="#C8C4BC" stroke="#A0998A" strokeWidth="1.5" />
      {/* FINESTRA */}
      <rect x="580" y="90" width="130" height="95" rx="4" fill="#C0C4CC" stroke="#8A9099" strokeWidth="1.5" />
      <rect x="586" y="96" width="118" height="83" rx="2" fill="#B0B8C4" />
      <line x1="586" y1="112" x2="704" y2="112" stroke="#8A9099" strokeWidth="1.5" />
      <line x1="586" y1="126" x2="704" y2="126" stroke="#8A9099" strokeWidth="1.5" />
      <line x1="586" y1="140" x2="704" y2="140" stroke="#8A9099" strokeWidth="1.5" />
      <line x1="586" y1="154" x2="704" y2="154" stroke="#8A9099" strokeWidth="1.5" />
      <line x1="586" y1="168" x2="704" y2="168" stroke="#8A9099" strokeWidth="1.5" />
      {/* PAVIMENTO */}
      <rect x="20" y="550" width="720" height="50" rx="2" fill="#9A9890" stroke="#7A7868" strokeWidth="1.5" />
      {/* ACCUMULATORE N.1 */}
      <rect x="38" y="78" width="110" height="420" rx="50" fill="#4A90D8" stroke="#2A6098" strokeWidth="2.5" />
      <rect x="38" y="78" width="26" height="420" rx="50" fill="#6AB0F0" opacity="0.5" />
      <ellipse cx="93" cy="78" rx="55" ry="20" fill="#5AA0E8" stroke="#2A6098" strokeWidth="2" />
      <ellipse cx="93" cy="498" rx="55" ry="20" fill="#3A7AC8" stroke="#2A6098" strokeWidth="2" />
      <circle cx="93" cy="220" r="15" fill="#E8EFF6" stroke="#2A6098" strokeWidth="2" />
      <rect x="76" y="488" width="34" height="14" rx="3" fill="#C03020" stroke="#902010" strokeWidth="1.5" />
      {/* ACCUMULATORE N.2 */}
      <rect x="158" y="88" width="100" height="400" rx="46" fill="#4A90D8" stroke="#2A6098" strokeWidth="2.5" />
      <rect x="158" y="88" width="22" height="400" rx="46" fill="#6AB0F0" opacity="0.45" />
      <ellipse cx="208" cy="88" rx="50" ry="18" fill="#5AA0E8" stroke="#2A6098" strokeWidth="2" />
      <ellipse cx="208" cy="488" rx="50" ry="18" fill="#3A7AC8" stroke="#2A6098" strokeWidth="2" />
      <circle cx="208" cy="230" r="14" fill="#E8EFF6" stroke="#2A6098" strokeWidth="2" />
      <rect x="191" y="480" width="34" height="14" rx="3" fill="#C03020" stroke="#902010" strokeWidth="1.5" />
      {/* COMPRESSORE N.1 */}
      <rect x="288" y="340" width="165" height="210" rx="8" fill="#3A7AC8" stroke="#2A5898" strokeWidth="2.5" />
      <rect x="298" y="350" width="145" height="160" rx="4" fill="#2A6098" stroke="#1A4878" strokeWidth="1.5" />
      <rect x="310" y="362" width="80" height="40" rx="3" fill="#1A3040" stroke="#0A2030" strokeWidth="1" />
      <circle cx="414" cy="382" r="12" fill="#C03020" stroke="#902010" strokeWidth="2" />
      <rect x="310" y="438" width="80" height="14" rx="2" fill="#1A4878" />
      <rect x="310" y="458" width="120" height="40" rx="3" fill="#1A3848" stroke="#0A2030" strokeWidth="1" />
      {/* ESSICCATORE N.1 */}
      <rect x="296" y="248" width="148" height="88" rx="6" fill="#8A9099" stroke="#6A7080" strokeWidth="2" />
      <rect x="306" y="258" width="80" height="58" rx="3" fill="#6A7080" stroke="#5A6070" strokeWidth="1" />
      {/* COMPRESSORE N.2 */}
      <rect x="490" y="300" width="175" height="250" rx="8" fill="#3A7AC8" stroke="#2A5898" strokeWidth="2.5" />
      <rect x="500" y="312" width="155" height="185" rx="4" fill="#2A6098" stroke="#1A4878" strokeWidth="1.5" />
      <rect x="512" y="324" width="90" height="50" rx="3" fill="#1A3040" stroke="#0A2030" strokeWidth="1" />
      <circle cx="630" cy="342" r="14" fill="#C03020" stroke="#902010" strokeWidth="2" />
      <rect x="512" y="440" width="90" height="14" rx="2" fill="#1A4878" />
      <rect x="512" y="460" width="130" height="30" rx="3" fill="#1A3848" stroke="#0A2030" strokeWidth="1" />
      {/* ESSICCATORE N.2 */}
      <rect x="498" y="196" width="158" height="100" rx="6" fill="#3A7AC8" stroke="#2A5898" strokeWidth="2" />
      <rect x="508" y="206" width="70" height="54" rx="3" fill="#1A3040" stroke="#0A2030" strokeWidth="1" />
      <rect x="584" y="206" width="60" height="22" rx="3" fill="#1A4878" />
      <rect x="584" y="234" width="60" height="52" rx="3" fill="#2A5888" stroke="#1A3868" strokeWidth="1" />

      {SALA_COMPRESSORI_HOTSPOTS.map((spot) => {
        const status = getSubStatus(
          props.area.key,
          spot.key,
          props.area.components.find((item) => item.key === spot.key)?.base ?? props.area.base,
          props.snapshot,
        );
        const active = props.currentSub === spot.key;
        const hasLeader = spot.labelX !== undefined && spot.labelY !== undefined;
        const cx = spot.dotX ?? (spot.x + spot.width / 2);
        const cy = spot.dotY ?? (spot.y + spot.height / 2);

        if (hasLeader) {
          const lx = spot.labelX as number;
          const ly = spot.labelY as number;
          return (
            <g
              key={spot.key}
              className={`eur-hotspot ${active ? "active" : ""}`}
              onClick={() => props.onSelectSub(spot.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  props.onSelectSub(spot.key);
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <line
                x1={cx} y1={cy} x2={lx} y2={ly}
                stroke={STATUS_COLORS[status]} strokeWidth="1" strokeDasharray="4 3" opacity="0.7"
              />
              <circle
                cx={cx} cy={cy} r="7"
                fill={STATUS_COLORS[status]}
                stroke={active ? "#0f6fff" : "white"}
                strokeWidth={active ? "3" : "1.5"}
              />
              <circle cx={cx} cy={cy} r="18" fill="transparent" />
              <text
                x={lx} y={ly - 6}
                className="eur-hotspot-label"
                fontSize="12"
                fill="var(--color-text-primary)"
                fontWeight={active ? "600" : "400"}
              >
                {spot.label}
              </text>
              <text x={lx} y={ly + 8} className="eur-hotspot-status" fontSize="11" fill={STATUS_COLORS[status]}>
                {STATUS_LABELS[status]}
              </text>
            </g>
          );
        }

        const labelLines = spot.label.includes(" ")
          ? [spot.label.substring(0, spot.label.indexOf(" ")), spot.label.substring(spot.label.indexOf(" ") + 1)]
          : [spot.label];
        const statusY = spot.y + (labelLines.length > 1 ? 51 : 45);
        return (
          <g
            key={spot.key}
            className={`eur-hotspot ${active ? "active" : ""}`}
            onClick={() => props.onSelectSub(spot.key)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                props.onSelectSub(spot.key);
              }
            }}
          >
            <rect
              className="eur-hot-fill"
              x={spot.x} y={spot.y} width={spot.width} height={spot.height} rx="18"
              fill={active ? "rgba(15,111,255,.08)" : "rgba(255,255,255,.72)"}
              stroke={STATUS_COLORS[status]}
              strokeWidth={active ? "4" : "2.5"}
            />
            <text x={spot.x + 16} y={spot.y + 25} className="eur-hotspot-label">
              {labelLines.map((line, i) => (
                <tspan key={`${spot.key}-${line}`} x={spot.x + 16} dy={i === 0 ? 0 : 15}>{line}</tspan>
              ))}
            </text>
            <text x={spot.x + 16} y={statusY} className="eur-hotspot-status">
              {STATUS_LABELS[status]}
            </text>
            <circle cx={spot.x + spot.width - 18} cy={spot.y + 18} r="10" fill={STATUS_COLORS[status]} />
          </g>
        );
      })}
    </svg>
  );
}

function ScaricoFornitoreDiagram(props: {
  area: EuromeccAreaStatic;
  snapshot: EuromeccSnapshot;
  currentSub: string | null;
  onSelectSub: (key: string) => void;
}) {
  return (
    <svg width="100%" viewBox="0 0 680 820" className="eur-silo-diagram">

      <rect x="0" y="0" width="680" height="820" fill="#E8EFF6" opacity="0.3"/>

      {/* RINGHIERA CIMA */}
      <line x1="208" y1="32" x2="480" y2="32" stroke="#8A9099" strokeWidth="2.5"/>
      <line x1="208" y1="22" x2="480" y2="22" stroke="#8A9099" strokeWidth="1.5"/>
      <line x1="208" y1="22" x2="208" y2="42" stroke="#8A9099" strokeWidth="2"/>
      <line x1="270" y1="22" x2="270" y2="42" stroke="#8A9099" strokeWidth="2"/>
      <line x1="344" y1="22" x2="344" y2="42" stroke="#8A9099" strokeWidth="2"/>
      <line x1="418" y1="22" x2="418" y2="42" stroke="#8A9099" strokeWidth="2"/>
      <line x1="480" y1="22" x2="480" y2="42" stroke="#8A9099" strokeWidth="2"/>

      {/* CALOTTA */}
      <ellipse cx="344" cy="42" rx="136" ry="24" fill="#C8CDD4" stroke="#8A9099" strokeWidth="2"/>
      <ellipse cx="344" cy="42" rx="136" ry="24" fill="#D8DDE4" opacity="0.4"/>

      {/* CORPO CILINDRICO */}
      <rect x="208" y="42" width="272" height="330" fill="#D2D7DE" stroke="#8A9099" strokeWidth="2"/>
      <rect x="208" y="42" width="42"  height="330" fill="#E4E8EE" opacity="0.6"/>
      <rect x="438" y="42" width="42"  height="330" fill="#A8ADB4" opacity="0.4"/>

      {/* ANELLI RINFORZO */}
      <rect x="208" y="90"  width="272" height="7" rx="1" fill="#B0B8C4" stroke="#8A9099" strokeWidth="0.8"/>
      <rect x="208" y="145" width="272" height="7" rx="1" fill="#B0B8C4" stroke="#8A9099" strokeWidth="0.8"/>
      <rect x="208" y="200" width="272" height="7" rx="1" fill="#B0B8C4" stroke="#8A9099" strokeWidth="0.8"/>
      <rect x="208" y="255" width="272" height="7" rx="1" fill="#B0B8C4" stroke="#8A9099" strokeWidth="0.8"/>
      <rect x="208" y="310" width="272" height="7" rx="1" fill="#B0B8C4" stroke="#8A9099" strokeWidth="0.8"/>
      <rect x="208" y="365" width="272" height="7" rx="1" fill="#B0B8C4" stroke="#8A9099" strokeWidth="0.8"/>

      {/* COSTOLE VERTICALI */}
      <line x1="260" y1="42" x2="260" y2="372" stroke="#A0A8B2" strokeWidth="1" opacity="0.35"/>
      <line x1="312" y1="42" x2="312" y2="372" stroke="#A0A8B2" strokeWidth="1" opacity="0.35"/>
      <line x1="376" y1="42" x2="376" y2="372" stroke="#A0A8B2" strokeWidth="1" opacity="0.35"/>
      <line x1="428" y1="42" x2="428" y2="372" stroke="#A0A8B2" strokeWidth="1" opacity="0.35"/>

      {/* CONO DI SCARICO */}
      <polygon points="198,372 480,372 428,498 250,498" fill="#B8BEC6" stroke="#8A9099" strokeWidth="2"/>
      <polygon points="198,372 250,372 235,498 198,490" fill="#CDD2D8" opacity="0.5"/>
      <rect x="198" y="368" width="282" height="9" rx="1" fill="#9A9FA8" stroke="#8A9099" strokeWidth="1"/>
      <line x1="228" y1="372" x2="262" y2="498" stroke="#8A9099" strokeWidth="1.5" opacity="0.45"/>
      <line x1="280" y1="372" x2="280" y2="498" stroke="#8A9099" strokeWidth="1.5" opacity="0.45"/>
      <line x1="344" y1="372" x2="330" y2="498" stroke="#8A9099" strokeWidth="1.5" opacity="0.45"/>
      <line x1="408" y1="372" x2="380" y2="498" stroke="#8A9099" strokeWidth="1.5" opacity="0.45"/>
      <rect x="246" y="428" width="182" height="6" rx="1" fill="#9A9FA8" stroke="#8A9099" strokeWidth="0.8" opacity="0.7"/>

      {/* STRUTTURA PORTANTE */}
      <rect x="216" y="498" width="12" height="195" rx="2" fill="#9A9FA8" stroke="#7A8290" strokeWidth="1"/>
      <rect x="278" y="498" width="12" height="195" rx="2" fill="#9A9FA8" stroke="#7A8290" strokeWidth="1"/>
      <rect x="400" y="498" width="12" height="195" rx="2" fill="#9A9FA8" stroke="#7A8290" strokeWidth="1"/>
      <rect x="460" y="498" width="12" height="195" rx="2" fill="#9A9FA8" stroke="#7A8290" strokeWidth="1"/>
      <rect x="216" y="535" width="256" height="8" rx="1" fill="#8A9099" opacity="0.55"/>
      <rect x="216" y="585" width="256" height="8" rx="1" fill="#8A9099" opacity="0.55"/>
      <rect x="216" y="635" width="256" height="8" rx="1" fill="#8A9099" opacity="0.55"/>
      <line x1="228" y1="498" x2="472" y2="543" stroke="#8A9099" strokeWidth="2" opacity="0.4"/>
      <line x1="472" y1="498" x2="228" y2="543" stroke="#8A9099" strokeWidth="2" opacity="0.4"/>
      <line x1="228" y1="543" x2="472" y2="593" stroke="#8A9099" strokeWidth="2" opacity="0.4"/>
      <line x1="472" y1="543" x2="228" y2="593" stroke="#8A9099" strokeWidth="2" opacity="0.4"/>
      <line x1="228" y1="593" x2="472" y2="643" stroke="#8A9099" strokeWidth="2" opacity="0.4"/>
      <line x1="472" y1="593" x2="228" y2="643" stroke="#8A9099" strokeWidth="2" opacity="0.4"/>

      {/* BASI PILASTRI */}
      <rect x="208" y="688" width="28" height="14" rx="2" fill="#8A9099" opacity="0.6"/>
      <rect x="270" y="688" width="28" height="14" rx="2" fill="#8A9099" opacity="0.6"/>
      <rect x="392" y="688" width="28" height="14" rx="2" fill="#8A9099" opacity="0.6"/>
      <rect x="452" y="688" width="28" height="14" rx="2" fill="#8A9099" opacity="0.6"/>

      {/* PIATTAFORMA */}
      <rect x="186" y="496" width="314" height="10" rx="2" fill="#9A9FA8" stroke="#7A8290" strokeWidth="1.2"/>

      {/* SCALA ACCESSO */}
      <line x1="100" y1="55"  x2="100" y2="506" stroke="#8A9099" strokeWidth="2" opacity="0.55"/>
      <line x1="90"  y1="55"  x2="90"  y2="506" stroke="#8A9099" strokeWidth="2" opacity="0.55"/>
      <line x1="90" y1="88"  x2="100" y2="88"  stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="108" x2="100" y2="108" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="128" x2="100" y2="128" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="148" x2="100" y2="148" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="168" x2="100" y2="168" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="188" x2="100" y2="188" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="208" x2="100" y2="208" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="228" x2="100" y2="228" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="248" x2="100" y2="248" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="268" x2="100" y2="268" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="288" x2="100" y2="288" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="308" x2="100" y2="308" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="328" x2="100" y2="328" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="348" x2="100" y2="348" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="368" x2="100" y2="368" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="388" x2="100" y2="388" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="408" x2="100" y2="408" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="428" x2="100" y2="428" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="460" x2="100" y2="460" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>
      <line x1="90" y1="490" x2="100" y2="490" stroke="#8A9099" strokeWidth="1.5" opacity="0.65"/>

      {/* 4 TUBI VERTICALI CON CURVA VERSO TARGHETTA */}
      <path d="M112,55 L112,640 Q112,668 140,668 L335,668" fill="none" stroke="#9A9FA8" strokeWidth="9" strokeLinecap="round"/>
      <path d="M112,55 L112,640 Q112,668 140,668 L335,668" fill="none" stroke="#C8CDD4" strokeWidth="5" strokeLinecap="round"/>
      <path d="M128,55 L128,650 Q128,680 158,680 L335,680" fill="none" stroke="#9A9FA8" strokeWidth="9" strokeLinecap="round"/>
      <path d="M128,55 L128,650 Q128,680 158,680 L335,680" fill="none" stroke="#C8CDD4" strokeWidth="5" strokeLinecap="round"/>
      <path d="M144,55 L144,660 Q144,692 176,692 L335,692" fill="none" stroke="#9A9FA8" strokeWidth="9" strokeLinecap="round"/>
      <path d="M144,55 L144,660 Q144,692 176,692 L335,692" fill="none" stroke="#C8CDD4" strokeWidth="5" strokeLinecap="round"/>
      <path d="M160,55 L160,670 Q160,704 194,704 L335,704" fill="none" stroke="#9A9FA8" strokeWidth="9" strokeLinecap="round"/>
      <path d="M160,55 L160,670 Q160,704 194,704 L335,704" fill="none" stroke="#C8CDD4" strokeWidth="5" strokeLinecap="round"/>

      {/* FLANGE SUI TUBI */}
      <rect x="107" y="115" width="60" height="5" rx="1" fill="#8A9099" opacity="0.65"/>
      <rect x="107" y="215" width="60" height="5" rx="1" fill="#8A9099" opacity="0.65"/>
      <rect x="107" y="315" width="60" height="5" rx="1" fill="#8A9099" opacity="0.65"/>
      <rect x="107" y="415" width="60" height="5" rx="1" fill="#8A9099" opacity="0.65"/>
      <rect x="107" y="515" width="52" height="5" rx="1" fill="#8A9099" opacity="0.65"/>

      {/* GRUPPO VALVOLE */}
      <rect x="240" y="660" width="60" height="52" rx="3" fill="#9A9FA8" stroke="#7A8290" strokeWidth="1.2"/>
      <rect x="246" y="666" width="20" height="10" rx="1" fill="#7A8290" opacity="0.8"/>
      <rect x="246" y="680" width="20" height="10" rx="1" fill="#7A8290" opacity="0.8"/>
      <rect x="246" y="694" width="20" height="10" rx="1" fill="#7A8290" opacity="0.8"/>
      <circle cx="276" cy="671" r="4" fill="#8A9099" stroke="#7A8290" strokeWidth="1"/>
      <circle cx="276" cy="685" r="4" fill="#8A9099" stroke="#7A8290" strokeWidth="1"/>
      <circle cx="276" cy="699" r="4" fill="#8A9099" stroke="#7A8290" strokeWidth="1"/>

      {/* QUADRO FR */}
      <rect x="54"  y="518" width="72" height="95" rx="5" fill="#C8CDD4" stroke="#8A9099" strokeWidth="1.8"/>
      <rect x="54"  y="518" width="72" height="18" rx="5" fill="#9A9FA8"/>
      <text fontSize="11" x="90" y="531" textAnchor="middle" fill="#F0EEE8">FR</text>
      <circle cx="74"  cy="554" r="5" fill="#8A9099" opacity="0.7"/>
      <circle cx="90"  cy="554" r="5" fill="#8A9099" opacity="0.7"/>
      <circle cx="106" cy="554" r="5" fill="#8A9099" opacity="0.7"/>
      <circle cx="74"  cy="572" r="5" fill="#8A9099" opacity="0.7"/>
      <circle cx="90"  cy="572" r="5" fill="#8A9099" opacity="0.7"/>
      <circle cx="106" cy="572" r="5" fill="#8A9099" opacity="0.7"/>
      <circle cx="74"  cy="590" r="5" fill="#8A9099" opacity="0.7"/>
      <circle cx="90"  cy="590" r="5" fill="#8A9099" opacity="0.7"/>
      <circle cx="106" cy="590" r="5" fill="#8A9099" opacity="0.7"/>

      {/* TARGHETTA NUMERAZIONE */}
      <rect x="335" y="640" width="38" height="82" rx="3" fill="#F4F2EC" stroke="#8A9099" strokeWidth="1"/>
      <text fontSize="11" x="354" y="658" textAnchor="middle" fill="#3A3A38">5</text>
      <text fontSize="11" x="354" y="674" textAnchor="middle" fill="#3A3A38">6B</text>
      <text fontSize="11" x="354" y="690" textAnchor="middle" fill="#3A3A38">6A</text>
      <text fontSize="11" x="354" y="706" textAnchor="middle" fill="#3A3A38">7</text>

      {/* SUOLO */}
      <rect x="0"  y="730" width="680" height="90" fill="#B8B4A8" opacity="0.38"/>
      <line x1="0" y1="730" x2="680" y2="730" stroke="#A0998A" strokeWidth="2.5"/>

      {/* TITOLO */}
      <text fontSize="13" x="340" y="755" textAnchor="middle" fill="#3A3A38" fontWeight="500">postazione scarico fornitore</text>
      <text fontSize="11" x="340" y="772" textAnchor="middle" fill="#8A9099">SCF-01</text>

      {/* HOTSPOT */}
      {SCARICO_FORNITORE_HOTSPOTS.map((spot) => {
        const status = getSubStatus(
          props.area.key,
          spot.key,
          props.area.components.find((item) => item.key === spot.key)?.base ?? props.area.base,
          props.snapshot,
        );
        const active = props.currentSub === spot.key;
        const cx = spot.dotX ?? (spot.x + spot.width / 2);
        const cy = spot.dotY ?? (spot.y + spot.height / 2);
        const hasLeader = spot.labelX !== undefined && spot.labelY !== undefined;
        if (!hasLeader) return null;
        return (
          <g key={spot.key}
            className={`eur-hotspot ${active ? "active" : ""}`}
            onClick={() => props.onSelectSub(spot.key)}
            role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); props.onSelectSub(spot.key); }}}
            style={{ cursor: "pointer" }}>
            <line x1={cx} y1={cy} x2={spot.labelX} y2={spot.labelY}
              stroke={STATUS_COLORS[status]} strokeWidth="1" strokeDasharray="4 3" opacity="0.7"/>
            <circle cx={cx} cy={cy} r="7"
              fill={STATUS_COLORS[status]}
              stroke={active ? "#0f6fff" : "white"}
              strokeWidth={active ? "3" : "1.5"}/>
            <circle cx={cx} cy={cy} r="18" fill="transparent"/>
            <text x={spot.labelX} y={(spot.labelY ?? 0) - 6}
              className="eur-hotspot-label" fontSize="12"
              fill="var(--color-text-primary)"
              fontWeight={active ? "600" : "400"}>{spot.label}</text>
            <text x={spot.labelX} y={(spot.labelY ?? 0) + 8}
              className="eur-hotspot-status" fontSize="11"
              fill={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</text>
          </g>
        );
      })}
    </svg>
  );
}


function CaricoTrenoDiagram(props: {
  area: EuromeccAreaStatic;
  snapshot: EuromeccSnapshot;
  currentSub: string | null;
  onSelectSub: (key: string) => void;
}) {
  return (
    <svg width="100%" viewBox="0 0 680 820" className="eur-silo-diagram" aria-label={`Schema ${props.area.title}`}>
      <rect x="0" y="0" width="680" height="820" fill="#E8EFF6" opacity="0.25" />
      {/* BINARIO */}
      <rect x="60" y="748" width="560" height="12" rx="2" fill="#7A7268" stroke="#5A5248" strokeWidth="1" />
      <rect x="80" y="745" width="18" height="28" rx="1" fill="#5A5248" opacity="0.7" />
      <rect x="130" y="745" width="18" height="28" rx="1" fill="#5A5248" opacity="0.7" />
      <rect x="180" y="745" width="18" height="28" rx="1" fill="#5A5248" opacity="0.7" />
      <rect x="230" y="745" width="18" height="28" rx="1" fill="#5A5248" opacity="0.7" />
      <rect x="280" y="745" width="18" height="28" rx="1" fill="#5A5248" opacity="0.7" />
      <rect x="330" y="745" width="18" height="28" rx="1" fill="#5A5248" opacity="0.7" />
      <rect x="380" y="745" width="18" height="28" rx="1" fill="#5A5248" opacity="0.7" />
      <rect x="430" y="745" width="18" height="28" rx="1" fill="#5A5248" opacity="0.7" />
      <rect x="480" y="745" width="18" height="28" rx="1" fill="#5A5248" opacity="0.7" />
      <rect x="530" y="745" width="18" height="28" rx="1" fill="#5A5248" opacity="0.7" />
      <rect x="60" y="748" width="560" height="5" rx="1" fill="#9A9288" />
      <rect x="60" y="762" width="560" height="5" rx="1" fill="#9A9288" />
      {/* VAGONE */}
      <rect x="110" y="666" width="380" height="82" rx="6" fill="#C8CDD4" stroke="#8A9099" strokeWidth="2" />
      <rect x="110" y="666" width="380" height="18" rx="6" fill="#B0B8C4" />
      <rect x="110" y="666" width="22" height="82" rx="6" fill="#D8DDE4" opacity="0.5" />
      <ellipse cx="300" cy="668" rx="38" ry="10" fill="#A0A8B2" stroke="#7A8290" strokeWidth="2" />
      <ellipse cx="300" cy="668" rx="28" ry="7" fill="#8A9099" />
      {/* RUOTE */}
      <circle cx="160" cy="752" r="18" fill="#6A6860" stroke="#4A4840" strokeWidth="2" />
      <circle cx="160" cy="752" r="10" fill="#8A8880" />
      <circle cx="160" cy="752" r="4" fill="#4A4840" />
      <circle cx="260" cy="752" r="18" fill="#6A6860" stroke="#4A4840" strokeWidth="2" />
      <circle cx="260" cy="752" r="10" fill="#8A8880" />
      <circle cx="260" cy="752" r="4" fill="#4A4840" />
      <circle cx="340" cy="752" r="18" fill="#6A6860" stroke="#4A4840" strokeWidth="2" />
      <circle cx="340" cy="752" r="10" fill="#8A8880" />
      <circle cx="340" cy="752" r="4" fill="#4A4840" />
      <circle cx="440" cy="752" r="18" fill="#6A6860" stroke="#4A4840" strokeWidth="2" />
      <circle cx="440" cy="752" r="10" fill="#8A8880" />
      <circle cx="440" cy="752" r="4" fill="#4A4840" />
      {/* TAMPONAMENTI */}
      <rect x="96" y="695" width="16" height="24" rx="3" fill="#8A9099" stroke="#7A8290" strokeWidth="1.2" />
      <rect x="488" y="695" width="16" height="24" rx="3" fill="#8A9099" stroke="#7A8290" strokeWidth="1.2" />
      {/* STRUTTURA PORTANTE */}
      <rect x="210" y="200" width="14" height="466" rx="2" fill="#9A9FA8" stroke="#7A8290" strokeWidth="1.2" />
      <rect x="376" y="200" width="14" height="466" rx="2" fill="#9A9FA8" stroke="#7A8290" strokeWidth="1.2" />
      <rect x="210" y="240" width="180" height="8" rx="1" fill="#8A9099" opacity="0.6" />
      <rect x="210" y="320" width="180" height="8" rx="1" fill="#8A9099" opacity="0.6" />
      <rect x="210" y="420" width="180" height="8" rx="1" fill="#8A9099" opacity="0.6" />
      <rect x="210" y="520" width="180" height="8" rx="1" fill="#8A9099" opacity="0.6" />
      <rect x="210" y="610" width="180" height="8" rx="1" fill="#8A9099" opacity="0.6" />
      <line x1="224" y1="200" x2="390" y2="248" stroke="#8A9099" strokeWidth="2" opacity="0.4" />
      <line x1="390" y1="200" x2="224" y2="248" stroke="#8A9099" strokeWidth="2" opacity="0.4" />
      <line x1="224" y1="248" x2="390" y2="328" stroke="#8A9099" strokeWidth="2" opacity="0.4" />
      <line x1="390" y1="248" x2="224" y2="328" stroke="#8A9099" strokeWidth="2" opacity="0.4" />
      <line x1="224" y1="328" x2="390" y2="428" stroke="#8A9099" strokeWidth="2" opacity="0.4" />
      <line x1="390" y1="328" x2="224" y2="428" stroke="#8A9099" strokeWidth="2" opacity="0.4" />
      <line x1="224" y1="428" x2="390" y2="528" stroke="#8A9099" strokeWidth="2" opacity="0.4" />
      <line x1="390" y1="428" x2="224" y2="528" stroke="#8A9099" strokeWidth="2" opacity="0.4" />
      <line x1="224" y1="528" x2="390" y2="618" stroke="#8A9099" strokeWidth="2" opacity="0.4" />
      <line x1="390" y1="528" x2="224" y2="618" stroke="#8A9099" strokeWidth="2" opacity="0.4" />
      {/* SILO */}
      <ellipse cx="300" cy="148" rx="72" ry="18" fill="#C8CDD4" stroke="#8A9099" strokeWidth="1.8" />
      <rect x="228" y="148" width="144" height="140" fill="#D0D5DC" stroke="#8A9099" strokeWidth="2" />
      <rect x="228" y="148" width="24" height="140" fill="#E0E5EC" opacity="0.5" />
      <rect x="348" y="148" width="24" height="140" fill="#A8ADB4" opacity="0.4" />
      <rect x="228" y="190" width="144" height="5" rx="1" fill="#B0B8C4" stroke="#8A9099" strokeWidth="0.5" />
      <rect x="228" y="235" width="144" height="5" rx="1" fill="#B0B8C4" stroke="#8A9099" strokeWidth="0.5" />
      <rect x="228" y="280" width="144" height="5" rx="1" fill="#B0B8C4" stroke="#8A9099" strokeWidth="0.5" />
      <polygon points="228,288 372,288 340,340 260,340" fill="#B8BEC6" stroke="#8A9099" strokeWidth="1.8" />
      <rect x="228" y="284" width="144" height="7" rx="1" fill="#9A9FA8" stroke="#8A9099" strokeWidth="1" />
      {/* FILTRO */}
      <rect x="272" y="82" width="56" height="72" rx="8" fill="#C8CDD4" stroke="#8A9099" strokeWidth="2" />
      <rect x="272" y="82" width="14" height="72" rx="8" fill="#D8DDE4" opacity="0.6" />
      <rect x="266" y="70" width="68" height="16" rx="4" fill="#B8BEC6" stroke="#8A9099" strokeWidth="1.5" />
      <rect x="272" y="58" width="56" height="16" rx="4" fill="#C8CDD4" stroke="#8A9099" strokeWidth="1.2" />
      <polygon points="272,154 328,154 316,170 284,170" fill="#B0B8C4" stroke="#8A9099" strokeWidth="1.5" />
      {/* PROBOSCIDE */}
      <rect x="294" y="30" width="12" height="30" rx="3" fill="#C8CDD4" stroke="#8A9099" strokeWidth="1.5" />
      <ellipse cx="300" cy="30" rx="14" ry="5" fill="#B8BEC6" stroke="#8A9099" strokeWidth="1.2" />
      <path d="M300 30 Q300 14 320 12 Q360 8 400 10" fill="none" stroke="#B8BEC6" strokeWidth="10" strokeLinecap="round" />
      <path d="M300 30 Q300 14 320 12 Q360 8 400 10" fill="none" stroke="#D0D5DC" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      {/* TUBAZIONI */}
      <rect x="420" y="50" width="16" height="620" rx="3" fill="#B8BEC6" stroke="#8A9099" strokeWidth="1.5" />
      <rect x="420" y="50" width="5" height="620" fill="#D0D5DC" opacity="0.55" />
      <rect x="440" y="50" width="12" height="600" rx="3" fill="#B0B8C4" stroke="#8A9099" strokeWidth="1.2" />
      <rect x="417" y="130" width="38" height="5" rx="1" fill="#8A9099" opacity="0.65" />
      <rect x="417" y="230" width="38" height="5" rx="1" fill="#8A9099" opacity="0.65" />
      <rect x="417" y="330" width="38" height="5" rx="1" fill="#8A9099" opacity="0.65" />
      <rect x="417" y="430" width="38" height="5" rx="1" fill="#8A9099" opacity="0.65" />
      <rect x="417" y="530" width="38" height="5" rx="1" fill="#8A9099" opacity="0.65" />
      <line x1="470" y1="80" x2="470" y2="640" stroke="#8A9099" strokeWidth="2" opacity="0.55" />
      <line x1="460" y1="80" x2="460" y2="640" stroke="#8A9099" strokeWidth="2" opacity="0.55" />
      <line x1="460" y1="110" x2="470" y2="110" stroke="#8A9099" strokeWidth="1.5" opacity="0.6" />
      <line x1="460" y1="150" x2="470" y2="150" stroke="#8A9099" strokeWidth="1.5" opacity="0.6" />
      <line x1="460" y1="190" x2="470" y2="190" stroke="#8A9099" strokeWidth="1.5" opacity="0.6" />
      <line x1="460" y1="230" x2="470" y2="230" stroke="#8A9099" strokeWidth="1.5" opacity="0.6" />
      <line x1="460" y1="270" x2="470" y2="270" stroke="#8A9099" strokeWidth="1.5" opacity="0.6" />
      <line x1="460" y1="310" x2="470" y2="310" stroke="#8A9099" strokeWidth="1.5" opacity="0.6" />
      <line x1="460" y1="360" x2="470" y2="360" stroke="#8A9099" strokeWidth="1.5" opacity="0.6" />
      <line x1="460" y1="400" x2="470" y2="400" stroke="#8A9099" strokeWidth="1.5" opacity="0.6" />
      <line x1="460" y1="440" x2="470" y2="440" stroke="#8A9099" strokeWidth="1.5" opacity="0.6" />
      <line x1="460" y1="480" x2="470" y2="480" stroke="#8A9099" strokeWidth="1.5" opacity="0.6" />
      <line x1="460" y1="520" x2="470" y2="520" stroke="#8A9099" strokeWidth="1.5" opacity="0.6" />
      <line x1="460" y1="560" x2="470" y2="560" stroke="#8A9099" strokeWidth="1.5" opacity="0.6" />
      <line x1="460" y1="600" x2="470" y2="600" stroke="#8A9099" strokeWidth="1.5" opacity="0.6" />
      {/* BRACCIO TELESCOPICO */}
      <rect x="282" y="340" width="36" height="100" rx="5" fill="#B8BEC6" stroke="#8A9099" strokeWidth="2" />
      <rect x="282" y="340" width="10" height="100" fill="#D0D5DC" opacity="0.5" />
      <rect x="289" y="424" width="22" height="80" rx="4" fill="#C8CDD4" stroke="#8A9099" strokeWidth="1.8" />
      <rect x="294" y="488" width="12" height="90" rx="3" fill="#D0D5DC" stroke="#8A9099" strokeWidth="1.5" />
      {/* CALZA GOMMA */}
      <ellipse cx="300" cy="580" rx="12" ry="5" fill="#404850" stroke="#303840" strokeWidth="1.5" opacity="0.85" />
      <rect x="289" y="576" width="22" height="12" rx="3" fill="#404850" stroke="#303840" strokeWidth="1.2" opacity="0.75" />
      <ellipse cx="300" cy="588" rx="10" ry="5" fill="#303840" opacity="0.7" />
      {/* VALVOLA */}
      <rect x="290" y="330" width="20" height="14" rx="2" fill="#9A9FA8" stroke="#7A8290" strokeWidth="1.2" />
      {/* QUADRO COMANDO */}
      <rect x="500" y="440" width="80" height="110" rx="6" fill="#C8CDD4" stroke="#8A9099" strokeWidth="2" />
      <rect x="500" y="440" width="80" height="22" rx="6" fill="#8A9099" />
      <rect x="510" y="470" width="60" height="30" rx="3" fill="#2A3840" stroke="#1A2830" strokeWidth="1" />
      <circle cx="520" cy="516" r="6" fill="#C03020" stroke="#902010" strokeWidth="1.2" />
      <circle cx="540" cy="516" r="6" fill="#208040" stroke="#106030" strokeWidth="1.2" />
      <circle cx="560" cy="516" r="6" fill="#D09020" stroke="#A06010" strokeWidth="1.2" />
      <rect x="510" y="528" width="60" height="12" rx="3" fill="#A0A8B2" stroke="#8A9099" strokeWidth="1" />
      <path d="M500 500 Q480 500 470 480" fill="none" stroke="#6A7280" strokeWidth="2.5" strokeLinecap="round" />
      {/* SUOLO */}
      <rect x="0" y="775" width="680" height="45" fill="#B8B4A8" opacity="0.38" />
      <line x1="0" y1="775" x2="680" y2="775" stroke="#A0998A" strokeWidth="2.5" />

      {CARICO_TRENO_HOTSPOTS.map((spot) => {
        const status = getSubStatus(
          props.area.key,
          spot.key,
          props.area.components.find((item) => item.key === spot.key)?.base ?? props.area.base,
          props.snapshot,
        );
        const active = props.currentSub === spot.key;
        const cx = spot.dotX ?? (spot.x + spot.width / 2);
        const cy = spot.dotY ?? (spot.y + spot.height / 2);
        const lx = spot.labelX as number;
        const ly = spot.labelY as number;
        return (
          <g
            key={spot.key}
            className={`eur-hotspot ${active ? "active" : ""}`}
            onClick={() => props.onSelectSub(spot.key)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                props.onSelectSub(spot.key);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <line x1={cx} y1={cy} x2={lx} y2={ly} stroke={STATUS_COLORS[status]} strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
            <circle cx={cx} cy={cy} r="7" fill={STATUS_COLORS[status]} stroke={active ? "#0f6fff" : "white"} strokeWidth={active ? "3" : "1.5"} />
            <circle cx={cx} cy={cy} r="18" fill="transparent" />
            <text x={lx} y={ly - 6} className="eur-hotspot-label" fontSize="12" fill="var(--color-text-primary)" fontWeight={active ? "600" : "400"}>
              {spot.label}
            </text>
            <text x={lx} y={ly + 8} className="eur-hotspot-status" fontSize="11" fill={STATUS_COLORS[status]}>
              {STATUS_LABELS[status]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function statusLegendItems() {
  return [
    { label: "Manutenzione da fare", color: STATUS_COLORS.maint },
    { label: "Problema segnalato", color: STATUS_COLORS.issue },
    { label: "Da controllare", color: STATUS_COLORS.check },
    { label: "Fatto di recente", color: STATUS_COLORS.done },
    { label: "OK", color: STATUS_COLORS.ok },
    { label: "Osservazione", color: STATUS_COLORS.obs },
  ];
}

function componentBase(area: EuromeccAreaStatic, subKey: string) {
  return area.components.find((item) => item.key === subKey)?.base ?? area.base;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.readAsDataURL(file);
  });
}


async function buildComponentDict(): Promise<string> {
  const staticDict = Object.values(EUROMECC_AREAS).map((area) => ({
    areaKey: area.key,
    areaLabel: area.title,
    components: area.components.map((c) => ({ subKey: c.key, subLabel: c.name })),
  }));

  const extraSnap = await getDocs(collection(db, "euromecc_extra_components"));
  const extraByArea: Record<string, { subKey: string; subLabel: string }[]> = {};
  extraSnap.docs.forEach((docSnap) => {
    const d = docSnap.data() as EuromeccExtraComponent;
    if (!extraByArea[d.areaKey]) extraByArea[d.areaKey] = [];
    extraByArea[d.areaKey].push({ subKey: d.subKey, subLabel: d.name });
  });

  const dict = staticDict.map((area) => ({
    ...area,
    components: [...area.components, ...(extraByArea[area.areaKey] ?? [])],
  }));

  return dict
    .map(
      (a) =>
        `${a.areaKey} (${a.areaLabel}): ${a.components.map((c) => `${c.subKey}=${c.subLabel}`).join(", ")}`,
    )
    .join("\n");
}

// eslint-disable-next-line react-refresh/only-export-components
export async function callPdfAiEnhance(
  payload: { inputText?: string; imageBase64?: string }
): Promise<string> {
  const isLocal =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const url = isLocal
    ? "http://127.0.0.1:4310/internal-ai-backend/euromecc/pdf-analyze"
    : "/api/pdf-ai-enhance";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Errore API: ${res.status}`);
  }

  const json = await res.json();

  if (isLocal) {
    if (!json.ok) throw new Error(json.message ?? "Errore analisi");
    return json.data?.result ?? "";
  } else {
    if (!json.ok) throw new Error(json.error ?? "Errore analisi");
    return json.result ?? "";
  }
}

const ANALYZING_MESSAGES = [
  "Lettura documento...",
  "Estrazione lavori eseguiti...",
  "Classificazione per componente...",
  "Identificazione interventi futuri...",
] as const;

function RelazioniUpload(props: {
  state: RelazioniTabState;
  onFileSelect: (file: File) => void;
  onDocumentoTipoChange: (tipo: "relazione" | "ricambi") => void;
  onAnalyze: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) props.onFileSelect(file);
  }

  return (
    <div className="eur-relazioni-upload">
      <div className="eur-relazioni-tipo-selector">
        <label>
          <input
            type="radio"
            name="documentoTipo"
            value="relazione"
            checked={props.state.documentoTipo === "relazione"}
            onChange={() => props.onDocumentoTipoChange("relazione")}
          />
          {" "}Relazione di manutenzione
        </label>
        <label>
          <input
            type="radio"
            name="documentoTipo"
            value="ricambi"
            checked={props.state.documentoTipo === "ricambi"}
            onChange={() => props.onDocumentoTipoChange("ricambi")}
          />
          {" "}Lista ricambi
        </label>
      </div>
      <div
        className={`eur-relazioni-dropzone${dragOver ? " drag-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) props.onFileSelect(f);
          }}
        />
        {props.state.file ? (
          <div className="eur-relazioni-file-preview">
            {props.state.fileType === "image" && props.state.filePreviewUrl ? (
              <img src={props.state.filePreviewUrl} alt="Anteprima" />
            ) : (
              <span className="eur-relazioni-file-icon">&#128196;</span>
            )}
            <span className="eur-relazioni-file-name">{props.state.file.name}</span>
          </div>
        ) : (
          <div className="eur-relazioni-dropzone-empty">
            <span>Trascina qui un PDF o un&apos;immagine</span>
            <span>oppure clicca per selezionare</span>
            <small>PDF, JPG, PNG</small>
          </div>
        )}
      </div>
      {props.state.error ? <p className="eur-error">{props.state.error}</p> : null}
      <div className="eur-relazioni-upload-actions">
        <button
          type="button"
          disabled={!props.state.file}
          onClick={props.onAnalyze}
          className="eur-btn-primary"
        >
          Analizza
        </button>
      </div>
    </div>
  );
}

function RelazioniAnalyzing() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % ANALYZING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="eur-relazioni-analyzing">
      <div className="eur-relazioni-spinner" />
      <p>{ANALYZING_MESSAGES[msgIndex]}</p>
    </div>
  );
}

function RelazioniPdfViewer(props: { file: File }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(props.file);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [props.file]);

  if (!objectUrl) return null;

  return (
    <iframe
      src={objectUrl}
      title="PDF originale"
      style={{ display: "block", width: "100%", minHeight: "80vh", border: "none" }}
    />
  );
}

function RelazioniDocPreview(props: { state: RelazioniTabState }) {
  if (props.state.fileType === "image" && props.state.filePreviewUrl) {
    return (
      <div className="eur-relazioni-col-left">
        <img
          src={props.state.filePreviewUrl}
          alt="Documento originale"
          style={{ width: "100%", objectFit: "contain" }}
        />
      </div>
    );
  }
  if (props.state.fileType === "pdf" && props.state.file) {
    return (
      <div className="eur-relazioni-col-left">
        <RelazioniPdfViewer file={props.state.file} />
      </div>
    );
  }
  return (
    <div className="eur-relazioni-col-left">
      <p>Nessun documento disponibile.</p>
    </div>
  );
}

function RelazioniSectionMatched(props: {
  items: RelazioneItemMatched[];
  onToggle: (index: number) => void;
  onUpdate: (index: number, patch: Partial<RelazioneItemMatched>) => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);

  if (props.items.length === 0) return null;

  const byArea: Record<string, { index: number; item: RelazioneItemMatched }[]> = {};
  props.items.forEach((item, index) => {
    if (!byArea[item.areaKey]) byArea[item.areaKey] = [];
    byArea[item.areaKey].push({ index, item });
  });

  return (
    <div className="eur-relazioni-section">
      <h4 className="eur-relazioni-section-title">
        &#9989; Lavori registrabili ({props.items.filter((i) => i.selected).length}/
        {props.items.length})
      </h4>
      {Object.entries(byArea).map(([areaKey, entries]) => (
        <div key={areaKey} className="eur-relazioni-area-group">
          <span className="eur-eyebrow">{entries[0]?.item.areaLabel ?? areaKey}</span>
          {entries.map(({ index, item }) => (
            <div
              key={index}
              className={`eur-relazioni-item eur-relazioni-item--matched${item.selected ? "" : " eur-relazioni-item--ignored"}`}
            >
              <div className="eur-relazioni-item-head">
                <label className="eur-checkbox">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => props.onToggle(index)}
                  />
                  <span>
                    {item.subLabel} — {item.tipoIntervento}
                  </span>
                </label>
                <button
                  type="button"
                  className="eur-relazioni-edit-btn"
                  onClick={() => setEditing(editing === index ? null : index)}
                >
                  &#9998;
                </button>
              </div>
              <div className="eur-relazioni-item-meta">
                <span>{item.doneDate}</span>
                <span>{item.by}</span>
                {item.note ? <span>{item.note}</span> : null}
              </div>
              {editing === index ? (
                <div className="eur-relazioni-item-form">
                  <label>
                    Area
                    <select
                      value={item.areaKey}
                      onChange={(e) =>
                        props.onUpdate(index, {
                          areaKey: e.target.value,
                          areaLabel: EUROMECC_AREAS[e.target.value]?.title ?? e.target.value,
                        })
                      }
                    >
                      {EUROMECC_AREA_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {EUROMECC_AREAS[k]?.title ?? k}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Componente
                    <select
                      value={item.subKey}
                      onChange={(e) =>
                        props.onUpdate(index, {
                          subKey: e.target.value,
                          subLabel:
                            EUROMECC_AREAS[item.areaKey]?.components.find(
                              (c) => c.key === e.target.value,
                            )?.name ?? e.target.value,
                        })
                      }
                    >
                      {(EUROMECC_AREAS[item.areaKey]?.components ?? []).map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Tipo intervento
                    <input
                      type="text"
                      value={item.tipoIntervento}
                      onChange={(e) => props.onUpdate(index, { tipoIntervento: e.target.value })}
                    />
                  </label>
                  <label>
                    Note
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) => props.onUpdate(index, { note: e.target.value })}
                    />
                  </label>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function RelazioniSectionPartial(props: {
  items: RelazioneItemPartial[];
  onUpdate: (index: number, patch: Partial<RelazioneItemPartial>) => void;
}) {
  if (props.items.length === 0) return null;

  return (
    <div className="eur-relazioni-section">
      <h4 className="eur-relazioni-section-title">
        &#9888;&#65039; Non riconosciuti ({props.items.filter((i) => !i.ignored).length}/
        {props.items.length})
      </h4>
      {props.items.map((item, index) => (
        <div
          key={index}
          className={`eur-relazioni-item eur-relazioni-item--partial${item.ignored ? " eur-relazioni-item--ignored" : ""}`}
        >
          <p className="eur-relazioni-raw-text">{item.rawText}</p>
          {!item.ignored ? (
            <div className="eur-relazioni-item-form">
              <label>
                Area
                <select
                  value={item.editAreaKey}
                  onChange={(e) =>
                    props.onUpdate(index, { editAreaKey: e.target.value, editSubKey: "" })
                  }
                >
                  {EUROMECC_AREA_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {EUROMECC_AREAS[k]?.title ?? k}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Componente
                <select
                  value={item.editSubKey}
                  onChange={(e) => props.onUpdate(index, { editSubKey: e.target.value })}
                >
                  <option value="">-- seleziona --</option>
                  {(EUROMECC_AREAS[item.editAreaKey]?.components ?? []).map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.name}
                    </option>
                  ))}
                  <option value="NEW">&#43; Aggiungi nuovo componente</option>
                </select>
              </label>
              {item.editSubKey === "NEW" ? (
                <>
                  <label>
                    Nome componente
                    <input
                      type="text"
                      value={item.editName}
                      placeholder="es. Valvola bypass"
                      onChange={(e) => props.onUpdate(index, { editName: e.target.value })}
                    />
                  </label>
                  <label>
                    Codice tecnico
                    <input
                      type="text"
                      value={item.editCode}
                      placeholder="es. VLV-BP-01"
                      onChange={(e) => props.onUpdate(index, { editCode: e.target.value })}
                    />
                  </label>
                </>
              ) : null}
              <label>
                Tipo intervento
                <input
                  type="text"
                  value={item.editTipoIntervento}
                  onChange={(e) => props.onUpdate(index, { editTipoIntervento: e.target.value })}
                />
              </label>
              <label>
                Data intervento
                <input
                  type="date"
                  value={item.editDoneDate}
                  onChange={(e) => props.onUpdate(index, { editDoneDate: e.target.value })}
                />
              </label>
              <label>
                Tecnico
                <input
                  type="text"
                  value={item.editBy}
                  onChange={(e) => props.onUpdate(index, { editBy: e.target.value })}
                />
              </label>
              <label>
                Note
                <input
                  type="text"
                  value={item.editNote}
                  onChange={(e) => props.onUpdate(index, { editNote: e.target.value })}
                />
              </label>
            </div>
          ) : null}
          <div className="eur-relazioni-item-actions">
            {item.ignored ? (
              <button type="button" onClick={() => props.onUpdate(index, { ignored: false })}>
                Ripristina
              </button>
            ) : (
              <button type="button" onClick={() => props.onUpdate(index, { ignored: true })}>
                Ignora
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RelazioniSectionPending(props: {
  items: RelazioneItemPending[];
  onUpdate: (index: number, patch: Partial<RelazioneItemPending>) => void;
}) {
  if (props.items.length === 0) return null;

  return (
    <div className="eur-relazioni-section">
      <h4 className="eur-relazioni-section-title">
        &#128203; Prossimi interventi consigliati (
        {props.items.filter((i) => i.selected && !i.ignored).length}/{props.items.length})
      </h4>
      {props.items.map((item, index) => (
        <div
          key={index}
          className={`eur-relazioni-item eur-relazioni-item--pending${item.ignored ? " eur-relazioni-item--ignored" : ""}`}
        >
          <p className="eur-relazioni-raw-text">{item.rawText}</p>
          {!item.ignored ? (
            <div className="eur-relazioni-item-form">
              <label>
                Area
                <select
                  value={item.editAreaKey}
                  onChange={(e) =>
                    props.onUpdate(index, { editAreaKey: e.target.value, editSubKey: "" })
                  }
                >
                  {EUROMECC_AREA_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {EUROMECC_AREAS[k]?.title ?? k}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Componente
                <select
                  value={item.editSubKey}
                  onChange={(e) => props.onUpdate(index, { editSubKey: e.target.value })}
                >
                  <option value="">-- seleziona --</option>
                  {(EUROMECC_AREAS[item.editAreaKey]?.components ?? []).map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Descrizione
                <input
                  type="text"
                  value={item.editTitle}
                  onChange={(e) => props.onUpdate(index, { editTitle: e.target.value })}
                />
              </label>
              <label>
                Priorità
                <select
                  value={item.editPriority}
                  onChange={(e) =>
                    props.onUpdate(index, {
                      editPriority: e.target.value as "alta" | "media" | "bassa",
                    })
                  }
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="bassa">Bassa</option>
                </select>
              </label>
              <label>
                Data scadenza
                <input
                  type="date"
                  value={item.editDueDate ?? ""}
                  onChange={(e) =>
                    props.onUpdate(index, { editDueDate: e.target.value || null })
                  }
                />
              </label>
              <label>
                Note
                <input
                  type="text"
                  value={item.editNote}
                  onChange={(e) => props.onUpdate(index, { editNote: e.target.value })}
                />
              </label>
            </div>
          ) : null}
          <div className="eur-relazioni-item-actions">
            <label className="eur-checkbox">
              <input
                type="checkbox"
                checked={item.selected}
                onChange={() => props.onUpdate(index, { selected: !item.selected })}
              />
              <span>Includi</span>
            </label>
            {item.ignored ? (
              <button type="button" onClick={() => props.onUpdate(index, { ignored: false })}>
                Ripristina
              </button>
            ) : (
              <button type="button" onClick={() => props.onUpdate(index, { ignored: true })}>
                Ignora
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RelazioniActionBar(props: {
  noteGenerali: string;
  saving: boolean;
  onNoteChange: (v: string) => void;
  onSaveBozza: () => void;
  onConferma: () => void;
}) {
  return (
    <div className="eur-relazioni-action-bar">
      <label>
        Note generali relazione
        <textarea
          value={props.noteGenerali}
          onChange={(e) => props.onNoteChange(e.target.value)}
          rows={3}
          placeholder="Note libere sull'importazione..."
        />
      </label>
      <div className="eur-relazioni-action-bar-buttons">
        <button type="button" onClick={props.onSaveBozza} disabled={props.saving}>
          Salva bozza
        </button>
        <button
          type="button"
          className="eur-btn-primary"
          onClick={props.onConferma}
          disabled={props.saving}
        >
          {props.saving ? "Registrazione..." : "&#10003; Conferma tutto e registra"}
        </button>
      </div>
    </div>
  );
}

function RelazioniExtracted(props: {
  payload: RelazioneAiPayload;
  saving: boolean;
  noteGenerali: string;
  onToggleMatched: (i: number) => void;
  onUpdateMatched: (i: number, patch: Partial<RelazioneItemMatched>) => void;
  onUpdatePartial: (i: number, patch: Partial<RelazioneItemPartial>) => void;
  onUpdatePending: (i: number, patch: Partial<RelazioneItemPending>) => void;
  onNoteChange: (v: string) => void;
  onSaveBozza: () => void;
  onConferma: () => void;
}) {
  return (
    <div className="eur-relazioni-col-right">
      <div className="eur-relazioni-meta">
        <span>
          Data intervento:{" "}
          <strong>{props.payload.dataIntervento || "—"}</strong>
        </span>
        <span>
          Tecnici: <strong>{props.payload.tecnici.join(", ") || "—"}</strong>
        </span>
      </div>
      <RelazioniSectionMatched
        items={props.payload.matched}
        onToggle={props.onToggleMatched}
        onUpdate={props.onUpdateMatched}
      />
      <RelazioniSectionPartial
        items={props.payload.partial}
        onUpdate={props.onUpdatePartial}
      />
      <RelazioniSectionPending
        items={props.payload.pending}
        onUpdate={props.onUpdatePending}
      />
      <RelazioniActionBar
        noteGenerali={props.noteGenerali}
        saving={props.saving}
        onNoteChange={props.onNoteChange}
        onSaveBozza={props.onSaveBozza}
        onConferma={props.onConferma}
      />
    </div>
  );
}

function RelazioniReview(props: {
  state: RelazioniTabState;
  saving: boolean;
  onToggleMatched: (i: number) => void;
  onUpdateMatched: (i: number, patch: Partial<RelazioneItemMatched>) => void;
  onUpdatePartial: (i: number, patch: Partial<RelazioneItemPartial>) => void;
  onUpdatePending: (i: number, patch: Partial<RelazioneItemPending>) => void;
  onNoteChange: (v: string) => void;
  onSaveBozza: () => void;
  onConferma: () => void;
}) {
  if (!props.state.payload) return null;

  return (
    <div className="eur-relazioni-review">
      <RelazioniDocPreview state={props.state} />
      <RelazioniExtracted
        payload={props.state.payload}
        saving={props.saving}
        noteGenerali={props.state.noteGenerali}
        onToggleMatched={props.onToggleMatched}
        onUpdateMatched={props.onUpdateMatched}
        onUpdatePartial={props.onUpdatePartial}
        onUpdatePending={props.onUpdatePending}
        onNoteChange={props.onNoteChange}
        onSaveBozza={props.onSaveBozza}
        onConferma={props.onConferma}
      />
    </div>
  );
}

function RelazioneStoricoItem(props: { relazione: EuromeccRelazioneDoc }) {
  const r = props.relazione;
  const isRelazione = r.doneCount > 0 || r.pendingCount > 0;
  const isRicambi = !!r.ordineId;
  const hasFileImported = !!(r.fileStoragePath || r.fileName);
  return (
    <article className="eur-relazioni-storico-item">
      <div className="eur-relazioni-storico-item-main">
        <span className="eur-relazioni-storico-date">{r.dataIntervento}</span>
        <span className="eur-relazioni-storico-tecnici">{r.tecnici.join(", ")}</span>
        <span className="eur-relazioni-storico-counts">
          {r.doneCount} lavori &middot; {r.pendingCount} interventi futuri
        </span>
        {isRelazione ? (
          <span className="eur-mini-badge eur-mini-badge--info">Relazione</span>
        ) : isRicambi ? (
          <span className="eur-mini-badge eur-mini-badge--ok">Lista ricambi</span>
        ) : (
          <span className="eur-mini-badge eur-mini-badge--media">Bozza</span>
        )}
        {r.ordineId ? (
          <span className="eur-mini-badge eur-mini-badge--ok">
            Ordine creato &middot; {r.ordineMateriali} materiali
          </span>
        ) : null}
      </div>
      <div className="eur-relazioni-storico-item-actions">
        {r.fileUrl ? (
          <a
            href={r.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="eur-btn eur-btn--ghost eur-btn--sm"
          >
            Apri documento
          </a>
        ) : hasFileImported ? (
          <button
            className="eur-btn eur-btn--ghost eur-btn--sm"
            disabled
            title="Documento non disponibile"
          >
            Apri documento
          </button>
        ) : null}
      </div>
    </article>
  );
}

function RelazioniStorico(props: { relazioni: EuromeccRelazioneDoc[] }) {
  if (props.relazioni.length === 0) return null;
  const relazioni = props.relazioni.filter((r) => r.doneCount > 0 || r.pendingCount > 0);
  const ricambi = props.relazioni.filter((r) => !!r.ordineId);
  return (
    <>
      {relazioni.length > 0 && (
        <section className="eur-relazioni-storico">
          <div className="eur-section-head">
            <div>
              <h3>Relazioni di manutenzione</h3>
            </div>
          </div>
          <div className="eur-relazioni-storico-list">
            {relazioni.map((r) => (
              <RelazioneStoricoItem key={r.id} relazione={r} />
            ))}
          </div>
        </section>
      )}
      {ricambi.length > 0 && (
        <section className="eur-relazioni-storico">
          <div className="eur-section-head">
            <div>
              <h3>Liste ricambi</h3>
            </div>
          </div>
          <div className="eur-relazioni-storico-list">
            {ricambi.map((r) => (
              <RelazioneStoricoItem key={r.id} relazione={r} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function RicambiReviewUI(props: {
  payload: RicambiAiPayload;
  fornitore: string;
  dataOrdine: string;
  saving: boolean;
  onToggleItem: (i: number) => void;
  onUpdateItem: (i: number, patch: Partial<RicambiAiItem>) => void;
  onFornitorChange: (v: string) => void;
  onDataOrdineChange: (v: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onCreaOrdine: () => void;
}) {
  const { payload } = props;
  return (
    <div className="eur-ricambi-review">
      <div className="eur-section-head">
        <div>
          <h3>Lista ricambi — {formatDateUI(payload.dataDocumento)}</h3>
          <p>Azienda: {payload.azienda} &middot; Fornitore ordine: {props.fornitore}</p>
        </div>
      </div>
      <div className="eur-ricambi-items">
        {payload.items.map((item, i) => (
          <div
            key={i}
            className={`eur-ricambi-item${item.selected ? "" : " eur-ricambi-item--deselected"}`}
          >
            <input
              type="checkbox"
              checked={item.selected}
              onChange={() => props.onToggleItem(i)}
            />
            <input
              type="text"
              value={item.descrizione}
              className="eur-ricambi-desc"
              onChange={(e) => props.onUpdateItem(i, { descrizione: e.target.value })}
            />
            <input
              type="number"
              value={item.quantita}
              className="eur-ricambi-qty"
              min={1}
              onChange={(e) => props.onUpdateItem(i, { quantita: Number(e.target.value) })}
            />
            <span className="eur-ricambi-unit">{item.unita}</span>
          </div>
        ))}
      </div>
      <div className="eur-ricambi-bulk-actions">
        <button type="button" className="eur-btn-ghost-sm" onClick={props.onDeselectAll}>
          Deseleziona tutto
        </button>
        <button type="button" className="eur-btn-ghost-sm" onClick={props.onSelectAll}>
          Seleziona tutto
        </button>
      </div>
      <div className="eur-ricambi-order-fields">
        <label>
          Fornitore
          <input
            type="text"
            value={props.fornitore}
            onChange={(e) => props.onFornitorChange(e.target.value)}
          />
        </label>
        <label>
          Data ordine
          <input
            type="date"
            value={props.dataOrdine}
            onChange={(e) => props.onDataOrdineChange(e.target.value)}
          />
        </label>
      </div>
      <div className="eur-ricambi-actions">
        <button
          type="button"
          className="eur-btn-primary"
          disabled={props.saving || payload.items.filter((i) => i.selected).length === 0}
          onClick={props.onCreaOrdine}
        >
          {props.saving ? "Salvataggio..." : "Crea ordine in Materiali da ordinare"}
        </button>
      </div>
    </div>
  );
}

function RelazioniTab() {
  const [state, setState] = useState<RelazioniTabState>({
    phase: "idle",
    file: null,
    filePreviewUrl: null,
    fileType: null,
    payload: null,
    noteGenerali: "",
    bozzaId: null,
    error: null,
    documentoTipo: "relazione",
    ricambiPayload: null,
  });
  const [saving, setSaving] = useState(false);
  const [storico, setStorico] = useState<EuromeccRelazioneDoc[]>([]);
  const [ricambiFornitore, setRicambiFornitore] = useState("Euromecc");
  const [ricambiDataOrdine, setRicambiDataOrdine] = useState("");

  useEffect(() => {
    getDocs(collection(db, "euromecc_relazioni"))
      .then((snap) => {
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<EuromeccRelazioneDoc, "id">),
        }));
        docs.sort((a, b) => b.dataIntervento.localeCompare(a.dataIntervento));
        setStorico(docs);
      })
      .catch(() => undefined);
  }, []);

  function handleFileSelect(file: File) {
    const isImage = file.type.startsWith("image/");
    const fileType: "pdf" | "image" = isImage ? "image" : "pdf";
    const filePreviewUrl = isImage ? URL.createObjectURL(file) : null;
    setState((prev) => ({ ...prev, file, fileType, filePreviewUrl, error: null }));
  }

  async function handleAnalyze() {
    if (!state.file || !state.fileType) return;
    setState((prev) => ({ ...prev, phase: "analyzing", error: null }));

    if (state.documentoTipo === "ricambi") {
      try {
        const prompt = `Sei un assistente tecnico specializzato in impianti industriali.
Analizza il seguente elenco materiali/ricambi e restituisci SOLO un oggetto JSON,
senza testo aggiuntivo, senza markdown, senza backtick.

STRUTTURA JSON RICHIESTA:
{
  "dataDocumento": "yyyy-MM-dd",
  "azienda": "nome azienda destinataria",
  "items": [
    {
      "descrizione": "descrizione materiale",
      "quantita": numero,
      "unita": "pz|m|kg|lt|altro",
      "codiceArticolo": "codice se presente altrimenti stringa vuota",
      "note": "note aggiuntive se presenti altrimenti stringa vuota"
    }
  ]
}

REGOLE:
- Estrai TUTTI i materiali elencati, uno per uno
- Se la quantità non è specificata usa 1
- Se l'unità non è specificata usa "pz"
- dataDocumento deve essere la data del documento
- azienda deve essere il nome dell'azienda destinataria (non Euromecc)
- Non inventare materiali non presenti nel documento`;

        let apiPayload: { inputText?: string; imageBase64?: string };
        if (state.fileType === "image") {
          const b64 = await fileToBase64(state.file);
          apiPayload = { inputText: prompt, imageBase64: b64 };
        } else {
          const pdfBase64 = await fileToBase64(state.file);
          apiPayload = { inputText: prompt, imageBase64: pdfBase64 };
        }

        const rawResult = await callPdfAiEnhance(apiPayload);
        const cleaned = rawResult
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        const parsed = JSON.parse(cleaned) as {
          dataDocumento: string;
          azienda: string;
          items: Array<{
            descrizione: string;
            quantita: number;
            unita: string;
            codiceArticolo: string;
            note: string;
          }>;
        };

        const ricambiPayload: RicambiAiPayload = {
          dataDocumento: parsed.dataDocumento ?? new Date().toISOString().slice(0, 10),
          azienda: parsed.azienda ?? "",
          items: (parsed.items ?? []).map((item) => ({
            descrizione: item.descrizione ?? "",
            quantita: item.quantita ?? 1,
            unita: item.unita ?? "pz",
            codiceArticolo: item.codiceArticolo ?? "",
            note: item.note ?? "",
            selected: true,
          })),
        };

        const docDate = ricambiPayload.dataDocumento;
        setRicambiDataOrdine(docDate);
        setState((prev) => ({ ...prev, phase: "review", ricambiPayload }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          phase: "idle",
          error: err instanceof Error ? err.message : "Errore durante l'analisi",
        }));
      }
      return;
    }

    try {
      const today = new Date().toISOString().slice(0, 10);
      const dictText = await buildComponentDict();

      const prompt = `Sei un assistente tecnico specializzato in impianti industriali di stoccaggio cemento.
Analizza la seguente relazione di manutenzione e restituisci SOLO un oggetto JSON,
senza testo aggiuntivo, senza markdown, senza backtick.

DIZIONARIO COMPONENTI DISPONIBILI:
${dictText}

STRUTTURA JSON RICHIESTA:
{
  "dataIntervento": "yyyy-MM-dd",
  "tecnici": ["Nome Cognome"],
  "matched": [
    {
      "areaKey": "...",
      "subKey": "...",
      "title": "descrizione lavoro",
      "tipoIntervento": "Sostituzione|Verifica|Installazione|Pulizia|Controllo|Altro",
      "doneDate": "yyyy-MM-dd",
      "by": "Nome Cognome",
      "note": "",
      "nextDate": null
    }
  ],
  "partial": [
    {
      "rawText": "testo originale non mappato",
      "suggestedAreaKey": "areaKey o null",
      "suggestedSubKey": "subKey o null"
    }
  ],
  "pending": [
    {
      "rawText": "testo intervento consigliato",
      "suggestedAreaKey": "areaKey o null",
      "suggestedSubKey": "subKey o null",
      "suggestedPriority": "alta|media|bassa"
    }
  ]
}

REGOLE:
- Usa SOLO le areaKey e subKey presenti nel dizionario componenti
- Se un componente non è nel dizionario, mettilo in "partial" non in "matched"
- La sezione "prossimi interventi consigliati" della relazione va in "pending"
- doneDate deve essere la data dell'intervento indicata nel documento
- by deve essere il nome del tecnico che ha eseguito quel lavoro specifico
- Se i tecnici sono più di uno e non è specificato chi ha fatto cosa, usa il primo tecnico per tutti i lavori
- Non inventare componenti non presenti nel dizionario`;

      let apiPayload: { inputText?: string; imageBase64?: string };

      if (state.fileType === "image") {
        const b64 = await fileToBase64(state.file);
        apiPayload = { inputText: prompt, imageBase64: b64 };
      } else {
        const pdfBase64 = await fileToBase64(state.file);
        apiPayload = { inputText: prompt, imageBase64: pdfBase64 };
      }

      const rawResult = await callPdfAiEnhance(apiPayload);

      const cleaned = rawResult
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleaned) as {
        dataIntervento: string;
        tecnici: string[];
        matched: Array<{
          areaKey: string;
          subKey: string;
          title: string;
          tipoIntervento: string;
          doneDate: string;
          by: string;
          note: string;
          nextDate: string | null;
        }>;
        partial: Array<{
          rawText: string;
          suggestedAreaKey: string | null;
          suggestedSubKey: string | null;
        }>;
        pending: Array<{
          rawText: string;
          suggestedAreaKey: string | null;
          suggestedSubKey: string | null;
          suggestedPriority?: string;
        }>;
      };

      const matchedItems: RelazioneItemMatched[] = (parsed.matched ?? []).map((m) => ({
        kind: "matched",
        areaKey: m.areaKey,
        subKey: m.subKey,
        areaLabel: EUROMECC_AREAS[m.areaKey]?.title ?? m.areaKey,
        subLabel:
          EUROMECC_AREAS[m.areaKey]?.components.find((c) => c.key === m.subKey)?.name ??
          m.subKey,
        title: m.title,
        tipoIntervento: m.tipoIntervento,
        doneDate: m.doneDate,
        by: m.by,
        note: m.note ?? "",
        nextDate: m.nextDate ?? null,
        selected: true,
      }));

      const partialItems: RelazioneItemPartial[] = (parsed.partial ?? []).map((p) => ({
        kind: "partial",
        rawText: p.rawText,
        suggestedAreaKey: p.suggestedAreaKey,
        suggestedSubKey: p.suggestedSubKey,
        editAreaKey: p.suggestedAreaKey ?? (EUROMECC_AREA_KEYS[0] ?? ""),
        editSubKey: p.suggestedSubKey ?? "",
        editName: "",
        editCode: "",
        editTitle: p.rawText,
        editTipoIntervento: "",
        editDoneDate: today,
        editBy: parsed.tecnici[0] ?? "",
        editNote: "",
        ignored: false,
      }));

      const pendingItems: RelazioneItemPending[] = (parsed.pending ?? []).map((p) => ({
        kind: "pending",
        rawText: p.rawText,
        suggestedAreaKey: p.suggestedAreaKey,
        suggestedSubKey: p.suggestedSubKey,
        editAreaKey: p.suggestedAreaKey ?? (EUROMECC_AREA_KEYS[0] ?? ""),
        editSubKey: p.suggestedSubKey ?? "",
        editTitle: p.rawText,
        editPriority: (["alta", "media", "bassa"].includes(p.suggestedPriority ?? "")
          ? p.suggestedPriority
          : "media") as "alta" | "media" | "bassa",
        editDueDate: null,
        editNote: "",
        selected: true,
        ignored: false,
      }));

      const payload: RelazioneAiPayload = {
        dataIntervento: parsed.dataIntervento ?? today,
        tecnici: parsed.tecnici ?? [],
        matched: matchedItems,
        partial: partialItems,
        pending: pendingItems,
      };

      setState((prev) => ({ ...prev, phase: "review", payload }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        phase: "idle",
        error: err instanceof Error ? err.message : "Errore durante l'analisi",
      }));
    }
  }

  function handleToggleMatched(i: number) {
    setState((prev) => {
      if (!prev.payload) return prev;
      const matched = prev.payload.matched.map((item, idx) =>
        idx === i ? { ...item, selected: !item.selected } : item,
      );
      return { ...prev, payload: { ...prev.payload, matched } };
    });
  }

  function handleUpdateMatched(i: number, patch: Partial<RelazioneItemMatched>) {
    setState((prev) => {
      if (!prev.payload) return prev;
      const matched = prev.payload.matched.map((item, idx) =>
        idx === i ? { ...item, ...patch } : item,
      );
      return { ...prev, payload: { ...prev.payload, matched } };
    });
  }

  function handleUpdatePartial(i: number, patch: Partial<RelazioneItemPartial>) {
    setState((prev) => {
      if (!prev.payload) return prev;
      const partial = prev.payload.partial.map((item, idx) =>
        idx === i ? { ...item, ...patch } : item,
      );
      return { ...prev, payload: { ...prev.payload, partial } };
    });
  }

  function handleUpdatePending(i: number, patch: Partial<RelazioneItemPending>) {
    setState((prev) => {
      if (!prev.payload) return prev;
      const pending = prev.payload.pending.map((item, idx) =>
        idx === i ? { ...item, ...patch } : item,
      );
      return { ...prev, payload: { ...prev.payload, pending } };
    });
  }

  async function handleSaveBozza() {
    if (!state.payload || !state.file || !state.fileType) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "euromecc_relazioni"), {
        fileName: state.file.name,
        fileType: state.fileType,
        dataIntervento: state.payload.dataIntervento,
        tecnici: state.payload.tecnici,
        note: state.noteGenerali,
        statoImportazione: "bozza",
        doneCount: 0,
        pendingCount: 0,
        extraComponentsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleCreaOrdineRicambiAndSave() {
    if (!state.ricambiPayload || !state.file || !state.fileType) return;
    setSaving(true);
    try {
      assertCloneWriteAllowed("storageSync.setItemSync", { key: "@ordini" });
      const ordiniRef = doc(collection(db, "storage"), "@ordini");
      const snap = await getDoc(ordiniRef);
      const existing: Ordine[] = snap.exists()
        ? ((snap.data()?.value as Ordine[]) ?? [])
        : [];

      const selectedItems = state.ricambiPayload.items.filter((i) => i.selected);
      const ordineId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      const effectiveDataOrdine =
        ricambiDataOrdine || new Date().toISOString().slice(0, 10);

      const nuovoOrdine = {
        id: ordineId,
        idFornitore: "euromecc",
        nomeFornitore: ricambiFornitore,
        dataOrdine: effectiveDataOrdine,
        materiali: selectedItems.map((item) => ({
          id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
          descrizione: item.codiceArticolo
            ? `${item.descrizione} [${item.codiceArticolo}]`
            : item.descrizione,
          quantita: item.quantita,
          unita: item.unita,
          arrivato: false,
        })),
        arrivato: false,
      };

      await setDoc(ordiniRef, { value: [...existing, nuovoOrdine] }, { merge: true });

      await addDoc(collection(db, "euromecc_relazioni"), {
        fileName: state.file.name,
        fileType: state.fileType,
        dataIntervento: effectiveDataOrdine,
        tecnici: [],
        note: `Lista ricambi — ${state.ricambiPayload.azienda}`,
        statoImportazione: "confermata",
        doneCount: 0,
        pendingCount: 0,
        extraComponentsCount: 0,
        fileUrl: null,
        fileStoragePath: null,
        fileSize: null,
        ordineId,
        ordineMateriali: selectedItems.length,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setState({
        phase: "idle",
        file: null,
        filePreviewUrl: null,
        fileType: null,
        payload: null,
        noteGenerali: "",
        bozzaId: null,
        error: null,
        documentoTipo: "relazione",
        ricambiPayload: null,
      });
      setRicambiFornitore("Euromecc");
      setRicambiDataOrdine("");

      const storicoSnap = await getDocs(collection(db, "euromecc_relazioni"));
      const docs = storicoSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<EuromeccRelazioneDoc, "id">),
      }));
      docs.sort((a, b) => b.dataIntervento.localeCompare(a.dataIntervento));
      setStorico(docs);
    } finally {
      setSaving(false);
    }
  }

  async function handleConferma() {
    if (!state.payload || !state.file || !state.fileType) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const relazioneId = state.bozzaId ?? uuidv4();
      let doneCount = 0;
      let pendingCount = 0;
      let extraComponentsCount = 0;

      for (const item of state.payload.matched.filter((m) => m.selected)) {
        await addEuromeccDoneTask(
          {
            areaKey: item.areaKey,
            subKey: item.subKey,
            title: item.title,
            doneDate: item.doneDate,
            by: item.by,
            note: item.note,
            nextDate: item.nextDate,
            closedPending: false,
          },
          false,
        );
        doneCount++;
      }

      for (const item of state.payload.partial.filter(
        (p) => !p.ignored && p.editSubKey !== "" && p.editAreaKey !== "",
      )) {
        let subKey = item.editSubKey;
        if (item.editSubKey === "NEW") {
          const slug = item.editName
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
          subKey = `${item.editAreaKey}-${slug}`;
          await addDoc(collection(db, "euromecc_extra_components"), {
            areaKey: item.editAreaKey,
            subKey,
            name: item.editName,
            code: item.editCode,
            addedFrom: relazioneId,
            addedAt: today,
            addedBy: item.editBy,
            createdAt: serverTimestamp(),
          });
          extraComponentsCount++;
        }
        await addEuromeccDoneTask(
          {
            areaKey: item.editAreaKey,
            subKey,
            title: item.editTitle,
            doneDate: item.editDoneDate,
            by: item.editBy,
            note: item.editNote,
            nextDate: null,
            closedPending: false,
          },
          false,
        );
        doneCount++;
      }

      for (const item of state.payload.pending.filter(
        (p) => p.selected && !p.ignored && p.editSubKey !== "" && p.editAreaKey !== "",
      )) {
        const dueDate = item.editDueDate ??
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
            .toISOString().slice(0, 10);
        await addEuromeccPendingTask({
          areaKey: item.editAreaKey,
          subKey: item.editSubKey,
          title: item.editTitle,
          priority: item.editPriority,
          dueDate,
          note: item.editNote,
        });
        pendingCount++;
      }

      // Feature A: Upload documento originale su Storage
      let fileUrl: string | null = null;
      let fileStoragePath: string | null = null;
      let fileSize: number | null = null;

      if (state.file) {
        try {
          const uploadRelazioneId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
          const storagePath = `euromecc/relazioni/${uploadRelazioneId}/${Date.now()}_${state.file.name}`;
          assertCloneWriteAllowed("storage.uploadBytes", { path: storagePath });
          const storageRef = ref(storage, storagePath);
          await uploadBytes(storageRef, state.file);
          fileUrl = await getDownloadURL(storageRef);
          fileStoragePath = storagePath;
          fileSize = state.file.size;
        } catch {
          // upload fallisce silenziosamente — la relazione viene salvata comunque
        }
      }

      await addDoc(collection(db, "euromecc_relazioni"), {
        fileName: state.file.name,
        fileType: state.fileType,
        dataIntervento: state.payload.dataIntervento,
        tecnici: state.payload.tecnici,
        note: state.noteGenerali,
        statoImportazione: "confermata",
        doneCount,
        pendingCount,
        extraComponentsCount,
        fileUrl,
        fileStoragePath,
        fileSize,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setState({
        phase: "idle",
        file: null,
        filePreviewUrl: null,
        fileType: null,
        payload: null,
        noteGenerali: "",
        bozzaId: null,
        error: null,
        documentoTipo: "relazione",
        ricambiPayload: null,
      });

      const snap = await getDocs(collection(db, "euromecc_relazioni"));
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<EuromeccRelazioneDoc, "id">),
      }));
      docs.sort((a, b) => b.dataIntervento.localeCompare(a.dataIntervento));
      setStorico(docs);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="eur-segment eur-relazioni-root">
      {state.phase === "idle" || state.phase === "done" ? (
        <>
          <div className="eur-section-head">
            <div>
              <h2>Relazioni di manutenzione</h2>
              <p>
                Importa una relazione PDF o immagine per registrare automaticamente i lavori
                eseguiti.
              </p>
            </div>
          </div>
          <RelazioniUpload
            state={state}
            onFileSelect={handleFileSelect}
            onDocumentoTipoChange={(tipo) =>
              setState((prev) => ({ ...prev, documentoTipo: tipo }))
            }
            onAnalyze={() => void handleAnalyze()}
          />
          <RelazioniStorico relazioni={storico} />
        </>
      ) : state.phase === "analyzing" ? (
        <RelazioniAnalyzing />
      ) : state.phase === "review" || state.phase === "saving" ? (
        state.documentoTipo === "ricambi" && state.ricambiPayload ? (
          <RicambiReviewUI
            payload={state.ricambiPayload}
            fornitore={ricambiFornitore}
            dataOrdine={ricambiDataOrdine}
            saving={saving}
            onToggleItem={(i) =>
              setState((prev) => {
                if (!prev.ricambiPayload) return prev;
                const items = prev.ricambiPayload.items.map((it, idx) =>
                  idx === i ? { ...it, selected: !it.selected } : it,
                );
                return { ...prev, ricambiPayload: { ...prev.ricambiPayload, items } };
              })
            }
            onUpdateItem={(i, patch) =>
              setState((prev) => {
                if (!prev.ricambiPayload) return prev;
                const items = prev.ricambiPayload.items.map((it, idx) =>
                  idx === i ? { ...it, ...patch } : it,
                );
                return { ...prev, ricambiPayload: { ...prev.ricambiPayload, items } };
              })
            }
            onFornitorChange={setRicambiFornitore}
            onDataOrdineChange={setRicambiDataOrdine}
            onSelectAll={() =>
              setState((prev) => {
                if (!prev.ricambiPayload) return prev;
                const items = prev.ricambiPayload.items.map((it) => ({
                  ...it,
                  selected: true,
                }));
                return { ...prev, ricambiPayload: { ...prev.ricambiPayload, items } };
              })
            }
            onDeselectAll={() =>
              setState((prev) => {
                if (!prev.ricambiPayload) return prev;
                const items = prev.ricambiPayload.items.map((it) => ({
                  ...it,
                  selected: false,
                }));
                return { ...prev, ricambiPayload: { ...prev.ricambiPayload, items } };
              })
            }
            onCreaOrdine={() => void handleCreaOrdineRicambiAndSave()}
          />
        ) : (
          <RelazioniReview
            state={state}
            saving={saving}
            onToggleMatched={handleToggleMatched}
            onUpdateMatched={handleUpdateMatched}
            onUpdatePartial={handleUpdatePartial}
            onUpdatePending={handleUpdatePending}
            onNoteChange={(v) => setState((prev) => ({ ...prev, noteGenerali: v }))}
            onSaveBozza={() => void handleSaveBozza()}
            onConferma={() => void handleConferma()}
          />
        )
      ) : null}
    </div>
  );
}

// --- RIEPILOGO TAB ---

async function svgToImageData(svgElement: SVGElement): Promise<string | null> {
  try {
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgElement);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    return await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 1480;
        canvas.height = img.naturalHeight || 860;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("no ctx")); return; }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img load failed")); };
      img.src = url;
    });
  } catch {
    return null;
  }
}

async function generatePdfRiepilogo(
  snapshot: EuromeccSnapshot,
  range: EuromeccRange,
  cards: RiepilogoCardData[],
): Promise<void> {
  const { default: JsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  let y = margin;

  const checkPage = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Pagina 1 — intestazione
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("EUROMECC — RIEPILOGO IMPIANTO", margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const rangeLabel = RANGE_OPTIONS.find((r) => r.value === range)?.label ?? "Tutto";
  doc.text(
    `Periodo: ${rangeLabel} | Generato il: ${formatDateUI(new Date().toISOString().slice(0, 10))}`,
    margin,
    y,
  );
  y += 10;

  // KPI row
  const kpiValues = [
    { label: "Da fare", value: String(cards.reduce((s, c) => s + c.pendingItems.length, 0)) },
    { label: "Problemi", value: String(cards.reduce((s, c) => s + c.openIssues.length, 0)) },
    { label: "Fatte", value: String(cards.reduce((s, c) => s + c.doneItems.length, 0)) },
    { label: "Urgenze", value: String(cards.filter((c) => c.hasUrgency).length) },
  ];
  const kpiW = (pageW - margin * 2) / 4;
  kpiValues.forEach((kpi, i) => {
    const x = margin + i * kpiW;
    doc.setFillColor(245, 245, 245);
    doc.rect(x, y, kpiW - 2, 16, "F");
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(kpi.value, x + kpiW / 2 - 1, y + 9, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(kpi.label, x + kpiW / 2 - 1, y + 14, { align: "center" });
  });
  y += 22;

  // Mappa SVG come immagine
  const mapEl = document.querySelector(".eur-map") as SVGElement | null;
  if (mapEl) {
    try {
      const imgData = await svgToImageData(mapEl);
      if (imgData) {
        const imgW = pageW - margin * 2;
        const imgH = imgW * (860 / 1480);
        checkPage(imgH + 5);
        doc.addImage(imgData, "JPEG", margin, y, imgW, imgH);
        y += imgH + 8;
      }
    } catch {
      y += 2;
    }
  }

  // Legenda colori
  checkPage(10);
  const legendItems = statusLegendItems();
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  let lx = margin;
  for (const item of legendItems) {
    const rgb = item.color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (rgb) {
      doc.setFillColor(parseInt(rgb[1], 16), parseInt(rgb[2], 16), parseInt(rgb[3], 16));
      doc.circle(lx + 2, y + 2, 2, "F");
    }
    doc.text(item.label, lx + 5, y + 3.5);
    lx += 32;
    if (lx > pageW - margin - 20) {
      lx = margin;
      y += 7;
    }
  }
  y += 8;

  // Pagine dettaglio per area
  for (const card of cards) {
    doc.addPage();
    y = margin;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`${card.areaLabel} — ${card.areaCode}`, margin, y);
    y += 7;

    // SVG schema tecnico area
    const svgEl = document.querySelector(
      `[data-area-key="${card.areaKey}"] .eur-silo-diagram`,
    ) as SVGElement | null;
    if (svgEl) {
      try {
        const imgData = await svgToImageData(svgEl);
        if (imgData) {
          const imgW = 80;
          const imgH = imgW * (700 / 680);
          checkPage(imgH + 5);
          doc.addImage(imgData, "JPEG", margin, y, imgW, imgH);
          y += imgH + 5;
        }
      } catch {
        y += 2;
      }
    }

    if (card.pendingItems.length > 0) {
      checkPage(20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Da fare", margin, y);
      y += 4;
      autoTable(doc as Parameters<typeof autoTable>[0], {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Componente", "Lavoro", "Priorità", "Scadenza"]],
        body: card.pendingItems.map((p) => [
          p.subLabel,
          p.title,
          PRIORITY_LABELS[p.priority],
          p.dueDate ? formatDateUI(p.dueDate) : "—",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });
      y = (doc as { lastAutoTable: { finalY: number } } & typeof doc).lastAutoTable.finalY + 6;
    }

    if (card.doneItems.length > 0) {
      checkPage(20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Fatte nel periodo", margin, y);
      y += 4;
      autoTable(doc as Parameters<typeof autoTable>[0], {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Componente", "Lavoro", "Data", "Tecnico"]],
        body: card.doneItems.map((d) => [d.subLabel, d.title, formatDateUI(d.doneDate), d.by]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 197, 94] },
      });
      y = (doc as { lastAutoTable: { finalY: number } } & typeof doc).lastAutoTable.finalY + 6;
    }

    if (card.openIssues.length > 0) {
      checkPage(20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Problemi aperti", margin, y);
      y += 4;
      autoTable(doc as Parameters<typeof autoTable>[0], {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Componente", "Descrizione", "Tipo", "Dal"]],
        body: card.openIssues.map((iss) => [
          iss.subLabel,
          iss.title,
          ISSUE_TYPE_LABELS[iss.type],
          formatDateUI(iss.reportedAt),
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [239, 68, 68] },
      });
      y = (doc as { lastAutoTable: { finalY: number } } & typeof doc).lastAutoTable.finalY + 6;
    }
  }

  // Ultima pagina — urgenze riepilogo
  const urgentCards = cards.filter((c) => c.hasUrgency);
  if (urgentCards.length > 0) {
    doc.addPage();
    y = margin;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("URGENZE RIEPILOGO", margin, y);
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    for (const card of urgentCards) {
      const urgentPending = card.pendingItems.filter((p) => p.priority === "alta");
      const urgentIssues = card.openIssues.filter((i) => i.type !== "osservazione");
      for (const p of urgentPending) {
        checkPage(6);
        doc.text(`[MANUTENZIONE] ${card.areaLabel} / ${p.subLabel}: ${p.title}`, margin, y);
        y += 5;
      }
      for (const iss of urgentIssues) {
        checkPage(6);
        doc.text(`[PROBLEMA] ${card.areaLabel} / ${iss.subLabel}: ${iss.title}`, margin, y);
        y += 5;
      }
    }
    y += 5;
    doc.setFontSize(8);
    doc.text(
      `Firma: _______________________ Data: ${formatDateUI(new Date().toISOString().slice(0, 10))}`,
      margin,
      y,
    );
  }

  void snapshot; // snapshot passato per eventuali estensioni future
  const fileName = `euromecc-riepilogo-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

function buildRiepilogoCards(
  snapshot: EuromeccSnapshot,
  reportPending: EuromeccPendingTask[],
  reportDone: EuromeccDoneTask[],
  reportIssues: EuromeccIssue[],
): RiepilogoCardData[] {
  return EUROMECC_AREA_KEYS.map((areaKey) => {
    const area = EUROMECC_AREAS[areaKey];
    const pendingItems = reportPending.filter((item) => item.areaKey === areaKey);
    const doneItems = reportDone.filter((item) => item.areaKey === areaKey);
    const openIssues = reportIssues.filter((item) => item.areaKey === areaKey);
    const hasUrgency =
      pendingItems.some((item) => item.priority === "alta") ||
      openIssues.some((item) => item.type !== "osservazione");
    const status = getAreaStatus(areaKey, [...area.components], snapshot);
    return {
      areaKey,
      areaLabel: area.title,
      areaCode: area.code,
      areaType: area.type,
      status,
      pendingItems,
      doneItems,
      openIssues,
      hasUrgency,
    };
  }).filter(
    (card) =>
      card.pendingItems.length > 0 || card.doneItems.length > 0 || card.openIssues.length > 0,
  );
}

function RiepilogoMappaImpianto(props: {
  snapshot: EuromeccSnapshot;
  reportPending: EuromeccPendingTask[];
  reportDone: EuromeccDoneTask[];
  reportIssues: EuromeccIssue[];
}) {
  const [selectedAreaKey, setSelectedAreaKey] = useState<string | null>(null);
  const legend = statusLegendItems();

  const selectedArea = selectedAreaKey ? EUROMECC_AREAS[selectedAreaKey] ?? null : null;
  const areaPending = selectedAreaKey ? props.reportPending.filter((p) => p.areaKey === selectedAreaKey) : [];
  const areaDone = selectedAreaKey ? props.reportDone.filter((d) => d.areaKey === selectedAreaKey) : [];
  const areaIssues = selectedAreaKey ? props.reportIssues.filter((i) => i.areaKey === selectedAreaKey) : [];

  return (
    <div className="eur-riepilogo-mappa-wrapper">
      <div className="eur-riepilogo-mappa">
        <MapSvg snapshot={props.snapshot} currentArea={selectedAreaKey ?? ""} onSelectArea={setSelectedAreaKey} />
        <div className="eur-riepilogo-legenda">
          {legend.map((item) => (
            <span key={item.label} className="eur-riepilogo-legenda-item">
              <span className="eur-riepilogo-legenda-dot" style={{ background: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      {selectedArea ? (
        <div className="eur-riepilogo-mappa-detail">
          <div className="eur-riepilogo-mappa-detail-header">
            <span className="eur-th">{selectedArea.title}</span>
            <span className="eur-ts">{selectedArea.code}</span>
            <button onClick={() => setSelectedAreaKey(null)} className="eur-btn-close">×</button>
          </div>
          {areaPending.length > 0 && (
            <div className="eur-riepilogo-mappa-section">
              <p className="eur-ts eur-label-amber">Da fare ({areaPending.length})</p>
              {areaPending.map((p) => (
                <div key={p.id} className="eur-riepilogo-mappa-item">
                  <span className="eur-ts">{p.subLabel} — {p.title}</span>
                  <span className="eur-ts">{PRIORITY_LABELS[p.priority]}</span>
                </div>
              ))}
            </div>
          )}
          {areaDone.length > 0 && (
            <div className="eur-riepilogo-mappa-section">
              <p className="eur-ts eur-label-green">Fatte recenti</p>
              {areaDone.slice(0, 5).map((d) => (
                <div key={d.id} className="eur-riepilogo-mappa-item">
                  <span className="eur-ts">{d.subLabel} — {d.title}</span>
                  <span className="eur-ts">{formatDateUI(d.doneDate)}</span>
                </div>
              ))}
            </div>
          )}
          {areaIssues.length > 0 && (
            <div className="eur-riepilogo-mappa-section">
              <p className="eur-ts eur-label-red">Problemi aperti</p>
              {areaIssues.map((i) => (
                <div key={i.id} className="eur-riepilogo-mappa-item">
                  <span className="eur-ts">{i.subLabel} — {i.title}</span>
                </div>
              ))}
            </div>
          )}
          {areaPending.length === 0 && areaDone.length === 0 && areaIssues.length === 0 && (
            <p className="eur-ts">Nessuna attività registrata per questa area nel periodo selezionato.</p>
          )}
        </div>
      ) : (
        <p className="eur-ts eur-riepilogo-mappa-hint">Clicca un nodo per vedere il dettaglio dell'area.</p>
      )}
    </div>
  );
}

function RiepilogoCaricoDiagram({
  card,
  snapshot,
}: {
  card: RiepilogoCardData;
  snapshot: EuromeccSnapshot;
}) {
  const area = EUROMECC_AREAS[card.areaKey];
  if (!area) return null;

  const activeSubKeys = new Set([
    ...card.pendingItems.map((p) => p.subKey),
    ...card.openIssues.map((i) => i.subKey),
  ]);

  return (
    <div className={`eur-riepilogo-card ${card.hasUrgency ? "eur-riepilogo-card--urgency" : ""}`}>
      <div className="eur-riepilogo-card-header">
        <div>
          <strong>{card.areaLabel}</strong>
          <span className="eur-riepilogo-card-code">{card.areaCode}</span>
        </div>
        <span className={badgeClass(card.status)}>{STATUS_LABELS[card.status]}</span>
      </div>
      <div className="eur-riepilogo-carico-layout" data-area-key={card.areaKey}>
        <div className="eur-riepilogo-carico-svg">
          <div style={{ position: "relative" }}>
            <CaricoDiagram
              area={area}
              snapshot={snapshot}
              currentSub={null}
              onSelectSub={() => undefined}
            />
            <svg
              viewBox="0 0 680 700"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
              aria-hidden="true"
            >
              {CARICO_HOTSPOTS.filter((spot) => activeSubKeys.has(spot.key)).map((spot) => {
                const hasPending = card.pendingItems.some((p) => p.subKey === spot.key);
                const color = hasPending ? STATUS_COLORS.maint : STATUS_COLORS.issue;
                const dotX = spot.dotX ?? spot.x + spot.width / 2;
                const dotY = spot.dotY ?? spot.y + spot.height / 2;
                const endX = 640;
                const endY = dotY;
                return (
                  <g key={spot.key}>
                    <line
                      x1={dotX}
                      y1={dotY}
                      x2={endX}
                      y2={endY}
                      stroke={color}
                      strokeWidth="2.5"
                      strokeDasharray="6 3"
                    />
                    <polygon
                      points={`${endX},${endY} ${endX - 8},${endY - 4} ${endX - 8},${endY + 4}`}
                      fill={color}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
        <div className="eur-riepilogo-carico-list">
          {card.pendingItems.length > 0 && (
            <div className="eur-riepilogo-section">
              <h4>Da fare</h4>
              <ul>
                {card.pendingItems.map((item) => (
                  <li key={item.id}>
                    <span className="eur-riepilogo-pill eur-riepilogo-pill--priority">
                      {PRIORITY_LABELS[item.priority]}
                    </span>
                    {item.subLabel}: {item.title}
                    {item.dueDate ? (
                      <span className="eur-riepilogo-due"> — scad. {formatDateUI(item.dueDate)}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {card.doneItems.length > 0 && (
            <div className="eur-riepilogo-section">
              <h4>Fatte</h4>
              <ul>
                {card.doneItems.map((item) => (
                  <li key={item.id}>
                    {item.subLabel}: {item.title}
                    <span className="eur-riepilogo-due"> — {formatDateUI(item.doneDate)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {card.openIssues.length > 0 && (
            <div className="eur-riepilogo-section">
              <h4>Problemi aperti</h4>
              <ul>
                {card.openIssues.map((item) => (
                  <li key={item.id}>
                    <span className="eur-riepilogo-pill eur-riepilogo-pill--issue">
                      {ISSUE_TYPE_LABELS[item.type]}
                    </span>
                    {item.subLabel}: {item.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RiepilogoAreaCard({ card }: { card: RiepilogoCardData }) {
  return (
    <div className={`eur-riepilogo-card ${card.hasUrgency ? "eur-riepilogo-card--urgency" : ""}`}>
      <div className="eur-riepilogo-card-header">
        <div>
          <strong>{card.areaLabel}</strong>
          <span className="eur-riepilogo-card-code">{card.areaCode}</span>
        </div>
        <span className={badgeClass(card.status)}>{STATUS_LABELS[card.status]}</span>
      </div>
      {card.pendingItems.length > 0 && (
        <div className="eur-riepilogo-section">
          <h4>Da fare</h4>
          <ul>
            {card.pendingItems.map((item) => (
              <li key={item.id}>
                <span className="eur-riepilogo-pill eur-riepilogo-pill--priority">
                  {PRIORITY_LABELS[item.priority]}
                </span>
                {item.subLabel}: {item.title}
                {item.dueDate ? (
                  <span className="eur-riepilogo-due"> — scad. {formatDateUI(item.dueDate)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
      {card.doneItems.length > 0 && (
        <div className="eur-riepilogo-section">
          <h4>Fatte nel periodo</h4>
          <ul>
            {card.doneItems.map((item) => (
              <li key={item.id}>
                {item.subLabel}: {item.title}
                <span className="eur-riepilogo-due">
                  {" "}
                  — {formatDateUI(item.doneDate)} — {item.by}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {card.openIssues.length > 0 && (
        <div className="eur-riepilogo-section">
          <h4>Problemi aperti</h4>
          <ul>
            {card.openIssues.map((item) => (
              <li key={item.id}>
                <span className="eur-riepilogo-pill eur-riepilogo-pill--issue">
                  {ISSUE_TYPE_LABELS[item.type]}
                </span>
                {item.subLabel}: {item.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RiepilogoTab(props: {
  snapshot: EuromeccSnapshot;
  reportRange: EuromeccRange;
  setReportRange: (r: EuromeccRange) => void;
  reportKpis: KpiItem[];
  reportPending: EuromeccPendingTask[];
  reportDone: EuromeccDoneTask[];
  reportIssues: EuromeccIssue[];
}) {
  const [exporting, setExporting] = useState(false);

  const cards = useMemo(
    () =>
      buildRiepilogoCards(
        props.snapshot,
        props.reportPending,
        props.reportDone,
        props.reportIssues,
      ),
    [props.snapshot, props.reportPending, props.reportDone, props.reportIssues],
  );

  const sortedCards = useMemo(() => {
    const withUrgency = cards.filter((c) => c.hasUrgency);
    const withPending = cards.filter((c) => !c.hasUrgency && c.pendingItems.length > 0);
    const doneOnly = cards.filter(
      (c) => !c.hasUrgency && c.pendingItems.length === 0 && c.doneItems.length > 0,
    );
    return [...withUrgency, ...withPending, ...doneOnly];
  }, [cards]);

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await generatePdfRiepilogo(props.snapshot, props.reportRange, sortedCards);
    } catch (err) {
      console.error("Errore export PDF riepilogo:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="eur-riepilogo-export-bar">
        <div className="eur-range-switch">
          {RANGE_OPTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={props.reportRange === item.value ? "active" : ""}
              onClick={() => props.setReportRange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="eur-riepilogo-export-btn"
          onClick={() => void handleExportPdf()}
          disabled={exporting}
        >
          {exporting ? "Generazione..." : "Esporta PDF"}
        </button>
      </div>
      <KpiGrid items={props.reportKpis} />
      <section className="eur-segment eur-riepilogo-mappa-section">
        <div className="eur-section-head">
          <div>
            <h2>Stato impianto</h2>
            <p>Mappa semaforo in sola lettura — stato corrente di ogni area.</p>
          </div>
        </div>
        <RiepilogoMappaImpianto
          snapshot={props.snapshot}
          reportPending={props.reportPending}
          reportDone={props.reportDone}
          reportIssues={props.reportIssues}
        />
      </section>
      {sortedCards.length === 0 ? (
        <div className="eur-empty">Nessuna attivita nel periodo selezionato.</div>
      ) : (
        <div className="eur-riepilogo-cards">
          {sortedCards.map((card) =>
            card.areaKey === "carico1" ||
            card.areaKey === "carico2" ||
            card.areaKey === "caricoRail" ? (
              <RiepilogoCaricoDiagram key={card.areaKey} card={card} snapshot={props.snapshot} />
            ) : (
              <RiepilogoAreaCard key={card.areaKey} card={card} />
            ),
          )}
        </div>
      )}
    </>
  );
}

export default function NextEuromeccPage() {
  const [snapshot, setSnapshot] = useState<EuromeccSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [currentArea, setCurrentArea] = useState<string>(EUROMECC_AREA_KEYS[0] ?? "silo1");
  const [currentMaintSub, setCurrentMaintSub] = useState<string | null>(
    firstComponentKey(EUROMECC_AREA_KEYS[0] ?? "silo1"),
  );
  const [currentIssueSub, setCurrentIssueSub] = useState<string | null>(
    firstComponentKey(EUROMECC_AREA_KEYS[0] ?? "silo1"),
  );
  const [currentDetailSub, setCurrentDetailSub] = useState<string | null>(
    firstComponentKey(EUROMECC_AREA_KEYS[0] ?? "silo1"),
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [dataManagerOpen, setDataManagerOpen] = useState(false);
  const [dataManagerTab, setDataManagerTab] = useState<DataManagerTabKey>("issues");
  const [dataManagerSearch, setDataManagerSearch] = useState("");
  const [dataManagerArea, setDataManagerArea] = useState<string>("all");
  const [reportRange, setReportRange] = useState<EuromeccRange>("90");
  const [pendingForm, setPendingForm] = useState(EMPTY_PENDING_FORM);
  const [doneForm, setDoneForm] = useState(EMPTY_DONE_FORM);
  const [issueForm, setIssueForm] = useState(EMPTY_ISSUE_FORM);
  const [editingPending, setEditingPending] = useState<UpdateEuromeccPendingTaskInput | null>(null);
  const [editingDone, setEditingDone] = useState<DoneEditState | null>(null);
  const [editingIssue, setEditingIssue] = useState<IssueEditState | null>(null);
  const [cementModalOpen, setCementModalOpen] = useState(false);
  const [cementTypeDraft, setCementTypeDraft] = useState(EMPTY_CEMENT_TYPE);
  const [cementTypeShortDraft, setCementTypeShortDraft] = useState(EMPTY_CEMENT_TYPE_SHORT);
  const [saving, setSaving] = useState(false);

  const reloadSnapshot = async () => {
    setLoading(true);
    setError(null);
    try {
      const nextSnapshot = await readEuromeccSnapshot();
      setSnapshot(nextSnapshot);
      setNotice("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Impossibile leggere il dominio Euromecc.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reloadSnapshot();
  }, []);

  useEffect(() => {
    if (!detailOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDetailOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [detailOpen]);

  useEffect(() => {
    if (!cementModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCementModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cementModalOpen]);

  useEffect(() => {
    if (!dataManagerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDataManagerOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dataManagerOpen]);

  const currentAreaData = EUROMECC_AREAS[currentArea] ?? EUROMECC_AREAS[EUROMECC_AREA_KEYS[0]];

  useEffect(() => {
    if (!currentAreaData) return;
    const defaultSub = firstComponentKey(currentAreaData.key);

    setCurrentMaintSub((previous) =>
      currentAreaData.components.some((item) => item.key === previous) ? previous : defaultSub,
    );
    setCurrentIssueSub((previous) =>
      currentAreaData.components.some((item) => item.key === previous) ? previous : defaultSub,
    );
    setCurrentDetailSub((previous) =>
      currentAreaData.components.some((item) => item.key === previous) ? previous : defaultSub,
    );
  }, [currentAreaData]);

  const pending = useMemo(() => snapshot?.pending ?? [], [snapshot]);
  const done = useMemo(() => snapshot?.done ?? [], [snapshot]);
  const issues = useMemo(() => snapshot?.issues ?? [], [snapshot]);
  const openIssues = useMemo(() => issues.filter((item) => item.state !== "chiusa"), [issues]);
  const closedIssues = useMemo(() => issues.filter((item) => item.state === "chiusa"), [issues]);
  const doneLast30 = useMemo(
    () =>
      done.filter((item) => {
        const delta = daysAgo(item.doneDate);
        return Number.isFinite(delta) && delta >= 0 && delta <= 30;
      }),
    [done],
  );

  const areaPending = useMemo(
    () => pending.filter((item) => item.areaKey === currentAreaData.key),
    [currentAreaData.key, pending],
  );
  const areaOpenIssues = useMemo(
    () => openIssues.filter((item) => item.areaKey === currentAreaData.key),
    [currentAreaData.key, openIssues],
  );
  const areaClosedIssues = useMemo(
    () => closedIssues.filter((item) => item.areaKey === currentAreaData.key).slice(0, 10),
    [closedIssues, currentAreaData.key],
  );

  const maintSubKey = currentMaintSub ?? firstComponentKey(currentAreaData.key) ?? "";
  const issueSubKey = currentIssueSub ?? firstComponentKey(currentAreaData.key) ?? "";
  const detailSubKey = currentDetailSub ?? firstComponentKey(currentAreaData.key) ?? "";

  const detailComponent =
    currentAreaData.components.find((item) => item.key === detailSubKey) ?? currentAreaData.components[0];
  const maintComponent =
    currentAreaData.components.find((item) => item.key === maintSubKey) ?? currentAreaData.components[0];
  const issueComponent =
    currentAreaData.components.find((item) => item.key === issueSubKey) ?? currentAreaData.components[0];

  const areaStatus = snapshot
    ? getAreaStatus(currentAreaData.key, [...currentAreaData.components], snapshot)
    : currentAreaData.base;

  const areaOverviewMeta = snapshot
    ? areaMeta(currentAreaData.key, snapshot)
    : { lastDone: null, nextDue: null };
  const currentAreaCementType = snapshot?.cementTypesByArea[currentAreaData.key] ?? "";
  const currentAreaCementTypeShort = snapshot?.cementTypeShortByArea[currentAreaData.key] ?? "";

  const detailComponentStatus = snapshot
    ? getSubStatus(
        currentAreaData.key,
        detailComponent.key,
        componentBase(currentAreaData, detailComponent.key),
        snapshot,
      )
    : currentAreaData.base;

  const detailComponentMeta = snapshot
    ? componentMeta(currentAreaData.key, detailComponent.key, snapshot)
    : { lastDone: null, nextDue: null };

  const detailPending = useMemo(
    () =>
      pending
        .filter((item) => item.areaKey === currentAreaData.key && item.subKey === detailComponent.key)
        .slice(0, 5),
    [currentAreaData.key, detailComponent.key, pending],
  );
  const detailDone = useMemo(
    () =>
      done
        .filter((item) => item.areaKey === currentAreaData.key && item.subKey === detailComponent.key)
        .slice(0, 5),
    [currentAreaData.key, detailComponent.key, done],
  );
  const detailIssues = useMemo(
    () =>
      issues
        .filter((item) => item.areaKey === currentAreaData.key && item.subKey === detailComponent.key)
        .slice(0, 5),
    [currentAreaData.key, detailComponent.key, issues],
  );
  const detailOpenIssues = useMemo(
    () => detailIssues.filter((item) => item.state !== "chiusa"),
    [detailIssues],
  );
  const detailClosedIssues = useMemo(
    () => detailIssues.filter((item) => item.state === "chiusa"),
    [detailIssues],
  );

  const pendingForMaintSub = useMemo(
    () =>
      pending.filter((item) => item.areaKey === currentAreaData.key && item.subKey === maintSubKey),
    [currentAreaData.key, maintSubKey, pending],
  );
  const doneForMaintSub = useMemo(
    () =>
      done
        .filter((item) => item.areaKey === currentAreaData.key && item.subKey === maintSubKey)
        .slice(0, 10),
    [currentAreaData.key, done, maintSubKey],
  );
  const openIssuesForIssueSub = useMemo(
    () =>
      openIssues.filter((item) => item.areaKey === currentAreaData.key && item.subKey === issueSubKey),
    [currentAreaData.key, issueSubKey, openIssues],
  );
  const closedIssuesForIssueSub = useMemo(
    () =>
      closedIssues
        .filter((item) => item.areaKey === currentAreaData.key && item.subKey === issueSubKey)
        .slice(0, 10),
    [closedIssues, currentAreaData.key, issueSubKey],
  );

  const reportPending = useMemo(
    () => pending.filter((item) => withinRange(item.dueDate, reportRange)),
    [pending, reportRange],
  );
  const reportDone = useMemo(
    () => done.filter((item) => withinRange(item.doneDate, reportRange)),
    [done, reportRange],
  );
  const reportIssues = useMemo(
    () => openIssues.filter((item) => withinRange(item.reportedAt, reportRange)),
    [openIssues, reportRange],
  );
  const reportUrgencies = useMemo(
    () =>
      reportPending.filter((item) => item.priority === "alta").length +
      reportIssues.filter((item) => item.type !== "osservazione").length,
    [reportIssues, reportPending],
  );

  const homeKpis = useMemo<KpiItem[]>(
    () => [
      {
        label: "Manutenzioni da fare",
        value: String(pending.length),
        meta: pending.length === 1 ? "1 attivita aperta" : `${pending.length} attivita aperte`,
      },
      {
        label: "Problemi aperti",
        value: String(openIssues.length),
        meta:
          openIssues.filter((item) => item.type !== "osservazione").length > 0
            ? `${openIssues.filter((item) => item.type !== "osservazione").length} anomalie/criticita`
            : "solo osservazioni o nessun problema",
      },
      {
        label: "Fatte ultimi 30 giorni",
        value: String(doneLast30.length),
        meta: doneLast30.length > 0 ? "storico aggiornato" : "nessun intervento recente",
      },
      {
        label: "Aree censite",
        value: String(EUROMECC_AREA_KEYS.length),
        meta: `${MAP_SILOS.length} sili + ${MAP_GENERIC.length} aree tecniche`,
      },
    ],
    [doneLast30.length, openIssues, pending.length],
  );

  const maintenanceKpis = useMemo<KpiItem[]>(
    () => [
      {
        label: "Interventi aperti",
        value: String(pending.length),
        meta: pending.length ? "manutenzioni da fare" : "nessuna manutenzione aperta",
      },
      {
        label: "Fatti ultimi 30 giorni",
        value: String(doneLast30.length),
        meta: doneLast30.length ? "registro recente" : "nessun intervento recente",
      },
      {
        label: "Componenti area",
        value: String(currentAreaData.components.length),
        meta: currentAreaData.title,
      },
      {
        label: "Da fare sull'area",
        value: String(areaPending.length),
        meta: areaPending.length ? "interventi pianificati" : "nessuna attivita in scadenza",
      },
    ],
    [areaPending.length, currentAreaData.components.length, currentAreaData.title, doneLast30.length, pending.length],
  );

  const issuesKpis = useMemo<KpiItem[]>(
    () => [
      {
        label: "Problemi aperti",
        value: String(openIssues.length),
        meta: openIssues.length ? "nel modulo Euromecc" : "nessuna criticita aperta",
      },
      {
        label: "Criticita / anomalie",
        value: String(openIssues.filter((item) => item.type !== "osservazione").length),
        meta: "osservazioni escluse",
      },
      {
        label: "Aperti sull'area",
        value: String(areaOpenIssues.length),
        meta: currentAreaData.title,
      },
      {
        label: "Chiusi sull'area",
        value: String(areaClosedIssues.length),
        meta: "storico area selezionata",
      },
    ],
    [areaClosedIssues.length, areaOpenIssues.length, currentAreaData.title, openIssues],
  );

  const reportKpis = useMemo<KpiItem[]>(
    () => [
      {
        label: "Manutenzioni da eseguire",
        value: String(reportPending.length),
        meta: RANGE_OPTIONS.find((item) => item.value === reportRange)?.label ?? "Periodo selezionato",
      },
      {
        label: "Problemi aperti",
        value: String(reportIssues.length),
        meta: "solo segnalazioni aperte",
      },
      {
        label: "Manutenzioni fatte",
        value: String(reportDone.length),
        meta: "nel periodo selezionato",
      },
      {
        label: "Urgenze reali",
        value: String(reportUrgencies),
        meta: "alta priorita + criticita",
      },
    ],
    [reportDone.length, reportIssues.length, reportPending.length, reportRange, reportUrgencies],
  );

  const managerSearch = useMemo(() => normalizeSearchValue(dataManagerSearch), [dataManagerSearch]);
  const managerAreaOptions = useMemo(
    () => [
      { value: "all", label: "Tutte le aree" },
      ...EUROMECC_AREA_KEYS.map((areaKey) => ({
        value: areaKey,
        label: EUROMECC_AREAS[areaKey]?.title ?? areaKey,
      })),
    ],
    [],
  );

  const filteredManagerPending = useMemo(
    () =>
      pending.filter((item) => {
        if (dataManagerArea !== "all" && item.areaKey !== dataManagerArea) return false;
        if (!managerSearch) return true;
        const haystack = normalizeSearchValue(
          [item.areaLabel, item.subLabel, item.title, item.note, item.priority, item.dueDate].join(" "),
        );
        return haystack.includes(managerSearch);
      }),
    [dataManagerArea, managerSearch, pending],
  );

  const filteredManagerDone = useMemo(
    () =>
      done.filter((item) => {
        if (dataManagerArea !== "all" && item.areaKey !== dataManagerArea) return false;
        if (!managerSearch) return true;
        const haystack = normalizeSearchValue(
          [item.areaLabel, item.subLabel, item.title, item.note, item.by, item.doneDate, item.nextDate ?? ""].join(
            " ",
          ),
        );
        return haystack.includes(managerSearch);
      }),
    [dataManagerArea, done, managerSearch],
  );

  const filteredManagerIssues = useMemo(
    () =>
      issues.filter((item) => {
        if (dataManagerArea !== "all" && item.areaKey !== dataManagerArea) return false;
        if (!managerSearch) return true;
        const haystack = normalizeSearchValue(
          [
            item.areaLabel,
            item.subLabel,
            item.title,
            item.check,
            item.note,
            item.reportedBy,
            item.reportedAt,
            item.type,
            item.state,
          ].join(" "),
        );
        return haystack.includes(managerSearch);
      }),
    [dataManagerArea, issues, managerSearch],
  );

  const goToTab = (tab: TabKey, areaKey = currentAreaData.key, subKey?: string | null) => {
    const fallbackSub = subKey ?? firstComponentKey(areaKey);
    setCurrentArea(areaKey);
    if (tab === "maintenance") {
      setCurrentMaintSub(fallbackSub);
    }
    if (tab === "issues") {
      setCurrentIssueSub(fallbackSub);
    }
    setCurrentDetailSub(fallbackSub);
    setActiveTab(tab);
    setDetailOpen(false);
  };

  const handleMapOpenDetail = (areaKey: string) => {
    setCurrentArea(areaKey);
    setCurrentDetailSub(firstComponentKey(areaKey));
    setDetailOpen(true);
  };

  const handleMapSelectArea = (areaKey: string) => {
    setCurrentArea(areaKey);
  };

  const handlePendingSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!maintComponent) return;

    setSaving(true);
    setNotice("");
    setError(null);
    try {
      await addEuromeccPendingTask({
        areaKey: currentAreaData.key,
        subKey: maintComponent.key,
        title: pendingForm.title,
        priority: pendingForm.priority,
        dueDate: pendingForm.dueDate,
        note: pendingForm.note,
      });
      setPendingForm(EMPTY_PENDING_FORM);
      await reloadSnapshot();
      setNotice("Manutenzione da fare registrata con successo.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossibile salvare la manutenzione da fare.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDoneSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!maintComponent) return;

    setSaving(true);
    setNotice("");
    setError(null);
    try {
      await addEuromeccDoneTask(
        {
          areaKey: currentAreaData.key,
          subKey: maintComponent.key,
          title: doneForm.title,
          doneDate: doneForm.doneDate,
          by: doneForm.by,
          note: doneForm.note,
          nextDate: doneForm.nextDate || null,
          closedPending: doneForm.closePending,
        },
        doneForm.closePending,
      );
      setDoneForm(EMPTY_DONE_FORM);
      await reloadSnapshot();
      setNotice("Manutenzione fatta registrata con successo.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossibile registrare la manutenzione fatta.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleIssueSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!issueComponent) return;

    setSaving(true);
    setNotice("");
    setError(null);
    try {
      await addEuromeccIssue({
        areaKey: currentAreaData.key,
        subKey: issueComponent.key,
        title: issueForm.title,
        check: issueForm.check,
        type: issueForm.type,
        reportedAt: issueForm.reportedAt,
        reportedBy: issueForm.reportedBy,
        note: issueForm.note,
      });
      setIssueForm(EMPTY_ISSUE_FORM);
      await reloadSnapshot();
      setNotice("Segnalazione registrata con successo.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Impossibile salvare la segnalazione.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePending = async (id: string) => {
    setSaving(true);
    setNotice("");
    setError(null);
    try {
      await deleteEuromeccPendingTask(id);
      await reloadSnapshot();
      setNotice("Attivita da fare eliminata.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Impossibile eliminare la manutenzione da fare.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCloseIssue = async (id: string) => {
    setSaving(true);
    setNotice("");
    setError(null);
    try {
      await closeEuromeccIssue(id);
      await reloadSnapshot();
      setNotice("Segnalazione chiusa correttamente.");
    } catch (closeError) {
      setError(
        closeError instanceof Error ? closeError.message : "Impossibile chiudere la segnalazione.",
      );
    } finally {
      setSaving(false);
    }
  };



  const handleOpenCementModal = () => {
    if (currentAreaData.type !== "silo") return;
    setCementTypeDraft(currentAreaCementType);
    setCementTypeShortDraft(
      currentAreaCementTypeShort || deriveEuromeccCementTypeShortLabel(currentAreaCementType),
    );
    setCementModalOpen(true);
  };

  const handleSelectCementPreset = (preset: CementPreset) => {
    setCementTypeDraft(preset.full);
    setCementTypeShortDraft(preset.short);
  };

  const handleSaveCementType = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (currentAreaData.type !== "silo") return;

    setSaving(true);
    setNotice("");
    setError(null);
    try {
      await saveEuromeccAreaCementType({
        areaKey: currentAreaData.key,
        cementType: cementTypeDraft,
        cementTypeShort: cementTypeShortDraft,
      });
      await reloadSnapshot();
      setCementModalOpen(false);
      setNotice(
        cementTypeDraft.trim()
          ? "Tipo cemento salvato correttamente."
          : "Tipo cemento rimosso correttamente.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossibile salvare il tipo cemento.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDataManager = () => {
    setDataManagerSearch("");
    setDataManagerArea("all");
    setEditingPending(null);
    setEditingDone(null);
    setEditingIssue(null);
    setDataManagerOpen(true);
  };

  const handleCloseDataManager = () => {
    if (saving) return;
    setEditingPending(null);
    setEditingDone(null);
    setEditingIssue(null);
    setDataManagerOpen(false);
  };

  const handleStartPendingEdit = (item: EuromeccPendingTask) => {
    setEditingDone(null);
    setEditingIssue(null);
    setEditingPending(toPendingEditState(item));
    setDataManagerTab("pending");
  };

  const handleStartDoneEdit = (item: EuromeccDoneTask) => {
    setEditingPending(null);
    setEditingIssue(null);
    setEditingDone(toDoneEditState(item));
    setDataManagerTab("done");
  };

  const handleStartIssueEdit = (item: EuromeccIssue) => {
    setEditingPending(null);
    setEditingDone(null);
    setEditingIssue(toIssueEditState(item));
    setDataManagerTab("issues");
  };

  const handleSavePendingEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPending) return;

    setSaving(true);
    setNotice("");
    setError(null);
    try {
      await updateEuromeccPendingTask(editingPending);
      await reloadSnapshot();
      setEditingPending(null);
      setNotice("Manutenzione da fare aggiornata.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossibile aggiornare la manutenzione da fare.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePendingFromManager = async (id: string) => {
    if (!window.confirm("Vuoi eliminare definitivamente questa manutenzione da fare?")) {
      return;
    }

    setSaving(true);
    setNotice("");
    setError(null);
    try {
      await deleteEuromeccPendingTask(id);
      await reloadSnapshot();
      setEditingPending((previous) => (previous?.id === id ? null : previous));
      setNotice("Manutenzione da fare eliminata.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Impossibile eliminare la manutenzione da fare.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDoneEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingDone) return;

    setSaving(true);
    setNotice("");
    setError(null);
    try {
      await updateEuromeccDoneTask({
        ...editingDone,
        nextDate: editingDone.nextDate.trim() || null,
      });
      await reloadSnapshot();
      setEditingDone(null);
      setNotice("Manutenzione fatta aggiornata.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossibile aggiornare la manutenzione fatta.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDone = async (id: string) => {
    if (!window.confirm("Vuoi eliminare definitivamente questa manutenzione fatta?")) {
      return;
    }

    setSaving(true);
    setNotice("");
    setError(null);
    try {
      await deleteEuromeccDoneTask(id);
      await reloadSnapshot();
      setEditingDone((previous) => (previous?.id === id ? null : previous));
      setNotice("Manutenzione fatta eliminata.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Impossibile eliminare la manutenzione fatta.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIssueEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingIssue) return;

    setSaving(true);
    setNotice("");
    setError(null);
    try {
      await updateEuromeccIssue({
        ...editingIssue,
        closedDate: editingIssue.state === "chiusa" ? editingIssue.closedDate || null : null,
      });
      await reloadSnapshot();
      setEditingIssue(null);
      setNotice("Segnalazione aggiornata.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Impossibile aggiornare la segnalazione.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIssue = async (id: string) => {
    if (!window.confirm("Vuoi eliminare definitivamente questa segnalazione?")) {
      return;
    }

    setSaving(true);
    setNotice("");
    setError(null);
    try {
      await deleteEuromeccIssue(id);
      await reloadSnapshot();
      setEditingIssue((previous) => (previous?.id === id ? null : previous));
      setNotice("Segnalazione eliminata.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Impossibile eliminare la segnalazione.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="eur-page">
      <header className="eur-head">
        <div>
          <span className="eur-eyebrow">Modulo nativo NEXT</span>
          <h1>Euromecc</h1>
          <p>
            Gestione manutenzione, problemi e riepilogo dell&apos;impianto Euromecc con
            lettura e scrittura diretta su collection dedicate.
          </p>
        </div>
        <div className="eur-head-actions">
          <button
            type="button"
            className="eur-head-secret"
            onClick={handleOpenDataManager}
            disabled={loading || saving}
          >
            Impostazioni
          </button>
          <button type="button" onClick={() => void reloadSnapshot()} disabled={loading || saving}>
            Aggiorna
          </button>
        </div>
      </header>

      <nav className="eur-tabs" aria-label="Tab modulo Euromecc">
        {TAB_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={activeTab === item.key ? "active" : ""}
            onClick={() => setActiveTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {notice ? <div className="eur-notice">{notice}</div> : null}
      {error ? <div className="eur-error">{error}</div> : null}
      {loading && !snapshot ? <div className="eur-loading">Caricamento modulo Euromecc...</div> : null}

      {!loading && snapshot ? (
        <>
          {activeTab === "home" ? (
            <>
              <KpiGrid items={homeKpis} />
              <div className="eur-home-grid">
                <section className="eur-map-wrap eur-map-wrap--home">
                  <div className="eur-section-head">
                    <div>
                      <h2>Mappa impianto</h2>
                      <p>Clicca un nodo per aprire il dettaglio fullscreen dell&apos;area.</p>
                    </div>
                  </div>
                  <MapSvg
                    snapshot={snapshot}
                    currentArea={currentAreaData.key}
                    onSelectArea={handleMapOpenDetail}
                  />
                </section>

                <aside className="eur-side-card">
                  <div className="eur-section-head">
                    <div>
                      <h2>Focus area</h2>
                      <p>{currentAreaData.title}</p>
                    </div>
                    <span className={badgeClass(areaStatus)}>{STATUS_LABELS[areaStatus]}</span>
                  </div>
                  <div className="eur-focus-grid">
                    <article>
                      <span>Codice</span>
                      <strong>{currentAreaData.code}</strong>
                    </article>
                    <article>
                      <span>Area</span>
                      <strong>{currentAreaData.area}</strong>
                    </article>
                    <article>
                      <span>Ultima manutenzione</span>
                      <strong>{formatDateUI(areaOverviewMeta.lastDone)}</strong>
                    </article>
                    <article>
                      <span>Prossima scadenza</span>
                      <strong>{formatDateUI(areaOverviewMeta.nextDue)}</strong>
                    </article>
                  </div>
                  <p className="eur-area-description">{currentAreaData.description}</p>
                  {currentAreaData.type === "silo" ? (
                    <div className="eur-cement-card">
                      <span>Tipo cemento</span>
                      <strong>{formatCementTypeFullLabel(currentAreaCementType)}</strong>
                      {currentAreaCementType ? (
                        <small>Sigla mappa: {currentAreaCementTypeShort}</small>
                      ) : null}
                      <button
                        type="button"
                        onClick={handleOpenCementModal}
                        disabled={saving}
                      >
                        {currentAreaCementType ? "MODIFICA CEMENTO" : "IMPOSTA CEMENTO"}
                      </button>
                    </div>
                  ) : null}
                  <div className="eur-legend">
                    {statusLegendItems().map((item) => (
                      <span key={item.label}>
                        <i style={{ backgroundColor: item.color }} />
                        {item.label}
                      </span>
                    ))}
                  </div>
                  <div className="eur-quick-actions">
                    <button type="button" onClick={() => setActiveTab("issues")}>
                      Problemi riscontrati
                    </button>
                    <button type="button" onClick={() => setActiveTab("maintenance")}>
                      Componenti manutentivi
                    </button>
                    <button type="button" onClick={() => setActiveTab("report")}>
                      Genera riepilogo
                    </button>
                  </div>
                </aside>
              </div>
            </>
          ) : null}
          {activeTab === "maintenance" ? (
            <>
              <KpiGrid items={maintenanceKpis} />
              <section className="eur-map-wrap">
                <div className="eur-section-head">
                  <div>
                    <h2>Mappa manutenzione</h2>
                    <p>Seleziona l&apos;area per aggiornare form e storico manutentivo.</p>
                  </div>
                </div>
                <MapSvg
                  snapshot={snapshot}
                  currentArea={currentAreaData.key}
                  onSelectArea={handleMapSelectArea}
                />
              </section>
              <div className="eur-ops-grid">
                <section className="eur-segment">
                  <div className="eur-section-head">
                    <div>
                      <h2>{currentAreaData.title}</h2>
                      <p>{currentAreaData.area}</p>
                    </div>
                    <span className={badgeClass(areaStatus)}>{STATUS_LABELS[areaStatus]}</span>
                  </div>
                  <ComponentSelector
                    areaKey={currentAreaData.key}
                    snapshot={snapshot}
                    selectedKey={maintSubKey}
                    onSelect={setCurrentMaintSub}
                  />
                  <div className="eur-list-block">
                    <h3>Manutenzioni da eseguire</h3>
                    <TaskRows
                      items={pendingForMaintSub}
                      emptyLabel="Nessuna manutenzione da fare per il componente selezionato."
                      kind="pending"
                      onDeletePending={handleDeletePending}
                      busy={saving}
                    />
                  </div>
                  <div className="eur-list-block">
                    <h3>Manutenzioni fatte</h3>
                    <TaskRows
                      items={doneForMaintSub}
                      emptyLabel="Nessuna manutenzione registrata per il componente selezionato."
                      kind="done"
                    />
                  </div>
                </section>

                <section className="eur-segment">
                  <div className="eur-form-group">
                    <div className="eur-section-head">
                      <div>
                        <h2>Registra manutenzione da fare</h2>
                        <p>{maintComponent?.name ?? "Seleziona un componente"}</p>
                      </div>
                    </div>
                    <form className="eur-form" onSubmit={handlePendingSubmit}>
                      <label>
                        Componente
                        <select value={maintSubKey} onChange={(event) => setCurrentMaintSub(event.target.value)}>
                          {currentAreaData.components.map((component) => (
                            <option key={component.key} value={component.key}>
                              {component.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Priorita
                        <select
                          value={pendingForm.priority}
                          onChange={(event) =>
                            setPendingForm((previous) => ({
                              ...previous,
                              priority: event.target.value as EuromeccPriority,
                            }))
                          }
                        >
                          <option value="alta">Alta</option>
                          <option value="media">Media</option>
                          <option value="bassa">Bassa</option>
                        </select>
                      </label>
                      <label>
                        Titolo intervento
                        <input
                          type="text"
                          value={pendingForm.title}
                          onChange={(event) =>
                            setPendingForm((previous) => ({ ...previous, title: event.target.value }))
                          }
                          required
                        />
                      </label>
                      <label>
                        Scadenza
                        <input
                          type="date"
                          value={pendingForm.dueDate}
                          onChange={(event) =>
                            setPendingForm((previous) => ({ ...previous, dueDate: event.target.value }))
                          }
                          required
                        />
                      </label>
                      <label>
                        Nota breve
                        <textarea
                          value={pendingForm.note}
                          onChange={(event) =>
                            setPendingForm((previous) => ({ ...previous, note: event.target.value }))
                          }
                          rows={3}
                        />
                      </label>
                      <button type="submit" disabled={saving}>
                        Salva manutenzione da fare
                      </button>
                    </form>
                  </div>

                  <div className="eur-form-group">
                    <div className="eur-section-head">
                      <div>
                        <h2>Registra manutenzione fatta</h2>
                        <p>{maintComponent?.name ?? "Seleziona un componente"}</p>
                      </div>
                    </div>
                    <form className="eur-form" onSubmit={handleDoneSubmit}>
                      <label>
                        Componente
                        <select value={maintSubKey} onChange={(event) => setCurrentMaintSub(event.target.value)}>
                          {currentAreaData.components.map((component) => (
                            <option key={component.key} value={component.key}>
                              {component.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Titolo intervento
                        <input
                          type="text"
                          value={doneForm.title}
                          onChange={(event) =>
                            setDoneForm((previous) => ({ ...previous, title: event.target.value }))
                          }
                          required
                        />
                      </label>
                      <label>
                        Data intervento
                        <input
                          type="date"
                          value={doneForm.doneDate}
                          onChange={(event) =>
                            setDoneForm((previous) => ({ ...previous, doneDate: event.target.value }))
                          }
                          required
                        />
                      </label>
                      <label>
                        Fatta da
                        <input
                          type="text"
                          value={doneForm.by}
                          onChange={(event) =>
                            setDoneForm((previous) => ({ ...previous, by: event.target.value }))
                          }
                          required
                        />
                      </label>
                      <label>
                        Prossima scadenza
                        <input
                          type="date"
                          value={doneForm.nextDate}
                          onChange={(event) =>
                            setDoneForm((previous) => ({ ...previous, nextDate: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        Nota breve
                        <textarea
                          value={doneForm.note}
                          onChange={(event) =>
                            setDoneForm((previous) => ({ ...previous, note: event.target.value }))
                          }
                          rows={3}
                        />
                      </label>
                      <label className="eur-checkbox">
                        <input
                          type="checkbox"
                          checked={doneForm.closePending}
                          onChange={(event) =>
                            setDoneForm((previous) => ({
                              ...previous,
                              closePending: event.target.checked,
                            }))
                          }
                        />
                        <span>Chiudi le attivita aperte dello stesso componente</span>
                      </label>
                      <button type="submit" disabled={saving}>
                        Registra manutenzione fatta
                      </button>
                    </form>
                  </div>
                </section>
              </div>
            </>
          ) : null}

          {activeTab === "issues" ? (
            <>
              <KpiGrid items={issuesKpis} />
              <section className="eur-map-wrap">
                <div className="eur-section-head">
                  <div>
                    <h2>Mappa problemi</h2>
                    <p>Seleziona l&apos;area per gestire le segnalazioni e chiudere i problemi.</p>
                  </div>
                </div>
                <MapSvg
                  snapshot={snapshot}
                  currentArea={currentAreaData.key}
                  onSelectArea={handleMapSelectArea}
                />
              </section>
              <div className="eur-ops-grid">
                <section className="eur-segment">
                  <div className="eur-section-head">
                    <div>
                      <h2>{currentAreaData.title}</h2>
                      <p>Problemi e osservazioni dell&apos;area selezionata</p>
                    </div>
                    <span className={badgeClass(areaStatus)}>{STATUS_LABELS[areaStatus]}</span>
                  </div>
                  <ComponentSelector
                    areaKey={currentAreaData.key}
                    snapshot={snapshot}
                    selectedKey={issueSubKey}
                    onSelect={setCurrentIssueSub}
                  />
                  <div className="eur-list-block">
                    <h3>Problemi aperti</h3>
                    <TaskRows
                      items={openIssuesForIssueSub}
                      emptyLabel="Nessun problema aperto sul componente selezionato."
                      kind="issue-open"
                      onCloseIssue={handleCloseIssue}
                      busy={saving}
                    />
                  </div>
                  <div className="eur-list-block">
                    <h3>Problemi chiusi</h3>
                    <TaskRows
                      items={closedIssuesForIssueSub}
                      emptyLabel="Nessun problema chiuso sul componente selezionato."
                      kind="issue-closed"
                    />
                  </div>
                </section>

                <section className="eur-segment">
                  <div className="eur-section-head">
                    <div>
                      <h2>Nuova segnalazione</h2>
                      <p>{issueComponent?.name ?? "Seleziona un componente"}</p>
                    </div>
                  </div>
                  <form className="eur-form" onSubmit={handleIssueSubmit}>
                    <label>
                      Componente
                      <select value={issueSubKey} onChange={(event) => setCurrentIssueSub(event.target.value)}>
                        {currentAreaData.components.map((component) => (
                          <option key={component.key} value={component.key}>
                            {component.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Tipo
                      <select
                        value={issueForm.type}
                        onChange={(event) =>
                          setIssueForm((previous) => ({
                            ...previous,
                            type: event.target.value as EuromeccIssueType,
                          }))
                        }
                      >
                        <option value="criticita">Criticita</option>
                        <option value="anomalia">Anomalia</option>
                        <option value="osservazione">Osservazione</option>
                      </select>
                    </label>
                    <label>
                      Problema riscontrato
                      <input
                        type="text"
                        value={issueForm.title}
                        onChange={(event) =>
                          setIssueForm((previous) => ({ ...previous, title: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Cosa controllare / azione suggerita
                      <input
                        type="text"
                        value={issueForm.check}
                        onChange={(event) =>
                          setIssueForm((previous) => ({ ...previous, check: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Data segnalazione
                      <input
                        type="date"
                        value={issueForm.reportedAt}
                        onChange={(event) =>
                          setIssueForm((previous) => ({
                            ...previous,
                            reportedAt: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Segnalato da
                      <input
                        type="text"
                        value={issueForm.reportedBy}
                        onChange={(event) =>
                          setIssueForm((previous) => ({
                            ...previous,
                            reportedBy: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Nota breve
                      <textarea
                        value={issueForm.note}
                        onChange={(event) =>
                          setIssueForm((previous) => ({ ...previous, note: event.target.value }))
                        }
                        rows={3}
                      />
                    </label>
                    <button type="submit" disabled={saving}>
                      Salva segnalazione
                    </button>
                  </form>
                </section>
              </div>
            </>
          ) : null}
          {activeTab === "report" ? (
            <RiepilogoTab
              snapshot={snapshot}
              reportRange={reportRange}
              setReportRange={setReportRange}
              reportKpis={reportKpis}
              reportPending={reportPending}
              reportDone={reportDone}
              reportIssues={reportIssues}
            />
          ) : null}

          {activeTab === "relazioni" ? <RelazioniTab /> : null}
        </>
      ) : null}

      {detailOpen && snapshot ? (
        <div className="eur-modal-overlay" onClick={() => setDetailOpen(false)} role="presentation">
          <div
            className="eur-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Dettaglio ${currentAreaData.title}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="eur-modal-header">
              <div>
                <span className="eur-eyebrow">Dettaglio area</span>
                <h2>{currentAreaData.title}</h2>
                <p>{currentAreaData.description}</p>
              </div>
              <div className="eur-modal-actions">
                <span className={badgeClass(areaStatus)}>{STATUS_LABELS[areaStatus]}</span>
                <button
                  type="button"
                  onClick={() => goToTab("maintenance", currentAreaData.key, detailComponent.key)}
                >
                  Vai a Manutenzione
                </button>
                <button
                  type="button"
                  onClick={() => goToTab("issues", currentAreaData.key, detailComponent.key)}
                >
                  Vai a Problemi
                </button>
                <button type="button" onClick={() => setDetailOpen(false)}>
                  Chiudi
                </button>
              </div>
            </div>

            <div className="eur-modal-meta">
              <article className="eur-modal-meta-card">
                <span>Codice</span>
                <strong>{currentAreaData.code}</strong>
              </article>
              <article className="eur-modal-meta-card">
                <span>Area</span>
                <strong>{currentAreaData.area}</strong>
              </article>
              <article className="eur-modal-meta-card">
                <span>Ultima manutenzione</span>
                <strong>{formatDateUI(areaOverviewMeta.lastDone)}</strong>
              </article>
              <article className="eur-modal-meta-card">
                <span>Prossima manutenzione</span>
                <strong>{formatDateUI(areaOverviewMeta.nextDue)}</strong>
              </article>
              {currentAreaData.type === "silo" ? (
                <article className="eur-modal-meta-card eur-modal-meta-card--cement">
                  <span>Tipo cemento</span>
                  <strong>{formatCementTypeFullLabel(currentAreaCementType)}</strong>
                  {currentAreaCementType ? (
                    <small>Sigla mappa: {currentAreaCementTypeShort}</small>
                  ) : null}
                </article>
              ) : null}
            </div>

            <div
              className={`eur-modal-body ${
                currentAreaData.type === "silo" || currentAreaData.key === "scaricoFornitore" || currentAreaData.key === "compressore" || currentAreaData.key === "compressore2" || currentAreaData.key === "caricoRail" ? "eur-modal-body--silo" : ""
              }`}
            >
              <section className="eur-segment">
                <div className="eur-section-head">
                  <div>
                    <h3>Schema tecnico</h3>
                    <p>
                      {currentAreaData.type === "silo"
                        ? "Clicca un hotspot del silo per vedere il dettaglio del componente."
                        : currentAreaData.key === "carico1" || currentAreaData.key === "carico2"
                          ? "Clicca un hotspot del punto di carico per vedere il dettaglio del componente."
                          : currentAreaData.key === "scaricoFornitore"
                            ? "Schema tecnico postazione scarico fornitore."
                            : "Area tecnica generica con componenti selezionabili."}
                    </p>
                  </div>
                </div>
                {currentAreaData.type === "silo" ? (
                  <SiloDiagram
                    area={currentAreaData}
                    snapshot={snapshot}
                    currentSub={detailSubKey}
                    onSelectSub={setCurrentDetailSub}
                  />
                ) : currentAreaData.key === "carico1" || currentAreaData.key === "carico2" ? (
                  <CaricoDiagram
                    area={currentAreaData}
                    snapshot={snapshot}
                    currentSub={detailSubKey}
                    onSelectSub={setCurrentDetailSub}
                  />
                ) : currentAreaData.key === "compressore" || currentAreaData.key === "compressore2" ? (
                  <SalaCompressoriDiagram
                    area={currentAreaData}
                    snapshot={snapshot}
                    currentSub={detailSubKey}
                    onSelectSub={setCurrentDetailSub}
                  />
                ) : currentAreaData.key === "caricoRail" ? (
                  <CaricoTrenoDiagram
                    area={currentAreaData}
                    snapshot={snapshot}
                    currentSub={detailSubKey}
                    onSelectSub={setCurrentDetailSub}
                  />
                ) : currentAreaData.key === "scaricoFornitore" ? (
                  <ScaricoFornitoreDiagram
                    area={currentAreaData}
                    snapshot={snapshot}
                    currentSub={detailSubKey}
                    onSelectSub={setCurrentDetailSub}
                  />
                ) : (
                  <ComponentSelector
                    areaKey={currentAreaData.key}
                    snapshot={snapshot}
                    selectedKey={detailSubKey}
                    onSelect={setCurrentDetailSub}
                  />
                )}
              </section>

              <section className="eur-segment">
                <div className="eur-section-head">
                  <div>
                    <h3>Dettaglio componente</h3>
                    <p>{detailComponent.name}</p>
                  </div>
                  <span className={badgeClass(detailComponentStatus)}>
                    {STATUS_LABELS[detailComponentStatus]}
                  </span>
                </div>

                <ComponentSelector
                  areaKey={currentAreaData.key}
                  snapshot={snapshot}
                  selectedKey={detailSubKey}
                  onSelect={setCurrentDetailSub}
                />

                <div className="eur-detail-grid">
                  <article>
                    <span>Codice tecnico</span>
                    <strong>{detailComponent.code}</strong>
                  </article>
                  <article>
                    <span>Ultima manutenzione</span>
                    <strong>{formatDateUI(detailComponentMeta.lastDone)}</strong>
                  </article>
                  <article>
                    <span>Prossima manutenzione</span>
                    <strong>{formatDateUI(detailComponentMeta.nextDue)}</strong>
                  </article>
                  <article>
                    <span>Delta stato</span>
                    <strong>{formatDue(detailComponentMeta.nextDue)}</strong>
                  </article>
                </div>

                <div className="eur-list-block">
                  <h4>Da fare</h4>
                  <TaskRows
                    items={detailPending}
                    emptyLabel="Nessuna manutenzione aperta sul componente."
                    kind="pending"
                  />
                </div>

                <div className="eur-list-block">
                  <h4>Manutenzioni fatte</h4>
                  <TaskRows
                    items={detailDone}
                    emptyLabel="Nessuna manutenzione fatta sul componente."
                    kind="done"
                  />
                </div>

                <div className="eur-list-block">
                  <h4>Problemi riscontrati</h4>
                  <div className="eur-problem-groups">
                    <div className="eur-problem-group">
                      <span className="eur-problem-group-title">Aperti</span>
                      <TaskRows
                        items={detailOpenIssues}
                        emptyLabel="Nessun problema aperto sul componente."
                        kind="issue-open"
                        onCloseIssue={handleCloseIssue}
                        busy={saving}
                      />
                    </div>
                    <div className="eur-problem-group">
                      <span className="eur-problem-group-title">Chiusi</span>
                      <TaskRows
                        items={detailClosedIssues}
                        emptyLabel="Nessun problema chiuso sul componente."
                        kind="issue-closed"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}

      {dataManagerOpen && snapshot ? (
        <div className="eur-modal-overlay" onClick={handleCloseDataManager} role="presentation">
          <div
            className="eur-modal eur-modal--manager"
            role="dialog"
            aria-modal="true"
            aria-label="Gestione dati Euromecc"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="eur-modal-header">
              <div>
                <span className="eur-eyebrow">Impostazioni</span>
                <h2>Gestione dati Euromecc</h2>
                <p>Pannello discreto interno per correggere o cancellare record gia inseriti.</p>
              </div>
              <div className="eur-modal-actions">
                <button type="button" onClick={handleCloseDataManager} disabled={saving}>
                  Chiudi
                </button>
              </div>
            </div>

            <div className="eur-manager-toolbar">
              <div className="eur-tabs" aria-label="Sezioni gestione dati Euromecc">
                {DATA_MANAGER_TABS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={dataManagerTab === item.key ? "active" : ""}
                    onClick={() => setDataManagerTab(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="eur-manager-filters">
                <label>
                  Cerca
                  <input
                    type="search"
                    value={dataManagerSearch}
                    onChange={(event) => setDataManagerSearch(event.target.value)}
                    placeholder="Titolo, area, nota..."
                  />
                </label>
                <label>
                  Area
                  <select
                    value={dataManagerArea}
                    onChange={(event) => setDataManagerArea(event.target.value)}
                  >
                    {managerAreaOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {dataManagerTab === "issues" ? (
              <section className="eur-manager-section">
                <div className="eur-section-head">
                  <div>
                    <h3>Segnalazioni</h3>
                    <p>Modifica o elimina i record presenti in `euromecc_issues`.</p>
                  </div>
                </div>
                {filteredManagerIssues.length === 0 ? (
                  <p className="eur-empty">Nessuna segnalazione trovata con i filtri correnti.</p>
                ) : (
                  <div className="eur-manager-list">
                    {filteredManagerIssues.map((item) => {
                      const isEditing = editingIssue?.id === item.id;
                      const editArea = isEditing ? editingIssue.areaKey : item.areaKey;
                      const editComponents = EUROMECC_AREAS[editArea]?.components ?? [];
                      return (
                        <article key={item.id} className="eur-manager-card">
                          <div className="eur-manager-card-head">
                            <div>
                              <strong>{item.title}</strong>
                              <div className="eur-task-meta">
                                <span>{item.areaLabel}</span>
                                <span>{item.subLabel}</span>
                                <span>{formatDateUI(item.reportedAt)}</span>
                                <span>{item.reportedBy}</span>
                              </div>
                            </div>
                            <div className="eur-task-actions">
                              <span className={miniIssueClass(item.type)}>
                                {item.state === "chiusa" ? "Chiusa" : ISSUE_TYPE_LABELS[item.type]}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStartIssueEdit(item)}
                                disabled={saving}
                              >
                                Modifica
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteIssue(item.id)}
                                disabled={saving}
                              >
                                Elimina
                              </button>
                            </div>
                          </div>
                          <div className="eur-task-meta">
                            <span>Check: {item.check}</span>
                            <span>Stato: {item.state === "chiusa" ? "Chiusa" : "Aperta"}</span>
                            {item.note ? <span>{item.note}</span> : null}
                          </div>
                          {isEditing && editingIssue ? (
                            <form className="eur-form eur-manager-form" onSubmit={handleSaveIssueEdit}>
                              <label>
                                Area
                                <select
                                  value={editingIssue.areaKey}
                                  onChange={(event) => {
                                    const areaKey = event.target.value;
                                    setEditingIssue((previous) =>
                                      previous
                                        ? {
                                            ...previous,
                                            areaKey,
                                            subKey: firstComponentKey(areaKey) ?? "",
                                          }
                                        : previous,
                                    );
                                  }}
                                >
                                  {EUROMECC_AREA_KEYS.map((areaKey) => (
                                    <option key={areaKey} value={areaKey}>
                                      {EUROMECC_AREAS[areaKey]?.title ?? areaKey}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Componente
                                <select
                                  value={editingIssue.subKey}
                                  onChange={(event) =>
                                    setEditingIssue((previous) =>
                                      previous ? { ...previous, subKey: event.target.value } : previous,
                                    )
                                  }
                                >
                                  {editComponents.map((component) => (
                                    <option key={component.key} value={component.key}>
                                      {component.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Tipo
                                <select
                                  value={editingIssue.type}
                                  onChange={(event) =>
                                    setEditingIssue((previous) =>
                                      previous
                                        ? {
                                            ...previous,
                                            type: event.target.value as EuromeccIssueType,
                                          }
                                        : previous,
                                    )
                                  }
                                >
                                  <option value="criticita">Criticita</option>
                                  <option value="anomalia">Anomalia</option>
                                  <option value="osservazione">Osservazione</option>
                                </select>
                              </label>
                              <label>
                                Stato
                                <select
                                  value={editingIssue.state}
                                  onChange={(event) =>
                                    setEditingIssue((previous) =>
                                      previous
                                        ? {
                                            ...previous,
                                            state: event.target.value as "aperta" | "chiusa",
                                            closedDate:
                                              event.target.value === "chiusa"
                                                ? previous.closedDate || formatDateInput(new Date())
                                                : "",
                                          }
                                        : previous,
                                    )
                                  }
                                >
                                  <option value="aperta">Aperta</option>
                                  <option value="chiusa">Chiusa</option>
                                </select>
                              </label>
                              <label>
                                Titolo
                                <input
                                  type="text"
                                  value={editingIssue.title}
                                  onChange={(event) =>
                                    setEditingIssue((previous) =>
                                      previous ? { ...previous, title: event.target.value } : previous,
                                    )
                                  }
                                  required
                                />
                              </label>
                              <label>
                                Check / azione
                                <input
                                  type="text"
                                  value={editingIssue.check}
                                  onChange={(event) =>
                                    setEditingIssue((previous) =>
                                      previous ? { ...previous, check: event.target.value } : previous,
                                    )
                                  }
                                  required
                                />
                              </label>
                              <label>
                                Data segnalazione
                                <input
                                  type="date"
                                  value={editingIssue.reportedAt}
                                  onChange={(event) =>
                                    setEditingIssue((previous) =>
                                      previous
                                        ? { ...previous, reportedAt: event.target.value }
                                        : previous,
                                    )
                                  }
                                  required
                                />
                              </label>
                              <label>
                                Segnalato da
                                <input
                                  type="text"
                                  value={editingIssue.reportedBy}
                                  onChange={(event) =>
                                    setEditingIssue((previous) =>
                                      previous
                                        ? { ...previous, reportedBy: event.target.value }
                                        : previous,
                                    )
                                  }
                                  required
                                />
                              </label>
                              {editingIssue.state === "chiusa" ? (
                                <label>
                                  Data chiusura
                                  <input
                                    type="date"
                                    value={editingIssue.closedDate}
                                    onChange={(event) =>
                                      setEditingIssue((previous) =>
                                        previous
                                          ? { ...previous, closedDate: event.target.value }
                                          : previous,
                                      )
                                    }
                                  />
                                </label>
                              ) : null}
                              <label className="eur-manager-form-full">
                                Nota
                                <textarea
                                  value={editingIssue.note}
                                  onChange={(event) =>
                                    setEditingIssue((previous) =>
                                      previous ? { ...previous, note: event.target.value } : previous,
                                    )
                                  }
                                  rows={3}
                                />
                              </label>
                              <div className="eur-modal-actions eur-modal-actions--end">
                                <button
                                  type="button"
                                  onClick={() => setEditingIssue(null)}
                                  disabled={saving}
                                >
                                  Annulla
                                </button>
                                <button type="submit" disabled={saving}>
                                  Salva modifica
                                </button>
                              </div>
                            </form>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : null}
            {dataManagerTab === "pending" ? (
              <section className="eur-manager-section">
                <div className="eur-section-head">
                  <div>
                    <h3>Manutenzioni da fare</h3>
                    <p>Modifica o elimina i record presenti in `euromecc_pending`.</p>
                  </div>
                </div>
                {filteredManagerPending.length === 0 ? (
                  <p className="eur-empty">Nessuna manutenzione da fare trovata con i filtri correnti.</p>
                ) : (
                  <div className="eur-manager-list">
                    {filteredManagerPending.map((item) => {
                      const isEditing = editingPending?.id === item.id;
                      const editArea = isEditing ? editingPending.areaKey : item.areaKey;
                      const editComponents = EUROMECC_AREAS[editArea]?.components ?? [];
                      return (
                        <article key={item.id} className="eur-manager-card">
                          <div className="eur-manager-card-head">
                            <div>
                              <strong>{item.title}</strong>
                              <div className="eur-task-meta">
                                <span>{item.areaLabel}</span>
                                <span>{item.subLabel}</span>
                                <span>{formatDateUI(item.dueDate)}</span>
                                <span>{formatDue(item.dueDate)}</span>
                              </div>
                            </div>
                            <div className="eur-task-actions">
                              <span className={miniPriorityClass(item.priority)}>
                                {PRIORITY_LABELS[item.priority]}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStartPendingEdit(item)}
                                disabled={saving}
                              >
                                Modifica
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeletePendingFromManager(item.id)}
                                disabled={saving}
                              >
                                Elimina
                              </button>
                            </div>
                          </div>
                          <div className="eur-task-meta">
                            {item.note ? <span>{item.note}</span> : <span>Nessuna nota</span>}
                          </div>
                          {isEditing && editingPending ? (
                            <form className="eur-form eur-manager-form" onSubmit={handleSavePendingEdit}>
                              <label>
                                Area
                                <select
                                  value={editingPending.areaKey}
                                  onChange={(event) => {
                                    const areaKey = event.target.value;
                                    setEditingPending((previous) =>
                                      previous
                                        ? {
                                            ...previous,
                                            areaKey,
                                            subKey: firstComponentKey(areaKey) ?? "",
                                          }
                                        : previous,
                                    );
                                  }}
                                >
                                  {EUROMECC_AREA_KEYS.map((areaKey) => (
                                    <option key={areaKey} value={areaKey}>
                                      {EUROMECC_AREAS[areaKey]?.title ?? areaKey}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Componente
                                <select
                                  value={editingPending.subKey}
                                  onChange={(event) =>
                                    setEditingPending((previous) =>
                                      previous ? { ...previous, subKey: event.target.value } : previous,
                                    )
                                  }
                                >
                                  {editComponents.map((component) => (
                                    <option key={component.key} value={component.key}>
                                      {component.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Priorita
                                <select
                                  value={editingPending.priority}
                                  onChange={(event) =>
                                    setEditingPending((previous) =>
                                      previous
                                        ? {
                                            ...previous,
                                            priority: event.target.value as EuromeccPriority,
                                          }
                                        : previous,
                                    )
                                  }
                                >
                                  <option value="alta">Alta</option>
                                  <option value="media">Media</option>
                                  <option value="bassa">Bassa</option>
                                </select>
                              </label>
                              <label>
                                Scadenza
                                <input
                                  type="date"
                                  value={editingPending.dueDate}
                                  onChange={(event) =>
                                    setEditingPending((previous) =>
                                      previous ? { ...previous, dueDate: event.target.value } : previous,
                                    )
                                  }
                                  required
                                />
                              </label>
                              <label className="eur-manager-form-full">
                                Titolo
                                <input
                                  type="text"
                                  value={editingPending.title}
                                  onChange={(event) =>
                                    setEditingPending((previous) =>
                                      previous ? { ...previous, title: event.target.value } : previous,
                                    )
                                  }
                                  required
                                />
                              </label>
                              <label className="eur-manager-form-full">
                                Nota
                                <textarea
                                  value={editingPending.note}
                                  onChange={(event) =>
                                    setEditingPending((previous) =>
                                      previous ? { ...previous, note: event.target.value } : previous,
                                    )
                                  }
                                  rows={3}
                                />
                              </label>
                              <div className="eur-modal-actions eur-modal-actions--end">
                                <button
                                  type="button"
                                  onClick={() => setEditingPending(null)}
                                  disabled={saving}
                                >
                                  Annulla
                                </button>
                                <button type="submit" disabled={saving}>
                                  Salva modifica
                                </button>
                              </div>
                            </form>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : null}
            {dataManagerTab === "done" ? (
              <section className="eur-manager-section">
                <div className="eur-section-head">
                  <div>
                    <h3>Manutenzioni fatte</h3>
                    <p>Modifica o elimina i record presenti in `euromecc_done`.</p>
                  </div>
                </div>
                {filteredManagerDone.length === 0 ? (
                  <p className="eur-empty">Nessuna manutenzione fatta trovata con i filtri correnti.</p>
                ) : (
                  <div className="eur-manager-list">
                    {filteredManagerDone.map((item) => {
                      const isEditing = editingDone?.id === item.id;
                      const editArea = isEditing ? editingDone.areaKey : item.areaKey;
                      const editComponents = EUROMECC_AREAS[editArea]?.components ?? [];
                      return (
                        <article key={item.id} className="eur-manager-card">
                          <div className="eur-manager-card-head">
                            <div>
                              <strong>{item.title}</strong>
                              <div className="eur-task-meta">
                                <span>{item.areaLabel}</span>
                                <span>{item.subLabel}</span>
                                <span>{formatDateUI(item.doneDate)}</span>
                                <span>{item.by}</span>
                              </div>
                            </div>
                            <div className="eur-task-actions">
                              <span className={badgeClass("done")}>Fatto</span>
                              <button
                                type="button"
                                onClick={() => handleStartDoneEdit(item)}
                                disabled={saving}
                              >
                                Modifica
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteDone(item.id)}
                                disabled={saving}
                              >
                                Elimina
                              </button>
                            </div>
                          </div>
                          <div className="eur-task-meta">
                            {item.nextDate ? <span>Prossima: {formatDateUI(item.nextDate)}</span> : null}
                            <span>{item.note || "Nessuna nota"}</span>
                          </div>
                          {isEditing && editingDone ? (
                            <form className="eur-form eur-manager-form" onSubmit={handleSaveDoneEdit}>
                              <label>
                                Area
                                <select
                                  value={editingDone.areaKey}
                                  onChange={(event) => {
                                    const areaKey = event.target.value;
                                    setEditingDone((previous) =>
                                      previous
                                        ? {
                                            ...previous,
                                            areaKey,
                                            subKey: firstComponentKey(areaKey) ?? "",
                                          }
                                        : previous,
                                    );
                                  }}
                                >
                                  {EUROMECC_AREA_KEYS.map((areaKey) => (
                                    <option key={areaKey} value={areaKey}>
                                      {EUROMECC_AREAS[areaKey]?.title ?? areaKey}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Componente
                                <select
                                  value={editingDone.subKey}
                                  onChange={(event) =>
                                    setEditingDone((previous) =>
                                      previous ? { ...previous, subKey: event.target.value } : previous,
                                    )
                                  }
                                >
                                  {editComponents.map((component) => (
                                    <option key={component.key} value={component.key}>
                                      {component.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Data intervento
                                <input
                                  type="date"
                                  value={editingDone.doneDate}
                                  onChange={(event) =>
                                    setEditingDone((previous) =>
                                      previous ? { ...previous, doneDate: event.target.value } : previous,
                                    )
                                  }
                                  required
                                />
                              </label>
                              <label>
                                Fatta da
                                <input
                                  type="text"
                                  value={editingDone.by}
                                  onChange={(event) =>
                                    setEditingDone((previous) =>
                                      previous ? { ...previous, by: event.target.value } : previous,
                                    )
                                  }
                                  required
                                />
                              </label>
                              <label className="eur-manager-form-full">
                                Titolo
                                <input
                                  type="text"
                                  value={editingDone.title}
                                  onChange={(event) =>
                                    setEditingDone((previous) =>
                                      previous ? { ...previous, title: event.target.value } : previous,
                                    )
                                  }
                                  required
                                />
                              </label>
                              <label>
                                Prossima scadenza
                                <input
                                  type="date"
                                  value={editingDone.nextDate}
                                  onChange={(event) =>
                                    setEditingDone((previous) =>
                                      previous ? { ...previous, nextDate: event.target.value } : previous,
                                    )
                                  }
                                />
                              </label>
                              <label className="eur-checkbox">
                                <input
                                  type="checkbox"
                                  checked={editingDone.closedPending}
                                  onChange={(event) =>
                                    setEditingDone((previous) =>
                                      previous
                                        ? { ...previous, closedPending: event.target.checked }
                                        : previous,
                                    )
                                  }
                                />
                                <span>Chiude manutenzioni aperte collegate</span>
                              </label>
                              <label className="eur-manager-form-full">
                                Nota
                                <textarea
                                  value={editingDone.note}
                                  onChange={(event) =>
                                    setEditingDone((previous) =>
                                      previous ? { ...previous, note: event.target.value } : previous,
                                    )
                                  }
                                  rows={3}
                                />
                              </label>
                              <div className="eur-modal-actions eur-modal-actions--end">
                                <button type="button" onClick={() => setEditingDone(null)} disabled={saving}>
                                  Annulla
                                </button>
                                <button type="submit" disabled={saving}>
                                  Salva modifica
                                </button>
                              </div>
                            </form>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : null}
          </div>
        </div>
      ) : null}

      {cementModalOpen && snapshot && currentAreaData.type === "silo" ? (
        <div
          className="eur-modal-overlay"
          onClick={() => setCementModalOpen(false)}
          role="presentation"
        >
          <div
            className="eur-modal eur-modal--small"
            role="dialog"
            aria-modal="true"
            aria-label={`Tipo cemento ${currentAreaData.title}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="eur-modal-header">
              <div>
                <span className="eur-eyebrow">Silo</span>
                <h2>{currentAreaData.title}</h2>
                <p>Imposta o modifica il tipo cemento visibile nella mappa Home.</p>
              </div>
            </div>
            <form className="eur-form" onSubmit={handleSaveCementType}>
              <div className="eur-form-group">
                <span className="eur-form-label">Preset rapidi</span>
                <div className="eur-preset-list">
                  {CEMENT_TYPE_PRESETS.map((preset) => (
                    <button
                      key={preset.full}
                      type="button"
                      className={
                        cementTypeDraft === preset.full ? "eur-preset-chip active" : "eur-preset-chip"
                      }
                      onClick={() => handleSelectCementPreset(preset)}
                    >
                      {preset.full}
                    </button>
                  ))}
                </div>
              </div>
              <label>
                Nome completo
                <input
                  type="text"
                  value={cementTypeDraft}
                  onChange={(event) => setCementTypeDraft(event.target.value)}
                  placeholder="Es. CEM II/A-L 42.5 R"
                />
              </label>
              <label>
                Sigla breve
                <input
                  type="text"
                  value={cementTypeShortDraft}
                  onChange={(event) => setCementTypeShortDraft(event.target.value)}
                  placeholder="Es. II/A-L 42.5R"
                />
              </label>
              <div className="eur-modal-actions eur-modal-actions--end">
                <button type="button" onClick={() => setCementModalOpen(false)} disabled={saving}>
                  Annulla
                </button>
                <button type="submit" disabled={saving}>
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
