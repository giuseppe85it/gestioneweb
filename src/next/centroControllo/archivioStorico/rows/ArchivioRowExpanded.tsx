// Archivio Storico NEXT — Step 4 (PROMPT 29.9) — ArchivioRowExpanded.
// Card espansa polimorfica per kind (SPEC §8). Renderizza sezioni
// `.rx-section` con k:v + descrizione lunga + griglie k:v.
// Solo campi presenti nei type proiezione: niente invenzioni.

import { useCallback, useEffect, useState, type ReactElement } from "react";

import type { ArchivioRecord } from "../archivioTypes";
import { FraseStoriaRecord } from "../../../components/FraseStoriaRecord";
import { recordChiusoFromRaw, type RecordChiuso } from "../../../helpers/frasestoriaRecord";
import { toDisplay, toDisplayDateTime } from "../../../helpers/dateUnica";
// PROMPT 47 T1/T2: detection legame orfano + UI aggancia/cambia/sgancia
import { isLegameOrfano, readLegameLavoro } from "../../../helpers/cicloLegame";
// PROMPT 49/20: cross-read sorgente segnalazione/controllo per frase storia manutenzione
import { useSorgentiManutenzione } from "../../../helpers/useSorgenteManutenzione";
import {
  getManutenzioniPerAggancio,
  type ManutenzioneCandidataAggancio,
} from "../../../helpers/manutenzioniPerAggancio";
import {
  NextAgganciaLegameModal,
  type AgganciaLegameMode,
} from "../../../components/NextAgganciaLegameModal";
import { agganciaSegnalazioneAManutenzioneEsistente } from "../../../writers/agganciaSegnalazioneAManutenzioneEsistenteWriter";
import { sganciaLegameManutenzione } from "../../../writers/sganciaLegameOrfanoWriter";
import { getItemSync } from "../../../../utils/storageSync";
import "../styles/archivioStorico.css";

type Props = {
  record: ArchivioRecord;
};

function formatDateTimeLong(ts: number | null | undefined): string {
  if (ts === null || ts === undefined || !Number.isFinite(ts) || ts === 0) {
    return "—";
  }
  return toDisplayDateTime(ts) || "—";
}

