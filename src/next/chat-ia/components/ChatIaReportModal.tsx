import { useState } from "react";
import { openPreview, revokePdfPreviewUrl } from "../../../utils/pdfPreview";
import type { ChatIaArchiveEntry, ChatIaReport } from "../core/chatIaTypes";
import { createChatIaReportArchiveEntry } from "../reports/chatIaReportArchive";
import { generateChatIaReportPdf } from "../reports/chatIaReportPdf";

type ChatIaReportModalProps = {
  onClose: () => void;
  onSaved: (entry: ChatIaArchiveEntry) => void;
  prompt: string;
  report: ChatIaReport;
};

export default function ChatIaReportModal({
  onClose,
  onSaved,
  prompt,
  report,
}: ChatIaReportModalProps) {
  const [status, setStatus] = useState<"idle" | "working">("idle");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePdf = async () => {
    setStatus("working");
    setError(null);
    try {
      const pdf = await generateChatIaReportPdf({ report });
      const session = await openPreview({
        source: pdf,
        fileName: pdf.fileName,
        previousUrl: previewUrl,
      });
      setPreviewUrl(session.url);
      window.open(session.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("PDF non generato.");
    } finally {
      setStatus("idle");
    }
  };

  const handleSave = async () => {
    setStatus("working");
    setError(null);
    try {
      const pdf = await generateChatIaReportPdf({ report });
      const entry = await createChatIaReportArchiveEntry({
        prompt,
        report,
        pdfBlob: pdf.blob,
      });
      onSaved(entry);
      onClose();
    } catch {
      setError("Salvataggio report non completato.");
    } finally {
      setStatus("idle");
    }
  };

  const close = () => {
    revokePdfPreviewUrl(previewUrl);
    onClose();
  };

  return (
    <div className="chat-ia-modal-backdrop" role="presentation">
      <section className="chat-ia-modal" role="dialog" aria-modal="true" aria-label={report.title}>
        <header className="chat-ia-modal-header">
          <div>
            <p className="chat-ia-eyebrow">Report</p>
            <h2>{report.title}</h2>
          </div>
          <button className="chat-ia-icon-button" onClick={close} type="button">
            Chiudi
          </button>
        </header>

        <p className="chat-ia-report-summary">{report.summary}</p>
        <div className="chat-ia-report-sections">
          {report.sections.map((section) => (
            <article className="chat-ia-report-section" key={section.id}>
              <h3>{section.title}</h3>
              <p>{section.summary}</p>
              {section.bullets.length ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>

        {error ? <p className="chat-ia-error">{error}</p> : null}

        <footer className="chat-ia-modal-actions">
          <button className="chat-ia-secondary-button" disabled={status === "working"} onClick={handlePdf} type="button">
            Scarica PDF
          </button>
          <button className="chat-ia-send" disabled={status === "working"} onClick={handleSave} type="button">
            Salva report
          </button>
        </footer>
      </section>
    </div>
  );
}
