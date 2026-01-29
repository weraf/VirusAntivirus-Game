// // -=< STORY 2 || TASK 4 >=-
// // Class to print the board using primarily game.js and shared/board.js

export class GameDrawer {
    constructor(scene, board) {
        this.scene = scene;
        this.board = board;
        this.graphics = scene.add.graphics();
    }
    
    draw(highlightIds = []) {
        this.graphics.clear();
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
    
            // Rotera 90 grader
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
}