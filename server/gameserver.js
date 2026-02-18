import { Player } from "./player.js";
import { ACTIONS, EVENTS } from "../client/shared/enums.js";
import { GameState } from "../client/shared/gamestate.js"
import { Board } from "../client/shared/board.js";
import EventEmitter from "node:events";
import { BoardCreator } from "../client/shared/boardCreator.js";

//---- HÄR KAN MAN LÄGG IN NYA BRÄDOR! ------
import mapData from "../client/assets/map1.json" with { type: 'json' }; // 33 Nodes: 3 Servers!
//import mapData from "../client/assets/map2.json" with { type: 'json' }; // 44 Nodes: 4 Servers!

import { Bugs } from "../client/shared/bugs.js";

// Class for handling the flow and events of a match
export class GameServer extends EventEmitter {
    virusP; // Player instance that plays virus
    antivirusP; // Player instance that plays antivirus
    gameState;
    spectators = []; // Array of user instances that are spectating
    pendingBugMovements = [];
    
    // Emitted when the game should be removed from the active games list
    static SIGNAL_GAME_FINISHED = "game_finished" 
    
    /**
     * 
     * @param {Player} virusPlayer 
     * @param {Player} antiVirusPlayer 
     */
    constructor(virusPlayer, antiVirusPlayer) {
        super();
        console.log("Game started!")
        this.virusP = virusPlayer;
        this.virusP.setVirus();
        this.antivirusP = antiVirusPlayer;

        const board = new Board();

        BoardCreator.createFromJSON(board, mapData);

        // Hardcoded positions for now
        board.spawnVirus();
        board.spawnAntivirus();
        board.spawnStartBugs();

        this.gameState = new GameState(board, 20000);

        // Skicka initial state till båda spelarna
        this.sendGameStart();

        this.gameState.addEventListener(GameState.EVENTS.TIMED_OUT, () => {
            this.emitAll(EVENTS.TURN_TIMED_OUT, this.gameState.currentPlayer);
        });
        
        this.gameState.addEventListener(GameState.EVENTS.GAME_OVER, (e) => {
            this.emitAll(EVENTS.GAME_OVER, e.detail);
            this.gameFinished();
        });
        
        // Make the bugs move when stepped on, then listen to this movement
        this.gameState.board.connectBugListeners();
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

        this.antivirusP.on(ACTIONS.ANTIVIRUS_MOVE, (selectedid, nodeid) => {
            if (this.gameState.gameOver) return;
            if (this.gameState.currentPlayer !== 1) return;

            const success = this.gameState.board.antivirus.moveTo(this.gameState.board.getNode(nodeid), this.gameState.board.getNode(selectedid));
            if (!success) {
                this.antivirusP.emit(EVENTS.INVALID_MOVE);
                return;
            }

            this.emitAll(EVENTS.ANTIVIRUS_MOVED, selectedid, nodeid);
            this.sendBugUpdates();
            this.gameState.handleMove();
        });

        this.virusP.on(ACTIONS.VIRUS_MOVE, (nodeid) => {
            if (this.gameState.gameOver) return;
            if (this.gameState.currentPlayer !== 0) return;

            const success = this.gameState.board.virus.moveTo(this.gameState.board.getNode(nodeid));
            if (!success) {
                this.virusP.emit(EVENTS.INVALID_MOVE);
                return;
            }

            this.emitAll(EVENTS.VIRUS_MOVED, nodeid);
            this.sendBugUpdates(); // This needs to be after virus moved
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
        // TODO: message players
        this.gameFinished()
    }

    addSpectator(spectator) {
        this.spectators.push(spectator);
        const specData = {
            ...this.gameState.getSerializedState(),
            isSpectator: true,
            isVirus: false,
        }
        spectator.on(ACTIONS.DISCONNECT,this.removeSpectator.bind(this,spectator))
        spectator.on(ACTIONS.LEAVE_GAME,this.removeSpectator.bind(this,spectator))
        spectator.emit(EVENTS.GAME_FOUND,specData)
    }
    
    removeSpectator(spectator) {
        this.spectators = this.spectators.filter((s) => {return s != spectator});
        spectator.removeListener(ACTIONS.DISCONNECT,this.removeSpectator.bind(this,spectator))
        spectator.removeListener(ACTIONS.LEAVE_GAME,this.removeSpectator.bind(this,spectator))
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
    }

    sendGameStart() {
        const data = this.gameState.getSerializedState();

        const virusData = {
            ...data,
            isVirus: true
        };

        const antivirusData = {
            ...data,
            isVirus: false
        };
    
        this.virusP.emit(EVENTS.GAME_FOUND, virusData);
        this.antivirusP.emit(EVENTS.GAME_FOUND, antivirusData);
    }
    
}