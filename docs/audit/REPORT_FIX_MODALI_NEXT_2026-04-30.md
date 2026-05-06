# Report Fix Modali NEXT vs Tool Chat IA
Data: 2026-04-30
Autore: Codex
Prompt: 63A - Fix GAP Modali NEXT selezionati
Stato patch: PARZIALE per verifica E2E completa non verde; G1-G9 implementati e test dedicati verdi.

## Sommario
- GAP selezionati implementati: 9/9.
- Nuovo tool registrato: `get_euromecc_data`.
- Tool mezzo estesi: `list_vehicles`, `get_vehicle_by_plate`, `search_vehicles_by_attribute`, `get_vehicle_status`, `get_vehicle_dossier_snapshot`, `list_scheduled_maintenance_due`.
- Tool officine esteso: `list_workshops`.
- Foto viste e hotspot integrati tramite lettura read-only di `storage/@mezzi_foto_viste` e `storage/@mezzi_hotspot_mapping`.
- Reader/domain non modificati.
- Firestore usato solo in lettura.

## Tabella GAP
| GAP | Stato | Tool/File | Campi esposti |
|---|---|---|---|
| G1 - descrizione officina | CHIUSO | `toolListWorkshops.ts` | `descrizione` |
| G2 - NextMezzoEditModal sotto-oggetti mezzo | CHIUSO | tool mezzo | `prenotazioneCollaudo`, `preCollaudo`, `fotoUrl`, `fotoPath`, `librettoUrl`, `librettoStoragePath`, `libretto_raw`, `media`, `fotoViste`, `hotspots` |
| G3 - prenotazione collaudo | CHIUSO | tool mezzo | `prenotazioneCollaudo.data`, `ora`, `luogo`, `note` |
| G4 - pre-collaudo | CHIUSO | tool mezzo | `preCollaudo.data`, `officina`, `lavoriPrevisti` |
| G5 - revisione completata | CHIUSO | tool mezzo | `prenotazioneCollaudo.completata`, `completataIl`, `esito`, `noteEsito` |
| G6 - libretto raw | CHIUSO | tool mezzo | `libretto_raw` come valore salvato sul mezzo |
| G7 - foto vista mezzo | CHIUSO | tool mezzo | `media.foto_viste`, `fotoViste` |
| G8 - hotspot mappa | CHIUSO | tool mezzo | `media.hotspots`, `hotspots` |
| G9 - Euromecc issue + extra components | CHIUSO | `get_euromecc_data` | root collections `euromecc_issues`, `euromecc_extra_components` |

## Nuovo Tool
`get_euromecc_data`

- Legge `euromecc_issues`.
- Legge `euromecc_extra_components`.
- Parametri: `targa`, `tipo: issue | extra_component | all`, `limit`.
- Non legge `euromecc_relazioni`.
- Non legge `euromecc_done`.
- Non legge `euromecc_pending`.
- Propaga `_id` da document id Firestore.

## Estensione Media Mezzo
Formato esposto nei tool mezzo:

```ts
media: {
  foto_viste: [{ _id, id, targa, vista, url, downloadUrl, storagePath, fileName, contentType, descrizione, uploadedAt, uploadedAt_italiana }],
  hotspots: [{ _id, id, targa, vista, areaId, areaLabel, descrizione, coordinate, x, y, createdAt, createdAt_italiana }]
}
```

Alias diretti esposti:
- `fotoViste`
- `hotspots`

## Verifiche
| Comando | Esito | Note |
|---|---|---|
| `npx playwright test tests/e2e/13-fixModaliNext.spec.ts` | VERDE | 10/10 test passati |
| `npx eslint <file toccati>` | VERDE | Nessun errore sui file modificati/creati |
| `npm run build` | VERDE | `tsc -b` + `vite build` completati |
| `npm run lint` | ROSSO | 567 errori preesistenti fuori perimetro, in file non toccati |
| `npm run test:e2e` | ROSSO | 102 test totali: 94 passati, 4 failed, 4 flaky |

## Dettaglio Nuovi Test
| Test | Esito |
|---|---|
| G1 - `list_workshops` espone descrizione | PASS |
| G2 - `list_vehicles` espone sotto-oggetti mezzo | PASS |
| G3 - prenotazione collaudo | PASS |
| G4 - pre-collaudo | PASS |
| G5 - revisione completata | PASS |
| G6 - `libretto_raw` | PASS |
| G7 - foto vista | PASS |
| G8 - hotspot | PASS |
| G9 - `get_euromecc_data` | PASS |
| Fingerprint nuovi dati | PASS |

## Suite E2E Completa - Failure Residui
Failure finali rilevati da `npm run test:e2e`:

| Test | Esito rilevato |
|---|---|
| `03-incroci` - incrocio timeline mezzo | FAIL: fallback anti-allucinazione con 0 record verificabili |
| `03-incroci` - incrocio cisterna snapshot | FAIL: fallback anti-allucinazione con 0 record verificabili |
| `03-incroci` - incrocio cisterna riconciliazione | FAIL: timeout/fallback, retry non ha soddisfatto le parole attese |
| `10-coerenzaAggregati` - rifornimenti aggregato/dettaglio | FAIL: dato reale 72, assert storico atteso 70 |

Flaky rilevati e passati al retry:
- `02-veritaCalcolata` - autista Sandro Calabrese.
- `03-incroci` - lavori aperti flotta.
- `03-incroci` - movimenti materiali.
- `10-coerenzaAggregati` - liste operative troncate.

## File Creati o Modificati
- `src/next/chat-ia/tools/registry/toolVehicleEnrichment.ts`
- `src/next/chat-ia/tools/registry/toolListWorkshops.ts`
- `src/next/chat-ia/tools/registry/toolListVehicles.ts`
- `src/next/chat-ia/tools/registry/toolGetVehicleByPlate.ts`
- `src/next/chat-ia/tools/registry/toolSearchVehiclesByAttribute.ts`
- `src/next/chat-ia/tools/registry/toolGetVehicleStatus.ts`
- `src/next/chat-ia/tools/registry/toolGetVehicleDossierSnapshot.ts`
- `src/next/chat-ia/tools/registry/toolListScheduledMaintenanceDue.ts`
- `src/next/chat-ia/tools/registry/toolGetEuromeccData.ts`
- `src/next/chat-ia/tools/index.ts`
- `src/next/chat-ia/agents/specialists/flottaAgent.ts`
- `src/next/chat-ia/agents/specialists/operazioniAgent.ts`
- `src/next/chat-ia/agents/specialists/cantieriMagazzinoAgent.ts`
- `tests/e2e/13-fixModaliNext.spec.ts`
- `docs/audit/REPORT_FIX_MODALI_NEXT_2026-04-30.md`

## Conferme Perimetro
- Archivista non analizzato.
- Archivista non modificato.
- Madre non modificata.
- Reader/domain functions non modificati.
- Tool bloccati non sbloccati.
- Firestore non scritto.
- Struttura Firestore non modificata.
- Nessun git commit.
