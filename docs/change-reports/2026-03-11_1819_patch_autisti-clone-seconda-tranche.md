# CHANGE REPORT - Seconda tranche clone-safe app autisti

## Data
- 2026-03-11 18:19

## Tipo task
- patch

## Obiettivo
- Aprire nel clone autisti la seconda tranche composta da `ControlloMezzo`, `CambioMezzoAutista` e dal flusso `Gomme`, mantenendo il runtime confinato a `/next/autisti/*` e senza toccare `src/autisti/**`.

## File modificati
- `src/App.tsx`
- `src/next/autisti/nextAutistiCloneRuntime.ts`
- `src/next/autisti/NextAutistiCloneLayout.tsx`
- `src/next/autisti/nextAutistiCloneState.ts`
- `src/next/NextAutistiGatePage.tsx`
- `src/next/NextAutistiControlloPage.tsx`
- `src/next/NextAutistiCambioMezzoPage.tsx`
- `src/next/nextAccess.ts`
- `src/next/nextData.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- Aggiunte le route clone reali `/next/autisti/controllo` e `/next/autisti/cambio-mezzo`.
- Esteso il runtime clone per riscrivere i path legacy della seconda tranche, mantenendo bloccati i moduli della terza tranche.
- Sostituito il gate clone con una variante che vede anche i controlli salvati localmente nel clone.
- Creati wrapper clone-safe dedicati per `controllo` e `cambio-mezzo`, con persistenza solo locale al clone.
- Reso raggiungibile il modal `Gomme` dalla home clone e intercettato il `Salva` con feedback sobrio per evitare falsa UX di sincronizzazione madre.
- Aggiornati metadata NEXT e registri permanenti del clone.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- La seconda tranche dell'app autisti e navigabile nel clone senza uscire da `/next/autisti/*`.
- Nessuna scrittura reale verso la madre per `controllo`, `cambio-mezzo` o `gomme`.
- Il gate clone non forza piu il ritorno a `controllo` dopo un salvataggio locale eseguito nel clone.

## Rischio modifica
- ELEVATO

## Moduli impattati
- App autisti clone separata
- Routing `/next`
- Guard-rail UX clone-safe

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

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
- Il flusso `Gomme` e raggiungibile ma non salva nemmeno in locale: il clone mostra il modal e blocca il `Salva` per non simulare scritture madre.
- La terza tranche autisti resta intenzionalmente fuori perimetro.
- Il worktree era gia sporco prima della patch; i file `src/autisti/**` restano comunque non modificati.

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
