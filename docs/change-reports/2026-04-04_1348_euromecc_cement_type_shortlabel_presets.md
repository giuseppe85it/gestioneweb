# Change Report - 2026-04-04 13:48

## Modifica
- Evoluzione della gestione `tipo cemento` dei sili nel modulo `Euromecc` con short label, preset rapidi e compatibilita con i record gia salvati.

## Obiettivo
- Rendere la Home map piu pulita con una sigla breve dentro il silo, mantenendo il nome completo nel dettaglio e un modale piu robusto per l'inserimento.

## File toccati
- `src/next/domain/nextEuromeccDomain.ts`
- `src/next/NextEuromeccPage.tsx`
- `src/next/next-euromecc.css`
- `docs/product/SPEC_MODULO_EUROMECC_NEXT.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Dettaglio
- esteso `euromecc_area_meta` con `cementTypeShort?`;
- aggiunto nel domain il fallback `deriveEuromeccCementTypeShortLabel()` per i record vecchi con solo `cementType`;
- distinta la resa UI tra:
  - Home map -> short label
  - Focus area / fullscreen -> nome completo + short secondaria
- aggiornato il modale con preset rapidi, nome completo libero e sigla breve opzionale.

## Impatto
- nessuna modifica a route, sidebar, sicurezza, rules o dominio Firestore diverso da `euromecc_area_meta`;
- nessuna migrazione distruttiva sui dati gia salvati;
- scritture reali ancora limitate al solo perimetro Euromecc.

## Verifiche
- `node_modules\\.bin\\eslint.cmd src/next/NextEuromeccPage.tsx src/next/domain/nextEuromeccDomain.ts`
- `npm run build`
- verifica runtime locale su `/next/euromecc` con:
  - apertura modale da un silo
  - selezione preset
  - salvataggio reale
  - verifica short label in Home
  - verifica nome completo in `Focus area` e fullscreen
  - refresh pagina
  - compatibilita con record esistente senza `cementTypeShort`
