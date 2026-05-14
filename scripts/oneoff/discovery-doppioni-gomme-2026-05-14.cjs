/**
 * discovery-doppioni-gomme-2026-05-14.cjs
 * ----------------------------------------------------------------------------
 * Script discovery UNA-TANTUM, READ-ONLY.
 * PROMPT 32 - Quantifica i doppioni "daFare gomme aperte in @manutenzioni"
 * che hanno una controparte "cambio gomme eseguito" in @gomme_eventi non collegata.
 *
 * GARANZIE:
 *  - NESSUNA scrittura Firestore: usa solo .get(). Nessun set/update/delete/commit.
 *  - Non modifica codice applicativo.
 *  - Produce: docs/_live/DISCOVERY_DOPPIONI_GOMME_2026-05-14.md
 *
 * STRUTTURA DATI REALE (verificata su src/utils/storageSync.ts):
 *  - Ogni dataset e' UN documento Firestore: storage/<key>
 *  - La lista record sta nel campo `.value` del documento (fallback: array diretto / .items).
 *
 * CREDENZIALI:
 *  - stesso pattern dello script migrazione PROMPT 11:
 *    dotenv su backend/internal-ai/.env + getInternalAiFirebaseAdminReadonlyContext().
 *
 * USO:  node scripts/oneoff/discovery-doppioni-gomme-2026-05-14.cjs
 * ----------------------------------------------------------------------------
 */

"use strict";

const fs = require("fs");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "..", "..", "backend", "internal-ai", ".env"),
});
const {
  getInternalAiFirebaseAdminReadonlyContext,
} = require("../../backend/internal-ai/server/internal-ai-firebase-admin.js");

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------
const STORAGE_COLLECTION = "storage";
const KEY_MANUTENZIONI = "@manutenzioni";
const KEY_GOMME_EVENTI = "@gomme_eventi";
const KEY_GOMME_TMP = "@cambi_gomme_autisti_tmp";
const KEY_SEGNALAZIONI = "@segnalazioni_autisti_tmp";
const KEY_CONTROLLI = "@controlli_mezzo_autisti";

const GOMME_KEYWORDS = [
  "gomma",
  "gomme",
  "pneumatici",
  "pneumatico",
  "ruota",
  "ruote",
  "gommista",
];

const REPORT_PATH = path.join(
  __dirname,
  "..",
  "..",
  "docs",
  "_live",
  "DISCOVERY_DOPPIONI_GOMME_2026-05-14.md",
);

const DAY_MS = 24 * 60 * 60 * 1000;

async function getDiscoveryFirestore() {
  const adminContext = await getInternalAiFirebaseAdminReadonlyContext();
  if (adminContext.status !== "ready" || !adminContext.firestore) {
    const mode = adminContext.runtimeProbe?.credential?.mode ?? "unknown";
    throw new Error(`Firebase Admin non pronto: context.status=${adminContext.status} credential.mode=${mode}`);
  }
  const mode = adminContext.runtimeProbe?.credential?.mode ?? "unknown";
  console.log(`[auth] Firebase Admin context pronto via: ${mode}`);
  return adminContext.firestore;
}

// ---------------------------------------------------------------------------
// HELPER DATI
// ---------------------------------------------------------------------------
function unwrapList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((x) => x && typeof x === "object");
  if (typeof raw === "object") {
    if (Array.isArray(raw.value)) return raw.value.filter((x) => x && typeof x === "object");
    if (Array.isArray(raw.items)) return raw.items.filter((x) => x && typeof x === "object");
  }
  return [];
}

async function readStorageList(db, key) {
  const snap = await db.collection(STORAGE_COLLECTION).doc(key).get();
  if (!snap.exists) return { exists: false, list: [] };
  const data = snap.data();
  // storageSync.ts salva sotto `.value`; fallback difensivo su altre forme.
  const raw =
    data && Object.prototype.hasOwnProperty.call(data, "value") ? data.value : data;
  return { exists: true, list: unwrapList(raw) };
}

function txt(v) {
  return String(v == null ? "" : v).trim();
}

function lower(v) {
  return txt(v).toLowerCase();
}

function hasGommeKeyword(record) {
  const haystack = `${lower(record.descrizione)} ${lower(record.tipo)} ${lower(
    record.sottotipo,
  )} ${lower(record.titolo)} ${lower(record.note)}`;
  return GOMME_KEYWORDS.some((kw) => haystack.includes(kw));
}

