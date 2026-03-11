# CONTINUITY REPORT - Area Capo clone

## Contesto generale
- Il progetto e nella fase di clone fedele `read-only` della madre in `src/next/*`.
- La madre resta intatta; i task correnti aprono nel clone solo letture sicure e bloccano writer e side effect.

## Modulo/area su cui si stava lavorando
- Area Capo / viste manageriali
- Perimetro recente: `Capo Mezzi` e `Capo Costi Mezzo`

## Stato attuale
- L’Area Capo e ora raggiungibile nel clone con due route dedicate.
- La parte manageriale read-only e stabile; approvazioni e PDF timbrati restano bloccati.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Route clone dedicate
- Lista mezzi manageriale read-only
- Dettaglio costi/documenti manageriale read-only
- Ingresso cliccabile dal `Centro Controllo`

## Prossimo step di migrazione
- Verificare se rendere l’Area Capo raggiungibile anche da altri ingressi clone gia esistenti senza allargare il perimetro ai workflow approvativi.

## Moduli impattati
- `Centro Controllo`
- `Area Capo`
- `Documenti + Costi`
- `Mezzi / Anagrafica flotta`

## Contratti dati coinvolti
- `@mezzi_aziendali`
- `@costiMezzo`
- `@documenti_mezzi`
- `@documenti_magazzino`
- `@documenti_generici`
- `@preventivi_approvazioni`

## Ultime modifiche eseguite
- Aggiunte le route `/next/capo/mezzi` e `/next/capo/costi/:targa`.
- Creata la pagina clone `Capo Mezzi`.
- Creata la pagina clone `Capo Costi Mezzo`.
- Resa cliccabile la card `Area Capo` nel clone.

## File coinvolti
- `src/App.tsx`
- `src/next/NextCapoMezziPage.tsx`
- `src/next/NextCapoCostiMezzoPage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/domain/nextCapoDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Decisioni gia prese
- L’Area Capo nel clone resta interamente read-only.
- `@preventivi_approvazioni` puo essere letto solo come stato informativo.
- `stamp_pdf`, approvazioni e PDF timbrati restano fuori dal perimetro aperto.

## Vincoli da non rompere
- Non toccare la madre.
- Non riattivare writer, export o side effect nel clone.
- Non duplicare la logica costi/documenti in UI se il layer clone gia la copre.

## Parti da verificare
- Eventuale estensione del gating ruolo reale per l’Area Capo quando la matrice permessi sara chiusa.
- Eventuale convergenza futura con Dossier/Analisi senza rompere la parita utile con la madre.

## Rischi aperti
- Il dominio approvazioni resta legacy e sensibile: il clone deve continuare a trattarlo come sola lettura.
- I documenti generici possono avere collegamenti targa incompleti o parziali.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Consolidare eventuali altri ingressi clone verso `Area Capo` solo se servono davvero alla navigazione read-only.

## Cosa NON fare nel prossimo task
- Non aprire approvazioni, rifiuti, `stamp_pdf` o export timbrati.
- Non portare runtime IA legacy dentro l’Area Capo clone.

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

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
