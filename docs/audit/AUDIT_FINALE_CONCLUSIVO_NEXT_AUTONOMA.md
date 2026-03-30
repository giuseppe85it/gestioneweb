# Audit Finale Conclusivo NEXT Autonoma

## 1. Scopo audit
- Verificare nel codice reale, dopo i prompt 42-46, se la NEXT sia davvero lavorabile in autonomia sul perimetro target.
- Verificare modulo per modulo:
  - runtime finale;
  - parity esterna reale;
  - layer dati;
  - assenza di mount finale della madre.
- Dare un solo verdetto finale netto:
  - `SI, NEXT lavorabile in autonomia sul perimetro target`
  - `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`

## 2. Fonti lette davvero
- Documenti:
  - `AGENTS.md`
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/MATRICE_ESECUTIVA_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
  - `docs/audit/AUDIT_VERIFICA_FINALE_NEXT_AUTONOMA.md`
  - `docs/audit/AUDIT_FINALE_POST_PROMPT_42_NEXT_AUTONOMA.md`
  - `docs/audit/AUDIT_FINALE_DA_VERIFICARE_NEXT_AUTONOMA.md`
  - `docs/audit/BACKLOG_GAP_AUDIT_FINALE_EXECUTION.md`
  - `docs/audit/BACKLOG_GAP_PARZIALI_EXECUTION.md`
  - `docs/audit/BACKLOG_ULTIMI_2_APERTI_EXECUTION.md`
  - `docs/change-reports/2026-03-30_1124_prompt44_chiusura-gap-parziali.md`
  - `docs/continuity-reports/2026-03-30_1124_continuity_prompt44_chiusura-gap-parziali.md`
  - `docs/change-reports/2026-03-30_1755_prompt45_audit-finale-da-verificare-next-autonoma.md`
  - `docs/continuity-reports/2026-03-30_1755_continuity_prompt45_audit-finale-da-verificare-next-autonoma.md`
  - `docs/change-reports/2026-03-30_1408_prompt46_chiusura-home-libretti-export.md`
  - `docs/continuity-reports/2026-03-30_1408_continuity_prompt46_chiusura-home-libretti-export.md`
- Routing/runtime NEXT:
  - `src/App.tsx`
  - `src/next/NextHomePage.tsx`
  - `src/next/NextCentroControlloPage.tsx`
  - `src/next/NextCentroControlloParityPage.tsx`
  - `src/next/NextGestioneOperativaPage.tsx`
  - `src/next/NextOperativitaGlobalePage.tsx`
  - `src/next/NextInventarioPage.tsx`
  - `src/next/NextMaterialiConsegnatiPage.tsx`
  - `src/next/NextMaterialiDaOrdinarePage.tsx`
  - `src/next/NextAcquistiPage.tsx`
  - `src/next/NextProcurementStandalonePage.tsx`
  - `src/next/NextProcurementReadOnlyPanel.tsx`
  - `src/next/NextDettaglioOrdinePage.tsx`
  - `src/next/NextLavoriDaEseguirePage.tsx`
  - `src/next/NextLavoriInAttesaPage.tsx`
  - `src/next/NextLavoriEseguitiPage.tsx`
  - `src/next/NextDettaglioLavoroPage.tsx`
  - `src/next/NextMezziPage.tsx`
  - `src/next/NextDossierListaPage.tsx`
  - `src/next/NextDossierMezzoPage.tsx`
  - `src/next/NextDossierGommePage.tsx`
  - `src/next/NextDossierRifornimentiPage.tsx`
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
  - `src/next/NextAutistiHomePage.tsx`
  - `src/next/NextAutistiAdminPage.tsx`
  - `src/next/NextLegacyStorageBoundary.tsx`
  - `src/next/autisti/NextAutistiCloneLayout.tsx`
  - `src/next/autisti/nextAutistiCloneRuntime.ts`
  - `src/next/autisti/NextHomeAutistaNative.tsx`
  - `src/next/autisti/NextGommeAutistaModal.tsx`
  - `src/next/autistiInbox/nextAutistiAdminBridges.ts`
  - `src/next/autistiInbox/NextAutistiAdminNative.tsx`
