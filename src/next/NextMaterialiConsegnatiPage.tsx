import MaterialiConsegnati from "../pages/MaterialiConsegnati";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";
import NextMotherPage from "./NextMotherPage";

export default function NextMaterialiConsegnatiPage() {
  return (
    <NextLegacyStorageBoundary presets={["inventario", "materiali-movimenti", "flotta"]}>
      <NextMotherPage pageId="materiali-consegnati">
        <MaterialiConsegnati />
      </NextMotherPage>
    </NextLegacyStorageBoundary>
  );
}
