type ProvenanceItem = {
  sourceCollection: string;
  sourceRecordId: string;
  sourceField: string;
  accessModeUsed: string;
  boundaryEntryId: string;
};

type RelationProofItem = {
  collection: string;
  recordId: string;
  field: string;
  kind: string;
  certainty: string;
};

type CollapsibleProofProps = {
  provenance: ProvenanceItem[];
  relationProof?: RelationProofItem[];
  collapsedByDefault?: boolean;
  title?: string;
};

const FORBIDDEN_FIELD_NAME_PATTERN = /note|nota|descrizione|testo|telefono|contatto|url|Url/;

function isAllowedFieldName(value: string): boolean {
  return Boolean(value) && !FORBIDDEN_FIELD_NAME_PATTERN.test(value);
}

function safeScalar(value: string | number | boolean | null | undefined): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "n.d.";
}

export default function CollapsibleProof({
  provenance,
  relationProof = [],
  collapsedByDefault = true,
  title = "Perche' vedo questo dato?",
}: CollapsibleProofProps) {
  const safeProvenance = provenance.filter((item) => isAllowedFieldName(item.sourceField));
  const safeRelationProof = relationProof.filter((item) => isAllowedFieldName(item.field));

  if (!safeProvenance.length && !safeRelationProof.length) return null;

  return (
    <details className="driver360__proof" data-relation-proof open={!collapsedByDefault}>
      <summary>{title}</summary>
      <dl>
        {safeProvenance.map((item, index) => (
          <div key={`provenance-${item.boundaryEntryId}-${item.sourceRecordId}-${item.sourceField}-${index}`}>
            <dt>Provenienza</dt>
            <dd>
              {safeScalar(item.sourceCollection)} / {safeScalar(item.sourceRecordId)} /{" "}
              {safeScalar(item.sourceField)} / {safeScalar(item.accessModeUsed)} /{" "}
              {safeScalar(item.boundaryEntryId)}
            </dd>
          </div>
        ))}
        {safeRelationProof.map((item, index) => (
          <div key={`relation-${item.collection}-${item.recordId}-${item.field}-${index}`}>
            <dt>Relazione</dt>
            <dd>
              {safeScalar(item.collection)} / {safeScalar(item.recordId)} / {safeScalar(item.field)} /{" "}
              {safeScalar(item.kind)} / {safeScalar(item.certainty)}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
