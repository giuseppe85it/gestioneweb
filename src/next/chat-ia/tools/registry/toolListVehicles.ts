import { readNextAnagraficheFlottaSnapshot } from "../../../nextAnagraficheFlottaDomain";
import { formatItalianDateFromItalianSource, isExpired, isExpiringWithin } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";
import { buildVehicleEnrichmentFields, readVehicleEnrichmentIndex } from "./toolVehicleEnrichment";

type ListVehiclesInput = {
  categoria?: unknown;
  testo?: unknown;
  scadenzaRevisione?: unknown;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalize(value: unknown): string {
  return text(value).toLowerCase();
}

function revisionStatus(value: unknown): "scaduta" | "in_scadenza" | "valida" {
  if (!value) return "valida";
  if (isExpired(value)) return "scaduta";
  return isExpiringWithin(value, 60) ? "in_scadenza" : "valida";
}

export const toolListVehicles: ChatIaToolHandler<ListVehiclesInput> = {
  name: "list_vehicles",
  descriptionForOpenAi:
    "Elenca i mezzi della flotta e applica filtri semplici su categoria, testo o scadenza revisione. Include prenotazione collaudo, pre-collaudo, foto, hotspot e dati libretto raw quando presenti. Usa quando l'utente chiede lista mezzi, tutti i mezzi, prossimi collaudi, mezzi cisterna o mezzi con revisione scaduta.",
  parameters: {
    type: "object",
    properties: {
      categoria: { type: "string" },
      testo: { type: "string" },
      scadenzaRevisione: { type: "string", enum: ["scaduta", "in_scadenza", "valida"] },
    },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const [snapshot, enrichmentIndex] = await Promise.all([
      readNextAnagraficheFlottaSnapshot(),
      readVehicleEnrichmentIndex(),
    ]);
    const categoria = normalize(input.categoria);
    const filtroTesto = normalize(input.testo);
    const scadenza = text(input.scadenzaRevisione);
    const items = snapshot.items.filter((mezzo) => {
      const haystack = `${mezzo.targa} ${mezzo.categoria} ${mezzo.marcaModello} ${mezzo.autistaNome ?? ""}`.toLowerCase();
      return (
        (!categoria || mezzo.categoria.toLowerCase().includes(categoria) || mezzo.tipo === categoria) &&
        (!filtroTesto || haystack.includes(filtroTesto)) &&
        (!scadenza || revisionStatus(mezzo.dataScadenzaRevisione || mezzo.dataScadenzaRevisioneTimestamp) === scadenza)
      );
    });
    return {
      items: items.map((mezzo) => {
        const enrichment = buildVehicleEnrichmentFields(mezzo, enrichmentIndex);
        return {
          _id: mezzo.id || mezzo.targa,
          id: mezzo.id || null,
          targa: mezzo.targa,
          categoria: mezzo.categoria,
          marca_modello: mezzo.marcaModello,
          autista_assegnato_nome: mezzo.autistaNome ?? null,
          scadenza_revisione: formatItalianDateFromItalianSource(mezzo.dataScadenzaRevisione || mezzo.dataScadenzaRevisioneTimestamp),
          scadenza_revisione_raw: mezzo.dataScadenzaRevisione ?? null,
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
        };
      }),
      total: items.length,
      appliedFilters: { categoria, testo: filtroTesto, scadenzaRevisione: scadenza },
    };
  },
};
