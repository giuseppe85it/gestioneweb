# CONTINUITY REPORT - Autisti clone richiesta attrezzature

## Contesto generale
- La strategia attiva resta il clone fedele `read-only` della madre sotto `src/next/*`.
- L'app autisti continua a essere aperta per tranche, senza modificare `src/autisti/**` e senza riattivare scritture business verso la madre.

## Modulo/area su cui si stava lavorando
- Area autista separata su `/next/autisti/*`
- Secondo modulo della terza tranche: `RichiestaAttrezzature`

## Stato attuale
- Prima e seconda tranche autisti clone-safe restano operative dentro il subtree `/next/autisti/*`.
- `Rifornimento` e `RichiestaAttrezzature` sono ora attivi con pagine clone dedicate e salvataggio solo locale al clone.
- `Segnalazioni` resta l'unico modulo ancora fuori perimetro nella terza tranche.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Route clone reali per gate, login, setup mezzo, controllo mezzo, home autista, cambio mezzo, rifornimento e richiesta attrezzature
- Rewrite dei path legacy `/autisti/*` verso `/next/autisti/*` per tutte le tranche oggi aperte
- Sessione locale autista namespaced, controlli clone-local, rifornimenti clone-local e ora anche richieste attrezzature con allegati locali
- Feedback sobrio per azioni bloccate o non sincronizzabili

## Prossimo step di migrazione
- Affrontare `Segnalazioni` con la stessa logica di pagina dedicata e helper allegati clone-only, senza riusare il modulo madre 1:1

## Moduli impattati
- `src/next/autisti/*`
- `src/App.tsx`
- metadata/access NEXT

## Contratti dati coinvolti
- storage locale namespaced autisti clone
- nessun writer reale verso `@richieste_attrezzature_autisti_tmp`
- nessun writer reale verso Storage `autisti/richieste-attrezzature/*`

## Ultime modifiche eseguite
- Aggiunta la route `/next/autisti/richiesta-attrezzature`
- Creato `NextAutistiRichiestaAttrezzaturePage` come controparte clone dedicata del modulo madre
- Creato un helper clone-only per allegati locali con anteprima e un helper clone-only per salvare le richieste solo in locale
- Aggiornati layout clone, `REGISTRO_MODIFICHE_CLONE.md` e `STATO_MIGRAZIONE_NEXT.md`

## File coinvolti
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

## Decisioni gia prese
- `src/autisti/**` resta read-only: i moduli della terza tranche non vanno importati 1:1 se usano writer diretti madre.
- `RichiestaAttrezzature` va portato con pagina clone dedicata e helper allegati locale-only.
- Se un write o un upload non puo sincronizzare la madre, il clone deve dirlo in modo sobrio e non simulare successo.

## Vincoli da non rompere
- Nessuna modifica diretta a `src/autisti/**`
- Nessuna uscita accidentale verso `/autisti/*` o fuori `/next`
- Nessun allargamento implicito a `Segnalazioni`, `Autisti Admin`, `Autista 360` o `Mezzo 360`

## Parti da verificare
- Se i reader clone futuri dovranno visualizzare anche le richieste attrezzature salvate localmente nel clone
- Se `Segnalazioni` potra riusare integralmente il nuovo helper allegati oppure richiedera un layer ancora piu specifico

## Rischi aperti
- Le anteprime foto sono conservate localmente come base64: la soluzione e corretta per il clone, ma non e un sostituto del futuro flusso Storage della madre.
- Il perimetro autisti resta ad alto rischio perche la home clone continua a riusare componenti madre e dipende dal rewrite runtime dei path legacy.

## Punti da verificare collegati
- `Policy Storage effettive`

## Prossimo passo consigliato
- Aprire il task finale della terza tranche su `Segnalazioni`, riusando il nuovo helper allegati ma con pagina clone dedicata separata

## Cosa NON fare nel prossimo task
- Non toccare `src/autisti/**`
- Non sbloccare `Segnalazioni` con wrapper puro del modulo madre
- Non reintrodurre upload/delete reali o sincronizzazioni madre mascherate da successo

## Commit/hash rilevanti
- `NON ESEGUITO`

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
