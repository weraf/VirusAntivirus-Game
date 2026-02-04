import { Player } from "./player.js";
import { ACTIONS, EVENTS } from "../client/shared/enums.js";
import { GameState } from "../client/shared/gamestate.js"
import EventEmitter from "node:events";

// Class for handling the flow and events of a match
export class GameServer extends EventEmitter {
    p1;
    p2;
    gameOver = false; // GameServer ska kolla på GameStates gameover

    // Emitted when the game should be removed from the active games list
    static SIGNAL_GAME_FINISHED = "game_finished" 
    
    /**
     * 
     * @param {Player} player1 
     * @param {Player} player2 
     */
    constructor(player1, player2, gameState) {
        super();
        console.log("Game started!")
        this.p1 = player1;
        this.p2 = player2;
        // this.gameState = gameState; // Kan läggas till senare
        this.emitAll(EVENTS.GAME_FOUND);

        // If either player disconnect, the game is over and can be removed from the server
        // TODO: send message to players that opponent disconnected
        this.p1.on(ACTIONS.DISCONNECT,this.gameFinished.bind(this))
        this.p2.on(ACTIONS.DISCONNECT,this.gameFinished.bind(this))
    }

    // Sends an event to both players (and spectators)
    emitAll(eventName, ...args) {
        this.p1.emit(eventName,...args);
        this.p2.emit(eventName,...args);
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