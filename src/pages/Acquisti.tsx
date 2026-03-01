import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { MaterialeOrdine, Ordine, UnitaMisura } from "../types/ordini";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { uploadMaterialImage, deleteMaterialImage } from "../utils/materialImages";
import { generateSmartPDF } from "../utils/pdfEngine";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../firebase";
import "./Acquisti.css";
import "./MaterialiDaOrdinare.css";

interface Fornitore {
  id: string;
  nome: string;
}

type PreventivoRiga = {
  id: string;
  descrizione: string;
  unita: string;
  prezzoUnitario: number;
  note?: string;
};

type Preventivo = {
  id: string;
  fornitoreId: string;
  fornitoreNome: string;
  numeroPreventivo: string;
  dataPreventivo: string;
  pdfUrl: string | null;
  pdfStoragePath: string | null;
  righe: PreventivoRiga[];
  createdAt: number;
  updatedAt: number;
};

type Valuta = "CHF" | "EUR";

type ListinoVoce = {
  id: string;
  fornitoreId: string;
  fornitoreNome: string;
  articoloCanonico: string;
  codiceArticolo?: string;
  unita: string;
  valuta: Valuta;
  prezzoAttuale: number;
  fonteAttuale: {
    preventivoId: string;
    numeroPreventivo: string;
    dataPreventivo: string;
    pdfUrl: string | null;
    pdfStoragePath: string | null;
  };
  prezzoPrecedente?: number;
  fontePrecedente?: {
    preventivoId: string;
    numeroPreventivo: string;
    dataPreventivo: string;
  };
  trend: "down" | "up" | "same" | "new";
  deltaAbs?: number;
  deltaPct?: number;
  updatedAt: number;
};

type ImportBozzaRiga = {
  id: string;
  fornitoreId: string;
  fornitoreNome: string;
  articoloCanonico: string;
  codiceArticolo?: string;
  unita: string;
  valuta: Valuta;
  prezzoNuovo: number;
  prezzoPrecedente?: number;
  trend: "down" | "up" | "same" | "new";
  fonte: {
    preventivoId: string;
    numeroPreventivo: string;
    dataPreventivo: string;
    pdfUrl: string | null;
    pdfStoragePath: string | null;
  };
  daVerificare: boolean;
  note?: string;
};

type PreventivoMatch = {
  prezzoUnitario: number;
  unita: string;
  preventivoId: string;
  numeroPreventivo: string;
  dataPreventivo: string;
  pdfUrl: string | null;
  rank: number;
};

type AcquistiTab = "Ordine materiali" | "Ordini" | "Arrivi" | "Prezzi & Preventivi" | "Listino Prezzi";
type ListKind = "attesa" | "arrivi";

const TABS: AcquistiTab[] = ["Ordine materiali", "Ordini", "Arrivi", "Prezzi & Preventivi", "Listino Prezzi"];
const ORDINI_DOC_ID = "@ordini";
const PREVENTIVI_DOC_ID = "@preventivi";
const LISTINO_DOC_ID = "@listino_prezzi";

const TAB_KEYS: Record<AcquistiTab, string> = {
  "Ordine materiali": "ordine",
  Ordini: "ordini",
  Arrivi: "arrivi",
  "Prezzi & Preventivi": "preventivi",
  "Listino Prezzi": "listino",
};

const TAB_VALUES = Object.entries(TAB_KEYS).reduce((acc, [label, key]) => {
  acc[key] = label as AcquistiTab;
  return acc;
}, {} as Record<string, AcquistiTab>);

const generaId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const oggi = () => {
  const d = new Date();
  return `${d.getDate().toString().padStart(2, "0")} ${String(
    d.getMonth() + 1
  ).padStart(2, "0")} ${d.getFullYear()}`;
};

const immaginiAutomatiche: { pattern: RegExp; url: string }[] = [
  { pattern: /cemento/i, url: "/materiali/cemento.png" },
  { pattern: /pvc|tubo/i, url: "/materiali/tubo-pvc.png" },
  { pattern: /piastrella/i, url: "/materiali/piastrelle.png" },
  { pattern: /legno|assi/i, url: "/materiali/legno.png" },
];

function trovaImmagineAutomatica(desc: string): string | null {
  for (const m of immaginiAutomatiche) {
    if (m.pattern.test(desc)) return m.url;
  }
  return null;
}

function getOptionalText(m: MaterialeOrdine, keys: string[]) {
  for (const key of keys) {
    const value = (m as any)?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }
  return "â€”";
}

function tabToKey(tab: AcquistiTab) {
  return TAB_KEYS[tab];
}

function keyToTab(key: string | null, fallback: AcquistiTab): AcquistiTab {
  if (!key) return fallback;
  return TAB_VALUES[key] || fallback;
}

function normalizeDescrizione(v: string) {
  return String(v || "")
    .toUpperCase()
    .trim()
    .replace(/[.\-_/]/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeUnita(v: string) {
  return String(v || "").toUpperCase().trim();
}

function normalizeArticoloCanonico(v: string) {
  return normalizeDescrizione(v);
}

function inferValuta(input: { descrizione?: string; note?: string; numeroPreventivo?: string }): Valuta {
  const text = `${input.descrizione || ""} ${input.note || ""} ${input.numeroPreventivo || ""}`.toUpperCase();
  if (text.includes("EUR") || text.includes("€")) return "EUR";
  return "CHF";
}

function listinoKey(input: {
  fornitoreId: string;
  articoloCanonico: string;
  unita: string;
  valuta: Valuta;
}) {
  return [
    String(input.fornitoreId || "").trim(),
    normalizeArticoloCanonico(input.articoloCanonico),
    normalizeUnita(input.unita),
    input.valuta,
  ].join("|");
}

function computeTrend(prezzoNuovo: number, prezzoPrecedente?: number) {
  if (prezzoPrecedente === undefined || prezzoPrecedente === null || !Number.isFinite(prezzoPrecedente)) {
    return { trend: "new" as const, deltaAbs: undefined as number | undefined, deltaPct: undefined as number | undefined };
  }
  const deltaAbs = prezzoNuovo - prezzoPrecedente;
  const deltaPct = prezzoPrecedente === 0 ? undefined : (deltaAbs / prezzoPrecedente) * 100;
  if (deltaAbs < 0) return { trend: "down" as const, deltaAbs, deltaPct };
  if (deltaAbs > 0) return { trend: "up" as const, deltaAbs, deltaPct };
  return { trend: "same" as const, deltaAbs, deltaPct: 0 };
}

function parseDataPreventivoToTs(v: string) {
  const raw = String(v || "").trim();
  const match = raw.match(/^(\d{1,2})\D+(\d{1,2})\D+(\d{4})$/);
  if (!match) return 0;
  const gg = Number(match[1]);
  const mm = Number(match[2]) - 1;
  const aa = Number(match[3]);
  const ts = new Date(aa, mm, gg).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function sanitizeUndefinedToNull<T>(value: T): T {
  if (value === undefined) return null as T;
  if (value === null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUndefinedToNull(item)) as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      out[key] = item === undefined ? null : sanitizeUndefinedToNull(item);
    });
    return out as T;
  }
  return value;
}