function formatImportoExt(
  importo: number | null | undefined,
  valuta: string | null | undefined,
): string {
  if (importo === null || importo === undefined) return "—";
  const ccy: string = String(valuta ?? "").trim().toUpperCase() || "CHF";
  const value: string = importo.toLocaleString("it-CH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${ccy} ${value}`;
}

function readText(record: RawRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function sourceAuthor(record: RawRecord): string {
  return readText(record, ["segnalatoDa", "autistaNome", "nomeAutista", "badgeAutista", "badge"]) ?? "Autista non indicato";
}

function sourceDateLabel(record: RawRecord): string {
  const raw = readText(record, ["dataInserimento", "createdAt", "timestamp", "data", "dataProgrammata"]);
  return toDisplay(raw) || raw || "data non disponibile";
}

function asseLabel(asseId: string): string {
  const normalized: string = asseId.trim().toLowerCase();
  if (normalized === "anteriore") return "anteriore";
  if (normalized === "posteriore") return "posteriore";
  const m: RegExpMatchArray | null = normalized.match(/^asse(\d+)$/);
  if (m) return `asse ${m[1]}`;
  return asseId;
}

function ManutenzioneExpanded({
  data,
}: {
  data: Extract<ArchivioRecord, { kind: "manutenzione" }>["data"];
}): ReactElement {
  const materiali = data.materiali ?? [];
  const hasMateriali: boolean = materiali.length > 0;
  const hasImporto: boolean = data.importo !== null && data.importo !== undefined;
  const hasDocumento: boolean = Boolean(data.sourceDocumentFileUrl);
  const hasKm: boolean = data.km !== null && data.km !== undefined;
  const hasOre: boolean = data.ore !== null && data.ore !== undefined;
  const hasSottotipo: boolean = Boolean(data.sottotipo);
  const assi: string[] = data.assiCoinvolti ?? [];
  const gommePerAsse = data.gommePerAsse ?? [];
  const gommeStraordinario = data.gommeStraordinario ?? null;
  const gommeInterventoTipo = data.gommeInterventoTipo ?? null;
  const hasGomme: boolean =
    assi.length > 0 ||
    gommePerAsse.length > 0 ||
    gommeStraordinario !== null ||
    gommeInterventoTipo !== null;

  // PROMPT 49: se la manutenzione ha back-link `origineRefId`, carica il record
  // sorgente (segnalazione/controllo) per la frase storia. Senza sorgente la
  // frase pesca data/autore dalla manutenzione stessa (comportamento pre-49).
  const sourceRecords = useSorgentiManutenzione(data as unknown as Record<string, unknown>);

  return (
    <>
      {data.descrizione ? (
        <div className="rx-section">
          <div className="rx-label">Descrizione</div>
          <div className="rx-value">
            {data.descrizione}
            <FraseStoriaRecord
              {...recordChiusoFromRaw(
                data as unknown as Record<string, unknown>,
                undefined,
                { sourceRecords },
              )}
              compact
            />
          </div>
        </div>
      ) : null}
      {sourceRecords.length > 0 ? (
        <div className="rx-section">
          <div className="rx-label">Origini collegate</div>
          <div className="rx-value">
            {(() => {
              const byAuthor = new Map<string, RawRecord[]>();
              sourceRecords.forEach((source) => {
                const author = sourceAuthor(source);
                byAuthor.set(author, [...(byAuthor.get(author) ?? []), source]);
              });
              return Array.from(byAuthor.entries()).map(([author, records]) => {
                const sorted = [...records].sort((a, b) => sourceDateLabel(b).localeCompare(sourceDateLabel(a)));
                const latest = sorted[0];
                const others = sorted.slice(1);
                return (
                  <div key={author} style={{ marginBottom: 6 }}>
                    Segnalato da <strong>{author}</strong> in data {sourceDateLabel(latest)}
                    {others.length > 0 ? (
                      <details style={{ marginTop: 4 }}>
                        <summary>Altre date</summary>
                        <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                          {others.map((entry) => (
                            <li key={readText(entry, ["id"]) ?? sourceDateLabel(entry)}>
                              {sourceDateLabel(entry)}
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ) : null}
      {(hasImporto || hasKm || hasOre || hasSottotipo) ? (
        <div className="rx-section">
          <div className="rx-label">Dettagli</div>
          <div className="rx-value">
            <div className="rx-grid">
              {hasImporto ? (
                <div className="kv">
                  <span className="k">Importo</span>
                  <span className="v mono">
                    {formatImportoExt(data.importo, data.sourceDocumentCurrency)}
                  </span>
                </div>
              ) : null}
              {hasKm ? (
                <div className="kv">
                  <span className="k">Km</span>
                  <span className="v mono">
                    {data.km !== null && data.km !== undefined
                      ? data.km.toLocaleString("it-CH")
                      : "—"}
                  </span>
                </div>
              ) : null}
              {hasOre ? (
                <div className="kv">
                  <span className="k">Ore</span>
                  <span className="v mono">{data.ore ?? "—"}</span>
                </div>
              ) : null}
              {hasSottotipo ? (
                <div className="kv">
                  <span className="k">Sottotipo</span>
                  <span className="v">{data.sottotipo}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {hasMateriali ? (
        <div className="rx-section">
          <div className="rx-label">Materiali ({materiali.length})</div>
          <div className="rx-value">
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {materiali.map((m) => (
                <li key={m.id}>
                  <strong>{m.label}</strong>
                  {" — "}
                  <span className="mono">
                    {m.quantita} {m.unita}
                  </span>
                  {m.fromInventario ? (
                    <span style={{ color: "var(--ink-3)" }}> · dall&apos;inventario</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
      {hasGomme ? (
        <div className="rx-section">
          <div className="rx-label">Gomme</div>
          <div className="rx-value">
            {gommeInterventoTipo ? (
              <div>
                Intervento: <strong>{gommeInterventoTipo}</strong>
              </div>
            ) : null}
            {assi.length > 0 ? (
              <div>Assi coinvolti: {assi.map(asseLabel).join(", ")}</div>
            ) : null}
            {gommeStraordinario ? (
              <div>
                Straordinario
                {gommeStraordinario.asseId
                  ? ` su asse ${asseLabel(gommeStraordinario.asseId)}`
                  : ""}
                {gommeStraordinario.motivo
                  ? ` — ${gommeStraordinario.motivo}`
                  : ""}
              </div>
            ) : null}
            {gommePerAsse.length > 0 ? (
              <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                {gommePerAsse.map((g, idx: number) => (
                  <li key={`${g.asseId}-${idx}`}>
                    {asseLabel(g.asseId)}
                    {g.dataCambio ? ` · cambio ${toDisplay(g.dataCambio) || g.dataCambio}` : ""}
                    {g.kmCambio !== null && g.kmCambio !== undefined
                      ? ` · ${g.kmCambio.toLocaleString("it-CH")} km`
                      : ""}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
      {hasDocumento ? (
        <div className="rx-section">
          <div className="rx-label">Documento</div>
          <div className="rx-value">
            <a
              className="rx-link"
              href={data.sourceDocumentFileUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              Apri documento sorgente
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}

function segnalazioneToRecordChiuso(
  data: Extract<ArchivioRecord, { kind: "segnalazione" }>["data"],
): RecordChiuso {
  const eventoAutisti: boolean = data.chiusuraDi === "gomme_evento";
  return {
    tipo: "segnalazione",
    dataApertura: data.timestamp ?? null,
    dataEsecuzione: data.dataChiusura ?? null,
    modalitaChiusura: eventoAutisti ? "evento_autisti" : "manuale",
    dataEventoChiusura: eventoAutisti ? data.dataChiusura ?? null : undefined,
    // PROMPT 45 T2: nome autista che ha aperto la segnalazione, mostrato nella prima
    // riga della frase storia come "Segnalazione di <nome> del ...". Sentinel "autista"
    // (fallback writer PROMPT 41) viene filtrato da buildFraseStoria.
    segnalatoDa: data.autistaNome ?? undefined,
  };
}

type LegameStato = "loading" | "no-legame" | "legame-valido" | "legame-orfano";

type RawRecord = Record<string, unknown>;

function unwrapManutenzioniSnapshot(raw: unknown): RawRecord[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((r): r is RawRecord => typeof r === "object" && r !== null);
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as { value?: unknown; items?: unknown };
    if (Array.isArray(obj.value)) {
      return (obj.value as unknown[]).filter(
        (r): r is RawRecord => typeof r === "object" && r !== null,
      );
    }
    if (Array.isArray(obj.items)) {
      return (obj.items as unknown[]).filter(
        (r): r is RawRecord => typeof r === "object" && r !== null,
      );
    }
  }
  return [];
}

/**
 * PROMPT 47 T1/T2 — sub-component per la riga espansa segnalazione, con UI Aggancia/Cambia/Sgancia.
 * Carica lo snapshot @manutenzioni on mount per rilevare legami orfani e popolare i candidati.
 */
function SegnalazioneExpanded({
  data,
}: {
  data: Extract<ArchivioRecord, { kind: "segnalazione" }>["data"];
}): ReactElement {
  const showChiusura: boolean = data.chiusa === true;
  const linkedIds = readLegameLavoro(data as unknown as RawRecord);
  const showLinkManutenzione: boolean = linkedIds.length > 0;
  const showFotoNote: boolean = data.fotoCount > 0;

  // PROMPT 47 — detection legame
  const [legameStato, setLegameStato] = useState<LegameStato>("loading");
  const [snapshotVer, setSnapshotVer] = useState(0); // bumped per ricaricare dopo writer

  const [modalState, setModalState] = useState<
    | null
    | {
        mode: AgganciaLegameMode;
        candidati: ManutenzioneCandidataAggancio[];
        busy: boolean;
      }
  >(null);

  const targa = String(
    (data as RawRecord).targa ??
      (data as RawRecord).targaCamion ??
      (data as RawRecord).targaRimorchio ??
      "",
  )
    .trim()
    .toUpperCase();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await getItemSync("@manutenzioni");
        if (cancelled) return;
        const snapshot = unwrapManutenzioniSnapshot(raw);
        const linked = readLegameLavoro(data as unknown as RawRecord);
        if (linked.length === 0) {
          setLegameStato("no-legame");
        } else if (isLegameOrfano(data as unknown as RawRecord, snapshot)) {
          setLegameStato("legame-orfano");
        } else {
          setLegameStato("legame-valido");
        }
      } catch {
        if (!cancelled) setLegameStato("no-legame");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data, snapshotVer]);

  const openModal = useCallback(
    async (mode: AgganciaLegameMode) => {
      if (!targa) return;
      setModalState({ mode, candidati: [], busy: true });
      try {
        const candidati = await getManutenzioniPerAggancio(targa);
        setModalState({ mode, candidati, busy: false });
      } catch (err) {
        console.error("Errore caricamento candidati aggancio:", err);
        setModalState(null);
      }
    },
    [targa],
  );

  const handleConfirmAggancio = useCallback(
    async (manutenzioneTargetId: string) => {
      setModalState((prev) => (prev ? { ...prev, busy: true } : prev));
      try {
        const res = await agganciaSegnalazioneAManutenzioneEsistente({
          sorgenteId: String(data.id),
          sorgenteTipo: "segnalazione",
          manutenzioneTargetId,
        });
        if (!res.ok) {
          window.alert(res.error || "Errore aggancio segnalazione.");
        } else if (res.alreadyLinked) {
          window.alert("Segnalazione gia' collegata a questa manutenzione.");
        } else {
          window.alert(
            res.chiusuraPropagata
              ? "Aggancio eseguito. Segnalazione chiusa automaticamente (manutenzione target gia' eseguita)."
              : "Aggancio eseguito.",
          );
        }
      } catch (err) {
        console.error("Errore aggancio segnalazione:", err);
        window.alert("Errore aggancio segnalazione.");
      }
      setModalState(null);
      setSnapshotVer((v) => v + 1);
    },
    [data.id],
  );

  const handleSgancia = useCallback(async () => {
    const message =
      legameStato === "legame-orfano"
        ? "Sganciare il link rotto da questa segnalazione? Tornera' nelle liste aperte."
        : "Sganciare questa segnalazione dalla manutenzione collegata? Potrai riagganciarla altrove.";
    if (!window.confirm(message)) {
      return;
    }
    try {
      const res = await sganciaLegameManutenzione({
        sorgenteId: String(data.id),
        sorgenteTipo: "segnalazione",
      });
      if (!res.ok) {
        window.alert(res.error || "Errore sgancio legame.");
      } else if (res.alreadyClean) {
        window.alert("La segnalazione non aveva legami da sganciare.");
      } else {
        window.alert("Legame sganciato. La segnalazione puo' essere riagganciata altrove.");
      }
    } catch (err) {
      console.error("Errore sgancio legame:", err);
      window.alert("Errore sgancio legame.");
    }
    setSnapshotVer((v) => v + 1);
  }, [data.id, legameStato]);

  return (
    <>
      {data.descrizione ? (
        <div className="rx-section">
          <div className="rx-label">Descrizione</div>
          <div className="rx-value">
            {data.descrizione}
            {legameStato === "legame-orfano" ? (
              <span
                data-testid="link-rotto-badge"
                style={{
                  display: "inline-block",
                  marginLeft: 8,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "#fff7ed",
                  border: "1px solid #fdba74",
                  color: "#9a3412",
                  fontSize: 11,
                  verticalAlign: "middle",
                }}
                title="Link rotto: la manutenzione collegata non esiste piu'."
              >
                Link rotto
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="rx-section">
        <div className="rx-label">Stato</div>
        <div className="rx-value">
          {showChiusura ? (
            <FraseStoriaRecord {...segnalazioneToRecordChiuso(data)} />
          ) : (
            <>
              Stato corrente: <strong>{data.stato || "—"}</strong>
              {data.letta ? <> (letta dall&apos;admin)</> : null}
            </>
          )}
        </div>
      </div>
      {showLinkManutenzione ? (
        <div className="rx-section">
          <div className="rx-label">Manutenzione generata</div>
          <div className="rx-value">
            {linkedIds.map((id) => (
              <span key={id} className="mono" style={{ display: "block" }}>
                {id}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {showFotoNote ? (
        <div className="rx-section">
          <div className="rx-label">Foto</div>
          <div className="rx-value">{data.fotoCount} foto allegate.</div>
        </div>
      ) : null}

      {/* PROMPT 47 T1/T2 — azioni aggancia/cambia/sgancia legame manutenzione */}
      {legameStato !== "loading" ? (
        <div
          className="rx-section"
          data-testid="aggancia-actions-section"
          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
        >
          {legameStato === "no-legame" ? (
            <button
              type="button"
              className="edit"
              onClick={() => void openModal("aggancia")}
              data-testid="btn-aggancia"
            >
              Aggancia a manutenzione esistente
            </button>
          ) : null}
          {legameStato === "legame-valido" ? (
            <>
              <button
                type="button"
                className="edit"
                onClick={() => void openModal("cambia")}
                data-testid="btn-cambia-legame"
              >
                Cambia legame
              </button>
              <button
                type="button"
                className="edit"
                onClick={() => void handleSgancia()}
                data-testid="btn-sgancia-legame"
              >
                Sgancia legame
              </button>
            </>
          ) : null}
          {legameStato === "legame-orfano" ? (
            <>
              <button
                type="button"
                className="edit"
                onClick={() => void handleSgancia()}
                data-testid="btn-sgancia-orfano"
              >
                Sgancia link orfano
              </button>
              <button
                type="button"
                className="edit"
                onClick={() => void openModal("sostituisci-orfano")}
                data-testid="btn-sostituisci-orfano"
              >
                Sostituisci con manutenzione esistente
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {modalState ? (
        <NextAgganciaLegameModal
          sorgente={{
            id: String(data.id),
            targa,
            tipo: "segnalazione",
            descrizione: String(data.descrizione ?? "").trim(),
          }}
          mode={modalState.mode}
          legameAttuale={
            modalState.mode === "cambia" || modalState.mode === "sostituisci-orfano"
              ? { id: linkedIds.join(", ") }
              : null
          }
          candidati={modalState.candidati}
          busy={modalState.busy}
          onCancel={() => {
            if (!modalState.busy) setModalState(null);
          }}
          onConfirm={(id) => void handleConfirmAggancio(id)}
        />
      ) : null}
    </>
  );
}

function renderSegnalazioneExpanded(
  data: Extract<ArchivioRecord, { kind: "segnalazione" }>["data"],
): ReactElement {
  return <SegnalazioneExpanded data={data} />;
}

function renderRichiestaExpanded(
  data: Extract<ArchivioRecord, { kind: "richiesta" }>["data"],
): ReactElement {
  const showEvasione: boolean = data.evasa === true;

  return (
    <>
      {data.testo ? (
        <div className="rx-section">
          <div className="rx-label">Testo richiesta</div>
          <div className="rx-value">{data.testo}</div>
        </div>
      ) : null}
      <div className="rx-section">
        <div className="rx-label">Stato</div>
        <div className="rx-value">
          {showEvasione ? (
            <>
              Evasa il{" "}
              <span className="mono">
                {formatDateTimeLong(data.dataEvasione)}
              </span>
              {data.evasaBy ? (
                <>
                  {" "}da <strong>{data.evasaBy}</strong>
                </>
              ) : null}
            </>
          ) : (
            <>
              Stato corrente: <strong>{data.stato || "—"}</strong>
              {data.letta ? <> (letta dall&apos;admin)</> : null}
            </>
          )}
        </div>
      </div>
      {data.hasFoto ? (
        <div className="rx-section">
          <div className="rx-label">Foto</div>
          <div className="rx-value">Allegate foto alla richiesta.</div>
        </div>
      ) : null}
    </>
  );
}

export function ArchivioRowExpanded({ record }: Props): ReactElement {
  let body: ReactElement;
  switch (record.kind) {
    case "manutenzione": {
      body = <ManutenzioneExpanded data={record.data} />;
      break;
    }
    case "segnalazione": {
      body = renderSegnalazioneExpanded(record.data);
      break;
    }
    case "richiesta": {
      body = renderRichiestaExpanded(record.data);
      break;
    }
  }

  return <div className="archivio-row-extra">{body}</div>;
}
