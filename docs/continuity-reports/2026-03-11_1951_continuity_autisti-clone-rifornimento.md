# CONTINUITY REPORT - Autisti clone rifornimento

## Contesto generale
- La strategia attiva resta il clone fedele `read-only` della madre sotto `src/next/*`.
- L'app autisti continua a essere aperta per tranche, senza modificare `src/autisti/**` e senza riattivare scritture business verso la madre.

## Modulo/area su cui si stava lavorando
- Area autista separata su `/next/autisti/*`
- Primo modulo della terza tranche: `Rifornimento`

## Stato attuale
- Prima e seconda tranche autisti clone-safe restano operative dentro il subtree `/next/autisti/*`.
- `Rifornimento` e ora attivo con una pagina clone dedicata e salvataggio solo locale al clone.
- `Segnalazioni` e `RichiestaAttrezzature` restano fuori perimetro.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Route clone reali per gate, login, setup mezzo, controllo mezzo, home autista, cambio mezzo e ora rifornimento
- Rewrite dei path legacy `/autisti/*` verso `/next/autisti/*` per tutte le tranche oggi aperte
- Sessione locale autista namespaced, controlli clone-local e ora anche persistenza clone-local per i rifornimenti
- Feedback sobrio per azioni bloccate o non sincronizzabili

## Prossimo step di migrazione
- Preparare il mini-layer clone-safe per allegati foto e poi affrontare `RichiestaAttrezzature`, lasciando `Segnalazioni` per ultima

## Moduli impattati
- `src/next/autisti/*`
- `src/App.tsx`
- metadata/access NEXT

## Contratti dati coinvolti
- storage locale namespaced autisti clone
- nessun writer reale verso `@rifornimenti_autisti_tmp`
- nessun writer reale verso `storage/@rifornimenti`

## Ultime modifiche eseguite
- Aggiunta la route `/next/autisti/rifornimento`
- Creato `NextAutistiRifornimentoPage` come controparte clone dedicata del modulo madre
- Creato un helper clone-only per salvare i rifornimenti solo in locale
- Aggiornati layout clone, `REGISTRO_MODIFICHE_CLONE.md` e `STATO_MIGRAZIONE_NEXT.md`

## File coinvolti
- `src/App.tsx`
- `src/next/autisti/nextAutistiCloneRuntime.ts`
- `src/next/autisti/NextAutistiCloneLayout.tsx`
- `src/next/autisti/nextAutistiCloneRifornimenti.ts`
- `src/next/autisti/NextAutistiRifornimentoPage.tsx`
- `src/next/nextAccess.ts`
- `src/next/nextData.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Decisioni gia prese
- `src/autisti/**` resta read-only: i moduli della terza tranche non vanno importati 1:1 se usano writer diretti madre.
- `Rifornimento` va portato con pagina clone dedicata e non con wrapper puro.
- Se un write non puo sincronizzare la madre, il clone deve dirlo in modo sobrio e non simulare successo.

## Vincoli da non rompere
- Nessuna modifica diretta a `src/autisti/**`
- Nessuna uscita accidentale verso `/autisti/*` o fuori `/next`
- Nessun allargamento implicito a `Segnalazioni`, `RichiestaAttrezzature`, `Autisti Admin`, `Autista 360` o `Mezzo 360`

## Parti da verificare
- Se i reader clone futuri dovranno visualizzare anche i rifornimenti salvati localmente nel clone
- Se la futura migrazione di `RichiestaAttrezzature` e `Segnalazioni` potra condividere un helper unico per foto locali

## Rischi aperti
- Il perimetro autisti resta ad alto rischio perche la home clone continua a riusare componenti madre e dipende dal rewrite runtime dei path legacy.
- I moduli con upload foto restano piu delicati di `Rifornimento` e non vanno aperti senza layer clone-only dedicato.

## Punti da verificare collegati
- `Policy Firestore effettive`
- `Policy Storage effettive`

## Prossimo passo consigliato
- Aprire un mini-task tecnico per allegati foto clone-only e poi migrare `RichiestaAttrezzature`

## Cosa NON fare nel prossimo task
- Non toccare `src/autisti/**`
- Non sbloccare `Segnalazioni` con wrapper puro del modulo madre
- Non reintrodurre writer reali o sincronizzazioni madre mascherate da successo

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
