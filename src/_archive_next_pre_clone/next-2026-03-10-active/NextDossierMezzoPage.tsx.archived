import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  NEXT_ROLE_PRESETS,
  buildNextPathWithRole,
  getNextRoleFromSearch,
} from "./nextAccess";
import { NEXT_AREAS } from "./nextData";
import { normalizeNextMezzoTarga, type NextMezzoListItem } from "./nextAnagraficheFlottaDomain";
import {
  type NextMaintenanceHistoryItem,
  type NextScheduledMaintenance,
  type NextScheduledMaintenanceStatus,
} from "./domain/nextManutenzioniDomain";
import {
  type NextDossierMezzoCompositeSnapshot,
  readNextDossierMezzoCompositeSnapshot,
} from "./domain/nextDossierMezzoDomain";
import {
  type NextMezzoRifornimentiSnapshot,
  type NextRifornimentoFieldQuality,
  type NextRifornimentoMatchStrategy,
  type NextRifornimentoProvenienza,
  type NextRifornimentoReadOnlyItem,
} from "./nextRifornimentiConsumiDomain";
import {
  type NextDocumentiCostiCurrency,
  type NextDocumentiCostiReadOnlyItem,
  type NextMezzoDocumentiCostiSnapshot,
} from "./domain/nextDocumentiCostiDomain";

const INTEGER_FORMATTER = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 0,
});

const LITERS_FORMATTER = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const CURRENCY_FORMATTER = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const CHF_CURRENCY_FORMATTER = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "CHF",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const DECIMAL_FORMATTER = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function renderMarcaModello(item: NextMezzoListItem) {
  const value = [item.marca, item.modello].filter(Boolean).join(" ");
  return value || "Marca / modello non valorizzati";
}

function renderOptionalLabel(
  value: string | null,
  fallback: string = "Dato non valorizzato"
) {
  return value || fallback;
}

function formatIntegerValue(value: number | null): string {
  return value === null ? "--" : INTEGER_FORMATTER.format(value);
}

function formatLitriValue(value: number | null): string {
  return value === null ? "--" : LITERS_FORMATTER.format(value);
}

function formatCurrencyValue(value: number | null): string {
  return value === null ? "--" : CURRENCY_FORMATTER.format(value);
}

function formatDocumentAmountValue(
  value: number | null,
  currency: NextDocumentiCostiCurrency
): string {
  if (value === null) return "--";
  if (currency === "CHF") return CHF_CURRENCY_FORMATTER.format(value);
  if (currency === "EUR") return CURRENCY_FORMATTER.format(value);
  return `${DECIMAL_FORMATTER.format(value)} (valuta da verificare)`;
}

function renderLavoroMeta(item: { dataInserimento: string | null }) {
  return item.dataInserimento
    ? `Inserito ${item.dataInserimento}`
    : "Lavoro tecnico senza data inserimento valorizzata.";
}

function renderRefuelStatusLabel(
  status: "idle" | "loading" | "success" | "error",
  snapshot: NextMezzoRifornimentiSnapshot | null
) {
  switch (status) {
    case "loading":
      return "Caricamento rifornimenti";
    case "success":
      if (!snapshot) return "In attesa";
      if (snapshot.counts.total > 0) return "Rifornimenti disponibili";
      if (
        snapshot.datasetShapes.business === "missing" &&
        snapshot.datasetShapes.field === "missing"
      ) {
        return "Dati rifornimenti assenti";
      }
      if (
        snapshot.datasetShapes.business === "unsupported" &&
        snapshot.datasetShapes.field === "unsupported"
      ) {
        return "Formato dati non leggibile";
      }
      return "Nessun rifornimento per mezzo";
    case "error":
      return "Rifornimenti non disponibili";
    default:
      return "In attesa";
  }
}

function renderDocumentCostStatusLabel(
  status: "idle" | "loading" | "success" | "error",
  snapshot: NextMezzoDocumentiCostiSnapshot | null
) {
  switch (status) {
    case "loading":
      return "Caricamento documenti";
    case "success":
      if (!snapshot) return "In attesa";
      if (snapshot.counts.total > 0) return "Documenti disponibili";
      if (snapshot.datasetShapes.costiMezzo === "missing") {
        return "Dati costi assenti";
      }
      if (snapshot.datasetShapes.costiMezzo === "unsupported") {
        return "Formato dati non leggibile";
      }
      return "Nessun documento o costo per mezzo";
    case "error":
      return "Documenti non disponibili";
    default:
      return "In attesa";
  }
}

function renderRefuelQualityLabel(value: NextRifornimentoFieldQuality) {
  switch (value) {
    case "certo":
      return "dato certo";
    case "ricostruito":
      return "dato ricostruito";
    default:
      return "non disponibile";
  }
}

function renderRefuelProvenienzaLabel(value: NextRifornimentoProvenienza) {
  switch (value) {
    case "business":
      return "Business";
    case "campo":
      return "Campo";
    default:
      return "Ricostruito";
  }
}

