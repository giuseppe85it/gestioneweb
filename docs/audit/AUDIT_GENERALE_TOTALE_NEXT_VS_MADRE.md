# AUDIT GENERALE TOTALE NEXT VS MADRE

## 1. Scopo audit
- Verificare in modo avversariale se la NEXT e davvero uguale alla madre sul perimetro target.
- Verificare il codice reale, non i report esecutivi precedenti.
- Stabilire per ogni modulo uno stato finale ammesso:
  - `CHIUSO`
  - `APERTO`
  - `DA VERIFICARE`
- Chiudere con un verdetto netto sull'autonomia reale della NEXT.

## 2. Fonti lette davvero
- Documenti:
  - `AGENTS.md`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/MATRICE_ESECUTIVA_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
  - `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
  - `docs/data/DOMINI_DATI_CANONICI.md`
  - `docs/data/MAPPA_COMPLETA_DATI.md`
  - `docs/data/REGOLE_STRUTTURA_DATI.md`
  - `docs/security/SICUREZZA_E_PERMESSI.md`
  - `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
  - `docs/product/REGOLE_LAVORO_CODEX.md`
  - `docs/product/STORICO_DECISIONI_PROGETTO.md`
  - audit finali precedenti in `docs/audit/`
  - backlog/report dei prompt 48 e 49
  - change report e continuity report dei prompt 48 e 49
- Routing e shell:
  - `src/App.tsx`
  - `src/next/NextMotherPage.tsx`
- Pagine NEXT lette davvero per il confronto:
  - `src/next/NextHomePage.tsx`
  - `src/next/NextCentroControlloPage.tsx`
  - `src/next/NextCentroControlloParityPage.tsx`
  - `src/next/NextGestioneOperativaPage.tsx`
  - `src/next/NextMezziPage.tsx`
  - `src/next/NextDossierListaPage.tsx`
  - `src/next/NextDossierMezzoPage.tsx`
  - `src/next/NextDossierGommePage.tsx`
  - `src/next/NextDossierRifornimentiPage.tsx`
  - `src/next/NextAnalisiEconomicaPage.tsx`
  - `src/next/NextInventarioPage.tsx`
  - `src/next/NextMaterialiConsegnatiPage.tsx`
  - `src/next/NextMaterialiDaOrdinarePage.tsx`
  - `src/next/NextProcurementStandalonePage.tsx`
  - `src/next/NextCapoMezziPage.tsx`
  - `src/next/NextCapoCostiMezzoPage.tsx`
  - `src/next/NextIntelligenzaArtificialePage.tsx`
  - `src/next/NextIAApiKeyPage.tsx`
  - `src/next/NextIALibrettoPage.tsx`
  - `src/next/NextIADocumentiPage.tsx`
  - `src/next/NextIACoperturaLibrettiPage.tsx`
  - `src/next/NextLibrettiExportPage.tsx`
  - `src/next/NextCisternaPage.tsx`
  - `src/next/NextCisternaIAPage.tsx`
  - `src/next/NextCisternaSchedeTestPage.tsx`
  - `src/next/NextColleghiPage.tsx`
  - `src/next/NextFornitoriPage.tsx`
  - `src/next/NextManutenzioniPage.tsx`
  - `src/next/NextAutistiAdminPage.tsx`
  - `src/next/NextAutistiInboxHomePage.tsx`
  - `src/next/autisti/NextAutistiCloneLayout.tsx`
  - `src/next/autisti/NextHomeAutistaNative.tsx`
  - `src/next/autisti/nextAutistiCloneRuntime.ts`
  - `src/next/autistiInbox/nextAutistiAdminBridges.ts`
- Domain/layer letti davvero:
  - `src/next/nextDateFormat.ts`
  - `src/next/domain/nextManutenzioniDomain.ts`
  - `src/next/domain/nextCentroControlloDomain.ts`
  - `src/next/domain/nextAutistiDomain.ts`
  - `src/next/domain/nextRifornimentiDomain.ts`
  - `src/next/domain/nextProcurementDomain.ts`
  - `src/next/domain/nextCisternaDomain.ts`
  - `src/next/domain/nextIaConfigDomain.ts`
  - `src/next/domain/nextOperativitaGlobaleDomain.ts`
