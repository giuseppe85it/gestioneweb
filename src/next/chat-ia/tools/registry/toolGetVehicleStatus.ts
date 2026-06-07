import { readNextStatoOperativoSnapshot } from "../../../domain/nextCentroControlloDomain";
import { readNextMezzoByTarga } from "../../../nextAnagraficheFlottaDomain";
import { formatItalianDate, formatItalianDateFromItalianSource } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";
import { readVehicleEnrichmentFields } from "./toolVehicleEnrichment";

type GetVehicleStatusInput = { targa?: unknown };

function normalizeTarga(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : "";
}

function matchesTarga(value: unknown, targa: string): boolean {
  return JSON.stringify(value).toUpperCase().includes(targa);
}

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function withItalianStatusDates(value: unknown): Record<string, unknown> {
  const item = rec(value);
  return {
    ...item,
    data_italiana: formatItalianDate(item.data ?? item.dateLabel ?? item.timestamp ?? item.eventTs ?? item.ts),
    dataScadenzaRevisione_italiana: formatItalianDateFromItalianSource(item.dataScadenzaRevisione ?? item.dataScadenzaRevisioneTs),
    manutenzioneDataFine_italiana: formatItalianDateFromItalianSource(item.manutenzioneDataFine ?? item.manutenzioneDataFineTs),
  };
}

export const toolGetVehicleStatus: ChatIaToolHandler<GetVehicleStatusInput> = {
  name: "get_vehicle_status",
  descriptionForOpenAi:
    "Recupera stato operativo, alert, focus e appuntamenti di un mezzo. Include prenotazione collaudo, pre-collaudo, foto, hotspot e libretto raw. Usa quando l'utente chiede se un mezzo ha anomalie operative, scadenze o stato nel centro controllo.",
  parameters: {
    type: "object",
    properties: { targa: { type: "string" } },
    required: ["targa"],
    additionalProperties: false,
  },
  outputKindHint: "card",
  async run(input) {
    const targa = normalizeTarga(input.targa);
    if (!targa) throw new Error("Targa mezzo mancante o non valida.");
    const [mezzo, stato] = await Promise.all([readNextMezzoByTarga(targa), readNextStatoOperativoSnapshot()]);
    const enrichment = await readVehicleEnrichmentFields(mezzo ?? { targa });
    const alerts = stato.alerts.filter((item) => matchesTarga(item, targa));
    const focus = stato.focusItems.filter((item) => matchesTarga(item, targa));
    const revisioni = stato.revisioni.filter((item) => matchesTarga(item, targa));
    return {
      targa,
      mezzo: mezzo ? { ...mezzo, ...enrichment } : null,
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
        dataScadenzaRevisione: formatItalianDateFromItalianSource(mezzo?.dataScadenzaRevisione || mezzo?.dataScadenzaRevisioneTimestamp),
        manutenzioneDataFine: formatItalianDateFromItalianSource(mezzo?.manutenzioneDataFine || mezzo?.manutenzioneDataFineTimestamp),
      },
      stato,
      alerts: alerts.map(withItalianStatusDates),
      focus: focus.map(withItalianStatusDates),
      revisioni: revisioni.map(withItalianStatusDates),
      counters: stato.counters,
    };
  },
};
