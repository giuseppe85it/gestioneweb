export type NextCapoCloneApprovalRecord = {
  id: string;
  targa: string;
  status: "pending" | "approved" | "rejected";
  updatedAt: string;
};

const NEXT_CAPO_APPROVALS_KEY = "@next_clone_capo:approvals";

function readLocalValue<T>(fallback: T): T {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(NEXT_CAPO_APPROVALS_KEY);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocalValue(value: unknown) {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(NEXT_CAPO_APPROVALS_KEY, JSON.stringify(value));
  } catch {
    return;
  }
}

export function readNextCapoCloneApprovals(): NextCapoCloneApprovalRecord[] {
  const raw = readLocalValue<unknown[]>([]);
  return raw
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry))
    .map((entry) => {
      const status: NextCapoCloneApprovalRecord["status"] =
        entry.status === "approved" || entry.status === "rejected" ? entry.status : "pending";
      return {
        id: String(entry.id ?? "").trim(),
        targa: String(entry.targa ?? "").trim(),
        status,
        updatedAt: String(entry.updatedAt ?? "").trim(),
      };
    })
    .filter((entry) => Boolean(entry.id));
}

export function upsertNextCapoCloneApproval(record: NextCapoCloneApprovalRecord) {
  const current = readNextCapoCloneApprovals().filter((entry) => entry.id !== record.id);
  current.push(record);
  writeLocalValue(current);
}
