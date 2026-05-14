# REPORT FINALE DISMISSIONE LAVORI NEXT - 2026-05-13

> Chiusura totale dismissione modulo Lavori NEXT.
> Generato al termine di PROMPT 25.
> Riferimenti: AUDIT_USER_JOURNEY, SPEC_DISMISSIONE, REPORT_FASI_1-4, DIARIO_DECISIONI.

## 1. Sintesi globale

La dismissione e' stata completata in 16 prompt operativi, dal PROMPT 9 al PROMPT 25.

| Prompt | Esito |
|---|---|
| PROMPT 9 | Avvio Fasi 1-4 iniziali: shape manutenzioni, writer, migrazione, repunt lettori. |
| PROMPT 10 | Diagnosi `credential.mode=missing`. |
| PROMPT 11 | Fix dotenv e ripresa Fase 3/Fase 4. |
| PROMPT 12 | Diagnosi divergenze backlink. |
| PROMPT 13 | Correzione aspettativa backlink e completamento Fase 4. |
| PROMPT 14 | Cross-audit Fasi 1-4. |
| PROMPT 15 | Diagnosi visibilita' `/next/manutenzioni`. |
| PROMPT 16 | Audit user journey end-to-end: 14 buchi. |
| PROMPT 17 | Chiusura UX Fasi 1-4 e repoint writer; stop Fase 5 per J.10. |
| PROMPT 18 | Deroga J.10 controllata e scollegamento parziale chat IA; stop su residui. |
| PROMPT 19 | Cleanup residui; stop per whitelist Archivio da estendere. |
| PROMPT 20 | Cleanup Archivio esteso; stop per whitelist Fase 5 da estendere. |
| PROMPT 21 | Rilancio con whitelist Fase 5 estesa; residui ancora mappati. |
| PROMPT 22 | Mappatura totale residui Lavori nel repo. |
| PROMPT 23 | Chiusura a fasi Z; stop Z3 per path `operazioniAgent` errato. |
| PROMPT 24 | Rilancio Z3-Z6 con path corretto; stop Z5 su 3 errori build. |
| PROMPT 25 | Fix 3 errori build post-Z5, completamento Z5 e report finale. |

## 2. Buchi audit chiusi

Esito audit: 13 buchi chiusi su 14.

| # | Stato | Nota |
|---|---|---|
| 1 | Chiuso | Creazione manuale `daFare` nel modulo Manutenzioni. |
| 2 | Chiuso | Pulsante da segnalazione repuntato a manutenzione `daFare`. |
| 3 | Chiuso | Pulsante da controllo KO repuntato a manutenzione `daFare`. |
| 4 | Chiuso | Apertura record robusta e recordId senza targa. |
| 5 | Chiuso | Tab operativo `Da fare` nel modulo Manutenzioni. |
| 6 | Chiuso | Righe Home cliccabili verso record puntuale. |
| 7 | Chiuso | Stato reale in Archivio Storico. |
| 8 | Chiuso | Filtri stato/origine nelle superfici previste. |
| 9 | Chiuso | PDF Quadro Manutenzioni difensivo sui record non eseguiti. |
| 10 | Rinviato | Programmate fuse con daFare nel Dossier: deferred esplicito. |
| 11 | Chiuso | Completamento esplicito da `daFare` a `eseguita`. |
| 12 | Chiuso | Tracciabilita' origine e modale read-only. |
| 13 | Chiuso | UI Lavori NEXT rimossa con redirect compat. |
| 14 | Chiuso | Override J.10 totale: chat IA e metadata scollegati da Lavori NEXT. |

## 3. Stato Firestore finale

- `@lavori`: 18 record invariati; la madre continua a scrivere secondo strategia 3a.
- `@manutenzioni`: 74 record attesi, 56 originali + 18 `from-lavoro-*`.
- Backlink validi: 17.
- Orfani preesistenti: 24, documentati e non toccati.
- PROMPT 25: zero scritture Firestore.

## 4. File eliminati definitivamente

Totale effettivo: 15 file eliminati. Il conteggio 14 dei prompt precedenti sottostimava i `.bak`: nel repo i `.bak` eliminati sono 5.

- `src/next/NextLavoriDaEseguirePage.tsx`
- `src/next/NextLavoriInAttesaPage.tsx`
- `src/next/NextLavoriEseguitiPage.tsx`
- `src/next/NextDettaglioLavoroPage.tsx`
- `src/next/domain/nextLavoriDomain.ts`
- `src/next/next-lavori.css`
- `src/next/nextLavoroCreateWriter.ts`
- `src/next/nextLavoriCloneState.ts`
- `src/next/centroControllo/archivioStorico/rows/ArchivioRowLavoro.tsx`
- `src/App.tsx.bak_pre_anagrafiche`
- `src/next/nextData.ts.bak_pre_anagrafiche`
- `src/next/nextData.ts.bak_pre_fix_sidebar`
- `src/utils/cloneWriteBarrier.ts.bak_pre_anagrafiche`
- `src/next/nextAccess.ts.bak_pre_anagrafiche`
- `scripts/oneoff/migrate-lavori-to-manutenzioni.cjs`

## 5. File creati

- `src/next/redirects/NextDettaglioLavoroLegacyRedirect.tsx`: redirect compat da dettaglio lavoro legacy a Manutenzioni.
- `docs/_live/REPORT_FINALE_DISMISSIONE_LAVORI_NEXT_2026-05-13.md`: questo report.

## 6. Override J.10

