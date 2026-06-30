import {
  saveNextManutenzioneBusinessRecord,
  type NextManutenzioneBusinessSavePayload,
} from "../domain/nextManutenzioniDomain";
import type { NextManutenzioneAsseCoinvoltoId } from "../domain/nextManutenzioniGommeDomain";
import { getItemSync, setItemSync } from "../../utils/storageSync";
import { CloneWriteBlockedError } from "../../utils/cloneWriteBarrier";

// BUG 54 — Opzione B: l'azione "Importa" della sezione Gomme (admin autisti)
// promuove un evento gomme dell'app autisti (`@cambi_gomme_autisti_tmp`) a
// manutenzione UFFICIALE "eseguita" in `@manutenzioni`, con i marcatori gomme
// strutturati. Cosi' diventa una `manutenzione_derivata` e compare nel Dossier
// Gomme (che mostra solo le manutenzioni derivate, non gli eventi esterni).
//
// Perimetro scritture: SOLO `@manutenzioni` (via writer canonico) e
// `@cambi_gomme_autisti_tmp` (marcatura "importato"). Entrambe le chiavi sono
// gia' consentite dal barrier clone sul path `/next/autisti-admin`
// (AUTISTI_ADMIN_INBOX_ALLOWED_STORAGE_KEYS), quindi non serve un nuovo scope.
// Il writer canonico tenta scritture collaterali su `@inventario`/
// `@materialiconsegnati` solo se la manutenzione ha materiali: qui `materiali`
// e' sempre vuoto, quindi e' un no-op (ed e' comunque bloccato dal barrier su
// questo path). Nessun effetto su giacenze.

const CAMBI_GOMME_TMP_KEY = "@cambi_gomme_autisti_tmp";

export type GommeImportInterventoTipo = "ordinario" | "straordinario";

export type GommeImportManutenzioneInput = {
  /** id del record evento in `@cambi_gomme_autisti_tmp` */
  eventoId: string;
  targa: string;
  /** data esecuzione in formato yyyy-mm-dd */
  data: string;
  km: number | null;
  /** km al momento della SEGNALAZIONE (facoltativo): mostrato come "segnalato a X km". */
  kmSegnalazione?: number | null;
  /** assi effettivamente cambiati (uno o piu') */
  assiCoinvolti: NextManutenzioneAsseCoinvoltoId[];
  /** numero gomme effettivamente cambiate (totale) */
  numeroGomme?: number | null;
  marca?: string | null;
  interventoTipo: GommeImportInterventoTipo;
  /** motivo per gli interventi straordinari */
  motivo?: string | null;
  segnalatoDa?: string | null;
  /**
   * Se valorizzato, NON crea un nuovo record: COMPLETA la manutenzione esistente
   * con questo id (riempie km cambio, assi, stato eseguita) e conserva il km gia'
   * presente come kmSegnalazione. Scelta SEMPRE esplicita dell'utente nel modale
   * (mai automatica): evita il doppione segnalazione + cambio.
   */
  completaManutenzioneId?: string | null;
};

export type GommeImportManutenzioneResult = {
  ok: boolean;
  error?: string;
  manutenzioneId?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapList(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.value)) return raw.value.filter(isRecord);
  return [];
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

const ASSE_LABELS: Record<NextManutenzioneAsseCoinvoltoId, string> = {
  anteriore: "Anteriore",
  posteriore: "Posteriore",
  asse1: "1 asse",
  asse2: "2 asse",
  asse3: "3 asse",
};

/**
 * Un evento gomme e' gia' importato se e' marcato `stato: "importato"` oppure ha
 * gia' un `linkedManutenzioneId`. Reader puro: usato per la guardia idempotente
 * lato writer e per nascondere l'azione "Importa" lato UI.
 */
export function isGommeEventoImportato(record: unknown): boolean {
  if (!isRecord(record)) return false;
  if (normalizeText(record.stato).toLowerCase() === "importato") return true;
  return normalizeText(record.linkedManutenzioneId).length > 0;
}

function uniqueAssi(
  assi: readonly NextManutenzioneAsseCoinvoltoId[],
): NextManutenzioneAsseCoinvoltoId[] {
  return Array.from(new Set(assi.filter((id) => Boolean(id))));
}

function buildAssiLabel(assi: readonly NextManutenzioneAsseCoinvoltoId[]): string | null {
  const labels = uniqueAssi(assi).map((id) => ASSE_LABELS[id]);
  return labels.length ? labels.join(", ") : null;
}

