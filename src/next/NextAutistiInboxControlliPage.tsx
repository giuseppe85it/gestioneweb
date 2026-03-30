import AutistiControlliAll from "./autistiInbox/NextAutistiControlliAllNative";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";

export default function NextAutistiInboxControlliPage() {
  return (
    <NextLegacyStorageBoundary presets={["autisti"]}>
      <AutistiControlliAll />
    </NextLegacyStorageBoundary>
  );
}

