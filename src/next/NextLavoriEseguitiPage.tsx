import LavoriEseguiti from "../pages/LavoriEseguiti";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";
import NextMotherPage from "./NextMotherPage";

export default function NextLavoriEseguitiPage() {
  return (
    <NextLegacyStorageBoundary presets={["lavori", "flotta"]}>
      <NextMotherPage pageId="lavori-eseguiti">
        <LavoriEseguiti />
      </NextMotherPage>
    </NextLegacyStorageBoundary>
  );
}
