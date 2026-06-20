import { readNextFornitoriSnapshot } from "./nextFornitoriDomain";

// ---------------------------------------------------------------------------
// Eredita valuta dal fornitore (Fase B) — modulo condiviso
//
// I documenti/preventivi che NON hanno una valuta esplicita ereditano la
// valuta predefinita del fornitore presa dall'anagrafica (storage/@fornitori,
// campo valuta). E' un'operazione di SOLA LETTURA: non riscrive mai i dati
// salvati, normalizza solo cio' che viene mostrato e conteggiato.
//
// Usato sia dal dominio documenti+costi sia dal dominio procurement, cosi' la
// stessa logica vale ovunque (pagina Documenti e tab Documenti del Magazzino).
// ---------------------------------------------------------------------------

export type FornitoreCurrency = "CHF" | "EUR";
export type FornitoreCurrencyMap = Map<string, FornitoreCurrency>;

// Flag aggiunto alle voci la cui valuta e' stata dedotta dal fornitore.
export const VALUTA_EREDITATA_FORNITORE_FLAG = "valuta_ereditata_fornitore";

// Suffissi societari rimossi dalla coda del nome per rendere robusto il match
// (es. "TRUCK SERVICE SAGL" e "Truck Service" devono combaciare).
const FORNITORE_SUFFISSI_SOCIETARI = new Set<string>([
  "SRL",
  "SRLS",
  "SAGL",
  "SA",
  "SPA",
  "SNC",
  "SAS",
  "SS",
  "GMBH",
  "AG",
  "LTD",
  "LTDA",
  "SARL",
  "SL",
  "BV",
  "INC",
  "CO",
  "KG",
  "OHG",
  "EURL",
  "PLC",
  "CIE",
]);

function trimText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// Chiave di match fornitore: maiuscole, senza accenti, punteggiatura -> spazio,
// suffissi societari finali rimossi. Stringa vuota se non normalizzabile.
export function normalizeFornitoreMatchKey(value: unknown): string {
  const base = trimText(value)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
  if (!base) return "";

  const tokens = base.split(" ").filter(Boolean);
  // Rimuove dalla coda i suffissi societari ("SAGL", "SRL", ...) e i token di
  // una sola lettera, che sono quasi sempre residui di sigle puntate
  // ("S.r.l." -> "S R L", "& C." -> "C", "S.p.A." -> "S P A").
  while (
    tokens.length > 1 &&
    (FORNITORE_SUFFISSI_SOCIETARI.has(tokens[tokens.length - 1]) ||
      tokens[tokens.length - 1].length === 1)
  ) {
    tokens.pop();
  }
  return tokens.join(" ");
}

export function buildFornitoreCurrencyMap(
  items: { nome: string; valuta: FornitoreCurrency | null }[],
): FornitoreCurrencyMap {
  const map: FornitoreCurrencyMap = new Map();
  const conflitti = new Set<string>();

  for (const fornitore of items) {
    if (fornitore.valuta !== "CHF" && fornitore.valuta !== "EUR") continue;
    const key = normalizeFornitoreMatchKey(fornitore.nome);
    if (!key) continue;

    const esistente = map.get(key);
    if (esistente && esistente !== fornitore.valuta) {
      // Due fornitori col nome normalizzato uguale ma valute diverse:
      // ambiguo, non ereditare per nessuno dei due.
      conflitti.add(key);
      continue;
    }
    if (!esistente) map.set(key, fornitore.valuta);
  }

  for (const key of conflitti) map.delete(key);
  return map;
}

export async function loadFornitoreCurrencyMap(): Promise<FornitoreCurrencyMap> {
  try {
    const snapshot = await readNextFornitoriSnapshot();
    return buildFornitoreCurrencyMap(snapshot.items);
  } catch {
    // Anagrafica fornitori non leggibile: nessuna eredita, le voci restano
    // con la valuta rilevata (anche assente/UNKNOWN).
    return new Map();
  }
}

// Ritorna la valuta da ereditare oppure null se non applicabile.
// `current` viene considerato gia' esplicito solo se vale "CHF" o "EUR";
// qualunque altro valore (null, "", "UNKNOWN") rende la voce eleggibile.
export function inheritCurrencyFromFornitore(
  current: string | null | undefined,
  supplier: string | null | undefined,
  map: FornitoreCurrencyMap,
): FornitoreCurrency | null {
  const normalized = trimText(current).toUpperCase();
  if (normalized === "CHF" || normalized === "EUR") return null;
  if (map.size === 0) return null;
  const key = normalizeFornitoreMatchKey(supplier);
  if (!key) return null;
  return map.get(key) ?? null;
}
