// src/pages/AnalisiEconomica.tsx

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { generateAnalisiEconomicaPDF } from "../utils/pdfEngine";
import "./DossierMezzo.css"; // riusa lo stile premium del dossier

// =========================
// TIPI (copiati da DossierMezzo e adattati)
// =========================

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

interface FatturaPreventivo {
  id: string;
  mezzoTarga?: string;
  tipo: "PREVENTIVO" | "FATTURA";
  data?: string;
  descrizione?: string;
  importo?: number;
  fornitoreLabel?: string;
  fileUrl?: string | null;
}

interface AnalisiEconomicaIA {
  riepilogoBreve?: string;
  analisiCosti?: string;
  anomalie?: string;
  fornitoriNotevoli?: string;
  updatedAt?: any;
  targa?: string;
}

interface FornitoreAggregato {
  nome: string;
  totale: number;
  numeroDocumenti: number;
}

// Dati completi estratti dai PDF (come in IADocumenti)
type TipoDocumento = "PREVENTIVO" | "FATTURA" | "MAGAZZINO" | "GENERICO";
type CategoriaArchivio = "MEZZO" | "MAGAZZINO" | "GENERICO";

interface DocumentoIACompleto {
  tipoDocumento: TipoDocumento;
  categoriaArchivio?: CategoriaArchivio;

  fornitore?: string;
  numeroDocumento?: string;
  dataDocumento?: string;

  targa?: string;
  marca?: string;
  modello?: string;
  telaio?: string;
  km?: string;

  riferimentoPreventivoNumero?: string;
  riferimentoPreventivoData?: string;

  imponibile?: string;
  ivaPercentuale?: string;
  ivaImporto?: string;
  totaleDocumento?: string;

  voci?: any[];

  iban?: string;
  beneficiario?: string;
  riferimentoPagamento?: string;
  banca?: string;
  importoPagamento?: string;

  testo?: string;
  fileUrl?: string | null;
}

// =========================
// HELPER
// =========================

const normalizeTarga = (t: string = "") =>
  t.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();

const normalizeTipo = (tipo: string = "") =>
  tipo.toUpperCase().replace(/\s+/g, "").trim();

