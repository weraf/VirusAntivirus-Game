import EventEmitter from "node:events";
import { User } from "./user.js";
import { ACTIONS } from "../client/shared/enums.js";

export class Player extends EventEmitter {
    user
    isVirus = false // False as standard
    /**
     * 
     * @param {User} user 
     */
    constructor(user) {
        super();
        this.user = user;
        // We connect directly to the socket since User doesn't have a "onAny" of it's own
        this.user.socket.onAny(this.gotEvent.bind(this))
        // Connect the special disconnect event
        this.user.on(ACTIONS.DISCONNECT,this.gotEvent.bind(this,ACTIONS.DISCONNECT))
    }

    /**
     * Marks this player as a virus player
     */
    setVirus() {
        this.isVirus = true;
    }

    gotEvent(eventName, ...args) {
        // Call the real event emitter function
        super.emit(eventName,...args);
        
    }

    // Overrides the default event emitter emit function with the socket behavior instead.
    // This function sends an event to the client
    emit(eventName, ...args) {
        // Don't send a event emitter event, send to the user instead
        this.user.emit(eventName, ...args)
    }
}