import CambioMezzoInbox from "./autistiInbox/NextCambioMezzoInboxNative";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";

export default function NextAutistiInboxCambioMezzoPage() {
  return (
    <NextLegacyStorageBoundary presets={["autisti"]}>
      <CambioMezzoInbox />
    </NextLegacyStorageBoundary>
  );
}

