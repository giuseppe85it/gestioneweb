import HomeAutista from "./autisti/NextHomeAutistaNative";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";

export default function NextAutistiHomePage() {
  return (
    <NextLegacyStorageBoundary presets={["autisti"]}>
      <HomeAutista />
    </NextLegacyStorageBoundary>
  );
}

