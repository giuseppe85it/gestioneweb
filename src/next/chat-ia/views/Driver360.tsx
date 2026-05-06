import { useEffect, useState } from "react";
import {
  readNextAnagraficheFlottaSnapshot,
  type NextAnagraficheFlottaMezzoItem,
} from "../../nextAnagraficheFlottaDomain";
import {
  readNextAutistiReadOnlySnapshot,
  type NextAutistiCanonicalAssignment,
} from "../../domain/nextAutistiDomain";
import { readNextColleghiSnapshot, type NextCollegaReadOnlyItem } from "../../domain/nextColleghiDomain";
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

type Driver360State =
  | { status: "idle" | "loading"; driver: null; relations: DriverVehicleCertifiedRelation[]; error: null }
  | { status: "ready"; driver: NextCollegaReadOnlyItem; relations: DriverVehicleCertifiedRelation[]; error: null }
  | { status: "missing"; driver: null; relations: DriverVehicleCertifiedRelation[]; error: string };

function getDriverId(message: ChatZeroInvenzioniMessage): string | null {
  const value = message.resolvedFilters && "driverId" in message.resolvedFilters
    ? message.resolvedFilters.driverId
    : null;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getCandidateDriverId(candidate: NonNullable<DisambiguationShape["candidates"]>[number]): string | null {
  return typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim() : null;
}

function normalizeId(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBadge(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, "").toLowerCase() : "";
}

function normalizePlate(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : "";
}

function buildVehicleRelationProof(vehicle: NextAnagraficheFlottaMezzoItem): RelationProof {
  return {
    relationKind: "driver_vehicle",
    sourceCollection: "storage/@mezzi_aziendali",
    sourceRecordId: vehicle.id || vehicle.targa,
    sourceField: "autistaId",
    rule: "autistaId_explicit",
    certainty: "explicit_assignment",
  };
}

function buildAssignmentRelationProof(assignment: NextAutistiCanonicalAssignment): RelationProof {
  return {
    relationKind: "driver_vehicle",
    sourceCollection: `storage/${assignment.sourceDataset}`,
    sourceRecordId: assignment.id,
    sourceField: "badgeAutista+mezzoTarga",
    rule:
      assignment.sourceKind === "sessione_attiva"
        ? "active_assignment_badge_exact"
        : "confirmed_vehicle_change_badge_exact",
    certainty: "explicit_assignment",
  };
}

function relationFromVehicle(vehicle: NextAnagraficheFlottaMezzoItem): DriverVehicleCertifiedRelation | null {
  const vehiclePlate = normalizePlate(vehicle.targa);
  if (!vehiclePlate) return null;
  return {
    relationKind: "driver_vehicle",
    vehiclePlate,
    relationProof: buildVehicleRelationProof(vehicle),
  };
}

function relationFromAssignment(
  assignment: NextAutistiCanonicalAssignment,
): DriverVehicleCertifiedRelation | null {
  const vehiclePlate = normalizePlate(assignment.mezzoTarga);
  if (!vehiclePlate) return null;
  return {
    relationKind: "driver_vehicle",
    vehiclePlate,
    relationProof: buildAssignmentRelationProof(assignment),
  };
}

function addRelationIfCertified(
  target: Map<string, DriverVehicleCertifiedRelation>,
  relation: DriverVehicleCertifiedRelation | null,
): void {
  if (!relation?.relationProof) return;
  if (!target.has(relation.vehiclePlate)) {
    target.set(relation.vehiclePlate, relation);
  }
}

async function resolveDriverVehicleRelationsForDriver(
  driver: NextCollegaReadOnlyItem,
): Promise<DriverVehicleCertifiedRelation[]> {
  const driverId = normalizeId(driver.id);
  const driverBadge = normalizeBadge(driver.badge);
  const relations = new Map<string, DriverVehicleCertifiedRelation>();

  if (!driverId) return [];

  const [flottaSnapshot, autistiSnapshot] = await Promise.all([
    readNextAnagraficheFlottaSnapshot({ includeClonePatches: false }),
    readNextAutistiReadOnlySnapshot(Date.now(), {
      includeLocalClone: false,
      includeStorageOverlay: false,
    }),
  ]);

  flottaSnapshot.items
    .filter((vehicle) => normalizeId(vehicle.autistaId) === driverId)
    .forEach((vehicle) => addRelationIfCertified(relations, relationFromVehicle(vehicle)));

  if (driverBadge) {
    autistiSnapshot.assignments
      .filter((assignment) => assignment.linkReliability === "forte")
      .filter((assignment) => normalizeBadge(assignment.badgeAutista) === driverBadge)
      .forEach((assignment) => addRelationIfCertified(relations, relationFromAssignment(assignment)));
  }

  return Array.from(relations.values()).sort((left, right) =>
    left.vehiclePlate.localeCompare(right.vehiclePlate, "it", { sensitivity: "base" }),
  );
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
  const proof = relation.relationProof;
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
  const driverId = selectedDriverId ?? getDriverId(message);
  const [state, setState] = useState<Driver360State>({
    status: driverId ? "loading" : "idle",
    driver: null,
    relations: [],
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (!driverId) {
      setState({ status: "idle", driver: null, relations: [], error: null });
      return;
    }

    setState({ status: "loading", driver: null, relations: [], error: null });
    void (async () => {
      try {
        const snapshot = await readNextColleghiSnapshot({ includeCloneOverlays: false });
        const driver = snapshot.items.find((item) => item.id === driverId) ?? null;
        if (!driver) {
          if (!cancelled) {
            setState({
              status: "missing",
              driver: null,
              relations: [],
              error: "Autista certificato non trovato.",
            });
          }
          return;
        }

        const relations = await resolveDriverVehicleRelationsForDriver(driver);
        if (!cancelled) {
          setState({ status: "ready", driver, relations, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "missing",
            driver: null,
            relations: [],
            error: error instanceof Error ? error.message : "Driver360 non disponibile.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [driverId]);

  const disambiguation = selectedDriverId ? null : renderDisambiguation(message, setSelectedDriverId);
  if (disambiguation) return disambiguation;

  if (!driverId) {
    return (
      <section className="driver360 driver360--placeholder" data-driver360>
        <header className="driver360__header">
          <p className="driver360__eyebrow">Driver360</p>
          <h2>Profilo autista</h2>
        </header>
        <p className="driver360__empty">Profilo autista non risolto dal backend.</p>
      </section>
    );
  }

  if (state.status === "loading") {
    return (
      <section className="driver360" data-driver360>
        <header className="driver360__header">
          <p className="driver360__eyebrow">Driver360</p>
          <h2>Profilo autista</h2>
        </header>
        <p className="driver360__empty">Caricamento profilo autista...</p>
      </section>
    );
  }

  if (state.status !== "ready") {
    return (
      <section className="driver360 driver360--placeholder" data-driver360>
        <header className="driver360__header">
          <p className="driver360__eyebrow">Driver360</p>
          <h2>Profilo autista</h2>
        </header>
        <p className="driver360__empty">{state.error ?? "Profilo autista non disponibile."}</p>
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
