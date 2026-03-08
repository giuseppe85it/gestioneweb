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
        return;
      }

      try {
        setStatus("loading");
        setError(null);
        setTechnicalSnapshot(null);
        setTechnicalStatus("idle");
        setTechnicalError(null);

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

        try {
          const technicalRecord = await readNextMezzoOperativitaTecnicaSnapshot(normalizedTarga);
          if (!active) return;

          setTechnicalSnapshot(technicalRecord);
          setTechnicalStatus("success");
        } catch {
          if (!active) return;

          setTechnicalSnapshot(null);
          setTechnicalStatus("error");
          setTechnicalError(
            "Impossibile leggere il primo blocco tecnico dal reader canonico `D02`."
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
            il dominio stabile `Anagrafiche flotta e persone` e aggiunge il primo blocco tecnico
            reale di `Operativita tecnica mezzo` solo nella sua porzione minima e piu stabile.
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
          <span className="next-chip next-chip--warning">D02 sensibile</span>
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
              <strong className="next-summary-card__value">D01 + D02 minimo</strong>
              <p className="next-summary-card__meta">
                Identita mezzo stabile piu convergenza tecnica iniziale `read-only`. Restano
                fuori rifornimenti, documenti, costi, PDF e IA contestuale.
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
                  e `D02` per il primo blocco tecnico reale.
                </p>
                <ul className="next-panel__list">
                  <li>`id`, `targa`, `categoria`, `marca`, `modello`, `autistaNome`</li>
                  <li>`lavori` minimi: `descrizione`, `eseguito`, `urgenza`, `dataInserimento`</li>
                  <li>`manutenzioni` minime: `descrizione`, `tipo`, `data`, `km`, `ore`</li>
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
                  <li>nessun rifornimento o costo</li>
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
                <li>`D04` Rifornimenti e consumi</li>
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
                primo blocco tecnico e base visiva pronta a ricevere convergenze future.
              </p>
              <ul className="next-panel__list">
                <li>read-only puro</li>
                <li>`D01` stabile + `D02` minimo e sensibile</li>
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
              </ul>
            </article>
          </section>
        </>
      ) : null}
    </section>
  );
}

export default NextDossierMezzoPage;
