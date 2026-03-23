# CONTINUITY REPORT - IA interna / chat conversazionale / artifact documento

## Contesto generale
- Il progetto resta nella fase clone read-only della NEXT con madre intoccabile.
- Il sottosistema IA interno e gia backend-first con fallback locale, artifact dedicati e repo understanding controllato.

## Modulo/area su cui si stava lavorando
- overview `/next/ia/interna`
- esperienza conversazionale della chat interna
- flusso report -> artifact -> anteprima documento

## Stato attuale
- La chat appare ora piu simile a un assistente interno del gestionale: input multilinea, thread piu pulito e riferimenti riapribili.
- Quando un report e pronto, il contenuto lungo non resta piu nel thread: viene aperto in modale documento e salvato come artifact IA.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- chat backend-first controllata
- artifact IA dedicati
- repo understanding controllato
- preview documento modale per i report della chat

## Prossimo step di migrazione
- valutare un export documento/PDF piu strutturato nel solo perimetro IA, senza toccare dati business o backend legacy

## Moduli impattati
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internal-ai.css

## Contratti dati coinvolti
- nessun nuovo contratto business
- riuso dei contratti artifact/report gia esistenti

## Ultime modifiche eseguite
- Input chat trasformato in textarea naturale con invio controllato.
- Thread messaggi reso piu leggibile e meno tecnico.
- Report pronti salvati come artifact IA e aperti in modale documento.
- Archivio artifact e overview allineati alla nuova anteprima documento.

## File coinvolti
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internal-ai.css
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Decisioni gia prese
- I report strutturati non devono piu essere riversati come muro di testo nella chat.
- La pagina IA deve restare conversazionale senza perdere fallback, traceability e guard rail esistenti.

## Vincoli da non rompere
- madre intoccabile
- nessuna scrittura business
- nessun segreto lato client
- nessun backend legacy come canale canonico
- testi visibili in italiano

## Parti da verificare
- eventuale passaggio futuro da export testo a documento/PDF IA dedicato
- opportunita di ridurre ulteriormente i blocchi tecnici secondari fuori dalla chat

## Rischi aperti
- la preview documento resta oggi testuale, quindi non sostituisce ancora un vero layout PDF
- l'auto-salvataggio artifact puo produrre copie multiple se l'utente salva manualmente un report gia archiviato

## Punti da verificare collegati
- docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md

## Prossimo passo consigliato
- consolidare il flusso documento preview anche per eventuali sintesi server-side o export controllati, restando nel perimetro IA dedicato

## Cosa NON fare nel prossimo task
- non introdurre writer business
- non agganciare il legacy come backend canonico
- non esporre segreti lato client

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- docs/STATO_ATTUALE_PROGETTO.md
- AGENTS.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