/** Estrae un timestamp (ms) da un valore eterogeneo: number, ISO string, Firestore Timestamp, dd/mm/yyyy. */
function parseDateMs(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    // euristica: secondi vs millisecondi
    return value < 1e12 ? value * 1000 : value;
  }
  if (typeof value === "object") {
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value._seconds === "number") return value._seconds * 1000;
    if (typeof value.seconds === "number") return value.seconds * 1000;
  }
  const s = txt(value);
  if (!s) return null;
  // dd/mm/yyyy o dd-mm-yyyy
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]) - 1;
    let y = Number(m[3]);
    if (y < 100) y += 2000;
    const ms = new Date(y, mo, d).getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : null;
}

/** Timestamp di "nascita" della daFare: prova piu' campi, poi risale all'origine. */
function resolveDaFareTimestamp(record, origineIndex) {
  const candidates = [
    record.dataInserimento,
    record.createdAt,
    record.dataCreazione,
    record.timestamp,
    record.ts,
    record.data,
    record.dataProgrammata,
  ];
  for (const c of candidates) {
    const ms = parseDateMs(c);
    if (ms != null) return { ms, source: "record" };
  }
  // Fallback: risali alla segnalazione/controllo d'origine.
  const refId = txt(record.origineRefId);
  const refKey = txt(record.origineRefKey);
  if (refId && origineIndex && origineIndex[refKey]) {
    const origine = origineIndex[refKey].get(refId);
    if (origine) {
      const oCandidates = [
        origine.timestamp,
        origine.ts,
        origine.data,
        origine.dataOra,
        origine.createdAt,
        origine.dataInserimento,
      ];
      for (const c of oCandidates) {
        const ms = parseDateMs(c);
        if (ms != null) return { ms, source: `origine:${refKey}` };
      }
    }
  }
  return { ms: null, source: "none" };
}

