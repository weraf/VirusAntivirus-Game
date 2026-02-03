// Test av att importera ett skript med en funktion från en annan fil (som exempel)
import { HtmlManager}  from "./htmlmanager/htmlmanager.js"
import { ACTIONS }  from "./shared/enums.js";
import { Translator } from "./translator.js";
import { testPrint } from "./shared/test_shared.js";

import { Board } from "./shared/board.js";
import { BoardCreator } from "./boardCreator.js";

import { GameDrawer } from "./gameDrawer.js";

import { GameState } from "./gamestate.js"

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
        this.inputHandler = new InputHandler(this, this.gameBoard);
        this.inputHandler.enableInput();


        // ----- TESTLOGIK: ------

        // Rita en röd testcirkel i mitten av skärmen
        //const graphics = this.add.graphics({fillStyle:{color: 0xff0000}});
        //graphics.fillCircle(this.scale.width/2,this.scale.height/2,40);

        // Ladda in test UI och sätt upp så att något händer om man klickar på knappen
        htmlManager.loadAll(["./ui/mainmenu.html", "./ui/queue.html"]).then(() => {
            let mainmenu = htmlManager.create("mainmenu");
            let queue = htmlManager.create("queue", {"state": "Söker spel"})
            socket.on("game_found", () => {
                queue.setPlaceholder("state", "Game Found!");
                
                //brädet ska ej visas förrän ett spel har startat!
                this.gameDrawer.draw(); 
                // Gör så att brädet ritas om om skärmstorleken ändras (då håller den sig centrerad)
                this.scale.on("resize", () => {
                    this.gameDrawer.draw();
                });

            });
            htmlManager.showOnly(mainmenu);

            mainmenu.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());

            //mainmenu.setPlaceholders(
            //    Object.fromEntries(Object.entries(Translator.getDictionary()).map(([k,v]) => [k, v[Translator.language]]))
            //);

            // mainmenu.setLanguagePlaceholders(Translator.getDictionary())
 
            socket.on("game_found", () => {
                queue.setPlaceholder("state", "Match hittad!")
                queue.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());
                queue.hide();
                }
            )
            


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
                socket.emit(ACTIONS.FIND_GAME)
                queue.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());
            }

            queue.abort.onclick = () => {
                queue.switchTo(mainmenu)
                socket.emit(ACTIONS.STOP_FINDING_GAME)
                
            }

            mainmenu.language_button.onclick = () => {
                Translator.setLanguage("zh");
                mainmenu.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());
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


await Translator.init();
const game = new Phaser.Game(config);
