# Continuity Report - 2026-04-09 20:17:10

## Contesto
Task solo documentale per riallineare la regola architetturale globale della NEXT.

## Punto di partenza
Nei documenti guida erano ancora presenti formulazioni storiche che facevano intendere la NEXT come clone globalmente `read-only`.

## Decisione consolidata
- La madre legacy resta intoccabile.
- `src/next/*` e il nuovo perimetro applicativo del gestionale.
- La NEXT non e piu da considerare globalmente `read-only`.
- Le scritture reali si aprono solo modulo per modulo, in modo esplicito e controllato.
- `cloneWriteBarrier.ts` resta il punto di controllo per abilitare il perimetro di scrittura del modulo promosso.

## Documenti riallineati
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`
- mirror corrispondenti in `docs/fonti-pronte/`

## Nota operativa per i task futuri
- Non usare piu la formula globale `NEXT read-only` come regola assoluta.
- Dichiarare sempre in modo preciso, modulo per modulo, quali dataset e quali operazioni di scrittura vengono aperti.
- Lasciare invariata la madre legacy.
- Tenere allineati barrier e documentazione quando cambia il perimetro di scrittura di un modulo NEXT.

## Verifiche
- Nessun build o test eseguito, perche il task e solo documentale.

## Stato finale
- Continuita documentale ripristinata.
- Nessun file runtime modificato.
