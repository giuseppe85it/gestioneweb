# REGISTRO PUNTI DA VERIFICARE

Questo documento mantiene una memoria fissa dei punti ancora aperti.
Serve a non perdere temi importanti tra task diversi e tra chat diverse.

## Stato punti aperti (prioritari)

| Punto | Stato | Dubbio / descrizione | Impatto | Documenti collegati | Nota sintetica |
|---|---|---|---|---|---|
| Stream eventi autisti canonico definitivo | DA VERIFICARE | Doppia sorgente: `@storico_eventi_operativi` vs `autisti_eventi` | Alto | `docs/data/MAPPA_COMPLETA_DATI.md`, `docs/STRUTTURA_COMPLETA_GESTIONALE.md`, `docs/product/STORICO_DECISIONI_PROGETTO.md` | Va scelta una sorgente canonica unica per evitare mismatch reader/writer. |
| Contratto finale allegati preventivi | DA VERIFICARE | Pattern path multipli confermati: `preventivi/ia/<extractionId>.pdf`, `preventivi/ia/<extractionId>_<idx>.<ext>`, `preventivi/<id>.pdf` | Alto | `docs/data/MAPPA_COMPLETA_DATI.md`, `docs/data/REGOLE_STRUTTURA_DATI.md`, `docs/audit/VERIFICA_INFRASTRUTTURA_FIREBASE_BACKEND.md`, `docs/product/STORICO_DECISIONI_PROGETTO.md` | `Acquisti` usa upload, `listAll`, `deleteObject` e callable `estraiPreventivoIA` sugli stessi path: non toccare senza mapping completo. |
| Matrice ruoli/permessi definitiva | DA VERIFICARE | Distinzione finale tra `admin`, `capo`, `account gestionale` non chiusa | Alto | `docs/security/SICUREZZA_E_PERMESSI.md`, `docs/STRUTTURA_COMPLETA_GESTIONALE.md`, `docs/product/STORICO_DECISIONI_PROGETTO.md` | Punto bloccante per sicurezza e rollout nuova app. |
| Policy Firestore effettive | DA VERIFICARE | `firestore.rules` assente; `firebase.json` non dichiara sezione Firestore; il client usa massivamente `storage/<key>`, collection dedicate e `@impostazioni_app/gemini` | Alto/Critico | `docs/security/SICUREZZA_E_PERMESSI.md`, `docs/data/REGOLE_STRUTTURA_DATI.md`, `docs/audit/VERIFICA_INFRASTRUTTURA_FIREBASE_BACKEND.md` | Senza policy versionata non e verificabile l'enforcement reale; attenzione ulteriore perche l'app entra con auth anonima. |
| Governance endpoint IA/PDF multipli | DA VERIFICARE | Canali confermati ma non canonici: `aiCore` callable `europe-west3` (export repo assente), HTTP `us-central1` (`estrazioneDocumenti`, `analisi_economica_mezzo`, `stamp_pdf`, cisterna), Cloud Run libretto `a.run.app`; `api/pdf-ai-enhance`/`server.js` presenti ma non dimostrati attivi | Alto | `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`, `docs/architecture/FUNZIONI_TRASVERSALI.md`, `docs/audit/VERIFICA_INFRASTRUTTURA_FIREBASE_BACKEND.md`, `docs/product/STORICO_DECISIONI_PROGETTO.md` | Definire ownership, runtime, regione e canale canonico prima di toccare IA/PDF o fare redeploy backend. |
| Policy Storage effettive | DA VERIFICARE | `storage.rules` nel repo blocca read/write (`allow read, write: if false`) ma client e backend usano upload/download/delete/listAll su molti path reali (`mezzi/*`, `mezzi_aziendali/*`, `inventario/*`, `materiali/*`, `autisti/*`, `documenti_pdf/*`, `preventivi/*`) | Critico | `docs/security/SICUREZZA_E_PERMESSI.md`, `docs/audit/VERIFICA_ALLINEAMENTO_REPO_E_DOCUMENTI.md`, `docs/audit/VERIFICA_INFRASTRUTTURA_FIREBASE_BACKEND.md` | Non toccare rules, bucket o path Storage senza matrice completa path->modulo->operazione, perche il rischio di regressione sui flussi reali e immediato. |

## Regola di aggiornamento
- Ogni punto chiuso o modificato va aggiornato qui nello stesso task.
- Se emerge un nuovo dubbio architetturale o dati/sicurezza, aggiungerlo subito.
- Se non ci sono prove sufficienti, indicare sempre `DA VERIFICARE`.
