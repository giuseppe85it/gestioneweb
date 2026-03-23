import { buildFirebaseReadinessSnapshot } from "./internal-ai-firebase-readiness.js";

const snapshot = await buildFirebaseReadinessSnapshot();
console.log(JSON.stringify(snapshot, null, 2));
