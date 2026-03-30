# AUDIT FINALE MODULI `DA VERIFICARE` - NEXT AUTONOMA

Data audit: 2026-03-30  
Stato: CURRENT  
Tipo: audit puro avversariale sul solo bucket `DA VERIFICARE`

## 1. Scopo audit
- Verificare solo i moduli rimasti `DA VERIFICARE` dopo i prompt 42, 43 e 44.
- Stabilire per ogni modulo uno stato finale netto:
  - `CHIUSO`
  - `APERTO`
  - `DA VERIFICARE`
- Chiudere il verdetto finale sulla domanda:
  - `SI, NEXT lavorabile in autonomia sul perimetro target`
  - oppure
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`

## 2. Fonti lette davvero

### 2.1 Documenti letti davvero
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- `docs/audit/AUDIT_VERIFICA_FINALE_NEXT_AUTONOMA.md`
- `docs/audit/AUDIT_FINALE_POST_PROMPT_42_NEXT_AUTONOMA.md`
- `docs/audit/BACKLOG_GAP_AUDIT_FINALE_EXECUTION.md`
- `docs/audit/BACKLOG_GAP_PARZIALI_EXECUTION.md`
- `docs/change-reports/2026-03-30_1124_prompt44_chiusura-gap-parziali.md`
- `docs/continuity-reports/2026-03-30_1124_continuity_prompt44_chiusura-gap-parziali.md`

### 2.2 Routing e runtime NEXT letti davvero
- `src/App.tsx`
- `src/next/NextHomePage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/NextCentroControlloParityPage.tsx`
- `src/next/NextDossierListaPage.tsx`
- `src/next/NextDossierGommePage.tsx`
- `src/next/NextDossierRifornimentiPage.tsx`
- `src/next/NextCapoMezziPage.tsx`
- `src/next/NextLibrettiExportPage.tsx`
- `src/next/NextGommeEconomiaSection.tsx`
- `src/next/NextRifornimentiEconomiaSection.tsx`
- `src/next/NextLegacyStorageBoundary.tsx`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/next/domain/nextCapoDomain.ts`
- `src/next/domain/nextLibrettiExportDomain.ts`

### 2.3 File madre letti davvero per confronto
- `src/pages/Home.tsx`
- `src/pages/CentroControllo.tsx`
- `src/pages/DossierLista.tsx`
- `src/pages/DossierGomme.tsx`
- `src/pages/DossierRifornimenti.tsx`
- `src/pages/GommeEconomiaSection.tsx`
- `src/pages/RifornimentiEconomiaSection.tsx`
- `src/pages/CapoMezzi.tsx`
- `src/pages/LibrettiExport.tsx`

### 2.4 Verifiche repo eseguite davvero
- `git status --short -- src/pages src/autisti src/autistiInbox`
- `git diff --name-only -- src/pages src/autisti src/autistiInbox`
- ricerca testuale in `src/App.tsx` e `src/next/**` per route/file ufficiali del bucket `DA VERIFICARE`
- confronto puntuale tra file NEXT e controparti madre

## 3. Moduli auditati
- `Home`
- `Centro di Controllo`
- `Dossier Lista`
- `Dossier Gomme`
- `Dossier Rifornimenti`
- `Capo Mezzi`
- `Libretti Export`

## 4. Verifica runtime finale modulo per modulo
- `Home`
  - route ufficiale: `/next` -> `src/next/NextHomePage.tsx`
  - `NextMotherPage`: `NO`
  - `src/pages/**` runtime finale: `NO`
  - `src/autisti/**` runtime finale: `NO`
  - `src/autistiInbox/**` runtime finale: `NO`
  - nota: la route monta `NextLegacyStorageBoundary` + `NextCentroControlloPage`, quindi il runtime e NEXT ma passa ancora da un boundary legacy-shaped.
- `Centro di Controllo`
  - route ufficiale: `/next/centro-controllo` -> `src/next/NextCentroControlloParityPage.tsx`
  - runtime madre finale: `NO`
- `Dossier Lista`
  - route ufficiale: `/next/dossiermezzi` -> `src/next/NextDossierListaPage.tsx`
  - runtime madre finale: `NO`
- `Dossier Gomme`
  - route ufficiale: `/next/dossier/:targa/gomme` -> `src/next/NextDossierGommePage.tsx`
  - runtime madre finale: `NO`
