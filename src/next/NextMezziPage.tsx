import Mezzi from "../pages/Mezzi";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";
import NextMotherPage from "./NextMotherPage";

export default function NextMezziPage() {
  return (
    <NextLegacyStorageBoundary presets={["flotta"]}>
      <NextMotherPage pageId="mezzi">
        <Mezzi />
      </NextMotherPage>
    </NextLegacyStorageBoundary>
  );
}
