# CONTINUITY REPORT - Audit e rafforzamento blocco gomme report mezzo IA interno

## Contesto generale
- Il sottosistema IA interna vive solo nel clone `/next/ia/interna*`, in sola lettura e senza backend IA reale.
- Dopo l'audit del report mezzo, il blocco gomme risultava il punto piu debole perche leggeva quasi solo le manutenzioni derivate e poteva perdere eventi reali registrati altrove.

## Modulo/area su cui si stava lavorando
- blocco `Gomme` del `report targa / mezzo`
- layer `nextManutenzioniGommeDomain`
- composito `nextDossierMezzoDomain`
- facade `internalAiVehicleReportFacade`

## Stato attuale
- Il blocco gomme converge ora in sola lettura:
  - eventi derivati da `@manutenzioni`;
  - eventi da `@cambi_gomme_autisti_tmp`;
  - eventi da `@gomme_eventi`.
- Regola di matching mezzo attiva:
  - `targetTarga` o `targa` = match forte;
  - campi di contesto = solo match plausibile quando manca la targa diretta.
- Il report mezzo mostra ora con piu trasparenza:
  - quanti eventi gomme arrivano da manutenzioni;
  - quanti arrivano dai dataset gomme dedicati;
  - quanti match sono forti;
  - quanti restano plausibili.
- Il layer deduplica contro le manutenzioni gia importate solo se coincidono davvero giorno, targa, asse, marca e km.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- report mezzo read-only
- report autista read-only
- report combinato mezzo + autista + periodo
- filtri periodo
- archivio artifact locale
- memoria locale
- matching autista badge-first
- rafforzamento blocco gomme del report mezzo

## Prossimo step di migrazione
- Se serve ancora copertura gomme piu ampia, aprire un task dedicato sui record senza targa diretta o con soli campi di contesto, senza forzare match non dimostrati.

## Moduli impattati
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/internal-ai/internalAiVehicleReportFacade.ts`

## Contratti dati coinvolti
- `storage/@manutenzioni`
- `storage/@mezzi_aziendali`
- `storage/@cambi_gomme_autisti_tmp`
- `storage/@gomme_eventi`

## Ultime modifiche eseguite
- Convergenza read-only delle due fonti gomme dedicate oltre alle manutenzioni.
- Regola esplicita mezzo-first con distinzione `forte / plausibile`.
- Deduplica prudente degli eventi gomme gia importati nello storico manutenzioni.
- Trasparenza maggiore del blocco gomme nel `report targa` IA.

## File coinvolti
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/internal-ai/internalAiVehicleReportFacade.ts`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Nessun allargamento a materiali, documenti o altri blocchi del report mezzo.
- Nessun match contestuale promosso a collegamento forte.
- Nessuna deduplica aggressiva oltre ai casi dimostrati dai campi chiave.

## Vincoli da non rompere
- Nessuna scrittura business.
- Nessun riuso runtime IA legacy.
- Tutti i testi visibili nel gestionale devono restare in italiano.
- Meglio copertura parziale dichiarata che evento gomme collegato in modo arbitrario.

## Parti da verificare
- Se esistono record storici in `@gomme_eventi` privi sia di `targetTarga` sia di `targa` ma con soli campi contestuali.
- Quanto pesa davvero il residuo di eventi gomme senza brand/asse/km sufficienti per una deduplica forte con le manutenzioni.

## Rischi aperti
- Alcuni record gomme senza targa diretta possono restare fuori o restare solo plausibili.
- La deduplica con le manutenzioni non tenta fusioni quando i campi chiave non coincidono davvero.
- Il Dossier Gomme clone ora usa lo stesso layer rafforzato del report mezzo, quindi eventuali follow-up dovranno essere trattati nel dominio e non nel solo facade IA.

## Punti da verificare collegati
- nessuno esplicito in `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Monitorare casi reali di eventi gomme solo contestuali e decidere in task dedicato se restare su copertura plausibile oppure introdurre un contratto dominio piu esplicito per questi record.

## Cosa NON fare nel prossimo task
- Non spostare la logica gomme direttamente nel facade IA.
- Non introdurre fuzzy matching o deduzioni basate solo su sessioni o contesti deboli.
- Non toccare madre o dataset business per "ripulire" i dati a monte.

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
