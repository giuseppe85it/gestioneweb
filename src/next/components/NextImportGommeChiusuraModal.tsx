import { useEffect, useMemo, useState, type ReactElement } from "react";

import { getItemSync } from "../../utils/storageSync";
import { buildFraseStoria, type TipoRecordStoria } from "../helpers/frasestoriaRecord";
import { formatDateTimeUI } from "../nextDateFormat";

const MANUTENZIONI_KEY = "@manutenzioni";
const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";
const CONTROLLI_KEY = "@controlli_mezzo_autisti";
const DAY_MS = 24 * 60 * 60 * 1000;
const SUGGESTED_DAYS = 30;

type RawRecord = Record<string, unknown>;
export type NextImportGommeChiusuraSelectionKind =
  | "manutenzione"
  | "segnalazione"
  | "controllo";

export type NextImportGommeChiusuraSelection = {
  kind: NextImportGommeChiusuraSelectionKind;
  id: string;
  label: string;
  /**
   * PROMPT 44 — D4: fingerprint del record sorgente, usato dal writer di chiusura
   * come fallback se l'id non matcha (record storici migrati con id sintetico).
   * Popolato solo per `kind: "manutenzione"`.
   */
  fingerprint?: {
    targa: string | null;
    data: string | null;
    descrizione: string | null;
    stato: string | null;
  } | null;
};

type Candidate = NextImportGommeChiusuraSelection & {
  subtitle: string;
  timestamp: number | null;
  distanceDays: number | null;
  suggested: boolean;
};

