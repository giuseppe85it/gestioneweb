import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { getItemSync } from "../utils/storageSync";
import type { HomeEvent } from "../utils/homeEvents";
import AutistiEventoModal from "../components/AutistiEventoModal";
import "./Mezzo360.css";

const KEY_MEZZI = "@mezzi_aziendali";
const KEY_SESSIONI = "@autisti_sessione_attive";
const KEY_EVENTI = "@storico_eventi_operativi";
const KEY_MANUTENZIONI = "@manutenzioni";
const KEY_LAVORI = "@lavori";
const KEY_MATERIALI = "@materialiconsegnati";
const KEY_SEGNALAZIONI = "@segnalazioni_autisti_tmp";
const KEY_CONTROLLI = "@controlli_mezzo_autisti";
const KEY_RIFORNIMENTI = "@rifornimenti_autisti_tmp";
const KEY_GOMME_TMP = "@cambi_gomme_autisti_tmp";
const KEY_GOMME_EVENTI = "@gomme_eventi";
const KEY_RICHIESTE = "@richieste_attrezzature_autisti_tmp";

const DOC_COLLECTIONS = [
  "@documenti_mezzi",
  "@documenti_magazzino",
  "@documenti_generici",
];

const PREVIEW_LIMIT = 5;
const DEBUG_DOCS = true;
const DEBUG_DOC_NAME = "augustonifattura.pdf";

type AnyRecord = Record<string, any>;
type TimelineItem = {
  id: string;
  ts: number;
  title: string;
  subtitle?: string;
  detail?: string;
  source: string;
  record: AnyRecord;
};

type Currency = "EUR" | "CHF" | "UNKNOWN";

function unwrapList(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.value)) return value.value;
  if (value && Array.isArray(value.items)) return value.items;
  return [];
}

function fmtTarga(value: string | null | undefined): string {
  return normalizeTarga(value);
}

function normalizeTarga(t?: unknown) {
  if (typeof t !== "string") return "";
  return t.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
}

function normalizeTipo(tipo?: unknown) {
  if (typeof tipo !== "string") return "";
  return tipo.toUpperCase().replace(/\s+/g, "").trim();
}

function detectCurrencyFromText(input: unknown): Currency {
  if (!input) return "UNKNOWN";
  const text = String(input).toUpperCase();
  if (text.includes("€") || text.includes("EUR")) return "EUR";
  if (text.includes("CHF") || text.includes("FR.")) return "CHF";
  return "UNKNOWN";
}

function resolveCurrencyFromRecord(record: AnyRecord): Currency {
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
  ]
    .filter(Boolean)
    .join(" ");
  return detectCurrencyFromText(source);
}