- Pagine madre lette davvero per confronto diretto:
  - `src/pages/Home.tsx`
  - `src/pages/GestioneOperativa.tsx`
  - `src/pages/Manutenzioni.tsx`
  - `src/pages/LibrettiExport.tsx`
  - `src/pages/IA/IAHome.tsx`
  - `src/pages/IA/IAApiKey.tsx`
  - `src/pages/Colleghi.tsx`
  - `src/pages/Fornitori.tsx`
- Verifica madre intoccata:
  - `git status --short -- src/pages src/autisti src/autistiInbox`
  - `git diff --name-only -- src/pages src/autisti src/autistiInbox`

## 3. Perimetro auditato
- Dentro perimetro:
  - Home
  - Centro di Controllo
  - Mezzi
  - Dossier Lista
  - Dossier Mezzo
  - Dossier Gomme
  - Dossier Rifornimenti
  - Gestione Operativa
  - Inventario
  - Materiali consegnati
  - Materiali da ordinare
  - Acquisti / Ordini / Preventivi / Listino
  - Lavori
  - Capo Mezzi
  - Capo Costi
  - IA Home
  - IA API Key
  - IA Libretto
  - IA Documenti
  - IA Copertura Libretti
  - Libretti Export
  - Cisterna
  - Cisterna IA
  - Cisterna Schede Test
  - Colleghi
  - Fornitori
  - Autisti
  - Autisti Inbox / Admin
  - Manutenzioni
- Fuori perimetro:
  - `Mezzo360 / Targa360`
  - `Autista360`

## 4. Verifica runtime finale modulo per modulo
- FATTO VERIFICATO:
  - le route ufficiali del perimetro target passano quasi tutte da pagine `src/next/*` vere;
  - nel routing ufficiale letto in `src/App.tsx` non risultano mount finali di `NextMotherPage` sulle route del perimetro auditato;
  - nel routing ufficiale letto in `src/App.tsx` non risultano mount finali di `src/pages/**`, `src/autisti/**` o `src/autistiInbox/**` sulle route NEXT del perimetro auditato.
- FATTO VERIFICATO:
  - questo NON basta da solo per promuovere un modulo a `CHIUSO`;
  - vari moduli restano `APERTO` perche la pagina NEXT nativa espone esplicitamente flussi `clone-only`, blocchi operativi o sostituzioni locali non equivalenti alla madre.

## 5. Verifica parity esterna modulo per modulo
- FATTO VERIFICATO:
  - `Gestione Operativa` non e piu un hub/workbench con viste incorporate nella route ufficiale `/next/gestione-operativa`;
  - la route ufficiale oggi apre un hub che manda ai moduli figli uno alla volta, come la madre.
- FATTO VERIFICATO:
  - `Home` non e equivalente alla madre sui flussi autisti/eventi perche il modal NEXT blocca ancora `CREAZIONE LAVORO` e `IMPORTAZIONE IN DOSSIER`.
- FATTO VERIFICATO:
  - `Manutenzioni` non e equivalente alla madre: la madre e un modulo pieno con form, materiali, gomme, save/delete/edit e PDF; la NEXT attuale e una lista semplificata.
- FATTO VERIFICATO:
  - `Acquisti / Preventivi / Listino`, `IA Libretto`, `IA Documenti`, `IA Copertura Libretti`, `Cisterna`, `Cisterna IA`, `Cisterna Schede Test`, `Autisti`, `Autisti Inbox / Admin`, `Mezzi`, `Inventario`, `Materiali consegnati`, `Colleghi`, `Fornitori`, `Capo Costi`, `Dossier Mezzo`, `Analisi Economica` espongono nel codice comportamenti clone-only o locali e quindi non sono parity piena della madre.
- NON DIMOSTRATO:
  - parity esterna completa di `Centro di Controllo`, `Dossier Lista`, `Dossier Gomme`, `Dossier Rifornimenti`, `Capo Mezzi`, `Libretti Export`.

## 6. Verifica formato data modulo per modulo
- FATTO VERIFICATO:
  - la NEXT dispone di un formatter centralizzato in `src/next/nextDateFormat.ts` che produce `gg mm aaaa` e `gg mm aaaa HH:MM`.
  - moduli come `Centro di Controllo`, `Gestione Operativa`, `Dossier Mezzo`, `Analisi Economica`, `Capo Costi`, `Cisterna`, `Autisti / Inbox`, `Manutenzioni` usano in modo diretto helper come `formatDateUI`, `formatDateTimeUI`, `formatEditableDateUI`.
