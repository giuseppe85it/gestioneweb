import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  NEXT_HOME_PATH,
  NEXT_IA_PATH,
  NEXT_INTERNAL_AI_ARTIFACTS_PATH,
  NEXT_INTERNAL_AI_AUDIT_PATH,
  NEXT_INTERNAL_AI_PATH,
  NEXT_INTERNAL_AI_REQUESTS_PATH,
  NEXT_INTERNAL_AI_SESSIONS_PATH,
} from "./nextStructuralPaths";
import {
  archiveInternalAiArtifact,
  readInternalAiScaffoldSnapshot,
  saveInternalAiDraftArtifact,
} from "./internal-ai/internalAiMockRepository";
import { runInternalAiChatTurn } from "./internal-ai/internalAiChatOrchestrator";
import {
  readInternalAiEconomicAnalysisPreview,
  type InternalAiEconomicAnalysisReadResult,
} from "./internal-ai/internalAiEconomicAnalysisFacade";
import {
  readInternalAiVehicleReportPreview,
  type InternalAiVehicleReportReadResult,
} from "./internal-ai/internalAiVehicleReportFacade";
import {
  findInternalAiExactVehicleMatch,
  matchInternalAiVehicleLookupCandidates,
  normalizeInternalAiVehicleLookupQuery,
  readInternalAiVehicleLookupCatalog,
} from "./internal-ai/internalAiVehicleLookup";
import {
  readInternalAiTrackingSummary,
  subscribeInternalAiTracking,
  trackInternalAiArtifactAction,
  trackInternalAiChatPrompt,
  trackInternalAiScreenVisit,
  trackInternalAiVehicleSearch,
  trackInternalAiVehicleSelection,
} from "./internal-ai/internalAiTracking";
import type {
  InternalAiApprovalState,
  InternalAiChatExecutionStatus,
  InternalAiChatMessage,
  InternalAiEconomicAnalysisPreview,
  InternalAiPreviewState,
  InternalAiVehicleLookupCandidate,
  InternalAiVehicleLookupMatchState,
  InternalAiVehicleReportPreview,
  NextInternalAiSectionId,
} from "./internal-ai/internalAiTypes";
import "./next-shell.css";
import "./internal-ai/internal-ai.css";

type NextInternalAiPageProps = {
  sectionId?: NextInternalAiSectionId;
};

type ReportSearchState =
  | {
      status: "idle";
      message: string | null;
      report: null;
      draftMessage: string | null;
    }
  | {
      status: "loading";
      message: string;
      report: null;
      draftMessage: string | null;
    }
  | {
      status: "invalid_query" | "not_found" | "error";
      message: string;
      report: null;
      draftMessage: string | null;
    }
  | {
      status: "ready";
      message: string;
      report: InternalAiVehicleReportPreview;
      draftMessage: string | null;
    };

type EconomicAnalysisState =
  | {
      status: "idle";
      message: string | null;
      preview: null;
    }
  | {
      status: "loading";
      message: string;
      preview: null;
    }
  | {
      status: "invalid_query" | "not_found" | "error";
      message: string;
      preview: null;
    }
  | {
      status: "ready";
      message: string;
      preview: InternalAiEconomicAnalysisPreview;
    };

type ActivePreviewKind = "report" | "analysis";
type VehicleReportSectionGroupId =
  | "lavori"
  | "manutenzioni_gomme"
  | "rifornimenti"
  | "materiali"
  | "documenti_costi"
  | "altri";

type LookupCatalogState =
  | {
      status: "loading";
      items: InternalAiVehicleLookupCandidate[];
      message: string | null;
    }
  | {
      status: "ready";
      items: InternalAiVehicleLookupCandidate[];
      message: string | null;
    }
  | {
      status: "error";
      items: InternalAiVehicleLookupCandidate[];
      message: string;
    };

const SECTION_CONFIGS: Record<
  NextInternalAiSectionId,
  { title: string; description: string; path: string }
> = {
  overview: {
    title: "Panoramica",
    description: "Assistente centrale, report in anteprima in sola lettura e archivio locale isolato.",
    path: NEXT_INTERNAL_AI_PATH,
  },
  sessions: {
    title: "Sessioni",
    description: "Registro locale `ai_sessions` per anteprima e revisione.",
    path: NEXT_INTERNAL_AI_SESSIONS_PATH,
  },
  requests: {
    title: "Richieste",
    description: "Stati `ai_requests` con anteprima, approvazione, revisione e scarto solo simulati.",
    path: NEXT_INTERNAL_AI_REQUESTS_PATH,
  },
  artifacts: {
    title: "Archivio risultati IA",
    description: "Archivio locale isolato del sottosistema IA, separato dai dati business.",
    path: NEXT_INTERNAL_AI_ARTIFACTS_PATH,
  },
  audit: {
    title: "Registro audit",
    description: "Audit locale e tracciamento d'uso in memoria confinati al subtree IA interno.",
    path: NEXT_INTERNAL_AI_AUDIT_PATH,
  },
};

const PREVIEW_STATUS_LABELS: Record<string, string> = {
  idle: "In attesa",
  preview_ready: "Anteprima pronta",
  revision_requested: "Da rivedere",
  discarded: "Scartata",
};

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  not_requested: "Non richiesta",
  awaiting_approval: "Approvabile",
  approved: "Approvata",
  rejected: "Respinta",
  revision_requested: "Revisione richiesta",
};

const REQUEST_TARGET_LABELS: Record<string, string> = {
  "report-page": "Report targa in anteprima",
  tracking: "Tracciamento isolato",
  "artifact-archive": "Archivio risultati IA",
};

const SECTION_STATUS_LABELS: Record<string, string> = {
  completa: "Completa",
  parziale: "Parziale",
  vuota: "Vuota",
  errore: "Errore",
};

const SOURCE_STATUS_LABELS: Record<string, string> = {
  disponibile: "Disponibile",
  parziale: "Parziale",
  errore: "Errore",
};

const SESSION_STATUS_LABELS: Record<string, string> = {
  draft: "Bozza",
  active_preview: "Anteprima attiva",
  review_queue: "In revisione",
  closed: "Chiusa",
};

const ARTIFACT_STATUS_LABELS: Record<string, string> = {
  draft: "Bozza",
  preview: "Anteprima",
  archived: "Archiviato",
};

const ARTIFACT_KIND_LABELS: Record<string, string> = {
  report_preview: "Report in anteprima",
  contract_catalog: "Catalogo contratti segnaposto",
  retrieval_snapshot: "Snapshot recupero contesto",
  checklist: "Checklist",
};

const ARTIFACT_STORAGE_LABELS: Record<string, string> = {
  mock_memory_only: "Solo memoria locale",
  local_storage_isolated: "Archivio locale isolato",
};

const AUDIT_SEVERITY_LABELS: Record<string, string> = {
  info: "Informazione",
  warning: "Avviso",
  critical: "Critico",
};

const AUDIT_RISK_LABELS: Record<string, string> = {
  low: "Basso",
  medium: "Medio",
  high: "Alto",
};

const AUDIT_SCOPE_LABELS: Record<string, string> = {
  preview: "Anteprima",
  tracking: "Tracciamento",
  artifacts: "Archivio risultati IA",
  "report-preview": "Report targa",
};

const CHAT_STATUS_LABELS: Record<InternalAiChatExecutionStatus, string> = {
  idle: "Pronta",
  running: "In elaborazione",
  completed: "Eseguita",
  partial: "Parziale",
  not_supported: "Non supportata",
  failed: "Errore",
};

const CHAT_SUGGESTIONS = [
  "Cosa puoi fare",
  "Crea report targa AB123CD",
  "Genera anteprima per la targa TI123456",
];

const LOOKUP_MATCH_LABELS: Record<InternalAiVehicleLookupMatchState, string> = {
  idle: "In attesa",
  loading: "Caricamento",
  empty_query: "Inserimento richiesto",
  no_match: "Nessuna corrispondenza",
  exact_match: "Corrispondenza precisa",
  multiple_matches: "Selezione richiesta",
  selected: "Mezzo selezionato",
  error: "Errore",
};

const VEHICLE_SEARCH_RESULT_LABELS: Record<string, string> = {
  selected: "Selezionata",
  ready: "Anteprima eseguita",
  not_found: "Non trovata",
  invalid_query: "Query non valida",
};

const ARTIFACT_ACTION_LABELS: Record<string, string> = {
  saved: "Salvato",
  opened: "Aperto",
  archived: "Archiviato",
};

function statusToneClass(status: string) {
  if (
    status.includes("warning") ||
    status.includes("awaiting") ||
    status.includes("revision") ||
    status.includes("preview") ||
    status.includes("parziale")
  ) {
    return "internal-ai-pill is-warning";
  }

  if (status.includes("reject") || status.includes("discard") || status.includes("errore")) {
    return "internal-ai-pill is-danger";
  }

  return "internal-ai-pill is-neutral";
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("it-IT");
}

function renderPreviewState(previewState: InternalAiPreviewState) {
  return (
    <div className="internal-ai-state-line">
      <div className="internal-ai-pill-row">
        <span className={statusToneClass(previewState.status)}>
          Anteprima: {PREVIEW_STATUS_LABELS[previewState.status] ?? previewState.status}
        </span>
        <span className="internal-ai-pill is-neutral">{formatDateLabel(previewState.updatedAt)}</span>
      </div>
      <p className="internal-ai-muted">{previewState.note}</p>
    </div>
  );
}

function renderApprovalState(approvalState: InternalAiApprovalState) {
  return (
    <div className="internal-ai-state-line">
      <div className="internal-ai-pill-row">
        <span className={statusToneClass(approvalState.status)}>
          Stato: {APPROVAL_STATUS_LABELS[approvalState.status] ?? approvalState.status}
        </span>
        <span className="internal-ai-pill is-neutral">{approvalState.requestedBy}</span>
      </div>
      <p className="internal-ai-muted">{approvalState.note}</p>
    </div>
  );
}

