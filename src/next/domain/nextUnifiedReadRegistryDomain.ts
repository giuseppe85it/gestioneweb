import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { listAll, ref } from "firebase/storage";
import { db, storage } from "../../firebase";

type NextUnifiedLegacyDatasetShape =
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "object"
  | "missing"
  | "unsupported";

export type NextUnifiedStorageDocumentReadResult = {
  sourceId: string;
  status: "ready" | "missing" | "error";
  datasetShape: NextUnifiedLegacyDatasetShape;
  records: Record<string, unknown>[];
  rawDocument: Record<string, unknown> | unknown[] | null;
  notes: string[];
};

export type NextUnifiedCollectionReadResult = {
  sourceId: string;
  status: "ready" | "missing" | "error";
  records: Array<Record<string, unknown> & { __docId: string }>;
  notes: string[];
};

export type NextUnifiedStoragePrefixItem = {
  fullPath: string;
  name: string;
};

export type NextUnifiedStoragePrefixReadResult = {
  sourceId: string;
  status: "ready" | "missing" | "error";
  items: NextUnifiedStoragePrefixItem[];
  notes: string[];
};

export type NextUnifiedLocalStorageReadResult = {
  sourceId: string;
  status: "ready" | "missing" | "not_available";
  value: string | null;
  notes: string[];
};

