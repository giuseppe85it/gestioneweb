/**
 * PROMPT 40 — Frase storia unificata.
 *
 * Fonte unica di verita' per la frase narrativa che descrive un record
 * (segnalazione / controllo KO / manutenzione) lungo il suo ciclo:
 * apertura -> presa in carico -> esecuzione, con eventuale modalita' di chiusura.
 *
 * Forma standard:
 *   "<Tipo> del <data apertura>, presa in carico il <data presa in carico>,
 *    eseguita il <data esecuzione>." [+ suffisso modalita' chiusura]
 *
 * Regole:
 * - Verbo unico "Risolta" per officina ed evento autisti; "Chiusa" solo per
 *   chiusura manuale esplicita.
 * - Date sempre via dateUnica.toDisplay() (GG/MM/AAAA). Mai ora/minuti.
 * - Segmenti assenti vengono semplicemente omessi (vedi varianti sotto).
 */

import { parseAnyDate, toDisplay } from "./dateUnica";

export type TipoRecordStoria = "segnalazione" | "controllo_ko" | "manutenzione";

export type ModalitaChiusura = "officina" | "evento_autisti" | "manuale";

export type RecordChiuso = {
  /** Tipo del record. Obbligatorio. */
  tipo: TipoRecordStoria;
  /** Data di apertura/segnalazione. Obbligatoria (qualsiasi formato gestito da dateUnica). */
  dataApertura: unknown;
  /** Data di presa in carico, se disponibile. */
  dataPresaInCarico?: unknown;
  /** Data di esecuzione/chiusura, se disponibile. */
  dataEsecuzione?: unknown;
  /** Modalita' di chiusura. Se assente, nessun suffisso. */
  modalitaChiusura?: ModalitaChiusura;
  /** Nome officina, usato solo con modalitaChiusura "officina". */
  nomeOfficina?: string;
  /** Data dell'evento risolutivo, usata solo con modalitaChiusura "evento_autisti". */
  dataEventoChiusura?: unknown;
  /**
   * PROMPT 45 T2 — Nome di chi ha aperto/segnalato il record. Quando valorizzato e
   * diverso dal sentinel "autista" (fallback writer PROMPT 41 per nome mancante),
   * modifica la prima frase in "<Tipo> di <nome> del <data>...".
   */
  segnalatoDa?: string;
};

const TIPO_LABEL: Record<TipoRecordStoria, string> = {
  segnalazione: "Segnalazione",
  controllo_ko: "Controllo KO",
  manutenzione: "Manutenzione",
};

function resolveTipoLabel(tipo: unknown): string {
  if (tipo === "segnalazione" || tipo === "controllo_ko" || tipo === "manutenzione") {
    return TIPO_LABEL[tipo];
  }
  return "Record";
}

function buildSuffissoChiusura(record: RecordChiuso): string {
  if (record.modalitaChiusura === "evento_autisti") {
    const eventoDisplay = toDisplay(record.dataEventoChiusura);
    return eventoDisplay
      ? ` Risolta dal cambio gomme del ${eventoDisplay}.`
      : " Risolta dal cambio gomme.";
  }
  if (record.modalitaChiusura === "officina") {
    const officina = String(record.nomeOfficina ?? "").trim();
    return officina
      ? ` Risolta dall'intervento officina ${officina}.`
      : " Risolta dall'intervento officina.";
  }
  if (record.modalitaChiusura === "manuale") {
    return " Chiusa manualmente.";
  }
  return "";
}

/**
 * Costruisce la frase storia standard a partire da un RecordChiuso.
 * Ritorna sempre una stringa non vuota (almeno "<Tipo>.").
 */
