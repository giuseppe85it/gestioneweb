# CONTINUITY REPORT - Autosuggest targhe IA interna

## Contesto
Il sottosistema IA interno disponeva gia di:
- scaffolding isolato sotto `/next/ia/interna*`;
- preview report targa in sola lettura;
- archivio artifact locale isolato;
- chat interna controllata mock;
- checklist unica IA come fonte di verita operativa.

Il punto debole residuo del use case reale era la ricerca targa troppo libera, con rischio di digitazioni parziali o ambigue non sufficientemente guidate.

## Stato raggiunto
- La pagina `/next/ia/interna` legge ora il catalogo mezzi reale dal layer anagrafico NEXT in sola lettura.
- La UI mostra autosuggest targhe mentre si scrive.
- L'utente puo selezionare esplicitamente un mezzo reale prima di avviare la preview.
- La preview parte solo da mezzo selezionato o da match esatto.
- I casi di nessun match, match parziale e match ambiguo sono esplicitati con messaggi chiari in italiano.

## Decisioni operative fissate
- Riutilizzare il layer `D01` gia esistente invece di introdurre nuove letture raw.
- Tenere il lookup locale e reversibile, con filtro client-side leggero e nessuna scrittura.
- Non intrecciare nello stesso task il riallineamento della chat mock all'autosuggest.

## Prossimo passo coerente
- Valutare in task separato se allineare anche la chat mock al riconoscimento targhe del nuovo lookup locale.
- Mantenere la preview report confinata ai layer NEXT read-only gia verificati.

## Vincoli da mantenere
- Tutti i testi visibili devono restare in italiano.
- Ogni futuro task IA deve aggiornare `docs/product/CHECKLIST_IA_INTERNA.md`.
- Nessuna scrittura su dataset business.
- Nessun riuso runtime di backend IA/PDF legacy.
