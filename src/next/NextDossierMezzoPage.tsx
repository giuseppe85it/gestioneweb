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
  type NextManutenzioneTecnicaItem,
  type NextMezzoOperativitaTecnicaSnapshot,
  readNextMezzoOperativitaTecnicaSnapshot,
} from "./nextOperativitaTecnicaDomain";
import {
  NEXT_RIFORNIMENTI_CONSUMI_DOMAIN,
  type NextMezzoRifornimentiSnapshot,
  type NextRifornimentoReadOnlyItem,
  readNextMezzoRifornimentiSnapshot,
} from "./nextRifornimentiConsumiDomain";

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

function renderManutenzioneMeta(item: NextManutenzioneTecnicaItem) {
  const parts = [
    item.data ? `Data ${item.data}` : null,
    item.tipo ? `Tipo ${item.tipo}` : null,
    item.km !== null ? `${item.km} km` : null,
    item.ore !== null ? `${item.ore} h` : null,
  ].filter(Boolean);

  return parts.join(" | ") || "Manutenzione senza data o misure valorizzate.";
}

function renderTechnicalStatusLabel(
  status: "idle" | "loading" | "success" | "error"
) {
  switch (status) {
    case "loading":
      return "Caricamento D02";
    case "success":
      return "Convergenza minima attiva";
    case "error":
      return "Reader D02 in errore";
    default:
      return "In attesa";
  }
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
      return snapshot?.datasetShape === "items"
        ? "Canonico ridotto attivo"
        : "Dataset non conforme";
    case "error":
      return "Reader D04 in errore";
    default:
      return "In attesa";
  }
}

