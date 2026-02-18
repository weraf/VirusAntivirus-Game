import { HtmlManager } from "./htmlmanager/htmlmanager.js";
import { Translator } from "./translator.js";
import { QUEUE_PREFERENCE, ACTIONS } from "../shared/enums.js";

export class GameUI {

    /**
     * 
     * @param {HTMLElement} parent 
     * @param {Socket} socket 
     */
    constructor(parent, socket) {
        this.htmlManager = new HtmlManager(parent);
        Translator.connectToHTMLManager(this.htmlManager);
        // Fetch the translations and then load the UI
        Translator.fetchTranslations().then(this.setup.bind(this))
        this.queuePreference = QUEUE_PREFERENCE.ANY;
        // The simplest solution is to include a reference to socket in this class
        // Another option is having the class send events and game reacting on that,
        // but that would be a lot more code for doing the same thing.
        this.socket = socket;
    }

    showWinScreen(virusWon) {
        this.winscreen.setPlaceholder("wintext",virusWon ? "viruswon":"antiviruswon");
        this.winscreen.show();
        this.winscreen.wintext.classList.add(virusWon ? "red" : "blue")
    }

    showGameStart(isVirus) {
        this.player_indicator.setPlaceholder("myplayer", isVirus ? "pvirus": "pantivirus");
        this.queue.switchTo(this.player_indicator);
    }

    setup() {
        this.htmlManager.loadAll(["./ui/mainmenu.html", "./ui/queue.html", "./ui/player_indicator.html","./ui/winscreen.html"]).then(() => {
            this.mainmenu = this.htmlManager.create("mainmenu");
            this.queue = this.htmlManager.create("queue");
            this.player_indicator = this.htmlManager.create("player_indicator");
            this.winscreen = this.htmlManager.create("winscreen");
            
            this.htmlManager.showOnly(this.mainmenu);

            // Blank description text från början
            this.mainmenu.setPlaceholder("description", "");

            this.mainmenu.rules.onclick = () => {
                this.activeRules = !this.activeRules
                if (!this.activeRules) {
                        this.mainmenu.setPlaceholder("description", "");
                        return;
                } 
                if (this.queuePreference === QUEUE_PREFERENCE.VIRUS) {
                    this.mainmenu.setPlaceholder("description", "virusdescription");
                    return;
                }
                if (this.queuePreference === QUEUE_PREFERENCE.ANTIVIRUS) {
                    this.mainmenu.setPlaceholder("description", "antivirusdescription");
                    return;
                }
            }


            this.mainmenu.virus.onclick = () => {
                // this.queuePreference = QUEUE_PREFERENCE.VIRUS;
                // Visa virustexten
                // this.mainmenu.setPlaceholder("description", "virusdescription")
                // Visa en linje på den markerade knappen
                // this.mainmenu.virus.classList.add("selected");
                // this.mainmenu.antivirus.classList.remove("selected");
                if(this.mainmenu.virus.classList.contains("selected")) {
                    this.mainmenu.virus.classList.remove("selected");
                    this.mainmenu.setPlaceholder("description", "")
                    this.mainmenu.rules.classList.add("hidden");
                    this.queuePreference = QUEUE_PREFERENCE.ANY;
                } else {
                    this.activeRules = false;
                    this.mainmenu.virus.classList.add("selected");
                    this.mainmenu.antivirus.classList.remove("selected");
                    this.mainmenu.setPlaceholder("description", "")
                    this.mainmenu.rules.classList.remove("hidden");
                    this.queuePreference = QUEUE_PREFERENCE.VIRUS;
                }

            }
            
            this.mainmenu.antivirus.onclick = () => {     
                if(this.mainmenu.antivirus.classList.contains("selected")) {
                    this.mainmenu.antivirus.classList.remove("selected");
                    this.mainmenu.setPlaceholder("description", "")
                    this.mainmenu.rules.classList.add("hidden");
                    this.queuePreference = QUEUE_PREFERENCE.ANY;
                } else {
                    this.activeRules = false;
                    this.mainmenu.antivirus.classList.add("selected");
                    this.mainmenu.virus.classList.remove("selected");
                    this.mainmenu.setPlaceholder("description", "")
                    this.mainmenu.rules.classList.remove("hidden");
                    this.queuePreference = QUEUE_PREFERENCE.ANTIVIRUS;
                }
                // Visa en linje på den markerade knappen
                // this.mainmenu.antivirus.classList.add("selected");
                // this.mainmenu.virus.classList.remove("selected");



            }

            this.mainmenu.start.onclick = () => {
                this.mainmenu.switchTo(this.queue)
                this.socket.emit(ACTIONS.FIND_GAME,this.queuePreference)
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
                Translator.refreshInstances(this.htmlManager.getVisibleInstances())
            }

        })
    }
}