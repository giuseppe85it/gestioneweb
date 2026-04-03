# Continuity Report - 2026-04-03 1740

## Contesto
Task limitato alla shell globale NEXT per chiudere due bug visivi post-patch:
- toggle sidebar non visibile/non riapribile correttamente;
- layout sidebar ancora percepito come overlay su alcune superfici.

## Stato iniziale verificato
- shell globale gia presente in `NextShell.tsx`;
- bug runtime confermati su UX del toggle e percezione del layout su `/next/autisti-admin` e `/next/autisti-inbox`;
- perimetro consentito limitato a `src/next/NextShell.tsx` e `src/next/next-shell.css`, piu tracciabilita documentale.

## Stato finale
- `NextShell.tsx` gestisce ora:
  - toggle interno all'header/sidebar quando aperta;
  - bottone flottante esterno per riapertura quando chiusa.
- `next-shell.css` mantiene la shell come layout a colonne reali e garantisce:
  - nessun overlap tra sidebar e contenuto;
  - piena larghezza contenuto a sidebar chiusa;
  - contrasto visivo corretto del toggle nei due stati.

## Verifiche finali
- `npm run build` -> OK
- runtime locale verificato su:
  - `/next/autisti-admin`
  - `/next/autisti-inbox`
  - `/next/materiali-da-ordinare`
- risultati misurati:
  - open state -> `contentLeft = 328`, `sidebarRight = 328`, toggle visibile dentro l'header sidebar;
  - closed state -> `frameWidth = 0`, contenuto full width, bottone flottante visibile.

## Perimetro preservato
- nessuna modifica a `src/App.tsx`, route o madre;
- nessuna modifica a `src/next/NextHomePage.tsx`;
- nessuna modifica a domain/read model, Firebase, storage o writer;
- nessuna modifica a CSS legacy esterni alla shell.

## Prossimo passo naturale
Audit visivo separato della shell globale su tutte le route figlie di `/next` se si vuole confermare la parity shell completa oltre i tre path verificati in questo task.
