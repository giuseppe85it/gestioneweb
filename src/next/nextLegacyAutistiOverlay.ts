import {
  getNextAutistiCloneControlli,
  type NextAutistiCloneControlloRecord,
} from "./autisti/nextAutistiCloneState";
import {
  getNextAutistiCloneRichiesteAttrezzature,
  type NextAutistiCloneRichiestaAttrezzatureRecord,
} from "./autisti/nextAutistiCloneRichiesteAttrezzature";
import {
  getNextAutistiCloneRifornimenti,
  type NextAutistiCloneRifornimentoRecord,
} from "./autisti/nextAutistiCloneRifornimenti";
import {
  getNextAutistiCloneSegnalazioni,
  type NextAutistiCloneSegnalazioneRecord,
} from "./autisti/nextAutistiCloneSegnalazioni";
import { namespaceNextAutistiStorageKey } from "./autisti/nextAutistiCloneRuntime";
import { readNextUnifiedStorageDocument } from "./domain/nextUnifiedReadRegistryDomain";

const SESSIONI_KEY = "@autisti_sessione_attive";
const EVENTI_KEY = "@storico_eventi_operativi";
const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";
const CONTROLLI_KEY = "@controlli_mezzo_autisti";
const RICHIESTE_KEY = "@richieste_attrezzature_autisti_tmp";
const RIFORNIMENTI_KEY = "@rifornimenti_autisti_tmp";
const GOMME_KEY = "@cambi_gomme_autisti_tmp";

type RawRecord = Record<string, unknown>;

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeTarga(value: unknown): string | null {
  const normalized = normalizeOptionalText(value);
  return normalized
    ? normalized.toUpperCase().replace(/\s+/g, "").trim()
    : null;
}

function toTimestamp(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1_000_000_000_000 ? value : value * 1000;
  }

  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
    }

    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (value && typeof value === "object") {
    const maybe = value as {
      toMillis?: () => number;
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };

    if (typeof maybe.toMillis === "function") {
      const parsed = maybe.toMillis();
      return Number.isFinite(parsed) ? parsed : null;
    }

    if (typeof maybe.toDate === "function") {
      const parsed = maybe.toDate();
      return parsed instanceof Date && !Number.isNaN(parsed.getTime())
        ? parsed.getTime()
        : null;
    }

    if (typeof maybe.seconds === "number") {
      return maybe.seconds * 1000;
    }

    if (typeof maybe._seconds === "number") {
      return maybe._seconds * 1000;
    }
  }

  return null;
}

function readLocalJsonRecord(key: string): RawRecord | null {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as RawRecord)
      : null;
  } catch {
    return null;
  }
}

function dedupeById(records: RawRecord[]): RawRecord[] {
  const seen = new Set<string>();
  const deduped: RawRecord[] = [];

  for (const record of records) {
    const id = normalizeOptionalText(record.id);
    if (id && seen.has(id)) {
      continue;
    }

    if (id) {
      seen.add(id);
    }
    deduped.push(record);
  }

  return deduped;
}

function normalizeSessionRecord(record: RawRecord, index: number): RawRecord {
  const badgeAutista =
    normalizeOptionalText(record.badgeAutista) ??
    normalizeOptionalText(record.badge);
  const nomeAutista =
    normalizeOptionalText(record.nomeAutista) ??
    normalizeOptionalText(record.autistaNome) ??
    normalizeOptionalText(record.autista);
  const targaMotrice =
    normalizeTarga(record.targaMotrice) ??
    normalizeTarga(record.targaCamion);
  const targaRimorchio = normalizeTarga(record.targaRimorchio);

  return {
    id:
      normalizeOptionalText(record.id) ??
      `sessione:${badgeAutista ?? "anon"}:${targaMotrice ?? "-"}:${targaRimorchio ?? "-"}:${index}`,
    targaMotrice,
    targaCamion: targaMotrice,
    targaRimorchio,
    nomeAutista,
    autistaNome: nomeAutista,
    badgeAutista,
    statoSessione:
      normalizeOptionalText(record.statoSessione) ??
      normalizeOptionalText(record.stato) ??
      normalizeOptionalText(record.sessione),
    timestamp: toTimestamp(record.timestamp),
  };
}

