import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PdfPreviewModal from "../components/PdfPreviewModal";
import { formatDateTimeUI, formatDateUI } from "../utils/dateFormat";
import { generateAnalisiEconomicaPDFBlob } from "../utils/pdfEngine";
import {
  buildPdfShareText,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../utils/pdfPreview";
import "../pages/DossierMezzo.css";
import "./next-shell.css";
import NextGommeEconomiaSection from "./NextGommeEconomiaSection";
import NextRifornimentiEconomiaSection from "./NextRifornimentiEconomiaSection";
import {
  buildNextAnalisiEconomicaLegacyView,
  readNextDossierMezzoCompositeSnapshot,
  type NextAnalisiEconomicaLegacyViewState,
  type NextDossierFatturaPreventivoLegacyItem,
} from "./domain/nextDossierMezzoDomain";
import {
  readNextDossierAnalysisOverride,
  readNextDossierHiddenDocumentIds,
  writeNextDossierAnalysisOverride,
  type NextDossierCloneAnalysisOverride,
} from "./nextDossierCloneState";
import { buildNextDossierPath, NEXT_DOSSIER_LISTA_PATH } from "./nextStructuralPaths";

type Currency = "EUR" | "CHF" | "UNKNOWN";

type SupplierRow = {
  nome: string;
  totaleCHF: number;
  totaleEUR: number;
  unknownCount: number;
  numeroDocumenti: number;
};

function readErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function detectCurrency(input: unknown): Currency {
  if (!input) return "UNKNOWN";
  const text = String(input).toUpperCase();
  if (text.includes("CHF") || text.includes("FR.")) return "CHF";
  if (text.includes("EUR") || text.includes("EURO")) return "EUR";
  return "UNKNOWN";
}

function resolveCurrency(record: NextDossierFatturaPreventivoLegacyItem): Currency {
  const direct = detectCurrency(record.valuta ?? record.currency);
  if (direct !== "UNKNOWN") return direct;
  return detectCurrency([record.importo, record.descrizione, record.fornitoreLabel].filter(Boolean).join(" "));
}

function parseDateFlexible(value: string | null | undefined): Date | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;
  const dmy = raw.match(/^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})$/);
  if (!dmy) return null;
  const yearRaw = Number(dmy[3]);
  const year = dmy[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
  const date = new Date(year, Number(dmy[2]) - 1, Number(dmy[1]), 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildTotals(items: NextDossierFatturaPreventivoLegacyItem[]) {
  return items.reduce(
    (acc, item) => {
      const amount = typeof item.importo === "number" && Number.isFinite(item.importo) ? item.importo : 0;
      const currency = resolveCurrency(item);
      if (currency === "CHF") acc.chf += amount;
      else if (currency === "EUR") acc.eur += amount;
      else if (amount > 0) acc.unknown += 1;
      return acc;
    },
    { chf: 0, eur: 0, unknown: 0 },
  );
}

function buildSupplierRows(items: NextDossierFatturaPreventivoLegacyItem[]): SupplierRow[] {
  const bySupplier = new Map<string, SupplierRow>();
  items.forEach((item) => {
    const key = String(item.fornitoreLabel || "Senza fornitore").trim() || "Senza fornitore";
    const current = bySupplier.get(key) ?? {
      nome: key,
      totaleCHF: 0,
      totaleEUR: 0,
      unknownCount: 0,
      numeroDocumenti: 0,
    };
    current.numeroDocumenti += 1;
    const amount = typeof item.importo === "number" && Number.isFinite(item.importo) ? item.importo : 0;
    const currency = resolveCurrency(item);
    if (currency === "CHF") current.totaleCHF += amount;
    else if (currency === "EUR") current.totaleEUR += amount;
    else if (amount > 0) current.unknownCount += 1;
    bySupplier.set(key, current);
  });
  return Array.from(bySupplier.values()).sort(
    (left, right) =>
      right.totaleCHF + right.totaleEUR * 0.95 - (left.totaleCHF + left.totaleEUR * 0.95),
  );
}

function buildCloneAnalysis(
  mezzoTarga: string,
  items: NextDossierFatturaPreventivoLegacyItem[],
  suppliers: SupplierRow[],
): NextDossierCloneAnalysisOverride {
  const totals = buildTotals(items);
  const preventivi = items.filter((item) => item.tipo === "PREVENTIVO").length;
  const fatture = items.filter((item) => item.tipo === "FATTURA").length;
  const topSupplier = suppliers[0];
  const anomalies: string[] = [];
  if (totals.unknown > 0) anomalies.push(`Valuta da verificare su ${totals.unknown} documenti.`);
  if (!items.some((item) => item.fileUrl)) anomalies.push("Nessun PDF originale agganciato ai documenti filtrati.");
  if (items.length === 0) anomalies.push("Non ci sono documenti di costo su cui rigenerare un'analisi clone-only.");
  return {
    riepilogoBreve:
      items.length === 0
        ? "Nessun documento costo disponibile nel clone per questo mezzo."
        : `Il mezzo ${mezzoTarga} ha ${items.length} documenti di costo (${preventivi} preventivi e ${fatture} fatture). Totale visibile: CHF ${totals.chf.toFixed(2)} e EUR ${totals.eur.toFixed(2)}.`,
    analisiCosti:
      items.length === 0
        ? "La rigenerazione clone-only non puo stimare costi senza preventivi o fatture leggibili."
        : topSupplier
          ? `Il fornitore piu esposto e ${topSupplier.nome} con CHF ${topSupplier.totaleCHF.toFixed(2)} e EUR ${topSupplier.totaleEUR.toFixed(2)} su ${topSupplier.numeroDocumenti} documenti.`
          : "I costi sono distribuiti senza un fornitore dominante chiaramente leggibile.",
    anomalie: anomalies.join(" ") || "Nessuna anomalia forte emersa dal perimetro clone-only letto nel run.",
    fornitoriNotevoli:
      suppliers.length === 0
        ? "Nessun fornitore aggregabile dai documenti visibili."
        : suppliers
            .slice(0, 3)
            .map(
              (item) =>
                `${item.nome}: CHF ${item.totaleCHF.toFixed(2)}, EUR ${item.totaleEUR.toFixed(2)}, documenti ${item.numeroDocumenti}`,
            )
            .join(" | "),
    updatedAtTimestamp: Date.now(),
    targa: mezzoTarga,
    sourceCollection: "@next_clone_analisi_economica",
    sourceDocId: mezzoTarga,
    quality: "clone_only",
    flags: ["analisi_clone_only", "nessuna_scrittura_madre"],
  };
}

export default function NextAnalisiEconomicaPage() {
  const { targa } = useParams<{ targa: string }>();
  const navigate = useNavigate();
  const [legacy, setLegacy] = useState<NextAnalisiEconomicaLegacyViewState | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingIA, setSavingIA] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfFileName, setPdfFileName] = useState("analisi-economica.pdf");
  const [pdfTitle, setPdfTitle] = useState("Anteprima PDF analisi economica");
  const [pdfHint, setPdfHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!targa) {
        setError("Targa non specificata.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const nextSnapshot = await readNextDossierMezzoCompositeSnapshot(targa);
        if (cancelled) return;
        if (!nextSnapshot) {
          setLegacy(null);
          setError("Mezzo non trovato nel clone.");
          setLoading(false);
          return;
        }
        setLegacy(buildNextAnalisiEconomicaLegacyView(nextSnapshot));
        setError(null);
        setLoading(false);
      } catch (loadError) {
        if (cancelled) return;
        setError(readErrorMessage(loadError, "Errore caricamento analisi economica clone."));
        setLegacy(null);
        setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [targa]);

  useEffect(() => () => revokePdfPreviewUrl(pdfUrl), [pdfUrl]);

  const hiddenIds = useMemo(() => (targa ? new Set(readNextDossierHiddenDocumentIds(targa)) : new Set<string>()), [targa]);
  const mezzo = legacy?.mezzo ?? null;
  const documentiCosti = useMemo(
    () => (legacy?.documentiCosti ?? []).filter((item) => !hiddenIds.has(item.id)),
    [hiddenIds, legacy],
  );
  const supplierRows = useMemo(() => buildSupplierRows(documentiCosti), [documentiCosti]);
  const totals = useMemo(() => buildTotals(documentiCosti), [documentiCosti]);
  const currentYear = new Date().getFullYear();
  const docsCurrentYear = useMemo(
    () =>
      documentiCosti.filter((item) => {
        const date = parseDateFlexible(item.data ?? null);
        return date ? date.getFullYear() === currentYear : false;
      }),
    [currentYear, documentiCosti],
  );
  const totalsYear = useMemo(() => buildTotals(docsCurrentYear), [docsCurrentYear]);

  const analysisOverride = useMemo(() => (targa ? readNextDossierAnalysisOverride(targa) : null), [targa]);

  const analisiIA = analysisOverride ?? legacy?.analisiIA ?? null;
  const updatedAtLabel = analisiIA?.updatedAtTimestamp
    ? formatDateTimeUI(new Date(analisiIA.updatedAtTimestamp))
    : null;

  const buildShareMessage = () =>
    buildPdfShareText({
      contextLabel: pdfTitle,
      dateLabel: formatDateUI(new Date()),
      fileName: pdfFileName,
      url: pdfUrl,
    });

  const closePdf = () => {
    revokePdfPreviewUrl(pdfUrl);
    setPdfOpen(false);
    setPdfUrl(null);
    setPdfBlob(null);
    setPdfHint(null);
  };

  const handleRigeneraAnalisi = async () => {
    if (!targa) return;
    setSavingIA(true);
    try {
      const next = buildCloneAnalysis(targa, documentiCosti, supplierRows);
      writeNextDossierAnalysisOverride(targa, next);
      setLegacy((current) =>
        current
          ? {
              ...current,
              analisiIA: {
                ...next,
                sourceCollection: "@analisi_economica_mezzi",
                quality: "parziale",
              },
            }
          : current,
      );
    } finally {
      setSavingIA(false);
    }
  };

  const handleExportPdf = async () => {
    if (!mezzo) return;
    const testoAnalisi = [analisiIA?.riepilogoBreve, analisiIA?.analisiCosti, analisiIA?.fornitoriNotevoli, analisiIA?.anomalie]
      .filter(Boolean)
      .join("\n\n");
    try {
      const preview = await openPreview({
        source: async () =>
          generateAnalisiEconomicaPDFBlob({
            targa: mezzo.targa,
            mezzoInfo: mezzo,
            testoAnalisi,
            sezioniOpzionali: [
              {
                title: "Riepilogo costi",
                rows: [
                  ["Totale storico", `CHF ${totals.chf.toFixed(2)}`, `EUR ${totals.eur.toFixed(2)}`],
                  ["Totale anno corrente", `CHF ${totalsYear.chf.toFixed(2)}`, `EUR ${totalsYear.eur.toFixed(2)}`],
                ],
                columns: ["Voce", "CHF", "EUR"],
              },
            ],
          }),
      });
      revokePdfPreviewUrl(pdfUrl);
      setPdfBlob(preview.blob);
      setPdfUrl(preview.url);
      setPdfOpen(true);
      setPdfFileName(preview.fileName);
      setPdfTitle(`Anteprima PDF analisi economica ${mezzo.targa}`);
      setPdfHint(null);
    } catch (previewError) {
      window.alert(readErrorMessage(previewError, "Impossibile generare l'anteprima PDF."));
    }
  };

  const back = () => navigate(mezzo ? buildNextDossierPath(mezzo.targa) : NEXT_DOSSIER_LISTA_PATH);

  if (loading) {
    return <div className="dossier-wrapper"><div className="dossier-card dossier-card-full"><div className="dossier-card-body"><div className="dossier-empty">Caricamento analisi economica...</div></div></div></div>;
  }

  if (error || !legacy || !mezzo) {
    return <div className="dossier-wrapper"><div className="dossier-card dossier-card-full"><div className="dossier-card-body"><div className="dossier-empty">{error || "Analisi economica non disponibile."}</div><button className="dossier-button" type="button" onClick={back} style={{ marginTop: 12 }}>Torna al dossier</button></div></div></div>;
  }

  return (
    <div className="dossier-wrapper">
      <div className="dossier-header-bar">
        <button className="dossier-button ghost" type="button" onClick={back}>Dossier</button>
        <div className="dossier-header-center"><img src="/logo.png" alt="Logo" className="dossier-logo" /><div className="dossier-header-text"><span className="dossier-header-label">ANALISI ECONOMICA</span><h1 className="dossier-header-title">{`${mezzo.marca || "-"} ${mezzo.modello || "-"}`.trim()} - {mezzo.targa}</h1></div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="dossier-button" type="button" onClick={handleExportPdf}>Anteprima PDF</button>
          <button className="dossier-button primary" type="button" onClick={handleRigeneraAnalisi} disabled={savingIA || documentiCosti.length === 0}>{savingIA ? "Analisi IA in corso..." : "Rigenera analisi IA"}</button>
        </div>
      </div>

      <div className="dossier-grid">
        <section className="dossier-card"><div className="dossier-card-header"><h2>Riepilogo costi</h2></div><div className="dossier-card-body"><ul className="dossier-list"><li className="dossier-list-item"><div className="dossier-list-main"><strong>Totale storico (preventivi + fatture)</strong></div><div className="dossier-list-meta"><span>CHF {totals.chf.toFixed(2)}</span><span>EUR {totals.eur.toFixed(2)}</span></div></li><li className="dossier-list-item"><div className="dossier-list-main"><strong>Totale anno corrente</strong></div><div className="dossier-list-meta"><span>CHF {totalsYear.chf.toFixed(2)}</span><span>EUR {totalsYear.eur.toFixed(2)}</span></div></li><li className="dossier-list-item"><div className="dossier-list-main"><strong>Documenti visibili</strong></div><div className="dossier-list-meta"><span>{documentiCosti.length}</span><span>{totals.unknown > 0 ? `Valuta da verificare: ${totals.unknown}` : "Valute coerenti"}</span></div></li></ul></div></section>
        {targa ? <NextGommeEconomiaSection targa={targa} /> : null}
        {targa ? <NextRifornimentiEconomiaSection targa={targa} /> : null}

        <section className="dossier-card"><div className="dossier-card-header"><h2>Fornitori</h2></div><div className="dossier-card-body">{supplierRows.length === 0 ? <p className="dossier-empty">Nessun documento di costo per questo mezzo.</p> : <div className="dossier-table-wrapper"><table className="dossier-table"><thead><tr><th>Fornitore</th><th>Totale CHF</th><th>Totale EUR</th><th>Valuta n/d</th><th>Documenti</th></tr></thead><tbody>{supplierRows.map((row) => <tr key={row.nome}><td>{row.nome}</td><td>{row.totaleCHF.toFixed(2)} CHF</td><td>{row.totaleEUR.toFixed(2)} EUR</td><td>{row.unknownCount}</td><td>{row.numeroDocumenti}</td></tr>)}</tbody></table></div>}</div></section>

        <section className="dossier-card"><div className="dossier-card-header"><h2>Documenti recenti</h2></div><div className="dossier-card-body">{documentiCosti.length === 0 ? <p className="dossier-empty">Nessun documento di costo registrato.</p> : <ul className="dossier-list">{documentiCosti.slice().sort((left, right) => (parseDateFlexible(right.data ?? null)?.getTime() ?? 0) - (parseDateFlexible(left.data ?? null)?.getTime() ?? 0)).slice(0, 5).map((item) => <li key={item.id} className="dossier-list-item"><div className="dossier-list-main"><span className={item.tipo === "FATTURA" ? "dossier-badge badge-danger" : "dossier-badge badge-info"}>{item.tipo}</span><strong>{item.descrizione || "-"}</strong></div><div className="dossier-list-meta"><span>{item.data || "-"}</span><span>{typeof item.importo === "number" ? `${item.importo.toFixed(2)} ${resolveCurrency(item)}` : "Importo n/d"}</span><span>{item.fornitoreLabel || "-"}</span></div></li>)}</ul>}</div></section>

        <section className="dossier-card dossier-card-full"><div className="dossier-card-header"><h2>Analisi IA</h2>{updatedAtLabel ? <div className="dossier-chip">Ultimo aggiornamento IA: <strong>{updatedAtLabel}</strong></div> : null}</div><div className="dossier-card-body">{documentiCosti.length === 0 ? <p className="dossier-empty">Carica prima alcuni preventivi o fatture per questo mezzo.</p> : !analisiIA ? <p className="dossier-empty">Nessuna analisi IA salvata. Usa "Rigenera analisi IA" per creare la versione clone-only.</p> : <div className="dossier-ia-blocks">{analisiIA.riepilogoBreve ? <div className="dossier-ia-block"><h3>Riepilogo</h3><p>{analisiIA.riepilogoBreve}</p></div> : null}{analisiIA.analisiCosti ? <div className="dossier-ia-block"><h3>Analisi costi</h3><p>{analisiIA.analisiCosti}</p></div> : null}{analisiIA.fornitoriNotevoli ? <div className="dossier-ia-block"><h3>Fornitori da tenere d'occhio</h3><p>{analisiIA.fornitoriNotevoli}</p></div> : null}{analisiIA.anomalie ? <div className="dossier-ia-block"><h3>Anomalie / punti di attenzione</h3><p>{analisiIA.anomalie}</p></div> : null}</div>}</div></section>
      </div>

      <PdfPreviewModal open={pdfOpen} title={pdfTitle} pdfUrl={pdfUrl} fileName={pdfFileName} hint={pdfHint} onClose={closePdf} onShare={async () => {
        if (!pdfBlob) {
          setPdfHint((await copyTextToClipboard(buildShareMessage())) ? "Link copiato." : "Apri prima un'anteprima PDF.");
          return;
        }
        const result = await sharePdfFile({ blob: pdfBlob, fileName: pdfFileName, title: pdfTitle, text: buildShareMessage() });
        if (result.status === "shared") setPdfHint("PDF condiviso.");
        else if (result.status !== "aborted") setPdfHint((await copyTextToClipboard(buildShareMessage())) ? "Condivisione non disponibile: testo copiato." : "Condivisione non disponibile.");
      }} onCopyLink={async () => setPdfHint((await copyTextToClipboard(buildShareMessage())) ? "Testo copiato." : "Copia non disponibile.")} onWhatsApp={() => window.open(buildWhatsAppShareUrl(buildShareMessage()), "_blank", "noopener,noreferrer")} />
    </div>
  );
}
