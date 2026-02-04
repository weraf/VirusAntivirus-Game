import { Bugs } from "./bugs.js";
import { Node } from "./node.js";
import { Virus } from "./virus.js";

export class Board extends EventTarget {
    constructor() {
        super();
        this.nodes = new Map();
        this.virus = null;
        this.bugs = new Bugs(this);
    }

    createVirus(startNodes) {
        this.virus = new Virus(this,startNodes);
        // Make bugs respawn a bug that got eaten
        this.virus.addEventListener(Virus.EVENTS.BUG_EATEN,(event) => {
            this.bugs.respawnBugAtNode(event.detail.node);
        })
    }

    createStartBugs() {
        // Create two bugs at random positions
        this.bugs.createBugAtRandom();
        this.bugs.createBugAtRandom();
    }

    flipCoordinates() {
        for (const node of this.getAllNodes()) {
            const tempX = node.x;
            node.x = node.y;
            node.y = tempX;
        }
        this.dispatchEvent(new Event("board is flipped"));
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

    isNodeEmpty(node) {
        if (this.virus && this.virus.hasNode(node)) {
            return false;
        }
        if (this.bugs && this.bugs.hasNode(node)) {
            return false;
        }
        // Todo: kolla om antivirusär på noden
        return true;
    }

    hasNodeBug(node) {
        return this.bugs.hasNode(node);
    }
}