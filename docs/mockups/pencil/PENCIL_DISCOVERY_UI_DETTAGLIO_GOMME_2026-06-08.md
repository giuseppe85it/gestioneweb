# PENCIL DISCOVERY - UI DETTAGLIO GOMME MANUTENZIONI NEXT

Data: 2026-06-08

Esito: **PENCIL BLOCCATO COME FILE CONSEGNABILE**

Motivo: Pencil MCP e' utilizzabile quando un file `.pen` e' aperto nell'editor VS Code, ma in questa sessione non ha materializzato su disco il file richiesto dalla whitelist:

```text
docs/mockups/pencil/UI_DETTAGLIO_GOMME_MANUTENZIONI_NEXT_2026-06-08.pen
```

Il canvas attivo Pencil e' stato disegnato e validato, ma `Test-Path` sul file atteso ha restituito `False`. Per non consegnare un `.pen` finto o fuori whitelist, questo documento resta l'unico artefatto scritto in `docs/mockups/pencil/`.

## 1. Perimetro rispettato

Non sono state fatte patch runtime.

Non sono stati modificati:

- React;
- CSS;
- writer;
- domain;
- barrier;
- App Autisti;
- Autisti Inbox/Admin;
- route;
- moduli;
- schema dati.

Il mock riguarda solo:

```text
Manutenzioni -> Dettaglio -> record gomme
```

## 2. Discovery Pencil

Pencil risulta configurato nel workspace:

```text
CLAUDE.md
pencil | stdio | c:\Users\giumi\.vscode\extensions\highagency.pencildev-0.6.36\out\mcp-server-windows-x64.exe --app visual_studio_code
```

File `.pen` trovati nel repo:

```text
docs/design/dettaglio-manutenzione.pen
```

Nota: un file aperto dall'utente in VS Code viene visto dal MCP come:

```text
pencil-new.pen
```

Quando nessun `.pen` e' aperto, Pencil risponde:

```text
Failed to access file . A file needs to be open in the editor to perform this action.
```

Quando il file e' aperto, `get_editor_state(include_schema: true)` funziona e restituisce schema/canvas.

Tentativo sul file whitelist:

```text
snapshot_layout(filePath: C:\progetti\gestioneweb\docs\mockups\pencil\UI_DETTAGLIO_GOMME_MANUTENZIONI_NEXT_2026-06-08.pen)
```

Il MCP ha risposto leggendo il canvas attivo, ma il file non e' comparso su disco:

```text
Test-Path docs/mockups/pencil/UI_DETTAGLIO_GOMME_MANUTENZIONI_NEXT_2026-06-08.pen
False
```

Conclusione: Pencil puo' disegnare sull'editor attivo, ma non e' affidabile in questa sessione per creare/salvare il `.pen` atteso nella whitelist.

## 3. Discovery asset realistici mezzi

Sono stati cercati asset immagine reali in `public/` e `src/`, escludendo dipendenze.

Asset interni rilevanti trovati:

```text
public/gomme/bigaDX.png
public/gomme/bigaSX.png
public/gomme/centinaDX.png
public/gomme/centinaSX.png
public/gomme/motrice2assiDX.png
public/gomme/motrice2assiSx.png
public/gomme/motrice3assiDX.png
public/gomme/motrice3assiSX.png
public/gomme/motrice4assiDX.png
public/gomme/motrice4assiSX.png
public/gomme/pianaleDX.png
public/gomme/pianaleSX.png
public/gomme/semirimorchioassefissoDX.png
public/gomme/semirimorchioassefissoSX.png
public/gomme/semirimorchioassesterzanteDX.png
public/gomme/semirimorchioassesterzanteSX.png
public/gomme/trattore_cisternaDX.png
public/gomme/trattore_cisternaSX.png
public/gomme/vascaDX.png
public/gomme/vascaSX.png
```

Questi sono asset tecnici reali dell'app autisti, non immagini web casuali.

Codice che li usa:

```text
src/components/wheels.ts
src/components/TruckGommeSvg.tsx
src/pages/ModalGomme.tsx
src/pages/ModalGomme.css
src/autisti/GommeAutistaModal.tsx
```

`TruckGommeSvg.tsx` dichiara esplicitamente:

```text
immagine tecnica reale del mezzo
```

e usa `backgroundImage` con overlay delle ruote.

## 4. Mapping categoria -> immagine trovato

Mapping reale da `src/components/wheels.ts` e `resolveWheelGeomKey` in `src/pages/ModalGomme.tsx` / `src/autisti/GommeAutistaModal.tsx`:

| Categoria reale | Chiave `wheelGeom` | Asset esempio | Assi/ruote | Affidabilita |
| --- | --- | --- | --- | --- |
| `motrice 2 assi` | `motrice2assi` | `public/gomme/motrice2assiDX.png` | anteriore + asse1/posteriore | Alta |
| `motrice 3 assi` | `motrice3assi` | `public/gomme/motrice3assiDX.png` | anteriore + asse1 + asse2 | Alta |
| `motrice 4 assi` | `motrice4assi` | `public/gomme/motrice4assiDX.png` | anteriore + asse1 + asse2 + asse3 | Alta |
| `trattore stradale` | `trattore` | `public/gomme/trattore_cisternaDX.png` | anteriore + posteriore | Alta |
| `biga` | `biga` | `public/gomme/bigaDX.png` | asse1 + asse2 | Alta |
| `pianale` | `pianale` | `public/gomme/pianaleDX.png` | 3 punti lato | Alta |
| `vasca` | `vasca` | `public/gomme/vascaDX.png` | 3 punti lato | Alta |
| `centina` | `centina` | `public/gomme/centinaDX.png` | 3 punti lato | Alta |
| `semirimorchio asse fisso` | `semirimorchioFissi` | `public/gomme/semirimorchioassefissoDX.png` | asse1 + asse2 + asse3 | Alta |
| `semirimorchio asse sterzante` | `semirimorchioSterzante` | `public/gomme/semirimorchioassesterzanteDX.png` | asse1 + asse2 + asse3 | Alta |

