import RichiestaAttrezzatureAll from "./autistiInbox/NextRichiestaAttrezzatureAllNative";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";

export default function NextAutistiInboxRichiestaAttrezzaturePage() {
  return (
    <NextLegacyStorageBoundary presets={["autisti"]}>
      <RichiestaAttrezzatureAll />
    </NextLegacyStorageBoundary>
  );
}