Cronologia:
- 2026-05-12: J.10 originale, chat IA intoccabile.
- 2026-05-13 PROMPT 18: deroga controllata su 3 file.
- 2026-05-13 PROMPT 22: mappatura totale residui.
- 2026-05-13 PROMPT 23-25: override J.10 totale autorizzato e completato.

File Categoria F toccati: 15.
- `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziTypes.ts`
- `backend/internal-ai/server/internal-ai-next-runtime-observer.js`
- `src/next/chat-ia/agents/analytics.ts`
- `src/next/chat-ia/agents/orchestrator.ts`
- `src/next/chat-ia/agents/specialists/operazioniAgent.ts`
- `src/next/chat-ia/components/blocks/ChatIaEntityLink.tsx`
- `backend/internal-ai/server/lib/registry.config.js`
- `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js`
- `src/next/chat-ia/config/view.config.ts`
- `backend/internal-ai/server/internal-ai-repo-understanding.js`
- `src/next/chat-ia/core/chatIaRouter.ts`
- `src/next/chat-ia/sectors/sectorFallbacks.ts`
- `src/next/chat-ia/tools/registry/toolGetVehicleTimeline360.ts`
- `src/next/chat-ia/tools/registry/toolSearchWorkOrders.ts`

File Categoria F non toccati intenzionalmente:
- `src/next/internal-ai/InternalAiMezzoCard.tsx`
- altri agent/sectors non-Lavori.

## 7. cloneWriteBarrier finale

Rimossi:
- `LAVORI_ALLOWED_WRITE_PATHS`
- `isAllowedLavoriCloneWritePath`
- `LAVORO_CREATE_*`
- allowance finale su `@lavori`
- `@lavori` da chiavi delete-mezzo e archivio-hide.

Rimasti:
- `MANUTENZIONI_ALLOWED_*`
- `MANUTENZIONE_DAFARE_CREATE_*`
- scope e chiavi non-Lavori gia' esistenti.

## 8. Redirect compat finale

- `/next/dettagliolavori/:lavoroId` -> `/next/manutenzioni?recordId=from-lavoro-...`
- `/next/lavori-da-eseguire` -> `/next/manutenzioni`
- `/next/lavori-in-attesa` -> `/next/manutenzioni`
- `/next/lavori-eseguiti` -> `/next/manutenzioni`

## 9. Eccezioni lasciate invarianti

- `src/components/AutistiEventoModal.tsx`: opzione alfa, componente shared con madre.
- `src/autistiInbox/AutistiAdmin.tsx`: madre, fuori scope.
- `src/pages/`: madre, fuori scope e non letto nei prompt finali.
- `linkedLavoroId` / `linkedLavoroIds`: nome campo invariato per decisione J.7.
- 24 backlink orfani preesistenti: non toccati.

## 10. Backup

Backup riusato: `C:\tmp\dismissione_lavori_final_20260513_111149`.

## 11. Checklist cross-audit Claude Code

- [ ] 15 file eliminati confermati.
- [ ] Redirect compat funzionante.
- [ ] `npm run build` PASS.
- [ ] `npx eslint` sui file Z5-BIS PASS.
- [ ] Zero hit funzionali a Lavori NEXT fuori eccezioni madre/alfa/J.7.
- [ ] `@lavori` Firestore invariato.
- [ ] `@manutenzioni` Firestore invariato dal post-Fase 3.
- [ ] Chat IA legge manutenzioni per timeline e tool work-orders compat.
- [ ] Archivio Storico senza tab Lavori.
- [ ] Sidebar senza voce Lavori.
- [ ] `InternalAiMezzoCard` non rotto.

## 12. Checklist gate manuale runtime Giuseppe

- [ ] `/next`: card Manutenzioni da fare con record cliccabili.
- [ ] `/next/manutenzioni`: tab `Da fare` tab 0 e lista filtrabile.
- [ ] `/next/manutenzioni`: completamento `Da fare` -> `Eseguita`.
- [ ] `/next/manutenzioni`: dettaglio con `Vedi origine`.
- [ ] `/next/manutenzioni`: toggle creazione manuale da fare.
- [ ] `/next/centro-controllo`: KPI Manutenzioni urgenti.
- [ ] `/next/centro-controllo` Archivio: tab Lavori assente, stato reale e filtro stato.
- [ ] `/next/dossier-mezzo`: manutenzioni da fare/eseguite.
- [ ] Admin autisti NEXT: pulsanti creano manutenzioni.
- [ ] Modale Home Centro Controllo: crea manutenzione da fare.
- [ ] `/next/lavori-*`: redirect a `/next/manutenzioni`.
- [ ] `/next/dettagliolavori/<id>`: redirect a record manutenzione migrato.
- [ ] PDF Quadro Manutenzioni: colonna stato.
- [ ] Chat IA: query manutenzioni mezzo coerente con `@manutenzioni`.
- [ ] Chat IA: query lavori mezzo trattata come alias semantico di manutenzioni.
- [ ] `toolGetVehicleTimeline360`: timeline usa manutenzioni, non `@lavori`.
- [ ] `toolSearchWorkOrders`: nome tool compat, sorgente dati `@manutenzioni`.

## 13. Debito tecnico residuo

- Buco audit #10: programmate fuse con daFare nel Dossier, deferred.
- Eventuale refactor impaginazione PDF Quadro Manutenzioni, deferred.
- `src/components/AutistiEventoModal.tsx`: shared con madre, sanificazione futura possibile.

## 14. Numero finale prompt operativi

16 prompt operativi: PROMPT 9-25.

I rilanci successivi sono stati causati da STOP duri su whitelist/residui reali. L'esito finale non ripristina i file Lavori NEXT eliminati e non modifica Firestore.
