import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import NextClonePageScaffold from "./NextClonePageScaffold";
import {
  appendNextLavoriCloneRecords,
  type NextLavoriCloneRawRecord,
} from "./nextLavoriCloneState";
import { readNextAnagraficheFlottaSnapshot } from "./nextAnagraficheFlottaDomain";
import { formatEditableDateUI } from "./nextDateFormat";

type LavoroDraft = {
  id: string;
  tipo: "magazzino" | "targa";
  descrizione: string;
  dataInserimento: string;
  targa: string;
  urgenza: "bassa" | "media" | "alta";
};

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayInputValue() {
  return formatEditableDateUI(new Date());
}

function normalizeTarga(value: string) {
  return value.toUpperCase().replace(/\s+/g, "").trim();
}

export default function NextLavoriDaEseguirePage() {
  const [tipo, setTipo] = useState<"magazzino" | "targa">("magazzino");
  const [targa, setTarga] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [dataInserimento, setDataInserimento] = useState(todayInputValue());
  const [urgenza, setUrgenza] = useState<"bassa" | "media" | "alta">("bassa");
  const [mezzi, setMezzi] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<LavoroDraft[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadingMezzi, setLoadingMezzi] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoadingMezzi(true);
      try {
        const snapshot = await readNextAnagraficheFlottaSnapshot();
        if (!mounted) {
          return;
        }
        setMezzi(snapshot.items.map((item) => item.targa).filter(Boolean));
      } catch {
        if (mounted) {
          setMezzi([]);
        }
      } finally {
        if (mounted) {
          setLoadingMezzi(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const canAdd = descrizione.trim().length > 0 && (tipo === "magazzino" || normalizeTarga(targa).length > 0);

  const mezziSuggestions = useMemo(() => {
    const query = normalizeTarga(targa);
    if (!query) {
      return mezzi.slice(0, 12);
    }
    return mezzi.filter((entry) => entry.includes(query)).slice(0, 12);
  }, [mezzi, targa]);

  const addDraft = () => {
    if (!canAdd) {
      return;
    }

    setDrafts((current) => [
      ...current,
      {
        id: createId(),
        tipo,
        descrizione: descrizione.trim(),
        dataInserimento,
        targa: tipo === "targa" ? normalizeTarga(targa) : "",
        urgenza,
      },
    ]);
    setDescrizione("");
    setTarga("");
    setUrgenza("bassa");
    setNotice(null);
  };

  const removeDraft = (id: string) => {
    setDrafts((current) => current.filter((entry) => entry.id !== id));
  };

  const saveDraftGroup = () => {
    if (drafts.length === 0) {
      return;
    }

    const gruppoId = createId();
    const savedAt = Date.now();
    const records: NextLavoriCloneRawRecord[] = drafts.map((entry) => ({
      id: entry.id,
      gruppoId,
      tipo: entry.tipo,
      descrizione: entry.descrizione,
      dataInserimento: entry.dataInserimento,
      eseguito: false,
      targa: entry.tipo === "targa" ? entry.targa : undefined,
      urgenza: entry.urgenza,
      segnalatoDa: "clone_next",
      sottoElementi: [],
      __nextCloneOnly: true,
      __nextCloneSavedAt: savedAt,
    }));

    appendNextLavoriCloneRecords(records);
    setDrafts([]);
    setNotice("Gruppo lavori salvato nel clone. Le liste NEXT lo leggono senza scrivere sulla madre.");
  };

  return (
    <NextClonePageScaffold
      eyebrow="Gestione Operativa / Lavori"
      title="Lavori da eseguire"
      description="Route NEXT autonoma per aprire nuovi lavori nel clone con stato locale, senza scrivere su `@lavori` della madre."
      backTo="/next/gestione-operativa"
      backLabel="Gestione Operativa"
      notice={
        <div style={{ display: "grid", gap: 12 }}>
          {loadingMezzi ? <div className="next-clone-placeholder">Caricamento anagrafica mezzi...</div> : null}
          {notice ? <div className="next-clone-placeholder">{notice}</div> : null}
          <p style={{ margin: 0 }}>
            Il writer e clone-local: la madre resta intatta, ma la route mantiene il flusso di apertura gruppo e lo rende visibile nelle liste NEXT.
          </p>
        </div>
      }
    >
      <div style={{ display: "grid", gap: 16 }}>
        <div className="next-clone-placeholder" style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => setTipo("magazzino")} disabled={tipo === "magazzino"}>
              Magazzino
            </button>
            <button type="button" onClick={() => setTipo("targa")} disabled={tipo === "targa"}>
              Targa
            </button>
            <Link to="/next/lavori-in-attesa">Lavori in attesa</Link>
            <Link to="/next/lavori-eseguiti">Lavori eseguiti</Link>
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Data inserimento</span>
              <input type="text" value={dataInserimento} onChange={(event) => setDataInserimento(event.target.value)} placeholder="gg mm aaaa" />
            </label>

            {tipo === "targa" ? (
              <label style={{ display: "grid", gap: 6 }}>
                <span>Targa</span>
                <input
                  type="text"
                  value={targa}
                  onChange={(event) => setTarga(event.target.value)}
                  list="next-lavori-mezzi"
                  placeholder="Es. TI233827"
                />
                <datalist id="next-lavori-mezzi">
                  {mezziSuggestions.map((entry) => (
                    <option key={entry} value={entry} />
                  ))}
                </datalist>
              </label>
            ) : null}

            <label style={{ display: "grid", gap: 6 }}>
              <span>Urgenza</span>
              <select value={urgenza} onChange={(event) => setUrgenza(event.target.value as "bassa" | "media" | "alta")}>
                <option value="bassa">Bassa</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </label>
          </div>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Descrizione lavoro</span>
            <input
              type="text"
              value={descrizione}
              onChange={(event) => setDescrizione(event.target.value)}
              placeholder="Descrivi il lavoro da aprire"
            />
          </label>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={addDraft} disabled={!canAdd}>
              Aggiungi riga
            </button>
            <button type="button" onClick={saveDraftGroup} disabled={drafts.length === 0}>
              Salva gruppo nel clone
            </button>
          </div>
        </div>

        <div className="next-clone-placeholder" style={{ display: "grid", gap: 12 }}>
          <strong>Gruppo in preparazione</strong>
          {drafts.length > 0 ? (
            drafts.map((entry) => (
              <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                  <strong>{entry.descrizione}</strong>
                  <div style={{ fontSize: 12, color: "#475569" }}>
                    {entry.tipo === "targa" ? entry.targa : "MAGAZZINO"} | {entry.dataInserimento} | {entry.urgenza.toUpperCase()}
                  </div>
                </div>
                <button type="button" onClick={() => removeDraft(entry.id)}>
                  Elimina
                </button>
              </div>
            ))
          ) : (
            <div>Nessun lavoro in preparazione.</div>
          )}
        </div>
      </div>
    </NextClonePageScaffold>
  );
}
