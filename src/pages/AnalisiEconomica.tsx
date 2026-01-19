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

type Currency = "EUR" | "CHF" | "UNKNOWN";

interface FatturaPreventivo {
  id: string;
  mezzoTarga?: string;
  tipo: "PREVENTIVO" | "FATTURA";
  data?: string;
  descrizione?: string;
  importo?: number;
  valuta?: Currency;
  currency?: Currency;
  fornitoreLabel?: string;
  fileUrl?: string | null;
  nomeFile?: string | null;
  sourceKey?: string;
  sourceDocId?: string;
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
  totaleCHF: number;
  totaleEUR: number;
  unknownCount: number;
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
  valuta?: Currency;
  currency?: Currency;
  fileUrl?: string | null;
}

// =========================
// HELPER
// =========================

const normalizeTarga = (t: unknown = "") => {
  if (typeof t !== "string") return "";
  return t.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
};

const detectCurrencyFromText = (input: unknown): Currency => {
  if (!input) return "UNKNOWN";
  const text = String(input).toUpperCase();
  if (text.includes("€") || text.includes("EUR")) return "EUR";
  if (text.includes("CHF") || text.includes("FR.")) return "CHF";
  return "UNKNOWN";
};

const resolveCurrencyFromRecord = (record: any): Currency => {
  const direct = detectCurrencyFromText(record?.valuta ?? record?.currency);
  if (direct !== "UNKNOWN") return direct;
  const source = [
    record?.totaleDocumento,
    record?.importo,
    record?.testo,
    record?.imponibile,
    record?.ivaImporto,
    record?.importoPagamento,
    record?.numeroDocumento,
    record?.fornitoreLabel,
    record?.descrizione,
  ]
    .filter(Boolean)
    .join(" ");
  return detectCurrencyFromText(source);
};

const renderAmountWithCurrency = (
  value: number | undefined,
  currency: Currency
) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "Importo n/d";
  if (currency === "UNKNOWN") {
    return (
      <>
        {value.toFixed(2)}
        <span className="dossier-badge badge-info" style={{ marginLeft: "6px" }}>
          VALUTA DA VERIFICARE
        </span>
      </>
    );
  }
  return `${value.toFixed(2)} ${currency}`;
};

const normalizeTipo = (tipo: string = "") =>
  tipo.toUpperCase().replace(/\s+/g, "").trim();

