import { Link } from "react-router-dom";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type {
  D10AssetLocationItem,
  D10SessionItem,
} from "../domain/nextCentroControlloDomain";

type StatoOperativoTabId = "sessioni" | "rimorchi" | "motrici";

type RimorchioEditState = {
  targa: string;
  luogo: string;
  eventId: string | null;
  eventIndex: number | null;
};

type StatoOperativoCardProps = {
  loading: boolean;
  sessioni: D10SessionItem[];
  rimorchi: D10AssetLocationItem[];
  motrici: D10AssetLocationItem[];
  sessioniPath: string;
  assetPath: string;
  getTargaTooltip: (targa: string | null | undefined) => string;
  getMezzoLabel: (targa: string | null | undefined) => string;
  rimorchioEdit: RimorchioEditState | null;
  onRimorchioDraftChange: (value: string) => void;
  onStartRimorchioEdit: (item: D10AssetLocationItem) => void;
  onCancelRimorchioEdit: () => void;
  onSaveRimorchioEdit: () => void;
};

const MAX_VISIBLE_ROWS = 5;

const tabButtonBaseStyle: CSSProperties = {
  border: "1px solid rgba(15, 23, 42, 0.12)",
  borderRadius: 999,
  padding: "8px 12px",
  background: "#fff",
  color: "#0f172a",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

function fmtTarga(value: string | null | undefined): string {
  return String(value || "").trim().toUpperCase();
}

function StatoOperativoCard(props: StatoOperativoCardProps) {
  const {
    loading,
    sessioni,
    rimorchi,
    motrici,
    sessioniPath,
    assetPath,
    getTargaTooltip,
    getMezzoLabel,
    rimorchioEdit,
    onRimorchioDraftChange,
    onStartRimorchioEdit,
    onCancelRimorchioEdit,
    onSaveRimorchioEdit,
  } = props;
  const [activeTab, setActiveTab] = useState<StatoOperativoTabId>("sessioni");
  const [modalOpen, setModalOpen] = useState(false);
  const [sessioniTargaFilter, setSessioniTargaFilter] = useState("");
  const [sessioniAutistaFilter, setSessioniAutistaFilter] = useState("");
  const [assetTargaFilter, setAssetTargaFilter] = useState("");

  const tabOptions = useMemo(
    () => [
      {
        id: "sessioni" as const,
        label: "Sessioni",
        count: sessioni.length,
        subtitle: "Sessioni live e accesso rapido ad Autisti Inbox",
        viewAllPath: sessioniPath,
      },
      {
        id: "rimorchi" as const,
        label: "Rimorchi",
        count: rimorchi.length,
        subtitle: "Ultimo luogo da storico eventi",
        viewAllPath: assetPath,
      },
      {
        id: "motrici" as const,
        label: "Motrici",
        count: motrici.length,
        subtitle: "Ultimo luogo da storico eventi",
        viewAllPath: assetPath,
      },
    ],
    [assetPath, motrici.length, rimorchi.length, sessioni.length, sessioniPath]
  );

  const activeTabConfig = tabOptions.find((option) => option.id === activeTab) ?? tabOptions[0];
  useEffect(() => {
    if (!modalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;
    if (activeTab === "sessioni") {
      setAssetTargaFilter("");
      return;
    }
    setSessioniTargaFilter("");
    setSessioniAutistaFilter("");
  }, [activeTab, modalOpen]);

  const normalizedSessioniTargaFilter = sessioniTargaFilter.trim().toUpperCase();
  const normalizedSessioniAutistaFilter = sessioniAutistaFilter.trim().toLowerCase();
  const normalizedAssetTargaFilter = assetTargaFilter.trim().toUpperCase();

  const filteredSessioni = useMemo(() => {
    return sessioni.filter((sessione) => {
      const motrice = fmtTarga(sessione.targaMotrice);
      const rimorchio = fmtTarga(sessione.targaRimorchio);
      const autista = String(sessione.nomeAutista || "").trim().toLowerCase();
      const matchesTarga =
        !normalizedSessioniTargaFilter ||
        motrice.includes(normalizedSessioniTargaFilter) ||
        rimorchio.includes(normalizedSessioniTargaFilter);
      const matchesAutista =
        !normalizedSessioniAutistaFilter || autista.includes(normalizedSessioniAutistaFilter);
      return matchesTarga && matchesAutista;
    });
  }, [normalizedSessioniAutistaFilter, normalizedSessioniTargaFilter, sessioni]);

  const filteredRimorchi = useMemo(() => {
    return rimorchi.filter((item) =>
      !normalizedAssetTargaFilter || fmtTarga(item.targa).includes(normalizedAssetTargaFilter)
    );
  }, [normalizedAssetTargaFilter, rimorchi]);

  const filteredMotrici = useMemo(() => {
    return motrici.filter((item) =>
      !normalizedAssetTargaFilter || fmtTarga(item.targa).includes(normalizedAssetTargaFilter)
    );
  }, [motrici, normalizedAssetTargaFilter]);

  const modalTitle =
    activeTab === "sessioni"
      ? "Tutte le sessioni attive"
      : activeTab === "rimorchi"
      ? "Tutti i rimorchi"
      : "Tutte le motrici";

  const renderSessioni = (items: D10SessionItem[], maxRows?: number) => {
    if (loading) {
      return <div className="panel-row panel-row-empty">Caricamento dati...</div>;
    }
    if (items.length === 0) {
      return <div className="panel-row panel-row-empty">Nessuna sessione attiva</div>;
    }

    const visibleItems = typeof maxRows === "number" ? items.slice(0, maxRows) : items;

    return visibleItems.map((sessione) => {
      const motrice = fmtTarga(sessione.targaMotrice);
      const rimorchio = fmtTarga(sessione.targaRimorchio);
      return (
        <Link key={sessione.id} to={sessioniPath} className="panel-row">
          <div className="row-main">
            <div className="row-title">
              <span>{sessione.nomeAutista || "Autista"}</span>
              <span className="badge">badge {sessione.badgeAutista || "-"}</span>
            </div>
            <div className="row-meta">
              <span className="label">Motrice:</span>{" "}
              <span className="targa" title={getTargaTooltip(motrice) || undefined}>
                {motrice || "-"}
              </span>{" "}
              <span className="label">Rimorchio:</span>{" "}
              <span className="targa" title={getTargaTooltip(rimorchio) || undefined}>
                {rimorchio || "-"}
              </span>
            </div>
          </div>
          <span className="row-arrow">-&gt;</span>
        </Link>
      );
    });
  };

  const renderAssetRows = (
    items: D10AssetLocationItem[],
    emptyLabel: string,
    prefix: string,
    maxRows?: number
  ) => {
    if (loading) {
      return <div className="panel-row panel-row-empty">Caricamento dati...</div>;
    }
    if (items.length === 0) {
      return <div className="panel-row panel-row-empty">{emptyLabel}</div>;
    }

    const visibleItems = typeof maxRows === "number" ? items.slice(0, maxRows) : items;

    return visibleItems.map((item, index) => {
      const tooltip = getTargaTooltip(item.targa);
      const mezzoLabel = getMezzoLabel(item.targa);
      const isEditing = rimorchioEdit?.targa === item.targa;
      const canEdit = !item.inUso;

      if (isEditing) {
        return (
          <div key={item.targa || `${prefix}-${index}`} className="panel-row panel-row-edit">
            <div className="row-main">
              <div className="row-title rimorchi-title">
                <span className="targa" title={tooltip || undefined}>
                  {item.targa || "-"}
                </span>
                {mezzoLabel ? <span className="rimorchi-model">- {mezzoLabel}</span> : null}
                <span className={`status ${item.inUso ? "in-uso" : "sganciato"}`}>
                  {item.inUso ? "IN USO" : item.statusLabel}
                </span>
              </div>
              <div className="rimorchi-edit">
                <input
                  className="rimorchi-edit-input"
                  value={rimorchioEdit?.luogo ?? ""}
                  onChange={(event) => onRimorchioDraftChange(event.target.value)}
                  placeholder="Inserisci luogo..."
                />
                <div className="rimorchi-edit-actions">
                  <button
                    type="button"
                    className="rimorchi-edit-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      onCancelRimorchioEdit();
                    }}
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    className="rimorchi-edit-btn primary"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSaveRimorchioEdit();
                    }}
                  >
                    Salva
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      return (
        <Link key={item.targa || `${prefix}-${index}`} to={assetPath} className="panel-row">
          <div className="row-main">
            <div className="row-title rimorchi-title">
              <span className="targa" title={tooltip || undefined}>
                {item.targa || "-"}
              </span>
              {mezzoLabel ? <span className="rimorchi-model">- {mezzoLabel}</span> : null}
              <span className={`status ${item.inUso ? "in-uso" : "sganciato"}`}>
                {item.inUso ? "IN USO" : item.statusLabel}
              </span>
            </div>
            <div className="row-meta">
              <span className="rimorchi-luogo">{item.luogo}</span>
              {canEdit ? (
                <button
                  type="button"
                  className="rimorchi-edit-btn"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onStartRimorchioEdit(item);
                  }}
                >
                  Modifica
                </button>
              ) : null}
            </div>
          </div>
          <span className="row-arrow">-&gt;</span>
        </Link>
      );
    });
  };

  return (
    <section
      className="panel panel-sessioni home-card home-top-equal-card"
      style={{ animationDelay: "120ms" }}
    >
      <div
        className="panel-head home-card__head home-top-equal-card__head"
        style={{ alignItems: "flex-start", gap: 12 }}
      >
        <div>
          <h2 className="home-card__title">Stato operativo</h2>
          <span className="home-card__subtitle">{activeTabConfig.subtitle}</span>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          style={{
            marginLeft: "auto",
            whiteSpace: "nowrap",
            fontSize: 13,
            fontWeight: 700,
            color: "#0f172a",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Vedi tutto
        </button>
      </div>
      <div className="home-card__body home-top-equal-card__body home-stato-operativo__body">
        <div
          className="home-stato-operativo__tabs"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 12,
          }}
        >
          {tabOptions.map((option) => {
            const isActive = option.id === activeTab;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveTab(option.id)}
                style={{
                  ...tabButtonBaseStyle,
                  background: isActive ? "#0f172a" : "#fff",
                  color: isActive ? "#fff" : "#0f172a",
                }}
              >
                <span>{option.label}</span>
                <span
                  style={{
                    borderRadius: 999,
                    padding: "2px 8px",
                    background: isActive ? "rgba(255,255,255,0.18)" : "rgba(15, 23, 42, 0.08)",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="panel-body home-stato-operativo__list">
          {activeTab === "sessioni"
            ? renderSessioni(sessioni, MAX_VISIBLE_ROWS)
            : activeTab === "rimorchi"
            ? renderAssetRows(rimorchi, "Nessun rimorchio trovato", "rim", MAX_VISIBLE_ROWS)
            : renderAssetRows(motrici, "Nessun mezzo trovato", "mot", MAX_VISIBLE_ROWS)}
        </div>

        <div
          className="panel-row panel-row-empty home-stato-operativo__footer"
          style={{ justifyContent: "space-between", gap: 12 }}
        >
          <span>
            Mostrati {Math.min(MAX_VISIBLE_ROWS, activeTabConfig.count)} di {activeTabConfig.count}
          </span>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{ textDecoration: "none", fontWeight: 700, color: "#0f172a" }}
          >
            Vedi tutto
          </button>
        </div>
      </div>

      {modalOpen ? (
        <div
          role="presentation"
          onClick={() => setModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1300,
            background: "rgba(15, 23, 42, 0.56)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={modalTitle}
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(1120px, calc(100vw - 32px))",
              maxHeight: "92vh",
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 28px 80px rgba(15, 23, 42, 0.28)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                zIndex: 1,
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "18px 20px 14px",
                borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
                background: "#fff",
              }}
            >
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{modalTitle}</div>
                <div style={{ marginTop: 4, fontSize: 13, color: "#475569" }}>
                  {activeTab === "sessioni"
                    ? `${filteredSessioni.length} sessioni visibili`
                    : activeTab === "rimorchi"
                    ? `${filteredRimorchi.length} rimorchi visibili`
                    : `${filteredMotrici.length} motrici visibili`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{
                  marginLeft: "auto",
                  border: "1px solid rgba(15, 23, 42, 0.14)",
                  background: "#fff",
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Chiudi
              </button>
            </div>

            <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid rgba(15, 23, 42, 0.08)" }}>
              {activeTab === "sessioni" ? (
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  }}
                >
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Filtro targa</span>
                    <input
                      value={sessioniTargaFilter}
                      onChange={(event) => setSessioniTargaFilter(event.target.value)}
                      placeholder="Cerca per targa"
                      style={{
                        border: "1px solid rgba(15, 23, 42, 0.14)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontSize: 14,
                      }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Filtro autista</span>
                    <input
                      value={sessioniAutistaFilter}
                      onChange={(event) => setSessioniAutistaFilter(event.target.value)}
                      placeholder="Cerca per autista"
                      style={{
                        border: "1px solid rgba(15, 23, 42, 0.14)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontSize: 14,
                      }}
                    />
                  </label>
                </div>
              ) : (
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>Filtro targa</span>
                  <input
                    value={assetTargaFilter}
                    onChange={(event) => setAssetTargaFilter(event.target.value)}
                    placeholder="Cerca per targa"
                    style={{
                      border: "1px solid rgba(15, 23, 42, 0.14)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontSize: 14,
                    }}
                  />
                </label>
              )}
            </div>

            <div style={{ overflowY: "auto", padding: 20 }}>
              <div className="panel-body">
                {activeTab === "sessioni"
                  ? renderSessioni(filteredSessioni)
                  : activeTab === "rimorchi"
                  ? renderAssetRows(filteredRimorchi, "Nessun rimorchio trovato", "rim-modal")
                  : renderAssetRows(filteredMotrici, "Nessun mezzo trovato", "mot-modal")}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default StatoOperativoCard;
