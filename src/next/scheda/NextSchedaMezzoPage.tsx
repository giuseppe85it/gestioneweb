// Scheda mezzo NEXT — riepilogo completo di tutto ciò che è legato a una targa.
// Riusa la lettura aggregata del dossier (readNextDossierMezzoCompositeSnapshot
// + buildNextDossierMezzoLegacyView) e aggiunge scadenze e segnalazioni/controlli
// del mezzo (non inclusi nel composite). Rimanda al dossier completo per i dettagli.
// Sola lettura: nessuna scrittura, nessun timestamp generato da click.

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  buildNextDossierMezzoLegacyView,
  readNextDossierMezzoCompositeSnapshot,
  type NextDossierLegacyWorkItem,
  type NextDossierMezzoLegacyViewState,
} from "../domain/nextDossierMezzoDomain";
import {
  normalizeScadenzaTarga,
  readNextManutenzioniScadenzeSnapshot,
  type NextManutenzioneScadenzaItem,
  type NextScadenzaStato,
} from "../domain/nextManutenzioniScadenzeDomain";
import {
  readNextMezzoSegnalazioniControlliSnapshot,
  type NextMezzoSegnalazioniControlliTimelineItem,
} from "../domain/nextSegnalazioniControlliDomain";
import {
  findNextAutistiAssignmentsByTarga,
  readNextAutistiReadOnlySnapshot,
  type NextAutistiCanonicalAssignment,
} from "../domain/nextAutistiDomain";
import { buildNextDossierPath } from "../nextStructuralPaths";
import { buildNextPathWithRole, getNextRoleFromSearch } from "../nextAccess";
import { toDisplay } from "../helpers/dateUnica";
import "./next-scheda.css";

type LoadStatus = "loading" | "ready" | "notfound" | "error";
type Tone = "ok" | "warning" | "danger" | "info" | "idle";

type ConduzionePeriodo = {
  nome: string;
  badge: string | null;
  start: number;
  end: number | null;
};

type SchedaMezzoExtra = {
  scadenze: NextManutenzioneScadenzaItem[];
  eventi: NextMezzoSegnalazioniControlliTimelineItem[];
  segnalazioniTotali: number;
  controlliKo: number;
  conduzione: ConduzionePeriodo[];
};

// Ricostruisce la sequenza di conducenti del mezzo dagli assignment ordinati
// per tempo: ogni periodo va dall'inizio dell'autista all'inizio del successivo.
function buildConduzione(
  assignments: NextAutistiCanonicalAssignment[],
): ConduzionePeriodo[] {
  const withTs = assignments
    .filter((entry) => typeof entry.timestamp === "number" && (entry.timestamp as number) > 0)
    .sort((left, right) => (left.timestamp as number) - (right.timestamp as number));

  const periods: ConduzionePeriodo[] = [];
  let lastKey = "";
  for (const entry of withTs) {
    const key =
      (entry.badgeAutista ?? "").trim().toUpperCase().replace(/\s+/g, "") ||
      (entry.autistaNome ?? "").trim().toLowerCase();
    if (!key || key === lastKey) continue;
    if (periods.length > 0) periods[periods.length - 1].end = entry.timestamp as number;
    periods.push({
      nome: (entry.autistaNome ?? "").trim() || "Autista non indicato",
      badge: entry.badgeAutista ?? null,
      start: entry.timestamp as number,
      end: null,
    });
    lastKey = key;
  }
  return periods;
}

const SCADENZA_SEVERITA: Record<NextScadenzaStato, number> = {
  scaduta: 4,
  in_scadenza: 3,
  ok: 2,
  valore_non_disponibile: 1,
  data_mancante: 0,
};

function urgencyTone(urgenza: string | null | undefined): "danger" | "warning" | "idle" {
  const value = (urgenza ?? "").toLowerCase();
  if (value.includes("alt") || value.includes("urgen")) return "danger";
  if (value.includes("med")) return "warning";
  return "idle";
}

