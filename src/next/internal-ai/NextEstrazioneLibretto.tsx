import { useState } from "react";
import type {
  ArchivistaDuplicateCandidate,
  ArchivistaDuplicateChoice,
} from "./ArchivistaArchiveClient";

import {
  applyLibrettoTemplateFieldChange,
  getLibrettoTemplateFieldValue,
} from "./utils/librettoFieldMapper";
import {
  LIBRETTO_LAYOUT_ZONES,
  type LibrettoTemplateField,
} from "./utils/librettoLayoutZones";
import "./next-estrazione-libretto.css";

type NextEstrazioneLibrettoDestinationOption = {
  destination: string;
  label: string;
};

type NextEstrazioneLibrettoVehicleOption = {
  value?: string;
  label?: string;
  targa?: string | null;
};

type NextEstrazioneLibrettoProps = {
  acceptedFileTypes?: string;
  analyzeButtonLabel: string;
  categoryOptions?: string[];
  completionMessage?: string | null;
  confirmState?: {
    tone: "ready" | "blocked" | "saving" | "success" | "error";
    title: string;
    message: string;
    reasons?: string[];
  } | null;
  confirmCompleted: boolean;
  duplicateCandidates?: ArchivistaDuplicateCandidate[];
  duplicateChoice?: ArchivistaDuplicateChoice | null;
  duplicateStatus?: "idle" | "checking" | "ready" | "duplicates_found" | "error";
  debugImages?: {
    finalUrl?: string | null;
    originalUrl?: string | null;
    preprocessUrl?: string | null;
    vinUrl?: string | null;
  };
  debugTrace?: {
    rawUltimoCollaudo?: string | null;
    mappedDataUltimoCollaudo?: string | null;
    propDataUltimoCollaudo?: string | null;
  };
  fileName: string;
  fileTypeLabel: string;
  isAnalyzeDisabled: boolean;
  isConfirmDisabled: boolean;
  isDestinationMenuOpen: boolean;
  isDuplicateCheckDisabled?: boolean;
  isScadenzaRevisioneScaduta: boolean;
  mezzoMode: "esistente" | "nuovo";
  optimizeImageForExtraction?: boolean;
  previewMode?: string | null;
  previewText?: string | null;
  previewTitle?: string | null;
  previewUrl: string | null;
  resetKey?: number;
  saveNewVehicle: boolean;
  selectedTarga: string;
  warnings: string[];
  vinOptimizationUsed?: boolean;
  destinationOptions: NextEstrazioneLibrettoDestinationOption[];
  vehicleOptions: NextEstrazioneLibrettoVehicleOption[];
  getFieldValue: (field: string) => string;
  showSubtypeCard?: boolean;
  showVehicleModeToggle?: boolean;
  onAnalyze: () => void;
  onConfirm: () => void;
  onDiscard: () => void;
  onFieldChange: (field: string, value: string) => void;
  onFileSelect?: (file: File | null) => void;
  onOpenHistory: () => void;
  onOptimizeImageChange?: (checked: boolean) => void;
  onSaveNewVehicleChange: (checked: boolean) => void;
  onSelectDuplicateChoice?: (choice: ArchivistaDuplicateChoice) => void;
  onSelectDuplicateId?: (id: string) => void;
  onSelectDestination: (destination: string) => void;
  onSelectTarga: (targa: string) => void;
  onToggleDestinationMenu: () => void;
  onToggleMezzoMode: (mode: "esistente" | "nuovo") => void;
  onCheckDuplicates?: () => void;
  selectedDuplicateId?: string;
};

