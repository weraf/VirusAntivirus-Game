export default class InputHandler {
    constructor(scene, board) {
        this.scene = scene;
        this.board = board;
        this.activeObjects = new Set();
    }

    addInput(node, func) {
        let clickZone;
        const hitArea = new Phaser.Geom.Circle(0, 0, 25);
        clickZone = this.scene.add.zone(node.y, node.x);
        clickZone.setInteractive(hitArea, Phaser.Geom.Circle.Contains);

        clickZone.on('pointerdown', () => {
            func(node);
        });

        this.activeObjects.add(clickZone);
    }

    removeAllInput() {
        this.activeObjects.forEach(clickZone => {
            clickZone.removeAllListeners();
            clickZone.disableInteractive();
        });
        this.activeObjects.clear();
    }
}