# CROSS CUTTING CONCERNS

Versione: 2026-03-06  
Scopo: regole trasversali della nuova app, valide su tutte le aree funzionali.

## Legenda stato
- **[CONFERMATO]**: gia presente nel progetto attuale.
- **[RACCOMANDAZIONE]**: regola target per nuova app.
- **[DA VERIFICARE]**: tema aperto/non chiuso.

---

## 1) PDF
- **Perche trasversale**: export/preview presente in moduli multipli (lavori, dossier, inbox autisti, acquisti, analisi).
- **Aree coinvolte**: Dashboard, Operativita, Flotta/Dossier, Autisti Inbox, Analisi.
- **Regole**:
  - Usare `pdfEngine` come motore unico [CONFERMATO].
  - Uniformare naming export e metadata PDF [RACCOMANDAZIONE].
  - Tracciare export in audit log [RACCOMANDAZIONE].

## 2) IA
- **Perche trasversale**: IA agisce su documenti, libretti, analisi, dominio cisterna.
- **Aree coinvolte**: IA&Documenti, Dossier, Analisi, Sistema/Supporto.
- **Regole**:
  - IA e capability, non modulo isolato [RACCOMANDAZIONE].
  - Separare intake IA globale da consumo dati nel Dossier [RACCOMANDAZIONE].
  - Governance endpoint multipli da consolidare [DA VERIFICARE].

## 3) Scadenze / Promemoria
- **Perche trasversale**: impatta priorita giornaliere, manutenzioni, controlli e anomalie.
- **Aree coinvolte**: Centro di Controllo, Flotta, Dossier, Operativita.
- **Regole**:
  - Home espone "priorita oggi" come primo livello [RACCOMANDAZIONE].
  - Stato reminder persistente (`@alerts_state`) con regole chiare [CONFERMATO+RACCOMANDAZIONE].
  - Ogni reminder legato a entita navigabile (mezzo, ordine, evento) [RACCOMANDAZIONE].

## 4) Ricerca globale
- **Perche trasversale**: i record rilevanti sono distribuiti tra moduli diversi.
- **Aree coinvolte**: tutte le aree admin.
- **Regole**:
  - Ricerca unica da Centro di Controllo [RACCOMANDAZIONE].
  - Risultati con origine modulo + link canonico [RACCOMANDAZIONE].
  - Supporto chiavi forti: targa, badge, id ordine/lavoro/documento [RACCOMANDAZIONE].

## 5) Audit log
- **Perche trasversale**: senza tracciamento e difficile capire errori/rettifiche.
- **Aree coinvolte**: tutte.
- **Regole**:
  - Loggare create/update/delete su entita critiche [RACCOMANDAZIONE].
  - Loggare import/rettifiche autisti e export PDF [RACCOMANDAZIONE].
  - Conservare before/after per operazioni sensibili [RACCOMANDAZIONE].

## 6) Sicurezza
- **Perche trasversale**: ogni modulo accede a dati operativi/economici.
- **Aree coinvolte**: tutte.
- **Regole**:
  - Enforcement permessi server-side (non solo UI) [RACCOMANDAZIONE].
  - Segregare area autisti da area admin [CONFERMATO come esigenza + RACCOMANDAZIONE].
  - Trattare API key/secret fuori dal client [RACCOMANDAZIONE].

## 7) Navigazione verso il mezzo
- **Perche trasversale**: la targa e il principale pivot informativo.
- **Aree coinvolte**: Flotta, Operativita, Magazzino (viste derivate), Analisi, Autisti Inbox.
- **Regole**:
  - Ogni record targa-correlato deve avere link al Dossier Mezzo [RACCOMANDAZIONE].
  - Mantenere una route dossier canonica + alias compatibili temporanei [RACCOMANDAZIONE].

## 8) Collegamenti tra moduli
- **Perche trasversale**: flussi reali attraversano moduli diversi (es. ordine -> inventario -> dossier).
- **Aree coinvolte**: Operativita, Magazzino, Dossier, Centro Controllo.
- **Regole**:
  - Niente duplicazioni funzionali tra route diverse [RACCOMANDAZIONE].
  - CTA primarie cross-modulo visibili e consistenti [RACCOMANDAZIONE].
  - Tracciare chiaramente writer e reader per ogni dataset [RACCOMANDAZIONE].

## 9) Report settimanali/mensili
- **Perche trasversale**: KPI e trend servono a pianificazione e controllo costi.
- **Aree coinvolte**: Centro di Controllo, Analisi, Flotta, Autisti Inbox.
- **Regole**:
  - Definire report canonici (settimanale operativo, mensile economico) [RACCOMANDAZIONE].
  - Riutilizzare dati gia presenti (no doppio inserimento) [RACCOMANDAZIONE].
  - Evidenziare dataset con qualita incerta [DA VERIFICARE].

## 10) Gestione documentale
- **Perche trasversale**: documenti influenzano dossier, costi, acquisti, analisi.
- **Aree coinvolte**: IA&Documenti, Dossier, Analisi, CapoCosti, Acquisti.
- **Regole**:
  - Conservare provenienza (`sourceKey/sourceDocId/sourceType`) [RACCOMANDAZIONE].
  - Gestire path Storage legacy in lettura compatibile [RACCOMANDAZIONE].
  - Normalizzare categorie documento [RACCOMANDAZIONE].

## 11) Costi e dati sensibili
- **Perche trasversale**: presenti in Dossier, CapoCosti, Analisi e documenti IA.
- **Aree coinvolte**: Flotta/Dossier, Analisi, Operativita.
- **Regole**:
  - Accesso per permesso esplicito (least privilege) [RACCOMANDAZIONE].
  - Chiarezza tra dato operativo e dato economico [RACCOMANDAZIONE].
  - Tracciabilita delle modifiche costo/preventivo [RACCOMANDAZIONE].

---

## Punti aperti prioritari
1. Stream eventi autisti canonico unico [DA VERIFICARE].
2. Contratto definitivo allegati preventivi [DA VERIFICARE].
3. Permission matrix applicata end-to-end (route + data) [DA VERIFICARE].