function scadenzaBadge(item: NextManutenzioneScadenzaItem): { tone: Tone; label: string } {
  switch (item.stato) {
    case "scaduta":
      return { tone: "danger", label: "scaduta" };
    case "in_scadenza":
      return { tone: "warning", label: "in scadenza" };
    case "ok":
      return { tone: "ok", label: "ok" };
    default:
      return { tone: "idle", label: "dato mancante" };
  }
}

function giorniLabel(giorni: number | null): string {
  if (giorni === null) return "data non disponibile";
  if (giorni < 0) return `scaduta da ${Math.abs(giorni)} gg`;
  if (giorni === 0) return "scade oggi";
  return `tra ${giorni} gg`;
}

function formatImporto(importo: number | undefined, valuta: string): string | null {
  if (typeof importo !== "number" || !Number.isFinite(importo)) return null;
  const suffix = valuta && valuta !== "UNKNOWN" ? ` ${valuta}` : "";
  return `${importo.toLocaleString("it-IT")}${suffix}`;
}

function MetaItem({ label, value }: { label: string; value: string | null | undefined }) {
  const text = (value ?? "").toString().trim();
  if (!text) return null;
  return (
    <div className="next-scheda__meta-item">
      <span className="next-scheda__meta-label">{label}</span>
      <span className="next-scheda__meta-value">{text}</span>
    </div>
  );
}

function SectionHead({ title, count }: { title: string; count?: number }) {
  return (
    <div className="next-scheda__section-head">
      <h2 className="next-scheda__section-title">{title}</h2>
      {typeof count === "number" ? (
        <span className="next-scheda__section-link">{count}</span>
      ) : null}
    </div>
  );
}

