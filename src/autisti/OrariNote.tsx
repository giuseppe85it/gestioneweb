import { useEffect, useMemo, useRef, useState } from "react";
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
  MINUTI_PAUSA_FISSA,
  monteOreGiornoMinuti,
  pausaEffettivaMinuti,
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
  pausaMin: number; // minuti di pausa reali: 60 (default), 0 (No pausa), o parziale
  note: string;
};

// Costruisce il form del giorno dal record esistente, o default Lavoro con ora
// corrente del telefono (SPEC §2.1). La pausa si ricava sempre con l'helper condiviso
// (retrocompat: record vecchi con solo `noPausa` → 0/60).
function buildFormFromRecord(existing: OrarioGiornoRecord | null): DayForm {
  if (existing) {
    return {
      tipo: existing.tipo,
      inizio: existing.inizio ?? nowHHMM(),
      fine: existing.fine ?? nowHHMM(),
      notte: existing.notte === true,
      pausaMin: pausaEffettivaMinuti(existing),
      note: existing.note ?? "",
    };
  }
  const now = nowHHMM();
  return { tipo: "lavoro", inizio: now, fine: now, notte: false, pausaMin: MINUTI_PAUSA_FISSA, note: "" };
}

// INT1 — cifre digitate sul tastierino → display "HH:MM" con segnaposto. Es. "073" → "07:3–".
function digitsToDisplay(digits: string): string {
  const d = digits.slice(0, 4).padEnd(4, "–");
  return `${d.slice(0, 2)}:${d.slice(2, 4)}`;
}

