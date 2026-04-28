import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "../../../firebase";
import { setDoc, updateDoc } from "../../../utils/firestoreWriteOps";
import { uploadBytes } from "../../../utils/storageWriteOps";
import type { ChatIaArchiveEntry, ChatIaReport, ChatIaSectorId } from "../core/chatIaTypes";

const CHAT_IA_REPORTS_COLLECTION = "chat_ia_reports";
const CHAT_IA_REPORTS_STORAGE_PREFIX = "chat_ia_reports";

type ChatIaReportArchiveFirestoreDoc = Omit<ChatIaArchiveEntry, "id" | "firestorePath"> & {
  version: 1;
};

function getTarget(report: ChatIaReport) {
  return {
    targetKind: report.target.kind,
    targetValue: report.target.value,
    targetBadge: report.target.kind === "autista" ? report.target.badge ?? null : null,
  };
}

function getPeriodLabel(report: ChatIaReport): string | null {
  if (!report.period) return null;
  if (report.period.preset === "custom") {
    return [report.period.fromDate, report.period.toDate].filter(Boolean).join(" - ") || null;
  }
  return report.period.preset;
}

function mapSnapshot(id: string, data: ChatIaReportArchiveFirestoreDoc): ChatIaArchiveEntry {
  return {
    id,
    firestorePath: `${CHAT_IA_REPORTS_COLLECTION}/${id}`,
    ...data,
  };
}

function getYear(value: string): string {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? String(parsed.getFullYear()) : String(new Date().getFullYear());
}

export async function createChatIaReportArchiveEntry(args: {
  prompt: string;
  report: ChatIaReport;
  pdfBlob: Blob | null;
}): Promise<ChatIaArchiveEntry> {
  const nowIso = new Date().toISOString();
  const docRef = doc(collection(db, CHAT_IA_REPORTS_COLLECTION));
  let pdfStoragePath: string | null = null;
  let pdfUrl: string | null = null;

  if (args.pdfBlob) {
    pdfStoragePath = `${CHAT_IA_REPORTS_STORAGE_PREFIX}/${args.report.sector}/${getYear(nowIso)}/${docRef.id}.pdf`;
    const pdfRef = ref(storage, pdfStoragePath);
    await uploadBytes(pdfRef, args.pdfBlob, { contentType: "application/pdf" });
    pdfUrl = await getDownloadURL(pdfRef);
  }

  const target = getTarget(args.report);
  const payload: ChatIaReportArchiveFirestoreDoc = {
    version: 1,
    status: "active",
    sector: args.report.sector,
    reportType: args.report.type,
    targetKind: target.targetKind,
    targetValue: target.targetValue,
    targetBadge: target.targetBadge,
    title: args.report.title,
    summary: args.report.summary,
    prompt: args.prompt,
    createdAt: nowIso,
    updatedAt: nowIso,
    deletedAt: null,
    periodLabel: getPeriodLabel(args.report),
    periodFrom: args.report.period?.fromDate ?? null,
    periodTo: args.report.period?.toDate ?? null,
    pdfStoragePath,
    pdfUrl,
    reportPayload: args.report,
    metadata: {
      sourceCount: args.report.sources.length,
      missingDataCount: args.report.missingData.length,
      appVersion: "next",
      createdBy: "chat-ia",
    },
  };

  await setDoc(docRef, payload);
  return mapSnapshot(docRef.id, payload);
}

export async function listChatIaReportArchiveEntries(args: {
  targetKind?: "targa" | "autista";
  targetValue?: string;
  sector?: ChatIaSectorId;
  includeDeleted?: boolean;
}): Promise<ChatIaArchiveEntry[]> {
  const snapshot = await getDocs(collection(db, CHAT_IA_REPORTS_COLLECTION));
  return snapshot.docs
    .map((entry) => mapSnapshot(entry.id, entry.data() as ChatIaReportArchiveFirestoreDoc))
    .filter((entry) => args.includeDeleted || entry.status !== "deleted")
    .filter((entry) => !args.targetKind || entry.targetKind === args.targetKind)
    .filter((entry) => !args.targetValue || entry.targetValue.toUpperCase() === args.targetValue.toUpperCase())
    .filter((entry) => !args.sector || entry.sector === args.sector)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function readChatIaReportArchiveEntry(id: string): Promise<ChatIaArchiveEntry | null> {
  const snapshot = await getDoc(doc(db, CHAT_IA_REPORTS_COLLECTION, id));
  return snapshot.exists()
    ? mapSnapshot(snapshot.id, snapshot.data() as ChatIaReportArchiveFirestoreDoc)
    : null;
}

export async function markChatIaReportArchiveEntryDeleted(id: string): Promise<void> {
  const nowIso = new Date().toISOString();
  await updateDoc(doc(db, CHAT_IA_REPORTS_COLLECTION, id), {
    status: "deleted",
    deletedAt: nowIso,
    updatedAt: nowIso,
  });
}
