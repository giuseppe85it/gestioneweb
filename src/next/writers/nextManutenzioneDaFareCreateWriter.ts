import { getItemSync, setItemSync } from "../../utils/storageSync";
import {
  CloneWriteBlockedError,
  assertCloneWriteAllowed,
  runWithCloneWriteScopedAllowance,
} from "../../utils/cloneWriteBarrier";

export const MANUTENZIONE_DAFARE_CREATE_WRITE_SCOPE =
  "centro_controllo_manutenzione_dafare_create_write";

const MANUTENZIONI_KEY = "@manutenzioni";
const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";
const CONTROLLI_KEY = "@controlli_mezzo_autisti";

export type ManutenzioneDaFareOrigineTipo = "segnalazione" | "controllo" | "manuale";
export type ManutenzioneDaFareUrgenza = "bassa" | "media" | "alta";

export type ManutenzioneDaFareCreateInput = {
  descrizione: string;
  urgenza: ManutenzioneDaFareUrgenza;
  targa: string;
  note?: string | null;
  segnalatoDa?: string | null;
  origineTipo: ManutenzioneDaFareOrigineTipo;
  origineId?: string | null;
};

export type ManutenzioneDaFareCreateResult = {
  ok: boolean;
  error?: string;
  manutenzioneId?: string;
  manutenzioneIds?: string[];
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
  if (isRecord(raw) && Array.isArray(raw.items)) {
    return raw.items.filter(isRecord);
  }
  return [];
}

function generateManutenzioneId(): string {
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

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeTargaUp(value: unknown): string {
  return normalizeText(value).toUpperCase();
}

function normalizeUrgenza(
  value: unknown,
  fallback: ManutenzioneDaFareUrgenza,
): ManutenzioneDaFareUrgenza {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "alta" || normalized === "media" || normalized === "bassa") {
    return normalized;
  }
  return fallback;
}

function sourceKeyFromOrigine(
  origineTipo: ManutenzioneDaFareOrigineTipo,
): typeof SEGNALAZIONI_KEY | typeof CONTROLLI_KEY | null {
  if (origineTipo === "segnalazione") return SEGNALAZIONI_KEY;
  if (origineTipo === "controllo") return CONTROLLI_KEY;
  return null;
}

function hasLinkedLavoro(record: RawRecord): boolean {
  if (record.linkedLavoroId) return true;
  return Array.isArray(record.linkedLavoroIds) && record.linkedLavoroIds.length > 0;
}

function buildManutenzioneDaFareRecord(args: {
  id: string;
  targa: string;
  descrizione: string;
  urgenza: ManutenzioneDaFareUrgenza;
  segnalatoDa: string;
  origineTipo: ManutenzioneDaFareOrigineTipo;
  origineRefId: string | null;
  origineRefKey: string | null;
}): RawRecord {
  return {
    id: args.id,
    tipo: "mezzo",
    targa: normalizeTargaUp(args.targa),
    descrizione: args.descrizione,
    data: null,
    stato: "daFare",
    dataProgrammata: null,
    urgenza: args.urgenza,
    segnalatoDa: args.segnalatoDa,
    eseguitoDa: null,
    origineTipo: args.origineTipo,
    origineRefId: args.origineRefId,
    origineRefKey: args.origineRefKey,
    km: null,
    ore: null,
    fornitore: null,
    importo: null,
    sottotipo: null,
    materiali: [],
  };
}

function patchSegnalazione(
  list: RawRecord[],
  origineId: string,
  manutenzioneId: string,
): RawRecord[] {
  const idTrim = normalizeText(origineId);
  if (!idTrim) return list;
  return list.map((record) => {
    if (normalizeText(record.id) !== idTrim) return record;
    const next: RawRecord = {
      ...record,
      linkedLavoroId: manutenzioneId,
      letta: true,
    };
    if ("stato" in record || record.stato) {
      next.stato = "presa_in_carico";
    }
    return next;
  });
}

