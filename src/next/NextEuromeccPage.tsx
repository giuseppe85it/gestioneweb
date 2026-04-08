import { useEffect, useMemo, useState } from "react";
import {
  EUROMECC_AREAS,
  EUROMECC_AREA_KEYS,
  type EuromeccAreaStatic,
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

type TabKey = "home" | "maintenance" | "issues" | "report";
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
  { key: "fluidificanti", x: 442, y: 726, width: 306, height: 62 },
  { key: "plc", x: 958, y: 676, width: 250, height: 56 },
  { key: "buffer", x: 958, y: 746, width: 250, height: 56 },
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

function buildReportText(snapshot: EuromeccSnapshot, range: EuromeccRange) {
  const pending = snapshot.pending.filter((item) => withinRange(item.dueDate, range));
  const issues = snapshot.issues.filter(
    (item) => item.state !== "chiusa" && withinRange(item.reportedAt, range),
  );
  const done = snapshot.done.filter((item) => withinRange(item.doneDate, range));
  const urgencies = [
    ...pending
      .filter((item) => item.priority === "alta")
      .map((item) => ({
        kind: "MANUTENZIONE",
        area: item.areaLabel,
        sub: item.subLabel,
        title: item.title,
      })),
    ...issues
      .filter((item) => item.type !== "osservazione")
      .map((item) => ({
        kind: "PROBLEMA",
        area: item.areaLabel,
        sub: item.subLabel,
        title: item.title,
      })),
  ];

  return [
    "RIEPILOGO IMPIANTO EUROMECC",
    `Periodo: ${RANGE_OPTIONS.find((item) => item.value === range)?.label ?? "Tutto"}`,
    "",
    "1. PROBLEMI SEGNALATI APERTI",
    ...(issues.length
      ? issues.map(
          (item) =>
            `- ${item.areaLabel} / ${item.subLabel}: ${item.title} | da controllare: ${item.check} | tipo: ${ISSUE_TYPE_LABELS[item.type]}`,
        )
      : ["- Nessun problema aperto nel periodo selezionato"]),
    "",
    "2. MANUTENZIONI DA ESEGUIRE",
    ...(pending.length
      ? pending.map(
          (item) =>
            `- ${item.areaLabel} / ${item.subLabel}: ${item.title} | scadenza: ${formatDateUI(item.dueDate)} | priorita: ${PRIORITY_LABELS[item.priority]}`,
        )
      : ["- Nessuna manutenzione da eseguire nel periodo selezionato"]),
    "",
    "3. MANUTENZIONI FATTE",
    ...(done.length
      ? done.map(
          (item) =>
            `- ${item.areaLabel} / ${item.subLabel}: ${item.title} | fatta il ${formatDateUI(item.doneDate)} da ${item.by}`,
        )
      : ["- Nessuna manutenzione registrata nel periodo selezionato"]),
    "",
    "4. URGENZE DI LAVORO",
    ...(urgencies.length
      ? urgencies.map((item) => `- ${item.kind}: ${item.area} / ${item.sub} | ${item.title}`)
      : ["- Nessuna urgenza nel periodo selezionato"]),
  ].join("\n");
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
          {area.title}
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

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
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

  const reportText = useMemo(
    () => (snapshot ? buildReportText(snapshot, reportRange) : ""),
    [reportRange, snapshot],
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

  const handleCopyReport = async () => {
    try {
      await copyText(reportText);
      setNotice("Riepilogo copiato negli appunti.");
    } catch {
      setError("Impossibile copiare il riepilogo negli appunti.");
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
            <>
              <KpiGrid items={reportKpis} />
              <div className="eur-report-grid">
                <section className="eur-segment">
                  <div className="eur-section-head">
                    <div>
                      <h2>Filtro periodo</h2>
                      <p>Genera un riepilogo sintetico pronto da condividere.</p>
                    </div>
                  </div>
                  <div className="eur-range-switch">
                    {RANGE_OPTIONS.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        className={reportRange === item.value ? "active" : ""}
                        onClick={() => setReportRange(item.value)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <div className="eur-report-actions">
                    <button type="button" onClick={() => setNotice("Riepilogo aggiornato.")}>
                      Aggiorna riepilogo
                    </button>
                    <button type="button" onClick={() => void handleCopyReport()}>
                      Copia testo
                    </button>
                    <button type="button" onClick={() => window.print()}>
                      Stampa / PDF
                    </button>
                  </div>
                </section>
                <section className="eur-segment">
                  <div className="eur-section-head">
                    <div>
                      <h2>Riepilogo testuale</h2>
                      <p>Testo generato automaticamente dal dominio Euromecc.</p>
                    </div>
                  </div>
                  <textarea className="eur-report-box" readOnly value={reportText} rows={22} />
                </section>
              </div>
            </>
          ) : null}
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
                currentAreaData.type === "silo" ? "eur-modal-body--silo" : ""
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
