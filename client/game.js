// Test av att importera ett skript med en funktion från en annan fil (som exempel)

// Importera klasser från Task 2.1:
import { Board } from "./shared/board.js";
import { Virus } from "./shared/virus.js";
import { Antivirus } from "./shared/antivirus.js";
import { Bug } from "./shared/bug.js";

import { HtmlManager}  from "./htmlmanager/htmlmanager.js"

testPrint(); // Ska skriva ut i konsolen

const htmlManager = new HtmlManager(document.getElementById("ui"));
const socket = io();

setTimeout(() => {
    console.log("Looking for opponent");
    socket.emit("find_game")
}, 4000)

socket.on("game_found", () => {console.log("Game start!")})
// Game klassen (skulle kunna sättas i egen fil men detta funkar bra än så länge)
class Game extends Phaser.Scene {

    // Ladda in JSON-filen (Mapp filen)
    preload() {
        
        // Första kartan
        this.load.json('minKarta', './assets/map1.json'); 
    }

    create() {

        // Hämta datan från JSON-filen
        const data = this.cache.json.get('minKarta');
        
        // Skapa en instans av Brädes klassen
        this.gameBoard = new Board();
        // Här nere kan man sätta in logiken för att fylla brädet...


        // ----- TESTLOGIK: ------
        // Rita en röd testcirkel i mitten av skärmen
        const graphics = this.add.graphics({fillStyle:{color: 0xff0000}});
        graphics.fillCircle(this.scale.width/2,this.scale.height/2,40);

        // Ladda in test UI och sätt upp så att något händer om man klickar på knappen
        htmlManager.loadAll(["./ui/testui.html"]).then(() => {
            let testui = htmlManager.create("testui");
            testui.testbutton.onclick = () => {
                testui.testtext.innerText = "Du klickade på knappen!";
            }
        })
    }
}

const config = {
    width: window.innerWidth,
    height: window.innerHeight,
    type: Phaser.AUTO,
    scale: {
            // För att spelet ska fylla hela skärmen
            mode: Phaser.Scale.EXPAND,
            autoCenter: Phaser.Scale.NO_CENTER,
    },
    parent: 'game',
    scene: Game
};

const game = new Phaser.Game(config);
