# Matrice procurement - rimozione NEXT

| Modulo | Route | File runtime | Usato da Materiali da ordinare? | Usato da altri moduli NEXT? | Mantenere in UI? | Mantenere nel codice? | Decisione finale | Motivo breve |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ordini in attesa | `/next/ordini-in-attesa` | `src/next/NextOrdiniInAttesaPage.tsx` | Si | Si | No, non come ingresso top-level | Si | Declassare a supporto tecnico/runtime | `Materiali da ordinare`, workbench procurement, remap legacy e hook IA lo usano ancora |
| Ordini arrivati | `/next/ordini-arrivati` | `src/next/NextOrdiniArrivatiPage.tsx` | Si | Si | No, non come ingresso top-level | Si | Declassare a supporto tecnico/runtime | `Materiali da ordinare`, workbench procurement, remap legacy e hook IA lo usano ancora |
| Dettaglio ordine | `/next/dettaglio-ordine/:ordineId` e `/next/acquisti/dettaglio/:ordineId` | `src/next/NextDettaglioOrdinePage.tsx` | No | Si | No, non come modulo visibile separato | Si | Tenere solo come drill-down tecnico | Serve ancora al workbench procurement per l'apertura dettaglio ordine |
