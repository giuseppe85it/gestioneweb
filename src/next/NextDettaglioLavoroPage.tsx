import DettaglioLavoro from "../pages/DettaglioLavoro";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";
import NextMotherPage from "./NextMotherPage";

export default function NextDettaglioLavoroPage() {
  return (
    <NextLegacyStorageBoundary presets={["lavori"]}>
      <NextMotherPage pageId="dettaglio-lavoro">
        <DettaglioLavoro />
      </NextMotherPage>
    </NextLegacyStorageBoundary>
  );
}
