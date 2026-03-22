import {
  readInternalAiServerArtifactRepositorySnapshot,
  readInternalAiServerTrackingSummary,
} from "./internalAiServerPersistenceClient";
import { hydrateInternalAiRepositoryStateFromServer } from "./internalAiMockRepository";
import { hydrateInternalAiTrackingSummaryFromServer } from "./internalAiTracking";

export type InternalAiServerPersistenceHydrationResult = {
  artifactRepositoryHydrated: boolean;
  trackingHydrated: boolean;
};

export async function hydrateInternalAiServerPersistence(): Promise<InternalAiServerPersistenceHydrationResult> {
  const [artifactRepository, trackingState] = await Promise.all([
    readInternalAiServerArtifactRepositorySnapshot(),
    readInternalAiServerTrackingSummary(),
  ]);

  if (artifactRepository) {
    hydrateInternalAiRepositoryStateFromServer(artifactRepository);
  }

  if (trackingState) {
    hydrateInternalAiTrackingSummaryFromServer(trackingState.summary);
  }

  return {
    artifactRepositoryHydrated: Boolean(artifactRepository),
    trackingHydrated: Boolean(trackingState),
  };
}
