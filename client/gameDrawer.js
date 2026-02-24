import { Board } from "./shared/board.js";
import { Bugs } from "./shared/bugs.js";
import { Virus } from "./shared/virus.js";
import { Game } from "./game.js";
import InputHandler from "./inputhandler.js";
// // -=< STORY 2 || TASK 4 >=-
// // Class to print the board using primarily game.js and shared/board.js

const EDGE_COLOR = 0x75a5a9;
const NODE_COLOR = 0xe5e5e7;

const RED = 0xff1060;
const GREEN = 0x10ff80;

const BLUE = 0x0020ef;

export class GameDrawer {
    /**
     * @param {Phaser.Scene} scene 
     * @param {Board} board 
     */
    constructor(scene, board, inputHandler) {
        this.scene = scene;
        this.board = board;
		
		this.inputHandler = inputHandler;
        
		this.graphics = scene.add.graphics();

        this.glitchDrawer = new GlitchDrawer(scene, board);
        
        this.virusDrawer = new VirusDrawer(board.virus, scene);
        this.bugsDrawer = new BugsDrawer(board.bugs,scene);

		this.antivirusDrawer = new AntivirusDrawer(board.antivirus, scene);

		this.inputDrawer = new InputDrawer(scene, this.inputHandler);
        this.isRotated = false; // It's starts not rotated
        
        this.onResize();
    }

    onResize() {
        const shouldBeRotated = this.scene.scale.width > this.scene.scale.height;
        
		if (this.isRotated !== shouldBeRotated) {
            this.isRotated = shouldBeRotated;
            this.board.flipCoordinates(); 
            // Board is flipped, we need to redraw
            this.draw();
        }
        // Recenter camera
        this.centerCamera();
    }
    
    draw() {
        this.graphics.clear();
        this.drawEdges();
        this.drawNodes(); 
        this.virusDrawer.update();
        this.bugsDrawer.update();
        this.antivirusDrawer.update();
        this.inputDrawer.update();
    }
    
    drawNodes() {
        const av = this.board.antivirus;
    
        for (const node of this.board.getAllNodes()) {
            this.graphics.fillStyle(NODE_COLOR, 1);
            
            // Nod grafik
            if (node.isServer()) {
                // Server grafik
                this.graphics.fillStyle(0x191c26, 1);
                const width = 38;
                const height = 50;
                const cornerRadius = 5; 
                const x = node.x - width / 2;
                const y = node.y - height / 2;
                this.graphics.lineStyle(3, EDGE_COLOR, 1); 
                this.graphics.strokeRoundedRect(x - 1, y - 1, width + 2, height + 2, cornerRadius);

                this.graphics.fillRoundedRect(x, y, width, height, cornerRadius);

                this.graphics.lineStyle(1, 0x403a52, 0.8);
                this.graphics.lineBetween(x + 5, y + height * 0.4, x + width - 5, y + height * 0.4);
                this.graphics.lineBetween(x + 5, y + height * 0.7, x + width - 5, y + height * 0.7);

                // server lampor (Röd/Grön)
                this.graphics.fillStyle(GREEN, 1);
                this.graphics.fillCircle(x + 8, y + 8, 3);
                this.graphics.fillStyle(RED, 1);
                this.graphics.fillCircle(x + 16, y + 8, 3);

            } else {
                // Vanlig nod
                this.graphics.lineStyle(3, EDGE_COLOR, 1); 
                this.graphics.fillCircle(node.x, node.y, 18);
                this.graphics.strokeCircle(node.x, node.y, 18);
            }
        }
    }
    
    drawEdges() {
        this.graphics.lineStyle(3, EDGE_COLOR, 0.4); 
        for (const node of this.board.getAllNodes()) {
            for (const neighbor of node.neighbors) {
                if (node.id < neighbor.id) {
                    this.graphics.lineBetween(node.x, node.y, neighbor.x, neighbor.y);
                }
            }
        }
    }

