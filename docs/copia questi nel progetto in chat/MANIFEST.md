# MANIFEST — Documentazione canonica per chat

**Cartella:** `docs/copia questi nel progetto in chat/`
**Data ultimo aggiornamento:** 2026-05-16
**Generato da:** PROMPT 57 — Bonifica documentazione + governance update

> Questa cartella contiene la documentazione canonica del progetto da caricare in chat con Claude/GPT architetto. Quando la cartella cambia (file aggiunto/spostato/rimosso), questo manifest va aggiornato nello stesso commit. Vedi `AGENTS.md` sez. 17 e `CLAUDE_CHAT_BEHAVIOR.md` sez. 3.

---

## Ordine consigliato di caricamento in chat

### 1. Governance + regole (sempre, in cima)

Prima di tutto leggi i 2 file in root (NON in questa cartella):
- `AGENTS.md` — regole operative agenti, divieti permanenti, regole permanenti `AUDIT-CERCA-PER-TARGA` e `TIMESTAMP-MAI-DA-CLICK`.
- `CLAUDE_CHAT_BEHAVIOR.md` — comportamento Claude in chat, eccezioni permanenti (opzione α, strategia 3a, madre intoccabile, decisione J.7).
- `METODO_AGENTI.md` (root) — metodo di lavoro con i 4 agenti (Codex, Claude Code, Claude+GPT chat).

Poi da questa cartella:

| File | Cosa contiene |
|---|---|
| `DIARIO_DECISIONI.md` | Decisioni strategiche append-only (ultima entry 2026-05-15). Fonte vincolante per ogni decisione di perimetro. |
| `PROTOCOLLO_SICUREZZA_MODIFICHE.md` | Protocollo da applicare per task ad alto rischio/sicurezza. |

### 2. Registri vivi (stato corrente)

| File | Cosa contiene |
|---|---|
| `STATO_ATTUALE_PROGETTO.md` | Stato corrente del progetto (modulo per modulo). |
| `STATO_MIGRAZIONE_NEXT.md` | Registro vivo della migrazione NEXT (cosa è migrato, cosa manca). |
| `REGISTRO_MODIFICHE_CLONE.md` | Registro delle modifiche al clone NEXT (voce breve per ogni intervento). |
| `REGISTRO_COLLECTION_FIRESTORE.md` | Registro Collection Firestore v1.0 STABLE — mappa unica gestionale. |

### 3. Audit attuali (fotografia stato e UX)

| File | Cosa contiene |
|---|---|
| `AUDIT_NEXT_COMPLETO_2026-05-16.md` | Audit completo NEXT su 6 superfici + piano d'urgenza + raccomandazione Chat IA (PROMPT 54). |
| `AUDIT_AUTISTI_PROFONDO_2026-05-16.md` | Audit UX profondo dei 3 segmenti autisti (App + Inbox + Admin) — schema A1-A10 per vista (PROMPT 56). |
| `CHANGELOG_AUDIT_01-08_AGGIORNAMENTO_2026-05-16.md` | Changelog dei delta applicati agli audit 01-08 (PROMPT 55). |

### 4. Audit numerati 01-08 (baseline tecnica aggiornata al 2026-05-16)

| File | Cosa contiene |
|---|---|
| `01_AUDIT_REALE_MODULI_NEXT_COLLEZIONI_FLUSSI.md` | Inventario moduli NEXT, route, reader/writer, flussi dati. |
| `02_DATA_CONTRACT_REALE_NEXT_FIREBASE.md` | Data contract reale collezioni/Storage NEXT con scope barrier. |
| `03_DIAGRAMMI_FLUSSI_DATI_NEXT.md` | Diagrammi Mermaid flussi NEXT (Manutenzioni, Magazzino, Procurement, Autisti, Cisterna, Euromecc, Chat IA). |
| `04_AUDIT_CHIUSURA_DA_VERIFICARE_NEXT.md` | Audit chiusura punti DA VERIFICARE + regole permanenti `AUDIT-CERCA-PER-TARGA` e `TIMESTAMP-MAI-DA-CLICK`. |
| `05_AUDIT_AUTISTI_MADRE_NEXT_IMPORT_DEFINITIVO.md` | Mappa Autisti madre vs NEXT + stato sostituzione NEXT (riferimento a `AUDIT_NEXT_COMPLETO_2026-05-16.md` cap. 5.3). |
| `06_DIAGRAMMI_AUTISTI_E_PUNTI_APERTI.md` | Diagrammi flussi autisti + closeup CC torre operativa + aggancio inverso PROMPT 47. |
| `07_SINTESI_OPERATIVA_PER_GIUSEPPE.md` | Sintesi operativa stato progetto + raccomandazione Chat IA + ordine letture. |
| `08_AUDIT_FIRESTORE_STORAGE_RULES_NEXT.md` | Audit rules Firestore/Storage + lista 15+ scope barrier `cloneWriteBarrier.ts`. |

### 5. SPEC attive (moduli ancora in evoluzione)

| File | Cosa contiene |
|---|---|
| `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md` | SPEC v1.0 Chat IA NEXT modalità Zero-Invenzioni (5 viste certificate, schema strict, Catalog Validator). |
| `SPEC_MOTORE_GENERICO_NEXT.md` | SPEC v1.0 STABLE Motore Generico (assorbe `collection_root`, resolver multi-vista). |
| `MAPPA_IA_CHAT_NEXT.md` | Telaio costituzionale Chat IA ad alto livello (riferimento da `SPEC_CHAT_ZERO_INVENZIONI_NEXT` sez. 18.1). |

### 6. Riferimenti dati e architettura (per task specifici)

