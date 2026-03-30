# Change Report - Prompt 42 - Procedura madre->clone e chiusura gap audit finale

Data: 2026-03-30 10:12  
Prompt: 42  
Rischio: EXTRA ELEVATO

## Obiettivo
Creare il file procedurale ufficiale `madre -> clone/NEXT` e usarlo subito per chiudere nel perimetro whitelistato i gap reali confermati dall'audit finale, senza toccare la madre e senza auto-certificare la NEXT come autonoma.

## File toccati
- `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- `docs/audit/BACKLOG_GAP_AUDIT_FINALE_EXECUTION.md`
- `src/next/autisti/nextAutistiStorageSync.ts`
- `src/next/autisti/nextAutistiHomeEvents.ts`
- `src/next/autisti/NextModalGomme.tsx`
- `src/next/autisti/NextGommeAutistaModal.tsx`
- `src/next/autisti/NextHomeAutistaNative.tsx`
- `src/next/autisti/NextLoginAutistaNative.tsx`
- `src/next/autisti/NextSetupMezzoNative.tsx`
- `src/next/autisti/NextAutistiSegnalazioniPage.tsx`
- `src/next/autistiInbox/nextAutistiAdminBridges.ts`
- `src/next/autistiInbox/NextAutistiAdminNative.tsx`
- `src/next/autistiInbox/NextAutistiInboxHomeNative.tsx`
- `src/next/autistiInbox/NextCambioMezzoInboxNative.tsx`
- `src/next/autistiInbox/NextAutistiControlliAllNative.tsx`
- `src/next/autistiInbox/NextAutistiGommeAllNative.tsx`
- `src/next/autistiInbox/NextAutistiLogAccessiAllNative.tsx`
- `src/next/autistiInbox/NextAutistiSegnalazioniAllNative.tsx`
- `src/next/autistiInbox/NextRichiestaAttrezzatureAllNative.tsx`
- `src/next/NextAutistiCambioMezzoPage.tsx`
- `src/next/NextAutistiGatePage.tsx`
- `src/next/domain/nextAutistiDomain.ts`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/domain/nextProcurementDomain.ts`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Cambiamenti runtime
- Creato `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md` come contratto operativo stabile: madre intoccabile, NEXT unico perimetro sicuro, no mount finale della madre, layer NEXT puliti, clone read-only, chiusura modulo meccanica, separazione `execution != audit`.
- Creato e chiuso `docs/audit/BACKLOG_GAP_AUDIT_FINALE_EXECUTION.md` usando solo i gap reali aperti dall'audit finale.
- `Autisti / Inbox` non dipende piu da helper condivisi critici o da bridge Firebase/Storage legacy-shaped:
  - introdotti adapter NEXT locali per storage/eventi;
  - introdotti modali gomme NEXT locali;
  - riscritto il bridge admin come bridge clone-only locale;
  - spostato il writer lavori admin su `appendNextLavoriCloneRecords()`.

## Impatto
- UI:
  - le route ufficiali del perimetro target risultano montate su componenti NEXT.
- Dati:
  - `Autisti / Inbox` legge da adapter NEXT locali e da domain/read model clone-safe.
- Scritture:
  - nessuna scrittura business reale riaperta;
  - le sole mutazioni restano overlay clone-only locali.

## Verifiche
- `npx eslint src/next/autisti/nextAutistiStorageSync.ts src/next/autisti/nextAutistiHomeEvents.ts src/next/autisti/NextModalGomme.tsx src/next/autisti/NextGommeAutistaModal.tsx src/next/autisti/NextHomeAutistaNative.tsx src/next/autisti/NextLoginAutistaNative.tsx src/next/autisti/NextSetupMezzoNative.tsx src/next/autisti/NextAutistiSegnalazioniPage.tsx src/next/autistiInbox/nextAutistiAdminBridges.ts src/next/autistiInbox/NextAutistiAdminNative.tsx src/next/autistiInbox/NextAutistiInboxHomeNative.tsx src/next/autistiInbox/NextCambioMezzoInboxNative.tsx src/next/autistiInbox/NextAutistiControlliAllNative.tsx src/next/autistiInbox/NextAutistiGommeAllNative.tsx src/next/autistiInbox/NextAutistiLogAccessiAllNative.tsx src/next/autistiInbox/NextAutistiSegnalazioniAllNative.tsx src/next/autistiInbox/NextRichiestaAttrezzatureAllNative.tsx src/next/NextAutistiCambioMezzoPage.tsx src/next/NextAutistiGatePage.tsx src/next/domain/nextAutistiDomain.ts src/next/domain/nextCentroControlloDomain.ts src/next/autisti/nextAutistiCloneRuntime.ts` -> OK, con soli warning `react-hooks/exhaustive-deps` in `NextAutistiSegnalazioniPage.tsx`
- `npm run build` -> OK, warning Vite invariati su chunk grandi e doppio import `jspdf`
- `rg -n "\\.\\./pages/|\\.\\./autisti/|\\.\\./autistiInbox/|NextMotherPage" src/next src/App.tsx` -> nessun mount finale legacy nelle route ufficiali del perimetro target; residui solo CSS/shared helper locali e `NextCentroControlloClonePage.tsx` fuori runtime ufficiale

## Esito
- `OK`

## Limiti residui
- Nessun blocco tecnico reale emerso dentro la whitelist del prompt 42.
- Il verdetto `NEXT autonoma sul perimetro target` non viene dichiarato qui: serve audit separato, in coerenza con `AGENTS.md`.
