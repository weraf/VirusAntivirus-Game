
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
    
    // välj ny nod som ny position
    move(newNodeId) {
        const index = this.nodes.indexOf(this.selectedNodeId);
        if (index !== -1) {
            this.nodes[index] = newNodeId;
            this.selectedNodeId = null; // gamla noden markeras som tom
            return true;
        }
        return false;
    }
}