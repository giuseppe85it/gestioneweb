export type EuromeccBaseStatus = "ok" | "check";

export type EuromeccAreaType = "silo" | "generic";

export type EuromeccComponentStatic = {
  key: string;
  name: string;
  code: string;
  base: EuromeccBaseStatus;
  family?: string;
};

export type EuromeccAreaStatic = {
  key: string;
  title: string;
  shortLabel: string;
  type: EuromeccAreaType;
  code: string;
  area: string;
  description: string;
  base: EuromeccBaseStatus;
  components: readonly EuromeccComponentStatic[];
};

function buildSiloCode(label: string, suffix: string) {
  return `SIL-${label.replace(/[^A-Z0-9]/gi, "").toUpperCase()}-${suffix}`;
}

function makeSilo(label: string, base: EuromeccBaseStatus): EuromeccAreaStatic {
  return {
    key: `silo${label.toLowerCase()}`,
    title: `Silo ${label}`,
    shortLabel: label,
    type: "silo",
    code: `SIL-${label.replace(/[^A-Z0-9]/gi, "").toUpperCase()}`,
    area: "Copertura sili",
    description: `Silo ${label} con filtro, livelli, fluidificanti, scarico, coclea, motore e ingrassaggi.`,
    base,
    components: [
      { key: "filtro", name: "Filtro silo", code: buildSiloCode(label, "FIL"), base },
      { key: "livMax", name: "Livello alto", code: buildSiloCode(label, "LVMAX"), base },
      { key: "livMin", name: "Livello basso", code: buildSiloCode(label, "LVMIN"), base },
      { key: "fluid", name: "Fluidificanti", code: buildSiloCode(label, "FLU"), base },
      { key: "scarico", name: "Scarico / valvola", code: buildSiloCode(label, "SCR"), base },
      { key: "coclea", name: "Coclea linea", code: buildSiloCode(label, "COC"), base },
      { key: "motore", name: "Motore linea", code: buildSiloCode(label, "MOT"), base },
      { key: "ingrasso", name: "Ingrassaggi", code: buildSiloCode(label, "ING"), base },
    ] as const,
  };
}

function makeGenericArea(
  key: string,
  title: string,
  code: string,
  area: string,
  base: EuromeccBaseStatus,
  components: readonly EuromeccComponentStatic[],
): EuromeccAreaStatic {
  return {
    key,
    title,
    shortLabel: title,
    type: "generic",
    code,
    area,
    description: `${title} nell'area ${area}.`,
    base,
    components,
  };
}

const SILO_01 = makeSilo("01", "ok");
const SILO_02A = makeSilo("02A", "ok");
const SILO_02B = makeSilo("02B", "ok");
const SILO_03 = makeSilo("03", "ok");
const SILO_04 = makeSilo("04", "ok");
const SILO_05 = makeSilo("05", "ok");
const SILO_06A = makeSilo("06A", "ok");
const SILO_06B = makeSilo("06B", "ok");
const SILO_07 = makeSilo("07", "ok");

