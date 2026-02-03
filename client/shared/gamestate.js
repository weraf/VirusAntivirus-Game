

export class GameState extends EventTarget {

    constructor() {
        super()
        this.currentPlayer = 0; // 0 = virus 1 = antivirus? Virus startar?
        this.gameOver = false;

    }

    checkWin() {

    }

    handleMove(player) {
        if (this.gameOver == true) {
            return
        }
    }  
}