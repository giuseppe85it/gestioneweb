# Continuity Report - 2026-04-13 17:25:08

## Stato lasciato
- `src/next/NextMagazzinoPage.tsx` mostra nel tab `/next/magazzino?tab=documenti-costi` la UI `Documenti e costi` per fornitore sopra il perimetro dati Magazzino gia corretto.
- I pannelli legacy sotto la lista documentale non vengono piu renderizzati.
- `/next/ia/documenti` non e stato modificato in questo task e resta archivio globale.

## Perimetro dati attivo
- Documenti archivio: solo item con `sourceKey = "@documenti_magazzino"`.
- Righe documento: solo quando esiste `materialCostSupport.documents -> voci`.
- Preventivi: solo `NextProcurementPreventivoItem` del procurement materiali gia letto dal tab.

## Limite aperto
- I preventivi procurement non espongono `voci`; espongono solo `rows`.
- Per questo il modale dettaglio dei preventivi mostra solo l'intestazione e la patch resta `PARZIALE`.

## Verifiche gia fatte
- `npx eslint src/next/NextMagazzinoPage.tsx` -> `OK`
- `npm run build` -> `OK`
- Runtime verificato davvero:
  - `http://127.0.0.1:4174/next/magazzino?tab=documenti-costi`
  - `http://127.0.0.1:4174/next/ia/documenti`
- Interazioni confermate:
  - click riga -> modale
  - `PDF` -> nuova tab, pagina invariata
  - `Chiedi alla IA` -> `/next/ia/interna` con `history.state.usr.initialPrompt`

## Se si riapre il task
1. Verificare se il domain procurement o il tab Magazzino espongono in modo strutturale un campo equivalente a `voci` per i preventivi.
2. Se no, mantenere il fallback header-only per i preventivi e non inventare righe.
3. Se si vuole dichiarare `PATCH COMPLETATA`, serve prova che la spec sul dettaglio righe sia chiudibile senza toccare `src/next/domain/nextDocumentiCostiDomain.ts` o altri reader non ammessi.

## Note operative
- Preview usata: `http://127.0.0.1:4174`
- Errori console residui osservati e non introdotti da questa patch:
  - backend IA locale `127.0.0.1:4310` non avviato
  - listing Storage Firebase `403`