- Domain/layer NEXT:
  - `src/next/domain/nextAutistiDomain.ts`
  - `src/next/domain/nextLibrettiExportDomain.ts`
  - `src/next/domain/nextCapoDomain.ts`
  - `src/next/domain/nextRifornimentiDomain.ts`
  - `src/next/domain/nextManutenzioniGommeDomain.ts`
- Madre usata per confronto:
  - `src/pages/Home.tsx`
  - `src/pages/CentroControllo.tsx`
  - `src/pages/DossierLista.tsx`
  - `src/pages/DossierGomme.tsx`
  - `src/pages/DossierRifornimenti.tsx`
  - `src/pages/CapoMezzi.tsx`
  - `src/pages/LibrettiExport.tsx`
  - `src/pages/IA/IAHome.tsx`
  - `src/pages/IA/IAApiKey.tsx`
  - `src/autisti/HomeAutista.tsx`
  - `src/autisti/GommeAutistaModal.tsx`

## 3. Perimetro target auditato
- Dentro il perimetro:
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
- Fuori perimetro:
  - `Mezzo360 / Targa360`
  - `Autista360`

## 4. Verifica runtime finale modulo per modulo
- In `src/App.tsx` le route ufficiali del perimetro target montano componenti NEXT e non montano `NextMotherPage` come runtime finale.
- L'audit non ha trovato route ufficiali NEXT del perimetro target che montino `src/pages/**`, `src/autisti/**` o `src/autistiInbox/**` come runtime finale.
- Esiste ancora `src/next/NextCentroControlloClonePage.tsx` con import della madre, ma il file non e montato dalla route ufficiale `/next/centro-controllo`.

## 5. Verifica parity esterna modulo per modulo
- La parity esterna e dimostrabile per quasi tutto il perimetro target.
- Restano due gap sostanziali:
  - `IA API Key`: la UI esterna e quasi identica alla madre, ma il flusso principale di salvataggio e bloccato nel clone.
  - `Autisti`: la home autisti resta clone-safe e navigabile, ma il salvataggio del modale `Gomme` viene ancora intercettato e bloccato nel clone.

## 6. Verifica layer dati modulo per modulo
- Il perimetro target usa layer NEXT o adapter clone-safe locali per la lettura e per gli overlay locali del clone.
- Il gap sostanziale sui layer non e il mount della madre, ma il fatto che:
  - `IA API Key` non ricostruisce il writer principale della madre in forma clone-safe equivalente;
  - `Autisti` passa ancora da `NextLegacyStorageBoundary` e da una guardia runtime che blocca il salvataggio del modale `Gomme`.

