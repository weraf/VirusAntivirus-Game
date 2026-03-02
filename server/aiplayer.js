import EventEmitter from "node:events";
import { ACTIONS, EVENTS } from "../client/shared/enums.js";
import { VirusAI, AntivirusAI } from "../client/shared/ai.js";

export class AIPlayer extends EventEmitter {
    isVirus = false;

    constructor() {
        super();
        this.board = null;
        // Ny instans per spel
        this.virusAI     = new VirusAI();
        this.antivirusAI = new AntivirusAI();
    }

    setVirus() {
        this.isVirus = true;
    }

    // events från GameServer
    emit(eventName, ...args) {
        if (eventName === EVENTS.START_TUTORIAL) {
            super.emit(ACTIONS.READY)
        }
        if (eventName === EVENTS.GAME_FOUND) {
            console.log("We are Charlie Kirk")
            if (this.isVirus) setTimeout(() => this.doVirusMove(), 300);
            return;
        }
        if (eventName === EVENTS.VIRUS_MOVED && !this.isVirus) {
            setTimeout(() => this.doAntivirusMove(), 300);
            return;
        }
        if (eventName === EVENTS.ANTIVIRUS_MOVED && this.isVirus) {
            setTimeout(() => this.doVirusMove(), 300);
            return;
        }
        if (eventName === EVENTS.TURN_TIMED_OUT) {
            const timedOut = args[0];
            if (timedOut === 0 && this.isVirus)  setTimeout(() => this.doVirusMove(), 300);
            if (timedOut === 1 && !this.isVirus) setTimeout(() => this.doAntivirusMove(), 300);
            return;
        }
    }

    doVirusMove() {
        if (!this.board) return;
        console.log("Yeap do virus move")
        const node = this.virusAI.pickMove(this.board);
        if (!node) return;
        super.emit(ACTIONS.VIRUS_MOVE, node.id);
    }

    doAntivirusMove() {
        if (!this.board) return;
        console.log("Yeap do antivirus move")
        const result = this.antivirusAI.pickMove(this.board);
        if (!result?.from || !result?.to) return;
        super.emit(ACTIONS.ANTIVIRUS_MOVE, result.to.id, result.from.id);
    }
}