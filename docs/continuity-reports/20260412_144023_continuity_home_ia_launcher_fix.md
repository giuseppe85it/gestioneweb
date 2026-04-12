# Continuity Report - 2026-04-12 14:40:23

## Contesto
- Task: PROMPT 40F
- Focus: audit e fix del launcher IA dalla Home `/next`
- Perimetro runtime autorizzato: `src/next/components/HomeInternalAiLauncher.tsx`, `src/next/NextHomePage.tsx`

## Stato iniziale verificato
- La Dashboard `/next` non apriva la route reale `/next/ia/interna`.
- Il pannello `IA interna` apriva un modale custom con titolo `Conversazione rapida dalla Home`.
- Il modale montava `NextInternalAiPage` in variante `home-modal`.
- Il launcher Home passava `draftPrompt` e `draftAttachments` al sottosistema IA come stato iniziale.

## Decisione applicata
- Scelto il caso architetturale pulito: niente recupero del modale Home.
- Dalla Home si naviga direttamente alla route reale `/next/ia/interna`.

## Stato finale
- Il launcher Home IA non apre piu alcun modale custom.
- Il click dalla Dashboard porta alla pagina reale `/next/ia/interna`.
- Nessuna review sporca si apre di default dal launcher Home.
- L'ingresso unico documentale resta allineato tra Home, menu IA e route diretta.

## Verifiche chiuse
- Lint mirato `OK`
- Build `OK`
- Browser reale verificato su `/next` e `/next/ia/interna`

## Da ricordare nel prossimo task
- Non reintrodurre superfici Home che montano `NextInternalAiPage` fuori dalla route canonica senza una decisione UX esplicita.
- Se si aggiungono quick action dalla Dashboard, devono restare semplici ingressi verso `/next/ia/interna` o usare uno stato esplicito e dimostrabile, mai implicito.
