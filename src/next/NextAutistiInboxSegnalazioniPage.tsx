import AutistiSegnalazioniAll from "./autistiInbox/NextAutistiSegnalazioniAllNative";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";

export default function NextAutistiInboxSegnalazioniPage() {
  return (
    <NextLegacyStorageBoundary presets={["autisti"]}>
      <AutistiSegnalazioniAll />
    </NextLegacyStorageBoundary>
  );
}

