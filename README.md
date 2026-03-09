# VirusAntivirus-Game

Ett webbaserat multiplayer-spel utvecklat i kursen D0020E vid Luleå tekniska universitet. Två spelare tävlar i ett nodbaserat nätverksgrafspel där ett virus försöker infektera servrar medan ett antivirusprogram försöker stoppa det.

---

## Innehåll

- [Om spelet](#om-spelet)
- [Spelregler](#spelregler)
- [Installation](#installation)
- [Starta spelet](#starta-spelet)
- [Spellägen](#spellägen)
- [Kartbalanstest](#kartbalanstest)
- [Projektstruktur](#projektstruktur)
- [Tekniker](#tekniker)

---

## Om spelet

Spelet utspelar sig i ett nätverk av noder där två spelare tävlar om kontroll. 
Viruset är en orm (likt Snake) som rör sig över nätverkskartan och försöker infektera två servrar samtidigt. Antiviruset kontrollerar två skyddande pjäser som försöker blockera virusets väg och skydda Servrarna.

Spelet är designat för att kunna spelas snabbt (2–5 minuter per omgång) och passar för demonstrationer, t.ex. öppet hus för gymnasieelever.

---

## Spelregler

### Virus
Virusets spelpjäs består av en kropp som upptar flera noder samtidigt i en sammanhängande koppling. 
Spelaren utför ett drag genom att välja en ledig, angränsande nod att flytta till, kroppen flyttar sedan längs med rörelseriktningen. Möjliga drag indikeras av gröna cirklar.

Virusets syfte är att angripa kartans servrar. Målet är att skapa en sammanhängande koppling mellan två av kartans servrar.

Antiviruset vinner när viruset inte kan utföra några giltiga drag, därför måste viruset undvika att bli isolerat på kartan.

### Antivirus
Antiviruset har två spelpjäser som placeras på två olika noder angränsande till kartans servrar. Antiviruset utför ett drag genom att:
1. Välja en av spelpjäserna som ska flyttas
2. Välja en angränsande nod för att flytta spelpjäsen

Antivirusets syfte är att försvara kartans servrar från virusets angrepp. Målet är att förhindra viruset från att skapa en sammanhängande länk mellan två av kartans servrar.

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
# 1. Klona repot
git clone 
cd VirusAntivirus-Game

# 2. Installera beroenden
npm install
```

---

## Installation

### Alternativ 1: Node.js direkt

**Krav:** [Node.js](https://nodejs.org) v18 eller senare

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

Spelet kan driftsättas på en publik server t.ex. via [Railway](https://railway.app) eller [Render](https://render.com) — båda stödjer Docker automatiskt:

1. Ladda upp koden till GitHub
2. Koppla repot till din valda tjänst, den känner igen `Dockerfile` automatiskt
3. Tjänsten tilldelar en publik URL som alla kan nå via webbläsaren

Se till att `webserver.js` använder miljövariabeln `PORT`:
```javascript
const PORT = process.env.PORT || 3000;
```
---