// Test av att importera ett skript med en funktion från en annan fil (som exempel)
import { HtmlManager}  from "./htmlmanager/htmlmanager.js"
import { ACTIONS, QUEUE_PREFERENCE }  from "./shared/enums.js";
import { Translator } from "./translator.js";

import { Board } from "./shared/board.js";
import { BoardCreator } from "./boardCreator.js";

import { GameDrawer } from "./gameDrawer.js";

import InputHandler from "./inputhandler.js"


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
        
        // Lägg till en ormen
        this.gameBoard.spawnVirus([this.gameBoard.getNode("n4"),this.gameBoard.getNode("n0"),this.gameBoard.getNode("n2")]);
        this.gameBoard.spawnStartBugs();
        // -=< STORY 2 || TASK 4 >=-
		// Create GameDrawer and print board
		this.gameDrawer = new GameDrawer(this, this.gameBoard);
        this.queuePreference = QUEUE_PREFERENCE.ANY;

        // STORY 3
        // Skapa en indatahanterare med förmågan att ändra logik beroende på musklick
        this.inputHandler = new InputHandler(this, this.gameBoard);

        // Ladda in test UI och sätt upp så att något händer om man klickar på knappen
        htmlManager.loadAll(["./ui/mainmenu.html", "./ui/queue.html", "./ui/gameui.html"]).then(() => {
            let mainmenu = htmlManager.create("mainmenu");
            
            let queue = htmlManager.create("queue")
            
            socket.on("game_found", (isVirus) => {
                
                this.isVirus = isVirus;
                // lägg ut antivirus
                this.gameBoard.spawnAntivirus();

                //UI-logik
                let gameui = htmlManager.create("gameui", {
                    "myplayer": (isVirus ? Translator.getText("pvirus"): Translator.getText("pantivirus"))
                });
                gameui.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());
                queue.switchTo(gameui);
                this.startGame(isVirus);
                
            });
            htmlManager.showOnly(mainmenu);
            

            mainmenu.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());

            //mainmenu.setPlaceholders(
            //    Object.fromEntries(Object.entries(Translator.getDictionary()).map(([k,v]) => [k, v[Translator.language]]))
            //);

            // mainmenu.setLanguagePlaceholders(Translator.getDictionary())


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

    startGame(isVirus) {
        
        //Rita brädet
        this.gameDrawer.draw(); 
    
        //Hantera resize
        this.scale.on("resize", () => {
            this.gameDrawer.draw();
        });
        if (isVirus) {
            this.virusTurn();
        } else {
            this.antivirusTurn();
        }
    }

    virusTurn() {
        this.inputHandler.removeAllInput();
        for (const node of this.gameBoard.virus.getValidMoves()) {
            this.inputHandler.addInput(node, (clicked) => {
                this.gameBoard.virus.moveTo(clicked);
                this.virusTurn();
            })
        }
    }
    antivirusTurn() {
        const av = this.gameBoard.antivirus;
        this.inputHandler.removeAllInput();

        
        av.getNodesToEnableInput(this.gameBoard).forEach(node => {
            this.inputHandler.addInput(node, (clicked) => {
                if (av.nodes.includes(clicked.id)) {
                    av.selectAVNode(clicked.id);
                } else {
                    av.moveAVNode(clicked.id);
                }

                const validMoveIds = av.getValidMoves(this.gameBoard).map(n => n.id);
                const selectedId = av.selectedNodeId ? [av.selectedNodeId] : [];
                
                this.gameDrawer.draw(selectedId, validMoveIds);
                
                this.antivirusTurn(); 
            });
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