type Props = {
  record: RawRecord;
  onCancel: () => void;
  onConfirm: (selected: NextImportGommeChiusuraSelection[]) => void;
  busy?: boolean;
};

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapList(raw: unknown): RawRecord[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.value)) return raw.value.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.items)) return raw.items.filter(isRecord);
  return [];
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeLower(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function normalizeTarga(value: unknown): string {
  return normalizeText(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function toTs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.abs(value) < 1_000_000_000_000 ? value * 1000 : value;
  }
  if (value && typeof value === "object" && "toMillis" in value) {
    const toMillis = (value as { toMillis?: unknown }).toMillis;
    if (typeof toMillis === "function") {
      const parsed = Number(toMillis.call(value));
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  if (value && typeof value === "object" && "seconds" in value) {
    const seconds = Number((value as { seconds?: unknown }).seconds);
    return Number.isFinite(seconds) ? seconds * 1000 : null;
  }
  const raw = normalizeText(value);
  if (!raw) return null;
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return Math.abs(numeric) < 1_000_000_000_000 ? numeric * 1000 : numeric;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function getRecordTimestamp(record: RawRecord): number | null {
  return (
    toTs(record.dataInserimento) ??
    toTs(record.createdAt) ??
    toTs(record.timestamp) ??
    toTs(record.data) ??
    toTs(record.updatedAt)
  );
}

function getCambioTimestamp(record: RawRecord): number {
  return getRecordTimestamp(record) ?? Date.now();
}

function hasGommeKeyword(record: RawRecord): boolean {
  const text = [
    record.descrizione,
    record.tipo,
    record.tipoProblema,
    record.categoria,
    record.target,
    record.note,
    record.messaggio,
    record.koItems,
    record.controlliKo,
  ]
    .map((entry) => (Array.isArray(entry) ? entry.join(" ") : normalizeText(entry)))
    .join(" ")
    .toLowerCase();
  return /\b(gomma|gomme|pneumatici|pneumatico|ruota|ruote|gommista)\b/.test(text);
}

function sameTarga(record: RawRecord, targa: string): boolean {
  const values = [
    record.targa,
    record.targaCamion,
    record.targaMotrice,
    record.mezzoTarga,
    record.targaRimorchio,
  ];
  return values.some((value) => normalizeTarga(value) === targa);
}

function isOpenManutenzione(record: RawRecord): boolean {
  const stato = normalizeText(record.stato);
  return stato === "daFare" || stato === "programmata";
}

function isOpenSegnalazione(record: RawRecord): boolean {
  const stato = normalizeLower(record.stato);
  return stato !== "chiusa" && stato !== "importata" && record.chiusa !== true;
}

function isOpenControllo(record: RawRecord): boolean {
  const stato = normalizeLower(record.stato);
  return stato !== "chiusa" && record.chiuso !== true;
}

function hasControlloKo(record: RawRecord): boolean {
  if (record.ko === true || record.ok === false || record.tuttoOk === false) return true;
  if (Array.isArray(record.koItems) && record.koItems.length > 0) return true;
  if (Array.isArray(record.controlliKo) && record.controlliKo.length > 0) return true;
  if (record.check && typeof record.check === "object" && !Array.isArray(record.check)) {
    return Object.values(record.check as RawRecord).some((value) => value === false);
  }
  return normalizeLower(record.esito) === "ko";
}

function candidateFromRecord(args: {
  record: RawRecord;
  kind: NextImportGommeChiusuraSelectionKind;
  eventTs: number;
}): Candidate | null {
  const id = normalizeText(args.record.id);
  if (!id) return null;
  const timestamp = getRecordTimestamp(args.record);
  const distanceDays =
    timestamp !== null ? Math.floor((args.eventTs - timestamp) / DAY_MS) : null;
  const suggested = distanceDays !== null && distanceDays >= 0 && distanceDays <= SUGGESTED_DAYS;
  const label =
    normalizeText(args.record.descrizione) ||
    normalizeText(args.record.tipoProblema) ||
    normalizeText(args.record.tipo) ||
    (args.kind === "controllo" ? "Controllo KO gomme" : "Segnalazione gomme");
  const subtitle = [
    args.kind === "manutenzione"
      ? "Manutenzione da fare"
      : args.kind === "controllo"
        ? "Controllo KO"
        : "Segnalazione",
    timestamp ? formatDateTimeUI(timestamp) : "data non disponibile",
  ].join(" - ");
  const fingerprint =
    args.kind === "manutenzione"
      ? {
          targa: normalizeText(args.record.targa) || null,
          data: normalizeText(args.record.data) || null,
          descrizione: normalizeText(args.record.descrizione) || null,
          stato: normalizeText(args.record.stato) || null,
        }
      : null;
  return {
    kind: args.kind,
    id,
    label,
    subtitle,
    timestamp,
    distanceDays,
    suggested,
    fingerprint,
  };
}

function checkboxKey(candidate: NextImportGommeChiusuraSelection): string {
  return `${candidate.kind}:${candidate.id}`;
}

function chiusuraKindToStoriaTipo(kind: NextImportGommeChiusuraSelectionKind): TipoRecordStoria {
  if (kind === "segnalazione") return "segnalazione";
  if (kind === "controllo") return "controllo_ko";
  return "manutenzione";
}

export function NextImportGommeChiusuraModal({
  record,
  onCancel,
  onConfirm,
  busy = false,
}: Props): ReactElement {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [checked, setChecked] = useState<Set<string>>(() => new Set<string>());

  const targa = useMemo(
    () =>
      normalizeTarga(
        record.targa ??
          record.targaCamion ??
          record.targaMotrice ??
          record.mezzoTarga ??
          record.targaRimorchio,
      ),
    [record],
  );

  useEffect(() => {
    let cancelled = false;
    async function loadCandidates() {
      setLoading(true);
      setError(null);
      try {
        const eventTs = getCambioTimestamp(record);
        const [manutenzioniRaw, segnalazioniRaw, controlliRaw] = await Promise.all([
          getItemSync(MANUTENZIONI_KEY),
          getItemSync(SEGNALAZIONI_KEY),
          getItemSync(CONTROLLI_KEY),
        ]);
        const nextCandidates: Candidate[] = [];
        unwrapList(manutenzioniRaw).forEach((entry) => {
          if (!sameTarga(entry, targa) || !isOpenManutenzione(entry) || !hasGommeKeyword(entry)) return;
          const candidate = candidateFromRecord({ record: entry, kind: "manutenzione", eventTs });
          if (candidate) nextCandidates.push(candidate);
        });
        unwrapList(segnalazioniRaw).forEach((entry) => {
          if (!sameTarga(entry, targa) || !isOpenSegnalazione(entry) || !hasGommeKeyword(entry)) return;
          const candidate = candidateFromRecord({ record: entry, kind: "segnalazione", eventTs });
          if (candidate) nextCandidates.push(candidate);
        });
        unwrapList(controlliRaw).forEach((entry) => {
          if (!sameTarga(entry, targa) || !isOpenControllo(entry) || !hasControlloKo(entry) || !hasGommeKeyword(entry)) {
            return;
          }
          const candidate = candidateFromRecord({ record: entry, kind: "controllo", eventTs });
          if (candidate) nextCandidates.push(candidate);
        });
        nextCandidates.sort((left, right) => {
          if (left.suggested !== right.suggested) return left.suggested ? -1 : 1;
          return (right.timestamp ?? 0) - (left.timestamp ?? 0);
        });
        if (!cancelled) {
          setCandidates(nextCandidates);
          setChecked(new Set(nextCandidates.filter((entry) => entry.suggested).map(checkboxKey)));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Errore lettura candidate chiusura.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadCandidates();
    return () => {
      cancelled = true;
    };
  }, [record, targa]);

  const suggested = candidates.filter((entry) => entry.suggested);
  const others = candidates.filter((entry) => !entry.suggested);

  const toggle = (candidate: Candidate): void => {
    const key = checkboxKey(candidate);
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const confirm = (): void => {
    const selected = candidates
      .filter((candidate) => checked.has(checkboxKey(candidate)))
      .map(({ kind, id, label, fingerprint }) => ({ kind, id, label, fingerprint }));
    onConfirm(selected);
  };

  const renderCandidate = (candidate: Candidate): ReactElement => (
    <label key={checkboxKey(candidate)} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0" }}>
      <input
        type="checkbox"
        checked={checked.has(checkboxKey(candidate))}
        onChange={() => toggle(candidate)}
        disabled={busy}
      />
      <span>
        <strong>{candidate.label}</strong>
        <span style={{ display: "block", color: "#64748b", fontSize: 12 }}>
          {candidate.subtitle}
          {candidate.distanceDays !== null ? ` - ${candidate.distanceDays} gg dal cambio` : ""}
        </span>
      </span>
    </label>
  );

  return (
    <div className="aix-backdrop" onMouseDown={busy ? undefined : onCancel}>
      <div className="aix-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="aix-head">
          <h3>Chiudi segnalazioni gomme correlate</h3>
          <button className="aix-close" type="button" onClick={onCancel} disabled={busy}>
            CHIUDI
          </button>
        </div>
        <div className="aix-body">
          <p style={{ marginTop: 0 }}>
            Targa <strong>{targa || "-"}</strong>. Seleziona cosa chiudere quando viene creato il cambio gomme.
          </p>
          {loading ? <p>Caricamento segnalazioni e manutenzioni aperte...</p> : null}
          {error ? <div className="admin-error">{error}</div> : null}
          {!loading && !error && candidates.length === 0 ? (
            <p>Nessuna segnalazione, controllo o manutenzione gomme aperta per questo mezzo.</p>
          ) : null}
          {suggested.length > 0 ? (
            <section>
              <h4>Suggerite entro 30 giorni</h4>
              {suggested.map(renderCandidate)}
            </section>
          ) : null}
          {others.length > 0 ? (
            <section>
              <h4>Altre aperte</h4>
              {others.map(renderCandidate)}
            </section>
          ) : null}
          {(() => {
            const checkedCandidate = candidates.find((c) => checked.has(checkboxKey(c)));
            if (!checkedCandidate) return null;
            return (
              <div
                className="aix-frase-preview"
                style={{
                  marginTop: 14,
                  padding: "10px 12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                }}
              >
                <span style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                  Frase storia che apparira' dopo la chiusura:
                </span>
                <p style={{ margin: 0, fontSize: 13, color: "#334155" }}>
                  {buildFraseStoria({
                    tipo: chiusuraKindToStoriaTipo(checkedCandidate.kind),
                    dataApertura: checkedCandidate.timestamp,
                    modalitaChiusura: "evento_autisti",
                    dataEventoChiusura: getCambioTimestamp(record),
                  })}
                </p>
              </div>
            );
          })()}
          <div className="aix-actions">
            <button className="edit" type="button" onClick={onCancel} disabled={busy}>
              ANNULLA
            </button>
            <button className="edit" type="button" onClick={confirm} disabled={busy || loading}>
              {candidates.length === 0 ? "CONTINUA SENZA CHIUSURE" : "CREA EVENTO E CHIUDI SELEZIONATE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
