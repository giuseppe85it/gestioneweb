# Change Report - 2026-04-06 15:40

## Modifica
Rifinitura UI/PDF/Home del modulo `Lavori` NEXT con logica reale invariata.

## Obiettivo
Chiudere difetti reali di leggibilita del modulo `Lavori` gia aperto in scrittura nella NEXT, mostrando `Segnalato da`, `Autista solito`, migliorando il PDF esistente, colorando la priorita e aggiungendo anche i lavori in attesa nel blocco alert Home.

## File toccati
- `src/next/NextLavoriDaEseguirePage.tsx`
- `src/next/NextDettaglioLavoroPage.tsx`
- `src/next/next-lavori.css`
- `src/next/NextHomePage.tsx`
- `src/next/next-home.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Cambiamenti applicati
- Tabelle `In attesa` / `Eseguiti`:
  - aggiunto `Segnalato da` sotto la descrizione del lavoro;
  - aggiunto `Autista solito` nella cella mezzo, leggendo il dato reale dal mezzo quando presente.
- Dettaglio lavoro:
  - aggiunti `Segnalato da` e `Autista solito` nel riepilogo dettaglio;
  - stesso dato riportato anche nel PDF reale del dettaglio.
- PDF:
  - mantenuto il canale reale esistente del modulo;
  - layout tabellare piu largo/orizzontale con colonne esplicite per `Segnalato da` e `Autista solito`;
  - ridistribuzione colonne per evitare resa stretta e date spezzate male.
- Priorita:
  - pulsanti `Alta/Media/Bassa` nel form `Aggiungi` colorati in modo pieno quando attivi;
  - righe tabella tinte con evidenziatore tenue per priorita, mantenendo badge e contrasto leggibile.
- Home:
  - il blocco alert e ora diviso in `Scadenze` e `Lavori in attesa`;
  - il riquadro `Lavori in attesa` usa dati reali e linka al modulo Lavori.

## Impatto
- Nessuna modifica a madre, shell, route, barrier clone, Firebase o domain cross-modulo.
- Nessuna regressione intenzionale sulle scritture reali del modulo `Lavori`.
- Stato modulo confermato `PARZIALE`: serve audit separato per promozione successiva.

## Verifiche
- `node_modules\\.bin\\eslint.cmd src\\next\\NextLavoriDaEseguirePage.tsx src\\next\\NextDettaglioLavoroPage.tsx src\\next\\NextHomePage.tsx` -> `OK`
- `npm run build` -> `OK`
- Runtime verificato su:
  - `/next/lavori-in-attesa`
  - `/next/lavori-eseguiti`
  - `/next/lavori-da-eseguire?tab=aggiungi`
  - `/next/dettagliolavori/:lavoroId`
  - `/next`
