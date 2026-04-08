# Continuity Report

## Obiettivo
Mantenere il riallineamento di `/next/manutenzioni` al mockup React e aggiungere nel perimetro consentito una gestione reale delle 4 foto camion.

## Stato iniziale verificato
- UI gia riallineata al mockup su dashboard, form, dettaglio a 2 card e quadro PDF.
- Nel form `Nuova / Modifica` i 4 blocchi foto erano ancora solo CTA fittizie verso il tab `Dettaglio`.
- `NextMappaStoricoPage.tsx` conteneva gia il wiring reale di upload foto e refresh snapshot per la vista attiva.

## Stato finale verificato
- Il form usa ora un ramo `photoManager` di `NextMappaStoricoPage` per esporre i 4 punti vista reali.
- Upload e preview sono coerenti per mezzo selezionato e vista selezionata.
- Il dettaglio embedded resta a 2 card e continua a usare le stesse foto caricate.

## Vincoli rispettati
- Nessun file extra fuori whitelist toccato.
- Nessuna modifica a contratti dati, collection, shape Firestore o path Storage.
- Riusata la logica upload esistente invece di introdurre wiring nuovo.

## Rischi residui
- Il modulo `Manutenzioni` resta `PARZIALE` finche non passa audit separato del perimetro scrivente.
- La preview nel form dipende dalla disponibilita della foto nel dataset visuale gia usato dal dettaglio.