    centerCamera() {
        let minX = 9999, minY = 9999, maxX = -9999, maxY = -9999;
        const nodes = this.board.getAllNodes()
        if (nodes.length == 0) {
            // Board has not loaded nodes yet, just center on (0,0) instead.
            this.scene.cameras.main.setZoom(1.0);
            this.scene.cameras.main.centerOn(0,0);
            return;
        }
        for (const node of nodes) {
            minX = Math.min(node.x, minX); minY = Math.min(node.y, minY);
            maxX = Math.max(node.x, maxX); maxY = Math.max(node.y, maxY);
        }
        const margin = 50;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        this.scene.cameras.main.centerOn(centerX, centerY);
        let zoom = Math.min(this.scene.scale.width / (maxX - minX + margin * 2), 
                            this.scene.scale.height / (maxY - minY + margin * 2));
        this.scene.cameras.main.setZoom(zoom);
    }

    animate() {
        this.inputDrawer.update();
        this.glitchDrawer.update();
    }
}

class BugsDrawer {
    /**
     * * @param {Bugs} bugs 
     * @param {Game} scene 
     */
    constructor(bugs,scene) {
        this.scene = scene;
        this.bugs = bugs;
        this.graphics = this.scene.add.graphics();
        this.prevNodes = [...this.bugs.nodes];
        this.nextNodes = [...this.bugs.nodes];
        this.animationProgress = 0.0;
        // Rita om buggarna om de har flyttat på sig
        this.bugs.addEventListener(Bugs.EVENTS.BUG_MOVED,this.update.bind(this));
    }

    hasChanged() {
        if (this.prevNodes.length !== this.bugs.nodes.length) {
            return true;
        }
        let changed = false;
        this.bugs.nodes.forEach((node,index) => {
            if (node !== this.prevNodes[index]) {
                changed = true;
                return true;
            }
        })
        return changed;
    }

    update() {
        if (!this.hasChanged()) {
            this.drawBetweenNodes(this.prevNodes,this.bugs.nodes,1.0);
            return;
        }
        this.nextNodes = [...this.bugs.nodes]; // shallow copy
        // animation time
        this.tween = this.scene.tweens.add({
            targets: this,
            animationProgress: {from: 0.0, to:1.0}, 
            duration: 800,
            ease: 'Quad.easeInOut',
            onUpdate: (tween, target, key, current, previous, param) => {
                this.drawBetweenNodes(this.prevNodes,this.nextNodes,current)
            },
            onComplete: (tween, targets) => {
                this.prevNodes = this.nextNodes;
                this.tween = null;
            }
        }) 
        
    }

    drawBetweenNodes(fromNodes,toNodes,progress) {
        this.graphics.clear();
        fromNodes.forEach((fromNode,index) => {
            const toNode = toNodes[index];
            const x = Phaser.Math.Linear(fromNode.x,toNode.x,progress);
            const y = Phaser.Math.Linear(fromNode.y,toNode.y,progress);
            let rot = progress*Math.PI*2;
            if (fromNode === toNode) {
                rot = 0; // No movement, don't rotate
            }
            this.graphics.fillStyle(0x8f1020);
            this.drawRotatedSquare(x,y,11,rot);
            this.graphics.fillStyle(RED);
            this.drawRotatedSquare(x,y,12,Math.PI/4+rot);

        });
    }

    drawRotatedSquare(centerX,centerY,size,rotation) {
        const g = this.graphics;
        g.beginPath()
        for (let i = 0; i < 4; i++) {
            let angle = (Math.PI/2) * i;
            let posX = centerX+size*Math.cos(rotation+angle+Math.PI/4); 
            let posY = centerY+size*Math.sin(rotation+angle+Math.PI/4); 
            if (i == 0) {
                g.moveTo(posX,posY);
            } else {
                g.lineTo(posX,posY);
            }
        }
        g.fillPath();
    }
}