const isSameTarga = (a: string, b: string) => {
  const na = normalizeTarga(a);
  const nb = normalizeTarga(b);
  if (na === nb) return true;

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

const parseItalianDate = (d?: string): number => {
  if (!d) return 0;
  const parts = d.split(" ");
  if (parts.length < 3) return 0;
  const [gg, mm, yyyy] = parts;
  const ts = new Date(`${yyyy}-${mm}-${gg}`).getTime();
  return isNaN(ts) ? 0 : ts;
};

const extractImportoFromRaw = (d: any): number | undefined => {
  const candidates = [
    d.importo,
    d.totaleDocumento,
    d.totale,
    d.importoTotale,
    d.totaleFattura,
    d.totale_con_iva,
    d.importoTotaleDocumento,
  ];

  for (let value of candidates) {
    if (value == null) continue;

    // Se è già numero
    if (typeof value === "number" && !isNaN(value)) return value;

    // Converto in stringa
    let str = String(value).trim();

    // Formato "359,97"
    if (/^\d+,\d{2}$/.test(str)) {
      return parseFloat(str.replace(",", "."));
    }

    // Formato "359.97"
    if (/^\d+\.\d{2}$/.test(str)) {
      return parseFloat(str);
    }

    // Formato "35.997,00"
    if (str.includes(".") && str.includes(",")) {
      str = str.replace(/\./g, "").replace(",", ".");
      return parseFloat(str);
    }

    // Formato "320" o "320.00"
    const num = parseFloat(str);
    if (!isNaN(num)) return num;
  }

  return undefined;
};

// =========================
// COMPONENTE PRINCIPALE
// =========================

const AnalisiEconomica: React.FC = () => {
  const { targa } = useParams<{ targa: string }>();
  const navigate = useNavigate();

  const [mezzo, setMezzo] = useState<Mezzo | null>(null);
  const [documentiCosti, setDocumentiCosti] = useState<FatturaPreventivo[]>([]);
  const [documentiIACompleti, setDocumentiIACompleti] = useState<DocumentoIACompleto[]>([]);
  const [analisiIA, setAnalisiIA] = useState<AnalisiEconomicaIA | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingIA, setSavingIA] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!targa) {
        setError("Targa non specificata.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // 1. Carica MEZZO da storage/@mezzi_aziendali
        const mezziDocRef = doc(db, "storage", "@mezzi_aziendali");
        const mezziSnap = await getDoc(mezziDocRef);
        const mezziData = mezziSnap.data() || {};
        const mezziArray = (mezziData.value || []) as Mezzo[];

        const mezzoFound = mezziArray.find(
          (m) =>
            m.targa?.toUpperCase().trim() === targa.toUpperCase().trim()
        );

        // 2. Carica COSTI da storage/@costiMezzo
        const costiDocRef = doc(db, "storage", "@costiMezzo");
        const costiSnap = await getDoc(costiDocRef);
        const costiData = costiSnap.data() || {};
        const costiArray = (costiData.items || []) as FatturaPreventivo[];

        const costiPerMezzoBase = costiArray.filter((c) => {
          const t = (c.mezzoTarga || "").toUpperCase().trim();
          return t === targa.toUpperCase().trim();
        });

        // 3. Carica DOCUMENTI IA da:
        //    @documenti_mezzi, @documenti_magazzino, @documenti_generici
        const iaCollections = [
          "@documenti_mezzi",
          "@documenti_magazzino",
          "@documenti_generici",
        ];

        const mezzoTargaNorm = normalizeTarga(targa);
        let iaDocs: any[] = [];

        for (const colName of iaCollections) {
          try {
            const colRef = collection(db, colName);
            const snap = await getDocs(colRef);

            snap.forEach((docSnap) => {
              const d = docSnap.data() || {};
              const docTipo = normalizeTipo(d.tipoDocumento);
              const docTarga = normalizeTarga(d.targa || "");
              const isDocValid =
                docTipo === "FATTURA" || docTipo === "PREVENTIVO";
              const isTargaMatch =
                isSameTarga(docTarga, mezzoTargaNorm) ||
                (typeof d.testo === "string" &&
                  d.testo.toUpperCase().includes(mezzoTargaNorm));

              if (isDocValid && isTargaMatch) {
                iaDocs.push({
                  ...d,
                  tipoDocumento: docTipo,
                  targa: docTarga || mezzoTargaNorm,
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
          importo: extractImportoFromRaw(d),
          fornitoreLabel: d.fornitore || "",
          fileUrl: d.fileUrl || null,
        }));

        // Dati completi per IA (estratti dai PDF, come salvati da IADocumenti)
        const docsCompleti: DocumentoIACompleto[] = iaDocs.map((d: any) => ({
          tipoDocumento: d.tipoDocumento as TipoDocumento,
          categoriaArchivio: d.categoriaArchivio as CategoriaArchivio,
          fornitore: d.fornitore,
          numeroDocumento: d.numeroDocumento,
          dataDocumento: d.dataDocumento,
          targa: d.targa,
          marca: d.marca,
          modello: d.modello,
          telaio: d.telaio,
          km: d.km,
          riferimentoPreventivoNumero: d.riferimentoPreventivoNumero,
          riferimentoPreventivoData: d.riferimentoPreventivoData,
          imponibile: d.imponibile,
          ivaPercentuale: d.ivaPercentuale,
          ivaImporto: d.ivaImporto,
          totaleDocumento: d.totaleDocumento,
          voci: d.voci || [],
          iban: d.iban,
          beneficiario: d.beneficiario,
          riferimentoPagamento: d.riferimentoPagamento,
          banca: d.banca,
          importoPagamento: d.importoPagamento,
          testo: d.testo,
          fileUrl: d.fileUrl || null,
        }));

        const costiPerMezzo = [...costiPerMezzoBase, ...documentiIA];

        // 4. Carica ANALISI IA salvata in @analisi_economica_mezzi
        const analisiRef = doc(
          db,
          "@analisi_economica_mezzi",
          normalizeTarga(targa)
        );
        const analisiSnap = await getDoc(analisiRef);
        let analisiData: AnalisiEconomicaIA | null = null;
        if (analisiSnap.exists()) {
          analisiData = analisiSnap.data() as AnalisiEconomicaIA;
        }

        if (!cancelled) {
          setMezzo(mezzoFound || null);
          setDocumentiCosti(costiPerMezzo);
          setDocumentiIACompleti(docsCompleti);
          setAnalisiIA(analisiData);
          setLoading(false);
        }
      } catch (e: any) {
        console.error("Errore caricamento AnalisiEconomica:", e);
        if (!cancelled) {
          setError(e?.message || "Errore durante il caricamento dei dati.");
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [targa]);

  // =========================
  // AGGREGAZIONE COSTI
  // =========================

  const {
    preventivi,
    fatture,
    totalePreventivi,
    totaleFatture,
    totaleStorico,
    totaleAnnoCorrente,
  } = useMemo(() => {
    const preventivi = documentiCosti
      .filter((d) => d.tipo === "PREVENTIVO")
      .sort((a, b) => parseItalianDate(b.data) - parseItalianDate(a.data));

    const fatture = documentiCosti
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

    const nowYear = new Date().getFullYear();
    let totaleStorico = 0;
    let totaleAnnoCorrente = 0;

    for (const d of documentiCosti) {
      const imp = d.importo || 0;
      totaleStorico += imp;
      const ts = parseItalianDate(d.data);
      if (ts) {
        const year = new Date(ts).getFullYear();
        if (year === nowYear) {
          totaleAnnoCorrente += imp;
        }
      }
    }

    return {
      preventivi,
      fatture,
      totalePreventivi,
      totaleFatture,
      totaleStorico,
      totaleAnnoCorrente,
    };
  }, [documentiCosti]);

  const fornitoriAggregati: FornitoreAggregato[] = useMemo(() => {
    const map = new Map<string, { totale: number; count: number }>();

    for (const d of documentiCosti) {
      const nome = d.fornitoreLabel || "Senza fornitore";
      const imp = d.importo || 0;
      const prev = map.get(nome) || { totale: 0, count: 0 };
      prev.totale += imp;
      prev.count += 1;
      map.set(nome, prev);
    }

    return Array.from(map.entries())
      .map(([nome, v]) => ({
        nome,
        totale: v.totale,
        numeroDocumenti: v.count,
      }))
      .sort((a, b) => b.totale - a.totale);
  }, [documentiCosti]);

  // =========================
  // IA: RIGENERA ANALISI TESTUALE
  // =========================

  const handleRigeneraAnalisi = async () => {
    if (!targa) return;
    if (documentiCosti.length === 0) {
      setError("Nessun documento di costo trovato per questo mezzo.");
      return;
    }

    try {
      setSavingIA(true);
      setError(null);

      const payload = {
        targa,
        totaleStorico,
        totaleAnnoCorrente,
        totaleFatture,
        totalePreventivi,
        numeroDocumenti: documentiCosti.length,
        numeroFatture: fatture.length,
        numeroPreventivi: preventivi.length,
        perFornitore: fornitoriAggregati.map((f) => ({
          nome: f.nome,
          totale: f.totale,
          numeroDocumenti: f.numeroDocumenti,
        })),
        documenti: documentiIACompleti, // ← dati completi estratti dai PDF
      };

      const response = await fetch(
        "https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/analisi_economica_mezzo",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: payload,
          }),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Errore IA: ${text}`);
      }

      const json = await response.json();
      if (!json.success || !json.data) {
        throw new Error("Risposta IA non valida.");
      }

      const nuovaAnalisi: AnalisiEconomicaIA = {
        riepilogoBreve: json.data.riepilogoBreve ?? "",
        analisiCosti: json.data.analisiCosti ?? "",
        anomalie: json.data.anomalie ?? "",
        fornitoriNotevoli: json.data.fornitoriNotevoli ?? "",
      };

      await setDoc(
        doc(db, "@analisi_economica_mezzi", normalizeTarga(targa)),
        {
          ...nuovaAnalisi,
          targa,
          updatedAt: serverTimestamp(),
        }
      );

      setAnalisiIA(nuovaAnalisi);
    } catch (e: any) {
      console.error("Errore analisi economica IA:", e);
      setError(e?.message || "Errore durante l'analisi economica IA.");
    } finally {
      setSavingIA(false);
    }
  };

  const handleExportPdf = async () => {
    const hasAnalisi =
      !!analisiIA?.analisiCosti ||
      !!analisiIA?.riepilogoBreve ||
      !!analisiIA?.anomalie ||
      !!analisiIA?.fornitoriNotevoli;
    if (!hasAnalisi) {
      alert("Nessuna analisi disponibile");
      return;
    }

    const sezioni: Array<{
      title: string;
      text?: string;
      columns?: string[];
      rows?: string[][];
    }> = [];

    const riepilogoRows: string[][] = [
      ["Totale storico", `${totaleStorico.toFixed(2)} CHF`],
      ["Totale anno corrente", `${totaleAnnoCorrente.toFixed(2)} CHF`],
      ["Totale preventivi", `${totalePreventivi.toFixed(2)} CHF`],
      ["Totale fatture", `${totaleFatture.toFixed(2)} CHF`],
    ];
    sezioni.push({
      title: "Riepilogo costi",
      columns: ["Voce", "Valore"],
      rows: riepilogoRows,
    });

    if (fornitoriAggregati.length > 0) {
      const fornitoriRows = fornitoriAggregati.map((f) => [
        f.nome,
        `${f.totale.toFixed(2)} CHF`,
        String(f.numeroDocumenti),
      ]);
      sezioni.push({
        title: "Fornitori",
        columns: ["Fornitore", "Totale", "Documenti"],
        rows: fornitoriRows,
      });
    }

    if (analisiIA?.riepilogoBreve && analisiIA?.analisiCosti) {
      sezioni.push({ title: "Riepilogo", text: analisiIA.riepilogoBreve });
    }
    if (analisiIA?.fornitoriNotevoli) {
      sezioni.push({
        title: "Fornitori da tenere d'occhio",
        text: analisiIA.fornitoriNotevoli,
      });
    }
    if (analisiIA?.anomalie) {
      sezioni.push({ title: "Anomalie / punti di attenzione", text: analisiIA.anomalie });
    }

    const testoPrincipale =
      analisiIA?.analisiCosti ||
      analisiIA?.riepilogoBreve ||
      "";

    await generateAnalisiEconomicaPDF({
      targa: mezzo?.targa ?? targa ?? "",
      mezzoInfo: mezzo,
      testoAnalisi: testoPrincipale,
      sezioniOpzionali: sezioni,
    });
  };

  // =========================
  // RENDER
  // =========================

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="dossier-wrapper">
        <div className="dossier-loading">
          Caricamento analisi economica in corso…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dossier-wrapper">
        <div className="dossier-error">
          <p>{error}</p>
          <button className="dossier-button" onClick={handleBack}>
            Torna indietro
          </button>
        </div>
      </div>
    );
  }

  if (!mezzo) {
    return (
      <div className="dossier-wrapper">
        <div className="dossier-error">
          <p>Nessun mezzo trovato per la targa: {targa}</p>
          <button className="dossier-button" onClick={handleBack}>
            Torna indietro
          </button>
        </div>
      </div>
    );
  }

  let updatedAtLabel = "";
  if (analisiIA?.updatedAt && analisiIA.updatedAt.toDate) {
    updatedAtLabel = analisiIA.updatedAt
      .toDate()
      .toLocaleString("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
  }

  return (
    <div className="dossier-wrapper">
      {/* HEADER */}
      <div className="dossier-header-bar">
        <button className="dossier-button ghost" onClick={handleBack}>
          ⟵ Dossier
        </button>

        <div className="dossier-header-center">
          <img src="/logo.png" alt="Logo" className="dossier-logo" />
          <div className="dossier-header-text">
            <span className="dossier-header-label">ANALISI ECONOMICA</span>
            <h1 className="dossier-header-title">
              {mezzo.marca} {mezzo.modello} — {mezzo.targa}
            </h1>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button className="dossier-button" onClick={handleExportPdf}>
            Esporta PDF
          </button>
          <button
            className="dossier-button primary"
            onClick={handleRigeneraAnalisi}
            disabled={savingIA || documentiCosti.length === 0}
          >
            {savingIA ? "Analisi IA in corso…" : "Rigenera analisi IA"}
          </button>
        </div>
      </div>

      {/* GRID ANALISI */}
      <div className="dossier-grid">
        {/* RIEPILOGO COSTI */}
        <section className="dossier-card">
          <div className="dossier-card-header">
            <h2>Riepilogo costi</h2>
          </div>
          <div className="dossier-card-body">
            <ul className="dossier-list">
              <li className="dossier-list-item">
                <div className="dossier-list-main">
                  <strong>Totale storico (preventivi + fatture)</strong>
                </div>
                <div className="dossier-list-meta">
                  <span>{totaleStorico.toFixed(2)} CHF</span>
                </div>
              </li>
              <li className="dossier-list-item">
                <div className="dossier-list-main">
                  <strong>Totale anno corrente (tutti i documenti)</strong>
                </div>
                <div className="dossier-list-meta">
                  <span>{totaleAnnoCorrente.toFixed(2)} CHF</span>
                </div>
              </li>
              <li className="dossier-list-item">
                <div className="dossier-list-main">
                  <strong>Totale preventivi</strong>
                </div>
                <div className="dossier-list-meta">
                  <span>{totalePreventivi.toFixed(2)} CHF</span>
                </div>
              </li>
              <li className="dossier-list-item">
                <div className="dossier-list-main">
                  <strong>Totale fatture</strong>
                </div>
                <div className="dossier-list-meta">
                  <span>{totaleFatture.toFixed(2)} CHF</span>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* FORNITORI */}
        <section className="dossier-card">
          <div className="dossier-card-header">
            <h2>Fornitori</h2>
          </div>
          <div className="dossier-card-body">
            {fornitoriAggregati.length === 0 ? (
              <p className="dossier-empty">
                Nessun documento di costo per questo mezzo.
              </p>
            ) : (
              <div className="dossier-table-wrapper">
                <table className="dossier-table">
                  <thead>
                    <tr>
                      <th>Fornitore</th>
                      <th>Totale</th>
                      <th>Documenti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fornitoriAggregati.map((f) => (
                      <tr key={f.nome}>
                        <td>{f.nome}</td>
                        <td>{f.totale.toFixed(2)} CHF</td>
                        <td>{f.numeroDocumenti}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* DOCUMENTI RECENTI */}
        <section className="dossier-card">
          <div className="dossier-card-header">
            <h2>Documenti recenti</h2>
          </div>
          <div className="dossier-card-body">
            {documentiCosti.length === 0 ? (
              <p className="dossier-empty">
                Nessun documento di costo registrato.
              </p>
            ) : (
              <ul className="dossier-list">
                {documentiCosti
                  .slice()
                  .sort(
                    (a, b) =>
                      parseItalianDate(b.data) - parseItalianDate(a.data)
                  )
                  .slice(0, 5)
                  .map((d) => (
                    <li key={d.id} className="dossier-list-item">
                      <div className="dossier-list-main">
                        <span
                          className={
                            d.tipo === "FATTURA"
                              ? "dossier-badge badge-danger"
                              : "dossier-badge badge-info"
                          }
                        >
                          {d.tipo}
                        </span>
                        <strong>{d.descrizione || "-"}</strong>
                      </div>
                      <div className="dossier-list-meta">
                        <span>{d.data || "-"}</span>
                        <span>
                          {d.importo
                            ? `${d.importo.toFixed(2)} CHF`
                            : "Importo n/d"}
                        </span>
                        <span>{d.fornitoreLabel || "-"}</span>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </section>

        {/* ANALISI IA */}
        <section className="dossier-card dossier-card-full">
          <div className="dossier-card-header">
            <h2>Analisi IA</h2>
            {updatedAtLabel && (
              <div className="dossier-chip">
                Ultimo aggiornamento IA: <strong>{updatedAtLabel}</strong>
              </div>
            )}
          </div>
          <div className="dossier-card-body">
            {documentiCosti.length === 0 ? (
              <p className="dossier-empty">
                Carica prima alcuni preventivi/fatture per questo mezzo.
              </p>
            ) : !analisiIA ? (
              <p className="dossier-empty">
                Nessuna analisi IA salvata. Clicca "Rigenera analisi IA" per
                generare il primo riepilogo.
              </p>
            ) : (
              <div className="dossier-ia-blocks">
                {analisiIA.riepilogoBreve && (
                  <div className="dossier-ia-block">
                    <h3>Riepilogo</h3>
                    <p>{analisiIA.riepilogoBreve}</p>
                  </div>
                )}

                {analisiIA.analisiCosti && (
                  <div className="dossier-ia-block">
                    <h3>Analisi costi</h3>
                    <p>{analisiIA.analisiCosti}</p>
                  </div>
                )}

                {analisiIA.fornitoriNotevoli && (
                  <div className="dossier-ia-block">
                    <h3>Fornitori da tenere d'occhio</h3>
                    <p>{analisiIA.fornitoriNotevoli}</p>
                  </div>
                )}

                {analisiIA.anomalie && (
                  <div className="dossier-ia-block">
                    <h3>Anomalie / punti di attenzione</h3>
                    <p>{analisiIA.anomalie}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AnalisiEconomica;
