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
    }
    
    draw(highlightIds = []) {
        this.graphics.clear();
        this.centerCamera();
        this.drawEdges();
        this.drawNodes(highlightIds);
    }
    
    drawNodes(highlightIds) {
        for (const node of this.board.getAllNodes()) {
            if (highlightIds.includes(node.id)) {
                this.graphics.fillStyle(0xffff00, 1);
            } else {
                this.graphics.fillStyle(node.type === 'server' ? 0xb5b5b5 : 0xe5e5e5, 1);
            }
    
            // Bytt plats på X och Y för att rotera 90 grader
            if (node.type === 'server') {
                this.graphics.fillRect(node.y - 20, node.x - 20, 40, 40);
            } else {
                this.graphics.fillCircle(node.y, node.x, 18);
            }
        }
    }
    
    drawEdges() {
        this.graphics.lineStyle(3, 0xffffff, 0.3); 
        
        for (const node of this.board.getAllNodes()) {
            for (const neighbor of node.neighbors) {
                
                if (node.id < neighbor.id) {
                    this.graphics.lineBetween(node.y, node.x, neighbor.y, neighbor.x);
                }
            }
        }
    }

    centerCamera() {
        // Find the bounds of the nodes on the board
        let minX = 9999;
        let minY = 9999;
        let maxX = -9999;
        let maxY = -9999;

        const rotated = true;

        for (const node of this.board.getAllNodes()) {
            let x = rotated ? node.y : node.x;
            let y = rotated ? node.x : node.y;
            minX = Math.min(x,minX);
            minY = Math.min(y,minY);
            maxX = Math.max(x,maxX);
            maxY = Math.max(y,maxY);
        }

        // Add node margins:
        const margin = 30;
        minX -= margin;
        minY -= margin;
        maxX += margin;
        maxY += margin;

        // The center is the average
        const centerX = (minX+maxX)/2;
        const centerY = (minY+maxY)/2;
        
        this.scene.cameras.main.centerOn(centerX,centerY)

        let sizeX = maxX-minX;
        let sizeY = maxY-minY;

        // Take the lowest zoom so that nothing goes outside the camera bounds
        let zoom = Math.min(this.scene.scale.width/sizeX, this.scene.scale.height/sizeY);

        this.scene.cameras.main.setZoom(zoom);

    }
}