function OrdineMaterialiView(props: {
  onOpenPreventivo: (payload: { preventivoId: string; pdfUrl: string | null }) => void;
  onOpenManualListino: (row: ImportBozzaRiga) => void;
}) {
  const { onOpenPreventivo, onOpenManualListino } = props;

  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [preventivi, setPreventivi] = useState<Preventivo[]>([]);
  const [listinoVoci, setListinoVoci] = useState<ListinoVoce[]>([]);
  const [fornitoreId, setFornitoreId] = useState<string>("");
  const [fornitoreNome, setFornitoreNome] = useState<string>("");
  const [isNuovoFornitore, setIsNuovoFornitore] = useState<boolean>(false);
  const [nomeFornitorePersonalizzato, setNomeFornitorePersonalizzato] = useState<string>("");
  const [descrizione, setDescrizione] = useState("");
  const [quantita, setQuantita] = useState("");
  const [unita, setUnita] = useState<UnitaMisura>("pz");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const fotoInputRef = useRef<HTMLInputElement | null>(null);
  const [materiali, setMateriali] = useState<MaterialeOrdine[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [selectedListinoVoce, setSelectedListinoVoce] = useState<ListinoVoce | null>(null);
  const [fornitoreByMaterialeId, setFornitoreByMaterialeId] = useState<
    Record<string, { fornitoreId: string; fornitoreNome: string }>
  >({});
  const [listinoSourceByMaterialeId, setListinoSourceByMaterialeId] = useState<Record<string, PreventivoMatch>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const fornitoriSnap = await getDoc(doc(db, "storage", "@fornitori"));
        if (fornitoriSnap.exists()) {
          const arr = (fornitoriSnap.data()?.value || []) as any[];
          const conv: Fornitore[] = arr.map((f) => ({
            id: f.id || generaId(),
            nome: f.nome || f.ragioneSociale || "",
          }));
          setFornitori(conv);
        }

        const preventiviSnap = await getDoc(doc(db, "storage", PREVENTIVI_DOC_ID));
        if (preventiviSnap.exists()) {
          const list = (preventiviSnap.data()?.preventivi || []) as Preventivo[];
          setPreventivi(Array.isArray(list) ? list : []);
        } else {
          setPreventivi([]);
        }

        const listinoSnap = await getDoc(doc(db, "storage", LISTINO_DOC_ID));
        if (listinoSnap.exists()) {
          const voci = (listinoSnap.data()?.voci || []) as ListinoVoce[];
          setListinoVoci(Array.isArray(voci) ? voci : []);
        } else {
          setListinoVoci([]);
        }
      } catch (err) {
        console.error("Errore caricamento fornitori/preventivi:", err);
      }
    };
    void load();
  }, []);

  const handleSelectFornitore = (id: string) => {
    if (id === "nuovo") {
      setIsNuovoFornitore(true);
      setFornitoreId("nuovo");
      setFornitoreNome("");
      setSelectedListinoVoce(null);
      return;
    }
    setIsNuovoFornitore(false);
    setFornitoreId(id);
    const f = fornitori.find((x) => x.id === id);
    setFornitoreNome(f?.nome || "");
    setSelectedListinoVoce(null);
  };

  const handleDescrizioneChange = (value: string) => {
    setDescrizione(value);
    setShowSuggest(true);
    if (
      selectedListinoVoce &&
      normalizeArticoloCanonico(value) !== normalizeArticoloCanonico(selectedListinoVoce.articoloCanonico)
    ) {
      setSelectedListinoVoce(null);
    }
  };

  const handleDescrizioneBlur = () => {
    setTimeout(() => setShowSuggest(false), 120);
    if (fotoFile || fotoPreview) return;
    const auto = trovaImmagineAutomatica(descrizione);
    if (auto) setFotoPreview(auto);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const fornitoreAttivoNome = isNuovoFornitore
    ? nomeFornitorePersonalizzato.trim().toUpperCase()
    : fornitoreNome;
  const fornitoreAttivoId = !isNuovoFornitore ? fornitoreId : "";
  const canAddMateriale = !!descrizione.trim() && !!quantita.trim() && !!fornitoreAttivoNome;

  const suggestListino = useMemo(() => {
    if (!showSuggest) return [];
    const q = descrizione.trim().toLowerCase();
    if (!q) return [];
    if (!fornitoreAttivoId) return [];

    return listinoVoci
      .filter((v) => v.fornitoreId === fornitoreAttivoId)
      .filter((v) => {
        const articolo = String(v.articoloCanonico || "").toLowerCase();
        const codice = String(v.codiceArticolo || "").toLowerCase();
        return articolo.includes(q) || codice.includes(q);
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 8);
  }, [showSuggest, descrizione, fornitoreAttivoId, listinoVoci]);

  const selectListinoSuggestion = (voce: ListinoVoce) => {
    setDescrizione(voce.articoloCanonico);
    setUnita((String(voce.unita || "pz").toLowerCase() as UnitaMisura));
    setSelectedListinoVoce(voce);
    setShowSuggest(false);
  };

  const resetMateriale = () => {
    setDescrizione("");
    setQuantita("");
    setUnita("pz");
    setFotoFile(null);
    setFotoPreview(null);
    setSelectedListinoVoce(null);
    setShowSuggest(false);
  };

  const aggiungiMateriale = async () => {
    if (!descrizione.trim() || !quantita.trim()) return;
    if (!fornitoreAttivoNome) {
      window.alert("Seleziona fornitore prima di aggiungere il materiale.");
      return;
    }
    const id = generaId();
    let fotoUrl: string | null = fotoPreview || null;
    let fotoStoragePath: string | null = null;
    if (fotoFile) {
      try {
        const uploaded = await uploadMaterialImage(fotoFile, id);
        fotoUrl = uploaded.fotoUrl;
        fotoStoragePath = uploaded.fotoStoragePath;
      } catch (err) {
        console.error("Errore upload immagine:", err);
      }
    }
    const nuovo: MaterialeOrdine = {
      id,
      descrizione: descrizione.trim().toUpperCase(),
      quantita: parseFloat(quantita),
      unita,
      arrivato: false,
      fotoUrl,
      fotoStoragePath,
    };
    setMateriali((p) => [...p, nuovo]);
    setFornitoreByMaterialeId((prev) => ({
      ...prev,
      [id]: {
        fornitoreId: fornitoreAttivoId || "SENZA_FORNITORE",
        fornitoreNome: fornitoreAttivoNome,
      },
    }));
    if (selectedListinoVoce) {
      const info: PreventivoMatch = {
        prezzoUnitario: selectedListinoVoce.prezzoAttuale,
        unita: selectedListinoVoce.unita,
        preventivoId: selectedListinoVoce.fonteAttuale.preventivoId,
        numeroPreventivo: selectedListinoVoce.fonteAttuale.numeroPreventivo,
        dataPreventivo: selectedListinoVoce.fonteAttuale.dataPreventivo,
        pdfUrl: selectedListinoVoce.fonteAttuale.pdfUrl,
        rank: selectedListinoVoce.updatedAt,
      };
      setListinoSourceByMaterialeId((prev) => ({ ...prev, [id]: info }));
    }
    resetMateriale();
  };

  const eliminaMateriale = async (id: string) => {
    const mat = materiali.find((m) => m.id === id);
    if (mat?.fotoStoragePath) await deleteMaterialImage(mat.fotoStoragePath);
    setMateriali((p) => p.filter((m) => m.id !== id));
    setFornitoreByMaterialeId((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setListinoSourceByMaterialeId((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const salvaOrdine = async () => {
    if (!materiali.length) return;
    let nomeFinale = fornitoreNome;
    if (isNuovoFornitore && nomeFornitorePersonalizzato.trim() !== "") {
      nomeFinale = nomeFornitorePersonalizzato.trim().toUpperCase();
    }
    if (!nomeFinale) return;
    setLoading(true);
    try {
      const ref = doc(collection(db, "storage"), ORDINI_DOC_ID);
      const snap = await getDoc(ref);
      const existing: Ordine[] = snap.exists() ? ((snap.data()?.value as Ordine[]) || []) : [];
      const nuovoOrdine: Ordine = {
        id: generaId(),
        idFornitore: fornitoreId === "nuovo" ? generaId() : fornitoreId,
        nomeFornitore: nomeFinale,
        dataOrdine: oggi(),
        materiali,
        arrivato: false,
      };
      const updated = [...existing, nuovoOrdine];
      await setDoc(ref, { value: updated }, { merge: true });
      setMateriali([]);
      setFornitoreByMaterialeId({});
      setListinoSourceByMaterialeId({});
      setFornitoreId("");
      setFornitoreNome("");
      setNomeFornitorePersonalizzato("");
      setIsNuovoFornitore(false);
    } catch (err) {
      console.error("Errore salvataggio ordine:", err);
    } finally {
      setLoading(false);
    }
  };

  const materialiFiltrati = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return materiali;
    return materiali.filter((m) => {
      const fornitoreRiga = String((m as any)?.fornitore ?? "").toLowerCase();
      return m.descrizione.toLowerCase().includes(q) || fornitoreRiga.includes(q) || String(m.id).toLowerCase().includes(q);
    });
  }, [materiali, searchText]);

  const matchByMaterialeId = useMemo(() => {
    const map = new Map<string, PreventivoMatch | null>();

    materiali.forEach((m) => {
      const fromLocal = fornitoreByMaterialeId[m.id];
      const rowFornitoreId = String(
        fromLocal?.fornitoreId ?? (m as any)?.fornitoreId ?? (m as any)?.idFornitore ?? fornitoreId ?? ""
      ).trim();
      if (!rowFornitoreId || rowFornitoreId === "nuovo") {
        map.set(m.id, null);
        return;
      }

      const descNorm = normalizeDescrizione(m.descrizione);
      const unitaNorm = normalizeUnita(m.unita);
      let best: PreventivoMatch | null = null;

      preventivi.forEach((p) => {
        if (String(p.fornitoreId || "").trim() !== rowFornitoreId) return;
        const righe = Array.isArray(p.righe) ? p.righe : [];
        righe.forEach((r) => {
          if (
            normalizeDescrizione(r.descrizione) === descNorm &&
            normalizeUnita(r.unita) === unitaNorm
          ) {
            const rank = Number(
              p.updatedAt || p.createdAt || parseDataPreventivoToTs(p.dataPreventivo) || 0
            );
            const candidate: PreventivoMatch = {
              prezzoUnitario: Number(r.prezzoUnitario || 0),
              unita: r.unita,
              preventivoId: p.id,
              numeroPreventivo: p.numeroPreventivo,
              dataPreventivo: p.dataPreventivo,
              pdfUrl: p.pdfUrl || null,
              rank,
            };
            if (!best || candidate.rank > best.rank) {
              best = candidate;
            }
          }
        });
      });

      map.set(m.id, best);
    });

    return map;
  }, [materiali, fornitoreByMaterialeId, fornitoreId, preventivi]);

  const prezzoSourceByMaterialeId = useMemo(() => {
    const map = new Map<string, PreventivoMatch | null>();
    materiali.forEach((m) => {
      const fromListino = listinoSourceByMaterialeId[m.id];
      if (fromListino) {
        map.set(m.id, fromListino);
        return;
      }
      map.set(m.id, matchByMaterialeId.get(m.id) || null);
    });
    return map;
  }, [materiali, listinoSourceByMaterialeId, matchByMaterialeId]);

  const totaleStimato = useMemo(() => {
    return materiali.reduce((acc, m) => {
      const match = prezzoSourceByMaterialeId.get(m.id);
      if (!match) return acc;
      return acc + m.quantita * match.prezzoUnitario;
    }, 0);
  }, [materiali, prezzoSourceByMaterialeId]);

  const prezziMancanti = useMemo(() => {
    return materiali.reduce((acc, m) => (prezzoSourceByMaterialeId.get(m.id) ? acc : acc + 1), 0);
  }, [materiali, prezzoSourceByMaterialeId]);

  const readNumberFromAny = (value: unknown): number | null => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string") return null;
    const normalized = value.trim().replace(",", ".");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const getPrezzoManuale = (m: MaterialeOrdine): number | null => {
    const anyM = m as any;
    const candidates: unknown[] = [
      anyM?.prezzoManuale,
      anyM?.prezzo,
      anyM?.prezzoUnitario,
      anyM?.costoUnitario,
    ];
    for (const candidate of candidates) {
      const val = readNumberFromAny(candidate);
      if (val !== null && val > 0) return val;
    }
    return null;
  };

  const openBozzaListinoManuale = (m: MaterialeOrdine) => {
    const localFornitore = fornitoreByMaterialeId[m.id];
    const rowFornitoreId = String(
      localFornitore?.fornitoreId ?? (m as any)?.fornitoreId ?? (m as any)?.idFornitore ?? fornitoreId ?? ""
    ).trim();
    const rowFornitoreNome = String(
      localFornitore?.fornitoreNome ??
      (m as any)?.fornitoreScelto ??
      (m as any)?.fornitore ??
      (m as any)?.nomeFornitore ??
      fornitoreNome ??
      ""
    ).trim();

    if (!rowFornitoreId || rowFornitoreId === "nuovo" || rowFornitoreId === "SENZA_FORNITORE" || !rowFornitoreNome) {
      window.alert("Seleziona/associa un fornitore valido alla riga prima di importare nel listino.");
      return;
    }

    const prezzoManuale = getPrezzoManuale(m);
    const row: ImportBozzaRiga = {
      id: generaId(),
      fornitoreId: rowFornitoreId,
      fornitoreNome: rowFornitoreNome,
      articoloCanonico: normalizeArticoloCanonico(m.descrizione),
      codiceArticolo: "",
      unita: normalizeUnita(m.unita),
      valuta: inferValuta({
        descrizione: m.descrizione,
        note: String((m as any)?.note ?? ""),
        numeroPreventivo: "MANUALE",
      }),
      prezzoNuovo: prezzoManuale ?? 0,
      trend: "new",
      fonte: {
        preventivoId: `MANUALE-${m.id}`,
        numeroPreventivo: "MANUALE",
        dataPreventivo: oggi(),
        pdfUrl: null,
        pdfStoragePath: null,
      },
      daVerificare: true,
      note: prezzoManuale ? undefined : "Prezzo da completare",
    };

    onOpenManualListino(row);
  };

  const canSaveOrdine = !loading && materiali.length > 0 && (!!fornitoreNome || !!nomeFornitorePersonalizzato.trim());
  return (
    <div className="mdo-page mdo-page--embedded mdo-page--single">
      <div className="mdo-card mdo-card--embedded mdo-card--single">
        <section className="mdo-single-card">
          <div className="mdo-single-toolbar">
            <div className="mdo-single-toolbar-main">
              <div className="mdo-field">
                <label>Fornitore</label>
                <select value={fornitoreId} onChange={(e) => handleSelectFornitore(e.target.value)}>
                  <option value="">Seleziona</option>
                  {fornitori.map((f) => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                  <option value="nuovo">+ Nuovo fornitore</option>
                </select>
              </div>

              {isNuovoFornitore && (
                <div className="mdo-field">
                  <label>Nome nuovo fornitore</label>
                  <input
                    type="text"
                    value={nomeFornitorePersonalizzato}
                    onChange={(e) => setNomeFornitorePersonalizzato(e.target.value)}
                  />
                </div>
              )}

              <label className="mdo-search mdo-search--embedded">
                <span>Cerca</span>
                <input
                  type="search"
                  placeholder="Descrizione o fornitore"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </label>
            </div>

            <div className="mdo-single-toolbar-side" />
          </div>

          <div className="mdo-table-wrap mdo-table-wrap--single">
            <table className="mdo-table">
              <thead>
                <tr>
                  <th>Descrizione</th>
                  <th>Q.tà</th>
                  <th>Unità</th>
                  <th>Fornitore</th>
                  <th>Prezzo</th>
                  <th>Preventivo</th>
                  <th className="mdo-col-actions">Azioni</th>
                </tr>
              </thead>
              <tbody>
                <tr className="mdo-insert-row">
                  <td>
                    <div className="mdo-insert-desc">
                      <div className="mdo-item-photo mdo-item-photo--insert">
                        {fotoPreview ? <img src={fotoPreview} alt="Anteprima materiale" /> : <div className="mdo-photo-placeholder small">Foto</div>}
                      </div>
                      <input
                        className="mdo-table-input"
                        type="text"
                        placeholder="Descrizione materiale"
                        value={descrizione}
                        onChange={(e) => handleDescrizioneChange(e.target.value)}
                        onFocus={() => setShowSuggest(true)}
                        onBlur={handleDescrizioneBlur}
                      />
                      {!fornitoreAttivoId && descrizione.trim() !== "" && (
                        <div className="acq-suggest-empty">Seleziona fornitore per vedere i suggerimenti listino.</div>
                      )}
                      {fornitoreAttivoId && showSuggest && suggestListino.length > 0 && (
                        <div className="acq-suggest-panel">
                          {suggestListino.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              className="acq-suggest-item"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectListinoSuggestion(v)}
                            >
                              <span className="acq-suggest-main">{v.articoloCanonico}</span>
                              <span className="acq-suggest-meta">
                                {v.codiceArticolo ? `Codice ${v.codiceArticolo} · ` : ""}
                                {v.prezzoAttuale.toFixed(2)} {v.valuta}/{String(v.unita || "").toLowerCase()} · N. {v.fonteAttuale.numeroPreventivo} del {v.fonteAttuale.dataPreventivo}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <input className="mdo-table-input mdo-table-input--qty" type="number" placeholder="0" value={quantita} onChange={(e) => setQuantita(e.target.value)} />
                  </td>
                  <td>
                    <select
                      className="mdo-table-input"
                      value={unita}
                      onChange={(e) => {
                        const next = e.target.value as UnitaMisura;
                        setUnita(next);
                        if (selectedListinoVoce && normalizeUnita(next) !== normalizeUnita(selectedListinoVoce.unita)) {
                          setSelectedListinoVoce(null);
                        }
                      }}
                    >
                      <option value="pz">pz</option>
                      <option value="m">m</option>
                      <option value="kg">kg</option>
                      <option value="lt">lt</option>
                    </select>
                  </td>
                  <td>
                    <div className="mdo-table-muted">{isNuovoFornitore ? nomeFornitorePersonalizzato.trim() || "Nuovo fornitore" : fornitoreNome || "Seleziona sopra"}</div>
                  </td>
                  <td>
                    <span className="mdo-table-muted">
                      {selectedListinoVoce
                        ? `${selectedListinoVoce.prezzoAttuale.toFixed(2)} ${selectedListinoVoce.valuta}/${String(selectedListinoVoce.unita || "").toLowerCase()}`
                        : "-"}
                    </span>
                  </td>
                  <td>
                    <span className="mdo-table-muted">
                      {selectedListinoVoce
                        ? `N. ${selectedListinoVoce.fonteAttuale.numeroPreventivo} del ${selectedListinoVoce.fonteAttuale.dataPreventivo}`
                        : "-"}
                    </span>
                  </td>
                  <td className="mdo-col-actions">
                    <div className="mdo-row-actions mdo-row-actions--insert">
                      {selectedListinoVoce && (
                        <button
                          type="button"
                          className="mdo-chip-button"
                          onClick={() =>
                            onOpenPreventivo({
                              preventivoId: selectedListinoVoce.fonteAttuale.preventivoId,
                              pdfUrl: selectedListinoVoce.fonteAttuale.pdfUrl,
                            })
                          }
                        >
                          Apri
                        </button>
                      )}
                      <button type="button" className="mdo-chip-button mdo-chip-upload" onClick={() => fotoInputRef.current?.click()}>Foto</button>
                      <input ref={fotoInputRef} type="file" accept="image/*" capture="environment" className="mdo-hidden-file" onChange={handleFileChange} />
                      <button type="button" className="mdo-chip-button" onClick={() => { setFotoFile(null); setFotoPreview(null); }}>Pulisci</button>
                      <button type="button" className="mdo-add-button" onClick={aggiungiMateriale} disabled={!canAddMateriale}>Aggiungi</button>
                    </div>
                  </td>
                </tr>

                {materialiFiltrati.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="mdo-empty mdo-empty-state mdo-empty-state--table">Nessun materiale inserito.</div>
                    </td>
                  </tr>
                ) : (
                  materialiFiltrati.map((m) => {
                    const prezzoInfo = prezzoSourceByMaterialeId.get(m.id);
                    const fornitoreLocale = fornitoreByMaterialeId[m.id];
                    const fornitoreDisplay = fornitoreLocale?.fornitoreNome || getOptionalText(m, ["fornitoreScelto", "fornitore", "nomeFornitore"]);
                    return (
                    <tr key={m.id}>
                      <td>
                        <div className="mdo-desc-cell">
                          <div className="mdo-item-photo">
                            {m.fotoUrl ? <img src={m.fotoUrl} alt={m.descrizione} /> : <div className="mdo-photo-placeholder small">Foto</div>}
                          </div>
                          <div>
                            <div className="mdo-item-desc">{m.descrizione}</div>
                            <div className="mdo-item-meta">ID: {m.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>{m.quantita}</td>
                      <td>{m.unita}</td>
                      <td>{fornitoreDisplay}</td>
                      <td>
                        {prezzoInfo
                          ? `${prezzoInfo.prezzoUnitario.toFixed(2)} CHF/${String(prezzoInfo.unita || m.unita).toLowerCase()}`
                          : "-"}
                      </td>
                      <td>
                        {prezzoInfo
                          ? `N. ${prezzoInfo.numeroPreventivo} del ${prezzoInfo.dataPreventivo}`
                          : "-"}
                      </td>
                      <td className="mdo-col-actions">
                        <div className="mdo-row-actions">
                          {prezzoInfo && (
                            <button
                              type="button"
                              className="mdo-chip-button"
                              onClick={() =>
                                onOpenPreventivo({
                                  preventivoId: prezzoInfo.preventivoId,
                                  pdfUrl: prezzoInfo.pdfUrl,
                                })
                              }
                            >
                              Apri
                            </button>
                          )}
                          <button type="button" className="mdo-chip-button">Prezzi</button>
                          <button type="button" className="mdo-chip-button">Allegati</button>
                          <button type="button" className="mdo-chip-button">Note</button>
                          {!prezzoInfo && (
                            <button
                              type="button"
                              className="mdo-chip-button mdo-chip-button--listino"
                              onClick={() => openBozzaListinoManuale(m)}
                            >
                              + LISTINO
                            </button>
                          )}
                          <button type="button" className="mdo-delete" onClick={() => eliminaMateriale(m.id)} aria-label={`Elimina ${m.descrizione}`}>Elimina</button>
                        </div>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mdo-card-footer-bar">
            <div className="mdo-sticky-info"><span>Fornitore</span><strong>{isNuovoFornitore ? nomeFornitorePersonalizzato.trim() || "Nuovo fornitore" : fornitoreNome || "Non selezionato"}</strong></div>
            <div className="mdo-sticky-info"><span>Materiali temporanei</span><strong>{materiali.length}</strong></div>
            <div className="mdo-sticky-info"><span>Totale stimato</span><strong>CHF {totaleStimato.toFixed(2)}</strong></div>
            <div className="mdo-sticky-info"><span>Prezzi mancanti</span><strong>{prezziMancanti}</strong></div>
            <div className="mdo-sticky-actions">
              <button type="button" className="mdo-header-button" onClick={salvaOrdine} disabled={!canSaveOrdine}>{loading ? "SALVO..." : "CONFERMA ORDINE"}</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function OrdiniListView(props: { kind: ListKind; onOpenDettaglio: (id: string, fromTab: AcquistiTab) => void }) {
  const { kind, onOpenDettaglio } = props;
  const [ordini, setOrdini] = useState<Ordine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const formatDataIt = (raw: string | undefined) => {
    const value = String(raw || "").trim();
    const matchSpaced = value.match(/^(\d{1,2})\s+(\d{1,2})\s+(\d{4})$/);
    if (matchSpaced) {
      const gg = matchSpaced[1].padStart(2, "0");
      const mm = matchSpaced[2].padStart(2, "0");
      const aaaa = matchSpaced[3];
      return `${gg} ${mm} ${aaaa}`;
    }

    const matchGeneric = value.match(/^(\d{1,2})\D+(\d{1,2})\D+(\d{4})$/);
    if (matchGeneric) {
      const gg = matchGeneric[1].padStart(2, "0");
      const mm = matchGeneric[2].padStart(2, "0");
      const aaaa = matchGeneric[3];
      return `${gg} ${mm} ${aaaa}`;
    }

    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      const gg = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const aaaa = String(date.getFullYear());
      return `${gg} ${mm} ${aaaa}`;
    }

    return "00 00 0000";
  };

  const formatOrderRef = (ordine: Ordine) => {
    const fromData =
      (ordine as any)?.numeroOrdine ??
      (ordine as any)?.progressivo ??
      (ordine as any)?.numero;

    if (fromData !== undefined && fromData !== null && String(fromData).trim() !== "") {
      return String(fromData).trim();
    }

    const dataIt = formatDataIt(ordine.dataOrdine);
    const idTail = String(ordine.id || "").slice(-5).toUpperCase();
    return `ORD DEL ${dataIt} - ${idTail || "0000"}`;
  };

  useEffect(() => {
    const loadOrdini = async () => {
      try {
        setLoading(true);
        setError(null);
        const ordiniRaw = await getItemSync("@ordini");
        const arr = Array.isArray(ordiniRaw) ? (ordiniRaw as Ordine[]) : [];
        const filtered = kind === "attesa"
          ? arr.filter((ordine) => ordine.materiali.some((m) => !m.arrivato))
          : arr.filter((ordine) => ordine.materiali.some((m) => m.arrivato));
        setOrdini(filtered);
      } catch (err) {
        console.error(kind === "attesa" ? "Errore caricamento ordini:" : "Errore caricamento ordini arrivati:", err);
        setError(kind === "attesa" ? "Errore durante il caricamento degli ordini." : "Errore durante il caricamento degli ordini arrivati.");
      } finally {
        setLoading(false);
      }
    };
    void loadOrdini();
  }, [kind]);

  const fromTab: AcquistiTab = kind === "attesa" ? "Ordini" : "Arrivi";

  const eliminaOrdine = async (ordine: Ordine) => {
    const arrivati = ordine.materiali.filter((m) => m.arrivato).length;
    if (arrivati > 0) {
      window.alert("Eliminazione bloccata: l'ordine contiene materiali arrivati.");
      return;
    }

    const conferma = window.confirm("Confermi eliminazione ordine?");
    if (!conferma) return;

    try {
      const raw = await getItemSync("@ordini");
      const arr = Array.isArray(raw) ? (raw as Ordine[]) : [];
      const updated = arr.filter((o) => o.id !== ordine.id);
      await setItemSync("@ordini", updated);
      setOrdini((prev) => prev.filter((o) => o.id !== ordine.id));
    } catch (err) {
      console.error("Errore eliminazione ordine:", err);
      setError("Errore durante l'eliminazione dell'ordine.");
    }
  };

  if (loading) return <div className="acq-list-empty">Caricamento ordini...</div>;

  return (
    <div className="acq-list-shell">
      {error && <div className="acq-list-error">{error}</div>}
      {ordini.length === 0 ? (
        <div className="acq-list-empty">{kind === "attesa" ? "Nessun ordine in attesa." : "Nessun ordine arrivato."}</div>
      ) : (
        <div className="acq-orders-table-wrap">
          <table className="acq-orders-table">
            <thead>
              <tr>
                <th>Ordine</th>
                <th>Data</th>
                <th>Fornitore</th>
                <th>Stato</th>
                <th>Materiali</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {ordini.map((ordine) => {
                const tot = ordine.materiali.length;
                const arr = ordine.materiali.filter((m) => m.arrivato).length;
                const nonArr = tot - arr;
                const canDelete = arr === 0;
                return (
                  <tr key={ordine.id}>
                    <td>
                      <div className="acq-orders-cell-main" title={ordine.id}>
                        <strong>{formatOrderRef(ordine)}</strong>
                      </div>
                    </td>
                    <td>{formatDataIt(ordine.dataOrdine)}</td>
                    <td>{ordine.nomeFornitore}</td>
                    <td>
                      <span className={`acq-pill ${kind === "attesa" ? "is-warn" : "is-ok"}`}>
                        {kind === "attesa" ? "In attesa" : "Arrivato"}
                      </span>
                    </td>
                    <td>
                      <div className="acq-orders-stats-inline">
                        <span>Tot {tot}</span>
                        <span>Arr {arr}</span>
                        <span>Att {nonArr}</span>
                      </div>
                    </td>
                    <td>
                      <div className="acq-orders-actions-inline">
                        <button type="button" className="acq-btn acq-btn--primary" onClick={() => onOpenDettaglio(ordine.id, fromTab)}>Apri</button>
                        <details className="acq-kebab">
                          <summary className="acq-btn acq-kebab-trigger" aria-label="Altre azioni">⋮</summary>
                          <div className="acq-kebab-menu">
                            <button type="button" className="acq-kebab-item" onClick={() => onOpenDettaglio(ordine.id, fromTab)}>Modifica</button>
                            <button
                              type="button"
                              className="acq-kebab-item acq-kebab-item--danger"
                              onClick={() => eliminaOrdine(ordine)}
                              disabled={!canDelete}
                              title={!canDelete ? "Non eliminabile: presenti materiali arrivati" : "Elimina ordine"}
                            >
                              Elimina
                            </button>
                          </div>
                        </details>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PreventiviView(props: {
  focusPreventivoId?: string | null;
  onFocusHandled?: () => void;
  manualImportRequest?: { requestId: string; row: ImportBozzaRiga } | null;
  onManualImportHandled?: () => void;
}) {
  const { focusPreventivoId, onFocusHandled, manualImportRequest, onManualImportHandled } = props;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preventivi, setPreventivi] = useState<Preventivo[]>([]);
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [listinoVoci, setListinoVoci] = useState<ListinoVoce[]>([]);
  const [bozzaImportRows, setBozzaImportRows] = useState<ImportBozzaRiga[] | null>(null);
  const [bozzaSourcePreventivo, setBozzaSourcePreventivo] = useState<Preventivo | null>(null);

  const [fornitoreId, setFornitoreId] = useState("");
  const [numeroPreventivo, setNumeroPreventivo] = useState("");
  const [dataPreventivo, setDataPreventivo] = useState(oggi());
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [nuoveRighe, setNuoveRighe] = useState<PreventivoRiga[]>([]);
  const [newDesc, setNewDesc] = useState("");
  const [newUnita, setNewUnita] = useState("pz");
  const [newPrezzo, setNewPrezzo] = useState("");
  const [newNote, setNewNote] = useState("");

  const [draft, setDraft] = useState<Preventivo | null>(null);
  const [draftPdfFile, setDraftPdfFile] = useState<File | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editUnita, setEditUnita] = useState("pz");
  const [editPrezzo, setEditPrezzo] = useState("");
  const [editNote, setEditNote] = useState("");

  const openModificaFromList = (p: Preventivo) => {
    setShowNew(false);
    setSelectedId(p.id);
    setDraft(JSON.parse(JSON.stringify(p)));
    setDraftPdfFile(null);
    setEditDesc("");
    setEditUnita("pz");
    setEditPrezzo("");
    setEditNote("");
    setEditing(true);
  };

  const selected = useMemo(
    () => preventivi.find((p) => p.id === selectedId) || null,
    [preventivi, selectedId]
  );

  useEffect(() => {
    if (!focusPreventivoId) return;
    setSelectedId(focusPreventivoId);
    setShowNew(false);
    setEditing(false);
    setDraft(null);
    setDraftPdfFile(null);
    onFocusHandled?.();
  }, [focusPreventivoId, onFocusHandled]);

  useEffect(() => {
    if (!manualImportRequest) return;
    setShowNew(false);
    setSelectedId(null);
    setEditing(false);
    setDraft(null);
    setDraftPdfFile(null);
    setBozzaSourcePreventivo(null);
    setError(null);
    setBozzaImportRows([rehydrateBozzaRow({ ...manualImportRequest.row, daVerificare: true })]);
    onManualImportHandled?.();
  }, [manualImportRequest, onManualImportHandled]);

  const fornitoreNomeById = (id: string) => {
    const f = fornitori.find((x) => x.id === id);
    return f?.nome || "";
  };

  const persistPreventivi = async (next: Preventivo[]) => {
    const refDoc = doc(collection(db, "storage"), PREVENTIVI_DOC_ID);
    const sanitizedDoc = sanitizeUndefinedToNull({ preventivi: next });
    try {
      await setDoc(refDoc, sanitizedDoc, { merge: true });
    } catch (err) {
      console.error("Errore salvataggio preventivo (persistPreventivi):", err);
      throw err;
    }
  };

  const persistListino = async (next: ListinoVoce[]) => {
    const refDoc = doc(collection(db, "storage"), LISTINO_DOC_ID);
    const sanitizedDoc = sanitizeUndefinedToNull({ voci: next });
    try {
      await setDoc(refDoc, sanitizedDoc, { merge: true });
    } catch (err) {
      console.error("Errore salvataggio listino (persistListino):", err);
      throw err;
    }
  };

  const findListinoMatch = (r: {
    fornitoreId: string;
    articoloCanonico: string;
    unita: string;
    valuta: Valuta;
  }) => {
    const key = listinoKey(r);
    return listinoVoci.find((v) => listinoKey({
      fornitoreId: v.fornitoreId,
      articoloCanonico: v.articoloCanonico,
      unita: v.unita,
      valuta: v.valuta,
    }) === key);
  };

  const rehydrateBozzaRow = (row: ImportBozzaRiga): ImportBozzaRiga => {
    const match = findListinoMatch({
      fornitoreId: row.fornitoreId,
      articoloCanonico: row.articoloCanonico,
      unita: row.unita,
      valuta: row.valuta,
    });
    const prezzoPrecedente = match?.prezzoAttuale;
    const trendData = computeTrend(row.prezzoNuovo, prezzoPrecedente);
    return {
      ...row,
      prezzoPrecedente,
      trend: trendData.trend,
      daVerificare: true,
    };
  };

  const updateBozzaRow = (id: string, patch: Partial<ImportBozzaRiga>) => {
    setBozzaImportRows((prev) => {
      if (!prev) return prev;
      return prev.map((r) => {
        if (r.id !== id) return r;
        const prezzoNuovoRaw = patch.prezzoNuovo ?? r.prezzoNuovo;
        const prezzoNuovo = Number.isFinite(prezzoNuovoRaw) ? Number(prezzoNuovoRaw) : r.prezzoNuovo;
        const merged: ImportBozzaRiga = {
          ...r,
          ...patch,
          prezzoNuovo,
        };
        return rehydrateBozzaRow(merged);
      });
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const forRef = doc(db, "storage", "@fornitori");
        const forSnap = await getDoc(forRef);
        if (forSnap.exists()) {
          const arr = (forSnap.data()?.value || []) as any[];
          setFornitori(
            arr.map((f) => ({
              id: f.id || generaId(),
              nome: f.nome || f.ragioneSociale || "",
            }))
          );
        }

        const prevRef = doc(collection(db, "storage"), PREVENTIVI_DOC_ID);
        const prevSnap = await getDoc(prevRef);
        const list = prevSnap.exists()
          ? ((prevSnap.data()?.preventivi as Preventivo[]) || [])
          : [];
        const sorted = [...list].sort((a, b) => b.updatedAt - a.updatedAt);
        setPreventivi(sorted);

        const listinoRef = doc(collection(db, "storage"), LISTINO_DOC_ID);
        const listinoSnap = await getDoc(listinoRef);
        const voci = listinoSnap.exists()
          ? ((listinoSnap.data()?.voci as ListinoVoce[]) || [])
          : [];
        setListinoVoci(Array.isArray(voci) ? voci : []);
      } catch (err) {
        console.error("Errore caricamento preventivi:", err);
        setError("Errore caricamento registro preventivi.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!bozzaImportRows || bozzaImportRows.length === 0) return;
    setBozzaImportRows((prev) => {
      if (!prev) return prev;
      return prev.map((r) => rehydrateBozzaRow(r));
    });
  }, [listinoVoci]);

  const resetNuovoForm = () => {
    setFornitoreId("");
    setNumeroPreventivo("");
    setDataPreventivo(oggi());
    setPdfFile(null);
    setNuoveRighe([]);
    setNewDesc("");
    setNewUnita("pz");
    setNewPrezzo("");
    setNewNote("");
  };

  const addNewRiga = () => {
    const prezzo = Number(String(newPrezzo).replace(",", "."));
    if (!newDesc.trim() || !Number.isFinite(prezzo) || prezzo < 0) return;
    const riga: PreventivoRiga = {
      id: generaId(),
      descrizione: newDesc.trim().toUpperCase(),
      unita: newUnita,
      prezzoUnitario: prezzo,
      note: newNote.trim() || undefined,
    };
    setNuoveRighe((p) => [...p, riga]);
    setNewDesc("");
    setNewUnita("pz");
    setNewPrezzo("");
    setNewNote("");
  };

  const removeNewRiga = (id: string) => {
    setNuoveRighe((p) => p.filter((r) => r.id !== id));
  };

  const salvaNuovoPreventivo = async () => {
    const nomeFornitore = fornitoreNomeById(fornitoreId);
    if (!fornitoreId || !nomeFornitore || !numeroPreventivo.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const id = generaId();
      let pdfUrl: string | null = null;
      let pdfStoragePath: string | null = null;

      if (pdfFile) {
        pdfStoragePath = `preventivi/${id}.pdf`;
        const r = ref(storage, pdfStoragePath);
        await uploadBytes(r, pdfFile, { contentType: "application/pdf" });
        pdfUrl = await getDownloadURL(r);
      }

      const now = Date.now();
      const nuovo: Preventivo = {
        id,
        fornitoreId,
        fornitoreNome: nomeFornitore,
        numeroPreventivo: numeroPreventivo.trim(),
        dataPreventivo: dataPreventivo.trim() || oggi(),
        pdfUrl,
        pdfStoragePath,
        righe: nuoveRighe,
        createdAt: now,
        updatedAt: now,
      };

      const next = [nuovo, ...preventivi].sort((a, b) => b.updatedAt - a.updatedAt);
      await persistPreventivi(next);
      setPreventivi(next);
      setSelectedId(nuovo.id);
      setShowNew(false);
      resetNuovoForm();
    } catch (err) {
      console.error("Errore salvataggio preventivo (persistPreventivi):", err);
      setError("Errore salvataggio preventivo.");
    } finally {
      setSaving(false);
    }
  };

  const eliminaPreventivo = async (p: Preventivo) => {
    const ok = window.confirm(`Eliminare il preventivo ${p.numeroPreventivo}?`);
    if (!ok) return;

    setSaving(true);
    setError(null);
    try {
      if (p.pdfStoragePath) {
        try {
          await deleteObject(ref(storage, p.pdfStoragePath));
        } catch (err) {
          console.warn("Impossibile eliminare PDF da storage:", err);
        }
      }

      const next = preventivi.filter((x) => x.id !== p.id);
      await persistPreventivi(next);
      setPreventivi(next);
      if (selectedId === p.id) {
        setSelectedId(null);
        setEditing(false);
        setDraft(null);
        setDraftPdfFile(null);
      }
    } catch (err) {
      console.error("Errore eliminazione preventivo (persistPreventivi):", err);
      setError("Errore eliminazione preventivo.");
    } finally {
      setSaving(false);
    }
  };

  const startImportListino = (p: Preventivo) => {
    const rows: ImportBozzaRiga[] = (p.righe || []).map((r) => {
      const valuta = inferValuta({
        descrizione: r.descrizione,
        note: r.note,
        numeroPreventivo: p.numeroPreventivo,
      });
      const base: ImportBozzaRiga = {
        id: generaId(),
        fornitoreId: p.fornitoreId,
        fornitoreNome: p.fornitoreNome,
        articoloCanonico: normalizeArticoloCanonico(r.descrizione),
        codiceArticolo: "",
        unita: normalizeUnita(r.unita),
        valuta,
        prezzoNuovo: Number(r.prezzoUnitario || 0),
        trend: "new",
        fonte: {
          preventivoId: p.id,
          numeroPreventivo: p.numeroPreventivo,
          dataPreventivo: p.dataPreventivo,
          pdfUrl: p.pdfUrl || null,
          pdfStoragePath: p.pdfStoragePath || null,
        },
        daVerificare: true,
        note: r.note,
      };
      return rehydrateBozzaRow(base);
    });

    setBozzaSourcePreventivo(p);
    setBozzaImportRows(rows);
  };

  const annullaBozzaImport = () => {
    setBozzaImportRows(null);
    setBozzaSourcePreventivo(null);
  };

  const confermaImportBozza = async () => {
    if (!bozzaImportRows || bozzaImportRows.length === 0) return;
    const invalid = bozzaImportRows.find(
      (r) =>
        !String(r.articoloCanonico || "").trim() ||
        !String(r.unita || "").trim() ||
        !String(r.valuta || "").trim() ||
        !Number.isFinite(r.prezzoNuovo) ||
        Number(r.prezzoNuovo) <= 0
    );
    if (invalid) {
      setError("Bozza incompleta: compila Articolo, Unità, Valuta e Prezzo (> 0) prima della conferma.");
      return;
    }

    const ok = window.confirm(`Confermare import nel listino di ${bozzaImportRows.length} voci?`);
    if (!ok) return;

    setSaving(true);
    setError(null);
    try {
      const listinoRef = doc(collection(db, "storage"), LISTINO_DOC_ID);
      const listinoSnap = await getDoc(listinoRef);
      const current: ListinoVoce[] = listinoSnap.exists()
        ? ((listinoSnap.data()?.voci as ListinoVoce[]) || [])
        : [];

      let next = [...current];
      const now = Date.now();

      bozzaImportRows.forEach((r) => {
        const key = listinoKey({
          fornitoreId: r.fornitoreId,
          articoloCanonico: r.articoloCanonico,
          unita: r.unita,
          valuta: r.valuta,
        });

        const idx = next.findIndex((v) => listinoKey({
          fornitoreId: v.fornitoreId,
          articoloCanonico: v.articoloCanonico,
          unita: v.unita,
          valuta: v.valuta,
        }) === key);

        if (idx >= 0) {
          const prev = next[idx];
          const trendData = computeTrend(r.prezzoNuovo, prev.prezzoAttuale);
          next[idx] = {
            ...prev,
            articoloCanonico: r.articoloCanonico,
            codiceArticolo: r.codiceArticolo || undefined,
            unita: normalizeUnita(r.unita),
            valuta: r.valuta,
            prezzoPrecedente: prev.prezzoAttuale,
            fontePrecedente: {
              preventivoId: prev.fonteAttuale.preventivoId,
              numeroPreventivo: prev.fonteAttuale.numeroPreventivo,
              dataPreventivo: prev.fonteAttuale.dataPreventivo,
            },
            prezzoAttuale: r.prezzoNuovo,
            fonteAttuale: {
              preventivoId: r.fonte.preventivoId,
              numeroPreventivo: r.fonte.numeroPreventivo,
              dataPreventivo: r.fonte.dataPreventivo,
              pdfUrl: r.fonte.pdfUrl,
              pdfStoragePath: r.fonte.pdfStoragePath,
            },
            trend: trendData.trend,
            deltaAbs: trendData.deltaAbs,
            deltaPct: trendData.deltaPct,
            updatedAt: now,
          };
        } else {
          next.push({
            id: generaId(),
            fornitoreId: r.fornitoreId,
            fornitoreNome: r.fornitoreNome,
            articoloCanonico: r.articoloCanonico,
            codiceArticolo: r.codiceArticolo || undefined,
            unita: normalizeUnita(r.unita),
            valuta: r.valuta,
            prezzoAttuale: r.prezzoNuovo,
            fonteAttuale: {
              preventivoId: r.fonte.preventivoId,
              numeroPreventivo: r.fonte.numeroPreventivo,
              dataPreventivo: r.fonte.dataPreventivo,
              pdfUrl: r.fonte.pdfUrl,
              pdfStoragePath: r.fonte.pdfStoragePath,
            },
            trend: "new",
            updatedAt: now,
          });
        }
      });

      next = next.sort((a, b) => b.updatedAt - a.updatedAt);
      await persistListino(next);
      setListinoVoci(next);
      setBozzaImportRows(null);
      setBozzaSourcePreventivo(null);
      window.alert("Import completato");
    } catch (err) {
      console.error("Errore import listino (persistListino):", err);
      setError("Errore durante import nel listino.");
    } finally {
      setSaving(false);
    }
  };

  const openDettaglio = (p: Preventivo) => {
    setSelectedId(p.id);
    setEditing(false);
    setDraft(null);
    setDraftPdfFile(null);
  };

  const startEdit = () => {
    if (!selected) return;
    setDraft(JSON.parse(JSON.stringify(selected)));
    setDraftPdfFile(null);
    setEditDesc("");
    setEditUnita("pz");
    setEditPrezzo("");
    setEditNote("");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(null);
    setDraftPdfFile(null);
  };

  const removeDraftRiga = (id: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, righe: prev.righe.filter((r) => r.id !== id) };
    });
  };

  const addDraftRiga = () => {
    const prezzo = Number(String(editPrezzo).replace(",", "."));
    if (!editDesc.trim() || !Number.isFinite(prezzo) || prezzo < 0) return;
    const riga: PreventivoRiga = {
      id: generaId(),
      descrizione: editDesc.trim().toUpperCase(),
      unita: editUnita,
      prezzoUnitario: prezzo,
      note: editNote.trim() || undefined,
    };
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, righe: [...prev.righe, riga] };
    });
    setEditDesc("");
    setEditUnita("pz");
    setEditPrezzo("");
    setEditNote("");
  };

  const salvaModifiche = async () => {
    if (!draft) return;

    setSaving(true);
    setError(null);
    try {
      let pdfUrl = draft.pdfUrl;
      let pdfStoragePath = draft.pdfStoragePath;

      if (draftPdfFile) {
        const path = draft.pdfStoragePath || `preventivi/${draft.id}.pdf`;
        const r = ref(storage, path);
        await uploadBytes(r, draftPdfFile, { contentType: "application/pdf" });
        pdfUrl = await getDownloadURL(r);
        pdfStoragePath = path;
      }

      const updated: Preventivo = {
        ...draft,
        pdfUrl,
        pdfStoragePath,
        updatedAt: Date.now(),
      };

      const next = preventivi
        .map((p) => (p.id === updated.id ? updated : p))
        .sort((a, b) => b.updatedAt - a.updatedAt);
      await persistPreventivi(next);
      setPreventivi(next);
      setEditing(false);
      setDraft(null);
      setDraftPdfFile(null);
    } catch (err) {
      console.error("Errore aggiornamento preventivo (persistPreventivi):", err);
      setError("Errore aggiornamento preventivo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="acq-list-empty">Caricamento preventivi...</div>;

  return (
    <div className="acq-prev-shell">
      {error && <div className="acq-list-error">{error}</div>}

      <div className="acq-prev-topbar">
        <h2>Registro Preventivi</h2>
        <button
          type="button"
          className="acq-btn acq-btn--primary"
          onClick={() => setShowNew((v) => !v)}
        >
          {showNew ? "Chiudi" : "Nuovo preventivo"}
        </button>
      </div>

      {bozzaImportRows && (
        <div className="acq-prev-card acq-prev-card--draft">
          <h3>Bozza import (da verificare)</h3>
          {bozzaSourcePreventivo && (
            <p className="acq-prev-draft-meta">
              Fornitore: <strong>{bozzaSourcePreventivo.fornitoreNome}</strong> · Preventivo n.{" "}
              <strong>{bozzaSourcePreventivo.numeroPreventivo}</strong> del {bozzaSourcePreventivo.dataPreventivo}
            </p>
          )}
          {!bozzaSourcePreventivo && (
            <p className="acq-prev-draft-meta">
              Fonte bozza: <span className="acq-pill is-warn">MANUALE</span>
            </p>
          )}
          <div className="acq-prev-table-wrap">
            <table className="acq-prev-table">
              <thead>
                <tr>
                  <th>Fornitore</th>
                  <th>Articolo canonico</th>
                  <th>Codice</th>
                  <th>Unità</th>
                  <th>Valuta</th>
                  <th>Prezzo</th>
                  <th>Trend</th>
                  <th>Prezzo precedente</th>
                  <th>Fonte</th>
                </tr>
              </thead>
              <tbody>
                {bozzaImportRows.map((r) => (
                  <tr key={r.id} className={r.daVerificare ? "acq-prev-draft-row" : ""}>
                    <td>{r.fornitoreNome}</td>
                    <td>
                      <input
                        className="acq-prev-table-input"
                        value={r.articoloCanonico}
                        onChange={(e) => updateBozzaRow(r.id, { articoloCanonico: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="acq-prev-table-input"
                        value={r.codiceArticolo || ""}
                        onChange={(e) => updateBozzaRow(r.id, { codiceArticolo: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="acq-prev-table-input"
                        value={r.unita}
                        onChange={(e) => updateBozzaRow(r.id, { unita: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        className="acq-prev-table-input"
                        value={r.valuta}
                        onChange={(e) => updateBozzaRow(r.id, { valuta: e.target.value as Valuta })}
                      >
                        <option value="CHF">CHF</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </td>
                    <td>
                      <input
                        className="acq-prev-table-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={r.prezzoNuovo}
                        onChange={(e) => updateBozzaRow(r.id, { prezzoNuovo: Number(e.target.value) || 0 })}
                      />
                    </td>
                    <td>
                      <span className={`acq-pill ${r.trend === "down" ? "is-ok" : r.trend === "up" ? "is-danger" : "is-warn"}`}>
                        {r.trend}
                      </span>
                    </td>
                    <td>{r.prezzoPrecedente !== undefined ? r.prezzoPrecedente.toFixed(2) : "—"}</td>
                    <td>
                      {r.fonte.numeroPreventivo === "MANUALE" ? (
                        <span className="acq-pill is-warn">MANUALE</span>
                      ) : (
                        `N. ${r.fonte.numeroPreventivo} del ${r.fonte.dataPreventivo}`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="acq-prev-actions">
            <button type="button" className="acq-btn" onClick={annullaBozzaImport}>Annulla</button>
            <button type="button" className="acq-btn acq-btn--primary" disabled={saving} onClick={confermaImportBozza}>
              {saving ? "Import in corso..." : "Conferma import"}
            </button>
          </div>
        </div>
      )}

      {showNew && (
        <div className="acq-prev-card">
          <h3>Nuovo preventivo</h3>
          <div className="acq-prev-form-grid">
            <label className="acq-prev-field">
              <span>Fornitore</span>
              <select value={fornitoreId} onChange={(e) => setFornitoreId(e.target.value)}>
                <option value="">Seleziona fornitore</option>
                {fornitori.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </label>
            <label className="acq-prev-field">
              <span>N° preventivo</span>
              <input
                type="text"
                value={numeroPreventivo}
                onChange={(e) => setNumeroPreventivo(e.target.value)}
              />
            </label>
            <label className="acq-prev-field">
              <span>Data preventivo</span>
              <input
                type="text"
                placeholder="gg mm aaaa"
                value={dataPreventivo}
                onChange={(e) => setDataPreventivo(e.target.value)}
              />
            </label>
            <label className="acq-prev-field">
              <span>PDF</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div className="acq-prev-righe-box">
            <h4>Righe prezzo</h4>
            <div className="acq-prev-riga-insert">
              <input
                type="text"
                placeholder="Descrizione"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
              <input
                type="text"
                placeholder="Unità"
                value={newUnita}
                onChange={(e) => setNewUnita(e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Prezzo unitario"
                value={newPrezzo}
                onChange={(e) => setNewPrezzo(e.target.value)}
              />
              <input
                type="text"
                placeholder="Note"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <button type="button" className="acq-btn" onClick={addNewRiga}>Aggiungi riga</button>
            </div>
            <div className="acq-prev-table-wrap">
              <table className="acq-prev-table">
                <thead>
                  <tr>
                    <th>Descrizione</th>
                    <th>Unità</th>
                    <th>Prezzo unitario</th>
                    <th>Note</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {nuoveRighe.length === 0 ? (
                    <tr><td colSpan={5}>Nessuna riga aggiunta.</td></tr>
                  ) : (
                    nuoveRighe.map((r) => (
                      <tr key={r.id}>
                        <td>{r.descrizione}</td>
                        <td>{r.unita}</td>
                        <td>{r.prezzoUnitario}</td>
                        <td>{r.note || "—"}</td>
                        <td>
                          <button type="button" className="acq-btn acq-btn--danger" onClick={() => removeNewRiga(r.id)}>Elimina</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="acq-prev-actions">
            <button type="button" className="acq-btn" onClick={() => { setShowNew(false); resetNuovoForm(); }}>Annulla</button>
            <button type="button" className="acq-btn acq-btn--primary" disabled={saving} onClick={salvaNuovoPreventivo}>
              {saving ? "Salvataggio..." : "Salva preventivo"}
            </button>
          </div>
        </div>
      )}

      <div className="acq-prev-card">
        <h3>Elenco preventivi</h3>
        <div className="acq-prev-table-wrap">
          <table className="acq-prev-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Fornitore</th>
                <th>N° preventivo</th>
                <th># righe</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {preventivi.length === 0 ? (
                <tr><td colSpan={5}>Nessun preventivo registrato.</td></tr>
              ) : (
                preventivi.map((p) => (
                  <tr key={p.id}>
                    <td>{p.dataPreventivo}</td>
                    <td>{p.fornitoreNome}</td>
                    <td>{p.numeroPreventivo}</td>
                    <td>{p.righe.length}</td>
                    <td>
                      <div className="acq-prev-list-actions">
                        <button type="button" className="acq-btn acq-btn--primary" onClick={() => openDettaglio(p)}>Apri</button>
                        <details className="acq-kebab">
                          <summary className="acq-btn acq-kebab-trigger" aria-label="Altre azioni">⋮</summary>
                          <div className="acq-kebab-menu">
                            <button type="button" className="acq-kebab-item" onClick={() => openModificaFromList(p)}>Modifica</button>
                            <button type="button" className="acq-kebab-item" onClick={() => startImportListino(p)}>Importa nel listino</button>
                            <button type="button" className="acq-kebab-item acq-kebab-item--danger" onClick={() => eliminaPreventivo(p)}>Elimina</button>
                          </div>
                        </details>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="acq-prev-card">
          <div className="acq-prev-detail-head">
            <div>
              <h3>Dettaglio preventivo</h3>
              <p>{selected.fornitoreNome} · {selected.numeroPreventivo} · {selected.dataPreventivo}</p>
            </div>
            <div className="acq-prev-list-actions">
              {selected.pdfUrl && (
                <button
                  type="button"
                  className="acq-btn"
                  onClick={() => window.open(selected.pdfUrl!, "_blank", "noopener,noreferrer")}
                >
                  Apri PDF
                </button>
              )}
              {!editing ? (
                <button type="button" className="acq-btn acq-btn--primary" onClick={startEdit}>Modifica</button>
              ) : (
                <>
                  <button type="button" className="acq-btn" onClick={cancelEdit}>Annulla</button>
                  <button type="button" className="acq-btn acq-btn--primary" disabled={saving} onClick={salvaModifiche}>Salva</button>
                </>
              )}
            </div>
          </div>

          {!editing || !draft ? (
            <div className="acq-prev-table-wrap">
              <table className="acq-prev-table">
                <thead>
                  <tr>
                    <th>Descrizione</th>
                    <th>Unità</th>
                    <th>Prezzo unitario</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.righe.length === 0 ? (
                    <tr><td colSpan={4}>Nessuna riga.</td></tr>
                  ) : (
                    selected.righe.map((r) => (
                      <tr key={r.id}>
                        <td>{r.descrizione}</td>
                        <td>{r.unita}</td>
                        <td>{r.prezzoUnitario}</td>
                        <td>{r.note || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              <div className="acq-prev-form-grid">
                <label className="acq-prev-field">
                  <span>Fornitore</span>
                  <select
                    value={draft.fornitoreId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const nome = fornitoreNomeById(id);
                      setDraft((prev) => prev ? { ...prev, fornitoreId: id, fornitoreNome: nome } : prev);
                    }}
                  >
                    <option value="">Seleziona fornitore</option>
                    {fornitori.map((f) => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                </label>
                <label className="acq-prev-field">
                  <span>N° preventivo</span>
                  <input
                    type="text"
                    value={draft.numeroPreventivo}
                    onChange={(e) => setDraft((prev) => prev ? { ...prev, numeroPreventivo: e.target.value } : prev)}
                  />
                </label>
                <label className="acq-prev-field">
                  <span>Data preventivo</span>
                  <input
                    type="text"
                    value={draft.dataPreventivo}
                    onChange={(e) => setDraft((prev) => prev ? { ...prev, dataPreventivo: e.target.value } : prev)}
                  />
                </label>
                <label className="acq-prev-field">
                  <span>Sostituisci PDF</span>
                  <input type="file" accept="application/pdf" onChange={(e) => setDraftPdfFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              <div className="acq-prev-righe-box">
                <h4>Righe prezzo</h4>
                <div className="acq-prev-riga-insert">
                  <input type="text" placeholder="Descrizione" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                  <input type="text" placeholder="Unità" value={editUnita} onChange={(e) => setEditUnita(e.target.value)} />
                  <input type="number" min="0" step="0.01" placeholder="Prezzo unitario" value={editPrezzo} onChange={(e) => setEditPrezzo(e.target.value)} />
                  <input type="text" placeholder="Note" value={editNote} onChange={(e) => setEditNote(e.target.value)} />
                  <button type="button" className="acq-btn" onClick={addDraftRiga}>Aggiungi riga</button>
                </div>
                <div className="acq-prev-table-wrap">
                  <table className="acq-prev-table">
                    <thead>
                      <tr>
                        <th>Descrizione</th>
                        <th>Unità</th>
                        <th>Prezzo unitario</th>
                        <th>Note</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draft.righe.length === 0 ? (
                        <tr><td colSpan={5}>Nessuna riga.</td></tr>
                      ) : (
                        draft.righe.map((r) => (
                          <tr key={r.id}>
                            <td>{r.descrizione}</td>
                            <td>{r.unita}</td>
                            <td>{r.prezzoUnitario}</td>
                            <td>{r.note || "—"}</td>
                            <td>
                              <button type="button" className="acq-btn acq-btn--danger" onClick={() => removeDraftRiga(r.id)}>Elimina</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ListinoPrezziView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voci, setVoci] = useState<ListinoVoce[]>([]);
  const [fornitoreFilter, setFornitoreFilter] = useState("");
  const [valutaFilter, setValutaFilter] = useState<"" | Valuta>("");
  const [search, setSearch] = useState("");

  const apriVoceListino = (v: ListinoVoce) => {
    if (!v.fonteAttuale.pdfUrl) return;
    window.open(v.fonteAttuale.pdfUrl, "_blank", "noopener,noreferrer");
  };

  const persistListino = async (next: ListinoVoce[]) => {
    const refDoc = doc(collection(db, "storage"), LISTINO_DOC_ID);
    const sanitized = sanitizeUndefinedToNull({ voci: next });
    await setDoc(refDoc, sanitized, { merge: true });
  };

  const eliminaVoceListino = async (voce: ListinoVoce) => {
    const ok = window.confirm("Eliminare questa voce dal listino prezzi?");
    if (!ok) return;
    try {
      const next = voci.filter((x) => x.id !== voce.id);
      await persistListino(next);
      setVoci(next);
    } catch (err) {
      console.error("Errore eliminazione voce listino:", err);
      setError("Errore durante eliminazione voce listino.");
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const refDoc = doc(collection(db, "storage"), LISTINO_DOC_ID);
        const snap = await getDoc(refDoc);
        const list = snap.exists() ? ((snap.data()?.voci as ListinoVoce[]) || []) : [];
        const sorted = [...list].sort((a, b) => b.updatedAt - a.updatedAt);
        setVoci(sorted);
      } catch (err) {
        console.error("Errore caricamento listino:", err);
        setError("Errore caricamento listino prezzi.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const formatDataIt = (ts: number) => {
    const d = new Date(ts || 0);
    if (Number.isNaN(d.getTime())) return "00 00 0000";
    const gg = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const aaaa = String(d.getFullYear());
    return `${gg} ${mm} ${aaaa}`;
  };

  const fornitori = useMemo(() => {
    const map = new Map<string, string>();
    voci.forEach((v) => {
      if (!map.has(v.fornitoreId)) map.set(v.fornitoreId, v.fornitoreNome);
    });
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }));
  }, [voci]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return voci.filter((v) => {
      if (fornitoreFilter && v.fornitoreId !== fornitoreFilter) return false;
      if (valutaFilter && v.valuta !== valutaFilter) return false;
      if (!q) return true;
      return (
        v.articoloCanonico.toLowerCase().includes(q) ||
        String(v.codiceArticolo || "").toLowerCase().includes(q)
      );
    });
  }, [voci, fornitoreFilter, valutaFilter, search]);

  if (loading) return <div className="acq-list-empty">Caricamento listino prezzi...</div>;

  return (
    <div className="acq-listino-shell">
      {error && <div className="acq-list-error">{error}</div>}
      <div className="acq-listino-filters">
        <label className="acq-prev-field">
          <span>Fornitore</span>
          <select value={fornitoreFilter} onChange={(e) => setFornitoreFilter(e.target.value)}>
            <option value="">Tutti</option>
            {fornitori.map((f) => (
              <option key={f.id} value={f.id}>{f.nome}</option>
            ))}
          </select>
        </label>
        <label className="acq-prev-field">
          <span>Valuta</span>
          <select value={valutaFilter} onChange={(e) => setValutaFilter(e.target.value as "" | Valuta)}>
            <option value="">Tutte</option>
            <option value="CHF">CHF</option>
            <option value="EUR">EUR</option>
          </select>
        </label>
        <label className="acq-prev-field">
          <span>Cerca</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Articolo o codice" />
        </label>
      </div>

      <div className="acq-prev-table-wrap">
        <table className="acq-prev-table">
          <thead>
            <tr>
              <th>Fornitore</th>
              <th>Articolo</th>
              <th>Codice</th>
              <th>Unità</th>
              <th>Valuta</th>
              <th>Prezzo</th>
              <th>Trend</th>
              <th>Preventivo</th>
              <th>Data</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10}>Listino vuoto.</td></tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id}>
                  <td>{v.fornitoreNome}</td>
                  <td>{v.articoloCanonico}</td>
                  <td>{v.codiceArticolo || "—"}</td>
                  <td>{v.unita}</td>
                  <td>{v.valuta}</td>
                  <td>{v.prezzoAttuale.toFixed(2)}</td>
                  <td>
                    <span className={`acq-pill ${v.trend === "down" ? "is-ok" : v.trend === "up" ? "is-danger" : "is-warn"}`}>
                      {v.trend}
                    </span>
                  </td>
                  <td>{`N. ${v.fonteAttuale.numeroPreventivo}`}</td>
                  <td>{v.fonteAttuale.dataPreventivo || formatDataIt(v.updatedAt)}</td>
                  <td>
                    <div className="acq-prev-list-actions">
                      <button
                        type="button"
                        className="acq-btn acq-btn--primary"
                        disabled={!v.fonteAttuale.pdfUrl}
                        onClick={() => apriVoceListino(v)}
                        title={!v.fonteAttuale.pdfUrl ? "PDF non disponibile" : "Apri PDF"}
                      >
                        Apri
                      </button>
                      <details className="acq-kebab">
                        <summary className="acq-btn acq-kebab-trigger" aria-label="Altre azioni">⋮</summary>
                        <div className="acq-kebab-menu">
                          <button
                            type="button"
                            className="acq-kebab-item"
                            disabled={!v.fonteAttuale.pdfUrl}
                            onClick={() => apriVoceListino(v)}
                          >
                            Apri PDF
                          </button>
                          <button
                            type="button"
                            className="acq-kebab-item acq-kebab-item--danger"
                            onClick={() => eliminaVoceListino(v)}
                          >
                            Elimina
                          </button>
                        </div>
                      </details>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DettaglioOrdineView(props: { ordineId: string; onBack: () => void }) {
  const { ordineId, onBack } = props;

  const [ordine, setOrdine] = useState<Ordine | null>(null);
  const [ordineOriginale, setOrdineOriginale] = useState<Ordine | null>(null);
  const [preventiviRef, setPreventiviRef] = useState<Preventivo[]>([]);
  const [listinoRef, setListinoRef] = useState<ListinoVoce[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newUnit, setNewUnit] = useState("pz");
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!ordineId) return;
      const raw = await getItemSync("@ordini");
      const arr = Array.isArray(raw) ? (raw as Ordine[]) : [];
      const found = arr.find((o) => o.id === ordineId);
      if (!found) return;
      const a = JSON.parse(JSON.stringify(found));
      const b = JSON.parse(JSON.stringify(found));
      if (a.arrivato === undefined) a.arrivato = false;
      if (b.arrivato === undefined) b.arrivato = false;
      setOrdine(a);
      setOrdineOriginale(b);

      const [preventiviSnap, listinoSnap] = await Promise.all([
        getDoc(doc(db, "storage", PREVENTIVI_DOC_ID)),
        getDoc(doc(db, "storage", LISTINO_DOC_ID)),
      ]);
      setPreventiviRef(preventiviSnap.exists() ? ((preventiviSnap.data()?.preventivi as Preventivo[]) || []) : []);
      setListinoRef(listinoSnap.exists() ? ((listinoSnap.data()?.voci as ListinoVoce[]) || []) : []);
      setLoading(false);
    };
    void load();
  }, [ordineId]);

  const oggiDettaglio = () => {
    const n = new Date();
    const gg = String(n.getDate()).padStart(2, "0");
    const mm = String(n.getMonth() + 1).padStart(2, "0");
    const yy = n.getFullYear();
    return `${gg} ${mm} ${yy}`;
  };

  const materials = ordine ? [...ordine.materiali].sort((a, b) => (a.arrivato === b.arrivato ? 0 : a.arrivato ? 1 : -1)) : [];

  const readNumberFromAny = (value: unknown): number | null => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string") return null;
    const normalized = value.trim().replace(",", ".");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const priceInfoByMaterialeId = useMemo(() => {
    const map = new Map<
      string,
      {
        prezzoUnitario: number;
        valuta: Valuta;
        fonte: string;
        numeroPreventivo?: string;
        dataPreventivo?: string;
      } | null
    >();
    if (!ordine) return map;

    const fornitoreIdOrdine = String(ordine.idFornitore || "").trim();

    materials.forEach((m) => {
      const anyM = m as any;
      const manualCandidates = [anyM?.prezzoManuale, anyM?.prezzo, anyM?.prezzoUnitario, anyM?.costoUnitario];
      let manualPrice: number | null = null;
      for (const c of manualCandidates) {
        const parsed = readNumberFromAny(c);
        if (parsed !== null && parsed > 0) {
          manualPrice = parsed;
          break;
        }
      }
      if (manualPrice !== null) {
        const manualValRaw = String(anyM?.valuta || "").toUpperCase();
        const manualValuta: Valuta = manualValRaw === "EUR" ? "EUR" : "CHF";
        map.set(m.id, {
          prezzoUnitario: manualPrice,
          valuta: manualValuta,
          fonte: "MANUALE",
          numeroPreventivo: "MANUALE",
          dataPreventivo: ordine.dataOrdine || oggiDettaglio(),
        });
        return;
      }

      const descNorm = normalizeDescrizione(m.descrizione);
      const unitaNorm = normalizeUnita(m.unita);

      let bestListino: ListinoVoce | null = null;
      for (const v of listinoRef) {
        if (fornitoreIdOrdine && String(v.fornitoreId || "").trim() !== fornitoreIdOrdine) continue;
        if (
          normalizeArticoloCanonico(v.articoloCanonico) === descNorm &&
          normalizeUnita(v.unita) === unitaNorm
        ) {
          if (!bestListino || Number(v.updatedAt || 0) > Number(bestListino.updatedAt || 0)) {
            bestListino = v;
          }
        }
      }
      if (bestListino) {
        map.set(m.id, {
          prezzoUnitario: Number(bestListino.prezzoAttuale || 0),
          valuta: bestListino.valuta,
          fonte: `LISTINO ${bestListino.fonteAttuale.numeroPreventivo}`,
          numeroPreventivo: bestListino.fonteAttuale.numeroPreventivo,
          dataPreventivo: bestListino.fonteAttuale.dataPreventivo,
        });
        return;
      }

      let bestPreventivo: { prezzoUnitario: number; valuta: Valuta; rank: number; numero: string; data: string } | null = null;
      for (const p of preventiviRef) {
        if (fornitoreIdOrdine && String(p.fornitoreId || "").trim() !== fornitoreIdOrdine) continue;
        for (const r of p.righe || []) {
          if (
            normalizeDescrizione(r.descrizione) === descNorm &&
            normalizeUnita(r.unita) === unitaNorm
          ) {
            const rank = Number(p.updatedAt || p.createdAt || parseDataPreventivoToTs(p.dataPreventivo) || 0);
            const valuta = inferValuta({
              descrizione: r.descrizione,
              note: r.note,
              numeroPreventivo: p.numeroPreventivo,
            });
              const candidate = {
                prezzoUnitario: Number(r.prezzoUnitario || 0),
                valuta,
                rank,
                numero: p.numeroPreventivo,
                data: p.dataPreventivo,
              };
            if (!bestPreventivo || candidate.rank > bestPreventivo.rank) {
              bestPreventivo = candidate;
            }
          }
        }
      }
      if (bestPreventivo) {
        map.set(m.id, {
          prezzoUnitario: bestPreventivo.prezzoUnitario,
          valuta: bestPreventivo.valuta,
          fonte: `PREV ${bestPreventivo.numero}`,
          numeroPreventivo: bestPreventivo.numero,
          dataPreventivo: bestPreventivo.data,
        });
        return;
      }

      map.set(m.id, null);
    });

    return map;
  }, [materials, ordine, listinoRef, preventiviRef]);

  const riepilogoTotali = useMemo(() => {
    const totals: Record<Valuta, number> = { CHF: 0, EUR: 0 };
    let missing = 0;
    materials.forEach((m) => {
      const info = priceInfoByMaterialeId.get(m.id);
      if (!info || !Number.isFinite(info.prezzoUnitario) || info.prezzoUnitario <= 0) {
        missing += 1;
        return;
      }
      totals[info.valuta] += m.quantita * info.prezzoUnitario;
    });
    const usedValute = (["CHF", "EUR"] as Valuta[]).filter((v) => totals[v] > 0);
    return { totals, missing, usedValute, mixed: usedValute.length > 1 };
  }, [materials, priceInfoByMaterialeId]);

  const handlePdfFornitoriDettaglio = async () => {
    if (!ordine) return;
    const rows = ordine.materiali.map((m) => ({
      descrizione: m.descrizione,
      quantita: String(m.quantita),
      unita: m.unita,
      note: String((m as any)?.note ?? "").trim() || "-",
    }));
    await generateSmartPDF({
      kind: "table",
      title: `FORNITORE ${ordine.nomeFornitore} - ORDINE ${ordine.dataOrdine}`,
      columns: ["descrizione", "quantita", "unita", "note"],
      rows,
    });
  };

  const handlePdfDirezioneDettaglio = async () => {
    if (!ordine) return;
    const rows: Array<Record<string, string>> = [];
    let missing = 0;
    const totals: Record<Valuta, number> = { CHF: 0, EUR: 0 };

    ordine.materiali.forEach((m) => {
      const info = priceInfoByMaterialeId.get(m.id);
      const hasPrice = !!info && Number.isFinite(info.prezzoUnitario) && info.prezzoUnitario > 0;
      if (!hasPrice) missing += 1;
      const valuta = info?.valuta ?? "CHF";
      const totalRow = hasPrice ? m.quantita * info!.prezzoUnitario : 0;
      if (hasPrice) totals[valuta] += totalRow;
      const ref = info?.numeroPreventivo
        ? `N. ${info.numeroPreventivo}${info.dataPreventivo ? ` del ${info.dataPreventivo}` : ""}`
        : "—";

      rows.push({
        descrizione: m.descrizione,
        quantita: String(m.quantita),
        unita: m.unita,
        prezzoUnitario: hasPrice ? `${info!.prezzoUnitario.toFixed(2)} ${valuta}` : "—",
        totaleRiga: hasPrice ? `${totalRow.toFixed(2)} ${valuta}` : "—",
        preventivo: ref,
      });
    });

    const used = (["CHF", "EUR"] as Valuta[]).filter((v) => totals[v] > 0);
    if (used.length > 1) {
      rows.push({
        descrizione: "TOTALE CHF",
        quantita: "",
        unita: "",
        prezzoUnitario: "",
        totaleRiga: `${totals.CHF.toFixed(2)} CHF`,
        preventivo: "",
      });
      rows.push({
        descrizione: "TOTALE EUR",
        quantita: "",
        unita: "",
        prezzoUnitario: "",
        totaleRiga: `${totals.EUR.toFixed(2)} EUR`,
        preventivo: "",
      });
      rows.push({
        descrizione: "VALUTE",
        quantita: "",
        unita: "",
        prezzoUnitario: "",
        totaleRiga: "MISTE",
        preventivo: "",
      });
    } else {
      const single = used[0];
      rows.push({
        descrizione: missing > 0 ? "TOTALE PARZIALE" : "TOTALE ORDINE",
        quantita: "",
        unita: "",
        prezzoUnitario: "",
        totaleRiga: single ? `${totals[single].toFixed(2)} ${single}` : "—",
        preventivo: "",
      });
    }
    rows.push({
      descrizione: "PREZZI MANCANTI",
      quantita: String(missing),
      unita: "",
      prezzoUnitario: "",
      totaleRiga: "",
      preventivo: "",
    });

    await generateSmartPDF({
      kind: "table",
      title: `DIREZIONE ${ordine.nomeFornitore} - ORDINE ${ordine.dataOrdine}`,
      columns: ["descrizione", "quantita", "unita", "prezzoUnitario", "totaleRiga", "preventivo"],
      rows,
    });
  };

  const toggleArrivatoOrdine = async () => {
    if (!ordine) return;
    const nuovo = !ordine.arrivato;
    const updated: Ordine = {
      ...ordine,
      arrivato: nuovo,
      materiali: ordine.materiali.map((m) => ({ ...m, arrivato: nuovo, dataArrivo: nuovo ? oggiDettaglio() : "" })),
    };
    await salvaCompleto(updated);
  };

  const setField = (id: string, field: keyof MaterialeOrdine, value: any) => {
    setOrdine((prev) => {
      if (!prev) return prev;
      return { ...prev, materiali: prev.materiali.map((m) => (m.id === id ? { ...m, [field]: value } : m)) };
    });
  };

  const cambiaDescrizione = (id: string, v: string) => setField(id, "descrizione", v.toUpperCase());
  const cambiaQuantita = (id: string, v: string) => setField(id, "quantita", parseInt(v.replace(/\D/g, "").slice(0, 3)) || 0);
  const cambiaUnita = (id: string, v: string) => setField(id, "unita", v);
  const cambiaArrivato = (id: string, v: boolean) => setField(id, "arrivato", v);
  const cambiaData = (id: string, v: string) => setField(id, "dataArrivo", v);

  const uploadFoto = async (id: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ordine) return;
    const target = ordine.materiali.find((m) => m.id === id);
    const old = target?.fotoStoragePath;
    if (old) await deleteMaterialImage(old);
    const { fotoUrl, fotoStoragePath } = await uploadMaterialImage(file, id);
    setField(id, "fotoUrl", fotoUrl);
    setField(id, "fotoStoragePath", fotoStoragePath);
    e.target.value = "";
  };

  const rimuoviFoto = async (id: string) => {
    const target = ordine?.materiali.find((m) => m.id === id);
    if (target?.fotoStoragePath) {
      await deleteMaterialImage(target.fotoStoragePath);
    }
    setField(id, "fotoUrl", null);
    setField(id, "fotoStoragePath", null);
  };

  const aggiornaInventario = async (oldO: Ordine, newO: Ordine) => {
    const raw = await getItemSync("@inventario");
    let inv: any[] = Array.isArray(raw) ? raw : [];

    const oldMap = new Map(oldO.materiali.map((m) => [m.id, m]));
    const newMap = new Map(newO.materiali.map((m) => [m.id, m]));
    const ids = new Set([...oldMap.keys(), ...newMap.keys()]);

    const applyDelta = (m: MaterialeOrdine, delta: number) => {
      const idx = inv.findIndex(
        (x: any) => x.descrizione === m.descrizione && x.unita === m.unita && x.fornitore === newO.nomeFornitore
      );
      if (idx >= 0) {
        const newQty = inv[idx].quantita + delta;
        if (newQty <= 0) inv.splice(idx, 1);
        else inv[idx].quantita = newQty;
      } else if (delta > 0) {
        inv.push({
          id: `${Date.now()}_${Math.random()}`,
          descrizione: m.descrizione,
          unita: m.unita,
          quantita: delta,
          fornitore: newO.nomeFornitore || null,
          fotoUrl: m.fotoUrl || null,
          fotoStoragePath: m.fotoStoragePath || null,
        });
      }
    };

    ids.forEach((id) => {
      const old = oldMap.get(id);
      const now = newMap.get(id);
      if (old && !now) {
        if (old.arrivato) applyDelta(old, -old.quantita);
        return;
      }
      if (!old && now) {
        if (now.arrivato) applyDelta(now, now.quantita);
        return;
      }
      if (old && now) {
        if (!old.arrivato && now.arrivato) applyDelta(now, now.quantita);
        if (old.arrivato && !now.arrivato) applyDelta(old, -old.quantita);
        if (old.arrivato && now.arrivato) {
          const diff = now.quantita - old.quantita;
          if (diff !== 0) applyDelta(now, diff);
        }
      }
    });

    await setItemSync("@inventario", inv);
  };

  const salvaCompleto = async (nuovo: Ordine) => {
    const raw = await getItemSync("@ordini");
    let arr = Array.isArray(raw) ? (raw as Ordine[]) : [];
    arr = arr.map((o) => (o.id === nuovo.id ? nuovo : o));
    await setItemSync("@ordini", arr);
    await aggiornaInventario(ordineOriginale!, nuovo);
    setOrdine(JSON.parse(JSON.stringify(nuovo)));
    setOrdineOriginale(JSON.parse(JSON.stringify(nuovo)));
    setEditing(false);
    setAddingMaterial(false);
  };

  const eliminaMateriale = async (id: string) => {
    if (!ordine) return;
    const target = ordine.materiali.find((m) => m.id === id);
    const updated: Ordine = { ...ordine, materiali: ordine.materiali.filter((m) => m.id !== id) };

    if (target?.arrivato) {
      const invRaw = await getItemSync("@inventario");
      let inv: any[] = Array.isArray(invRaw) ? invRaw : [];
      const idx = inv.findIndex(
        (i: any) => i.descrizione === target.descrizione && i.unita === target.unita && i.fornitore === ordine.nomeFornitore
      );
      if (idx >= 0) {
        const newQty = inv[idx].quantita - target.quantita;
        if (newQty <= 0) inv.splice(idx, 1);
        else inv[idx].quantita = newQty;
      }
      await setItemSync("@inventario", inv);
    }

    await salvaCompleto(updated);
  };

  const salvaNuovoMateriale = async () => {
    if (!ordine) return;
    const id = `${Date.now()}_${Math.random()}`;
    let fotoUrl = null;
    let fotoStoragePath = null;
    if (newPhotoFile) {
      const up = await uploadMaterialImage(newPhotoFile, id);
      fotoUrl = up.fotoUrl;
      fotoStoragePath = up.fotoStoragePath;
    }
    const nuovo: MaterialeOrdine = {
      id,
      descrizione: newDesc.toUpperCase(),
      quantita: parseInt(newQty) || 0,
      unita: newUnit,
      arrivato: false,
      dataArrivo: "",
      fotoUrl,
      fotoStoragePath,
    };
    const updated: Ordine = { ...ordine, materiali: [...ordine.materiali, nuovo] };
    await salvaCompleto(updated);
    setNewDesc("");
    setNewQty("");
    setNewUnit("pz");
    setNewPhotoFile(null);
  };

  if (loading) return <div className="acq-detail-state">Caricamento...</div>;
  if (!ordine) return <div className="acq-detail-state">Ordine non trovato.</div>;

  const tot = ordine.materiali.length;
  const arr = ordine.materiali.filter((m) => m.arrivato).length;
  const stato = arr === 0 ? "IN ATTESA" : arr < tot ? "PARZIALE" : "ARRIVATO";

  return (
    <div className="acq-detail">
      <div className="acq-detail-head">
        <div>
          <p className="acq-section-kicker">Dettaglio ordine</p>
          <h3>{ordine.nomeFornitore}</h3>
          <p className="acq-detail-meta">Ordine del {ordine.dataOrdine}</p>
        </div>
        <div className="acq-detail-head-actions">
          <button type="button" className="acq-btn" onClick={onBack}>Indietro</button>
          {!editing && (
            <button type="button" className="acq-btn" onClick={toggleArrivatoOrdine}>
              {ordine.arrivato ? "Segna NON Arrivato" : "Segna Arrivato"}
            </button>
          )}
          {!editing ? (
            <button type="button" className="acq-btn acq-btn--primary" onClick={() => setEditing(true)}>Modifica</button>
          ) : (
            <button type="button" className="acq-btn acq-btn--primary" onClick={() => salvaCompleto(ordine)}>Salva</button>
          )}
        </div>
      </div>

      <div className="acq-detail-summary">
        <div className="acq-detail-summary-left">
          <span className={`acq-pill ${stato === "ARRIVATO" ? "is-ok" : stato === "PARZIALE" ? "is-warn" : "is-danger"}`}>{stato}</span>
          <span className="acq-pill">Materiali: {tot}</span>
          <span className="acq-pill">Arrivati: {arr}</span>
        </div>
        <div className="acq-detail-totals">
          <div className="acq-detail-pdf-actions">
            <button
              type="button"
              className="acq-btn"
              onClick={handlePdfFornitoriDettaglio}
              disabled={!ordine}
              title={!ordine ? "Ordine non disponibile" : "PDF senza prezzi"}
            >
              PDF Fornitori
            </button>
            <button
              type="button"
              className="acq-btn acq-btn--primary"
              onClick={handlePdfDirezioneDettaglio}
              disabled={!ordine}
              title={!ordine ? "Ordine non disponibile" : "PDF con prezzi e riferimenti"}
            >
              PDF Direzione
            </button>
          </div>
          {riepilogoTotali.mixed ? (
            <>
              <span className="acq-pill is-warn">Valute miste</span>
              <strong>Totale CHF: CHF {riepilogoTotali.totals.CHF.toFixed(2)}</strong>
              <strong>Totale EUR: EUR {riepilogoTotali.totals.EUR.toFixed(2)}</strong>
            </>
          ) : (
            <strong>
              {riepilogoTotali.missing > 0 ? "Totale parziale: " : "Totale ordine: "}
              {riepilogoTotali.usedValute.length === 0
                ? "�"
                : `${riepilogoTotali.usedValute[0]} ${riepilogoTotali.totals[riepilogoTotali.usedValute[0]].toFixed(2)}`}
            </strong>
          )}
          {riepilogoTotali.missing > 0 && <span className="acq-pill">Prezzi mancanti: {riepilogoTotali.missing}</span>}
        </div>
      </div>

      {!editing && !addingMaterial && (
        <button type="button" className="acq-btn" onClick={() => setAddingMaterial(true)}>+ Aggiungi materiale</button>
      )}

      {addingMaterial && (
        <div className="acq-detail-addbox">
          <input className="acq-input" placeholder="DESCRIZIONE" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          <div className="acq-detail-addrow">
            <input className="acq-input" placeholder="QTA" value={newQty} onChange={(e) => setNewQty(e.target.value.replace(/\D/g, "").slice(0, 3))} />
            <select className="acq-input" value={newUnit} onChange={(e) => setNewUnit(e.target.value)}>
              <option value="pz">PZ</option><option value="kg">KG</option><option value="m">M</option><option value="lt">LT</option>
            </select>
          </div>
          <input type="file" accept="image/*" onChange={(e) => setNewPhotoFile(e.target.files?.[0] || null)} />
          <div className="acq-detail-head-actions">
            <button type="button" className="acq-btn acq-btn--primary" onClick={salvaNuovoMateriale}>Salva</button>
            <button type="button" className="acq-btn" onClick={() => setAddingMaterial(false)}>Annulla</button>
          </div>
        </div>
      )}

      <div className="acq-detail-table-wrap">
        <table className="acq-detail-table">
          <thead>
            <tr>
              <th>Foto</th><th>Descrizione</th><th>Q.tà</th><th>Unità</th><th>Arrivato</th><th>Data arrivo</th><th>Totale riga</th><th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="acq-detail-photo-cell">
                    {m.fotoUrl ? <img src={m.fotoUrl} alt={m.descrizione} /> : <span>—</span>}
                    {editing && (
                      <div className="acq-detail-photo-buttons">
                        <label className="acq-btn acq-btn--small">Foto<input type="file" accept="image/*" onChange={(e) => uploadFoto(m.id, e)} style={{ display: "none" }} /></label>
                        {m.fotoUrl && <button type="button" className="acq-btn acq-btn--danger acq-btn--small" onClick={() => rimuoviFoto(m.id)}>Rimuovi</button>}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  {!editing ? (
                    <div className="acq-detail-desc-cell"><strong title={m.id}>{m.descrizione}</strong></div>
                  ) : (
                    <input className="acq-input" value={m.descrizione} onChange={(e) => cambiaDescrizione(m.id, e.target.value)} />
                  )}
                </td>
                <td>{!editing ? m.quantita : <input className="acq-input acq-input--sm" value={m.quantita} onChange={(e) => cambiaQuantita(m.id, e.target.value)} />}</td>
                <td>{!editing ? m.unita : <select className="acq-input acq-input--sm" value={m.unita} onChange={(e) => cambiaUnita(m.id, e.target.value)}><option value="pz">PZ</option><option value="kg">KG</option><option value="m">M</option><option value="lt">LT</option></select>}</td>
                <td>{!editing ? <span className={`acq-pill ${m.arrivato ? "is-ok" : "is-danger"}`}>{m.arrivato ? "Sì" : "No"}</span> : <label className="acq-check-inline"><input type="checkbox" checked={m.arrivato} onChange={(e) => cambiaArrivato(m.id, e.target.checked)} /> Arrivato</label>}</td>
                <td>{!editing ? m.dataArrivo || "—" : <input className="acq-input acq-input--sm" value={m.dataArrivo || ""} onChange={(e) => cambiaData(m.id, e.target.value)} placeholder="gg mm aaaa" />}</td>
                <td>
                  {(() => {
                    const info = priceInfoByMaterialeId.get(m.id);
                    if (!info) return "—";
                    const rowTotal = m.quantita * info.prezzoUnitario;
                    return `${info.valuta} ${rowTotal.toFixed(2)}`;
                  })()}
                </td>
                <td>{editing && <button type="button" className="acq-btn acq-btn--danger acq-btn--small" onClick={() => eliminaMateriale(m.id)}>Elimina</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const Acquisti = () => {
  const navigate = useNavigate();
  const { ordineId } = useParams<{ ordineId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const derivedTab = keyToTab(searchParams.get("tab"), ordineId ? "Ordini" : "Ordine materiali");
  const [activeTab, setActiveTab] = useState<AcquistiTab>(derivedTab);
  const [headerSearch, setHeaderSearch] = useState("");
  const [focusPreventivoId, setFocusPreventivoId] = useState<string | null>(null);
  const [manualImportRequest, setManualImportRequest] = useState<{ requestId: string; row: ImportBozzaRiga } | null>(null);

  useEffect(() => {
    setActiveTab(derivedTab);
  }, [derivedTab]);

  const setTab = (tab: AcquistiTab) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set("tab", tabToKey(tab));
    if (ordineId) {
      navigate(`/acquisti?${next.toString()}`);
      return;
    }
    setSearchParams(next, { replace: true });
  };

  const openDettaglio = (id: string, fromTab: AcquistiTab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tabToKey(fromTab));
    navigate(`/acquisti/dettaglio/${id}?${next.toString()}`);
  };

  const closeDettaglio = () => {
    const next = new URLSearchParams(searchParams);
    if (!next.get("tab")) next.set("tab", tabToKey(activeTab));
    navigate(`/acquisti?${next.toString()}`);
  };

  const openPreventivoFromOrdine = (payload: { preventivoId: string; pdfUrl: string | null }) => {
    if (payload.pdfUrl) {
      window.open(payload.pdfUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setFocusPreventivoId(payload.preventivoId);
    setTab("Prezzi & Preventivi");
  };

  const openManualListinoFromOrdine = (row: ImportBozzaRiga) => {
    setManualImportRequest({
      requestId: generaId(),
      row,
    });
    setTab("Prezzi & Preventivi");
  };

  return (
    <div className={`acq-page${ordineId ? " is-detail" : ""}`}>
      <div className="acq-shell">
        <header className="acq-header">
          <div>
            <p className="acq-eyebrow">Gestione Acquisti</p>
            <h1 className="acq-title">Acquisti</h1>
            <p className="acq-subtitle">Modulo unico: ordine materiali, liste ordini e dettaglio ordine.</p>
          </div>
          <div className="acq-header-actions">
            <label className="acq-search">
              <span>Cerca</span>
              <input type="search" placeholder="Ricerca UI (placeholder)" value={headerSearch} onChange={(e) => setHeaderSearch(e.target.value)} />
            </label>
            <div className="acq-cta-row">
              <button type="button" className="acq-cta">Carica preventivo</button>
            </div>
          </div>
        </header>

        <div className="acq-tabs" role="tablist" aria-label="Schede acquisti">
          {TABS.map((tab) => {
            const isActive = !ordineId && activeTab === tab;
            return (
              <button key={tab} type="button" role="tab" aria-selected={isActive} className={`acq-tab ${isActive ? "is-active" : ""}`} onClick={() => setTab(tab)}>
                <span>{tab}</span>
              </button>
            );
          })}
          {ordineId && <div className="acq-tab acq-tab--detail-live"><span>Dettaglio ordine</span></div>}
        </div>

        <section className="acq-content">
          {ordineId ? (
            <div className="acq-tab-panel acq-tab-panel--detail">
              <DettaglioOrdineView ordineId={ordineId} onBack={closeDettaglio} />
            </div>
          ) : activeTab === "Ordine materiali" ? (
            <div className="acq-tab-panel acq-tab-panel--fabbisogni">
              <OrdineMaterialiView
                onOpenPreventivo={openPreventivoFromOrdine}
                onOpenManualListino={openManualListinoFromOrdine}
              />
            </div>
          ) : activeTab === "Ordini" ? (
            <div className="acq-tab-panel">
              <div className="acq-section-header">
                <h2>Ordini in attesa</h2>
              </div>
              <OrdiniListView kind="attesa" onOpenDettaglio={openDettaglio} />
            </div>
          ) : activeTab === "Arrivi" ? (
            <div className="acq-tab-panel">
              <div className="acq-section-header">
                <h2>Ordini arrivati</h2>
              </div>
              <OrdiniListView kind="arrivi" onOpenDettaglio={openDettaglio} />
            </div>
          ) : activeTab === "Prezzi & Preventivi" ? (
            <div className="acq-tab-panel">
              <PreventiviView
                focusPreventivoId={focusPreventivoId}
                onFocusHandled={() => setFocusPreventivoId(null)}
                manualImportRequest={manualImportRequest}
                onManualImportHandled={() => setManualImportRequest(null)}
              />
            </div>
          ) : activeTab === "Listino Prezzi" ? (
            <div className="acq-tab-panel">
              <ListinoPrezziView />
            </div>
          ) : (
            <div className="acq-tab-panel">
              <div className="acq-section-header">
                <h2>Listino prezzi</h2>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Acquisti;