function NextSchedaMezzoPage() {
  const { targa: rawTarga } = useParams<{ targa: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [view, setView] = useState<NextDossierMezzoLegacyViewState | null>(null);
  const [extra, setExtra] = useState<SchedaMezzoExtra | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    setView(null);
    setExtra(null);

    (async () => {
      try {
        const [composite, scadenzeSnap, segnControlli, autistiSnap] = await Promise.all([
          readNextDossierMezzoCompositeSnapshot(rawTarga ?? ""),
          readNextManutenzioniScadenzeSnapshot(),
          readNextMezzoSegnalazioniControlliSnapshot(rawTarga ?? ""),
          readNextAutistiReadOnlySnapshot(),
        ]);
        if (!alive) return;
        if (!composite) {
          setStatus("notfound");
          return;
        }

        const builtView = buildNextDossierMezzoLegacyView(composite);
        const targaNorm = normalizeScadenzaTarga(builtView.mezzo?.targa ?? rawTarga ?? "");
        const conduzione = buildConduzione(
          findNextAutistiAssignmentsByTarga(autistiSnap, builtView.mezzo?.targa ?? rawTarga ?? ""),
        );
        const scadenze = scadenzeSnap.items
          .filter((item) => item.attiva && normalizeScadenzaTarga(item.targa) === targaNorm)
          .sort(
            (left, right) =>
              SCADENZA_SEVERITA[right.stato] - SCADENZA_SEVERITA[left.stato] ||
              (left.giorniMin ?? 99999) - (right.giorniMin ?? 99999),
          );

        setView(builtView);
        setExtra({
          scadenze,
          eventi: segnControlli.timelineItems,
          segnalazioniTotali: segnControlli.counts.segnalazioniTotali,
          controlliKo: segnControlli.counts.controlliKo,
          conduzione,
        });
        setStatus("ready");
      } catch {
        if (!alive) return;
        setStatus("error");
      }
    })();

    return () => {
      alive = false;
    };
  }, [rawTarga]);

  const rifornimentiSorted = useMemo(() => {
    if (!view) return [];
    return [...view.rifornimenti].sort((left, right) => (right.data ?? 0) - (left.data ?? 0));
  }, [view]);

  const kmAttuali = useMemo(() => {
    if (!view) return null;
    const kms = view.rifornimenti
      .map((entry) => entry.km)
      .filter((km): km is number => typeof km === "number" && Number.isFinite(km));
    return kms.length > 0 ? Math.max(...kms) : null;
  }, [view]);

  const role = getNextRoleFromSearch(location.search);
  const dossierPath = view
    ? buildNextPathWithRole(buildNextDossierPath(view.mezzo?.targa ?? rawTarga ?? ""), role)
    : "#";

  const scadenzeCritiche = extra
    ? extra.scadenze.filter((item) => item.stato === "scaduta" || item.stato === "in_scadenza").length
    : 0;

  const conduzione = extra?.conduzione ?? [];
  const conducenteAttuale = conduzione.length > 0 ? conduzione[conduzione.length - 1] : null;
  const conducentePrecedente = conduzione.length >= 2 ? conduzione[conduzione.length - 2] : null;
  const conduzioneStorica = conduzione.length > 2 ? conduzione.slice(0, -2).reverse() : [];

  return (
    <div className="next-scheda">
      <button type="button" className="next-scheda__back" onClick={() => navigate(-1)}>
        ← Indietro
      </button>

      {status === "loading" ? (
        <div className="next-scheda__loading">Carico la scheda del mezzo…</div>
      ) : null}

      {status === "error" ? (
        <div className="next-scheda__error">
          Impossibile leggere i dati del mezzo. Riprova più tardi.
        </div>
      ) : null}

      {status === "notfound" ? (
        <div className="next-scheda__error">
          Nessun mezzo trovato per la targa “{rawTarga}”.
        </div>
      ) : null}

      {status === "ready" && view && extra ? (
        <>
          <div className="next-scheda__header">
            <div className="next-scheda__header-left">
              <img
                src="/logo.png"
                alt="Gestione e Manutenzione"
                className="next-scheda__header-logo"
              />
              <div className="next-scheda__header-main">
                <div className="next-scheda__eyebrow">Scheda mezzo</div>
                <h1 className="next-scheda__title next-scheda__title--plate">
                  {view.mezzo?.targa ?? rawTarga}
                </h1>
                <div className="next-scheda__subtitle">
                  {[view.mezzo?.categoria, view.mezzo?.marcaModello]
                    .map((part) => (part ?? "").trim())
                    .filter(Boolean)
                    .join(" · ") || "Mezzo"}
                </div>
                {view.mezzo?.manutenzioneProgrammata ? (
                  <div className="next-scheda__tags">
                    <span className="next-scheda__badge next-scheda__badge--info">
                      Manutenzione programmata
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="next-scheda__actions">
              <a className="next-scheda__btn next-scheda__btn--primary" href={dossierPath}>
                Apri dossier completo
              </a>
            </div>
          </div>

          <div className="next-scheda__stats">
            <div className="next-scheda__stat">
              <div className="next-scheda__stat-value">{view.lavoriDaEseguire.length}</div>
              <div className="next-scheda__stat-label">Lavori da eseguire</div>
            </div>
            <div className="next-scheda__stat">
              <div className="next-scheda__stat-value">{scadenzeCritiche}</div>
              <div className="next-scheda__stat-label">Scadenze critiche</div>
            </div>
            <div className="next-scheda__stat">
              <div className="next-scheda__stat-value">{view.rifornimenti.length}</div>
              <div className="next-scheda__stat-label">Rifornimenti</div>
            </div>
            <div className="next-scheda__stat">
              <div className="next-scheda__stat-value">{view.documentiCosti.length}</div>
              <div className="next-scheda__stat-label">Documenti / costi</div>
            </div>
          </div>

          <section className="next-scheda__section">
            <SectionHead title="Conduzione mezzo" />
            {conducenteAttuale ? (
              <div className="next-scheda__kv-list">
                <div className="next-scheda__kv next-scheda__kv--current">
                  <div className="next-scheda__kv-key">
                    <span className="next-scheda__kv-name">{conducenteAttuale.nome}</span>
                    {conducenteAttuale.badge ? (
                      <span className="next-scheda__kv-sub">badge {conducenteAttuale.badge}</span>
                    ) : null}
                  </div>
                  <div className="next-scheda__kv-val">
                    <span className="next-scheda__badge next-scheda__badge--ok">in uso</span>
                    <span className="next-scheda__kv-meta">
                      dal {toDisplay(conducenteAttuale.start) || "—"}
                    </span>
                  </div>
                </div>

                {conducentePrecedente ? (
                  <div className="next-scheda__kv">
                    <div className="next-scheda__kv-key">
                      <span className="next-scheda__kv-name">{conducentePrecedente.nome}</span>
                      <span className="next-scheda__kv-sub">conducente precedente</span>
                    </div>
                    <div className="next-scheda__kv-val">
                      <span className="next-scheda__kv-strong">
                        {toDisplay(conducentePrecedente.start) || "—"} –{" "}
                        {toDisplay(conducentePrecedente.end) || "—"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="next-scheda__kv">
                    <div className="next-scheda__kv-key">
                      <span className="next-scheda__kv-name">Nessun conducente precedente</span>
                    </div>
                  </div>
                )}

                {conduzioneStorica.map((periodo, index) => (
                  <div
                    key={`${periodo.nome}:${periodo.start}:${index}`}
                    className="next-scheda__kv"
                  >
                    <div className="next-scheda__kv-key">
                      <span className="next-scheda__kv-name">{periodo.nome}</span>
                    </div>
                    <div className="next-scheda__kv-val">
                      <span className="next-scheda__kv-strong">
                        {toDisplay(periodo.start) || "—"}
                        {periodo.end ? ` – ${toDisplay(periodo.end)}` : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="next-scheda__empty">
                Nessuna assegnazione conducente tracciata.
                {view.mezzo?.autistaNome ? ` Autista abituale: ${view.mezzo.autistaNome}.` : ""}
              </div>
            )}
          </section>

          <section className="next-scheda__section">
            <SectionHead title="Anagrafica" />
            <div className="next-scheda__meta-grid">
              <MetaItem label="Categoria" value={view.mezzo?.categoria} />
              <MetaItem label="Marca / Modello" value={view.mezzo?.marcaModello} />
              <MetaItem label="Anno" value={view.mezzo?.anno} />
              <MetaItem label="Autista assegnato" value={view.mezzo?.autistaNome} />
              <MetaItem label="Proprietario" value={view.mezzo?.proprietario} />
              <MetaItem
                label="Scadenza revisione"
                value={
                  view.mezzo?.dataScadenzaRevisione
                    ? toDisplay(view.mezzo.dataScadenzaRevisione) || view.mezzo.dataScadenzaRevisione
                    : null
                }
              />
              <MetaItem
                label="Km attuali"
                value={kmAttuali !== null ? kmAttuali.toLocaleString("it-IT") : null}
              />
            </div>
          </section>

          {view.mezzo?.manutenzioneProgrammata ? (
            <section className="next-scheda__section">
              <SectionHead title="Manutenzione programmata" />
              <div className="next-scheda__meta-grid">
                <MetaItem label="Contratto / Officina" value={view.mezzo.manutenzioneContratto} />
                <MetaItem
                  label="Dal"
                  value={
                    view.mezzo.manutenzioneDataInizio
                      ? toDisplay(view.mezzo.manutenzioneDataInizio) ||
                        view.mezzo.manutenzioneDataInizio
                      : null
                  }
                />
                <MetaItem
                  label="Al"
                  value={
                    view.mezzo.manutenzioneDataFine
                      ? toDisplay(view.mezzo.manutenzioneDataFine) || view.mezzo.manutenzioneDataFine
                      : null
                  }
                />
                <MetaItem label="Km massimi" value={view.mezzo.manutenzioneKmMax} />
              </div>
            </section>
          ) : null}

          <section className="next-scheda__section">
            <SectionHead title="Scadenze" count={extra.scadenze.length} />
            {extra.scadenze.length === 0 ? (
              <div className="next-scheda__empty">Nessuna scadenza configurata.</div>
            ) : (
              <div className="next-scheda__kv-list">
                {extra.scadenze.map((scadenza) => {
                  const badge = scadenzaBadge(scadenza);
                  const prossima = scadenza.componenti.find((c) => c.base === "tempo")?.prossimaData;
                  return (
                    <div key={scadenza.id} className="next-scheda__kv">
                      <div className="next-scheda__kv-key">
                        <span className="next-scheda__kv-name">
                          {scadenza.label || scadenza.tipo}
                        </span>
                        {prossima ? (
                          <span className="next-scheda__kv-sub">prossima {toDisplay(prossima)}</span>
                        ) : null}
                      </div>
                      <div className="next-scheda__kv-val next-scheda__kv-val--badge">
                        <span className={`next-scheda__badge next-scheda__badge--${badge.tone}`}>
                          {badge.label}
                        </span>
                        {scadenza.giorniMin !== null ? (
                          <span className={`next-scheda__kv-meta next-scheda__kv-meta--${badge.tone}`}>
                            {giorniLabel(scadenza.giorniMin)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="next-scheda__section">
            <SectionHead title="Segnalazioni e controlli" count={extra.eventi.length} />
            {extra.eventi.length === 0 ? (
              <div className="next-scheda__empty">Nessuna segnalazione o controllo per questo mezzo.</div>
            ) : (
              <div className="next-scheda__list">
                {extra.eventi.slice(0, 8).map((evento) => (
                  <div key={evento.id} className="next-scheda__row">
                    <div className="next-scheda__row-main">
                      <div className="next-scheda__row-title">{evento.title}</div>
                      {evento.subtitle || evento.detail ? (
                        <div className="next-scheda__row-detail">
                          {evento.subtitle || evento.detail}
                        </div>
                      ) : null}
                      <div className="next-scheda__row-meta">
                        <span>{evento.source === "controllo" ? "Controllo" : "Segnalazione"}</span>
                      </div>
                    </div>
                    <div className="next-scheda__row-aside">
                      <span className="next-scheda__time">
                        {toDisplay(evento.timestamp ?? evento.data) || "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="next-scheda__section">
            <SectionHead title="Lavori da eseguire" count={view.lavoriDaEseguire.length} />
            {view.lavoriDaEseguire.length === 0 ? (
              <div className="next-scheda__empty">Nessun lavoro in coda.</div>
            ) : (
              <div className="next-scheda__list">
                {view.lavoriDaEseguire.slice(0, 6).map((lavoro: NextDossierLegacyWorkItem) => {
                  const tone = urgencyTone(lavoro.urgenza);
                  return (
                    <div key={lavoro.id} className="next-scheda__row">
                      <div className="next-scheda__row-main">
                        <div className="next-scheda__row-title">
                          {lavoro.descrizione || "Lavoro senza descrizione"}
                        </div>
                        {lavoro.segnalatoDa ? (
                          <div className="next-scheda__row-detail">
                            Segnalato da {lavoro.segnalatoDa}
                          </div>
                        ) : null}
                      </div>
                      <div className="next-scheda__row-aside">
                        {lavoro.urgenza ? (
                          <span className={`next-scheda__badge next-scheda__badge--${tone}`}>
                            {lavoro.urgenza}
                          </span>
                        ) : null}
                        <span className="next-scheda__time">
                          {toDisplay(lavoro.dataInserimento) || "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="next-scheda__section">
            <SectionHead title="Lavori eseguiti" count={view.lavoriEseguiti.length} />
            {view.lavoriEseguiti.length === 0 ? (
              <div className="next-scheda__empty">Nessun lavoro eseguito registrato.</div>
            ) : (
              <div className="next-scheda__list">
                {view.lavoriEseguiti.slice(0, 6).map((lavoro: NextDossierLegacyWorkItem) => (
                  <div key={lavoro.id} className="next-scheda__row">
                    <div className="next-scheda__row-main">
                      <div className="next-scheda__row-title">
                        {lavoro.descrizione || "Lavoro senza descrizione"}
                      </div>
                      {lavoro.chiHaEseguito ? (
                        <div className="next-scheda__row-detail">
                          Eseguito da {lavoro.chiHaEseguito}
                        </div>
                      ) : null}
                    </div>
                    <div className="next-scheda__row-aside">
                      <span className="next-scheda__time">
                        {toDisplay(lavoro.dataEsecuzione ?? lavoro.dataInserimento) || "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="next-scheda__section">
            <SectionHead title="Gomme per asse" count={view.gommePerAsse.length} />
            {view.gommePerAsse.length === 0 ? (
              <div className="next-scheda__empty">Nessun dato gomme per asse.</div>
            ) : (
              <div className="next-scheda__list">
                {view.gommePerAsse.map((asse) => (
                  <div key={asse.asseId} className="next-scheda__row">
                    <div className="next-scheda__row-main">
                      <div className="next-scheda__row-title">{asse.asseLabel}</div>
                      <div className="next-scheda__row-meta">
                        {asse.kmPercorsi !== null ? (
                          <span>{asse.kmPercorsi.toLocaleString("it-IT")} km percorsi</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="next-scheda__row-aside">
                      <span className="next-scheda__time">
                        {asse.dataCambio ? `cambio ${toDisplay(asse.dataCambio)}` : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="next-scheda__section">
            <SectionHead title="Materiali consegnati" count={view.movimentiMateriali.length} />
            {view.movimentiMateriali.length === 0 ? (
              <div className="next-scheda__empty">Nessun materiale consegnato a questo mezzo.</div>
            ) : (
              <div className="next-scheda__list">
                {view.movimentiMateriali.slice(0, 6).map((mov) => (
                  <div key={mov.id} className="next-scheda__row">
                    <div className="next-scheda__row-main">
                      <div className="next-scheda__row-title">
                        {mov.materialeLabel || mov.descrizione || "Materiale"}
                      </div>
                      <div className="next-scheda__row-meta">
                        {typeof mov.quantita === "number" ? (
                          <span>
                            {mov.quantita.toLocaleString("it-IT")} {mov.unita || "pz"}
                          </span>
                        ) : null}
                        {mov.fornitoreLabel ? <span>{mov.fornitoreLabel}</span> : null}
                      </div>
                    </div>
                    <div className="next-scheda__row-aside">
                      <span className="next-scheda__time">{toDisplay(mov.data) || "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="next-scheda__section">
            <SectionHead title="Ultimi rifornimenti" count={view.rifornimenti.length} />
            {rifornimentiSorted.length === 0 ? (
              <div className="next-scheda__empty">Nessun rifornimento registrato.</div>
            ) : (
              <div className="next-scheda__list">
                {rifornimentiSorted.slice(0, 6).map((rifornimento) => (
                  <div key={rifornimento.id} className="next-scheda__row">
                    <div className="next-scheda__row-main">
                      <div className="next-scheda__row-title">
                        {typeof rifornimento.litri === "number"
                          ? `${rifornimento.litri} L`
                          : "Rifornimento"}
                        {rifornimento.tipo ? ` · ${rifornimento.tipo}` : ""}
                      </div>
                      <div className="next-scheda__row-meta">
                        {typeof rifornimento.km === "number" ? (
                          <span>{rifornimento.km.toLocaleString("it-IT")} km</span>
                        ) : null}
                        {rifornimento.autistaNome ? <span>{rifornimento.autistaNome}</span> : null}
                      </div>
                    </div>
                    <div className="next-scheda__row-aside">
                      <span className="next-scheda__time">
                        {toDisplay(rifornimento.data) || "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="next-scheda__section">
            <SectionHead title="Documenti e costi" count={view.documentiCosti.length} />
            {view.documentiCosti.length === 0 ? (
              <div className="next-scheda__empty">Nessun documento o costo registrato.</div>
            ) : (
              <div className="next-scheda__list">
                {view.documentiCosti.slice(0, 6).map((doc) => {
                  const importo = formatImporto(doc.importo, doc.valuta);
                  return (
                    <div key={doc.id} className="next-scheda__row">
                      <div className="next-scheda__row-main">
                        <div className="next-scheda__row-title">
                          {doc.descrizione || (doc.tipo === "FATTURA" ? "Fattura" : "Preventivo")}
                        </div>
                        <div className="next-scheda__row-meta">
                          <span>{doc.tipo === "FATTURA" ? "Fattura" : "Preventivo"}</span>
                          {doc.fornitoreLabel ? <span>{doc.fornitoreLabel}</span> : null}
                        </div>
                      </div>
                      <div className="next-scheda__row-aside">
                        {importo ? (
                          <span className="next-scheda__badge next-scheda__badge--info">{importo}</span>
                        ) : null}
                        <span className="next-scheda__time">{toDisplay(doc.data) || "—"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

export default NextSchedaMezzoPage;
