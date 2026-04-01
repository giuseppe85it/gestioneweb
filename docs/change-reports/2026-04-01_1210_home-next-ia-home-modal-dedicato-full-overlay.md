# Change Report - 2026-04-01 12:10

## Sintesi
La Home NEXT mantiene ora un launcher IA minimale e apre all'invio un modale full-overlay con superficie conversazionale dedicata, collegata alla logica reale della IA interna.

## File toccati
- `src/next/components/HomeInternalAiLauncher.tsx`
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Dettagli
- Il modale Home viene renderizzato via portal sopra tutta la pagina, fuori dalla card della Home.
- `NextInternalAiPage` espone una variante `home-modal` che riusa orchestrazione, thread e allegati senza mostrare la dashboard completa.
- La route `/next/ia/interna` resta invariata come superficie completa separata.

## Verifica
- Build runtime eseguita con esito positivo.
