# STATO ATTUALE DEL PROGETTO

## 1. Situazione generale
- **Fase attuale del progetto**: consolidamento documentazione e regole operative, con allineamento tra legacy e architettura target.
- **Stato app legacy**: attiva e riferimento operativo corrente.
- **Stato nuova app next**: definita a livello architetturale/documentale, impostata per evoluzione progressiva e partenza read-only.
- **Stato documentazione**: struttura madre disponibile, documenti core rinominati in italiano, indice e guida di ingresso presenti.
- **Stato processo Codex/report**: regole operative attive (`AGENTS.md`, `REGOLE_LAVORO_CODEX.md`) + template/report di change e continuity gia presenti.
- **Protocollo sicurezza modifiche**: attivo tramite `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`; ogni patch deve passare da analisi impatto prima dell'applicazione.
- **Audit repo vs docs**: eseguito con report dedicato in `docs/audit/`; emerse differenze ad alta priorita su endpoint IA/PDF, policy dati/sicurezza effettive e route legacy ancora attive.
- **Verifica infrastrutturale Firebase/Backend (2026-03-07)**: eseguita in sola lettura; criticita reali confermate su Storage se toccato senza analisi e su canali backend IA/PDF non canonici (`aiCore` non esportata nel repo backend, libretto su Cloud Run esterno); `estraiPreventivoIA` e `stamp_pdf` risultano invece flussi reali da consolidare/documentare.
- **Audit UI/Grafica repo (2026-03-07)**: eseguito in sola lettura; confermate basi forti da riusare per la NEXT (`Dossier`, `CentroControllo`, `Acquisti`, `AutistiInbox/Admin`, `Capo*`) e moduli legacy/transitori da superare o unificare (`Mezzi`, CRUD generici, `MaterialiDaOrdinare` standalone); criticita prevalente architetturale/documentale, non un bug operativo immediato.
- **Blueprint grafico NEXT (2026-03-07)**: creati blueprint visivo, design system, wireframe logici e mappa pattern da riusare in `docs/ui-blueprint/`; la fase successiva sara trasformare questo impianto documentale in shell UI reale della nuova app, lasciando invariata la legacy.

## 2. Decisioni architetturali confermate
- Nuova app in parallelo alla legacy.
- Stessa base dati iniziale (senza duplicazione DB in partenza).
- Fase iniziale next in read-only.
- Home = Centro di Controllo.
- Dossier Mezzo = cuore del sistema.
- Moduli globali separati dai flussi targa-centrici.
- IA integrata come funzione trasversale.
- PDF gestito come funzione trasversale.
- Area Autisti separata da area Admin.
- Modello permessi a 3 livelli (Super Admin / Account gestionale / Autista): **DA VERIFICARE** come conferma finale operativa.

## 3. Documenti principali da leggere
1. `docs/LEGGI_PRIMA.md`
2. `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
3. `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
4. `docs/data/MAPPA_COMPLETA_DATI.md`
5. `docs/security/SICUREZZA_E_PERMESSI.md`
6. `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## 4. Punti aperti da non dimenticare
- Stream eventi autisti canonico (`@storico_eventi_operativi` vs `autisti_eventi`).
- Contratto finale allegati preventivi (`preventivi/ia/*` vs `preventivi/<id>.pdf`).
- Matrice ruoli/permessi definitiva (distinzione admin/capo/account gestionale).
- Policy Firestore effettive (file `firestore.rules` non presente nel repo).
- Governance finale endpoint IA multipli.
- Standard UI canonico cross-modulo per la NEXT (ora definito a livello documentale, da tradurre in shell UI reale).
- Dettaglio e stato aggiornato: `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`.
- Esito dettagliato verifica infrastrutturale: `docs/audit/VERIFICA_INFRASTRUTTURA_FIREBASE_BACKEND.md`.
- Esito dettagliato audit UI repo: `docs/ui-audit/AUDIT_GRAFICA_ATTUALE.md`.
- Esito dettagliato blueprint UI NEXT: `docs/ui-blueprint/BLUEPRINT_GRAFICO_NEXT.md`.

## 5. Ultimi avanzamenti importanti
- Creata documentazione madre completa del progetto.
- Rinomina documenti core in italiano per maggiore leggibilita.
- `AGENTS.md` creato/aggiornato come guida operativa permanente.
- Struttura `change-reports` creata con regole e template.
- Struttura `continuity-reports` creata con regole e template.
- Creato `REGISTRO_PUNTI_DA_VERIFICARE` per memoria fissa dei temi aperti.
- Completata verifica reale Firebase/Backend con chiarimento di rischi immediati, futuri e solo documentali.
- Completato audit UI/grafica del repo con distinzione tra pattern da mantenere, rifinire, unificare o superare per la progettazione NEXT.
- Creato il blueprint grafico ufficiale della NEXT con design system e wireframe logici, pronto per guidare la futura costruzione della shell UI reale.

## 6. Regola operativa obbligatoria
Prima di ogni nuovo task bisogna leggere almeno:
1. `docs/STATO_ATTUALE_PROGETTO.md`
2. `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
3. `docs/data/MAPPA_COMPLETA_DATI.md`
4. `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
5. `AGENTS.md`

Per ogni nuova patch e obbligatorio applicare anche:
6. `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`

## 7. Prossimo passo consigliato
Chiudere in ordine i punti aperti ad alto impatto emersi/rafforzati dagli audit (`aiCore` canonico, policy Storage/Firestore effettive, governance endpoint IA/PDF) e avviare la traduzione del blueprint grafico NEXT in shell UI reale read-only, aggiornando subito `REGISTRO_PUNTI_DA_VERIFICARE` e questo file quando un punto passa da aperto a confermato.

## 8. Stato documento
- **STATO: CURRENT**
