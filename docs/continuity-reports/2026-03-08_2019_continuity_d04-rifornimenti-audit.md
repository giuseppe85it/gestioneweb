# CONTINUITY REPORT - D04 rifornimenti audit

## Contesto generale
- Il progetto sta costruendo la NEXT per domini canonici, mantenendo la legacy intatta.
- `D04 Rifornimenti e consumi` era gia stato normalizzato a livello documentale, ma restava da capire se i dati reali fossero leggibili in modo pulito dalla NEXT.

## Modulo/area su cui si stava lavorando
- Dominio dati `D04 Rifornimenti e consumi`
- Audit tecnico mirato alla futura lettura read-only nella NEXT

## Stato attuale
- Il flusso reale dei rifornimenti e stato ricostruito.
- E confermato che il madre usa staging `tmp`, proiezione dossier e fallback/merge in lettura.

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- NON INIZIATO

## Cosa e gia stato importato/migrato
- Nessuna lettura `D04` nella NEXT.

## Prossimo step di migrazione
- Non importare ancora `D04`.
- Prima serve una scelta esplicita tra contratto business realmente riallineato o contratto provvisorio derogato e documentato.

## Moduli impattati
- `src/autisti/Rifornimento.tsx`
- `src/autistiInbox/AutistiAdmin.tsx`
- `src/pages/DossierMezzo.tsx`
- `src/pages/RifornimentiEconomiaSection.tsx`
- `src/utils/storageSync.ts`
- `src/utils/homeEvents.ts`

## Contratti dati coinvolti
- `@rifornimenti_autisti_tmp`
- `@rifornimenti`

## Ultime modifiche eseguite
- Creato audit dedicato `docs/data/AUDIT_RIFORNIMENTI_NEXT_READONLY.md`.
- Chiarito che il Dossier legacy legge `tmp`, mentre la sezione economia usa sia canonico sia `tmp`.
- Formalizzato che non esiste ancora un sottoinsieme NEXT-safe con parita rispetto al madre.

## File coinvolti
- docs/data/AUDIT_RIFORNIMENTI_NEXT_READONLY.md
- docs/change-reports/2026-03-08_2019_docs_audit-rifornimenti-next-readonly.md
- docs/continuity-reports/2026-03-08_2019_continuity_d04-rifornimenti-audit.md

## Decisioni gia prese
- La NEXT non deve leggere `@rifornimenti_autisti_tmp`.
- La NEXT non deve fare merge reader-side tra `tmp` e canonico.
- Il dato oggi visto dal madre non e ancora ottenibile in forma pulita dal solo `@rifornimenti.items`.

## Vincoli da non rompere
- Nessuna modifica a gestionale madre, app autisti, storage o backend.
- Nessun reader NEXT che replichi fallback `value.items` o merge legacy.
- Nessuna promozione implicita di shape legacy a contratto canonico.

## Parti da verificare
- Verifica quantitativa su dati reali di `@rifornimenti.items` per capire diffusione effettiva di `km`, `costo` e chiave mezzo coerente.
- Eventuale decisione formale su contratto transitorio vs riallineamento del business canonico.

## Rischi aperti
- Importare ora `D04` nella NEXT porterebbe dentro le tolleranze legacy.
- Il dominio resta ambiguo finche il dataset business non espone in modo affidabile il target documentato.

## Punti da verificare collegati
- DA VERIFICARE

## Prossimo passo consigliato
- Fare un controllo mirato sui record reali di `storage/@rifornimenti.items` prima di qualsiasi reader NEXT.

## Cosa NON fare nel prossimo task
- Non leggere `@rifornimenti_autisti_tmp` nella NEXT.
- Non recuperare `km` dal `tmp` per completare record del canonico.
- Non introdurre fallback shape `value.items` o alias silenziosi `data -> timestamp`.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/AUDIT_RIFORNIMENTI_NEXT_READONLY.md`
