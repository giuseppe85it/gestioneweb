# CONTINUITY REPORT - NEXT shell runtime

## Contesto generale
- La legacy resta il sistema attivo stabile.
- La NEXT ora esiste anche nel runtime frontend come shell separata su route dedicate `/next/*`.

## Modulo/area su cui si stava lavorando
- Shell globale NEXT
- Prime 5 macro-aree placeholder reali e navigabili

## Stato attuale
- Esiste una shell NEXT separata con layout dedicato, sidebar, header e pagine placeholder coerenti con il blueprint.
- Non esistono ancora reader o writer reali nella NEXT.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- SHELL CREATA

## Cosa e gia stato importato/migrato
- shell
- navigazione
- UI placeholder delle 5 macro-aree
- nessuna lettura dati
- nessuna scrittura

## Prossimo step di migrazione
- Importare in modo controllato la prima superficie `read-only`, partendo da `Centro di Controllo` oppure `Dossier Mezzo`.

## Moduli impattati
- `src/App.tsx`
- `src/next/*`
- tracker NEXT

## Contratti dati coinvolti
- nessuno

## Ultime modifiche eseguite
- Aggiunte route `/next/*` separate dalla legacy
- Creata shell NEXT runtime con placeholder per 5 macro-aree
- Aggiornato `docs/product/STATO_MIGRAZIONE_NEXT.md` allo stato reale raggiunto

## File coinvolti
- `src/App.tsx`
- `src/next/NextShell.tsx`
- `src/next/NextAreaPage.tsx`
- `src/next/nextData.ts`
- `src/next/next-shell.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`

## Decisioni gia prese
- La NEXT vive nello stesso repo ma su route dedicate e separate dalla legacy
- La prima implementazione reale resta shell + placeholder statici, senza nuove scritture dati

## Vincoli da non rompere
- Non sostituire `/` o alterare il comportamento delle route legacy
- Nessuna scrittura dati o cambio backend
- Aggiornare sempre `docs/product/STATO_MIGRAZIONE_NEXT.md` quando la NEXT cambia stato

## Parti da verificare
- Permessi/guard reali quando la NEXT iniziera a leggere dati
- Strategia di ingresso utente alla NEXT senza sporcare la UX della legacy

## Rischi aperti
- Punti aperti architetturali su IA/PDF, Storage/Firestore e contratti dati restano invariati
- Il worktree contiene modifiche pregresse non legate a questo task su altri documenti

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Portare nella NEXT la prima pagina `read-only` reale usando la shell gia creata, senza introdurre writer.

## Cosa NON fare nel prossimo task
- Non collegare insieme piu moduli business veri nello stesso passaggio
- Non introdurre scritture o refactor della legacy approfittando della nuova shell

## Commit/hash rilevanti
- `NON ESEGUITO`

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

