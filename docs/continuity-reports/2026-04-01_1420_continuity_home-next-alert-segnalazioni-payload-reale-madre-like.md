# Continuity Report - 2026-04-01 14:20

## Stato iniziale
- Home NEXT con card `Alert` unica e filtro categorie gia presente.
- Categoria `Segnalazioni` ancora divergente dalla madre:
  - click su dettaglio basato su payload sintetico derivato dal solo alert;
  - `NextHomeAutistiEventoModal` riceveva quindi dati incompleti rispetto al record reale.

## Decisione
- Non toccare madre, CSS legacy o altri moduli alert.
- Intervenire solo su `src/next/NextCentroControlloPage.tsx`.
- Recuperare il record reale `Segnalazioni` dal dataset clone read-only `@segnalazioni_autisti_tmp`.

## Continuita implementativa
- Lettura aggiuntiva in parallelo al refresh snapshot della Home NEXT.
- Lookup locale madre-like dei record:
  - match diretto su `sourceRecordId`;
  - fallback con hash coerente col dominio NEXT;
  - fallback prudente su targa, timestamp e testo preview per alert legacy.
- Apertura modale su `HomeEvent.payload = record reale`.

## Stato finale
- La categoria `Segnalazioni` non usa piu il payload sintetico come base finale del dettaglio.
- Il modale dettaglio riceve campi reali utili a UI, foto e PDF gia previsti.
- Nessuna regressione introdotta sulle altre categorie `Alert`.
- Build runtime OK.

## Prossimo contesto utile
- Se emergono alert `Segnalazioni` senza record abbinabile, verificare l'allineamento tra `sourceRecordId` generato nel dominio NEXT e il dataset clone effettivamente presente nel momento di lettura.
