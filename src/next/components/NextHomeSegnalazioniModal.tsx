import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import PdfPreviewModal from "../../components/PdfPreviewModal";
import { generateSegnalazionePDFBlob } from "../../utils/pdfEngine";
import {
  buildPdfShareText,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../../utils/pdfPreview";
import { formatDateTimeUI } from "../nextDateFormat";
import type { D10SegnalazioneItem } from "../domain/nextCentroControlloDomain";
import { createManutenzioneDaFareFromSegnalazione } from "../writers/nextManutenzioneDaFareCreateWriter";
import { deleteSegnalazioneAutista } from "../writers/nextSegnalazioneDeleteWriter";
import { updateNextHomeSegnalazioneAdmin } from "../writers/nextHomeSegnalazioneAdminWriter";

type NextHomeSegnalazioniModalProps = {
  open: boolean;
  segnalazioni: D10SegnalazioneItem[];
  onClose: () => void;
  onChanged: () => Promise<void> | void;
};

type EditForm = {
  id: string;
  autistaNome: string;
  badgeAutista: string;
  targaCamion: string;
  targaRimorchio: string;
  targa: string;
  ambito: string;
  tipoProblema: string;
  descrizione: string;
  note: string;
  stato: string;
  letta: boolean;
  flagVerifica: boolean;
  motivoVerifica: string;
  adminNote: string;
  foto: string[];
};

type RawRecord = Record<string, unknown>;

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeFilterText(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function formatFileDate(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function readRawRecord(item: D10SegnalazioneItem): RawRecord {
  return item.raw && typeof item.raw === "object" && !Array.isArray(item.raw)
    ? (item.raw as RawRecord)
    : {};
}

function buildPdfSafeSegnalazioneRecord(record: RawRecord, thumbnailUrls: string[]) {
  const pdfSafe: RawRecord = { ...record };
  delete pdfSafe.foto;
  delete pdfSafe.fotoUrl;
  delete pdfSafe.fotoUrls;
  delete pdfSafe.fotoDataUrl;
  delete pdfSafe.fotoStoragePath;
  delete pdfSafe.fotoStoragePaths;

  const normalizedThumbs = Array.from(new Set(thumbnailUrls.map(normalizeText).filter(Boolean)));
  const fotoUrls = normalizedThumbs.filter((url) => url.startsWith("http"));
  if (fotoUrls.length) {
    pdfSafe.fotoUrls = fotoUrls;
    return pdfSafe;
  }

  const originalDataUrl =
    typeof record.fotoDataUrl === "string" && record.fotoDataUrl.startsWith("data:image/")
      ? record.fotoDataUrl
      : null;
  const thumbDataUrl = normalizedThumbs.find((url) => url.startsWith("data:image/")) ?? null;
  if (originalDataUrl || thumbDataUrl) {
    pdfSafe.fotoDataUrl = originalDataUrl ?? thumbDataUrl;
  }
  return pdfSafe;
}

function buildEditForm(item: D10SegnalazioneItem): EditForm {
  const raw = readRawRecord(item);
  return {
    id: item.sourceRecordId ?? item.id,
    autistaNome: normalizeText(raw.autistaNome ?? raw.nomeAutista ?? item.autistaNome),
    badgeAutista: normalizeText(raw.badgeAutista ?? item.badgeAutista),
    targaCamion: normalizeText(raw.targaCamion ?? raw.targaMotrice ?? item.targaCamion ?? item.targaMotrice),
    targaRimorchio: normalizeText(raw.targaRimorchio ?? item.targaRimorchio),
    targa: normalizeText(raw.targa ?? item.targa),
    ambito: normalizeText(raw.ambito ?? raw.target ?? item.ambito),
    tipoProblema: normalizeText(raw.tipoProblema ?? item.tipoProblema),
    descrizione: normalizeText(raw.descrizione ?? item.descrizione),
    note: normalizeText(raw.note ?? item.note),
    stato: normalizeText(raw.stato ?? item.stato),
    letta: typeof raw.letta === "boolean" ? raw.letta : item.letta === true,
    flagVerifica: raw.flagVerifica === true || item.flagVerifica,
    motivoVerifica: normalizeText(raw.motivoVerifica ?? item.motivoVerifica),
    adminNote: normalizeText((raw.adminEdit as RawRecord | undefined)?.note),
    foto: item.fotoList,
  };
}

export default function NextHomeSegnalazioniModal(props: NextHomeSegnalazioniModalProps) {
  const { open, segnalazioni, onClose, onChanged } = props;
  const [filterTarga, setFilterTarga] = useState("");
  const [filterAmbito, setFilterAmbito] = useState<"tutti" | "motrice" | "rimorchio">("tutti");
  const [soloNuove, setSoloNuove] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState("segnalazione-autista.pdf");
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);

  useEffect(() => () => revokePdfPreviewUrl(pdfPreviewUrl), [pdfPreviewUrl]);

  const filtered = useMemo(() => {
    const targaNeedle = normalizeFilterText(filterTarga);
    return segnalazioni
      .filter((item) => {
        if (soloNuove && !item.isNuova) return false;
        if (targaNeedle) {
          const haystack = [
            item.targa,
            item.targaCamion,
            item.targaMotrice,
            item.targaRimorchio,
          ]
            .map(normalizeFilterText)
            .join(" ");
          if (!haystack.includes(targaNeedle)) return false;
        }
        if (filterAmbito !== "tutti" && !normalizeFilterText(item.ambito).includes(filterAmbito)) return false;
        return true;
      })
      .sort((left, right) => (right.timestamp ?? 0) - (left.timestamp ?? 0));
  }, [filterAmbito, filterTarga, segnalazioni, soloNuove]);

  const nuove = filtered.filter((item) => item.isNuova);
  const lette = filtered.filter((item) => !item.isNuova);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const closePdfPreview = () => {
    setPdfPreviewOpen(false);
    setPdfPreviewBlob(null);
    setPdfShareHint(null);
    revokePdfPreviewUrl(pdfPreviewUrl);
    setPdfPreviewUrl(null);
  };

  const openSegnalazionePdfPreview = async (item: D10SegnalazioneItem) => {
    const record = readRawRecord(item);
    try {
      const preview = await openPreview({
        source: async () => generateSegnalazionePDFBlob(buildPdfSafeSegnalazioneRecord(record, item.fotoList)),
        fileName: `segnalazione-home-next-${formatFileDate()}.pdf`,
        previousUrl: pdfPreviewUrl,
      });
      setPdfShareHint(null);
      setPdfPreviewBlob(preview.blob);
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewUrl(preview.url);
      setPdfPreviewOpen(true);
    } catch {
      window.alert("Anteprima PDF segnalazione non riuscita.");
    }
  };

  const handleCreateWork = async (item: D10SegnalazioneItem) => {
    if (!window.confirm("Creare una manutenzione da fare da questa segnalazione?")) return;
    setBusyId(item.id);
    try {
      const result = await createManutenzioneDaFareFromSegnalazione(readRawRecord(item));
      if (!result.ok) {
        window.alert(result.error ?? "Creazione manutenzione non riuscita.");
        return;
      }
      await onChanged();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: D10SegnalazioneItem) => {
    if (!window.confirm("Eliminare questa segnalazione e sganciare gli eventuali collegamenti?")) return;
    setBusyId(item.id);
    try {
      const result = await deleteSegnalazioneAutista({ segnalazioneId: item.sourceRecordId ?? item.id });
      if (!result.ok) {
        window.alert(result.error ?? "Eliminazione segnalazione non riuscita.");
        return;
      }
      await onChanged();
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;
    if (!window.confirm("Salvare le modifiche admin su questa segnalazione?")) return;
    setBusyId(editForm.id);
    try {
      const result = await updateNextHomeSegnalazioneAdmin({
        id: editForm.id,
        autistaNome: editForm.autistaNome,
        badgeAutista: editForm.badgeAutista,
        targaCamion: editForm.targaCamion,
        targaRimorchio: editForm.targaRimorchio,
        targa: editForm.targa,
        ambito: editForm.ambito,
        tipoProblema: editForm.tipoProblema,
        descrizione: editForm.descrizione,
        note: editForm.note,
        stato: editForm.stato,
        letta: editForm.letta,
        flagVerifica: editForm.flagVerifica,
        motivoVerifica: editForm.motivoVerifica,
        foto: editForm.foto,
        adminNote: editForm.adminNote,
      });
      if (!result.ok) {
        window.alert("Modifica segnalazione non salvata.");
        return;
      }
      setEditForm(null);
      await onChanged();
    } finally {
      setBusyId(null);
    }
  };

  const updateEditForm = (patch: Partial<EditForm>) => {
    setEditForm((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const tableTemplate = "132px minmax(150px,1.25fr) 96px 108px 108px 88px 64px minmax(180px,1fr)";
  const searchIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </svg>
  );

  const renderRows = (title: string, rows: D10SegnalazioneItem[]) => (
    <section
      className={`next-home__seg-group aa-group${title === "Nuove" ? " aa-group--danger" : ""}`}
      aria-label={title}
    >
      <div className="next-home__seg-group-head aa-group-head">
        <span className="aa-group-title">{title}</span>
        <span className="aa-group-count">{rows.length}</span>
      </div>
      {rows.length ? (
        rows.map((item) => {
          const raw = readRawRecord(item);
          const ambito = normalizeText(raw.ambito ?? raw.target ?? item.ambito).toUpperCase() || "-";
          const motrice = normalizeText(raw.targaCamion ?? raw.targaMotrice ?? item.targaCamion ?? item.targaMotrice);
          const rimorchio = normalizeText(raw.targaRimorchio ?? item.targaRimorchio);
          const autista = normalizeText(raw.autistaNome ?? raw.nomeAutista ?? item.autistaNome) || "-";
          const badge = normalizeText(raw.badgeAutista ?? item.badgeAutista) || "-";
          const stato = item.isNuova ? "NUOVA" : normalizeText(raw.stato ?? item.stato) || "letta";
          const hasLinked = Boolean(raw.linkedLavoroId) || (Array.isArray(raw.linkedLavoroIds) && raw.linkedLavoroIds.length > 0);
          const isBusy = busyId === item.id;

          return (
            <article
              key={item.id}
              className={`next-home__seg-row aa-trow${item.isNuova ? " aa-trow--danger" : ""}`}
              style={{ gridTemplateColumns: `${tableTemplate} 168px` }}
            >
              <div className="next-home__seg-time aa-td">{formatDateTimeUI(item.timestamp)}</div>
              <div className="next-home__seg-driver aa-td">
                <span className="aa-td-strong">{autista}</span>
                <span className="aa-td-sub">badge {badge}</span>
              </div>
              <div className="next-home__seg-ambito aa-td">
                <span className="aa-ambito">{ambito}</span>
              </div>
              <div className="next-home__seg-plate aa-td">
                {motrice ? <span className="aa-td-strong">{motrice}</span> : <span className="aa-td-sub">-</span>}
              </div>
              <div className="next-home__seg-plate aa-td">
                {rimorchio ? <span className="aa-td-strong">{rimorchio}</span> : <span className="aa-td-sub">-</span>}
              </div>
              <div className="aa-td">
                <span className={`pill ${item.isNuova ? "pill-danger" : ""}`}>{stato}</span>
              </div>
              <div className="next-home__seg-photo aa-td">
                {item.fotoCount > 0 ? `${item.fotoCount} foto` : <span className="aa-td-sub">-</span>}
              </div>
              <div className="next-home__seg-desc aa-td">
                <span className="aa-td-strong">{item.tipoProblema ?? "Segnalazione"}</span>
                <span className="aa-td-sub">{item.preview}</span>
              </div>
              <div className="next-home__seg-actions aa-td-act">
                <button
                  type="button"
                  className="edit aa-crow-primary"
                  onClick={() => setEditForm(buildEditForm(item))}
                  disabled={isBusy}
                >
                  Modifica
                </button>
                <details className="next-home__seg-actionmenu aa-actionmenu">
                  <summary className="aa-actionmenu-trigger" aria-label="Altre azioni" title="Altre azioni">
                    ...
                  </summary>
                  <div className="aa-actionmenu-pop next-home__seg-actionmenu-pop">
                    <button type="button" className="aa-actionmenu-item" onClick={() => void openSegnalazionePdfPreview(item)} disabled={isBusy}>
                      Anteprima PDF
                    </button>
                    <button type="button" className="aa-actionmenu-item" onClick={() => void handleCreateWork(item)} disabled={isBusy || hasLinked}>
                      Crea lavoro
                    </button>
                    <span className="aa-actionmenu-sep" />
                    <button type="button" className="aa-actionmenu-item danger" onClick={() => void handleDelete(item)} disabled={isBusy}>
                      Elimina
                    </button>
                  </div>
                </details>
              </div>
            </article>
          );
        })
      ) : (
        <div className="next-home__seg-empty">Nessuna segnalazione in questo gruppo.</div>
      )}
    </section>
  );

  return createPortal(
    <>
      <div
        className="next-home__modal-backdrop aix-backdrop aa-module-backdrop"
        role="dialog"
        aria-modal="true"
        aria-label="Segnalazioni"
        onMouseDown={onClose}
      >
        <div className="next-home__seg-modal aix-modal aa-module-window" onMouseDown={(event) => event.stopPropagation()}>
          <div className="next-home__seg-modal-head aix-head aa-module-window-head">
            <div>
              <h3>Segnalazioni</h3>
              <span>{filtered.length} risultati da dati reali</span>
            </div>
            <button type="button" className="next-home__seg-close aix-close" onClick={onClose} aria-label="Chiudi">
              CHIUDI
            </button>
          </div>

          <div className="next-home__seg-body aa-module-window-body">
            <div className="next-home__seg-filters aa-toolbar">
              <div className="aa-search">
                {searchIcon}
                <input
                  value={filterTarga}
                  onChange={(event) => setFilterTarga(event.target.value)}
                  placeholder="Cerca targa..."
                  aria-label="Cerca targa"
                />
              </div>
              <select
                className="aa-sel"
                value={filterAmbito}
                onChange={(event) => setFilterAmbito(event.target.value as "tutti" | "motrice" | "rimorchio")}
                aria-label="Filtro ambito"
              >
                <option value="tutti">Tutti gli ambiti</option>
                <option value="motrice">Motrice</option>
                <option value="rimorchio">Rimorchio</option>
              </select>
              <label className="next-home__seg-check aa-chk">
              <input
                type="checkbox"
                checked={soloNuove}
                onChange={(event) => setSoloNuove(event.target.checked)}
              />
              <span>Solo nuove</span>
            </label>
          </div>

            <div className="next-home__seg-table-head aa-thead" style={{ gridTemplateColumns: `${tableTemplate} 168px` }}>
            <span>Data</span>
            <span>Autista</span>
            <span>Ambito</span>
            <span>Motrice</span>
            <span>Rimorchio</span>
            <span>Stato</span>
            <span>Foto</span>
              <span>Dettaglio</span>
              <span className="aa-th-act">Azioni</span>
          </div>

          <div className="next-home__seg-scroll">
            {filtered.length ? (
              <>
                {renderRows("Nuove", nuove)}
                {renderRows("Lette", lette)}
              </>
            ) : (
              <div className="next-home__seg-empty">Nessuna segnalazione trovata.</div>
            )}
          </div>
          </div>
        </div>
      </div>

      {editForm ? (
        <div
          className="next-home__modal-backdrop next-home__modal-backdrop--nested aix-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Modifica segnalazione"
          onMouseDown={() => setEditForm(null)}
        >
          <div className="next-home__seg-edit-modal aix-modal admin-edit-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="next-home__seg-modal-head aix-head">
              <div>
                <h3>Modifica segnalazione</h3>
                <span>{editForm.id}</span>
              </div>
              <button type="button" className="next-home__seg-close aix-close" onClick={() => setEditForm(null)}>
                CHIUDI
              </button>
            </div>

            <div className="next-home__seg-edit-grid">
              <label>
                <span>Autista</span>
                <input value={editForm.autistaNome} onChange={(event) => updateEditForm({ autistaNome: event.target.value })} />
              </label>
              <label>
                <span>Badge</span>
                <input value={editForm.badgeAutista} onChange={(event) => updateEditForm({ badgeAutista: event.target.value })} />
              </label>
              <label>
                <span>Motrice</span>
                <input value={editForm.targaCamion} onChange={(event) => updateEditForm({ targaCamion: event.target.value })} />
              </label>
              <label>
                <span>Rimorchio</span>
                <input value={editForm.targaRimorchio} onChange={(event) => updateEditForm({ targaRimorchio: event.target.value })} />
              </label>
              <label>
                <span>Targa principale</span>
                <input value={editForm.targa} onChange={(event) => updateEditForm({ targa: event.target.value })} />
              </label>
              <label>
                <span>Ambito</span>
                <input value={editForm.ambito} onChange={(event) => updateEditForm({ ambito: event.target.value })} />
              </label>
              <label>
                <span>Tipo problema</span>
                <input value={editForm.tipoProblema} onChange={(event) => updateEditForm({ tipoProblema: event.target.value })} />
              </label>
              <label>
                <span>Stato</span>
                <input value={editForm.stato} onChange={(event) => updateEditForm({ stato: event.target.value })} />
              </label>
              <label className="next-home__seg-edit-wide">
                <span>Descrizione</span>
                <textarea value={editForm.descrizione} onChange={(event) => updateEditForm({ descrizione: event.target.value })} />
              </label>
              <label className="next-home__seg-edit-wide">
                <span>Note</span>
                <textarea value={editForm.note} onChange={(event) => updateEditForm({ note: event.target.value })} />
              </label>
              <label className="next-home__seg-check">
                <input type="checkbox" checked={editForm.letta} onChange={(event) => updateEditForm({ letta: event.target.checked })} />
                <span>Letta</span>
              </label>
              <label className="next-home__seg-check">
                <input type="checkbox" checked={editForm.flagVerifica} onChange={(event) => updateEditForm({ flagVerifica: event.target.checked })} />
                <span>Da verificare</span>
              </label>
              <label className="next-home__seg-edit-wide">
                <span>Motivo verifica</span>
                <input value={editForm.motivoVerifica} onChange={(event) => updateEditForm({ motivoVerifica: event.target.value })} />
              </label>
              <label className="next-home__seg-edit-wide">
                <span>Nota admin</span>
                <input value={editForm.adminNote} onChange={(event) => updateEditForm({ adminNote: event.target.value })} />
              </label>
            </div>

            {editForm.foto.length ? (
              <div className="next-home__seg-edit-photos">
                {editForm.foto.map((url, index) => (
                  <div key={`${url}:${index}`} className="next-home__seg-edit-photo">
                    <img src={url} alt={`Foto segnalazione ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => updateEditForm({ foto: editForm.foto.filter((_, photoIndex) => photoIndex !== index) })}
                    >
                      Rimuovi
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="next-home__seg-edit-actions">
              <button type="button" onClick={() => setEditForm(null)}>
                Annulla
              </button>
              <button type="button" className="next-home__seg-primary" onClick={() => void handleSaveEdit()} disabled={busyId === editForm.id}>
                Salva
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <PdfPreviewModal
        open={pdfPreviewOpen}
        title="Anteprima PDF segnalazione"
        pdfUrl={pdfPreviewUrl}
        fileName={pdfPreviewFileName}
        hint={pdfShareHint}
        onClose={closePdfPreview}
        onShare={async () => {
          if (!pdfPreviewBlob) return;
          const result = await sharePdfFile({
            blob: pdfPreviewBlob,
            fileName: pdfPreviewFileName,
            title: "Segnalazione autista",
            text: buildPdfShareText({
              contextLabel: "Segnalazione autista",
              dateLabel: formatFileDate(),
              fileName: pdfPreviewFileName,
            }),
          });
          if (result.status === "unsupported") {
            setPdfShareHint("Condivisione non disponibile: scarica il PDF e allegalo manualmente.");
          }
        }}
        onCopyLink={async () => {
          const copied = await copyTextToClipboard(
            buildPdfShareText({
              contextLabel: "Segnalazione autista",
              dateLabel: formatFileDate(),
              fileName: pdfPreviewFileName,
            }),
          );
          setPdfShareHint(copied ? "Testo copiato." : "Copia non disponibile.");
        }}
        onWhatsApp={() => {
          window.open(
            buildWhatsAppShareUrl(
              buildPdfShareText({
                contextLabel: "Segnalazione autista",
                dateLabel: formatFileDate(),
                fileName: pdfPreviewFileName,
              }),
            ),
            "_blank",
            "noopener,noreferrer",
          );
        }}
      />
    </>,
    document.body,
  );
}
