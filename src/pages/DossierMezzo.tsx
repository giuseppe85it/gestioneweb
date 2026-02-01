import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getItemSync } from "../utils/storageSync";
import { generateDossierMezzoPDF } from "../utils/pdfEngine";
import { formatDateTimeUI, formatDateUI } from "../utils/dateFormat";
import "./DossierMezzo.css";

// Normalizza la targa togliendo spazi, simboli e differenze
const normalizeTarga = (t?: unknown) => {
  if (typeof t !== "string") return "";
  return t.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
};

const normalizeRifornimentoTarga = (t?: unknown) => {
  if (typeof t !== "string") return "";
  return t.toUpperCase().replace(/\s+/g, "").trim();
};

// Tipo documento intelligente (accetta fattura, Fattura, FATTURA, ecc.)
const normalizeTipo = (tipo?: unknown) => {
  if (typeof tipo !== "string") return "";
  return tipo.toUpperCase().replace(/\s+/g, "").trim();
};

type Currency = "EUR" | "CHF" | "UNKNOWN";

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

const DEBUG_DOCS = true;
const DEBUG_DOC_NAME = "augustonifattura.pdf";

const fmtTarga = (value?: unknown) => normalizeTarga(value);

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
void isSameTarga;

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
  librettoUrl?: string | null;
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
  targaCamion?: string | null;
  data?: number | null;
  litri?: number | null;
  km?: number | null;
  tipo?: string | null;
  autistaNome?: string | null;
  badgeAutista?: string | null;
}

type RifornimentoTmp = {
  id?: string;
  targaCamion?: string | null;
  data?: number | null;
  timestamp?: number | null;
  litri?: number | null;
  km?: number | null;
  tipo?: string | null;
  autistaNome?: string | null;
  nomeAutista?: string | null;
  autista?: string | null;
  badgeAutista?: string | null;
  badge?: string | null;
};

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
  fileUrl?: string | null;   // <── AGGIUNTO
  sourceKey?: string;
  sourceDocId?: string;
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
    documentiMagazzino: any[]; // SOLO per costi materiali da @documenti_magazzino

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
  documentiMagazzino: [],   // <── AGGIUNTO
});


  const [manutenzioni, setManutenzioni] = useState<Manutenzione[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAttesaModal, setShowAttesaModal] = useState(false);
  const [showEseguitiModal, setShowEseguitiModal] = useState(false);
  const [showManutenzioniModal, setShowManutenzioniModal] = useState(false);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);
const [showPreviewModal, setShowPreviewModal] = useState(false);
const [showLibrettoModal, setShowLibrettoModal] = useState(false);
const [librettoLoadErrors, setLibrettoLoadErrors] = useState<Record<string, boolean>>({});
const openDocumento = (url: string) => {
  setPreviewUrl(url);
  setShowPreviewModal(true);
};

