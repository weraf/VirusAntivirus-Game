import { Board } from "./board.js";
import { Node } from "./node.js";

/** 
 * 
 * Tom klass för Virus!
 * 
 * */ 

export class Virus {
    
    /**All the nodes the virus has. Index 0 is the head
     * @type {Node[]}
     */
    nodes = [];
    board;

    /**
     * 
     * @param {Board} board 
     * @param {Node[]} startNodes 
     */
    constructor(board,startNodes) {
        this.nodes = startNodes;
        this.board = board;
    }

    /**
     * 
     * @returns {Node}
     */
    getHeadNode() {
        return this.nodes[0];
    }

    moveTo(node) {
        if (!this.canMoveToNode(node)) {
            return; 
        }
        // Insert the new node at the beginning of the array (the head)
        this.nodes.unshift(node)
        if (true) { // !this.board.hasNodeBug(node)
            // If we didn't eat an apple, remove the last element (the tail) to make the whole snake move forward
            this.nodes.pop();
        }
    }

    /**
     * @returns {Number} The amount of servers the virus is currently on top of
     */
    getCoveredServerCount() {
        let servers = 0;
        for (let node of this.nodes) {
            if (node.type === "server") {
                servers++;
            }
        }
        return servers;
    }

    canMoveToNode(node) {
        // Can't move to a non adjacent or non-empty node (unless theres an bug on the node)
        return this.getHeadNode().hasNeighbor(node);
    }

    /**
     * @returns {Node[]} Returns the nodes we could move to
     */
    getValidMoves() {
        const moves = [];
        for (let node of this.getHeadNode().neighbors) {
            if (!this.nodes.includes(node)) { //this.board.isNodeEmpty(node)
                moves.push(node);
            }
        }
        return moves;
    }
}