# Change Report

- Timestamp: 2026-04-09 15:44:05
- Tipo intervento: execution runtime mirata
- Prompt: 34

## Obiettivo
Applicare i fix emersi dall'audit cross-modulo di `Manutenzioni` NEXT, con priorita al bug writer su `@materialiconsegnati` e all'allineamento dei campi gomme strutturati verso `Dossier`, `Dossier Gomme` e `Operativita`.

## File runtime toccati
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/NextGommeEconomiaSection.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/domain/nextOperativitaGlobaleDomain.ts`

## File documentali toccati
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`
- `docs/change-reports/20260409_154405_manutenzioni_next_fix_crossmodulo_prompt34.md`
- `docs/continuity-reports/20260409_154405_continuity_manutenzioni_next_fix_crossmodulo_prompt34.md`

## Esito sintetico
- Bug prioritario `@materialiconsegnati` corretto: una sola scrittura coerente sul dataset.
- `nextManutenzioniGommeDomain.ts` privilegia ora i campi strutturati gomme prima del parsing legacy.
- `Dossier` e `Dossier Gomme` mostrano ora ordinario per asse e straordinari con motivo.
- `Operativita` legge `@manutenzioni` con descrizioni piu coerenti per gli interventi gomme strutturati.
- Compatibilita record legacy mantenuta con fallback prudente.

## Verifiche
- `npx eslint src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts src/next/NextGommeEconomiaSection.tsx src/next/NextDossierMezzoPage.tsx src/next/domain/nextDossierMezzoDomain.ts src/next/domain/nextOperativitaGlobaleDomain.ts` -> OK
- `npm run build` -> OK

## Stato
- `Manutenzioni` resta `PARZIALE`.
- Il fix chiude il bug prioritario del writer materiali, ma non sostituisce l'audit di parity completa con madre/PDF.
