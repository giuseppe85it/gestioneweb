import { readNextAnagraficheFlottaSnapshot } from "../../../nextAnagraficheFlottaDomain";
import { readNextMezzoManutenzioniSnapshot } from "../../../domain/nextManutenzioniDomain";
import { daysBetween, formatItalianDateFromItalianSource } from "../chatIaToolDates";
import { buildTruncationMeta, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";
import { buildVehicleEnrichmentFields, readVehicleEnrichmentIndex } from "./toolVehicleEnrichment";

type Input = { entroGiorni?: unknown; status?: unknown; categoria?: unknown; includeHistory?: unknown };

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function norm(value: unknown): string { return text(value).toLowerCase(); }
function days(value: unknown): number { return typeof value === "number" && value >= 0 ? Math.floor(value) : 30; }
function statusOf(delta: number | null, entro: number): string {
  if (delta === null) return "senza_data";
  if (delta < 0) return "scaduta";
  if (delta <= entro) return "in_scadenza";
  return "valida";
}

export const toolListScheduledMaintenanceDue: ChatIaToolHandler<Input> = {
  name: "list_scheduled_maintenance_due",
  descriptionForOpenAi:
    "Elenca i mezzi con manutenzione programmata scaduta, in scadenza o valida, calcolando i giorni residui. Include anche prenotazione collaudo, pre-collaudo, foto, hotspot e libretto raw del mezzo quando presenti. Usa quando l'utente chiede manutenzioni programmate, scadenze manutenzione, manutenzioni in scadenza o pianificazione manutentiva della flotta.",
  parameters: {
    type: "object",
    properties: {
      entroGiorni: { type: "number" },
      status: { type: "string", enum: ["scaduta", "in_scadenza", "valida", "senza_data", "tutti"] },
      categoria: { type: "string" },
      includeHistory: { type: "boolean" },
    },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const entro = days(input.entroGiorni), wantedStatus = norm(input.status) || "in_scadenza", categoria = norm(input.categoria);
    const [snapshot, enrichmentIndex] = await Promise.all([
      readNextAnagraficheFlottaSnapshot(),
      readVehicleEnrichmentIndex(),
    ]);
    const baseItems = snapshot.items.map((mezzo) => {
      const targetDate = mezzo.manutenzioneDataFine || mezzo.manutenzioneDataFineTimestamp;
      const delta = daysBetween(targetDate);
      const enrichment = buildVehicleEnrichmentFields(mezzo, enrichmentIndex);
      return {
        _id: mezzo.id || mezzo.targa,
        id: mezzo.id || null,
        targa: mezzo.targa,
        categoria: mezzo.categoria,
        manutenzioneDataFine: formatItalianDateFromItalianSource(targetDate),
        manutenzioneDataFineRaw: mezzo.manutenzioneDataFine || null,
        daysToDeadline: delta,
        status: statusOf(delta, entro),
        mezzo: { ...mezzo, ...enrichment },
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
    }).filter((item) => item.mezzo.manutenzioneProgrammata && (!categoria || norm(item.categoria).includes(categoria)) && (wantedStatus === "tutti" || item.status === wantedStatus));
    const history = input.includeHistory ? await Promise.all(baseItems.slice(0, 20).map((item) => readNextMezzoManutenzioniSnapshot(item.targa))) : [];
    const historyMeta = input.includeHistory ? buildTruncationMeta(baseItems.length, history.length, "storici manutenzione") : null;
    return {
      items: baseItems,
      total: baseItems.length,
      total_count: baseItems.length,
      shown: baseItems.length,
      is_truncated: false,
      truncation_reason: null,
      history: history.map((item) => ({ targa: item.mezzoTarga, counts: item.counts })),
      historyMeta,
      notices: historyMeta ? truncationNotice(historyMeta) : [],
    };
  },
};

export default toolListScheduledMaintenanceDue;
