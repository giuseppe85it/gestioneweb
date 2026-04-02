# Backlog decisione procurement NEXT

## Ingressi da mantenere
- `Materiali da ordinare` (`/next/materiali-da-ordinare`) come ingresso principale della famiglia procurement in `Gestione Operativa`.
- `Acquisti` (`/next/acquisti`) solo come workbench procurement secondario per deep link, IA o contesto read-only, non come card top-level.

## Ingressi da declassare a secondari
- `Ordini in attesa` (`/next/ordini-in-attesa`)
- `Ordini arrivati` (`/next/ordini-arrivati`)
- `Dettaglio ordine` (`/next/dettaglio-ordine/:ordineId`)

## Ingressi da togliere da `Gestione Operativa`
- `Ordini in attesa`
- `Ordini arrivati`
- `Dettaglio ordine`
- `Acquisti` come CTA principale di famiglia

## Punti `DA VERIFICARE`
- Se `/next/acquisti` debba restare anche come ingresso visibile secondario in `Navigazione rapida` o soltanto come route tecnica di appoggio.
- Se esistano altri ingressi produttivi verso `/next/materiali-da-ordinare` oltre a `Gestione Operativa` e ai mapper di navigazione clone.
- Se il lavoro futuro sul procurement NEXT debba convergere davvero in un unico modulo padre completo o mantenere la separazione attuale tra `Materiali da ordinare` e workbench read-only.
