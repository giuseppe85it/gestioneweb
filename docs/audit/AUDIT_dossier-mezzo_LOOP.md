# AUDIT LOOP `Dossier Mezzo`

- Data audit: `2026-03-31 17:38 Europe/Rome`
- Route ufficiale verificata: `/next/dossiermezzi/:targa` (`/next/dossier/:targa` alias tecnico)
- Runtime ufficiale verificato: `src/next/NextDossierMezzoPage.tsx`
- Esito audit: `PASS`

## Verifica su codice reale
- La route ufficiale `/next/dossiermezzi/:targa` monta `NextDossierMezzoPage`, non `NextMotherPage` o `src/pages/DossierMezzo.tsx`.
- Il runtime ufficiale replica la superficie madre del dossier su header, blocchi dati tecnici, foto mezzo, lavori, manutenzioni, materiali, rifornimenti, preventivi/fatture, modali principali e anteprima PDF.
- `NextDossierMezzoPage` legge il composite `readNextDossierMezzoCompositeSnapshot()` e non usa piu overlay locali del clone per nascondere documenti o alterare la lista visibile dei preventivi.
- Il blocco emerso dall'audit finale globale V3 e corretto: `readNextDossierMezzoCompositeSnapshot()` chiama ora `readNextMaterialiMovimentiSnapshot({ includeCloneOverlays: false })`, quindi la tabella `Materiali e movimenti inventario` non puo piu mostrare overlay clone-only.
- Il bottone `Elimina` dei preventivi resta visibile come nella madre, ma nel clone blocca l'azione con messaggio read-only esplicito; non esegue piu cancellazioni locali o business.
- La madre resta distinta e intoccata: `src/pages/DossierMezzo.tsx` continua a usare `getDoc/getDocs/setDoc/deleteDoc`, mentre il clone non esegue nessuno di questi side effect.

## Criteri PASS/FAIL
- Route NEXT autonoma senza runtime finale madre: `PASS`
- UI pratica equivalente alla madre: `PASS`
- Flussi visibili utili equivalenti: `PASS`
- Modali principali equivalenti: `PASS`
- Report/PDF principali equivalenti: `PASS`
- Testi, CTA, placeholder e validazioni visibili equivalenti: `PASS`
- Lettura degli stessi dati reali senza overlay clone-only: `PASS`
- Nessuna scrittura reale attiva e blocco esplicito read-only coerente: `PASS`
- Nessuna scrittura locale clone-only attiva nel runtime ufficiale: `PASS`
- Layer NEXT puliti usati davvero sotto: `PASS`
- Lint e build: `PASS`

## Verdetto
- Il modulo `Dossier Mezzo` e `CLOSED` nel loop corrente.
- La chiusura vale solo per il modulo `Dossier Mezzo`.
- Il falso `CLOSED` emerso da `docs/audit/AUDIT_FINALE_GLOBALE_NEXT_POST_LOOP_V3.md` risulta corretto nel codice reale.
- Dopo questo fix il tracker torna coerente sul modulo, ma serve un nuovo audit finale globale separato.
