// ==========  INIZIO FILE COMPLETO PULITO  ==========
// src/pages/Mezzi.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { buildNextDossierPath, NEXT_HOME_PATH } from "./nextStructuralPaths";
import "../pages/Mezzi.css";
import "./next-shell.css";
import { formatDateInput, formatDateUI } from "../utils/dateFormat";
import {
  normalizeNextMezzoCategoria,
  readNextAnagraficheFlottaSnapshot,
  type NextAnagraficheFlottaCollegaItem,
  type NextAnagraficheFlottaMezzoItem,
} from "./nextAnagraficheFlottaDomain";

const CLONE_READ_ONLY_TITLE = "Clone read-only: operazione bloccata";
const CLONE_READ_ONLY_ERROR = "Clone read-only: operazione non disponibile.";

type Collega = NextAnagraficheFlottaCollegaItem;
type Mezzo = NextAnagraficheFlottaMezzoItem;

function buildDate(yyyyStr: string, mmStr: string, ddStr: string): Date | null {
  const yyyy = Number(yyyyStr);
  const mm = Number(mmStr);
  const dd = Number(ddStr);
  if (!Number.isFinite(yyyy) || !Number.isFinite(mm) || !Number.isFinite(dd)) {
    return null;
  }
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const date = new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
  if (
    date.getFullYear() !== yyyy ||
    date.getMonth() !== mm - 1 ||
    date.getDate() !== dd
  ) {
    return null;
  }
  return date;
}

function parseDateFlexible(value: string | null | undefined): Date | null {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;

  const isoMatch = /(\d{4})-(\d{2})-(\d{2})/.exec(text);
  const dmyMatch = /(\d{2})[./\s](\d{2})[./\s](\d{4})/.exec(text);

  const candidates: Array<{ index: number; date: Date }> = [];
  if (isoMatch) {
    const date = buildDate(isoMatch[1], isoMatch[2], isoMatch[3]);
    if (date) candidates.push({ index: isoMatch.index, date });
  }
  if (dmyMatch) {
    const date = buildDate(dmyMatch[3], dmyMatch[2], dmyMatch[1]);
    if (date) candidates.push({ index: dmyMatch.index, date });
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => a.index - b.index);
  return candidates[0].date;
}

function formatDateForDisplay(date: Date | null): string {
  return formatDateUI(date);
}

function formatDateForInput(date: Date | null): string {
  return formatDateInput(date);
}

function normalizeTarga(value: string | null | undefined): string {
  return String(value || "").trim().toUpperCase();
}

// ---------------------------------------------
// Revisione automatica
// ---------------------------------------------

function calculaProssimaRevisione(
  dataImmatricolazione: Date | null,
  dataUltimoCollaudo: Date | null
): Date | null {
  if (!dataImmatricolazione) {
    return dataUltimoCollaudo ? new Date(dataUltimoCollaudo) : null;
  }

  const immDate = new Date(dataImmatricolazione);
  immDate.setHours(12, 0, 0, 0);

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const firstRevision = new Date(immDate);
  firstRevision.setFullYear(firstRevision.getFullYear() + 4);

  if (!dataUltimoCollaudo) {
    if (firstRevision > today) {
      return firstRevision;
    }

    const afterFirst = new Date(firstRevision);
    while (afterFirst <= today) {
      afterFirst.setFullYear(afterFirst.getFullYear() + 2);
    }
    return afterFirst;
  }

  const lastCollaudo = new Date(dataUltimoCollaudo);
  lastCollaudo.setHours(12, 0, 0, 0);

  const nextFromCollaudo = new Date(lastCollaudo);
  nextFromCollaudo.setFullYear(nextFromCollaudo.getFullYear() + 2);

  const nextFromImmatricolazione = new Date(immDate);
  while (nextFromImmatricolazione <= today) {
    nextFromImmatricolazione.setFullYear(
      nextFromImmatricolazione.getFullYear() + 2
    );
  }

  return nextFromCollaudo > nextFromImmatricolazione
    ? nextFromCollaudo
    : nextFromImmatricolazione;
}

// ---------------------------------------------
// UTILS DATE
// ---------------------------------------------

function giorniDaOggi(target: Date | null): number | null {
  if (!target) return null;
  const today = new Date();
  const utcToday = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const utcTarget = Date.UTC(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );
  return Math.round((utcTarget - utcToday) / 86400000);
}

// ---------------------------------------------
// COMPONENTE
// ---------------------------------------------

