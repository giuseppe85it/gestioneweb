import CollapsibleProof from "./CollapsibleProof";
import "./proofPanel.css";

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

type ProofPanelProps = {
  provenance: ProvenanceItem[];
  relationProof?: RelationProofItem[];
  collapsedByDefault?: boolean;
  groupByRecord?: boolean;
  recordLabel?: string;
  emptyText?: string;
  title?: string;
};

export default function ProofPanel({
  provenance,
  relationProof = [],
  collapsedByDefault = true,
  groupByRecord = false,
  recordLabel,
  emptyText = "dato non trovato nelle fonti autorizzate",
  title = "Perche' vedo questo dato?",
}: ProofPanelProps) {
  const hasContent = provenance.length > 0 || relationProof.length > 0;
  return (
    <div className="proof-panel" data-proof-panel>
      <CollapsibleProof
        collapsedByDefault={collapsedByDefault}
        emptyText={hasContent ? undefined : emptyText}
        groupByRecord={groupByRecord}
        provenance={provenance}
        recordLabel={recordLabel}
        relationProof={relationProof}
        title={title}
      />
    </div>
  );
}
