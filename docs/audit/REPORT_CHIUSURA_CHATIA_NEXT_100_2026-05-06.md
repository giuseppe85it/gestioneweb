# REPORT CHIUSURA CHAT IA NEXT 100% — 2026-05-06

## Stato finale

CHAT IA NEXT NON CHIUSA.

Esecuzione fermata a STEP 5 / voce #6 prima della patch boundary.

Motivo tecnico: `src/next/chat-ia/config/view.config.ts:279` contiene ancora il riferimento runtime `firestore-storage-documenti-mezzi-doc`. Rimuovere le entry deprecate dal boundary senza aggiornare quel file farebbe fallire la coerenza view config -> boundary (`chat-ia:diagnostics` T10) e lascerebbe `Ricerca360` puntata a una entry non piu' esistente.

SERVE FILE EXTRA: `src/next/chat-ia/config/view.config.ts`

Motivazione: sostituire/rimuovere il riferimento deprecato `firestore-storage-documenti-mezzi-doc`, gia' affiancato da `firestore-documenti-mezzi-root`, prima di rimuovere dal boundary le entry storage documentali storiche.

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
| #6 | SOSPESA | Patch boundary non sicura nella whitelist corrente per riferimento residuo in `view.config.ts`. |
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

## Patch non applicate

- Boundary #6: non applicata.
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

## Stato Registro/SPEC

- `docs/product/REGISTRO_COLLECTION_FIRESTORE.md`: resta BOZZA.
- `docs/product/SPEC_MOTORE_GENERICO_NEXT.md`: resta BOZZA.
- `docs/product/SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`: non modificata e non promossa.

## Commit hash

- Baseline: `28810394`
- CHECKPOINT-A: non creato.
- CHECKPOINT-B: non creato.
- Commit finale documentale: non creato.

## Prossimo intervento minimo

Autorizzare in whitelist `src/next/chat-ia/config/view.config.ts`, quindi:

1. Rimuovere da `Ricerca360.entryBoundaryIds` il riferimento `firestore-storage-documenti-mezzi-doc`.
2. Confermare che `firestore-documenti-mezzi-root` resta presente nella stessa vista.
3. Rimuovere dal boundary le tre entry deprecate:
   - `firestore-storage-documenti-generici-doc`
   - `firestore-storage-documenti-magazzino-doc`
   - `firestore-storage-documenti-mezzi-doc`
4. Rilanciare CHECKPOINT-A.

## Ultimo commit sicuro

`28810394` — `baseline pre-chiusura ChatIA NEXT 2026-05-06`
