# Change Report - 2026-04-02 23:39

## Obiettivo
Chiudere solo il delta UI residuo di `/next/materiali-da-ordinare` sui punti ancora visibilmente diversi dalla madre `src/pages/Acquisti.tsx`: azioni secondarie di `Ordini` / `Arrivi`, resa visiva finale di `Dettaglio ordine`, parity esterna di `Prezzi & Preventivi` e parity esterna di `Listino Prezzi`.

## File toccati
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `src/next/NextProcurementConvergedSection.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifiche runtime
- `NextProcurementReadOnlyPanel.tsx`
  - le tabelle `Ordini` / `Arrivi` usano ora il pattern madre `Apri` + menu `AZIONI` con voci `Modifica` e `Elimina`;
  - il pill stato di lista viene riallineato al tab madre invece che allo stato calcolato del singolo ordine;
  - il `Dettaglio ordine` mostra meta `Ordine del ...`, riepilogo pill madre-like e non mostra piu `Ultimo arrivo` o avvisi clone-only in testata;
  - nella tabella materiali del dettaglio in sola lettura viene mostrata solo la descrizione principale, senza preview secondarie o CTA `Apri foto` fuori editing.
- `NextProcurementConvergedSection.tsx`
  - `Prezzi & Preventivi` viene ricostruito come `Registro Preventivi` con topbar madre, card `Nuovo preventivo`, tools `PULISCI ALLEGATI IA` / `Apri tutti` / `Chiudi tutti`, filtri madre e gruppi fornitore espandibili;
  - ogni preventivo espone `APRI DOCUMENTO`, stato importazione visibile e menu azioni coerente con la madre (`Apri documento`, `Collega foto`, `Importa`, `Vedi mancanti`, `Apri`, `Modifica`, `Elimina`) mantenuto clone-safe;
  - `Listino Prezzi` usa la tabella madre con filtri `Fornitore` / `Valuta` / `Cerca`, bottone `APRI DOCUMENTO`, menu azioni e modale `Modifica voce listino`.

## Layer dati preservato
- Non toccati:
  - `src/next/domain/nextProcurementDomain.ts`
  - `src/next/NextMaterialiDaOrdinarePage.tsx`
- Confermate come uniche sorgenti dati:
  - snapshot procurement NEXT gia fornito dal container
  - `buildNextProcurementListView()`
  - `findNextProcurementOrder()`
  - collezioni normalizzate `snapshot.preventivi` e `snapshot.listino`
- Non reintrodotti:
  - `storageSync`
  - letture raw legacy di `@ordini`, `@preventivi`, `@listino_prezzi`
  - mount runtime di `src/pages/*`

## Limiti residui
- `PATCH PARZIALE`: il modulo resta `PARZIALE`, non `CHIUSO`.
- Restano aperti:
  - `Ordini` / `Arrivi`: `Elimina` e `Modifica` restano clone-safe e non replicano i writer reali della madre;
  - `Dettaglio ordine`: editing materiali, foto e PDF restano locali clone-safe;
  - `Prezzi & Preventivi`: la card `Nuovo preventivo` e il menu azioni sono visivi ma non riaprono workflow vivi madre;
  - `Listino Prezzi`: la modale `Modifica voce listino` resta consultiva clone-safe e non persiste.

## Verifiche
- `node_modules\\.bin\\eslint.cmd src/next/NextProcurementReadOnlyPanel.tsx src/next/NextProcurementConvergedSection.tsx` -> `OK`
- `npm run build` -> `OK`
- `npm run lint` -> `KO` con errori diffusi preesistenti fuori scope in `api/*`, `src/autisti*`, `src/pages/*`, `src/utils/*`; nessun errore residuo sui due file runtime toccati in questo prompt
