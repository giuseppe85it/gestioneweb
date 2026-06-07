import { readNextAnagraficheFlottaSnapshot } from "../../../nextAnagraficheFlottaDomain";
import { formatItalianDateFromItalianSource } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";
import {
  buildVehicleEnrichmentFields,
  readVehicleEnrichmentIndex,
  type VehicleEnrichmentFields,
} from "./toolVehicleEnrichment";

type Input = { query?: unknown; field?: unknown; includeRawLibretto?: unknown };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function searchKey(value: unknown): string {
  return normalize(text(value)).replace(/[^a-z0-9]/g, "");
}

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function includes(value: unknown, query: string): boolean {
  const normalizedValue = searchKey(value);
  if (!normalizedValue || !query) return false;

  // I telai reali possono essere salvati con spazi o senza la "n" descrittiva
  // scritta dall'utente: il match monodirezionale perdeva casi esistenti.
  return normalizedValue.includes(query) || query.includes(normalizedValue);
}

function flatVehicleMatch(
  mezzo: unknown,
  matchedFields: readonly string[],
  score: number,
  enrichment: VehicleEnrichmentFields,
): Record<string, unknown> {
  const record = rec(mezzo);
  return {
    _id: text(record.id) || text(record.targa),
    id: text(record.id) || null,
    targa: text(record.targa),
    telaio: text(record.telaio),
    anno: typeof record.anno === "number" || typeof record.anno === "string" ? record.anno : null,
    categoria: text(record.categoria),
    marca: text(record.marca),
    modello: text(record.modello),
    marca_modello: text(record.marcaModello),
    autista_assegnato_nome: text(record.autistaNome) || null,
    scadenza_revisione: formatItalianDateFromItalianSource(record.dataScadenzaRevisione || record.dataScadenzaRevisioneTimestamp),
    scadenza_revisione_raw: text(record.dataScadenzaRevisione) || null,
    prenotazioneCollaudo: enrichment.prenotazioneCollaudo,
    preCollaudo: enrichment.preCollaudo,
    prossimiAppuntamenti: enrichment.prossimiAppuntamenti,
    fotoUrl: enrichment.fotoUrl,
    fotoPath: enrichment.fotoPath,
    librettoUrl: enrichment.librettoUrl,
    librettoStoragePath: enrichment.librettoStoragePath,
    libretto_raw: enrichment.libretto_raw,
    media: enrichment.media,
    fotoViste: enrichment.fotoViste,
    hotspots: enrichment.hotspots,
    matchedFields,
    score,
  };
}

export const toolSearchVehiclesByAttribute: ChatIaToolHandler<Input> = {
  name: "search_vehicles_by_attribute",
  descriptionForOpenAi:
    "Cerca mezzi per attributi diversi dalla targa, inclusi telaio, marca, modello, autista e campi libretto raw quando disponibili. Propaga anche prenotazione collaudo, pre-collaudo, foto, hotspot e dati libretto del mezzo trovato. Usa quando l'utente scrive un numero di telaio o chiede di trovare il mezzo da un dato anagrafico.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string" },
      field: { type: "string", enum: ["auto", "targa", "telaio", "marca", "modello", "autista", "libretto_raw"] },
      includeRawLibretto: { type: "boolean" },
    },
    required: ["query"],
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const query = searchKey(input.query);
    if (!query) throw new Error("Query mezzo mancante o non valida.");
    const field = text(input.field) || "auto";
    const [snapshot, enrichmentIndex] = await Promise.all([
      readNextAnagraficheFlottaSnapshot(),
      readVehicleEnrichmentIndex(),
    ]);
    const matches = snapshot.items
      .map((mezzo) => {
        const fields = [
          ["targa", mezzo.targa],
          ["telaio", mezzo.telaio],
          ["marca", mezzo.marca],
          ["modello", mezzo.modello],
          ["autista", mezzo.autistaNome],
          ["libretto_raw", input.includeRawLibretto || field === "libretto_raw" ? JSON.stringify(mezzo.libretto_raw ?? {}) : ""],
        ] as const;
        const matchedFields = fields
          .filter(([name, value]) => (field === "auto" || field === name) && includes(value, query))
          .map(([name]) => name);
        return matchedFields.length ? { mezzo, matchedFields, score: matchedFields.some((name) => name === field) ? 2 : 1 } : null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .sort((a, b) => b.score - a.score || a.mezzo.targa.localeCompare(b.mezzo.targa));
    return {
      query: text(input.query),
      field,
      matches: matches.map((entry) =>
        flatVehicleMatch(
          entry.mezzo,
          entry.matchedFields,
          entry.score,
          buildVehicleEnrichmentFields(entry.mezzo, enrichmentIndex),
        ),
      ),
      total: matches.length,
    };
  },
};

export default toolSearchVehiclesByAttribute;
