import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import "./next-home.css";
import { getNextRoleFromSearch } from "./nextAccess";
import {
  NEXT_AUTISTI_APP_PATH,
  NEXT_MAGAZZINO_PATH,
  buildNextDossierPath,
  buildNextManutenzioniPath,
} from "./nextStructuralPaths";
import HomeInternalAiLauncher from "./components/HomeInternalAiLauncher";
import {
  readNextCentroControlloSnapshot,
  type D10AssetLocationItem,
  type D10MezzoItem,
  type D10SessionItem,
  type D10Snapshot,
} from "./domain/nextCentroControlloDomain";
import {
  readNextManutenzioniDaFareSnapshot,
  type NextManutenzioniLegacyDatasetRecord,
  type NextManutenzioneUrgenza,
} from "./domain/nextManutenzioniDomain";
import {
  readNextManutenzioniScadenzeSnapshot,
  type NextManutenzioniScadenzeSnapshot,
} from "./domain/nextManutenzioniScadenzeDomain";
import {
  readNextInventarioSnapshot,
  type NextInventarioSnapshot,
} from "./domain/nextInventarioDomain";
import { readNextProcurementSnapshot } from "./domain/nextProcurementDomain";
import { toDisplay } from "./helpers/dateUnica";
import { saveNextHomeLuogoMezzo } from "./writers/nextHomeLuogoMezzoWriter";

type StatCard = {
  label: string;
  value: string;
  detail: string;
  action?: "segnalazioni";
};

type StatusTone = "ok" | "warning" | "danger" | "idle" | "info";

type FleetRow = {
  targa: string;
  luogo: string;
  luogoRaw: string;
  categoria: string | null;
  autistaNome: string | null;
  fotoUrl: string | null;
  tone: StatusTone;
  badge: string;
  dossierHref: string;
  sessionActive: boolean;
  sessionDriver: string | null;
  sessionBadge: string | null;
  sessionStatus: string | null;
  assetKind: D10AssetLocationItem["assetKind"];
  luogoEventId: string | null;
  luogoEventIndex: number | null;
};

type FleetEditState = {
  targa: string;
  luogo: string;
  assetKind: D10AssetLocationItem["assetKind"];
  luogoEventId: string | null;
  luogoEventIndex: number | null;
};

type TaskRow = {
  title: string;
  detail: string;
  tone: StatusTone;
  badge: string;
  href?: string;
};

type HomeAlertBanner = {
  tone: "warning" | "success";
  text: string;
};

type HomeLavoriAlert = {
  totalLabel: string;
  urgentLabel: string;
  items: TaskRow[];
};

type HomeStatsState = {
  lavoriAperti: number | null;
  lavoriUrgenti: number | null;
  ordiniInAttesa: number | null;
  ordiniParziali: number | null;
  segnalazioniNuove: number | null;
};

const FLEET_PREVIEW_ROWS = 3;

function formatCurrentDate(date: Date) {
  const giorni = ["Domenica", "Lunedi", "Martedi", "Mercoledi", "Giovedi", "Venerdi", "Sabato"];
  return `${giorni[date.getDay()] ?? ""} ${toDisplay(date) || "-"}`;
}

function formatHomeStatValue(value: number | null): string {
  if (value == null) {
    return "-";
  }

  return String(value);
}

function formatAlertSignal(
  count: number,
  singular: string,
  plural: string = `${singular}i`,
): string | null {
  if (count <= 0) {
    return null;
  }

  return `${count} ${count === 1 ? singular : plural}`;
}

