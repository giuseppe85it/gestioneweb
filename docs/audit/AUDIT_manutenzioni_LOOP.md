# AUDIT LOOP - Manutenzioni

- Data audit: `2026-03-31 15:10 Europe/Rome`
- Modulo: `Manutenzioni`
- Esito: `PASS`

## Verifiche eseguite
- La route ufficiale `/next/manutenzioni` monta `src/next/NextManutenzioniPage.tsx`, non `NextMotherPage` o `src/pages/Manutenzioni.tsx`.
- `src/next/NextManutenzioniPage.tsx` non usa piu `NextClonePageScaffold` e replica la superficie pratica della madre su:
  - selezione mezzo / compressore
  - dettagli manutenzione
  - materiali utilizzati
  - storico manutenzioni con filtri
  - modal gomme
  - CTA `Apri dossier mezzo`, `Gestione gomme`, `Salva manutenzione`, `Pulisci campi`, `Esporta PDF`, `Modifica`, `Elimina`
- Il runtime ufficiale legge:
  - `@manutenzioni` e `@mezzi_aziendali` tramite `readNextManutenzioniWorkspaceSnapshot()` in `src/next/domain/nextManutenzioniDomain.ts`
  - `@inventario` tramite `readNextInventarioSnapshot({ includeCloneOverlays: false })`
- Il runtime ufficiale non usa `setItemSync`, `getItemSync`, `generateSmartPDF`, writer clone-only o export locali.
- `Salva manutenzione`, `Elimina`, `Esporta PDF` e la conferma del modal gomme restano visibili ma bloccano il comportamento con messaggi read-only espliciti.
- La bozza materiali resta solo locale alla UI e non scarica quantita da inventario, non crea movimenti e non tocca `@materialiconsegnati`.
- Verifiche tecniche eseguite:
  - `npx eslint src/next/NextManutenzioniPage.tsx src/next/domain/nextManutenzioniDomain.ts` -> `OK`
  - `npm run build` -> `OK`

## Risultato
- Stato modulo nel tracker: `CLOSED`
- Prossimo modulo da affrontare: `nessuno nel tracker corrente; loop modulo-per-modulo completato; consigliato audit finale globale separato`
