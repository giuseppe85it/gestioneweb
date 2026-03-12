import type { NextAutistiCloneAttachment } from "./nextAutistiCloneAttachments";

export type NextAutistiCloneRichiestaAttrezzatureRecord = {
  id: string;
  testo: string;
  autistaNome: string | null;
  badgeAutista: string | null;
  targaCamion: string | null;
  targaRimorchio: string | null;
  attachments: NextAutistiCloneAttachment[];
  attachmentCount: number;
  fotoUrl: string | null;
  fotoStoragePath: null;
  timestamp: number;
  stato: "nuova";
  letta: false;
  source: "next-clone";
  syncState: "local-only";
};

export const NEXT_AUTISTI_CLONE_RICHIESTE_ATTREZZATURE_KEY =
  "@next_clone_autisti:richieste-attrezzature";

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

export function getNextAutistiCloneRichiesteAttrezzature():
  NextAutistiCloneRichiestaAttrezzatureRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseCloneArray<NextAutistiCloneRichiestaAttrezzatureRecord>(
    window.localStorage.getItem(NEXT_AUTISTI_CLONE_RICHIESTE_ATTREZZATURE_KEY),
  );
}

export function appendNextAutistiCloneRichiestaAttrezzature(
  record: NextAutistiCloneRichiestaAttrezzatureRecord,
) {
  if (typeof window === "undefined") {
    return;
  }

  const current = getNextAutistiCloneRichiesteAttrezzature();
  current.push(record);
  window.localStorage.setItem(
    NEXT_AUTISTI_CLONE_RICHIESTE_ATTREZZATURE_KEY,
    JSON.stringify(current),
  );
}
