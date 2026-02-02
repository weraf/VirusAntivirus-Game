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
        this.snakeLineGraphics = scene.add.graphics();
        this.snakeLineGraphics.lineStyle(14, 0xff0020)
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
        if (virus.nodes.length > this.virusSprites.length) {
            // First: Add missing sprites
            for (let n = this.virusSprites.length; n < virus.nodes.length; n++) {
                let node = virus.nodes[n];
                this.virusSprites.push(this.scene.add.circle(this.getNodeX(node),this.getNodeY(node),14,0xff0020));
            }
        }
        // Then: Animate each sprite to it's rightful position
        for (let n = 0; n < virus.nodes.length; n++) {
            let node = virus.nodes[n];
            let sprite = this.virusSprites[n];
            this.scene.tweens.add({
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
                        this.snakeLineGraphics.clear(); // First in the line, clear last frame
                    }
                    // TODO: draw line bwteen the sprites
                    if (target == this.virusSprites[this.virusSprites.length-1]) {

                    }
                    this.snakeLineGraphics.lineBetween()

                }
            })

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