function reportCardToneClass(
  tone: InternalAiVehicleReportPreview["cards"][number]["tone"],
) {
  if (tone === "success") {
    return "internal-ai-summary-card is-success";
  }

  if (tone === "warning") {
    return "internal-ai-summary-card is-warning";
  }

  return "internal-ai-summary-card";
}

const REPORT_PRIMARY_GROUPS: {
  id: VehicleReportSectionGroupId;
  title: string;
  description: string;
}[] = [
  {
    id: "lavori",
    title: "Lavori",
    description: "Attivita aperte, chiuse o rilevanti per il mezzo.",
  },
  {
    id: "manutenzioni_gomme",
    title: "Manutenzioni e gomme",
    description: "Stato tecnico, interventi e componenti soggetti a usura.",
  },
  {
    id: "rifornimenti",
    title: "Rifornimenti",
    description: "Consumi, rifornimenti e segnali collegati all'utilizzo del mezzo.",
  },
  {
    id: "materiali",
    title: "Materiali",
    description: "Movimenti materiali collegati al mezzo quando leggibili dal clone.",
  },
  {
    id: "documenti_costi",
    title: "Documenti e costi",
    description: "Documenti economici e costi diretti leggibili in modo affidabile.",
  },
];

function classifyVehicleReportSection(section: InternalAiVehicleReportPreview["sections"][number]): VehicleReportSectionGroupId {
  const haystack = `${section.title} ${section.summary}`.toLowerCase();

  if (haystack.includes("lavor")) return "lavori";
  if (
    haystack.includes("manut") ||
    haystack.includes("gomm") ||
    haystack.includes("pneumat") ||
    haystack.includes("tagliand")
  ) {
    return "manutenzioni_gomme";
  }
  if (
    haystack.includes("riforn") ||
    haystack.includes("carbur") ||
    haystack.includes("consum") ||
    haystack.includes("gasolio")
  ) {
    return "rifornimenti";
  }
  if (haystack.includes("material")) return "materiali";
  if (
    haystack.includes("document") ||
    haystack.includes("cost") ||
    haystack.includes("econom") ||
    haystack.includes("preventiv") ||
    haystack.includes("procurement")
  ) {
    return "documenti_costi";
  }

  return "altri";
}

function renderReportSectionContent(
  section: InternalAiVehicleReportPreview["sections"][number],
) {
  return (
    <>
      {section.bullets.length ? (
        <ul className="internal-ai-inline-list">
          {section.bullets.map((bullet, bulletIndex) => (
            <li key={`${section.id}:bullet:${bulletIndex}`}>{bullet}</li>
          ))}
        </ul>
      ) : null}
      {section.notes.length ? (
        <details className="internal-ai-inline-disclosure">
          <summary className="internal-ai-inline-disclosure__summary">Mostra dettagli</summary>
          <div className="internal-ai-inline-disclosure__content">
            <ul className="internal-ai-inline-list">
              {section.notes.map((note, noteIndex) => (
                <li key={`${section.id}:note:${noteIndex}`}>{note}</li>
              ))}
            </ul>
          </div>
        </details>
      ) : null}
    </>
  );
}

