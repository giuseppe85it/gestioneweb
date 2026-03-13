# CHANGE REPORT - Parita UI reale clone = madre su `/next`

## Data
- 2026-03-12 20:52

## Tipo task
- ui

## Obiettivo
- Riallineare le principali pagine `/next` alla UI reale della madre, eliminando scaffold clone custom e lasciando nel clone solo il blocco delle azioni scriventi.

## File modificati
- `src/next/NextShell.tsx`
- `src/next/autisti/NextAutistiCloneLayout.tsx`
- `src/next/NextMotherPage.tsx`
- `src/next/nextCloneNavigation.ts`
- `src/next/NextHomePage.tsx`
- `src/next/NextGestioneOperativaPage.tsx`
- `src/next/NextInventarioPage.tsx`
- `src/next/NextMaterialiConsegnatiPage.tsx`
- `src/next/NextAttrezzatureCantieriPage.tsx`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextAcquistiPage.tsx`
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextOrdiniInAttesaPage.tsx`
- `src/next/NextOrdiniArrivatiPage.tsx`
- `src/next/NextDettaglioOrdinePage.tsx`
- `src/next/NextDettaglioLavoroPage.tsx`
- `src/next/NextAutistiAdminPage.tsx`
- `src/next/NextIAApiKeyPage.tsx`
- `src/next/NextIALibrettoPage.tsx`
- `src/next/NextIADocumentiPage.tsx`
- `src/next/NextIACoperturaLibrettiPage.tsx`
- `src/next/NextCisternaPage.tsx`
- `src/next/NextMezziPage.tsx`
- `src/next/NextDossierListaPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/NextAnalisiEconomicaPage.tsx`
- `src/next/components/NextAutistiEventoModal.tsx`
- `src/components/AutistiEventoModal.tsx`
- `src/pages/DettaglioLavoro.tsx`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- Le shell clone admin/autisti sono state de-chromate per avvicinare la percezione globale alla madre.
- Le pagine `/next` prioritarie montano ora direttamente le pagine madre reali invece di versioni scaffold/read-only custom.
- Introdotto `NextMotherPage` per bloccare writer, submit e file input sulle UI madre riusate dentro il clone.
- Introdotta `nextCloneNavigation` per riscrivere la navigazione legacy verso `/next` e non uscire dal perimetro clone.
- Il modal eventi autisti mantiene CTA e modale madre visibili nel clone, ma con conferma finale disabilitata.
- `DettaglioLavoro` madre accetta anche `:lavoroId` nelle route `/next`.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Forte aumento della parita UI reale del clone nelle aree operative prioritarie.
- Nessun nuovo dataset o writer reale verso la madre; il blocco scritture resta clone-side.

## Rischio modifica
- ELEVATO

## Moduli impattati
- NEXT shell globale
- NEXT autisti shell
- Operativita / procurement
- Lavori
- IA child routes
- Cisterna
- Mezzi / Dossier / Analisi
- Autisti Admin

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: D05, D06, D07, D09 e standard UI parity in `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Legacy o Next?
- ENTRAMBI

## Modulo/area NEXT coinvolta
- shell globale / home / operativita / magazzino / dossier / flotta / analisi / IA / cisterna / autisti

## Stato migrazione prima
- Clone con copertura route ampia ma ancora visivamente diverso dalla madre in molte aree chiave.

## Stato migrazione dopo
- Clone molto piu vicino alla madre lato UI reale: le schermate prioritarie usano la UI madre e il clone conserva solo i blocchi no-write.

## Build/Test eseguiti
- `npm run build` -> OK

## Commit hash
- `NON ESEGUITO`

## Stato finale
- COMPLETATO
