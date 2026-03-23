import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const STORAGE_BUCKET = "gestionemanutenzione-934ef.firebasestorage.app";

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

function hasServerCredentialEnv() {
  return Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() ||
      process.env.FIREBASE_CONFIG?.trim() ||
      process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
      process.env.GCLOUD_PROJECT?.trim(),
  );
}

function buildFirestoreCandidateReads() {
  return [
    {
      id: "firestore-storage-mezzi-aziendali-doc",
      label: "Documento mezzo-centrico minimo",
      service: "firestore",
      status: "candidate_not_enabled",
      accessMode: "exact_document",
      targetLabel: "storage/@mezzi_aziendali",
      sourceOfTruth:
        "Perimetro D01 gia usato dal clone e dal retrieval seedato del backend IA per libretto/report mezzo.",
      constraints: [
        "Solo lettura del documento esatto, nessuna scansione libera della collection storage.",
        "Campi utilizzabili limitati al contesto mezzo gia riusato dalla IA interna read-only.",
        "Nessuna scrittura, merge o normalizzazione business nel runtime legacy.",
      ],
    },
  ];
}

function buildStorageCandidateReads() {
  return [
    {
      id: "storage-libretto-path-from-mezzo",
      label: "Oggetto libretto puntato dal mezzo",
      service: "storage",
      status: "candidate_not_enabled",
      accessMode: "exact_object_path_from_firestore_field",
      targetLabel: `${STORAGE_BUCKET} -> valore esatto di librettoStoragePath`,
      sourceOfTruth:
        "Solo path ricavato da un mezzo gia whitelisted in storage/@mezzi_aziendali, senza listing del bucket.",
      constraints: [
        "Nessun listAll, nessuna scansione per prefisso, nessun download arbitrario.",
        "Path ammesso solo se gia presente nel record mezzo clone-safe autorizzato.",
        "Nessun upload, delete o scrittura di metadati Storage business.",
      ],
    },
  ];
}

function buildSharedRequirements(args) {
  return [
    {
      id: "backend-internal-ai-package",
      label: "Pacchetto backend/internal-ai dedicato",
      status: args.hasDedicatedBackendPackage ? "present" : "missing",
      detail: args.hasDedicatedBackendPackage
        ? "Esiste un package dedicato per governare dipendenze server-side del backend IA separato."
        : "backend/internal-ai non ha ancora un package dedicato: oggi eredita il runtime root e non governa in modo autonomo firebase-admin.",
    },
    {
      id: "firebase-admin-in-backend",
      label: "firebase-admin disponibile nel backend IA separato",
      status: args.rootHasFirebaseAdmin || args.backendPackageHasFirebaseAdmin
        ? "present"
        : "legacy_only",
      detail:
        args.rootHasFirebaseAdmin || args.backendPackageHasFirebaseAdmin
          ? "Il backend IA separato dichiara firebase-admin dentro il proprio perimetro governato, senza appoggiarsi solo ai package legacy."
          : args.hasDedicatedBackendPackage
            ? "Esiste un package dedicato per il backend IA separato, ma firebase-admin risulta ancora solo nei package legacy functions/* e functions-schede/*."
            : "firebase-admin risulta solo nei package legacy functions/* e functions-schede/*; il backend IA separato non lo governa ancora in modo autonomo.",
    },
    {
      id: "server-side-credentials",
      label: "Credenziale server-side dedicata",
      status: args.hasDedicatedServerCredentials ? "present" : "missing",
      detail: args.hasDedicatedServerCredentials
        ? "Nel processo corrente sono presenti variabili server-side per credenziale o identita progetto."
        : "Nel processo corrente non risultano GOOGLE_APPLICATION_CREDENTIALS, FIREBASE_CONFIG, GOOGLE_CLOUD_PROJECT o GCLOUD_PROJECT utili al backend IA separato.",
    },
    {
      id: "firestore-rules-versioned",
      label: "Policy Firestore versionate nel repo",
      status: args.hasFirestoreRules ? "present" : "not_versioned",
      detail: args.hasFirestoreRules
        ? "firestore.rules e presente nel repository e puo essere verificato insieme al bridge read-only."
        : "firestore.rules non e presente nel repository: non e possibile verificare da codice versionato il perimetro Firestore read-only.",
    },
    {
      id: "storage-rules-versioned",
      label: "Policy Storage versionate nel repo",
      status: args.storageRulesStatus,
      detail:
        args.storageRulesStatus === "present"
          ? "storage.rules e presente e non mostra un blocco totale immediato nel file versionato."
          : args.storageRulesStatus === "conflicting"
            ? "storage.rules e presente ma blocca tutto (`allow read, write: if false`) mentre il legacy usa upload/download/delete: serve chiarire lo stato deployato reale."
            : "storage.rules non e presente nel repository.",
    },
  ];
}

