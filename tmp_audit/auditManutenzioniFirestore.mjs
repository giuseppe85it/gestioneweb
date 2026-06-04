// tmp_audit/auditManutenzioniFirestore.mjs
// AUDIT FISICO STEP 2 — SOLA LETTURA. Nessun metodo di scrittura presente.
// Metodi firebase-admin usati: initializeApp, credential.cert, firestore(),
// .collection(), .doc(), .get(). NESSUN set/update/add/delete/batch/transaction.

import admin from "firebase-admin";
import { readFileSync } from "node:fs";

const SERVICE_ACCOUNT_PATH =
  "C:\\Users\\giumi\\.firebase-keys\\gestionemanutenzione-934ef-firebase-adminsdk-fbsvc-7a0850bcd3.json";
const PROJECT_ID = "gestionemanutenzione-934ef";

// ---------- buffer output ----------
const LINES = [];
function out(s = "") {
  LINES.push(s);
  console.log(s);
}

// ============================================================
// FUNZIONI REPLICATE ALLA LETTERA DAL CODICE APP (sola copia, non import)
// ------------------------------------------------------------
// src/next/nextAnagraficheFlottaDomain.ts:175-177
function normalizeTextFlotta(value) {
  return typeof value === "string" ? value.trim() : "";
}
// src/next/nextAnagraficheFlottaDomain.ts:254-256
function normalizeTarga(value) {
  return normalizeTextFlotta(value).toUpperCase().replace(/\s+/g, "");
}
// src/next/nextAnagraficheFlottaDomain.ts:258-260
function normalizeNextMezzoTarga(value) {
  return normalizeTarga(value);
}
// src/next/domain/nextManutenzioniDomain.ts:259-261
function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}
// src/next/domain/nextManutenzioniDomain.ts:263-266
function normalizeOptionalText(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}
// src/next/domain/nextManutenzioniDomain.ts:272-281
function normalizeNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
// src/next/domain/nextManutenzioniDomain.ts:446-448
function buildHistoryTargaKey(rawTarga) {
  return normalizeNextMezzoTarga(rawTarga) || normalizeText(rawTarga).toUpperCase();
}
// src/next/domain/nextManutenzioniDomain.ts:437-441
function buildHistoryId(raw, index, mezzoTarga) {
  const id = normalizeText(raw.id);
  if (id) return id;
  return `manutenzione:${mezzoTarga}:${index}`;
}
// src/next/domain/nextManutenzioniDomain.ts:516-527
function sanitizeManutenzioneStato(value) {
  const normalized = normalizeText(value);
  if (
    normalized === "daFare" ||
    normalized === "programmata" ||
    normalized === "eseguita" ||
    normalized === "chiusa_da_evento"
  ) {
    return normalized;
  }
  return null;
}
// src/next/domain/nextManutenzioniDomain.ts:545-549
function hasLegacyExecutionFields(raw) {
  if (normalizeOptionalText(raw.dataEsecuzione)) return true;
  if (normalizeNumber(raw.km) !== null || normalizeNumber(raw.ore) !== null) return true;
  return normalizeNumber(raw.importo) !== null;
}
// src/next/domain/nextManutenzioniDomain.ts:551-558
function resolveLegacyManutenzioneStato(raw) {
  const explicitStato = sanitizeManutenzioneStato(raw.stato);
  if (explicitStato) return explicitStato;
  return hasLegacyExecutionFields(raw) ? "eseguita" : "daFare";
}
// src/next/domain/nextManutenzioniDomain.ts:696-720 (solo targa+label, per il sort)
function toMezzoOption(raw, index) {
  const targa = normalizeNextMezzoTarga(raw.targa) || normalizeText(raw.targa).toUpperCase();
  if (!targa) return null;
  const marcaModello = normalizeOptionalText(raw.marcaModello);
  const composedLabel = [normalizeText(raw.marca), normalizeText(raw.modello)]
    .filter(Boolean)
    .join(" ")
    .trim();
  const labelBase = marcaModello ?? (composedLabel || null) ?? targa;
  return {
    id: normalizeOptionalText(raw.id) ?? `mezzo:${targa}:${index}`,
    targa,
    label: labelBase && labelBase !== targa ? `${targa} - ${labelBase}` : targa,
    rawTarga: raw.targa,
  };
}
// ============================================================

