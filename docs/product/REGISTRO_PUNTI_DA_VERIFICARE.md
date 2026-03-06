# REGISTRO PUNTI DA VERIFICARE

Questo documento mantiene una memoria fissa dei punti ancora aperti.
Serve a non perdere temi importanti tra task diversi e tra chat diverse.

## Stato punti aperti (prioritari)

| Punto | Stato | Dubbio / descrizione | Impatto | Documenti collegati | Nota sintetica |
|---|---|---|---|---|---|
| Stream eventi autisti canonico definitivo | DA VERIFICARE | Doppia sorgente: `@storico_eventi_operativi` vs `autisti_eventi` | Alto | `docs/data/MAPPA_COMPLETA_DATI.md`, `docs/STRUTTURA_COMPLETA_GESTIONALE.md`, `docs/product/STORICO_DECISIONI_PROGETTO.md` | Va scelta una sorgente canonica unica per evitare mismatch reader/writer. |
| Contratto finale allegati preventivi | DA VERIFICARE | Pattern path multipli: `preventivi/ia/*` vs `preventivi/<id>.pdf` | Medio/Alto | `docs/data/MAPPA_COMPLETA_DATI.md`, `docs/data/REGOLE_STRUTTURA_DATI.md`, `docs/product/STORICO_DECISIONI_PROGETTO.md` | Serve naming unificato con compatibilita legacy in lettura. |
| Matrice ruoli/permessi definitiva | DA VERIFICARE | Distinzione finale tra `admin`, `capo`, `account gestionale` non chiusa | Alto | `docs/security/SICUREZZA_E_PERMESSI.md`, `docs/STRUTTURA_COMPLETA_GESTIONALE.md`, `docs/product/STORICO_DECISIONI_PROGETTO.md` | Punto bloccante per sicurezza e rollout nuova app. |
| Policy Firestore effettive | DA VERIFICARE | `firestore.rules` non presente nel repository | Alto | `docs/security/SICUREZZA_E_PERMESSI.md`, `docs/data/REGOLE_STRUTTURA_DATI.md` | Verificare policy reali deployate e allinearle alla matrice permessi. |
| Governance endpoint IA multipli | DA VERIFICARE | Coesistenza endpoint IA diversi da consolidare a livello governance | Medio | `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`, `docs/architecture/FUNZIONI_TRASVERSALI.md`, `docs/product/STORICO_DECISIONI_PROGETTO.md` | Definire ownership, fallback e comportamento canonico. |

## Regola di aggiornamento
- Ogni punto chiuso o modificato va aggiornato qui nello stesso task.
- Se emerge un nuovo dubbio architetturale o dati/sicurezza, aggiungerlo subito.
- Se non ci sono prove sufficienti, indicare sempre `DA VERIFICARE`.
