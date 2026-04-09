import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PdfPreviewModal from "../components/PdfPreviewModal";
import { formatDateTimeUI, formatDateUI } from "./nextDateFormat";
import { generateDossierMezzoPDFBlob } from "../utils/pdfEngine";
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
import {
  buildNextDossierMezzoLegacyView,
  readNextDossierMezzoCompositeSnapshot,
  type NextDossierFatturaPreventivoLegacyItem,
  type NextDossierManutenzioneLegacyItem,
  type NextDossierMezzoLegacyViewState,
} from "./domain/nextDossierMezzoDomain";
import {
  buildNextAnalisiEconomicaPath,
  buildNextDossierGommePath,
  buildNextDossierRifornimentiPath,
  NEXT_DETTAGLIO_LAVORI_PATH,
  NEXT_DOSSIER_LISTA_PATH,
  NEXT_IA_LIBRETTO_PATH,
} from "./nextStructuralPaths";

type Currency = "EUR" | "CHF" | "UNKNOWN";

const CLONE_READ_ONLY_PREVENTIVO_DELETE_MESSAGE =
  "Clone read-only: eliminazione preventivo non disponibile.";

function readErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function parseDateFlexible(value: string | number | null | undefined): Date | null {
  if (!value) return null;
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
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

function formatDateTime(value: string | number | null | undefined) {
  return formatDateTimeUI(parseDateFlexible(value));
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

function renderAmount(value: number | undefined, currency: Currency) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Importo n/d";
  return currency === "UNKNOWN" ? `${value.toFixed(2)} (valuta da verificare)` : `${value.toFixed(2)} ${currency}`;
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

function formatKmOre(item: NextDossierManutenzioneLegacyItem) {
  const parts: string[] = [];
  if (typeof item.km === "number" && Number.isFinite(item.km)) parts.push(`${item.km} km`);
  if (typeof item.ore === "number" && Number.isFinite(item.ore)) parts.push(`${item.ore} ore`);
  return parts.join(" | ") || "-";
}

function formatGommePerAsseMeta(item: NextDossierMezzoLegacyViewState["gommePerAsse"][number]) {
  const parts: string[] = [];
  parts.push(item.dataCambio ? `Cambio ${item.dataCambio}` : "Data cambio n/d");
  if (item.isMotorizzato) {
    parts.push(
      typeof item.kmCambio === "number" && Number.isFinite(item.kmCambio)
        ? `${item.kmCambio} km`
        : "km cambio n/d",
    );
    if (typeof item.kmPercorsi === "number" && Number.isFinite(item.kmPercorsi)) {
      parts.push(`Percorsi ${item.kmPercorsi} km`);
    }
  }
  return parts.join(" | ");
}

function formatGommeStraordinarieMeta(
  item: NextDossierMezzoLegacyViewState["gommeStraordinarie"][number],
) {
  const parts: string[] = [];
  parts.push(item.dataLabel || "-");
  if (item.asseLabel) parts.push(item.asseLabel);
  if (typeof item.quantita === "number" && Number.isFinite(item.quantita)) {
    parts.push(`${item.quantita} gomma${item.quantita === 1 ? "" : "e"}`);
  }
  if (item.fornitore) parts.push(item.fornitore);
  return parts.join(" | ");
}

export default function NextDossierMezzoPage() {
  const { targa } = useParams<{ targa: string }>();
  const navigate = useNavigate();
  const [legacy, setLegacy] = useState<NextDossierMezzoLegacyViewState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "attesa" | "eseguiti" | "manutenzioni" | "libretto" | "foto">(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfFileName, setPdfFileName] = useState("dossier-mezzo.pdf");
  const [pdfTitle, setPdfTitle] = useState("Anteprima PDF dossier mezzo");
  const [pdfHint, setPdfHint] = useState<string | null>(null);
  const [pdfContext, setPdfContext] = useState("Dossier mezzo");

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
        setLegacy(buildNextDossierMezzoLegacyView(nextSnapshot));
        setError(null);
        setLoading(false);
      } catch (loadError) {
        if (cancelled) return;
        setError(readErrorMessage(loadError, "Errore caricamento dossier mezzo clone."));
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

  const mezzo = legacy?.mezzo ?? null;
  const docs = useMemo(() => legacy?.documentiCosti ?? [], [legacy]);
  const preventivi = useMemo(() => docs.filter((item) => item.tipo === "PREVENTIVO"), [docs]);
  const fatture = useMemo(() => docs.filter((item) => item.tipo === "FATTURA"), [docs]);
  const preventiviTotals = useMemo(() => buildTotals(preventivi), [preventivi]);
  const fattureTotals = useMemo(() => buildTotals(fatture), [fatture]);

  const closePdf = () => {
    revokePdfPreviewUrl(pdfUrl);
    setPdfOpen(false);
    setPdfUrl(null);
    setPdfBlob(null);
    setPdfHint(null);
  };

  const buildShareMessage = () =>
    buildPdfShareText({
      contextLabel: pdfContext,
      dateLabel: formatDateUI(new Date()),
      fileName: pdfFileName,
      url: pdfUrl,
    });

  const onSharePdf = async () => {
    if (!pdfBlob) {
      const copied = await copyTextToClipboard(buildShareMessage());
      setPdfHint(copied ? "Link copiato." : "Apri prima un'anteprima PDF.");
      return;
    }
    const result = await sharePdfFile({
      blob: pdfBlob,
      fileName: pdfFileName,
      title: pdfTitle,
      text: buildShareMessage(),
    });
    if (result.status === "shared") {
      setPdfHint("PDF condiviso.");
      return;
    }
    if (result.status !== "aborted") {
      const copied = await copyTextToClipboard(buildShareMessage());
      setPdfHint(copied ? "Condivisione non disponibile: testo copiato." : "Condivisione non disponibile.");
    }
  };

  const openDocumentPdf = (url: string, title: string, fileName: string) => {
    revokePdfPreviewUrl(pdfUrl);
    setPdfBlob(null);
    setPdfUrl(url);
    setPdfOpen(true);
    setPdfTitle(title);
    setPdfFileName(fileName);
    setPdfContext(title);
    setPdfHint(null);
  };

  const openDossierPdf = async () => {
    if (!legacy || !mezzo) return;
    try {
      const preview = await openPreview({
        source: async () =>
          generateDossierMezzoPDFBlob({
            mezzo,
            mezzoFotoUrl: mezzo.fotoUrl ?? null,
            mezzoFotoStoragePath: mezzo.fotoStoragePath ?? mezzo.fotoPath ?? null,
            lavoriDaEseguire: legacy.lavoriDaEseguire,
            lavoriInAttesa: legacy.lavoriInAttesa,
            lavoriEseguiti: legacy.lavoriEseguiti,
            rifornimenti: legacy.rifornimenti,
            segnalazioni: [],
            controlli: [],
            targa: mezzo.targa,
          }),
      });
      revokePdfPreviewUrl(pdfUrl);
      setPdfBlob(preview.blob);
      setPdfUrl(preview.url);
      setPdfOpen(true);
      setPdfFileName(preview.fileName);
      setPdfTitle(`Anteprima PDF dossier ${mezzo.targa}`);
      setPdfContext(`Dossier mezzo ${mezzo.targa}`);
      setPdfHint(null);
    } catch (previewError) {
      window.alert(readErrorMessage(previewError, "Errore generazione anteprima PDF."));
    }
  };

  const blockPreventivoDelete = () => {
    window.alert(CLONE_READ_ONLY_PREVENTIVO_DELETE_MESSAGE);
  };

  const openLavoro = (id: string) => navigate(`${NEXT_DETTAGLIO_LAVORI_PATH}/${encodeURIComponent(id)}`);
  const back = () => navigate(NEXT_DOSSIER_LISTA_PATH);

  if (loading) {
    return <div className="dossier-wrapper"><div className="dossier-card dossier-card-full"><div className="dossier-card-body"><div className="dossier-empty">Caricamento dossier mezzo...</div></div></div></div>;
  }

  if (error || !legacy || !mezzo) {
    return <div className="dossier-wrapper"><div className="dossier-card dossier-card-full"><div className="dossier-card-body"><div className="dossier-empty">{error || "Dossier non disponibile."}</div><button className="dossier-button" type="button" onClick={back} style={{ marginTop: 12 }}>Torna a Dossier Mezzi</button></div></div></div>;
  }

  const librettoUrl = String(mezzo.librettoUrl ?? "").trim();
  const headerTitle = `${mezzo.marca || "-"} ${mezzo.modello || "-"}`.trim();
  const lavoriLists = {
    attesa: legacy.lavoriInAttesa,
    eseguiti: legacy.lavoriEseguiti,
    manutenzioni: legacy.manutenzioni,
  } as const;

  const renderDocList = (items: NextDossierFatturaPreventivoLegacyItem[], kind: "preventivo" | "fattura") => (
    items.length === 0 ? <p className="dossier-empty">{kind === "preventivo" ? "Nessun preventivo registrato." : "Nessuna fattura registrata."}</p> : (
      <ul className="dossier-list">
        {items.map((item) => (
          <li key={item.id} className="dossier-list-item">
            <div className="dossier-list-main">
              <span className={`dossier-badge ${kind === "preventivo" ? "badge-info" : "badge-danger"}`}>{item.tipo}</span>
              <strong>{item.descrizione || "-"}</strong>
            </div>
            <div className="dossier-list-meta">
              <span>{item.data || "-"}</span>
              <span>{renderAmount(item.importo, resolveCurrency(item))}</span>
              <span>{item.fornitoreLabel || "-"}</span>
              {item.fileUrl ? <button className="dossier-button" type="button" onClick={() => openDocumentPdf(item.fileUrl!, `Anteprima PDF ${kind}`, `${kind}-${item.id}.pdf`)}>Anteprima PDF</button> : null}
              {kind === "preventivo" ? <button className="dossier-button" type="button" onClick={blockPreventivoDelete}>Elimina</button> : null}
            </div>
          </li>
        ))}
      </ul>
    )
  );

  return (
    <div className="dossier-wrapper">
      {modal === "libretto" ? (
        <div className="dossier-modal-overlay"><div className="dossier-modal" style={{ maxWidth: 960 }}><div className="dossier-modal-header"><h2>Libretto - {mezzo.targa}</h2><button className="dossier-button" type="button" onClick={() => setModal(null)}>Chiudi</button></div><div className="dossier-modal-body">{librettoUrl ? <div style={{ display: "grid", gap: 12 }}><img src={librettoUrl} alt={`Libretto ${mezzo.targa}`} style={{ width: "100%", borderRadius: 12 }} /><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="dossier-button" type="button" onClick={() => navigate(`${NEXT_IA_LIBRETTO_PATH}?archive=1&targa=${encodeURIComponent(mezzo.targa)}`)}>Vai a IA Libretto</button><button className="dossier-button" type="button" onClick={() => window.open(librettoUrl, "_blank", "noopener,noreferrer")}>Apri file</button></div></div> : <p className="dossier-empty">Nessun libretto disponibile per questo mezzo.</p>}</div></div></div>
      ) : null}
      {modal === "foto" && mezzo.fotoUrl ? (
        <div className="dossier-modal-overlay" onClick={() => setModal(null)}><div className="dossier-modal" style={{ maxWidth: 920 }} onClick={(event) => event.stopPropagation()}><div className="dossier-modal-header"><h2>Foto mezzo</h2><button className="dossier-button" type="button" onClick={() => setModal(null)}>Chiudi</button></div><div className="dossier-modal-body"><img src={mezzo.fotoUrl} alt={mezzo.targa} className="dossier-photo-modal-img" /></div></div></div>
      ) : null}

      <div className="dossier-header-bar">
        <button className="dossier-button ghost" type="button" onClick={back}>Mezzi</button>
        <div className="dossier-header-center"><img src="/logo.png" alt="Logo" className="dossier-logo" /><div className="dossier-header-text"><span className="dossier-header-label">DOSSIER MEZZO</span><h1 className="dossier-header-title">{headerTitle} - {mezzo.targa}</h1></div></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button className="dossier-button" type="button" onClick={() => navigate(buildNextAnalisiEconomicaPath(mezzo.targa))}>Analisi Economica</button>
          <button className="dossier-button" type="button" onClick={() => navigate(buildNextDossierGommePath(mezzo.targa))}>Gomme</button>
          <button className="dossier-button" type="button" onClick={() => navigate(buildNextDossierRifornimentiPath(mezzo.targa))}>Rifornimenti (dettaglio)</button>
          <button className="dossier-button" type="button" onClick={() => setModal("libretto")}>LIBRETTO</button>
          <button className="dossier-button primary" type="button" onClick={openDossierPdf}>Anteprima PDF</button>
        </div>
      </div>

      <div className="dossier-grid">
        <section className="dossier-card dossier-card-large"><div className="dossier-card-header"><h2>Dati tecnici</h2></div><div className="dossier-card-body dossier-tech-grid">
          {[{ title: "Identificazione", rows: [["Proprietario", mezzo.proprietario], ["Targa", mezzo.targa], ["Autista abituale", mezzo.autistaNome], ["Telaio / VIN", mezzo.telaio], ["Assicurazione", mezzo.assicurazione]] }, { title: "Caratteristiche", rows: [["Marca", mezzo.marca], ["Modello", mezzo.modello], ["Categoria", mezzo.categoria], ["Colore", mezzo.colore]] }, { title: "Motore e massa", rows: [["Cilindrata", mezzo.cilindrata], ["Potenza", mezzo.potenza], ["Massa complessiva", mezzo.massaComplessiva], ["Anno", mezzo.anno]] }, { title: "Scadenze", rows: [["Immatricolazione", formatDateUI(parseDateFlexible(mezzo.dataImmatricolazione))], ["Revisione", formatDateUI(parseDateFlexible(mezzo.dataScadenzaRevisione))], ["Note", mezzo.note], ["Manutenzione programmata", mezzo.manutenzioneProgrammata ? "ATTIVA" : "NON ATTIVA"], ...(mezzo.manutenzioneProgrammata ? [["Contratto", mezzo.manutenzioneContratto], ["Periodo", `${formatDateUI(parseDateFlexible(mezzo.manutenzioneDataInizio))} - ${formatDateUI(parseDateFlexible(mezzo.manutenzioneDataFine))}`], ["KM massimi", mezzo.manutenzioneKmMax]] : [])] }].map((block) => (
            <div key={block.title} className="dossier-tech-block"><h3>{block.title}</h3><ul>{block.rows.map(([label, value]) => <li key={label}><span>{label}</span><strong style={label === "Note" ? { whiteSpace: "pre-line" } : undefined}>{String(value || "-")}</strong></li>)}</ul></div>
          ))}
        </div></section>

        <section className="dossier-card dossier-photo-card"><div className="dossier-card-header"><h2>Foto mezzo</h2></div><div className="dossier-card-body dossier-photo-body">{mezzo.fotoUrl ? <div className="dossier-photo-thumb" role="button" tabIndex={0} onClick={() => setModal("foto")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setModal("foto"); } }}><div className="dossier-mezzo-photo-frame"><div className="dossier-mezzo-photo-bg" style={{ backgroundImage: `url(${mezzo.fotoUrl})` }} /><img src={mezzo.fotoUrl} alt={mezzo.targa} className="dossier-mezzo-photo" /></div></div> : <div className="dossier-photo-placeholder">Nessuna foto caricata</div>}</div></section>

        <section className="dossier-card"><div className="dossier-card-header"><h2>Lavori</h2></div><div className="dossier-card-body dossier-work-grid">
          {[{ title: "In attesa", items: legacy.lavoriInAttesa.slice(0, 3), badge: "badge-info", label: "IN ATTESA", modalKey: "attesa" as const }, { title: "Eseguiti", items: legacy.lavoriEseguiti.slice(0, 3), badge: "badge-success", label: "ESEGUITO", modalKey: "eseguiti" as const }].map((group) => (
            <div key={group.title}><h3>{group.title}</h3>{group.items.length === 0 ? <p className="dossier-empty">{group.title === "In attesa" ? "Nessun lavoro in attesa." : "Nessun lavoro eseguito."}</p> : <ul className="dossier-list">{group.items.map((item) => <li key={item.id} className="dossier-list-item" onClick={() => openLavoro(item.id)} style={{ cursor: "pointer" }}><div className="dossier-list-main"><span className={`dossier-badge ${group.badge}`}>{group.label}</span><strong>{item.descrizione}</strong></div><div className="dossier-list-meta"><span>{item.dettagli || "-"}</span><span>{item.dataInserimento || "-"}</span></div></li>)}</ul>}<button className="dossier-button" type="button" onClick={() => setModal(group.modalKey)} style={{ marginTop: 12 }}>Mostra tutti</button></div>
          ))}
        </div></section>

        <section className="dossier-card"><div className="dossier-card-header"><h2>Manutenzioni</h2><button className="dossier-button" type="button" onClick={() => setModal("manutenzioni")}>Mostra tutti</button></div><div className="dossier-card-body">{legacy.manutenzioni.slice(0, 5).length === 0 ? <p className="dossier-empty">Nessuna manutenzione registrata per questo mezzo.</p> : <ul className="dossier-list">{legacy.manutenzioni.slice(0, 5).map((item) => <li key={item.id} className="dossier-list-item"><div className="dossier-list-main"><strong>{item.descrizione || "-"}</strong></div><div className="dossier-list-meta"><span>{item.data || "-"}</span><span>{formatKmOre(item)}</span></div></li>)}</ul>}</div></section>

        <section className="dossier-card"><div className="dossier-card-header"><h2>Stato gomme per asse</h2></div><div className="dossier-card-body">{legacy.gommePerAsse.length === 0 ? <p className="dossier-empty">Nessun cambio gomme ordinario strutturato disponibile.</p> : <ul className="dossier-list">{legacy.gommePerAsse.map((item) => <li key={item.asseId} className="dossier-list-item"><div className="dossier-list-main"><strong>{item.asseLabel}</strong></div><div className="dossier-list-meta"><span>{formatGommePerAsseMeta(item)}</span></div></li>)}</ul>}</div></section>

        <section className="dossier-card"><div className="dossier-card-header"><h2>Eventi gomme straordinari</h2></div><div className="dossier-card-body">{legacy.gommeStraordinarie.length === 0 ? <p className="dossier-empty">Nessun evento gomme straordinario registrato.</p> : <ul className="dossier-list">{legacy.gommeStraordinarie.slice(0, 5).map((item) => <li key={item.sourceMaintenanceId} className="dossier-list-item"><div className="dossier-list-main"><strong>{item.motivo || "Evento gomme straordinario"}</strong></div><div className="dossier-list-meta"><span>{formatGommeStraordinarieMeta(item)}</span></div></li>)}</ul>}</div></section>

        <section className="dossier-card dossier-card-full"><div className="dossier-card-header"><h2>Materiali e movimenti inventario</h2></div><div className="dossier-card-body">{legacy.movimentiMateriali.length === 0 ? <p className="dossier-empty">Nessun movimento materiali registrato per questo mezzo.</p> : <div className="dossier-table-wrapper"><table className="dossier-table"><thead><tr><th>Data</th><th>Descrizione</th><th>Q.ta</th><th>Destinatario</th><th>Fornitore</th><th>Motivo</th><th>Costo</th></tr></thead><tbody>{legacy.movimentiMateriali.map((item) => <tr key={item.id}><td>{item.data || "-"}</td><td>{item.descrizione || item.materialeLabel || "-"}</td><td>{item.quantita ?? "-"} {item.unita ?? ""}</td><td>{item.destinatario?.label || "-"}</td><td>{item.fornitore || item.fornitoreLabel || "-"}</td><td>{item.motivo || "-"}</td><td>{item.costoTotale !== null && item.costoTotale !== undefined ? renderAmount(item.costoTotale, item.costoCurrency ?? "UNKNOWN") : "-"}</td></tr>)}</tbody></table></div>}</div></section>

        <section className="dossier-card"><div className="dossier-card-header"><h2>Rifornimenti</h2></div><div className="dossier-card-body">{legacy.rifornimenti.length === 0 ? <p className="dossier-empty">Nessun rifornimento registrato per questo mezzo.</p> : <div className="dossier-table-wrapper"><table className="dossier-table"><thead><tr><th>Data/Ora</th><th>Litri</th><th>Km</th><th>Tipo</th><th>Autista</th></tr></thead><tbody>{legacy.rifornimenti.map((item) => <tr key={item.id}><td>{formatDateTime(item.data)}</td><td>{item.litri ?? "-"}</td><td>{item.km ?? "-"}</td><td>{item.tipo ?? "-"}</td><td>{item.autistaNome ? `${item.autistaNome}${item.badgeAutista ? ` (${item.badgeAutista})` : ""}` : item.badgeAutista ?? "-"}</td></tr>)}</tbody></table></div>}</div></section>

        <section className="dossier-card"><div className="dossier-card-header"><h2>Preventivi</h2><div className="dossier-chip">Totale preventivi: <strong>CHF {preventiviTotals.chf.toFixed(2)}</strong><span style={{ marginLeft: 8 }}>EUR {preventiviTotals.eur.toFixed(2)}</span>{preventiviTotals.unknown > 0 ? <span className="dossier-badge badge-info" style={{ marginLeft: 8 }}>VALUTA DA VERIFICARE ({preventiviTotals.unknown})</span> : null}</div></div><div className="dossier-card-body">{renderDocList(preventivi, "preventivo")}</div></section>
        <section className="dossier-card"><div className="dossier-card-header"><h2>Fatture</h2><div className="dossier-chip">Totale fatture: <strong>CHF {fattureTotals.chf.toFixed(2)}</strong><span style={{ marginLeft: 8 }}>EUR {fattureTotals.eur.toFixed(2)}</span>{fattureTotals.unknown > 0 ? <span className="dossier-badge badge-info" style={{ marginLeft: 8 }}>VALUTA DA VERIFICARE ({fattureTotals.unknown})</span> : null}</div></div><div className="dossier-card-body">{renderDocList(fatture, "fattura")}</div></section>
      </div>

      {(["attesa", "eseguiti", "manutenzioni"] as const).map((key) =>
        modal === key ? (
          <div key={key} className="dossier-modal-overlay">
            <div className="dossier-modal">
              <div className="dossier-modal-header">
                <h2>{key === "attesa" ? "Lavori in attesa" : key === "eseguiti" ? "Lavori eseguiti" : "Manutenzioni"} - {mezzo.targa}</h2>
                <button className="dossier-button" type="button" onClick={() => setModal(null)}>Chiudi</button>
              </div>
              <div className="dossier-modal-body">
                {key === "manutenzioni" ? (
                  lavoriLists.manutenzioni.length === 0 ? <p>Nessuna manutenzione registrata.</p> : <ul className="dossier-list">{lavoriLists.manutenzioni.map((item) => <li key={item.id} className="dossier-list-item"><div className="dossier-list-main"><strong>{item.descrizione || "-"}</strong></div><div className="dossier-list-meta"><span>{item.data || "-"}</span><span>{formatKmOre(item)}</span></div></li>)}</ul>
                ) : (
                  lavoriLists[key].length === 0 ? <p>{key === "attesa" ? "Nessun lavoro in attesa." : "Nessun lavoro eseguito."}</p> : <ul className="dossier-list">{lavoriLists[key].map((item) => <li key={item.id} className="dossier-list-item" onClick={() => openLavoro(item.id)} style={{ cursor: "pointer" }}><div className="dossier-list-main"><span className={`dossier-badge ${key === "attesa" ? "badge-info" : "badge-success"}`}>{key === "attesa" ? "IN ATTESA" : "ESEGUITO"}</span><strong>{item.descrizione}</strong></div><div className="dossier-list-meta"><span>{item.dettagli || "-"}</span><span>{item.dataInserimento || "-"}</span></div></li>)}</ul>
                )}
              </div>
            </div>
          </div>
        ) : null,
      )}

      <PdfPreviewModal open={pdfOpen} title={pdfTitle} pdfUrl={pdfUrl} fileName={pdfFileName} hint={pdfHint} onClose={closePdf} onShare={onSharePdf} onCopyLink={async () => setPdfHint((await copyTextToClipboard(buildShareMessage())) ? "Testo copiato." : "Copia non disponibile.")} onWhatsApp={() => window.open(buildWhatsAppShareUrl(buildShareMessage()), "_blank", "noopener,noreferrer")} />
    </div>
  );
}
