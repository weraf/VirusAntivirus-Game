
/** 
 * 
 * Klass för Antivirus!
 * 
 * */ 

export class Antivirus extends EventTarget {
    constructor(startNodes) {
        super();
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

    moveAVNode(newNode) {
        const index = this.nodes.indexOf(this.selectedNode);
        if (index !== -1) {
            this.nodes[index] = newNode;
            this.selectedNode = null; 
            this.dispatchEvent(new CustomEvent(Antivirus.EVENTS.MOVED,{"detail":{"node":newNode}}));
            return true;
        }
        return false;
    }
}