function renderRifornimentoMeta(item: NextRifornimentoReadOnlyItem) {
  const parts = [
    item.data ? `Data ${item.data}` : "Data display non valorizzata",
    item.litri !== null ? `${formatLitriValue(item.litri)} L` : null,
  ].filter(Boolean);

  return parts.join(" | ");
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
        setRefuelStatus("loading");

        const [technicalResult, refuelResult] = await Promise.allSettled([
          readNextMezzoOperativitaTecnicaSnapshot(normalizedTarga),
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
  const manutenzioni = technicalSnapshot?.manutenzioni ?? [];
  const lavoriApertiPreview = lavoriAperti.slice(0, 3);
  const lavoriChiusiPreview = lavoriChiusi.slice(0, 3);
  const manutenzioniPreview = manutenzioni.slice(0, 3);
  const refuels = refuelSnapshot?.items ?? [];
  const refuelsPreview = refuels.slice(0, 5);
  const isRefuelContractActive = refuelSnapshot?.datasetShape === "items";
  const refuelCount = isRefuelContractActive ? (refuelSnapshot?.counts.total ?? 0) : null;
  const refuelTotalLitri = isRefuelContractActive ? (refuelSnapshot?.totals.litri ?? null) : null;
  const refuelCountWithKm = isRefuelContractActive ? (refuelSnapshot?.counts.withKm ?? 0) : null;

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
            reale di `Operativita tecnica mezzo` e introduce il primo layer di normalizzazione
            `D04` per i rifornimenti, confinato nel perimetro NEXT.
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
          <span className="next-chip next-chip--success">D04 canonico ridotto</span>
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
              <strong className="next-summary-card__value">D01 + D02 + D04 ridotto</strong>
              <p className="next-summary-card__meta">
                Identita mezzo stabile, blocco tecnico iniziale e primo blocco rifornimenti
                normalizzato in NEXT. Restano fuori consumi calcolati, documenti, PDF e IA
                contestuale.
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
                {technicalStatus === "success" ? manutenzioni.length : "--"}
              </strong>
              <p className="next-summary-card__meta">
                Storico manutentivo minimo letto da
                {" "}
                `{NEXT_OPERATIVITA_TECNICA_DOMAIN.logicalDatasets[1]}`.
              </p>
            </article>

            <article className="next-summary-card next-tone next-tone--warning">
              <p className="next-summary-card__label">Blocco tecnico</p>
              <strong className="next-summary-card__value">
                {renderTechnicalStatusLabel(technicalStatus)}
              </strong>
              <p className="next-summary-card__meta">
                Dominio `D02` ancora `SENSIBILE`: qui entra solo come convergenza minima e solo
                in lettura.
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
                Record letti dal layer `D04` solo da
                {" "}
                `{NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.activeReadOnlyDataset}.items`.
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
                Somma solo dei `litri` presenti nel dataset canonico ridotto, senza recuperi da
                staging o merge legacy.
              </p>
            </article>

            <article className="next-summary-card next-tone next-tone--accent">
              <p className="next-summary-card__label">Record con km</p>
              <strong className="next-summary-card__value">
                {refuelStatus === "success" ? formatIntegerValue(refuelCountWithKm) : "--"}
              </strong>
              <p className="next-summary-card__meta">
                `km` resta campo opzionale e non garantito: la card mostra solo quanti record lo
                espongono gia nel canonico.
              </p>
            </article>

            <article className="next-summary-card next-tone next-tone--warning">
              <p className="next-summary-card__label">Blocco rifornimenti</p>
              <strong className="next-summary-card__value">
                {renderRefuelStatusLabel(refuelStatus, refuelSnapshot)}
              </strong>
              <p className="next-summary-card__meta">
                Nessuna lettura `tmp`, nessun fallback `value.items`, nessun merge reader-side.
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
                  e `D02` per il primo blocco tecnico reale, piu un layer `D04` che normalizza il
                  canonico rifornimenti senza toccare il runtime legacy.
                </p>
                <ul className="next-panel__list">
                  <li>`id`, `targa`, `categoria`, `marca`, `modello`, `autistaNome`</li>
                  <li>`lavori` minimi: `descrizione`, `eseguito`, `urgenza`, `dataInserimento`</li>
                  <li>`manutenzioni` minime: `descrizione`, `tipo`, `data`, `km`, `ore`</li>
                  <li>`rifornimenti` minimi: `id`, `mezzoTarga`, `data`, `litri`, `distributore`, `note`</li>
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
                  <li>nessun merge `tmp/canonico`, nessun autista/badge o `timestamp` in D04</li>
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
                riepilogo pulito di lavori e manutenzioni senza importare route, writer o logiche
                di orchestrazione legacy.
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

                  <article className="next-inline-panel">
                    <h3>Manutenzioni</h3>
                    <p>
                      Storico manutentivo iniziale del mezzo. Entrano solo data, tipo, descrizione
                      e misure stabili, senza lettura di materiali o costi collegati.
                    </p>
                    {manutenzioniPreview.length === 0 ? (
                      <div className="next-data-state">
                        <strong>Nessuna manutenzione letta</strong>
                        <span>Il reader `D02` non ha trovato manutenzioni per questa targa.</span>
                      </div>
                    ) : (
                      <div className="next-control-list">
                        {manutenzioniPreview.map((item) => (
                          <div key={item.id} className="next-control-list__item">
                            <div className="next-global-pillbar">
                              <span className="next-chip next-chip--subtle">
                                {renderOptionalLabel(item.tipo, "Tipo non valorizzato")}
                              </span>
                            </div>
                            <strong>{renderOptionalLabel(item.descrizione)}</strong>
                            <span>{renderManutenzioneMeta(item)}</span>
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
                  <li>lettura `@manutenzioni` solo come storico tecnico minimo</li>
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
                  <li>nessuna ricostruzione completa delle origini da flussi autisti</li>
                </ul>
              </article>
            </div>
          </section>

          <section className="next-dossier-layout">
            <article className="next-panel next-dossier-main next-tone next-tone--success">
              <div className="next-panel__header">
                <h2>Rifornimenti normalizzati</h2>
                <span className="next-chip next-chip--success">D04 canonico ridotto</span>
              </div>
              <p className="next-panel__description">
                Primo ingresso `D04` nel Dossier NEXT. Questo blocco non copia il comportamento del
                madre: legge solo il dataset business target
                {" "}
                <code>{NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.activeReadOnlyDataset}.items</code>,
                normalizza i campi nel layer dedicato e porta in UI solo il modello pulito
                risultante.
              </p>

              {refuelStatus === "loading" ? (
                <div className="next-data-state next-tone next-tone--accent">
                  <strong>Caricamento blocco rifornimenti</strong>
                  <span>
                    Sto leggendo il dataset canonico ridotto
                    {" "}
                    <code>{NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.activeReadOnlyDataset}.items</code>
                    {" "}senza toccare `tmp`.
                  </span>
                </div>
              ) : null}

              {refuelStatus === "error" ? (
                <div className="next-data-state next-tone next-tone--warning">
                  <strong>Blocco rifornimenti non disponibile</strong>
                  <span>{refuelError}</span>
                </div>
              ) : null}

              {refuelStatus === "success" && !isRefuelContractActive ? (
                <div className="next-data-state next-tone next-tone--warning">
                  <strong>Contratto dataset non conforme</strong>
                  <span>
                    Il layer `D04` accetta solo
                    {" "}
                    <code>{NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.activeReadOnlyDataset}.items</code>
                    {" "}top-level. Nessun fallback legacy e stato applicato.
                  </span>
                </div>
              ) : null}

              {refuelStatus === "success" && isRefuelContractActive ? (
                <>
                  <div className="next-data-state next-tone">
                    <strong>Sorgente attiva del blocco</strong>
                    <span>
                      Dataset fisico:
                      {" "}
                      <code>storage/{NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.activeReadOnlyDataset}</code>
                      {" "}con shape accettata <code>items[]</code>. `data` resta una label
                      display; `km` e `costo` restano opzionali e non garantiti.
                    </span>
                  </div>

                  {refuelsPreview.length === 0 ? (
                    <div className="next-data-state">
                      <strong>Nessun rifornimento canonico letto</strong>
                      <span>
                        Il layer `D04` non ha trovato record compatibili per questa targa nel
                        dataset canonico ridotto.
                      </span>
                    </div>
                  ) : (
                    <div className="next-control-list">
                      {refuelsPreview.map((item) => (
                        <div key={item.id} className="next-control-list__item">
                          <div className="next-global-pillbar">
                            <span className="next-chip next-chip--accent">
                              {item.data ?? "Data non valorizzata"}
                            </span>
                            <span className="next-chip next-chip--subtle">
                              {item.litri !== null
                                ? `${formatLitriValue(item.litri)} L`
                                : "Litri non valorizzati"}
                            </span>
                            <span className="next-chip next-chip--subtle">
                              {item.km !== null
                                ? `${formatIntegerValue(item.km)} km`
                                : "km opzionale"}
                            </span>
                            <span className="next-chip next-chip--subtle">
                              {item.costo !== null
                                ? formatCurrencyValue(item.costo)
                                : "costo opzionale"}
                            </span>
                          </div>
                          <strong>
                            {renderOptionalLabel(
                              item.distributore,
                              "Distributore non valorizzato"
                            )}
                          </strong>
                          <span>{renderRifornimentoMeta(item)}</span>
                          <span>
                            {renderOptionalLabel(
                              item.note,
                              "Nessuna nota dossier nel canonico ridotto."
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
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
                  Il blocco rifornimenti e volutamente stretto: usa solo il sottoinsieme ritenuto
                  abbastanza leggibile del canonico reale.
                </p>
                <ul className="next-panel__list">
                  <li>
                    dataset fisico: `storage/{NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.activeReadOnlyDataset}`
                  </li>
                  <li>shape accettata: `items[]` top-level</li>
                  <li>campi certi: `id`, `mezzoTarga`, `data`, `litri`, `distributore`, `note`</li>
                  <li>campi opzionali: `km`, `costo`</li>
                  <li>
                    copertura attuale: {formatIntegerValue(refuelCountWithKm)} record con `km`,
                    {" "}
                    {formatIntegerValue(
                      isRefuelContractActive ? (refuelSnapshot?.counts.withCosto ?? 0) : null
                    )}{" "}
                    record con `costo`
                  </li>
                  <li>normalizzazione confinata solo nel layer NEXT `D04`</li>
                </ul>
              </article>

              <article className="next-panel next-tone next-tone--warning">
                <div className="next-panel__header">
                  <h2>Cosa resta fuori da D04</h2>
                </div>
                <p className="next-panel__description">
                  La vista non finge parita totale con il madre. Il contratto resta ridotto e
                  controllato finche il dominio non verra ulteriormente consolidato.
                </p>
                <ul className="next-panel__list">
                  <li>nessuna lettura `@rifornimenti_autisti_tmp`</li>
                  <li>nessun fallback `value.items` o merge reader-side</li>
                  <li>nessun `timestamp`, `autistaNome`, `badgeAutista`, `source`, `validation`</li>
                  <li>nessun calcolo consumi o report economico derivato</li>
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
                <li>estensione controllata di `D04` oltre il canonico ridotto</li>
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
                primo blocco tecnico, primo blocco rifornimenti normalizzato e base visiva pronta a
                ricevere convergenze future.
              </p>
              <ul className="next-panel__list">
                <li>read-only puro</li>
                <li>`D01` stabile + `D02` minimo + `D04` canonico ridotto</li>
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
                <li>dominio logico: `D04` su `storage/@rifornimenti.items`</li>
              </ul>
            </article>
          </section>
        </>
      ) : null}
    </section>
  );
}

export default NextDossierMezzoPage;
