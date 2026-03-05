// Test av att importera ett skript med en funktion från en annan fil (som exempel)
import { ACTIONS, EVENTS, QUEUE_PREFERENCE }  from "./shared/enums.js";

import { Board } from "./shared/board.js";
import { BoardCreator } from "./shared/boardCreator.js";

import { GameDrawer } from "./gameDrawer.js";

import { GameState } from "./shared/gamestate.js"

import InputHandler from "./inputhandler.js"
import { GameUI } from "./ui/game_ui.js";

import { SoundManager } from "./soundManager.js";

const socket = io();

// Game klassen. Exporteras för att kunna använda som type-hint
export class Game extends Phaser.Scene {

    constructor(config) {
        super(config);

        this.bgMovement = true;

        // Setting up socket signals in constructor so it doesn't connect them again when we restart
        this.connectSocket();
        this.initUI();
    }

    // Ladda in JSON-filen (Mapp filen)
    preload() {
        this.load.image('bg', './assets/backdrop.png');
        this.load.image('shield', './assets/shield.png');
        this.load.image('fire', './assets/fire.png');
        this.load.image('eyes', './assets/eyes.png');

        //ladda in ljud
        this.load.audio('click', './assets/Click.wav');
        this.load.audio('AVmove', './assets/AVmove.wav');
        this.load.audio('Vmove', './assets/Vmove.wav');
        this.load.audio('bugMove', './assets/bugMove.wav');
        this.load.audio('lose', './assets/lose.wav');
        this.load.audio('win', './assets/win.wav');
        this.load.audio('music', './assets/music.mp3');
    }
    
    onResize() {
        if (this.gameDrawer) {
            this.gameDrawer.onResize();
        }
        const cameraSizeX = this.cameras.main.width/this.cameras.main.zoomX;
        const cameraSizeY = this.cameras.main.height/this.cameras.main.zoomY;
        // Scale the background so it fits the camera area
        this.bg.setScale(Math.max(cameraSizeX/2000,cameraSizeY/2000));
        // Move the background to the center of the camera
        this.bg.x = this.cameras.main.scrollX+this.cameras.main.centerX;
        this.bg.y = this.cameras.main.scrollY+this.cameras.main.centerY;
    }

    updateCanvasSize() {
        // We take the ceil in order to not get small white stripes at the edges in certain situations.
        this.scale.resize(Math.ceil(window.innerWidth*window.devicePixelRatio),Math.ceil(window.innerHeight*window.devicePixelRatio));
        // This will trigger onResize() to trigger
    }

    leaveGame() {
        this.started = false; // Stops the lose event from showing
        socket.emit(ACTIONS.LEAVE_GAME);
        // Objects created with scene.add are automatically destroyed by phaser
        this.gameState.stopTimer(); // Stop the timer so it won't keep updating the UI
        this.gameState = null;
        this.gameBoard = null;
        this.ui.backToMenu();
        this.scene.restart();
    }

    create() {
        this.started = false; // Spelet har inte startat ännu, sätts true is startGame()

        this.bg = this.add.tileSprite(0, 0, 2000,2000,'bg');
        
        
        // Update screen when canvas changes size
        this.scale.on("resize",this.onResize.bind(this));
        
        // Update canvas when screen changes size
        window.addEventListener("resize", this.updateCanvasSize.bind(this));
        
        this.onResize();

        // Skapa Brädet
        this.gameBoard = new Board();
        
        // Virus, buggar och antivirus skapas vid startGame(); 

        if (this.soundManager === undefined) {
            // skapa soundmanager om den inte redan finns
            this.soundManager = new SoundManager(this, this.gameBoard);
            // musik
            this.soundManager.playMusic();
        }
        
        // STORY 3
        // Skapa en indatahanterare med förmågan att ändra logik beroende på musklick
        this.inputHandler = new InputHandler(this, this.gameBoard);

        this.gameState = new GameState(this.gameBoard, 20000);
        this.queuePreference = QUEUE_PREFERENCE.ANY;
        
        this.ui.setSocket(socket);
        this.ui.setSoundManager(this.soundManager);
        this.ui.connectToGameState(this.gameState);
    }

