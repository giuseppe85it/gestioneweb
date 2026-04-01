# Continuity Report - 2026-04-01 12:10

## Stato iniziale
La Home NEXT apriva il modale IA riusando la pagina completa `NextInternalAiPage`, con un'esperienza troppo pesante per il contesto Home.

## Intervento eseguito
Separata la superficie Home dalla pagina completa:
- launcher Home sempre minimale;
- overlay applicativo vero renderizzato fuori dalla card;
- variante `home-modal` della pagina IA limitata a conversazione, allegati e composer.

## Stato finale
- Invio richiesta dalla Home -> apertura modale full-overlay.
- La richiesta iniziale puo partire automaticamente nel modale.
- La conversazione prosegue in una UI focalizzata.
- `/next/ia/interna` continua a usare la superficie completa separata.

## Note
Nessuna modifica alla logica business IA, agli alert o alle revisioni.
