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
  currentKmL: number; // km/L medio della finestra recente (somma km / somma litri)
  historicalKmL: number; // km/L medio della baseline storica precedente alla finestra
  historyCount: number; // numero di rifornimenti nella baseline storica
  windowCount: number; // numero di rifornimenti aggregati nella finestra recente
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

export type RefuelWindowConsumption = {
  windowKmL: number; // km/L medio della finestra recente (somma km / somma litri)
  baselineKmL: number; // km/L medio della baseline storica
  windowCount: number; // rifornimenti aggregati nella finestra recente
  baselineCount: number; // rifornimenti nella baseline storica
  isBelowThreshold: boolean; // true se la finestra è sotto la soglia (consumo sospetto)
};

export type RefuelConsumptionIndex = {
  findSuspicion: (
    row: RefuelRow,
    seed: RefuelRow | null,
  ) => RefuelConsumptionSuspicion | null;
  // Media della finestra recente per QUALSIASI rifornimento (anche non anomalo),
  // così la UI può mostrarla in colonna; null se la finestra/baseline è incompleta.
  getWindowConsumption: (
    row: RefuelRow,
    seed: RefuelRow | null,
  ) => RefuelWindowConsumption | null;
};
