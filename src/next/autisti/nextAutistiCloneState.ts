import { isNextAutistiClonePath } from "./nextAutistiCloneRuntime";

export type NextAutistiCloneTargetControllo = "motrice" | "rimorchio" | "entrambi";

export type NextAutistiCloneControlloRecord = {
  id: string;
  autistaNome: string | null;
  badgeAutista: string | null;
  targaCamion: string | null;
  targaRimorchio: string | null;
  target: NextAutistiCloneTargetControllo;
  check: {
    gomme: boolean;
    freni: boolean;
    luci: boolean;
    perdite: boolean;
  };
  note: string | null;
  obbligatorio: true;
  timestamp: number;
  source: "next-clone";
};

export const NEXT_AUTISTI_CLONE_CONTROLLI_KEY = "@next_clone_autisti:controlli";

function parseCloneArray<T>(raw: string | null): T[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function shouldIgnoreCloneControlli() {
  return typeof window !== "undefined" && isNextAutistiClonePath(window.location.pathname);
}

export function getNextAutistiCloneControlli(): NextAutistiCloneControlloRecord[] {
  if (shouldIgnoreCloneControlli()) {
    return [];
  }

  if (typeof window === "undefined") {
    return [];
  }

  return parseCloneArray<NextAutistiCloneControlloRecord>(
    window.localStorage.getItem(NEXT_AUTISTI_CLONE_CONTROLLI_KEY),
  );
}

export function appendNextAutistiCloneControllo(
  record: NextAutistiCloneControlloRecord,
) {
  void record;
  if (shouldIgnoreCloneControlli()) {
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  const current = getNextAutistiCloneControlli();
  current.push(record);
  window.localStorage.setItem(
    NEXT_AUTISTI_CLONE_CONTROLLI_KEY,
    JSON.stringify(current),
  );
}