    connectSocket() {
        // Only do this once, on website start
        socket.on(EVENTS.GAME_OVER, (virusWon, disconnect) => {
            if (!this.started) {
                // We have probably already left the game, don't show losescreen
                return;
            }
            // Play the sound effect

            this.soundManager.playWinLose(virusWon, this.isVirus); 
            this.ui.showWinScreen(virusWon);
     

            if (!disconnect && !this.isSpectator) {
                // Non-spectator
                return;
            }
            // Spectators and disconnec
            this.gameState.stopGame();
        })

        socket.on(EVENTS.GAME_FOUND, (data) => {  
            this.isVirus = data.isVirus;
            this.isSpectator = data.isSpectator !== undefined && data.isSpectator;
            this.startGame(data);
        });

        socket.on(EVENTS.VIRUS_MOVED, (nodeid, cp) => {
            this.gameState.getVirus().moveTo(this.gameBoard.getNode(nodeid));
            
            this.gameState.handleMove();

            // FIXA BUGGEN!
            if (!this.isVirus) {
                this.pendingTurn = "antivirus";
                setTimeout(() => {
                    if (this.pendingTurn === "antivirus") {
                        this.pendingTurn = null;
                        this.antivirusTurn();
                    }
                }, 50);
            }
        });

        socket.on(EVENTS.ANTIVIRUS_MOVED, (nodeid, selectedid, cp) => {
            this.gameState.getAntiVirus().selectedNode = this.gameBoard.getNode(selectedid)
            this.gameState.getAntiVirus().moveTo(this.gameBoard.getNode(selectedid), this.gameBoard.getNode(nodeid))

            this.gameState.handleMove();

            // FIXA BUGGEN!
            if (this.isVirus) {
                this.pendingTurn = "virus";
                setTimeout(() => {
                    if (this.pendingTurn === "virus") {
                        this.pendingTurn = null;
                        this.virusTurn();
                    }
                }, 50);
            }
            
            
        });

        socket.on(EVENTS.BUG_MOVED, (fromId, toId) => {
            const bugs = this.gameBoard.bugs;
            const fromNode = this.gameBoard.getNode(fromId);
            const toNode = this.gameBoard.getNode(toId);
            bugs.respawnBugAtNode(fromNode,toNode);

            // FIXA BUGGEN
            if (this.pendingTurn === "virus") {
                this.pendingTurn = null;
                this.virusTurn();
            } else if (this.pendingTurn === "antivirus") {
                this.pendingTurn = null;
                this.antivirusTurn();
            }
        });

        socket.on(EVENTS.TURN_TIMED_OUT, (cp) => {

            this.inputHandler.removeAllInput();

            if (cp !== this.gameState.currentPlayer) {
                this.gameState.changeTurn()
            }

            if (cp === 0 && this.isVirus) {
                this.virusTurn();
            } else if (cp === 1 && !this.isVirus) {
                this.antivirusTurn();
            }
            
        })

        socket.on(EVENTS.START_TUTORIAL, () => {
            this.ui.showTutorial();
        })

    }

    initUI() {
        // Only do this once, on website start
        this.ui = new GameUI(document.getElementById("ui"));
        this.ui.addEventListener(GameUI.EVENTS.LEAVE_GAME,this.leaveGame.bind(this));
        this.ui.addEventListener(GameUI.EVENTS.PAUSE, () => {
            this.inputHandler.tempRemoveInput();
        })
        
        this.ui.bgToggle = (checked) => {
            this.bgMovement = checked;
        };

        this.ui.addEventListener(GameUI.EVENTS.UNPAUSE, () => {
            this.inputHandler.addBackInput();
        })

        this.ui.addEventListener(GameUI.EVENTS.SPECTATE_NEXT, () => {
            this.leaveGame();
            this.ui.switchToQueue(false);
            setTimeout(() => {socket.emit(ACTIONS.SPECTATE_NEXT,this.gameID)},100);
        })
    }

    startGame(data) {
        // ----- LOGIK FÖR SLUMPA SPELKARTOR! -----
        // bygger brädet här istället för i create()
        BoardCreator.createFromJSON(this.gameBoard, data.mapData);
        // Skapa GameState efter att brädet är byggt
        this.gameState = new GameState(this.gameBoard, 20000);
        this.gameState.currentPlayer = data.currentPlayer;
        this.ui.connectToGameState(this.gameState);
        this.gameID = data.gameID;
        //------------------
        this.gameBoard.spawnVirus(
            data.virusNodes.map(id => this.gameBoard.getNode(id))
        );

        this.gameBoard.spawnAntivirus(
            data.antivirusNodes.map(id => this.gameBoard.getNode(id))
        );

        this.gameBoard.spawnStartBugs(
            data.bugNodes.map(id => this.gameBoard.getNode(id))
        );
        
        this.soundManager.connectToBoard(this.gameBoard);

        // Game has started, now we can create game drawer
        this.gameDrawer = new GameDrawer(this, this.gameBoard, this.inputHandler);

        this.ui.showGameStart(this.isVirus,this.isSpectator,data.currentPlayer == 0);

        this.started = true; 
        
        this.gameDrawer.draw(); 

        // Start timer
        this.gameState.startTimer(data.currentTimer);

        if (this.isVirus) {
            this.virusTurn();
        }

        this.onResize();
    }

    virusTurn() {
        if (this.isSpectator) {
            return;
        }
        this.inputHandler.removeAllInput();

        if (this.gameState.currentPlayer !== 0) return; // fixa bugg
        this.gameBoard.antivirus.selectedNode = null; // fixa bugg

        const valid = this.gameState.getVirus().getValidMoves()

        for (const node of valid) {
            this.inputHandler.addInput(node, (clicked) => {


                socket.emit(ACTIONS.VIRUS_MOVE, clicked.id)
                this.inputHandler.removeAllInput();
                
            })
        }
    }
    antivirusTurn() {
        if (this.isSpectator) {
            return;
        }
        
        if (this.gameState.currentPlayer !== 1) return; // fixa bugg

        const av = this.gameState.getAntiVirus();
        this.inputHandler.removeAllInput();

        av.getNodesToEnableInput(this.gameBoard).forEach(node => {
            this.inputHandler.addInput(node, (clicked) => {

                if (av.hasNode(clicked)) {
                    
                    //klick-ljud
                    this.soundManager.play('click');
                    
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

    update(time,delta) {
        if (this.gameDrawer) {
            // Animate the input circles
            this.gameDrawer.animate();
        }
        // Slowly scroll the background, multiply with delta to get it frame-rate independant
        if (this.bgMovement) {
            this.bg.tilePositionY -= 0.02*delta;
        }
    }
    
    
}


const config = {
    width: Math.ceil(window.innerWidth*window.devicePixelRatio),
    height: Math.ceil(window.innerHeight*window.devicePixelRatio),
    type: Phaser.AUTO,
    scale: {
            // Vi hanterar skalning manuellt
            mode: Phaser.Scale.NONE,
            autoCenter: Phaser.Scale.NO_CENTER,
    },
    parent: 'game',
    scene: Game
};

const game = new Phaser.Game(config);