import AutistiGommeAll from "./autistiInbox/NextAutistiGommeAllNative";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";

export default function NextAutistiInboxGommePage() {
  return (
    <NextLegacyStorageBoundary presets={["autisti"]}>
      <AutistiGommeAll />
    </NextLegacyStorageBoundary>
  );
}

