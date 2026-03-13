# CONTINUITY REPORT - Chat interna controllata

## Contesto
Il sottosistema IA interno disponeva gia di:
- scaffolding isolato sotto `/next/ia/interna*`;
- fix del tracking locale del subtree;
- use case reale ma sicuro per il report targa in anteprima;
- archivio artifact persistente solo locale;
- checklist unica IA come fonte di verita operativa.

Mancava ancora una superficie di chat coerente con il gestionale che fungesse da cuore del modulo IA senza introdurre backend reale o automazioni pericolose.

## Stato raggiunto
- La panoramica `/next/ia/interna` espone ora una chat interna controllata.
- La chat usa un orchestratore solo locale/mock.
- Gli intenti attivi sono:
  - aiuto/capacita;
  - report targa in anteprima;
  - richieste non supportate.
- Il report targa via chat riusa il facade read-only gia esistente e aggiorna la stessa preview del sottosistema IA.
- I messaggi restano solo in memoria nella pagina corrente.

## Decisioni operative fissate
- Nessun LLM reale in questo step.
- Nessun provider esterno o backend IA reale.
- Nessun riuso runtime dei moduli IA legacy.
- Nessuna persistenza business dei messaggi o delle richieste chat.
- Nessuna modifica alla madre e nessun impatto sui flussi correnti.

## Prossimo passo coerente
- Valutare in task separato se aggiungere o meno una persistenza locale isolata dei messaggi chat, sempre namespaced e senza uscire dal perimetro clone.
- Non introdurre backend reale o provider IA finche restano aperti i blocchi di sicurezza e governance gia tracciati nella checklist unica.

## Vincoli da mantenere
- Tutti i testi visibili devono restare in italiano.
- Ogni futuro task IA deve aggiornare `docs/product/CHECKLIST_IA_INTERNA.md`.
- Nessuna scrittura su dataset business.
- Nessun riuso runtime di backend IA/PDF legacy.
