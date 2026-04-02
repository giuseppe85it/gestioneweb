import { useNavigate } from "react-router-dom";
import "../pages/GestioneOperativa.css";
import {
  NEXT_ATTREZZATURE_CANTIERI_PATH,
  NEXT_INVENTARIO_PATH,
  NEXT_LAVORI_DA_ESEGUIRE_PATH,
  NEXT_LAVORI_ESEGUITI_PATH,
  NEXT_LAVORI_IN_ATTESA_PATH,
  NEXT_MANUTENZIONI_PATH,
  NEXT_MATERIALI_CONSEGNATI_PATH,
  NEXT_MATERIALI_DA_ORDINARE_PATH,
} from "./nextStructuralPaths";
import { useNextOperativitaSnapshot } from "./useNextOperativitaSnapshot";

type FamilyLink = {
  label: string;
  to: string;
};

type FamilyCard = {
  id: string;
  title: string;
  description: string;
  summary: string;
  ctaLabel: string;
  ctaPath: string;
  secondaryLinks: FamilyLink[];
  previewItems: string[];
  toneClassName?: string;
};

function formatQuantity(value: number | null, unit: string | null): string {
  if (value === null) return "-";
  const normalized = Number.isInteger(value)
    ? String(value)
    : value.toLocaleString("it-IT", { maximumFractionDigits: 2 });
  return unit ? `${normalized} ${unit}` : normalized;
}

