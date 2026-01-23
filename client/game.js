// Test av att importera ett skript med en funktion från en annan fil (som exempel)
import { testPrint } from "./shared/test_shared.js";
import { HtmlManager}  from "./htmlmanager/htmlmanager.js"
testPrint(); // Ska skriva ut i konsolen

const htmlManager = new HtmlManager(document.getElementById("ui"));

// Game klassen (skulle kunna sättas i egen fil men detta funkar bra än så länge)
class Game extends Phaser.Scene {
    create() {
        // Rita en röd testcirkel i mitten av skärmen
        const graphics = this.add.graphics({fillStyle:{color: 0xff0000}});
        graphics.fillCircle(this.scale.width/2,this.scale.height/2,40);

        // Ladda in test UI och sätt upp så att något händer om man klickar på knappen
        htmlManager.loadAll(["./ui/testui.html"]).then(() => {
            let testui = htmlManager.create("testui");
            testui.testbutton.onclick = () => {
                testui.testtext.innerText = "Du klickade på knappen!";
            }
        })
    }
}

const config = {
    width: window.innerWidth,
    height: window.innerHeight,
    type: Phaser.AUTO,
    scale: {
            // För att spelet ska fylla hela skärmen
            mode: Phaser.Scale.EXPAND,
            autoCenter: Phaser.Scale.NO_CENTER,
    },
    parent: 'game',
    scene: Game
};

const game = new Phaser.Game(config);
