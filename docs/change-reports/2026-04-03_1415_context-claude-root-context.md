# Change Report - 2026-04-03 14:15

## Obiettivo
Creare `CONTEXT_CLAUDE.md` nella root come contesto tecnico autosufficiente e sintetico del repository, verificato dal codice e dai documenti primari.

## File toccati
- `CONTEXT_CLAUDE.md`

## Modifiche
- creato un file unico con stack, moduli, stato attuale, decisioni architetturali, convenzioni, prossimi task e file chiave;
- incluse solo informazioni verificabili nel repository;
- esclusi log storici e parti non dimostrabili.

## Verifiche
- letti i documenti primari richiesti da `AGENTS.md`;
- `npm run build` -> `OK`;
- `npm run lint` -> `KO` con errori preesistenti, riportati nel contesto.
