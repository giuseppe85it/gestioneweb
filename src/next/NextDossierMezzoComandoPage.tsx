import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PdfPreviewModal from "../components/PdfPreviewModal";
import { formatDateTimeUI, formatDateUI } from "./nextDateFormat";
import { generateDossierComandoPDFBlob } from "../utils/pdfEngine";
import {
  buildPdfShareText,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../utils/pdfPreview";
import "../pages/DossierMezzo.css";
import "./next-shell.css";
import NextMezzoEditModal from "./components/NextMezzoEditModal";
import { FraseStoriaRecord } from "./components/FraseStoriaRecord";
import {
  buildNextDossierMezzoLegacyView,
  readNextDossierMezzoCompositeSnapshot,
  type NextDossierFatturaPreventivoLegacyItem,
  type NextDossierLegacyWorkItem,
  type NextDossierManutenzioneLegacyItem,
  type NextDossierMezzoLegacyViewState,
} from "./domain/nextDossierMezzoDomain";
import { recordChiusoFromRaw } from "./helpers/frasestoriaRecord";
import { deleteNextDocumentoCosto } from "./domain/nextDocumentiCostiDomain";
import {
  buildNextAnalisiEconomicaPath,
  buildNextCentroControlloRifornimentiPath,
  buildNextManutenzioniPath,
  NEXT_DOSSIER_LISTA_PATH,
  NEXT_IA_DOCUMENTI_PATH,
} from "./nextStructuralPaths";
import { runWithCloneWriteScopedAllowance } from "../utils/cloneWriteBarrier";
import { toDisplay } from "./helpers/dateUnica";
import {
  gommePerAsseSetAttualeMeta,
  gommePerAsseSetPrecedenteMeta,
} from "./helpers/gommePerAsseFormat";
import { computeVehicleMedianKmL, normalizeRefuelRecord } from "./helpers/refuelAnomalies";
import type { RefuelRow } from "./types/centroControlloTypes";
import {
  readNextMezzoSegnalazioniControlliSnapshot,
  type NextMezzoControlloItem,
  type NextMezzoSegnalazioneItem,
  type NextMezzoSegnalazioniControlliSnapshot,
} from "./domain/nextSegnalazioniControlliDomain";
import {
  normalizeScadenzaTarga,
  readNextManutenzioniScadenzeSnapshot,
  type NextManutenzioneScadenzaItem,
} from "./domain/nextManutenzioniScadenzeDomain";
import NextMezzoCronologiaModal, {
  describeEvento,
} from "./components/NextMezzoCronologiaModal";
import {
  readNextSessioneAttivaPerTarga,
  readNextSessioniStoricoPerTarga,
  type NextSessioneAttiva,
  type NextSessioneStoricoEvent,
} from "./domain/nextSessioniStoricoDomain";

type Currency = "EUR" | "CHF" | "UNKNOWN";

const CLONE_READ_ONLY_PREVENTIVO_DELETE_MESSAGE =
  "Clone read-only: eliminazione preventivo non disponibile.";
const DOSSIER_DELETE_SIMPLE_MESSAGE = "Eliminare questa fattura?";
const DOSSIER_DELETE_LINKED_MESSAGE =
  "Questa fattura ha una manutenzione collegata. Eliminando la fattura la manutenzione rimarra. Confermi l'eliminazione?";

const COMANDO_CSS = `
  .dc{ --ink:#18222f; --soft:#5a6675; --faint:#8a94a2; --line:#e0e5ec; --accent:#2f6bd6; --danger:#cf3b3b; --warn:#c9820a; --ok:#1f9457; --chf:#25303f; --eur:#3a5db0; --unk:#b07a12; font-family:"Segoe UI",system-ui,-apple-system,sans-serif; color:var(--ink); max-width:1320px; margin:0 auto; padding:8px 4px 40px; }
  .dc *{box-sizing:border-box;}
  .dc .mono{font-family:ui-monospace,"Cascadia Mono",Consolas,monospace;}
  .dc-top{display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center;background:linear-gradient(180deg,#16243a,#0f1a2b);color:#eef2f8;border-radius:10px;padding:16px 18px;}
  .dc-idleft{display:flex;gap:14px;align-items:center;}
  .dc-photo{width:104px;height:76px;border-radius:7px;flex:none;background:#26344b;background-size:cover;background-position:center;border:1px solid #38496685;display:flex;align-items:center;justify-content:center;color:#8294b3;font-size:10px;text-transform:uppercase;cursor:pointer;}
  .dc-plate{font-size:28px;font-weight:700;letter-spacing:.04em;line-height:1;}
  .dc-model{font-size:14px;color:#c4d0e0;margin-top:3px;}
  .dc-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;}
  .dc-chip{font-size:12px;padding:3px 9px;border-radius:20px;background:#ffffff14;border:1px solid #ffffff26;color:#d8e2f0;}
  .dc-eyebrow{text-align:center;font-size:11px;letter-spacing:.06em;color:#9fb0c4;}
  .dc-now{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center;}
  .dc-now-tag{font-size:10px;font-weight:700;letter-spacing:.12em;color:#9fb0c4;text-transform:uppercase;}
  .dc-state{display:inline-flex;flex-direction:column;align-items:center;gap:3px;padding:9px 18px;border-radius:14px;background:#ffffff12;border:1px solid #ffffff24;max-width:340px;}
  .dc-state.on{background:#1f945722;border-color:#1f945766;}
  .dc-state-main{display:inline-flex;align-items:center;gap:8px;font-size:15px;font-weight:700;color:#eef2f8;line-height:1.15;}
  .dc-state-dot{width:10px;height:10px;border-radius:50%;flex:none;background:#9fb0c4;}
  .dc-state.on .dc-state-dot{background:#1f9457;box-shadow:0 0 0 3px #1f945733;}
  .dc-state-sub{font-size:12px;color:#b9c4d4;line-height:1.25;max-width:300px;}
  .dc-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;max-width:440px;}
  .dc-btn{font-size:12.5px;padding:8px 12px;border-radius:7px;cursor:pointer;background:#ffffff12;border:1px solid #ffffff2b;color:#e7eef8;white-space:nowrap;}
  .dc-btn.primary{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600;}
  .dc-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:14px 0;}
  .dc-kpi{background:#fff;border:1px solid var(--line);border-radius:10px;padding:14px 16px;position:relative;box-shadow:0 1px 2px rgba(20,30,45,.06);}
  .dc-kpi .top{position:absolute;top:0;left:16px;right:16px;height:3px;border-radius:0 0 3px 3px;}
  .dc-kpi .lab{font-size:12px;color:var(--soft);text-transform:uppercase;letter-spacing:.03em;}
  .dc-kpi .val{font-size:25px;font-weight:700;margin-top:6px;line-height:1.05;}
  .dc-kpi .val small{font-size:14px;font-weight:600;color:var(--soft);}
  .dc-kpi .sub{font-size:12px;color:var(--faint);margin-top:5px;}
  .dc-grid{display:grid;grid-template-columns:380px 1fr;gap:14px;align-items:start;}
  .dc-leftcol{display:flex;flex-direction:column;gap:14px;min-width:0;}
  .dc-rightcol{display:flex;flex-direction:column;gap:14px;min-width:0;}
  .dc-card{background:#fff;border:1px solid var(--line);border-radius:10px;box-shadow:0 1px 2px rgba(20,30,45,.06);overflow:hidden;display:flex;flex-direction:column;}
  .dc-card>h2{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:var(--soft);margin:0;padding:13px 16px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;gap:8px;font-weight:700;}
  .dc-card>h2 .count{font-size:12px;color:var(--faint);letter-spacing:0;text-transform:none;font-weight:400;}
  .dc-link{font-size:12px;color:var(--accent);background:none;border:none;cursor:pointer;padding:0;font-weight:600;}
  .dc-row{display:flex;gap:11px;padding:11px 16px;border-bottom:1px solid #eef1f5;align-items:flex-start;}
  .dc-row:last-child{border-bottom:none;}
  .dc-row.click{cursor:pointer;}
  .dc-dot{width:9px;height:9px;border-radius:50%;margin-top:5px;flex:none;}
  .dc-main{flex:1;min-width:0;}
  .dc-title{font-size:13.5px;font-weight:600;}
  .dc-sub{font-size:12px;color:var(--faint);margin-top:2px;}
  .dc-right{font-size:12.5px;font-weight:600;white-space:nowrap;}
  .dc-sub2{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--faint);padding:9px 16px 3px;background:#f8fafc;}
  .dc-empty{font-size:12.5px;color:var(--faint);padding:12px 16px;}
  .dc-detail .dc-empty{flex:1;display:flex;align-items:center;justify-content:center;text-align:center;min-height:52px;}
  .dc-tl-item{display:grid;grid-template-columns:74px 62px 1fr auto;gap:10px;padding:8px 16px;align-items:baseline;border-bottom:1px solid #f3f5f8;}
  .dc-tl-item:last-child{border-bottom:none;}
  .dc-tl-date{font-size:11.5px;color:var(--soft);font-weight:600;white-space:nowrap;}
  .dc-type{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;padding:3px 7px;border-radius:5px;text-align:center;white-space:nowrap;}
  .t-manut{background:#eaf1fb;color:#2f6bd6;} .t-rifor{background:#e9f6ef;color:#1f9457;} .t-doc{background:#f1edfb;color:#6b46c1;} .t-mat{background:#fff4e3;color:#b07a12;}
  .dc-tl-text{font-size:13px;} .dc-tl-meta{color:var(--faint);}
  .dc-tl-amt{font-size:12.5px;font-weight:700;white-space:nowrap;}
  .dc-band{display:flex;align-items:center;gap:14px;margin:26px 2px 14px;}
  .dc-band h2{font-size:15px;font-weight:700;margin:0;white-space:nowrap;}
  .dc-band .sub{font-size:12.5px;color:var(--faint);}
  .dc-band .ln{flex:1;height:1px;background:#cfd6e0;}
  .dc-detail{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:stretch;}
  .dc-span2{grid-column:1 / -1;}
  .dc-tech{display:grid;grid-template-columns:repeat(4,1fr);}
  .dc-techb{padding:13px 16px;border-right:1px solid #eef1f5;}
  .dc-techb:last-child{border-right:none;}
  .dc-techb h3{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--faint);margin:0 0 8px;}
  .dc-techb ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;}
  .dc-techb li{display:flex;justify-content:space-between;gap:10px;font-size:12.5px;}
  .dc-techb li span{color:var(--soft);}
  .dc-techb li strong{font-weight:700;text-align:right;}
  .dc-pill{display:inline-block;font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:5px;background:#e9f6ef;color:var(--ok);}
  .dc-pill.off{background:#f0f2f5;color:var(--faint);}
  .dc-twocol{display:grid;grid-template-columns:1fr 1fr;}
  .dc-twocol>div{padding:12px 16px;border-right:1px solid #eef1f5;}
  .dc-twocol>div:last-child{border-right:none;}
  .dc-twocol h3{font-size:12px;margin:0 0 10px;color:var(--soft);}
  .dc-ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px;}
  .dc-li{font-size:13px;cursor:pointer;}
  .dc-li .meta{font-size:11.5px;color:var(--faint);margin-top:3px;}
  .dc-badge{font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;margin-right:6px;vertical-align:middle;}
  .b-info{background:#eaf1fb;color:#2f6bd6;} .b-ok{background:#e9f6ef;color:var(--ok);} .b-danger{background:#fcebeb;color:var(--danger);} .b-muted{background:#f0f2f5;color:#475467;}
  .dc-dtable{width:100%;border-collapse:collapse;font-size:12.5px;}
  .dc-dtable th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.03em;color:var(--faint);padding:9px 12px;border-bottom:1px solid var(--line);background:#f8fafc;}
  .dc-dtable td{padding:9px 12px;border-bottom:1px solid #eef1f5;vertical-align:top;}
  .dc-dtable tr:last-child td{border-bottom:none;}
  .dc-doc{display:flex;gap:10px;align-items:flex-start;padding:10px 16px;border-bottom:1px solid #eef1f5;}
  .dc-doc:last-child{border-bottom:none;}
  .dc-doc .dm{flex:1;min-width:0;}
  .dc-doc .dt{font-size:13px;font-weight:600;}
  .dc-doc .ds{font-size:11.5px;color:var(--faint);margin-top:2px;}
  .dc-acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;}
  .dc-mini{font-size:11px;padding:4px 8px;border-radius:6px;border:1px solid #dbe1ea;background:#f6f8fb;color:#2f3a4b;cursor:pointer;}
  .dc-cur{display:inline-block;font-size:11px;font-weight:700;padding:1px 6px;border-radius:4px;margin-left:2px;}
  .cur-chf{background:var(--chf);color:#fff;} .cur-eur{background:#e8edf9;color:var(--eur);} .cur-unk{background:#fbf0d9;color:var(--unk);}
  .dc-photo-big{height:170px;background:#dde3ea;display:flex;align-items:center;justify-content:center;color:#8a94a2;font-size:12px;text-transform:uppercase;letter-spacing:.05em;background-size:cover;background-position:center;cursor:pointer;}
  .dc-cta{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;background:#f6f9ff;border-top:1px solid var(--line);}
  @media(max-width:1080px){.dc-top{grid-template-columns:1fr}.dc-kpis{grid-template-columns:repeat(2,1fr)}.dc-grid{grid-template-columns:1fr}.dc-detail{grid-template-columns:1fr}.dc-tech{grid-template-columns:repeat(2,1fr)}.dc-actions{justify-content:flex-start;max-width:none}}
`;

function readErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function parseDateFlexible(value: string | number | null | undefined): Date | null {
  if (!value) return null;
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const raw = String(value).trim();
  if (!raw) return null;
  // PRIMA il formato italiano gg/mm/aaaa (sep . / - o spazio): evita la lettura "all'americana" di new Date.
  const dmy = raw.match(/^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})$/);
  if (dmy) {
    const yearRaw = Number(dmy[3]);
    const year = dmy[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
    const date = new Date(year, Number(dmy[2]) - 1, Number(dmy[1]), 12, 0, 0, 0);
    if (!Number.isNaN(date.getTime())) return date;
  }
  // Fallback: lettura nativa (ISO aaaa-mm-gg, ISO con ora, timestamp testuali).
  const direct = new Date(raw);
  return Number.isNaN(direct.getTime()) ? null : direct;
}