// INT1 — cifre digitate → "HH:MM" valido (HH 0-23, MM 0-59) o null. Min 3 cifre ("730" → 07:30).
function digitsToHHMM(digits: string): string | null {
  const d = digits.replace(/\D/g, "");
  if (d.length < 3) return null;
  const padded = d.slice(0, 4).padStart(4, "0");
  const h = Number(padded.slice(0, 2));
  const m = Number(padded.slice(2, 4));
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// INT2 — etichetta del tasto pausa secondo i minuti reali: "No pausa" (0 o pieno) / "X min pausa".
function pausaButtonLabel(pausaMin: number): string {
  if (pausaMin > 0 && pausaMin < MINUTI_PAUSA_FISSA) return `${pausaMin} min pausa`;
  return "No pausa";
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
  // INT3 — feedback Salva: blu "Salvato ✓" stabile finché non si modifica un campo.
  const [savedClean, setSavedClean] = useState(false);
  // INT1 — tastierino numerico per l'ora (sostituisce l'orologio). digits = cifre digitate.
  const [timeKeypad, setTimeKeypad] = useState<{ field: "inizio" | "fine"; digits: string } | null>(null);
  // INT2 — modale pausa reale (touch lungo sul tasto "No pausa"). draft = minuti in stringa.
  const [pausaModal, setPausaModal] = useState<{ open: boolean; draft: string }>({ open: false, draft: "" });
  // INT2 — gestione touch lungo vs tap sul tasto pausa.
  const longPressTimer = useRef<number | null>(null);
  const longPressFired = useRef(false);

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

  // Pulisce il timer del touch lungo allo smontaggio (evita setTimeout pendenti su
  // componente smontato → niente setState fuori ciclo di vita).
  useEffect(() => {
    return () => {
      if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current);
    };
  }, []);

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

  // Ogni modifica al form invalida il feedback "Salvato" (INT3): il tasto torna "Salva".
  function updateForm(patch: Partial<DayForm>) {
    setForm((f) => (f ? { ...f, ...patch } : f));
    setSavedClean(false);
  }

  function openGiorno(data: string) {
    // Annulla un eventuale touch lungo in corso: cambiando giorno non deve aprire la
    // modale pausa sul giorno sbagliato (il setTimeout cattura il form del giorno vecchio).
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressFired.current = false;
    setSelectedData(data);
    setForm(buildFormFromRecord(findGiorno(allRecords, badge, data)));
    setSavedClean(false); // nuovo giorno: il tasto riparte da "Salva"
    setTimeKeypad(null);
    setPausaModal({ open: false, draft: "" });
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
      const pausaMin = isAssenza ? null : Math.max(0, Math.round(form.pausaMin));
      const record: OrarioGiornoRecord = {
        badge,
        data: selectedData,
        tipo: form.tipo,
        inizio: isAssenza ? null : form.inizio || null,
        fine: isAssenza ? null : form.fine || null,
        notte: isAssenza ? false : form.notte,
        // noPausa derivato e coerente con pausaMin (true ⟺ nessuna pausa = 0 min).
        noPausa: isAssenza ? false : pausaMin === 0,
        pausaMin,
        note: form.note ?? "",
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      const nextList = upsertGiornoRecord(allRecords, record);
      await setItemSync(KEY_ORARI, nextList);
      setAllRecords(nextList);
      setSavedClean(true); // INT3: conferma visiva, resta finché non si modifica un campo
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

  // ===== INT1 — tastierino numerico per l'ora =====
  function keypadPush(d: string) {
    setTimeKeypad((k) => (k && k.digits.length < 4 ? { ...k, digits: k.digits + d } : k));
  }
  function keypadBackspace() {
    setTimeKeypad((k) => (k ? { ...k, digits: k.digits.slice(0, -1) } : k));
  }
  function keypadConfirm() {
    if (!timeKeypad) return;
    const hhmm = digitsToHHMM(timeKeypad.digits);
    if (hhmm === null) return; // non valido: l'OK è disabilitato, ma doppia sicurezza
    if (timeKeypad.field === "inizio") updateForm({ inizio: hhmm });
    else updateForm({ fine: hhmm });
    setTimeKeypad(null);
  }

  // ===== INT2 — tasto "No pausa": tap = toggle 60⟺0; touch lungo = modale pausa reale =====
  function pausaClick() {
    if (longPressFired.current) {
      longPressFired.current = false; // era un touch lungo: niente toggle
      return;
    }
    if (!form) return;
    updateForm({ pausaMin: form.pausaMin < MINUTI_PAUSA_FISSA ? MINUTI_PAUSA_FISSA : 0 });
  }
  function pausaPointerDown() {
    longPressFired.current = false;
    if (longPressTimer.current !== null) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      setPausaModal({ open: true, draft: form && form.pausaMin > 0 ? String(form.pausaMin) : "" });
    }, 500);
  }
  function pausaPointerEnd() {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }
  function applyPausaParziale(min: number) {
    updateForm({ pausaMin: Math.max(0, Math.round(min)) });
    setPausaModal({ open: false, draft: "" });
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
      pausaMin: form.pausaMin,
    });
    const pausaAttiva = form.pausaMin < MINUTI_PAUSA_FISSA; // tasto acceso: 0 o parziale
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
              onClick={() => updateForm({ tipo: t })}
            >
              {TIPO_GIORNO_LABEL[t]}
            </button>
          ))}
        </div>

        {!isAssenza && (
          <>
            {/* INT1 — l'ora si inserisce col tastierino numerico, non più con l'orologio. */}
            <div className="orari-field-row">
              <div className="orari-field">
                <span>Inizio</span>
                <button
                  type="button"
                  className="orari-time-btn"
                  disabled={readOnly}
                  onClick={() => setTimeKeypad({ field: "inizio", digits: "" })}
                >
                  {form.inizio || "--:--"}
                </button>
              </div>
              <div className="orari-field">
                <span>Fine</span>
                <button
                  type="button"
                  className="orari-time-btn"
                  disabled={readOnly}
                  onClick={() => setTimeKeypad({ field: "fine", digits: "" })}
                >
                  {form.fine || "--:--"}
                </button>
              </div>
            </div>

            {/* Flag grandi ai LATI del Totale: NOTTE a sinistra, NO PAUSA a destra. */}
            <div className="orari-work-row">
              <button
                type="button"
                className={`orari-flag-big${form.notte ? " active green" : ""}`}
                disabled={readOnly}
                aria-pressed={form.notte}
                onClick={() => updateForm({ notte: !form.notte })}
              >
                Notte
              </button>

              <div className="orari-totale-box">
                <span className="orari-totale-label">Totale</span>
                <strong className="orari-totale-val">{formatMinutesToHHMM(totaleMin)}</strong>
                <span className="orari-pausa-hint">
                  Pausa {pausaLabel({ tipo: form.tipo, pausaMin: form.pausaMin })}
                </span>
              </div>

              {/* INT2 — tap = No pausa on/off; tieni premuto = pausa reale (minuti). */}
              <button
                type="button"
                className={`orari-flag-big${pausaAttiva ? " active green" : ""}`}
                disabled={readOnly}
                aria-pressed={pausaAttiva}
                title="Tocca per 'No pausa'; tieni premuto per inserire i minuti reali"
                onClick={pausaClick}
                onPointerDown={readOnly ? undefined : pausaPointerDown}
                onPointerUp={pausaPointerEnd}
                onPointerLeave={pausaPointerEnd}
                onPointerCancel={pausaPointerEnd}
                onContextMenu={(e) => e.preventDefault()}
              >
                {pausaButtonLabel(form.pausaMin)}
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
          <button
            className={`autisti-button${savedClean ? " orari-save-ok" : ""}`}
            onClick={handleSaveGiorno}
            disabled={saving}
          >
            {saving ? "Salvataggio…" : savedClean ? "Salvato ✓" : "Salva"}
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
                    updateForm({ note: noteDraft });
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

        {/* INT1 — tastierino numerico (sostituisce l'orologio). */}
        {timeKeypad && (
          <div className="orari-modal-backdrop" onClick={() => setTimeKeypad(null)}>
            <div className="orari-modal orari-keypad" onClick={(e) => e.stopPropagation()}>
              <h3>{timeKeypad.field === "inizio" ? "Ora di inizio" : "Ora di fine"}</h3>
              <div className="orari-keypad-display">{digitsToDisplay(timeKeypad.digits)}</div>
              <div className="orari-keypad-grid">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
                  <button type="button" key={k} className="orari-keypad-key" onClick={() => keypadPush(k)}>
                    {k}
                  </button>
                ))}
                <button
                  type="button"
                  className="orari-keypad-key orari-keypad-aux"
                  onClick={keypadBackspace}
                  aria-label="Cancella"
                >
                  ⌫
                </button>
                <button type="button" className="orari-keypad-key" onClick={() => keypadPush("0")}>
                  0
                </button>
                <button
                  type="button"
                  className="orari-keypad-key orari-keypad-ok"
                  onClick={keypadConfirm}
                  disabled={digitsToHHMM(timeKeypad.digits) === null}
                >
                  OK
                </button>
              </div>
              <button className="autisti-button secondary" onClick={() => setTimeKeypad(null)}>
                Annulla
              </button>
            </div>
          </div>
        )}

        {/* INT2 — modale pausa reale (aperto dal touch lungo su "No pausa"). */}
        {pausaModal.open && (
          <div className="orari-modal-backdrop" onClick={() => setPausaModal({ open: false, draft: "" })}>
            <div className="orari-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Pausa effettiva</h3>
              <p className="orari-pausa-sub">
                Inserisci i minuti di pausa realmente fatti: il resto torna a contare come lavoro.
              </p>
              <div className="orari-pausa-presets">
                {[0, 15, 30, 45, 60].map((m) => (
                  <button
                    type="button"
                    key={m}
                    className={`orari-pausa-preset${Number(pausaModal.draft) === m ? " active" : ""}`}
                    onClick={() => setPausaModal({ open: true, draft: String(m) })}
                  >
                    {m === 0 ? "Nessuna" : m === 60 ? "1 ora" : `${m} min`}
                  </button>
                ))}
              </div>
              <label className="orari-pausa-custom">
                <span>Altri minuti</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={600}
                  value={pausaModal.draft}
                  placeholder="es. 40"
                  onChange={(e) => setPausaModal({ open: true, draft: e.target.value })}
                />
              </label>
              <div className="orari-modal-actions">
                <button
                  className="autisti-button"
                  disabled={
                    pausaModal.draft.trim() === "" ||
                    !Number.isFinite(Number(pausaModal.draft)) ||
                    Number(pausaModal.draft) < 0
                  }
                  onClick={() => applyPausaParziale(Number(pausaModal.draft))}
                >
                  Conferma pausa
                </button>
                <button
                  className="autisti-button secondary"
                  onClick={() => setPausaModal({ open: false, draft: "" })}
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
                const pausaMinRec = isAssenza ? null : pausaEffettivaMinuti(rec);
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
                    <td className="orari-tab-x">
                      {pausaMinRec === null
                        ? ""
                        : pausaMinRec <= 0
                          ? "X"
                          : pausaMinRec < MINUTI_PAUSA_FISSA
                            ? `${pausaMinRec}m`
                            : ""}
                    </td>
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
