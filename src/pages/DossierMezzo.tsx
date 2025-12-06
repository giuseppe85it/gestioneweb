import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { getItemSync } from "../utils/storageSync";
import "./DossierMezzo.css";

// Normalizza la targa togliendo spazi, simboli e differenze
const normalizeTarga = (t: string = "") =>
  t.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();

// Tipo documento intelligente (accetta fattura, Fattura, FATTURA, ecc.)
const normalizeTipo = (tipo: string = "") =>
  tipo.toUpperCase().replace(/\s+/g, "").trim();

// Confronto targa tollerante (accetta differenze minime IA)
const isSameTarga = (a: string, b: string) => {
  const na = normalizeTarga(a);
  const nb = normalizeTarga(b);

  // Se coincide → ok
  if (na === nb) return true;

  // Se differenza di 1 carattere → consideralo valido
  if (Math.abs(na.length - nb.length) <= 1) {
    const minLen = Math.min(na.length, nb.length);
    let diff = 0;

    for (let i = 0; i < minLen; i++) {
      if (na[i] !== nb[i]) diff++;
      if (diff > 1) return false;
    }

    return true;
  }

  return false;
};

interface Mezzo {
  id?: string;
  targa: string;
  anno?: string;
  categoria?: string;
  massaComplessiva?: string;
  dataImmatricolazione?: string;
  dataScadenzaRevisione?: string;
  marca?: string;
  modello?: string;
  marcaModello?: string;
  colore?: string;
  telaio?: string;
  proprietario?: string;
  assicurazione?: string;
  cilindrata?: string;
  potenza?: string;
  note?: string;
  fotoUrl?: string | null;
  manutenzioneContratto?: string;
  manutenzioneDataInizio?: string;
  manutenzioneDataFine?: string;
  manutenzioneKmMax?: string;
  manutenzioneProgrammata?: boolean;
}

interface Lavoro {
  id: string;
  targa?: string;
  mezzoTarga?: string;
  descrizione: string;
  dettagli?: string;
  dataInserimento?: string;
  eseguito?: boolean;
  urgenza?: string;
  gruppoId?: string;
}

interface MovimentoMateriale {
  id: string;
  mezzoTarga?: string;
  destinatario?: { type: string; refId: string; label: string };
  materialeLabel?: string;
  descrizione?: string;
  fornitore?: string;
  motivo?: string;
  quantita?: number;
  unita?: string;
  direzione?: "IN" | "OUT";
  data?: string;
  fornitoreLabel?: string;
}

interface Rifornimento {
  id: string;
  mezzoTarga?: string;
  data?: string;
  litri?: number;
  distributore?: string;
  costo?: number;
}

interface FatturaPreventivo {
  id: string;
  mezzoTarga?: string;
  tipo: "PREVENTIVO" | "FATTURA";
  data?: string;
  descrizione?: string;
  importo?: number;
  fornitoreLabel?: string;
  fileUrl?: string | null;   // <── AGGIUNTO
}

interface Manutenzione {
  id: string;
  targa?: string;
  tipo?: string;
  data?: string;
  km?: number;
  ore?: number;
  descrizione?: string;
}

interface DossierState {
  mezzo: Mezzo | null;
  lavoriDaEseguire: Lavoro[];
  lavoriInAttesa: Lavoro[];
  lavoriEseguiti: Lavoro[];
  movimentiMateriali: MovimentoMateriale[];
  rifornimenti: Rifornimento[];
  documentiCosti: FatturaPreventivo[];
}

const DossierMezzo: React.FC = () => {
  const { targa } = useParams<{ targa: string }>();
  const navigate = useNavigate();

  const [state, setState] = useState<DossierState>({
    mezzo: null,
    lavoriDaEseguire: [],
    lavoriInAttesa: [],
    lavoriEseguiti: [],
    movimentiMateriali: [],
    rifornimenti: [],
    documentiCosti: [],
  });

  const [manutenzioni, setManutenzioni] = useState<Manutenzione[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAttesaModal, setShowAttesaModal] = useState(false);
  const [showEseguitiModal, setShowEseguitiModal] = useState(false);
  const [showManutenzioniModal, setShowManutenzioniModal] = useState(false);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);
