import { useEffect, useMemo, useState } from "react";
import { Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import "./next-home.css";
import { getNextRoleFromSearch } from "./nextAccess";
import {
  NEXT_AUTISTI_APP_PATH,
  NEXT_MAGAZZINO_PATH,
} from "./nextStructuralPaths";
import HomeInternalAiLauncher from "./components/HomeInternalAiLauncher";
import {
  readNextCentroControlloSnapshot,
  type D10AssetLocationItem,
  type D10Snapshot,
} from "./domain/nextCentroControlloDomain";
import {
  readNextLavoriInAttesaSnapshot,
  type NextLavoriListaRow,
  type NextLavoriListaSnapshot,
  type NextLavoroUrgenza,
} from "./domain/nextLavoriDomain";
import {
  readNextInventarioSnapshot,
  type NextInventarioSnapshot,
} from "./domain/nextInventarioDomain";
import { readNextProcurementSnapshot } from "./domain/nextProcurementDomain";

type StatCard = {
  label: string;
  value: string;
  detail: string;
};

type StatusTone = "ok" | "warning" | "danger" | "idle" | "info";

type FleetRow = {
  targa: string;
  luogo: string;
  luogoRaw: string;
  categoria: string | null;
  tone: StatusTone;
  badge: string;
};

type FleetEditState = {
  targa: string;
  luogo: string;
};

type TaskRow = {
  title: string;
  detail: string;
  tone: StatusTone;
  badge: string;
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
const PLACEHOLDER_MEZZI_CARD: StatCard = {
  label: "Mezzi attivi",
  value: "12",
  detail: "su 15 totali",
};

const FLEET_ADMIN_PATH = "/next/autisti-admin";

function formatCurrentDate(date: Date) {
  const weekday = new Intl.DateTimeFormat("it-IT", { weekday: "long" }).format(date);
  const day = new Intl.DateTimeFormat("it-IT", { day: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat("it-IT", { month: "short" })
    .format(date)
    .replace(".", "");
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${day} ${month}`;
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

function buildHomeAlertBanner(snapshot: D10Snapshot | null): HomeAlertBanner | null {
  if (!snapshot) {
    return null;
  }

  const { counters } = snapshot;
  const signals = [
    formatAlertSignal(counters.revisioniScadute, "revisione scaduta", "revisioni scadute"),
    formatAlertSignal(counters.revisioniInScadenza, "revisione in scadenza", "revisioni in scadenza"),
    formatAlertSignal(counters.conflittiSessione, "conflitto sessione", "conflitti sessione"),
    formatAlertSignal(counters.segnalazioniNuove, "segnalazione nuova", "segnalazioni nuove"),
    formatAlertSignal(counters.controlliKo, "controllo KO", "controlli KO"),
  ].filter((signal): signal is string => Boolean(signal));

  if (signals.length > 0) {
    return {
      tone: "warning",
      text: signals.slice(0, 2).join(" \u00b7 "),
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
  snapshot: NextLavoriListaSnapshot | null,
  stats: HomeStatsState,
): HomeLavoriAlert {
  const totalLabel =
    stats.lavoriAperti == null
      ? "Lavori in caricamento"
      : stats.lavoriAperti === 0
        ? "Nessun lavoro aperto"
        : `${stats.lavoriAperti} ${stats.lavoriAperti === 1 ? "lavoro aperto" : "lavori aperti"}`;
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

function buildFleetWidgetRows(
  items: D10AssetLocationItem[],
  overrides: Record<string, string>,
): FleetRow[] {
  return items.map((item) => ({
    targa: item.targa,
    luogo: Object.prototype.hasOwnProperty.call(overrides, item.targa)
      ? overrides[item.targa].trim() || "Luogo non impostato"
      : item.luogo,
    luogoRaw: Object.prototype.hasOwnProperty.call(overrides, item.targa)
      ? overrides[item.targa]
      : item.luogoRaw,
    categoria: item.categoria,
    tone: mapAssetStatusTone(item.statusLabel),
    badge: item.statusLabel.toLowerCase(),
  }));
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

function mapLavoroUrgenzaTone(urgenza: NextLavoroUrgenza): StatusTone {
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

function formatLavoroUrgenzaLabel(urgenza: NextLavoroUrgenza): string {
  return urgenza ?? "n.d.";
}

function buildLavoriWidgetRows(snapshot: NextLavoriListaSnapshot | null): TaskRow[] {
  if (!snapshot) {
    return [];
  }

  return snapshot.groups
    .flatMap((group) => group.items)
    .slice(0, 3)
    .map((item: NextLavoriListaRow) => ({
      title: item.descrizione,
      detail: item.mezzoTarga ?? item.targa ?? "MAGAZZINO",
      tone: mapLavoroUrgenzaTone(item.urgenza),
      badge: formatLavoroUrgenzaLabel(item.urgenza),
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
  const [homeStats, setHomeStats] = useState<HomeStatsState>({
    lavoriAperti: null,
    lavoriUrgenti: null,
    ordiniInAttesa: null,
    ordiniParziali: null,
    segnalazioniNuove: null,
  });
  const [lavoriSnapshot, setLavoriSnapshot] = useState<NextLavoriListaSnapshot | null>(null);
  const [inventarioSnapshot, setInventarioSnapshot] = useState<NextInventarioSnapshot | null>(null);
  const [fleetLocationOverrides, setFleetLocationOverrides] = useState<Record<string, string>>({});
  const [fleetEdit, setFleetEdit] = useState<FleetEditState | null>(null);
  const [motriciExpanded, setMotriciExpanded] = useState(false);
  const [rimorchiExpanded, setRimorchiExpanded] = useState(false);

  const openScadenzeModal = (mode: "tutte" | "urgenti") => {
    const params = new URLSearchParams(location.search);
    params.set("scadenze", mode);
    navigate({
      pathname: location.pathname,
      search: params.toString() ? `?${params.toString()}` : "",
    });
  };

  useEffect(() => {
    let active = true;

    const loadSnapshot = async () => {
      const [centroResult, lavoriResult, procurementResult, inventarioResult] = await Promise.allSettled([
        readNextCentroControlloSnapshot(Date.now()),
        readNextLavoriInAttesaSnapshot(),
        readNextProcurementSnapshot(),
        readNextInventarioSnapshot({ includeCloneOverlays: false }),
      ]);

      if (!active) {
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

      setHomeStats({
        lavoriAperti:
          lavoriResult.status === "fulfilled" ? lavoriResult.value.counts.totalLavori : null,
        lavoriUrgenti:
          lavoriResult.status === "fulfilled"
            ? lavoriResult.value.groups.reduce((total, group) => total + group.counts.alta, 0)
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
          centroResult.status === "fulfilled" ? centroResult.value.counters.segnalazioniNuove : null,
      });
    };

    void loadSnapshot();

    return () => {
      active = false;
    };
  }, []);

  const alertBanner = useMemo(() => buildHomeAlertBanner(centroSnapshot), [centroSnapshot]);
  const statCards = useMemo<StatCard[]>(
    () => [
      PLACEHOLDER_MEZZI_CARD,
      {
        label: "Lavori aperti",
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
      },
    ],
    [homeStats],
  );
  const fleetBuckets = useMemo(() => rebucketHomeFleetItems(centroSnapshot), [centroSnapshot]);
  const motriciRows = useMemo(
    () => buildFleetWidgetRows(fleetBuckets.motrici, fleetLocationOverrides),
    [fleetBuckets, fleetLocationOverrides],
  );
  const rimorchiRows = useMemo(
    () => buildFleetWidgetRows(fleetBuckets.rimorchi, fleetLocationOverrides),
    [fleetBuckets, fleetLocationOverrides],
  );
  const lavoriOpenRows = useMemo(() => buildLavoriWidgetRows(lavoriSnapshot), [lavoriSnapshot]);
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
    });
  };

  const cancelFleetEdit = () => {
    setFleetEdit(null);
  };

  const saveFleetEdit = () => {
    if (!fleetEdit) {
      return;
    }

    setFleetLocationOverrides((prev) => ({
      ...prev,
      [fleetEdit.targa]: fleetEdit.luogo.trim(),
    }));
    setFleetEdit(null);
  };

  const openFleetAdmin = () => {
    navigate(FLEET_ADMIN_PATH);
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
              <div className="next-home__fleet-code">{row.targa}</div>
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
                  onClick={cancelFleetEdit}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  className="next-home__fleet-inline-btn next-home__fleet-inline-btn--primary"
                  onClick={saveFleetEdit}
                >
                  Salva
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
          role="link"
          tabIndex={0}
          onClick={openFleetAdmin}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFleetAdmin();
            }
          }}
        >
          <div className={`next-home__tone-dot next-home__tone-dot--${row.tone}`} />
          <div className="next-home__fleet-code">{row.targa}</div>
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
          <span className="next-home__fleet-arrow" aria-hidden="true">
            -&gt;
          </span>
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

      {alertBanner ? (
        <section className="next-home__alerts-grid" aria-label="Scadenze e lavori in attesa">
          <button
            type="button"
            className={`next-home__alert-card next-home__alert-card--${alertBanner.tone} next-shell__scadenze-banner-trigger`}
            aria-label="Apri scadenze revisioni urgenti"
            aria-live="polite"
            onClick={() => openScadenzeModal("urgenti")}
          >
            <div className="next-home__alert-card-head">
              <div className="next-home__alert-card-title-wrap">
                <span
                  className={`next-home__alert-dot next-home__alert-dot--${alertBanner.tone}`}
                  aria-hidden="true"
                />
                <span className="next-home__alert-card-title">Scadenze</span>
              </div>
              <span className="next-home__alert-card-link">Apri →</span>
            </div>
            <div className="next-home__alert-card-copy">{alertBanner.text}</div>
          </button>

          <NavLink
            to="/next/lavori-in-attesa"
            className="next-home__alert-card next-home__alert-card--info"
            aria-label="Apri lavori in attesa"
          >
            <div className="next-home__alert-card-head">
              <div className="next-home__alert-card-title-wrap">
                <span className="next-home__alert-dot next-home__alert-dot--info" aria-hidden="true" />
                <span className="next-home__alert-card-title">Lavori in attesa</span>
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
                  <div key={`${row.title}:${row.detail}`} className="next-home__alert-list-row">
                    <div className="next-home__alert-list-text">
                      <span className="next-home__alert-list-title">{row.title}</span>
                      <span className="next-home__alert-list-detail">{row.detail}</span>
                    </div>
                    <span className={`next-home__badge next-home__badge--${row.tone}`}>{row.badge}</span>
                  </div>
                ))
              ) : (
                <div className="next-home__alert-list-empty">Nessun lavoro in attesa rilevato</div>
              )}
            </div>
          </NavLink>
        </section>
      ) : null}

      <section className="next-home__ai-card" aria-label="Pannello IA interna">
        <div className="next-home__ai-head">
          <div className="next-home__ai-title-wrap">
            <span className="next-home__ai-status-dot" aria-hidden="true" />
            <div className="next-home__ai-title">IA interna</div>
          </div>
          <div className="next-home__ai-status">online &middot; pronta</div>
        </div>

        <div className="next-home__ai-copy">
          Apri la IA interna dal pannello Home per avviare una conversazione rapida, allegare file e
          proseguire nel modal reale della piattaforma NEXT.
        </div>

        <div className="next-home__ai-launcher">
          <HomeInternalAiLauncher />
        </div>
      </section>

      <section className="next-home__stats-grid" aria-label="Statistiche dashboard">
        {statCards.map((card) => (
          <article key={card.label} className="next-home__stat-card">
            <div className="next-home__stat-label">{card.label}</div>
            <div className="next-home__stat-value">{card.value}</div>
            <div className="next-home__stat-detail">{card.detail}</div>
          </article>
        ))}
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

      <section className="next-home__widgets-grid" aria-label="Widget operativi">
        <article className="next-home__widget">
          <div className="next-home__widget-head">
            <h2>Lavori aperti</h2>
            <NavLink to="/next/lavori-in-attesa" className="next-home__widget-link">
              Tutti -&gt;
            </NavLink>
          </div>
          <div className="next-home__widget-list next-home__widget-list--tasks">
            {lavoriOpenRows.length ? (
              lavoriOpenRows.map((row) => (
                <div key={`${row.title}:${row.detail}`} className="next-home__task-row">
                  <div>
                    <div className="next-home__task-title">{row.title}</div>
                    <div className="next-home__task-detail">{row.detail}</div>
                  </div>
                  <div className={`next-home__badge next-home__badge--${row.tone}`}>{row.badge}</div>
                </div>
              ))
            ) : (
              <div className="next-home__widget-empty">Nessun lavoro aperto disponibile</div>
            )}
          </div>
        </article>

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
