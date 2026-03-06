# REGOLE STATO DOCUMENTI

Versione: 2026-03-06  
Scopo: uniformare lo stato dei documenti architetturali e ridurre ambiguita tra sistema attuale, legacy e target.

## Stati ufficiali

## 1) LEGACY
- **Cosa significa**:
  - rappresenta componenti, flussi o documenti del sistema vecchio mantenuti per compatibilita.
- **Quando usarlo**:
  - route alias storiche
  - contratti dati ancora supportati ma da dismettere
  - strumenti tecnici non piu centrali ma ancora presenti
- **Perche e importante**:
  - evita di confondere cio che esiste con cio che e raccomandato.
- **Come aiuta**:
  - rende esplicito cosa non deve essere esteso nella nuova architettura.

## 2) TARGET
- **Cosa significa**:
  - stato desiderato della nuova architettura/modulo/processo.
- **Quando usarlo**:
  - blueprint, IA target, security target, UX target.
- **Perche e importante**:
  - definisce direzione comune prima delle patch.
- **Come aiuta**:
  - riduce scelte locali incoerenti e mantiene allineamento strategico.

## 3) CURRENT
- **Cosa significa**:
  - stato reale dimostrato adesso nel repository.
- **Quando usarlo**:
  - analisi read-only, verifica flussi, mappa dati effettiva, route attive.
- **Perche e importante**:
  - separa fatti verificati da ipotesi o desiderata.
- **Come aiuta**:
  - permette decisioni basate su evidenze, non su memoria chat.

## 4) IN TRANSIZIONE
- **Cosa significa**:
  - area in migrazione tra CURRENT e TARGET, con coesistenza controllata.
- **Quando usarlo**:
  - moduli con doppio path o doppia sorgente dati da convergere
  - rollout progressivi nuova app parallela alla legacy
- **Perche e importante**:
  - segnala rischio regressioni e necessita di compatibilita temporanea.
- **Come aiuta**:
  - rende esplicito cosa e temporaneo e quali passi restano da chiudere.

## Regole di applicazione nei documenti
1. Ogni sezione critica deve indicare almeno uno stato: `LEGACY`, `TARGET`, `CURRENT`, `IN TRANSIZIONE`.
2. Se mancano prove oggettive, aggiungere anche `DA VERIFICARE`.
3. Evitare mix ambiguo nello stesso paragrafo senza distinzione stato.
4. Aggiornare `STORICO_DECISIONI_PROGETTO` quando uno stato cambia in modo ufficiale.

## Beneficio operativo
Questa tassonomia evita confusione tra:
- vecchio sistema da mantenere (LEGACY),
- stato reale oggi (CURRENT),
- architettura desiderata (TARGET),
- fase di migrazione controllata (IN TRANSIZIONE).

