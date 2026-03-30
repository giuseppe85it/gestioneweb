import DettaglioOrdine from "../pages/DettaglioOrdine";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";
import NextMotherPage from "./NextMotherPage";

export default function NextDettaglioOrdinePage() {
  return (
    <NextLegacyStorageBoundary presets={["procurement", "inventario"]}>
      <NextMotherPage pageId="dettaglio-ordine">
        <DettaglioOrdine />
      </NextMotherPage>
    </NextLegacyStorageBoundary>
  );
}
