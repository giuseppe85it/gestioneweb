/**
 * Opzioni e mappatura del tipo documento scelto al salvataggio nell'Archivista.
 * I valori sono quelli che la vista Documenti riconosce (isPreventivo/isFattura/isDdt/isLibretto).
 * L'IA propone (testo libero), questa mappa lo riconduce a un'opzione; poi decide l'utente.
 */

export type TipoDocumentoValue = "fattura" | "preventivo" | "ddt" | "libretto" | "altro";

export const TIPO_DOCUMENTO_OPZIONI: Array<{ value: TipoDocumentoValue; label: string }> = [
  { value: "fattura", label: "Fattura" },
  { value: "preventivo", label: "Preventivo" },
  { value: "ddt", label: "DDT" },
  { value: "libretto", label: "Libretto" },
  { value: "altro", label: "Altro" },
];

export function mapTipoDocumentoToOption(raw: unknown): TipoDocumentoValue {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v.includes("preventiv") || v.includes("offerta")) return "preventivo";
  if (v.includes("ddt") || v.includes("trasporto") || v.includes("bolla")) return "ddt";
  if (v.includes("fattura") || v.includes("invoice")) return "fattura";
  if (v.includes("libretto")) return "libretto";
  return "altro";
}
