# CONTINUITY REPORT - Seconda tranche Autisti Inbox clone

## Contesto generale
- Il progetto resta nella fase di clone fedele `read-only` della madre su `src/next/*`, con barriera no-write gia attiva.

## Modulo/area su cui si stava lavorando
- `Autisti Inbox`
- seconda tranche dei tre listati reader con PDF/browser actions: `controlli`, `segnalazioni`, `richiesta-attrezzature`

## Stato attuale
- Le tre route clone dedicate della seconda tranche sono state aperte.
- La home `Autisti Inbox`, `Autista 360`, `AutistiEventoModal` e i moduli admin/app restano fuori.

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Prima tranche `Autisti Inbox`: `cambio-mezzo`, `log-accessi`, `gomme`
- Seconda tranche `Autisti Inbox`: `controlli`, `segnalazioni`, `richiesta-attrezzature`

## Prossimo step di migrazione
- Valutare un task dedicato alla home `Autisti Inbox` solo dopo neutralizzazione clone-safe del writer nascosto `AutistiEventoModal`

## Moduli impattati
- `Autisti Inbox`
- `Operativita Globale`

## Contratti dati coinvolti
- `@controlli_mezzo_autisti`
- `@segnalazioni_autisti_tmp`
- `@richieste_attrezzature_autisti_tmp`

## Ultime modifiche eseguite
- Aggiunte tre nuove route clone `Autisti Inbox`
- Creati tre wrapper clone sottili
- Adeguati logo/back e ritorni per restare nel subtree `/next`
- Mantenute attive le azioni PDF/browser locali che non toccano la madre

## File coinvolti
- `src/App.tsx`
- `src/autistiInbox/AutistiControlliAll.tsx`
- `src/autistiInbox/AutistiSegnalazioniAll.tsx`
- `src/autistiInbox/RichiestaAttrezzatureAll.tsx`
- `src/next/NextAutistiInboxControlliPage.tsx`
- `src/next/NextAutistiInboxSegnalazioniPage.tsx`
- `src/next/NextAutistiInboxRichiestaAttrezzaturePage.tsx`
- `src/next/nextData.ts`
- `src/next/nextAccess.ts`

## Decisioni gia prese
- Non aprire ancora la home `Autisti Inbox`
- Non toccare ancora `AutistiEventoModal`
- Non toccare ancora `Autista 360` o `Autisti Admin`
- Lasciare attive preview/share/copia/WhatsApp e immagini/allegati locali per i tre listati della seconda tranche

## Vincoli da non rompere
- Nessuna scrittura business verso la madre
- Nessuna uscita dal subtree `/next` dai sei listati inbox gia migrati
- Nessun ingresso fake alla home inbox non ancora pronta

## Parti da verificare
- Eventuale strategia di ingresso clone per i listati inbox senza aprire la home
- Opportunita di separare o neutralizzare `AutistiEventoModal` prima dei moduli autisti aggregatori

## Rischi aperti
- La home inbox resta fuori e continua a dipendere dal writer nascosto `AutistiEventoModal`
- `Autista 360` resta modulo strategico da tenere per ultimo

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Audit dedicato su `AutistiInboxHome` e `AutistiEventoModal` per capire se la home inbox puo entrare nel clone senza writer nascosti

## Cosa NON fare nel prossimo task
- Non mischiare `Autista 360`, `Autisti Admin` o app autisti nello stesso task
- Non aprire la home inbox senza prima affrontare `AutistiEventoModal`

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
