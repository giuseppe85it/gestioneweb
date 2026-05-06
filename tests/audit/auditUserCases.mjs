/**
 * Audit casi utente (T5):
 *   - rifornimenti TI324633 aprile 2026
 *   - manutenzioni aprile 2026
 *   - duplicate cross-collection rifornimenti
 *   - libretti vs mezzi (gap mezzi senza libretto persistito)
 *
 * SOLO LETTURA. Output: tests/audit/output/user-cases.json
 */

import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { collection, doc, getDoc, getDocs, getFirestore } from "firebase/firestore";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const firebaseConfig = {
  apiKey: "AIzaSyD5UVGv-sdjYQnLrva35EQLYxxhjWNGMV4",
  authDomain: "gestionemanutenzione-934ef.firebaseapp.com",
  databaseURL: "https://gestionemanutenzione-934ef-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gestionemanutenzione-934ef",
  storageBucket: "gestionemanutenzione-934ef.firebasestorage.app",
  messagingSenderId: "716845762405",
  appId: "1:716845762405:web:1db7e030d07aaf5ac3e326",
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function parseDate(v) {
  if (!v) return null;
  if (typeof v === "object" && typeof v.toDate === "function") return v.toDate();
  if (typeof v === "object" && typeof v.seconds === "number") return new Date(v.seconds * 1000);
  if (typeof v === "string") {
    const iso = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    const ita = v.match(/^(\d{1,2})[/.\s-](\d{1,2})[/.\s-](\d{4})/);
    if (ita) return new Date(Number(ita[3]), Number(ita[2]) - 1, Number(ita[1]));
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function readStorage(key) {
  return getDoc(doc(db, "storage", key)).then((s) => {
    if (!s.exists()) return [];
    const d = s.data();
    if (Array.isArray(d.items)) return d.items;
    if (d.value && Array.isArray(d.value.items)) return d.value.items;
    if (Array.isArray(d.value)) return d.value;
    return [];
  });
}

function readCollection(name) {
  return getDocs(collection(db, name)).then((s) => s.docs.map((d) => ({ id: d.id, ...d.data() })));
}

function inApril2026(v) {
  const d = parseDate(v);
  if (!d) return false;
  return d.getFullYear() === 2026 && d.getMonth() === 3; // April = 3
}

async function main() {
  await signInAnonymously(auth);
  const targa = "TI324633";
  const out = {};

  // === CASO 1: rifornimenti TI324633 aprile 2026 ===
  const rifBase = await readStorage("@rifornimenti");
  const rifAutisti = await readStorage("@rifornimenti_autisti_tmp");
  const targaTI = (item) => {
    const fields = [item.targa, item.mezzoTarga, item.targaCamion, item.targaRimorchio]
      .filter((v) => typeof v === "string");
    return fields.some((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").includes(targa));
  };
  const rifBaseTarga = rifBase.filter(targaTI);
  const rifAutistiTarga = rifAutisti.filter(targaTI);
  const rifBaseTargaApril = rifBaseTarga.filter((it) => inApril2026(it.data));
  const rifAutistiTargaApril = rifAutistiTarga.filter((it) => inApril2026(it.data));

  out.case1_rifornimenti_TI324633 = {
    storage_rifornimenti_total: rifBase.length,
    storage_rifornimenti_autisti_tmp_total: rifAutisti.length,
    targa: targa,
    rifornimenti_targa_total: rifBaseTarga.length,
    rifornimenti_targa_april2026: rifBaseTargaApril.length,
    rifornimenti_autisti_targa_total: rifAutistiTarga.length,
    rifornimenti_autisti_targa_april2026: rifAutistiTargaApril.length,
    union_april2026_naive: rifBaseTargaApril.length + rifAutistiTargaApril.length,
    sample_rifornimenti: rifBaseTargaApril.slice(0, 3).map((it) => ({
      id: it.id, data: it.data, distributore: it.distributore, litri: it.litri, km: it.km,
    })),
    sample_rifornimenti_autisti: rifAutistiTargaApril.slice(0, 3).map((it) => ({
      id: it.id, data: it.data, paese: it.paese, litri: it.litri, km: it.km,
      autistaNome: it.autistaNome, badgeAutista: it.badgeAutista, metodoPagamento: it.metodoPagamento,
    })),
  };

  // dedup: cerco match per (data + km + litri) cross-collection
  const dups = [];
  for (const a of rifBaseTargaApril) {
    for (const b of rifAutistiTargaApril) {
      if (Math.abs(Number(a.km) - Number(b.km)) <= 1 && Math.abs(Number(a.litri) - Number(b.litri)) <= 1) {
        dups.push({ baseId: a.id, autoId: b.id, dataA: a.data, dataB: b.data, litriA: a.litri, litriB: b.litri });
      }
    }
  }
  out.case1_rifornimenti_TI324633.cross_collection_duplicate_pairs = dups.length;
  out.case1_rifornimenti_TI324633.cross_collection_duplicate_examples = dups.slice(0, 5);

  // === CASO 2: manutenzioni aprile 2026 ===
  const manut = await readStorage("@manutenzioni");
  const manutApril = manut.filter((it) => inApril2026(it.data));
  const manutByTipo = manutApril.reduce((acc, it) => {
    const k = it.tipo || "(no tipo)";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
  const manutEseguite = manutApril.filter((it) => it.eseguito === true || it.eseguito === "true");
  out.case2_manutenzioni_april = {
    total_manutenzioni: manut.length,
    april2026: manutApril.length,
    by_tipo: manutByTipo,
    eseguite_count: manutEseguite.length,
    sample: manutApril.slice(0, 5).map((it) => ({
      id: it.id, targa: it.targa, tipo: it.tipo, eseguito: it.eseguito, data: it.data,
      descrizione: typeof it.descrizione === "string" ? it.descrizione.slice(0, 60) : it.descrizione,
    })),
  };

  // === CASO 3: motrici (gap categoria vs tipo) ===
  const mezzi = await readStorage("@mezzi_aziendali");
  const motriciByCategoria = mezzi.filter((m) => typeof m.categoria === "string" && m.categoria.toLowerCase().includes("motrice"));
  const motriciByTipo = mezzi.filter((m) => typeof m.tipo === "string" && m.tipo.toLowerCase().includes("motrice"));
  const trattori = mezzi.filter((m) => typeof m.categoria === "string" && m.categoria.toLowerCase().includes("trattore"));
  out.case3_motrici = {
    total_mezzi: mezzi.length,
    by_categoria_contains_motrice: motriciByCategoria.length,
    by_tipo_contains_motrice: motriciByTipo.length,
    by_categoria_contains_trattore: trattori.length,
    diff_tipo_vs_categoria: {
      // mezzi con tipo=motrice ma categoria NON contiene motrice
      tipo_motrice_categoria_diversa: motriciByTipo.filter((m) =>
        !(typeof m.categoria === "string" && m.categoria.toLowerCase().includes("motrice")),
      ).map((m) => ({ targa: m.targa, tipo: m.tipo, categoria: m.categoria })),
    },
    categoria_distinct: Array.from(new Set(mezzi.map((m) => m.categoria).filter(Boolean))),
    tipo_distinct: Array.from(new Set(mezzi.map((m) => m.tipo).filter(Boolean))),
  };

  // === CASO 4: libretti vs mezzi ===
  const docMezzi = await readCollection("@documenti_mezzi");
  const libretti = docMezzi.filter((d) => typeof d.tipoDocumento === "string" && d.tipoDocumento.toLowerCase() === "libretto");
  const targheConLibrettoArchivio = new Set(libretti.map((d) => d.targa).filter(Boolean));
  const targheConLibrettoUrl = mezzi.filter((m) => m.librettoUrl).map((m) => m.targa);
  out.case4_libretti = {
    total_documenti_mezzi_collection: docMezzi.length,
    libretti_in_archivio: libretti.length,
    targhe_con_libretto_in_archivio: Array.from(targheConLibrettoArchivio),
    mezzi_con_librettoUrl: targheConLibrettoUrl.length,
    mezzi_senza_librettoUrl: mezzi.filter((m) => !m.librettoUrl).length,
    sovrapposizione: targheConLibrettoUrl.filter((t) => targheConLibrettoArchivio.has(t)).length,
  };

  // === CASO 5: documenti_mezzi tipoDocumento normalization ===
  const tipiNorm = {};
  for (const d of docMezzi) {
    const t = (d.tipoDocumento || "").toString();
    const norm = t.toLowerCase().trim();
    tipiNorm[norm] = tipiNorm[norm] || { count: 0, raw_variants: new Set() };
    tipiNorm[norm].count += 1;
    tipiNorm[norm].raw_variants.add(t);
  }
  out.case5_normalizzazione_tipoDocumento = Object.fromEntries(
    Object.entries(tipiNorm).map(([k, v]) => [k, { count: v.count, raw_variants: Array.from(v.raw_variants) }]),
  );

  // === CASO 6: lavori — distribuzione stato/eseguito ===
  const lavori = await readStorage("@lavori");
  const eseguiti = lavori.filter((l) => l.eseguito === true);
  const inAttesa = lavori.filter((l) => l.eseguito === false || l.eseguito === undefined || l.eseguito === null);
  out.case6_lavori = {
    total: lavori.length,
    eseguiti: eseguiti.length,
    in_attesa: inAttesa.length,
    urgenze: lavori.reduce((acc, l) => { acc[l.urgenza || "(none)"] = (acc[l.urgenza || "(none)"] || 0) + 1; return acc; }, {}),
  };

  // === CASO 7: euromecc completati ===
  const euromecc_done = await readCollection("euromecc_done");
  const euromecc_pending = await readCollection("euromecc_pending");
  out.case7_euromecc = {
    pending: euromecc_pending.length,
    done: euromecc_done.length,
    sample_done: euromecc_done.slice(0, 3).map((d) => ({
      id: d.id, targa: d.targa, area: d.area, descrizione: typeof d.descrizione === "string" ? d.descrizione.slice(0, 60) : d.descrizione,
    })),
  };

  const outDir = resolve(__dirname, "output");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, "user-cases.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
