import NextAttrezzatureCantieriReadOnlyPanel from "./NextAttrezzatureCantieriReadOnlyPanel";
import NextClonePageScaffold from "./NextClonePageScaffold";
import { useNextOperativitaSnapshot } from "./useNextOperativitaSnapshot";

export default function NextAttrezzatureCantieriPage() {
  const { snapshot, loading, error } = useNextOperativitaSnapshot();

  return (
    <NextClonePageScaffold
      eyebrow="Gestione Operativa / Attrezzature"
      title="Attrezzature cantieri"
      description="Route NEXT autonoma per consultare stato e registro attrezzature senza riaprire il runtime madre."
      backTo="/next/gestione-operativa"
      backLabel="Gestione Operativa"
      notice={
        <div style={{ display: "grid", gap: 12 }}>
          {loading ? <div className="next-clone-placeholder">Caricamento attrezzature cantieri...</div> : null}
          {error ? <div className="next-clone-placeholder">{error}</div> : null}
          {snapshot ? (
            <p style={{ margin: 0 }}>
              Movimenti letti: {snapshot.attrezzature.counts.totalMovements} | Cantieri: {snapshot.attrezzature.counts.cantieri} |
              Con foto: {snapshot.attrezzature.counts.withPhoto}
            </p>
          ) : null}
        </div>
      }
    >
      {snapshot ? (
        <NextAttrezzatureCantieriReadOnlyPanel
          snapshot={snapshot.attrezzature}
          blockedReason={snapshot.navigability.attrezzature.reason ?? "Clone read-only"}
        />
      ) : null}
    </NextClonePageScaffold>
  );
}
