# Backlog Home - Riduzione Rumore

## Doppioni da eliminare
- Doppio cockpit concettuale `Home /next` vs `/next/centro-controllo` da chiarire a livello di posizionamento.
- `Centro rettifica dati (admin)` come scorciatoia Home di primo livello quando esiste gia il flusso naturale `Alert/Stato operativo -> Autisti Inbox -> Rettifica`.
- `Mezzi` e `Dossier Mezzi` esposti insieme nello stesso livello di scorciatoie.
- Cluster procurement esposto con troppi child diretti: `Acquisti`, `Materiali da ordinare`, `Ordini in attesa`, `Ordini arrivati`, `Materiali consegnati`, `Inventario`.
- Cluster IA esposto con troppi child diretti: `IA`, `IA Libretto`, `IA Documenti`, `Libretti Export`, `Cisterna IA`.

## Accessi da spostare
- `Gestione Operativa` da Home piena a `Navigazione rapida`/menu.
- `Autisti Inbox (admin)` da scorciatoia Home prominente a destinazione naturale di `Alert` e `Stato operativo`.
- `Centro rettifica dati (admin)` da Home a ingresso secondario di dominio autisti.
- `Mezzi` e `Dossier Mezzi` da Home a `Navigazione rapida` + ricerca.
- `Acquisti / Procurement` da Home a `Navigazione rapida`/menu operativo.
- `Manutenzioni` da Home a `Navigazione rapida` o alert contestuali.
- `Cisterna` da Home a `Navigazione rapida` o ricerca.
- `IA hub` e strumenti specialistici IA da Home a `Navigazione rapida`/menu IA.

## Moduli da tenere in Home
- `Alert`
- `Stato operativo`
- launcher `IA interna`
- `Navigazione rapida` minimale con ricerca e preferiti

## Moduli da spostare in Navigazione rapida
- `Gestione Operativa`
- `Autisti Inbox (admin)`
- `Mezzi`
- `Dossier Mezzi`
- `Acquisti / Procurement`
- `Manutenzioni`
- `IA` hub
- `Cisterna`

## Moduli da lasciare solo a ricerca/menu/modulo padre
- `Centro rettifica dati (admin)` sotto dominio `Autisti Inbox/Admin`
- `Materiali da ordinare`, `Ordini in attesa`, `Ordini arrivati`, `Materiali consegnati`, `Inventario` sotto parent procurement/operativita
- `IA Libretto`, `IA Documenti`, `Libretti Export`, `Cisterna IA` sotto parent IA
- `App Autisti` nel dominio autisti separato
- accessi per targa al `Dossier Mezzo` via ricerca o `Mezzi`

## Punti DA VERIFICARE
- Frequenza reale di uso per ruolo: il repo non contiene telemetria.
- Decisione finale di prodotto su `Home /next` vs `/next/centro-controllo`: oggi coesistono.
- Matrice ruoli/permessi finale per capire se alcuni link devono sparire per specifici profili.
- Canonicalita evento autisti fra `@storico_eventi_operativi` e collezioni/event stream affini.
- Peso reale in produzione delle sezioni secondarie di `IA interna` (`sessioni`, `richieste`, `artifacts`, `audit`) rispetto al solo launcher Home.