function formatCountLabel(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

export default function NextGestioneOperativaPage() {
  const navigate = useNavigate();
  const { snapshot, loading, error } = useNextOperativitaSnapshot();

  const inventarioPreview = snapshot?.inventario.items.slice(0, 3) ?? [];
  const procurementPreview = snapshot?.procurement.orders.slice(0, 3) ?? [];
  const manutenzioniPreview = snapshot?.manutenzioni.items.slice(0, 3) ?? [];

  const materialiCritici = snapshot?.inventario.counts.critical ?? 0;
  const articoliInventario = snapshot?.inventario.counts.total ?? 0;
  const movimentiMateriali = snapshot?.materialiMovimenti.counts.total ?? 0;
  const ordiniInAttesa = snapshot?.procurement.counts.pendingOrders ?? 0;
  const ordiniArrivati = snapshot?.procurement.counts.arrivedOrders ?? 0;
  const manutenzioniTotali = snapshot?.manutenzioni.counts.total ?? 0;
  const manutenzioniConMateriali = snapshot?.manutenzioni.counts.withMateriali ?? 0;
  const attrezzatureMovimenti = snapshot?.attrezzature.counts.totalMovements ?? 0;

  const cards: FamilyCard[] = [
    {
      id: "magazzino-materiali",
      title: "Magazzino e materiali",
      description: "Inventario, consegne materiali e tracciamento attrezzature in un solo punto.",
      summary: loading
        ? "Caricamento stato magazzino..."
        : [
            formatCountLabel(articoliInventario, "articolo", "articoli"),
            formatCountLabel(materialiCritici, "criticita", "criticita"),
            formatCountLabel(movimentiMateriali, "movimento", "movimenti"),
          ].join(" - "),
      ctaLabel: "Apri modulo",
      ctaPath: NEXT_INVENTARIO_PATH,
      secondaryLinks: [
        { label: "Materiali consegnati", to: NEXT_MATERIALI_CONSEGNATI_PATH },
        { label: "Attrezzature cantieri", to: NEXT_ATTREZZATURE_CANTIERI_PATH },
      ],
      previewItems: loading
        ? ["Lettura inventario in corso"]
        : inventarioPreview.length > 0
        ? inventarioPreview.map(
            (item) => `${item.descrizione} - ${formatQuantity(item.quantita, item.unita)}`,
          )
        : ["Nessun articolo inventario leggibile"],
      toneClassName: "use-materiale",
    },
    {
      id: "acquisti-ordini",
      title: "Acquisti e ordini",
      description: "Ingresso unico procurement della NEXT centrato su fabbisogni e materiali da ordinare.",
      summary: loading
        ? "Caricamento stato ordini..."
        : [
            formatCountLabel(ordiniInAttesa, "ordine in attesa", "ordini in attesa"),
            formatCountLabel(ordiniArrivati, "ordine arrivato", "ordini arrivati"),
          ].join(" - "),
      ctaLabel: "Apri modulo",
      ctaPath: NEXT_MATERIALI_DA_ORDINARE_PATH,
      secondaryLinks: [],
      previewItems: loading
        ? ["Lettura ordini in corso"]
        : procurementPreview.length > 0
        ? procurementPreview.map(
            (item) =>
              `${item.orderReference} - ${item.supplierName || "Fornitore non valorizzato"}`,
          )
        : ["Nessun ordine leggibile"],
    },
    {
      id: "manutenzioni",
      title: "Manutenzioni",
      description: "Interventi manutentivi leggibili, con stato sintetico e accesso diretto al modulo.",
      summary: loading
        ? "Caricamento manutenzioni..."
        : [
            formatCountLabel(manutenzioniTotali, "intervento", "interventi"),
            formatCountLabel(
              manutenzioniConMateriali,
              "intervento con materiali",
              "interventi con materiali",
            ),
          ].join(" - "),
      ctaLabel: "Apri modulo",
      ctaPath: NEXT_MANUTENZIONI_PATH,
      secondaryLinks: [],
      previewItems: loading
        ? ["Lettura manutenzioni in corso"]
        : manutenzioniPreview.length > 0
        ? manutenzioniPreview.map(
            (item) => `${item.targa ?? "-"} - ${item.descrizione ?? "Intervento"}`,
          )
        : ["Nessuna manutenzione leggibile"],
      toneClassName: "manutenzione",
    },
    {
      id: "lavori",
      title: "Lavori",
      description: "Hub delle code lavori con accesso diretto a esecuzione, attesa e storico.",
      summary: loading
        ? "Caricamento stato lavori..."
        : [
            "3 ingressi lavori",
            formatCountLabel(
              attrezzatureMovimenti,
              "movimento attrezzature",
              "movimenti attrezzature",
            ),
          ].join(" - "),
      ctaLabel: "Apri modulo",
      ctaPath: NEXT_LAVORI_DA_ESEGUIRE_PATH,
      secondaryLinks: [
        { label: "Lavori in attesa", to: NEXT_LAVORI_IN_ATTESA_PATH },
        { label: "Lavori eseguiti", to: NEXT_LAVORI_ESEGUITI_PATH },
      ],
      previewItems: ["Da eseguire", "In attesa", "Eseguiti"],
    },
  ];

  const statusBadges = [
    materialiCritici > 0
      ? {
          id: "critici",
          label: formatCountLabel(materialiCritici, "materiale critico", "materiali critici"),
          danger: true,
        }
      : null,
    {
      id: "inventario",
      label: loading
        ? "Caricamento inventario..."
        : formatCountLabel(articoliInventario, "articolo inventario", "articoli inventario"),
      danger: false,
    },
    {
      id: "ordini",
      label: loading
        ? "Caricamento ordini..."
        : formatCountLabel(ordiniInAttesa, "ordine in attesa", "ordini in attesa"),
      danger: false,
    },
    {
      id: "manutenzioni",
      label: loading
        ? "Caricamento manutenzioni..."
        : formatCountLabel(manutenzioniTotali, "manutenzione", "manutenzioni"),
      danger: false,
    },
  ].filter((badge): badge is { id: string; label: string; danger: boolean } => Boolean(badge));

  const signals = [
    {
      id: "magazzino",
      label: "Magazzino",
      value: loading ? "..." : String(articoliInventario),
      detail: loading
        ? "Lettura inventario in corso"
        : `${materialiCritici} criticita e ${movimentiMateriali} movimenti`,
    },
    {
      id: "acquisti",
      label: "Acquisti",
      value: loading ? "..." : String(ordiniInAttesa),
      detail: loading
        ? "Lettura ordini in corso"
        : `${ordiniArrivati} ordini arrivati nel snapshot`,
    },
    {
      id: "manutenzioni",
      label: "Manut.",
      value: loading ? "..." : String(manutenzioniTotali),
      detail: loading
        ? "Lettura manutenzioni in corso"
        : `${manutenzioniConMateriali} con materiali`,
    },
    {
      id: "lavori",
      label: "Lavori",
      value: "3",
      detail: "Da eseguire, in attesa, eseguiti",
    },
  ];

  return (
    <div className="go-page">
      <div className="go-card">
        <div className="go-header">
          <div className="go-logo-title">
            <img
              src="/logo.png"
              alt="Logo"
              className="go-logo"
              onClick={() => navigate("/next")}
            />
            <div>
              <h1 className="go-title">Gestione Operativa</h1>
              <p className="go-subtitle">
                Hub operativo delle 4 famiglie approvate: magazzino, acquisti, manutenzioni e lavori.
              </p>
            </div>
          </div>

          <div className="go-badges">
            {statusBadges.map((badge) => (
              <span
                key={badge.id}
                className={`go-badge${badge.danger ? " danger" : ""}`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        </div>

        {error ? (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(122, 30, 30, 0.18)",
              background: "#fff6f6",
              color: "#7a1e1e",
              fontSize: "0.88rem",
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        ) : null}

        <div className="go-actions-section">
          <div className="go-actions-title">FAMIGLIE OPERATIVE</div>

          <div className="go-actions">
            {cards.map((card) => (
              <section
                key={card.id}
                className={`go-action-card${card.toneClassName ? ` ${card.toneClassName}` : ""}`}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "#efe7d6",
                    color: "#4f4126",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                  }}
                >
                  {card.summary}
                </div>

                <h3>{card.title}</h3>
                <p>{card.description}</p>

                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    marginBottom: 16,
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid #d8cfbf",
                    background: "#f8f4e8",
                    minHeight: 96,
                  }}
                >
                  {card.previewItems.map((item, index) => (
                    <div
                      key={`${card.id}-preview-${index}`}
                      style={{
                        fontSize: "0.82rem",
                        lineHeight: 1.45,
                        color: "#43382a",
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>

                {card.secondaryLinks.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginBottom: 16,
                    }}
                  >
                    {card.secondaryLinks.map((link) => (
                      <button
                        key={`${card.id}-${link.to}`}
                        type="button"
                        className="go-link-btn"
                        style={{ marginTop: 0 }}
                        onClick={() => navigate(link.to)}
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>
                ) : null}

                <button
                  className="go-primary-btn"
                  type="button"
                  onClick={() => navigate(card.ctaPath)}
                >
                  {card.ctaLabel}
                </button>
              </section>
            ))}
          </div>
        </div>

        <div className="go-section">
          <h2 className="go-section-title">Segnali rapidi</h2>

          <div className="go-storico">
            {signals.map((signal) => (
              <div key={signal.id} className="go-storico-row">
                <span>{signal.label}</span>
                <span>{signal.value}</span>
                <span>{signal.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
