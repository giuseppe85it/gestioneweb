// tmp_audit/auditBotola.mjs
// RICERCA FISICA "botola" — SOLA LETTURA. Nessun metodo di scrittura.
// Metodi firebase-admin usati: initializeApp, credential.cert, firestore(), collection(), doc(), get().
// Normalizzazione/derivazione stato: replicate ALLA LETTERA come in auditManutenzioniFirestore.mjs (step 2).

import admin from "firebase-admin";
import { readFileSync } from "node:fs";

const SERVICE_ACCOUNT_PATH =
  "C:\\Users\\giumi\\.firebase-keys\\gestionemanutenzione-934ef-firebase-adminsdk-fbsvc-7a0850bcd3.json";
const PROJECT_ID = "gestionemanutenzione-934ef";
const SOGLIA = "2026-06-01"; // "prima del" => < soglia

const LINES = [];
function out(s = "") {
  LINES.push(s);
  console.log(s);
}

// ---- funzioni replicate (identiche allo step 2) ----
function normalizeTextFlotta(value) {
  return typeof value === "string" ? value.trim() : "";
}
function normalizeTarga(value) {
  return normalizeTextFlotta(value).toUpperCase().replace(/\s+/g, "");
}
function normalizeNextMezzoTarga(value) {
  return normalizeTarga(value);
}
function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}
function normalizeOptionalText(value) {
  const n = normalizeText(value);
  return n || null;
}
function normalizeNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = value.replace(",", ".").trim();
    if (!n) return null;
    const p = Number(n);
    return Number.isFinite(p) ? p : null;
  }
  return null;
}
function buildHistoryTargaKey(rawTarga) {
  return normalizeNextMezzoTarga(rawTarga) || normalizeText(rawTarga).toUpperCase();
}
function buildHistoryId(raw, index, mezzoTarga) {
  const id = normalizeText(raw.id);
  if (id) return id;
  return `manutenzione:${mezzoTarga}:${index}`;
}
function sanitizeManutenzioneStato(value) {
  const n = normalizeText(value);
  if (n === "daFare" || n === "programmata" || n === "eseguita" || n === "chiusa_da_evento") return n;
  return null;
}
function hasLegacyExecutionFields(raw) {
  if (normalizeOptionalText(raw.dataEsecuzione)) return true;
  if (normalizeNumber(raw.km) !== null || normalizeNumber(raw.ore) !== null) return true;
  return normalizeNumber(raw.importo) !== null;
}
function resolveLegacyManutenzioneStato(raw) {
  const e = sanitizeManutenzioneStato(raw.stato);
  if (e) return e;
  return hasLegacyExecutionFields(raw) ? "eseguita" : "daFare";
}

// ---- helper ricerca ----
// accent-insensitive + case-insensitive
function fold(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
const NEEDLES = ["botola", "botole", "botol"];
function matchNeedle(text) {
  const f = fold(text);
  return NEEDLES.filter((n) => f.includes(n));
}

// estrae array da value (qui array diretto, ma gestisce stringa JSON per robustezza)
function extractArray(docData) {
  if (!docData || typeof docData !== "object") return { items: [], shape: "DOC_VUOTO" };
  let v = docData.value;
  let shape;
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
      shape = "STRINGA_JSON_PARSATA";
    } catch {
      return { items: [], shape: "STRINGA_NON_JSON" };
    }
  } else shape = "ARRAY_DIRETTO";
  if (Array.isArray(v)) return { items: v, shape };
  if (v && typeof v === "object") {
    if (Array.isArray(v.items)) return { items: v.items, shape: shape + "{items}" };
    if (Array.isArray(v.value)) return { items: v.value, shape: shape + "{value}" };
  }
  return { items: [], shape: shape + "_NON_ARRAY" };
}

