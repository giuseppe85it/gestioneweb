# CONTINUITY REPORT - Report combinato IA interna

## Contesto generale
- Il progetto continua nella fase di clone `read-only` della madre con innesti progressivi solo sopra `/next`.
- Il sottosistema IA interna resta isolato dentro `/next/ia/interna*`, locale, reversibile e senza backend IA reale.

## Modulo/area su cui si stava lavorando
- sottosistema IA interna del clone
- estensione del primo use case read-only dai report singoli a un report combinato mezzo + autista + periodo

## Stato attuale
- Sono stabili i tre flussi di preview:
  - report targa;
  - report autista;
  - report combinato mezzo + autista + periodo.
- Tracking, memoria locale, artifact locali e chat mock sono riallineati anche al nuovo report combinato.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- UI clone del sottosistema IA interno
- facade read-only per report targa e report autista
- contesto periodo condiviso
- facade read-only per report combinato
- chat mock locale con intenti targa, autista e combinato
- tracking e artifact solo locali

## Prossimo step di migrazione
- Valutare un affinamento successivo della spiegazione del matching combinato solo se emergono altri segnali forti gia disponibili nei layer NEXT, senza introdurre raw readers nuovi.

## Moduli impattati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/*`
- documentazione IA/clone in `docs/product/*`

## Contratti dati coinvolti
- `storage/@mezzi_aziendali`
- `storage/@colleghi`
- `storage/@rifornimenti`
- `storage/@rifornimenti_autisti_tmp`
- layer `D10 Centro Controllo`

## Ultime modifiche eseguite
- Introdotto il report combinato mezzo + autista + periodo read-only.
- Reso esplicito il livello di affidabilita del legame mezzo-autista (`forte`, `plausibile`, `non dimostrabile`).
- Estesi memoria locale, tracking e artifact IA anche alle coppie mezzo/autista e al nuovo target combinato.

## File coinvolti
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiCombinedReportFacade.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiTracking.ts`
- `src/next/internal-ai/internalAiMockRepository.ts`
- `src/next/internal-ai/internalAiTypes.ts`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Nessuna scrittura business, nessun backend IA reale e nessun runtime IA legacy vengono riusati per il report combinato.
- Il matching `forte` e ammesso solo con prova anagrafica `autistaId`; i segnali D10/D04 non vengono venduti come certezza se mancano conferme forti.

## Vincoli da non rompere
- Tutti i testi visibili nel gestionale devono restare in italiano.
- Ogni task IA futuro deve aggiornare `docs/product/CHECKLIST_IA_INTERNA.md`.
- Ogni patch clone/NEXT deve aggiornare anche `docs/product/STATO_MIGRAZIONE_NEXT.md` e `docs/product/REGISTRO_MODIFICHE_CLONE.md`.
- Nessuna lettura raw nuova se esiste gia un layer NEXT pulito riusabile.

## Parti da verificare
- Verificare in build finale che il nuovo facade combinato non introduca errori di tipo o regressioni di import.
- Verificare in uso reale che i casi con solo `autistaNome` sul mezzo vengano letti come plausibili e non come forti.

## Rischi aperti
- La copertura combinata resta limitata alla qualita reale di D01, D10 e D04 nel periodo scelto.
- Alcuni accoppiamenti mezzo-autista possono restare non dimostrabili se i dataset non espongono link forti.

## Punti da verificare collegati
- nessuno nuovo

## Prossimo passo consigliato
- Rifinire solo se serve la leggibilita della preview combinata o la copertura di eventuali sezioni forti gia dimostrate nei layer NEXT, senza ampliare il perimetro.

## Cosa NON fare nel prossimo task
- Non introdurre matching certi basati solo su segnali deboli.
- Non aggiungere scritture business, backend IA reali o riuso runtime dei moduli IA legacy.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
