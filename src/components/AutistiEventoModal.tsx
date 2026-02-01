import { useEffect, useMemo, useState } from "react";
import type { HomeEvent } from "../utils/homeEvents";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { useTarghe } from "../utils/targhe";
import {
  generateCambioMezzoPDF,
  generateControlloPDF,
  generateRichiestaAttrezzaturePDF,
  generateRifornimentoPDF,
  generateSegnalazionePDF,
} from "../utils/pdfEngine";
import { formatDateTimeUI } from "../utils/dateFormat";
import "../autistiInbox/AutistiInboxHome.css";
import TargaPicker from "./TargaPicker";

type CreateFrom = {
  tipo: "segnalazione" | "controllo";
  payload: any;
};

type AutistiEventoModalProps = {
  event: HomeEvent | null;
  onClose: () => void;
  onAfterGommeImport?: () => void | Promise<void>;
};

const KEY_GOMME_TMP = "@cambi_gomme_autisti_tmp";
const KEY_GOMME_EVENTI = "@gomme_eventi";
const KEY_MANUTENZIONI = "@manutenzioni";

export default function AutistiEventoModal({
  event,
  onClose,
  onAfterGommeImport,
}: AutistiEventoModalProps) {
  const [showJson, setShowJson] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [mezziByTarga, setMezziByTarga] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [createFrom, setCreateFrom] = useState<CreateFrom | null>(null);
  const [createDescrizione, setCreateDescrizione] = useState("");
  const [createUrgenza, setCreateUrgenza] = useState<"bassa" | "media" | "alta">("media");
  const [createTarga, setCreateTarga] = useState("");
  const [createTipo, setCreateTipo] = useState<"targa" | "magazzino">("targa");
  const [createNote, setCreateNote] = useState("");
  const [createAlsoRimorchio, setCreateAlsoRimorchio] = useState(false);
  const targhe = useTarghe();

  useEffect(() => {
    let active = true;
    (async () => {
      const raw = await getItemSync("@mezzi_aziendali");
      const list = Array.isArray(raw)
        ? raw
        : raw?.value && Array.isArray(raw.value)
        ? raw.value
        : [];
      const map: Record<string, string> = {};
      for (const m of list) {
        const targa =
          m?.targa ??
          m?.targaCamion ??
          m?.targaMotrice ??
          m?.targaRimorchio ??
          null;
        const categoria =
          m?.categoria ??
          m?.categoriaMezzo ??
          m?.tipoMezzo ??
          m?.tipo ??
          null;
        if (targa && categoria && !map[String(targa)]) {
          map[String(targa)] = String(categoria);
        }
      }
      if (active) setMezziByTarga(map);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setShowJson(false);
    setLightboxSrc(null);
    setCreateOpen(false);
    setCreateFrom(null);
  }, [event]);

  function closeDetails() {
    setLightboxSrc(null);
    setCreateOpen(false);
    setCreateFrom(null);
    onClose();
  }

  function getTipoLabel(tipo: HomeEvent["tipo"]) {
    switch (tipo) {
      case "rifornimento":
        return "RIFORNIMENTO";
      case "segnalazione":
        return "SEGNALAZIONE";
      case "controllo":
        return "CONTROLLO MEZZO";
      case "cambio_mezzo":
        return "CAMBIO MEZZO";
      case "richiesta_attrezzature":
        return "RICHIESTA ATTREZZATURE";
      case "gomme":
        return "GOMME";
      default:
        return "EVENTO";
    }
  }

  function formatDateTime(ts?: number) {
    return formatDateTimeUI(ts ?? null);
  }

  function handleExportPdf(e: HomeEvent) {
    const p: any = e.payload || {};
    switch (e.tipo) {
      case "segnalazione":
        void generateSegnalazionePDF(p);
        return;
      case "controllo":
        void generateControlloPDF(p);
        return;
      case "richiesta_attrezzature":
        void generateRichiestaAttrezzaturePDF(p);
        return;
      case "rifornimento":
        void generateRifornimentoPDF(p);
        return;
      case "cambio_mezzo":
        void generateCambioMezzoPDF(p);
        return;
      default:
        return;
    }
  }

  function fmtTarga(value?: string | null) {
    return value ? String(value).toUpperCase().trim() : "";
  }

  function todayYmd() {
    return new Date().toISOString().substring(0, 10);
  }

  function genId() {
    const c: any = globalThis.crypto;
    if (c?.randomUUID) return c.randomUUID();
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  async function loadArray(key: string) {
    const raw = await getItemSync(key);
    return Array.isArray(raw) ? raw : [];
  }

  async function saveArray(key: string, arr: any[]) {
    await setItemSync(key, arr);
  }

  async function updateGommeRecord(recordId: string, patch: any) {
    if (!recordId) return;
    const raw = (await getItemSync(KEY_GOMME_TMP)) || [];
    const list = Array.isArray(raw) ? raw : [];
    const updated = list.map((r: any) => {
      if (String(r?.id ?? "") !== String(recordId)) return r;
      return { ...r, ...patch };
    });
    await setItemSync(KEY_GOMME_TMP, updated);
  }

  async function importGommeRecord(record: any) {
    if (!record?.id) return;
    const raw = (await getItemSync(KEY_GOMME_EVENTI)) || [];
    const list = Array.isArray(raw) ? raw : [];
    const { letta, stato, ...ufficiale } = record;
    await setItemSync(KEY_GOMME_EVENTI, [...list, ufficiale]);
    await updateGommeRecord(String(record.id), { stato: "importato", letta: true });
  }

  function resolveGommeAsseLabel(payload: any) {
    const raw = payload?.asseLabel ?? payload?.asseId ?? "";
    return String(raw ?? "").trim();
  }

  function buildGommeDescrizione(payload: any) {
    const asseValue = resolveGommeAsseLabel(payload) || "N/D";
    const marcaRaw = payload?.marca ?? "";
    const marcaValue = String(marcaRaw ?? "").trim() || "N/D";
    const kmRaw = payload?.km ?? payload?.kmMezzo;
    const kmValue =
      typeof kmRaw === "number"
        ? String(kmRaw)
        : typeof kmRaw === "string" && kmRaw.trim()
        ? kmRaw.trim()
        : "N/D";
    const lines = [
      "CAMBIO GOMME",
      `asse: ${asseValue}`,
      `marca: ${marcaValue}`,
      `km mezzo: ${kmValue}`,
    ];
    const tipo = String(payload?.tipo ?? "").trim();
    if (tipo) lines.push(`intervento: ${tipo}`);
    const rotazioneText = String(payload?.rotazioneText ?? "").trim();
    if (rotazioneText) lines.push(`rotazione: ${rotazioneText}`);
    return lines.join("\n");
  }

  function getGommeTimestamp(payload: any, fallback?: number) {
    if (typeof payload?.timestamp === "number" && Number.isFinite(payload.timestamp)) {
      return payload.timestamp;
    }
    if (typeof payload?.data === "number" && Number.isFinite(payload.data)) {
      return payload.data;
    }
    if (typeof fallback === "number" && Number.isFinite(fallback)) {
      return fallback;
    }
    return Date.now();
  }

  function fmtDate(ms: number) {
    const d = new Date(ms);
    const gg = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${gg} ${mm} ${yy}`;
  }

  async function appendGommeManutenzione(selected: HomeEvent) {
    const payload = selected.payload || {};
    try {
      const targaRaw =
        payload?.targetTarga ??
        payload?.targa ??
        selected.targa ??
        payload?.targaCamion ??
        payload?.targaMotrice ??
        payload?.targaRimorchio ??
        "";
      const targa = fmtTarga(targaRaw);
      const dataMs = getGommeTimestamp(payload, selected.timestamp);
      const data = fmtDate(dataMs);
      const descrizione = buildGommeDescrizione(payload);
      const kmRaw = payload?.km ?? payload?.kmMezzo;
      const km =
        typeof kmRaw === "number" && Number.isFinite(kmRaw)
          ? kmRaw
          : typeof kmRaw === "string" && kmRaw.trim() && Number.isFinite(Number(kmRaw))
          ? Number(kmRaw)
          : null;

      const nuovaVoce = {
        id: Date.now().toString(),
        targa,
        tipo: "mezzo",
        descrizione,
        data,
        km,
        materiali: [],
      };

      const raw = (await getItemSync(KEY_MANUTENZIONI)) || [];
      const list = Array.isArray(raw) ? raw : [];
      await setItemSync(KEY_MANUTENZIONI, [...list, nuovaVoce]);
    } catch (err) {
      console.error("Errore salvataggio manutenzione gomme:", err);
      window.alert("Errore salvataggio manutenzione gomme.");
    }
  }

  async function handleImportGomme(selected: HomeEvent) {
    const payload = selected.payload || {};
    if (!payload?.id) return;
    await importGommeRecord(payload);
    await appendGommeManutenzione(selected);
    if (onAfterGommeImport) {
      await onAfterGommeImport();
    }
    closeDetails();
  }

  function hasLinkedLavoro(payload: any) {
    if (!payload) return false;
    if (payload.linkedLavoroId) return true;
    if (Array.isArray(payload.linkedLavoroIds) && payload.linkedLavoroIds.length > 0) {
      return true;
    }
    return false;
  }

  function openCreateFromSegnalazione(p: any) {
    if (hasLinkedLavoro(p)) return;
    const targa =
      p?.targa ?? p?.targaCamion ?? p?.targaRimorchio ?? "";
    const cleanTarga = fmtTarga(targa);
    const tipo = cleanTarga ? "targa" : "magazzino";
    const tipoProblema = String(p?.tipoProblema ?? "").trim();
    const descr = String(p?.descrizione ?? "").trim();
    const descrizione = `Segnalazione: ${tipoProblema} - ${descr}`.trim();
    setCreateFrom({ tipo: "segnalazione", payload: p });
    setCreateDescrizione(descrizione === "Segnalazione: -" ? "Segnalazione" : descrizione);
    setCreateUrgenza(p?.flagVerifica ? "alta" : "media");
    setCreateTarga(cleanTarga);
    setCreateTipo(tipo);
    setCreateNote("");
    setCreateAlsoRimorchio(false);
    setCreateOpen(true);
  }

  function openCreateFromControllo(p: any) {
    if (hasLinkedLavoro(p)) return;
    const check = p?.check ?? {};
    const koList = Object.entries(check)
      .filter(([, v]) => v === false)
      .map(([k]) => String(k).toUpperCase());
    if (koList.length === 0) {
      window.alert("Controllo OK: nessun lavoro.");
      return;
    }
    const target = String(p?.target ?? "").toLowerCase();
    const targaCamion = fmtTarga(p?.targaCamion ?? p?.targaMotrice ?? "");
    const targaRimorchio = fmtTarga(p?.targaRimorchio ?? "");
    const defaultTarga =
      target === "rimorchio"
        ? targaRimorchio
        : targaCamion;
    const tipo = defaultTarga ? "targa" : "magazzino";
    setCreateFrom({ tipo: "controllo", payload: p });
    setCreateDescrizione(`Controllo KO: ${koList.join(", ")}`.trim());
    setCreateUrgenza(
      koList.length > 1 || p?.obbligatorio === true ? "alta" : "media"
    );
    setCreateTarga(defaultTarga);
    setCreateTipo(tipo);
    setCreateNote("");
    setCreateAlsoRimorchio(
      target === "entrambi" && !!targaCamion && !!targaRimorchio
    );
    setCreateOpen(true);
  }

  async function confirmCreateLavoro() {
    if (!createFrom) return;
    const p = createFrom.payload || {};
    const descrizione = createDescrizione.trim();
    if (!descrizione) return;
    const targaClean = fmtTarga(createTarga);
    const tipo = createTipo === "targa" && targaClean ? "targa" : "magazzino";
    const gruppoId = genId();
    const base = {
      gruppoId,
      tipo,
      descrizione,
      dataInserimento: todayYmd(),
      eseguito: false,
      urgenza: createUrgenza,
      segnalatoDa: String(p?.autistaNome ?? p?.badgeAutista ?? "autista"),
      sottoElementi: [],
      dettagli: createNote.trim() || null,
    };

    const nuovi: any[] = [];
    if (createFrom.tipo === "controllo") {
      const target = String(p?.target ?? "").toLowerCase();
      const targaCamion = fmtTarga(p?.targaCamion ?? p?.targaMotrice ?? "");
      const targaRimorchio = fmtTarga(p?.targaRimorchio ?? "");
      const motriceLavoro = targaClean || targaCamion;
      if (motriceLavoro) {
        nuovi.push({
          id: genId(),
          targa: motriceLavoro,
          ...base,
          source: { type: "controllo", id: p?.id ?? null, key: "@controlli_mezzo_autisti" },
        });
      } else {
        nuovi.push({
          id: genId(),
          targa: "",
          ...base,
          tipo: "magazzino",
          source: { type: "controllo", id: p?.id ?? null, key: "@controlli_mezzo_autisti" },
        });
      }
      if (
        createAlsoRimorchio &&
        target === "entrambi" &&
        targaRimorchio
      ) {
        nuovi.push({
          id: genId(),
          targa: targaRimorchio,
          ...base,
          tipo: "targa",
          source: { type: "controllo", id: p?.id ?? null, key: "@controlli_mezzo_autisti" },
        });
      }
    } else {
      nuovi.push({
        id: genId(),
        targa: tipo === "targa" ? targaClean : "",
        ...base,
        tipo,
        source: { type: "segnalazione", id: p?.id ?? null, key: "@segnalazioni_autisti_tmp" },
      });
    }

    if (nuovi.length === 0) return;
    const existing = await loadArray("@lavori");
    await saveArray("@lavori", [...existing, ...nuovi]);

    if (createFrom.tipo === "segnalazione") {
      const arr = await loadArray("@segnalazioni_autisti_tmp");
      const updated = arr.map((r: any) => {
        if (String(r?.id ?? "") !== String(p?.id ?? "")) return r;
        const next = { ...r, linkedLavoroId: nuovi[0].id, letta: true };
        if ("stato" in r || r?.stato) next.stato = "presa_in_carico";
        return next;
      });
      await saveArray("@segnalazioni_autisti_tmp", updated);
    }

    if (createFrom.tipo === "controllo") {
      const arr = await loadArray("@controlli_mezzo_autisti");
      const updated = arr.map((r: any) => {
        if (String(r?.id ?? "") !== String(p?.id ?? "")) return r;
        const next: any = { ...r, letta: true };
        if (nuovi.length > 1) {
          next.linkedLavoroIds = nuovi.map((n) => n.id);
          next.linkedMultiple = true;
        } else {
          next.linkedLavoroId = nuovi[0].id;
        }
        return next;
      });
      await saveArray("@controlli_mezzo_autisti", updated);
    }

    setCreateOpen(false);
    setCreateFrom(null);
    window.alert("Lavoro creato.");
  }

  function getAutistaInfo(e: HomeEvent) {
    const p: any = e.payload || {};
    const autistaObj =
      p.autista && typeof p.autista === "object" ? p.autista : null;
    const nome =
      autistaObj?.nome ??
      p.autista ??
      p.autistaNome ??
      p.nomeAutista ??
      e.autista ??
      "-";
    const badge = autistaObj?.badge ?? p.badgeAutista ?? p.badge ?? null;
    return {
      nome: String(nome || "-"),
      badge: badge ? String(badge) : null,
    };
  }

  function getCambioInfo(e: HomeEvent) {
    const p: any = e.payload || {};
    const tipo = String(p.tipo ?? p.tipoOperativo ?? p.fsTipo ?? "CAMBIO_ASSETTO");
    const tipoLabel = tipo.replace(/_/g, " ");
    const autista = getAutistaInfo(e);
    const prima = {
      motrice:
        p?.primaMotrice ??
        p?.prima?.motrice ??
        p?.prima?.targaMotrice ??
        p?.prima?.targaCamion ??
        null,
      rimorchio:
        p?.primaRimorchio ??
        p?.prima?.rimorchio ??
        p?.prima?.targaRimorchio ??
        null,
    };
    const dopo = {
      motrice:
        p?.dopoMotrice ??
        p?.dopo?.motrice ??
        p?.dopo?.targaMotrice ??
        p?.dopo?.targaCamion ??
        p?.targaMotrice ??
        p?.targaCamion ??
        null,
      rimorchio:
        p?.dopoRimorchio ??
        p?.dopo?.rimorchio ??
        p?.dopo?.targaRimorchio ??
        p?.targaRimorchio ??
        null,
    };
    const isInizio = tipo === "INIZIO_ASSETTO";
    return {
      tipo,
      tipoLabel,
      isInizio,
      nomeAutista: autista.nome || "-",
      badgeAutista: autista.badge,
      prima,
      dopo,
      luogo: p?.luogo ?? null,
      condizioni: p?.condizioni ?? null,
      statoCarico: p?.statoCarico ?? null,
    };
  }

  function getCategoria(targa?: string | null) {
    if (!targa) return null;
    return mezziByTarga[String(targa)] ?? null;
  }

  function buildMezzoRows(e: HomeEvent) {
    const p: any = e.payload || {};
    const rows: Array<{ label: string; targa: string; categoria?: string | null }> = [];
    if (e.tipo === "segnalazione") {
      const ambito = String(p.ambito ?? "").toLowerCase();
      if (ambito === "rimorchio") {
        const t = p.targaRimorchio ?? null;
        if (t) rows.push({ label: "Rimorchio", targa: String(t), categoria: getCategoria(t) });
      } else {
        const t = p.targaCamion ?? p.targaMotrice ?? null;
        if (t) rows.push({ label: "Motrice", targa: String(t), categoria: getCategoria(t) });
      }
    } else if (e.tipo === "rifornimento") {
      const t = p.targaCamion ?? p.targaMotrice ?? null;
      if (t) rows.push({ label: "Motrice", targa: String(t), categoria: getCategoria(t) });
    } else if (e.tipo === "controllo") {
      const tm = p.targaCamion ?? p.targaMotrice ?? null;
      const tr = p.targaRimorchio ?? null;
      if (tm) rows.push({ label: "Motrice", targa: String(tm), categoria: getCategoria(tm) });
      if (tr) rows.push({ label: "Rimorchio", targa: String(tr), categoria: getCategoria(tr) });
    } else if (e.tipo === "cambio_mezzo") {
      const t = p.targaMotrice ?? p.targaCamion ?? e.targa ?? null;
      if (t) rows.push({ label: "Motrice", targa: String(t), categoria: getCategoria(t) });
    } else if (e.tipo === "gomme") {
      const targetType = String(p.targetType ?? "").toLowerCase();
      const t = p.targetTarga ?? e.targa ?? null;
      if (t) {
        rows.push({
          label: targetType === "rimorchio" ? "Rimorchio" : "Motrice",
          targa: String(t),
          categoria: getCategoria(t),
        });
      }
    }
    return rows;
  }

  function formatValue(v: any) {
    if (v === undefined || v === null || v === "") return null;
    if (typeof v === "boolean") return v ? "OK" : "KO";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  }

  function formatCambioSide(value: string | null) {
    return value ? String(value) : "INIZIO";
  }

  function formatCambioSnapshotBlock(snapshot: { motrice: string | null; rimorchio: string | null }) {
    const motrice = formatCambioSide(snapshot.motrice);
    const rimorchio = formatCambioSide(snapshot.rimorchio);
    return `Motrice: ${motrice}\nRimorchio: ${rimorchio}`;
  }

  function buildDetailsRows(e: HomeEvent) {
    const p: any = e.payload || {};
    const rows: Array<{ label: string; value: string }> = [];

    if (e.tipo === "segnalazione") {
      const tipoProblema = formatValue(p.tipoProblema);
      const descrizione = formatValue(p.descrizione);
      const note = formatValue(p.note);
      const stato = formatValue(p.stato);
      if (tipoProblema) rows.push({ label: "Tipo problema", value: tipoProblema });
      if (descrizione) rows.push({ label: "Descrizione", value: descrizione });
      if (note) rows.push({ label: "Note", value: note });
      if (stato) rows.push({ label: "Stato", value: stato });
    } else if (e.tipo === "rifornimento") {
      const litri = formatValue(p.litri ?? p.quantita);
      const km = formatValue(p.km);
      const importo = formatValue(p.importo);
      const paese = formatValue(p.paese);
      const metodoPagamento = formatValue(p.metodoPagamento);
      const tipo = formatValue(p.tipo);
      const note = formatValue(p.note);
      if (litri) rows.push({ label: "Litri", value: litri });
      if (km) rows.push({ label: "Km", value: km });
      if (importo) rows.push({ label: "Importo", value: importo });
      if (paese) rows.push({ label: "Paese", value: paese });
      if (metodoPagamento) rows.push({ label: "Metodo pagamento", value: metodoPagamento });
      if (tipo) rows.push({ label: "Tipo", value: tipo });
      if (note) rows.push({ label: "Note", value: note });
    } else if (e.tipo === "controllo") {
      const esito = formatValue(p.esito ?? p.tuttoOk ?? p.ok);
      const condizioni = formatValue(p.condizioni);
      const statoCarico = formatValue(p.statoCarico);
      const luogo = formatValue(p.luogo);
      const note = formatValue(p.note);
      if (esito) rows.push({ label: "Esito", value: esito });
      if (condizioni) rows.push({ label: "Condizioni", value: condizioni });
      if (statoCarico) rows.push({ label: "Stato carico", value: statoCarico });
      if (luogo) rows.push({ label: "Luogo", value: luogo });
      if (note) rows.push({ label: "Note", value: note });
    } else if (e.tipo === "cambio_mezzo") {
      const luogo = formatValue(p.luogo);
      const statoCarico = formatValue(p.statoCarico);
      const condizioni = formatValue(p.condizioni);
      const note = formatValue(p.note);
      if (luogo) rows.push({ label: "Luogo", value: luogo });
      if (statoCarico) rows.push({ label: "Stato carico", value: statoCarico });
      if (condizioni) rows.push({ label: "Condizioni", value: condizioni });
      if (note) rows.push({ label: "Note", value: note });
    } else if (e.tipo === "gomme") {
      const tipo = formatValue(p.tipo);
      const km = formatValue(p.km);
      const asse = formatValue(p.asseLabel ?? p.asseId);
      const gommeIds = Array.isArray(p.gommeIds)
        ? p.gommeIds.join(", ")
        : formatValue(p.gommeIds);
      const rotazione = formatValue(p.rotazioneSchema ?? p.rotazioneText);
      const stato = formatValue(p.stato);
      if (tipo) rows.push({ label: "Tipo intervento", value: tipo });
      if (km) rows.push({ label: "Km", value: km });
      if (asse) rows.push({ label: "Asse", value: asse });
      if (gommeIds) rows.push({ label: "Gomme", value: gommeIds });
      if (rotazione) rows.push({ label: "Rotazione", value: rotazione });
      if (stato) rows.push({ label: "Stato", value: stato });
    } else if (e.tipo === "richiesta_attrezzature") {
      const testo = formatValue(p.testo ?? p.richiesta ?? p.messaggio);
      if (testo) rows.push({ label: "Testo", value: testo });
    }

    return rows;
  }

  function getFotoList(p: any) {
    const list: string[] = [];
    if (Array.isArray(p?.foto)) {
      for (const f of p.foto) {
        if (typeof f === "string") list.push(f);
        else if (f?.dataUrl) list.push(String(f.dataUrl));
        else if (f?.url) list.push(String(f.url));
      }
    }
    if (p?.fotoDataUrl) list.push(String(p.fotoDataUrl));
    if (p?.fotoUrl) list.push(String(p.fotoUrl));
    if (Array.isArray(p?.fotoUrls)) {
      for (const u of p.fotoUrls) {
        if (u) list.push(String(u));
      }
    }
    return list;
  }

  const detailsTitle = useMemo(() => {
    if (!event) return "";
    return getTipoLabel(event.tipo);
  }, [event]);

  function renderDetailsRows(e: HomeEvent) {
    const rows = buildDetailsRows(e);
    return rows.map((row, index) => (
      <div key={`${row.label}-${index}`} className="aix-row">
        <div className="aix-row-top">
          <strong>{row.label}</strong>
          <span>{row.value}</span>
        </div>
      </div>
    ));
  }

  if (!event) return null;

  const p: any = event.payload || {};
  const { nome, badge } = getAutistaInfo(event);
  const autistaLabel = badge ? `${nome} (${badge})` : nome;
  const mezzoRows = buildMezzoRows(event);
  const detailRows = buildDetailsRows(event);
  const fotoList = getFotoList(p);
  const isCambioMezzo = event.tipo === "cambio_mezzo";
  const cambioInfo = isCambioMezzo ? getCambioInfo(event) : null;
  const canExportPdf =
    event.tipo === "segnalazione" ||
    event.tipo === "controllo" ||
    event.tipo === "richiesta_attrezzature" ||
    event.tipo === "rifornimento" ||
    event.tipo === "cambio_mezzo";
  const isGomme = event.tipo === "gomme";

  return (
    <>
      <div className="aix-backdrop" onClick={closeDetails}>
        <div className="aix-modal" onClick={(e) => e.stopPropagation()}>
          <div className="aix-head">
            <div>
              <h3>{detailsTitle}</h3>
              <div style={{ fontSize: "13px", opacity: 0.8 }}>
                {autistaLabel}
              </div>
            </div>
            <button className="aix-close" onClick={closeDetails} aria-label="Chiudi">
              X
            </button>
          </div>
          <div className="aix-body">
            <div className="aix-row">
              <div className="aix-row-top">
                <strong>DATA/ORA</strong>
                <span>{formatDateTime(event.timestamp)}</span>
              </div>
            </div>

            {isCambioMezzo && cambioInfo ? (
              <>
                <div className="aix-row">
                  <div className="aix-row-top">
                    <strong>PRIMA</strong>
                  </div>
                  <div className="aix-row-bot">
                    {formatCambioSnapshotBlock(cambioInfo.prima)}
                  </div>
                </div>
                <div className="aix-row">
                  <div className="aix-row-top">
                    <strong>DOPO</strong>
                  </div>
                  <div className="aix-row-bot">
                    {formatCambioSnapshotBlock(cambioInfo.dopo)}
                  </div>
                </div>
              </>
            ) : null}

            {mezzoRows.length > 0 && (
              <>
                <div className="aix-row">
                  <div className="aix-row-top">
                    <strong>MEZZO</strong>
                  </div>
                </div>
                {mezzoRows.map((row, index) => (
                  <div key={`mezzo-${index}`} className="aix-row">
                    <div className="aix-row-top">
                      <strong>{row.label}</strong>
                      <span>{row.targa}</span>
                    </div>
                    {row.categoria ? (
                      <div className="aix-row-bot">
                        Categoria: {row.categoria}
                      </div>
                    ) : null}
                  </div>
                ))}
              </>
            )}

            {detailRows.length > 0 && (
              <>
                <div className="aix-row">
                  <div className="aix-row-top">
                    <strong>DETTAGLI</strong>
                  </div>
                </div>
                {renderDetailsRows(event)}
              </>
            )}

            {(event.tipo === "segnalazione" ||
              event.tipo === "controllo") && (
              <div className="aix-row">
                <div className="aix-row-top">
                  <strong>LAVORO</strong>
                </div>
                <div className="aix-row-bot">
                  <button
                    type="button"
                    className="aix-create-btn"
                    disabled={hasLinkedLavoro(p)}
                    onClick={() => {
                      if (event.tipo === "segnalazione") {
                        openCreateFromSegnalazione(p);
                      } else {
                        openCreateFromControllo(p);
                      }
                    }}
                  >
                    {hasLinkedLavoro(p) ? "GIÀ CREATO" : "CREA LAVORO"}
                  </button>
                </div>
              </div>
            )}

            {canExportPdf && (
              <div className="aix-row">
                <div className="aix-row-top">
                  <strong>PDF</strong>
                </div>
                <div className="aix-row-bot">
                  <button
                    type="button"
                    className="aix-create-btn"
                    onClick={() => handleExportPdf(event)}
                  >
                    ESPORTA PDF
                  </button>
                </div>
              </div>
            )}

            {isGomme && (
              <div className="aix-row">
                <div className="aix-row-top">
                  <strong>DOSSIER</strong>
                </div>
                <div className="aix-row-bot">
                  <button
                    type="button"
                    className="aix-create-btn"
                    onClick={() => void handleImportGomme(event)}
                  >
                    IMPORTA IN DOSSIER
                  </button>
                </div>
              </div>
            )}

            {fotoList.length > 0 && (
              <>
                <div className="aix-row">
                  <div className="aix-row-top">
                    <strong>ALLEGATI/FOTO</strong>
                  </div>
                </div>
                <div className="aix-row">
                  <div className="aix-row-bot">
                    <div className="aix-photo-grid">
                      {fotoList.map((src, index) => (
                        <button
                          type="button"
                          key={`foto-${index}`}
                          className="aix-photo-thumb"
                          onClick={() => setLightboxSrc(src)}
                        >
                          <img src={src} alt="Foto" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="aix-row">
              <div className="aix-row-top">
                <strong>JSON</strong>
                <button
                  type="button"
                  className="daily-more"
                  onClick={() => setShowJson((v) => !v)}
                >
                  {showJson ? "Nascondi JSON" : "Mostra JSON"}
                </button>
              </div>
            </div>
            {showJson ? (
              <pre className="aix-json">
                {JSON.stringify(p ?? {}, null, 2)}
              </pre>
            ) : null}
          </div>
        </div>
      </div>

      {createOpen && createFrom && (
        <div className="aix-create-backdrop" onClick={() => setCreateOpen(false)}>
          <div className="aix-create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="aix-create-head">
              <h3>Crea lavoro</h3>
              <button
                type="button"
                className="aix-create-close"
                onClick={() => setCreateOpen(false)}
              >
                X
              </button>
            </div>
            <div className="aix-create-body">
              <label className="aix-create-label">
                Descrizione
                <textarea
                  className="aix-create-input"
                  value={createDescrizione}
                  onChange={(e) => setCreateDescrizione(e.target.value)}
                />
              </label>
              <label className="aix-create-label">
                Urgenza
                <select
                  className="aix-create-select"
                  value={createUrgenza}
                  onChange={(e) =>
                    setCreateUrgenza(e.target.value as "bassa" | "media" | "alta")
                  }
                >
                  <option value="bassa">Bassa</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </label>
              <label className="aix-create-label">
                Target/Targa
                <TargaPicker
                  value={createTarga}
                  targhe={targhe}
                  placeholder="Targa (opzionale)"
                  inputClassName="aix-create-input"
                  onChange={(value) => {
                    const v = value.toUpperCase();
                    setCreateTarga(v);
                    setCreateTipo(v.trim() ? "targa" : "magazzino");
                  }}
                />
              </label>
              <label className="aix-create-label">
                Note
                <textarea
                  className="aix-create-input"
                  value={createNote}
                  onChange={(e) => setCreateNote(e.target.value)}
                  placeholder="Opzionale"
                />
              </label>
              {createFrom.tipo === "controllo" &&
                String(createFrom.payload?.target ?? "").toLowerCase() ===
                  "entrambi" &&
                fmtTarga(createFrom.payload?.targaCamion ?? "") &&
                fmtTarga(createFrom.payload?.targaRimorchio ?? "") && (
                  <label className="aix-create-toggle">
                    <input
                      type="checkbox"
                      checked={createAlsoRimorchio}
                      onChange={(e) => setCreateAlsoRimorchio(e.target.checked)}
                    />
                    <span>Crea anche per rimorchio</span>
                  </label>
                )}
              <div className="aix-create-actions">
                <button
                  type="button"
                  className="aix-create-cancel"
                  onClick={() => setCreateOpen(false)}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  className="aix-create-confirm"
                  onClick={confirmCreateLavoro}
                >
                  Conferma
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {lightboxSrc && (
        <div className="aix-lightbox" onClick={() => setLightboxSrc(null)}>
          <button
            type="button"
            className="aix-lightbox-close"
            onClick={() => setLightboxSrc(null)}
            aria-label="Chiudi"
          >
            X
          </button>
          <img
            src={lightboxSrc}
            alt="Foto"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
