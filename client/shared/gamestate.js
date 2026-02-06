

export class GameState extends EventTarget {

    constructor(board, timerLength) {
        super()
        this.board = board;
        this.currentPlayer = 0; // 0 = virus 1 = antivirus? Virus startar?
        this.gameOver = false;
        this.timerLength = timerLength; // ms
        this.timer = null;
        this.winner = null;

    }


    checkWin() { 

        if (this.board.virus.getServerCount >= 2) {
            this.gameOver = true;
            this.winner = 0;
        } else {
            if (this.board.virus.getValidMoves().length == 0) {
                this.gameOver = true;
                this.winner = 1;
            }
        }



    }

    gameOver() {
        

    }

    startTimer() {
        this.timer = setTimeout(() => this.changeTurn(), this.timerLength);    
    }

    // 
    changeTurn() {
        this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
        console.log("Current player", this.currentPlayer)
        this.timer = clearTimeout();
        this.startTimer()

    }

    handleMove() {
        if (this.gameOver == true) {
            return
        }

        this.changeTurn()
    }

    // extra tid på serversida är bra 😃👍
}