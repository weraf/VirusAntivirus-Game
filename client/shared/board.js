import { Node } from "./node.js";

export class Board extends EventTarget {
    constructor() {
        super();
        this.nodes = new Map();
    }

    flipCoordinates() {
        for (const node of this.getAllNodes()) {
            const tempX = node.x;
            node.x = node.y;
            node.y = tempX;
        }
        this.dispatchEvent(new Event("board is flipped"));
    }

    addNode(id, x, y, type) {
        const newNode = new Node(id, x, y, type);
        this.nodes.set(id, newNode);
    }

    addEdge(fromId, toId) {
        const fromNode = this.nodes.get(fromId);
        const toNode = this.nodes.get(toId);

        if (fromNode && toNode) {
            fromNode.addNeighbor(toNode);
            toNode.addNeighbor(fromNode);
        }
    }

    getNode(id) {
        return this.nodes.get(id);
    }

    getAllNodes() {
        return Array.from(this.nodes.values());
    }
}