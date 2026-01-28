import {EventEmitter} from "node:events";
import {User} from "./user.js";
import { ACTIONS, EVENTS } from "../client/shared/enums.js";
import { GameServer } from "./gameserver.js";
import { Player } from "./player.js";

export class LobbyHandler extends EventEmitter {
    queue = []
    games = []

    /**
     * 
     * @param {User} user 
     */
    addUserToQueue(user) {
        this.queue.push(user);
        // If a user disconnects while in the queue, remove the user from the queue 
        user.on(ACTIONS.DISCONNECT,this.removeUserFromQueue.bind(this,user));
        // If a user sends action to stop searching for games, 
        user.on(ACTIONS.STOP_FINDING_GAME,this.removeUserFromQueue.bind(this,user));
        
        if (this.queue.length >= 2) {
            // Take the first two users in the queue and remove them
            const user1 = this.removeUserFromQueue(this.queue[0]);
            const user2 = this.removeUserFromQueue(this.queue[0]);
            
            this.createGame(user1,user2)
        }
    }

    createGame(user1,user2) {
        const p1 = new Player(user1);
        const p2 = new Player(user2);
        const newGame = new GameServer(p1,p2);
        this.games.push(newGame);
        // Remove the game from the active games array when the game is finished
        newGame.on(GameServer.SIGNAL_GAME_FINISHED,this.gameFinished.bind(this,newGame))
    }

    gameFinished(game) {
        this.games = this.games.filter((g) => {return g != game});
        console.log("Game finished")
    }

    removeUserFromQueue(user) {
        user.removeListener(ACTIONS.DISCONNECT,this.removeUserFromQueue.bind(this,user))
        user.removeListener(ACTIONS.STOP_FINDING_GAME,this.removeUserFromQueue.bind(this,user))
        this.queue = this.queue.filter((u) => {return u != user});
        return user // Returns the user that got removed
    }
}