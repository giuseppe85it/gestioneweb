# Change Report - 2026-04-02 21:55

## Obiettivo
Portare dentro `/next/materiali-da-ordinare` il blocco operativo vivo madre di `Dettaglio ordine`, mantenendo `Materiali da ordinare` come unico procurement top-level NEXT e preservando il layer dati NEXT pulito.

## File toccati
- `src/next/NextProcurementReadOnlyPanel.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifiche runtime
- Sostituito il vecchio pannello `Dettaglio ordine read-only` con un dettaglio operativo locale clone-safe:
  - `Segna Arrivato` / `Segna NON Arrivato`
  - `Modifica` / `Salva`
  - `+ Aggiungi materiale`
  - modifica locale di descrizione, quantita, unita, stato arrivo, data arrivo, note riga
  - foto riga locale con `Foto` / `Rimuovi`
  - `Note ordine (solo PDF)`
- Attivati nel dettaglio interno:
  - `PDF Fornitori`
  - `ANTEPRIMA PDF`
  - `PDF Interno`
  - modal `PdfPreviewModal` con share / copy / WhatsApp
- Allineata la lista ordini/arrivi:
  - CTA tabella aggiornata da `Apri dettaglio read-only` a `Apri dettaglio`

## Layer dati preservato
- Confermati come uniche sorgenti dati:
  - `readNextProcurementSnapshot()`
  - `buildNextProcurementListView()`
  - `findNextProcurementOrder()`
- Non reintrodotti:
  - `getItemSync`
  - `setItemSync`
  - `uploadMaterialImage`
  - `deleteMaterialImage`
  - letture raw legacy madre

## Limiti residui
- `Dettaglio ordine` resta locale clone-safe: non scrive ordini, inventario o storage reale.
- Restano aperti i delta su:
  - workflow pieno `Prezzi & Preventivi`
  - `Listino Prezzi`
  - writer business 1:1 della madre

## Verifiche
- `npm run build` -> `OK`
- Warning residui preesistenti:
  - `jspdf` chunk warning
  - chunk size Vite
