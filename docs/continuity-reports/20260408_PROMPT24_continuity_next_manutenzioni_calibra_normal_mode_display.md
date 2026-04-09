# Continuity Report — PROMPT24: Calibra normal-mode display

**Data:** 2026-04-08
**Sessione:** PROMPT 24
**Modulo:** `/next/manutenzioni`

## Stato prima
- Flusso Calibra create/place/drag/save/reload: funzionante (run precedenti)
- Km dal cambio gomme: implementato (run precedenti)
- Deduplicazione storico mezzo: implementata (run precedenti)
- Normal mode display marker salvati: MANCANTE — i marker non comparivano fuori da calibra

## Stato dopo
- Flusso Calibra: invariato e funzionante
- Km dal cambio gomme: invariato
- Deduplicazione: invariata
- Normal mode display: RISOLTO — span read-only per target con override salvato

## Cosa rimane aperto
- Audit separato del modulo `Manutenzioni` NEXT per promozione da `PARZIALE` a `CHIUSO`
- Matrice permessi reale non implementata (preset frontend)
- Bridge live Firebase/Storage IA interno chiuso

## File chiave
- `src/next/NextMappaStoricoPage.tsx` — viewer tecnico embedded
- `src/next/domain/nextMappaStoricoDomain.ts` — override persistence su `@mezzi_tecnico_target_overrides`
- `src/next/NextManutenzioniPage.tsx` — parent che passa selectedMaintenance e mezzoInfo

## Come verificare il funzionamento completo
1. `/next/manutenzioni` → mezzo con categoria riconosciuta → tab `Dettaglio` → vista `Sinistra` o `Destra`
2. Bottone `Calibra` visibile nel toolbar → click
3. Selezionare un target dalla palette (es. `Assi sinistra`)
4. Cliccare sul disegno tecnico: marker appare in posizione
5. Drag marker per riposizionarlo
6. Premere `Salva`: messaggio conferma
7. Premere `Chiudi calibra`: il marker resta visibile in grigio/opaco (span read-only)
8. Ricaricare la pagina: tornare in vista Sinistra → marker ancora visibile
9. Selezionare manutenzione gomme con km → verificare `Km dal cambio gomme` nel pannello laterale
10. Verificare che `Ultime manutenzioni mezzo` non contenga lo stesso record del box `Ultimo intervento mezzo`