function renderVehicleReportPreview(args: {
  report: InternalAiVehicleReportPreview;
  draftMessage: string | null;
  onMarkRevisionRequested: () => void;
  onMarkApprovable: () => void;
  onDiscardPreview: () => void;
  onSaveDraftArtifact: () => void;
}) {
  const {
    report,
    draftMessage,
    onMarkRevisionRequested,
    onMarkApprovable,
    onDiscardPreview,
    onSaveDraftArtifact,
  } = args;
  const primaryCards = report.cards.slice(0, 3);
  const secondaryCards = report.cards.slice(3);
  const groupedSections = REPORT_PRIMARY_GROUPS.map((group) => ({
    ...group,
    items: report.sections.filter((section) => classifyVehicleReportSection(section) === group.id),
  })).filter((group) => group.items.length > 0);
  const visibleGroups =
    groupedSections.length > 0
      ? groupedSections
      : [
          {
            id: "altri" as VehicleReportSectionGroupId,
            title: "Quadro generale",
            description: "Sezioni disponibili per il mezzo nella preview corrente.",
            items: report.sections,
          },
        ];
  const secondarySections =
    groupedSections.length > 0
      ? report.sections.filter((section) => classifyVehicleReportSection(section) === "altri")
      : [];

  return (
    <section className="internal-ai-report internal-ai-preview-sheet">
      <article className="next-panel internal-ai-report__hero">
        <div className="internal-ai-report__hero-main">
          <div className="internal-ai-report__kicker-row">
            <span className="internal-ai-report__kicker">Report mezzo</span>
            <span className="internal-ai-pill is-neutral">
              Generata il {formatDateLabel(report.generatedAt)}
            </span>
          </div>
          <h2>{report.title}</h2>
          <p className="next-panel__description">{report.subtitle}</p>
          <div className="internal-ai-report__hero-meta">
            <span className={statusToneClass(report.previewState.status)}>
              {PREVIEW_STATUS_LABELS[report.previewState.status] ?? report.previewState.status}
            </span>
            <span className={statusToneClass(report.approvalState.status)}>
              {APPROVAL_STATUS_LABELS[report.approvalState.status] ?? report.approvalState.status}
            </span>
          </div>
          <div className="internal-ai-report__identity">
            <div className="internal-ai-report__identity-card">
              <span>Targa</span>
              <strong>{report.header.targa}</strong>
            </div>
            <div className="internal-ai-report__identity-card">
              <span>Categoria</span>
              <strong>{report.header.categoria ?? "Non disponibile"}</strong>
            </div>
            <div className="internal-ai-report__identity-card">
              <span>Marca / modello</span>
              <strong>{report.header.marcaModello ?? "Non disponibile"}</strong>
            </div>
            <div className="internal-ai-report__identity-card">
              <span>Autista</span>
              <strong>{report.header.autistaNome ?? "Non disponibile"}</strong>
            </div>
          </div>
        </div>

        <div className="internal-ai-report__hero-side internal-ai-report__hero-side--compact">
          <p className="internal-ai-report__hero-note">
            Sintesi pronta in formato dossier, con dettagli tecnici e fonti disponibili solo su
            richiesta.
          </p>
          <div className="internal-ai-report__facts">
            <div className="internal-ai-report__fact">
              <span>Revisione</span>
              <strong>{report.header.revisione ?? "Non disponibile"}</strong>
            </div>
            <div className="internal-ai-report__fact">
              <span>Libretto</span>
              <strong>{report.header.librettoPresente ? "Presente" : "Assente"}</strong>
            </div>
            <div className="internal-ai-report__fact">
              <span>Manutenzione</span>
              <strong>{report.header.manutenzioneProgrammata ? "Programmata" : "Non programmata"}</strong>
            </div>
          </div>
        </div>
      </article>

      <section className="internal-ai-report__cards internal-ai-report__cards--executive">
        {primaryCards.map((card, cardIndex) => (
          <article key={`${card.label}:${cardIndex}`} className={reportCardToneClass(card.tone)}>
            <p className="internal-ai-card__eyebrow">{card.label}</p>
            <h3>{card.value}</h3>
            <p className="internal-ai-card__meta">{card.meta}</p>
          </article>
        ))}
      </section>

      <div className="internal-ai-preview-sheet__main">
        <article className="next-panel internal-ai-report__panel">
          <div className="next-panel__header">
            <h2>Riepilogo esecutivo</h2>
          </div>
          <p className="next-panel__description">
            Vista sintetica del mezzo, con priorita principali in evidenza e approfondimenti
            tecnici solo secondari.
          </p>
        </article>

        <div className="internal-ai-report-section-list">
          {visibleGroups.map((group) => (
            <article key={group.id} className="next-panel internal-ai-report__panel">
              <div className="next-panel__header">
                <h2>{group.title}</h2>
              </div>
              <p className="internal-ai-card__meta">{group.description}</p>
              <div className="internal-ai-report-section-list">
                {group.items.map((item) => (
                  <section key={item.id} className="internal-ai-report-section-card">
                    <div className="internal-ai-report-section-card__header">
                      <div>
                        <h3>{item.title}</h3>
                        <p className="internal-ai-muted">{item.summary}</p>
                      </div>
                      <span className={statusToneClass(item.status)}>
                        {SECTION_STATUS_LABELS[item.status] ?? item.status}
                      </span>
                    </div>
                    {renderReportSectionContent(item)}
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="internal-ai-preview-sheet__details">
          {(secondaryCards.length > 0 || secondarySections.length > 0) ? (
            <details className="next-panel internal-ai-report__panel internal-ai-report__panel--disclosure">
              <summary className="internal-ai-disclosure__summary">
                <div>
                  <p className="internal-ai-card__eyebrow">Approfondimento</p>
                  <h3>Mostra dettagli</h3>
                </div>
                <span className="internal-ai-pill is-neutral">Apri dettagli</span>
              </summary>
              <div className="internal-ai-disclosure__content">
                {secondaryCards.length ? (
                  <section className="internal-ai-report__detail-block">
                    <h4>Indicatori aggiuntivi</h4>
                    <div className="internal-ai-report__cards">
                      {secondaryCards.map((card, cardIndex) => (
                        <article
                          key={`secondary-card:${cardIndex}`}
                          className={reportCardToneClass(card.tone)}
                        >
                          <p className="internal-ai-card__eyebrow">{card.label}</p>
                          <h3>{card.value}</h3>
                          <p className="internal-ai-card__meta">{card.meta}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}
                {secondarySections.length ? (
                  <section className="internal-ai-report__detail-block">
                    <h4>Altri dettagli disponibili</h4>
                    <div className="internal-ai-report-section-list">
                      {secondarySections.map((item) => (
                        <section key={item.id} className="internal-ai-report-section-card">
                          <div className="internal-ai-report-section-card__header">
                            <div>
                              <h3>{item.title}</h3>
                              <p className="internal-ai-muted">{item.summary}</p>
                            </div>
                            <span className={statusToneClass(item.status)}>
                              {SECTION_STATUS_LABELS[item.status] ?? item.status}
                            </span>
                          </div>
                          {renderReportSectionContent(item)}
                        </section>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            </details>
          ) : null}

          <details className="next-panel internal-ai-report__panel internal-ai-report__panel--disclosure">
            <summary className="internal-ai-disclosure__summary">
              <div>
                <p className="internal-ai-card__eyebrow">Fonti</p>
                <h3>Mostra fonti</h3>
              </div>
              <span className="internal-ai-pill is-neutral">{report.sources.length} fonti</span>
            </summary>
            <div className="internal-ai-disclosure__content">
              <div className="internal-ai-source-list">
                {report.sources.map((source) => (
                  <section key={source.id} className="internal-ai-source-card">
                    <div className="internal-ai-source-card__header">
                      <strong>{source.title}</strong>
                      <span className={statusToneClass(source.status)}>
                        {SOURCE_STATUS_LABELS[source.status] ?? source.status}
                      </span>
                    </div>
                    <p className="internal-ai-muted">{source.description}</p>
                    <div className="internal-ai-pill-row">
                      {source.datasetLabels.map((dataset, datasetIndex) => (
                        <span
                          key={`${source.id}:dataset:${datasetIndex}`}
                          className="internal-ai-pill is-neutral"
                        >
                          {dataset}
                        </span>
                      ))}
                      {source.countLabel ? (
                        <span className="internal-ai-pill is-neutral">{source.countLabel}</span>
                      ) : null}
                    </div>
                    {source.notes.length ? (
                      <ul className="internal-ai-inline-list">
                        {source.notes.map((note, noteIndex) => (
                          <li key={`${source.id}:source-note:${noteIndex}`}>{note}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>
            </div>
          </details>

          <details className="next-panel internal-ai-report__panel internal-ai-report__panel--disclosure">
            <summary className="internal-ai-disclosure__summary">
              <div>
                <p className="internal-ai-card__eyebrow">Limiti e stato</p>
                <h3>Mostra limiti</h3>
              </div>
              <span className="internal-ai-pill is-warning">
                {report.missingData.length + report.evidences.length} voci
              </span>
            </summary>
            <div className="internal-ai-disclosure__content">
              <div className="internal-ai-report__detail-grid">
                <section className="internal-ai-report__detail-block">
                  <h4>Stato anteprima</h4>
                  {renderPreviewState(report.previewState)}
                  {renderApprovalState(report.approvalState)}
                </section>
                <section className="internal-ai-report__detail-block">
                  <h4>Dati mancanti o da completare</h4>
                  {report.missingData.length ? (
                    <ul className="internal-ai-inline-list">
                      {report.missingData.map((entry, entryIndex) => (
                        <li key={`missing:${entryIndex}`}>{entry}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="internal-ai-card__meta">Nessun dato mancante rilevante emerso.</p>
                  )}
                </section>
                <section className="internal-ai-report__detail-block">
                  <h4>Evidenze e segnali</h4>
                  {report.evidences.length ? (
                    <ul className="internal-ai-inline-list">
                      {report.evidences.map((entry, entryIndex) => (
                        <li key={`evidence:${entryIndex}`}>{entry}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="internal-ai-card__meta">
                      Nessuna evidenza aggiuntiva registrata per questa anteprima.
                    </p>
                  )}
                </section>
                <section className="internal-ai-report__detail-block">
                  <h4>Azioni locali</h4>
                  <p className="internal-ai-card__meta">
                    Gli stati restano locali al clone e non modificano dati business o workflow
                    reali del gestionale.
                  </p>
                  <div className="internal-ai-button-row internal-ai-button-row--stacked">
                    <button type="button" className="internal-ai-search__button" onClick={onMarkRevisionRequested}>
                      Segna da rivedere
                    </button>
                    <button type="button" className="internal-ai-search__button" onClick={onMarkApprovable}>
                      Segna come approvabile
                    </button>
                    <button type="button" className="internal-ai-search__button" onClick={onDiscardPreview}>
                      Scarta anteprima
                    </button>
                    <button type="button" className="internal-ai-search__button" onClick={onSaveDraftArtifact}>
                      Salva bozza nell&apos;archivio IA
                    </button>
                  </div>
                  {draftMessage ? (
                    <p className="internal-ai-report__draft-note">{draftMessage}</p>
                  ) : null}
                </section>
              </div>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}

function renderEconomicAnalysisPreview(preview: InternalAiEconomicAnalysisPreview) {
  const primaryCards = preview.cards.slice(0, 3);
  const secondaryCards = preview.cards.slice(3);

  return (
    <section className="internal-ai-report internal-ai-preview-sheet">
      <article className="next-panel internal-ai-report__hero">
        <div className="internal-ai-report__hero-main">
          <div className="internal-ai-report__kicker-row">
            <span className="internal-ai-report__kicker">Analisi economica</span>
            <span className="internal-ai-pill is-neutral">
              Generata il {formatDateLabel(preview.generatedAt)}
            </span>
          </div>
          <h2>{preview.title}</h2>
          <p className="next-panel__description">{preview.subtitle}</p>
          <div className="internal-ai-report__hero-meta">
            <span className={statusToneClass(preview.previewState.status)}>
              {PREVIEW_STATUS_LABELS[preview.previewState.status] ?? preview.previewState.status}
            </span>
          </div>
          <div className="internal-ai-report__identity">
            <div className="internal-ai-report__identity-card">
              <span>Targa</span>
              <strong>{preview.header.targa}</strong>
            </div>
            <div className="internal-ai-report__identity-card">
              <span>Categoria</span>
              <strong>{preview.header.categoria ?? "Non disponibile"}</strong>
            </div>
            <div className="internal-ai-report__identity-card">
              <span>Marca / modello</span>
              <strong>{preview.header.marcaModello ?? "Non disponibile"}</strong>
            </div>
            <div className="internal-ai-report__identity-card">
              <span>Documenti diretti</span>
              <strong>{preview.header.documentiDiretti}</strong>
            </div>
          </div>
        </div>

        <div className="internal-ai-report__hero-side internal-ai-report__hero-side--compact">
          <p className="internal-ai-report__hero-note">
            Sintesi economica leggibile, con fonti, perimetro e cautele disponibili solo in
            approfondimento.
          </p>
          <div className="internal-ai-report__facts">
            <div className="internal-ai-report__fact">
              <span>Snapshot legacy</span>
              <strong>{preview.header.snapshotLegacy}</strong>
            </div>
            <div className="internal-ai-report__fact">
              <span>Procurement</span>
              <strong>{preview.header.procurement}</strong>
            </div>
            <div className="internal-ai-report__fact">
              <span>Periodo diretto</span>
              <strong>{preview.header.periodoDiretto}</strong>
            </div>
          </div>
        </div>
      </article>

      <section className="internal-ai-report__cards internal-ai-report__cards--executive">
        {primaryCards.map((card, cardIndex) => (
          <article key={`${card.label}:${cardIndex}`} className={reportCardToneClass(card.tone)}>
            <p className="internal-ai-card__eyebrow">{card.label}</p>
            <h3>{card.value}</h3>
            <p className="internal-ai-card__meta">{card.meta}</p>
          </article>
        ))}
      </section>

      <div className="internal-ai-preview-sheet__main">
        <article className="next-panel internal-ai-report__panel">
          <div className="next-panel__header">
            <h2>Quadro economico</h2>
          </div>
          <div className="internal-ai-report-section-list">
            {preview.sections.map((section) => (
              <section key={section.id} className="internal-ai-report-section-card">
                <div className="internal-ai-report-section-card__header">
                  <div>
                    <h3>{section.title}</h3>
                    <p className="internal-ai-muted">{section.summary}</p>
                  </div>
                  <span className={statusToneClass(section.status)}>
                    {SECTION_STATUS_LABELS[section.status] ?? section.status}
                  </span>
                </div>
                {renderReportSectionContent(section)}
              </section>
            ))}
          </div>
        </article>

        <div className="internal-ai-preview-sheet__details">
          {secondaryCards.length ? (
            <details className="next-panel internal-ai-report__panel internal-ai-report__panel--disclosure">
              <summary className="internal-ai-disclosure__summary">
                <div>
                  <p className="internal-ai-card__eyebrow">Indicatori</p>
                  <h3>Mostra dettagli</h3>
                </div>
                <span className="internal-ai-pill is-neutral">{secondaryCards.length} card</span>
              </summary>
              <div className="internal-ai-disclosure__content">
                <div className="internal-ai-report__cards">
                  {secondaryCards.map((card, cardIndex) => (
                    <article key={`analysis-card:${cardIndex}`} className={reportCardToneClass(card.tone)}>
                      <p className="internal-ai-card__eyebrow">{card.label}</p>
                      <h3>{card.value}</h3>
                      <p className="internal-ai-card__meta">{card.meta}</p>
                    </article>
                  ))}
                </div>
              </div>
            </details>
          ) : null}

          <details className="next-panel internal-ai-report__panel internal-ai-report__panel--disclosure">
            <summary className="internal-ai-disclosure__summary">
              <div>
                <p className="internal-ai-card__eyebrow">Fonti</p>
                <h3>Mostra fonti</h3>
              </div>
              <span className="internal-ai-pill is-neutral">{preview.sources.length} fonti</span>
            </summary>
            <div className="internal-ai-disclosure__content">
              <div className="internal-ai-source-list">
                {preview.sources.map((source) => (
                  <section key={source.id} className="internal-ai-source-card">
                    <div className="internal-ai-source-card__header">
                      <strong>{source.title}</strong>
                      <span className={statusToneClass(source.status)}>
                        {SOURCE_STATUS_LABELS[source.status] ?? source.status}
                      </span>
                    </div>
                    <p className="internal-ai-muted">{source.description}</p>
                    <div className="internal-ai-pill-row">
                      {source.datasetLabels.map((dataset, datasetIndex) => (
                        <span
                          key={`${source.id}:dataset:${datasetIndex}`}
                          className="internal-ai-pill is-neutral"
                        >
                          {dataset}
                        </span>
                      ))}
                      {source.countLabel ? (
                        <span className="internal-ai-pill is-neutral">{source.countLabel}</span>
                      ) : null}
                    </div>
                    {source.notes.length ? (
                      <ul className="internal-ai-inline-list">
                        {source.notes.map((note, noteIndex) => (
                          <li key={`${source.id}:note:${noteIndex}`}>{note}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))}
              </div>
            </div>
          </details>

          <details className="next-panel internal-ai-report__panel internal-ai-report__panel--disclosure">
            <summary className="internal-ai-disclosure__summary">
              <div>
                <p className="internal-ai-card__eyebrow">Perimetro e limiti</p>
                <h3>Mostra limiti</h3>
              </div>
              <span className="internal-ai-pill is-warning">{preview.missingData.length} voci</span>
            </summary>
            <div className="internal-ai-disclosure__content">
              <section className="internal-ai-report__detail-block">
                <h4>Stato anteprima</h4>
                {renderPreviewState(preview.previewState)}
              </section>
              <section className="internal-ai-report__detail-block">
                <h4>Cautele operative</h4>
                {preview.missingData.length ? (
                  <ul className="internal-ai-inline-list">
                    {preview.missingData.map((entry, entryIndex) => (
                      <li key={`analysis-missing:${entryIndex}`}>{entry}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="internal-ai-card__meta">
                    Nessuna cautela critica aggiuntiva emersa per questa anteprima economica.
                  </p>
                )}
              </section>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}

function createChatMessage(args: {
  role: InternalAiChatMessage["role"];
  text: string;
  intent: InternalAiChatMessage["intent"];
  status: InternalAiChatMessage["status"];
  references?: InternalAiChatMessage["references"];
}): InternalAiChatMessage {
  return {
    id: `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    role: args.role,
    createdAt: new Date().toISOString(),
    text: args.text,
    intent: args.intent,
    status: args.status,
    references: args.references ?? [],
  };
}

function createWelcomeChatMessage(): InternalAiChatMessage {
  return createChatMessage({
    role: "assistente",
    intent: "capabilities",
    status: "completed",
    text:
      "Chat interna controllata attiva.\n\n" +
      "Posso aiutarti con richieste sicure gia supportate dal sottosistema IA interno, in particolare il report targa in anteprima e il primo blocco di analisi economica read-only disponibile dalla home.\n\n" +
      'Prova con: "crea report targa AB123CD" oppure "cosa puoi fare".',
    references: [
      {
        type: "safe_mode_notice",
        label: "Modalita sicura e controllata",
        targa: null,
      },
    ],
  });
}

function formatVehicleLookupDescription(candidate: InternalAiVehicleLookupCandidate) {
  return [
    candidate.marcaModello,
    candidate.categoria !== "Senza categoria" ? candidate.categoria : null,
    candidate.autistaNome ? `Autista ${candidate.autistaNome}` : null,
  ]
    .filter(Boolean)
    .join(" - ");
}

function buildContractLabelMap(contractCatalog: ReturnType<typeof readInternalAiScaffoldSnapshot>["contractCatalog"]) {
  return new Map<string, string>(contractCatalog.map((entry) => [entry.id, entry.title]));
}

function NextInternalAiPage({ sectionId = "overview" }: NextInternalAiPageProps) {
  const location = useLocation();
  const section = SECTION_CONFIGS[sectionId];
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  const snapshot = useMemo(() => {
    void snapshotVersion;
    return readInternalAiScaffoldSnapshot();
  }, [snapshotVersion]);
  const contractLabelMap = useMemo(
    () => buildContractLabelMap(snapshot.contractCatalog),
    [snapshot.contractCatalog],
  );
  const tracking = useSyncExternalStore(
    subscribeInternalAiTracking,
    readInternalAiTrackingSummary,
    readInternalAiTrackingSummary,
  );
  const [targaInput, setTargaInput] = useState("");
  const [lookupCatalog, setLookupCatalog] = useState<LookupCatalogState>({
    status: "loading",
    items: [],
    message: null,
  });
  const [selectedVehicle, setSelectedVehicle] = useState<InternalAiVehicleLookupCandidate | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<InternalAiChatMessage[]>(() => [
    createWelcomeChatMessage(),
  ]);
  const [chatStatus, setChatStatus] = useState<InternalAiChatExecutionStatus>("idle");
  const [openedArtifactId, setOpenedArtifactId] = useState<string | null>(null);
  const [searchState, setSearchState] = useState<ReportSearchState>({
    status: "idle",
    message: null,
    report: null,
    draftMessage: null,
  });
  const [economicAnalysisState, setEconomicAnalysisState] = useState<EconomicAnalysisState>({
    status: "idle",
    message: null,
    preview: null,
  });
  const [activePreviewKind, setActivePreviewKind] = useState<ActivePreviewKind | null>(null);
  const openedArtifact = useMemo(
    () => snapshot.artifacts.find((artifact) => artifact.id === openedArtifactId) ?? null,
    [openedArtifactId, snapshot.artifacts],
  );
  const persistedArtifactsCount = snapshot.artifacts.filter((artifact) => artifact.isPersisted).length;
  const normalizedLookupQuery = useMemo(
    () => normalizeInternalAiVehicleLookupQuery(targaInput),
    [targaInput],
  );
  const lookupSuggestions = useMemo(
    () => matchInternalAiVehicleLookupCandidates(lookupCatalog.items, targaInput),
    [lookupCatalog.items, targaInput],
  );
  const exactVehicleMatch = useMemo(
    () => findInternalAiExactVehicleMatch(lookupCatalog.items, targaInput),
    [lookupCatalog.items, targaInput],
  );
  const lookupUiState = useMemo((): {
    status: InternalAiVehicleLookupMatchState;
    message: string;
  } => {
    if (lookupCatalog.status === "loading") {
      return {
        status: "loading",
        message: "Sto leggendo le targhe reali dai layer anagrafici in sola lettura del clone...",
      };
    }

    if (lookupCatalog.status === "error") {
      return {
        status: "error",
        message: lookupCatalog.message,
      };
    }

    if (!normalizedLookupQuery) {
      return {
        status: "empty_query",
        message: "Inizia a digitare una targa per vedere i mezzi reali disponibili nel gestionale.",
      };
    }

    if (selectedVehicle && selectedVehicle.targa === normalizedLookupQuery) {
      return {
        status: "selected",
        message: `Mezzo reale selezionato: ${selectedVehicle.targa}. Puoi avviare l'anteprima report in sola lettura.`,
      };
    }

    if (exactVehicleMatch) {
      return {
        status: "exact_match",
        message: `Trovata una corrispondenza precisa per ${exactVehicleMatch.targa}. Se vuoi ridurre gli errori, seleziona il mezzo prima di generare l'anteprima.`,
      };
    }

    if (lookupSuggestions.length === 0) {
      return {
        status: "no_match",
        message: "Nessun mezzo reale corrisponde ai caratteri inseriti.",
      };
    }

    return {
      status: "multiple_matches",
      message:
        lookupSuggestions.length === 1
          ? "Trovata una corrispondenza possibile. Seleziona il mezzo suggerito per confermare la targa corretta."
          : `Trovate ${lookupSuggestions.length} corrispondenze possibili. Seleziona il mezzo corretto per un'anteprima piu affidabile.`,
    };
  }, [
    exactVehicleMatch,
    lookupCatalog.message,
    lookupCatalog.status,
    lookupSuggestions.length,
    normalizedLookupQuery,
    selectedVehicle,
  ]);

  useEffect(() => {
    trackInternalAiScreenVisit(sectionId, location.pathname);
  }, [location.pathname, sectionId]);

  useEffect(() => {
    if (!activePreviewKind) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePreviewKind(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePreviewKind]);

  useEffect(() => {
    let cancelled = false;

    void readInternalAiVehicleLookupCatalog()
      .then((items) => {
        if (cancelled) return;
        setLookupCatalog({
          status: "ready",
          items,
          message: null,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setLookupCatalog({
          status: "error",
          items: [],
          message:
            error instanceof Error
              ? error.message
              : "Errore durante la lettura delle targhe reali del gestionale.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const applyPreviewReadResult = (
    result: InternalAiVehicleReportReadResult,
    source: "manuale" | "selezione_guidata" | "chat",
  ) => {
    if (result.status !== "ready") {
      setActivePreviewKind(null);
      setEconomicAnalysisState({
        status: "idle",
        message: null,
        preview: null,
      });
      if (result.normalizedTarga) {
        trackInternalAiVehicleSearch({
          targa: result.normalizedTarga,
          source,
          result: result.status,
          sectionId,
          path: location.pathname,
        });
      }
      setSearchState({
        status: result.status,
        message: result.message,
        report: null,
        draftMessage: null,
      });
      return;
    }

    setTargaInput(result.normalizedTarga);
    setEconomicAnalysisState((current) =>
      current.status === "ready" && current.preview.mezzoTarga === result.normalizedTarga
        ? current
        : {
            status: "idle",
            message: null,
            preview: null,
          },
    );
    const catalogMatch =
      findInternalAiExactVehicleMatch(lookupCatalog.items, result.normalizedTarga) ?? null;
    if (catalogMatch) {
      setSelectedVehicle(catalogMatch);
    }
    trackInternalAiVehicleSearch({
      targa: result.normalizedTarga,
      source,
      result: "ready",
      sectionId,
      path: location.pathname,
    });
    setActivePreviewKind("report");
    setSearchState({
      status: "ready",
      message: result.message,
      report: result.report,
      draftMessage: null,
    });
  };

  const handleSelectVehicle = (candidate: InternalAiVehicleLookupCandidate) => {
    setSelectedVehicle(candidate);
    setTargaInput(candidate.targa);
    setActivePreviewKind(null);
    setEconomicAnalysisState({
      status: "idle",
      message: null,
      preview: null,
    });
    trackInternalAiVehicleSelection({
      targa: candidate.targa,
      sectionId,
      path: location.pathname,
    });
    setSearchState((current) =>
      current.status === "loading"
        ? current
        : {
            status: "idle",
            message: `Mezzo selezionato dal gestionale in sola lettura: ${candidate.targa}. Ora puoi generare il report in anteprima.`,
            report: null,
            draftMessage: null,
          },
    );
  };

  const handleGeneratePreview = async () => {
    const candidateToUse =
      selectedVehicle && selectedVehicle.targa === normalizedLookupQuery
        ? selectedVehicle
        : exactVehicleMatch;

    if (!normalizedLookupQuery) {
      setSearchState({
        status: "invalid_query",
        message: "Inserisci almeno una targa o seleziona un mezzo reale prima di avviare l'anteprima.",
        report: null,
        draftMessage: null,
      });
      return;
    }

    if (!candidateToUse && lookupSuggestions.length > 0) {
      trackInternalAiVehicleSearch({
        targa: normalizedLookupQuery,
        source: "manuale",
        result: "invalid_query",
        sectionId,
        path: location.pathname,
      });
      setSearchState({
        status: "invalid_query",
        message:
          lookupSuggestions.length === 1
            ? "Ricerca incompleta: seleziona il mezzo suggerito oppure completa la targa prima di generare l'anteprima report."
            : "Ricerca ambigua: seleziona un mezzo reale dall'elenco suggerito prima di generare l'anteprima report.",
        report: null,
        draftMessage: null,
      });
      return;
    }

    const targaToRead = candidateToUse?.targa ?? normalizedLookupQuery;
    if (candidateToUse && (!selectedVehicle || selectedVehicle.targa !== candidateToUse.targa)) {
      setSelectedVehicle(candidateToUse);
    }
    setTargaInput(targaToRead);
    setSearchState({
      status: "loading",
      message: `Analisi in sola lettura in corso dai layer NEXT per la targa ${targaToRead}...`,
      report: null,
      draftMessage: null,
    });

    try {
      const result: InternalAiVehicleReportReadResult =
        await readInternalAiVehicleReportPreview(targaToRead);
      applyPreviewReadResult(result, selectedVehicle ? "selezione_guidata" : "manuale");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore non previsto durante la costruzione dell'anteprima report.";

      setSearchState({
        status: "error",
        message,
        report: null,
        draftMessage: null,
      });
      setActivePreviewKind(null);
    }
  };

  const handleGenerateEconomicAnalysis = async () => {
    const candidateToUse =
      selectedVehicle && selectedVehicle.targa === normalizedLookupQuery
        ? selectedVehicle
        : exactVehicleMatch;

    if (!normalizedLookupQuery) {
      setEconomicAnalysisState({
        status: "invalid_query",
        message: "Inserisci almeno una targa o seleziona un mezzo reale prima di aprire l'analisi economica.",
        preview: null,
      });
      return;
    }

    if (!candidateToUse && lookupSuggestions.length > 0) {
      setEconomicAnalysisState({
        status: "invalid_query",
        message:
          lookupSuggestions.length === 1
            ? "Ricerca incompleta: seleziona il mezzo suggerito oppure completa la targa prima di aprire l'analisi economica."
            : "Ricerca ambigua: seleziona un mezzo reale dall'elenco suggerito prima di aprire l'analisi economica.",
        preview: null,
      });
      return;
    }

    const targaToRead = candidateToUse?.targa ?? normalizedLookupQuery;
    if (candidateToUse && (!selectedVehicle || selectedVehicle.targa !== candidateToUse.targa)) {
      setSelectedVehicle(candidateToUse);
    }
    setTargaInput(targaToRead);
    setEconomicAnalysisState({
      status: "loading",
      message: `Costruzione anteprima economica in corso dai layer NEXT per la targa ${targaToRead}...`,
      preview: null,
    });

    try {
      const result: InternalAiEconomicAnalysisReadResult =
        await readInternalAiEconomicAnalysisPreview(targaToRead);

      if (result.status === "ready") {
        setEconomicAnalysisState({
          status: "ready",
          message: result.message,
          preview: result.preview,
        });
        setActivePreviewKind("analysis");
      } else {
        setEconomicAnalysisState({
          status: result.status,
          message: result.message,
          preview: null,
        });
        setActivePreviewKind(null);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore non previsto durante la costruzione dell'anteprima economica.";

      setEconomicAnalysisState({
        status: "error",
        message,
        preview: null,
      });
      setActivePreviewKind(null);
    }
  };

  const handleChatSubmit = async (promptOverride?: string) => {
    const prompt = (promptOverride ?? chatInput).trim();
    if (!prompt || chatStatus === "running") {
      return;
    }

    setChatMessages((current) => [
      ...current,
      createChatMessage({
        role: "utente",
        text: prompt,
        intent: "richiesta_generica",
        status: "completed",
      }),
    ]);
    setChatInput("");
    setChatStatus("running");

    try {
      const result = await runInternalAiChatTurn(prompt);
      trackInternalAiChatPrompt({
        prompt,
        intent: result.intent,
        status: result.status,
        sectionId,
        path: location.pathname,
      });

      if (result.report) {
        if (result.report.status === "ready") {
          applyPreviewReadResult({
            status: "ready",
            normalizedTarga: result.report.normalizedTarga,
            message: result.report.message,
            report: result.report.preview,
          }, "chat");
        } else {
          applyPreviewReadResult({
            status: result.report.status,
            normalizedTarga: result.report.normalizedTarga,
            message: result.report.message,
            report: null,
          }, "chat");
        }
      }

      setChatMessages((current) => [
        ...current,
        createChatMessage({
          role: "assistente",
          text: result.assistantText,
          intent: result.intent,
          status: result.status,
          references: result.references,
        }),
      ]);
      setChatStatus("idle");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore non previsto nell'orchestratore locale della chat interna.";

      trackInternalAiChatPrompt({
        prompt,
        intent: "richiesta_generica",
        status: "failed",
        sectionId,
        path: location.pathname,
      });

      setChatMessages((current) => [
        ...current,
        createChatMessage({
          role: "assistente",
          text:
            "Si e verificato un errore interno nella chat controllata.\n\n" +
            `Dettaglio: ${message}`,
          intent: "richiesta_generica",
          status: "failed",
          references: [
            {
              type: "safe_mode_notice",
              label: "Errore locale della chat controllata",
              targa: null,
            },
          ],
        }),
      ]);
      setChatStatus("idle");
    }
  };

  const applyReportState = (next: {
    previewState: InternalAiPreviewState;
    approvalState: InternalAiApprovalState;
  }) => {
    setSearchState((current) => {
      if (current.status !== "ready") {
        return current;
      }

      return {
        ...current,
        report: {
          ...current.report,
          previewState: next.previewState,
          approvalState: next.approvalState,
        },
        draftMessage: null,
      };
    });
  };

  const markRevisionRequested = () => {
    if (searchState.status !== "ready") return;

    const updatedAt = new Date().toISOString();
    applyReportState({
      previewState: {
        status: "revision_requested",
        updatedAt,
        note: "Anteprima marcata come da rivedere nella sola simulazione IA interna.",
      },
      approvalState: {
        status: "revision_requested",
        requestedBy: "ia.interna.preview",
        updatedAt,
        note: "Richiesta revisione solo lato clone, senza applicazione reale.",
      },
    });
  };

  const markApprovable = () => {
    if (searchState.status !== "ready") return;

    const updatedAt = new Date().toISOString();
    applyReportState({
      previewState: {
        status: "preview_ready",
        updatedAt,
        note: "Anteprima pronta e considerata approvabile nella simulazione locale.",
      },
      approvalState: {
        status: "awaiting_approval",
        requestedBy: "ia.interna.preview",
        updatedAt,
        note: "Approvabile solo nel workflow simulato del sottosistema IA interno.",
      },
    });
  };

  const discardPreview = () => {
    if (searchState.status !== "ready") return;

    const updatedAt = new Date().toISOString();
    applyReportState({
      previewState: {
        status: "discarded",
        updatedAt,
        note: "Anteprima scartata solo nel sottosistema IA interno.",
      },
      approvalState: {
        status: "rejected",
        requestedBy: "ia.interna.preview",
        updatedAt,
        note: "Scarto registrato solo nel workflow simulato del clone.",
      },
    });
  };

  const saveDraftArtifact = () => {
    if (searchState.status !== "ready") return;

    const saved = saveInternalAiDraftArtifact({ report: searchState.report });
    trackInternalAiArtifactAction({
      artifactId: saved.artifact.id,
      title: saved.artifact.title,
      mezzoTarga: saved.artifact.mezzoTarga,
      action: "saved",
      sectionId,
      path: location.pathname,
    });
    setSnapshotVersion((value) => value + 1);
    setSearchState((current) =>
      current.status === "ready"
        ? {
            ...current,
            draftMessage: saved.artifact.isPersisted
              ? `Bozza IA salvata nell'archivio locale isolato: sessione ${saved.session.id}, richiesta ${saved.request.id}, risultato ${saved.artifact.id}.`
              : `Bozza IA mantenuta solo in memoria locale: sessione ${saved.session.id}, richiesta ${saved.request.id}, risultato ${saved.artifact.id}.`,
          }
        : current,
    );
  };

  const handleArchiveArtifact = (artifactId: string) => {
    const archived = archiveInternalAiArtifact(artifactId);
    if (!archived) {
      return;
    }

    trackInternalAiArtifactAction({
      artifactId: archived.id,
      title: archived.title,
      mezzoTarga: archived.mezzoTarga,
      action: "archived",
      sectionId,
      path: location.pathname,
    });
    setSnapshotVersion((value) => value + 1);
    setOpenedArtifactId(artifactId);
  };

  const handleOpenArtifact = (artifactId: string) => {
    const artifact = snapshot.artifacts.find((entry) => entry.id === artifactId) ?? null;
    if (!artifact) {
      return;
    }

    setOpenedArtifactId(artifactId);
    trackInternalAiArtifactAction({
      artifactId: artifact.id,
      title: artifact.title,
      mezzoTarga: artifact.mezzoTarga,
      action: "opened",
      sectionId,
      path: location.pathname,
    });
  };

  return (
    <section className="next-page internal-ai-page">
      <header className="next-panel internal-ai-shell-head">
        <div className="internal-ai-shell-head__content">
          <p className="next-page__eyebrow">IA interna / assistente gestionale</p>
          <h1>{section.title}</h1>
          <p className="next-page__description">
            {sectionId === "overview"
              ? "Assistente interno in sola lettura, pensato per richieste semplici, anteprime ordinate e report professionali sopra i layer NEXT del clone."
              : `${section.description} Il perimetro resta isolato sotto /next/ia/interna* e non modifica i flussi business correnti.`}
          </p>
          <div className="internal-ai-shell-head__chips">
            <span className="next-chip next-chip--accent">STRUTTURA INIZIALE</span>
            <span className="next-chip">SOLO LETTURA</span>
            <span className="next-chip">CLONE ISOLATO</span>
            <span className="next-chip next-chip--subtle">NESSUNA SCRITTURA BUSINESS</span>
          </div>
        </div>
        <div className="internal-ai-shell-head__actions">
          <div className="internal-ai-shell-head__links">
            <Link to={NEXT_IA_PATH} className="next-clone-topbar__link">
              Area IA del clone
            </Link>
            <Link to={NEXT_HOME_PATH} className="next-clone-topbar__link">
              Home clone
            </Link>
          </div>
          <p className="internal-ai-shell-head__note">
            Archivio risultati:{" "}
            <strong>
              {snapshot.summary.artifactArchiveMode === "local_storage_isolated"
                ? "locale isolato"
                : "solo memoria locale"}
            </strong>
            {" - "}Tracciamento:{" "}
            <strong>
              {tracking.mode === "local_storage_isolated"
                ? "memoria locale persistente IA"
                : "solo memoria locale"}
            </strong>
          </p>
        </div>
      </header>

      <nav className="internal-ai-nav internal-ai-nav--compact">
        {(
          Object.entries(SECTION_CONFIGS) as [
            NextInternalAiSectionId,
            (typeof SECTION_CONFIGS)[NextInternalAiSectionId],
          ][]
        ).map(([id, entry]) => (
          <Link
            key={id}
            to={entry.path}
            className={`internal-ai-nav__link ${id === sectionId ? "is-active" : ""}`}
          >
            {entry.title}
          </Link>
        ))}
      </nav>

      {sectionId === "overview" ? (
        <>
        <div className="internal-ai-overview-layout">
          <div className="internal-ai-overview-main">
            <article className="next-panel internal-ai-chat internal-ai-chat--hero">
              <div className="internal-ai-chat__intro">
                <p className="internal-ai-card__eyebrow">Assistente centrale</p>
                <h2>Chiedi e poi apri la preview</h2>
                <p className="next-panel__description">
                  La chat resta il punto di ingresso principale: fai una richiesta, orientati sui
                  blocchi disponibili e poi apri la preview in una vista separata e ordinata.
                </p>
              </div>
              <div className="internal-ai-chat__suggestions internal-ai-chat__suggestions--cards">
                {CHAT_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="internal-ai-chat__suggestion"
                    onClick={() => setChatInput(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <div className="internal-ai-chat__messages">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`internal-ai-chat__message ${
                      message.role === "utente" ? "is-user" : "is-assistant"
                    }`}
                  >
                    <div className="internal-ai-chat__message-header">
                      <strong>{message.role === "utente" ? "Utente" : "Assistente IA interno"}</strong>
                      <div className="internal-ai-pill-row">
                        <span className={statusToneClass(message.status)}>
                          {CHAT_STATUS_LABELS[message.status]}
                        </span>
                        <span className="internal-ai-pill is-neutral">
                          {formatDateLabel(message.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="internal-ai-chat__message-text">{message.text}</p>
                    {message.references.length ? (
                      <div className="internal-ai-pill-row">
                        {message.references.map((reference, referenceIndex) => (
                          <span
                            key={`${message.id}:reference:${referenceIndex}`}
                            className="internal-ai-pill is-neutral"
                          >
                            {reference.label}
                            {reference.targa ? ` - ${reference.targa}` : ""}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                {chatStatus === "running" ? (
                  <div className="internal-ai-chat__message is-assistant">
                    <div className="internal-ai-chat__message-header">
                      <strong>Assistente IA interno</strong>
                      <span className={statusToneClass("running")}>In elaborazione</span>
                    </div>
                    <p className="internal-ai-chat__message-text">
                      Sto preparando una risposta locale e controllata...
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="internal-ai-chat__composer internal-ai-chat__composer--hero">
                <label className="internal-ai-chat__composer-field">
                  <span>Scrivi una richiesta</span>
                  <textarea
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder="Es. crea report targa AB123CD"
                    className="internal-ai-chat__textarea"
                    rows={3}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleChatSubmit();
                      }
                    }}
                  />
                </label>
                <div className="internal-ai-chat__composer-actions">
                  <p className="internal-ai-chat__hint">
                    Richiesta locale e controllata. I dettagli tecnici restano nell&apos;area
                    avanzata.
                  </p>
                  <button
                    type="button"
                    className="internal-ai-search__button"
                    disabled={chatStatus === "running" || !chatInput.trim()}
                    onClick={() => void handleChatSubmit()}
                  >
                    {chatStatus === "running" ? "Elaborazione..." : "Invia richiesta"}
                  </button>
                </div>
              </div>
            </article>

            <article className="next-panel internal-ai-search internal-ai-search--hero">
              <div className="internal-ai-search__hero internal-ai-search__hero--compact">
                <div>
                  <p className="internal-ai-card__eyebrow">Preview ordinate</p>
                  <h2>Apri un report o un&apos;analisi</h2>
                  <p className="next-panel__description">
                    Inserisci o seleziona una targa reale del gestionale. Il risultato si apre in
                    una vista ampia, leggibile e separata dalla home.
                  </p>
                </div>
                <span className="internal-ai-mode-pill is-active">Report mezzo</span>
              </div>

              <div className="internal-ai-search__form internal-ai-search__form--hero">
                <label className="internal-ai-search__field">
                  <span>Targa mezzo</span>
                  <input
                    type="text"
                    value={targaInput}
                    onChange={(event) => {
                      const nextValue = event.target.value.toUpperCase();
                      const normalizedNextValue = normalizeInternalAiVehicleLookupQuery(nextValue);
                      setTargaInput(nextValue);
                      setActivePreviewKind(null);
                      setEconomicAnalysisState({
                        status: "idle",
                        message: null,
                        preview: null,
                      });
                      if (selectedVehicle && selectedVehicle.targa !== normalizedNextValue) {
                        setSelectedVehicle(null);
                      }
                    }}
                    placeholder="Es. AB123CD"
                    className="internal-ai-search__input"
                    autoComplete="off"
                  />
                </label>
                <div className="internal-ai-search__actions">
                  <button
                    type="button"
                    className="internal-ai-search__button"
                    onClick={handleGeneratePreview}
                    disabled={searchState.status === "loading" || lookupCatalog.status === "loading"}
                  >
                    {searchState.status === "loading" ? "Lettura in corso..." : "Apri report mezzo"}
                  </button>
                  <button
                    type="button"
                    className="internal-ai-search__button is-secondary"
                    onClick={handleGenerateEconomicAnalysis}
                    disabled={
                      economicAnalysisState.status === "loading" ||
                      lookupCatalog.status === "loading"
                    }
                  >
                    {economicAnalysisState.status === "loading"
                      ? "Analisi in corso..."
                      : "Apri analisi economica"}
                  </button>
                </div>
              </div>

              {normalizedLookupQuery || searchState.message || economicAnalysisState.message ? (
                <div className="internal-ai-search__status-card">
                  <div className="internal-ai-pill-row">
                    <span className={statusToneClass(lookupUiState.status)}>
                      {LOOKUP_MATCH_LABELS[lookupUiState.status]}
                    </span>
                    {selectedVehicle ? (
                      <span className="internal-ai-pill is-neutral">
                        Mezzo selezionato: {selectedVehicle.targa}
                      </span>
                    ) : null}
                  </div>
                  <p className="internal-ai-card__meta">{lookupUiState.message}</p>
                  {searchState.message ? (
                    <p className="internal-ai-search__feedback">Report mezzo: {searchState.message}</p>
                  ) : null}
                  {economicAnalysisState.message ? (
                    <p className="internal-ai-search__feedback">
                      Analisi economica: {economicAnalysisState.message}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {lookupSuggestions.length > 0 ? (
                <div className="internal-ai-suggestions">
                  {lookupSuggestions.map((candidate) => {
                    const description = formatVehicleLookupDescription(candidate);
                    const isSelected = selectedVehicle?.id === candidate.id;
                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        className={`internal-ai-suggestion ${isSelected ? "is-selected" : ""}`}
                        onClick={() => handleSelectVehicle(candidate)}
                      >
                        <div className="internal-ai-suggestion__header">
                          <strong>{candidate.targa}</strong>
                          <div className="internal-ai-pill-row">
                            <span className="internal-ai-pill is-neutral">{candidate.categoria}</span>
                            {isSelected ? (
                              <span className="internal-ai-pill is-warning">Selezionato</span>
                            ) : null}
                          </div>
                        </div>
                        {description ? (
                          <p className="internal-ai-card__meta">{description}</p>
                        ) : (
                          <p className="internal-ai-card__meta">
                            Mezzo reale letto da <code>{candidate.sourceKey}</code>.
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {searchState.status === "ready" || economicAnalysisState.status === "ready" ? (
                <article className="internal-ai-ready-panel">
                  <div>
                    <p className="internal-ai-card__eyebrow">Risultato disponibile</p>
                    <h3>Apri la preview completa</h3>
                    <p className="internal-ai-card__meta">
                      La preview si apre in un pannello grande, con riepilogo in alto e sezioni
                      ordinate sotto. La home resta pulita.
                    </p>
                  </div>
                  <div className="internal-ai-button-row">
                    {searchState.status === "ready" ? (
                      <button
                        type="button"
                        className="internal-ai-search__button"
                        onClick={() => setActivePreviewKind("report")}
                      >
                        Apri report mezzo
                      </button>
                    ) : null}
                    {economicAnalysisState.status === "ready" ? (
                      <button
                        type="button"
                        className="internal-ai-search__button is-secondary"
                        onClick={() => setActivePreviewKind("analysis")}
                      >
                        Apri analisi economica
                      </button>
                    ) : null}
                  </div>
                </article>
              ) : null}

              </article>
            </div>

            <aside className="internal-ai-overview-side">
              <article className="next-panel internal-ai-sidecard internal-ai-sidecard--compact">
                <div className="internal-ai-sidecard__header">
                  <p className="internal-ai-card__eyebrow">Accesso rapido</p>
                  <h3>Archivio IA</h3>
                </div>
                <p className="internal-ai-card__meta">
                  Risultati disponibili: <strong>{snapshot.artifacts.length}</strong>. Persistiti
                  localmente: <strong>{persistedArtifactsCount}</strong>.
                </p>
                <div className="internal-ai-sidecard__links">
                  <Link to={NEXT_INTERNAL_AI_ARTIFACTS_PATH} className="next-clone-topbar__link">
                    Apri archivio
                  </Link>
                  <Link to={NEXT_INTERNAL_AI_REQUESTS_PATH} className="next-clone-topbar__link">
                    Apri richieste
                  </Link>
                </div>
              </article>

              <details className="next-panel internal-ai-disclosure internal-ai-disclosure--secondary">
                <summary className="internal-ai-disclosure__summary">
                  <div>
                    <p className="internal-ai-card__eyebrow">Area avanzata</p>
                    <h3>Dettagli tecnici e contesto</h3>
                  </div>
                  <span className="internal-ai-pill is-neutral">Apri dettagli</span>
                </summary>
                <div className="internal-ai-disclosure__content">
                  <div className="internal-ai-disclosure__block">
                    <h4>Modalita disponibili</h4>
                    <div className="internal-ai-mode-strip">
                      <span className="internal-ai-mode-pill is-active">Report mezzo</span>
                      <span className="internal-ai-mode-pill">Report autista non attivo</span>
                      <span className="internal-ai-mode-pill">Report combinato non attivo</span>
                    </div>
                  </div>

                  <div className="internal-ai-disclosure__block">
                    <h4>Disponibilita attuale</h4>
                    <ul className="internal-ai-inline-list">
                      <li>Report mezzo attivo in anteprima sopra i layer NEXT.</li>
                      <li>Analisi economica disponibile come capability preview-first.</li>
                      <li>Report autista e report combinato restano fuori da questo step.</li>
                    </ul>
                  </div>

                  <div className="internal-ai-disclosure__block">
                    <h4>Assorbimento legacy</h4>
                    <ul className="internal-ai-inline-list">
                      <li>Legge documenti e costi diretti gia normalizzati.</li>
                      <li>Riusa solo lo snapshot legacy economico gia salvato, in sola lettura.</li>
                      <li>Lascia procurement e approvazioni fuori dal blocco diretto.</li>
                    </ul>
                  </div>

                  <div className="internal-ai-disclosure__block">
                    <h4>Guard rail attivi</h4>
                    <ul className="internal-ai-inline-list">
                      <li>Nessun runtime `aiCore`, `estrazioneDocumenti`, `analisi` o PDF legacy.</li>
                      <li>Nessuna lettura o scrittura fuori dai layer NEXT gia autorizzati.</li>
                      <li>Nessun provider o segreto lato client.</li>
                      <li>Nessun hook globale attivo fuori dal subtree IA interno.</li>
                    </ul>
                  </div>

                  <div className="internal-ai-disclosure__block">
                    <h4>Attivita recente</h4>
                    <div className="internal-ai-pill-row">
                      <span className="internal-ai-pill is-neutral">Visite {tracking.totalVisits}</span>
                      <span className="internal-ai-pill is-neutral">Eventi {tracking.totalEvents}</span>
                      <span className="internal-ai-pill is-neutral">
                        {tracking.mode === "local_storage_isolated"
                          ? "Memoria locale persistente"
                          : "Solo memoria locale"}
                      </span>
                    </div>
                    {tracking.recentEvents.length ? (
                      <div className="internal-ai-list internal-ai-list--compact">
                        {tracking.recentEvents.slice(0, 3).map((entry) => (
                          <div key={entry.id} className="internal-ai-list__row">
                            <div className="internal-ai-list__row-header">
                              <strong>{entry.label}</strong>
                              <span className="internal-ai-pill is-neutral">
                                {formatDateLabel(entry.ts)}
                              </span>
                            </div>
                            <p className="internal-ai-card__meta">
                              Sezione {SECTION_CONFIGS[entry.sectionId].title}
                              {entry.targa ? ` - targa ${entry.targa}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="internal-ai-card__meta">Nessuna attivita recente registrata.</p>
                    )}
                  </div>

                  <div className="internal-ai-disclosure__block">
                    <h4>Recenti del modulo</h4>
                    <div className="internal-ai-report__detail-grid">
                      <section className="internal-ai-report__detail-block">
                        <h4>Ultime targhe</h4>
                        {tracking.recentVehicleSearches.length ? (
                          <ul className="internal-ai-inline-list">
                            {tracking.recentVehicleSearches.slice(0, 2).map((entry, entryIndex) => (
                              <li key={`vehicle-search:${entryIndex}`}>
                                {entry.targa} - {VEHICLE_SEARCH_RESULT_LABELS[entry.result] ?? entry.result}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="internal-ai-card__meta">Nessuna targa recente disponibile.</p>
                        )}
                      </section>
                      <section className="internal-ai-report__detail-block">
                        <h4>Risultati recenti</h4>
                        {tracking.recentArtifacts.length ? (
                          <ul className="internal-ai-inline-list">
                            {tracking.recentArtifacts.slice(0, 2).map((entry, entryIndex) => (
                              <li key={`artifact-action:${entryIndex}`}>
                                {entry.title} - {ARTIFACT_ACTION_LABELS[entry.action] ?? entry.action}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="internal-ai-card__meta">Nessun risultato recente disponibile.</p>
                        )}
                      </section>
                    </div>
                  </div>

                  <div className="internal-ai-disclosure__block">
                    <h4>Memoria recente del modulo</h4>
                    <ul className="internal-ai-inline-list">
                      <li>
                        Sezione:{" "}
                        {tracking.sessionState.lastSectionId
                          ? SECTION_CONFIGS[tracking.sessionState.lastSectionId].title
                          : "non disponibile"}
                      </li>
                      <li>Targa: {tracking.sessionState.lastTarga ?? "non disponibile"}</li>
                      <li>Intento: {tracking.sessionState.lastIntent ?? "non disponibile"}</li>
                      <li>Ultimo risultato: {tracking.sessionState.lastArtifactId ?? "non disponibile"}</li>
                    </ul>
                    {tracking.recentChatPrompts.length ? (
                      <ul className="internal-ai-inline-list">
                        {tracking.recentChatPrompts.slice(0, 3).map((entry, entryIndex) => (
                          <li key={`chat-prompt:${entryIndex}`}>
                            {entry.prompt} - {CHAT_STATUS_LABELS[entry.status]}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="internal-ai-disclosure__block">
                    <h4>Contratti predisposti</h4>
                    <div className="internal-ai-list internal-ai-list--compact">
                      {snapshot.contractCatalog.map((contract) => (
                        <div key={contract.id} className="internal-ai-list__row">
                          <div className="internal-ai-list__row-header">
                            <strong>{contract.title}</strong>
                            <div className="internal-ai-pill-row">
                              <span className="internal-ai-pill is-warning">Solo contratto</span>
                              <span className="internal-ai-pill is-danger">Esecuzione disattivata</span>
                            </div>
                          </div>
                          <p className="internal-ai-muted">{contract.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </details>
            </aside>
          </div>
          {activePreviewKind &&
          ((activePreviewKind === "report" && searchState.status === "ready") ||
            (activePreviewKind === "analysis" && economicAnalysisState.status === "ready")) ? (
            <div className="internal-ai-preview-modal" role="dialog" aria-modal="true" aria-labelledby="internal-ai-preview-title">
              <button
                type="button"
                className="internal-ai-preview-modal__backdrop"
                aria-label="Chiudi preview"
                onClick={() => setActivePreviewKind(null)}
              />
              <div className="internal-ai-preview-modal__panel">
                <div className="internal-ai-preview-modal__toolbar">
                  <div>
                    <p className="internal-ai-card__eyebrow">Preview richiesta</p>
                    <h2 id="internal-ai-preview-title">
                      {activePreviewKind === "report"
                        ? "Report mezzo in anteprima"
                        : "Analisi economica in anteprima"}
                    </h2>
                    <p className="internal-ai-card__meta">
                      Vista ordinata vicina al dossier mezzi, separata dalla home e senza
                      esportazione PDF.
                    </p>
                  </div>
                  <div className="internal-ai-preview-modal__actions">
                    {searchState.status === "ready" ? (
                      <button
                        type="button"
                        className={`internal-ai-search__button is-secondary ${
                          activePreviewKind === "report" ? "is-current" : ""
                        }`}
                        onClick={() => setActivePreviewKind("report")}
                      >
                        Report mezzo
                      </button>
                    ) : null}
                    {economicAnalysisState.status === "ready" ? (
                      <button
                        type="button"
                        className={`internal-ai-search__button is-secondary ${
                          activePreviewKind === "analysis" ? "is-current" : ""
                        }`}
                        onClick={() => setActivePreviewKind("analysis")}
                      >
                        Analisi economica
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="internal-ai-search__button is-ghost"
                      onClick={() => setActivePreviewKind(null)}
                    >
                      Chiudi
                    </button>
                  </div>
                </div>
                <div className="internal-ai-preview-modal__body">
                  {activePreviewKind === "report" && searchState.status === "ready"
                    ? renderVehicleReportPreview({
                        report: searchState.report,
                        draftMessage: searchState.draftMessage,
                        onMarkRevisionRequested: markRevisionRequested,
                        onMarkApprovable: markApprovable,
                        onDiscardPreview: discardPreview,
                        onSaveDraftArtifact: saveDraftArtifact,
                      })
                    : null}
                  {activePreviewKind === "analysis" && economicAnalysisState.status === "ready"
                    ? renderEconomicAnalysisPreview(economicAnalysisState.preview)
                    : null}
                </div>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {sectionId === "sessions" ? (
        <article className="next-panel">
          <div className="next-panel__header">
            <h2>Sessioni (`ai_sessions`)</h2>
          </div>
          <div className="internal-ai-list">
            {snapshot.sessions.map((session) => (
              <div key={session.id} className="internal-ai-list__row">
                <div className="internal-ai-list__row-header">
                  <strong>{session.title}</strong>
                  <span className={statusToneClass(session.status)}>
                    {SESSION_STATUS_LABELS[session.status] ?? session.status}
                  </span>
                </div>
                <p className="internal-ai-muted">
                  Ambito: <code>{session.scope}</code>
                </p>
                {renderPreviewState(session.previewState)}
                {renderApprovalState(session.approvalState)}
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {sectionId === "requests" ? (
        <article className="next-panel">
          <div className="next-panel__header">
            <h2>Richieste (`ai_requests`)</h2>
          </div>
          <div className="internal-ai-list">
            {snapshot.requests.map((request) => (
              <div key={request.id} className="internal-ai-list__row">
                <div className="internal-ai-list__row-header">
                  <strong>{request.title}</strong>
                  <span className={statusToneClass(request.status)}>
                    {APPROVAL_STATUS_LABELS[request.approvalState.status] ?? request.status}
                  </span>
                </div>
                <p className="internal-ai-muted">
                  Obiettivo: {REQUEST_TARGET_LABELS[request.target] ?? request.target} | Contratti:{" "}
                  {request.requestedAdapters
                    .map((adapterId) => contractLabelMap.get(adapterId) ?? adapterId)
                    .join(", ")}
                </p>
                {renderPreviewState(request.previewState)}
                {renderApprovalState(request.approvalState)}
                <p className="internal-ai-card__meta">{request.note}</p>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {sectionId === "artifacts" ? (
        <div className="next-section-grid">
          <article className="next-panel">
            <div className="next-panel__header">
              <h2>Archivio risultati IA (`analysis_artifacts`)</h2>
            </div>
            <div className="internal-ai-list">
              {snapshot.artifacts.map((artifact) => (
                <div key={artifact.id} className="internal-ai-list__row">
                  <div className="internal-ai-list__row-header">
                    <strong>{artifact.title}</strong>
                    <span className={statusToneClass(artifact.status)}>
                      {ARTIFACT_STATUS_LABELS[artifact.status] ?? artifact.status}
                    </span>
                  </div>
                  <p className="internal-ai-muted">
                    Tipo: {ARTIFACT_KIND_LABELS[artifact.kind] ?? artifact.kind} | targa:{" "}
                    {artifact.mezzoTarga ?? "non applicabile"} | archivio:{" "}
                    {ARTIFACT_STORAGE_LABELS[artifact.storageMode] ?? artifact.storageMode} |
                    salvato localmente: {artifact.isPersisted ? "si" : "no"}
                  </p>
                  <p className="internal-ai-muted">
                    Creato: {formatDateLabel(artifact.createdAt)} | Aggiornato:{" "}
                    {formatDateLabel(artifact.updatedAt)}
                  </p>
                  {artifact.tags.length ? (
                    <div className="internal-ai-pill-row">
                      {artifact.tags.map((tag, tagIndex) => (
                        <span
                          key={`${artifact.id}:tag:${tagIndex}`}
                          className="internal-ai-pill is-neutral"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <p className="internal-ai-card__meta">{artifact.note}</p>
                  <div className="internal-ai-button-row">
                    {artifact.payload ? (
                      <button
                        type="button"
                        className="internal-ai-search__button"
                        onClick={() => handleOpenArtifact(artifact.id)}
                      >
                        Apri risultato
                      </button>
                    ) : null}
                    {artifact.status !== "archived" ? (
                      <button
                        type="button"
                        className="internal-ai-search__button"
                        onClick={() => handleArchiveArtifact(artifact.id)}
                      >
                        Porta ad archiviato
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </article>
          <article className="next-panel next-tone">
            <div className="next-panel__header">
              <h2>Decisione archivio risultati</h2>
            </div>
            <p className="next-panel__description">
              In questo step la scelta piu sicura e un archivio locale isolato e namespaced nel
              browser del clone. Firestore e Storage reali restano fuori: le policy effettive non
              sono dimostrate nel repo e l&apos;app continua a usare auth anonima.
            </p>
          </article>
        </div>
      ) : null}

      {sectionId === "artifacts" && openedArtifact ? (
        <article className="next-panel">
          <div className="next-panel__header">
            <h2>Risultato aperto</h2>
          </div>
          <p className="next-panel__description">
            {openedArtifact.title} {openedArtifact.mezzoTarga ? `per la targa ${openedArtifact.mezzoTarga}` : ""}
          </p>
          {openedArtifact.payload ? (
            <>
              {renderPreviewState(openedArtifact.payload.report.previewState)}
              {renderApprovalState(openedArtifact.payload.report.approvalState)}
              <div className="internal-ai-grid">
                {openedArtifact.payload.report.cards.map((card, cardIndex) => (
                  <article
                    key={`${openedArtifact.id}:card:${cardIndex}`}
                    className="internal-ai-card"
                  >
                    <p className="internal-ai-card__eyebrow">{card.label}</p>
                    <h3>{card.value}</h3>
                    <p className="internal-ai-card__meta">{card.meta}</p>
                  </article>
                ))}
              </div>
              <div className="internal-ai-list" style={{ marginTop: 16 }}>
                <div className="internal-ai-list__row">
                  <div className="internal-ai-list__row-header">
                    <strong>Fonti lette</strong>
                    <span className="internal-ai-pill is-neutral">
                      {openedArtifact.payload.report.sources.length} fonti
                    </span>
                  </div>
                  <div className="internal-ai-pill-row">
                    {openedArtifact.payload.sourceDatasetLabels.map((dataset, datasetIndex) => (
                      <span
                        key={`${openedArtifact.id}:dataset:${datasetIndex}`}
                        className="internal-ai-pill is-neutral"
                      >
                        {dataset}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="internal-ai-list__row">
                  <div className="internal-ai-list__row-header">
                    <strong>Dati mancanti</strong>
                    <span className="internal-ai-pill is-warning">
                      {openedArtifact.payload.missingDataCount}
                    </span>
                  </div>
                  <ul className="internal-ai-inline-list">
                    {openedArtifact.payload.report.missingData.map((entry, entryIndex) => (
                      <li key={`${openedArtifact.id}:missing:${entryIndex}`}>{entry}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <p className="next-panel__description">
              Questo risultato non contiene un'anteprima apribile: resta un record tecnico di supporto
              dell&apos;archivio IA interno.
            </p>
          )}
        </article>
      ) : null}

      {sectionId === "audit" ? (
        <div className="next-section-grid">
          <article className="next-panel">
            <div className="next-panel__header">
              <h2>Registro audit (`ai_audit_log`)</h2>
            </div>
            <div className="internal-ai-list">
              {snapshot.auditLog.map((entry) => (
                <div key={entry.id} className="internal-ai-list__row">
                  <div className="internal-ai-list__row-header">
                    <strong>{AUDIT_SCOPE_LABELS[entry.scope] ?? entry.scope}</strong>
                    <div className="internal-ai-pill-row">
                      <span className={statusToneClass(entry.severity)}>
                        {AUDIT_SEVERITY_LABELS[entry.severity] ?? entry.severity}
                      </span>
                      <span className={statusToneClass(entry.riskLevel)}>
                        {AUDIT_RISK_LABELS[entry.riskLevel] ?? entry.riskLevel}
                      </span>
                    </div>
                  </div>
                  <p className="internal-ai-muted">{entry.message}</p>
                  <p className="internal-ai-card__meta">{formatDateLabel(entry.createdAt)}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="next-panel">
            <div className="next-panel__header">
              <h2>Tracciamento d'uso isolato</h2>
            </div>
            <p className="next-panel__description">
              Modalita:{" "}
              <code>
                {tracking.mode === "local_storage_isolated"
                  ? "memoria locale persistente IA"
                  : "solo memoria locale"}
              </code>
              . Nessuna attivazione globale; conteggio solo per la famiglia{" "}
              <code>/next/ia/interna*</code>.
            </p>
            <div className="internal-ai-pill-row">
              <span className="internal-ai-pill is-neutral">
                Visite totali: {tracking.totalVisits}
              </span>
              <span className="internal-ai-pill is-neutral">
                Eventi tracciati: {tracking.totalEvents}
              </span>
              {Object.entries(tracking.sectionCounts).map(([id, count]) => (
                <span key={id} className="internal-ai-pill is-neutral">
                  {SECTION_CONFIGS[id as NextInternalAiSectionId].title}: {count}
                </span>
              ))}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}

export default NextInternalAiPage;
