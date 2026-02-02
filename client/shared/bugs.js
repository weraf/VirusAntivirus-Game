import { Board } from "./board.js";

// Valde att byta namn på klassen till bugs då den innehåller alla buggar, inte bara en per instans
export class Bugs {
    // An array holding all the nodes where bugs are at currently
    nodes = []
    board

    /**
     * 
     * @param {Board} board 
     */
    constructor(board) {
        this.board = board
    }

    hasNodeBug(node) {
        return this.nodes.includes(node);
    }

    removeBugAtNode(node) {
        this.nodes = this.nodes.filter((n) => {return n != node});
    }

    /**
     * Pick a random empty node to create a bug on.
     */
    createBugAtRandom() {
        const nodes = this.board.getAllNodes();
        let randomNode = null;
        while (randomNode === null || !this.board.isNodeEmpty(randomNode)) {
            randomNode = nodes[Math.random()];
        }
        createBugAtNode(randomNode);
    }

    createBugAtNode(node) {
        if (!this.board.isNodeEmpty(node)) {
            return; // Can't create bug on a non-empty node. This will also stop it from create two bugs on the same node
        }
        this.nodes.push(node);
    }
}