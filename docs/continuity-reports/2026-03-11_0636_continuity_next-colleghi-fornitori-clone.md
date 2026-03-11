# CONTINUITY REPORT - Colleghi e Fornitori clone

## Contesto generale
- La fase attiva resta il clone fedele `read-only` della madre su `src/next/*`.
- Il task ha aperto due moduli reali della madre senza usare il placeholder concettuale `Strumenti Trasversali`.

## Modulo/area su cui si stava lavorando
- `Colleghi`
- `Fornitori`
- quick link dal `Centro Controllo` clone

## Stato attuale
- Esistono ora due route clone dedicate `/next/colleghi` e `/next/fornitori`.
- Le pagine clone leggono solo da reader/domain dedicati.
- Le azioni scriventi e PDF restano bloccate in modo esplicito.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- route clone
- lettura dati reale
- UI read-only
- blocco scritture

## Prossimo step di migrazione
- Verificare il prossimo modulo reale collegato ai quick link clone ancora disabilitati, senza riaprire il contenitore concettuale `Strumenti Trasversali`.

## Moduli impattati
- `NextCentroControlloPage`
- `Colleghi`
- `Fornitori`

## Contratti dati coinvolti
- `storage/@colleghi`
- `storage/@fornitori`

## Ultime modifiche eseguite
- Aggiunte le route `/next/colleghi` e `/next/fornitori`.
- Creati i layer `nextColleghiDomain.ts` e `nextFornitoriDomain.ts`.
- Risolti i quick link clone-safe da `Centro Controllo`.

## File coinvolti
- `src/App.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/NextColleghiPage.tsx`
- `src/next/NextFornitoriPage.tsx`
- `src/next/domain/nextColleghiDomain.ts`
- `src/next/domain/nextFornitoriDomain.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Decisioni gia prese
- Non usare `Strumenti Trasversali` come contenitore artificiale per questi moduli.
- Tenere tutte le letture dati fuori dalla UI clone.
- Lasciare bloccati add/edit/delete/save/PDF.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura verso `@colleghi` o `@fornitori`.
- Nessuna riattivazione di `generateSmartPDF` o side effect simili nel clone.

## Parti da verificare
- Matrice finale ruoli/permessi dei moduli anagrafici.
- Eventuale apertura futura del cluster `IA` reale, separata da questo task.

## Rischi aperti
- Il worktree resta sporco su altri file del clone non toccati in questo task.
- Il placeholder `/next/strumenti-trasversali` resta presente come residuo storico e non va confuso con moduli reali gia aperti.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` -> Matrice ruoli/permessi definitiva

## Prossimo passo consigliato
- Scegliere il prossimo modulo reale ancora disabilitato dai quick link clone e aprirlo con lo stesso criterio: route vera della madre, reader dedicato, zero writer.

## Cosa NON fare nel prossimo task
- Non riaprire `Strumenti Trasversali` come macro-area fittizia.
- Non portare nel clone i writer legacy di `Colleghi`, `Fornitori` o i PDF attivi.

## Commit/hash rilevanti
- `09f6a334` - HEAD corrente del repo al momento del report

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