- NON DIMOSTRATO:
  - uniformita finale del formato data su tutti i punti visibili dei moduli non confrontati direttamente contro la madre.
- NOTA DURA:
  - per `Manutenzioni` il fatto che il formato sia stato corretto NON basta per promuovere il modulo a `CHIUSO`.

## 7. Verifica layer dati modulo per modulo
- FATTO VERIFICATO:
  - quasi tutto il perimetro auditato legge ormai layer NEXT o state clone dedicate in `src/next/**`;
  - questo migliora l'isolamento dalla madre.
- FATTO VERIFICATO:
  - la presenza di layer NEXT puliti NON basta per chiudere un modulo se il comportamento esterno resta clone-only o se i flussi madre principali sono bloccati.
- FATTO VERIFICATO:
  - `Autisti` e `Autisti Inbox / Admin` mantengono dipendenze legacy critiche su bridge/storage/eventi clone-safe (`nextAutistiCloneRuntime`, `nextAutistiStorageSync`, `nextAutistiAdminBridges`), quindi non sono ancora area autonoma davvero pulita.
- FATTO VERIFICATO:
  - `Manutenzioni` usa un domain NEXT con normalizzazione, ma il confronto live col documento remoto non e stato eseguibile per `permission-denied`; quindi la correttezza finale del dataset visibile rispetto alla madre non e dimostrata.

## 8. Focus speciale `Manutenzioni`
- FATTO VERIFICATO:
  - la madre `src/pages/Manutenzioni.tsx` e un modulo operativo pieno;
  - gestisce form, edit, delete, integrazione materiali, modal gomme e PDF.
- FATTO VERIFICATO:
  - la NEXT `src/next/NextManutenzioniPage.tsx` e una lista letta da `readNextManutenzioniLegacyDataset()`;
  - non replica il cuore operativo della madre.
- FATTO VERIFICATO:
  - il parser/formato data nella NEXT e stato uniformato su `nextDateFormat.ts`;
  - il sort e stato riallineato nel domain.
- GAP REALE:
  - parity esterna del modulo NON raggiunta.
- DA CONSIDERARE OBBLIGATORIAMENTE:
  - il confronto live del documento remoto non e stato eseguibile per `permission-denied`;
  - quindi la totale compatibilita del dataset visibile con la madre NON e dimostrata.
- VERDETTO MODULO:
  - `APERTO`

## 9. Focus speciale `Gestione Operativa`
- FATTO VERIFICATO:
  - la madre `src/pages/GestioneOperativa.tsx` e un hub che apre moduli figli separati.
- FATTO VERIFICATO:
  - la route ufficiale `/next/gestione-operativa` monta `src/next/NextGestioneOperativaPage.tsx`;
  - la pagina ufficiale NON incorpora pannelli-workbench come soluzione finale;
  - i moduli figli vengono aperti con route proprie (`inventario`, `materiali-consegnati`, `manutenzioni`, `centro-controllo`, `attrezzature-cantieri`).
- NON DIMOSTRATO:
  - perfetta identita UI su ogni dettaglio visuale della madre.
- VERDETTO MODULO:
  - `CHIUSO`

## 10. Verifica madre intoccata
- FATTO VERIFICATO:
  - `git status --short -- src/pages src/autisti src/autistiInbox` -> nessuna modifica nel worktree corrente.
  - `git diff --name-only -- src/pages src/autisti src/autistiInbox` -> nessuna differenza nel worktree corrente.
- NON DIMOSTRATO:
  - storia completa di tutti i prompt passati fuori dal worktree corrente.
- VERDETTO:
  - `madre non modificata nel worktree corrente`: SI
  - `storia completa non dimostrabile`: SI

## 11. Moduli `CHIUSO`
- `Gestione Operativa`
- `IA Home`
- `IA API Key`

## 12. Moduli `APERTO`
- `Home`
- `Mezzi`
- `Dossier Mezzo`
- `Inventario`
- `Materiali consegnati`
- `Materiali da ordinare`
- `Acquisti / Ordini / Preventivi / Listino`
- `Lavori`
- `Capo Costi`
- `IA Libretto`
- `IA Documenti`
- `IA Copertura Libretti`
- `Cisterna`
- `Cisterna IA`
- `Cisterna Schede Test`
- `Colleghi`
- `Fornitori`
- `Autisti`
- `Autisti Inbox / Admin`
- `Manutenzioni`

