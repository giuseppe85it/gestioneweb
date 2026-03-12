# CONTINUITY REPORT - Autisti clone segnalazioni

## Contesto generale
- La strategia attiva resta il clone fedele `read-only` della madre sotto `src/next/*`.
- L'app autisti continua a essere aperta per tranche, senza modificare `src/autisti/**` e senza riattivare scritture business verso la madre.

## Modulo/area su cui si stava lavorando
- Area autista separata su `/next/autisti/*`
- Ultimo modulo della terza tranche auditata: `Segnalazioni`

## Stato attuale
- Prima e seconda tranche autisti clone-safe restano operative dentro il subtree `/next/autisti/*`.
- `Rifornimento`, `RichiestaAttrezzature` e `Segnalazioni` sono ora attivi con pagine clone dedicate e salvataggio solo locale al clone.
- Nel perimetro home autista resta bloccato solo `Sgancia motrice`; i moduli avanzati (`Autisti Admin`, `Autista 360`, `Mezzo 360`) restano fuori.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Route clone reali per gate, login, setup mezzo, controllo mezzo, home autista, cambio mezzo, rifornimento, richiesta attrezzature e segnalazioni
- Rewrite dei path legacy `/autisti/*` verso `/next/autisti/*` per tutte le tranche oggi aperte
- Sessione locale autista namespaced, controlli clone-local, rifornimenti clone-local, richieste attrezzature clone-local e ora anche segnalazioni clone-local
- Feedback sobrio per azioni bloccate o non sincronizzabili

## Prossimo step di migrazione
- Valutare se e quando alimentare reader clone secondari con i record locali autisti oppure lasciare il perimetro solo UX/compilazione locale

## Moduli impattati
- `src/next/autisti/*`
- `src/App.tsx`
- metadata/access NEXT

## Contratti dati coinvolti
- storage locale namespaced autisti clone
- lettura read-only di `@mezzi_aziendali`
- nessun writer reale verso `@segnalazioni_autisti_tmp`
- nessun writer reale verso Storage `autisti/segnalazioni/*`

## Ultime modifiche eseguite
- Aggiunta la route `/next/autisti/segnalazioni`
- Creato `NextAutistiSegnalazioniPage` come controparte clone dedicata del modulo madre
- Creato un helper clone-only per salvare le segnalazioni solo in locale
- Riusato l'helper allegati locale per le foto senza upload e senza `getDownloadURL`
- Aggiornati layout clone, `REGISTRO_MODIFICHE_CLONE.md` e `STATO_MIGRAZIONE_NEXT.md`

## File coinvolti
- `src/App.tsx`
- `src/next/autisti/nextAutistiCloneRuntime.ts`
- `src/next/autisti/NextAutistiCloneLayout.tsx`
- `src/next/autisti/nextAutistiCloneSegnalazioni.ts`
- `src/next/autisti/NextAutistiSegnalazioniPage.tsx`
- `src/next/nextAccess.ts`
- `src/next/nextData.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Decisioni gia prese
- `src/autisti/**` resta read-only: `Segnalazioni` non va importato 1:1 perche usa writer e upload diretti.
- `Segnalazioni` va portato con pagina clone dedicata e persistenza locale clone-only.
- Se un write o un upload non puo sincronizzare la madre, il clone deve dirlo in modo sobrio e non simulare successo.

## Vincoli da non rompere
- Nessuna modifica diretta a `src/autisti/**`
- Nessuna uscita accidentale verso `/autisti/*` o fuori `/next`
- Nessun allargamento implicito a `Autisti Admin`, `Autista 360` o `Mezzo 360`

## Parti da verificare
- Se i reader clone futuri dovranno visualizzare anche le segnalazioni salvate localmente nel clone
- Se l'helper allegati locale dovra essere evoluto con limiti o compressione per evitare payload grandi in localStorage

## Rischi aperti
- Le anteprime foto sono conservate localmente come base64: soluzione corretta per il clone, ma con limiti naturali di persistenza e peso.
- Il perimetro autisti resta ad alto rischio perche la home clone continua a riusare componenti madre e dipende dal rewrite runtime dei path legacy.

## Punti da verificare collegati
- `Policy Storage effettive`

## Prossimo passo consigliato
- Fermarsi sulla tranche autisti operativa appena chiusa e valutare un task separato solo se serve riflettere i record clone-local nei reader secondari

## Cosa NON fare nel prossimo task
- Non toccare `src/autisti/**`
- Non riaprire upload/delete reali per allineare i moduli clone alla madre
- Non aprire `Autisti Admin`, `Autista 360` o `Mezzo 360` senza audit dedicato

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
