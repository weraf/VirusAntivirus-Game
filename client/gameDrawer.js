import { Board } from "./shared/board.js";
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