function buildHomeAlertBanner(
  snapshot: D10Snapshot | null,
  manutCounters: NextManutenzioniScadenzeSnapshot["counters"] | null = null,
): HomeAlertBanner | null {
  if (!snapshot) {
    return null;
  }

  const { counters } = snapshot;
  const cat = manutCounters?.perCategoria ?? null;

  // Scadenze per settore: collaudi + cronotachigrafo / tagliandi / estintore.
  const scadenze = [
    formatAlertSignal(counters.revisioniScadute, "collaudo scaduto", "collaudi scaduti"),
    formatAlertSignal(counters.revisioniInScadenza, "collaudo in scadenza", "collaudi in scadenza"),
    formatAlertSignal(cat?.cronotachigrafo.scadute ?? 0, "cronotachigrafo scaduto", "cronotachigrafi scaduti"),
    formatAlertSignal(cat?.cronotachigrafo.inScadenza ?? 0, "cronotachigrafo in scadenza", "cronotachigrafi in scadenza"),
    formatAlertSignal(cat?.tagliandi.scadute ?? 0, "tagliando scaduto", "tagliandi scaduti"),
    formatAlertSignal(cat?.tagliandi.inScadenza ?? 0, "tagliando in scadenza", "tagliandi in scadenza"),
    formatAlertSignal(cat?.estintore.scadute ?? 0, "estintore scaduto", "estintori scaduti"),
    formatAlertSignal(cat?.estintore.inScadenza ?? 0, "estintore in scadenza", "estintori in scadenza"),
  ].filter((signal): signal is string => Boolean(signal));

  if (scadenze.length > 0) {
    return {
      tone: "warning",
      text: scadenze.join(" \u00b7 "),
    };
  }

  // Nessuna scadenza: fallback agli altri segnali operativi.
  const operativi = [
    formatAlertSignal(counters.conflittiSessione, "conflitto sessione", "conflitti sessione"),
    formatAlertSignal(counters.segnalazioniNuove, "segnalazione da gestire", "segnalazioni da gestire"),
    formatAlertSignal(counters.controlliKo, "controllo KO", "controlli KO"),
  ].filter((signal): signal is string => Boolean(signal));

  if (operativi.length > 0) {
    return {
      tone: "warning",
      text: operativi.slice(0, 2).join(" \u00b7 "),
    };
  }

  if (counters.alertsVisible > 0) {
    return {
      tone: "warning",
      text: `${counters.alertsVisible} alert operativi da verificare`,
    };
  }

  return {
    tone: "success",
    text: "Tutto ok: nessun alert prioritario",
  };
}

function buildHomeLavoriAlert(
  snapshot: NextManutenzioniLegacyDatasetRecord[] | null,
  stats: HomeStatsState,
): HomeLavoriAlert {
  const totalLabel =
    stats.lavoriAperti == null
      ? "Manutenzioni in caricamento"
      : stats.lavoriAperti === 0
        ? "Nessuna manutenzione da fare"
        : `${stats.lavoriAperti} ${stats.lavoriAperti === 1 ? "manutenzione da fare" : "manutenzioni da fare"}`;
  const urgentLabel =
    stats.lavoriUrgenti == null
      ? "urgenze in caricamento"
      : stats.lavoriUrgenti === 0
        ? "nessuna priorità alta"
        : `${stats.lavoriUrgenti} ${stats.lavoriUrgenti === 1 ? "alta priorità" : "alte priorità"}`;

  return {
    totalLabel,
    urgentLabel,
    items: buildLavoriWidgetRows(snapshot).slice(0, 3),
  };
}

function formatUrgentLavoriDetail(count: number | null): string {
  if (count == null) {
    return "in caricamento";
  }

  if (count === 0) {
    return "nessuna urgenza";
  }

  return `${count} ${count === 1 ? "urgente" : "urgenti"}`;
}

function formatPendingOrdersDetail(count: number | null): string {
  if (count == null) {
    return "in caricamento";
  }

  if (count === 0) {
    return "nessuno parziale";
  }

  return `${count} ${count === 1 ? "parziale" : "parziali"}`;
}

function mapAssetStatusTone(statusLabel: string): StatusTone {
  const normalized = statusLabel.trim().toUpperCase();
  if (normalized === "LIBERO") {
    return "ok";
  }

  if (normalized === "SGANCIATO") {
    return "warning";
  }

  return "idle";
}

function isPianaleCategoria(categoria: string | null | undefined): boolean {
  return String(categoria ?? "").trim().toLowerCase() === "pianale";
}

