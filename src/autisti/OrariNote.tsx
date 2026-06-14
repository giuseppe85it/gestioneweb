import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./autisti.css";
import "./OrariNote.css";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { getAutistaLocal } from "../autisti/autistiStorage";
import {
  addDaysISO,
  aggregatiMese,
  buildFooterRows,
  buildGiorniMese,
  calcTotaleNettoMinuti,
  findGiorno,
  formatDataDisplay,
  formatDataGGMM,
  formatMinutesToHHMM,
  formatMonteOre,
  giornoSettimanaLong,
  giornoSettimanaShort,
  isMeseChiuso,
  listaMancantiFeriali,
  meseLabelShort,
  monteOreGiornoMinuti,
  pausaLabel,
  TIPO_GIORNO_LABEL,
  toISODate,
  upsertGiornoRecord,
  withMeseChiuso,
  type ChiusureDoc,
  type OrarioGiornoRecord,
  type TipoGiorno,
} from "../utils/orariCalc";

const KEY_ORARI = "@orari_autisti";
const KEY_ORARI_CHIUSURE = "@orari_autisti_chiusure";

const TIPI: TipoGiorno[] = ["lavoro", "ferie", "malattia", "infortunio", "festivita"];

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toArray(raw: unknown): OrarioGiornoRecord[] {
  if (Array.isArray(raw)) return raw as OrarioGiornoRecord[];
  return [];
}

function toChiusureDoc(raw: unknown): ChiusureDoc {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as ChiusureDoc;
  return {};
}

type DayForm = {
  tipo: TipoGiorno;
  inizio: string;
  fine: string;
  notte: boolean;
  noPausa: boolean;
  note: string;
};

// Costruisce il form del giorno dal record esistente, o default Lavoro con ora
// corrente del telefono (SPEC §2.1).
function buildFormFromRecord(existing: OrarioGiornoRecord | null): DayForm {
  if (existing) {
    return {
      tipo: existing.tipo,
      inizio: existing.inizio ?? nowHHMM(),
      fine: existing.fine ?? nowHHMM(),
      notte: existing.notte === true,
      noPausa: existing.noPausa === true,
      note: existing.note ?? "",
    };
  }
  const now = nowHHMM();
  return { tipo: "lavoro", inizio: now, fine: now, notte: false, noPausa: false, note: "" };
}

