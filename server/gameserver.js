import { Player } from "./player.js";
import { AIPlayer } from "./aiplayer.js"; 
import { ACTIONS, EVENTS } from "../client/shared/enums.js";
import { GameState } from "../client/shared/gamestate.js"
import { Board } from "../client/shared/board.js";
import EventEmitter from "node:events";
import { BoardCreator } from "../client/shared/boardCreator.js";


import map1 from "../client/assets/map1.json" with { type: 'json' }; // 33 noder: 3 servrar
import map2 from "../client/assets/map2.json" with { type: 'json' }; // 44 noder: 4 servrar
import map3 from "../client/assets/map3.json" with { type: 'json' }; // 41 noder: 3 servrar
const ALL_MAPS = [map1, map2, map3];


import { Bugs } from "../client/shared/bugs.js";

// Class for handling the flow and events of a match
export class GameServer extends EventEmitter {
    virusP; // Player instance that plays virus
    antivirusP; // Player instance that plays antivirus
    gameState;
    spectators = []; // Array of user instances that are spectating
    pendingBugMovements = [];

    id = 0;
    
    // Emitted when the game should be removed from the active games list
    static SIGNAL_GAME_FINISHED = "game_finished" 
    
    /**
     * 
     * @param {Player} virusPlayer 
     * @param {Player} antiVirusPlayer 
     */
    constructor(virusPlayer, antiVirusPlayer, gameID) {
        super();
        this.id = gameID;
        
        // ----- LOGIK FÖR SLUMPA SPELKARTOR! -----
        this.currentMap = ALL_MAPS[Math.floor(Math.random() * ALL_MAPS.length)];
        console.log("Game started with random map!");

        this.virusP = virusPlayer;
        this.virusP.setVirus();
        this.antivirusP = antiVirusPlayer;
        this.virusReady = false;
        this.antivirusReady = false;
        this.gameStarted = false;

        const board = new Board();
        // ----- LOGIK FÖR SLUMPA SPELKARTOR! -----
        BoardCreator.createFromJSON(board, this.currentMap);
        // --------------

        // Hardcoded positions for now
        board.spawnVirus();
        board.spawnAntivirus();
        board.spawnStartBugs();

        // Här skickar vi och startar inte game förrän skit

        console.log("New game created");

        this.virusP.on(ACTIONS.READY, () => {
            if (!this.virusReady) {
                this.virusReady = true;
                this.tryGameStart();
            }

        })

        this.antivirusP.on(ACTIONS.READY, () => {
            if (!this.antivirusReady) {
                this.antivirusReady = true;
                this.tryGameStart();
            }
        })

        // Below is commented because it is used as a template for above code snippet
        //this.virusP.on(ACTIONS.DISCONNECT,this.playerLeft.bind(this,this.virusP));
        //this.virusP.on(ACTIONS.LEAVE_GAME,this.playerLeft.bind(this,this.virusP));

        this.gameState = new GameState(board, 20000);

        this.sendTutorialStart();
        // --------------------------- AI IMPLEMENTATION ---------------------------
        if (this.virusP instanceof AIPlayer)     this.virusP.board = board;
        if (this.antivirusP instanceof AIPlayer) this.antivirusP.board = board;
        // -------------------------------------------------------------------------

        // use events to not start timer/input and wait until both players have
        // clicked on a ready button when they have read the rules ?

        //this.gameState.startTimer(); //
        

        this.gameState.addEventListener(GameState.EVENTS.TIMED_OUT, () => {
            this.emitAll(EVENTS.TURN_TIMED_OUT, this.gameState.currentPlayer);
        });
        
        this.gameState.addEventListener(GameState.EVENTS.GAME_OVER, (e) => {
            const virusWon = e.detail;

            this.emitAll(EVENTS.GAME_OVER, virusWon, false);
            this.gameFinished();
        });
        
        // Make the bugs move when stepped on, then listen to this movement
        this.gameState.board.connectBugListeners();                                 // Can it cause issues when syncing? Maybe
        this.gameState.board.bugs.addEventListener(Bugs.EVENTS.BUG_MOVED, (e) => {
            // We can't emit to client directly since that would place it before the move event,
            // resulting in the client snake not noticing that it should grow (since the bug is already moved)
            this.pendingBugMovements.push({from:e.detail.from.id, to:e.detail.to.id});
        });

        // If either player disconnect/leaves, the game is over and can be removed from the server
        this.virusP.on(ACTIONS.DISCONNECT,this.playerLeft.bind(this,this.virusP));
        this.virusP.on(ACTIONS.LEAVE_GAME,this.playerLeft.bind(this,this.virusP));
        this.antivirusP.on(ACTIONS.DISCONNECT,this.playerLeft.bind(this,this.antivirusP));
        this.antivirusP.on(ACTIONS.LEAVE_GAME,this.playerLeft.bind(this,this.antivirusP));

        // Add other events here'

        // Antivirus move
        this.antivirusP.on(ACTIONS.ANTIVIRUS_MOVE, (selectedid, nodeid) => {
            if (this.gameState.gameOver) return;
            if (this.gameState.currentPlayer !== 1) return;

            const success = this.gameState.board.antivirus.moveTo(
                this.gameState.board.getNode(nodeid),
                this.gameState.board.getNode(selectedid)
            );
            if (!success) {
                this.antivirusP.emit(EVENTS.INVALID_MOVE);
                return;
            }

            this.emitAll(EVENTS.ANTIVIRUS_MOVED, selectedid, nodeid, this.gameState.currentPlayer);
            this.sendBugUpdates();
            this.gameState.handleMove();
        });

        // Virus move
        this.virusP.on(ACTIONS.VIRUS_MOVE, (nodeid) => {
            if (this.gameState.gameOver) return;
            if (this.gameState.currentPlayer !== 0) return;

            const success = this.gameState.board.virus.moveTo(this.gameState.board.getNode(nodeid));
            if (!success) {
                this.virusP.emit(EVENTS.INVALID_MOVE);
                return;
            }
            this.emitAll(EVENTS.VIRUS_MOVED, nodeid, this.gameState.currentPlayer);
            this.sendBugUpdates();
            this.gameState.handleMove();
        });
    }