export function buildFraseStoria(record: RecordChiuso): string {
  const tipoLabel = resolveTipoLabel(record.tipo);

  // PROMPT 45 T2: se segnalatoDa contiene un nome reale (non il sentinel "autista"
  // che il writer PROMPT 41 usa come fallback per nome mancante), arricchisce la
  // label di tipo in "<Tipo> di <nome>".
  const segnalatore = String(record.segnalatoDa ?? "").trim();
  const segnalatoreReale = segnalatore.length > 0 && segnalatore.toLowerCase() !== "autista";
  const tipoLabelEsteso = segnalatoreReale ? `${tipoLabel} di ${segnalatore}` : tipoLabel;

  const aperturaDisplay = toDisplay(record.dataApertura);
  const presaDisplay = toDisplay(record.dataPresaInCarico);
  const esecuzioneDisplay = toDisplay(record.dataEsecuzione);

  const hasApertura = aperturaDisplay !== "";
  const hasPresa = presaDisplay !== "";
  const hasEsecuzione = esecuzioneDisplay !== "";

  const aperturaPart = hasApertura ? `${tipoLabelEsteso} del ${aperturaDisplay}` : tipoLabelEsteso;

  let main: string;
  if (hasPresa && hasEsecuzione) {
    main = `${aperturaPart}, presa in carico il ${presaDisplay}, eseguita il ${esecuzioneDisplay}.`;
  } else if (!hasPresa && hasEsecuzione) {
    main = `${aperturaPart}, eseguita il ${esecuzioneDisplay}.`;
  } else if (hasPresa && !hasEsecuzione) {
    main = `${aperturaPart}, presa in carico il ${presaDisplay}.`;
  } else {
    main = `${aperturaPart}.`;
  }

  return main + buildSuffissoChiusura(record);
}

// ---------------------------------------------------------------------------
// Adapter raw -> RecordChiuso
//
// Mappa un record con shape `@manutenzioni` (o equivalente legacy con gli
// stessi campi) in RecordChiuso, derivando la modalita' di chiusura.
// `modalitaChiusura` NON e' un campo Firestore: viene derivata.
// Sorgente unica della mappatura: ogni superficie che mostra una manutenzione
// deve passare per questo adapter, non reinventare la conversione.
// ---------------------------------------------------------------------------

type RawRecord = Record<string, unknown>;

const EMPTY_TEXT_VALUES = new Set(["", "-", "—", "n/d", "nd"]);

function readText(record: RawRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") {
      const normalized = value.trim();
      if (normalized && !EMPTY_TEXT_VALUES.has(normalized.toLowerCase())) return normalized;
    }
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

/** Ritorna il primo valore grezzo fra le chiavi che dateUnica sa interpretare. */
function readDateRaw(record: RawRecord, keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (parseAnyDate(value) !== null) return value;
  }
  return undefined;
}

function sourceTimestamp(record: RawRecord): number {
  const raw = readDateRaw(record, ["dataInserimento", "createdAt", "timestamp", "data", "dataProgrammata"]);
  return parseAnyDate(raw)?.getTime() ?? 0;
}

function resolveTipoDaOrigine(origineTipo: string | null): TipoRecordStoria {
  if (origineTipo === "segnalazione") return "segnalazione";
  if (origineTipo === "controllo") return "controllo_ko";
  return "manutenzione";
}

/**
 * Converte un record manutenzione grezzo in RecordChiuso.
 * `tipoOverride` forza il tipo (utile per superfici che conoscono gia' il kind,
 * es. righe segnalazione/richiesta dell'Archivio).
 *
 * PROMPT 49: `options.sourceRecord` (opzionale) permette il cross-read della
 * sorgente quando la manutenzione ha un back-link `origineRefId`. Senza questo
 * parametro, la frase pesca data/autore dalla manutenzione stessa (comportamento
 * pre-49, valido per record stand-alone). Con il parametro, `dataApertura`,
 * `dataPresaInCarico` e `segnalatoDa` vengono letti dal record sorgente (la
 * segnalazione o controllo originale), che e' semanticamente corretto:
 *
 *   prima:   "Segnalazione del <data manutenzione>, eseguita il <data manutenzione>"  (sbagliato)
 *   dopo:    "Segnalazione di <autista> del <data sorgente>, eseguita il <data manutenzione>"  (corretto)
 */
export type RecordChiusoOptions = {
  /**
   * Record sorgente (segnalazione/controllo) collegato alla manutenzione via
   * `origineRefId`. Quando presente, `dataApertura`/`dataPresaInCarico`/`segnalatoDa`
   * vengono letti da questo record, non dalla manutenzione stessa.
   */
  sourceRecord?: RawRecord | null;
  sourceRecords?: RawRecord[] | null;
};

