// -=< STORY 2 || TASK 4 >=-
// Class to print the board using primarily game.js and shared/board.js

export class GameDrawer {
	constructor(scene, board) {
		this.scene = scene;
		this.board = board;
		this.graphics = scene.add.graphics();
	}
	
	draw() {
		this.drawEdges();
		this.drawNodes();
		this.drawServers();
	}
	
	drawNodes() {
		this.graphics.fillStyle(0xe5e5e5, 1);
		
		for (const node of this.board.nodes.values()) {
			this.graphics.fillCircle(node.x node.y, 18);
		}
	}
	
	drawEdges() {
		this.graphics.lineStyle(3, 0xffffff, 1);
		
		for (const edge of this.board.edges) {
			const from = this.board.nodes.get(edge.from);
			const to = this.board.nodes.get(edge.to);
			
			if (from && to) {
				this.graphics.strokeLineShape(
					new Phaser.Geom.Line(from.x, from.y, to.x, to.y)
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
