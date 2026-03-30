import AttrezzatureCantieri from "../pages/AttrezzatureCantieri";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";
import NextMotherPage from "./NextMotherPage";

export default function NextAttrezzatureCantieriPage() {
  return (
    <NextLegacyStorageBoundary presets={["attrezzature"]}>
      <NextMotherPage pageId="attrezzature-cantieri">
        <AttrezzatureCantieri />
      </NextMotherPage>
    </NextLegacyStorageBoundary>
  );
}
