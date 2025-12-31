# AGENTS.md — Regole operative per Codex (Gestione Web)

## Principio base
Codex deve fare SOLO quello che è scritto nel prompt corrente.
Se una cosa non è richiesta esplicitamente, NON va fatta.

---

## MODE (obbligatorio)
Ogni prompt deve iniziare con: `MODE = ...`

### MODE = AUDIT (read-only)
Scopo: analisi e report.
- SOLO lettura del repository.
- Output SOLO in chat.
- VIETATO creare/modificare file, anche dentro docs/** o tools/**.
- VIETATO eseguire script/command che spostano o cancellano file (ovunque).

### MODE = RELAZIONE (screenshot + PDF)
Scopo: documentazione e PDF presentazione.
- Puoi LEGGERE tutto il repository.
- Puoi SCRIVERE/CREARE file SOLO in:
  - docs/presentazione/**
  - tools/**
  - AGENTS.md (solo questo file)
- VIETATO modificare qualsiasi file in src/**.
- Ammessa esecuzione di tool per screenshot/diagrammi/PDF SOLO se:
  - non modifica src/**
  - non sposta/cancella file fuori repo
  - usa di default SOLO localhost (http://localhost:5173)

### MODE = OPERAIO (patch controllate)
Scopo: modifiche al codice (mirate).
- Puoi LEGGERE tutto il repository.
- Puoi MODIFICARE SOLO i file indicati nel prompt (WHITELIST).
- In MODE=OPERAIO è CONSENTITO modificare file in src/** SOLO se inclusi in WHITELIST nel prompt.
- Vietato modificare qualunque altro file fuori whitelist.
- Vietato:
  - refactor globali
  - rename massivi
  - format globale
  - upgrade dipendenze
  - cambi routing/chiavi Firestore/storageSync/logiche core, salvo richiesta esplicita nel prompt
- Se serve un file extra non in whitelist: scrivere SOLO
  - `SERVE FILE EXTRA: <path> — motivo`
  e STOP senza altre modifiche.
- Vietato eseguire script/command che spostano o cancellano file fuori dal repository.

---

## Divieti assoluti (sempre)
- VIETATO spostare/cancellare file al di fuori del repository (qualsiasi disco/cartella esterna).
- VIETATO operare su cartelle di sistema (Windows/Program Files/Driver) salvo richiesta esplicita e motivata nel prompt.
- Se un’azione è rischiosa o irreversibile: STOP e chiedere istruzione nel prompt successivo (non improvvisare).

---

## Network
- Default: NO chiamate esterne.
- Eccezione: solo se il prompt lo richiede esplicitamente.
- Per RELAZIONE: consentito SOLO localhost (BASE_URL) salvo istruzioni diverse.

---

## RELAZIONE — Struttura e requisiti (solo MODE=RELAZIONE)

### Output finale obbligatorio
- docs/presentazione/Relazione_Gestionale.pdf

### Struttura cartelle
docs/presentazione/
  README.md
  data_contract.md
  annotations.json
  screens/
    raw/
    annotated/
  diagrams/
  build/
tools/
  capture_screenshots.js
  render_diagrams.mjs
  annotate_screenshots.py
  build_pdf.py

### Screenshot
- Base URL default: http://localhost:5173 (override con env BASE_URL)
- Viewport 1440x900
- Screenshot fullPage PNG
- Salvare in docs/presentazione/screens/raw/

### Annotazioni
- Box, frecce, callout numerati.
- Sorgente: docs/presentazione/annotations.json
- Output: docs/presentazione/screens/annotated/

### Diagrammi (PNG in docs/presentazione/diagrams/)
1) Architettura (Vite/React, Firestore, Storage, Functions, Autisti)
2) Flusso operativo (Autisti → Inbox/Admin → Import → Dossier)
3) Data Contract (KEY → writer → reader → schema → note)

### Impaginazione PDF (stile presentazione)
Ogni pagina “schermata” a 2 colonne:
- SINISTRA: screenshot annotato
- DESTRA: testo semplice + lista callout numerati (1,2,3...)

Regole testo:
- Frasi corte, parole comuni.
- Spiega cosa vede l’utente e cosa succede quando preme.
- Evita termini tecnici, se servono spiegali in 1 riga.

Il PDF deve includere:
- Copertina + indice
- Sezioni per moduli (Home, Gestione Operativa, Mezzi, Dossier, Autisti, IA, ecc.)
- Screenshot annotati + diagrammi
- Tabella “Data Contract” da docs/presentazione/data_contract.md
- Capitolo “Portabilità e migrazione” + rischi (targa, date, token URL, dedup, permessi)

---

## Contenuti obbligatori (solo MODE=RELAZIONE)

### Flussi
Sezione “Flussi” con:
- Autisti (login → mezzo attivo → azioni → scrittura eventi)
- Admin/Inbox (lettura → revisione → import → storico)
- Dossier (lettura dati → filtri targa → aggregazione → viste)
- Documenti IA (upload → estrazione → verifica → salvataggio)
Ogni flusso:
- diagramma (Mermaid o PlantUML) + 5–10 bullet in italiano semplice.

### Data Contract (chiavi)
Tabella:
KEY → Scopo → Writer → Reader → Schema JSON → Note/Rischi
+ diagramma data-flow per macro-aree:
Autisti, Admin/Inbox, Operativa, Dossier, IA, Documenti.

### Roadmap
Sezione “Possibili implementazioni”:
- cosa si può aggiungere
- impatto (basso/medio/alto)
- prerequisiti
- rischio principale
Solo documentazione.
