import { Server as SocketServer, Socket } from "socket.io";
import { User } from "./user.js";
import { LobbyHandler } from "./lobbyhandler.js";
import { ACTIONS } from "../client/shared/enums.js";

/**
 * io är websocket servern
 * @type {Socket}
 */
let io;

const lobbyHandler = new LobbyHandler()

let users = [];

export function startSocketServer(httpServer) {
    io = new SocketServer(httpServer)
    io.on("connection", newConnection)
}

/**
 * 
 * @param {Socket} socket 
 */
function newConnection(socket) {
    console.log("New client connected!")
    const newUser = new User(socket)
    users.push(newUser)
    newUser.on(ACTIONS.DISCONNECT,userDisconnected.bind(this, newUser))
    newUser.on(ACTIONS.FIND_GAME,() => {lobbyHandler.addUserToQueue(newUser)})
}

function userDisconnected(user, reason) {
    // Remove the user from the user array
    users = users.filter((u) => {return u != user})
    console.log("Client disconnected")
}
