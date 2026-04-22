# SICUREZZA E PERMESSI

Versione: 2026-03-06  
Scopo: blueprint sicurezza/permessi per la nuova app GestioneManutenzione.

## Legenda stato
- **[CONFERMATO]**: dimostrato da repository.
- **[RACCOMANDAZIONE]**: modello target da adottare.
- **[DA VERIFICARE]**: manca evidenza o decisione finale.

---

## Stato attuale repository (baseline)
- Autenticazione anonima all'avvio app (`signInAnonymously`) [CONFERMATO, `src/App.tsx`].
- Route admin/capo/autisti senza guard ruolo esplicita a livello routing [CONFERMATO, `src/App.tsx`].
- `storage.rules` blocca ogni read/write (`allow read, write: if false`) [CONFERMATO, `storage.rules`].
- File `firestore.rules` non presente nel repository [CONFERMATO -> governance Firestore DA VERIFICARE].
- Chiave IA Gemini gestita su Firestore (`@impostazioni_app/gemini`) e letta dal client [CONFERMATO, rischio da gestire].

---

## A) Modello account iniziale (target)

### 1. Super Admin [RACCOMANDAZIONE]
- Gestisce utenti, ruoli, permessi, policy sicurezza, audit.
- Accesso completo a tutte le aree, inclusi dati sensibili e funzioni amministrative.

### 2. Account gestionale [RACCOMANDAZIONE]
- Utente operativo ufficio (admin/capo in base ai permessi assegnati).
- Accesso modulare per area (Flotta, Operativita, Magazzino, Dossier, Analisi, Autisti Inbox).

### 3. Autista [RACCOMANDAZIONE]
- Accesso solo area autisti (gate/login/setup/home/operazioni campo).
- Nessun accesso diretto a pannelli amministrativi, costi economici completi e configurazioni.

Nota: il mapping definitivo tra "admin" e "capo" dentro Account gestionale e ancora [DA VERIFICARE] a livello business.

---

## B) Permessi configurabili da pannello (target)

### Visibilita moduli [RACCOMANDAZIONE]
- Toggle per macro-aree: `Dashboard`, `Operativita`, `Acquisti&MAG`, `Flotta&Dossier`, `Autisti`, `IA&Documenti`, `Sistema`.

### Azioni base per modulo [RACCOMANDAZIONE]
- `read`, `create`, `update`, `delete`, `export_pdf`.

### Permessi su dati sensibili [RACCOMANDAZIONE]
- Costi economici (`@costiMezzo`, preventivi, approvazioni).
- Dati documentali con importi/fornitori.
- Dati identificativi autisti (badge/sessioni/eventi).

### Permessi IA [RACCOMANDAZIONE]
- Uso strumenti IA (estrazione, normalizzazione, salvataggio).
- Modifica configurazione IA (`@impostazioni_app/gemini`) riservata.

### Permessi utenti/ruoli [RACCOMANDAZIONE]
- Creazione/modifica/disattivazione account.
- Assegnazione ruoli e scope per modulo.
- Storico modifiche permessi obbligatorio (audit).

---

## C) Audit log (target)

### Cosa tracciare [RACCOMANDAZIONE]
1. Login/logout e cambi sessione autisti.
2. Create/update/delete su entita critiche (`lavori`, `manutenzioni`, `ordini`, `inventario`, `documenti`, `costi`).
3. Import/rettifiche da inbox autisti e merge verso dati canonici.
4. Export PDF (chi, cosa, quando, da quale modulo).
5. Azioni IA (upload, estrazione, conferma, salvataggio).
6. Cambi permessi, ruoli e configurazioni sicurezza.

### Perche [RACCOMANDAZIONE]
- Tracciabilita operativa.
- Riduzione rischio errori silenziosi.
- Supporto investigazione incidenti.
- Base per compliance interna e controllo accessi.

---

## D) Raccomandazioni sicurezza

### Autenticazione [RACCOMANDAZIONE]
- Eliminare dipendenza da auth anonima in produzione.
- Introdurre identita utente forte e sessioni esplicite per ruolo.

### Autorizzazione [RACCOMANDAZIONE]
- Enforcement server-side (Firestore/Functions rules) coerente con permission matrix.
- UI gating non sufficiente come controllo sicurezza.

### Protezione cancellazioni [RACCOMANDAZIONE]
- Soft delete per entita ad alto impatto (documenti, costi, ordini, eventi rettificati).
- Hard delete solo con permesso esplicito e conferma forte.

### Conferme forti [RACCOMANDAZIONE]
- Step conferma con riepilogo impatto per azioni irreversibili.
- Eventuale doppia conferma per dati economici/documentali.

### Visibilita economica [RACCOMANDAZIONE]
- Scope granulari su costi/preventivi/analisi.
- Mascheramento dati economici per ruoli senza autorizzazione.

### Segregazione area autisti [RACCOMANDAZIONE]
- Route e permessi separati tra app autisti e area admin.
- Nessun ponte diretto non autorizzato verso pannelli di backoffice.

### Segreti e configurazioni IA [RACCOMANDAZIONE]
- Spostare gestione segreti su canali server sicuri.
- Evitare esposizione client-side di API key.

---

## E) Richiesta operativa a Codex (obbligatoria)

Per ogni task futuro sulla sicurezza, richiedere esplicitamente a Codex:
1. **raccomandazioni pratiche incrementali senza modificare subito il codice**,  
2. **priorita rischio/impatto** (alto/medio/basso),  
3. **proof points nel repository** per ogni suggerimento,  
4. **separazione tra fatto dimostrato e proposta target**.

Template minimo richiesta:
- "Analizza sicurezza attuale (read-only), indica gap dimostrati, proponi azioni no-code immediate e poi azioni code-change phased."

---

## Backlog sicurezza (priorita)
1. Definire permission matrix ufficiale (ruoli x moduli x azioni) [ALTA].
2. Formalizzare policy Firestore/Functions allineata ai ruoli [ALTA, DA VERIFICARE].
3. Introdurre audit log trasversale [ALTA].
4. Governare segreti IA lato server [ALTA].
5. Consolidare policy delete/restore e retention [MEDIA].


