# Continuity Report - Magazzino + IA interna fix riconciliazione stock e review destra

Data: 2026-04-11  
Task: fix business `Consolida stock` + riallineamento review destra full screen

## Cosa e stato fatto
- corretto il gating del ramo `riconcilia_senza_carico` nel modulo `Magazzino` e nel helper inline della IA interna;
- la sola riconciliazione ora passa solo se l'arrivo procurement compatibile risulta gia consolidato a stock;
- `Riconcilia documento` e `Aggiungi costo/documento` non devono piu aumentare la quantita nei casi tipo `MARIBA`;
- la review destra della IA interna e stata riordinata con focus su `Documento`, `Righe estratte`, `Match inventario`, `Decisione`, `Azione proposta IA`, `Dettagli tecnici`.

## File runtime chiave
- `src/next/NextMagazzinoPage.tsx`
- `src/next/internal-ai/internalAiMagazzinoControlledActions.ts`
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`

## Comportamento runtime attuale
- la riconciliazione senza carico non e piu disponibile se la copertura procurement non risulta gia consolidata in inventario;
- il carico quantita resta confinato a `Carica stock` o ai casi non ancora caricati;
- la review full screen mostra una colonna destra meno tecnica e piu decisionale;
- le righe estratte sono il blocco leggibile dominante;
- i dettagli tecnici restano disponibili ma collassati di default.

## Verifiche gia eseguite
- `npx eslint src/next/NextMagazzinoPage.tsx src/next/internal-ai/internalAiMagazzinoControlledActions.ts src/next/NextInternalAiPage.tsx src/next/internal-ai/internal-ai.css` -> OK sul runtime; warning noto solo sul CSS ignorato dalla config ESLint del repo
- `npm run build` -> OK
- runtime verificato su `/next/ia/interna` con:
  - `fattura_mariba_534909.pdf`
  - `fattura_adblue_aprile.pdf`
  - `documento_ambiguo.pdf`
- runtime verificato su `/next/magazzino?tab=documenti-costi` con snapshot live:
  - `Righe supporto: 3`
  - `Pronte: 0`
  - `Bloccate: 3`

## Rischi residui
- il codice corregge il bug business, ma manca ancora una prova browser end-to-end su un candidato live `Pronto`;
- il dataset usato nel task non esponeva nessuna riga pronta, quindi non e stato eseguito alcun click scrivente reale;
- la capability resta `PARZIALE` finche un audit separato non conferma il comportamento su un caso live idoneo.

## Prossimo punto sensato
- rivalidare il ramo `riconciliazione senza carico` con un documento reale pronto in `/next/magazzino?tab=documenti-costi`, verificando in browser che il collegamento documento/costo non aumenti la giacenza e che `Carica stock` resti l'unico ramo che incrementa davvero la quantita.
