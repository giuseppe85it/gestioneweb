import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PdfPreviewModal from "../components/PdfPreviewModal";
import { formatDateUI } from "../utils/dateFormat";
import { generateTablePDFBlob } from "../utils/pdfEngine";
import {
  buildPdfShareText,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../utils/pdfPreview";
import {
  buildNextDettaglioLavoroPath,
  readNextLavoriEseguitiSnapshot,
  type NextLavoriListaGroup,
  type NextLavoriListaSnapshot,
} from "./domain/nextLavoriDomain";
import "../pages/LavoriEseguiti.css";

const normalizeTarga = (value?: string | null) =>
  String(value ?? "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .trim();

const getMezzoPhoto = (group: NextLavoriListaGroup) => group.mezzo?.fotoUrl || "";

const getMezzoMeta = (group: NextLavoriListaGroup) => {
  const parts = [group.mezzo?.categoria, group.mezzo?.marcaModello].filter(
    Boolean,
  ) as string[];
  return parts.join(" - ");
};

const formatFileDate = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

export default function NextLavoriEseguitiPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [snapshot, setSnapshot] = useState<NextLavoriListaSnapshot | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openMagazzino, setOpenMagazzino] = useState(false);
  const targaFilterParam = (searchParams.get("targa") || "").trim();
  const [searchTarga, setSearchTarga] = useState(() => targaFilterParam);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState(
    "lavori-eseguiti.pdf",
  );
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState(
    "Anteprima PDF lavori eseguiti",
  );
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const nextSnapshot = await readNextLavoriEseguitiSnapshot({
          includeCloneOverlays: false,
        });
        if (!mounted) {
          return;
        }
        setSnapshot(nextSnapshot);
      } catch {
        if (mounted) {
          setSnapshot(null);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const closePdfPreview = () => {
    revokePdfPreviewUrl(pdfPreviewUrl);
    setPdfPreviewOpen(false);
    setPdfPreviewUrl(null);
    setPdfPreviewBlob(null);
    setPdfShareHint(null);
  };

  useEffect(() => {
    return () => {
      revokePdfPreviewUrl(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const buildPdfShareMessage = () =>
    buildPdfShareText({
      contextLabel: "Lavori eseguiti",
      dateLabel: formatFileDate(),
      fileName: pdfPreviewFileName || "lavori-eseguiti.pdf",
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
      fileName: pdfPreviewFileName || "lavori-eseguiti.pdf",
      title: pdfPreviewTitle || "Anteprima PDF lavori eseguiti",
      text: buildPdfShareMessage(),
    });

    if (result.status === "shared") {
      setPdfShareHint("PDF condiviso.");
      return;
    }
    if (result.status === "aborted") {
      return;
    }

    const copied = await copyTextToClipboard(buildPdfShareMessage());
    setPdfShareHint(
      copied
        ? "Condivisione non disponibile: testo copiato."
        : "Condivisione non disponibile.",
    );
  };

  const handleCopyPDFText = async () => {
    const copied = await copyTextToClipboard(buildPdfShareMessage());
    setPdfShareHint(copied ? "Testo copiato." : "Copia non disponibile.");
  };

  const handleWhatsAppPDF = () => {
    const text = buildPdfShareMessage();
    window.open(buildWhatsAppShareUrl(text), "_blank", "noopener,noreferrer");
  };

  const handleExportPDF = async (group: NextLavoriListaGroup) => {
    const titolo = group.label;
    const rows = group.items.map((item) => ({
      Descrizione: item.descrizione,
      Targa: item.targa || "-",
      Esecutore: item.chiHaEseguito || "-",
      Inserimento: formatDateUI(item.dataInserimento ?? null),
      Esecuzione: formatDateUI(item.dataEsecuzione ?? null),
    }));
    const columns = [
      "Descrizione",
      "Targa",
      "Esecutore",
      "Inserimento",
      "Esecuzione",
    ];

    try {
      const fileDate = formatFileDate();
      const preview = await openPreview({
        source: async () => generateTablePDFBlob(titolo, rows, columns),
        fileName: `lavori-eseguiti-${titolo.replace(/\s+/g, "-")}-${fileDate}.pdf`,
        previousUrl: pdfPreviewUrl,
      });
      setPdfShareHint(null);
      setPdfPreviewBlob(preview.blob);
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewTitle(`Anteprima PDF lavori eseguiti - ${titolo}`);
      setPdfPreviewUrl(preview.url);
      setPdfPreviewOpen(true);
    } catch (error) {
      console.error("Errore anteprima PDF lavori eseguiti:", error);
    }
  };

  const searchNorm = normalizeTarga(searchTarga);

  const { targaGroups, magazzinoItems } = useMemo(() => {
    const groups = snapshot?.groups ?? [];
    return {
      targaGroups: groups.filter((group) => group.kind === "mezzo"),
      magazzinoItems: groups.find((group) => group.kind === "magazzino") ?? null,
    };
  }, [snapshot]);

  const visibleGroups = searchNorm
    ? targaGroups.filter((group) =>
        normalizeTarga(group.label).includes(searchNorm),
      )
    : targaGroups;

  const forcedOpenGroupKey = searchNorm
    ? normalizeTarga(visibleGroups[0]?.label)
    : "";

  const toggleGroup = (key: string) => {
    setOpenGroups((current) => ({ ...current, [key]: !current[key] }));
  };

  const toggleMagazzino = () => {
    setOpenMagazzino((current) => !current);
  };

  const urgencyKey = (value?: string | null) => {
    if (value === "alta" || value === "media" || value === "bassa") {
      return value;
    }
    return "media";
  };

  const splitByUrgency = (group: NextLavoriListaGroup) => {
    const out = {
      alta: [] as NextLavoriListaGroup["items"],
      media: [] as NextLavoriListaGroup["items"],
      bassa: [] as NextLavoriListaGroup["items"],
    };

    group.items.forEach((item) => {
      const key = urgencyKey(item.urgenza);
      out[key].push(item);
    });

    return out;
  };

  const getUrgencyClass = (value?: string | null) => {
    if (value === "alta") {
      return "lavori-badge lavori-badge-alta";
    }
    if (value === "media") {
      return "lavori-badge lavori-badge-media";
    }
    if (value === "bassa") {
      return "lavori-badge lavori-badge-bassa";
    }
    return "lavori-badge lavori-badge-media";
  };

  const renderSection = (title: string, items: NextLavoriListaGroup["items"]) => {
    if (items.length === 0) {
      return null;
    }

    return (
      <div className="lavori-urgency-section">
        <div className="lavori-urgency-title">
          {title} ({items.length})
        </div>
        <div className="lavori-rows">
          {items.map((item, index) => (
            <div
              key={`${title}-${item.id}-${index}`}
              className={`lavori-row lavori-row--${urgencyKey(item.urgenza)}`}
              onClick={() =>
                navigate(
                  buildNextDettaglioLavoroPath({
                    lavoroId: item.id,
                    from: "lavori-eseguiti",
                  }),
                )
              }
            >
              <div className="lavori-row-main">
                <div className="lavori-row-desc">{item.descrizione}</div>
                <div className="lavori-row-meta">
                  Inserito: {formatDateUI(item.dataInserimento ?? null)}
                  {item.dataEsecuzione
                    ? ` - Eseguito: ${formatDateUI(item.dataEsecuzione)}`
                    : ""}
                  {item.chiHaEseguito
                    ? ` - Esecutore: ${item.chiHaEseguito}`
                    : ""}
                </div>
              </div>
              {item.urgenza ? (
                <span className={getUrgencyClass(item.urgenza)}>
                  {String(item.urgenza).toUpperCase()}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="le-page">
      <div className="le-container">
        <div className="lavori-header lavori-header--centered">
          <img src="/logo.png" alt="logo" className="lavori-header-logo" />
          <div className="lavori-header-text lavori-header-text--centered">
            <div className="lavori-header-eyebrow">LAVORI</div>
            <div className="lavori-header-title">Lavori eseguiti</div>
          </div>
        </div>

        <div className="lavori-search">
          <input
            className="lavori-search-input"
            type="text"
            placeholder="Cerca per targa"
            value={searchTarga}
            onChange={(event) => setSearchTarga(event.target.value)}
          />
        </div>

        <div className="lavori-accordion">
          {visibleGroups.map((group) => {
            const groupKey = normalizeTarga(group.label);
            const isOpen = searchNorm
              ? groupKey === forcedOpenGroupKey
              : Boolean(openGroups[groupKey]);
            const photo = getMezzoPhoto(group);
            const meta = getMezzoMeta(group);
            const sections = splitByUrgency(group);

            return (
              <div
                key={group.label}
                className={`mezzo-card ${isOpen ? "is-open" : ""}`}
              >
                <div
                  className="mezzo-card-header"
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleGroup(groupKey)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      toggleGroup(groupKey);
                    }
                  }}
                >
                  <div className="mezzo-photo">
                    {photo ? (
                      <img
                        src={photo}
                        alt={`foto ${group.label}`}
                        className="mezzo-photo-img"
                      />
                    ) : (
                      <div className="mezzo-photo-placeholder">MEZZO</div>
                    )}
                  </div>
                  <div className="mezzo-info">
                    <div className="mezzo-targa">{group.label}</div>
                    {meta ? <div className="mezzo-meta">{meta}</div> : null}
                  </div>
                  <div className="mezzo-actions">
                    <button
                      type="button"
                      className="lavori-btn is-ghost lavori-mini-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleExportPDF(group);
                      }}
                    >
                      Anteprima PDF
                    </button>
                    <span
                      className={`mezzo-chevron ${isOpen ? "is-open" : ""}`}
                    >
                      &gt;
                    </span>
                  </div>
                </div>
                {isOpen ? (
                  <div className="mezzo-body">
                    {renderSection("ALTA", sections.alta)}
                    {renderSection("MEDIA", sections.media)}
                    {renderSection("BASSA", sections.bassa)}
                  </div>
                ) : null}
              </div>
            );
          })}

          {!searchNorm && magazzinoItems ? (
            <div className={`mezzo-card ${openMagazzino ? "is-open" : ""}`}>
              <div
                className="mezzo-card-header"
                role="button"
                tabIndex={0}
                onClick={toggleMagazzino}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    toggleMagazzino();
                  }
                }}
              >
                <div className="mezzo-photo">
                  <div className="mezzo-photo-placeholder">MAG</div>
                </div>
                <div className="mezzo-info">
                  <div className="mezzo-targa">MAGAZZINO</div>
                </div>
                <div className="mezzo-actions">
                  <button
                    type="button"
                    className="lavori-btn is-ghost lavori-mini-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleExportPDF(magazzinoItems);
                    }}
                  >
                    Anteprima PDF
                  </button>
                  <span
                    className={`mezzo-chevron ${openMagazzino ? "is-open" : ""}`}
                  >
                    &gt;
                  </span>
                </div>
              </div>
              {openMagazzino ? (
                <div className="mezzo-body">
                  {(() => {
                    const sections = splitByUrgency(magazzinoItems);
                    return (
                      <>
                        {renderSection("ALTA", sections.alta)}
                        {renderSection("MEDIA", sections.media)}
                        {renderSection("BASSA", sections.bassa)}
                      </>
                    );
                  })()}
                </div>
              ) : null}
            </div>
          ) : null}

          {visibleGroups.length === 0 &&
          (!searchNorm || !magazzinoItems) ? (
            <div className="lavori-empty">Nessun lavoro eseguito.</div>
          ) : null}
        </div>

        <button
          type="button"
          className="le-back-btn lavori-btn is-primary"
          onClick={() => navigate(-1)}
        >
          TORNA INDIETRO
        </button>

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
    </div>
  );
}
