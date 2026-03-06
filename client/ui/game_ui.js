import { HtmlManager } from "./htmlmanager/htmlmanager.js";
import { Translator } from "./translator.js";
import { QUEUE_PREFERENCE, ACTIONS, EVENTS } from "../shared/enums.js";
import { GameState } from "../shared/gamestate.js";

export class GameUI extends EventTarget {

    static EVENTS = {
        LEAVE_GAME: "leave_game",
        PAUSE: "PAUSE",
        UNPAUSE: "UNPAUSE",
        SPECTATE_NEXT: "spectate_next",
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
        this.tutorialFinished = false; // has the tutorial been read? (Don't show it again when starting a match)
        this.rulesOpened = false; // are the rules currently open in game?
        this.inGame = false; // Are we in a game?
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
        this.rules.hide()
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

    showGameStart(isVirus, isSpectator, virusStarts = true) {
        
        if (!isSpectator) {
            this.player_indicator.midleavebutton.hidden = true;  
        }
        //this.player_indicator.midleavebutton.hidden = false;
        this.player_indicator.midleavebutton.onclick = this.leaveGamePressed.bind(this);

        HtmlManager.setVisible(this.player_indicator.specnextmatch,isSpectator);
        if (isSpectator) {
            HtmlManager.hide(this.player_indicator.youantivirus);
            HtmlManager.hide(this.player_indicator.youvirus);
        } else {
            // Show who I am
            HtmlManager.setVisible(this.player_indicator.youantivirus,!isVirus);
            HtmlManager.setVisible(this.player_indicator.youvirus,isVirus);
        }


        this.showCurrentPlayer(virusStarts ? 0 : 1);
        this.queue.hide()
        // Show "Back to game"


        this.rules.setPlaceholder("closerules", "exitrules") // Visa olika texter beroende på
        this.htmlManager.showOnly(this.player_indicator);
        HtmlManager.show(this.settingsIngame);
        this.inGame = true;
    }

    showTutorial() {
        this.queue.switchTo(this.rules);
        if (this.tutorialFinished) {
            // Already read tutorial, auto close tutorial box
            this.closeRules();
        } else {
            // Show "Ready to start"
            this.rules.setPlaceholder("closerules", "exittutorial");
        }
    }

    isSmallScreen() {
        return Math.min(window.innerWidth,window.innerHeight) < 800;
    }

    startFullscreen() {
        return; // temporary 
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

    changeQueuePreference(type) {

        if (this.queuePreference === type) return;

        this.queuePreference = type;

        this.queue.queue_any.classList.remove("selected");
        this.queue.queue_virus.classList.remove("selected");
        this.queue.queue_antivirus.classList.remove("selected");

        if (type === "any") this.queue.queue_any.classList.add("selected");
        if (type === "virus") this.queue.queue_virus.classList.add("selected");
        if (type === "antivirus") this.queue.queue_antivirus.classList.add("selected");

        this.socket.emit(ACTIONS.STOP_FINDING_GAME);
        this.socket.emit(ACTIONS.FIND_GAME, type);
    }

    startAIGame(role) {

        if (role === "random") {
            role = Math.random() < 0.5 ? "virus" : "antivirus";
        }

        const queueType =
            role === "virus" ? "ai_as_antivirus" :
            "ai_as_virus";

        this.socket.emit(ACTIONS.FIND_GAME, queueType);
    }

    switchToQueue(showPickPlayer=true) {
        this.mainmenu.switchTo(this.queue);
        HtmlManager.setVisible(this.queue.pickrole,showPickPlayer);
    }

    setup() {
        this.htmlManager.loadAll([
            "./ui/mainmenu.html",
            "./ui/queue.html",
            "./ui/player_indicator.html",
            "./ui/winscreen.html",
            "./ui/settings.html",
            "./ui/aiselect.html",
            "./ui/settingsingame.html",
            "./ui/rulesbutton.html",
            "./ui/rules.html",
            "./ui/waiting.html",
            "./ui/sharedsettings.html"
        ]).then(() => {
            this.mainmenu = this.htmlManager.create("mainmenu");
            this.mainPanel = this.mainmenu.root;
            this.queue = this.htmlManager.create("queue");
            this.player_indicator = this.htmlManager.create("player_indicator");
            this.aiSelect = this.htmlManager.create("aiselect");
            this.winscreen = this.htmlManager.create("winscreen");
            this.rulesbutton = this.htmlManager.create("rulesbutton");
            this.waiting = this.htmlManager.create("waiting");
            this.sharedsettings = this.htmlManager.create("sharedsettings")

            this.ui = document.getElementById("ui");
            this.innertext = this.sharedsettings.root.querySelector(".innertext");

            this.settings = this.htmlManager.create("settings");
            this.settingsIngame = this.htmlManager.create("settingsingame");
            this.rules = this.htmlManager.create("rules");

            const ruleswindow = this.rules.root

            // Blank description text från början
            this.htmlManager.showOnly(this.mainmenu);
            lucide.createIcons();

            this.mainmenu.start.onclick = () => {
                this.soundManager.play('click'); // ljud

                this.queuePreference = QUEUE_PREFERENCE.ANY; // Etablera queue preferencen är random.

                this.switchToQueue();

                this.queue.queue_any.classList.add("selected");
                this.queue.queue_virus.classList.remove("selected");
                this.queue.queue_antivirus.classList.remove("selected");

                this.socket.emit(ACTIONS.FIND_GAME, this.queuePreference);
                // this.startFullscreen();
            }

            this.mainmenu.spectatebutton.onclick = () => {
                this.soundManager.play('click'); // ljud
                this.spectatingPressed();
            }

            // --------------------- AI BUTTON ----------------------- 
            if (this.mainmenu.playai) {
                this.mainmenu.playai.onclick = () => {
                    this.soundManager.play('click');
                    this.mainmenu.switchTo(this.aiSelect);
                    // this.startFullscreen();
                }
            }

            // AI select buttons
            this.aiSelect.ai_random.onclick = () => {
                this.soundManager.play('click');
                this.startAIGame("random");
            };

            this.aiSelect.ai_virus.onclick = () => {
                this.soundManager.play('click');
                this.startAIGame("virus");
            };

            this.aiSelect.ai_antivirus.onclick = () => {
                this.soundManager.play('click');
                this.startAIGame("antivirus");
            };

            this.aiSelect.abort.onclick = () => {
                this.soundManager.play('click');
                this.aiSelect.switchTo(this.mainmenu);
                this.socket.emit(ACTIONS.STOP_FINDING_GAME)
            };

            // -------------------------------------------------------

            // --------------------- AI VS AI BUTTON -----------------
            if (this.mainmenu.watchai) {
                this.mainmenu.watchai.onclick = () => {
                    this.soundManager.play('click');
                    this.switchToQueue();
                    this.socket.emit(ACTIONS.FIND_GAME, QUEUE_PREFERENCE.AI_VS_AI);
                }
            }
            // -------------------------------------------------------

            // Ändra queue preference i kön
            this.queue.queue_any.onclick = () => {
                this.changeQueuePreference("any");
            };

            this.queue.queue_virus.onclick = () => {
                this.changeQueuePreference("virus");
            };

            this.queue.queue_antivirus.onclick = () => {
                this.changeQueuePreference("antivirus");
            };


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

            // finns inte längre
            //this.rulesbutton.rulesbutton.onclick = () => {
            //    this.rulesOpened = true;
            //    this.soundManager.play('click'); // ljud 🤑
            //    this.rules.show();
            //    this.dispatchEvent(new Event(GameUI.EVENTS.PAUSE));
            //}

            this.rules.norulesbutton.onclick = () => {
                this.closeRules();
                this.soundManager.play('click'); // ljud 🤑
            }

            this.ui.onclick = (e) => {
                // Does not work properly anymore
                if (!ruleswindow.contains(e.target) && this.inGame && this.rulesOpened && !this.rulesbutton.rulesbutton.contains(e.target)) {
                    this.dispatchEvent(new Event(GameUI.EVENTS.UNPAUSE));
                    this.rules.hide();
                    this.settings.hide()
                    this.sharedsettings.hide()
                    this.rulesOpened = false;
                }
            };
            this.mainmenu.settingsBtn.onclick = () => {
                this.soundManager.play('click'); // ljud
                this.mainmenu.switchTo(this.settings)
            }

            this.settings.backBtn.onclick = () => {
                this.soundManager.play('click');
                if (this.settingsFrom === "game") {
                    this.settings.switchTo(this.settingsIngame);
                } else {
                    this.settings.switchTo(this.mainmenu);
                }
            };

            this.settings.sfxToggle.onclick = (e) => {
                if (e.target.checked) {
                    this.soundManager.sfxVolume = 1;
                    this.soundManager.play('click'); // ljud
                } else {
                    this.soundManager.sfxVolume = 0;
                }
            };

            this.settings.musicToggle.onclick = (e) => {
                this.soundManager.play('click'); // ljud
                if (e.target.checked) {
                    this.soundManager.setVolume("musicVolume", 0.1);
                    this.soundManager.playMusic();
                } else {
                    this.soundManager.setVolume("musicVolume", 0);
                }
            };
            
            this.settings.bgMove.onclick = (e) => {
                this.soundManager.play('click'); // ljud
                if (this.bgToggle) 
                    this.bgToggle(e.target.checked);
            };
            
            this.settingsIngame.igSettingsBtn.onclick = () => {
                this.soundManager.play('click');
                this.settingsFrom = "game";
                this.dispatchEvent(new Event(GameUI.EVENTS.PAUSE))
                this.sharedsettings.show()
            };

            this.player_indicator.specnextmatch.onclick = () => {
                this.dispatchEvent(new Event(GameUI.EVENTS.SPECTATE_NEXT));
            }

            this.sharedsettings.settingsleavebutton.onclick = () => {
                this.dispatchEvent(new Event(GameUI.EVENTS.LEAVE_GAME));
            }

            this.sharedsettings.languageBtn.onclick = () => {
                console.log("Swag Perpetrator 5019")
                this.soundManager.play('click'); // ljud
                if (Translator.language === "en") {
                    Translator.setLanguage("sv");
                } else {
                    Translator.setLanguage("en");
                }
                Translator.refreshInstances(this.htmlManager.getVisibleInstances())
            }
            this.sharedsettings.backtogame.onclick = () => {
                this.dispatchEvent(new Event(GameUI.EVENTS.UNPAUSE))
                this.sharedsettings.hide()
            }

            this.sharedsettings.showsound.onclick = () => {
                this.soundManager.play('click');
                this.settings.show()
                this.settingsFrom = "game";
            };


            this.sharedsettings.showrules.onclick = () => {
                this.soundManager.play('click');
                this.rules.show()
            };

        })
    }

    spectatingPressed() {
        this.switchToQueue(false);
        this.socket.emit(ACTIONS.SPECTATE_GAME);
    }

    showInSettings(instance) {
        this.innertext.innerHTML = "";          
        this.innertext.appendChild(instance.root.cloneNode(true));
    }

    closeRules() {
        if (this.inGame) {
            this.rules.hide();
        } 
        else {
            this.tutorialFinished = true;
            this.socket.emit(ACTIONS.READY);
            this.rules.hide();
            this.waiting.show();
        }
        this.rulesOpened = false;
    }

    backToMenu() {
        this.htmlManager.showOnly(this.mainmenu);
        this.inGame = false;
    }

    destroy() {
        this.htmlManager.destroy();
        this.htmlManager = undefined;
    }
}