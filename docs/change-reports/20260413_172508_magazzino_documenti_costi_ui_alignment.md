# Change Report - 2026-04-13 17:25:08

## Obiettivo
Riallineare la UI del tab `/next/magazzino?tab=documenti-costi` al linguaggio `Documenti e costi` della spec `docs/product/SPEC_DOCUMENTI_COSTI_UI.md`, mantenendo solo il perimetro dati Magazzino gia corretto e senza toccare domain, writer o barrier.

## File toccati
- `src/next/NextMagazzinoPage.tsx`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`
- mirror corrispondenti in `docs/fonti-pronte/*`

## Dati reali confermati
- Documenti archivio Magazzino: `NextIADocumentiArchiveItem` filtrati con `sourceKey = "@documenti_magazzino"`.
- Supporto righe documento: `NextDocumentiMagazzinoSupportDocument.voci` da `materialCostSupport.documents`.
- Preventivi materiali: `NextProcurementPreventivoItem` da `readNextProcurementSnapshot()`.

## Modifiche applicate
- Costruita una lista UI unificata per il tab `documenti-costi` con:
  - header statistiche
  - filtri `Tutti / Fatture / DDT / Preventivi / Da verificare`
  - ricerca locale
  - gruppi per fornitore collassabili
  - righe documento cliccabili
  - modale dettaglio
  - azioni `PDF` e `Chiedi alla IA`
  - totale per fornitore e totale generale
- Mantenuto il filtro Magazzino gia introdotto nel task precedente:
  - documenti archivio solo `@documenti_magazzino`
  - preventivi solo dal procurement materiali gia letto dal tab
- Disattivato il rendering dei pannelli legacy sotto la nuova lista documentale, cosi la superficie visibile resta concentrata sui soli documenti/preventivi Magazzino.
- Per i preventivi procurement il modale non inventa righe documento: non essendoci `voci` nei dati reali del tab, mostra solo l'intestazione.

## Verifiche eseguite
- `npx eslint src/next/NextMagazzinoPage.tsx` -> `OK`
- `npm run build` -> `OK`
- Browser verificato davvero su `http://127.0.0.1:4174/next/magazzino?tab=documenti-costi`
  - nuova UI visibile
  - gruppi fornitore collassabili
  - filtri e ricerca funzionanti
  - click riga apre il modale
  - click `PDF` apre una nuova tab senza aprire il modale
  - click `Chiedi alla IA` naviga a `/next/ia/interna`
  - `history.state.usr.initialPrompt` valorizzato
- Browser verificato davvero su `http://127.0.0.1:4174/next/ia/documenti`
  - archivio globale invariato

## Stato onesto
`PATCH PARZIALE`

## Motivo del parziale
I preventivi procurement mostrati nel tab espongono `rows` ma non `voci`. Per rispettare il vincolo "niente invenzioni", il modale puo mostrare solo l'intestazione per quei record; la spec quindi non e chiudibile al 100% senza cambiare il domain/readers sottostanti.

## Rischi residui
- Se un documento Magazzino non arriva con `sourceKey = "@documenti_magazzino"`, non entra nella lista.
- Restano errori console preesistenti su backend IA locale `127.0.0.1:4310` non avviato e listing Storage Firebase `403`.
