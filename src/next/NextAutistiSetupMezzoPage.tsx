import SetupMezzo from "./autisti/NextSetupMezzoNative";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";

export default function NextAutistiSetupMezzoPage() {
  return (
    <NextLegacyStorageBoundary presets={["flotta", "autisti"]}>
      <SetupMezzo />
    </NextLegacyStorageBoundary>
  );
}

