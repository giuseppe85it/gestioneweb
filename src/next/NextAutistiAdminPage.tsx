import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../autistiInbox/AutistiAdmin.css";
import "./next-autisti-admin-reader.css";

import PdfPreviewModal from "../components/PdfPreviewModal";
import { formatDateTimeUI, formatDateUI } from "../utils/dateFormat";
import { generateControlloPDFBlob, generateSegnalazionePDFBlob } from "../utils/pdfEngine";
import type { HomeEvent } from "../utils/homeEvents";
import { loadHomeEvents } from "../utils/homeEvents";
import { openPreview, revokePdfPreviewUrl } from "../utils/pdfPreview";
import { getItemSync } from "../utils/storageSync";

type TabKey =
  | "rifornimenti"
  | "segnalazioni"
  | "controlli"
  | "gomme"
  | "storico_cambio"
  | "attrezzature";

const CAMBIO_ASSETTO_TIPO = "CAMBIO_ASSETTO";
const KEY_STORICO_EVENTI_OPERATIVI = "@storico_eventi_operativi";
const KEY_SESSIONI = "@autisti_sessione_attive";
const KEY_MEZZI = "@mezzi_aziendali";

function normalizeArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { value?: unknown[] }).value)) {
    return (raw as { value: T[] }).value;
  }
  return [];
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeTarga(value: unknown) {
  return String(value ?? "").toUpperCase().replace(/\s+/g, "").trim();
}

function toTs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === "object") {
    const candidate = value as { toMillis?: () => number; seconds?: number };
    if (typeof candidate.toMillis === "function") return candidate.toMillis();
    if (typeof candidate.seconds === "number") return candidate.seconds * 1000;
  }
  return null;
}

function isSameDay(ts: number, day: Date) {
  const current = new Date(ts);
  return (
    current.getFullYear() === day.getFullYear() &&
    current.getMonth() === day.getMonth() &&
    current.getDate() === day.getDate()
  );
}

function formatDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const dayValue = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayValue}`;
}

function formatHHMM(ts: number | null | undefined) {
  if (ts == null) return "—";
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "—";
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function getRecordTs(record: any, fallback = Date.now()) {
  return toTs(record?.timestamp ?? record?.data) ?? fallback;
}

function getFotoList(record: any) {
  const list: string[] = [];
  if (Array.isArray(record?.foto)) {
    for (const foto of record.foto) {
      if (typeof foto === "string") list.push(foto);
      else {
        if (foto?.dataUrl) list.push(String(foto.dataUrl));
        if (foto?.url) list.push(String(foto.url));
      }
    }
  }
  if (record?.fotoDataUrl) list.push(String(record.fotoDataUrl));
  if (record?.fotoUrl) list.push(String(record.fotoUrl));
  if (Array.isArray(record?.fotoUrls)) {
    record.fotoUrls.forEach((url: unknown) => {
      if (url) list.push(String(url));
    });
  }
  return Array.from(new Set(list.map((value) => String(value).trim()).filter(Boolean)));
}

function buildPdfSafeSegnalazioneRecord(record: any, fotoList: string[]) {
  const pdfSafe: any = { ...(record || {}) };
  delete pdfSafe.foto;
  delete pdfSafe.fotoUrl;
  delete pdfSafe.fotoUrls;
  delete pdfSafe.fotoDataUrl;
  delete pdfSafe.fotoStoragePath;
  delete pdfSafe.fotoStoragePaths;

  const fotoUrls = fotoList.filter((value) => value.startsWith("http"));
  if (fotoUrls.length) {
    pdfSafe.fotoUrls = fotoUrls;
    return pdfSafe;
  }

  const originalDataUrl =
    typeof record?.fotoDataUrl === "string" && record.fotoDataUrl.startsWith("data:image/")
      ? String(record.fotoDataUrl)
      : null;
  const thumbDataUrl = fotoList.find((value) => value.startsWith("data:image/")) || null;
  if (originalDataUrl || thumbDataUrl) {
    pdfSafe.fotoDataUrl = originalDataUrl || thumbDataUrl;
  }
  return pdfSafe;
}

function getCategoria(record: any): string | null {
  const value = record?.categoria ?? record?.tipologia ?? record?.tipo ?? null;
  return value ? String(value) : null;
}

function renderTargaLabel(
  label: string,
  targa: string | null,
  categoria: string | null,
  variant: "ok" | "danger" | "neutral",
) {
  return (
    <div className={`targa-pill ${variant}`}>
      <span className="targa-sub">{label}</span>
      <span className="targa-main">{targa || "—"}</span>
      {categoria ? <span className="targa-sub">{categoria}</span> : null}
    </div>
  );
}

export default function NextAutistiAdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("rifornimenti");
  const [day, setDay] = useState<Date>(() => new Date());
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<HomeEvent[]>([]);
  const [sessioniRaw, setSessioniRaw] = useState<any[]>([]);
  const [storicoRaw, setStoricoRaw] = useState<any[]>([]);
  const [mezziRaw, setMezziRaw] = useState<any[]>([]);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [segnaFilterTarga, setSegnaFilterTarga] = useState("");
  const [segnaFilterAmbito, setSegnaFilterAmbito] = useState<"tutti" | "motrice" | "rimorchio">(
    "tutti",
  );
  const [segnaOnlyNuove, setSegnaOnlyNuove] = useState(false);
  const [ctrlFilterTarga, setCtrlFilterTarga] = useState("");
  const [ctrlFilterTarget, setCtrlFilterTarget] = useState<
    "tutti" | "motrice" | "rimorchio" | "entrambi"
  >("tutti");
  const [ctrlOnlyKo, setCtrlOnlyKo] = useState(false);
  const [gommeFilterTarga, setGommeFilterTarga] = useState("");
  const [gommeOnlyNuove, setGommeOnlyNuove] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState("autisti-admin-reader.pdf");
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Anteprima PDF");
  const datePickerRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const [nextEvents, storico, sessioni, mezzi] = await Promise.all([
          loadHomeEvents(day),
          getItemSync(KEY_STORICO_EVENTI_OPERATIVI),
          getItemSync(KEY_SESSIONI),
          getItemSync(KEY_MEZZI),
        ]);

        if (!alive) return;
        setEvents(nextEvents);
        setStoricoRaw(normalizeArray(storico));
        setSessioniRaw(normalizeArray(sessioni));
        setMezziRaw(normalizeArray(mezzi));
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => {
      alive = false;
    };
  }, [day]);

  useEffect(() => {
    return () => revokePdfPreviewUrl(pdfPreviewUrl);
  }, [pdfPreviewUrl]);

  const mezziByTarga = useMemo(() => {
    const map = new Map<string, any>();
    mezziRaw.forEach((record) => {
      const targa = normalizeTarga(record?.targa ?? record?.mezzoTarga ?? null);
      if (targa) map.set(targa, record);
    });
    return map;
  }, [mezziRaw]);

  const sessioniLive = useMemo(() => {
    const motriciMap = new Map<string, string[]>();
    sessioniRaw.forEach((record) => {
      const motrice = normalizeTarga(record?.targaMotrice ?? record?.targaCamion ?? null);
      if (!motrice) return;
      const autista = String(record?.nomeAutista ?? record?.autistaNome ?? record?.autista ?? "-");
      const current = motriciMap.get(motrice);
      if (current) current.push(autista);
      else motriciMap.set(motrice, [autista]);
    });

    return sessioniRaw
      .map((record, index) => {
        const targaMotrice = record?.targaMotrice ?? record?.targaCamion ?? null;
        const targaRimorchio = record?.targaRimorchio ?? null;
        const ts = toTs(record?.timestamp);
        const stato = targaMotrice && targaRimorchio
          ? "ACCOPPIATO"
          : targaMotrice
          ? "SOLO MOTRICE"
          : targaRimorchio
          ? "RIMORCHIO SENZA MOTRICE"
          : "SESSIONE INCOMPLETA";
        const autista = String(record?.nomeAutista ?? record?.autistaNome ?? record?.autista ?? "-");
        const badge = String(record?.badgeAutista ?? record?.badge ?? "-");
        const peers =
          motriciMap.get(normalizeTarga(targaMotrice))?.filter((value) => value !== autista) ?? [];

        return {
          key: `${badge}_${index}`,
          ts,
          stato,
          autista,
          badge,
          targaMotrice: targaMotrice ? String(targaMotrice) : null,
          targaRimorchio: targaRimorchio ? String(targaRimorchio) : null,
          conflict: peers.length > 0,
          conflictText: peers.length > 0 ? `Motrice in uso anche da: ${peers.join(", ")}` : null,
        };
      })
      .filter((record) => record.targaMotrice || record.targaRimorchio)
      .sort((a, b) => {
        if (a.ts == null && b.ts == null) return 0;
        if (a.ts == null) return 1;
        if (b.ts == null) return -1;
        return b.ts - a.ts;
      });
  }, [sessioniRaw]);

  const rifornimenti = useMemo(
    () =>
      [...events]
        .filter((event) => event.tipo === "rifornimento")
        .sort((a, b) => b.timestamp - a.timestamp),
    [events],
  );

  const segnalazioniFiltered = useMemo(() => {
    const filterTarga = normalizeText(segnaFilterTarga);
    return events
      .filter((event) => event.tipo === "segnalazione")
      .map((event, index) => {
        const record = event.payload || {};
        const stato = String(record?.stato ?? "").toLowerCase();
        return {
          key: String(event.id ?? record?.id ?? `seg_${index}`),
          record,
          ts: getRecordTs(record, event.timestamp),
          isNuova: stato === "nuova" || record?.letta === false,
          targaMain: String(record?.targa ?? record?.targaCamion ?? record?.targaMotrice ?? "-"),
          targaRimorchio: record?.targaRimorchio ? String(record.targaRimorchio) : null,
          ambito: String(record?.ambito ?? record?.target ?? "").toUpperCase() || "-",
          autista: String(record?.autistaNome ?? record?.nomeAutista ?? record?.autista ?? "-"),
          badge: String(record?.badgeAutista ?? "-"),
          fotoList: getFotoList(record),
        };
      })
      .filter((item) => {
        const targaBlob = normalizeText(`${item.targaMain} ${item.targaRimorchio ?? ""}`);
        const targaMatch = !filterTarga || targaBlob.includes(filterTarga);
        const ambitoMatch =
          segnaFilterAmbito === "tutti" || normalizeText(item.ambito) === segnaFilterAmbito;
        const statusMatch = !segnaOnlyNuove || item.isNuova;
        return targaMatch && ambitoMatch && statusMatch;
      })
      .sort((a, b) => b.ts - a.ts);
  }, [events, segnaFilterAmbito, segnaFilterTarga, segnaOnlyNuove]);

  const controlliFiltered = useMemo(() => {
    const filterTarga = normalizeText(ctrlFilterTarga);
    return events
      .filter((event) => event.tipo === "controllo")
      .map((event, index) => {
        const record = event.payload || {};
        const check = record?.check && typeof record.check === "object" ? record.check : {};
        const koList = Object.entries(check)
          .filter(([, value]) => value === false)
          .map(([key]) => String(key).toUpperCase());
        return {
          key: String(event.id ?? record?.id ?? `ctrl_${index}`),
          record,
          ts: getRecordTs(record, event.timestamp),
          isKO: koList.length > 0,
          koList,
          target: String(record?.target ?? "").toLowerCase() || "-",
          autista: String(record?.autistaNome ?? record?.nomeAutista ?? record?.autista ?? "-"),
          badge: String(record?.badgeAutista ?? "-"),
          targaMotrice: record?.targaCamion ?? record?.targaMotrice ?? null,
          targaRimorchio: record?.targaRimorchio ?? null,
        };
      })
      .filter((item) => {
        const targaBlob = normalizeText(`${item.targaMotrice ?? ""} ${item.targaRimorchio ?? ""}`);
        const targaMatch = !filterTarga || targaBlob.includes(filterTarga);
        const targetMatch = ctrlFilterTarget === "tutti" || item.target === ctrlFilterTarget;
        const koMatch = !ctrlOnlyKo || item.isKO;
        return targaMatch && targetMatch && koMatch;
      })
      .sort((a, b) => {
        if (a.isKO !== b.isKO) return a.isKO ? -1 : 1;
        return b.ts - a.ts;
      });
  }, [ctrlFilterTarga, ctrlFilterTarget, ctrlOnlyKo, events]);

  const gommeFiltered = useMemo(() => {
    const filterTarga = normalizeText(gommeFilterTarga);
    return events
      .filter((event) => event.tipo === "gomme")
      .map((event, index) => {
        const record = event.payload || {};
        const stato = String(record?.stato ?? "").toLowerCase();
        return {
          key: String(event.id ?? record?.id ?? `gomme_${index}`),
          record,
          ts: getRecordTs(record, event.timestamp),
          isNuova: stato === "nuova" || record?.letta === false,
          targa: String(record?.targetTarga ?? record?.targa ?? "-"),
          target: String(record?.targetType ?? "").toUpperCase() || "-",
          autista: String(
            record?.autista?.nome ?? record?.autistaNome ?? record?.nomeAutista ?? record?.autista ?? "-",
          ),
          badge: String(record?.autista?.badge ?? record?.badgeAutista ?? "-"),
          tipo: String(record?.tipo ?? "-").toUpperCase(),
          km:
            record?.km === null || record?.km === undefined || record?.km === ""
              ? "-"
              : String(record.km),
          stato: stato || "-",
          rotazione: record?.rotazioneSchema ?? record?.rotazioneText ?? null,
        };
      })
      .filter((item) => {
        const targaMatch = !filterTarga || normalizeText(item.targa).includes(filterTarga);
        const statusMatch = !gommeOnlyNuove || item.isNuova;
        return targaMatch && statusMatch;
      })
      .sort((a, b) => {
        if (a.isNuova !== b.isNuova) return a.isNuova ? -1 : 1;
        return b.ts - a.ts;
      });
  }, [events, gommeFilterTarga, gommeOnlyNuove]);

  const richiesteAttrezzature = useMemo(
    () =>
      [...events]
        .filter((event) => event.tipo === "richiesta_attrezzature")
        .sort((a, b) => b.timestamp - a.timestamp),
    [events],
  );

  const storicoCambio = useMemo(() => {
    return storicoRaw
      .filter((record) => String(record?.tipo ?? record?.tipoOperativo ?? "") === CAMBIO_ASSETTO_TIPO)
      .map((record, index) => {
        const ts = toTs(record?.timestamp);
        if (!ts || !isSameDay(ts, day)) return null;
        return {
          key: String(record?.id ?? `storico_${index}`),
          ts,
          autista: String(record?.autista ?? record?.autistaNome ?? record?.nomeAutista ?? "-"),
          badge: String(record?.badgeAutista ?? record?.badge ?? "-"),
          primaMotrice: record?.prima?.motrice ?? record?.prima?.targaMotrice ?? record?.prima?.targaCamion ?? null,
          primaRimorchio: record?.prima?.rimorchio ?? record?.prima?.targaRimorchio ?? null,
          dopoMotrice: record?.dopo?.motrice ?? record?.dopo?.targaMotrice ?? record?.dopo?.targaCamion ?? null,
          dopoRimorchio: record?.dopo?.rimorchio ?? record?.dopo?.targaRimorchio ?? null,
          luogo: record?.luogo ? String(record.luogo) : null,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.ts - a.ts);
  }, [day, storicoRaw]);

  const openDatePicker = () => {
    const input = datePickerRef.current;
    if (!input) return;
    const picker = (input as HTMLInputElement & { showPicker?: () => void }).showPicker;
    if (picker) picker.call(input);
    else input.click();
  };

  const handleDatePickerChange = (value: string) => {
    if (!value) return;
    const [year, month, dayValue] = value.split("-").map(Number);
    if (!year || !month || !dayValue) return;
    const next = new Date(year, month - 1, dayValue);
    if (!Number.isNaN(next.getTime())) setDay(next);
  };

  const openSegnalazionePdfPreview = async (record: any, fotoList: string[]) => {
    try {
      const preview = await openPreview({
        source: async () => generateSegnalazionePDFBlob(buildPdfSafeSegnalazioneRecord(record, fotoList)),
        fileName: `segnalazione-autisti-admin-next-${formatDateInputValue(day)}.pdf`,
        previousUrl: pdfPreviewUrl,
      });
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewTitle("Anteprima PDF segnalazione");
      setPdfPreviewUrl(preview.url);
      setPdfPreviewOpen(true);
    } catch (error) {
      console.error("Errore anteprima PDF segnalazione clone:", error);
    }
  };

  const openControlloPdfPreview = async (record: any) => {
    try {
      const preview = await openPreview({
        source: async () => generateControlloPDFBlob(record),
        fileName: `controllo-autisti-admin-next-${formatDateInputValue(day)}.pdf`,
        previousUrl: pdfPreviewUrl,
      });
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewTitle("Anteprima PDF controllo mezzo");
      setPdfPreviewUrl(preview.url);
      setPdfPreviewOpen(true);
    } catch (error) {
      console.error("Errore anteprima PDF controllo clone:", error);
    }
  };

  return (
    <div className="autisti-admin-page">
      <div className="autisti-admin-wrap">
        <div className="autisti-admin-head">
          <div className="autisti-admin-head-left">
            <button
              type="button"
              className="autisti-admin-logo"
              onClick={() => navigate("/next")}
              title="Home clone"
            >
              <img src="/logo.png" alt="Logo" />
            </button>
            <button
              type="button"
              className="autisti-admin-back"
              onClick={() => navigate("/next/autisti-inbox")}
            >
              Torna a Autisti Inbox
            </button>
          </div>

          <h1>Centro rettifica dati (admin)</h1>
        </div>

        <div className="autisti-admin-card autisti-admin-reader-notice">
          <div className="autisti-admin-card-head">
            <h2>Reader-first clone</h2>
            <span className="autisti-admin-reader-lock">Nessuna rettifica disponibile</span>
          </div>
          <p>
            Questa tranche apre solo la consultazione del modulo madre: tabs, filtri, foto e
            anteprime PDF. Le azioni che nel gestionale reale scrivono, cancellano o creano
            lavori restano volutamente fuori perimetro.
          </p>
          <p className="autisti-admin-reader-muted">
            La pagina legge i dataset reali gia usati da `Autisti Admin`. I record clone-local
            `@next_clone_autisti:*` non sono ancora inclusi in questa fase.
          </p>
        </div>

        <div className="autisti-admin-card">
          <div className="autisti-admin-card-head">
            <h2>Sessioni attive (LIVE)</h2>
            <span className="autisti-admin-reader-lock">Consultazione</span>
          </div>

          {!loading && sessioniLive.length === 0 ? (
            <div className="empty">Nessuna sessione attiva trovata.</div>
          ) : null}

          {sessioniLive.map((sessione) => {
            const motriceCategoria = sessione.targaMotrice
              ? getCategoria(mezziByTarga.get(normalizeTarga(sessione.targaMotrice)))
              : null;
            const rimorchioCategoria = sessione.targaRimorchio
              ? getCategoria(mezziByTarga.get(normalizeTarga(sessione.targaRimorchio)))
              : null;

            return (
              <div
                key={sessione.key}
                className={`row ${sessione.conflict ? "pill-danger conflict" : ""}`}
              >
                <div className="row-left">
                  <div className="time">{formatHHMM(sessione.ts)}</div>
                  <div className="main">
                    <div className="line1">
                      <span className={`pill ${sessione.conflict ? "pill-danger" : "pill-ok"}`}>
                        {sessione.stato}
                      </span>
                      <span className="sep">|</span>
                      <span>{sessione.autista}</span>
                      <span className="sep">|</span>
                      <span className="muted">badge {sessione.badge}</span>
                    </div>
                    <div className="line2 targa-pills-row">
                      {renderTargaLabel(
                        "Motrice",
                        sessione.targaMotrice,
                        motriceCategoria,
                        sessione.targaMotrice ? "ok" : "neutral",
                      )}
                      {renderTargaLabel(
                        "Rimorchio",
                        sessione.targaRimorchio,
                        rimorchioCategoria,
                        !sessione.targaMotrice && sessione.targaRimorchio ? "danger" : "neutral",
                      )}
                    </div>
                    {sessione.conflictText ? (
                      <div className="line2 conflict-note">{sessione.conflictText}</div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="autisti-admin-topbar">
          <div className="autisti-admin-tabs">
            <button
              className={tab === "rifornimenti" ? "tab active" : "tab"}
              onClick={() => setTab("rifornimenti")}
              type="button"
            >
              Rifornimenti
            </button>
            <button
              className={tab === "segnalazioni" ? "tab active" : "tab"}
              onClick={() => setTab("segnalazioni")}
              type="button"
            >
              Segnalazioni
            </button>
            <button
              className={tab === "controlli" ? "tab active" : "tab"}
              onClick={() => setTab("controlli")}
              type="button"
            >
              Controllo mezzo
            </button>
            <button
              className={tab === "gomme" ? "tab active" : "tab"}
              onClick={() => setTab("gomme")}
              type="button"
            >
              Gomme
            </button>
            <button
              className={tab === "storico_cambio" ? "tab active" : "tab"}
              onClick={() => setTab("storico_cambio")}
              type="button"
            >
              Cambio mezzo (storico canonico)
            </button>
            <button
              className={tab === "attrezzature" ? "tab active" : "tab"}
              onClick={() => setTab("attrezzature")}
              type="button"
            >
              Richieste attrezzature
            </button>
          </div>

          <div className="autisti-admin-datebar">
            <button
              type="button"
              className="nav"
              onClick={() =>
                setDay((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate() - 1))
              }
              title="Giorno precedente"
            >
              {"<"}
            </button>

            <div className="autisti-admin-date-picker">
              <button
                type="button"
                className="label autisti-admin-date-label"
                onClick={openDatePicker}
                aria-label="Seleziona data"
              >
                {formatDateUI(day)}
              </button>
              <input
                ref={datePickerRef}
                className="autisti-admin-date-input"
                type="date"
                value={formatDateInputValue(day)}
                onChange={(event) => handleDatePickerChange(event.target.value)}
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>

            <button
              type="button"
              className="nav"
              onClick={() =>
                setDay((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1))
              }
              title="Giorno successivo"
            >
              {">"}
            </button>
          </div>
        </div>

        <div className="autisti-admin-card">
          <div className="autisti-admin-card-head">
            <h2>
              {tab === "storico_cambio"
                ? "Cambio mezzo (storico canonico)"
                : tab === "controlli"
                ? "Controllo mezzo"
                : tab === "attrezzature"
                ? "Richieste attrezzature"
                : tab.toUpperCase()}
            </h2>
            <div className="autisti-admin-reader-actions">
              {tab === "segnalazioni" ? (
                <button
                  type="button"
                  className="edit"
                  onClick={() => navigate("/next/autisti-inbox/segnalazioni")}
                >
                  Apri listato clone
                </button>
              ) : null}
              {tab === "controlli" ? (
                <button
                  type="button"
                  className="edit"
                  onClick={() => navigate("/next/autisti-inbox/controlli")}
                >
                  Apri listato clone
                </button>
              ) : null}
              {tab === "gomme" ? (
                <button
                  type="button"
                  className="edit"
                  onClick={() => navigate("/next/autisti-inbox/gomme")}
                >
                  Apri listato clone
                </button>
              ) : null}
              {tab === "attrezzature" ? (
                <button
                  type="button"
                  className="edit"
                  onClick={() => navigate("/next/autisti-inbox/richiesta-attrezzature")}
                >
                  Apri listato clone
                </button>
              ) : null}
              <span className="autisti-admin-reader-lock">Rettifiche disabilitate</span>
              {loading ? <span className="loading">Caricamento...</span> : null}
            </div>
          </div>

          {tab === "rifornimenti" && !loading && rifornimenti.length === 0 ? (
            <div className="empty">Nessun rifornimento per questa data.</div>
          ) : null}
          {tab === "segnalazioni" && !loading && segnalazioniFiltered.length === 0 ? (
            <div className="empty">Nessuna segnalazione trovata.</div>
          ) : null}
          {tab === "controlli" && !loading && controlliFiltered.length === 0 ? (
            <div className="empty">Nessun controllo trovato.</div>
          ) : null}
          {tab === "gomme" && !loading && gommeFiltered.length === 0 ? (
            <div className="empty">Nessun evento gomme trovato.</div>
          ) : null}
          {tab === "storico_cambio" && !loading && storicoCambio.length === 0 ? (
            <div className="empty">Nessun evento per questa data.</div>
          ) : null}
          {tab === "attrezzature" && !loading && richiesteAttrezzature.length === 0 ? (
            <div className="empty">Nessuna richiesta attrezzature per questa data.</div>
          ) : null}

          {tab === "rifornimenti"
            ? rifornimenti.map((event) => {
                const record = event.payload || {};
                const targaCamion =
                  record?.targaCamion ?? record?.targaMotrice ?? record?.mezzoTarga ?? null;
                const targaRimorchio = record?.targaRimorchio ?? null;
                const categoriaCamion = targaCamion
                  ? getCategoria(mezziByTarga.get(normalizeTarga(targaCamion)))
                  : null;
                const tipo = record?.tipo ? String(record.tipo).toUpperCase() : null;
                const pagamento = record?.metodoPagamento
                  ? String(record.metodoPagamento).toUpperCase()
                  : null;

                return (
                  <div className="row" key={String(event.id)}>
                    <div className="row-left">
                      <div className="time">{formatHHMM(getRecordTs(record, event.timestamp))}</div>
                      <div className="main">
                        <div className="line1">
                          <span>{String(record?.autistaNome ?? record?.nomeAutista ?? "-")}</span>
                          {tipo ? (
                            <>
                              <span className="sep">|</span>
                              <span className="muted">{tipo}</span>
                            </>
                          ) : null}
                          {pagamento ? (
                            <>
                              <span className="sep">|</span>
                              <span className="muted">{pagamento}</span>
                            </>
                          ) : null}
                        </div>
                        <div className="line2 targa-pills-row">
                          {renderTargaLabel(
                            "Motrice",
                            targaCamion ? String(targaCamion) : null,
                            categoriaCamion,
                            targaCamion ? "ok" : "neutral",
                          )}
                          {targaRimorchio
                            ? renderTargaLabel("Rimorchio", String(targaRimorchio), null, "neutral")
                            : null}
                        </div>
                        <div className="line2">
                          <span>Litri: {String(record?.litri ?? "-")}</span>
                          <span className="sep">|</span>
                          <span>KM: {String(record?.km ?? "-")}</span>
                          {record?.importo != null && record?.importo !== "" ? (
                            <>
                              <span className="sep">|</span>
                              <span>Importo: {String(record.importo)}</span>
                            </>
                          ) : null}
                        </div>
                        {record?.note ? <div className="line2">Note: {String(record.note)}</div> : null}
                      </div>
                    </div>
                  </div>
                );
              })
            : null}

          {tab === "segnalazioni" ? (
            <>
              <div className="admin-edit-section">
                <div className="admin-edit-grid">
                  <label>
                    Targa
                    <input
                      value={segnaFilterTarga}
                      onChange={(event) => setSegnaFilterTarga(event.target.value)}
                      placeholder="Cerca targa..."
                    />
                  </label>
                  <label>
                    Ambito
                    <select
                      value={segnaFilterAmbito}
                      onChange={(event) =>
                        setSegnaFilterAmbito(event.target.value as "tutti" | "motrice" | "rimorchio")
                      }
                    >
                      <option value="tutti">Tutti</option>
                      <option value="motrice">Motrice</option>
                      <option value="rimorchio">Rimorchio</option>
                    </select>
                  </label>
                  <label className="admin-edit-checkbox">
                    <input
                      type="checkbox"
                      checked={segnaOnlyNuove}
                      onChange={(event) => setSegnaOnlyNuove(event.target.checked)}
                    />
                    Solo nuove
                  </label>
                </div>
              </div>

              {segnalazioniFiltered.map((item) => (
                <div className={`row ${item.isNuova ? "pill-danger" : ""}`} key={item.key}>
                  <div className="row-left">
                    <div className="time">{formatHHMM(item.ts)}</div>
                    <div className="main">
                      <div className="line1">
                        <span>{item.autista}</span>
                        <span className="sep">|</span>
                        <span>BADGE {item.badge}</span>
                        <span className="sep">|</span>
                        <span className="muted">{item.ambito}</span>
                        {item.isNuova ? (
                          <>
                            <span className="sep">|</span>
                            <span className="pill pill-danger">NUOVA</span>
                          </>
                        ) : null}
                      </div>
                      <div className="line2">
                        <span>Targa: {item.targaMain}</span>
                        {item.targaRimorchio ? (
                          <>
                            <span className="sep">|</span>
                            <span>Rim: {item.targaRimorchio}</span>
                          </>
                        ) : null}
                      </div>
                      {item.record?.descrizione ? (
                        <div className="line2">Descrizione: {String(item.record.descrizione)}</div>
                      ) : null}
                      {item.fotoList.length > 0 ? (
                        <div className="row-photos">
                          {item.fotoList.slice(0, 3).map((src, index) => (
                            <button
                              type="button"
                              className="row-photo-thumb"
                              key={`${item.key}_${index}`}
                              onClick={() => setLightboxSrc(src)}
                            >
                              <img src={src} alt="Foto segnalazione" />
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="edit"
                      onClick={() => {
                        void openSegnalazionePdfPreview(item.record, item.fotoList);
                      }}
                    >
                      Anteprima PDF
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : null}

          {tab === "controlli" ? (
            <>
              <div className="admin-edit-section">
                <div className="admin-edit-grid">
                  <label>
                    Targa
                    <input
                      value={ctrlFilterTarga}
                      onChange={(event) => setCtrlFilterTarga(event.target.value)}
                      placeholder="Cerca targa..."
                    />
                  </label>
                  <label>
                    Target
                    <select
                      value={ctrlFilterTarget}
                      onChange={(event) =>
                        setCtrlFilterTarget(
                          event.target.value as "tutti" | "motrice" | "rimorchio" | "entrambi",
                        )
                      }
                    >
                      <option value="tutti">Tutti</option>
                      <option value="motrice">Motrice</option>
                      <option value="rimorchio">Rimorchio</option>
                      <option value="entrambi">Entrambi</option>
                    </select>
                  </label>
                  <label className="admin-edit-checkbox">
                    <input
                      type="checkbox"
                      checked={ctrlOnlyKo}
                      onChange={(event) => setCtrlOnlyKo(event.target.checked)}
                    />
                    Solo KO
                  </label>
                </div>
              </div>

              <div className="admin-two-col">
                <div className="admin-col">
                  <div className="admin-col-title ko">Esiti KO</div>
                  {controlliFiltered.filter((item) => item.isKO).length === 0 ? (
                    <div className="empty">Nessun KO</div>
                  ) : (
                    controlliFiltered
                      .filter((item) => item.isKO)
                      .map((item) => (
                        <div className="row pill-danger" key={item.key}>
                          <div className="row-left">
                            <div className="time">{formatHHMM(item.ts)}</div>
                            <div className="main">
                              <div className="line1">
                                <span>{item.autista}</span>
                                <span className="sep">|</span>
                                <span>BADGE {item.badge}</span>
                                <span className="sep">|</span>
                                <span className="muted">{item.target.toUpperCase()}</span>
                              </div>
                              <div className="line2">
                                {item.targaMotrice ? <span>Motrice: {item.targaMotrice}</span> : null}
                                {item.targaRimorchio ? (
                                  <>
                                    <span className="sep">|</span>
                                    <span>Rim: {item.targaRimorchio}</span>
                                  </>
                                ) : null}
                              </div>
                              <div className="line2">KO: {item.koList.join(", ")}</div>
                            </div>
                          </div>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="edit"
                              onClick={() => {
                                void openControlloPdfPreview(item.record);
                              }}
                            >
                              Anteprima PDF
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>

                <div className="admin-col">
                  <div className="admin-col-title ok">Esiti OK</div>
                  {controlliFiltered.filter((item) => !item.isKO).length === 0 ? (
                    <div className="empty">Nessun OK</div>
                  ) : (
                    controlliFiltered
                      .filter((item) => !item.isKO)
                      .map((item) => (
                        <div className="row" key={item.key}>
                          <div className="row-left">
                            <div className="time">{formatHHMM(item.ts)}</div>
                            <div className="main">
                              <div className="line1">
                                <span>{item.autista}</span>
                                <span className="sep">|</span>
                                <span>BADGE {item.badge}</span>
                                <span className="sep">|</span>
                                <span className="muted">{item.target.toUpperCase()}</span>
                              </div>
                              <div className="line2">
                                {item.targaMotrice ? <span>Motrice: {item.targaMotrice}</span> : null}
                                {item.targaRimorchio ? (
                                  <>
                                    <span className="sep">|</span>
                                    <span>Rim: {item.targaRimorchio}</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="edit"
                              onClick={() => {
                                void openControlloPdfPreview(item.record);
                              }}
                            >
                              Anteprima PDF
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </>
          ) : null}

          {tab === "gomme" ? (
            <>
              <div className="admin-edit-section">
                <div className="admin-edit-grid">
                  <label>
                    Targa
                    <input
                      value={gommeFilterTarga}
                      onChange={(event) => setGommeFilterTarga(event.target.value)}
                      placeholder="Cerca targa..."
                    />
                  </label>
                  <label className="admin-edit-checkbox">
                    <input
                      type="checkbox"
                      checked={gommeOnlyNuove}
                      onChange={(event) => setGommeOnlyNuove(event.target.checked)}
                    />
                    Solo nuove
                  </label>
                </div>
              </div>
              {gommeFiltered.map((item) => (
                <div className={`row ${item.isNuova ? "pill-danger" : ""}`} key={item.key}>
                  <div className="row-left">
                    <div className="time">{formatHHMM(item.ts)}</div>
                    <div className="main">
                      <div className="line1">
                        <span>{item.autista}</span>
                        <span className="sep">|</span>
                        <span>BADGE {item.badge}</span>
                        <span className="sep">|</span>
                        <span className="muted">{item.target}</span>
                        {item.isNuova ? (
                          <>
                            <span className="sep">|</span>
                            <span className="pill pill-danger">NUOVA</span>
                          </>
                        ) : null}
                      </div>
                      <div className="line2">
                        <span>Targa: {item.targa}</span>
                        <span className="sep">|</span>
                        <span>Tipo: {item.tipo}</span>
                        <span className="sep">|</span>
                        <span>KM: {item.km}</span>
                      </div>
                      <div className="line2">
                        <span>Stato: {item.stato}</span>
                        {item.rotazione ? (
                          <>
                            <span className="sep">|</span>
                            <span>Rotazione: {item.rotazione}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : null}

          {tab === "storico_cambio" ? (
            <div className="canon-list">
              <div className="canon-row canon-row-head">
                <div>Data/Ora</div>
                <div>Autista</div>
                <div>Prima</div>
                <div>Dopo</div>
                <div>Luogo</div>
                <div>Stato</div>
              </div>
              {(storicoCambio as any[]).map((item) => (
                <div className="canon-row" key={item.key}>
                  <div className="canon-cell">{formatDateTimeUI(item.ts)}</div>
                  <div className="canon-cell">
                    {item.autista}
                    <div className="muted">badge {item.badge}</div>
                  </div>
                  <div className="canon-cell">
                    <div>Motrice: {item.primaMotrice ?? "—"}</div>
                    <div>Rim: {item.primaRimorchio ?? "—"}</div>
                  </div>
                  <div className="canon-cell">
                    <div>Motrice: {item.dopoMotrice ?? "—"}</div>
                    <div>Rim: {item.dopoRimorchio ?? "—"}</div>
                  </div>
                  <div className="canon-cell">{item.luogo ?? "—"}</div>
                  <div className="canon-cell">
                    <span className="pill pill-warn">Reader-first</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {tab === "attrezzature"
            ? richiesteAttrezzature.map((event) => {
                const record = event.payload || {};
                const fotoList = getFotoList(record);
                return (
                  <div className="row" key={String(event.id)}>
                    <div className="row-left">
                      <div className="time">{formatHHMM(getRecordTs(record, event.timestamp))}</div>
                      <div className="main">
                        <div className="line1">
                          <span>{String(record?.autistaNome ?? record?.nomeAutista ?? "-")}</span>
                          <span className="sep">|</span>
                          <span className="muted">BADGE {String(record?.badgeAutista ?? "-")}</span>
                        </div>
                        <div className="line2">
                          <span>Motrice: {String(record?.targaCamion ?? "-")}</span>
                          {record?.targaRimorchio ? (
                            <>
                              <span className="sep">|</span>
                              <span>Rim: {String(record.targaRimorchio)}</span>
                            </>
                          ) : null}
                        </div>
                        <div className="line2">Richiesta: {String(record?.testo ?? "-")}</div>
                        {fotoList.length > 0 ? (
                          <div className="row-photos">
                            {fotoList.slice(0, 3).map((src, index) => (
                              <button
                                type="button"
                                className="row-photo-thumb"
                                key={`${event.id}_${index}`}
                                onClick={() => setLightboxSrc(src)}
                              >
                                <img src={src} alt="Foto richiesta attrezzature" />
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            : null}
        </div>

        {lightboxSrc ? (
          <div className="admin-lightbox" onClick={() => setLightboxSrc(null)}>
            <button
              type="button"
              className="admin-lightbox-close"
              onClick={() => setLightboxSrc(null)}
            >
              Chiudi
            </button>
            <img src={lightboxSrc} alt="Anteprima foto" />
          </div>
        ) : null}

        <PdfPreviewModal
          open={pdfPreviewOpen}
          title={pdfPreviewTitle}
          pdfUrl={pdfPreviewUrl}
          fileName={pdfPreviewFileName}
          hint="Reader-first clone: anteprima disponibile, rettifiche disabilitate."
          onClose={() => setPdfPreviewOpen(false)}
        />
      </div>
    </div>
  );
}
