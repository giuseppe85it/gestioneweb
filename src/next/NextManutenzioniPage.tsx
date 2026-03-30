import Manutenzioni from "../pages/Manutenzioni";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";
import NextMotherPage from "./NextMotherPage";

export default function NextManutenzioniPage() {
  return (
    <NextLegacyStorageBoundary
      presets={["manutenzioni", "flotta", "inventario", "materiali-movimenti"]}
    >
      <NextMotherPage pageId="manutenzioni">
        <Manutenzioni />
      </NextMotherPage>
    </NextLegacyStorageBoundary>
  );
}
