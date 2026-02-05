import { Board } from "./board.js";
import { Node } from "./node.js";

export class Virus extends EventTarget {
    
    /**All the nodes the virus has. Index 0 is the head
     * @type {Node[]}
     */
    nodes = [];
    board;
    static EVENTS = {
        MOVED: "moved",
        BUG_EATEN: "bug_eaten"
    }

    /**
     * 
     * @param {Board} board 
     * @param {Node[]} startNodes 
     */
    constructor(board,startNodes) {
        super();
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

    getTailNode() {
        return this.nodes[this.nodes.length-1];
    }

    hasNode(node) {
        return this.nodes.includes(node);
    }

    moveTo(node) {
        if (!this.canMoveToNode(node)) {
            return; 
        }
        // Insert the new node at the beginning of the array (the head)
        this.nodes.unshift(node)
        if (this.board.hasNodeBug(node)) {
            this.dispatchEvent(new CustomEvent(Virus.EVENTS.BUG_EATEN,{"detail":{"node":node}})) // Skicka event så att bugs kan reagera och flytta
        } else { // If we didn't eat an apple, remove the last element (the tail) to make the whole snake move forward
            this.nodes.pop();
        }
        this.dispatchEvent(new Event(Virus.EVENTS.MOVED)); // used to make virusDrawer update
    }

    /**
     * @returns {Number} The amount of servers the virus is currently on top of
     */
    getCoveredServerCount() {
        let servers = 0;
        for (let node of this.nodes) {
            if (node.isServer()) {
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
            if (this.board.isNodeEmpty(node)
                || node == this.getTailNode() // The node has our tail on it, we can move here
                || this.board.hasNodeBug(node)) {
                moves.push(node);
            }
        }
        return moves;
    }
}