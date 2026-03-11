# CHANGE REPORT - Seconda tranche Autisti Inbox clone-safe

## Data
- 2026-03-11 14:41

## Tipo task
- patch

## Obiettivo
- Aprire nel clone le route reali `Autisti Inbox` di `controlli`, `segnalazioni` e `richiesta-attrezzature`, mantenendo il riuso delle pagine madre e una navigazione clone-safe.

## File modificati
- `src/App.tsx`
- `src/autistiInbox/AutistiControlliAll.tsx`
- `src/autistiInbox/AutistiSegnalazioniAll.tsx`
- `src/autistiInbox/RichiestaAttrezzatureAll.tsx`
- `src/next/NextAutistiInboxControlliPage.tsx`
- `src/next/NextAutistiInboxSegnalazioniPage.tsx`
- `src/next/NextAutistiInboxRichiestaAttrezzaturePage.tsx`
- `src/next/nextData.ts`
- `src/next/nextAccess.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- Aggiunte le route clone `/next/autisti-inbox/controlli`, `/next/autisti-inbox/segnalazioni` e `/next/autisti-inbox/richiesta-attrezzature`.
- Creati tre wrapper clone sottili che riusano controllatamente le pagine madre dei listati.
- Adeguati logo, back e ritorni per restare nel subtree `/next`, senza aprire la home inbox.
- Lasciate attive anteprima PDF, share/copia/WhatsApp e immagini/allegati locali, perche non scrivono sulla madre.
- Aggiornati metadata/access minimi del clone e registri permanenti.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Seconda tranche `Autisti Inbox` navigabile nel clone con route reali e senza uscite legacy.
- Nessun impatto su writer o moduli autisti strategici ancora fuori perimetro.

## Rischio modifica
- NORMALE

## Moduli impattati
- NEXT / Operativita Globale
- Autisti Inbox

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

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
- La home `Autisti Inbox` resta fuori e non va forzata con ingressi finti.
- Le azioni PDF/browser locali restano attive: sono coerenti col clone ma non rappresentano ancora una home inbox completa.

## Build/Test eseguiti
- `npm run build` - OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
