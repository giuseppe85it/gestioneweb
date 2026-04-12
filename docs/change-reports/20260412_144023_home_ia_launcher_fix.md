# Change Report - 2026-04-12 14:40:23

## Titolo
Fix launcher IA della Home NEXT verso l'ingresso unico reale

## Obiettivo
Correggere il comportamento reale del pannello `IA interna` in `/next`, eliminando il modale custom `Conversazione rapida dalla Home` e riallineando il click alla route canonica `/next/ia/interna`, senza toccare motore documentale, madre o backend.

## File toccati
- `src/next/components/HomeInternalAiLauncher.tsx`
- `src/next/NextHomePage.tsx`
- `CONTEXT_CLAUDE.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/fonti-pronte/CONTEXT_CLAUDE.md`
- `docs/fonti-pronte/STATO_ATTUALE_PROGETTO.md`
- `docs/fonti-pronte/STATO_MIGRAZIONE_NEXT.md`
- `docs/fonti-pronte/REGISTRO_MODIFICHE_CLONE.md`
- `docs/fonti-pronte/CHECKLIST_IA_INTERNA.md`
- `docs/fonti-pronte/STATO_AVANZAMENTO_IA_INTERNA.md`

## Causa reale verificata
- `src/next/NextHomePage.tsx` montava `HomeInternalAiLauncher` nel pannello `IA interna`.
- `src/next/components/HomeInternalAiLauncher.tsx` apriva un modale `Conversazione rapida dalla Home`.
- Lo stesso file montava dentro il modale `NextInternalAiPage` con `surfaceVariant="home-modal"`.
- Il launcher passava `draftPrompt` come `initialChatInput` e `draftAttachments` come `initialChatAttachments`.
- Questo creava una seconda superficie di ingresso alla IA interna, separata dalla route reale `/next/ia/interna`, e permetteva l'apertura immediata di proposal/review documento gia popolate quando il launcher Home aveva allegati in memoria.

## Soluzione applicata
- Rimosso il modale Home dal launcher.
- `HomeInternalAiLauncher` e stato ridotto a CTA unico verso `/next/ia/interna`.
- Aggiornata la microcopy della Home per dichiarare correttamente che il pannello apre l'ingresso unico documentale reale della NEXT.

## Verifiche eseguite
- `npx eslint src/next/components/HomeInternalAiLauncher.tsx src/next/NextHomePage.tsx` -> `OK`
- `npm run build` -> `OK`
- Browser verificato davvero su `http://localhost:5173/next`:
  - click sul launcher IA della Home;
  - navigazione a `http://localhost:5173/next/ia/interna`;
  - nessun modale `Conversazione rapida dalla Home`;
  - nessuna review sporca o documento `MARIBA` aperto di default;
  - ingresso documentale pulito e coerente col flusso reale.

## Impatto
- La Home non offre piu un secondo ingresso incoerente alla IA interna.
- Lo stato locale del launcher Home non puo piu sporcare la review documentale.
- `/next/ia/interna` resta la sola entrypoint canonica per il flusso documentale unificato.

## Rischi residui
- Restano fuori scope gli errori console gia noti della IA interna non bloccanti.
- Eventuali future quick action Home verso la IA richiederanno una decisione UX separata per non reintrodurre una superficie parallela.
