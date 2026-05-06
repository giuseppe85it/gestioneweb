import type { ChatZeroInvenzioniMessage, ViewEnum } from "../core/chatIaTypes";
import { getViewConfig, type ViewConfig, type ViewSectionConfig } from "../config/view.config";
import ProofPanel from "../components/ProofPanel";

type CertifiedField = {
  value: unknown;
  sourceField: string;
  sourceValueType?: string;
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

type ResolvedFiltersV2Entry = {
  boundaryEntryId: string;
  sourceCollection: string;
  accessModeUsed: string;
  records: CertifiedRecord[];
  status: string;
};

type ResolvedFiltersV2 = {
  version: "resolvedFilters.v2";
  entries: ResolvedFiltersV2Entry[];
  errors?: Array<{ kind?: string; messageKey?: string }>;
};

type CertifiedViewProps = {
  message: ChatZeroInvenzioniMessage;
  viewKind: ViewEnum;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readResolvedFiltersV2(message: ChatZeroInvenzioniMessage): ResolvedFiltersV2 | null {
  const resolvedFilters = message.resolvedFilters as unknown;
  if (!isRecord(resolvedFilters) || resolvedFilters.version !== "resolvedFilters.v2") return null;
  if (!Array.isArray(resolvedFilters.entries)) return null;
  return resolvedFilters as ResolvedFiltersV2;
}

function formatCertifiedValue(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toLocaleDateString("it-IT");
  }
  return "dato non trovato nelle fonti autorizzate";
}

function findEntry(resolved: ResolvedFiltersV2 | null, section: ViewSectionConfig): ResolvedFiltersV2Entry | null {
  return resolved?.entries.find((entry) => entry.boundaryEntryId === section.entryBoundaryId) ?? null;
}

function buildProofItems(record: CertifiedRecord) {
  const provenance = record.provenance;
  if (!provenance) return [];
  const sourceFields = provenance.sourceFields.length ? provenance.sourceFields : Object.keys(record.fields);
  return sourceFields.map((sourceField) => ({
    sourceCollection: provenance.sourceCollection,
    sourceRecordId: provenance.sourceRecordId,
    sourceField,
    accessModeUsed: provenance.accessModeUsed,
    boundaryEntryId: provenance.boundaryEntryId,
  }));
}

function relationLabel(kind: string): string {
  if (kind === "driver_vehicle") return "Autista-mezzo";
  if (kind === "vehicle_refueling") return "Mezzo-rifornimento";
  if (kind === "vehicle_maintenance") return "Mezzo-manutenzione";
  if (kind === "material_supplier") return "Materiale-fornitore";
  if (kind === "site_equipment") return "Cantiere-risorsa";
  return "Relazione certificata";
}

function buildRelationProofItems(record: CertifiedRecord) {
  return (record.relations ?? [])
    .map((relation) => relation.relationProof)
    .filter((proof): proof is CertifiedRelationProof => Boolean(proof))
    .map((proof) => ({
      collection: proof.sourceCollection,
      recordId: proof.sourceRecordId,
      field: proof.sourceField,
      kind: proof.relationKind,
      certainty: proof.certainty,
    }));
}

function renderRelations(record: CertifiedRecord) {
  const relations = record.relations ?? [];
  if (!relations.length) return null;

  return (
    <div className="certified360__relations">
      <h4>Relazioni certificate</h4>
      <ul className="certified360__list">
        {relations.map((relation, index) => (
          <li key={`${relation.relationKind}-${relation.targetLabel ?? "target"}-${index}`}>
            {relationLabel(relation.relationKind)}
            {relation.targetLabel ? `: ${relation.targetLabel}` : ""}
          </li>
        ))}
      </ul>
      <ProofPanel
        provenance={[]}
        relationProof={buildRelationProofItems(record)}
        title="Perche' vedo questa relazione?"
      />
    </div>
  );
}

function renderDisambiguation(message: ChatZeroInvenzioniMessage) {
  const candidates = message.disambiguation?.candidates ?? [];
  if (!candidates.length) return null;
  return (
    <section className="certified360__panel" data-certified360-disambiguation>
      <h3>Risultati da chiarire</h3>
      <ul className="certified360__list">
        {candidates.map((candidate, index) => (
          <li key={`${candidate.id ?? candidate.plate ?? "candidate"}-${index}`}>{candidate.displayLabel}</li>
        ))}
      </ul>
    </section>
  );
}

function renderEmptyPanel(config: ViewConfig, text?: string) {
  return (
    <section className="certified360__panel" data-certified360-empty>
      <h3>{config.title}</h3>
      <p>{text ?? "dato non trovato nelle fonti autorizzate"}</p>
    </section>
  );
}

function renderSection(section: ViewSectionConfig, resolved: ResolvedFiltersV2 | null) {
  const entry = findEntry(resolved, section);
  const records = entry?.records ?? [];
  if (!records.length) {
    return (
      <section className="certified360__panel" key={section.id}>
        <h3>{section.title}</h3>
        <p>{section.emptyText}</p>
      </section>
    );
  }

  return (
    <section className="certified360__panel" key={section.id}>
      <h3>{section.title}</h3>
      <div className="certified360__records">
        {records.map((record, index) => (
          <article className="certified360__record" data-certified360-record key={`${section.id}-${index}`}>
            <dl className="certified360__facts">
              {section.fields.map((fieldConfig) => (
                <div key={fieldConfig.field}>
                  <dt>{fieldConfig.label}</dt>
                  <dd>{formatCertifiedValue(record.fields[fieldConfig.field]?.value)}</dd>
                </div>
              ))}
            </dl>
            {renderRelations(record)}
            <ProofPanel groupByRecord provenance={buildProofItems(record)} recordLabel={record.sourceRecordId} />
          </article>
        ))}
      </div>
    </section>
  );
}

export default function CertifiedView({ message, viewKind }: CertifiedViewProps) {
  const config = getViewConfig(viewKind);
  const resolved = readResolvedFiltersV2(message);
  const hasNoResults = message.accompaniment.kind === "no_results";
  const isUnavailable = config.status === "placeholder" || message.accompaniment.kind === "error_view_unavailable";

  return (
    <section className="certified360" data-certified360-view={viewKind}>
      <header className="certified360__header">
        <p className="certified360__eyebrow">{viewKind}</p>
        <h2>{config.title}</h2>
      </header>
      {renderDisambiguation(message)}
      {isUnavailable ? renderEmptyPanel(config, config.unavailableText) : null}
      {!isUnavailable && hasNoResults ? renderEmptyPanel(config) : null}
      {!isUnavailable && !hasNoResults ? config.sections.map((section) => renderSection(section, resolved)) : null}
    </section>
  );
}
