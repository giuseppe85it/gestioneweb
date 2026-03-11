import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NextAttrezzatureCantieriReadOnlyPanel from "./NextAttrezzatureCantieriReadOnlyPanel";
import NextInventarioReadOnlyPanel from "./NextInventarioReadOnlyPanel";
import NextMaterialiConsegnatiReadOnlyPanel from "./NextMaterialiConsegnatiReadOnlyPanel";
import type { NextInventarioReadOnlyItem } from "./domain/nextInventarioDomain";
import {
  readNextOperativitaGlobaleSnapshot,
  type NextOperativitaGlobaleSnapshot,
  type NextOperativitaMaintenanceItem,
} from "./domain/nextOperativitaGlobaleDomain";
import NextProcurementReadOnlyPanel from "./NextProcurementReadOnlyPanel";
import type { NextProcurementCloneTab, NextProcurementListTab } from "./domain/nextProcurementDomain";
import "../pages/GestioneOperativa.css";
import "./next-shell.css";

type OperativitaSectionId =
  | "inventario"
  | "materiali"
  | "attrezzature"
  | "manutenzioni"
  | "procurement";

const INLINE_LINK_BUTTON_STYLE = {
  marginTop: 0,
  padding: "2px 8px",
  fontSize: "0.75rem",
};

const ACTIVE_FILTER_BUTTON_STYLE = {
  background: "#4f4126",
  color: "#fff",
  borderColor: "#4f4126",
};

function normalizeSection(value: string | null): OperativitaSectionId {
  if (value === "materiali" || value === "attrezzature" || value === "manutenzioni") {
    return value;
  }
  if (value === "ordini" || value === "procurement") return "procurement";
  return "inventario";
}

function normalizeProcurementTab(
  tabValue: string | null,
  legacyStateValue: string | null
): NextProcurementCloneTab {
  if (
    tabValue === "ordine-materiali" ||
    tabValue === "ordini" ||
    tabValue === "arrivi" ||
    tabValue === "preventivi" ||
    tabValue === "listino"
  ) {
    return tabValue;
  }
  if (legacyStateValue === "arrivato") return "arrivi";
  if (legacyStateValue === "in_attesa" || legacyStateValue === "parziale") return "ordini";
  return "ordini";
}

function normalizeProcurementBackTab(
  value: string | null,
  fallbackTab: NextProcurementCloneTab
): NextProcurementListTab {
  if (value === "arrivi" || value === "ordini") return value;
  return fallbackTab === "arrivi" ? "arrivi" : "ordini";
}