function buildLocalSessionRecord(): RawRecord | null {
  const autista = readLocalJsonRecord(
    namespaceNextAutistiStorageKey("@autista_attivo_local"),
  );
  const mezzo = readLocalJsonRecord(
    namespaceNextAutistiStorageKey("@mezzo_attivo_autista_local"),
  );

  const badgeAutista =
    normalizeOptionalText(autista?.badge) ??
    normalizeOptionalText(autista?.badgeAutista);
  const nomeAutista =
    normalizeOptionalText(autista?.nome) ??
    normalizeOptionalText(autista?.nomeAutista) ??
    normalizeOptionalText(autista?.autistaNome);
  const targaMotrice =
    normalizeTarga(mezzo?.targaCamion) ??
    normalizeTarga(mezzo?.targaMotrice);
  const targaRimorchio = normalizeTarga(mezzo?.targaRimorchio);
  const timestamp = toTimestamp(mezzo?.timestamp);

  if (!badgeAutista && !nomeAutista && !targaMotrice && !targaRimorchio) {
    return null;
  }

  return {
    id: `sessione:clone:${badgeAutista ?? "anon"}:${targaMotrice ?? "-"}:${targaRimorchio ?? "-"}`,
    targaMotrice,
    targaCamion: targaMotrice,
    targaRimorchio,
    nomeAutista,
    autistaNome: nomeAutista,
    badgeAutista,
    statoSessione: "clone_locale",
    timestamp,
    source: "next-clone",
    syncState: "local-only",
  };
}

function normalizeEventRecord(record: RawRecord, index: number): RawRecord {
  const prima = record.prima && typeof record.prima === "object" ? (record.prima as RawRecord) : {};
  const dopo = record.dopo && typeof record.dopo === "object" ? (record.dopo as RawRecord) : {};

  const primaMotrice =
    normalizeTarga(prima.targaMotrice) ??
    normalizeTarga(prima.targaCamion) ??
    normalizeTarga(prima.motrice) ??
    normalizeTarga(record.primaMotrice);
  const dopoMotrice =
    normalizeTarga(dopo.targaMotrice) ??
    normalizeTarga(dopo.targaCamion) ??
    normalizeTarga(dopo.motrice) ??
    normalizeTarga(record.dopoMotrice) ??
    normalizeTarga(record.targaMotrice) ??
    normalizeTarga(record.targaCamion);
  const primaRimorchio =
    normalizeTarga(prima.targaRimorchio) ??
    normalizeTarga(prima.rimorchio) ??
    normalizeTarga(record.primaRimorchio);
  const dopoRimorchio =
    normalizeTarga(dopo.targaRimorchio) ??
    normalizeTarga(dopo.rimorchio) ??
    normalizeTarga(record.dopoRimorchio) ??
    normalizeTarga(record.targaRimorchio);
  const nomeAutista =
    normalizeOptionalText(record.nomeAutista) ??
    normalizeOptionalText(record.autistaNome) ??
    normalizeOptionalText(record.autista);
  const badgeAutista =
    normalizeOptionalText(record.badgeAutista) ??
    normalizeOptionalText(record.badge);

  return {
    id:
      normalizeOptionalText(record.id) ??
      `evento:${normalizeOptionalText(record.tipo) ?? "evento"}:${toTimestamp(record.timestamp) ?? index}:${badgeAutista ?? "anon"}`,
    tipo:
      normalizeOptionalText(record.tipo) ??
      normalizeOptionalText(record.tipoOperativo) ??
      "EVENTO",
    timestamp: toTimestamp(record.timestamp ?? record.data),
    badgeAutista,
    badge: badgeAutista,
    nomeAutista,
    autistaNome: nomeAutista,
    autista: nomeAutista,
    luogo: normalizeOptionalText(record.luogo),
    statoCarico: normalizeOptionalText(record.statoCarico),
    condizioni: record.condizioni ?? null,
    prima: {
      targaMotrice: primaMotrice,
      targaCamion: primaMotrice,
      motrice: primaMotrice,
      targaRimorchio: primaRimorchio,
      rimorchio: primaRimorchio,
    },
    dopo: {
      targaMotrice: dopoMotrice,
      targaCamion: dopoMotrice,
      motrice: dopoMotrice,
      targaRimorchio: dopoRimorchio,
      rimorchio: dopoRimorchio,
    },
    primaMotrice,
    dopoMotrice,
    primaRimorchio,
    dopoRimorchio,
    source: normalizeOptionalText(record.source) ?? "next-overlay",
  };
}

