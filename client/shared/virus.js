import { Board } from "./board.js";
import { Node } from "./node.js";

export class Virus extends EventTarget {
    
    /**All the nodes the virus has. Index 0 is the head
     * @type {Node[]}
     */
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

    hasNode(node) {
        return this.nodes.includes(node);
    }

    hasAnyValidMove() {
        return (this.getValidMoves().length > 0);
    }

    moveTo(node) {
        if (!this.canMoveOnNode(node) || !this.isNodeNeighborOfHead(node)) {
            return false; 
        }
        // Insert the new node at the beginning of the array (the head)
        this.nodes.unshift(node)
        if (this.board.hasNodeBug(node)) {
            this.dispatchEvent(new CustomEvent(Virus.EVENTS.BUG_EATEN,{"detail":{"node":node}})) // Skicka event så att bugs kan reagera och flytta
        } else { // If we didn't eat an apple, remove the last element (the tail) to make the whole snake move forward
            this.nodes.pop();
        }
        this.dispatchEvent(new CustomEvent(Virus.EVENTS.MOVED, {"detail": {"node": node}})); // used to make virusDrawer update

        return true;
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

    isNodeNeighborOfHead(node) {
        return this.getHeadNode().hasNeighbor(node);
    }

    canMoveOnNode(node) {
        // Can't move to a non-empty node (unless theres an bug on the node)
        return (this.board.isNodeEmpty(node)
                || node == this.nodes[this.nodes.length-1] // The node has our tail on it, we can move here
                || this.board.hasNodeBug(node))
    }

    /**
     * @returns {Node[]} Returns the nodes we could move to
     */
    getValidMoves() {
        const moves = [];
        for (let node of this.getHeadNode().neighbors) {
            if (this.canMoveOnNode(node)) {
                moves.push(node);
            }
        }
        return moves;
    }

    /**
     * 
     * @param {Board} board 
     * @param {number} amount 
     */
    static getRandomStartNodes(board, amount) {
        let body = [];

        // A node is only valid in start body if it's empty, not a server and not already in the body
        const isStartNodeValid = (node) => {return board.isNodeEmpty(node) && !node.isServer() && !body.includes(node)};
        
        const validNodes = board.getAllNodes().filter(isStartNodeValid);
        while (body.length < amount) {
            if (body.length === 0) {
                // choose random start node
                let startNode = validNodes[Math.floor(Math.random() * validNodes.length)];
                body.push(startNode);
            } else {
                // find neighbour to chosen node
                let head = body[0];
                let possibleNeighbors = head.neighbors.filter(n => 
                    !body.includes(n) && board.isNodeEmpty(n) && !n.isServer()
                );
    
                if (possibleNeighbors.length > 0) {
                    body.unshift(possibleNeighbors[Math.floor(Math.random() * possibleNeighbors.length)]);
                } else {
                    // if stuck, do again from start
                    body = [];
                }
            }
        }
        return body;
    }
}