# CHECKLIST IA INTERNA

Ultimo aggiornamento: 2026-04-23
Stato: checklist riallineata allo stato reale del codice dopo `AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md`

---

## 1. Regola operativa

Ogni task che modifica una capability IA NEXT deve aggiornare questa checklist prima di chiudersi: aggiornare la riga di stato della capability interessata e aggiungere una riga nel §7 Storico.

---

## 2. Stati ammessi

| Stato | Significato |
|---|---|
| FATTO | Implementato e verificato in browser con dati reali |
| IN CORSO | Implementazione avviata ma non completata |
| DA VERIFICARE | Implementato nel codice (build OK) ma non verificato in browser |
| NON FATTO | Non ancora implementato |
| BLOCCATO | Implementazione possibile ma bloccata da prerequisito esterno |

---

## 3. Capability IA NEXT — stato reale

Fonte: §2.8 audit + §6 audit + codice `src/next/internal-ai/**`.

| Capability | File NEXT | Route | Stato |
|---|---|---|---|
| Hub navigazione IA | `NextIntelligenzaArtificialePage` | `/next/ia` | FATTO |
| Config API Key Gemini | `NextIAApiKeyPage` | `/next/ia/apikey` | FATTO |
| Estrazione libretto mezzo | `NextIALibrettoPage` + `NextEstrazioneLibretto.tsx` | `/next/ia/libretto` | DA VERIFICARE |
| Storico documenti (visualizzazione) | `NextIADocumentiPage` | `/next/ia/documenti` | FATTO |
| Delete libretto (tab Libretti) | `NextIADocumentiPage` | `/next/ia/documenti` | DA VERIFICARE |
| Cambio valuta inline documenti | `NextIADocumentiPage` | `/next/ia/documenti` | DA VERIFICARE |
| Copertura libretti (read-only) | `NextIACoperturaLibrettiPage` | `/next/ia/copertura-libretti` | FATTO |
| Export libretti (read-only) | `NextLibrettiExportPage` | `/next/libretti-export` | FATTO |
| Chat IA interna | `NextInternalAiPage` | `/next/ia/interna` | DA VERIFICARE |
| Analisi documentale multi-file | `NextInternalAiPage` | `/next/ia/interna` | DA VERIFICARE |
| Archivista — ramo Fattura/DDT Magazzino | `ArchivistaMagazzinoBridge.tsx` | `/next/ia/archivista` | DA VERIFICARE |
| Archivista — ramo Fattura/DDT Manutenzione | `ArchivistaManutenzioneBridge.tsx` | `/next/ia/archivista` | DA VERIFICARE |
| Archivista — ramo Documento Mezzo | `ArchivistaDocumentoMezzoBridge.tsx` | `/next/ia/archivista` | DA VERIFICARE |
| Archivista — ramo Preventivo Magazzino | `ArchivistaPreventivoMagazzinoBridge.tsx` | `/next/ia/archivista` | DA VERIFICARE |
| Archivista — ramo Preventivo Manutenzione | `ArchivistaPreventivoManutenzioneBridge.tsx` | `/next/ia/archivista` | DA VERIFICARE |
| Archivista — step 2 crea manutenzione | `ArchivistaManutenzioneBridge.tsx` | `/next/ia/archivista` | DA VERIFICARE |
| Archivista — multi-pagina Manutenzione | `ArchivistaManutenzioneBridge.tsx` | `/next/ia/archivista` | DA VERIFICARE |
| Preventivo IA procurement | `nextPreventivoIaClient.ts` + `NextPreventivoIaModal.tsx` | `/next/materiali-da-ordinare` | DA VERIFICARE |
| Report IA interno (preview) | `InternalAiProfessionalVehicleReportView.tsx` | `/next/ia/interna` | DA VERIFICARE |
| Analisi economica mezzo (IA) | — | — | NON FATTO |
| IA Cisterna extract | — | — | NON FATTO |
| IA Cisterna schede | — | — | NON FATTO |

---

## 4. Bloccanti IA aperti

| Bloccante | Impatto | Priorità |
|---|---|---|
| `storage.rules` deny-all | Tutti gli upload IA (libretto, documenti, preventivi IA) falliscono in produzione | 🔴 ALTA |
| Auth anonima | Write IA su documenti business avvengono senza claims di ruolo | 🔴 ALTA |
| Backend `backend/internal-ai/` non deployato | Chat, Archivista Manutenzione/Documento/Preventivo, Euromecc PDF non funzionano in produzione senza `localhost:4310` | 🔴 ALTA |

---

## 5. Lavori "DA VERIFICARE" residui (IA)

Direttamente dall'audit §6, relativo all'area IA:

- **IA Archivista — 5 rami attivi**: verifica browser su `/next/ia/archivista` con documenti reali per ogni ramo
- **IA Libretto — save reale**: upload file + click `Salva nei documenti del mezzo` con controllo Firestore/Storage
- **IA Documenti — delete tab Libretti**: click `Elimina` su record reale con conferma inline
- **Preventivo IA — end-to-end**: caricamento file reale, review editabile, salvataggio su `storage/@preventivi`
- **Stub Archivista rimossi**: verifica che i 5 rami attivi siano navigabili senza errori dopo la rimozione dei 4 stub

---

## 6. Prossimi passi

In ordine di urgenza:

1. **[BLOCCANTE]** Aggiornare `storage.rules` con `allow write` esplicito per: `mezzi_aziendali/`, `documenti_pdf/`, `preventivi/manuali/`, `preventivi/ia/`
2. **[BLOCCANTE]** Definire piano di deploy per `backend/internal-ai/` (es. Cloud Run, Railway, VM dedicata)
3. **[DA VERIFICARE]** Sessione browser live su `/next/ia/archivista` con file reali per i 5 rami
4. **[DA VERIFICARE]** Sessione browser live su `/next/ia/libretto` con click `Salva` reale
5. **[DA VERIFICARE]** Sessione browser live su `/next/materiali-da-ordinare?tab=preventivi` con Preventivo IA end-to-end
6. **[NON FATTO]** Implementare `NextAnalisiEconomicaPage` con chiamata reale a `analisi_economica_mezzo` (o equivalente backend interno)
7. **[NON FATTO]** Implementare capability IA cisterna (`NextCisternaIAPage`, `NextCisternaSchedeTestPage`) con write authorization

---

## 7. Riferimenti incrociati

| Documento | Contenuto correlato |
|---|---|
| `docs/audit/AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md` §2.8 | Matrice moduli IA con stato barrier e route |
| `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md` | Dettaglio capability e backend IA NEXT |
| `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md` | Capability legacy + stato assorbimento + priorità |
| `src/utils/cloneWriteBarrier.ts` | Sorgente di verità per write authorization IA NEXT |
| `backend/internal-ai/server/internal-ai-adapter.js` | Routes backend IA interno (porta 4310) |

---

## 8. Storico aggiornamenti

| Data | Evento |
|---|---|
| 2026-04-23 | Riscrittura integrale da zero. Fonte: `AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md` + codice `src/next/internal-ai/**`. Tutti i precedenti stati non verificabili nell'audit sono stati rimossi. |
