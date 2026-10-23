import Phaser from 'phaser';
import { loadFadlanImage, registerFadlan } from './sprites';

const LINES = [
    'Pak Syahid: Anak-anak, hari ini belajar sambil eksplorasi!',
    'Fadlan: Siap! WASD untuk jalan, E untuk bicara.',
    'Pak Syahid: Quest pertamamu: kelilingi halaman sekolah ini!',
];

/**
 * Demo scene 1: halaman sekolah. Jalan (WASD/panah), kamera ikut,
 * E untuk bicara dengan Pak Syahid.
 */
export class SchoolScene extends Phaser.Scene {
    private player?: Phaser.GameObjects.Sprite;
    private playerName?: Phaser.GameObjects.Text;
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd?: Record<string, Phaser.Input.Keyboard.Key>;
    private dialogStep = -1;
    private dialogText?: Phaser.GameObjects.Text;
    private dialogBox?: Phaser.GameObjects.Rectangle;
    private npc?: Phaser.GameObjects.Container;
    private tilemapMode = false;
    private worldW = 960;
    private worldH = 540;
    private minimap?: Phaser.Cameras.Scene2D.Camera;
    private uiObjects: Phaser.GameObjects.GameObject[] = [];

    constructor() {
        super('school');
    }

    preload(): void {
        this.load.tilemapTiledJSON(
            'airlangga-map',
            '/game-assets/airlangga_map.json',
        );
        this.load.image(
            'airlangga-tiles',
            '/game-assets/airlangga_tileset.png',
        );
    }

    create(): void {
        void loadFadlanImage()
            .then((img) => {
                registerFadlan(this, img);
                this.buildWorld(true);
            })
            .catch(() => {
                this.buildWorld(false);
            });
    }