function renderRefuelMatchLabel(value: NextRifornimentoMatchStrategy) {
  switch (value) {
    case "match_origin_id":
      return "Match origin id";
    case "match_euristica_10_minuti":
      return "Match euristico 10 min";
    case "match_euristica_stesso_giorno":
      return "Match euristico giorno";
    case "solo_campo":
      return "Solo feed campo";
    default:
      return "Solo business";
  }
}

function renderRifornimentoMeta(item: NextRifornimentoReadOnlyItem) {
  const parts = [
    item.dataDisplay ? `Data ${item.dataDisplay}` : "Data non disponibile",
    item.litri !== null ? `${formatLitriValue(item.litri)} L` : null,
    item.autistaNome
      ? `Autista ${item.autistaNome}${item.badgeAutista ? ` (${item.badgeAutista})` : ""}`
      : item.badgeAutista
      ? `Badge ${item.badgeAutista}`
      : null,
  ].filter(Boolean);

  return parts.join(" | ");
}

function renderDocumentTotalsSummary(
  totals: NextMezzoDocumentiCostiSnapshot["totals"]["preventivi"] | null
) {
  if (!totals || totals.withAmount === 0) {
    return "Totali prudenziali non disponibili";
  }

  const parts = [];
  if (totals.eur > 0) parts.push(CURRENCY_FORMATTER.format(totals.eur));
  if (totals.chf > 0) parts.push(CHF_CURRENCY_FORMATTER.format(totals.chf));
  if (totals.unknownCount > 0) {
    parts.push(`valuta da verificare: ${formatIntegerValue(totals.unknownCount)}`);
  }

  return parts.join(" | ");
}

function renderDocumentCostMeta(item: NextDocumentiCostiReadOnlyItem) {
  const parts = [
    item.dateLabel ? `Data ${item.dateLabel}` : "Data non disponibile",
    item.supplier ? `Fornitore ${item.supplier}` : null,
    `Origine ${item.sourceLabel}`,
  ].filter(Boolean);

  return parts.join(" | ");
}

function renderDocumentCostReadOnlyCard(item: NextDocumentiCostiReadOnlyItem) {
  return (
    <div key={item.id} className="next-control-list__item">
      <div className="next-global-pillbar">
        <span
          className={
            item.category === "fattura"
              ? "next-chip next-chip--warning"
              : item.category === "preventivo"
              ? "next-chip next-chip--accent"
              : "next-chip next-chip--success"
          }
        >
          {item.documentTypeLabel}
        </span>
        <span className="next-chip next-chip--subtle">{item.sourceLabel}</span>
        <span className="next-chip next-chip--subtle">
          {item.amount !== null
            ? formatDocumentAmountValue(item.amount, item.currency)
            : "importo non disponibile"}
        </span>
      </div>
      <strong>{item.title}</strong>
      <span>{renderDocumentCostMeta(item)}</span>
      <span>
        File: {item.fileUrl ? "presente" : "non disponibile"}
        {" | "}Importo: {item.fieldQuality.amount === "non_disponibile" ? "non leggibile" : item.fieldQuality.amount}
        {" | "}Data: {item.fieldQuality.date === "non_disponibile" ? "non leggibile" : item.fieldQuality.date}
      </span>
    </div>
  );
}

function renderScheduledMaintenanceStatusLabel(value: NextScheduledMaintenanceStatus) {
  switch (value) {
    case "scaduta":
      return "Scaduta";
    case "in_scadenza":
      return "In scadenza";
    case "pianificata":
      return "Pianificata";
    case "data_mancante":
      return "Data mancante";
    default:
      return "Non attiva";
  }
}

function getScheduledMaintenanceToneClassName(value: NextScheduledMaintenanceStatus) {
  switch (value) {
    case "scaduta":
      return "next-chip next-chip--warning";
    case "in_scadenza":
      return "next-chip next-chip--accent";
    case "pianificata":
      return "next-chip next-chip--success";
    case "data_mancante":
      return "next-chip next-chip--warning";
    default:
      return "next-chip next-chip--subtle";
  }
}

function renderScheduledMaintenanceMeta(item: NextScheduledMaintenance) {
  if (!item.enabled) {
    return "Nessuna pianificazione manutentiva attiva sul mezzo.";
  }

  if (item.daysToDeadline === null) {
    return item.status === "data_mancante"
      ? "La pianificazione e attiva ma non ha una data fine parsabile."
      : "Pianificazione attiva senza scadenza calcolabile.";
  }

  if (item.daysToDeadline < 0) {
    const days = Math.abs(item.daysToDeadline);
    return `Scaduta da ${formatIntegerValue(days)} giorni.`;
  }

  return `Scadenza tra ${formatIntegerValue(item.daysToDeadline)} giorni.`;
}

