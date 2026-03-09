export class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.sfxVolume = 1;
        this.musicVolume = 0.1;
        this.currentMusic = null;
    }

    connectToBoard(board) {
        // bugg omplacering
        board.bugs.addEventListener("bug_moved", () => {
            this.play('bugMove', 0.7);
        });

        // Virus
        board.virus.addEventListener("moved", () => {
            this.play('Vmove', 0.5);
        });

        // Antivirus
        board.antivirus.addEventListener("moved", () => {
            this.play('AVmove', 0.4);
        });
        // The timeout that was here earlier doesn't seem neccesary
        
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
        if (this.currentMusic) return;

        this.currentMusic = this.scene.sound.add('music', {
            volume: this.musicVolume,
            loop: true
        });

        this.currentMusic.play();
    }

    setVolume(type, value) {
        this[type] = value;
        if (this.currentMusic) {
            this.currentMusic.setVolume(this.musicVolume);
        }
    }   

    play(key, volume = 0.5) {
        const thisVolume = volume * this.sfxVolume;
        if (thisVolume <= 0) return;
        //console.log("spelar ljud:", key); 
        try {
            this.scene.sound.play(key, {volume: thisVolume});
        } catch (e) {
            console.warn("Ljudfel :(", e);
        }
    }
}