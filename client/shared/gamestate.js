
export class GameState extends EventTarget {

    static EVENTS = {
        TIMED_OUT: "timed_out",
        GAME_OVER: "game_over",
        UPDATE_TIMER: "update_timer",
        TURN_CHANGED: "turn_changed",
    }

    constructor(board, timerLength) {
        super()
        this.board = board;
        this.currentPlayer = 0; // 0 = virus 1 = antivirus. Virus startar?
        this.gameOver = false;
        this.timerLength = timerLength; // ms
        this.timer = null;
        this.winner = null;
        this.time = timerLength/1000; // hela sekunder
        this.displayInterval = null;
        this.timeLeft = this.timerLength / 1000; // i sekunder
        this.tutorialFinished = false;

    }


    // Checks board to see if 
    checkWin() { 
        if (this.board.virus.getCoveredServerCount() >= 2) {
            this.gameOver = true;
            this.winner = 0;

        } else if (!this.board.virus.hasAnyValidMove() && this.currentPlayer === 0) {
            this.gameOver = true;
            this.winner = 1;

        } else if (!this.board.antivirus.hasAnyValidMove() && this.currentPlayer === 1) {
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
        clearTimeout(this.timer);
        clearInterval(this.displayInterval);
    
        this.startTime = Date.now(); // viktigt att detta uppdateras
        this.timeLeft = this.timerLength / 1000; // reset kvarvarande tid
    
        this.timer = setTimeout(() => this.timedOut(), this.timerLength);
    
        this.displayInterval = setInterval(() => this.updateTimerDisplay(), 1000);
        this.updateTimerDisplay(); // första visningen direkt
    }


    updateTimerDisplay() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        const seconds = Math.max(0, Math.ceil(this.timeLeft - elapsed));
    
        this.dispatchEvent(new CustomEvent(GameState.EVENTS.UPDATE_TIMER, {
            detail: seconds
        }));
    
        if (seconds <= 0) {
            clearInterval(this.displayInterval);
        }
    }

    // Byter internt this.currentPlayer, clearar timer, startar ny timer
    changeTurn() {
        if (this.gameOver) {
            return;
        }
        this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
        this.dispatchEvent(new CustomEvent(GameState.EVENTS.TURN_CHANGED, {
            detail: this.currentPlayer
        }));
        this.timeLeft = this.timerLength / 1000; // reset timer
        this.startTimer();
    }
    

    // GameServer kan väl plocka upp detta eventet, skicka till båda spelarna och servern en changeTurn grej
    timedOut() {
        this.changeTurn();
        this.checkWin();
        if (this.gameOver === true) {
                this.dispatchEvent(new CustomEvent(GameState.EVENTS.GAME_OVER, {
                detail: this.winner === 0 // If virus won
            }));
        } else {
            this.dispatchEvent(new CustomEvent(GameState.EVENTS.TIMED_OUT))
        }
    }

    stopTimer() {
        clearTimeout(this.timer);
        clearInterval(this.displayInterval)
    }

    // This is called directly from game when socket recieves a game over from server
    stopGame() { 
        this.stopTimer();
        this.gameOver = true;
    }

    // När ett drag gjorts kollar vi om någon vunnit, om någon vunnit dispatchar vi event, annars byter vi tur
    handleMove() {
        // TODO: kanske borde kolla vinst innan vi skickar update_board eventet, så att clienten inte uppdaterar brädet i onödan efter ett vinnande drag?
        this.changeTurn();
        this.checkWin();

        if (this.gameOver) {
            this.dispatchEvent(new CustomEvent(GameState.EVENTS.GAME_OVER, {
                detail: this.winner === 0 // If virus won
            }));
            this.stopTimer();
            return;
        }
    }

    // Used by gameserver to send the complete data of the current state
    getSerializedState() {
        const data = {
            virusNodes: this.getVirus().nodes.map(n => n.id),
            antivirusNodes: this.getAntiVirus().nodes.map(n => n.id),
            bugNodes: this.board.bugs.nodes.map(n => n.id),
            currentPlayer: this.currentPlayer,
        };
        return data;
    }
}