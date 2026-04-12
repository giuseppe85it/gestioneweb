import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./internal-ai/internal-ai.css";
import {
  NEXT_INTERNAL_AI_PATH,
  buildNextDossierPreventiviPath,
  buildNextMagazzinoPath,
  buildNextManutenzioniPath,
} from "./nextStructuralPaths";
import {
  readNextIADocumentiArchiveSnapshot,
  type NextIADocumentiArchiveItem,
} from "./domain/nextDocumentiCostiDomain";

type ArchiveHistoryFilter = "tutti" | "fatture" | "preventivi" | "da_verificare";
type ArchiveHistorySectionId = "fatture" | "preventivi" | "documenti";

type ArchiveHistorySection = {
  id: ArchiveHistorySectionId;
  title: string;
  items: NextIADocumentiArchiveItem[];
};

type ArchiveDestination = {
  label: string;
  path: string;
};

const HISTORY_FILTERS: Array<{ id: ArchiveHistoryFilter; label: string }> = [
  { id: "tutti", label: "Tutti" },
  { id: "fatture", label: "Fatture" },
  { id: "preventivi", label: "Preventivi" },
  { id: "da_verificare", label: "Da verificare" },
];

function normalizeArchiveType(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function buildArchiveHistoryReviewPath(item: NextIADocumentiArchiveItem) {
  const params = new URLSearchParams();
  params.set("reviewDocumentId", item.sourceDocId);
  params.set("reviewSourceKey", item.sourceKey);
  return `${NEXT_INTERNAL_AI_PATH}?${params.toString()}`;
}

function formatArchiveAmount(value: string | number | null | undefined) {
  if (value == null || value === "") {
    return "-";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  return String(value).trim() || "-";
}

function buildArchiveRowTitle(item: NextIADocumentiArchiveItem) {
  const type = normalizeArchiveType(item.tipoDocumento) || "DOCUMENTO";
  const numero = String(item.numeroDocumento ?? "").trim();
  const fornitore = String(item.fornitore ?? "").trim();
  if (numero && fornitore) return `${type} ${numero}`;
  if (numero) return `${type} ${numero}`;
  if (fornitore) return `${type} - ${fornitore}`;
  return type;
}

function buildArchiveTypeBadgeLabel(item: NextIADocumentiArchiveItem) {
  const type = normalizeArchiveType(item.tipoDocumento);
  if (type === "FATTURA" || type === "DDT") {
    return type;
  }
  if (type === "PREVENTIVO") {
    return "PREVENTIVO";
  }
  if (item.sourceKey === "@documenti_magazzino") {
    return "MAGAZZINO";
  }
  return type || "DOCUMENTO";
}

function buildArchiveTypeTone(item: NextIADocumentiArchiveItem) {
  const type = normalizeArchiveType(item.tipoDocumento);
  if (type === "PREVENTIVO") return "is-preventivo";
  if (item.sourceKey === "@documenti_magazzino") return "is-magazzino";
  if (type === "FATTURA" || type === "DDT") return "is-fattura";
  return "is-documento";
}

function buildArchiveDestination(item: NextIADocumentiArchiveItem): ArchiveDestination | null {
  const type = normalizeArchiveType(item.tipoDocumento);
  const targa = String(item.targa ?? "").trim();

  if (item.daVerificare) {
    return {
      label: "Vai a review",
      path: buildArchiveHistoryReviewPath(item),
    };
  }

  if (item.sourceKey === "@documenti_magazzino" || type === "MAGAZZINO") {
    return {
      label: "Vai a Inventario",
      path: buildNextMagazzinoPath("inventario"),
    };
  }

  if (targa && type === "PREVENTIVO") {
    return {
      label: "Vai al preventivo",
      path: buildNextDossierPreventiviPath(targa),
    };
  }

  if (targa) {
    return {
      label: "Vai a Manutenzioni",
      path: buildNextManutenzioniPath(targa),
    };
  }

  return null;
}

function isInvoiceArchiveItem(item: NextIADocumentiArchiveItem) {
  const type = normalizeArchiveType(item.tipoDocumento);
  return (
    type === "FATTURA" ||
    type === "DDT" ||
    item.sourceKey === "@documenti_magazzino"
  );
}

function isPreventivoArchiveItem(item: NextIADocumentiArchiveItem) {
  return normalizeArchiveType(item.tipoDocumento) === "PREVENTIVO";
}

function matchesArchiveFilter(item: NextIADocumentiArchiveItem, filter: ArchiveHistoryFilter) {
  if (filter === "tutti") return true;
  if (filter === "da_verificare") return item.daVerificare;
  if (filter === "fatture") return isInvoiceArchiveItem(item);
  if (filter === "preventivi") return isPreventivoArchiveItem(item);
  return true;
}

function buildArchiveSections(
  items: NextIADocumentiArchiveItem[],
  filter: ArchiveHistoryFilter,
): ArchiveHistorySection[] {
  const visibleItems = items.filter((item) => matchesArchiveFilter(item, filter));
  const fatture = visibleItems.filter((item) => isInvoiceArchiveItem(item));
  const preventivi = visibleItems.filter((item) => isPreventivoArchiveItem(item));
  const documenti = visibleItems.filter(
    (item) => !isInvoiceArchiveItem(item) && !isPreventivoArchiveItem(item),
  );

  const sections: ArchiveHistorySection[] = [
    { id: "fatture", title: "Fatture e DDT", items: fatture },
    { id: "preventivi", title: "Preventivi", items: preventivi },
    { id: "documenti", title: "Documenti archivio", items: documenti },
  ];

  return sections.filter((section) => section.items.length > 0);
}

export default function NextIADocumentiPage() {
  const navigate = useNavigate();
  const [historyFilter, setHistoryFilter] = useState<ArchiveHistoryFilter>("tutti");
  const [archiveState, setArchiveState] = useState<{
    status: "loading" | "ready" | "error";
    items: NextIADocumentiArchiveItem[];
    message: string | null;
  }>({
    status: "loading",
    items: [],
    message: null,
  });

  useEffect(() => {
    let cancelled = false;

    const loadArchive = async () => {
      try {
        const snapshot = await readNextIADocumentiArchiveSnapshot({
          includeCloneDocuments: false,
        });
        if (cancelled) {
          return;
        }
        setArchiveState({
          status: "ready",
          items: snapshot.items,
          message: snapshot.limitations[0] ?? null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setArchiveState({
          status: "error",
          items: [],
          message:
            error instanceof Error
              ? error.message
              : "Errore durante il caricamento dello storico IA.",
        });
      }
    };

    void loadArchive();

    return () => {
      cancelled = true;
    };
  }, []);

  const sections = useMemo(
    () => buildArchiveSections(archiveState.items, historyFilter),
    [archiveState.items, historyFilter],
  );

  return (
    <section className="next-page internal-ai-history-page">
      <div className="internal-ai-history-page__shell">
        <header className="internal-ai-history-page__header">
          <div>
            <p className="internal-ai-card__eyebrow">Storico ufficiale</p>
            <h1>Storico analisi IA</h1>
            <p className="internal-ai-card__meta">
              Archivio read-only costruito sul domain reale dell&apos;archivio documentale. Le sezioni
              visibili usano solo i campi oggi esposti dal read-model.
            </p>
          </div>
          <button
            type="button"
            className="internal-ai-search__button"
            onClick={() => navigate(NEXT_INTERNAL_AI_PATH)}
          >
            Apri IA interna
          </button>
        </header>

        <div className="internal-ai-history-page__filters" role="tablist" aria-label="Filtri storico IA">
          {HISTORY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={historyFilter === filter.id}
              className={`internal-ai-history-page__filter ${
                historyFilter === filter.id ? "is-active" : ""
              }`}
              onClick={() => setHistoryFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="internal-ai-history-page__note">
          <span className="internal-ai-pill is-neutral">Domain reale in uso</span>
          <p className="internal-ai-card__meta">
            Libretti, Cisterna e Manutenzioni dedicate non compaiono qui finche il domain dello storico
            non le espone davvero come sezioni leggibili.
          </p>
        </div>

        {archiveState.status === "loading" ? (
          <div className="internal-ai-history-page__empty">Caricamento storico IA...</div>
        ) : null}

        {archiveState.status === "error" ? (
          <div className="internal-ai-history-page__error">
            {archiveState.message ?? "Errore caricamento storico IA."}
          </div>
        ) : null}

        {archiveState.message && archiveState.status === "ready" ? (
          <p className="internal-ai-card__meta">{archiveState.message}</p>
        ) : null}

        {archiveState.status === "ready" && sections.length === 0 ? (
          <div className="internal-ai-history-page__empty">
            Nessun documento disponibile per il filtro selezionato.
          </div>
        ) : null}

        {sections.map((section) => (
          <section key={section.id} className="internal-ai-history-page__section">
            <div className="internal-ai-history-page__section-head">
              <p>{section.title}</p>
            </div>

            <div className="internal-ai-history-page__table">
              {section.items.map((item) => {
                const destination = buildArchiveDestination(item);
                return (
                  <article key={item.id} className="internal-ai-history-page__row">
                    <div className="internal-ai-history-page__row-main">
                      <div className="internal-ai-history-page__type">
                        <span
                          className={`internal-ai-history-page__badge ${buildArchiveTypeTone(item)}`}
                        >
                          {buildArchiveTypeBadgeLabel(item)}
                        </span>
                        <div>
                          <strong>{buildArchiveRowTitle(item)}</strong>
                          <p className="internal-ai-card__meta">
                            {item.fornitore || "Fornitore non disponibile"}
                            {" · "}
                            {item.targa || "Targa non disponibile"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="internal-ai-history-page__row-meta">
                      <span>{item.dataDocumento || "-"}</span>
                      <span>{formatArchiveAmount(item.totaleDocumento)}</span>
                      <span className={item.daVerificare ? "is-warning" : "is-positive"}>
                        {item.daVerificare ? "Da verificare" : "Salvato"}
                      </span>
                    </div>

                    <div className="internal-ai-history-page__row-actions">
                      {item.fileUrl ? (
                        <button
                          type="button"
                          className="internal-ai-search__button internal-ai-search__button--secondary"
                          onClick={() => window.open(item.fileUrl ?? "", "_blank", "noopener,noreferrer")}
                        >
                          Apri originale
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="internal-ai-search__button internal-ai-search__button--secondary"
                        onClick={() => navigate(buildArchiveHistoryReviewPath(item))}
                      >
                        Riapri review
                      </button>
                      {destination ? (
                        <button
                          type="button"
                          className="internal-ai-search__button"
                          onClick={() => navigate(destination.path)}
                        >
                          Vai a
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
