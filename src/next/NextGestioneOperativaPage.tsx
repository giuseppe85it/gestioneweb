import GestioneOperativa from "../pages/GestioneOperativa";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";
import NextMotherPage from "./NextMotherPage";

export default function NextGestioneOperativaPage() {
  return (
    <NextLegacyStorageBoundary
      presets={["inventario", "materiali-movimenti", "manutenzioni"]}
    >
      <NextMotherPage pageId="gestione-operativa">
        <GestioneOperativa />
      </NextMotherPage>
    </NextLegacyStorageBoundary>
  );
}
