

export class Node {
    constructor(id, x, y, type) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.type = type; // om det är en 'node' eller 'server'
        this.neighbors = [];
    }

    // för att hitta grannar och läga till i grann-listan
    addNeighbor(nodeInstance) {
        if (!this.neighbors.includes(nodeInstance)) {
            this.neighbors.push(nodeInstance);
        }
    }

    // Hämta bara ID:n på grannarna
    getNeighborIds() {
        return this.neighbors.map(n => n.id);
    }
}