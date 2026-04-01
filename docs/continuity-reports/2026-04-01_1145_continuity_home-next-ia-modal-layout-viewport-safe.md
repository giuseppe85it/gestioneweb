# Continuity Report - 2026-04-01 11:45

## Stato iniziale
Il launcher della chat IA interna apriva già il modale operativo, ma il layout non garantiva una fruizione comoda su tutta l'altezza della viewport.

## Intervento eseguito
Riorganizzato il modal shell come colonna centrata nella viewport, con header sempre visibile e body separato scrollabile.

## Stato finale
- La pagina sottostante resta bloccata mentre il modale è aperto.
- Il tasto `Chiudi` resta accessibile.
- La chat interna resta usabile fino al composer.

## Note
Correzione confinata a `src/next/components/HomeInternalAiLauncher.tsx` e alla documentazione di stato/registro.
