import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  NEXT_AREA_ACCESS,
  NEXT_ROLE_PRESETS,
  buildNextPathWithRole,
  getNextRoleFromSearch,
} from "./nextAccess";
import { NEXT_AREAS } from "./nextData";
import {
  NEXT_ANAGRAFICHE_FLOTTA_DOMAIN,
  type NextMezzoListItem,
  normalizeNextMezzoTarga,
  readNextMezzoByTarga,
} from "./nextAnagraficheFlottaDomain";
import {
  NEXT_OPERATIVITA_TECNICA_DOMAIN,
  type NextLavoroTecnicoItem,
  type NextMezzoOperativitaTecnicaSnapshot,
  readNextMezzoOperativitaTecnicaSnapshot,
} from "./nextOperativitaTecnicaDomain";
import {
  NEXT_RIFORNIMENTI_CONSUMI_DOMAIN,
  type NextMezzoRifornimentiSnapshot,
  type NextRifornimentoFieldQuality,
  type NextRifornimentoMatchStrategy,
  type NextRifornimentoProvenienza,
  type NextRifornimentoReadOnlyItem,
  readNextMezzoRifornimentiSnapshot,
} from "./nextRifornimentiConsumiDomain";
import {
  NEXT_MANUTENZIONI_DOMAIN,
  type NextMaintenanceHistoryItem,
  type NextManutenzioneQuality,
  type NextMezzoManutenzioniSnapshot,
  type NextScheduledMaintenance,
  type NextScheduledMaintenanceStatus,
  readNextMezzoManutenzioniSnapshot,
} from "./domain/nextManutenzioniDomain";

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

