// Scheda mezzo NEXT — layout a griglia di card (riproduce 1:1 il mockup approvato).
// La lettura dati riusa i reader del dossier + scadenze + segnalazioni/controlli + conduzione.
// Sola lettura: nessuna scrittura, nessun timestamp generato da click.

import { useEffect, useMemo, useState, type ReactNode } from "react";
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

type ConduzionePeriodo = { nome: string; badge: string | null; start: number; end: number | null };

type SchedaMezzoExtra = {
  scadenze: NextManutenzioneScadenzaItem[];
  eventi: NextMezzoSegnalazioniControlliTimelineItem[];
  conduzione: ConduzionePeriodo[];
};

const SCADENZA_SEVERITA: Record<NextScadenzaStato, number> = {
  scaduta: 4,
  in_scadenza: 3,
  ok: 2,
  valore_non_disponibile: 1,
  data_mancante: 0,
};

function num(n: number | null | undefined): string {
  return typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("it-IT") : "—";
}

function urgencyTone(urgenza: string | null | undefined): "danger" | "warning" | "idle" {
  const value = (urgenza ?? "").toLowerCase();
  if (value.includes("alt") || value.includes("urgen")) return "danger";
  if (value.includes("med")) return "warning";
  return "idle";
}

function scadenzaBadge(item: NextManutenzioneScadenzaItem): { tone: string; label: string } {
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
  if (giorni === null) return "";
  if (giorni < 0) return `scaduta da ${Math.abs(giorni)} gg`;
  if (giorni === 0) return "scade oggi";
  return `tra ${giorni} gg`;
}

function formatImporto(importo: number | undefined, valuta: string): string | null {
  if (typeof importo !== "number" || !Number.isFinite(importo)) return null;
  const suffix = valuta && valuta !== "UNKNOWN" ? ` ${valuta}` : "";
  return `${importo.toLocaleString("it-IT")}${suffix}`;
}

