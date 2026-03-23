import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readInternalAiFirebaseReadonlyBoundary } from "./internal-ai-firebase-readonly-boundary.js";
import { probeInternalAiFirebaseAdminRuntime } from "./internal-ai-firebase-admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const boundary = readInternalAiFirebaseReadonlyBoundary();
const STORAGE_BUCKET = boundary.storage.bucket;
const REQUIRED_BACKEND_RUNTIME_DEPENDENCIES = Object.freeze([
  "body-parser",
  "dotenv",
  "express",
  "firebase-admin",
  "openai",
]);

async function pathExists(relativePath) {
  try {
    await fs.access(path.join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readTextIfExists(relativePath) {
  try {
    return await fs.readFile(path.join(repoRoot, relativePath), "utf8");
  } catch {
    return null;
  }
}

async function readJsonIfExists(relativePath) {
  const rawText = await readTextIfExists(relativePath);
  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return null;
  }
}

function hasDependency(packageJson, dependencyName) {
  if (!packageJson || typeof packageJson !== "object") {
    return false;
  }

  const dependencies = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
    ...(packageJson.peerDependencies ?? {}),
    ...(packageJson.optionalDependencies ?? {}),
  };

  return typeof dependencies[dependencyName] === "string";
}

function hasAllDependencies(packageJson, dependencyNames) {
  return dependencyNames.every((dependencyName) => hasDependency(packageJson, dependencyName));
}

function buildFirestoreCandidateReads() {
  return boundary.firestore.allowedReads.map((entry) => ({
    id: entry.id,
    label: entry.label,
    service: entry.service,
    status: "candidate_not_enabled",
    accessMode: entry.accessMode,
    targetLabel: `${entry.collection}/${entry.docId}`,
    sourceOfTruth: entry.sourceOfTruth,
    constraints: [
      `Solo lettura del documento esatto ${entry.collection}/${entry.docId}, nessuna scansione libera della collection ${entry.collection}.`,
      `Campi futuri ammessi: ${entry.allowedFields.join(", ")}.`,
      `Limite runtime futuro: massimo ${entry.requestLimits.maxDocumentReadsPerRequest} documento Firestore e massimo ${entry.requestLimits.maxReturnedVehicleRecords} record mezzo restituito per richiesta.`,
      `Nessun fallback su domini fuori boundary: ${entry.forbiddenDomains.join(", ")}.`,
      "Traceability obbligatoria su dataset, docId, targa richiesta ed esito del read-only.",
    ],
  }));
}

function buildStorageCandidateReads() {
  return boundary.storage.allowedReads.map((entry) => ({
    id: entry.id,
    label: entry.label,
    service: entry.service,
    status: "candidate_not_enabled",
    accessMode: entry.accessMode,
    targetLabel: `${entry.bucket} -> valore esatto di ${entry.sourceField}`,
    sourceOfTruth: entry.sourceOfTruth,
    constraints: [
      `Path ammesso solo se gia presente nel campo ${entry.sourceField} del documento ${entry.sourceCollection}/${entry.sourceDocId}.`,
      `Operazioni future ammesse: ${entry.allowedOperations.join(", ")}.`,
      `Limite runtime futuro: massimo ${entry.requestLimits.maxObjectReadsPerRequest} oggetto Storage per richiesta.`,
      `Vietati listAll, scansioni prefix e path arbitrari. Prefix fuori boundary: ${entry.forbiddenPrefixes.join(", ")}.`,
      "Traceability obbligatoria su bucket, path richiesto, targa e esito del read-only.",
    ],
  }));
}

function buildServerCredentialDetail(runtimeProbe) {
  if (runtimeProbe.credential.mode === "google_application_credentials") {
    return runtimeProbe.credential.googleApplicationCredentialsExists
      ? "GOOGLE_APPLICATION_CREDENTIALS e presente nel processo e il file puntato esiste."
      : "GOOGLE_APPLICATION_CREDENTIALS e impostata, ma il file puntato non e verificabile nel processo corrente.";
  }

  if (runtimeProbe.credential.mode === "firebase_config") {
    return "FIREBASE_CONFIG e presente nel processo server-side del backend IA separato.";
  }

  if (runtimeProbe.credential.mode === "project_id_only") {
    return "Nel processo corrente esiste solo il project id Google, ma non una credenziale server-side utilizzabile in modo dimostrato.";
  }

  return "Nel processo corrente non risultano GOOGLE_APPLICATION_CREDENTIALS o FIREBASE_CONFIG utili al backend IA separato.";
}

function buildSharedRequirements(args) {
  return [
    {
      id: "backend-internal-ai-package",
      label: "Pacchetto backend/internal-ai dedicato",
      status: args.hasDedicatedBackendPackage ? "present" : "missing",
      detail: args.hasDedicatedBackendPackage
        ? "Esiste un package dedicato per governare dipendenze server-side del backend IA separato."
        : "backend/internal-ai non ha ancora un package dedicato: oggi eredita il runtime root e non governa in modo autonomo il proprio bridge.",
    },
    {
      id: "backend-runtime-dependencies",
      label: "Dipendenze runtime del backend IA dichiarate nel package dedicato",
      status: args.hasRequiredBackendRuntimeDeps ? "present" : "missing",
      detail: args.hasRequiredBackendRuntimeDeps
        ? `Il package dedicato dichiara le dipendenze runtime usate dall'adapter (${REQUIRED_BACKEND_RUNTIME_DEPENDENCIES.join(", ")}).`
        : `Il package dedicato non dichiara ancora tutte le dipendenze runtime usate dall'adapter (${REQUIRED_BACKEND_RUNTIME_DEPENDENCIES.join(", ")}).`,
    },
    {
      id: "firebase-admin-in-backend",
      label: "firebase-admin dichiarato nel backend IA separato",
      status: args.backendPackageHasFirebaseAdmin ? "present" : "legacy_only",
      detail: args.backendPackageHasFirebaseAdmin
        ? "Il backend IA separato dichiara firebase-admin dentro il proprio perimetro governato, senza appoggiarsi ai package legacy."
        : args.legacyFunctionsHasFirebaseAdmin || args.legacySchedeHasFirebaseAdmin
          ? "firebase-admin risulta solo nei package legacy functions/* e functions-schede/*; il backend IA separato non lo governa ancora in modo autonomo."
          : "firebase-admin non risulta neppure nei package legacy letti dal repo.",
    },
    {
      id: "firebase-admin-runtime-resolution",
      label: "firebase-admin risolvibile dal runtime del backend IA",
      status: args.runtimeProbe.modulesReady ? "present" : "missing",
      detail: args.runtimeProbe.modulesReady
        ? "Il runtime del backend IA separato risolve firebase-admin/app, firestore e storage dal proprio perimetro."
        : "Il backend IA dichiara o prepara il package, ma nel processo corrente non risolve ancora firebase-admin dal proprio perimetro eseguibile.",
    },
    {
      id: "server-side-credentials",
      label: "Credenziale server-side dedicata",
      status: args.runtimeProbe.credential.isReady ? "present" : "missing",
      detail: buildServerCredentialDetail(args.runtimeProbe),
    },
    {
      id: "firestore-rules-versioned",
      label: "Policy Firestore versionate e collegate nel repo",
      status: args.hasFirestoreRules && args.firebaseJsonHasFirestoreRules ? "present" : "not_versioned",
      detail:
        args.hasFirestoreRules && args.firebaseJsonHasFirestoreRules
          ? "firestore.rules e presente e referenziato da firebase.json."
          : args.hasFirestoreRules
            ? "firestore.rules esiste, ma firebase.json non lo collega in modo verificabile."
            : "firestore.rules non e presente nel repository e firebase.json non espone alcun riferimento Firestore.",
    },
    {
      id: "storage-rules-versioned",
      label: "Policy Storage versionate e coerenti col bridge IA",
      status: args.storageRulesStatus,
      detail:
        args.storageRulesStatus === "present"
          ? "storage.rules e presente, referenziato da firebase.json e non mostra un blocco totale immediato nel file versionato."
          : args.storageRulesStatus === "conflicting"
            ? "storage.rules e presente, referenziato da firebase.json, ma blocca tutto (`allow read, write: if false`): il boundary deployato resta ambiguo rispetto all'uso legacy."
            : "storage.rules non e presente o non e referenziato da firebase.json.",
    },
  ];
}

export async function buildFirebaseReadinessSnapshot() {
  const [
    backendPackageJson,
    functionsPackageJson,
    functionsSchedePackageJson,
    firebaseJson,
    hasClientFirebaseConfig,
    hasDedicatedBackendPackage,
    hasFirestoreRules,
    storageRulesText,
    runtimeProbe,
  ] = await Promise.all([
    readJsonIfExists("backend/internal-ai/package.json"),
    readJsonIfExists("functions/package.json"),
    readJsonIfExists("functions-schede/package.json"),
    readJsonIfExists("firebase.json"),
    pathExists("src/firebase.ts"),
    pathExists("backend/internal-ai/package.json"),
    pathExists("firestore.rules"),
    readTextIfExists("storage.rules"),
    probeInternalAiFirebaseAdminRuntime(),
  ]);

  const backendPackageHasFirebaseAdmin = hasDependency(backendPackageJson, "firebase-admin");
  const hasRequiredBackendRuntimeDeps = hasAllDependencies(
    backendPackageJson,
    REQUIRED_BACKEND_RUNTIME_DEPENDENCIES,
  );
  const legacyFunctionsHasFirebaseAdmin = hasDependency(functionsPackageJson, "firebase-admin");
  const legacySchedeHasFirebaseAdmin = hasDependency(
    functionsSchedePackageJson,
    "firebase-admin",
  );
  const firebaseJsonHasFirestoreRules =
    firebaseJson?.firestore && typeof firebaseJson.firestore.rules === "string";
  const firebaseJsonHasStorageRules = firebaseJson?.storage?.rules === "storage.rules";
  const storageRulesPresent = typeof storageRulesText === "string";
  const storageRulesDenyAll = Boolean(
    storageRulesText &&
      /allow\s+read\s*,\s*write\s*:\s*if\s*false\s*;/i.test(storageRulesText),
  );
  const storageRulesStatus = !storageRulesPresent || !firebaseJsonHasStorageRules
    ? "not_versioned"
    : storageRulesDenyAll
      ? "conflicting"
      : "present";
  const firestoreHardPrerequisitesReady =
    hasDedicatedBackendPackage &&
    hasRequiredBackendRuntimeDeps &&
    backendPackageHasFirebaseAdmin &&
    runtimeProbe.modulesReady &&
    runtimeProbe.credential.isReady &&
    hasFirestoreRules &&
    firebaseJsonHasFirestoreRules;
  const storageHardPrerequisitesReady =
    hasDedicatedBackendPackage &&
    hasRequiredBackendRuntimeDeps &&
    backendPackageHasFirebaseAdmin &&
    runtimeProbe.modulesReady &&
    runtimeProbe.credential.isReady &&
    storageRulesStatus === "present";

  const sharedRequirements = buildSharedRequirements({
    hasDedicatedBackendPackage,
    hasRequiredBackendRuntimeDeps,
    backendPackageHasFirebaseAdmin,
    legacyFunctionsHasFirebaseAdmin,
    legacySchedeHasFirebaseAdmin,
    hasFirestoreRules,
    firebaseJsonHasFirestoreRules,
    storageRulesStatus,
    runtimeProbe,
  });

  const firestoreCandidateReads = buildFirestoreCandidateReads();
  const storageCandidateReads = buildStorageCandidateReads();

  return {
    firestoreReadOnly: {
      status: firestoreHardPrerequisitesReady ? "partial" : "not_ready",
      evidence: [
        hasClientFirebaseConfig
          ? "Base Firebase client presente in src/firebase.ts con projectId e bucket noti."
          : "Base Firebase client non trovata nel repo.",
        hasRequiredBackendRuntimeDeps
          ? "Il package backend/internal-ai dichiara ora le dipendenze runtime effettive dell'adapter."
          : "Il package backend/internal-ai non dichiara ancora tutte le dipendenze runtime effettive dell'adapter.",
        runtimeProbe.modulesReady
          ? "firebase-admin risulta risolvibile dal runtime del backend IA separato."
          : "firebase-admin non risulta ancora risolvibile dal runtime del backend IA separato.",
        firebaseJsonHasFirestoreRules
          ? "firebase.json collega esplicitamente firestore.rules."
          : "firebase.json non collega alcun file firestore.rules verificabile.",
      ],
      blockers: [
        "Nel backend/internal-ai non esiste ancora un access layer Firebase che legga Firestore in modo realmente dedicato e separato dai runtime legacy.",
        runtimeProbe.modulesReady
          ? null
          : "Il backend IA separato non risolve ancora firebase-admin come dipendenza eseguibile del proprio runtime.",
        runtimeProbe.credential.isReady
          ? null
          : "Nel processo corrente non e dimostrata una credenziale server-side dedicata al backend IA per Firestore read-only.",
        hasFirestoreRules && firebaseJsonHasFirestoreRules
          ? null
          : "firestore.rules non e ancora versionato e collegato in modo verificabile dal repo.",
      ].filter(Boolean),
      nextStep:
        "Aprire un adapter Firebase read-only dedicato in backend/internal-ai solo dopo bootstrap reale di firebase-admin nel suo runtime, credenziale server-side separata e policy Firestore versionate/collegate.",
      candidateReads: firestoreCandidateReads,
    },
    storageReadOnly: {
      status: storageHardPrerequisitesReady ? "partial" : "not_ready",
      evidence: [
        hasClientFirebaseConfig
          ? `Bucket client noto dal repo: ${STORAGE_BUCKET}.`
          : "Bucket client non rilevato nel repo.",
        runtimeProbe.modulesReady
          ? "firebase-admin/storage risulta risolvibile dal runtime del backend IA separato."
          : "firebase-admin/storage non risulta ancora risolvibile dal runtime del backend IA separato.",
        firebaseJsonHasStorageRules
          ? "firebase.json collega storage.rules."
          : "firebase.json non collega storage.rules come boundary verificabile del progetto.",
        storageRulesDenyAll
          ? "Il file storage.rules versionato blocca tutto con allow read, write: if false."
          : "Il file storage.rules versionato non mostra un blocco totale immediato.",
      ],
      blockers: [
        "Nel backend/internal-ai non esiste ancora un access layer Firebase che legga Storage in sola lettura con whitelist esplicita dei path ammessi.",
        runtimeProbe.modulesReady
          ? null
          : "Il backend IA separato non risolve ancora firebase-admin/storage nel proprio runtime.",
        runtimeProbe.credential.isReady
          ? null
          : "Nel processo corrente non e dimostrata una credenziale server-side dedicata al backend IA per Storage read-only.",
        storageRulesStatus === "present"
          ? null
          : "Lo stato versionato di storage.rules resta ambiguo o in conflitto con l'uso legacy: prima del live va chiarito il boundary deployato reale.",
      ].filter(Boolean),
      nextStep:
        "Aprire un bridge Storage read-only solo dopo bootstrap reale del runtime backend IA, credenziale server-side dedicata e chiarimento definitivo delle policy Storage deployate.",
      candidateReads: storageCandidateReads,
    },
    sharedRequirements,
    notes: [
      "Questa readiness descrive solo cio che e verificabile dal repository e dall'ambiente del processo corrente.",
      "Le whitelist candidate restano NON attive: nessuna lettura business Firebase/Storage viene eseguita da questo modulo.",
      "Il backend legacy resta solo fonte di evidenze tecniche e non diventa backend canonico del sottosistema IA interno.",
    ],
  };
}
