import Inventario from "../pages/Inventario";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";
import NextMotherPage from "./NextMotherPage";

export default function NextInventarioPage() {
  return (
    <NextLegacyStorageBoundary presets={["inventario"]}>
      <NextMotherPage pageId="inventario">
        <Inventario />
      </NextMotherPage>
    </NextLegacyStorageBoundary>
  );
}
