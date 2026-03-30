import LibrettiExport from "../pages/LibrettiExport";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";
import NextMotherPage from "./NextMotherPage";

export default function NextLibrettiExportPage() {
  return (
    <NextLegacyStorageBoundary presets={["flotta"]}>
      <NextMotherPage pageId="libretti-export">
        <LibrettiExport />
      </NextMotherPage>
    </NextLegacyStorageBoundary>
  );
}
