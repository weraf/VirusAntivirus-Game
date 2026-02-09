import { Board } from "./shared/board.js";
import { Bugs } from "./shared/bugs.js";
import { Virus } from "./shared/virus.js";
// // -=< STORY 2 || TASK 4 >=-
// // Class to print the board using primarily game.js and shared/board.js

export class GameDrawer {
    /**
     * * @param {Phaser.Scene} scene 
     * @param {Board} board 
     */
    constructor(scene, board) {
        this.scene = scene;
        this.board = board;
        this.graphics = scene.add.graphics();

        // Later the virus will be part of the board
        this.virusDrawer = new VirusDrawer(board.virus, scene);
        this.bugsDrawer = new BugsDrawer(board.bugs,scene);
        this.isRotated = false; // It's starts not rotated
    }
    
    draw(highlightIds = [], possibleMoveIds = []) {
        this.graphics.clear();
        const shouldBeRotated = this.scene.scale.width > this.scene.scale.height;

        if (this.isRotated !== shouldBeRotated) {
            this.isRotated = shouldBeRotated;
            this.board.flipCoordinates(); 
        }

        this.centerCamera();
        this.drawEdges();
        this.drawNodes(highlightIds, possibleMoveIds);
        this.virusDrawer.update();
        this.bugsDrawer.update();
    }
    
    drawNodes(highlightIds, possibleMoveIds) {
        const av = this.board.antivirus;
    
        for (const node of this.board.getAllNodes()) {
            let color = 0xe5e5e5; 
            
            // Kolla om det är en server
            if (node.type === 'server') {
                color = 0x1a1a1a;
            }
    
            // Vald nod
            if (highlightIds.includes(node.id)) {
                color = 0x0077ff; 
            }
    
            this.graphics.fillStyle(color, 1);
            
            // Nod grafik
            if (node.type === 'server') {
                // Server grafik
                const width = 38;
                const height = 50;
                const cornerRadius = 5; 
                const x = node.x - width / 2;
                const y = node.y - height / 2;
                this.graphics.lineStyle(2, 0xcccccc, 1); 
                this.graphics.strokeRoundedRect(x - 1, y - 1, width + 2, height + 2, cornerRadius);

                this.graphics.fillRoundedRect(x, y, width, height, cornerRadius);

                this.graphics.lineStyle(1, 0x333333, 0.8);
                this.graphics.lineBetween(x + 5, y + height * 0.4, x + width - 5, y + height * 0.4);
                this.graphics.lineBetween(x + 5, y + height * 0.7, x + width - 5, y + height * 0.7);

                // server lampor (Röd/Grön)
                this.graphics.fillStyle(0x00ff00, 1);
                this.graphics.fillCircle(x + 8, y + 8, 3);
                this.graphics.fillStyle(0xff0000, 1);
                this.graphics.fillCircle(x + 16, y + 8, 3);

                this.graphics.fillStyle(color, 1);
            } else {
                // Vanlig nod
                this.graphics.fillCircle(node.x, node.y, 18);
            }
    
            // markera möjliga drag
            if (possibleMoveIds.includes(node.id)) {
                this.graphics.lineStyle(3, 0x00ff00, 0.8); 
                this.graphics.strokeCircle(node.x, node.y, 22);
                
                this.graphics.fillStyle(0x00ff00, 0.15);
                this.graphics.fillCircle(node.x, node.y, 22);
            }
    
            // Antivirus utseende
            if (av && av.hasNode(node)) {
                this.graphics.lineStyle(4, 0x0000ff, 1); 
                this.graphics.strokeCircle(node.x, node.y, 24); 
    
                if (av.selectedNode === node) {
                    this.graphics.fillStyle(0x0077ff, 0.4);
                    this.graphics.fillCircle(node.x, node.y, 24);
                }
            }

            // Uppdatera klickzonen för när skärmen ändras eller roteras
            if (node.clickZone) {
                node.clickZone.setPosition(node.x, node.y);
            }
        }
    }
    
    drawEdges() {
        this.graphics.lineStyle(3, 0xffffff, 0.3); 
        for (const node of this.board.getAllNodes()) {
            for (const neighbor of node.neighbors) {
                if (node.id < neighbor.id) {
                    this.graphics.lineBetween(node.x, node.y, neighbor.x, neighbor.y);
                }
            }
        }
    }

