# REPORT FIX MULTI-AGENTE FLOTTA REALE - 2026-04-30

## 1. Obiettivo
Correggere il percorso multi-agente della Chat IA NEXT che, nelle analisi argute, stava usando sottoinsiemi nati dai test E2E invece della flotta reale completa.

## 2. Evidenza iniziale
- D1 restituiva solo `2` mezzi.
- Il testo finale citava `test E2E` e `mezzi principali disponibili`.
- Il problema era sistemico: scorciatoie nei piani agenti e leakage nel livello analytics.

## 3. Punti trovati
- `src/next/chat-ia/agents/orchestrator.ts`: costante con targhe note e chiamate consumo limitate a quelle targhe.
- `src/next/chat-ia/agents/orchestrator.ts`: D8 limitata a un cantiere noto invece del dataset cantieri completo.
- `src/next/chat-ia/agents/analytics.ts`: frase utente con riferimento a test E2E e mezzi principali disponibili.
- `src/next/chat-ia/agents/analytics.ts`: fallback testuali con termini da campione/dati di test.
- `backend/internal-ai/server/internal-ai-adapter.js`: esempi prompt con targhe reali non necessarie.

## 4. Fix applicati
- D1, D5 e D7 passano prima da `list_vehicles`, poi da un'analisi fleet-wide su snapshot rifornimenti read-only.
- D8 usa lo snapshot completo attrezzature/cantieri read-only.
- Rimossi riferimenti a test, dati di esempio, mezzi principali, collection e ambiente tecnico dai prompt agenti e dall'analytics.
- Aggiunte regole esplicite nei prompt specialisti: per analisi su tutta la flotta non usare sottoinsiemi noti.
- Aggiunti test E2E di coerenza flotta e anti-leakage.

## 5. Test aggiunti o estesi
- `tests/e2e/07-coerenzaFlotta.spec.ts`
  - D1 non deve restare fissata a due targhe.
  - D5/D7 devono usare i mezzi con rifornimenti reali.
  - D8 deve usare tutti i cantieri disponibili.
  - scan statico su agenti/backend contro targhe hardcoded e leakage.
- `tests/e2e/05-domandeArgute.spec.ts`
  - aggiunte assertion anti-leakage su D1-D9.

## 6. Verifiche
- `npm run build`: OK.
- Lint mirato su agenti, backend e test toccati: OK.
- `node --check backend/internal-ai/server/internal-ai-adapter.js`: OK.
- E2E mirati `05-domandeArgute` + `07-coerenzaFlotta`: 13/13 PASS.
- Suite completa `npm run test:e2e`: 79 test PASS con 1 flaky storico recuperato al retry.

## 7. Esito
`FATTO`.

La Chat IA NEXT multi-agente non contiene piu scorciatoie hardcoded alle targhe di test nei file agenti/backend verificati. D1 non e piu vincolata a 2 mezzi e i test impediscono il ritorno di leakage tecnico nelle risposte utente.

## 8. Note residue
- Un test storico su fattura Sciurba ha avuto timeout al primo tentativo ed e passato al retry. La suite E2E ha chiuso con exit code `0`.
- Nessun reader, tool registry, madre o archivista e stato modificato.
