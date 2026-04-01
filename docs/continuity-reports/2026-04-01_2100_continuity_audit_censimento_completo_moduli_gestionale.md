# Continuity Report - Audit censimento completo moduli gestionale

## Contesto
Audit richiesto per censire in modo completo i moduli reali del gestionale senza toccare runtime o route.

## Continuita garantita
- Nessun file sotto `src/*` modificato.
- Nessuna route modificata.
- Nessuna patch a madre o NEXT runtime.

## Output prodotti
- elenco completo moduli per famiglie;
- matrice tabellare completa dei moduli;
- backlog dei casi ambigui, duplicati o non montati come route ufficiali.

## Punti chiave emersi
- il repo espone un perimetro ampio ma tracciabile, con quasi tutte le famiglie presenti sia in madre sia in NEXT;
- i moduli solo madre confermati sono concentrati sulla famiglia `360`;
- i moduli solo NEXT funzionali sono concentrati sulla `IA interna`;
- nel repo esistono anche file NEXT non montati nelle route ufficiali, da trattare come supporti o `DA VERIFICARE`.
