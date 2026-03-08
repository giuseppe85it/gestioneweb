# REGOLE STRUTTURA DATI

Versione: 2026-03-06  
Scopo: contratto dati globale ad alto livello per evitare incoerenze nelle evoluzioni future.

## Legenda stato
- **[CONFERMATO]**: dedotto con prova da repository/docs esistenti.
- **[RACCOMANDAZIONE]**: regola target per la nuova app.
- **[DA VERIFICARE]**: manca prova univoca.
- **[INCOERENTE]**: presenti varianti attive concorrenti.

---

## 1) Entita principali

### 1.1 Mezzo (`@mezzi_aziendali`) [CONFERMATO]
- **Campi chiave**: `id`, `targa`, `categoria`, `marca`, `modello`, `autistaNome?`, `fotoUrl?`, `librettoUrl?`, `librettoStoragePath?`.
- **Writer principali**: `Mezzi`, `IALibretto`, `IACoperturaLibretti`.
- **Reader principali**: Home, Dossier, Lavori, Manutenzioni, Autisti, Analisi.
- **Relazioni**:
  - 1 Mezzo -> N Lavori (`@lavori`)
  - 1 Mezzo -> N Manutenzioni (`@manutenzioni`)
  - 1 Mezzo -> N Rifornimenti (`@rifornimenti`, `@rifornimenti_autisti_tmp`)
  - 1 Mezzo -> N Costi (`@costiMezzo`)
  - 1 Mezzo -> N Documenti IA (`@documenti_*`)

### 1.2 Lavoro (`@lavori`) [CONFERMATO]
- **Campi chiave**: `id`, `gruppoId`, `tipo`, `descrizione`, `eseguito`, `targa?`, `urgenza?`, `dataInserimento`, `dataEsecuzione?`, `sottoElementi?`.
- **Writer**: LavoriDaEseguire/DettaglioLavoro + import/rettifiche autisti.
- **Reader**: LavoriInAttesa/LavoriEseguiti/Dossier/Mezzo360.
- **Regola** [RACCOMANDAZIONE]: ogni lavoro con `targa` deve essere navigabile dal Dossier Mezzo.

### 1.3 Manutenzione (`@manutenzioni`) [CONFERMATO]
- **Obbligatori dedotti**: `id`, `targa`, `tipo`, `descrizione`, `data`.
- **Opzionali dedotti**: `km`, `ore`, `sottotipo`, `eseguito`, `fornitore`, `materiali[]`, `manutenzioneDataFine?`.
- **Writer**: `Manutenzioni`, `AutistiEventoModal`.
- **Reader**: GestioneOperativa, Dossier, Mezzo360, GommeEconomia.
- **Nota**: obbligatorieta dedotta dal client UI, non da schema server [DA VERIFICARE lato regole backend].

### 1.4 Rifornimento (tmp + canonico) [CONFERMATO + TARGET NORMALIZZATO]
- **Tmp**: `@rifornimenti_autisti_tmp`
- **Canonico business target**: `@rifornimenti`
- **Ruolo del tmp**: intake/staging operativo; non deve alimentare reader business NEXT.
- **Shape target `@rifornimenti`**: oggetto unico con `items: RifornimentoCanonico[]` [TARGET].
- **Chiave mezzo canonica**: `mezzoTarga` [TARGET].
- **Alias legacy da normalizzare in ingresso**: `targa`, `targaCamion`, `targaMotrice`.
- **Temporale canonico target**: `timestamp` numerico; eventuale `dataLabel` solo UI [TARGET].
- **Economico canonico target**: `costo`; `importo` resta alias di intake [TARGET].
- **Campi minimi canonici target**: `id`, `mezzoTarga`, `timestamp`, `litri`, `km`, `costo`, `source`, `validation`.
- **Writer attuali**: App autisti + rettifiche admin.
- **Reader legacy attuali**: Inbox/Home/CentroControllo/Dossier/Sezioni economiche.
- **Problemi verificati**:
  - `@rifornimenti` letto come `items` o `value.items`;
  - `DossierMezzo` legge ancora `@rifornimenti_autisti_tmp`;
  - `RifornimentiEconomiaSection` fa merge euristico tra canonico e tmp per recuperare `km`.
- **Regola target**: un record e business-canonico solo se e presente in `@rifornimenti.items` con shape target e `validation.status` esplicito; niente merge reader-side nella NEXT.

### 1.5 Documento IA (`@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`) [CONFERMATO]
- **Campi chiave**: `tipoDocumento`, `targa?`, `dataDocumento?`, `fornitore?`, `totaleDocumento?`, `valuta/currency?`, `fileUrl`, `testo?`, `createdAt`.
- **Writer**: `IADocumenti`.
- **Reader**: Dossier, Mezzo360, Capo*, AnalisiEconomica.
- **Regola** [RACCOMANDAZIONE]: mantenere `sourceKey` + `sourceDocId` in UI per edit/delete affidabile.

