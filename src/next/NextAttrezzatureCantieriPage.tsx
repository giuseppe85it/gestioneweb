import NextAttrezzatureCantieriReadOnlyPanel from "./NextAttrezzatureCantieriReadOnlyPanel";
import NextClonePageScaffold from "./NextClonePageScaffold";
import { NEXT_GESTIONE_OPERATIVA_PATH } from "./nextStructuralPaths";
import { useNextOperativitaSnapshot } from "./useNextOperativitaSnapshot";

export default function NextAttrezzatureCantieriPage() {
  const { snapshot, loading, error } = useNextOperativitaSnapshot();

  return (
    <NextClonePageScaffold
      eyebrow="Gestione Operativa"
      title="Attrezzature cantieri"
      description="Controparte clone read-only della pagina madre attrezzature cantieri, ora dietro route autonoma."
      backTo={NEXT_GESTIONE_OPERATIVA_PATH}
      backLabel="Gestione Operativa"
      notice={
        <p>
          La navigazione resta quella della madre; salvataggi, upload foto ed eliminazioni
          restano bloccati nel clone.
        </p>
      }
    >
      {loading ? <div className="next-clone-placeholder">Caricamento attrezzature cantieri...</div> : null}
      {error ? <div className="next-clone-placeholder">{error}</div> : null}
      {snapshot ? (
        <NextAttrezzatureCantieriReadOnlyPanel
          snapshot={snapshot.attrezzature}
          blockedReason={snapshot.navigability.attrezzature.reason ?? "Clone read-only"}
        />
      ) : null}
    </NextClonePageScaffold>
  );
}

