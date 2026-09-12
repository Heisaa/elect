# Riksdagsvalet 2026 – Gissa resultatet ✋🇸🇪

En enkel hemsida där du gissar varje partis andel av rösterna i riksdagsvalet 2026, med en decimal. Summan ligger alltid på 100,0 % – "Övriga" partier beräknas automatiskt som det som blir kvar.

## Funktioner

- **Vertikala staplar** – dra med mus/finger, scrolla för finjustering, eller skriv siffror själv
- **Partimärken** – officiella logotyper där de finns, egna symboler annars
- **Förifyll med 2022 års valresultat** – börja från förra valet och justera
- **Övriga beräknas automatiskt** – det blir aldrig fel summa
- **Ladda ner bild** – resultatet renderas som en delbar PNG
- **Kopiera som text** – formaterad lista, perfekt att klistra in i valvakan

## Partimärken

Badge-märkena byggs som inline-SVG (rosett för S, Ö-blomma för MP, färgchips för övriga).
Om det finns en fil i `logos/` för ett parti (`V.svg`, `C.svg`, `L.svg`, `KD.svg`,
`M.svg`, `SD.svg`, `S.svg`, `MP.svg` eller `.png`-varianter) används den istället – de officiella
logotyperna för V, C, L, KD, M och SD ligger redan där, hämtade från [Wikimedia Commons](https://commons.wikimedia.org).
S-rosen och MP:s Ö-blomma är egna tecknade symboler (de officiella logotyperna är upphovsrättsskyddade
och saknas därför på Commons). Logotyper tillhör respektive parti och används här som identifiering.

## Köra lokalt

Det är en helt statisk sida. Öppna bara `index.html` i webbläsaren, eller:

```bash
npx serve .
```

## Publicera på GitHub Pages

Repot innehåller en GitHub Actions-workflow (`.github/workflows/deploy.yml`) som publicerar
sidan automatiskt vid varje push till `main`. Aktivera den så här:

1. Skapa ett repo på GitHub och pusha filerna.
2. Gå till **Settings → Pages** i repot.
3. Under *Build and deployment*, välj **GitHub Actions** som källa (*Source*).
4. Klart – första deploymenten körs automatiskt vid nästa push, och sidan ligger
   på `https://<användarnamn>.github.io/<reponamn>/`.

Alternativ: välj *Deploy from a branch* (branch `main`, mapp `/ (root)`) så behövs
ingen workflow alls, men då sker publiceringen inte via Actions-loggen.