const isPdfUrl = (url: string) => {
  const u = String(url || "").toLowerCase();
  return u.includes(".pdf") || u.includes("application/pdf");
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

        const rifornimentiRaw = await getItemSync("@rifornimenti_autisti_tmp");
        const rifornimentiArray: RifornimentoTmp[] = Array.isArray(rifornimentiRaw)
          ? rifornimentiRaw
          : rifornimentiRaw?.value && Array.isArray(rifornimentiRaw.value)
          ? rifornimentiRaw.value
          : [];

        const targaNorm = normalizeRifornimentoTarga(targa);
        const rifornimentiPerMezzo = rifornimentiArray
          .filter((r: RifornimentoTmp) => {
            const t = normalizeRifornimentoTarga(String(r?.targaCamion ?? ""));
            return t && t === targaNorm;
          })
          .map((r: RifornimentoTmp, index: number) => {
            const ts =
              typeof r?.data === "number"
                ? r.data
                : typeof r?.timestamp === "number"
                ? r.timestamp
                : null;
            const litriRaw = r?.litri;
            const litri =
              typeof litriRaw === "number"
                ? litriRaw
                : typeof litriRaw === "string" && litriRaw !== ""
                ? Number(litriRaw)
                : null;
            const kmRaw = r?.km;
            const km =
              typeof kmRaw === "number"
                ? kmRaw
                : typeof kmRaw === "string" && kmRaw !== ""
                ? Number(kmRaw)
                : null;
            return {
              id: String(r?.id ?? `rf_${index}`),
              targaCamion: r?.targaCamion ?? null,
              data: ts,
              litri: Number.isFinite(litri) ? litri : null,
              km: Number.isFinite(km) ? km : null,
              tipo: r?.tipo ?? null,
              autistaNome: r?.autistaNome ?? r?.nomeAutista ?? r?.autista ?? null,
              badgeAutista: r?.badgeAutista ?? r?.badge ?? null,
            } as Rifornimento;
          })
          .sort((a: Rifornimento, b: Rifornimento) => (b.data ?? 0) - (a.data ?? 0));
// ============================
// DOCUMENTI MAGAZZINO (solo per costi materiali)
// ============================
let docsMag: any[] = [];
try {
  const colRefMag = collection(db, "@documenti_magazzino");
  const snapMag = await getDocs(colRefMag);

  snapMag.forEach((docSnap) => {
    const d = docSnap.data() || {};
    if (Array.isArray(d.voci)) {
      docsMag.push(d);
    }
  });
} catch (e) {
  console.error("Errore caricamento documenti magazzino:", e);
}

        // ============================
        // LETTURA DOCUMENTI IA — ROOT
        // ============================

        const targaNorm2 = fmtTarga(targa);

        const iaCollections = [
          "@documenti_mezzi",
          "@documenti_magazzino",
          "@documenti_generici",
        ];

let iaDocs: any[] = [];
let iaDocsRawCount = 0;
let targetDocId: string | null = null;
let targetSourceKey: string | null = null;

for (const col of iaCollections) {
  try {
    const colRef = collection(db, col);
    const snap = await getDocs(colRef);

    snap.forEach((docSnap) => {
      const d = docSnap.data() || {};
      if (DEBUG_DOCS) {
        iaDocsRawCount += 1;
        if (d.nomeFile === DEBUG_DOC_NAME) {
          const docId =
            (d as any)?.id ?? (d as any)?.docId ?? docSnap.id ?? "";
          targetDocId = docId ? String(docId) : null;
          targetSourceKey = col;
          console.log("[DossierMezzo][IA] raw match", {
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

      // Accetta solo FATTURA o PREVENTIVO (qualsiasi forma)
      const isDocValid =
        docTipo === "FATTURA" ||
        docTipo === "PREVENTIVO";

      if (!docTarga) return;
      const isTargaMatch = docTarga === targaNorm2;

      if (DEBUG_DOCS && d.nomeFile === DEBUG_DOC_NAME) {
        console.log("[DossierMezzo][IA] filter check", {
          nomeFile: d.nomeFile,
          tipoDocumento: d.tipoDocumento,
          tipoCanon: docTipo,
          docTargaNorm: docTarga,
          targaAttivaNorm: targaNorm,
          targaAttivaFmt: targaNorm2,
          isDocValid,
          isTargaMatch,
        });
      }

      if (isDocValid && isTargaMatch) {
        iaDocs.push({
          ...d,
          tipoDocumento: docTipo,
          targa: docTarga,
          sourceKey: col,
          sourceDocId: docSnap.id,
        });
      }
    });
  } catch (e) {
    console.error("Errore lettura IA:", e);
  }
}

if (DEBUG_DOCS) {
  console.log("[DossierMezzo][IA] raw count", iaDocsRawCount);
  console.log("[DossierMezzo][IA] after type/targa filter", iaDocs.length);
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
  importo: d.totaleDocumento
    ? parseFloat(String(d.totaleDocumento).replace(",", "."))
    : undefined,
  valuta: resolveCurrencyFromRecord(d),
  fornitoreLabel: d.fornitore || "",
  fileUrl: d.fileUrl || null,              // <── AGGIUNTO
  sourceKey: d.sourceKey,
  sourceDocId: d.sourceDocId,
}));

        const costiDocRef = doc(db, "storage", "@costiMezzo");
        const costiSnap = await getDoc(costiDocRef);
        const costiData = costiSnap.data() || {};
        const costiArray =
          (costiData.items || []) as FatturaPreventivo[];

        const costiPerMezzo = [
          ...costiArray
            .filter((c) => {
              const docTarga = (c.mezzoTarga || "").toUpperCase().trim();
              return docTarga === targa.toUpperCase().trim();
            })
            .map((c) => ({
              ...c,
              sourceKey: "@costiMezzo",
              valuta: resolveCurrencyFromRecord(c),
            })),
          ...documentiIA,
        ];

        if (DEBUG_DOCS) {
          console.log(
            "[DossierMezzo][IA] before dedup",
            costiPerMezzo.length
          );
        }
        const dedupKeys = new Set<string>();
        const costiPerMezzoDedup = costiPerMezzo.filter((item) => {
          const docId = (item as any)?.sourceDocId ?? (item as any)?.id ?? "";
          if (!docId) return true;
          const sourceKey = (item as any)?.sourceKey ?? "";
          const key = sourceKey ? `${sourceKey}:${docId}` : String(docId);
          if (
            DEBUG_DOCS &&
            targetDocId &&
            String(docId) === String(targetDocId) &&
            (!targetSourceKey || sourceKey === targetSourceKey)
          ) {
            console.log("[DossierMezzo][IA] dedup check", {
              nomeFile: DEBUG_DOC_NAME,
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
            "[DossierMezzo][IA] after dedup",
            costiPerMezzoDedup.length
          );
        }

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
  documentiCosti: costiPerMezzoDedup,
  documentiMagazzino: docsMag,   // <── AGGIUNTO
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

  const handleOpenPdf = async () => {
    try {
      await generateDossierMezzoPDF({
        mezzo: state.mezzo,
        mezzoFotoUrl: state.mezzo?.fotoUrl ?? null,
        mezzoFotoStoragePath: (state.mezzo as any)?.fotoStoragePath ?? (state.mezzo as any)?.fotoPath ?? null,
        lavoriDaEseguire: state.lavoriDaEseguire,
        lavoriInAttesa: state.lavoriInAttesa,
        lavoriEseguiti: state.lavoriEseguiti,
        rifornimenti: state.rifornimenti,
        segnalazioni: null,
        controlli: null,
        targa,
      });
    } catch (err) {
      console.error("Errore generazione PDF dossier:", err);
      alert("Errore durante la generazione del PDF.");
    }
  };

  const deletePreventivo = async (p: FatturaPreventivo) => {
    if (!window.confirm("Eliminare questo preventivo?")) return;

    try {
      if (p.sourceKey && p.sourceKey.startsWith("@documenti_")) {
        const docId = p.sourceDocId || p.id;
        if (!docId) {
          alert("Impossibile individuare la sorgente del preventivo.");
          return;
        }
        await deleteDoc(doc(db, p.sourceKey, docId));
      } else {
        const costiDocRef = doc(db, "storage", "@costiMezzo");
        const costiSnap = await getDoc(costiDocRef);
        const costiData = costiSnap.data() || {};
        const items = Array.isArray(costiData.items) ? costiData.items : [];
        const updated = items.filter(
          (x: any) => String(x?.id ?? "") !== String(p.id)
        );
        await setDoc(costiDocRef, { items: updated }, { merge: true });
      }

      setState((prev) => ({
        ...prev,
        documentiCosti: prev.documentiCosti.filter(
          (d) => String(d.id) !== String(p.id)
        ),
      }));
    } catch (err) {
      console.error("Errore eliminazione preventivo:", err);
      alert("Errore durante l'eliminazione del preventivo.");
    }
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
  const librettoUrls = [mezzo.librettoUrl]
    .filter((u): u is string => typeof u === "string")
    .map((u) => u.trim())
    .filter(Boolean);
  const librettoArchiveLink = `/ia/libretto?archive=1&targa=${encodeURIComponent(
    mezzo.targa ?? targa ?? ""
  )}`;
  const librettoViewerLink = `/ia/libretto?open=1&targa=${encodeURIComponent(
    mezzo.targa ?? targa ?? ""
  )}`;

  const totaleLitri = state.rifornimenti.reduce(
    (sum, r) => sum + (r.litri || 0),
    0
  );
  void totaleLitri;

  const formatDateTime = (ts?: number | null) => {
    return formatDateTimeUI(ts ?? null);
  };

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

  const sumByCurrency = (items: FatturaPreventivo[]) => {
    let chf = 0;
    let eur = 0;
    let unknown = 0;
    items.forEach((d) => {
      const imp = typeof d.importo === "number" && !Number.isNaN(d.importo)
        ? d.importo
        : null;
      if (imp == null) return;
      const curr = resolveCurrencyFromRecord(d);
      if (curr === "CHF") chf += imp;
      else if (curr === "EUR") eur += imp;
      else unknown += 1;
    });
    return { chf, eur, unknown };
  };

  const preventiviTotals = sumByCurrency(preventivi);
  const fattureTotals = sumByCurrency(fatture);

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
  // ========================
// Trova prezzo unitario dai documenti magazzino
// ========================
const trovaPrezzoUnitario = (descrMov?: string): number | null => {
  if (!descrMov) return null;

  const target = descrMov.toUpperCase().trim();

  for (const doc of state.documentiMagazzino || []) {
    const righe = Array.isArray(doc.voci) ? doc.voci : [];

    for (const r of righe) {
      const desc = (r.descrizione || "").toUpperCase().trim();
      if (!desc) continue;

      // match morbido
      if (desc.includes(target) || target.includes(desc)) {
        // 1) prezzoUnitario già estratto
        if (r.prezzoUnitario != null) {
          return Number(r.prezzoUnitario);
        }

        // 2) importo + quantita → calcolo
        const imp = Number(r.importo);
        const q = Number(r.quantita);
        if (imp > 0 && q > 0) {
          return imp / q;
        }

        return null;
      }
    }
  }

  return null;
};

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

    {showLibrettoModal && (
      <div
        className="dossier-modal-overlay"
        onClick={() => setShowLibrettoModal(false)}
      >
        <div
          className="dossier-modal dossier-libretto-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="dossier-modal-header">
            <h2>Libretto - {mezzo.targa}</h2>
            <button
              className="dossier-button"
              type="button"
              onClick={() => setShowLibrettoModal(false)}
            >
              Chiudi
            </button>
          </div>

          <div className="dossier-modal-body dossier-libretto-body">
            {librettoUrls.length === 0 ? (
              <div className="dossier-empty">
                Nessun libretto associato.
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    className="dossier-button"
                    type="button"
                    onClick={() => navigate("/ia/libretto")}
                  >
                    Vai a IA Libretto
                  </button>
                  <button
                    className="dossier-button"
                    type="button"
                    onClick={() =>
                      navigate(librettoArchiveLink)
                    }
                  >
                    Cerca in Archivio IA
                  </button>
                </div>
              </div>
            ) : (
              librettoUrls.map((url, index) => (
                <div key={`${url}_${index}`} className="dossier-libretto-item">
                  {isPdfUrl(url) ? (
                    <>
                      <iframe
                        src={url}
                        className="dossier-libretto-frame"
                        title={`Libretto PDF ${index + 1}`}
                      />
                      <div className="dossier-libretto-actions">
                        <a
                          className="dossier-button"
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Apri PDF
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="dossier-libretto-image-wrap">
                      {librettoLoadErrors[url] ? (
                        <div className="dossier-empty">
                          Impossibile caricare la foto.
                        </div>
                      ) : (
                        <img
                          src={url}
                          className="dossier-libretto-img"
                          alt={`Libretto ${index + 1}`}
                          onError={() =>
                            setLibrettoLoadErrors((prev) => ({
                              ...prev,
                              [url]: true,
                            }))
                          }
                        />
                      )}
                      <div className="dossier-libretto-actions">
                        <a
                          className="dossier-button"
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Apri immagine
                        </a>
                        {librettoLoadErrors[url] && (
                          <button
                            className="dossier-button"
                            type="button"
                            onClick={() => navigate(librettoArchiveLink)}
                          >
                            Cerca in Archivio IA
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )}

    <div className="dossier-header-bar">
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

<div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
  <button
    className="dossier-button"
    type="button"
    onClick={() => navigate(`/analisi-economica/${mezzo.targa}`)}
  >
    Analisi Economica
  </button>

  <button
    className="dossier-button"
    type="button"
    onClick={() => navigate(`/dossier/${mezzo.targa}/gomme`)}
  >
    Gomme
  </button>

  <button
    className="dossier-button"
    type="button"
    onClick={() => navigate(`/dossier/${mezzo.targa}/rifornimenti`)}
  >
    Rifornimenti (dettaglio)
  </button>

  <button
    className="dossier-button"
    type="button"
    onClick={() => {
      navigate(librettoUrls.length === 0 ? librettoArchiveLink : librettoViewerLink);
    }}
  >
    LIBRETTO
  </button>

  <button
    className="dossier-button primary"
    type="button"
    onClick={handleOpenPdf}
  >
    Esporta PDF
  </button>
</div>
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
  <span>Autista abituale</span>
  <strong>{(mezzo as any).autistaNome || "-"}</strong>
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
                  <strong>{formatDateUI(mezzo.dataImmatricolazione)}</strong>
                </li>
                <li>
                  <span>Revisione</span>
                  <strong>{formatDateUI(mezzo.dataScadenzaRevisione)}</strong>
                </li>
                <li>
                  <span>Note</span>
                  <strong style={{ whiteSpace: "pre-line" }}>{mezzo.note || "-"}</strong>
                </li>
                <li>
  <span>Manutenzione programmata</span>
  <strong>
    {(mezzo as any).manutenzioneProgrammata ? "ATTIVA" : "NON ATTIVA"}
  </strong>
</li>

{(mezzo as any).manutenzioneProgrammata && (
  <>
    <li>
      <span>Contratto</span>
      <strong>{(mezzo as any).manutenzioneContratto || "-"}</strong>
    </li>
    <li>
      <span>Periodo</span>
      <strong>
        {formatDateUI((mezzo as any).manutenzioneDataInizio)} →{" "}
        {formatDateUI((mezzo as any).manutenzioneDataFine)}
      </strong>
    </li>
    <li>
      <span>KM massimi</span>
      <strong>{(mezzo as any).manutenzioneKmMax || "-"}</strong>
    </li>
  </>
)}

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
                            <th>Costo</th>

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
<td>
  {(() => {
    const label = m.descrizione || m.materialeLabel || "";
    const pu = trovaPrezzoUnitario(label);
    if (pu == null) return "–";

    const qty = Number(m.quantita) || 0;
    const totale = pu * qty;

    return renderAmountWithCurrency(totale, "UNKNOWN");
  })()}
</td>

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
                      <th>Data/Ora</th>
                      <th>Litri</th>
                      <th>Km</th>
                      <th>Tipo</th>
                      <th>Autista</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.rifornimenti.map((r) => (
                      <tr key={r.id}>
                        <td>{formatDateTime(r.data)}</td>
                        <td>{r.litri ?? "-"}</td>
                        <td>{r.km ?? "-"}</td>
                        <td>{r.tipo ?? "-"}</td>
                        <td>
                          {r.autistaNome
                            ? `${r.autistaNome}${
                                r.badgeAutista ? ` (${r.badgeAutista})` : ""
                              }`
                            : r.badgeAutista ?? "-"}
                        </td>
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
              <strong>CHF {preventiviTotals.chf.toFixed(2)}</strong>
              <span style={{ marginLeft: "8px" }}>
                EUR {preventiviTotals.eur.toFixed(2)}
              </span>
              {preventiviTotals.unknown > 0 && (
                <span className="dossier-badge badge-info" style={{ marginLeft: "8px" }}>
                  VALUTA DA VERIFICARE ({preventiviTotals.unknown})
                </span>
              )}
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
  <span>{renderAmountWithCurrency(d.importo, resolveCurrencyFromRecord(d))}</span>
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
<button
  className="dossier-button"
  type="button"
  onClick={() => deletePreventivo(d)}
>
  Elimina
</button>
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
              <strong>CHF {fattureTotals.chf.toFixed(2)}</strong>
              <span style={{ marginLeft: "8px" }}>
                EUR {fattureTotals.eur.toFixed(2)}
              </span>
              {fattureTotals.unknown > 0 && (
                <span className="dossier-badge badge-info" style={{ marginLeft: "8px" }}>
                  VALUTA DA VERIFICARE ({fattureTotals.unknown})
                </span>
              )}
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
  <span>{renderAmountWithCurrency(d.importo, resolveCurrencyFromRecord(d))}</span>
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
