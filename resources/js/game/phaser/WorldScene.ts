import Phaser from 'phaser';

import { Dialog } from './dialog';
import { loadFadlanImage, registerFadlan } from './sprites';

const VIEW_W = 960;
const VIEW_H = 540;

const TILE = 16;
const TILE_SCALE = 3;

const TILEMAP_KEY = 'airlangga-map';
const TILESET_NAME = 'airlangga_tileset';
const TILESET_IMAGE_KEY = 'airlangga-tiles';

const PLAYER_SPEED = 170;
const INTERACT_RANGE = 96;

/**
 * Index tile Phaser yang boleh dilewati:
 * 1 = rumput, 3 = jalan, 7 = pintu. Sisanya solid.
 */
const WALKABLE_TILE_INDEXES = new Set([1, 3, 7]);

const LINES = [
    'Pak Syahid: Anak-anak, hari ini belajar sambil eksplorasi!',
    'Fadlan: Siap! WASD untuk jalan, E untuk bicara.',
    'Pak Syahid: Quest pertamamu: kelilingi halaman sekolah ini!',
];

/**
 * Scene dunia: memuat tilemap Tiled, membangun collider dari data tile,
 * lalu menjalankan pemain dengan Arcade Physics.
 */
export class WorldScene extends Phaser.Scene {
    private player?: Phaser.Physics.Arcade.Sprite;
    private playerName?: Phaser.GameObjects.Text;
    private npc?: Phaser.GameObjects.Container;
    private prompt?: Phaser.GameObjects.Text;
    private hint?: Phaser.GameObjects.Text;
    private dialog!: Dialog;
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys?: Record<string, Phaser.Input.Keyboard.Key>;
    private minimap?: Phaser.Cameras.Scene2D.Camera;
    private dialogStep = -1;

    constructor() {
        super('world');
    }

    preload(): void {
        this.load.tilemapTiledJSON(TILEMAP_KEY, '/game-assets/airlangga_map.json');
        this.load.image(TILESET_IMAGE_KEY, '/game-assets/airlangga_tileset.png');
    }

    create(): void {
        this.dialog = new Dialog(this, VIEW_W, VIEW_H);

        void loadFadlanImage()
            .then((image) => {
                registerFadlan(this, image);

                return true;
            })
            .catch(() => false)
            .then((hasSprite) => {
                this.buildWorld(hasSprite);
            });
    }

    private buildWorld(withSprite: boolean): void {
        const { width, height } = this.buildTilemap();

        this.physics.world.setBounds(0, 0, width, height);
        this.cameras.main.setBounds(0, 0, width, height);
        this.cameras.main.setBackgroundColor('#437153');

        this.createNpc();
        this.createPlayer(withSprite);

        this.cameras.main.startFollow(this.player!, true, 0.12, 0.12);
        this.createInterface(width, height);
        this.createInput();
    }

    private buildTilemap(): { width: number; height: number } {
        const map = this.make.tilemap({ key: TILEMAP_KEY });
        const tileset = map.addTilesetImage(
            TILESET_NAME,
            TILESET_IMAGE_KEY,
            TILE,
            TILE,
        );
        const layer = tileset ? map.createLayer('ground', tileset, 0, 0) : null;

        if (!layer) {
            throw new Error('Tilemap "ground" gagal dimuat');
        }

        layer.setScale(TILE_SCALE);

        const solids = this.physics.add.staticGroup();

        layer.forEachTile((tile) => {
            if (tile.index < 0 || WALKABLE_TILE_INDEXES.has(tile.index)) {
                return;
            }

            const size = TILE * TILE_SCALE;
            const zone = this.add.zone(
                (tile.pixelX + TILE / 2) * TILE_SCALE,
                (tile.pixelY + TILE / 2) * TILE_SCALE,
                size,
                size,
            );

            this.physics.add.existing(zone, true);
            solids.add(zone);
        });

        const width = map.widthInPixels * TILE_SCALE;
        const height = map.heightInPixels * TILE_SCALE;

        this.registry.set('solids', solids);

        return { width, height };
    }

