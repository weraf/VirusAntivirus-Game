// Test av att importera ett skript med en funktion från en annan fil (som exempel)
import { HtmlManager}  from "./htmlmanager/htmlmanager.js"
import { ACTIONS }  from "./shared/enums.js";
import { Translator } from "./translator.js";
import { testPrint } from "./shared/test_shared.js";

import { Board } from "./shared/board.js";
import { BoardCreator } from "./boardCreator.js";

import { GameDrawer } from "./gameDrawer.js";
import { Virus } from "./shared/virus.js";

import InputHandler from "./inputhandler.js"

testPrint();// Ska skriva ut i konsolen


const htmlManager = new HtmlManager(document.getElementById("ui"));
const socket = io();

// Game klassen. Exporteras för att kunna använda som type-hint
export class Game extends Phaser.Scene {

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
        
        // Skapa en orm (OBS, ska vara i board senare)
        this.virus = new Virus(this.gameBoard,[this.gameBoard.getNode("n4"),this.gameBoard.getNode("n0"),this.gameBoard.getNode("n2"),this.gameBoard.getNode("n2"),this.gameBoard.getNode("n2")]);
        // -=< STORY 2 || TASK 4 >=-
		// Create GameDrawer and print board
		this.gameDrawer = new GameDrawer(this, this.gameBoard);


        // STORY 3
        // Skapa en indatahanterare med förmågan att ändra logik beroende på musklick
        this.inputHandler = new InputHandler(this, this.gameBoard);


        // ----- TESTLOGIK: ------

        // Rita en röd testcirkel i mitten av skärmen
        //const graphics = this.add.graphics({fillStyle:{color: 0xff0000}});
        //graphics.fillCircle(this.scale.width/2,this.scale.height/2,40);

        this.startGame();
        
        // Ladda in test UI och sätt upp så att något händer om man klickar på knappen
        htmlManager.loadAll(["./ui/mainmenu.html", "./ui/queue.html"]).then(() => {
            
            return;

            let mainmenu = htmlManager.create("mainmenu");
            let queue = htmlManager.create("queue", {"state": "Söker spel"})
            socket.on("game_found", () => {
                //UI-logik
                queue.setPlaceholder("state", "Match hittad!");
                queue.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());
                queue.hide();
                
                this.startGame();
            });
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

    startGame() {
        htmlManager.hideAll();
        //Rita brädet
        this.gameDrawer.draw(); 
        
        //Aktivera input första gången
        this.refreshInput();
    
        //Hantera resize
        this.scale.on("resize", () => {
            this.gameDrawer.draw();
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
