# CHANGE REPORT - Riordino UI home/preview IA interna

## Data
- 2026-03-14 00:35

## Tipo task
- ui

## Obiettivo
- Rendere `/next/ia/interna*` molto piu semplice, leggibile e professionale, correggendo gli errori percepiti della pagina e spostando il risultato in una preview grande separata dalla home.

## File modificati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-14_0035_ui_fix-home-preview-ia-interna.md`
- `docs/continuity-reports/2026-03-14_0035_continuity_fix-home-preview-ia-interna.md`

## Riassunto modifiche
- Eliminata la preview inline dalla home IA e introdotta una preview overlay grande per report mezzo e analisi economica.
- Semplificata la home mantenendo al centro chat e richiesta targa, con area secondaria meno invasiva per archivio, recenti e dettagli avanzati.
- Aumentato il contrasto visivo di shell, card, badge e call to action per ridurre l'effetto monocromatico.
- Corrette varie `key` deboli nel subtree IA per ridurre il warning React sulle liste.
- Verificato che l'errore Vite segnalato su `NextInternalAiPage.tsx` non e riproducibile nello stato corrente del repo.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Home IA piu pulita e lineare, con flusso chiaro `richiesta -> preview`.
- Report piu vicino alla logica visiva del dossier mezzi senza trasformarlo in PDF.
- Nessun impatto su domain, facade, backend, dataset business o flussi correnti.

## Rischio modifica
- NORMALE

## Moduli impattati
- sottosistema IA interna NEXT
- documentazione operativa clone/IA

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- analisi

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Il warning React e stato corretto nel perimetro toccato, ma resta da tenere sotto controllo se in futuro entrano nuove liste con chiavi non stabili.
- Report autista e report combinato restano fuori da questo task e non vanno confusi con la nuova preview.

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx` -> OK
- `npx eslint src/next/internal-ai/internal-ai.css` -> warning previsto: file CSS ignorato dalla configurazione ESLint
- `npm run build` -> OK
- Note residue: warning esterno su `baseline-browser-mapping` non aggiornato e warning Vite sui chunk grandi.

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
