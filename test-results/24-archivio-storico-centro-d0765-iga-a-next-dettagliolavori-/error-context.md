# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 24-archivio-storico-centro-controllo.spec.ts >> 14 — click 'Apri dettaglio' su Lavori → naviga a /next/dettagliolavori/
- Location: tests\e2e\24-archivio-storico-centro-controllo.spec.ts:236:1

# Error details

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('.archivio-row-open-btn').first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic:
    - complementary "Navigazione globale NEXT":
      - generic:
        - generic:
          - img "Gestione e Manutenzione"
          - generic:
            - generic: Gestione e Manutenzione
            - generic: Centrale operativa
        - button "Chiudi menu principale"
      - navigation "Menu moduli NEXT":
        - generic:
          - button "PRINCIPALE" [expanded]:
            - generic: PRINCIPALE
            - generic: "-"
          - generic:
            - link "Dashboard":
              - /url: /next
              - generic: Dashboard
            - link "Alert":
              - /url: /next/centro-controllo
              - generic: Alert
            - link "Segnalazioni":
              - /url: /next/autisti-inbox/segnalazioni
              - generic: Segnalazioni
        - generic:
          - button "FLOTTA" [expanded]:
            - generic: FLOTTA
            - generic: "-"
          - generic:
            - link "Scadenze Collaudi":
              - /url: /next/scadenze-collaudi
              - generic: Scadenze Collaudi
            - link "Dossier mezzo":
              - /url: /next/dossiermezzi
              - generic: Dossier mezzo
        - generic:
          - button "OPERATIVITA'" [expanded]:
            - generic: OPERATIVITA'
            - generic: "-"
          - generic:
            - link "Lavori":
              - /url: /next/lavori-da-eseguire
              - generic: Lavori
            - link "Manutenzioni":
              - /url: /next/manutenzioni
              - generic: Manutenzioni
        - generic:
          - button "MAGAZZINO" [expanded]:
            - generic: MAGAZZINO
            - generic: "-"
          - generic:
            - link "Magazzino":
              - /url: /next/magazzino
              - generic: Magazzino
            - link "Materiali da ordinare":
              - /url: /next/materiali-da-ordinare
              - generic: Materiali da ordinare
            - link "Attrezzature cantieri":
              - /url: /next/attrezzature-cantieri
              - generic: Attrezzature cantieri
            - link "Euromecc":
              - /url: /next/euromecc
              - generic: Euromecc
        - generic:
          - button "ANAGRAFICHE" [expanded]:
            - generic: ANAGRAFICHE
            - generic: "-"
          - generic:
            - link "Anagrafiche":
              - /url: /next/anagrafiche
              - generic: Anagrafiche
        - generic:
          - button "CISTERNA" [expanded]:
            - generic: CISTERNA
            - generic: "-"
          - generic:
            - link "Cisterna Caravate":
              - /url: /next/cisterna
              - generic: Cisterna Caravate
        - generic:
          - button "IA" [expanded]:
            - generic: IA
            - generic: "-"
          - generic:
            - link "Libretto":
              - /url: /next/ia/libretto
              - generic: Libretto
            - link "Documenti":
              - /url: /next/ia/documenti
              - generic: Documenti
            - link "Copertura libretti":
              - /url: /next/ia/copertura-libretti
              - generic: Copertura libretti
            - link "Export libretti":
              - /url: /next/libretti-export
              - generic: Export libretti
        - generic:
          - button "AUTISTI" [expanded]:
            - generic: AUTISTI
            - generic: "-"
          - generic:
            - link "App Autisti":
              - /url: /next/autisti
              - generic: App Autisti
            - link "Autisti Inbox":
              - /url: /next/autisti-inbox
              - generic: Autisti Inbox
            - link "Autisti Admin":
              - /url: /next/autisti-admin
              - generic: Autisti Admin
        - generic:
          - button "GESTIONE" [expanded]:
            - generic: GESTIONE
            - generic: "-"
          - generic:
            - link "Area capo":
              - /url: /next/capo/mezzi
              - generic: Area capo
      - generic: v2.4 · GestioneManutenzione
  - generic [ref=e4]:
    - button "Apri menu principale" [ref=e5] [cursor=pointer]
    - main [ref=e10]:
      - generic [ref=e12]:
        - generic [ref=e13]:
          - button "Torna a Gestione Operativa" [ref=e14] [cursor=pointer]
          - heading "Centro Controllo" [level=1] [ref=e15]
          - paragraph [ref=e16]: Monitoraggio manutenzioni, rifornimenti e flussi autisti (segnalazioni, controlli, richieste).
        - tablist [ref=e17]:
          - tab "Sinottica flotta" [ref=e18] [cursor=pointer]
          - tab "Archivio storico" [selected] [ref=e19] [cursor=pointer]
        - generic [ref=e20]:
          - region "Filtri archivio" [ref=e21]:
            - generic [ref=e22] [cursor=pointer]:
              - generic [ref=e23]: Autista
              - combobox "Autista" [ref=e24]:
                - option "Tutti" [selected]
                - option "ANDREA SCALAMATO"
                - option "DAF ITALIA"
                - option "DANIELE LIVI"
                - option "ELTON SELIMI"
                - option "FILIPPO MARTINELLI"
                - option "GIUSEPPE MILIO"
                - option "IVAN ATTARDI"
                - option "Milio"
                - option "milio"
                - option "MILIO"
                - option "ORLANDO BUTTI"
                - option "PIERO LAURO"
                - option "RICCARDO FENDERICO"
                - option "SANDRO CALABRESE"
                - option "SCIURBA"
                - option "sciurba"
                - option "utente"
            - generic [ref=e25] [cursor=pointer]:
              - generic [ref=e26]: Targa
              - combobox "Targa" [ref=e27]:
                - option "Tutte" [selected]
                - option "TI113417"
                - option "TI136914"
                - option "TI178456"
                - option "TI229717"
                - option "TI233827"
                - option "TI239045"
                - option "TI239279"
                - option "TI279216"
                - option "TI280132"
                - option "TI282780"
                - option "TI285195"
                - option "TI285217"
                - option "TI285997"
                - option "TI287110"
                - option "TI298409"
                - option "TI313387"
                - option "TI315407"
                - option "TI324623"
                - option "TI324633"
                - option "TI334558"
                - option "TI81027"
                - option "TI84069"
                - option "TI84822"
                - option "TI85688"
            - generic [ref=e28]:
              - img [ref=e29]
              - generic [ref=e32]: Cerca
              - searchbox "Cerca" [ref=e33]
            - button "Periodo Tutto lo storico" [ref=e35] [cursor=pointer]:
              - generic [ref=e36]: Periodo
              - generic [ref=e37]: Tutto lo storico
            - generic [ref=e38]:
              - generic [ref=e39]: 1 filtro attivo
              - button "azzera" [ref=e40] [cursor=pointer]
            - generic [ref=e41]:
              - generic [ref=e42]:
                - strong [ref=e43]: "121"
                - text: risultati
              - button "Anteprima PDF" [ref=e44] [cursor=pointer]
          - tablist [ref=e45]:
            - tab "Lavori 18" [selected] [ref=e46] [cursor=pointer]:
              - text: Lavori
              - generic [ref=e47]: "18"
            - tab "Manutenzioni 56" [ref=e48] [cursor=pointer]:
              - text: Manutenzioni
              - generic [ref=e49]: "56"
            - tab "Segnalazioni 35" [ref=e50] [cursor=pointer]:
              - text: Segnalazioni
              - generic [ref=e51]: "35"
            - tab "Richieste 12" [ref=e52] [cursor=pointer]:
              - text: Richieste
              - generic [ref=e53]: "12"
            - group "Densità lista" [ref=e54]:
              - button "Comoda" [ref=e55] [cursor=pointer]
              - button "Compatta" [ref=e56] [cursor=pointer]
          - generic [ref=e57]:
            - generic [ref=e58]:
              - generic [ref=e59]:
                - generic [ref=e60]:
                  - strong [ref=e61]: Oggi
                  - text: · martedì 12 maggio
                - generic [ref=e63]: 4 record
              - generic [ref=e64]:
                - article [ref=e65] [cursor=pointer]:
                  - generic [ref=e66]:
                    - generic [ref=e67]: 12 mag
                    - generic [ref=e68]: "2026"
                    - generic [ref=e69]: 02:00
                  - generic "TI178456 · motrice 3 assi" [ref=e70]
                  - generic [ref=e71]:
                    - generic [ref=e72]:
                      - generic [ref=e73]: TI178456
                      - generic [ref=e74]: Alta urgenza
                      - button "Apri menu riga" [ref=e76]:
                        - img [ref=e77]
                      - button "Espandi/comprimi dettagli" [ref=e81]:
                        - img [ref=e82]
                    - generic [ref=e84]: "Segnalazione: elettrico - Alternatore"
                    - generic [ref=e86]:
                      - text: Aperto da
                      - strong [ref=e87]: ORLANDO BUTTI
                    - generic [ref=e90]:
                      - generic [ref=e92]: Aperta
                      - generic [ref=e93]: 12.05 · 02:00
                - generic [ref=e95]:
                  - generic [ref=e96]: Descrizione
                  - generic [ref=e97]: "Segnalazione: elettrico - Alternatore"
              - article [ref=e99] [cursor=pointer]:
                - generic [ref=e100]:
                  - generic [ref=e101]: 12 mag
                  - generic [ref=e102]: "2026"
                  - generic [ref=e103]: 02:00
                - generic "TI315407 · motrice 3 assi" [ref=e104]
                - generic [ref=e105]:
                  - generic [ref=e106]:
                    - generic [ref=e107]: TI315407
                    - generic [ref=e108]: Media
                    - button "Apri menu riga" [ref=e110]:
                      - img [ref=e111]
                    - button "Espandi/comprimi dettagli" [ref=e115]:
                      - img [ref=e116]
                  - generic [ref=e118]: "Segnalazione: elettrico - Errore guasto ventola."
                  - generic [ref=e120]:
                    - text: Aperto da
                    - strong [ref=e121]: ELTON SELIMI
                  - generic [ref=e124]:
                    - generic [ref=e126]: Aperta
                    - generic [ref=e127]: 12.05 · 02:00
              - article [ref=e129] [cursor=pointer]:
                - generic [ref=e130]:
                  - generic [ref=e131]: 12 mag
                  - generic [ref=e132]: "2026"
                  - generic [ref=e133]: 02:00
                - generic "TI84822 · semirimorchio asse sterzante" [ref=e134]
                - generic [ref=e135]:
                  - generic [ref=e136]:
                    - generic [ref=e137]: TI84822
                    - generic [ref=e138]: Media
                    - button "Apri menu riga" [ref=e140]:
                      - img [ref=e141]
                    - button "Espandi/comprimi dettagli" [ref=e145]:
                      - img [ref=e146]
                  - generic [ref=e148]: "Segnalazione: altro - Guarnizioni tubi e cisterna consumate perdono tanto"
                  - generic [ref=e149]:
                    - generic [ref=e150]:
                      - text: Aperto da
                      - strong [ref=e151]: ORLANDO BUTTI
                    - generic [ref=e152]: ·
                    - generic [ref=e153]:
                      - text: Eseguito da
                      - strong [ref=e154]: Milio
                  - generic [ref=e156]:
                    - generic [ref=e157]:
                      - generic [ref=e159]: Aperta
                      - generic [ref=e160]: 12.05 · 02:00
                    - generic [ref=e162]:
                      - generic [ref=e164]: Chiusa
                      - generic [ref=e165]: 12.05 · 17:11
              - article [ref=e167] [cursor=pointer]:
                - generic [ref=e168]:
                  - generic [ref=e169]: 12 mag
                  - generic [ref=e170]: "2026"
                  - generic [ref=e171]: 02:00
                - generic "TI85688 · semirimorchio asse sterzante" [ref=e172]
                - generic [ref=e173]:
                  - generic [ref=e174]:
                    - generic [ref=e175]: TI85688
                    - generic [ref=e176]: Alta urgenza
                    - button "Apri menu riga" [ref=e178]:
                      - img [ref=e179]
                    - button "Espandi/comprimi dettagli" [ref=e183]:
                      - img [ref=e184]
                  - generic [ref=e186]: cono posteriore crepata (vecchia saldatura fatta da Righetto)
                  - generic [ref=e188]:
                    - text: Aperto da
                    - strong [ref=e189]: utente
                  - generic [ref=e192]:
                    - generic [ref=e194]: Aperta
                    - generic [ref=e195]: 12.05 · 02:00
            - generic [ref=e196]:
              - generic [ref=e197]:
                - generic [ref=e198]:
                  - strong [ref=e199]: maggio
                  - text: · 2026
                - generic [ref=e201]: 1 record
              - article [ref=e203] [cursor=pointer]:
                - generic [ref=e204]:
                  - generic [ref=e205]: 8 mag
                  - generic [ref=e206]: "2026"
                  - generic [ref=e207]: 02:00
                - generic "TI298409 · trattore stradale" [ref=e208]
                - generic [ref=e209]:
                  - generic [ref=e210]:
                    - generic [ref=e211]: TI298409
                    - generic [ref=e212]: Media
                    - button "Apri menu riga" [ref=e214]:
                      - img [ref=e215]
                    - button "Espandi/comprimi dettagli" [ref=e219]:
                      - img [ref=e220]
                  - generic [ref=e222]: "Segnalazione: gomme - 4 gomme di trazione usurate, quasi finite. Da sostituire"
                  - generic [ref=e224]:
                    - text: Aperto da
                    - strong [ref=e225]: RICCARDO FENDERICO
                  - generic [ref=e228]:
                    - generic [ref=e230]: Aperta
                    - generic [ref=e231]: 08.05 · 02:00
            - generic [ref=e232]:
              - generic [ref=e233]:
                - generic [ref=e234]:
                  - strong [ref=e235]: aprile
                  - text: · 2026
                - generic [ref=e237]: 11 record
              - article [ref=e239] [cursor=pointer]:
                - generic [ref=e240]:
                  - generic [ref=e241]: 30 apr
                  - generic [ref=e242]: "2026"
                  - generic [ref=e243]: 02:00
                - generic "TI315407 · motrice 3 assi" [ref=e244]
                - generic [ref=e245]:
                  - generic [ref=e246]:
                    - generic [ref=e247]: TI315407
                    - generic [ref=e248]: Media
                    - button "Apri menu riga" [ref=e250]:
                      - img [ref=e251]
                    - button "Espandi/comprimi dettagli" [ref=e255]:
                      - img [ref=e256]
                  - generic [ref=e258]: "Segnalazione: motore - Spia guasto ventola."
                  - generic [ref=e260]:
                    - text: Aperto da
                    - strong [ref=e261]: ELTON SELIMI
                  - generic [ref=e264]:
                    - generic [ref=e266]: Aperta
                    - generic [ref=e267]: 30.04 · 02:00
              - article [ref=e269] [cursor=pointer]:
                - generic [ref=e270]:
                  - generic [ref=e271]: 29 apr
                  - generic [ref=e272]: "2026"
                  - generic [ref=e273]: 02:00
                - generic "TI233827 · motrice 4 assi" [ref=e274]
                - generic [ref=e275]:
                  - generic [ref=e276]:
                    - generic [ref=e277]: TI233827
                    - generic [ref=e278]: Alta urgenza
                    - button "Apri menu riga" [ref=e280]:
                      - img [ref=e281]
                    - button "Espandi/comprimi dettagli" [ref=e285]:
                      - img [ref=e286]
                  - generic [ref=e288]: "Segnalazione: motore - Motore si è spento in autostrada e non parte più."
                  - generic [ref=e290]:
                    - text: Aperto da
                    - strong [ref=e291]: ELTON SELIMI
                  - generic [ref=e294]:
                    - generic [ref=e296]: Aperta
                    - generic [ref=e297]: 29.04 · 02:00
              - article [ref=e299] [cursor=pointer]:
                - generic [ref=e300]:
                  - generic [ref=e301]: 24 apr
                  - generic [ref=e302]: "2026"
                  - generic [ref=e303]: 02:00
                - generic "TI298409 · trattore stradale" [ref=e304]
                - generic [ref=e305]:
                  - generic [ref=e306]:
                    - generic [ref=e307]: TI298409
                    - generic [ref=e308]: Media
                    - button "Apri menu riga" [ref=e310]:
                      - img [ref=e311]
                    - button "Espandi/comprimi dettagli" [ref=e315]:
                      - img [ref=e316]
                  - generic [ref=e318]: "Segnalazione: altro - Perdita liquido raffreddamento da un manicotto. Vedi foto"
                  - generic [ref=e320]:
                    - text: Aperto da
                    - strong [ref=e321]: RICCARDO FENDERICO
                  - generic [ref=e324]:
                    - generic [ref=e326]: Aperta
                    - generic [ref=e327]: 24.04 · 02:00
              - article [ref=e329] [cursor=pointer]:
                - generic [ref=e330]:
                  - generic [ref=e331]: 23 apr
                  - generic [ref=e332]: "2026"
                  - generic [ref=e333]: 02:00
                - generic "TI324633 · trattore stradale" [ref=e334]
                - generic [ref=e335]:
                  - generic [ref=e336]:
                    - generic [ref=e337]: TI324633
                    - generic [ref=e338]: Bassa
                    - button "Apri menu riga" [ref=e340]:
                      - img [ref=e341]
                    - button "Espandi/comprimi dettagli" [ref=e345]:
                      - img [ref=e346]
                  - generic [ref=e348]: "Segnalazione: elettrico - Tachigrafo sballato"
                  - generic [ref=e350]:
                    - text: Aperto da
                    - strong [ref=e351]: DANIELE LIVI
                  - generic [ref=e354]:
                    - generic [ref=e356]: Aperta
                    - generic [ref=e357]: 23.04 · 02:00
              - article [ref=e359] [cursor=pointer]:
                - generic [ref=e360]:
                  - generic [ref=e361]: 21 apr
                  - generic [ref=e362]: "2026"
                  - generic [ref=e363]: 02:00
                - generic "TI233827 · motrice 4 assi" [ref=e364]
                - generic [ref=e365]:
                  - generic [ref=e366]:
                    - generic [ref=e367]: TI233827
                    - generic [ref=e368]: Media
                    - button "Apri menu riga" [ref=e370]:
                      - img [ref=e371]
                    - button "Espandi/comprimi dettagli" [ref=e375]:
                      - img [ref=e376]
                  - generic [ref=e378]: "Segnalazione: motore - Perdita potenza. Motore in protezione."
                  - generic [ref=e380]:
                    - text: Aperto da
                    - strong [ref=e381]: ELTON SELIMI
                  - generic [ref=e384]:
                    - generic [ref=e386]: Aperta
                    - generic [ref=e387]: 21.04 · 02:00
              - article [ref=e389] [cursor=pointer]:
                - generic [ref=e390]:
                  - generic [ref=e391]: 21 apr
                  - generic [ref=e392]: "2026"
                  - generic [ref=e393]: 02:00
                - generic "TI313387 · motrice 2 assi" [ref=e394]
                - generic [ref=e395]:
                  - generic [ref=e396]:
                    - generic [ref=e397]: TI313387
                    - generic [ref=e398]: Media
                    - button "Apri menu riga" [ref=e400]:
                      - img [ref=e401]
                    - button "Espandi/comprimi dettagli" [ref=e405]:
                      - img [ref=e406]
                  - generic [ref=e408]: "Segnalazione: idraulico - Perdita olio freni posteriore lato guida"
                  - generic [ref=e409]:
                    - generic [ref=e410]:
                      - text: Aperto da
                      - strong [ref=e411]: ORLANDO BUTTI
                    - generic [ref=e412]: ·
                    - generic [ref=e413]:
                      - text: Eseguito da
                      - strong [ref=e414]: sciurba
                  - generic [ref=e416]:
                    - generic [ref=e417]:
                      - generic [ref=e419]: Aperta
                      - generic [ref=e420]: 21.04 · 02:00
                    - generic [ref=e422]:
                      - generic [ref=e424]: Chiusa
                      - generic [ref=e425]: 22.04 · 18:58
              - article [ref=e427] [cursor=pointer]:
                - generic [ref=e428]:
                  - generic [ref=e429]: 21 apr
                  - generic [ref=e430]: "2026"
                  - generic [ref=e431]: 02:00
                - generic "TI324623 · trattore stradale" [ref=e432]
                - generic [ref=e433]:
                  - generic [ref=e434]:
                    - generic [ref=e435]: TI324623
                    - generic [ref=e436]: Media
                    - button "Apri menu riga" [ref=e438]:
                      - img [ref=e439]
                    - button "Espandi/comprimi dettagli" [ref=e443]:
                      - img [ref=e444]
                  - generic [ref=e446]: "Segnalazione: altro - Climatizzatore non funziona."
                  - generic [ref=e447]:
                    - generic [ref=e448]:
                      - text: Aperto da
                      - strong [ref=e449]: IVAN ATTARDI
                    - generic [ref=e450]: ·
                    - generic [ref=e451]:
                      - text: Eseguito da
                      - strong [ref=e452]: DAF ITALIA
                  - generic [ref=e454]:
                    - generic [ref=e455]:
                      - generic [ref=e457]: Aperta
                      - generic [ref=e458]: 21.04 · 02:00
                    - generic [ref=e460]:
                      - generic [ref=e462]: Chiusa
                      - generic [ref=e463]: 22.04 · 18:58
              - article [ref=e465] [cursor=pointer]:
                - generic [ref=e466]:
                  - generic [ref=e467]: 8 apr
                  - generic [ref=e468]: "2026"
                  - generic [ref=e469]: 02:00
                - generic "TI285997 · pianale" [ref=e470]
                - generic [ref=e471]:
                  - generic [ref=e472]:
                    - generic [ref=e473]: TI285997
                    - generic [ref=e474]: Bassa
                    - button "Apri menu riga" [ref=e476]:
                      - img [ref=e477]
                    - button "Espandi/comprimi dettagli" [ref=e481]:
                      - img [ref=e482]
                  - generic [ref=e484]: "Segnalazione: elettrico - Fanalino anteriore SX non funziona."
                  - generic [ref=e485]:
                    - generic [ref=e486]:
                      - text: Aperto da
                      - strong [ref=e487]: IVAN ATTARDI
                    - generic [ref=e488]: ·
                    - generic [ref=e489]:
                      - text: Eseguito da
                      - strong [ref=e490]: MILIO
                  - generic [ref=e492]:
                    - generic [ref=e493]:
                      - generic [ref=e495]: Aperta
                      - generic [ref=e496]: 08.04 · 02:00
                    - generic [ref=e498]:
                      - generic [ref=e500]: Chiusa
                      - generic [ref=e501]: 14.04 · 16:25
              - article [ref=e503] [cursor=pointer]:
                - generic [ref=e504]:
                  - generic [ref=e505]: 7 apr
                  - generic [ref=e506]: "2026"
                  - generic [ref=e507]: 02:00
                - generic "TI285217 · semirimorchio asse sterzante" [ref=e508]
                - generic [ref=e509]:
                  - generic [ref=e510]:
                    - generic [ref=e511]: TI285217
                    - generic [ref=e512]: Media
                    - button "Apri menu riga" [ref=e514]:
                      - img [ref=e515]
                    - button "Espandi/comprimi dettagli" [ref=e519]:
                      - img [ref=e520]
                  - generic [ref=e522]: "Segnalazione: altro - Manometro cisterna non funzionante Tubo compressore cisterna da controllare perché sfiata"
                  - generic [ref=e523]:
                    - generic [ref=e524]:
                      - text: Aperto da
                      - strong [ref=e525]: GIUSEPPE MILIO
                    - generic [ref=e526]: ·
                    - generic [ref=e527]:
                      - text: Eseguito da
                      - strong [ref=e528]: Milio
                  - generic [ref=e530]:
                    - generic [ref=e531]:
                      - generic [ref=e533]: Aperta
                      - generic [ref=e534]: 07.04 · 02:00
                    - generic [ref=e536]:
                      - generic [ref=e538]: Chiusa
                      - generic [ref=e539]: 10.04 · 09:37
              - article [ref=e541] [cursor=pointer]:
                - generic [ref=e542]:
                  - generic [ref=e543]: 2 apr
                  - generic [ref=e544]: "2026"
                  - generic [ref=e545]: 02:00
                - generic "TI239279 · trattore stradale" [ref=e546]
                - generic [ref=e547]:
                  - generic [ref=e548]:
                    - generic [ref=e549]: TI239279
                    - generic [ref=e550]: Media
                    - button "Apri menu riga" [ref=e552]:
                      - img [ref=e553]
                    - button "Espandi/comprimi dettagli" [ref=e557]:
                      - img [ref=e558]
                  - generic [ref=e560]: "Controllo KO: PERDITE"
                  - generic [ref=e561]:
                    - generic [ref=e562]:
                      - text: Aperto da
                      - strong [ref=e563]: ANDREA SCALAMATO
                    - generic [ref=e564]: ·
                    - generic [ref=e565]:
                      - text: Eseguito da
                      - strong [ref=e566]: Milio
                  - generic [ref=e568]:
                    - generic [ref=e569]:
                      - generic [ref=e571]: Aperta
                      - generic [ref=e572]: 02.04 · 02:00
                    - generic [ref=e574]:
                      - generic [ref=e576]: Chiusa
                      - generic [ref=e577]: 10.04 · 09:38
              - article [ref=e579] [cursor=pointer]:
                - generic [ref=e580]:
                  - generic [ref=e581]: 1 apr
                  - generic [ref=e582]: "2026"
                  - generic [ref=e583]: 02:00
                - generic "TI280132 · semirimorchio asse sterzante" [ref=e584]
                - generic [ref=e585]:
                  - generic [ref=e586]:
                    - generic [ref=e587]: TI280132
                    - generic [ref=e588]: Alta urgenza
                    - button "Apri menu riga" [ref=e590]:
                      - img [ref=e591]
                    - button "Espandi/comprimi dettagli" [ref=e595]:
                      - img [ref=e596]
                  - generic [ref=e598]: "Controllo KO: GOMME"
                  - generic [ref=e600]:
                    - text: Aperto da
                    - strong [ref=e601]: RICCARDO FENDERICO
                  - generic [ref=e604]:
                    - generic [ref=e606]: Aperta
                    - generic [ref=e607]: 01.04 · 02:00
            - generic [ref=e608]:
              - generic [ref=e609]:
                - generic [ref=e610]:
                  - strong [ref=e611]: marzo
                  - text: · 2026
                - generic [ref=e613]: 2 record
              - article [ref=e615] [cursor=pointer]:
                - generic [ref=e616]:
                  - generic [ref=e617]: 30 mar
                  - generic [ref=e618]: "2026"
                  - generic [ref=e619]: 02:00
                - generic "TI239279 · trattore stradale" [ref=e620]
                - generic [ref=e621]:
                  - generic [ref=e622]:
                    - generic [ref=e623]: TI239279
                    - generic [ref=e624]: Media
                    - button "Apri menu riga" [ref=e626]:
                      - img [ref=e627]
                    - button "Espandi/comprimi dettagli" [ref=e631]:
                      - img [ref=e632]
                  - generic [ref=e634]: "Segnalazione: altro - Tubo 10 metri rotto altri tubi perdono dalle guarnizioni e non da adesso che lo sto' usando scarico poi lascio in magazzino stabio non lo uso più!!"
                  - generic [ref=e635]:
                    - generic [ref=e636]:
                      - text: Aperto da
                      - strong [ref=e637]: ORLANDO BUTTI
                    - generic [ref=e638]: ·
                    - generic [ref=e639]:
                      - text: Eseguito da
                      - strong [ref=e640]: milio
                  - generic [ref=e642]:
                    - generic [ref=e643]:
                      - generic [ref=e645]: Aperta
                      - generic [ref=e646]: 30.03 · 02:00
                    - generic [ref=e648]:
                      - generic [ref=e650]: Chiusa
                      - generic [ref=e651]: 01.04 · 20:08
              - article [ref=e653] [cursor=pointer]:
                - generic [ref=e654]:
                  - generic [ref=e655]: 30 mar
                  - generic [ref=e656]: "2026"
                  - generic [ref=e657]: 02:00
                - generic "TI313387 · motrice 2 assi" [ref=e658]
                - generic [ref=e659]:
                  - generic [ref=e660]:
                    - generic [ref=e661]: TI313387
                    - generic [ref=e662]: Media
                    - button "Apri menu riga" [ref=e664]:
                      - img [ref=e665]
                    - button "Espandi/comprimi dettagli" [ref=e669]:
                      - img [ref=e670]
                  - generic [ref=e672]: "Segnalazione: freni - Freni da controllare"
                  - generic [ref=e673]:
                    - generic [ref=e674]:
                      - text: Aperto da
                      - strong [ref=e675]: ORLANDO BUTTI
                    - generic [ref=e676]: ·
                    - generic [ref=e677]:
                      - text: Eseguito da
                      - strong [ref=e678]: SCIURBA
                  - generic [ref=e680]:
                    - generic [ref=e681]:
                      - generic [ref=e683]: Aperta
                      - generic [ref=e684]: 30.03 · 02:00
                    - generic [ref=e686]:
                      - generic [ref=e688]: Chiusa
                      - generic [ref=e689]: 22.04 · 18:59