class VirusDrawer {
    /**
     * * @param {Virus} virus
     * @param {Game} scene
     */
    constructor(virus, scene) {
        this.scene = scene;
        this.tween = null;
        this.virus = virus;
        this.prevNodes = [...this.virus.nodes];
        this.nextNodes = [...this.virus.nodes];
        this.animationProgress = 0.0; // Number between 0 and 1
        this.graphics = this.scene.add.graphics();
        this.lastRotation = false;
        
        // Automatically redraw snake when it has moved
        this.virus.addEventListener(Virus.EVENTS.MOVED,this.update.bind(this)); 
    }

    renderSnakeProgress(fromNodes,toNodes,progress,growAnim) {
        let HEAD_RADIUS = 14;
        let LINE_RADIUS = 10;
        const BODY_COLOR = RED;

        if (growAnim) {
            HEAD_RADIUS += (1-progress)*6;
            LINE_RADIUS += (1-progress)*2;
        }

        this.graphics.clear();
        this.graphics.fillStyle(BODY_COLOR);
        this.graphics.lineStyle(LINE_RADIUS*2, BODY_COLOR);

        // For each "body part"
        for (let i = 0; i < this.virus.nodes.length; i++) {
            const fromNode = fromNodes[i]; // The node we started at
            const toNode = toNodes[i]; // The node we will travel to

            const x = Phaser.Math.Linear(fromNode.x,toNode.x,progress);
            const y = Phaser.Math.Linear(fromNode.y,toNode.y,progress);
            this.graphics.fillCircle(x,y,i == 0 ? HEAD_RADIUS : LINE_RADIUS);
            // If not the head node, draw a line forward to the next node
            if (i != 0) {
                this.graphics.lineBetween(x,y,toNode.x,toNode.y);
            }
            // If not the last node, draw a line backward to the previous node
            if (i != this.virus.nodes.length-1) {
                const fromNode = this.virus.nodes[i+1];
                this.graphics.lineBetween(x,y,fromNode.x,fromNode.y);
                // Draw a circle on the node, connecting the two lines drawn by two adjacent body parts 
                this.graphics.fillCircle(fromNode.x,fromNode.y,LINE_RADIUS);
            }
        }
    }

    update() {
        
        if (this.nextNodes[0] === this.virus.nodes[0]) {
            // Head hasn't moved, therefor, no animation is needed.
            this.renderSnakeProgress(this.prevNodes,this.nextNodes,1.0)
            return;
        }
        
        // First, clear already running tween to avoid running two tweens at once
        if (this.tween) {
            const t = this.tween;
            this.tween.nextState(); // This will set this.tween to null, there for the t const
            t.destroy();
        }

        this.nextNodes = [...this.virus.nodes]; // shallow copy
        let hasGrown = false;
        if (this.virus.nodes.length > this.prevNodes.length) {
            // First: Add missing previous nodes
            for (let n = this.prevNodes.length-1; n < this.virus.nodes.length; n++) {
                this.prevNodes.push(this.virus.nodes[n]);
            }
            hasGrown = true;
        }

        this.tween = this.scene.tweens.add({
            targets: this,
            animationProgress: {from: 0.0, to:1.0}, 
            duration: 400,
            ease: 'Quad.easeInOut',
            onUpdate: (tween, target, key, current, previous, param) => {
                this.renderSnakeProgress(this.prevNodes,this.nextNodes,current,hasGrown)
            },
            onComplete: (tween, targets) => {
                this.prevNodes = this.nextNodes;
                this.tween = null;
            }
        })        
        
    }
}

class AntivirusDrawer {
	constructor(antivirus, scene) {
        this.scene = scene;
        this.antivirus = antivirus;
        this.graphics = this.scene.add.graphics();
        this.displayNodes = this.antivirus.nodes.map(node => (this.scene.add.image(node.x,node.y,"shield").setScale(0.25)));
        
        this.animationProgress = 1.0;
        this.tween = null;
        this.antivirus.addEventListener(Virus.EVENTS.MOVED, this.startMoveAnimation.bind(this));
    }