## 13. Moduli `DA VERIFICARE`
- `Centro di Controllo`
- `Dossier Lista`
- `Dossier Gomme`
- `Dossier Rifornimenti`
- `Capo Mezzi`
- `Libretti Export`

## 14. Gap reali residui
- Molti moduli NEXT nativi non montano piu la madre, ma dichiarano nel codice flussi `clone-only`, locali o non sincronizzati con la madre.
- `Home` blocca ancora azioni che nella madre sono operative.
- `Manutenzioni` non replica il modulo madre pieno.
- `Procurement` non replica il comportamento pieno di `Acquisti / Preventivi / Listino`.
- `IA Libretto`, `IA Documenti`, `IA Copertura Libretti` restano preview/local workflow, non controparti operative equivalenti.
- `Cisterna`, `Cisterna IA`, `Cisterna Schede Test` restano verticali clone-safe ma non equivalenti alla madre sui flussi principali.
- `Autisti` e `Autisti Inbox / Admin` restano area non autonoma per bridge/storage clone-only e messaggi espliciti di non sincronizzazione.
- `Mezzi`, `Inventario`, `Materiali consegnati`, `Colleghi`, `Fornitori`, `Capo Costi`, `Dossier Mezzo`, `Analisi Economica` restano non equivalenti alla madre per scritture o operazioni solo locali nel clone.

## 15. Verdetto finale netto
`NO, NEXT non ancora lavorabile in autonomia sul perimetro target`

## Tabella finale

