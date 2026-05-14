import { normalizeNextMezzoTarga } from "./nextAnagraficheFlottaDomain";
import {
  readNextMezzoManutenzioniSnapshot,
  type NextMaintenanceHistoryItem,
  type NextManutenzioneUrgenza,
} from "./domain/nextManutenzioniDomain";

const MANUTENZIONI_DATASET_KEY = "@manutenzioni";

export const NEXT_OPERATIVITA_TECNICA_DOMAIN = {
  code: "D02",
  name: "Operativita tecnica mezzo",
  logicalDatasets: [MANUTENZIONI_DATASET_KEY] as const,
  nextReadOnlyFields: {
    lavori: [
      "id",
      "targa",
      "descrizione",
      "dettagli",
      "dataInserimento",
      "dataEsecuzione",
      "eseguito",
      "urgenza",
      "statoVista",
      "quality",
      "flags",
    ] as const,
    manutenzioni: [
      "id",
      "targa",
      "descrizione",
      "tipo",
      "data",
      "km",
      "ore",
    ] as const,
  },
} as const;

export type NextLavoroTecnicoField =
  (typeof NEXT_OPERATIVITA_TECNICA_DOMAIN.nextReadOnlyFields.lavori)[number];

export type NextManutenzioneTecnicaField =
  (typeof NEXT_OPERATIVITA_TECNICA_DOMAIN.nextReadOnlyFields.manutenzioni)[number];

export type NextLavoroTecnicoItem = {
  id: string;
  gruppoId: string | null;
  targa: string;
  mezzoTarga: string;
  descrizione: string | null;
  dettagli: string | null;
  dataInserimento: string | null;
  timestampInserimento: number | null;
  dataEsecuzione: string | null;
  timestampEsecuzione: number | null;
  eseguito: boolean;
  urgenza: NextManutenzioneUrgenza | null;
  segnalatoDa: string | null;
  chiHaEseguito: string | null;
  sottoElementiCount: number;
  statoVista: "da_eseguire" | "in_attesa" | "eseguito" | "chiuso_da_evento";
  quality: "certo" | "parziale" | "da_verificare";
  flags: string[];
};

export type NextManutenzioneTecnicaItem = {
  id: string;
  targa: string;
  descrizione: string | null;
  tipo: string | null;
  data: string | null;
  km: number | null;
  ore: number | null;
  sourceCollection: "storage";
  sourceKey: typeof MANUTENZIONI_DATASET_KEY;
};

export type NextMezzoOperativitaTecnicaSnapshot = {
  domainCode: typeof NEXT_OPERATIVITA_TECNICA_DOMAIN.code;
  domainName: typeof NEXT_OPERATIVITA_TECNICA_DOMAIN.name;
  mezzoTarga: string;
  logicalDatasets: readonly string[];
  fields: {
    lavori: readonly NextLavoroTecnicoField[];
    manutenzioni: readonly NextManutenzioneTecnicaField[];
  };
  lavoriAperti: NextLavoroTecnicoItem[];
  lavoriChiusi: NextLavoroTecnicoItem[];
  manutenzioni: NextManutenzioneTecnicaItem[];
  counts: {
    lavoriAperti: number;
    lavoriChiusi: number;
    manutenzioni: number;
  };
};

function toNextLavoroTecnicoItem(item: NextMaintenanceHistoryItem): NextLavoroTecnicoItem {
  const eseguito = item.stato === "eseguita" || item.stato === "chiusa_da_evento";
  const statoVista: NextLavoroTecnicoItem["statoVista"] =
    item.stato === "chiusa_da_evento"
      ? "chiuso_da_evento"
      : eseguito
        ? "eseguito"
        : "in_attesa";

  return {
    id: item.id,
    gruppoId: null,
    targa: item.mezzoTarga,
    mezzoTarga: item.mezzoTarga,
    descrizione: item.descrizione,
    dettagli: item.tipo,
    dataInserimento: item.dataProgrammata ?? item.dataRaw,
    timestampInserimento: item.timestamp,
    dataEsecuzione: eseguito ? item.dataRaw : null,
    timestampEsecuzione: eseguito ? item.timestamp : null,
    eseguito,
    urgenza: item.urgenza,
    segnalatoDa: null,
    chiHaEseguito: item.eseguitoLabel,
    sottoElementiCount: 0,
    statoVista,
    quality: item.quality === "source_direct" ? "certo" : "parziale",
    flags: [
      "source_manutenzioni",
      item.stato === "programmata" ? "programmata" : "",
    ].filter(Boolean),
  };
}

function toNextManutenzioneTecnicaItem(item: NextMaintenanceHistoryItem): NextManutenzioneTecnicaItem {
  return {
    id: item.id,
    targa: item.mezzoTarga,
    descrizione: item.descrizione,
    tipo: item.tipo,
    data: item.dataRaw,
    km: item.km,
    ore: item.ore,
    sourceCollection: "storage",
    sourceKey: MANUTENZIONI_DATASET_KEY,
  };
}

export async function readNextMezzoOperativitaTecnicaSnapshot(
  targa: string
): Promise<NextMezzoOperativitaTecnicaSnapshot> {
  const mezzoTarga = normalizeNextMezzoTarga(targa);
  const manutenzioniSnapshot = await readNextMezzoManutenzioniSnapshot(mezzoTarga);
  const manutenzioni = manutenzioniSnapshot.historyItems.map(toNextManutenzioneTecnicaItem);
  const lavoriAperti = manutenzioniSnapshot.historyItems
    .filter((item) => item.stato === "daFare" || item.stato === "programmata")
    .map(toNextLavoroTecnicoItem);
  const lavoriChiusi = manutenzioniSnapshot.historyItems
    .filter((item) => item.stato === "eseguita" || item.stato === "chiusa_da_evento")
    .map(toNextLavoroTecnicoItem);

  return {
    domainCode: NEXT_OPERATIVITA_TECNICA_DOMAIN.code,
    domainName: NEXT_OPERATIVITA_TECNICA_DOMAIN.name,
    mezzoTarga,
    logicalDatasets: NEXT_OPERATIVITA_TECNICA_DOMAIN.logicalDatasets,
    fields: NEXT_OPERATIVITA_TECNICA_DOMAIN.nextReadOnlyFields,
    lavoriAperti,
    lavoriChiusi,
    manutenzioni,
    counts: {
      lavoriAperti: lavoriAperti.length,
      lavoriChiusi: lavoriChiusi.length,
      manutenzioni: manutenzioni.length,
    },
  };
}
