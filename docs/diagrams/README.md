# Diagrammi Flussi e Dati

## File inclusi
- `docs/diagrams/flows_master.mmd`
  Flusso end-to-end tra UI Autisti, Inbox/Admin, moduli Admin, layer dati e servizi IA/PDF.
- `docs/diagrams/flows_modules.mmd`
  Vista per macro-modulo (Autisti, Inbox, Operativa, Dossier/Capo, IA/Cisterna) con dipendenze dati.
- `docs/diagrams/flows_data_contract.md`
  Data contract tecnico: chiavi Firestore/Storage, writer/reader, schema sintetico, rischi.

## Obiettivo
Questi diagrammi servono a:
1. fissare i confini funzionali prima del redesign UI;
2. evitare regressioni sui flussi dati esistenti;
3. evidenziare aree ad alta complessita (`AutistiAdmin`, `Acquisti`, `Home`, `DossierMezzo`).

## Validazione Mermaid
- Validazione eseguita: controllo sintattico/manuale su struttura `flowchart` e collegamenti.
- Rendering consigliato: Mermaid Live Editor o estensione Mermaid in IDE.
- Se disponibile `mmdc` in locale:
  - `mmdc -i docs/diagrams/flows_master.mmd -o docs/diagrams/flows_master.png`
  - `mmdc -i docs/diagrams/flows_modules.mmd -o docs/diagrams/flows_modules.png`

## Limiti noti
- Alcuni contratti sono eterogenei (`array` vs `value` vs `items`) perche il codice gestisce formati multipli retrocompatibili.
- Le parti marcate `DA VERIFICARE` in `flows_data_contract.md` richiedono conferma runtime/storica dati.