    sendBugUpdates() {
        for (const bugMove of this.pendingBugMovements) {
            this.emitAll(EVENTS.BUG_MOVED, bugMove.from, bugMove.to);
        }
        this.pendingBugMovements = []; // clear the array
    }

    playerLeft(player) {
        this.emitAll(EVENTS.GAME_OVER, !player.isVirus, true); // Send to players that game is over. The other person won
        this.gameFinished();
    }

    addSpectator(spectator) {
        this.spectators.push(spectator);
        const specData = {
            ...this.gameState.getSerializedState(),
            mapData: this.currentMap,
            ...this.getSerializedData(),
            isSpectator: true,
            isVirus: false,
        }
        const removeSpecFunc = this.removeSpectator.bind(this,spectator);
        spectator.on(ACTIONS.DISCONNECT,removeSpecFunc);
        spectator.on(ACTIONS.LEAVE_GAME,removeSpecFunc);
        // Save reference so we can disconnect these specific functions
        spectator.removeSpecFunc = removeSpecFunc;
        spectator.emit(EVENTS.GAME_FOUND,specData);
    }
    
    removeSpectator(spectator) {
        this.spectators = this.spectators.filter((s) => {return s != spectator});
        spectator.removeListener(ACTIONS.DISCONNECT,spectator.removeSpecFunc);
        spectator.removeListener(ACTIONS.LEAVE_GAME,spectator.removeSpecFunc);
        spectator.removeSpecFunc = undefined; // unset
        if (this.virusP instanceof AIPlayer && this.antivirusP instanceof AIPlayer) {
            // Spelare har slutat spectata AIvsAI match
            if (this.spectators.length == 0) {
                // Ingen kollar längre på denna AIvsAI match, avbryt matchen
                this.gameFinished();
            }
        }
    }

    // Sends an event to both players (and spectators)
    emitAll(eventName, ...args) {
        this.virusP.emit(eventName,...args);
        this.antivirusP.emit(eventName,...args);
        for (const spec of this.spectators) {
            spec.emit(eventName,...args);
        }
    }

    gameFinished() {
        // The lobbyhandler listens to this and removed the GameServer instance from the games array
        this.emit(GameServer.SIGNAL_GAME_FINISHED);
        
        if (!this.gameState.gameOver) {
            this.gameState.stopGame();
        }

        // Remove connected events
        for (const spec of this.spectators) {
            this.removeSpectator(spec);
        } 
        
        for (const player of [this.virusP,this.antivirusP]) {
            // This player instance is only used on this gameserver.
            // Disconnect so we can't get messages after the game is over
            player.removeAllListeners(); 
        }
    }

    getSerializedData() {
        const data = this.gameState.getSerializedState();
        data["mapData"] = this.currentMap;
        data["gameID"] = this.id;
        return data;
    }

    sendGameStart() {
        const data = this.getSerializedData();

        const virusData = {
            ...data,
            mapData: this.currentMap, // --------- LOGIK FÖR ATT SLUMPA KARTOR!
            isVirus: true,
        };

        const antivirusData = {
            ...data,
            mapData: this.currentMap, // --------- LOGIK FÖR ATT SLUMPA KARTOR!
            isVirus: false,
        };
    
        this.virusP.emit(EVENTS.GAME_FOUND, virusData);
        this.antivirusP.emit(EVENTS.GAME_FOUND, antivirusData);
    }

    tryGameStart() {
        if (this.virusReady === true && this.antivirusReady === true && this.gameStarted === false) {
            this.gameStarted = true;

            this.sendGameStart()
            this.gameState.startTimer();

        }
    }

    sendTutorialStart() {
        this.emitAll(EVENTS.START_TUTORIAL);
    }


    
}