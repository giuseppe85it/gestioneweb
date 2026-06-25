// Scheda autista NEXT — punto unico che aggrega tutto ciò che un autista invia:
// segnalazioni, controlli mezzo, richieste attrezzature e rifornimenti, più la
// sessione/assegnazione corrente e l'anagrafica del collega.
// Sola lettura: tutti i reader sono clone-safe, nessuna scrittura.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  readNextColleghiSnapshot,
  type NextCollegaReadOnlyItem,
} from "../domain/nextColleghiDomain";
import {
  readNextAutistiReadOnlySnapshot,
  type NextAutistiCanonicalAssignment,
} from "../domain/nextAutistiDomain";
import { readNextUnifiedStorageDocument } from "../domain/nextUnifiedReadRegistryDomain";
import {
  buildNextDossierPath,
} from "../nextStructuralPaths";
import { buildNextPathWithRole, getNextRoleFromSearch } from "../nextAccess";
import { toDisplay } from "../helpers/dateUnica";
import "./next-scheda.css";

const RIFORNIMENTI_AUTISTI_KEY = "@rifornimenti_autisti_tmp";
const STORICO_EVENTI_KEY = "@storico_eventi_operativi";
const GOMME_TMP_KEY = "@cambi_gomme_autisti_tmp";
const GOMME_EVENTI_KEY = "@gomme_eventi";

type LoadStatus = "loading" | "ready" | "notfound" | "error";
type EventMatch = "EXACT" | "WEAK";
type EventKind =
  | "segnalazione"
  | "controllo"
  | "richiesta"
  | "rifornimento"
  | "evento"
  | "gomme";
type Tone = "ok" | "warning" | "danger" | "info" | "idle";

type SchedaEvent = {
  id: string;
  kind: EventKind;
  kindLabel: string;
  ts: number;
  rawDate: string | number | null;
  title: string;
  detail: string | null;
  targa: string | null;
  match: EventMatch;
  tone: Tone;
  toneLabel: string | null;
};

type SchedaAutistaData = {
  nome: string;
  badge: string | null;
  codice: string | null;
  telefono: string | null;
  schedeCarburante: number;
  operationalStatus: { label: string; note: string };
  assignment: NextAutistiCanonicalAssignment | null;
  events: SchedaEvent[];
};

function normalizeBadgeKey(value: unknown): string {
  return (value ?? "").toString().trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeNameKey(value: unknown): string {
  return (value ?? "").toString().trim().toLowerCase().replace(/\s+/g, " ");
}

function toTs(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 1_000_000_000_000) return value;
    if (value > 1_000_000_000) return value * 1000;
    return value;
  }
  const raw = (value ?? "").toString().trim();
  if (!raw) return 0;
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    if (numeric > 1_000_000_000_000) return numeric;
    if (numeric > 1_000_000_000) return numeric * 1000;
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function pickString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function plate(value: unknown): string | null {
  const raw = (value ?? "").toString().trim().toUpperCase();
  return raw || null;
}

function nestedPlate(
  record: Record<string, unknown>,
  parent: string,
  child: string,
): string | null {
  const obj = record[parent];
  if (obj && typeof obj === "object") {
    return plate((obj as Record<string, unknown>)[child]);
  }
  return null;
}

function actorBadge(record: Record<string, unknown>): unknown {
  return record.badgeAutista ?? record.badge ?? record.autistaBadge ?? record.badge_autista ?? null;
}

function actorName(record: Record<string, unknown>): unknown {
  if (typeof record.autista === "string") return record.autista;
  return record.autistaNome ?? record.nomeAutista ?? record.nome ?? null;
}

// Etichetta dell'azione di un evento operativo (cambio assetto / aggancio / sgancio / accesso).
function eventoActionLabel(
  tipoRaw: string,
  motrice: { before: string | null; after: string | null },
  rimorchio: { before: string | null; after: string | null },
): { title: string; tag: string } {
  const tipoUpper = tipoRaw.toUpperCase();
  if (tipoUpper.includes("LOGIN") || tipoUpper.includes("ACCESSO")) {
    return { title: "Accesso", tag: "accesso" };
  }
  if (tipoUpper.includes("LOGOUT") || tipoUpper.includes("USCITA")) {
    return { title: "Uscita", tag: "uscita" };
  }
  const motriceChanged = motrice.before && motrice.after && motrice.before !== motrice.after;
  const rimorchioChanged =
    rimorchio.before && rimorchio.after && rimorchio.before !== rimorchio.after;
  if (motriceChanged && rimorchioChanged) return { title: "Cambio assetto", tag: "cambio" };
  if (motriceChanged) return { title: "Cambio motrice", tag: "cambio" };
  if (rimorchioChanged) return { title: "Cambio rimorchio", tag: "cambio" };
  if (!motrice.before && motrice.after) return { title: "Aggancio motrice", tag: "aggancio" };
  if (motrice.before && !motrice.after) return { title: "Sgancio motrice", tag: "sgancio" };
  if (!rimorchio.before && rimorchio.after) return { title: "Aggancio rimorchio", tag: "aggancio" };
  if (rimorchio.before && !rimorchio.after) return { title: "Sgancio rimorchio", tag: "sgancio" };
  const tipoLabel = tipoRaw.trim();
  return { title: tipoLabel ? `Evento: ${tipoLabel}` : "Evento operativo", tag: "evento" };
}