function normalizeSegnalazioneRecord(record: RawRecord, index: number): RawRecord {
  const autistaNome =
    normalizeOptionalText(record.autistaNome) ??
    normalizeOptionalText(record.nomeAutista);
  const badgeAutista =
    normalizeOptionalText(record.badgeAutista) ??
    normalizeOptionalText(record.badge);

  return {
    id: normalizeOptionalText(record.id) ?? `segnalazione:${index}:${toTimestamp(record.data ?? record.timestamp) ?? 0}`,
    data: toTimestamp(record.data ?? record.timestamp),
    timestamp: toTimestamp(record.timestamp ?? record.data),
    stato: normalizeOptionalText(record.stato) ?? "nuova",
    letta: typeof record.letta === "boolean" ? record.letta : false,
    flagVerifica: typeof record.flagVerifica === "boolean" ? record.flagVerifica : false,
    ambito: normalizeOptionalText(record.ambito),
    targa: normalizeTarga(record.targa),
    targaCamion: normalizeTarga(record.targaCamion),
    targaRimorchio: normalizeTarga(record.targaRimorchio),
    autistaNome,
    nomeAutista: autistaNome,
    badgeAutista,
    tipoProblema: normalizeOptionalText(record.tipoProblema),
    descrizione: normalizeOptionalText(record.descrizione),
    note: normalizeOptionalText(record.note),
    foto: Array.isArray(record.foto) ? record.foto : [],
    fotoUrls: Array.isArray(record.fotoUrls) ? record.fotoUrls : [],
    fotoUrl: normalizeOptionalText(record.fotoUrl),
    source: normalizeOptionalText(record.source) ?? "next-overlay",
    syncState: normalizeOptionalText(record.syncState),
  };
}

function mapCloneSegnalazioneRecord(record: NextAutistiCloneSegnalazioneRecord): RawRecord {
  return {
    id: record.id,
    data: record.data,
    timestamp: record.data,
    stato: record.stato,
    letta: record.letta,
    flagVerifica: record.flagVerifica,
    ambito: record.ambito,
    targa: normalizeTarga(record.targa),
    targaCamion: normalizeTarga(record.targaCamion),
    targaRimorchio: normalizeTarga(record.targaRimorchio),
    autistaNome: record.autistaNome,
    nomeAutista: record.autistaNome,
    badgeAutista: record.badgeAutista,
    tipoProblema: record.tipoProblema,
    descrizione: record.descrizione,
    note: record.note,
    fotoUrls: record.fotoUrls,
    foto: record.attachments.map((attachment) => attachment.previewUrl),
    source: record.source,
    syncState: record.syncState,
  };
}

function normalizeControlloRecord(record: RawRecord, index: number): RawRecord {
  const autistaNome =
    normalizeOptionalText(record.autistaNome) ??
    normalizeOptionalText(record.nomeAutista);
  const badgeAutista =
    normalizeOptionalText(record.badgeAutista) ??
    normalizeOptionalText(record.badge);

  return {
    id: normalizeOptionalText(record.id) ?? `controllo:${index}:${toTimestamp(record.timestamp) ?? 0}`,
    autistaNome,
    nomeAutista: autistaNome,
    badgeAutista,
    targaCamion:
      normalizeTarga(record.targaCamion) ??
      normalizeTarga(record.targaMotrice),
    targaMotrice:
      normalizeTarga(record.targaMotrice) ??
      normalizeTarga(record.targaCamion),
    targaRimorchio: normalizeTarga(record.targaRimorchio),
    target: normalizeOptionalText(record.target),
    check:
      record.check && typeof record.check === "object"
        ? record.check
        : {},
    note: normalizeOptionalText(record.note),
    timestamp: toTimestamp(record.timestamp ?? record.data),
    source: normalizeOptionalText(record.source) ?? "next-overlay",
  };
}

function mapCloneControlloRecord(record: NextAutistiCloneControlloRecord): RawRecord {
  return {
    id: record.id,
    autistaNome: record.autistaNome,
    nomeAutista: record.autistaNome,
    badgeAutista: record.badgeAutista,
    targaCamion: normalizeTarga(record.targaCamion),
    targaMotrice: normalizeTarga(record.targaCamion),
    targaRimorchio: normalizeTarga(record.targaRimorchio),
    target: record.target,
    check: record.check,
    note: record.note,
    timestamp: record.timestamp,
    source: record.source,
    syncState: "local-only",
  };
}

