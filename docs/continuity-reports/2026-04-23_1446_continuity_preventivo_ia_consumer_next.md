# CONTINUITY REPORT - Consumer NEXT IA preventivi

Data: 2026-04-23  
Task di riferimento: Prompt 30 - Implementazione consumer NEXT IA preventivi  
Change report: `docs/change-reports/2026-04-23_1446_preventivo_ia_consumer_next.md`

---

## Stato Procurement NEXT dopo questa patch

Nel tab `/next/materiali-da-ordinare?tab=preventivi` convivono ora due ingressi distinti:

| Pulsante | Flusso | Stato |
|---|---|---|
| `PREVENTIVO MANUALE` | modale manuale già esistente | attivo |
| `CARICA PREVENTIVO IA` | nuovo consumer IA NEXT | attivo |

## Cosa fa il nuovo consumer IA

- Accetta:
  - 1 PDF (`application/pdf`)
  - oppure fino a 10 immagini (`image/*`)
- Chiama l'endpoint backend:
  - `http://127.0.0.1:4310/internal-ai-backend/documents/preventivo-extract`
- Converte la data estratta:
  - input backend `dd/mm/yyyy`
  - output UI `yyyy-mm-dd` per `<input type="date">`
- Permette review/edit delle righe con confronto live contro il listino corrente del fornitore selezionato.
- Salva tramite writer esteso:
  - preventivo in `storage/@preventivi`
  - listino in `storage/@listino_prezzi`
  - upload Storage su `preventivi/ia/`

## Boundary e vincoli confermati

- Nessuna modifica a:
  - `src/pages/Acquisti.tsx`
  - `functions/index.js`
  - `backend/internal-ai/**`
  - `src/next/NextPreventivoManualeModal.tsx`
- Nessun upload Storage lato consumer prima della chiamata al writer.
- Tutte le scritture reali passano ancora da:
  - `src/utils/firestoreWriteOps.ts`
  - `src/utils/storageWriteOps.ts`
- `cloneWriteBarrier.ts` autorizza ora, nel solo scope `/next/materiali-da-ordinare`:
  - `storage.uploadBytes` sotto `preventivi/manuali/`
  - `storage.uploadBytes` sotto `preventivi/ia/`
  - `firestore.setDoc` su `storage/@preventivi`
  - `firestore.setDoc` su `storage/@listino_prezzi`
  - `fetch.runtime` verso il solo endpoint `documents/preventivo-extract`

## Checklist verifica runtime (product owner)

- [ ] Aprire `/next/materiali-da-ordinare?tab=preventivi`
- [ ] Verificare presenza di `PREVENTIVO MANUALE` e `CARICA PREVENTIVO IA`
- [ ] Aprire `PREVENTIVO MANUALE` e confermare che il modale storico si apra come prima
- [ ] Aprire `CARICA PREVENTIVO IA` e verificare step upload con radio `PDF / Immagini (max 10)`
- [ ] Selezionare un PDF valido e verificare avvio estrazione
- [ ] Selezionare 11 immagini e verificare blocco lato UI
- [ ] In review, verificare prefill di:
  - fornitore se match trovato
  - numero preventivo
  - data convertita in input `type="date"`
  - valuta con fallback `CHF`
- [ ] Salvare un preventivo IA PDF e verificare:
  - record in `storage/@preventivi`
  - `pdfStoragePath/pdfUrl` popolati
  - file sotto `preventivi/ia/`
  - update coerente di `storage/@listino_prezzi`
- [ ] Verificare assenza di regressioni visibili sul flusso manuale

## Debito tecnico noto

- Smoke test con estrazione reale da file non automatizzato in questa sessione: `DA VERIFICARE`.
- La whitelist fetch nel barrier è stata aggiunta come richiesto dalla SPEC; l'effettiva intercettazione resta dipendente dal comportamento del predicato generico `shouldBlockFetchInClone`, che non è stato toccato per vincolo di task.
