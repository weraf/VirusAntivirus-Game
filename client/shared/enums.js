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
    SPECTATE_GAME: "spectate_game", // When client wants to spectate a game
    LEAVE_GAME: "leave_game", // When a player/spectator want to leave
} 

/**
 * An enum of all the events a user can recieve. A.k.a. what events the server can send
 */
export const EVENTS = {
    GAME_FOUND: "game_found", // A match has been found. Arg 1: isVirus: bool (true if you are the virus player)
    GAME_OVER: "game_over", // the game has finished. Arg 1: virusWon: true/false, Arg 2: disconnect: bool (true if the win was caused by a disconnect)   
    INVALID_MOVE: "invalid_move", // The player made an invalid move, try again
    UPDATE_BOARD: "update_board", // The board has been changed // may need to be split into virus moved, antivirus moved
    START_TIMER: "start_timer", // 
    TURN_TIMED_OUT: "turn_timed_out", // The current player took too long to make a move, their turn is over. Arg 1: player: int (0 for virus, 1 for antivirus)
    VIRUS_MOVED: "virus_moved", // a move has been made /& test
    ANTIVIRUS_MOVED: "antivirus_moved", //
    BUG_MOVED: "bug_moved",
}

export const QUEUE_PREFERENCE = {
    ANY:"any",
    VIRUS:"virus",
    ANTIVIRUS:"antivirus",
    // ---------------- AI IMPLEMENTATION ------------------
    AI_AS_VIRUS: "ai_as_virus",
    AI_AS_ANTIVIRUS: "ai_as_antivirus",
    AI_VS_AI: "ai_vs_ai", // Spectate AI vs AI
    // -----------------------------------------------------
}