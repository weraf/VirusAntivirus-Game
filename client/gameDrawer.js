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
	
	