/**
 * PROMPT 46 — Audit mirato READ-ONLY su TI298409 (Riccardo Fenderico).
 *
 * Sostituisce/corregge l'audit T5 di PROMPT 45 che aveva confuso i dati:
 *   - aveva guardato solo i legami espliciti `origineRefId` sui record gomme
 *     in @manutenzioni (entrambi null) -> conclusione "stand-alone" errata
 *   - non aveva cercato segnalazioni/controlli per targa indipendentemente dai legami
 *   - aveva dichiarato che la segnalazione del 24/04 era per "perdita liquido"
 *     senza verificare se esistesse anche una segnalazione del 08/05 per gomme
 *
 * Questo script:
 *   1. Dumpa TUTTI i record per targa TI298409 da TUTTE le 5 collection backup
 *   2. Cerca sia per `targa` che per `targaCamion`/`targaMotrice`/`targaRimorchio`
 *   3. Costruisce timeline cronologica + dettagli autore/desc/stato/legami
 *   4. Scrive JSON dump e report markdown
 *
 * Sorgente: C:\tmp\backup_firestore_prompt44_20260515_071257\ (backup PROMPT 44).
 * Nessuna scrittura.
 */

const fs = require("node:fs");
const path = require("node:path");

const TARGA = "TI298409";
const BACKUP_DIR =
  process.env.BACKUP_DIR || "C:\\tmp\\backup_firestore_prompt44_20260515_071257";
const OUT_DIR = path.resolve(
  process.cwd(),
  "test-results",
  "audit-ti298409-2026-05-15-prompt46",
);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readBackup(name) {
  const filePath = path.join(BACKUP_DIR, name);
  if (!fs.existsSync(filePath)) return null;
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const raw = parsed && parsed.raw ? parsed.raw : parsed;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.value)) return raw.value;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
}

function normTarga(value) {
  return String(value ?? "").trim().toUpperCase();
}

function matchesTI298409(record) {
  // Cerca su tutti i campi target possibili.
  const fields = [
    record.targa,
    record.targaCamion,
    record.targaMotrice,
    record.targaRimorchio,
    record.targaPrincipale,
    record.targaMezzo,
  ];
  return fields.some((f) => normTarga(f) === TARGA);
}

function isGommeRelated(record) {
  const desc = String(record.descrizione ?? record.testo ?? record.note ?? "").toLowerCase();
  const tipo = String(record.tipo ?? record.tipoProblema ?? "").toLowerCase();
  const sottotipo = String(record.sottotipo ?? "").toLowerCase();
  const check = record.check && typeof record.check === "object" ? record.check : {};
  const checkKeys = Object.keys(check).filter((k) => check[k] === false);
  const checkBlob = checkKeys.join(" ").toLowerCase();
  return (
    desc.includes("gomm") ||
    tipo.includes("gomm") ||
    sottotipo.includes("gomm") ||
    checkBlob.includes("gomm") ||
    checkBlob.includes("pneum")
  );
}

function parseDate(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value);
  if (typeof value === "string") {
    // ISO breve "2026-05-08"
    const isoShort = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoShort) {
      return new Date(Number(isoShort[1]), Number(isoShort[2]) - 1, Number(isoShort[3]));
    }
    // ISO extended
    const isoExt = value.match(/^\d{4}-\d{2}-\d{2}[Tt ]/);
    if (isoExt) {
      const d = new Date(value);
      return Number.isFinite(d.getTime()) ? d : null;
    }
    // GG/MM/AAAA
    const legacy = value.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
    if (legacy) {
      return new Date(Number(legacy[3]), Number(legacy[2]) - 1, Number(legacy[1]));
    }
  }
  return null;
}

