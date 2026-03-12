# CONTINUITY REPORT - Autisti clone seconda tranche

## Contesto generale
- La strategia attiva resta il clone fedele `read-only` della madre sotto `src/next/*`.
- L'app autisti viene aperta per tranche, senza modificare `src/autisti/**` e senza riattivare scritture business verso la madre.

## Modulo/area su cui si stava lavorando
- Area autista separata su `/next/autisti/*`
- Seconda tranche: `ControlloMezzo`, `CambioMezzoAutista`, flusso `Gomme`

## Stato attuale
- Prima e seconda tranche autisti clone-safe sono ora operative dentro il subtree `/next/autisti/*`.
- `Gate`, `Login`, `Setup`, `Controllo`, `Home` e `Cambio mezzo` convivono nello stesso runtime clone dedicato.
- `Gomme` e raggiungibile dalla home clone, ma il `Salva` viene bloccato con notice esplicita.
- Restano fuori `Rifornimento`, `Segnalazioni`, `Richiesta attrezzature`, `Autisti Admin`, `Autista 360` e `Mezzo 360`.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Route clone reali per gate, login, setup mezzo, controllo mezzo, home autista e cambio mezzo
- Rewrite dei path legacy `/autisti/*` verso `/next/autisti/*` per le tranche aperte
- Sessione locale autista namespaced e controlli clone-local usati dal gate clone
- Feedback sobrio per azioni bloccate o non sincronizzabili

## Prossimo step di migrazione
- Valutare la terza tranche autisti (`Rifornimento`, `Segnalazioni`, `RichiestaAttrezzature`) con lo stesso schema clone-safe e senza toccare la madre

## Moduli impattati
- `src/next/autisti/*`
- `src/App.tsx`
- metadata/access NEXT

## Contratti dati coinvolti
- `@autisti_sessione_attive`
- `@controlli_mezzo_autisti`
- `@mezzi_aziendali`
- `@colleghi`
- storage locale namespaced autisti clone

## Ultime modifiche eseguite
- Aggiunte le route `/next/autisti/controllo` e `/next/autisti/cambio-mezzo`
- Creati wrapper clone-safe dedicati per controllo e cambio mezzo
- Sostituito il gate clone per leggere anche i controlli salvati localmente
- Esteso il layout clone per notice query-based e blocco del `Salva` nel modal gomme
- Aggiornati `REGISTRO_MODIFICHE_CLONE.md` e `STATO_MIGRAZIONE_NEXT.md`

## File coinvolti
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

## Decisioni gia prese
- `src/autisti/**` resta read-only: tutte le correzioni runtime stanno nel clone.
- L'app autisti non entra nella `NextShell` admin e resta esperienza separata.
- Se un write non puo sincronizzare la madre, il clone deve dirlo in modo sobrio e non simulare successo.

## Vincoli da non rompere
- Nessuna modifica diretta a `src/autisti/**`
- Nessuna uscita accidentale verso `/autisti/*` o fuori `/next`
- Nessun allargamento implicito alla terza tranche o ai moduli 360/admin

## Parti da verificare
- Se nella terza tranche servira un layer locale aggiuntivo per writer oggi basati su `storageSync`
- Se il modal `Gomme` andra poi replicato in wrapper clone completo invece di restare in modal madre intercettato

## Rischi aperti
- Il perimetro autisti resta ad alto rischio perche i componenti madre originali usano writer operativi e sessioni condivise.
- Il clone salva localmente solo i dati strettamente necessari al routing della seconda tranche; non esiste ancora persistenza clone completa per tutte le azioni di campo.

## Punti da verificare collegati
- `NO`

## Prossimo passo consigliato
- Preparare audit e patch della terza tranche autisti, mantenendo lo stesso schema: wrapper clone-only, rewrite interno e feedback esplicito sui write bloccati.

## Cosa NON fare nel prossimo task
- Non toccare `src/autisti/**`
- Non aprire `Autisti Admin`, `Autista 360` o `Mezzo 360`
- Non introdurre writer reali o sincronizzazioni madre mascherate da successo

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
