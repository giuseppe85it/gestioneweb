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
      "Il clone verifica solo la presenza della chiave API, senza esporre il valore sensibile nella UI.",
      "La configurazione resta read-only nel clone: nessun salvataggio o aggiornamento viene riattivato qui.",
    ],
  };
}
