# Continuity Report - 2026-04-08 21:21:25

## Contesto
Il modulo `/next/manutenzioni` aveva gia ricevuto:
- flusso assi strutturato;
- viewer tecnico embedded con ramo `Calibra`;
- binding esplicito record -> viewer.

Nel browser, pero, l'utente non vedeva:
- `Attrezzature` nel form;
- `Calibra` nel dettaglio.

## Verita verificata nel repo
- `Attrezzature` mancava dal JSX runtime di `NextManutenzioniPage.tsx`.
- `Calibra` esisteva nel JSX di `NextMappaStoricoPage.tsx`, ma la sua resa visiva dipendeva da `man2-btn--secondary`, che su pannello chiaro risultava poco leggibile.

## Intervento applicato
- Aggiunta l'opzione `Attrezzature` nel select `Tipo` del form.
- Esteso il tipo clone-side in `nextManutenzioniDomain.ts` per non rompere il salvataggio locale.
- Reso visibile il comando `Calibra` nel toolbar tecnico con variante bottone dedicata.

## Cosa non e stato toccato
- madre legacy
- Firestore / backend / rules
- PDF
- Euromecc
- viewer tecnico oltre alla visibilita del comando

## Verifiche eseguite
- `eslint` sui file whitelistati -> `OK`
- `build` root -> `OK`

## Stato operativo finale
- `Attrezzature`: presente nel runtime del form.
- `Calibra`: presente e leggibile nel runtime del dettaglio tecnico.
- Stato modulo: `PARZIALE`
