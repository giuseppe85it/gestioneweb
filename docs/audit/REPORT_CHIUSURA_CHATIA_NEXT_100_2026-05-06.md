# REPORT CHIUSURA CHAT IA NEXT 100% — 2026-05-06

## Stato finale

CHAT IA NEXT NON CHIUSA — esecuzione ripresa da STEP 5 / voce #6.

Stato corrente del report: #6 chiusa con patch e CHECKPOINT-A PASS. #10, #12, #13 restano non chiuse finche' non passano i checkpoint successivi.

## Baseline

- Commit baseline pre-chiusura: `28810394`
- Comando baseline `npm run build`: PASS
- Comando baseline `npm run chat-ia:diagnostics`: PASS T1..T28
- Comando baseline Playwright 17-21: PASS 10/10

## Stato voci matrice

| Voce | Stato | Motivo |
|---|---|---|
| #1 | CHIUSA_DOCUMENTAZIONE | `driver360.css` esiste ed e' importato da `Driver360.tsx`; marker chiuso nel piano. |
| #2 | NON_RICHIESTA_V1 | `Refueling360`, `Maintenance360`, `Search360` formalizzati come alias/funzioni dentro viste V1 esistenti. |
| #3 | CHIUSA_DOCUMENTAZIONE | Regola ordinamento default formalizzata nel Registro: `updatedAt`, `timestamp`, `createdAt`, poi cap deterministico. |
| #4 | CHIUSA_DOCUMENTAZIONE | Decisione prodotto Opzione A formalizzata: nessuna `@cantieri`; `Site360` aggrega fonti esistenti. |
| #5 | CHIUSA_DOCUMENTAZIONE | `@officine` formalizzata come entry collegata a manutenzioni/Vehicle360, non vista autonoma. |
| #6 | CHIUSA_PATCH | `view.config.ts` riallineato alle root documentali e tre entry boundary storage deprecate rimosse; CHECKPOINT-A PASS. |
| #7 | CHIUSA_DOCUMENTAZIONE | Mapping writer/root documentali -> `allowedFields` formalizzato nel Registro. |
| #8 | CHIUSA_DOCUMENTAZIONE | Comando normalizzato con `rg` e fallback PowerShell esplicito. |
| #9 | CHIUSA_DOCUMENTAZIONE | `relation.config.cjs` formalizzato come proiezione backend machine-readable. |
| #10 | SOSPESA | STEP 6 non eseguito per stop su #6. |
| #11 | CHIUSA_DOCUMENTAZIONE | Script `chat-ia:diagnostics` formalizzato come presente e funzionante. |
| #12 | SOSPESA | Promozione Registro/SPEC non eseguita: #6 e #10 non chiuse. |
| #13 | SOSPESA | STEP 7 non eseguito per stop su #6; `tests/e2e/15-vehicle360.spec.ts` non modificato. |

## File toccati in questa ripresa

- `docs/product/PIANO_ESECUTIVO_CHAT_IA_NEXT.md`
- `docs/product/REGISTRO_COLLECTION_FIRESTORE.md`
- `docs/product/SPEC_MOTORE_GENERICO_NEXT.md`
- `docs/audit/REPORT_CHIUSURA_CHATIA_NEXT_100_2026-05-06.md`
- `src/next/chat-ia/config/view.config.ts`
- `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`

## Patch non applicate

- Boundary #6: patch applicata e CHECKPOINT-A PASS.
- Driver360 #10: non eseguita.
- Promozione Registro/SPEC: non eseguita.
- Aggiornamento live docs: non eseguito per stop prima della chiusura.

## Verifiche eseguite

- `git status`, `git status --short`: eseguiti.
- Baseline `npm run build`: PASS.
- Baseline `npm run chat-ia:diagnostics`: PASS T1..T28.
- Baseline Playwright 17-21: PASS 10/10.
- Ricerca #6:
  - `rg "firestore-storage-documenti-generici-doc|firestore-storage-documenti-magazzino-doc|firestore-storage-documenti-mezzi-doc" backend src tests package.json docs/product docs/audit`
  - esito bloccante: `src/next/chat-ia/config/view.config.ts:279` usa `firestore-storage-documenti-mezzi-doc`.
- Ripresa #6:
  - `src/next/chat-ia/config/view.config.ts`: rimossa una occorrenza runtime deprecata da `Ricerca360.entryBoundaryIds`; `firestore-documenti-mezzi-root` resta presente nella stessa vista.
  - `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`: rimosse le tre entry deprecate storage documentali.
- CHECKPOINT-A:
  - `node --check backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`: PASS.
  - `npm run build`: PASS.
  - `npm run chat-ia:diagnostics`: PASS T1..T28.
  - Playwright 17-21: PASS 10/10.

## Chiusura #6 — Mappa ID

| ID deprecato | ID root sostitutivo |
|---|---|
| `firestore-storage-documenti-generici-doc` | `firestore-documenti-generici-root` |
| `firestore-storage-documenti-magazzino-doc` | `firestore-documenti-magazzino-root` |
| `firestore-storage-documenti-mezzi-doc` | `firestore-documenti-mezzi-root` |

- Riga `view.config.ts` modificata: vecchia riga 279, `Ricerca360.entryBoundaryIds`.
- Occorrenze sostituite/rimosse in `view.config.ts`: 1.
- Entry boundary rimosse: 3.
- Nessun writer modificato. Nessun dato Firestore reale modificato.

## Stato Registro/SPEC

- `docs/product/REGISTRO_COLLECTION_FIRESTORE.md`: resta BOZZA.
- `docs/product/SPEC_MOTORE_GENERICO_NEXT.md`: resta BOZZA.
- `docs/product/SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`: non modificata e non promossa.

## Commit hash

- Baseline: `28810394`
- CHECKPOINT-DOC: `decb5cf9`
- CHECKPOINT-A: da creare nel commit `chiusura #6 — rimozione entry boundary deprecate`.
- CHECKPOINT-B: non creato.
- Commit finale documentale: non creato.

## Prossimo intervento minimo

Procedere a STEP 6 / voce #10: verificare se `Driver360.tsx` puo' consumare relationProof gia' prodotta dal backend senza file extra. Se non e' possibile dentro whitelist, fermarsi con `BLOCCO #10 NON CHIUDIBILE NELLA WHITELIST` o `SERVE FILE EXTRA: <path>`.

## Ultimo commit sicuro

`28810394` — `baseline pre-chiusura ChatIA NEXT 2026-05-06`
