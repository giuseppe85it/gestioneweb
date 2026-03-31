# AUDIT home LOOP

- modulo: `Home`
- route: `/next`
- ciclo loop: `1/2`
- stato iniziale: `FAIL`
- esito audit finale del ciclo: `PASS`
- stato finale del modulo nel tracker: `CLOSED`

## Fonti lette
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- `docs/audit/AUDIT_GENERALE_TOTALE_NEXT_VS_MADRE.md`
- `src/App.tsx`
- `src/next/NextHomePage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/components/NextHomeAutistiEventoModal.tsx`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/pages/Home.tsx`
- `src/components/AutistiEventoModal.tsx`

## Verdetto iniziale
- `FAIL`
- Motivo:
  - il modal eventi NEXT deformava la superficie madre sostituendo le CTA scriventi con testo read-only o `APRI DETTAGLIO CLONE`;
  - i tre modali data NEXT esponevano placeholder e validazioni diversi dalla madre.

## Verifica su codice reale post-patch
- route ufficiale:
  - `/next` monta `NextHomePage` e non `NextMotherPage`;
  - `NextHomePage` monta `NextCentroControlloPage` come runtime finale della `Home`.
- UI pratica:
  - `NextHomeAutistiEventoModal.tsx` mostra di nuovo le CTA madre `CREA LAVORO` / `GIÀ CREATO` e `IMPORTA IN DOSSIER`;
  - i tre modali data mostrano di nuovo `gg mm aaaa oppure YYYY-MM-DD` come placeholder e come testo di validazione.
- flussi visibili utili:
  - il clone mantiene i bottoni scriventi nella stessa superficie pratica della madre;
  - il click non scrive, ma blocca esplicitamente con messaggio read-only coerente.
- modali principali:
  - il modal eventi `Home` non espone piu CTA clone-only aggiuntive;
  - i modali prenotazione, pre-collaudo e revisione non divergono piu nei testi visibili.
- dati reali letti:
  - la `Home` NEXT continua a leggere `@alerts_state`, `@mezzi_aziendali`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti` tramite `readNextUnifiedStorageDocument()`;
  - la madre legge gli stessi dataset con `getItemSync()`.
- overlay clone-only:
  - non risultano overlay locali della `Home` su alert, mezzi o eventi;
  - le suggestioni autista restano allineate al criterio madre `sessioni + mezzi`.
- scritture reali:
  - restano bloccate in modo esplicito su alert, luogo rimorchio, prenotazione collaudo, pre-collaudo, revisione, creazione lavoro e import dossier;
  - nessuna scrittura business reale viene riaperta.

## Gap reali residui
- nessuno nel perimetro `Home` verificato in questo ciclo.

## Criterio PASS
- `PASS` perche risultano vere tutte le condizioni critiche del modulo:
  - niente mount runtime finale madre;
  - UI pratica equivalente;
  - flussi visibili utili equivalenti nel contratto read-only;
  - modali equivalenti;
  - stessi testi, CTA, placeholder e validazioni visibili;
  - stessi dati reali letti dalla madre;
  - nessun placeholder fake;
  - nessun overlay clone-only che falsi la parity;
  - scritture reali bloccate in modo esplicito e coerente;
  - layer NEXT puliti effettivamente usati sotto.

## Verifiche eseguite
- `npx eslint src/next/components/NextHomeAutistiEventoModal.tsx src/next/NextCentroControlloPage.tsx` -> `OK`
- `npm run build` -> `OK`

## Come verificare
1. Aprire `/next` e confrontare la `Home` con la madre.
2. Aprire un evento autista `segnalazione` o `controllo` e verificare le CTA `CREA LAVORO` / `GIÀ CREATO`.
3. Aprire un evento `gomme` e verificare il bottone `IMPORTA IN DOSSIER`.
4. Aprire i tre modali data e verificare placeholder e validazione `gg mm aaaa oppure YYYY-MM-DD`.
5. Provare tutte le azioni scriventi della `Home` e verificare il blocco read-only esplicito.
