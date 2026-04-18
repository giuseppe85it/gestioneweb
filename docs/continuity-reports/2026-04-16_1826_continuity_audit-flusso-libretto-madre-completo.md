# CONTINUITY REPORT - audit flusso libretto madre completo

## Contesto
- Task solo audit, senza patch runtime.
- Perimetro analizzato: legacy MADRE `IA Libretto`, non la route NEXT.

## Stato attuale dopo questo task
- esiste un audit dedicato in `docs/audit/AUDIT_FLUSSO_LIBRETTO_MADRE_COMPLETO_2026-04-16_1826.md`;
- la route legacy vera e `/ia/libretto`;
- il salvataggio legacy archivia il file in Storage su `mezzi_aziendali/<mezzoId>/libretto.jpg` e scrive il record mezzo dentro `storage/@mezzi_aziendali`;
- i reader downstream verificati sono `IALibretto`, `DossierMezzo`, `IACoperturaLibretti`, `ControlloDebug`, `LibrettiExport`, `Home`, `Mezzi`;
- il backend esterno `estrazione-libretto` resta il blocco reale che impedisce una ricostruzione al 100% del contratto di estrazione.

## Punto chiave da ricordare
- il frontend legacy associa il libretto al mezzo solo via targa estratta dall’IA;
- se non trova match, crea un nuovo mezzo fallback;
- `Home` non legge `librettoUrl`, ma usa i campi data scritti dal salvataggio libretto;
- `IACoperturaLibretti` e `LibrettiExport` sono i soli reader legacy che usano davvero `librettoStoragePath` come fallback/riparazione;
- `DossierMezzo` e l’archivio/viewer di `IALibretto` usano invece solo `librettoUrl`.

## Limite rimasto aperto
- senza il codice del servizio esterno non e dimostrabile:
- schema backend completo di `json.data`;
- logica OCR/prompt/validatori;
- garanzia sui campi sempre presenti.

## Prossimo passo corretto se si vuole chiudere il 100%
- reperire il codice sorgente del servizio esterno `estrazione-libretto` o un file backend equivalente che definisca input, output e fallback reali.

## Commit hash
- NON ESEGUITO
