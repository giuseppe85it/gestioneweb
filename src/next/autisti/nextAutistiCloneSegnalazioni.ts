import type { NextAutistiCloneAttachment } from "./nextAutistiCloneAttachments";

export type NextAutistiCloneSegnalazioneAmbito = "motrice" | "rimorchio";
export type NextAutistiCloneSegnalazioneTipoProblema =
  | "motore"
  | "freni"
  | "gomme"
  | "idraulico"
  | "elettrico"
  | "altro";
export type NextAutistiClonePosizioneGomma =
  | "anteriore"
  | "posteriore"
  | "asse1"
  | "asse2"
  | "asse3";
export type NextAutistiCloneProblemaGomma =
  | "forata"
  | "usurata"
  | "da_controllare"
  | "altro";

export type NextAutistiCloneSegnalazioneRecord = {
  id: string;
  ambito: NextAutistiCloneSegnalazioneAmbito;
  mezzoId: string | null;
  targa: string | null;
  categoriaMezzo: string | null;
  targaCamion: string | null;
  targaRimorchio: string | null;
  autistaId: string | null;
  autistaNome: string | null;
  badgeAutista: string | null;
  tipoProblema: NextAutistiCloneSegnalazioneTipoProblema;
  posizioneGomma: NextAutistiClonePosizioneGomma | null;
  problemaGomma: NextAutistiCloneProblemaGomma | null;
  descrizione: string;
  note: string | null;
  fotoUrls: string[];
  fotoStoragePaths: [];
  attachments: NextAutistiCloneAttachment[];
  data: number;
  stato: "nuova";
  letta: false;
  flagVerifica: false;
  motivoVerifica: null;
  source: "next-clone";
  syncState: "local-only";
};

export const NEXT_AUTISTI_CLONE_SEGNALAZIONI_KEY = "@next_clone_autisti:segnalazioni";

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

export function getNextAutistiCloneSegnalazioni(): NextAutistiCloneSegnalazioneRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseCloneArray<NextAutistiCloneSegnalazioneRecord>(
    window.localStorage.getItem(NEXT_AUTISTI_CLONE_SEGNALAZIONI_KEY),
  );
}

export function appendNextAutistiCloneSegnalazione(
  record: NextAutistiCloneSegnalazioneRecord,
) {
  if (typeof window === "undefined") {
    return;
  }

  const current = getNextAutistiCloneSegnalazioni();
  current.push(record);
  window.localStorage.setItem(
    NEXT_AUTISTI_CLONE_SEGNALAZIONI_KEY,
    JSON.stringify(current),
  );
}
