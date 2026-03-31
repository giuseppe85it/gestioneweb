import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

const IA_CONFIG_COLLECTION = "@impostazioni_app";
const IA_CONFIG_DOC_ID = "gemini";

export const NEXT_IA_CONFIG_DOMAIN = {
  code: "D11-IA-CONFIG",
  name: "Configurazione IA clone-safe",
  logicalDatasets: [`${IA_CONFIG_COLLECTION}/${IA_CONFIG_DOC_ID}`] as const,
  activeReadOnlyDataset: `${IA_CONFIG_COLLECTION}/${IA_CONFIG_DOC_ID}`,
  normalizationStrategy:
    "LAYER NEXT READ-ONLY IA CONFIG SU @impostazioni_app/gemini",
} as const;

export type NextIaConfigSnapshot = {
  domainCode: typeof NEXT_IA_CONFIG_DOMAIN.code;
  domainName: typeof NEXT_IA_CONFIG_DOMAIN.name;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_IA_CONFIG_DOMAIN.activeReadOnlyDataset;
  normalizationStrategy: typeof NEXT_IA_CONFIG_DOMAIN.normalizationStrategy;
  exists: boolean;
  apiKeyConfigured: boolean;
  apiKey: string;
  limitations: string[];
};

export async function readNextIaConfigSnapshot(): Promise<NextIaConfigSnapshot> {
  const snapshot = await getDoc(doc(db, IA_CONFIG_COLLECTION, IA_CONFIG_DOC_ID));
  const raw = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  const apiKeyRaw = typeof raw?.apiKey === "string" ? raw.apiKey.trim() : "";
  const apiKeyConfigured = apiKeyRaw.length > 0;

  return {
    domainCode: NEXT_IA_CONFIG_DOMAIN.code,
    domainName: NEXT_IA_CONFIG_DOMAIN.name,
    logicalDatasets: NEXT_IA_CONFIG_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_IA_CONFIG_DOMAIN.activeReadOnlyDataset,
    normalizationStrategy: NEXT_IA_CONFIG_DOMAIN.normalizationStrategy,
    exists: snapshot.exists(),
    apiKeyConfigured,
    apiKey: apiKeyRaw,
    limitations: [
      "La pagina NEXT legge la chiave sullo stesso documento Firestore usato dalla madre.",
      "Nel clone il salvataggio della chiave resta bloccato in modo read-only esplicito.",
      "La chiave resta confinata al modulo dedicato e non viene propagata automaticamente in altre UI.",
    ],
  };
}

export async function saveNextIaConfigSnapshot(apiKey: string): Promise<void> {
  const normalized = apiKey.trim();
  if (!normalized) {
    throw new Error("Inserisci una chiave valida prima di salvare.");
  }
  throw new Error(
    "Clone read-only: Salva chiave resta visibile come nella madre, ma non aggiorna Firestore.",
  );
}