// Nota in tabella riepilogo: 1–3 parole troncate (SPEC §2.1), nessun a capo.
function noteWords(note: string): string {
  const words = String(note ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const short = words.slice(0, 3).join(" ");
  return words.length > 3 ? `${short}…` : short;
}

// Classe colore monte ore (SPEC §4bis): pos = verde, neg = rosso, zero = neutro.
function monteClass(min: number | null): string {
  if (min === null || min === 0) return "zero";
  return min > 0 ? "pos" : "neg";
}

export default function OrariNote() {
  const navigate = useNavigate();

  const [autista, setAutista] = useState<{ badge: string; nome: string } | null>(null);
  const [allRecords, setAllRecords] = useState<OrarioGiornoRecord[]>([]);
  const [chiusure, setChiusure] = useState<ChiusureDoc>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = useMemo(() => new Date(), []);
  const todayISO = useMemo(() => toISODate(today), [today]);
  const [year, setYear] = useState(today.getFullYear());
  const [month1, setMonth1] = useState(today.getMonth() + 1);

  // Giorno-first: il modulo si apre sulla VISTA GIORNO di OGGI (SPEC §2.1).
  const [view, setView] = useState<"mese" | "giorno">("giorno");
  const [selectedData, setSelectedData] = useState<string | null>(todayISO);
  const [form, setForm] = useState<DayForm | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [closeModal, setCloseModal] = useState<{ open: boolean; missing: string[] }>({
    open: false,
    missing: [],
  });

  // Carica autista + dati. L'autista deve avere un badge (no mezzo richiesto).
  useEffect(() => {
    const a = getAutistaLocal();
    if (!a?.badge) {
      navigate("/autisti/login", { replace: true });
      return;
    }
    setAutista({ badge: String(a.badge), nome: String(a.nome ?? "") });

    let cancelled = false;
    (async () => {
      const [rawOrari, rawChiusure] = await Promise.all([
        getItemSync(KEY_ORARI),
        getItemSync(KEY_ORARI_CHIUSURE),
      ]);
      if (cancelled) return;
      const records = toArray(rawOrari);
      setAllRecords(records);
      setChiusure(toChiusureDoc(rawChiusure));
      // Entra direttamente sul giorno di OGGI con il record (se esiste) precaricato.
      setForm(buildFormFromRecord(findGiorno(records, String(a.badge), todayISO)));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, todayISO]);

  const badge = autista?.badge ?? "";

  const meseChiuso = isMeseChiuso(chiusure, badge, year, month1);

  // È un mese passato? La chiusura è permessa solo dal 1° del mese successivo.
  const meseChiudibile = useMemo(() => {
    const annoOggi = today.getFullYear();
    const meseOggi = today.getMonth() + 1;
    return year < annoOggi || (year === annoOggi && month1 < meseOggi);
  }, [today, year, month1]);

  // Record del badge per il mese visualizzato, indicizzati per data.
  const recordByData = useMemo(() => {
    const map = new Map<string, OrarioGiornoRecord>();
    allRecords.forEach((r) => {
      if (String(r.badge ?? "").trim() === badge) map.set(String(r.data), r);
    });
    return map;
  }, [allRecords, badge]);

  const giorniMese = useMemo(() => buildGiorniMese(year, month1), [year, month1]);

  const recordsMese = useMemo(
    () => giorniMese.map((g) => recordByData.get(g.data)).filter((r): r is OrarioGiornoRecord => Boolean(r)),
    [giorniMese, recordByData]
  );

  const aggregati = useMemo(() => aggregatiMese(recordsMese), [recordsMese]);

  // SPEC §2.1 — weekend per data (tinta card) e conteggio mancanti feriali (Y).
  const isWeekendByData = useMemo(
    () => new Map(giorniMese.map((g) => [g.data, g.isWeekend])),
    [giorniMese]
  );
  const mancantiFeriali = useMemo(
    () => listaMancantiFeriali(recordsMese, year, month1).length,
    [recordsMese, year, month1]
  );

  function goPrevMonth() {
    const d = new Date(year, month1 - 2, 1);
    setYear(d.getFullYear());
    setMonth1(d.getMonth() + 1);
  }
  function goNextMonth() {
    const d = new Date(year, month1, 1);
    setYear(d.getFullYear());
    setMonth1(d.getMonth() + 1);
  }

  function openGiorno(data: string) {
    setSelectedData(data);
    setForm(buildFormFromRecord(findGiorno(allRecords, badge, data)));
    setView("giorno");
  }

  // Frecce vista giorno: giorno precedente / successivo (SPEC §2.1).
  function goPrevDay() {
    if (selectedData) openGiorno(addDaysISO(selectedData, -1));
  }
  function goNextDay() {
    if (selectedData) openGiorno(addDaysISO(selectedData, 1));
  }

  // Click sulla data centrale → apre la vista RIEPILOGO del mese di quel giorno (la data È il varco).
  function openRiepilogoFromDate() {
    if (!selectedData) return;
    setYear(Number(selectedData.slice(0, 4)));
    setMonth1(Number(selectedData.slice(5, 7)));
    setView("mese");
  }

  // Chiuso valutato sul mese del GIORNO selezionato (le frecce possono cambiare mese).
  function chiusoForData(data: string): boolean {
    return isMeseChiuso(chiusure, badge, Number(data.slice(0, 4)), Number(data.slice(5, 7)));
  }

  async function handleSaveGiorno() {
    if (!form || !selectedData || !badge || saving) return;
    if (chiusoForData(selectedData)) return; // mese chiuso: autista in sola lettura
    setSaving(true);
    try {
      const existing = findGiorno(allRecords, badge, selectedData);
      const now = Date.now();
      const isAssenza = form.tipo !== "lavoro";
      const record: OrarioGiornoRecord = {
        badge,
        data: selectedData,
        tipo: form.tipo,
        inizio: isAssenza ? null : form.inizio || null,
        fine: isAssenza ? null : form.fine || null,
        notte: isAssenza ? false : form.notte,
        noPausa: isAssenza ? false : form.noPausa,
        note: form.note ?? "",
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      const nextList = upsertGiornoRecord(allRecords, record);
      await setItemSync(KEY_ORARI, nextList);
      setAllRecords(nextList);
      // SPEC §2.1: dopo Salva si RESTA sulla vista giorno (navigabile con le frecce).
    } finally {
      setSaving(false);
    }
  }

  // CHIUDI: elenca i giorni feriali (Lun-Ven) non compilati ma NON blocca.
  function requestClose() {
    const missing = giorniMese
      .filter((g) => !g.isWeekend && !recordByData.has(g.data))
      .map((g) => `${giornoSettimanaShort(g.data)} ${formatDataDisplay(g.data)}`);
    setCloseModal({ open: true, missing });
  }

  async function confirmClose() {
    if (!badge || saving) return;
    setSaving(true);
    try {
      const nextDoc = withMeseChiuso(chiusure, badge, year, month1, Date.now());
      await setItemSync(KEY_ORARI_CHIUSURE, nextDoc);
      setChiusure(nextDoc);
      setCloseModal({ open: false, missing: [] });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !autista) {
    return (
      <div className="autisti-container orari-container">
        <h1 className="autisti-title">Registro orari</h1>
        <p className="orari-loading">Caricamento…</p>
      </div>
    );
  }

  // ===================== VISTA GIORNO =====================
  if (view === "giorno" && selectedData && form) {
    const isAssenza = form.tipo !== "lavoro";
    const totaleMin = calcTotaleNettoMinuti({
      tipo: form.tipo,
      inizio: form.inizio,
      fine: form.fine,
      noPausa: form.noPausa,
    });
    const readOnly = chiusoForData(selectedData);

    return (
      <div className="autisti-container orari-container">
        <div className="orari-day-head">
          <button type="button" className="orari-nav" onClick={goPrevDay} aria-label="Giorno precedente">
            ‹
          </button>
          <button
            type="button"
            className="orari-day-date"
            onClick={openRiepilogoFromDate}
            title="Apri il riepilogo del mese"
          >
            {giornoSettimanaLong(selectedData).toUpperCase()} {formatDataDisplay(selectedData)}
          </button>
          <button type="button" className="orari-nav" onClick={goNextDay} aria-label="Giorno successivo">
            ›
          </button>
        </div>

        {readOnly && (
          <div className="orari-chiuso-banner">
            Cartellino del mese CHIUSO: sola lettura.
          </div>
        )}

        <div className="orari-tipo-toggle">
          {TIPI.map((t) => (
            <button
              key={t}
              type="button"
              className={form.tipo === t ? "active green" : ""}
              disabled={readOnly}
              onClick={() => setForm((f) => (f ? { ...f, tipo: t } : f))}
            >
              {TIPO_GIORNO_LABEL[t]}
            </button>
          ))}
        </div>

        {!isAssenza && (
          <>
            <div className="orari-field-row">
              <label className="orari-field">
                <span>Inizio</span>
                <input
                  type="time"
                  value={form.inizio}
                  disabled={readOnly}
                  onChange={(e) => setForm((f) => (f ? { ...f, inizio: e.target.value } : f))}
                />
              </label>
              <label className="orari-field">
                <span>Fine</span>
                <input
                  type="time"
                  value={form.fine}
                  disabled={readOnly}
                  onChange={(e) => setForm((f) => (f ? { ...f, fine: e.target.value } : f))}
                />
              </label>
            </div>

            {/* Flag grandi ai LATI del Totale: NOTTE a sinistra, NO PAUSA a destra. */}
            <div className="orari-work-row">
              <button
                type="button"
                className={`orari-flag-big${form.notte ? " active green" : ""}`}
                disabled={readOnly}
                aria-pressed={form.notte}
                onClick={() => setForm((f) => (f ? { ...f, notte: !f.notte } : f))}
              >
                Notte
              </button>

              <div className="orari-totale-box">
                <span className="orari-totale-label">Totale</span>
                <strong className="orari-totale-val">{formatMinutesToHHMM(totaleMin)}</strong>
                <span className="orari-pausa-hint">
                  Pausa {pausaLabel({ tipo: form.tipo, noPausa: form.noPausa })}
                </span>
              </div>

              <button
                type="button"
                className={`orari-flag-big${form.noPausa ? " active green" : ""}`}
                disabled={readOnly}
                aria-pressed={form.noPausa}
                onClick={() => setForm((f) => (f ? { ...f, noPausa: !f.noPausa } : f))}
              >
                No pausa
              </button>
            </div>
          </>
        )}

        <button
          type="button"
          className="orari-note-btn"
          disabled={readOnly}
          onClick={() => {
            setNoteDraft(form.note ?? "");
            setNoteModalOpen(true);
          }}
        >
          {form.note?.trim() ? "Modifica nota" : "Aggiungi nota"}
        </button>

        {form.note?.trim() ? (
          <div
            className="orari-note-shown"
            role="button"
            tabIndex={0}
            title={readOnly ? undefined : "Clicca per modificare la nota"}
            onClick={() => {
              if (readOnly) return;
              setNoteDraft(form.note ?? "");
              setNoteModalOpen(true);
            }}
            onKeyDown={(e) => {
              if (readOnly) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setNoteDraft(form.note ?? "");
                setNoteModalOpen(true);
              }
            }}
          >
            {form.note}
          </div>
        ) : null}

        {!readOnly && (
          <button className="autisti-button" onClick={handleSaveGiorno} disabled={saving}>
            {saving ? "Salvataggio…" : "Salva"}
          </button>
        )}
        <button className="autisti-button secondary" onClick={() => navigate("/autisti/home")}>
          Indietro
        </button>

        {noteModalOpen && (
          <div className="orari-modal-backdrop" onClick={() => setNoteModalOpen(false)}>
            <div className="orari-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Note del giorno</h3>
              <textarea
                value={noteDraft}
                autoFocus
                placeholder="Scrivi una nota…"
                onChange={(e) => setNoteDraft(e.target.value)}
              />
              <div className="orari-modal-actions">
                <button
                  className="autisti-button"
                  onClick={() => {
                    setForm((f) => (f ? { ...f, note: noteDraft } : f));
                    setNoteModalOpen(false);
                  }}
                >
                  Salva nota
                </button>
                <button className="autisti-button secondary" onClick={() => setNoteModalOpen(false)}>
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===================== VISTA MESE =====================
  return (
    <div className="autisti-container orari-container">
      <div className="orari-month-head">
        <button type="button" className="orari-nav" onClick={goPrevMonth} aria-label="Mese precedente">
          ‹
        </button>
        <span className="orari-month-label">
          {meseLabelShort(month1)} {year}
          {meseChiuso && <span className="orari-chiuso-tag"> · CHIUSO</span>}
        </span>
        <button type="button" className="orari-nav" onClick={goNextMonth} aria-label="Mese successivo">
          ›
        </button>
      </div>

      {/* Riga STATO MESE (SPEC §2.1): Compilati X · Mancanti (feriali) Y se Y>0. */}
      <div className="orari-stato-mese">
        Compilati: <strong>{recordsMese.length}</strong>
        {mancantiFeriali > 0 ? (
          <>
            {" · "}
            Mancanti (feriali): <strong>{mancantiFeriali}</strong>
          </>
        ) : null}
      </div>

      {/* TABELLA COMPATTA (SPEC §2.1): solo giorni segnati; Data/Giorno sticky, resto scroll-x. */}
      {recordsMese.length === 0 ? (
        <p className="orari-empty-list">Nessun giorno segnato in questo mese.</p>
      ) : (
        <div className="orari-tab-scroll">
          <table className="orari-tab">
            <thead>
              <tr>
                <th className="orari-tab-sticky orari-tab-sticky1">Data</th>
                <th className="orari-tab-sticky orari-tab-sticky2">Giorno</th>
                <th>Inizio</th>
                <th>Fine</th>
                <th>Totale</th>
                <th>Monte ore</th>
                <th>Notte</th>
                <th>No pausa</th>
                <th className="orari-tab-note">Note</th>
              </tr>
            </thead>
            <tbody>
              {recordsMese.map((rec) => {
                const isAssenza = rec.tipo !== "lavoro";
                const totaleMin = calcTotaleNettoMinuti(rec);
                const monteMin = monteOreGiornoMinuti(rec);
                const isWeekend = isWeekendByData.get(rec.data) ?? false;
                return (
                  <tr
                    key={rec.data}
                    className={`orari-tab-row${isWeekend ? " weekend" : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => openGiorno(rec.data)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openGiorno(rec.data);
                      }
                    }}
                  >
                    <td className="orari-tab-sticky orari-tab-sticky1">{formatDataGGMM(rec.data)}</td>
                    <td className="orari-tab-sticky orari-tab-sticky2">
                      {giornoSettimanaShort(rec.data).toUpperCase()}
                    </td>
                    {isAssenza ? (
                      <>
                        <td></td>
                        <td></td>
                        <td className="orari-tab-assenza">{TIPO_GIORNO_LABEL[rec.tipo]}</td>
                      </>
                    ) : (
                      <>
                        <td>{rec.inizio ?? ""}</td>
                        <td>{rec.fine ?? ""}</td>
                        <td className="orari-tab-tot">{formatMinutesToHHMM(totaleMin)}</td>
                      </>
                    )}
                    <td className={`orari-tab-monte ${monteClass(monteMin)}`}>{formatMonteOre(monteMin)}</td>
                    <td className="orari-tab-x">{rec.notte ? "X" : ""}</td>
                    <td className="orari-tab-x">{!isAssenza && rec.noPausa ? "X" : ""}</td>
                    <td className="orari-tab-note">{noteWords(rec.note)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="orari-footer">
        {buildFooterRows(aggregati).map((row) => (
          <div className={`orari-footer-row${row.variant ? ` ${row.variant}` : ""}`} key={row.label}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>

      {meseChiudibile && !meseChiuso && (
        <button className="autisti-button" onClick={requestClose} disabled={saving}>
          CHIUDI cartellino {meseLabelShort(month1)} {year}
        </button>
      )}
      {meseChiuso && <div className="orari-chiuso-banner">Cartellino CHIUSO.</div>}

      <button className="autisti-button secondary" onClick={() => navigate("/autisti/home")}>
        Indietro
      </button>

      {closeModal.open && (
        <div className="orari-modal-backdrop" onClick={() => setCloseModal({ open: false, missing: [] })}>
          <div className="orari-modal" onClick={(e) => e.stopPropagation()}>
            <h3>
              Chiudere il cartellino di {meseLabelShort(month1)} {year}?
            </h3>
            {closeModal.missing.length > 0 ? (
              <div className="orari-missing">
                <p>Giorni feriali non compilati:</p>
                <ul>
                  {closeModal.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
                <p className="orari-missing-hint">Puoi chiudere comunque.</p>
              </div>
            ) : (
              <p>Dopo la chiusura non potrai più modificare questo mese.</p>
            )}
            <div className="orari-modal-actions">
              <button className="autisti-button" onClick={confirmClose} disabled={saving}>
                {saving ? "Chiusura…" : "Chiudi comunque"}
              </button>
              <button
                className="autisti-button secondary"
                onClick={() => setCloseModal({ open: false, missing: [] })}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
