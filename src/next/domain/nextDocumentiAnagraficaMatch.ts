/**
 * Abbinamento READ-ONLY del testo "fornitore" di un documento alle anagrafiche
 * @officine / @fornitori. Nessuna scrittura, nessuna persistenza: il match è
 * calcolato al volo in pagina per nome normalizzato.
 *
 * Due livelli, in ordine:
 *  1) match esatto sul nome normalizzato (UPPERCASE, accenti/punteggiatura/sigle ignorate);
 *  2) match "morbido" per sottoinsieme di parole: se tutte le parole di un nome sono
 *     contenute nell'altro (es. anagrafica "SCIURBA" ⊆ documento "SCIURBA AUTOTRUCK"),
 *     è la stessa entità. Precedenza alle officine.
 *
 * Errori di battitura ("Agustoni" vs "Augustoni") vengono abbinati dal match fuzzy
 * (Levenshtein, step 3 di `matchFornitoreText`). Il collegamento salvato per id
 * (officinaId/fornitoreId) resta una fase futura: qui il match è calcolato al volo.
 */
import type { NextOfficinaReadOnlyItem } from "./nextOfficineDomain";
import type { NextFornitoreReadOnlyItem } from "./nextFornitoriDomain";

export type AnagraficaMatchKind = "officina" | "fornitore" | "nessuno";

export type AnagraficaMatch =
  | { kind: "officina"; id: string; nome: string }
  | { kind: "fornitore"; id: string; nome: string }
  | { kind: "nessuno"; nome: string | null };

type IndexedEntry<T> = { tokens: string[]; item: T };

export type AnagraficaMatchIndex = {
  officineByName: Map<string, NextOfficinaReadOnlyItem>;
  fornitoriByName: Map<string, NextFornitoreReadOnlyItem>;
  officineList: Array<IndexedEntry<NextOfficinaReadOnlyItem>>;
  fornitoriList: Array<IndexedEntry<NextFornitoreReadOnlyItem>>;
};

// Sigle societarie (IT/CH/DE/FR) ignorate nel confronto.
const FORME_SOCIETARIE = new Set([
  "SRL", "SRLS", "SPA", "SNC", "SAS", "SA", "SAGL", "AG", "GMBH",
  "SARL", "SL", "KG", "OHG", "SC", "SCRL", "SAPA", "LTD", "INC",
]);

/** Normalizza un nome: UPPERCASE + accenti rimossi + sigle societarie ignorate. */
export function normalizeAnagraficaName(value: string | null | undefined): string {
  return tokenizeAnagraficaName(value).join(" ");
}

/** Tokenizza un nome normalizzato in parole significative (senza sigle societarie). */
export function tokenizeAnagraficaName(value: string | null | undefined): string[] {
  const base = String(value ?? "")
    .toUpperCase()
    .replace(/[ÀÁÂÃÄÅ]/g, "A")
    .replace(/[ÈÉÊË]/g, "E")
    .replace(/[ÌÍÎÏ]/g, "I")
    .replace(/[ÒÓÔÕÖ]/g, "O")
    .replace(/[ÙÚÛÜ]/g, "U")
    .replace(/Ç/g, "C")
    // Collassa punti/apostrofi PRIMA, così "S.R.L." → "SRL" (sigla riconoscibile)
    // invece di "S R L" (tre token che sfuggirebbero al filtro).
    .replace(/[.'`´’]/g, "")
    .replace(/[^A-Z0-9]+/g, " ");

  return base
    .split(" ")
    .filter((token) => token && !FORME_SOCIETARIE.has(token));
}

/** Costruisce indici per match esatto (Map) e morbido (liste di token). */
export function buildAnagraficaMatchIndex(
  officine: readonly NextOfficinaReadOnlyItem[],
  fornitori: readonly NextFornitoreReadOnlyItem[],
): AnagraficaMatchIndex {
  const officineByName = new Map<string, NextOfficinaReadOnlyItem>();
  const officineList: Array<IndexedEntry<NextOfficinaReadOnlyItem>> = [];
  for (const off of officine) {
    const tokens = tokenizeAnagraficaName(off.nome);
    const key = tokens.join(" ");
    if (!key) continue;
    if (!officineByName.has(key)) officineByName.set(key, off);
    officineList.push({ tokens, item: off });
  }

  const fornitoriByName = new Map<string, NextFornitoreReadOnlyItem>();
  const fornitoriList: Array<IndexedEntry<NextFornitoreReadOnlyItem>> = [];
  for (const frn of fornitori) {
    const tokens = tokenizeAnagraficaName(frn.nome);
    const key = tokens.join(" ");
    if (!key) continue;
    if (!fornitoriByName.has(key)) fornitoriByName.set(key, frn);
    fornitoriList.push({ tokens, item: frn });
  }

  return { officineByName, fornitoriByName, officineList, fornitoriList };
}

function hasSignificantToken(tokens: string[]): boolean {
  return tokens.some((token) => token.length >= 3);
}

/** Vero se tutte le parole di un nome sono contenute nelle parole dell'altro (in un verso o nell'altro). */
function softTokenMatch(anagTokens: string[], docTokens: string[], docSet: Set<string>): boolean {
  if (!anagTokens.length || !docTokens.length) return false;
  // Almeno una parola "vera" su entrambi i lati, per evitare match su residui di sigle.
  if (!hasSignificantToken(anagTokens) || !hasSignificantToken(docTokens)) return false;

  const anagInDoc = anagTokens.every((token) => docSet.has(token));
  if (anagInDoc) return true;

  const anagSet = new Set(anagTokens);
  return docTokens.every((token) => anagSet.has(token));
}

/** Distanza di edit (Levenshtein) tra due stringhe. */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i += 1) {
    const cur = [i];
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}

/** Due parole "quasi uguali": tolleranza 1 carattere (≥4) o 2 caratteri (≥8). Token corti solo esatti. */
function fuzzyTokenMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen < 4) return false;
  const allowed = maxLen >= 8 ? 2 : 1;
  return levenshtein(a, b) <= allowed;
}