const [showPreviewModal, setShowPreviewModal] = useState(false);
const openDocumento = (url: string) => {
  setPreviewUrl(url);
  setShowPreviewModal(true);
};

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!targa) {
        setError("Targa non specificata.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const mezziDocRef = doc(db, "storage", "@mezzi_aziendali");
        const mezziSnap = await getDoc(mezziDocRef);
        const mezziData = mezziSnap.data() || {};
        const mezziArray = (mezziData.value || []) as Mezzo[];

        const mezzo = mezziArray.find(
          (m) => m.targa?.toUpperCase().trim() === targa.toUpperCase().trim()
        );

        const lavoriDocRef = doc(db, "storage", "@lavori");
        const lavoriSnap = await getDoc(lavoriDocRef);
        const lavoriData = lavoriSnap.data() || {};
        const lavoriArray = (lavoriData.value || []) as Lavoro[];

        const lavoriPerMezzo = lavoriArray.filter((l) => {
          const t = (l.targa || l.mezzoTarga || "").toUpperCase().trim();
          return t === targa.toUpperCase().trim();
        });

        const lavoriDaEseguire = lavoriPerMezzo.filter((l) => l.eseguito === false);
        const lavoriEseguiti = lavoriPerMezzo.filter((l) => l.eseguito === true);
        const lavoriInAttesa = lavoriDaEseguire.filter(
          (l) => l.gruppoId && !l.eseguito
        );

        const movimentiDocRef = doc(db, "storage", "@materialiconsegnati");
        const movimentiSnap = await getDoc(movimentiDocRef);
        const movimentiData = movimentiSnap.data() || {};
        const movimentiArray =
          (movimentiData.value || []) as MovimentoMateriale[];

        const movimentiPerMezzo = movimentiArray.filter(
          (m) => m.destinatario?.label === targa
        );

        movimentiPerMezzo.sort((a, b) => {
          const parse = (d?: string) => {
            if (!d) return 0;
            const [gg, mm, yyyy] = d.split(" ");
            return new Date(`${yyyy}-${mm}-${gg}`).getTime();
          };
          return parse(b.data) - parse(a.data);
        });

        const rifornimentiDocRef = doc(db, "storage", "@rifornimenti");
        const rifornimentiSnap = await getDoc(rifornimentiDocRef);
        const rifornimentiData = rifornimentiSnap.data() || {};
        const rifornimentiArray =
          (rifornimentiData.items || []) as Rifornimento[];

        const rifornimentiPerMezzo = rifornimentiArray.filter((r) => {
          const t = (r.mezzoTarga || "").toUpperCase().trim();
          return t === targa.toUpperCase().trim();
        });

        // ============================
        // LETTURA DOCUMENTI IA — ROOT
        // ============================

        const tgUpper = targa.toUpperCase().trim();
        void tgUpper;

        const iaCollections = [
          "@documenti_mezzi",
          "@documenti_magazzino",
          "@documenti_generici",
        ];

let iaDocs: any[] = [];

for (const col of iaCollections) {
  try {
    const colRef = collection(db, col);
    const snap = await getDocs(colRef);

    snap.forEach((docSnap) => {
      const d = docSnap.data() || {};

      const docTipo = normalizeTipo(d.tipoDocumento);
      const docTarga = normalizeTarga(d.targa);
      const mezzoTargaNorm = normalizeTarga(targa);

      // Accetta solo FATTURA o PREVENTIVO (qualsiasi forma)
      const isDocValid =
        docTipo === "FATTURA" ||
        docTipo === "PREVENTIVO";

      // Targa tollerante (accetta piccoli errori IA)
      const isTargaMatch = isSameTarga(docTarga, mezzoTargaNorm);

      if (isDocValid && isTargaMatch) {
        iaDocs.push({
          ...d,
          tipoDocumento: docTipo,
          targa: docTarga,
        });
      }
    });
  } catch (e) {
    console.error("Errore lettura IA:", e);
  }
}

const documentiIA: FatturaPreventivo[] = iaDocs.map((d: any) => ({
  id: d.id || crypto.randomUUID(),
  mezzoTarga: d.targa || "",
  tipo:
    d.tipoDocumento === "PREVENTIVO"
      ? ("PREVENTIVO" as const)
      : ("FATTURA" as const),
  data: d.dataDocumento || "",
  descrizione: d.fornitore
    ? `${d.tipoDocumento} - ${d.fornitore}`
    : d.tipoDocumento || "-",
  importo: d.totaleDocumento
    ? parseFloat(String(d.totaleDocumento).replace(",", "."))
    : undefined,
  fornitoreLabel: d.fornitore || "",
  fileUrl: d.fileUrl || null,              // <── AGGIUNTO
}));

        const costiDocRef = doc(db, "storage", "@costiMezzo");
        const costiSnap = await getDoc(costiDocRef);
        const costiData = costiSnap.data() || {};
        const costiArray =
          (costiData.items || []) as FatturaPreventivo[];

        const costiPerMezzo = [
          ...costiArray.filter((c) => {
            const t = (c.mezzoTarga || "").toUpperCase().trim();
            return t === targa.toUpperCase().trim();
          }),
          ...documentiIA,
        ];

        // Caricamento manutenzioni via storageSync
        let manArray: Manutenzione[] = [];
        try {
          const rawMan = await getItemSync("@manutenzioni");
          manArray = (rawMan?.value ?? rawMan ?? []) as Manutenzione[];
        } catch {
          manArray = [];
        }

        if (!cancelled) {
          setState({
            mezzo: mezzo || null,
            lavoriDaEseguire,
            lavoriInAttesa,
            lavoriEseguiti,
            movimentiMateriali: movimentiPerMezzo,
            rifornimenti: rifornimentiPerMezzo,
            documentiCosti: costiPerMezzo,
          });
          setManutenzioni(manArray);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Errore durante il caricamento del dossier.");
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [targa]);

  const handleBack = () => {
    navigate("/mezzi");
  };

  const handleOpenPdf = () => {
    console.log("Genera PDF dossier per targa:", targa);
  };


  if (loading) {
    return (
      <div className="dossier-wrapper">
        {showPreviewModal && previewUrl && (
  <div className="dossier-modal-overlay">
    <div className="dossier-modal dossier-pdf-modal">
      <div className="dossier-modal-header">
        <h2>Documento PDF</h2>
        <button
          className="dossier-button"
          onClick={() => setShowPreviewModal(false)}
        >
          Chiudi
        </button>
      </div>

      <div className="dossier-modal-body">
        <iframe
          src={previewUrl}
          style={{ width: "100%", height: "80vh", border: "none" }}
        />
      </div>
    </div>
  </div>
)}
        <div className="dossier-loading">Caricamento dossier in corso…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dossier-wrapper">
        <div className="dossier-error">
          <p>{error}</p>
          <button className="dossier-button" onClick={handleBack}>
            Torna all’elenco mezzi
          </button>
        </div>
      </div>
    );
  }

  if (!state.mezzo) {
    return (
      <div className="dossier-wrapper">
        <div className="dossier-error">
          <p>Nessun mezzo trovato per la targa: {targa}</p>
          <button className="dossier-button" onClick={handleBack}>
            Torna all’elenco mezzi
          </button>
        </div>
      </div>
    );
  }

  const { mezzo } = state;

  const totaleLitri = state.rifornimenti.reduce(
    (sum, r) => sum + (r.litri || 0),
    0
  );
  void totaleLitri;
 
  const parseItalianDate = (d?: string): number => {
    if (!d) return 0;
    const parts = d.split(" ");
    if (parts.length < 3) return 0;
    const [gg, mm, yyyy] = parts;
    return new Date(`${yyyy}-${mm}-${gg}`).getTime();
  };

const preventivi = state.documentiCosti
  .filter((d) => d.tipo === "PREVENTIVO")
  .sort((a, b) => parseItalianDate(b.data) - parseItalianDate(a.data));

const fatture = state.documentiCosti
  .filter((d) => d.tipo === "FATTURA")
  .sort((a, b) => parseItalianDate(b.data) - parseItalianDate(a.data));

  const totalePreventivi = preventivi.reduce(
    (sum, d) => sum + (d.importo || 0),
    0
  );
  const totaleFatture = fatture.reduce(
    (sum, d) => sum + (d.importo || 0),
    0
  );

 
  const urgenzaRank = (u?: string): number => {
    switch ((u || "").toUpperCase()) {
      case "ALTA":
        return 3;
      case "MEDIA":
        return 2;
      case "BASSA":
        return 1;
      default:
        return 0;
    }
  };

  const lavoriInAttesaMostrati = [...state.lavoriInAttesa]
    .sort((a, b) => {
      const rankDiff = urgenzaRank(b.urgenza) - urgenzaRank(a.urgenza);
      if (rankDiff !== 0) return rankDiff;
      return (
        parseItalianDate(b.dataInserimento) -
        parseItalianDate(a.dataInserimento)
      );
    })
    .slice(0, 3);

  const lavoriEseguitiMostrati = [...state.lavoriEseguiti]
    .sort(
      (a, b) =>
        parseItalianDate(b.dataInserimento) -
        parseItalianDate(a.dataInserimento)
    )
    .slice(0, 3);

  const tg = mezzo.targa.toUpperCase().trim();

  const manutenzioniPerTarga = manutenzioni.filter(
    (m) => (m.targa || "").toUpperCase().trim() === tg
  );

  const manutenzioniMostrate = [...manutenzioniPerTarga]
    .sort((a, b) => parseItalianDate(b.data) - parseItalianDate(a.data))
    .slice(0, 3);

  const formatKmOre = (m: Manutenzione): string => {
    const tipo = (m.tipo || "").toLowerCase();
    if (tipo === "mezzo" && m.km != null) {
      return `${m.km} KM`;
    }
    if (tipo === "altro" && m.ore != null) {
      return `${m.ore} ORE`;
    }
    if (m.km != null) {
      return `${m.km} KM`;
    }
    if (m.ore != null) {
      return `${m.ore} ORE`;
    }
    return "-";
  };

  return (
    <div className="dossier-wrapper">
      <div className="dossier-header-bar">
        {showPreviewModal && previewUrl && (
  <div className="dossier-modal-overlay">
    <div className="dossier-modal dossier-pdf-modal">
      <div className="dossier-modal-header">
        <h2>Documento PDF</h2>
        <button
          className="dossier-button"
          onClick={() => setShowPreviewModal(false)}
        >
          Chiudi
        </button>
      </div>

      <div className="dossier-modal-body">
        <iframe
          src={previewUrl}
          style={{ width: "100%", height: "80vh", border: "none" }}
        />
      </div>
    </div>
  </div>
)}

        <button className="dossier-button ghost" onClick={handleBack}>
          ⟵ Mezzi
        </button>

        <div className="dossier-header-center">
          <img src="/logo.png" alt="Logo" className="dossier-logo" />
          <div className="dossier-header-text">
            <span className="dossier-header-label">DOSSIER MEZZO</span>
            <h1 className="dossier-header-title">
              {mezzo.marca} {mezzo.modello} — {mezzo.targa}
            </h1>
          </div>
        </div>

        <button className="dossier-button primary" onClick={handleOpenPdf}>
          Esporta PDF
        </button>
      </div>

      <div className="dossier-grid">
        {/* DATI TECNICI */}
        <section className="dossier-card dossier-card-large">
          <div className="dossier-card-header">
            <h2>Dati tecnici</h2>
          </div>

          <div className="dossier-card-body dossier-tech-grid">
            <div className="dossier-tech-block">
              <h3>Identificazione</h3>
              <ul>
                <li>
                  <span>Proprietario</span>
                  <strong>{mezzo.proprietario || "-"}</strong>
                </li>
                <li>
                  <span>Targa</span>
                  <strong>{mezzo.targa}</strong>
                </li>
                <li>
                  <span>Telaio / VIN</span>
                  <strong>{mezzo.telaio || "-"}</strong>
                </li>
                <li>
                  <span>Assicurazione</span>
                  <strong>{mezzo.assicurazione || "-"}</strong>
                </li>
              </ul>
            </div>

            <div className="dossier-tech-block">
              <h3>Caratteristiche</h3>
              <ul>
                <li>
                  <span>Marca</span>
                  <strong>{mezzo.marca || "-"}</strong>
                </li>
                <li>
                  <span>Modello</span>
                  <strong>{mezzo.modello || "-"}</strong>
                </li>
                <li>
                  <span>Categoria</span>
                  <strong>{mezzo.categoria || "-"}</strong>
                </li>
                <li>
                  <span>Colore</span>
                  <strong>{mezzo.colore || "-"}</strong>
                </li>
              </ul>
            </div>

            <div className="dossier-tech-block">
              <h3>Motore e massa</h3>
              <ul>
                <li>
                  <span>Cilindrata</span>
                  <strong>{mezzo.cilindrata || "-"}</strong>
                </li>
                <li>
                  <span>Potenza</span>
                  <strong>{mezzo.potenza || "-"}</strong>
                </li>
                <li>
                  <span>Massa complessiva</span>
                  <strong>{mezzo.massaComplessiva || "-"}</strong>
                </li>
                <li>
                  <span>Anno</span>
                  <strong>{mezzo.anno || "-"}</strong>
                </li>
              </ul>
            </div>

            <div className="dossier-tech-block">
              <h3>Scadenze</h3>
              <ul>
                <li>
                  <span>Immatricolazione</span>
                  <strong>{mezzo.dataImmatricolazione || "-"}</strong>
                </li>
                <li>
                  <span>Revisione</span>
                  <strong>{mezzo.dataScadenzaRevisione || "-"}</strong>
                </li>
                <li>
                  <span>Note</span>
                  <strong>{mezzo.note || "-"}</strong>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* FOTO MEZZO */}
        <section className="dossier-card dossier-photo-card">
          <div className="dossier-card-header">
            <h2>Foto mezzo</h2>
          </div>

          <div className="dossier-card-body dossier-photo-body">
            {mezzo.fotoUrl ? (
              <img
                src={mezzo.fotoUrl}
                alt={mezzo.targa}
                className="dossier-mezzo-photo"
              />
            ) : (
              <div className="dossier-photo-placeholder">
                Nessuna foto caricata
              </div>
            )}
          </div>
        </section>

        {/* LAVORI */}
        <section className="dossier-card">
          <div className="dossier-card-header">
            <h2>Lavori</h2>
          </div>

          <div className="dossier-card-body dossier-work-grid">
            <div>
              <h3>In attesa</h3>

              {lavoriInAttesaMostrati.length === 0 ? (
                <p className="dossier-empty">Nessun lavoro in attesa.</p>
              ) : (
                <ul className="dossier-list">
                  {lavoriInAttesaMostrati.map((l) => (
                    <li key={l.id} className="dossier-list-item">
                      <div className="dossier-list-main">
                        <span className="dossier-badge badge-info">
                          IN ATTESA
                        </span>
                        <strong>{l.descrizione}</strong>
                      </div>
                      <div className="dossier-list-meta">
                        <span>{l.dettagli}</span>
                        <span>{l.dataInserimento}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <button
                className="dossier-button"
                type="button"
                onClick={() => setShowAttesaModal(true)}
                style={{ marginTop: "12px" }}
              >
                Mostra tutti
              </button>
            </div>

            <div>
              <h3>Eseguiti</h3>

              {lavoriEseguitiMostrati.length === 0 ? (
                <p className="dossier-empty">Nessun lavoro eseguito.</p>
              ) : (
                <ul className="dossier-list">
                  {lavoriEseguitiMostrati.map((l) => (
                    <li key={l.id} className="dossier-list-item">
                      <div className="dossier-list-main">
                        <span className="dossier-badge badge-success">
                          ESEGUITO
                        </span>
                        <strong>{l.descrizione}</strong>
                      </div>
                      <div className="dossier-list-meta">
                        <span>{l.dettagli}</span>
                        <span>{l.dataInserimento}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <button
                className="dossier-button"
                type="button"
                onClick={() => setShowEseguitiModal(true)}
                style={{ marginTop: "12px" }}
              >
                Mostra tutti
              </button>
            </div>
          </div>
        </section>

        {/* MANUTENZIONI */}
        <section className="dossier-card">
          <div className="dossier-card-header">
            <h2>Manutenzioni</h2>
            <button
              className="dossier-button"
              type="button"
              onClick={() => setShowManutenzioniModal(true)}
            >
              Mostra tutti
            </button>
          </div>

          <div className="dossier-card-body">
            {manutenzioniMostrate.length === 0 ? (
              <p className="dossier-empty">
                Nessuna manutenzione registrata per questo mezzo.
              </p>
            ) : (
              <ul className="dossier-list">
                {manutenzioniMostrate.map((m) => (
                  <li key={m.id} className="dossier-list-item">
                    <div className="dossier-list-main">
                      <strong>{m.descrizione || "-"}</strong>
                    </div>
                    <div className="dossier-list-meta">
                      <span>{m.data || "-"}</span>
                      <span>{formatKmOre(m)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* MATERIALI */}
        <section className="dossier-card dossier-card-full">
          <div className="dossier-card-header">
            <h2>Materiali e movimenti inventario</h2>
          </div>

          <div className="dossier-card-body">
            {state.movimentiMateriali.length === 0 ? (
              <p className="dossier-empty">
                Nessun movimento materiali registrato per questo mezzo.
              </p>
            ) : (
              <div className="dossier-table-wrapper">
                <table className="dossier-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Descrizione</th>
                      <th>Q.tà</th>
                      <th>Destinatario</th>
                      <th>Fornitore</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>

                  <tbody>
                    {state.movimentiMateriali.map((m) => (
                      <tr key={m.id}>
                        <td>{m.data || "-"}</td>
                        <td>{m.descrizione || m.materialeLabel || "-"}</td>
                        <td>
                          {m.quantita} {m.unita}
                        </td>
                        <td>{m.destinatario?.label || "-"}</td>
                        <td>{m.fornitore || m.fornitoreLabel || "-"}</td>
                        <td>{m.motivo || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* RIFORNIMENTI */}
        <section className="dossier-card">
          <div className="dossier-card-header">
            <h2>Rifornimenti</h2>
          </div>

          <div className="dossier-card-body">
            {state.rifornimenti.length === 0 ? (
              <p className="dossier-empty">
                Nessun rifornimento registrato per questo mezzo.
              </p>
            ) : (
              <div className="dossier-table-wrapper">
                <table className="dossier-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Litri</th>
                      <th>Distributore</th>
                      <th>Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.rifornimenti.map((r) => (
                      <tr key={r.id}>
                        <td>{r.data || "-"}</td>
                        <td>{r.litri ?? "-"}</td>
                        <td>{r.distributore || "-"}</td>
                        <td>{r.costo != null ? `${r.costo} CHF` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* COSTI */}
        {/* PREVENTIVI */}
        <section className="dossier-card">
          <div className="dossier-card-header">
            <h2>Preventivi</h2>

            <div className="dossier-chip">
              Totale preventivi:{" "}
              <strong>{totalePreventivi.toFixed(2)} CHF</strong>
            </div>
          </div>

          <div className="dossier-card-body">
            {preventivi.length === 0 ? (
              <p className="dossier-empty">
                Nessun preventivo registrato.
              </p>
            ) : (
              <ul className="dossier-list">
                {preventivi.map((d) => (
                  <li key={d.id} className="dossier-list-item">
                    <div className="dossier-list-main">
                      <span className="dossier-badge badge-info">
                        {d.tipo}
                      </span>
                      <strong>{d.descrizione || "-"}</strong>
                    </div>

<div className="dossier-list-meta">
  <span>{d.data}</span>
  <span>
    {d.importo
      ? `${d.importo.toFixed(2)} CHF`
      : "Importo n/d"}
  </span>
  <span>{d.fornitoreLabel || "-"}</span>

  {d.fileUrl && (
<button
  className="dossier-button"
  type="button"
  onClick={() => openDocumento(d.fileUrl!)}
>
  Apri PDF
</button>
  )}
</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* FATTURE */}
        <section className="dossier-card">
          <div className="dossier-card-header">
            <h2>Fatture</h2>

            <div className="dossier-chip">
              Totale fatture:{" "}
              <strong>{totaleFatture.toFixed(2)} CHF</strong>
            </div>
          </div>

          <div className="dossier-card-body">
            {fatture.length === 0 ? (
              <p className="dossier-empty">
                Nessuna fattura registrata.
              </p>
            ) : (
              <ul className="dossier-list">
                {fatture.map((d) => (
                  <li key={d.id} className="dossier-list-item">
                    <div className="dossier-list-main">
                      <span className="dossier-badge badge-danger">
                        {d.tipo}
                      </span>
                      <strong>{d.descrizione || "-"}</strong>
                    </div>

<div className="dossier-list-meta">
  <span>{d.data}</span>
  <span>
    {d.importo
      ? `${d.importo.toFixed(2)} CHF`
      : "Importo n/d"}
  </span>
  <span>{d.fornitoreLabel || "-"}</span>

  {d.fileUrl && (
<button
  className="dossier-button"
  type="button"
  onClick={() => openDocumento(d.fileUrl!)}
>
  Apri PDF
</button>
  )}
</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
       </div>    

      {/* MODALI */}
      {showAttesaModal && (
        <div className="dossier-modal-overlay">
          <div className="dossier-modal">
            <div className="dossier-modal-header">
              <h2>Lavori in attesa — {targa}</h2>
              <button
                className="dossier-button"
                onClick={() => setShowAttesaModal(false)}
              >
                Chiudi
              </button>
            </div>

            <div className="dossier-modal-body">
              {state.lavoriInAttesa.length === 0 ? (
                <p>Nessun lavoro in attesa.</p>
              ) : (
                <ul className="dossier-list">
                  {state.lavoriInAttesa.map((l) => (
                    <li key={l.id} className="dossier-list-item">
                      <div className="dossier-list-main">
                        <span className="dossier-badge badge-info">
                          IN ATTESA
                        </span>
                        <strong>{l.descrizione}</strong>
                      </div>
                      <div className="dossier-list-meta">
                        <span>{l.dettagli}</span>
                        <span>{l.dataInserimento}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {showEseguitiModal && (
        <div className="dossier-modal-overlay">
          <div className="dossier-modal">
            <div className="dossier-modal-header">
              <h2>Lavori eseguiti — {targa}</h2>
              <button
                className="dossier-button"
                onClick={() => setShowEseguitiModal(false)}
              >
                Chiudi
              </button>
            </div>

            <div className="dossier-modal-body">
              {state.lavoriEseguiti.length === 0 ? (
                <p>Nessun lavoro eseguito.</p>
              ) : (
                <ul className="dossier-list">
                  {state.lavoriEseguiti.map((l) => (
                    <li key={l.id} className="dossier-list-item">
                      <div className="dossier-list-main">
                        <span className="dossier-badge badge-success">
                          ESEGUITO
                        </span>
                        <strong>{l.descrizione}</strong>
                      </div>
                      <div className="dossier-list-meta">
                        <span>{l.dettagli}</span>
                        <span>{l.dataInserimento}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {showManutenzioniModal && (
        <div className="dossier-modal-overlay">
          <div className="dossier-modal">
            <div className="dossier-modal-header">
              <h2>Manutenzioni — {targa}</h2>
              <button
                className="dossier-button"
                onClick={() => setShowManutenzioniModal(false)}
              >
                Chiudi
              </button>
            </div>

            <div className="dossier-modal-body">
              {manutenzioniPerTarga.length === 0 ? (
                <p>Nessuna manutenzione registrata.</p>
              ) : (
                <ul className="dossier-list">
                  {manutenzioniPerTarga.map((m) => (
                    <li key={m.id} className="dossier-list-item">
                      <div className="dossier-list-main">
                        <strong>{m.descrizione || "-"}</strong>
                      </div>
                      <div className="dossier-list-meta">
                        <span>{m.data || "-"}</span>
                        <span>{formatKmOre(m)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
     </div>
  );
}  

export default DossierMezzo;
