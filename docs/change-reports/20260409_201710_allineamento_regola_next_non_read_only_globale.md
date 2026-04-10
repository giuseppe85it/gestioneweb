# Change Report - 2026-04-09 20:17:10

## Titolo
Allineamento ufficiale della regola architetturale NEXT: non piu clone globalmente read-only

## Tipo intervento
- Documentazione ufficiale
- Nessun runtime toccato

## Obiettivo
Riallineare i documenti guida del progetto alla regola architetturale corrente:
- madre legacy intoccabile;
- `src/next/*` come nuovo perimetro applicativo;
- NEXT non piu globalmente `read-only`;
- scritture reali abilitate solo modulo per modulo;
- apertura controllata e non globale, con `cloneWriteBarrier.ts` come punto di controllo esplicito.

## File toccati
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`
- mirror corrispondenti in `docs/fonti-pronte/`

## Modifiche applicate
- Corrette in `AGENTS.md` le formulazioni che facevano intendere una NEXT globalmente read-only come regola assoluta.
- Aggiornato `docs/STATO_ATTUALE_PROGETTO.md` con la regola architetturale corrente e con il chiarimento che la promozione dei moduli NEXT avviene modulo per modulo.
- Aggiornato `docs/product/STATO_MIGRAZIONE_NEXT.md` con una sezione esplicita sulla regola corrente e con una voce di aggiornamento dedicata.
- Aggiornato `docs/product/REGISTRO_MODIFICHE_CLONE.md` per registrare il cambio di regola architetturale e riallineare la definizione del perimetro NEXT.
- Aggiornato `CONTEXT_CLAUDE.md` per mantenere coerente il contesto sintetico: madre intoccabile, NEXT nuovo perimetro applicativo, scritture reali solo per moduli promossi e barrier come controllo esplicito.
- Sincronizzate le copie mirror in `docs/fonti-pronte/` dei file ufficiali toccati.

## Vincoli rispettati
- Nessuna modifica runtime
- Nessuna modifica a `src/*`
- Nessuna apertura globale delle scritture
- Nessun claim di chiusura moduli introdotto da questo task documentale

## Verifiche
- Nessun build o test eseguito, perche il task e solo documentale.

## Esito
- Patch documentale completata.
- Regola globale obsoleta `clone NEXT read-only` sostituita con la formulazione architetturale corrente, prudente e verificabile.
