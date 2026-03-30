import LavoriInAttesa from "../pages/LavoriInAttesa";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";
import NextMotherPage from "./NextMotherPage";

export default function NextLavoriInAttesaPage() {
  return (
    <NextLegacyStorageBoundary presets={["lavori", "flotta"]}>
      <NextMotherPage pageId="lavori-in-attesa">
        <LavoriInAttesa />
      </NextMotherPage>
    </NextLegacyStorageBoundary>
  );
}
