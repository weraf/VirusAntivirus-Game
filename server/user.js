import { Socket } from "socket.io";
import EventEmitter from "node:events";

// User is a wrapper of socket, so we can add data like username
export class User extends EventEmitter {
    /**
     * @type {Socket}
     */
    socket;

    username = "Player";
    
    constructor(socket) {
        super();
        this.socket = socket;
        this.socket.onAny(this.gotEvent)

        // Forward the special disconnect event
        this.socket.on("disconnect", (reason) => {super.emit("disconnect",reason)})
        this.username = this.getRandomUsername();
    }

    getRandomUsername() {
        return "Player"+(Math.floor(Math.random()*1000)).toString();
    }

    gotEvent(eventName, ...args) {
        // Call the real event emitter function
        console.log("Got event", eventName)
        super.emit(eventName,...args);
    }

    emit(eventName, ...args) {
        this.socket.emit(eventName, ...args)
    }

}