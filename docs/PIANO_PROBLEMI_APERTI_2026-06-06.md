# Piano Operativo Cantiere A - Rifiniture Flusso

## Stato Verificato

- Plan Mode attivo: questo e' un piano esecutivo, non ho creato file, patch o commit.
- `docs/PIANO_PROBLEMI_APERTI_2026-06-06.md` al momento non esiste.
- Worktree: resta solo `docs/design/dettaglio-manutenzione.pen` modificato, preesistente e da non toccare.
- `cloneWriteBarrier.ts` non contiene riferimenti specifici al writer `presaInCaricoSegnalazioneWriter`.
- `presaInCaricoSegnalazioneWriter` e' citato solo da se stesso, dal suo test e da 2 commenti nei writer.

## Passo Zero E Backup

1. Creare `docs/PIANO_PROBLEMI_APERTI_2026-06-06.md` con il piano approvato gia' presente nel contesto, copiando il contenuto del precedente blocco `<proposed_plan>` senza i tag.
2. Commit solo del piano:
   `git add docs/PIANO_PROBLEMI_APERTI_2026-06-06.md && git commit -m "docs: piano problemi aperti"`.
3. Creare backup obbligatorio:
   `C:\tmp\cantiereA_backup_2026-06-06`
4. Copiare e verificare non-vuoti:
   `src/next/NextManutenzioniPage.tsx`,
   `src/next/writers/agganciaSegnalazioneAManutenzioneEsistenteWriter.ts`,
   `src/next/writers/nextManutenzioneDaFareCreateWriter.ts`,
   `src/next/writers/presaInCaricoSegnalazioneWriter.ts`.
5. Se un backup manca o e' vuoto: STOP HARD.

## Lotti

### Lotto A1 - `segnalatoDa` Reale

- In `NextManutenzioniPage.tsx`, aggiungere helper vicino a `formatSegnalazioneAutore`:
  - `resolveSegnalazioneAutoreReale(item)` = `normalizeFreeText(item.autistaNome) || normalizeFreeText(item.badgeAutista) || null`.
  - `formatSegnalazioneAutore` usa questo helper e fallback `"Autista"`.
  - `buildSegnalatoDaGruppo(items)` deduplica preservando ordine; confronto dedup normalizzato lowercase; output singolo nome, oppure join con `", "`, oppure fallback `"Autisti"`.
- Nel Crea-lavoro-dal-gruppo sostituire `segnalatoDa: "Autisti"` con `buildSegnalatoDaGruppo(targetItems)`.
- Test in `gruppoSegnalazioniTransform.test.ts`: 1 autista, 2 autisti diversi, nessun nome/badge.

Gate A1:
`npx tsc --noEmit`
`npx vite build`
`npx vitest run src/next/domain/__tests__/gruppoSegnalazioniTransform.test.ts`

Commit A1:
`fix(manutenzioni): segnalatoDa con nomi reali nel crea lavoro da gruppo`

### Lotto A2 - Test Back-Link Gruppo

- Nessuna patch al flusso.
- Estendere `gruppoSegnalazioniTransform.test.ts`:
  - dopo crea-lavoro + batch completo, la manutenzione persistita ha `origineRefs` esattamente per tutte le origini selezionate.
  - caso batch parziale + retry: alla fine `origineRefs` complete e senza duplicati.
- Blindare che `saved.origineRefs` puo' essere assente prima del batch, ma il record persistito post-batch contiene i back-link.

Gate A2:
`npx vitest run src/next/domain/__tests__/gruppoSegnalazioniTransform.test.ts`
`npx tsc --noEmit`
`npx vite build`

Commit A2:
`test(manutenzioni): protezione back-link crea lavoro da gruppo`

### Lotto A3 - D2a Gruppo + Collegata Incompatibili

- In `agganciaSegnalazioneAManutenzioneEsistenteWriter.ts`, quando `input.sorgenteTipo === "segnalazione"`:
  - continuare a scrivere `stato: "presa_in_carico"`;
  - se `sourceRecord.gruppoSegnalazioneId` e' valorizzato, scrivere anche `gruppoSegnalazioneId: null` nella stessa patch della sorgente.
  - se assente/null, non aggiungere il campo.
- In `nextManutenzioneDaFareCreateWriter.ts`, dentro `patchSegnalazione`, applicare la stessa regola condizionale.
- Non toccare scope barrier, `closureOrchestrator`, `cicloLegame`, `gruppoSegnalazioniWriter`.
- Test:
  - `agganciaSegnalazioneAManutenzioneEsistente.test.ts`: segnalazione raggruppata -> `linkedLavoroId` valorizzato e `gruppoSegnalazioneId:null`; non raggruppata -> campo assente/null resta tale.
  - `agganciaSorgente.test.ts`: stesso scenario sul percorso `agganciaSorgenteAManutenzioneEsistente`.

Gate A3:
`npx tsc --noEmit`
`npx vite build`
`npx vitest run src/next/writers/__tests__/agganciaSegnalazioneAManutenzioneEsistente.test.ts src/next/writers/__tests__/agganciaSorgente.test.ts src/next/domain/__tests__/gruppoSegnalazioniTransform.test.ts`

Commit A3:
`feat(legame): aggancio rimuove la segnalazione dal gruppo (D2a)`

### Lotto A4 - Rimozione Writer Morto D3b

- Eliminare:
  - `src/next/writers/presaInCaricoSegnalazioneWriter.ts`
  - `src/next/writers/__tests__/presaInCaricoSegnalazione.test.ts`
- Rimuovere solo i commenti che citano `segnaPresaInCaricoSegnalazione` in:
  - `agganciaSegnalazioneAManutenzioneEsistenteWriter.ts`
  - `nextManutenzioneDaFareCreateWriter.ts`
- Non toccare:
  - stato dati `presa_in_carico`;
  - reader/frasi storia che leggono `dataPresaInCarico`;
  - writer reali che mettono `stato:"presa_in_carico"`;
  - barrier.
- Dopo patch, `rg "segnaPresaInCaricoSegnalazione|presaInCaricoSegnalazioneWriter|presaInCaricoSegnalazione" src/next` deve non trovare riferimenti al writer eliminato.

Gate A4:
`npx tsc --noEmit`
`npx vite build`
`npx vitest run src/next/domain/__tests__/gruppoSegnalazioniTransform.test.ts src/next/writers/__tests__/agganciaSegnalazioneAManutenzioneEsistente.test.ts src/next/writers/__tests__/agganciaSorgente.test.ts src/next/writers/__tests__/gruppoSegnalazioniWriter.test.ts src/next/helpers/__tests__/cicloLegame.test.ts src/next/helpers/__tests__/frasestoriaRecord.test.ts src/next/writers/__tests__/chiusuraDaEvento.test.ts`

Commit A4:
`chore: rimozione writer presa in carico non cablato (D3b)`

## Vincoli Di Esecuzione

- Non aggiungere al commit `docs/design/dettaglio-manutenzione.pen`.
- Non toccare dati Firestore.
- Non modificare file fuori perimetro.
- Dopo ogni commit, salvare hash.
- Output finale richiesto: `PATCH COMPLETATA` o `PARZIALE`, hash piano/A1/A2/A3/A4, gate per lotto, regressioni finali, backup confermato, note discrepanze.
