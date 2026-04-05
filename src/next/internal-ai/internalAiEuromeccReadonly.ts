import {
  daysAgo,
  getAreaStatus,
  getSubStatus,
  readEuromeccSnapshot,
  type EuromeccIssue,
  type EuromeccPendingTask,
  type EuromeccSnapshot,
  type EuromeccStatus,
} from "../domain/nextEuromeccDomain";
import { EUROMECC_AREAS, type EuromeccAreaStatic } from "../euromeccAreas";
import type { InternalAiChatTurnResult } from "./internalAiChatOrchestrator";
import type { InternalAiChatMessageReference } from "./internalAiTypes";

type InternalAiEuromeccComponentSnapshot = {
  subKey: string;
  subLabel: string;
  code: string;
  status: EuromeccStatus;
};

type InternalAiEuromeccAreaSnapshot = {
  areaKey: string;
  title: string;
  shortLabel: string;
  code: string;
  type: EuromeccAreaStatic["type"];
  area: string;
  status: EuromeccStatus;
  cementType: string | null;
  cementTypeShort: string | null;
  pending: EuromeccPendingTask[];
  openIssues: EuromeccIssue[];
  closedIssues: EuromeccIssue[];
  recentDoneCount: number;
  lastDoneDate: string | null;
  components: InternalAiEuromeccComponentSnapshot[];
};

export type InternalAiEuromeccReadonlySnapshot = {
  generatedAt: string;
  counts: {
    areas: number;
    silos: number;
    silosWithCement: number;
    silosWithoutCement: number;
    pendingOpen: number;
    issuesOpen: number;
    issuesClosed: number;
    recentDone30d: number;
    areasWithPendingAndIssues: number;
  };
  areas: InternalAiEuromeccAreaSnapshot[];
  silosWithoutCement: InternalAiEuromeccAreaSnapshot[];
  areasWithPendingAndIssues: InternalAiEuromeccAreaSnapshot[];
  criticalAreas: InternalAiEuromeccAreaSnapshot[];
  sourceSnapshot: EuromeccSnapshot;
};

