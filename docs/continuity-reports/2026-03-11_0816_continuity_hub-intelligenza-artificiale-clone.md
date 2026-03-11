# CONTINUITY REPORT - Hub clone Intelligenza Artificiale

## Contesto generale
- il progetto resta nella fase di clone fedele `read-only` della madre
- la patch corrente riallinea il runtime clone a un modulo reale della madre, eliminando la semantica concettuale `IA Gestionale`

## Modulo/area su cui si stava lavorando
- hub IA clone
- routing `/next`, metadata area e quick link del `Centro Controllo`

## Stato attuale
- il clone apre ora `/next/ia` come vero hub `Intelligenza Artificiale`
- il vecchio `/next/ia-gestionale` non e piu un ingresso attivo: redirige al nuovo path
- i moduli figli restano visibili ma bloccati per evitare configurazioni, upload, save e runtime esterni

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- route clone reale del hub madre
- pagina clone statica fedele nei titoli e nelle card del modulo madre
- quick link `/ia` del clone reso realmente navigabile verso il hub clone-safe

## Prossimo step di migrazione
- valutare separatamente se aprire `Libretti (Export PDF)` come pagina clone-safe autonoma oppure mantenere il hub come unico ingresso IA aperto

## Moduli impattati
- `Intelligenza Artificiale`
- `Centro Controllo` clone
- shell `/next`

## Contratti dati coinvolti
- nessuno nel runtime clone del hub
- contesto collegato ma non riattivato: `@impostazioni_app/gemini`, `@mezzi_aziendali`, `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, `@documenti_cisterna`

## Ultime modifiche eseguite
- sostituita la route attiva `/next/ia-gestionale` con `/next/ia`
- eliminata la pagina placeholder `NextIAGestionalePage.tsx` e creata `NextIntelligenzaArtificialePage.tsx`
- riallineati `nextData.ts`, `nextAccess.ts` e il quick link clone `/ia`

## File coinvolti
- `src/App.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/NextIntelligenzaArtificialePage.tsx`
- `src/next/nextData.ts`
- `src/next/nextAccess.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Decisioni gia prese
- nel runtime clone attivo non va piu usata la semantica fake `IA Gestionale`
- il massimo perimetro sicuro aperto adesso resta il solo hub read-only della madre
- `IAApiKey`, `IALibretto`, `IADocumenti`, `IACoperturaLibretti`, `Libretti (Export PDF)` e `Cisterna Caravate IA` restano fuori dal perimetro aperto in questa patch

## Vincoli da non rompere
- madre intoccabile
- nessuna lettura raw nella UI clone di questo hub
- nessun upload, save, API key o runtime esterno deve essere riattivato sotto `/next/ia`

## Parti da verificare
- se `Libretti (Export PDF)` vada aperto in una patch dedicata o resti bloccato
- se serve un aggiornamento esplicito anche di `docs/STATO_ATTUALE_PROGETTO.md` per riallineare il lessico storico alla situazione runtime attuale

## Rischi aperti
- governance endpoint IA/PDF ancora aperta nel repository
- presenza di riferimenti storici a `IA Gestionale` nella documentazione strategica precedente, da non confondere con il runtime clone attivo

## Punti da verificare collegati
- `Governance endpoint IA/PDF multipli`

## Prossimo passo consigliato
- audit mirato su `Libretti (Export PDF)` per decidere se aprirlo come unico sottomodulo IA clone-safe dopo il hub

## Cosa NON fare nel prossimo task
- non aprire `IAApiKey`, `IALibretto`, `IADocumenti`, `IACoperturaLibretti`, `Cisterna IA` o `AnalisiEconomica` come figli del hub senza una separazione esplicita dai writer

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
