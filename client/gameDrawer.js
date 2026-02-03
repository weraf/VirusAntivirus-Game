import { Board } from "./shared/board.js";
import { Virus } from "./shared/virus.js";
// // -=< STORY 2 || TASK 4 >=-
// // Class to print the board using primarily game.js and shared/board.js

export class GameDrawer {
    /**
     * 
     * @param {Phaser.Scene} scene 
     * @param {Board} board 
     */
    constructor(scene, board) {
        this.scene = scene;
        this.board = board;
        this.graphics = scene.add.graphics();

        // Later the virus will be part of the board
        this.virusDrawer = new VirusDrawer(scene.virus, scene);
        
        this.isRotated = false;
    }
    
	draw(highlightIds = []) {
        this.graphics.clear();
        const shouldBeRotated = this.scene.scale.width > this.scene.scale.height;

        if (this.isRotated !== shouldBeRotated) {
            this.isRotated = shouldBeRotated;
            this.board.flipCoordinates(); 
        }

        this.centerCamera();
        this.drawEdges();
        this.drawNodes(highlightIds);
        this.virusDrawer.update();
    }

    // Returns the displayed x position (after potential flipping)
    getNodeX(node) {
        return this.isRotated ? node.y : node.x;
    }

    // Returns the displayed y position (after potential flipping)
    getNodeY(node) {
        return this.isRotated ? node.x : node.y;
    }
    
	drawNodes(highlightIds) {
        for (const node of this.board.getAllNodes()) {
            this.graphics.fillStyle(highlightIds.includes(node.id) ? 0xffff00 : 
                                   (node.type === 'server' ? 0xb5b5b5 : 0xe5e5e5), 1);
            
            if (node.type === 'server') {
                this.graphics.fillRect(node.x - 20, node.y - 20, 40, 40);
            } else {
                this.graphics.fillCircle(node.x, node.y, 18);
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

class VirusDrawer {
    /**
     * 
     * @param {Virus} virus
     * @param {Game} scene
     */
    constructor(virus, scene) {
        this.scene = scene;
        this.tween = null;
        this.virus = virus;
        this.prevNodes = {...this.virus.nodes};
        this.nextNodes = {...this.virus.nodes};
        this.animationProgress = 0.0; // Number between 0 and 1
        this.graphics = this.scene.add.graphics();
        this.lastRotation = false;
    }

    renderSnakeProgress(fromNodes,toNodes,progress) {
        const HEAD_RADIUS = 14;
        const LINE_RADIUS = 10;
        const BODY_COLOR = 0xff0030;
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

        this.nextNodes = {...this.virus.nodes}; // shallow copy

        if (this.virus.nodes.length > this.prevNodes.length) {
            // First: Add missing previous nodes
            for (let n = this.prevNodes.length; n < this.virus.nodes.length; n++) {
                this.prevNodes.push(virus.nodes[n]);
            }
        }


        this.tween = this.scene.tweens.add({
            targets: this,
            animationProgress: {from: 0.0, to:1.0}, 
            duration: 400,
            ease: 'Quad.easeInOut',
            onUpdate: (tween, target, key, current, previous, param) => {
                this.renderSnakeProgress(this.prevNodes,this.nextNodes,current)
            },
            onComplete: (tween, targets) => {
                this.prevNodes = this.nextNodes;
                this.tween = null;
            }
        })        
        
    }
}