function normalizePrompt(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatCount(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

function formatStatusLabel(status: EuromeccStatus): string {
  switch (status) {
    case "maint":
      return "manutenzioni aperte";
    case "issue":
      return "criticita aperte";
    case "obs":
      return "osservazioni aperte";
    case "done":
      return "intervento recente";
    case "check":
      return "controllo da verificare";
    default:
      return "ok";
  }
}

function formatIssueLabel(issue: EuromeccIssue): string {
  return `${issue.subLabel}: ${issue.title} (${issue.type})`;
}

function formatPendingLabel(task: EuromeccPendingTask): string {
  return `${task.subLabel}: ${task.title} entro ${task.dueDate}`;
}

function sortCriticalAreas(left: InternalAiEuromeccAreaSnapshot, right: InternalAiEuromeccAreaSnapshot) {
  const leftScore =
    left.openIssues.filter((item) => item.type !== "osservazione").length * 3 +
    left.openIssues.filter((item) => item.type === "osservazione").length +
    left.pending.length * 2;
  const rightScore =
    right.openIssues.filter((item) => item.type !== "osservazione").length * 3 +
    right.openIssues.filter((item) => item.type === "osservazione").length +
    right.pending.length * 2;

  if (leftScore !== rightScore) {
    return rightScore - leftScore;
  }

  const leftLastDone = left.lastDoneDate ?? "";
  const rightLastDone = right.lastDoneDate ?? "";
  if (leftLastDone !== rightLastDone) {
    return leftLastDone.localeCompare(rightLastDone);
  }

  return left.title.localeCompare(right.title, "it");
}

function buildAreaSnapshot(areaKey: string, snapshot: EuromeccSnapshot): InternalAiEuromeccAreaSnapshot {
  const area = EUROMECC_AREAS[areaKey];
  const pending = snapshot.pending.filter((item) => item.areaKey === areaKey);
  const openIssues = snapshot.issues.filter((item) => item.areaKey === areaKey && item.state === "aperta");
  const closedIssues = snapshot.issues.filter((item) => item.areaKey === areaKey && item.state === "chiusa");
  const relatedDone = snapshot.done.filter((item) => item.areaKey === areaKey);
  const recentDone = relatedDone.filter((item) => {
    const age = daysAgo(item.doneDate);
    return Number.isFinite(age) && age >= 0 && age <= 30;
  });
  const lastDoneDate = relatedDone
    .map((item) => item.doneDate)
    .filter(Boolean)
    .sort((left, right) => right.localeCompare(left))[0] ?? null;

  return {
    areaKey,
    title: area.title,
    shortLabel: area.shortLabel,
    code: area.code,
    type: area.type,
    area: area.area,
    status: getAreaStatus(
      areaKey,
      area.components.map((component) => ({ key: component.key, base: component.base })),
      snapshot,
    ),
    cementType: area.type === "silo" ? snapshot.cementTypesByArea[areaKey] ?? null : null,
    cementTypeShort: area.type === "silo" ? snapshot.cementTypeShortByArea[areaKey] ?? null : null,
    pending,
    openIssues,
    closedIssues,
    recentDoneCount: recentDone.length,
    lastDoneDate,
    components: area.components.map((component) => ({
      subKey: component.key,
      subLabel: component.name,
      code: component.code,
      status: getSubStatus(areaKey, component.key, component.base, snapshot),
    })),
  };
}

const AREA_MATCHERS: Array<{ pattern: RegExp; areaKeys: string[] }> = [
  { pattern: /\bsilo\s*1\b/, areaKeys: ["silo1"] },
  { pattern: /\bsilo\s*2\s*a\b|\bsilo\s*2a\b/, areaKeys: ["silo2a"] },
  { pattern: /\bsilo\s*2\s*b\b|\bsilo\s*2b\b/, areaKeys: ["silo2b"] },
  { pattern: /\bsilo\s*2\b/, areaKeys: ["silo2a", "silo2b"] },
  { pattern: /\bsilo\s*3\b/, areaKeys: ["silo3"] },
  { pattern: /\bsilo\s*4\b/, areaKeys: ["silo4"] },
  { pattern: /\bsilo\s*5\b/, areaKeys: ["silo5"] },
  { pattern: /\bsilo\s*6\s*a\b|\bsilo\s*6a\b/, areaKeys: ["silo6a"] },
  { pattern: /\bsilo\s*6\s*b\b|\bsilo\s*6b\b/, areaKeys: ["silo6b"] },
  { pattern: /\bsilo\s*6\b/, areaKeys: ["silo6a", "silo6b"] },
  { pattern: /\bsilo\s*7\b/, areaKeys: ["silo7"] },
  { pattern: /\bfiltri silo\b/, areaKeys: ["filtriSilo"] },
  { pattern: /\bcoclee\b|\bmotori\b|\bingrassaggi\b|\blinee silo\b/, areaKeys: ["lineeSilo"] },
  { pattern: /\bcarico camion 1\b/, areaKeys: ["carico1"] },
  { pattern: /\bcarico camion 2\b/, areaKeys: ["carico2"] },
  { pattern: /\bcarico ferrovia\b|\brail\b|\bferrovia\b/, areaKeys: ["caricoRail"] },
  { pattern: /\bfiltri punti di carico\b/, areaKeys: ["filtriCarico"] },
  { pattern: /\bcompressore\b|\bblower\b/, areaKeys: ["compressore"] },
  { pattern: /\bfluidificanti\b/, areaKeys: ["fluidificanti"] },
  { pattern: /\bplc\b|\bhmi\b|\bquadro\b/, areaKeys: ["plc"] },
  { pattern: /\bbuffer\b|\bpesatura\b/, areaKeys: ["buffer"] },
];

function matchAreas(prompt: string, snapshot: InternalAiEuromeccReadonlySnapshot): InternalAiEuromeccAreaSnapshot[] {
  const normalized = normalizePrompt(prompt);
  const matchedKeys = new Set<string>();

  AREA_MATCHERS.forEach((entry) => {
    if (entry.pattern.test(normalized)) {
      entry.areaKeys.forEach((areaKey) => matchedKeys.add(areaKey));
    }
  });

  return snapshot.areas.filter((area) => matchedKeys.has(area.areaKey));
}

function buildReferences(message: string): InternalAiChatMessageReference[] {
  return [
    {
      type: "architecture_doc",
      label: "Dominio rilevato: Euromecc nativo NEXT",
      targa: null,
    },
    {
      type: "safe_mode_notice",
      label: "Euromecc letto in sola lettura dal retriever IA dedicato",
      targa: null,
    },
    {
      type: "integration_guidance",
      label: message,
      targa: null,
    },
  ];
}

function buildGeneralStateText(snapshot: InternalAiEuromeccReadonlySnapshot): string {
  const critical = snapshot.criticalAreas.slice(0, 3);
  const crossed = snapshot.areasWithPendingAndIssues.slice(0, 3);
  const missingCement = snapshot.silosWithoutCement.slice(0, 4).map((item) => item.title);

  return [
    "Stato generale Euromecc:",
    `- Aree censite: ${snapshot.counts.areas}, sili: ${snapshot.counts.silos}`,
    `- Problemi aperti: ${formatCount(snapshot.counts.issuesOpen, "voce", "voci")}`,
    `- Manutenzioni da fare: ${formatCount(snapshot.counts.pendingOpen, "attivita", "attivita")}`,
    `- Problemi chiusi: ${formatCount(snapshot.counts.issuesClosed, "voce", "voci")}`,
    `- Interventi eseguiti negli ultimi 30 giorni: ${formatCount(snapshot.counts.recentDone30d, "intervento", "interventi")}`,
    critical.length > 0
      ? `- Aree piu critiche: ${critical
          .map(
            (area) =>
              `${area.title} (${formatCount(area.openIssues.length, "problema aperto", "problemi aperti")}, ${formatCount(area.pending.length, "pending", "pending")})`,
          )
          .join("; ")}`
      : "- Aree piu critiche: nessuna area con criticita aperte o manutenzioni pendenti.",
    crossed.length > 0
      ? `- Aree con anomalie aperte e manutenzioni pendenti insieme: ${crossed.map((item) => item.title).join(", ")}`
      : "- Non risultano aree con anomalie aperte e manutenzioni pendenti insieme.",
    missingCement.length > 0
      ? `- Sili senza cemento impostato: ${missingCement.join(", ")}`
      : "- Tutti i sili hanno un cemento impostato.",
  ].join("\n");
}

function buildOpenIssuesText(snapshot: InternalAiEuromeccReadonlySnapshot): string {
  const openIssues = snapshot.areas.flatMap((area) =>
    area.openIssues.map((issue) => ({ area, issue })),
  );

  if (openIssues.length === 0) {
    return "Non risultano problemi aperti nell'impianto Euromecc.";
  }

  return [
    `Problemi aperti Euromecc: ${formatCount(openIssues.length, "voce", "voci")}.`,
    ...openIssues.slice(0, 8).map(
      ({ area, issue }) => `- ${area.title} -> ${formatIssueLabel(issue)}`,
    ),
    openIssues.length > 8 ? "- Altre voci aperte presenti nel modulo Euromecc." : null,
  ]
    .filter((entry): entry is string => Boolean(entry))
    .join("\n");
}

function buildPendingText(snapshot: InternalAiEuromeccReadonlySnapshot): string {
  const pending = snapshot.areas.flatMap((area) => area.pending.map((task) => ({ area, task })));

  if (pending.length === 0) {
    return "Non risultano manutenzioni da fare aperte nell'impianto Euromecc.";
  }

  return [
    `Manutenzioni da fare Euromecc: ${formatCount(pending.length, "attivita", "attivita")}.`,
    ...pending.slice(0, 8).map(
      ({ area, task }) => `- ${area.title} -> ${formatPendingLabel(task)}`,
    ),
    pending.length > 8 ? "- Altre attivita pendenti presenti nel modulo Euromecc." : null,
  ]
    .filter((entry): entry is string => Boolean(entry))
    .join("\n");
}

function buildCementText(
  matchedAreas: InternalAiEuromeccAreaSnapshot[],
  snapshot: InternalAiEuromeccReadonlySnapshot,
): string {
  const silos = matchedAreas.filter((area) => area.type === "silo");
  if (silos.length === 0) {
    const allConfigured = snapshot.areas.filter((area) => area.type === "silo" && area.cementType);
    if (allConfigured.length === 0) {
      return "Non risultano sili Euromecc con un tipo cemento impostato.";
    }

    return [
      "Tipi cemento rilevati sui sili Euromecc:",
      ...allConfigured
        .slice(0, 8)
        .map(
          (area) =>
            `- ${area.title}: ${area.cementType}${area.cementTypeShort ? ` (sigla ${area.cementTypeShort})` : ""}`,
        ),
    ].join("\n");
  }

  return [
    "Tipo cemento per i sili richiesti:",
    ...silos.map((area) =>
      area.cementType
        ? `- ${area.title}: ${area.cementType}${area.cementTypeShort ? ` (sigla ${area.cementTypeShort})` : ""}`
        : `- ${area.title}: NON IMPOSTATO`,
    ),
  ].join("\n");
}

function buildMissingCementText(snapshot: InternalAiEuromeccReadonlySnapshot): string {
  if (snapshot.silosWithoutCement.length === 0) {
    return "Non risultano sili senza cemento impostato nell'impianto Euromecc.";
  }

  return [
    `Sili senza cemento impostato: ${formatCount(
      snapshot.silosWithoutCement.length,
      "silo",
      "sili",
    )}.`,
    ...snapshot.silosWithoutCement.map((area) => `- ${area.title}`),
  ].join("\n");
}

function buildAreaSummaryText(area: InternalAiEuromeccAreaSnapshot): string {
  return [
    `Riepilogo ${area.title}:`,
    `- Stato area: ${formatStatusLabel(area.status)}`,
    `- Pending aperti: ${formatCount(area.pending.length, "attivita", "attivita")}`,
    `- Problemi aperti: ${formatCount(area.openIssues.length, "voce", "voci")}`,
    `- Problemi chiusi: ${formatCount(area.closedIssues.length, "voce", "voci")}`,
    `- Interventi ultimi 30 giorni: ${formatCount(area.recentDoneCount, "intervento", "interventi")}`,
    area.type === "silo"
      ? `- Tipo cemento: ${area.cementType ? area.cementType : "NON IMPOSTATO"}${
          area.cementTypeShort ? ` (sigla ${area.cementTypeShort})` : ""
        }`
      : null,
    area.pending.length > 0
      ? `- Pending visibili: ${area.pending.slice(0, 3).map(formatPendingLabel).join("; ")}`
      : null,
    area.openIssues.length > 0
      ? `- Problemi aperti: ${area.openIssues.slice(0, 3).map(formatIssueLabel).join("; ")}`
      : null,
  ]
    .filter((entry): entry is string => Boolean(entry))
    .join("\n");
}

function buildCriticalAreaText(snapshot: InternalAiEuromeccReadonlySnapshot): string {
  const criticalArea = snapshot.criticalAreas[0] ?? null;
  if (!criticalArea) {
    return "Non emerge una area critica Euromecc: al momento non risultano issue aperte o pending aperti.";
  }

  return [
    `L'area Euromecc piu critica oggi e ${criticalArea.title}.`,
    `- Problemi aperti: ${formatCount(criticalArea.openIssues.length, "voce", "voci")}`,
    `- Manutenzioni pendenti: ${formatCount(criticalArea.pending.length, "attivita", "attivita")}`,
    `- Stato area: ${formatStatusLabel(criticalArea.status)}`,
  ].join("\n");
}

export function isInternalAiEuromeccPromptCandidate(prompt: string): boolean {
  const normalized = normalizePrompt(prompt);
  return /\beuromecc\b|\bsilo\b|\bcemento\b|\bblower\b|\bfluidificant/i.test(normalized);
}

export async function readInternalAiEuromeccReadonlySnapshot(): Promise<InternalAiEuromeccReadonlySnapshot> {
  const sourceSnapshot = await readEuromeccSnapshot();
  const areas = Object.keys(EUROMECC_AREAS).map((areaKey) => buildAreaSnapshot(areaKey, sourceSnapshot));
  const silos = areas.filter((area) => area.type === "silo");
  const silosWithoutCement = silos.filter((area) => !area.cementType);
  const areasWithPendingAndIssues = areas.filter(
    (area) => area.pending.length > 0 && area.openIssues.length > 0,
  );
  const criticalAreas = [...areas]
    .filter((area) => area.pending.length > 0 || area.openIssues.length > 0)
    .sort(sortCriticalAreas);

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      areas: areas.length,
      silos: silos.length,
      silosWithCement: silos.filter((area) => Boolean(area.cementType)).length,
      silosWithoutCement: silosWithoutCement.length,
      pendingOpen: sourceSnapshot.pending.length,
      issuesOpen: sourceSnapshot.issues.filter((item) => item.state === "aperta").length,
      issuesClosed: sourceSnapshot.issues.filter((item) => item.state === "chiusa").length,
      recentDone30d: sourceSnapshot.done.filter((item) => {
        const age = daysAgo(item.doneDate);
        return Number.isFinite(age) && age >= 0 && age <= 30;
      }).length,
      areasWithPendingAndIssues: areasWithPendingAndIssues.length,
    },
    areas,
    silosWithoutCement,
    areasWithPendingAndIssues,
    criticalAreas,
    sourceSnapshot,
  };
}