### 1.6 Inventario e movimenti [CONFERMATO]
- **Inventario** (`@inventario`): `id`, `descrizione`, `quantita`, `unita`, `fornitore?`, `fotoUrl?`, `fotoStoragePath?`.
- **Materiali consegnati** (`@materialiconsegnati`): `id`, `descrizione`, `quantita`, `destinatario`, `targa?`, `data`, `refId?`.
- **Attrezzature cantieri** (`@attrezzature_cantieri`):
  - Obbligatori dedotti: `id`, `tipo`, `data`, `materialeCategoria`, `descrizione`, `quantita`, `unita`, `cantiereId/cantiereLabel`.
  - Opzionali dedotti: `note`, `fotoUrl`, `fotoStoragePath`, `sourceCantiereId`, `sourceCantiereLabel`.

### 1.7 Procurement (ordini/preventivi/listino) [CONFERMATO]
- **Ordini**: `@ordini`
- **Preventivi**: `@preventivi`
- **Listino**: `@listino_prezzi`
- **Writer principali**: `Acquisti`, `MaterialiDaOrdinare`, `DettaglioOrdine`.
- **Reader principali**: `Acquisti`, `OrdiniInAttesa`, `OrdiniArrivati`, `CapoCosti` (indiretto).
- **Allegati preventivi**: path multipli attivi [INCOERENTE].

### 1.8 Evento autista/sessione [CONFERMATO]
- **Sessione live**: `@autisti_sessione_attive`.
- **Storico operativo canonico corrente**: `@storico_eventi_operativi`.
- **Collection alternativa**: `autisti_eventi` [INCOERENTE / uso non dimostrato nel flusso attivo].
- **Campi tipici evento**: `id`, `tipo`, `timestamp`, `badgeAutista`, `nomeAutista`, `targaMotrice?`, `targaRimorchio?`, `prima?`, `dopo?`.

### 1.9 Analisi economica [CONFERMATO]
- **Collection**: `@analisi_economica_mezzi` (docId normalizzato su targa).
- **Writer/Reader**: `AnalisiEconomica`.
- **Input principali**: mezzi, costi, documenti IA, rifornimenti/manutenzioni.

---

## 2) Relazioni principali

1. `Mezzo (targa)` -> aggrega `lavori`, `manutenzioni`, `rifornimenti`, `costi`, `documenti`, `eventi`.
2. `Ordine` -> impatta `inventario` quando materiale arriva.
3. `Manutenzione` -> puo generare movimenti in `@materialiconsegnati` e decremento `@inventario`.
4. `Evento autista` -> alimenta Home/Inbox/CentroControllo + timeline 360 e Dossier.
5. `Documento IA` -> alimenta Dossier/Analisi/CapoCosti.

---

## 3) Writer/Reader principali per macro-area

| Macro-area | Writer principali | Reader principali |
|---|---|---|
| Flotta | Mezzi, Manutenzioni, Lavori | Home, Dossier, 360, Analisi |
| Operativita/Magazzino | Acquisti, DettaglioOrdine, Inventario, MaterialiConsegnati | GestioneOperativa, Dossier, CentroControllo |
| Autisti | Login/Setup/Home/Rifornimento/Controllo/Segnalazioni/Richieste | AutistiInbox, Home, CentroControllo, Dossier, 360 |
| IA documentale | IADocumenti, IALibretto | Dossier, Capo, Analisi |
| Cisterna | CisternaCaravateIA/CisternaSchedeTest | CisternaCaravatePage |

---

## 4) Regole contratto da rispettare (nuova app)

1. **Targa come chiave logica cross-modulo** [RACCOMANDAZIONE]  
   Normalizzazione uniforme (`uppercase`, no separatori incoerenti).
2. **Una sorgente canonica per eventi autisti** [RACCOMANDAZIONE]  
   Evitare dual-stream `autisti_eventi` vs `@storico_eventi_operativi`.
3. **Un contratto unico per allegati preventivi** [RACCOMANDAZIONE]  
   Introdurre `sourceType` (`ia`/`manuale`) e resolver unico path.
4. **Shape stabile per documenti `storage/<key>`** [RACCOMANDAZIONE]  
   Evitare mix non governato tra `[]`, `{items:[]}`, `{value:[]}`.
5. **Delete sicure e tracciate** [RACCOMANDAZIONE]  
   Preferire soft delete dove il rischio operativo e alto.
6. **Separazione writer/reader nel Dossier** [RACCOMANDAZIONE]  
   Dossier aggrega e visualizza; non diventa writer generalista.
7. **D04: nessun merge tmp/canonico lato reader** [RACCOMANDAZIONE]  
   `@rifornimenti_autisti_tmp` resta staging; Dossier, consumi e NEXT leggono solo `@rifornimenti.items` con `source` e `validation`.

---

## 5) Punti non chiusi
- Regole Firestore effettive non presenti nel repository (`firestore.rules` assente) [DA VERIFICARE].
- Matrice ruoli/permessi applicata a livello route/api non dimostrata [DA VERIFICARE].
- Uso produttivo reale di `autisti_eventi` non dimostrato nelle schermate attive [DA VERIFICARE].

---

## 6) Fonti di riferimento
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/ui-redesign/verification_closure.md`
- `docs/diagrams/flows_data_contract.md`
- `src/utils/storageSync.ts`
- `src/App.tsx`

