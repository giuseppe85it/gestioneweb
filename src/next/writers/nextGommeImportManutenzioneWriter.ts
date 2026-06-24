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
  asseId: NextManutenzioneAsseCoinvoltoId | null;
  marca?: string | null;
  interventoTipo: GommeImportInterventoTipo;
  /** motivo per gli interventi straordinari */
  motivo?: string | null;
  segnalatoDa?: string | null;
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

function buildDescrizione(input: GommeImportManutenzioneInput): string {
  const asseLabel = input.asseId ? ASSE_LABELS[input.asseId] : null;
  if (input.interventoTipo === "straordinario") {
    const motivo = normalizeText(input.motivo);
    const base = asseLabel
      ? `CAMBIO GOMME STRAORDINARIO - ${asseLabel}`
      : "CAMBIO GOMME STRAORDINARIO";
    return motivo ? `${base} - ${motivo}` : base;
  }
  const base = asseLabel
    ? `CAMBIO GOMME ORDINARIO - ${asseLabel}`
    : "CAMBIO GOMME ORDINARIO";
  const marca = normalizeText(input.marca);
  return marca ? `${base} - ${marca}` : base;
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
  if (input.interventoTipo === "ordinario" && !input.asseId) {
    return { ok: false, error: "Asse obbligatorio per un cambio gomme ordinario." };
  }

  // Guardia idempotente: se l'evento e' gia' stato importato non si ricrea.
  const tmpRaw = await getItemSync(CAMBI_GOMME_TMP_KEY);
  const tmpList = unwrapList(tmpRaw);
  const evento = tmpList.find((record) => normalizeText(record.id) === eventoId);
  if (evento && isGommeEventoImportato(evento)) {
    return { ok: false, error: "Questo evento gomme è già stato importato." };
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
    segnalatoDa,
    eseguitoDa: segnalatoDa,
    materiali: [],
    ...(input.interventoTipo === "ordinario" && input.asseId
      ? {
          gommeInterventoTipo: "ordinario" as const,
          assiCoinvolti: [input.asseId],
          gommePerAsse: [
            { asseId: input.asseId, dataCambio: data, kmCambio: input.km },
          ],
        }
      : {
          gommeInterventoTipo: "straordinario" as const,
          gommeStraordinario: {
            asseId: input.asseId,
            quantita: null,
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
