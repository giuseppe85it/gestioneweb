import { useMemo } from "react";
import { formatDateTimeUI } from "../nextDateFormat";
import type { HomeEvent } from "../../utils/homeEvents";
import type {
  D10AlertItem,
  D10ImportantAutistiEventItem,
  D10PreCollaudo,
  D10PrenotazioneCollaudo,
  D10RevisionItem,
} from "../domain/nextCentroControlloDomain";

type AlertFilterId = "all" | D10AlertItem["kind"];

type AlertFilterOption = {
  id: AlertFilterId;
  label: string;
  count: number;
};

type HomeAlertCardProps = {
  canExportAlerts: boolean;
  activeFilterId: AlertFilterId;
  filterOptions: AlertFilterOption[];
  getTargaTooltip: (targa: string | null | undefined) => string;
  importantAutistiItems: D10ImportantAutistiEventItem[];
  loading: boolean;
  onExportAlertsPdf: () => void;
  onFilterChange: (filterId: AlertFilterId) => void;
  onOpenAlertItem: (alert: D10AlertItem) => void;
  onOpenImportantEvent: (event: HomeEvent) => void;
  onOpenImportantEventsModal: () => void;
  onOpenPreCollaudoModal: (targa: string, current: D10PreCollaudo | null) => void;
  onOpenRevisionModal: (targa: string, current: D10PrenotazioneCollaudo | null) => void;
  revisionByTarga: Map<string, D10RevisionItem>;
  visibleAlertItems: D10AlertItem[];
};

const ALERT_KIND_LABELS: Record<D10AlertItem["kind"], string> = {
  revisione: "Revisioni",
  conflitto_sessione: "Conflitti sessione",
  segnalazione_nuova: "Segnalazioni",
  eventi_importanti_autisti: "Eventi autisti",
};

const fmtTarga = (value: string | null | undefined): string => String(value || "").trim().toUpperCase();

const getSeverityBadge = (severity: D10AlertItem["severity"]): { className: string; label: string } => {
  if (severity === "danger") return { className: "deadline-danger", label: "URGENTE" };
  if (severity === "warning") return { className: "deadline-medium", label: "ATTENZIONE" };
  return { className: "deadline-low", label: "INFO" };
};

function formatBookingSummary(prenotazione: D10PrenotazioneCollaudo | null): string {
  if (!prenotazione) return "NON PRENOTATO";

  const data = String(prenotazione.data ?? "").trim();
  const ora = String(prenotazione.ora ?? "").trim();
  const luogo = String(prenotazione.luogo ?? "").trim();
  const completata = prenotazione.completata === true;
  const completataIl = String(prenotazione.completataIl ?? "").trim();
  const dataLabel = data ? data : "Data non disponibile";

  if (completata) {
    return `COMPLETATA${completataIl ? ` il ${completataIl}` : ""}`;
  }

  return `${dataLabel}${ora ? ` ${ora}` : ""}${luogo ? ` - ${luogo}` : ""}`;
}

