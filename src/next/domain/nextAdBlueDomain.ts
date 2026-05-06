import {
  readNextMagazzinoAdBlueSnapshot,
  type NextMagazzinoAdBlueReadOnlyEvent,
  type NextMagazzinoAdBlueSnapshot,
} from "./nextMaterialiMovimentiDomain";

const CISTERNE_ADBLUE_DATASET_KEY = "@cisterne_adblue" as const;

export const NEXT_ADBLUE_DOMAIN = {
  code: "D15-IA-ADBLUE",
  name: "AdBlue cisterne clone-safe",
  logicalDatasets: [CISTERNE_ADBLUE_DATASET_KEY] as const,
  activeReadOnlyDataset: CISTERNE_ADBLUE_DATASET_KEY,
  normalizationStrategy: "ALIAS READ-ONLY SU readNextMagazzinoAdBlueSnapshot",
} as const;

export type NextAdBlueEvent = NextMagazzinoAdBlueReadOnlyEvent;

export type NextAdBlueSnapshot = Omit<
  NextMagazzinoAdBlueSnapshot,
  "domainCode" | "domainName"
> & {
  domainCode: typeof NEXT_ADBLUE_DOMAIN.code;
  domainName: typeof NEXT_ADBLUE_DOMAIN.name;
  normalizationStrategy: typeof NEXT_ADBLUE_DOMAIN.normalizationStrategy;
  sourceDomainCode: NextMagazzinoAdBlueSnapshot["domainCode"];
  physicalLevelAvailable: false;
  items: NextAdBlueEvent[];
};

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export async function readNextAdBlueSnapshot(): Promise<NextAdBlueSnapshot> {
  const snapshot = await readNextMagazzinoAdBlueSnapshot();

  return {
    ...snapshot,
    domainCode: NEXT_ADBLUE_DOMAIN.code,
    domainName: NEXT_ADBLUE_DOMAIN.name,
    normalizationStrategy: NEXT_ADBLUE_DOMAIN.normalizationStrategy,
    sourceDomainCode: snapshot.domainCode,
    physicalLevelAvailable: false,
    limitations: dedupeStrings([
      ...snapshot.limitations,
      "Il livello fisico della cisterna AdBlue non e persistito nei dati attuali e resta non disponibile.",
    ]),
  };
}
