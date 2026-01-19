import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "./CapoMezzi.css";

type Mezzo = {
  id?: string;
  targa?: string;
  marca?: string;
  modello?: string;
  categoria?: string;
  fotoUrl?: string | null;
};

type CostRecord = {
  id?: string;
  targa: string;
  tipo: "FATTURA" | "PREVENTIVO";
  data?: string;
  importo?: number;
  valuta?: string;
  currency?: string;
  fornitore?: string;
  fileUrl?: string | null;
  sourceKey?: string;
  sourceDocId?: string;
};

const IA_COLLECTIONS = [
  "@documenti_mezzi",
  "@documenti_magazzino",
  "@documenti_generici",
];

const normalizeTarga = (value?: unknown): string => {
  if (typeof value !== "string") return "";
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
};

const normalizeTipo = (value?: unknown): string => {
  if (typeof value !== "string") return "";
  return value.toUpperCase().replace(/\s+/g, "").trim();
};

type Currency = "EUR" | "CHF" | "UNKNOWN";

const detectCurrencyFromText = (input: unknown): Currency => {
  if (!input) return "UNKNOWN";
  const text = String(input).toUpperCase();
  if (text.includes("€") || text.includes("EUR")) return "EUR";
  if (text.includes("CHF") || text.includes("FR.")) return "CHF";
  return "UNKNOWN";
};

const resolveCurrencyFromRecord = (record: any): Currency => {
  const direct = detectCurrencyFromText(record?.valuta ?? record?.currency);
  if (direct !== "UNKNOWN") return direct;
  const source = [
    record?.totaleDocumento,
    record?.importo,
    record?.testo,
    record?.imponibile,
    record?.ivaImporto,
    record?.importoPagamento,
    record?.numeroDocumento,
    record?.fornitoreLabel,
    record?.descrizione,
  ]
    .filter(Boolean)
    .join(" ");
  return detectCurrencyFromText(source);
};

const parseDateAny = (value?: string): Date | null => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  let match = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    const ts = new Date(`${yyyy}-${mm}-${dd}`).getTime();
    return Number.isNaN(ts) ? null : new Date(ts);
  }

  match = raw.match(/^(\d{2})\s+(\d{2})\s+(\d{4})/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    const ts = new Date(`${yyyy}-${mm}-${dd}`).getTime();
    return Number.isNaN(ts) ? null : new Date(ts);
  }

  const ts = Date.parse(raw);
  if (Number.isNaN(ts)) return null;
  return new Date(ts);
};

