import {EventEmitter} from "node:events";
import {User} from "./user.js";
import { ACTIONS, EVENTS } from "../client/shared/enums.js";
import { GameServer } from "./gameserver.js";
import { Player } from "./player.js";


export class LobbyHandler extends EventEmitter {
    queue = new GameQueue();
    games = []

    /**
     * 
     * @param {User} user 
     */
    addUserToQueue(user,queueType) {
        console.log("User queue type",queueType)
        switch (queueType) {
            case "virus":
                this.queue.addUserToVirusQueue(user);
                break;
            case "antivirus":
                this.queue.addUserToAntiVirusQueue(user);
                break;
            case "any":
                this.queue.addUserToAnyQueue(user);
                break;
        }
        
        const match = this.queue.getMatchablePlayers();
        if (match.matchFound) {
            
            this.createGame(match.virusUser,match.antiVirusUser)
        }
        
    }

    createGame(virusUser,antiVirusUser) {
        const p1 = new Player(virusUser);
        const p2 = new Player(antiVirusUser);
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

// Helper class for dealing with the three different types of queue: virus, antivirus and either
class GameQueue {
    virusQueue = [];
    antiVirusQueue = [];
    anyQueue = [];

    /**
     * Helper function used by the other addUserToXQueue functions
     * @param {User} user 
     * @param {*} queue 
     */
    addUser(user,queue) {
        queue.push(user);
        // If a user disconnect, remove from queue
        user.on(ACTIONS.DISCONNECT,this.removeUserFromQueue.bind(this,user));
        // If a user sends action to stop searching for games, remove from queue
        user.on(ACTIONS.STOP_FINDING_GAME,this.removeUserFromQueue.bind(this,user));
    }

    /**
     * Information about a two players starting a game.
     * @typedef {Object} QueueMatch
     * @property {boolean} matchFound - If a match was found
     * @property {User} virusUser - The User playing virus
     * @property {User} antiVirusUser - The User playing antivirus
     */
    /**
     * Returns users if we can start a match between them and removes them from the queue
     * @returns {QueueMatch}
     */
    getMatchablePlayers() {
        let virusUser = null;
        let antiVirusUser = null;
        if (this.anyQueue.length >= 2) {
            virusUser = this.anyQueue[0];
            antiVirusUser = this.anyQueue[1];
        } else {
            // Fill from picked arrays
            if (this.virusQueue.length > 0) {
                virusUser = this.virusQueue[0];
            }
            if (this.antiVirusQueue.length > 0) {
                antiVirusUser = this.antiVirusQueue[0];
            }
            // Fill remaining slot if empty
            if (this.anyQueue.length > 0) {
                if (!virusUser) {
                    virusUser = this.anyQueue[0]
                } else if (!antiVirusUser) {
                    antiVirusUser = this.anyQueue[0]
                }
            }
        }
        
        if (virusUser && antiVirusUser) {
            // Found a user of both types
            // Remove them from queue and return the match
            this.removeUserFromQueue(virusUser);
            this.removeUserFromQueue(antiVirusUser);
            return {"matchFound": true, "virusUser":virusUser, "antiVirusUser":antiVirusUser};
        }
        // Didn't find a match
        return {"matchFound": false};
    }


    addUserToVirusQueue(user) {
        this.addUser(user,this.virusQueue);
    }
    addUserToAntiVirusQueue(user) {
        this.addUser(user,this.antiVirusQueue);
    }
    addUserToAnyQueue(user) {
        this.addUser(user,this.anyQueue);
    }
    removeUserFromQueue(user) {
        user.removeListener(ACTIONS.DISCONNECT,this.removeUserFromQueue.bind(this,user))
        user.removeListener(ACTIONS.STOP_FINDING_GAME,this.removeUserFromQueue.bind(this,user))
        this.virusQueue = this.virusQueue.filter((u) => {return u != user});
        this.antiVirusQueue = this.antiVirusQueue.filter((u) => {return u != user});
        this.anyQueue = this.anyQueue.filter((u) => {return u != user});
        return user;
    }
}