- `Dossier Rifornimenti`
  - route ufficiale: `/next/dossier/:targa/rifornimenti` -> `src/next/NextDossierRifornimentiPage.tsx`
  - runtime madre finale: `NO`
- `Capo Mezzi`
  - route ufficiale: `/next/capo/mezzi` -> `src/next/NextCapoMezziPage.tsx`
  - runtime madre finale: `NO`
- `Libretti Export`
  - route ufficiale: `/next/libretti-export` -> `src/next/NextLibrettiExportPage.tsx`
  - runtime madre finale: `NO`

## 5. Verifica parity esterna modulo per modulo
- `Home`
  - UI madre-like: `SI`
  - flussi principali equivalenti: `NO`
  - prova: la pagina NEXT usa `appendNextHomeCloneEvento`, `upsertNextHomeCloneMezzoPatch` e `writeNextHomeCloneAlertsState`, mentre la madre aggiorna davvero `EVENTI_KEY`, `MEZZI_KEY` e `ALERTS_STATE_KEY` via `setItemSync`.
  - conclusione: la pagina replica la forma esterna, ma i flussi principali di prenotazione/pre-collaudo/revisione/alert non sono equivalenti al comportamento madre.
- `Centro di Controllo`
  - UI esterna equivalente: `SI`
  - flussi principali equivalenti: `SI`
  - modali principali equivalenti: `SI`
  - report/PDF principali equivalenti: `SI`
  - prova: stessa struttura a tab, stessi filtri, stesse tabelle/sezioni e anteprime PDF manutenzioni/rifornimenti presenti sia nella madre sia in `NextCentroControlloParityPage`.
- `Dossier Lista`
  - UI esterna equivalente: `SI`
  - flussi principali equivalenti: `SI`
  - prova: stessa schermata categorie -> mezzi -> link al dossier, stesso layout e stessa navigazione pratica.
- `Dossier Gomme`
  - UI esterna equivalente: `SI`
  - flussi principali equivalenti: `SI`
  - prova: `NextDossierGommePage` replica header e navigazione; `NextGommeEconomiaSection` replica card statistiche, ultima sostituzione, storico, grafico costi e grafico durata.
- `Dossier Rifornimenti`
  - UI esterna equivalente: `SI`
  - flussi principali equivalenti: `SI`
  - prova: `NextDossierRifornimentiPage` replica header e navigazione; `NextRifornimentiEconomiaSection` replica storico, grafici, selezione `START/END`, calcolo range e vista giornaliera.
- `Capo Mezzi`
  - UI esterna equivalente: `SI`
  - flussi principali equivalenti: `SI`
  - prova: stessa griglia per gruppi, stessa ricerca per targa, stesse card costo/potenziale, stesso ingresso al dettaglio costi per mezzo.
- `Libretti Export`
  - UI esterna equivalente: `NO`
  - flussi principali equivalenti: `NO`
  - prova:
    - la madre raggruppa per categoria e usa card selezionabili;
    - la NEXT usa un layout tabellare piatto in `NextClonePageScaffold`;
    - il domain NEXT dichiara ancora tra i limiti che il clone apre solo lista/selezione/anteprima locale.
  - conclusione: non e piu mount legacy, ma non e parita esterna equivalente alla madre.

## 6. Verifica layer dati modulo per modulo
- `Home`
  - layer NEXT pulito: `NO`
  - prova: la route dipende da `NextLegacyStorageBoundary` e le azioni principali sono riversate in stato clone-only `nextHomeCloneState`.
- `Centro di Controllo`
  - layer NEXT pulito: `SI`
  - prova: legge `readNextAnagraficheFlottaSnapshot`, `readNextRifornimentiReadOnlySnapshot`, `readNextAutistiReadOnlySnapshot`.
- `Dossier Lista`
  - layer NEXT pulito: `SI`
  - prova: legge `readNextAnagraficheFlottaSnapshot`.
- `Dossier Gomme`
  - layer NEXT pulito: `SI`
  - prova: legge `readNextMezzoManutenzioniGommeSnapshot` e mappa in vista legacy dal domain NEXT, senza accessi diretti in pagina.
- `Dossier Rifornimenti`
  - layer NEXT pulito: `SI`
  - prova: legge `readNextMezzoRifornimentiSnapshot`; la complessita legacy resta confinata nel domain `D04`.
