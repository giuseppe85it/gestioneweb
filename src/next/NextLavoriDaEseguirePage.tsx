import LavoriDaEseguire from "../pages/LavoriDaEseguire";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";
import NextMotherPage from "./NextMotherPage";

export default function NextLavoriDaEseguirePage() {
  return (
    <NextLegacyStorageBoundary presets={["lavori", "flotta"]}>
      <NextMotherPage pageId="lavori-da-eseguire">
        <LavoriDaEseguire />
      </NextMotherPage>
    </NextLegacyStorageBoundary>
  );
}
