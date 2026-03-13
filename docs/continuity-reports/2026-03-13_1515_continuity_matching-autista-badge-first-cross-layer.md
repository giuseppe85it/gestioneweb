# CONTINUITY REPORT - Matching autista badge-first cross-layer

## Contesto generale
- Il sottosistema IA interna continua a vivere solo nel clone `/next/ia/interna*`, in sola lettura e senza backend IA reale.
- Il task nasce direttamente dall'audit strutturale precedente, che aveva segnalato come priorita aperta il matching identita autista ancora troppo fragile tra D01, D04 e D10.

## Modulo/area su cui si stava lavorando
- lookup autista IA interno
- report autista read-only
- report combinato mezzo + autista + periodo
- helper di matching identita autista cross-layer

## Stato attuale
- Esiste ora una regola badge-first unica e centralizzata:
  - `autistaId` o badge coerente = match forte;
  - nome esatto = solo fallback plausibile quando il riferimento forte manca davvero;
  - incoerenza forte = match non dimostrabile.
- Lookup, report autista e report combinato riusano la stessa logica e non mantengono piu versioni divergenti del matching badge/nome.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- report mezzo read-only
- report autista read-only
- report combinato mezzo + autista + periodo
- lookup guidato targa e autista
- filtri periodo
- archivio artifact locale
- memoria locale
- chat mock controllata

## Prossimo step di migrazione
- Valutare in task separato se arricchire la gestione degli omonimi senza rompere la regola badge-first e senza introdurre fuzzy matching.

## Moduli impattati
- `src/next/internal-ai/internalAiDriverIdentity.ts`
- `src/next/internal-ai/internalAiDriverLookup.ts`
- `src/next/internal-ai/internalAiDriverReportFacade.ts`
- `src/next/internal-ai/internalAiCombinedReportFacade.ts`

## Contratti dati coinvolti
- `storage/@colleghi`
- `storage/@mezzi_aziendali`
- `storage/@rifornimenti`
- `storage/@rifornimenti_autisti_tmp`
- dataset D10 del Centro Controllo

## Ultime modifiche eseguite
- Centralizzata la normalizzazione identita autista e il matching cross-layer in un helper riusabile.
- Bloccato il fallback per nome quando esiste un conflitto forte su `autistaId` o badge.
- Reso il lookup autista prudente sugli omonimi: il nome esatto non risolve piu automaticamente se non e univoco.
- Riallineati report autista e report combinato alla stessa gerarchia di affidabilita.

## File coinvolti
- `src/next/internal-ai/internalAiDriverIdentity.ts`
- `src/next/internal-ai/internalAiDriverLookup.ts`
- `src/next/internal-ai/internalAiDriverReportFacade.ts`
- `src/next/internal-ai/internalAiCombinedReportFacade.ts`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Nessun fuzzy matching.
- Nessuna deduzione forte dal solo nome quando badge o `autistaId` sono incoerenti.
- Nessuna estensione del task a madre, backend, artifact, memoria o chat oltre il riallineamento indiretto del lookup.

## Vincoli da non rompere
- Badge prima di tutto, nome solo fallback prudente.
- Nessuna scrittura business e nessun riuso runtime IA legacy.
- Tutti i testi visibili nel gestionale devono restare in italiano.

## Parti da verificare
- Casi reali di colleghi senza badge ma con nome coerente su D10 o D04.
- Eventuali omonimie reali da gestire in modo esplicito nell'UI guidata, non nel matching implicito.
- Quali record D10 o D04 restano non dimostrabili per assenza totale di identificativi utili.

## Rischi aperti
- Un matching ancora piu permissivo introdurrebbe falsi positivi.
- Un matching ancora piu rigido potrebbe lasciare fuori record privi di badge ma con nome davvero corretto; il task attuale sceglie la prudenza.

## Punti da verificare collegati
- nessuno esplicito in `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Misurare con casi reali se serve una UI di disambiguazione dedicata per nomi omonimi nel lookup autista, mantenendo invariata la regola badge-first nei facade.

## Cosa NON fare nel prossimo task
- Non introdurre fuzzy matching sui nomi.
- Non promuovere a match forte un record con badge o `autistaId` incoerenti.
- Non allargare il perimetro a backend reale, madre o funzioni legacy IA.

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
