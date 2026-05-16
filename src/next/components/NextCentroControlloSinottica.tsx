import { useMemo, useState, type MouseEvent as ReactMouseEvent } from "react";
import type {
  Anomaly,
  AnomalyType,
  RefuelRow,
  RefuelSeedIndex,
} from "../types/centroControlloTypes";
import { detectRefuelAnomalies } from "../NextCentroControlloParityPage";
import type { ActiveSession, HomeEvent } from "../../utils/homeEvents";
import { classifyMezzoCategoria } from "../domain/nextCentroControlloDomain";
import { toDisplay } from "../helpers/dateUnica";
import "./sinottica-flotta-v2-design-tokens.css";

type MaintenanceStatus = "SCADUTA" | "IN_SCADENZA" | "OK" | "SENZA_DATA";

export type SinotticaMezzoItem = {
  id: string;
  targa: string;
  categoria: string;
  tipo: "motrice" | "cisterna" | null;
  marca: string;
  modello: string;
  autistaNome: string | null;
  manutenzioneDataFineTimestamp: number | null;
  manutenzioneDataFine: string;
  manutenzioneContrattoAttivo: boolean;
  fotoUrl: string | null;
  dataScadenzaRevisioneTimestamp: number | null;
  dataUltimoCollaudoTimestamp: number | null;
};

export type SinotticaManutenzioneRecord = {
  id: string;
  targa: string;
  data: string;
  descrizione: string;
  gommeInterventoTipo?: "ordinario" | "straordinario" | null;
  gommeStraordinario?: {
    asseId: string | null;
    motivo: string | null;
  } | null;
};

export type SinotticaManutenzioneDaFareRow = {
  id: string;
  targa: string | null;
  urgenza: "alta" | "media" | "bassa" | null;
  eseguito: boolean;
};

export type SinotticaSegnalazioneRow = {
  id: string;
  targa: string;
  tipo: string;
  isNuova: boolean;
  ts: number;
  autistaNome: string | null;
  badgeAutista: string | null;
  descrizione: string;
  stato: string;
};

export type SinotticaControlloRow = {
  id: string;
  targa: string;
  isKo: boolean;
  ts: number;
  autistaNome: string | null;
  badgeAutista: string | null;
  koList: string[];
  note: string;
  targaMotrice: string;
  targaRimorchio: string;
};

export type SinotticaRichiestaRow = {
  id: string;
  targa: string;
  isNuova: boolean;
  ts: number;
  autistaNome: string | null;
  badgeAutista: string | null;
  attrezzatura: string;
  quantita: string;
  stato: string;
  note: string;
};

type Props = {
  mezzi: SinotticaMezzoItem[];
  refuelRows: RefuelRow[];
  refuelSeedIndex: RefuelSeedIndex;
  manutenzioniStorico: SinotticaManutenzioneRecord[];
  manutenzioniDaFare: SinotticaManutenzioneDaFareRow[];
  segnalazioniAperte: SinotticaSegnalazioneRow[];
  controlliKo: SinotticaControlloRow[];
  richiesteAperte: SinotticaRichiestaRow[];
  activeSessions: ActiveSession[];
  onTargaClick: (targa: string) => void;
  onAnomalieClick: (targa: string) => void;
  onGommeClick: (targa: string) => void;
  onDocumentiClick: (targa: string) => void;
  onConsumoClick: (targa: string) => void;
  onContrattoClick: (targa: string) => void;
  onFotoClick: (targa: string) => void;
  onFotoDelete: (targa: string) => void;
  onManutenzioneClick: (recordId: string) => void;
  onEventoChipClick: (event: HomeEvent) => void;
  onChipListOpen: (
    anchorRect: DOMRect,
    kind: "manutenzione" | "segnalazione" | "controllo" | "richiesta",
    targa: string,
    ids: string[],
    tipoSegnalazione?: "freni" | "gomme" | "elettrico" | "altro",
  ) => void;
};

type TabKey = "motrici" | "rimorchi";

type KpiFilterKey =
  | "manut-scadute"
  | "scadenza-30"
  | "manutenzioni-urgenti"
  | "anomalie-rifor";

type SegnaleChip =
  | { kind: "manutenzione"; total: number; urgenti: number; ids: string[] }
  | {
      kind: "segn-tipo";
      tipo: "freni" | "gomme" | "elettrico" | "altro";
      count: number;
      severita: "urg" | "warn";
      ids: string[];
    }
  | { kind: "controllo-ko"; count: number; ids: string[] }
  | { kind: "richieste"; count: number; ids: string[] };

type RowKind = "motrice" | "rimorchio";

type SinotticaRow = {
  targa: string;
  categoria: string;
  rowKind: RowKind;
  iconKind: "trattore" | "cisterna" | "rimorchio";
  fotoUrl: string | null;
  autistaDefault: string | null;
  liveSession: ActiveSession | null;
  contrattoStatus: MaintenanceStatus;
  contrattoDataFine: number | null;
  contrattoDays: number | null;
  contrattoAttivo: boolean;
  collaudoStatus: MaintenanceStatus;
  collaudoTs: number | null;
  docsCollapsed: boolean;
  docsCollapsedNextTs: number | null;
  consumoKmL30g: number | null;
  deltaFlotta: number | null;
  anomalieCount: number;
  anomalieIsBad: boolean;
  kmTotali: number | null;
  kmDataTs: number | null;
  gommeUltimoTs: number | null;
  gommeAxleProblema: { asseId: string; severity: "warn" | "bad" } | null;
  segnali: SegnaleChip[];
  hasUrgentSignals: boolean;
  hasWarning: boolean;
  hasCritical: boolean;
  isInViaggio: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function evaluateMaintenanceStatusInline(
  ts: number | null,
  today: Date,
): { status: MaintenanceStatus; daysToDeadline: number | null } {
  if (ts === null) return { status: "SENZA_DATA", daysToDeadline: null };
  const target = new Date(ts);
  if (Number.isNaN(target.getTime())) {
    return { status: "SENZA_DATA", daysToDeadline: null };
  }
  const days = Math.floor(
    (startOfDay(target).getTime() - startOfDay(today).getTime()) / DAY_MS,
  );
  if (days < 0) return { status: "SCADUTA", daysToDeadline: days };
  if (days <= 30) return { status: "IN_SCADENZA", daysToDeadline: days };
  return { status: "OK", daysToDeadline: days };
}

function parseDateFlexible(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) return direct;
  const m = trimmed.match(
    /^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2}))?$/,
  );
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]) - 1;
  const yearRaw = Number(m[3]);
  const year = m[3].length === 2 ? 2000 + yearRaw : yearRaw;
  const hh = Number(m[4] ?? "12");
  const mm = Number(m[5] ?? "00");
  const d = new Date(year, month, day, hh, mm, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
}