export const EUROMECC_AREAS: Record<string, EuromeccAreaStatic> = {
  silo1: { ...SILO_01, key: "silo1" },
  silo2a: { ...SILO_02A, key: "silo2a" },
  silo2b: { ...SILO_02B, key: "silo2b" },
  silo3: { ...SILO_03, key: "silo3" },
  silo4: { ...SILO_04, key: "silo4" },
  silo5: { ...SILO_05, key: "silo5" },
  silo6a: { ...SILO_06A, key: "silo6a" },
  silo6b: { ...SILO_06B, key: "silo6b" },
  silo7: { ...SILO_07, key: "silo7" },
  filtriSilo: makeGenericArea(
    "filtriSilo",
    "Filtri silo",
    "FIL-SIL",
    "Copertura sili",
    "ok",
    [{ key: "set", name: "Set filtri silo", code: "FIL-SIL-SET", base: "ok", family: "filtri" }],
  ),
  lineeSilo: makeGenericArea(
    "lineeSilo",
    "Linee scarico silo",
    "LIN-SIL",
    "Trasporto materiale",
    "ok",
    [
      { key: "coclee", name: "Coclee", code: "LIN-SIL-COC", base: "ok", family: "trasporto" },
      { key: "motori", name: "Motori", code: "LIN-SIL-MOT", base: "ok", family: "trasporto" },
      { key: "ingrassi", name: "Ingrassi", code: "LIN-SIL-ING", base: "ok", family: "trasporto" },
    ] as const,
  ),
  carico1: makeGenericArea(
    "carico1",
    "Carico camion 1",
    "CAR-CAM-01",
    "Area spedizione",
    "ok",
    [
      { key: "proboscide", name: "Proboscide", code: "CAR-CAM-01-PRO", base: "ok", family: "carico" },
      { key: "filtro", name: "Filtro", code: "CAR-CAM-01-FIL", base: "ok", family: "carico" },
      { key: "sensori", name: "Sensori", code: "CAR-CAM-01-SEN", base: "ok", family: "carico" },
    ] as const,
  ),
  carico2: makeGenericArea(
    "carico2",
    "Carico camion 2",
    "CAR-CAM-02",
    "Area spedizione",
    "ok",
    [
      { key: "proboscide", name: "Proboscide", code: "CAR-CAM-02-PRO", base: "ok", family: "carico" },
      { key: "filtro", name: "Filtro", code: "CAR-CAM-02-FIL", base: "ok", family: "carico" },
      { key: "sensori", name: "Sensori", code: "CAR-CAM-02-SEN", base: "ok", family: "carico" },
    ] as const,
  ),
  caricoRail: makeGenericArea(
    "caricoRail",
    "Carico ferrovia",
    "CAR-RAIL-01",
    "Area ferrovia",
    "ok",
    [
      { key: "proboscide", name: "Proboscide", code: "CAR-RAIL-01-PRO", base: "ok", family: "carico" },
      { key: "filtro", name: "Filtro", code: "CAR-RAIL-01-FIL", base: "ok", family: "carico" },
      { key: "pesatura", name: "Pesatura", code: "CAR-RAIL-01-PES", base: "ok", family: "carico" },
    ] as const,
  ),
  filtriCarico: makeGenericArea(
    "filtriCarico",
    "Filtri punti di carico",
    "FIL-CAR",
    "Aree carico",
    "ok",
    [{ key: "set", name: "Set filtri carico", code: "FIL-CAR-SET", base: "ok", family: "filtri" }],
  ),
  compressore: makeGenericArea(
    "compressore",
    "Compressore / blower",
    "CMP-01",
    "Servizi impianto",
    "ok",
    [
      { key: "blower", name: "Blower", code: "CMP-01-BLO", base: "ok", family: "servizi" },
      { key: "filtroAria", name: "Filtro aria", code: "CMP-01-FIL", base: "ok", family: "servizi" },
      { key: "lubrificazione", name: "Lubrificazione", code: "CMP-01-LUB", base: "ok", family: "servizi" },
    ] as const,
  ),
  fluidificanti: makeGenericArea(
    "fluidificanti",
    "Fluidificanti",
    "FLU-SIL",
    "Sili / linea aria",
    "ok",
    [{ key: "set", name: "Set fluidificanti", code: "FLU-SIL-SET", base: "ok", family: "aria" }],
  ),
  plc: makeGenericArea(
    "plc",
    "Quadro / PLC / HMI",
    "PLC-01",
    "Automazione",
    "ok",
    [
      { key: "plc", name: "Quadro / PLC", code: "PLC-01-PLC", base: "ok", family: "automazione" },
      { key: "hmi", name: "Touchscreen / HMI", code: "PLC-01-HMI", base: "ok", family: "automazione" },
    ] as const,
  ),
  buffer: makeGenericArea(
    "buffer",
    "Buffer silo / pesatura",
    "BUF-RAIL-01",
    "Area ferrovia",
    "ok",
    [
      { key: "buffer", name: "Buffer silo", code: "BUF-RAIL-01-BUF", base: "ok", family: "buffer" },
      { key: "celle", name: "Celle di carico", code: "BUF-RAIL-01-CEL", base: "ok", family: "buffer" },
    ] as const,
  ),
};

export const EUROMECC_AREA_KEYS = Object.keys(EUROMECC_AREAS);

export function getEuromeccArea(areaKey: string): EuromeccAreaStatic | null {
  return EUROMECC_AREAS[areaKey] ?? null;
}

export function getEuromeccAreaLabel(areaKey: string): string {
  return EUROMECC_AREAS[areaKey]?.title ?? areaKey;
}
