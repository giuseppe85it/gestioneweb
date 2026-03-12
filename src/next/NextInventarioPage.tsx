import NextClonePageScaffold from "./NextClonePageScaffold";
import NextInventarioReadOnlyPanel from "./NextInventarioReadOnlyPanel";
import { NEXT_GESTIONE_OPERATIVA_PATH } from "./nextStructuralPaths";
import { useNextOperativitaSnapshot } from "./useNextOperativitaSnapshot";

export default function NextInventarioPage() {
  const { snapshot, loading, error } = useNextOperativitaSnapshot();

  return (
    <NextClonePageScaffold
      eyebrow="Gestione Operativa"
      title="Inventario"
      description="Controparte clone read-only della pagina madre inventario, ora raggiungibile con route autonoma."
      backTo={NEXT_GESTIONE_OPERATIVA_PATH}
      backLabel="Gestione Operativa"
      notice={
        <p>
          La pagina resta strutturalmente aperta come nella madre, ma aggiunta materiali,
          modifiche, upload foto e PDF operativi restano bloccati.
        </p>
      }
    >
      {loading ? <div className="next-clone-placeholder">Caricamento inventario...</div> : null}
      {error ? <div className="next-clone-placeholder">{error}</div> : null}
      {snapshot ? (
        <NextInventarioReadOnlyPanel
          snapshot={snapshot.inventario}
          blockedReason={snapshot.navigability.inventario.reason ?? "Clone read-only"}
        />
      ) : null}
    </NextClonePageScaffold>
  );
}

