import { useState } from "react";
import type {
  ChatZeroInvenzioniMessage,
  DisambiguationShape,
  DriverVehicleCertifiedRelation,
  RelationProof,
} from "../core/chatIaTypes";
import ProofPanel from "../components/ProofPanel";
import "./driver360.css";

type Driver360Props = {
  message: ChatZeroInvenzioniMessage;
};

type CertifiedField = {
  value: unknown;
  sourceField: string;
  sourceValueType?: string;
};

type CertifiedRelationProof = {
  relationKind: string;
  sourceCollection: string;
  sourceRecordId: string;
  sourceField: string;
  rule: string;
  certainty: string;
};

type CertifiedRelation = {
  relationKind: string;
  targetLabel?: string;
  relationProof?: CertifiedRelationProof;
};

type CertifiedRecord = {
  sourceRecordId: string;
  fields: Record<string, CertifiedField>;
  provenance?: {
    sourceCollection: string;
    sourceRecordId: string;
    sourceFields: string[];
    accessModeUsed: string;
    boundaryEntryId: string;
    confidence?: string;
  };
  relations?: CertifiedRelation[];
};

type ResolvedFiltersV2Entry = {
  boundaryEntryId: string;
  sourceCollection: string;
  accessModeUsed: string;
  records: CertifiedRecord[];
  status: string;
};

type ResolvedFiltersV2 = {
  version: "resolvedFilters.v2";
  legacyDriver360?: { driverId?: string | null } | null;
  entries: ResolvedFiltersV2Entry[];
};

