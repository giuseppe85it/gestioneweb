// Archivio Storico NEXT — Step 7 (PROMPT 29.9) + PROMPT 30.5
// Host top-level: monta ArchivioFeed sotto scope CSS dedicato
// `.cc-archivio-scope-v1` e ospita il PdfPreviewModal condiviso
// (pattern Rifornimenti CC: state pdfPreview* + handler share).

import { useCallback, useEffect, useState, type ReactElement } from "react";

import PdfPreviewModal from "../../../components/PdfPreviewModal";
import {
  generateArchivioStoricoPDFBlob,
  type ArchivioStoricoPdfInput,
} from "../../../utils/pdfEngine";
import {
  buildPdfShareText,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../../../utils/pdfPreview";
import type { ArchivioEventoModalRequest } from "./archivioTypes";
import { ArchivioFeed } from "./ArchivioFeed";
import "./styles/archivioStorico.css";

type Props = {
  onOpenEventoModal?: (req: ArchivioEventoModalRequest) => void;
};

function buildShareMessage(input: ArchivioStoricoPdfInput | null): string {
  if (!input) return "Archivio Storico — GestioneManutenzione";
  const parts: string[] = [
    `Archivio Storico ${input.kindLabel}`,
    input.filters.periodoLabel,
    `${input.totalCount} record`,
  ];
  return `${parts.filter((p: string) => p.length > 0).join(" · ")} · GestioneManutenzione`;
}

export function NextArchivioStoricoTab({
  onOpenEventoModal,
}: Props): ReactElement {
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState<boolean>(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState<string>(
    "archivio-storico.pdf",
  );
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState<string>(
    "Anteprima PDF Archivio",
  );
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
  const [pdfInputCache, setPdfInputCache] =
    useState<ArchivioStoricoPdfInput | null>(null);

  useEffect(() => {
    return () => {
      revokePdfPreviewUrl(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const handleRequestPdfPreview = useCallback(
    async (input: ArchivioStoricoPdfInput): Promise<void> => {
      if (generatingPdf) return;
      setGeneratingPdf(true);
      setPdfShareHint(null);
      try {
        const today: Date = new Date();
        const ymd: string = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        const fileName: string = `archivio-${input.kind}-${ymd}.pdf`;
        const preview = await openPreview({
          source: () =>
            generateArchivioStoricoPDFBlob(input).then((blob: Blob) => ({
              blob,
              fileName,
            })),
          fileName,
          previousUrl: pdfPreviewUrl,
        });
        setPdfPreviewBlob(preview.blob);
        setPdfPreviewFileName(preview.fileName);
        setPdfPreviewTitle(`Anteprima PDF Archivio — ${input.kindLabel}`);
        setPdfPreviewUrl(preview.url);
        setPdfInputCache(input);
        setPdfPreviewOpen(true);
      } catch (err: unknown) {
        console.error("Errore anteprima PDF Archivio:", err);
        setPdfShareHint("Impossibile generare l'anteprima PDF.");
      } finally {
        setGeneratingPdf(false);
      }
    },
    [generatingPdf, pdfPreviewUrl],
  );

  const handleSharePdf = useCallback(async (): Promise<void> => {
    if (!pdfPreviewBlob) {
      const copied: boolean = await copyTextToClipboard(
        buildShareMessage(pdfInputCache),
      );
      setPdfShareHint(
        copied ? "Link copiato." : "Apri prima un'anteprima PDF.",
      );
      return;
    }
    const shareText: string = buildPdfShareText({
      contextLabel: `Archivio Storico ${pdfInputCache?.kindLabel ?? ""}`,
      dateLabel: pdfInputCache?.filters.periodoLabel ?? null,
      fileName: pdfPreviewFileName,
      url: pdfPreviewUrl,
    });
    const result = await sharePdfFile({
      blob: pdfPreviewBlob,
      fileName: pdfPreviewFileName,
      title: pdfPreviewTitle,
      text: shareText,
    });
    if (result.status === "shared") {
      setPdfShareHint("Condivisione avviata.");
      return;
    }
    if (result.status === "aborted") return;
    const copied: boolean = await copyTextToClipboard(
      buildShareMessage(pdfInputCache),
    );
    setPdfShareHint(
      copied
        ? "Condivisione non disponibile: testo copiato."
        : "Condivisione non disponibile.",
    );
  }, [pdfPreviewBlob, pdfPreviewFileName, pdfPreviewTitle, pdfPreviewUrl, pdfInputCache]);

  const handleCopyPdfText = useCallback(async (): Promise<void> => {
    const copied: boolean = await copyTextToClipboard(
      buildShareMessage(pdfInputCache),
    );
    setPdfShareHint(copied ? "Testo copiato." : "Copia non disponibile.");
  }, [pdfInputCache]);

  const handleWhatsAppPdf = useCallback((): void => {
    window.open(
      buildWhatsAppShareUrl(buildShareMessage(pdfInputCache)),
      "_blank",
      "noopener,noreferrer",
    );
  }, [pdfInputCache]);

  const handlePreviewClose = useCallback((): void => {
    setPdfPreviewOpen(false);
    setPdfShareHint(null);
  }, []);

  return (
    <div className="cc-archivio-scope-v1">
      <ArchivioFeed
        onOpenEventoModal={onOpenEventoModal}
        onRequestPdfPreview={handleRequestPdfPreview}
        generatingPdf={generatingPdf}
      />
      <PdfPreviewModal
        open={pdfPreviewOpen}
        title={pdfPreviewTitle}
        pdfUrl={pdfPreviewUrl}
        fileName={pdfPreviewFileName}
        hint={pdfShareHint}
        onClose={handlePreviewClose}
        onShare={handleSharePdf}
        onCopyLink={handleCopyPdfText}
        onWhatsApp={handleWhatsAppPdf}
      />
    </div>
  );
}
