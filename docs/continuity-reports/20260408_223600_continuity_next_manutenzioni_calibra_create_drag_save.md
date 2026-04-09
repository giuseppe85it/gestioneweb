# Continuity Report - 2026-04-08 22:36

## Stato iniziale
- Il runtime `Dettaglio` mostrava ancora un doppione nello storico mezzo.
- `Calibra` permetteva solo interazione parziale, senza conferma esplicita `Salva`.

## Stato finale
- Il record gia mostrato nel box `Ultimo intervento mezzo` non ricompare piu come primo elemento della lista `Ultime manutenzioni mezzo`.
- `Calibra` segue ora il flusso richiesto:
  1. click `Calibra`
  2. selezione target
  3. click sul disegno o drag marker
  4. `Salva`
  5. rilettura posizione persistita

## Boundary rispettati
- Nessuna modifica a madre legacy.
- Nessuna modifica a Firestore/rules/backend.
- Nessuna modifica a Euromecc, PDF o moduli non collegati.

## Verifica consigliata
1. Aprire `/next/manutenzioni` e verificare che lo storico mezzo non mostri piu il doppione.
2. Entrare in `Calibra` su `Sinistra` o `Destra`.
3. Scegliere un target, cliccare sul disegno, trascinare se necessario, premere `Salva`.
4. Uscire e rientrare nella stessa vista per verificare la rilettura delle coordinate.
