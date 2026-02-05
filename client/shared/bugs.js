import { Board } from "./board.js";

// Valde att byta namn på klassen till bugs då den innehåller alla buggar, inte bara en per instans
export class Bugs extends EventTarget {
    // An array holding all the nodes where bugs are at currently
    nodes = []
    board
    static EVENTS = {
        BUG_MOVED: "bug_moved"
    }
    /**
     * 
     * @param {Board} board 
     */
    constructor(board) {
        super();
        this.board = board
    }

    hasNode(node) {
        return this.nodes.includes(node);
    }

    removeBugAtNode(node) {
        this.nodes = this.nodes.filter((n) => {return n != node});
    }

    respawnBugAtNode(node) {
        this.removeBugAtNode(node);
        this.createBugAtRandom();
        this.dispatchEvent(new Event(Bugs.EVENTS.BUG_MOVED));
    }

    /**
     * Pick a random empty node to create a bug on.
     */
    createBugAtRandom() {
        const nodes = this.board.getAllNodes();
        let randomNode = null;
        while (randomNode === null || !this.board.isNodeEmpty(randomNode) || randomNode.isServer()) {
            randomNode = nodes[Math.floor(Math.random()*nodes.length)];
        }
        this.createBugAtNode(randomNode);
    }

    createBugAtNode(node) {
        if (!this.board.isNodeEmpty(node)) {
            return; // Can't create bug on a non-empty node. This will also stop it from create two bugs on the same node
        }
        this.nodes.push(node);
    }
}