export function recordChiusoFromRaw(
  raw: RawRecord | null | undefined,
  tipoOverride?: TipoRecordStoria,
  options?: RecordChiusoOptions,
): RecordChiuso {
  const record: RawRecord = raw ?? {};
  const sourceList = options?.sourceRecords?.filter(Boolean) ?? [];
  const source: RawRecord | null =
    sourceList.length > 0
      ? [...sourceList].sort((a, b) => sourceTimestamp(b) - sourceTimestamp(a))[0]
      : options?.sourceRecord ?? null;
  // PROMPT 52: stato case-insensitive — alcune projection NEXT mettono uppercase
  // (es. nextAutistiDomain.ts segnalazioni: `stato.toUpperCase()`), mentre i
  // record raw @manutenzioni hanno lowercase. Normalizza sempre a lowercase.
  const statoRaw = readText(record, ["stato"]);
  const stato = statoRaw ? statoRaw.toLowerCase() : statoRaw;
  const origineTipo = readText(record, ["origineTipo"]);
  const tipo = tipoOverride ?? resolveTipoDaOrigine(origineTipo);

  // PROMPT 49: se la sorgente e' nota, dataApertura/presaInCarico/segnalatoDa
  // sono letti da li' (cross-read). Altrimenti fallback sul record stesso.
  const dataAperturaCandidate = source
    ? readDateRaw(source, [
        "dataInserimento",
        "createdAt",
        "timestamp",
        "data",
        "dataProgrammata",
      ])
    : undefined;
  const dataApertura =
    dataAperturaCandidate ??
    readDateRaw(record, [
      "dataInserimento",
      "createdAt",
      "timestamp",
      "data",
      "dataProgrammata",
    ]);

  const dataPresaInCaricoCandidate = source
    ? readDateRaw(source, [
        "dataPresaInCarico",
        "presaInCaricoData",
        "presaInCaricoAt",
        "dataInCarico",
      ])
    : undefined;
  const dataPresaInCarico =
    dataPresaInCaricoCandidate ??
    readDateRaw(record, [
      "dataPresaInCarico",
      "presaInCaricoData",
      "presaInCaricoAt",
      "dataInCarico",
    ]);

  // PROMPT 45 T2 + PROMPT 49: nome autore. Cross-read dalla sorgente se nota.
  const segnalatoDaFromSource = source
    ? readText(source, ["segnalatoDa", "autistaNome", "badgeAutista"])
    : null;
  const segnalatoDaText =
    segnalatoDaFromSource ??
    readText(record, ["segnalatoDa", "autistaNome", "badgeAutista"]);

  let modalitaChiusura: ModalitaChiusura | undefined;
  let nomeOfficina: string | undefined;
  let dataEventoChiusura: unknown;
  let dataEsecuzione: unknown;

  if (stato === "chiusa_da_evento") {
    modalitaChiusura = "evento_autisti";
    dataEventoChiusura = readDateRaw(record, ["chiusuraData", "dataEsecuzione", "data"]);
    dataEsecuzione = readDateRaw(record, ["dataEsecuzione", "data"]);
  } else if (stato === "eseguita") {
    const fornitore = readText(record, ["fornitore", "nomeOfficina", "officina"]);
    if (fornitore) {
      modalitaChiusura = "officina";
      nomeOfficina = fornitore;
    } else {
      modalitaChiusura = "manuale";
    }
    dataEsecuzione = readDateRaw(record, ["dataEsecuzione", "data"]);
  } else if (stato === "chiusa") {
    // PROMPT 52: segnalazioni/controlli chiusi via aggancio a manutenzione (PROMPT 44 D1:
    // chiudiSegnalazioneDaEvento / chiudiControlloDaEvento). Traccia chiusura in
    // `chiusuraDi` + `chiusuraData`. Per la frase storia, mappa:
    //   - `chiusuraDi === "gomme_evento"` → modalita' evento_autisti
    //   - tutto il resto (es. "manutenzione", "manuale") → modalita' manuale
    // `dataEsecuzione` = `chiusuraData` (timestamp ms) o fallback `dataChiusura` legacy.
    const chiusuraDiText = readText(record, ["chiusuraDi"]);
    if (chiusuraDiText === "gomme_evento") {
      modalitaChiusura = "evento_autisti";
      dataEventoChiusura = readDateRaw(record, ["chiusuraData", "dataChiusura", "dataEsecuzione"]);
    } else {
      modalitaChiusura = "manuale";
    }
    dataEsecuzione = readDateRaw(record, ["chiusuraData", "dataChiusura", "dataEsecuzione"]);
  }
  // daFare / programmata / nuova / stato assente: record non chiuso, nessuna modalita'.

  return {
    tipo,
    dataApertura,
    dataPresaInCarico,
    dataEsecuzione,
    modalitaChiusura,
    nomeOfficina,
    dataEventoChiusura,
    segnalatoDa: segnalatoDaText ?? undefined,
  };
}
