// This file contains enums used for events that are shared between client and server

/**
 * An enum of all actions a user/player can take
 */
export const ACTIONS = {
    FIND_GAME: "find_game", // Looking for game (join the game queue). First argument "queueType", values in QUEUE_PREFERENCE
    STOP_FINDING_GAME: "stop_finding_game", // Left the looking for game queue
    DISCONNECT: "disconnect", // When the user disconnects
} 

/**
 * An enum of all the events a user can recieve. A.k.a. what events the server can send
 */
export const EVENTS = {
    GAME_FOUND: "game_found", // A match has been found. Arg 1: isVirus: bool (true if you are the virus player)
}

export const QUEUE_PREFERENCE = {
    ANY:"any",
    VIRUS:"virus",
    ANTIVIRUS:"antivirus",
}