# Change Report - 2026-04-09 14:19:58

## Task
PROMPT 31B - foto reale del mezzo nel PDF del `Quadro manutenzioni` e pulizia dei testi fissi nel modulo `Manutenzioni` NEXT.

## Perimetro
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/next-mappa-storico.css`
- documentazione di stato/contesto clone

## Modifiche runtime
- L'export locale `exportPdfForItems(...)` in `NextManutenzioniPage` usa ora `jsPDF` + `jspdf-autotable` direttamente nel modulo.
- Quando l'export riguarda una sola targa:
  - recupera la foto reale del mezzo da `mezzoPreviewByTarga -> fotoUrl`
  - carica l'immagine via `fetch` + `FileReader`
  - la stampa nella testata del PDF come immagine principale del mezzo
- Se la foto reale non e disponibile:
  - il PDF non usa tavole tecniche `public/gomme/*`
  - mostra un riquadro neutro con fallback pulito
- Il bottone `PDF quadro generale` esporta ora i risultati realmente visibili nel quadro, quindi rispetta anche la ricerca `targa / autista`.

## Pulizia UI
- Rimossi testi fissi ridondanti da:
  - copy della `Dashboard`
  - copy di `Nuova / Modifica`
  - copy del `Quadro manutenzioni PDF`
  - spiegazioni fisse delle sezioni `Cambio gomme ordinario per asse` e `Evento gomme straordinario`
  - nota fissa finale del form
  - copy fissa del blocco `Tagliando completo`
  - pill e KPI ridondanti nel `Dettaglio`
- Le spiegazioni residue sono state spostate su `title` / `aria-label` di:
  - select sottotipo
  - chip assi ordinari
  - campi straordinario
  - filtri del quadro
  - bottoni export PDF
  - ricerca rapida
  - tab `Dettaglio`
  - tab vista `Sinistra / Destra`

## Verifiche
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx src/next/domain/nextMappaStoricoDomain.ts src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts` -> OK
- `npm run build` -> OK

## Esito
- Patch completata nel perimetro consentito.
- Nessuna modifica a madre, Euromecc, backend/rules o motore PDF globale.
- Warning residui: `baseline-browser-mapping` datato in lint; warning build preesistenti su chunk size e doppio uso di `jspdf` / `jspdf-autotable`.
