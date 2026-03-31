# CHANGE REPORT - Home NEXT read-only parity

## Data
- 2026-03-30 19:58

## Tipo task
- patch

## Obiettivo
- Riallineare il modulo `Home` della NEXT ai dati reali della madre, eliminando le persistenze clone-only locali e mantenendo il comportamento read-only esplicito.

## File modificati
- `src/next/NextCentroControlloPage.tsx`
- `src/next/components/NextHomeAutistiEventoModal.tsx`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/domain/nextAutistiDomain.ts`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/MATRICE_ESECUTIVA_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/audit/BACKLOG_HOME_EXECUTION.md`
- `docs/change-reports/2026-03-30_1958_home-next-readonly-parity.md`
- `docs/continuity-reports/2026-03-30_1958_continuity_home-next-readonly-parity.md`

## Riassunto modifiche
- Rimossa dalla `Home` la persistenza locale clone-only di alert, prenotazioni, pre-collaudi, revisioni e luogo rimorchio.
- Riallineata la lettura D10 ai dataset reali della madre senza overlay locali `nextHomeCloneState`.
- Riallineata la lettura D03 della `Home` alla sola fonte madre, senza overlay storage locali o segnali clone-only.
- Rimossi dalla UI della `Home` i metadati extra `D03 autisti`, assenti nella madre.
- Aggiornata la documentazione ufficiale con stato finale del modulo `APERTO`.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Migliore fedelta read-only della `Home` rispetto alla madre.
- Nessuna riapertura di scritture business reali.
- Riduzione della dipendenza da logiche clone-only non promotibili.

## Rischio modifica
- ELEVATO

## Moduli impattati
- `Home`
- `Centro di Controllo` solo per il domain condiviso D10

## Contratti dati toccati?
- PARZIALE

## Punto aperto collegato?
- NO

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- home

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Il modulo resta `APERTO`: le azioni che nella madre scrivono davvero restano bloccate nel clone read-only.
- `nextCentroControlloDomain` e `nextAutistiDomain` sono condivisi: la patch evita scritture clone-only della `Home`, ma va ricontrollata se altri moduli iniziano a dipendere da questi path con aspettative diverse.

## Build/Test eseguiti
- DA ESEGUIRE

## Commit hash
- NON ESEGUITO

## Stato finale
- PARZIALE
