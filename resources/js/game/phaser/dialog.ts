import type Phaser from 'phaser';

const CHAR_DELAY_MS = 16;

/**
 * Kotak dialog bertipe "typewriter" untuk scene Phaser.
 * Semua elemen memakai scrollFactor 0 supaya menempel di layar, bukan dunia.
 */
export class Dialog {
    private readonly box: Phaser.GameObjects.Rectangle;
    private readonly label: Phaser.GameObjects.Text;
    private timer?: Phaser.Time.TimerEvent;
    private full = '';
    private cursor = 0;

    constructor(
        private readonly scene: Phaser.Scene,
        width: number,
        height: number,
    ) {
        this.box = scene.add
            .rectangle(width / 2, height - 72, width - 96, 96, 0x020617, 0.92)
            .setStrokeStyle(2, 0x22d3ee)
            .setScrollFactor(0)
            .setDepth(1000)
            .setVisible(false);

        this.label = scene.add
            .text(64, height - 112, '', {
                fontFamily: 'monospace',
                fontSize: '15px',
                color: '#e2e8f0',
                wordWrap: { width: width - 128 },
            })
            .setScrollFactor(0)
            .setDepth(1001)
            .setVisible(false);
    }

    get isOpen(): boolean {
        return this.box.visible;
    }

    /** Elemen layar yang harus disembunyikan dari kamera minimap. */
    get objects(): Phaser.GameObjects.GameObject[] {
        return [this.box, this.label];
    }

    show(line: string): void {
        this.stopTimer();
        this.full = line;
        this.cursor = 0;
        this.box.setVisible(true);
        this.label.setVisible(true).setText('');

        this.timer = this.scene.time.addEvent({
            delay: CHAR_DELAY_MS,
            loop: true,
            callback: () => {
                this.cursor += 1;
                this.label.setText(this.full.slice(0, this.cursor));

                if (this.cursor >= this.full.length) {
                    this.stopTimer();
                }
            },
        });
    }

    /** Tuntaskan animasi ketik. Mengembalikan true kalau tadi masih mengetik. */
    reveal(): boolean {
        if (!this.isOpen || this.cursor >= this.full.length) {
            return false;
        }

        this.cursor = this.full.length;
        this.label.setText(this.full);
        this.stopTimer();

        return true;
    }

    hide(): void {
        this.stopTimer();
        this.box.setVisible(false);
        this.label.setVisible(false);
    }

    private stopTimer(): void {
        this.timer?.remove();
        this.timer = undefined;
    }
}
