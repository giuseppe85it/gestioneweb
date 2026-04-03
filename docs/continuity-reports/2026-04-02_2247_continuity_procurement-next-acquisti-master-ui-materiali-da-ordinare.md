# Continuity Report - 2026-04-02 22:47

## Stato iniziale
- `/next/materiali-da-ordinare` aveva gia migliorato alcuni blocchi procurement, ma la pelle esterna restava guidata dal lessico `Materiali da ordinare` e non dalla vera superficie madre `Gestione Acquisti`.
- Il delta visibile piu forte era su:
  - header e naming top-level;
  - gerarchia `tabs -> content -> panel`;
  - rami `Prezzi & Preventivi` e `Listino Prezzi` con shell ancora troppo ibrida.

## Stato finale
- La pagina NEXT usa ora come shell esterna il modello di `src/pages/Acquisti.tsx`:
  - header `Gestione Acquisti` / `Acquisti`;
  - tab madre complete;
  - pannello `Ordine materiali` inserito nella gabbia `acq-tab-panel--fabbisogni`;
  - `Registro Preventivi` e `Listino Prezzi` con shell e filtri piu vicini alla madre.

## Rischi residui
- Il modulo resta `PARZIALE`:
  - `Ordini` / `Arrivi` non sono ancora ricostruiti 1:1 fuori da `NextProcurementReadOnlyPanel`;
  - `Carica preventivo` e `CONFERMA ORDINE` restano visibili ma bloccati;
  - nessun writer business reale e nessun upload preventivi reale sono stati riaperti.

## Prossimo passo consigliato
- Se si vuole chiudere altro delta reale senza toccare il domain, il passo successivo piu naturale e verificare se `Ordini` / `Arrivi` possono essere riallineati ancora di piu alla madre direttamente dentro `src/next/NextProcurementConvergedSection.tsx`, mantenendo intatto `NextProcurementReadOnlyPanel.tsx`.
