// // -=< STORY 2 || TASK 4 >=-
// // Class to print the board using primarily game.js and shared/board.js

export class GameDrawer {
	constructor(scene, board) {
 		this.scene = scene;
 		this.board = board;
 		this.graphics = scene.add.graphics();
 	}
	
	draw() {
        this.centerCamera();
		this.drawEdges();
 		this.drawNodes();
		//this.drawServers();
		//tar bort detta för att det kan ritas i drawNodes istället
	}

    // Moves and zooms the camera so that the entire board fits
    centerCamera() {
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