Non e' stato usato internet.

## 5. Mock generato nel canvas Pencil attivo

Nel canvas Pencil attivo e' stato generato un mock realistico a 4 stati, poi validato con:

```text
snapshot_layout(..., problemsOnly: true)
No layout problems.
```

Stati inclusi nel canvas:

1. **Dettaglio gomme ordinario**
   - targa `TI 123456`;
   - data `12/05/2026`;
   - stato `ESEGUITA`;
   - badge `STORICO UFFICIALE` + `ORDINARIO`;
   - categoria `motrice 2 assi`;
   - riferimento asset `public/gomme/motrice2assiDX.png`;
   - assi `1° asse`, `2° asse`;
   - km `383.482`;
   - marca `Kumho`;
   - fornitore `Valtellina Pneumatici`;
   - segnalato da `Sandro Calabrese`;
   - origine `evento gomme / app autisti`.

2. **Dettaglio gomme straordinario**
   - targa `TI 282780`;
   - data `26/05/2026`;
   - stato `ESEGUITA`;
   - badge `STORICO UFFICIALE` + `STRAORDINARIO`;
   - categoria `semirimorchio asse fisso`;
   - riferimento asset `public/gomme/semirimorchioassefissoDX.png`;
   - motivo `sostituzione valvola lato sx`;
   - asse `3° asse`;
   - quantita `non indicata`;
   - km `non salvato / non indicato`;
   - origine `evento gomme / app autisti`.

3. **Dati mancanti**
   - targa `TI 000000`;
   - data `15/06/2026`;
   - stato `DA FARE`;
   - badge `STORICO UFFICIALE` + `GOMME`;
   - categoria `semirimorchio asse sterzante`;
   - riferimento asset `public/gomme/semirimorchioassesterzanteDX.png`;
   - dati mancanti mostrati come `non indicato`;
   - nota: nessun valore inventato.

4. **Record creato manualmente da Manutenzioni**
   - targa `TI 000000`;
   - data `08/06/2026`;
   - stato `ESEGUITA`;
   - badge `STORICO UFFICIALE` + `STRAORDINARIO`;
   - categoria `trattore stradale`;
   - riferimento asset `public/gomme/trattore_cisternaDX.png`;
   - motivo `foratura / danno`;
   - asse `posteriore`;
   - quantita `1`;
   - km `123.456`;
   - fornitore `officina indicata nel record`;
   - origine `manuale`.

Il mock replica la schermata Manutenzioni: storico a sinistra, dettaglio a destra, azioni in alto, barra km, descrizione intervento e sezione `DETTAGLI INTERVENTO GOMME` migliorata.

## 6. Limite visuale del mock Pencil generato

Pencil non ha incorporato i PNG reali nel file consegnabile, perche' il file whitelist non e' stato creato/salvato su disco.

Nel canvas attivo la resa del mezzo e' semi-realistica: sagoma tecnica con cabina/cassone/targa/ruote e asse evidenziato. Le fonti corrette da usare nella versione finale sono gli asset interni `public/gomme/*.png`.

Per la versione finale approvabile, la richiesta operativa corretta e':

1. aprire in VS Code questo file esatto:

```text
docs/mockups/pencil/UI_DETTAGLIO_GOMME_MANUTENZIONI_NEXT_2026-06-08.pen
```

2. verificare che `get_editor_state(include_schema: true)` mostri quel file come editor attivo;
3. rilanciare il prompt chiedendo di trasferire il mock nel file aperto;
4. salvare il file da VS Code/Pencil.

## 7. File letti principali

Documenti:

- `docs/plan/PIANO_FLUSSI_UI_GOMME_MANUTENZIONI_NEXT_2026-06-08.md`
- `docs/audit/AUDIT_SCHEMA_IMPORT_GOMME_MANUTENZIONI_NEXT_2026-06-08.md`
- `docs/audit/AUDIT_UI_GOMME_NEXT_2026-06-08.md`
- `docs/HANDOFF_UI_GOMME_2026-06-08.md`
- `AGENTS.md`

Codice/UI:

- `src/next/NextMappaStoricoPage.tsx`
- `src/next/NextManutenzioniPage.tsx`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/autisti/GommeAutistaModal.tsx`
- `src/next/autistiInbox/NextAutistiAdminNative.tsx`
- `src/next/components/NextImportGommeChiusuraModal.tsx`
- `src/components/wheels.ts`
- `src/components/TruckGommeSvg.tsx`
- `src/pages/ModalGomme.tsx`
- `src/pages/ModalGomme.css`

CSS:

- `src/next/next-mappa-storico.css`
- `src/next/next-manutenzioni.css`

## 8. Verdetto

Il mock Pencil e' stato costruito nel canvas attivo e verificato come layout, ma non e' consegnabile come `.pen` whitelist perche' il file atteso non esiste su disco.

Artefatto consegnabile in questo perimetro:

```text
docs/mockups/pencil/PENCIL_DISCOVERY_UI_DETTAGLIO_GOMME_2026-06-08.md
```

