# Indice report - Mappa NEXT, flussi dati e Autisti

Data: 2026-05-07

Cartella creata per consultazione rapida. Gli originali non sono stati spostati o cancellati.

## Report nella cartella

| N | File | Tipo | Scopo | Origine |
|---|---|---|---|---|
| 01 | `01_AUDIT_REALE_MODULI_NEXT_COLLEZIONI_FLUSSI.md` | copia audit precedente | Inventario moduli NEXT, collezioni, reader/writer e flussi | `docs/audit/AUDIT_REALE_MODULI_NEXT_COLLEZIONI_FLUSSI_2026-05-07.md` |
| 02 | `02_DATA_CONTRACT_REALE_NEXT_FIREBASE.md` | copia audit precedente | Data contract reale dei writer NEXT verificati | `docs/data/DATA_CONTRACT_REALE_NEXT_FIREBASE_2026-05-07.md` |
| 03 | `03_DIAGRAMMI_FLUSSI_DATI_NEXT.md` | copia audit precedente | Diagrammi generali dei flussi dati NEXT | `docs/architecture/DIAGRAMMI_FLUSSI_DATI_NEXT_2026-05-07.md` |
| 04 | `04_AUDIT_CHIUSURA_DA_VERIFICARE_NEXT.md` | nuovo | Chiusura dei punti `DA VERIFICARE`, `NON LETTO`, `DEDOTTO` e rischi residui | questo audit |
| 05 | `05_AUDIT_AUTISTI_MADRE_NEXT_IMPORT_DEFINITIVO.md` | nuovo | Mappa Autisti madre vs NEXT e cosa resta per import definitivo | questo audit |
| 06 | `06_DIAGRAMMI_AUTISTI_E_PUNTI_APERTI.md` | nuovo | Diagrammi Mermaid Autisti, Archivista e rischi residui | questo audit |
| 07 | `07_SINTESI_OPERATIVA_PER_GIUSEPPE.md` | nuovo | Sintesi operativa leggibile in ordine decisionale | questo audit |
| 08 | `08_AUDIT_FIRESTORE_STORAGE_RULES_NEXT.md` | nuovo | Audit sola lettura di Firestore rules, Storage rules, Firebase config e impatto sulla NEXT | questo audit |

## Ordine consigliato di lettura

1. `07_SINTESI_OPERATIVA_PER_GIUSEPPE.md`
2. `04_AUDIT_CHIUSURA_DA_VERIFICARE_NEXT.md`
3. `08_AUDIT_FIRESTORE_STORAGE_RULES_NEXT.md`
4. `05_AUDIT_AUTISTI_MADRE_NEXT_IMPORT_DEFINITIVO.md`
5. `06_DIAGRAMMI_AUTISTI_E_PUNTI_APERTI.md`
6. `01_AUDIT_REALE_MODULI_NEXT_COLLEZIONI_FLUSSI.md`
7. `02_DATA_CONTRACT_REALE_NEXT_FIREBASE.md`
8. `03_DIAGRAMMI_FLUSSI_DATI_NEXT.md`

## Note di affidabilita

Stati usati nei report: `DIMOSTRATO`, `DOCUMENTATO`, `DEDOTTO`, `DA VERIFICARE`, `NON PRESENTE`, `NON LETTO`.

Questo audit non ha modificato runtime, reader, writer, CSS, route, dati, rules, build o test.

`08_AUDIT_FIRESTORE_STORAGE_RULES_NEXT.md` va letto quando si lavora su sicurezza, Auth, Firestore, Storage, writer NEXT o upload file. E' sola lettura e non modifica rules.