function buildDescrizione(input: GommeImportManutenzioneInput): string {
  const assiLabel = buildAssiLabel(input.assiCoinvolti);
  const parts: string[] = [];
  if (input.interventoTipo === "straordinario") {
    parts.push(assiLabel ? `CAMBIO GOMME STRAORDINARIO - ${assiLabel}` : "CAMBIO GOMME STRAORDINARIO");
    const motivo = normalizeText(input.motivo);
    if (motivo) parts.push(motivo);
  } else {
    parts.push(assiLabel ? `CAMBIO GOMME ORDINARIO - ${assiLabel}` : "CAMBIO GOMME ORDINARIO");
    const marca = normalizeText(input.marca);
    if (marca) parts.push(marca);
  }
  const base = parts.join(" - ");
  const numero =
    typeof input.numeroGomme === "number" && Number.isFinite(input.numeroGomme) && input.numeroGomme > 0
      ? input.numeroGomme
      : null;
  return numero ? `${base} (${numero} gomme)` : base;
}

const MANUTENZIONI_KEY = "@manutenzioni";
const FINESTRA_COMPLETAMENTO_GG = 120;
const MS_DAY = 24 * 60 * 60 * 1000;

export type ManutenzioneDaCompletare = {
  id: string;
  descrizione: string;
  stato: string;
  data: string | null;
  km: number | null;
  asseLabels: string[];
};

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function recordAsseIds(record: Record<string, unknown>): string[] {
  const ids = new Set<string>();
  const push = (v: unknown) => {
    const s = normalizeText(v).toLowerCase();
    if (s) ids.add(s);
  };
  if (Array.isArray(record.assiCoinvolti)) record.assiCoinvolti.forEach(push);
  if (Array.isArray(record.gommePerAsse)) {
    record.gommePerAsse.forEach((e) => push((e as Record<string, unknown> | null)?.asseId));
  }
  const straord = record.gommeStraordinario as Record<string, unknown> | null;
  if (straord && typeof straord === "object") push(straord.asseId);
  return [...ids];
}

function parseDataMs(value: string | null): number | null {
  if (!value || !value.trim()) return null;
  const m = value.trim().match(/^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})/);
  if (m) {
    const year = m[3].length === 2 ? Number(`20${m[3]}`) : Number(m[3]);
    const d = new Date(year, Number(m[2]) - 1, Number(m[1]));
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  }
  const iso = Date.parse(value);
  return Number.isFinite(iso) ? iso : null;
}

/**
 * Reader puro (nessuna scrittura): manutenzioni gomme ancora APERTE per quella
 * targa che coinvolgono uno degli assi indicati, candidate al completamento da
 * un evento cambio. "Aperte" = stato daFare/programmata, oppure eseguita ma SENZA
 * struttura cambio per asse (record manuale/da segnalazione, non un cambio gia'
 * completo). Serve al modale per OFFRIRE la scelta "completa questa" all'utente.
 */
export async function findManutenzioniGommeDaCompletare(
  targa: string,
  asseIds: readonly NextManutenzioneAsseCoinvoltoId[],
  finestraGiorni: number = FINESTRA_COMPLETAMENTO_GG,
): Promise<ManutenzioneDaCompletare[]> {
  const targaNorm = normalizeText(targa).toUpperCase();
  if (!targaNorm || asseIds.length === 0) return [];
  const wanted = new Set(asseIds.map((a) => String(a).toLowerCase()));
  const list = unwrapList(await getItemSync(MANUTENZIONI_KEY));
  const cutoff = Date.now() - finestraGiorni * MS_DAY;
  const out: Array<{ c: ManutenzioneDaCompletare; sort: number }> = [];

  for (const record of list) {
    if (normalizeText(record.targa).toUpperCase() !== targaNorm) continue;
    const id = normalizeText(record.id);
    if (!id) continue;
    const stato = normalizeText(record.stato).toLowerCase();
    // Candidati = lavoro ancora PENDENTE (da fare / programmata). Le manutenzioni
    // gia' "eseguita" sono interventi conclusi (anche straordinari/forature) e NON
    // vanno completate da un nuovo cambio: per quelle l'admin sceglie "crea nuovo".
    const isOpen = stato === "dafare" || stato === "programmata";
    if (!isOpen) continue;
    const assi = recordAsseIds(record);
    if (!assi.some((a) => wanted.has(a))) continue;
    const data = normalizeText(record.data) || normalizeText(record.dataEsecuzione) || null;
    const ms = parseDataMs(data);
    if (ms !== null && ms < cutoff) continue;
    out.push({
      c: {
        id,
        descrizione: normalizeText(record.descrizione) || "(senza descrizione)",
        stato: stato || "(senza stato)",
        data,
        km: toNumberOrNull(record.km),
        asseLabels: assi.map(
          (a) => ASSE_LABELS[a as NextManutenzioneAsseCoinvoltoId] ?? a,
        ),
      },
      sort: ms ?? 0,
    });
  }
  out.sort((a, b) => b.sort - a.sort);
  return out.map((e) => e.c);
}