function deriveIconKind(
  categoria: string,
): "trattore" | "cisterna" | "rimorchio" {
  const cat: string = (categoria ?? "").toLowerCase();
  if (cat.includes("cisterna")) return "cisterna";
  if (classifyMezzoCategoria(categoria) === "rimorchio") return "rimorchio";
  return "trattore";
}

function deriveRowKind(categoria: string | null | undefined): RowKind {
  return classifyMezzoCategoria(categoria) === "motorizzato"
    ? "motrice"
    : "rimorchio";
}

function formatDateIt(ts: number | null): string {
  if (ts === null) return "---";
  return toDisplay(ts) || "---";
}

function formatMonthYearIt(ts: number | null): string {
  if (ts === null) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}.${yyyy}`;
}

function formatHM(ts: number | null): string {
  if (ts === null) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatKmIt(value: number | null): string {
  if (value === null) return "—";
  return Math.round(value).toLocaleString("it-IT");
}

function formatKmLIt(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(2).replace(".", ",");
}

function formatDeltaKmL(value: number | null): {
  text: string;
  cls: "pos" | "neg" | "zero";
} {
  if (value === null) return { text: "—", cls: "zero" };
  if (value > 0.005) {
    return { text: `▲ ${value.toFixed(2).replace(".", ",")}`, cls: "pos" };
  }
  if (value < -0.005) {
    return {
      text: `▼ ${Math.abs(value).toFixed(2).replace(".", ",")}`,
      cls: "neg",
    };
  }
  return { text: "≈ 0", cls: "zero" };
}

function deriveGommeAxleProblema(
  gommeForTarga: SinotticaManutenzioneRecord[],
): string | null {
  const sortedDesc: SinotticaManutenzioneRecord[] = [...gommeForTarga].sort(
    (a: SinotticaManutenzioneRecord, b: SinotticaManutenzioneRecord) => {
      const tsA: number = parseDateFlexible(a.data)?.getTime() ?? 0;
      const tsB: number = parseDateFlexible(b.data)?.getTime() ?? 0;
      return tsB - tsA;
    },
  );
  for (const record of sortedDesc) {
    if (
      record.gommeInterventoTipo === "straordinario" &&
      record.gommeStraordinario?.asseId
    ) {
      return record.gommeStraordinario.asseId;
    }
  }
  return null;
}

function formatAxleLabel(asseId: string): string {
  const normalized: string = asseId.trim().toLowerCase();
  if (normalized === "anteriore") return "anteriore";
  if (normalized === "posteriore") return "posteriore";
  const match: RegExpMatchArray | null = normalized.match(/^asse(\d+)$/);
  if (match) return match[1];
  return asseId;
}

function deriveSegnTipo(
  tipo: string,
): "freni" | "gomme" | "elettrico" | "altro" {
  const t = tipo.toLowerCase();
  if (t.includes("fren")) return "freni";
  if (t.includes("gomm")) return "gomme";
  if (t.includes("elett")) return "elettrico";
  return "altro";
}

function tipoChipLabel(t: "freni" | "gomme" | "elettrico" | "altro"): string {
  switch (t) {
    case "freni":
      return "Segn. freni";
    case "gomme":
      return "Segn. gomme";
    case "elettrico":
      return "Segn. elettrico";
    default:
      return "Segn. altro";
  }
}

function isCambioGommeDescription(descrizione: string): boolean {
  if (!descrizione) return false;
  const d = descrizione.toUpperCase();
  return (
    d.includes("CAMBIO GOMME") ||
    d.includes("GOMME") ||
    d.includes("PNEUM")
  );
}

const BAD_ANOMALY_TYPES: ReadonlySet<AnomalyType> = new Set<AnomalyType>([
  "KM_TORNANO_INDIETRO",
  "KM_INVALIDI",
  "KM_SALTO_TROPPO_GRANDE",
]);

function isBadAnomaly(anomaly: Anomaly): boolean {
  return BAD_ANOMALY_TYPES.has(anomaly.type);
}

function VeicoloIcon({ kind }: { kind: "trattore" | "cisterna" | "rimorchio" }) {
  if (kind === "cisterna") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <ellipse cx="9" cy="13" rx="7" ry="4" />
        <rect x="14" y="11" width="6" height="4" rx="0.5" />
        <circle cx="6.5" cy="18.5" r="2" />
        <circle cx="17.5" cy="18.5" r="2" />
      </svg>
    );
  }
  if (kind === "rimorchio") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="8" width="17" height="8" rx="0.5" />
        <circle cx="8" cy="18.5" r="1.7" />
        <circle cx="16" cy="18.5" r="1.7" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="9" width="11" height="8" rx="1" />
      <path d="M13 11h4l3 3v3h-7" />
      <circle cx="6.5" cy="18.5" r="2" />
      <circle cx="17.5" cy="18.5" r="2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="icn"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function buildSegnalazioneEvent(row: SinotticaSegnalazioneRow): HomeEvent {
  return {
    id: row.id,
    tipo: "segnalazione",
    targa: row.targa,
    autista: row.autistaNome,
    timestamp: row.ts,
    payload: {
      tipo: row.tipo,
      tipoProblema: row.tipo,
      descrizione: row.descrizione,
      stato: row.stato,
      autistaNome: row.autistaNome,
      badgeAutista: row.badgeAutista,
      targa: row.targa,
    },
  };
}

function buildControlloEvent(row: SinotticaControlloRow): HomeEvent {
  return {
    id: row.id,
    tipo: "controllo",
    targa: row.targa,
    autista: row.autistaNome,
    timestamp: row.ts,
    payload: {
      koList: row.koList,
      anomalie: row.koList,
      esito: row.isKo ? "KO" : "OK",
      stato: row.isKo ? "KO" : "OK",
      note: row.note,
      autistaNome: row.autistaNome,
      badgeAutista: row.badgeAutista,
      targaMotrice: row.targaMotrice,
      targaRimorchio: row.targaRimorchio,
    },
  };
}

function buildRichiestaEvent(row: SinotticaRichiestaRow): HomeEvent {
  return {
    id: row.id,
    tipo: "richiesta_attrezzature",
    targa: row.targa,
    autista: row.autistaNome,
    timestamp: row.ts,
    payload: {
      attrezzatura: row.attrezzatura,
      descrizione: row.attrezzatura,
      quantita: row.quantita,
      stato: row.stato,
      note: row.note,
      autistaNome: row.autistaNome,
      badgeAutista: row.badgeAutista,
      targa: row.targa,
    },
  };
}

export default function NextCentroControlloSinottica({
  mezzi,
  refuelRows,
  refuelSeedIndex,
  manutenzioniStorico,
  manutenzioniDaFare,
  segnalazioniAperte,
  controlliKo,
  richiesteAperte,
  activeSessions,
  onTargaClick,
  onAnomalieClick,
  onGommeClick,
  onDocumentiClick,
  onConsumoClick,
  onContrattoClick,
  onFotoClick,
  onFotoDelete,
  onManutenzioneClick,
  onEventoChipClick,
  onChipListOpen,
}: Props) {
  const today = useMemo(() => new Date(), []);
  const [activeTab, setActiveTab] = useState<TabKey>("motrici");
  const [searchText, setSearchText] = useState("");
  const [activeKpiFilters, setActiveKpiFilters] = useState<Set<KpiFilterKey>>(
    () => new Set<KpiFilterKey>(),
  );

  const sessionsByTarga = useMemo(() => {
    const map = new Map<string, ActiveSession>();
    for (const s of activeSessions) {
      if (s.targaMotrice) {
        map.set(s.targaMotrice.toUpperCase(), s);
      }
      if (s.targaRimorchio) {
        map.set(s.targaRimorchio.toUpperCase(), s);
      }
    }
    return map;
  }, [activeSessions]);

  const segnalazioniByTarga = useMemo(() => {
    const map = new Map<string, SinotticaSegnalazioneRow[]>();
    for (const r of segnalazioniAperte) {
      const t = r.targa.toUpperCase();
      if (!map.has(t)) map.set(t, []);
      map.get(t)!.push(r);
    }
    return map;
  }, [segnalazioniAperte]);

  const controlliByTarga = useMemo(() => {
    const map = new Map<string, SinotticaControlloRow[]>();
    for (const r of controlliKo) {
      const t = r.targa.toUpperCase();
      if (!map.has(t)) map.set(t, []);
      map.get(t)!.push(r);
    }
    return map;
  }, [controlliKo]);

  const richiesteByTarga = useMemo(() => {
    const map = new Map<string, SinotticaRichiestaRow[]>();
    for (const r of richiesteAperte) {
      const t = r.targa.toUpperCase();
      if (!map.has(t)) map.set(t, []);
      map.get(t)!.push(r);
    }
    return map;
  }, [richiesteAperte]);

  const manutenzioniDaFareByTarga = useMemo(() => {
    const map = new Map<string, SinotticaManutenzioneDaFareRow[]>();
    for (const r of manutenzioniDaFare) {
      if (!r.targa) continue;
      const t = r.targa.toUpperCase();
      if (!map.has(t)) map.set(t, []);
      map.get(t)!.push(r);
    }
    return map;
  }, [manutenzioniDaFare]);

  const refuelByTarga = useMemo(() => {
    const map = new Map<string, RefuelRow[]>();
    for (const r of refuelRows) {
      const t = (r.targa || "").toUpperCase();
      if (!t) continue;
      if (!map.has(t)) map.set(t, []);
      map.get(t)!.push(r);
    }
    return map;
  }, [refuelRows]);

  const manutByTarga = useMemo(() => {
    const map = new Map<string, SinotticaManutenzioneRecord[]>();
    for (const m of manutenzioniStorico) {
      const t = m.targa.toUpperCase();
      if (!map.has(t)) map.set(t, []);
      map.get(t)!.push(m);
    }
    return map;
  }, [manutenzioniStorico]);

  const flotta30gAvg = useMemo((): number | null => {
    const cutoff: number = today.getTime() - 30 * DAY_MS;
    let totalKm = 0;
    let totalLitri = 0;
    for (const r of refuelRows as RefuelRow[]) {
      if ((r.dateObj?.getTime() ?? 0) < cutoff) continue;
      const seed: RefuelRow | null = refuelSeedIndex.findSeed(r);
      if (!seed) continue;
      if (typeof r.km !== "number" || r.km <= 0) continue;
      if (typeof seed.km !== "number" || seed.km <= 0) continue;
      if (typeof r.litri !== "number" || r.litri <= 0) continue;
      if (r.km <= seed.km) continue;
      const delta: number = r.km - seed.km;
      if (!Number.isFinite(delta) || delta <= 0) continue;
      totalKm += delta;
      totalLitri += r.litri;
    }
    if (totalLitri <= 0) return null;
    return totalKm / totalLitri;
  }, [refuelRows, refuelSeedIndex, today]);

  const rows: SinotticaRow[] = useMemo(() => {
    const cutoff = today.getTime() - 30 * DAY_MS;

    const result: SinotticaRow[] = mezzi.map((m): SinotticaRow => {
      const targaUp = m.targa.toUpperCase();
      const iconKind = deriveIconKind(m.categoria);
      const rowKind = deriveRowKind(m.categoria);

      const contrattoTs: number | null = (() => {
        if (m.manutenzioneDataFineTimestamp !== null) {
          return m.manutenzioneDataFineTimestamp;
        }
        const reparsed: Date | null = parseDateFlexible(m.manutenzioneDataFine);
        return reparsed ? reparsed.getTime() : null;
      })();
      const cEval = evaluateMaintenanceStatusInline(contrattoTs, today);

      const colEval = evaluateMaintenanceStatusInline(
        m.dataUltimoCollaudoTimestamp,
        today,
      );
      const docsCollaudoFar: boolean =
        colEval.status === "OK" && (colEval.daysToDeadline ?? 0) > 60;

      const liveSession = sessionsByTarga.get(targaUp) ?? null;
      const isInViaggio = liveSession !== null;

      const list: RefuelRow[] = refuelByTarga.get(targaUp) ?? [];
      let kmSum = 0;
      let litriSum = 0;
      let anomalieCount = 0;
      let anomalieIsBad = false;
      for (const r of list) {
        const seed: RefuelRow | null = refuelSeedIndex.findSeed(r);
        const inWindow: boolean = (r.dateObj?.getTime() ?? 0) >= cutoff;
        if (inWindow) {
          if (
            seed &&
            typeof r.km === "number" && r.km > 0 &&
            typeof seed.km === "number" && seed.km > 0 &&
            r.km > seed.km &&
            typeof r.litri === "number" && r.litri > 0
          ) {
            const delta: number = r.km - seed.km;
            if (Number.isFinite(delta) && delta > 0) {
              kmSum += delta;
              litriSum += r.litri;
            }
          }
          const anomalies: Anomaly[] = detectRefuelAnomalies(r, seed);
          if (anomalies.length > 0) {
            anomalieCount += 1;
            if (anomalies.some(isBadAnomaly)) anomalieIsBad = true;
          }
        }
      }
      const kmL30: number | null = litriSum > 0 ? kmSum / litriSum : null;
      const delta: number | null =
        kmL30 !== null && flotta30gAvg !== null ? kmL30 - flotta30gAvg : null;

      const kmMaxInfo: { km: number | null; dateTs: number | null } = (() => {
        let max: number | null = null;
        let dateTs: number | null = null;
        for (const r of list) {
          if (typeof r.km === "number" && (max === null || r.km > max)) {
            max = r.km;
            dateTs = r.dateObj?.getTime() ?? null;
          }
        }
        return { km: max, dateTs };
      })();
      const kmTotali: number | null = kmMaxInfo.km;
      const kmDataTs: number | null = kmMaxInfo.dateTs;

      const manutList: SinotticaManutenzioneRecord[] =
        manutByTarga.get(targaUp) ?? [];
      let gommeUltimoTs: number | null = null;
      for (const mr of manutList) {
        if (!isCambioGommeDescription(mr.descrizione)) continue;
        const d = parseDateFlexible(mr.data);
        if (!d) continue;
        const t = d.getTime();
        if (gommeUltimoTs === null || t > gommeUltimoTs) gommeUltimoTs = t;
      }
      const gommeAxleProblemaAsseId: string | null =
        deriveGommeAxleProblema(manutList);
      const gommeAxleProblema:
        | { asseId: string; severity: "warn" | "bad" }
        | null = gommeAxleProblemaAsseId
        ? { asseId: gommeAxleProblemaAsseId, severity: "warn" }
        : null;

      const lvList = manutenzioniDaFareByTarga.get(targaUp) ?? [];
      const lvUrg = lvList.filter((l) => l.urgenza === "alta").length;
      const lvTot = lvList.length;

      const sgList = segnalazioniByTarga.get(targaUp) ?? [];
      const segnByTipo = new Map<
        "freni" | "gomme" | "elettrico" | "altro",
        SinotticaSegnalazioneRow[]
      >();
      for (const s of sgList) {
        const t = deriveSegnTipo(s.tipo);
        if (!segnByTipo.has(t)) segnByTipo.set(t, []);
        segnByTipo.get(t)!.push(s);
      }

      const ctrList = controlliByTarga.get(targaUp) ?? [];
      const reqList = richiesteByTarga.get(targaUp) ?? [];

      const chips: SegnaleChip[] = [];
      if (lvTot > 0) {
        chips.push({
          kind: "manutenzione",
          total: lvTot,
          urgenti: lvUrg,
          ids: lvList.map((l: SinotticaManutenzioneDaFareRow) => l.id).filter((x): x is string => Boolean(x)),
        });
      }
      for (const [tipoKey, items] of segnByTipo.entries()) {
        const severita: "urg" | "warn" =
          tipoKey === "freni" ? "urg" : "warn";
        chips.push({
          kind: "segn-tipo",
          tipo: tipoKey,
          count: items.length,
          severita,
          ids: items.map((s: SinotticaSegnalazioneRow) => s.id).filter((x): x is string => Boolean(x)),
        });
      }
      if (ctrList.length > 0) {
        chips.push({
          kind: "controllo-ko",
          count: ctrList.length,
          ids: ctrList.map((c: SinotticaControlloRow) => c.id).filter((x): x is string => Boolean(x)),
        });
      }
      if (reqList.length > 0) {
        chips.push({
          kind: "richieste",
          count: reqList.length,
          ids: reqList.map((r: SinotticaRichiestaRow) => r.id).filter((x): x is string => Boolean(x)),
        });
      }

      const hasUrg =
        lvUrg > 0 || (segnByTipo.get("freni")?.length ?? 0) > 0;
      const contrattoAttivoFlag: boolean =
        m.manutenzioneContrattoAttivo !== false;
      const hasCritical =
        (cEval.status === "SCADUTA" && contrattoAttivoFlag) ||
        hasUrg ||
        anomalieIsBad;
      const hasWarning =
        !hasCritical &&
        (colEval.status === "IN_SCADENZA" ||
          colEval.status === "SCADUTA" ||
          ctrList.length > 0 ||
          (anomalieCount > 0 && !anomalieIsBad));

      return {
        targa: targaUp,
        categoria: m.categoria,
        rowKind,
        iconKind,
        fotoUrl: m.fotoUrl,
        autistaDefault: m.autistaNome,
        liveSession,
        contrattoStatus: cEval.status,
        contrattoDataFine: contrattoTs,
        contrattoDays: cEval.daysToDeadline,
        contrattoAttivo: m.manutenzioneContrattoAttivo !== false,
        collaudoStatus: colEval.status,
        collaudoTs: m.dataUltimoCollaudoTimestamp,
        docsCollapsed: docsCollaudoFar,
        docsCollapsedNextTs: m.dataUltimoCollaudoTimestamp,
        consumoKmL30g: kmL30,
        deltaFlotta: delta,
        anomalieCount,
        anomalieIsBad,
        kmTotali,
        kmDataTs,
        gommeUltimoTs,
        gommeAxleProblema,
        segnali: chips,
        hasUrgentSignals: hasUrg,
        hasWarning,
        hasCritical,
        isInViaggio,
      };
    });

    function getSortPriority(row: SinotticaRow): number {
      if (row.isInViaggio) return 0;
      if (row.contrattoStatus === "SCADUTA" && row.contrattoAttivo) return 1;
      if (row.segnali.length > 0) return 2;
      return 3;
    }

    return result.sort((a: SinotticaRow, b: SinotticaRow) => {
      const aPri: number = getSortPriority(a);
      const bPri: number = getSortPriority(b);
      if (aPri !== bPri) return aPri - bPri;
      return a.targa.localeCompare(b.targa, "it", { sensitivity: "base" });
    });
  }, [
    mezzi,
    today,
    sessionsByTarga,
    refuelByTarga,
    flotta30gAvg,
    refuelSeedIndex,
    manutByTarga,
    manutenzioniDaFareByTarga,
    segnalazioniByTarga,
    controlliByTarga,
    richiesteByTarga,
  ]);

  const motriciRows = useMemo(
    () => rows.filter((r) => r.rowKind === "motrice"),
    [rows],
  );
  const rimorchiRows = useMemo(
    () => rows.filter((r) => r.rowKind === "rimorchio"),
    [rows],
  );

  const kpiCounts = useMemo(() => {
    let scadute = 0;
    let inScadenza = 0;
    let manutenzioniUrg = 0;
    const manutenzioniUrgMezzi = new Set<string>();
    let anomalieRifor = 0;
    let mezziAttivi = 0;
    let motrici = 0;
    let rimorchiCount = 0;

    for (const r of rows) {
      mezziAttivi += 1;
      if (r.rowKind === "motrice") motrici += 1;
      else rimorchiCount += 1;

      if (r.contrattoStatus === "SCADUTA" && r.contrattoAttivo) scadute += 1;
      else if (r.contrattoStatus === "IN_SCADENZA") inScadenza += 1;

      const lvUrgChip = r.segnali.find(
        (c): c is Extract<SegnaleChip, { kind: "manutenzione" }> =>
          c.kind === "manutenzione",
      );
      if (lvUrgChip && lvUrgChip.urgenti > 0) {
        manutenzioniUrg += lvUrgChip.urgenti;
        manutenzioniUrgMezzi.add(r.targa);
      }
      if (r.anomalieCount > 0) anomalieRifor += r.anomalieCount;
    }

    return {
      scadute,
      inScadenza,
      manutenzioniUrg,
      manutenzioniUrgMezzi: manutenzioniUrgMezzi.size,
      anomalieRifor,
      mezziAttivi,
      motrici,
      rimorchi: rimorchiCount,
    };
  }, [rows]);

  const inViaggioCount = useMemo(
    () => rows.filter((r) => r.isInViaggio).length,
    [rows],
  );

  const filteredMotrici = useMemo(() => {
    return motriciRows.filter((r) => {
      if (searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        const driverName = (
          r.liveSession?.nomeAutista ??
          r.autistaDefault ??
          ""
        ).toLowerCase();
        if (
          !r.targa.toLowerCase().includes(q) &&
          !driverName.includes(q)
        ) {
          return false;
        }
      }
      if (activeKpiFilters.size === 0) return true;
      for (const f of activeKpiFilters) {
        switch (f) {
          case "manut-scadute":
            if (r.contrattoStatus !== "SCADUTA") return false;
            break;
          case "scadenza-30":
            if (r.contrattoStatus !== "IN_SCADENZA") return false;
            break;
          case "manutenzioni-urgenti": {
            const ch = r.segnali.find(
              (c): c is Extract<SegnaleChip, { kind: "manutenzione" }> =>
                c.kind === "manutenzione",
            );
            if (!ch || ch.urgenti === 0) return false;
            break;
          }
          case "anomalie-rifor":
            if (r.anomalieCount === 0) return false;
            break;
        }
      }
      return true;
    });
  }, [motriciRows, searchText, activeKpiFilters]);

  const filteredRimorchi = useMemo(() => {
    return rimorchiRows.filter((r) => {
      if (searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        if (!r.targa.toLowerCase().includes(q)) return false;
      }
      if (activeKpiFilters.size === 0) return true;
      for (const f of activeKpiFilters) {
        switch (f) {
          case "manut-scadute":
            if (r.contrattoStatus !== "SCADUTA") return false;
            break;
          case "scadenza-30":
            if (r.contrattoStatus !== "IN_SCADENZA") return false;
            break;
          case "manutenzioni-urgenti": {
            const ch = r.segnali.find(
              (c): c is Extract<SegnaleChip, { kind: "manutenzione" }> =>
                c.kind === "manutenzione",
            );
            if (!ch || ch.urgenti === 0) return false;
            break;
          }
          case "anomalie-rifor":
            if (r.anomalieCount === 0) return false;
            break;
        }
      }
      return true;
    });
  }, [rimorchiRows, searchText, activeKpiFilters]);

  function toggleKpi(key: KpiFilterKey) {
    setActiveKpiFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function clearFilters() {
    setActiveKpiFilters(new Set<KpiFilterKey>());
  }

  function handleChipManutenzioni(targa: string) {
    const list = manutenzioniDaFareByTarga.get(targa) ?? [];
    const first = list[0];
    if (first?.id) onManutenzioneClick(first.id);
    else onTargaClick(targa);
  }

  function handleChipSegnalazione(
    targa: string,
    tipo: "freni" | "gomme" | "elettrico" | "altro",
  ) {
    const list = segnalazioniByTarga.get(targa) ?? [];
    const match =
      list.find((s) => deriveSegnTipo(s.tipo) === tipo) ?? list[0];
    if (match) onEventoChipClick(buildSegnalazioneEvent(match));
    else onTargaClick(targa);
  }

  function handleChipControllo(targa: string) {
    const list = controlliByTarga.get(targa) ?? [];
    const first = list[0];
    if (first) onEventoChipClick(buildControlloEvent(first));
    else onTargaClick(targa);
  }

  function handleChipRichiesta(targa: string) {
    const list = richiesteByTarga.get(targa) ?? [];
    const first = list[0];
    if (first) onEventoChipClick(buildRichiestaEvent(first));
    else onTargaClick(targa);
  }

  function renderContrattoCell(r: SinotticaRow) {
    const ts: number | null = r.contrattoDataFine;
    const nowMs: number = today.getTime();
    const isAttivo: boolean = ts !== null && ts > nowMs;
    const isScaduto: boolean = ts !== null && ts <= nowMs;
    let pillClass: string;
    let pillText: string;
    let whenText: string;
    if (!r.contrattoAttivo) {
      pillClass = "pill pill--ghost";
      pillText = "NON ATTIVO";
      whenText = ts ? `dati ${formatDateIt(ts)}` : "";
    } else if (isAttivo) {
      pillClass = "pill pill--ok";
      pillText = "ATTIVO";
      whenText = `scadenza ${formatDateIt(ts)}`;
    } else if (isScaduto) {
      pillClass = "pill pill--ghost";
      pillText = "SCADUTO";
      whenText = `scaduto il ${formatDateIt(ts)}`;
    } else {
      pillClass = "pill pill--ghost";
      pillText = "NESSUNO";
      whenText = "";
    }
    return (
      <td
        className="ccs-c-contratto"
        onClick={(e) => {
          e.stopPropagation();
          onContrattoClick(r.targa);
        }}
        title="Modifica contratto manutenzione programmata"
        style={{ cursor: "pointer" }}
      >
        <span className={pillClass}>{pillText}</span>
        {whenText ? <span className="when">{whenText}</span> : null}
      </td>
    );
  }

  function pillClsForDoc(s: MaintenanceStatus): string {
    if (s === "SCADUTA") return "ccs-doc-pill is-bad";
    if (s === "IN_SCADENZA") return "ccs-doc-pill is-warn";
    return "ccs-doc-pill is-ok";
  }

  function renderDocsCell(r: SinotticaRow) {
    if (r.docsCollapsed) {
      return (
        <td>
          <div
            className="ccs-c-docs"
            onClick={(e) => {
              e.stopPropagation();
              onDocumentiClick(r.targa);
            }}
            title="Apri scadenze e collaudi del mezzo"
          >
            <span className="ccs-doc-pill is-collapsed">
              <span className="lab">OK</span> · prossima{" "}
              <span className="dt">
                {formatMonthYearIt(r.docsCollapsedNextTs)}
              </span>
            </span>
          </div>
        </td>
      );
    }
    return (
      <td>
        <div
          className="ccs-c-docs"
          onClick={(e) => {
            e.stopPropagation();
            onDocumentiClick(r.targa);
          }}
          title="Apri scadenze e collaudi del mezzo"
        >
          {r.collaudoTs !== null ? (
            <span className={pillClsForDoc(r.collaudoStatus)}>
              <span className="lab">Collaudo</span>
              <span className="dt">{formatDateIt(r.collaudoTs)}</span>
            </span>
          ) : (
            <span className="ccs-doc-pill is-collapsed">
              <span className="lab">Senza data</span>
            </span>
          )}
        </div>
      </td>
    );
  }

  function renderAutistaCell(r: SinotticaRow) {
    const liveName = r.liveSession?.nomeAutista || "";
    const defaultName = r.autistaDefault || "";
    if (liveName) {
      return (
        <td className="ccs-c-autista">
          <span className="ccs-driver-row">
            <span className="ccs-live-pip" />
            {liveName}
          </span>
          <div className="ccs-driver-meta">
            In viaggio dalle{" "}
            <span className="since">
              {formatHM(r.liveSession?.timestamp ?? null)}
            </span>
          </div>
        </td>
      );
    }
    if (defaultName) {
      return (
        <td className="ccs-c-autista">
          <span className="ccs-driver-row is-default">
            <span className="ccs-live-pip" />
            {defaultName}
          </span>
          <div className="ccs-driver-meta">
            Default · nessuna sessione attiva
          </div>
        </td>
      );
    }
    return (
      <td className="ccs-c-autista">
        <span className="ccs-driver-row is-empty">
          <span className="ccs-live-pip" />
          non assegnato
        </span>
        <div className="ccs-driver-meta">Nessun autista di default</div>
      </td>
    );
  }

  function renderRimorchioAutistaCell(r: SinotticaRow) {
    const liveSession = r.liveSession;
    if (liveSession?.targaMotrice) {
      return (
        <td className="ccs-c-autista">
          <span className="ccs-driver-row">
            <span className="ccs-live-pip" />
            {liveSession.targaMotrice}
          </span>
          <div className="ccs-driver-meta">
            {liveSession.nomeAutista || "Autista"} · in viaggio
          </div>
        </td>
      );
    }
    return (
      <td className="ccs-c-autista">
        <span className="ccs-driver-row is-empty">
          <span className="ccs-live-pip" />
          non agganciato
        </span>
        <div className="ccs-driver-meta">Disponibile</div>
      </td>
    );
  }

  function renderConsumoCell(r: SinotticaRow) {
    if (r.consumoKmL30g === null) {
      return (
        <td>
          <div
            className="ccs-c-consumo"
            title="Nessun rifornimento ultimi 30 giorni"
          >
            <span className="v is-empty">nessun rifor.</span>
          </div>
        </td>
      );
    }
    const delta = formatDeltaKmL(r.deltaFlotta);
    return (
      <td>
        <div
          className="ccs-c-consumo"
          onClick={(e) => {
            e.stopPropagation();
            onConsumoClick(r.targa);
          }}
          title="Apri analisi consumi - Andamento mezzo"
          style={{ cursor: "pointer" }}
        >
          <span className="v">{formatKmLIt(r.consumoKmL30g)}</span>
          <span className={`delta ${delta.cls}`}>{delta.text}</span>
        </div>
      </td>
    );
  }

  function renderAnomCell(r: SinotticaRow) {
    if (r.anomalieCount === 0) {
      return <td className="ccs-c-anom zero">0</td>;
    }
    const cls = r.anomalieIsBad
      ? "ccs-anom-link"
      : "ccs-anom-link warn";
    return (
      <td className="ccs-c-anom">
        <button
          type="button"
          className={cls}
          onClick={(e) => {
            e.stopPropagation();
            onAnomalieClick(r.targa);
          }}
          title="Apri indagine anomalie"
        >
          {r.anomalieCount}
        </button>
      </td>
    );
  }

  function renderKmCell(r: SinotticaRow) {
    const tooltipTitle: string | undefined = r.kmDataTs
      ? `Km registrati il ${formatDateIt(r.kmDataTs)}`
      : undefined;
    return (
      <td className="ccs-c-km" title={tooltipTitle}>
        {formatKmIt(r.kmTotali)}
        <span className="unit">km</span>
      </td>
    );
  }

  function renderGommeCell(r: SinotticaRow) {
    return (
      <td>
        <div
          className="ccs-c-gomme"
          onClick={(e) => {
            e.stopPropagation();
            onGommeClick(r.targa);
          }}
          title="Apri dossier gomme"
        >
          {r.gommeUltimoTs !== null ? (
            <span className="last">
              Ultimo:{" "}
              <span className="when">
                {formatMonthYearIt(r.gommeUltimoTs)}
              </span>
            </span>
          ) : (
            <span className="last">Nessun cambio recente</span>
          )}
          {r.gommeAxleProblema && (
            <span
              className={
                r.gommeAxleProblema.severity === "bad"
                  ? "ccs-axle-badge is-bad"
                  : "ccs-axle-badge"
              }
            >
              Asse {formatAxleLabel(r.gommeAxleProblema.asseId)} da verificare
            </span>
          )}
        </div>
      </td>
    );
  }

  function renderApertiCell(r: SinotticaRow) {
    if (r.segnali.length === 0) {
      return (
        <td>
          <div className="ccs-c-aperti empty">—</div>
        </td>
      );
    }
    return (
      <td>
        <div className="ccs-c-aperti">
          {r.segnali.map((c, idx) => {
            if (c.kind === "manutenzione") {
              const cls = c.urgenti > 0 ? "ccs-sig urg" : "ccs-sig";
              const tag =
                c.urgenti > 0
                  ? c.total === 1
                    ? "Manutenzione urg."
                    : `Manutenzioni · ${c.urgenti} urg.`
                  : c.total === 1
                  ? "Manutenzione"
                  : "Manutenzioni";
              return (
                <span
                  key={`lv-${idx}`}
                  className={cls}
                  onClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                    e.stopPropagation();
                    if (c.total <= 1) {
                      handleChipManutenzioni(r.targa);
                    } else {
                      const rect: DOMRect =
                        e.currentTarget.getBoundingClientRect();
                      onChipListOpen(rect, "manutenzione", r.targa, c.ids);
                    }
                  }}
                  title={c.total === 1 ? "Apri manutenzione" : `${c.total} manutenzioni`}
                >
                  <span className="n">{c.total}</span>
                  <span className="tag">{tag}</span>
                </span>
              );
            }
            if (c.kind === "segn-tipo") {
              const cls = `ccs-sig ${c.severita}`;
              return (
                <span
                  key={`sg-${c.tipo}-${idx}`}
                  className={cls}
                  onClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                    e.stopPropagation();
                    if (c.count <= 1) {
                      handleChipSegnalazione(r.targa, c.tipo);
                    } else {
                      const rect: DOMRect =
                        e.currentTarget.getBoundingClientRect();
                      onChipListOpen(
                        rect,
                        "segnalazione",
                        r.targa,
                        c.ids,
                        c.tipo,
                      );
                    }
                  }}
                  title={tipoChipLabel(c.tipo)}
                >
                  <span className="n">{c.count}</span>
                  <span className="tag">{tipoChipLabel(c.tipo)}</span>
                </span>
              );
            }
            if (c.kind === "controllo-ko") {
              return (
                <span
                  key={`ko-${idx}`}
                  className="ccs-sig urg"
                  onClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                    e.stopPropagation();
                    if (c.count <= 1) {
                      handleChipControllo(r.targa);
                    } else {
                      const rect: DOMRect =
                        e.currentTarget.getBoundingClientRect();
                      onChipListOpen(rect, "controllo", r.targa, c.ids);
                    }
                  }}
                  title="Apri controllo KO"
                >
                  <span className="n">{c.count}</span>
                  <span className="tag">KO controllo</span>
                </span>
              );
            }
            return (
              <span
                key={`rq-${idx}`}
                className="ccs-sig info"
                onClick={(e: ReactMouseEvent<HTMLSpanElement>) => {
                  e.stopPropagation();
                  if (c.count <= 1) {
                    handleChipRichiesta(r.targa);
                  } else {
                    const rect: DOMRect =
                      e.currentTarget.getBoundingClientRect();
                    onChipListOpen(rect, "richiesta", r.targa, c.ids);
                  }
                }}
                title="Apri richiesta attrezzature"
              >
                <span className="n">{c.count}</span>
                <span className="tag">Richieste attrez.</span>
              </span>
            );
          })}
        </div>
      </td>
    );
  }

  function renderMezzoCell(r: SinotticaRow) {
    return (
      <td>
        <div className="ccs-c-mezzo">
          <div
            className={
              r.fotoUrl
                ? "ccs-veicolo-photo has-img"
                : "ccs-veicolo-photo no-img"
            }
            title="Cronologia mezzo (Shift+click: elimina)"
            onClick={(e: ReactMouseEvent<HTMLDivElement>) => {
              e.stopPropagation();
              if (e.shiftKey) {
                onFotoDelete(r.targa);
              } else {
                onFotoClick(r.targa);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            {r.fotoUrl ? (
              <img src={r.fotoUrl} alt={r.targa} loading="lazy" />
            ) : (
              <VeicoloIcon kind={r.iconKind} />
            )}
          </div>
          <div>
            <span className="ccs-targa">{r.targa}</span>
            <span className="ccs-categoria">{r.categoria || "—"}</span>
          </div>
        </div>
      </td>
    );
  }

  function renderRowMotrice(r: SinotticaRow) {
    const cls = r.hasCritical
      ? "is-critical"
      : r.hasWarning
      ? "is-warning"
      : "";
    return (
      <tr key={r.targa} className={cls} onClick={() => onTargaClick(r.targa)}>
        {renderMezzoCell(r)}
        {renderAutistaCell(r)}
        {renderContrattoCell(r)}
        {renderDocsCell(r)}
        {renderConsumoCell(r)}
        {renderAnomCell(r)}
        {renderKmCell(r)}
        {renderGommeCell(r)}
        {renderApertiCell(r)}
      </tr>
    );
  }

  function renderRowRimorchio(r: SinotticaRow) {
    const cls = r.hasCritical
      ? "is-critical"
      : r.hasWarning
      ? "is-warning"
      : "";
    return (
      <tr key={r.targa} className={cls} onClick={() => onTargaClick(r.targa)}>
        {renderMezzoCell(r)}
        {renderRimorchioAutistaCell(r)}
        {renderContrattoCell(r)}
        {renderDocsCell(r)}
        {renderKmCell(r)}
        {renderGommeCell(r)}
        {renderApertiCell(r)}
      </tr>
    );
  }

  const filterCount = activeKpiFilters.size;

  return (
    <div className="cc-sinottica-scope-v2">
      <section className="ccs-page-head">
        <h2>Sinottica flotta</h2>
        <p className="lede">
          Torre di controllo: stato di salute, scadenze e segnali aperti per
          ogni mezzo. Vista in tempo reale.
        </p>
      </section>

      <section
        className="ccs-summary"
        aria-label="Riepilogo flotta. I KPI con bordo navy sono filtri attivi sulla tabella sotto."
      >
        <button className="ccs-kpi is-static" type="button">
          <span className="label">Mezzi attivi</span>
          <span className="value">{kpiCounts.mezziAttivi}</span>
          <span className="sub">
            {kpiCounts.motrici} motrici · {kpiCounts.rimorchi} rimorchi
          </span>
        </button>
        <button
          className={
            activeKpiFilters.has("manut-scadute")
              ? "ccs-kpi is-bad is-active"
              : "ccs-kpi is-bad"
          }
          type="button"
          onClick={() => toggleKpi("manut-scadute")}
        >
          <span className="filter-mark">✓</span>
          <span className="label">Manut. scadute</span>
          <span className="value">{kpiCounts.scadute}</span>
          <span className="sub">Contratto casa madre</span>
        </button>
        <button
          className={
            activeKpiFilters.has("scadenza-30")
              ? "ccs-kpi is-warn is-active"
              : "ccs-kpi is-warn"
          }
          type="button"
          onClick={() => toggleKpi("scadenza-30")}
        >
          <span className="filter-mark">✓</span>
          <span className="label">In scadenza ≤ 30g</span>
          <span className="value">{kpiCounts.inScadenza}</span>
          <span className="sub">Da pianificare</span>
        </button>
        <button
          className={
            activeKpiFilters.has("manutenzioni-urgenti")
              ? "ccs-kpi is-bad is-active"
              : "ccs-kpi is-bad"
          }
          type="button"
          onClick={() => toggleKpi("manutenzioni-urgenti")}
        >
          <span className="filter-mark">✓</span>
          <span className="label">Manutenzioni urgenti</span>
          <span className="value">{kpiCounts.manutenzioniUrg}</span>
          <span className="sub">Su {kpiCounts.manutenzioniUrgMezzi} mezzi</span>
        </button>
        <button
          className={
            activeKpiFilters.has("anomalie-rifor")
              ? "ccs-kpi is-warn is-active"
              : "ccs-kpi is-warn"
          }
          type="button"
          onClick={() => toggleKpi("anomalie-rifor")}
        >
          <span className="filter-mark">✓</span>
          <span className="label">Anomalie rifor.</span>
          <span className="value">{kpiCounts.anomalieRifor}</span>
          <span className="sub">Ultimi 30 giorni</span>
        </button>
        <button className="ccs-kpi is-static" type="button">
          <span className="label">Media flotta</span>
          <span className="value">
            {formatKmLIt(flotta30gAvg)}{" "}
            <span className="unit">km/L</span>
          </span>
          <span className="sub">Trattori + cisterne</span>
        </button>
      </section>

      <div className="ccs-tabs" role="tablist">
        <button
          className={
            activeTab === "motrici" ? "ccs-tab is-active" : "ccs-tab"
          }
          role="tab"
          type="button"
          onClick={() => setActiveTab("motrici")}
        >
          Mezzi con motore <span className="ct">{motriciRows.length}</span>
        </button>
        <button
          className={
            activeTab === "rimorchi" ? "ccs-tab is-active" : "ccs-tab"
          }
          role="tab"
          type="button"
          onClick={() => setActiveTab("rimorchi")}
        >
          Rimorchi <span className="ct">{rimorchiRows.length}</span>
        </button>
        <div className="ccs-tabs-spacer" />
        {inViaggioCount > 0 && (
          <div className="ccs-tabs-meta">
            <span className="live-dot" aria-hidden="true" />
            <span>
              {inViaggioCount}{" "}
              {inViaggioCount === 1 ? "mezzo" : "mezzi"} in viaggio adesso
            </span>
          </div>
        )}
      </div>

      <section className="ccs-toolbar">
        <div className="ccs-search">
          <SearchIcon />
          <input
            type="text"
            placeholder="Cerca targa o autista…"
            autoComplete="off"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        {filterCount > 0 && (
          <div className="ccs-filter-state">
            <span>
              <span className="ct">{filterCount}</span>{" "}
              {filterCount === 1 ? "filtro attivo" : "filtri attivi"}
            </span>
            <button type="button" onClick={clearFilters}>
              azzera
            </button>
          </div>
        )}
        <div className="ccs-toolbar-spacer" />
      </section>

      <section
        className={
          activeTab === "motrici"
            ? "ccs-tab-pane is-active"
            : "ccs-tab-pane"
        }
      >
        <div className="ccs-table-wrap">
          <table className="ccs-fleet">
            <colgroup>
              <col style={{ width: "230px" }} />
              <col style={{ width: "170px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "175px" }} />
              <col style={{ width: "95px" }} />
              <col style={{ width: "80px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "145px" }} />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th>Mezzo</th>
                <th>Autista</th>
                <th>Contratto manut.</th>
                <th>Collaudo</th>
                <th className="num">Consumo · Δ</th>
                <th className="num">
                  Anom.<br />rifor.
                </th>
                <th className="num">Contachilometri</th>
                <th>Gomme</th>
                <th>Aperti</th>
              </tr>
            </thead>
            <tbody>
              {filteredMotrici.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="ccs-empty-state">
                      Nessun mezzo corrisponde ai filtri attivi.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMotrici.map(renderRowMotrice)
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section
        className={
          activeTab === "rimorchi"
            ? "ccs-tab-pane is-active"
            : "ccs-tab-pane"
        }
      >
        <div className="ccs-table-wrap">
          <table className="ccs-fleet">
            <colgroup>
              <col style={{ width: "230px" }} />
              <col style={{ width: "200px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "175px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "165px" }} />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th>Mezzo</th>
                <th>Agganciato a</th>
                <th>Contratto manut.</th>
                <th>Collaudo</th>
                <th className="num">Contachilometri</th>
                <th>Gomme</th>
                <th>Aperti</th>
              </tr>
            </thead>
            <tbody>
              {filteredRimorchi.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="ccs-empty-state">
                      Nessun rimorchio corrisponde ai filtri attivi.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRimorchi.map(renderRowRimorchio)
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

