import { useMemo, useState } from "react";
import "./ControlloDebug.css";

type Severity = "ALTO" | "MEDIO" | "BASSO";

type AuditCode =
  | "LIBRETTO_SOLO_PATH"
  | "LIBRETTO_URL_SENZA_PATH"
  | "LIBRETTO_MANCANTE"
  | "FOTO_SOLO_PATH"
  | "FOTO_URL_SENZA_PATH"
  | "DUP_ID"
  | "DUP_TARGA"
  | "MISSING_TARGA"
  | "MISSING_CATEGORIA"
  | "URL_PRESENTE_NOCHECK";

type AuditIssue = {
  code: AuditCode;
  severity: Severity;
  mezzoId: string;
  targa: string;
  dettagli: string;
};

type MezzoInput = {
  id?: string;
  targa?: string;
  categoria?: string;
  librettoUrl?: string | null;
  librettoStoragePath?: string | null;
  fotoUrl?: string | null;
  fotoStoragePath?: string | null;
  fotoPath?: string | null;
};

type ControlloDebugProps = {
  mezzi: MezzoInput[];
};

type AuditToggles = {
  libretti: boolean;
  foto: boolean;
  duplicati: boolean;
  campiMancanti: boolean;
  urlRotte: boolean;
};

const DEFAULT_TOGGLES: AuditToggles = {
  libretti: true,
  foto: true,
  duplicati: true,
  campiMancanti: true,
  urlRotte: false,
};

const normalizeTargaKey = (value?: string | null) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

const textValue = (value?: string | null) => String(value ?? "").trim();

const formatPresence = (value: string) => (value ? "presente" : "vuoto");

const makeMezzoId = (mezzo: MezzoInput, index: number) =>
  textValue(mezzo.id) || `index:${index}`;

const pushIssue = (
  list: AuditIssue[],
  code: AuditCode,
  severity: Severity,
  mezzoId: string,
  targa: string,
  dettagli: string
) => {
  list.push({
    code,
    severity,
    mezzoId,
    targa: textValue(targa),
    dettagli,
  });
};

const runAudit = (mezzi: MezzoInput[], toggles: AuditToggles): AuditIssue[] => {
  const issues: AuditIssue[] = [];

  mezzi.forEach((mezzo, index) => {
    const mezzoId = makeMezzoId(mezzo, index);
    const targa = textValue(mezzo.targa);
    const categoria = textValue(mezzo.categoria);

    const librettoUrl = textValue(mezzo.librettoUrl);
    const librettoStoragePath = textValue(mezzo.librettoStoragePath);
    const fotoUrl = textValue(mezzo.fotoUrl);
    const fotoPath = textValue(mezzo.fotoStoragePath || mezzo.fotoPath);

    if (toggles.libretti) {
      if (librettoStoragePath && !librettoUrl) {
        pushIssue(
          issues,
          "LIBRETTO_SOLO_PATH",
          "MEDIO",
          mezzoId,
          targa,
          `librettoStoragePath=${formatPresence(
            librettoStoragePath
          )}; librettoUrl=${formatPresence(librettoUrl)}`
        );
      } else if (librettoUrl && !librettoStoragePath) {
        pushIssue(
          issues,
          "LIBRETTO_URL_SENZA_PATH",
          "MEDIO",
          mezzoId,
          targa,
          `librettoUrl=${formatPresence(
            librettoUrl
          )}; librettoStoragePath=${formatPresence(librettoStoragePath)}`
        );
      } else if (!librettoUrl && !librettoStoragePath) {
        pushIssue(
          issues,
          "LIBRETTO_MANCANTE",
          "BASSO",
          mezzoId,
          targa,
          "librettoUrl=vuoto; librettoStoragePath=vuoto"
        );
      }
    }

    if (toggles.foto) {
      if (fotoPath && !fotoUrl) {
        pushIssue(
          issues,
          "FOTO_SOLO_PATH",
          "MEDIO",
          mezzoId,
          targa,
          `fotoPath/fotoStoragePath=${formatPresence(
            fotoPath
          )}; fotoUrl=${formatPresence(fotoUrl)}`
        );
      } else if (fotoUrl && !fotoPath) {
        pushIssue(
          issues,
          "FOTO_URL_SENZA_PATH",
          "MEDIO",
          mezzoId,
          targa,
          `fotoUrl=${formatPresence(
            fotoUrl
          )}; fotoPath/fotoStoragePath=${formatPresence(fotoPath)}`
        );
      }
    }

    if (toggles.campiMancanti) {
      if (!targa) {
        pushIssue(
          issues,
          "MISSING_TARGA",
          "ALTO",
          mezzoId,
          targa,
          "Campo targa mancante o vuoto"
        );
      }
      if (!categoria) {
        pushIssue(
          issues,
          "MISSING_CATEGORIA",
          "MEDIO",
          mezzoId,
          targa,
          "Campo categoria mancante o vuoto"
        );
      }
    }

    if (toggles.urlRotte && (librettoUrl || fotoUrl)) {
      pushIssue(
        issues,
        "URL_PRESENTE_NOCHECK",
        "BASSO",
        mezzoId,
        targa,
        `Nessun check rete eseguito (librettoUrl=${formatPresence(
          librettoUrl
        )}; fotoUrl=${formatPresence(fotoUrl)})`
      );
    }
  });

  if (toggles.duplicati) {
    const byId = new Map<string, string[]>();
    const byTarga = new Map<string, string[]>();

    mezzi.forEach((mezzo, index) => {
      const mezzoId = makeMezzoId(mezzo, index);
      const idKey = textValue(mezzo.id);
      const targaKey = normalizeTargaKey(mezzo.targa);

      if (idKey) {
        byId.set(idKey, [...(byId.get(idKey) || []), mezzoId]);
      }
      if (targaKey) {
        byTarga.set(targaKey, [...(byTarga.get(targaKey) || []), mezzoId]);
      }
    });

    byId.forEach((ids, duplicateId) => {
      if (ids.length < 2) return;
      ids.forEach((mezzoId) => {
        pushIssue(
          issues,
          "DUP_ID",
          "ALTO",
          mezzoId,
          "",
          `id duplicato=${duplicateId}; occorrenze=${ids.length}; mezzoIds=${ids.join(
            ", "
          )}`
        );
      });
    });

    byTarga.forEach((ids, targaNorm) => {
      if (ids.length < 2) return;
      ids.forEach((mezzoId) => {
        pushIssue(
          issues,
          "DUP_TARGA",
          "ALTO",
          mezzoId,
          targaNorm,
          `targa duplicata normalizzata=${targaNorm}; occorrenze=${ids.length}; mezzoIds=${ids.join(
            ", "
          )}`
        );
      });
    });
  }

  return issues;
};