function buildConduzione(assignments: NextAutistiCanonicalAssignment[]): ConduzionePeriodo[] {
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

function Card({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="card">
      <div className="card__head">
        <h2 className="card__title">{title}</h2>
        {typeof count === "number" ? <span className="card__count">{count}</span> : null}
      </div>
      <div className="card__body">{children}</div>
    </section>
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
        const scadenze = scadenzeSnap.items
          .filter((item) => item.attiva && normalizeScadenzaTarga(item.targa) === targaNorm)
          .sort(
            (left, right) =>
              SCADENZA_SEVERITA[right.stato] - SCADENZA_SEVERITA[left.stato] ||
              (left.giorniMin ?? 99999) - (right.giorniMin ?? 99999),
          );
        const conduzione = buildConduzione(
          findNextAutistiAssignmentsByTarga(autistiSnap, builtView.mezzo?.targa ?? rawTarga ?? ""),
        );

        setView(builtView);
        setExtra({ scadenze, eventi: segnControlli.timelineItems, conduzione });
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

  const back = (
    <button type="button" className="next-scheda__back" onClick={() => navigate(-1)}>
      ← Indietro
    </button>
  );

  if (status !== "ready" || !view || !extra) {
    return (
      <div className="next-scheda">
        <div className="next-scheda__inner">
          {back}
          {status === "loading" ? (
            <div className="next-scheda__state">Carico la scheda del mezzo…</div>
          ) : null}
          {status === "error" ? (
            <div className="next-scheda__state next-scheda__state--error">
              Impossibile leggere i dati del mezzo. Riprova più tardi.
            </div>
          ) : null}
          {status === "notfound" ? (
            <div className="next-scheda__state next-scheda__state--error">
              Nessun mezzo trovato per la targa “{rawTarga}”.
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const m = view.mezzo;
  const cond = extra.conduzione;
  const attuale = cond.length > 0 ? cond[cond.length - 1] : null;
  const precedenti = cond.slice(0, -1).reverse();
  const scadCrit = extra.scadenze.filter(
    (s) => s.stato === "scaduta" || s.stato === "in_scadenza",
  ).length;
  const dossierPath = buildNextPathWithRole(buildNextDossierPath(m?.targa ?? rawTarga ?? ""), role);

  // ---- card (distribuite nelle 3 colonne; quelle senza dati non vengono mostrate) ----
  const colSx: ReactNode[] = [];
  const colCx: ReactNode[] = [];
  const colDx: ReactNode[] = [];

  // Colonna SX
  colSx.push(
    <Card key="identita" title="Identità">
      <div className="kv">
        <div className="kv__key"><span className="kv__name">Proprietario</span></div>
        <div className="kv__val"><span className="kv__strong">{m?.proprietario || "—"}</span></div>
      </div>
      <div className="kv">
        <div className="kv__key"><span className="kv__name">Autista abituale</span></div>
        <div className="kv__val"><span className="kv__strong">{m?.autistaNome || "—"}</span></div>
      </div>
      <div className="kv">
        <div className="kv__key"><span className="kv__name">Scadenza revisione</span></div>
        <div className="kv__val">
          <span className="kv__strong">
            {m?.dataScadenzaRevisione ? toDisplay(m.dataScadenzaRevisione) || m.dataScadenzaRevisione : "—"}
          </span>
        </div>
      </div>
    </Card>,
  );

  if (m?.manutenzioneProgrammata) {
    colSx.push(
      <Card key="manut" title="Manutenzione programmata">
        <div className="kv">
          <div className="kv__key"><span className="kv__name">Contratto / Officina</span></div>
          <div className="kv__val"><span className="kv__strong">{m.manutenzioneContratto || "—"}</span></div>
        </div>
        <div className="kv">
          <div className="kv__key"><span className="kv__name">Periodo</span></div>
          <div className="kv__val">
            <span className="kv__strong">
              {m.manutenzioneDataInizio ? toDisplay(m.manutenzioneDataInizio) || m.manutenzioneDataInizio : "—"} –{" "}
              {m.manutenzioneDataFine ? toDisplay(m.manutenzioneDataFine) || m.manutenzioneDataFine : "—"}
            </span>
          </div>
        </div>
        <div className="kv">
          <div className="kv__key"><span className="kv__name">Km massimi</span></div>
          <div className="kv__val"><span className="kv__strong">{m.manutenzioneKmMax || "—"}</span></div>
        </div>
      </Card>,
    );
  }

  if (rifornimentiSorted.length > 0) {
    colSx.push(
      <Card key="rifornimenti" title="Ultimi rifornimenti" count={view.rifornimenti.length}>
        {rifornimentiSorted.slice(0, 6).map((r) => (
          <div className="kv" key={r.id}>
            <div className="kv__key">
              <span className="kv__name">
                {typeof r.litri === "number" ? `${r.litri} L` : "Rifornimento"}
                {r.tipo ? ` · ${r.tipo}` : ""}
              </span>
              {r.autistaNome ? <span className="kv__sub">{r.autistaNome}</span> : null}
            </div>
            <div className="kv__val">
              <span className="kv__strong">{toDisplay(r.data) || "—"}</span>
              {typeof r.km === "number" ? <span className="kv__meta">{num(r.km)} km</span> : null}
            </div>
          </div>
        ))}
      </Card>,
    );
  }

  if (view.documentiCosti.length > 0) {
    colSx.push(
      <Card key="documenti" title="Documenti e costi" count={view.documentiCosti.length}>
        {view.documentiCosti.slice(0, 6).map((d) => {
          const importo = formatImporto(d.importo, d.valuta);
          return (
            <div className="kv" key={d.id}>
              <div className="kv__key">
                <span className="kv__name">
                  {d.descrizione || (d.tipo === "FATTURA" ? "Fattura" : "Preventivo")}
                </span>
                <span className="kv__sub">
                  {(d.tipo === "FATTURA" ? "Fattura" : "Preventivo") + (d.fornitoreLabel ? ` · ${d.fornitoreLabel}` : "")}
                </span>
              </div>
              <div className="kv__val">
                <span className="kv__strong">{toDisplay(d.data) || "—"}</span>
                {importo ? <span className="kv__meta">{importo}</span> : null}
              </div>
            </div>
          );
        })}
      </Card>,
    );
  }

  // Colonna CENTRO
  colCx.push(
    <Card key="conduzione" title="Conduzione mezzo">
      {attuale ? (
        <>
          <div className="kv current">
            <div className="kv__key">
              <span className="kv__name">{attuale.nome}</span>
              <span className="kv__sub">badge {attuale.badge || "—"}</span>
            </div>
            <div className="kv__val">
              <span className="badge ok">in uso</span>
              <span className="kv__meta">dal {toDisplay(attuale.start) || "—"}</span>
            </div>
          </div>
          {precedenti.map((p, i) => (
            <div className="kv" key={`${p.nome}:${p.start}:${i}`}>
              <div className="kv__key">
                <span className="kv__name">{p.nome}</span>
                <span className="kv__sub">badge {p.badge || "—"}</span>
              </div>
              <div className="kv__val">
                <span className="kv__strong">
                  {toDisplay(p.start) || "—"} – {toDisplay(p.end) || "—"}
                </span>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="empty">
          Nessuna assegnazione conducente tracciata.
          {m?.autistaNome ? ` Autista abituale: ${m.autistaNome}.` : ""}
        </div>
      )}
    </Card>,
  );

  if (view.lavoriDaEseguire.length > 0) {
    colCx.push(
      <Card key="lavoriDaFare" title="Lavori da eseguire" count={view.lavoriDaEseguire.length}>
        {view.lavoriDaEseguire.slice(0, 6).map((l: NextDossierLegacyWorkItem) => {
          const tone = urgencyTone(l.urgenza);
          return (
            <div className="kv" key={l.id}>
              <div className="kv__key">
                <span className="kv__name">{l.descrizione || "Lavoro senza descrizione"}</span>
                {l.segnalatoDa ? <span className="kv__sub">segnalato da {l.segnalatoDa}</span> : null}
              </div>
              <div className="kv__val">
                {l.urgenza ? <span className={`badge ${tone}`}>{l.urgenza}</span> : null}
                <span className="kv__meta">{toDisplay(l.dataInserimento) || "—"}</span>
              </div>
            </div>
          );
        })}
      </Card>,
    );
  }

  if (view.movimentiMateriali.length > 0) {
    colCx.push(
      <Card key="materiali" title="Materiali consegnati" count={view.movimentiMateriali.length}>
        {view.movimentiMateriali.slice(0, 6).map((mov) => (
          <div className="kv" key={mov.id}>
            <div className="kv__key">
              <span className="kv__name">{mov.materialeLabel || mov.descrizione || "Materiale"}</span>
              {mov.fornitoreLabel ? <span className="kv__sub">{mov.fornitoreLabel}</span> : null}
            </div>
            <div className="kv__val">
              <span className="kv__strong">{toDisplay(mov.data) || "—"}</span>
              {typeof mov.quantita === "number" ? (
                <span className="kv__meta">{num(mov.quantita)} {mov.unita || "pz"}</span>
              ) : null}
            </div>
          </div>
        ))}
      </Card>,
    );
  }

  // Colonna DX
  colDx.push(
    <Card key="scadenze" title="Scadenze" count={extra.scadenze.length}>
      {extra.scadenze.length === 0 ? (
        <div className="empty">Nessuna scadenza configurata.</div>
      ) : (
        extra.scadenze.map((s) => {
          const badge = scadenzaBadge(s);
          const prossima = s.componenti.find((c) => c.base === "tempo")?.prossimaData;
          const gcls = badge.tone === "danger" ? "bad" : badge.tone === "warning" ? "warn" : "";
          return (
            <div className="kv" key={s.id}>
              <div className="kv__key">
                <span className="kv__name">{s.label || s.tipo}</span>
                {prossima ? <span className="kv__sub">prossima {toDisplay(prossima)}</span> : null}
              </div>
              <div className="kv__val">
                <span className={`badge ${badge.tone}`}>{badge.label}</span>
                {s.giorniMin !== null ? <span className={`kv__meta ${gcls}`}>{giorniLabel(s.giorniMin)}</span> : null}
              </div>
            </div>
          );
        })
      )}
    </Card>,
  );

  if (view.lavoriEseguiti.length > 0) {
    colDx.push(
      <Card key="lavoriEseguiti" title="Lavori eseguiti" count={view.lavoriEseguiti.length}>
        {view.lavoriEseguiti.slice(0, 6).map((l: NextDossierLegacyWorkItem) => (
          <div className="kv" key={l.id}>
            <div className="kv__key">
              <span className="kv__name">{(l.descrizione || "Lavoro").replace(/\n+/g, " ")}</span>
              {l.chiHaEseguito ? <span className="kv__sub">eseguito da {l.chiHaEseguito}</span> : null}
            </div>
            <div className="kv__val">
              <span className="kv__strong">{toDisplay(l.dataEsecuzione ?? l.dataInserimento) || "—"}</span>
            </div>
          </div>
        ))}
      </Card>,
    );
  }

  if (view.gommePerAsse.length > 0) {
    colDx.push(
      <Card key="gomme" title="Gomme per asse" count={view.gommePerAsse.length}>
        {view.gommePerAsse.map((asse) => (
          <div className="kv" key={asse.asseId}>
            <div className="kv__key"><span className="kv__name">{asse.asseLabel}</span></div>
            <div className="kv__val">
              <span className="kv__strong">{asse.dataCambio ? toDisplay(asse.dataCambio) : "—"}</span>
              {asse.kmPercorsi !== null ? <span className="kv__meta">{num(asse.kmPercorsi)} km</span> : null}
            </div>
          </div>
        ))}
      </Card>,
    );
  }

  if (extra.eventi.length > 0) {
    colDx.push(
      <Card key="eventi" title="Segnalazioni e controlli" count={extra.eventi.length}>
        {extra.eventi.slice(0, 8).map((e) => (
          <div className="kv" key={e.id}>
            <div className="kv__key">
              <span className="kv__name">{e.title}</span>
              {e.subtitle ? <span className="kv__sub">{e.subtitle}</span> : null}
            </div>
            <div className="kv__val">
              <span className="kv__strong">{toDisplay(e.timestamp ?? e.data) || "—"}</span>
              <span className="kv__meta">{e.source === "controllo" ? "Controllo" : "Segnalazione"}</span>
            </div>
          </div>
        ))}
      </Card>,
    );
  }

  return (
    <div className="next-scheda">
      <div className="next-scheda__inner">
        {back}

        <div className="hero">
          <img className="hero__logo" src="/logo.png" alt="Gestione e Manutenzione" />
          <div className="hero__main">
            <div className="hero__eyebrow">Scheda mezzo</div>
            <h1 className="hero__title plate">{m?.targa ?? rawTarga}</h1>
            <div className="hero__chips">
              {m?.categoria ? <span className="chip">{m.categoria}</span> : null}
              {m?.marcaModello ? <span className="chip">{m.marcaModello}</span> : null}
              {m?.anno ? <span className="chip">anno {m.anno}</span> : null}
              {m?.manutenzioneProgrammata ? (
                <span className="chip accent">Manutenzione programmata</span>
              ) : null}
            </div>
          </div>
          <a className="hero__cta" href={dossierPath}>Apri dossier completo</a>
        </div>

        <div className="kpis">
          <div className="kpi k-info"><div className="kpi__num">{num(kmAttuali)}</div><div className="kpi__lbl">Km attuali</div></div>
          <div className="kpi k-neutral"><div className="kpi__num">{cond.length}</div><div className="kpi__lbl">Conduttori</div></div>
          <div className={`kpi ${scadCrit ? "k-bad" : "k-ok"}`}><div className="kpi__num">{scadCrit}</div><div className="kpi__lbl">Scadenze critiche</div></div>
          <div className="kpi k-info"><div className="kpi__num">{extra.eventi.length}</div><div className="kpi__lbl">Segnal./controlli</div></div>
          <div className="kpi k-neutral"><div className="kpi__num">{view.rifornimenti.length}</div><div className="kpi__lbl">Rifornimenti</div></div>
        </div>

        <div className="cols">
          <div className="col">{colSx}</div>
          <div className="col">{colCx}</div>
          <div className="col">{colDx}</div>
        </div>
      </div>
    </div>
  );
}

export default NextSchedaMezzoPage;
