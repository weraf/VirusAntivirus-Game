import { HtmlManager } from "./htmlmanager/htmlmanager.js";
import { Translator } from "./translator.js";
import { QUEUE_PREFERENCE, ACTIONS, EVENTS } from "../shared/enums.js";
import { GameState } from "../shared/gamestate.js";

export class GameUI extends EventTarget {

    static EVENTS = {
        PAUSE: "PAUSE",
        UNPAUSE: "UNPAUSE"
    } 

    /**
     * 
     * @param {HTMLElement} parent 
     * @param {Socket} socket 
     * @param {SoundManager}
     */
    constructor(parent, socket, soundManager) {
        super();
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
        this.tutorialFinished = false; // variable to distinguish between rules ingame and rules in tutorial
        this.rulesOpened = false; // are the rules currently open in game?
        
    }

    /**
     * 
     * @param {GameState} gameState 
     */
    connectToGameState(gameState) {
        gameState.addEventListener(GameState.EVENTS.GAME_OVER,(e) => {
            this.showWinScreen(e.detail);
        })
        gameState.addEventListener(GameState.EVENTS.UPDATE_TIMER, (e) => {
            this.updateTimer(e.detail);
        })
        gameState.addEventListener(GameState.EVENTS.TURN_CHANGED, (e) => {
            this.showCurrentPlayer(e.detail)
        })
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
        this.rules.hide()
    }

    showCurrentPlayer(current) {
        this.player_indicator.setPlaceholder("currentplayer", current ? "pantivirus": "pvirus") // Current = 0, pviru
    }

    updateTimer(time) {
        this.player_indicator.setPlaceholder("timer", time)
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
        this.showCurrentPlayer(0);
        this.waiting.switchTo(this.player_indicator);
        this.rulesbutton.show();
        this.setRulesButton();
    }

    setRulesButton() {
        
        this.rules.setPlaceholder("exittutorial", "exitrules") // Visa olika texter beroende på
    }

        showTutorial() {
        this.queue.switchTo(this.rules);

    }

    setup() {
        this.htmlManager.loadAll(["./ui/mainmenu.html", "./ui/queue.html", "./ui/player_indicator.html","./ui/winscreen.html", "./ui/rules.html", "./ui/rulesbutton.html", "./ui/waiting.html"]).then(() => {
            this.mainmenu = this.htmlManager.create("mainmenu");
            this.queue = this.htmlManager.create("queue");
            this.player_indicator = this.htmlManager.create("player_indicator");
            this.winscreen = this.htmlManager.create("winscreen");
            this.rules = this.htmlManager.create("rules");
            this.rulesbutton = this.htmlManager.create("rulesbutton");
            this.waiting = this.htmlManager.create("waiting");

            this.ui = document.getElementById("ui");

            const ruleswindow = this.ui.querySelector(".transparent.center");
            
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
                this.soundManager.play('click'); // ljud
                this.queuePreference = QUEUE_PREFERENCE.VIRUS;
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

            this.mainmenu.spectate.onclick = () => {
                this.soundManager.play('click'); // ljud
                this.mainmenu.switchTo(this.queue);
                this.socket.emit(ACTIONS.SPECTATE_GAME);
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

                this.soundManager.play('click'); // ljud
                this.queuePreference = QUEUE_PREFERENCE.ANTIVIRUS;
                // Visa en linje på den markerade knappen
                // this.mainmenu.antivirus.classList.add("selected");
                // this.mainmenu.virus.classList.remove("selected");



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

            this.rulesbutton.rulesbutton.onclick = () => {
                this.rulesOpened = true;
                this.soundManager.play('click'); // ljud 🤑
                this.rules.show();
                this.setRulesButton();
                this.dispatchEvent(new Event(GameUI.EVENTS.PAUSE));
            }

            this.rules.norulesbutton.onclick = () => {
                if (this.tutorialFinished === true) {
                    this.dispatchEvent(new Event(GameUI.EVENTS.UNPAUSE));
                    this.rules.hide();
                    this.tutorialOpened = false;
                } else {
                    this.tutorialFinished = true;
                    this.socket.emit(ACTIONS.READY)
                    this.rules.hide();
                    this.waiting.show();
                    this.rulesOpened = false;
                }
                this.soundManager.play('click'); // ljud 🤑
            }

            this.ui.onclick = (e) => {
                if (!ruleswindow.contains(e.target) && this.tutorialFinished && this.rulesOpened && !this.rulesbutton.rulesbutton.contains(e.target)) {
                    this.dispatchEvent(new Event(GameUI.EVENTS.UNPAUSE));
                    this.rules.hide();
                    this.rulesOpened = false;
                }
            };
        })
    }
}