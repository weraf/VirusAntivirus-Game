import { Player } from "./player.js";
import { ACTIONS, EVENTS } from "../client/shared/enums.js";
import EventEmitter from "node:events";

// Class for handling the flow and events of a match
export class GameServer extends EventEmitter {
    virusP; // Player instance that plays virus
    antivirusP; // Player instance that plays antivirus
    gameOver = false;

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

        // If either player disconnect, the game is over and can be removed from the server
        // TODO: send message to players that opponent disconnected
        this.virusP.on(ACTIONS.DISCONNECT,this.gameFinished.bind(this))
        this.antivirusP.on(ACTIONS.DISCONNECT,this.gameFinished.bind(this))
    }

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