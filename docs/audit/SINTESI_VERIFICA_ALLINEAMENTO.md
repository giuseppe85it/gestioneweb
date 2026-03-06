# SINTESI VERIFICA ALLINEAMENTO

## Totale differenze rilevate
- Totale: **15**
- Critiche: **1**
- Alte: **5**
- Medie: **8**
- Basse: **1**

## 10 differenze piu importanti
1. **AUD-004 (CRITICA)** - `storage.rules` nel repo nega tutto, mentre il client usa Storage in molti flussi (upload/download/delete).
2. **AUD-001 (ALTA)** - `aiCore` risulta documentato come supporto Functions confermato, ma export backend `aiCore` non trovato.
3. **AUD-003 (ALTA)** - Endpoint IA/PDF hardcoded e regioni miste (`us-central1` + callable `europe-west3`) senza gateway canonico.
4. **AUD-002 (ALTA)** - Flussi `estraiPreventivoIA` e `stamp_pdf` attivi in codice ma non mappati in modo esplicito nei documenti ufficiali.
5. **AUD-005 (ALTA)** - `firestore.rules` assente nel repository: policy Firestore non verificabile da codice versionato.
6. **AUD-013 (ALTA)** - Endpoint HTTP Functions con CORS wildcard (`*`) non tracciati come rischio specifico in blueprint sicurezza.
7. **AUD-007 (MEDIA)** - Doppio dettaglio ordine (`/acquisti/dettaglio/:ordineId` vs `/dettaglio-ordine/:ordineId`) ancora attivo.
8. **AUD-008 (MEDIA)** - Alias dossier (`/dossiermezzi/:targa` vs `/dossier/:targa`) ancora attivi con link interni misti.
9. **AUD-009 (MEDIA)** - Mappa dati ufficiale incompleta sulle chiavi local/session realmente usate.
10. **AUD-012 (MEDIA)** - Algoritmo reale di merge rifornimenti canonical/tmp non descritto nel contratto dati ufficiale.

## Cosa risulta ben allineato
- Struttura macro moduli (Autisti, Dossier, Operativita, Magazzino, IA/Cisterna) e coerente con il codice.
- Incoerenze storiche principali gia intercettate nei docs (eventi autisti doppi, alias route, pattern preventivi multipli).
- Baseline sicurezza documentata su auth anonima, assenza guard ruolo route-level e mancanza `firestore.rules`.

## Cosa richiede decisione architetturale
- Endpoint IA canonico (incluso caso `aiCore`) e strategia regioni/host.
- Policy dati/sicurezza effettive deployate (Storage + Firestore).
- Route canoniche definitive per Dossier e dettaglio ordini.

## Cosa richiede solo aggiornamento documentale
- Contratto endpoint backend attivi (`estraiPreventivoIA`, `stamp_pdf`, `estrazione_libretto`).
- Inventario completo chiavi local/session e relativi writer/reader.
- Criteri reali di merge rifornimenti tra `@rifornimenti` e `@rifornimenti_autisti_tmp`.
- Note esplicite su asset legacy/supporto tecnico (`.bak2`, export v1/v2 in `functions-schede`).

## Nota operativa
I dettagli completi (con file/funzione/linee e azione consigliata) sono in:
- `docs/audit/VERIFICA_ALLINEAMENTO_REPO_E_DOCUMENTI.md`
- `docs/audit/TABELLA_DIFFERENZE_REPO_DOCS.md`
