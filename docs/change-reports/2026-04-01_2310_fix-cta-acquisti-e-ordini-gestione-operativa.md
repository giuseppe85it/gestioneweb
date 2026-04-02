# Change Report - 2026-04-01 23:10

## Obiettivo
Correggere il bug per cui la CTA `Acquisti e ordini` di `Gestione Operativa` apriva una pagina bianca.

## File toccati
- `src/next/NextGestioneOperativaPage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Causa verificata nel codice
- La card famiglia apriva la route padre `/next/acquisti`.
- Nel runtime NEXT la famiglia procurement ha gia ingressi read-only operativi piu stabili e diretti:
  - `/next/ordini-in-attesa`
  - `/next/ordini-arrivati`
- La correzione piu piccola e coerente e quindi spostare la CTA principale sul primo ingresso operativo funzionante della famiglia.

## Fix applicato
- `ctaPath` della card `Acquisti e ordini` cambiato da route padre procurement a `NEXT_ORDINI_IN_ATTESA_PATH`.

## Verifiche
- `npm run build` -> OK
- Restano solo warning preesistenti su `jspdf` e chunk size.