export async function buildFirebaseReadinessSnapshot() {
  const [
    rootPackageJson,
    backendPackageJson,
    functionsPackageJson,
    functionsSchedePackageJson,
    hasClientFirebaseConfig,
    hasDedicatedBackendPackage,
    hasFirestoreRules,
    storageRulesText,
  ] = await Promise.all([
    readJsonIfExists("package.json"),
    readJsonIfExists("backend/internal-ai/package.json"),
    readJsonIfExists("functions/package.json"),
    readJsonIfExists("functions-schede/package.json"),
    pathExists("src/firebase.ts"),
    pathExists("backend/internal-ai/package.json"),
    pathExists("firestore.rules"),
    readTextIfExists("storage.rules"),
  ]);

  const rootHasFirebaseAdmin = hasDependency(rootPackageJson, "firebase-admin");
  const backendPackageHasFirebaseAdmin = hasDependency(backendPackageJson, "firebase-admin");
  const legacyFunctionsHasFirebaseAdmin = hasDependency(functionsPackageJson, "firebase-admin");
  const legacySchedeHasFirebaseAdmin = hasDependency(
    functionsSchedePackageJson,
    "firebase-admin",
  );
  const hasDedicatedServerCredentials = hasServerCredentialEnv();
  const storageRulesPresent = typeof storageRulesText === "string";
  const storageRulesDenyAll = Boolean(
    storageRulesText &&
      /allow\s+read\s*,\s*write\s*:\s*if\s*false\s*;/i.test(storageRulesText),
  );
  const storageRulesStatus = !storageRulesPresent
    ? "not_versioned"
    : storageRulesDenyAll
      ? "conflicting"
      : "present";

  const sharedRequirements = buildSharedRequirements({
    hasDedicatedBackendPackage,
    rootHasFirebaseAdmin,
    backendPackageHasFirebaseAdmin,
    hasDedicatedServerCredentials,
    hasFirestoreRules,
    storageRulesStatus,
  });

  const firestoreCandidateReads = buildFirestoreCandidateReads();
  const storageCandidateReads = buildStorageCandidateReads();
  const hasAnyLegacyAdmin = legacyFunctionsHasFirebaseAdmin || legacySchedeHasFirebaseAdmin;

  return {
    firestoreReadOnly: {
      status: hasClientFirebaseConfig || hasAnyLegacyAdmin ? "partial" : "not_ready",
      evidence: [
        hasClientFirebaseConfig
          ? "Base Firebase client presente in src/firebase.ts con projectId e bucket noti."
          : "Base Firebase client non trovata nel repo.",
        rootHasFirebaseAdmin || backendPackageHasFirebaseAdmin
          ? rootHasFirebaseAdmin
            ? "Il runtime root del backend IA separato dichiara gia firebase-admin."
            : "Il package dedicato backend/internal-ai dichiara gia firebase-admin, ma il bridge live non e ancora aperto."
          : "Il backend IA separato non dichiara ancora firebase-admin nel proprio perimetro.",
        legacyFunctionsHasFirebaseAdmin
          ? "functions/package.json dichiara firebase-admin nel runtime legacy."
          : "functions/package.json non dimostra firebase-admin.",
        legacySchedeHasFirebaseAdmin
          ? "functions-schede/package.json dichiara firebase-admin nel runtime schede legacy."
          : "functions-schede/package.json non dimostra firebase-admin.",
      ],
      blockers: [
        "Nel backend/internal-ai non esiste ancora un access layer Firebase che legga Firestore in modo realmente dedicato e separato dai runtime legacy.",
        rootHasFirebaseAdmin || backendPackageHasFirebaseAdmin
          ? null
          : "Il backend IA separato non governa ancora firebase-admin come dipendenza propria del runtime root.",
        hasDedicatedServerCredentials
          ? null
          : "Nel processo corrente non e dimostrata una credenziale server-side dedicata al backend IA per Firestore read-only.",
        hasFirestoreRules
          ? null
          : "firestore.rules non e presente nel repository: le policy Firestore effettive non sono verificabili da codice versionato.",
      ].filter(Boolean),
      nextStep:
        "Creare un adapter Firebase read-only dedicato in backend/internal-ai, con firebase-admin governato dal suo package, credenziale server-side separata e whitelist esplicita di documenti/query ammesse.",
      candidateReads: firestoreCandidateReads,
    },
    storageReadOnly: {
      status: hasClientFirebaseConfig || storageRulesPresent ? "partial" : "not_ready",
      evidence: [
        hasClientFirebaseConfig
          ? `Bucket client noto dal repo: ${STORAGE_BUCKET}.`
          : "Bucket client non rilevato nel repo.",
        storageRulesPresent
          ? "storage.rules e presente nel repository."
          : "storage.rules non e presente nel repository.",
        storageRulesDenyAll
          ? "Il file storage.rules versionato blocca tutto con allow read, write: if false."
          : "Il file storage.rules versionato non mostra un blocco totale immediato.",
      ],
      blockers: [
        "Nel backend/internal-ai non esiste ancora un access layer Firebase che legga Storage in sola lettura con whitelist esplicita dei path ammessi.",
        hasDedicatedServerCredentials
          ? null
          : "Nel processo corrente non e dimostrata una credenziale server-side dedicata al backend IA per Storage read-only.",
        storageRulesDenyAll
          ? "Lo stato versionato di storage.rules e in conflitto con l'uso legacy di upload/download/delete: serve chiarire quali policy siano davvero deployate prima di aprire letture server-side IA."
          : null,
      ].filter(Boolean),
      nextStep:
        "Aprire un bridge Storage read-only limitato a path esatti derivati da record gia whitelisted, senza listAll, senza prefix scan e con policy/versionamento chiariti.",
      candidateReads: storageCandidateReads,
    },
    sharedRequirements,
    notes: [
      "Questa readiness descrive solo cio che e verificabile dal repository e dall'ambiente del processo corrente.",
      "Le whitelist candidate sono perimetri proposti ma NON ancora attivi: nessuna lettura business Firebase/Storage viene eseguita da questo modulo.",
      "Il backend legacy resta solo fonte di evidenze tecniche e non diventa backend canonico del sottosistema IA interno.",
    ],
  };
}
