export type NextAutistiCloneTipoRifornimento = "caravate" | "distributore";
export type NextAutistiCloneMetodoPagamento = "piccadilly" | "eni" | "contanti";
export type NextAutistiClonePaese = "IT" | "CH";

export type NextAutistiCloneRifornimentoRecord = {
  id: string;
  autistaId: string | null;
  autistaNome: string | null;
  badgeAutista: string | null;
  targaCamion: string | null;
  targaRimorchio: string | null;
  tipo: NextAutistiCloneTipoRifornimento;
  metodoPagamento: NextAutistiCloneMetodoPagamento | null;
  paese: NextAutistiClonePaese | null;
  km: number;
  litri: number;
  importo: number | null;
  note: string | null;
  data: number;
  flagVerifica: boolean;
  confermatoAutista: true;
  source: "next-clone";
  syncState: "local-only";
};

export const NEXT_AUTISTI_CLONE_RIFORNIMENTI_KEY = "@next_clone_autisti:rifornimenti";

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

export function getNextAutistiCloneRifornimenti(): NextAutistiCloneRifornimentoRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseCloneArray<NextAutistiCloneRifornimentoRecord>(
    window.localStorage.getItem(NEXT_AUTISTI_CLONE_RIFORNIMENTI_KEY),
  );
}

export function appendNextAutistiCloneRifornimento(
  record: NextAutistiCloneRifornimentoRecord,
) {
  if (typeof window === "undefined") {
    return;
  }

  const current = getNextAutistiCloneRifornimenti();
  current.push(record);
  window.localStorage.setItem(
    NEXT_AUTISTI_CLONE_RIFORNIMENTI_KEY,
    JSON.stringify(current),
  );
}