    private buildWorld(withSprite: boolean): void {
        const useTilemap =
            this.cache.tilemap.exists('airlangga-map') &&
            this.textures.exists('airlangga-tiles');

        let W = 960;
        let H = 540;

        if (useTilemap) {
            const map = this.make.tilemap({ key: 'airlangga-map' });
            const tiles = map.addTilesetImage(
                'airlangga_tileset',
                'airlangga-tiles',
                16,
                16,
                0,
                0,
            );
            const layer = tiles ? map.createLayer('ground', tiles, 0, 0) : null;

            if (layer) {
                layer.setScale(3);
                W = map.widthInPixels * 3;
                H = map.heightInPixels * 3;
            }
        }

        this.cameras.main.setBounds(0, 0, W, H);
        this.tilemapMode = useTilemap;
        this.worldW = W;
        this.worldH = H;

        if (!useTilemap) {
            // Fallback: gambar halaman sekolah dengan graphics.
            const g = this.add.graphics();

            for (let ty = 0; ty < H; ty += 32) {
                for (let tx = 0; tx < W; tx += 32) {
                    const even = ((tx + ty) / 32) % 2 === 0;
                    g.fillStyle(even ? 0x4a7c59 : 0x437153);
                    g.fillRect(tx, ty, 32, 32);

                    const h = ((tx * 73856093) ^ (ty * 19349663)) >>> 0;

                    if (h % 11 === 0) {
                        g.fillStyle(0x2d5a3d);
                        g.fillRect(tx + 8, ty + 10, 4, 8);
                    } else if (h % 29 === 0) {
                        g.fillStyle(0xfde68a);
                        g.fillRect(tx + 14, ty + 12, 4, 4);
                    }
                }
            }

            // Jalan pasir tengah.
            g.fillStyle(0xd6cfae);
            g.fillRect(0, 250, W, 40);
            g.fillStyle(0xc4b78f);

            for (let tx = 8; tx < W; tx += 32) {
                g.fillRect(tx, 266, 12, 3);
            }

            // Gedung sekolah.
            g.fillStyle(0xb45309);
            g.fillRect(300, 24, 360, 26);
            g.fillStyle(0xf5eeda);
            g.fillRect(312, 50, 336, 110);
            g.fillStyle(0x7dd3fc);

            for (let i = 0; i < 4; i++) {
                g.fillRect(330 + i * 78, 70, 52, 40);
            }

            g.fillStyle(0x78350f);
            g.fillRect(462, 110, 36, 50);
            this.add
                .text(480, 52, 'SEKOLAH', {
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    color: '#ffffff',
                })
                .setOrigin(0.5, 0);

            // Pagar.
            g.fillStyle(0x7c4a21);
            g.fillRect(0, 0, W, 8);
            g.fillRect(0, H - 8, W, 8);
            g.fillRect(0, 0, 8, H);
            g.fillRect(W - 8, 0, 8, H);
        }

        // Pak Syahid (NPC): badan + peci + papan nama.
        const npc = this.add.container(480, 220);
        const body = this.add.rectangle(0, 0, 26, 34, 0xf5f5f5);
        const head = this.add.rectangle(0, -26, 20, 18, 0xf5c99b);
        const peci = this.add.rectangle(0, -38, 20, 10, 0x111827);
        const plate = this.add.rectangle(0, 26, 76, 14, 0x020617);
        const label = this.add
            .text(0, 26, 'PAK SYAHID', {
                fontFamily: 'monospace',
                fontSize: '9px',
                color: '#facc15',
            })
            .setOrigin(0.5);
        npc.add([body, head, peci, plate, label]);
        npc.setDepth(10);
        this.tweens.add({
            targets: npc,
            y: 214,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
        this.npc = npc;

        // Pemain Fadlan.
        const px = 420;
        const py = 330;
        let player: Phaser.GameObjects.Sprite;

        if (withSprite && this.textures.exists('fadlan-walk-0')) {
            player = this.add.sprite(px, py, 'fadlan-idle');
            player.setDisplaySize(36, 84);
            this.anims.create({
                key: 'fadlan-walk',
                frames: [0, 1, 2, 3, 4].map((i) => ({
                    key: `fadlan-walk-${i}`,
                })),
                frameRate: 9,
                repeat: -1,
            });
        } else {
            player = this.add.sprite(px, py, '__WHITE');
            player.setDisplaySize(24, 36);
            player.setTint(0x818cf8);
        }

        player.setDepth(20);
        this.player = player;
        this.cameras.main.startFollow(player, true, 0.12, 0.12);

        // Nama di atas pemain (mengikuti).
        this.playerName = this.add
            .text(px, py - 62, 'FADLAN', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '10px',
                color: '#ffffff',
            })
            .setOrigin(0.5);

        const kb = this.input.keyboard;

        if (kb) {
            this.cursors = kb.createCursorKeys();
            this.wasd = kb.addKeys('W,A,S,D,E,M') as Record<
                string,
                Phaser.Input.Keyboard.Key
            >;
        }

        // Kotak dialog (tersembunyi dulu).
        this.dialogBox = this.add.rectangle(480, 470, 860, 90, 0x020617, 0.92);
        this.dialogBox.setStrokeStyle(2, 0x22d3ee);
        this.dialogBox.setScrollFactor(0);
        this.dialogBox.setVisible(false);
        this.dialogText = this.add
            .text(80, 442, '', {
                fontFamily: 'monospace',
                fontSize: '15px',
                color: '#e2e8f0',
                wordWrap: { width: 800 },
            })
            .setScrollFactor(0);
        this.dialogText.setVisible(false);

        const hint = this.add
            .text(480, 520, 'WASD jalan · E bicara · M toggle minimap', {
                fontFamily: 'monospace',
                fontSize: '13px',
                color: '#94a3b8',
            })
            .setOrigin(0.5)
            .setScrollFactor(0);

        this.uiObjects = [this.dialogBox, this.dialogText, hint];

        // Minimap untuk map luas: kamera kedua menampilkan seluruh map.
        if (this.tilemapMode) {
            const miniW = 200;
            const miniH = 130;
            const zoomMini = Math.min(miniW / W, miniH / H) * 0.94;
            const mini = this.cameras.add(W - miniW - 14, 14, miniW, miniH);
            mini.setName('minimap');
            mini.setBackgroundColor(0x020617);
            mini.setZoom(zoomMini);
            mini.centerOn(W / 2, H / 2);
            mini.ignore(this.uiObjects);
            this.minimap = mini;
        }
    }

    override update(): void {
        const player = this.player;

        if (!player) {
            return;
        }

        let vx = 0;
        let vy = 0;

        if (this.cursors) {
            if (this.cursors.left.isDown || this.wasd?.['A']?.isDown) {
                vx = -1;
            } else if (this.cursors.right.isDown || this.wasd?.['D']?.isDown) {
                vx = 1;
            }

            if (this.cursors.up.isDown || this.wasd?.['W']?.isDown) {
                vy = -1;
            } else if (this.cursors.down.isDown || this.wasd?.['S']?.isDown) {
                vy = 1;
            }
        }

        const speed = 170;
        const maxX = this.worldW - 24;
        const minY = this.tilemapMode ? 100 : 90;
        const maxY = this.worldH - 24;
        player.x = Phaser.Math.Clamp(
            player.x + vx * speed * (1 / 60),
            24,
            maxX,
        );
        player.y = Phaser.Math.Clamp(
            player.y + vy * speed * (1 / 60),
            minY,
            maxY,
        );

        // Blok gedung sekolah.
        const building = this.tilemapMode
            ? { x0: 144, x1: 816, y0: 96, y1: 192 }
            : { x0: 296, x1: 676, y0: 20, y1: 168 };

        if (
            player.x > building.x0 &&
            player.x < building.x1 &&
            player.y > building.y0 &&
            player.y < building.y1
        ) {
            if (vx !== 0) {
                player.x -= vx * speed * (1 / 60);
            }

            if (vy !== 0) {
                player.y -= vy * speed * (1 / 60);
            }
        }

        if (vx !== 0 || vy !== 0) {
            if (player.texture.key.startsWith('fadlan-')) {
                player.anims.play('fadlan-walk', true);
            }

            player.setFlipX(vx < 0);
            player.setDepth(20 + Math.round(player.y));
        } else if (player.texture.key.startsWith('fadlan-')) {
            player.anims.stop();
            player.setTexture('fadlan-idle');
        }

        if (this.npc) {
            this.npc.setDepth(20 + Math.round(this.npc.y));
        }

        if (this.playerName) {
            this.playerName.setPosition(player.x, player.y - 62);
        }

        // Interaksi E dekat NPC.
        const mKey = this.wasd?.['M'];
        const mJustDown =
            mKey !== undefined && Phaser.Input.Keyboard.JustDown(mKey);

        if (mJustDown && this.minimap) {
            this.minimap.setVisible(!this.minimap.visible);
        }

        const eKey = this.wasd?.['E'];
        const eJustDown =
            eKey !== undefined && Phaser.Input.Keyboard.JustDown(eKey);

        if (eJustDown && this.npc && this.dialogText && this.dialogBox) {
            const d = Phaser.Math.Distance.Between(
                player.x,
                player.y,
                this.npc.x,
                this.npc.y,
            );

            if (d < 90) {
                this.dialogStep = (this.dialogStep + 1) % (LINES.length + 1);

                if (this.dialogStep >= LINES.length) {
                    this.dialogBox.setVisible(false);
                    this.dialogText.setVisible(false);
                    this.dialogStep = -1;
                } else {
                    this.dialogBox.setVisible(true);
                    this.dialogText.setVisible(true);
                    this.dialogText.setText(LINES[this.dialogStep] ?? '');
                }
            }
        }
    }
}
