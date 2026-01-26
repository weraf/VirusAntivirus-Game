import {EventEmitter} from "node:events";
import {User} from "./user.js";

export class LobbyHandler extends EventEmitter {
    queue = []
    games = []

    /**
     * 
     * @param {User} user 
     */
    addUserToQueue(user) {
        this.queue.push(user);
        if (this.queue.length >= 2) {
            const user1 = this.queue.pop();
            const user2 = this.queue.pop();
            user1.emit("game_found");
            user2.emit("game_found");
        }
    }
}