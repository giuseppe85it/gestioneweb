// src/pages/Manutenzioni.tsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { generateSmartPDF } from "../utils/pdfEngine";
import "./Manutenzioni.css";
import ModalGomme from "./ModalGomme";
import type { CambioGommeData } from "./ModalGomme";



type TipoVoce = "mezzo" | "compressore";
type SottoTipo = "motrice" | "trattore";

interface MaterialeManutenzione {
  id: string;
  label: string;
  quantita: number;
  unita: string;
  fromInventario?: boolean;
  refId?: string;
}

interface VoceManutenzione {
  id: string;
  targa: string;
  km?: number | null;
  ore?: number | null;
  sottotipo?: SottoTipo | null;
  descrizione: string;
  eseguito?: string | null;
  data: string; // "gg mm aaaa"
  tipo: TipoVoce;
  fornitore?: string;
  materiali?: MaterialeManutenzione[];
  }

interface MezzoBasic {
  id: string;
  targa: string;
  label: string;
  categoria?: string;
}

interface MaterialeInventario {
  id: string;
  label: string;
  quantitaTotale: number;
  unita: string;
  fornitoreLabel?: string;
}

const KEY_MANUTENZIONI = "@manutenzioni";
const KEY_MEZZI = "@mezzi_aziendali";
const KEY_INVENTARIO = "@inventario";
const KEY_MOVIMENTI = "@materialiconsegnati";

// Data in formato ufficiale: "gg mm aaaa"
const oggi = () => {
  const n = new Date();
  const gg = String(n.getDate()).padStart(2, "0");
  const mm = String(n.getMonth() + 1).padStart(2, "0");
  const yy = n.getFullYear();
  return `${gg} ${mm} ${yy}`;
};

// Converte "gg mm aaaa" in numero per ordinamento
const dataToNumber = (d: string) => {
  if (!d) return 0;
  const [gg, mm, yy] = d.split(" ");
  const yyyy = Number(yy);
  const month = Number(mm);
  const day = Number(gg);
  if (!yyyy || !month || !day) return 0;

  const num = Date.parse(`${yyyy}-${mm}-${gg}T00:00:00`);
  return Number.isNaN(num) ? 0 : num;
};

