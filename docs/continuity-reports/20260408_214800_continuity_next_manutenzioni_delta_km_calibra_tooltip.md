# Continuity Report - 2026-04-08 21:48

## Stato iniziale
- `/next/manutenzioni` aveva gia il viewer tecnico e il binding esplicito del record aperto.
- Mancava il dato operativo `km dal cambio gomme`.
- `Calibra` era visibile ma spiegato da copy fissa nel layout.

## Stato finale
- Il viewer usa sempre il record manutenzione aperto e puo mostrare anche `Km dal cambio gomme` quando i dati sono affidabili.
- Il km corrente arriva ancora dal reader canonico rifornimenti gia presente nel modulo.
- `Calibra` non aggiunge piu testo fisso nel layout: l'help e ora via tooltip hover/focus.

## File runtime interessati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMappaStoricoPage.tsx`

## Vincoli rispettati
- Nessuna modifica a madre legacy.
- Nessun nuovo reader inventato.
- Nessuna modifica a Firestore/rules/backend.
- Nessuna modifica a Euromecc o PDF.

## Verifica consigliata
1. Aprire una manutenzione gomme con km valido.
2. Verificare nel tab `Dettaglio` la presenza del delta km solo se esiste anche il km da ultimo rifornimento.
3. Verificare che, senza dati coerenti, il viewer resti pulito.
4. Passare mouse o focus su `Calibra` e controllare il tooltip, senza testo fisso aggiuntivo nella pagina.
