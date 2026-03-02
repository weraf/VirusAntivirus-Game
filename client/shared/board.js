import { Bugs } from "./bugs.js";
import { Node } from "./node.js";
import { Virus } from "./virus.js";
import { Antivirus } from "./antivirus.js";

export class Board extends EventTarget {
    static EVENTS = {
        BOARD_FLIP: "board_flip"
    }

    constructor() {
        super();
        this.nodes = new Map();
        this.virus = null;
        this.antivirus = null;
        this.bugs = new Bugs(this);
        this.isFlipped = false;
    }

    spawnVirus(startNodes = []) {

        if (startNodes.length === 0) {
            // no start nodes, find some
            startNodes = Virus.getRandomStartNodes(this,3);
        }

        this.virus = new Virus(this,startNodes);
        
    }

    spawnStartBugs(startNodes = []) {
        if (startNodes.length == 0) {
            // Empty starts, randomize two positions
            startNodes = Bugs.getRandomStartNodes(this,2);
        }
        for (const node of startNodes) {
            this.bugs.createBugAtNode(node);
        }
    }

    flipCoordinates() {
        this.isFlipped = !this.isFlipped;
        for (const node of this.getAllNodes()) {
            // Reworked flipping to do a 90 degree rotation instead of mirroring x and y
            // This makes it behave more as expected when rotating a phone
            // This will cause negative node positions but that doesn't matter since we
            // center the camera anyway
            
            const tempX = node.x;
            if (this.isFlipped) {
                node.x = node.y;
                node.y = -tempX;
            } else {
                node.x = -node.y;
                node.y = tempX;
            }
        }
        this.dispatchEvent(new Event(Board.EVENTS.BOARD_FLIP));
    }

    spawnAntivirus(startNodes = []) {

        if (startNodes.length === 0) {
            // Sent no start nodes, randomize two instead
            startNodes = Antivirus.getRandomStartNodes(this,2);

        }
    
        this.antivirus = new Antivirus(this, startNodes);
        
    }

    // Running this makes bugs react to being stepped on.
    // Only runs on server, clients gets bug move events direct from the server instead
    connectBugListeners() {
        // Antivirus: Move bugs that get stepped on
        this.antivirus.addEventListener(Antivirus.EVENTS.MOVED,(event) => {
            const movedTo = event.detail.node;
            if (this.bugs.hasNode(movedTo)) {
                this.bugs.respawnBugAtNode(movedTo);
            }
        })
        // Virus: Make bugs respawn a bug that got eaten
        this.virus.addEventListener(Virus.EVENTS.BUG_EATEN,(event) => {
            this.bugs.respawnBugAtNode(event.detail.node);
        })
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
        if (this.antivirus && this.antivirus.hasNode(node)) {
            return false;
        } 
        // Todo: kolla om antivirusär på noden
        return true;
    }

    hasNodeBug(node) {
        return this.bugs.hasNode(node);
    }
}