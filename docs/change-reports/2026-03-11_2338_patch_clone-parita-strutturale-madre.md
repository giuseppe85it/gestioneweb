# CHANGE REPORT - Parita strutturale clone = madre

## Data
- 2026-03-11 23:38

## Tipo task
- next

## Obiettivo
- Chiudere i principali gap di parita strutturale del clone rispetto alla madre, trasformando le aree compresse o query-driven in vere route clone autonome senza toccare la madre e senza riaprire scritture.

## File modificati
- `src/App.tsx`
- `src/next/NextHomePage.tsx`
- `src/next/NextCentroControlloClonePage.tsx`
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
- `src/next/NextLavoriDaEseguirePage.tsx`
- `src/next/NextMezziPage.tsx`
- `src/next/NextDossierListaPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/NextDossierGommePage.tsx`
- `src/next/NextDossierRifornimentiPage.tsx`
- `src/next/NextIntelligenzaArtificialePage.tsx`
- `src/next/NextIAApiKeyPage.tsx`
- `src/next/NextIALibrettoPage.tsx`
- `src/next/NextIADocumentiPage.tsx`
- `src/next/NextIACoperturaLibrettiPage.tsx`
- `src/next/NextLegacyStructuralRedirects.tsx`
- `src/next/nextStructuralPaths.ts`
- `src/next/NextShell.tsx`
- `src/next/next-shell.css`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/NextAutistiInboxHomePage.tsx`
- `src/next/NextAutistiAdminPage.tsx`
- `src/next/NextCisternaPage.tsx`
- `src/next/NextColleghiPage.tsx`
- `src/next/NextFornitoriPage.tsx`
- `src/next/NextCapoMezziPage.tsx`
- `src/next/NextCapoCostiMezzoPage.tsx`
- `src/next/NextLavoriInAttesaPage.tsx`
- `src/next/NextLavoriEseguitiPage.tsx`
- `src/next/NextAccessDeniedPage.tsx`
- `src/next/NextDriverExperiencePage.tsx`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/nextData.ts`
- `src/next/nextAccess.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- `/next` smette di essere un redirect tecnico e diventa la vera `Home` clone, mentre `/next/centro-controllo` replica finalmente la pagina madre `CentroControllo` come route autonoma distinta.
- `Gestione Operativa` viene spacchettata in route vere clone-safe per inventario, materiali consegnati, attrezzature cantieri, manutenzioni, acquisti, materiali da ordinare, ordini, dettaglio ordine e lavori da eseguire, lasciando i vecchi path compressi solo come redirect di compatibilita.
- `Mezzi` e `Dossier Mezzi` vengono separati come nella madre; `Dossier Gomme` e `Dossier Rifornimenti` smettono di vivere solo come `?view=` e diventano pagine clone autonome.
- L'hub IA viene riallineato alla famiglia completa di child route (`apikey`, `libretto`, `documenti`, `copertura-libretti`) con pagine clone dedicate e scritture neutralizzate.
- Shell, quick link e metadata vengono aggiornati ai nuovi path canonici, mantenendo l'intero perimetro sotto `/next`.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Navigazione clone molto piu vicina alla madre sul piano di struttura, pagine autonome e deep link.
- Minore dipendenza da mega-pagine query-driven o subview interne per raggiungere moduli gia attivi.
- Nessun impatto sulle scritture reali della madre, che restano bloccate o neutralizzate.

## Rischio modifica
- ELEVATO

## Moduli impattati
- Shell NEXT
- Home clone
- Centro Controllo clone
- Gestione Operativa / Procurement
- Mezzi / Dossier
- Lavori
- IA

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: parita strutturale clone = madre

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- routing clone

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI, se si vuole registrare ufficialmente la nuova regola progettuale "clone strutturalmente uguale alla madre"

## Rischi / attenzione
- `Autisti Inbox` e altri wrapper che riusano componenti madre possono ancora avere alcuni ritorni interni non perfettamente riallineati senza ulteriori adapter.
- `Autista 360` e `Mezzo 360` restano fuori e non vanno trattati come semplice import mancante.
- Le nuove route IA sono strutturalmente presenti ma restano neutralizzate lato configurazione, upload, analisi e salvataggi.

## Build/Test eseguiti
- `npm run build` -> OK

## Commit hash
- `NON ESEGUITO`

## Stato finale
- FATTO
