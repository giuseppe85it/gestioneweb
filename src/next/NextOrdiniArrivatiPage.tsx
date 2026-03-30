import OrdiniArrivati from "../pages/OrdiniArrivati";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";
import NextMotherPage from "./NextMotherPage";

export default function NextOrdiniArrivatiPage() {
  return (
    <NextLegacyStorageBoundary presets={["procurement"]}>
      <NextMotherPage pageId="ordini-arrivati">
        <OrdiniArrivati />
      </NextMotherPage>
    </NextLegacyStorageBoundary>
  );
}
