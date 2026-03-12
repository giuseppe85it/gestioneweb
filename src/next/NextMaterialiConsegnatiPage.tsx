import NextClonePageScaffold from "./NextClonePageScaffold";
import NextMaterialiConsegnatiReadOnlyPanel from "./NextMaterialiConsegnatiReadOnlyPanel";
import { buildNextDossierPath, NEXT_GESTIONE_OPERATIVA_PATH } from "./nextStructuralPaths";
import { useNextOperativitaSnapshot } from "./useNextOperativitaSnapshot";
import { useNavigate } from "react-router-dom";

export default function NextMaterialiConsegnatiPage() {
  const navigate = useNavigate();
  const { snapshot, loading, error } = useNextOperativitaSnapshot();

  return (
    <NextClonePageScaffold
      eyebrow="Gestione Operativa"
      title="Materiali consegnati"
      description="Controparte clone read-only della pagina madre dedicata alle uscite di magazzino."
      backTo={NEXT_GESTIONE_OPERATIVA_PATH}
      backLabel="Gestione Operativa"
      notice={
        <p>
          Registrazione consegne, delete e PDF operativi restano neutralizzati. La pagina mantiene
          pero la stessa autonomia di navigazione della madre.
        </p>
      }
    >
      {loading ? <div className="next-clone-placeholder">Caricamento materiali consegnati...</div> : null}
      {error ? <div className="next-clone-placeholder">{error}</div> : null}
      {snapshot ? (
        <NextMaterialiConsegnatiReadOnlyPanel
          snapshot={snapshot.materialiMovimenti}
          blockedReason={snapshot.navigability.materiali.reason ?? "Clone read-only"}
          onOpenDossier={(targa) => {
            if (!targa) return;
            navigate(buildNextDossierPath(targa));
          }}
        />
      ) : null}
    </NextClonePageScaffold>
  );
}
