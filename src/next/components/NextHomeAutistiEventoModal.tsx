import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { HomeEvent } from "../../utils/homeEvents";
import {
  generateCambioMezzoPDFBlob,
  generateControlloPDFBlob,
  generateRichiestaAttrezzaturePDFBlob,
  generateRifornimentoPDFBlob,
  generateSegnalazionePDFBlob,
} from "../../utils/pdfEngine";
import PdfPreviewModal from "../../components/PdfPreviewModal";
import {
  buildPdfShareText,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../../utils/pdfPreview";
import { formatDateTimeUI } from "../nextDateFormat";
import "../../autistiInbox/AutistiInboxHome.css";

type NextHomeAutistiEventoModalProps = {
  event: HomeEvent | null;
  onClose: () => void;
};

type DetailRow = {
  label: string;
  value: string;
};

type MezzoRow = {
  label: string;
  targa: string;
  categoria?: string;
};

type CambioSnapshot = {
  motrice: string | null;
  rimorchio: string | null;
};

type EventPayload = Record<string, unknown>;

function asRecord(value: unknown): EventPayload | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as EventPayload)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function safeText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const normalized = safeText(value);
    if (normalized) return normalized;
  }
  return "";
}

function normalizeTarga(value: unknown): string {
  return safeText(value).toUpperCase();
}

function formatFileDate() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function formatDateTime(value: number | null | undefined) {
  return formatDateTimeUI(value ?? null);
}

function getTipoLabel(tipo: HomeEvent["tipo"]) {
  switch (tipo) {
    case "rifornimento":
      return "RIFORNIMENTO";
    case "segnalazione":
      return "SEGNALAZIONE";
    case "controllo":
      return "CONTROLLO MEZZO";
    case "cambio_mezzo":
      return "CAMBIO MEZZO";
    case "richiesta_attrezzature":
      return "RICHIESTA ATTREZZATURE";
    case "gomme":
      return "GOMME";
    default:
      return "EVENTO";
  }
}

function getAutistaLabel(event: HomeEvent, payload: EventPayload | null) {
  const nome = firstText(
    event.autista,
    payload?.autistaNome,
    payload?.nomeAutista,
    payload?.autista,
  );
  const badge = firstText(payload?.badgeAutista, payload?.badge);
  if (nome && badge) return `${nome} (${badge})`;
  return nome || badge || "Autista non indicato";
}

function getLinkedLavoroIds(payload: EventPayload | null): string[] {
  if (!payload) return [];

  const ids = new Set<string>();
  const single = safeText(payload.linkedLavoroId);
  if (single) ids.add(single);

  asArray(payload.linkedLavoroIds).forEach((entry) => {
    const normalized = safeText(entry);
    if (normalized) ids.add(normalized);
  });

  return Array.from(ids);
}

function getFotoList(payload: EventPayload | null): string[] {
  if (!payload) return [];

  const urls = new Set<string>();
  const push = (value: unknown) => {
    const normalized = safeText(value);
    if (normalized && /^(blob:|data:|https?:)/i.test(normalized)) {
      urls.add(normalized);
    }
  };

  push(payload.fotoUrl);
  push(payload.fotoDataUrl);
  asArray(payload.fotoUrls).forEach(push);
  asArray(payload.images).forEach((entry) => {
    if (typeof entry === "string") {
      push(entry);
      return;
    }
    const record = asRecord(entry);
    push(record?.url);
    push(record?.dataUrl);
  });
  asArray(payload.foto).forEach((entry) => {
    if (typeof entry === "string") {
      push(entry);
      return;
    }
    const record = asRecord(entry);
    push(record?.url);
    push(record?.dataUrl);
  });

  return Array.from(urls);
}

function buildCambioSnapshot(payload: EventPayload | null, phase: "prima" | "dopo"): CambioSnapshot {
  if (!payload) {
    return { motrice: null, rimorchio: null };
  }

  const nested = asRecord(payload[phase]);
  const motrice = firstText(
    nested?.motrice,
    nested?.targaMotrice,
    nested?.targaCamion,
    payload[`${phase}Motrice`],
  );
  const rimorchio = firstText(
    nested?.rimorchio,
    nested?.targaRimorchio,
    payload[`${phase}Rimorchio`],
  );

  return {
    motrice: motrice || null,
    rimorchio: rimorchio || null,
  };
}

function formatCambioSnapshot(snapshot: CambioSnapshot): string {
  const parts = [
    snapshot.motrice ? `Motrice ${snapshot.motrice}` : null,
    snapshot.rimorchio ? `Rimorchio ${snapshot.rimorchio}` : null,
  ].filter((value): value is string => Boolean(value));

  return parts.length ? parts.join(" | ") : "Nessun mezzo indicato";
}

