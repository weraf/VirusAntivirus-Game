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

		// kolla om skärmen är högre än den är bred
        this.isRotated = scene.scale.width > scene.scale.height;
        // Later the virus will be part of the board
        this.virusDrawer = new VirusDrawer(scene.virus, scene);
        this.scene.scale.on("resize",this.centerCamera.bind(this));
        this.centerCamera();
    }
    
	draw(highlightIds = []) {
        this.graphics.clear();
        // Uppdatera rotation baserat på skärmen
        this.isRotated = this.scene.scale.width > this.scene.scale.height;
        
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
    
            //koordinater beroende på isRotated
            let drawX = this.isRotated ? node.y : node.x;
            let drawY = this.isRotated ? node.x : node.y;

            if (node.type === 'server') {
                this.graphics.fillRect(drawX - 20, drawY - 20, 40, 40);
            } else {
                this.graphics.fillCircle(drawX, drawY, 18);
            }
        }
    }
    
    drawEdges() {
        this.graphics.lineStyle(3, 0xffffff, 0.3); 
        for (const node of this.board.getAllNodes()) {
            for (const neighbor of node.neighbors) {
                if (node.id < neighbor.id) {
                    
                    let x1 = this.isRotated ? node.y : node.x;
                    let y1 = this.isRotated ? node.x : node.y;
                    let x2 = this.isRotated ? neighbor.y : neighbor.x;
                    let y2 = this.isRotated ? neighbor.x : neighbor.y;

                    this.graphics.lineBetween(x1, y1, x2, y2);
                }
            }
        }
    }

    centerCamera() {
        let minX = 9999, minY = 9999, maxX = -9999, maxY = -9999;

        for (const node of this.board.getAllNodes()) {
            
            let x = this.isRotated ? node.y : node.x;
            let y = this.isRotated ? node.x : node.y;
            minX = Math.min(x, minX); minY = Math.min(y, minY);
            maxX = Math.max(x, maxX); maxY = Math.max(y, maxY);
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
     * @param {Scene} scene
     */
    constructor(virus, scene) {
        this.scene = scene;
        this.tween = null;
        this.virus = virus;
        this.prevNodes = {...this.virus.nodes};
        this.nextNodes = {...this.virus.nodes};
        this.animationProgress = 0.0; // Number between 0 and 1
        this.graphics = this.scene.add.graphics();
        
    }

    update() {
        const HEAD_RADIUS = 14;
        const LINE_RADIUS = 10;
        const BODY_COLOR = 0xff0030;
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
                this.graphics.clear();
                this.graphics.fillStyle(BODY_COLOR);
                this.graphics.lineStyle(LINE_RADIUS*2, BODY_COLOR);
                for (let i = 0; i < this.virus.nodes.length; i++) {
                    // Hard coded to be flipped x y for now. Will get fixed later
                    const targetNode = this.nextNodes[i];
                    const lastNode = this.prevNodes[i];
                    const x = Phaser.Math.Linear(lastNode.x,targetNode.x,current);
                    const y = Phaser.Math.Linear(lastNode.y,targetNode.y,current);
                    this.graphics.fillCircle(y,x,i == 0 ? HEAD_RADIUS : LINE_RADIUS);
                    // If not the head node, draw a line forward to the next node
                    if (i != 0) {
                        this.graphics.lineBetween(y,x,targetNode.y,targetNode.x);
                    }
                    if (i != this.virus.nodes.length-1) {
                        const lastNode = this.virus.nodes[i+1];
                        this.graphics.lineBetween(y,x,lastNode.y,lastNode.x);
                        this.graphics.fillCircle(lastNode.y,lastNode.x,LINE_RADIUS);
                    }
                }
            },
            onComplete: (tween, targets) => {
                this.prevNodes = this.nextNodes;
                this.tween = null;
            }
        })        
        
    }
}