# AUDIT HOME POST EXECUTION

## 1. Scopo audit
- Verificare in modo avversariale e solo runtime-read se `Home` dopo l'ultimo execution e davvero una copia fedele `read-only` della madre.
- Decidere il verdetto corretto senza fidarsi del report di execution.

## 2. File letti
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- `docs/audit/AUDIT_GENERALE_TOTALE_NEXT_VS_MADRE.md`
- `docs/audit/BACKLOG_HOME_EXECUTION.md`
- `docs/change-reports/2026-03-30_1958_home-next-readonly-parity.md`
- `docs/continuity-reports/2026-03-30_1958_continuity_home-next-readonly-parity.md`
- `src/next/NextHomePage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/components/NextHomeAutistiEventoModal.tsx`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/domain/nextAutistiDomain.ts`
- `src/next/nextDateFormat.ts`
- `src/pages/Home.tsx`
- `src/pages/CentroControllo.tsx`
- `src/components/AutistiEventoModal.tsx`

## 3. Verdetto iniziale atteso dal report execution
- `APERTO`
- Motivo atteso dal report precedente: la `Home` era ancora considerata non chiusa per i flussi scriventi bloccati e per il presunto residuo clone-only.

## 4. Verifica su codice reale
- FATTO VERIFICATO:
  - la route ufficiale `/next` monta `src/next/NextHomePage.tsx`, non `NextMotherPage`;
  - `NextHomePage.tsx` monta `NextCentroControlloPage.tsx` per l'utente normale;
  - non risultano mount finali di `src/pages/Home.tsx` o `src/pages/CentroControllo.tsx` nel runtime ufficiale della `Home`.
- FATTO VERIFICATO:
  - `NextCentroControlloPage.tsx` legge i dataset della Home tramite `nextCentroControlloDomain` e `nextAutistiDomain`;
  - dopo l'ultimo execution non restano piu overlay locali Home per alert, mezzi o eventi;
  - la riga extra `D03 autisti` e stata rimossa e quindi la UI non introduce piu un pannello che nella madre non esiste.
- FATTO VERIFICATO:
  - `NextHomeAutistiEventoModal.tsx` replica il modal madre come blocco read-only coerente;
  - `CREA LAVORO` e `IMPORTA IN DOSSIER` restano non operativi, ma in modo esplicito e compatibile col contratto read-only.
- FATTO VERIFICATO:
  - `Home` usa ancora localStorage per quicklinks e reminder missing, ma la madre usa gli stessi key/value e gli stessi helper di persistenza locale;
  - questo non e un gap clone-only.
- GAP REALE ANCORA PRESENTE:
  - `NextCentroControlloPage.tsx` costruisce ancora i suggerimenti autista partendo anche da `autistiSnapshot.assignments`, mentre la madre `src/pages/Home.tsx` li costruisce solo da `sessioni` e `mezzi`;
  - il comportamento e quindi piu ampio della madre e non e una copia read-only fedele al 100% sui suggerimenti autista.

## 5. Gap reali ancora presenti
- `NextCentroControlloPage.tsx` usa ancora `autistiSnapshot` per arricchire i suggerimenti autista e quindi non replica in modo stretto il criterio madre `sessioni + mezzi`.
- Questo e un gap reale di parity visibile e non una semplice differenza di contratto read-only.

## 6. Gap risolti davvero
- Eliminato il riuso di overlay clone-only locali della `Home` su alert, mezzi ed eventi.
- Eliminato il pannello extra `D03 autisti` dalla UI della `Home`.
- Riallineato il blocco `LAVORO` del modal eventi autisti alla grammatica read-only gia presente nella madre-clone.
- Riallineata la lettura autisti della `Home` alla sola fonte madre, senza segnali clone-only.

## 7. Giudizio sul blocco scritture read-only
- FATTO VERIFICATO:
  - il clone non scrive sui dati business reali;
  - i comandi che nella madre mutano dati sono ora bloccati in modo esplicito;
  - il blocco non introduce falsi positivi di parity.
- GIUDIZIO:
  - corretto e coerente col contratto read-only del clone.

## 8. Come verificare
- Aprire `/next` e confrontare la Home con la madre.
- Verificare che non esistano piu overlay locali Home attivi.
- Verificare che il modal eventi autisti mostri dettagli, PDF e foto, ma non consenta scritture reali.
- Verificare che quicklinks, reminder missing e alert state usino gli stessi key locali della madre.

## 9. Moduli / route verificati
- `Home` -> `/next`

## 10. Tabella finale

| Modulo | Route/file NEXT ufficiale | Runtime madre montato? SI/NO | Layer NEXT pulito? SI/NO/DA VERIFICARE | Parity esterna dimostrata? SI/NO/DA VERIFICARE | Stato finale | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Home | `/next` -> `src/next/NextHomePage.tsx` + `src/next/NextCentroControlloPage.tsx` | NO | SI | SI | APERTO | copia read-only quasi fedele, ma con gap ancora presente sulle suggestioni autista |

## 11. Stato finale del modulo
- `APERTO`

## 12. Motivazione finale
- `Home` e molto piu vicina alla madre e non usa piu overlay clone-only locali, ma i suggerimenti autista restano piu ampi della madre perche includono ancora `autistiSnapshot.assignments`.
- Questo gap e reale, e la parity esterna non puo essere promossa a chiusa.
- Le scritture restano bloccate correttamente, ma il modulo non e ancora una copia fedele read-only al 100%.
- Verdetto: `APERTO`
