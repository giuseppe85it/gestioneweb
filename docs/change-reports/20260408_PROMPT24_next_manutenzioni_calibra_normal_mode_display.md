# Change Report — PROMPT24: Calibra normal-mode display + audit 4 problemi

**Data:** 2026-04-08
**Modulo:** `/next/manutenzioni` — `NextMappaStoricoPage` + CSS
**Tipo:** bug fix UI

## Obiettivo
Completare i 4 fix richiesti dal PROMPT 24 nel runtime NEXT `Manutenzioni`:
- Problema A: marker tecnici salvati visibili anche in modalita normale (non-calibra)
- Problema B: `Km dal cambio gomme` visibile nel pannello Dettaglio
- Problema C: nessun doppione tra `Ultimo intervento mezzo` e `Ultime manutenzioni mezzo`
- Problema D: UI pulita in normale, distinta in calibra

## Diagnosi

Problemi B, C, D erano gia risolti nei run precedenti (2026-04-08 pomeriggio/sera).

Problema A era parzialmente risolto: il flusso `Calibra` (click target, click disegno, drag, Salva, rilettura override al reload) era gia completo e funzionante. Il gap residuo:
- In `NextMappaStoricoPage.tsx`, riga 699: `{modalitaSetup ? technicalMarkers.map(...) : null}`
- Questa riga nascondeva TUTTI i marker quando calibra era disattivato, inclusi quelli con override salvato
- Secondo la spec: "In NORMAL mode: only show REAL saved targets (no placeholder markers)"

## Fix applicato

**`src/next/NextMappaStoricoPage.tsx`**
- Nel ramo `else` di `{modalitaSetup ? ... : null}`, aggiunto render dei soli target salvati come `<span>` display-only con classe `man2-technical-marker--readonly`
- La logica di source per il normale usa esclusivamente `technicalTargetOverridesById.get(area.id)` — nessun draft, nessun drag
- I marker normali non hanno `onPointerDown` ne cursor interattivo

**`src/next/next-mappa-storico.css`**
- Aggiunta `.man2-technical-marker--readonly { cursor: default; pointer-events: none; opacity: 0.72; }`

## Flusso Calibra completo (after fix)
1. Click `Calibra` → `setModalitaSetup(true)`, toolbar distinto con `.is-calibra`
2. Selezione target dalla palette → `setSelectedTechnicalTargetId`, `setDraftTechnicalTargetPos` (se ha override)
3. Click sul canvas tecnico → `handleTechnicalCanvasClick` → `setDraftTechnicalTargetPos` → marker appare in posizione
4. Drag marker esistente → `onPointerDown` + `handleTechnicalCanvasPointerMove` + `handleTechnicalCanvasPointerUp` → marker segue il cursore
5. Click `Salva` → `handleSaveTechnicalTargetPosition` → `saveNextMappaStoricoTechnicalTargetOverride` → persiste su `@mezzi_tecnico_target_overrides`
6. `setTechnicalTargetOverrides` aggiornato in-place → marker rimane visibile
7. Chiudi `Calibra` → modalitaSetup=false → marker salvati visibili come span read-only
8. Reload pagina → `useEffect([categoriaTecnicaKey, technicalView, vistaAttiva])` → `readNextMappaStoricoTechnicalTargetOverrides` → override riletti → marker visibili in normale

## File toccati
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/next-mappa-storico.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Build
`npm run build` = OK, zero errori TypeScript.

## Rischi residui
- Il modulo resta `PARZIALE` finche non passa audit separato.
- Km dal cambio gomme appare solo se `selectedMaintenance` e non-null (l'utente ha selezionato un record) e il record e di tipo gomme con km validi e non negativi. Comportamento corretto per spec.
