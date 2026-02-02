// Test av att importera ett skript med en funktion från en annan fil (som exempel)
import { testPrint } from "./shared/test_shared.js";

import { Board } from "./shared/board.js";
import { BoardCreator } from "./boardCreator.js";

import { HtmlManager } from "./htmlmanager/htmlmanager.js";

import { GameDrawer } from "./gameDrawer.js";

import InputHandler from "./inputhandler.js"

testPrint();// Ska skriva ut i konsolen


const htmlManager = new HtmlManager(document.getElementById("ui"));
const socket = io();

// Game klassen (skulle kunna sättas i egen fil men detta funkar bra än så länge)
class Game extends Phaser.Scene {

    // Ladda in JSON-filen (Mapp filen)
    preload() {
        
        // Första kartan
        this.load.json('minKarta', './assets/map1.json');
        // Kan ändras när man lägger in fler kartor!
    }

    create() {

        // Hämta datan från JSON-filen
        const data = this.cache.json.get('minKarta');
        
        // Skapa Brädet
        this.gameBoard = new Board();
        
        // fyller brädet med boardCreator klassen
        BoardCreator.createFromJSON(this.gameBoard, data);

        // -=< STORY 2 || TASK 4 >=-
		// Create GameDrawer and print board
		this.gameDrawer = new GameDrawer(this, this.gameBoard);


        // STORY 3
        // Skapa en indatahanterare med förmågan att ändra logik beroende på musklick
        this.inputHandler = new InputHandler(this, this.gameBoard);
        this.inputHandler.addInput(this.gameBoard.getNode('n0'), (node) => {
        //    console.log('Klickade på ', node.id)
        });


        // ----- TESTLOGIK: ------

        // Rita en röd testcirkel i mitten av skärmen
        //const graphics = this.add.graphics({fillStyle:{color: 0xff0000}});
        //graphics.fillCircle(this.scale.width/2,this.scale.height/2,40);

        // Ladda in test UI och sätt upp så att något händer om man klickar på knappen
        htmlManager.loadAll(["./ui/testui.html", "./ui/mainmenu.html", "./ui/queue.html"]).then(() => {
            let testui = htmlManager.create("testui");
            let mainmenu = htmlManager.create("mainmenu");
            let queue = htmlManager.create("queue", {"state": "Testing"})
            socket.on("game_found", () => {
                queue.setPlaceholder("state", "Game Found!");
                
                //brädet ska ej visas förrän ett spel har startat!
                this.gameDrawer.draw(); 
                // Gör så att brädet ritas om om skärmstorleken ändras (då håller den sig centrerad)
                this.scale.on("resize",() => {this.gameDrawer.draw();})

            });
            htmlManager.showOnly(mainmenu);

            //testui.testbutton.onclick = () => {
            //    testui.switchTo(mainmenu)
            //    // testui.testtext.innerText = "Du klickade på knappen!";
            //}

//            mainmenu.virus.onClick = () => {
//
//            }
//
//
//            mainmenu.antivirus.onclick = () => {
//
//            }
//
//            mainmenu.spectator.onclick = () => {
//
//            }

            mainmenu.start.onclick = () => {
                mainmenu.switchTo(queue)
                socket.emit("find_game")
            }
        })
    }
}

const config = {
    width: window.innerWidth*window.devicePixelRatio,
    height: window.innerHeight*window.devicePixelRatio,
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
