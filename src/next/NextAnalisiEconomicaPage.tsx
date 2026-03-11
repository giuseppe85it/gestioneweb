import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PdfPreviewModal from "../components/PdfPreviewModal";
import { formatDateTimeUI } from "../utils/dateFormat";
import { generateAnalisiEconomicaPDFBlob } from "../utils/pdfEngine";
import {
  buildPdfShareText,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../utils/pdfPreview";
import NextGommeEconomiaSection from "./NextGommeEconomiaSection";
import NextRifornimentiEconomiaSection from "./NextRifornimentiEconomiaSection";
import {
  buildNextAnalisiEconomicaLegacyView,
  readNextDossierMezzoCompositeSnapshot,
  type NextDossierAnalisiEconomicaSavedRecord,
  type NextDossierFatturaPreventivoLegacyItem,
  type NextDossierMezzoIdentity,
} from "./domain/nextDossierMezzoDomain";
import type { NextDocumentiCostiCurrency } from "./domain/nextDocumentiCostiDomain";
import "../pages/DossierMezzo.css";
import "./next-shell.css";

type Currency = NextDocumentiCostiCurrency;
type Mezzo = NextDossierMezzoIdentity;
type FatturaPreventivo = NextDossierFatturaPreventivoLegacyItem;
type AnalisiEconomicaIA = NextDossierAnalisiEconomicaSavedRecord;

type FornitoreAggregato = {
  nome: string;
  totaleCHF: number;
  totaleEUR: number;
  unknownCount: number;
  numeroDocumenti: number;
};

function renderAmountWithCurrency(value: number | undefined, currency: Currency) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Importo n/d";

  if (currency === "UNKNOWN") {
    return (
      <>
        {value.toFixed(2)}
        <span className="dossier-badge badge-info" style={{ marginLeft: "6px" }}>
          VALUTA DA VERIFICARE
        </span>
      </>
    );
  }

  return `${value.toFixed(2)} ${currency}`;
}

