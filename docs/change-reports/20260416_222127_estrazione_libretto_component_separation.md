# Change Report - Separazione componente Libretto nel ramo reale

- Timestamp: `2026-04-16 22:21:27`
- Obiettivo: separare la UI del caso reale `Documento mezzo -> Libretto` dal file monolitico `src/next/NextInternalAiPage.tsx` e montarla solo nel modale review operativo reale.

## File runtime toccati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/NextEstrazioneLibretto.tsx`
- `src/next/internal-ai/next-estrazione-libretto.css`

## Modifica eseguita
- creato `NextEstrazioneLibretto.tsx` come componente dedicato alla UI del libretto;
- creato `next-estrazione-libretto.css` con stile isolato del ramo, prefisso `iai-`;
- `NextInternalAiPage.tsx` importa il nuovo componente e lo monta solo dentro `documentReviewModalState.isOpen && activeDocumentReviewRoute` quando la route attiva e `Documento mezzo -> Libretto`;
- gli altri rami del modale review operativo restano sul rendering generico esistente;
- nessun writer, backend, router, barrier o hook business nuovo introdotto.

## Verifiche tecniche
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/NextEstrazioneLibretto.tsx` -> `OK`
- `npm run build` -> `OK`

## Verifica runtime
- route verificata: `http://127.0.0.1:5173/next/ia/interna`
- metodo: iniezione locale di stato documentale nel runtime reale della pagina per forzare il modale review operativo senza toccare backend o dataset;
- esito caso `Documento mezzo -> Libretto`: mount del nuovo componente separato `OK`;
- esito caso `Preventivo fornitore`: modale generico invariato `OK`;
- console: nessun errore nuovo imputabile alla patch; presenti solo `403` Storage gia preesistenti.

## Rischio e impatto
- Rischio: `NORMALE`
- Impatto: solo composizione UI del modale review reale e isolamento CSS del ramo Libretto.