const fmtTarga = (value?: unknown) => normalizeTarga(value);
const DEBUG_DOCS = true;
const DEBUG_DOC_NAME = "augustonifattura.pdf";

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
void isSameTarga;

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
        const targaNorm = fmtTarga(targa);

        const costiPerMezzoBase = costiArray
          .filter((c) => {
            const docTarga = (c.mezzoTarga || "").toUpperCase().trim();
            return docTarga === targa.toUpperCase().trim();
          })
          .map((c) => ({
            ...c,
            sourceKey: "@costiMezzo",
            valuta: resolveCurrencyFromRecord(c),
          }));

        // 3. Carica DOCUMENTI IA da:
        //    @documenti_mezzi, @documenti_magazzino, @documenti_generici
        const iaCollections = [
          "@documenti_mezzi",
          "@documenti_magazzino",
          "@documenti_generici",
        ];

        let iaDocs: any[] = [];
        let iaDocsRawCount = 0;

        for (const colName of iaCollections) {
          try {
            const colRef = collection(db, colName);
            const snap = await getDocs(colRef);

            snap.forEach((docSnap) => {
              const d = docSnap.data() || {};
              if (DEBUG_DOCS) {
                iaDocsRawCount += 1;
                if (d.nomeFile === DEBUG_DOC_NAME) {
                  const docId =
                    (d as any)?.id ?? (d as any)?.docId ?? docSnap.id ?? "";
                  console.log("[AnalisiEconomica][IA] raw match", {
                    nomeFile: d.nomeFile,
                    targa: d.targa,
                    tipoDocumento: d.tipoDocumento,
                    categoriaArchivio: d.categoriaArchivio,
                    fileUrl: d.fileUrl,
                    docId,
                  });
                }
              }
              const docTipo = normalizeTipo(d.tipoDocumento);
              const docTarga = fmtTarga(d.targa || "");
              const isDocValid =
                docTipo === "FATTURA" || docTipo === "PREVENTIVO";
              const isTargaMatch = docTarga !== "" && docTarga === targaNorm;
              if (DEBUG_DOCS && d.nomeFile === DEBUG_DOC_NAME) {
                console.log("[AnalisiEconomica][IA] filter check", {
                  nomeFile: d.nomeFile,
                  tipoDocumento: d.tipoDocumento,
                  tipoCanon: docTipo,
                  docTargaNorm: docTarga,
                  targaAttivaNorm: targaNorm,
                  isDocValid,
                  isTargaMatch,
                });
              }

              if (isDocValid && isTargaMatch) {
                iaDocs.push({
                  ...d,
                  tipoDocumento: docTipo,
                  targa: docTarga,
                  sourceKey: colName,
                  sourceDocId: docSnap.id,
                });
              }
            });
          } catch (e) {
            console.error("Errore lettura IA:", e);
          }
        }
        if (DEBUG_DOCS) {
          console.log("[AnalisiEconomica][IA] raw count", iaDocsRawCount);
          console.log(
            "[AnalisiEconomica][IA] after type/targa filter",
            iaDocs.length
          );
        }

        const documentiIA: FatturaPreventivo[] = iaDocs.map((d: any) => ({
          id: d.id || d.sourceDocId || crypto.randomUUID(),
          mezzoTarga: fmtTarga(d.targa || ""),
          tipo:
            d.tipoDocumento === "PREVENTIVO"
              ? ("PREVENTIVO" as const)
              : ("FATTURA" as const),
          data: d.dataDocumento || "",
          descrizione: d.fornitore
            ? `${d.tipoDocumento} - ${d.fornitore}`
            : d.tipoDocumento || "-",
          importo: extractImportoFromRaw(d),
          valuta: resolveCurrencyFromRecord(d),
          fornitoreLabel: d.fornitore || "",
          fileUrl: d.fileUrl || null,
          nomeFile: d.nomeFile || null,
          sourceKey: d.sourceKey,
          sourceDocId: d.sourceDocId,
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
          valuta: resolveCurrencyFromRecord(d),
          fileUrl: d.fileUrl || null,
        }));

        const costiPerMezzo = [...costiPerMezzoBase, ...documentiIA];
        if (DEBUG_DOCS) {
          console.log(
            "[AnalisiEconomica][IA] before dedup",
            costiPerMezzo.length
          );
        }
        const dedupKeys = new Set<string>();
        const costiPerMezzoDedup = costiPerMezzo.filter((item) => {
          const docId = item.sourceDocId ?? item.id ?? "";
          if (!docId) return true;
          const sourceKey = item.sourceKey ?? "";
          const key = sourceKey ? `${sourceKey}:${docId}` : String(docId);
          if (DEBUG_DOCS && item.nomeFile === DEBUG_DOC_NAME) {
            console.log("[AnalisiEconomica][IA] dedup check", {
              nomeFile: item.nomeFile,
              sourceKey,
              docId,
              key,
              alreadySeen: dedupKeys.has(key),
            });
          }
          if (dedupKeys.has(key)) return false;
          dedupKeys.add(key);
          return true;
        });
        if (DEBUG_DOCS) {
          console.log(
            "[AnalisiEconomica][IA] after dedup",
            costiPerMezzoDedup.length
          );
        }

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
          setDocumentiCosti(costiPerMezzoDedup);
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
    totalePreventiviCHF,
    totalePreventiviEUR,
    totaleFattureCHF,
    totaleFattureEUR,
    totaleStoricoCHF,
    totaleStoricoEUR,
    totaleAnnoCorrenteCHF,
    totaleAnnoCorrenteEUR,
    valutaDaVerificare,
  } = useMemo(() => {
    const enriched = documentiCosti.map((d) => ({
      ...d,
      valuta: d.valuta ?? resolveCurrencyFromRecord(d),
    }));

    const preventivi = enriched
      .filter((d) => d.tipo === "PREVENTIVO")
      .sort((a, b) => parseItalianDate(b.data) - parseItalianDate(a.data));

    const fatture = enriched
      .filter((d) => d.tipo === "FATTURA")
      .sort((a, b) => parseItalianDate(b.data) - parseItalianDate(a.data));

    let totalePreventiviCHF = 0;
    let totalePreventiviEUR = 0;
    let totaleFattureCHF = 0;
    let totaleFattureEUR = 0;
    let totaleStoricoCHF = 0;
    let totaleStoricoEUR = 0;
    let totaleAnnoCorrenteCHF = 0;
    let totaleAnnoCorrenteEUR = 0;
    let valutaDaVerificare = 0;
    const nowYear = new Date().getFullYear();

    for (const d of enriched) {
      if (typeof d.importo !== "number" || Number.isNaN(d.importo)) continue;
      const currency = d.valuta ?? "UNKNOWN";
      if (currency === "UNKNOWN") {
        valutaDaVerificare += 1;
        continue;
      }

      if (currency === "CHF") {
        totaleStoricoCHF += d.importo;
      } else {
        totaleStoricoEUR += d.importo;
      }

      const ts = parseItalianDate(d.data);
      if (ts) {
        const year = new Date(ts).getFullYear();
        if (year === nowYear) {
          if (currency === "CHF") {
            totaleAnnoCorrenteCHF += d.importo;
          } else {
            totaleAnnoCorrenteEUR += d.importo;
          }
        }
      }

      if (d.tipo === "PREVENTIVO") {
        if (currency === "CHF") totalePreventiviCHF += d.importo;
        else totalePreventiviEUR += d.importo;
      } else {
        if (currency === "CHF") totaleFattureCHF += d.importo;
        else totaleFattureEUR += d.importo;
      }
    }

    return {
      preventivi,
      fatture,
      totalePreventiviCHF,
      totalePreventiviEUR,
      totaleFattureCHF,
      totaleFattureEUR,
      totaleStoricoCHF,
      totaleStoricoEUR,
      totaleAnnoCorrenteCHF,
      totaleAnnoCorrenteEUR,
      valutaDaVerificare,
    };
  }, [documentiCosti]);

  const fornitoriAggregati: FornitoreAggregato[] = useMemo(() => {
    const map = new Map<string, { chf: number; eur: number; unknown: number; count: number }>();

    for (const d of documentiCosti) {
      const nome = d.fornitoreLabel || "Senza fornitore";
      const imp = typeof d.importo === "number" && !Number.isNaN(d.importo) ? d.importo : null;
      const currency = resolveCurrencyFromRecord(d);
      const prev = map.get(nome) || { chf: 0, eur: 0, unknown: 0, count: 0 };
      if (imp != null) {
        if (currency === "CHF") prev.chf += imp;
        else if (currency === "EUR") prev.eur += imp;
        else prev.unknown += 1;
      }
      prev.count += 1;
      map.set(nome, prev);
    }

    return Array.from(map.entries())
      .map(([nome, v]) => ({
        nome,
        totaleCHF: v.chf,
        totaleEUR: v.eur,
        unknownCount: v.unknown,
        numeroDocumenti: v.count,
      }))
      .sort((a, b) => b.totaleCHF + b.totaleEUR - (a.totaleCHF + a.totaleEUR));
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

      const totaleStorico = totaleStoricoCHF + totaleStoricoEUR;
      const totaleAnnoCorrente = totaleAnnoCorrenteCHF + totaleAnnoCorrenteEUR;
      const totaleFatture = totaleFattureCHF + totaleFattureEUR;
      const totalePreventivi = totalePreventiviCHF + totalePreventiviEUR;

      const payload = {
        targa,
        totaleStorico,
        totaleAnnoCorrente,
        totaleFatture,
        totalePreventivi,
        totaleStoricoCHF,
        totaleStoricoEUR,
        totaleAnnoCorrenteCHF,
        totaleAnnoCorrenteEUR,
        totaleFattureCHF,
        totaleFattureEUR,
        totalePreventiviCHF,
        totalePreventiviEUR,
        valutaDaVerificare,
        numeroDocumenti: documentiCosti.length,
        numeroFatture: fatture.length,
        numeroPreventivi: preventivi.length,
        perFornitore: fornitoriAggregati.map((f) => ({
          nome: f.nome,
          totaleCHF: f.totaleCHF,
          totaleEUR: f.totaleEUR,
          valutaDaVerificare: f.unknownCount,
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
      ["Totale storico CHF", `${totaleStoricoCHF.toFixed(2)} CHF`],
      ["Totale storico EUR", `${totaleStoricoEUR.toFixed(2)} EUR`],
      ["Totale anno corrente CHF", `${totaleAnnoCorrenteCHF.toFixed(2)} CHF`],
      ["Totale anno corrente EUR", `${totaleAnnoCorrenteEUR.toFixed(2)} EUR`],
      ["Totale preventivi CHF", `${totalePreventiviCHF.toFixed(2)} CHF`],
      ["Totale preventivi EUR", `${totalePreventiviEUR.toFixed(2)} EUR`],
      ["Totale fatture CHF", `${totaleFattureCHF.toFixed(2)} CHF`],
      ["Totale fatture EUR", `${totaleFattureEUR.toFixed(2)} EUR`],
    ];
    if (valutaDaVerificare > 0) {
      riepilogoRows.push([
        "Valuta da verificare",
        String(valutaDaVerificare),
      ]);
    }
    sezioni.push({
      title: "Riepilogo costi",
      columns: ["Voce", "Valore"],
      rows: riepilogoRows,
    });

    if (fornitoriAggregati.length > 0) {
      const fornitoriRows = fornitoriAggregati.map((f) => [
        f.nome,
        `${f.totaleCHF.toFixed(2)} CHF`,
        `${f.totaleEUR.toFixed(2)} EUR`,
        String(f.unknownCount),
        String(f.numeroDocumenti),
      ]);
      sezioni.push({
        title: "Fornitori",
        columns: ["Fornitore", "Totale CHF", "Totale EUR", "Valuta n/d", "Documenti"],
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
                  <span>CHF {totaleStoricoCHF.toFixed(2)}</span>
                  <span>EUR {totaleStoricoEUR.toFixed(2)}</span>
                </div>
              </li>
              <li className="dossier-list-item">
                <div className="dossier-list-main">
                  <strong>Totale anno corrente (tutti i documenti)</strong>
                </div>
                <div className="dossier-list-meta">
                  <span>CHF {totaleAnnoCorrenteCHF.toFixed(2)}</span>
                  <span>EUR {totaleAnnoCorrenteEUR.toFixed(2)}</span>
                </div>
              </li>
              <li className="dossier-list-item">
                <div className="dossier-list-main">
                  <strong>Totale preventivi</strong>
                </div>
                <div className="dossier-list-meta">
                  <span>CHF {totalePreventiviCHF.toFixed(2)}</span>
                  <span>EUR {totalePreventiviEUR.toFixed(2)}</span>
                </div>
              </li>
              <li className="dossier-list-item">
                <div className="dossier-list-main">
                  <strong>Totale fatture</strong>
                </div>
                <div className="dossier-list-meta">
                  <span>CHF {totaleFattureCHF.toFixed(2)}</span>
                  <span>EUR {totaleFattureEUR.toFixed(2)}</span>
                </div>
              </li>
              {valutaDaVerificare > 0 && (
                <li className="dossier-list-item">
                  <div className="dossier-list-main">
                    <strong>Valuta da verificare</strong>
                  </div>
                  <div className="dossier-list-meta">
                    <span className="dossier-badge badge-info">
                      {valutaDaVerificare}
                    </span>
                  </div>
                </li>
              )}
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
                      <th>Totale CHF</th>
                      <th>Totale EUR</th>
                      <th>Valuta n/d</th>
                      <th>Documenti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fornitoriAggregati.map((f) => (
                      <tr key={f.nome}>
                        <td>{f.nome}</td>
                        <td>{f.totaleCHF.toFixed(2)} CHF</td>
                        <td>{f.totaleEUR.toFixed(2)} EUR</td>
                        <td>{f.unknownCount}</td>
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
                          {renderAmountWithCurrency(
                            d.importo,
                            d.valuta ?? resolveCurrencyFromRecord(d)
                          )}
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
