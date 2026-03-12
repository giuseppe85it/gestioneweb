# CHANGE REPORT - Pagina clone dedicata Segnalazioni app autisti

## Data
- 2026-03-11 20:21

## Tipo task
- patch

## Obiettivo
- Aprire nel clone autisti il modulo `Segnalazioni` con una pagina dedicata e persistenza locale clone-only, evitando il wrapper puro del modulo madre e qualsiasi upload o scrittura reale verso la madre.

## File modificati
- `src/App.tsx`
- `src/next/autisti/nextAutistiCloneRuntime.ts`
- `src/next/autisti/NextAutistiCloneLayout.tsx`
- `src/next/autisti/nextAutistiCloneSegnalazioni.ts`
- `src/next/autisti/NextAutistiSegnalazioniPage.tsx`
- `src/next/nextAccess.ts`
- `src/next/nextData.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- Aggiunta la route clone reale `/next/autisti/segnalazioni`.
- Esteso il runtime clone per riscrivere `/autisti/segnalazioni` verso il subtree `/next/autisti/*`, cosi la home clone continua a usare il flusso madre senza uscire dal perimetro.
- Creata `NextAutistiSegnalazioniPage`, controparte clone dedicata del modulo madre, che legge solo il contesto clone autista/mezzo e `@mezzi_aziendali` in read-only.
- Creato un helper clone-only per salvare le segnalazioni solo in storage locale namespaced del clone.
- Riusato l'helper allegati locale gia introdotto per produrre anteprime foto locali senza `uploadBytes` o `getDownloadURL`.
- Aggiornati layout, metadata access e registri permanenti per riflettere la chiusura della terza tranche auditata dell'app autisti.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- `Segnalazioni` e ora raggiungibile dal clone e mantiene un flusso riconoscibile rispetto alla madre.
- Nessun upload reale, nessun side effect anticipato e nessuna scrittura su `@segnalazioni_autisti_tmp`.
- Il clone dichiara in modo sobrio che testo e foto restano locali e non sincronizzano la madre.

## Rischio modifica
- ELEVATO

## Moduli impattati
- App autisti clone separata
- Routing `/next/autisti/*`
- Guard-rail UX clone-safe per segnalazioni e foto

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: `Policy Storage effettive`

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- altro (area autista separata)

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Le foto vengono serializzate come anteprime locali: soluzione corretta per il clone, ma non sostituisce il futuro flusso Storage della madre.
- Il record clone-local non alimenta ancora i reader inbox/dossier che oggi leggono i dataset reali madre.
- La home clone continua a riusare il componente madre e dipende dal rewrite runtime dei path legacy per arrivare al nuovo modulo dedicato.

## Build/Test eseguiti
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
