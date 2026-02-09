import { Player } from "./player.js";
import { ACTIONS, EVENTS } from "../client/shared/enums.js";
import { GameState } from "../client/shared/gamestate.js"
import { Board } from "../client/shared/board.js";
import EventEmitter from "node:events";

// Class for handling the flow and events of a match
export class GameServer extends EventEmitter {
    virusP; // Player instance that plays virus
    antivirusP; // Player instance that plays antivirus
    gameOver = false;
    gameState;
    
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
        this.virusP.emit(EVENTS.GAME_FOUND,true);
        this.antivirusP.emit(EVENTS.GAME_FOUND,false);

        const board = new Board();
        this.gameState = new GameState(board, 20000);

        this.gameState.addEventListener(GameState.EVENTS.TIMED_OUT, () => {
            this.emitAll(EVENTS.TURN_TIMED_OUT, this.gameState.currentPlayer);
        });
        
        this.gameState.addEventListener(GameState.EVENTS.GAME_OVER, (e) => {
            this.emitAll(EVENTS.GAME_OVER, e.detail);
            this.gameFinished();
        });

        // If either player disconnect, the game is over and can be removed from the server
        // TODO: send message to players that opponent disconnected
        this.virusP.on(ACTIONS.DISCONNECT,this.gameFinished.bind(this))
        this.antivirusP.on(ACTIONS.DISCONNECT,this.gameFinished.bind(this))

        // Add other events here'

        this.antivirusP.on(ACTIONS.ANTIVIRUS_MOVE, (nodeid, selectedid) => {
            if (this.gameState.gameOver) return;
            if (this.gameState.currentPlayer !== 1) return;

            const success = this.gameState.board.antivirus.moveTo(nodeId, selectedid);
            if (!success) {
                this.antivirusP.emit(EVENTS.INVALID_MOVE);
                return;
            }

            this.emitAll(EVENTS.ANTIVIRUS_MOVE, nodeid, selectedid)
            this.gameState.handleMove();
        })

        this.virusP.on(ACTIONS.VIRUS_MOVE, (nodeid) => {
            if (this.gameState.gameOver) return;
            if (this.gameState.currentPlayer !== 0) return;

            const success = this.gameState.board.virus.moveTo(nodeId, selectedid);
            if (!success) {
                this.virusP.emit(EVENTS.INVALID_MOVE);
                return;
            }

            this.emitAll(EVENTS.VIRUS_MOVE, nodeid)
            this.gameState.handleMove();
        });

        

    }

    //testFunction(who) {
    //    console.log("Move made by", who);
    //}


    // Sends an event to both players (and spectators)
    emitAll(eventName, ...args) {
        this.virusP.emit(eventName,...args);
        this.antivirusP.emit(eventName,...args);
        // TODO: Send to spectators
    }


    gameFinished() {
        if (this.gameOver) {
            return;
        }
        this.gameOver = true;
        // The lobbyhandler listens to this and removed the GameServer instance from the games array
        this.emit(GameServer.SIGNAL_GAME_FINISHED);
    }


}