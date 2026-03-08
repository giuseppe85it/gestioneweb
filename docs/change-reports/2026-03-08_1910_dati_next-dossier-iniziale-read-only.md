# CHANGE REPORT - Primo Dossier Mezzo NEXT iniziale read-only

## Data
- 2026-03-08 19:10

## Tipo task
- dati

## Obiettivo
- aprire il primo Dossier Mezzo NEXT iniziale in sola lettura, partendo solo dal dominio stabile `Anagrafiche flotta e persone`

## File modificati
- `src/App.tsx`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/NextMezziDossierPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/next-shell.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`

## Riassunto modifiche
- aggiunta route NEXT `/next/mezzi-dossier/:targa` con dettaglio mezzo separato dalla lista
- esteso il reader canonico `D01` con lookup per targa senza introdurre nuovi dataset o writer
- collegato l'elenco mezzi al primo Dossier iniziale `read-only`, limitato a identita mezzo, stato importazione e convergenze future
- aggiornati tracker e decision log per segnare `Dossier Mezzo` come `IMPORTATO READ-ONLY`

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- la macro-area `Mezzi / Dossier` nella NEXT ha ora sia lista flotta sia primo dettaglio mezzo reale in sola lettura
- il Dossier resta volutamente incompleto e non legge ancora lavori, rifornimenti, documenti, costi o IA contestuale

## Rischio modifica
- NORMALE

## Moduli impattati
- `Flotta`
- `Dossier Mezzo`

## Contratti dati toccati?
- PARZIALE

## Punto aperto collegato?
- NO

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- dossier

## Stato migrazione prima
- IMPORTATO SOLO UI

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- il dettaglio dossier usa solo `storage/@mezzi_aziendali` e non deve essere esteso ad altri domini senza nuovo reader esplicito
- `@colleghi` resta nel dominio `D01` ma non viene letto in questo step
- il Dossier iniziale non va scambiato per migrazione completa del `DossierMezzo` legacy

## Build/Test eseguiti
- `npm run build` -> OK (warning Vite su chunk grandi non bloccante)

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
