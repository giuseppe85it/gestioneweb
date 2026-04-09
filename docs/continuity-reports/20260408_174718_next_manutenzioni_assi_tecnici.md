# Continuity Report - 2026-04-08 17:47:18

## Contesto
Il modulo `/next/manutenzioni` aveva gia una UI riallineata, ma il flusso gomme/assi restava non strutturato:
- nella madre il modale gomme scriveva solo testo in descrizione;
- in NEXT non esisteva selezione assi inline;
- il `Dettaglio` usava solo foto/hotspot e non caricava tavole tecniche da `public/gomme`.

## Stato dopo la patch
- `Nuova / Modifica` espone chip inline per selezionare gli assi coinvolti.
- Il record manutenzione supporta `assiCoinvolti?: string[]`.
- `Dettaglio`, nelle sole viste `Sinistra/Destra`, carica la tavola tecnica corretta in base alla categoria del mezzo e illumina gli assi salvati.
- `Fronte/Retro` mantengono il comportamento attuale/fallback.
- Il modale legacy gomme non viene piu montato dalla pagina NEXT `Manutenzioni`.

## Convenzioni reali riusate
- Id asse canonici:
  - `anteriore`
  - `posteriore`
  - `asse1`
  - `asse2`
  - `asse3`
- Mapping categorie/immagini deterministico basato sui file reali di `public/gomme/*`.
- Nessuna inferenza da descrizione per il nuovo dato strutturato.

## Limiti residui
- Le tavole tecniche reali esistono solo per `Sinistra/Destra`; `Fronte/Retro` restano su fallback attuale.
- L'highlight automatico usa l'ultima manutenzione del mezzo che contiene `assiCoinvolti`; non e ancora un browser di storico assi multi-record.
- Stato modulo invariato: `PARZIALE`.

## Verifiche tecniche
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextMappaStoricoDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts`
- `npm run build`
