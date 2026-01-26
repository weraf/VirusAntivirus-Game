import { Socket } from "socket.io";
import EventEmitter from "node:events";

/**
 * User is a wrapper for socket.
 * Use user.emit(event, data) to send things to this user
 * Use user.on(event, callback) to trigger a callback when the socket receives data
 */
export class User extends EventEmitter {
    /**
     * @type {Socket}
     */
    socket;

    username = "Player";
    
    constructor(socket) {
        super();
        this.socket = socket;
        this.socket.onAny(this.gotEvent.bind(this))

        // Forward the special disconnect event
        this.socket.on("disconnect", (reason) => {super.emit("disconnect",reason)})
        this.username = this.getRandomUsername();
    }

    getRandomUsername() {
        return "Player"+(Math.floor(Math.random()*1000)).toString();
    }

    gotEvent(eventName, ...args) {
        // Call the real event emitter function
        super.emit(eventName,...args);
        //console.log("Got event", eventName, ...args)
        
    }

    // Overrides the default event emitter emit function with the socket behavior instead.
    // This function sends an event to the client
    emit(eventName, ...args) {
        // Don't send a event emitter event, send to the client instead
        this.socket.emit(eventName, ...args)
    }

}