export function buildInternalAiEuromeccChatResult(
  prompt: string,
  snapshot: InternalAiEuromeccReadonlySnapshot,
): InternalAiChatTurnResult {
  const normalized = normalizePrompt(prompt);
  const matchedAreas = matchAreas(normalized, snapshot);

  let assistantText = buildGeneralStateText(snapshot);
  if (
    /\bsenza cemento\b/.test(normalized) ||
    (/\bsili\b/.test(normalized) && /\bsenza\b/.test(normalized))
  ) {
    assistantText = buildMissingCementText(snapshot);
  } else if (
    /\bstato euromecc\b/.test(normalized) ||
    /\briepilogo stato euromecc\b/.test(normalized) ||
    /\bstato generale\b/.test(normalized) ||
    /\briepilogo stato\b/.test(normalized)
  ) {
    assistantText = buildGeneralStateText(snapshot);
  } else if (
    /\bproblemi\b.*\bapert|\bproblemi aperti\b|\banomalie aperte\b|\bissue aperte\b/.test(normalized)
  ) {
    assistantText = buildOpenIssuesText(snapshot);
  } else if (
    /\bmanutenzion/i.test(normalized) &&
    (/\bda fare\b/.test(normalized) || /\bpendent/i.test(normalized) || /\baperte\b/.test(normalized))
  ) {
    assistantText = buildPendingText(snapshot);
  } else if (
    /\bcemento\b/.test(normalized) &&
    (matchedAreas.length > 0 || /\bsili\b/.test(normalized) || /\bsilo\b/.test(normalized))
  ) {
    assistantText = buildCementText(matchedAreas, snapshot);
  } else if (/\barea piu critic|\barea piu critica\b|\bpiu critica\b/.test(normalized)) {
    assistantText = buildCriticalAreaText(snapshot);
  } else if (
    matchedAreas.length > 0 &&
    (/\briepilogo\b/.test(normalized) || /\bstato\b/.test(normalized) || /\barea\b/.test(normalized))
  ) {
    assistantText = matchedAreas.slice(0, 3).map(buildAreaSummaryText).join("\n\n");
  }

  return {
    intent: "richiesta_generica",
    status: "completed",
    assistantText,
    references: buildReferences("Modulo target: /next/euromecc"),
    report: null,
  };
}
