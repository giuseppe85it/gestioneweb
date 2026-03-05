# Sitemap Proposta (To-Be, senza modifiche logiche)

Obiettivo: struttura piu lineare, max 6-8 voci top-level, separazione netta Admin vs Autisti.

## A) Shell Admin Web (7 voci top-level)
1. **Dashboard**
2. **Operativita**
3. **Acquisti & Magazzino**
4. **Flotta & Dossier**
5. **Autisti**
6. **IA & Documenti**
7. **Anagrafiche & Config**

### 1. Dashboard
- Home (alert, KPI, scorciatoie operative)
- Centro priorita (segnalazioni KO/scadenze)

### 2. Operativita
- Lavori: Da eseguire / In attesa / Eseguiti / Dettaglio lavoro
- Gestione Operativa (hub)
- Centro Controllo (tab manutenzioni/rifornimenti/segnalazioni/controlli/richieste)

### 3. Acquisti & Magazzino
- Acquisti (single source per ordini, arrivi, preventivi, listino)
- Inventario
- Materiali consegnati
- Attrezzature cantieri
- Fornitori
- Ordini dedicati (`OrdiniInAttesa`, `OrdiniArrivati`, `DettaglioOrdine`) da declassare a viste secondarie/legacy

### 4. Flotta & Dossier
- Mezzi
- Dossier lista e dettaglio mezzo (un solo pattern route canonico)
- Mezzo 360 / Autista 360
- Manutenzioni
- Analisi economica
- Capo mezzi/costi (come sotto-area ruolo capo)

### 5. Autisti
- Inbox autisti (home + liste evento)
- Rettifica dati (`AutistiAdmin`)
- Cambio mezzo inbox
- Log accessi

### 6. IA & Documenti
- Hub IA
- Documenti IA (estrazione + salvataggio)
- Libretti (analisi, copertura, export)
- Cisterna (archivio + IA + schede)

### 7. Anagrafiche & Config
- Colleghi
- Impostazioni IA API key
- Utility debug (es. `ControlloDebug`) come strumenti tecnici secondari

## B) Shell Autisti (separata)
Top-level autista (4 voci):
1. **Home**
2. **Operazioni**
3. **Assetto Mezzo**
4. **Sessione**

### Operazioni
- Rifornimento
- Controllo mezzo
- Segnalazioni
- Richiesta attrezzature
- Gomme

### Assetto Mezzo
- Setup mezzo iniziale
- Cambio mezzo

### Sessione
- Stato sessione attiva
- Logout

## C) Dove vive IA e dove vive PDF
- **IA**: area unica `IA & Documenti` (Admin), con ingressi separati per Documenti/Libretti/Cisterna.
- **PDF**:
  - azione contestuale dentro i moduli (es. Dossier, Lavori, Centro Controllo, Acquisti);
  - opzionale hub secondario "Export" (solo link/filtro), senza duplicare la logica di generazione gia presente.

## D) Regole routing proposte
- Tenere un solo alias per lo stesso dettaglio (`/dossier/:targa` oppure `/dossiermezzi/:targa`, non entrambi).
- Evitare tab duplicate distribuite su route diverse quando gia presenti in `Acquisti`.
- Prefisso ruolo per aree specialistiche:
  - `admin/*` (shell admin),
  - `capo/*` (sotto-area admin),
  - `autisti/*` (shell autista).

## E) Da verificare prima di implementare
- Permessi effettivi per ruoli (admin/capo/autista) attualmente gestiti lato UI.
- Necessita reale di mantenere route legacy per backward compatibility bookmark.