function formatFleetCategoria(categoria: string | null | undefined): string {
  const value = String(categoria ?? "").trim();
  return value || "Categoria non indicata";
}

function buildMezziByTarga(snapshot: D10Snapshot | null): Map<string, D10MezzoItem> {
  const result = new Map<string, D10MezzoItem>();
  snapshot?.mezzi.forEach((mezzo) => {
    if (mezzo.targa) {
      result.set(mezzo.targa, mezzo);
    }
  });
  return result;
}

function buildSessioniByTarga(snapshot: D10Snapshot | null): Map<string, D10SessionItem> {
  const result = new Map<string, D10SessionItem>();
  snapshot?.sessioni.forEach((sessione) => {
    if (sessione.targaMotrice) {
      result.set(sessione.targaMotrice, sessione);
    }
    if (sessione.targaRimorchio) {
      result.set(sessione.targaRimorchio, sessione);
    }
  });
  return result;
}

function buildFleetWidgetRows(
  items: D10AssetLocationItem[],
  snapshot: D10Snapshot | null,
): FleetRow[] {
  const mezziByTarga = buildMezziByTarga(snapshot);
  const sessioniByTarga = buildSessioniByTarga(snapshot);

  return items.map((item) => {
    const mezzo = mezziByTarga.get(item.targa) ?? null;
    const sessione = sessioniByTarga.get(item.targa) ?? null;

    return {
      targa: item.targa,
      luogo: item.luogo,
      luogoRaw: item.luogoRaw,
      categoria: item.categoria ?? mezzo?.categoria ?? null,
      autistaNome: item.autistaNome ?? mezzo?.autistaNome ?? null,
      fotoUrl: mezzo?.fotoUrl ?? null,
      tone: mapAssetStatusTone(item.statusLabel),
      badge: item.statusLabel.toLowerCase(),
      dossierHref: buildNextDossierPath(item.targa),
      sessionActive: Boolean(sessione),
      sessionDriver: sessione?.nomeAutista ?? null,
      sessionBadge: sessione?.badgeAutista ?? null,
      sessionStatus: sessione?.statoSessione ?? null,
      assetKind: item.assetKind,
      luogoEventId: item.luogoEventId,
      luogoEventIndex: item.luogoEventIndex,
    };
  });
}

function buildMezziAttiviCard(snapshot: D10Snapshot | null): StatCard {
  if (!snapshot) {
    return {
      label: "Mezzi attivi",
      value: "-",
      detail: "in caricamento",
    };
  }

  const activeTarghe = new Set<string>();
  snapshot.sessioni.forEach((sessione) => {
    if (sessione.targaMotrice) activeTarghe.add(sessione.targaMotrice);
    if (sessione.targaRimorchio) activeTarghe.add(sessione.targaRimorchio);
  });

  const mezziTotali = snapshot.mezzi.filter((mezzo) => Boolean(mezzo.targa)).length;
  return {
    label: "Mezzi attivi",
    value: String(activeTarghe.size),
    detail: `su ${mezziTotali} totali`,
  };
}

function rebucketHomeFleetItems(snapshot: D10Snapshot | null): {
  motrici: D10AssetLocationItem[];
  rimorchi: D10AssetLocationItem[];
} {
  const motriciSource = snapshot?.motriciTrattoriDaMostrare ?? [];
  const rimorchiSource = snapshot?.rimorchiDaMostrare ?? [];
  const pianali = motriciSource.filter((item) => isPianaleCategoria(item.categoria));
  const motrici = motriciSource.filter((item) => !isPianaleCategoria(item.categoria));
  const rimorchi = [...rimorchiSource, ...pianali].sort((left, right) => {
    const leftIsPianale = isPianaleCategoria(left.categoria);
    const rightIsPianale = isPianaleCategoria(right.categoria);
    if (leftIsPianale && !rightIsPianale) return -1;
    if (!leftIsPianale && rightIsPianale) return 1;
    return left.targa.localeCompare(right.targa);
  });
  return { motrici, rimorchi };
}

