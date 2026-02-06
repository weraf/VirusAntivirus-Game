
export class GameState extends EventTarget {

    constructor(board, timerLength) {
        super()
        this.board = board;
        this.currentPlayer = 0; // 0 = virus 1 = antivirus. Virus startar?
        this.gameOver = false;
        this.timerLength = timerLength; // ms
        this.timer = null;
        this.winner = null;

    }


    // Checks board to see if 
    checkWin() { 
        if (this.board.virus.getServerCount >= 2) {
            this.gameOver = true;
            this.winner = 0;

        } else if (this.board.virus.getValidMoves().length === 0 && this.currentPlayer === 0) {
            this.gameOver = true;
            this.winner = 1;

        } else if (this.board.antivirus.getValidMoves().length === 0 && this.currentPlayer === 1) {
            this.gameOver = true;
            this.winner = 0;
        }
    }

    getVirus() {
        return this.board.virus;
    }

    getAntiVirus() {
        return this.board.antivirus;
    }


    // Startar en timer this.timerLength ms lång
    startTimer() {
        this.timer = setTimeout(() => this.timedOut(), this.timerLength);    
    }

    // Byter internt this.currentPlayer, clearar timer, startar ny timer
    changeTurn() {
        this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
        this.timer = clearTimeout();
        this.startTimer()
    }

    // GameServer kan väl plocka upp detta eventet, skicka till båda spelarna och servern en changeTurn grej
    timedOut() {
        this.dispatchEvent(new Event('timedOut'))
    }

    // När ett drag gjorts kollar vi om någon vunnit, om någon vunnit dispatchar vi event, annars byter vi tur
    handleMove() {
        this.checkWin();

        if (this.gameOver === true) {
            this.dispatchEvent(new CustomEvent('gameOver', {
                detail: this.winner
            }));
            this.timer = clearTimeout();
            return;
        }

        this.changeTurn();
    }
}