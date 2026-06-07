import { readChatIaMezzoSnapshot } from "../../sectors/mezzi/chatIaMezziData";
import { formatItalianDate, formatItalianDateFromItalianSource } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";
import { readVehicleEnrichmentFields } from "./toolVehicleEnrichment";

type GetVehicleDossierSnapshotInput = { targa?: unknown };

function normalizeTarga(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : "";
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function countItems(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function compactRecord(value: unknown) {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    id: text(record.id),
    titolo: text(record.titolo ?? record.title ?? record.descrizione ?? record.nome),
    data: formatItalianDate(record.data ?? record.dataDocumento ?? record.createdAt ?? record.updatedAt ?? record.timestamp),
    dataRaw: text(record.data ?? record.dataDocumento ?? record.createdAt ?? record.updatedAt),
    stato: text(record.stato ?? record.status ?? record.esito),
  };
}

function takeCompactRows(value: unknown, limit: number) {
  return Array.isArray(value) ? value.slice(0, limit).map(compactRecord) : [];
}

export const toolGetVehicleDossierSnapshot: ChatIaToolHandler<GetVehicleDossierSnapshotInput> = {
  name: "get_vehicle_dossier_snapshot",
  descriptionForOpenAi:
    "Recupera lo snapshot composito gia usato dal settore Mezzi v1. Include prossimi appuntamenti, prenotazione collaudo, pre-collaudo, foto, hotspot e libretto raw. Usa quando serve una vista completa del mezzo con anagrafica, timeline, materiali e documenti.",
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
    const result = await readChatIaMezzoSnapshot(targa);
    if (!result.ok || !result.snapshot) {
      return result;
    }

    const { snapshot } = result;
    const enrichment = await readVehicleEnrichmentFields(snapshot.mezzo);
    const lavori = [
      ...takeCompactRows(snapshot.operativita.lavoriAperti, 3),
      ...takeCompactRows(snapshot.operativita.lavoriChiusi, 2),
    ].slice(0, 5);

    return {
      ok: true,
      match: result.match,
      snapshot: {
        requestedTarga: snapshot.requestedTarga,
        targa: snapshot.targa,
        matchKind: snapshot.matchKind,
        mezzo: {
          targa: snapshot.mezzo.targa,
          categoria: snapshot.mezzo.categoria,
          marcaModello: snapshot.mezzo.marcaModello,
          anno: snapshot.mezzo.anno,
          tipo: snapshot.mezzo.tipo,
          autistaNome: snapshot.mezzo.autistaNome,
          dataScadenzaRevisione: formatItalianDateFromItalianSource(snapshot.mezzo.dataScadenzaRevisione || snapshot.mezzo.dataScadenzaRevisioneTimestamp),
          dataScadenzaRevisioneRaw: snapshot.mezzo.dataScadenzaRevisione,
          manutenzioneProgrammata: snapshot.mezzo.manutenzioneProgrammata,
          manutenzioneDataFine: formatItalianDateFromItalianSource(snapshot.mezzo.manutenzioneDataFine || snapshot.mezzo.manutenzioneDataFineTimestamp),
          manutenzioneDataFineRaw: snapshot.mezzo.manutenzioneDataFine,
          manutenzioneKmMax: snapshot.mezzo.manutenzioneKmMax,
          prenotazioneCollaudo: enrichment.prenotazioneCollaudo,
          preCollaudo: enrichment.preCollaudo,
          fotoUrl: enrichment.fotoUrl,
          fotoPath: enrichment.fotoPath,
          librettoUrl: enrichment.librettoUrl,
          librettoStoragePath: enrichment.librettoStoragePath,
          libretto_raw: enrichment.libretto_raw,
          fotoViste: enrichment.fotoViste,
          hotspots: enrichment.hotspots,
        },
        prossimiAppuntamenti: enrichment.prossimiAppuntamenti,
        media: enrichment.media,
        fotoViste: enrichment.fotoViste,
        hotspots: enrichment.hotspots,
        contatori: {
          lavoriAperti: snapshot.operativita.counts.lavoriAperti,
          lavoriChiusi: snapshot.operativita.counts.lavoriChiusi,
          manutenzioni: snapshot.operativita.counts.manutenzioni,
          rifornimentiTotali: countItems(snapshot.rifornimenti.items),
          materialiTotali: countItems(snapshot.materiali.items),
          documentiTotali: countItems(snapshot.documenti.items),
          eventiTotali: countItems(snapshot.segnalazioniControlli.timelineItems),
          alertTotali: countItems(snapshot.statoOperativo.alerts),
        },
        ultimiLavori: lavori,
        limitations: snapshot.missingData.slice(0, 5),
        sources: snapshot.sources,
      },
    };
  },
};