async function writeManutenzioniList(
  raw: unknown,
  list: Record<string, unknown>[],
): Promise<void> {
  if (isRecord(raw) && Array.isArray(raw.value)) {
    await setItemSync(MANUTENZIONI_KEY, { ...raw, value: list });
    return;
  }
  if (isRecord(raw) && Array.isArray(raw.items)) {
    await setItemSync(MANUTENZIONI_KEY, { ...raw, items: list });
    return;
  }
  await setItemSync(MANUTENZIONI_KEY, list);
}

async function markEventoImportato(eventoId: string, manutenzioneId: string): Promise<void> {
  try {
    const freshList = unwrapList(await getItemSync(CAMBI_GOMME_TMP_KEY));
    const nextTmp = freshList.map((record) =>
      normalizeText(record.id) === eventoId
        ? { ...record, stato: "importato", letta: true, linkedManutenzioneId: manutenzioneId }
        : record,
    );
    await setItemSync(CAMBI_GOMME_TMP_KEY, nextTmp);
  } catch (error: unknown) {
    console.warn("[GOMME_IMPORT] marcatura evento importato fallita:", error);
  }
}

/**
 * Ramo "completa esistente": invece di creare un nuovo record, patcha la
 * manutenzione scelta dall'utente con i dati del cambio (km cambio, assi, stato
 * eseguita) e CONSERVA il km gia' presente come `kmSegnalazione`. Nessun doppione.
 */
async function completaManutenzioneEsistente(
  targetId: string,
  input: GommeImportManutenzioneInput,
  eventoId: string,
): Promise<GommeImportManutenzioneResult> {
  const raw = await getItemSync(MANUTENZIONI_KEY);
  const list = unwrapList(raw);
  const idx = list.findIndex((r) => normalizeText(r.id) === targetId);
  if (idx < 0) {
    return { ok: false, error: "Manutenzione da completare non trovata (riprova)." };
  }
  const target = list[idx];
  const assi = uniqueAssi(input.assiCoinvolti ?? []);
  // Il km gia' presente sul record e' il km al momento della SEGNALAZIONE: lo
  // spostiamo in kmSegnalazione, mentre km diventa il km del cambio effettivo.
  const kmSegnalazione =
    toNumberOrNull(input.kmSegnalazione) ??
    toNumberOrNull(target.km) ??
    toNumberOrNull(target.kmSegnalazione);
  const marca = normalizeText(input.marca);
  const baseDesc = normalizeText(target.descrizione);
  const descrizione =
    marca && !baseDesc.toLowerCase().includes(marca.toLowerCase())
      ? `${baseDesc}${baseDesc ? "\n" : ""}Cambio gomme eseguito · ${marca}`
      : baseDesc || buildDescrizione(input);

  const straordPrec = target.gommeStraordinario as Record<string, unknown> | null;
  const patched: Record<string, unknown> = {
    ...target,
    stato: "eseguita",
    km: input.km,
    kmSegnalazione,
    dataEsecuzione: input.data,
    eseguitoDa: normalizeText(input.segnalatoDa) || normalizeText(target.eseguitoDa) || null,
    descrizione,
    ...(input.interventoTipo === "ordinario" && assi.length > 0
      ? {
          gommeInterventoTipo: "ordinario" as const,
          assiCoinvolti: assi,
          gommePerAsse: assi.map((asseId) => ({
            asseId,
            dataCambio: input.data,
            kmCambio: input.km,
          })),
          gommeStraordinario: null,
        }
      : {
          gommeInterventoTipo: "straordinario" as const,
          gommeStraordinario: {
            asseId: assi[0] ?? (straordPrec?.asseId as string | null) ?? null,
            quantita:
              typeof input.numeroGomme === "number" && Number.isFinite(input.numeroGomme)
                ? input.numeroGomme
                : (straordPrec?.quantita as number | null) ?? null,
            motivo: normalizeText(input.motivo) || (straordPrec?.motivo as string | null) || null,
          },
        }),
  };

  const nextList = list.slice();
  nextList[idx] = patched;
  try {
    await writeManutenzioniList(raw, nextList);
  } catch (error: unknown) {
    if (error instanceof CloneWriteBlockedError) {
      return {
        ok: false,
        error:
          "Scrittura bloccata dal barrier clone (completamento gomme). Verificare che la pagina sia nel perimetro autorizzato.",
      };
    }
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Errore completamento manutenzione gomme.",
    };
  }
  await markEventoImportato(eventoId, targetId);
  return { ok: true, manutenzioneId: targetId };
}