function mapLavoroUrgenzaTone(urgenza: NextManutenzioneUrgenza | null | undefined): StatusTone {
  switch (urgenza) {
    case "alta":
      return "danger";
    case "media":
      return "warning";
    case "bassa":
      return "info";
    default:
      return "idle";
  }
}

function formatLavoroUrgenzaLabel(urgenza: NextManutenzioneUrgenza | null | undefined): string {
  return urgenza ?? "n.d.";
}

function buildLavoriWidgetRows(snapshot: NextManutenzioniLegacyDatasetRecord[] | null): TaskRow[] {
  if (!snapshot) {
    return [];
  }

  return snapshot
    .slice(0, 3)
    .map((item) => ({
      title: item.descrizione,
      detail: item.targa || "Targa non indicata",
      tone: mapLavoroUrgenzaTone(item.urgenza),
      badge: formatLavoroUrgenzaLabel(item.urgenza),
      href: buildNextManutenzioniPath(item.targa || undefined, item.id),
    }));
}

function mapInventarioStatusTone(
  status: NextInventarioSnapshot["items"][number]["stockStatus"],
): StatusTone {
  switch (status) {
    case "critico":
      return "warning";
    case "disponibile":
      return "ok";
    default:
      return "idle";
  }
}

function formatInventarioDetail(item: NextInventarioSnapshot["items"][number]): string {
  const quantitaLabel = item.quantita == null ? "Quantita non dimostrabile" : `${item.quantita} ${item.unita ?? "pz"}`;
  return item.fornitore ? `${quantitaLabel} · ${item.fornitore}` : quantitaLabel;
}

function formatInventarioBadge(
  status: NextInventarioSnapshot["items"][number]["stockStatus"],
): string {
  switch (status) {
    case "critico":
      return "critico";
    case "disponibile":
      return "disponibile";
    default:
      return "n.d.";
  }
}

function buildInventarioWidgetRows(snapshot: NextInventarioSnapshot | null): TaskRow[] {
  if (!snapshot) {
    return [];
  }

  return snapshot.items.slice(0, 4).map((item) => ({
    title: item.descrizione,
    detail: formatInventarioDetail(item),
    tone: mapInventarioStatusTone(item.stockStatus),
    badge: formatInventarioBadge(item.stockStatus),
  }));
}

