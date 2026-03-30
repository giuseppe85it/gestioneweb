import OrdiniInAttesa from "../pages/OrdiniInAttesa";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";
import NextMotherPage from "./NextMotherPage";

export default function NextOrdiniInAttesaPage() {
  return (
    <NextLegacyStorageBoundary presets={["procurement"]}>
      <NextMotherPage pageId="ordini-in-attesa">
        <OrdiniInAttesa />
      </NextMotherPage>
    </NextLegacyStorageBoundary>
  );
}
