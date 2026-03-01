// src/pages/OrdiniInAttesa.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getItemSync } from "../utils/storageSync";
import type { Ordine } from "../types/ordini";
import { generateSmartPDF } from "../utils/pdfEngine";
import "./OrdiniInAttesa.css";

interface OrdiniInAttesaProps {
  embedded?: boolean;
}

const OrdiniInAttesa: React.FC<OrdiniInAttesaProps> = ({ embedded = false }) => {
  const navigate = useNavigate();

  const [ordini, setOrdini] = useState<Ordine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrdini = async () => {
      try {
        setLoading(true);
        setError(null);

        const ordiniRaw = await getItemSync("@ordini");
        const arr = Array.isArray(ordiniRaw) ? (ordiniRaw as Ordine[]) : [];

        const inAttesa = arr.filter((ordine) =>
          ordine.materiali.some((m) => !m.arrivato)
        );

        setOrdini(inAttesa);
      } catch (err) {
        console.error("Errore caricamento ordini:", err);
        setError("Errore durante il caricamento degli ordini.");
      } finally {
        setLoading(false);
      }
    };

    void loadOrdini();
  }, []);

  const openDettaglio = (id: string) => {
    navigate(`/dettaglio-ordine/${id}`);
  };

  const esportaPDF = async (ordine: Ordine) => {
    const ordiniFornitore = ordini.filter(
      (o) => o.nomeFornitore === ordine.nomeFornitore
    );

    const rows = ordiniFornitore.flatMap((o) =>
      o.materiali.map((m) => ({
        fornitore: o.nomeFornitore,
        dataOrdine: o.dataOrdine,
        descrizione: m.descrizione,
        quantita: `${m.quantita} ${m.unita}`,
        stato: m.arrivato ? "ARRIVATO" : "IN ATTESA",
        dataArrivo: m.arrivato && m.dataArrivo ? m.dataArrivo : "",
      }))
    );

    await generateSmartPDF({
      kind: "table",
      title: `Ordini - ${ordine.nomeFornitore}`,
      columns: ["fornitore", "dataOrdine", "descrizione", "quantita", "stato", "dataArrivo"],
      rows,
    });
  };

  if (loading) {
    return (
      <div className={`ordini-attesa-page${embedded ? " ordini-attesa-page--embedded" : ""}`}>
        <div className="ordini-attesa-card">
          <p>Caricamento ordini...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`ordini-attesa-page${embedded ? " ordini-attesa-page--embedded" : ""}`}>
      {!embedded && (
        <header className="ordini-attesa-header">
          <img
            src="/logo.png"
            alt="Logo"
            className="ordini-attesa-logo"
            onClick={() => navigate("/")}
          />
          <h1>Ordini in Attesa</h1>
        </header>
      )}

      <div className={`ordini-attesa-wrapper${embedded ? " ordini-attesa-wrapper--embedded" : ""}`}>
        {error && <p className="error-alert">{error}</p>}

        {ordini.length === 0 ? (
          <div className="no-orders-card">
            <p>Nessun ordine in attesa.</p>
          </div>
        ) : (
          <div className="orders-list">
            {ordini.map((ordine) => {
              const tot = ordine.materiali.length;
              const arr = ordine.materiali.filter((m) => m.arrivato).length;
              const nonArr = tot - arr;

              return (
                <div className="order-card" key={ordine.id}>
                  <div className="order-info">
                    <h2 className="order-title">{ordine.nomeFornitore}</h2>
                    <p className="order-date">Ordine del {ordine.dataOrdine}</p>

                    <div className="order-stats">
                      <span className="order-stat">
                        Totale materiali: <strong>{tot}</strong>
                      </span>
                      <span className="order-stat green">
                        Arrivati: <strong>{arr}</strong>
                      </span>
                      <span className="order-stat red">
                        In attesa: <strong>{nonArr}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="order-actions">
                    <button
                      className="btn-primary"
                      onClick={() => openDettaglio(ordine.id)}
                    >
                      Dettaglio ordine
                    </button>

                    <button
                      className="btn-secondary"
                      onClick={() => esportaPDF(ordine)}
                    >
                      PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdiniInAttesa;