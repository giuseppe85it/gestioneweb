# CONTINUITY REPORT - Archivio intelligente artifact IA interna

## Contesto generale
- Il progetto mantiene il clone NEXT `read-only` della madre come perimetro sicuro per i nuovi innesti IA.
- Il sottosistema `/next/ia/interna*` resta isolato, locale e senza scritture business.

## Modulo/area su cui si stava lavorando
- Archivio artifact locale del sottosistema IA interno
- Ricerca, filtri, riapertura preview e memoria locale archivio

## Stato attuale
- Archivio artifact locale attivo, retrocompatibile e ora consultabile con ricerca e filtri combinabili.
- Riapertura report da archivio cablata verso la preview corretta del modulo overview.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- shell e route del sottosistema IA interno
- facade read-only report mezzo, autista e combinato
- tracking e memoria locale isolati
- archivio artifact persistente solo locale

## Prossimo step di migrazione
- Valutare eventuale archivio locale con raggruppamenti o preferiti solo se rimane confinato al perimetro IA e senza introdurre backend reale.

## Moduli impattati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiTracking.ts`
- `src/next/internal-ai/internalAiMockRepository.ts`
- `src/next/internal-ai/internal-ai.css`

## Contratti dati coinvolti
- `analysis_artifacts` locale del sottosistema IA
- memoria/tracking locale `@next_internal_ai:*`

## Ultime modifiche eseguite
- Estesi i metadati artifact con famiglia, testo ricercabile, affidabilita matching e campi filtro retrocompatibili.
- Aggiunti ricerca veloce, filtri combinabili e reset filtri nella sezione archivio.
- Collegata l'azione `Riapri report` al ripristino della preview report corretta nella overview.
- Salvata in memoria locale l'ultima consultazione archivio.

## File coinvolti
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiTracking.ts`
- `src/next/internal-ai/internalAiMockRepository.ts`
- `src/next/internal-ai/internal-ai.css`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Nessuna scrittura Firestore/Storage business per l'archivio IA.
- Nessun riuso runtime dei moduli IA legacy.
- Le famiglie report vengono derivate solo da metadati gia verificabili nei payload e nelle fonti lette dai facade esistenti.

## Vincoli da non rompere
- Tutti i testi visibili nel gestionale devono restare in italiano.
- Il sottosistema IA deve restare confinato a `/next/ia/interna*` con persistenza solo locale.
- Ogni task futuro IA deve aggiornare checklist unica, stato migrazione NEXT e registro modifiche clone.

## Parti da verificare
- Quale set minimo di famiglie/ambiti restera utile quando arriveranno nuovi tipi di report IA.
- Se una futura persistenza server-side dedicata richiedera un mapping 1:1 dei metadati archivio attuali.

## Rischi aperti
- La classificazione per famiglie dipende dai dataset dichiarati nei payload attuali e puo restare `misto` o `non classificato` quando il report attraversa piu ambiti.
- Gli artifact tecnici senza payload preview restano consultabili ma non possono riaprire una preview completa.

## Punti da verificare collegati
- nessuno esplicito in `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Estendere in un task separato l'archivio IA con eventuali viste aggregate o preferiti solo se i metadati restano locali, retrocompatibili e senza backend reale.

## Cosa NON fare nel prossimo task
- Non agganciare l'archivio IA a Firestore, Storage o dataset business.
- Non introdurre classificazioni artificiali non supportate dai metadati reali dei report.
- Non riusare runtime IA legacy o moduli madre fuori dal perimetro NEXT.

## Commit/hash rilevanti
- `NON ESEGUITO`

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