function patchControllo(
  list: RawRecord[],
  origineId: string,
  manutenzioneIds: string[],
): RawRecord[] {
  const idTrim = normalizeText(origineId);
  if (!idTrim || manutenzioneIds.length === 0) return list;
  return list.map((record) => {
    if (normalizeText(record.id) !== idTrim) return record;
    const next: RawRecord = {
      ...record,
      letta: true,
    };
    if (manutenzioneIds.length > 1) {
      next.linkedLavoroIds = manutenzioneIds;
      next.linkedMultiple = true;
    } else {
      next.linkedLavoroId = manutenzioneIds[0];
    }
    return next;
  });
}

async function appendManutenzioniDaFare(args: {
  records: RawRecord[];
  sourceKey: string | null;
  patchSource?: (list: RawRecord[]) => RawRecord[];
}): Promise<void> {
  await runWithCloneWriteScopedAllowance(
    MANUTENZIONE_DAFARE_CREATE_WRITE_SCOPE,
    async () => {
      const manutenzioniRaw = await getItemSync(MANUTENZIONI_KEY);
      const manutenzioniList = unwrapList(manutenzioniRaw);
      const nextManutenzioni = [...manutenzioniList, ...args.records];
      assertCloneWriteAllowed("storageSync.setItemSync", { key: MANUTENZIONI_KEY });
      await setItemSync(MANUTENZIONI_KEY, nextManutenzioni);

      if (args.sourceKey && args.patchSource) {
        const sourceRaw = await getItemSync(args.sourceKey);
        const sourceList = unwrapList(sourceRaw);
        const nextSource = args.patchSource(sourceList);
        assertCloneWriteAllowed("storageSync.setItemSync", { key: args.sourceKey });
        await setItemSync(args.sourceKey, nextSource);
      }
    },
  );
}

function toBlockedResult(error: unknown): ManutenzioneDaFareCreateResult {
  if (error instanceof CloneWriteBlockedError) {
    return {
      ok: false,
      error:
        "Scrittura bloccata dal barrier clone (manutenzione da fare). Verificare che la pagina sia nel perimetro autorizzato.",
    };
  }
  return {
    ok: false,
    error:
      error instanceof Error ? error.message : "Errore creazione manutenzione da fare.",
  };
}

export async function createManutenzioneDaFareFromEvento(
  input: ManutenzioneDaFareCreateInput,
): Promise<ManutenzioneDaFareCreateResult> {
  const descrizioneBase = normalizeText(input.descrizione);
  if (!descrizioneBase) {
    return { ok: false, error: "Descrizione obbligatoria." };
  }
  const origineId = normalizeText(input.origineId);
  if (input.origineTipo !== "manuale" && !origineId) {
    return { ok: false, error: "ID origine mancante." };
  }
  const sourceKey = sourceKeyFromOrigine(input.origineTipo);
  const note = normalizeText(input.note);
  const descrizione = note ? `${descrizioneBase} - ${note}` : descrizioneBase;
  const manutenzioneId = generateManutenzioneId();
  const record = buildManutenzioneDaFareRecord({
    id: manutenzioneId,
    targa: input.targa,
    descrizione,
    urgenza: normalizeUrgenza(input.urgenza, "media"),
    segnalatoDa: normalizeText(input.segnalatoDa) || "autista",
    origineTipo: input.origineTipo,
    origineRefId: origineId || null,
    origineRefKey: sourceKey,
  });

  try {
    await appendManutenzioniDaFare({
      records: [record],
      sourceKey,
      patchSource:
        input.origineTipo === "segnalazione"
          ? (list) => patchSegnalazione(list, origineId, manutenzioneId)
          : input.origineTipo === "controllo"
            ? (list) => patchControllo(list, origineId, [manutenzioneId])
            : undefined,
    });
    return { ok: true, manutenzioneId, manutenzioneIds: [manutenzioneId] };
  } catch (error: unknown) {
    return toBlockedResult(error);
  }
}