// data parsabile? ritorna {ok, beforeSoglia|null}
function dateInfo(value) {
  if (value == null || value === "") return { ok: false, raw: value, before: null };
  if (typeof value === "number") {
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) return { ok: false, raw: value, before: null };
    return { ok: true, raw: value, before: d.getTime() < new Date(SOGLIA + "T00:00:00").getTime() };
  }
  const s = String(value).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const before = s.slice(0, 10) < SOGLIA;
    return { ok: true, raw: value, before };
  }
  const p = Date.parse(s);
  if (Number.isFinite(p)) {
    return { ok: true, raw: value, before: p < new Date(SOGLIA + "T00:00:00").getTime() };
  }
  return { ok: false, raw: value, before: null };
}

// scansiona TUTTE le proprietà stringa (ricorsivo: oggetti annidati + array come materiali[])
function scanStringFields(obj, path, found, counter) {
  if (obj == null) return;
  if (typeof obj === "string") {
    counter.n += 1;
    const hits = matchNeedle(obj);
    if (hits.length) found.push({ path, value: obj, needles: hits });
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => scanStringFields(v, `${path}[${i}]`, found, counter));
    return;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      scanStringFields(v, path ? `${path}.${k}` : k, found, counter);
    }
  }
}

async function main() {
  out("================================================================");
  out("RICERCA FISICA \"botola\" — Firestore reale (STEP 3)");
  out("MODALITÀ SOLA LETTURA — nessun metodo di scrittura");
  out("Metodi firebase-admin usati: initializeApp, credential.cert, firestore(), collection(), doc(), get()");
  out("Project: " + PROJECT_ID + " | soglia 'prima del' = " + SOGLIA);
  out("Needles (fold case+accent): " + JSON.stringify(NEEDLES));
  out("================================================================");

  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: PROJECT_ID });
  const db = admin.firestore();

  const readDoc = async (key) => {
    const snap = await db.collection("storage").doc(key).get();
    return { exists: snap.exists, data: snap.exists ? snap.data() : null };
  };

  const [manD, mezziD, segnD, contrD] = await Promise.all([
    readDoc("@manutenzioni"),
    readDoc("@mezzi_aziendali"),
    readDoc("@segnalazioni_autisti_tmp"),
    readDoc("@controlli_mezzo_autisti"),
  ]);

  const man = extractArray(manD.data);
  const mezzi = extractArray(mezziD.data);
  const segn = extractArray(segnD.data);
  const contr = extractArray(contrD.data);

  // label mezzo per targaNorm
  const labelByTarga = new Map();
  mezzi.items.forEach((m) => {
    if (!m || typeof m !== "object") return;
    const t = normalizeNextMezzoTarga(m.targa) || normalizeText(m.targa).toUpperCase();
    if (!t) return;
    const marcaModello = normalizeOptionalText(m.marcaModello);
    const composed = [normalizeText(m.marca), normalizeText(m.modello)].filter(Boolean).join(" ").trim();
    const base = marcaModello ?? (composed || null) ?? t;
    labelByTarga.set(t, base && base !== t ? `${t} - ${base}` : t);
  });

  // ---- record manutenzioni normalizzati ----
  const records = man.items.map((entry, index) => {
    const raw = entry && typeof entry === "object" ? entry : {};
    const targaNorm = buildHistoryTargaKey(normalizeText(raw.targa));
    return {
      index,
      raw,
      id: buildHistoryId(raw, index, targaNorm),
      targaRaw: raw.targa,
      targaNorm,
      statoDerivato: resolveLegacyManutenzioneStato(raw),
    };
  });

  out("");
  out("### Record @manutenzioni scansionati: " + records.length + " (atteso 85) | shape value=" + man.shape);
  out("### @segnalazioni_autisti_tmp: " + segn.items.length + " record | @controlli_mezzo_autisti: " + contr.items.length + " record");

  // =========================================================
  // 3. DUMP COMPLETO TI285195
  // =========================================================
  const T = normalizeNextMezzoTarga("TI285195");
  out("");
  out("================== DUMP COMPLETO TI285195 (targaNorm=" + T + ") ==================");
  const t285 = records.filter((r) => r.targaNorm === T);
  out("Record con targaNorm == " + T + ": " + t285.length);
  t285.forEach((r, i) => {
    const raw = r.raw;
    out("");
    out(`--- [${i}] id=${r.id} ---`);
    out(`   targaRaw=${JSON.stringify(raw.targa)} | targaNorm=${r.targaNorm}`);
    out(`   data=${JSON.stringify(raw.data)} | dataEsecuzione=${JSON.stringify(raw.dataEsecuzione)}`);
    out(`   statoRaw=${JSON.stringify(raw.stato)} | statoDerivato=${r.statoDerivato}`);
    out(`   tipo=${JSON.stringify(raw.tipo)} | sottotipo=${JSON.stringify(raw.sottotipo)}`);
    out(`   km=${JSON.stringify(raw.km)} | ore=${JSON.stringify(raw.ore)} | importo=${JSON.stringify(raw.importo)}`);
    out(`   fornitore=${JSON.stringify(raw.fornitore)} | eseguito=${JSON.stringify(raw.eseguito)} | eseguitoDa=${JSON.stringify(raw.eseguitoDa)}`);
    out(`   origineTipo=${JSON.stringify(raw.origineTipo)} | origineRefId=${JSON.stringify(raw.origineRefId)} | origineRefKey=${JSON.stringify(raw.origineRefKey)} | segnalatoDa=${JSON.stringify(raw.segnalatoDa)}`);
    out(`   sourceDocumentId=${JSON.stringify(raw.sourceDocumentId)} | chiusuraDi=${JSON.stringify(raw.chiusuraDi)} | chiusuraRefId=${JSON.stringify(raw.chiusuraRefId)} | chiusuraData=${JSON.stringify(raw.chiusuraData)}`);
    out(`   gommeInterventoTipo=${JSON.stringify(raw.gommeInterventoTipo)} | assiCoinvolti=${JSON.stringify(raw.assiCoinvolti)}`);
    out(`   descrizione (per esteso):`);
    out("   >>> " + String(raw.descrizione ?? "").replace(/\n/g, "\n   >>> "));
    out(`   materiali=${JSON.stringify(raw.materiali ?? null)}`);
    out(`   note=${JSON.stringify(raw.note ?? null)}`);
    const otherKeys = Object.keys(raw).filter(
      (k) => ![
        "targa","data","dataEsecuzione","stato","tipo","sottotipo","km","ore","importo",
        "fornitore","eseguito","eseguitoDa","origineTipo","origineRefId","origineRefKey",
        "segnalatoDa","sourceDocumentId","chiusuraDi","chiusuraRefId","chiusuraData",
        "gommeInterventoTipo","assiCoinvolti","descrizione","materiali","note","id",
      ].includes(k),
    );
    if (otherKeys.length) out(`   ALTRI CAMPI: ${otherKeys.map((k) => `${k}=${JSON.stringify(raw[k])}`).join(" | ")}`);
  });

  // =========================================================
  // 4. RICERCA CROSS-TARGA "botola" in @manutenzioni
  // =========================================================
  out("");
  out("================== MATCH BOTOLA IN @manutenzioni (cross-targa, tutti i campi) ==================");
  let totalStringFields = 0;
  const manMatches = [];
  records.forEach((r) => {
    const found = [];
    const counter = { n: 0 };
    scanStringFields(r.raw, "", found, counter);
    totalStringFields += counter.n;
    if (found.length) manMatches.push({ r, found, fieldsScanned: counter.n });
  });
  out("Proprietà stringa totali ispezionate su @manutenzioni: " + totalStringFields + " (media/record=" + (totalStringFields / (records.length || 1)).toFixed(1) + ")");
  if (manMatches.length === 0) {
    out(">>> NESSUN MATCH 'botola/botole/botol' in @manutenzioni <<<");
  } else {
    out("Totale record con match: " + manMatches.length);
    manMatches.forEach(({ r, found }) => {
      const di = dateInfo(r.raw.data);
      const de = dateInfo(r.raw.dataEsecuzione);
      out("");
      out(`• id=${r.id} | targaRaw=${JSON.stringify(r.targaRaw)} | targaNorm=${r.targaNorm} | label=${JSON.stringify(labelByTarga.get(r.targaNorm) ?? "(targa non in master)")}`);
      out(`  data=${JSON.stringify(r.raw.data)} | dataEsecuzione=${JSON.stringify(r.raw.dataEsecuzione)} | statoDerivato=${r.statoDerivato} | importo=${JSON.stringify(r.raw.importo)} | sourceDocumentId=${JSON.stringify(r.raw.sourceDocumentId)}`);
      found.forEach((f) => {
        out(`  ↳ campo "${f.path}" [${f.needles.join(",")}]: ${JSON.stringify(f.value)}`);
      });
      out(`  SOGLIA<${SOGLIA}: data->${di.ok ? (di.before ? "SÌ" : "NO") : "NON_PARSABILE"} | dataEsecuzione->${de.ok ? (de.before ? "SÌ" : "NO") : "NON_PARSABILE/ASSENTE"}`);
      out(`  VISIBILITÀ: comparirebbe sotto filtro targa = ${r.targaNorm}${r.targaNorm !== T ? `  >>> RECORD PRESENTE MA SOTTO ALTRA TARGA: ${r.targaNorm} <<<` : "  (== TI285195)"}`);
    });
  }

  // =========================================================
  // 5. RICERCA "botola" NELLE ORIGINI
  // =========================================================
  const scanOrigine = (label, arr) => {
    out("");
    out(`---- ${label} (${arr.length} record) ----`);
    let fields = 0;
    const matches = [];
    arr.forEach((entry, index) => {
      const raw = entry && typeof entry === "object" ? entry : {};
      const found = [];
      const counter = { n: 0 };
      scanStringFields(raw, "", found, counter);
      fields += counter.n;
      if (found.length) matches.push({ raw, index, found });
    });
    out("Proprietà stringa ispezionate: " + fields);
    if (matches.length === 0) {
      out(">>> NESSUN MATCH in " + label + " <<<");
      return;
    }
    matches.forEach(({ raw, index, found }) => {
      const dataCand = raw.data ?? raw.createdAt ?? raw.timestamp ?? raw.date ?? null;
      const di = dateInfo(dataCand);
      out("");
      out(`• id=${JSON.stringify(raw.id ?? `idx:${index}`)} | targa=${JSON.stringify(raw.targa ?? raw.targaCamion ?? raw.targaMotrice ?? null)}`);
      out(`  dataCandidata=${JSON.stringify(dataCand)} | SOGLIA<${SOGLIA}: ${di.ok ? (di.before ? "SÌ" : "NO") : "NON_PARSABILE"}`);
      out(`  chiusura: chiusuraDi=${JSON.stringify(raw.chiusuraDi ?? null)} | chiusuraRefId=${JSON.stringify(raw.chiusuraRefId ?? null)} | chiusuraData=${JSON.stringify(raw.chiusuraData ?? null)} | stato=${JSON.stringify(raw.stato ?? null)} | presaInCarico=${JSON.stringify(raw.presaInCarico ?? null)}`);
      found.forEach((f) => out(`  ↳ campo "${f.path}" [${f.needles.join(",")}]: ${JSON.stringify(f.value)}`));
    });
  };
  out("");
  out("================== MATCH BOTOLA NELLE ORIGINI ==================");
  scanOrigine("@segnalazioni_autisti_tmp", segn.items);
  scanOrigine("@controlli_mezzo_autisti", contr.items);

  out("");
  out("================================================================");
  out("FINE RICERCA");
  out("================================================================");

  try {
    const { writeFileSync } = await import("node:fs");
    writeFileSync(new URL("./output_audit_botola.txt", import.meta.url), LINES.join("\n"), "utf8");
    console.log("\n[OK] Output salvato in tmp_audit/output_audit_botola.txt");
  } catch (e) {
    console.log("\n[WARN] Salvataggio fallito:", e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERRORE:", err);
    process.exit(1);
  });
