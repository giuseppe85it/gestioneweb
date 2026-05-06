# REPORT TEST E2E CHAT IA NEXT - 2026-04-29

## INTRO
Obiettivo: introdurre una suite E2E automatica per `/next/chat-tool`, con browser Playwright, backend riavviabile via Nodemon e ciclo test/fix sui bug emersi.

Esito finale: suite completa eseguita con 62 test, 62 pass.

## INFRASTRUTTURA
- Nodemon configurato con `nodemon.json`.
- Script aggiunti: `backend:dev`, `test:e2e`, `test:e2e:headed`.
- Playwright configurato in `playwright.config.ts` con Chromium headless, timeout 120s, retry 1, worker singolo e trace su failure.
- Helper chat in `tests/e2e/helpers/chatHelpers.ts`: apertura `/next/chat-tool`, proxy backend `4310`, invio prompt, lettura ultimo messaggio, metriche NDJSON.
- Helper Firestore in `tests/e2e/helpers/firestoreHelpers.ts`: lettura diretta Firebase client per dati di confronto, incluse collection documentali reali.

## TEST VERITA DI BASE
10/10 PASS.

Coperti:
- telaio `ZA9 S35 A48 BAH 028 00` -> `TI282780`;
- scheda `TI282780`, autista `SANDRO CALABRESE`, revisione `09/04/2027`;
- fattura Sciurba Autotruck snc n. 81 per `TI113417`, importo `1641.28`, data `31/03/2026`;
- cantiere `GTL PALAZZETTO`;
- rifornimenti `TI233827` e `TI298409`;
- manutenzioni aprile 2026 senza timeout;
- date italiane non invertite.

## TEST VERITA CALCOLATA
10/10 PASS dopo fix helper E2E.

Prima esecuzione: 8/10 PASS, 2 FAIL per helper Firestore che leggeva solo `storage/@documenti_mezzi` e `storage/@costiMezzo`.

Fix: `getFattureByTarga()` ora legge anche collection `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, `@costiMezzo`; `sumCostiMezzo()` include alias importo aggiuntivi.

## TEST INCROCI
30/30 PASS.

Coperti: mezzi, autisti, manutenzioni, lavori, rifornimenti, documenti/fatture, eventi, cisterna, materiali, costi, attrezzature, fornitori, officine, Euromecc e incroci multi-dominio.

## TEST EDGE CASES
12/12 PASS.

Coperti: targa minuscola/spaziata, telaio senza spazi, periodo relativo, ultime settimane, risposta vuota attesa, multi-tool, date bordo mese, identita, data corrente, parametri opzionali vuoti.

## BUG SCOPERTI E FIXATI
1. Data revisione invertita nei tool mezzo.
   - Causa: campi flotta legacy gia normalizzati a ISO dopo parsing DD/MM ambiguo.
   - Fix: `formatItalianDateFromItalianSource()` in `chatIaToolDates.ts` e uso nei tool mezzo.

2. Timeout post-tool su output finali strutturati.
   - Causa: nella seconda chiamata OpenAI il backend rimandava 58 tool e lo schema table obbligava decine di campi null per ogni riga.
   - Fix: finalizzazione con `tool_choice: "none"` e senza `tools`; schema table compatto con colonne `c1`-`c8`; prompt aggiornato per tabelle brevi.

3. Output lunghi su liste.
   - Causa: alcuni tool accettavano `limit:100` prodotto dal modello e restituivano liste troppo ampie.
   - Fix: limiti piu stretti su `search_maintenances`, `list_drivers`, `get_refuelings` e record compatti.

4. Verita calcolata fatture/costi non trovava dati reali.
   - Causa: helper E2E leggeva solo storage document, mentre i tool leggono anche collection documentali.
   - Fix: helper Firestore E2E allineato alle collection reali usate dai reader.

## BUG RESIDUI BLOCCATI
Nessun bug E2E bloccato nella suite finale.

Rischio residuo: alcuni test sono prestazionalmente vicini alla soglia, in particolare `cisterna snapshot` circa 50.5s e `rifornimenti TI233827` circa 45.7s. Sono passati, ma restano candidati a ulteriore ottimizzazione se il provider rallenta.

## METRICHE
- Suite finale: 62 PASS / 0 FAIL.
- Durata suite finale: 18.8 minuti.
- Durata media test Playwright: 16.9s.
- Durata media chat su ultime 62 metriche: 14.0s.
- Durata media prompt semplice: 12.8s.
- Durata media prompt multi-tool/periodo: 16.4s.
- Success rate finale: 100%.

## COMANDI VERIFICA
- `npm run test:e2e` -> PASS 62/62.
- `npm run build` -> PASS.
- `npx eslint <file toccati>` -> PASS.
- `npm run lint` globale -> FAIL per baseline storico fuori perimetro, non introdotto da questa patch.

## RACCOMANDAZIONI
- Tenere `npm run backend:dev` come comando standard durante debug Chat IA NEXT.
- Usare `npm run test:e2e` prima di modifiche ai tool registry o al prompt backend.
- Se i test cisterna/rifornimenti tornano sopra timeout, compattare ulteriormente i rispettivi tool prima di aumentare timeout UI.