function normTarga(value) {
  return txt(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function gommaEventoTarga(record) {
  return (
    normTarga(record.targa) ||
    normTarga(record.targetTarga) ||
    normTarga(record.targaCamion) ||
    normTarga(record.targaMotrice) ||
    normTarga(record.targaRimorchio)
  );
}

function gommaEventoTimestamp(record) {
  const candidates = [
    record.data,
    record.dataCambio,
    record.timestamp,
    record.ts,
    record.dataOra,
    record.createdAt,
  ];
  for (const c of candidates) {
    const ms = parseDateMs(c);
    if (ms != null) return ms;
  }
  return null;
}

function fmtDate(ms) {
  if (ms == null) return "n/d";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "n/d";
  return d.toISOString().slice(0, 10);
}

function windowLabel(days) {
  if (days == null) return "n/d";
  if (days <= 30) return "0-30 gg";
  if (days <= 60) return "31-60 gg";
  if (days <= 90) return "61-90 gg";
  if (days <= 180) return "91-180 gg";
  return ">180 gg";
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
async function main() {
  console.log("=== DISCOVERY DOPPIONI GOMME 2026-05-14 (READ-ONLY) ===\n");

  const db = await getDiscoveryFirestore();

  // --- Lettura dataset ------------------------------------------------------
  const manutenzioniRes = await readStorageList(db, KEY_MANUTENZIONI);
  const gommeEventiRes = await readStorageList(db, KEY_GOMME_EVENTI);
  const gommeTmpRes = await readStorageList(db, KEY_GOMME_TMP);
  const segnalazioniRes = await readStorageList(db, KEY_SEGNALAZIONI);
  const controlliRes = await readStorageList(db, KEY_CONTROLLI);

  const manutenzioni = manutenzioniRes.list;
  const gommeEventi = gommeEventiRes.list;

  console.log(`[read] @manutenzioni             : ${manutenzioni.length} record`);
  console.log(`[read] @gomme_eventi             : ${gommeEventi.length} record`);
  console.log(`[read] @cambi_gomme_autisti_tmp  : ${gommeTmpRes.list.length} record`);
  console.log(`[read] @segnalazioni_autisti_tmp : ${segnalazioniRes.list.length} record`);
  console.log(`[read] @controlli_mezzo_autisti  : ${controlliRes.list.length} record\n`);

  // Indice origini per risalire al timestamp di nascita della daFare.
  const origineIndex = {
    [KEY_SEGNALAZIONI]: new Map(
      segnalazioniRes.list.map((r) => [txt(r.id), r]),
    ),
    [KEY_CONTROLLI]: new Map(controlliRes.list.map((r) => [txt(r.id), r])),
  };

  // --- Step 1: daFare/programmata gomme ------------------------------------
  const daFareTotali = manutenzioni.filter(
    (r) => lower(r.stato) === "dafare" || lower(r.stato) === "programmata",
  );
  const daFareGomme = daFareTotali
    .filter(hasGommeKeyword)
    .map((r) => {
      const tsInfo = resolveDaFareTimestamp(r, origineIndex);
      return {
        id: txt(r.id),
        targa: normTarga(r.targa) || normTarga(r.targaCamion),
        targaRaw: txt(r.targa) || txt(r.targaCamion),
        descrizione: txt(r.descrizione) || txt(r.tipo) || "(senza descrizione)",
        tipo: txt(r.tipo),
        stato: txt(r.stato),
        origineTipo: txt(r.origineTipo) || "n/d",
        origineRefId: txt(r.origineRefId),
        nascitaMs: tsInfo.ms,
        nascitaSource: tsInfo.source,
      };
    });

  console.log(`[step1] daFare/programmata totali        : ${daFareTotali.length}`);
  console.log(`[step1] daFare gomme (con keyword)       : ${daFareGomme.length}`);
  const senzaData = daFareGomme.filter((d) => d.nascitaMs == null).length;
  console.log(`[step1] di cui senza data di nascita     : ${senzaData}\n`);

  // --- Step 2: indice @gomme_eventi per targa ------------------------------
  const eventiByTarga = new Map();
  let eventiSenzaTarga = 0;
  let eventiSenzaData = 0;
  for (const ev of gommeEventi) {
    const targa = gommaEventoTarga(ev);
    const ms = gommaEventoTimestamp(ev);
    if (!targa) {
      eventiSenzaTarga += 1;
      continue;
    }
    if (ms == null) eventiSenzaData += 1;
    if (!eventiByTarga.has(targa)) eventiByTarga.set(targa, []);
    eventiByTarga.get(targa).push({
      id: txt(ev.id) || "(senza id)",
      targa,
      ms,
      km: ev.km != null ? ev.km : null,
      marca: txt(ev.marca),
      asse: txt(ev.asse) || txt(ev.asseLabel) || txt(ev.posizione),
      tipo: txt(ev.tipo) || txt(ev.tipoIntervento),
    });
  }
  console.log(`[step2] @gomme_eventi indicizzati per targa: ${eventiByTarga.size} targhe`);
  console.log(`[step2] eventi senza targa riconoscibile   : ${eventiSenzaTarga}`);
  console.log(`[step2] eventi senza data riconoscibile    : ${eventiSenzaData}\n`);

  // --- Step 3: match daFare gomme <-> @gomme_eventi -------------------------
  const matched = [];
  const orfani = [];
  const nonValutabili = []; // daFare gomme senza data di nascita -> non si puo' calcolare la finestra

  for (const df of daFareGomme) {
    if (df.nascitaMs == null) {
      nonValutabili.push(df);
      continue;
    }
    const candidati = (eventiByTarga.get(df.targa) || [])
      .filter((ev) => ev.ms != null && ev.ms >= df.nascitaMs)
      .sort((a, b) => a.ms - b.ms);
    if (candidati.length === 0) {
      orfani.push(df);
      continue;
    }
    const best = candidati[0]; // il piu' vicino dopo la nascita
    const days = Math.round((best.ms - df.nascitaMs) / DAY_MS);
    matched.push({
      daFare: df,
      evento: best,
      altriMatch: candidati.length - 1,
      days,
      window: windowLabel(days),
    });
  }

  // --- Step 4: categorizzazione --------------------------------------------
  const windows = ["0-30 gg", "31-60 gg", "61-90 gg", "91-180 gg", ">180 gg"];
  const byWindow = {};
  windows.forEach((w) => (byWindow[w] = []));
  matched.forEach((m) => byWindow[m.window].push(m));

  const totGomme = daFareGomme.length;
  const pct = (n) => (totGomme > 0 ? ((n / totGomme) * 100).toFixed(1) : "0.0");

  console.log("[step4] distribuzione match per finestra:");
  windows.forEach((w) =>
    console.log(`        ${w.padEnd(10)}: ${byWindow[w].length} (${pct(byWindow[w].length)}%)`),
  );
  console.log(`        ${"orfani".padEnd(10)}: ${orfani.length} (${pct(orfani.length)}%)`);
  console.log(
    `        ${"non val.".padEnd(10)}: ${nonValutabili.length} (${pct(nonValutabili.length)}%)\n`,
  );

  // --- Step 5: report Markdown ---------------------------------------------
  const lines = [];
  const L = (s = "") => lines.push(s);

  L("# DISCOVERY DOPPIONI GOMME - 2026-05-14");
  L("");
  L("> Audit quantitativo dei doppioni daFare gomme in `@manutenzioni` vs cambio gomme eseguito in `@gomme_eventi`.");
  L("> Generato dallo script `scripts/oneoff/discovery-doppioni-gomme-2026-05-14.cjs`.");
  L("> Lettura Firestore read-only. Zero scritture.");
  L(`> Esecuzione: ${new Date().toISOString()}`);
  L("");
  L("## 1. Numeri di sintesi");
  L("");
  L(`- \`@manutenzioni\` totali: **${manutenzioni.length}**`);
  L(`- daFare/programmata totali: **${daFareTotali.length}**`);
  L(`- daFare gomme (con keyword): **${daFareGomme.length}**`);
  L(`  - di cui senza data di nascita ricostruibile (non valutabili per finestra): **${nonValutabili.length}**`);
  L(`- \`@gomme_eventi\` totali: **${gommeEventi.length}**`);
  L(`  - eventi senza targa riconoscibile: ${eventiSenzaTarga}`);
  L(`  - eventi senza data riconoscibile: ${eventiSenzaData}`);
  L(`- keyword gomme usate: ${GOMME_KEYWORDS.map((k) => `\`${k}\``).join(", ")}`);
  L("");
  L("## 2. Match daFare gomme <-> @gomme_eventi");
  L("");
  L("Distribuzione per finestra temporale (giorni tra nascita daFare e primo cambio gomme successivo sulla stessa targa):");
  L("");
  L("| Finestra | Numero daFare con match | % sul totale daFare gomme |");
  L("|----------|-------------------------|---------------------------|");
  windows.forEach((w) =>
    L(`| ${w} | ${byWindow[w].length} | ${pct(byWindow[w].length)}% |`),
  );
  L(`| Nessun match (orfani) | ${orfani.length} | ${pct(orfani.length)}% |`);
  L(`| Non valutabili (daFare senza data) | ${nonValutabili.length} | ${pct(nonValutabili.length)}% |`);
  L("");

  const exampleRow = (m) =>
    `| \`${m.daFare.id}\` | ${m.daFare.targaRaw || m.daFare.targa || "n/d"} | ${m.daFare.descrizione.replace(/\|/g, "/")} | ${fmtDate(m.daFare.nascitaMs)} (${m.daFare.nascitaSource}) | \`${m.evento.id}\` | ${fmtDate(m.evento.ms)} | ${m.days} |`;

  L("## 3. Casi di alta probabilita' chiusura ciclo (0-60 gg)");
  L("");
  const alta = [...byWindow["0-30 gg"], ...byWindow["31-60 gg"]].sort(
    (a, b) => a.days - b.days,
  );
  if (alta.length === 0) {
    L("_Nessun caso in finestra 0-60 gg._");
  } else {
    L("| id daFare | targa | descrizione | nascita daFare | id @gomme_eventi | data cambio | distanza gg |");
    L("|-----------|-------|-------------|----------------|------------------|-------------|-------------|");
    alta.slice(0, 30).forEach((m) => L(exampleRow(m)));
    if (alta.length > 30) L(`| ... | ... | (+${alta.length - 30} altri) | ... | ... | ... | ... |`);
  }
  L("");

  L("## 4. Casi di media probabilita' (61-180 gg)");
  L("");
  const media = [...byWindow["61-90 gg"], ...byWindow["91-180 gg"]].sort(
    (a, b) => a.days - b.days,
  );
  if (media.length === 0) {
    L("_Nessun caso in finestra 61-180 gg._");
  } else {
    L("| id daFare | targa | descrizione | nascita daFare | id @gomme_eventi | data cambio | distanza gg |");
    L("|-----------|-------|-------------|----------------|------------------|-------------|-------------|");
    media.slice(0, 30).forEach((m) => L(exampleRow(m)));
    if (media.length > 30) L(`| ... | ... | (+${media.length - 30} altri) | ... | ... | ... | ... |`);
  }
  L("");

  L("## 5. Orfani senza match");
  L("");
  L("daFare gomme che NON hanno alcun cambio gomme posteriore sulla stessa targa in `@gomme_eventi`.");
  L("Possibili interpretazioni:");
  L("- cambio gomme non ancora eseguito (legittimo, daFare valida);");
  L("- cambio gomme fatto ma NON registrato via app (intervento gommista esterno);");
  L("- daFare ridondante o gia' gestita altrove.");
  L("");
  L("Inclusi anche i match >180 gg (distanza cosi' ampia da essere verosimilmente scollegata).");
  L("");
  const orfaniEstesi = [
    ...orfani.map((d) => ({ daFare: d, days: null, evento: null })),
    ...byWindow[">180 gg"],
  ];
  if (orfaniEstesi.length === 0) {
    L("_Nessun orfano._");
  } else {
    L("| id daFare | targa | descrizione | nascita daFare | origineTipo | match >180gg (id / gg) |");
    L("|-----------|-------|-------------|----------------|-------------|------------------------|");
    orfaniEstesi.slice(0, 40).forEach((o) => {
      const d = o.daFare;
      const matchInfo = o.evento ? `\`${o.evento.id}\` / ${o.days}` : "-";
      L(
        `| \`${d.id}\` | ${d.targaRaw || d.targa || "n/d"} | ${d.descrizione.replace(/\|/g, "/")} | ${fmtDate(d.nascitaMs)} (${d.nascitaSource}) | ${d.origineTipo} | ${matchInfo} |`,
      );
    });
    if (orfaniEstesi.length > 40)
      L(`| ... | ... | (+${orfaniEstesi.length - 40} altri) | ... | ... | ... |`);
  }
  L("");

  if (nonValutabili.length > 0) {
    L("### 5b. daFare gomme NON valutabili (nessuna data di nascita)");
    L("");
    L("daFare gomme prive di qualunque timestamp e senza origine risalibile: impossibile calcolare la finestra.");
    L("");
    L("| id daFare | targa | descrizione | origineTipo | origineRefId |");
    L("|-----------|-------|-------------|-------------|--------------|");
    nonValutabili.slice(0, 40).forEach((d) =>
      L(
        `| \`${d.id}\` | ${d.targaRaw || d.targa || "n/d"} | ${d.descrizione.replace(/\|/g, "/")} | ${d.origineTipo} | ${d.origineRefId || "-"} |`,
      ),
    );
    if (nonValutabili.length > 40)
      L(`| ... | ... | (+${nonValutabili.length - 40} altri) | ... | ... |`);
    L("");
  }

  L("## 6. Conclusioni operative");
  L("");
  const altaN = alta.length;
  const mediaN = media.length;
  const orfaniN = orfani.length;
  L(`- **Alta probabilita' (0-60 gg): ${altaN} daFare.** Sono i candidati piu' forti per una riconciliazione una-tantum: ogni daFare ha un cambio gomme reale entro 60 giorni dalla sua nascita.`);
  L(`- **Media probabilita' (61-180 gg): ${mediaN} daFare.** Richiedono conferma manuale di Giuseppe: la distanza temporale rende il legame plausibile ma non certo.`);
  L(`- **Orfani (nessun match): ${orfaniN} daFare** (+ ${byWindow[">180 gg"].length} con match solo >180 gg). Richiedono decisione manuale: chiudere senza match, lasciare aperti come reminder, o indagare interventi gommista esterni non registrati.`);
  if (nonValutabili.length > 0) {
    L(`- **Non valutabili: ${nonValutabili.length} daFare** senza data di nascita: vanno ispezionate a parte, lo script non puo' collocarle in una finestra.`);
  }
  L("");
  L("**Finestra temporale suggerita per il matching futuro (live):** da decidere sulla base della distribuzione qui sopra. ");
  L("Se la massa dei match e' concentrata in 0-30 / 0-60 gg, una finestra di 60 giorni cattura la maggior parte dei cicli reali con basso rischio di falsi positivi.");
  L("");
  L("> Nota: questo report fornisce SOLO numeri. La scelta della finestra e della strategia di fix (riconciliazione retroattiva via script vs solo fix live) e' demandata al prompt successivo.");
  L("");
  L("## 7. Stato Firestore");
  L("");
  L("Confermato invariato - lo script usa esclusivamente `.get()`:");
  L(`- \`@manutenzioni\`: ${manutenzioni.length} record (sola lettura)`);
  L(`- \`@gomme_eventi\`: ${gommeEventi.length} record (sola lettura)`);
  L(`- \`@cambi_gomme_autisti_tmp\`: ${gommeTmpRes.list.length} record (sola lettura)`);
  L(`- \`@segnalazioni_autisti_tmp\`: ${segnalazioniRes.list.length} record (sola lettura)`);
  L(`- \`@controlli_mezzo_autisti\`: ${controlliRes.list.length} record (sola lettura)`);
  L("- Zero scritture eseguite (nessun set/update/delete/commit nel codice).");
  L("");

  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");
  console.log(`[step5] report scritto: ${REPORT_PATH}\n`);

  // --- Step 6 --------------------------------------------------------------
  console.log("READ-ONLY DISCOVERY COMPLETED. Nessuna scrittura Firestore eseguita.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[ERRORE] discovery fallita:", err);
    process.exit(1);
  });