function renderLavoroMeta(item: NextLavoroTecnicoItem) {
  return item.dataInserimento
    ? `Inserito ${item.dataInserimento}`
    : "Lavoro tecnico senza data inserimento valorizzata.";
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

function renderRefuelStatusLabel(
  status: "idle" | "loading" | "success" | "error",
  snapshot: NextMezzoRifornimentiSnapshot | null
) {
  switch (status) {
    case "loading":
      return "Caricamento D04";
    case "success":
      if (!snapshot) return "In attesa";
      if (snapshot.counts.total > 0) return "Ricostruzione controllata attiva";
      if (
        snapshot.datasetShapes.business === "missing" &&
        snapshot.datasetShapes.field === "missing"
      ) {
        return "Dataset D04 assenti";
      }
      if (
        snapshot.datasetShapes.business === "unsupported" &&
        snapshot.datasetShapes.field === "unsupported"
      ) {
        return "Dataset D04 non conformi";
      }
      return "Nessun rifornimento per mezzo";
    case "error":
      return "Reader D04 in errore";
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

function renderMaintenanceQualityLabel(value: NextManutenzioneQuality) {
  switch (value) {
    case "source_direct":
      return "dato diretto";
    case "derived_acceptable":
      return "dato derivato";
    default:
      return "fuori v1";
  }
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
      <span>{renderOptionalLabel(item.note, "Nessuna nota disponibile nel modello D04.")}</span>
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
  const access = NEXT_AREA_ACCESS["mezzi-dossier"];
  const allowedRoleLabels = access.allowedRoles.map((entry) => NEXT_ROLE_PRESETS[entry].label);
  const normalizedTarga = normalizeNextMezzoTarga(routeTarga);
  const [mezzo, setMezzo] = useState<NextMezzoListItem | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "not-found">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [technicalSnapshot, setTechnicalSnapshot] =
    useState<NextMezzoOperativitaTecnicaSnapshot | null>(null);
  const [technicalStatus, setTechnicalStatus] =
    useState<"idle" | "loading" | "success" | "error">("idle");
  const [technicalError, setTechnicalError] = useState<string | null>(null);
  const [refuelSnapshot, setRefuelSnapshot] = useState<NextMezzoRifornimentiSnapshot | null>(null);
  const [refuelStatus, setRefuelStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [refuelError, setRefuelError] = useState<string | null>(null);
  const [maintenanceSnapshot, setMaintenanceSnapshot] =
    useState<NextMezzoManutenzioniSnapshot | null>(null);
  const [maintenanceStatus, setMaintenanceStatus] =
    useState<"idle" | "loading" | "success" | "error">("idle");
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);
  const [showAllMaintenance, setShowAllMaintenance] = useState(false);
  const [showAllRefuels, setShowAllRefuels] = useState(false);

  const listPath = buildNextPathWithRole("/next/mezzi-dossier", role, location.search);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!normalizedTarga) {
        setStatus("error");
        setError("Parametro targa non valido per il Dossier NEXT.");
        setMezzo(null);
        setTechnicalSnapshot(null);
        setTechnicalStatus("idle");
        setTechnicalError(null);
        setRefuelSnapshot(null);
        setRefuelStatus("idle");
        setRefuelError(null);
        setMaintenanceSnapshot(null);
        setMaintenanceStatus("idle");
        setMaintenanceError(null);
        setShowAllMaintenance(false);
        setShowAllRefuels(false);
        return;
      }

      try {
        setStatus("loading");
        setError(null);
        setTechnicalSnapshot(null);
        setTechnicalStatus("idle");
        setTechnicalError(null);
        setRefuelSnapshot(null);
        setRefuelStatus("idle");
        setRefuelError(null);
        setMaintenanceSnapshot(null);
        setMaintenanceStatus("idle");
        setMaintenanceError(null);
        setShowAllMaintenance(false);
        setShowAllRefuels(false);

        const record = await readNextMezzoByTarga(normalizedTarga);
        if (!active) return;

        if (!record) {
          setStatus("not-found");
          setError(
            `Il mezzo ${normalizedTarga} non e presente nel dataset canonico ${NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.activeReadOnlyDataset}.`
          );
          setMezzo(null);
          return;
        }

        setMezzo(record);
        setStatus("success");
        setTechnicalStatus("loading");
        setMaintenanceStatus("loading");
        setRefuelStatus("loading");

        const [technicalResult, maintenanceResult, refuelResult] = await Promise.allSettled([
          readNextMezzoOperativitaTecnicaSnapshot(normalizedTarga),
          readNextMezzoManutenzioniSnapshot(normalizedTarga),
          readNextMezzoRifornimentiSnapshot(normalizedTarga),
        ]);

        if (!active) return;

        if (technicalResult.status === "fulfilled") {
          setTechnicalSnapshot(technicalResult.value);
          setTechnicalStatus("success");
        } else {
          setTechnicalSnapshot(null);
          setTechnicalStatus("error");
          setTechnicalError(
            "Impossibile leggere il primo blocco tecnico dal reader canonico `D02`."
          );
        }

        if (maintenanceResult.status === "fulfilled") {
          setMaintenanceSnapshot(maintenanceResult.value);
          setMaintenanceStatus("success");
        } else {
          setMaintenanceSnapshot(null);
          setMaintenanceStatus("error");
          setMaintenanceError(
            "Impossibile leggere il blocco manutenzioni dal layer read-only dedicato."
          );
        }

        if (refuelResult.status === "fulfilled") {
          setRefuelSnapshot(refuelResult.value);
          setRefuelStatus("success");
        } else {
          setRefuelSnapshot(null);
          setRefuelStatus("error");
          setRefuelError(
            "Impossibile leggere il blocco rifornimenti dal layer di normalizzazione `D04`."
          );
        }
      } catch {
        if (!active) return;

        setStatus("error");
        setError("Impossibile leggere il Dossier NEXT dal reader canonico.");
        setMezzo(null);
        setTechnicalSnapshot(null);
        setTechnicalStatus("idle");
        setTechnicalError(null);
        setMaintenanceSnapshot(null);
        setMaintenanceStatus("idle");
        setMaintenanceError(null);
        setRefuelSnapshot(null);
        setRefuelStatus("idle");
        setRefuelError(null);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [normalizedTarga]);

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
  const refuelCount = refuelSnapshot?.counts.total ?? null;
  const refuelTotalLitri = refuelSnapshot?.totals.litri ?? null;
  const refuelCountWithKm = refuelSnapshot?.counts.withKm ?? null;
  const refuelCountWithAutista = refuelSnapshot?.counts.withAutista ?? null;
  const refuelCountReconstructed = refuelSnapshot?.counts.reconstructed ?? null;
  const refuelCountWithCosto = refuelSnapshot?.counts.withCosto ?? null;
  const refuelTotalCosto = refuelSnapshot?.totals.costo ?? null;

  return (
    <section className="next-page next-dossier-shell">
      <header className="next-page__hero">
        <div>
          <Link className="next-back-link" to={listPath}>
            Torna all&apos;elenco mezzi
          </Link>
          <p className="next-page__eyebrow">{area.eyebrow}</p>
          <h1>{mezzo ? `Dossier ${mezzo.targa}` : "Dossier Mezzo NEXT"}</h1>
          <p className="next-page__description">
            Primo Dossier Mezzo NEXT realmente convergente. Questa vista resta `read-only`, usa
            il dominio stabile `Anagrafiche flotta e persone`, aggiunge il primo blocco tecnico
            reale di `Operativita tecnica mezzo` e porta `D04` nel Dossier tramite una
            `RICOSTRUZIONE CONTROLLATA NEXT`: stesso risultato utile del madre, ma con tutta la
            complessita legacy confinata in un solo layer read-only.
          </p>
        </div>

        <div className="next-page__meta">
          <span className="next-chip next-chip--success">DOSSIER READ-ONLY</span>
          {allowedRoleLabels.map((scope) => (
            <span key={scope} className="next-chip">
              {scope}
            </span>
          ))}
          <span className="next-chip next-chip--subtle">
            Ruolo simulato: {NEXT_ROLE_PRESETS[role].shortLabel}
          </span>
          <span className="next-chip next-chip--accent">D01 stabile + D02 minimo</span>
          <span className="next-chip next-chip--success">D04 ricostruzione controllata</span>
          <span className="next-chip next-chip--warning">D02 sensibile</span>
          <span className="next-chip next-chip--warning">D04 sensibile</span>
          <span className="next-chip next-chip--warning">Nessuna scrittura</span>
        </div>
      </header>

      {status === "loading" ? (
        <div className="next-data-state next-tone next-tone--accent">
          <strong>Caricamento Dossier iniziale</strong>
          <span>Sto leggendo il mezzo richiesto dal reader canonico `D01`.</span>
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

      {status === "success" && mezzo ? (
        <>
          <section className="next-summary-grid next-summary-grid--wide">
            <article className="next-summary-card next-tone next-tone--accent">
              <p className="next-summary-card__label">Targa pivot</p>
              <strong className="next-summary-card__value">{mezzo.targa}</strong>
              <p className="next-summary-card__meta">
                Chiave logica forte del primo Dossier NEXT. Tutte le convergenze future dovranno
                mantenere questa normalizzazione.
              </p>
            </article>

            <article className="next-summary-card next-tone">
              <p className="next-summary-card__label">Categoria</p>
              <strong className="next-summary-card__value">{mezzo.categoria}</strong>
              <p className="next-summary-card__meta">
                Campo anagrafico gia stabile e utile per contestualizzare il mezzo.
              </p>
            </article>

            <article className="next-summary-card next-tone next-tone--success">
              <p className="next-summary-card__label">Autista nome</p>
              <strong className="next-summary-card__value">
                {mezzo.autistaNome ?? "Non valorizzato"}
              </strong>
              <p className="next-summary-card__meta">
                Informazione anagrafica e non operativa: non equivale a sessione live o
                assegnazione runtime.
              </p>
            </article>

            <article className="next-summary-card next-tone next-tone--warning">
              <p className="next-summary-card__label">Stato dossier</p>
              <strong className="next-summary-card__value">D01 + D02 + D04 ricostruito</strong>
              <p className="next-summary-card__meta">
                Identita mezzo stabile, blocco tecnico iniziale e primo blocco rifornimenti
                ricostruito in NEXT. Restano fuori consumi calcolati, documenti, PDF e IA
                contestuale runtime.
              </p>
            </article>
          </section>

          <section className="next-summary-grid next-summary-grid--wide">
            <article className="next-summary-card next-tone next-tone--accent">
              <p className="next-summary-card__label">Lavori aperti</p>
              <strong className="next-summary-card__value">
                {technicalStatus === "success" ? lavoriAperti.length : "--"}
              </strong>
              <p className="next-summary-card__meta">
                Backlog tecnico letto da `{NEXT_OPERATIVITA_TECNICA_DOMAIN.logicalDatasets[0]}`
                con filtro per `targa` normalizzata.
              </p>
            </article>

            <article className="next-summary-card next-tone next-tone--success">
              <p className="next-summary-card__label">Lavori chiusi</p>
              <strong className="next-summary-card__value">
                {technicalStatus === "success" ? lavoriChiusi.length : "--"}
              </strong>
              <p className="next-summary-card__meta">
                Conteggio iniziale dei lavori segnati come `eseguito = true`, senza importare il
                dettaglio workflow legacy.
              </p>
            </article>

            <article className="next-summary-card next-tone">
              <p className="next-summary-card__label">Manutenzioni lette</p>
              <strong className="next-summary-card__value">
                {maintenanceStatus === "success"
                  ? formatIntegerValue(maintenanceCounts?.totaleStorico ?? 0)
                  : "--"}
              </strong>
              <p className="next-summary-card__meta">
                Storico interventi letto dal layer manutenzioni dedicato, con filtro per `targa`
                e ordinamento prudente per data.
              </p>
            </article>

            <article className="next-summary-card next-tone next-tone--warning">
              <p className="next-summary-card__label">Manutenzione programmata</p>
              <strong className="next-summary-card__value">
                {maintenanceStatus === "success" && scheduledMaintenance
                  ? renderScheduledMaintenanceStatusLabel(scheduledMaintenance.status)
                  : "--"}
              </strong>
              <p className="next-summary-card__meta">
                Stato ricostruito dai campi del mezzo in `@mezzi_aziendali`, senza writer o
                logiche UI implicite.
              </p>
            </article>
          </section>

          <section className="next-summary-grid next-summary-grid--wide">
            <article className="next-summary-card next-tone next-tone--success">
              <p className="next-summary-card__label">Rifornimenti letti</p>
              <strong className="next-summary-card__value">
                {refuelStatus === "success" ? formatIntegerValue(refuelCount) : "--"}
              </strong>
              <p className="next-summary-card__meta">
                Record utili ricostruiti dal layer `D04` a partire da dataset business e feed
                campo legacy, senza spargere merge o fallback in UI.
              </p>
            </article>

            <article className="next-summary-card next-tone">
              <p className="next-summary-card__label">Litri leggibili</p>
              <strong className="next-summary-card__value">
                {refuelStatus === "success" && refuelTotalLitri !== null
                  ? `${formatLitriValue(refuelTotalLitri)} L`
                  : "--"}
              </strong>
              <p className="next-summary-card__meta">
                Somma dei `litri` del modello pulito D04, dopo ricostruzione controllata nel
                layer NEXT.
              </p>
            </article>

            <article className="next-summary-card next-tone next-tone--accent">
              <p className="next-summary-card__label">Record con autista</p>
              <strong className="next-summary-card__value">
                {refuelStatus === "success" ? formatIntegerValue(refuelCountWithAutista) : "--"}
              </strong>
              <p className="next-summary-card__meta">
                Autista e badge vengono esposti solo se certi o ricostruibili nel layer D04.
              </p>
            </article>

            <article className="next-summary-card next-tone next-tone--warning">
              <p className="next-summary-card__label">Blocco rifornimenti</p>
              <strong className="next-summary-card__value">
                {renderRefuelStatusLabel(refuelStatus, refuelSnapshot)}
              </strong>
              <p className="next-summary-card__meta">
                Righe ricostruite:{" "}
                {refuelStatus === "success" ? formatIntegerValue(refuelCountReconstructed) : "--"}.
              </p>
            </article>
          </section>

          <section className="next-dossier-layout">
            <article className="next-panel next-dossier-main next-tone">
              <div className="next-panel__header">
                <h2>Identita mezzo e nucleo dossier</h2>
                <Link className="next-inline-link" to={listPath}>
                  Elenco mezzi
                </Link>
              </div>
              <p className="next-panel__description">
                Questa pagina parte dal reader canonico di `Anagrafiche flotta e persone`. Il
                Dossier continua a nascere dal mezzo come identita leggibile e non da una fusione
                anticipata di domini ancora instabili.
              </p>

              <div className="next-dossier-map">
                <div className="next-dossier-map__row">
                  <strong>ID mezzo</strong>
                  <span>{mezzo.id}</span>
                </div>
                <div className="next-dossier-map__row">
                  <strong>Targa</strong>
                  <span>{mezzo.targa}</span>
                </div>
                <div className="next-dossier-map__row">
                  <strong>Categoria</strong>
                  <span>{mezzo.categoria}</span>
                </div>
                <div className="next-dossier-map__row">
                  <strong>Marca / modello</strong>
                  <span>{renderMarcaModello(mezzo)}</span>
                </div>
                <div className="next-dossier-map__row">
                  <strong>Autista nome</strong>
                  <span>{mezzo.autistaNome ?? "Non valorizzato"}</span>
                </div>
                <div className="next-dossier-map__row">
                  <strong>Origine lettura</strong>
                  <span>
                    {mezzo.sourceCollection}/{mezzo.sourceKey}
                  </span>
                </div>
              </div>
            </article>

            <div className="next-dossier-side">
              <article className="next-panel next-tone next-tone--success">
                <div className="next-panel__header">
                  <h2>Cosa e gia importato</h2>
                </div>
                <p className="next-panel__description">
                  Il Dossier usa ora due reader canonici separati: `D01` per l&apos;identita mezzo
                  e `D02` per il primo blocco tecnico reale, piu un layer `D04` che ricostruisce
                  il risultato utile dei rifornimenti senza toccare il runtime legacy.
                </p>
                <ul className="next-panel__list">
                  <li>`id`, `targa`, `categoria`, `marca`, `modello`, `autistaNome`</li>
                  <li>`lavori` minimi: `descrizione`, `eseguito`, `urgenza`, `dataInserimento`</li>
                  <li>`manutenzioni` minime: `descrizione`, `tipo`, `data`, `km`, `ore`</li>
                  <li>`rifornimenti` D04: `id`, `mezzoTarga`, `dataDisplay`, `timestampRicostruito?`, `litri`, `km?`, `costo?`, `autista?`, `badge?`, `provenienza`, `qualita`</li>
                  <li>route pulita `/next/mezzi-dossier/:targa`</li>
                  <li>nessuna dipendenza da `DossierMezzo` legacy come sorgente funzionale</li>
                </ul>
              </article>

              <article className="next-panel next-tone next-tone--warning">
                <div className="next-panel__header">
                  <h2>Perimetro escluso per ora</h2>
                </div>
                <p className="next-panel__description">
                  Il Dossier non simula completezza. I blocchi assenti sono espliciti e verranno
                  importati solo quando i rispettivi domini saranno pronti.
                </p>
                <ul className="next-panel__list">
                  <li>nessun dettaglio workflow lavori, presa in carico o scrittura manutenzioni</li>
                  <li>nessuna complessita legacy D04 in UI: il Dossier legge solo il modello pulito del layer</li>
                  <li>nessun consumo calcolato o analisi economica sui rifornimenti</li>
                  <li>nessun documento, PDF o IA contestuale</li>
                </ul>
              </article>
            </div>
          </section>

          <section className="next-dossier-layout">
            <article className="next-panel next-dossier-main next-tone next-tone--accent">
              <div className="next-panel__header">
                <h2>Blocco tecnico iniziale</h2>
                <span className="next-chip next-chip--warning">D02 read-only minimo</span>
              </div>
              <p className="next-panel__description">
                Primo ingresso tecnico reale del Dossier NEXT. Il blocco legge solo i dataset
                dichiarati per `Operativita tecnica mezzo`, filtra per `targa` e mostra un
                riepilogo pulito dei lavori senza importare route, writer o logiche di
                orchestrazione legacy.
              </p>

              {technicalStatus === "loading" ? (
                <div className="next-data-state next-tone next-tone--accent">
                  <strong>Caricamento blocco tecnico</strong>
                  <span>
                    Sto leggendo
                    {" "}
                    <code>{NEXT_OPERATIVITA_TECNICA_DOMAIN.logicalDatasets.join(", ")}</code>
                    {" "}con filtro per <code>targa</code>.
                  </span>
                </div>
              ) : null}

              {technicalStatus === "error" ? (
                <div className="next-data-state next-tone next-tone--warning">
                  <strong>Blocco tecnico non disponibile</strong>
                  <span>{technicalError}</span>
                </div>
              ) : null}

              {technicalStatus === "success" ? (
                <div className="next-section-grid">
                  <article className="next-inline-panel">
                    <h3>Lavori aperti</h3>
                    <p>
                      Backlog tecnico mezzo-centrico. In questa fase ogni record aperto viene letto
                      solo come `eseguito != true`.
                    </p>
                    {lavoriApertiPreview.length === 0 ? (
                      <div className="next-data-state">
                        <strong>Nessun lavoro aperto</strong>
                        <span>Il reader `D02` non ha trovato backlog tecnico per questa targa.</span>
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
                    <p>
                      Primi record eseguiti del mezzo. Nessun dettaglio di workflow o presa in
                      carico viene importato in questo step.
                    </p>
                    {lavoriChiusiPreview.length === 0 ? (
                      <div className="next-data-state">
                        <strong>Nessun lavoro chiuso</strong>
                        <span>Il reader `D02` non ha trovato lavori segnati come eseguiti.</span>
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
              ) : null}
            </article>

            <div className="next-dossier-side">
              <article className="next-panel next-tone next-tone--success">
                <div className="next-panel__header">
                  <h2>Cosa e importato davvero</h2>
                </div>
                <p className="next-panel__description">
                  Il blocco tecnico non porta tutta `Operativita tecnica mezzo`: importa solo il
                  sottoinsieme piu stabile e utile al contesto del Dossier.
                </p>
                <ul className="next-panel__list">
                  <li>filtro mezzo-centrico per `targa` normalizzata</li>
                  <li>lettura `@lavori` solo come aperti/chiusi</li>
                  <li>nessun writer e nessun dettaglio route legacy</li>
                </ul>
              </article>

              <article className="next-panel next-tone next-tone--warning">
                <div className="next-panel__header">
                  <h2>Cosa resta fuori da D02</h2>
                </div>
                <p className="next-panel__description">
                  Il dominio resta `SENSIBILE`, quindi questa pagina non maschera ancora le sue
                  incoerenze residue.
                </p>
                <ul className="next-panel__list">
                  <li>nessun writer, nessuna modifica stato, nessun dettaglio lavoro</li>
                  <li>nessun collegamento a materiali, inventario o costo finale</li>
                  <li>le manutenzioni hanno ora un layer read-only dedicato separato</li>
                </ul>
              </article>
            </div>
          </section>

          <section className="next-dossier-layout">
            <article className="next-panel next-dossier-main next-tone next-tone--accent">
              <div className="next-panel__header">
                <h2>Manutenzioni read-only</h2>
                <span className="next-chip next-chip--accent">
                  {NEXT_MANUTENZIONI_DOMAIN.code} dedicato
                </span>
              </div>
              <p className="next-panel__description">
                Il blocco manutenzioni legge solo `@manutenzioni` e `@mezzi_aziendali`, isola la
                distinzione tra storico interventi e manutenzione programmata in un layer NEXT
                dedicato e restituisce al Dossier solo output pulito.
              </p>

              {maintenanceStatus === "loading" ? (
                <div className="next-data-state next-tone next-tone--accent">
                  <strong>Caricamento blocco manutenzioni</strong>
                  <span>
                    Sto leggendo <code>{NEXT_MANUTENZIONI_DOMAIN.logicalDatasets.join(", ")}</code>{" "}
                    con filtro per <code>targa</code>.
                  </span>
                </div>
              ) : null}

              {maintenanceStatus === "error" ? (
                <div className="next-data-state next-tone next-tone--warning">
                  <strong>Blocco manutenzioni non disponibile</strong>
                  <span>{maintenanceError}</span>
                </div>
              ) : null}

              {maintenanceStatus === "success" && scheduledMaintenance ? (
                <>
                  <div className="next-section-grid">
                    <article className="next-inline-panel">
                      <h3>Manutenzione programmata</h3>
                      <p>
                        Stato letto dal record mezzo, senza ricostruzioni da altri dataset e senza
                        importare writer della madre.
                      </p>
                      <div className="next-control-list">
                        <div className="next-control-list__item">
                          <div className="next-global-pillbar">
                            <span
                              className={getScheduledMaintenanceToneClassName(
                                scheduledMaintenance.status
                              )}
                            >
                              {renderScheduledMaintenanceStatusLabel(
                                scheduledMaintenance.status
                              )}
                            </span>
                            <span className="next-chip next-chip--subtle">
                              {renderMaintenanceQualityLabel(scheduledMaintenance.quality)}
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
                            {renderOptionalLabel(
                              scheduledMaintenance.dataInizio,
                              "non valorizzato"
                            )}
                            {" | "}KM max:{" "}
                            {renderOptionalLabel(
                              scheduledMaintenance.kmMax,
                              "non valorizzato"
                            )}
                            {" | "}Contratto:{" "}
                            {renderOptionalLabel(
                              scheduledMaintenance.contratto,
                              "non valorizzato"
                            )}
                          </span>
                        </div>
                      </div>
                    </article>

                    <article className="next-inline-panel">
                      <h3>Ultime manutenzioni</h3>
                      <p>
                        Storico interventi mezzo-centrico. Il Dossier mostra solo i record prodotti
                        dal layer dedicato, con badge gomme solo quando il pattern nella
                        descrizione e chiaro.
                      </p>
                      {maintenanceHistoryPreview.length === 0 ? (
                        <div className="next-data-state">
                          <strong>Nessuna manutenzione letta</strong>
                          <span>
                            Il layer dedicato non ha trovato storico manutentivo per questa targa.
                          </span>
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
                                  <span className="next-chip next-chip--subtle">
                                    {renderMaintenanceQualityLabel(item.quality)}
                                  </span>
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
                              <p>
                                Vista completa read-only del blocco manutenzioni. Anche qui la UI
                                legge solo il modello pulito del layer NEXT.
                              </p>
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
                                      <span className="next-chip next-chip--subtle">
                                        {renderMaintenanceQualityLabel(item.quality)}
                                      </span>
                                    </div>
                                    <strong>{renderOptionalLabel(item.descrizione)}</strong>
                                    <span>{renderMaintenanceHistoryMeta(item)}</span>
                                    <span>
                                      Origine: {item.sourceOrigin} {" | "}Dataset:{" "}
                                      {item.sourceDataset}
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
            </article>

            <div className="next-dossier-side">
              <article className="next-panel next-tone next-tone--success">
                <div className="next-panel__header">
                  <h2>Contatori manutenzioni</h2>
                </div>
                <p className="next-panel__description">
                  Contatori sobri del layer manutenzioni, utili al Dossier senza aprire il tema
                  costi o magazzino.
                </p>
                <ul className="next-panel__list">
                  <li>storico totale: {formatIntegerValue(maintenanceCounts?.totaleStorico ?? 0)}</li>
                  <li>record con materiali: {formatIntegerValue(maintenanceCounts?.conMateriali ?? 0)}</li>
                  <li>cambi gomme derivati: {formatIntegerValue(maintenanceCounts?.cambioGommeDerivati ?? 0)}</li>
                </ul>
              </article>

              <article className="next-panel next-tone next-tone--warning">
                <div className="next-panel__header">
                  <h2>Limiti del blocco</h2>
                </div>
                <p className="next-panel__description">
                  La v1 manutenzioni resta prudente e mezzo-centrica: nessuna scrittura, nessun
                  merge economico, nessuna dipendenza da workflow autisti.
                </p>
                {(maintenanceSnapshot?.limitations ?? []).length === 0 ? (
                  <div className="next-data-state">
                    <strong>Nessun limite aggiuntivo dichiarato</strong>
                    <span>Il layer non ha restituito limitazioni aggiuntive per questo mezzo.</span>
                  </div>
                ) : (
                  <ul className="next-panel__list">
                    {(maintenanceSnapshot?.limitations ?? []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          </section>

          <section className="next-dossier-layout">
            <article className="next-panel next-dossier-main next-tone next-tone--success">
              <div className="next-panel__header">
                <h2>Rifornimenti ricostruiti</h2>
                <span className="next-chip next-chip--success">
                  D04 ricostruzione controllata
                </span>
              </div>
              <p className="next-panel__description">
                Primo ingresso `D04` con parita utile verso il madre. Il blocco usa una
                ricostruzione controllata confinata nel layer NEXT: base business, feed campo solo
                se serve, merge confinato, modello pulito unico in output.
              </p>

              {refuelStatus === "loading" ? (
                <div className="next-data-state next-tone next-tone--accent">
                  <strong>Caricamento blocco rifornimenti</strong>
                  <span>
                    Sto leggendo il layer `D04` che ricostruisce i rifornimenti in sola lettura
                    per questo mezzo.
                  </span>
                </div>
              ) : null}

              {refuelStatus === "error" ? (
                <div className="next-data-state next-tone next-tone--warning">
                  <strong>Blocco rifornimenti non disponibile</strong>
                  <span>{refuelError}</span>
                </div>
              ) : null}

              {refuelStatus === "success" ? (
                <>
                  <div className="next-data-state next-tone">
                    <strong>Strategia attiva del blocco</strong>
                    <span>
                      Layer `D04`: {NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.normalizationStrategy}. Il
                      Dossier non conosce dataset raw, tmp, shape legacy o fallback: legge solo
                      il risultato pulito prodotto dal layer.
                    </span>
                  </div>

                  {refuelsPreview.length === 0 ? (
                    <div className="next-data-state">
                      <strong>Nessun rifornimento ricostruito</strong>
                      <span>
                        Il layer `D04` non ha trovato record utili per questa targa dopo la
                        ricostruzione controllata.
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="next-data-state next-tone next-tone--accent">
                        <strong>
                          Anteprima dossier: ultimi {formatIntegerValue(refuelsPreview.length)}{" "}
                          rifornimenti
                        </strong>
                        <span>
                          Il Dossier mostra solo i 5 record piu recenti. Totale ricostruito per
                          questo mezzo: {formatIntegerValue(refuels.length)}.
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
                        <div id="next-dossier-d04-full-view" className="next-inline-panel">
                          <div className="next-panel__header">
                            <h3>Vista completa D04</h3>
                            <span className="next-chip next-chip--accent">
                              {formatIntegerValue(refuels.length)} record
                            </span>
                          </div>
                          <p>
                            Vista completa read-only del mezzo. Anche qui la pagina consuma solo
                            il modello pulito prodotto dal layer `D04`, senza letture legacy
                            dirette.
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
            </article>

            <div className="next-dossier-side">
              <article className="next-panel next-tone next-tone--success">
                <div className="next-panel__header">
                  <h2>Contratto D04 importato</h2>
                </div>
                <p className="next-panel__description">
                  Il blocco rifornimenti non esporta piu la shape legacy. Espone un solo modello
                  pulito D04 con provenienza e qualita del dato.
                </p>
                <ul className="next-panel__list">
                  <li>campi chiave: `id`, `mezzoTarga`, `dataDisplay`, `timestampRicostruito?`, `litri`</li>
                  <li>campi opzionali: `km`, `costo`, `distributore`, `note`, `autistaNome`, `badgeAutista`</li>
                  <li>provenienza pulita: `business`, `campo`, `ricostruito`</li>
                  <li>
                    copertura attuale: {formatIntegerValue(refuelCountWithAutista)} record con
                    `autista`, {formatIntegerValue(refuelCountWithKm)} con `km`,
                    {" "}
                    {formatIntegerValue(refuelCountWithCosto)} con `costo`
                  </li>
                  <li>totale costo leggibile: {formatCurrencyValue(refuelTotalCosto)}</li>
                  <li>
                    mix sorgenti pulito: {formatIntegerValue(refuelSnapshot?.counts.businessOnly ?? null)}
                    {" "}solo business, {formatIntegerValue(refuelSnapshot?.counts.fieldOnly ?? null)}
                    {" "}solo campo, {formatIntegerValue(refuelCountReconstructed)} ricostruiti
                  </li>
                  <li>normalizzazione, merge e shape legacy confinati solo nel layer NEXT `D04`</li>
                </ul>
              </article>

              <article className="next-panel next-tone next-tone--warning">
                <div className="next-panel__header">
                  <h2>Cosa resta fuori da D04</h2>
                </div>
                <p className="next-panel__description">
                  La vista raggiunge il risultato utile del madre sui rifornimenti, ma non finge un
                  dominio gia consolidato o analitico completo.
                </p>
                <ul className="next-panel__list">
                  {refuelSnapshot?.limitations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                  <li>nessun calcolo consumi avanzato o report economico derivato nel Dossier NEXT</li>
                </ul>
              </article>
            </div>
          </section>

          <section className="next-section-grid">
            <article className="next-panel">
              <div className="next-panel__header">
                <h2>Cosa convergera qui</h2>
              </div>
              <p className="next-panel__description">
                Il Dossier resta il cuore mezzo-centrico, ma i prossimi ingressi dovranno arrivare
                dominio per dominio e con reader separati.
              </p>
              <ul className="next-panel__list">
                <li>estensione controllata di `D02` oltre il riepilogo iniziale</li>
                <li>estensione controllata di `D04` oltre la ricostruzione read-only attuale</li>
                <li>`D07` Documentale IA e libretti</li>
                <li>`D08` Costi e analisi economica</li>
              </ul>
            </article>

            <article className="next-panel next-tone next-tone--accent">
              <div className="next-panel__header">
                <h2>Stato attuale del Dossier NEXT</h2>
              </div>
              <p className="next-panel__description">
                Il Dossier e iniziato davvero, ma resta intenzionalmente stretto: identita mezzo,
                primo blocco tecnico, primo blocco rifornimenti ricostruito e base visiva pronta a
                ricevere convergenze future.
              </p>
              <ul className="next-panel__list">
                <li>read-only puro</li>
                <li>`D01` stabile + `D02` minimo + `D04` ricostruzione controllata</li>
                <li>nessun dominio extra importato per riempimento</li>
              </ul>
            </article>

            <article className="next-panel next-tone next-tone--success">
              <div className="next-panel__header">
                <h2>Reader canonico usato</h2>
              </div>
              <p className="next-panel__description">
                Il dettaglio non legge chiavi sparse e non replica la logica legacy: usa reader
                dedicati per dominio e seleziona il mezzo sempre per `targa`.
              </p>
              <ul className="next-panel__list">
                <li>dominio logico: `D01`</li>
                <li>dataset fisico: `storage/@mezzi_aziendali`</li>
                <li>dominio logico: `D02` su `@lavori` e `@manutenzioni`</li>
                <li>dominio logico: `D04` su un solo layer NEXT che ricostruisce business + feed campo</li>
              </ul>
            </article>
          </section>
        </>
      ) : null}
    </section>
  );
}

export default NextDossierMezzoPage;
