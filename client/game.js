// Test av att importera ett skript med en funktion från en annan fil (som exempel)
import { ACTIONS, EVENTS, QUEUE_PREFERENCE }  from "./shared/enums.js";

import { Board } from "./shared/board.js";
import { BoardCreator } from "./shared/boardCreator.js";

import { GameDrawer } from "./gameDrawer.js";

import { GameState } from "./shared/gamestate.js"

import InputHandler from "./inputhandler.js"
import { GameUI } from "./ui/game_ui.js";

const socket = io();

// Game klassen. Exporteras för att kunna använda som type-hint
export class Game extends Phaser.Scene {

    // Ladda in JSON-filen (Mapp filen)
    preload() {
        this.load.image('bg', './assets/bdr.png')
        
        // Första kartan
        this.load.json('minKarta', './assets/map1.json');
        // Kan ändras när man lägger in fler kartor!
    }
    
    onResize() {
        if (this.gameDrawer) {
            this.gameDrawer.onResize();
        } else {
            // If we got no gameDrawer, normalize zoom and center camera on 0,0
            // This keeps the background image scale fixed
            let zoom = Math.max(this.scale.height / 500, this.scale.width / 2000);
            this.cameras.main.setZoom(zoom);
            this.cameras.main.centerOn(0,0);
            // Move the background to the center of the camera    
            
        }
    }

    create() {
        this.started = false; // Spelet har inte startat ännu, sätts true is startGame()

        this.bg = this.add.image(0, 0, 'bg');
        
        this.scale.on("resize",this.onResize.bind(this));
        this.onResize();
        // Hämta datan från JSON-filen
        const data = this.cache.json.get('minKarta');

        // Skapa Brädet
        this.gameBoard = new Board();

        // fyller brädet med boardCreator klassen
        BoardCreator.createFromJSON(this.gameBoard, data);
        
        // Virus, buggar och antivirus skapas vid startGame(); 

        // STORY 3
        // Skapa en indatahanterare med förmågan att ändra logik beroende på musklick
        this.inputHandler = new InputHandler(this, this.gameBoard);
        
        this.gameState = new GameState(this.gameBoard, 2000);
        this.queuePreference = QUEUE_PREFERENCE.ANY;
        this.ui = new GameUI(document.getElementById("ui"),socket);

        socket.on(EVENTS.GAME_FOUND, (isVirus) => {  
            this.isVirus = isVirus;
            this.startGame(isVirus);
            
        });

        
        
        socket.on(EVENTS.VIRUS_MOVED, (nodeid) => {
            this.gameBoard.virus.moveTo(this.gameBoard.getNode(nodeid));
            
            if (this.gameBoard.virus.getCoveredServerCount() >= 2) {
                    // Virus has won
                    this.ui.showWinScreen(true);
                    return;
                }
            if (!this.isVirus) {
                this.antivirusTurn();
            }

        })

        socket.on(EVENTS.ANTIVIRUS_MOVED, (nodeid, selectedid) => {
            this.gameBoard.antivirus.selectedNode = this.gameBoard.getNode(selectedid)
            this.gameBoard.antivirus.moveTo(this.gameBoard.getNode(selectedid), this.gameBoard.getNode(nodeid))

            const valid = this.gameBoard.virus.getValidMoves()

            if (valid.length == 0) {
                // Virus has lost
                this.ui.showWinScreen(false);
                return;
            }

            if (this.isVirus) {
                this.virusTurn();
            }
            
            
        })

    }

    startGame(isVirus) {
        // Lägg till en ormen
        this.gameBoard.spawnVirus([this.gameBoard.getNode("n4"),this.gameBoard.getNode("n0"),this.gameBoard.getNode("n2")]);
        this.gameBoard.spawnStartBugs([this.gameBoard.getNode("n28"),this.gameBoard.getNode("n20")]);
        // lägg ut antivirus
        this.gameBoard.spawnAntivirus([this.gameBoard.getNode("n21"),this.gameBoard.getNode("n30")]);

        // Game has started, now we can add gamedrawer
        this.gameDrawer = new GameDrawer(this, this.gameBoard, this.inputHandler);

        this.ui.showGameStart(isVirus);
        this.started = true;
        
        this.gameDrawer.draw(); 

        if (isVirus) {
            this.virusTurn();
        }
    }

    // Spelare gör ett drag, skickar till GameServer, GameServer skickar tillbaka till båda spelarna

    virusTurn() {
        this.inputHandler.removeAllInput();
        const valid = this.gameBoard.virus.getValidMoves()

        for (const node of valid) {
            this.inputHandler.addInput(node, (clicked) => {
                socket.emit(ACTIONS.VIRUS_MOVE, clicked.id)
                this.inputHandler.removeAllInput();
            })
        }
    }
    antivirusTurn() {
        const av = this.gameBoard.antivirus;
        this.inputHandler.removeAllInput();

        av.getNodesToEnableInput(this.gameBoard).forEach(node => {
            this.inputHandler.addInput(node, (clicked) => {
                if (av.hasNode(clicked)) {
                    av.selectAVNode(clicked);
                    this.gameDrawer.antivirusDrawer.update() // Update so we can see that it's selected
                    this.antivirusTurn(); 
                } else {
                    socket.emit(ACTIONS.ANTIVIRUS_MOVE, clicked.id, av.selectedNode.id) // test emit
                    this.inputHandler.removeAllInput();
                    return;
                }
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

const game = new Phaser.Game(config);
