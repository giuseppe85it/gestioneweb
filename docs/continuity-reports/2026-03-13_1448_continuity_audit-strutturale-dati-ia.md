# CONTINUITY REPORT - Audit strutturale dati IA interna

## Contesto generale
- Il sottosistema IA interna continua a vivere solo nel clone `/next/ia/interna*`, in sola lettura e senza backend IA reale.
- Il task ha avuto natura principalmente di audit strutturale, con un solo fix runtime minimo e confinato alla chat mock.

## Modulo/area su cui si stava lavorando
- facade report mezzo, autista e combinato
- lookup mezzo/autista
- filtro periodo
- chat mock

## Stato attuale
- I facade IA riusano i layer NEXT read-only gia esistenti e dichiarano in modo esplicito molti limiti di copertura.
- Restano aperti alcuni punti strutturali su matching badge/nome, omonimie e rappresentazione completa del contesto mezzi autista.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- report mezzo read-only
- report autista read-only
- report combinato mezzo + autista + periodo
- lookup guidati
- filtri periodo
- archivio locale e memoria locale
- chat mock controllata

## Prossimo step di migrazione
- Affrontare in task separato il matching badge/nome dei facade autista e combinato, con criteri che aumentino copertura senza introdurre falsi positivi.

## Moduli impattati
- `src/next/internal-ai/internalAiVehicleReportFacade.ts`
- `src/next/internal-ai/internalAiDriverReportFacade.ts`
- `src/next/internal-ai/internalAiCombinedReportFacade.ts`
- `src/next/internal-ai/internalAiReportPeriod.ts`
- `src/next/internal-ai/internalAiVehicleLookup.ts`
- `src/next/internal-ai/internalAiDriverLookup.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`

## Contratti dati coinvolti
- `storage/@mezzi_aziendali`
- `storage/@colleghi`
- `storage/@lavori`
- `storage/@manutenzioni`
- `storage/@rifornimenti`
- `storage/@rifornimenti_autisti_tmp`
- `storage/@materialiconsegnati`
- `storage/@costiMezzo`
- `@documenti_mezzi`
- `@documenti_magazzino`
- `@documenti_generici`
- `@analisi_economica_mezzi`
- dataset D10 del Centro Controllo

## Ultime modifiche eseguite
- Mappati i blocchi realmente letti da ogni facade e classificati solidita e buchi strutturali.
- Documentate le priorita aperte per matching badge/nome, fallback omonimie e copertura mezzi autista.
- Corretto il parsing chat autista con periodo per evitare falsi `not found` a monte del lookup.

## File coinvolti
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Nessun refactor largo nei facade durante questo audit.
- Nessuna nuova fonte dati o join business.
- Nessuna correzione aggressiva sui match badge/nome senza un task dedicato.

## Vincoli da non rompere
- Report e lookup devono restare read-only e spiegabili.
- Nessuna scrittura business e nessun riuso runtime IA legacy.
- Tutti i testi visibili nel gestionale devono restare in italiano.

## Parti da verificare
- Quanto pesano davvero le incoerenze badge/nome sui dataset D04 e D10 reali.
- Se esistono casi reali di omonimia nei colleghi che rendono fragile il fallback per nome.
- Se il contesto mezzi dell'autista va arricchito anche fuori dal blocco rifornimenti.

## Rischi aperti
- Un fix troppo aggressivo sui match badge/nome puo introdurre falsi positivi.
- Un fix troppo prudente lascia falsi negativi su report autista e combinato.

## Punti da verificare collegati
- nessuno esplicito in `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Aprire un task dedicato solo al matching identita autista cross-layer D01/D04/D10, con casi prova reali e criteri di affidabilita espliciti.

## Cosa NON fare nel prossimo task
- Non correggere in blocco tutti i facade con fallback per nome “morbidi” senza misure di sicurezza.
- Non allargare il perimetro a backend reale, madre o feature UI decorative.
- Non toccare archivi/artifact/chat oltre quanto strettamente necessario al bug o al matching.

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