// Per la timeline: prova SEMPRE il formato italiano gg/mm/aaaa PRIMA di new Date (evita la lettura "all'americana").
function timelineTimestamp(value: string | number | null | undefined): number | null {
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const dmy = raw.match(/^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})/);
  if (dmy) {
    const y = dmy[3].length === 2 ? Number(`20${dmy[3]}`) : Number(dmy[3]);
    const d = new Date(y, Number(dmy[2]) - 1, Number(dmy[1]), 12, 0, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function formatDossierDate(value: string | number | null | undefined): string {
  return toDisplay(value) || String(value ?? "").trim() || "-";
}

function formatChiusuraEventoTipo(value: string | null | undefined): string {
  if (value === "gomme_evento") return "cambio gomme";
  if (value === "manutenzione_eseguita") return "manutenzione eseguita";
  return value ? value.replace(/_/g, " ") : "evento";
}

function workBadge(item: NextDossierLegacyWorkItem, fallbackLabel: string, fallbackCls: string) {
  if (item.stato === "chiusa_da_evento") {
    const evento = formatChiusuraEventoTipo(item.chiusuraDi);
    const data = item.chiusuraData ? formatDateTimeUI(item.chiusuraData) : "-";
    return {
      label: "CHIUSA DA EVENTO",
      cls: "b-muted",
      title: data && data !== "-" ? `Chiusa dal ${evento} del ${data}` : `Chiusa dal ${evento}`,
    };
  }
  return { label: fallbackLabel, cls: fallbackCls, title: undefined as string | undefined };
}

function detectCurrency(input: unknown): Currency {
  if (!input) return "UNKNOWN";
  const text = String(input).toUpperCase();
  if (text.includes("CHF") || text.includes("FR.")) return "CHF";
  if (text.includes("EUR") || text.includes("EURO")) return "EUR";
  return "UNKNOWN";
}

function resolveCurrency(record: NextDossierFatturaPreventivoLegacyItem): Currency {
  const direct = detectCurrency(record.valuta ?? record.currency);
  if (direct !== "UNKNOWN") return direct;
  return detectCurrency([record.importo, record.descrizione, record.fornitoreLabel].filter(Boolean).join(" "));
}

function renderAmount(value: number | undefined, currency: Currency) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Importo n/d";
  return currency === "UNKNOWN" ? `${value.toFixed(2)} (valuta da verificare)` : `${value.toFixed(2)} ${currency}`;
}

function curBadge(currency: Currency) {
  if (currency === "CHF") return <span className="dc-cur cur-chf">CHF</span>;
  if (currency === "EUR") return <span className="dc-cur cur-eur">EUR</span>;
  return <span className="dc-cur cur-unk">?</span>;
}

function buildTotals(items: NextDossierFatturaPreventivoLegacyItem[]) {
  return items.reduce(
    (acc, item) => {
      const amount = typeof item.importo === "number" && Number.isFinite(item.importo) ? item.importo : 0;
      const currency = resolveCurrency(item);
      if (currency === "CHF") acc.chf += amount;
      else if (currency === "EUR") acc.eur += amount;
      else if (amount > 0) acc.unknown += 1;
      return acc;
    },
    { chf: 0, eur: 0, unknown: 0 },
  );
}

function formatKmOre(item: NextDossierManutenzioneLegacyItem) {
  const parts: string[] = [];
  if (typeof item.km === "number" && Number.isFinite(item.km)) parts.push(`${item.km} km`);
  if (typeof item.ore === "number" && Number.isFinite(item.ore)) parts.push(`${item.ore} ore`);
  return parts.join(" | ") || "-";
}

// Card "Stato gomme per asse": stesse funzioni usate dalla Scheda mezzo, cosi'
// le due pagine mostrano LA STESSA card. Il set attuale usa la data formattata
// del dossier.
function formatGommePerAsseMeta(item: NextDossierMezzoLegacyViewState["gommePerAsse"][number]) {
  return gommePerAsseSetAttualeMeta(item, formatDossierDate);
}

function formatGommeSetPrecedente(
  item: NextDossierMezzoLegacyViewState["gommePerAsse"][number],
): string | null {
  return gommePerAsseSetPrecedenteMeta(item);
}

function formatGommeStraordinarieMeta(item: NextDossierMezzoLegacyViewState["gommeStraordinarie"][number]) {
  const parts: string[] = [];
  parts.push(formatDossierDate(item.dataLabel));
  if (item.asseLabel) parts.push(item.asseLabel);
  if (typeof item.quantita === "number" && Number.isFinite(item.quantita)) {
    parts.push(`${item.quantita} gomma${item.quantita === 1 ? "" : "e"}`);
  }
  if (item.fornitore) parts.push(item.fornitore);
  return parts.join(" | ");
}

function buildTechBlocks(
  mezzo: NonNullable<NextDossierMezzoLegacyViewState["mezzo"]>,
): { title: string; rows: [string, unknown][] }[] {
  return [
    { title: "Identificazione", rows: [["Proprietario", mezzo.proprietario], ["Targa", mezzo.targa], ["Autista abituale", mezzo.autistaNome], ["Telaio / VIN", mezzo.telaio], ["Assicurazione", mezzo.assicurazione]] },
    { title: "Caratteristiche", rows: [["Marca", mezzo.marca], ["Modello", mezzo.modello], ["Categoria", mezzo.categoria], ["Colore", mezzo.colore]] },
    { title: "Motore e massa", rows: [["Cilindrata", mezzo.cilindrata], ["Potenza", mezzo.potenza], ["Massa complessiva", mezzo.massaComplessiva], ["Anno", mezzo.anno]] },
    { title: "Scadenze", rows: [["Immatricolazione", formatDateUI(parseDateFlexible(mezzo.dataImmatricolazione))], ["Revisione", formatDateUI(parseDateFlexible(mezzo.dataScadenzaRevisione))], ["Note", mezzo.note], ...(mezzo.manutenzioneProgrammata ? ([["Manut. programmata", "ATTIVA"], ["Contratto", mezzo.manutenzioneContratto], ["Periodo", `${formatDateUI(parseDateFlexible(mezzo.manutenzioneDataInizio))} - ${formatDateUI(parseDateFlexible(mezzo.manutenzioneDataFine))}`], ["KM massimi", mezzo.manutenzioneKmMax]] as [string, unknown][]) : ([["Manut. programmata", "NON ATTIVA"]] as [string, unknown][]))] },
  ];
}

// Regola di chiusura canonica (come la Sinottica, vedi nextAutistiDomain): un segnale è "chiuso"
// se ha un flag/stato di chiusura, i timbri di chiusura, oppure è agganciato a un lavoro.
function hasClosingStamp(
  raw: Record<string, unknown> | undefined,
  stato: string | null | undefined,
  chiusuraData?: number | null,
  chiusuraRefId?: string | null,
): boolean {
  const s = String(stato ?? "").toLowerCase();
  if (s.includes("chius") || s === "importata" || s === "importato" || s.includes("risolt")) return true;
  if (chiusuraData || chiusuraRefId) return true;
  if (!raw) return false;
  if (raw.chiusa === true || raw.chiuso === true) return true;
  if (raw.chiusuraData || raw.chiusuraRefId) return true;
  const single = raw.linkedLavoroId;
  if (typeof single === "string" && single.trim()) return true;
  const many = raw.linkedLavoroIds;
  if (Array.isArray(many) && many.some((v) => typeof v === "string" && v.trim())) return true;
  return false;
}

function isSegnalazioneAperta(item: NextMezzoSegnalazioneItem): boolean {
  return !hasClosingStamp(item.raw, item.stato, item.chiusuraData, item.chiusuraRefId);
}

function isControlloKoAperto(item: NextMezzoControlloItem): boolean {
  return item.esito === "ko" && !hasClosingStamp(item.raw, item.stato, item.chiusuraData, item.chiusuraRefId);
}

// Scadenze ricorrenti del mezzo (cronotachigrafo, tagliando, estintore, ...): colore/etichetta/ordine.
const SCADENZA_SEVERITA: Record<string, number> = { scaduta: 4, in_scadenza: 3, data_mancante: 2, valore_non_disponibile: 1, ok: 0 };

function scadenzaDotColor(item: NextManutenzioneScadenzaItem): string {
  if (item.stato === "scaduta") return "#cf3b3b";
  if (item.stato === "in_scadenza") return "#c9820a";
  if (item.stato === "ok") return "#1f9457";
  return "#8a94a2";
}

function scadenzaPdfTone(item: NextManutenzioneScadenzaItem): "ok" | "warn" | "danger" | "muted" {
  if (item.stato === "scaduta") return "danger";
  if (item.stato === "in_scadenza") return "warn";
  if (item.stato === "ok") return "ok";
  return "muted";
}

function scadenzaRightLabel(item: NextManutenzioneScadenzaItem): string {
  if (item.giorniMin != null) {
    const g = item.giorniMin;
    if (g === 0) return "oggi";
    const abs = Math.abs(g);
    const base = abs === 1 ? "1 giorno" : `${abs} gg`;
    return g < 0 ? `${base} fa` : `tra ${base}`;
  }
  const km = item.componenti.find((c) => c.base === "km");
  if (km) {
    if (km.stato === "valore_non_disponibile") return "km sconosciuti";
    if (km.stato === "data_mancante") return "km non impostati";
    if (typeof km.residuo === "number") return km.residuo < 0 ? `oltre di ${-km.residuo} km` : `residuo ${km.residuo} km`;
  }
  if (item.stato === "data_mancante") return "data mancante";
  return "-";
}

export default function NextDossierMezzoComandoPage() {
  const location = useLocation();
  const { targa } = useParams<{ targa: string }>();
  const navigate = useNavigate();
  const preventiviSectionRef = useRef<HTMLElement | null>(null);
  const [legacy, setLegacy] = useState<NextDossierMezzoLegacyViewState | null>(null);
  const [segnalazioniControlli, setSegnalazioniControlli] = useState<NextMezzoSegnalazioniControlliSnapshot | null>(null);
  const [scadenzeMezzo, setScadenzeMezzo] = useState<NextManutenzioneScadenzaItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "attesa" | "eseguiti" | "manutenzioni" | "libretto" | "foto" | "timeline">(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfFileName, setPdfFileName] = useState("dossier-mezzo.pdf");
  const [pdfTitle, setPdfTitle] = useState("Anteprima PDF dossier mezzo");
  const [pdfHint, setPdfHint] = useState<string | null>(null);
  const [pdfContext, setPdfContext] = useState("Dossier mezzo");
  const [fatturaToDelete, setFatturaToDelete] = useState<NextDossierFatturaPreventivoLegacyItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [cronologia, setCronologia] = useState<NextSessioneStoricoEvent[]>([]);
  const [sessioneAttiva, setSessioneAttiva] = useState<NextSessioneAttiva | null>(null);
  const [cronologiaOpen, setCronologiaOpen] = useState(false);
  const requestedSection = useMemo(() => location.hash.replace(/^#/, "").trim().toLowerCase(), [location.hash]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!targa) {
        setError("Targa non specificata.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const nextSnapshot = await readNextDossierMezzoCompositeSnapshot(targa);
        if (cancelled) return;
        if (!nextSnapshot) {
          setLegacy(null);
          setError("Mezzo non trovato nel clone.");
          setLoading(false);
          return;
        }
        setLegacy(buildNextDossierMezzoLegacyView(nextSnapshot));
        setError(null);
        setLoading(false);
      } catch (loadError) {
        if (cancelled) return;
        setError(readErrorMessage(loadError, "Errore caricamento dossier mezzo clone."));
        setLegacy(null);
        setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [targa]);

  // Segnalazioni/controlli del mezzo: lettura SEPARATA e non bloccante (se fallisce, il dossier
  // resta usabile e le righe allerte semplicemente non compaiono). Stessa fonte della Sinottica.
  useEffect(() => {
    let cancelled = false;
    setSegnalazioniControlli(null);
    if (!targa) return undefined;
    void (async () => {
      try {
        const snapshot = await readNextMezzoSegnalazioniControlliSnapshot(targa);
        if (!cancelled) setSegnalazioniControlli(snapshot);
      } catch {
        if (!cancelled) setSegnalazioniControlli(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targa]);

  // Scadenze ricorrenti del mezzo (estintore, tagliando, cronotachigrafo, ...): lettura SEPARATA e
  // non bloccante, stessa fonte della pagina "Scadenze" (@manutenzioni_scadenze). Filtrate per targa.
  useEffect(() => {
    let cancelled = false;
    setScadenzeMezzo(null);
    if (!targa) return undefined;
    const targaKey = normalizeScadenzaTarga(targa);
    void (async () => {
      try {
        const snapshot = await readNextManutenzioniScadenzeSnapshot();
        if (cancelled) return;
        setScadenzeMezzo(
          snapshot.items.filter((item) => item.attiva && normalizeScadenzaTarga(item.targa) === targaKey),
        );
      } catch {
        if (!cancelled) setScadenzeMezzo(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targa]);

  // Conducenti: storia (chi ha preso/lasciato il mezzo) + sessione attiva (chi lo usa adesso).
  // Sola lettura, non bloccante, per targa.
  useEffect(() => {
    let alive = true;
    if (!targa) {
      setCronologia([]);
      setSessioneAttiva(null);
      return undefined;
    }
    void (async () => {
      try {
        const [storico, attiva] = await Promise.all([
          readNextSessioniStoricoPerTarga(targa),
          readNextSessioneAttivaPerTarga(targa),
        ]);
        if (!alive) return;
        setCronologia(storico);
        setSessioneAttiva(attiva);
      } catch {
        if (!alive) return;
        setCronologia([]);
        setSessioneAttiva(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [targa]);

  useEffect(() => () => revokePdfPreviewUrl(pdfUrl), [pdfUrl]);

  // Stato attuale del mezzo: chi lo usa ADESSO (sessione attiva) oppure, se fermo,
  // dove e' stato lasciato l'ultima volta (stesso criterio delle card flotta:
  // l'ultimo evento in cui la targa risulta "lasciata", con il suo luogo).
  const statoAttuale = useMemo(() => {
    const targaUp = String(targa ?? "").trim().toUpperCase();
    if (sessioneAttiva) {
      const autista = sessioneAttiva.nomeAutista || "Autista";
      const dal = sessioneAttiva.timestamp ? formatDateTimeUI(sessioneAttiva.timestamp) : null;
      return {
        inUso: true,
        titolo: `In uso · ${autista}`,
        sub: dal ? `in viaggio dal ${dal}` : "sessione attiva",
      };
    }
    let dove: { luogo: string; ts: number } | null = null;
    for (const ev of cronologia) {
      const lasciataMotrice =
        ev.prima.targaMotrice === targaUp && ev.dopo.targaMotrice !== targaUp;
      const lasciataRimorchio =
        ev.prima.targaRimorchio === targaUp && ev.dopo.targaRimorchio !== targaUp;
      if ((lasciataMotrice || lasciataRimorchio) && ev.luogo) {
        dove = { luogo: ev.luogo, ts: ev.timestamp };
        break;
      }
    }
    return {
      inUso: false,
      titolo: "Non in uso",
      sub: dove
        ? `ultimo luogo: ${dove.luogo} (${formatDateUI(dove.ts)})`
        : "luogo non impostato",
    };
  }, [sessioneAttiva, cronologia, targa]);

  useEffect(() => {
    if (requestedSection !== "preventivi" || !legacy) return undefined;
    let timeoutId = 0;
    const scrollToPreventivi = () => {
      preventiviSectionRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
      timeoutId = window.setTimeout(() => {
        preventiviSectionRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
      }, 160);
    };
    const animationFrameId = window.requestAnimationFrame(scrollToPreventivi);
    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);
    };
  }, [legacy, requestedSection]);

  const mezzo = legacy?.mezzo ?? null;
  const docs = useMemo(() => legacy?.documentiCosti ?? [], [legacy]);
  const preventivi = useMemo(() => docs.filter((item) => item.tipo === "PREVENTIVO"), [docs]);
  const fatture = useMemo(() => docs.filter((item) => item.tipo === "FATTURA"), [docs]);
  const preventiviTotals = useMemo(() => buildTotals(preventivi), [preventivi]);
  const fattureTotals = useMemo(() => buildTotals(fatture), [fatture]);

  const revisioneInfo = useMemo(() => {
    const d = parseDateFlexible(legacy?.mezzo?.dataScadenzaRevisione);
    if (!d) return { date: "-", days: null as number | null };
    const days = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
    return { date: formatDateUI(d), days };
  }, [legacy]);

  const costoAnno = useMemo(() => {
    const year = new Date().getFullYear();
    let chf = 0;
    let eur = 0;
    let unknown = 0;
    for (const item of docs) {
      const d = parseDateFlexible(item.data);
      if (!d || d.getFullYear() !== year) continue;
      const amount = typeof item.importo === "number" && Number.isFinite(item.importo) ? item.importo : 0;
      const cur = resolveCurrency(item);
      if (cur === "CHF") chf += amount;
      else if (cur === "EUR") eur += amount;
      else if (amount > 0) unknown += 1;
    }
    return { chf, eur, unknown, year };
  }, [docs]);

  // Consumo medio km/L con LO STESSO motore del Report rifornimenti: per ogni rifornimento il km/L
  // è km(vs rifornimento precedente per data) / litri (readRefuelConsumption + seed per data), si
  // scartano i pieni parziali/pienoni (stesse costanti del Report) e si prende la mediana. Così il
  // numero è coerente con la colonna "Media km/L" del Report. (La "Media flotta" del Report è invece
  // l'intera flotta e non è confrontabile col singolo mezzo.)
  const consumoMedio = useMemo(() => {
    const rows = (legacy?.rifornimenti ?? [])
      .map((r, idx) =>
        normalizeRefuelRecord(
          {
            id: r.id,
            mezzoTarga: r.targaCamion,
            timestamp: r.data,
            litri: r.litri,
            km: r.km,
            tipo: r.tipo,
            autistaNome: r.autistaNome,
            badgeAutista: r.badgeAutista,
          },
          idx,
          "dossier",
        ),
      )
      .filter((row): row is RefuelRow => Boolean(row));
    return computeVehicleMedianKmL(rows);
  }, [legacy]);

  // Allerte da segnalazioni autisti + controlli mezzo (solo gli APERTI, regola di chiusura canonica).
  // null = snapshot non ancora pronto/non leggibile → le righe allerte non si mostrano.
  const allerte = useMemo(() => {
    if (!segnalazioniControlli) return null;
    const segnalazioniAperte = segnalazioniControlli.segnalazioni.filter(isSegnalazioneAperta);
    const controlliKoAperti = segnalazioniControlli.controlli.filter(isControlloKoAperto);
    const segnalazioniCritiche = segnalazioniAperte.filter((item) => item.severita === "critical").length;
    return { segnalazioniAperte, controlliKoAperti, segnalazioniCritiche };
  }, [segnalazioniControlli]);

  // Scadenze ricorrenti del mezzo ordinate: prima le peggiori (scaduta, in scadenza), poi per giorni.
  const scadenzeRicorrenti = useMemo(() => {
    if (!scadenzeMezzo) return null;
    return [...scadenzeMezzo].sort((a, b) => {
      const sev = (SCADENZA_SEVERITA[b.stato] ?? 0) - (SCADENZA_SEVERITA[a.stato] ?? 0);
      if (sev !== 0) return sev;
      const ag = a.giorniMin ?? Number.POSITIVE_INFINITY;
      const bg = b.giorniMin ?? Number.POSITIVE_INFINITY;
      return ag - bg;
    });
  }, [scadenzeMezzo]);

  type TimelineEvent = { ts: number | null; date: string; type: string; cls: string; text: string; meta?: string; amount?: { value: number; cur: Currency } };
  // Storia del mezzo = storia periodica: manutenzioni + materiali + documenti. I RIFORNIMENTI sono
  // ESCLUSI (sono tanti e ripetitivi, già coperti dal Report rifornimenti / PDF Report).
  const timeline = useMemo<TimelineEvent[]>(() => {
    if (!legacy) return [];
    const events: TimelineEvent[] = [];
    for (const m of legacy.manutenzioni) {
      events.push({ ts: timelineTimestamp(m.data), date: formatDossierDate(m.data), type: "Manut.", cls: "t-manut", text: m.descrizione || "Manutenzione", meta: formatKmOre(m) !== "-" ? formatKmOre(m) : undefined });
    }
    for (const mat of legacy.movimentiMateriali) {
      events.push({ ts: timelineTimestamp(mat.data), date: formatDossierDate(mat.data), type: "Materiale", cls: "t-mat", text: mat.descrizione || mat.materialeLabel || "Materiale", meta: mat.fornitore || mat.fornitoreLabel || undefined });
    }
    for (const d of docs) {
      events.push({
        ts: timelineTimestamp(d.data),
        date: formatDossierDate(d.data),
        type: d.tipo === "FATTURA" ? "Fattura" : "Preventivo",
        cls: "t-doc",
        text: d.descrizione || d.fornitoreLabel || d.tipo,
        meta: d.fornitoreLabel || undefined,
        amount: typeof d.importo === "number" ? { value: d.importo, cur: resolveCurrency(d) } : undefined,
      });
    }
    events.sort((a, b) => {
      if (a.ts == null && b.ts == null) return 0;
      if (a.ts == null) return 1;
      if (b.ts == null) return -1;
      return b.ts - a.ts;
    });
    return events;
  }, [legacy, docs]);

  const closePdf = () => {
    revokePdfPreviewUrl(pdfUrl);
    setPdfOpen(false);
    setPdfUrl(null);
    setPdfBlob(null);
    setPdfHint(null);
  };

  const buildShareMessage = () =>
    buildPdfShareText({ contextLabel: pdfContext, dateLabel: formatDateUI(new Date()), fileName: pdfFileName, url: pdfUrl });

  const onSharePdf = async () => {
    if (!pdfBlob) {
      const copied = await copyTextToClipboard(buildShareMessage());
      setPdfHint(copied ? "Link copiato." : "Apri prima un'anteprima PDF.");
      return;
    }
    const result = await sharePdfFile({ blob: pdfBlob, fileName: pdfFileName, title: pdfTitle, text: buildShareMessage() });
    if (result.status === "shared") {
      setPdfHint("PDF condiviso.");
      return;
    }
    if (result.status !== "aborted") {
      const copied = await copyTextToClipboard(buildShareMessage());
      setPdfHint(copied ? "Condivisione non disponibile: testo copiato." : "Condivisione non disponibile.");
    }
  };

  const openDocumentPdf = (url: string, title: string, fileName: string) => {
    revokePdfPreviewUrl(pdfUrl);
    setPdfBlob(null);
    setPdfUrl(url);
    setPdfOpen(true);
    setPdfTitle(title);
    setPdfFileName(fileName);
    setPdfContext(title);
    setPdfHint(null);
  };

  const openDossierPdf = async () => {
    if (!legacy || !mezzo) return;
    try {
      const preview = await openPreview({
        source: async () => {
          const revDaysL = revisioneInfo.days;
          const revToneL: "ok" | "warn" | "danger" | "info" =
            revDaysL == null ? "info" : revDaysL < 0 ? "danger" : revDaysL <= 30 ? "warn" : "ok";
          const totalStr = (t: { chf: number; eur: number; unknown: number }) => {
            const parts = [`CHF ${t.chf.toFixed(2)}`];
            if (t.eur > 0) parts.push(`EUR ${t.eur.toFixed(2)}`);
            if (t.unknown > 0) parts.push(`${t.unknown} da verif.`);
            return parts.join(" · ");
          };
          const docAmount = (item: NextDossierFatturaPreventivoLegacyItem) =>
            typeof item.importo === "number" ? renderAmount(item.importo, resolveCurrency(item)) : "n/d";
          // Nel PDF la Storia del mezzo è limitata agli ultimi 6 mesi (per lo storico completo si usa
          // il PDF di Manutenzioni). I rifornimenti sono già esclusi dalla timeline.
          const seiMesiFa = (() => {
            const d = new Date();
            d.setMonth(d.getMonth() - 6);
            return d.getTime();
          })();
          const timelinePdf = timeline.filter((e) => e.ts != null && e.ts >= seiMesiFa);
          return generateDossierComandoPDFBlob({
            targa: mezzo.targa,
            headerTitle: `${mezzo.marca || "-"} ${mezzo.modello || "-"}`.trim(),
            categoria: mezzo.categoria,
            autista: mezzo.autistaNome,
            mezzoFotoUrl: mezzo.fotoUrl ?? null,
            mezzoFotoStoragePath: mezzo.fotoStoragePath ?? mezzo.fotoPath ?? null,
            kpis: [
              {
                label: "Prossima revisione",
                value: revDaysL == null ? "-" : revDaysL < 0 ? "scaduta" : `${revDaysL} giorni`,
                sub: `${revisioneInfo.date}${revDaysL != null && revDaysL < 0 ? ` · ${-revDaysL} gg fa` : ""}`,
                tone: revToneL,
              },
              {
                label: `Costo anno ${costoAnno.year}`,
                value: `${costoAnno.chf.toFixed(0)} CHF`,
                sub: `${costoAnno.eur > 0 ? `+ ${costoAnno.eur.toFixed(0)} EUR ` : ""}${costoAnno.unknown > 0 ? `· ${costoAnno.unknown} senza valuta` : "fatture + preventivi"}`,
                tone: "info",
              },
              {
                label: "Consumo medio",
                value: consumoMedio == null ? "n/d" : `${consumoMedio.toFixed(2)} km/L`,
                sub: "mediana sui rifornimenti",
                tone: "info",
              },
              {
                label: "Manutenzioni da fare",
                value: String(legacy.lavoriInAttesa.length),
                sub: "lavori in attesa",
                tone: legacy.lavoriInAttesa.length > 0 ? "warn" : "ok",
              },
            ],
            scadenze: [
              {
                titolo: "Revisione",
                sub: revisioneInfo.date,
                right: revDaysL == null ? "-" : revDaysL < 0 ? `scaduta ${-revDaysL} gg` : `tra ${revDaysL} gg`,
                tone: revToneL,
              },
              ...((scadenzeRicorrenti ?? []).map((item) => ({
                titolo: item.label,
                right: scadenzaRightLabel(item),
                tone: scadenzaPdfTone(item),
              }))),
              ...(mezzo.manutenzioneProgrammata
                ? ([{
                    titolo: "Manutenzione programmata",
                    sub: mezzo.manutenzioneContratto || "attiva",
                    tone: "ok" as const,
                  }])
                : []),
              ...(allerte
                ? ([
                    {
                      titolo: "Segnalazioni aperte",
                      sub: allerte.segnalazioniAperte.length === 0 ? "nessuna" : allerte.segnalazioniAperte.slice(0, 2).map((item) => item.titolo).join(" · "),
                      right: String(allerte.segnalazioniAperte.length),
                      tone: allerte.segnalazioniAperte.length === 0 ? ("ok" as const) : allerte.segnalazioniCritiche > 0 ? ("danger" as const) : ("warn" as const),
                    },
                    {
                      titolo: "Controlli KO aperti",
                      sub: allerte.controlliKoAperti.length === 0 ? "nessuno" : allerte.controlliKoAperti.slice(0, 2).map((item) => item.titolo).join(" · "),
                      right: String(allerte.controlliKoAperti.length),
                      tone: allerte.controlliKoAperti.length === 0 ? ("ok" as const) : ("danger" as const),
                    },
                  ])
                : []),
            ],
            lavoriDaFare: legacy.lavoriInAttesa.map((item) => ({
              descrizione: item.descrizione || "-",
              meta: item.dettagli || formatDossierDate(item.dataInserimento),
            })),
            costi: [
              { k: `Fatture (${fatture.length})`, v: totalStr(fattureTotals) },
              { k: `Preventivi (${preventivi.length})`, v: totalStr(preventiviTotals) },
              {
                k: `Costo anno ${costoAnno.year}`,
                v: `CHF ${costoAnno.chf.toFixed(2)}${costoAnno.eur > 0 ? ` · EUR ${costoAnno.eur.toFixed(2)}` : ""}`,
                nota: costoAnno.unknown > 0 ? `${costoAnno.unknown} senza valuta` : undefined,
              },
            ],
            timelineLabel: "ultimi 6 mesi",
            timeline: timelinePdf.map((e) => ({
              data: e.ts == null ? "senza data" : e.date,
              tipo: e.type,
              testo: `${e.text}${e.meta ? ` · ${e.meta}` : ""}`,
              importo: e.amount ? `${e.amount.value.toFixed(2)} ${e.amount.cur === "UNKNOWN" ? "?" : e.amount.cur}` : "",
            })),
            datiTecnici: buildTechBlocks(mezzo).map((b) => ({
              title: b.title,
              rows: b.rows.map(([k, v]) => ({ k, v: String(v ?? "-") || "-" })),
            })),
            manutenzioniDaFare: legacy.lavoriInAttesa.map((item) => ({
              stato: workBadge(item, "DA FARE", "").label,
              descrizione: item.descrizione || "-",
              data: formatDossierDate(item.dataInserimento),
            })),
            manutenzioniEseguite: legacy.lavoriEseguiti.map((item) => ({
              stato: workBadge(item, "ESEGUITA", "").label,
              descrizione: item.descrizione || "-",
              data: formatDossierDate(item.dataInserimento),
            })),
            storicoManutenzioni: legacy.manutenzioni.map((item) => ({
              descrizione: item.descrizione || "-",
              data: formatDossierDate(item.data),
              kmOre: formatKmOre(item),
            })),
            gommePerAsse: legacy.gommePerAsse.map((item) => ({
              asse: item.asseLabel,
              meta: [formatGommePerAsseMeta(item), formatGommeSetPrecedente(item)]
                .filter(Boolean)
                .join(" — "),
            })),
            gommeStraordinarie: legacy.gommeStraordinarie.map((item) => ({
              motivo: item.motivo || "Evento gomme straordinario",
              meta: formatGommeStraordinarieMeta(item),
            })),
            materiali: legacy.movimentiMateriali.map((item) => ({
              data: formatDossierDate(item.data),
              descrizione: item.descrizione || item.materialeLabel || "-",
              qta: `${item.quantita ?? "-"} ${item.unita ?? ""}`.trim(),
              destinatario: item.destinatario?.label || "-",
              fornitore: item.fornitore || item.fornitoreLabel || "-",
              motivo: item.motivo || "-",
              costo:
                item.costoTotale !== null && item.costoTotale !== undefined
                  ? renderAmount(item.costoTotale, item.costoCurrency ?? "UNKNOWN")
                  : "-",
            })),
            preventivi: preventivi.map((item) => ({
              descrizione: item.descrizione || "-",
              fornitore: item.fornitoreLabel || "-",
              data: formatDossierDate(item.data),
              importo: docAmount(item),
            })),
            fatture: fatture.map((item) => ({
              descrizione: item.descrizione || "-",
              fornitore: item.fornitoreLabel || "-",
              data: formatDossierDate(item.data),
              importo: docAmount(item),
            })),
          });
        },
      });
      revokePdfPreviewUrl(pdfUrl);
      setPdfBlob(preview.blob);
      setPdfUrl(preview.url);
      setPdfOpen(true);
      setPdfFileName(preview.fileName);
      setPdfTitle(`Anteprima PDF dossier ${mezzo.targa}`);
      setPdfContext(`Dossier mezzo ${mezzo.targa}`);
      setPdfHint(null);
    } catch (previewError) {
      window.alert(readErrorMessage(previewError, "Errore generazione anteprima PDF."));
    }
  };

  const blockPreventivoDelete = () => {
    window.alert(CLONE_READ_ONLY_PREVENTIVO_DELETE_MESSAGE);
  };

  const openFatturaDeleteConfirm = (item: NextDossierFatturaPreventivoLegacyItem) => {
    setFatturaToDelete(item);
    setDeleteError(null);
    setShowDeleteConfirm(true);
  };

  const closeFatturaDeleteConfirm = () => {
    if (deletePending) return;
    setShowDeleteConfirm(false);
    setFatturaToDelete(null);
    setDeleteError(null);
  };

  const confirmFatturaDelete = async () => {
    if (!fatturaToDelete || !targa) return;
    try {
      setDeletePending(true);
      setDeleteError(null);
      await runWithCloneWriteScopedAllowance("internal_ai_magazzino_inline_magazzino", async () =>
        deleteNextDocumentoCosto(fatturaToDelete),
      );
      try {
        const nextSnapshot = await readNextDossierMezzoCompositeSnapshot(targa);
        if (nextSnapshot) setLegacy(buildNextDossierMezzoLegacyView(nextSnapshot));
      } catch {
        /* fallback applicato sotto */
      }
      setLegacy((current) =>
        current
          ? { ...current, documentiCosti: current.documentiCosti.filter((item) => item.id !== fatturaToDelete.id) }
          : current,
      );
      setShowDeleteConfirm(false);
      setFatturaToDelete(null);
      setDeleteError(null);
    } catch (deleteFatturaError) {
      setDeleteError(readErrorMessage(deleteFatturaError, "Eliminazione fattura non completata."));
    } finally {
      setDeletePending(false);
    }
  };

  const openManutenzioneWorkItem = (item: { id: string; targa?: string | null; mezzoTarga?: string | null }) => {
    navigate(buildNextManutenzioniPath(item.targa ?? item.mezzoTarga ?? mezzo?.targa, item.id));
  };
  const openManutenzione = (item: NextDossierManutenzioneLegacyItem) => {
    setModal(null);
    navigate(buildNextManutenzioniPath(item.targa, item.id));
  };
  const reloadDossierSnapshot = async () => {
    if (!targa) return;
    const nextSnapshot = await readNextDossierMezzoCompositeSnapshot(targa);
    if (!nextSnapshot) {
      setLegacy(null);
      setError("Mezzo non trovato nel clone.");
      return;
    }
    setLegacy(buildNextDossierMezzoLegacyView(nextSnapshot));
    setError(null);
  };
  const handleMezzoSaved = () => {
    setShowEditModal(false);
    void reloadDossierSnapshot();
  };
  const handleMezzoDeleted = () => {
    setShowEditModal(false);
    navigate(NEXT_DOSSIER_LISTA_PATH);
  };
  const back = () => navigate(NEXT_DOSSIER_LISTA_PATH);

  if (loading) {
    return <div className="dossier-wrapper"><div className="dossier-card dossier-card-full"><div className="dossier-card-body"><div className="dossier-empty">Caricamento dossier mezzo...</div></div></div></div>;
  }
  if (error || !legacy || !mezzo) {
    return <div className="dossier-wrapper"><div className="dossier-card dossier-card-full"><div className="dossier-card-body"><div className="dossier-empty">{error || "Dossier non disponibile."}</div><button className="dossier-button" type="button" onClick={back} style={{ marginTop: 12 }}>Torna a Dossier Mezzi</button></div></div></div>;
  }

  const librettoUrl = String(mezzo.librettoUrl ?? "").trim();
  const headerTitle = `${mezzo.marca || "-"} ${mezzo.modello || "-"}`.trim();
  const lavoriDaFare = legacy.lavoriInAttesa;
  const lavoriLists = { attesa: legacy.lavoriInAttesa, eseguiti: legacy.lavoriEseguiti, manutenzioni: legacy.manutenzioni } as const;
  const revDays = revisioneInfo.days;
  const revTone = revDays == null ? "#2f6bd6" : revDays < 0 ? "#cf3b3b" : revDays <= 30 ? "#c9820a" : "#1f9457";
  const techBlocks = buildTechBlocks(mezzo);


  const renderWork = (item: NextDossierLegacyWorkItem, fallbackLabel: string, fallbackCls: string) => {
    const badge = workBadge(item, fallbackLabel, fallbackCls);
    return (
      <li key={item.id} className="dc-li" onClick={() => openManutenzioneWorkItem(item)}>
        <span className={`dc-badge ${badge.cls}`} title={badge.title}>{badge.label}</span>
        {item.descrizione}
        <div className="meta">{[item.dettagli, formatDossierDate(item.dataInserimento)].filter((v) => v && v !== "-").join(" · ") || formatDossierDate(item.dataInserimento)}</div>
        <FraseStoriaRecord {...recordChiusoFromRaw(item as unknown as Record<string, unknown>)} compact />
      </li>
    );
  };

  const renderDocs = (items: NextDossierFatturaPreventivoLegacyItem[], kind: "preventivo" | "fattura") =>
    items.length === 0 ? (
      <div className="dc-empty">{kind === "preventivo" ? "Nessun preventivo registrato." : "Nessuna fattura registrata."}</div>
    ) : (
      items.map((item) => {
        const cur = resolveCurrency(item);
        return (
          <div className="dc-doc" key={item.id}>
            <div className="dm">
              <div className="dt"><span className={`dc-badge ${kind === "preventivo" ? "b-info" : "b-danger"}`}>{item.tipo}</span>{item.descrizione || "-"}</div>
              <div className="ds">{[item.fornitoreLabel || "-", formatDossierDate(item.data)].join(" · ")}</div>
              <div className="dc-acts">
                {item.fileUrl ? <button type="button" className="dc-mini" onClick={() => openDocumentPdf(item.fileUrl!, `Anteprima PDF ${kind}`, `${kind}-${item.id}.pdf`)}>Anteprima PDF</button> : null}
                {kind === "preventivo" ? <button type="button" className="dc-mini" onClick={blockPreventivoDelete}>Elimina</button> : <button type="button" className="dc-mini" onClick={() => openFatturaDeleteConfirm(item)}>Elimina</button>}
              </div>
            </div>
            <div className="dc-tl-amt">{typeof item.importo === "number" ? `${item.importo.toFixed(2)} ` : "n/d "}{curBadge(cur)}</div>
          </div>
        );
      })
    );

  const renderTimelineList = (events: TimelineEvent[]) => {
    let last = "";
    return events.map((ev, i) => {
      const dayLabel = ev.ts == null ? "senza data" : ev.date;
      const showDate = dayLabel !== last;
      last = dayLabel;
      return (
        <div className="dc-tl-item" key={i}>
          <span className="dc-tl-date" style={ev.ts == null ? { color: "#8a94a2" } : undefined}>{showDate ? dayLabel : ""}</span>
          <span className={`dc-type ${ev.cls}`}>{ev.type}</span>
          <span className="dc-tl-text">{ev.text}{ev.meta ? <span className="dc-tl-meta"> · {ev.meta}</span> : null}</span>
          <span className="dc-tl-amt">{ev.amount ? <>{ev.amount.value.toFixed(2)} {curBadge(ev.amount.cur)}</> : null}</span>
        </div>
      );
    });
  };

  return (
    <div className="dossier-wrapper">
      {modal === "libretto" ? (
        <div className="dossier-modal-overlay"><div className="dossier-modal" style={{ maxWidth: 960 }}><div className="dossier-modal-header"><h2>Libretto - {mezzo.targa}</h2><button className="dossier-button" type="button" onClick={() => setModal(null)}>Chiudi</button></div><div className="dossier-modal-body">{librettoUrl ? <div style={{ display: "grid", gap: 12 }}><img src={librettoUrl} alt={`Libretto ${mezzo.targa}`} style={{ width: "100%", borderRadius: 12 }} /><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="dossier-button" type="button" onClick={() => window.open(librettoUrl, "_blank", "noopener,noreferrer")}>Apri file</button></div></div> : <p className="dossier-empty">Nessun libretto disponibile per questo mezzo.</p>}</div></div></div>
      ) : null}
      {modal === "foto" && mezzo.fotoUrl ? (
        <div className="dossier-modal-overlay" onClick={() => setModal(null)}><div className="dossier-modal" style={{ maxWidth: 920 }} onClick={(event) => event.stopPropagation()}><div className="dossier-modal-header"><h2>Foto mezzo</h2><button className="dossier-button" type="button" onClick={() => setModal(null)}>Chiudi</button></div><div className="dossier-modal-body"><img src={mezzo.fotoUrl} alt={mezzo.targa} className="dossier-photo-modal-img" /></div></div></div>
      ) : null}
      {modal === "timeline" ? (
        <div className="dossier-modal-overlay" onClick={() => setModal(null)}>
          <div className="dossier-modal" style={{ maxWidth: 760 }} onClick={(event) => event.stopPropagation()}>
            <div className="dossier-modal-header"><h2>Storia del mezzo - {mezzo.targa}</h2><button className="dossier-button" type="button" onClick={() => setModal(null)}>Chiudi</button></div>
            <div className="dossier-modal-body"><div className="dc" style={{ padding: 0, maxWidth: "none" }}>{renderTimelineList(timeline)}</div></div>
          </div>
        </div>
      ) : null}
      {showDeleteConfirm && fatturaToDelete ? (
        <div className="dossier-modal-overlay" onClick={closeFatturaDeleteConfirm}>
          <div className="dossier-modal" style={{ maxWidth: 620 }} onClick={(event) => event.stopPropagation()}>
            <div className="dossier-modal-header"><h2>Conferma eliminazione fattura</h2><button className="dossier-button" type="button" onClick={closeFatturaDeleteConfirm} disabled={deletePending}>Chiudi</button></div>
            <div className="dossier-modal-body" style={{ display: "grid", gap: 12 }}>
              <p>{legacy.manutenzioni.some((record) => record.sourceDocumentId === fatturaToDelete.id) ? DOSSIER_DELETE_LINKED_MESSAGE : DOSSIER_DELETE_SIMPLE_MESSAGE}</p>
              <div className="dossier-list-meta"><span>{fatturaToDelete.descrizione || "-"}</span><span>{formatDossierDate(fatturaToDelete.data)}</span><span>{renderAmount(fatturaToDelete.importo, resolveCurrency(fatturaToDelete))}</span></div>
              {deleteError ? <p className="dossier-empty" style={{ color: "#b42318", margin: 0 }}>{deleteError}</p> : null}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="dossier-button" type="button" onClick={confirmFatturaDelete} disabled={deletePending}>{deletePending ? "Eliminazione..." : "Conferma"}</button><button className="dossier-button" type="button" onClick={closeFatturaDeleteConfirm} disabled={deletePending}>Annulla</button></div>
            </div>
          </div>
        </div>
      ) : null}
      <NextMezzoEditModal mezzoId={mezzo.id} isOpen={showEditModal} onClose={() => setShowEditModal(false)} onSaved={handleMezzoSaved} onDeleted={handleMezzoDeleted} />

      <style>{COMANDO_CSS}</style>
      <div className="dc">

        <div className="dc-top">
          <div className="dc-idleft">
            <div className="dc-photo" style={mezzo.fotoUrl ? { backgroundImage: `url(${mezzo.fotoUrl})` } : undefined} onClick={() => mezzo.fotoUrl && setModal("foto")}>{mezzo.fotoUrl ? "" : "foto"}</div>
            <div>
              <div className="dc-plate mono">{mezzo.targa}</div>
              <div className="dc-model">{headerTitle}</div>
              <div className="dc-chips">
                {mezzo.categoria ? <span className="dc-chip">{mezzo.categoria}</span> : null}
                {mezzo.autistaNome ? <span className="dc-chip">{mezzo.autistaNome}</span> : null}
              </div>
            </div>
          </div>
          <div className="dc-now">
            <span className="dc-now-tag">Adesso</span>
            <span className={`dc-state${statoAttuale.inUso ? " on" : ""}`}>
              <span className="dc-state-main">
                <span className="dc-state-dot" />
                {statoAttuale.titolo}
              </span>
              {statoAttuale.sub ? <span className="dc-state-sub">{statoAttuale.sub}</span> : null}
            </span>
          </div>
          <div className="dc-actions">
            <button className="dc-btn" type="button" onClick={back}>&#8249; Mezzi</button>
            <button className="dc-btn" type="button" onClick={() => navigate(buildNextAnalisiEconomicaPath(mezzo.targa))}>Analisi economica</button>
            <button className="dc-btn" type="button" onClick={() => navigate(buildNextCentroControlloRifornimentiPath(mezzo.targa))}>Rifornimenti &#8599; Sinottica</button>
            <button className="dc-btn" type="button" onClick={() => setModal("libretto")}>Libretto</button>
            <button className="dc-btn primary" type="button" onClick={openDossierPdf}>Anteprima PDF</button>
          </div>
        </div>

        <div className="dc-kpis">
          <div className="dc-kpi"><span className="top" style={{ background: revTone }} /><div className="lab">Prossima revisione</div><div className="val" style={{ color: revTone }}>{revDays == null ? "-" : revDays < 0 ? "scaduta" : revDays}{revDays != null && revDays >= 0 ? <small> giorni</small> : null}</div><div className="sub">{revisioneInfo.date}{revDays != null && revDays < 0 ? ` · ${-revDays} gg fa` : ""}</div></div>
          <div className="dc-kpi"><span className="top" style={{ background: "#2f6bd6" }} /><div className="lab">Costo anno {costoAnno.year}</div><div className="val">{costoAnno.chf.toFixed(0)} <small>CHF</small>{costoAnno.eur > 0 ? <small> + {costoAnno.eur.toFixed(0)} &euro;</small> : null}</div><div className="sub">{costoAnno.unknown > 0 ? `parziale · ${costoAnno.unknown} senza valuta` : "fatture + preventivi"}</div></div>
          <div className="dc-kpi"><span className="top" style={{ background: "#2f6bd6" }} /><div className="lab">Consumo medio</div><div className="val">{consumoMedio == null ? "n/d" : consumoMedio.toFixed(2)}{consumoMedio != null ? <small> km/L</small> : null}</div><div className="sub">mediana sui rifornimenti</div></div>
          <div className="dc-kpi"><span className="top" style={{ background: lavoriDaFare.length > 0 ? "#c9820a" : "#1f9457" }} /><div className="lab">Manutenzioni da fare</div><div className="val" style={{ color: lavoriDaFare.length > 0 ? "#c9820a" : "#1f9457" }}>{lavoriDaFare.length}</div><div className="sub">lavori in attesa</div></div>
        </div>

        <div className="dc-grid">
          <div className="dc-leftcol">
            <div className="dc-card">
              <h2>Scadenze &amp; Allerte</h2>
              <div className="dc-row"><span className="dc-dot" style={{ background: revTone }} /><div className="dc-main"><div className="dc-title">Revisione</div><div className="dc-sub">{revisioneInfo.date}</div></div><div className="dc-right" style={{ color: revTone }}>{revDays == null ? "-" : revDays < 0 ? `scaduta ${-revDays} gg` : `tra ${revDays} gg`}</div></div>
              {scadenzeRicorrenti?.map((item) => {
                const col = scadenzaDotColor(item);
                return (
                  <div className="dc-row" key={item.id}><span className="dc-dot" style={{ background: col }} /><div className="dc-main"><div className="dc-title">{item.label}</div></div><div className="dc-right" style={{ color: col }}>{scadenzaRightLabel(item)}</div></div>
                );
              })}
              {mezzo.manutenzioneProgrammata ? (
                <div className="dc-row"><span className="dc-dot" style={{ background: "#1f9457" }} /><div className="dc-main"><div className="dc-title">Manutenzione programmata</div><div className="dc-sub">{mezzo.manutenzioneContratto || "attiva"}</div></div></div>
              ) : null}
              {allerte ? (
                <div className="dc-row"><span className="dc-dot" style={{ background: allerte.segnalazioniAperte.length === 0 ? "#cfd6e0" : allerte.segnalazioniCritiche > 0 ? "#cf3b3b" : "#c9820a" }} /><div className="dc-main"><div className="dc-title">Segnalazioni aperte</div><div className="dc-sub">{allerte.segnalazioniAperte.length === 0 ? "nessuna" : allerte.segnalazioniAperte.slice(0, 2).map((item) => item.titolo).join(" · ")}</div></div><div className="dc-right" style={{ color: allerte.segnalazioniAperte.length === 0 ? "#1f9457" : allerte.segnalazioniCritiche > 0 ? "#cf3b3b" : "#c9820a" }}>{allerte.segnalazioniAperte.length}</div></div>
              ) : null}
              {allerte ? (
                <div className="dc-row"><span className="dc-dot" style={{ background: allerte.controlliKoAperti.length === 0 ? "#cfd6e0" : "#cf3b3b" }} /><div className="dc-main"><div className="dc-title">Controlli KO aperti</div><div className="dc-sub">{allerte.controlliKoAperti.length === 0 ? "nessuno" : allerte.controlliKoAperti.slice(0, 2).map((item) => item.titolo).join(" · ")}</div></div><div className="dc-right" style={{ color: allerte.controlliKoAperti.length === 0 ? "#1f9457" : "#cf3b3b" }}>{allerte.controlliKoAperti.length}</div></div>
              ) : null}
            </div>
            <div className="dc-card">
              <h2>Costi (riepilogo)</h2>
              <div className="dc-row"><div className="dc-main"><div className="dc-title">Fatture</div><div className="dc-sub">{fatture.length} documenti</div></div><div className="dc-right">CHF {fattureTotals.chf.toFixed(2)}{fattureTotals.eur > 0 ? ` · EUR ${fattureTotals.eur.toFixed(2)}` : ""}{fattureTotals.unknown > 0 ? ` · ${fattureTotals.unknown} ?` : ""}</div></div>
              <div className="dc-row"><div className="dc-main"><div className="dc-title">Preventivi</div><div className="dc-sub">{preventivi.length} documenti</div></div><div className="dc-right">CHF {preventiviTotals.chf.toFixed(2)}{preventiviTotals.eur > 0 ? ` · EUR ${preventiviTotals.eur.toFixed(2)}` : ""}{preventiviTotals.unknown > 0 ? ` · ${preventiviTotals.unknown} ?` : ""}</div></div>
            </div>
          </div>

          <div className="dc-rightcol">
            <div className="dc-card">
              <h2>Conducenti <span className="count">{cronologia.length > 4 ? <button className="dc-link" type="button" onClick={() => setCronologiaOpen(true)}>Mostra tutto ({cronologia.length})</button> : "storia"}</span></h2>
              {cronologia.length === 0 ? (
                <div className="dc-empty">Nessuna sessione storica registrata per questo mezzo.</div>
              ) : (
                cronologia.slice(0, 4).map((ev) => (
                  <div className="dc-row" key={ev.id}><div className="dc-main"><div className="dc-title">{describeEvento(ev, mezzo.targa)}</div><div className="dc-sub">{formatDateTimeUI(ev.timestamp)}{ev.luogo ? ` · ${ev.luogo}` : ""}</div></div></div>
                ))
              )}
            </div>
            <div className="dc-card">
              <h2>Storia del mezzo <span className="count">{timeline.length > 10 ? <button className="dc-link" type="button" onClick={() => setModal("timeline")}>Mostra tutto ({timeline.length})</button> : "ultimi eventi"}</span></h2>
              {timeline.length === 0 ? <div className="dc-empty">Nessun evento da mostrare.</div> : renderTimelineList(timeline.slice(0, 10))}
            </div>
            <div className="dc-card">
              <h2><span>Dati tecnici</span><button className="dc-link" type="button" onClick={() => setShowEditModal(true)}>+ Modifica</button></h2>
              <div className="dc-tech">
                {techBlocks.map((block) => (
                  <div className="dc-techb" key={block.title}>
                    <h3>{block.title}</h3>
                    <ul>{block.rows.map(([label, value]) => <li key={label}><span>{label}</span><strong style={label === "Note" ? { whiteSpace: "pre-line" } : undefined}>{String(value || "-")}</strong></li>)}</ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dc-band"><h2>Dettaglio completo</h2><span className="sub">tutte le sezioni del dossier</span><span className="ln" /></div>

        <div className="dc-detail">
          <div className="dc-card dc-span2">
            <h2>Manutenzioni</h2>
            <div className="dc-twocol">
              <div>
                <h3>Da fare</h3>
                {legacy.lavoriInAttesa.length === 0 ? <div className="dc-empty" style={{ padding: 0 }}>Nessuna manutenzione da fare.</div> : <ul className="dc-ul">{legacy.lavoriInAttesa.slice(0, 3).map((item) => renderWork(item, "DA FARE", "b-info"))}</ul>}
                <button className="dc-mini" type="button" style={{ marginTop: 10 }} onClick={() => setModal("attesa")}>Mostra tutti</button>
              </div>
              <div>
                <h3>Eseguite</h3>
                {legacy.lavoriEseguiti.length === 0 ? <div className="dc-empty" style={{ padding: 0 }}>Nessuna manutenzione eseguita.</div> : <ul className="dc-ul">{legacy.lavoriEseguiti.slice(0, 3).map((item) => renderWork(item, "ESEGUITA", "b-ok"))}</ul>}
                <button className="dc-mini" type="button" style={{ marginTop: 10 }} onClick={() => setModal("eseguiti")}>Mostra tutti</button>
              </div>
            </div>
          </div>

          <div className="dc-card">
            <h2>Storico manutenzioni <button className="dc-link" type="button" onClick={() => setModal("manutenzioni")}>Mostra tutto</button></h2>
            {legacy.manutenzioni.length === 0 ? <div className="dc-empty">Nessuna manutenzione registrata per questo mezzo.</div> : legacy.manutenzioni.slice(0, 5).map((item) => (
              <div className="dc-row click" key={item.id} onClick={() => openManutenzione(item)}><div className="dc-main"><div className="dc-title">{item.descrizione || "-"}</div></div><div className="dc-right" style={{ color: "#8a94a2", fontWeight: 400 }}>{formatDossierDate(item.data)} · {formatKmOre(item)}</div></div>
            ))}
          </div>

          <div className="dc-card">
            <h2>Gomme <span className="count">per asse + straordinari</span></h2>
            <div className="dc-sub2">Stato gomme per asse</div>
            {legacy.gommePerAsse.length === 0 ? <div className="dc-empty">Nessun cambio gomme ordinario strutturato disponibile.</div> : legacy.gommePerAsse.map((item) => {
              const setPrecedente = formatGommeSetPrecedente(item);
              return (
                <div className="dc-row" key={item.asseId}><div className="dc-main"><div className="dc-title">{item.asseLabel}</div><div className="dc-sub">{formatGommePerAsseMeta(item)}</div>{setPrecedente ? <div className="dc-sub">{setPrecedente}</div> : null}</div></div>
              );
            })}
            <div className="dc-sub2">Eventi gomme straordinari</div>
            {legacy.gommeStraordinarie.length === 0 ? <div className="dc-empty">Nessun evento gomme straordinario registrato.</div> : legacy.gommeStraordinarie.slice(0, 5).map((item) => (
              <div className="dc-row" key={item.sourceMaintenanceId}><span className="dc-dot" style={{ background: "#c9820a" }} /><div className="dc-main"><div className="dc-title">{item.motivo || "Evento gomme straordinario"}</div><div className="dc-sub">{formatGommeStraordinarieMeta(item)}</div></div></div>
            ))}
          </div>

          <div className="dc-card dc-span2">
            <h2>Materiali e movimenti inventario</h2>
            {legacy.movimentiMateriali.length === 0 ? <div className="dc-empty">Nessun movimento materiali registrato per questo mezzo.</div> : (
              <table className="dc-dtable">
                <thead><tr><th>Data</th><th>Descrizione</th><th>Q.ta</th><th>Destinatario</th><th>Fornitore</th><th>Motivo</th><th>Costo</th></tr></thead>
                <tbody>{legacy.movimentiMateriali.map((item) => <tr key={item.id}><td>{formatDossierDate(item.data)}</td><td>{item.descrizione || item.materialeLabel || "-"}</td><td>{item.quantita ?? "-"} {item.unita ?? ""}</td><td>{item.destinatario?.label || "-"}</td><td>{item.fornitore || item.fornitoreLabel || "-"}</td><td>{item.motivo || "-"}</td><td>{item.costoTotale !== null && item.costoTotale !== undefined ? renderAmount(item.costoTotale, item.costoCurrency ?? "UNKNOWN") : "-"}</td></tr>)}</tbody>
              </table>
            )}
          </div>

          <section className="dc-card" ref={preventiviSectionRef} id="preventivi">
            <h2>Preventivi</h2>
            {renderDocs(preventivi, "preventivo")}
          </section>

          <div className="dc-card">
            <h2>Fatture <span className="count"><button className="dc-link" type="button" onClick={() => navigate(NEXT_IA_DOCUMENTI_PATH)}>storico &#8594;</button></span></h2>
            {renderDocs(fatture, "fattura")}
          </div>
        </div>
      </div>

      {(["attesa", "eseguiti", "manutenzioni"] as const).map((key) =>
        modal === key ? (
          <div key={key} className="dossier-modal-overlay">
            <div className="dossier-modal">
              <div className="dossier-modal-header">
                <h2>{key === "attesa" ? "Manutenzioni da fare" : key === "eseguiti" ? "Manutenzioni eseguite" : "Storico manutenzioni"} - {mezzo.targa}</h2>
                <button className="dossier-button" type="button" onClick={() => setModal(null)}>Chiudi</button>
              </div>
              <div className="dossier-modal-body">
                {key === "manutenzioni" ? (
                  lavoriLists.manutenzioni.length === 0 ? <p>Nessuna manutenzione registrata.</p> : <ul className="dossier-list">{lavoriLists.manutenzioni.map((item) => <li key={item.id} className="dossier-list-item" onClick={() => openManutenzione(item)} style={{ cursor: "pointer" }}><div className="dossier-list-main"><strong>{item.descrizione || "-"}</strong></div><div className="dossier-list-meta"><span>{formatDossierDate(item.data)}</span><span>{formatKmOre(item)}</span></div></li>)}</ul>
                ) : (
                  lavoriLists[key].length === 0 ? <p>{key === "attesa" ? "Nessuna manutenzione da fare." : "Nessuna manutenzione eseguita."}</p> : <ul className="dossier-list">{lavoriLists[key].map((item) => { const b = workBadge(item, key === "attesa" ? "DA FARE" : "ESEGUITA", ""); return <li key={item.id} className="dossier-list-item" onClick={() => openManutenzioneWorkItem(item)} style={{ cursor: "pointer" }}><div className="dossier-list-main"><span className="dossier-badge" title={b.title}>{b.label}</span><strong>{item.descrizione}</strong></div><div className="dossier-list-meta"><span>{item.dettagli || "-"}</span><span>{formatDossierDate(item.dataInserimento)}</span></div></li>; })}</ul>
                )}
              </div>
            </div>
          </div>
        ) : null,
      )}

      <NextMezzoCronologiaModal open={cronologiaOpen} targa={targa ?? null} onClose={() => setCronologiaOpen(false)} />

      <PdfPreviewModal open={pdfOpen} title={pdfTitle} pdfUrl={pdfUrl} fileName={pdfFileName} hint={pdfHint} onClose={closePdf} onShare={onSharePdf} onCopyLink={async () => setPdfHint((await copyTextToClipboard(buildShareMessage())) ? "Testo copiato." : "Copia non disponibile.")} onWhatsApp={() => window.open(buildWhatsAppShareUrl(buildShareMessage()), "_blank", "noopener,noreferrer")} />
    </div>
  );
}
