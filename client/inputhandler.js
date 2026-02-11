import { Game } from "./game.js";
import { Board } from "./shared/board.js";

export default class InputHandler extends EventTarget {
    
    static EVENTS = {
        CHANGED: "changed" // emitted when input was added/removed
    } 
    
    /**
     * 
     * @param {Game} scene 
     * @param {Board} board 
     */
    constructor(scene, board) {
        super();
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
        const hitArea = new Phaser.Geom.Circle(0, 0, 25);
        
        const clickZone = this.scene.add.zone(node.x, node.y); 
        
        clickZone.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
    
        clickZone.on('pointerdown', () => {
            func(node);
        });

        clickZone.node = node; // Keep reference to node it is on
    
        this.clickZones.add(clickZone);
        // Signal that inputs have changed
        this.dispatchEvent(new Event(InputHandler.EVENTS.CHANGED));
    }

    removeAllInput() {
        this.clickZones.forEach(clickZone => {
            clickZone.removeAllListeners();
            clickZone.disableInteractive();
            clickZone.destroy(); // Viktigt att förstöra objektet helt
        });
        this.clickZones.clear();
        // Signal that inputs have changed
        this.dispatchEvent(new Event(InputHandler.EVENTS.CHANGED));
    }

    get activeNodes() {
        // Return all nodes that has a clickzone
        const nodes = [];
        for (const clickZones of this.clickZones.values()) {
            nodes.push(clickZones.node);
        }
        return nodes;
    }
}