function renderAmountWithCurrency(
  value: number | null | undefined,
  currency: Currency
) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  if (currency === "UNKNOWN") {
    return (
      <>
        {value.toFixed(2)}
        <span
          style={{
            marginLeft: "6px",
            padding: "2px 6px",
            borderRadius: "999px",
            background: "rgba(178, 59, 46, 0.12)",
            color: "#7b2e25",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          VALUTA DA VERIFICARE
        </span>
      </>
    );
  }
  return `${value.toFixed(2)} ${currency}`;
}

function isSameTarga(a: string, b: string) {
  const na = normalizeTarga(a);
  const nb = normalizeTarga(b);
  if (na === nb) return true;
  if (Math.abs(na.length - nb.length) <= 1) {
    const minLen = Math.min(na.length, nb.length);
    let diff = 0;
    for (let i = 0; i < minLen; i += 1) {
      if (na[i] !== nb[i]) diff += 1;
      if (diff > 1) return false;
    }
    return true;
  }
  return false;
}

function parseDateStringToMs(value?: string): number {
  if (!value) return 0;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (/^\d{2}\s\d{2}\s\d{4}/.test(trimmed)) {
    const [gg, mm, yyyy] = trimmed.split(" ");
    const parsed = Date.parse(`${yyyy}-${mm}-${gg}T00:00:00`);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getTimestamp(record: AnyRecord): number {
  if (typeof record?.timestamp === "number") return record.timestamp;
  if (typeof record?.data === "number") return record.data;
  if (typeof record?.dataMs === "number") return record.dataMs;
  if (typeof record?.data === "string") return parseDateStringToMs(record.data);
  if (typeof record?.dataInserimento === "string")
    return parseDateStringToMs(record.dataInserimento);
  return 0;
}

function formatDateTime(ts?: number | null) {
  if (!ts) return "-";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd} ${mm} ${yy} ${hh}:${mi}`;
}

function formatDateOnly(value?: string) {
  if (!value) return "-";
  if (/^\d{2}\s\d{2}\s\d{4}$/.test(value.trim())) return value;
  const ts = parseDateStringToMs(value);
  if (!ts) return value;
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd} ${mm} ${yy}`;
}

export default function Mezzo360() {
  const params = useParams();
  const decodedParam = useMemo(() => {
    const raw = params.targa || "";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [params.targa]);

  const targa = fmtTarga(decodedParam);
  const targaNorm = normalizeTarga(decodedParam);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mezzi, setMezzi] = useState<AnyRecord[]>([]);
  const [sessioni, setSessioni] = useState<AnyRecord[]>([]);
  const [eventi, setEventi] = useState<AnyRecord[]>([]);
  const [manutenzioniRaw, setManutenzioniRaw] = useState<AnyRecord[]>([]);
  const [lavoriRaw, setLavoriRaw] = useState<AnyRecord[]>([]);
  const [materialiRaw, setMaterialiRaw] = useState<AnyRecord[]>([]);
  const [documentiRaw, setDocumentiRaw] = useState<AnyRecord[]>([]);
  const [segnalazioniRaw, setSegnalazioniRaw] = useState<AnyRecord[]>([]);
  const [controlliRaw, setControlliRaw] = useState<AnyRecord[]>([]);
  const [rifornimentiRaw, setRifornimentiRaw] = useState<AnyRecord[]>([]);
  const [gommeTmpRaw, setGommeTmpRaw] = useState<AnyRecord[]>([]);
  const [gommeEventiRaw, setGommeEventiRaw] = useState<AnyRecord[]>([]);
  const [richiesteRaw, setRichiesteRaw] = useState<AnyRecord[]>([]);

  const [showAllTimeline, setShowAllTimeline] = useState(false);
  const [showAllManutenzioni, setShowAllManutenzioni] = useState(false);
  const [showAllLavori, setShowAllLavori] = useState(false);
  const [showAllMateriali, setShowAllMateriali] = useState(false);
  const [showAllDocumenti, setShowAllDocumenti] = useState(false);
  const [showAllRichieste, setShowAllRichieste] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<HomeEvent | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDocumenti = async () => {
      const out: AnyRecord[] = [];
      let rawCount = 0;
      for (const colName of DOC_COLLECTIONS) {
        try {
          const snap = await getDocs(collection(db, colName));
          snap.forEach((docSnap) => {
            const d = docSnap.data() || {};
            rawCount += 1;
            if (DEBUG_DOCS && d.nomeFile === DEBUG_DOC_NAME) {
              const docId = (d as any)?.id ?? (d as any)?.docId ?? docSnap.id;
              console.log("[Mezzo360][IA] raw match", {
                nomeFile: d.nomeFile,
                targa: d.targa,
                tipoDocumento: d.tipoDocumento,
                categoriaArchivio: d.categoriaArchivio,
                fileUrl: d.fileUrl,
                docId,
              });
            }
            out.push({
              ...d,
              sourceKey: colName,
              sourceDocId: docSnap.id,
            });
          });
        } catch {
          // ignore collection errors
        }
      }
      if (DEBUG_DOCS) {
        console.log("[Mezzo360][IA] raw count", rawCount);
      }
      return out;
    };

    const load = async () => {
      if (!targaNorm) {
        setError("Targa non valida.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [
          mezziRaw,
          sessioniRaw,
          eventiRaw,
          manutenzioniRaw,
          lavoriRaw,
          materialiRaw,
          segnalazioniRaw,
          controlliRaw,
          rifornimentiRaw,
          gommeTmpRaw,
          gommeEventiRaw,
          richiesteRaw,
          documentiRaw,
        ] = await Promise.all([
          getItemSync(KEY_MEZZI),
          getItemSync(KEY_SESSIONI),
          getItemSync(KEY_EVENTI),
          getItemSync(KEY_MANUTENZIONI),
          getItemSync(KEY_LAVORI),
          getItemSync(KEY_MATERIALI),
          getItemSync(KEY_SEGNALAZIONI),
          getItemSync(KEY_CONTROLLI),
          getItemSync(KEY_RIFORNIMENTI),
          getItemSync(KEY_GOMME_TMP),
          getItemSync(KEY_GOMME_EVENTI),
          getItemSync(KEY_RICHIESTE),
          loadDocumenti(),
        ]);

        if (cancelled) return;
        setMezzi(unwrapList(mezziRaw));
        setSessioni(unwrapList(sessioniRaw));
        setEventi(unwrapList(eventiRaw));
        setManutenzioniRaw(unwrapList(manutenzioniRaw));
        setLavoriRaw(unwrapList(lavoriRaw));
        setMaterialiRaw(unwrapList(materialiRaw));
        setSegnalazioniRaw(unwrapList(segnalazioniRaw));
        setControlliRaw(unwrapList(controlliRaw));
        setRifornimentiRaw(unwrapList(rifornimentiRaw));
        setGommeTmpRaw(unwrapList(gommeTmpRaw));
        setGommeEventiRaw(unwrapList(gommeEventiRaw));
        setRichiesteRaw(unwrapList(richiesteRaw));
        setDocumentiRaw(Array.isArray(documentiRaw) ? documentiRaw : []);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Errore caricamento dati.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [targaNorm]);

  const mezzo = useMemo(() => {
    return mezzi.find((m) => isSameTarga(String(m?.targa ?? ""), targaNorm));
  }, [mezzi, targaNorm]);

  const sessioniMatch = useMemo(() => {
    return sessioni.filter(
      (s) =>
        isSameTarga(String(s?.targaMotrice ?? ""), targaNorm) ||
        isSameTarga(String(s?.targaRimorchio ?? ""), targaNorm)
    );
  }, [sessioni, targaNorm]);

  const eventiMatch = useMemo(() => {
    return eventi.filter((e) => {
      const targhe = [
        e?.prima?.targaMotrice,
        e?.prima?.motrice,
        e?.dopo?.targaMotrice,
        e?.dopo?.motrice,
        e?.prima?.targaRimorchio,
        e?.prima?.rimorchio,
        e?.dopo?.targaRimorchio,
        e?.dopo?.rimorchio,
        e?.primaMotrice,
        e?.dopoMotrice,
        e?.primaRimorchio,
        e?.dopoRimorchio,
      ].filter(Boolean);
      return targhe.some((t) => isSameTarga(String(t), targaNorm));
    });
  }, [eventi, targaNorm]);

  const ultimoEvento = useMemo(() => {
    if (!eventiMatch.length) return null;
    return [...eventiMatch].sort((a, b) => getTimestamp(b) - getTimestamp(a))[0];
  }, [eventiMatch]);

  const manutenzioni = useMemo(() => {
    return manutenzioniRaw
      .filter((m) => isSameTarga(String(m?.targa ?? ""), targaNorm))
      .sort((a, b) => parseDateStringToMs(b?.data) - parseDateStringToMs(a?.data));
  }, [manutenzioniRaw, targaNorm]);

  const lavoriPerMezzo = useMemo(() => {
    return lavoriRaw.filter((l) => {
      const targaLavoro = l?.targa ?? l?.mezzoTarga ?? "";
      return isSameTarga(String(targaLavoro), targaNorm);
    });
  }, [lavoriRaw, targaNorm]);

  const lavoriEseguiti = useMemo(
    () => lavoriPerMezzo.filter((l) => l?.eseguito === true),
    [lavoriPerMezzo]
  );
  const lavoriInAttesa = useMemo(
    () => lavoriPerMezzo.filter((l) => l?.eseguito !== true),
    [lavoriPerMezzo]
  );

  const materiali = useMemo(() => {
    return materialiRaw
      .filter((m) =>
        isSameTarga(String(m?.destinatario?.label ?? ""), targaNorm)
      )
      .sort((a, b) => parseDateStringToMs(b?.data) - parseDateStringToMs(a?.data));
  }, [materialiRaw, targaNorm]);

  const documenti = useMemo(() => {
    if (DEBUG_DOCS) {
      console.log("[Mezzo360][IA] before filter", documentiRaw.length);
    }
    const filtered = documentiRaw
      .map((d) => {
        const docTipo = normalizeTipo(d?.tipoDocumento);
        const docTargaNorm = fmtTarga(d?.targa || "");
        const docTargaLabel = docTargaNorm;
        const isDocValid = docTipo === "FATTURA" || docTipo === "PREVENTIVO";
        const isMatch = docTargaNorm !== "" && docTargaNorm === targa;
        if (DEBUG_DOCS && d?.nomeFile === DEBUG_DOC_NAME) {
          console.log("[Mezzo360][IA] filter check", {
            nomeFile: d?.nomeFile,
            tipoDocumento: d?.tipoDocumento,
            tipoCanon: docTipo,
            docTargaNorm,
            targaAttivaNorm: targa,
            isDocValid,
            isTargaMatch: isMatch,
          });
        }
        if (!isDocValid || !isMatch) return null;
        const importoRaw = d?.totaleDocumento;
        const importo =
          typeof importoRaw === "number"
            ? importoRaw
            : typeof importoRaw === "string"
            ? parseFloat(importoRaw.replace(",", "."))
            : null;
        const currency = resolveCurrencyFromRecord(d);
        return {
          id: d?.id || d?.sourceDocId || `${docTipo}_${docTargaNorm}`,
          tipo: docTipo,
          targa: docTargaLabel,
          data: d?.dataDocumento || "",
          descrizione: d?.fornitore
            ? `${docTipo} - ${d.fornitore}`
            : docTipo || "-",
          importo,
          fileUrl: d?.fileUrl || null,
          nomeFile: d?.nomeFile || null,
          fornitore: d?.fornitore || null,
          sourceKey: d?.sourceKey || "",
          sourceDocId: d?.sourceDocId || "",
          currency,
        };
      })
      .filter(Boolean) as AnyRecord[];
    if (DEBUG_DOCS) {
      console.log(
        "[Mezzo360][IA] after type/targa filter",
        filtered.length
      );
    }

    const dedupKeys = new Set<string>();
    const deduped = filtered.filter((item) => {
      const docId = String(item?.sourceDocId || item?.id || "");
      if (!docId) return true;
      const sourceKey = String(item?.sourceKey || "");
      const key = sourceKey ? `${sourceKey}:${docId}` : docId;
      if (DEBUG_DOCS && item?.nomeFile === DEBUG_DOC_NAME) {
        console.log("[Mezzo360][IA] dedup check", {
          nomeFile: item?.nomeFile,
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
      console.log("[Mezzo360][IA] after dedup", deduped.length);
    }

    return deduped.sort(
      (a: any, b: any) => parseDateStringToMs(b?.data) - parseDateStringToMs(a?.data)
    );
  }, [documentiRaw, targa]);

  const segnalazioni = useMemo(() => {
    return segnalazioniRaw.filter(
      (s) =>
        isSameTarga(String(s?.targaCamion ?? ""), targaNorm) ||
        isSameTarga(String(s?.targaRimorchio ?? ""), targaNorm) ||
        isSameTarga(String(s?.targa ?? ""), targaNorm)
    );
  }, [segnalazioniRaw, targaNorm]);

  const controlli = useMemo(() => {
    return controlliRaw.filter(
      (c) =>
        isSameTarga(String(c?.targaCamion ?? ""), targaNorm) ||
        isSameTarga(String(c?.targaRimorchio ?? ""), targaNorm)
    );
  }, [controlliRaw, targaNorm]);

  const rifornimenti = useMemo(() => {
    return rifornimentiRaw.filter(
      (r) =>
        isSameTarga(String(r?.targaCamion ?? ""), targaNorm) ||
        isSameTarga(String(r?.targaRimorchio ?? ""), targaNorm)
    );
  }, [rifornimentiRaw, targaNorm]);

  const gomme = useMemo(() => {
    const tmp = gommeTmpRaw.filter((g) => {
      return (
        isSameTarga(String(g?.targetTarga ?? ""), targaNorm) ||
        isSameTarga(String(g?.contesto?.targaCamion ?? ""), targaNorm) ||
        isSameTarga(String(g?.contesto?.targaRimorchio ?? ""), targaNorm)
      );
    });
    const eventi = gommeEventiRaw.filter((g) => {
      return (
        isSameTarga(String(g?.targetTarga ?? ""), targaNorm) ||
        isSameTarga(String(g?.targa ?? ""), targaNorm) ||
        isSameTarga(String(g?.targaCamion ?? ""), targaNorm) ||
        isSameTarga(String(g?.targaRimorchio ?? ""), targaNorm)
      );
    });
    return [...tmp, ...eventi];
  }, [gommeTmpRaw, gommeEventiRaw, targaNorm]);

  const richieste = useMemo(() => {
    return richiesteRaw.filter(
      (r) =>
        isSameTarga(String(r?.targaCamion ?? ""), targaNorm) ||
        isSameTarga(String(r?.targaRimorchio ?? ""), targaNorm)
    );
  }, [richiesteRaw, targaNorm]);

  const timeline = useMemo(() => {
    const items: TimelineItem[] = [];

    eventiMatch.forEach((evt, idx) => {
      const motrice = fmtTarga(evt?.dopo?.targaMotrice ?? evt?.dopo?.motrice);
      const rimorchio = fmtTarga(
        evt?.dopo?.targaRimorchio ?? evt?.dopo?.rimorchio
      );
      items.push({
        id: `evt-${evt?.id ?? idx}`,
        ts: getTimestamp(evt),
        title: `Evento operativo: ${evt?.tipo || "evento"}`,
        subtitle: `Motrice: ${motrice || "-"} | Rimorchio: ${rimorchio || "-"}`,
        detail: evt?.luogo ? `Luogo: ${evt.luogo}` : "Luogo: -",
        source: "storico_eventi_operativi",
        record: evt,
      });
    });

    segnalazioni.forEach((s, idx) => {
      items.push({
        id: `seg-${s?.id ?? idx}`,
        ts: getTimestamp(s),
        title: `Segnalazione ${s?.tipoProblema || ""}`.trim(),
        subtitle: s?.descrizione ? s.descrizione : "Segnalazione",
        detail: s?.ambito ? `Ambito: ${s.ambito}` : "",
        source: "segnalazioni",
        record: s,
      });
    });

    controlli.forEach((c, idx) => {
      items.push({
        id: `ctrl-${c?.id ?? idx}`,
        ts: getTimestamp(c),
        title: "Controllo mezzo",
        subtitle: c?.target ? `Target: ${c.target}` : "",
        detail: c?.note ? `Note: ${c.note}` : "",
        source: "controlli",
        record: c,
      });
    });

    rifornimenti.forEach((r, idx) => {
      const litri = r?.litri ?? "-";
      const km = r?.km ?? "-";
      items.push({
        id: `rf-${r?.id ?? idx}`,
        ts: getTimestamp(r),
        title: "Rifornimento",
        subtitle: `Litri: ${litri} | Km: ${km}`,
        detail: r?.tipo ? `Tipo: ${r.tipo}` : "",
        source: "rifornimenti",
        record: r,
      });
    });

    gomme.forEach((g, idx) => {
      const asse = g?.asseLabel || g?.asseId || "-";
      const marca = g?.marca || "-";
      items.push({
        id: `gm-${g?.id ?? idx}`,
        ts: getTimestamp(g),
        title: `Gomme: ${g?.tipo || "intervento"}`,
        subtitle: `Asse: ${asse} | Marca: ${marca}`,
        detail: g?.rotazioneText ? `Rotazione: ${g.rotazioneText}` : "",
        source: "gomme",
        record: g,
      });
    });

    return items.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }, [eventiMatch, segnalazioni, controlli, rifornimenti, gomme]);

  const timelinePreview = showAllTimeline ? timeline : timeline.slice(0, PREVIEW_LIMIT);
  const manutenzioniPreview = showAllManutenzioni
    ? manutenzioni
    : manutenzioni.slice(0, PREVIEW_LIMIT);
  const lavoriInAttesaPreview = showAllLavori
    ? lavoriInAttesa
    : lavoriInAttesa.slice(0, PREVIEW_LIMIT);
  const lavoriEseguitiPreview = showAllLavori
    ? lavoriEseguiti
    : lavoriEseguiti.slice(0, PREVIEW_LIMIT);
  const materialiPreview = showAllMateriali
    ? materiali
    : materiali.slice(0, PREVIEW_LIMIT);
  const documentiPreview = showAllDocumenti
    ? documenti
    : documenti.slice(0, PREVIEW_LIMIT);
  const richiestePreview = showAllRichieste
    ? richieste
    : richieste.slice(0, PREVIEW_LIMIT);

  function resolveHomeEventTipo(source: string): HomeEvent["tipo"] | null {
    switch (source) {
      case "segnalazioni":
        return "segnalazione";
      case "controlli":
        return "controllo";
      case "rifornimenti":
        return "rifornimento";
      case "gomme":
        return "gomme";
      case "storico_eventi_operativi":
        return "cambio_mezzo";
      default:
        return null;
    }
  }

  function resolveRecordTarga(record: AnyRecord): string | null {
    const raw =
      record?.targa ??
      record?.targaCamion ??
      record?.targaMotrice ??
      record?.targaRimorchio ??
      record?.targetTarga ??
      record?.mezzoTarga ??
      record?.dopo?.targaMotrice ??
      record?.dopo?.motrice ??
      record?.dopo?.targaRimorchio ??
      record?.dopo?.rimorchio ??
      record?.prima?.targaMotrice ??
      record?.prima?.motrice ??
      record?.prima?.targaRimorchio ??
      record?.prima?.rimorchio ??
      record?.motrice ??
      record?.rimorchio;
    const targa = fmtTarga(raw);
    return targa || null;
  }

  function buildCambioPayload(record: AnyRecord, fallbackTs: number) {
    const payload: AnyRecord = { ...record };
    payload.primaMotrice =
      payload.primaMotrice ??
      payload?.prima?.motrice ??
      payload?.prima?.targaMotrice ??
      null;
    payload.dopoMotrice =
      payload.dopoMotrice ??
      payload?.dopo?.motrice ??
      payload?.dopo?.targaMotrice ??
      null;
    payload.primaRimorchio =
      payload.primaRimorchio ??
      payload?.prima?.rimorchio ??
      payload?.prima?.targaRimorchio ??
      null;
    payload.dopoRimorchio =
      payload.dopoRimorchio ??
      payload?.dopo?.rimorchio ??
      payload?.dopo?.targaRimorchio ??
      null;
    payload.targaMotrice =
      payload.targaMotrice ??
      payload.targaCamion ??
      payload.dopoMotrice ??
      payload.primaMotrice ??
      null;
    payload.targaRimorchio =
      payload.targaRimorchio ??
      payload.dopoRimorchio ??
      payload.primaRimorchio ??
      null;
    payload.tipo = payload.tipo ?? payload.tipoOperativo ?? payload.fsTipo ?? "CAMBIO_ASSETTO";
    payload.badgeAutista = payload.badgeAutista ?? payload.badge ?? null;
    payload.autista =
      payload.autista ?? payload.autistaNome ?? payload.nomeAutista ?? null;
    payload.timestamp = payload.timestamp ?? fallbackTs ?? null;
    return payload;
  }

  function buildHomeEventFromTimeline(item: TimelineItem): HomeEvent | null {
    const tipo = resolveHomeEventTipo(item.source);
    if (!tipo) return null;
    const record = item.record ?? {};
    const payload =
      tipo === "cambio_mezzo" ? buildCambioPayload(record, item.ts) : record;
    const ts = item.ts || getTimestamp(record);
    const targa = resolveRecordTarga(record);
    const autista =
      record?.autistaNome ?? record?.nomeAutista ?? record?.autista ?? null;
    return {
      id: String(record?.id ?? item.id ?? `evt-${ts}`),
      tipo,
      targa,
      autista,
      timestamp: ts || 0,
      payload,
    };
  }

  function buildHomeEventFromRichiesta(record: AnyRecord): HomeEvent {
    const ts = getTimestamp(record);
    const targa = resolveRecordTarga(record);
    return {
      id: String(record?.id ?? `req-${ts || Date.now()}`),
      tipo: "richiesta_attrezzature",
      targa,
      autista: record?.autistaNome ?? record?.nomeAutista ?? record?.autista ?? null,
      timestamp: ts || 0,
      payload: record,
    };
  }

  function openTimelineModal(item: TimelineItem) {
    const evt = buildHomeEventFromTimeline(item);
    if (evt) setSelectedEvent(evt);
  }

  function openRichiestaModal(record: AnyRecord) {
    setSelectedEvent(buildHomeEventFromRichiesta(record));
  }

  const targaTooltip = mezzo
    ? `Categoria: ${mezzo?.categoria || "-"}\nAutista: ${mezzo?.autistaNome || "-"}`
    : "";

  return (
    <div className="mezzo360-page">
      <div className="mezzo360-shell">
        <header className="mezzo360-header">
          <div>
            <div className="mezzo360-kicker">Vista Mezzo 360</div>
            <h1 className="mezzo360-title">
              <span className="targa" title={targaTooltip || undefined}>
                {targa || "Targa non valida"}
              </span>
            </h1>
            <div className="mezzo360-subtitle">
              Storico completo e dettagli operativi per la targa selezionata.
            </div>
          </div>
          <div className="mezzo360-actions">
            <Link to="/mezzi" className="mezzo360-action">
              Torna ai Mezzi
            </Link>
            <Link to={`/dossiermezzi/${encodeURIComponent(targa)}`} className="mezzo360-action">
              Dossier Mezzo
            </Link>
          </div>
        </header>

        {error ? <div className="mezzo360-alert">{error}</div> : null}

        <div className="mezzo360-grid">
          <section className="mezzo360-card">
            <div className="mezzo360-card-head">
              <h2>Identita mezzo</h2>
            </div>
            {loading ? (
              <div className="mezzo360-empty">Caricamento...</div>
            ) : mezzo ? (
              <div className="mezzo360-identity">
                {mezzo?.fotoUrl ? (
                  <img
                    src={mezzo.fotoUrl}
                    alt={targa}
                    className="mezzo360-photo"
                  />
                ) : null}
                <div className="mezzo360-identity-info">
                  <div className="mezzo360-line">
                    <span className="label">Categoria</span>
                    <span>{mezzo?.categoria || "-"}</span>
                  </div>
                  <div className="mezzo360-line">
                    <span className="label">Autista</span>
                    <span>{mezzo?.autistaNome || "-"}</span>
                  </div>
                  <div className="mezzo360-line">
                    <span className="label">Marca/Modello</span>
                    <span>
                      {mezzo?.marca || "-"} {mezzo?.modello || ""}
                    </span>
                  </div>
                  <div className="mezzo360-line">
                    <span className="label">Note</span>
                    <span>{mezzo?.note || "-"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mezzo360-empty">Nessun mezzo trovato.</div>
            )}
          </section>

          <section className="mezzo360-card">
            <div className="mezzo360-card-head">
              <h2>Stato attuale</h2>
            </div>
            {loading ? (
              <div className="mezzo360-empty">Caricamento...</div>
            ) : (
              <div className="mezzo360-status">
                <div className="mezzo360-line">
                  <span className="label">Sessione attiva</span>
                  <span>{sessioniMatch.length ? "SI" : "NO"}</span>
                </div>
                {sessioniMatch.slice(0, 3).map((s, idx) => (
                  <div key={`sess-${idx}`} className="mezzo360-line">
                    <span className="label">Autista</span>
                    <span>{s?.nomeAutista || "-"}</span>
                    <span className="label">Rimorchio</span>
                    <span>{fmtTarga(s?.targaRimorchio) || "-"}</span>
                  </div>
                ))}
                <div className="mezzo360-divider" />
                <div className="mezzo360-line">
                  <span className="label">Ultimo evento</span>
                  <span>
                    {ultimoEvento
                      ? `${ultimoEvento?.tipo || "evento"} - ${formatDateTime(
                          getTimestamp(ultimoEvento)
                        )}`
                      : "-"}
                  </span>
                </div>
                <div className="mezzo360-line">
                  <span className="label">Luogo</span>
                  <span>{ultimoEvento?.luogo || "-"}</span>
                </div>
                <div className="mezzo360-line">
                  <span className="label">Condizioni</span>
                  <span>{ultimoEvento?.condizioni ? "Presenti" : "-"}</span>
                </div>
              </div>
            )}
          </section>

          <section className="mezzo360-card span-2">
            <div className="mezzo360-card-head">
              <h2>Timeline eventi</h2>
              <button
                type="button"
                className="toggle-btn"
                onClick={() => setShowAllTimeline((prev) => !prev)}
              >
                {showAllTimeline ? "Mostra meno" : "Mostra tutto"}
              </button>
            </div>
            {loading ? (
              <div className="mezzo360-empty">Caricamento...</div>
            ) : timelinePreview.length === 0 ? (
              <div className="mezzo360-empty">Nessun evento disponibile.</div>
            ) : (
              <div className="timeline-list">
                {timelinePreview.map((item) => (
                  <div
                    key={item.id}
                    className="timeline-item"
                    role="button"
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                    onClick={() => openTimelineModal(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        openTimelineModal(item);
                      }
                    }}
                  >
                    <div className="timeline-head">
                      <span className="timeline-title">{item.title}</span>
                      <span className="timeline-date">{formatDateTime(item.ts)}</span>
                    </div>
                    {item.subtitle ? (
                      <div className="timeline-subtitle">{item.subtitle}</div>
                    ) : null}
                    {item.detail ? (
                      <div className="timeline-meta">{item.detail}</div>
                    ) : null}
                    <div className="timeline-source">{item.source}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mezzo360-card">
            <div className="mezzo360-card-head">
              <h2>Manutenzioni</h2>
              <button
                type="button"
                className="toggle-btn"
                onClick={() => setShowAllManutenzioni((prev) => !prev)}
              >
                {showAllManutenzioni ? "Mostra meno" : "Mostra tutto"}
              </button>
            </div>
            {loading ? (
              <div className="mezzo360-empty">Caricamento...</div>
            ) : manutenzioniPreview.length === 0 ? (
              <div className="mezzo360-empty">Nessuna manutenzione.</div>
            ) : (
              <div className="mezzo360-list">
                {manutenzioniPreview.map((m, idx) => (
                  <div key={m?.id ?? `man-${idx}`} className="mezzo360-item">
                    <div className="mezzo360-item-title">
                      {m?.descrizione || "Manutenzione"}
                    </div>
                    <div className="mezzo360-item-meta">
                      {formatDateOnly(m?.data)} | Tipo: {m?.tipo || "-"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mezzo360-card">
            <div className="mezzo360-card-head">
              <h2>Lavori</h2>
              <button
                type="button"
                className="toggle-btn"
                onClick={() => setShowAllLavori((prev) => !prev)}
              >
                {showAllLavori ? "Mostra meno" : "Mostra tutto"}
              </button>
            </div>
            {loading ? (
              <div className="mezzo360-empty">Caricamento...</div>
            ) : lavoriPerMezzo.length === 0 ? (
              <div className="mezzo360-empty">Nessun lavoro.</div>
            ) : (
              <div className="mezzo360-list">
                <div className="mezzo360-subsection">
                  <div className="mezzo360-subtitle">In attesa</div>
                  {lavoriInAttesaPreview.length === 0 ? (
                    <div className="mezzo360-empty">Nessun lavoro in attesa.</div>
                  ) : (
                    lavoriInAttesaPreview.map((l, idx) => (
                      <div key={l?.id ?? `lav-a-${idx}`} className="mezzo360-item">
                        <div className="mezzo360-item-title">
                          {l?.descrizione || "Lavoro"}
                        </div>
                        <div className="mezzo360-item-meta">
                          {formatDateOnly(l?.dataInserimento)} | Urgenza: {l?.urgenza || "-"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mezzo360-subsection">
                  <div className="mezzo360-subtitle">Eseguiti</div>
                  {lavoriEseguitiPreview.length === 0 ? (
                    <div className="mezzo360-empty">Nessun lavoro eseguito.</div>
                  ) : (
                    lavoriEseguitiPreview.map((l, idx) => (
                      <div key={l?.id ?? `lav-e-${idx}`} className="mezzo360-item">
                        <div className="mezzo360-item-title">
                          {l?.descrizione || "Lavoro"}
                        </div>
                        <div className="mezzo360-item-meta">
                          {formatDateOnly(l?.dataInserimento)} | Urgenza: {l?.urgenza || "-"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="mezzo360-card">
            <div className="mezzo360-card-head">
              <h2>Materiali consegnati</h2>
              <button
                type="button"
                className="toggle-btn"
                onClick={() => setShowAllMateriali((prev) => !prev)}
              >
                {showAllMateriali ? "Mostra meno" : "Mostra tutto"}
              </button>
            </div>
            {loading ? (
              <div className="mezzo360-empty">Caricamento...</div>
            ) : materialiPreview.length === 0 ? (
              <div className="mezzo360-empty">Nessun materiale consegnato.</div>
            ) : (
              <div className="mezzo360-list">
                {materialiPreview.map((m, idx) => (
                  <div key={m?.id ?? `mat-${idx}`} className="mezzo360-item">
                    <div className="mezzo360-item-title">
                      {m?.descrizione || "Materiale"}
                    </div>
                    <div className="mezzo360-item-meta">
                      {formatDateOnly(m?.data)} | Qta: {m?.quantita ?? "-"} {m?.unita || ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mezzo360-card">
            <div className="mezzo360-card-head">
              <h2>Documenti</h2>
              <button
                type="button"
                className="toggle-btn"
                onClick={() => setShowAllDocumenti((prev) => !prev)}
              >
                {showAllDocumenti ? "Mostra meno" : "Mostra tutto"}
              </button>
            </div>
            {loading ? (
              <div className="mezzo360-empty">Caricamento...</div>
            ) : documentiPreview.length === 0 ? (
              <div className="mezzo360-empty">Nessun documento trovato.</div>
            ) : (
              <div className="mezzo360-list">
                {documentiPreview.map((d: any, idx: number) => (
                  <div key={d?.id ?? `doc-${idx}`} className="mezzo360-item">
                    <div className="mezzo360-item-title">
                      {d?.descrizione || d?.tipo || "Documento"}
                    </div>
                    <div className="mezzo360-item-meta">
                      {formatDateOnly(d?.data)} | Importo:{" "}
                      {renderAmountWithCurrency(
                        d?.importo,
                        d?.currency ?? "UNKNOWN"
                      )}
                    </div>
                    {d?.fileUrl ? (
                      <a
                        className="mezzo360-link"
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Apri file
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mezzo360-card">
            <div className="mezzo360-card-head">
              <h2>Richieste attrezzature</h2>
              <button
                type="button"
                className="toggle-btn"
                onClick={() => setShowAllRichieste((prev) => !prev)}
              >
                {showAllRichieste ? "Mostra meno" : "Mostra tutto"}
              </button>
            </div>
            {loading ? (
              <div className="mezzo360-empty">Caricamento...</div>
            ) : richiestePreview.length === 0 ? (
              <div className="mezzo360-empty">Nessuna richiesta.</div>
            ) : (
              <div className="mezzo360-list">
                {richiestePreview.map((r, idx) => (
                  <div
                    key={r?.id ?? `req-${idx}`}
                    className="mezzo360-item"
                    role="button"
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                    onClick={() => openRichiestaModal(r)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        openRichiestaModal(r);
                      }
                    }}
                  >
                    <div className="mezzo360-item-title">
                      {r?.testo || "Richiesta"}
                    </div>
                    <div className="mezzo360-item-meta">
                      {formatDateTime(getTimestamp(r))} | Stato: {r?.stato || "-"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mezzo360-card">
            <div className="mezzo360-card-head">
              <h2>Apri in...</h2>
            </div>
            <div className="mezzo360-actions-grid">
              <Link to={`/dossiermezzi/${encodeURIComponent(targa)}`} className="mezzo360-action">
                Dossier Mezzo
              </Link>
              <Link to="/manutenzioni" className="mezzo360-action">
                Manutenzioni
              </Link>
              <Link to="/autisti-admin" className="mezzo360-action">
                Centro rettifica dati
              </Link>
              <Link to="/autisti-inbox" className="mezzo360-action">
                Autisti Inbox
              </Link>
              <Link to="/gestione-operativa" className="mezzo360-action">
                Gestione Operativa
              </Link>
            </div>
          </section>
        </div>
        <AutistiEventoModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      </div>
    </div>
  );
}