type Driver360State =
  | { status: "ready"; driver: { id: string; nome: string; badge: string | null }; relations: DriverVehicleCertifiedRelation[] }
  | { status: "missing"; error: string; relations: DriverVehicleCertifiedRelation[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function normalizeId(value: unknown): string {
  return text(value);
}

function normalizePlate(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : "";
}

function readResolvedFiltersV2(message: ChatZeroInvenzioniMessage): ResolvedFiltersV2 | null {
  const resolvedFilters = message.resolvedFilters as unknown;
  if (!isRecord(resolvedFilters) || resolvedFilters.version !== "resolvedFilters.v2") return null;
  if (!Array.isArray(resolvedFilters.entries)) return null;
  return resolvedFilters as ResolvedFiltersV2;
}

function readFieldText(record: CertifiedRecord | null, fields: string[]): string {
  if (!record) return "";
  for (const field of fields) {
    const value = text(record.fields[field]?.value);
    if (value) return value;
  }
  return "";
}

function getDriverId(message: ChatZeroInvenzioniMessage, selectedDriverId: string | null): string | null {
  if (selectedDriverId) return selectedDriverId;
  const resolved = readResolvedFiltersV2(message);
  const v2DriverId = text(resolved?.legacyDriver360?.driverId);
  if (v2DriverId) return v2DriverId;
  const legacy = message.resolvedFilters as { driverId?: unknown } | null | undefined;
  const legacyDriverId = text(legacy?.driverId);
  return legacyDriverId || null;
}

function getCandidateDriverId(candidate: NonNullable<DisambiguationShape["candidates"]>[number]): string | null {
  return typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim() : null;
}

function findDriverRecord(resolved: ResolvedFiltersV2 | null, driverId: string): CertifiedRecord | null {
  const driverEntry = resolved?.entries.find(
    (entry) => entry.boundaryEntryId === "firestore-storage-colleghi-doc",
  );
  const records = driverEntry?.records ?? [];
  return (
    records.find((record) => normalizeId(record.fields.id?.value) === driverId) ??
    records[0] ??
    null
  );
}

function asDriverVehicleRelation(relation: CertifiedRelation, record: CertifiedRecord): DriverVehicleCertifiedRelation | null {
  const proof = relation.relationProof;
  if (relation.relationKind !== "driver_vehicle" || !proof) return null;
  const vehiclePlate =
    normalizePlate(relation.targetLabel) ||
    normalizePlate(record.fields.targa?.value) ||
    normalizePlate(record.fields.targaMotrice?.value) ||
    normalizePlate(record.fields.mezzoTarga?.value) ||
    normalizePlate(record.fields.targaRimorchio?.value);
  if (!vehiclePlate) return null;

  return {
    relationKind: "driver_vehicle",
    vehiclePlate,
    relationProof: {
      relationKind: "driver_vehicle",
      sourceCollection: proof.sourceCollection,
      sourceRecordId: proof.sourceRecordId,
      sourceField: proof.sourceField,
      rule: proof.rule,
      certainty: proof.certainty === "exact" ? "exact" : "explicit_assignment",
    },
  };
}

function readDriverRelations(resolved: ResolvedFiltersV2 | null): DriverVehicleCertifiedRelation[] {
  const relations = new Map<string, DriverVehicleCertifiedRelation>();
  for (const entry of resolved?.entries ?? []) {
    for (const record of entry.records ?? []) {
      for (const relation of record.relations ?? []) {
        const nextRelation = asDriverVehicleRelation(relation, record);
        if (nextRelation && !relations.has(nextRelation.vehiclePlate)) {
          relations.set(nextRelation.vehiclePlate, nextRelation);
        }
      }
    }
  }
  return Array.from(relations.values()).sort((left, right) =>
    left.vehiclePlate.localeCompare(right.vehiclePlate, "it", { sensitivity: "base" }),
  );
}

function buildDriver360State(message: ChatZeroInvenzioniMessage, selectedDriverId: string | null): Driver360State {
  const resolved = readResolvedFiltersV2(message);
  const driverId = getDriverId(message, selectedDriverId);
  if (!driverId) {
    return {
      status: "missing",
      error: "Profilo autista non risolto dal backend.",
      relations: [],
    };
  }

  const driverRecord = findDriverRecord(resolved, driverId);
  if (!driverRecord) {
    return {
      status: "missing",
      error: "Autista certificato non trovato nel payload backend.",
      relations: [],
    };
  }

  return {
    status: "ready",
    driver: {
      id: driverId,
      nome: readFieldText(driverRecord, ["nome", "nomeCompleto", "label"]) || "dato non trovato nelle fonti autorizzate",
      badge: readFieldText(driverRecord, ["badge", "codice"]) || null,
    },
    relations: readDriverRelations(resolved),
  };
}

function renderDisambiguation(
  message: ChatZeroInvenzioniMessage,
  onSelectCandidate: (driverId: string) => void,
) {
  const candidates = message.disambiguation?.candidates ?? [];
  if (!candidates.length) return null;

  return (
    <section className="driver360 driver360--disambiguation" data-driver360-disambiguation>
      <header className="driver360__header">
        <p className="driver360__eyebrow">Driver360</p>
        <h2>Profilo autista</h2>
      </header>
      <div className="driver360__panel">
        <h3>Seleziona un candidato certificato</h3>
        <div className="driver360__candidate-list">
          {candidates.map((candidate, index) => {
            const candidateDriverId = getCandidateDriverId(candidate);
            return (
              <button
                className="driver360__candidate"
                data-driver360-candidate
                disabled={!candidateDriverId}
                key={`${candidate.id ?? candidate.plate ?? "candidate"}-${index}`}
                onClick={() => {
                  if (candidateDriverId) {
                    onSelectCandidate(candidateDriverId);
                  }
                }}
                type="button"
              >
                {candidate.displayLabel}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function getBoundaryEntryIdForRelation(relation: DriverVehicleCertifiedRelation): string {
  const sourceCollection = relation.relationProof.sourceCollection;
  if (sourceCollection.includes("@autisti_sessione_attive")) {
    return "firestore-storage-autisti-sessioni-attive-doc";
  }
  if (sourceCollection.includes("@storico_eventi_operativi")) {
    return "firestore-storage-storico-eventi-operativi-doc";
  }
  if (sourceCollection.includes("@rifornimenti_autisti_tmp")) {
    return "firestore-storage-rifornimenti-autisti-tmp-doc";
  }
  if (sourceCollection.includes("@mezzi_aziendali")) {
    return "firestore-storage-mezzi-aziendali-doc";
  }
  return "boundary_non_mappato";
}

function renderRelationProof(relation: DriverVehicleCertifiedRelation) {
  const proof: RelationProof = relation.relationProof;
  return (
    <ProofPanel
      provenance={[
        {
          sourceCollection: proof.sourceCollection,
          sourceRecordId: proof.sourceRecordId,
          sourceField: proof.sourceField,
          accessModeUsed: "exact_document",
          boundaryEntryId: getBoundaryEntryIdForRelation(relation),
        },
      ]}
      relationProof={[
        {
          collection: proof.sourceCollection,
          recordId: proof.sourceRecordId,
          field: proof.sourceField,
          kind: proof.rule,
          certainty: proof.certainty,
        },
      ]}
      title="Perche' vedo questa relazione?"
    />
  );
}

export default function Driver360({ message }: Driver360Props) {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const disambiguation = selectedDriverId ? null : renderDisambiguation(message, setSelectedDriverId);
  if (disambiguation) return disambiguation;

  const state = buildDriver360State(message, selectedDriverId);
  if (state.status !== "ready") {
    return (
      <section className="driver360 driver360--placeholder" data-driver360>
        <header className="driver360__header">
          <p className="driver360__eyebrow">Driver360</p>
          <h2>Profilo autista</h2>
        </header>
        <p className="driver360__empty">{state.error}</p>
      </section>
    );
  }

  return (
    <section className="driver360" data-driver360>
      <header className="driver360__header">
        <p className="driver360__eyebrow">Driver360</p>
        <h2>Profilo autista</h2>
      </header>

      <div className="driver360__grid">
        <section className="driver360__panel">
          <h3>Anagrafica certificata</h3>
          <dl className="driver360__facts">
            <div>
              <dt>Nome</dt>
              <dd>{state.driver.nome}</dd>
            </div>
            <div>
              <dt>Badge</dt>
              <dd>{state.driver.badge ?? "n.d."}</dd>
            </div>
          </dl>
        </section>

        <section className="driver360__panel">
          <h3>Stato mezzo attuale</h3>
          {state.relations.length ? (
            <div className="driver360__vehicle-list">
              {state.relations.map((relation) => (
                <article className="driver360__vehicle" data-driver360-vehicle key={relation.vehiclePlate}>
                  <p className="driver360__vehicle-plate">{relation.vehiclePlate}</p>
                  {renderRelationProof(relation)}
                </article>
              ))}
            </div>
          ) : (
            <p className="driver360__empty">Nessun mezzo certificato trovato</p>
          )}
        </section>
      </div>
    </section>
  );
}
