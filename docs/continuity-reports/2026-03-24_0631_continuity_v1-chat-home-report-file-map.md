# CONTINUITY REPORT - V1 chat IA focalizzata

## Contesto generale
- Il progetto resta nel perimetro NEXT read-only, con madre intoccabile e sottosistema IA interna isolato.

## Modulo/area su cui si stava lavorando
- `IA interna` del clone `/next`
- rifinitura V1 della chat su tre use case concreti

## Stato attuale
- La chat IA interna e focalizzata su:
  - analisi Home;
  - report targa/mezzo;
  - file/moduli da toccare.
- Il report targa continua a usare il percorso mezzo-centrico NEXT read-only.
- Le richieste repo/UI non vengono piu mandate automaticamente verso output di integrazione quando chiedono solo `quali file devo toccare`.
- Il thread rende meglio i risultati con blocchi leggibili e segnali di contesto sobri.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Chat unica centrale gia presente dal reset precedente.
- Focalizzazione V1 su Home / report targa / file map.
- Output selector riallineato ai tre use case.
- Resa del thread piu leggibile senza nuove dashboard o pannelli tecnici.

## Prossimo step di migrazione
- Verificare a caldo, con prompt reali, se i tre casi V1 coprono bene il bisogno prodotto prima di allargare altro.

## Moduli impattati
- IA interna

## Contratti dati coinvolti
- nessun nuovo contratto

## Ultime modifiche eseguite
- Stretti gli intenti locali della chat sui prompt V1.
- Migliorato il fallback utile per `Home` e `file da toccare`.
- Migliorata la resa del thread per risposte strutturate e report.

## File coinvolti
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiOutputSelector.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Nessuna nuova capability oltre ai tre use case V1.
- Nessun backend nuovo.
- Nessun bridge live.
- `Mezzo360` resta solo riferimento di linguaggio UI, non reader canonico della IA.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business.
- Nessun segreto lato client.
- Testi visibili in italiano.

## Parti da verificare
- Qualita delle risposte repo/UI quando la memoria osservata e assente o vecchia.
- Eventuali prompt borderline che oggi non devono riaprire intenti laterali.

## Rischi aperti
- Il fallback locale e utile ma meno ricco del backend con memoria osservata aggiornata.
- L'area IA continua ad avere altre modifiche preesistenti nel worktree che non sono state toccate in questo task.

## Prossimo passo consigliato
- Test funzionale mirato solo sui tre prompt V1 in UI reale e piccolo ritocco finale di copy se emergono frizioni.

## Cosa NON fare nel prossimo task
- Non riaprire observer/runtime coverage.
- Non riaprire bridge live Firebase/Storage.
- Non riallargare la chat a intenti laterali non necessari.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
