
export class GameState extends EventTarget {


    // Tänker här har vi funktioner, 
    constructor(board, timerLength) {
        super()
        this.board = board;
        this.currentPlayer = 0; // 0 = virus 1 = antivirus? Virus startar?
        this.gameOver = false;
        this.timerLength = timerLength; // ms
        this.timer = null;
        this.winner = null;

    }

    // CheckWin bör kolla om Virus har giltiga drag när det är Virus' tur, om AntiVirus inte har inga giltiga drag
    // kanske man skippar dess tur?
    // Skapa 
    checkWin() { // Ska väl kolla om virus har giltiga drag och det är virus' tur

        // this.board.virus.getValidMoves(); // Virus är egentligen en privat variabel enligt UML, detta ska inte gå
        // this.board.virus.getCoveredServerCount(); // Samma sak som ovan.
        // this.board.antivirus.getValidMoves(); // om det returnerar tom, så förlorar antivirus.
        // Detta är win conditions för respektive spelare

        if (true) {
            
        }

    }

    // bla bla bla emitta skit till GameServer
    gameOver() {
        this.dispatchEvent(new Event('gameOver'))

    }

    // Båda spelare har deras gamestate, och backend har en gamestate

    startTimer() {
        this.timer = setTimeout(() => this.changeTurn(), this.timerLength);    
    }

    // 
    changeTurn() {
        this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
        console.log("Current player", this.currentPlayer)
        this.timer = clearTimeout();
        this.startTimer()

        this.dispatchEvent(new Event('turnChanged'))

        // Skicka nån jävla signal till clientsidan här
        

    }

    // Board bla bla
    handleMove() {
        if (this.gameOver == true) {
            return
        }

        this.dispatchEvent(new Event('moveMade'));

        this.changeTurn()
    }

    // extra tid på serversida är bra 😃👍
}