export async function createManutenzioneDaFareFromSegnalazione(
  record: unknown,
): Promise<ManutenzioneDaFareCreateResult> {
  if (!isRecord(record)) {
    return { ok: false, error: "Segnalazione non valida." };
  }
  if (hasLinkedLavoro(record)) {
    return { ok: false, error: "Manutenzione gia creata per questa segnalazione." };
  }
  const origineId = normalizeText(record.id);
  if (!origineId) {
    return { ok: false, error: "ID segnalazione mancante." };
  }

  const targa =
    normalizeTargaUp(record.targa) ||
    normalizeTargaUp(record.targaCamion) ||
    normalizeTargaUp(record.targaRimorchio);
  const tipoProblema = normalizeText(record.tipoProblema) || "-";
  const descrizioneSegnalazione = normalizeText(record.descrizione) || "-";
  const descrizione = `Segnalazione: ${tipoProblema} - ${descrizioneSegnalazione}`;
  const manutenzioneId = generateManutenzioneId();
  const manutenzione = buildManutenzioneDaFareRecord({
    id: manutenzioneId,
    targa,
    descrizione,
    urgenza: record.flagVerifica ? "alta" : "media",
    segnalatoDa:
      normalizeText(record.autistaNome) ||
      normalizeText(record.badgeAutista) ||
      "autista",
    origineTipo: "segnalazione",
    origineRefId: origineId,
    origineRefKey: SEGNALAZIONI_KEY,
  });

  try {
    await appendManutenzioniDaFare({
      records: [manutenzione],
      sourceKey: SEGNALAZIONI_KEY,
      patchSource: (list) => patchSegnalazione(list, origineId, manutenzioneId),
    });
    return { ok: true, manutenzioneId, manutenzioneIds: [manutenzioneId] };
  } catch (error: unknown) {
    return toBlockedResult(error);
  }
}

export async function createManutenzioneDaFareFromControllo(
  record: unknown,
): Promise<ManutenzioneDaFareCreateResult> {
  if (!isRecord(record)) {
    return { ok: false, error: "Controllo non valido." };
  }
  if (hasLinkedLavoro(record)) {
    return { ok: false, error: "Manutenzione gia creata per questo controllo." };
  }
  const origineId = normalizeText(record.id);
  if (!origineId) {
    return { ok: false, error: "ID controllo mancante." };
  }
  const check = isRecord(record.check) ? record.check : {};
  const koList = Object.entries(check)
    .filter(([, value]) => value === false)
    .map(([key]) => key.toUpperCase());
  if (koList.length === 0) {
    return { ok: false, error: "Controllo OK: nessuna manutenzione da creare." };
  }

  const target = normalizeText(record.target).toLowerCase();
  const targaMotrice =
    normalizeTargaUp(record.targaCamion) || normalizeTargaUp(record.targaMotrice);
  const targaRimorchio = normalizeTargaUp(record.targaRimorchio);
  const targhe: string[] = [];
  if (target === "entrambi") {
    if (targaMotrice) targhe.push(targaMotrice);
    if (targaRimorchio) targhe.push(targaRimorchio);
  } else if (target === "rimorchio") {
    if (targaRimorchio) targhe.push(targaRimorchio);
  } else if (targaMotrice) {
    targhe.push(targaMotrice);
  }
  if (targhe.length === 0) {
    return { ok: false, error: "Targa non disponibile per questo controllo." };
  }

  const descrizione = `Controllo KO: ${koList.join(", ")}`;
  const urgenza: ManutenzioneDaFareUrgenza =
    koList.length > 1 || record.obbligatorio === true ? "alta" : "media";
  const segnalatoDa =
    normalizeText(record.autistaNome) ||
    normalizeText(record.badgeAutista) ||
    "autista";
  const manutenzioni = targhe.map((targa) =>
    buildManutenzioneDaFareRecord({
      id: generateManutenzioneId(),
      targa,
      descrizione,
      urgenza,
      segnalatoDa,
      origineTipo: "controllo",
      origineRefId: origineId,
      origineRefKey: CONTROLLI_KEY,
    }),
  );
  const manutenzioneIds = manutenzioni.map((item) => normalizeText(item.id));

  try {
    await appendManutenzioniDaFare({
      records: manutenzioni,
      sourceKey: CONTROLLI_KEY,
      patchSource: (list) => patchControllo(list, origineId, manutenzioneIds),
    });
    return {
      ok: true,
      manutenzioneId: manutenzioneIds[0],
      manutenzioneIds,
    };
  } catch (error: unknown) {
    return toBlockedResult(error);
  }
}