function renderMaintenanceHistoryMeta(item: NextMaintenanceHistoryItem) {
  const parts = [
    item.dataRaw ? `Data ${item.dataRaw}` : "Data non disponibile",
    item.tipo ? `Tipo ${item.tipo}` : null,
    item.km !== null ? `${formatIntegerValue(item.km)} km` : null,
    item.ore !== null ? `${formatIntegerValue(item.ore)} h` : null,
    item.materialiCount > 0 ? `Materiali ${formatIntegerValue(item.materialiCount)}` : null,
    item.eseguitoLabel ? `Eseguito ${item.eseguitoLabel}` : null,
  ].filter(Boolean);

  return parts.join(" | ");
}

function renderRefuelReadOnlyCard(item: NextRifornimentoReadOnlyItem) {
  return (
    <div key={item.id} className="next-control-list__item">
      <div className="next-global-pillbar">
        <span className="next-chip next-chip--success">
          {renderRefuelProvenienzaLabel(item.provenienza)}
        </span>
        <span className="next-chip next-chip--accent">
          {item.dataDisplay ?? "Data non disponibile"}
        </span>
        <span className="next-chip next-chip--subtle">
          {item.litri !== null ? `${formatLitriValue(item.litri)} L` : "Litri non disponibili"}
        </span>
        <span className="next-chip next-chip--subtle">
          {item.km !== null ? `${formatIntegerValue(item.km)} km` : "km non disponibile"}
        </span>
        <span className="next-chip next-chip--subtle">
          {item.costo !== null ? formatCurrencyValue(item.costo) : "costo non disponibile"}
        </span>
        <span className="next-chip next-chip--subtle">
          {renderRefuelMatchLabel(item.matchStrategy)}
        </span>
      </div>
      <strong>{renderOptionalLabel(item.distributore, "Distributore non valorizzato")}</strong>
      <span>{renderRifornimentoMeta(item)}</span>
      <span>{renderOptionalLabel(item.note, "Nessuna nota disponibile.")}</span>
      <span>
        Timestamp:{" "}
        {item.timestampRicostruito !== null
          ? renderRefuelQualityLabel(item.fieldQuality.timestampRicostruito)
          : "non disponibile"}
        {" | "}
        Autista: {renderRefuelQualityLabel(item.fieldQuality.autistaNome)}
        {" | "}
        KM: {renderRefuelQualityLabel(item.fieldQuality.km)}
        {" | "}
        Costo: {renderRefuelQualityLabel(item.fieldQuality.costo)}
      </span>
    </div>
  );
}

