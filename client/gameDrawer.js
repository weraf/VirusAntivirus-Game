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
        this.virusSprites = [];
        this.virusSprites = [];
        this.virusLineGraphics = scene.add.graphics();
        this.virusMoveTweens = [];
    }
    
	draw(highlightIds = []) {
        this.graphics.clear();
        // Uppdatera rotation baserat på skärmen
        this.isRotated = this.scene.scale.width > this.scene.scale.height;
        
        this.centerCamera();
        this.drawEdges();
        this.drawNodes(highlightIds);
    }

    // Returns the displayed x position (after potential flipping)
    getNodeX(node) {
        return this.isRotated ? node.y : node.x;
    }

    // Returns the displayed y position (after potential flipping)
    getNodeY(node) {
        return this.isRotated ? node.x : node.y;
    }

    /**
     * 
     * @param {Virus} virus 
     */
    drawVirus(virus) {
        const HEAD_RADIUS = 14;
        const LINE_RADIUS = 10;

        // First, clear already running tweens to avoid graphical glitches
        for (const tween of this.virusMoveTweens) {
            tween.remove();
            tween.destroy();
        }
        
        // Empty the array
        this.virusMoveTweens = [];

        if (virus.nodes.length > this.virusSprites.length) {
            // First: Add missing sprites
            for (let n = this.virusSprites.length; n < virus.nodes.length; n++) {
                let node = virus.nodes[n];
                this.virusSprites.push(this.scene.add.circle(this.getNodeX(node),this.getNodeY(node),n == 0 ? HEAD_RADIUS : LINE_RADIUS,0xff0020));
            }
        }
        // Then: Animate each sprite to it's rightful position
        for (let index = 0; index < virus.nodes.length; index++) {
            let node = virus.nodes[index];
            let sprite = this.virusSprites[index];
            const moveTween = this.scene.tweens.add({
                targets:sprite,
                x: this.getNodeX(node),
                y: this.getNodeY(node),
                ease: 'Quad.easeInOut',
                duration: 500,
                onUpdate: (tween,target,key,current,previous, param) => {
                    if (key == "x") {
                        return // Only update on y
                    }
                    if (target == this.virusSprites[0]) {
                        this.virusLineGraphics.clear(); // First in the line, clear last frame
                    }
                    
                    this.virusLineGraphics.lineStyle(LINE_RADIUS*2, 0xff0020);
                    this.virusLineGraphics.fillStyle(0xff0020);
                    // If not the head node, draw a line forward to the next node
                    if (index != 0) {
                        this.virusLineGraphics.lineBetween(target.x,target.y,this.getNodeX(node),this.getNodeY(node));
                    }
                    if (index != virus.nodes.length-1) {
                        const lastNode = virus.nodes[index+1];
                        this.virusLineGraphics.lineBetween(target.x,target.y,this.getNodeX(lastNode),this.getNodeY(lastNode));
                        this.virusLineGraphics.fillCircle(this.getNodeX(lastNode),this.getNodeY(lastNode),LINE_RADIUS)
                    }
                    

                }
            })
            this.virusMoveTweens.push(moveTween);

        }
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