function normalizeRichiestaRecord(record: RawRecord, index: number): RawRecord {
  const autistaNome =
    normalizeOptionalText(record.autistaNome) ??
    normalizeOptionalText(record.nomeAutista);
  const badgeAutista =
    normalizeOptionalText(record.badgeAutista) ??
    normalizeOptionalText(record.badge);

  return {
    id: normalizeOptionalText(record.id) ?? `richiesta:${index}:${toTimestamp(record.timestamp ?? record.data) ?? 0}`,
    testo:
      normalizeOptionalText(record.testo) ??
      normalizeOptionalText(record.descrizione),
    autistaNome,
    nomeAutista: autistaNome,
    badgeAutista,
    targa: normalizeTarga(record.targa),
    targaCamion: normalizeTarga(record.targaCamion),
    targaRimorchio: normalizeTarga(record.targaRimorchio),
    timestamp: toTimestamp(record.timestamp ?? record.data),
    stato: normalizeOptionalText(record.stato) ?? "nuova",
    letta: typeof record.letta === "boolean" ? record.letta : false,
    fotoDataUrl: normalizeOptionalText(record.fotoDataUrl),
    fotoUrl: normalizeOptionalText(record.fotoUrl),
    fotoUrls: Array.isArray(record.fotoUrls) ? record.fotoUrls : [],
    foto: Array.isArray(record.foto) ? record.foto : [],
    source: normalizeOptionalText(record.source) ?? "next-overlay",
    syncState: normalizeOptionalText(record.syncState),
  };
}

function mapCloneRichiestaRecord(
  record: NextAutistiCloneRichiestaAttrezzatureRecord,
): RawRecord {
  return {
    id: record.id,
    testo: record.testo,
    autistaNome: record.autistaNome,
    nomeAutista: record.autistaNome,
    badgeAutista: record.badgeAutista,
    targaCamion: normalizeTarga(record.targaCamion),
    targaRimorchio: normalizeTarga(record.targaRimorchio),
    timestamp: record.timestamp,
    stato: record.stato,
    letta: record.letta,
    fotoUrl: record.fotoUrl,
    foto: record.attachments.map((attachment) => attachment.previewUrl),
    source: record.source,
    syncState: record.syncState,
  };
}

function normalizeRifornimentoRecord(record: RawRecord, index: number): RawRecord {
  const autistaNome =
    normalizeOptionalText(record.autistaNome) ??
    normalizeOptionalText(record.nomeAutista);
  const badgeAutista =
    normalizeOptionalText(record.badgeAutista) ??
    normalizeOptionalText(record.badge);
  const targaCamion =
    normalizeTarga(record.targaCamion) ??
    normalizeTarga(record.targaMotrice) ??
    normalizeTarga(record.mezzoTarga) ??
    normalizeTarga(record.targa);

  return {
    id: normalizeOptionalText(record.id) ?? `rifornimento:${index}:${toTimestamp(record.data ?? record.timestamp) ?? 0}`,
    targaCamion,
    targaMotrice: targaCamion,
    targaRimorchio: normalizeTarga(record.targaRimorchio),
    mezzoTarga: targaCamion,
    autistaNome,
    nomeAutista: autistaNome,
    badgeAutista,
    tipo: normalizeOptionalText(record.tipo),
    metodoPagamento: normalizeOptionalText(record.metodoPagamento),
    paese: normalizeOptionalText(record.paese),
    km: record.km ?? null,
    litri: record.litri ?? null,
    importo: record.importo ?? record.costo ?? null,
    costo: record.costo ?? record.importo ?? null,
    note: normalizeOptionalText(record.note),
    data: toTimestamp(record.data ?? record.timestamp),
    timestamp: toTimestamp(record.timestamp ?? record.data),
    flagVerifica: typeof record.flagVerifica === "boolean" ? record.flagVerifica : false,
    confermatoAutista:
      typeof record.confermatoAutista === "boolean"
        ? record.confermatoAutista
        : true,
    source: normalizeOptionalText(record.source) ?? "next-overlay",
    syncState: normalizeOptionalText(record.syncState),
  };
}

function mapCloneRifornimentoRecord(
  record: NextAutistiCloneRifornimentoRecord,
): RawRecord {
  return {
    id: record.id,
    targaCamion: normalizeTarga(record.targaCamion),
    targaMotrice: normalizeTarga(record.targaCamion),
    targaRimorchio: normalizeTarga(record.targaRimorchio),
    mezzoTarga: normalizeTarga(record.targaCamion),
    autistaNome: record.autistaNome,
    nomeAutista: record.autistaNome,
    badgeAutista: record.badgeAutista,
    tipo: record.tipo,
    metodoPagamento: record.metodoPagamento,
    paese: record.paese,
    km: record.km,
    litri: record.litri,
    importo: record.importo,
    costo: record.importo,
    note: record.note,
    data: record.data,
    timestamp: record.data,
    flagVerifica: record.flagVerifica,
    confermatoAutista: record.confermatoAutista,
    source: record.source,
    syncState: record.syncState,
  };
}