    private createNpc(): void {
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

        const npc = this.add.container(480, 220, [
            body,
            head,
            peci,
            plate,
            label,
        ]);

        npc.setDepth(220);
        this.npc = npc;

        this.tweens.add({
            targets: npc,
            y: 214,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        this.prompt = this.add
            .text(480, 178, 'E', {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#020617',
                backgroundColor: '#facc15',
                padding: { x: 4, y: 2 },
            })
            .setOrigin(0.5)
            .setDepth(900)
            .setVisible(false);
    }

    private createPlayer(withSprite: boolean): void {
        const hasFrames = withSprite && this.textures.exists('fadlan-idle');
        const player = this.physics.add.sprite(
            420,
            330,
            hasFrames ? 'fadlan-idle' : '__WHITE',
        );

        player.setDepth(330);
        player.setCollideWorldBounds(true);

        if (hasFrames) {
            player.setDisplaySize(36, 84);
            player.body?.setSize(50, 30);
            player.body?.setOffset(25, 205);

            this.anims.create({
                key: 'fadlan-walk',
                frames: [0, 1, 2, 3, 4].map((i) => ({
                    key: `fadlan-walk-${i}`,
                })),
                frameRate: 9,
                repeat: -1,
            });
        } else {
            player.setDisplaySize(24, 36);
            player.setTint(0x818cf8);
        }

        this.player = player;

        const solids = this.registry.get('solids') as
            | Phaser.Physics.Arcade.StaticGroup
            | undefined;

        if (solids) {
            this.physics.add.collider(player, solids);
        }

        this.playerName = this.add
            .text(player.x, player.y - 62, 'FADLAN', {
                fontFamily: '"Press Start 2P", monospace',
                fontSize: '10px',
                color: '#ffffff',
            })
            .setOrigin(0.5)
            .setDepth(1000);
    }

    private createInterface(width: number, height: number): void {
        this.hint = this.add
            .text(VIEW_W / 2, VIEW_H - 20, 'WASD jalan · E bicara · M minimap', {
                fontFamily: 'monospace',
                fontSize: '13px',
                color: '#94a3b8',
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1000);

        const miniW = 200;
        const miniH = 130;
        const zoom = Math.min(miniW / width, miniH / height) * 0.94;

        const minimap = this.cameras.add(
            VIEW_W - miniW - 14,
            14,
            miniW,
            miniH,
        );

        minimap.setName('minimap');
        minimap.setBackgroundColor(0x020617);
        minimap.setZoom(zoom);
        minimap.centerOn(width / 2, height / 2);
        minimap.ignore([this.hint, ...this.dialog.objects]);

        this.minimap = minimap;
    }

    private createInput(): void {
        const keyboard = this.input.keyboard;

        if (!keyboard) {
            return;
        }

        this.cursors = keyboard.createCursorKeys();
        this.keys = keyboard.addKeys('W,A,S,D,E,M') as Record<
            string,
            Phaser.Input.Keyboard.Key
        >;
    }

    override update(): void {
        const player = this.player;
        const keys = this.keys;

        if (!player || !keys) {
            return;
        }

        const left = this.cursors?.left.isDown || keys.A.isDown;
        const right = this.cursors?.right.isDown || keys.D.isDown;
        const up = this.cursors?.up.isDown || keys.W.isDown;
        const down = this.cursors?.down.isDown || keys.S.isDown;

        const direction = new Phaser.Math.Vector2(
            Number(right) - Number(left),
            Number(down) - Number(up),
        );

        if (direction.lengthSq() > 0) {
            const velocity = direction.clone().normalize().scale(PLAYER_SPEED);
            player.setVelocity(velocity.x, velocity.y);
            player.setFlipX(velocity.x < 0);
            player.setDepth(player.y);

            if (this.textures.exists('fadlan-walk')) {
                player.anims.play('fadlan-walk', true);
            }
        } else {
            player.setVelocity(0, 0);
            player.anims.stop();

            if (this.textures.exists('fadlan-idle')) {
                player.setTexture('fadlan-idle');
            }
        }

        this.playerName?.setPosition(player.x, player.y - 62);

        const nearNpc = this.npc
            ? Phaser.Math.Distance.Between(
                  player.x,
                  player.y,
                  this.npc.x,
                  this.npc.y,
              ) < INTERACT_RANGE
            : false;

        this.prompt?.setVisible(nearNpc && !this.dialog.isOpen);

        if (Phaser.Input.Keyboard.JustDown(keys.M)) {
            this.minimap?.setVisible(!(this.minimap?.visible ?? false));
        }

        if (Phaser.Input.Keyboard.JustDown(keys.E)) {
            this.interact(nearNpc);
        }
    }

    private interact(nearNpc: boolean): void {
        if (this.dialog.reveal()) {
            return;
        }

        if (!nearNpc && !this.dialog.isOpen) {
            return;
        }

        if (this.dialogStep >= LINES.length - 1) {
            this.dialog.hide();
            this.dialogStep = -1;

            return;
        }

        this.dialogStep += 1;
        this.dialog.show(LINES[this.dialogStep] ?? '');
    }
}
