# PIANO ASSORBIMENTO MODULI RESIDUI IA NEXT

## 1. Scopo
Questo piano colloca in modo finito e vincolante solo i residui fuori dal perimetro operativo gia chiuso del clone/NEXT.

## 2. Residui reali oggi fuori chiusura completa
1. Nessun residuo aperto nel perimetro operativo attuale del clone/NEXT
2. Rafforzamento processo/CI del gate moduli futuri oltre al controllo runtime gia attivo
3. Live-read business lato backend IA ancora chiuso e da non aprire senza prerequisiti reali

## 3. Work-package vincolanti
### WP01 - Gate moduli futuri anche nel processo di rilascio
- Obiettivo: estendere il gate runtime/documentale a checklist e automazioni di progetto
- Perimetro: contract standard, checklist rilascio, eventuali controlli CI o lint architetturali
- Dipendenze: conformance runtime gia attiva
- Rischio: `ELEVATO`
- Criterio di successo: un modulo nuovo non passa il percorso di rilascio se manca registry entry, contract adapter e hook UI

### WP02 - Verifica stretta dei prerequisiti live-read minimo
- Obiettivo: mantenere chiuso il live-read business finche non esistono davvero prerequisiti tecnici e di sicurezza dimostrati
- Perimetro: backend IA separato, credenziali server-side, policy, boundary clone-safe
- Dipendenze: nessuna sul perimetro UI; coordinamento solo documentale e tecnico
- Rischio: `ELEVATO`
- Criterio di successo: o il live-read resta chiuso con blocker chiari, oppure esiste una prova stretta e confinata di exact read minimale senza toccare la madre

## 4. Regola finale
Nel perimetro operativo oggi presente del clone/NEXT non sono ammessi nuovi gap aperti. I soli residui accettabili sono fuori perimetro corrente e devono restare collocati in questi work-package.