function normalizeGommeRecord(record: RawRecord, index: number): RawRecord {
  const autistaNome =
    normalizeOptionalText(
      (record.autista as { nome?: unknown } | undefined)?.nome,
    ) ??
    normalizeOptionalText(record.autistaNome) ??
    normalizeOptionalText(record.nomeAutista);
  const badgeAutista =
    normalizeOptionalText(
      (record.autista as { badge?: unknown } | undefined)?.badge,
    ) ??
    normalizeOptionalText(record.badgeAutista) ??
    normalizeOptionalText(record.badge);

  return {
    id: normalizeOptionalText(record.id) ?? `gomme:${index}:${toTimestamp(record.data ?? record.timestamp) ?? 0}`,
    targetType: normalizeOptionalText(record.targetType),
    targetTarga:
      normalizeTarga(record.targetTarga) ??
      normalizeTarga(record.targa) ??
      normalizeTarga(record.targaCamion) ??
      normalizeTarga(record.targaRimorchio),
    categoria: normalizeOptionalText(record.categoria),
    km: record.km ?? null,
    data: toTimestamp(record.data ?? record.timestamp),
    timestamp: toTimestamp(record.timestamp ?? record.data),
    tipo: normalizeOptionalText(record.tipo),
    stato: normalizeOptionalText(record.stato),
    letta: typeof record.letta === "boolean" ? record.letta : false,
    gommeIds: Array.isArray(record.gommeIds) ? record.gommeIds : [],
    asseId: normalizeOptionalText(record.asseId),
    asseLabel: normalizeOptionalText(record.asseLabel),
    rotazioneSchema: normalizeOptionalText(record.rotazioneSchema),
    rotazioneText: normalizeOptionalText(record.rotazioneText),
    autista: {
      nome: autistaNome,
      badge: badgeAutista,
    },
    autistaNome,
    badgeAutista,
  };
}

export async function readNextAutistiLegacyStorageOverrides(): Promise<
  Record<string, unknown>
> {
  const [
    sessioniResult,
    eventiResult,
    segnalazioniResult,
    controlliResult,
    richiesteResult,
    rifornimentiResult,
    gommeResult,
  ] = await Promise.all([
    readNextUnifiedStorageDocument({ key: SESSIONI_KEY }),
    readNextUnifiedStorageDocument({ key: EVENTI_KEY }),
    readNextUnifiedStorageDocument({ key: SEGNALAZIONI_KEY }),
    readNextUnifiedStorageDocument({ key: CONTROLLI_KEY }),
    readNextUnifiedStorageDocument({ key: RICHIESTE_KEY }),
    readNextUnifiedStorageDocument({ key: RIFORNIMENTI_KEY }),
    readNextUnifiedStorageDocument({ key: GOMME_KEY }),
  ]);

  const localSession = buildLocalSessionRecord();

  const sessioni = dedupeById([
    ...sessioniResult.records.map(normalizeSessionRecord),
    ...(localSession ? [localSession] : []),
  ]);

  const eventi = dedupeById(eventiResult.records.map(normalizeEventRecord));
  const segnalazioni = dedupeById([
    ...segnalazioniResult.records.map(normalizeSegnalazioneRecord),
    ...getNextAutistiCloneSegnalazioni().map(mapCloneSegnalazioneRecord),
  ]);
  const controlli = dedupeById([
    ...controlliResult.records.map(normalizeControlloRecord),
    ...getNextAutistiCloneControlli().map(mapCloneControlloRecord),
  ]);
  const richieste = dedupeById([
    ...richiesteResult.records.map(normalizeRichiestaRecord),
    ...getNextAutistiCloneRichiesteAttrezzature().map(mapCloneRichiestaRecord),
  ]);
  const rifornimenti = dedupeById([
    ...rifornimentiResult.records.map(normalizeRifornimentoRecord),
    ...getNextAutistiCloneRifornimenti().map(mapCloneRifornimentoRecord),
  ]);
  const gomme = dedupeById(gommeResult.records.map(normalizeGommeRecord));

  return {
    [SESSIONI_KEY]: sessioni,
    [EVENTI_KEY]: eventi,
    [SEGNALAZIONI_KEY]: segnalazioni,
    [CONTROLLI_KEY]: controlli,
    [RICHIESTE_KEY]: richieste,
    [RIFORNIMENTI_KEY]: rifornimenti,
    [GOMME_KEY]: gomme,
  };
}