    update() {
        if (this.tween && this.tween.isPlaying()) return;
        
        this.antivirus.nodes.forEach((node, i) => {
            this.displayNodes[i].x = node.x;
            this.displayNodes[i].y = node.y;
        })

        this.draw();
    }

    startMoveAnimation() {
        if (this.tween) this.tween.stop();

        const startPositions = this.displayNodes.map(p => ({ x: p.x, y: p.y }));
        const endPositions = this.antivirus.nodes.map(n => ({ x: n.x, y: n.y }));

        this.animationProgress = 0;
        this.tween = this.scene.tweens.add({
            targets: this,
            animationProgress: 1,
            duration: 800, 
            ease: 'Elastic.easeOut',
            easeParams: [1, 0.5],
            onUpdate: () => {
                for (let i = 0; i < this.displayNodes.length; i++) {
                    this.displayNodes[i].x = Phaser.Math.Linear(startPositions[i].x, endPositions[i].x, this.animationProgress);
                    this.displayNodes[i].y = Phaser.Math.Linear(startPositions[i].y, endPositions[i].y, this.animationProgress);
                }
                this.draw();
            },
            onComplete: () => {
                this.tween = null;
                this.draw();
            }
        });
    }

    draw() {
        this.graphics.clear();
        this.displayNodes.forEach((pos, index) => {
            return;
            const isSelected = this.antivirus.selectedNode === this.antivirus.nodes[index];
            
            // Yttre ring
            this.graphics.lineStyle(2, EDGE_COLOR, 0.5);
            this.graphics.strokeCircle(pos.x, pos.y, 28);

            //Huvudcirkeln
            const mainColor = isSelected ? 0x0077ff : BLUE;
            this.graphics.lineStyle(4, mainColor, 1);
            this.graphics.strokeCircle(pos.x, pos.y, 21);

			this.graphics.lineStyle(2, mainColor, 0.8);
        
			this.graphics.lineStyle(3, BLUE, 1); // Vit för max synlighet
            
			// Vertikal streck
			this.graphics.lineBetween(pos.x, pos.y - 12, pos.x, pos.y + 12);
			// Horisontell streck
			this.graphics.lineBetween(pos.x - 12, pos.y, pos.x + 12, pos.y);
			
			// liten kvadrat i mitten
			this.graphics.fillStyle(BLUE, 1);
			this.graphics.fillRect(pos.x - 4, pos.y - 4, 8, 8);
	
			// hörn vinklar
			this.graphics.lineStyle(2, mainColor, 1);
			const d = 14;
			const s = 5;
			// vinklar uppe
			this.graphics.lineBetween(pos.x - d, pos.y - d, pos.x - d + s, pos.y - d);
			this.graphics.lineBetween(pos.x - d, pos.y - d, pos.x - d, pos.y - d + s);
			this.graphics.lineBetween(pos.x - d, pos.y + d, pos.x - d + s, pos.y + d);
			this.graphics.lineBetween(pos.x - d, pos.y + d, pos.x - d, pos.y + d - s);
			// vinklar nere 
			this.graphics.lineBetween(pos.x + d, pos.y - d, pos.x + d - s, pos.y - d);
			this.graphics.lineBetween(pos.x + d, pos.y - d, pos.x + d, pos.y - d + s);
            this.graphics.lineBetween(pos.x + d, pos.y + d, pos.x + d - s, pos.y + d);
            this.graphics.lineBetween(pos.x + d, pos.y + d, pos.x + d, pos.y + d - s);
            
			if (isSelected) {
				this.graphics.fillStyle(0x00ffff, 0.3);
				this.graphics.fillCircle(pos.x, pos.y, 22);
				this.graphics.lineStyle(2, 0xffffff, 0.8);
				this.graphics.strokeCircle(pos.x, pos.y, 24);
			}
        });
    }

}

