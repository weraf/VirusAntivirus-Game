// Test av att importera ett skript med en funktion från en annan fil (som exempel)
import { EVENTS, QUEUE_PREFERENCE }  from "./shared/enums.js";
import { Translator } from "./translator.js";

import { Board } from "./shared/board.js";
import { BoardCreator } from "./boardCreator.js";

import { GameDrawer } from "./gameDrawer.js";

import InputHandler from "./inputhandler.js"
import { GameUI } from "./ui/game_ui.js";

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
        // lägg ut antivirus
        this.gameBoard.spawnAntivirus();

        // -=< STORY 2 || TASK 4 >=-
		// Create GameDrawer and print board
		this.gameDrawer = new GameDrawer(this, this.gameBoard);
        this.queuePreference = QUEUE_PREFERENCE.ANY;

        // STORY 3
        // Skapa en indatahanterare med förmågan att ändra logik beroende på musklick
        this.inputHandler = new InputHandler(this, this.gameBoard);

        this.ui = new GameUI(document.getElementById("ui"),socket);

        socket.on(EVENTS.GAME_FOUND, (isVirus) => {  
            this.isVirus = isVirus;
            this.startGame(isVirus);
            
        });
        
    }

    startGame(isVirus) {
        
        //Rita brädet
        this.gameDrawer.draw(); 
        this.ui.showGameStart(isVirus);
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
        const valid = this.gameBoard.virus.getValidMoves()
        if (valid.length == 0) {
            // Virus has lost
            this.ui.showWinScreen(false);
            this.gameDrawer.virusDrawer.update(); // Force it to update since we return
            return;
        }
        for (const node of valid) {
            this.inputHandler.addInput(node, (clicked) => {
                this.gameBoard.virus.moveTo(clicked);
                if (this.gameBoard.virus.getCoveredServerCount() >= 2) {
                    // Virus has won
                    this.ui.showWinScreen(true);
                    this.gameDrawer.virusDrawer.update(); // Force it to update since we return
                    return;
                }
                this.virusTurn();
            })
        }
        this.gameDrawer.draw([], valid.map((n) => {return n.id}));
    }
    antivirusTurn() {
        const av = this.gameBoard.antivirus;
        this.inputHandler.removeAllInput();

        
        av.getNodesToEnableInput(this.gameBoard).forEach(node => {
            this.inputHandler.addInput(node, (clicked) => {
                if (av.hasNode(clicked)) {
                    av.selectAVNode(clicked);
                } else {
                    av.moveAVNode(clicked);
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