    centerCamera() {
        let minX = 9999, minY = 9999, maxX = -9999, maxY = -9999;
        for (const node of this.board.getAllNodes()) {
            minX = Math.min(node.x, minX); minY = Math.min(node.y, minY);
            maxX = Math.max(node.x, maxX); maxY = Math.max(node.y, maxY);
        }
        const margin = 50;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        this.scene.cameras.main.centerOn(centerX, centerY);
        let zoom = Math.min(this.scene.scale.width / (maxX - minX + margin * 2), 
                            this.scene.scale.height / (maxY - minY + margin * 2));
        this.scene.cameras.main.setZoom(zoom);
    }
}

class BugsDrawer {
    /**
     * * @param {Bugs} bugs 
     * @param {Game} scene 
     */
    constructor(bugs,scene) {
        this.scene = scene;
        this.bugs = bugs;
        this.graphics = this.scene.add.graphics();
        // Rita om buggarna om de har flyttat på sig
        this.bugs.addEventListener(Bugs.EVENTS.BUG_MOVED,this.update.bind(this));
    }

    update() {
        this.graphics.clear();
        this.graphics.fillStyle(0xee20ee);
        for (const node of this.bugs.nodes) {
            this.graphics.fillCircle(node.x,node.y,10);
        }
    }
}

class VirusDrawer {
    /**
     * * @param {Virus} virus
     * @param {Game} scene
     */
    constructor(virus, scene) {
        this.scene = scene;
        this.tween = null;
        this.virus = virus;
        this.prevNodes = [...this.virus.nodes];
        this.nextNodes = [...this.virus.nodes];
        this.animationProgress = 0.0; // Number between 0 and 1
        this.graphics = this.scene.add.graphics();
        this.lastRotation = false;
        
        // Automatically redraw snake when it has moved
        // For now not used since whole board is redrawn on move anyway
        // this.virus.addEventListener(Virus.EVENTS.MOVED,this.update.bind(this)); 
    }

    renderSnakeProgress(fromNodes,toNodes,progress,growAnim) {
        let HEAD_RADIUS = 14;
        let LINE_RADIUS = 10;
        const BODY_COLOR = 0xff0030;

        if (growAnim) {
            HEAD_RADIUS += (1-progress)*6;
            LINE_RADIUS += (1-progress)*2;
        }

        this.graphics.clear();
        this.graphics.fillStyle(BODY_COLOR);
        this.graphics.lineStyle(LINE_RADIUS*2, BODY_COLOR);

        // For each "body part"
        for (let i = 0; i < this.virus.nodes.length; i++) {
            const fromNode = fromNodes[i]; // The node we started at
            const toNode = toNodes[i]; // The node we will travel to

            const x = Phaser.Math.Linear(fromNode.x,toNode.x,progress);
            const y = Phaser.Math.Linear(fromNode.y,toNode.y,progress);
            this.graphics.fillCircle(x,y,i == 0 ? HEAD_RADIUS : LINE_RADIUS);
            // If not the head node, draw a line forward to the next node
            if (i != 0) {
                this.graphics.lineBetween(x,y,toNode.x,toNode.y);
            }
            // If not the last node, draw a line backward to the previous node
            if (i != this.virus.nodes.length-1) {
                const fromNode = this.virus.nodes[i+1];
                this.graphics.lineBetween(x,y,fromNode.x,fromNode.y);
                // Draw a circle on the node, connecting the two lines drawn by two adjacent body parts 
                this.graphics.fillCircle(fromNode.x,fromNode.y,LINE_RADIUS);
            }
        }
    }

    update() {
        
        if (this.nextNodes[0] === this.virus.nodes[0]) {
            // Head hasn't moved, therefor, no animation is needed.
            this.renderSnakeProgress(this.prevNodes,this.nextNodes,1.0)
            return;
        }
        
        // First, clear already running tween to avoid running two tweens at once
        if (this.tween) {
            const t = this.tween;
            this.tween.nextState(); // This will set this.tween to null, there for the t const
            t.destroy();
        }

        this.nextNodes = [...this.virus.nodes]; // shallow copy
        let hasGrown = false;
        if (this.virus.nodes.length > this.prevNodes.length) {
            // First: Add missing previous nodes
            for (let n = this.prevNodes.length-1; n < this.virus.nodes.length; n++) {
                this.prevNodes.push(this.virus.nodes[n]);
            }
            hasGrown = true;
        }

        this.tween = this.scene.tweens.add({
            targets: this,
            animationProgress: {from: 0.0, to:1.0}, 
            duration: 400,
            ease: 'Quad.easeInOut',
            onUpdate: (tween, target, key, current, previous, param) => {
                this.renderSnakeProgress(this.prevNodes,this.nextNodes,current,hasGrown)
            },
            onComplete: (tween, targets) => {
                this.prevNodes = this.nextNodes;
                this.tween = null;
            }
        })        
        
    }
}