const Mezzi: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const debugEnvEnabled =
    Boolean(import.meta.env?.DEV) ||
    String(import.meta.env?.VITE_DEBUG_MEZZI || "") === "1";

  const [mezzi, setMezzi] = useState<Mezzo[]>([]);
  const [colleghi, setColleghi] = useState<Collega[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  // CAMPi NUOVI
  const [categoria, setCategoria] = useState("");
  const [autistaId, setAutistaId] = useState<string | null>(null);
  const [autistaNome, setAutistaNome] = useState<string | null>(null);

  const [manutenzioneDataInizio, setManutenzioneDataInizio] = useState("");
  const [manutenzioneDataFine, setManutenzioneDataFine] = useState("");
  const [manutenzioneKmMax, setManutenzioneKmMax] = useState("");
  const [manutenzioneContratto, setManutenzioneContratto] = useState("");

  // Campi originali
  const [tipoMezzo, setTipoMezzo] = useState<"motrice" | "cisterna">("motrice");
  const [targa, setTarga] = useState("");
  const [marca, setMarca] = useState("");
  const [modello, setModello] = useState("");
  const [telaio, setTelaio] = useState("");
  const [colore, setColore] = useState("");
  const [cilindrata, setCilindrata] = useState("");
  const [potenza, setPotenza] = useState("");
  const [massaComplessiva, setMassaComplessiva] = useState("");
  const [proprietario, setProprietario] = useState("");
  const [assicurazione, setAssicurazione] = useState("");
  const [dataImmatricolazione, setDataImmatricolazione] = useState("");
  const [dataScadenzaRevisione, setDataScadenzaRevisione] = useState("");
  const [dataUltimoCollaudo, setDataUltimoCollaudo] = useState("");
  const [lastAutoProssimoCollaudo, setLastAutoProssimoCollaudo] = useState("");
  const [manutenzioneProgrammata, setManutenzioneProgrammata] = useState(false);
  const [note, setNote] = useState("");
  const [, setIaLibrettoFile] = useState<File | null>(null);
  const [iaError, setIaError] = useState<string | null>(null);
  const [iaOverwrite, setIaOverwrite] = useState(false);

  // FOTO
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [, setFotoDirty] = useState(false);

  const fotoInputRef = useRef<HTMLInputElement | null>(null);
  const targaInputRef = useRef<HTMLInputElement | null>(null);
  const categoriaSelectRef = useRef<HTMLSelectElement | null>(null);
  const autistaSelectRef = useRef<HTMLSelectElement | null>(null);
  const preselectRef = useRef(false);
  const missingCardLogRef = useRef<Set<string>>(new Set());
  const pianaleCardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [debugMezziOpen, setDebugMezziOpen] = useState(false);
  const [categoriaEspansa, setCategoriaEspansa] = useState<string | null>(null);

  // ---------------------------------------------
  // LOAD
  // ---------------------------------------------

  useEffect(() => {
    const load = async () => {
      try {
        const snapshot = await readNextAnagraficheFlottaSnapshot();
        setMezzi(snapshot.items);
        setColleghi(snapshot.colleghi);
      } catch (err) {
        setError("Impossibile caricare i dati.");
        setMezzi([]);
        setColleghi([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ---------------------------------------------
  // HANDLERS FORM
  // ---------------------------------------------

  const resetForm = () => {
    setEditingId(null);

    setCategoria("");
    setAutistaId(null);
    setAutistaNome(null);

    setTipoMezzo("motrice");
    setTarga("");
    setMarca("");
    setModello("");
    setTelaio("");
    setColore("");
    setCilindrata("");
    setPotenza("");
    setMassaComplessiva("");
    setProprietario("");
    setAssicurazione("");
    setDataImmatricolazione("");
    setDataScadenzaRevisione("");
    setDataUltimoCollaudo("");
    setLastAutoProssimoCollaudo("");
    setManutenzioneProgrammata(false);
    setManutenzioneDataInizio("");
    setManutenzioneDataFine("");
    setManutenzioneKmMax("");
    setManutenzioneContratto("");
    setNote("");
    setIaLibrettoFile(null);
    setIaError(null);
    setIaOverwrite(false);

    setFotoPreview(null);
    setFotoDirty(false);
  };
  void resetForm;

  const loadMezzoInForm = (m: Mezzo) => {
    setEditingId(m.id);

    setCategoria(m.categoria || "");
    setAutistaId(m.autistaId || null);
    setAutistaNome(m.autistaNome || null);

    setTipoMezzo(m.tipo || "motrice");
    setTarga(m.targa || "");
    setMarca(m.marca || "");
    setModello(m.modello || "");
    setTelaio(m.telaio || "");
    setColore(m.colore || "");
    setCilindrata(m.cilindrata || "");
    setPotenza(m.potenza || "");
    setMassaComplessiva(m.massaComplessiva || "");
    setProprietario(m.proprietario || "");
    setAssicurazione(m.assicurazione || "");
    setDataImmatricolazione(m.dataImmatricolazione || "");
    setDataScadenzaRevisione(m.dataScadenzaRevisione || "");
    setDataUltimoCollaudo(m.dataUltimoCollaudo || "");
    setLastAutoProssimoCollaudo("");
    setManutenzioneProgrammata(!!m.manutenzioneProgrammata);
    setManutenzioneDataInizio(m.manutenzioneDataInizio || "");
    setManutenzioneDataFine(m.manutenzioneDataFine || "");
    setManutenzioneKmMax(m.manutenzioneKmMax || "");
    setManutenzioneContratto(m.manutenzioneContratto || "");
    setNote(m.note || "");
    setFotoPreview(m.fotoUrl || null);
    setFotoDirty(false);
  };

  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(location.search);
    const targetId = params.get("mezzoId");
    const targetTarga = params.get("targa");
    if (!targetId && !targetTarga) return;
    if (preselectRef.current) return;

    const match = targetId
      ? mezzi.find((m) => String(m.id) === targetId)
      : targetTarga
      ? mezzi.find(
          (m) => normalizeTarga(m.targa) === normalizeTarga(targetTarga)
        )
      : null;

    if (match) {
      loadMezzoInForm(match);
    }
    preselectRef.current = true;
  }, [loading, location.search, mezzi]);

const handleChangeAutista = (value: string) => {
  const found = colleghi.find((c) => c.id === value);
  if (!found) {
    setAutistaId(null);
    setAutistaNome(null);
  } else {
    const nomeCompleto = `${found.nome}${found.cognome ? " " + found.cognome : ""}`;
    setAutistaId(found.id);
    setAutistaNome(nomeCompleto);
  }
};


  const handleTipoMezzoChange = (value: "motrice" | "cisterna") => {
    setTipoMezzo(value);
    if (value === "cisterna") {
      setCilindrata("");
      setPotenza("");
    }
  };

  // ---------------------------------------------
  // FOTO
  // ---------------------------------------------

  const handleFotoChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    void e;
  };

  const handleIaLibrettoFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    void e;
    setIaLibrettoFile(null);
    setIaError(CLONE_READ_ONLY_ERROR);
  };

  const handleAnalyzeLibrettoWithIA = async () => {
    setIaError("Clone read-only: analisi libretto bloccata.");
  };

  /*
  // ---------------------------------------------
  // SALVATAGGIO MEZZO
  // ---------------------------------------------

  const handleSave = async () => {
    setError(CLONE_READ_ONLY_ERROR);
    return;

    try {
      setError(null);

      if (!targa.trim()) {
        setError("La targa è obbligatoria.");
        return;
      }
      if (!marca.trim()) {
        setError("La marca è obbligatoria.");
        return;
      }
      if (!modello.trim()) {
        setError("Il modello è obbligatorio.");
        return;
      }

      if (!dataImmatricolazione) {
        setError("La data di immatricolazione è obbligatoria.");
        return;
      }

      let finalFotoUrl: string | null | undefined = undefined;
      let finalFotoPath: string | null | undefined = undefined;

      if (fotoPreview && fotoDirty) {
        const fileName = `mezzi/${targa.replace(/\s+/g, "_")}_${Date.now()}.jpg`;
        const storageRef = ref(storage, fileName);
        const base64Data = extractBase64FromDataURL(fotoPreview);
        await uploadString(storageRef, base64Data, "base64", {
          contentType: "image/jpeg",
        });
        const downloadUrl = await getDownloadURL(storageRef);

        finalFotoUrl = downloadUrl;
        finalFotoPath = fileName;
      } else if (!fotoPreview) {
        finalFotoUrl = null;
        finalFotoPath = null;
      }

      const currentMezzi = [...mezzi];

      if (editingId) {
        const idx = currentMezzi.findIndex((m) => m.id === editingId);
        if (idx === -1) {
          setError("Impossibile trovare il mezzo da modificare.");
          return;
        }

        const old = currentMezzi[idx];

        currentMezzi[idx] = {
          ...old,
          categoria: categoria || "",
          autistaId,
          autistaNome,
          tipo: tipoMezzo,
          targa: targa.trim(),
          marca: marca.trim(),
          modello: modello.trim(),
          telaio: telaio.trim(),
          colore: colore.trim(),
          cilindrata: tipoMezzo === "motrice" ? cilindrata.trim() : "",
          potenza: tipoMezzo === "motrice" ? potenza.trim() : "",
          massaComplessiva: massaComplessiva.trim(),
          proprietario: proprietario.trim(),
          assicurazione: assicurazione.trim(),
          dataImmatricolazione,
          dataScadenzaRevisione,
          dataUltimoCollaudo,
          manutenzioneProgrammata,
          manutenzioneDataInizio: manutenzioneProgrammata
            ? manutenzioneDataInizio
            : "",
          manutenzioneDataFine: manutenzioneProgrammata
            ? manutenzioneDataFine
            : "",
          manutenzioneKmMax: manutenzioneProgrammata
            ? manutenzioneKmMax
            : "",
          manutenzioneContratto: manutenzioneProgrammata
            ? manutenzioneContratto
            : "",
          note: note.trim(),
          marcaModello: `${marca.trim()} ${modello.trim()}`,
          fotoUrl:
            finalFotoUrl !== undefined ? finalFotoUrl : old.fotoUrl || null,
          fotoPath:
            finalFotoPath !== undefined ? finalFotoPath : old.fotoPath || null,
        };
      } else {
        const newMezzo: Mezzo = {
          id: `${Date.now()}`,
          categoria: categoria || "",
          autistaId,
          autistaNome,
          tipo: tipoMezzo,
          targa: targa.trim(),
          marca: marca.trim(),
          modello: modello.trim(),
          telaio: telaio.trim(),
          colore: colore.trim(),
          cilindrata: tipoMezzo === "motrice" ? cilindrata.trim() : "",
          potenza: tipoMezzo === "motrice" ? potenza.trim() : "",
          massaComplessiva: massaComplessiva.trim(),
          proprietario: proprietario.trim(),
          assicurazione: assicurazione.trim(),
          dataImmatricolazione,
          dataScadenzaRevisione,
          dataUltimoCollaudo,
          manutenzioneProgrammata,
          manutenzioneDataInizio: manutenzioneProgrammata
            ? manutenzioneDataInizio
            : "",
          manutenzioneDataFine: manutenzioneProgrammata
            ? manutenzioneDataFine
            : "",
          manutenzioneKmMax: manutenzioneProgrammata
            ? manutenzioneKmMax
            : "",
          manutenzioneContratto: manutenzioneProgrammata
            ? manutenzioneContratto
            : "",
          note: note.trim(),
          marcaModello: `${marca.trim()} ${modello.trim()}`,
          fotoUrl: finalFotoUrl ?? null,
          fotoPath: finalFotoPath ?? null,
        };

        currentMezzi.push(newMezzo);
      }

      await setItemSync(MEZZI_KEY, currentMezzi);
      setMezzi(currentMezzi);

      resetForm();
    } catch (err) {
      console.error("Errore salvataggio mezzo:", err);
      setError("Errore durante il salvataggio del mezzo.");
    }
  };
  void handleSave;

  // ---------------------------------------------
  // ELIMINAZIONE MEZZO
  // ---------------------------------------------

  const handleDelete = async (id: string) => {
    void id;
    setError(CLONE_READ_ONLY_ERROR);
    return;

    if (!window.confirm("Sei sicuro di voler eliminare questo mezzo?")) {
      return;
    }

    try {
      const updated = mezzi.filter((m) => m.id !== id);
      await setItemSync(MEZZI_KEY, updated, {
        allowRemovals: true,
        removedIds: [id],
      });
      setMezzi(updated);

      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      console.error("Errore eliminazione mezzo:", err);
      setError("Errore durante l'eliminazione del mezzo.");
    }
  };
  void handleDelete;
  */

  const handleSave = async () => {
    setError(CLONE_READ_ONLY_ERROR);
  };
  void handleSave;

  const handleDelete = async (id: string) => {
    void id;
    setError(CLONE_READ_ONLY_ERROR);
  };
  void handleDelete;

  const highlightMissing = new URLSearchParams(location.search).get("highlightMissing") === "1";
  const highlightMissingActive = highlightMissing && Boolean(editingId);
  const missingTarga = highlightMissingActive && !targa.trim();
  const missingCategoria = highlightMissingActive && !categoria.trim();
  const missingAutista =
    highlightMissingActive && !String(autistaNome || "").trim();

  useEffect(() => {
    if (!highlightMissingActive) return;
    const target = missingTarga
      ? targaInputRef.current
      : missingCategoria
      ? categoriaSelectRef.current
      : missingAutista
      ? autistaSelectRef.current
      : null;
    if (!target) return;
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.focus();
    });
  }, [highlightMissingActive, missingTarga, missingCategoria, missingAutista]);

  // ---------------------------------------------
  // ---------------------------------------------
  // RENDER
  // ---------------------------------------------

  const CATEGORIE_ORDINATE: string[] = [
    "motrice 2 assi",
    "motrice 3 assi",
    "motrice 4 assi",
    "trattore stradale",
    "semirimorchio asse fisso",
    "semirimorchio asse sterzante",
    "porta silo container",
    "pianale",
    "biga",
    "centina",
    "vasca",
    "Senza categoria",
  ];

  const CATEGORIA_ALTRI = "ALTRI";
  const CATEGORIE_NOTE_SET = new Set(CATEGORIE_ORDINATE);
  const CATEGORIE_CANONICHE_MAP: Record<string, string> = CATEGORIE_ORDINATE.reduce(
    (acc, cat) => {
      const key = cat.trim().replace(/\s+/g, " ").toLowerCase();
      acc[key] = cat;
      return acc;
    },
    {} as Record<string, string>
  );

  const normalizeCategoria = (cat: string | undefined | null): string => {
    const normalized = normalizeNextMezzoCategoria(cat);
    return CATEGORIE_CANONICHE_MAP[normalized.toLowerCase()] ?? normalized;
  };

  const mezziPerCategoria: Record<string, Mezzo[]> = {};
  const mezziAltri: Mezzo[] = [];
  mezzi.forEach((m) => {
    const key = normalizeCategoria(m.categoria);
    if (CATEGORIE_NOTE_SET.has(key)) {
      if (!mezziPerCategoria[key]) {
        mezziPerCategoria[key] = [];
      }
      mezziPerCategoria[key].push(m);
      return;
    }
    mezziAltri.push(m);
  });

  const categorieNotePresenti = CATEGORIE_ORDINATE.filter(
    (cat) => mezziPerCategoria[cat] && mezziPerCategoria[cat].length > 0
  );
  const categoriePresenti = mezziAltri.length
    ? [...categorieNotePresenti, CATEGORIA_ALTRI]
    : categorieNotePresenti;
  const isPianaleExpanded = String(categoriaEspansa ?? "").trim().toLowerCase() === "pianale";
  const pianaleMirrorList = mezziPerCategoria["pianale"] || [];

  const debugMezziData = useMemo(() => {
    const normalizeTargaDebug = (value: unknown) =>
      String(value ?? "")
        .toUpperCase()
        .replace(/[\s-]+/g, "");

    const pianaleList = mezzi.filter((m) => {
      const raw = String(m?.categoria ?? "");
      return raw.trim().toLowerCase() === "pianale";
    });

    const idCount = new Map<string, number>();
    mezzi.forEach((m) => {
      const key = String(m?.id ?? "");
      if (!key) return;
      idCount.set(key, (idCount.get(key) || 0) + 1);
    });
    const dupId = Array.from(idCount.entries())
      .filter(([, count]) => count > 1)
      .map(([id, count]) => ({ id, count }));

    const targaCount = new Map<string, number>();
    mezzi.forEach((m) => {
      const key = normalizeTargaDebug(m?.targa);
      if (!key) return;
      targaCount.set(key, (targaCount.get(key) || 0) + 1);
    });
    const dupTarga = Array.from(targaCount.entries())
      .filter(([, count]) => count > 1)
      .map(([targaNorm, count]) => ({ targaNorm, count }));

    const pianaleRows = pianaleList.map((m) => {
      const missingFields = ["id", "targa", "marca", "modello", "categoria"].filter(
        (k) => (m as any)?.[k] == null
      );
      return {
        id: m?.id ?? null,
        targa: m?.targa ?? null,
        marca: m?.marca ?? null,
        modello: m?.modello ?? null,
        categoriaRaw: m?.categoria ?? null,
        hasNullish: missingFields.length > 0,
        missingFields,
      };
    });

    return {
      total: mezzi.length,
      pianaleCount: pianaleList.length,
      pianaleRows,
      dupId,
      dupTarga,
      activeUiState: {
        ricerca: null,
        categoriaEspansa: categoriaEspansa ?? null,
        loading,
        categorieRenderizzate: categoriePresenti,
        highlightMissing,
        highlightMissingActive,
      },
    };
  }, [
    categoriePresenti,
    categoriaEspansa,
    highlightMissing,
    highlightMissingActive,
    loading,
    mezzi,
  ]);

  useEffect(() => {
    if (!(debugEnvEnabled && debugMezziOpen && isPianaleExpanded)) return;
    pianaleMirrorList.forEach((m, index) => {
      const refKey = `${String(m?.id ?? "no-id")}::${String(m?.targa ?? "")}::${index}`;
      const el = pianaleCardRefs.current.get(refKey);
      if (!el) {
        console.warn(
          `[MEZZI][RECT] targa=${String(m?.targa ?? "")} missingRef=true key=${refKey}`
        );
        return;
      }
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      console.log(
        `[MEZZI][RECT] targa=${String(m?.targa ?? "")} rect=${JSON.stringify({
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        })} display=${style.display} visibility=${style.visibility} opacity=${style.opacity} zIndex=${style.zIndex}`
      );
    });
  }, [debugEnvEnabled, debugMezziOpen, isPianaleExpanded, pianaleMirrorList]);

  return (
    <div className="mezzi-page">
      <div className="page-container mezzi-page">
      {debugEnvEnabled && (
        <div
          style={{
            marginBottom: 12,
            border: "1px solid #d9d9d9",
            borderRadius: 10,
            padding: 12,
            background: "#fffdf5",
          }}
        >
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setDebugMezziOpen((prev) => !prev)}
          >
            DEBUG MEZZI {debugMezziOpen ? "ON" : "OFF"}
          </button>

          {debugMezziOpen && (
            <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.4 }}>
              <div>totale mezzi letti: {debugMezziData.total}</div>
              <div>totale pianale (trim+lowercase): {debugMezziData.pianaleCount}</div>
              <div>filtri UI attivi: {JSON.stringify(debugMezziData.activeUiState)}</div>

              {debugMezziData.dupId.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  dupId: {JSON.stringify(debugMezziData.dupId)}
                </div>
              )}
              {debugMezziData.dupTarga.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  dupTarga: {JSON.stringify(debugMezziData.dupTarga)}
                </div>
              )}

              <div style={{ marginTop: 8 }}>pianale list:</div>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                {JSON.stringify(debugMezziData.pianaleRows, null, 2)}
              </pre>

              {isPianaleExpanded && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
                    DEBUG MIRROR PIANALE
                  </div>
                  {pianaleMirrorList.map((m, index) => {
                    const refKey = `${String(m?.id ?? "no-id")}::${String(
                      m?.targa ?? ""
                    )}::${index}`;
                    const targaText = String(m?.targa ?? "");
                    return (
                      <div
                        key={`mirror-${refKey}`}
                        style={{
                          border: "3px solid red",
                          padding: 12,
                          marginBottom: 12,
                          background: "#fff",
                        }}
                      >
                        <div style={{ fontSize: 20, fontWeight: 900 }}>{targaText}</div>
                        <div>id={String(m?.id ?? "")}</div>
                        <div>marca={String(m?.marca ?? "")}</div>
                        <div>modello={String(m?.modello ?? "")}</div>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ marginTop: 8 }}
                          onClick={() => {
                            const target = pianaleCardRefs.current.get(refKey);
                            if (!target) {
                              console.warn(
                                `[MEZZI][SCROLL_TO] target-missing targa=${targaText} key=${refKey}`
                              );
                              return;
                            }
                            target.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                        >
                          SCROLL TO {targaText || "N/A"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div className="mezzi-grid">
        {/* FORM + INFO */}
        <div className="left-column">
          {/* CARD PRINCIPALE FORM MEZZO */}
          <div className="premium-card-430">
<div className="card-header">
  <img
    src="/logo.png"
    alt="Logo Ghielmi Cementi"
    className="logo-mezzi"
    onClick={() => navigate(NEXT_HOME_PATH)}
  />

  <div className="card-header-text">
    <h1 className="card-title">Gestione Mezzi</h1>
    <p className="card-subtitle">
      Gestione mezzi, libretto, revisione e dossier dedicato
    </p>
  </div>
</div>

            <div className="card-body">
              <fieldset disabled className="next-clone-fieldset">
              {error && <div className="alert alert-error">{error}</div>}

              {/* FOTO */}
              <div className="section-block foto-section">
                <div className="section-header">
                  <h2>Foto mezzo</h2>
                  <p>Scatta o carica una foto del mezzo.</p>
                </div>

                <div className="foto-row">
                  <div className="foto-preview-wrapper">
                    {fotoPreview ? (
                      <img
                        src={fotoPreview}
                        alt="Foto mezzo"
                        className="foto-preview"
                      />
                    ) : (
                      <div className="foto-placeholder">
                        Nessuna foto selezionata
                      </div>
                    )}
                  </div>
                  <div className="foto-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled
                      title={CLONE_READ_ONLY_TITLE}
                    >
                      Carica foto
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled
                      title={CLONE_READ_ONLY_TITLE}
                    >
                      Rimuovi foto
                    </button>
                  </div>
                </div>

                <input
                  ref={fotoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  disabled
                  onChange={handleFotoChange}
                />
              </div>

              <div className="section-block">
                <div className="section-header">
                  <h2>LIBRETTO (IA)</h2>
                  <p>
                    Carica una foto del libretto e compila il form automaticamente.
                  </p>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Immagine libretto</label>
                    <input
                      type="file"
                      accept="image/*"
                      disabled
                      onChange={handleIaLibrettoFileChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={iaOverwrite}
                        disabled
                        onChange={(e) => setIaOverwrite(e.target.checked)}
                      />
                      Sovrascrivi campi già compilati
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAnalyzeLibrettoWithIA}
                    disabled
                    title="Clone read-only: analisi IA bloccata"
                  >
                    Analizza Libretto con IA
                  </button>
                </div>

                {iaError && <div className="alert alert-error">{iaError}</div>}
              </div>

              {/* FORM */}
              <div className="section-block form-section">
                <h2>Dati generali</h2>

                {/* CATEGORIA + TIPO + AUTISTA */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Categoria mezzo</label>
                    <select
                      ref={categoriaSelectRef}
                      className={missingCategoria ? "field-missing" : ""}
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                    >
                      <option value="">Seleziona categoria</option>
                      <option value="motrice 2 assi">Motrice 2 assi</option>
                      <option value="motrice 3 assi">Motrice 3 assi</option>
                      <option value="motrice 4 assi">Motrice 4 assi</option>
                      <option value="trattore stradale">
                        Trattore stradale
                      </option>
                      <option value="semirimorchio asse fisso">
                        Semirimorchio asse fisso
                      </option>
                      <option value="semirimorchio asse sterzante">
                        Semirimorchio asse sterzante
                      </option>
                      <option value="porta silo container">
                        Porta silo container
                      </option>
                      <option value="pianale">Pianale</option>
                      <option value="biga">Biga</option>
                      <option value="centina">Centina</option>
                      <option value="vasca">Vasca</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tipo</label>
                    <select
                      value={tipoMezzo}
                      onChange={(e) =>
                        handleTipoMezzoChange(
                          e.target.value as "motrice" | "cisterna"
                        )
                      }
                    >
                      <option value="motrice">Motrice</option>
                      <option value="cisterna">Cisterna / Rimorchio</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Autista</label>
                    <select
                      ref={autistaSelectRef}
                      className={missingAutista ? "field-missing" : ""}
                      value={autistaId || ""}
                      onChange={(e) => handleChangeAutista(e.target.value)}
                    >
                      <option value="">Nessun autista</option>
                      {colleghi.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                          {c.cognome ? ` ${c.cognome}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* TARGA + MARCA + MODELLO */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Targa</label>
                    <input
                      type="text"
                      ref={targaInputRef}
                      className={missingTarga ? "field-missing" : ""}
                      value={targa}
                      onChange={(e) => setTarga(e.target.value.toUpperCase())}
                      placeholder="Es. TI 315407"
                    />
                  </div>
                  <div className="form-group">
                    <label>Marca</label>
                    <input
                      type="text"
                      value={marca}
                      onChange={(e) => setMarca(e.target.value)}
                      placeholder="Es. RENAULT"
                    />
                  </div>
                  <div className="form-group">
                    <label>Modello</label>
                    <input
                      type="text"
                      value={modello}
                      onChange={(e) => setModello(e.target.value)}
                      placeholder="Es. C 430"
                    />
                  </div>
                </div>

                {/* TELAIO + COLORE */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Telaio / VIN</label>
                    <input
                      type="text"
                      value={telaio}
                      onChange={(e) => setTelaio(e.target.value)}
                      placeholder="Es. VF6..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Colore</label>
                    <input
                      type="text"
                      value={colore}
                      onChange={(e) => setColore(e.target.value)}
                      placeholder="Es. Bianco"
                    />
                  </div>
                </div>

                {/* CILINDRATA + POTENZA + MASSA */}
                <div className="form-row">
                  {tipoMezzo === "motrice" && (
                    <>
                      <div className="form-group">
                        <label>Cilindrata (cm³)</label>
                        <input
                          type="text"
                          value={cilindrata}
                          onChange={(e) => setCilindrata(e.target.value)}
                          placeholder="Es. 10837"
                        />
                      </div>
                      <div className="form-group">
                        <label>Potenza (kW)</label>
                        <input
                          type="text"
                          value={potenza}
                          onChange={(e) => setPotenza(e.target.value)}
                          placeholder="Es. 323.0"
                        />
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label>Massa complessiva (kg)</label>
                    <input
                      type="text"
                      value={massaComplessiva}
                      onChange={(e) => setMassaComplessiva(e.target.value)}
                      placeholder="Es. 40000"
                    />
                  </div>
                </div>

                {/* PROPRIETARIO + ASSICURAZIONE */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Proprietario</label>
                    <input
                      type="text"
                      value={proprietario}
                      onChange={(e) => setProprietario(e.target.value)}
                      placeholder="Es. GhielmiCementi SA"
                    />
                  </div>
                  <div className="form-group">
                    <label>Assicurazione</label>
                    <input
                      type="text"
                      value={assicurazione}
                      onChange={(e) => setAssicurazione(e.target.value)}
                      placeholder="Es. Zurigo Assicurazioni SA"
                    />
                  </div>
                </div>

                {/* DATE */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Data immatricolazione</label>
                    <input
                      type="date"
                      value={dataImmatricolazione}
                      onChange={(e) => setDataImmatricolazione(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Data ultimo collaudo</label>
                    <input
                      type="date"
                      value={dataUltimoCollaudo}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        setDataUltimoCollaudo(newVal);
                        if (newVal) {
                          const parsed = parseDateFlexible(newVal);
                          if (!parsed) return;

                          const nextDate = new Date(parsed);
                          nextDate.setHours(12, 0, 0, 0);
                          nextDate.setFullYear(nextDate.getFullYear() + 1);
                          const nextAuto = formatDateForInput(nextDate);

                          const currentScadenza = String(
                            dataScadenzaRevisione || ""
                          ).trim();
                          const lastAuto = String(
                            lastAutoProssimoCollaudo || ""
                          ).trim();

                          if (!currentScadenza || currentScadenza === lastAuto) {
                            setDataScadenzaRevisione(nextAuto);
                            setLastAutoProssimoCollaudo(nextAuto);
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label>Prossimo collaudo</label>
                    <input
                      type="date"
                      value={dataScadenzaRevisione}
                      onChange={(e) =>
                        setDataScadenzaRevisione(e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* MANUTENZIONE PROGRAMMATA */}
                <div className="section-block maint-section">
                  <div className="maint-header">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={manutenzioneProgrammata}
                        onChange={(e) =>
                          setManutenzioneProgrammata(e.target.checked)
                        }
                      />
                      Manutenzione programmata
                    </label>
                    <p className="small-info-text">
                      Se attivo, consente di impostare un intervallo di
                      manutenzione programmata per il mezzo.
                    </p>
                  </div>

                  {manutenzioneProgrammata && (
                    <div className="maint-grid">
                      <div className="form-group">
                        <label>Data inizio contratto</label>
                        <input
                          type="date"
                          value={manutenzioneDataInizio}
                          onChange={(e) =>
                            setManutenzioneDataInizio(e.target.value)
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>Data prossima scadenza</label>
                        <input
                          type="date"
                          value={manutenzioneDataFine}
                          onChange={(e) =>
                            setManutenzioneDataFine(e.target.value)
                          }
                        />
                      </div>
                      <div className="form-group">
                        <label>Km massimi</label>
                        <input
                          type="text"
                          value={manutenzioneKmMax}
                          onChange={(e) =>
                            setManutenzioneKmMax(e.target.value)
                          }
                          placeholder="Es. 120000"
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Contratto / Note manutenzione</label>
                        <textarea
                          value={manutenzioneContratto}
                          onChange={(e) =>
                            setManutenzioneContratto(e.target.value)
                          }
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* NOTE */}
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Note generali</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder="Note aggiuntive, vincoli particolari, ecc."
                    />
                  </div>
                </div>

                {/* BOTTONI SALVATAGGIO */}
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled
                    title="Clone read-only"
                  >
                    Reset form
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled
                    title="Clone read-only"
                  >
                    {editingId ? "Salva modifiche" : "Salva mezzo"}
                  </button>
                </div>
              </div>
              </fieldset>
            </div>
          </div>
        </div>

        {/* LISTA MEZZI */}
        <div className="premium-card-430 mezzi-list-card">
          <div className="card-header">
            <h2 className="card-title">Elenco mezzi</h2>
            <p className="card-subtitle">
              Seleziona un mezzo per modificare o aprire il dossier.
            </p>
          </div>

          <div className="card-body">
            {loading && <p>Caricamento mezzi…</p>}

            {!loading && mezzi.length === 0 && (
              <p className="empty-text">
                Nessun mezzo registrato. Inserisci il primo mezzo tramite il
                form a sinistra.
              </p>
            )}

            {!loading && mezzi.length > 0 && (
              <div className="mezzi-categorie-wrapper">
                {categoriePresenti.map((cat) => {
                  const lista =
                    cat === CATEGORIA_ALTRI
                      ? mezziAltri
                      : mezziPerCategoria[cat] || [];
                  const aperta = categoriaEspansa === cat;
                  const isDebugPianale =
                    debugEnvEnabled &&
                    debugMezziOpen &&
                    cat.trim().toLowerCase() === "pianale";
                  const toRender = isDebugPianale ? [...lista] : [];
                  const debugTarghe = isDebugPianale
                    ? toRender.map((m) => String(m?.targa ?? ""))
                    : [];

                  return (
                    <div key={cat} className="categoria-mezzo-block">
                      <div
                        className="mezzo-list-item categoria-header"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setCategoriaEspansa((prev) =>
                            prev === cat ? null : cat
                          )
                        }
                      >
                        <div className="mezzo-list-main">
                          <div className="mezzo-list-header">
                            <span className="mezzo-marca-modello strong">
                              {aperta ? "▾ " : "▸ "}
                              {cat.toUpperCase()}
                            </span>
                          </div>
                          <div className="mezzo-list-meta">
                            <span className="mezzo-targa">
                              {lista.length} mezzi
                            </span>
                          </div>
                        </div>
                      </div>

                      {aperta && (
                        <div style={{ marginTop: 14, marginBottom: 16 }}>
                          {isDebugPianale && (
                            <div
                              style={{
                                marginBottom: 10,
                                padding: 8,
                                border: "1px solid #f59e0b",
                                background: "#fffbeb",
                                fontWeight: 700,
                              }}
                            >
                              PIANALE renderCount={toRender.length} targhe=
                              {debugTarghe.join(", ")}
                            </div>
                          )}
                          <div className="mezzi-list">
                            {lista.map((m, index) => {
                              const scadenzaPrimaria =
                                m.dataScadenzaRevisioneTimestamp !== null
                                  ? new Date(m.dataScadenzaRevisioneTimestamp)
                                  : null;
                              const immDate =
                                m.dataImmatricolazioneTimestamp !== null
                                  ? new Date(m.dataImmatricolazioneTimestamp)
                                  : null;
                              const collaudoDate =
                                m.dataUltimoCollaudoTimestamp !== null
                                  ? new Date(m.dataUltimoCollaudoTimestamp)
                                  : null;
                              const computed = calculaProssimaRevisione(
                                immDate,
                                collaudoDate
                              );
                              const scadenzaDate = scadenzaPrimaria ?? computed;
                              const revDisplay = formatDateForDisplay(scadenzaDate);

                              const progDate =
                                m.manutenzioneProgrammata &&
                                m.manutenzioneDataFineTimestamp !== null
                                  ? new Date(m.manutenzioneDataFineTimestamp)
                                  : null;
                              const progDisplay = m.manutenzioneProgrammata
                                ? formatDateForDisplay(progDate)
                                : null;

                              const giorniRev = giorniDaOggi(scadenzaDate);
                              let classeRev = "";
                              if (giorniRev !== null && giorniRev <= 30) {
                                classeRev = "deadline-danger";
                              }

                              let classeProg = "";
                              if (progDate) {
                                const giorniProg = giorniDaOggi(progDate);

                                if (giorniProg !== null && giorniProg <= 5)
                                  classeProg = "deadline-high";
                                else if (giorniProg !== null && giorniProg <= 15)
                                  classeProg = "deadline-medium";
                                else if (giorniProg !== null && giorniProg <= 30)
                                  classeProg = "deadline-low";
                              }
                              const debugMarcaRaw = (m as any)?.marca;
                              const debugModelloRaw = (m as any)?.modello;
                              const debugTargaRaw = (m as any)?.targa;
                              const debugMissing = ["marca", "modello", "targa"].filter(
                                (field) =>
                                  !String((m as any)?.[field] ?? "")
                                    .trim()
                              );
                              if (debugEnvEnabled && debugMissing.length > 0) {
                                const logKey = `${String(m?.id ?? "no-id")}::${debugMissing.join(",")}`;
                                if (!missingCardLogRef.current.has(logKey)) {
                                  missingCardLogRef.current.add(logKey);
                                  console.warn(
                                    `[MEZZI][CARD_DATA_MISSING] id=${String(
                                      m?.id ?? ""
                                    )} targa=${String(m?.targa ?? "")} missing=${debugMissing.join("/")}`
                                  );
                                }
                              }
                              if (isDebugPianale) {
                                console.log(
                                  `[MEZZI][RENDER_CARD] cat=pianale id=${String(
                                    m?.id ?? ""
                                  )} targa=${String(m?.targa ?? "")}`
                                );
                              }
                              const pianaleRefKey = `${String(m?.id ?? "no-id")}::${String(
                                m?.targa ?? ""
                              )}::${index}`;
return (
  <div
    key={m.id}
    className="mezzo-card"
    style={isDebugPianale ? { outline: "3px solid red" } : undefined}
    ref={
      isDebugPianale
        ? (el) => {
            pianaleCardRefs.current.set(pianaleRefKey, el);
          }
        : undefined
    }
  >
    {isDebugPianale && (
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: "#b91c1c",
          marginBottom: 6,
        }}
      >
        DEBUG CARD {String(m?.targa ?? "")}
      </div>
    )}

    {/* MINIATURA + INFO */}
    <div className="mezzo-card-row">

      {/* Miniatura solo se esiste la foto */}
      {m.fotoUrl && (
        <div className="mezzo-thumb">
          <img src={m.fotoUrl} alt={m.targa} />
        </div>
      )}

      {/* Informazioni testuali */}
      <div className="mezzo-info">
        <div className="mezzo-info-title">
          {debugEnvEnabled
            ? String(debugMarcaRaw ?? "").toUpperCase()
            : m.marca.toUpperCase()}{" "}
          {debugEnvEnabled
            ? String(debugModelloRaw ?? "").toUpperCase()
            : m.modello.toUpperCase()}
        </div>

        <div className="mezzo-info-line">
          Targa:{" "}
          {debugEnvEnabled
            ? String(debugTargaRaw ?? "").toUpperCase()
            : m.targa.toUpperCase()}
        </div>

        <div className="mezzo-info-line">
          Categoria: {normalizeCategoria(m.categoria)}
        </div>

        <div className={`mezzo-info-line ${classeRev}`}>
          Revisione: {revDisplay}
        </div>

        {progDisplay && (
          <div className={`mezzo-info-line ${classeProg}`}>
            Manutenzione: {progDisplay}
          </div>
        )}
      </div>
    </div>

    {/* Bottoni della card */}
    <div className="mezzo-card-actions">
      <button
        type="button"
        className="btn btn-small btn-outline"
        onClick={() => loadMezzoInForm(m)}
      >
        Modifica
      </button>

      <button
        type="button"
        className="btn btn-small btn-primary"
        onClick={() => navigate(buildNextDossierPath(m.targa))}
      >
        Dossier Mezzo
      </button>

      <button
        type="button"
        className="btn btn-small btn-danger"
        disabled
        title="Clone read-only"
      >
        Elimina
      </button>
    </div>
  </div>
);
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Mezzi;

// ==========  FINE FILE COMPLETO PULITO  ==========