/**
 * Match fuzzy fra due nomi: confronta le parole "significative" (≥4 lettere) tollerando
 * piccoli errori di battitura. Con più parole servono ≥2 corrispondenze; con una sola
 * parola (≥5 lettere) basta quella. Evita match casuali su sigle/parole corte.
 */
function fuzzyEntityMatch(anagTokens: string[], docTokens: string[]): boolean {
  const anagSig = anagTokens.filter((token) => token.length >= 4);
  const docSig = docTokens.filter((token) => token.length >= 4);
  if (!anagSig.length || !docSig.length) return false;

  const matched = anagSig.filter((at) => docSig.some((dt) => fuzzyTokenMatch(at, dt)));
  if (anagSig.length === 1) {
    return matched.length === 1 && anagSig[0].length >= 5;
  }
  return matched.length >= 2;
}

/** Abbina il testo "fornitore" del documento all'anagrafica. Esatto → morbido; officine prima. */
export function matchFornitoreText(
  text: string | null | undefined,
  index: AnagraficaMatchIndex,
): AnagraficaMatch {
  const raw = String(text ?? "").trim();
  const docTokens = tokenizeAnagraficaName(text);
  const key = docTokens.join(" ");
  if (!key) {
    return { kind: "nessuno", nome: raw || null };
  }

  // 1) Match esatto
  const offExact = index.officineByName.get(key);
  if (offExact) return { kind: "officina", id: offExact.id, nome: offExact.nome };
  const frnExact = index.fornitoriByName.get(key);
  if (frnExact) return { kind: "fornitore", id: frnExact.id, nome: frnExact.nome };

  // 2) Match morbido per sottoinsieme di parole (officine prima)
  const docSet = new Set(docTokens);
  const offSoft = index.officineList.find((entry) => softTokenMatch(entry.tokens, docTokens, docSet));
  if (offSoft) return { kind: "officina", id: offSoft.item.id, nome: offSoft.item.nome };
  const frnSoft = index.fornitoriList.find((entry) => softTokenMatch(entry.tokens, docTokens, docSet));
  if (frnSoft) return { kind: "fornitore", id: frnSoft.item.id, nome: frnSoft.item.nome };

  // 3) Match fuzzy: tollera piccoli errori di battitura (officine prima)
  const offFuzzy = index.officineList.find((entry) => fuzzyEntityMatch(entry.tokens, docTokens));
  if (offFuzzy) return { kind: "officina", id: offFuzzy.item.id, nome: offFuzzy.item.nome };
  const frnFuzzy = index.fornitoriList.find((entry) => fuzzyEntityMatch(entry.tokens, docTokens));
  if (frnFuzzy) return { kind: "fornitore", id: frnFuzzy.item.id, nome: frnFuzzy.item.nome };

  return { kind: "nessuno", nome: raw || null };
}

/**
 * Nome "vivo" dell'officina per la sola VISUALIZZAZIONE/stampa. Dato il testo
 * officina salvato in un record (denormalizzato, a volte con refuso), restituisce
 * il nome CANONICO dell'anagrafica `@officine` se il testo vi corrisponde (match
 * esatto/morbido/fuzzy, così "Augustoni" → "Agustoni"). Se il testo NON corrisponde
 * a un'officina — incluso il caso in cui corrisponda solo a un FORNITORE-merce —
 * mantiene il testo salvato: non forza abbinamenti verso l'anagrafica sbagliata né
 * inventa nomi. Sola lettura, nessuna scrittura: il record resta invariato.
 */
export function resolveNomeOfficinaVivo(
  testo: string | null | undefined,
  index: AnagraficaMatchIndex,
): string | null {
  const raw = String(testo ?? "").trim();
  if (!raw) return null;
  const match = matchFornitoreText(raw, index);
  return match.kind === "officina" ? match.nome : raw;
}

/**
 * Variante "alla fonte": applica `resolveNomeOfficinaVivo` a un'etichetta officina
 * già composta SOLO se è disponibile l'indice anagrafica; se `index` è null ritorna
 * l'etichetta invariata (retrocompatibilità per i chiamanti senza anagrafica). Sola lettura.
 */
export function resolveOfficinaLabelVivo(
  label: string | null,
  index: AnagraficaMatchIndex | null,
): string | null {
  return index ? resolveNomeOfficinaVivo(label, index) : label;
}
