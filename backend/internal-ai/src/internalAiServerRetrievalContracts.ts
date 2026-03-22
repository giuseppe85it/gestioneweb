import type { NextAnagraficheFlottaMezzoItem } from "../../../src/next/nextAnagraficheFlottaDomain";
import {
  INTERNAL_AI_SERVER_ADAPTER_BASE_PATH,
  type InternalAiServerPersistenceMode,
} from "./internalAiServerPersistenceContracts";

export type InternalAiServerRetrievalSourceMode = "clone_seeded_readonly_snapshot";

export const INTERNAL_AI_SERVER_RETRIEVAL_ROUTES = {
  read: `${INTERNAL_AI_SERVER_ADAPTER_BASE_PATH}/retrieval/read`,
} as const;

export type InternalAiServerVehicleContextRecord = NextAnagraficheFlottaMezzoItem & {
  librettoStoragePath: string | null;
};

export type InternalAiServerVehicleContextSnapshot = {
  version: 1;
  sourceMode: InternalAiServerRetrievalSourceMode;
  domainCode: "D01";
  activeReadOnlyDataset: "@mezzi_aziendali";
  fileAvailabilityDataset: "@mezzi_aziendali";
  seededAt: string | null;
  counts: {
    totalVehicles: number;
    withLibrettoUrl: number;
    withLibrettoStoragePath: number;
  };
  flottaLimitations: string[];
  fileAvailabilityLimitations: string[];
  notes: string[];
  items: InternalAiServerVehicleContextRecord[];
};

export type InternalAiServerRetrievalSnapshotMeta = {
  domainCode: "D01";
  activeReadOnlyDataset: "@mezzi_aziendali";
  fileAvailabilityDataset: "@mezzi_aziendali";
  seededAt: string | null;
  counts: InternalAiServerVehicleContextSnapshot["counts"];
  flottaLimitations: string[];
  fileAvailabilityLimitations: string[];
  notes: string[];
};

export type InternalAiServerRetrievalReadRequestBody =
  | {
      operation: "seed_vehicle_context_snapshot";
      requestId?: string;
      actorId?: string | null;
      snapshot: InternalAiServerVehicleContextSnapshot;
    }
  | {
      operation: "read_vehicle_context_by_targa";
      requestId?: string;
      actorId?: string | null;
      rawTarga: string;
    };

export type InternalAiServerRetrievalReadResponseData = {
  operation: "seed_vehicle_context_snapshot" | "read_vehicle_context_by_targa";
  persistenceMode: InternalAiServerPersistenceMode;
  sourceMode: InternalAiServerRetrievalSourceMode;
  snapshotMeta: InternalAiServerRetrievalSnapshotMeta;
  vehicleContext: InternalAiServerVehicleContextRecord | null;
  traceEntryId: string;
  notes: string[];
};
