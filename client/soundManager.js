export class SoundManager {
    constructor(scene, board) {
        this.scene = scene;
        this.board = board;
        this.isReady = false;
        this.masterVolume = 1;
        this.sfxVolume = 1;
        this.musicVolume = 1;
        this.currentMusic = null;
    }

    initGameListeners() {
        if (!this.board.virus || !this.board.antivirus || !this.board.bugs) {
            console.warn("hittar ej virus, antivirus eller buggar");
            return;
        }

        // bugg omplacering
        this.board.bugs.addEventListener("bug_moved", () => {
            if (this.isReady) this.play('bugMove', 0.8);
        });

        // Virus
        this.board.virus.addEventListener("moved", () => {
            if (this.isReady) this.play('Vmove', 0.5);
        });

        // Antivirus
        this.board.antivirus.addEventListener("moved", () => {
            if (this.isReady) this.play('AVmove', 0.3);
        });

        setTimeout(() => { 
            this.isReady = true; 
            console.log("ljud redo");
        }, 200);
    }

    playWinLose(virusWon, isPlayerVirus) {
        if (virusWon) {
            // Virus vinner, Antivirus förlorar
            this.play(isPlayerVirus ? 'win' : 'lose', 0.7);
        } else {
            // Virus förlorar, Antivirus vinner
            this.play(isPlayerVirus ? 'lose' : 'win', 0.7);
        }
    }

    playMusic() {
        this.currentMusic = this.scene.sound.add('music', this.masterVolume * this.musicVolume);
        this.currentMusic.play();
    }

    setVolume(type, value) {
        this[type] = value;
        if (this.currentMusic) {
            this.currentMusic.setVolume(this.masterVolume * this.musicVolume);
        }
    }   

    play(key, volume = 0.5) {
        const thisVolume = volume * this.masterVolume * this.sfxVolume;
        if (thisVolume <= 0) return;
        console.log("spelar ljud:", key); 
        try {
            this.scene.sound.play(key, {volume: thisVolume});
        } catch (e) {
            console.warn("Ljudfel :(", e);
        }
    }
}