## Tabella finale obbligatoria
| Modulo | Route/file NEXT ufficiale | Runtime madre montato? | Layer NEXT pulito? | Parity esterna dimostrata? | Stato finale | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Home | `/next` -> `src/next/NextHomePage.tsx` | NO | SI | SI | `CHIUSO` | `NextHomePage` monta `NextCentroControlloPage`; modale eventi autisti NEXT clone-safe. |
| Centro di Controllo | `/next/centro-controllo` -> `src/next/NextCentroControlloParityPage.tsx` | NO | SI | SI | `CHIUSO` | Route ufficiale parity page; `NextCentroControlloClonePage.tsx` non e montata. |
| Mezzi | `/next/mezzi` -> `src/next/NextMezziPage.tsx` | NO | SI | SI | `CHIUSO` | Foto, libretto, save/delete e dossier sopra layer NEXT/clone. |
| Dossier Lista | `/next/dossiermezzi` -> `src/next/NextDossierListaPage.tsx` | NO | SI | SI | `CHIUSO` | Lista dossier nativa NEXT. |
| Dossier Mezzo | `/next/dossier/:targa` -> `src/next/NextDossierMezzoPage.tsx` | NO | SI | SI | `CHIUSO` | Blocchi, modali e preview dossier su composite snapshot NEXT. |
| Dossier Gomme | `/next/dossier/:targa/gomme` -> `src/next/NextDossierGommePage.tsx` | NO | SI | SI | `CHIUSO` | Sezione gomme nativa NEXT. |
| Dossier Rifornimenti | `/next/dossier/:targa/rifornimenti` -> `src/next/NextDossierRifornimentiPage.tsx` | NO | SI | SI | `CHIUSO` | Sezione rifornimenti nativa NEXT. |
| Gestione Operativa | `/next/gestione-operativa` -> `src/next/NextGestioneOperativaPage.tsx` | NO | SI | SI | `CHIUSO` | Re-export verso `NextOperativitaGlobalePage` nativa NEXT. |
| Inventario | `/next/inventario` -> `src/next/NextInventarioPage.tsx` | NO | SI | SI | `CHIUSO` | CRUD clone-safe, foto e PDF attivi. |
| Materiali consegnati | `/next/materiali-consegnati` -> `src/next/NextMaterialiConsegnatiPage.tsx` | NO | SI | SI | `CHIUSO` | Consegna, delete con ripristino stock e PDF attivi. |
| Materiali da ordinare | `/next/materiali-da-ordinare` -> `src/next/NextMaterialiDaOrdinarePage.tsx` | NO | SI | SI | `CHIUSO` | Flusso fabbisogni e conferma ordine clone-only attivi. |
| Acquisti / Ordini / Preventivi / Listino | `/next/acquisti` -> `src/next/NextProcurementStandalonePage.tsx` | NO | SI | SI | `CHIUSO` | Route ordini/arrivi/dettaglio e modali procurement attivi nel clone. |
| Lavori | `/next/lavori-da-eseguire` -> `src/next/NextLavoriDaEseguirePage.tsx` | NO | SI | SI | `CHIUSO` | Liste e dettaglio lavori nativi NEXT con stato clone-only. |
| Capo Mezzi | `/next/capo/mezzi` -> `src/next/NextCapoMezziPage.tsx` | NO | SI | SI | `CHIUSO` | Lista capi mezzi con salto al dettaglio costi. |
| Capo Costi | `/next/capo/costi/:targa` -> `src/next/NextCapoCostiMezzoPage.tsx` | NO | SI | SI | `CHIUSO` | Approvazioni clone-only e preview PDF/timbrato locali. |
| IA Home | `/next/ia` -> `src/next/NextIntelligenzaArtificialePage.tsx` | NO | SI | SI | `CHIUSO` | Dashboard IA allineata alla madre. |
| IA API Key | `/next/ia/apikey` -> `src/next/NextIAApiKeyPage.tsx` | NO | SI | NO | `APERTO` | `NextIAApiKeyPage` mostra `Clone read-only: il salvataggio della chiave resta disponibile solo nella madre.` mentre `src/pages/IA/IAApiKey.tsx` salva davvero con `setDoc(...)`. |
| IA Libretto | `/next/ia/libretto` -> `src/next/NextIALibrettoPage.tsx` | NO | SI | SI | `CHIUSO` | Analisi e salvataggio clone-safe del libretto attivi. |
| IA Documenti | `/next/ia/documenti` -> `src/next/NextIADocumentiPage.tsx` | NO | SI | SI | `CHIUSO` | Analisi documenti e salvataggi clone-safe attivi. |
| IA Copertura Libretti | `/next/ia/copertura-libretti` -> `src/next/NextIACoperturaLibrettiPage.tsx` | NO | SI | SI | `CHIUSO` | Repair batch e upload clone-safe attivi. |
| Libretti Export | `/next/libretti-export` -> `src/next/NextLibrettiExportPage.tsx` | NO | SI | SI | `CHIUSO` | UI madre-like a gruppi/carte con preview PDF. |
| Cisterna | `/next/cisterna` -> `src/next/NextCisternaPage.tsx` | NO | SI | SI | `CHIUSO` | Archivio/report/targhe con export mensile clone-safe. |
| Cisterna IA | `/next/cisterna/ia` -> `src/next/NextCisternaIAPage.tsx` | NO | SI | SI | `CHIUSO` | Analisi documenti cisterna e salvataggio clone-safe. |
| Cisterna Schede Test | `/next/cisterna/schede-test` -> `src/next/NextCisternaSchedeTestPage.tsx` | NO | SI | SI | `CHIUSO` | Schede manuali e IA clone-only attive. |
| Colleghi | `/next/colleghi` -> `src/next/NextColleghiPage.tsx` | NO | SI | SI | `CHIUSO` | CRUD clone-safe e PDF attivi. |
| Fornitori | `/next/fornitori` -> `src/next/NextFornitoriPage.tsx` | NO | SI | SI | `CHIUSO` | CRUD clone-safe e PDF attivi. |
| Autisti | `/next/autisti/*` -> `src/next/autisti/NextAutistiCloneLayout.tsx` + `src/next/NextAutistiHomePage.tsx` | NO | DA VERIFICARE | NO | `APERTO` | `NextAutistiCloneLayout` intercetta il pulsante `SALVA` del modale gomme e mostra `gomme-salvataggio-bloccato`; la madre in `src/autisti/HomeAutista.tsx` espone `GommeAutistaModal` con save attivo. |
| Autisti Inbox / Admin | `/next/autisti-admin` -> `src/next/NextAutistiAdminPage.tsx` | NO | SI | SI | `CHIUSO` | Bridge admin clone-only locale e pagina admin NEXT senza runtime madre finale. |