function buildMezzoRows(event: HomeEvent, payload: EventPayload | null): MezzoRow[] {
  const rows: MezzoRow[] = [];
  const seen = new Set<string>();

  const push = (label: string, targa: unknown, categoria?: unknown) => {
    const normalizedTarga = normalizeTarga(targa);
    if (!normalizedTarga) return;
    const key = `${label}:${normalizedTarga}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      label,
      targa: normalizedTarga,
      categoria: safeText(categoria) || undefined,
    });
  };

  if (event.tipo === "cambio_mezzo") {
    const dopo = buildCambioSnapshot(payload, "dopo");
    const prima = buildCambioSnapshot(payload, "prima");
    push("Motrice", dopo.motrice ?? prima.motrice);
    push("Rimorchio", dopo.rimorchio ?? prima.rimorchio);
    return rows;
  }

  push("Mezzo", event.targa, payload?.categoria);
  push("Motrice", payload?.targaMotrice ?? payload?.targaCamion, payload?.categoriaMotrice);
  push("Rimorchio", payload?.targaRimorchio, payload?.categoriaRimorchio);
  push("Target", payload?.targetTarga);
  return rows;
}

function buildDetailsRows(event: HomeEvent, payload: EventPayload | null): DetailRow[] {
  if (!payload) return [];

  const rows: DetailRow[] = [];
  const push = (label: string, ...values: unknown[]) => {
    const value = firstText(...values);
    if (!value) return;
    rows.push({ label, value });
  };

  switch (event.tipo) {
    case "rifornimento":
      push("Litri", payload.litri, payload.quantita, payload.quantitaLitri);
      push("Importo", payload.importo, payload.totale, payload.prezzoTotale);
      push("KM", payload.km, payload.chilometri);
      push("Distributore", payload.distributore, payload.luogo, payload.pompa);
      push("Badge", payload.badgeCarburante, payload.badge);
      break;
    case "segnalazione":
      push("Problema", payload.tipoProblema, payload.tipo, payload.categoria);
      push("Descrizione", payload.descrizione, payload.note, payload.messaggio);
      push("Urgenza", payload.urgenza, payload.priorita, payload.gravita, payload.severity);
      push("Stato", payload.stato);
      break;
    case "controllo": {
      const anomalies = [
        ...asArray(payload.koList),
        ...asArray(payload.koItems),
        ...asArray(payload.anomalie),
        ...asArray(payload.problemi),
      ]
        .map((entry) => safeText(entry))
        .filter(Boolean)
        .join(", ");
      push("Target", payload.target);
      push("Esito", payload.esito, payload.stato, payload.outcome);
      push("Anomalie", anomalies);
      break;
    }
    case "cambio_mezzo":
      push("Luogo", payload.luogo);
      push("Stato carico", payload.statoCarico);
      push("Badge", payload.badgeAutista, payload.badge);
      break;
    case "richiesta_attrezzature":
      push("Richiesta", payload.attrezzatura, payload.descrizione, payload.messaggio);
      push("Quantita", payload.quantita, payload.qta);
      push("Stato", payload.stato);
      push("Note", payload.note);
      break;
    case "gomme":
      push("Asse", payload.asse, payload.targetAsse);
      push("Tipo", payload.tipo, payload.tipologia);
      push("Misura", payload.misura);
      push("Stato", payload.stato);
      push("Note", payload.note, payload.descrizione);
      break;
    default:
      break;
  }

  return rows;
}

function getEventPdfBlobSource(event: HomeEvent) {
  const payload = asRecord(event.payload);
  if (!payload) return null;

  switch (event.tipo) {
    case "segnalazione":
      return () => generateSegnalazionePDFBlob(payload);
    case "controllo":
      return () => generateControlloPDFBlob(payload);
    case "richiesta_attrezzature":
      return () => generateRichiestaAttrezzaturePDFBlob(payload);
    case "rifornimento":
      return () => generateRifornimentoPDFBlob(payload);
    case "cambio_mezzo":
      return () => generateCambioMezzoPDFBlob(payload);
    default:
      return null;
  }
}

export default function NextHomeAutistiEventoModal({
  event,
  onClose,
}: NextHomeAutistiEventoModalProps) {
  const navigate = useNavigate();
  const [showJson, setShowJson] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState("evento-autista.pdf");
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Anteprima PDF evento");
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      revokePdfPreviewUrl(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const payload = useMemo(() => asRecord(event?.payload), [event]);
  const detailsTitle = event ? getTipoLabel(event.tipo) : "EVENTO";
  const autistaLabel = event ? getAutistaLabel(event, payload) : "";
  const mezzoRows = useMemo(() => (event ? buildMezzoRows(event, payload) : []), [event, payload]);
  const detailRows = useMemo(() => (event ? buildDetailsRows(event, payload) : []), [event, payload]);
  const fotoList = useMemo(() => getFotoList(payload), [payload]);
  const linkedLavoroIds = useMemo(() => getLinkedLavoroIds(payload), [payload]);
  const canExportPdf = Boolean(
    event &&
      (event.tipo === "segnalazione" ||
        event.tipo === "controllo" ||
        event.tipo === "richiesta_attrezzature" ||
        event.tipo === "rifornimento" ||
        event.tipo === "cambio_mezzo"),
  );

  if (!event) return null;

  const closeDetails = () => {
    setLightboxSrc(null);
    onClose();
  };

  const buildPdfShareMessage = () =>
    buildPdfShareText({
      contextLabel: `Evento autista ${detailsTitle}`,
      dateLabel: formatFileDate(),
      fileName: pdfPreviewFileName || "evento-autista.pdf",
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
      fileName: pdfPreviewFileName || "evento-autista.pdf",
      title: pdfPreviewTitle || "Anteprima PDF evento",
      text: buildPdfShareMessage(),
    });

    if (result.status === "shared") {
      setPdfShareHint("PDF condiviso.");
      return;
    }
    if (result.status === "aborted") return;

    const copied = await copyTextToClipboard(buildPdfShareMessage());
    setPdfShareHint(
      copied ? "Condivisione non disponibile: testo copiato." : "Condivisione non disponibile.",
    );
  };

  const handleCopyPDFText = async () => {
    const copied = await copyTextToClipboard(buildPdfShareMessage());
    setPdfShareHint(copied ? "Testo copiato." : "Copia non disponibile.");
  };

  const handleWhatsAppPDF = () => {
    window.open(buildWhatsAppShareUrl(buildPdfShareMessage()), "_blank", "noopener,noreferrer");
  };

  const handleExportPdf = async () => {
    const source = getEventPdfBlobSource(event);
    if (!source) return;

    try {
      const preview = await openPreview({
        source,
        fileName: `evento-autista-${event.tipo}-${formatFileDate()}.pdf`,
        previousUrl: pdfPreviewUrl,
      });
      setPdfShareHint(null);
      setPdfPreviewBlob(preview.blob);
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewTitle(`Anteprima PDF ${detailsTitle}`);
      setPdfPreviewUrl(preview.url);
      setPdfPreviewOpen(true);
    } catch (error) {
      console.error("Errore anteprima PDF evento clone-safe:", error);
      setPdfShareHint("Impossibile generare l'anteprima PDF.");
    }
  };

  const openCloneLavoroDetail = (lavoroId: string) => {
    if (!lavoroId) return;
    navigate(`/next/dettagliolavori/${encodeURIComponent(lavoroId)}`);
  };

  const isCambioMezzo = event.tipo === "cambio_mezzo";
  const isGomme = event.tipo === "gomme";
  const prima = buildCambioSnapshot(payload, "prima");
  const dopo = buildCambioSnapshot(payload, "dopo");

  return (
    <>
      <div className="aix-backdrop" onClick={closeDetails}>
        <div className="aix-modal" onClick={(modalEvent) => modalEvent.stopPropagation()}>
          <div className="aix-head">
            <div>
              <h3>{detailsTitle}</h3>
              <div style={{ fontSize: "13px", opacity: 0.8 }}>{autistaLabel}</div>
            </div>
            <button className="aix-close" onClick={closeDetails} aria-label="Chiudi">
              X
            </button>
          </div>

          <div className="aix-body">
            <div className="aix-row">
              <div className="aix-row-top">
                <strong>DATA/ORA</strong>
                <span>{formatDateTime(event.timestamp)}</span>
              </div>
            </div>

            {isCambioMezzo ? (
              <>
                <div className="aix-row">
                  <div className="aix-row-top">
                    <strong>PRIMA</strong>
                  </div>
                  <div className="aix-row-bot">{formatCambioSnapshot(prima)}</div>
                </div>
                <div className="aix-row">
                  <div className="aix-row-top">
                    <strong>DOPO</strong>
                  </div>
                  <div className="aix-row-bot">{formatCambioSnapshot(dopo)}</div>
                </div>
              </>
            ) : null}

            {mezzoRows.length > 0 ? (
              <>
                <div className="aix-row">
                  <div className="aix-row-top">
                    <strong>MEZZO</strong>
                  </div>
                </div>
                {mezzoRows.map((row) => (
                  <div key={`${row.label}-${row.targa}`} className="aix-row">
                    <div className="aix-row-top">
                      <strong>{row.label}</strong>
                      <span>{row.targa}</span>
                    </div>
                    {row.categoria ? <div className="aix-row-bot">Categoria: {row.categoria}</div> : null}
                  </div>
                ))}
              </>
            ) : null}

            {detailRows.length > 0 ? (
              <>
                <div className="aix-row">
                  <div className="aix-row-top">
                    <strong>DETTAGLI</strong>
                  </div>
                </div>
                {detailRows.map((row) => (
                  <div key={`${row.label}-${row.value}`} className="aix-row">
                    <div className="aix-row-top">
                      <strong>{row.label}</strong>
                    </div>
                    <div className="aix-row-bot">{row.value}</div>
                  </div>
                ))}
              </>
            ) : null}

            {(event.tipo === "segnalazione" || event.tipo === "controllo") ? (
              <div className="aix-row">
                <div className="aix-row-top">
                  <strong>LAVORO</strong>
                </div>
                <div className="aix-row-bot">
                  {linkedLavoroIds.length === 1 ? (
                    <button
                      type="button"
                      className="aix-create-btn"
                      onClick={() => openCloneLavoroDetail(linkedLavoroIds[0])}
                    >
                      APRI DETTAGLIO CLONE
                    </button>
                  ) : linkedLavoroIds.length > 1 ? (
                    <span>{linkedLavoroIds.length} lavori collegati nel gestionale.</span>
                  ) : (
                    <span>Creazione lavoro non disponibile nel clone read-only.</span>
                  )}
                </div>
              </div>
            ) : null}

            {canExportPdf ? (
              <div className="aix-row">
                <div className="aix-row-top">
                  <strong>PDF</strong>
                </div>
                <div className="aix-row-bot">
                  <button type="button" className="aix-create-btn" onClick={() => void handleExportPdf()}>
                    ANTEPRIMA PDF
                  </button>
                </div>
              </div>
            ) : null}

            {isGomme ? (
              <div className="aix-row">
                <div className="aix-row-top">
                  <strong>DOSSIER</strong>
                </div>
                <div className="aix-row-bot">
                  <span>Importazione in dossier non disponibile nel clone read-only.</span>
                </div>
              </div>
            ) : null}

            {fotoList.length > 0 ? (
              <>
                <div className="aix-row">
                  <div className="aix-row-top">
                    <strong>ALLEGATI/FOTO</strong>
                  </div>
                </div>
                <div className="aix-row">
                  <div className="aix-row-bot">
                    <div className="aix-photo-grid">
                      {fotoList.map((src) => (
                        <button
                          type="button"
                          key={src}
                          className="aix-photo-thumb"
                          onClick={() => setLightboxSrc(src)}
                        >
                          <img src={src} alt="Foto evento" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            <div className="aix-row">
              <div className="aix-row-top">
                <strong>JSON</strong>
                <button type="button" className="daily-more" onClick={() => setShowJson((value) => !value)}>
                  {showJson ? "Nascondi JSON" : "Mostra JSON"}
                </button>
              </div>
            </div>
            {showJson ? <pre className="aix-json">{JSON.stringify(payload ?? {}, null, 2)}</pre> : null}
          </div>
        </div>
      </div>

      <PdfPreviewModal
        open={pdfPreviewOpen}
        title={pdfPreviewTitle}
        pdfUrl={pdfPreviewUrl}
        fileName={pdfPreviewFileName}
        hint={pdfShareHint}
        onClose={() => {
          revokePdfPreviewUrl(pdfPreviewUrl);
          setPdfPreviewOpen(false);
          setPdfPreviewUrl(null);
          setPdfPreviewBlob(null);
          setPdfShareHint(null);
        }}
        onShare={handleSharePDF}
        onCopyLink={handleCopyPDFText}
        onWhatsApp={handleWhatsAppPDF}
      />

      {lightboxSrc ? (
        <div className="aix-lightbox" onClick={() => setLightboxSrc(null)}>
          <button
            type="button"
            className="aix-lightbox-close"
            onClick={() => setLightboxSrc(null)}
            aria-label="Chiudi"
          >
            X
          </button>
          <img src={lightboxSrc} alt="Foto evento autista" onClick={(clickEvent) => clickEvent.stopPropagation()} />
        </div>
      ) : null}
    </>
  );
}