const buildReport = (
  issues: AuditIssue[],
  filteredIssues: AuditIssue[],
  mezziCount: number,
  runAt: Date | null,
  toggles: AuditToggles,
  quickFilter: string
) => {
  const byCode = new Map<AuditCode, number>();
  filteredIssues.forEach((issue) => {
    byCode.set(issue.code, (byCode.get(issue.code) || 0) + 1);
  });

  const filterParts = [
    toggles.libretti ? "Libretti" : null,
    toggles.foto ? "Foto" : null,
    toggles.duplicati ? "Duplicati" : null,
    toggles.campiMancanti ? "Campi mancanti" : null,
    toggles.urlRotte ? "URL rotte (no check rete)" : null,
  ].filter(Boolean);

  const lines: string[] = [];
  lines.push("# Controllo Debug Mezzi");
  lines.push("");
  lines.push(`- Eseguito: ${runAt ? runAt.toLocaleString("it-IT") : "n/a"}`);
  lines.push(`- Mezzi analizzati: ${mezziCount}`);
  lines.push(`- Issue trovate (audit): ${issues.length}`);
  lines.push(`- Issue visibili (filtri): ${filteredIssues.length}`);
  lines.push(`- Filtri audit: ${filterParts.join(", ") || "nessuno"}`);
  lines.push(`- Filtro rapido: ${quickFilter || "(vuoto)"}`);
  lines.push("");
  lines.push("## Riepilogo per codice");

  if (byCode.size === 0) {
    lines.push("- Nessuna issue.");
  } else {
    [...byCode.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .forEach(([code, count]) => lines.push(`- ${code}: ${count}`));
  }

  lines.push("");
  lines.push("## Elenco issue");
  if (filteredIssues.length === 0) {
    lines.push("- Nessuna issue per i filtri correnti.");
  } else {
    filteredIssues.forEach((issue, index) => {
      lines.push(
        `${index + 1}. [${issue.severity}] ${issue.code} | mezzoId=${issue.mezzoId} | targa=${
          issue.targa || "-"
        }`
      );
      lines.push(`   ${issue.dettagli}`);
    });
  }

  return lines.join("\n");
};

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function ControlloDebug({ mezzi }: ControlloDebugProps) {
  const [open, setOpen] = useState(true);
  const [toggles, setToggles] = useState<AuditToggles>(DEFAULT_TOGGLES);
  const [quickFilter, setQuickFilter] = useState("");
  const [issues, setIssues] = useState<AuditIssue[]>([]);
  const [runAt, setRunAt] = useState<Date | null>(null);
  const [copyStatus, setCopyStatus] = useState<string>("");

  const filteredIssues = useMemo(() => {
    const query = quickFilter.trim().toLowerCase();
    if (!query) return issues;

    const tokens = query.split(/\s+/g).filter(Boolean);
    return issues.filter((issue) => {
      const haystack = [
        issue.code,
        issue.severity,
        issue.mezzoId,
        issue.targa,
        issue.dettagli,
      ]
        .join(" ")
        .toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [issues, quickFilter]);

  const summaryByCode = useMemo(() => {
    const map = new Map<AuditCode, number>();
    filteredIssues.forEach((issue) => {
      map.set(issue.code, (map.get(issue.code) || 0) + 1);
    });
    return [...map.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
    );
  }, [filteredIssues]);

  const summaryBySeverity = useMemo(() => {
    const base: Record<Severity, number> = { ALTO: 0, MEDIO: 0, BASSO: 0 };
    filteredIssues.forEach((issue) => {
      base[issue.severity] += 1;
    });
    return base;
  }, [filteredIssues]);

  const handleToggle = (key: keyof AuditToggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRunAudit = () => {
    const next = runAudit(mezzi, toggles);
    setIssues(next);
    setRunAt(new Date());
    setCopyStatus("");
  };

  const handleCopyReport = async () => {
    const text = buildReport(
      issues,
      filteredIssues,
      mezzi.length,
      runAt,
      toggles,
      quickFilter
    );
    const copied = await copyToClipboard(text);
    setCopyStatus(copied ? "Report copiato." : "Copia non disponibile.");
  };

  return (
    <section className="debug-panel">
      <div className="debug-panel__head">
        <div>
          <h3 className="debug-panel__title">Controllo Debug</h3>
          <p className="debug-panel__subtitle">
            Audit read-only su mezzi (nessuna scrittura dati).
          </p>
        </div>
        <button
          type="button"
          className="debug-panel__toggle"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? "Nascondi Debug" : "Mostra Debug"}
        </button>
      </div>

      {open && (
        <div className="debug-panel__body">
          <div className="debug-panel__controls">
            <label className="debug-panel__check">
              <input
                type="checkbox"
                checked={toggles.libretti}
                onChange={() => handleToggle("libretti")}
              />
              Libretti
            </label>
            <label className="debug-panel__check">
              <input
                type="checkbox"
                checked={toggles.foto}
                onChange={() => handleToggle("foto")}
              />
              Foto
            </label>
            <label className="debug-panel__check">
              <input
                type="checkbox"
                checked={toggles.duplicati}
                onChange={() => handleToggle("duplicati")}
              />
              Duplicati
            </label>
            <label className="debug-panel__check">
              <input
                type="checkbox"
                checked={toggles.campiMancanti}
                onChange={() => handleToggle("campiMancanti")}
              />
              Campi mancanti
            </label>
            <label className="debug-panel__check">
              <input
                type="checkbox"
                checked={toggles.urlRotte}
                onChange={() => handleToggle("urlRotte")}
              />
              URL rotte (no check rete)
            </label>
          </div>

          <div className="debug-panel__actions">
            <input
              type="text"
              className="debug-panel__input"
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
              placeholder="Filtro rapido: libretti, foto, duplicati, targa, date..."
            />
            <button
              type="button"
              className="debug-panel__btn debug-panel__btn--primary"
              onClick={handleRunAudit}
            >
              Esegui audit
            </button>
            <button
              type="button"
              className="debug-panel__btn"
              onClick={handleCopyReport}
              disabled={!runAt}
            >
              Copia report
            </button>
          </div>

          <div className="debug-panel__meta">
            <span>Mezzi in input: {mezzi.length}</span>
            <span>Issue audit: {issues.length}</span>
            <span>Issue visibili: {filteredIssues.length}</span>
            <span>Esecuzione: {runAt ? runAt.toLocaleString("it-IT") : "-"}</span>
            {copyStatus && <span>{copyStatus}</span>}
          </div>

          <div className="debug-panel__summary-grid">
            <div className="debug-card debug-card--high">
              <div className="debug-card__label">ALTO</div>
              <div className="debug-card__value">{summaryBySeverity.ALTO}</div>
            </div>
            <div className="debug-card debug-card--medium">
              <div className="debug-card__label">MEDIO</div>
              <div className="debug-card__value">{summaryBySeverity.MEDIO}</div>
            </div>
            <div className="debug-card debug-card--low">
              <div className="debug-card__label">BASSO</div>
              <div className="debug-card__value">{summaryBySeverity.BASSO}</div>
            </div>
          </div>

          <div className="debug-panel__codes">
            {summaryByCode.length === 0 ? (
              <div className="debug-panel__empty">
                Premi "Esegui audit" per generare il report.
              </div>
            ) : (
              summaryByCode.map(([code, count]) => (
                <div key={code} className="debug-code-row">
                  <span className="debug-code-row__code">{code}</span>
                  <span className="debug-code-row__count">{count}</span>
                </div>
              ))
            )}
          </div>

          <div className="debug-panel__issues">
            {filteredIssues.length === 0 ? (
              <div className="debug-panel__empty">
                Nessuna issue per i filtri correnti.
              </div>
            ) : (
              filteredIssues.map((issue, index) => (
                <div
                  key={`${issue.code}_${issue.mezzoId}_${index}`}
                  className={`debug-issue debug-issue--${issue.severity.toLowerCase()}`}
                >
                  <div className="debug-issue__head">
                    <span className="debug-issue__code">{issue.code}</span>
                    <span className="debug-issue__severity">{issue.severity}</span>
                  </div>
                  <div className="debug-issue__meta">
                    mezzoId: <strong>{issue.mezzoId}</strong> | targa:{" "}
                    <strong>{issue.targa || "-"}</strong>
                  </div>
                  <div className="debug-issue__details">{issue.dettagli}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
