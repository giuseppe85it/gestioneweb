# CHANGE REPORT - Pagina clone dedicata Rifornimento app autisti

## Data
- 2026-03-11 19:51

## Tipo task
- patch

## Obiettivo
- Aprire nel clone autisti il primo modulo della terza tranche con una pagina dedicata per `Rifornimento`, evitando il wrapper puro del modulo madre e qualsiasi scrittura reale verso i dataset operativi.

## File modificati
- `src/App.tsx`
- `src/next/autisti/nextAutistiCloneRuntime.ts`
- `src/next/autisti/NextAutistiCloneLayout.tsx`
- `src/next/autisti/nextAutistiCloneRifornimenti.ts`
- `src/next/autisti/NextAutistiRifornimentoPage.tsx`
- `src/next/nextAccess.ts`
- `src/next/nextData.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- Aggiunta la route clone reale `/next/autisti/rifornimento`.
- Esteso il runtime clone per riscrivere `/autisti/rifornimento` verso il subtree `/next/autisti/*`, cosi la home clone continua a usare il flusso madre ma senza uscire dal perimetro.
- Creata `NextAutistiRifornimentoPage`, controparte clone dedicata del form rifornimento, con navigazione solo `/next/autisti/*`.
- Creato un micro-helper clone-only per salvare i rifornimenti solo in storage locale namespaced del clone.
- Aggiornati layout, metadata access e registri permanenti per riflettere l'apertura del primo modulo della terza tranche.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- `Rifornimento` e ora raggiungibile dal clone e mantiene un flusso riconoscibile rispetto alla madre.
- Nessun `setDoc` verso `storage/@rifornimenti` e nessuna scrittura su `@rifornimenti_autisti_tmp`.
- Il clone dichiara in modo sobrio che il salvataggio resta locale e non sincronizza la madre.

## Rischio modifica
- ELEVATO

## Moduli impattati
- App autisti clone separata
- Routing `/next/autisti/*`
- Guard-rail UX clone-safe

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: `Policy Firestore effettive`

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
- La home clone continua a riusare il componente madre e dipende dal rewrite runtime dei path legacy per arrivare al nuovo modulo dedicato.
- Il nuovo helper clone-local non alimenta ancora i reader dossier/inbox che oggi leggono i dataset reali della madre.
- `Segnalazioni` e `RichiestaAttrezzature` restano fuori e richiedono un approccio diverso per gli upload.

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
