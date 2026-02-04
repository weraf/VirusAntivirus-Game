// Test av att importera ett skript med en funktion från en annan fil (som exempel)
import { HtmlManager}  from "./htmlmanager/htmlmanager.js"
import { ACTIONS, QUEUE_PREFERENCE }  from "./shared/enums.js";
import { Translator } from "./translator.js";
import { testPrint } from "./shared/test_shared.js";

import { Board } from "./shared/board.js";
import { BoardCreator } from "./boardCreator.js";

import { GameDrawer } from "./gameDrawer.js";

import { GameState } from "./shared/gamestate.js"

import InputHandler from "./inputhandler.js"

testPrint();// Ska skriva ut i konsolen

// Game kommunicerar först med gameserver, gameserver uppdaterar sin gamestate, skickar
//  tillbaka och då uppdaterar vi vår gamestate


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

        //this.GameState = new GameState(this.gameBoard);
        
        // fyller brädet med boardCreator klassen
        BoardCreator.createFromJSON(this.gameBoard, data);

        // -=< STORY 2 || TASK 4 >=-
		// Create GameDrawer and print board
		this.gameDrawer = new GameDrawer(this, this.gameBoard);

        this.gameState = new GameState(this.gameBoard, 2000);

        this.queuePreference = QUEUE_PREFERENCE.ANY;

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
        htmlManager.loadAll(["./ui/mainmenu.html", "./ui/queue.html", "./ui/gameui.html"]).then(() => {
            let mainmenu = htmlManager.create("mainmenu");
            
            let queue = htmlManager.create("queue")
            
            socket.on("game_found", (isVirus) => {
                //UI-logik
                let gameui = htmlManager.create("gameui", {"myplayer": (isVirus ? Translator.getText("pvirus"): Translator.getText("pantivirus"))});
                gameui.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());
                queue.switchTo(gameui);
                
                //Rita brädet
                this.gameDrawer.draw(); 
                
                //Aktivera input första gången
                this.refreshInput();
            
                //Hantera resize
                this.scale.on("resize", () => {
                    this.gameDrawer.draw();
                });
            });


            this.gameState.addEventListener('moveMade', () =>  {
                console.log("YOLO. 🍆🍆🍆🍆🍆🍆🍆🍆🍆")
            })

            this.gameState.addEventListener('turnChanged', () => {
                console.log("yeap, it has been changed 💕💕💕💕💕💕❤️❤️❤️😂😂😎😎😎")
            })

            this.gameState.handleMove();

            htmlManager.showOnly(mainmenu);

            mainmenu.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());

            //mainmenu.setPlaceholders(
            //    Object.fromEntries(Object.entries(Translator.getDictionary()).map(([k,v]) => [k, v[Translator.language]]))
            //);

            // mainmenu.setLanguagePlaceholders(Translator.getDictionary())


            //testui.testbutton.onclick = () => {
            //    testui.switchTo(mainmenu)
            //    // testui.testtext.innerText = "Du klickade på knappen!";
            //}
            mainmenu.virus.onclick = () => {
                this.queuePreference = QUEUE_PREFERENCE.VIRUS;
                // Visa en linje på den markerade knappen
                mainmenu.virus.classList.add("selected");
                mainmenu.antivirus.classList.remove("selected");
            }
            
            mainmenu.antivirus.onclick = () => {
                this.queuePreference = QUEUE_PREFERENCE.ANTIVIRUS;
                // Visa en linje på den markerade knappen
                mainmenu.antivirus.classList.add("selected");
                mainmenu.virus.classList.remove("selected");
            }

            mainmenu.start.onclick = () => {
                mainmenu.switchTo(queue)
                socket.emit(ACTIONS.FIND_GAME,this.queuePreference)
                queue.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());
            }

            queue.abort.onclick = () => {
                queue.switchTo(mainmenu)
                socket.emit(ACTIONS.STOP_FINDING_GAME)
                
            }

            mainmenu.language_button.onclick = () => {
                if (Translator.language === "en") {
                    Translator.setLanguage("sv");
                } else {
                    Translator.setLanguage("en");
                }
                mainmenu.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());
            }

            
        })
        
    }
    refreshInput() {
        this.inputHandler.removeAllInput();
        const nodes = this.gameBoard.getAllNodes();
        
        nodes.forEach(node => {
            this.inputHandler.addInput(node, (clickedNode) => {
                console.log("Klickade på:", clickedNode.id);
                // Här anropar du din klick-logik
            });
        });
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
