import LoginAutista from "./autisti/NextLoginAutistaNative";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";

export default function NextAutistiLoginPage() {
  return (
    <NextLegacyStorageBoundary presets={["flotta", "autisti"]}>
      <LoginAutista />
    </NextLegacyStorageBoundary>
  );
}