const TABS: Array<{ id: "tutti" | EventKind; label: string }> = [
  { id: "tutti", label: "Tutti" },
  { id: "evento", label: "Cambi mezzo / log" },
  { id: "segnalazione", label: "Segnalazioni" },
  { id: "controllo", label: "Controlli" },
  { id: "richiesta", label: "Richieste" },
  { id: "rifornimento", label: "Rifornimenti" },
  { id: "gomme", label: "Gomme" },
];

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

function NextSchedaAutistaPage() {
  const { badge: rawParam } = useParams<{ badge: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState<SchedaAutistaData | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [activeTab, setActiveTab] = useState<"tutti" | EventKind>("tutti");

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    setData(null);
    setActiveTab("tutti");

    (async () => {
      try {
        const [colleghi, snapshot, rifornimentiDoc, storicoDoc, gommeTmpDoc, gommeEventiDoc] =
          await Promise.all([
            readNextColleghiSnapshot(),
            readNextAutistiReadOnlySnapshot(),
            readNextUnifiedStorageDocument({ key: RIFORNIMENTI_AUTISTI_KEY }),
            readNextUnifiedStorageDocument({ key: STORICO_EVENTI_KEY }),
            readNextUnifiedStorageDocument({ key: GOMME_TMP_KEY }),
            readNextUnifiedStorageDocument({ key: GOMME_EVENTI_KEY }),
          ]);
        if (!alive) return;

        const paramRaw = (rawParam ?? "").trim();
        const paramBadgeKey = normalizeBadgeKey(paramRaw);

        const collega: NextCollegaReadOnlyItem | undefined =
          colleghi.items.find(
            (item) =>
              normalizeBadgeKey(item.badge).length > 0 &&
              normalizeBadgeKey(item.badge) === paramBadgeKey,
          ) ?? colleghi.items.find((item) => item.id === paramRaw);

        if (!collega && !paramBadgeKey) {
          setStatus("notfound");
          return;
        }

        const targetBadgeKey = collega ? normalizeBadgeKey(collega.badge) : paramBadgeKey;
        const primaryNameKey = collega ? normalizeNameKey(collega.nome) : "";

        const resolveMatch = (
          recordBadge: unknown,
          recordName: unknown,
        ): EventMatch | null => {
          const badgeKey = normalizeBadgeKey(recordBadge);
          if (badgeKey && targetBadgeKey && badgeKey === targetBadgeKey) return "EXACT";
          if (badgeKey) return null; // badge diverso → non è questo autista
          const nameKey = normalizeNameKey(recordName);
          if (!nameKey || !primaryNameKey) return null;
          return nameKey === primaryNameKey ? "WEAK" : null;
        };

        const events: SchedaEvent[] = [];

        for (const row of snapshot.segnalazioniRows) {
          const match = resolveMatch(row.badgeAutista, row.autistaNome);
          if (!match) continue;
          events.push({
            id: `seg:${row.id}`,
            kind: "segnalazione",
            kindLabel: "Segnalazione",
            ts: row.timestamp ?? 0,
            rawDate: row.timestamp ?? null,
            title: row.tipo || "Segnalazione",
            detail: row.descrizione || null,
            targa: row.targa ?? row.targaCamion ?? row.targaRimorchio ?? null,
            match,
            tone: row.chiusa ? "idle" : "warning",
            toneLabel: row.chiusa ? "chiusa" : row.stato || "aperta",
          });
        }

        for (const row of snapshot.controlliRows) {
          const match = resolveMatch(row.badgeAutista, row.autistaNome);
          if (!match) continue;
          events.push({
            id: `ctrl:${row.id}`,
            kind: "controllo",
            kindLabel: "Controllo",
            ts: row.timestamp ?? 0,
            rawDate: row.timestamp ?? null,
            title: row.isKo ? "Controllo mezzo: anomalie" : "Controllo mezzo: ok",
            detail: row.koList.length > 0 ? row.koList.join(", ") : row.note || null,
            targa: row.targaMotrice ?? row.targaRimorchio ?? null,
            match,
            tone: row.isKo ? "danger" : "ok",
            toneLabel: row.isKo ? "KO" : "OK",
          });
        }

        for (const row of snapshot.richiesteRows) {
          const match = resolveMatch(row.badgeAutista, row.autistaNome);
          if (!match) continue;
          events.push({
            id: `req:${row.id}`,
            kind: "richiesta",
            kindLabel: "Richiesta",
            ts: row.timestamp ?? 0,
            rawDate: row.timestamp ?? null,
            title: "Richiesta attrezzatura",
            detail: row.testo || null,
            targa: row.targa ?? null,
            match,
            tone: row.evasa ? "ok" : "warning",
            toneLabel: row.evasa ? "evasa" : row.stato || "aperta",
          });
        }

        for (let index = 0; index < rifornimentiDoc.records.length; index += 1) {
          const record = rifornimentiDoc.records[index];
          const match = resolveMatch(record.badgeAutista, record.autistaNome);
          if (!match) continue;
          const litriRaw = record.litri;
          const litri = typeof litriRaw === "number" && Number.isFinite(litriRaw) ? litriRaw : null;
          const kmRaw = record.km;
          const km = typeof kmRaw === "number" && Number.isFinite(kmRaw) ? kmRaw : null;
          const rawDate =
            (typeof record.timestamp === "number" ? record.timestamp : null) ??
            (typeof record.data === "string" || typeof record.data === "number"
              ? (record.data as string | number)
              : null);
          const tipo = pickString(record, ["tipo"]);
          events.push({
            id: `rif:${pickString(record, ["id"]) ?? index}`,
            kind: "rifornimento",
            kindLabel: "Rifornimento",
            ts: toTs(record.timestamp ?? record.data),
            rawDate,
            title: litri !== null ? `${litri} L${tipo ? ` · ${tipo}` : ""}` : "Rifornimento",
            detail: km !== null ? `${km.toLocaleString("it-IT")} km` : null,
            targa: pickString(record, ["targaCamion", "targaMotrice", "targa"]),
            match,
            tone: "info",
            toneLabel: null,
          });
        }

        for (let index = 0; index < storicoDoc.records.length; index += 1) {
          const record = storicoDoc.records[index];
          const match = resolveMatch(actorBadge(record), actorName(record));
          if (!match) continue;
          const motrice = {
            before: nestedPlate(record, "prima", "targaMotrice"),
            after: nestedPlate(record, "dopo", "targaMotrice"),
          };
          const rimorchio = {
            before: nestedPlate(record, "prima", "targaRimorchio"),
            after: nestedPlate(record, "dopo", "targaRimorchio"),
          };
          const tipoRaw =
            pickString(record, ["tipo", "tipoOperativo", "azione", "evento", "operation"]) ?? "";
          const { title, tag } = eventoActionLabel(tipoRaw, motrice, rimorchio);
          const targa =
            plate(pickString(record, ["targaMotrice", "targaCamion", "targa"])) ??
            motrice.after ??
            motrice.before;
          const luogo = pickString(record, ["luogo", "cantiere", "destinazione", "zona"]);
          const cambioParts: string[] = [];
          if (motrice.before || motrice.after) {
            cambioParts.push(`Motrice: ${motrice.before ?? "—"} → ${motrice.after ?? "—"}`);
          }
          if (rimorchio.before || rimorchio.after) {
            cambioParts.push(`Rimorchio: ${rimorchio.before ?? "—"} → ${rimorchio.after ?? "—"}`);
          }
          if (luogo) cambioParts.push(`Luogo: ${luogo}`);
          events.push({
            id: `evt:${pickString(record, ["id", "uid", "key"]) ?? index}`,
            kind: "evento",
            kindLabel: "Evento",
            ts: toTs(record.timestamp ?? record.data ?? record.ts),
            rawDate:
              (typeof record.timestamp === "number" ? record.timestamp : null) ??
              (typeof record.data === "string" || typeof record.data === "number"
                ? (record.data as string | number)
                : null),
            title,
            detail: cambioParts.length > 0 ? cambioParts.join(" · ") : null,
            targa,
            match,
            tone: "idle",
            toneLabel: tag,
          });
        }

        const addGommeEvents = (
          records: Record<string, unknown>[],
          sourceTag: string,
        ) => {
          for (let index = 0; index < records.length; index += 1) {
            const record = records[index];
            const match = resolveMatch(actorBadge(record), actorName(record));
            if (!match) continue;
            const tipo = pickString(record, ["tipo", "azione", "stato", "esito"]);
            const note = pickString(record, ["note", "dettaglio", "messaggio", "descrizione"]);
            events.push({
              id: `gom:${sourceTag}:${pickString(record, ["id", "uid", "key"]) ?? index}`,
              kind: "gomme",
              kindLabel: "Gomme",
              ts: toTs(record.timestamp ?? record.data ?? record.ts),
              rawDate:
                (typeof record.timestamp === "number" ? record.timestamp : null) ??
                (typeof record.data === "string" || typeof record.data === "number"
                  ? (record.data as string | number)
                  : null),
              title: tipo ? `Gomme: ${tipo}` : "Evento gomme",
              detail: note,
              targa: plate(pickString(record, ["targaMotrice", "targaCamion", "targa"])),
              match,
              tone: "info",
              toneLabel: null,
            });
          }
        };
        addGommeEvents(gommeTmpDoc.records, "tmp");
        addGommeEvents(gommeEventiDoc.records, "evt");

        events.sort((left, right) => right.ts - left.ts);

        const assignmentMatch = snapshot.assignments
          .filter((entry) => Boolean(resolveMatch(entry.badgeAutista, entry.autistaNome)))
          .sort((left, right) => (right.timestamp ?? 0) - (left.timestamp ?? 0));

        setData({
          nome: collega?.nome || paramRaw,
          badge: collega?.badge ?? (paramBadgeKey ? paramRaw : null),
          codice: collega?.codice ?? null,
          telefono: collega?.telefono ?? null,
          schedeCarburante: collega?.schedeCarburante.length ?? 0,
          operationalStatus: {
            label: snapshot.operationalStatus.label,
            note: snapshot.operationalStatus.note,
          },
          assignment: assignmentMatch[0] ?? null,
          events,
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
  }, [rawParam]);

  const role = getNextRoleFromSearch(location.search);

  const counts = useMemo(() => {
    const base = {
      tutti: 0,
      segnalazione: 0,
      controllo: 0,
      richiesta: 0,
      rifornimento: 0,
      evento: 0,
      gomme: 0,
    };
    if (!data) return base;
    base.tutti = data.events.length;
    for (const event of data.events) base[event.kind] += 1;
    return base;
  }, [data]);

  const visibleEvents = useMemo(() => {
    if (!data) return [];
    if (activeTab === "tutti") return data.events;
    return data.events.filter((event) => event.kind === activeTab);
  }, [data, activeTab]);

  const goToMezzo = (targa: string) => {
    navigate(buildNextPathWithRole(buildNextDossierPath(targa), role));
  };

  return (
    <div className="next-scheda">
      <div className="next-scheda__inner">
        <button type="button" className="next-scheda__back" onClick={() => navigate(-1)}>
          ← Indietro
        </button>

        {status === "loading" ? (
          <div className="next-scheda__state">Carico la scheda dell'autista…</div>
        ) : null}
        {status === "error" ? (
          <div className="next-scheda__state next-scheda__state--error">
            Impossibile leggere i dati dell'autista. Riprova più tardi.
          </div>
        ) : null}
        {status === "notfound" ? (
          <div className="next-scheda__state next-scheda__state--error">
            Nessun autista trovato per “{rawParam}”.
          </div>
        ) : null}

        {status === "ready" && data ? (
          <>
            <div className="hero">
              <img className="hero__logo" src="/logo.png" alt="Gestione e Manutenzione" />
              <div className="hero__main">
                <div className="hero__eyebrow">Scheda autista</div>
                <h1 className="hero__title">{data.nome}</h1>
                <div className="hero__chips">
                  {data.badge ? <span className="chip">badge {data.badge}</span> : null}
                  {data.codice ? <span className="chip">cod. {data.codice}</span> : null}
                  {data.operationalStatus.label ? (
                    <span className="chip accent">{data.operationalStatus.label}</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="kpis">
              <div className="kpi k-warn"><div className="kpi__num">{counts.segnalazione}</div><div className="kpi__lbl">Segnalazioni</div></div>
              <div className="kpi k-info"><div className="kpi__num">{counts.controllo}</div><div className="kpi__lbl">Controlli</div></div>
              <div className="kpi k-neutral"><div className="kpi__num">{counts.richiesta}</div><div className="kpi__lbl">Richieste</div></div>
              <div className="kpi k-ok"><div className="kpi__num">{counts.tutti}</div><div className="kpi__lbl">Attività totali</div></div>
            </div>

            <div className="grid">
              <Card title="Anagrafica">
                <div className="kv"><div className="kv__key"><span className="kv__name">Telefono</span></div><div className="kv__val"><span className="kv__strong">{data.telefono || "—"}</span></div></div>
                <div className="kv"><div className="kv__key"><span className="kv__name">Codice</span></div><div className="kv__val"><span className="kv__strong">{data.codice || "—"}</span></div></div>
                <div className="kv"><div className="kv__key"><span className="kv__name">Schede carburante</span></div><div className="kv__val"><span className="kv__strong">{data.schedeCarburante}</span></div></div>
              </Card>

              <Card title="Assegnazione attuale">
                {data.assignment ? (
                  <div className="kv current">
                    <div className="kv__key">
                      {data.assignment.targaMotrice ? (
                        <button type="button" className="plate kv__name" onClick={() => goToMezzo(data.assignment!.targaMotrice as string)}>
                          {data.assignment.targaMotrice}
                        </button>
                      ) : (
                        <span className="kv__name">Motrice non indicata</span>
                      )}
                      {data.assignment.targaRimorchio ? (
                        <button type="button" className="plate kv__sub" onClick={() => goToMezzo(data.assignment!.targaRimorchio as string)}>
                          + {data.assignment.targaRimorchio}
                        </button>
                      ) : null}
                    </div>
                    <div className="kv__val">
                      <span className="badge ok">in uso</span>
                      <span className="kv__meta">dal {toDisplay(data.assignment.timestamp) || "—"}</span>
                    </div>
                  </div>
                ) : (
                  <div className="empty">Nessuna assegnazione mezzo certificata.</div>
                )}
              </Card>

              <Card title="Riepilogo attività">
                <div className="kv"><div className="kv__key"><span className="kv__name">Segnalazioni</span></div><div className="kv__val"><span className="kv__strong">{counts.segnalazione}</span></div></div>
                <div className="kv"><div className="kv__key"><span className="kv__name">Controlli mezzo</span></div><div className="kv__val"><span className="kv__strong">{counts.controllo}</span></div></div>
                <div className="kv"><div className="kv__key"><span className="kv__name">Richieste attrezzatura</span></div><div className="kv__val"><span className="kv__strong">{counts.richiesta}</span></div></div>
                {counts.evento > 0 ? (<div className="kv"><div className="kv__key"><span className="kv__name">Cambi mezzo / log</span></div><div className="kv__val"><span className="kv__strong">{counts.evento}</span></div></div>) : null}
                {counts.rifornimento > 0 ? (<div className="kv"><div className="kv__key"><span className="kv__name">Rifornimenti</span></div><div className="kv__val"><span className="kv__strong">{counts.rifornimento}</span></div></div>) : null}
                {counts.gomme > 0 ? (<div className="kv"><div className="kv__key"><span className="kv__name">Gomme</span></div><div className="kv__val"><span className="kv__strong">{counts.gomme}</span></div></div>) : null}
              </Card>
            </div>

            <div style={{ marginTop: 16 }}>
              <Card title="Attività recenti" count={visibleEvents.length}>
                <div className="tabs">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={activeTab === tab.id ? "tab active" : "tab"}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                      <span className="tab__count">{counts[tab.id]}</span>
                    </button>
                  ))}
                </div>
                {visibleEvents.length === 0 ? (
                  <div className="empty">Nessuna attività registrata.</div>
                ) : (
                  <>
                    {visibleEvents.slice(0, 30).map((event) => (
                      <div className="act-row" key={event.id}>
                        <span className={`act-kind ${event.kind}`}>{event.kindLabel}</span>
                        <span className="act-desc">
                          <strong>{event.title}</strong>
                          {event.detail ? <> — <span>{event.detail}</span></> : null}
                        </span>
                        <span className="act-meta">
                          {event.targa ? (
                            <>
                              <button type="button" className="plate" onClick={() => goToMezzo(event.targa as string)}>
                                {event.targa}
                              </button>
                              {" · "}
                            </>
                          ) : null}
                          {toDisplay(event.rawDate) || "—"}
                        </span>
                      </div>
                    ))}
                    {visibleEvents.length > 30 ? (
                      <div className="empty">+{visibleEvents.length - 30} altre attività</div>
                    ) : null}
                  </>
                )}
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default NextSchedaAutistaPage;