export default function NextAnalisiEconomicaPage() {
  const { targa } = useParams<{ targa: string }>();
  const navigate = useNavigate();

  const [mezzo, setMezzo] = useState<Mezzo | null>(null);
  const [documentiCosti, setDocumentiCosti] = useState<FatturaPreventivo[]>([]);
  const [analisiIA, setAnalisiIA] = useState<AnalisiEconomicaIA | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState("analisi-economica.pdf");
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Anteprima PDF analisi economica");
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);

  const formatFileDate = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const handleBack = () => {
    if (!targa) {
      navigate("/next/mezzi-dossier");
      return;
    }

    navigate(`/next/mezzi-dossier/${encodeURIComponent(targa)}`);
  };

  const closePdfPreview = () => {
    revokePdfPreviewUrl(pdfPreviewUrl);
    setPdfPreviewOpen(false);
    setPdfPreviewUrl(null);
    setPdfPreviewBlob(null);
    setPdfShareHint(null);
  };

  const buildPdfShareMessage = () =>
    buildPdfShareText({
      contextLabel: `Analisi economica ${mezzo?.targa || targa || ""}`.trim(),
      dateLabel: formatFileDate(),
      fileName: pdfPreviewFileName || "analisi-economica.pdf",
      url: pdfPreviewUrl,
    });

  const handleSharePDF = async () => {
    if (!pdfPreviewBlob) {
      const copied = await copyTextToClipboard(buildPdfShareMessage());
      setPdfShareHint(copied ? "Link copiato." : "Apri prima un'anteprima PDF.");
      return;
    }

    const result = await sharePdfFile({
      blob: pdfPreviewBlob,
      fileName: pdfPreviewFileName || "analisi-economica.pdf",
      title: pdfPreviewTitle || "Anteprima PDF analisi economica",
      text: buildPdfShareMessage(),
    });

    if (result.status === "shared") {
      setPdfShareHint("PDF condiviso.");
      return;
    }

    if (result.status === "aborted") return;

    const copied = await copyTextToClipboard(buildPdfShareMessage());
    setPdfShareHint(copied ? "Condivisione non disponibile: testo copiato." : "Condivisione non disponibile.");
  };

  const handleCopyPDFText = async () => {
    const copied = await copyTextToClipboard(buildPdfShareMessage());
    setPdfShareHint(copied ? "Testo copiato." : "Copia non disponibile.");
  };

  const handleWhatsAppPDF = () => {
    window.open(buildWhatsAppShareUrl(buildPdfShareMessage()), "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    return () => {
      revokePdfPreviewUrl(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

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
        setError(null);
        const snapshot = await readNextDossierMezzoCompositeSnapshot(targa);

        if (cancelled) return;

        if (!snapshot) {
          setMezzo(null);
          setDocumentiCosti([]);
          setAnalisiIA(null);
          setLoading(false);
          return;
        }

        const view = buildNextAnalisiEconomicaLegacyView(snapshot);
        setMezzo(view.mezzo);
        setDocumentiCosti(view.documentiCosti);
        setAnalisiIA(view.analisiIA);
        setLoading(false);
      } catch (loadError: any) {
        console.error("Errore caricamento AnalisiEconomica NEXT:", loadError);
        if (cancelled) return;
        setError(loadError?.message || "Errore durante il caricamento dei dati.");
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [targa]);

  const {
    totalePreventiviCHF,
    totalePreventiviEUR,
    totaleFattureCHF,
    totaleFattureEUR,
    totaleStoricoCHF,
    totaleStoricoEUR,
    totaleAnnoCorrenteCHF,
    totaleAnnoCorrenteEUR,
    valutaDaVerificare,
  } = useMemo(() => {
    const preventiviList = documentiCosti
      .filter((entry) => entry.tipo === "PREVENTIVO")
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    const fattureList = documentiCosti
      .filter((entry) => entry.tipo === "FATTURA")
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

    let totalePreventiviCHFValue = 0;
    let totalePreventiviEURValue = 0;
    let totaleFattureCHFValue = 0;
    let totaleFattureEURValue = 0;
    let totaleStoricoCHFValue = 0;
    let totaleStoricoEURValue = 0;
    let totaleAnnoCorrenteCHFValue = 0;
    let totaleAnnoCorrenteEURValue = 0;
    let valutaDaVerificareValue = 0;
    const nowYear = new Date().getFullYear();

    for (const entry of documentiCosti) {
      if (typeof entry.importo !== "number" || Number.isNaN(entry.importo)) continue;

      const currency = entry.valuta ?? "UNKNOWN";
      if (currency === "UNKNOWN") {
        valutaDaVerificareValue += 1;
        continue;
      }

      if (currency === "CHF") totaleStoricoCHFValue += entry.importo;
      else totaleStoricoEURValue += entry.importo;

      const ts = entry.timestamp ?? 0;
      if (ts) {
        const year = new Date(ts).getFullYear();
        if (year === nowYear) {
          if (currency === "CHF") totaleAnnoCorrenteCHFValue += entry.importo;
          else totaleAnnoCorrenteEURValue += entry.importo;
        }
      }

      if (entry.tipo === "PREVENTIVO") {
        if (currency === "CHF") totalePreventiviCHFValue += entry.importo;
        else totalePreventiviEURValue += entry.importo;
      } else if (currency === "CHF") {
        totaleFattureCHFValue += entry.importo;
      } else {
        totaleFattureEURValue += entry.importo;
      }
    }

    return {
      preventivi: preventiviList,
      fatture: fattureList,
      totalePreventiviCHF: totalePreventiviCHFValue,
      totalePreventiviEUR: totalePreventiviEURValue,
      totaleFattureCHF: totaleFattureCHFValue,
      totaleFattureEUR: totaleFattureEURValue,
      totaleStoricoCHF: totaleStoricoCHFValue,
      totaleStoricoEUR: totaleStoricoEURValue,
      totaleAnnoCorrenteCHF: totaleAnnoCorrenteCHFValue,
      totaleAnnoCorrenteEUR: totaleAnnoCorrenteEURValue,
      valutaDaVerificare: valutaDaVerificareValue,
    };
  }, [documentiCosti]);

  const fornitoriAggregati: FornitoreAggregato[] = useMemo(() => {
    const bySupplier = new Map<string, { chf: number; eur: number; unknown: number; count: number }>();

    for (const entry of documentiCosti) {
      const nome = entry.fornitoreLabel || "Senza fornitore";
      const importo = typeof entry.importo === "number" && !Number.isNaN(entry.importo) ? entry.importo : null;
      const currency = entry.valuta ?? "UNKNOWN";
      const current = bySupplier.get(nome) || { chf: 0, eur: 0, unknown: 0, count: 0 };

      if (importo != null) {
        if (currency === "CHF") current.chf += importo;
        else if (currency === "EUR") current.eur += importo;
        else current.unknown += 1;
      }

      current.count += 1;
      bySupplier.set(nome, current);
    }

    return Array.from(bySupplier.entries())
      .map(([nome, totals]) => ({
        nome,
        totaleCHF: totals.chf,
        totaleEUR: totals.eur,
        unknownCount: totals.unknown,
        numeroDocumenti: totals.count,
      }))
      .sort((a, b) => b.totaleCHF + b.totaleEUR - (a.totaleCHF + a.totaleEUR));
  }, [documentiCosti]);

  const handleExportPdf = async () => {
    const hasAnalisi =
      !!analisiIA?.analisiCosti ||
      !!analisiIA?.riepilogoBreve ||
      !!analisiIA?.anomalie ||
      !!analisiIA?.fornitoriNotevoli;

    if (!hasAnalisi) {
      alert("Nessuna analisi disponibile");
      return;
    }

    const sezioni: Array<{
      title: string;
      text?: string;
      columns?: string[];
      rows?: string[][];
    }> = [];

    const riepilogoRows: string[][] = [
      ["Totale storico CHF", `${totaleStoricoCHF.toFixed(2)} CHF`],
      ["Totale storico EUR", `${totaleStoricoEUR.toFixed(2)} EUR`],
      ["Totale anno corrente CHF", `${totaleAnnoCorrenteCHF.toFixed(2)} CHF`],
      ["Totale anno corrente EUR", `${totaleAnnoCorrenteEUR.toFixed(2)} EUR`],
      ["Totale preventivi CHF", `${totalePreventiviCHF.toFixed(2)} CHF`],
      ["Totale preventivi EUR", `${totalePreventiviEUR.toFixed(2)} EUR`],
      ["Totale fatture CHF", `${totaleFattureCHF.toFixed(2)} CHF`],
      ["Totale fatture EUR", `${totaleFattureEUR.toFixed(2)} EUR`],
    ];

    if (valutaDaVerificare > 0) {
      riepilogoRows.push(["Valuta da verificare", String(valutaDaVerificare)]);
    }

    sezioni.push({
      title: "Riepilogo costi",
      columns: ["Voce", "Valore"],
      rows: riepilogoRows,
    });

    if (fornitoriAggregati.length > 0) {
      sezioni.push({
        title: "Fornitori",
        columns: ["Fornitore", "Totale CHF", "Totale EUR", "Valuta n/d", "Documenti"],
        rows: fornitoriAggregati.map((entry) => [
          entry.nome,
          `${entry.totaleCHF.toFixed(2)} CHF`,
          `${entry.totaleEUR.toFixed(2)} EUR`,
          String(entry.unknownCount),
          String(entry.numeroDocumenti),
        ]),
      });
    }

    if (analisiIA?.riepilogoBreve && analisiIA?.analisiCosti) {
      sezioni.push({ title: "Riepilogo", text: analisiIA.riepilogoBreve });
    }
    if (analisiIA?.fornitoriNotevoli) {
      sezioni.push({ title: "Fornitori da tenere d'occhio", text: analisiIA.fornitoriNotevoli });
    }
    if (analisiIA?.anomalie) {
      sezioni.push({ title: "Anomalie / punti di attenzione", text: analisiIA.anomalie });
    }

    const testoPrincipale = analisiIA?.analisiCosti || analisiIA?.riepilogoBreve || "";

    try {
      const fileDate = formatFileDate();
      const targaLabel = mezzo?.targa ?? targa ?? "mezzo";
      const preview = await openPreview({
        source: async () =>
          generateAnalisiEconomicaPDFBlob({
            targa: mezzo?.targa ?? targa ?? "",
            mezzoInfo: mezzo,
            testoAnalisi: testoPrincipale,
            sezioniOpzionali: sezioni,
          }),
        fileName: `analisi-economica-${targaLabel}-${fileDate}.pdf`,
        previousUrl: pdfPreviewUrl,
      });

      setPdfShareHint(null);
      setPdfPreviewBlob(preview.blob);
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewTitle(`Anteprima PDF analisi economica ${targaLabel}`);
      setPdfPreviewUrl(preview.url);
      setPdfPreviewOpen(true);
    } catch (previewError) {
      console.error("Errore anteprima PDF analisi economica:", previewError);
      alert("Impossibile generare l'anteprima PDF.");
    }
  };

  if (loading) {
    return (
      <div className="dossier-wrapper">
        <div className="dossier-loading">Caricamento analisi economica in corso...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dossier-wrapper">
        <div className="dossier-error">
          <p>{error}</p>
          <button className="dossier-button" type="button" onClick={handleBack}>
            Torna al dossier
          </button>
        </div>
      </div>
    );
  }

  if (!mezzo) {
    return (
      <div className="dossier-wrapper">
        <div className="dossier-error">
          <p>Nessun mezzo trovato per la targa: {targa}</p>
          <button className="dossier-button" type="button" onClick={handleBack}>
            Torna al dossier
          </button>
        </div>
      </div>
    );
  }

  const updatedAtLabel =
    analisiIA?.updatedAtTimestamp != null
      ? formatDateTimeUI(analisiIA.updatedAtTimestamp)
      : "";

  return (
    <div className="dossier-wrapper">
      <div className="dossier-header-bar">
        <button className="dossier-button ghost" type="button" onClick={handleBack}>
          Dossier
        </button>

        <div className="dossier-header-center">
          <img src="/logo.png" alt="Logo" className="dossier-logo" />
          <div className="dossier-header-text">
            <span className="dossier-header-label">ANALISI ECONOMICA</span>
            <h1 className="dossier-header-title">
              {mezzo.marca} {mezzo.modello} - {mezzo.targa}
            </h1>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button className="dossier-button" type="button" onClick={handleExportPdf}>
            Anteprima PDF
          </button>
          <button
            className="dossier-button primary next-clone-button-disabled"
            type="button"
            disabled
            title="Clone read-only: rigenerazione IA bloccata"
          >
            Rigenera analisi IA
          </button>
        </div>
      </div>

      <div className="dossier-grid">
        <section className="dossier-card">
          <div className="dossier-card-header">
            <h2>Riepilogo costi</h2>
          </div>
          <div className="dossier-card-body">
            <ul className="dossier-list">
              <li className="dossier-list-item">
                <div className="dossier-list-main">
                  <strong>Totale storico (preventivi + fatture)</strong>
                </div>
                <div className="dossier-list-meta">
                  <span>CHF {totaleStoricoCHF.toFixed(2)}</span>
                  <span>EUR {totaleStoricoEUR.toFixed(2)}</span>
                </div>
              </li>
              <li className="dossier-list-item">
                <div className="dossier-list-main">
                  <strong>Totale anno corrente (tutti i documenti)</strong>
                </div>
                <div className="dossier-list-meta">
                  <span>CHF {totaleAnnoCorrenteCHF.toFixed(2)}</span>
                  <span>EUR {totaleAnnoCorrenteEUR.toFixed(2)}</span>
                </div>
              </li>
              <li className="dossier-list-item">
                <div className="dossier-list-main">
                  <strong>Totale preventivi</strong>
                </div>
                <div className="dossier-list-meta">
                  <span>CHF {totalePreventiviCHF.toFixed(2)}</span>
                  <span>EUR {totalePreventiviEUR.toFixed(2)}</span>
                </div>
              </li>
              <li className="dossier-list-item">
                <div className="dossier-list-main">
                  <strong>Totale fatture</strong>
                </div>
                <div className="dossier-list-meta">
                  <span>CHF {totaleFattureCHF.toFixed(2)}</span>
                  <span>EUR {totaleFattureEUR.toFixed(2)}</span>
                </div>
              </li>
              {valutaDaVerificare > 0 ? (
                <li className="dossier-list-item">
                  <div className="dossier-list-main">
                    <strong>Valuta da verificare</strong>
                  </div>
                  <div className="dossier-list-meta">
                    <span className="dossier-badge badge-info">{valutaDaVerificare}</span>
                  </div>
                </li>
              ) : null}
            </ul>
          </div>
        </section>

        {targa ? <NextGommeEconomiaSection targa={targa} /> : null}
        {targa ? <NextRifornimentiEconomiaSection targa={targa} /> : null}

        <section className="dossier-card">
          <div className="dossier-card-header">
            <h2>Fornitori</h2>
          </div>
          <div className="dossier-card-body">
            {fornitoriAggregati.length === 0 ? (
              <p className="dossier-empty">Nessun documento di costo per questo mezzo.</p>
            ) : (
              <div className="dossier-table-wrapper">
                <table className="dossier-table">
                  <thead>
                    <tr>
                      <th>Fornitore</th>
                      <th>Totale CHF</th>
                      <th>Totale EUR</th>
                      <th>Valuta n/d</th>
                      <th>Documenti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fornitoriAggregati.map((entry) => (
                      <tr key={entry.nome}>
                        <td>{entry.nome}</td>
                        <td>{entry.totaleCHF.toFixed(2)} CHF</td>
                        <td>{entry.totaleEUR.toFixed(2)} EUR</td>
                        <td>{entry.unknownCount}</td>
                        <td>{entry.numeroDocumenti}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="dossier-card">
          <div className="dossier-card-header">
            <h2>Documenti recenti</h2>
          </div>
          <div className="dossier-card-body">
            {documentiCosti.length === 0 ? (
              <p className="dossier-empty">Nessun documento di costo registrato.</p>
            ) : (
              <ul className="dossier-list">
                {documentiCosti
                  .slice()
                  .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
                  .slice(0, 5)
                  .map((entry) => (
                    <li key={entry.id} className="dossier-list-item">
                      <div className="dossier-list-main">
                        <span
                          className={
                            entry.tipo === "FATTURA"
                              ? "dossier-badge badge-danger"
                              : "dossier-badge badge-info"
                          }
                        >
                          {entry.tipo}
                        </span>
                        <strong>{entry.descrizione || "-"}</strong>
                      </div>
                      <div className="dossier-list-meta">
                        <span>{entry.data || "-"}</span>
                        <span>
                          {renderAmountWithCurrency(
                            entry.importo,
                            entry.valuta ?? "UNKNOWN"
                          )}
                        </span>
                        <span>{entry.fornitoreLabel || "-"}</span>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </section>

        <section className="dossier-card dossier-card-full">
          <div className="dossier-card-header">
            <h2>Analisi IA</h2>
            {updatedAtLabel ? (
              <div className="dossier-chip">
                Ultimo aggiornamento IA: <strong>{updatedAtLabel}</strong>
              </div>
            ) : null}
          </div>
          <div className="dossier-card-body">
            {documentiCosti.length === 0 ? (
              <p className="dossier-empty">Carica prima alcuni preventivi/fatture per questo mezzo.</p>
            ) : !analisiIA ? (
              <p className="dossier-empty">
                Nessuna analisi IA salvata. Nel clone read-only la rigenerazione resta bloccata.
              </p>
            ) : (
              <div className="dossier-ia-blocks">
                {analisiIA.riepilogoBreve ? (
                  <div className="dossier-ia-block">
                    <h3>Riepilogo</h3>
                    <p>{analisiIA.riepilogoBreve}</p>
                  </div>
                ) : null}

                {analisiIA.analisiCosti ? (
                  <div className="dossier-ia-block">
                    <h3>Analisi costi</h3>
                    <p>{analisiIA.analisiCosti}</p>
                  </div>
                ) : null}

                {analisiIA.fornitoriNotevoli ? (
                  <div className="dossier-ia-block">
                    <h3>Fornitori da tenere d'occhio</h3>
                    <p>{analisiIA.fornitoriNotevoli}</p>
                  </div>
                ) : null}

                {analisiIA.anomalie ? (
                  <div className="dossier-ia-block">
                    <h3>Anomalie / punti di attenzione</h3>
                    <p>{analisiIA.anomalie}</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </div>

      <PdfPreviewModal
        open={pdfPreviewOpen}
        title={pdfPreviewTitle}
        pdfUrl={pdfPreviewUrl}
        fileName={pdfPreviewFileName}
        hint={pdfShareHint}
        onClose={closePdfPreview}
        onShare={handleSharePDF}
        onCopyLink={handleCopyPDFText}
        onWhatsApp={handleWhatsAppPDF}
      />
    </div>
  );
}
