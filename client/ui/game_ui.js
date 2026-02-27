import { HtmlManager } from "./htmlmanager/htmlmanager.js";
import { Translator } from "./translator.js";
import { QUEUE_PREFERENCE, ACTIONS, EVENTS } from "../shared/enums.js";
import { GameState } from "../shared/gamestate.js";

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

    setRoleTheme(role) {
        this.mainPanel.classList.remove("virus", "antivirus", "spectator");
        if (role) {
            this.mainPanel.classList.add(role);
        }
    }

    showWinScreen(virusWon) {
        this.winscreen.setPlaceholder("wintext",virusWon ? "viruswon":"antiviruswon");
        this.player_indicator.switchTo(this.winscreen);
        this.winscreen.wintext.classList.add(virusWon ? "red" : "blue");
        this.winscreen.leavebutton.onclick = this.leaveGame.bind(this);
        this.player_indicator.midleavebutton.hidden = true; // Hide the other leave button
    }

    showCurrentPlayer(current) {
        // Add a class that will make the active player light up
        if (current == 0) {
            this.player_indicator.turnvirus.classList.add("activeturn");
            this.player_indicator.turnantivirus.classList.remove("activeturn");
        } else {
            this.player_indicator.turnantivirus.classList.add("activeturn");
            this.player_indicator.turnvirus.classList.remove("activeturn");
        }
        //this.player_indicator.setPlaceholder("currentplayer", current ? "pantivirus": "pvirus") // Current = 0, pviru
    }

    updateTimer(time) {
        this.player_indicator.setPlaceholder("timer", time);
        if (time <= 5) { // Borde man göra så att den bara blinkar om det är ens tur? (GameState svårt att nå härifrån)
            // PANIK!
            this.player_indicator.timer.classList.add("timecritical");
        } else {
            this.player_indicator.timer.classList.remove("timecritical");
        }
    }

    showGameStart(isVirus, isSpectator) {
        this.player_indicator.midleavebutton.hidden = true; // Hide leave button as default

        if (isSpectator) {
            this.player_indicator.midleavebutton.hidden = false;
            this.player_indicator.midleavebutton.onclick = this.leaveGame.bind(this);
            HtmlManager.hide(this.player_indicator.youantivirus)
            HtmlManager.hide(this.player_indicator.youvirus)
        } else {
            // Show who I am
            if (isVirus) {
                HtmlManager.hide(this.player_indicator.youantivirus)
                HtmlManager.show(this.player_indicator.youvirus)
            } else {
                HtmlManager.hide(this.player_indicator.youvirus)
                HtmlManager.show(this.player_indicator.youantivirus)
            }
        }
        this.showCurrentPlayer(0);
        this.queue.switchTo(this.player_indicator);
    }

    isSmallScreen() {
        return Math.min(window.innerWidth,window.innerHeight) < 800;
    }

    startFullscreen() {
        if (!this.isSmallScreen()) {
            return; // Only auto enable fullscreen on small screens (mobile)
        }
        const gameElement = document.getElementById("game");
        if (gameElement.requestFullscreen) {
            gameElement.requestFullscreen();
        } else if (gameElement.webkitRequestFullscreen) { /* Safari */
            gameElement.webkitRequestFullscreen();
        }
    }

    setup() {
        this.htmlManager.loadAll(["./ui/mainmenu.html", "./ui/queue.html", "./ui/player_indicator.html","./ui/winscreen.html"]).then(() => {
            this.mainmenu = this.htmlManager.create("mainmenu");
            this.mainPanel = this.mainmenu.root;
            this.queue = this.htmlManager.create("queue");
            this.player_indicator = this.htmlManager.create("player_indicator");
            this.winscreen = this.htmlManager.create("winscreen");

            // Blank description text från början
            this.htmlManager.showOnly(this.mainmenu);

            // Blank description text från början
            this.mainmenu.setPlaceholder("description", "");


            this.mainmenu.virus.onclick = () => {
                this.soundManager.play('click');

                this.queuePreference = QUEUE_PREFERENCE.VIRUS;

                this.mainmenu.switchTo(this.queue);

                this.socket.emit(ACTIONS.FIND_GAME, this.queuePreference);
                this.startFullscreen();
            }

            this.mainmenu.spectate.onclick = () => {
                this.soundManager.play('click'); // ljud
                this.mainmenu.switchTo(this.queue);
                this.socket.emit(ACTIONS.SPECTATE_GAME);
                this.startFullscreen();
            }
            
            this.mainmenu.antivirus.onclick = () => {
                this.soundManager.play('click');

                this.queuePreference = QUEUE_PREFERENCE.ANTIVIRUS;
                // Visa en linje på den markerade knappen
                // this.mainmenu.antivirus.classList.add("selected");
                // this.mainmenu.virus.classList.remove("selected");


                this.mainmenu.switchTo(this.queue);

                this.socket.emit(ACTIONS.FIND_GAME, this.queuePreference);
                this.startFullscreen();
            }

            this.mainmenu.start.onclick = () => {
                this.soundManager.play('click'); // ljud
                this.mainmenu.switchTo(this.queue)
                this.socket.emit(ACTIONS.FIND_GAME, QUEUE_PREFERENCE.ANY);
                this.startFullscreen();
            }

            // --------------------- AI BUTTON ----------------------- 
            if (this.mainmenu.playai) {
                this.mainmenu.playai.onclick = () => {
                    this.soundManager.play('click');
                    this.mainmenu.switchTo(this.queue);
                    if (this.queuePreference === QUEUE_PREFERENCE.ANTIVIRUS) {
                        this.socket.emit(ACTIONS.FIND_GAME, QUEUE_PREFERENCE.AI_AS_VIRUS);
                    } else {
                        this.socket.emit(ACTIONS.FIND_GAME, QUEUE_PREFERENCE.AI_AS_ANTIVIRUS);
                    }
                }
            }
            // -------------------------------------------------------

            // --------------------- AI VS AI BUTTON -----------------
            if (this.mainmenu.watchai) {
                this.mainmenu.watchai.onclick = () => {
                    this.soundManager.play('click');
                    this.mainmenu.switchTo(this.queue);
                    this.socket.emit(ACTIONS.FIND_GAME, QUEUE_PREFERENCE.AI_VS_AI);
                }
            }
            // -------------------------------------------------------


            this.queue.abort.onclick = () => {
                this.soundManager.play('click'); // ljud
                this.queue.switchTo(this.mainmenu)
                this.socket.emit(ACTIONS.STOP_FINDING_GAME)
            }

            this.mainmenu.languageBtn.onclick = () => {
                this.soundManager.play('click'); // ljud
                if (Translator.language === "en") {
                    Translator.setLanguage("sv");
                } else {
                    Translator.setLanguage("en");
                }
                Translator.refreshInstances(this.htmlManager.getVisibleInstances())
            }

            lucide.createIcons();
        })
    }
}