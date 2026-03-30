/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getItemSync } from "../../utils/storageSync";
import { generateSegnalazionePDFBlob } from "../../utils/pdfEngine";
import PdfPreviewModal from "../../components/PdfPreviewModal";
import {
  buildPdfShareText,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../../utils/pdfPreview";
import { formatDateTimeUI } from "../../utils/dateFormat";
import { isCloneRuntime } from "../../utils/cloneWriteBarrier";
import "../../autistiInbox/AutistiSegnalazioniAll.css";

type SegnalazioneRecord = {
  id?: string;
  data?: number | null;
  timestamp?: number | null;
  stato?: string | null;
  letta?: boolean | null;
  ambito?: string | null;
  targa?: string | null;
  targaCamion?: string | null;
  targaRimorchio?: string | null;
  autistaNome?: string | null;
  badgeAutista?: string | null;
  tipoProblema?: string | null;
  descrizione?: string | null;
  note?: string | null;
  foto?: Array<{ dataUrl?: string; url?: string }> | null;
  fotoUrls?: string[] | null;
  fotoUrl?: string | null;
};

type SegnalazioneView = SegnalazioneRecord & {
  isNuova: boolean;
  ts: number;
  targaLabel: string;
  ambitoLabel: string;
  ambito?: string | null;
  fotoList: string[];
  fotoCount: number;
};

function formatDateTime(ts?: number | null) {
  return formatDateTimeUI(ts ?? null);
}

function normTarga(value?: string | null) {
  return String(value ?? "").toUpperCase().replace(/\s+/g, "").trim();
}

function buildTargaLabel(r: SegnalazioneRecord) {
  const targa =
    r.targa ?? r.targaCamion ?? r.targaRimorchio ?? "-";
  return String(targa || "-");
}

function getFotoList(r: SegnalazioneRecord) {
  const list: string[] = [];
  if (Array.isArray(r?.foto)) {
    for (const f of r.foto) {
      if (typeof f === "string") list.push(f);
      else if (f?.dataUrl) list.push(String(f.dataUrl));
      else if (f?.url) list.push(String(f.url));
    }
  }
  if (r?.fotoUrl) list.push(String(r.fotoUrl));
  if (Array.isArray(r?.fotoUrls)) {
    for (const u of r.fotoUrls) {
      if (u) list.push(String(u));
    }
  }
  return list;
}

function buildPdfSafeSegnalazioneRecord(
  record: SegnalazioneRecord,
  thumbnailUrls: string[] | string | null | undefined
) {
  const pdfSafe: any = { ...((record as any) || {}) };
  delete pdfSafe.foto;
  delete pdfSafe.fotoUrl;
  delete pdfSafe.fotoUrls;
  delete pdfSafe.fotoDataUrl;
  delete pdfSafe.fotoStoragePath;
  delete pdfSafe.fotoStoragePaths;
  const thumbList = Array.isArray(thumbnailUrls)
    ? thumbnailUrls
    : thumbnailUrls
    ? [thumbnailUrls]
    : [];
  const normalizedThumbs = Array.from(
    new Set(
      thumbList
        .map((u) => String(u ?? "").trim())
        .filter(Boolean)
    )
  );
  const fotoUrls = normalizedThumbs.filter((u) => u.startsWith("http"));
  if (fotoUrls.length) {
    pdfSafe.fotoUrls = fotoUrls;
    return pdfSafe;
  }
  const originalDataUrl =
    typeof (record as any)?.fotoDataUrl === "string" &&
    (record as any).fotoDataUrl.startsWith("data:image/")
      ? String((record as any).fotoDataUrl)
      : null;
  const thumbDataUrl =
    normalizedThumbs.find((u) => u.startsWith("data:image/")) || null;
  if (originalDataUrl || thumbDataUrl) {
    pdfSafe.fotoDataUrl = originalDataUrl || thumbDataUrl;
  }
  return pdfSafe;
}

export default function AutistiSegnalazioniAll() {
  const navigate = useNavigate();
  const cloneRuntime = useMemo(() => isCloneRuntime(), []);
  const [records, setRecords] = useState<SegnalazioneRecord[]>([]);
  const [filterTarga, setFilterTarga] = useState("");
  const [filterAmbito, setFilterAmbito] = useState<"tutti" | "motrice" | "rimorchio">("tutti");
  const [onlyNuove, setOnlyNuove] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState("segnalazione-autista.pdf");
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Anteprima PDF segnalazione");
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);
  const homePath = cloneRuntime ? "/next/centro-controllo" : "/";
  const backPath = cloneRuntime ? "/next/centro-controllo" : "/autisti-inbox";

  useEffect(() => {
    let alive = true;
    (async () => {
      const raw = await getItemSync("@segnalazioni_autisti_tmp");
      const list = Array.isArray(raw)
        ? raw
        : raw?.value && Array.isArray(raw.value)
        ? raw.value
        : [];
      if (!alive) return;
      setRecords(list);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const key = normTarga(filterTarga);
    const items: SegnalazioneView[] = records.map((r: SegnalazioneRecord) => {
      const ts =
        typeof r.data === "number"
          ? r.data
          : typeof r.timestamp === "number"
          ? r.timestamp
          : 0;
      const isNuova = r.stato === "nuova" || r.letta === false;
      const fotoList = getFotoList(r);
      const fotoCount = fotoList.length;
      const ambito = String(r.ambito ?? "").toLowerCase();
      return {
        ...r,
        isNuova,
        ts,
        targaLabel: buildTargaLabel(r),
        ambitoLabel: ambito ? ambito.toUpperCase() : "-",
        fotoList,
        fotoCount,
      };
    });

    const ordered = items.sort((a, b) => {
      const ak = a.isNuova ? 0 : 1;
      const bk = b.isNuova ? 0 : 1;
      if (ak !== bk) return ak - bk;
      return (b.ts || 0) - (a.ts || 0);
    });

    const filteredByNuove = onlyNuove ? ordered.filter((r) => r.isNuova) : ordered;
    const filteredByAmbito =
      filterAmbito === "tutti"
        ? filteredByNuove
        : filteredByNuove.filter(
            (r) => String(r.ambito ?? "").toLowerCase() === filterAmbito
          );
    if (!key) return filteredByAmbito;
    return filteredByAmbito.filter((r) => {
      const t = normTarga(r.targaCamion ?? r.targaRimorchio ?? r.targa ?? null);
      return t && t.includes(key);
    });
  }, [records, filterTarga, filterAmbito, onlyNuove]);

  const formatFileDate = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = now.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
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
      contextLabel: "Segnalazioni autisti",
      dateLabel: formatFileDate(),
      fileName: pdfPreviewFileName || "segnalazione-autista.pdf",
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
      fileName: pdfPreviewFileName || "segnalazione-autista.pdf",
      title: pdfPreviewTitle || "Anteprima PDF segnalazione",
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
    const text = buildPdfShareMessage();
    window.open(buildWhatsAppShareUrl(text), "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    return () => {
      revokePdfPreviewUrl(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  return (
    <div className="aix-page">
      <div className="aix-wrap">
        <div className="aix-header">
          <div className="aix-header-left">
            <img
              src="/logo.png"
              alt="Logo"
              className="aix-logo"
              onClick={() => navigate(homePath)}
            />
            <h1>Tutte le segnalazioni</h1>
          </div>
          <button className="aix-back" onClick={() => navigate(backPath)}>
            INDIETRO
          </button>
        </div>

        <div className="aix-card">
          <div className="aix-filters">
            <input
              className="aix-input"
              value={filterTarga}
              onChange={(e) => setFilterTarga(e.target.value)}
              placeholder="Filtra per targa"
            />
            <select
              className="aix-select"
              value={filterAmbito}
              onChange={(e) => setFilterAmbito(e.target.value as "tutti" | "motrice" | "rimorchio")}
            >
              <option value="tutti">Tutti gli ambiti</option>
              <option value="motrice">Motrice</option>
              <option value="rimorchio">Rimorchio</option>
            </select>
            <label className="aix-toggle">
              <input
                type="checkbox"
                checked={onlyNuove}
                onChange={(e) => setOnlyNuove(e.target.checked)}
              />
              <span>Solo nuove</span>
            </label>
          </div>

          <div className="aix-list">
            {filtered.length === 0 ? (
              <div className="aix-empty">Nessuna segnalazione disponibile.</div>
            ) : (
              filtered.map((r: SegnalazioneView, index: number) => {
                const autista = r.autistaNome ?? "-";
                const badge = r.badgeAutista ? `(${r.badgeAutista})` : "";
                const isOpen = openId === String(r.id ?? `seg_${index}`);
                return (
                  <div
                    className="aix-row"
                    key={r.id ?? `seg_${index}`}
                    onClick={() =>
                      setOpenId(isOpen ? null : String(r.id ?? `seg_${index}`))
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setOpenId(isOpen ? null : String(r.id ?? `seg_${index}`));
                      }
                    }}
                  >
                    <div className="aix-row-top">
                      <span className="aix-time">{formatDateTime(r.ts)}</span>
                      <span className="aix-ambito">{r.ambitoLabel}</span>
                      <span className="aix-targa">{r.targaLabel}</span>
                    </div>
                    <div className="aix-row-mid">
                      <span className="aix-autista">
                        {autista} {badge}
                      </span>
                      {r.isNuova && <span className="aix-badge nuova">NUOVA</span>}
                      <span className="aix-foto">Foto: {r.fotoCount}</span>
                      <button
                        type="button"
                        className="aix-back"
                        style={{ padding: "4px 8px", fontSize: "12px" }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const pdfSafe = buildPdfSafeSegnalazioneRecord(r, r.fotoList);
                            const fileDate = formatFileDate();
                            const preview = await openPreview({
                              source: async () => generateSegnalazionePDFBlob(pdfSafe),
                              fileName: `segnalazione-autista-${fileDate}.pdf`,
                              previousUrl: pdfPreviewUrl,
                            });
                            setPdfShareHint(null);
                            setPdfPreviewBlob(preview.blob);
                            setPdfPreviewFileName(preview.fileName);
                            setPdfPreviewTitle(`Anteprima PDF segnalazione ${r.targaLabel}`);
                            setPdfPreviewUrl(preview.url);
                            setPdfPreviewOpen(true);
                          } catch (err) {
                            console.error("Errore anteprima PDF segnalazione:", err);
                          }
                        }}
                      >
                        Anteprima PDF
                      </button>
                    </div>
                    <div className="aix-row-bot">
                      <span className="aix-tipo">{r.tipoProblema ?? "-"}</span>
                      <span className="aix-desc">{r.descrizione ?? "-"}</span>
                    </div>
                    {r.fotoList.length > 0 ? (
                      <div className="aix-photo-grid">
                        {r.fotoList.slice(0, 3).map((src: string, idx: number) => (
                          <button
                            type="button"
                            key={`${r.id ?? `seg_${index}`}_${idx}`}
                            className="aix-photo-thumb"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxSrc(src);
                            }}
                          >
                            <img src={src} alt="Foto segnalazione" />
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {isOpen && (
                      <div className="aix-row-detail">
                        {r.note ? <div>Note: {r.note}</div> : null}
                        <div>Foto totali: {r.fotoCount}</div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
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
          <img
            src={lightboxSrc}
            alt="Foto segnalazione"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
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



