# INDICE DOCUMENTAZIONE PROGETTO

Indice dei documenti architetturali/dati/sicurezza che costituiscono la base del progetto GestioneManutenzione.

## 1) Fonte di verita (ordine ufficiale)
1. `docs/STRUTTURA_COMPLETA_GESTIONALE.md`  
   Documento madre: visione, architettura attuale/target, regole centrali.
2. `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`  
   Architettura pratica area-per-area della nuova app.
3. `docs/architecture/DIAGRAMMA_STRUTTURA_NUOVA_APP.mmd`  
   Mappa mermaid dei collegamenti tra aree principali.
4. `docs/data/DOMINI_DATI_CANONICI.md`  
   Fonte dominio-centrica principale per leggere i dati, normalizzare i domini e guidare la migrazione NEXT.
5. `docs/data/MAPPA_COMPLETA_DATI.md`  
   Mappa completa key/collection/storage path + writer/reader.
6. `docs/data/REGOLE_STRUTTURA_DATI.md`  
   Contratto dati globale (entita, campi, relazioni, regole).
7. `docs/security/SICUREZZA_E_PERMESSI.md`  
   Blueprint sicurezza, ruoli, permessi, audit.
8. `docs/architecture/FUNZIONI_TRASVERSALI.md`  
   Regole trasversali (PDF, IA, ricerca, sicurezza, navigazione mezzo, report).
9. `docs/product/STORICO_DECISIONI_PROGETTO.md`  
   Registro decisioni architetturali con stato confermato/da verificare.
10. `docs/product/REGOLE_LAVORO_CODEX.md`  
   Regole operative per futuri prompt Codex.

## 2) Documenti di base gia prodotti (supporto)
- `docs/data/CENSIMENTO_DOMINI_DATI_STEP1.md`  
  Report intermedio di censimento/pre-normalizzazione usato per costruire il file dominio-centrico finale.
- `docs/diagrams/*`  
  Flussi master/moduli e data contract operativo.
- `docs/ui-redesign/*`  
  Inventory UI, journey, sitemap current/proposed, issues/opportunities, mappe mentali.
- `docs/ui-redesign/verification_closure.md`  
  Chiusura tecnica dei principali punti "DA VERIFICARE".
- `docs/ui-redesign/modules_master_map.md`  
  Mappa completa moduli e collocazione target.
- `docs/ui-redesign/dossier_convergence_map.md`  
  Convergenza moduli nel Dossier Mezzo.

## 3) Come usare questi documenti
1. Parti sempre da `STRUTTURA_COMPLETA_GESTIONALE`.
2. Verifica che la modifica richiesta sia coerente con `NUOVA_STRUTTURA_GESTIONALE`.
3. Prima di toccare dati, consulta `DOMINI_DATI_CANONICI`.
4. Poi usa `MAPPA_COMPLETA_DATI` e `REGOLE_STRUTTURA_DATI` per i dettagli fisici ed entity-level.
5. Prima di toccare accessi/sicurezza, consulta `SICUREZZA_E_PERMESSI`.
6. Registra nuove scelte in `STORICO_DECISIONI_PROGETTO`.
7. Applica le regole operative in `REGOLE_LAVORO_CODEX`.

## 4) Convenzioni di stato (obbligatorie nei docs)
- `CONFERMATO`: dimostrato dal repository.
- `DA VERIFICARE`: punto aperto non chiudibile con prove correnti.
- `NON DIMOSTRATO`: ipotesi non supportata.
- `RACCOMANDAZIONE`: direzione target proposta.

## 5) Obiettivo operativo
Questa cartella documentale deve sostituire la dipendenza dalla memoria della chat:
- contesto tecnico stabile nel repository,
- decisioni tracciate,
- regole di coerenza per evoluzioni future.

