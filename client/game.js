// Test av att importera ett skript med en funktion från en annan fil (som exempel)
import { HtmlManager}  from "./htmlmanager/htmlmanager.js"
import { ACTIONS }  from "./shared/enums.js";
import { Translator } from "./translator.js";

const htmlManager = new HtmlManager(document.getElementById("ui"));
const socket = io();

// Game klassen (skulle kunna sättas i egen fil men detta funkar bra än så länge)
class Game extends Phaser.Scene {
    create() {
        // Rita en röd testcirkel i mitten av skärmen
        //const graphics = this.add.graphics({fillStyle:{color: 0xff0000}});
        //graphics.fillCircle(this.scale.width/2,this.scale.height/2,40);

        // Ladda in test UI och sätt upp så att något händer om man klickar på knappen
        htmlManager.loadAll(["./ui/testui.html", "./ui/mainmenu.html", "./ui/queue.html"]).then(() => {
            let testui = htmlManager.create("testui");
            let mainmenu = htmlManager.create("mainmenu");
            let queue = htmlManager.create("queue", {"state": "Väntar på motståndare..."})

            //http://localhost:3000/

            htmlManager.showOnly(mainmenu);

            mainmenu.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());

            //mainmenu.setPlaceholders(
            //    Object.fromEntries(Object.entries(Translator.getDictionary()).map(([k,v]) => [k, v[Translator.language]]))
            //);

            // mainmenu.setLanguagePlaceholders(Translator.getDictionary())
 
            socket.on("game_found", () => {
                queue.setPlaceholder("state", "Match hittad!")
                queue.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());
                HtmlManager.hide(queue.abort)
                }
            )
            


            //testui.testbutton.onclick = () => {
            //    testui.switchTo(mainmenu)
            //    // testui.testtext.innerText = "Du klickade på knappen!";
            //}

//            mainmenu.virus.onClick = () => {
//
//            }
//
//
//            mainmenu.antivirus.onclick = () => {
//
//            }
//
//            mainmenu.spectator.onclick = () => {
//
//            }
            mainmenu.start.onclick = () => {
                mainmenu.switchTo(queue)
                socket.emit(ACTIONS.FIND_GAME)
                queue.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());
            }

            queue.abort.onclick = () => {
                queue.switchTo(mainmenu)
                socket.emit(ACTIONS.STOP_FINDING_GAME)
                
            }

            mainmenu.language_button.onclick = () => {
                Translator.setLanguage("zh");
                mainmenu.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());
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


await Translator.init();
const game = new Phaser.Game(config);
