import { Game } from "./game.js";
import { Board } from "./shared/board.js";

export default class InputHandler {
    /**
     * 
     * @param {Game} scene 
     * @param {Board} board 
     */
    constructor(scene, board) {
        this.scene = scene;
        this.board = board;
        this.clickZones = new Set();
        // Rotera zoner när brädet roterar
        this.board.addEventListener(Board.EVENTS.BOARD_FLIP,this.flipClickZones.bind(this));
    }

    flipClickZones() {
        this.clickZones.forEach((clickZone) => {
            const tempX = clickZone.x;
            clickZone.x = clickZone.y;
            clickZone.y = tempX;
        })
    }

    addInput(node, func) {
        let clickZone;
        const hitArea = new Phaser.Geom.Circle(0, 0, 25);
        
        clickZone = this.scene.add.zone(node.x, node.y); 
        
        clickZone.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
    
        clickZone.on('pointerdown', () => {
            func(node);
        });
    
        this.clickZones.add(clickZone);
    }

    removeAllInput() {
        this.clickZones.forEach(clickZone => {
            clickZone.removeAllListeners();
            clickZone.disableInteractive();
        });
        this.clickZones.clear();
    }
}