export async function importGommeEventoComeManutenzioneEseguita(
  input: GommeImportManutenzioneInput,
): Promise<GommeImportManutenzioneResult> {
  const eventoId = normalizeText(input.eventoId);
  if (!eventoId) return { ok: false, error: "ID evento gomme mancante." };
  const targa = normalizeText(input.targa).toUpperCase();
  if (!targa) return { ok: false, error: "Targa mancante." };
  const data = normalizeText(input.data);
  if (!data) return { ok: false, error: "Data mancante." };
  const assi = uniqueAssi(input.assiCoinvolti ?? []);
  if (input.interventoTipo === "ordinario" && assi.length === 0) {
    return { ok: false, error: "Seleziona almeno un asse per un cambio gomme ordinario." };
  }

  // Guardia idempotente: se l'evento e' gia' stato importato non si ricrea.
  const tmpRaw = await getItemSync(CAMBI_GOMME_TMP_KEY);
  const tmpList = unwrapList(tmpRaw);
  const evento = tmpList.find((record) => normalizeText(record.id) === eventoId);
  if (evento && isGommeEventoImportato(evento)) {
    return { ok: false, error: "Questo evento gomme è già stato importato." };
  }

  // Scelta ESPLICITA dell'utente (mai automatica): completa una manutenzione
  // esistente invece di crearne una nuova → evita il doppione segnalazione+cambio.
  const completaId = normalizeText(input.completaManutenzioneId);
  if (completaId) {
    return await completaManutenzioneEsistente(completaId, input, eventoId);
  }

  const segnalatoDa = normalizeText(input.segnalatoDa) || null;
  const payload: NextManutenzioneBusinessSavePayload = {
    targa,
    tipo: "mezzo",
    descrizione: buildDescrizione(input),
    data,
    dataEsecuzione: data,
    stato: "eseguita",
    km: input.km,
    ...(typeof input.kmSegnalazione === "number" && input.kmSegnalazione > 0
      ? { kmSegnalazione: input.kmSegnalazione }
      : {}),
    segnalatoDa,
    eseguitoDa: segnalatoDa,
    materiali: [],
    ...(input.interventoTipo === "ordinario" && assi.length > 0
      ? {
          gommeInterventoTipo: "ordinario" as const,
          assiCoinvolti: assi,
          gommePerAsse: assi.map((asseId) => ({
            asseId,
            dataCambio: data,
            kmCambio: input.km,
          })),
        }
      : {
          gommeInterventoTipo: "straordinario" as const,
          gommeStraordinario: {
            asseId: assi[0] ?? null,
            quantita:
              typeof input.numeroGomme === "number" && Number.isFinite(input.numeroGomme)
                ? input.numeroGomme
                : null,
            motivo: normalizeText(input.motivo) || null,
          },
        }),
  };

  let manutenzioneId: string;
  try {
    const saved = await saveNextManutenzioneBusinessRecord(payload);
    manutenzioneId = normalizeText(saved.id);
  } catch (error: unknown) {
    if (error instanceof CloneWriteBlockedError) {
      return {
        ok: false,
        error:
          "Scrittura bloccata dal barrier clone (import gomme). Verificare che la pagina sia nel perimetro autorizzato.",
      };
    }
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Errore creazione manutenzione gomme.",
    };
  }

  // Marca l'evento tmp come importato (idempotenza + traccia del legame).
  // Non bloccante: la manutenzione e' gia' creata.
  try {
    const freshRaw = await getItemSync(CAMBI_GOMME_TMP_KEY);
    const freshList = unwrapList(freshRaw);
    const nextTmp = freshList.map((record) =>
      normalizeText(record.id) === eventoId
        ? {
            ...record,
            stato: "importato",
            letta: true,
            linkedManutenzioneId: manutenzioneId,
          }
        : record,
    );
    await setItemSync(CAMBI_GOMME_TMP_KEY, nextTmp);
  } catch (error: unknown) {
    console.warn("[GOMME_IMPORT] marcatura evento importato fallita:", error);
  }

  return { ok: true, manutenzioneId };
}
