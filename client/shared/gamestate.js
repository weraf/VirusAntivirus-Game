import { Board } from "./board.js"

export class GameState extends EventTarget {


    // Tänker här har vi funktioner, 
    constructor(board) {
        super()
        this.board = board;
        this.currentPlayer = 0; // 0 = virus 1 = antivirus? Virus startar?
        this.gameOver = false;
        this.turnTimer = null;

    }

    // CheckWin bör kolla om Virus har giltiga drag när det är Virus' tur, om AntiVirus inte har inga giltiga drag
    // kanske man skippar dess tur?
    // Skapa 
    checkWin() { // Ska väl kolla om virus har giltiga drag och det är virus' tur

        // this.board.virus.getValidMoves(); // Virus är egentligen en privat variabel enligt UML, detta ska inte gå
        // this.board.virus.getCoveredServerCount(); // Samma sak som ovan,
        // Detta är win conditions för respektive spelare


    }

    // 
    changeTurn() {

    }

    handleMove(player) {
        if (this.gameOver == true) {
            return
        }
    }  



}