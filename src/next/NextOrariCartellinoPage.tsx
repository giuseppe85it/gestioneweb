import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./NextOrariCartellinoPage.css";
import {
  readNextOrariCartellinoSnapshot,
  readNextOrariMassivoSnapshots,
  readOrariColleghi,
  type OrarioCartellinoRow,
  type OrarioCartellinoSnapshot,
  type OrarioCollega,
} from "./domain/nextOrariCartellinoDomain";
import { riapriCartellino } from "./writers/nextOrariChiusuraWriter";
import { salvaGiornoAdmin } from "./writers/nextOrariRecordWriter";
import { eliminaGiorniAdmin } from "./writers/nextOrariDeleteWriter";
import {
  buildFooterRows,
  buildGiorniMese,
  calcTotaleNettoMinuti,
  formatDataDisplay,
  formatDataGGMM,
  formatMinutesToHHMM,
  formatMonteOre,
  meseLabelLong,
  MINUTI_PAUSA_FISSA,
  monteOreMinutiDaTotale,
  pausaEffettivaMinuti,
  pausaLabel,
  TIPO_GIORNO_LABEL,
  type OrarioGiornoRecord,
  type TipoGiorno,
} from "../utils/orariCalc";
import PdfPreviewModal from "../components/PdfPreviewModal";
import {
  buildPdfShareText,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../utils/pdfPreview";
import {
  generateOrariCartellinoMassivoPDFBlob,
  generateOrariCartellinoPDFBlob,
} from "../utils/pdfEngine";

const MESI_OPZIONI = Array.from({ length: 12 }, (_, i) => i + 1);

const TIPI_GIORNO: TipoGiorno[] = ["lavoro", "ferie", "malattia", "infortunio", "festivita"];

type EditForm = {
  tipo: TipoGiorno;
  inizio: string;
  fine: string;
  notte: boolean;
  pausaMin: number; // minuti di pausa reali (60 default, 0 = No pausa, parziale)
  note: string;
};

// Classe colore monte ore (SPEC §4bis): pos = verde, neg = rosso, zero = neutro.
function monteCls(min: number | null): string {
  if (min === null || min === 0) return "zero";
  return min > 0 ? "pos" : "neg";
}

// Arricchisce la riga display con monte ore (stringa + colore) per il builder PDF.
function toPdfRow(r: OrarioCartellinoRow) {
  const m = monteOreMinutiDaTotale(r.totale, r.isAssenza);
  return { ...r, monteOre: formatMonteOre(m), monteOreColor: monteCls(m) };
}

// Form di modifica admin dal record esistente, o default vuoto (l'admin compila).
function buildEditForm(rec: OrarioGiornoRecord | null): EditForm {
  if (rec) {
    return {
      tipo: rec.tipo,
      inizio: rec.inizio ?? "",
      fine: rec.fine ?? "",
      notte: rec.notte === true,
      pausaMin: pausaEffettivaMinuti(rec),
      note: rec.note ?? "",
    };
  }
  return { tipo: "lavoro", inizio: "", fine: "", notte: false, pausaMin: MINUTI_PAUSA_FISSA, note: "" };
}

export default function NextOrariCartellinoPage() {
  const navigate = useNavigate();
  const oggi = useMemo(() => new Date(), []);

  const [colleghi, setColleghi] = useState<OrarioCollega[]>([]);
  const [badge, setBadge] = useState<string>("");
  const [year, setYear] = useState<number>(oggi.getFullYear());
  const [month1, setMonth1] = useState<number>(oggi.getMonth() + 1);

  const [snapshot, setSnapshot] = useState<OrarioCartellinoSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riapriBusy, setRiapriBusy] = useState(false);
  const [riapriMsg, setRiapriMsg] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfFileName, setPdfFileName] = useState("cartellino.pdf");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState("Anteprima PDF");
  const [pdfContextLabel, setPdfContextLabel] = useState("Cartellino orari");

  // Modifica admin di un giorno (SPEC §2.2 read-write pieno).
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<string>("");
  const [editForm, setEditForm] = useState<EditForm>(() => buildEditForm(null));
  const [editBusy, setEditBusy] = useState(false);
  const [editMsg, setEditMsg] = useState<string | null>(null);

  // Eliminazione admin di giorni selezionati (DISTRUTTIVA — solo lo spuntato, doppia conferma).
  const [selectMode, setSelectMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  // Carica l'elenco colleghi (badge) una volta.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await readOrariColleghi();
        if (cancelled) return;
        setColleghi(list);
        if (list.length > 0) setBadge((prev) => prev || list[0].badge);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Errore caricamento colleghi.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Carica lo snapshot del cartellino quando cambia badge/mese/anno (o dopo riapri).
  useEffect(() => {
    if (!badge) {
      setSnapshot(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const snap = await readNextOrariCartellinoSnapshot({ badge, year, month1 });
        if (cancelled) return;
        setSnapshot(snap);
      } catch (e) {
        if (cancelled) return;
        setSnapshot(null);
        setError(e instanceof Error ? e.message : "Errore caricamento cartellino.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [badge, year, month1, reloadTick]);

  // Sicurezza eliminazione: al cambio di autista/mese/anno si ESCE dalla modalità
  // selezione e si azzerano le spunte, così non si può mai confermare un'eliminazione
  // con date spuntate su un altro autista/mese.
  useEffect(() => {
    setSelectMode(false);
    setSelectedDates(new Set());
    setDeleteDialogOpen(false);
  }, [badge, year, month1]);

  const colleguNome = useMemo(
    () => colleghi.find((c) => c.badge === badge)?.nome ?? badge,
    [colleghi, badge]
  );

  async function handleRiapri() {
    if (!snapshot || snapshot.stato !== "CHIUSO" || riapriBusy) return;
    setRiapriBusy(true);
    setRiapriMsg(null);
    const res = await riapriCartellino({ badge, year, month1 });
    setRiapriBusy(false);
    if (res.ok) {
      setRiapriMsg("Cartellino riaperto.");
      setReloadTick((t) => t + 1);
    } else {
      setRiapriMsg(res.error ?? "Errore riapertura.");
    }
  }

  // Rilascia l'URL blob dell'anteprima quando cambia/si smonta.
  useEffect(() => () => revokePdfPreviewUrl(pdfUrl), [pdfUrl]);

  const buildShareMessage = () =>
    buildPdfShareText({
      contextLabel: pdfContextLabel,
      dateLabel: `${meseLabelLong(month1)} ${year}`,
      fileName: pdfFileName,
      url: pdfUrl,
    });

  async function handlePreviewPDF() {
    if (!snapshot || pdfBusy) return;
    setPdfBusy(true);
    setPdfShareHint(null);
    setPdfTitle(`Cartellino ${colleguNome} — ${meseLabelLong(month1)} ${year}`);
    setPdfContextLabel(`Cartellino orari ${colleguNome}`);
    try {
      const session = await openPreview({
        source: async () => {
          const gen = await generateOrariCartellinoPDFBlob({
            nomeAutista: colleguNome,
            badge,
            meseLabel: meseLabelLong(month1),
            year,
            month1,
            stato: snapshot.stato === "CHIUSO" ? "Chiuso" : "Aperto",
            rows: snapshot.rows.map(toPdfRow),
            footerRows: buildFooterRows(snapshot.aggregati),
          });
          return { blob: gen.blob, fileName: gen.fileName };
        },
        fileName: `cartellino_${badge}_${String(month1).padStart(2, "0")}-${year}.pdf`,
        previousUrl: pdfUrl,
      });
      setPdfBlob(session.blob);
      setPdfUrl(session.url);
      setPdfFileName(session.fileName);
      setPdfOpen(true);
    } catch (e) {
      setPdfShareHint(e instanceof Error ? e.message : "Errore generazione PDF.");
    } finally {
      setPdfBusy(false);
    }
  }

  // PDF massivo: una pagina per autista con orari nel mese (SPEC §2.2/§7).
  async function handleMassivoPDF() {
    if (pdfBusy) return;
    setPdfBusy(true);
    setPdfShareHint(null);
    try {
      const entries = await readNextOrariMassivoSnapshots({ year, month1 });
      if (entries.length === 0) {
        setPdfShareHint("Nessun autista con orari registrati nel mese.");
        return;
      }
      const inputs = entries.map((e) => ({
        nomeAutista: e.nome,
        badge: e.badge,
        meseLabel: meseLabelLong(month1),
        year,
        month1,
        stato: e.stato === "CHIUSO" ? "Chiuso" : "Aperto",
        rows: e.rows.map(toPdfRow),
        footerRows: buildFooterRows(e.aggregati),
      }));
      setPdfTitle(`Cartellini ${meseLabelLong(month1)} ${year} (${inputs.length})`);
      setPdfContextLabel(`Cartellini orari ${meseLabelLong(month1)} ${year}`);
      const session = await openPreview({
        source: async () => {
          const gen = await generateOrariCartellinoMassivoPDFBlob(inputs);
          return { blob: gen.blob, fileName: gen.fileName };
        },
        fileName: `cartellini_${String(month1).padStart(2, "0")}-${year}.pdf`,
        previousUrl: pdfUrl,
      });
      setPdfBlob(session.blob);
      setPdfUrl(session.url);
      setPdfFileName(session.fileName);
      setPdfOpen(true);
    } catch (e) {
      setPdfShareHint(e instanceof Error ? e.message : "Errore generazione PDF massivo.");
    } finally {
      setPdfBusy(false);
    }
  }

  async function handleSharePDF() {
    if (!pdfBlob) {
      const copied = await copyTextToClipboard(buildShareMessage());
      setPdfShareHint(copied ? "Testo copiato." : "Apri prima un'anteprima PDF.");
      return;
    }
    const result = await sharePdfFile({
      blob: pdfBlob,
      fileName: pdfFileName,
      title: `Cartellino orari ${colleguNome}`,
      text: buildShareMessage(),
    });
    if (result.status === "shared") {
      setPdfShareHint("PDF condiviso.");
      return;
    }
    if (result.status === "aborted") return;
    const copied = await copyTextToClipboard(buildShareMessage());
    setPdfShareHint(
      copied ? "Condivisione non disponibile: testo copiato." : "Condivisione non disponibile."
    );
  }

  async function handleCopyPdfLink() {
    const copied = await copyTextToClipboard(buildShareMessage());
    setPdfShareHint(copied ? "Testo copiato." : "Copia non disponibile.");
  }

  function handleWhatsAppPDF() {
    window.open(buildWhatsAppShareUrl(buildShareMessage()), "_blank", "noopener,noreferrer");
  }

  function closePdfPreview() {
    revokePdfPreviewUrl(pdfUrl);
    setPdfOpen(false);
    setPdfUrl(null);
    setPdfBlob(null);
    setPdfShareHint(null);
  }

  // ---- Modifica admin di un giorno (update-in-place, anche a mese chiuso) ----
  const giorniMeseEdit = useMemo(() => buildGiorniMese(year, month1), [year, month1]);

  function findRecord(data: string): OrarioGiornoRecord | null {
    return snapshot?.records.find((r) => r.data === data) ?? null;
  }

  function openEdit(data: string) {
    if (!data) return;
    setEditData(data);
    setEditForm(buildEditForm(findRecord(data)));
    setEditMsg(null);
    setEditOpen(true);
  }

  function changeEditDay(data: string) {
    setEditData(data);
    setEditForm(buildEditForm(findRecord(data)));
  }

  function closeEdit() {
    setEditOpen(false);
    setEditMsg(null);
  }

  async function handleSaveEdit() {
    if (!editData || !badge || editBusy) return;
    setEditBusy(true);
    setEditMsg(null);
    const res = await salvaGiornoAdmin({
      badge,
      data: editData,
      tipo: editForm.tipo,
      inizio: editForm.inizio || null,
      fine: editForm.fine || null,
      notte: editForm.notte,
      pausaMin: editForm.pausaMin,
      note: editForm.note,
    });
    setEditBusy(false);
    if (res.ok) {
      setEditOpen(false);
      setReloadTick((t) => t + 1);
    } else {
      setEditMsg(res.error ?? "Errore salvataggio.");
    }
  }

  // ---- Eliminazione admin: modalità selezione + conferma obbligatoria ----
  function enterSelectMode() {
    setSelectMode(true);
    setSelectedDates(new Set());
    setDeleteMsg(null);
  }
  function exitSelectMode() {
    setSelectMode(false);
    setSelectedDates(new Set());
    setDeleteDialogOpen(false);
    setDeleteMsg(null);
  }
  function toggleSelDate(data: string) {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(data)) next.delete(data);
      else next.add(data);
      return next;
    });
  }
  // Esegue il delete SOLO dopo la conferma esplicita del dialog.
  async function confirmDelete() {
    if (!badge || deleteBusy || selectedDates.size === 0) return;
    setDeleteBusy(true);
    setDeleteMsg(null);
    const res = await eliminaGiorniAdmin({ badge, date: Array.from(selectedDates) });
    setDeleteBusy(false);
    if (res.ok) {
      setDeleteDialogOpen(false);
      setSelectMode(false);
      setSelectedDates(new Set());
      setReloadTick((t) => t + 1); // ricarica: footer/monte ore si ricalcolano da soli
    } else {
      setDeleteMsg(res.error ?? "Errore eliminazione.");
    }
  }

  const agg = snapshot?.aggregati;

  return (
    <div className="next-orari-page">
      <div className="next-orari-head">
        <h2>Cartellino orari autista</h2>
        <button type="button" className="next-orari-back" onClick={() => navigate("/next/autisti-admin")}>
          ← Admin autisti
        </button>
      </div>

      <div className="next-orari-toolbar">
        <label className="next-orari-field">
          <span>Autista</span>
          <select value={badge} onChange={(e) => setBadge(e.target.value)}>
            {colleghi.length === 0 && <option value="">Nessun collega</option>}
            {colleghi.map((c) => (
              <option key={c.badge} value={c.badge}>
                {c.nome} ({c.badge})
              </option>
            ))}
          </select>
        </label>

        <label className="next-orari-field">
          <span>Mese</span>
          <select value={month1} onChange={(e) => setMonth1(Number(e.target.value))}>
            {MESI_OPZIONI.map((m) => (
              <option key={m} value={m}>
                {meseLabelLong(m)}
              </option>
            ))}
          </select>
        </label>

        <label className="next-orari-field">
          <span>Anno</span>
          <div className="next-orari-year">
            <button type="button" onClick={() => setYear((y) => y - 1)} aria-label="Anno precedente">
              ‹
            </button>
            <span>{year}</span>
            <button type="button" onClick={() => setYear((y) => y + 1)} aria-label="Anno successivo">
              ›
            </button>
          </div>
        </label>

        {snapshot && (
          <span className={`next-orari-stato ${snapshot.stato === "CHIUSO" ? "chiuso" : "aperto"}`}>
            {snapshot.stato}
          </span>
        )}
        {snapshot?.stato === "CHIUSO" && (
          <button type="button" className="next-orari-riapri" onClick={handleRiapri} disabled={riapriBusy}>
            {riapriBusy ? "Riapertura…" : "RIAPRI cartellino"}
          </button>
        )}
        {snapshot && (
          <button
            type="button"
            className="next-orari-pdf"
            onClick={handlePreviewPDF}
            disabled={pdfBusy}
          >
            {pdfBusy ? "Generazione…" : "Anteprima PDF"}
          </button>
        )}
        <button type="button" className="next-orari-pdf" onClick={handleMassivoPDF} disabled={pdfBusy}>
          {pdfBusy ? "Generazione…" : "PDF massivo"}
        </button>
        {snapshot && !selectMode && (
          <button
            type="button"
            className="next-orari-edit-btn"
            onClick={() => openEdit(giorniMeseEdit[0]?.data ?? "")}
            disabled={!giorniMeseEdit.length}
          >
            Modifica giorno
          </button>
        )}
        {snapshot && !selectMode && snapshot.rows.length > 0 && (
          <button type="button" className="next-orari-elimina" onClick={enterSelectMode}>
            Elimina
          </button>
        )}
        {selectMode && (
          <>
            <button
              type="button"
              className="next-orari-delete-confirm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={selectedDates.size === 0}
            >
              Elimina selezionati ({selectedDates.size})
            </button>
            <button type="button" className="next-orari-back" onClick={exitSelectMode}>
              Annulla
            </button>
          </>
        )}
        {riapriMsg && <span className="next-orari-msg">{riapriMsg}</span>}
        {pdfShareHint && <span className="next-orari-msg">{pdfShareHint}</span>}
      </div>

      {error && <div className="next-orari-error">{error}</div>}
      {loading && <div className="next-orari-loading">Caricamento…</div>}

      {!loading && snapshot && (
        <>
          <div className="next-orari-caption">
            {colleguNome} — {meseLabelLong(month1)} {year} ({snapshot.recordCount} giorni registrati)
          </div>

          <table className="next-orari-table">
            <thead>
              <tr>
                {selectMode && <th className="next-orari-sel" aria-label="Seleziona" />}
                <th>Data</th>
                <th>Giorno</th>
                <th>Inizio</th>
                <th>Fine</th>
                <th>Totale</th>
                <th>Monte ore</th>
                <th>No pausa</th>
                <th>Notte</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.rows.length === 0 ? (
                <tr>
                  <td colSpan={selectMode ? 10 : 9} className="next-orari-empty">
                    Nessun giorno registrato per questo mese.
                  </td>
                </tr>
              ) : (
                snapshot.rows.map((r) => {
                  const monteMin = monteOreMinutiDaTotale(r.totale, r.isAssenza);
                  return (
                    <tr
                      key={r.data}
                      className={`${selectMode ? "next-orari-selrow" : "next-orari-rowclick"}${r.isAssenza ? " assenza" : ""}${selectMode && selectedDates.has(r.data) ? " selected" : ""}`}
                      onClick={selectMode ? () => toggleSelDate(r.data) : () => openEdit(r.data)}
                      title={selectMode ? "Seleziona per eliminare" : "Modifica questo giorno"}
                    >
                      {selectMode && (
                        <td className="next-orari-sel" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedDates.has(r.data)}
                            onChange={() => toggleSelDate(r.data)}
                            aria-label={`Seleziona ${r.dataDisplay}`}
                          />
                        </td>
                      )}
                      <td>{r.dataDisplay}</td>
                      <td>{r.giorno}</td>
                      {r.isAssenza ? (
                        <td colSpan={3} className="next-orari-assenza-cell">
                          {r.tipoLabel}
                        </td>
                      ) : (
                        <>
                          <td>{r.inizio}</td>
                          <td>{r.fine}</td>
                          <td className="next-orari-tot">{r.totale}</td>
                        </>
                      )}
                      <td className={`next-orari-monte ${monteCls(monteMin)}`}>{formatMonteOre(monteMin)}</td>
                      <td>{r.pausa === "No" ? "X" : r.pausa === "Sì" || r.pausa === "-" ? "" : r.pausa}</td>
                      <td>{r.notte ? "Sì" : "—"}</td>
                      <td className="next-orari-note-cell">{r.note}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {agg && (
            <div className="next-orari-footer">
              {buildFooterRows(agg).map((row) => (
                <div key={row.label} className={row.variant ? `monte-${row.variant}` : undefined}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {editOpen && (
        <div className="next-orari-edit-backdrop" onClick={closeEdit}>
          <div className="next-orari-edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Modifica giorno — {colleguNome}</h3>
            {snapshot?.stato === "CHIUSO" && (
              <p className="next-orari-edit-hint">
                Mese CHIUSO: la modifica admin è comunque consentita (l'autista resta bloccato).
              </p>
            )}

            <label className="next-orari-edit-field">
              <span>Giorno</span>
              <select value={editData} onChange={(e) => changeEditDay(e.target.value)}>
                {giorniMeseEdit.map((g) => (
                  <option key={g.data} value={g.data}>
                    {formatDataDisplay(g.data)}
                  </option>
                ))}
              </select>
            </label>

            <div className="next-orari-edit-tipi">
              {TIPI_GIORNO.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={editForm.tipo === t ? "active" : ""}
                  onClick={() => setEditForm((f) => ({ ...f, tipo: t }))}
                >
                  {TIPO_GIORNO_LABEL[t]}
                </button>
              ))}
            </div>

            {editForm.tipo === "lavoro" && (
              <>
                <div className="next-orari-edit-row">
                  <label>
                    <span>Inizio</span>
                    <input
                      type="time"
                      value={editForm.inizio}
                      onChange={(e) => setEditForm((f) => ({ ...f, inizio: e.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Fine</span>
                    <input
                      type="time"
                      value={editForm.fine}
                      onChange={(e) => setEditForm((f) => ({ ...f, fine: e.target.value }))}
                    />
                  </label>
                </div>
                <div className="next-orari-edit-tot">
                  Totale:{" "}
                  <strong>
                    {formatMinutesToHHMM(
                      calcTotaleNettoMinuti({
                        tipo: editForm.tipo,
                        inizio: editForm.inizio,
                        fine: editForm.fine,
                        pausaMin: editForm.pausaMin,
                      })
                    )}
                  </strong>{" "}
                  (Pausa {pausaLabel({ tipo: editForm.tipo, pausaMin: editForm.pausaMin })})
                </div>
                <div className="next-orari-edit-flags">
                  <label>
                    <input
                      type="checkbox"
                      checked={editForm.notte}
                      onChange={(e) => setEditForm((f) => ({ ...f, notte: e.target.checked }))}
                    />
                    Notte
                  </label>
                  <label className="next-orari-pausa-min">
                    Pausa (min)
                    <input
                      type="number"
                      min={0}
                      max={600}
                      value={editForm.pausaMin}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          pausaMin: Math.max(0, Math.round(Number(e.target.value) || 0)),
                        }))
                      }
                    />
                    <span className="next-orari-pausa-hint">0 = nessuna · 60 = 1h</span>
                  </label>
                </div>
              </>
            )}

            <label className="next-orari-edit-field">
              <span>Note</span>
              <textarea
                value={editForm.note}
                onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))}
              />
            </label>

            {editMsg && <p className="next-orari-msg">{editMsg}</p>}

            <div className="next-orari-edit-actions">
              <button type="button" className="next-orari-riapri" onClick={handleSaveEdit} disabled={editBusy}>
                {editBusy ? "Salvataggio…" : "Salva"}
              </button>
              <button type="button" className="next-orari-back" onClick={closeEdit}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteDialogOpen && (
        <div
          className="next-orari-edit-backdrop"
          onClick={() => {
            if (!deleteBusy) setDeleteDialogOpen(false);
          }}
        >
          <div className="next-orari-edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Elimina giorni — {colleguNome}</h3>
            <p className="next-orari-delete-warn">
              Stai per eliminare DEFINITIVAMENTE {selectedDates.size} giorno/i:
            </p>
            <p className="next-orari-delete-dates">
              {Array.from(selectedDates)
                .sort()
                .map((d) => formatDataGGMM(d))
                .join(", ")}
            </p>
            <p className="next-orari-delete-warn">L'operazione NON è reversibile.</p>
            {deleteMsg && <p className="next-orari-msg">{deleteMsg}</p>}
            <div className="next-orari-edit-actions">
              <button
                type="button"
                className="next-orari-delete-confirm"
                onClick={confirmDelete}
                disabled={deleteBusy}
              >
                {deleteBusy ? "Eliminazione…" : "Conferma elimina"}
              </button>
              <button
                type="button"
                className="next-orari-back"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteBusy}
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      <PdfPreviewModal
        open={pdfOpen}
        title={pdfTitle}
        pdfUrl={pdfUrl}
        fileName={pdfFileName}
        hint={pdfShareHint}
        shareTitle={pdfContextLabel}
        shareText={buildShareMessage()}
        onClose={closePdfPreview}
        onShare={handleSharePDF}
        onCopyLink={handleCopyPdfLink}
        onWhatsApp={handleWhatsAppPDF}
      />
    </div>
  );
}
