# CONTINUITY REPORT - Importa documenti layout approvato allineato

## Stato iniziale
- `Archivista` aveva gia la logica V1 attiva sulle quattro famiglie decise, ma la schermata restava troppo verticale e rumorosa rispetto alla spec approvata.
- Il nome visibile era ancora `Archivista documenti`.
- Magazzino e Manutenzione avevano review funzionanti ma non nella grammatica visuale finale `fascia alta + preview + campi + tabella + convalida`.

## Stato finale
- la schermata usa ora il nome prodotto `Importa documenti`;
- la fascia alta e stata riallineata a tre aree affiancate;
- la review desktop segue l'ordine approvato:
  - preview documento
  - dati estratti
  - tabella righe
  - convalida finale
- i rami `Magazzino` e `Manutenzione` sono stati adattati direttamente al nuovo shell senza cambiare i motori.

## Punto di ripartenza
- Se serve rifinire il lavoro, i prossimi candidati naturali sono:
  - `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`
  - `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx`
  - `src/next/internal-ai/internal-ai.css`
- Obiettivo successivo coerente:
  - uniformare i dettagli fini dei bridge secondari alla stessa grammatica visuale gia applicata a Magazzino e Manutenzione.

## Vincoli da preservare
- IA 2 deve restare non chat;
- Magazzino non va rifatto;
- Manutenzione deve restare OpenAI-only;
- nessun uso di `@costiMezzo` come destinazione primaria;
- nessuna patch backend o barrier in continuita a questo task, salvo richiesta esplicita.