function NextDossierMezzoPage() {
  const { targa: routeTarga } = useParams();
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const area = NEXT_AREAS["mezzi-dossier"];
  const normalizedTarga = normalizeNextMezzoTarga(routeTarga);

  const [dossierSnapshot, setDossierSnapshot] =
    useState<NextDossierMezzoCompositeSnapshot | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "not-found">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [showAllMaintenance, setShowAllMaintenance] = useState(false);
  const [showAllRefuels, setShowAllRefuels] = useState(false);

  const listPath = buildNextPathWithRole("/next/mezzi-dossier", role, location.search);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!normalizedTarga) {
        setStatus("error");
        setError("Parametro targa non valido per il Dossier NEXT.");
        setDossierSnapshot(null);
        setShowAllMaintenance(false);
        setShowAllRefuels(false);
        return;
      }

      try {
        setStatus("loading");
        setError(null);
        setDossierSnapshot(null);
        setShowAllMaintenance(false);
        setShowAllRefuels(false);

        const snapshot = await readNextDossierMezzoCompositeSnapshot(normalizedTarga);
        if (!active) return;

        if (!snapshot) {
          setStatus("not-found");
          setError(
            `Il mezzo ${normalizedTarga} non e presente nel dataset canonico di identita mezzo.`
          );
          return;
        }

        setDossierSnapshot(snapshot);
        setStatus("success");
      } catch {
        if (!active) return;

        setStatus("error");
        setError("Impossibile leggere il Dossier NEXT dal layer mezzo-centrico.");
        setDossierSnapshot(null);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [normalizedTarga]);

  const mezzo = dossierSnapshot?.mezzo ?? null;
  const overview = dossierSnapshot?.overview ?? null;
  const technicalState = dossierSnapshot?.technical ?? {
    status: "idle",
    snapshot: null,
    error: null,
  };
  const maintenanceState = dossierSnapshot?.maintenance ?? {
    status: "idle",
    snapshot: null,
    error: null,
  };
  const refuelState = dossierSnapshot?.refuels ?? {
    status: "idle",
    snapshot: null,
    error: null,
  };
  const documentCostsState = dossierSnapshot?.documentCosts ?? {
    status: "idle",
    snapshot: null,
    error: null,
  };

  const technicalSnapshot = technicalState.snapshot;
  const maintenanceSnapshot = maintenanceState.snapshot;
  const refuelSnapshot = refuelState.snapshot;
  const documentCostsSnapshot = documentCostsState.snapshot;

  const lavoriAperti = technicalSnapshot?.lavoriAperti ?? [];
  const lavoriChiusi = technicalSnapshot?.lavoriChiusi ?? [];
  const lavoriApertiPreview = lavoriAperti.slice(0, 3);
  const lavoriChiusiPreview = lavoriChiusi.slice(0, 3);

  const scheduledMaintenance = maintenanceSnapshot?.scheduledMaintenance ?? null;
  const maintenanceHistory = maintenanceSnapshot?.historyItems ?? [];
  const maintenanceHistoryPreview = maintenanceHistory.slice(0, 3);
  const maintenanceCounts = maintenanceSnapshot?.counts ?? null;
  const hasMaintenanceFullView = maintenanceHistory.length > maintenanceHistoryPreview.length;

  const refuels = refuelSnapshot?.items ?? [];
  const refuelsPreview = refuels.slice(0, 5);
  const hasRefuelFullView = refuels.length > refuelsPreview.length;
  const preventiviPreview = documentCostsSnapshot?.groups.preventivi.slice(0, 3) ?? [];
  const fatturePreview = documentCostsSnapshot?.groups.fatture.slice(0, 3) ?? [];
  const documentiUtiliPreview = documentCostsSnapshot?.groups.documentiUtili.slice(0, 3) ?? [];
  const dossierStatusItems = [
    "scheda mezzo unica con dati principali gia leggibili",
    "lavori, manutenzioni, rifornimenti e documenti restano nello stesso contesto",
    "nessuna modifica dati e nessun workflow tecnico portato qui dentro",
    "Mezzo360 resta fuori da questa vista e verra deciso separatamente",
  ];
  const supportToneClassName = (tone: "accent" | "success" | "warning" | "default") =>
    tone === "accent"
      ? "next-panel next-panel--secondary next-tone next-tone--accent"
      : tone === "success"
      ? "next-panel next-panel--secondary next-tone next-tone--success"
      : tone === "warning"
      ? "next-panel next-panel--secondary next-tone next-tone--warning"
      : "next-panel next-panel--secondary";

  return (
    <section className="next-page next-dossier-shell">
      <header className="next-page__hero">
        <div>
          <Link className="next-back-link" to={listPath}>
            Torna all&apos;elenco mezzi
          </Link>
          <p className="next-page__eyebrow">{area.eyebrow}</p>
          <h1>{mezzo ? `Dossier ${mezzo.targa}` : "Dossier mezzo"}</h1>
          <p className="next-page__description">
            Quadro unico del mezzo: dati principali, stato tecnico, manutenzioni, rifornimenti e
            documenti gia leggibili nella stessa scheda.
          </p>
        </div>

        <div className="next-page__meta">
          <span className="next-chip next-chip--success">Sola lettura</span>
          <span className="next-chip next-chip--subtle">
            Ruolo simulato: {NEXT_ROLE_PRESETS[role].shortLabel}
          </span>
          <span className="next-chip next-chip--accent">
            {overview?.statusLabel ?? "Quadro mezzo in caricamento"}
          </span>
          <span className="next-chip next-chip--warning">Nessuna scrittura</span>
        </div>
      </header>

      {status === "loading" ? (
        <div className="next-data-state next-tone next-tone--accent">
          <strong>Caricamento Dossier mezzo</strong>
          <span>Sto preparando la scheda completa del mezzo.</span>
        </div>
      ) : null}

      {status === "error" || status === "not-found" ? (
        <div className="next-data-state next-tone next-tone--warning">
          <strong>Dossier non disponibile</strong>
          <span>{error}</span>
          <Link className="next-inline-link" to={listPath}>
            Torna all&apos;elenco mezzi
          </Link>
        </div>
      ) : null}

      {status === "success" && mezzo && overview ? (
        <>
          <section className="next-dossier-actionbar">
            <Link className="next-action-link" to={listPath}>
              Mezzi
            </Link>
            <a className="next-action-link" href="#lavori">
              Lavori
            </a>
            <a className="next-action-link" href="#manutenzioni">
              Manutenzioni
            </a>
            <a className="next-action-link" href="#materiali">
              Materiali
            </a>
            <a className="next-action-link" href="#rifornimenti">
              Rifornimenti
            </a>
            <a className="next-action-link" href="#documenti">
              Documenti e costi
            </a>
          </section>

          <section className="next-dossier-hero-card next-tone">
            <div className="next-dossier-hero-card__main">
              <div className="next-panel__header">
                <div>
                  <p className="next-page__eyebrow">Dati tecnici</p>
                  <h2>{mezzo.targa}</h2>
                </div>
                <Link className="next-inline-link" to={listPath}>
                  Elenco mezzi
                </Link>
              </div>
              <p className="next-panel__description">
                Scheda tecnica del mezzo con dati principali e stato generale gia leggibile.
              </p>

              <div className="next-dossier-hero-card__identity">
                <div className="next-dossier-map__row">
                  <strong>Targa</strong>
                  <span>{mezzo.targa}</span>
                </div>
                <div className="next-dossier-map__row">
                  <strong>Marca / modello</strong>
                  <span>{renderMarcaModello(mezzo)}</span>
                </div>
                <div className="next-dossier-map__row">
                  <strong>Categoria</strong>
                  <span>{mezzo.categoria}</span>
                </div>
                <div className="next-dossier-map__row">
                  <strong>Autista anagrafico</strong>
                  <span>{mezzo.autistaNome ?? "Non valorizzato"}</span>
                </div>
              </div>
            </div>

            <div className="next-dossier-hero-card__side">
              <div className="next-data-state next-tone next-tone--accent">
                <strong>Stato scheda</strong>
                <span>{overview.statusMeta}</span>
              </div>
              <div className="next-control-list">
                {overview.keySignals.map((item) => (
                  <div key={item} className="next-control-list__item next-control-list__item--soft">
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="lavori" className="next-panel next-dossier-section-card next-tone next-tone--accent">
              <div className="next-panel__header">
                <h2>Lavori</h2>
              </div>
              <p className="next-panel__description">
                Lavori aperti ed eseguiti del mezzo.
              </p>

              {technicalState.status === "error" ? (
                <div className="next-data-state next-tone next-tone--warning">
                  <strong>Blocco lavori non disponibile</strong>
                  <span>{technicalState.error}</span>
                </div>
              ) : null}

              {technicalState.status === "success" ? (
                <>
                  <div className="next-dossier-section-intro">
                    <article className="next-data-state next-tone">
                      <strong>Quadro lavori</strong>
                      <span>
                        Lavori aperti: {formatIntegerValue(technicalSnapshot?.counts.lavoriAperti ?? null)}
                        {" | "}Lavori chiusi: {formatIntegerValue(technicalSnapshot?.counts.lavoriChiusi ?? null)}
                      </span>
                    </article>
                  </div>
                  <div className="next-inline-grid">
                    <article className="next-inline-panel">
                      <h3>Lavori aperti</h3>
                      <p>Backlog tecnico del mezzo da aprire per primo.</p>
                      {technicalState.status !== "success" || lavoriApertiPreview.length === 0 ? (
                        <div className="next-data-state">
                          <strong>Nessun lavoro aperto</strong>
                          <span>
                            {technicalState.status === "success"
                              ? "Non risultano lavori aperti per questa targa."
                              : "Il backlog aperto non e disponibile nel quadro attuale."}
                          </span>
                        </div>
                      ) : (
                        <div className="next-control-list">
                          {lavoriApertiPreview.map((item) => (
                            <div key={item.id} className="next-control-list__item">
                              <div className="next-global-pillbar">
                                <span className="next-chip next-chip--accent">Aperto</span>
                                {item.urgenza ? (
                                  <span className="next-chip next-chip--warning">
                                    Urgenza {item.urgenza}
                                  </span>
                                ) : null}
                              </div>
                              <strong>{renderOptionalLabel(item.descrizione)}</strong>
                              <span>{renderLavoroMeta(item)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>

                    <article className="next-inline-panel">
                      <h3>Lavori chiusi</h3>
                      <p>Ultimi esiti tecnici gia chiusi sul mezzo.</p>
                      {technicalState.status !== "success" || lavoriChiusiPreview.length === 0 ? (
                        <div className="next-data-state">
                          <strong>Nessun lavoro chiuso</strong>
                          <span>
                            {technicalState.status === "success"
                              ? "Non risultano lavori chiusi per questa targa."
                              : "Il riepilogo lavori chiusi non e disponibile nel quadro attuale."}
                          </span>
                        </div>
                      ) : (
                        <div className="next-control-list">
                          {lavoriChiusiPreview.map((item) => (
                            <div key={item.id} className="next-control-list__item">
                              <div className="next-global-pillbar">
                                <span className="next-chip next-chip--success">Eseguito</span>
                              </div>
                              <strong>{renderOptionalLabel(item.descrizione)}</strong>
                              <span>{renderLavoroMeta(item)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  </div>
                </>
              ) : (
                <div className="next-data-state">
                  <strong>Lavori non disponibili</strong>
                  <span>Il blocco lavori non e leggibile per questa targa.</span>
                </div>
              )}
          </section>

          <section id="manutenzioni" className="next-panel next-dossier-section-card next-tone">
            <div className="next-panel__header">
              <h2>Manutenzioni</h2>
            </div>
            <p className="next-panel__description">
              Manutenzione programmata e storico interventi del mezzo.
            </p>

            {maintenanceState.status === "error" ? (
              <div className="next-data-state next-tone next-tone--warning">
                <strong>Blocco manutenzioni non disponibile</strong>
                <span>{maintenanceState.error}</span>
              </div>
            ) : null}

            {maintenanceState.status === "success" ? (
              <>
                <div className="next-inline-grid">
                  <article className="next-inline-panel">
                    <h3>Manutenzione programmata</h3>
                    <p>Stato della pianificazione manutentiva del mezzo.</p>
                    {!scheduledMaintenance ? (
                      <div className="next-data-state">
                        <strong>Stato programmato non disponibile</strong>
                        <span>La pianificazione manutentiva non risulta disponibile per il mezzo.</span>
                      </div>
                    ) : (
                      <div className="next-control-list">
                        <div className="next-control-list__item">
                          <div className="next-global-pillbar">
                            <span
                              className={getScheduledMaintenanceToneClassName(
                                scheduledMaintenance.status
                              )}
                            >
                              {renderScheduledMaintenanceStatusLabel(scheduledMaintenance.status)}
                            </span>
                            <span className="next-chip next-chip--subtle">
                              {scheduledMaintenance.dataFine ?? "Data fine non valorizzata"}
                            </span>
                          </div>
                          <strong>
                            {scheduledMaintenance.enabled
                              ? "Pianificazione manutentiva attiva"
                              : "Nessuna manutenzione programmata attiva"}
                          </strong>
                          <span>{renderScheduledMaintenanceMeta(scheduledMaintenance)}</span>
                          <span>
                            Inizio:{" "}
                            {renderOptionalLabel(scheduledMaintenance.dataInizio, "non valorizzato")}
                            {" | "}KM max:{" "}
                            {renderOptionalLabel(scheduledMaintenance.kmMax, "non valorizzato")}
                            {" | "}Contratto:{" "}
                            {renderOptionalLabel(scheduledMaintenance.contratto, "non valorizzato")}
                          </span>
                        </div>
                      </div>
                    )}
                  </article>

                  <article className="next-inline-panel">
                    <h3>Ultime manutenzioni</h3>
                    <p>Storico interventi del mezzo in ordine recente.</p>
                    {maintenanceHistoryPreview.length === 0 ? (
                      <div className="next-data-state">
                        <strong>Nessuna manutenzione letta</strong>
                        <span>Non risulta storico manutentivo per questa targa.</span>
                      </div>
                    ) : (
                      <>
                        <div className="next-data-state next-tone">
                          <strong>
                            Anteprima dossier: ultime{" "}
                            {formatIntegerValue(maintenanceHistoryPreview.length)} manutenzioni
                          </strong>
                          <span>
                            Totale storico ricostruito per questo mezzo:{" "}
                            {formatIntegerValue(maintenanceHistory.length)}.
                          </span>
                          <div className="next-access-page__actions">
                            {hasMaintenanceFullView ? (
                              <button
                                type="button"
                                className="next-action-link next-action-link--primary"
                                onClick={() => setShowAllMaintenance(true)}
                              >
                                Vedi tutte
                              </button>
                            ) : null}
                            {showAllMaintenance ? (
                              <button
                                type="button"
                                className="next-action-link"
                                onClick={() => setShowAllMaintenance(false)}
                              >
                                Chiudi vista completa
                              </button>
                            ) : null}
                          </div>
                        </div>

                        <div className="next-control-list">
                          {maintenanceHistoryPreview.map((item) => (
                            <div key={item.id} className="next-control-list__item">
                              <div className="next-global-pillbar">
                                <span className="next-chip next-chip--subtle">
                                  {item.dataRaw ?? "Data non disponibile"}
                                </span>
                                {item.tipo ? (
                                  <span className="next-chip next-chip--subtle">{item.tipo}</span>
                                ) : null}
                                {item.isCambioGommeDerived ? (
                                  <span className="next-chip next-chip--warning">Gomme</span>
                                ) : null}
                              </div>
                              <strong>{renderOptionalLabel(item.descrizione)}</strong>
                              <span>{renderMaintenanceHistoryMeta(item)}</span>
                            </div>
                          ))}
                        </div>

                        {showAllMaintenance ? (
                          <div className="next-inline-panel">
                            <div className="next-panel__header">
                              <h3>Vista completa manutenzioni</h3>
                              <span className="next-chip next-chip--accent">
                                {formatIntegerValue(maintenanceHistory.length)} record
                              </span>
                            </div>
                            <p>Vista completa dello storico manutenzioni del mezzo.</p>
                            <div className="next-control-list">
                              {maintenanceHistory.map((item) => (
                                <div key={item.id} className="next-control-list__item">
                                  <div className="next-global-pillbar">
                                    <span className="next-chip next-chip--subtle">
                                      {item.dataRaw ?? "Data non disponibile"}
                                    </span>
                                    {item.tipo ? (
                                      <span className="next-chip next-chip--subtle">
                                        {item.tipo}
                                      </span>
                                    ) : null}
                                    {item.isCambioGommeDerived ? (
                                      <span className="next-chip next-chip--warning">Gomme</span>
                                    ) : null}
                                  </div>
                                  <strong>{renderOptionalLabel(item.descrizione)}</strong>
                                  <span>{renderMaintenanceHistoryMeta(item)}</span>
                                  <span>
                                    Origine: {item.sourceOrigin} {" | "}Dataset: {item.sourceDataset}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}
                  </article>
                </div>
              </>
            ) : null}
          </section>

          <section id="materiali" className="next-panel next-dossier-section-card">
            <div className="next-panel__header">
              <h2>Materiali e movimenti inventario</h2>
            </div>
            <p className="next-panel__description">
              Sezione gia prevista nel Dossier, ma non ancora collegata in modo pulito nella NEXT.
            </p>
            <div className="next-data-state">
              <strong>Blocco non ancora collegato</strong>
              <span>
                Il cluster materiali resta strutturato ma non viene riempito finche il reader
                mezzo-centrico non entra senza portare logiche sporche in UI.
              </span>
            </div>
          </section>

          <section id="rifornimenti" className="next-panel next-dossier-section-card next-tone next-tone--success">
              <div className="next-panel__header">
                <h2>Rifornimenti del mezzo</h2>
                <span className="next-chip next-chip--success">
                  {renderRefuelStatusLabel(refuelState.status, refuelSnapshot)}
                </span>
              </div>
              <p className="next-panel__description">
                Qui vedi i rifornimenti utili del mezzo in ordine recente.
              </p>

              {refuelState.status === "error" ? (
                <div className="next-data-state next-tone next-tone--warning">
                  <strong>Blocco rifornimenti non disponibile</strong>
                  <span>{refuelState.error}</span>
                </div>
              ) : null}

              {refuelState.status === "success" ? (
                <>
                  <div className="next-data-state next-tone">
                    <strong>Quadro rifornimenti del mezzo</strong>
                    <span>
                      Totale rifornimenti utili: {formatIntegerValue(refuelSnapshot?.counts.total ?? null)}
                      {" | "}Litri leggibili: {formatLitriValue(refuelSnapshot?.totals.litri ?? null)} L
                      {" | "}Costo leggibile: {formatCurrencyValue(refuelSnapshot?.totals.costo ?? null)}
                    </span>
                  </div>

                  {refuelsPreview.length === 0 ? (
                    <div className="next-data-state">
                      <strong>Nessun rifornimento ricostruito</strong>
                      <span>
                        Non risultano rifornimenti utili per questa targa.
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="next-data-state next-tone next-tone--accent">
                        <strong>
                          Anteprima dossier: ultimi {formatIntegerValue(refuelsPreview.length)} rifornimenti
                        </strong>
                          <span>
                          Il Dossier mostra i 5 record piu recenti. Totale letto per questo mezzo:{" "}
                          {formatIntegerValue(refuels.length)}.
                        </span>
                        <div className="next-access-page__actions">
                          {hasRefuelFullView ? (
                            <button
                              type="button"
                              className="next-action-link next-action-link--primary"
                              onClick={() => setShowAllRefuels(true)}
                            >
                              Vedi tutti
                            </button>
                          ) : null}
                          {showAllRefuels ? (
                            <button
                              type="button"
                              className="next-action-link"
                              onClick={() => setShowAllRefuels(false)}
                            >
                              Chiudi vista completa
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="next-control-list">
                        {refuelsPreview.map((item) => renderRefuelReadOnlyCard(item))}
                      </div>

                      {showAllRefuels ? (
                        <div className="next-inline-panel">
                          <div className="next-panel__header">
                            <h3>Vista completa rifornimenti</h3>
                            <span className="next-chip next-chip--accent">
                              {formatIntegerValue(refuels.length)} record
                            </span>
                          </div>
                          <p>
                            Vista completa dei rifornimenti del mezzo.
                          </p>
                          <div className="next-control-list">
                            {refuels.map((item) => renderRefuelReadOnlyCard(item))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </>
              ) : null}
          </section>

          <section id="documenti" className="next-panel next-dossier-section-card next-tone next-tone--accent">
              <div className="next-panel__header">
                <h2>Documenti e costi</h2>
                <span className="next-chip next-chip--accent">
                  {renderDocumentCostStatusLabel(documentCostsState.status, documentCostsSnapshot)}
                </span>
              </div>
              <p className="next-panel__description">
                Preventivi, fatture e altri documenti utili letti in modo mezzo-centrico.
              </p>

              {documentCostsState.status === "error" ? (
                <div className="next-data-state next-tone next-tone--warning">
                  <strong>Blocco documenti e costi non disponibile</strong>
                  <span>{documentCostsState.error}</span>
                </div>
              ) : null}

              {documentCostsState.status === "success" ? (
                <>
                  <div className="next-data-state next-tone">
                    <strong>Quadro documenti e costi del mezzo</strong>
                    <span>
                      Preventivi: {formatIntegerValue(documentCostsSnapshot?.counts.preventivi ?? null)}
                      {" | "}Fatture: {formatIntegerValue(documentCostsSnapshot?.counts.fatture ?? null)}
                      {" | "}Documenti utili:{" "}
                      {formatIntegerValue(documentCostsSnapshot?.counts.documentiUtili ?? null)}
                    </span>
                  </div>

                  <div className="next-section-grid">
                    <article className="next-inline-panel">
                      <h3>Ultimi preventivi</h3>
                      <p>
                        Ultimi preventivi collegati alla targa.
                      </p>
                      {preventiviPreview.length === 0 ? (
                        <div className="next-data-state">
                          <strong>Nessun preventivo letto</strong>
                          <span>
                            Non risultano preventivi utili per questa targa.
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="next-data-state next-tone next-tone--accent">
                            <strong>
                              Anteprima dossier: ultimi {formatIntegerValue(preventiviPreview.length)}{" "}
                              preventivi
                            </strong>
                            <span>
                              Totali prudenti:{" "}
                              {renderDocumentTotalsSummary(
                                documentCostsSnapshot?.totals.preventivi ?? null
                              )}
                            </span>
                          </div>
                          <div className="next-control-list">
                            {preventiviPreview.map((item) => renderDocumentCostReadOnlyCard(item))}
                          </div>
                        </>
                      )}
                    </article>

                    <article className="next-inline-panel">
                      <h3>Ultime fatture</h3>
                      <p>
                        Preview sintetica delle fatture correlate al mezzo, con importi solo quando
                        davvero leggibili.
                      </p>
                      {fatturePreview.length === 0 ? (
                        <div className="next-data-state">
                          <strong>Nessuna fattura letta</strong>
                          <span>
                            Non risultano fatture utili per questa targa.
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="next-data-state next-tone next-tone--warning">
                            <strong>
                              Anteprima dossier: ultime {formatIntegerValue(fatturePreview.length)}{" "}
                              fatture
                            </strong>
                            <span>
                              Totali prudenti:{" "}
                              {renderDocumentTotalsSummary(
                                documentCostsSnapshot?.totals.fatture ?? null
                              )}
                            </span>
                          </div>
                          <div className="next-control-list">
                            {fatturePreview.map((item) => renderDocumentCostReadOnlyCard(item))}
                          </div>
                        </>
                      )}
                    </article>

                    <article className="next-inline-panel">
                      <h3>Altri documenti utili</h3>
                      <p>
                        Documenti collegati alla targa e utili dentro il contesto del mezzo.
                      </p>
                      {documentiUtiliPreview.length === 0 ? (
                        <div className="next-data-state">
                          <strong>Nessun documento utile letto</strong>
                          <span>
                            Nessun altro documento utile risulta leggibile per questa targa.
                          </span>
                        </div>
                      ) : (
                        <div className="next-control-list">
                          {documentiUtiliPreview.map((item) => renderDocumentCostReadOnlyCard(item))}
                        </div>
                      )}
                    </article>
                  </div>
                </>
              ) : null}
          </section>

          <section className="next-section-grid next-section-grid--support">
            <article className={supportToneClassName("success")}>
              <div className="next-panel__header">
                <h2>Riepilogo scheda</h2>
              </div>
              <p className="next-panel__description">
                Contatori sintetici dei blocchi gia leggibili nel Dossier.
              </p>
              <ul className="next-panel__list">
                <li>lavori aperti: {formatIntegerValue(technicalSnapshot?.counts.lavoriAperti ?? null)}</li>
                <li>lavori chiusi: {formatIntegerValue(technicalSnapshot?.counts.lavoriChiusi ?? null)}</li>
                <li>storico manutenzioni: {formatIntegerValue(maintenanceCounts?.totaleStorico ?? null)}</li>
                <li>record con materiali: {formatIntegerValue(maintenanceCounts?.conMateriali ?? null)}</li>
                <li>rifornimenti: {formatIntegerValue(refuelSnapshot?.counts.total ?? null)}</li>
                <li>documenti/costi: {formatIntegerValue(documentCostsSnapshot?.counts.total ?? null)}</li>
              </ul>
            </article>

            <article className={supportToneClassName("warning")}>
              <div className="next-panel__header">
                <h2>Limiti attuali</h2>
              </div>
              <p className="next-panel__description">
                Limiti attuali del Dossier, tenuti in fondo pagina.
              </p>
              <ul className="next-panel__list">
                {overview.technicalLimitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                {overview.refuelLimitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                {overview.documentCostLimitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                <li>nessun PDF runtime nuovo, nessun upload, nessuna delete e nessuna modale della madre</li>
              </ul>
            </article>

            <article className={supportToneClassName("success")}>
              <div className="next-panel__header">
                <h2>Stato della scheda</h2>
              </div>
              <p className="next-panel__description">
                Promemoria sintetico della copertura disponibile oggi.
              </p>
              <ul className="next-panel__list">
                {dossierStatusItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </section>
        </>
      ) : null}
    </section>
  );
}

export default NextDossierMezzoPage;
