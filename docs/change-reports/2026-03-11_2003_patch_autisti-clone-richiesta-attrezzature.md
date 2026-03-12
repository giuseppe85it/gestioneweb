# CHANGE REPORT - Pagina clone dedicata Richiesta Attrezzature app autisti

## Data
- 2026-03-11 20:03

## Tipo task
- patch

## Obiettivo
- Aprire nel clone autisti il modulo `RichiestaAttrezzature` con una pagina dedicata e un helper allegati clone-only, evitando il wrapper puro del modulo madre e qualsiasi upload/delete reale verso Storage.

## File modificati
- `src/App.tsx`
- `src/next/autisti/nextAutistiCloneRuntime.ts`
- `src/next/autisti/NextAutistiCloneLayout.tsx`
- `src/next/autisti/nextAutistiCloneAttachments.ts`
- `src/next/autisti/nextAutistiCloneRichiesteAttrezzature.ts`
- `src/next/autisti/NextAutistiRichiestaAttrezzaturePage.tsx`
- `src/next/nextAccess.ts`
- `src/next/nextData.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- Aggiunta la route clone reale `/next/autisti/richiesta-attrezzature`.
- Esteso il runtime clone per riscrivere `/autisti/richiesta-attrezzature` verso il subtree `/next/autisti/*`, cosi la home clone continua a usare il flusso madre senza uscire dal perimetro.
- Creato un helper clone-only per allegati locali con anteprima base64, senza `uploadBytes` o `deleteObject`.
- Creata `NextAutistiRichiestaAttrezzaturePage`, controparte clone dedicata del modulo madre, che salva richiesta e foto solo in storage locale namespaced del clone.
- Aggiornati layout, metadata access e registri permanenti per riflettere l'apertura del secondo modulo della terza tranche.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- `RichiestaAttrezzature` e ora raggiungibile dal clone e mantiene un flusso riconoscibile rispetto alla madre.
- Nessun upload reale, nessuna delete reale e nessuna scrittura su `@richieste_attrezzature_autisti_tmp`.
- Il clone dichiara in modo sobrio che testo e foto restano locali e non sincronizzano la madre.

## Rischio modifica
- ELEVATO

## Moduli impattati
- App autisti clone separata
- Routing `/next/autisti/*`
- Guard-rail UX clone-safe per allegati

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
- Le foto vengono serializzate in locale come anteprima base64: la persistenza clone e volutamente limitata e non alimenta ancora reader dossier/inbox.
- La home clone continua a riusare il componente madre e dipende dal rewrite runtime dei path legacy per arrivare al nuovo modulo dedicato.
- `Segnalazioni` resta fuori perimetro e richiedera un layer clone-only separato prima di essere aperta.

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
