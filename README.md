# Virus VS Antivirus - Game

Spela nu: qwazi.campus.ltu.se

Ett webbaserat multiplayer-spel utvecklat i kursen D0020E vid Luleå tekniska universitet. Två spelare tävlar i ett nodbaserat nätverksgrafspel där ett virus försöker infektera servrar medan ett antivirusprogram försöker stoppa det.

---

## Innehåll

- [Om spelet](#om-spelet)
- [Spelregler](#spelregler)
- [Installation](#installation)
- [Starta spelet](#starta-spelet)
- [Spellägen](#spellägen)
- [Kartbalanstest](#kartbalanstest)
- [Språkstöd](#språkstöd)
- [Projektstruktur](#projektstruktur)
- [Tekniker](#tekniker)

---

## Om spelet

Spelet utspelar sig i ett nätverk av noder där två spelare tävlar om kontroll. 
Viruset är en orm (Snake) som rör sig över nätverket och försöker infektera (lägga sig över) två servrar samtidigt. Antiviruset kontrollerar två skyddande pjäser som försöker blockera virusets väg och skydda Servrarna.

Spelet ska kunna spelas snabbt (2–5 minuter per omgång) och passar för t.ex. öppet hus för gymnasieelever och demonstrationer.

---

## Spelregler

### Virus
Virusets spelpjäs består av en kropp som upptar flera noder samtidigt i en sammanhängande koppling, vid start är det 3 noder långt. 
Spelaren utför ett drag genom att välja en ledig, gränsande nod att flytta till, kroppen flyttar sedan längs med rörelseriktningen. Möjliga drag markeras av gröna cirklar.

Virusets syfte är att angripa kartans servrar. Målet är att skapa en koppling, med kroppen, mellan två av kartans servrar.

Viruset förlorar när den inte kan utföra några giltiga drag, därför måste viruset undvika att bli isolerat på kartan.

### Antivirus
Antiviruset har två spelpjäser som placeras på två olika noder angränsande till kartans servrar. Antiviruset gör ett drag genom att:
1. Välja en av spelpjäserna som ska flyttas
2. Välja en angränsande nod för att flytta spelpjäsen

Syftet är att försvara kartans servrar från virusets angrepp. Målet är att förhindra viruset från att skapa en sammanhängande länk mellan två av kartans servrar.

Antiviruset vinner när viruset inte kan utföra några giltiga drag, därför måste antiviruset sträva efter att isolera viruset på kartan.

### Buggar
- Finns utplacerade på kartan från start.
- När viruset går på en bugg växer det och buggen teleporteras till en ny slumpmässig tom nod.
- När antiviruset går på en bugg teleporteras buggen bort utan att antiviruset påverkas.

### Servrar
Viruset försöker invadera dem, antiviruset skyddar dem. Antiviruset kan inte placeras på servernoder.

### Timer
Du har **20 sekunder** på dig att göra ett drag. Överskrids tiden blir det automatiskt motståndarens tur.

---
## Installation

### Krav
- [Node.js](https://nodejs.org) (v18 eller senare rekommenderas)

### Steg

```bash
# Klona repot
git clone 
cd VirusAntivirus-Game

# Installera beroenden
npm install
```

---

## Installation

### Alternativ 1: Node.js direkt

**Krav:** [Node.js](https://nodejs.org) v20 eller senare

```bash
# Klona repot
git clone https://github.com/weraf/VirusAntivirus-Game.git
cd VirusAntivirus-Game

# Installera beroenden
npm install
```

### Alternativ 2: Docker

**Krav:** [Docker](https://www.docker.com)

```bash
# Klona repot
git clone https://github.com/weraf/VirusAntivirus-Game.git
cd VirusAntivirus-Game

# Bygg Docker-imagen
docker build -t virusantivirus .
```

---

## Starta spelet

### Med Node.js

```bash
node webserver.js
```

### Med Docker

```bash
docker run -p 3000:3000 virusantivirus
```

### Spela lokalt (samma dator)

Gå till:
```
http://localhost:3000
```

### Spela på samma nätverk (t.ex. öppet hus, demo)

1. Ta reda på din dators lokala IP-adress:
   - **Mac/Linux:** kör `ipconfig getifaddr en0` i terminalen
   - **Windows:** kör `ipconfig` och leta efter "IPv4-adress"

2. Starta servern och låt andra på samma WiFi ansluta via:
   ```
   http://<din-ip>:3000
   ```
   Exempel: `http://192.168.x.x:3000`

### Driftsätta publikt (tillgängligt över internet)

Spelet kan driftsättas på en publik server t.ex. via [Railway](https://railway.app) eller [Render](https://render.com), båda stödjer Docker automatiskt:

1. Ladda upp koden till GitHub
2. Koppla repot till din valda tjänst, den känner igen `Dockerfile` automatiskt
3. Tjänsten tilldelar en publik URL som alla kan nå via webbläsaren

Se till att `webserver.js` använder miljövariabeln `PORT`:
```javascript
const PORT = process.env.PORT || 3000;
```
---

## Spellägen

### Spela mot annan spelare
Klicka på **Spela** i huvudmenyn. Du hamnar i en kö och matchas automatiskt med en annan spelare. Du kan välja att söka som virus, antivirus eller slumpmässigt.

### Spela mot AI
Klicka på **Spela mot AI** och välj om du vill spela som virus, antivirus, eller slumpa. Du matchas direkt mot en AI-motståndare.

### Åskåda AI vs AI
Klicka på **Kolla AI mot AI** för att åskåda ett spel mellan två AI-spelare i realtid.

### Åskåda en match
Klicka på **Kolla på match** för att titta på ett pågående spel utan att interagera.

---
## Kartbalans

Spelet har tre kartor som väljs slumpmässigt vid start av varje ny match. Alla tre kartor har balanstestats genom simulerade AI vs AI-matcher med följande parametrar:

- **1000 spel** per karta
- **Balansdefinition:** skillnad i vinstandel mellan virus och antivirus får inte överstiga 5%
- **Oavgjort:** ett spel räknas som oavgjort om någon spelare gör fler än 100 drag var, eller om spelet inte avgörs inom 5 sekunder
- **AI-djup:** virus använder sökdjup 4, antivirus sökdjup 3

Alla tre kartor klarade balanskriteriet.

---
##Språkstöd

Spelet har ett inbyggt översättningssystem. Alla texter i gränssnittet, knappar, regler, statusmeddelanden och vinst/förlust-skärmar, hämtas från och uppdateras direkt utan omladdning.

Spelet stödjer följande språk:

| Kod | Språk |
|-----|-------|
|  | Svenska (standard) |
|  | Engelska |
|  | Egyptisk arabiska *(eget tillägg)* |

Svenska och engelska var krav för detta projekt. Egyptisk arabiska lades till som ett eget tillägg, inklusive stöd för höger-till-vänster-layout (RTL) som aktiveras automatiskt.

Språket väljs via en popup-meny som visas när man klickar på språkknappen, knappen är tillgänglig både i huvudmenyn och under pågående spel.

---

## Projektstruktur

```
VirusAntivirus-Game/
├── client/
│   ├── assets/                  # Bilder, ljud och kartfiler
│   │   ├── map1.json            # Karta 1
│   │   ├── map2.json            # Karta 2
│   │   ├── map3.json            # Karta 3
│   │   ├── music.mp3
│   │   └── ...                  # Sprites och ljudeffekter
│   ├── shared/                  # Delad logik mellan klient och server
│   │   ├── ai.js                # AI-logik
│   │   ├── antivirus.js         # Antiviruslogik
│   │   ├── board.js             # Brädets datastruktur
│   │   ├── boardCreator.js      # Bygger brädet från JSON-kartfiler
│   │   ├── bugs.js              # Bugglogik
│   │   ├── enums.js             # Delade konstanter och enums
│   │   ├── gamestate.js         # Spelstatus, turhantering och vinstregler
│   │   ├── node.js              # Nodklass
│   │   ├── test_shared.js       # Tester för delad logik
│   │   └── virus.js             # Viruslogik
│   ├── ui/                      # Användargränssnitt
│   │   ├── fonts/               # Typsnitt
│   │   ├── htmlmanager/         # Hjälpklass för HTML-komponenter
│   │   ├── aiselect.html        # AI-väljarskärm
│   │   ├── game_ui.js           # UI-logik
│   │   ├── languages.json       # Översättningar (sv/en/ar-EG)
│   │   ├── mainmenu.html
│   │   ├── player_indicator.html
│   │   ├── queue.html
│   │   ├── rules.html
│   │   ├── settings.html
│   │   ├── translator.js        # Språkhantering
│   │   ├── waiting.html
│   │   └── winscreen.html
│   ├── game.js                  # Huvudspelklass (Phaser.js)
│   ├── gameDrawer.js            # Renderingslogik
│   ├── index.html               # Ingångspunkt
│   ├── inputhandler.js          # Inputhantering
│   ├── soundManager.js          # Ljudhantering
│   └── style.css
├── server/
│   ├── aiplayer.js              # AI-spelare
│   ├── gameserver.js            # Spelserverlogik, hanterar match och drag
│   ├── lobbyhandler.js          # Matchmaking och lobbyhantering
│   ├── player.js                # Spelarwrapper
│   ├── server.js                # Socket.io-server
│   └── user.js                  # Användare (socket-wrapper)
├── Dockerfile
├── package.json
└── webserver.js                 # Startar webb- och socket-servern
```
---

## Tekniker

| Teknik | Användning |
|--------|-----------|
| [Phaser.js](https://phaser.io) | Spelrendering och animationer i klienten |
| [Node.js](https://nodejs.org) | Serverlogik och spelmotor på backend |
| [Socket.io](https://socket.io) | Realtidskommunikation mellan klient och server |

### AI
AI-spelaren använder **minimax med alpha-beta pruning** för att välja drag. Separata heuristiker finns för virus och antivirus som tar hänsyn till:
- Avstånd till servrar och buggar
- Tillgängligt utrymme (flood-fill)
- Antal täckta servrar
- Möjligheten att blockera motståndarens vägar

### Kartor
Kartorna är definierade i JSON-format och skapas i ett externt verktyg (GraphML) och konverteras via ett Python-skript. Tre kartor finns tillgängliga och en väljs slumpmässigt när ett spel startar.

---

## Utvecklat av

Martin Larsson, Edwin Bohlin, Saly Boktor, Victor Sakko, Alvin Englund  

Luleå tekniska universitet — Kurs D0020E
