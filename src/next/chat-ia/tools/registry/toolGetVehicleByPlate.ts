import { readNextMezzoByTarga } from "../../../nextAnagraficheFlottaDomain";
import { formatItalianDateFromItalianSource } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";
import { readVehicleEnrichmentFields, type VehicleAppointmentFields } from "./toolVehicleEnrichment";

type GetVehicleByPlateInput = {
  targa?: unknown;
};

function normalizeTarga(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : "";
}

function appointmentLabel(value: VehicleAppointmentFields): string {
  if (!value.presente) return "-";
  const parts = [
    value.data,
    "ora" in value ? value.ora : null,
    "luogo" in value ? value.luogo : null,
    "officina" in value ? value.officina : null,
  ].filter((item): item is string => Boolean(item) && item !== "-");
  return parts.length > 0 ? parts.join(" - ") : "-";
}

export const toolGetVehicleByPlate: ChatIaToolHandler<GetVehicleByPlateInput> = {
  name: "get_vehicle_by_plate",
  descriptionForOpenAi:
    "Restituisce i dati di un mezzo dalla sua targa: anagrafica, autista assegnato, scadenze, prenotazione collaudo, pre-collaudo, foto, hotspot e libretto raw. Usa quando l'utente chiede info su un mezzo specifico per targa.",
  parameters: {
    type: "object",
    properties: {
      targa: {
        type: "string",
        description: "Targa del mezzo da cercare, per esempio TI282780.",
      },
    },
    required: ["targa"],
    additionalProperties: false,
  },
  outputKindHint: "card",
  async run(input) {
    const targa = normalizeTarga(input.targa);
    if (!targa) {
      throw new Error("Targa mezzo mancante o non valida.");
    }

    const mezzo = await readNextMezzoByTarga(targa);
    if (!mezzo) {
      return {
        found: false,
        targa,
        message: `Nessun mezzo trovato per la targa ${targa}.`,
      };
    }

    const enrichment = await readVehicleEnrichmentFields(mezzo);

    return {
      found: true,
      _id: mezzo.id || mezzo.targa,
      targa,
      vehicle: { _id: mezzo.id || mezzo.targa, ...mezzo, ...enrichment },
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
      formattedDates: {
        dataScadenzaRevisione: formatItalianDateFromItalianSource(mezzo.dataScadenzaRevisione || mezzo.dataScadenzaRevisioneTimestamp),
        manutenzioneDataFine: formatItalianDateFromItalianSource(mezzo.manutenzioneDataFine || mezzo.manutenzioneDataFineTimestamp),
      },
      card: {
        kind: "summary_card",
        title: `Mezzo ${mezzo.targa}`,
        rows: [
          { label: "Categoria", value: mezzo.categoria || "n.d." },
          { label: "Marca / modello", value: mezzo.marcaModello || "n.d." },
          { label: "Autista", value: mezzo.autistaNome || "n.d." },
          { label: "Revisione", value: formatItalianDateFromItalianSource(mezzo.dataScadenzaRevisione || mezzo.dataScadenzaRevisioneTimestamp) },
          { label: "Prenotazione collaudo", value: appointmentLabel(enrichment.prenotazioneCollaudo) },
          { label: "Pre-collaudo", value: appointmentLabel(enrichment.preCollaudo) },
          { label: "Foto viste", value: enrichment.media.foto_viste.length > 0 ? String(enrichment.media.foto_viste.length) : "-" },
          { label: "Hotspot", value: enrichment.media.hotspots.length > 0 ? String(enrichment.media.hotspots.length) : "-" },
          { label: "Libretto raw", value: enrichment.libretto_raw ? "presente" : "-" },
          { label: "Qualita dato", value: mezzo.quality },
        ],
      },
      source: {
        reader: "readNextMezzoByTarga",
        path: "src/next/nextAnagraficheFlottaDomain.ts",
      },
    };
  },
};