- `Capo Mezzi`
  - layer NEXT pulito: `SI`
  - prova: legge `readNextCapoMezziSnapshot`, che compone anagrafiche flotta + documenti/costi NEXT.
- `Libretti Export`
  - layer NEXT pulito: `SI`
  - prova: legge `readNextLibrettiExportSnapshot`.
  - limite: il layer e pulito, ma la parity esterna del modulo non e chiusa.

## 7. Moduli promossi a `CHIUSO`
- `Centro di Controllo`
- `Dossier Lista`
- `Dossier Gomme`
- `Dossier Rifornimenti`
- `Capo Mezzi`

## 8. Moduli promossi a `APERTO`
- `Home`
- `Libretti Export`

## 9. Moduli che restano `DA VERIFICARE`
- Nessuno nel bucket auditato.

## 10. Verdetto finale sulla NEXT
- Verdetto obbligatorio:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`
- Motivo:
  - il bucket `DA VERIFICARE` non resta piu sospeso;
  - ma dentro quel bucket esistono ancora due moduli target `APERTO`:
    - `Home`
    - `Libretti Export`

## 11. Gap reali residui
- `Home`
  - gap reale: i flussi principali della home madre non sono equivalenti nel clone;
  - prova: modali e azioni persistono su stato clone-only invece che sul comportamento madre equivalente;
  - dipendenza sostanziale residua: `NextLegacyStorageBoundary`.
- `Libretti Export`
  - gap reale: la UI esterna e il flusso della superficie non sono equivalenti alla madre;
  - prova: madre a gruppi/carte selezionabili, NEXT a tabella piatta; il domain NEXT dichiara ancora limiti clone-only.
- `madre intoccata`
  - `madre non modificata nel worktree corrente`: `SI`
  - prova: `git status --short -- src/pages src/autisti src/autistiInbox` -> vuoto
  - prova: `git diff --name-only -- src/pages src/autisti src/autistiInbox` -> vuoto
  - `storia completa non modificata`: `NON DIMOSTRABILE` da questo audit puro

## 12. Conclusione netta
- Il bucket `DA VERIFICARE` non resta piu in sospeso:
  - `Centro di Controllo`, `Dossier Lista`, `Dossier Gomme`, `Dossier Rifornimenti`, `Capo Mezzi` -> `CHIUSO`
  - `Home`, `Libretti Export` -> `APERTO`
- Verdetto finale netto:
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`

## Tabella finale

| Modulo | Route/file NEXT ufficiale | Runtime madre montato? | Layer NEXT pulito? | Parity esterna dimostrata? | Stato finale | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Home | `/next` -> `src/next/NextHomePage.tsx` | NO | NO | NO | APERTO | Runtime NEXT, ma boundary legacy-shaped e flussi principali su stato clone-only. |
| Centro di Controllo | `/next/centro-controllo` -> `src/next/NextCentroControlloParityPage.tsx` | NO | SI | SI | CHIUSO | Tab, filtri, tabelle e PDF manutenzioni/rifornimenti risultano equivalenti. |
| Dossier Lista | `/next/dossiermezzi` -> `src/next/NextDossierListaPage.tsx` | NO | SI | SI | CHIUSO | Stessa UI categorie -> mezzi -> ingresso dossier. |
| Dossier Gomme | `/next/dossier/:targa/gomme` -> `src/next/NextDossierGommePage.tsx` | NO | SI | SI | CHIUSO | Wrapper e sezione economica equivalenti alla madre. |
| Dossier Rifornimenti | `/next/dossier/:targa/rifornimenti` -> `src/next/NextDossierRifornimentiPage.tsx` | NO | SI | SI | CHIUSO | Wrapper e sezione rifornimenti equivalenti, complessita legacy confinata nel domain. |
| Capo Mezzi | `/next/capo/mezzi` -> `src/next/NextCapoMezziPage.tsx` | NO | SI | SI | CHIUSO | Lista/gruppi/ricerca/card equivalenti sopra `nextCapoDomain`. |
| Libretti Export | `/next/libretti-export` -> `src/next/NextLibrettiExportPage.tsx` | NO | SI | NO | APERTO | Layout e flusso non equivalenti alla madre; limiti clone-only ancora dichiarati nel domain. |
