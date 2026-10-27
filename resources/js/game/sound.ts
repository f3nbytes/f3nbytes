/*
 * Mesin suara chiptune procedural (Web Audio API, tanpa file aset).
 * SFX 8-bit + loop musik dungeon. Hormati autoplay browser:
 * panggil sound.unlock() dari gesture pengguna dulu.
 */

type Wave = OscillatorType;

const midi = (m: number): number => 440 * 2 ** ((m - 69) / 12);

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

class SoundEngine {
    private ctx: AudioContext | null = null;
    private master: GainNode | null = null;
    /** Bus khusus SFX supaya volumenya bisa diatur terpisah dari musik. */
    private sfxGain: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private noiseBuf: AudioBuffer | null = null;
    private musicTimer: number | null = null;
    private step = 0;
    private muted = false;
    private sfxVol = 0.85;
    private musicVol = 0.5;

    constructor() {
        try {
            this.muted = localStorage.getItem('f3n-muted') === '1';
            const sfxRaw = localStorage.getItem('f3n-sfx-vol');
            const musicRaw = localStorage.getItem('f3n-music-vol');

            if (sfxRaw !== null) {
                const sfx = Number(sfxRaw);

                if (Number.isFinite(sfx)) {
                    this.sfxVol = clamp01(sfx);
                }
            }

            if (musicRaw !== null) {
                const music = Number(musicRaw);

                if (Number.isFinite(music)) {
                    this.musicVol = clamp01(music);
                }
            }
        } catch {
            this.muted = false;
        }
    }

    getVolumes(): { sfx: number; music: number } {
        return { sfx: this.sfxVol, music: this.musicVol };
    }

