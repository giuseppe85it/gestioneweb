# Change Report

- Data: 2026-04-02
- Ambito: procurement NEXT
- Target: `http://localhost:5173/next/materiali-da-ordinare`

## Obiettivo
- Correggere il layout sul runtime reale del browser, non sui report.

## Causa reale verificata
- Il problema non era `NextShell`.
- Il browser mostrava collisione CSS globale da `src/pages/DettaglioOrdine.css`:
  - `.mdo-page`
  - `.mdo-card`
- Effetti misurati prima del fix:
  - `.mdo-card` = `430px`
  - `.mdo-workspace` = `414px 0px`
  - `.mdo-sticky-bar` sticky dark presente

## Modifica applicata
- Wrapper locale `next-mdo-route`
- Nuovo CSS scoped `src/next/next-procurement-route.css`
- Ramo `Fabbisogni` riallineato alla resa reale della madre vista in `/acquisti`

## Verifica runtime dopo il fix
- `.mdo-card` = `1400px`
- `.mdo-shell-header` = `1400px`
- `.mdo-tabs` = `1400px`
- `.mdo-sticky-bar` assente
- `.mdo-workspace` assente
- `.mdo-card-footer-bar` presente e statico
- `npm run build` OK

