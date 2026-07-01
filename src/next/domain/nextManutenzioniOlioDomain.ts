// Calcolo del consumo di olio motore a partire dai rabbocchi registrati come
// manutenzioni NEXT (record con `rabboccoOlio === true`). Logica pura e
// testabile, separata dalla UI.
//
// Modello: ogni rabbocco eseguito porta (km al rabbocco, litri rabboccati). Il
// consumo di un intervallo è `litri rabboccati / km percorsi dal rabbocco
// precedente`, espresso in litri ogni 1.000 km (scelta dell'owner). Coerente
// con la logica del consumo carburante già presente nel gestionale.
//
// Il km NON è garantito sui record (vedi audit contratti dati): i rabbocchi
// senza km vengono esclusi dal calcolo degli intervalli e contati a parte,
// senza inventare valori.

import type { NextManutenzioniLegacyDatasetRecord } from "./nextManutenzioniDomain";

export type NextRabboccoOlioEvento = {
  id: string;
  targa: string;
  data: string | null;
  km: number | null;
  litri: number | null;
  /** Km percorsi dal rabbocco precedente con km valido (null se non calcolabile). */
  kmPercorsi: number | null;
  /** Consumo dell'intervallo in litri ogni 1.000 km (null se non calcolabile). */
  consumoL1000: number | null;
  /** Officina che ha eseguito il rabbocco, dal campo `fornitore` (alimentato
   * dall'anagrafica @officine); null se non indicata. */
  eseguitoDa: string | null;
};

export type NextConsumoOlioMezzo = {
  targa: string;
  /** Eventi ordinati per km crescente (poi per data), con consumo per intervallo. */
  eventi: NextRabboccoOlioEvento[];
  /** Litri totali rabboccati (tutti gli eventi, anche senza km). */
  totaleLitri: number;
  /** Km totali coperti dagli intervalli calcolabili. */
  kmCoperti: number;
  /** Consumo medio sul totale coperto, litri ogni 1.000 km (null se nessun intervallo). */
  consumoMedioL1000: number | null;
  /** Numero di rabbocchi senza km (esclusi dal calcolo del consumo). */
  rabbocchiSenzaKm: number;
};

function normalizeTargaKey(value: unknown): string {
  return String(value ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Estrae i rabbocchi olio eseguiti dai record manutenzione e li raggruppa per
 * mezzo, calcolando il consumo (litri/1.000 km) per intervallo e la media.
 * Restituisce solo i mezzi che hanno almeno un rabbocco olio.
 */
export function buildConsumoOlioPerMezzo(
  records: NextManutenzioniLegacyDatasetRecord[],
): NextConsumoOlioMezzo[] {
  const perTarga = new Map<string, NextManutenzioniLegacyDatasetRecord[]>();

  for (const record of records) {
    if (record.rabboccoOlio !== true) continue;
    if (record.stato !== "eseguita") continue;
    const targaKey = normalizeTargaKey(record.targa);
    if (!targaKey) continue;
    const list = perTarga.get(targaKey);
    if (list) list.push(record);
    else perTarga.set(targaKey, [record]);
  }

  const result: NextConsumoOlioMezzo[] = [];

  for (const [, group] of perTarga) {
    // Ordine per km crescente; chi non ha km va in fondo, poi per data.
    const ordinati = [...group].sort((a, b) => {
      const kmA = typeof a.km === "number" ? a.km : Number.POSITIVE_INFINITY;
      const kmB = typeof b.km === "number" ? b.km : Number.POSITIVE_INFINITY;
      if (kmA !== kmB) return kmA - kmB;
      return String(a.data ?? "").localeCompare(String(b.data ?? ""));
    });

    const eventi: NextRabboccoOlioEvento[] = [];
    let totaleLitri = 0;
    let kmCoperti = 0;
    let litriCopertiPerMedia = 0;
    let rabbocchiSenzaKm = 0;
    let prevKm: number | null = null;

    for (const record of ordinati) {
      const km = typeof record.km === "number" && Number.isFinite(record.km) ? record.km : null;
      const litri =
        typeof record.olioLitri === "number" && Number.isFinite(record.olioLitri)
          ? record.olioLitri
          : null;
      if (litri !== null) totaleLitri += litri;
      if (km === null) rabbocchiSenzaKm += 1;

      let kmPercorsi: number | null = null;
      let consumoL1000: number | null = null;
      if (km !== null && prevKm !== null) {
        const delta = km - prevKm;
        if (delta > 0) {
          kmPercorsi = delta;
          if (litri !== null && litri > 0) {
            consumoL1000 = round1((litri / delta) * 1000);
            kmCoperti += delta;
            litriCopertiPerMedia += litri;
          }
        }
      }

      // "Eseguito da" = l'officina (campo `fornitore`, alimentato dall'autocomplete
      // dell'anagrafica @officine). NON usiamo `eseguitoDa`/`eseguito`: sono uno
      // snapshot congelato al completamento e restano indietro se l'officina viene
      // poi rinominata (es. refuso "Augustoni" corretto poi in "Agustoni").
      const eseguitoRaw = (record.fornitore ?? "").trim();

      eventi.push({
        id: record.id,
        targa: record.targa,
        data: record.data ?? null,
        km,
        litri,
        kmPercorsi,
        consumoL1000,
        eseguitoDa: eseguitoRaw ? eseguitoRaw : null,
      });

      if (km !== null) prevKm = km;
    }

    const consumoMedioL1000 =
      kmCoperti > 0 ? round1((litriCopertiPerMedia / kmCoperti) * 1000) : null;

    result.push({
      targa: ordinati[0]?.targa ?? "",
      eventi,
      totaleLitri: round1(totaleLitri),
      kmCoperti,
      consumoMedioL1000,
      rabbocchiSenzaKm,
    });
  }

  // Mezzi con più rabbocchi (dati più utili) in cima.
  result.sort((a, b) => b.eventi.length - a.eventi.length || a.targa.localeCompare(b.targa));
  return result;
}
