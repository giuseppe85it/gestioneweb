import AutistiLogAccessiAll from "./autistiInbox/NextAutistiLogAccessiAllNative";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";

export default function NextAutistiInboxLogAccessiPage() {
  return (
    <NextLegacyStorageBoundary presets={["autisti"]}>
      <AutistiLogAccessiAll />
    </NextLegacyStorageBoundary>
  );
}

