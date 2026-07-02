// Satellite del modulo Manutenzioni: rilevatore DETERMINISTICO dei possibili
// doppioni tra segnalazioni aperte dello stesso mezzo (due autisti che segnalano
// lo stesso problema). SOLA LETTURA: nessun dato viene toccato, serve solo a
// mostrare il badge "Possibile doppione" nel tab Da fare.
//
// Regola (spiegabile all'owner):
//  - si confrontano solo segnalazioni della STESSA targa (il chiamante passa
//    già la lista di una targa) e ancora aperte;
//  - stesso tipo di problema SPECIFICO (non vuoto, non "-", non "altro") =
//    possibile doppione;
//  - altrimenti: descrizioni che condividono almeno la metà delle parole
//    significative (e almeno 2 parole in comune) = possibile doppione.
import type { NextAutistiSegnalazioneSectionItem } from "../domain/nextAutistiDomain";

const TIPI_GENERICI = new Set(["", "-", "altro", "altro problema", "generico"]);

// Parole troppo comuni nelle segnalazioni per essere indizio di doppione.
const PAROLE_COMUNI = new Set([
  "sono",
  "come",
  "anche",
  "della",
  "delle",
  "dello",
  "degli",
  "quando",
  "quindi",
  "perche",
  "perché",
  "problema",
  "segnalazione",
  "camion",
  "mezzo",
  "veicolo",
  "fare",
  "stato",
  "stata",
  "verificare",
  "controllare",
]);

function normalizzaTipo(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function paroleSignificative(testo: string | null | undefined): Set<string> {
  const out = new Set<string>();
  const normalizzato = String(testo ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  for (const parola of normalizzato.split(/[^a-z0-9]+/)) {
    if (parola.length < 4) continue;
    if (PAROLE_COMUNI.has(parola)) continue;
    out.add(parola);
  }
  return out;
}

function descrizioniSimili(a: Set<string>, b: Set<string>): boolean {
  if (a.size === 0 || b.size === 0) return false;
  let comuni = 0;
  for (const parola of a) {
    if (b.has(parola)) comuni += 1;
  }
  if (comuni < 2) return false;
  const minore = Math.min(a.size, b.size);
  return comuni / minore >= 0.5;
}

/**
 * Restituisce gli id delle segnalazioni che sembrano doppioni di un'altra
 * segnalazione della stessa lista (stessa targa, tutte aperte).
 */
export function trovaPossibiliDoppioniSegnalazioni(
  items: NextAutistiSegnalazioneSectionItem[],
): Set<string> {
  const doppioni = new Set<string>();
  if (items.length < 2) return doppioni;
  const prepared = items.map((item) => ({
    id: item.id,
    tipo: normalizzaTipo(item.tipo),
    parole: paroleSignificative(item.descrizione),
  }));
  for (let i = 0; i < prepared.length; i += 1) {
    for (let j = i + 1; j < prepared.length; j += 1) {
      const a = prepared[i];
      const b = prepared[j];
      const tipoSpecificoUguale =
        a.tipo === b.tipo && !TIPI_GENERICI.has(a.tipo);
      if (tipoSpecificoUguale || descrizioniSimili(a.parole, b.parole)) {
        doppioni.add(a.id);
        doppioni.add(b.id);
      }
    }
  }
  return doppioni;
}