function renderRevisionAlert({
  alert,
  getTargaTooltip,
  onOpenAlertItem,
  onOpenPreCollaudoModal,
  onOpenRevisionModal,
  revisionByTarga,
}: {
  alert: D10AlertItem;
  getTargaTooltip: (targa: string | null | undefined) => string;
  onOpenAlertItem: (alert: D10AlertItem) => void;
  onOpenPreCollaudoModal: (targa: string, current: D10PreCollaudo | null) => void;
  onOpenRevisionModal: (targa: string, current: D10PrenotazioneCollaudo | null) => void;
  revisionByTarga: Map<string, D10RevisionItem>;
}) {
  const badge = getSeverityBadge(alert.severity);
  const targa = fmtTarga(alert.mezzoTarga);
  const revision = targa ? revisionByTarga.get(targa) ?? null : null;
  const tooltip = getTargaTooltip(alert.mezzoTarga);
  const prenotazione = revision?.prenotazioneCollaudo ?? null;
  const preCollaudo = revision?.preCollaudo ?? null;
  const hasPreCollaudo = Boolean(preCollaudo);
  const giorniLabel =
    revision?.giorni === null || revision?.giorni === undefined
      ? "-"
      : `${revision.giorni > 0 ? "+" : ""}${revision.giorni}g`;
  const revisionDays = revision?.giorni ?? null;
  const statusLabel =
    alert.title ||
    (revisionDays !== null
      ? revisionDays < 0
        ? "Revisione scaduta"
        : "Revisione in scadenza"
      : "Revisione");
  const prenSummary = formatBookingSummary(prenotazione);
  const prenNote = String(prenotazione?.note ?? prenotazione?.noteEsito ?? "").trim();
  const prenNoteShort = prenNote ? prenNote.slice(0, 70) : "";
  const prenCompletata = prenotazione?.completata === true;

  return (
    <div
      key={alert.id}
      className="panel-row panel-row-link"
      role="button"
      tabIndex={0}
      onClick={() => onOpenAlertItem(alert)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenAlertItem(alert);
        }
      }}
    >
      <div className="row-main">
        <div className="row-title">
          <span
            className="targa"
            title={tooltip || undefined}
            style={{ fontSize: "18px", fontWeight: 700 }}
          >
            {targa || alert.title || "-"}
          </span>
          <span
            className={`status ${badge.className}`}
            style={{ fontSize: "12px", fontWeight: 600 }}
          >
            {alert.mezzoTarga ? giorniLabel : badge.label}
          </span>
        </div>
        <div className="row-meta row-meta-stack">
          <div className="row-meta-line" style={{ fontSize: "14px" }}>
            <span className="label">Stato:</span> <strong>{statusLabel}</strong>
          </div>
          <div className="row-meta-line" style={{ fontSize: "14px" }}>
            <span className="label">Scadenza:</span>{" "}
            <span>{alert.dateLabel || "-"}</span>
          </div>
          <div className="row-meta-line" style={{ fontSize: "14px" }}>
            <span className="label">Mezzo:</span>{" "}
            <span>{[revision?.marca, revision?.modello].filter(Boolean).join(" ") || "-"}</span>
          </div>
          <div className="row-meta-line row-meta-booking">
            <span className="label">Prenotazione collaudo:</span>
            {prenotazione ? (
              <span className="booking-value">
                {prenSummary}
                {!prenCompletata && prenNoteShort ? (
                  <span className="booking-note"> - {prenNoteShort}</span>
                ) : null}
              </span>
            ) : (
              <span className="booking-missing">NON PRENOTATO</span>
            )}
          </div>
          <div className="row-meta-line row-meta-booking">
            <span className="label">Pre-collaudo:</span>
            {hasPreCollaudo ? (
              <span className="booking-value">
                <span className="badge">Pre-collaudo programmato</span>
              </span>
            ) : (
              <span className="booking-missing">DA ORGANIZZARE</span>
            )}
          </div>
          <div className="row-meta-line row-meta-booking">
            <span className="booking-actions">
              {!prenCompletata ? (
                <button
                  type="button"
                  className="booking-action primary"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenRevisionModal(alert.mezzoTarga || "", prenotazione);
                  }}
                >
                  SEGNA REVISIONE FATTA
                </button>
              ) : null}
              {alert.mezzoTarga ? (
                <button
                  type="button"
                  className="booking-action"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenPreCollaudoModal(alert.mezzoTarga || "", preCollaudo);
                  }}
                >
                  {hasPreCollaudo ? "MODIFICA" : "PRE-COLLAUDO"}
                </button>
              ) : null}
            </span>
          </div>
        </div>
      </div>
      <span className="row-arrow">-&gt;</span>
    </div>
  );
}

function renderImportantEventsAlert({
  alert,
  importantAutistiItems,
  onOpenImportantEvent,
  onOpenImportantEventsModal,
}: {
  alert: D10AlertItem;
  importantAutistiItems: D10ImportantAutistiEventItem[];
  onOpenImportantEvent: (event: HomeEvent) => void;
  onOpenImportantEventsModal: () => void;
}) {
  const badge = getSeverityBadge(alert.severity);
  const topItems = importantAutistiItems.slice(0, 5);
  const remaining = importantAutistiItems.length - topItems.length;
  const summaryLabel = alert.title || `Eventi importanti autisti (${importantAutistiItems.length})`;

  return (
    <div key={alert.id} className={`alert-row alert-${alert.severity}`}>
      <div className="alert-main">
        <div className="alert-title">
          <span className="alert-title-text">{summaryLabel}</span>
          <span className={`status ${badge.className}`}>{badge.label}</span>
        </div>
        <div className="alert-detail">
          {topItems.map((item) => (
            <div
              key={item.id}
              className="alert-detail-row"
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => onOpenImportantEvent(item.event)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpenImportantEvent(item.event);
                }
              }}
              >
              <span className="targa">{item.targa || "-"}</span>
              <span className="alert-detail">{formatDateTimeUI(item.ts)}</span>
              <span className="alert-detail">{item.tipo}</span>
              <span className="alert-detail">{item.preview || "-"}</span>
              <span className="row-arrow">-&gt;</span>
            </div>
          ))}
          {remaining > 0 ? (
            <div className="alert-detail-row">
              <span className="alert-detail">+{remaining} altri eventi</span>
            </div>
          ) : null}
          {importantAutistiItems.length > 5 ? (
            <div className="alert-detail-row">
              <button type="button" className="alert-action" onClick={onOpenImportantEventsModal}>
                Vedi tutto
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function renderGenericAlert({
  alert,
  getTargaTooltip,
  onOpenAlertItem,
}: {
  alert: D10AlertItem;
  getTargaTooltip: (targa: string | null | undefined) => string;
  onOpenAlertItem: (alert: D10AlertItem) => void;
}) {
  const badge = getSeverityBadge(alert.severity);
  const alertTarga = fmtTarga(alert.mezzoTarga);
  const tooltip = getTargaTooltip(alert.mezzoTarga);
  const detailText =
    alertTarga && alert.detailText.startsWith(`${alertTarga} |`)
      ? alert.detailText.slice(alertTarga.length + 3)
      : alert.detailText;
  const actionLabel =
    alert.kind === "segnalazione_nuova"
      ? "Apri dettaglio segnalazione"
      : alert.kind === "conflitto_sessione"
      ? "Apri sezione collegata"
      : "Apri dettaglio";

  return (
    <div
      key={alert.id}
      className="panel-row panel-row-link"
      role="button"
      tabIndex={0}
      onClick={() => onOpenAlertItem(alert)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenAlertItem(alert);
        }
      }}
    >
      <div className="row-main">
        <div className="row-title">
          {alertTarga ? (
            <span
              className="targa"
              title={tooltip || undefined}
              style={{ fontSize: "18px", fontWeight: 700 }}
            >
              {alertTarga}
            </span>
          ) : (
            <span style={{ fontSize: "18px", fontWeight: 700 }}>{alert.title}</span>
          )}
          <span
            className={`status ${badge.className}`}
            style={{ fontSize: "12px", fontWeight: 600 }}
          >
            {badge.label}
          </span>
        </div>
        <div className="row-meta row-meta-stack">
          {alertTarga ? (
            <div className="row-meta-line" style={{ fontSize: "14px" }}>
              <span className="label">Tipo:</span>{" "}
              <strong>{ALERT_KIND_LABELS[alert.kind]}</strong>
            </div>
          ) : null}
          <div className="row-meta-line" style={{ fontSize: "14px" }}>
            <span className="label">Dettaglio:</span> <span>{detailText}</span>
          </div>
          {alert.dateLabel ? (
            <div className="row-meta-line" style={{ fontSize: "14px" }}>
              <span className="label">Data:</span> <span>{alert.dateLabel}</span>
            </div>
          ) : null}
          {alert.targetRoute && alert.kind === "conflitto_sessione" ? (
            <div className="row-meta-line" style={{ fontSize: "14px" }}>
              <span className="label">Azione:</span> <span>{actionLabel}</span>
            </div>
          ) : null}
          {alert.kind === "segnalazione_nuova" ? (
            <div className="row-meta-line" style={{ fontSize: "14px" }}>
              <span className="label">Azione:</span> <span>{actionLabel}</span>
            </div>
          ) : null}
        </div>
      </div>
      <span className="row-arrow">-&gt;</span>
    </div>
  );
}

