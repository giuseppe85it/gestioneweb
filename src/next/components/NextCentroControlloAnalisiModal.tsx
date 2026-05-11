import { useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  RefuelRow,
  RefuelSeedIndex,
  RefuelSourceFilter,
  ScheduledMaintenanceRow,
} from "../types/centroControlloTypes";
import {
  formatDecimalIt,
  formatMediaLitriKm,
  formatNumberIt,
  MONTH_NAMES,
  normalizeTargaFilter,
} from "../NextCentroControlloParityPage";

type MonthFilter = number | "all";
type YearFilter = number | "all";

type AnalisiTabKey = "mezzi" | "autisti" | "confronta" | "andamento";

type Props = {
  open: boolean;
  onClose: () => void;
  refuelRows: RefuelRow[];
  refuelSeedIndex: RefuelSeedIndex;
  mezziTargheList: string[];
  scheduledMaintenances: ScheduledMaintenanceRow[];
  selectedMonth: MonthFilter;
  selectedYear: YearFilter;
  refuelSourceFilter: RefuelSourceFilter;
  initialTab?: AnalisiTabKey;
  initialAndamentoTarga?: string | null;
};

export default function NextCentroControlloAnalisiModal({
  open,
  onClose,
  refuelRows,
  refuelSeedIndex,
  mezziTargheList,
  scheduledMaintenances,
  selectedMonth,
  selectedYear,
  refuelSourceFilter,
  initialTab,
  initialAndamentoTarga,
}: Props) {
  const [analisiActiveTab, setAnalisiActiveTab] = useState<AnalisiTabKey>("mezzi");
  const [mezziSelected, setMezziSelected] = useState<Set<string>>(new Set());
  const [autistiSelected, setAutistiSelected] = useState<Set<string>>(new Set());
  const [confrontaCategoria, setConfrontaCategoria] = useState<"mezzi" | "autisti">("mezzi");
  const [andamentoMezzoSelected, setAndamentoMezzoSelected] = useState<string | null>(null);
  const [andamentoTargaInput, setAndamentoTargaInput] = useState("");
  const [andamentoTargaDropdownOpen, setAndamentoTargaDropdownOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialTab) setAnalisiActiveTab(initialTab);
    if (initialAndamentoTarga) {
      setAndamentoMezzoSelected(initialAndamentoTarga);
      setAndamentoTargaInput(initialAndamentoTarga);
    }
  }, [open, initialTab, initialAndamentoTarga]);

  const analisiData = useMemo(() => {
    if (!open) return null;

    const isValidPair = (
      row: RefuelRow,
      seed: RefuelRow | null,
    ): seed is RefuelRow =>
      !!seed &&
      typeof row.km === "number" &&
      row.km > 0 &&
      typeof seed.km === "number" &&
      seed.km > 0 &&
      row.km > seed.km &&
      typeof row.litri === "number" &&
      row.litri > 0;

    const computeStats = (rows: RefuelRow[]) => {
      let sumKm = 0;
      let sumLitri = 0;
      let validCount = 0;
      const ratios: number[] = [];
      for (const row of rows) {
        const seed = refuelSeedIndex.findSeed(row);
        if (!isValidPair(row, seed)) continue;
        const litri = row.litri as number;
        const delta = (row.km as number) - seed.km!;
        if (!Number.isFinite(delta) || delta <= 0) continue;
        sumKm += delta;
        sumLitri += litri;
        validCount += 1;
        const r = delta / litri;
        if (Number.isFinite(r) && r > 0) ratios.push(r);
      }
      const pesata =
        sumLitri > 0 && Number.isFinite(sumKm / sumLitri) && sumKm / sumLitri > 0
          ? sumKm / sumLitri
          : null;
      const semplice =
        ratios.length > 0
          ? ratios.reduce((s, r) => s + r, 0) / ratios.length
          : null;
      return {
        kmTot: sumKm,
        litriTot: sumLitri,
        validCount,
        pesata,
        semplice,
      };
    };

    const filteredForClassifica = refuelRows.filter((row) => {
      if (selectedMonth !== "all" && row.dateObj.getMonth() + 1 !== selectedMonth)
        return false;
      if (selectedYear !== "all" && row.dateObj.getFullYear() !== selectedYear)
        return false;
      if (refuelSourceFilter !== "all" && row.sourceKey !== refuelSourceFilter)
        return false;
      return true;
    });

    const mezziMap = new Map<string, RefuelRow[]>();
    for (const row of filteredForClassifica) {
      const list = mezziMap.get(row.targa);
      if (list) list.push(row);
      else mezziMap.set(row.targa, [row]);
    }
    const mezziAggregati = Array.from(mezziMap.entries())
      .map(([targa, rows]) => {
        const stats = computeStats(rows);
        return {
          id: targa,
          targa,
          rifCount: rows.length,
          kmTot: stats.kmTot,
          litriTot: stats.litriTot,
          semplice: stats.semplice,
          pesata: stats.pesata,
        };
      })
      .filter((m) => m.rifCount >= 3 && m.pesata !== null)
      .sort((a, b) => {
        const pa = a.pesata ?? 0;
        const pb = b.pesata ?? 0;
        if (pa !== pb) return pb - pa;
        return b.kmTot - a.kmTot;
      });

    const autistiMap = new Map<string, RefuelRow[]>();
    for (const row of filteredForClassifica) {
      const key = (row.autistaNome ?? "").trim().toLowerCase();
      if (!key) continue;
      const list = autistiMap.get(key);
      if (list) list.push(row);
      else autistiMap.set(key, [row]);
    }
    const autistiAggregati = Array.from(autistiMap.entries())
      .map(([key, rows]) => {
        const nome = rows[0]?.autistaNome ?? key;
        const stats = computeStats(rows);
        return {
          id: key,
          autistaNome: nome,
          rifCount: rows.length,
          kmTot: stats.kmTot,
          litriTot: stats.litriTot,
          semplice: stats.semplice,
          pesata: stats.pesata,
        };
      })
      .filter((a) => a.rifCount >= 3 && a.pesata !== null)
      .sort((a, b) => {
        const pa = a.pesata ?? 0;
        const pb = b.pesata ?? 0;
        if (pa !== pb) return pb - pa;
        return b.kmTot - a.kmTot;
      });

    let andamento: {
      targa: string;
      categoria: string;
      totalRifMezzo: number;
      mezzoAvgStorica: number | null;
      currentEntry: {
        key: string;
        year: number;
        month: number;
        rifCount: number;
        kmTot: number;
        litriTot: number;
        pesata: number | null;
        scostamento: number | null;
        isCurrent: boolean;
      } | null;
      monthly: Array<{
        key: string;
        year: number;
        month: number;
        rifCount: number;
        kmTot: number;
        litriTot: number;
        pesata: number | null;
        scostamento: number | null;
        isCurrent: boolean;
      }>;
      maxPesata: number;
      autistiSuMezzo: Array<{
        autistaKey: string;
        autistaNome: string;
        rifCount: number;
        kmTot: number;
        litriTot: number;
        pesata: number | null;
        scostamento: number | null;
      }>;
    } | null = null;

    if (andamentoMezzoSelected) {
      const targa = andamentoMezzoSelected;
      const allMezzo = refuelRows.filter((r) => r.targa === targa);

      const buckets = new Map<string, RefuelRow[]>();
      for (const row of allMezzo) {
        const y = row.dateObj.getFullYear();
        const m = row.dateObj.getMonth() + 1;
        const key = `${y}-${String(m).padStart(2, "0")}`;
        const list = buckets.get(key);
        if (list) list.push(row);
        else buckets.set(key, [row]);
      }

      const monthlyEntries = Array.from(buckets.entries())
        .map(([key, rows]) => {
          const [yStr, mStr] = key.split("-");
          const year = Number(yStr);
          const month = Number(mStr);
          const stats = computeStats(rows);
          return {
            key,
            year,
            month,
            rows,
            rifCount: rows.length,
            kmTot: stats.kmTot,
            litriTot: stats.litriTot,
            pesata: stats.pesata,
          };
        })
        .sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.month - a.month;
        });

      const last12 = monthlyEntries.slice(0, 12);

      const today = new Date();
      const currentY = today.getFullYear();
      const currentM = today.getMonth() + 1;
      const currentKey = `${currentY}-${String(currentM).padStart(2, "0")}`;

      const storicoRows: RefuelRow[] = [];
      for (const entry of last12) {
        if (entry.key === currentKey) continue;
        storicoRows.push(...entry.rows);
      }
      const storicoStats = computeStats(storicoRows);
      const mezzoAvgStorica = storicoStats.pesata;

      const last12WithScostamento = last12.map((e) => {
        let scostamento: number | null = null;
        if (mezzoAvgStorica && e.pesata !== null) {
          scostamento = (e.pesata - mezzoAvgStorica) / mezzoAvgStorica;
        }
        const isCurrent = e.key === currentKey;
        return {
          key: e.key,
          year: e.year,
          month: e.month,
          rifCount: e.rifCount,
          kmTot: e.kmTot,
          litriTot: e.litriTot,
          pesata: e.pesata,
          scostamento,
          isCurrent,
        };
      });

      let maxPesata = 0;
      for (const e of last12WithScostamento) {
        if (e.pesata !== null && e.pesata > maxPesata) maxPesata = e.pesata;
      }

      const currentEntry =
        last12WithScostamento.find((e) => e.isCurrent) ?? null;

      const cutoff = new Date(today);
      cutoff.setMonth(cutoff.getMonth() - 6);
      const last6MezzoRows = allMezzo.filter((r) => r.dateObj >= cutoff);
      const autistiMezzoMap = new Map<string, RefuelRow[]>();
      for (const row of last6MezzoRows) {
        const key = (row.autistaNome ?? "").trim().toLowerCase();
        if (!key) continue;
        const list = autistiMezzoMap.get(key);
        if (list) list.push(row);
        else autistiMezzoMap.set(key, [row]);
      }
      const autistiSuMezzo = Array.from(autistiMezzoMap.entries())
        .map(([key, rows]) => {
          const nome = rows[0]?.autistaNome ?? key;
          const stats = computeStats(rows);
          let scostamento: number | null = null;
          if (mezzoAvgStorica && stats.pesata !== null) {
            scostamento = (stats.pesata - mezzoAvgStorica) / mezzoAvgStorica;
          }
          return {
            autistaKey: key,
            autistaNome: nome,
            rifCount: rows.length,
            kmTot: stats.kmTot,
            litriTot: stats.litriTot,
            pesata: stats.pesata,
            scostamento,
          };
        })
        .filter((a) => a.rifCount >= 3)
        .sort((a, b) => b.rifCount - a.rifCount);

      const categoriaFromMaintenance =
        scheduledMaintenances.find((m) => m.targa === targa)?.categoria ?? "—";

      andamento = {
        targa,
        categoria: categoriaFromMaintenance,
        totalRifMezzo: allMezzo.length,
        mezzoAvgStorica,
        currentEntry,
        monthly: last12WithScostamento,
        maxPesata,
        autistiSuMezzo,
      };
    }

    return {
      mezziAggregati,
      autistiAggregati,
      andamento,
    };
  }, [
    open,
    refuelRows,
    refuelSeedIndex,
    selectedMonth,
    selectedYear,
    refuelSourceFilter,
    andamentoMezzoSelected,
    scheduledMaintenances,
  ]);

  const andamentoTargheSuggestions = useMemo(() => {
    const query = normalizeTargaFilter(andamentoTargaInput);
    if (!query) return mezziTargheList;
    return mezziTargheList.filter((targa) => targa.includes(query));
  }, [mezziTargheList, andamentoTargaInput]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const toggleMezzoFlag = (id: string) => {
    setMezziSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setConfrontaCategoria("mezzi");
  };

  const toggleAutistaFlag = (id: string) => {
    setAutistiSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setConfrontaCategoria("autisti");
  };

  const clearFlags = () => {
    setMezziSelected(new Set());
    setAutistiSelected(new Set());
  };

  if (!open || !analisiData) return null;

  const data = analisiData;
  const mesiLabel =
    selectedMonth === "all"
      ? "Tutti i mesi"
      : MONTH_NAMES[(selectedMonth as number) - 1];
  const annoLabel = selectedYear === "all" ? "Tutti gli anni" : String(selectedYear);
  const fonteLabel =
    refuelSourceFilter === "all"
      ? "Tutte"
      : refuelSourceFilter === "caravate"
        ? "Caravate"
        : refuelSourceFilter === "distributore_piccadilly"
          ? "Distributore Piccadilly"
          : refuelSourceFilter === "distributore_eni"
            ? "Distributore Eni"
            : "Distributore Contanti";

  const tooltipSemplice =
    "Media aritmetica delle medie singole di ogni rifornimento. Tutti i rifornimenti pesano uguale, anche quelli con pochi km.";
  const tooltipPesata =
    "Km totali percorsi divisi litri totali consumati. È il consumo reale del mezzo nel periodo, più affidabile della semplice.";

  const totalFlags = mezziSelected.size + autistiSelected.size;
  const confrontaEnabled =
    mezziSelected.size >= 2 || autistiSelected.size >= 2;
  const showCategoryToggle =
    mezziSelected.size >= 2 && autistiSelected.size >= 2;
  const effectiveCategoria =
    confrontaCategoria === "mezzi" && mezziSelected.size >= 2
      ? "mezzi"
      : confrontaCategoria === "autisti" && autistiSelected.size >= 2
        ? "autisti"
        : mezziSelected.size >= 2
          ? "mezzi"
          : "autisti";

  const renderTagEsito = (scostamento: number | null) => {
    if (scostamento === null) {
      return <span className="cc-analisi-tag-ok">—</span>;
    }
    const pctText = `${scostamento >= 0 ? "+" : ""}${(
      scostamento * 100
    )
      .toFixed(1)
      .replace(".", ",")}%`;
    if (scostamento <= -0.3) {
      return <span className="cc-analisi-tag-low">{pctText}</span>;
    }
    if (scostamento <= -0.15) {
      return <span className="cc-analisi-tag-warn">{pctText}</span>;
    }
    return <span className="cc-analisi-tag-ok">in linea</span>;
  };

  const renderClassificaMezzi = () => {
    if (data.mezziAggregati.length === 0) {
      return (
        <div className="cc-status">
          Nessun mezzo con almeno 3 rifornimenti nel periodo selezionato.
        </div>
      );
    }
    return (
      <>
        <p className="cc-analisi-section-info">
          Ordinata per km/L pesata · {data.mezziAggregati.length} mezzi sopra
          soglia (≥3 rifornimenti). Tiebreak: Km totali maggiori in alto.
        </p>
        <div className="cc-table-wrap">
          <table className="cc-table cc-analisi-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Flag</th>
                <th>Targa</th>
                <th title={tooltipSemplice}>km/L semplice ?</th>
                <th title={tooltipPesata}>km/L pesata ?</th>
                <th>Km tot</th>
                <th>Litri tot</th>
                <th>Rif.</th>
              </tr>
            </thead>
            <tbody>
              {data.mezziAggregati.map((m, i) => (
                <tr
                  key={m.id}
                  className={i === 0 ? "cc-analisi-rank-best" : undefined}
                >
                  <td>{i + 1}</td>
                  <td>
                    <input
                      type="checkbox"
                      className="cc-analisi-flag-checkbox"
                      checked={mezziSelected.has(m.id)}
                      onChange={() => toggleMezzoFlag(m.id)}
                      aria-label={`Flag mezzo ${m.targa}`}
                    />
                  </td>
                  <td>{m.targa}</td>
                  <td>
                    {m.semplice !== null
                      ? formatMediaLitriKm(m.semplice)
                      : "—"}
                  </td>
                  <td>
                    <strong>
                      {m.pesata !== null
                        ? formatMediaLitriKm(m.pesata)
                        : "—"}
                    </strong>
                  </td>
                  <td>{formatNumberIt(m.kmTot, 0)}</td>
                  <td>{formatNumberIt(m.litriTot, 2)}</td>
                  <td>{m.rifCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderClassificaAutisti = () => {
    if (data.autistiAggregati.length === 0) {
      return (
        <div className="cc-status">
          Nessun autista con almeno 3 rifornimenti nel periodo selezionato.
        </div>
      );
    }
    return (
      <>
        <p className="cc-analisi-section-info">
          Ordinata per km/L pesata · {data.autistiAggregati.length} autisti
          sopra soglia (≥3 rifornimenti). Tiebreak: Km totali maggiori in
          alto.
        </p>
        <div className="cc-table-wrap">
          <table className="cc-table cc-analisi-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Flag</th>
                <th>Autista</th>
                <th title={tooltipSemplice}>km/L semplice ?</th>
                <th title={tooltipPesata}>km/L pesata ?</th>
                <th>Km tot</th>
                <th>Litri tot</th>
                <th>Rif.</th>
              </tr>
            </thead>
            <tbody>
              {data.autistiAggregati.map((a, i) => (
                <tr
                  key={a.id}
                  className={i === 0 ? "cc-analisi-rank-best" : undefined}
                >
                  <td>{i + 1}</td>
                  <td>
                    <input
                      type="checkbox"
                      className="cc-analisi-flag-checkbox"
                      checked={autistiSelected.has(a.id)}
                      onChange={() => toggleAutistaFlag(a.id)}
                      aria-label={`Flag autista ${a.autistaNome}`}
                    />
                  </td>
                  <td>{a.autistaNome}</td>
                  <td>
                    {a.semplice !== null
                      ? formatMediaLitriKm(a.semplice)
                      : "—"}
                  </td>
                  <td>
                    <strong>
                      {a.pesata !== null
                        ? formatMediaLitriKm(a.pesata)
                        : "—"}
                    </strong>
                  </td>
                  <td>{formatNumberIt(a.kmTot, 0)}</td>
                  <td>{formatNumberIt(a.litriTot, 2)}</td>
                  <td>{a.rifCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderConfronta = () => {
    if (!confrontaEnabled) {
      return (
        <div className="cc-status">
          Seleziona almeno 2 mezzi o 2 autisti dalle classifiche per
          abilitare il confronto.
        </div>
      );
    }
    const entitiesAll =
      effectiveCategoria === "mezzi"
        ? data.mezziAggregati
            .filter((m) => mezziSelected.has(m.id))
            .map((m) => ({
              id: m.id,
              label: m.targa,
              pesata: m.pesata,
              semplice: m.semplice,
              kmTot: m.kmTot,
              litriTot: m.litriTot,
              rifCount: m.rifCount,
            }))
        : data.autistiAggregati
            .filter((a) => autistiSelected.has(a.id))
            .map((a) => ({
              id: a.id,
              label: a.autistaNome,
              pesata: a.pesata,
              semplice: a.semplice,
              kmTot: a.kmTot,
              litriTot: a.litriTot,
              rifCount: a.rifCount,
            }));
    if (entitiesAll.length < 2) {
      return (
        <div className="cc-status">
          La selezione di {effectiveCategoria === "mezzi" ? "mezzi" : "autisti"}{" "}
          ha meno di 2 elementi sopra soglia. Aggiungi flag o cambia
          categoria.
        </div>
      );
    }
    const sorted = [...entitiesAll].sort(
      (a, b) => (b.pesata ?? 0) - (a.pesata ?? 0),
    );
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const diff =
      best.pesata !== null && worst.pesata !== null
        ? best.pesata - worst.pesata
        : null;
    const insight =
      diff !== null
        ? `${best.label} più efficiente di ${worst.label}, differenza ${formatDecimalIt(diff, 2)} km/L.`
        : "Confronto non calcolabile (km/L mancanti su una o più entità selezionate).";

    return (
      <>
        {showCategoryToggle && (
          <div className="cc-analisi-toggle-row">
            <button
              type="button"
              className={`cc-analisi-toggle-btn${
                effectiveCategoria === "mezzi" ? " cc-analisi-toggle-btn-active" : ""
              }`}
              onClick={() => setConfrontaCategoria("mezzi")}
            >
              Mezzi ({mezziSelected.size})
            </button>
            <button
              type="button"
              className={`cc-analisi-toggle-btn${
                effectiveCategoria === "autisti" ? " cc-analisi-toggle-btn-active" : ""
              }`}
              onClick={() => setConfrontaCategoria("autisti")}
            >
              Autisti ({autistiSelected.size})
            </button>
          </div>
        )}
        <div className="cc-analisi-confronta-grid">
          {sorted.map((e, idx) => {
            const cardClass =
              idx === 0
                ? "cc-analisi-card cc-analisi-card-best"
                : idx === sorted.length - 1
                  ? "cc-analisi-card cc-analisi-card-worst"
                  : "cc-analisi-card";
            return (
              <div key={e.id} className={cardClass}>
                <div className="cc-analisi-card-label">{e.label}</div>
                <div className="cc-analisi-card-pesata">
                  {e.pesata !== null ? formatMediaLitriKm(e.pesata) : "—"}
                </div>
                <div className="cc-analisi-card-grid">
                  <div>
                    <span>km/L semplice</span>
                    <strong>
                      {e.semplice !== null
                        ? formatMediaLitriKm(e.semplice)
                        : "—"}
                    </strong>
                  </div>
                  <div>
                    <span>Km tot</span>
                    <strong>{formatNumberIt(e.kmTot, 0)}</strong>
                  </div>
                  <div>
                    <span>Litri tot</span>
                    <strong>{formatNumberIt(e.litriTot, 2)}</strong>
                  </div>
                  <div>
                    <span>Rif.</span>
                    <strong>{e.rifCount}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="cc-analisi-insight">{insight}</div>
      </>
    );
  };

  const renderAndamento = () => {
    const monthLabelShort = (year: number, month: number) => {
      const idx = month - 1;
      const m = MONTH_NAMES[idx]?.slice(0, 3) ?? String(month);
      return `${m} ${year}`;
    };
    const a = data.andamento;

    return (
      <>
        <div className="cc-analisi-section">
          <label className="cc-combobox-label">
            Cerca o seleziona mezzo
            <div className="cc-combobox">
              <input
                type="text"
                placeholder="Cerca targa o seleziona dalla lista"
                value={andamentoTargaInput}
                onFocus={() => setAndamentoTargaDropdownOpen(true)}
                onBlur={() =>
                  window.setTimeout(
                    () => setAndamentoTargaDropdownOpen(false),
                    120,
                  )
                }
                onChange={(e) => {
                  setAndamentoTargaInput(e.target.value);
                  setAndamentoTargaDropdownOpen(true);
                }}
              />
              {(andamentoTargaInput.length > 0 || andamentoMezzoSelected) && (
                <button
                  type="button"
                  className="cc-combobox-clear"
                  aria-label="Reset selezione mezzo"
                  onClick={() => {
                    setAndamentoTargaInput("");
                    setAndamentoMezzoSelected(null);
                    setAndamentoTargaDropdownOpen(false);
                  }}
                >
                  ×
                </button>
              )}
              {andamentoTargaDropdownOpen &&
                andamentoTargheSuggestions.length > 0 && (
                  <ul className="cc-combobox-list" role="listbox">
                    {andamentoTargheSuggestions.slice(0, 50).map((targa) => (
                      <li key={targa}>
                        <button
                          type="button"
                          className="cc-combobox-item"
                          role="option"
                          aria-selected={andamentoMezzoSelected === targa}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setAndamentoTargaInput(targa);
                            setAndamentoMezzoSelected(targa);
                            setAndamentoTargaDropdownOpen(false);
                          }}
                        >
                          {targa}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          </label>
          <small className="cc-analisi-helper">
            Lista completa di tutti i mezzi anagrafati. La selezione apre il
            dettaglio dell'andamento.
          </small>
        </div>

        {!a && (
          <div className="cc-status">
            Seleziona un mezzo per vedere il suo andamento nel tempo.
          </div>
        )}

        {a && (
          <>
            <div className="cc-analisi-section">
              <div className="cc-analisi-andamento-head">
                <div>
                  <div className="cc-analisi-andamento-targa">{a.targa}</div>
                  <div className="cc-analisi-andamento-meta">
                    {a.categoria} · {a.totalRifMezzo} rifornimenti totali nello
                    storico
                  </div>
                </div>
                <div className="cc-analisi-andamento-storica">
                  <span>Media storica del mezzo</span>
                  <strong>
                    {a.mezzoAvgStorica !== null
                      ? formatMediaLitriKm(a.mezzoAvgStorica)
                      : "—"}
                  </strong>
                  <small>su ultimi 12 mesi</small>
                </div>
              </div>
              {a.currentEntry &&
                a.currentEntry.scostamento !== null &&
                a.currentEntry.scostamento <= -0.15 && (
                  <div
                    className={
                      a.currentEntry.scostamento <= -0.3
                        ? "cc-analisi-alert-low"
                        : "cc-analisi-alert-warn"
                    }
                  >
                    <span className="cc-cell-warning" aria-hidden="true">
                      ⚠
                    </span>
                    <div>
                      <strong>Calo significativo nel mese corrente.</strong>
                      <p>
                        A {monthLabelShort(a.currentEntry.year, a.currentEntry.month)}{" "}
                        il mezzo registra{" "}
                        {a.currentEntry.pesata !== null
                          ? formatMediaLitriKm(a.currentEntry.pesata)
                          : "—"}
                        ,{" "}
                        {(a.currentEntry.scostamento * 100)
                          .toFixed(1)
                          .replace(".", ",")}
                        % rispetto alla sua media storica (
                        {a.mezzoAvgStorica !== null
                          ? formatMediaLitriKm(a.mezzoAvgStorica)
                          : "—"}
                        ). Verificare se è un singolo episodio o trend in
                        corso.
                      </p>
                    </div>
                  </div>
                )}
            </div>

            <div className="cc-analisi-section">
              <h4>Andamento mensile (ultimi 12 mesi)</h4>
              {a.monthly.length === 0 && (
                <div className="cc-status">
                  Nessun rifornimento storico per questo mezzo.
                </div>
              )}
              {a.monthly.length > 0 && (
                <div className="cc-table-wrap">
                  <table className="cc-table cc-analisi-table">
                    <thead>
                      <tr>
                        <th>Mese</th>
                        <th>Km percorsi</th>
                        <th>Litri tot</th>
                        <th>Rif.</th>
                        <th title={tooltipPesata}>km/L pesata ?</th>
                        <th>Confronto</th>
                        <th>Esito</th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.monthly.map((m) => {
                        const fillPct =
                          a.maxPesata > 0 && m.pesata !== null
                            ? Math.max(2, (m.pesata / a.maxPesata) * 100)
                            : 0;
                        let barClass = "cc-analisi-bar-fill";
                        if (m.scostamento !== null) {
                          if (m.scostamento <= -0.3)
                            barClass += " cc-analisi-bar-fill-low";
                          else if (m.scostamento <= -0.15)
                            barClass += " cc-analisi-bar-fill-warn";
                        }
                        const monthLabel = m.isCurrent
                          ? `${monthLabelShort(m.year, m.month)} (corrente)`
                          : monthLabelShort(m.year, m.month);
                        return (
                          <tr
                            key={m.key}
                            className={
                              m.isCurrent
                                ? "cc-analisi-row-current"
                                : undefined
                            }
                          >
                            <td>{monthLabel}</td>
                            <td>{formatNumberIt(m.kmTot, 0)}</td>
                            <td>{formatNumberIt(m.litriTot, 2)}</td>
                            <td>{m.rifCount}</td>
                            <td>
                              <strong>
                                {m.pesata !== null
                                  ? formatMediaLitriKm(m.pesata)
                                  : "—"}
                              </strong>
                            </td>
                            <td>
                              <div className="cc-analisi-bar-bg">
                                <div
                                  className={barClass}
                                  style={{ width: `${fillPct}%` }}
                                />
                              </div>
                            </td>
                            <td>{renderTagEsito(m.scostamento)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <small className="cc-analisi-helper">
                La km/L pesata = km totali del mese ÷ litri totali del mese.
                Smussa l'effetto dei rabbocchi parziali. La barra confronta
                col valore massimo del periodo. Soglie: −15% giallo, −30%
                rosso.
              </small>
            </div>

            <div className="cc-analisi-section">
              <h4>Autisti che hanno guidato il mezzo (ultimi 6 mesi)</h4>
              {a.autistiSuMezzo.length === 0 ? (
                <div className="cc-status">
                  Nessun autista con almeno 3 rifornimenti su questo mezzo
                  negli ultimi 6 mesi.
                </div>
              ) : (
                <div className="cc-table-wrap">
                  <table className="cc-table cc-analisi-table">
                    <thead>
                      <tr>
                        <th>Autista</th>
                        <th>Rif.</th>
                        <th>Litri tot</th>
                        <th>Km tot</th>
                        <th title={tooltipPesata}>km/L pesata ?</th>
                        <th>Esito</th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.autistiSuMezzo.map((au) => {
                        let tag: ReactNode;
                        if (au.scostamento === null) {
                          tag = (
                            <span className="cc-analisi-tag-ok">—</span>
                          );
                        } else if (au.scostamento <= -0.3) {
                          tag = (
                            <span className="cc-analisi-tag-low">
                              {(au.scostamento * 100)
                                .toFixed(1)
                                .replace(".", ",")}
                              % vs mezzo
                            </span>
                          );
                        } else if (au.scostamento <= -0.15) {
                          tag = (
                            <span className="cc-analisi-tag-warn">
                              {(au.scostamento * 100)
                                .toFixed(1)
                                .replace(".", ",")}
                              % vs mezzo
                            </span>
                          );
                        } else {
                          tag = (
                            <span className="cc-analisi-tag-ok">
                              in linea con storico
                            </span>
                          );
                        }
                        return (
                          <tr key={au.autistaKey}>
                            <td>{au.autistaNome}</td>
                            <td>{au.rifCount}</td>
                            <td>{formatNumberIt(au.litriTot, 2)}</td>
                            <td>{formatNumberIt(au.kmTot, 0)}</td>
                            <td>
                              <strong>
                                {au.pesata !== null
                                  ? formatMediaLitriKm(au.pesata)
                                  : "—"}
                              </strong>
                            </td>
                            <td>{tag}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <small className="cc-analisi-helper">
                Confronto km/L pesata di ciascun autista vs media storica del
                mezzo. Soglia segnalazione: −15% rispetto al mezzo. Conteggio
                rifornimenti minimo 3 per entrare in tabella.
              </small>
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <div
      className="cc-analisi-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Analisi consumi"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cc-analisi-dialog">
        <div className="cc-analisi-header">
          <div>
            <h3>Analisi consumi</h3>
            <p className="cc-analisi-subtitle">
              Periodo: {mesiLabel} {selectedMonth !== "all" ? annoLabel : ""}
              {selectedMonth === "all" ? `· ${annoLabel}` : ""} · Fonte:{" "}
              {fonteLabel}
            </p>
          </div>
          <button
            type="button"
            className="cc-investigation-close"
            onClick={onClose}
            aria-label="Chiudi analisi consumi"
          >
            ×
          </button>
        </div>

        <div className="cc-analisi-tabs">
          <button
            type="button"
            className={`cc-analisi-tab${
              analisiActiveTab === "mezzi" ? " cc-analisi-tab-active" : ""
            }`}
            onClick={() => setAnalisiActiveTab("mezzi")}
          >
            Classifica mezzi
          </button>
          <button
            type="button"
            className={`cc-analisi-tab${
              analisiActiveTab === "autisti" ? " cc-analisi-tab-active" : ""
            }`}
            onClick={() => setAnalisiActiveTab("autisti")}
          >
            Classifica autisti
          </button>
          <button
            type="button"
            className={`cc-analisi-tab${
              analisiActiveTab === "confronta" ? " cc-analisi-tab-active" : ""
            }${!confrontaEnabled ? " cc-analisi-tab-disabled" : ""}`}
            onClick={() => {
              if (confrontaEnabled) setAnalisiActiveTab("confronta");
            }}
            disabled={!confrontaEnabled}
            title={
              confrontaEnabled
                ? undefined
                : "Seleziona almeno 2 mezzi o 2 autisti per abilitare il confronto"
            }
          >
            Confronta {totalFlags > 0 ? `(${totalFlags})` : ""}
          </button>
          <button
            type="button"
            className={`cc-analisi-tab${
              analisiActiveTab === "andamento" ? " cc-analisi-tab-active" : ""
            }`}
            onClick={() => setAnalisiActiveTab("andamento")}
          >
            Andamento mezzo
          </button>
        </div>

        <div className="cc-analisi-body">
          {analisiActiveTab === "mezzi" && renderClassificaMezzi()}
          {analisiActiveTab === "autisti" && renderClassificaAutisti()}
          {analisiActiveTab === "confronta" && renderConfronta()}
          {analisiActiveTab === "andamento" && renderAndamento()}
        </div>

        <div className="cc-analisi-footer">
          <span className="cc-analisi-footer-info">
            {mezziSelected.size} mezzi · {autistiSelected.size} autisti
            flaggati
          </span>
          {totalFlags > 0 && (
            <button
              type="button"
              className="cc-secondary-btn"
              onClick={clearFlags}
            >
              Pulisci flag
            </button>
          )}
          <button
            type="button"
            className="cc-secondary-btn"
            onClick={onClose}
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
