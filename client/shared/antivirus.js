
/** 
 * 
 * Klass för Antivirus!
 * 
 * */ 

export class Antivirus {
    constructor(nodeId1, nodeId2) {
        this.nodes = [nodeId1, nodeId2]; 
        this.selectedNodeId = null; 
    }
    
    // välj nod att flytta
    select(nodeId) {
        if (this.nodes.includes(nodeId)) {
            this.selectedNodeId = nodeId;
            return true;
        }
        return false;
    }

    getNodesToEnableInput(board) {
        
        if (!this.selectedNodeId) {
            return this.nodes.map(id => board.getNode(id));
        }
        
        const validMoves = this.getValidMoves(board);
        const currentPiece = board.getNode(this.selectedNodeId);
        
        return [...validMoves, currentPiece];
    }

    // Check-logik flyttad hit från game
    getValidMoves(board) {
        if (!this.selectedNodeId) return [];

        const currentNode = board.getNode(this.selectedNodeId);
        return currentNode.neighbors.filter(neighbor => 
            neighbor.type !== 'server' && 
            board.isNodeEmpty(neighbor.id)
        );
    }
    
    // välj en nod att flytta
    selectAVNode(nodeId) {
        this.selectedNodeId = (this.selectedNodeId === nodeId) ? null : nodeId;
    }

    moveAVNode(newNodeId) {
        const index = this.nodes.indexOf(this.selectedNodeId);
        if (index !== -1) {
            this.nodes[index] = newNodeId;
            this.selectedNodeId = null; 
            return true;
        }
        return false;
    }
}