function unwrapStorageArray(
  rawDoc: Record<string, unknown> | unknown[] | null,
  preferredArrayKeys?: string[],
): { datasetShape: NextUnifiedLegacyDatasetShape; records: Record<string, unknown>[] } {
  if (!rawDoc) {
    return { datasetShape: "missing", records: [] };
  }

  if (Array.isArray(rawDoc)) {
    return {
      datasetShape: "array",
      records: rawDoc.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object"),
    };
  }

  if (typeof rawDoc !== "object") {
    return { datasetShape: "unsupported", records: [] };
  }

  if (preferredArrayKeys?.length) {
    for (const key of preferredArrayKeys) {
      const candidate = rawDoc[key];
      if (Array.isArray(candidate)) {
        return {
          datasetShape: key === "value" ? "value" : "object",
          records: candidate.filter(
            (entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object",
          ),
        };
      }
    }
  }

  if (Array.isArray(rawDoc.items)) {
    return {
      datasetShape: "items",
      records: rawDoc.items.filter(
        (entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object",
      ),
    };
  }

  const nestedValue = rawDoc.value;
  if (Array.isArray((nestedValue as { items?: unknown[] } | undefined)?.items)) {
    return {
      datasetShape: "value.items",
      records: ((nestedValue as { items: unknown[] }).items ?? []).filter(
        (entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object",
      ),
    };
  }

  if (Array.isArray(nestedValue)) {
    return {
      datasetShape: "value",
      records: nestedValue.filter(
        (entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object",
      ),
    };
  }

  return {
    datasetShape: "object",
    records: [rawDoc],
  };
}

export async function readNextUnifiedStorageDocument(args: {
  key: string;
  preferredArrayKeys?: string[];
}): Promise<NextUnifiedStorageDocumentReadResult> {
  try {
    const snapshot = await getDoc(doc(db, "storage", args.key));
    if (!snapshot.exists()) {
      return {
        sourceId: `storage/${args.key}`,
        status: "missing",
        datasetShape: "missing",
        records: [],
        rawDocument: null,
        notes: ["Documento storage non trovato nel clone read-only."],
      };
    }

    const rawDocument = (snapshot.data() as Record<string, unknown>) ?? null;
    const unwrapped = unwrapStorageArray(rawDocument, args.preferredArrayKeys);
    return {
      sourceId: `storage/${args.key}`,
      status: "ready",
      datasetShape: unwrapped.datasetShape,
      records: unwrapped.records,
      rawDocument,
      notes: [],
    };
  } catch (error) {
    return {
      sourceId: `storage/${args.key}`,
      status: "error",
      datasetShape: "missing",
      records: [],
      rawDocument: null,
      notes: [
        error instanceof Error
          ? `Lettura storage fallita: ${error.message}`
          : "Lettura storage fallita per errore non previsto.",
      ],
    };
  }
}

export async function readNextUnifiedCollection(args: {
  collectionName: string;
}): Promise<NextUnifiedCollectionReadResult> {
  try {
    const snapshot = await getDocs(collection(db, args.collectionName));
    if (snapshot.empty) {
      return {
        sourceId: `collection/${args.collectionName}`,
        status: "missing",
        records: [],
        notes: ["Collection presente ma senza documenti leggibili nel clone read-only."],
      };
    }

    return {
      sourceId: `collection/${args.collectionName}`,
      status: "ready",
      records: snapshot.docs.map((entry) => ({
        __docId: entry.id,
        ...((entry.data() as Record<string, unknown>) ?? {}),
      })),
      notes: [],
    };
  } catch (error) {
    return {
      sourceId: `collection/${args.collectionName}`,
      status: "error",
      records: [],
      notes: [
        error instanceof Error
          ? `Lettura collection fallita: ${error.message}`
          : "Lettura collection fallita per errore non previsto.",
      ],
    };
  }
}

async function collectStoragePrefixItems(
  pathRef: ReturnType<typeof ref>,
  depth: number,
  maxDepth: number,
  remaining: { value: number },
  items: NextUnifiedStoragePrefixItem[],
): Promise<void> {
  if (remaining.value <= 0) {
    return;
  }

  const listing = await listAll(pathRef);
  for (const item of listing.items) {
    if (remaining.value <= 0) {
      break;
    }

    items.push({
      fullPath: item.fullPath,
      name: item.name,
    });
    remaining.value -= 1;
  }

  if (depth >= maxDepth) {
    return;
  }

  for (const prefix of listing.prefixes) {
    if (remaining.value <= 0) {
      break;
    }

    await collectStoragePrefixItems(prefix, depth + 1, maxDepth, remaining, items);
  }
}

export async function readNextUnifiedStoragePrefix(args: {
  prefix: string;
  maxItems?: number;
  maxDepth?: number;
}): Promise<NextUnifiedStoragePrefixReadResult> {
  try {
    const items: NextUnifiedStoragePrefixItem[] = [];
    const remaining = { value: Math.max(1, args.maxItems ?? 120) };
    await collectStoragePrefixItems(
      ref(storage, args.prefix),
      0,
      Math.max(0, args.maxDepth ?? 3),
      remaining,
      items,
    );

    return {
      sourceId: `storage-path/${args.prefix}`,
      status: items.length > 0 ? "ready" : "missing",
      items,
      notes:
        remaining.value <= 0
          ? ["Listing Storage troncato per limite prudente di elementi nel clone read-only."]
          : [],
    };
  } catch (error) {
    return {
      sourceId: `storage-path/${args.prefix}`,
      status: "error",
      items: [],
      notes: [
        error instanceof Error
          ? `Listing Storage fallito: ${error.message}`
          : "Listing Storage fallito per errore non previsto.",
      ],
    };
  }
}

export function readNextUnifiedLocalStorageKey(key: string): NextUnifiedLocalStorageReadResult {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return {
      sourceId: `localStorage/${key}`,
      status: "not_available",
      value: null,
      notes: ["LocalStorage non disponibile nel contesto corrente."],
    };
  }

  try {
    const value = window.localStorage.getItem(key);
    return {
      sourceId: `localStorage/${key}`,
      status: value === null ? "missing" : "ready",
      value,
      notes: value === null ? ["Chiave localStorage non valorizzata nel browser corrente."] : [],
    };
  } catch (error) {
    return {
      sourceId: `localStorage/${key}`,
      status: "not_available",
      value: null,
      notes: [
        error instanceof Error
          ? `Lettura localStorage fallita: ${error.message}`
          : "Lettura localStorage fallita per errore non previsto.",
      ],
    };
  }
}
