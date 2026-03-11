# CHANGE REPORT - Migrazione clone-safe di AutistiInboxHome

## Data
- 2026-03-11 15:32

## Tipo task
- patch

## Obiettivo
- Aprire nel clone la route reale `/next/autisti-inbox` riusando `AutistiInboxHome` con modal clone-safe e routing confinato al subtree `/next`.

## File modificati
- `src/App.tsx`
- `src/autistiInbox/AutistiInboxHome.tsx`
- `src/next/NextAutistiInboxHomePage.tsx`
- `src/next/nextData.ts`
- `src/next/nextAccess.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- Registrata la nuova route clone `/next/autisti-inbox`.
- Creato un wrapper clone sottile che riusa `AutistiInboxHome` con `NextAutistiEventoModal`.
- Riallineati solo i path interni necessari: home, listati inbox e menu admin nel profilo clone-safe.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- `AutistiInboxHome` diventa navigabile nel clone senza aprire writer o moduli autisti ancora fuori perimetro.
- I link interni restano confinati a `/next` e riusano i sei listati inbox gia migrati.

## Rischio modifica
- ELEVATO

## Moduli impattati
- Autisti Inbox
- Routing clone `/next`

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: dominio autisti ancora sensibile e punto aperto sul doppio stream eventi autisti

## Legacy o Next?
- ENTRAMBI

## Modulo/area NEXT coinvolta
- operativita

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- `Autista 360`, `Autisti Admin` e app autisti restano volutamente fuori.
- Il modal clone-safe e ora il prerequisito usato dalla home inbox, ma non e ancora montato su `Autista 360`.

## Build/Test eseguiti
- `npm run build` - OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

