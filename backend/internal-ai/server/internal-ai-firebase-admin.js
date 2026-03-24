import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readInternalAiFirebaseReadonlyBoundary } from "./internal-ai-firebase-readonly-boundary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const backendPackageRoot = path.join(repoRoot, "backend/internal-ai");
const requireFromBackendPackage = createRequire(path.join(backendPackageRoot, "package.json"));
const boundary = readInternalAiFirebaseReadonlyBoundary();

function resolveBackendDependency(specifier) {
  try {
    return requireFromBackendPackage.resolve(specifier);
  } catch {
    return null;
  }
}

function parseJsonObject(rawValue) {
  if (!rawValue || typeof rawValue !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function readCredentialDescriptor() {
  const googleApplicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() ?? "";
  const firebaseServiceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ?? "";
  const firebaseConfig = process.env.FIREBASE_CONFIG?.trim() ?? "";
  const googleCloudProject = process.env.GOOGLE_CLOUD_PROJECT?.trim() ?? "";
  const gcloudProject = process.env.GCLOUD_PROJECT?.trim() ?? "";
  const parsedServiceAccount = parseJsonObject(firebaseServiceAccountJson);

  if (googleApplicationCredentials) {
    return {
      mode: "google_application_credentials",
      value: googleApplicationCredentials,
      projectId: googleCloudProject || gcloudProject || null,
      serviceAccount: null,
      isReady: true,
    };
  }

  if (parsedServiceAccount) {
    const parsedProjectId =
      typeof parsedServiceAccount.project_id === "string" && parsedServiceAccount.project_id.trim()
        ? parsedServiceAccount.project_id.trim()
        : null;

    return {
      mode: "firebase_service_account_json",
      value: null,
      projectId: googleCloudProject || gcloudProject || parsedProjectId,
      serviceAccount: parsedServiceAccount,
      isReady: true,
    };
  }

  if (firebaseConfig) {
    return {
      mode: "firebase_config",
      value: firebaseConfig,
      projectId: googleCloudProject || gcloudProject || null,
      serviceAccount: null,
      isReady: true,
    };
  }

  if (googleCloudProject || gcloudProject) {
    return {
      mode: "project_id_only",
      value: null,
      projectId: googleCloudProject || gcloudProject,
      serviceAccount: null,
      isReady: false,
    };
  }

  return {
    mode: "missing",
    value: null,
    projectId: null,
    serviceAccount: null,
    isReady: false,
  };
}

export async function probeInternalAiFirebaseAdminRuntime() {
  const credential = readCredentialDescriptor();
  const googleApplicationCredentialsExists =
    credential.mode === "google_application_credentials"
      ? await pathExists(credential.value)
      : null;

  const moduleResolution = {
    app: resolveBackendDependency("firebase-admin/app"),
    firestore: resolveBackendDependency("firebase-admin/firestore"),
    storage: resolveBackendDependency("firebase-admin/storage"),
  };

  return {
    packageRoot: "backend/internal-ai",
    moduleResolution,
    modulesReady: Boolean(
      moduleResolution.app && moduleResolution.firestore && moduleResolution.storage,
    ),
    credential: {
      mode: credential.mode,
      projectId: credential.projectId,
      googleApplicationCredentialsExists,
      firebaseServiceAccountJsonValid:
        credential.mode === "firebase_service_account_json" ? true : null,
      isReady:
        credential.mode === "google_application_credentials"
          ? Boolean(googleApplicationCredentialsExists)
          : credential.isReady,
    },
    storageBucket: boundary.storage.bucket,
    canAttemptLiveRead:
      Boolean(moduleResolution.app && moduleResolution.firestore && moduleResolution.storage) &&
      Boolean(
        credential.mode === "firebase_config" ||
          credential.mode === "firebase_service_account_json" ||
          (credential.mode === "google_application_credentials" &&
            googleApplicationCredentialsExists),
      ),
  };
}

let cachedReadonlyContextPromise = null;

export async function getInternalAiFirebaseAdminReadonlyContext() {
  if (cachedReadonlyContextPromise) {
    return cachedReadonlyContextPromise;
  }

  cachedReadonlyContextPromise = (async () => {
    const runtimeProbe = await probeInternalAiFirebaseAdminRuntime();
    const credential = readCredentialDescriptor();
    if (!runtimeProbe.canAttemptLiveRead) {
      return {
        status: "not_ready",
        runtimeProbe,
        app: null,
        firestore: null,
        storageBucket: null,
      };
    }

    const [{ applicationDefault, cert, getApp, getApps, initializeApp }, { getFirestore }, { getStorage }] =
      await Promise.all([
        import("firebase-admin/app"),
        import("firebase-admin/firestore"),
        import("firebase-admin/storage"),
      ]);

    const appName = "internal-ai-readonly";
    const existingApp =
      getApps().find((entry) => entry.name === appName) ?? null;
    const app =
      existingApp ??
      initializeApp(
        {
          credential:
            credential.mode === "firebase_service_account_json" && credential.serviceAccount
              ? cert(credential.serviceAccount)
              : applicationDefault(),
          projectId: runtimeProbe.credential.projectId ?? undefined,
          storageBucket: boundary.storage.bucket,
        },
        appName,
      );

    return {
      status: "ready",
      runtimeProbe,
      app: existingApp ?? getApp(appName) ?? app,
      firestore: getFirestore(app),
      storageBucket: getStorage(app).bucket(boundary.storage.bucket),
    };
  })().catch((error) => {
    cachedReadonlyContextPromise = null;
    return {
      status: "error",
      runtimeProbe: null,
      app: null,
      firestore: null,
      storageBucket: null,
      errorMessage: error instanceof Error ? error.message : "Errore Firebase Admin non disponibile.",
    };
  });

  return cachedReadonlyContextPromise;
}
