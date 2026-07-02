// Motore "spezza lavoro" del modulo Manutenzioni (piano "due mondi", Tappa 3).
// Un solo motore per due usi della UI:
//  A) "Dividi il lavoro…": da un lavoro Da fare ne nascono due, entrambi aperti
//     (l'originale può ricevere una descrizione aggiornata, il resto è nuovo);
//  B) "Fatto solo in parte": l'originale viene chiuso dal flusso di completamento
//     esistente e QUESTO motore crea il lavoro-resto ancora Da fare.
//
// Regole dure rispettate (verdetti analista-impatto-flussi + custode-contratti-dati):
//  - il resto nasce con stato "daFare" e tipo ESPLICITI (mai dedotti);
//  - id generato con randomUUID (mai Date.now, collisioni allo stesso ms);
//  - data EREDITATA dall'originale, mai dal momento del click;
//  - materiali SEMPRE vuoti e NESSUN marker gomme/olio copiato (eviterebbe il
//    doppio scarico inventario e il bug "doppia manutenzione gomme");
//  - parentela con campo passivo `spezzatoDaId` (figlio→padre): sopravvive agli
//    edit per il merge additivo del save di dominio e nessun writer lo tocca;
//    NON si usa il collegamento universale (auto-chiuderebbe il resto).
import { getItemSync, setItemSync } from "../../utils/storageSync";
import {
  CloneWriteBlockedError,
  assertCloneWriteAllowed,
  runWithCloneWriteScopedAllowance,
} from "../../utils/cloneWriteBarrier";

export const SPEZZA_MANUTENZIONE_WRITE_SCOPE = "manutenzioni_spezza_lavoro_write";

const MANUTENZIONI_KEY = "@manutenzioni";

type RawRecord = Record<string, unknown>;

export type SpezzaManutenzioneInput = {
  manutenzioneId: string;
  /** Descrizione del nuovo lavoro-resto (la parte ancora da fare). */
  descrizioneResto: string;
  /**
   * Solo caso "Dividi": nuova descrizione per il lavoro originale (la parte che
   * resta su di esso). Null/assente = l'originale non viene toccato.
   */
  descrizioneOriginale?: string | null;
  /**
   * Data da ereditare sul resto. Serve nel caso "fatto in parte": al completamento
   * il campo `data` dell'originale diventa la data di esecuzione, ma il resto deve
   * ereditare la data in cui il problema era stato registrato (pre-completamento).
   * Assente = si usa la data attuale dell'originale.
   */
  dataResto?: string | null;
};

export type SpezzaManutenzioneResult =
  | { ok: true; restoId: string }
  | { ok: false; error: string };

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapList(raw: unknown): RawRecord[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.value)) return raw.value.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.items)) return raw.items.filter(isRecord);
  return [];
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function generateRestoId(): string {
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

function sanitizeUrgenza(value: unknown): string {
  const urgenza = normalizeText(value).toLowerCase();
  return urgenza === "alta" || urgenza === "media" || urgenza === "bassa" ? urgenza : "media";
}

function sanitizeTipo(value: unknown): string {
  const tipo = normalizeText(value).toLowerCase();
  return tipo === "compressore" || tipo === "attrezzature" ? tipo : "mezzo";
}

/**
 * Crea il lavoro-resto a partire dall'originale e lo accoda a @manutenzioni.
 * Scrittura ATOMICA sulla stessa lista: eventuale descrizione aggiornata
 * dell'originale + append del resto in un solo setItemSync.
 */
export async function spezzaManutenzione(
  input: SpezzaManutenzioneInput,
): Promise<SpezzaManutenzioneResult> {
  const idTrim = normalizeText(input.manutenzioneId);
  const descrizioneResto = normalizeText(input.descrizioneResto);
  if (!idTrim) return { ok: false, error: "Id della manutenzione originale mancante." };
  if (idTrim.startsWith("manutenzione:")) {
    // Id sintetico posizionale dei record storici: la parentela si romperebbe al
    // primo riordino dell'array. Serve un record con id reale.
    return {
      ok: false,
      error:
        "Questa manutenzione storica non ha un id stabile: aprila in Modifica e salvala una volta, poi riprova.",
    };
  }
  if (!descrizioneResto) {
    return { ok: false, error: "Scrivi cosa resta da fare: la descrizione del nuovo lavoro è vuota." };
  }
  const descrizioneOriginale =
    input.descrizioneOriginale != null ? normalizeText(input.descrizioneOriginale) : null;
  if (input.descrizioneOriginale != null && !descrizioneOriginale) {
    return { ok: false, error: "La descrizione che resta sul lavoro originale è vuota." };
  }

  try {
    let restoId = "";
    await runWithCloneWriteScopedAllowance(SPEZZA_MANUTENZIONE_WRITE_SCOPE, async () => {
      const raw = await getItemSync(MANUTENZIONI_KEY);
      const list = unwrapList(raw);
      const index = list.findIndex((record) => normalizeText(record.id) === idTrim);
      if (index < 0) {
        throw new Error("Manutenzione originale non trovata in archivio.");
      }
      const originale = list[index];
      const targa = normalizeText(originale.targa).toUpperCase().replace(/\s+/g, "");
      if (!targa) {
        throw new Error("La manutenzione originale non ha una targa: impossibile creare il resto.");
      }

      restoId = generateRestoId();
      const resto: RawRecord = {
        id: restoId,
        tipo: sanitizeTipo(originale.tipo),
        targa,
        descrizione: descrizioneResto,
        // Data ereditata dall'originale (regola TIMESTAMP-MAI-DA-CLICK).
        data: input.dataResto != null ? normalizeText(input.dataResto) || null : originale.data ?? null,
        stato: "daFare",
        dataProgrammata: null,
        urgenza: sanitizeUrgenza(originale.urgenza),
        segnalatoDa: originale.segnalatoDa ?? null,
        eseguitoDa: null,
        origineTipo: "manuale",
        origineRefId: null,
        origineRefKey: null,
        km: null,
        ore: null,
        fornitore: null,
        importo: null,
        sottotipo: null,
        materiali: [],
        spezzatoDaId: idTrim,
      };

      const nextList = list.map((record, recordIndex) => {
        if (recordIndex !== index || !descrizioneOriginale) return record;
        return { ...record, descrizione: descrizioneOriginale };
      });
      nextList.push(resto);
      assertCloneWriteAllowed("storageSync.setItemSync", { key: MANUTENZIONI_KEY });
      await setItemSync(MANUTENZIONI_KEY, nextList);
    });
    return { ok: true, restoId };
  } catch (error: unknown) {
    if (error instanceof CloneWriteBlockedError) {
      return {
        ok: false,
        error:
          "Scrittura bloccata dal barrier clone (spezza lavoro). Verificare che la pagina sia nel perimetro autorizzato.",
      };
    }
    return {
      ok: false,
      error: error instanceof Error && error.message ? error.message : "Divisione del lavoro non riuscita.",
    };
  }
}
