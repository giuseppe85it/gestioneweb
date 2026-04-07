# Continuity Report - 2026-04-07 13:13

## Stato iniziale
- `Mappa storico` era gia funzionante ma visivamente ancora troppo simile a una pagina generica del gestionale.
- La vista soffriva di:
  - falsa colonna vuota a sinistra;
  - foto/placeholder poco dominanti;
  - pannello destro non abbastanza tecnico/stabile;
  - troppo testo descrittivo dispersivo.

## Stato finale
- `Mappa storico` usa una shell tecnica full-width dentro `/next/manutenzioni`.
- La gerarchia visiva e ora:
  1. header compatto superiore
  2. colonna sinistra dominante con scheda mezzo, viste e foto/placeholder
  3. colonna destra stabile con ricerca, filtri, dettaglio zona e storico
- La resa resta completa anche senza foto e senza hotspot.

## Vincoli preservati
- business, writer e shape dati invariati;
- barrier clone invariata;
- nessuna nuova route;
- nessun impatto sulla madre legacy.

## Da ricordare nei prossimi passaggi
1. Il modulo `Manutenzioni` resta `PARZIALE`; questa patch non chiude l'audit modulo.
2. Eventuali rifiniture future sulla mappa devono restare nel perimetro UI, salvo prompt diverso.
3. Il look tecnico della vista usa solo CSS scoped `.ms-*` e non deve contaminare il design system globale.
