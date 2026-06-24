#!/usr/bin/env node
/**
 * Sentinella date - gestioneweb
 *
 * COSA FA: cerca le letture di date fatte con la "scorciatoia pericolosa"
 * Date.parse() su una VARIABILE, fuori dal punto unico src/next/helpers/dateUnica.ts.
 *
 * PERCHE': Date.parse() interpreta le date all'americana (mm/gg), quindi una
 * data scritta "10/05/2026" (10 maggio) viene letta come 5 ottobre. Il modo
 * corretto e' usare parseAnyDate() di src/next/helpers/dateUnica.ts, che legge
 * gg/mm all'europea.
 *
 * NON segnala (casi non ambigui / non runtime):
 *   - i file di test (__tests__, *.test.*, *.spec.*);
 *   - Date.parse("aaaa-mm-gg...") su stringa ISO letterale (non ambigua);
 *   - il punto unico dateUnica.ts.
 *
 * USO:   node scripts/sentinelle/sentinella-date.cjs
 * ESITO: exit 0 = pulito | exit 1 = trovati punti pericolosi (per bloccare il salvataggio).
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
// Cartelle dei moduli vivi (NEXT) dove le date devono passare dal punto unico:
const DIRS = ['src/next', 'src/autistiInbox'];
const EXT = new Set(['.ts', '.tsx']);
// File autorizzati a gestire le date a basso livello (il punto unico):
const ESCLUSI = new Set([
  path.normalize('src/next/helpers/dateUnica.ts'),
]);

const DATEPARSE = /Date\.parse\s*\(/;
// Date.parse su stringa ISO letterale (aaaa-mm-gg...) NON e' ambigua: e' sicura.
const ISO_SICURO = /Date\.parse\s*\(\s*["'`]\d{4}-\d{2}-\d{2}/;

function isTest(rel) {
  return /(__tests__|\.test\.|\.spec\.)/.test(rel.replace(/\\/g, '/'));
}

const hits = [];
let ignoratiSicuri = 0;
let ignoratiTest = 0;

function scan(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) { scan(rel); continue; }
    if (!EXT.has(path.extname(entry.name))) continue;
    if (ESCLUSI.has(path.normalize(rel))) continue;
    const fileTest = isTest(rel);
    const righe = fs.readFileSync(path.join(ROOT, rel), 'utf8').split(/\r?\n/);
    righe.forEach((testo, i) => {
      if (!DATEPARSE.test(testo)) return;
      if (fileTest) { ignoratiTest++; return; }
      if (ISO_SICURO.test(testo)) { ignoratiSicuri++; return; }
      hits.push({ file: rel.replace(/\\/g, '/'), riga: i + 1, testo: testo.trim() });
    });
  }
}

console.log('\n  Sentinella date - cerco letture di date con la scorciatoia pericolosa (Date.parse)');
console.log('  fuori dal punto unico src/next/helpers/dateUnica.ts');
console.log('  (ignoro i file di test e i casi su date ISO aaaa-mm-gg, che non sono ambigui)\n');

DIRS.forEach(scan);

if (hits.length === 0) {
  console.log('  OK - Pulito: nessun punto pericoloso. (ignorati ' + ignoratiSicuri + ' casi ISO sicuri, ' + ignoratiTest + ' nei test)\n');
  process.exit(0);
}

for (const h of hits) {
  console.log('  ' + h.file + ':' + h.riga);
  console.log('     ' + h.testo);
}
console.log('\n  ATTENZIONE - ' + hits.length + ' punti leggono una data da una variabile con Date.parse (rischio giorno/mese scambiato).');
console.log('  Ignorati come sicuri: ' + ignoratiSicuri + ' casi su date ISO, ' + ignoratiTest + ' nei file di test.');
console.log('  Cura: farli passare da parseAnyDate() di src/next/helpers/dateUnica.ts.\n');
process.exit(1);
