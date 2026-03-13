# CONTINUITY REPORT - NEXT clone UI parity

## Contesto generale
- La strategia attiva resta il clone fedele `read-only` della madre su `/next`.
- Questo task ha chiuso i principali gap di parita UI reale nelle aree prioritarie senza riaprire scritture verso la madre.

## Modulo/area su cui si stava lavorando
- Shell globale `/next`
- Shell clone autisti
- Family operativa/procurement
- Dettaglio lavoro
- Autisti Admin
- IA child routes prioritarie
- Cisterna base
- Residui Mezzi/Dossier/Analisi e modal eventi autisti

## Stato attuale
- Le principali route `/next` prioritarie montano ora direttamente le pagine madre reali.
- Il blocco no-write resta clone-side tramite `NextMotherPage`, `nextCloneNavigation` e neutralizzazioni mirate nel modal eventi autisti.

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Shell e routing clone-safe
- UI madre reale riusata su `/next`
- Lettura dati madre mantenuta
- Scritture, upload, delete e submit scriventi bloccati nel clone

## Prossimo step di migrazione
- Rifinire solo i residui rimasti non completamente identici alla madre, in particolare eventuali azioni/modali secondari ancora non coperti dal guard clone-side.

## Moduli impattati
- `Home`
- `Gestione Operativa`
- `Inventario`
- `Materiali Consegnati`
- `Attrezzature Cantieri`
- `Manutenzioni`
- `Acquisti`
- `Materiali Da Ordinare`
- `Ordini In Attesa`
- `Ordini Arrivati`
- `Dettaglio Ordine`
- `Dettaglio Lavoro`
- `Autisti Admin`
- `IA ApiKey`
- `IA Libretto`
- `IA Documenti`
- `IA Copertura Libretti`
- `Cisterna`
- `Mezzi`
- `Dossier Lista`
- `Dossier Mezzo`
- `Analisi Economica`

## Contratti dati coinvolti
- Nessun contratto dati nuovo.
- Restano in lettura i dataset gia usati dalla madre e dal clone read-only.

## Ultime modifiche eseguite
- De-chroming di `NextShell` e `NextAutistiCloneLayout`.
- Introduzione di `NextMotherPage` e `nextCloneNavigation`.
- Sostituzione delle principali pagine `/next` custom con wrapper sottili sulle pagine madre.
- Neutralizzazione clone-side del modal eventi autisti con CTA madre visibili e conferma disabilitata.
- Compatibilita route `:lavoroId` aggiunta a `DettaglioLavoro`.

## File coinvolti
- `src/next/NextMotherPage.tsx`
- `src/next/nextCloneNavigation.ts`
- `src/next/NextShell.tsx`
- `src/next/autisti/NextAutistiCloneLayout.tsx`
- `src/components/AutistiEventoModal.tsx`
- `src/next/components/NextAutistiEventoModal.tsx`
- `src/pages/DettaglioLavoro.tsx`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Decisioni gia prese
- Dove possibile il clone deve riusare direttamente la UI madre.
- Le CTA scriventi devono restare visibili ma bloccate o neutralizzate.
- `Autista 360` e `Mezzo 360` restano fuori dal perimetro di questa parita 1:1 e non vanno forzati nel clone.

## Vincoli da non rompere
- Madre intoccabile lato runtime business.
- Nessuna scrittura reale, delete reale o upload reale dal clone.
- Le modifiche runtime devono restare sotto il perimetro `/next` o in shared/componenti madre solo se il comportamento legacy resta invariato fuori clone.

## Parti da verificare
- Verifica visuale manuale finale su modal e CTA secondarie di procurement e IA.
- Verifica manuale dei punti di uscita residui verso aree fuori perimetro come `Autista 360` / `Mezzo 360`.

## Rischi aperti
- Alcune CTA scriventi sono neutralizzate via guard DOM/text matching: ogni variazione futura delle label madre puo richiedere aggiornamento del blocco clone-side.
- La parita visiva e molto piu alta, ma va confermata con passata QA schermata per schermata.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` -> D05, D06, D07, D09 e standard parita UI clone/madre

## Prossimo passo consigliato
- Fare QA visuale/manuale sulle schermate `/next` prioritarie e chiudere gli ultimi mismatch secondari emersi da uso reale.

## Cosa NON fare nel prossimo task
- Non rifondare `Autista 360` o `Mezzo 360` dentro un task di semplice parita UI.
- Non reintrodurre shell clone custom o pannelli read-only alternativi nelle aree appena riallineate.
- Non spostare il blocco no-write dentro la madre.

## Commit/hash rilevanti
- `c14921a6` - ultimo commit repo prima della patch corrente
- `5359ad5f` - commit recente precedente da usare come contesto storico

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