function normalizeOptionalParam(value: string | null): string | null {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

function formatQuantity(value: number | null, unit: string | null): string {
  if (value === null) return "-";
  const normalized = Number.isInteger(value)
    ? String(value)
    : value.toLocaleString("it-IT", { maximumFractionDigits: 2 });
  return unit ? `${normalized} ${unit}` : normalized;
}

const GestioneOperativa: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const detailSectionRef = useRef<HTMLDivElement | null>(null);
  const [snapshot, setSnapshot] = useState<NextOperativitaGlobaleSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeSection = normalizeSection(searchParams.get("section"));
  const procurementTab = normalizeProcurementTab(searchParams.get("tab"), searchParams.get("state"));
  const procurementOrderId = normalizeOptionalParam(searchParams.get("orderId"));
  const procurementBackTab = normalizeProcurementBackTab(searchParams.get("from"), procurementTab);
  const shouldScrollToDetails =
    searchParams.has("section") ||
    searchParams.has("state") ||
    searchParams.has("tab") ||
    searchParams.has("orderId");

  const openReadOnlyTarget = (path: string) => {
    if (path === "/next/centro-controllo") {
      navigate(path);
    }
  };

  const openCloneSection = (
    section: OperativitaSectionId,
    options?: {
      procurementTab?: NextProcurementCloneTab;
      orderId?: string | null;
      backTab?: NextProcurementListTab;
    }
  ) => {
    const nextParams = new URLSearchParams();
    nextParams.set("section", section);
    if (section === "procurement") {
      nextParams.set("tab", options?.procurementTab ?? "ordini");
      if (options?.orderId) {
        nextParams.set("orderId", options.orderId);
      }
      if (options?.backTab) {
        nextParams.set("from", options.backTab);
      }
    }
    setSearchParams(nextParams);
  };

  const openDossier = (targa: string | null) => {
    if (!targa) return;
    navigate(`/next/mezzi-dossier/${targa}`);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const nextSnapshot = await readNextOperativitaGlobaleSnapshot();
        if (!mounted) return;
        setSnapshot(nextSnapshot);
      } catch (err) {
        console.error("Errore caricamento Gestione Operativa clone:", err);
        if (!mounted) return;
        setSnapshot(null);
        setError("Impossibile leggere i dati read-only di Gestione Operativa.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!shouldScrollToDetails || loading || !detailSectionRef.current) return;
    detailSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeSection, loading, procurementOrderId, procurementTab, shouldScrollToDetails]);

  const inventarioPreview = snapshot?.inventario.items.slice(0, 6) ?? [];
  const manutenzioniPreview = snapshot?.manutenzioni.items.slice(0, 5) ?? [];
  const manutenzioniItems = snapshot?.manutenzioni.items ?? [];
  const materialiCritici = snapshot?.inventario.counts.critical ?? 0;
  const numeroConsegne = snapshot?.materialiMovimenti.counts.total ?? 0;

  const activeLimitations = useMemo(() => {
    if (!snapshot) return [];
    if (activeSection === "inventario") return snapshot.inventario.limitations;
    if (activeSection === "materiali") return snapshot.materialiMovimenti.limitations;
    if (activeSection === "attrezzature") return snapshot.attrezzature.limitations;
    if (activeSection === "manutenzioni") return snapshot.manutenzioni.limitations;

    const procurementReasons: string[] = [];
    if (procurementOrderId) {
      procurementReasons.push(snapshot.procurement.navigability.dettaglioOrdine.reason);
    } else if (procurementTab === "ordine-materiali") {
      procurementReasons.push(snapshot.procurement.navigability.ordineMateriali.reason);
    } else if (procurementTab === "preventivi") {
      procurementReasons.push(snapshot.procurement.navigability.preventivi.reason);
    } else if (procurementTab === "listino") {
      procurementReasons.push(snapshot.procurement.navigability.listino.reason);
    }

    return [snapshot.navigability.ordini.reason, ...procurementReasons, ...snapshot.procurement.limitations];
  }, [activeSection, procurementOrderId, procurementTab, snapshot]);

  const renderInventoryRow = (item: NextInventarioReadOnlyItem) => (
    <div key={item.id} className="go-inventario-row" style={{ alignItems: "flex-start" }}>
      <span className="go-inv-desc">
        {item.descrizione}
        <br />
        <small>{item.fornitore ?? "Fornitore non indicato"}</small>
      </span>
      <span className="go-inv-qty">{formatQuantity(item.quantita, item.unita)}</span>
    </div>
  );

  const renderMaintenanceRow = (item: NextOperativitaMaintenanceItem) => (
    <div key={item.id} className="go-storico-row">
      <span>{item.data ?? "-"}</span>
      <span>
        {item.targa ? (
          <button
            type="button"
            className="go-link-btn"
            style={INLINE_LINK_BUTTON_STYLE}
            onClick={() => openDossier(item.targa)}
          >
            {item.targa}
          </button>
        ) : (
          "-"
        )}
      </span>
      <span>
        {item.descrizione ?? "-"}
        {item.materialiCount > 0 ? ` - materiali ${item.materialiCount}` : ""}
        {item.fornitore ? ` - ${item.fornitore}` : ""}
      </span>
    </div>
  );

  return (
    <div className="go-page">
      <div className="go-card">
        <div className="go-header">
          <div className="go-logo-title">
            <img
              src="/logo.png"
              alt="Logo"
              className="go-logo"
              onClick={() => navigate("/next/centro-controllo")}
            />
            <div>
              <h1 className="go-title">Gestione Operativa</h1>
              <p className="go-subtitle">Centro di controllo magazzino e manutenzioni</p>
            </div>
          </div>

          <div className="go-badges">
            {materialiCritici > 0 ? (
              <span className="go-badge danger">{materialiCritici} materiali critici</span>
            ) : null}

            {numeroConsegne > 0 ? (
              <span className="go-badge">{numeroConsegne} consegne registrate</span>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="go-section">
            <div className="go-badge danger">{error}</div>
          </div>
        ) : null}

        <div className="go-section">
          <h2 className="go-section-title">Stato magazzino</h2>

          <div className="go-inventario-preview">
            {loading ? (
              <div className="go-inventario-row">
                <span className="go-inv-desc">Caricamento inventario...</span>
                <span className="go-inv-qty">-</span>
              </div>
            ) : inventarioPreview.length > 0 ? (
              inventarioPreview.map(renderInventoryRow)
            ) : (
              <div className="go-inventario-row">
                <span className="go-inv-desc">Nessun articolo inventario leggibile</span>
                <span className="go-inv-qty">-</span>
              </div>
            )}
          </div>

          <button className="go-link-btn" type="button" onClick={() => openCloneSection("inventario")}>
            Apri inventario completo
          </button>
        </div>

        <div className="go-actions-section">
          <div className="go-actions-title">AZIONI OPERATIVE</div>

          <div className="go-actions">
            <div className="go-action-card use-materiale">
              <h3>Usa materiale</h3>
              <p>Consulta le uscite magazzino e i movimenti materiali in sola lettura.</p>
              <button
                className="go-primary-btn"
                type="button"
                onClick={() => openCloneSection("materiali")}
              >
                Vai a materiali consegnati
              </button>
            </div>

            <div className="go-action-card manutenzione">
              <h3>Registro manutenzioni</h3>
              <p>Apri lo storico manutenzioni globale e salta ai dossier mezzo.</p>
              <button
                className="go-primary-btn"
                type="button"
                onClick={() => openCloneSection("manutenzioni")}
              >
                Vai a manutenzioni
              </button>
            </div>

            <div className="go-action-card">
              <h3>Acquisti / Ordini</h3>
              <p>Apri il workbench procurement clone-safe con ordini, arrivi e dettaglio read-only.</p>
              <button
                className="go-primary-btn"
                type="button"
                onClick={() => openCloneSection("procurement", { procurementTab: "ordini" })}
                title={snapshot?.navigability.ordini.reason ?? undefined}
              >
                Vai ad acquisti
              </button>
            </div>

            <div className="go-action-card">
              <h3>Centro Controllo</h3>
              <p>Monitora manutenzioni programmate e report rifornimenti mensili.</p>
              <button
                className="go-primary-btn"
                type="button"
                onClick={() => openReadOnlyTarget("/next/centro-controllo")}
              >
                Apri Centro Controllo
              </button>
            </div>

            <div className="go-action-card">
              <h3>Attrezzature cantieri</h3>
              <p>Registra consegne, spostamenti e ritiro attrezzature.</p>
              <button
                className="go-primary-btn"
                type="button"
                onClick={() => openCloneSection("attrezzature")}
                title={snapshot?.navigability.attrezzature.reason ?? undefined}
              >
                Vai ad attrezzature cantieri
              </button>
            </div>
          </div>
        </div>

        <div className="go-section">
          <h2 className="go-section-title">Ultime attivita</h2>

          <div className="go-storico">
            {loading ? (
              <div className="go-storico-row">
                <span>...</span>
                <span>Caricamento</span>
                <span>Storico manutenzioni</span>
              </div>
            ) : manutenzioniPreview.length > 0 ? (
              manutenzioniPreview.map(renderMaintenanceRow)
            ) : (
              <div className="go-storico-row">
                <span>-</span>
                <span>-</span>
                <span>Nessuna manutenzione leggibile</span>
              </div>
            )}
          </div>
        </div>

        <div className="go-section" ref={detailSectionRef}>
          <h2 className="go-section-title">Vista operativa read-only</h2>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <button
              type="button"
              className="go-link-btn"
              style={activeSection === "inventario" ? ACTIVE_FILTER_BUTTON_STYLE : undefined}
              onClick={() => openCloneSection("inventario")}
            >
              Inventario
            </button>
            <button
              type="button"
              className="go-link-btn"
              style={activeSection === "materiali" ? ACTIVE_FILTER_BUTTON_STYLE : undefined}
              onClick={() => openCloneSection("materiali")}
            >
              Materiali consegnati
            </button>
            <button
              type="button"
              className="go-link-btn"
              style={activeSection === "manutenzioni" ? ACTIVE_FILTER_BUTTON_STYLE : undefined}
              onClick={() => openCloneSection("manutenzioni")}
            >
              Manutenzioni
            </button>
            <button
              type="button"
              className="go-link-btn"
              style={activeSection === "attrezzature" ? ACTIVE_FILTER_BUTTON_STYLE : undefined}
              onClick={() => openCloneSection("attrezzature")}
              title={snapshot?.navigability.attrezzature.reason ?? undefined}
            >
              Attrezzature
            </button>
            <button
              type="button"
              className="go-link-btn"
              style={activeSection === "procurement" ? ACTIVE_FILTER_BUTTON_STYLE : undefined}
              onClick={() => openCloneSection("procurement", { procurementTab: "ordini" })}
              title={snapshot?.navigability.ordini.reason ?? undefined}
            >
              Acquisti / Ordini
            </button>
          </div>

          {activeSection === "inventario" && snapshot ? (
            <NextInventarioReadOnlyPanel
              snapshot={snapshot.inventario}
              blockedReason={snapshot.navigability.inventario.reason ?? "Clone read-only"}
            />
          ) : null}

          {activeSection === "materiali" && snapshot ? (
            <NextMaterialiConsegnatiReadOnlyPanel
              snapshot={snapshot.materialiMovimenti}
              blockedReason={snapshot.navigability.materiali.reason ?? "Clone read-only"}
              onOpenDossier={openDossier}
            />
          ) : null}

          {activeSection === "attrezzature" && snapshot ? (
            <NextAttrezzatureCantieriReadOnlyPanel
              snapshot={snapshot.attrezzature}
              blockedReason={snapshot.navigability.attrezzature.reason ?? "Clone read-only"}
            />
          ) : null}

          {activeSection === "manutenzioni" ? (
            <div className="go-storico">
              {manutenzioniItems.length > 0 ? (
                manutenzioniItems.map(renderMaintenanceRow)
              ) : (
                <div className="go-storico-row">
                  <span>-</span>
                  <span>-</span>
                  <span>Nessuna manutenzione leggibile</span>
                </div>
              )}
            </div>
          ) : null}

          {activeSection === "procurement" && snapshot ? (
            <NextProcurementReadOnlyPanel
              snapshot={snapshot.procurement}
              activeTab={procurementTab}
              orderId={procurementOrderId}
              detailBackTab={procurementBackTab}
              onTabChange={(tab) => openCloneSection("procurement", { procurementTab: tab })}
              onOpenOrder={(orderId, backTab) =>
                openCloneSection("procurement", {
                  procurementTab: backTab,
                  orderId,
                  backTab,
                })
              }
              onCloseOrder={(backTab) =>
                openCloneSection("procurement", {
                  procurementTab: backTab,
                })
              }
            />
          ) : null}

          {activeLimitations.length > 0 ? (
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {activeLimitations.slice(0, 4).map((note, index) => (
                <div key={`${activeSection}:${index}`} className="go-badge" style={{ borderRadius: 10 }}>
                  {note}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default GestioneOperativa;