export default function NextHomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = getNextRoleFromSearch(location.search);
  const currentDateLabel = useMemo(() => formatCurrentDate(new Date()), []);
  const [centroSnapshot, setCentroSnapshot] = useState<D10Snapshot | null>(null);
  const [manutScadenzeCounters, setManutScadenzeCounters] = useState<
    NextManutenzioniScadenzeSnapshot["counters"] | null
  >(null);
  const [homeStats, setHomeStats] = useState<HomeStatsState>({
    lavoriAperti: null,
    lavoriUrgenti: null,
    ordiniInAttesa: null,
    ordiniParziali: null,
    segnalazioniNuove: null,
  });
  const [lavoriSnapshot, setLavoriSnapshot] = useState<NextManutenzioniLegacyDatasetRecord[] | null>(null);
  const [inventarioSnapshot, setInventarioSnapshot] = useState<NextInventarioSnapshot | null>(null);
  const [fleetEdit, setFleetEdit] = useState<FleetEditState | null>(null);
  const [fleetSaving, setFleetSaving] = useState(false);
  const [motriciExpanded, setMotriciExpanded] = useState(false);
  const [rimorchiExpanded, setRimorchiExpanded] = useState(false);

  const loadSnapshot = useCallback(
    async (isActive: () => boolean = () => true) => {
      const [centroResult, lavoriResult, procurementResult, inventarioResult, scadenzeManutResult] =
        await Promise.allSettled([
          readNextCentroControlloSnapshot(Date.now()),
          readNextManutenzioniDaFareSnapshot(),
          readNextProcurementSnapshot({ includeCloneOverlays: false }),
          readNextInventarioSnapshot({ includeCloneOverlays: false }),
          readNextManutenzioniScadenzeSnapshot(Date.now()),
        ]);

      if (!isActive()) {
        return;
      }

      if (centroResult.status === "fulfilled") {
        setCentroSnapshot(centroResult.value);
      } else {
        setCentroSnapshot(null);
      }

      if (lavoriResult.status === "fulfilled") {
        setLavoriSnapshot(lavoriResult.value);
      } else {
        setLavoriSnapshot(null);
      }

      if (inventarioResult.status === "fulfilled") {
        setInventarioSnapshot(inventarioResult.value);
      } else {
        setInventarioSnapshot(null);
      }

      if (scadenzeManutResult.status === "fulfilled") {
        setManutScadenzeCounters(scadenzeManutResult.value.counters);
      } else {
        setManutScadenzeCounters(null);
      }

      setHomeStats({
        lavoriAperti:
          lavoriResult.status === "fulfilled" ? lavoriResult.value.length : null,
        lavoriUrgenti:
          lavoriResult.status === "fulfilled"
            ? lavoriResult.value.filter((item) => item.urgenza === "alta").length
            : null,
        ordiniInAttesa:
          procurementResult.status === "fulfilled"
            ? procurementResult.value.counts.pendingOrders
            : null,
        ordiniParziali:
          procurementResult.status === "fulfilled"
            ? procurementResult.value.counts.partialOrders
            : null,
        segnalazioniNuove:
          centroResult.status === "fulfilled" ? centroResult.value.counters.segnalazioniOperative : null,
      });
    },
    [],
  );

  useEffect(() => {
    let active = true;

    void loadSnapshot(() => active);

    return () => {
      active = false;
    };
  }, [loadSnapshot]);

  const alertBanner = useMemo(
    () => buildHomeAlertBanner(centroSnapshot, manutScadenzeCounters),
    [centroSnapshot, manutScadenzeCounters],
  );
  const statCards = useMemo<StatCard[]>(
    () => [
      buildMezziAttiviCard(centroSnapshot),
      {
        label: "Manutenzioni da fare",
        value: formatHomeStatValue(homeStats.lavoriAperti),
        detail: formatUrgentLavoriDetail(homeStats.lavoriUrgenti),
      },
      {
        label: "Ordini in attesa",
        value: formatHomeStatValue(homeStats.ordiniInAttesa),
        detail: formatPendingOrdersDetail(homeStats.ordiniParziali),
      },
      {
        label: "Segnalazioni",
        value: formatHomeStatValue(homeStats.segnalazioniNuove),
        detail:
          homeStats.segnalazioniNuove == null
            ? "in caricamento"
            : homeStats.segnalazioniNuove === 0
              ? "nessuna"
              : "da gestire",
        action: "segnalazioni",
      },
    ],
    [centroSnapshot, homeStats],
  );
  const fleetBuckets = useMemo(() => rebucketHomeFleetItems(centroSnapshot), [centroSnapshot]);
  const motriciRows = useMemo(
    () => buildFleetWidgetRows(fleetBuckets.motrici, centroSnapshot),
    [centroSnapshot, fleetBuckets],
  );
  const rimorchiRows = useMemo(
    () => buildFleetWidgetRows(fleetBuckets.rimorchi, centroSnapshot),
    [centroSnapshot, fleetBuckets],
  );
  const inventarioRows = useMemo(
    () => buildInventarioWidgetRows(inventarioSnapshot),
    [inventarioSnapshot],
  );
  const lavoriAlert = useMemo(
    () => buildHomeLavoriAlert(lavoriSnapshot, homeStats),
    [homeStats, lavoriSnapshot],
  );

  const startFleetEdit = (row: FleetRow) => {
    setFleetEdit({
      targa: row.targa,
      luogo: row.luogoRaw || "",
      assetKind: row.assetKind,
      luogoEventId: row.luogoEventId,
      luogoEventIndex: row.luogoEventIndex,
    });
  };

  const cancelFleetEdit = () => {
    setFleetEdit(null);
  };

  const saveFleetEdit = async () => {
    if (!fleetEdit) {
      return;
    }

    setFleetSaving(true);
    try {
      const result = await saveNextHomeLuogoMezzo({
        targa: fleetEdit.targa,
        luogo: fleetEdit.luogo,
        assetKind: fleetEdit.assetKind,
        eventId: fleetEdit.luogoEventId,
        eventIndex: fleetEdit.luogoEventIndex,
      });

      if (!result.ok) {
        const message =
          result.reason === "luogo_mancante"
            ? "Inserisci il luogo del mezzo."
            : result.reason === "targa_mancante"
              ? "Targa mezzo non disponibile."
              : "Storico eventi non leggibile: salvataggio non eseguito.";
        window.alert(message);
        return;
      }

      setFleetEdit(null);
      await loadSnapshot();
    } catch {
      window.alert("Salvataggio luogo non riuscito.");
    } finally {
      setFleetSaving(false);
    }
  };

  const renderFleetMiniDossier = (row: FleetRow) => {
    const sessionLabel = row.sessionActive
      ? `${row.sessionDriver ?? "Autista non indicato"}${row.sessionBadge ? ` (${row.sessionBadge})` : ""}`
      : "no";

    return (
      <div className="next-home__fleet-mini-dossier" role="tooltip">
        <div className="next-home__fleet-mini-photo">
          {row.fotoUrl ? (
            <img src={row.fotoUrl} alt={`Foto mezzo ${row.targa}`} />
          ) : (
            <span>Nessuna foto</span>
          )}
        </div>
        <div className="next-home__fleet-mini-content">
          <div className="next-home__fleet-mini-title">{row.targa}</div>
          <div className="next-home__fleet-mini-row">
            <span>Categoria</span>
            <strong>{formatFleetCategoria(row.categoria)}</strong>
          </div>
          <div className="next-home__fleet-mini-row">
            <span>Autista abituale</span>
            <strong>{row.autistaNome ?? "Non indicato"}</strong>
          </div>
          <div className="next-home__fleet-mini-row">
            <span>Sessione attiva</span>
            <strong>{sessionLabel}</strong>
          </div>
          {row.sessionActive && row.sessionStatus ? (
            <div className="next-home__fleet-mini-row">
              <span>Stato</span>
              <strong>{row.sessionStatus}</strong>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderFleetWidget = (
    rows: FleetRow[],
    emptyText: string,
    expanded: boolean,
    onToggle: () => void,
  ) => {
    if (!rows.length) {
      return <div className="next-home__widget-empty">{emptyText}</div>;
    }

    const visibleRows = expanded ? rows : rows.slice(0, FLEET_PREVIEW_ROWS);

    return (
      <>
        {visibleRows.map((row) => {
      const isEditing = fleetEdit?.targa === row.targa;

      if (isEditing) {
        return (
          <div key={row.targa} className="next-home__fleet-edit-row">
            <div className="next-home__fleet-row-top">
              <div className={`next-home__tone-dot next-home__tone-dot--${row.tone}`} />
              <div className="next-home__fleet-plate-wrap">
                <NavLink to={row.dossierHref} className="next-home__fleet-code next-home__fleet-code--link">
                  {row.targa}
                </NavLink>
                {renderFleetMiniDossier(row)}
              </div>
              <div className="next-home__fleet-main">
                <div className="next-home__fleet-detail">{row.luogo}</div>
                <div className="next-home__fleet-category">{formatFleetCategoria(row.categoria)}</div>
              </div>
              <div className={`next-home__badge next-home__badge--${row.tone}`}>{row.badge}</div>
            </div>
            <div className="next-home__fleet-inline-edit">
              <input
                type="text"
                className="next-home__fleet-inline-input"
                value={fleetEdit?.luogo ?? ""}
                disabled={fleetSaving}
                onChange={(event) =>
                  setFleetEdit((prev) =>
                    prev ? { ...prev, luogo: event.target.value } : prev,
                  )
                }
                placeholder="Inserisci luogo..."
              />
              <div className="next-home__fleet-inline-actions">
                <button
                  type="button"
                  className="next-home__fleet-inline-btn"
                  disabled={fleetSaving}
                  onClick={cancelFleetEdit}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  className="next-home__fleet-inline-btn next-home__fleet-inline-btn--primary"
                  disabled={fleetSaving}
                  onClick={() => {
                    void saveFleetEdit();
                  }}
                >
                  {fleetSaving ? "Salvataggio..." : "Salva"}
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div
          key={row.targa}
          className="next-home__fleet-link-row"
        >
          <div className={`next-home__tone-dot next-home__tone-dot--${row.tone}`} />
          <div className="next-home__fleet-plate-wrap">
            <NavLink to={row.dossierHref} className="next-home__fleet-code next-home__fleet-code--link">
              {row.targa}
            </NavLink>
            {renderFleetMiniDossier(row)}
          </div>
          <div className="next-home__fleet-main">
            <div className="next-home__fleet-detail">{row.luogo}</div>
            <div className="next-home__fleet-category">{formatFleetCategoria(row.categoria)}</div>
          </div>
          <button
            type="button"
            className="next-home__fleet-edit-btn"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              startFleetEdit(row);
            }}
          >
            Modifica
          </button>
          <div className={`next-home__badge next-home__badge--${row.tone}`}>{row.badge}</div>
        </div>
      );
        })}
        {rows.length > FLEET_PREVIEW_ROWS ? (
          <button
            type="button"
            className="next-home__fleet-toggle"
            onClick={onToggle}
          >
            {expanded ? "Mostra meno" : "Mostra tutti"}
          </button>
        ) : null}
      </>
    );
  };

  if (role === "autista") {
    return <Navigate replace to={`${NEXT_AUTISTI_APP_PATH}${location.search || ""}`} />;
  }

  return (
    <main className="next-home">
      <header className="next-home__topbar">
        <h1>Dashboard</h1>
        <div className="next-home__date">{currentDateLabel}</div>
      </header>

      <section className="next-home__stats-grid" aria-label="Statistiche dashboard">
        {statCards.map((card) =>
          card.action === "segnalazioni" ? (
            <button
              key={card.label}
              type="button"
              className="next-home__stat-card next-home__stat-card--button"
              onClick={() => navigate("/next/autisti-admin?module=segnalazioni")}
            >
              <div className="next-home__stat-label">{card.label}</div>
              <div className="next-home__stat-value">{card.value}</div>
              <div className="next-home__stat-detail">{card.detail}</div>
            </button>
          ) : (
            <article key={card.label} className="next-home__stat-card">
              <div className="next-home__stat-label">{card.label}</div>
              <div className="next-home__stat-value">{card.value}</div>
              <div className="next-home__stat-detail">{card.detail}</div>
            </article>
          ),
        )}
      </section>

      {alertBanner ? (
        <section className="next-home__alerts-grid" aria-label="Scadenze e manutenzioni da fare">
          <button
            type="button"
            className={`next-home__alert-card next-home__alert-card--${alertBanner.tone} next-shell__scadenze-banner-trigger`}
            aria-label="Apri scadenze revisioni urgenti"
            aria-live="polite"
            onClick={() => navigate("/next/scadenze-collaudi?mode=urgenti")}
          >
            <div className="next-home__alert-card-head">
              <div className="next-home__alert-card-title-wrap">
                <span
                  className={`next-home__alert-dot next-home__alert-dot--${alertBanner.tone}`}
                  aria-hidden="true"
                />
                <span className="next-home__alert-card-title">Scadenze</span>
              </div>
              <NavLink to="/next/manutenzioni" className="next-home__alert-card-link">
                Apri -&gt;
              </NavLink>
            </div>
            <div className="next-home__alert-card-copy">{alertBanner.text}</div>
          </button>

          <article
            className="next-home__alert-card next-home__alert-card--info"
            aria-label="Apri manutenzioni da fare"
          >
            <div className="next-home__alert-card-head">
              <div className="next-home__alert-card-title-wrap">
                <span className="next-home__alert-dot next-home__alert-dot--info" aria-hidden="true" />
                <span className="next-home__alert-card-title">Manutenzioni da fare</span>
              </div>
              <span className="next-home__alert-card-link">Apri →</span>
            </div>
            <div className="next-home__alert-card-metrics">
              <strong>{lavoriAlert.totalLabel}</strong>
              <span>{lavoriAlert.urgentLabel}</span>
            </div>
            <div className="next-home__alert-list">
              {lavoriAlert.items.length ? (
                lavoriAlert.items.map((row) => (
                  <NavLink
                    key={`${row.title}:${row.detail}`}
                    to={row.href ?? "/next/manutenzioni"}
                    className="next-home__alert-list-row"
                  >
                    <div className="next-home__alert-list-text">
                      <span className="next-home__alert-list-title">{row.title}</span>
                      <span className="next-home__alert-list-detail">{row.detail}</span>
                    </div>
                    <span className={`next-home__badge next-home__badge--${row.tone}`}>{row.badge}</span>
                  </NavLink>
                ))
              ) : (
                <div className="next-home__alert-list-empty">Nessuna manutenzione da fare rilevata</div>
              )}
            </div>
          </article>
        </section>
      ) : null}

      <section className="next-home__ai-card" aria-label="Strumenti IA">
        <div className="next-home__ai-head">
          <div className="next-home__ai-title-wrap">
            <span className="next-home__ai-status-dot" aria-hidden="true" />
            <div className="next-home__ai-title">IA report e Archivista</div>
          </div>
          <div className="next-home__ai-status">due strumenti distinti</div>
        </div>

        <div className="next-home__ai-copy">
          Da qui apri due strumenti diversi: IA Report per domande e report in sola lettura,
          Archivista documenti per caricare file con un flusso guidato.
        </div>

        <div className="next-home__ai-launcher">
          <HomeInternalAiLauncher />
        </div>
      </section>

      <section className="next-home__widgets-grid" aria-label="Widget flotta">
        <article className="next-home__widget">
          <div className="next-home__widget-head">
            <h2>Motrici e trattori</h2>
          </div>
          <div className="next-home__widget-list">
            {renderFleetWidget(
              motriciRows,
              "Nessuna motrice o trattore disponibile",
              motriciExpanded,
              () => setMotriciExpanded((prev) => !prev),
            )}
          </div>
        </article>

        <article className="next-home__widget">
          <div className="next-home__widget-head">
            <h2>Rimorchi</h2>
          </div>
          <div className="next-home__widget-list">
            {renderFleetWidget(
              rimorchiRows,
              "Nessun rimorchio disponibile",
              rimorchiExpanded,
              () => setRimorchiExpanded((prev) => !prev),
            )}
          </div>
        </article>
      </section>

      <section className="next-home__widgets-grid next-home__widgets-grid--single" aria-label="Widget operativi">
        <article className="next-home__widget">
          <div className="next-home__widget-head">
            <h2>Magazzino</h2>
            <NavLink to={NEXT_MAGAZZINO_PATH} className="next-home__widget-link">
              Vai -&gt;
            </NavLink>
          </div>
          <div className="next-home__widget-list next-home__widget-list--tasks">
            {inventarioRows.length ? (
              inventarioRows.map((row) => (
                <div key={row.title} className="next-home__task-row">
                  <div>
                    <div className="next-home__task-title">{row.title}</div>
                    <div className="next-home__task-detail">{row.detail}</div>
                  </div>
                  <div className={`next-home__badge next-home__badge--${row.tone}`}>{row.badge}</div>
                </div>
              ))
            ) : (
              <div className="next-home__widget-empty">Nessun articolo inventario disponibile</div>
            )}
          </div>
        </article>
      </section>

    </main>
  );
}
