import { HtmlManager } from "../htmlmanager/htmlmanager.js";
import { Translator } from "../translator.js";
import { QUEUE_PREFERENCE, ACTIONS } from "../shared/enums.js";

export class GameUI {

    /**
     * 
     * @param {HTMLElement} parent 
     * @param {Socket} socket 
     */
    constructor(parent, socket) {
        this.htmlManager = new HtmlManager(parent);
        this.setup();
        this.queuePreference = QUEUE_PREFERENCE.ANY;
        // The simplest solution is to include a reference to socket in this class
        // Another option is having the class send events and game reacting on that,
        // but that would be a lot more code for doing the same thing.
        this.socket = socket;
    }

    showWinScreen(virusWon) {
        this.winscreen.setPlaceholder("wintext",virusWon ? Translator.getText("viruswon"):Translator.getText("antiviruswon"));
        this.winscreen.show();
    }

    showGameStart(isVirus) {
        this.player_indicator.setPlaceholder("myplayer", isVirus ? Translator.getText("pvirus"): Translator.getText("pantivirus"));
        this.player_indicator.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());
        this.queue.switchTo(this.player_indicator);
    }

    setup() {
        
        this.htmlManager.loadAll(["./ui/mainmenu.html", "./ui/queue.html", "./ui/player_indicator.html","./ui/winscreen.html"]).then(() => {
            this.mainmenu = this.htmlManager.create("mainmenu");
            this.queue = this.htmlManager.create("queue");
            this.player_indicator = this.htmlManager.create("player_indicator");
            this.winscreen = this.htmlManager.create("winscreen");
            
            this.htmlManager.showOnly(this.mainmenu);
            this.mainmenu.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());
            
            this.mainmenu.virus.onclick = () => {
                this.queuePreference = QUEUE_PREFERENCE.VIRUS;
                // Visa en linje på den markerade knappen
                this.mainmenu.virus.classList.add("selected");
                this.mainmenu.antivirus.classList.remove("selected");
            }
            
            this.mainmenu.antivirus.onclick = () => {
                this.queuePreference = QUEUE_PREFERENCE.ANTIVIRUS;
                // Visa en linje på den markerade knappen
                this.mainmenu.antivirus.classList.add("selected");
                this.mainmenu.virus.classList.remove("selected");
            }

            this.mainmenu.start.onclick = () => {
                this.mainmenu.switchTo(this.queue)
                this.socket.emit(ACTIONS.FIND_GAME,this.queuePreference)
                this.queue.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());
            }

            this.queue.abort.onclick = () => {
                this.queue.switchTo(this.mainmenu)
                this.socket.emit(ACTIONS.STOP_FINDING_GAME)
            }

            this.mainmenu.language_button.onclick = () => {
                if (Translator.language === "en") {
                    Translator.setLanguage("sv");
                } else {
                    Translator.setLanguage("en");
                }
                this.mainmenu.setLanguagePlaceholders(Translator.getDictionary(), Translator.getLanguage());
            }

        })
    }
}