    setSfxVolume(value: number): void {
        this.sfxVol = clamp01(value);

        try {
            localStorage.setItem('f3n-sfx-vol', String(this.sfxVol));
        } catch {
            // abaikan
        }

        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setTargetAtTime(
                this.sfxVol,
                this.ctx.currentTime,
                0.03,
            );
        }
    }

    setMusicVolume(value: number): void {
        this.musicVol = clamp01(value);

        try {
            localStorage.setItem('f3n-music-vol', String(this.musicVol));
        } catch {
            // abaikan
        }

        if (this.musicGain && this.ctx) {
            this.musicGain.gain.setTargetAtTime(
                this.musicVol,
                this.ctx.currentTime,
                0.03,
            );
        }
    }

    isMuted(): boolean {
        return this.muted;
    }

    setMuted(m: boolean): void {
        this.muted = m;

        try {
            localStorage.setItem('f3n-muted', m ? '1' : '0');
        } catch {
            // abaikan
        }

        if (this.master && this.ctx) {
            this.master.gain.setValueAtTime(m ? 0 : 0.14, this.ctx.currentTime);
        }
    }

    /** Wajib dipanggil dari klik/sentuh pertama. */
    unlock(): void {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') {
                void this.ctx.resume();
            }

            return;
        }

        const AC =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext })
                .webkitAudioContext;

        if (!AC) {
            return;
        }

        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.14;
        this.master.connect(this.ctx.destination);
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = this.sfxVol;
        this.sfxGain.connect(this.master);
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this.musicVol;
        this.musicGain.connect(this.master);

        const len = this.ctx.sampleRate;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);

        for (let i = 0; i < len; i++) {
            d[i] = Math.random() * 2 - 1;
        }
    }

    private tone(
        freq: number,
        dur: number,
        type: Wave = 'square',
        vol = 0.5,
        slideTo?: number,
        delay = 0,
    ): void {
        if (!this.ctx || !this.sfxGain || this.muted) {
            return;
        }

        const t = this.ctx.currentTime + delay;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t);

        if (slideTo !== undefined) {
            o.frequency.exponentialRampToValueAtTime(
                Math.max(1, slideTo),
                t + dur,
            );
        }

        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g);
        g.connect(this.sfxGain);
        o.start(t);
        o.stop(t + dur + 0.02);
    }

    private noise(
        dur: number,
        vol = 0.4,
        filterFreq = 1200,
        type: BiquadFilterType = 'lowpass',
        delay = 0,
    ): void {
        if (!this.ctx || !this.sfxGain || !this.noiseBuf || this.muted) {
            return;
        }

        const t = this.ctx.currentTime + delay;
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuf;
        src.loop = true;
        const f = this.ctx.createBiquadFilter();
        f.type = type;
        f.frequency.value = filterFreq;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(f);
        f.connect(g);
        g.connect(this.sfxGain);
        src.start(t);
        src.stop(t + dur + 0.02);
    }

    private arp(
        notes: number[],
        stepDur = 0.07,
        type: Wave = 'square',
        vol = 0.4,
    ): void {
        notes.forEach((n, i) =>
            this.tone(midi(n), stepDur, type, vol, undefined, i * stepDur),
        );
    }

    // ---------- SFX ----------
    click(): void {
        this.tone(660, 0.05);
    }

    pickup(): void {
        this.arp([84, 88], 0.04, 'triangle', 0.25);
    }

    heal(): void {
        this.arp([72, 76, 79], 0.05, 'sine', 0.3);
    }

    equip(): void {
        this.tone(300, 0.08, 'square', 0.3, 520);
    }

    dialog(): void {
        this.tone(520, 0.03, 'square', 0.25);
    }

    textTick(): void {
        this.tone(740, 0.018, 'square', 0.08);
    }

    swing(): void {
        this.tone(300, 0.08, 'triangle', 0.5, 150);
        this.noise(0.05, 0.15, 3000, 'highpass');
    }

    swordSlash(): void {
        this.tone(340, 0.07, 'sawtooth', 0.42, 170);
        this.noise(0.06, 0.2, 2800, 'highpass');
    }

    heavySmash(): void {
        this.tone(115, 0.2, 'sawtooth', 0.55, 45);
        this.noise(0.18, 0.38, 480, 'lowpass');
    }

    shoot(): void {
        this.tone(880, 0.09, 'square', 0.35, 220);
    }

    shootArrow(): void {
        this.tone(980, 0.05, 'triangle', 0.35, 380);
        this.noise(0.08, 0.16, 3400, 'bandpass');
    }

    magicCast(): void {
        this.arp([81, 86, 90], 0.035, 'sine', 0.28);
        this.tone(520, 0.12, 'triangle', 0.25, 950);
    }

    deflect(): void {
        this.tone(880, 0.07, 'square', 0.35, 1150);
        this.tone(1320, 0.09, 'sine', 0.22);
    }

    rainImpact(): void {
        this.noise(0.025, 0.1, 2400, 'highpass');
        this.tone(580, 0.035, 'triangle', 0.18, 220);
    }

    hit(): void {
        this.noise(0.07, 0.35, 900);
        this.tone(150, 0.07, 'triangle', 0.4, 90);
    }

    die(boss: boolean): void {
        if (boss) {
            this.arp([52, 48, 43, 38], 0.11, 'sawtooth', 0.45);
            this.noise(0.5, 0.4, 400);
        } else {
            this.arp([76, 71, 67], 0.06, 'square', 0.35);
        }
    }

    hurt(): void {
        this.tone(140, 0.2, 'sawtooth', 0.4, 70);
    }

    dodge(): void {
        this.noise(0.15, 0.3, 2500, 'highpass');
        this.tone(300, 0.12, 'sine', 0.2, 700);
    }

    skill(role: string): void {
        if (role === 'Archer') {
            this.arp([88, 91, 95, 98], 0.05, 'square', 0.35);
        } else if (role === 'Mage') {
            this.arp([79, 83, 86, 91, 95], 0.06, 'triangle', 0.4);
        } else if (role === 'Knight') {
            this.noise(0.25, 0.35, 1800, 'bandpass');
            this.arp([55, 62], 0.09, 'square', 0.4);
        } else {
            this.tone(90, 0.35, 'sine', 0.55, 45);
            this.arp([45, 52], 0.12, 'triangle', 0.35);
        }
    }

    coin(): void {
        this.tone(990, 0.07, 'square', 0.3);
        this.tone(1320, 0.1, 'square', 0.3, undefined, 0.07);
    }

    quest(): void {
        this.arp([72, 76, 79, 84], 0.09, 'square', 0.4);
    }

    teleport(): void {
        this.tone(200, 0.5, 'sine', 0.35, 1200);
        this.noise(0.4, 0.15, 4000, 'highpass');
    }

    /** Derit inap tangga: tiga pijakan, nada naik/turun + sendawa kayu. */
    stairs(up: boolean): void {
        const n = up ? [48, 52, 55] : [55, 52, 48];

        n.forEach((m, i) => {
            this.tone(midi(m), 0.08, 'square', 0.18, undefined, i * 0.12);
            this.tone(
                midi(m + 24),
                0.05,
                'triangle',
                0.09,
                undefined,
                i * 0.12,
            );
        });
        this.noise(0.55, 0.05, 900, 'lowpass');
        this.tone(up ? 130 : 110, 0.5, 'triangle', 0.07, up ? 156 : 92);
    }

    fanfare(): void {
        this.arp([67, 72, 76, 79], 0.09, 'square', 0.4);
    }

    victory(): void {
        this.stopMusic();
        this.arp([72, 76, 79, 84, 88, 91], 0.11, 'square', 0.42);
    }

    defeat(): void {
        this.stopMusic();
        this.arp([57, 53, 50, 45], 0.16, 'sawtooth', 0.4);
    }

    // ---------- Musik: loop dungeon 16 langkah ----------
    startMusic(): void {
        if (!this.ctx || this.musicTimer !== null) {
            return;
        }

        this.step = 0;
        // A minor: bass jalan + lead jarang.
        const bass = [
            45, 45, 48, 45, 43, 43, 47, 43, 45, 45, 48, 45, 50, 48, 47, 43,
        ];
        const lead = [
            69, -1, 72, -1, 76, -1, 72, -1, 69, -1, 67, -1, 64, -1, 67, -1,
        ];
        const stepDur = 0.21;

        const tick = (): void => {
            if (!this.ctx || !this.musicGain) {
                return;
            }

            const i = this.step % 16;
            const b = bass[i] ?? 45;
            const l = lead[i] ?? -1;
            this.musicNote(midi(b), stepDur * 0.9, 'triangle', 0.5);

            if (l > 0 && this.step % 32 < 16) {
                this.musicNote(midi(l), stepDur * 1.8, 'square', 0.16);
            }

            this.step += 1;
        };

        tick();
        this.musicTimer = window.setInterval(tick, 210);
    }

    private musicNote(
        freq: number,
        dur: number,
        type: Wave,
        vol: number,
    ): void {
        if (!this.ctx || !this.musicGain || this.muted) {
            return;
        }

        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g);
        g.connect(this.musicGain);
        o.start(t);
        o.stop(t + dur + 0.02);
    }

    stopMusic(): void {
        if (this.musicTimer !== null) {
            window.clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
    }
}

export const sound = new SoundEngine();
