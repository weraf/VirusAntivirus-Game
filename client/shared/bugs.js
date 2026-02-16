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

    static getRandomStartNodes(board,amount) {
        const startNodes = [];
        const possibleNodes = board.getAllNodes().filter((node) => {return board.isNodeEmpty(node) && !node.isServer()});
        for (let n = 0; n < amount; n++) {
            const randomIndex = Math.floor(Math.random()*possibleNodes.length); 
            const node = possibleNodes[randomIndex];
            possibleNodes.splice(randomIndex,1); // remove it from the array
            startNodes.push(node); // Add it as a start node
        }
        return startNodes;
    }

    respawnBugAtNode(oldNode, newNode = null) {
        let bugIndex = this.nodes.findIndex((n) => {return n == oldNode;});
        if (bugIndex == -1) {
            return false // There wasn't a bug at this node
        }
        if (newNode === null) {
            // New node wasn't set, pick a random one
            // Not so random random. Should be replaced by random pick later.
            newNode = this.pickRandomNode(oldNode);
        }

        this.nodes[bugIndex] = newNode; // Replace the last bug
        
        this.dispatchEvent(new CustomEvent(Bugs.EVENTS.BUG_MOVED, {
            detail: {
                from: oldNode.id,
                to: newNode.id
            }
        }));

        return { from: oldNode.id, to: newNode.id };
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

    pickRandomNode(startNode) {
        let randomNode = startNode;
        for (let i = 0; i < 20; i++) {
            for (let neighbor of randomNode.neighbors) {
                // Move to a random neighbor
                if (this.board.isNodeEmpty(neighbor) && !neighbor.isServer() || i < 10) {
                    return neighbor;
                }
            }
        }
        return startNode;
    }
}