const Manutenzioni: React.FC = () => {
  const navigate = useNavigate();
  const handleApriDossier = (targa: string) => {
  const targaPulita = (targa || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!targaPulita) {
    alert("Seleziona una targa valida.");
    return;
  }
  navigate(`/dossiermezzi/${targaPulita}`);
};


  const [loading, setLoading] = useState(true);

  // Dati principali
  const [storico, setStorico] = useState<VoceManutenzione[]>([]);
  const [mezzi, setMezzi] = useState<MezzoBasic[]>([]);
  const [materialiInventario, setMaterialiInventario] = useState<MaterialeInventario[]>([]);

  // Filtri lista
  const [filtroTarga, setFiltroTarga] = useState<string>("");
  const [filtroTipo, setFiltroTipo] = useState<"tutti" | TipoVoce>("tutti");

  // Form manutenzione
  const [targa, setTarga] = useState("");
  const [tipo, setTipo] = useState<TipoVoce>("mezzo");
  const [km, setKm] = useState("");
  const [ore, setOre] = useState("");
  const [sottotipo, setSottotipo] = useState<SottoTipo>("motrice");
  const [descrizione, setDescrizione] = useState("");
  const [eseguito, setEseguito] = useState("");
  const [data, setData] = useState(oggi());

  // Gestione materiali usati nella manutenzione
  const [materialeSearch, setMaterialeSearch] = useState("");
  const [materialiTemp, setMaterialiTemp] = useState<MaterialeManutenzione[]>([]);
  const [quantitaTemp, setQuantitaTemp] = useState("");
const [isEditing, setIsEditing] = useState(false);
const [fornitore,] = useState("");

  // Modale gomme
  const [modalGommeOpen, setModalGommeOpen] = useState(false);

  // Carica storico + mezzi + inventario
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [storicoRaw, mezziRaw, inventarioRaw] = await Promise.all([
          getItemSync(KEY_MANUTENZIONI),
          getItemSync(KEY_MEZZI),
          getItemSync(KEY_INVENTARIO),
        ]);

        // Manutenzioni
        const storicoArr: VoceManutenzione[] = Array.isArray(storicoRaw)
          ? (storicoRaw as VoceManutenzione[])
          : storicoRaw?.value && Array.isArray(storicoRaw.value)
          ? (storicoRaw.value as VoceManutenzione[])
          : [];

        // Mezzi
        const mezziArr: any[] = Array.isArray(mezziRaw)
          ? (mezziRaw as any[])
          : mezziRaw?.value && Array.isArray(mezziRaw.value)
          ? (mezziRaw.value as any[])
          : [];

        const mappedMezzi: MezzoBasic[] = mezziArr
          .map((m) => {
            const tg = (m.targa || "").toUpperCase().trim();
            if (!tg) return null;
            const labelBase =
              m.marcaModello ||
              `${m.marca || ""} ${m.modello || ""}`.trim() ||
              tg;
            return {
              id: m.id || tg,
              targa: tg,
              label: `${tg} – ${labelBase}`,
              categoria: m.categoria || m.tipologia || "",
            };
          })
          .filter(Boolean) as MezzoBasic[];

        // Inventario
        const inventarioArr: any[] = Array.isArray(inventarioRaw)
          ? (inventarioRaw as any[])
          : inventarioRaw?.value && Array.isArray(inventarioRaw.value)
          ? (inventarioRaw.value as any[])
          : [];

        const mappedInv: MaterialeInventario[] = inventarioArr
          .map((m) => {
            const label =
              m.label ||
              m.descrizione ||
              m.nome ||
              "";
            if (!label) return null;
            return {
              id: m.id || label,
              label,
              quantitaTotale: Number(m.quantitaTotale || m.quantita || 0),
              unita: m.unita || "pz",
              fornitoreLabel: m.fornitoreLabel || m.fornitore || "",
            };
          })
          .filter(Boolean) as MaterialeInventario[];

        // Ordino lo storico per data (più recente in alto)
        const ordinato = [...storicoArr].sort((a, b) => {
          const na = dataToNumber(a.data);
          const nb = dataToNumber(b.data);
          return nb - na;
        });

        setStorico(ordinato);
        setMezzi(mappedMezzi);
        setMaterialiInventario(mappedInv);
      } catch (err) {
        console.error("Errore caricamento manutenzioni/mezzi/inventario:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  // Normalizzazione per Firestore: niente undefined
  const persistStorico = async (items: VoceManutenzione[]) => {
    setStorico(items);

    const sanitized = items.map((v) => ({
      ...v,
      km: v.km ?? null,
      ore: v.ore ?? null,
      sottotipo: v.sottotipo ?? null,
      eseguito: v.eseguito ?? null,
    }));

    try {
      await setItemSync(KEY_MANUTENZIONI, sanitized);
    } catch (err) {
      console.error("Errore salvataggio manutenzioni:", err);
    }
  };

  const resetForm = () => {
    // mantengo la targa selezionata per inserire più voci sullo stesso mezzo
    const currentTarga = targa;
    setTipo("mezzo");
    setKm("");
    setOre("");
    setSottotipo("motrice");
    setDescrizione("");
    setEseguito("");
    setData(oggi());
    setMaterialiTemp([]);
    setTarga(currentTarga);
  };

  const handleEdit = (item: VoceManutenzione) => {
  setIsEditing(true);
  // Carica la voce nello stato del form
    setTarga(item.targa);
    setTipo(item.tipo);
    setKm(item.km != null ? String(item.km) : "");
    setOre(item.ore != null ? String(item.ore) : "");
    setSottotipo(item.sottotipo || "motrice");
    setDescrizione(item.descrizione);
    setEseguito(item.eseguito || "");
    setData(item.data);
    // Materiali
    setMaterialiTemp(item.materiali || []);

    // Rimuove la vecchia voce per riscriverla aggiornata
    setStorico((prev) => prev.filter((v) => v.id !== item.id));
  };

  const handleSelectTargaMezzo = (value: string) => {
    setTarga(value);
    if (!filtroTarga) {
      setFiltroTarga(value);
    }
  };

  const handleAddMateriale = (
    label: string,
    quantita: number,
    unita: string,
    fromInventario: boolean,
    refId?: string
  ) => {
    if (!label || !quantita) {
      alert("Inserisci almeno nome materiale e quantità.");
      return;
    }

const normalizedLabel = label.trim().toUpperCase();

const nuovo: MaterialeManutenzione = {
  id: Date.now().toString(),
  label: normalizedLabel,
  quantita,
  unita,
  fromInventario,
  refId,
};

    setMaterialiTemp((prev) => [...prev, nuovo]);
    setMaterialeSearch("");
    setQuantitaTemp("");
  };

  const handleRemoveMateriale = (id: string) => {
    setMaterialiTemp((prev) => prev.filter((m) => m.id !== id));
  };

  const integraDescrizioneConGomme = (data: CambioGommeData) => {
    const header = `CAMBIO GOMME – ${data.modalita === "ordinario" ? "ordinario" : "straordinario"}`;
    const asseLine = data.asseLabel ? `Asse: ${data.asseLabel}` : "";
    const gommeLine = `Gomme cambiate: ${data.numeroGomme}`;
    const marcaLine = data.marca ? `Marca: ${data.marca}` : "";
    const kmLine = data.km ? `Km mezzo: ${data.km}` : "";
    const categoriaLine = data.categoria ? `Categoria mezzo: ${data.categoria}` : "";

    const blocco = [header, categoriaLine, asseLine, gommeLine, marcaLine, kmLine]
      .filter(Boolean)
      .join("\n");

    setDescrizione((prev) => (prev ? `${prev}\n\n${blocco}` : blocco));
  };

  const handleGommeConfirm = (data: CambioGommeData) => {
    integraDescrizioneConGomme(data);
    setModalGommeOpen(false);
  };

  const handleAdd = async () => {
    const t = targa.trim().toUpperCase();
    const desc = descrizione.trim();
    const d = data.trim();

    if (!t || !desc || !d) {
      alert("Compila almeno TARGA, DESCRIZIONE e DATA.");
      return;
    }

    if (tipo === "mezzo" && !km) {
      const conferma = window.confirm(
        "Non hai inserito i KM. Vuoi continuare lo stesso?"
      );
      if (!conferma) return;
    }

    if (tipo === "compressore" && !ore) {
      const conferma = window.confirm(
        "Non hai inserito le ORE. Vuoi continuare lo stesso?"
      );
      if (!conferma) return;
    }

    const nuovaVoce: VoceManutenzione = {
      id: Date.now().toString(),
      targa: t,
      tipo,
     fornitore,
      km: km ? Number(km) : null,
      ore: ore ? Number(ore) : null,
      sottotipo: tipo === "compressore" ? sottotipo : null,
      descrizione: desc,
      eseguito: eseguito || null,
      data: d,
      materiali: materialiTemp.length ? [...materialiTemp] : [],
    };

    const nuovoStorico = [nuovaVoce, ...storico];

    try {
      await persistStorico(nuovoStorico);

     // Aggiornamento inventario e movimenti OUT (SOLO NUOVA MANUTENZIONE)
if (!isEditing) {
      try {
        const inventarioRaw = await getItemSync(KEY_INVENTARIO);
        const inventarioArr: any[] = Array.isArray(inventarioRaw)
          ? (inventarioRaw as any[])
          : inventarioRaw?.value && Array.isArray(inventarioRaw.value)
          ? (inventarioRaw.value as any[])
          : [];

        const movRaw = await getItemSync(KEY_MOVIMENTI);
        const movArr: any[] = Array.isArray(movRaw)
          ? (movRaw as any[])
          : movRaw?.value && Array.isArray(movRaw.value)
          ? (movRaw.value as any[])
          : [];

        const consRaw = await getItemSync("@materialiconsegnati");
        const consArr: any[] = Array.isArray(consRaw)
          ? (consRaw as any[])
          : consRaw?.value && Array.isArray(consRaw.value)
          ? (consRaw.value as any[])
          : [];

        let inventarioAggiornato = [...inventarioArr];
        const nuoveMovimentazioni = [...movArr];
        const nuoveConsegne = [...consArr];

        for (const mat of materialiTemp) {
          if (!mat.fromInventario || !mat.refId) continue;
          const idx = inventarioAggiornato.findIndex((x) => x.id === mat.refId);
          if (idx === -1) continue;

          const corrente = inventarioAggiornato[idx];
          const quantitaAttuale = Number(
            corrente.quantitaTotale || corrente.quantita || 0
          );
          const nuovaQta = Math.max(0, quantitaAttuale - mat.quantita);

          inventarioAggiornato[idx] = {
            ...corrente,
            quantitaTotale: nuovaQta,
            quantita: nuovaQta,
          };

          nuoveMovimentazioni.push({
            id: Date.now().toString() + "_" + mat.id,
            tipo: "OUT",
            data: d,
            materialeId: mat.refId,
            materialeLabel: mat.label,
            quantita: mat.quantita,
            unita: mat.unita,
            origine: "MANUTENZIONE",
            targa: t,
          });

          // PATCH: consegna ufficiale per il dossier
          nuoveConsegne.push({
            id: Date.now().toString() + "_CONS_" + mat.id,
            descrizione: mat.label,
            quantita: mat.quantita,
            unita: mat.unita,
           fornitore: corrente.fornitore ?? "",

            destinatario: {
              type: "MEZZO",
              refId: t,
              label: t,
            },
            motivo: "UTILIZZO MANUTENZIONE",
            data: d,
          });
        }

        await setItemSync(KEY_INVENTARIO, inventarioAggiornato);
        await setItemSync(KEY_MOVIMENTI, nuoveMovimentazioni);
        await setItemSync("@materialiconsegnati", nuoveConsegne);
      } catch (errMov) {
        console.error(
          "Errore aggiornamento inventario / movimenti da manutenzioni:",
          errMov
        );
      }
}
setIsEditing(false);

      resetForm();
      alert("Manutenzione salvata correttamente.");
    } catch (err) {
      console.error("Errore salvataggio manutenzione:", err);
      alert("Errore durante il salvataggio. Riprova.");
    }
  };

  const handleDelete = async (id: string) => {
    const conferma = window.confirm(
      "Sei sicuro di voler eliminare questa manutenzione?"
    );
    if (!conferma) return;

    const voce = storico.find((v) => v.id === id);
    if (!voce) return;

    // PATCH: ripristino inventario (se i materiali provengono dall'inventario)
    try {
      const invRaw = await getItemSync(KEY_INVENTARIO);
      let inventario: any[] = Array.isArray(invRaw) ? invRaw : invRaw?.value || [];

      if (voce.materiali && Array.isArray(voce.materiali)) {
        voce.materiali.forEach((m: any) => {
          if (!m?.fromInventario || !m?.refId) return;

          const idx = inventario.findIndex((x: any) => x.id === m.refId);
          if (idx === -1) return;

          const corrente = inventario[idx];
          const attuale = Number(corrente.quantitaTotale || corrente.quantita || 0);
          const nuovaQta = attuale + Number(m.quantita || 0);

          inventario[idx] = {
            ...corrente,
            quantitaTotale: nuovaQta,
            quantita: nuovaQta,
          };
        });
      }

      await setItemSync(KEY_INVENTARIO, inventario);
    } catch (err) {
      console.error("Errore ripristino inventario:", err);
    }

    // PATCH: rimuovo consegne create dalla manutenzione
    try {
      const consRaw = await getItemSync("@materialiconsegnati");
      let consegne: any[] = Array.isArray(consRaw) ? consRaw : consRaw?.value || [];

      if (voce.materiali && Array.isArray(voce.materiali)) {
        voce.materiali.forEach((m: any) => {
          consegne = consegne.filter(
            (c: any) =>
              !(
                c?.motivo === "UTILIZZO MANUTENZIONE" &&
                c?.destinatario?.refId === voce.targa &&
                c?.descrizione === m?.label &&
                c?.quantita === m?.quantita &&
                c?.unita === m?.unita
              )
          );
        });
      }

      await setItemSync("@materialiconsegnati", consegne);
    } catch (err) {
      console.error("Errore rimozione consegne manutenzione:", err);
    }

    const nuovoStorico = storico.filter((v) => v.id !== id);

    try {
      await persistStorico(nuovoStorico);
      setStorico(nuovoStorico);
      alert("Manutenzione eliminata.");
    } catch (err) {
      console.error("Errore eliminazione manutenzione:", err);
      alert("Errore durante l'eliminazione. Riprova.");
    }
  };

  const mezzoSelezionato = useMemo(
    () => mezzi.find((m) => m.targa === targa) || null,
    [mezzi, targa]
  );

  const storicoFiltrato = useMemo(() => {
    return storico.filter((v) => {
      const matchTarga = filtroTarga
        ? v.targa.toUpperCase().includes(filtroTarga.toUpperCase().trim())
        : true;

      const matchTipo =
        filtroTipo === "tutti" ? true : v.tipo === filtroTipo;

      return matchTarga && matchTipo;
    });
  }, [storico, filtroTarga, filtroTipo]);

  const materialiSugg = useMemo(() => {
    if (!materialeSearch) return [];
    const query = materialeSearch.trim().toUpperCase();
    if (!query) return [];

    return materialiInventario
      .filter((m) =>
        m.label.toUpperCase().includes(query) ||
        (m.fornitoreLabel || "")
          .toUpperCase()
          .includes(query)
      )
      .slice(0, 5);
  }, [materialeSearch, materialiInventario]);

  return (
    <div className="man-page">
      <div className="man-layout">
        {/* CARD SINISTRA – INSERIMENTO */}
        <div className="man-card man-card-form">
          <div className="man-card-header">
            <div className="man-logo-title">
              <img
                src="/logo.png"
                alt="logo"
                className="man-logo"
                onClick={() => navigate("/")}
              />
              <div>
                <h1 className="man-title">Manutenzioni</h1>
                <p className="man-subtitle">
                  Inserimento interventi su mezzi e compressori
                </p>
              </div>
            </div>

<button
  disabled={!targa}
  onClick={() => handleApriDossier(targa)}
>
  Apri dossier mezzo
</button>
</div>

          <div className="man-card-body">
            {/* SEZIONE 1 – SELEZIONE MEZZO */}
            <div className="man-section">
              <div className="man-section-title">Mezzo / Compressore</div>

              <label className="man-label-block">
                <span className="man-label-text">Targa / Codice</span>
                <div className="man-row">
                  <select
                    className="man-input man-select-mezzo"
                    value={targa}
                    onChange={(e) => handleSelectTargaMezzo(e.target.value)}
                  >
                    <option value="">— Seleziona mezzo dall'elenco —</option>
                    {mezzi.map((m) => (
                      <option key={m.id} value={m.targa}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <span className="man-or">oppure</span>
                  <input
                    className="man-input man-input-targa"
                    value={targa}
                    onChange={(e) => setTarga(e.target.value.toUpperCase())}
                    placeholder="Es. TI315407"
                  />
                </div>
              </label>

              <div className="man-row">
                <label className="man-label-inline">
                  <span className="man-label-text">Tipo</span>
                  <select
                    className="man-input"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoVoce)}
                  >
                    <option value="mezzo">Mezzo</option>
                    <option value="compressore">Compressore</option>
                  </select>
                </label>

                {tipo === "mezzo" && (
                  <label className="man-label-inline">
                    <span className="man-label-text">Km attuali</span>
                    <input
                      className="man-input"
                      value={km}
                      onChange={(e) => setKm(e.target.value)}
                      placeholder="Es. 325000"
                      inputMode="numeric"
                    />
                  </label>
                )}

                {tipo === "compressore" && (
                  <label className="man-label-inline">
                    <span className="man-label-text">Ore</span>
                    <input
                      className="man-input"
                      value={ore}
                      onChange={(e) => setOre(e.target.value)}
                      placeholder="Es. 1200"
                      inputMode="numeric"
                    />
                  </label>
                )}
              </div>

              {tipo === "compressore" && (
                <label className="man-label-block">
                  <span className="man-label-text">Sottotipo compressore</span>
                  <select
                    className="man-input"
                    value={sottotipo}
                    onChange={(e) =>
                      setSottotipo(e.target.value as SottoTipo)
                    }
                  >
                    <option value="motrice">Motrice</option>
                    <option value="trattore">Trattore</option>
                  </select>
                </label>
              )}
            </div>

            {/* SEZIONE 2 – DETTAGLI MANUTENZIONE */}
            <div className="man-section">
              <div className="man-section-title">Dettagli manutenzione</div>

              <label className="man-label-block">
                <span className="man-label-text">Descrizione intervento</span>
                <textarea
                  className="man-input man-textarea"
                  value={descrizione}
                  onChange={(e) => setDescrizione(e.target.value)}
                  placeholder="Es. Sostituzione pastiglie freno anteriori"
                />
              </label>

              <button
                type="button"
                className="man-header-btn man-header-btn-outline"
                style={{ marginTop: "8px", marginBottom: "12px" }}
                onClick={() => setModalGommeOpen(true)}
                disabled={!targa || !mezzoSelezionato}
              >
                Gestione gomme
              </button>

              <label className="man-label-block">
                <span className="man-label-text">Eseguito da</span>
                <input
                  className="man-input"
                  value={eseguito}
                  onChange={(e) => setEseguito(e.target.value.toUpperCase())}
                  placeholder="Es. OFFICINA INTERNA / AGUSTONI CESARE / ..."
                />
              </label>

              <label className="man-label-inline">
                <span className="man-label-text">Data intervento</span>
                <input
                  className="man-input"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  placeholder="gg mm aaaa"
                />
              </label>
            </div>

            {/* SEZIONE 3 – MATERIALI USATI */}
            <div className="man-section">
              <div className="man-section-title">Materiali utilizzati</div>

              <div className="man-row man-row-materiale">
                <div className="man-materiale-left">
                  <label className="man-label-block">
                    <span className="man-label-text">
                      Cerca in inventario / inserisci materiale
                    </span>
                    <input
                      className="man-input"
                      value={materialeSearch}
                      onChange={(e) => setMaterialeSearch(e.target.value)}
                      placeholder="Es. PASTIGLIE FRENO, OLIO MOTORE..."
                    />
                  </label>

                  {materialeSearch && materialiSugg.length > 0 && (
                    <div className="man-autosuggest">
                      {materialiSugg.map((m) => (
                        <div
                          key={m.id}
                          className="man-autosuggest-item"
                          onClick={() => {
                            if (!quantitaTemp || Number(quantitaTemp) <= 0) {
                              alert("Inserisci prima la quantità.");
                              return;
                            }

                            handleAddMateriale(
                              m.label,
                              Number(quantitaTemp),
                              m.unita || "pz",
                              true,
                              m.id
                            );
                          }}
                        >
                          <div className="man-autosuggest-main">
                            <span className="man-autosuggest-label">
                              {m.label}
                            </span>
                            {m.fornitoreLabel && (
                              <span className="man-autosuggest-supplier">
                                {m.fornitoreLabel}
                              </span>
                            )}
                          </div>
                          <div className="man-autosuggest-extra">
                            <span>
                              Disponibili: {m.quantitaTotale} {m.unita}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="man-materiale-right">
                  <label className="man-label-inline">
                    <span className="man-label-text">Quantità</span>
                    <input
                      className="man-input man-input-small"
                      value={quantitaTemp}
                      onChange={(e) => setQuantitaTemp(e.target.value)}
                      placeholder="Es. 2"
                      inputMode="numeric"
                    />
                  </label>
                  <button
                    type="button"
                    className="man-header-btn"
                    onClick={() => {
                      if (!materialeSearch.trim()) {
                        alert(
                          "Inserisci il nome del materiale o selezionalo dall'inventario."
                        );
                        return;
                      }
                      if (!quantitaTemp || Number(quantitaTemp) <= 0) {
                        alert("Inserisci una quantità valida.");
                        return;
                      }

                      handleAddMateriale(
                        materialeSearch.toUpperCase(),
                        Number(quantitaTemp),
                        "pz",
                        false
                      );
                    }}
                  >
                    Aggiungi materiale
                  </button>
                </div>
              </div>

              {materialiTemp.length > 0 && (
                <div className="man-materiali-list">
                  {materialiTemp.map((m) => (
                    <div key={m.id} className="man-materiale-pill">
                      <span className="man-materiale-label">
                        {m.label} – {m.quantita} {m.unita}
                        {m.fromInventario ? " (da inventario)" : ""}
                      </span>
                      <button
                        type="button"
                        className="man-materiale-remove"
                        onClick={() => handleRemoveMateriale(m.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="man-actions">
              <button
                type="button"
                className="man-btn-primary"
                onClick={handleAdd}
                disabled={loading}
              >
                Salva manutenzione
              </button>
              <button
                type="button"
                className="man-btn-secondary"
                onClick={resetForm}
              >
                Pulisci campi
              </button>
            </div>
          </div>
        </div>

        {/* CARD DESTRA – STORICO */}
        <div className="man-card man-card-list">
          <div className="man-card-header">
            <div>
              <h2 className="man-title-sm">Storico manutenzioni</h2>
              <p className="man-subtitle">
                Filtra per targa e tipo per una ricerca veloce
              </p>
            </div>

            <button
              type="button"
              className="man-header-btn man-header-btn-outline"
              onClick={async () => {
                try {
                  if (!storico.length) {
                    alert("Non ci sono manutenzioni da esportare.");
                    return;
                  }

                  const rows = storico.map((v) => {
                    const misura =
                      v.tipo === "mezzo"
                        ? v.km != null
                          ? `${v.km} KM`
                          : "-"
                        : v.ore != null
                        ? `${v.ore} ORE`
                        : "-";

                    return [
                      v.targa,
                      v.tipo === "mezzo" ? "MEZZO" : "COMPRESSORE",
                      misura,
                      v.sottotipo || "-",
                      v.descrizione,
                      v.eseguito || "-",
                      v.data,
                    ];
                  });

                  await generateSmartPDF({
                    kind: "table",
                    title: "Storico manutenzioni",
                    columns: [
                      "Targa",
                      "Tipo",
                      "Km/Ore",
                      "Sottotipo",
                      "Descrizione",
                      "Eseguito da",
                      "Data",
                    ],
                    rows,
                  });
                } catch (err) {
                  console.error("Errore generazione PDF manutenzioni:", err);
                  alert(
                    "Errore durante la generazione del PDF. Riprova più tardi."
                  );
                }
              }}
            >
              Esporta PDF
            </button>
          </div>

          <div className="man-card-body">
            {/* FILTRI LISTA */}
            <div className="man-filters">
              <label className="man-label-inline">
                <span className="man-label-text">Filtra per targa</span>
                <input
                  className="man-input"
                  value={filtroTarga}
                  onChange={(e) => setFiltroTarga(e.target.value)}
                  placeholder="Es. TI315407"
                />
              </label>

              <label className="man-label-inline">
                <span className="man-label-text">Tipo</span>
                <select
                  className="man-input"
                  value={filtroTipo}
                  onChange={(e) =>
                    setFiltroTipo(e.target.value as "tutti" | TipoVoce)
                  }
                >
                  <option value="tutti">Tutti</option>
                  <option value="mezzo">Mezzi</option>
                  <option value="compressore">Compressori</option>
                </select>
              </label>
            </div>

            {/* LISTA STORICO */}
            {loading ? (
              <div className="man-empty">Caricamento in corso...</div>
            ) : storicoFiltrato.length === 0 ? (
              <div className="man-empty">
                Nessuna manutenzione trovata con i filtri attuali.
              </div>
            ) : (
              <div className="man-list">
                {storicoFiltrato.map((item) => {
                  const misura =
                    item.tipo === "mezzo"
                      ? item.km != null
                        ? `${item.km} KM`
                        : "-"
                      : item.ore != null
                      ? `${item.ore} ORE`
                      : "-";

                  return (
                    <div key={item.id} className="man-row-item">
                      <div className="man-row-main">
                        <div className="man-row-line1">
                          <span className="man-tag">
                            {item.tipo === "mezzo"
                              ? "MEZZO"
                              : "COMPRESSORE"}
                          </span>
                          <span className="man-targa">
                            {item.targa.toUpperCase()}
                          </span>
                          <span className="man-misura">{misura}</span>
                          {item.sottotipo && (
                            <span className="man-sottotipo">
                              {item.sottotipo}
                            </span>
                          )}
                          <span className="man-data">{item.data}</span>
                        </div>
                        <div className="man-row-line2">
                          <div className="man-descr">
                            {item.descrizione}
                          </div>
                          <div className="man-row-meta">
                            <span className="man-eseguito">
                              {item.eseguito || "-"}
                            </span>
                            <button
                              type="button"
                              className="man-edit-btn"
                              onClick={() => handleEdit(item)}
                              style={{
                                marginLeft: "8px",
                                fontSize: "12px",
                                padding: "6px 10px",
                                borderRadius: "4px",
                                cursor: "pointer"
                              }}
                            >
                              Modifica
                            </button>

                            <button
                              type="button"
                              className="man-delete-btn"
                              onClick={() => handleDelete(item.id)}
                            >
                              Elimina
                            </button>
                          </div>
                        </div>
                        {item.materiali && item.materiali.length > 0 && (
                          <div className="man-row-materiali">
                            {item.materiali.map((m) => (
                              <span
                                key={m.id}
                                className="man-materiale-pill-sm"
                              >
                                {m.label} – {m.quantita} {m.unita}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {modalGommeOpen && mezzoSelezionato && (
        <ModalGomme
          open={modalGommeOpen}
          targa={mezzoSelezionato.targa}
          categoria={mezzoSelezionato.categoria}
          kmIniziale={km}
          onClose={() => setModalGommeOpen(false)}
          onConfirm={handleGommeConfirm}
        />
      )}
    </div>
  );
};

export default Manutenzioni;