## 7. Verifica madre intoccata
- `git status --short -- src/pages src/autisti src/autistiInbox` -> vuoto.
- `git diff --name-only -- src/pages src/autisti src/autistiInbox` -> vuoto.
- Fatti verificati:
  - `madre non modificata nel worktree corrente`
- Limite esplicito:
  - `storia completa non dimostrabile` da questo audit.

## 8. Moduli `CHIUSO`
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
- IA Libretto
- IA Documenti
- IA Copertura Libretti
- Libretti Export
- Cisterna
- Cisterna IA
- Cisterna Schede Test
- Colleghi
- Fornitori
- Autisti Inbox / Admin

## 9. Moduli `APERTO`
- IA API Key
- Autisti

## 10. Moduli `DA VERIFICARE`
- Nessuno.

## 11. Gap reali residui
- `IA API Key`
  - `NextIAApiKeyPage.tsx` mantiene la UI madre-like ma blocca il flusso principale di salvataggio con il messaggio `Clone read-only: il salvataggio della chiave resta disponibile solo nella madre.`
  - `src/pages/IA/IAApiKey.tsx` salva invece davvero con `setDoc(...)`.
- `Autisti`
  - il runtime finale e NEXT, ma il modulo non e ancora equivalente sui flussi principali perche `NextAutistiCloneLayout.tsx` intercetta il salvataggio del modale `Gomme` in home e lo blocca con il notice `gomme-salvataggio-bloccato`;
  - la madre in `src/autisti/HomeAutista.tsx` monta `GommeAutistaModal` con salvataggio attivo.

## 12. Verdetto finale netto sulla NEXT
- `NO, NEXT non ancora lavorabile in autonomia sul perimetro target`
- Motivo netto:
  - il problema `mount finale della madre` risulta chiuso sulle route ufficiali;
  - non restano moduli `DA VERIFICARE`;
  - restano pero ancora `APERTO` due moduli del perimetro target con gap sostanziali sui flussi principali:
    - `IA API Key`
    - `Autisti`