function renderTemplateInput(args: {
  field: LibrettoTemplateField;
  getFieldValue: (field: string) => string;
  onFieldChange: (field: string, value: string) => void;
  isScadenzaRevisioneScaduta: boolean;
}) {
  const { field, getFieldValue, isScadenzaRevisioneScaduta, onFieldChange } = args;
  const value = getLibrettoTemplateFieldValue(getFieldValue, field.key);
  const handleChange = (nextValue: string) =>
    applyLibrettoTemplateFieldChange({
      key: field.key,
      value: nextValue,
      getFieldValue,
      onFieldChange,
    });

  if (field.variant === "plate") {
    return (
      <div className="iai-template-plate">
        <span className="iai-template-plate__side">
          <span className="iai-template-plate__star">*</span>
          <span className="iai-template-plate__country">CH</span>
        </span>
        <input
          type="text"
          className="iai-template-plate__input"
          value={value}
          onChange={(event) => handleChange(event.target.value.toUpperCase())}
        />
      </div>
    );
  }

  const inputClassName = [
    "iai-template-input",
    field.variant === "mono" ? "is-mono" : "",
    field.variant === "date" ? "is-date" : "",
    field.inputType === "textarea" ? "is-textarea" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (field.inputType === "textarea") {
    return (
      <textarea
        className={inputClassName}
        rows={4}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
      />
    );
  }

  return (
    <div className="iai-template-input-wrap">
      <input
        type="text"
        className={inputClassName}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
      />
      {field.key === "prossimoCollaudoRevisione" ? (
        <span className={`iai-template-badge ${isScadenzaRevisioneScaduta ? "is-expired" : "is-active"}`}>
          {isScadenzaRevisioneScaduta ? "Scaduto" : "Registrato"}
        </span>
      ) : null}
    </div>
  );
}

function NextEstrazioneLibretto({
  acceptedFileTypes = "image/*,application/pdf",
  analyzeButtonLabel,
  categoryOptions = [],
  completionMessage = null,
  confirmState = null,
  confirmCompleted,
  duplicateCandidates = [],
  duplicateChoice = null,
  duplicateStatus = "idle",
  debugImages,
  debugTrace,
  destinationOptions,
  fileName,
  fileTypeLabel,
  getFieldValue,
  isAnalyzeDisabled,
  isConfirmDisabled,
  isDestinationMenuOpen,
  isDuplicateCheckDisabled = false,
  isScadenzaRevisioneScaduta,
  mezzoMode,
  optimizeImageForExtraction = true,
  onAnalyze,
  onCheckDuplicates,
  onConfirm,
  onDiscard,
  onFieldChange,
  onFileSelect,
  onOpenHistory,
  onOptimizeImageChange,
  onSaveNewVehicleChange,
  onSelectDuplicateChoice,
  onSelectDuplicateId,
  onSelectDestination,
  onSelectTarga,
  onToggleDestinationMenu,
  onToggleMezzoMode,
  previewMode,
  previewText,
  previewTitle,
  previewUrl,
  resetKey = 0,
  saveNewVehicle,
  selectedDuplicateId = "",
  showSubtypeCard = true,
  showVehicleModeToggle = true,
  selectedTarga,
  vinOptimizationUsed = false,
  vehicleOptions,
  warnings,
}: NextEstrazioneLibrettoProps) {
  const [viewerZoom, setViewerZoom] = useState(1);
  const [viewerRotation, setViewerRotation] = useState(0);
  const handleCheckDuplicates = onCheckDuplicates ?? (() => undefined);
  const handleSelectDuplicateChoice = onSelectDuplicateChoice ?? (() => undefined);
  const handleSelectDuplicateId = onSelectDuplicateId ?? (() => undefined);
  const fieldDataUltimoCollaudo = getFieldValue("dataUltimoCollaudo");
  const fieldDataScadenzaRevisione = getFieldValue("dataScadenzaRevisione");
  const canTransformViewer = Boolean(previewUrl && previewMode === "image");
  const shouldShowDebugImages =
    import.meta.env.DEV &&
    Boolean(debugImages?.originalUrl || debugImages?.preprocessUrl || debugImages?.finalUrl);
  const hasDuplicateCandidates = duplicateCandidates.length > 0;

  return (
    <div className="iai-libretto-extraction">
      <header className="iai-topbar">
        <span className="iai-topbar-label">IA 2</span>
        <button type="button" className="iai-btn-storico" onClick={onOpenHistory}>
          Vai a storico &rarr;
        </button>
      </header>

      <section className="iai-hero">
        <h1 className="iai-hero-title">Importa documenti</h1>
      </section>

      <section className="iai-content">
        <section className="iai-card">
          <p className="iai-sec-label">Destinazione rilevata</p>
          <div className="iai-dest-row">
            <div className="iai-dest-badge">
              <span className="iai-dest-dot" />
              <span className="iai-dest-name">Documento mezzo</span>
              <span className="iai-dest-arrow">&rarr;</span>
              <span className="iai-dest-ctx">Libretto</span>
            </div>
            <details
              className={`iai-dest-control ${isDestinationMenuOpen ? "is-open" : ""}`}
              open={isDestinationMenuOpen}
            >
              <summary className="iai-btn-cambia" onClick={onToggleDestinationMenu}>
                Destinazione errata? Cambia &#9662;
              </summary>
              <div className={`iai-dest-dropdown ${isDestinationMenuOpen ? "is-open" : ""}`}>
                <div className="iai-dd-sublabel">Destinazioni alternative</div>
                {destinationOptions.map((option) => (
                  <button
                    key={`${option.destination}:${option.label}`}
                    type="button"
                    className="iai-dd-item"
                    onClick={() => onSelectDestination(option.destination)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </details>
          </div>
        </section>

        {showSubtypeCard ? (
          <section className="iai-card">
            <p className="iai-sec-label">Modello documento</p>
            <div className="iai-subtype-shell">
              <div className="iai-subtype-tab">
                <span className="iai-subtype-dot" />
                <span className="iai-subtype-label">Libretto svizzero</span>
              </div>
              <p className="iai-libretto-subtype-note">
                Estrattore dedicato a layout fisso con zone stabili del libretto.
              </p>
            </div>
          </section>
        ) : null}

        <section className="iai-card">
          <p className="iai-sec-label">Carica documento</p>
          <p className="iai-upload-hint">
            Foto o scansione immagine del libretto. Questo ramo usa una pipeline dedicata al
            layout fisso del documento.
          </p>
          <div className="iai-upload-row">
            {onFileSelect ? (
              <label className="iai-upload-picker">
                <span className="iai-btn-upload">Scegli file</span>
                <input
                  key={`file-input:${resetKey}`}
                  type="file"
                  accept={acceptedFileTypes}
                  className="iai-upload-input"
                  onChange={(event) => onFileSelect(event.target.files?.[0] ?? null)}
                />
              </label>
            ) : null}
            <div className="iai-file-chip">
              <span className="iai-doc-icon">DOC</span>
              <span>{fileName}</span>
              <span className="iai-chip-badge">{fileTypeLabel}</span>
            </div>
          </div>
          <div className="iai-upload-row">
            <p className="iai-upload-hint">
              Sopra vedi l&apos;immagine reale. Sotto trovi il template fisso del libretto sempre
              editabile.
            </p>
            <button
              type="button"
              className="iai-btn-analizza"
              disabled={isAnalyzeDisabled}
              onClick={onAnalyze}
            >
              {analyzeButtonLabel}
            </button>
          </div>
          <div className="iai-upload-row">
            <label className="iai-checkline">
              <input
                type="checkbox"
                checked={optimizeImageForExtraction}
                onChange={(event) => onOptimizeImageChange?.(event.currentTarget.checked)}
              />
              Ottimizza immagine per estrazione
            </label>
          </div>
        </section>

        {warnings.length > 0 ? (
          <section className="iai-avvisi-banner">
            <span className="iai-avviso-dot">!</span>
            <div className="iai-avviso-content">
              <p className="iai-avviso-label">Avvisi e campi mancanti</p>
              <ul className="iai-avviso-list">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {completionMessage ? (
          <section className="iai-completion-banner" aria-live="polite">
            <strong>Salvataggio completato</strong>
            <p>{completionMessage}</p>
          </section>
        ) : null}

        <section className="iai-viewer">
          <div className="iai-viewer-toolbar">
            <strong className="iai-viewer-filename">{fileName}</strong>
            <button
              type="button"
              className="iai-viewer-btn"
              disabled={!canTransformViewer}
              onClick={() =>
                setViewerZoom((current) => Math.min(3, Number((current + 0.25).toFixed(2))))
              }
            >
              Zoom +
            </button>
            <button
              type="button"
              className="iai-viewer-btn"
              disabled={!canTransformViewer}
              onClick={() =>
                setViewerZoom((current) => Math.max(0.5, Number((current - 0.25).toFixed(2))))
              }
            >
              Zoom -
            </button>
            <button
              type="button"
              className="iai-viewer-btn"
              disabled={!canTransformViewer}
              onClick={() => setViewerRotation((current) => (current + 90) % 360)}
            >
              Ruota
            </button>
          </div>
          <div className="iai-viewer-body">
            {previewUrl && previewMode === "image" ? (
              <img
                src={previewUrl}
                alt={previewTitle ?? "Documento caricato"}
                className="iai-viewer-img"
                style={{ transform: `scale(${viewerZoom}) rotate(${viewerRotation}deg)` }}
              />
            ) : previewUrl ? (
              <iframe
                title={previewTitle ?? "Documento caricato"}
                src={previewUrl}
                className="iai-viewer-frame"
              />
            ) : previewText ? (
              <pre className="iai-viewer-text">{previewText}</pre>
            ) : (
              <div className="iai-viewer-placeholder">
                <span className="iai-viewer-placeholder-icon">DOC</span>
                <strong className="iai-viewer-placeholder-name">{fileName}</strong>
                <p>Documento caricato</p>
              </div>
            )}
          </div>
        </section>

        {shouldShowDebugImages ? (
          <section className="iai-card">
            <p className="iai-sec-label">Debug ottimizzazione</p>
            <p className="iai-upload-hint" style={{ marginBottom: "10px" }}>
              Zona telaio ottimizzata usata: {vinOptimizationUsed ? "SI" : "NO"}
            </p>
            <div className="iai-debug-image-grid">
              {[
                { label: "Immagine originale", url: debugImages?.originalUrl },
                { label: "Immagine preprocessata", url: debugImages?.preprocessUrl },
                { label: "Immagine finale inviata", url: debugImages?.finalUrl },
                { label: "Zona telaio ottimizzata", url: debugImages?.vinUrl },
              ]
                .filter((entry) => Boolean(entry.url))
                .map((entry) => (
                  <div key={entry.label}>
                    <p className="iai-sec-label" style={{ marginBottom: "6px" }}>
                      {entry.label}
                    </p>
                    <div className="iai-viewer-body iai-viewer-body--debug">
                      <img
                        src={entry.url ?? undefined}
                        alt={entry.label}
                        className="iai-viewer-img"
                        style={{ maxHeight: "180px" }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </section>
        ) : null}

        {import.meta.env.DEV ? (
          <section className="iai-card">
            <p className="iai-sec-label">Debug date libretto</p>
            <div className="iai-template-debug-list">
              <div>raw ultimo collaudo: {debugTrace?.rawUltimoCollaudo || "-"}</div>
              <div>mapped ultimo collaudo: {debugTrace?.mappedDataUltimoCollaudo || "-"}</div>
              <div>prop ultimo collaudo: {debugTrace?.propDataUltimoCollaudo || "-"}</div>
              <div>field ultimo collaudo: {fieldDataUltimoCollaudo || "-"}</div>
              <div>field prossimo collaudo / revisione: {fieldDataScadenzaRevisione || "-"}</div>
            </div>
          </section>
        ) : null}

        <section className="iai-libretto-template iai-libretto-sheet">
          <header className="iai-libretto-template__header">
            <div>
              <p className="iai-libretto-template__eyebrow">Copia editabile del documento</p>
              <h2>Replica fedele del libretto svizzero</h2>
            </div>
            <span className="iai-libretto-template__tag">Campi editabili</span>
          </header>

          <div className="iai-libretto-sheet__paper">
            {LIBRETTO_LAYOUT_ZONES.map((zone) => (
              <section key={zone.id} className="iai-libretto-zone iai-libretto-sheet__band">
              <div className="iai-libretto-zone__header">
                <div>
                  <h3>{zone.title}</h3>
                </div>
              </div>
              <div
                className="iai-libretto-zone__grid"
                style={{ gridTemplateColumns: `repeat(${zone.columns}, minmax(0, 1fr))` }}
              >
                {zone.fields.map((field) => (
                  <label
                    key={field.key}
                    className="iai-libretto-zone__field"
                    style={{ gridColumn: `span ${field.colSpan ?? 1}` }}
                  >
                    <span className="iai-libretto-zone__label">{field.label}</span>
                    {renderTemplateInput({
                      field,
                      getFieldValue,
                      isScadenzaRevisioneScaduta,
                      onFieldChange,
                    })}
                  </label>
                ))}
              </div>
              </section>
            ))}
          </div>
        </section>

        <section className="iai-link-dup-grid">
          <article className="iai-card">
            <p className="iai-sec-label">Collegamento al mezzo</p>
            {showVehicleModeToggle ? (
              <div className="iai-vehicle-toggle">
                <button
                  type="button"
                  className={`iai-toggle-btn ${mezzoMode === "esistente" ? "is-active" : ""}`}
                  onClick={() => onToggleMezzoMode("esistente")}
                >
                  Collega a mezzo esistente
                </button>
                <button
                  type="button"
                  className={`iai-toggle-btn ${mezzoMode === "nuovo" ? "is-active" : ""}`}
                  onClick={() => onToggleMezzoMode("nuovo")}
                >
                  + Crea nuovo mezzo
                </button>
              </div>
            ) : null}

            {mezzoMode === "esistente" || !showVehicleModeToggle ? (
              <>
                <label className="iai-field-code">Seleziona il mezzo</label>
                <select
                  className="iai-field-select"
                  value={selectedTarga}
                  onChange={(event) => onSelectTarga(event.target.value)}
                >
                  <option value="">Seleziona il mezzo</option>
                  {vehicleOptions.map((mezzo, index) => (
                    <option
                      key={`${mezzo.value ?? mezzo.targa ?? "mezzo"}:${index}`}
                      value={mezzo.value ?? mezzo.targa ?? ""}
                    >
                      {mezzo.label ?? mezzo.targa ?? "-"}
                    </option>
                  ))}
                </select>
                <div className="iai-divider" />
                <label className="iai-checkline">
                  <input
                    type="checkbox"
                    checked={saveNewVehicle}
                    onChange={(event) => onSaveNewVehicleChange(event.currentTarget.checked)}
                  />
                  Aggiorna anche i campi del mezzo dopo l&apos;archiviazione
                </label>
              </>
            ) : (
              <>
                <div className="iai-newvehicle-banner">
                  <span className="iai-newvehicle-dot" />
                  <p>
                    I campi del template sono gia compilati con i valori letti dal libretto.
                    Controlla e correggi prima di salvare.
                  </p>
                </div>
                <div className="iai-libretto-grid iai-libretto-grid--2">
                  <label className="iai-field-wrap">
                    <span className="iai-field-code">Categoria</span>
                    <select
                      className="iai-field-select"
                      value={getFieldValue("categoria")}
                      onChange={(event) => onFieldChange("categoria", event.target.value)}
                    >
                      <option value="">Seleziona categoria</option>
                      {categoryOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="iai-field-wrap">
                    <span className="iai-field-code">Targa</span>
                    <input
                      type="text"
                      className="iai-field-input iai-field-input--mono"
                      value={getFieldValue("targa")}
                      onChange={(event) => onFieldChange("targa", event.target.value.toUpperCase())}
                    />
                  </label>
                  <label className="iai-field-wrap">
                    <span className="iai-field-code">Marca e tipo</span>
                    <input
                      type="text"
                      className="iai-field-input iai-field-input--bold"
                      value={getLibrettoTemplateFieldValue(getFieldValue, "marcaTipo")}
                      onChange={(event) =>
                        applyLibrettoTemplateFieldChange({
                          key: "marcaTipo",
                          value: event.target.value,
                          getFieldValue,
                          onFieldChange,
                        })
                      }
                    />
                  </label>
                  <label className="iai-field-wrap">
                    <span className="iai-field-code">Genere veicolo</span>
                    <input
                      type="text"
                      className="iai-field-input"
                      value={getFieldValue("genereVeicolo")}
                      onChange={(event) => onFieldChange("genereVeicolo", event.target.value)}
                    />
                  </label>
                </div>
                <label className="iai-checkline">
                  <input
                    type="checkbox"
                    checked={saveNewVehicle}
                    onChange={(event) => onSaveNewVehicleChange(event.currentTarget.checked)}
                  />
                  Salva il nuovo mezzo in anagrafica al momento dell&apos;archiviazione
                </label>
              </>
            )}
          </article>

          <article className="iai-card">
            <p className="iai-sec-label">Controllo duplicati</p>
            <h4 className="iai-dup-title">Archivio documento mezzo</h4>
            <p className="iai-upload-hint iai-dup-copy">
              Archivista controlla i duplicati prima della conferma finale, senza usare un parser
              generico.
            </p>
            <button
              type="button"
              className="iai-btn-duplicate"
              disabled={isDuplicateCheckDisabled}
              onClick={handleCheckDuplicates}
            >
              {duplicateStatus === "checking" ? "Controllo in corso..." : "Controlla duplicati"}
            </button>
            {hasDuplicateCandidates ? (
              <div className="iai-dup-results">
                {duplicateCandidates.map((candidate) => (
                  <article
                    key={candidate.id}
                    className={`iai-dup-card ${selectedDuplicateId === candidate.id ? "is-selected" : ""}`}
                  >
                    <div className="iai-dup-card__head">
                      <strong>{candidate.title}</strong>
                      <button
                        type="button"
                        className="iai-dup-card__select"
                        onClick={() => handleSelectDuplicateId(candidate.id)}
                      >
                        {selectedDuplicateId === candidate.id ? "Selezionato" : "Usa questo"}
                      </button>
                    </div>
                    <p>{candidate.subtitle || "Archivio esistente"}</p>
                    {candidate.matchedFields.length ? (
                      <div className="iai-dup-card__pills">
                        {candidate.matchedFields.map((field) => (
                          <span key={field} className="iai-dup-card__pill">
                            {field}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : duplicateStatus === "ready" ? (
              <div className="iai-dup-empty is-ready">
                <strong>Nessun duplicato forte</strong>
                <p>Puoi procedere con la conferma finale dell&apos;archiviazione.</p>
              </div>
            ) : (
              <div className="iai-dup-empty">
                <strong>Controllo non ancora eseguito</strong>
                <p>Prima della conferma puoi verificare se esiste gia un libretto simile in archivio.</p>
              </div>
            )}
            {hasDuplicateCandidates ? (
              <div className="iai-dup-choice-grid">
                <button
                  type="button"
                  className={`iai-dup-choice ${duplicateChoice === "stesso_documento" ? "is-active" : ""}`}
                  onClick={() => handleSelectDuplicateChoice("stesso_documento")}
                >
                  Stesso documento
                </button>
                <button
                  type="button"
                  className={`iai-dup-choice ${duplicateChoice === "versione_migliore" ? "is-active" : ""}`}
                  onClick={() => handleSelectDuplicateChoice("versione_migliore")}
                >
                  Versione migliore
                </button>
                <button
                  type="button"
                  className={`iai-dup-choice ${duplicateChoice === "documento_diverso" ? "is-active" : ""}`}
                  onClick={() => handleSelectDuplicateChoice("documento_diverso")}
                >
                  Documento diverso
                </button>
              </div>
            ) : null}
          </article>
        </section>

        {confirmState ? (
          <section className={`iai-confirm-state is-${confirmState.tone}`}>
            <strong>{confirmState.title}</strong>
            <p>{confirmState.message}</p>
            {confirmState.reasons?.length ? (
              <ul className="iai-confirm-state__list">
                {confirmState.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        <div className="iai-confirm-bar">
          <div>
            <strong className="iai-confirm-title">Conferma archiviazione</strong>
            <p className="iai-confirm-subtitle">
              Il documento verra archiviato. L&apos;update del mezzo parte solo se lo confermi.
            </p>
          </div>
          <button type="button" className="iai-btn-scarta" onClick={onDiscard}>
            Scarta documento
          </button>
          <button
            type="button"
            className={`iai-btn-conferma ${confirmCompleted ? "is-complete" : ""}`}
            onClick={onConfirm}
            disabled={isConfirmDisabled}
          >
            {confirmCompleted ? "✔ Archiviato" : "Conferma e archivia →"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default NextEstrazioneLibretto;
