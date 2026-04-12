# CONTINUITY REPORT - IA INTERNA DOCUMENTALE UNIFICATA

- Data: 2026-04-12
- Scope: continuita del sottosistema `/next/ia/interna` dopo il riuso del motore reale `IADocumenti` e declassamento di `/next/ia/documenti` a superficie secondaria.

## Vincoli rispettati
- nessuna modifica a backend, functions, `firestore.rules`, `storage.rules` o writer extra per il task;
- nessun secondo motore documentale introdotto;
- nessun redesign della pagina legacy `src/pages/IA/IADocumenti.tsx`;
- nessuna modifica a file runtime fuori whitelist;
- chat mantenuta accessibile ma resa secondaria nel workflow documentale;
- dettagli tecnici non piu dominanti nella prima vista documentale.

## Continuita del motore reale
- Il motore legacy continua a vivere in `src/pages/IA/IADocumenti.tsx`.
- La pagina legacy continua a montare lo stesso flusso documento reale.
- Il clone NEXT riusa lo stesso motore tramite `useIADocumentiEngine()`.
- Upload, analisi, review, storico, apertura originale, verifica valuta e salvataggi restano quelli gia esistenti.

## Continuita UX verificata
- `/next/ia/interna`: ingresso unico documentale visibile e leggibile.
- `/next/ia/interna`: storico apribile dal bottone `Apri storico`.
- `/next/ia/interna`: `Riapri review` ripristina la review dal motore reale.
- `/next/ia/interna`: `Vai al dossier` naviga alla route reale del mezzo nel caso verificato.
- `/next/ia/documenti`: pagina ridotta a storico/strumenti secondari con CTA verso ingresso unico.
- `/next/ia/documenti`: `Apri originale` continua a funzionare in tab separata.

## Build e lint
- `npx eslint src/pages/IA/IADocumenti.tsx src/next/NextInternalAiPage.tsx src/next/NextIADocumentiPage.tsx` -> `OK`
- `npm run build` -> `OK`

## Rischi residui
- i nuovi upload live end-to-end restano `DA VERIFICARE` sui rami finali con file non ancora caricati nel dataset corrente;
- la pagina `/next/ia/documenti` non e stata rimossa: resta superficie secondaria per continuita, quindi il presidio prodotto dipende ancora dalla chiarezza del CTA verso `/next/ia/interna`;
- i console error Storage `403` osservati nel browser restano quelli gia presenti sul runtime e non sono stati introdotti da questa patch.