| File | Cosa contiene |
|---|---|
| `MAPPA_COMPLETA_DATI.md` | Mappa completa dataset gestionali. |
| `DOMINI_DATI_CANONICI.md` | Domini dati canonici (autisti, mezzi, cantieri, etc). |
| `REGOLE_STRUTTURA_DATI.md` | Regole struttura dati condivisi (chiavi, normalizzazioni). |
| `LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md` | Linee guida architetturali sottosistema IA interna. |
| `CHECKLIST_IA_INTERNA.md` | Checklist operativa IA interna. |
| `STATO_AVANZAMENTO_IA_INTERNA.md` | Stato avanzamento IA interna. |

---

## Convenzioni

- **Niente doppioni**: ogni file vive qui in una sola istanza. Se serve aggiungerne uno, va SPOSTATO (preferibilmente `git mv`), non copiato.
- **Path con spazi**: il nome cartella è letterale (`docs/copia questi nel progetto in chat/`). In comandi shell va quotato. In markdown link basta scriverlo come testo.
- **Quando questo manifest cambia**: aggiornare anche `AGENTS.md` sez. 17 (se cambiano regole) e/o `CLAUDE_CHAT_BEHAVIOR.md` sez. 3 (se cambia l'ordine di caricamento in chat). Tutto nello stesso commit.

## File fuori cartella ma fonti vive

Alcuni file rimangono fuori da questa cartella per scelta esplicita (categoria B della bonifica 2026-05-16):

- `docs/_live/AUDIT_*_2026-05-1[2-5]*.md` (~10 file) — audit data-based citati da `DIARIO_DECISIONI.md` o da `AUDIT_NEXT_COMPLETO_2026-05-16.md` cap. 2.
- `docs/_live/REPORT_PROMPT4[4-9]_*.md` + `REPORT_PROMPT5[0-3]_*.md` — report dei singoli prompt 44-53, citati in `DIARIO_DECISIONI.md` come "Rif: <file>".
- `docs/_live/REPORT_MACCHINA_CHIUSURA_CICLO_EVENTI_2026-05-14.md`, `REPORT_DATE_UNIFICATE_2026-05-14.md`, `REPORT_STORIA_UNIFICATA_2026-05-14.md`, `REPORT_ELIMINA_QUADRO_OFFICINE_2026-05-14.md`, `REPORT_FIX_MODIFICA_MANUTENZIONE_2026-05-14.md`, `REPORT_FINALE_DISMISSIONE_LAVORI_NEXT_2026-05-13.md`, `REPORT_FASI_1-4_DISMISSIONE_LAVORI_NEXT_2026-05-12.md` — storia dei sotto-prompt chiusi.
- `docs/_live/AUDIT_PRECOMMIT_2026-05-15.md`, `docs/_live/RUNTIME_FLUSSO_CONTROLLO_KO_MANUTENZIONE_DAFARE.md`, `docs/_live/DISCOVERY_DOPPIONI_GOMME_2026-05-14.md`.
- `docs/_live/STORICO_AUDIT_COMPRESSO.md`, `docs/_live/STORICO_PATCH_COMPRESSO.md` — storico compresso (regola AGENTS.md sez. 16).
- `docs/_live/REGISTRO_PUNTI_DA_VERIFICARE.md`, `docs/_live/README.md`.
- `docs/_live/spec/**` — SPEC vive di moduli (Manutenzioni, Euromecc, Dettaglio, Anagrafiche, Mappa storico, Lavori UI dismessa).
- `docs/_live/security/SICUREZZA_E_PERMESSI.md` — citato in audit 08.
- `docs/_live/architecture/{NUOVA_STRUTTURA_GESTIONALE,PROCEDURA_MADRE_TO_CLONE,MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE}.md`.
- `docs/_live/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md`.
- `docs/audit/AUDIT_{ARCHIVISTA_PERSISTENZA_LIBRETTO,CENTRO_CONTROLLO_AVANZATO,FATTUALE_CENTRO_CONTROLLO_NEXT,INDIPENDENTE_BLOCCO_8_C6,PERSISTENZA_MEZZO_NEXT,RIAPRI_REVIEW_DIAGNOSI}_*.md` — fonti storiche citate in DIARIO_DECISIONI o audit 04.
- `docs/audit/2026-05-07_mappa_next_flussi_dati/{00_INDICE_REPORT,01_AUDIT_REALE_*,02_DATA_CONTRACT_*,03_DIAGRAMMI_*}.md` — package handoff con copie congelate (01-03). I numerati 04-08 ora vivono qui in cartella canonica.
- `docs/product/AUDIT_RIMOZIONE_STUB_ARCHIVISTA.md` — fonte di una decisione referenziata.
- `docs/product/SPEC_{ATTREZZATURE_CANTIERI_NEXT,OSSATURA_CHAT_IA_NEXT,ARCHIVIO_STORICO_NEXT,DISMISSIONE_LAVORI_NEXT}.md` + `PIANO_ESECUTIVO_CHAT_IA_NEXT.md` — SPEC con riferimenti residui in codice.
- `docs/_archive/**`, `docs/_handoff_2026-05-04/**` — archivi dichiarati.
- `docs/verdicts/**` — verdetti chiusura modulo (azione irreversibile).
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md` — 1 src-ref residuo.

Per il dettaglio della bonifica e dei criteri di classificazione vedi `AUDIT_NEXT_COMPLETO_2026-05-16.md`, `CHANGELOG_AUDIT_01-08_AGGIORNAMENTO_2026-05-16.md`, e la sezione "BONIFICA COMPLETATA" del riepilogo PROMPT 57 in chat.
