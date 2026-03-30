const NEXT_DOSSIER_CLONE_STATE_KEY = "@next_clone_dossier:state";

type NextDossierCloneAnalysisRecord = {
  riepilogoBreve: string | null;
  analisiCosti: string | null;
  anomalie: string | null;
  fornitoriNotevoli: string | null;
  updatedAtTimestamp: number;
  targa: string;
  sourceCollection: "@next_clone_analisi_economica";
  sourceDocId: string;
  quality: "clone_only";
  flags: string[];
};

type NextDossierCloneStateRow = {
  hiddenDocumentIds?: string[];
  analysisOverride?: NextDossierCloneAnalysisRecord | null;
};

type NextDossierCloneState = Record<string, NextDossierCloneStateRow>;

function normalizeKey(targa: string | null | undefined) {
  return String(targa ?? "").trim().toUpperCase();
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readState(): NextDossierCloneState {
  if (!canUseLocalStorage()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(NEXT_DOSSIER_CLONE_STATE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as NextDossierCloneState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeState(next: NextDossierCloneState) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(NEXT_DOSSIER_CLONE_STATE_KEY, JSON.stringify(next));
}

export type NextDossierCloneAnalysisOverride = NextDossierCloneAnalysisRecord;

export function readNextDossierHiddenDocumentIds(targa: string): string[] {
  const key = normalizeKey(targa);
  if (!key) {
    return [];
  }

  const ids = readState()[key]?.hiddenDocumentIds;
  return Array.isArray(ids)
    ? ids.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];
}

export function hideNextDossierDocument(targa: string, documentId: string) {
  const key = normalizeKey(targa);
  const normalizedId = String(documentId ?? "").trim();
  if (!key || !normalizedId) {
    return;
  }

  const state = readState();
  const current = new Set(readNextDossierHiddenDocumentIds(key));
  current.add(normalizedId);
  state[key] = {
    ...state[key],
    hiddenDocumentIds: Array.from(current),
  };
  writeState(state);
}

export function readNextDossierAnalysisOverride(
  targa: string,
): NextDossierCloneAnalysisOverride | null {
  const key = normalizeKey(targa);
  if (!key) {
    return null;
  }

  const override = readState()[key]?.analysisOverride;
  return override && typeof override === "object" ? override : null;
}

export function writeNextDossierAnalysisOverride(
  targa: string,
  override: NextDossierCloneAnalysisOverride,
) {
  const key = normalizeKey(targa);
  if (!key) {
    return;
  }

  const state = readState();
  state[key] = {
    ...state[key],
    analysisOverride: override,
  };
  writeState(state);
}
