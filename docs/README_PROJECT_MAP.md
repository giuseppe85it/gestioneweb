# README PROJECT MAP

Indice dei documenti architetturali/dati/sicurezza che costituiscono la base del progetto GestioneManutenzione.

## 1) Fonte di verita (ordine ufficiale)
1. `docs/PROJECT_MASTER_BLUEPRINT.md`  
   Documento madre: visione, architettura attuale/target, regole centrali.
2. `docs/architecture/NEXT_APP_ARCHITECTURE.md`  
   Architettura pratica area-per-area della nuova app.
3. `docs/architecture/NEXT_APP_INFORMATION_ARCHITECTURE.mmd`  
   Mappa mermaid dei collegamenti tra aree principali.
4. `docs/data/DATA_MASTER_MAP.md`  
   Mappa completa key/collection/storage path + writer/reader.
5. `docs/data/DATA_CONTRACT_MASTER.md`  
   Contratto dati globale (entita, campi, relazioni, regole).
6. `docs/security/SECURITY_AND_PERMISSIONS_BLUEPRINT.md`  
   Blueprint sicurezza, ruoli, permessi, audit.
7. `docs/architecture/CROSS_CUTTING_CONCERNS.md`  
   Regole trasversali (PDF, IA, ricerca, sicurezza, navigazione mezzo, report).
8. `docs/product/PROJECT_DECISIONS_LOG.md`  
   Registro decisioni architetturali con stato confermato/da verificare.
9. `docs/product/CODEX_WORKING_RULES.md`  
   Regole operative per futuri prompt Codex.

## 2) Documenti di base gia prodotti (supporto)
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
1. Parti sempre da `PROJECT_MASTER_BLUEPRINT`.
2. Verifica che la modifica richiesta sia coerente con `NEXT_APP_ARCHITECTURE`.
3. Prima di toccare dati, consulta `DATA_MASTER_MAP` e `DATA_CONTRACT_MASTER`.
4. Prima di toccare accessi/sicurezza, consulta `SECURITY_AND_PERMISSIONS_BLUEPRINT`.
5. Registra nuove scelte in `PROJECT_DECISIONS_LOG`.
6. Applica le regole operative in `CODEX_WORKING_RULES`.

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
