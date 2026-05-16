# Audit Autisti madre vs NEXT - import definitivo

Data originale: 2026-05-07 — Aggiornato: 2026-05-16

## Aggiornamento 2026-05-16

Delta dal 2026-05-08 al 2026-05-16 sull'asse Autisti madre/NEXT. Origine: `DIARIO_DECISIONI.md` + `AUDIT_NEXT_COMPLETO_2026-05-16.md` cap. 5.

- `[AGGIORNATO]` "Conclusione operativa" originale ("Autisti NEXT … PARZIALE come import definitivo business") — parzialmente superata. Esiste `src/next/autistiInbox/NextAutistiAdminNative.tsx` (~2700 righe) con scope CC dedicati (PROMPT 27 fix 2026-05-09/11), che però oggi è ancora **componente interno di flusso**, non **pagina autonoma** sostitutiva. La route `/next/autisti-admin` continua a montare `AutistiAdmin.tsx` madre. Per la proposta dettagliata di sostituzione NEXT in 6 fasi vedi `AUDIT_NEXT_COMPLETO_2026-05-16.md` cap. 5.3.
- `[NUOVO]` Pulsante "Conferma" admin autisti sanificato in `NextHomeAutistiEventoModal` (PROMPT 28, 2026-05-14): non wrappa più `AutistiEventoModal` madre; modale NEXT autonoma; scrive `@manutenzioni daFare` via `createManutenzioneDaFareFromEvento` ([src/next/writers/nextManutenzioneDaFareCreateWriter.ts:226-267](../../../src/next/writers/nextManutenzioneDaFareCreateWriter.ts#L226-L267)).
- `[NUOVO]` Writer NEXT business per ciclo autisti **attivi e funzionanti** (decisione 2026-05-09 Centro Controllo torre operativa). Non sono più "no-op": `markSegnalazioneChiusa` ([src/next/nextSegnalazioniWriter.ts](../../../src/next/nextSegnalazioniWriter.ts)), `markControlloChiuso` ([src/next/nextControlliWriter.ts](../../../src/next/nextControlliWriter.ts)), `markRichiestaEvasa`, `nextMezzoHardDeleteWriter` (cascade 11 dataset), e tutti i writer ciclo segnalazione PROMPT 44-52. **Vincolo**: scope `*_WRITE_SCOPE` attivi SOLO da `/next/centro-controllo` (non da `/next/autisti-admin`).
- `[NUOVO]` Macchina chiusura ciclo eventi: aggancio retroattivo `gomme_evento` con `NextAggancioEventoModal.tsx`, helper `eventiCompatibili.ts`. Usata da `/next/manutenzioni` e `/next/autisti-inbox` (rif. DIARIO_DECISIONI 2026-05-14).
- `[NUOVO]` Eccezioni permanenti formalizzate (`CLAUDE_CHAT_BEHAVIOR.md` sez. 6): **Opzione α** (`src/components/AutistiEventoModal.tsx` shared madre, intoccabile; wrapper NEXT autonomi); **Strategia 3a** (`@lavori` intoccabile post-dismissione, madre continua); **Madre intoccabile** (`src/pages/`, `src/autistiInbox/AutistiAdmin.tsx`); **decisione J.7** (`linkedLavoroId`/`linkedLavoroIds` mantengono il nome, cambia solo la semantica). Queste eccezioni vincolano qualsiasi futuro lavoro su Autisti NEXT.
- `[OBSOLETO]` Sezione "Cosa manca per import definitivo" punto 1 "Decisione esplicita su quali dataset Autisti NEXT deve scrivere davvero" — risolta dalle decisioni 2026-05-09 (4 scope barrier mirati per dataset autisti). Restano aperti i punti 2 (writer NEXT ufficiali per tutti i flussi autisti), 3 (rules Firestore/Storage senza catch-all), 4 (contratto dati consolidamento admin), 5 (audit allegati Storage), 6 (rimozione CSS legacy).

Natura: audit documentale con lettura codice. Nessuna patch runtime applicata.

## Conclusione operativa

Stato Autisti NEXT: COMPLETO per mappa route/file/writer letti, PARZIALE come import definitivo business.

Motivo: le route Autisti NEXT esistono e usano pagine NEXT/native, ma i writer business dei dataset autisti sono bloccati o confinati in localStorage clone. La madre resta il runtime che scrive realmente molte code operative Autisti.

## Route madre e route NEXT

| Flusso | Route madre | Route NEXT | Stato fonte |
|---|---|---|---|
| Gate Autisti | `/autisti` | `/next/autisti` | DIMOSTRATO: `src/App.tsx:691`, `:172-179` |
| Login | `/autisti/login` | `/next/autisti/login` | DIMOSTRATO: `src/App.tsx:692`, `:180` |
| Home | `/autisti/home` | `/next/autisti/home` | DIMOSTRATO: `src/App.tsx:693`, `:181` |
| Setup mezzo | `/autisti/setup-mezzo` | `/next/autisti/setup-mezzo` | DIMOSTRATO: `src/App.tsx:694`, `:182` |
| Cambio mezzo | `/autisti/cambio-mezzo` | `/next/autisti/cambio-mezzo` | DIMOSTRATO: `src/App.tsx:695`, `:183` |
| Rifornimento | `/autisti/rifornimento` | `/next/autisti/rifornimento` | DIMOSTRATO: `src/App.tsx:696`, `:185` |
| Controllo | `/autisti/controllo` | `/next/autisti/controllo` | DIMOSTRATO: `src/App.tsx:697`, `:184` |
| Segnalazioni | `/autisti/segnalazioni` | `/next/autisti/segnalazioni` | DIMOSTRATO: `src/App.tsx:698`, `:186` |
| Richiesta attrezzature | `/autisti/richiesta-attrezzature` | `/next/autisti/richiesta-attrezzature` | DIMOSTRATO: `src/App.tsx:699`, `:187-190` |
| Inbox home | `/autisti-inbox` | `/next/autisti-inbox` | DIMOSTRATO: `src/App.tsx:702`, `:539-544` |
| Inbox cambio mezzo | `/autisti-inbox/cambio-mezzo` | `/next/autisti-inbox/cambio-mezzo` | DIMOSTRATO: `src/App.tsx:703`, `:547-552` |
| Inbox controlli | `/autisti-inbox/controlli` | `/next/autisti-inbox/controlli` | DIMOSTRATO: `src/App.tsx:704`, `:571-576` |
| Inbox segnalazioni | `/autisti-inbox/segnalazioni` | `/next/autisti-inbox/segnalazioni` | DIMOSTRATO: `src/App.tsx:705`, `:579-584` |
| Log accessi | `/autisti-inbox/log-accessi` | `/next/autisti-inbox/log-accessi` | DIMOSTRATO: `src/App.tsx:706`, `:555-560` |
| Inbox richieste | `/autisti-inbox/richiesta-attrezzature` | `/next/autisti-inbox/richiesta-attrezzature` | DIMOSTRATO: `src/App.tsx:707-710`, `:587-592` |
| Inbox gomme | `/autisti-inbox/gomme` | `/next/autisti-inbox/gomme` | DIMOSTRATO: `src/App.tsx:711`, `:563-568` |
| Admin | `/autisti-admin` | `/next/autisti-admin` | DIMOSTRATO: `src/App.tsx:712`, `:619-624` |

## Madre / legacy Autisti

| Area | File madre | Reader/writer dimostrati | Dataset | Stato |
|---|---|---|---|---|
| Session storage locale | `src/autisti/autistiStorage.ts` | localStorage autista/mezzo/revoca | `@autista_attivo_local`, `@mezzo_attivo_autista_local`, `@autista_revoca_local` | DIMOSTRATO |
| Login | `src/autisti/LoginAutista.tsx` | `setItemSync` storico, lettura colleghi | `@storico_eventi_operativi`, `@colleghi` | DIMOSTRATO: `LoginAutista.tsx:29`, `:59` |
| Setup mezzo | `src/autisti/SetupMezzo.tsx` | scrive storico e sessioni | `@storico_eventi_operativi`, `@autisti_sessione_attive`, legge `@mezzi_aziendali` | DIMOSTRATO: `SetupMezzo.tsx:101`, `:386` |
| Home | `src/autisti/HomeAutista.tsx` | scrive storico e sessioni | `@storico_eventi_operativi`, `@autisti_sessione_attive` | DIMOSTRATO: `HomeAutista.tsx:60`, `:245`, `:293` |
| Cambio mezzo | `src/autisti/CambioMezzoAutista.tsx` | scrive storico e sessioni | `@storico_eventi_operativi`, `@autisti_sessione_attive` | DIMOSTRATO: `CambioMezzoAutista.tsx:71`, `:211`, `:236` |
| Controllo mezzo | `src/autisti/ControlloMezzo.tsx` | scrive tmp controlli | `@controlli_mezzo_autisti` | DIMOSTRATO: `ControlloMezzo.tsx:119` |
| Rifornimento | `src/autisti/Rifornimento.tsx` | scrive tmp e dossier | `@rifornimenti_autisti_tmp`, `storage/@rifornimenti` | DIMOSTRATO: `Rifornimento.tsx:187`, `:205` |
| Segnalazioni | `src/autisti/Segnalazioni.tsx` | upload Storage e scrive tmp | `@segnalazioni_autisti_tmp`, Storage allegati | DIMOSTRATO: `Segnalazioni.tsx:280`, `:350` |
| Richieste attrezzature | `src/autisti/RichiestaAttrezzature.tsx` | upload/delete Storage e tmp | `@richieste_attrezzature_autisti_tmp`, Storage allegati | DIMOSTRATO: `RichiestaAttrezzature.tsx:77`, `:84`, `:100`, `:149` |
| Gomme autista | `src/autisti/GommeAutistaModal.tsx` | scrive tmp gomme | `@cambi_gomme_autisti_tmp`, legge `@mezzi_aziendali` | DIMOSTRATO: `GommeAutistaModal.tsx:31`, `:349` |
| Admin legacy | `src/autistiInbox/AutistiAdmin.tsx` | consolida tmp e scrive dossier/lavori/gomme | `@lavori`, `@rifornimenti`, `@gomme_eventi`, tmp autisti | DIMOSTRATO: `AutistiAdmin.tsx:734`, `:1633`, `:1765`, `:2039`, `:2101` |

## NEXT Autisti

| Area NEXT | File NEXT | Cosa fa | Dataset | Stato |
|---|---|---|---|---|
| Layout runtime | `src/next/autisti/NextAutistiCloneLayout.tsx` | monta runtime NEXT Autisti e namespace storage | localStorage clone | DIMOSTRATO da route `src/App.tsx:172-176` |
| Storage sync | `src/next/autisti/nextAutistiStorageSync.ts` | gestisce managed keys e impedisce scritture ufficiali sui dataset gestiti | tmp/sessioni/gomme/storico | DIMOSTRATO: `nextAutistiStorageSync.ts:11-19`, `:105-120` |
| Driver pages | `NextAutistiRifornimentoPage`, `NextAutistiSegnalazioniPage`, `NextAutistiRichiestaAttrezzaturePage`, `NextAutistiControlloPage` | interfacce NEXT; salvataggio ufficiale dichiarato read-only/no-op | tmp autisti | DIMOSTRATO da alert/errori e storage wrapper |
| Inbox/Admin native | `src/next/autistiInbox/*Native.tsx` | UI NEXT, usa bridge clone-local | tmp/sessioni/gomme/rifornimenti | DIMOSTRATO: `NextAutistiAdminNative.tsx:12-13`; `nextAutistiAdminBridges.ts:111-124` |
| Admin bridge | `src/next/autistiInbox/nextAutistiAdminBridges.ts` | legge doc reali via registry, salva override localStorage | `@next_clone_autisti:admin-bridge-docs` | DIMOSTRATO: `nextAutistiAdminBridges.ts:15-16`, `:80-83`, `:111-124` |

## Flussi Autisti

| Flusso | Madre scrive | NEXT scrive | Stato import definitivo | Cosa manca |
|---|---|---|---|---|
| Login autista | storico eventi | no writer business reale dimostrato | PARZIALE | decisione su sessione reale NEXT |
| Sessione autista | `@autisti_sessione_attive` | no-op managed key in official runtime | PARZIALE | abilitazione writer NEXT con regole dati |
| Setup mezzo | sessione + storico | no-op managed key in official runtime | PARZIALE | writer NEXT esplicito |
| Cambio mezzo | sessione + storico | no-op managed key in official runtime | PARZIALE | writer NEXT esplicito |
| Controllo mezzo | `@controlli_mezzo_autisti` | no-op/clone-local | PARZIALE | consolidamento NEXT reale |
| Rifornimento autista | `@rifornimenti_autisti_tmp` + `@rifornimenti` | clone-local/no-op su managed key | PARZIALE | writer tmp e dossier ufficiale |
| Segnalazione | upload Storage + `@segnalazioni_autisti_tmp` | clone-local/no-op | PARZIALE | writer tmp e upload Storage NEXT |
| Richiesta attrezzature | upload/delete Storage + `@richieste_attrezzature_autisti_tmp` | clone-local/no-op | PARZIALE | writer tmp e upload Storage NEXT |
| Gomme autisti | `@cambi_gomme_autisti_tmp` | clone-local/no-op | PARZIALE | writer tmp e consolidamento |
| Log accessi | legge storico eventi | legge storico/clone | IMPORTATO COME READ-ONLY | nessun writer richiesto per sola lettura |
| Inbox/Admin | consolida tmp in dataset ufficiali | override localStorage, non Firestore reale | PARZIALE | writer admin NEXT ufficiale |

## Dataset Autisti

| Dataset | Madre | NEXT | Moduli collegati | Rischio |
|---|---|---|---|---|
| `@autisti_sessione_attive` | scritto da setup/home/cambio/admin | managed key no-op in official NEXT | Centro Controllo, Inbox, Home Autisti | critico |
| `@storico_eventi_operativi` | scritto da login/home/setup/cambio/admin | managed key no-op in official NEXT | Log accessi, Inbox, Centro | alto |
| `@segnalazioni_autisti_tmp` | scritto da madre, consolidato admin | managed key no-op/clone-local | Centro, Dettaglio lavoro, Admin | alto |
| `@controlli_mezzo_autisti` | scritto da madre, gestito admin | managed key no-op/clone-local | Centro, Controlli admin | alto |
| `@richieste_attrezzature_autisti_tmp` | scritto da madre, gestito admin | managed key no-op/clone-local | Magazzino/Attrezzature se collegato | alto |
| `@cambi_gomme_autisti_tmp` | scritto da madre, gestito admin | managed key no-op/clone-local | Gomme admin, Dossier gomme dopo consolidamento | alto |
| `@gomme_eventi` | scritto da admin madre | managed key no-op/clone-local | Dossier gomme | alto |
| `@rifornimenti_autisti_tmp` | scritto da madre | managed key no-op/clone-local | Rifornimenti admin | alto |
| `@rifornimenti` | scritto da madre driver/admin | bridge local in NEXT admin | Dossier rifornimenti, Centro, Chat IA | critico |
| `@colleghi` | letto login/setup | letto da domain/flotta | Autisti, Centro, Anagrafiche | medio |
| `@mezzi_aziendali` | letto setup/gomme | letto da domain/flotta | Autisti, Dossier, Centro | medio |

## Relazioni con moduli NEXT

| Modulo NEXT | Relazione con Autisti | Stato |
|---|---|---|
| Centro Controllo NEXT | legge snapshot Autisti da `readNextAutistiReadOnlySnapshot` | DIMOSTRATO: `NextCentroControlloParityPage.tsx:599` |
| Dossier Rifornimenti NEXT | legge `@rifornimenti`; impattato dal consolidamento rifornimenti autisti | DIMOSTRATO da flusso dataset precedente |
| Dossier Gomme NEXT | legge `@gomme_eventi`; impattato dal consolidamento gomme autisti | DIMOSTRATO da dataset e route audit precedente |
| Manutenzioni NEXT | collegamento indiretto tramite segnalazioni/lavori, non writer Autisti diretto in questo audit | DEDOTTO |
| Magazzino/Attrezzature NEXT | collegamento indiretto con richieste attrezzature; writer definitivo non dimostrato | DA VERIFICARE |

## Dipendenze legacy rilevate

Autisti NEXT importa molti CSS madre:

- `src/next/autisti/NextSetupMezzoNative.tsx:4-5`
- `src/next/autisti/NextLoginAutistaNative.tsx:4`
- `src/next/autisti/NextHomeAutistaNative.tsx:5`
- `src/next/autisti/NextAutistiRifornimentoPage.tsx:3-4`
- `src/next/autisti/NextAutistiSegnalazioniPage.tsx:4-5`
- `src/next/autistiInbox/NextAutistiAdminNative.tsx:4`
- `src/next/autistiInbox/NextAutistiControlliAllNative.tsx:16`

Stato: RILEVANTE SOLO PER UI/CSS. Non e' una prova di writer legacy runtime.

## Cosa manca per import definitivo

1. Decisione esplicita su quali dataset Autisti NEXT deve scrivere davvero.
2. Writer NEXT ufficiali per sessioni, controlli, segnalazioni, richieste, gomme, rifornimenti.
3. Regole Firestore/Storage coerenti con i writer, senza catch-all generico.
4. Contratto dati per consolidamento admin tmp -> dataset ufficiali.
5. Audit mirato su allegati Storage Autisti.
6. Rimozione o isolamento CSS legacy se l'obiettivo e' autonomia UI completa.

## Stato finale Autisti

Autisti madre: DIMOSTRATO come runtime business scrivente.

Autisti NEXT: DIMOSTRATO come runtime NEXT routato e operativo, ma non import definitivo per scritture business reali. [AGGIORNATO 2026-05-16: parzialmente superato — il Centro Controllo NEXT scrive ora business reale via scope barrier dedicati 2026-05-09; resta `AutistiAdmin.tsx` madre montata su `/next/autisti-admin`. Sostituzione NEXT proposta a 6 fasi in `AUDIT_NEXT_COMPLETO_2026-05-16.md` cap. 5.3, taglia L.]
