export type MaintenanceStatus = "SCADUTA" | "IN_SCADENZA" | "OK" | "SENZA_DATA";

export type RefuelSource = "dossier" | "tmp" | "merged";

export type RefuelSourceKey =
  | "caravate"
  | "distributore_piccadilly"
  | "distributore_eni"
  | "distributore_contanti"
  | "distributore_altro"
  | "non_determinato";

export type RefuelSourceFilter =
  | "all"
  | "caravate"
  | "distributore_piccadilly"
  | "distributore_eni"
  | "distributore_contanti";

export type ScheduledMaintenanceRow = {
  id: string;
  targa: string;
  categoria: string;
  manutenzioneDataFine: Date | null;
  manutenzioneDataFineRaw: string;
  manutenzioneContratto: string;
  manutenzioneKmMax: string;
  dataScadenzaRevisione: Date | null;
  status: MaintenanceStatus;
  daysToDeadline: number | null;
};

export type RefuelRow = {
  id: string;
  originId: string;
  targa: string;
  dateObj: Date;
  autistaNome: string | null;
  badgeAutista: string | null;
  litri: number | null;
  km: number | null;
  distributore: string;
  note: string;
  source: RefuelSource;
  tipoRaw: string | null;
  metodoPagamento: "piccadilly" | "eni" | "contanti" | null;
  paese: "IT" | "CH" | null;
  sourceLabel: string;
  sourceKey: RefuelSourceKey;
};

export type AnomalyType =
  | "KM_TORNANO_INDIETRO"
  | "KM_SALTO_TROPPO_GRANDE"
  | "KM_INVALIDI"
  | "KM_INVARIATI"
  | "LITRI_TROPPO_ALTI"
  | "LITRI_NON_VALIDI"
  | "LITRI_TROPPO_BASSI"
  | "CONSUMO_SOSPETTO_MEDIA_AUTISTA_TARGA";

export type AnomalyTarget = "km" | "litri" | "consumo";

export type RefuelConsumptionSuspicion = {
  currentKmL: number;
  historicalKmL: number;
  historyCount: number;
  deltaPercent: number;
  thresholdFactor: number;
};

export type Anomaly = {
  type: AnomalyType;
  target: AnomalyTarget;
  message: string;
  consumption?: RefuelConsumptionSuspicion;
};

export type MediaFlottaContext = {
  value: number | null;
  sogliaSopra: number | null;
  sogliaSotto: number | null;
};

export type RefuelSeedIndex = {
  findSeed: (row: RefuelRow) => RefuelRow | null;
};

export type RefuelConsumptionIndex = {
  findSuspicion: (
    row: RefuelRow,
    seed: RefuelRow | null,
  ) => RefuelConsumptionSuspicion | null;
};
