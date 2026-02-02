export default class InputHandler {
    constructor(scene, board) {
        this.scene = scene;
        this.board = board;
        this.activeObjects = new Set();
    }

    enableInput(isRotated) {
        this.disableAllInput();

        for (const node of this.board.getAllNodes()) {
            let clickZone;

            let drawX = isRotated ? node.y : node.x;
            let drawY = isRotated ? node.x : node.y;

            if (node.type === 'node') {
                const hitNode = new Phaser.Geom.Circle(0, 0, 18);
                clickZone = this.scene.add.zone(drawX, drawY);
                clickZone.setInteractive(hitNode, Phaser.Geom.Circle.Contains);
            } else {
                const hitServer = new Phaser.Geom.Rectangle(0, 0, 40, 40);
                clickZone = this.scene.add.zone(drawX, drawY, 40, 40);
                clickZone.setInteractive(hitServer, Phaser.Geom.Rectangle.Contains);
            }

            clickZone.on('pointerdown', () => {
                console.log("id:", node.id, "x:", node.x, "y:", node.y, "nodtyp:", node.type);
                console.log("Grannar: ", node.getNeighborIds().join(', '));
                this.scene.handleNodeClick(node.id);
            });

            this.activeObjects.add(clickZone);
        }
    }

    disableAllInput() {
        this.activeObjects.forEach(node => {
            node.removeAllListeners();
            node.disableInteractive();
        });
        this.activeObjects.clear();
    }
}
