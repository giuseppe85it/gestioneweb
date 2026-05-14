// Archivio Storico NEXT — Step 4 (PROMPT 29.9) — ArchivioRowExpanded.
// Card espansa polimorfica per kind (SPEC §8). Renderizza sezioni
// `.rx-section` con k:v + descrizione lunga + griglie k:v.
// Solo campi presenti nei type proiezione: niente invenzioni.

import type { ReactElement } from "react";

import type { ArchivioRecord } from "../archivioTypes";
import { StoriaRecordTimeline } from "../../../components/StoriaRecordTimeline";
import { getStoriaRecord } from "../../../helpers/storiaRecord";
import "../styles/archivioStorico.css";

type Props = {
  record: ArchivioRecord;
};

function formatDateTimeLong(ts: number | null | undefined): string {
  if (ts === null || ts === undefined || !Number.isFinite(ts) || ts === 0) {
    return "—";
  }
  const date: Date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "—";
  const dd: string = String(date.getDate()).padStart(2, "0");
  const mm: string = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy: string = String(date.getFullYear());
  const hh: string = String(date.getHours()).padStart(2, "0");
  const mi: string = String(date.getMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} · ${hh}:${mi}`;
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

function asseLabel(asseId: string): string {
  const normalized: string = asseId.trim().toLowerCase();
  if (normalized === "anteriore") return "anteriore";
  if (normalized === "posteriore") return "posteriore";
  const m: RegExpMatchArray | null = normalized.match(/^asse(\d+)$/);
  if (m) return `asse ${m[1]}`;
  return asseId;
}

function renderManutenzioneExpanded(
  data: Extract<ArchivioRecord, { kind: "manutenzione" }>["data"],
): ReactElement {
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

  return (
    <>
      {data.descrizione ? (
        <div className="rx-section">
          <div className="rx-label">Descrizione</div>
          <div className="rx-value">
            {data.descrizione}
            <StoriaRecordTimeline
              storia={getStoriaRecord(data as unknown as Record<string, unknown>)}
              compact
            />
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
                    {g.dataCambio ? ` · cambio ${g.dataCambio}` : ""}
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

function renderSegnalazioneExpanded(
  data: Extract<ArchivioRecord, { kind: "segnalazione" }>["data"],
): ReactElement {
  const showChiusura: boolean = data.chiusa === true;
  const showLinkManutenzione: boolean =
    data.hasLinkedLavoro && Boolean(data.linkedLavoroId);
  const showFotoNote: boolean = data.fotoCount > 0;

  return (
    <>
      {data.descrizione ? (
        <div className="rx-section">
          <div className="rx-label">Descrizione</div>
          <div className="rx-value">{data.descrizione}</div>
        </div>
      ) : null}
      <div className="rx-section">
        <div className="rx-label">Stato</div>
        <div className="rx-value">
          {showChiusura ? (
            <>
              Chiusa il{" "}
              <span className="mono">
                {formatDateTimeLong(data.dataChiusura)}
              </span>
              {data.chiusaBy ? (
                <>
                  {" "}da <strong>{data.chiusaBy}</strong>
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
      {showLinkManutenzione ? (
        <div className="rx-section">
          <div className="rx-label">Manutenzione generata</div>
          <div className="rx-value">
            <span className="mono">{data.linkedLavoroId}</span>
          </div>
        </div>
      ) : null}
      {showFotoNote ? (
        <div className="rx-section">
          <div className="rx-label">Foto</div>
          <div className="rx-value">{data.fotoCount} foto allegate.</div>
        </div>
      ) : null}
    </>
  );
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
      body = renderManutenzioneExpanded(record.data);
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