export default function HomeAlertCard({
  canExportAlerts,
  activeFilterId,
  filterOptions,
  getTargaTooltip,
  importantAutistiItems,
  loading,
  onExportAlertsPdf,
  onFilterChange,
  onOpenAlertItem,
  onOpenImportantEvent,
  onOpenImportantEventsModal,
  onOpenPreCollaudoModal,
  onOpenRevisionModal,
  revisionByTarga,
  visibleAlertItems,
}: HomeAlertCardProps) {
  const renderedAlerts = useMemo(
    () =>
      visibleAlertItems.map((alert) => {
        if (alert.kind === "eventi_importanti_autisti") {
          return renderImportantEventsAlert({
            alert,
            importantAutistiItems,
            onOpenImportantEvent,
            onOpenImportantEventsModal,
          });
        }

        if (alert.kind === "revisione") {
          return renderRevisionAlert({
            alert,
            getTargaTooltip,
            onOpenAlertItem,
            onOpenPreCollaudoModal,
            onOpenRevisionModal,
            revisionByTarga,
          });
        }

        return renderGenericAlert({
          alert,
          getTargaTooltip,
          onOpenAlertItem,
        });
      }),
    [
      getTargaTooltip,
      importantAutistiItems,
      onOpenAlertItem,
      onOpenImportantEvent,
      onOpenImportantEventsModal,
      onOpenPreCollaudoModal,
      onOpenRevisionModal,
      revisionByTarga,
      visibleAlertItems,
    ],
  );

  return (
    <section
      className="panel panel-alerts home-card home-top-equal-card"
      style={{ animationDelay: "20ms" }}
    >
      <div className="panel-head home-card__head home-top-equal-card__head">
        <div>
          <h2 className="home-card__title">ALERT</h2>
          <span className="home-card__subtitle">
            Revisioni, segnalazioni, eventi autisti e conflitti filtrabili
          </span>
        </div>
        <button
          type="button"
          className="alert-action"
          onClick={onExportAlertsPdf}
          disabled={!canExportAlerts}
        >
          ESPORTA PDF
        </button>
      </div>
      <div className="panel-body alerts-list home-card__body home-top-equal-card__body">
        <div className="panel-stats alert-filter-bar home-alert-card__filters">
          {filterOptions.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`stat-chip alert-filter-chip ${
                activeFilterId === filter.id ? "is-active" : ""
              }`}
              onClick={() => onFilterChange(filter.id)}
            >
              <span className="stat-label">{filter.label}</span>
              <span className="stat-value">{filter.count}</span>
            </button>
          ))}
        </div>

        <div className="panel-body home-alert-card__list">
          {loading ? (
            <div className="panel-row panel-row-empty">Caricamento alert...</div>
          ) : visibleAlertItems.length === 0 ? (
            <div className="panel-row panel-row-empty">
              Nessun alert per il filtro selezionato
            </div>
          ) : (
            renderedAlerts
          )}
        </div>
      </div>
    </section>
  );
}
