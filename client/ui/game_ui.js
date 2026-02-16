import { HtmlManager } from "./htmlmanager/htmlmanager.js";
import { Translator } from "./translator.js";
import { QUEUE_PREFERENCE, ACTIONS, EVENTS } from "../shared/enums.js";

export class GameUI {

    /**
     * 
     * @param {HTMLElement} parent 
     * @param {Socket} socket 
     * @param {SoundManager}
     */
    constructor(parent, socket, soundManager) {
        this.soundManager = soundManager;
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

    leaveGame() {
        this.socket.emit(ACTIONS.LEAVE_GAME);
        location.reload(); // TODO: implement going back to menu without reloading the page
    }

    showWinScreen(virusWon) {
        this.winscreen.setPlaceholder("wintext",virusWon ? "viruswon":"antiviruswon");
        this.winscreen.show();
        this.winscreen.wintext.classList.add(virusWon ? "red" : "blue");
        this.winscreen.leavebutton.onclick = this.leaveGame.bind(this);
        this.player_indicator.midleavebutton.hidden = true; // Hide the other leave button
    }

    showGameStart(isVirus, isSpectator) {
        this.player_indicator.midleavebutton.hidden = true; // Hide leave button as default

        if (isSpectator) {
            this.player_indicator.playingas.hidden = true;
            this.player_indicator.midleavebutton.hidden = false;
            this.player_indicator.midleavebutton.onclick = this.leaveGame.bind(this);
        } else {
            this.player_indicator.setPlaceholder("myplayer", isVirus ? "pvirus": "pantivirus");
        }
        this.queue.switchTo(this.player_indicator);
    }

    setup() {
        this.htmlManager.loadAll(["./ui/mainmenu.html", "./ui/queue.html", "./ui/player_indicator.html","./ui/winscreen.html"]).then(() => {
            this.mainmenu = this.htmlManager.create("mainmenu");
            this.queue = this.htmlManager.create("queue");
            this.player_indicator = this.htmlManager.create("player_indicator");
            this.winscreen = this.htmlManager.create("winscreen");
            
            this.htmlManager.showOnly(this.mainmenu);
            
            this.mainmenu.virus.onclick = () => {
                this.soundManager.play('click'); // ljud
                this.queuePreference = QUEUE_PREFERENCE.VIRUS;
                // Visa en linje på den markerade knappen
                this.mainmenu.virus.classList.add("selected");
                this.mainmenu.antivirus.classList.remove("selected");
            }

            this.mainmenu.spectate.onclick = () => {
                this.mainmenu.switchTo(this.queue);
                this.socket.emit(ACTIONS.SPECTATE_GAME);
            }
            
            this.mainmenu.antivirus.onclick = () => {
                this.soundManager.play('click'); // ljud
                this.queuePreference = QUEUE_PREFERENCE.ANTIVIRUS;
                // Visa en linje på den markerade knappen
                this.mainmenu.antivirus.classList.add("selected");
                this.mainmenu.virus.classList.remove("selected");
            }

            this.mainmenu.start.onclick = () => {
                this.soundManager.play('click'); // ljud
                this.mainmenu.switchTo(this.queue)
                this.socket.emit(ACTIONS.FIND_GAME,this.queuePreference)
            }

            this.queue.abort.onclick = () => {
                this.soundManager.play('click'); // ljud
                this.queue.switchTo(this.mainmenu)
                this.socket.emit(ACTIONS.STOP_FINDING_GAME)
            }

            this.mainmenu.language_button.onclick = () => {
                this.soundManager.play('click'); // ljud
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