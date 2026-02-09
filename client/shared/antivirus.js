import { Board } from "./board.js";
import { Node } from "./node.js";

export class Antivirus extends EventTarget {
    /**
     * 
     * @param {Board} board 
     * @param {Node[]} startNodes 
     */
    constructor(startNodes) {
        super();
        this.board = board;
        this.nodes = startNodes; 
        this.selectedNode = null; 
    }

    static EVENTS = {
        MOVED: "moved",
    }
    
    // välj nod att flytta
    select(node) {
        if (this.nodes.includes(node)) {
            this.selectedNode = node;
            return true;
        }
        return false;
    }

    getNodesToEnableInput(board) {
        
        if (!this.selectedNode) {
            return this.nodes;
        }
        
        const validMoves = this.getValidMoves(board);        
        return [...validMoves, ...this.nodes];
    }

    // Check-logik flyttad hit från game
    getValidMoves(board) {
        if (!this.selectedNode) return [];

        
        return this.selectedNode.neighbors.filter((neighbor) => {
            return !neighbor.isServer() && 
            (board.isNodeEmpty(neighbor) || board.hasNodeBug(neighbor))
        }
        );
    }

    hasNode(node) {
        return this.nodes.includes(node);
    }
    
    // välj en nod att flytta
    selectAVNode(node) {
        this.selectedNode = (this.selectedNode === node) ? null : node;
    }

    /**
     * 
     * @param {Node} oldNode 
     * @param {Node} newNode 
     * @returns {boolean} true om flytt lyckades, false annars
     */
    moveTo(oldNode, newNode) {
        if (!this.hasNode(oldNode)) {
            return false;
        }

        this.selectedNode = oldNode;

        const validMoves = this.getValidMoves(this.board);
        if (!validMoves.includes(newNode)) {
            this.selectedNode = null;
            return false;
        }

        const index = this.nodes.indexOf(oldNode);
        this.nodes[index] = newNode;
        this.selectedNode = null;
        this.dispatchEvent(new CustomEvent(Antivirus.EVENTS.MOVED,{"detail":{"node":newNode}}));

        return true;
    }
}