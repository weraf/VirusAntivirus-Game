// // -=< STORY 2 || TASK 4 >=-
// // Class to print the board using primarily game.js and shared/board.js

export class GameDrawer {
	constructor(scene, board) {
 		this.scene = scene;
 		this.board = board;
 		this.graphics = scene.add.graphics();
 	}
	
	draw() {
		this.drawEdges();
 		this.drawNodes();
		//this.drawServers();
		//tar bort detta för att det kan ritas i drawNodes istället
	}
	
	drawNodes() {
		for (const node of this.board.nodes.values()) {
            if (node.type === 'server') {
                this.graphics.fillStyle(0xb5b5b5, 1);
                // Roterar 90 grader
                this.graphics.fillRect(node.y - 20, node.x - 20, 40, 40);
            } else {
                this.graphics.fillStyle(0xe5e5e5, 1);
                // Roterar 90 grader
                this.graphics.fillCircle(node.y, node.x, 18);
            }
        }
 	}
	
 	drawEdges() {
		this.graphics.lineStyle(3, 0xffffff, 0.5);
        
        for (const edge of this.board.edges) {
            const from = this.board.nodes.get(edge.from);
            const to = this.board.nodes.get(edge.to);
            
            if (from && to) {
                // Roterar också 90 grader här
                this.graphics.strokeLineShape(
                    new Phaser.Geom.Line(from.y, from.x, to.y, to.x)
                );
 			}
 		}
 	}
	
 	drawServers() {
 		this.graphics.fillStyle(0xb5b5b5, 1);
		
 		// TEST POSITIONS
 		this.graphics.fillRect(100, 100, 40, 40);
         this.graphics.fillRect(160, 100, 40, 40);
         this.graphics.fillRect(220, 100, 40, 40);
     }
 }

