## Scopo

Correzione del bug gemello nel ramo errore upload di `aggiungiMateriale` in `src/next/NextMaterialiDaOrdinarePage.tsx`, per impedire che un `blob:` URL di preview locale finisca nello stato persistibile dell'ordine.

## Fonte del rimedio

- Mini-check di sicurezza del `2026-04-24`
- Verdetto emesso in chat: `BUG GEMELLO`

## Differenza comportamento

| Caso | Prima | Dopo |
| --- | --- | --- |
| `fotoFile` presente e upload Storage riuscito | Il materiale veniva creato con URL reale Storage e path reale. | Invariato: il materiale viene creato con URL reale Storage e path reale. |
| `fotoFile` presente e upload Storage fallito | Il materiale veniva comunque creato mantenendo `fotoUrl = fotoPreview`, quindi un `blob:` URL poteva essere persistito. | Il codice mostra alert, abortisce con `return` e il materiale non viene creato. Nessun `blob:` URL entra in stato persistibile. |

## Righe modificate

- Prima: `src/next/NextMaterialiDaOrdinarePage.tsx:964-1026`
- Dopo: `src/next/NextMaterialiDaOrdinarePage.tsx:964-1028`

Punti toccati:
- inizializzazione `fotoUrl`
- ramo `catch` dell'upload foto in `aggiungiMateriale`

## Dettaglio del fix

- `fotoUrl` non viene piu inizializzato da `fotoPreview`
- `fotoUrl` parte da `null`
- `fotoStoragePath` resta inizializzato a `null`
- se `fotoFile` esiste e l'upload riesce:
  - `fotoUrl` viene valorizzato con `await getDownloadURL(snap.ref)`
  - `fotoStoragePath` viene valorizzato col path `materiali/{id}-{Date.now()}.{ext}`
- se `fotoFile` esiste e l'upload fallisce:
  - resta `console.error(...)`
  - viene mostrato `window.alert("Errore caricamento foto. Materiale non aggiunto, riprova.")`
  - la funzione esce con `return`
  - il materiale non viene creato
- se `fotoFile` non esiste:
  - comportamento invariato
  - il materiale viene creato senza foto

## Test browser richiesti

1. Aggiungere un materiale con foto in condizioni normali e verificare che venga creato con foto visibile.
2. Aggiungere un materiale con foto simulando errore upload Storage, ad esempio con browser offline o blocco temporaneo lato regole.
3. Verificare che nel caso 2 il materiale non venga creato.

## Azioni utente richieste

- Eseguire i 3 test browser sopra.
- Riverificare il punto 3 del verdetto materiali da ordinare.
- Riemettere il verdetto finale come `CHIUSO AL 100%` solo se i test confermano il comportamento atteso.
