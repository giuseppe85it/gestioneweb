# CHANGE REPORT — Rimozione 4 stub Archivista NEXT

## 1. Titolo intervento
Rimozione dead code: 4 combinazioni `not_available` da `FLOW_MATRIX` in `NextIAArchivistaPage.tsx`

## 2. Data
2026-04-22

## 3. Tipo task
patch

## 4. Obiettivo
Eliminare le 4 entry stub (`not_available`) dalla matrice di routing Archivista, confermate irraggiungibili da UI e senza bridge, family, Storage path o dati salvati collegati (audit `RIMOVIBILE PULITA` su 4/4 in `docs/product/AUDIT_RIMOZIONE_STUB_ARCHIVISTA.md`).

## 5. File modificati
- `src/next/NextIAArchivistaPage.tsx`

## 6. Riassunto modifiche
Rimossi da `FLOW_MATRIX`:
- `"fattura_ddt:documento_mezzo"` — stato `not_available`, nessun bridge, nessuna family
- `"preventivo:documento_mezzo"` — stato `not_available`, nessun bridge, nessuna family
- `"documento_mezzo:magazzino"` — stato `not_available`, nessun bridge, nessuna family
- `"documento_mezzo:manutenzione"` — stato `not_available`, nessun bridge, nessuna family

Type annotation aggiornata:
- Prima: `Record<\`${ArchivistaTipo}:${ArchivistaContesto}\`, ArchivistaFlowState>`
- Dopo: `Partial<Record<\`${ArchivistaTipo}:${ArchivistaContesto}\`, ArchivistaFlowState>>`

Aggiunto `!` (non-null assertion) sull'accesso `FLOW_MATRIX[buildFlowKey(tipo, contesto)]` (riga 205), giustificato dal guard `isContextAllowed` preesistente che impedisce stati stub a runtime.

Preservati intatti:
- `"documento_mezzo:documento_mezzo"` (ramo libretto, attivo)
- funzione `isContextAllowed`
- `DESTINATION_OPTIONS` (invariato, non conteneva le 4 stub)
- tutti i bridge e import

## 7. File extra richiesti
Nessuno.

## 8. Impatti attesi
- Il dropdown Archivista mostra esattamente le 5 combinazioni già attive (nessuna voce viene aggiunta o rimossa visivamente, le 4 stub non comparivano nel dropdown).
- I 5 rami operativi continuano a funzionare invariati.
- `isContextAllowed` resta il presidio contro navigation state malformati.

## 9. Rischi / attenzione
- Rischio basso. Le 4 entry erano dead code al 100%: non raggiungibili da UI, dropdown, HomeInternalAiLauncher né preset di navigazione.
- Il `!` assertion su `activeFlow` è sicuro finché `isContextAllowed` esiste e il dropdown non espone le combo rimosse. Se in futuro si aggiunge una nuova combo a `DESTINATION_OPTIONS`, va aggiunta prima anche a `FLOW_MATRIX`.

## 10. Build / Test eseguiti
- `npm run build` → **OK** (✓ built in 9.85s)
- `npx eslint src/next/NextIAArchivistaPage.tsx` → **OK** (nessun errore)
- `npm run lint` → **582 problemi / 567 errori / 15 warning** — delta zero rispetto alla baseline

## 11. Commit hash
DA VERIFICARE (commit manuale utente)

## 12. Stato finale
FATTO — patch completata, build e lint verificati.
