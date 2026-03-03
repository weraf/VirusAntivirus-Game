import { HtmlManager } from "./htmlmanager/htmlmanager.js";
import { Translator } from "./translator.js";
import { QUEUE_PREFERENCE, ACTIONS, EVENTS } from "../shared/enums.js";
import { GameState } from "../shared/gamestate.js";

export class GameUI extends EventTarget {

    static EVENTS = {
        LEAVE_GAME: "leave_game",
    }

    /**
     * 
     * @param {HTMLElement} parent 
     */
    constructor(parent) {
        super();
        this.htmlManager = new HtmlManager(parent);
        Translator.connectToHTMLManager(this.htmlManager);
        // Fetch the translations and then load the UI
        Translator.fetchTranslations().then(this.setup.bind(this))
        this.queuePreference = QUEUE_PREFERENCE.ANY;
    }
    
    /**
     * @param {Socket} socket 
     */
    setSocket(socket) {
        // The simplest solution is to include a reference to socket in this class
        // Another option is having the class send events and game reacting on that,
        // but that would be a lot more code for doing the same thing.
        this.socket = socket;
    }

    /**
     * 
     * @param {SoundManager} soundManager 
     */
    setSoundManager(soundManager) {
        this.soundManager = soundManager;
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

    leaveGamePressed() {
        // Send event to game that can restart the scene
        this.dispatchEvent(new Event(GameUI.EVENTS.LEAVE_GAME));
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
        this.winscreen.leavebutton.onclick = this.leaveGamePressed.bind(this);
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
            this.player_indicator.midleavebutton.onclick = this.leaveGamePressed.bind(this);
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
        this.htmlManager.loadAll(["./ui/mainmenu.html", "./ui/queue.html", "./ui/player_indicator.html","./ui/winscreen.html", "./ui/settings.html"]).then(() => {
            this.mainmenu = this.htmlManager.create("mainmenu");
            this.mainPanel = this.mainmenu.root;
            this.queue = this.htmlManager.create("queue");
            this.player_indicator = this.htmlManager.create("player_indicator");
            this.winscreen = this.htmlManager.create("winscreen");
            this.settings = this.htmlManager.create("settings");

            // Blank description text från början
            this.htmlManager.showOnly(this.mainmenu);

            // Blank description text från början
            this.mainmenu.setPlaceholder("description", "");

            // musik
            //this.soundManager.playMusic();

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

            this.mainmenu.settingsBtn.onclick = () => {
                this.soundManager.play('click'); // ljud
                this.mainmenu.switchTo(this.settings)
            }

            this.settings.backBtn.onclick = () => {
                this.soundManager.play('click'); // ljud
                this.settings.switchTo(this.mainmenu)
            }

            this.settings.masterButtonOn.onclick = () => {
                this.soundManager.setVolume("masterVolume", 1)
                this.soundManager.play('click');
                this.settings.masterButtonOn.classList.add("onbutton");
                this.settings.masterButtonOff.classList.remove("offbutton");
            };

            this.settings.masterButtonOff.onclick = () => {
                this.soundManager.setVolume("masterVolume", 0)
                this.settings.masterButtonOff.classList.add("offbutton");
                this.settings.masterButtonOn.classList.remove("onbutton");
            };

            this.settings.sfxButtonOn.onclick = () => {
                this.soundManager.sfxVolume = 1;
                this.soundManager.play('click');
                this.settings.sfxButtonOn.classList.add("onbutton");
                this.settings.sfxButtonOff.classList.remove("offbutton");
            }

            this.settings.sfxButtonOff.onclick = () => {
                this.soundManager.sfxVolume = 0;
                this.settings.sfxButtonOff.classList.add("offbutton");
                this.settings.sfxButtonOn.classList.remove("onbutton");
            }

            this.settings.musicButtonOn.onclick = () => {
                this.soundManager.play('click');
                this.soundManager.setVolume("musicVolume", 1)
                this.settings.musicButtonOn.classList.add("onbutton");
                this.settings.musicButtonOff.classList.remove("offbutton");
            }

            this.settings.musicButtonOff.onclick = () => {
                this.soundManager.setVolume("musicVolume", 0)
                this.settings.musicButtonOff.classList.add("offbutton");
                this.settings.musicButtonOn.classList.remove("onbutton");
            }

            lucide.createIcons();
        })
    }

    backToMenu() {
        this.htmlManager.showOnly(this.mainmenu)
    }

    destroy() {
        this.htmlManager.destroy();
        this.htmlManager = undefined;
    }
}