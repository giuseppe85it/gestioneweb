# Problemi UI e Opportunita (senza cambiare logica)

## Problemi osservati

### 1) Duplicazioni di navigazione e flusso
- Dossier mezzo ha alias multipli (`/dossiermezzi/:targa` e `/dossier/:targa`) con stesso componente.
- Flusso ordini appare in almeno tre aree: `Acquisti`, `OrdiniInAttesa/Arrivati`, `DettaglioOrdine`.
- Eventi autisti sono visibili in Inbox, liste dedicate e `AutistiAdmin` con funzioni sovrapposte.

### 2) Complessita elevata in pagine singole
- File molto estesi: `Acquisti.tsx` (~6394 linee), `Home.tsx` (~4011), `AutistiAdmin.tsx` (~3704), `DossierMezzo.tsx` (~1843), `Mezzi.tsx` (~1831), `CentroControllo.tsx` (~1716).
- Alta densita di responsabilita UI+dati nello stesso componente (caricamento, normalizzazione, workflow, export PDF, share).

### 3) Naming non uniforme
- Mix italiano/inglese nei titoli e nelle route (`Home`, `GestioneOperativa`, `IAHome`, `CentroControllo`).
- Pattern eterogenei per percorsi (`/dossiermezzi`, `/dossier/:targa`, `/acquisti/dettaglio/:ordineId`).
- Chiavi dati con semantiche simili ma differenti (`@rifornimenti_autisti_tmp` vs `@rifornimenti`).

### 4) CTA importanti non sempre prioritarie
- Azioni critiche spesso in modali o tab secondarie (es. import gomme, rettifica eventi, approvazione preventivi).
- Funzioni PDF presenti in molte pagine ma senza entrypoint coerente.
- IA suddivisa in piu pagine tecniche; flusso utente non sempre evidente (apikey -> upload -> verifica -> salvataggio).

### 5) Flussi spezzati tra ruoli
- Autista produce eventi su key `tmp`, admin li legge e in parte li canonicalizza: la transizione non e sempre visibile a UI.
- Revoche sessione e coerenza assetto avvengono sia lato cloud key sia local storage autista.
- Stato di lettura/nuovo (`letta`, `stato`) varia per modulo e puo creare inconsistenze di badge/count.

### 6) Rischi di usabilita da stato distribuito
- Coesistenza di Firestore e localStorage per parti di sessione/UX.
- Record con shape multipla (`array`, `{value}`, `{items}`) in vari moduli.
- Gestione allegati non transazionale (delete file e update record in passaggi separati).

## Opportunita di semplificazione (UI/IA senza cambiare logica dati)

### A) Consolidare la struttura informativa
- Unificare i percorsi duplicati sotto una route canonica per area.
- Separare chiaramente shell Admin e shell Autisti.
- Ridurre il menu top-level a 6-8 voci admin con sotto-aree stabili.

### B) Ridurre carico cognitivo per task
- Rendere ogni pagina "task-first": 1 obiettivo principale, 2-3 CTA primarie massime.
- Spostare azioni avanzate in pannello secondario coerente (non mescolate nel flusso base).
- Standardizzare pattern tabella/lista: filtri in alto, azione primaria a destra, stato record in chip coerenti.

### C) Uniformare stati e feedback
- Pattern unico per `loading`, `errore`, `empty state`, `salvato`.
- Pattern unico per modali (titolo, azione primaria, annulla, chiusura).
- Pattern unico per anteprima PDF + condivisione.

### D) Esplicitare passaggi tmp -> ufficiale
- Nei moduli autisti/admin mostrare chiaramente lo stato record: `nuovo`, `letto`, `rettificato`, `importato`.
- Visualizzare quando un evento genera entita operative (es. segnalazione -> lavoro, rifornimento tmp -> dossier).

### E) Rendere IA piu lineare
- Sequenza guidata unica: `API key` -> `Upload` -> `Analisi` -> `Revisione` -> `Salvataggio`.
- Distinguere bene documenti "da verificare" dai documenti validati.
- Tenere `Cisterna` come sotto-flusso specialistico ma con entrypoint comune nel menu IA.

## Quick win suggeriti
- Canonicalizzare i link dossier in tutte le card/CTA.
- Creare breadcrumb coerente in pagine profonde (`Dettaglio*`, `CapoCosti`, `Dossier`).
- Evidenziare CTA di import/approvazione in Inbox/Admin con stato progressivo.
- Unificare etichette pulsanti principali (`Salva`, `Conferma`, `Importa`, `Esporta PDF`) in tutto il prodotto.

## Punti DA VERIFICARE
- Quante route legacy devono rimanere per compatibilita bookmark esterni.
- Se `autisti_eventi` e ancora usata in produzione o solo fallback storico.
- Regole definitive di permesso per differenziare viste `Admin` vs `Capo` vs `Autista`.