```

# Test source

```ts
  153 | }) => {
  154 |   await gotoArchivio(page);
  155 |   await page
  156 |     .locator(".archivio-density-toggle button", { hasText: "Compatta" })
  157 |     .click();
  158 |   await expect(page.locator(".archivio-feed-wrap")).toHaveClass(
  159 |     /is-compact/,
  160 |   );
  161 |   await page
  162 |     .locator(".archivio-density-toggle button", { hasText: "Comoda" })
  163 |     .click();
  164 |   await expect(page.locator(".archivio-feed-wrap")).not.toHaveClass(
  165 |     /is-compact/,
  166 |   );
  167 | });
  168 | 
  169 | test("10 — empty state con filtri restrittivi + click 'Azzera filtri' ripristina", async ({
  170 |   page,
  171 | }) => {
  172 |   await gotoArchivio(page);
  173 |   // Allarga periodo per essere sicuri che la subtab attiva (lavoro)
  174 |   // abbia almeno qualche record prima del filtro restrittivo
  175 |   await page.locator(".archivio-ff-period-trigger").click();
  176 |   await page
  177 |     .locator(".archivio-ff-period-presets button", {
  178 |       hasText: "Tutto lo storico",
  179 |     })
  180 |     .click();
  181 |   const searchInput = page.locator('.archivio-ff-search input[type="search"]');
  182 |   await searchInput.fill("xyznonesiste-archivio-empty");
  183 |   await expect(page.locator(".archivio-empty")).toBeVisible({ timeout: 10000 });
  184 |   await page.locator(".archivio-empty-action").click();
  185 |   await expect(page.locator(".archivio-empty")).toHaveCount(0, {
  186 |     timeout: 5000,
  187 |   });
  188 |   await expect(searchInput).toHaveValue("");
  189 | });
  190 | 
  191 | test("11 — no regressioni Sinottica: torna alla tab Sinottica → Sinottica visibile", async ({
  192 |   page,
  193 | }) => {
  194 |   await gotoArchivio(page);
  195 |   await page
  196 |     .locator(".cc-page-tabs button", { hasText: "Sinottica flotta" })
  197 |     .click();
  198 |   // L'URL deve perdere `?tab=archivio`
  199 |   await expect(page).not.toHaveURL(/tab=archivio/, { timeout: 5000 });
  200 |   await expect(page.locator(".cc-archivio-scope-v1")).toHaveCount(0);
  201 |   // verifica che ci sia il contenuto Sinottica (cc-tabs interna con Report rifornimenti etc.)
  202 |   await expect(
  203 |     page.getByRole("button", { name: "Report rifornimenti", exact: true }),
  204 |   ).toBeVisible({ timeout: 10000 });
  205 | });
  206 | 
  207 | test("13 — foto mezzo: ogni riga rende <img> reale o fallback SVG", async ({
  208 |   page,
  209 | }) => {
  210 |   // PROMPT 30.1: la catena flotta→fotoUrl deve produrre nel DOM una
  211 |   // foto reale (<img>) quando disponibile, oppure un fallback SVG.
  212 |   await gotoArchivio(page);
  213 |   // Allarga periodo per massimizzare le righe disponibili
  214 |   await page.locator(".archivio-ff-period-trigger").click();
  215 |   await page
  216 |     .locator(".archivio-ff-period-presets button", {
  217 |       hasText: "Tutto lo storico",
  218 |     })
  219 |     .click();
  220 |   // Conta le foto: ogni .archivio-row-photo deve avere un figlio
  221 |   // <img> oppure <svg> (no entrambi assenti)
  222 |   const rows = page.locator(".archivio-row-photo");
  223 |   const rowCount: number = await rows.count();
  224 |   if (rowCount === 0) {
  225 |     test.skip(true, "Nessuna riga disponibile per il test foto");
  226 |     return;
  227 |   }
  228 |   for (let i = 0; i < Math.min(rowCount, 5); i += 1) {
  229 |     const photo = rows.nth(i);
  230 |     const hasImg: number = await photo.locator("img").count();
  231 |     const hasSvg: number = await photo.locator("svg").count();
  232 |     expect(hasImg + hasSvg).toBeGreaterThan(0);
  233 |   }
  234 | });
  235 | 
  236 | test("14 — click 'Apri dettaglio' su Lavori → naviga a /next/dettagliolavori/", async ({
  237 |   page,
  238 | }) => {
  239 |   await gotoArchivio(page);
  240 |   await page.locator(".archivio-ff-period-trigger").click();
  241 |   await page
  242 |     .locator(".archivio-ff-period-presets button", {
  243 |       hasText: "Tutto lo storico",
  244 |     })
  245 |     .click();
  246 |   const firstRow = page.locator(".archivio-row").first();
  247 |   const rowCount: number = await firstRow.count();
  248 |   if (rowCount === 0) {
  249 |     test.skip(true, "Nessun lavoro disponibile per il test navigate");
  250 |     return;
  251 |   }
  252 |   await firstRow.click();
> 253 |   await page.locator(".archivio-row-open-btn").first().click();
      |                                                        ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
  254 |   await expect(page).toHaveURL(/\/next\/dettagliolavori\//, { timeout: 10000 });
  255 | });
  256 | 
  257 | test("15 — apertura modale Segnalazione readOnly con badge consultazione", async ({
  258 |   page,
  259 | }) => {
  260 |   await gotoArchivio(page);
  261 |   await page.locator(".archivio-ff-period-trigger").click();
  262 |   await page
  263 |     .locator(".archivio-ff-period-presets button", {
  264 |       hasText: "Tutto lo storico",
  265 |     })
  266 |     .click();
  267 |   await page
  268 |     .locator(".archivio-subtabs .archivio-tab", { hasText: "Segnalazioni" })
  269 |     .click();
  270 |   // Wait robusto: aspetta finche' la prima riga ha type-chip Freni/Gomme/
  271 |   // Elettrico/Altro (presente solo su segnalazioni, NON su lavori). Si evita
  272 |   // il timing dell'aria-selected della tab.
  273 |   const segnRows = page.locator(
  274 |     ".archivio-row:has(.archivio-row-type-chip)",
  275 |   );
  276 |   await expect(segnRows.first()).toBeVisible({ timeout: 15000 });
  277 |   await segnRows.first().locator(".archivio-row-open-btn").click();
  278 |   // Verifica apertura modale (aix-modal e' il selettore esistente)
  279 |   await expect(page.locator(".aix-modal")).toBeVisible({ timeout: 10000 });
  280 |   // Verifica badge readOnly
  281 |   await expect(page.locator(".nhae-readonly-badge")).toBeVisible();
  282 |   await expect(page.locator(".nhae-readonly-badge")).toContainText(
  283 |     /Modalità consultazione/i,
  284 |   );
  285 |   // Verifica assenza bottoni azione (Marca chiusa / CREA LAVORO)
  286 |   await expect(page.locator(".aix-modal").getByText("Marca chiusa")).toHaveCount(0);
  287 |   await expect(page.locator(".aix-modal").getByText("CREA LAVORO")).toHaveCount(0);
  288 | });
  289 | 
  290 | test("16 — click 'Lavoro generato' su Segnalazione → naviga al lavoro", async ({
  291 |   page,
  292 | }) => {
  293 |   await gotoArchivio(page);
  294 |   await page.locator(".archivio-ff-period-trigger").click();
  295 |   await page
  296 |     .locator(".archivio-ff-period-presets button", {
  297 |       hasText: "Tutto lo storico",
  298 |     })
  299 |     .click();
  300 |   await page
  301 |     .locator(".archivio-subtabs .archivio-tab", { hasText: "Segnalazioni" })
  302 |     .click();
  303 |   // Wait sulla prima riga con type-chip (vedi commento test 15)
  304 |   await expect(
  305 |     page.locator(".archivio-row:has(.archivio-row-type-chip)").first(),
  306 |   ).toBeVisible({ timeout: 15000 });
  307 |   // Cerca una riga con step .is-gen (Lavoro generato)
  308 |   const genStep = page.locator(".archivio-tl-step.is-gen.archivio-tl-step-clickable").first();
  309 |   const genCount: number = await genStep.count();
  310 |   if (genCount === 0) {
  311 |     test.skip(true, "Nessuna segnalazione con linkedLavoroId disponibile");
  312 |     return;
  313 |   }
  314 |   await genStep.click();
  315 |   await expect(page).toHaveURL(/\/next\/dettagliolavori\//, { timeout: 10000 });
  316 | });
  317 | 
  318 | test("17 — URL state persiste sub-tab e filtri (back browser)", async ({
  319 |   page,
  320 | }) => {
  321 |   await gotoArchivio(page);
  322 |   // L'URL ora contiene ?tab=archivio
  323 |   await expect(page).toHaveURL(/tab=archivio/);
  324 |   // Cambia sub-tab a Segnalazioni → URL contiene asTab=segnalazione
  325 |   await page
  326 |     .locator(".archivio-subtabs .archivio-tab", { hasText: "Segnalazioni" })
  327 |     .click();
  328 |   await expect(page).toHaveURL(/asTab=segnalazione/, { timeout: 5000 });
  329 |   // Digita query → URL contiene asQ=
  330 |   const searchInput = page.locator('.archivio-ff-search input[type="search"]');
  331 |   await searchInput.fill("freni");
  332 |   await expect(page).toHaveURL(/asQ=freni/, { timeout: 5000 });
  333 | });
  334 | 
  335 | test("18 — Anteprima PDF: click apre modale con preview", async ({
  336 |   page,
  337 | }) => {
  338 |   await gotoArchivio(page);
  339 |   // Allarga periodo per assicurare almeno qualche record
  340 |   await page.locator(".archivio-ff-period-trigger").click();
  341 |   await page
  342 |     .locator(".archivio-ff-period-presets button", {
  343 |       hasText: "Tutto lo storico",
  344 |     })
  345 |     .click();
  346 |   // Wait per almeno una riga lavori (default sub-tab)
  347 |   await expect(page.locator(".archivio-row").first()).toBeVisible({
  348 |     timeout: 15000,
  349 |   });
  350 |   // Click "Anteprima PDF"
  351 |   const pdfBtn = page.locator(".archivio-pdf-btn");
  352 |   await expect(pdfBtn).toBeVisible();
  353 |   await expect(pdfBtn).toBeEnabled();
```