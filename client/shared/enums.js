// This file contains enums used for events that are shared between client and server

/**
 * An enum of all actions a user/player can take
 */
export const ACTIONS = {
    FIND_GAME: "find_game", // Looking for game (join the game queue). First argument "queueType", values in QUEUE_PREFERENCE
    STOP_FINDING_GAME: "stop_finding_game", // Left the looking for game queue
    DISCONNECT: "disconnect", // When the user disconnects
    MAKE_MOVE: "make_move", // When the user makes a move // test
    TEST_ACTION: "test_action", //
    VIRUS_MOVE: "virus_move", // test virus make move
    ANTIVIRUS_MOVE: "antivirus_move", // antivirus move
} 

/**
 * An enum of all the events a user can recieve. A.k.a. what events the server can send
 */
export const EVENTS = {
    GAME_FOUND: "game_found", // A match has been found. Arg 1: isVirus: bool (true if you are the virus player)
    UPDATE_BOARD: "update_board", // The board has been changed // may need to be split into virus moved, antivirus moved
    START_TIMER: "start_timer", // 
    VMOVE_SERVER: "VMOVE_SERVER", // a move has been made /& test
    AVMOVE_SERVER: "AVMOVE_SERVER", //
}

export const QUEUE_PREFERENCE = {
    ANY:"any",
    VIRUS:"virus",
    ANTIVIRUS:"antivirus",
}