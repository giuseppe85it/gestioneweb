# Change Report

## Data
- Timestamp: `2026-04-08 11:37:42`
- Modulo: `/next/manutenzioni`
- Tipo intervento: allineamento finale all'immagine allegata in chat

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `CONTEXT_CLAUDE.md`

## Cosa e stato riallineato
- La fascia dati superiore resta sempre a 5 blocchi (`Targa`, `Modello`, `Autista solito`, `KM attuali`, `Ultima manutenzione`) anche in fallback.
- La dashboard e stata asciugata per aderire all'immagine finale: niente card laterale interna, niente heading extra sopra KPI e pulsanti, solo titolo, frase breve, 4 KPI, 4 CTA e lista `Ultimi interventi`.
- Il tab attivo usa ora un look scuro coerente con l'immagine finale invece del vecchio stato chiaro.

## Cosa non cambia
- Nessuna modifica a logiche dati, writer, domain, `pdfEngine`, shape Firestore o upload/hotspot business.
- Gestione reale delle 4 foto confermata senza nuovi contratti dati.

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx`
- `npm run build`
