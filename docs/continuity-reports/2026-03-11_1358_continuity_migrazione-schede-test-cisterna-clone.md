# CONTINUITY REPORT - Cisterna / Schede Test

## Contesto generale
- Progetto in fase di clone fedele `read-only` della madre su `src/next/*`.
- Barriera no-write attiva nel clone con Fase 1 helper/runtime/fetch e hardening Fase 2 mirato sui writer diretti usati da Cisterna.

## Modulo/area su cui si stava lavorando
- Famiglia `Cisterna`
- Perimetro task recente: migrazione clone-safe del modulo `Schede Test`

## Stato attuale
- Stabili: `/next/cisterna`, `/next/cisterna/ia`, `/next/cisterna/schede-test`.
- In corso: chiusura progressiva dei moduli writer reali nel clone senza toccare la madre.

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Route base Cisterna clone-safe
- Modulo `Cisterna IA` clone-safe
- Modulo `Schede Test` clone-safe con riuso controllato della pagina madre

## Prossimo step di migrazione
- Valutare se conviene collegare dalla base clone Cisterna anche i deep link `edit` dello storico schede verso la nuova route clone, mantenendo bloccati i writer.

## Moduli impattati
- `Cisterna`
- `Cisterna IA`
- `Schede Test`

## Contratti dati coinvolti
- `@cisterna_schede_ia`
- `@rifornimenti_autisti_tmp`
- suggerimenti da `@mezzi_aziendali` e `@colleghi`
- path Storage `documenti_pdf/cisterna_schede/*`

## Ultime modifiche eseguite
- Aggiunta la route clone `/next/cisterna/schede-test`.
- Collegato l'ingresso dalla base clone `/next/cisterna`.
- Adattata la pagina madre per ritorni clone-safe e messaggi chiari quando la barriera blocca estrazione, upload o save/update.

## File coinvolti
- `src/App.tsx`
- `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`
- `src/next/NextCisternaPage.tsx`
- `src/next/NextCisternaSchedeTestPage.tsx`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Decisioni gia prese
- `Schede Test` entra nel clone con riuso controllato della pagina madre, non con reimplementazione completa.
- Upload, estrazione IA e save/update restano fermati dalla barriera no-write del clone.

## Vincoli da non rompere
- Madre intoccabile fuori dal subtree `/next`.
- Nessuna scrittura reale verso Firestore, Storage o endpoint IA dal clone.
- Nessun redesign creativo della famiglia Cisterna.

## Parti da verificare
- Eventuale apertura clone-safe dei deep link `?edit=...` partendo dallo storico dentro `/next/cisterna`.
- Opportunita di aggiornare `docs/STATO_ATTUALE_PROGETTO.md` per riflettere l'apertura del terzo modulo reale Cisterna nel clone.

## Rischi aperti
- Il modulo resta ampio e writer-centrico: la UX clone-safe dipende ancora dalla qualita della gestione errori bloccati.
- La barriera globale resta solo parzialmente distribuita nel resto del repo fuori dal perimetro Cisterna.

## Punti da verificare collegati
- `Governance endpoint IA/PDF multipli`
- `Policy Firestore effettive`

## Prossimo passo consigliato
- Fare un audit rapido dei deep link e dei punti di ingresso interni di `Schede Test` per capire se il clone deve aprire anche l'edit mode dallo storico base Cisterna in modo piu diretto.

## Cosa NON fare nel prossimo task
- Non allargare il lavoro a hardening globale della barriera o ad altri moduli writer fuori da Cisterna.

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
