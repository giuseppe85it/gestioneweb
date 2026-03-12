# CONTINUITY REPORT - Autisti clone prima tranche

## Contesto generale
- Il progetto e nella fase clone `read-only` fedele della madre su `src/next/*`.
- L'app autisti legacy resta core operativo e non va toccata direttamente.

## Modulo/area su cui si stava lavorando
- App autisti clone NEXT
- Perimetro ristretto a `AutistiGate`, `LoginAutista`, `SetupMezzo`, `HomeAutista`

## Stato attuale
- Esistono ora le route clone `/next/autisti`, `/next/autisti/login`, `/next/autisti/setup-mezzo`, `/next/autisti/home`.
- Il clone riusa i componenti madre della prima tranche senza modificare `src/autisti/**`.
- Le uscite legacy `/autisti/*` vengono riscritte sul subtree clone oppure bloccate se fuori tranche.
- La sessione locale autisti del clone e namespaced e non usa direttamente i key browser della madre.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- UI reale della prima tranche autisti
- Runtime clone-safe per key locali autisti
- Rewrite routing legacy -> clone
- Feedback sobrio per moduli/azioni ancora fuori perimetro

## Prossimo step di migrazione
- Valutare in task separato la seconda tranche autisti solo dopo analisi dedicata di `Controllo`, `Cambio mezzo`, `Rifornimento`, `Segnalazioni` e `Richiesta attrezzature`.

## Moduli impattati
- `AutistiGate`
- `LoginAutista`
- `SetupMezzo`
- `HomeAutista`
- routing `/next`

## Contratti dati coinvolti
- `@colleghi`
- `@mezzi_aziendali`
- `@autisti_sessione_attive`
- `@controlli_mezzo_autisti`
- `@storico_eventi_operativi`

## Ultime modifiche eseguite
- Aggiunto layout clone dedicato fuori dalla `NextShell` admin.
- Aggiunti wrapper `NextAutistiGatePage`, `NextAutistiLoginPage`, `NextAutistiSetupMezzoPage`, `NextAutistiHomePage`.
- Aggiunto micro-runtime clone-only per namespacing local storage e rewrite dei path legacy autisti.
- Aggiornati `nextAccess`, `nextData`, `STATO_MIGRAZIONE_NEXT` e `REGISTRO_MODIFICHE_CLONE`.

## File coinvolti
- `src/App.tsx`
- `src/next/autisti/nextAutistiCloneRuntime.ts`
- `src/next/autisti/NextAutistiCloneLayout.tsx`
- `src/next/NextAutistiGatePage.tsx`
- `src/next/NextAutistiLoginPage.tsx`
- `src/next/NextAutistiSetupMezzoPage.tsx`
- `src/next/NextAutistiHomePage.tsx`
- `src/next/nextAccess.ts`
- `src/next/nextData.ts`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Nessun file in `src/autisti/**` va modificato in questa tranche.
- La prima tranche autisti clone apre solo gate/login/setup/home.
- Le scritture verso la madre restano bloccate; il clone deve essere esplicito quando la sessione resta solo locale.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna uscita da questa tranche verso `/autisti/*` legacy.
- Nessuna apertura di `Rifornimento`, `Segnalazioni`, `RichiestaAttrezzature`, `Autisti Admin`, `Autista 360`, `Mezzo 360`.
- Nessuna nuova scrittura reale o refactor shared ampio.

## Parti da verificare
- Effetto UX reale della tranche su sessioni autista gia presenti nel browser.
- Eventuale esigenza di estendere il micro-runtime clone-safe anche a `CambioMezzoAutista` o `ControlloMezzo` in task futuri.

## Rischi aperti
- Il dominio `D03` resta `BLOCCANTE PER IMPORTAZIONE`; questa tranche non va letta come sblocco del dominio dati.
- La seconda tranche autisti puo richiedere ulteriori guard-rail per writer non coperti solo dal rewrite routing.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` -> Stream eventi autisti canonico definitivo

## Prossimo passo consigliato
- Fare un task dedicato di audit/prioritizzazione sulla seconda tranche autisti, partendo da `ControlloMezzo` e `CambioMezzoAutista`.

## Cosa NON fare nel prossimo task
- Non toccare direttamente `src/autisti/**`.
- Non aprire in blocco tutta l'app autisti o i moduli admin/360.
- Non scambiare la sessione clone locale per sincronizzazione vera sulla madre.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