function truncate(value, n) {
  const s = normalizeText(value);
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

// Replica di unwrapStorageArray + gestione esplicita stringa JSON (richiesta dal prompt).
// Ritorna { items, shape } dove shape descrive cosa è stato trovato.
function extractArray(docData) {
  if (!docData || typeof docData !== "object") {
    return { items: [], shape: "DOC_VUOTO" };
  }
  let v = docData.value;
  let shape;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
      shape = "STRINGA_JSON_PARSATA";
    } catch {
      return { items: [], shape: "STRINGA_NON_JSON" };
    }
  } else {
    shape = "value_OGGETTO/ARRAY_DIRETTO";
  }
  if (Array.isArray(v)) return { items: v, shape: shape + " -> ARRAY" };
  if (v && typeof v === "object") {
    if (Array.isArray(v.items)) return { items: v.items, shape: shape + " -> {items:[]}" };
    if (Array.isArray(v.value)) return { items: v.value, shape: shape + " -> {value:[]}" };
  }
  return { items: [], shape: shape + " -> NON_ARRAY(" + typeof v + ")" };
}

async function main() {
  out("================================================================");
  out("AUDIT FISICO FIRESTORE — Manutenzioni NEXT (STEP 2)");
  out("MODALITÀ SOLA LETTURA — nessun metodo di scrittura presente nello script");
  out("Metodi firebase-admin usati: initializeApp, credential.cert, firestore(), doc(), get()");
  out("Project: " + PROJECT_ID);
  out("================================================================");
  out("");

  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID,
  });
  const db = admin.firestore();

  const readStorageDoc = async (key) => {
    const snap = await db.collection("storage").doc(key).get();
    return { exists: snap.exists, data: snap.exists ? snap.data() : null };
  };

  // ---------- MEZZI MASTER ----------
  const mezziDoc = await readStorageDoc("@mezzi_aziendali");
  const mezziExtract = extractArray(mezziDoc.data);
  out("### SHAPE value @mezzi_aziendali: " + mezziExtract.shape + " (doc exists=" + mezziDoc.exists + ")");
  const mezziRaw = mezziExtract.items;

  const mezziOptions = mezziRaw
    .map((entry, index) => (entry && typeof entry === "object" ? toMezzoOption(entry, index) : null))
    .filter(Boolean)
    .sort((left, right) => left.label.localeCompare(right.label, "it", { sensitivity: "base" }));

  out("");
  out("================== MEZZI MASTER (ordinati per label, domain:975) ==================");
  out("Totale record fisici @mezzi_aziendali: " + mezziRaw.length);
  out("Mezzi validi (targa non vuota): " + mezziOptions.length);
  out("");
  mezziOptions.forEach((m, i) => {
    const flag = i === 0 ? "   <<==== DEFAULT FILTRO (mezzi[0]) " : "";
    out(
      `[${String(i).padStart(3)}] targaNorm=${m.targa.padEnd(10)} | targaRaw=${JSON.stringify(m.rawTarga)} | id=${m.id} | label="${m.label}"${flag}`,
    );
  });

  const mezziTargheSet = new Set(mezziOptions.map((m) => m.targa));
  const mezziLabelByTarga = new Map(mezziOptions.map((m) => [m.targa, m.label]));

  // ---------- MANUTENZIONI ----------
  const manDoc = await readStorageDoc("@manutenzioni");
  const manExtract = extractArray(manDoc.data);
  out("");
  out("### SHAPE value @manutenzioni: " + manExtract.shape + " (doc exists=" + manDoc.exists + ")");
  const manRaw = manExtract.items;

  // Normalizza ogni record fisico (mantiene l'indice fisico per buildHistoryId)
  const records = manRaw.map((entry, index) => {
    const raw = entry && typeof entry === "object" ? entry : {};
    const targaNorm = buildHistoryTargaKey(normalizeText(raw.targa));
    const id = buildHistoryId(raw, index, targaNorm);
    const statoRaw = raw.stato;
    const statoDerivato = resolveLegacyManutenzioneStato(raw);
    return {
      index,
      raw,
      id,
      targaRaw: raw.targa,
      targaNorm,
      statoRaw: statoRaw === undefined ? "(assente)" : JSON.stringify(statoRaw),
      statoDerivato,
      data: raw.data ?? null,
      dataEsecuzione: raw.dataEsecuzione ?? null,
      tipo: raw.tipo ?? null,
      sottotipo: raw.sottotipo ?? null,
      km: normalizeNumber(raw.km),
      ore: normalizeNumber(raw.ore),
      importo: normalizeNumber(raw.importo),
      sourceDocumentId: raw.sourceDocumentId ?? null,
      descrizione: raw.descrizione ?? raw.tipo ?? "",
    };
  });

  out("");
  out("================== TOTALE MANUTENZIONI FISICHE ==================");
  out("Totale record fisici @manutenzioni: " + records.length);

  // verifica somma stati
  const STATI = ["daFare", "programmata", "eseguita", "chiusa_da_evento", "altro"];
  const globalCount = { daFare: 0, programmata: 0, eseguita: 0, chiusa_da_evento: 0, altro: 0 };
  records.forEach((r) => {
    if (globalCount[r.statoDerivato] === undefined) globalCount.altro += 1;
    else globalCount[r.statoDerivato] += 1;
  });
  const sommaStati = STATI.reduce((a, k) => a + globalCount[k], 0);
  out(
    "Conteggio stati derivati GLOBALE: " +
      STATI.map((k) => `${k}=${globalCount[k]}`).join("  "),
  );
  out(`VERIFICA SOMMA: ${sommaStati} == totale ${records.length} -> ${sommaStati === records.length ? "OK" : "MISMATCH"}`);

  // group by targa norm
  const byTarga = new Map();
  records.forEach((r) => {
    if (!byTarga.has(r.targaNorm)) byTarga.set(r.targaNorm, []);
    byTarga.get(r.targaNorm).push(r);
  });

  // ---------- MANUTENZIONI PER TARGA MASTER ----------
  out("");
  out("================== MANUTENZIONI PER TARGA (un blocco per targa master) ==================");
  mezziOptions.forEach((m) => {
    const recs = byTarga.get(m.targa) ?? [];
    const c = { daFare: 0, programmata: 0, eseguita: 0, chiusa_da_evento: 0, altro: 0 };
    recs.forEach((r) => {
      if (c[r.statoDerivato] === undefined) c.altro += 1;
      else c[r.statoDerivato] += 1;
    });
    out("");
    out(`---- TARGA ${m.targa} | label="${m.label}" ----`);
    out(`   totale=${recs.length}  | ${STATI.map((k) => `${k}=${c[k]}`).join("  ")}`);
    recs.forEach((r) => {
      out(
        `   • id=${r.id} | targaRaw=${JSON.stringify(r.targaRaw)} | data=${JSON.stringify(r.data)} | dataEsec=${JSON.stringify(r.dataEsecuzione)} | statoRaw=${r.statoRaw} | statoDeriv=${r.statoDerivato} | tipo=${JSON.stringify(r.tipo)} | sottotipo=${JSON.stringify(r.sottotipo)} | km=${r.km} | ore=${r.ore} | importo=${r.importo} | srcDoc=${JSON.stringify(r.sourceDocumentId)} | descr="${truncate(r.descrizione, 80)}"`,
      );
    });
  });

  // ---------- ORFANI ----------
  out("");
  out("================== ORFANI (targa norm non presente tra i mezzi master) ==================");
  const orfani = records.filter((r) => !mezziTargheSet.has(r.targaNorm));
  out("Totale record orfani: " + orfani.length);
  // raggruppa orfani per targaNorm per leggibilità
  const orfaniByTarga = new Map();
  orfani.forEach((r) => {
    if (!orfaniByTarga.has(r.targaNorm)) orfaniByTarga.set(r.targaNorm, []);
    orfaniByTarga.get(r.targaNorm).push(r);
  });
  for (const [t, recs] of orfaniByTarga) {
    out(`-- targaNorm=${JSON.stringify(t)} (count=${recs.length})`);
    recs.forEach((r) => {
      out(
        `   • id=${r.id} | targaRaw=${JSON.stringify(r.targaRaw)} | targaNorm=${JSON.stringify(r.targaNorm)} | data=${JSON.stringify(r.data)} | statoDeriv=${r.statoDerivato} | descr="${truncate(r.descrizione, 80)}"`,
      );
    });
  }

  // ---------- DUPLICATI ----------
  out("");
  out("================== DUPLICATI (stesso id ripetuto) ==================");
  const idCount = new Map();
  records.forEach((r) => {
    const key = `${r.targaNorm}||${r.id}`;
    if (!idCount.has(key)) idCount.set(key, { count: 0, targaNorm: r.targaNorm, id: r.id });
    idCount.get(key).count += 1;
  });
  const dups = [...idCount.values()].filter((e) => e.count > 1);
  // anche duplicati globali per id puro
  const idCountGlobal = new Map();
  records.forEach((r) => idCountGlobal.set(r.id, (idCountGlobal.get(r.id) ?? 0) + 1));
  const dupsGlobal = [...idCountGlobal.entries()].filter(([, n]) => n > 1);
  out("Duplicati (targaNorm + id): " + dups.length);
  dups.forEach((e) => out(`   • targaNorm=${e.targaNorm} | id=${e.id} | occorrenze=${e.count}`));
  out("Duplicati (id puro, qualsiasi targa): " + dupsGlobal.length);
  dupsGlobal.forEach(([id, n]) => out(`   • id=${id} | occorrenze=${n}`));

  // ---------- INVENTARIO ALTRE CHIAVI (count-only) ----------
  out("");
  out("================== INVENTARIO ALTRE CHIAVI (count-only) ==================");
  const ALTRE = [
    "@inventario",
    "@materialiconsegnati",
    "@colleghi",
    "@rifornimenti",
    "@rifornimenti_autisti_tmp",
    "@officine",
    "@segnalazioni_autisti_tmp",
    "@controlli_mezzo_autisti",
    "@cambi_gomme_autisti_tmp",
    "@gomme_eventi",
    "@mezzi_foto_viste",
    "@mezzi_hotspot_mapping",
  ];
  for (const key of ALTRE) {
    const d = await readStorageDoc(key);
    if (!d.exists) {
      out(`   ${key.padEnd(32)} | esiste=NO`);
      continue;
    }
    const ex = extractArray(d.data);
    const rawValType = typeof (d.data ? d.data.value : undefined);
    out(
      `   ${key.padEnd(32)} | esiste=SI | typeofValue=${rawValType} | shape=${ex.shape} | lenArray=${Array.isArray(ex.items) ? ex.items.length : "n/a"}`,
    );
  }

  out("");
  out("================================================================");
  out("FINE AUDIT FISICO");
  out("================================================================");

  // salvataggio facoltativo
  try {
    const { writeFileSync } = await import("node:fs");
    writeFileSync(
      new URL("./output_audit_manutenzioni.txt", import.meta.url),
      LINES.join("\n"),
      "utf8",
    );
    console.log("\n[OK] Output salvato in tmp_audit/output_audit_manutenzioni.txt");
  } catch (e) {
    console.log("\n[WARN] Salvataggio output fallito:", e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRORE AUDIT:", err);
    process.exit(1);
  });