function toDisplay(date) {
  if (!date) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function pickDataPrincipale(record, kind) {
  // Ordine di priorita' specifico per kind.
  if (kind === "segnalazione") {
    return (
      parseDate(record.timestamp) ||
      parseDate(record.dataInserimento) ||
      parseDate(record.createdAt) ||
      parseDate(record.data) ||
      null
    );
  }
  if (kind === "controllo") {
    return (
      parseDate(record.timestamp) ||
      parseDate(record.dataInserimento) ||
      parseDate(record.createdAt) ||
      parseDate(record.data) ||
      null
    );
  }
  if (kind === "gomme_evento") {
    return (
      parseDate(record.data) ||
      parseDate(record.timestamp) ||
      parseDate(record.dataInserimento) ||
      null
    );
  }
  if (kind === "manutenzione") {
    return (
      parseDate(record.data) ||
      parseDate(record.dataProgrammata) ||
      parseDate(record.dataInserimento) ||
      parseDate(record.createdAt) ||
      null
    );
  }
  return null;
}

function pickAutore(record) {
  return (
    record.autistaNome ||
    record.segnalatoDa ||
    record.createdBy ||
    record.eseguitoDa ||
    record.userName ||
    record.badgeAutista ||
    null
  );
}

function pickStato(record, kind) {
  if (kind === "controllo") {
    const ko = Object.entries(record.check || {})
      .filter(([, v]) => v === false)
      .map(([k]) => k);
    return ko.length > 0 ? `KO (${ko.join(",")})` : "OK";
  }
  return record.stato || record.status || (record.chiusa ? "chiusa" : null) || (record.letta ? "letta" : "nuovo");
}

function pickLegamiUscenti(record, kind) {
  const out = [];
  if (record.origineTipo || record.origineRefId) {
    out.push(`origine: ${record.origineTipo ?? "?"} -> ${record.origineRefId ?? "?"}`);
  }
  if (record.linkedLavoroId) out.push(`linkedLavoroId: ${record.linkedLavoroId}`);
  if (Array.isArray(record.linkedLavoroIds) && record.linkedLavoroIds.length > 0) {
    out.push(`linkedLavoroIds: [${record.linkedLavoroIds.join(", ")}]`);
  }
  if (record.chiusuraDi || record.chiusuraRefId) {
    out.push(`chiusura: ${record.chiusuraDi ?? "?"} -> ${record.chiusuraRefId ?? "?"}`);
  }
  if (record.linkedSegnalazioneId) out.push(`linkedSegnalazioneId: ${record.linkedSegnalazioneId}`);
  if (record.linkedControlloId) out.push(`linkedControlloId: ${record.linkedControlloId}`);
  return out.length > 0 ? out.join("; ") : "(nessun legame esplicito)";
}

function summarize(record, kind) {
  const date = pickDataPrincipale(record, kind);
  return {
    kind,
    id: record.id ?? "(no id)",
    dataPrincipale: date ? date.getTime() : null,
    dataDisplay: toDisplay(date),
    autore: pickAutore(record),
    descrizione: String(record.descrizione ?? record.testo ?? record.tipoProblema ?? "").slice(0, 300),
    stato: pickStato(record, kind),
    legami: pickLegamiUscenti(record, kind),
    raw: record,
  };
}

function main() {
  ensureDir(OUT_DIR);
  console.log(`AUDIT TI298409 (PROMPT 46) — backup ${BACKUP_DIR}`);

  const manutenzioni = readBackup("_manutenzioni.json") || [];
  const segnalazioni = readBackup("_segnalazioni_autisti_tmp.json") || [];
  const controlli = readBackup("_controlli_mezzo_autisti.json") || [];
  const gommeEventi = readBackup("_gomme_eventi.json") || [];

  console.log(`Conteggi totali: manutenzioni=${manutenzioni.length}, segnalazioni=${segnalazioni.length}, controlli=${controlli.length}, gommeEventi=${gommeEventi.length}`);

  // Filtra per targa TI298409 in tutti i campi possibili.
  const manTarga = manutenzioni.filter(matchesTI298409);
  const segTarga = segnalazioni.filter(matchesTI298409);
  const ctrlTarga = controlli.filter(matchesTI298409);
  const eventiTarga = gommeEventi.filter(matchesTI298409);

  console.log(`\nFiltrati per ${TARGA}:`);
  console.log(`  manutenzioni:    ${manTarga.length}`);
  console.log(`  segnalazioni:    ${segTarga.length}`);
  console.log(`  controlli:       ${ctrlTarga.length}`);
  console.log(`  gomme_eventi:    ${eventiTarga.length}`);

  // Dump completo per collection.
  fs.writeFileSync(
    path.join(OUT_DIR, "manutenzioni-TI298409.json"),
    JSON.stringify(manTarga, null, 2),
    "utf8",
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "segnalazioni-TI298409.json"),
    JSON.stringify(segTarga, null, 2),
    "utf8",
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "controlli-TI298409.json"),
    JSON.stringify(ctrlTarga, null, 2),
    "utf8",
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "gomme_eventi-TI298409.json"),
    JSON.stringify(eventiTarga, null, 2),
    "utf8",
  );

  // Sintesi normalizzata per timeline.
  const timeline = [
    ...manTarga.map((r) => summarize(r, "manutenzione")),
    ...segTarga.map((r) => summarize(r, "segnalazione")),
    ...ctrlTarga.map((r) => summarize(r, "controllo")),
    ...eventiTarga.map((r) => summarize(r, "gomme_evento")),
  ];
  timeline.sort((a, b) => {
    const da = a.dataPrincipale == null ? Number.POSITIVE_INFINITY : a.dataPrincipale;
    const db = b.dataPrincipale == null ? Number.POSITIVE_INFINITY : b.dataPrincipale;
    return da - db;
  });

  fs.writeFileSync(
    path.join(OUT_DIR, "timeline-TI298409.json"),
    JSON.stringify(timeline, null, 2),
    "utf8",
  );

  // Sotto-set "gomme-related" per evidenziare i record chiave del caso Giuseppe.
  const gommeAll = timeline.filter((e) => isGommeRelated(e.raw));
  fs.writeFileSync(
    path.join(OUT_DIR, "timeline-gomme-TI298409.json"),
    JSON.stringify(gommeAll, null, 2),
    "utf8",
  );

  console.log(`\n=== TIMELINE COMPLETA TI298409 (${timeline.length} record) ===`);
  for (const entry of timeline) {
    console.log(
      `${entry.dataDisplay || "??/??/????"} | ${entry.kind.padEnd(13)} | ${(entry.autore || "?").padEnd(22)} | id=${entry.id} | stato=${entry.stato} | legami: ${entry.legami}`,
    );
    console.log(`    desc: ${entry.descrizione.replace(/\n/g, " | ").slice(0, 180)}`);
  }

  console.log(`\n=== TIMELINE GOMME-RELATED TI298409 (${gommeAll.length} record) ===`);
  for (const entry of gommeAll) {
    console.log(
      `${entry.dataDisplay || "??/??/????"} | ${entry.kind.padEnd(13)} | ${(entry.autore || "?").padEnd(22)} | id=${entry.id} | stato=${entry.stato}`,
    );
    console.log(`    desc: ${entry.descrizione.replace(/\n/g, " | ").slice(0, 180)}`);
    console.log(`    legami: ${entry.legami}`);
  }

  console.log(`\nDump in: ${OUT_DIR}`);
}

main();
