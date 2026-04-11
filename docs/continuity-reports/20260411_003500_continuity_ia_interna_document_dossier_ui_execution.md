# CONTINUITY REPORT

- Timestamp: 2026-04-11 00:35:00
- Tema: UI dossier del documento analizzato nella IA interna NEXT

## Stato raggiunto
- il risultato documento sopra la chat non e piu una card grezza
- il runtime usa ora una scheda dossier gestionale a sezioni
- il contenitore resta leggibile e scrollabile sia nella route piena sia nel modale rapido

## File runtime da riaprire per primi
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`

## Fatti verificati
- `npx eslint src/next/NextInternalAiPage.tsx` -> OK
- `npm run build` -> OK
- verifica runtime completata su `/next/ia/interna` con tre allegati dummy:
  - fattura materiali
  - fattura AdBlue
  - documento ambiguo
- per tutti i casi il pannello documento resta visibile e con sezioni leggibili

## Cosa NON e stato toccato
- motore di classificazione documento
- router / handoff IA
- writer business `Magazzino`
- barrier

## Prossimo audit utile
- valutare la resa della scheda con allegati PDF reali, OCR debole e metadata incompleti
- verificare se alcuni campi estratti vanno raffinati nel motore, ma in task separato rispetto alla UI
