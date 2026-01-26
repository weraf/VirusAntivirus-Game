//client//shared//Board.js

class Board {
    
    constructor() {
        /**
         * Klass för spelbrädet
         * Lagrar alla noder och deras kopplingar.
         */
        
        this.nodes = new Map(); // nod-data med Nyckel: ID
        
        this.edges = [];   // kopplingar mellan nod-ID:n
    }

    // Lägg till en nod på brädet:
    addNode(id, x, y, typ) {
        
        this.nodes.set(id, { 
            
            id, x, y, typ
        });
    }

    // Koppla två noder:
    addEdge(fromId, toId) {
        
        this.edges.push({ 
            
            from: fromId, to: toId 
        });
    }

    // Hämta alla noder som en lista
    getAllNodes() {
        return Array.from(this.nodes.values());
    }

}