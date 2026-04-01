# Continuity Report - Audit Home Flussi Moduli Ingressi

## Contesto
Attivita richiesta come audit architetturale/funzionale dei moduli principali del gestionale per decidere cosa deve restare in Home e cosa no.

## Continuita garantita
- Nessun file runtime modificato.
- Nessuna route modificata.
- Nessun cambiamento a madre, clone runtime o sottosistemi dati.

## Output prodotti
- report principale audit Home/moduli/ingressi;
- matrice decisionale Home;
- backlog decisionale di riduzione rumore.

## Decisioni documentate
- Home da trattare come cockpit di urgenza e ripresa lavoro;
- `Alert`, `Stato operativo`, launcher `IA interna` e `Navigazione rapida` minimale come candidati forti a restare;
- accessi specialistici e child routes da spostare fuori dalla Home primaria.

## Punti aperti
- `DA VERIFICARE` esplicitati nel backlog dedicato:
  - telemetria frequenze reali;
  - scelta finale tra `/next` e `/next/centro-controllo`;
  - matrice ruoli/permessi;
  - canonicalita stream eventi autisti;
  - peso reale sezioni secondarie IA interna.
