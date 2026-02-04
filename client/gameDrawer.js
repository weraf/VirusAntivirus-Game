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
        this.isRotated = null;
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
    }
    
	drawNodes(highlightIds, possibleMoveIds) {
		const av = this.board.antivirus;
	
		for (const node of this.board.getAllNodes()) {
			let color = 0xe5e5e5; 
			if (node.type === 'server') color = 0xb5b5b5;
	
			// vald nod
			if (highlightIds.includes(node.id)) {
				color = 0x0077ff; 
			}
	
			this.graphics.fillStyle(color, 1);
			
			// rita nod
			if (node.type === 'server') {
				this.graphics.fillRect(node.x - 20, node.y - 20, 40, 40);
			} else {
				this.graphics.fillCircle(node.x, node.y, 18);
			}
	
			// highlighta möjliga drag
			if (possibleMoveIds.includes(node.id)) {
				this.graphics.lineStyle(3, 0x00ff00, 0.8); 
				this.graphics.strokeCircle(node.x, node.y, 22);
				
				this.graphics.fillStyle(0x00ff00, 0.15);
				this.graphics.fillCircle(node.x, node.y, 22);
			}
	
			// rita antivirus nod
			if (av && av.nodes.includes(node.id)) {
				this.graphics.lineStyle(4, 0x0000ff, 1); 
				this.graphics.strokeCircle(node.x, node.y, 24); 
	
				if (av.selectedNodeId === node.id) {
					this.graphics.fillStyle(0x0077ff, 0.4);
					this.graphics.fillCircle(node.x, node.y, 24);
				}
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