const parseAmountAny = (value: unknown): number | null => {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  let raw = String(value).trim();
  if (!raw) return null;
  raw = raw.toUpperCase();
  raw = raw.replace(/CHF|EUR|€|EURO/g, "");
  raw = raw.replace(/[\s'\u00A0]/g, "");

  if (raw.includes(",") && raw.includes(".")) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  } else if (raw.includes(",")) {
    raw = raw.replace(",", ".");
  }

  raw = raw.replace(/[^0-9.-]/g, "");
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractImportoFromRaw = (d: any): number | undefined => {
  const candidates = [
    d?.importo,
    d?.totaleDocumento,
    d?.totale,
    d?.importoTotale,
    d?.totaleFattura,
    d?.totale_con_iva,
    d?.importoTotaleDocumento,
  ];

  for (const raw of candidates) {
    const parsed = parseAmountAny(raw);
    if (parsed != null) return parsed;
  }
  return undefined;
};

const formatAmountValue = (value: number) => value.toFixed(2);

type CostSummary = {
  fattureMonthCHF: number;
  fattureMonthEUR: number;
  fattureYearCHF: number;
  fattureYearEUR: number;
  preventiviMonthCHF: number;
  preventiviMonthEUR: number;
  preventiviYearCHF: number;
  preventiviYearEUR: number;
  unknownCount: number;
  incomplete: number;
};

const normalizeCategoryGroup = (value?: string | null): string => {
  const raw = String(value || "").toLowerCase().trim();
  if (!raw) return "Altro";
  if (raw.includes("motrice")) return "Motrici";
  if (raw.includes("trattore")) return "Trattori stradali";
  if (
    raw.includes("semirimorchio") ||
    raw.includes("rimorchio") ||
    raw.includes("biga") ||
    raw.includes("centina") ||
    raw.includes("vasca") ||
    raw.includes("pianale")
  ) {
    return "Rimorchi / Semirimorchi";
  }
  return "Altro";
};

const GROUP_ORDER = ["Motrici", "Trattori stradali", "Rimorchi / Semirimorchi", "Altro"];

const buildCostIndex = (costs: CostRecord[], now: Date): Map<string, CostSummary> => {
  const month = now.getMonth();
  const year = now.getFullYear();
  const map = new Map<string, CostSummary>();

  for (const record of costs) {
    const targaKey = normalizeTarga(record.targa);
    if (!targaKey) continue;

    const entry = map.get(targaKey) || {
      fattureMonthCHF: 0,
      fattureMonthEUR: 0,
      fattureYearCHF: 0,
      fattureYearEUR: 0,
      preventiviMonthCHF: 0,
      preventiviMonthEUR: 0,
      preventiviYearCHF: 0,
      preventiviYearEUR: 0,
      unknownCount: 0,
      incomplete: 0,
    };

    const importo = parseAmountAny(record.importo);
    const dateValue = parseDateAny(record.data);
    const hasImporto = Number.isFinite(importo as number);
    const hasDate = !!dateValue;

    if (!hasImporto || !hasDate) {
      entry.incomplete += 1;
      map.set(targaKey, entry);
      continue;
    }

    const currency = resolveCurrencyFromRecord(record);
    if (currency === "UNKNOWN") {
      entry.unknownCount += 1;
      map.set(targaKey, entry);
      continue;
    }

    const d = dateValue as Date;
    if (d.getFullYear() === year) {
      if (record.tipo === "FATTURA") {
        if (currency === "CHF") {
          entry.fattureYearCHF += importo as number;
        } else {
          entry.fattureYearEUR += importo as number;
        }
        if (d.getMonth() === month) {
          if (currency === "CHF") {
            entry.fattureMonthCHF += importo as number;
          } else {
            entry.fattureMonthEUR += importo as number;
          }
        }
      } else {
        if (currency === "CHF") {
          entry.preventiviYearCHF += importo as number;
        } else {
          entry.preventiviYearEUR += importo as number;
        }
        if (d.getMonth() === month) {
          if (currency === "CHF") {
            entry.preventiviMonthCHF += importo as number;
          } else {
            entry.preventiviMonthEUR += importo as number;
          }
        }
      }
    }

    map.set(targaKey, entry);
  }

  return map;
};

const CapoMezzi: React.FC = () => {
  const navigate = useNavigate();
  const [mezzi, setMezzi] = useState<Mezzo[]>([]);
  const [costIndex, setCostIndex] = useState<Map<string, CostSummary>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const mezziDocRef = doc(db, "storage", "@mezzi_aziendali");
        const mezziSnap = await getDoc(mezziDocRef);
        const mezziData = mezziSnap.data() || {};
        const mezziArray = (mezziData.value || []) as Mezzo[];

        const costiDocRef = doc(db, "storage", "@costiMezzo");
        const costiSnap = await getDoc(costiDocRef);
        const costiData = costiSnap.data() || {};
        const costiArray = (costiData.items || []) as any[];

        const manualCosts: CostRecord[] = costiArray.map((c) => ({
          id: String(c?.id ?? ""),
          targa: normalizeTarga(c?.mezzoTarga),
          tipo: c?.tipo === "PREVENTIVO" ? "PREVENTIVO" : "FATTURA",
          data: c?.data || "",
          importo: parseAmountAny(c?.importo) ?? undefined,
          valuta: resolveCurrencyFromRecord(c),
          fornitore: c?.fornitoreLabel || "",
          fileUrl: c?.fileUrl || null,
          sourceKey: "@costiMezzo",
          sourceDocId: String(c?.id ?? ""),
        }));

        const iaDocs: any[] = [];
        for (const colName of IA_COLLECTIONS) {
          try {
            const snap = await getDocs(collection(db, colName));
            snap.forEach((docSnap) => {
              const d = docSnap.data() || {};
              const docTipo = normalizeTipo(d.tipoDocumento);
              const docTarga = normalizeTarga(d.targa || "");
              const isDocValid = docTipo === "FATTURA" || docTipo === "PREVENTIVO";
              if (!isDocValid || !docTarga) return;
              iaDocs.push({
                ...d,
                tipoDocumento: docTipo,
                targa: docTarga,
                sourceKey: colName,
                sourceDocId: docSnap.id,
              });
            });
          } catch {
          }
        }

        const iaCosts: CostRecord[] = iaDocs.map((d) => ({
          id: String(d?.id ?? d?.sourceDocId ?? ""),
          targa: normalizeTarga(d.targa || ""),
          tipo: d.tipoDocumento === "PREVENTIVO" ? "PREVENTIVO" : "FATTURA",
          data: d.dataDocumento || "",
          importo: extractImportoFromRaw(d),
          valuta: resolveCurrencyFromRecord(d),
          fornitore: d.fornitore || "",
          fileUrl: d.fileUrl || null,
          sourceKey: d.sourceKey,
          sourceDocId: d.sourceDocId,
        }));

        const merged = [...manualCosts, ...iaCosts];
        const dedupKeys = new Set<string>();
        const deduped = merged.filter((item) => {
          const docId = item.sourceDocId ?? item.id ?? "";
          if (!docId) return true;
          const sourceKey = item.sourceKey ?? "";
          const key = sourceKey ? `${sourceKey}:${docId}` : String(docId);
          if (dedupKeys.has(key)) return false;
          dedupKeys.add(key);
          return true;
        });

        const index = buildCostIndex(deduped, new Date());

        if (!cancelled) {
          setMezzi(Array.isArray(mezziArray) ? mezziArray : []);
          setCostIndex(index);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Errore caricamento mezzi.");
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const mezziOrdinati = useMemo(() => {
    const query = normalizeTarga(searchTerm);
    return [...mezzi]
      .filter((mezzo) => {
        if (!query) return true;
        return normalizeTarga(mezzo.targa).includes(query);
      })
      .sort((a, b) => {
        const ta = normalizeTarga(a.targa);
        const tb = normalizeTarga(b.targa);
        const statsA = costIndex.get(ta);
        const statsB = costIndex.get(tb);
        const costA = (statsA?.fattureYearCHF ?? 0) + (statsA?.fattureYearEUR ?? 0);
        const costB = (statsB?.fattureYearCHF ?? 0) + (statsB?.fattureYearEUR ?? 0);
        if (costB !== costA) return costB - costA;
        return ta.localeCompare(tb);
      });
  }, [mezzi, searchTerm, costIndex]);

  const groupedMezzi = useMemo(() => {
    const map = new Map<string, Mezzo[]>();
    GROUP_ORDER.forEach((group) => map.set(group, []));
    mezziOrdinati.forEach((mezzo) => {
      const group = normalizeCategoryGroup(mezzo.categoria);
      if (!map.has(group)) map.set(group, []);
      map.get(group)?.push(mezzo);
    });
    return map;
  }, [mezziOrdinati]);

  return (
    <div className="capo-mezzi-wrapper">
      <div className="capo-mezzi-shell">
        <header className="capo-mezzi-header">
          <div className="capo-mezzi-title">
            <button
              type="button"
              className="capo-logo-button"
              onClick={() => navigate("/")}
              aria-label="Vai alla Home"
            >
              <img src="/logo.png" alt="Logo" />
            </button>
            <h1>Mezzi</h1>
            <p>Seleziona un mezzo per vedere costi e documenti.</p>
          </div>
        </header>

        <div className="capo-mezzi-controls">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca targa..."
          />
        </div>

        {loading && <div className="capo-mezzi-state">Caricamento mezzi...</div>}
        {error && !loading && <div className="capo-mezzi-state error">{error}</div>}

        {!loading && !error && mezziOrdinati.length === 0 && (
          <div className="capo-mezzi-state">Nessun mezzo trovato.</div>
        )}

        {!loading && !error && mezziOrdinati.length > 0 && (
          <div className="capo-mezzi-sections">
            {GROUP_ORDER.map((group) => {
              const list = groupedMezzi.get(group) || [];
              if (list.length === 0) return null;
              return (
                <section key={group} className="capo-mezzi-section">
                  <div className="capo-mezzi-section-head">
                    <h2>{group}</h2>
                    <span>{list.length} mezzi</span>
                  </div>
                  <div className="capo-mezzi-grid">
                    {list.map((mezzo, index) => {
                      const targa = normalizeTarga(mezzo.targa);
                      const stats = costIndex.get(targa) || {
                        fattureMonthCHF: 0,
                        fattureMonthEUR: 0,
                        fattureYearCHF: 0,
                        fattureYearEUR: 0,
                        preventiviMonthCHF: 0,
                        preventiviMonthEUR: 0,
                        preventiviYearCHF: 0,
                        preventiviYearEUR: 0,
                        unknownCount: 0,
                        incomplete: 0,
                      };
                      const description =
                        [mezzo.marca, mezzo.modello, mezzo.categoria]
                          .filter(Boolean)
                          .join(" - ") || "Descrizione non disponibile";

                      return (
                        <button
                          key={mezzo.id ?? targa ?? `mezzo-${index}`}
                          className="capo-mezzo-card"
                          type="button"
                          onClick={() => {
                            if (!targa) return;
                            navigate(`/capo/costi/${targa}`);
                          }}
                        >
                          <div className="capo-mezzo-photo">
                            {mezzo.fotoUrl ? (
                              <img src={mezzo.fotoUrl} alt={targa || "Foto mezzo"} />
                            ) : (
                              <div className="capo-mezzo-placeholder">Nessuna foto</div>
                            )}
                          </div>

                          <div className="capo-mezzo-body">
                            <div className="capo-mezzo-title">{targa || "Targa n/d"}</div>
                            <div className="capo-mezzo-desc">{description}</div>

                            <div className="capo-mezzo-metrics">
                              <div className="capo-mezzo-metric">
                                <span>Costo reale anno</span>
                                <div className="capo-mezzo-values">
                                  {stats.fattureYearCHF > 0 && (
                                    <strong>CHF {formatAmountValue(stats.fattureYearCHF)}</strong>
                                  )}
                                  {stats.fattureYearEUR > 0 && (
                                    <strong>EUR {formatAmountValue(stats.fattureYearEUR)}</strong>
                                  )}
                                  {stats.fattureYearCHF === 0 && stats.fattureYearEUR === 0 && (
                                    <strong>0.00</strong>
                                  )}
                                </div>
                              </div>
                              {(stats.fattureMonthCHF > 0 || stats.fattureMonthEUR > 0) && (
                                <div className="capo-mezzo-metric mini">
                                  <span>Fatture mese</span>
                                  <div className="capo-mezzo-values">
                                    {stats.fattureMonthCHF > 0 && (
                                      <strong>CHF {formatAmountValue(stats.fattureMonthCHF)}</strong>
                                    )}
                                    {stats.fattureMonthEUR > 0 && (
                                      <strong>EUR {formatAmountValue(stats.fattureMonthEUR)}</strong>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {(stats.preventiviYearCHF > 0 || stats.preventiviYearEUR > 0) && (
                              <div className="capo-mezzo-badge potential">
                                <span>Potenziale</span>
                                <div className="capo-mezzo-values">
                                  {stats.preventiviYearCHF > 0 && (
                                    <strong>CHF {formatAmountValue(stats.preventiviYearCHF)}</strong>
                                  )}
                                  {stats.preventiviYearEUR > 0 && (
                                    <strong>EUR {formatAmountValue(stats.preventiviYearEUR)}</strong>
                                  )}
                                </div>
                              </div>
                            )}

                            {stats.unknownCount > 0 && (
                              <div className="capo-mezzo-badge currency-warning">
                                VALUTA DA VERIFICARE ({stats.unknownCount})
                              </div>
                            )}

                            {stats.incomplete > 0 && (
                              <div className="capo-mezzo-badge incomplete">
                                Dati incompleti ({stats.incomplete})
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CapoMezzi;
