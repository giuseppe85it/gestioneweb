import { getItemSync, setItemSync } from "../utils/storageSync";
import {
  CloneWriteBlockedError,
  assertCloneWriteAllowed,
  runWithCloneWriteScopedAllowance,
} from "../utils/cloneWriteBarrier";

export const LAVORO_CREATE_WRITE_SCOPE =
  "centro_controllo_lavoro_create_write";

const LAVORI_KEY = "@lavori";
const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";
const CONTROLLI_KEY = "@controlli_mezzo_autisti";

export type LavoroCreateOrigineTipo = "segnalazione" | "controllo";
export type LavoroCreateUrgenza = "bassa" | "media" | "alta";
export type LavoroCreateTipo = "targa" | "magazzino";

export type LavoroCreateInput = {
  descrizione: string;
  urgenza: LavoroCreateUrgenza;
  targa: string;
  note: string;
  segnalatoDa: string;
  origineTipo: LavoroCreateOrigineTipo;
  origineId: string;
};

export type LavoroCreateResult = {
  ok: boolean;
  error?: string;
  lavoroId?: string;
};

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapList(raw: unknown): RawRecord[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.value)) {
    return raw.value.filter(isRecord);
  }
  return [];
}

function generateLavoroId(): string {
  const cryptoRef: Crypto | undefined =
    typeof globalThis !== "undefined" &&
    "crypto" in globalThis &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
      ? (globalThis.crypto as Crypto)
      : undefined;
  if (cryptoRef && typeof cryptoRef.randomUUID === "function") {
    return cryptoRef.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function todayYmd(): string {
  return new Date().toISOString().substring(0, 10);
}

function normalizeTargaUp(value: string): string {
  return String(value ?? "").trim().toUpperCase();
}

function buildLavoroRecord(
  input: LavoroCreateInput,
  lavoroId: string,
  gruppoId: string,
): RawRecord {
  const targaClean: string = normalizeTargaUp(input.targa);
  const tipo: LavoroCreateTipo = targaClean ? "targa" : "magazzino";
  const sourceKey: string =
    input.origineTipo === "segnalazione"
      ? SEGNALAZIONI_KEY
      : CONTROLLI_KEY;
  const dettagli: string = String(input.note ?? "").trim();
  return {
    id: lavoroId,
    gruppoId,
    tipo,
    targa: tipo === "targa" ? targaClean : "",
    descrizione: String(input.descrizione ?? "").trim(),
    dataInserimento: todayYmd(),
    eseguito: false,
    urgenza: input.urgenza,
    segnalatoDa: String(input.segnalatoDa ?? "").trim() || "autista",
    sottoElementi: [],
    dettagli: dettagli ? dettagli : null,
    source: {
      type: input.origineTipo,
      id: String(input.origineId ?? "") || null,
      key: sourceKey,
    },
  };
}

function patchSegnalazione(
  list: RawRecord[],
  origineId: string,
  lavoroId: string,
): RawRecord[] {
  const idTrim: string = String(origineId ?? "").trim();
  if (!idTrim) return list;
  return list.map((r: RawRecord) => {
    if (String(r.id ?? "").trim() !== idTrim) return r;
    const next: RawRecord = {
      ...r,
      linkedLavoroId: lavoroId,
      letta: true,
    };
    if ("stato" in r || r.stato) {
      next.stato = "presa_in_carico";
    }
    return next;
  });
}

function patchControllo(
  list: RawRecord[],
  origineId: string,
  lavoroId: string,
): RawRecord[] {
  const idTrim: string = String(origineId ?? "").trim();
  if (!idTrim) return list;
  return list.map((r: RawRecord) => {
    if (String(r.id ?? "").trim() !== idTrim) return r;
    return {
      ...r,
      linkedLavoroId: lavoroId,
      letta: true,
    };
  });
}

export async function createLavoroFromEvento(
  input: LavoroCreateInput,
): Promise<LavoroCreateResult> {
  const descrizione: string = String(input.descrizione ?? "").trim();
  if (!descrizione) {
    return { ok: false, error: "Descrizione obbligatoria." };
  }
  const origineId: string = String(input.origineId ?? "").trim();
  if (!origineId) {
    return { ok: false, error: "ID origine mancante." };
  }
  if (input.origineTipo !== "segnalazione" && input.origineTipo !== "controllo") {
    return { ok: false, error: "Tipo origine non supportato." };
  }
  try {
    return await runWithCloneWriteScopedAllowance(
      LAVORO_CREATE_WRITE_SCOPE,
      async (): Promise<LavoroCreateResult> => {
        const lavoroId: string = generateLavoroId();
        const gruppoId: string = generateLavoroId();
        const lavoroRecord: RawRecord = buildLavoroRecord(
          { ...input, descrizione },
          lavoroId,
          gruppoId,
        );

        const lavoriRaw: unknown = await getItemSync(LAVORI_KEY);
        const lavoriList: RawRecord[] = unwrapList(lavoriRaw);
        const nextLavori: RawRecord[] = [...lavoriList, lavoroRecord];
        assertCloneWriteAllowed("storageSync.setItemSync", { key: LAVORI_KEY });
        await setItemSync(LAVORI_KEY, nextLavori);

        const sourceKey: string =
          input.origineTipo === "segnalazione"
            ? SEGNALAZIONI_KEY
            : CONTROLLI_KEY;
        const sourceRaw: unknown = await getItemSync(sourceKey);
        const sourceList: RawRecord[] = unwrapList(sourceRaw);
        const nextSource: RawRecord[] =
          input.origineTipo === "segnalazione"
            ? patchSegnalazione(sourceList, origineId, lavoroId)
            : patchControllo(sourceList, origineId, lavoroId);
        assertCloneWriteAllowed("storageSync.setItemSync", { key: sourceKey });
        await setItemSync(sourceKey, nextSource);

        return { ok: true, lavoroId };
      },
    );
  } catch (err: unknown) {
    if (err instanceof CloneWriteBlockedError) {
      return {
        ok: false,
        error:
          "Scrittura bloccata dal barrier clone (lavoro). Verificare che la pagina sia /next/centro-controllo.",
      };
    }
    const message: string =
      err instanceof Error ? err.message : "Errore creazione lavoro.";
    return { ok: false, error: message };
  }
}
