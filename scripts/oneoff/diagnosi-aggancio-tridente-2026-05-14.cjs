"use strict";

const fs = require("fs");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "..", "..", "backend", "internal-ai", ".env"),
});

const {
  getInternalAiFirebaseAdminReadonlyContext,
} = require("../../backend/internal-ai/server/internal-ai-firebase-admin.js");

const STORAGE_COLLECTION = "storage";
const KEY_MANUTENZIONI = "@manutenzioni";
const KEY_GOMME_EVENTI = "@gomme_eventi";

const TARGET_MANUTENZIONE_ID = "from-lavoro-a5ba1512-2961-40a9-9c00-a27b6559bef2";
const TARGET_EVENTO_ID = "554348b3-f6ec-40e8-a861-6873af7cce56";
const TARGET_TARGA = "TI298409";
const DAY_MS = 24 * 60 * 60 * 1000;

const REPORT_PATH = path.join(
  __dirname,
  "..",
  "..",
  "docs",
  "_live",
  "DIAGNOSI_AGGANCIO_PROMPT37_2026-05-14.md",
);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.value)) return raw.value.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.items)) return raw.items.filter(isRecord);
  return [];
}

function text(value) {
  return String(value ?? "").trim();
}

function normalizeTarga(value) {
  return text(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function stringifyRaw(value) {
  if (value === undefined) return "undefined";
  if (typeof value === "bigint") return value.toString();
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function timestampIso(value) {
  if (value && typeof value === "object" && typeof value.toDate === "function") {
    const d = value.toDate();
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString() : "";
  }
  return "";
}

function shouldCollectDateField(key) {
  return /data|timestamp|createdAt|updatedAt|dataInserimento|dataEvento/i.test(key);
}

function collectDateFields(record, prefix = "") {
  const out = [];
  if (!isRecord(record)) return out;
  for (const [key, value] of Object.entries(record)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (shouldCollectDateField(key)) {
      out.push({
        campo: fullKey,
        tipo: typeof value,
        raw: stringifyRaw(value),
        timestampIso: timestampIso(value),
      });
    }
    if (isRecord(value) && !timestampIso(value)) {
      out.push(...collectDateFields(value, fullKey));
    }
  }
  return out;
}

function parseDateMsHelper(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.abs(value) < 1_000_000_000_000 ? value * 1000 : value;
  }
  if (value && typeof value === "object" && "toMillis" in value) {
    const toMillis = value.toMillis;
    if (typeof toMillis === "function") {
      const parsed = Number(toMillis.call(value));
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  if (value && typeof value === "object" && "seconds" in value) {
    const seconds = Number(value.seconds);
    return Number.isFinite(seconds) ? seconds * 1000 : null;
  }
  const raw = text(value);
  if (!raw) return null;
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    return Math.abs(numeric) < 1_000_000_000_000 ? numeric * 1000 : numeric;
  }
  const italianDate = raw.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (italianDate) {
    const day = Number(italianDate[1]);
    const month = Number(italianDate[2]) - 1;
    let year = Number(italianDate[3]);
    if (year < 100) year += 2000;
    const parsed = new Date(year, month, day).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseLegacyDateForCaller(value) {
  if (!value) return null;
  const normalized = String(value).trim().replace(/[./-]/g, " ");
  const match = normalized.match(/^(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  let year = Number(match[3]);
  if (!Number.isFinite(day) || !Number.isFinite(monthIndex) || !Number.isFinite(year)) return null;
  if (match[3].length === 2) year += year >= 70 ? 1900 : 2000;
  const parsed = new Date(year, monthIndex, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getLegacyDateTimestampForCaller(value) {
  return parseLegacyDateForCaller(value)?.getTime() ?? 0;
}

function getRuntimeDataRiferimento(record) {
  const probes = [
    { campo: "dataProgrammata", valore: record?.dataProgrammata },
    { campo: "data", valore: record?.data },
    { campo: "dataEsecuzione", valore: record?.dataEsecuzione },
  ];
  for (const probe of probes) {
    const ts = getLegacyDateTimestampForCaller(probe.valore);
    if (ts) return { ts, source: probe.campo, raw: stringifyRaw(probe.valore), fallbackNow: false };
  }
  const now = Date.now();
  return { ts: now, source: "Date.now()", raw: String(now), fallbackNow: true };
}

function getGommeEventoTimestamp(record) {
  const probes = [
    { campo: "data", valore: record?.data },
    { campo: "dataCambio", valore: record?.dataCambio },
    { campo: "timestamp", valore: record?.timestamp },
    { campo: "ts", valore: record?.ts },
    { campo: "dataOra", valore: record?.dataOra },
    { campo: "createdAt", valore: record?.createdAt },
  ];
  for (const probe of probes) {
    const ts = parseDateMsHelper(probe.valore);
    if (ts !== null) return { ts, source: probe.campo, raw: stringifyRaw(probe.valore) };
  }
  return { ts: null, source: "none", raw: "" };
}

function getGommeEventoTarga(record) {
  return (
    normalizeTarga(record?.targetTarga) ||
    normalizeTarga(record?.targa) ||
    normalizeTarga(record?.targaCamion) ||
    normalizeTarga(record?.targaMotrice) ||
    normalizeTarga(record?.targaRimorchio)
  );
}

function fmtDateTime(ms) {
  if (ms === null || ms === undefined) return "n/d";
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? "n/d" : d.toISOString();
}

async function readStorageList(db, key) {
  const snapshot = await db.collection(STORAGE_COLLECTION).doc(key).get();
  if (!snapshot.exists) return [];
  return unwrapList(snapshot.data());
}

function markdownTableRow(cells) {
  return `| ${cells.map((cell) => String(cell ?? "").replace(/\|/g, "\\|")).join(" | ")} |`;
}

async function main() {
  const adminContext = await getInternalAiFirebaseAdminReadonlyContext();
  if (adminContext.status !== "ready" || !adminContext.firestore) {
    const mode = adminContext.runtimeProbe?.credential?.mode ?? "unknown";
    throw new Error(`Firestore readonly non pronto: status=${adminContext.status} credential.mode=${mode}`);
  }

  const db = adminContext.firestore;
  const [manutenzioni, gommeEventi] = await Promise.all([
    readStorageList(db, KEY_MANUTENZIONI),
    readStorageList(db, KEY_GOMME_EVENTI),
  ]);

  const daFare = manutenzioni.find((record) => text(record.id) === TARGET_MANUTENZIONE_ID) || null;
  const eventoTarget = gommeEventi.find((record) => text(record.id) === TARGET_EVENTO_ID) || null;
  const eventiTarga = gommeEventi.filter((record) => getGommeEventoTarga(record) === normalizeTarga(TARGET_TARGA));

  const dataRiferimento = daFare ? getRuntimeDataRiferimento(daFare) : null;
  const rows = eventiTarga.map((evento) => {
    const eventTs = getGommeEventoTimestamp(evento);
    const confronto = dataRiferimento && eventTs.ts !== null ? eventTs.ts >= dataRiferimento.ts : false;
    const distanza =
      dataRiferimento && eventTs.ts !== null ? Math.floor((eventTs.ts - dataRiferimento.ts) / DAY_MS) : null;
    return {
      id: text(evento.id),
      eventTs,
      eventRawData: stringifyRaw(evento.data),
      dataRiferimento,
      confronto,
      passaFiltro: confronto,
      distanza,
    };
  });

  const targetRow = rows.find((row) => row.id === TARGET_EVENTO_ID) || null;
  let verdict = "D";
  let motivazione = "Il caso non rientra pienamente nelle tre ipotesi iniziali.";
  if (targetRow && dataRiferimento && targetRow.eventTs.ts !== null && targetRow.eventTs.ts < dataRiferimento.ts) {
    verdict = "A";
    motivazione =
      "La data riferimento passata dalla UI e' successiva alla data dell'evento; il confronto eventTs >= dataRiferimento esclude il cambio del 12 maggio.";
  } else if (targetRow && targetRow.eventTs.source !== "data") {
    verdict = "B";
    motivazione = `L'helper non usa il campo data come fonte primaria effettiva: fonte letta ${targetRow.eventTs.source}.`;
  } else if (!targetRow || targetRow.eventTs.ts === null) {
    verdict = "C";
    motivazione = "La data evento non viene parsata in un timestamp valido.";
  }

  const report = [];
  const line = (value = "") => report.push(value);

  line("# DIAGNOSI AGGANCIO PROMPT 37 - 2026-05-14");
  line("");
  line("> Diagnosi read-only del mismatch filtro Aggancia evento sul caso TI298409 8/12 maggio.");
  line("> Script: `scripts/oneoff/diagnosi-aggancio-tridente-2026-05-14.cjs`.");
  line("> Firestore: sola lettura via boundary/admin readonly. Zero scritture.");
  line("");
  line("## 1. Identita' record");
  line("");
  line(`- Credential mode: \`${adminContext.runtimeProbe?.credential?.mode ?? "unknown"}\``);
  line(`- @manutenzioni letti: ${manutenzioni.length}`);
  line(`- @gomme_eventi letti: ${gommeEventi.length}`);
  line(
    `- daFare target: ${daFare ? `id=\`${daFare.id}\`, stato=\`${daFare.stato}\`, targa=\`${daFare.targa}\`, descrizione=\`${daFare.descrizione}\`` : "NON TROVATA"}`,
  );
  line(
    `- evento target: ${eventoTarget ? `id=\`${eventoTarget.id}\`, targa=\`${eventoTarget.targa ?? eventoTarget.targetTarga}\`, tipo=\`${eventoTarget.tipo}\`, km=\`${eventoTarget.km}\`` : "NON TROVATO"}`,
  );
  line("");
  line("## 2. Campi raw");
  line("");
  line("### 2.1 daFare target");
  line("");
  line("| campo | typeof | raw | Timestamp.toDate ISO |");
  line("|-------|--------|-----|----------------------|");
  for (const entry of collectDateFields(daFare || {})) {
    line(markdownTableRow([entry.campo, entry.tipo, `\`${entry.raw}\``, entry.timestampIso || "-"]));
  }
  line("");
  line("### 2.2 evento target 12 maggio");
  line("");
  line("| campo | typeof | raw | Timestamp.toDate ISO |");
  line("|-------|--------|-----|----------------------|");
  for (const entry of collectDateFields(eventoTarget || {})) {
    line(markdownTableRow([entry.campo, entry.tipo, `\`${entry.raw}\``, entry.timestampIso || "-"]));
  }
  line("");
  line("### 2.3 tutti gli eventi gomme TI298409");
  line("");
  for (const evento of eventiTarga) {
    line(`#### Evento ${evento.id}`);
    line("");
    line(`- targa normalizzata: \`${getGommeEventoTarga(evento)}\``);
    line(`- identita: tipo=\`${evento.tipo ?? ""}\`, km=\`${evento.km ?? ""}\`, marca=\`${evento.marca ?? ""}\``);
    line("");
    line("| campo | typeof | raw | Timestamp.toDate ISO |");
    line("|-------|--------|-----|----------------------|");
    for (const entry of collectDateFields(evento)) {
      line(markdownTableRow([entry.campo, entry.tipo, `\`${entry.raw}\``, entry.timestampIso || "-"]));
    }
    line("");
  }
  line("## 3. Filtro applicato");
  line("");
  line(
    `- data riferimento UI da \`getManutenzioneAggancioTimestamp\`: source=\`${dataRiferimento?.source ?? "n/d"}\`, raw=\`${dataRiferimento?.raw ?? "n/d"}\`, ISO=\`${fmtDateTime(dataRiferimento?.ts)}\`, fallback Date.now=${dataRiferimento?.fallbackNow ? "SI" : "NO"}`,
  );
  line("- logica helper evento: `data -> dataCambio -> timestamp -> ts -> dataOra -> createdAt`.");
  line("- filtro helper: scarta evento se `eventTs < dataRiferimento`.");
  line("");
  line("| id evento | fonte data evento | data evento raw | data evento ISO | data riferimento raw | data riferimento ISO | confronto >= | passa filtro | distanza gg |");
  line("|-----------|-------------------|-----------------|-----------------|----------------------|----------------------|--------------|---------------|-------------|");
  for (const row of rows) {
    line(
      markdownTableRow([
        `\`${row.id}\``,
        row.eventTs.source,
        `\`${row.eventTs.raw}\``,
        fmtDateTime(row.eventTs.ts),
        `\`${row.dataRiferimento?.raw ?? "n/d"}\``,
        fmtDateTime(row.dataRiferimento?.ts),
        row.confronto ? "true" : "false",
        row.passaFiltro ? "SI" : "NO",
        row.distanza ?? "n/d",
      ]),
    );
  }
  line("");
  line("## 4. Verdetto");
  line("");
  line(`- Ipotesi: **${verdict}**`);
  line(`- Motivazione: ${motivazione}`);
  line("");
  line("## 5. Fix proposto");
  line("");
  line(
    "Nel caso daFare gomme, la UI deve passare all'helper la data di nascita/origine del record (`dataInserimento`, `createdAt`, `timestamp`, oppure origine segnalazione/controllo) prima di usare `Date.now()`.",
  );
  line(
    "Il fix piu' conservativo e' aggiornare il chiamante in `NextManutenzioniPage.tsx` per calcolare `dataRiferimento` con una fallback chain compatibile con i timestamp reali, oppure estendere `NextAggancioEventoModal`/helper a ricevere anche il record raw e risolvere internamente la data origine.",
  );
  line("");
  line("## 6. Stato Firestore");
  line("");
  line("- Sola lettura: `storage/@manutenzioni` e `storage/@gomme_eventi`.");
  line("- Zero scritture eseguite.");

  fs.writeFileSync(REPORT_PATH, `${report.join("\n")}\n`, "utf8");

  const output = {
    status: "PASS",
    reportPath: REPORT_PATH,
    daFare: daFare
      ? {
          id: daFare.id,
          stato: daFare.stato,
          targa: daFare.targa,
          descrizione: daFare.descrizione,
          dateFields: collectDateFields(daFare),
        }
      : null,
    eventoTarget: eventoTarget
      ? {
          id: eventoTarget.id,
          targa: eventoTarget.targa ?? eventoTarget.targetTarga,
          dateFields: collectDateFields(eventoTarget),
        }
      : null,
    dataRiferimento,
    filtroTarget: targetRow,
    verdict,
    motivazione,
    eventiTarga: rows.map((row) => ({
      id: row.id,
      eventSource: row.eventTs.source,
      eventRaw: row.eventTs.raw,
      eventIso: fmtDateTime(row.eventTs.ts),
      passaFiltro: row.passaFiltro,
      distanzaGiorni: row.distanza,
    })),
    firestore: "invariato: nessuna scrittura",
  };
  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error("[diagnosi-aggancio] FAIL", error);
  process.exitCode = 1;
});
