import { Bugs } from "./bugs.js";
import { Node } from "./node.js";
import { Virus } from "./virus.js";
import { Antivirus } from "./antivirus.js";

export class Board extends EventTarget {
    constructor() {
        super();
        this.nodes = new Map();
        this.virus = null;
        this.antivirus = null;
        this.bugs = new Bugs(this);
    }

    spawnVirus(startNodes) {
        this.virus = new Virus(this,startNodes);
        // Make bugs respawn a bug that got eaten
        this.virus.addEventListener(Virus.EVENTS.BUG_EATEN,(event) => {
            this.bugs.respawnBugAtNode(event.detail.node);
        })
    }

    spawnStartBugs() {
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

    spawnAntivirus() {
        const possibleNodes = this.getAllNodes().filter(node => node.type !== 'server');
    
        // Slumpa positioner
        possibleNodes.sort(() => Math.random() - 0.5);
        const av_n1 = possibleNodes[0].id;
        const av_n2 = possibleNodes[1].id;
        
        this.antivirus = new Antivirus(av_n1, av_n2);
        console.log(`Antivirus satta på nod ${av_n1} och ${av_n2}`);
    }

    isNodeEmpty(nodeId) {
        
        // är antivirus där?
        if (this.antivirus && this.antivirus.nodes.includes(nodeId)) return false;
        
        // här kan man ha andra villkor för virus och buggar tillexempel...
        
        return true; 
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