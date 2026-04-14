# CONTINUITY REPORT - 2026-04-13 15:19:04

## Stato lasciato
- task `PROMPT 44A` chiuso come `PATCH PARZIALE`
- build root `OK`
- lint mirato `src/next/NextIADocumentiPage.tsx` `OK`

## Runtime verificato
- URL usata: `http://127.0.0.1:4174/next/ia/documenti`
- evidenze verificate davvero:
  - header con statistiche visibile
  - sezioni fornitore collassabili
  - filtro `Preventivi` funzionante
  - ricerca `TI324623` funzionante
  - click riga apre modale
  - click `PDF` apre nuova tab Storage senza aprire il modale
  - click `Chiedi alla IA` naviga a `/next/ia/interna` con prompt precaricato

## Limiti aperti
- `NextIADocumentiArchiveItem` non espone `voci`: il modale puo mostrare solo l'intestazione
- `Riapri review` e stato mantenuto per non regredire rispetto al file precedente
- console browser ancora rumorosa per problemi preesistenti:
  - backend IA locale `127.0.0.1:4310` non avviato
  - listing Storage Firebase `403`

## File runtime coinvolti
- `src/next/NextIADocumentiPage.tsx`
- `src/next/internal-ai/internal-ai.css`

## Se si riapre il task
- se il requisito diventa `PATCH COMPLETATA`, serve una decisione esplicita su uno di questi due punti:
  - accettare la regressione visibile di `Riapri review`
  - oppure autorizzare una spec aggiornata che includa `Riapri review`
- per mostrare le righe documento nel modale serve invece aprire il perimetro del domain read-only `src/next/domain/nextDocumentiCostiDomain.ts`, oggi vietato dal prompt