const INPUT_COLOR = 0x00dddd;

class InputDrawer {
    /**
     * 
     * @param {Game} scene 
     * @param {InputHandler} inputHandler 
     */
    constructor(scene, inputHandler) {
        this.scene = scene;
        this.inputHandler = inputHandler;
        this.graphics = this.scene.add.graphics();
        this.hasActiveInputs = false;
        
        // Rita om input-hints (gröna cirklar) när input har ändrats
        this.inputHandler.addEventListener(InputHandler.EVENTS.CHANGED,this.inputChanged.bind(this))
    }

    inputChanged() {
        this.hasActiveInputs = this.inputHandler.activeNodes.length > 0;
        if (this.hasActiveInputs) {
            this.update();
        } else {
            // No more active, clear them
            this.graphics.clear();
        }
    }

    update() {
        if (!this.hasActiveInputs) {
            return;
        }
		this.graphics.clear();
        const inputNodes = this.inputHandler.activeNodes;
        const av = this.inputHandler.board.antivirus;
        const time = performance.now();
        const size = Math.sin(time*0.005)*1+1;
        for (const node of inputNodes) {

            if (av && av.hasNode(node)) {
                if (av.selectedNode == node) {
                    continue; // Don't draw on the selected one
                }
                this.graphics.fillStyle(0xffffff,1.0);
                this.graphics.fillCircle(node.x,node.y,5+size);
                continue;
            }

            this.graphics.lineStyle(3,INPUT_COLOR, 1); 
            this.graphics.fillStyle(INPUT_COLOR, 0.25);
            if (node.isServer()) {
                const width = 48+size;
                const height = 60+size;
                const x = node.x - width / 2;
                const y = node.y - height / 2;
                this.graphics.strokeRoundedRect(x - 1, y - 1, width + 2, height + 2, 10);
                //this.graphics.fillRoundedRect(x - 1, y - 1, width + 2, height + 2, 10);
            } else {
                this.graphics.strokeCircle(node.x, node.y, 23+size);
                //this.graphics.fillCircle(node.x, node.y, 23+size);
            }
		}
	}
}

class GlitchDrawer {
    /**
     * @param {Game} scene 
     * @param {Board} board 
     */
    constructor(scene, board) {
        this.graphics = scene.add.graphics();
        this.serverNodes = board.getAllNodes().filter((n) => {return n.isServer()});
        this.board = board;
        this.board.addEventListener(Board.EVENTS.BOARD_FLIP,() => {
            // Update positions of particles if board gets flipped
            this.serverNodes.forEach((server, index) => {
                this.emitters[index].x = server.x;
                this.emitters[index].y = server.y;
            })
        })
        this.emitters = [];
        // Create one particle system per server
        for (const server of this.serverNodes) {
            const newEmitter = scene.add.particles(server.x,server.y, 'fire', {
                speed: {start: 30, end: 0, random: true},
                emitZone: {
                    type: 'random',
                    source: new Phaser.Geom.Rectangle(-10,-10,20,30)
                },
                rotate: {min: -20, max: 20},
                blendMode: "ADD",
                lifespan: 1500,
                gravityY: -30,
                quantity: 3,
                frequency: 700,
                scale: {values: [0, 0.6, 0.5, 0.2, 0.0], interpolation: "catmull"},
                
            })
            this.emitters.push(newEmitter)
        }
    }
    
    update() {
        this.graphics.clear()
        
        this.serverNodes.forEach((server, index) => {
            const emitter = this.emitters[index]; 
            if (this.board.virus.hasNode(server)) {
                if (!emitter.emitting) {
                    emitter.start()
                }
            } else {
                if (emitter.emitting) {
                    emitter.stop()
                }
            }
        });
        

    }

}