import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  EUROMECC_AREAS,
  getEuromeccAreaLabel,
  type EuromeccBaseStatus,
} from "../euromeccAreas";
import { formatDateInput, formatDateUI, toNextDateValue } from "../nextDateFormat";

export const EUROMECC_PENDING_COLLECTION = "euromecc_pending";
export const EUROMECC_DONE_COLLECTION = "euromecc_done";
export const EUROMECC_ISSUES_COLLECTION = "euromecc_issues";
export const EUROMECC_AREA_META_COLLECTION = "euromecc_area_meta";

export type EuromeccStatus = EuromeccBaseStatus | "maint" | "issue" | "done" | "obs";
export type EuromeccPriority = "alta" | "media" | "bassa";
export type EuromeccIssueType = "criticita" | "anomalia" | "osservazione";
export type EuromeccIssueState = "aperta" | "chiusa";
export type EuromeccRange = "30" | "60" | "90" | "all";

type EuromeccFirestoreMeta = {
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type EuromeccPendingDoc = EuromeccFirestoreMeta & {
  areaKey: string;
  subKey: string;
  title: string;
  priority: EuromeccPriority;
  dueDate: string;
  note: string;
};

export type EuromeccDoneDoc = EuromeccFirestoreMeta & {
  areaKey: string;
  subKey: string;
  title: string;
  doneDate: string;
  by: string;
  note: string;
  nextDate: string | null;
  closedPending: boolean;
};

export type EuromeccIssueDoc = EuromeccFirestoreMeta & {
  areaKey: string;
  subKey: string;
  title: string;
  check: string;
  type: EuromeccIssueType;
  state: EuromeccIssueState;
  reportedAt: string;
  reportedBy: string;
  note: string;
  closedDate?: string | null;
};

export type EuromeccAreaMetaDoc = EuromeccFirestoreMeta & {
  areaKey: string;
  cementType: string;
  cementTypeShort?: string | null;
  updatedBy?: string | null;
};

export type EuromeccPendingTask = {
  id: string;
  areaKey: string;
  areaLabel: string;
  subKey: string;
  subLabel: string;
  title: string;
  priority: EuromeccPriority;
  dueDate: string;
  note: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type EuromeccDoneTask = {
  id: string;
  areaKey: string;
  areaLabel: string;
  subKey: string;
  subLabel: string;
  title: string;
  doneDate: string;
  by: string;
  note: string;
  nextDate: string | null;
  closedPending: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type EuromeccIssue = {
  id: string;
  areaKey: string;
  areaLabel: string;
  subKey: string;
  subLabel: string;
  title: string;
  check: string;
  type: EuromeccIssueType;
  state: EuromeccIssueState;
  reportedAt: string;
  reportedBy: string;
  note: string;
  closedDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type EuromeccAreaMeta = {
  id: string;
  areaKey: string;
  cementType: string;
  cementTypeShort: string;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type EuromeccSnapshot = {
  pending: EuromeccPendingTask[];
  done: EuromeccDoneTask[];
  issues: EuromeccIssue[];
  areaMeta: EuromeccAreaMeta[];
  cementTypesByArea: Record<string, string>;
  cementTypeShortByArea: Record<string, string>;
  loadedAt: string;
};

export type AddEuromeccPendingTaskInput = Omit<EuromeccPendingDoc, "createdAt" | "updatedAt">;
export type AddEuromeccDoneTaskInput = Omit<EuromeccDoneDoc, "createdAt" | "updatedAt">;
export type AddEuromeccIssueInput = Omit<EuromeccIssueDoc, "createdAt" | "updatedAt" | "state" | "closedDate">;
export type UpdateEuromeccPendingTaskInput = AddEuromeccPendingTaskInput & { id: string };
export type UpdateEuromeccDoneTaskInput = AddEuromeccDoneTaskInput & { id: string };
export type UpdateEuromeccIssueInput = Omit<EuromeccIssueDoc, "createdAt" | "updatedAt"> & { id: string };
export type SaveEuromeccAreaMetaInput = {
  areaKey: string;
  cementType: string;
  cementTypeShort?: string | null;
  updatedBy?: string | null;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRequiredText(value: unknown, field: string): string {
  const normalized = normalizeText(value);
  if (!normalized) {
    throw new Error(`Campo obbligatorio mancante: ${field}`);
  }
  return normalized;
}

function normalizeIsoDate(value: unknown, field: string, required = true): string | null {
  const raw = normalizeText(value);
  if (!raw) {
    if (required) {
      throw new Error(`Data obbligatoria mancante: ${field}`);
    }
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const parsed = toNextDateValue(raw);
  if (!parsed) {
    throw new Error(`Formato data non valido per ${field}`);
  }

  return formatDateInput(parsed);
}

function timestampToMillis(value: Timestamp | null | undefined): number {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  return 0;
}

function areaLabel(areaKey: string): string {
  return getEuromeccAreaLabel(areaKey);
}

function subLabel(areaKey: string, subKey: string): string {
  const area = EUROMECC_AREAS[areaKey];
  const component = area?.components.find((item) => item.key === subKey);
  return component?.name ?? subKey;
}

function normalizePriority(value: unknown): EuromeccPriority {
  const raw = normalizeText(value).toLowerCase();
  if (raw === "alta" || raw === "media" || raw === "bassa") return raw;
  return "media";
}

function normalizeIssueType(value: unknown): EuromeccIssueType {
  const raw = normalizeText(value).toLowerCase();
  if (raw === "criticita" || raw === "anomalia" || raw === "osservazione") return raw;
  return "anomalia";
}

function normalizeIssueState(value: unknown): EuromeccIssueState {
  return normalizeText(value).toLowerCase() === "chiusa" ? "chiusa" : "aperta";
}

export function deriveEuromeccCementTypeShortLabel(value: string): string {
  const normalized = normalizeText(value);
  if (!normalized) return "";

  const withoutPrefix = normalized.replace(/^CEM\s+/i, "").replace(/\s+/g, " ").trim();
  const collapsedSuffix = withoutPrefix.replace(/(\d+(?:\.\d+)?)\s+([A-Z])$/i, "$1$2");

  if (collapsedSuffix.length <= 18) {
    return collapsedSuffix;
  }

  return `${collapsedSuffix.slice(0, 15).trimEnd()}...`;
}

function todayIso(): string {
  return formatDateInput(new Date());
}

function compareIsoAsc(left: string | null, right: string | null): number {
  if (left === right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return left.localeCompare(right);
}

function compareIsoDesc(left: string | null, right: string | null): number {
  return compareIsoAsc(right, left);
}

function mapPendingDoc(id: string, raw: Partial<EuromeccPendingDoc>): EuromeccPendingTask {
  return {
    id,
    areaKey: normalizeRequiredText(raw.areaKey, "areaKey"),
    areaLabel: areaLabel(normalizeRequiredText(raw.areaKey, "areaKey")),
    subKey: normalizeRequiredText(raw.subKey, "subKey"),
    subLabel: subLabel(
      normalizeRequiredText(raw.areaKey, "areaKey"),
      normalizeRequiredText(raw.subKey, "subKey"),
    ),
    title: normalizeRequiredText(raw.title, "title"),
    priority: normalizePriority(raw.priority),
    dueDate: normalizeIsoDate(raw.dueDate, "dueDate") ?? todayIso(),
    note: normalizeText(raw.note),
    createdAt: formatDateInput(raw.createdAt ?? null) || null,
    updatedAt: formatDateInput(raw.updatedAt ?? null) || null,
  };
}

function mapDoneDoc(id: string, raw: Partial<EuromeccDoneDoc>): EuromeccDoneTask {
  return {
    id,
    areaKey: normalizeRequiredText(raw.areaKey, "areaKey"),
    areaLabel: areaLabel(normalizeRequiredText(raw.areaKey, "areaKey")),
    subKey: normalizeRequiredText(raw.subKey, "subKey"),
    subLabel: subLabel(
      normalizeRequiredText(raw.areaKey, "areaKey"),
      normalizeRequiredText(raw.subKey, "subKey"),
    ),
    title: normalizeRequiredText(raw.title, "title"),
    doneDate: normalizeIsoDate(raw.doneDate, "doneDate") ?? todayIso(),
    by: normalizeRequiredText(raw.by, "by"),
    note: normalizeText(raw.note),
    nextDate: normalizeIsoDate(raw.nextDate, "nextDate", false),
    closedPending: Boolean(raw.closedPending),
    createdAt: formatDateInput(raw.createdAt ?? null) || null,
    updatedAt: formatDateInput(raw.updatedAt ?? null) || null,
  };
}

function mapIssueDoc(id: string, raw: Partial<EuromeccIssueDoc>): EuromeccIssue {
  return {
    id,
    areaKey: normalizeRequiredText(raw.areaKey, "areaKey"),
    areaLabel: areaLabel(normalizeRequiredText(raw.areaKey, "areaKey")),
    subKey: normalizeRequiredText(raw.subKey, "subKey"),
    subLabel: subLabel(
      normalizeRequiredText(raw.areaKey, "areaKey"),
      normalizeRequiredText(raw.subKey, "subKey"),
    ),
    title: normalizeRequiredText(raw.title, "title"),
    check: normalizeRequiredText(raw.check, "check"),
    type: normalizeIssueType(raw.type),
    state: normalizeIssueState(raw.state),
    reportedAt: normalizeIsoDate(raw.reportedAt, "reportedAt") ?? todayIso(),
    reportedBy: normalizeRequiredText(raw.reportedBy, "reportedBy"),
    note: normalizeText(raw.note),
    closedDate: normalizeIsoDate(raw.closedDate, "closedDate", false),
    createdAt: formatDateInput(raw.createdAt ?? null) || null,
    updatedAt: formatDateInput(raw.updatedAt ?? null) || null,
  };
}

function mapAreaMetaDoc(id: string, raw: Partial<EuromeccAreaMetaDoc>): EuromeccAreaMeta {
  const cementType = normalizeText(raw.cementType);
  const cementTypeShort =
    normalizeText(raw.cementTypeShort) || deriveEuromeccCementTypeShortLabel(cementType);
  return {
    id,
    areaKey: normalizeRequiredText(raw.areaKey, "areaKey"),
    cementType,
    cementTypeShort,
    updatedAt: formatDateInput(raw.updatedAt ?? null) || null,
    updatedBy: normalizeText(raw.updatedBy),
  };
}

export function daysAgo(dateStr: string): number {
  const parsed = toNextDateValue(dateStr);
  if (!parsed) return Number.POSITIVE_INFINITY;
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startValue = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  return Math.round((startToday.getTime() - startValue.getTime()) / 86_400_000);
}

export function withinRange(dateStr: string, range: string): boolean {
  if (range === "all") return true;
  const days = daysAgo(dateStr);
  const limit = Number(range);
  if (!Number.isFinite(limit)) return true;
  return days >= 0 && days <= limit;
}

export function getSubStatus(
  areaKey: string,
  subKey: string,
  base: EuromeccBaseStatus,
  snapshot: EuromeccSnapshot,
): EuromeccStatus {
  const hasPending = snapshot.pending.some(
    (item) => item.areaKey === areaKey && item.subKey === subKey,
  );
  if (hasPending) return "maint";

  const openIssues = snapshot.issues.filter(
    (item) => item.areaKey === areaKey && item.subKey === subKey && item.state !== "chiusa",
  );

  if (openIssues.some((item) => item.type !== "osservazione")) {
    return "issue";
  }

  if (openIssues.some((item) => item.type === "osservazione")) {
    return "obs";
  }

  const recentDone = snapshot.done.some(
    (item) =>
      item.areaKey === areaKey &&
      item.subKey === subKey &&
      Number.isFinite(daysAgo(item.doneDate)) &&
      daysAgo(item.doneDate) <= 30,
  );
  if (recentDone) return "done";

  if (base === "check") return "check";
  return "ok";
}

export function getAreaStatus(
  areaKey: string,
  components: Array<{ key: string; base: EuromeccBaseStatus }>,
  snapshot: EuromeccSnapshot,
): EuromeccStatus {
  const statuses = components.map((item) => getSubStatus(areaKey, item.key, item.base, snapshot));
  if (statuses.includes("maint")) return "maint";
  if (statuses.includes("issue")) return "issue";
  if (statuses.includes("obs")) return "obs";
  if (statuses.includes("done")) return "done";
  if (statuses.includes("check")) return "check";
  return "ok";
}

export async function readEuromeccSnapshot(): Promise<EuromeccSnapshot> {
  const [pendingSnapshot, doneSnapshot, issuesSnapshot, areaMetaSnapshot] = await Promise.all([
    getDocs(collection(db, EUROMECC_PENDING_COLLECTION)),
    getDocs(collection(db, EUROMECC_DONE_COLLECTION)),
    getDocs(collection(db, EUROMECC_ISSUES_COLLECTION)),
    getDocs(collection(db, EUROMECC_AREA_META_COLLECTION)),
  ]);

  const pending = pendingSnapshot.docs
    .map((entry) => mapPendingDoc(entry.id, entry.data() as Partial<EuromeccPendingDoc>))
    .sort((left, right) => {
      const byDue = compareIsoAsc(left.dueDate, right.dueDate);
      if (byDue !== 0) return byDue;
      return left.title.localeCompare(right.title, "it");
    });

  const done = doneSnapshot.docs
    .map((entry) => mapDoneDoc(entry.id, entry.data() as Partial<EuromeccDoneDoc>))
    .sort((left, right) => {
      const byDone = compareIsoDesc(left.doneDate, right.doneDate);
      if (byDone !== 0) return byDone;
      return right.id.localeCompare(left.id, "it");
    });

  const issues = issuesSnapshot.docs
    .map((entry) => mapIssueDoc(entry.id, entry.data() as Partial<EuromeccIssueDoc>))
    .sort((left, right) => {
      const byReported = compareIsoDesc(left.reportedAt, right.reportedAt);
      if (byReported !== 0) return byReported;
      const byState = left.state.localeCompare(right.state);
      if (byState !== 0) return byState;
      return right.id.localeCompare(left.id, "it");
    });

  const areaMeta = areaMetaSnapshot.docs
    .map((entry) => mapAreaMetaDoc(entry.id, entry.data() as Partial<EuromeccAreaMetaDoc>))
    .sort((left, right) => left.areaKey.localeCompare(right.areaKey, "it"));

  const cementTypesByArea = areaMeta.reduce<Record<string, string>>((accumulator, item) => {
    if (item.cementType) {
      accumulator[item.areaKey] = item.cementType;
    }
    return accumulator;
  }, {});

  const cementTypeShortByArea = areaMeta.reduce<Record<string, string>>((accumulator, item) => {
    if (item.cementTypeShort) {
      accumulator[item.areaKey] = item.cementTypeShort;
    }
    return accumulator;
  }, {});

  return {
    pending,
    done,
    issues,
    areaMeta,
    cementTypesByArea,
    cementTypeShortByArea,
    loadedAt: new Date().toISOString(),
  };
}

export async function addEuromeccPendingTask(
  payload: AddEuromeccPendingTaskInput,
): Promise<string> {
  const ref = await addDoc(collection(db, EUROMECC_PENDING_COLLECTION), {
    areaKey: normalizeRequiredText(payload.areaKey, "areaKey"),
    subKey: normalizeRequiredText(payload.subKey, "subKey"),
    title: normalizeRequiredText(payload.title, "title"),
    priority: normalizePriority(payload.priority),
    dueDate: normalizeIsoDate(payload.dueDate, "dueDate"),
    note: normalizeText(payload.note),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function deleteEuromeccPendingTask(id: string): Promise<void> {
  const taskId = normalizeRequiredText(id, "id");
  await deleteDoc(doc(db, EUROMECC_PENDING_COLLECTION, taskId));
}

export async function updateEuromeccPendingTask(
  payload: UpdateEuromeccPendingTaskInput,
): Promise<void> {
  const taskId = normalizeRequiredText(payload.id, "id");
  await updateDoc(doc(db, EUROMECC_PENDING_COLLECTION, taskId), {
    areaKey: normalizeRequiredText(payload.areaKey, "areaKey"),
    subKey: normalizeRequiredText(payload.subKey, "subKey"),
    title: normalizeRequiredText(payload.title, "title"),
    priority: normalizePriority(payload.priority),
    dueDate: normalizeIsoDate(payload.dueDate, "dueDate"),
    note: normalizeText(payload.note),
    updatedAt: serverTimestamp(),
  });
}

export async function closeEuromeccPendingByAreaSub(
  areaKey: string,
  subKey: string,
): Promise<void> {
  const pendingSnapshot = await getDocs(collection(db, EUROMECC_PENDING_COLLECTION));
  const matches = pendingSnapshot.docs.filter((entry) => {
    const data = entry.data() as Partial<EuromeccPendingDoc>;
    return normalizeText(data.areaKey) === areaKey && normalizeText(data.subKey) === subKey;
  });

  await Promise.all(matches.map((entry) => deleteDoc(doc(db, EUROMECC_PENDING_COLLECTION, entry.id))));
}

export async function addEuromeccDoneTask(
  payload: AddEuromeccDoneTaskInput,
  closePending: boolean,
): Promise<string> {
  const areaKey = normalizeRequiredText(payload.areaKey, "areaKey");
  const subKey = normalizeRequiredText(payload.subKey, "subKey");

  const ref = await addDoc(collection(db, EUROMECC_DONE_COLLECTION), {
    areaKey,
    subKey,
    title: normalizeRequiredText(payload.title, "title"),
    doneDate: normalizeIsoDate(payload.doneDate, "doneDate"),
    by: normalizeRequiredText(payload.by, "by"),
    note: normalizeText(payload.note),
    nextDate: normalizeIsoDate(payload.nextDate, "nextDate", false),
    closedPending: Boolean(closePending),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (closePending) {
    await closeEuromeccPendingByAreaSub(areaKey, subKey);
  }

  return ref.id;
}

export async function updateEuromeccDoneTask(
  payload: UpdateEuromeccDoneTaskInput,
): Promise<void> {
  const taskId = normalizeRequiredText(payload.id, "id");
  await updateDoc(doc(db, EUROMECC_DONE_COLLECTION, taskId), {
    areaKey: normalizeRequiredText(payload.areaKey, "areaKey"),
    subKey: normalizeRequiredText(payload.subKey, "subKey"),
    title: normalizeRequiredText(payload.title, "title"),
    doneDate: normalizeIsoDate(payload.doneDate, "doneDate"),
    by: normalizeRequiredText(payload.by, "by"),
    note: normalizeText(payload.note),
    nextDate: normalizeIsoDate(payload.nextDate, "nextDate", false),
    closedPending: Boolean(payload.closedPending),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEuromeccDoneTask(id: string): Promise<void> {
  const taskId = normalizeRequiredText(id, "id");
  await deleteDoc(doc(db, EUROMECC_DONE_COLLECTION, taskId));
}

export async function addEuromeccIssue(
  payload: AddEuromeccIssueInput,
): Promise<string> {
  const ref = await addDoc(collection(db, EUROMECC_ISSUES_COLLECTION), {
    areaKey: normalizeRequiredText(payload.areaKey, "areaKey"),
    subKey: normalizeRequiredText(payload.subKey, "subKey"),
    title: normalizeRequiredText(payload.title, "title"),
    check: normalizeRequiredText(payload.check, "check"),
    type: normalizeIssueType(payload.type),
    state: "aperta",
    reportedAt: normalizeIsoDate(payload.reportedAt, "reportedAt"),
    reportedBy: normalizeRequiredText(payload.reportedBy, "reportedBy"),
    note: normalizeText(payload.note),
    closedDate: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function updateEuromeccIssue(
  payload: UpdateEuromeccIssueInput,
): Promise<void> {
  const issueId = normalizeRequiredText(payload.id, "id");
  const state = normalizeIssueState(payload.state);
  const closedDate =
    state === "chiusa"
      ? normalizeIsoDate(payload.closedDate, "closedDate", false) ?? todayIso()
      : null;

  await updateDoc(doc(db, EUROMECC_ISSUES_COLLECTION, issueId), {
    areaKey: normalizeRequiredText(payload.areaKey, "areaKey"),
    subKey: normalizeRequiredText(payload.subKey, "subKey"),
    title: normalizeRequiredText(payload.title, "title"),
    check: normalizeRequiredText(payload.check, "check"),
    type: normalizeIssueType(payload.type),
    state,
    reportedAt: normalizeIsoDate(payload.reportedAt, "reportedAt"),
    reportedBy: normalizeRequiredText(payload.reportedBy, "reportedBy"),
    note: normalizeText(payload.note),
    closedDate,
    updatedAt: serverTimestamp(),
  });
}

export async function closeEuromeccIssue(id: string): Promise<void> {
  const issueId = normalizeRequiredText(id, "id");
  await updateDoc(doc(db, EUROMECC_ISSUES_COLLECTION, issueId), {
    state: "chiusa",
    closedDate: todayIso(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEuromeccIssue(id: string): Promise<void> {
  const issueId = normalizeRequiredText(id, "id");
  await deleteDoc(doc(db, EUROMECC_ISSUES_COLLECTION, issueId));
}

export async function saveEuromeccAreaCementType(
  payload: SaveEuromeccAreaMetaInput,
): Promise<void> {
  const areaKey = normalizeRequiredText(payload.areaKey, "areaKey");
  const area = EUROMECC_AREAS[areaKey];
  if (!area || area.type !== "silo") {
    throw new Error("Il tipo cemento e disponibile solo per i sili.");
  }

  const cementType = normalizeText(payload.cementType);
  const cementTypeShort = normalizeText(payload.cementTypeShort);
  const metaRef = doc(db, EUROMECC_AREA_META_COLLECTION, areaKey);
  await setDoc(
    metaRef,
    {
      areaKey,
      cementType,
      cementTypeShort,
      updatedBy: normalizeText(payload.updatedBy),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function getEuromeccTimestampAgeLabel(value: Timestamp | null | undefined): string {
  const millis = timestampToMillis(value);
  if (!millis) return "-";
  return formatDateUI(millis);
}