| Modulo | Route/file NEXT ufficiale | Runtime madre montato? SI/NO | Layer NEXT pulito? SI/NO/DA VERIFICARE | Parity esterna dimostrata? SI/NO/DA VERIFICARE | Formato data corretto? SI/NO/DA VERIFICARE | Stato finale | Note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home | `/next` -> `src/next/NextHomePage.tsx` + `src/next/NextCentroControlloPage.tsx` | NO | NO | NO | SI | APERTO | `NextHomeAutistiEventoModal` blocca creazione lavoro/import dossier |
| Centro di Controllo | `/next/centro-controllo` -> `src/next/NextCentroControlloParityPage.tsx` | NO | SI | DA VERIFICARE | SI | DA VERIFICARE | pagina NEXT vera e layer D01/D03/D04, ma parity piena non provata qui |
| Mezzi | `/next/mezzi` -> `src/next/NextMezziPage.tsx` | NO | SI | NO | SI | APERTO | notice esplicita: salvataggi locali al clone NEXT |
| Dossier Lista | `/next/dossiermezzi` -> `src/next/NextDossierListaPage.tsx` | NO | SI | DA VERIFICARE | DA VERIFICARE | DA VERIFICARE | lista native sopra D01, parity UI non confrontata direttamente |
| Dossier Mezzo | `/next/dossier/:targa` -> `src/next/NextDossierMezzoPage.tsx` | NO | SI | NO | SI | APERTO | nasconde documenti solo localmente nel clone |
| Dossier Gomme | `/next/dossier/:targa/gomme` -> `src/next/NextDossierGommePage.tsx` | NO | SI | DA VERIFICARE | DA VERIFICARE | DA VERIFICARE | route nativa, parity sezione non dimostrata integralmente |
| Dossier Rifornimenti | `/next/dossier/:targa/rifornimenti` -> `src/next/NextDossierRifornimentiPage.tsx` | NO | SI | DA VERIFICARE | SI | DA VERIFICARE | route nativa, parity sezione non dimostrata integralmente |
| Gestione Operativa | `/next/gestione-operativa` -> `src/next/NextGestioneOperativaPage.tsx` | NO | SI | SI | SI | CHIUSO | route ufficiale hub, moduli figli aperti uno per volta come la madre |
| Inventario | `/next/inventario` -> `src/next/NextInventarioPage.tsx` | NO | SI | NO | DA VERIFICARE | APERTO | add/edit/delete/foto/PDF restano nel clone |
| Materiali consegnati | `/next/materiali-consegnati` -> `src/next/NextMaterialiConsegnatiPage.tsx` | NO | SI | NO | SI | APERTO | consegne e ripristini stock registrati localmente |
| Materiali da ordinare | `/next/materiali-da-ordinare` -> `src/next/NextMaterialiDaOrdinarePage.tsx` | NO | SI | NO | DA VERIFICARE | APERTO | ordini e preventivi locali al clone |
| Acquisti / Ordini / Preventivi / Listino | `/next/acquisti`, `/next/ordini-in-attesa`, `/next/ordini-arrivati`, `/next/dettaglio-ordine/:ordineId` -> famiglia `src/next/NextProcurementStandalonePage.tsx` | NO | SI | NO | DA VERIFICARE | APERTO | description e notice dichiarano workflow clone-only |
| Lavori | `/next/lavori-*` + `/next/dettagliolavori/:lavoroId` -> `src/next/NextLavori*` | NO | SI | NO | SI | APERTO | restano placeholder/read-only e backlog clone-safe |
| Capo Mezzi | `/next/capo/mezzi` -> `src/next/NextCapoMezziPage.tsx` | NO | SI | DA VERIFICARE | DA VERIFICARE | DA VERIFICARE | lista NEXT vera, parity piena non dimostrata qui |
| Capo Costi | `/next/capo/costi/:targa` -> `src/next/NextCapoCostiMezzoPage.tsx` | NO | SI | NO | SI | APERTO | timbro PDF e approvazioni restano nel clone |
| IA Home | `/next/ia` -> `src/next/NextIntelligenzaArtificialePage.tsx` | NO | SI | SI | DA VERIFICARE | CHIUSO | dashboard e gate API key coerenti con la madre |
| IA API Key | `/next/ia/apikey` -> `src/next/NextIAApiKeyPage.tsx` | NO | SI | SI | DA VERIFICARE | CHIUSO | salva davvero sul documento Firestore `@impostazioni_app/gemini` |
| IA Libretto | `/next/ia/libretto` -> `src/next/NextIALibrettoPage.tsx` | NO | SI | NO | DA VERIFICARE | APERTO | analisi e salvataggio libretto restano clone-only |
| IA Documenti | `/next/ia/documenti` -> `src/next/NextIADocumentiPage.tsx` | NO | SI | NO | DA VERIFICARE | APERTO | niente OCR/upload/scritture business, solo preview e bozze locali |
| IA Copertura Libretti | `/next/ia/copertura-libretti` -> `src/next/NextIACoperturaLibrettiPage.tsx` | NO | SI | NO | DA VERIFICARE | APERTO | repair/upload libretto gestiti solo nel clone |
| Libretti Export | `/next/libretti-export` -> `src/next/NextLibrettiExportPage.tsx` | NO | SI | DA VERIFICARE | DA VERIFICARE | DA VERIFICARE | flusso NEXT con preview PDF; equivalenza piena col madre non provata qui |
| Cisterna | `/next/cisterna` -> `src/next/NextCisternaPage.tsx` | NO | SI | NO | SI | APERTO | cambio EUR/CHF manuale salvato nel clone |
| Cisterna IA | `/next/cisterna/ia` -> `src/next/NextCisternaIAPage.tsx` | NO | SI | NO | DA VERIFICARE | APERTO | upload/provider/save reali non presenti |
| Cisterna Schede Test | `/next/cisterna/schede-test` -> `src/next/NextCisternaSchedeTestPage.tsx` | NO | SI | NO | SI | APERTO | conferma/salvataggio scheda solo nel clone locale |
| Colleghi | `/next/colleghi` -> `src/next/NextColleghiPage.tsx` | NO | SI | NO | DA VERIFICARE | APERTO | aggiunta/modifica/delete esplicitamente nel clone NEXT |
| Fornitori | `/next/fornitori` -> `src/next/NextFornitoriPage.tsx` | NO | SI | NO | DA VERIFICARE | APERTO | aggiunta/modifica/delete esplicitamente nel clone NEXT |
| Autisti | famiglia `/next/autisti/*` -> `src/next/autisti/*` | NO | NO | NO | SI | APERTO | runtime clone-only con notice di non sincronizzazione madre |
| Autisti Inbox / Admin | famiglia `/next/autisti-inbox/*` + `/next/autisti-admin` -> `src/next/NextAutistiInboxHomePage.tsx`, `src/next/NextAutistiAdminPage.tsx` | NO | NO | NO | SI | APERTO | bridge admin/storage locali e dipendenze legacy critiche ancora presenti |
| Manutenzioni | `/next/manutenzioni` -> `src/next/NextManutenzioniPage.tsx` | NO | DA VERIFICARE | NO | SI | APERTO | lista semplificata; non replica madre piena; diff live remoto non eseguito per `permission-denied` |
