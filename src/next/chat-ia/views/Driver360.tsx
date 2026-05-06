import { useEffect, useState } from "react";
import { readNextColleghiSnapshot, type NextCollegaReadOnlyItem } from "../../domain/nextColleghiDomain";
import type {
  ChatZeroInvenzioniMessage,
  DisambiguationShape,
  DriverVehicleCertifiedRelation,
} from "../core/chatIaTypes";
import CollapsibleProof from "../components/CollapsibleProof";
import { resolveDriverVehicleRelations } from "../relations/driverRelationResolver";
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
    <CollapsibleProof
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

        const relations = await resolveDriverVehicleRelations(driver);
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
