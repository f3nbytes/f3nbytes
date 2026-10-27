/*
 * F3N Story — mini action-RPG pixel di canvas 2D.
 * Party 4 hero (2 manusia lokal P1/P2 + sisanya AI companion),
 * mekanik serang + dodge (dash + i-frames), 3 wave + boss, cerita antar-wave.
 */

import { sound } from './sound';

export type Phase =
    | 'title'
    | 'story'
    | 'quest'
    | 'roam'
    | 'combat'
    | 'victory'
    | 'defeat';
export type Hand = 'p1' | 'p2';

export interface HeroDef {
    name: string;
    role: string;
    color: string;
    dark: string;
    ranged: boolean;
    maxHp: number;
    speed: number;
    dmg: number;
    skill: { name: string; cd: number };
}

export const HEROES: HeroDef[] = [
    {
        name: 'Fahri',
        role: 'Archer',
        color: '#22d3ee',
        dark: '#0e7490',
        ranged: true,
        maxHp: 90,
        speed: 118,
        dmg: 12,
        skill: { name: 'Hujan Panah', cd: 9 },
    },
    {
        name: 'Fadlan',
        role: 'Mage',
        color: '#818cf8',
        dark: '#4338ca',
        ranged: true,
        maxHp: 80,
        speed: 104,
        dmg: 15,
        skill: { name: 'Nova', cd: 11 },
    },
    {
        name: 'Farrel',
        role: 'Knight',
        color: '#fb7185',
        dark: '#be123c',
        ranged: false,
        maxHp: 115,
        speed: 110,
        dmg: 17,
        skill: { name: 'Pusaran', cd: 9 },
    },
    {
        name: 'Nathan',
        role: 'Tank',
        color: '#fbbf24',
        dark: '#b45309',
        ranged: false,
        maxHp: 155,
        speed: 94,
        dmg: 21,
        skill: { name: 'Benteng', cd: 13 },
    },
];

export type ItemKind = 'heal' | 'weapon' | 'armor';

export interface InvItem {
    kind: ItemKind;
    tier: number;
    name: string;
    color: string;
    count: number;
    dmg?: number;
    hp?: number;
    red?: number;
}

/** Katalog senjata (tier 1-3). */
export const WEAPONS: { name: string; color: string; dmg: number }[] = [
    { name: 'Pedang Kayu', color: '#a3a3a3', dmg: 6 },
    { name: 'Pedang Besi', color: '#cbd5e1', dmg: 14 },
    { name: 'Pedang Emas', color: '#fcd34d', dmg: 26 },
];

/** Katalog armor (tier 1-3). */
export const ARMORS: {
    name: string;
    color: string;
    hp: number;
    red: number;
}[] = [
    { name: 'Baju Kulit', color: '#b45309', hp: 20, red: 0.15 },
    { name: 'Zirah Besi', color: '#94a3b8', hp: 45, red: 0.25 },
    { name: 'Zirah Emas', color: '#fbbf24', hp: 80, red: 0.35 },
];

export const HEAL_AMOUNT = 40;
export const INV_MAX = 8;

/** Buat objek item dari jenis + tier (1-3). */
export function makeItem(kind: ItemKind, tier = 1): InvItem {
    if (kind === 'heal') {
        return { kind, tier: 1, name: 'Ramuan', color: '#f472b6', count: 1 };
    }

    if (kind === 'weapon') {
        const w = WEAPONS[Math.min(2, Math.max(0, tier - 1))];

        return {
            kind,
            tier,
            name: w.name,
            color: w.color,
            count: 1,
            dmg: w.dmg,
        };
    }

    const a = ARMORS[Math.min(2, Math.max(0, tier - 1))];

    return {
        kind,
        tier,
        name: a.name,
        color: a.color,
        count: 1,
        hp: a.hp,
        red: a.red,
    };
}

export interface DialogueLine {
    speaker: string;
    text: string;
}

export interface SkinDef {
    name: string;
    color: string;
    dark: string;
}

/** 3 skin per hero (index hero 0-3): Default + 2 alternatif. */
export const SKINS: SkinDef[][] = [
    [
        { name: 'Default', color: '#22d3ee', dark: '#0e7490' },
        { name: 'Hutan', color: '#34d399', dark: '#047857' },
        { name: 'Volt', color: '#a78bfa', dark: '#6d28d9' },
    ],
    [
        { name: 'Default', color: '#818cf8', dark: '#4338ca' },
        { name: 'Sakura', color: '#f472b6', dark: '#be185d' },
        { name: 'Es', color: '#38bdf8', dark: '#075985' },
    ],
    [
        { name: 'Default', color: '#fb7185', dark: '#be123c' },
        { name: 'Ember', color: '#fb923c', dark: '#c2410c' },
        { name: 'Royal', color: '#818cf8', dark: '#4338ca' },
    ],
    [
        { name: 'Default', color: '#fbbf24', dark: '#b45309' },
        { name: 'Lumut', color: '#a3e635', dark: '#4d7c0f' },
        { name: 'Samudra', color: '#38bdf8', dark: '#075985' },
    ],
];

interface FrameRect {
    x: number;
    y: number;
    w: number;
    h: number;
}

const FADLAN_COLS = [31, 165, 298, 429, 562];

const FADLAN_ANIM: Record<
    'idle' | 'walk' | 'run' | 'jump' | 'down',
    FrameRect[]
> = {
    idle: [{ x: 298, y: 80, w: 100, h: 238 }],
    walk: FADLAN_COLS.map((x) => ({ x, y: 428, w: 100, h: 246 })),
    run: FADLAN_COLS.map((x) => ({ x, y: 827, w: 100, h: 220 })),
    jump: [{ x: 289, y: 1132, w: 112, h: 375 }],
    down: [{ x: 559, y: 1132, w: 105, h: 375 }],
};

export interface PartyHud {
    name: string;
    role: string;
    color: string;
    hp: number;
    maxHp: number;
    alive: boolean;
    tag: string;
    skillName: string;
    skillCd: number;
    skillMax: number;
    dodgeCd: number;
    dodgeMax: number;
}

export type NetRole = 'solo' | 'host' | 'client';

export interface RemoteInput {
    x: number;
    y: number;
    atk: number;
    dge: number;
    skl: number;
    /** Arah bidik (unit vector) saat menyerang, dari klik mouse. */
    ax?: number;
    ay?: number;
    /** Pemicu lompatan (Space). */
    jmp?: number;
    /** Suara lanjut dialog dari klien. */
    dlg?: number;
    /** Pemicu interaksi quest (E) dari klien. */
    itr?: number;
    /** Suara skip (quest/dialog) yang butuh semua pemain. */
    skp?: number;
}

/** Batas maksimum souls yang bisa disimpan. */
export const SOULS_MAX = 100;
/** Biaya souls untuk memakai skill (L). */
export const SOUL_COST_SKILL = 25;
/** Biaya souls untuk revive saat seluruh party tumbang. */
export const SOUL_COST_REVIVE = 50;
/** Durasi lompatan (Space), detik. */
const JUMP_TIME = 0.45;
/** Jeda minimal antar lompatan (Space), detik. */
const JUMP_CD = 0.75;

export interface Snapshot {
    v: number;
    /** Jumlah & total suara skip quest (fase quest). */
    vv?: number;
    vt?: number;
    /** 1 = semua quest sudah selesai di host. */
    qk?: number;
    /** Beat dialog aktif & jumlah baris tersisa (fase story). */
    db?: number;
    dl?: number;
    /** Progres quest host: [meja, buku, npc]. */
    qq?: number[];
    /** Nama ruang jurusan aktif (klien ikut host). */
    room?: string;
    /** Nomor urut snapshot (host) untuk membuang data yang lebih lama. */
    q?: number;
    ph: Phase;
    w: number;
    s: number;
    so?: number;
    mp: number;
    p: {
        i: number;
        x: number;
        y: number;
        hp: number;
        al: number;
        fx: number;
        fy: number;
        sc: number;
        dc?: number;
        /** Sisa waktu lompatan (Space) untuk animasi klien. */
        jt?: number;
    }[];
    e: { x: number; y: number; hp: number; t: number; m?: number }[];
    pr: {
        x: number;
        y: number;
        vx: number;
        vy: number;
        d: number;
        k?: string;
        c?: string;
    }[];
}

export interface HudState {
    party: PartyHud[];
    wave: number;
    waveTotal: number;
    enemiesLeft: number;
    score: number;
    souls: number;
    soulsMax: number;
    inv: InvItem[];
    weapon: InvItem | null;
    armor: InvItem | null;
    quests: { label: string; done: number; need: number }[] | null;
    /** Suara skip aktif (x/y) bila fase quest. */
    skip: { votes: number; total: number } | null;
    mapLabel: string;
}

interface StoryBeat {
    chapter: string;
    lines: DialogueLine[];
}

const STORY: StoryBeat[] = [
    {
        chapter: 'CHAPTER 1 — PAGI DI SEKOLAH',
        lines: [
            {
                speaker: 'Narator',
                text: 'Pagi hari di sekolah. F3N-Bytes masuk kelas untuk belajar bersama Pak Syahid.',
            },
            {
                speaker: 'Pak Syahid',
                text: 'Anak-anak, hari ini kita belajar sambil eksplorasi. Keliling sekolahnya dulu — Bu Sari ada tugas spesial!',
            },
            {
                speaker: 'Fahri',
                text: 'Quest? Akhirnya bukan PR biasa! Gue siap!',
            },
            {
                speaker: 'Fadlan',
                text: 'Gue catat: jelajahi lab, perbaiki PC tua, antar surat ke TU. Gas!',
            },
        ],
    },
    {
        chapter: 'CHAPTER 2 — PERINTAH BU SARI',
        lines: [
            {
                speaker: 'Bu Sari',
                text: 'F3N-Bytes! Untung aku ketemu di sini. Ada masalah serius di sekolah kita!',
            },
            {
                speaker: 'Fadlan',
                text: 'Masalah? Sekolah kita yang tenang itu, Bu?',
            },
            {
                speaker: 'Bu Sari',
                text: 'Meja kelas berantakan, buku berhamburan, dan Pak Syahid kehilangan absen!',
            },
            {
                speaker: 'Bu Sari',
                text: 'Rapikan semuanya dulu, lalu lapor padaku. Tekan E dekat objeknya, ya!',
            },
            {
                speaker: 'Fahri',
                text: 'Siap, Bu! Beresin sekolah dulu, dimensi lainnya belakangan!',
            },
        ],
    },
    {
        chapter: 'CHAPTER 3 — TELEPORTASI',
        lines: [
            {
                speaker: 'Narator',
                text: 'Saat menyalakan PC lab yang tua... LAYAR MENYALA TERANG! Teleportasi! F3N tersedot ke dimensi lain!',
            },
            {
                speaker: 'Farrel',
                text: 'Ini... bukan sekolah lagi. Glitch bertebaran di mana-mana!',
            },
            {
                speaker: 'Nathan',
                text: 'Server sekolah jebol ke dimensi Bug. Hajar semuanya biar bisa pulang!',
            },
        ],
    },
    {
        chapter: 'CHAPTER 4 — SERBUAN VIRUS',
        lines: [
            {
                speaker: 'Narator',
                text: 'Gelombang bug semakin banyak! Dimensi digital mulai bergetar hebat.',
            },
            {
                speaker: 'Fadlan',
                text: 'Mereka makin kuat! Kita harus kerja sama, gue cover dari belakang!',
            },
            {
                speaker: 'Farrel',
                text: 'Roger! Gue maju depan, Nathan backup!',
            },
        ],
    },
    {
        chapter: 'CHAPTER 5 — LABIRIN DATA',
        lines: [
            {
                speaker: 'Narator',
                text: 'F3N memasuki zona inti server. Dinding data bercahaya di sekeliling.',
            },
            {
                speaker: 'Fahri',
                text: 'Hati-hati! Gue ngerasa ada yang besar menunggu di depan...',
            },
            {
                speaker: 'Nathan',
                text: 'Tenang. Kita sudah sampai sejauh ini. Satu langkah lagi!',
            },
        ],
    },
    {
        chapter: 'CHAPTER 6 — UJIAN DIMENSI',
        lines: [
            {
                speaker: 'Narator',
                text: 'Cahaya hangat muncul. Hologram Pak Syahid menyala di tengah arena.',
            },
            {
                speaker: 'Pak Syahid',
                text: 'Ini ujian sesungguhnya, Nak. Buktikan ilmumu di sini!',
            },
            {
                speaker: 'Fahri',
                text: 'Siap, Pak! Nilai A atau respawn!',
            },
        ],
    },
    {
        chapter: 'CHAPTER 7 — RAJA DEADLINE',
        lines: [
            {
                speaker: 'Narator',
                text: 'Tanah bergetar... sosok raksasa muncul dari kegelapan. RAJA DEADLINE bangkit!',
            },
            {
                speaker: 'Nathan',
                text: 'Ini dia boss terakhir! Semua siap posisi!',
            },
            {
                speaker: 'Fahri',
                text: 'Kita lawan bareng-bareng. F3N-Bytes nggak pernah mundur!',
            },
            {
                speaker: 'Fadlan',
                text: 'Nova siap! Ayo tumbangkan makhluk ini!',
            },
        ],
    },
    {
        chapter: 'FINAL — PULANG SEKOLAH',
        lines: [
            {
                speaker: 'Narator',
                text: 'Raja Deadline tumbang! Portal pulang terbuka ke halaman sekolah.',
            },
            {
                speaker: 'Pak Syahid',
                text: 'Kalian kembali... dan lulus dengan nilai sempurna!',
            },
            {
                speaker: 'Fahri',
                text: 'Bel pulang belum bunyi. Kita menang tepat waktu!',
            },
        ],
    },
];

const VICTORY_LINES: DialogueLine[] = [
    {
        speaker: 'Narator',
        text: 'Raja Deadline tumbang! Portal pulang terbuka!',
    },
    {
        speaker: 'Pak Syahid',
        text: 'Luar biasa! Kalian lulus... dengan nilai sempurna.',
    },
    { speaker: 'Semua', text: 'SEKOLAH, GAME, DAN DUNIA NYATA — GAS!' },
];

interface Player {
    def: HeroDef;
    x: number;
    y: number;
    /** Target posisi dari snapshot host (dipakai klien untuk interpolasi). */
    sx: number;
    sy: number;
    hp: number;
    alive: boolean;
    faceX: number;
    faceY: number;
    attackCD: number;
    dodgeCD: number;
    dodgeT: number;
    dodgeDX: number;
    dodgeDY: number;
    jumpT: number;
    jumpCD: number;
    hitFlash: number;
    walkT: number;
    moving: boolean;
    control: Hand | 'ai' | 'net' | 'local';
    aiAngle: number;
    deadT: number;
    skin: number;
    skillCD: number;
    spinT: number;
    spinTick: number;
    shieldT: number;
    lunge: number;
    rx: number;
    ry: number;
    rAtk: number;
    rDge: number;
    rSkl: number;
    lastAtk: number;
    lastDge: number;
    lastSkl: number;
    lastJmp: number;
    lastSkp: number;
    lastDlg: number;
    lastItr: number;
    inv: InvItem[];
    weapon: InvItem | null;
    armor: InvItem | null;
}

interface Drop {
    id: number;
    item: InvItem;
    x: number;
    y: number;
    vy: number;
    bob: number;
}

interface Enemy {
    x: number;
    y: number;
    /** Target posisi dari snapshot host (interpolasi klien). */
    tx?: number;
    ty?: number;
    hp: number;
    maxHp: number;
    type: 'bug' | 'mite' | 'boss';
    speed: number;
    dmg: number;
    size: number;
    hitCD: number;
    flash: number;
    walkT: number;
    spawnMiteT: number;
}

interface Proj {
    x: number;
    y: number;
    vx: number;
    vy: number;
    dmg: number;
    life: number;
    maxLife?: number;
    color: string;
    size: number;
    kind?: 'arrow' | 'magic' | 'boss' | 'star' | 'default';
    sourceRole?: string;
    spin?: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

interface Shockwave {
    x: number;
    y: number;
    r: number;
    maxR: number;
    color: string;
}

interface Ghost {
    x: number;
    y: number;
    flip: boolean;
    color: string;
    dark: string;
    life: number;
    maxLife: number;
}

interface FloatText {
    x: number;
    y: number;
    txt: string;
    color: string;
    life: number;
    maxLife: number;
}

interface Slash {
    x: number;
    y: number;
    ang: number;
    life: number;
    maxLife: number;
    color: string;
    reach: number;
    kind?: 'sword' | 'hammer';
    sourceRole?: string;
}

interface ArrowRainDrop {
    x: number;
    y: number;
    targetY: number;
    vy: number;
    dmg: number;
    delay: number;
    landed: boolean;
    landT: number;
    color: string;
}

interface ArrowRainZone {
    x: number;
    y: number;
    r: number;
    life: number;
    maxLife: number;
    color: string;
    arrows: ArrowRainDrop[];
}

interface RunicCircle {
    x: number;
    y: number;
    r: number;
    maxR: number;
    rot: number;
    life: number;
    maxLife: number;
    color: string;
    secondaryColor: string;
}

interface GroundCrack {
    x: number;
    y: number;
    ang: number;
    len: number;
    life: number;
    maxLife: number;
    color: string;
    branches: { dx: number; dy: number }[];
}

interface BastionPillar {
    x: number;
    y: number;
    h: number;
    maxH: number;
    life: number;
    maxLife: number;
    color: string;
}

interface Decor {
    x: number;
    y: number;
    kind: number;
}

interface QuestMarker {
    x: number;
    y: number;
    kind: 'desk' | 'book' | 'npc';
    done: boolean;
}

interface QuestDef {
    label: string;
    need: number;
}

export interface GameCallbacks {
    onHud: (h: HudState) => void;
    onPhase: (p: Phase) => void;
    onStory: (chapter: string, lines: DialogueLine[] | null) => void;
    onSnap?: (s: Snapshot) => void;
    onMap?: (big: boolean) => void;
}

interface MapTheme {
    sky: string;
    a: string;
    b: string;
    leaf: string;
    bloom: string;
    blob: string;
    stone: string;
    fence: string;
}

// Tema lorong gedung: keramik terang, lampu wall, pilar (dipakai semua lantai).
const HALL_TONE: MapTheme = {
    sky: '#101528',
    a: '#d7dce8',
    b: '#c8cfdd',
    leaf: '#2f6b3f',
    bloom: '#facc15',
    blob: '#7dd3fc',
    stone: '#a7aebb',
    fence: '#3b4252',
};

const MAPS: Record<
    | 'school'
    | 'ga1'
    | 'ga2'
    | 'gb1'
    | 'gb2'
    | 'gb3'
    | 'gb4'
    | 'gb5'
    | 'gb6'
    | 'class'
    | 'lab'
    | 'bug'
    | 'boss',
    MapTheme
> = {
    // Halaman SMK TI Airlangga: paving biru-abu, rumput, lis kuning.
    school: {
        sky: '#2f5d8f',
        a: '#5c6675',
        b: '#525b69',
        leaf: '#2f6b3f',
        bloom: '#facc15',
        blob: '#33689c',
        stone: '#cdc7b4',
        fence: '#2b3a55',
    },
    // Satu map = satu lantai: Gedung A (ga1..ga2, 2 lantai),
    // Gedung B (gb1..gb5 + gb6 rooftop, 5 lantai + rooftop).
    ga1: HALL_TONE,
    ga2: HALL_TONE,
    gb1: HALL_TONE,
    gb2: HALL_TONE,
    gb3: HALL_TONE,
    gb4: HALL_TONE,
    gb5: HALL_TONE,
    gb6: HALL_TONE,
    // Lab komputer malam: lantai gelap, monitor menyala, kabel LED.
    lab: {
        sky: '#0d1230',
        a: '#1a2145',
        b: '#161c3a',
        leaf: '#38bdf8',
        bloom: '#f472b6',
        blob: '#0ea5e9',
        stone: '#475569',
        fence: '#312e81',
    },
    // Ruang kelas: keramik putih, papan tulis, meja murid.
    class: {
        sky: '#8a8070',
        a: '#e9e6dd',
        b: '#d9d6cc',
        leaf: '#5f3d1e',
        bloom: '#facc15',
        blob: '#8b5a2b',
        stone: '#b8b2a2',
        fence: '#94a3b8',
    },
    // Dimensi Bug: grid digital biru gelap.
    bug: {
        sky: '#172554',
        a: '#1e3a5f',
        b: '#1b3355',
        leaf: '#22c55e',
        bloom: '#f472b6',
        blob: '#0f766e',
        stone: '#475569',
        fence: '#7c2d12',
    },
    // Arena Raja Deadline: kristal ungu + bara.
    boss: {
        sky: '#1c1030',
        a: '#2a1b3d',
        b: '#241735',
        leaf: '#7c3aed',
        bloom: '#f87171',
        blob: '#5b21b6',
        stone: '#6d5a7d',
        fence: '#4c1d95',
    },
};

/** Geser kecerahan warna hex (amt -255..255). */
function shade(hex: string, amt: number): string {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    const b = Math.max(0, Math.min(255, (n & 255) + amt));

    return `rgb(${r},${g},${b})`;
}

type MapName = keyof typeof MAPS;

const MAP_ORDER: MapName[] = [
    'school',
    'ga1',
    'ga2',
    'gb1',
    'gb2',
    'gb3',
    'gb4',
    'gb5',
    'gb6',
    'class',
    'lab',
    'bug',
    'boss',
];

/** Info satu map gedung: gedung, lantai, jumlah lantai, dan tandai rooftop. */
interface HallInfo {
    bld: 'A' | 'B';
    /** Nomor lantai 1..floors; rooftop = floors + 1. */
    floor: number;
    floors: number;
    roof: boolean;
}

const hallInfo = (name: MapName): HallInfo | null => {
    const bld: 'A' | 'B' | null = name.startsWith('ga')
        ? 'A'
        : name.startsWith('gb')
          ? 'B'
          : null;

    if (!bld) {
        return null;
    }

    const floor = Number.parseInt(name.slice(2), 10);

    if (!Number.isFinite(floor) || floor < 1) {
        return null;
    }

    const floors = bld === 'A' ? 2 : 5;

    return { bld, floor, floors, roof: floor === floors + 1 };
};

/** Zona pintu fase roam: kotak sentuh per map + tujuan & titik spawn. */
type RoamDoor = {
    map: MapName;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    to: MapName;
    tx: number;
    ty: number;
    label: string;
    /** Nama ruang yang muncul di HUD & papan interior saat masuk. */
    room: string;
    /** Baris pintu berbeda (plang terpisah dari kotak sentuh). */
    artY1?: number;
    artY2?: number;
    artX1?: number;
    artX2?: number;
    /** Ambang jalan ke ruang batin (tanpa teleport, satu map lantai). */
    stroll?: boolean;
};

/** Gedung A 2 lantai; Gedung B 5 lantai + rooftop. */
const HALL_BUILDING: Record<
    'A' | 'B',
    {
        prefix: 'ga' | 'gb';
        floors: number;
        rooms: Array<Array<[string, string]>>;
    }
> = {
    // Gedung A 2 lantai: fasilitas umum di lantai 1, lab praktik di lantai 2.
    A: {
        prefix: 'ga',
        floors: 2,
        rooms: [
            [
                ['MUSHOLLA', 'MUSHOLLA'],
                ['RUANG PROYEK', 'RUANG PROYEK'],
                ['R. OSIS', 'RUANG OSIS'],
                ['RUANG BK', 'RUANG BK'],
            ],
            [
                ['LAB PPLG A', 'LAB PPLG A'],
                ['LAB DKV A', 'LAB DKV A'],
                ['LAB TJKT A', 'LAB TJKT A'],
                ['LAB MPLB A', 'LAB MPLB A'],
            ],
        ],
    },
    // Gedung B: ruang teori & adm (kelas X–XII, lab, guru, dsb).
    B: {
        prefix: 'gb',
        floors: 5,
        rooms: [
            [
                ['DKV X', 'RUANG DKV X'],
                ['TJKT X', 'RUANG TJKT X'],
                ['MPLB X', 'RUANG MPLB X'],
                ['PPLG X', 'RUANG PPLG X'],
            ],
            [
                ['DKV XI', 'RUANG DKV XI'],
                ['TJKT XI', 'RUANG TJKT XI'],
                ['MPLB XI', 'RUANG MPLB XI'],
                ['PPLG XI', 'RUANG PPLG XI'],
            ],
            [
                ['LAB PPLG', 'LAB PPLG'],
                ['LAB DKV', 'LAB DKV'],
                ['LAB TJKT', 'LAB TJKT'],
                ['LAB MPLB', 'LAB MPLB'],
            ],
            [
                ['DKV XII', 'RUANG DKV XII'],
                ['TJKT XII', 'RUANG TJKT XII'],
                ['MPLB XII', 'RUANG MPLB XII'],
                ['PPLG XII', 'RUANG PPLG XII'],
            ],
            [
                ['RUANG GURU', 'RUANG GURU'],
                ['PERPUSTAKAAN', 'PERPUSTAKAAN'],
                ['R. UKS', 'RUANG UKS'],
                ['R. TU', 'RUANG TU'],
            ],
        ],
    },
};

const hallName = (bld: 'A' | 'B', floor: number): MapName =>
    (HALL_BUILDING[bld].prefix + floor) as MapName;

/** Mulut ruang: rentang x interior & kotak ambang pintu ruang. */
const HALL_SPANS: Array<[number, number]> = [
    [122, 252],
    [264, 394],
    [406, 536],
    [536, 660],
];
const HALL_DOOR_X: Array<[number, number]> = [
    [170, 204],
    [312, 346],
    [454, 488],
    [580, 614],
];
/** Rentang x kotak tangga barat & timur. */
const HALL_COL: Record<'W' | 'E', { x1: number; x2: number }> = {
    W: { x1: 28, x2: 104 },
    E: { x1: 694, x2: 770 },
};

const ROAM_DOORS: RoamDoor[] = [
    {
        map: 'school',
        x1: 96,
        y1: 144,
        x2: 114,
        y2: 204,
        to: hallName('A', 1),
        tx: 66,
        ty: 254,
        label: 'GEDUNG A',
        room: '',
        artY1: 147,
        artY2: 204,
        artX1: 97,
        artX2: 113,
    },
    {
        map: 'school',
        x1: 447,
        y1: 170,
        x2: 483,
        y2: 202,
        to: hallName('B', 1),
        tx: 66,
        ty: 254,
        label: 'GEDUNG B',
        room: '',
        artY1: 168,
        artY2: 202,
        artX1: 443,
        artX2: 487,
    },
    // Pintu & tangga tiap lantai kedua gedung (dibangkitkan seragam).
    ...(['A', 'B'] as const).flatMap((bld) => {
        const nm = (floor: number): MapName => hallName(bld, floor);
        const doors: RoamDoor[] = [];

        // Ruang batin: jalan masuk lewat ambang (tanpa teleport).
        HALL_BUILDING[bld].rooms.forEach((row, ri) => {
            const floor = ri + 1;

            row.forEach(([label, room], ix) => {
                const span = HALL_SPANS[ix];
                const doorX = HALL_DOOR_X[ix];

                doors.push({
                    map: nm(floor),
                    x1: doorX[0],
                    y1: 208,
                    x2: doorX[1],
                    y2: 220,
                    to: nm(floor),
                    tx: 66,
                    ty: 244,
                    label,
                    room,
                    artY1: 228,
                    artY2: 240,
                    artX1: span[0],
                    artX2: span[1],
                    stroll: true,
                });
            });
        });

        // Ruang tangga tunggal di UJUNG lorong (kolom timur, sebelahan
        // kelas): pintu masuk seperti ruang biasa; di dalamnya zona
        // NAIK di landas atas dan zona TURUN di landas bawah.
        for (let floor = 1; floor <= HALL_BUILDING[bld].floors; floor++) {
            doors.push({
                map: nm(floor),
                x1: 700,
                y1: 208,
                x2: 740,
                y2: 220,
                to: nm(floor),
                tx: 66,
                ty: 244,
                label: 'TANGGA',
                room: 'TANGGA',
                artY1: 228,
                artY2: 240,
                artX1: 668,
                artX2: 770,
                stroll: true,
            });

            // Gedung A tidak punya rooftop, jadi lantai teratasnya buntu.
            if (floor < HALL_BUILDING[bld].floors || bld === 'B') {
                doors.push({
                    map: nm(floor),
                    x1: 726,
                    y1: 96,
                    x2: 764,
                    y2: 130,
                    to: nm(floor + 1),
                    tx: 660,
                    ty: 256,
                    label: 'TANGGA ▲',
                    room: '',
                    artY1: 96,
                    artY2: 108,
                    artX1: 726,
                    artX2: 764,
                });
                doors.push({
                    map: nm(floor + 1),
                    x1: 676,
                    y1: 150,
                    x2: 716,
                    y2: 194,
                    to: nm(floor),
                    tx: 660,
                    ty: 256,
                    label: 'TANGGA ▼',
                    room: '',
                    artY1: 156,
                    artY2: 168,
                    artX1: 676,
                    artX2: 716,
                });
            }
        }

        // Pintu keluar ke halaman (lobbi lantai 1, sisi barat).
        doors.push({
            map: nm(1),
            x1: 30,
            y1: 316,
            x2: 100,
            y2: 368,
            to: 'school',
            tx: bld === 'A' ? 105 : 465,
            ty: 224,
            label: 'KELUAR',
            room: '',
            artY1: 304,
            artY2: 316,
            artX1: 26,
            artX2: 106,
        });

        return doors;
    }),
    {
        map: 'class',
        x1: 484,
        y1: 6,
        x2: 548,
        y2: 46,
        to: 'school',
        room: '',
        tx: 105,
        ty: 224,
        label: 'HALAMAN SEKOLAH',
    },
    {
        map: 'lab',
        x1: 6,
        y1: 36,
        x2: 24,
        y2: 96,
        to: 'school',
        room: '',
        tx: 465,
        ty: 224,
        label: 'HALAMAN SEKOLAH',
    },
];
let WORLD_W = 640;
let WORLD_H = 400;
/** y0 baris ruang tiap map lantai: ruang 48..204, ambang 208..220,
 * koridor 220..288, slab 292..296, lobbi 296..376 (lantai 1). */
const HALL_ROOM_Y0 = 40;
const VIEW_W = 480;
const VIEW_H = 270;
/** Supersample string: teks & gambar raster 3x biar ketajaman (HD). */
const SS = 3;

const dist = (ax: number, ay: number, bx: number, by: number): number =>
    Math.hypot(ax - bx, ay - by);

export class PixelStoryGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private cb: GameCallbacks;
    private raf = 0;
    private last = 0;
    private running = false;
    private paused = false;
    private time = 0;
    private hudT = 0;

    private phase: Phase = 'title';
    private players: Player[] = [];
    private enemies: Enemy[] = [];
    private projs: Proj[] = [];
    private particles: Particle[] = [];
    private shocks: Shockwave[] = [];
    private ghosts: Ghost[] = [];
    private floats: FloatText[] = [];
    private slashes: Slash[] = [];
    private arrowZones: ArrowRainZone[] = [];
    private runicCircles: RunicCircle[] = [];
    private groundCracks: GroundCrack[] = [];
    private bastionPillars: BastionPillar[] = [];
    private hitStop = 0;
    private bossBark = '';
    private bossBarkT = 0;
    private barkStage = 0;
    private decor: Decor[] = [];
    private camX = 0;
    private camY = 0;
    private shake = 0;
    /** Getar kamera bisa dimatikan dari menu jeda (aksesibilitas). */
    private shakeEnabled = true;
    private score = 0;
    private souls = 0;
    private drops: Drop[] = [];
    private dropSeq = 0;
    private waveIndex = -1;
    private storyIndex = 0;
    private storyQueue: DialogueLine[] = [];
    private storyChapter = '';
    private p2Human = false;
    private netRole: NetRole = 'solo';
    private localHero = 0;
    private snapT = 0;
    private snapQ = 0;
    private lastQ = 0;
    /** Ukuran minimap: 1 = mini permanen, 2 = panel besar. */
    private mapView: 1 | 2 = 1;
    private touchUi =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(pointer: coarse)').matches;
    private skipVotes = new Set<number>();
    private skipSeen = 0;
    private skipTotal = 1;
    private mapName: MapName = 'school';
    private quests: QuestDef[] = [];
    private questMarkers: QuestMarker[] = [];
    private questFlash = 0;

    /** Fase jelajah (roam): keliling sekolah sebelum quest dikunci guru. */
    private roamArea: MapName = 'school';
    private roamCd = 0;
    private guruGiven = false;
    private storyFromRoam = false;
    /** Tirai tangga: p = WAKTU BERJALAN sejak mulai; habis durasi → 0. */
    private hallWipeT = 0;
    private hallWipeDur = 2.2;
    private hallWipeDir = 1;
    private hallWipeLabel = '';
    /** Transisi naik tangga: beku + jalan di tempat + teleport saat gelap. */
    private stairFreeze = 0;
    private stairTele = 0;
    private stairDoor: (typeof ROAM_DOORS)[number] | null = null;
    /** Nama ruang jurusan aktif (mis. 'RUANG PPLG') utk HUD & papan tulis. */
    private roomName = '';
    /** Batas kamera keluar map (px) saat fase jelajah, biar tidak mentok. */
    private static readonly CAM_OVERSCROLL = 64;
    private guruPos = { x: 360, y: 204 };

    setMap(name: MapName): void {
        this.mapName = name;
        this.roomName = '';
        const info = hallInfo(name);

        WORLD_W = info ? 800 : 640;
        WORLD_H = info ? 408 : 400;
    }

    private axis: Record<Hand, { x: number; y: number }> = {
        p1: { x: 0, y: 0 },
        p2: { x: 0, y: 0 },
    };

    constructor(canvas: HTMLCanvasElement, cb: GameCallbacks) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Canvas 2D tidak didukung');
        }

        this.ctx = ctx;
        this.cb = cb;
        // Backing buffer 3x: kanvas CSS tetap 480x270 logis, hasil raster tajam.
        this.canvas.width = VIEW_W * SS;
        this.canvas.height = VIEW_H * SS;
        ctx.imageSmoothingEnabled = false;

        let seed = 1234567;
        const rand = (): number => {
            seed = (seed * 1103515245 + 12345) % 2147483648;

            return seed / 2147483648;
        };

        for (let i = 0; i < 90; i++) {
            this.decor.push({
                x: 16 + rand() * (WORLD_W - 32),
                y: 16 + rand() * (WORLD_H - 32),
                kind: Math.floor(rand() * 4),
            });
        }
    }

    start(): void {
        this.resetParty();
        this.running = true;
        this.last = performance.now();
        const loop = (now: number): void => {
            if (!this.running) {
                return;
            }

            const dt = Math.min((now - this.last) / 1000, 0.05);
            this.last = now;

            if (this.hitStop > 0) {
                this.hitStop -= dt;
                this.render();
                this.raf = requestAnimationFrame(loop);

                return;
            }

            if (!this.paused) {
                this.update(dt);
            }

            this.render();
            this.raf = requestAnimationFrame(loop);
        };
        this.raf = requestAnimationFrame(loop);
    }

    destroy(): void {
        this.running = false;
        cancelAnimationFrame(this.raf);
        sound.stopMusic();
    }

    setPaused(paused: boolean): void {
        this.paused = paused;
    }

    /** Matikan getar kamera tanpa mengubah efek lain. */
    setShakeEnabled(on: boolean): void {
        this.shakeEnabled = on;

        if (!on) {
            this.shake = 0;
        }
    }

    isPaused(): boolean {
        return this.paused;
    }

    /** Dipanggil dari tombol MULAI di overlay judul. */
    beginAdventure(): void {
        this.resetParty();
        this.score = 0;
        this.souls = 0;
        this.waveIndex = -1;
        this.storyIndex = 0;
        this.mapView = 1;
        this.cb.onMap?.(false);
        this.setMap('class');
        sound.startMusic();
        this.playStoryBeat(0);
    }

    /** Lanjut dialog berikutnya. Dipanggil tombol LANJUT. */
    advanceDialogue(): void {
        if (this.phase !== 'story' || this.netRole === 'client') {
            return;
        }

        sound.dialog();
        this.storyQueue.shift();

        if (this.storyQueue.length === 0) {
            this.skipVotes.clear();
            this.skipSeen = 0;
            this.finishStory();
        } else {
            this.cb.onStory(this.storyChapter, [...this.storyQueue]);
        }
    }

    /** Akhiri beat: ke quest / wave / menang. */
    private finishStory(): void {
        this.cb.onStory(this.storyChapter, null);

        if (this.storyIndex >= STORY.length) {
            this.win();
        } else if (this.storyIndex === 1) {
            // Selesai intro: jelajah sekolah dulu, quest dikunci di guru.
            this.enterRoam();
        } else if (this.storyIndex === 2) {
            // Dialog Bu Sari selesai: BARU quest dibuka.
            this.startQuests();
        } else {
            this.startWave(this.storyIndex - 3);
        }
    }

    /** Lewati sisa dialog beat (butuh suara semua pemain di online). */
    private skipStory(): void {
        if (this.phase !== 'story' || this.netRole === 'client') {
            return;
        }

        const left = this.storyQueue.length;

        this.storyQueue = [];
        this.skipVotes.clear();
        this.skipSeen = 0;

        if (left > 0) {
            sound.dialog();
        }

        this.finishStory();
        this.pushHud();
    }

    setAxis(hand: Hand, x: number, y: number): void {
        if (hand === 'p2' && (x !== 0 || y !== 0)) {
            this.p2Human = true;
        }

        this.axis[hand] = { x, y };
    }

    pressAttack(hand: Hand): void {
        if (hand === 'p2') {
            this.p2Human = true;
        }

        const p = this.players.find((pl) => pl.control === hand);

        if (!p || !p.alive || this.phase === 'title') {
            return;
        }

        if (this.phase === 'quest') {
            // Interaksi quest sekarang lewat E; serang tetap bisa dipakai.
            this.tryAttack(p);

            return;
        }

        if (this.phase === 'combat') {
            this.tryAttack(p);
        }
    }

    pressDodge(hand: Hand): void {
        if (hand === 'p2') {
            this.p2Human = true;
        }

        const p = this.players.find((pl) => pl.control === hand);

        if (p && p.alive && this.phase === 'combat') {
            this.tryDodge(p);
        }
    }

    pressSkill(hand: Hand): void {
        if (this.netRole !== 'solo') {
            const lp = this.players[this.localHero];

            if (lp && lp.alive && this.phase === 'combat') {
                this.trySkill(lp, true);
            }

            return;
        }

        if (hand === 'p2') {
            this.p2Human = true;
        }

        const p = this.players.find((pl) => pl.control === hand);

        if (p && p.alive && this.phase === 'combat') {
            this.trySkill(p, true);
        }
    }

    pressLocalAttack(): void {
        const p = this.players[this.localHero];

        if (!p || !p.alive) {
            return;
        }

        if (this.phase === 'quest') {
            // Interaksi quest sekarang lewat E; serang tetap bisa dipakai.
            this.tryAttack(p);

            return;
        }

        if (this.phase === 'combat') {
            this.tryAttack(p);
        }
    }

    /** Klien: mainkan animasi aksi seketika (host tetap yang menghitung). */
    predictLocal(kind: 'atk' | 'dge'): void {
        const p = this.players[this.localHero];

        if (!p || !p.alive) {
            return;
        }

        if (kind === 'atk') {
            p.attackCD = Math.max(p.attackCD, 0.38);
        } else {
            p.dodgeT = Math.max(p.dodgeT, 0.22);
        }
    }

    pressLocalDodge(): void {
        const p = this.players[this.localHero];

        if (p && p.alive && this.phase === 'combat') {
            this.tryDodge(p);
        }
    }

    /** Interaksi quest (E) untuk hero yang dikendalikan tangan. */
    pressInteract(hand: Hand): void {
        const p = this.players.find((pl) => pl.control === hand);

        if (p && p.alive) {
            this.tryInteract(p);
        }
    }

    pressJump(hand: Hand): void {
        if (hand === 'p2') {
            this.p2Human = true;
        }

        const p = this.players.find((pl) => pl.control === hand);

        if (p && p.alive) {
            this.tryJump(p);
        }
    }

    /** Interaksi quest (E) untuk hero lokal di mode online. */
    pressLocalInteract(): void {
        const p = this.players[this.localHero];

        if (p && p.alive) {
            this.tryInteract(p);
        }
    }

    pressLocalJump(): void {
        const p = this.players[this.localHero];

        if (p && p.alive) {
            this.tryJump(p);
        }
    }

    private tryJump(p: Player): void {
        if (!p.alive || p.jumpCD > 0 || p.dodgeT > 0) {
            return;
        }

        p.jumpCD = JUMP_CD;
        p.jumpT = JUMP_TIME;
        sound.dodge();
    }

    /** Tinggi lompatan (piksel) untuk digambar. */
    private hopOf(p: Player): number {
        if (p.jumpT <= 0) {
            return 0;
        }

        const t = Math.max(0, Math.min(1, 1 - p.jumpT / JUMP_TIME));

        return Math.sin(Math.PI * t) * 13;
    }

    pressLocalSkill(): void {
        const p = this.players[this.localHero];

        if (p && p.alive && this.phase === 'combat') {
            this.trySkill(p, true);
        }
    }

    /**
     * Serang ke arah titik pada kanvas (koordinat 480x270).
     * Dipakai untuk klik mouse. Mengembalikan arah bidik (unit vector),
     * supaya klien bisa mengirimnya ke host, atau null bila tidak bisa.
     */
    pointerAttack(sx: number, sy: number): { x: number; y: number } | null {
        if (this.phase !== 'combat' && this.phase !== 'quest') {
            return null;
        }

        const p =
            this.netRole === 'solo'
                ? this.players.find((pl) => pl.control === 'p1')
                : this.players[this.localHero];

        if (!p || !p.alive) {
            return null;
        }

        const wx = this.camX + sx;
        const wy = this.camY + sy;
        const dx = wx - p.x;
        const dy = wy - (p.y - 8);
        const len = Math.hypot(dx, dy);

        if (len > 0.5) {
            p.faceX = dx / len;
            p.faceY = dy / len;
        }

        if (this.phase === 'quest') {
            // Interaksi quest lewat E; klik kanvas tetap menyerang.
            if (this.netRole !== 'client') {
                this.tryAttack(p);
            }
        } else if (this.phase === 'combat' && this.netRole !== 'client') {
            // Klien tidak simulasi: serangan dijalankan host dari input.
            this.tryAttack(p);
        }

        return { x: p.faceX, y: p.faceY };
    }

    /**
     * Dodge ke arah titik pada kanvas (klik kanan).
     * Mengembalikan arah bidik (unit vector) untuk dikirim ke host.
     */
    pointerDodge(sx: number, sy: number): { x: number; y: number } | null {
        if (this.phase !== 'combat') {
            return null;
        }

        const p =
            this.netRole === 'solo'
                ? this.players.find((pl) => pl.control === 'p1')
                : this.players[this.localHero];

        if (!p || !p.alive) {
            return null;
        }

        const wx = this.camX + sx;
        const wy = this.camY + sy;
        const dx = wx - p.x;
        const dy = wy - (p.y - 8);
        const len = Math.hypot(dx, dy);

        if (len > 0.5) {
            p.faceX = dx / len;
            p.faceY = dy / len;
        }

        if (this.netRole !== 'client') {
            this.tryDodge(p);
        }

        return { x: p.faceX, y: p.faceY };
    }

    setLocalAxis(x: number, y: number): void {
        const p = this.players[this.localHero];

        if (p) {
            p.rx = x;
            p.ry = y;
        }
    }

    /** Mode net: 'host' simulasi + siarkan, 'client' hanya render. */
    setNetMode(role: NetRole, localHero: number): void {
        this.netRole = role;
        this.localHero = localHero;
        this.players.forEach((p, i) => {
            p.control = i === localHero ? 'local' : 'ai';
        });
        this.pushHud();
    }

    setRemoteInput(hero: number, input: RemoteInput): void {
        const p = this.players[hero];

        if (!p) {
            return;
        }

        p.control = 'net';
        p.rx = input.x;
        p.ry = input.y;

        // Arah bidik dari klik mouse klien, bila ada.
        const applyAim = (): void => {
            const ax = input.ax ?? 0;
            const ay = input.ay ?? 0;
            const aimLen = Math.hypot(ax, ay);

            if (aimLen > 0.001) {
                p.faceX = ax / aimLen;
                p.faceY = ay / aimLen;
            }
        };

        if (input.atk !== p.lastAtk) {
            p.lastAtk = input.atk;
            applyAim();
            this.tryAttack(p);
        }

        if (input.dge !== p.lastDge) {
            p.lastDge = input.dge;
            applyAim();
            this.tryDodge(p);
        }

        if (input.skl !== p.lastSkl) {
            p.lastSkl = input.skl;
            this.trySkill(p);
        }

        if (input.jmp !== undefined && input.jmp !== p.lastJmp) {
            p.lastJmp = input.jmp;
            this.tryJump(p);
        }

        if (input.skp !== undefined && input.skp !== p.lastSkp) {
            p.lastSkp = input.skp;
            this.addSkipVote(hero);
        }

        if (input.dlg !== undefined && input.dlg !== p.lastDlg) {
            p.lastDlg = input.dlg;
            this.advanceDialogue();
        }

        if (input.itr !== undefined && input.itr !== p.lastItr) {
            p.lastItr = input.itr;
            this.tryInteract(p);
        }
    }

    switchToHost(): void {
        this.netRole = 'host';
        this.players.forEach((p) => {
            if (p.control === 'net' && p.alive) {
                p.control = 'ai';
            }
        });
        this.pushHud();
    }

    setHeroAI(hero: number): void {
        const p = this.players[hero];

        if (p && p.control === 'net') {
            p.control = 'ai';
            this.pushHud();
        }
    }

    setSkin(hero: number, skin: number): void {
        const p = this.players[hero];
        const def = SKINS[hero]?.[((skin % 3) + 3) % 3];

        if (!p || !def) {
            return;
        }

        p.skin = skin;
        p.def = { ...p.def, color: def.color, dark: def.dark };
        this.pushHud();
    }

    getSnapshot(): Snapshot {
        this.snapQ += 1;

        return {
            v: 1,
            q: this.snapQ,
            ph: this.phase,
            w: this.waveIndex,
            s: this.score,
            so: this.souls,
            vv: this.skipVotes.size,
            vt: this.skipTotal,
            qk: this.questMarkers.every((m) => m.done) ? 1 : 0,
            db: Math.max(0, this.storyIndex - 1),
            dl: this.storyQueue.length,
            qq: (['desk', 'book', 'npc'] as const).map(
                (k) =>
                    this.questMarkers.filter((m) => m.kind === k && m.done)
                        .length,
            ),
            mp: MAP_ORDER.indexOf(this.mapName),
            room: this.roomName || undefined,
            p: this.players.map((p, i) => ({
                i,
                x: Math.round(p.x * 10) / 10,
                y: Math.round(p.y * 10) / 10,
                hp: Math.max(0, Math.ceil(p.hp)),
                al: p.alive ? 1 : 0,
                fx: Math.round(p.faceX * 100) / 100,
                fy: Math.round(p.faceY * 100) / 100,
                sc: Math.round(p.skillCD * 10) / 10,
                dc: Math.round(p.dodgeCD * 10) / 10,
                jt: Math.round(p.jumpT * 10) / 10,
            })),
            e: this.enemies.map((e) => ({
                x: Math.round(e.x),
                y: Math.round(e.y),
                hp: Math.max(0, Math.ceil(e.hp)),
                m: Math.max(1, Math.ceil(e.maxHp)),
                t: e.type === 'boss' ? 2 : e.type === 'mite' ? 1 : 0,
            })),
            pr: this.projs.map((pr) => ({
                x: Math.round(pr.x),
                y: Math.round(pr.y),
                vx: Math.round(pr.vx),
                vy: Math.round(pr.vy),
                d: pr.dmg,
                k: pr.kind,
                c: pr.color,
            })),
        };
    }

    applySnapshot(s: Snapshot): void {
        if (s.v !== 1) {
            return;
        }

        if (s.q !== undefined) {
            // Host hasil migrasi memulai nomor urut dari 1.
            if (s.q <= 1) {
                this.lastQ = 0;
            }

            if (s.q <= this.lastQ) {
                return;
            }

            this.lastQ = s.q;
        }

        if (s.ph !== this.phase) {
            this.phase = s.ph;
            this.cb.onPhase(s.ph);

            if (s.ph === 'combat') {
                this.cb.onStory('', null);
            }

            if (s.ph === 'quest') {
                this.startQuests();
            }

            if (s.ph === 'roam') {
                this.enterRoam();
            }
        }

        this.waveIndex = s.w;
        this.score = s.s;
        this.souls = s.so ?? 0;

        if (s.vv !== undefined) {
            this.skipSeen = s.vv;
        }

        if (s.vt !== undefined) {
            this.skipTotal = Math.max(1, s.vt);
        }

        if (s.qk === 1) {
            this.questMarkers.forEach((m) => {
                m.done = true;
            });
        }

        // Progres quest dari host (panel klien menyesuaikan).
        if (s.qq) {
            const kinds: ('desk' | 'book' | 'npc')[] = ['desk', 'book', 'npc'];

            kinds.forEach((kind, idx) => {
                const list = this.questMarkers.filter((m) => m.kind === kind);
                const want = Math.min(s.qq?.[idx] ?? 0, list.length);

                for (let k = 0; k < want; k++) {
                    list[k].done = true;
                }
            });
        }

        // Dialog dibawakan host: klien menampilkan baris yang sama.
        if (s.ph === 'story' && s.db !== undefined && s.dl !== undefined) {
            const beat = Math.max(0, s.db);

            if (this.phase !== 'story' || this.storyIndex !== beat + 1) {
                this.playStoryBeat(beat);
            }

            const total = STORY[beat]?.lines.length ?? 0;
            const want = Math.max(0, Math.min(s.dl, total));

            if (this.storyQueue.length !== want) {
                this.storyQueue = [...(STORY[beat]?.lines ?? [])].slice(-want);
                this.cb.onStory(this.storyChapter, [...this.storyQueue]);
            }
        }

        if (
            s.mp >= 0 &&
            s.mp < MAP_ORDER.length &&
            MAP_ORDER[s.mp] !== this.mapName
        ) {
            const nextName = MAP_ORDER[s.mp];
            const from = hallInfo(this.mapName);

            this.setMap(nextName);

            // Tamu: pindah lantai/rooftop gedung sama → tirai membuka
            // (fase keluar saja; tuan rumah sudah mengurus sebagian besar).
            const to = hallInfo(nextName);

            if (
                from !== null &&
                to !== null &&
                from.bld === to.bld &&
                from.floor !== to.floor &&
                this.hallWipeT < 0.2
            ) {
                this.hallWipeDir = to.floor > from.floor ? 1 : -1;
                this.hallWipeLabel = to.roof ? 'ROOFTOP' : `LANTAI ${to.floor}`;
                this.hallWipeT = 1.62;
            }
        }

        this.roomName =
            hallInfo(this.mapName) !== null ? this.roomName : (s.room ?? '');

        s.p.forEach((sp) => {
            const p = this.players[sp.i];

            if (!p) {
                return;
            }

            p.sx = sp.x;
            p.sy = sp.y;
            p.hp = sp.hp;

            // Lompat jauh (respawn/teleport) → langsung tempel.
            if (Math.hypot(p.sx - p.x, p.sy - p.y) > 90) {
                p.x = p.sx;
                p.y = p.sy;
            }

            p.alive = sp.al === 1;
            p.faceX = sp.fx;
            p.faceY = sp.fy;
            p.skillCD = sp.sc;
            p.dodgeCD = sp.dc ?? 0;
            p.jumpT = sp.jt ?? 0;
        });

        const types: ('bug' | 'mite' | 'boss')[] = ['bug', 'mite', 'boss'];
        const prevEnemies = this.enemies;
        this.enemies = s.e.map((se, i) => ({
            x: prevEnemies[i]?.x ?? se.x,
            y: prevEnemies[i]?.y ?? se.y,
            tx: se.x,
            ty: se.y,
            hp: se.hp,
            maxHp: se.m ?? se.hp,
            type: types[se.t] ?? 'bug',
            speed: 0,
            dmg: 0,
            size: se.t === 2 ? 16 : se.t === 1 ? 5 : 7,
            hitCD: 0,
            flash: 0,
            walkT: this.time,
            spawnMiteT: 0,
        }));
        this.projs = s.pr.map((sp) => ({
            x: sp.x,
            y: sp.y,
            vx: sp.vx,
            vy: sp.vy,
            dmg: sp.d,
            life: 1,
            maxLife: 1,
            color: sp.c ?? '#ffffff',
            size: sp.k === 'magic' ? 5 : 3,
            kind: (sp.k as any) ?? 'arrow',
        }));
        this.pushHud();
    }

    /** Ganti hero yang dikontrol: lompat ke hero hidup berikutnya. */
    swapControl(hand: Hand): void {
        if (hand === 'p2') {
            this.p2Human = true;
        }

        const other: Hand = hand === 'p1' ? 'p2' : 'p1';
        const otherHuman = other === 'p1' ? true : this.p2Human;
        const otherHeld = otherHuman
            ? this.players.find((p) => p.control === other && p.alive)
            : undefined;
        const currentIdx = this.players.findIndex((p) => p.control === hand);

        for (let step = 1; step <= this.players.length; step++) {
            const next =
                this.players[(currentIdx + step) % this.players.length];

            if (next.alive && next !== otherHeld) {
                if (currentIdx >= 0) {
                    this.players[currentIdx].control = 'ai';
                }

                next.control = hand;
                this.burst(next.x, next.y - 8, '#ffffff', 10);
                this.pushHud();

                return;
            }
        }
    }

    /** Pilih hero lokal untuk mode solo (P1). */
    selectLocalHero(hero: number): void {
        if (this.players.length === 0) {
            return;
        }

        const target =
            ((hero % this.players.length) + this.players.length) %
            this.players.length;

        this.players.forEach((p, i) => {
            if (i === target) {
                p.control = 'p1';
            } else if (
                p.control === 'p1' ||
                p.control === 'p2' ||
                p.control === 'local'
            ) {
                p.control = 'ai';
            }
        });
        this.localHero = target;
        this.p2Human = false;
        this.pushHud();
    }

    private resetParty(): void {
        const spots = [
            { x: 90, y: 190 },
            { x: 60, y: 220 },
            { x: 120, y: 220 },
            { x: 90, y: 250 },
        ];
        this.players = HEROES.map((def, i) => ({
            def: { ...def },
            x: spots[i].x,
            y: spots[i].y,
            sx: spots[i].x,
            sy: spots[i].y,
            hp: def.maxHp,
            alive: true,
            faceX: 1,
            faceY: 0,
            attackCD: 0,
            dodgeCD: 0,
            dodgeT: 0,
            dodgeDX: 1,
            dodgeDY: 0,
            jumpT: 0,
            jumpCD: 0,
            hitFlash: 0,
            walkT: Math.random() * 10,
            moving: false,
            control: (i === 0 ? 'p1' : i === 1 ? 'p2' : 'ai') as Hand | 'ai',
            aiAngle: (i / 4) * Math.PI * 2,
            deadT: 0,
            skin: 0,
            skillCD: 0,
            shieldT: 0,
            spinT: 0,
            spinTick: 0,
            lunge: 0,
            rx: 0,
            ry: 0,
            rAtk: 0,
            rDge: 0,
            rSkl: 0,
            lastAtk: 0,
            lastDge: 0,
            lastSkl: 0,
            lastJmp: 0,
            lastSkp: 0,
            lastDlg: 0,
            lastItr: 0,
            inv: [],
            weapon: null,
            armor: null,
        }));
        this.enemies = [];
        this.projs = [];
        this.particles = [];
        this.shocks = [];
        this.ghosts = [];
        this.floats = [];
        this.slashes = [];
        this.arrowZones = [];
        this.runicCircles = [];
        this.groundCracks = [];
        this.bastionPillars = [];
        this.drops = [];
        this.bossBark = '';
        this.bossBarkT = 0;
        this.barkStage = 0;
        this.p2Human = false;
        this.netRole = 'solo';
        this.axis = { p1: { x: 0, y: 0 }, p2: { x: 0, y: 0 } };
        this.pushHud();
    }

    private playStoryBeat(i: number): void {
        this.storyIndex = i + 1;
        const beat = STORY[i];
        this.storyChapter = beat.chapter;
        this.storyQueue = [...beat.lines];
        this.phase = 'story';
        const beatMaps: MapName[] = [
            'class',
            'school',
            'lab',
            'bug',
            'lab',
            'bug',
            'boss',
            'school',
        ];
        this.setMap(beatMaps[i] ?? 'school');
        this.cb.onPhase('story');
        this.cb.onStory(beat.chapter, [...this.storyQueue]);
    }

    private playVictory(): void {
        this.storyChapter = 'ENDING — LEVEL UP!';
        this.storyQueue = [...VICTORY_LINES];
        this.cb.onStory(this.storyChapter, [...this.storyQueue]);
    }

    /** Fase quest sekolah: rapikan meja, kumpulkan buku, sapa Pak Syahid. */
    private startQuests(): void {
        this.skipVotes.clear();
        this.skipSeen = 0;
        this.skipTotal = 1;
        this.setMap('class');
        this.phase = 'quest';
        this.storyFromRoam = false;
        this.cb.onPhase('quest');
        this.cb.onStory('', null);
        this.quests = [
            { label: 'Rapikan 3 meja [J]', need: 3 },
            { label: 'Kumpulkan 4 buku', need: 4 },
            { label: 'Sapa Pak Syahid [J]', need: 1 },
        ];
        this.questMarkers = [
            { x: 140, y: 190, kind: 'desk', done: false },
            { x: 500, y: 190, kind: 'desk', done: false },
            { x: 320, y: 310, kind: 'desk', done: false },
            { x: 80, y: 130, kind: 'book', done: false },
            { x: 560, y: 150, kind: 'book', done: false },
            { x: 200, y: 340, kind: 'book', done: false },
            { x: 460, y: 335, kind: 'book', done: false },
            { x: 320, y: 120, kind: 'npc', done: false },
        ];
        this.questFlash = 0;
        // Kumpulkan party di depan kelas agar gedung & NPC terlihat.
        const spots = [
            { x: 300, y: 155 },
            { x: 332, y: 175 },
            { x: 268, y: 175 },
            { x: 300, y: 200 },
        ];

        this.players.forEach((p, i) => {
            p.x = spots[i]?.x ?? 300;
            p.y = spots[i]?.y ?? 240;
            p.faceX = 0;
            p.faceY = -1;
        });
        this.pushHud();
    }

    /** Fase jelajah: keliling halaman & masuk ruangan, tanpa musuh. */
    private enterRoam(): void {
        this.skipVotes.clear();
        this.skipSeen = 0;
        this.skipTotal = 1;
        this.phase = 'roam';
        this.roamArea = 'school';
        this.roomName = '';
        this.guruGiven = false;
        this.roamCd = 0.8;
        this.waveIndex = -1;
        this.quests = [];
        this.questMarkers = [];
        this.enemies = [];
        this.projs = [];
        this.setMap('school');
        this.cb.onPhase('roam');
        this.cb.onStory('', null);

        const spots = [
            { x: 292, y: 252 },
            { x: 324, y: 244 },
            { x: 240, y: 248 },
            { x: 200, y: 240 },
        ];

        this.players.forEach((p, i) => {
            p.x = spots[i]?.x ?? 292;
            p.y = spots[i]?.y ?? 240;
            p.faceX = 0;
            p.faceY = 1;
        });
        this.camX = 52;
        this.camY = 79;
        this.pushHud();
    }

    /** Host: pindahkan seluruh party lewat pintu roam. */
    private moveToRoamDoor(
        door: (typeof ROAM_DOORS)[number],
        skipSfx = false,
    ): void {
        this.roamArea = door.to;
        this.roamCd = 2.2;
        this.setMap(door.to);
        this.roomName = door.room;

        if (!skipSfx) {
            sound.teleport();
        }

        const spots = [
            { x: door.tx, y: door.ty },
            { x: door.tx + 22, y: door.ty + 18 },
            { x: door.tx - 22, y: door.ty + 18 },
            { x: door.tx, y: door.ty + 36 },
        ];

        this.players.forEach((p, i) => {
            p.x = spots[i]?.x ?? door.tx;
            p.y = spots[i]?.y ?? door.ty + 18;
            p.faceX = 0;
            p.faceY = 1;
            p.sx = p.x;
            p.sy = p.y;
        });
        this.camX = Math.max(
            -PixelStoryGame.CAM_OVERSCROLL,
            Math.min(
                WORLD_W - VIEW_W + PixelStoryGame.CAM_OVERSCROLL,
                door.tx - VIEW_W / 2,
            ),
        );
        this.camY = Math.max(
            -PixelStoryGame.CAM_OVERSCROLL,
            Math.min(
                WORLD_H - VIEW_H + PixelStoryGame.CAM_OVERSCROLL,
                door.ty - VIEW_H / 2,
            ),
        );
        this.pushHud();
    }

    /** Roam: bicara dengan guru untuk memicu quest (otoritas host). */
    private roamInteract(p: Player): boolean {
        if (!p.alive || this.netRole === 'client') {
            return false;
        }

        if (
            this.mapName === 'school' &&
            !this.guruGiven &&
            dist(p.x, p.y, this.guruPos.x, this.guruPos.y) < 36
        ) {
            this.guruGiven = true;
            this.storyFromRoam = true;
            sound.quest();
            this.playStoryBeat(1);

            return true;
        }

        return false;
    }

    private questCount(kind: QuestMarker['kind']): {
        done: number;
        need: number;
    } {
        const markers = this.questMarkers.filter((m) => m.kind === kind);
        const idx = kind === 'desk' ? 0 : kind === 'book' ? 1 : 2;

        return {
            done: markers.filter((m) => m.done).length,
            need: this.quests[idx]?.need ?? markers.length,
        };
    }

    private questsDone(): boolean {
        return this.quests.length > 0 && this.questMarkers.every((m) => m.done);
    }

    /** Daftarkan suara skip (quest/dialog); bila semua setuju → lewati. */
    addSkipVote(who: number, total?: number): void {
        if (total !== undefined) {
            this.skipTotal = Math.max(1, total);
        }

        if (this.phase === 'story') {
            this.skipVotes.add(who);

            if (this.skipVotes.size >= this.skipTotal) {
                this.skipStory();
            } else {
                this.pushHud();
            }
        } else if (this.phase === 'quest') {
            if (this.questsDone()) {
                return;
            }

            this.skipVotes.add(who);

            if (this.skipVotes.size >= this.skipTotal) {
                this.trySkipQuests();
            } else {
                this.pushHud();
            }
        }
    }

    /** Suara skip untuk host sendiri (dianggap semua pemain di solo). */
    requestSkip(total?: number): void {
        this.addSkipVote(-1, total ?? 1);
    }

    /** Atur jumlah pemain & cek syarat skip (pemain bisa keluar). */
    setSkipTotal(total: number): void {
        this.skipTotal = Math.max(1, total);

        if (
            (this.phase !== 'quest' && this.phase !== 'story') ||
            this.skipVotes.size === 0
        ) {
            return;
        }

        if (this.skipVotes.size >= this.skipTotal) {
            this.trySkipQuests();
        }
    }

    /** Selesaikan semua quest seketika. */
    trySkipQuests(): void {
        if (this.phase !== 'quest' || this.questsDone()) {
            return;
        }

        let changed = false;

        for (const m of this.questMarkers) {
            if (!m.done) {
                m.done = true;
                this.burst(m.x, m.y - 6, '#facc15', 12);
                changed = true;
            }
        }

        if (changed) {
            this.skipVotes.clear();
            this.skipSeen = 0;
            this.questFlash = 1.4;
            sound.quest();
        }

        this.pushHud();
    }

    /** Interaksi [J]: meja & Pak Syahid. true = termakan (batalkan serangan). */
    private tryInteract(p: Player): boolean {
        if (this.phase === 'roam') {
            return this.roamInteract(p);
        }

        if (this.phase !== 'quest' || !p.alive) {
            return false;
        }

        for (const m of this.questMarkers) {
            if (!m.done && m.kind !== 'book' && dist(p.x, p.y, m.x, m.y) < 30) {
                m.done = true;
                this.burst(m.x, m.y - 6, '#4ade80', 10);
                this.pushHud();

                if (this.questsDone()) {
                    this.questFlash = 1.4;
                    sound.quest();
                }

                return true;
            }
        }

        return false;
    }

    private startWave(i: number): void {
        this.waveIndex = i;
        this.enemies = [];
        /** HP scaling per wave: enemies get tougher each wave. */
        const hpScale = 1 + i * 0.25;
        const spawn = (
            type: 'bug' | 'mite' | 'boss',
            n: number,
            extraHp = 0,
        ): void => {
            for (let k = 0; k < n; k++) {
                const edge = Math.floor(Math.random() * 4);
                const x =
                    edge === 0
                        ? 20
                        : edge === 1
                          ? WORLD_W - 20
                          : 20 + Math.random() * (WORLD_W - 40);
                const y =
                    edge === 2
                        ? 20
                        : edge === 3
                          ? WORLD_H - 20
                          : 20 + Math.random() * (WORLD_H - 40);

                if (type === 'bug') {
                    const baseHp = Math.floor((50 + extraHp) * hpScale);
                    this.enemies.push({
                        x,
                        y,
                        hp: baseHp,
                        maxHp: baseHp,
                        type,
                        speed: 48 + i * 3,
                        dmg: 8 + i,
                        size: 7,
                        hitCD: 0,
                        flash: 0,
                        walkT: 0,
                        spawnMiteT: 0,
                    });
                } else if (type === 'mite') {
                    const baseHp = Math.floor((28 + extraHp) * hpScale);
                    this.enemies.push({
                        x,
                        y,
                        hp: baseHp,
                        maxHp: baseHp,
                        type,
                        speed: 85 + i * 4,
                        dmg: 5 + i,
                        size: 5,
                        hitCD: 0,
                        flash: 0,
                        walkT: 0,
                        spawnMiteT: 0,
                    });
                } else {
                    const bossHp = 800 + extraHp;
                    this.enemies.push({
                        x: WORLD_W / 2,
                        y: 60,
                        hp: bossHp,
                        maxHp: bossHp,
                        type,
                        speed: 38,
                        dmg: 14,
                        size: 16,
                        hitCD: 0,
                        flash: 0,
                        walkT: 0,
                        spawnMiteT: 4,
                    });
                }
            }
        };

        // Wave 0: intro — easy bugs only
        if (i === 0) {
            spawn('bug', 8);
            this.setMap('school');
            // Wave 1: bugs + first mites
        } else if (i === 1) {
            spawn('bug', 8);
            spawn('mite', 5);
            this.setMap('bug');
            // Wave 2: heavier bug swarm + mites
        } else if (i === 2) {
            spawn('bug', 10);
            spawn('mite', 6);
            this.setMap('lab');
            // Wave 3: mite rush + tough bugs
        } else if (i === 3) {
            spawn('bug', 8, 20);
            spawn('mite', 10);
            this.setMap('bug');
            // Wave 4: elite wave — strong bugs + mites + mini-boss
        } else if (i === 4) {
            spawn('bug', 10, 30);
            spawn('mite', 8, 10);
            this.setMap('boss');
            // Wave 5: final boss
        } else {
            spawn('boss', 1);
            spawn('mite', 4);
            this.setMap('boss');
            this.barkStage = 0;
            this.bossBarkT = 0;
        }

        // Hidupkan lagi yang gugur dengan 50% HP.
        for (const p of this.players) {
            if (!p.alive) {
                p.alive = true;
                p.hp = Math.floor(this.maxHpOf(p) / 2);
                p.x = 80 + Math.random() * 40;
                p.y = 180 + Math.random() * 60;
            }
        }

        this.phase = 'combat';
        this.cb.onPhase('combat');
        this.pushHud();
        sound.fanfare();
    }

    private win(): void {
        this.phase = 'victory';
        this.cb.onPhase('victory');
        this.playVictory();
        sound.victory();
    }

    private lose(): void {
        this.phase = 'defeat';
        this.cb.onPhase('defeat');
        sound.defeat();
    }

    /** Revive hero yang dikendalikan dengan biaya souls. */
    private tryRevive(): boolean {
        if (this.souls < SOUL_COST_REVIVE) {
            return false;
        }

        const dead = this.players.filter((p) => !p.alive);

        if (dead.length === 0) {
            return false;
        }

        // Co-op: satu kali bayar menghidupkan seluruh party, bukan hanya
        // hero host (dulu tamu bisa mati permanen).
        this.souls -= SOUL_COST_REVIVE;

        for (const hero of dead) {
            hero.alive = true;
            hero.hp = Math.max(1, Math.round(this.maxHpOf(hero) * 0.5));
            hero.dodgeT = 1.2;
            this.burst(hero.x, hero.y - 8, '#7fd4ff', 20);
            this.shock(hero.x, hero.y, '#4fc3ff', 60);
            this.floatText(hero.x, hero.y - 22, 'REVIVE!', '#a5f3fc');
        }

        sound.fanfare();
        this.pushHud();

        return true;
    }

    private leader(): Player {
        return (
            this.players.find(
                (p) => (p.control === 'local' || p.control === 'p1') && p.alive,
            ) ??
            this.players.find((p) => p.alive) ??
            this.players[0]
        );
    }

    /** Max HP efektif: maxHp dasar + bonus armor. */
    private maxHpOf(p: Player): number {
        return p.def.maxHp + (p.armor?.hp ?? 0);
    }

    /** Damage serangan efektif: dmg dasar + bonus senjata. */
    private dmgOf(p: Player): number {
        return p.def.dmg + (p.weapon?.dmg ?? 0);
    }

    private update(dt: number): void {
        this.time += dt;

        if (
            this.phase !== 'combat' &&
            this.phase !== 'quest' &&
            this.phase !== 'roam'
        ) {
            this.updateParticles(dt);
            this.hostBroadcast(dt, 0.5);

            return;
        }

        // Mode client: simulasi milik host, kita hanya render + kamera.
        if (this.netRole === 'client') {
            this.updateParticles(dt);
            this.smoothRemote(dt);
            const lead =
                this.players[this.localHero]?.alive === true
                    ? this.players[this.localHero]
                    : this.leader();
            const camTx = Math.max(
                -PixelStoryGame.CAM_OVERSCROLL,
                Math.min(
                    WORLD_W - VIEW_W + PixelStoryGame.CAM_OVERSCROLL,
                    lead.x - VIEW_W / 2,
                ),
            );
            const camTy = Math.max(
                -PixelStoryGame.CAM_OVERSCROLL,
                Math.min(
                    WORLD_H - VIEW_H + PixelStoryGame.CAM_OVERSCROLL,
                    lead.y - VIEW_H / 2,
                ),
            );

            if (this.phase === 'roam') {
                const k = Math.min(1, dt * 6);

                this.camX += (camTx - this.camX) * k;
                this.camY += (camTy - this.camY) * k;
            } else {
                this.camX = camTx;
                this.camY = camTy;
            }

            this.shake = Math.max(0, this.shake - dt * 30);

            return;
        }

        // --- Pemain ---
        for (const p of this.players) {
            if (!p.alive) {
                continue;
            }

            p.attackCD = Math.max(0, p.attackCD - dt);
            p.dodgeCD = Math.max(0, p.dodgeCD - dt);
            p.jumpCD = Math.max(0, p.jumpCD - dt);
            p.jumpT = Math.max(0, p.jumpT - dt);
            p.hitFlash = Math.max(0, p.hitFlash - dt);
            p.skillCD = Math.max(0, p.skillCD - dt);
            p.shieldT = Math.max(0, p.shieldT - dt);

            // Pusaran Knight: damage area berkala + visual cyclone.
            if (p.spinT > 0) {
                p.spinT -= dt;
                p.spinTick -= dt;

                if (p.spinTick <= 0) {
                    p.spinTick = 0.12;
                    this.burst(p.x, p.y - 8, p.def.color, 5);
                    this.burst(p.x, p.y - 8, '#ffffff', 3);
                    this.shake = Math.max(this.shake, 1.4);

                    for (const e of this.enemies) {
                        if (dist(p.x, p.y, e.x, e.y) < e.size + 46) {
                            const ang = Math.atan2(e.y - p.y, e.x - p.x);
                            this.damageEnemy(
                                e,
                                Math.ceil(this.dmgOf(p) * 0.7),
                                Math.cos(ang) * 55,
                                Math.sin(ang) * 55,
                            );
                        }
                    }
                }
            }

            // Partikel abu emas melayang saat Benteng Tank aktif
            if (p.shieldT > 0 && Math.random() < dt * 8) {
                this.particles.push({
                    x: p.x + (Math.random() - 0.5) * 26,
                    y: p.y - 2,
                    vx: (Math.random() - 0.5) * 12,
                    vy: -22 - Math.random() * 24,
                    life: 0.5 + Math.random() * 0.3,
                    maxLife: 0.8,
                    color: Math.random() > 0.4 ? '#fde68a' : '#fbbf24',
                    size: 2,
                });
            }

            let mx = 0;
            let my = 0;

            if (p.control === 'local') {
                mx = p.rx;
                my = p.ry;
            } else if (p.control === 'net') {
                mx = p.rx;
                my = p.ry;
            } else {
                const isHuman =
                    p.control === 'p1' || (p.control === 'p2' && this.p2Human);

                if (isHuman) {
                    const a = this.axis[p.control as Hand];
                    mx = a.x;
                    my = a.y;
                } else {
                    const move = this.aiMove(p, dt);
                    mx = move.x;
                    my = move.y;
                }
            }

            if (this.stairFreeze > 0) {
                // Menjanji tangga: posisi beku, kaki terus menginjak ke arah
                // naik (di tempat), sampai tirai menyapu dan map berganti.
                p.faceX = 0;
                p.faceY = this.hallWipeDir > 0 ? -1 : 1;
                p.moving = true;
                p.walkT += dt * 9;
            } else if (p.dodgeT > 0) {
                p.dodgeT -= dt;
                const sp = p.def.speed * 3.4;
                p.x += p.dodgeDX * sp * dt;
                p.y += p.dodgeDY * sp * dt;
                p.moving = true;
                p.walkT += dt * 14;
            } else if (mx !== 0 || my !== 0) {
                const len = Math.hypot(mx, my);
                // Analog: magnitudo menentukan kecepatan; keyboard tetap
                // penuh karena panjang vektornya minimal 1.
                const sp = p.def.speed * Math.min(1, len);
                p.x += (mx / len) * sp * dt;
                p.y += (my / len) * sp * dt;
                p.faceX = mx / len;
                p.faceY = my / len;
                p.moving = true;
                p.walkT += dt * (6 + Math.min(1, len) * 4);
            } else {
                p.moving = false;
            }

            p.x = Math.max(12, Math.min(WORLD_W - 12, p.x));
            // 36: sprite hero setinggi ±30px — biar kepala tidak terpotong
            // saat jalan sampai strip paling atas map.
            p.y = Math.max(36, Math.min(WORLD_H - 10, p.y));
        }

        // Roam: pagar gedung + pintu antar-ruangan (khusus host).
        if (this.phase === 'roam') {
            for (const p of this.players) {
                // Kelas: jangan naik ke band papan tulis; hanya kolom pintu
                // keluar (kanan atas) yang boleh menyala.
                if (this.mapName === 'class') {
                    const doorCol = p.x >= 478 && p.x <= 556;

                    if (p.y < 58) {
                        p.y = doorCol ? Math.max(p.y, 44) : 58;
                    }
                }

                // Lab: papan tulis putih di utara dilarang dinaiki.
                if (
                    this.mapName === 'lab' &&
                    p.y < 52 &&
                    p.x > 226 &&
                    p.x < 414
                ) {
                    p.y = 52;
                }

                if (hallInfo(this.mapName) !== null) {
                    if (p.control === 'ai') {
                        // AI patruli koridor lantai ini saja.
                        if (p.x < 26) {
                            p.x = 26;
                        }

                        if (p.x > 774) {
                            p.x = 774;
                        }

                        if (p.y < 228) {
                            p.y = 228;
                        }

                        if (p.y > 284) {
                            p.y = 284;
                        }

                        continue;
                    }

                    const y0 = HALL_ROOM_Y0;

                    if (p.x < 26) {
                        p.x = 26;
                    }

                    if (p.x > 774) {
                        p.x = 774;
                    }

                    if (hallInfo(this.mapName)?.roof) {
                        // Rooftop: deck terbuka, turun lewat kotak tangga.
                        if (p.y < 60) {
                            p.y = 60;
                        }

                        if (p.y > 292) {
                            p.y = 292;
                        }
                    } else if (
                        p.y < y0 + 204 &&
                        this.hallRoomAt(p.x, p.y) !== null
                    ) {
                        const r = this.hallRoomAt(p.x, p.y);
                        const a1 = r?.artX1 ?? r?.x1 ?? 0;
                        const a2 = r?.artX2 ?? r?.x2 ?? 0;

                        if (p.x < a1 + 1) {
                            p.x = a1 + 1;
                        }

                        if (p.x > a2 - 1) {
                            p.x = a2 - 1;
                        }

                        if (p.y < y0 + 8) {
                            p.y = y0 + 8;
                        }

                        if (
                            r !== null &&
                            r !== undefined &&
                            p.y > y0 + 164 &&
                            (p.x < r.x1 || p.x > r.x2)
                        ) {
                            p.y = y0 + 164;
                        }
                    } else {
                        // Koridor (+ lobbi lantai 1): ambang mulut ruang.
                        if (p.y < y0 + 184 && !this.hallSpanAt(p.x)) {
                            p.y = y0 + 184;
                        }

                        // Ke slab: hanya lobbi lantai 1 yang menembus.
                        if (p.y > y0 + 248) {
                            if (
                                hallInfo(this.mapName)?.floor !== 1 ||
                                p.x > 112
                            ) {
                                p.y = y0 + 248;
                            }
                        }

                        // Dasar lobbi lantai 1.
                        if (
                            hallInfo(this.mapName)?.floor === 1 &&
                            p.y > y0 + 336
                        ) {
                            p.y = y0 + 336;
                        }
                    }

                    // Chip ruang mengikuti posisi hero lokal.
                    if (p === this.players[this.localHero]) {
                        this.updateHallChip();
                    }
                }

                if (this.mapName === 'school' && p.y < 136) {
                    if (p.control === 'ai') {
                        // AI tidak boleh masuk kolom pintu (anti-bounce).
                        p.y = 136;
                        continue;
                    }

                    const inDoorX =
                        (p.x >= 155 && p.x <= 191) ||
                        (p.x >= 488 && p.x <= 524);

                    if (inDoorX) {
                        if (p.y < 94) {
                            p.y = 94;
                        }
                    } else {
                        p.y = 136;
                    }
                }
            }

            this.roamCd = Math.max(0, this.roamCd - dt);

            // Tirai tangga menghitung WAKTU MAJU; teleport terjadi pas
            // layar tertutup penuh (gelap), lalu tirai lanjut menyapu keluar.
            if (this.hallWipeT > 0) {
                this.hallWipeT = this.hallWipeT + dt;

                if (
                    this.stairTele === 1 &&
                    this.stairDoor !== null &&
                    this.hallWipeT >= 1.5
                ) {
                    const door = this.stairDoor;

                    this.stairTele = 0;
                    this.stairDoor = null;
                    this.stairFreeze = 0.12;
                    this.moveToRoamDoor(door, true);
                }

                if (this.hallWipeT >= this.hallWipeDur) {
                    this.hallWipeT = 0;
                    this.hallWipeLabel = '';
                }
            }

            this.stairFreeze = Math.max(0, this.stairFreeze - dt);

            if (this.roamCd <= 0) {
                const door = ROAM_DOORS.find(
                    (d) =>
                        d.map === this.mapName &&
                        !d.stroll &&
                        this.players.some(
                            (pl) =>
                                pl.alive &&
                                // Hanya perampok sungguhan yang boleh
                                // memicu pintu: hero lokal, tamu daring,
                                // atau slot P2 bila beneran manusia. Anggota
                                // AI yang bergelay ke kotak tangga tidak
                                // boleh menukar lantai tanpa sengaja.
                                (pl.control === 'p1' ||
                                    pl.control === 'local' ||
                                    pl.control === 'net' ||
                                    (pl.control === 'p2' && this.p2Human)) &&
                                pl.x >= d.x1 &&
                                pl.x <= d.x2 &&
                                pl.y >= d.y1 &&
                                pl.y <= d.y2,
                        ),
                );

                if (door) {
                    if (door.room === '' && door.label.startsWith('TANGGA')) {
                        if (this.stairDoor === null && this.hallWipeT <= 0) {
                            // Sentuh tangga: bukan teleport instan — party
                            // beku, injak naik di tempat, tirai menyapu
                            // menutup, map berganti saat gelap, tirai
                            // membuka di lantai baru.
                            const from = hallInfo(this.mapName);
                            const to = hallInfo(door.to);
                            const naik =
                                from !== null &&
                                to !== null &&
                                to.floor > from.floor;

                            sound.stairs(naik);
                            this.hallWipeDir = naik ? 1 : -1;
                            this.hallWipeLabel = to
                                ? to.roof
                                    ? 'ROOFTOP'
                                    : `LANTAI ${to.floor}`
                                : '';
                            this.hallWipeT = 0.001;
                            this.stairTele = 1;
                            this.stairDoor = door;
                            this.stairFreeze = 1.62;
                            this.roamCd = 0;
                        }

                        // Sedang transit/beku: tangga ini diam saja.
                    } else {
                        this.moveToRoamDoor(door);
                    }
                }
            }
        }

        // --- Musuh ---
        for (const e of this.enemies) {
            e.walkT += dt * 8;
            e.hitCD = Math.max(0, e.hitCD - dt);
            e.flash = Math.max(0, e.flash - dt);
            const target = this.nearestAlive(e.x, e.y);

            if (target) {
                const d = dist(e.x, e.y, target.x, target.y);
                const reach = e.size + 8;

                if (d > reach) {
                    e.x += ((target.x - e.x) / d) * e.speed * dt;
                    e.y += ((target.y - e.y) / d) * e.speed * dt;
                } else if (e.hitCD <= 0) {
                    this.damagePlayer(target, e.dmg);
                    e.hitCD = 0.9;
                }
            }

            if (e.type === 'boss') {
                e.spawnMiteT -= dt;
                const mites = this.enemies.filter(
                    (m) => m.type === 'mite',
                ).length;

                const frac = e.hp / e.maxHp;
                const stages = [0.8, 0.6, 0.4, 0.2, 0.1];
                const taunts = [
                    'KALIAN TIDAK AKAN LULUS!',
                    'WAKTU TINGGAL SEDIKIT!',
                    'HARUSNYA KALIAN SUDAH MENYERAH!',
                    'BEL SEBENTAR LAGI BERBUNYI!',
                    'T-TIDAK MUNGKIN...!',
                ];

                if (
                    this.barkStage < stages.length &&
                    frac <= (stages[this.barkStage] ?? 1)
                ) {
                    this.bossBark = taunts[this.barkStage] ?? 'MAJU SINI!';
                    this.bossBarkT = 2.2;
                    this.barkStage += 1;
                    this.shake = Math.max(this.shake, 6);
                }

                if (e.spawnMiteT <= 0 && mites < 5) {
                    e.spawnMiteT = 5;
                    this.enemies.push({
                        x: e.x + 20,
                        y: e.y + 10,
                        hp: 32,
                        maxHp: 32,
                        type: 'mite',
                        speed: 100,
                        dmg: 8,
                        size: 5,
                        hitCD: 0,
                        flash: 0,
                        walkT: 0,
                        spawnMiteT: 0,
                    });
                    this.pushHud();
                }
            }
        }

        // --- Proyektil ---
        for (const pr of this.projs) {
            pr.x += pr.vx * dt;
            pr.y += pr.vy * dt;
            pr.life -= dt;

            for (const e of this.enemies) {
                if (e.hp > 0 && dist(pr.x, pr.y, e.x, e.y) < e.size + 3) {
                    this.damageEnemy(e, pr.dmg, pr.vx, pr.vy);
                    pr.life = 0;
                    break;
                }
            }
        }

        this.projs = this.projs.filter(
            (p) =>
                p.life > 0 &&
                p.x > 0 &&
                p.x < WORLD_W &&
                p.y > 0 &&
                p.y < WORLD_H,
        );
        this.enemies = this.enemies.filter((e) => e.hp > 0);
        this.updateDrops(dt);
        this.updateParticles(dt);

        for (const s of this.shocks) {
            s.r += (s.maxR - s.r) * Math.min(1, dt * 7);
        }

        this.shocks = this.shocks.filter((s) => s.maxR - s.r > 1.5);

        for (const gh of this.ghosts) {
            gh.life -= dt;
        }

        this.ghosts = this.ghosts.filter((g) => g.life > 0);

        // Update Hujan Panah Archer
        for (const zone of this.arrowZones) {
            zone.life -= dt;

            for (const a of zone.arrows) {
                if (a.delay > 0) {
                    a.delay -= dt;
                    continue;
                }

                if (!a.landed) {
                    a.y += a.vy * dt;
                    a.x += a.vy * 0.22 * dt;

                    if (a.y >= a.targetY) {
                        a.landed = true;
                        a.y = a.targetY;
                        a.landT = 0.45;
                        this.burst(a.x, a.y, '#67e8f9', 4);
                        this.burst(a.x, a.y, '#ffffff', 2);
                        sound.rainImpact();
                        this.shake = Math.max(this.shake, 1.2);

                        for (const e of this.enemies) {
                            if (
                                e.hp > 0 &&
                                dist(a.x, a.y, e.x, e.y) < e.size + 18
                            ) {
                                this.damageEnemy(e, a.dmg, 12, 18);
                            }
                        }
                    }
                } else if (a.landT > 0) {
                    a.landT -= dt;
                }
            }
        }

        this.arrowZones = this.arrowZones.filter((z) => z.life > 0);

        // Update Cincin Mantra Nova Mage
        for (const rc of this.runicCircles) {
            rc.life -= dt;
            rc.rot += dt * 1.6;

            if (rc.r < rc.maxR) {
                rc.r += (rc.maxR - rc.r) * Math.min(1, dt * 8);
            }
        }

        this.runicCircles = this.runicCircles.filter((r) => r.life > 0);

        // Update Retakan Tanah Tank
        for (const gc of this.groundCracks) {
            gc.life -= dt;
        }

        this.groundCracks = this.groundCracks.filter((g) => g.life > 0);

        // Update Monolit Pilar Benteng Tank
        for (const bp of this.bastionPillars) {
            bp.life -= dt;

            if (bp.h < bp.maxH) {
                bp.h += (bp.maxH - bp.h) * Math.min(1, dt * 9);
            }
        }

        this.bastionPillars = this.bastionPillars.filter((b) => b.life > 0);

        // Kamera ikut leader. Fase roam: digerakkan halus (lerp) supaya
        // enak, dan ketika mentok di tepi map bidikan boleh keluar sedikit
        // (void) supaya hero tidak selalu nempel di pojok layar.
        const lead = this.leader();
        const grd = this.phase === 'roam' ? PixelStoryGame.CAM_OVERSCROLL : 0;
        const camTx = Math.max(
            -grd,
            Math.min(WORLD_W - VIEW_W + grd, lead.x - VIEW_W / 2),
        );
        const camTy = Math.max(
            -grd,
            Math.min(WORLD_H - VIEW_H + grd, lead.y - VIEW_H / 2),
        );

        if (this.phase === 'roam') {
            const k = Math.min(1, dt * 6);

            this.camX += (camTx - this.camX) * k;
            this.camY += (camTy - this.camY) * k;
        } else {
            this.camX = camTx;
            this.camY = camTy;
        }

        this.shake = Math.max(0, this.shake - dt * 30);

        // Menang wave?
        if (
            this.phase === 'combat' &&
            this.enemies.length === 0 &&
            this.projs.length <= 12
        ) {
            if (this.waveIndex < 5) {
                this.playStoryBeat(this.waveIndex + 3);
            } else {
                // Boss defeated — play FINAL story beat then win via advanceDialogue.
                this.playStoryBeat(STORY.length - 1);
            }

            return;
        }

        // Kalah? Coba revive pakai souls dulu.
        if (this.phase === 'combat' && !this.players.some((p) => p.alive)) {
            if (this.tryRevive()) {
                return;
            }

            this.lose();

            return;
        }

        // Quest sekolah: buku terambil saat dilewati.
        if (this.phase === 'quest') {
            for (const m of this.questMarkers) {
                if (m.done || m.kind !== 'book') {
                    continue;
                }

                const touched = this.players.some(
                    (p) => p.alive && dist(p.x, p.y, m.x, m.y) < 13,
                );

                if (touched) {
                    m.done = true;
                    this.burst(m.x, m.y - 4, '#60a5fa', 8);
                    sound.coin();
                    this.pushHud();

                    if (this.questsDone()) {
                        this.questFlash = 1.4;
                        sound.quest();
                    }
                }
            }

            if (this.questFlash > 0) {
                this.questFlash -= dt;

                if (this.questFlash <= 0) {
                    sound.teleport();
                    this.playStoryBeat(2);
                }
            }
        }

        this.hudT += dt;

        if (this.hudT > 0.12) {
            this.hudT = 0;
            this.pushHud();
        }

        // Host menyiarkan snapshot ~12,5Hz saat combat.
        this.hostBroadcast(dt, 0.08);
    }

    /** Kirim snapshot ke klien dengan jeda `every` detik. */
    private hostBroadcast(dt: number, every: number): void {
        if (this.netRole !== 'host') {
            return;
        }

        this.snapT += dt;

        if (this.snapT > every && this.cb.onSnap) {
            this.snapT = 0;
            this.cb.onSnap(this.getSnapshot());
        }
    }

    /**
     * Klien: haluskan posisi dari snapshot host (12-20 Hz) agar gerak
     * tidak patah-patah di layar.
     */
    private smoothRemote(dt: number): void {
        const k = Math.min(1, dt * 16);

        for (const p of this.players) {
            if (p === this.players[this.localHero] && p.alive) {
                // Prediksi lokal: hero sendiri bergerak seketika, lalu
                // dikoreksi halus ke posisi otoritatif dari host.
                const len = Math.hypot(p.rx, p.ry);

                if (len > 0) {
                    p.x += (p.rx / len) * p.def.speed * dt;
                    p.y += (p.ry / len) * p.def.speed * dt;
                    p.faceX = p.rx / len;
                    p.faceY = p.ry / len;
                    p.walkT += dt * 10;
                }

                const corr = Math.min(1, dt * 2.5);
                p.x += (p.sx - p.x) * corr;
                p.y += (p.sy - p.y) * corr;
                p.x = Math.max(12, Math.min(WORLD_W - 12, p.x));
                p.y = Math.max(36, Math.min(WORLD_H - 10, p.y));
                p.moving = len > 0;

                continue;
            }

            p.x += (p.sx - p.x) * k;
            p.y += (p.sy - p.y) * k;
            p.moving = Math.hypot(p.sx - p.x, p.sy - p.y) > 0.4;
        }

        for (const e of this.enemies) {
            if (e.tx === undefined || e.ty === undefined) {
                continue;
            }

            e.x += (e.tx - e.x) * k;
            e.y += (e.ty - e.y) * k;
        }

        // Proyektil: majukan lokal supaya terbang mulus antar-snapshot.
        for (const pr of this.projs) {
            pr.x += pr.vx * dt;
            pr.y += pr.vy * dt;
        }
    }

    private aiMove(p: Player, dt: number): { x: number; y: number } {
        // Cari musuh terdekat.
        let best: Enemy | null = null;
        let bestD = Infinity;

        for (const e of this.enemies) {
            const d = dist(p.x, p.y, e.x, e.y);

            if (d < bestD) {
                bestD = d;
                best = e;
            }
        }

        const range = p.def.ranged ? 150 : 20;

        if (best && bestD < 230) {
            const dx = best.x - p.x;
            const dy = best.y - p.y;
            const len = Math.max(bestD, 0.001);
            p.faceX = dx / len;
            p.faceY = dy / len;

            if (bestD > range) {
                return { x: dx / len, y: dy / len };
            }

            this.tryAttack(p);

            // AI sesekali memakai skill.
            if (p.skillCD <= 0 && Math.random() < dt * 0.5) {
                this.trySkill(p);
            }

            // Dodge darurat.
            if (bestD < 26 && p.dodgeCD <= 0 && Math.random() < dt * 2.2) {
                this.tryDodge(p);
            }

            return { x: 0, y: 0 };
        }

        // Ikuti leader formasi cincin.
        const lead = this.leader();
        p.aiAngle += dt * 0.4;
        const tx = lead.x + Math.cos(p.aiAngle) * 34;
        const ty = lead.y + Math.sin(p.aiAngle) * 30;
        const dx = tx - p.x;
        const dy = ty - p.y;
        const d = Math.hypot(dx, dy);

        if (d > 10) {
            return { x: dx / d, y: dy / d };
        }

        return { x: 0, y: 0 };
    }

    private nearestEnemy(x: number, y: number): Enemy | null {
        let best: Enemy | null = null;
        let bd = Infinity;

        for (const e of this.enemies) {
            if (e.hp <= 0) {
                continue;
            }

            const d = dist(x, y, e.x, e.y);

            if (d < bd) {
                bd = d;
                best = e;
            }
        }

        return best;
    }

    private addGroundCrack(
        x: number,
        y: number,
        ang: number,
        len: number,
        color: string,
    ): void {
        const branches: { dx: number; dy: number }[] = [];
        const steps = 4;
        let cx = 0;
        let cy = 0;

        for (let s = 1; s <= steps; s++) {
            const segLen = (len / steps) * (0.8 + Math.random() * 0.4);
            const dev = (Math.random() - 0.5) * 0.6;
            cx += Math.cos(ang + dev) * segLen;
            cy += Math.sin(ang + dev) * segLen;
            branches.push({ dx: cx, dy: cy });
        }

        this.groundCracks.push({
            x,
            y,
            ang,
            len,
            life: 0.85,
            maxLife: 0.85,
            color,
            branches,
        });
    }

    private nearestAlive(x: number, y: number): Player | null {
        // Benteng Tank memprovokasi: musuh mengincar perisai terdekat.
        let best: Player | null = null;
        let bestD = Infinity;

        for (const p of this.players) {
            if (!p.alive) {
                continue;
            }

            const d = dist(x, y, p.x, p.y);

            if (p.shieldT > 0 && d < 260) {
                return p;
            }

            if (d < bestD) {
                bestD = d;
                best = p;
            }
        }

        return best;
    }

    private tryAttack(p: Player): void {
        if (p.attackCD > 0 || !p.alive) {
            return;
        }

        p.attackCD = 0.38;

        if (p.def.role === 'Archer') {
            // FAHRI: Tembakan Panah Tajam Berkecepatan Tinggi
            const sp = 380;
            const fa = Math.atan2(p.faceY, p.faceX);
            this.projs.push({
                x: p.x + p.faceX * 12,
                y: p.y - 8 + p.faceY * 12,
                vx: Math.cos(fa) * sp,
                vy: Math.sin(fa) * sp,
                dmg: this.dmgOf(p),
                life: 1.1,
                maxLife: 1.1,
                color: p.def.color,
                size: 3,
                kind: 'arrow',
                sourceRole: 'Archer',
            });
            // Hembusan angin busur (wind puff & sparks)
            this.burst(
                p.x + p.faceX * 14,
                p.y - 8 + p.faceY * 14,
                '#ffffff',
                4,
            );
            this.burst(
                p.x + p.faceX * 14,
                p.y - 8 + p.faceY * 14,
                p.def.color,
                4,
            );
            sound.shootArrow();
        } else if (p.def.role === 'Mage') {
            // FADLAN: Bola Energi Sihir Mistik (Arcane Orb)
            const sp = 270;
            const fa = Math.atan2(p.faceY, p.faceX);
            this.projs.push({
                x: p.x + p.faceX * 12,
                y: p.y - 8 + p.faceY * 12,
                vx: Math.cos(fa) * sp,
                vy: Math.sin(fa) * sp,
                dmg: this.dmgOf(p),
                life: 1.3,
                maxLife: 1.3,
                color: p.def.color,
                size: 5,
                kind: 'magic',
                sourceRole: 'Mage',
            });
            // Flash casting rune di ujung tongkat
            this.shock(
                p.x + p.faceX * 14,
                p.y - 8 + p.faceY * 14,
                '#c084fc',
                16,
            );
            this.burst(
                p.x + p.faceX * 14,
                p.y - 8 + p.faceY * 14,
                '#a855f7',
                6,
            );
            sound.magicCast();
        } else if (p.def.role === 'Knight') {
            // FARREL: Tebasan Pedang Ksatria Tajam (Razor Sword Slash)
            const swing = Math.atan2(p.faceY, p.faceX);
            this.slashes.push({
                x: p.x,
                y: p.y - 8,
                ang: swing,
                life: 0.22,
                maxLife: 0.22,
                color: p.def.color,
                reach: 36,
                kind: 'sword',
                sourceRole: 'Knight',
            });
            this.shake = Math.max(this.shake, 1.8);
            sound.swordSlash();

            for (const e of this.enemies) {
                const d = dist(p.x, p.y, e.x, e.y);

                if (d < e.size + 24) {
                    const ang = Math.atan2(e.y - p.y, e.x - p.x);
                    const fa = Math.atan2(p.faceY, p.faceX);
                    let diff = Math.abs(ang - fa);

                    if (diff > Math.PI) {
                        diff = Math.PI * 2 - diff;
                    }

                    if (diff < 1.1) {
                        const kb = 75;
                        this.damageEnemy(
                            e,
                            this.dmgOf(p),
                            Math.cos(ang) * kb,
                            Math.sin(ang) * kb,
                        );
                    }
                }
            }

            this.burst(
                p.x + p.faceX * 16,
                p.y - 8 + p.faceY * 16,
                '#ffffff',
                4,
            );
            this.burst(
                p.x + p.faceX * 16,
                p.y - 8 + p.faceY * 16,
                p.def.color,
                5,
            );
        } else {
            // NATHAN: Tank - Hantaman Palu Gempa & Shield Bash (Heavy Seismic Hammer Smash)
            const swing = Math.atan2(p.faceY, p.faceX);
            this.slashes.push({
                x: p.x,
                y: p.y - 6,
                ang: swing,
                life: 0.28,
                maxLife: 0.28,
                color: '#fbbf24',
                reach: 34,
                kind: 'hammer',
                sourceRole: 'Tank',
            });
            // Retakan tanah emas
            this.addGroundCrack(
                p.x + p.faceX * 12,
                p.y - 2 + p.faceY * 12,
                swing,
                34,
                '#fbbf24',
            );
            this.shake = Math.max(this.shake, 3.2);
            sound.heavySmash();

            for (const e of this.enemies) {
                const d = dist(p.x, p.y, e.x, e.y);

                if (d < e.size + 26) {
                    const ang = Math.atan2(e.y - p.y, e.x - p.x);
                    const fa = Math.atan2(p.faceY, p.faceX);
                    let diff = Math.abs(ang - fa);

                    if (diff > Math.PI) {
                        diff = Math.PI * 2 - diff;
                    }

                    if (diff < 1.35) {
                        const kb = 115;
                        this.damageEnemy(
                            e,
                            this.dmgOf(p),
                            Math.cos(ang) * kb,
                            Math.sin(ang) * kb,
                        );
                    }
                }
            }

            this.burst(
                p.x + p.faceX * 18,
                p.y - 6 + p.faceY * 18,
                '#fde68a',
                7,
            );
            this.burst(
                p.x + p.faceX * 18,
                p.y - 6 + p.faceY * 18,
                '#78350f',
                6,
            );
        }
    }

    private trySkill(p: Player, useSouls = false): void {
        if (p.skillCD > 0 || !p.alive) {
            return;
        }

        if (useSouls) {
            if (this.souls < SOUL_COST_SKILL) {
                this.floatText(p.x, p.y - 24, 'Soul kurang', '#7fd4ff');

                return;
            }

            this.souls -= SOUL_COST_SKILL;
        }

        p.skillCD = p.def.skill.cd;

        if (p.def.role === 'Archer') {
            // Hujan Panah (Arrow Rain / Sky Volley Storm)
            // 1. Tembak panah suar ke langit
            this.projs.push({
                x: p.x,
                y: p.y - 14,
                vx: 0,
                vy: -550,
                dmg: 0,
                life: 0.25,
                maxLife: 0.25,
                color: '#ffffff',
                size: 4,
                kind: 'star',
                sourceRole: 'Archer',
            });
            this.shock(p.x, p.y - 8, p.def.color, 28);
            this.burst(p.x, p.y - 12, '#67e8f9', 10);

            // 2. Tentukan target zone: dekat musuh terdekat atau arah pandang
            let targetX = p.x + p.faceX * 90;
            let targetY = p.y + p.faceY * 90;
            const near = this.nearestEnemy(p.x, p.y);

            if (near && dist(p.x, p.y, near.x, near.y) < 240) {
                targetX = near.x;
                targetY = near.y;
            }

            targetX = Math.max(30, Math.min(WORLD_W - 30, targetX));
            targetY = Math.max(30, Math.min(WORLD_H - 30, targetY));

            // 3. Buat Arrow Rain Zone dengan 18 panah jatuh dari langit secara berkala
            const arrows: ArrowRainDrop[] = [];
            const arrowCount = 18;

            for (let k = 0; k < arrowCount; k++) {
                const ang = Math.random() * Math.PI * 2;
                const r = Math.sqrt(Math.random()) * 44;
                const landX = targetX + Math.cos(ang) * r;
                const landY = targetY + Math.sin(ang) * r;
                arrows.push({
                    x: landX - 25,
                    y: landY - 140,
                    targetY: landY,
                    vy: 480 + Math.random() * 80,
                    dmg: Math.ceil(this.dmgOf(p) * 0.75),
                    delay: 0.12 + k * 0.045,
                    landed: false,
                    landT: 0,
                    color: p.def.color,
                });
            }

            this.arrowZones.push({
                x: targetX,
                y: targetY,
                r: 52,
                life: 1.5,
                maxLife: 1.5,
                color: p.def.color,
                arrows,
            });

            this.shock(targetX, targetY, p.def.color, 45);
        } else if (p.def.role === 'Mage') {
            // Nova: Arcane Supernova
            // 1. Lingkaran Mantra Kuno di tanah
            this.runicCircles.push({
                x: p.x,
                y: p.y - 4,
                r: 10,
                maxR: 68,
                rot: 0,
                life: 1.3,
                maxLife: 1.3,
                color: '#818cf8',
                secondaryColor: '#c084fc',
            });

            // 2. 16 Star Comets radial dengan putaran
            for (let k = 0; k < 16; k++) {
                const a = (k / 16) * Math.PI * 2;
                const sp = 230;
                this.projs.push({
                    x: p.x,
                    y: p.y - 8,
                    vx: Math.cos(a) * sp,
                    vy: Math.sin(a) * sp,
                    dmg: Math.ceil(this.dmgOf(p) * 0.95),
                    life: 1.0,
                    maxLife: 1.0,
                    color: k % 2 === 0 ? '#818cf8' : '#c084fc',
                    size: 4,
                    kind: 'star',
                    sourceRole: 'Mage',
                });
            }

            // 3. Ledakan langsung di sekitar Fadlan
            for (const e of this.enemies) {
                const d = dist(p.x, p.y, e.x, e.y);

                if (d < 65) {
                    const ang = Math.atan2(e.y - p.y, e.x - p.x);
                    this.damageEnemy(
                        e,
                        Math.ceil(this.dmgOf(p) * 1.1),
                        Math.cos(ang) * 90,
                        Math.sin(ang) * 90,
                    );
                }
            }

            this.shock(p.x, p.y - 8, '#c084fc', 55);
            this.shock(p.x, p.y - 8, '#818cf8', 75);
            this.shock(p.x, p.y - 8, '#ffffff', 95);
            this.burst(p.x, p.y - 8, '#ffffff', 14);
            this.burst(p.x, p.y - 8, '#818cf8', 16);
            this.burst(p.x, p.y - 8, '#38bdf8', 10);
            this.shake = Math.max(this.shake, 4.5);
        } else if (p.def.role === 'Knight') {
            // Pusaran: Blade Tempest / Sword Whirlwind
            p.spinT = 1.35;
            p.spinTick = 0;
            this.shock(p.x, p.y - 8, p.def.color, 48);
            this.shock(p.x, p.y - 8, '#f43f5e', 32);
            this.burst(p.x, p.y - 8, '#ffffff', 10);
            this.burst(p.x, p.y - 8, p.def.color, 12);
        } else {
            // Tank: Benteng (Aegis Fortress / Titan Bastion)
            p.shieldT = 3.5;
            // Shockwave emas besar
            this.shock(p.x, p.y - 6, '#fbbf24', 60);
            this.shock(p.x, p.y - 6, '#fde68a', 85);

            // 4 Monolit Pilar Kristal Emas di tanah
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
                const px = p.x + Math.cos(a) * 26;
                const py = p.y - 4 + Math.sin(a) * 20;
                this.bastionPillars.push({
                    x: px,
                    y: py,
                    h: 0,
                    maxH: 18,
                    life: 3.5,
                    maxLife: 3.5,
                    color: '#fbbf24',
                });
                this.addGroundCrack(p.x, p.y - 4, a, 26, '#fbbf24');
            }

            this.burst(p.x, p.y - 8, '#fbbf24', 16);
            this.burst(p.x, p.y - 8, '#ffffff', 10);
            this.shake = Math.max(this.shake, 3.8);

            // Provokasi musuh (Taunt)
            for (const e of this.enemies) {
                if (dist(p.x, p.y, e.x, e.y) < 260) {
                    e.flash = 0.2;
                }
            }
        }

        sound.skill(p.def.role);
        this.pushHud();
    }

    private tryDodge(p: Player): void {
        if (p.dodgeCD > 0 || p.dodgeT > 0 || !p.alive) {
            return;
        }

        p.dodgeCD = 1.0;
        p.dodgeT = 0.22;
        const len = Math.max(Math.hypot(p.faceX, p.faceY), 0.001);
        p.dodgeDX = p.faceX / len;
        p.dodgeDY = p.faceY / len;
        this.burst(p.x, p.y - 6, '#ffffff', 6);
        sound.dodge();

        for (let k = 1; k <= 3; k++) {
            this.ghosts.push({
                x: p.x - p.dodgeDX * 9 * k,
                y: p.y - p.dodgeDY * 9 * k,
                flip: p.faceX < 0,
                color: p.def.color,
                dark: p.def.dark,
                life: 0.28,
                maxLife: 0.28,
            });
        }
    }

    private damagePlayer(p: Player, dmg: number): void {
        if (p.dodgeT > 0 || !p.alive) {
            return;
        }

        if (p.shieldT > 0) {
            // Benteng Tangguh menahan serangan!
            this.burst(p.x, p.y - 10, '#fbbf24', 8);
            this.burst(p.x, p.y - 10, '#ffffff', 4);
            this.floatText(p.x, p.y - 20, 'BLOCKED', '#fde68a');
            sound.deflect();

            return;
        }

        const reduced = Math.max(
            1,
            Math.round(dmg * (1 - (p.armor?.red ?? 0))),
        );
        p.hp -= reduced;
        p.hitFlash = 0.25;
        this.shake = 5;
        this.burst(p.x, p.y - 8, '#f87171', 8);
        sound.hurt();

        if (p.hp <= 0) {
            p.hp = 0;
            p.alive = false;
            this.burst(p.x, p.y - 8, p.def.color, 16);
        }

        this.pushHud();
    }

    private floatText(x: number, y: number, txt: string, color: string): void {
        if (this.floats.length > 24) {
            this.floats.shift();
        }

        this.floats.push({ x, y, txt, color, life: 0.9, maxLife: 0.9 });
    }

    private damageEnemy(e: Enemy, dmg: number, kvx: number, kvy: number): void {
        e.hp -= dmg;
        e.flash = 0.12;
        e.x = Math.max(10, Math.min(WORLD_W - 10, e.x + kvx * 0.03));
        e.y = Math.max(12, Math.min(WORLD_H - 8, e.y + kvy * 0.03));
        this.burst(e.x, e.y - 6, '#facc15', 6);
        this.burst(e.x, e.y - 6, '#ffffff', 3);
        this.floatText(e.x, e.y - 16, `${dmg}`, '#fde68a');
        sound.hit();

        this.shake = Math.max(this.shake, e.type === 'boss' ? 2 : 1.2);

        if (e.hp <= 0) {
            this.score += e.type === 'boss' ? 100 : e.type === 'mite' ? 5 : 10;
            // Souls diisi tiap kill; dipakai untuk skill (L) dan revive.
            const gain = e.type === 'boss' ? 30 : e.type === 'mite' ? 3 : 6;
            this.souls = Math.min(SOULS_MAX, this.souls + gain);
            this.floatText(e.x, e.y - 26, `+${gain} soul`, '#7fd4ff');
            sound.die(e.type === 'boss');
            this.burst(e.x, e.y - 6, '#a855f7', 14);
            this.shock(e.x, e.y, '#a855f7', e.type === 'boss' ? 90 : 38);
            this.shake = e.type === 'boss' ? 10 : 5;
            this.hitStop = e.type === 'boss' ? 0.12 : 0.045;

            if (e.type === 'boss') {
                this.shock(e.x, e.y, '#f87171', 90);
                this.burst(e.x, e.y - 6, '#ffffff', 20);
            }

            this.rollDrops(e);
        }

        this.pushHud();
    }

    /** Tentukan item yang jatuh saat musuh mati. */
    private rollDrops(e: Enemy): void {
        const tier = Math.min(
            3,
            1 + Math.floor(Math.max(0, this.waveIndex) / 2),
        );

        if (e.type === 'boss') {
            this.spawnDrop('heal', 1, e.x, e.y);
            this.spawnDrop('weapon', 3, e.x - 14, e.y);
            this.spawnDrop('armor', 3, e.x + 14, e.y);

            return;
        }

        const roll = Math.random();

        if (e.type === 'mite') {
            if (roll < 0.08) {
                this.spawnDrop('heal', 1, e.x, e.y);
            }

            return;
        }

        if (roll < 0.22) {
            this.spawnDrop('heal', 1, e.x, e.y);
        } else if (roll < 0.34) {
            this.spawnDrop('weapon', tier, e.x, e.y);
        } else if (roll < 0.46) {
            this.spawnDrop('armor', tier, e.x, e.y);
        }
    }

    private spawnDrop(
        kind: ItemKind,
        tier: number,
        x: number,
        y: number,
    ): void {
        this.drops.push({
            id: this.dropSeq++,
            item: makeItem(kind, tier),
            x,
            y,
            vy: -80,
            bob: Math.random() * Math.PI * 2,
        });
    }

    private shock(x: number, y: number, color: string, maxR: number): void {
        this.shocks.push({ x, y, r: 6, maxR, color });
    }

    private burst(x: number, y: number, color: string, n: number): void {
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 30 + Math.random() * 70;
            this.particles.push({
                x,
                y,
                vx: Math.cos(a) * sp,
                vy: Math.sin(a) * sp - 20,
                life: 0.4 + Math.random() * 0.3,
                maxLife: 0.7,
                color,
                size: 2 + Math.floor(Math.random() * 2),
            });
        }
    }

    private updateParticles(dt: number): void {
        for (const pt of this.particles) {
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.vy += 120 * dt;
            pt.life -= dt;
        }

        this.particles = this.particles.filter((p) => p.life > 0);

        for (const f of this.floats) {
            f.y -= 26 * dt;
            f.life -= dt;
        }

        this.floats = this.floats.filter((f) => f.life > 0);

        for (const s of this.slashes) {
            s.life -= dt;
        }

        this.slashes = this.slashes.filter((s) => s.life > 0);
        this.bossBarkT = Math.max(0, this.bossBarkT - dt);
    }

    /** Hero yang dikendalikan pemain lokal. */
    private localPlayer(): Player | undefined {
        return (
            this.players.find(
                (p) => p.control === 'local' || p.control === 'p1',
            ) ?? this.players[this.localHero]
        );
    }

    /** Update item jatuh + auto-pickup oleh hero lokal. */
    private updateDrops(dt: number): void {
        const lp = this.localPlayer();

        for (const d of this.drops) {
            d.bob += dt * 4;
        }

        if (!lp || !lp.alive) {
            return;
        }

        this.drops = this.drops.filter((d) => {
            if (dist(d.x, d.y, lp.x, lp.y) < 16) {
                return !this.collect(lp, d.item);
            }

            return true;
        });
    }

    /** Masukkan item ke tas; true bila berhasil (item hilang dari tanah). */
    private collect(p: Player, item: InvItem): boolean {
        if (item.kind === 'heal') {
            const stack = p.inv.find((i) => i.kind === 'heal');

            if (stack) {
                stack.count += item.count;
                this.floatText(p.x, p.y - 24, `+${item.name}`, item.color);
                this.pushHud();

                return true;
            }
        }

        if (p.inv.length >= INV_MAX) {
            this.floatText(p.x, p.y - 24, 'Tas penuh', '#fca5a5');

            return false;
        }

        p.inv.push({ ...item });
        this.floatText(p.x, p.y - 24, item.name, item.color);
        this.burst(p.x, p.y - 8, item.color, 8);
        sound.pickup();
        this.pushHud();

        return true;
    }

    /** Pakai / equip item di slot inventory index. */
    useItem(index: number): void {
        const p = this.localPlayer();
        const item = p?.inv[index];

        if (!p || !item) {
            return;
        }

        if (item.kind === 'heal') {
            const max = this.maxHpOf(p);

            if (p.hp >= max) {
                this.floatText(p.x, p.y - 24, 'HP penuh', '#fca5a5');

                return;
            }

            p.hp = Math.min(max, p.hp + HEAL_AMOUNT);
            item.count -= 1;

            if (item.count <= 0) {
                p.inv.splice(index, 1);
            }

            this.floatText(p.x, p.y - 24, `+${HEAL_AMOUNT} HP`, '#4ade80');
            this.burst(p.x, p.y - 8, '#4ade80', 12);
            sound.heal();
            this.pushHud();

            return;
        }

        this.equipItem(index);
    }

    /** Tukar senjata/armor dengan yang terpasang. */
    equipItem(index: number): void {
        const p = this.localPlayer();
        const item = p?.inv[index];

        if (!p || !item) {
            return;
        }

        if (item.kind === 'weapon') {
            const prev = p.weapon;
            p.weapon = item;
            p.inv.splice(index, 1);

            if (prev) {
                p.inv.splice(index, 0, prev);
            }

            this.floatText(p.x, p.y - 24, `Pakai ${item.name}`, item.color);
        } else if (item.kind === 'armor') {
            const prev = p.armor;
            p.armor = item;
            p.inv.splice(index, 1);

            if (prev) {
                p.inv.splice(index, 0, prev);
            }

            this.floatText(p.x, p.y - 24, `Pakai ${item.name}`, item.color);
        } else {
            return;
        }

        sound.equip();
        this.pushHud();
    }

    /** Buang item dari tas agar slot lega. */
    discardItem(index: number): void {
        const p = this.localPlayer();

        if (!p) {
            return;
        }

        const item = p.inv[index];

        if (!item) {
            return;
        }

        if (item.kind === 'heal' && item.count > 1) {
            item.count -= 1;
        } else {
            p.inv.splice(index, 1);
        }

        sound.click();
        this.pushHud();
    }

    private pushHud(): void {
        const lp = this.localPlayer();

        this.cb.onHud({
            party: this.players.map((p) => ({
                name: p.def.name,
                role: p.def.role,
                color: p.def.color,
                hp: Math.max(0, Math.ceil(p.hp)),
                maxHp: this.maxHpOf(p),
                alive: p.alive,
                tag:
                    p.control === 'local'
                        ? this.netRole === 'solo'
                            ? 'P1'
                            : 'KAMU'
                        : p.control === 'p1'
                          ? 'P1'
                          : p.control === 'p2'
                            ? this.p2Human
                                ? 'P2'
                                : 'AI'
                            : p.control === 'net'
                              ? 'ON'
                              : 'AI',
                skillName: p.def.skill.name,
                skillCd: Math.ceil(p.skillCD * 10) / 10,
                skillMax: p.def.skill.cd,
                dodgeCd: Math.ceil(p.dodgeCD * 10) / 10,
                dodgeMax: 1.2,
            })),
            wave: Math.min(this.waveIndex + 1, 6),
            waveTotal: 6,
            enemiesLeft: this.enemies.length,
            score: this.score,
            souls: this.souls,
            soulsMax: SOULS_MAX,
            inv: lp?.inv ?? [],
            weapon: lp?.weapon ?? null,
            armor: lp?.armor ?? null,
            skip:
                this.phase === 'quest' || this.phase === 'story'
                    ? {
                          votes: this.skipVotes.size || this.skipSeen,
                          total: this.skipTotal,
                      }
                    : null,
            quests:
                this.phase === 'quest'
                    ? (['desk', 'book', 'npc'] as const).map((kind) => {
                          const names = {
                              desk: 'Rapikan meja',
                              book: 'Kumpulkan buku',
                              npc: 'Sapa Pak Syahid',
                          } as const;
                          const { done, need } = this.questCount(kind);

                          return { label: names[kind], done, need };
                      })
                    : null,
            mapLabel: this.mapLabel(),
        });
    }

    // ---------- Render ----------

    private render(): void {
        const c = this.ctx;

        // Skala supaya semua koordinat logis (480x270) raster pada 3x.
        c.setTransform(SS, 0, 0, SS, 0, 0);
        c.imageSmoothingEnabled = false;

        const shaking = this.shakeEnabled && this.shake > 0;
        const shx = shaking ? (Math.random() - 0.5) * this.shake : 0;
        const shy = shaking ? (Math.random() - 0.5) * this.shake : 0;
        const ox = Math.round(-this.camX + shx);
        const oy = Math.round(-this.camY + shy);

        // Langit-langit sesuai map.
        const theme = MAPS[this.mapName];
        c.fillStyle = theme.sky;
        c.fillRect(0, 0, VIEW_W, VIEW_H);
        c.save();
        c.translate(ox, oy);

        // Dunia statis: lantai, dekorasi, tembok, & furnitur map.
        this.paintFringe(c);
        this.paintWorldBase(c);

        // Retakan tanah Tank (Ground Cracks)
        for (const gc of this.groundCracks) {
            const alpha = Math.max(0, gc.life / gc.maxLife);
            c.save();
            c.globalAlpha = alpha * 0.9;
            c.strokeStyle = gc.color;
            c.lineWidth = 2.5;
            c.lineCap = 'round';
            c.beginPath();
            c.moveTo(gc.x, gc.y);

            for (const b of gc.branches) {
                c.lineTo(gc.x + b.dx, gc.y + b.dy);
            }

            c.stroke();
            // Kilap tengah
            c.strokeStyle = '#ffffff';
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(gc.x, gc.y);

            for (const b of gc.branches) {
                c.lineTo(gc.x + b.dx * 0.7, gc.y + b.dy * 0.7);
            }

            c.stroke();
            c.restore();
        }

        // Lingkaran Mantra Kuno Mage (Runic Sigil Nova)
        for (const rc of this.runicCircles) {
            const alpha = Math.max(0, rc.life / rc.maxLife);
            c.save();
            c.translate(rc.x, rc.y);
            c.globalAlpha = alpha * 0.85;
            c.globalCompositeOperation = 'lighter';
            // Cincin luar
            c.strokeStyle = rc.color;
            c.lineWidth = 2;
            c.beginPath();
            c.arc(0, 0, rc.r, 0, Math.PI * 2);
            c.stroke();
            // Cincin tengah berputar
            c.strokeStyle = rc.secondaryColor;
            c.lineWidth = 1.5;
            c.beginPath();
            c.arc(0, 0, rc.r * 0.72, 0, Math.PI * 2);
            c.stroke();
            // Bintang heksagram mistik berputar di dalam
            c.rotate(rc.rot);
            c.strokeStyle = '#ffffff';
            c.lineWidth = 1;
            c.beginPath();

            for (let i = 0; i < 6; i++) {
                const a1 = (i / 6) * Math.PI * 2;
                const a2 = ((i + 2) / 6) * Math.PI * 2;
                const r1 = rc.r * 0.68;
                c.moveTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
                c.lineTo(Math.cos(a2) * r1, Math.sin(a2) * r1);
            }

            c.stroke();

            // Titik-titik node rune
            for (let i = 0; i < 8; i++) {
                const na = (i / 8) * Math.PI * 2 - rc.rot * 1.5;
                c.fillStyle = '#ffffff';
                c.fillRect(
                    Math.cos(na) * rc.r - 1.5,
                    Math.sin(na) * rc.r - 1.5,
                    3,
                    3,
                );
            }

            c.restore();
        }

        // Area Penanda & Panah Menancap Hujan Panah Archer
        for (const zone of this.arrowZones) {
            const alpha = Math.max(0, zone.life / zone.maxLife);
            c.save();
            c.translate(zone.x, zone.y);
            // Reticle badai angin
            c.globalAlpha = alpha * 0.45;
            c.strokeStyle = zone.color;
            c.lineWidth = 2;
            c.setLineDash([6, 4]);
            c.beginPath();
            c.arc(0, 0, zone.r, this.time * 2, this.time * 2 + Math.PI * 2);
            c.stroke();
            c.setLineDash([]);
            // Crosshair
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(-zone.r * 0.4, 0);
            c.lineTo(zone.r * 0.4, 0);
            c.moveTo(0, -zone.r * 0.4);
            c.lineTo(0, zone.r * 0.4);
            c.stroke();
            c.restore();

            // Gambar panah yang sudah menancap di tanah
            for (const a of zone.arrows) {
                if (a.landed && a.landT > 0) {
                    const arrowAlpha = Math.max(0, a.landT / 0.45);
                    c.save();
                    c.globalAlpha = arrowAlpha;
                    c.strokeStyle = zone.color;
                    c.lineWidth = 2;
                    c.beginPath();
                    c.moveTo(a.x - 4, a.y - 12);
                    c.lineTo(a.x, a.y);
                    c.stroke();
                    // Bulu ekor panah
                    c.fillStyle = '#ffffff';
                    c.fillRect(a.x - 5, a.y - 13, 2, 2);
                    c.restore();
                }
            }
        }

        // Pilar Monolit Benteng Tank (Bastion Spires)
        for (const bp of this.bastionPillars) {
            const alpha = Math.max(0, bp.life / bp.maxLife);
            c.save();
            c.globalAlpha = Math.min(1, alpha * 1.5);
            const w = 8;
            const h = bp.h;
            // Badan pilar kristal
            c.fillStyle = '#b45309';
            c.fillRect(bp.x - w / 2, bp.y - h, w, h);
            c.fillStyle = '#fbbf24';
            c.fillRect(bp.x - w / 2 + 1, bp.y - h + 1, w / 2, h - 2);
            c.fillStyle = '#fde68a';
            c.fillRect(bp.x - w / 2 + 2, bp.y - h + 2, 2, h - 4);
            // Mahkota runcing puncak pilar
            c.beginPath();
            c.moveTo(bp.x - w / 2, bp.y - h);
            c.lineTo(bp.x, bp.y - h - 5);
            c.lineTo(bp.x + w / 2, bp.y - h);
            c.closePath();
            c.fillStyle = '#fde68a';
            c.fill();
            // Cahaya aura
            c.globalCompositeOperation = 'lighter';
            c.fillStyle = 'rgba(251, 191, 36, 0.35)';
            c.beginPath();
            c.arc(bp.x, bp.y - h / 2, 12, 0, Math.PI * 2);
            c.fill();
            c.restore();
        }

        // Proyektil dengan efek visual sesuai role!
        c.save();

        for (const pr of this.projs) {
            const speed = Math.max(1, Math.hypot(pr.vx, pr.vy));
            const vx = pr.vx / speed;
            const vy = pr.vy / speed;
            const ang = Math.atan2(pr.vy, pr.vx);

            if (pr.kind === 'arrow') {
                // ARCHER: Anak Panah Aerodinamis + Wind Streaks + Feathers
                c.save();
                c.translate(pr.x, pr.y);
                c.rotate(ang);

                // Wind Streaks di kedua sisi
                c.globalCompositeOperation = 'lighter';
                c.globalAlpha = 0.55;
                c.strokeStyle = '#67e8f9';
                c.lineWidth = 1;
                c.beginPath();
                c.moveTo(-16, -2.5);
                c.lineTo(2, -2.5);
                c.moveTo(-16, 2.5);
                c.lineTo(2, 2.5);
                c.stroke();

                // Batang Panah (Arrow Shaft)
                c.globalCompositeOperation = 'source-over';
                c.globalAlpha = 1;
                c.strokeStyle = '#0e7490';
                c.lineWidth = 2;
                c.beginPath();
                c.moveTo(-12, 0);
                c.lineTo(3, 0);
                c.stroke();

                // Kepala Panah Tajam (Arrowhead Triangle)
                c.fillStyle = '#ffffff';
                c.beginPath();
                c.moveTo(3, -2.5);
                c.lineTo(8, 0);
                c.lineTo(3, 2.5);
                c.closePath();
                c.fill();
                c.strokeStyle = '#22d3ee';
                c.lineWidth = 1;
                c.stroke();

                // Bulu Ekor Panah (Fletching)
                c.fillStyle = '#22d3ee';
                c.beginPath();
                c.moveTo(-12, 0);
                c.lineTo(-9, -3.5);
                c.lineTo(-6, 0);
                c.lineTo(-9, 3.5);
                c.closePath();
                c.fill();

                // Kilap Ujung Panah
                c.fillStyle = '#ffffff';
                c.fillRect(6, -0.5, 2, 1);

                c.restore();
            } else if (pr.kind === 'magic') {
                // MAGE: Arcane Mystic Orb dengan Swirling Plasma & Orbiting Sparks
                const pulse = 1 + 0.14 * Math.sin(this.time * 18 + pr.x * 0.1);
                const r = pr.size * pulse;

                c.save();
                c.globalCompositeOperation = 'lighter';

                // Nebula Aura
                c.globalAlpha = 0.35;
                c.fillStyle = '#818cf8';
                c.beginPath();
                c.arc(pr.x, pr.y, r + 8, 0, Math.PI * 2);
                c.fill();

                // Ekor Pita Gelombang Mistik (Wavy Mystic Trail)
                const trailLen = 22;
                c.globalAlpha = 0.65;
                c.strokeStyle = '#c084fc';
                c.lineWidth = 3;
                c.beginPath();
                c.moveTo(pr.x - vx * trailLen, pr.y - vy * trailLen);
                c.quadraticCurveTo(
                    pr.x -
                        vx * (trailLen * 0.5) +
                        vy * (Math.sin(this.time * 25) * 5),
                    pr.y -
                        vy * (trailLen * 0.5) -
                        vx * (Math.sin(this.time * 25) * 5),
                    pr.x,
                    pr.y,
                );
                c.stroke();

                // Lapisan Plasma Ungu
                c.globalAlpha = 0.85;
                c.fillStyle = '#818cf8';
                c.beginPath();
                c.arc(pr.x, pr.y, r + 2, 0, Math.PI * 2);
                c.fill();

                // Inti Putih Terang
                c.globalAlpha = 1;
                c.fillStyle = '#ffffff';
                c.beginPath();
                c.arc(pr.x, pr.y, r * 0.5, 0, Math.PI * 2);
                c.fill();

                // 2 Percikan Bintang yang Mengorbit
                const orbAng = this.time * 16;
                const orbDist = r + 4;
                c.fillStyle = '#fde047';
                c.fillRect(
                    Math.round(pr.x + Math.cos(orbAng) * orbDist) - 1,
                    Math.round(pr.y + Math.sin(orbAng) * orbDist) - 1,
                    2,
                    2,
                );
                c.fillStyle = '#38bdf8';
                c.fillRect(
                    Math.round(pr.x - Math.cos(orbAng) * orbDist) - 1,
                    Math.round(pr.y - Math.sin(orbAng) * orbDist) - 1,
                    2,
                    2,
                );

                c.restore();
            } else if (pr.kind === 'star') {
                // NOVA SUPERNOVA STAR COMET
                c.save();
                c.translate(pr.x, pr.y);
                c.rotate(this.time * 12);
                c.globalCompositeOperation = 'lighter';

                // Comet tail
                c.globalAlpha = 0.7;
                c.strokeStyle = pr.color;
                c.lineWidth = 4;
                c.beginPath();
                c.moveTo(0, 0);
                c.lineTo(-vx * 18, -vy * 18);
                c.stroke();

                // 4-pointed Star
                c.globalAlpha = 1;
                c.fillStyle = '#ffffff';
                const sr = 6;
                c.beginPath();
                c.moveTo(0, -sr);
                c.lineTo(sr * 0.3, -sr * 0.3);
                c.lineTo(sr, 0);
                c.lineTo(sr * 0.3, sr * 0.3);
                c.lineTo(0, sr);
                c.lineTo(-sr * 0.3, sr * 0.3);
                c.lineTo(-sr, 0);
                c.lineTo(-sr * 0.3, -sr * 0.3);
                c.closePath();
                c.fill();

                c.restore();
            } else {
                // Default / Boss projectiles
                const trailLen = Math.max(8, pr.size * 5);
                c.globalCompositeOperation = 'lighter';
                c.globalAlpha = 0.2;
                c.fillStyle = pr.color;
                c.beginPath();
                c.arc(pr.x, pr.y, pr.size + 6, 0, Math.PI * 2);
                c.fill();

                c.globalAlpha = 0.7;
                c.strokeStyle = pr.color;
                c.lineWidth = pr.size + 1;
                c.lineCap = 'round';
                c.beginPath();
                c.moveTo(pr.x - vx * trailLen, pr.y - vy * trailLen);
                c.quadraticCurveTo(
                    pr.x - vx * (trailLen * 0.75) + vy * (pr.size * 1.5),
                    pr.y - vy * (trailLen * 0.75) - vx * (pr.size * 1.5),
                    pr.x,
                    pr.y,
                );
                c.stroke();

                c.globalCompositeOperation = 'source-over';
                c.globalAlpha = 1;
                c.fillStyle = pr.color;
                c.fillRect(
                    Math.round(pr.x - pr.size / 2 - 1),
                    Math.round(pr.y - pr.size / 2 - 1),
                    pr.size + 2,
                    pr.size + 2,
                );
                c.fillStyle = '#ffffff';
                c.fillRect(Math.round(pr.x - 1), Math.round(pr.y - 1), 2, 2);
            }
        }

        // Gambar Panah Hujan yang Sedang Turun dari Langit (Falling Rain Arrows)
        for (const zone of this.arrowZones) {
            for (const a of zone.arrows) {
                if (a.delay <= 0 && !a.landed) {
                    c.save();
                    c.globalCompositeOperation = 'lighter';
                    // Garis lintasan jatuh
                    c.strokeStyle = '#67e8f9';
                    c.lineWidth = 2;
                    c.beginPath();
                    c.moveTo(a.x - 6, a.y - 24);
                    c.lineTo(a.x, a.y);
                    c.stroke();
                    // Kepala panah putih
                    c.fillStyle = '#ffffff';
                    c.fillRect(a.x - 1, a.y - 2, 2, 3);
                    c.restore();
                }
            }
        }

        c.restore();

        // Dekor roam (pintu + guru) di belakang entitas.
        if (this.phase === 'roam' || this.storyFromRoam) {
            this.drawRoamWorld(c);
        }

        // Item jatuh.
        for (const d of this.drops) {
            this.drawDrop(d);
        }

        // Musuh.
        const sortedEnemies = [...this.enemies].sort((a, b) => a.y - b.y);

        for (const e of sortedEnemies) {
            this.drawEnemy(e);
        }

        // Pemain (y-sort).
        const sortedPlayers = [...this.players].sort((a, b) => a.y - b.y);

        for (const p of sortedPlayers) {
            this.drawHero(p);

            // Penanda "kamu" di bawah hero sendiri.
            if (p === this.localPlayer() && p.alive) {
                this.drawSelfMark(p);
            }
        }

        // Afterimage dodge.
        for (const gh of this.ghosts) {
            c.globalAlpha = Math.max(0, gh.life / gh.maxLife) * 0.55;
            c.fillStyle = gh.color;
            c.fillRect(Math.round(gh.x) - 5, Math.round(gh.y) - 13, 10, 9);
            c.fillStyle = gh.dark;
            c.fillRect(Math.round(gh.x) - 5, Math.round(gh.y) - 6, 10, 2);
        }

        c.globalAlpha = 1;

        // Ring kejut skill / boss: 3 lapisan radius beda.
        for (const s of this.shocks) {
            const t = 1 - (s.maxR - s.r) / s.maxR;
            const a = Math.max(0, 1 - t);
            c.globalCompositeOperation = 'lighter';
            // Glow lebar.
            c.globalAlpha = a * 0.35;
            c.strokeStyle = s.color;
            c.lineWidth = 8;
            c.beginPath();
            c.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            c.stroke();
            // Ring utama.
            c.globalAlpha = a * 0.9;
            c.lineWidth = 3;
            c.beginPath();
            c.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            c.stroke();
            // Detail putih.
            c.globalAlpha = a * 0.6;
            c.strokeStyle = '#ffffff';
            c.lineWidth = 1.5;
            c.beginPath();
            c.arc(s.x, s.y, s.r * 0.62, 0, Math.PI * 2);
            c.stroke();
            c.globalCompositeOperation = 'source-over';
        }

        c.globalAlpha = 1;

        // Tebasan Melee: Knight (Pedang Bulan Sabit) vs Tank (Hantaman Palu Gempa)
        for (const s of this.slashes) {
            const t = Math.max(0, s.life / s.maxLife);
            const dash = Math.pow(t, 0.6);
            const base = s.x;
            const by = s.y;
            const outer = s.reach;

            if (s.kind === 'hammer') {
                // TANK: Hantaman Palu Gempa & Perisai (Heavy Seismic Impact Wave)
                c.save();
                c.globalCompositeOperation = 'lighter';

                // Gelombang Hantaman Emas Tebal
                c.globalAlpha = dash * 0.85;
                c.strokeStyle = '#fbbf24';
                c.lineWidth = 11;
                c.lineCap = 'round';
                c.beginPath();
                c.arc(base, by, outer * 0.9, s.ang - 0.75, s.ang + 0.75);
                c.stroke();

                // Inti Putih Glinting
                c.globalAlpha = dash * 0.95;
                c.strokeStyle = '#fde68a';
                c.lineWidth = 4;
                c.beginPath();
                c.arc(base, by, outer * 0.9, s.ang - 0.65, s.ang + 0.65);
                c.stroke();

                // Gerigi Gelombang Kejut (Shock Spikes)
                for (let k = -2; k <= 2; k++) {
                    const spikeAng = s.ang + k * 0.3;
                    const r1 = outer * 0.8;
                    const r2 = outer * 1.25;
                    c.strokeStyle = '#fbbf24';
                    c.lineWidth = 2.5;
                    c.beginPath();
                    c.moveTo(
                        base + Math.cos(spikeAng) * r1,
                        by + Math.sin(spikeAng) * r1,
                    );
                    c.lineTo(
                        base + Math.cos(spikeAng) * r2,
                        by + Math.sin(spikeAng) * r2,
                    );
                    c.stroke();
                }

                c.restore();
            } else {
                // KNIGHT: Tebasan Pedang Tajam (Razor Crescent Sword Slash)
                c.save();
                c.globalCompositeOperation = 'lighter';
                const inner = outer * 0.55;

                // Lintasan Utama Gradien Merah
                c.globalAlpha = dash * 0.95;
                c.strokeStyle = s.color;
                c.lineWidth = 6;
                c.lineCap = 'round';
                c.beginPath();
                c.arc(base, by, outer, s.ang - 1.0, s.ang + 0.55);
                c.stroke();

                // Bilah Tajam Putih di Tepi Luar (Razor Edge)
                c.globalAlpha = dash * 0.9;
                c.strokeStyle = '#ffffff';
                c.lineWidth = 2;
                c.beginPath();
                c.arc(base, by, outer + 1, s.ang - 0.9, s.ang + 0.5);
                c.stroke();

                // Garis Belakang Swoosh
                c.globalAlpha = dash * 0.4;
                c.strokeStyle = s.color;
                c.lineWidth = 12;
                c.beginPath();
                c.arc(base, by, inner, s.ang - 0.75, s.ang + 0.35);
                c.stroke();

                // Cross-gleam bintang di ujung tebasan
                c.globalAlpha = dash;
                const tip = s.ang + 0.55;
                const tipX = base + Math.cos(tip) * outer;
                const tipY = by + Math.sin(tip) * outer;

                c.fillStyle = '#ffffff';
                c.fillRect(tipX - 1.5, tipY - 1.5, 3, 3);
                c.fillRect(tipX - 3.5, tipY - 0.5, 7, 1);
                c.fillRect(tipX - 0.5, tipY - 3.5, 1, 7);

                c.restore();
            }
        }

        c.globalCompositeOperation = 'source-over';

        c.globalAlpha = 1;

        // Angka damage melayang.
        c.textAlign = 'center';

        for (const f of this.floats) {
            c.globalAlpha = Math.max(0, Math.min(1, f.life / 0.4));
            c.fillStyle = '#0f172a';
            c.font = '7px monospace';
            c.fillText(f.txt, Math.round(f.x) + 1, Math.round(f.y) + 1);
            c.fillStyle = f.color;
            c.fillText(f.txt, Math.round(f.x), Math.round(f.y));
        }

        c.globalAlpha = 1;
        c.textAlign = 'left';

        // Gertakan boss.
        if (this.bossBarkT > 0 && this.bossBark) {
            const bw = 250;
            c.fillStyle = 'rgba(2,6,23,0.85)';
            c.fillRect(VIEW_W / 2 - bw / 2, 56, bw, 24);
            c.strokeStyle = '#ef4444';
            c.lineWidth = 1;
            c.strokeRect(VIEW_W / 2 - bw / 2 + 0.5, 56.5, bw - 1, 23);
            c.fillStyle = '#fca5a5';
            c.font = '7px "Press Start 2P", monospace';
            c.textAlign = 'center';
            c.fillText(this.bossBark, VIEW_W / 2, 71);
            c.textAlign = 'left';
        }

        // Cahaya obor mengikuti leader (map gelap saja).
        if (this.mapName !== 'school' && this.mapName !== 'class') {
            const lead = this.leader();
            const lg = c.createRadialGradient(
                lead.x,
                lead.y - 8,
                12,
                lead.x,
                lead.y - 8,
                140,
            );
            lg.addColorStop(0, 'rgba(255,190,90,0.12)');
            lg.addColorStop(1, 'rgba(255,190,90,0)');
            c.fillStyle = lg;
            c.fillRect(lead.x - 140, lead.y - 148, 280, 280);
        }

        // Partikel.
        for (const pt of this.particles) {
            c.globalAlpha = Math.max(0, pt.life / pt.maxLife);
            c.fillStyle = pt.color;
            c.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size);
        }

        c.globalAlpha = 1;

        if (this.phase === 'quest') {
            this.drawQuestWorld(c);
        }

        c.restore();

        // Vignette.
        const g = c.createRadialGradient(
            VIEW_W / 2,
            VIEW_H / 2,
            VIEW_H / 3,
            VIEW_W / 2,
            VIEW_H / 2,
            VIEW_H,
        );
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(2,6,23,0.55)');
        c.fillStyle = g;
        c.fillRect(0, 0, VIEW_W, VIEW_H);

        // Saran roam (di atas vignette agar terbaca).
        if (this.phase === 'roam') {
            const hint =
                this.mapName === 'school'
                    ? 'JELAJAH SEKOLAH — dekati BU SARI, tekan E untuk minta tugas'
                    : hallInfo(this.mapName) !== null
                      ? this.hallHint()
                      : 'DI DALAM GEDUNG — lewati pintu keluar di tepi map';
            // Teks panjang dikecilkan sedikit agar tetap muat di layar.
            const fs = hint.length > 68 ? 7 : 8;
            const bw = Math.min(
                460,
                Math.max(280, Math.round(hint.length * fs * 0.62 + 24)),
            );
            const bx = (VIEW_W - bw) / 2;
            // Tetap di area langit atas; gradasi HUD React dibuat transparan
            // di tengah agar teks ini tidak ikut menggelap.
            const by = 6;
            c.fillStyle = 'rgba(2,6,23,0.88)';
            c.fillRect(bx, by, bw, 16);
            c.strokeStyle = 'rgba(250,204,21,0.9)';
            c.lineWidth = 1;
            c.strokeRect(bx + 0.5, by + 0.5, bw - 1, 15);
            c.save();
            c.shadowColor = 'rgba(0,0,0,0.9)';
            c.shadowBlur = 2;
            c.fillStyle = '#fef08a';
            c.font = `bold ${fs}px monospace`;
            c.textAlign = 'center';
            c.fillText(hint, VIEW_W / 2, by + 11.5);
            c.restore();
            c.textAlign = 'left';
        }

        if (this.phase !== 'title') {
            this.drawMinimap();
        }

        // Tirai naik/turun lantai di atas segalanya (map & mini).
        this.drawHallWipe();

        if (this.questFlash > 0) {
            const a = Math.min(
                1,
                Math.max(0, ((1.4 - this.questFlash) / 1.4) * 1.4),
            );

            if (a > 0.25) {
                const bw = 220;
                c.fillStyle = 'rgba(2,6,23,0.85)';
                c.fillRect(VIEW_W / 2 - bw / 2, 108, bw, 40);
                c.strokeStyle = '#facc15';
                c.lineWidth = 2;
                c.strokeRect(VIEW_W / 2 - bw / 2 + 1, 109, bw - 2, 38);
                c.fillStyle = '#facc15';
                c.font = '10px "Press Start 2P", monospace';
                c.textAlign = 'center';
                c.fillText('QUEST SELESAI!', VIEW_W / 2, 126);
                c.fillStyle = 'rgba(255,255,255,0.85)';
                c.font = '6px monospace';
                c.fillText('menuju teleportasi...', VIEW_W / 2, 139);
                c.textAlign = 'left';
            }

            c.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
            c.fillRect(0, 0, VIEW_W, VIEW_H);
        }
    }

    /** Tombol peta: mini map selalu tampil, tombol hanya besar/kecil. */
    toggleMinimap(): void {
        this.mapView = this.mapView === 2 ? 1 : 2;
        this.cb.onMap?.(this.mapView === 2);
    }

    /** Aktifkan petunjuk khusus layar sentuh. */
    setTouchUi(on: boolean): void {
        this.touchUi = on;
    }

    /** Nama map untuk label. */
    private mapLabel(): string {
        if (this.roomName) {
            return this.roomName;
        }

        return hallInfo(this.mapName) !== null
            ? this.mapLabelHall()
            : this.mapName === 'school'
              ? 'SEKOLAH'
              : this.mapName === 'class'
                ? 'RUANG KELAS'
                : this.mapName === 'lab'
                  ? 'LAB KOMPUTER'
                  : this.mapName === 'boss'
                    ? 'ARENA RAJA'
                    : 'DIMENSI BUG';
    }

    /** Label lorong gedung: nama gedung + lantai aktif. */
    private mapLabelHall(): string {
        const info = hallInfo(this.mapName);

        if (!info) {
            return 'SEKOLAH';
        }

        return info.roof
            ? `GEDUNG ${info.bld} · ROOFTOP`
            : `GEDUNG ${info.bld} · LANTAI ${info.floor}`;
    }

    /** Snapshot dunia statis per map: lantai, tembok, furnitur asli. */
    private mapSnap: HTMLCanvasElement | null = null;
    private mapSnapName = '';

    private mapSnapshot(): HTMLCanvasElement | null {
        if (typeof document === 'undefined') {
            return null;
        }

        const snapKey = this.mapName + this.roomName;

        if (!this.mapSnap || this.mapSnapName !== snapKey) {
            const cv = document.createElement('canvas');

            cv.width = WORLD_W;
            cv.height = WORLD_H;

            const oc = cv.getContext('2d');

            if (oc) {
                this.paintWorldBase(oc);
                this.mapSnap = cv;
                this.mapSnapName = snapKey;
            }
        }

        return this.mapSnap;
    }

    /** Peta: kecil di pojok, besar jadi panel penuh di tengah layar. */
    private drawMinimap(): void {
        const c = this.ctx;
        const big = this.mapView === 2;
        const snap = this.mapSnapshot();

        // Di layar sentuh mini map dibuat lebih kecil agar tidak menutupi arena.
        const miniW = this.touchUi ? 92 : 108;
        const mw = Math.round(
            WORLD_W * (big ? 340 / WORLD_W : miniW / WORLD_W),
        );
        const mh = Math.round(WORLD_H * (big ? 212 / WORLD_H : 68 / WORLD_H));
        const sx = mw / WORLD_W;
        const sy = mh / WORLD_H;
        const mx = big ? Math.round((VIEW_W - mw) / 2) : VIEW_W - mw - 8;
        const headH = big ? 20 : 0;
        // Mini map permanen di kanan bawah: tidak menutupi pintu, HUD, dan
        // tombol aksi bawah.
        const my = big
            ? Math.round((VIEW_H - mh - headH) / 2) + headH
            : VIEW_H - mh - 8;
        const lp = this.localPlayer();

        c.save();

        if (big) {
            // Redupkan dunia di belakang panel peta (mode "buka peta").
            c.fillStyle = 'rgba(2,6,23,0.55)';
            c.fillRect(0, 0, VIEW_W, VIEW_H);

            // Header panel: nama map + legenda.
            c.fillStyle = 'rgba(2,6,23,0.92)';
            c.fillRect(mx - 2, my - headH, mw + 4, headH);
            c.fillStyle = '#7dd3fc';
            c.font = '8px "Press Start 2P", monospace';
            c.fillText('PETA', mx + 6, my - 7);
            c.fillStyle = 'rgba(226,232,240,0.8)';
            c.font = '7px monospace';
            c.fillText(this.mapLabel(), mx + 62, my - 7);

            // Legenda kecil di ujung kanan header (rapi ke kiri).
            c.font = '6px monospace';
            let rx = mx + mw - 8;

            for (const item of [
                ['sasaran', '#facc15'],
                ['musuh', '#f87171'],
                ['kamu', '#ffffff'],
            ] as const) {
                const tw = c.measureText(item[0]).width;

                c.fillStyle = 'rgba(226,232,240,0.7)';
                c.fillText(item[0], rx - tw, my - 7);
                rx -= tw + 6;
                c.fillStyle = item[1];
                c.fillRect(rx - 3, my - 13, 3, 3);
                rx -= 9;
            }
        }

        // Slot peta: bayangan kemudian gambar dunia asli (piksel tajam).
        // Fase roam: peta kecil dibuat tembus pandang agar hero yang jalan
        // di bawah penokonya tetap terlihat.
        const ghost = !big && this.phase === 'roam';

        if (ghost) {
            c.globalAlpha = 0.42;
        }

        c.fillStyle = 'rgba(0,0,0,0.4)';
        c.fillRect(mx + 3, my + 3, mw, mh);

        if (snap) {
            c.fillStyle = '#020617';
            c.fillRect(mx, my, mw, mh);
            c.imageSmoothingEnabled = false;
            c.drawImage(snap, mx, my, mw, mh);
            // Sedikit gelapkan agar titik entitas lebih menonjol.
            c.fillStyle = 'rgba(2,6,23,0.18)';
            c.fillRect(mx, my, mw, mh);
        } else {
            const theme = MAPS[this.mapName];
            const bg = c.createLinearGradient(mx, my, mx, my + mh);

            bg.addColorStop(0, shade(theme.a, -26));
            bg.addColorStop(1, shade(theme.b, -34));
            c.fillStyle = bg;
            c.fillRect(mx, my, mw, mh);
        }

        if (ghost) {
            c.globalAlpha = 1;
        }

        // Grid petak halus (mode besar) kesan cetak biru.
        if (big) {
            c.strokeStyle = 'rgba(0,0,0,0.22)';
            c.lineWidth = 1;

            for (let gx = 16; gx < WORLD_W; gx += 16) {
                c.beginPath();
                c.moveTo(mx + gx * sx, my);
                c.lineTo(mx + gx * sx, my + mh);
                c.stroke();
            }

            for (let gy = 16; gy < WORLD_H; gy += 16) {
                c.beginPath();
                c.moveTo(mx, my + gy * sy);
                c.lineTo(mx + mw, my + gy * sy);
                c.stroke();
            }
        }

        // Bingkai.
        c.strokeStyle = big ? '#7dd3fc' : 'rgba(125,211,252,0.45)';
        c.lineWidth = big ? 2 : 1;
        c.strokeRect(mx - 1, my - 1, mw + 2, mh + 2);

        // Bidikan kamera saat ini.
        c.strokeStyle = 'rgba(56,189,248,0.95)';
        c.setLineDash([4, 3]);
        c.lineWidth = 1;
        c.strokeRect(
            mx + Math.max(0, Math.min(WORLD_W - VIEW_W, this.camX)) * sx,
            my + Math.max(0, Math.min(WORLD_H - VIEW_H, this.camY)) * sy,
            VIEW_W * sx,
            VIEW_H * sy,
        );
        c.setLineDash([]);

        const dot = (x: number, y: number, color: string, size = 2): void => {
            c.fillStyle = color;
            c.fillRect(
                mx + Math.round(x * sx) - (size >> 1),
                my + Math.round(y * sy) - (size >> 1),
                size,
                size,
            );
        };

        // Sasaran quest: ikon sesuai objek.
        for (const m of this.questMarkers) {
            if (m.done) {
                continue;
            }

            const qx = mx + m.x * sx;
            const qy = my + m.y * sy;

            if (big && m.kind === 'desk') {
                c.fillStyle = '#b45309';
                c.fillRect(qx - 3, qy - 2, 6, 4);
                c.fillStyle = '#fcd34d';
                c.fillRect(qx - 3, qy - 2, 6, 1);
            } else if (big && m.kind === 'book') {
                c.fillStyle = '#60a5fa';
                c.fillRect(qx - 2, qy - 3, 4, 6);
                c.fillStyle = 'rgba(255,255,255,0.7)';
                c.fillRect(qx - 2, qy - 3, 1, 6);
            } else if (big && m.kind === 'npc') {
                c.fillStyle = '#4ade80';
                c.beginPath();
                c.arc(qx, qy, 3, 0, Math.PI * 2);
                c.fill();
                c.fillStyle = '#14532d';
                c.fillRect(qx - 1, qy - 1, 2, 2);
            } else {
                dot(m.x, m.y, '#facc15', big ? 4 : 3);
            }

            // Tanda seru berkedip di sasaran (mode besar).
            if (big) {
                c.fillStyle = '#facc15';
                c.font = '7px monospace';
                c.textAlign = 'center';
                c.fillText('!', qx, qy - 5);
                c.textAlign = 'left';
            }
        }

        // Item di lantai & proyektil (mode besar).
        if (big) {
            for (const d of this.drops) {
                dot(d.x, d.y, '#67e8f9', 3);
            }

            for (const pr of this.projs) {
                dot(pr.x, pr.y, 'rgba(255,255,255,0.85)', 2);
            }
        }

        // Musuh: merah, boss oranye beri-ring.
        for (const e of this.enemies) {
            if (e.type === 'boss') {
                c.strokeStyle = '#fb923c';
                c.lineWidth = 1;
                c.strokeRect(mx + e.x * sx - 4.5, my + e.y * sy - 4.5, 9, 9);
                dot(e.x, e.y, '#fb923c', 4);
            } else {
                dot(e.x, e.y, '#f87171', big ? 3 : 2);
            }
        }

        // Party: titik warna hero; hero sendiri diberi ring putih.
        for (const p of this.players) {
            if (!p.alive) {
                continue;
            }

            const isMe = p === lp;
            dot(p.x, p.y, p.def.color, isMe ? (big ? 5 : 4) : big ? 4 : 3);

            if (isMe) {
                c.strokeStyle = '#ffffff';
                c.lineWidth = 1;

                const rs = big ? 5 : 3.5;

                c.strokeRect(
                    mx + p.x * sx - rs,
                    my + p.y * sy - rs,
                    rs * 2,
                    rs * 2,
                );
            } else if (big) {
                c.fillStyle = 'rgba(255,255,255,0.95)';
                c.font = '6px monospace';
                c.textAlign = 'center';
                c.fillText(
                    p.def.name.slice(0, 1),
                    mx + p.x * sx,
                    my + p.y * sy - 6,
                );
                c.textAlign = 'left';
            }
        }

        // Petunjuk tutup di bawah panel (mode besar).
        if (big) {
            c.fillStyle = 'rgba(148,163,184,0.8)';
            c.font = '6px monospace';
            c.textAlign = 'center';
            c.fillText(
                this.touchUi
                    ? 'ketuk PETA untuk menutup'
                    : 'tekan M untuk menutup',
                VIEW_W / 2,
                my + mh + 10,
            );
            c.textAlign = 'left';
        }

        c.restore();
    }

    private drawQuestWorld(c: CanvasRenderingContext2D): void {
        const bob = Math.sin(this.time * 4) * 3;

        for (const m of this.questMarkers) {
            if (m.done) {
                continue;
            }

            if (m.kind === 'book') {
                const bx = Math.round(m.x);
                const by = Math.round(m.y) + Math.round(bob / 2);
                c.fillStyle = 'rgba(0,0,0,0.3)';
                c.fillRect(bx - 4, by + 3, 8, 2);
                c.fillStyle = '#1d4ed8';
                c.fillRect(bx - 4, by - 3, 9, 6);
                c.fillStyle = '#93c5fd';
                c.fillRect(bx - 4, by - 3, 9, 1);
                c.fillStyle = '#ffffff';
                c.fillRect(bx - 2, by - 1, 4, 1);
                c.fillRect(bx - 2, by + 1, 2, 1);
                continue;
            }

            if (m.kind === 'npc') {
                const x = Math.round(m.x);
                const y = Math.round(m.y);
                c.fillStyle = 'rgba(0,0,0,0.35)';
                c.fillRect(x - 7, y - 1, 14, 3);
                // Sarung + baju + kepala + peci.
                c.fillStyle = '#14532d';
                c.fillRect(x - 6, y - 8, 12, 7);
                c.fillStyle = '#f5f5f5';
                c.fillRect(x - 6, y - 18, 12, 11);
                c.fillStyle = '#e5e5e5';
                c.fillRect(x - 6, y - 12, 3, 5);
                c.fillStyle = '#f5c99b';
                c.fillRect(x - 5, y - 26, 10, 8);
                c.fillStyle = '#111827';
                c.fillRect(x - 5, y - 30, 10, 5);
                c.fillStyle = 'rgba(255,255,255,0.25)';
                c.fillRect(x - 5, y - 30, 10, 1);
                c.fillStyle = '#0f172a';
                c.fillRect(x - 3, y - 24, 2, 3);
                c.fillRect(x + 2, y - 24, 2, 3);
                c.fillStyle = '#ffffff';
                c.fillRect(x - 3, y - 24, 1, 1);
                c.fillRect(x + 2, y - 24, 1, 1);
                // Papan nama.
                c.fillStyle = '#020617';
                c.fillRect(x - 26, y + 6, 52, 9);
                c.strokeStyle = '#facc15';
                c.lineWidth = 1;
                c.strokeRect(x - 26 + 0.5, y + 6 + 0.5, 51, 8);
                c.fillStyle = '#facc15';
                c.font = '6px monospace';
                c.textAlign = 'center';
                c.fillText('PAK SYAHID', x, y + 13);
            }

            if (m.kind === 'desk') {
                const bx = Math.round(m.x);
                const by = Math.round(m.y);
                c.fillStyle = 'rgba(255,255,255,0.85)';
                c.fillRect(bx - 5, by - 14, 10, 8);
                c.fillStyle = '#92400e';
                c.fillRect(bx - 5, by - 8, 10, 2);
            }

            // Tanda seru melayang + cincin ganda.
            const bx = Math.round(m.x);
            const by = Math.round(m.y) - 34 + Math.round(bob);
            c.fillStyle = '#0f172a';
            c.font = '11px monospace';
            c.textAlign = 'center';
            c.fillText('!', bx + 1, by + 1);
            c.fillStyle = '#facc15';
            c.fillText('!', bx, by);
            c.strokeStyle = 'rgba(250,204,21,0.85)';
            c.lineWidth = 2;
            c.beginPath();
            c.arc(bx, by + 9, 10 + Math.round(bob / 2), 0, Math.PI * 2);
            c.stroke();
            c.strokeStyle = 'rgba(250,204,21,0.3)';
            c.lineWidth = 1;
            c.beginPath();
            c.arc(bx, by + 9, 14 + Math.round(bob / 2), 0, Math.PI * 2);
            c.stroke();
        }

        c.textAlign = 'left';
    }

    private fadlanSheet: HTMLCanvasElement | null = null;
    private fadlanLoading = false;

    loadSprites(): void {
        if (
            this.fadlanSheet ||
            this.fadlanLoading ||
            typeof window === 'undefined'
        ) {
            return;
        }

        this.fadlanLoading = true;
        const img = new Image();

        img.onload = () => {
            this.fadlanSheet = this.keyOutBackground(img);
        };

        img.onerror = () => {
            this.fadlanLoading = false;
        };

        img.src = '/sprites/fadlan.jpg';
    }

    /** Hapus background papan catur via flood-fill dari tepi. */
    private keyOutBackground(img: HTMLImageElement): HTMLCanvasElement {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        const ctx = cv.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
            return cv;
        }

        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, w, h);
        const px = data.data;
        const isBg = (i: number): boolean => {
            const r = px[i];
            const g = px[i + 1];
            const b = px[i + 2];
            const mx = Math.max(r, g, b);
            const mn = Math.min(r, g, b);

            return mx > 165 && mx - mn < 30;
        };
        const seen = new Uint8Array(w * h);
        const stack: number[] = [];
        const push = (x: number, y: number): void => {
            if (x < 0 || y < 0 || x >= w || y >= h) {
                return;
            }

            const n = y * w + x;

            if (seen[n]) {
                return;
            }

            seen[n] = 1;

            if (isBg(n * 4)) {
                stack.push(n);
            }
        };

        for (let x = 0; x < w; x++) {
            push(x, 0);
            push(x, h - 1);
        }

        for (let y = 0; y < h; y++) {
            push(0, y);
            push(w - 1, y);
        }

        while (stack.length > 0) {
            const n = stack.pop() as number;
            px[n * 4 + 3] = 0;
            const x = n % w;
            const y = (n / w) | 0;
            push(x + 1, y);
            push(x - 1, y);
            push(x, y + 1);
            push(x, y - 1);
        }

        ctx.putImageData(data, 0, 0);

        return cv;
    }

    /** Latar dunia statis (lantai, dekor, tembok, furnitur map) — dipakai layar & peta. */
    /** Dekor fase roam: guru pemicu quest + sorotan pintu keluar. */
    /** Tirai lintasan lantai: luncur dari arah tujuan + nakas nama band. */
    private drawHallWipe(): void {
        if (this.hallWipeT <= 0) {
            return;
        }

        const c = this.ctx;
        const inD = 1.1;
        const outStart = 1.62;
        const outD = this.hallWipeDur - outStart;
        const t = Math.min(this.hallWipeDur, this.hallWipeT);
        const up = this.hallWipeDir > 0;
        const H = VIEW_H;

        // Panel gelap menyapu searah tangga: masuk 0..1.1, gelap penuh
        // 1.1..1.62 (teleport terjadi di sini), keluar 1.62..2.2.
        let cover: number;
        let tail: number;

        if (t <= inD) {
            cover = t / inD;
            tail = 0;
        } else if (t <= outStart) {
            cover = 1;
            tail = 0;
        } else {
            cover = 1;
            tail = Math.min(1, (t - outStart) / outD);
        }

        // Area tertutup:
        // naik → masuk [0..H*cover], keluar [H*tail..H];
        // turun → masuk [H-H*cover..H], keluar [0..H-H*tail].
        const yTop = tail <= 0 ? (up ? 0 : H - H * cover) : up ? H * tail : 0;
        const height = tail <= 0 ? H * cover : H - H * tail;

        c.fillStyle = 'rgba(2,6,23,0.72)';
        c.fillRect(0, yTop, VIEW_W, height);

        // Garis anak tangga bergulir ke arah gerak (kesan menginjak undak).
        c.save();
        c.beginPath();
        c.rect(0, yTop, VIEW_W, height);
        c.clip();
        c.strokeStyle = 'rgba(148,163,184,0.18)';
        c.lineWidth = 1;
        const stepH = 14;
        const roll = (t * 80) % stepH;

        for (
            let sy = up ? -roll : H + roll;
            sy < H + stepH && sy > -stepH;
            sy += up ? stepH : -stepH
        ) {
            c.beginPath();
            c.moveTo(0, Math.round(sy) + 0.5);
            c.lineTo(VIEW_W, Math.round(sy) + 0.5);
            c.stroke();
        }

        c.restore();

        // Tepi emas menyapu (tepi depan saat masuk, tepi belakang saat keluar).
        const edgeY =
            tail <= 0 ? (up ? yTop + height : yTop) : up ? yTop : yTop + height;

        c.fillStyle = 'rgba(250,204,21,0.5)';
        c.fillRect(0, Math.round(edgeY), VIEW_W, 2);

        // Nakas tengah muncul saat layar hampir tertutup, lalu memudar.
        const laExit = Math.max(0, Math.min(1, 1 - tail * 1.7));
        const la = laExit * Math.max(0, Math.min(1, (cover - 0.55) / 0.3));

        if (la > 0) {
            c.fillStyle = `rgba(15,23,42,${(la * 0.72).toFixed(3)})`;
            c.fillRect(VIEW_W / 2 - 130, VIEW_H / 2 - 32, 260, 54);
            c.fillStyle = `rgba(250,204,21,${(la * 0.6).toFixed(3)})`;
            c.fillRect(VIEW_W / 2 - 130, VIEW_H / 2 - 32, 260, 2);
            c.fillRect(VIEW_W / 2 - 130, VIEW_H / 2 + 20, 260, 2);
            c.fillStyle = `rgba(253,230,138,${la.toFixed(3)})`;
            c.font = 'bold 16px monospace';
            c.textAlign = 'center';
            c.fillText(this.hallWipeLabel, VIEW_W / 2, VIEW_H / 2 - 3);
            c.fillStyle = `rgba(148,163,184,${(la * 0.9).toFixed(3)})`;
            c.font = '7px monospace';
            c.fillText(
                up ? '▲ NAIK TANGGA ▲' : '▼ TURUN TANGGA ▼',
                VIEW_W / 2,
                VIEW_H / 2 + 16,
            );
            c.textAlign = 'left';
        }
    }

    private drawRoamWorld(c: CanvasRenderingContext2D): void {
        const bob = Math.sin(this.time * 4) * 3;

        // Sorotan pintu aktif di map ini.
        for (const d of ROAM_DOORS) {
            if (d.map !== this.mapName) {
                continue;
            }

            // Fasad gedung sekolah: jangan tempel kotak kuning permanen.
            // Sorotan hanya muncul saat pemain mendekati pintu.
            if (
                this.mapName === 'school' &&
                (d.label === 'GEDUNG A' || d.label === 'GEDUNG B')
            ) {
                const lp = this.localPlayer();
                const near =
                    !!lp &&
                    lp.x >= d.x1 - 8 &&
                    lp.x <= d.x2 + 8 &&
                    lp.y >= d.y1 - 8 &&
                    lp.y <= d.y2 + 16;

                if (!near) {
                    continue;
                }
            }

            const ay1 = d.artY1 ?? d.y1;
            const ay2 = d.artY2 ?? d.y2;
            // Ambang jalan: sorotnya di mulut pintu, bukan seluruh ruang.
            const bx1 = d.stroll ? d.x1 : (d.artX1 ?? d.x1);
            const bx2 = d.stroll ? d.x2 : (d.artX2 ?? d.x2);

            const cx = Math.round((bx1 + bx2) / 2);

            // Pintu lantai atas: tangga tipis dari strip jalan ke pintu.
            if (ay1 !== d.y1 && d.y1 > ay2) {
                c.fillStyle = 'rgba(250,204,21,0.18)';
                c.fillRect(cx - 5, ay2, 10, d.y1 - ay2);
                c.fillStyle = 'rgba(250,204,21,0.1)';
                c.fillRect(d.x1, d.y1, d.x2 - d.x1, d.y2 - d.y1);
            }

            // Zona tangga: jangan blok kuning penuh di atas anak tangga —
            // cukup garis putus-putus tipis biar undakan tetap kebaca.
            const isStair = d.label.startsWith('TANGGA');

            if (!isStair) {
                c.fillStyle = 'rgba(250,204,21,0.14)';
                c.fillRect(bx1, ay1, bx2 - bx1, ay2 - ay1);
            }

            c.strokeStyle = isStair
                ? 'rgba(250,204,21,0.55)'
                : 'rgba(250,204,21,0.8)';
            c.lineWidth = 1;

            if (isStair) {
                c.setLineDash([3, 3]);
            }

            c.strokeRect(bx1 + 0.5, ay1 + 0.5, bx2 - bx1 - 1, ay2 - ay1 - 1);
            c.setLineDash([]);

            // Gedung di halaman sudah punya papan nama permanen —
            // jangan tempel plang melayang di atas fasad.
            if (
                this.mapName === 'school' &&
                (d.label === 'GEDUNG A' || d.label === 'GEDUNG B')
            ) {
                continue;
            }

            // Pintu lantai atas: plang dipampang di bawah pintunya
            // supaya tidak kecil-kecil tabrak bar rumul di tepi atas.
            const by =
                (ay1 !== d.y1 ? ay2 + 3 : ay1 - 12) +
                Math.sin(this.time * 3) * 2;
            const pw = Math.min(58, d.label.length * 5 + 10);

            c.fillStyle = '#020617';
            c.fillRect(cx - pw / 2, by, pw, 9);
            c.strokeStyle = '#facc15';
            c.strokeRect(cx - pw / 2 + 0.5, by + 0.5, pw - 1, 8);
            c.fillStyle = '#facc15';
            c.font = '5px monospace';
            c.textAlign = 'center';
            c.fillText(d.label, cx, by + 7);
            c.textAlign = 'left';
        }

        if (this.mapName !== 'school') {
            return;
        }

        // Bu Sari: guru yang memegang tugas quest.
        const x = Math.round(this.guruPos.x);
        const y = Math.round(this.guruPos.y);

        c.fillStyle = 'rgba(0,0,0,0.3)';
        c.fillRect(x - 8, y - 1, 16, 3);
        c.fillStyle = '#1f2937';
        c.fillRect(x - 6, y - 4, 12, 4);
        c.fillStyle = '#7c3aed';
        c.fillRect(x - 6, y - 13, 12, 9);
        c.fillStyle = 'rgba(255,255,255,0.3)';
        c.fillRect(x - 6, y - 13, 12, 1);
        c.fillStyle = '#f5c99b';
        c.fillRect(x - 5, y - 20, 10, 7);
        c.fillStyle = '#111827';
        c.fillRect(x - 6, y - 23, 12, 4);
        c.fillStyle = '#0f172a';
        c.fillRect(x - 3, y - 17, 2, 2);
        c.fillRect(x + 2, y - 17, 2, 2);
        c.fillStyle = '#ffffff';
        c.fillRect(x - 3, y - 17, 1, 1);
        c.fillRect(x + 2, y - 17, 1, 1);
        // Papan nama.
        c.fillStyle = '#020617';
        c.fillRect(x - 30, y + 6, 60, 9);
        c.strokeStyle = '#facc15';
        c.strokeRect(x - 30 + 0.5, y + 6.5, 59, 8);
        c.fillStyle = '#facc15';
        c.font = '6px monospace';
        c.textAlign = 'center';
        c.fillText('BU SARI', x, y + 13);

        // Tombol E saat dekat, "!" saat belum didekati (fase roam saja).
        if (this.phase !== 'roam') {
            return;
        }

        const lp = this.players[this.localHero];

        c.textAlign = 'center';

        if (lp?.alive && dist(lp.x, lp.y, x, y) < 36) {
            if (!this.guruGiven) {
                c.fillStyle = '#020617';
                c.fillRect(x - 10, y - 42 + bob, 20, 11);
                c.strokeStyle = '#22d3ee';
                c.strokeRect(x - 10 + 0.5, y - 42 + bob + 0.5, 19, 10);
                c.fillStyle = '#22d3ee';
                c.font = '7px monospace';
                c.fillText('E', x, y - 34 + bob);
            }
        } else {
            c.fillStyle = '#facc15';
            c.font = 'bold 9px monospace';
            c.fillText('!', x, y - 28 + bob);
        }

        c.textAlign = 'left';
    }

    /** Isi area di luar peta (bidik kamera overscroll) supaya tidak void. */
    private paintFringe(c: CanvasRenderingContext2D): void {
        const M = PixelStoryGame.CAM_OVERSCROLL;
        const theme = MAPS[this.mapName];

        if (this.mapName === 'bug' || this.mapName === 'boss') {
            return;
        }

        // Hash deterministik: sama tiap frame, biar dekorasi tidak kelap.
        const hash = (x: number, y: number, k = 0): number => {
            const n = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453;

            return n - Math.floor(n);
        };

        // Kotak lantai seragam (kelas/lab/lorong) di keempat sisi.
        if (
            this.mapName === 'class' ||
            this.mapName === 'lab' ||
            hallInfo(this.mapName) !== null
        ) {
            const t = 16;

            for (let x = -M; x < WORLD_W + M; x += t) {
                for (let y = -M; y < WORLD_H + M; y += t) {
                    if (x >= 0 && x < WORLD_W && y >= 0 && y < WORLD_H) {
                        continue;
                    }

                    c.fillStyle = hash(x, y, 1) > 0.5 ? theme.a : theme.b;
                    c.fillRect(x, y, t, t);
                }
            }

            // Bidang tembok di batas terluar (ruangan terasa berlanjut).
            c.fillStyle = this.mapName === 'lab' ? '#0b1024' : '#77828f';
            c.fillRect(-M, -M, WORLD_W + M * 2, 5);
            c.fillRect(-M, -M, 5, WORLD_H + M * 2);
            c.fillRect(WORLD_W + M - 5, -M, 5, WORLD_H + M * 2);
            c.fillRect(-M, WORLD_H + M - 5, WORLD_W + M * 2, 5);

            if (this.mapName === 'lab') {
                // Sisa kabel LED menyala tercecer di pinggiran lab.
                for (let x = -M; x < WORLD_W + M; x += 22) {
                    for (let y = -M; y < WORLD_H + M; y += 22) {
                        if (x >= 0 && x < WORLD_W && y >= 0 && y < WORLD_H) {
                            continue;
                        }

                        if (hash(x, y, 4) > 0.88) {
                            c.fillStyle =
                                hash(x, y, 5) > 0.5 ? '#38bdf8' : '#f472b6';
                            c.fillRect(x + 6, y + 9, 4, 2);
                            c.fillStyle = 'rgba(56,189,248,0.25)';
                            c.fillRect(x + 5, y + 8, 6, 4);
                        }
                    }
                }
            }

            return;
        }

        // ===== Halaman sekolah: rumput + jalan terusan + pepohonan =====
        c.fillStyle = '#275936';
        c.fillRect(-M, -M, WORLD_W + M * 2, M);
        c.fillRect(-M, 0, M, WORLD_H);
        c.fillRect(WORLD_W, 0, M, WORLD_H);

        // Selatan: aspal jalan terusan dengan kerb.
        c.fillStyle = '#9aa3ad';
        c.fillRect(-M, WORLD_H, WORLD_W + M * 2, 3);
        c.fillStyle = '#3e4451';
        c.fillRect(-M, WORLD_H + 3, WORLD_W + M * 2, M - 3);

        for (let x = -M; x < WORLD_W + M; x += 60) {
            const h = hash(x, WORLD_H, 2);

            if (h > 0.45 && h < 0.6) {
                c.fillStyle = 'rgba(255,255,255,0.55)';
                c.fillRect(x, WORLD_H + 20, 22, 4);
            } else if (h > 0.85) {
                c.fillStyle = 'rgba(0,0,0,0.25)';
                c.fillRect(x + 8, WORLD_H + 30, 10, 6);
            } else if (h < 0.12) {
                c.fillStyle = '#565d68';
                c.fillRect(x + 20, WORLD_H + 40, 16, 16);
                c.fillStyle = '#2f3540';

                for (let d = 2; d < 16; d += 4) {
                    c.fillRect(x + 20, WORLD_H + 40 + d, 16, 2);
                }
            }
        }

        // Pohon & geblok deterministik di utara/barat/timur.
        const tree = (x: number, y: number): void => {
            c.fillStyle = '#5b3a1e';
            c.fillRect(x + 4, y + 10, 4, 12);
            c.fillStyle = '#2f6b3f';
            c.fillRect(x, y, 12, 14);
            c.fillStyle = '#3f8a52';
            c.fillRect(x + 1, y + 1, 10, 5);
            c.fillStyle = 'rgba(0,0,0,0.18)';
            c.fillRect(x, y + 12, 12, 2);
        };
        const bush = (x: number, y: number, k: number): void => {
            c.fillStyle = '#255230';
            c.fillRect(x + 2, y + 6, 12, 8);
            c.fillRect(x + 5, y + 3, 6, 14);
            c.fillStyle = '#3f8a52';
            c.fillRect(x + 4 + Math.round(k * 3), y + 4, 4, 3);
        };
        const flower = (x: number, y: number, k: number): void => {
            c.fillStyle = k > 0.5 ? '#facc15' : '#f9a8d4';
            c.fillRect(x + 8, y + 12, 3, 3);
            c.fillRect(x + 3, y + 16, 3, 3);
        };
        const cell = 34;

        for (let gx = -M; gx < WORLD_W + M; gx += cell) {
            for (let gy = -M; gy < WORLD_H + M; gy += cell) {
                // Selatan khusus aspal: sudah diisi di atas.
                if (gy >= WORLD_H - cell / 2) {
                    continue;
                }

                const h = hash(gx, gy, 3);

                if (h < 0.3) {
                    tree(gx + 4, gy + 6);
                } else if (h < 0.55) {
                    bush(gx + 5, gy + 8, h * 10);
                } else if (h < 0.72) {
                    flower(gx + 6, gy + 8, hash(gx, gy, 6));
                }
            }
        }

        // Pagar keliling di pinggiran sekolah.
        c.fillStyle = theme.fence;
        c.fillRect(-M + 1, -M + 1, 3, WORLD_H + M * 2 - 2);
        c.fillRect(WORLD_W + M - 4, -M + 1, 3, WORLD_H + M * 2 - 2);
        c.fillRect(-M + 1, -M + 1, WORLD_W + M * 2 - 2, 3);

        for (let px = -M; px < WORLD_W + M; px += 24) {
            c.fillStyle = '#3d5171';
            c.fillRect(px, -M + 1, 4, 7);
        }
    }

    private paintWorldBase(c: CanvasRenderingContext2D): void {
        const theme = MAPS[this.mapName];

        // Dasar lantai: gradasi arah vertikal untuk kesan kedalaman.
        const floor = c.createLinearGradient(0, 0, 0, WORLD_H);
        floor.addColorStop(0, shade(theme.a, 8));
        floor.addColorStop(0.5, theme.a);
        floor.addColorStop(1, shade(theme.b, -10));
        c.fillStyle = floor;
        c.fillRect(0, 0, WORLD_W, WORLD_H);

        const shadeA = shade(theme.a, 12);
        const shadeB = shade(theme.b, -14);

        for (let ty = 0; ty < WORLD_H; ty += 16) {
            for (let tx = 0; tx < WORLD_W; tx += 16) {
                const h = (((tx * 73856093) ^ (ty * 19349663)) >>> 0) % 1000;
                const pick = h % 5;
                // Variasi nuansa 3-4 tingkat biar tidak rata.
                c.fillStyle =
                    pick === 0
                        ? shadeA
                        : pick === 1
                          ? shadeB
                          : (tx + ty) % 48 === 0
                            ? theme.a
                            : theme.b;
                c.fillRect(tx, ty, 16, 16);

                // Bevel: highlight atas-kiri, bayangan bawah-kanan.
                c.fillStyle = 'rgba(255,255,255,0.09)';
                c.fillRect(tx, ty, 16, 1);
                c.fillRect(tx, ty, 1, 16);
                c.fillStyle = 'rgba(0,0,0,0.16)';
                c.fillRect(tx, ty + 15, 16, 1);
                c.fillRect(tx + 15, ty, 1, 16);

                // Bintik / kerikil deterministik.
                const dot = h % 7;

                if (dot < 3) {
                    c.fillStyle = 'rgba(0,0,0,0.12)';
                    c.fillRect(tx + 3 + (h % 9), ty + 4 + (h % 7), 2, 2);
                } else if (dot === 3) {
                    c.fillStyle = 'rgba(255,255,255,0.07)';
                    c.fillRect(tx + 6 + (h % 5), ty + 6 + (h % 5), 1, 1);
                }

                this.drawTileDetail(c, tx, ty, h, theme);
            }
        }

        // Dekorasi + bayangan lembut di bawahnya.
        for (const d of this.decor) {
            // Kelas & lorong: lantai dalam gedung, tanpa semak acak.
            if (this.mapName === 'class' || hallInfo(this.mapName) !== null) {
                continue;
            }

            c.fillStyle = 'rgba(0,0,0,0.2)';
            c.beginPath();
            c.ellipse(d.x + 2, d.y + 5, 5, 2, 0, 0, Math.PI * 2);
            c.fill();

            if (d.kind === 0) {
                c.fillStyle = theme.leaf;
                c.fillRect(d.x, d.y, 3, 5);
                c.fillRect(d.x - 2, d.y + 2, 7, 3);
                c.fillStyle = 'rgba(255,255,255,0.15)';
                c.fillRect(d.x - 2, d.y + 2, 7, 1);
            } else if (d.kind === 1) {
                c.fillStyle = theme.bloom;
                c.fillRect(d.x, d.y, 3, 3);
                c.fillStyle = theme.leaf;
                c.fillRect(d.x, d.y + 3, 3, 3);
            } else if (d.kind === 2) {
                c.fillStyle = theme.blob;
                c.fillRect(d.x - 3, d.y - 6, 12, 10);
                c.fillStyle = shade(theme.blob, 22);
                c.fillRect(d.x - 3, d.y - 6, 12, 3);
                c.fillStyle = theme.leaf;
                c.fillRect(d.x - 1, d.y - 4, 4, 4);
            } else {
                c.fillStyle = shade(theme.stone, -20);
                c.fillRect(d.x, d.y + 3, 6, 3);
                c.fillStyle = theme.stone;
                c.fillRect(d.x, d.y, 6, 4);
                c.fillStyle = shade(theme.stone, 30);
                c.fillRect(d.x, d.y, 6, 1);
            }
        }

        // Dinding pembatas ber-volume + bayangan ambien ke lantai.
        const wall = 8;
        c.fillStyle = theme.fence;
        c.fillRect(0, 0, WORLD_W, wall);
        c.fillRect(0, WORLD_H - wall, WORLD_W, wall);
        c.fillRect(0, 0, wall, WORLD_H);
        c.fillRect(WORLD_W - wall, 0, wall, WORLD_H);
        // Sisi atas dinding lebih terang (kesan 3D).
        c.fillStyle = 'rgba(255,255,255,0.14)';
        c.fillRect(0, 0, WORLD_W, 2);
        c.fillRect(0, WORLD_H - wall, WORLD_W, 2);
        c.fillRect(0, 0, 2, WORLD_H);
        c.fillStyle = 'rgba(0,0,0,0.25)';
        c.fillRect(0, wall - 2, WORLD_W, 2);
        c.fillRect(WORLD_W - wall, 0, 2, WORLD_H);

        const aoT = c.createLinearGradient(0, wall, 0, wall + 16);
        aoT.addColorStop(0, 'rgba(0,0,0,0.32)');
        aoT.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = aoT;
        c.fillRect(0, wall, WORLD_W, 16);

        const aoB = c.createLinearGradient(
            0,
            WORLD_H - wall,
            0,
            WORLD_H - wall - 16,
        );
        aoB.addColorStop(0, 'rgba(0,0,0,0.32)');
        aoB.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = aoB;
        c.fillRect(0, WORLD_H - wall - 16, WORLD_W, 16);

        const aoL = c.createLinearGradient(wall, 0, wall + 16, 0);
        aoL.addColorStop(0, 'rgba(0,0,0,0.32)');
        aoL.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = aoL;
        c.fillRect(wall, 0, 16, WORLD_H);

        const aoR = c.createLinearGradient(
            WORLD_W - wall,
            0,
            WORLD_W - wall - 16,
            0,
        );
        aoR.addColorStop(0, 'rgba(0,0,0,0.32)');
        aoR.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = aoR;
        c.fillRect(WORLD_W - wall - 16, 0, 16, WORLD_H);

        if (this.mapName === 'school') {
            this.drawSchool(c);
        }

        if (hallInfo(this.mapName) !== null) {
            this.drawHall(c);
        }

        if (this.mapName === 'class') {
            this.drawClassroom(c);
        }

        if (this.mapName === 'lab') {
            this.drawLab(c);
        }

        if (this.mapName === 'bug') {
            this.drawBug(c);
        }

        if (this.mapName === 'boss') {
            this.drawBoss(c);
        }
    }

    /** Pot tanaman: tumpu dekor kantor/ruang. */
    private drawPlantPot(
        c: CanvasRenderingContext2D,
        x: number,
        y: number,
    ): void {
        c.fillStyle = '#b45309';
        c.fillRect(x - 5, y, 10, 7);
        c.fillStyle = '#92610d';
        c.fillRect(x - 5, y, 10, 2);
        c.fillStyle = '#2f6b3f';
        c.fillRect(x - 4, y - 8, 8, 8);
        c.fillRect(x - 6, y - 5, 12, 4);
        c.fillStyle = '#3f8a52';
        c.fillRect(x - 2, y - 10, 5, 4);
        c.fillStyle = 'rgba(0,0,0,0.15)';
        c.fillRect(x - 5, y + 7, 10, 2);
    }

    /** Jendela dinding utara: sorot langit sore. */
    private drawWindow(
        c: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
    ): void {
        // Frame + rongga.
        c.fillStyle = '#6b7280';
        c.fillRect(x - 2, y - 2, w + 4, h + 4);
        c.fillStyle = '#93c5fd';
        c.fillRect(x, y, w, h);
        // Sorot langit: gradien atas terang.
        const sky = c.createLinearGradient(x, y, x, y + h);

        sky.addColorStop(0, '#dbeafe');
        sky.addColorStop(1, '#7dd3fc');
        c.fillStyle = sky;
        c.fillRect(x, y, w, h);
        // Penghalang tengah + 2 lajur.
        c.fillStyle = '#6b7280';
        c.fillRect(x + Math.floor(w / 2) - 1, y, 2, h);
        c.fillRect(x, y + Math.floor(h / 2) - 1, w, 2);
        // Kilau diagonal.
        c.fillStyle = 'rgba(255,255,255,0.35)';
        c.fillRect(x + 3, y + 2, 2, h - 4);
        // Ambang + bayangan bawah ke lantai.
        c.fillStyle = '#e5e7eb';
        c.fillRect(x - 2, y + h + 2, w + 4, 2);
        c.fillStyle = 'rgba(0,0,0,0.12)';
        c.fillRect(x - 4, y + h + 4, w + 8, 5);
    }

    /** LAB KOMPUTER: stasiun PC menyala, rak server, papan tulis. */
    private drawLab(c: CanvasRenderingContext2D): void {
        // Papan tulis putuh di dinding utara.
        c.fillStyle = '#6b7280';
        c.fillRect(238, 12, 164, 36);
        c.fillStyle = '#f8fafc';
        c.fillRect(242, 16, 156, 28);

        if (this.roomName) {
            c.fillStyle = '#1e3a8a';
            c.font = 'bold 7px monospace';
            c.textAlign = 'center';
            c.fillText(this.roomName, 320, 27);
            c.fillStyle = 'rgba(15,23,42,0.65)';
            c.font = '5px monospace';
            c.fillText(
                this.roomName.startsWith('PKL')
                    ? 'MAGANG PKL - SEMESTER GANJIL'
                    : 'KELAS X - XI - XII',
                320,
                37,
            );
            c.textAlign = 'left';
        } else {
            c.fillStyle = '#2563eb';
            c.fillRect(252, 24, 44, 3);
            c.fillRect(252, 31, 76, 3);
            c.fillStyle = '#ef4444';
            c.fillRect(252, 38, 30, 3);
            c.fillStyle = '#e5e7eb';
            c.fillRect(250, 44, 140, 3);
        }

        // Pintu keluar lab (dinding kiri).
        c.fillStyle = 'rgba(15,23,42,0.5)';
        c.fillRect(2, 40, 32, 50);
        c.fillStyle = '#7f4a23';
        c.fillRect(4, 42, 28, 46);
        c.fillStyle = '#a16207';
        c.fillRect(6, 44, 22, 40);
        c.fillStyle = '#fde68a';
        c.fillRect(24, 62, 3, 5);
        c.fillStyle = '#14532d';
        c.font = '5px monospace';
        c.textAlign = 'center';
        c.fillText('KELUAR', 18, 96);
        c.textAlign = 'left';

        // Lampu langit-langit: genangan cahaya di lantai.
        for (const [lx, ly] of [
            [180, 170],
            [460, 170],
            [180, 290],
            [460, 290],
        ] as const) {
            const pool = c.createRadialGradient(lx, ly, 4, lx, ly, 70);

            pool.addColorStop(0, 'rgba(255,255,240,0.10)');
            pool.addColorStop(1, 'rgba(255,255,240,0)');
            c.fillStyle = pool;
            c.beginPath();
            c.ellipse(lx, ly, 70, 34, 0, 0, Math.PI * 2);
            c.fill();
        }

        // 4 stasiun komputer (2 baris).
        const station = (x: number, y: number) => {
            // Meja.
            c.fillStyle = '#8b5a2b';
            c.fillRect(x, y, 92, 12);
            c.fillStyle = 'rgba(255,255,255,0.16)';
            c.fillRect(x, y, 92, 3);
            c.fillStyle = '#5f3d1e';
            c.fillRect(x + 3, y + 12, 5, 10);
            c.fillRect(x + 84, y + 12, 5, 10);
            // Monitor (menyala!).
            c.fillStyle = '#111827';
            c.fillRect(x + 18, y - 20, 30, 19);
            c.fillStyle = '#22d3ee';
            c.fillRect(x + 20, y - 18, 26, 14);
            c.fillStyle = 'rgba(255,255,255,0.5)';
            c.fillRect(x + 21, y - 17, 6, 12);
            c.fillStyle = '#374151';
            c.fillRect(x + 31, y - 5, 5, 4);
            // Keyboard + mouse.
            c.fillStyle = '#e5e7eb';
            c.fillRect(x + 12, y - 2, 26, 4);
            c.fillStyle = '#cbd5e1';
            c.fillRect(x + 42, y - 2, 7, 4);
            // Kursi kerjo.
            c.fillStyle = '#1e3a8a';
            c.fillRect(x + 30, y + 24, 26, 8);
            c.fillRect(x + 30, y + 30, 30, 4);
            c.fillStyle = '#111827';
            c.fillRect(x + 32, y + 34, 3, 6);
            c.fillRect(x + 51, y + 34, 3, 6);
            // Kabel ke dinding.
            c.strokeStyle = 'rgba(0,0,0,0.4)';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(x + 10, y + 12);
            c.bezierCurveTo(x - 8, y + 22, x + 2, y - 6, x - 2, y - 20);
            c.stroke();
        };
        station(96, 152);
        station(96, 266);
        station(436, 152);
        station(436, 266);

        // Rak server (kanan atas).
        c.fillStyle = '#1f2937';
        c.fillRect(588, 56, 30, 54);
        c.fillStyle = '#111827';
        c.fillRect(591, 59, 24, 4);
        c.fillRect(591, 66, 24, 4);
        c.fillStyle = '#4ade80';
        c.fillRect(593, 60, 2, 2);
        c.fillStyle = '#facc15';
        c.fillRect(601, 67, 2, 2);
        c.fillStyle = '#4ade80';
        c.fillRect(609, 60, 2, 2);
        c.fillRect(601, 61, 10, 2);
        c.fillStyle = '#0f172a';
        c.fillRect(591, 74, 24, 30);
        c.fillStyle = '#334155';

        for (let i = 0; i < 5; i++) {
            c.fillRect(593, 76 + i * 6, 20, 3);
        }

        // Pot bunga & tempat sampah.
        this.drawPlantPot(c, 20, 60);
        this.drawPlantPot(c, 620, 260);
        c.fillStyle = '#6b7280';
        c.fillRect(556, 140, 14, 16);
        c.fillStyle = '#9ca3af';
        c.fillRect(554, 138, 18, 3);

        // Jehan kabel di lantai.
        c.fillStyle = 'rgba(0,0,0,0.14)';
        c.fillRect(0, 118, WORLD_W - 40, 3);
        c.fillRect(WORLD_W - 52, 118, 3, 170);
    }

    /** DIMENSI BUG: tanah retak memudar & pecahan kode. */
    private drawBug(c: CanvasRenderingContext2D): void {
        // Genangan kehampaan.
        for (const [vx, vy, vw, vh] of [
            [120, 120, 90, 24],
            [420, 220, 110, 30],
            [230, 320, 70, 20],
            [520, 90, 60, 18],
        ] as const) {
            c.fillStyle = 'rgba(2,0,10,0.88)';
            c.beginPath();
            c.ellipse(
                vx + vw / 2,
                vy + vh / 2,
                vw / 2,
                vh / 2,
                0,
                0,
                Math.PI * 2,
            );
            c.fill();
            c.strokeStyle = 'rgba(217,70,239,0.5)';
            c.lineWidth = 1;
            c.stroke();
            // Pecahan matrix di dalam rongga.
            c.fillStyle = 'rgba(34,211,238,0.55)';

            for (let i = 0; i < 4; i++) {
                c.fillRect(
                    vx + ((i * 17) % (vw - 8)) + 4,
                    vy + 4 + ((i * 9) % Math.max(1, vh - 8)),
                    2,
                    5,
                );
            }
        }

        // Kolom hujan kode (statis).
        for (let i = 0; i < 10; i++) {
            const x = 24 + ((i * 103) % (WORLD_W - 60));
            const yy = 30 + ((i * 71) % (WORLD_H - 80));

            c.fillStyle = 'rgba(74,222,128,0.25)';

            for (let k = 0; k < 5; k++) {
                c.fillRect(x, yy + k * 4, 2, 3);
            }
        }

        // Fragmen "pipa rusak" berjajar kiri-kanan (tembok korupsi).
        c.fillStyle = 'rgba(217,70,239,0.35)';
        c.fillRect(10, 200, 26, 5);
        c.fillRect(604, 260, 26, 5);
        c.fillStyle = 'rgba(34,211,238,0.35)';
        c.fillRect(12, 236, 5, 26);
        c.fillRect(626, 180, 5, 26);
    }

    /** ARENA RAJA: pilar batu, bendera merah, bekas bakan. */
    private drawBoss(c: CanvasRenderingContext2D): void {
        const pillar = (x: number, y: number) => {
            // Bayangan.
            c.fillStyle = 'rgba(0,0,0,0.3)';
            c.fillRect(x - 3, y + 26, 26, 4);
            // Batang batu.
            c.fillStyle = '#52525b';
            c.fillRect(x - 4, y - 22, 22, 48);
            c.fillStyle = '#71717a';
            c.fillRect(x - 4, y - 22, 22, 4);
            c.fillStyle = '#3f3f46';
            c.fillRect(x + 10, y - 22, 8, 48);
            // Bahu + retak.
            c.fillStyle = '#71717a';
            c.fillRect(x - 6, y - 26, 26, 6);
            c.strokeStyle = '#27272a';
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(x + 2, y - 18);
            c.lineTo(x + 6, y - 6);
            c.lineTo(x + 2, y + 12);
            c.stroke();
            // Bendera merah.
            c.fillStyle = '#9ca3af';
            c.fillRect(x + 20, y - 46, 2, 22);
            c.fillStyle = '#dc2626';
            c.beginPath();
            c.moveTo(x + 22, y - 44);
            c.lineTo(x + 40, y - 39);
            c.lineTo(x + 22, y - 30);
            c.closePath();
            c.fill();
        };
        pillar(112, 100);
        pillar(512, 100);
        pillar(112, 288);
        pillar(512, 288);

        // Ambal bakan di lantai.
        for (const [sx, sy, r] of [
            [320, 210, 60],
            [180, 330, 40],
            [470, 170, 44],
        ] as const) {
            const scorch = c.createRadialGradient(sx, sy, 2, sx, sy, r);

            scorch.addColorStop(0, 'rgba(10,6,4,0.55)');
            scorch.addColorStop(1, 'rgba(10,6,4,0)');
            c.fillStyle = scorch;
            c.beginPath();
            c.ellipse(sx, sy, r, r * 0.6, 0, 0, Math.PI * 2);
            c.fill();
        }

        // Bendera besar dinding utara.
        c.fillStyle = '#27272a';
        c.fillRect(232, 8, 176, 22);
        c.fillStyle = '#991b1b';
        c.fillRect(238, 12, 164, 14);
        c.fillStyle = '#facc15';
        c.fillRect(238, 12, 164, 2);
        c.fillStyle = '#fde047';
        c.fillRect(296, 16, 6, 6);
        c.fillRect(312, 16, 6, 6);
    }

    /** Band (0 = lantai 1 ... 5 = rooftop) dari titik y. */
    private hallRoomAt(
        x: number,
        y: number,
    ): (typeof ROAM_DOORS)[number] | null {
        return (
            ROAM_DOORS.find(
                (d) =>
                    d.map === this.mapName &&
                    d.stroll === true &&
                    d.room !== '' &&
                    x >= (d.artX1 ?? d.x1) &&
                    x <= (d.artX2 ?? d.x2) &&
                    y >= d.y1 - 168 &&
                    y <= d.y1 - 4,
            ) ?? null
        );
    }

    /** Apakah x mengenai mulut pintu salah satu ruang lantai ini. */
    private hallSpanAt(x: number): boolean {
        return ROAM_DOORS.some(
            (d) =>
                d.map === this.mapName &&
                d.stroll === true &&
                d.room !== '' &&
                d.y1 === HALL_ROOM_Y0 + 168 &&
                x >= d.x1 &&
                x <= d.x2,
        );
    }

    /** Saran bar sesuai posisi (ruang/lantai/tangga/lobbi). */
    private hallHint(): string {
        const lp = this.players[this.localHero];
        const info = hallInfo(this.mapName);

        if (!lp || !info) {
            return 'LORONG GEDUNG';
        }

        if (info.roof) {
            return 'ROOFTOP — turun lewat pintu tangga di ujung timur';
        }

        if (this.roomName) {
            return `${this.roomName} — jalan ke pintu untuk keluar`;
        }

        if (info.floor === info.floors) {
            return info.bld === 'B'
                ? `LANTAI ${info.floor} — naik ke rooftop lewat ruang tangga di ujung lorong`
                : `LANTAI ${info.floor} — turun lewat ruang tangga di ujung lorong`;
        }

        if (info.floor === 1) {
            return `LORONG GEDUNG ${info.bld} — masuk ruang, naik lewat ruang tangga di ujung lorong, keluar lewat pintu barat`;
        }

        return `LANTAI ${info.floor} — naik/turun lewat ruang tangga di ujung lorong`;
    }

    /** Chip ruangan mengikuti posisi hero (ruang/lantai/rooftop). */
    private hallZone(x: number, y: number): string {
        const r = this.hallRoomAt(x, y);

        if (r) {
            return r.room;
        }

        const info = hallInfo(this.mapName);

        if (!info) {
            return '';
        }

        if (info.roof) {
            return 'ROOFTOP';
        }

        return info.floor > 1 ? `LANTAI ${info.floor}` : '';
    }

    private updateHallChip(): void {
        const lp = this.players[this.localHero];

        if (!lp) {
            return;
        }

        const want = this.hallZone(Math.round(lp.x), Math.round(lp.y));

        if (want !== this.roomName) {
            this.roomName = want;
        }
    }

    /** Satu map = satu lantai: baris ruang + koridor + tangga + lobbi. */
    private drawHall(c: CanvasRenderingContext2D): void {
        const rn = (x: number): number =>
            (Math.imul(x, 2654435761) >>> 16) % 1000;

        // Seret tekstur halus biar warna polos tidak mati (feel 3D/HD).
        const grain = (
            x: number,
            y: number,
            w: number,
            h: number,
            al: number,
        ): void => {
            const n = Math.max(2, ((w * h) / 22) | 0);

            for (let i = 0; i < n; i++) {
                c.fillStyle = `rgba(15,23,42,${al})`;
                c.fillRect(
                    x + (rn(i * 37 + x * 5 + y * 3) % w),
                    y + (rn(i * 53 + y * 7 + x * 11) % h),
                    1,
                    1,
                );
            }
        };

        // Lantai per petak: serat, bevel, dan bintik.
        const floorT = (
            x: number,
            y: number,
            w: number,
            h: number,
            tA: string,
            tB: string,
            ts: number,
        ): void => {
            for (let ty = y; ty < y + h; ty += ts) {
                for (let tx = x; tx < x + w; tx += ts) {
                    const hh = rn(tx * 13 + ty * 71);

                    c.fillStyle = hh % 6 === 0 ? tB : tA;
                    c.fillRect(tx, ty, ts, ts);
                    c.fillStyle = 'rgba(255,255,255,0.055)';
                    c.fillRect(tx, ty, ts, 1);
                    c.fillRect(tx, ty, 1, ts);
                    c.fillStyle = 'rgba(15,23,42,0.09)';
                    c.fillRect(tx, ty + ts - 1, ts, 1);
                    c.fillRect(tx + ts - 1, ty, 1, ts);

                    if (hh % 5 === 0) {
                        c.fillStyle = 'rgba(15,23,42,0.1)';
                        c.fillRect(
                            tx + 3 + (hh % (ts - 5)),
                            ty + 4 + (hh % (ts - 6)),
                            2,
                            1,
                        );
                    }
                }
            }
        };

        // Dinding interior: panel, alur, gelundung & skirting.
        const wall = (x: number, y: number, w: number, h: number): void => {
            c.fillStyle = '#cfd8e5';
            c.fillRect(x, y, w, h);
            c.fillStyle = '#e8eef6';
            c.fillRect(x, y, w, 2);
            c.fillStyle = '#b4bfd0';
            c.fillRect(x, y + Math.max(4, h - 3), w, 3);
            c.fillStyle = 'rgba(15,23,42,0.12)';

            for (let px = x + 20; px < x + w - 16; px += 44) {
                c.fillRect(px, y + 3, 1, h - 6);
            }

            grain(x, y, w, h, 0.05);
        };

        // Bayangan ambience di dasar dinding (AO tipis).
        const aoFloor = (x: number, y: number, w: number, h: number): void => {
            c.fillStyle = 'rgba(15,23,42,0.10)';
            c.fillRect(x, y, w, h);
        };

        // Meja murid kayu + kursi di belakangnya.
        const desk = (x: number, y: number, w: number): void => {
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(x, y + 12, w, 2);
            // Kursi
            c.fillStyle = '#3f3a35';
            c.fillRect(x + 2, y - 14, 10, 5);
            c.fillStyle = '#2c2823';
            c.fillRect(x + 3, y - 9, 8, 2);
            // Badan meja
            c.fillStyle = '#a97b4a';
            c.fillRect(x, y, w, 10);
            c.fillStyle = '#c99561';
            c.fillRect(x, y, w, 3);
            c.fillStyle = '#7c4f24';
            c.fillRect(x, y + 9, w, 2);
            c.fillStyle = '#6b431d';
            c.fillRect(x + 1, y + 11, 2, 3);
            c.fillRect(x + w - 3, y + 11, 2, 3);
            grain(x, y, w, 11, 0.06);
        };

        // Meja guru: lemari kayu + monitor + buku.
        const teach = (x: number, y: number): void => {
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(x + 1, y + 15, 28, 3);
            c.fillStyle = '#8b5a2b';
            c.fillRect(x, y, 30, 13);
            c.fillStyle = '#a97b4a';
            c.fillRect(x, y, 30, 4);
            c.fillStyle = '#6b431d';
            c.fillRect(x + 1, y + 12, 28, 3);
            // Monitor
            c.fillStyle = '#0f172a';
            c.fillRect(x + 5, y - 9, 13, 9);
            c.fillStyle = '#60a5fa';
            c.fillRect(x + 6, y - 8, 11, 7);
            c.fillStyle = 'rgba(255,255,255,0.35)';
            c.fillRect(x + 6, y - 8, 11, 2);
            c.fillStyle = '#334155';
            c.fillRect(x + 10, y + 0, 3, 2);
            // Tumpukan buku
            c.fillStyle = '#b91c1c';
            c.fillRect(x + 20, y - 5, 8, 2);
            c.fillStyle = '#166534';
            c.fillRect(x + 21, y - 3, 7, 3);
            grain(x, y, 30, 13, 0.06);
        };

        // Papan tulis berbingkai + tulisan tangan & selembar kertas.
        const board = (
            x: number,
            y: number,
            w: number,
            h: number,
            wide: boolean,
        ): void => {
            c.fillStyle = '#9aa5b3';
            c.fillRect(x, y, w, h);
            c.fillStyle = '#f7f8fa';
            c.fillRect(x + 3, y + 3, w - 6, h - 6);
            c.fillStyle = 'rgba(30,58,95,0.5)';

            if (wide) {
                c.fillRect(x + 8, y + h / 2 - 2, w / 3, 2);
                c.fillRect(x + 8, y + h / 2 + 3, w / 2 - 10, 2);
                c.fillStyle = 'rgba(185,28,28,0.65)';
                c.fillRect(x + w / 2 + 2, y + h / 2 - 2, w / 4, 2);
            } else {
                c.fillRect(x + 6, y + 4, w - 16, 2);
                c.fillRect(x + 6, y + 9, w - 26, 2);
            }

            // Nampan marker + peta ditempel.
            c.fillStyle = '#64748b';
            c.fillRect(x + 4, y + h, w - 8, 2);
            c.fillStyle = '#fde68a';
            c.fillRect(x + w - 10, y + 2, 6, 6);
            c.fillStyle = 'rgba(15,23,42,0.08)';
            c.fillRect(x + w - 10, y + 4, 6, 1);
            grain(x + 3, y + 3, w - 6, h - 6, 0.03);
        };

        // Tanaman hias: pot berhias + kelopak bertingkat.
        const plant = (x: number, y: number): void => {
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(x - 2, y + 16, 20, 3);
            c.fillStyle = '#b45309';
            c.fillRect(x, y + 6, 16, 12);
            c.fillStyle = '#d97706';
            c.fillRect(x, y + 6, 16, 3);
            c.fillStyle = '#92400e';
            c.fillRect(x, y + 15, 16, 3);
            c.fillStyle = '#2f6b3f';
            c.fillRect(x + 2, y - 12, 12, 20);
            c.fillRect(x - 1, y - 7, 6, 16);
            c.fillRect(x + 11, y - 9, 6, 15);
            c.fillStyle = '#3f8a52';
            c.fillRect(x + 4, y - 10, 8, 8);
            c.fillRect(x, y - 5, 5, 6);
            c.fillRect(x + 11, y - 6, 5, 6);
            c.fillStyle = '#57a76b';
            c.fillRect(x + 5, y - 9, 4, 4);
        };

        // Loker berventilasi dengan tag kuning.
        const loker = (x: number, y: number, n: number): void => {
            for (let k = 0; k < n; k++) {
                const lx = x + k * 26;

                c.fillStyle = 'rgba(15,23,42,0.16)';
                c.fillRect(lx - 2, y + 26, 30, 2);
                c.fillStyle = '#3f4756';
                c.fillRect(lx, y, 24, 28);
                c.fillStyle = '#596271';
                c.fillRect(lx, y, 24, 2);
                c.fillStyle = '#2f3644';
                c.fillRect(lx + 1, y + 14, 22, 1);
                c.fillStyle = '#64748b';

                for (let v = 0; v < 3; v++) {
                    c.fillRect(lx + 5, y + 4 + v * 3, 14, 1);
                }

                c.fillStyle = '#fbbf24';
                c.fillRect(lx + 18, y + 20, 3, 3);
                c.fillStyle = '#94a3b8';
                c.fillRect(lx + 2, y + 1, 3, 8);
            }
        };

        // Bangku tunggu berbingkai kayu.
        const bench = (x: number, y: number): void => {
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(x + 1, y + 13, 36, 2);
            c.fillStyle = '#976a3d';
            c.fillRect(x, y, 38, 6);
            c.fillStyle = '#b48450';
            c.fillRect(x, y, 38, 2);
            c.fillStyle = '#5c3a1c';
            c.fillRect(x + 2, y + 6, 3, 6);
            c.fillRect(x + 33, y + 6, 3, 6);
            grain(x, y, 38, 8, 0.06);
        };

        // Tempat sampah membulat.
        const bin = (x: number, y: number): void => {
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(x - 6, y + 5, 12, 2);
            c.fillStyle = '#55606f';
            c.beginPath();
            c.arc(x, y, 6, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#7b8797';
            c.beginPath();
            c.arc(x - 1, y - 1, 4, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#3d4653';
            c.fillRect(x - 5, y - 3, 2, 6);
        };

        // Meja bundar kantin + 4 bangku.
        const tableRound = (x: number, y: number): void => {
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.beginPath();
            c.ellipse(x, y + 11, 13, 4, 0, 0, Math.PI * 2);
            c.fill();

            for (const [dx, dy] of [
                [-13, 0],
                [13, 0],
                [0, -13],
                [0, 13],
            ] as const) {
                c.fillStyle = 'rgba(15,23,42,0.18)';
                c.beginPath();
                c.ellipse(x + dx, y + dy + 3, 4, 2, 0, 0, Math.PI * 2);
                c.fill();
                c.fillStyle = '#8a5a2e';
                c.beginPath();
                c.arc(x + dx, y + dy, 4, 0, Math.PI * 2);
                c.fill();
                c.fillStyle = '#b07a3e';
                c.beginPath();
                c.arc(x + dx - 1, y + dy - 1, 2.5, 0, Math.PI * 2);
                c.fill();
            }

            c.fillStyle = '#b98a52';
            c.beginPath();
            c.arc(x, y, 11, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#e0c093';
            c.beginPath();
            c.arc(x, y, 9, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = 'rgba(255,255,255,0.35)';
            c.beginPath();
            c.arc(x - 3, y - 3, 4, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#f8fafc';
            c.fillRect(x - 2, y - 2, 4, 4);
        };

        // Rak buku: deret punggung buku warna-warni.
        const bookShelf = (
            x: number,
            y: number,
            w: number,
            h: number,
        ): void => {
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(x + 1, y + 2, w, h);
            c.fillStyle = '#5b3a1e';
            c.fillRect(x, y, w, h);
            c.fillStyle = '#3f2a17';
            c.fillRect(x + 1, y + 1, w - 2, h - 2);

            const palette = [
                '#b91c1c',
                '#1d4ed8',
                '#047857',
                '#b45309',
                '#7c3aed',
                '#0e7490',
                '#be185d',
                '#a16207',
            ];

            for (let ry = y + 2, row = 0; ry < y + h - 4; ry += 9, row++) {
                c.fillStyle = '#6b431d';
                c.fillRect(x + 1, ry + 7, w - 2, 2);

                for (let bx = x + 3, k = 0; bx < x + w - 2; bx += 3, k++) {
                    c.fillStyle = palette[(k * 5 + row * 3) % palette.length];
                    c.fillRect(bx, ry, 2, 7);

                    if ((k + row) % 4 === 0) {
                        c.fillStyle = 'rgba(255,255,255,0.35)';
                        c.fillRect(bx, ry, 2, 1);
                    }
                }
            }
        };

        // Sajadah dengan motif mihrab.
        const prayerRug = (
            x: number,
            y: number,
            w: number,
            h: number,
            edge: string,
            face: string,
        ): void => {
            c.fillStyle = 'rgba(15,23,42,0.12)';
            c.fillRect(x + 1, y + 1, w, h);
            c.fillStyle = edge;
            c.fillRect(x, y, w, h);
            c.fillStyle = face;
            c.fillRect(x + 1, y + 1, w - 2, h - 2);
            c.strokeStyle = edge;
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(x + 4, y + h - 4);
            c.lineTo(x + 4, y + 8);
            c.arc(x + w / 2, y + 8, (w - 8) / 2, Math.PI, 0);
            c.lineTo(x + w - 4, y + h - 4);
            c.stroke();
            c.fillStyle = 'rgba(255,255,255,0.35)';
            c.fillRect(x + 2, y + 2, w - 4, 1);
        };

        // Palang merah UKS.
        const redCross = (x: number, y: number, k = 1): void => {
            c.fillStyle = '#dc2626';
            c.fillRect(x - k, y - 3 * k, 3 * k, 7 * k);
            c.fillRect(x - 3 * k, y - k, 7 * k, 3 * k);
        };

        // Lemari logam dua pintu.
        const cabinet = (
            x: number,
            y: number,
            w: number,
            h: number,
            tone = '#dbe3ee',
        ): void => {
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(x + 2, y + h, w, 2);
            c.fillStyle = tone;
            c.fillRect(x, y, w, h);
            c.fillStyle = 'rgba(255,255,255,0.7)';
            c.fillRect(x, y, w, 2);
            c.fillStyle = 'rgba(15,23,42,0.18)';
            c.fillRect(x + w / 2, y + 2, 1, h - 4);
            c.fillStyle = '#64748b';
            c.fillRect(x + w / 2 - 4, y + h / 2, 2, 4);
            c.fillRect(x + w / 2 + 2, y + h / 2, 2, 4);
        };

        // Kantin: meja saji, etalase, meja bundar.
        const drawKantin = (a1: number, a2: number): void => {
            const w = a2 - a1;

            floorT(a1, yb, w, 164, '#efe1c6', '#f7ecd9', 14);
            grain(a1, yb, w, 164, 0.04);

            // Plang KANTIN di dinding utara.
            c.fillStyle = '#1f2937';
            c.fillRect(a1 + w / 2 - 25, yb + 3, 50, 11);
            c.fillStyle = '#fbbf24';
            c.font = 'bold 7px monospace';
            c.textAlign = 'center';
            c.fillText('KANTIN', a1 + w / 2, yb + 11);
            c.textAlign = 'left';

            // Meja saji panjang + etalase kaca.
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(a1 + 11, yb + 54, 78, 2);
            c.fillStyle = '#7c4a21';
            c.fillRect(a1 + 10, yb + 34, 78, 42);
            c.fillStyle = '#a97b4a';
            c.fillRect(a1 + 11, yb + 35, 76, 40);

            // Etalase kaca (di belakang meja saji).
            c.fillStyle = '#334155';
            c.fillRect(a1 + 14, yb + 20, 70, 16);
            c.fillStyle = 'rgba(191,225,245,0.9)';
            c.fillRect(a1 + 16, yb + 22, 66, 12);
            c.fillStyle = 'rgba(255,255,255,0.55)';
            c.fillRect(a1 + 17, yb + 23, 64, 3);

            const foods = [
                '#f59e0b',
                '#dc2626',
                '#84cc16',
                '#f97316',
                '#eab308',
            ];

            for (let i = 0; i < 8; i++) {
                c.fillStyle = foods[i % foods.length];
                c.fillRect(a1 + 20 + i * 8, yb + 28, 5, 4);
                c.fillStyle = 'rgba(15,23,42,0.25)';
                c.fillRect(a1 + 20 + i * 8, yb + 32, 5, 1);
            }

            // Permukaan meja saji + nampan.
            c.fillStyle = '#e2c295';
            c.fillRect(a1 + 12, yb + 36, 74, 6);
            c.fillStyle = 'rgba(255,255,255,0.45)';
            c.fillRect(a1 + 12, yb + 36, 74, 2);

            for (let i = 0; i < 4; i++) {
                c.fillStyle = '#94a3b8';
                c.fillRect(a1 + 18 + i * 17, yb + 45, 11, 3);
                c.fillStyle = 'rgba(56,189,248,0.7)';
                c.fillRect(a1 + 20 + i * 17, yb + 42, 3, 3);
            }

            // Papan menu di kanan.
            c.fillStyle = '#0f172a';
            c.fillRect(a1 + w - 38, yb + 22, 26, 30);
            c.fillStyle = '#fde047';
            c.font = '4px monospace';
            c.textAlign = 'center';
            c.fillText('MENU', a1 + w - 25, yb + 27);
            c.fillStyle = '#e2e8f0';
            c.fillRect(a1 + w - 34, yb + 32, 18, 1);
            c.fillRect(a1 + w - 34, yb + 37, 18, 1);
            c.fillRect(a1 + w - 34, yb + 42, 14, 1);
            c.fillRect(a1 + w - 34, yb + 47, 16, 1);
            c.textAlign = 'left';

            // Kulkas minuman di timur.
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(a2 - 19, yb + 105, 14, 2);
            c.fillStyle = '#dbe3ee';
            c.fillRect(a2 - 20, yb + 84, 16, 36);
            c.fillStyle = '#f8fafc';
            c.fillRect(a2 - 19, yb + 85, 14, 34);
            c.fillStyle = 'rgba(56,189,248,0.55)';
            c.fillRect(a2 - 17, yb + 88, 10, 18);
            c.fillStyle = '#475569';
            c.fillRect(a2 - 18, yb + 108, 12, 2);
            c.fillStyle = '#2563eb';
            c.fillRect(a2 - 17, yb + 113, 10, 4);

            // Meja bundar.
            tableRound(a1 + 30, yb + 116);
            tableRound(a1 + 96, yb + 116);
            tableRound(a1 + 63, yb + 148);

            plant(a1 + 8, yb + 142);
            bin(a1 + w - 12, yb + 158);

            aoFloor(a1, yb + 162, w, 2);
        };

        // Musholla: mihrab, sajadah, rak Al-Quran.
        const drawMusholla = (a1: number, a2: number): void => {
            const w = a2 - a1;
            const mx = a1 + w / 2;

            floorT(a1, yb, w, 164, '#dfe8dd', '#e9f0e5', 16);
            grain(a1, yb, w, 164, 0.04);

            // Karpet area salat.
            c.fillStyle = '#cfe0cd';
            c.fillRect(a1 + 8, yb + 62, w - 16, 110);
            c.fillStyle = 'rgba(255,255,255,0.18)';
            c.fillRect(a1 + 8, yb + 62, w - 16, 2);

            // Mihrab di dinding utara.
            c.fillStyle = '#14532d';
            c.fillRect(mx - 26, yb + 4, 52, 46);
            c.fillStyle = '#166534';
            c.fillRect(mx - 23, yb + 6, 46, 42);
            c.fillStyle = '#052e16';
            c.beginPath();
            c.moveTo(mx - 16, yb + 44);
            c.lineTo(mx - 16, yb + 24);
            c.arc(mx, yb + 24, 16, Math.PI, 0);
            c.lineTo(mx + 16, yb + 44);
            c.closePath();
            c.fill();
            c.strokeStyle = '#fbbf24';
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(mx - 18, yb + 44);
            c.lineTo(mx - 18, yb + 24);
            c.arc(mx, yb + 24, 18, Math.PI, 0);
            c.lineTo(mx + 18, yb + 44);
            c.stroke();
            c.fillStyle = '#fde68a';
            c.fillRect(mx - 1, yb + 22, 2, 6);

            // Plang kecil di kiri dinding utara.
            c.fillStyle = '#1f2937';
            c.fillRect(a1 + 6, yb + 4, 34, 10);
            c.fillStyle = '#a7f3d0';
            c.font = '4px monospace';
            c.textAlign = 'center';
            c.fillText('MUSHOLLA', a1 + 23, yb + 11);
            c.textAlign = 'left';

            // Sajadah 2 x 3.
            const rugW = 24;
            const rugH = 32;
            const gapX = 6;
            const gapY = 10;
            const startX = mx - (rugW * 3 + gapX * 2) / 2;

            for (let row = 0; row < 2; row++) {
                for (let col = 0; col < 3; col++) {
                    prayerRug(
                        startX + col * (rugW + gapX),
                        yb + 74 + row * (rugH + gapY),
                        rugW,
                        rugH,
                        '#2f6b3f',
                        row % 2 === 0 ? '#f4efe0' : '#efe9d6',
                    );
                }
            }

            // Rak Al-Quran di timur.
            bookShelf(a2 - 18, yb + 72, 14, 54);

            // Rak sandal dekat pintu.
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(a1 + 12, yb + 158, 34, 2);
            c.fillStyle = '#6b431d';
            c.fillRect(a1 + 11, yb + 148, 36, 10);
            c.fillStyle = '#8a5c2c';

            for (let i = 0; i < 3; i++) {
                c.fillRect(a1 + 14 + i * 11, yb + 150, 7, 3);
                c.fillRect(a1 + 15 + i * 11, yb + 153, 5, 2);
            }

            // Partisi kayu di barat (area jamaah perempuan).
            c.fillStyle = 'rgba(15,23,42,0.14)';
            c.fillRect(a1 + 8, yb + 90, 4, 66);
            c.fillStyle = '#8a5c2c';
            c.fillRect(a1 + 6, yb + 88, 3, 68);
            c.fillStyle = '#b2854a';
            c.fillRect(a1 + 6, yb + 88, 1, 68);

            plant(a1 + 9, yb + 70);
            aoFloor(a1, yb + 162, w, 2);
        };

        // Perpustakaan: rak buku, meja baca panjang, meja pustakawan.
        const drawPerpus = (a1: number, a2: number): void => {
            const w = a2 - a1;

            floorT(a1, yb, w, 164, '#e7e2d4', '#f1ede1', 16);
            grain(a1, yb, w, 164, 0.04);

            c.fillStyle = '#1f2937';
            c.fillRect(a1 + w / 2 - 34, yb + 3, 68, 11);
            c.fillStyle = '#fbbf24';
            c.font = 'bold 6px monospace';
            c.textAlign = 'center';
            c.fillText('PERPUSTAKAAN', a1 + w / 2, yb + 11);
            c.textAlign = 'left';

            // Rak buku dinding utara + sisi timur.
            bookShelf(a1 + 12, yb + 20, w - 24, 36);
            bookShelf(a2 - 20, yb + 76, 14, 63);

            // Meja baca panjang + 6 kursi.
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(a1 + 24, yb + 120, 62, 3);
            c.fillStyle = '#8b5a2b';
            c.fillRect(a1 + 22, yb + 110, 66, 12);
            c.fillStyle = '#b07a3e';
            c.fillRect(a1 + 22, yb + 110, 66, 3);
            c.fillStyle = '#6b431d';
            c.fillRect(a1 + 24, yb + 122, 3, 6);
            c.fillRect(a1 + 82, yb + 122, 3, 6);

            for (let i = 0; i < 3; i++) {
                for (const dy of [-14, 22]) {
                    const cx = a1 + 34 + i * 22;

                    c.fillStyle = 'rgba(15,23,42,0.16)';
                    c.fillRect(cx - 5, yb + 112 + dy, 12, 2);
                    c.fillStyle = '#3f4756';
                    c.fillRect(cx - 6, yb + 104 + dy, 13, 5);
                    c.fillStyle = '#596271';
                    c.fillRect(cx - 6, yb + 104 + dy, 13, 2);
                }
            }

            // Buku-buku di atas meja.
            for (let i = 0; i < 4; i++) {
                c.fillStyle = ['#b91c1c', '#1d4ed8', '#047857', '#b45309'][i];
                c.fillRect(a1 + 30 + i * 14, yb + 111, 6, 3);
            }

            // Meja pustakawan dekat pintu barat.
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(a1 + 13, yb + 155, 34, 2);
            c.fillStyle = '#6d4a1e';
            c.fillRect(a1 + 12, yb + 142, 36, 12);
            c.fillStyle = '#8a5c2c';
            c.fillRect(a1 + 12, yb + 142, 36, 3);
            c.fillStyle = '#111827';
            c.fillRect(a1 + 30, yb + 136, 12, 7);
            c.fillStyle = '#60a5fa';
            c.fillRect(a1 + 31, yb + 137, 10, 5);

            plant(a1 + 8, yb + 146);
            bin(a2 - 12, yb + 158);
            aoFloor(a1, yb + 162, w, 2);
        };

        // UKS: ranjang, lemari obat, tiang infus, gorden.
        const drawUks = (a1: number, a2: number): void => {
            const w = a2 - a1;

            floorT(a1, yb, w, 164, '#eef2f6', '#f9fbfd', 16);
            grain(a1, yb, w, 164, 0.035);

            // Plang UKS + palang merah.
            c.fillStyle = '#f8fafc';
            c.fillRect(a1 + 6, yb + 4, 40, 12);
            c.fillStyle = '#1f2937';
            c.fillRect(a1 + 6, yb + 4, 40, 1);
            redCross(a1 + 13, yb + 10);
            c.fillStyle = '#dc2626';
            c.font = 'bold 4px monospace';
            c.textAlign = 'left';
            c.fillText('UKS', a1 + 20, yb + 12);

            // Lemari obat di dinding utara.
            cabinet(a1 + 16, yb + 20, 46, 28);
            redCross(a1 + 39, yb + 34, 1.4);

            // Ranjang di timur.
            const bx = a2 - 66;
            const by = yb + 58;

            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(bx + 3, by + 66, 56, 4);
            c.fillStyle = '#cbd5e1';
            c.fillRect(bx, by, 58, 66);
            c.fillStyle = '#f8fafc';
            c.fillRect(bx + 2, by + 3, 54, 60);
            // Sandaran kepala.
            c.fillStyle = '#94a3b8';
            c.fillRect(bx, by - 3, 58, 4);
            // Bantal.
            c.fillStyle = '#e2e8f0';
            c.fillRect(bx + 8, by + 6, 22, 12);
            c.fillRect(bx + 32, by + 6, 16, 12);
            c.fillStyle = 'rgba(148,163,184,0.5)';
            c.fillRect(bx + 8, by + 11, 22, 1);
            // Selimut.
            c.fillStyle = '#93c5fd';
            c.fillRect(bx + 3, by + 26, 52, 36);
            c.fillStyle = '#bfdbfe';
            c.fillRect(bx + 3, by + 26, 52, 4);
            c.fillStyle = 'rgba(30,64,175,0.18)';

            for (let i = 0; i < 3; i++) {
                c.fillRect(bx + 3, by + 34 + i * 9, 52, 1);
            }

            // Tiang infus.
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(bx - 12, by + 58, 8, 2);
            c.fillStyle = '#64748b';
            c.fillRect(bx - 10, by + 4, 2, 54);
            c.fillRect(bx - 16, by + 56, 14, 2);
            c.fillStyle = 'rgba(191,225,245,0.9)';
            c.fillRect(bx - 14, by + 8, 6, 10);

            // Kursi tunggu + meja kecil.
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(a1 + 12, yb + 140, 34, 2);
            c.fillStyle = '#94a3b8';
            c.fillRect(a1 + 12, yb + 128, 30, 6);
            c.fillStyle = '#cbd5e1';
            c.fillRect(a1 + 12, yb + 128, 30, 2);
            c.fillStyle = '#64748b';
            c.fillRect(a1 + 14, yb + 134, 3, 6);
            c.fillRect(a1 + 37, yb + 134, 3, 6);

            c.fillStyle = '#8a5c2c';
            c.fillRect(a1 + 12, yb + 148, 22, 8);
            c.fillStyle = '#f8fafc';
            c.fillRect(a1 + 14, yb + 146, 6, 3);
            c.fillStyle = '#dc2626';
            c.fillRect(a1 + 22, yb + 146, 6, 3);

            // Gorden pemisah di sisi barat ranjang.
            c.fillStyle = 'rgba(148,197,253,0.55)';
            c.fillRect(bx - 8, by - 2, 5, 66);
            c.fillStyle = 'rgba(255,255,255,0.4)';

            for (let i = 0; i < 6; i++) {
                c.fillRect(bx - 8 + (i % 2), by + 4 + i * 10, 1, 8);
            }

            plant(a1 + 8, yb + 146);
            aoFloor(a1, yb + 162, w, 2);
        };

        // Ruang guru: meja kerja guru, meja rapat, lemari arsip.
        const drawRuangGuru = (a1: number, a2: number): void => {
            const w = a2 - a1;

            floorT(a1, yb, w, 164, '#e9e4d8', '#f2eee4', 16);
            grain(a1, yb, w, 164, 0.04);

            c.fillStyle = '#1f2937';
            c.fillRect(a1 + w / 2 - 30, yb + 3, 60, 11);
            c.fillStyle = '#fbbf24';
            c.font = 'bold 6px monospace';
            c.textAlign = 'center';
            c.fillText('RUANG GURU', a1 + w / 2, yb + 11);
            c.textAlign = 'left';

            // Papan pengumuman di dinding utara.
            c.fillStyle = '#7c4a21';
            c.fillRect(a1 + 12, yb + 20, 44, 20);
            c.fillStyle = '#a1802f';
            c.fillRect(a1 + 13, yb + 21, 42, 18);
            const notes = ['#f8fafc', '#fde68a', '#bfdbfe', '#fecaca'];

            for (let k = 0; k < 4; k++) {
                c.fillStyle = notes[k];
                c.fillRect(a1 + 16 + k * 9, yb + 24 + (k % 2) * 4, 6, 8);
                c.fillStyle = 'rgba(15,23,42,0.25)';
                c.fillRect(a1 + 16 + k * 9, yb + 30 + (k % 2) * 4, 6, 2);
            }

            // Tiga meja kerja guru + kursi.
            for (let i = 0; i < 3; i++) {
                const x = a1 + 16 + i * 38;

                teach(x, yb + 54);
                c.fillStyle = 'rgba(15,23,42,0.16)';
                c.fillRect(x + 9, yb + 51, 13, 2);
                c.fillStyle = '#3f3a35';
                c.fillRect(x + 8, yb + 42, 13, 6);
                c.fillStyle = '#596271';
                c.fillRect(x + 8, yb + 42, 13, 2);
            }

            // Meja rapat panjang + 6 kursi.
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(a1 + 20, yb + 129, 64, 3);
            c.fillStyle = '#8b5a2b';
            c.fillRect(a1 + 18, yb + 118, 68, 12);
            c.fillStyle = '#b07a3e';
            c.fillRect(a1 + 18, yb + 118, 68, 3);

            for (let i = 0; i < 3; i++) {
                const cx = a1 + 34 + i * 22;

                for (const cy of [yb + 110, yb + 132]) {
                    c.fillStyle = '#3f4756';
                    c.fillRect(cx - 5, cy, 11, 5);
                    c.fillStyle = '#596271';
                    c.fillRect(cx - 5, cy, 11, 2);
                }
            }

            // Lemari arsip di timur (di bawah meja, biar tidak menimpa).
            cabinet(a2 - 22, yb + 80, 16, 34);
            cabinet(a2 - 22, yb + 120, 16, 34, '#cfd8e5');

            // Dispenser air di barat.
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(a1 + 10, yb + 158, 10, 2);
            c.fillStyle = '#dbe3ee';
            c.fillRect(a1 + 10, yb + 140, 10, 18);
            c.fillStyle = 'rgba(56,189,248,0.8)';
            c.fillRect(a1 + 12, yb + 140, 6, 9);
            c.fillStyle = '#f8fafc';
            c.fillRect(a1 + 12, yb + 149, 6, 7);

            plant(a1 + 8, yb + 122);
            bin(a2 - 12, yb + 154);
            aoFloor(a1, yb + 162, w, 2);
        };

        // Tata usaha: loket layanan, kaca partisi, arsip.
        const drawTU = (a1: number, a2: number): void => {
            const w = a2 - a1;

            floorT(a1, yb, w, 164, '#e6ebf2', '#eff3f8', 16);
            grain(a1, yb, w, 164, 0.04);

            c.fillStyle = '#1f2937';
            c.fillRect(a1 + w / 2 - 30, yb + 3, 60, 11);
            c.fillStyle = '#fbbf24';
            c.font = 'bold 6px monospace';
            c.textAlign = 'center';
            c.fillText('TATA USAHA', a1 + w / 2, yb + 11);
            c.textAlign = 'left';

            // Kaca partisi loket.
            c.fillStyle = '#334155';
            c.fillRect(a1 + 16, yb + 20, w - 32, 26);
            c.fillStyle = 'rgba(191,225,245,0.65)';
            c.fillRect(a1 + 18, yb + 22, w - 36, 22);
            c.fillStyle = 'rgba(255,255,255,0.5)';
            c.fillRect(a1 + 19, yb + 23, w - 38, 3);

            for (let i = 1; i < 3; i++) {
                c.fillStyle = '#cbd5e1';
                c.fillRect(a1 + 16 + (i * (w - 32)) / 3, yb + 22, 2, 22);
            }

            // Meja loket kayu.
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(a1 + 14, yb + 84, w - 28, 2);
            c.fillStyle = '#6d4a1e';
            c.fillRect(a1 + 14, yb + 44, w - 28, 40);
            c.fillStyle = '#8a5c2c';
            c.fillRect(a1 + 15, yb + 45, w - 30, 38);
            c.fillStyle = '#e2c295';
            c.fillRect(a1 + 12, yb + 44, w - 24, 5);
            c.fillStyle = 'rgba(255,255,255,0.45)';
            c.fillRect(a1 + 12, yb + 44, w - 24, 2);

            // Monitor petugas.
            for (let i = 0; i < 2; i++) {
                const mx = a1 + 34 + i * 40;

                c.fillStyle = '#0f172a';
                c.fillRect(mx, yb + 54, 14, 9);
                c.fillStyle = '#60a5fa';
                c.fillRect(mx + 1, yb + 55, 12, 7);
                c.fillStyle = '#334155';
                c.fillRect(mx + 5, yb + 63, 4, 2);
            }

            // Lemari arsip di timur.
            for (let i = 0; i < 3; i++) {
                cabinet(
                    a2 - 22,
                    yb + 94 + i * 21,
                    16,
                    18,
                    i % 2 === 0 ? '#dbe3ee' : '#cfd8e5',
                );
            }

            // Bangku tunggu.
            bench(a1 + 18, yb + 118);
            bench(a1 + 18, yb + 140);

            // Meja printer kecil.
            c.fillStyle = '#8a5c2c';
            c.fillRect(a1 + 72, yb + 120, 24, 10);
            c.fillStyle = '#cbd5e1';
            c.fillRect(a1 + 76, yb + 114, 14, 7);
            c.fillStyle = '#475569';
            c.fillRect(a1 + 78, yb + 116, 10, 4);

            plant(a1 + 8, yb + 146);
            bin(a2 - 12, yb + 150);
            aoFloor(a1, yb + 162, w, 2);
        };

        // Panel pembatas antar ruang (dua nada + alur).
        const divider = (x: number, y: number, h: number): void => {
            c.fillStyle = '#b6c0cf';
            c.fillRect(x, y, 12, h);
            c.fillStyle = '#d5dce7';
            c.fillRect(x, y, 2, h);
            c.fillStyle = '#96a1b1';
            c.fillRect(x + 10, y, 2, h);
            c.fillStyle = 'rgba(15,23,42,0.12)';
            c.fillRect(x + 5, y + 6, 1, h - 12);
            grain(x, y, 12, h, 0.05);
        };

        const info = hallInfo(this.mapName);

        if (!info) {
            return;
        }

        const yb = HALL_ROOM_Y0;

        // ***** Dasar luar gedung *****
        c.fillStyle = '#6a7383';
        c.fillRect(0, 0, WORLD_W, WORLD_H);
        grain(0, 0, WORLD_W, WORLD_H, 0.06);

        // Fasad luar (utara + sisi).
        c.fillStyle = '#5b6674';
        c.fillRect(0, 0, WORLD_W, 20);
        c.fillStyle = '#75808f';
        c.fillRect(0, 0, 20, WORLD_H);
        c.fillRect(780, 0, 20, WORLD_H);
        c.fillStyle = 'rgba(255,255,255,0.06)';
        c.fillRect(0, 0, WORLD_W, 1);
        grain(0, 0, WORLD_W, 20, 0.08);

        // ***** Baris ruang lantai aktif (rooftop: tanpa baris ruang) *****
        const rooms = info.roof
            ? []
            : ROAM_DOORS.filter(
                  (d) =>
                      d.map === this.mapName &&
                      d.stroll === true &&
                      d.room !== '' &&
                      d.label !== 'TANGGA',
              );

        if (!info.roof) {
            for (const d of rooms) {
                const a1 = d.artX1 ?? d.x1;
                const a2 = d.artX2 ?? d.x2;
                const lab = (d.room ?? '').startsWith('LAB');

                floorT(
                    a1,
                    yb,
                    a2 - a1,
                    164,
                    lab ? '#d9e6f2' : '#ece4d1',
                    lab ? '#e8f1f8' : '#f5efdf',
                    16,
                );
            }

            // Koridor: pavers 24 + jalur kuning tengah.
            floorT(20, yb + 180, 760, 72, '#e4e8ef', '#edeff5', 24);
            c.fillStyle = 'rgba(245,209,63,0.28)';
            c.fillRect(20, yb + 214, 760, 4);
            c.fillStyle = 'rgba(15,23,42,0.06)';
            c.fillRect(20, yb + 212, 760, 1);

            // Slab tepi selatan koridor.
            c.fillStyle = '#5f6a79';
            c.fillRect(20, yb + 252, 760, 4);

            // Dinding kolom baris ruang (kiri; kanan = ruang tangga).
            wall(20, yb, 84, 164);

            for (const d of rooms.slice(1)) {
                divider((d.artX1 ?? d.x1) - 12, yb, 164);
            }

            // Dinding ambang + plak nomor lantai di ambang barat
            // (berhenti sebelum ruang tangga; ambang tangga digambar
            // di blok ruang tangga).
            wall(108, yb + 168, 586, 12);
            c.fillStyle = '#334155';
            c.fillRect(124, yb + 169, 44, 10);
            c.fillStyle = '#fde047';
            c.font = '5px monospace';
            c.textAlign = 'center';
            c.fillText(`LANTAI ${info.floor}`, 146, yb + 176);
            c.textAlign = 'left';

            // Isi ruang: papan, jam, meja guru, deret murid / bangku lab.
            for (const d of rooms) {
                const a1 = d.artX1 ?? d.x1;
                const a2 = d.artX2 ?? d.x2;
                const roomKey = d.room ?? '';
                const lab = roomKey.startsWith('LAB');

                // Ruang khusus: interior sendiri, bukan kelas generik.
                if (roomKey === 'KANTIN SEKOLAH') {
                    drawKantin(a1, a2);
                    continue;
                }

                if (roomKey === 'MUSHOLLA') {
                    drawMusholla(a1, a2);
                    continue;
                }

                if (roomKey === 'PERPUSTAKAAN') {
                    drawPerpus(a1, a2);
                    continue;
                }

                if (roomKey === 'RUANG UKS') {
                    drawUks(a1, a2);
                    continue;
                }

                if (roomKey === 'RUANG GURU') {
                    drawRuangGuru(a1, a2);
                    continue;
                }

                if (roomKey === 'RUANG TU') {
                    drawTU(a1, a2);
                    continue;
                }

                board(a1 + 14, yb + 8, a2 - a1 - 28, 20, false);

                c.fillStyle = '#020617';
                c.beginPath();
                c.arc(a2 - 24, yb + 46, 7, 0, Math.PI * 2);
                c.fill();
                c.fillStyle = '#ffffff';
                c.beginPath();
                c.arc(a2 - 24, yb + 46, 6, 0, Math.PI * 2);
                c.fill();
                c.strokeStyle = '#334155';
                c.beginPath();
                c.moveTo(a2 - 24, yb + 46);
                c.lineTo(a2 - 22, yb + 43);
                c.moveTo(a2 - 24, yb + 46);
                c.lineTo(a2 - 26, yb + 48);
                c.stroke();

                teach(a1 + 12, yb + 70);

                if (lab) {
                    for (let rr = 0; rr < 2; rr++) {
                        const ry = yb + 102 + rr * 26;

                        c.fillStyle = 'rgba(15,23,42,0.16)';
                        c.fillRect(a1 + 18, ry + 10, a2 - a1 - 36, 2);
                        c.fillStyle = '#7c5a35';
                        c.fillRect(a1 + 16, ry, a2 - a1 - 32, 11);
                        c.fillStyle = '#916a3d';
                        c.fillRect(a1 + 16, ry, a2 - a1 - 32, 3);

                        for (let k = 0; k < 3; k++) {
                            const kx = a1 + 26 + k * ((a2 - a1 - 64) / 2);

                            c.fillStyle = '#111827';
                            c.fillRect(kx, ry - 9, 13, 9);
                            c.fillStyle = '#60a5fa';
                            c.fillRect(kx + 1, ry - 8, 11, 7);
                            c.fillStyle = 'rgba(255,255,255,0.4)';
                            c.fillRect(kx + 1, ry - 8, 11, 2);
                        }
                    }
                } else {
                    desk(a1 + 20, yb + 104, 20);
                    desk(a1 + 46, yb + 104, 20);
                    desk(a1 + 20, yb + 134, 20);
                    desk(a1 + 46, yb + 134, 20);
                }

                plant(a2 - 22, yb + 138);
                bin(a1 + 16, yb + 150);

                // AO dasar ruang.
                aoFloor(a1, yb + 162, a2 - a1, 2);
            }

            // Perabot koridor: lampu gantung, bangku, loker, papan.
            for (const lx of [216, 408, 600]) {
                c.fillStyle = 'rgba(255,251,235,0.14)';
                c.beginPath();
                c.ellipse(lx, yb + 240, 48, 20, 0, 0, Math.PI * 2);
                c.fill();
                c.fillStyle = 'rgba(255,255,255,0.09)';
                c.beginPath();
                c.ellipse(lx, yb + 240, 32, 13, 0, 0, Math.PI * 2);
                c.fill();
                c.fillStyle = '#94a3b8';
                c.fillRect(lx - 1, yb + 222, 2, 6);
                c.fillStyle = '#cbd5e1';
                c.fillRect(lx - 15, yb + 226, 30, 7);
                c.fillStyle = '#e2e8f0';
                c.fillRect(lx - 13, yb + 228, 26, 4);
                c.fillStyle = '#fff7d6';
                c.fillRect(lx - 11, yb + 230, 22, 2);
            }

            bench(150, yb + 236);
            bench(508, yb + 236);
            loker(258, yb + 222, 3);
            plant(136, yb + 192);
            plant(664, yb + 192);
            bin(236, yb + 246);
            bin(576, yb + 246);

            // Papan pengumuman berisi kertas serentet.
            c.fillStyle = '#7c4a21';
            c.fillRect(528, yb + 222, 30, 30);
            c.fillStyle = '#a1802f';
            c.fillRect(530, yb + 224, 26, 26);
            const notes = ['#f8fafc', '#fde68a', '#bfdbfe', '#fecaca'];

            for (let k = 0; k < 4; k++) {
                c.fillStyle = notes[k];
                c.fillRect(532 + k * 6, yb + 226 + (k % 2) * 4, 5, 7);
                c.fillStyle = 'rgba(15,23,42,0.35)';
                c.fillRect(532 + k * 6, yb + 231 + (k % 2) * 4, 5, 2);
            }
        }

        // ***** Mulut pintu daun ber-kaca (ruang lantai aktif) *****
        const mouth = (d: RoamDoor): void => {
            const mx = (d.x1 + d.x2) / 2;
            const w2 = (d.x2 - d.x1) / 2;
            const y0 = d.y1;

            // Daun pintu terbuka dua sisi (kayu dua nada + gelas).
            const leaf = (lx: number, lw: number, flip: boolean): void => {
                const g1 = lx + (flip ? lw - 5 : 0);

                c.fillStyle = '#6d4a1e';
                c.fillRect(lx, y0 - 2, lw, 16);
                c.fillStyle = '#8a5c2c';
                c.fillRect(lx + 1, y0 - 1, lw - 2, 14);
                c.fillStyle = '#a06a32';
                c.fillRect(lx + 2, y0, lw - 4, 12);
                c.fillStyle = '#b2854a';
                c.fillRect(g1, y0, 5, 14);
                // Kaca jendela daun.
                c.fillStyle = '#cfe6f4';
                c.fillRect(lx + (flip ? 3 : lw - 12), y0 + 1, 9, 5);
                c.fillStyle = 'rgba(255,255,255,0.6)';
                c.fillRect(lx + (flip ? 3 : lw - 12), y0 + 1, 9, 2);
                grain(lx + 1, y0 - 1, lw - 2, 14, 0.05);
            };

            leaf(d.x1, w2, false);
            leaf(mx, w2, true);

            // Titik pemegang & mat.
            c.fillStyle = '#fbbf24';
            c.fillRect(mx - 2, y0 + 5, 2, 3);
            c.fillRect(mx, y0 + 5, 2, 3);

            c.fillStyle = '#9c6b34';
            c.fillRect(d.x1 - 2, y0 + 16, d.x2 - d.x1 + 4, 4);
            c.fillStyle = 'rgba(255,255,255,0.25)';
            c.fillRect(d.x1 - 2, y0 + 16, d.x2 - d.x1 + 4, 1);
        };

        for (const d of rooms) {
            mouth(d);
        }

        // ***** Ruang tangga di ujung lorong (lantai biasa): bangunan
        // kecil sebelahan kelas, di dalamnya tangga tampak samping *****
        const tanggaK = ROAM_DOORS.find(
            (d) =>
                d.map === this.mapName &&
                d.stroll === true &&
                d.label === 'TANGGA',
        );
        const sNaik = ROAM_DOORS.some(
            (d) => d.map === this.mapName && d.label === 'TANGGA ▲',
        );
        const sTurun = ROAM_DOORS.some(
            (d) => d.map === this.mapName && d.label === 'TANGGA ▼',
        );

        if (tanggaK) {
            const a1 = tanggaK.artX1 ?? tanggaK.x1;
            const a2 = tanggaK.artX2 ?? tanggaK.x2;
            const rw = a2 - a1;

            // ===== Geometri tangga (denah dari atas) =====
            const topY = yb + 54; // 94 — bibir landas atas
            const botY = yb + 148; // 188 — bibir landas bawah
            const stepH = 13;
            const stepN = 7;
            const fw = 38;
            const lx = a1 + 7;
            const rx = a1 + 57;

            // Lantai beton ruang tangga.
            floorT(a1, yb, rw, 164, '#d5dbe5', '#e1e7ef', 12);
            grain(a1, yb, rw, 164, 0.045);

            // Pendaratan atas & bawah (beton lebih terang, sedikit mengkilap).
            c.fillStyle = '#e8edf4';
            c.fillRect(a1 + 4, yb + 18, rw - 8, topY - yb - 18);
            c.fillStyle = '#dfe5ee';
            c.fillRect(a1 + 4, botY, rw - 8, 16);
            grain(a1 + 4, yb + 18, rw - 8, topY - yb - 18, 0.04);
            grain(a1 + 4, botY + 2, rw - 8, 14, 0.04);

            // Berkas cahaya dari jendela utara jatuh ke landas atas.
            c.fillStyle = 'rgba(255,249,224,0.12)';
            c.beginPath();
            c.moveTo(a1 + 14, yb + 16);
            c.lineTo(a1 + 74, yb + 16);
            c.lineTo(a2 - 4, topY + 44);
            c.lineTo(a1 + 2, topY + 44);
            c.closePath();
            c.fill();

            // ===== Dinding utara + jendela lebar (langit pagi) =====
            c.fillStyle = '#c6d0de';
            c.fillRect(a1, yb, rw, 16);
            c.fillStyle = '#e9eff7';
            c.fillRect(a1, yb, rw, 2);
            c.fillStyle = 'rgba(15,23,42,0.14)';
            c.fillRect(a1, yb + 14, rw, 2);

            const wx1 = a1 + 14;
            const wx2 = a1 + 74;
            const wy1 = yb + 2;
            const wy2 = yb + 14;

            // Kusen putih.
            c.fillStyle = '#f8fafc';
            c.fillRect(wx1 - 2, wy1 - 1, wx2 - wx1 + 4, wy2 - wy1 + 2);
            // Kaca langit bergradasi.
            const sky = c.createLinearGradient(0, wy1, 0, wy2);
            sky.addColorStop(0, '#8ec9ee');
            sky.addColorStop(0.6, '#bfe3f7');
            sky.addColorStop(1, '#e7f6ff');
            c.fillStyle = sky;
            c.fillRect(wx1, wy1, wx2 - wx1, wy2 - wy1);
            // Awan tipis.
            c.fillStyle = 'rgba(255,255,255,0.8)';
            c.fillRect(wx1 + 6, wy1 + 5, 14, 2);
            c.fillRect(wx1 + 9, wy1 + 3, 8, 2);
            c.fillRect(wx1 + 36, wy1 + 4, 10, 1);
            // Palang kusen + kilau kaca.
            c.fillStyle = '#e2e8f0';
            c.fillRect(wx1 + (wx2 - wx1) / 2 - 1, wy1, 2, wy2 - wy1);
            c.fillStyle = 'rgba(255,255,255,0.7)';
            c.fillRect(wx1 + 2, wy1, 2, wy2 - wy1 - 2);
            c.fillStyle = 'rgba(15,23,42,0.10)';
            c.fillRect(wx1 - 2, wy2 + 1, wx2 - wx1 + 4, 1);

            // Plak lantai di dinding (kanan jendela).
            c.fillStyle = '#334155';
            c.fillRect(a2 - 24, yb + 3, 18, 10);
            c.fillStyle = '#fde047';
            c.font = '5px monospace';
            c.textAlign = 'center';
            c.fillText(`L.${info.floor}`, a2 - 15, yb + 11);
            c.textAlign = 'left';

            // ===== Dua penerbangan berdampingan: kiri TURUN, kanan NAIK =====
            const flight = (x: number, naik: boolean): void => {
                // Bayang tangga jatuh ke lantai (selatan + timur).
                c.fillStyle = 'rgba(15,23,42,0.12)';
                c.fillRect(x + 2, botY + 2, fw, 4);
                c.fillRect(x + fw, topY + 4, 3, botY - topY);

                // Badan tangga (dasar gelap, biar sela antar anak terbaca).
                c.fillStyle = '#8d98a8';
                c.fillRect(x - 1, topY - 1, fw + 2, botY - topY + 2);

                for (let i = 0; i < stepN; i++) {
                    const y = botY - (i + 1) * stepH;

                    // Muka/riser: makin ke utara makin terang (kena cahaya).
                    const lift = naik ? i * 2 : 6 - i;
                    c.fillStyle =
                        lift >= 6
                            ? '#c1cbd7'
                            : lift >= 3
                              ? '#b6c1cf'
                              : '#aab5c4';
                    c.fillRect(x, y, fw, stepH);

                    // Permukaan pijakan (tebal, bukan garis ruji).
                    c.fillStyle = naik ? '#e9eff5' : '#dde4ec';
                    c.fillRect(x, y, fw, 5);
                    // Kilau tepi depan.
                    c.fillStyle = 'rgba(255,255,255,0.7)';
                    c.fillRect(x, y, fw, 1);
                    // Bayang riser di bawah pijakan.
                    c.fillStyle = 'rgba(15,23,42,0.2)';
                    c.fillRect(x, y + 5, fw, 3);
                    c.fillStyle = 'rgba(15,23,42,0.08)';
                    c.fillRect(x, y + 8, fw, 1);
                }

                // Kedalaman: penerbangan turun terasa lebih gelap.
                const g = c.createLinearGradient(0, topY, 0, botY);

                if (naik) {
                    g.addColorStop(0, 'rgba(255,255,255,0.06)');
                    g.addColorStop(1, 'rgba(15,23,42,0.1)');
                } else {
                    g.addColorStop(0, 'rgba(15,23,42,0.34)');
                    g.addColorStop(0.45, 'rgba(15,23,42,0.12)');
                    g.addColorStop(1, 'rgba(15,23,42,0)');
                }

                c.fillStyle = g;
                c.fillRect(x, topY, fw, botY - topY);

                // Liang gelap di ujung utara penerbangan turun.
                if (!naik) {
                    const hole = c.createLinearGradient(0, topY, 0, topY + 22);
                    hole.addColorStop(0, 'rgba(2,6,23,0.6)');
                    hole.addColorStop(1, 'rgba(2,6,23,0)');
                    c.fillStyle = hole;
                    c.fillRect(x, topY, fw, 22);
                }

                // Papan stringer (sisi tangga) kiri & kanan.
                for (const sx of [x - 1, x + fw - 1]) {
                    c.fillStyle = '#aab5c3';
                    c.fillRect(sx, topY, 2, botY - topY);
                    c.fillStyle = 'rgba(255,255,255,0.55)';
                    c.fillRect(sx, topY, 1, botY - topY);
                    c.fillStyle = 'rgba(15,23,42,0.2)';
                    c.fillRect(sx + 1, topY, 1, botY - topY);
                }
            };

            if (sTurun) {
                flight(lx, false);
            } else {
                // Lantai dasar: tidak ada tangga turun — sudut kiri jadi
                // ruang tunggu kecil dengan bangku, bukan tangga palsu.
                c.fillStyle = '#dfe6ee';
                c.fillRect(lx - 1, topY, fw + 2, botY - topY);
                grain(lx - 1, topY, fw + 2, botY - topY, 0.05);
                c.fillStyle = 'rgba(15,23,42,0.1)';
                c.fillRect(lx - 1, topY, 2, botY - topY);
                bench(a1 + 5, topY + 54);
                plant(a1 + 9, topY + 20);
            }

            flight(rx, true);

            // Garis peringatan kuning di bibir kedua landas.
            c.fillStyle = 'rgba(245,209,63,0.85)';
            c.fillRect(a1 + 4, topY - 2, rw - 8, 2);
            c.fillRect(a1 + 4, botY, rw - 8, 2);

            // ===== Dinding pemisah setinggi pinggang antar penerbangan =====
            const mw1 = a1 + 45;
            const mw2 = a1 + 55;

            // Bayang dinding ke penerbangan timur.
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(mw2, topY - 2, 3, botY - topY + 8);
            // Badan dinding.
            c.fillStyle = '#c3ceda';
            c.fillRect(mw1, topY - 6, mw2 - mw1, botY - topY + 10);
            c.fillStyle = '#eef3f9';
            c.fillRect(mw1, topY - 6, mw2 - mw1, 3);
            c.fillStyle = '#9aa6b5';
            c.fillRect(mw1, botY + 3, mw2 - mw1, 2);
            // Handrail di puncak dinding.
            c.fillStyle = '#33404f';
            c.fillRect(mw1 + 1, topY - 8, mw2 - mw1 - 2, 2);
            c.fillStyle = 'rgba(255,255,255,0.4)';
            c.fillRect(mw1 + 1, topY - 8, mw2 - mw1 - 2, 1);
            // Tiang ujung handrail.
            c.fillStyle = '#33404f';
            c.fillRect(mw1 + 1, topY - 8, 2, 7);
            c.fillRect(mw2 - 3, topY - 8, 2, 7);

            // ===== Rel tangga =====
            const rail = (x: number, y1: number, y2: number): void => {
                // Bayang rel jatuh ke anak tangga (ke timur).
                c.fillStyle = 'rgba(15,23,42,0.14)';
                c.fillRect(x + 3, y1 + 5, 4, y2 - y1);
                // Batang rel: gelap + kilau atas.
                c.fillStyle = '#33404f';
                c.fillRect(x, y1, 3, y2 - y1);
                c.fillStyle = 'rgba(255,255,255,0.45)';
                c.fillRect(x, y1, 1, y2 - y1);
                // Tiang penyangga.
                c.fillStyle = '#2b3644';

                for (let py = y1 + 8; py < y2 - 4; py += 16) {
                    c.fillRect(x - 1, py, 5, 2);
                }

                // Baut atas.
                c.fillStyle = '#8b98a8';
                c.fillRect(x + 1, y1, 1, 2);
                c.fillRect(x + 1, y2 - 2, 1, 2);
            };

            rail(a1 + 1, topY - 2, botY + 2); // sisi barat
            rail(a1 + 96, topY - 2, botY + 2); // sisi timur

            // Ujung rel dibalut biar tidak terlihat batang mentah.
            c.fillStyle = '#64748b';
            c.fillRect(a1, topY - 4, 4, 3);
            c.fillRect(a1 + 95, topY - 4, 4, 3);

            // Panah arah di lantai landasan.
            c.fillStyle = '#b45309';
            c.font = 'bold 10px monospace';
            c.textAlign = 'center';

            if (sNaik) {
                c.fillText('▲', rx + fw / 2, topY + 14);
            }

            if (sTurun) {
                c.fillText('▼', lx + fw / 2, botY - 16);
            }

            c.textAlign = 'left';

            // Tanaman kecil di sudut landas atas (lantai atas saja —
            // lantai dasar sudah punya tanaman di ruang tunggu).
            if (sTurun) {
                plant(a1 + 6, topY - 22);
            }

            // Tabung pemadam api di landas bawah, dekat dinding timur.
            c.fillStyle = 'rgba(15,23,42,0.2)';
            c.beginPath();
            c.ellipse(a2 - 13, botY + 15, 5, 2, 0, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#c02626';
            c.fillRect(a2 - 17, botY + 3, 7, 12);
            c.fillStyle = '#e23b3b';
            c.fillRect(a2 - 17, botY + 3, 2, 12);
            c.fillStyle = '#7f1d1d';
            c.fillRect(a2 - 18, botY + 1, 9, 2);
            c.fillStyle = '#334155';
            c.fillRect(a2 - 14, botY, 3, 2);
            c.fillRect(a2 - 9, botY + 4, 2, 4);
            c.fillStyle = '#f8fafc';
            c.fillRect(a2 - 16, botY + 7, 5, 3);

            // Dinding: pemisah kelas terakhir, kulit timur, ambang.
            divider(a1 - 12, yb, 164);
            wall(a2, yb, 8, 164);
            mouth(tanggaK);
        }

        if (info.roof && (sNaik || sTurun)) {
            const cx = HALL_COL.E;

            floorT(
                cx.x1,
                yb + 180,
                cx.x2 - cx.x1,
                72,
                '#dfe3ea',
                '#e9ecf1',
                12,
            );

            // Anak tangga menyampir di dalam kotak (abs 288 .. 236).
            for (let sy = yb + 248; sy > yb + 184; sy -= 12) {
                c.fillStyle = sy % 24 === 0 ? '#b7c0ce' : '#9da9ba';
                c.fillRect(cx.x1 + 6, sy, cx.x2 - cx.x1 - 12, 9);
                c.fillStyle = '#e8eef5';
                c.fillRect(cx.x1 + 6, sy, cx.x2 - cx.x1 - 12, 2);
                c.fillStyle = 'rgba(15,23,42,0.28)';
                c.fillRect(cx.x1 + 6, sy + 8, cx.x2 - cx.x1 - 12, 1);
            }

            // Pegangan di sisi dalam (barat) kotak.
            c.fillStyle = '#374151';
            c.fillRect(cx.x1 + 2, yb + 186, 3, 62);
            c.fillStyle = '#fbbf24';
            c.fillRect(cx.x1 + 3, yb + 186, 1, 62);

            // Panah arah: naik di separuh atas, turun di separuh bawah.
            c.fillStyle = '#fbbf24';
            c.font = 'bold 11px monospace';
            c.textAlign = 'center';

            if (sNaik) {
                c.fillText('▲', (cx.x1 + cx.x2) / 2, yb + 200);
            }

            if (sTurun) {
                c.fillText('▼', (cx.x1 + cx.x2) / 2, yb + 244);
            }

            c.textAlign = 'left';

            // Dinding sisi luar kotak tangga.
            wall(cx.x2, yb + 180, 8, 72);
        }

        // ***** Rooftop: deck beton, parapet, tandon & HVAC *****
        if (info.roof) {
            floorT(20, 52, 760, 240, '#aab4c2', '#b6c0ce', 20);
            c.fillStyle = '#5f6a79';
            c.fillRect(20, 20, WORLD_W - 40, 16);
            c.fillRect(20, 296, 760, 4);

            // Parapet utara dengan tiang.
            c.fillStyle = '#5b6674';
            c.fillRect(20, 36, 760, 16);
            c.fillStyle = '#75808f';
            c.fillRect(20, 36, 760, 3);
            c.fillStyle = 'rgba(15,23,42,0.25)';

            for (let px = 28; px < 776; px += 24) {
                c.fillRect(px, 44, 2, 6);
            }

            grain(20, 36, 760, 16, 0.08);
            aoFloor(20, 52, 760, 3);

            // Tandon air.
            c.fillStyle = 'rgba(15,23,42,0.2)';
            c.beginPath();
            c.ellipse(120, 186, 34, 10, 0, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#5d6a7a';
            c.fillRect(94, 124, 52, 58);
            c.fillStyle = '#7d8b9d';
            c.fillRect(94, 124, 52, 10);
            c.fillStyle = '#4b5666';

            for (let by = 138; by < 176; by += 14) {
                c.fillRect(94, by, 52, 3);
            }

            c.fillStyle = '#8f9dab';
            c.beginPath();
            c.ellipse(120, 124, 26, 8, 0, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#5d6a7a';
            c.fillRect(98, 182, 6, 8);
            c.fillRect(136, 182, 6, 8);

            // Unit HVAC.
            for (const hx of [292, 340, 388]) {
                c.fillStyle = 'rgba(15,23,42,0.2)';
                c.fillRect(hx - 3, 148, 40, 3);
                c.fillStyle = '#778393';
                c.fillRect(hx, 118, 34, 28);
                c.fillStyle = '#8e9aab';
                c.fillRect(hx, 118, 34, 5);
                c.fillStyle = '#37424f';
                c.beginPath();
                c.arc(hx + 17, 134, 9, 0, Math.PI * 2);
                c.fill();
                c.strokeStyle = '#93a1b0';
                c.beginPath();
                c.moveTo(hx + 17, 134);
                c.lineTo(hx + 22, 128);
                c.moveTo(hx + 17, 134);
                c.lineTo(hx + 11, 139);
                c.stroke();
            }

            // Tiang antena.
            c.fillStyle = '#374151';
            c.fillRect(619, 60, 3, 46);
            c.fillStyle = '#94a3b8';
            c.fillRect(612, 74, 17, 2);
            c.fillStyle = '#ef4444';
            c.fillRect(618, 56, 5, 5);

            // Bangku & tanaman deck.
            bench(470, 120);
            bench(210, 232);
            bench(430, 232);
            plant(58, 62);
            plant(742, 62);
            plant(300, 216);
            bin(502, 246);

            // Stempel deck.
            c.fillStyle = 'rgba(15,23,42,0.28)';
            c.font = 'bold 10px monospace';
            c.textAlign = 'center';
            c.fillText('ROOFTOP', 400, 90);
            c.textAlign = 'left';
        }

        // ***** Fascia selatan + lobbi & pintu keluar (lantai 1) *****
        c.fillStyle = '#5b6674';
        c.fillRect(0, WORLD_H - 24, WORLD_W, 24);
        grain(0, WORLD_H - 24, WORLD_W, 24, 0.08);

        if (info.floor === 1) {
            // Lobbi barat: ubin, dinding pemisah & pintu dobel keluar.
            floorT(24, 296, 84, 88, '#dfe3ea', '#e9ecf1', 12);
            c.fillStyle = '#5b6674';
            c.fillRect(108, 296, 672, 88);
            grain(108, 296, 672, 88, 0.08);
            wall(104, 296, 8, 88);

            // Pintu dobel keluar.
            c.fillStyle = 'rgba(15,23,42,0.55)';
            c.fillRect(28, 322, 76, 52);
            c.fillStyle = '#dbe3ee';
            c.fillRect(34, 326, 64, 44);
            c.fillStyle = '#eef2f8';
            c.fillRect(36, 328, 28, 40);
            c.fillRect(68, 328, 28, 40);
            c.fillStyle = 'rgba(30,58,95,0.5)';
            c.fillRect(65, 328, 3, 40);
            c.fillStyle = '#8fb4d4';
            c.fillRect(38, 330, 24, 14);
            c.fillRect(70, 330, 24, 14);
            c.fillStyle = 'rgba(255,255,255,0.5)';
            c.fillRect(38, 330, 24, 3);
            c.fillRect(70, 330, 24, 3);
            c.fillStyle = '#94a3b8';
            c.fillRect(58, 354, 4, 8);
            c.fillRect(70, 354, 4, 8);
            c.fillStyle = '#0f172a';
            c.fillRect(44, 364, 12, 4);
            c.fillRect(76, 364, 12, 4);

            // Mat & tanaman lobbi.
            c.fillStyle = '#9c6b34';
            c.fillRect(30, 316, 72, 4);
            plant(88, 282);

            // Jendela fasad selatan + papan nama sekolah.
            for (let wx = 44; wx < 742; wx += 62) {
                if (wx > 330 && wx < 448) {
                    continue;
                }

                c.fillStyle = '#3f4b59';
                c.fillRect(wx, 387, 44, 18);
                c.fillStyle = '#8fc9ea';
                c.fillRect(wx + 2, 389, 40, 14);
                c.fillStyle = 'rgba(255,255,255,0.5)';
                c.fillRect(wx + 2, 389, 40, 3);
                c.fillStyle = 'rgba(255,255,255,0.18)';
                c.fillRect(wx + 21, 389, 2, 14);
            }

            c.fillStyle = '#facc15';
            c.font = 'bold 10px monospace';
            c.textAlign = 'center';
            c.fillText('SMK F3NBYTES', 400, 403);
            c.textAlign = 'left';
        }
    }

    /** Ruang kelas: papan tulis, meja guru, meja murid. */
    private drawClassroom(c: CanvasRenderingContext2D): void {
        // Papan tulis + baki kapur.
        c.fillStyle = '#5f3d1e';
        c.fillRect(196, 12, 248, 48);
        c.fillStyle = '#1f5c4d';
        c.fillRect(200, 16, 240, 40);
        c.fillStyle = '#ffffff';
        c.font = '7px monospace';
        c.textAlign = 'center';
        c.fillText(this.roomName || 'BELAJAR BERSAMA', 320, 32);

        if (this.roomName) {
            c.fillStyle = 'rgba(255,255,255,0.85)';
            c.font = '6px monospace';
            c.fillText(
                this.roomName.startsWith('PKL')
                    ? 'MAGANG PRPL - SEMESTER GANJIL'
                    : 'KELAS X - XI - XII',
                320,
                48,
            );
        }

        c.fillStyle = '#fde68a';
        c.fillRect(210, 44, 18, 3);
        c.fillRect(420, 44, 8, 3);
        c.textAlign = 'left';
        // Meja guru: badan bermula kaki + lemari laci.
        c.fillStyle = 'rgba(15,23,42,0.14)';
        c.fillRect(276, 96, 88, 8);
        c.fillStyle = '#5a3a18';
        c.fillRect(284, 96, 6, 12);
        c.fillRect(350, 96, 6, 12);
        const deskTop = c.createLinearGradient(280, 76, 280, 88);

        deskTop.addColorStop(0, '#a97435');
        deskTop.addColorStop(0.6, '#8b5a2b');
        deskTop.addColorStop(1, '#6f4520');
        c.fillStyle = '#7c4a1e';
        c.fillRect(280, 88, 80, 10);
        c.fillStyle = deskTop;
        c.fillRect(280, 76, 80, 12);
        c.fillStyle = 'rgba(255,255,255,0.28)';
        c.fillRect(280, 76, 80, 3);
        // Dua lemari drawel + tombol emas.
        c.fillStyle = '#6b4423';
        c.fillRect(286, 90, 32, 6);
        c.fillRect(322, 90, 32, 6);
        c.fillStyle = '#facc15';
        c.fillRect(300, 92, 3, 2);
        c.fillRect(336, 92, 3, 2);
        // Barang di atas: tumpuk buku + kertas.
        c.fillStyle = '#dc2626';
        c.fillRect(292, 70, 20, 7);
        c.fillStyle = '#16a34a';
        c.fillRect(294, 65, 16, 6);
        c.fillStyle = '#f8fafc';
        c.fillRect(330, 71, 22, 5);
        c.fillStyle = 'rgba(148,163,184,0.9)';
        c.fillRect(332, 73, 16, 1);

        // Meja + bangku murid 3x2 (detail kayu).
        for (let r = 0; r < 2; r++) {
            for (let col = 0; col < 3; col++) {
                const x = 120 + col * 168;
                const y = 160 + r * 100;

                // Blok bayangan di lantai.
                c.fillStyle = 'rgba(15,23,42,0.12)';
                c.fillRect(x - 2, y + 24, 68, 6);

                // Kaki meja.
                c.fillStyle = '#5a3a18';
                c.fillRect(x + 3, y + 10, 4, 18);
                c.fillRect(x + 57, y + 10, 4, 18);

                // Palang bawah.
                c.fillStyle = '#6f4a24';
                c.fillRect(x + 7, y + 22, 50, 2);

                // Tablet meja: gradasi buatan pabrik kayu.
                const top = c.createLinearGradient(x, y, x, y + 10);

                top.addColorStop(0, '#a97435');
                top.addColorStop(0.55, '#8b5a2b');
                top.addColorStop(1, '#6f4520');
                c.fillStyle = top;
                c.fillRect(x, y, 64, 10);
                c.fillStyle = 'rgba(255,255,255,0.25)';
                c.fillRect(x, y, 64, 2);
                c.fillStyle = 'rgba(30,20,8,0.18)';
                c.fillRect(x, y + 9, 64, 1);

                // Serat kayu halus.
                c.fillStyle = 'rgba(60,35,10,0.18)';
                c.fillRect(x + 6, y + 5, 52, 1);
                c.fillRect(x + 14, y + 8, 40, 1);

                // Barang di meja: buku / kotak pensil / kertas.
                const kindIdx = (r * 3 + col) % 4;

                if (kindIdx === 0) {
                    c.fillStyle = '#dc2626';
                    c.fillRect(x + 10, y - 5, 22, 5);
                    c.fillStyle = '#f8fafc';
                    c.fillRect(x + 12, y - 4, 18, 2);
                    c.fillStyle = '#2563eb';
                    c.fillRect(x + 40, y - 4, 16, 4);
                } else if (kindIdx === 1) {
                    c.fillStyle = '#facc15';
                    c.fillRect(x + 24, y - 5, 18, 5);
                    c.fillStyle = '#a16207';
                    c.fillRect(x + 27, y - 6, 12, 2);
                } else if (kindIdx === 2) {
                    c.fillStyle = '#f8fafc';
                    c.fillRect(x + 20, y - 3, 20, 3);
                    c.fillStyle = 'rgba(148,163,184,0.9)';
                    c.fillRect(x + 22, y - 2, 14, 1);
                }

                // Bangku di depan meja.
                c.fillStyle = '#6b4423';
                c.fillRect(x + 8, y + 30, 48, 8);
                c.fillStyle = 'rgba(255,255,255,0.22)';
                c.fillRect(x + 8, y + 30, 48, 2);
                c.fillStyle = '#5a3a18';
                c.fillRect(x + 11, y + 38, 4, 8);
                c.fillRect(x + 49, y + 38, 4, 8);

                // Kursi di belakang: sandaran + dudukan + kaki.
                c.fillStyle = '#8b3a3a';
                c.fillRect(x + 14, y + 46, 30, 10);
                c.fillStyle = 'rgba(255,255,255,0.2)';
                c.fillRect(x + 14, y + 46, 30, 2);
                c.fillStyle = '#6f2828';
                c.fillRect(x + 16, y + 40, 26, 7);
                c.fillStyle = '#4c1d1d';
                c.fillRect(x + 17, y + 56, 3, 9);
                c.fillRect(x + 41, y + 56, 3, 9);
            }
        }

        // Jendela (kiri 2, kanan 1) — sorot langit sore.
        this.drawWindow(c, 60, 12, 58, 32);
        this.drawWindow(c, 130, 12, 58, 32);
        this.drawWindow(c, 568, 12, 58, 32);

        // Pintu keluar (kanan).
        c.fillStyle = '#7f4a23';
        c.fillRect(490, 10, 52, 40);
        c.fillStyle = '#a16207';
        c.fillRect(492, 12, 48, 36);
        c.fillStyle = '#fde68a';
        c.fillRect(534, 26, 4, 6);
        c.fillStyle = '#14532d';
        c.fillRect(498, 16, 30, 12);
        c.fillStyle = '#4ade80';
        c.font = '5px monospace';
        c.textAlign = 'center';
        c.fillText('KELUAR', 513, 25);
        c.textAlign = 'left';

        // Jam dinding.
        c.fillStyle = '#f8fafc';
        c.beginPath();
        c.arc(380, 60, 8, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#1f2937';
        c.lineWidth = 1.5;
        c.stroke();
        c.beginPath();
        c.moveTo(380, 60);
        c.lineTo(380, 55);
        c.moveTo(380, 60);
        c.lineTo(384, 61);
        c.strokeStyle = '#1f2937';
        c.lineWidth = 1;
        c.stroke();

        // Poster & papan pengumuman.
        c.fillStyle = '#eab308';
        c.fillRect(30, 52, 42, 30);
        c.fillStyle = '#fde68a';
        c.fillRect(33, 55, 36, 24);
        c.fillStyle = '#b45309';
        c.fillRect(37, 62, 24, 3);
        c.fillRect(37, 68, 18, 3);
        c.fillStyle = '#64748b';
        c.fillRect(500, 54, 46, 32);
        c.fillStyle = '#e2e8f0';
        c.fillRect(503, 57, 40, 26);
        c.fillStyle = '#64748b';
        c.fillRect(507, 61, 28, 2);
        c.fillRect(507, 66, 32, 2);
        c.fillRect(507, 71, 22, 2);

        // Lemari buku.
        c.fillStyle = '#7c3f1d';
        c.fillRect(46, 190, 44, 40);
        c.fillStyle = '#92610d';
        c.fillRect(46, 190, 44, 4);
        c.fillStyle = '#5f3d1e';
        c.fillRect(49, 196, 38, 14);
        c.fillRect(49, 214, 38, 14);
        const bookCols = [
            '#dc2626',
            '#2563eb',
            '#16a34a',
            '#eab308',
            '#a855f7',
        ];

        for (let b = 0; b < 5; b++) {
            c.fillStyle = bookCols[b];
            c.fillRect(53 + b * 7, 198, 5, 10);
            c.fillStyle = bookCols[(b + 2) % 5];
            c.fillRect(53 + b * 7, 216, 5, 10);
        }

        // Pot & tempat sampah.
        this.drawPlantPot(c, 624, 250);
        this.drawPlantPot(c, 16, 360);
        c.fillStyle = '#6b7280';
        c.fillRect(370, 88, 14, 15);
        c.fillStyle = '#9ca3af';
        c.fillRect(368, 86, 18, 3);
    }
    private drawSchool(c: CanvasRenderingContext2D): void {
        // Tekstur deterministik supaya snapshot map tidak berkedip.
        const nz = (x: number, y: number, k = 0): number => {
            const v =
                Math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453;

            return v - Math.floor(v);
        };

        // ===== Halaman kampus: rumput + paving batu =====
        c.fillStyle = '#5d7549';
        c.fillRect(0, 0, WORLD_W, 336);

        for (let i = 0; i < 900; i++) {
            const gx = Math.floor(nz(i, 1, 1) * WORLD_W);
            const gy = Math.floor(nz(i, 2, 1) * 336);
            const tone = nz(i, 3, 1);
            c.fillStyle =
                tone > 0.55 ? 'rgba(132,158,104,0.35)' : 'rgba(36,58,37,0.30)';
            c.fillRect(gx, gy, 1, tone > 0.8 ? 2 : 1);
        }

        const px0 = 24;
        const px1 = 616;
        const py0 = 100;
        const py1 = 328;

        c.fillStyle = '#a59c8b';
        c.fillRect(px0, py0, px1 - px0, py1 - py0);

        c.save();
        c.beginPath();
        c.rect(px0, py0, px1 - px0, py1 - py0);
        c.clip();

        const paver = ['#b7af9e', '#bdb5a3', '#b1a998', '#c0b8a6', '#aaa291'];

        for (let row = 0; row < 9; row++) {
            const y = py0 + row * 28;
            const off = row % 2 === 0 ? 0 : 28;

            for (let x = px0 - 56 + off; x < px1; x += 56) {
                const h = nz(x, y, 3);
                c.fillStyle = paver[Math.floor(h * paver.length)];
                c.fillRect(x + 1, y + 1, 54, 26);
                c.fillStyle = 'rgba(255,255,255,0.08)';
                c.fillRect(x + 1, y + 1, 54, 1);
                c.fillStyle = 'rgba(47,42,34,0.05)';
                c.fillRect(x + 1, y + 26, 54, 1);
                c.fillRect(x + 54, y + 1, 1, 26);
            }
        }

        // Nat ekspansi tiap tiga baris/kolom, tipis saja.
        c.strokeStyle = 'rgba(74,66,54,0.10)';
        c.lineWidth = 1;

        for (let y = py0 + 84; y < py1; y += 84) {
            c.beginPath();
            c.moveTo(px0, y + 0.5);
            c.lineTo(px1, y + 0.5);
            c.stroke();
        }

        // Noda, retak, dan daun jatuh di paving.
        for (let i = 0; i < 24; i++) {
            const x = px0 + nz(i, 4, 2) * (px1 - px0);
            const y = py0 + nz(i, 5, 2) * (py1 - py0);
            const r = 4 + nz(i, 6, 2) * 10;
            c.fillStyle = 'rgba(60,66,60,0.06)';
            c.beginPath();
            c.ellipse(x, y, r, r * 0.45, 0, 0, Math.PI * 2);
            c.fill();
        }

        c.strokeStyle = 'rgba(74,66,54,0.18)';
        c.lineWidth = 1;

        for (let i = 0; i < 7; i++) {
            const x = px0 + 30 + nz(i, 7, 2) * (px1 - px0 - 60);
            const y = py0 + 20 + nz(i, 8, 2) * (py1 - py0 - 40);
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(x + 10 + nz(i, 9, 2) * 14, y + 4);
            c.lineTo(x + 18, y + 2);
            c.stroke();
        }

        for (let i = 0; i < 46; i++) {
            const x = px0 + nz(i, 10, 3) * (px1 - px0);
            const y = py0 + nz(i, 11, 3) * (py1 - py0);
            c.fillStyle =
                nz(i, 12, 3) > 0.5
                    ? 'rgba(90,110,60,0.55)'
                    : 'rgba(175,140,60,0.45)';
            c.fillRect(x, y, 2, 1);
        }

        c.restore();

        // Border paving.
        c.strokeStyle = 'rgba(92,83,69,0.35)';
        c.lineWidth = 2;
        c.strokeRect(px0 + 0.5, py0 + 0.5, px1 - px0 - 1, py1 - py0 - 1);
        c.strokeStyle = 'rgba(255,255,255,0.16)';
        c.lineWidth = 1;
        c.strokeRect(px0 + 2.5, py0 + 2.5, px1 - px0 - 5, py1 - py0 - 5);

        // Jalur masuk dari gerbang ke pintu A.
        c.fillStyle = '#d5cbb6';
        c.fillRect(96, 198, 160, 66);
        c.fillRect(150, 264, 120, 64);
        c.fillStyle = 'rgba(255,255,255,0.18)';
        c.fillRect(96, 198, 160, 2);
        c.fillRect(150, 264, 120, 2);
        c.fillStyle = 'rgba(90,76,55,0.18)';
        c.fillRect(96, 262, 160, 2);
        c.fillRect(150, 326, 120, 2);

        // Strip taktil kuning di jalur gerbang.
        c.fillStyle = 'rgba(214,180,74,0.55)';
        c.fillRect(202, 264, 8, 62);

        for (let ty = 268; ty < 326; ty += 6) {
            c.fillStyle = 'rgba(255,225,125,0.35)';
            c.fillRect(203, ty, 6, 2);
        }

        // Bed rumput kiri/kanan + pagar hijau belakang.
        const bed = (x: number, y: number, w: number, h: number): void => {
            c.fillStyle = '#46603a';
            c.fillRect(x, y, w, h);
            c.fillStyle = '#5f7c4b';
            c.fillRect(x + 2, y + 2, w - 4, h - 4);
            c.fillStyle = 'rgba(255,255,255,0.10)';
            c.fillRect(x + 2, y + 2, w - 4, 2);
            c.strokeStyle = '#8f8674';
            c.lineWidth = 2;
            c.strokeRect(x + 1, y + 1, w - 2, h - 2);
        };

        bed(24, 132, 40, 196);
        bed(576, 132, 40, 196);
        bed(24, 96, 592, 12);

        // Semak/rumput di bed.
        for (let i = 0; i < 90; i++) {
            const gx = 27 + nz(i, 20, 4) * 34;
            const gy = 136 + nz(i, 21, 4) * 188;
            c.fillStyle =
                nz(i, 22, 4) > 0.5
                    ? 'rgba(52,94,58,0.75)'
                    : 'rgba(102,138,78,0.75)';
            c.fillRect(gx, gy, 2, 2);

            const rx = 580 + nz(i, 23, 4) * 32;
            const ry = 136 + nz(i, 24, 4) * 188;
            c.fillRect(rx, ry, 2, 2);
        }

        // Bunga kecil di bed kiri/kanan.
        for (let i = 0; i < 44; i++) {
            const fx = 28 + nz(i, 50, 8) * 32;
            const fy = 138 + nz(i, 51, 8) * 184;
            c.fillStyle = ['#f2c94c', '#f28b82', '#e9d5ff', '#f8fafc'][
                Math.floor(nz(i, 52, 8) * 4)
            ];
            c.fillRect(fx, fy, 2, 2);

            const rx = 580 + nz(i, 53, 8) * 32;
            const ry = 138 + nz(i, 54, 8) * 184;
            c.fillStyle = ['#f2c94c', '#f28b82', '#e9d5ff', '#f8fafc'][
                Math.floor(nz(i, 55, 8) * 4)
            ];
            c.fillRect(rx, ry, 2, 2);
        }

        // Deretan pohon di belakang gedung.
        const bgCanopy = (x: number, y: number, r: number): void => {
            c.fillStyle = '#2b4b31';
            c.beginPath();
            c.arc(x, y, r, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#3b6742';
            c.beginPath();
            c.arc(x - r * 0.23, y - r * 0.18, r * 0.72, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = 'rgba(108,153,92,0.55)';
            c.beginPath();
            c.arc(x - r * 0.35, y - r * 0.3, r * 0.38, 0, Math.PI * 2);
            c.fill();
        };

        for (let i = 0; i < 15; i++) {
            bgCanopy(
                10 + i * 45,
                36 + nz(i, 30, 5) * 22,
                16 + nz(i, 31, 5) * 8,
            );
        }

        for (let i = 0; i < 24; i++) {
            bgCanopy(4 + i * 27, 68 + nz(i, 32, 5) * 12, 8 + nz(i, 33, 5) * 6);
        }

        // Pagar belakang + samping.
        c.fillStyle = '#4b5563';
        c.fillRect(24, 88, 592, 2);
        c.fillStyle = '#2f6b3f';
        c.fillRect(24, 92, 592, 6);

        for (let x = 24; x < 616; x += 18) {
            c.fillStyle = '#c7ccd4';
            c.fillRect(x, 84, 3, 12);
            c.fillStyle = '#3f8a52';
            c.fillRect(x + 1, 85, 1, 10);
        }

        c.fillStyle = '#4b5563';
        c.fillRect(24, 88, 2, 238);
        c.fillRect(614, 88, 2, 238);

        for (let y = 92; y < 326; y += 18) {
            c.fillStyle = '#c7ccd4';
            c.fillRect(23, y, 4, 8);
            c.fillRect(613, y, 4, 8);
            c.fillStyle = '#3f8a52';
            c.fillRect(24, y + 1, 2, 6);
            c.fillRect(614, y + 1, 2, 6);
        }

        // Hedge rendah di tepi halaman.
        const hedge = (x: number, y: number, w: number): void => {
            c.fillStyle = '#355837';
            c.fillRect(x, y, w, 10);
            c.fillStyle = '#4f7847';
            c.fillRect(x + 2, y + 2, w - 4, 5);
            c.fillStyle = 'rgba(154,190,124,0.45)';
            c.fillRect(x + 4, y + 2, Math.max(0, w - 8), 2);
        };

        hedge(28, 316, 108);
        hedge(284, 316, 328);

        // ===== Plaza upacara =====
        c.fillStyle = 'rgba(255,248,226,0.12)';
        c.fillRect(120, 204, 360, 98);
        c.strokeStyle = 'rgba(255,255,255,0.12)';
        c.lineWidth = 1;
        c.strokeRect(120.5, 204.5, 359, 97);

        // ===== Bayangan gedung di halaman =====
        const shadowA = c.createLinearGradient(0, 204, 0, 230);
        shadowA.addColorStop(0, 'rgba(15,23,42,0.24)');
        shadowA.addColorStop(1, 'rgba(15,23,42,0)');
        c.fillStyle = shadowA;
        c.fillRect(80, 204, 225, 26);

        const shadowB = c.createLinearGradient(0, 204, 0, 226);
        shadowB.addColorStop(0, 'rgba(15,23,42,0.20)');
        shadowB.addColorStop(1, 'rgba(15,23,42,0)');
        c.fillStyle = shadowB;
        c.fillRect(380, 204, 170, 22);

        // Bayangan samping gedung (arah matahari dari kiri-atas).
        c.fillStyle = 'rgba(15,23,42,0.08)';
        c.beginPath();
        c.moveTo(305, 204);
        c.lineTo(330, 216);
        c.lineTo(322, 226);
        c.lineTo(305, 218);
        c.closePath();
        c.fill();
        c.beginPath();
        c.moveTo(550, 204);
        c.lineTo(568, 214);
        c.lineTo(562, 222);
        c.lineTo(550, 216);
        c.closePath();
        c.fill();

        // ===== Jalan Pahlawan (depan sekolah, sisi selatan) =====
        c.fillStyle = '#3b3e45';
        c.fillRect(0, 336, WORLD_W, 64);

        for (let i = 0; i < 260; i++) {
            const ax = nz(i, 40, 6) * WORLD_W;
            const ay = 338 + nz(i, 41, 6) * 60;
            c.fillStyle =
                nz(i, 42, 6) > 0.5
                    ? 'rgba(255,255,255,0.035)'
                    : 'rgba(0,0,0,0.10)';
            c.fillRect(ax, ay, nz(i, 43, 6) > 0.85 ? 3 : 1, 1);
        }

        // Tambalan aspal.
        for (let i = 0; i < 5; i++) {
            const ax = 20 + nz(i, 44, 7) * 560;
            const ay = 344 + nz(i, 45, 7) * 44;
            c.fillStyle = 'rgba(24,27,32,0.28)';
            c.fillRect(ax, ay, 18 + nz(i, 46, 7) * 26, 3);
        }

        // Marka tengah putus-putus (putus di zebra cross).
        c.fillStyle = 'rgba(255,255,255,0.72)';

        for (let x = 6; x < WORLD_W; x += 34) {
            if (x > 140 && x < 282) {
                continue;
            }

            c.fillRect(x, 366, 18, 3);
        }

        // Zebra cross di depan gerbang.
        c.fillStyle = 'rgba(255,255,255,0.82)';

        for (let i = 0; i < 5; i++) {
            c.fillRect(154, 346 + i * 8, 112, 4);
        }

        // Manhole + saluran air.
        c.fillStyle = '#4d535c';
        c.beginPath();
        c.arc(80, 360, 7, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = 'rgba(220,228,238,0.35)';
        c.lineWidth = 1;
        c.stroke();
        c.beginPath();
        c.moveTo(75, 360);
        c.lineTo(85, 360);
        c.moveTo(80, 355);
        c.lineTo(80, 365);
        c.stroke();

        c.fillStyle = '#2b3038';
        c.fillRect(300, 331, 30, 4);
        c.fillStyle = 'rgba(200,210,225,0.35)';

        for (let x = 302; x < 328; x += 4) {
            c.fillRect(x, 332, 1, 2);
        }

        // Trotoar berpaving.
        c.fillStyle = '#b4ac9d';
        c.fillRect(0, 328, WORLD_W, 8);
        c.fillStyle = '#d4cbb7';
        c.fillRect(0, 328, WORLD_W, 2);
        c.strokeStyle = 'rgba(74,66,54,0.22)';
        c.lineWidth = 1;

        for (let x = 0; x < WORLD_W; x += 16) {
            c.beginPath();
            c.moveTo(x + 0.5, 328);
            c.lineTo(x + 0.5, 336);
            c.stroke();
        }

        c.fillStyle = 'rgba(0,0,0,0.25)';
        c.fillRect(0, 334, WORLD_W, 2);
        c.fillStyle = '#d6bc6a';
        c.fillRect(150, 330, 120, 4);

        for (let x = 152; x < 268; x += 6) {
            c.fillStyle = 'rgba(255,233,158,0.45)';
            c.fillRect(x, 331, 3, 2);
        }

        // Nama jalan.
        c.fillStyle = 'rgba(255,255,255,0.58)';
        c.font = '7px monospace';
        c.textAlign = 'left';
        c.fillText('JL. PAHLAWAN', 40, 356);

        // ===== Gerbang masuk =====
        // Bayangan gapura.
        c.fillStyle = 'rgba(15,23,42,0.18)';
        c.fillRect(146, 332, 128, 4);

        // Pilar kiri & kanan.
        c.fillStyle = '#bfc5cf';
        c.fillRect(150, 286, 12, 50);
        c.fillRect(258, 286, 12, 50);
        c.fillStyle = '#eef1f6';
        c.fillRect(150, 286, 12, 4);
        c.fillRect(258, 286, 12, 4);
        c.fillStyle = 'rgba(0,0,0,0.28)';
        c.fillRect(160, 286, 2, 50);
        c.fillRect(268, 286, 2, 50);
        c.fillStyle = 'rgba(255,255,255,0.55)';
        c.fillRect(151, 290, 1, 46);
        c.fillRect(259, 290, 1, 46);
        // Plint pilar.
        c.fillStyle = '#9ea6b2';
        c.fillRect(147, 332, 18, 4);
        c.fillRect(255, 332, 18, 4);
        // Lampu pilar.
        c.fillStyle = '#facc15';
        c.fillRect(152, 282, 8, 4);
        c.fillRect(260, 282, 8, 4);
        c.fillStyle = 'rgba(253,224,71,0.20)';
        c.beginPath();
        c.arc(156, 284, 12, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(264, 284, 12, 0, Math.PI * 2);
        c.fill();

        // Balok gapura + papan nama.
        c.fillStyle = 'rgba(15,23,42,0.20)';
        c.fillRect(148, 264, 128, 26);
        c.fillStyle = '#16324f';
        c.fillRect(146, 262, 128, 26);
        c.fillStyle = '#24476b';
        c.fillRect(149, 265, 122, 20);
        c.fillStyle = '#facc15';
        c.fillRect(146, 262, 128, 3);
        c.fillRect(146, 285, 128, 3);
        c.fillStyle = '#ffffff';
        c.font = 'bold 9px monospace';
        c.textAlign = 'center';
        c.fillText('SMK TI AIRLANGGA', 210, 276);
        c.font = '5px monospace';
        c.fillStyle = '#facc15';
        c.fillText('PUSAT KEUNGGULAN', 210, 284);
        // Daun gapura kecil di pilar.
        c.fillStyle = '#2f6b3f';
        c.fillRect(148, 258, 16, 4);
        c.fillRect(256, 258, 16, 4);
        c.fillStyle = '#4f7847';
        c.fillRect(150, 258, 10, 2);
        c.fillRect(258, 258, 10, 2);

        // Daun gerbang terbuka (kisi hijau di sisi pilar).
        c.fillStyle = '#274b38';
        c.fillRect(153, 292, 4, 38);
        c.fillRect(265, 292, 4, 38);
        c.fillStyle = '#4f8a5f';

        for (let gy = 294; gy < 330; gy += 5) {
            c.fillRect(153, gy, 4, 1);
            c.fillRect(265, gy, 4, 1);
        }

        // Pot tanaman di kaki pilar.
        const gatePot = (x: number): void => {
            c.fillStyle = 'rgba(15,23,42,0.18)';
            c.fillRect(x + 1, 332, 9, 2);
            c.fillStyle = '#9a5b2d';
            c.fillRect(x, 326, 10, 6);
            c.fillStyle = '#c07a42';
            c.fillRect(x, 326, 10, 2);
            c.fillStyle = '#2f6b3f';
            c.fillRect(x - 2, 318, 14, 8);
            c.fillStyle = '#4f8a52';
            c.fillRect(x, 319, 10, 3);
            c.fillStyle = '#7bbd69';
            c.fillRect(x + 2, 317, 3, 3);
        };

        gatePot(143);
        gatePot(273);

        // ===== Pos satpam (dekat gerbang) =====
        c.fillStyle = 'rgba(15,23,42,0.18)';
        c.fillRect(284, 326, 38, 4);
        c.fillStyle = '#e8e2d0';
        c.fillRect(288, 292, 30, 34);
        c.fillStyle = '#d8d0bb';
        c.fillRect(288, 292, 30, 2);
        c.fillStyle = '#16324f';
        c.fillRect(284, 284, 38, 8);
        c.fillStyle = '#24476b';
        c.fillRect(286, 286, 34, 4);
        c.fillStyle = '#facc15';
        c.fillRect(284, 284, 38, 1);
        // Jendela + kusen.
        c.fillStyle = '#7dd3fc';
        c.fillRect(292, 298, 22, 12);
        c.fillStyle = 'rgba(255,255,255,0.45)';
        c.fillRect(292, 298, 22, 3);
        c.fillStyle = '#475569';
        c.fillRect(302, 298, 1, 12);
        c.fillRect(292, 303, 22, 1);
        // Meja & kursi di dalam.
        c.fillStyle = '#8b5a2b';
        c.fillRect(295, 306, 12, 3);
        c.fillStyle = '#5f3b1c';
        c.fillRect(297, 309, 2, 4);
        c.fillRect(304, 309, 2, 4);
        // Pintu.
        c.fillStyle = '#b45309';
        c.fillRect(294, 314, 8, 12);
        c.fillStyle = '#7c3f0a';
        c.fillRect(301, 314, 1, 12);
        c.fillStyle = '#fde68a';
        c.fillRect(299, 319, 1, 1);
        // Lampu pos.
        c.fillStyle = '#facc15';
        c.fillRect(312, 296, 3, 3);
        c.fillStyle = 'rgba(253,224,71,0.22)';
        c.beginPath();
        c.arc(313, 297, 9, 0, Math.PI * 2);
        c.fill();
        // Papan nama pos.
        c.fillStyle = '#16324f';
        c.fillRect(290, 288, 26, 8);
        c.fillStyle = '#ffffff';
        c.font = '4px monospace';
        c.textAlign = 'center';
        c.fillText('POS SATPAM', 303, 293.5);
        c.textAlign = 'left';
        // Tanaman kecil.
        c.fillStyle = '#2f6b3f';
        c.fillRect(318, 318, 6, 8);
        c.fillStyle = '#5c9a5a';
        c.fillRect(319, 316, 4, 4);

        // ===== Tiang bendera (sisi timur halaman) =====
        // Bayangan tiang + bendera.
        c.fillStyle = 'rgba(15,23,42,0.16)';
        c.beginPath();
        c.ellipse(567, 273, 24, 5, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = 'rgba(15,23,42,0.10)';
        c.beginPath();
        c.moveTo(563, 270);
        c.lineTo(570, 270);
        c.lineTo(590, 300);
        c.lineTo(582, 300);
        c.closePath();
        c.fill();
        // Base tiang.
        c.fillStyle = '#6b7280';
        c.fillRect(552, 268, 20, 7);
        c.fillStyle = '#9ca3af';
        c.fillRect(552, 268, 20, 2);
        c.fillStyle = '#4b5563';
        c.fillRect(556, 275, 12, 2);
        // Tiang.
        c.fillStyle = '#9ca3af';
        c.fillRect(560, 204, 4, 66);
        c.fillStyle = '#e5e7eb';
        c.fillRect(560, 204, 2, 66);
        c.fillStyle = '#facc15';
        c.beginPath();
        c.arc(562, 202, 3, 0, Math.PI * 2);
        c.fill();
        // Tali.
        c.strokeStyle = 'rgba(51,65,85,0.55)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(564, 206);
        c.lineTo(594, 210);
        c.stroke();

        // Bendera merah putih dengan lipatan.
        c.fillStyle = '#dc2626';
        c.beginPath();
        c.moveTo(564, 208);
        c.lineTo(596, 205);
        c.lineTo(593, 216);
        c.lineTo(566, 219);
        c.lineTo(564, 214);
        c.closePath();
        c.fill();
        c.fillStyle = '#b91c1c';
        c.beginPath();
        c.moveTo(586, 206);
        c.lineTo(596, 205);
        c.lineTo(593, 216);
        c.lineTo(587, 217);
        c.closePath();
        c.fill();
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.moveTo(566, 219);
        c.lineTo(593, 216);
        c.lineTo(590, 228);
        c.lineTo(564, 230);
        c.closePath();
        c.fill();
        c.fillStyle = '#e5e7eb';
        c.beginPath();
        c.moveTo(585, 217);
        c.lineTo(593, 216);
        c.lineTo(590, 228);
        c.lineTo(584, 229);
        c.closePath();
        c.fill();

        // ===== Gedung A 2 lantai, Gedung B 5 lantai + rooftop =====
        const drawGedung = (
            x0: number,
            x1: number,
            label: string,
            floors: number,
            roof: boolean,
        ): void => {
            const bw = x1 - x0;
            // Skala fasad dibuat lebih besar dari karakter (~34 px):
            // pintu 38 px, lantai dasar 56 px, lantai B 26 px.
            const base = 204;
            const groundH = 56;
            const floorH = label === 'GEDUNG A' ? 66 : 24;
            const roofH = 10;
            const top = base - groundH - (floors - 1) * floorH - roofH;
            const bodyTop = top + roofH;
            const dcx = label === 'GEDUNG A' ? 230 : 465;
            const dw = 40;

            // Bayangan gedung di tanah.
            c.fillStyle = 'rgba(15,23,42,0.14)';
            c.fillRect(x0 - 14, base - 2, bw + 28, 9);
            c.fillStyle = 'rgba(15,23,42,0.20)';
            c.fillRect(x0 - 7, base, bw + 14, 4);

            // Badan fasad.
            c.fillStyle = '#eef2f7';
            c.fillRect(x0, bodyTop, bw, base - bodyTop);
            c.fillStyle = '#f7f9fc';
            c.fillRect(x0, bodyTop, bw, 3);

            // Kolom sudut.
            c.fillStyle = '#e2e8f0';
            c.fillRect(x0, bodyTop, 5, base - bodyTop);
            c.fillRect(x1 - 5, bodyTop, 5, base - bodyTop);
            c.fillStyle = 'rgba(15,23,42,0.14)';
            c.fillRect(x0 + 5, bodyTop, 1, base - bodyTop);
            c.fillRect(x1 - 6, bodyTop, 1, base - bodyTop);

            // Plinth lantai dasar.
            c.fillStyle = '#16324f';
            c.fillRect(x0, base - 4, bw, 2);
            c.fillStyle = '#cbd5e1';
            c.fillRect(x0, base - 2, bw, 1);
            c.fillStyle = '#94a3b8';
            c.fillRect(x0, base - 1, bw, 1);

            // Deret jendela lantai atas.
            const winW = 14;
            const gap = 10;
            const count = Math.max(
                3,
                Math.floor((bw - 30 + gap) / (winW + gap)),
            );
            const totalW = count * winW + (count - 1) * gap;
            const sx = x0 + (bw - totalW) / 2;

            for (let f = 1; f < floors; f++) {
                const fy = base - groundH - f * floorH;
                const winH = Math.max(10, Math.min(22, floorH - 6));
                const wyBase = fy + Math.floor((floorH - winH) / 2);

                for (let i = 0; i < count; i++) {
                    const wx = sx + i * (winW + gap);
                    const wy = wyBase;

                    // Kusen.
                    c.fillStyle = '#64748b';
                    c.fillRect(wx - 1, wy, winW + 2, winH);
                    // Kaca + pantulan.
                    c.fillStyle = '#bfe8fb';
                    c.fillRect(wx, wy + 1, winW, winH - 2);
                    c.fillStyle = '#7dd3fc';
                    c.fillRect(wx, wy + winH - 4, winW, 3);
                    c.fillStyle = 'rgba(255,255,255,0.55)';
                    c.fillRect(wx + 1, wy + 2, 3, 4);
                    c.fillStyle = '#64748b';
                    c.fillRect(wx + winW / 2, wy + 1, 1, winH - 2);

                    // Tirai sesekali.
                    if ((i + f) % 6 === 0) {
                        c.fillStyle = '#f1f5f9';
                        c.fillRect(wx + 1, wy + 2, 4, Math.min(5, winH - 3));
                        c.fillStyle = 'rgba(148,163,184,0.55)';
                        c.fillRect(wx + 3, wy + 2, 1, Math.min(5, winH - 3));
                    }

                    // Jendela gelap / terbuka.
                    if ((i * 3 + f) % 11 === 0) {
                        c.fillStyle = 'rgba(51,65,85,0.55)';
                        c.fillRect(wx + 6, wy + 2, winW - 7, winH - 4);
                    }

                    // Ambang + bayangan.
                    c.fillStyle = '#f8fafc';
                    c.fillRect(wx - 1, wy + winH, winW + 2, 1);
                    c.fillStyle = 'rgba(15,23,42,0.16)';
                    c.fillRect(wx - 1, wy + winH + 1, winW + 2, 1);
                }

                // Slab/ledge bawah lantai.
                const ly = fy + floorH - 4;
                c.fillStyle = '#f8fafc';
                c.fillRect(x0, ly, bw, 1);
                c.fillStyle = '#c3ccd9';
                c.fillRect(x0, ly + 1, bw, 1);
                c.fillStyle = 'rgba(15,23,42,0.16)';
                c.fillRect(x0, ly + 2, bw, 1);
            }

            // Kaca lebar lantai dasar.
            const gwTop = base - 38;
            const gwH = 30;
            const leftX = x0 + 9;
            const leftW = dcx - dw / 2 - 14 - leftX;
            const rightX = dcx + dw / 2 + 8;
            const rightW = x1 - 9 - rightX;

            const storefront = (px: number, pw: number): void => {
                if (pw <= 4) {
                    return;
                }

                c.fillStyle = '#475569';
                c.fillRect(px, gwTop - 1, pw, gwH + 2);
                c.fillStyle = '#a9e0f7';
                c.fillRect(px + 1, gwTop, pw - 2, gwH);
                c.fillStyle = 'rgba(255,255,255,0.38)';
                c.fillRect(px + 1, gwTop, pw - 2, 2);
                c.fillStyle = 'rgba(255,255,255,0.25)';
                c.fillRect(px + 4, gwTop + 3, 5, gwH - 5);
                c.fillStyle = '#64748b';

                for (let mx = px + 22; mx < px + pw - 2; mx += 22) {
                    c.fillRect(mx, gwTop, 1, gwH);
                }
            };

            storefront(leftX, leftW);
            storefront(rightX, rightW);

            // Poster kecil di kaca kanan.
            if (rightW > 26) {
                c.fillStyle = '#f8fafc';
                c.fillRect(rightX + 8, gwTop + 2, 7, 8);
                c.fillStyle = '#f59e0b';
                c.fillRect(rightX + 9, gwTop + 3, 5, 2);
                c.fillStyle = 'rgba(15,23,42,0.35)';
                c.fillRect(rightX + 9, gwTop + 6, 5, 1);
                c.fillRect(rightX + 9, gwTop + 8, 4, 1);
            }

            // Pintu masuk (lebih tinggi dari karakter ~34 px).
            const doorH = 38;
            const doorTop = base - doorH;
            c.fillStyle = 'rgba(15,23,42,0.28)';
            c.fillRect(dcx - dw / 2 - 5, doorTop - 3, dw + 10, doorH + 3);
            c.fillStyle = '#0f172a';
            c.fillRect(dcx - dw / 2 - 3, doorTop - 2, dw + 6, doorH + 2);
            c.fillStyle = '#8b5a2b';
            c.fillRect(dcx - dw / 2, doorTop, dw, doorH);
            c.fillStyle = '#b7dff2';
            c.fillRect(dcx - dw / 2 + 3, doorTop + 5, dw / 2 - 5, doorH - 12);
            c.fillRect(dcx + 2, doorTop + 5, dw / 2 - 5, doorH - 12);
            c.fillStyle = '#475569';
            c.fillRect(dcx - 1, doorTop + 4, 2, doorH - 10);
            c.fillStyle = 'rgba(255,255,255,0.35)';
            c.fillRect(dcx - dw / 2 + 4, doorTop + 7, 5, 10);
            c.fillRect(dcx + 3, doorTop + 7, 5, 10);
            c.fillStyle = '#fde68a';
            c.fillRect(dcx - 6, doorTop + 24, 2, 4);
            c.fillRect(dcx + 4, doorTop + 24, 2, 4);

            // Kanopi pintu: pelat metal tipis tepat di atas pintu.
            c.fillStyle = 'rgba(15,23,42,0.22)';
            c.fillRect(dcx - 36, doorTop - 2, 72, 2);
            c.fillStyle = '#334155';
            c.fillRect(dcx - 35, doorTop - 4, 70, 4);
            c.fillStyle = '#cbd5e1';
            c.fillRect(dcx - 35, doorTop - 4, 70, 1);
            c.fillStyle = '#94a3b8';
            c.fillRect(dcx - 35, doorTop - 1, 70, 1);

            // Tangga masuk.
            c.fillStyle = '#cbd5e1';
            c.fillRect(dcx - 26, base, 52, 3);
            c.fillStyle = '#94a3b8';
            c.fillRect(dcx - 26, base + 3, 52, 2);
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(dcx - 26, base + 5, 52, 1);

            // Papan nama + jumlah lantai di atas pintu.
            const bwd = 64;
            const bx = dcx - bwd / 2;
            const byy = base - 55;
            c.fillStyle = 'rgba(15,23,42,0.22)';
            c.fillRect(bx + 2, byy + 2, bwd, 13);
            c.fillStyle = '#16324f';
            c.fillRect(bx, byy, bwd, 13);
            c.fillStyle = '#cbd5e1';
            c.fillRect(bx, byy, bwd, 1);
            c.fillStyle = '#facc15';
            c.fillRect(bx, byy + 1, bwd, 1);
            // Emblem sekolah.
            c.fillStyle = '#facc15';
            c.beginPath();
            c.arc(bx + 9, byy + 7, 4, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#16324f';
            c.font = '3px monospace';
            c.textAlign = 'center';
            c.fillText('TI', bx + 9, byy + 8.2);
            c.fillStyle = '#ffffff';
            c.font = 'bold 6px monospace';
            c.fillText(label, bx + bwd / 2 + 5, byy + 7);
            c.fillStyle = '#facc15';
            c.font = '4px monospace';
            c.fillText(
                roof ? `${floors} LANTAI + ROOFTOP` : `${floors} LANTAI`,
                bx + bwd / 2 + 5,
                byy + 11.5,
            );
            c.textAlign = 'left';
            c.fillStyle = '#94a3b8';
            c.fillRect(bx + 2, byy + 2, 1, 1);
            c.fillRect(bx + bwd - 3, byy + 2, 1, 1);

            // Pipa talang vertikal.
            const pipe = (px: number): void => {
                c.fillStyle = 'rgba(15,23,42,0.18)';
                c.fillRect(px + 1, bodyTop + 1, 2, base - bodyTop - 6);
                c.fillStyle = '#94a3b8';
                c.fillRect(px, bodyTop + 1, 2, base - bodyTop - 6);
                c.fillStyle = '#cbd5e1';
                c.fillRect(px, bodyTop + 1, 1, base - bodyTop - 6);
                c.fillStyle = '#64748b';

                for (let py = bodyTop + 6; py < base - 8; py += 18) {
                    c.fillRect(px - 1, py, 4, 1);
                }
            };

            pipe(x0 + 8);
            pipe(x1 - 10);

            // Pot tanaman di sisi pintu.
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(x1 - 19, base - 4, 9, 3);
            c.fillStyle = '#b45309';
            c.fillRect(x1 - 18, base - 6, 7, 5);
            c.fillStyle = '#166534';
            c.fillRect(x1 - 19, base - 12, 9, 6);
            c.fillStyle = '#22c55e';
            c.fillRect(x1 - 18, base - 13, 3, 5);
            c.fillRect(x1 - 13, base - 11, 3, 4);

            // ---- Atap ----
            c.fillStyle = '#d7dce8';
            c.fillRect(x0 - 2, top, bw + 4, roofH);
            c.fillStyle = '#f8fafc';
            c.fillRect(x0 - 2, top, bw + 4, 1);
            c.fillStyle = '#c3ccd9';
            c.fillRect(x0 - 2, top + roofH - 2, bw + 4, 2);
            c.fillStyle = 'rgba(15,23,42,0.18)';
            c.fillRect(x0, bodyTop, bw, 1);
            c.fillStyle = '#c3ccd9';

            for (let px = x0 + 24; px < x1; px += 24) {
                c.fillRect(px, top + 2, 1, roofH - 4);
            }

            if (roof) {
                // Pagar rooftop.
                c.fillStyle = '#e2e8f0';

                for (let px = x0 + 10; px < x1 - 6; px += 16) {
                    c.fillRect(px, top - 5, 1, 5);
                }

                c.fillRect(x0 + 8, top - 5, bw - 16, 1);

                // Tangki air.
                c.fillStyle = '#64748b';
                c.fillRect(x0 + 20, top - 10, 26, 10);
                c.fillStyle = '#94a3b8';
                c.fillRect(x0 + 21, top - 9, 24, 8);
                c.fillStyle = '#cbd5e1';
                c.fillRect(x0 + 21, top - 9, 24, 2);
                c.fillStyle = 'rgba(255,255,255,0.35)';
                c.fillRect(x0 + 22, top - 8, 2, 6);
                c.fillStyle = '#475569';
                c.fillRect(x0 + 24, top - 2, 1, 2);
                c.fillRect(x0 + 40, top - 2, 1, 2);
                c.fillRect(x0 + 30, top - 2, 6, 1);

                // AC.
                c.fillStyle = '#475569';
                c.fillRect(x1 - 80, top - 7, 17, 7);
                c.fillStyle = '#cbd5e1';
                c.fillRect(x1 - 79, top - 6, 15, 5);
                c.fillStyle = '#e2e8f0';
                c.fillRect(x1 - 79, top - 6, 15, 1);
                c.fillStyle = 'rgba(15,23,42,0.25)';
                c.fillRect(x1 - 77, top - 4, 11, 1);
                c.fillRect(x1 - 77, top - 2, 11, 1);
                c.fillStyle = '#64748b';
                c.fillRect(x1 - 73, top - 1, 2, 2);

                // Antena.
                c.fillStyle = '#cbd5e1';
                c.fillRect(x1 - 37, top - 18, 2, 18);
                c.fillRect(x1 - 42, top - 12, 12, 1);
                c.fillRect(x1 - 40, top - 8, 8, 1);
                c.fillRect(x1 - 39, top - 5, 6, 1);
                c.fillStyle = '#ef4444';
                c.fillRect(x1 - 38, top - 19, 4, 2);

                // Vent pipa.
                c.fillStyle = '#64748b';
                c.fillRect(x1 - 30, top - 5, 3, 5);
                c.fillStyle = '#94a3b8';
                c.fillRect(x1 - 32, top - 6, 7, 1);
            } else {
                // AC + tangki kecil di atap datar.
                c.fillStyle = '#475569';
                c.fillRect(x0 + 19, top - 7, 17, 7);
                c.fillStyle = '#cbd5e1';
                c.fillRect(x0 + 20, top - 6, 15, 5);
                c.fillStyle = '#e2e8f0';
                c.fillRect(x0 + 20, top - 6, 15, 1);
                c.fillStyle = 'rgba(15,23,42,0.25)';
                c.fillRect(x0 + 22, top - 4, 11, 1);
                c.fillRect(x0 + 22, top - 2, 11, 1);
                c.fillStyle = '#64748b';
                c.fillRect(x0 + 26, top - 1, 2, 2);

                // Tangki.
                c.fillStyle = '#64748b';
                c.fillRect(x1 - 50, top - 10, 20, 10);
                c.fillStyle = '#94a3b8';
                c.fillRect(x1 - 49, top - 9, 18, 8);
                c.fillStyle = '#cbd5e1';
                c.fillRect(x1 - 49, top - 9, 18, 2);
                c.fillStyle = 'rgba(255,255,255,0.35)';
                c.fillRect(x1 - 48, top - 8, 2, 6);
                c.fillStyle = '#475569';
                c.fillRect(x1 - 45, top - 2, 1, 2);
                c.fillRect(x1 - 39, top - 2, 1, 2);

                // Pipa ventilasi.
                c.fillStyle = '#475569';
                c.fillRect(x0 + bw - 30, top - 5, 2, 5);
                c.fillStyle = '#94a3b8';
                c.fillRect(x0 + bw - 32, top - 6, 6, 1);
            }
        };

        // ===== Gedung A: tampak 3/4, fasad utama pendek menghadap kiri =====
        // Dinding barat (kiri) adalah fasad utama pendek dengan 1 pintu;
        // dinding selatan adalah sisi panjang tempat papan nama + kantin.
        const drawGedungA = (): void => {
            const base = 204;
            const swx = 130;
            const sex = 305;
            const bwx = 80;
            const bwy = 170;
            const bex = bwx + (sex - swx);
            const frontTop = 79;
            const backTop = 45;
            const sideX = bwx - swx;
            const sideY = bwy - base;

            const sidePoint = (
                t: number,
                lift = 0,
            ): { x: number; y: number } => ({
                x: swx + sideX * t,
                y: base + sideY * t - lift,
            });

            const sideQuad = (
                t0: number,
                t1: number,
                lift: number,
                h: number,
            ): void => {
                const a = sidePoint(t0, lift);
                const b = sidePoint(t1, lift);
                c.beginPath();
                c.moveTo(a.x, a.y);
                c.lineTo(b.x, b.y);
                c.lineTo(b.x, b.y - h);
                c.lineTo(a.x, a.y - h);
                c.closePath();
            };

            const fillSide = (
                t0: number,
                t1: number,
                lift: number,
                h: number,
                color: string,
            ): void => {
                sideQuad(t0, t1, lift, h);
                c.fillStyle = color;
                c.fill();
            };

            // Bayangan tapak gedung.
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.beginPath();
            c.moveTo(swx + 6, base + 6);
            c.lineTo(sex + 6, base + 6);
            c.lineTo(bex + 6, bwy + 6);
            c.lineTo(bwx + 6, bwy + 6);
            c.closePath();
            c.fill();

            // Jalur masuk dari kiri ke pintu utama fasad barat.
            c.fillStyle = '#b9c4d2';
            c.fillRect(96, 200, 112, 10);
            c.fillStyle = '#dbe3ee';
            c.fillRect(96, 200, 112, 2);
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(96, 209, 112, 1);

            for (let px = 106; px < 206; px += 14) {
                c.fillRect(px, 202, 1, 7);
            }

            // Panah kecil di jalur.
            c.fillStyle = '#facc15';
            c.fillRect(100, 204, 12, 2);
            c.beginPath();
            c.moveTo(114, 205);
            c.lineTo(108, 201);
            c.lineTo(108, 209);
            c.closePath();
            c.fill();

            // Dinding barat (fasad utama, menghadap kiri).
            c.fillStyle = '#e2e9f2';
            c.beginPath();
            c.moveTo(swx, base);
            c.lineTo(bwx, bwy);
            c.lineTo(bwx, backTop);
            c.lineTo(swx, frontTop);
            c.closePath();
            c.fill();

            // Dinding selatan (ujung gedung, menghadap halaman).
            c.fillStyle = '#f5f8fc';
            c.fillRect(swx, frontTop, sex - swx, base - frontTop);

            // Plint bawah + slab lantai + bayangan atap pada fasad barat.
            fillSide(0, 1, 0, 3, '#aab6c6');
            fillSide(0, 1, 54, 2, '#cbd5e1');
            fillSide(0, 1, 53, 1, 'rgba(15,23,42,0.12)');
            fillSide(0, 1, 121, 4, '#64748b');
            fillSide(0, 1, 120, 1, '#94a3b8');

            // Sudut vertikal fasad barat.
            const c0 = sidePoint(0);
            const c1 = sidePoint(1);
            c.fillStyle = 'rgba(15,23,42,0.22)';
            c.fillRect(c0.x - 1, c0.y - 125, 2, 125);
            c.fillRect(c1.x - 1, c1.y - 125, 2, 125);
            c.fillStyle = 'rgba(255,255,255,0.5)';
            c.fillRect(c0.x + 1, c0.y - 124, 1, 122);

            // Jendela lantai atas fasad barat.
            for (const t0 of [0.05, 0.29, 0.53, 0.77]) {
                const t1 = t0 + 0.14;
                fillSide(t0, t1, 72, 22, '#64748b');
                fillSide(t0 + 0.008, t1 - 0.008, 73, 20, '#bfe8fb');
                fillSide(t0 + 0.008, t1 - 0.008, 73, 3, '#7dd3fc');
                fillSide(t0 + 0.02, t1 - 0.02, 92, 1, 'rgba(255,255,255,0.55)');
                fillSide(
                    (t0 + t1) / 2 - 0.003,
                    (t0 + t1) / 2 + 0.003,
                    73,
                    20,
                    '#64748b',
                );
                fillSide(t0, t1, 71, 1, '#f8fafc');
            }

            // Jendela kaca lantai dasar di sisi pintu utama.
            for (const [t0, t1] of [
                [0.03, 0.27],
                [0.73, 0.97],
            ]) {
                fillSide(t0, t1, 8, 26, '#64748b');
                fillSide(t0 + 0.008, t1 - 0.008, 9, 24, '#a9e0f7');
                fillSide(
                    t0 + 0.008,
                    t1 - 0.008,
                    9,
                    3,
                    'rgba(255,255,255,0.45)',
                );
                fillSide(
                    (t0 + t1) / 2 - 0.003,
                    (t0 + t1) / 2 + 0.003,
                    9,
                    24,
                    '#64748b',
                );
                fillSide(t0, t1, 7, 1, '#e2e8f0');
            }

            // Satu pintu utama, di tengah fasad pendek.
            for (const [t0, t1] of [[0.37, 0.63]] as const) {
                fillSide(t0, t1, 0, 38, '#0f172a');
                fillSide(t0 + 0.01, t1 - 0.01, 1, 36, '#8b5a2b');
                fillSide(t0 + 0.025, t1 - 0.055, 12, 20, '#b7dff2');
                fillSide(
                    t0 + 0.025,
                    t1 - 0.055,
                    30,
                    2,
                    'rgba(255,255,255,0.45)',
                );
                fillSide(
                    (t0 + t1) / 2 - 0.003,
                    (t0 + t1) / 2 + 0.003,
                    1,
                    36,
                    '#6d4a1e',
                );

                const knob = sidePoint(t1 - 0.03, 17);
                c.fillStyle = '#fde68a';
                c.fillRect(knob.x - 1, knob.y, 2, 2);

                // Kanopi miring ke kiri.
                const ca = sidePoint(t0, 39);
                const cb = sidePoint(t1, 39);
                c.fillStyle = 'rgba(15,23,42,0.22)';
                c.beginPath();
                c.moveTo(ca.x - 5, ca.y + 2);
                c.lineTo(cb.x - 5, cb.y + 2);
                c.lineTo(cb.x, cb.y);
                c.lineTo(ca.x, ca.y);
                c.closePath();
                c.fill();
                c.fillStyle = '#334155';
                c.beginPath();
                c.moveTo(ca.x - 5, ca.y);
                c.lineTo(cb.x - 5, cb.y);
                c.lineTo(cb.x, cb.y - 2);
                c.lineTo(ca.x, ca.y - 2);
                c.closePath();
                c.fill();
                c.fillStyle = '#cbd5e1';
                c.beginPath();
                c.moveTo(ca.x - 5, ca.y);
                c.lineTo(cb.x - 5, cb.y);
                c.lineTo(cb.x - 5, cb.y + 1);
                c.lineTo(ca.x - 5, ca.y + 1);
                c.closePath();
                c.fill();

                // Undakan kecil di depan pintu.
                const sa = sidePoint(t0, 0);
                const sb = sidePoint(t1, 0);
                c.fillStyle = 'rgba(15,23,42,0.18)';
                c.beginPath();
                c.moveTo(sa.x - 5, sa.y + 5);
                c.lineTo(sb.x + 2, sb.y + 5);
                c.lineTo(sb.x, sb.y);
                c.lineTo(sa.x, sa.y);
                c.closePath();
                c.fill();
                c.fillStyle = '#cbd5e1';
                c.beginPath();
                c.moveTo(sa.x - 4, sa.y + 3);
                c.lineTo(sb.x + 1, sb.y + 3);
                c.lineTo(sb.x, sb.y);
                c.lineTo(sa.x, sa.y);
                c.closePath();
                c.fill();
                c.fillStyle = '#94a3b8';
                c.beginPath();
                c.moveTo(sa.x - 4, sa.y + 3);
                c.lineTo(sb.x + 1, sb.y + 3);
                c.lineTo(sb.x + 1, sb.y + 4);
                c.lineTo(sa.x - 4, sa.y + 4);
                c.closePath();
                c.fill();
            }

            // Papan nama di ujung selatan.
            const bwd = 38;
            const bx = 224;
            const byy = 148;
            c.fillStyle = 'rgba(15,23,42,0.22)';
            c.fillRect(bx + 2, byy + 2, bwd, 13);
            c.fillStyle = '#16324f';
            c.fillRect(bx, byy, bwd, 13);
            c.fillStyle = '#cbd5e1';
            c.fillRect(bx, byy, bwd, 1);
            c.fillStyle = '#facc15';
            c.fillRect(bx, byy + 1, bwd, 1);
            c.beginPath();
            c.arc(bx + 7, byy + 7, 4, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#16324f';
            c.font = '3px monospace';
            c.textAlign = 'center';
            c.fillText('TI', bx + 7, byy + 8.2);
            c.fillStyle = '#ffffff';
            c.font = 'bold 4.5px monospace';
            c.fillText('GEDUNG A', bx + 24, byy + 6.8);
            c.fillStyle = '#facc15';
            c.font = '3.5px monospace';
            c.fillText('2 LANTAI', bx + 24, byy + 11);
            c.textAlign = 'left';

            // Jendela lantai atas sisi panjang (selatan), teluk kiri.
            c.fillStyle = '#64748b';
            c.fillRect(136, 108, 20, 26);
            c.fillStyle = '#bfe8fb';
            c.fillRect(137, 109, 18, 24);
            c.fillStyle = '#7dd3fc';
            c.fillRect(137, 129, 18, 4);
            c.fillStyle = 'rgba(255,255,255,0.55)';
            c.fillRect(138, 110, 3, 3);
            c.fillStyle = '#64748b';
            c.fillRect(146, 109, 1, 24);
            c.fillStyle = '#f8fafc';
            c.fillRect(136, 134, 20, 1);
            c.fillStyle = 'rgba(15,23,42,0.14)';
            c.fillRect(136, 135, 20, 1);

            c.fillStyle = '#64748b';
            c.fillRect(174, 108, 40, 26);
            c.fillStyle = '#bfe8fb';
            c.fillRect(175, 109, 38, 24);
            c.fillStyle = '#7dd3fc';
            c.fillRect(175, 129, 38, 4);
            c.fillStyle = 'rgba(255,255,255,0.55)';
            c.fillRect(176, 110, 4, 4);
            c.fillStyle = '#64748b';
            c.fillRect(194, 109, 1, 24);
            c.fillStyle = '#f8fafc';
            c.fillRect(174, 134, 40, 1);
            c.fillStyle = 'rgba(15,23,42,0.14)';
            c.fillRect(174, 135, 40, 1);

            c.fillStyle = '#64748b';
            c.fillRect(236, 108, 48, 26);
            c.fillStyle = '#bfe8fb';
            c.fillRect(237, 109, 46, 24);
            c.fillStyle = '#7dd3fc';
            c.fillRect(237, 129, 46, 4);
            c.fillStyle = 'rgba(255,255,255,0.55)';
            c.fillRect(238, 110, 4, 4);
            c.fillStyle = '#64748b';
            c.fillRect(260, 109, 1, 24);
            c.fillStyle = '#f8fafc';
            c.fillRect(236, 134, 48, 1);
            c.fillStyle = 'rgba(15,23,42,0.14)';
            c.fillRect(236, 135, 48, 1);

            // Jendela kaca lantai dasar sisi panjang, teluk kiri.
            c.fillStyle = '#64748b';
            c.fillRect(136, 168, 20, 30);
            c.fillStyle = '#a9e0f7';
            c.fillRect(137, 169, 18, 28);
            c.fillStyle = 'rgba(255,255,255,0.42)';
            c.fillRect(137, 169, 18, 2);
            c.fillStyle = '#64748b';
            c.fillRect(146, 169, 1, 28);
            c.fillRect(147, 182, 9, 1);
            c.fillStyle = '#f8fafc';
            c.fillRect(136, 198, 20, 1);
            c.fillStyle = 'rgba(15,23,42,0.14)';
            c.fillRect(136, 199, 20, 1);

            c.fillStyle = '#64748b';
            c.fillRect(174, 168, 40, 30);
            c.fillStyle = '#a9e0f7';
            c.fillRect(175, 169, 38, 28);
            c.fillStyle = 'rgba(255,255,255,0.42)';
            c.fillRect(175, 169, 38, 2);
            c.fillStyle = '#64748b';
            c.fillRect(192, 169, 1, 28);
            c.fillRect(193, 182, 20, 1);
            c.fillStyle = '#f8fafc';
            c.fillRect(174, 198, 40, 1);
            c.fillStyle = 'rgba(15,23,42,0.14)';
            c.fillRect(174, 199, 40, 1);

            c.fillStyle = '#64748b';
            c.fillRect(224, 168, 40, 30);
            c.fillStyle = '#a9e0f7';
            c.fillRect(225, 169, 38, 28);
            c.fillStyle = 'rgba(255,255,255,0.42)';
            c.fillRect(225, 169, 38, 2);
            c.fillStyle = '#64748b';
            c.fillRect(242, 169, 1, 28);
            c.fillRect(243, 182, 20, 1);
            c.fillStyle = '#f8fafc';
            c.fillRect(224, 198, 40, 1);
            c.fillStyle = 'rgba(15,23,42,0.14)';
            c.fillRect(224, 199, 40, 1);

            // Slab dan sudut dinding selatan.
            c.fillStyle = '#cbd5e1';
            c.fillRect(swx, 146, sex - swx, 2);
            c.fillStyle = 'rgba(15,23,42,0.12)';
            c.fillRect(swx, 148, sex - swx, 1);
            c.fillStyle = 'rgba(15,23,42,0.18)';
            c.fillRect(swx, frontTop, 3, base - frontTop);
            c.fillRect(sex - 3, frontTop, 3, base - frontTop);
            c.fillStyle = '#64748b';
            c.fillRect(swx, frontTop, sex - swx, 3);
            c.fillStyle = 'rgba(15,23,42,0.18)';
            c.fillRect(swx, frontTop + 3, sex - swx, 2);

            // Atap datar perspektif.
            const roofGrad = c.createLinearGradient(0, frontTop, 0, backTop);
            roofGrad.addColorStop(0, '#55657c');
            roofGrad.addColorStop(0.55, '#7c8da4');
            roofGrad.addColorStop(1, '#b9c5d4');
            c.fillStyle = roofGrad;
            c.beginPath();
            c.moveTo(swx, frontTop);
            c.lineTo(sex, frontTop);
            c.lineTo(bex, backTop);
            c.lineTo(bwx, backTop);
            c.closePath();
            c.fill();

            // Garis genteng/panel atap.
            c.strokeStyle = 'rgba(30,41,59,0.20)';
            c.lineWidth = 1;

            for (let t = 0.1; t < 1; t += 0.12) {
                c.beginPath();
                c.moveTo(swx + (sex - swx) * t, frontTop);
                c.lineTo(bwx + (bex - bwx) * t, backTop);
                c.stroke();
            }

            for (let s = 0.18; s < 1; s += 0.18) {
                c.beginPath();
                c.moveTo(
                    swx + (bwx - swx) * s,
                    frontTop + (backTop - frontTop) * s,
                );
                c.lineTo(
                    sex + (bex - sex) * s,
                    frontTop + (backTop - frontTop) * s,
                );
                c.stroke();
            }

            // Parapet atap.
            c.strokeStyle = '#dbe3ee';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(swx, frontTop);
            c.lineTo(sex, frontTop);
            c.lineTo(bex, backTop);
            c.lineTo(bwx, backTop);
            c.closePath();
            c.stroke();
            c.strokeStyle = 'rgba(15,23,42,0.35)';
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(swx + 2, frontTop + 2);
            c.lineTo(sex - 2, frontTop + 2);
            c.stroke();

            // Unit atap.
            c.fillStyle = 'rgba(15,23,42,0.18)';
            c.fillRect(184, 62, 24, 3);
            c.fillStyle = '#64748b';
            c.fillRect(184, 56, 24, 7);
            c.fillStyle = '#94a3b8';
            c.fillRect(185, 57, 22, 5);
            c.fillStyle = '#cbd5e1';
            c.fillRect(185, 57, 22, 1);
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(255, 77, 18, 2);
            c.fillStyle = '#475569';
            c.fillRect(255, 72, 18, 5);
            c.fillStyle = '#cbd5e1';
            c.fillRect(256, 73, 16, 3);

            // Plang masuk kecil di jalur.
            c.fillStyle = 'rgba(15,23,42,0.22)';
            c.fillRect(74, 191, 24, 7);
            c.fillStyle = '#16324f';
            c.fillRect(72, 190, 24, 7);
            c.fillStyle = '#facc15';
            c.fillRect(72, 190, 24, 1);
            c.font = '3px monospace';
            c.textAlign = 'center';
            c.fillText('MASUK', 84, 195);
            c.textAlign = 'left';
        };

        drawGedungA();
        drawGedung(380, 550, 'GEDUNG B', 5, true);

        // ===== Kantin menempel di dinding luar lantai 1 Gedung A =====
        // Bukaan saji di dinding selatan Gedung A (sisi halaman).
        c.fillStyle = '#efe4cf';
        c.fillRect(266, 148, 39, 56);
        c.fillStyle = '#e2d3b6';
        c.fillRect(266, 148, 39, 1);
        c.fillStyle = 'rgba(15,23,42,0.12)';
        c.fillRect(266, 148, 39, 4);
        c.fillStyle = 'rgba(15,23,42,0.18)';
        c.fillRect(304, 148, 1, 56);

        // Papan nama kantin di tembok, di bawah slab lantai 2.
        c.fillStyle = '#16324f';
        c.fillRect(267, 150, 36, 10);
        c.fillStyle = '#facc15';
        c.fillRect(267, 150, 36, 1);
        c.fillStyle = '#ffffff';
        c.font = 'bold 5px monospace';
        c.textAlign = 'center';
        c.fillText('KANTIN', 285, 156);
        c.fillStyle = '#facc15';
        c.font = '3px monospace';
        c.fillText('WARUNG TEKNOLOGI', 285, 158.5);
        c.textAlign = 'left';

        // Awning kecil menempel di tembok, tanpa tiang berdiri sendiri.
        c.fillStyle = 'rgba(15,23,42,0.2)';
        c.fillRect(266, 165, 39, 2);
        c.fillStyle = '#5b2c14';
        c.fillRect(266, 160, 39, 5);
        c.fillStyle = '#8a4b24';
        c.fillRect(266, 160, 39, 1);
        c.fillStyle = '#facc15';
        c.fillRect(266, 160, 39, 1);
        c.fillStyle = '#334155';
        c.fillRect(269, 165, 2, 3);
        c.fillRect(302, 165, 2, 3);

        // Bukaan/jendela saji dengan etalase dan counter.
        c.fillStyle = '#3b2a1a';
        c.fillRect(269, 167, 32, 27);
        c.fillStyle = '#5f3b1c';
        c.fillRect(270, 168, 30, 25);
        c.fillStyle = '#8a4b24';
        c.fillRect(270, 168, 30, 3);
        c.fillStyle = '#fde68a';
        c.fillRect(283, 168, 3, 3);
        c.fillStyle = 'rgba(253,224,71,0.18)';
        c.beginPath();
        c.arc(284.5, 172, 6, 0, Math.PI * 2);
        c.fill();

        // Menu tempel di kiri bukaan.
        c.fillStyle = '#0f172a';
        c.fillRect(272, 172, 9, 13);
        c.fillStyle = '#fde047';
        c.font = '2px monospace';
        c.fillText('MENU', 273, 175);
        c.fillStyle = '#e2e8f0';
        c.fillRect(273, 177, 7, 1);
        c.fillRect(273, 179, 6, 1);
        c.fillRect(273, 181, 7, 1);

        // Etalase kaca + lauk.
        c.fillStyle = '#334155';
        c.fillRect(283, 178, 17, 16);
        c.fillStyle = 'rgba(191,225,245,0.82)';
        c.fillRect(284, 179, 15, 14);
        c.fillStyle = 'rgba(255,255,255,0.55)';
        c.fillRect(284, 179, 14, 1);
        const foods = [
            '#f59e0b',
            '#dc2626',
            '#84cc16',
            '#f97316',
            '#eab308',
            '#38bdf8',
        ];

        for (let i = 0; i < 3; i++) {
            c.fillStyle = foods[i % foods.length];
            c.fillRect(285, 182 + i * 4, 5, 2);
            c.fillStyle = foods[(i + 2) % foods.length];
            c.fillRect(292, 182 + i * 4, 5, 2);
        }

        // Uap makanan.
        c.fillStyle = 'rgba(255,255,255,0.28)';
        c.fillRect(291, 171, 2, 3);
        c.fillRect(294, 169, 2, 3);

        // Counter kayu yang menonjol sedikit dari tembok.
        c.fillStyle = '#b07a3e';
        c.fillRect(267, 194, 37, 3);
        c.fillStyle = '#8b5a2b';
        c.fillRect(267, 197, 37, 4);
        c.fillStyle = '#6d4a1e';

        for (let px = 271; px < 303; px += 7) {
            c.fillRect(px, 197, 1, 4);
        }

        // Papan BUKA kecil di counter.
        c.fillStyle = '#14532d';
        c.fillRect(292, 196, 10, 3);
        c.fillStyle = '#4ade80';
        c.font = '2px monospace';
        c.textAlign = 'center';
        c.fillText('BUKA', 297, 198.3);
        c.textAlign = 'left';

        // Teras kecil di luar tembok, tempat meja murid.
        c.fillStyle = 'rgba(15,23,42,0.14)';
        c.fillRect(258, 204, 54, 45);
        c.fillStyle = '#c9b38c';
        c.fillRect(262, 204, 46, 42);
        c.fillStyle = 'rgba(255,255,255,0.30)';
        c.fillRect(262, 204, 46, 1);
        c.fillStyle = 'rgba(90,64,36,0.16)';

        for (let px = 274; px < 308; px += 18) {
            c.fillRect(px, 204, 1, 42);
        }

        for (let py = 218; py < 246; py += 18) {
            c.fillRect(262, py, 46, 1);
        }

        c.fillStyle = '#8a6f47';
        c.fillRect(262, 204, 1, 42);
        c.fillRect(307, 204, 1, 42);
        c.fillRect(262, 245, 46, 1);

        // Undakan pendek ke halaman.
        c.fillStyle = '#b49a6e';
        c.fillRect(262, 246, 46, 3);
        c.fillStyle = '#8a6f47';
        c.fillRect(262, 246, 46, 1);
        c.fillStyle = 'rgba(15,23,42,0.18)';
        c.fillRect(262, 249, 46, 2);

        // Meja bundar + bangku di teras.
        for (const t of [
            { x: 276, y: 218 },
            { x: 296, y: 232 },
        ]) {
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.beginPath();
            c.ellipse(t.x, t.y + 6, 9, 3, 0, 0, Math.PI * 2);
            c.fill();

            // Kursi belakang.
            c.fillStyle = '#8a5a2e';
            c.beginPath();
            c.arc(t.x, t.y - 8, 3, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#a4713e';
            c.beginPath();
            c.arc(t.x, t.y - 8, 2, 0, Math.PI * 2);
            c.fill();

            // Bangku kiri/kanan.
            for (const dx of [-10, 10]) {
                c.fillStyle = '#8a5a2e';
                c.beginPath();
                c.arc(t.x + dx, t.y + 3, 3, 0, Math.PI * 2);
                c.fill();
            }

            c.fillStyle = '#b98a52';
            c.beginPath();
            c.arc(t.x, t.y, 7, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#e0c093';
            c.beginPath();
            c.arc(t.x, t.y, 5, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = 'rgba(120,72,32,0.28)';
            c.fillRect(t.x - 4, t.y - 2, 8, 1);
            c.fillRect(t.x - 4, t.y + 2, 8, 1);
            c.fillStyle = '#f8fafc';
            c.fillRect(t.x - 1, t.y - 1, 2, 2);

            // Bangku depan.
            c.fillStyle = '#8a5a2e';
            c.fillRect(t.x - 6, t.y + 8, 12, 3);
            c.fillStyle = '#b07a3e';
            c.fillRect(t.x - 6, t.y + 8, 12, 1);
            c.fillStyle = '#6d4a1e';
            c.fillRect(t.x - 5, t.y + 11, 1, 3);
            c.fillRect(t.x + 4, t.y + 11, 1, 3);
        }

        // Tempat sampah di ujung teras.
        c.fillStyle = 'rgba(15,23,42,0.16)';
        c.fillRect(262, 241, 8, 2);
        c.fillStyle = '#64748b';
        c.fillRect(263, 234, 7, 7);
        c.fillStyle = '#94a3b8';
        c.fillRect(262, 232, 9, 2);

        // Banner vertikal brand di lorong antar gedung.
        c.fillStyle = '#16324f';
        c.fillRect(348, 60, 22, 86);
        c.fillStyle = '#facc15';
        c.fillRect(348, 60, 22, 3);
        c.save();
        c.translate(359, 103);
        c.rotate(Math.PI / 2);
        c.fillStyle = '#facc15';
        c.font = '5px monospace';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('EKONOMI KREATIF', 0, 0);
        c.restore();

        // Lorong antar gedung: semak kecil dua sisi (Bu Sari di tengah).
        for (const bx of [376]) {
            c.fillStyle = '#255230';
            c.fillRect(bx, 192, 16, 10);
            c.fillRect(bx + 3, 188, 10, 14);
            c.fillStyle = '#3f8a52';
            c.fillRect(bx + 3, 190, 10, 4);
        }

        // ===== Label ruang (plang kecil) =====
        const tag = (x: number, y: number, text: string, bg = '#1d4e89') => {
            c.fillStyle = bg;
            const w = text.length * 4 + 8;
            c.fillRect(x, y, w, 9);
            c.fillStyle = '#ffffff';
            c.font = '5px monospace';
            c.textAlign = 'left';
            c.fillText(text, x + 4, y + 6.5);
        };

        tag(38, 268, 'PARKIR', '#374151');

        // ===== Parkiran motor (kanan bawah) =====
        const moto = (x: number, y: number) => {
            c.fillStyle = '#111827';
            c.fillRect(x, y + 6, 10, 3);
            c.fillRect(x + 1, y + 2, 8, 4);
            c.fillStyle = '#ef4444';
            c.fillRect(x + 3, y, 4, 3);
            c.fillStyle = '#374151';
            c.fillRect(x - 1, y + 8, 4, 4);
            c.fillRect(x + 8, y + 8, 4, 4);
        };
        moto(470, 250);
        moto(490, 250);
        moto(510, 250);
        moto(470, 274);
        moto(490, 274);
        moto(510, 274);
        // Parkiran kiri, mengisi bekas area kantin lama.
        moto(72, 236);
        moto(94, 236);
        moto(116, 236);

        // ===== Pohon-pohon halaman =====
        const tree = (x: number, y: number): void => {
            // Lubang tanam berumput dengan lis batu.
            c.fillStyle = '#4e6b3e';
            c.beginPath();
            c.ellipse(x + 11, y + 24, 16, 6, 0, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#668650';
            c.beginPath();
            c.ellipse(x + 11, y + 23, 12, 4, 0, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = 'rgba(148,139,122,0.85)';
            c.lineWidth = 1;
            c.beginPath();
            c.ellipse(x + 11, y + 24, 16, 6, 0, 0, Math.PI * 2);
            c.stroke();

            // Bayangan pohon jatuh ke kanan-bawah.
            c.fillStyle = 'rgba(15,23,42,0.14)';
            c.beginPath();
            c.ellipse(x + 16, y + 27, 13, 3, 0, 0, Math.PI * 2);
            c.fill();

            // Batang.
            c.fillStyle = '#5b3a1e';
            c.fillRect(x + 8, y + 12, 5, 13);
            c.fillStyle = '#7a4c28';
            c.fillRect(x + 8, y + 12, 1, 13);
            c.fillStyle = '#3f2a16';
            c.fillRect(x + 11, y + 15, 1, 10);

            // Kanopi berlapis.
            c.fillStyle = '#244a2d';
            c.beginPath();
            c.ellipse(x + 11, y + 10, 14, 11, 0, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#2f6b3f';
            c.beginPath();
            c.arc(x + 5, y + 8, 8, 0, Math.PI * 2);
            c.fill();
            c.beginPath();
            c.arc(x + 17, y + 9, 8, 0, Math.PI * 2);
            c.fill();
            c.beginPath();
            c.arc(x + 11, y + 4, 8, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#3f8a52';
            c.beginPath();
            c.arc(x + 7, y + 6, 5, 0, Math.PI * 2);
            c.arc(x + 16, y + 7, 5, 0, Math.PI * 2);
            c.arc(x + 11, y + 3, 5, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = 'rgba(120,180,105,0.55)';
            c.fillRect(x + 6, y + 2, 5, 2);
            c.fillRect(x + 14, y + 5, 3, 2);
        };

        const shrub = (x: number, y: number): void => {
            c.fillStyle = 'rgba(15,23,42,0.12)';
            c.fillRect(x, y + 5, 9, 2);
            c.fillStyle = '#2f6b3f';
            c.fillRect(x, y, 9, 7);
            c.fillStyle = '#4f8a52';
            c.fillRect(x + 1, y + 1, 7, 3);
            c.fillStyle = '#7bbd69';
            c.fillRect(x + 2, y, 2, 2);
        };

        tree(20, 132);
        tree(600, 150);
        tree(600, 260);
        tree(20, 292);
        tree(130, 292);
        tree(44, 210);
        tree(44, 274);
        tree(588, 292);
        tree(352, 262);

        shrub(30, 170);
        shrub(47, 188);
        shrub(34, 246);
        shrub(50, 258);
        shrub(586, 174);
        shrub(598, 198);
        shrub(582, 246);
        shrub(596, 270);
        shrub(316, 250);

        // ===== Furnitur & properti halaman =====
        const bench = (x: number, y: number): void => {
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.beginPath();
            c.ellipse(x + 12, y + 13, 15, 4, 0, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#4b5563';
            c.fillRect(x, y + 2, 3, 10);
            c.fillRect(x + 21, y + 2, 3, 10);
            c.fillStyle = '#8a5a2e';
            c.fillRect(x, y + 3, 24, 4);
            c.fillStyle = '#b07a3e';
            c.fillRect(x, y + 3, 24, 1);
            c.fillStyle = '#6d4a1e';
            c.fillRect(x, y + 7, 24, 3);
            c.fillStyle = '#8a5a2e';
            c.fillRect(x, y - 4, 24, 4);
            c.fillStyle = '#b07a3e';
            c.fillRect(x, y - 4, 24, 1);
            c.fillStyle = '#4b5563';
            c.fillRect(x + 2, y, 2, 3);
            c.fillRect(x + 20, y, 2, 3);
        };

        const bin = (x: number, y: number): void => {
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.fillRect(x + 1, y + 10, 10, 2);
            c.fillStyle = '#14532d';
            c.fillRect(x + 1, y + 1, 9, 9);
            c.fillStyle = '#166534';
            c.fillRect(x + 2, y + 2, 7, 7);
            c.fillStyle = '#4ade80';
            c.fillRect(x, y, 11, 2);
            c.fillStyle = '#14532d';
            c.fillRect(x + 5, y + 4, 1, 4);
            c.fillRect(x + 3, y + 6, 5, 1);
        };

        const lamp = (x: number, y: number): void => {
            c.fillStyle = 'rgba(15,23,42,0.16)';
            c.beginPath();
            c.ellipse(x + 4, y + 32, 10, 3, 0, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#6b7280';
            c.fillRect(x + 3, y + 8, 2, 24);
            c.fillStyle = '#9ca3af';
            c.fillRect(x + 3, y + 8, 1, 24);
            c.fillStyle = '#4b5563';
            c.fillRect(x + 1, y + 30, 6, 2);
            c.fillStyle = '#facc15';
            c.fillRect(x, y + 4, 8, 4);
            c.fillStyle = 'rgba(253,224,71,0.18)';
            c.beginPath();
            c.arc(x + 4, y + 8, 9, 0, Math.PI * 2);
            c.fill();
        };

        bench(34, 236);
        bench(582, 236);
        bench(408, 300);
        bin(276, 312);
        bin(332, 312);
        bin(440, 300);
        lamp(66, 296);
        lamp(336, 296);
        lamp(608, 296);

        // Pot di depan gedung B.
        const pot = (x: number): void => {
            c.fillStyle = 'rgba(15,23,42,0.12)';
            c.fillRect(x + 1, 212, 9, 2);
            c.fillStyle = '#9a5b2d';
            c.fillRect(x, 207, 10, 5);
            c.fillStyle = '#c07a42';
            c.fillRect(x, 207, 10, 1);
            c.fillStyle = '#2f6b3f';
            c.fillRect(x - 1, 201, 12, 6);
            c.fillStyle = '#5c9a5a';
            c.fillRect(x + 1, 201, 8, 3);
            c.fillStyle = '#f2c94c';
            c.fillRect(x + 4, 200, 2, 2);
        };

        pot(392);
        pot(514);

        // Papan informasi di lorong antara gedung A dan B.
        c.fillStyle = 'rgba(15,23,42,0.18)';
        c.fillRect(320, 232, 34, 3);
        c.fillStyle = '#6d4a1e';
        c.fillRect(322, 216, 2, 18);
        c.fillRect(350, 216, 2, 18);
        c.fillStyle = '#8a5a2e';
        c.fillRect(320, 214, 34, 18);
        c.fillStyle = '#d6c6a8';
        c.fillRect(322, 216, 30, 14);
        c.fillStyle = '#f8fafc';
        c.fillRect(324, 218, 10, 7);
        c.fillStyle = '#bfdbfe';
        c.fillRect(336, 218, 14, 4);
        c.fillStyle = '#fca5a5';
        c.fillRect(336, 224, 14, 2);
        c.fillStyle = '#64748b';
        c.fillRect(324, 227, 26, 1);

        // Parkir rapi: garis bay + bayangan motor.
        c.fillStyle = 'rgba(255,255,255,0.30)';

        for (const bx of [66, 88, 110, 132]) {
            c.fillRect(bx, 232, 1, 26);
        }

        for (const bx of [464, 486, 508, 530]) {
            c.fillRect(bx, 246, 1, 26);
        }

        c.fillStyle = 'rgba(15,23,42,0.12)';
        c.fillRect(462, 282, 78, 1);

        // Sedikit semak di sepanjang pagar depan.
        for (let i = 0; i < 10; i++) {
            shrub(36 + i * 12, 308);
            shrub(292 + i * 12, 308);
        }

        // ===== Cahaya matahari & kontak bayangan =====
        const light = c.createLinearGradient(0, 0, WORLD_W, WORLD_H);
        light.addColorStop(0, 'rgba(255,238,196,0.10)');
        light.addColorStop(0.45, 'rgba(255,238,196,0.035)');
        light.addColorStop(1, 'rgba(15,23,42,0.10)');
        c.fillStyle = light;
        c.fillRect(0, 0, WORLD_W, WORLD_H);

        c.fillStyle = 'rgba(15,23,42,0.08)';
        c.fillRect(80, 204, 225, 2);
        c.fillRect(380, 204, 170, 2);
    }
    private drawShield(
        c: CanvasRenderingContext2D,
        x: number,
        y: number,
    ): void {
        // Kubah Heksagonal Kristal Benteng Aegis
        c.save();
        const r = 21;
        const cy = y - 11;
        const rot = this.time * 0.4;

        c.globalAlpha = 0.22 + 0.08 * Math.sin(this.time * 8);
        c.fillStyle = '#fbbf24';
        c.beginPath();

        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + rot;
            const px = x + Math.cos(a) * r;
            const py = cy + Math.sin(a) * (r * 0.85);

            if (i === 0) {
                c.moveTo(px, py);
            } else {
                c.lineTo(px, py);
            }
        }

        c.closePath();
        c.fill();

        // Garis tepi heksagonal
        c.globalAlpha = 0.85 + 0.15 * Math.sin(this.time * 8);
        c.strokeStyle = '#fde68a';
        c.lineWidth = 2;
        c.stroke();

        // Garis kisi dalam
        c.globalAlpha = 0.35;
        c.lineWidth = 1;

        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + rot;
            c.beginPath();
            c.moveTo(x, cy);
            c.lineTo(x + Math.cos(a) * r, cy + Math.sin(a) * (r * 0.85));
            c.stroke();
        }

        // Emblem Perisai Salib Aegis di depan
        c.globalAlpha = 0.95;
        c.fillStyle = '#fde68a';
        c.beginPath();
        c.moveTo(x, cy - 6);
        c.lineTo(x + 5, cy - 3);
        c.lineTo(x + 4, cy + 4);
        c.lineTo(x, cy + 8);
        c.lineTo(x - 4, cy + 4);
        c.lineTo(x - 5, cy - 3);
        c.closePath();
        c.fill();
        c.fillStyle = '#b45309';
        c.fillRect(x - 1, cy - 3, 2, 7);
        c.fillRect(x - 3, cy - 1, 6, 2);

        c.restore();
    }

    private drawSpinVortex(
        c: CanvasRenderingContext2D,
        x: number,
        y: number,
        color: string,
    ): void {
        // Pusaran Badai Pedang (Blade Tempest Cyclone)
        c.save();
        c.globalCompositeOperation = 'lighter';
        const a1 = this.time * 22;
        const a2 = a1 + Math.PI;

        // Pusaran angin debu di tanah
        c.globalAlpha = 0.35;
        c.strokeStyle = '#e2e8f0';
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(x, y - 2, 26, 9, 0, 0, Math.PI * 2);
        c.stroke();

        // 2 Bilah Energi Berputar Kencang
        for (const ang of [a1, a2]) {
            c.globalAlpha = 0.9;
            c.strokeStyle = color;
            c.lineWidth = 4;
            c.beginPath();
            c.arc(x, y - 10, 22, ang - 0.7, ang + 0.7);
            c.stroke();

            // Ujung razor putih
            c.strokeStyle = '#ffffff';
            c.lineWidth = 1.5;
            c.beginPath();
            c.arc(x, y - 10, 23, ang - 0.4, ang + 0.65);
            c.stroke();

            // Kilatan bintang
            const tipX = x + Math.cos(ang + 0.65) * 23;
            const tipY = y - 10 + Math.sin(ang + 0.65) * 23;
            c.fillStyle = '#ffffff';
            c.fillRect(tipX - 1, tipY - 1, 3, 3);
        }

        c.restore();
    }

    private drawFadlan(p: Player): boolean {
        const sheet = this.fadlanSheet;

        if (!sheet) {
            return false;
        }

        let frames = FADLAN_ANIM.idle;
        let rate = 0;

        if (!p.alive) {
            frames = FADLAN_ANIM.down;
        } else if (p.jumpT > 0) {
            frames = FADLAN_ANIM.jump;
            rate = 0;
        } else if (p.dodgeT > 0) {
            frames = FADLAN_ANIM.run;
            rate = 18;
        } else if (p.moving) {
            frames = FADLAN_ANIM.walk;
            rate = 9;
        } else if (this.phase === 'victory') {
            frames = FADLAN_ANIM.jump;
        }

        const f =
            frames.length === 1 || rate === 0
                ? frames[0]
                : frames[Math.floor(this.time * rate) % frames.length];
        const dh = 34;
        const dw = (dh * f.w) / f.h;
        const x = Math.round(p.x);
        const groundY = Math.round(p.y);
        const y = Math.round(p.y - this.hopOf(p));
        const c = this.ctx;
        c.fillStyle = 'rgba(0,0,0,0.35)';
        c.fillRect(x - 6, groundY - 1, 12, 3);

        if (p.shieldT > 0) {
            this.drawShield(c, x, y);
        }

        if (p.attackCD > 0.15) {
            c.save();
            c.globalAlpha = 0.8;
            c.strokeStyle = '#c084fc';
            c.lineWidth = 1.5;
            c.beginPath();
            c.arc(x + (p.faceX < 0 ? -16 : 16), y - 18, 9, 0, Math.PI * 2);
            c.stroke();
            c.restore();
        }

        c.save();

        if (p.faceX < 0) {
            c.translate(x, 0);
            c.scale(-1, 1);
            c.drawImage(sheet, f.x, f.y, f.w, f.h, -dw / 2, y - dh + 2, dw, dh);
        } else {
            c.drawImage(
                sheet,
                f.x,
                f.y,
                f.w,
                f.h,
                x - dw / 2,
                y - dh + 2,
                dw,
                dh,
            );
        }

        c.restore();

        const w = 16;
        c.fillStyle = '#020617';
        c.fillRect(x - w / 2, y - 32, w, 3);
        c.fillStyle = p.hp / this.maxHpOf(p) > 0.35 ? '#4ade80' : '#f87171';
        c.fillRect(
            x - w / 2,
            y - 32,
            Math.max(0, (w * p.hp) / this.maxHpOf(p)),
            3,
        );
        c.fillStyle = 'rgba(255,255,255,0.9)';
        c.font = '6px monospace';
        c.textAlign = 'center';
        c.fillText(p.def.name, x, y - 35);

        return true;
    }

    /** Lingkaran emas menempel di kaki hero sendiri: "kamu di sini". */
    private drawSelfMark(p: Player): void {
        const c = this.ctx;
        const x = Math.round(p.x);
        const y = Math.round(p.y);
        const pulse = 1 + Math.sin(this.hudT * 4) * 0.1;

        c.save();
        // Isi lembut seperti sorot tanah.
        c.beginPath();
        c.ellipse(x, y, 8.5 * pulse, 3.4 * pulse, 0, 0, Math.PI * 2);
        c.fillStyle = 'rgba(250,204,21,0.14)';
        c.fill();
        // Cincin emas: setengah bawah tegas, setengah atas tipis.
        c.strokeStyle = '#facc15';
        c.lineWidth = 1.5;
        c.beginPath();
        c.ellipse(x, y, 7.5, 3, 0, Math.PI * 0.06, Math.PI * 0.94);
        c.stroke();
        c.strokeStyle = 'rgba(250,204,21,0.5)';
        c.lineWidth = 1;
        c.beginPath();
        c.ellipse(x, y, 7.5, 3, 0, Math.PI * 1.06, Math.PI * 1.94);
        c.stroke();
        c.restore();
    }

    private drawHero(p: Player): void {
        // Fadlan memakai sprite sheet asli bila sudah termuat.
        if (this.players.indexOf(p) === 1 && this.drawFadlan(p)) {
            return;
        }

        const c = this.ctx;
        let px = p.x;
        let py = p.y;

        // Lunge / recoil animasi saat menyerang
        if (p.attackCD > 0.2) {
            const t = 1 - (p.attackCD - 0.2) / 0.18;

            if (p.def.role === 'Knight' || p.def.role === 'Tank') {
                px += p.faceX * t * 6;
                py += p.faceY * t * 6;
            } else {
                // Archer / Mage: sedikit sentakan recoil ke belakang
                px -= p.faceX * (1 - t) * 2;
                py -= p.faceY * (1 - t) * 2;
            }
        }

        const x = Math.round(px);
        const groundY = Math.round(py);
        const y = Math.round(py - this.hopOf(p));

        // Bayangan.
        c.fillStyle = 'rgba(0,0,0,0.35)';
        c.fillRect(x - 6, groundY - 1, 12, 3);

        // Efek Benteng Aegis
        if (p.shieldT > 0) {
            this.drawShield(c, x, y);
        }

        // Efek Pusaran Badai Pedang
        if (p.spinT > 0) {
            this.drawSpinVortex(c, x, y, p.def.color);
        }

        if (!p.alive) {
            // Tumbang: badan rebah.
            c.fillStyle = p.def.dark;
            c.fillRect(x - 8, y - 6, 16, 5);
            c.fillStyle = '#f5c99b';
            c.fillRect(x + 6, y - 6, 5, 5);
            c.fillStyle = '#1e293b';
            c.fillRect(x + 7, y - 5, 2, 2);

            return;
        }

        const flash = p.hitFlash > 0 && Math.floor(this.time * 20) % 2 === 0;
        const body = flash ? '#ffffff' : p.def.color;
        const dark = flash ? '#ffffff' : p.def.dark;
        const step = p.moving ? (Math.floor(p.walkT) % 2 === 0 ? 1 : -1) : 0;
        const flip = p.faceX < 0 ? -1 : 1;

        // Cape / Jubah Knight (Farrel) di lapisan belakang
        if (p.def.role === 'Knight') {
            c.fillStyle = '#be123c';
            const capeWave = (step !== 0 ? step * 3 : 0) - flip * 3;
            c.beginPath();
            c.moveTo(x - flip * 4, y - 13);
            c.lineTo(x - flip * 7 + capeWave, y - 4);
            c.lineTo(x - flip * 4 + capeWave, y - 2);
            c.lineTo(x - flip * 1, y - 13);
            c.closePath();
            c.fill();
        }

        // Quiver Archer (Fahri) di punggung
        if (p.def.role === 'Archer') {
            // Tabung anak panah di belakang punggung
            c.fillStyle = '#78350f';
            c.fillRect(x - flip * 5, y - 16, 3, 9);
            // Ujung bulu panah cyan menyembul
            c.fillStyle = '#22d3ee';
            c.fillRect(x - flip * 6, y - 19, 2, 3);
            c.fillRect(x - flip * 4, y - 18, 2, 3);
            c.fillStyle = '#ffffff';
            c.fillRect(x - flip * 5, y - 20, 1, 2);
        }

        // Kaki.
        c.fillStyle = '#1e293b';
        c.fillRect(x - 4, y - 5 + (step > 0 ? -1 : 0), 3, 5);
        c.fillRect(x + 1, y - 5 + (step < 0 ? -1 : 0), 3, 5);

        // Outline badan + kepala.
        c.fillStyle = '#0f172a';
        c.fillRect(x - 6, y - 14, 12, 11);
        c.fillRect(x - 5, y - 21, 10, 9);

        // Badan sesuai Role:
        c.fillStyle = body;
        c.fillRect(x - 5, y - 13, 10, 9);
        c.fillStyle = dark;
        c.fillRect(x - 5, y - 6, 10, 2);
        c.fillStyle = 'rgba(255,255,255,0.35)';
        c.fillRect(x - 5, y - 13, 2, 9);

        // Detail Baju & Armor per Role:
        if (p.def.role === 'Archer') {
            // Tali selempang kulit quiver
            c.fillStyle = '#78350f';
            c.fillRect(x - 3, y - 12, 6, 2);
        } else if (p.def.role === 'Mage') {
            // Kalung / sabuk rune
            c.fillStyle = '#fde047';
            c.fillRect(x - 1, y - 10, 2, 3);
            c.fillStyle = '#4338ca';
            c.fillRect(x - 4, y - 7, 8, 2);
        } else if (p.def.role === 'Knight') {
            // Plat dada baja
            c.fillStyle = '#cbd5e1';
            c.fillRect(x - 3, y - 12, 6, 4);
            c.fillStyle = '#be123c';
            c.fillRect(x - 1, y - 11, 2, 3);
        } else if (p.def.role === 'Tank') {
            // Pauldron bahu baja emas tebal
            c.fillStyle = '#fde68a';
            c.fillRect(x - 7, y - 15, 4, 5);
            c.fillRect(x + 3, y - 15, 4, 5);
            c.fillStyle = '#b45309';
            c.fillRect(x - 3, y - 11, 6, 4);
        }

        // Kepala / Wajah.
        c.fillStyle = '#f5c99b';
        c.fillRect(x - 4, y - 20, 8, 7);

        // Helm / Topi / Headgear Peran:
        c.fillStyle = dark;

        if (p.def.role === 'Mage') {
            // Topi penyihir runcing dengan bintang emas
            c.fillRect(x - 5, y - 23, 10, 3);
            c.fillRect(x - 3, y - 26, 6, 3);
            c.fillRect(x - 1, y - 29, 2, 3);
            c.fillStyle = '#fde047';
            c.fillRect(x, y - 25, 2, 2);
        } else if (p.def.role === 'Tank') {
            // Helm tempur besi berat + tanduk emas
            c.fillStyle = '#475569';
            c.fillRect(x - 5, y - 22, 10, 4);
            c.fillStyle = '#fbbf24';
            c.fillRect(x - 6, y - 24, 2, 4);
            c.fillRect(x + 4, y - 24, 2, 4);
            // Visor celah gelap
            c.fillStyle = '#0f172a';
            c.fillRect(x - 4, y - 19, 8, 2);
        } else if (p.def.role === 'Knight') {
            // Helm ksatria dengan bulu jambul merah menyala
            c.fillStyle = '#94a3b8';
            c.fillRect(x - 4, y - 22, 8, 3);
            c.fillStyle = '#fb7185';
            c.fillRect(x - 1, y - 25, 3, 4);
            c.fillRect(x, y - 26, 3, 2);
        } else {
            // Hood / Topi ranger archer
            c.fillRect(x - 5, y - 22, 10, 3);
            c.fillStyle = '#22d3ee';
            c.fillRect(x - flip * 3, y - 24, 2, 3);
        }

        // Mata menghadap arah + kilau (kecuali Tank yang pakai visor).
        if (p.def.role !== 'Tank') {
            c.fillStyle = '#0f172a';
            const ex = flip < 0 ? -1 : 1;
            c.fillRect(x - 2 + ex, y - 18, 2, 3);
            c.fillRect(x + 1 + ex, y - 18, 2, 3);
            c.fillStyle = '#ffffff';
            c.fillRect(x - 2 + ex, y - 18, 1, 1);
            c.fillRect(x + 1 + ex, y - 18, 1, 1);
        }

        // ================= SENJATA & ANIMASI SERANGAN SESUAI ROLE =================
        const isAttacking = p.attackCD > 0;
        const atkProgress = isAttacking ? 1 - p.attackCD / 0.38 : 0;

        if (p.def.role === 'Archer') {
            // SENJATA ARCHER: Busur Lengkung (Recurve Bow)
            const bowX = x + flip * (isAttacking ? 8 : 6);
            const bowY = y - 11;
            c.save();
            c.translate(bowX, bowY);

            if (flip < 0) {
                c.scale(-1, 1);
            }

            // Busur kayu melengkung
            c.strokeStyle = '#0891b2';
            c.lineWidth = 2;
            c.beginPath();
            c.arc(0, 0, 7, -Math.PI * 0.45, Math.PI * 0.45);
            c.stroke();
            // Ujung busur emas
            c.fillStyle = '#fde68a';
            c.fillRect(
                Math.cos(-Math.PI * 0.45) * 7 - 1,
                Math.sin(-Math.PI * 0.45) * 7 - 1,
                2,
                2,
            );
            c.fillRect(
                Math.cos(Math.PI * 0.45) * 7 - 1,
                Math.sin(Math.PI * 0.45) * 7 - 1,
                2,
                2,
            );

            // Tali busur
            c.strokeStyle = '#ffffff';
            c.lineWidth = 1;
            c.beginPath();
            const stringPull = isAttacking && atkProgress < 0.5 ? -4 : 0;
            c.moveTo(
                Math.cos(-Math.PI * 0.45) * 7,
                Math.sin(-Math.PI * 0.45) * 7,
            );
            c.lineTo(stringPull, 0);
            c.lineTo(
                Math.cos(Math.PI * 0.45) * 7,
                Math.sin(Math.PI * 0.45) * 7,
            );
            c.stroke();

            // Anak panah saat menarik tali
            if (isAttacking && atkProgress < 0.5) {
                c.fillStyle = '#22d3ee';
                c.fillRect(stringPull, -0.5, 9, 1);
                c.fillStyle = '#ffffff';
                c.fillRect(stringPull + 7, -1, 3, 2);
            }

            c.restore();
        } else if (p.def.role === 'Mage') {
            // SENJATA MAGE: Tongkat Sihir Bermahkota Kristal Melayang (Arcane Staff)
            const staffX = x + flip * (isAttacking ? 8 : 6);
            const staffY = y - (isAttacking ? 12 : 10);
            c.save();
            c.translate(staffX, staffY);

            if (flip < 0) {
                c.scale(-1, 1);
            }

            // Batang tongkat
            c.fillStyle = '#78350f';
            c.fillRect(-1, -4, 2, 14);
            // Mahkota emas
            c.fillStyle = '#fde68a';
            c.fillRect(-2, -6, 4, 3);
            // Kristal sihir melayang & berdenyut
            const bob = Math.sin(this.time * 6) * 1.5;
            const crystalY = -9 + bob;
            c.fillStyle = '#818cf8';
            c.fillRect(-2, crystalY - 2, 4, 4);
            c.fillStyle = '#ffffff';
            c.fillRect(-1, crystalY - 1, 2, 2);

            // Aura casting saat menyerang
            if (isAttacking) {
                c.strokeStyle = '#c084fc';
                c.lineWidth = 1;
                c.beginPath();
                c.arc(0, crystalY, 6, 0, Math.PI * 2);
                c.stroke();
            }

            c.restore();
        } else if (p.def.role === 'Knight') {
            // SENJATA KNIGHT: Pedang Besar Ksatria (Greatsword)
            const swordX = x + flip * 5;
            const swordY = y - 10;
            c.save();
            c.translate(swordX, swordY);

            let swingAng = -0.5; // Stance siap

            if (isAttacking) {
                // Ayunan tebasan pedang
                const swingPhase = Math.sin(atkProgress * Math.PI);
                swingAng = -0.7 + swingPhase * 2.2;
            }

            if (flip < 0) {
                c.scale(-1, 1);
            }

            c.rotate(swingAng);

            // Gagang & Pommel
            c.fillStyle = '#b45309';
            c.fillRect(-1, 0, 2, 4);
            c.fillStyle = '#fde68a';
            c.fillRect(-1, 4, 2, 2);
            // Crossguard salib emas
            c.fillStyle = '#fbbf24';
            c.fillRect(-3, -1, 6, 2);
            // Bilah pedang baja berkilau
            c.fillStyle = '#e2e8f0';
            c.fillRect(-1.5, -13, 3, 12);
            c.fillStyle = '#ffffff';
            c.fillRect(-0.5, -14, 1, 13);

            c.restore();
        } else {
            // SENJATA TANK: Perisai Menara (Tower Shield) + Palu Tempur (Warhammer)
            // 1. Perisai di depan
            const shieldX = x + flip * 6;
            const shieldY = y - 11;
            c.fillStyle = '#475569';
            c.fillRect(shieldX - 2, shieldY - 6, 4, 12);
            c.fillStyle = '#fbbf24';
            c.fillRect(shieldX - 3, shieldY - 7, 6, 2);
            c.fillRect(shieldX - 3, shieldY + 5, 6, 2);
            c.fillStyle = '#fde68a';
            c.fillRect(shieldX - 1, shieldY - 2, 2, 4);

            // 2. Palu tempur di tangan lain
            const hammerX = x - flip * 3;
            const hammerY = y - 11;
            c.save();
            c.translate(hammerX, hammerY);

            if (flip < 0) {
                c.scale(-1, 1);
            }

            let hammerAng = 0.3;

            if (isAttacking) {
                if (atkProgress < 0.45) {
                    // Angkat palu tinggi di atas kepala
                    hammerAng = -1.2;
                } else {
                    // Hantam sekuat tenaga ke bawah
                    hammerAng = 0.9;
                }
            }

            c.rotate(hammerAng);

            // Tangkai palu besi
            c.fillStyle = '#64748b';
            c.fillRect(-1, -10, 2, 12);
            // Kepala palu kotak baja berat
            c.fillStyle = '#94a3b8';
            c.fillRect(-4, -13, 8, 4);
            c.fillStyle = '#fde68a';
            c.fillRect(-4, -12, 1, 2);
            c.fillRect(3, -12, 1, 2);

            c.restore();
        }

        // Bar HP mini.
        const w = 16;
        c.fillStyle = '#020617';
        c.fillRect(x - w / 2, y - 30, w, 3);
        c.fillStyle = p.hp / this.maxHpOf(p) > 0.35 ? '#4ade80' : '#f87171';
        c.fillRect(
            x - w / 2,
            y - 30,
            Math.max(0, (w * p.hp) / this.maxHpOf(p)),
            3,
        );
        // Nama.
        c.fillStyle = 'rgba(255,255,255,0.9)';
        c.font = '6px monospace';
        c.textAlign = 'center';
        c.fillText(p.def.name, x, y - 33);
    }

    /** Aksen permukaan khas tiap map (rumput, sirkuit, retakan, dst). */
    private drawTileDetail(
        c: CanvasRenderingContext2D,
        tx: number,
        ty: number,
        h: number,
        theme: MapTheme,
    ): void {
        switch (this.mapName) {
            case 'ga1':
            case 'ga2':
            case 'gb1':
            case 'gb2':
            case 'gb3':
            case 'gb4':
            case 'gb5':
            case 'gb6': {
                // Keramik lorong: goresan halus & kilau kaca (lastik kelas).
                if (h % 29 === 0) {
                    c.fillStyle = 'rgba(30,41,59,0.10)';
                    c.fillRect(tx + 3 + (h % 8), ty + 6, 2, 1);
                    c.fillRect(tx + 9, ty + 9 + (h % 5), 1, 2);
                }

                if (h % 47 === 0) {
                    c.fillStyle = 'rgba(255,255,255,0.55)';
                    c.fillRect(tx + 10, ty + 4, 1, 1);
                }

                break;
            }

            case 'school':
            case 'class': {
                if (this.mapName === 'class') {
                    // Keramik kelas: goresan halus & kilau kaca.
                    if (h % 29 === 0) {
                        c.fillStyle = 'rgba(30,41,59,0.10)';
                        c.fillRect(tx + 3 + (h % 8), ty + 6, 2, 1);
                        c.fillRect(tx + 9, ty + 9 + (h % 5), 1, 2);
                    }

                    if (h % 47 === 0) {
                        c.fillStyle = 'rgba(255,255,255,0.55)';
                        c.fillRect(tx + 10, ty + 4, 1, 1);
                    }
                } else {
                    if (h % 23 === 0) {
                        c.fillStyle = theme.leaf;
                        c.fillRect(tx + 4, ty + 10, 2, 3);
                        c.fillRect(tx + 5, ty + 9, 2, 2);
                    }

                    if (h % 41 === 0) {
                        c.fillStyle = 'rgba(255,255,255,0.6)';
                        c.fillRect(tx + 8, ty + 6, 1, 1);
                    }
                }

                break;
            }

            case 'lab': {
                c.fillStyle = 'rgba(56,189,248,0.12)';

                if ((tx / 16) % 6 === 0) {
                    c.fillRect(tx, ty, 1, 16);
                }

                if ((ty / 16) % 6 === 0) {
                    c.fillRect(tx, ty, 16, 1);
                }

                if (h % 37 === 0) {
                    c.fillStyle = 'rgba(56,189,248,0.55)';
                    c.fillRect(tx + 7, ty + 7, 2, 2);
                }

                break;
            }

            case 'bug': {
                if ((tx / 16) % 4 === 0) {
                    c.fillStyle = 'rgba(34,211,238,0.16)';
                    c.fillRect(tx + 7, ty, 1, 16);
                }

                if (h % 53 === 0) {
                    c.fillStyle = 'rgba(244,114,182,0.5)';
                    c.fillRect(tx + 4, ty + 9, 2, 1);
                }

                break;
            }

            case 'boss': {
                if (h % 61 === 0) {
                    c.strokeStyle = 'rgba(248,113,113,0.45)';
                    c.lineWidth = 1;
                    c.beginPath();
                    c.moveTo(tx + 3, ty + 11);
                    c.lineTo(tx + 6, ty + 8);
                    c.lineTo(tx + 8, ty + 12);
                    c.stroke();
                }

                if (h % 79 === 0) {
                    c.fillStyle = 'rgba(124,58,237,0.5)';
                    c.fillRect(tx + 6, ty + 5, 2, 2);
                }

                break;
            }
        }
    }

    private drawDrop(d: Drop): void {
        const c = this.ctx;
        const bob = Math.sin(d.bob) * 2;
        const x = Math.round(d.x);
        const y = Math.round(d.y + bob);

        c.save();

        // Glow lembut.
        c.globalAlpha = 0.16;
        c.fillStyle = d.item.color;
        c.beginPath();
        c.arc(x, y, 11, 0, Math.PI * 2);
        c.fill();
        c.globalAlpha = 1;

        // Kotak item.
        c.fillStyle = 'rgba(2,6,23,0.9)';
        c.fillRect(x - 7, y - 7, 14, 14);
        c.strokeStyle = d.item.color;
        c.lineWidth = 2;
        c.strokeRect(x - 6, y - 6, 12, 12);

        // Ikon per jenis.
        c.fillStyle = d.item.color;

        if (d.item.kind === 'heal') {
            c.fillRect(x - 2, y - 3, 4, 7);
            c.fillRect(x - 1, y - 6, 2, 3);
        } else if (d.item.kind === 'weapon') {
            c.fillRect(x - 1, y - 5, 2, 8);
            c.fillRect(x - 4, y + 1, 8, 2);
        } else {
            c.beginPath();
            c.moveTo(x, y - 5);
            c.lineTo(x + 5, y - 2);
            c.lineTo(x, y + 5);
            c.lineTo(x - 5, y - 2);
            c.closePath();
            c.fill();
        }

        c.restore();
    }

    private drawEnemy(e: Enemy): void {
        const c = this.ctx;
        const s = e.type === 'boss' ? 2.4 : e.type === 'mite' ? 0.8 : 1.2;
        const x = Math.round(e.x);
        const y = Math.round(e.y);
        const wig = Math.floor(e.walkT) % 2 === 0 ? 1 : -1;

        c.fillStyle = 'rgba(0,0,0,0.35)';
        c.fillRect(x - 7 * s, y, 14 * s, 3);
        // Kaki.
        c.fillStyle = '#4c1d95';

        for (let i = -1; i <= 1; i++) {
            c.fillRect(
                x + i * 5 * s - 1,
                y - 5 + (i % 2 === 0 ? wig : -wig),
                2,
                5,
            );
        }

        // Badan.
        c.fillStyle = e.type === 'boss' ? '#7e22ce' : '#6d28d9';
        const bw = 12 * s;
        const bh = 8 * s;
        c.fillRect(x - bw / 2, y - 6 - bh, bw, bh);
        c.fillStyle = '#a855f7';
        c.fillRect(x - bw / 2 + 2, y - 6 - bh + 2, 4 * s, 3 * s);

        // Tanduk boss.
        if (e.type === 'boss') {
            c.fillStyle = '#facc15';
            c.fillRect(x - bw / 2 - 2, y - 10 - bh, 3, 6);
            c.fillRect(x + bw / 2 - 1, y - 10 - bh, 3, 6);
        }

        // Mata merah.
        c.fillStyle = '#ef4444';
        c.fillRect(x - 4 * s, y - 8 - bh + 4, 3 * s, 3 * s);
        c.fillRect(x + 1 * s, y - 8 - bh + 4, 3 * s, 3 * s);

        // Flash putih saat kena hit.
        if (e.flash > 0) {
            c.globalAlpha = Math.min(1, e.flash * 8);
            c.fillStyle = '#ffffff';
            c.fillRect(x - bw / 2, y - 6 - bh, bw, bh + 4);
            c.globalAlpha = 1;
        }

        c.fillRect(x + 1 * s, y - 8 - bh + 4, 3 * s, 3 * s);

        if (e.type === 'boss' || e.hp < e.maxHp) {
            const w = e.type === 'boss' ? 44 : 18;
            c.fillStyle = '#020617';
            c.fillRect(x - w / 2, y - 12 - bh - 8, w, 4);
            c.fillStyle = '#ef4444';
            c.fillRect(
                x - w / 2,
                y - 12 - bh - 8,
                Math.max(0, (w * e.hp) / e.maxHp),
                4,
            );
        }

        if (e.type === 'boss') {
            c.fillStyle = 'rgba(255,255,255,0.9)';
            c.font = '7px monospace';
            c.textAlign = 'center';
            c.fillText('RAJA DEADLINE', x, y - 14 - bh - 10);
        }
    }
}
