import { Head, Link } from '@inertiajs/react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import {
    ArrowLeft,
    ArrowUp,
    Check,
    ChevronDown,
    ChevronUp,
    Compass,
    FastForward,
    Copy,
    Crown,
    Eye,
    EyeOff,
    Flame,
    Heart,
    Home,
    LogIn,
    Map as MapIcon,
    Maximize2,
    Minimize2,
    Music,
    Package,
    Pause,
    Play,
    Plus,
    RotateCcw,
    RotateCw,
    Skull,
    Sparkles,
    Swords,
    Trash2,
    Trophy,
    User,
    Users,
    Volume2,
    VolumeX,
    Wind,
    X,
    Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
    ChangeEvent,
    PointerEvent as ReactPointerEvent,
    ReactNode,
} from 'react';
import type { RoomPlayer } from '@/game/net';
import {
    createRoom,
    getEcho,
    heartbeat,
    joinRoom,
    leaveRoom,
    myPlayerId,
    pickHero,
    pullInputs,
    pullState,
    pushInput,
    pushState,
    roomState,
    startRoom,
} from '@/game/net';
import type {
    DialogueLine,
    HudState,
    Phase,
    Snapshot,
} from '@/game/pixel-story';
import {
    HEROES,
    PixelStoryGame,
    SKINS,
    SOUL_COST_SKILL,
} from '@/game/pixel-story';
import { sound } from '@/game/sound';

const CONTROLS: { key: string; p1: string }[] = [
    { key: 'Gerak', p1: 'W A S D' },
    { key: 'Serang', p1: 'J / Klik Kiri' },
    { key: 'Dodge', p1: 'Shift / K' },
    { key: 'Skill', p1: 'L / 1 2 3' },
    { key: 'Lompat', p1: 'Space' },
    { key: 'Interaksi', p1: 'E' },
    { key: 'Tas', p1: 'B' },
    { key: 'Peta', p1: 'M' },
    { key: 'Jeda', p1: 'Esc' },
];

/** Tombol skill: L atau angka 1-3 (baris atas & numpad). */
const SKILL_KEYS = [
    'KeyL',
    'Digit1',
    'Digit2',
    'Digit3',
    'Numpad1',
    'Numpad2',
    'Numpad3',
];

/** Analog virtual untuk gerak di layar sentuh. */
function AnalogStick({
    onChange,
}: {
    onChange: (x: number, y: number) => void;
}) {
    const baseRef = useRef<HTMLDivElement>(null);
    const knobRef = useRef<HTMLDivElement>(null);
    const pointerRef = useRef<number | null>(null);
    const valueRef = useRef({ x: 0, y: 0 });
    const onChangeRef = useRef(onChange);
    const [active, setActive] = useState(false);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const update = useCallback((clientX: number, clientY: number): void => {
        const base = baseRef.current;
        const knob = knobRef.current;

        if (!base || !knob) {
            return;
        }

        const rect = base.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const radius = rect.width * 0.32;
        let dx = (clientX - cx) / radius;
        let dy = (clientY - cy) / radius;
        const rawLen = Math.hypot(dx, dy);

        if (rawLen > 1) {
            dx /= rawLen;
            dy /= rawLen;
        }

        // Deadzone kecil supaya jari yang diam tidak membuat hero berjalan.
        const mag = Math.min(1, rawLen);
        let nx = 0;
        let ny = 0;

        if (mag > 0.16) {
            const scaled = (mag - 0.16) / 0.84;
            nx = Math.round((dx / Math.max(mag, 0.001)) * scaled * 100) / 100;
            ny = Math.round((dy / Math.max(mag, 0.001)) * scaled * 100) / 100;
        }

        knob.style.transform = `translate3d(${dx * radius}px, ${dy * radius}px, 0)`;

        if (valueRef.current.x !== nx || valueRef.current.y !== ny) {
            valueRef.current = { x: nx, y: ny };
            onChangeRef.current(nx, ny);
        }
    }, []);

    const reset = useCallback((): void => {
        pointerRef.current = null;
        valueRef.current = { x: 0, y: 0 };
        setActive(false);

        if (knobRef.current) {
            knobRef.current.style.transform = 'translate3d(0, 0, 0)';
        }

        onChangeRef.current(0, 0);
    }, []);

    useEffect(() => {
        return () => {
            pointerRef.current = null;
            onChangeRef.current(0, 0);
        };
    }, []);

    const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
        if (pointerRef.current !== null) {
            return;
        }

        pointerRef.current = e.pointerId;
        setActive(true);
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e.clientX, e.clientY);
        e.preventDefault();
    };

    const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>): void => {
        if (pointerRef.current !== e.pointerId) {
            return;
        }

        update(e.clientX, e.clientY);
        e.preventDefault();
    };

    const onPointerEnd = (e: ReactPointerEvent<HTMLDivElement>): void => {
        if (pointerRef.current !== e.pointerId) {
            return;
        }

        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }

        reset();
        e.preventDefault();
    };

    return (
        <div
            ref={baseRef}
            role="application"
            aria-label="Analog gerak"
            aria-roledescription="joystick"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onLostPointerCapture={onPointerEnd}
            onContextMenu={(e) => e.preventDefault()}
            className={`relative size-20 shrink-0 touch-none rounded-full border transition-colors duration-150 select-none sm:size-24 ${
                active
                    ? 'border-cyan-300/70 bg-cyan-400/15 shadow-[0_0_24px_rgba(34,211,238,0.25),inset_0_0_18px_rgba(34,211,238,0.12)]'
                    : 'border-cyan-400/30 bg-gradient-to-b from-white/10 to-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_14px_rgba(0,0,0,0.35)]'
            }`}
            style={{ touchAction: 'none' }}
        >
            <span className="pointer-events-none absolute inset-3 rounded-full border border-cyan-200/10" />
            <span className="pointer-events-none absolute top-1/2 left-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 bg-cyan-200/15" />
            <span className="pointer-events-none absolute top-1/2 left-1/2 h-8 w-px -translate-x-1/2 -translate-y-1/2 bg-cyan-200/15" />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span
                    ref={knobRef}
                    className={`size-9 rounded-full border transition-[box-shadow,background-color] duration-150 sm:size-10 ${
                        active
                            ? 'border-cyan-100/80 bg-gradient-to-b from-cyan-100 to-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.75)]'
                            : 'border-cyan-200/40 bg-gradient-to-b from-cyan-200/90 to-cyan-500/90 shadow-[0_3px_10px_rgba(8,47,73,0.7),inset_0_1px_0_rgba(255,255,255,0.65)]'
                    }`}
                >
                    <span className="absolute inset-2 rounded-full border border-white/20" />
                </span>
            </span>
        </div>
    );
}

/** Tombol aksi sentuh dengan target ketuk besar dan umpan balik instan. */
function TouchActionButton({
    label,
    ariaLabel,
    icon,
    onPress,
    color,
    size = 'md',
}: {
    label: string;
    ariaLabel: string;
    icon: ReactNode;
    onPress: () => void;
    color: string;
    size?: 'md' | 'lg';
}) {
    return (
        <button
            type="button"
            aria-label={ariaLabel}
            onPointerDown={(e) => {
                e.preventDefault();
                onPress();
            }}
            onContextMenu={(e) => e.preventDefault()}
            className={`pointer-events-auto relative flex shrink-0 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-full border-2 bg-slate-950/75 backdrop-blur-md transition select-none active:scale-90 ${
                size === 'lg' ? 'size-16' : 'size-12'
            }`}
            style={{
                borderColor: color,
                boxShadow: `0 0 16px ${color}44, inset 0 1px 0 rgba(255,255,255,0.12)`,
            }}
        >
            <span className="pointer-events-none" style={{ color }}>
                {icon}
            </span>
            <span className="pointer-events-none font-pixel text-[6px] tracking-wider text-slate-100/90">
                {label}
            </span>
        </button>
    );
}

function HotbarSlot({
    label,
    icon,
    cd,
    max,
    color,
    onPress,
    cost,
    souls = 0,
}: {
    label: string;
    icon: ReactNode;
    cd: number;
    max: number;
    color: string;
    onPress: () => void;
    cost?: number;
    souls?: number;
}) {
    const pct = max > 0 ? Math.min(1, Math.max(0, cd / max)) : 0;
    const poor = cost !== undefined && souls < cost;

    return (
        <button
            type="button"
            onPointerDown={onPress}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPress();
                }
            }}
            aria-label={label}
            className={`pointer-events-auto relative flex aspect-square w-[4.4cqw] flex-col items-center justify-center overflow-hidden rounded-[0.9cqw] transition select-none active:scale-90 ${
                poor ? 'opacity-60 saturate-50' : ''
            }`}
            style={{
                border: `2px solid ${color}`,
                background:
                    'linear-gradient(180deg, rgba(30,41,59,0.95), rgba(2,6,23,0.98))',
                boxShadow:
                    pct <= 0 && !poor
                        ? `0 0 1.1cqw ${color}77, inset 0 0.15cqw 0 rgba(255,255,255,0.14)`
                        : 'inset 0 0.15cqw 0 rgba(255,255,255,0.08)',
            }}
        >
            {cost !== undefined && (
                <span
                    className={`absolute top-[6%] left-[6%] rounded-[0.2cqw] bg-black/55 px-[0.22cqw] font-mono font-black ${
                        poor ? 'text-red-300' : 'text-cyan-200'
                    }`}
                    style={{ fontSize: '0.6cqw' }}
                >
                    {cost}
                </span>
            )}
            <span className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent" />
            {pct > 0 && (
                <span
                    className="absolute inset-0"
                    style={{
                        background: `conic-gradient(rgba(2,6,23,0.82) ${pct * 360}deg, transparent 0deg)`,
                    }}
                />
            )}
            <span
                className={`relative ${pct > 0 ? 'opacity-40' : ''}`}
                style={{
                    filter:
                        pct <= 0 ? `drop-shadow(0 0 0.5cqw ${color})` : 'none',
                }}
            >
                {icon}
            </span>
            {pct > 0 && (
                <span
                    className="absolute font-mono font-black text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                    style={{ fontSize: '1.5cqw' }}
                >
                    {cd >= 10 ? Math.ceil(cd) : cd.toFixed(1)}
                </span>
            )}
            <span
                className="absolute right-[7%] bottom-[6%] rounded-[0.25cqw] border border-white/15 bg-black/55 px-[0.28cqw] font-mono font-black text-slate-100"
                style={{ fontSize: '0.72cqw' }}
            >
                {label}
            </span>
        </button>
    );
}

function SoulOrb({ value, ratio }: { value: number; ratio: number }) {
    const glow = 0.4 + Math.min(1, Math.max(0, ratio)) * 0.6;

    return (
        <div className="relative grid aspect-square w-[5.2cqw] place-items-center">
            <div className="absolute inset-[-7%] rounded-full border border-cyan-300/20" />
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background:
                        'radial-gradient(circle at 38% 30%, #f2fcff, #8fdcff 32%, #1f7fd0 68%, #08283f)',
                    boxShadow: `0 0 1.8cqw rgba(79,195,255,${glow}), inset 0 0 1cqw rgba(255,255,255,0.5), inset 0 -0.7cqw 1.1cqw rgba(8,47,73,0.85)`,
                }}
            />
            <div
                className="absolute inset-[14%] animate-[spin_5s_linear_infinite] rounded-full"
                style={{
                    background:
                        'conic-gradient(from 0deg, transparent 0%, rgba(214,246,255,0.7) 25%, transparent 55%)',
                    mixBlendMode: 'screen',
                }}
            />
            <div className="absolute top-[15%] left-[20%] h-[20%] w-[26%] rounded-full bg-white/60 blur-[0.12cqw]" />
            <span
                className="relative font-pixel font-black text-cyan-50"
                style={{
                    fontSize: '1.5cqw',
                    textShadow: '0 0 0.6cqw #4fc3ff, 1px 1px 0 #06222f',
                }}
            >
                {value}
            </span>
        </div>
    );
}

type NetChannel = {
    listen: (event: string, cb: (data: never) => void) => void;
};

const SPEAKER_COLORS: Record<string, string> = {
    Fahri: '#22d3ee',
    Fadlan: '#818cf8',
    Farrel: '#fb7185',
    Nathan: '#fbbf24',
    'Pak Syahid': '#4ade80',
    Narator: '#94a3b8',
    Semua: '#e2e8f0',
};

function useTypewriter(text: string, active: boolean): string {
    const [n, setN] = useState(0);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setN(0);
    }, [text]);

    useEffect(() => {
        if (!active || n >= text.length) {
            return;
        }

        const id = window.setTimeout(() => {
            sound.textTick();
            setN((v) => v + 1);
        }, 18);

        return () => window.clearTimeout(id);
    }, [n, text, active]);

    return text.slice(0, n);
}

const POSTER_IMG: Record<number, string> = {
    0: '/foto_fahri.png',
    1: '/posters/fadlan.jpg',
    2: '/foto_farrel.png',
    3: '/foto_nathan.jpg',
};

function HeroSkinPicker({
    taken,
    hero,
    skin,
    onHero,
    onSkin,
}: {
    taken: Map<number, string>;
    hero: number;
    skin: number;
    onHero: (hero: number) => void;
    onSkin: (skin: number) => void;
}) {
    return (
        <div className="flex w-full flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="font-pixel text-[9px] tracking-widest text-cyan-300">
                    PILIH KARAKTER
                </span>
                <span className="font-mono text-[10px] text-slate-300">
                    {HEROES[hero]?.name} · {HEROES[hero]?.role}
                </span>
            </div>
            <div className="grid w-full grid-cols-4 gap-2">
                {HEROES.map((h, i) => {
                    const holder = taken.get(i);
                    const disabled = holder !== undefined;
                    const poster = POSTER_IMG[i];
                    const active = hero === i && !disabled;

                    return (
                        <button
                            key={h.name}
                            type="button"
                            disabled={disabled}
                            aria-label={
                                disabled
                                    ? `Dipakai ${holder}`
                                    : `${h.name} (${h.role})`
                            }
                            onClick={() => {
                                sound.click();
                                onHero(i);
                            }}
                            title={
                                disabled
                                    ? `Dipakai ${holder}`
                                    : `${h.name} (${h.role})`
                            }
                            className={`group relative flex aspect-[3/4.2] flex-col overflow-hidden rounded-xl border-2 text-left transition-all duration-200 ${
                                active
                                    ? 'scale-[1.03] border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.55)] ring-1 ring-cyan-300'
                                    : 'border-white/15 bg-slate-950/60 hover:border-cyan-300/40 hover:bg-slate-900/80'
                            } ${disabled ? 'cursor-not-allowed opacity-50 grayscale' : 'cursor-pointer'}`}
                        >
                            {/* Role badge top */}
                            <div className="absolute top-1.5 left-1.5 z-10">
                                <span
                                    className="rounded px-1.5 py-0.5 font-pixel text-[7px] font-black tracking-wider text-slate-950 uppercase shadow-sm"
                                    style={{ background: h.color }}
                                >
                                    {h.role}
                                </span>
                            </div>

                            {active && (
                                <div className="absolute top-1.5 right-1.5 z-10 flex size-5 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-md">
                                    <Check className="size-3 stroke-[3]" />
                                </div>
                            )}

                            {/* Poster or Avatar graphic */}
                            <div className="relative size-full overflow-hidden bg-gradient-to-b from-slate-800 to-slate-950">
                                {poster ? (
                                    <img
                                        src={poster}
                                        alt={`Poster ${h.name}`}
                                        loading="lazy"
                                        className="size-full object-cover object-top transition duration-300 group-hover:scale-105"
                                        onError={(e) => {
                                            e.currentTarget.style.display =
                                                'none';
                                        }}
                                    />
                                ) : (
                                    <div className="flex size-full flex-col items-center justify-center gap-1">
                                        <span
                                            className="font-pixel text-2xl"
                                            style={{ color: h.color }}
                                        >
                                            {h.name[0]}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {disabled && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 p-1 text-center backdrop-blur-xs">
                                    <span className="font-pixel text-[8px] text-red-400">
                                        TERKUNCI
                                    </span>
                                    <span className="mt-1 max-w-full truncate font-mono text-[9px] font-bold text-slate-200">
                                        {holder}
                                    </span>
                                </div>
                            )}

                            {/* Info overlay bottom */}
                            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent px-1.5 pt-5 pb-1.5">
                                <span className="block font-pixel text-[8px] text-white">
                                    {h.name.toUpperCase()}
                                </span>
                                <span
                                    className="mt-0.5 block truncate font-mono text-[8px] font-bold"
                                    style={{ color: h.color }}
                                >
                                    ★ {h.skill.name}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Skin variant picker */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                <div className="flex items-center gap-2">
                    <span className="font-pixel text-[8px] tracking-wider text-slate-400">
                        SKIN:
                    </span>
                    <span className="font-mono text-xs font-bold text-cyan-200">
                        {SKINS[hero]?.[skin]?.name ?? 'Default'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {SKINS[hero]?.map((s, i) => (
                        <button
                            key={s.name}
                            type="button"
                            aria-label={s.name}
                            title={s.name}
                            onClick={() => {
                                sound.click();
                                onSkin(i);
                            }}
                            className={`size-6 rounded-md border-2 transition-transform duration-150 ${
                                skin === i
                                    ? 'scale-115 border-white shadow-[0_0_12px_rgba(255,255,255,0.7)]'
                                    : 'border-white/20 opacity-70 hover:border-white/60 hover:opacity-100'
                            }`}
                            style={{ background: s.color }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

type Online = {
    code: string;
    role: 'host' | 'client';
    myHero: number;
    roster: RoomPlayer[];
    hostId: string;
    status: string;
};

export default function Game() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<PixelStoryGame | null>(null);
    const [phase, setPhase] = useState<Phase>('title');
    const [hud, setHud] = useState<HudState | null>(null);
    const [dialog, setDialog] = useState<{
        chapter: string;
        lines: DialogueLine[];
    } | null>(null);
    const pressedRef = useRef<Set<string>>(new Set());
    const dialogRef = useRef<{
        chapter: string;
        lines: DialogueLine[];
    } | null>(null);
    const [tab, setTab] = useState<'solo' | 'online'>('solo');

    // --- Online state ---
    const [playerName, setPlayerName] = useState('');
    const [photoError, setPhotoError] = useState('');
    const [localPhoto, setLocalPhoto] = useState<string | null>(null);
    const [heroPick, setHeroPick] = useState(0);
    const [skinPick, setSkinPick] = useState(0);
    const [joinCode, setJoinCode] = useState('');
    const [online, setOnline] = useState<Online | null>(null);
    const [lobbyError, setLobbyError] = useState('');
    const [lobbyBusy, setLobbyBusy] = useState(false);
    const [copied, setCopied] = useState(false);
    const netRef = useRef<Online | null>(null);
    const chanRef = useRef<NetChannel | null>(null);
    const lastSnapRef = useRef(0);
    const sendRef = useRef<(() => void) | null>(null);
    const [live, setLive] = useState(false);
    const playingRef = useRef(false);
    const axisRef = useRef({ x: 0, y: 0 });
    const edgeRef = useRef({
        atk: 0,
        dge: 0,
        skl: 0,
        jmp: 0,
        skp: 0,
        dlg: 0,
        itr: 0,
    });
    const aimRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        netRef.current = online;
    }, [online]);

    useEffect(() => {
        dialogRef.current = dialog;
    }, [dialog]);

    const [isTouch, setIsTouch] = useState(
        () =>
            typeof window !== 'undefined' &&
            window.matchMedia('(pointer: coarse)').matches,
    );

    useEffect(() => {
        gameRef.current?.setTouchUi(isTouch);
    }, [isTouch]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const mq = window.matchMedia('(pointer: coarse)');
        const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);

        if (typeof mq.addEventListener === 'function') {
            mq.addEventListener('change', handler);

            return () => mq.removeEventListener('change', handler);
        }

        mq.addListener(handler);

        return () => mq.removeListener(handler);
    }, []);

    const [isPortrait, setIsPortrait] = useState(
        () =>
            typeof window !== 'undefined' &&
            window.matchMedia('(orientation: portrait)').matches,
    );

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const mq = window.matchMedia('(orientation: portrait)');
        const handler = (e: MediaQueryListEvent) => setIsPortrait(e.matches);

        if (typeof mq.addEventListener === 'function') {
            mq.addEventListener('change', handler);

            return () => mq.removeEventListener('change', handler);
        }

        mq.addListener(handler);

        return () => mq.removeListener(handler);
    }, []);

    // --- Jeda & petunjuk ---
    const [paused, setPaused] = useState(false);
    const pausedRef = useRef(false);
    const phaseRef = useRef<Phase>('title');
    const invOpenRef = useRef(false);

    useEffect(() => {
        pausedRef.current = paused;
    }, [paused]);

    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    // Petunjuk kontekstual: sekali per pemain, dipicu dari callback engine.
    const [tip, setTip] = useState<string | null>(null);
    const tipTimer = useRef<number | null>(null);
    const tipShown = useRef<Set<string>>(new Set());

    const showTipOnce = useCallback((key: string, text: string): void => {
        if (tipShown.current.has(key)) {
            return;
        }

        tipShown.current.add(key);

        try {
            if (localStorage.getItem(`f3n-tip-${key}`) === '1') {
                return;
            }

            localStorage.setItem(`f3n-tip-${key}`, '1');
        } catch {
            // localStorage bisa diblokir; tetap tampilkan sekali per sesi.
        }

        setTip(text);

        if (tipTimer.current !== null) {
            window.clearTimeout(tipTimer.current);
        }

        tipTimer.current = window.setTimeout(() => setTip(null), 9000);
    }, []);

    useEffect(
        () => () => {
            if (tipTimer.current !== null) {
                window.clearTimeout(tipTimer.current);
            }
        },
        [],
    );

    // Minta layar penuh + kunci orientasi landscape (didukung Chrome Android).
    // iOS tidak mengizinkan lock, jadi pengguna tetap diarahkan memutar HP.
    const requestLandscape = useCallback(async (): Promise<void> => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen?.();
            }
        } catch {
            // Layar penuh tidak tersedia; lanjut ke kunci orientasi.
        }

        try {
            const orientation = screen.orientation as ScreenOrientation & {
                lock?: (mode: string) => Promise<void>;
            };
            await orientation.lock?.('landscape');
        } catch {
            // Kunci orientasi tidak didukung (mis. iOS).
        }
    }, []);

    // Host: kirim snapshot satu per satu (selalu yang terbaru).
    const pendingSnap = useRef<Snapshot | null>(null);
    const snapBusy = useRef(false);

    const flushSnap = useCallback((): void => {
        const n = netRef.current;

        if (!n || n.role !== 'host' || snapBusy.current) {
            return;
        }

        const snap = pendingSnap.current;

        if (!snap) {
            return;
        }

        pendingSnap.current = null;
        snapBusy.current = true;
        void pushState(n.code, myPlayerId(), snap).finally(() => {
            snapBusy.current = false;

            if (pendingSnap.current) {
                flushSnap();
            }
        });
    }, []);

    const netActive = online !== null;

    const takenMap = useMemo(
        () =>
            new Map(
                (online?.roster ?? [])
                    .filter((p) => p.id !== myPlayerId())
                    .map((p) => [p.hero, p.name] as [number, string]),
            ),
        [online],
    );

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const game = new PixelStoryGame(canvas, {
            onHud: (h) => {
                setHud(h);

                if (h.inv.length > 0) {
                    showTipOnce(
                        'bag',
                        'Barang masuk tas. Tekan B atau ikon tas untuk memakainya.',
                    );
                }
            },
            onPhase: (p) => {
                setPhase(p);

                if (p === 'title') {
                    setMapBig(false);
                }

                if (p === 'roam') {
                    showTipOnce(
                        'roam',
                        'Dekati NPC bertanda ! lalu tekan E untuk interaksi.',
                    );
                }

                if (p === 'combat') {
                    showTipOnce(
                        'combat',
                        'Tekan L atau tombol SKILL. Souls dipakai untuk skill dan revive.',
                    );
                }
            },
            onMap: (big) => setMapBig(big),
            onStory: (chapter, lines) => {
                setDialog(lines ? { chapter, lines } : null);
            },
            onSnap: (s) => {
                const n = netRef.current;

                if (n && n.role === 'host') {
                    // Single-flight: kalau jaringan lambat, jangan menumpuk
                    // request. Simpan snapshot terbaru dan kirim setelah
                    // request sebelumnya selesai.
                    pendingSnap.current = s;

                    if (!snapBusy.current) {
                        flushSnap();
                    }
                }
            },
        });
        gameRef.current = game;
        game.start();
        game.loadSprites();

        const soloAxis = (hand: 'p1' | 'p2'): void => {
            const s = pressedRef.current;
            let x = 0;
            let y = 0;

            if (hand === 'p1') {
                if (s.has('KeyA')) {
                    x -= 1;
                }

                if (s.has('KeyD')) {
                    x += 1;
                }

                if (s.has('KeyW')) {
                    y -= 1;
                }

                if (s.has('KeyS')) {
                    y += 1;
                }
            } else {
                if (s.has('ArrowLeft')) {
                    x -= 1;
                }

                if (s.has('ArrowRight')) {
                    x += 1;
                }

                if (s.has('ArrowUp')) {
                    y -= 1;
                }

                if (s.has('ArrowDown')) {
                    y += 1;
                }
            }

            game.setAxis(hand, x, y);
        };

        const netAxis = (): void => {
            const s = pressedRef.current;
            let x = 0;
            let y = 0;

            if (s.has('KeyA')) {
                x -= 1;
            }

            if (s.has('KeyD')) {
                x += 1;
            }

            if (s.has('KeyW')) {
                y -= 1;
            }

            if (s.has('KeyS')) {
                y += 1;
            }

            axisRef.current = { x, y };
            game.setLocalAxis(x, y);
        };

        const onKeyDown = (e: KeyboardEvent): void => {
            // Lagi ngetik di input (nama/kode) -> jangan cegat, biar bisa diketik.
            const t = e.target as HTMLElement | null;

            if (
                t &&
                (t.tagName === 'INPUT' ||
                    t.tagName === 'TEXTAREA' ||
                    t.tagName === 'SELECT' ||
                    t.isContentEditable)
            ) {
                return;
            }

            const gameKeys = [
                'ArrowLeft',
                'ArrowRight',
                'ArrowUp',
                'ArrowDown',
                'Space',
                'KeyW',
                'KeyA',
                'KeyS',
                'KeyD',
                'KeyJ',
                'KeyK',
                'KeyL',
                'KeyE',
                'Digit1',
                'Digit2',
                'Digit3',
                'Numpad1',
                'Numpad2',
                'Numpad3',
                'KeyQ',
                'KeyM',
                'Period',
                'Enter',
                'ShiftLeft',
                'ShiftRight',
            ];

            if (gameKeys.includes(e.code)) {
                e.preventDefault();
            }

            if (e.repeat) {
                return;
            }

            // Saat jeda, hanya Esc yang ditangani supaya input tidak menumpuk.
            if (pausedRef.current && e.code !== 'Escape') {
                return;
            }

            pressedRef.current.add(e.code);

            if (e.code === 'KeyM') {
                game.toggleMinimap();

                return;
            }

            if (
                dialogRef.current &&
                (e.code === 'Enter' || e.code === 'Space')
            ) {
                if (netRef.current?.role === 'client') {
                    edgeRef.current.dlg += 1;
                    sendRef.current?.();
                } else {
                    gameRef.current?.advanceDialogue();
                }

                return;
            }

            if (dialogRef.current) {
                return;
            }

            if (e.code === 'Escape') {
                if (invOpenRef.current) {
                    setInvOpen(false);

                    return;
                }

                if (
                    phaseRef.current !== 'title' &&
                    phaseRef.current !== 'victory' &&
                    phaseRef.current !== 'defeat'
                ) {
                    setPaused((v) => !v);
                }

                return;
            }

            if (e.code === 'KeyB' || e.code === 'KeyI') {
                setInvOpen((v) => !v);

                return;
            }

            if (netRef.current) {
                netAxis();

                if (e.code === 'KeyJ') {
                    edgeRef.current.atk += 1;
                    game.predictLocal('atk');
                }

                if (
                    e.code === 'KeyK' ||
                    e.code === 'ShiftLeft' ||
                    e.code === 'ShiftRight'
                ) {
                    edgeRef.current.dge += 1;
                    game.predictLocal('dge');
                }

                if (SKILL_KEYS.includes(e.code)) {
                    edgeRef.current.skl += 1;
                }

                if (e.code === 'Space') {
                    edgeRef.current.jmp += 1;
                }

                if (e.code === 'KeyE') {
                    edgeRef.current.itr += 1;

                    if (netRef.current.role === 'host') {
                        game.pressLocalInteract();
                    }
                }

                sendRef.current?.();

                return;
            }

            soloAxis('p1');

            if (e.code === 'KeyJ') {
                game.pressAttack('p1');
            }

            if (
                e.code === 'KeyK' ||
                e.code === 'ShiftLeft' ||
                e.code === 'ShiftRight'
            ) {
                game.pressDodge('p1');
            }

            if (SKILL_KEYS.includes(e.code)) {
                game.pressSkill('p1');
            }

            if (e.code === 'Space') {
                game.pressJump('p1');
            }

            if (e.code === 'KeyE') {
                game.pressInteract('p1');
            }
        };
        const onKeyUp = (e: KeyboardEvent): void => {
            const t = e.target as HTMLElement | null;

            if (
                t &&
                (t.tagName === 'INPUT' ||
                    t.tagName === 'TEXTAREA' ||
                    t.tagName === 'SELECT' ||
                    t.isContentEditable)
            ) {
                return;
            }

            pressedRef.current.delete(e.code);

            if (netRef.current) {
                netAxis();
                sendRef.current?.();

                return;
            }

            soloAxis('p1');
        };
        // Tab kehilangan fokus: lepaskan semua tombol agar hero tidak
        // terus berjalan karena keyup tidak sempat terkirim.
        const onBlur = (): void => {
            pressedRef.current.clear();
            axisRef.current = { x: 0, y: 0 };
            game.setLocalAxis(0, 0);
            game.setAxis('p1', 0, 0);
            sendRef.current?.();
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', onBlur);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('blur', onBlur);
            game.destroy();
            gameRef.current = null;
        };
    }, [flushSnap, showTipOnce]);

    // HP vertikal = tidak boleh main. Bekukan game + lepas input gerak
    // agar hero tidak jalan sendiri di balik layar putar HP. Menu jeda
    // memakai jalur yang sama supaya satu sumber kebenaran.
    useEffect(() => {
        const game = gameRef.current;
        const blocked = paused || (isTouch && isPortrait);

        if (!game) {
            return;
        }

        game.setPaused(blocked);

        if (blocked) {
            game.setAxis('p1', 0, 0);
            game.setLocalAxis(0, 0);
            axisRef.current = { x: 0, y: 0 };
            sendRef.current?.();
        }
    }, [isTouch, isPortrait, paused]);

    // Kirim input lokal ke host (mode client).
    useEffect(() => {
        if (!online || online.role !== 'client') {
            return;
        }

        const code = online.code;
        const pid = myPlayerId();
        let busy = false;
        let queued = false;

        // Input bersifat "level": cukup dikirim saat berubah. Kirim juga
        // keepalive jarang supaya host tetap tahu kondisi terakhir.
        const send = (): void => {
            const n = netRef.current;

            if (!n) {
                return;
            }

            const game = gameRef.current;

            if (game) {
                game.setLocalAxis(axisRef.current.x, axisRef.current.y);
            }

            if (busy) {
                queued = true;

                return;
            }

            busy = true;
            void pushInput(code, pid, {
                x: axisRef.current.x,
                y: axisRef.current.y,
                atk: edgeRef.current.atk,
                dge: edgeRef.current.dge,
                skl: edgeRef.current.skl,
                jmp: edgeRef.current.jmp,
                skp: edgeRef.current.skp,
                dlg: edgeRef.current.dlg,
                itr: edgeRef.current.itr,
                ax: aimRef.current.x,
                ay: aimRef.current.y,
            }).finally(() => {
                busy = false;

                if (queued) {
                    queued = false;
                    send();
                }
            });
        };

        sendRef.current = send;

        const id = window.setInterval(send, 500);
        send();

        return () => {
            window.clearInterval(id);
            sendRef.current = null;
        };
    }, [online]);

    // Indikator sinkronisasi untuk klien online.
    useEffect(() => {
        const id = window.setInterval(() => {
            setLive(Date.now() - lastSnapRef.current < 1500);
        }, 700);

        return () => window.clearInterval(id);
    }, []);

    // Klien: cadangan snapshot lewat HTTP bila WebSocket tidak masuk
    // (mis. port 8443 diblokir jaringan HP).
    useEffect(() => {
        if (!online || online.role !== 'client') {
            return;
        }

        const code = online.code;
        const pid = myPlayerId();
        let busy = false;

        lastSnapRef.current = 0;

        const id = window.setInterval(async () => {
            if (busy || !playingRef.current) {
                return;
            }

            // WS masih mengirim → tidak perlu jalur cadangan.
            if (Date.now() - lastSnapRef.current < 900) {
                return;
            }

            busy = true;

            try {
                const { snapshot } = await pullState(code, pid);

                if (snapshot) {
                    gameRef.current?.applySnapshot(snapshot);
                }
            } catch {
                // coba lagi di tick berikutnya
            } finally {
                busy = false;
            }
        }, 200);

        return () => window.clearInterval(id);
    }, [online]);

    // Host: tarik input remote + aksi lokal langsung.
    useEffect(() => {
        if (!online || online.role !== 'host') {
            return;
        }

        const code = online.code;
        const pid = myPlayerId();

        let pullBusy = false;

        const pull = window.setInterval(async () => {
            const n = netRef.current;
            const game = gameRef.current;

            if (!n || n.role !== 'host' || !game || pullBusy) {
                return;
            }

            pullBusy = true;

            try {
                const { inputs } = await pullInputs(code, pid);

                for (const item of inputs) {
                    const hero = n.roster.find((p) => p.id === item.id)?.hero;

                    if (hero !== undefined) {
                        game.setRemoteInput(hero, item.input);
                    }
                }

                game.setSkipTotal(n.roster.length);
            } catch {
                // abaikan, coba lagi interval berikut
            } finally {
                pullBusy = false;
            }
        }, 45);

        return () => window.clearInterval(pull);
    }, [online]);

    // Host: aksi lokal langsung (tanpa whisper).
    const lastLocal = useRef({
        atk: 0,
        dge: 0,
        skl: 0,
        jmp: 0,
        skp: 0,
        itr: 0,
    });

    useEffect(() => {
        if (!online || online.role !== 'host') {
            return;
        }

        const id = window.setInterval(() => {
            const game = gameRef.current;

            if (!game) {
                return;
            }

            if (lastLocal.current.atk !== edgeRef.current.atk) {
                game.pressLocalAttack();
            }

            if (lastLocal.current.dge !== edgeRef.current.dge) {
                game.pressLocalDodge();
            }

            if (lastLocal.current.skl !== edgeRef.current.skl) {
                game.pressLocalSkill();
            }

            if (lastLocal.current.jmp !== edgeRef.current.jmp) {
                game.pressLocalJump();
            }

            if (lastLocal.current.skp !== edgeRef.current.skp) {
                game.addSkipVote(-1, online?.roster.length ?? 1);
            }

            if (lastLocal.current.itr !== edgeRef.current.itr) {
                game.pressLocalInteract();
            }

            lastLocal.current = { ...edgeRef.current };
        }, 60);

        return () => window.clearInterval(id);
    }, [online]);

    // Poll lobby + heartbeat + migrasi host.
    useEffect(() => {
        if (!online) {
            return;
        }

        const myId = myPlayerId();

        const tick = async (): Promise<void> => {
            const n = netRef.current;

            if (!n) {
                return;
            }

            try {
                const st = await roomState(n.code);

                setOnline((prev) =>
                    prev
                        ? {
                              ...prev,
                              roster: st.players,
                              hostId: st.hostId,
                              status: st.status,
                          }
                        : prev,
                );

                if (st.status === 'lobby') {
                    const me = st.players.find((p) => p.id === myId);

                    if (me) {
                        setHeroPick(me.hero);
                        setSkinPick(me.skin ?? 0);
                    }
                }

                // Mulai sebagai client bila host sudah start.
                if (
                    st.status === 'playing' &&
                    !playingRef.current &&
                    n.role === 'client'
                ) {
                    const mine = st.players.find((p) => p.id === myId);

                    beginNetGame('client', mine?.hero ?? n.myHero, st.players);
                }

                // Migrasi host bila host lama hilang.
                if (
                    st.hostId === myId &&
                    n.role === 'client' &&
                    st.status === 'playing'
                ) {
                    gameRef.current?.switchToHost();
                    setOnline((prev) =>
                        prev ? { ...prev, role: 'host' } : prev,
                    );
                }

                // Hero yang pemainnya hilang jadi AI.
                if (n.role === 'host') {
                    for (let h = 0; h < 4; h++) {
                        if (!st.players.some((p) => p.hero === h)) {
                            gameRef.current?.setHeroAI(h);
                        }
                    }
                }

                await heartbeat(n.code, myId);
                fails = 0;
            } catch {
                fails += 1;

                // Jaringan bisa hiccup sesaat; baru keluar setelah 3x gagal.
                if (fails >= 3) {
                    setOnline((prev) => {
                        if (prev && prev.status === 'playing') {
                            backToLobby('Room bubar / tidak terjangkau.');
                        }

                        return prev;
                    });
                }
            }
        };

        let fails = 0;

        const poll = window.setInterval(tick, 2500);
        void tick();

        return () => window.clearInterval(poll);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [online?.code]);

    const chooseHero = (hero: number): void => {
        setHeroPick(hero);
        setOnline((prev) => (prev ? { ...prev, myHero: hero } : prev));

        const n = netRef.current;

        if (n && n.status !== 'playing') {
            setLobbyError('');
            void pickHero(n.code, myPlayerId(), hero, skinPick).catch(
                (err: unknown) =>
                    setLobbyError(
                        err instanceof Error ? err.message : 'Gagal ganti.',
                    ),
            );
        }
    };

    const chooseSkin = (skin: number): void => {
        setSkinPick(skin);

        const n = netRef.current;

        if (n && n.status !== 'playing') {
            void pickHero(n.code, myPlayerId(), heroPick, skin).catch(
                () => undefined,
            );
        }
    };

    function beginNetGame(
        role: 'host' | 'client',
        heroIdx: number,
        roster: RoomPlayer[],
    ): void {
        const game = gameRef.current;

        if (!game || playingRef.current) {
            return;
        }

        playingRef.current = true;
        // beginAdventure me-reset party (control/axis/netRole),
        // jadi setNetMode harus sesudahnya agar hero lokal dapat control 'local'.
        game.beginAdventure();
        game.setNetMode(role, heroIdx);

        for (const r of roster) {
            game.setSkin(r.hero, r.skin ?? 0);
        }

        setOnline((prev) =>
            prev ? { ...prev, role, roster, status: 'playing' } : prev,
        );
    }

    const attachChannel = (code: string): void => {
        const raw = getEcho().channel(
            `game-room.${code}`,
        ) as unknown as NetChannel;
        chanRef.current = raw;

        raw.listen('.game.snapshot', (d) => {
            const n = netRef.current;

            if (!n || n.role !== 'client') {
                return;
            }

            // Event membawa { code, snapshot }; ambil isi snapshot-nya.
            const payload = (d as { snapshot?: Snapshot }).snapshot;
            lastSnapRef.current = Date.now();

            gameRef.current?.applySnapshot(
                (payload ?? d) as unknown as Snapshot,
            );
        });

        raw.listen('.game.started', () => {
            const n = netRef.current;

            if (!n || playingRef.current || n.role !== 'client') {
                return;
            }

            const me = n.roster.find((p) => p.id === myPlayerId());
            beginNetGame('client', me?.hero ?? 0, n.roster);
        });
    };

    const handleCreate = async (): Promise<void> => {
        const name =
            playerName.trim() || `Pemain${Math.floor(Math.random() * 99)}`;
        setLobbyError('');
        setLobbyBusy(true);

        try {
            const res = await createRoom(name);
            localStorage.setItem('f3n-player-id', res.playerId);
            const roster = [{ id: res.playerId, name, hero: 0, skin: 0 }];
            setOnline({
                code: res.code,
                role: 'host',
                myHero: heroPick,
                roster,
                hostId: res.hostId,
                status: 'lobby',
            });
            attachChannel(res.code);
        } catch (err) {
            setLobbyError(
                err instanceof Error ? err.message : 'Gagal buat room.',
            );
        } finally {
            setLobbyBusy(false);
        }
    };

    const handleJoin = async (): Promise<void> => {
        const code = joinCode.trim().toUpperCase();

        if (code.length !== 4) {
            setLobbyError('Kode room 4 karakter.');

            return;
        }

        const name =
            playerName.trim() || `Pemain${Math.floor(Math.random() * 99)}`;
        const pid = myPlayerId();
        setLobbyError('');
        setLobbyBusy(true);

        try {
            await joinRoom(code, name, pid);
            const st = await roomState(code);
            setOnline({
                code,
                role: st.hostId === pid ? 'host' : 'client',
                myHero: heroPick,
                roster: st.players,
                hostId: st.hostId,
                status: st.status,
            });
            attachChannel(code);

            if (st.status === 'playing') {
                const me = st.players.find((p) => p.id === pid);
                beginNetGame(
                    st.hostId === pid ? 'host' : 'client',
                    me?.hero ?? heroPick,
                    st.players,
                );
            }
        } catch (err) {
            setLobbyError(
                err instanceof Error ? err.message : 'Gagal join room.',
            );
        } finally {
            setLobbyBusy(false);
        }
    };

    const handleStart = async (): Promise<void> => {
        const n = netRef.current;
        const game = gameRef.current;

        if (!n || !game || n.role !== 'host') {
            return;
        }

        try {
            await startRoom(n.code, myPlayerId());

            // Roster bisa berubah tepat sebelum start (pemain ganti hero),
            // jadi ambil data terbaru dulu.
            const st = await roomState(n.code).catch(() => null);
            const roster = st?.players ?? n.roster;
            const me = roster.find((p) => p.id === myPlayerId());

            beginNetGame('host', me?.hero ?? n.myHero, roster);
        } catch (err) {
            setLobbyError(err instanceof Error ? err.message : 'Gagal start.');
        }
    };

    function backToLobby(msg = ''): void {
        sound.stopMusic();
        const n = netRef.current;

        if (n) {
            void leaveRoom(n.code, myPlayerId());
            getEcho().leave(`game-room.${n.code}`);
        }

        chanRef.current = null;
        playingRef.current = false;
        setOnline(null);
        setLobbyError(msg);
        setTab('online');
    }

    /** Lewati semua quest: gratis, tapi online butuh suara semua pemain. */
    const skipQuest = (): void => {
        sound.click();
        const n = netRef.current;
        const game = gameRef.current;

        if (!game) {
            return;
        }

        // Solo / offline: langsung lewati.
        if (!n) {
            game.trySkipQuests();

            return;
        }

        edgeRef.current.skp += 1;

        if (n.role === 'host') {
            game.addSkipVote(-1, n.roster.length);
        }

        sendRef.current?.();
    };

    /** Lanjut dialog: solo/host langsung, klien minta host lewat input. */
    const advanceDialog = (): void => {
        const n = netRef.current;

        if (n && n.role === 'client') {
            edgeRef.current.dlg += 1;
            sendRef.current?.();

            return;
        }

        gameRef.current?.advanceDialogue();
    };

    const copyCode = async (): Promise<void> => {
        const code = netRef.current?.code;

        if (!code) {
            return;
        }

        let ok = false;

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(code);
                ok = true;
            }
        } catch {
            ok = false;
        }

        if (!ok) {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = code;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'fixed';
                textarea.style.top = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                ok = document.execCommand('copy');
                document.body.removeChild(textarea);
            } catch {
                ok = false;
            }
        }

        if (ok) {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } else {
            window.prompt('Salin kode room:', code);
        }
    };

    const touchAxis = (dx: number, dy: number): void => {
        if (netRef.current) {
            axisRef.current = { x: dx, y: dy };
            gameRef.current?.setLocalAxis(dx, dy);
            sendRef.current?.();

            return;
        }

        gameRef.current?.setAxis('p1', dx, dy);
    };

    const doAction = (
        kind: 'atk' | 'dge' | 'skl' | 'jmp' | 'itr' | 'swp',
    ): void => {
        const game = gameRef.current;

        if (!game) {
            return;
        }

        if (netRef.current) {
            if (kind === 'atk') {
                edgeRef.current.atk += 1;

                if (netRef.current.role === 'host') {
                    game.pressLocalAttack();
                }
            } else if (kind === 'dge') {
                edgeRef.current.dge += 1;

                if (netRef.current.role === 'host') {
                    game.pressLocalDodge();
                } else {
                    game.predictLocal('dge');
                }
            } else if (kind === 'skl') {
                edgeRef.current.skl += 1;

                if (netRef.current.role === 'host') {
                    game.pressLocalSkill();
                }
            } else if (kind === 'jmp') {
                edgeRef.current.jmp += 1;

                if (netRef.current.role === 'host') {
                    game.pressLocalJump();
                }
            } else if (kind === 'itr') {
                edgeRef.current.itr += 1;

                if (netRef.current.role === 'host') {
                    game.pressLocalInteract();
                }
            }

            sendRef.current?.();

            return;
        }

        if (kind === 'atk') {
            game.pressAttack('p1');
        } else if (kind === 'dge') {
            game.pressDodge('p1');
        } else if (kind === 'skl') {
            game.pressSkill('p1');
        } else if (kind === 'jmp') {
            game.pressJump('p1');
        } else if (kind === 'itr') {
            game.pressInteract('p1');
        } else {
            game.swapControl('p1');
        }
    };

    /** Mulai petualangan solo dengan hero, skin, nama, dan foto pilihan. */
    const startSolo = (): void => {
        const game = gameRef.current;

        if (!game) {
            return;
        }

        game.beginAdventure();
        game.selectLocalHero(heroPick);
        game.setSkin(heroPick, skinPick);
    };

    /** Baca file foto jadi data URL (buat avatar HUD). */
    const onPhotoPick = (e: ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setPhotoError('');
            setLocalPhoto(
                typeof reader.result === 'string' ? reader.result : null,
            );
        };
        reader.onerror = () => {
            setPhotoError('Gagal memuat foto.');
            setLocalPhoto(null);
        };
        reader.readAsDataURL(file);
    };

    const current = dialog?.lines[0] ?? null;
    const typedText = useTypewriter(current?.text ?? '', dialog !== null);
    const [waveBanner, setWaveBanner] = useState(0);
    const lastWave = useRef(0);
    const [muted, setMuted] = useState(sound.isMuted());
    const [showHud, setShowHud] = useState(true);
    const [questOpen, setQuestOpen] = useState(true);
    const [invOpen, setInvOpen] = useState(false);
    const [mapBig, setMapBig] = useState(false);
    const [partyOpen, setPartyOpen] = useState(!isTouch);
    const [controlsOpen, setControlsOpen] = useState(!isTouch);
    const [shakeOn, setShakeOn] = useState(() => {
        try {
            return localStorage.getItem('f3n-shake') !== '0';
        } catch {
            return true;
        }
    });
    const [musicVol, setMusicVol] = useState(() =>
        Math.round(sound.getVolumes().music * 100),
    );
    const [sfxVol, setSfxVol] = useState(() =>
        Math.round(sound.getVolumes().sfx * 100),
    );
    const [isFullscreen, setIsFullscreen] = useState(false);
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const [viewBox, setViewBox] = useState({ l: 0, t: 0, w: 480, h: 270 });
    const partyCompact = isTouch && !partyOpen;

    useEffect(() => {
        invOpenRef.current = invOpen;
    }, [invOpen]);

    useEffect(() => {
        const sync = (): void =>
            setIsFullscreen(document.fullscreenElement !== null);

        document.addEventListener('fullscreenchange', sync);

        return () => document.removeEventListener('fullscreenchange', sync);
    }, []);

    const toggleFullscreen = useCallback((): void => {
        if (document.fullscreenElement) {
            void document.exitFullscreen?.();
        } else {
            void document.documentElement.requestFullscreen?.();
        }
    }, []);

    useEffect(() => {
        gameRef.current?.setShakeEnabled(shakeOn);

        try {
            localStorage.setItem('f3n-shake', shakeOn ? '1' : '0');
        } catch {
            // abaikan
        }
    }, [shakeOn]);

    useEffect(() => {
        if (phase === 'title') {
            lastWave.current = 0;

            return;
        }

        if (
            phase !== 'combat' ||
            dialog ||
            !hud ||
            hud.wave <= lastWave.current
        ) {
            return;
        }

        lastWave.current = hud.wave;
        setWaveBanner(hud.wave);
        const id = window.setTimeout(() => setWaveBanner(0), 1800);

        return () => window.clearTimeout(id);
    }, [phase, dialog, hud]);

    useEffect(() => {
        const unlock = (): void => sound.unlock();
        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);

        return () => {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };
    }, []);

    useEffect(() => {
        const el = wrapRef.current;
        const cv = canvasRef.current;

        if (!el || !cv) {
            return;
        }

        const update = (): void => {
            const r = el.getBoundingClientRect();
            const scale = Math.min(r.width / 480, r.height / 270);
            const w = 480 * scale;
            const h = 270 * scale;
            setViewBox({
                l: (r.width - w) / 2,
                t: (r.height - h) / 2,
                w,
                h,
            });
        };

        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);

        return () => ro.disconnect();
    }, []);

    /** Klik kanvas: kiri = serang ke kursor, kanan = dodge ke kursor. */
    const actionAtPointer = (e: ReactPointerEvent<HTMLCanvasElement>): void => {
        const right = e.pointerType === 'mouse' && e.button === 2;
        const left = e.pointerType !== 'mouse' || e.button === 0;

        if (!left && !right) {
            return;
        }

        const game = gameRef.current;
        const wrap = wrapRef.current;

        if (!game || !wrap) {
            return;
        }

        const rect = wrap.getBoundingClientRect();
        const cx = ((e.clientX - rect.left - viewBox.l) / viewBox.w) * 480;
        const cy = ((e.clientY - rect.top - viewBox.t) / viewBox.h) * 270;

        // Abaikan klik di area letterbox (di luar gambar 480x270).
        if (cx < 0 || cy < 0 || cx > 480 || cy > 270) {
            return;
        }

        const n = netRef.current;

        if (right) {
            const aim = game.pointerDodge(cx, cy);

            if (!aim) {
                return;
            }

            // Klien tidak simulasi: kirim arah + pemicu dodge ke host.
            if (n && n.role === 'client') {
                aimRef.current = aim;
                edgeRef.current.dge += 1;
                game.predictLocal('dge');
                sendRef.current?.();
            }

            return;
        }

        const aim = game.pointerAttack(cx, cy);

        if (!aim) {
            return;
        }

        // Klien tidak simulasi: kirim arah bidik + pemicu serangan ke host.
        if (n && n.role === 'client') {
            aimRef.current = aim;
            edgeRef.current.atk += 1;
            game.predictLocal('atk');
            sendRef.current?.();
        }
    };

    return (
        <>
            <Head title="F3N Story — Pixel RPG" />
            <MotionConfig reducedMotion="user">
                <main className="flex h-[100dvh] flex-col overflow-hidden bg-[#070b16] font-sans text-slate-100">
                    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_50%)]" />
                    <div
                        className={`relative mx-auto flex h-full min-h-0 w-full flex-col ${isTouch ? 'gap-1 p-1' : 'gap-3 px-4 py-4'}`}
                    >
                        {/* Layar game */}
                        <div
                            ref={wrapRef}
                            className="relative min-h-0 flex-1 overflow-hidden rounded-lg border-2 border-cyan-400/30 bg-[radial-gradient(circle_at_50%_45%,#0b1526_0%,#050810_62%,#02040a_100%)] shadow-[0_0_60px_rgba(34,211,238,0.15)]"
                        >
                            <canvas
                                ref={canvasRef}
                                width={1440}
                                height={810}
                                role="img"
                                aria-label="Area permainan F3N Story"
                                onPointerDown={actionAtPointer}
                                onContextMenu={(e) => e.preventDefault()}
                                className="block h-full w-full cursor-crosshair touch-none object-contain [image-rendering:pixelated]"
                            />
                            {/* Analog gerak di dalam layar game (khusus sentuh) */}
                            {isTouch &&
                                !dialog &&
                                (phase === 'story' ||
                                    phase === 'quest' ||
                                    phase === 'roam' ||
                                    phase === 'combat') && (
                                    <div className="absolute bottom-3 left-3 z-30 flex flex-col items-center gap-1 select-none">
                                        <AnalogStick onChange={touchAxis} />
                                        <span className="rounded-full bg-slate-950/60 px-2 py-0.5 font-pixel text-[7px] tracking-wider text-cyan-200/80 backdrop-blur-sm">
                                            GERAK
                                        </span>
                                    </div>
                                )}
                            {/* Aksi sentuh: peta, lompat, interaksi + aksi tempur */}
                            {isTouch &&
                                !dialog &&
                                (phase === 'story' ||
                                    phase === 'quest' ||
                                    phase === 'roam' ||
                                    phase === 'combat') && (
                                    <div className="absolute right-2 bottom-30 z-30 flex flex-col items-end gap-1.5 select-none">
                                        {(phase === 'roam' ||
                                            phase === 'quest' ||
                                            phase === 'combat') && (
                                            <div className="flex items-center gap-1.5">
                                                <TouchActionButton
                                                    label="PETA"
                                                    ariaLabel="Perbesar atau perkecil peta"
                                                    color="#22d3ee"
                                                    icon={
                                                        <MapIcon className="size-5" />
                                                    }
                                                    onPress={() =>
                                                        gameRef.current?.toggleMinimap()
                                                    }
                                                />
                                                {!mapBig && (
                                                    <>
                                                        <TouchActionButton
                                                            label="LOMPAT"
                                                            ariaLabel="Lompat"
                                                            color="#a78bfa"
                                                            icon={
                                                                <ArrowUp className="size-5" />
                                                            }
                                                            onPress={() =>
                                                                doAction('jmp')
                                                            }
                                                        />
                                                        <TouchActionButton
                                                            label="E"
                                                            ariaLabel="Interaksi"
                                                            color="#4ade80"
                                                            size="lg"
                                                            icon={
                                                                <Compass className="size-6" />
                                                            }
                                                            onPress={() =>
                                                                doAction('itr')
                                                            }
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        {phase === 'combat' && !mapBig && (
                                            <div className="flex items-center gap-1.5">
                                                <TouchActionButton
                                                    label="SKILL"
                                                    ariaLabel="Skill"
                                                    color="#fbbf24"
                                                    icon={
                                                        <Zap className="size-5" />
                                                    }
                                                    onPress={() =>
                                                        doAction('skl')
                                                    }
                                                />
                                                <TouchActionButton
                                                    label="DODGE"
                                                    ariaLabel="Dodge"
                                                    color="#38bdf8"
                                                    icon={
                                                        <Wind className="size-5" />
                                                    }
                                                    onPress={() =>
                                                        doAction('dge')
                                                    }
                                                />
                                                <TouchActionButton
                                                    label="SERANG"
                                                    ariaLabel="Serang"
                                                    color="#f87171"
                                                    size="lg"
                                                    icon={
                                                        <Swords className="size-6" />
                                                    }
                                                    onPress={() =>
                                                        doAction('atk')
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            <Link
                                href="/"
                                aria-label="Kembali"
                                title="Kembali ke beranda"
                                className={`absolute top-3 left-3 z-30 flex items-center justify-center rounded-lg border border-cyan-400/30 bg-slate-950/70 text-slate-200 backdrop-blur-md transition-all duration-200 hover:border-cyan-300 hover:bg-cyan-500/20 hover:text-white hover:shadow-[0_0_12px_rgba(34,211,238,0.4)] ${isTouch ? 'size-11' : 'size-9'}`}
                            >
                                <ArrowLeft className="size-4" />
                            </Link>
                            {online?.role === 'client' &&
                                phase === 'combat' && (
                                    <div
                                        className={`pointer-events-none absolute top-3 left-14 z-30 flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-[9px] backdrop-blur-md ${
                                            live
                                                ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300'
                                                : 'border-amber-400/40 bg-amber-500/10 text-amber-300'
                                        }`}
                                    >
                                        <span
                                            className={`size-1.5 rounded-full ${
                                                live
                                                    ? 'bg-emerald-400'
                                                    : 'animate-pulse bg-amber-400'
                                            }`}
                                        />
                                        {live ? 'SINKRON' : 'MENYUSUL'}
                                    </div>
                                )}
                            <button
                                type="button"
                                onClick={() => {
                                    const next = !muted;
                                    sound.setMuted(next);
                                    setMuted(next);
                                }}
                                aria-label={
                                    muted ? 'Nyalakan suara' : 'Bisukan'
                                }
                                title={muted ? 'Nyalakan suara' : 'Bisukan'}
                                className={`absolute top-3 right-3 z-30 flex items-center justify-center rounded-lg border border-cyan-400/30 bg-slate-950/70 text-slate-200 backdrop-blur-md transition-all duration-200 hover:border-cyan-300 hover:bg-cyan-500/20 hover:text-white hover:shadow-[0_0_12px_rgba(34,211,238,0.4)] ${isTouch ? 'size-11' : 'size-9'}`}
                            >
                                {muted ? (
                                    <VolumeX className="size-4 text-red-400" />
                                ) : (
                                    <Volume2 className="size-4 text-cyan-300" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowHud((v) => !v)}
                                aria-label={
                                    showHud ? 'Sembunyikan UI' : 'Tampilkan UI'
                                }
                                title={
                                    showHud
                                        ? 'Sembunyikan UI (o)'
                                        : 'Tampilkan UI (o)'
                                }
                                className={`absolute top-3 z-30 flex items-center justify-center rounded-lg border border-cyan-400/30 bg-slate-950/70 text-slate-200 backdrop-blur-md transition-all duration-200 hover:border-cyan-300 hover:bg-cyan-500/20 hover:text-white hover:shadow-[0_0_12px_rgba(34,211,238,0.4)] ${isTouch ? 'right-[3.9rem] size-11' : 'right-14 size-9'}`}
                            >
                                {showHud ? (
                                    <EyeOff className="size-4 text-slate-400" />
                                ) : (
                                    <Eye className="size-4 text-cyan-300" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setInvOpen((v) => !v)}
                                aria-label="Tas item"
                                title="Tas item (B)"
                                className={`absolute top-3 z-30 flex items-center justify-center rounded-lg border bg-slate-950/70 backdrop-blur-md transition-all duration-200 hover:border-cyan-300 hover:bg-cyan-500/20 hover:text-white ${
                                    invOpen
                                        ? 'border-cyan-300 text-cyan-300'
                                        : 'border-cyan-400/30 text-slate-200'
                                } ${isTouch ? 'right-[7.05rem] size-11' : 'right-[5.5rem] size-9'}`}
                            >
                                <Package className="size-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    sound.click();
                                    setInvOpen(false);
                                    setPaused(true);
                                }}
                                aria-label="Jeda"
                                title="Jeda (Esc)"
                                className={`absolute top-3 z-30 flex items-center justify-center rounded-lg border border-cyan-400/30 bg-slate-950/70 text-slate-200 backdrop-blur-md transition-all duration-200 hover:border-cyan-300 hover:bg-cyan-500/20 hover:text-white hover:shadow-[0_0_12px_rgba(34,211,238,0.4)] ${isTouch ? 'right-[10.4rem] size-11' : 'right-[8.25rem] size-9'}`}
                            >
                                <Pause className="size-4" />
                            </button>

                            {invOpen && hud && phase !== 'title' && (
                                <div className="absolute top-16 right-3 z-30 w-full max-w-xs rounded-xl border border-cyan-400/25 bg-slate-950/90 p-3 text-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-md">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="font-pixel text-[10px] tracking-wider text-cyan-300">
                                            TAS ITEM
                                        </span>
                                        <span className="font-mono text-[10px] text-slate-400">
                                            {hud.inv.length}/8
                                        </span>
                                    </div>
                                    <div className="mb-2 grid grid-cols-2 gap-1.5">
                                        <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1">
                                            <div className="text-[9px] text-slate-400">
                                                Senjata
                                            </div>
                                            <div
                                                className="truncate text-[11px] font-bold"
                                                style={{
                                                    color:
                                                        hud.weapon?.color ??
                                                        '#94a3b8',
                                                }}
                                            >
                                                {hud.weapon
                                                    ? hud.weapon.name
                                                    : '—'}
                                            </div>
                                        </div>
                                        <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1">
                                            <div className="text-[9px] text-slate-400">
                                                Armor
                                            </div>
                                            <div
                                                className="truncate text-[11px] font-bold"
                                                style={{
                                                    color:
                                                        hud.armor?.color ??
                                                        '#94a3b8',
                                                }}
                                            >
                                                {hud.armor
                                                    ? hud.armor.name
                                                    : '—'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="max-h-[40vh] space-y-1 overflow-y-auto pr-1">
                                        {hud.inv.length === 0 && (
                                            <div className="py-3 text-center text-[11px] text-slate-400">
                                                Belum ada item. Bunuh musuh
                                                untuk drop.
                                            </div>
                                        )}
                                        {hud.inv.map((it, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5"
                                            >
                                                <span
                                                    className="size-5 shrink-0 rounded"
                                                    style={{
                                                        background: it.color,
                                                    }}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div
                                                        className="truncate text-[11px] font-bold"
                                                        style={{
                                                            color: it.color,
                                                        }}
                                                    >
                                                        {it.name}
                                                        {it.kind === 'heal' &&
                                                        it.count > 1
                                                            ? ` x${it.count}`
                                                            : ''}
                                                    </div>
                                                    <div className="font-mono text-[9px] text-slate-400">
                                                        {it.kind === 'heal'
                                                            ? '+40 HP'
                                                            : it.kind ===
                                                                'weapon'
                                                              ? `+${it.dmg} dmg`
                                                              : `+${it.hp} HP · -${Math.round((it.red ?? 0) * 100)}% dmg`}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    aria-label={`Gunakan ${it.name}`}
                                                    onClick={() => {
                                                        sound.click();
                                                        gameRef.current?.useItem(
                                                            i,
                                                        );
                                                    }}
                                                    className="rounded bg-cyan-500/20 px-2 py-1 font-pixel text-[8px] text-cyan-200 transition-colors hover:bg-cyan-500/35"
                                                >
                                                    {it.kind === 'heal'
                                                        ? 'PAKAI'
                                                        : 'EQUIP'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        gameRef.current?.discardItem(
                                                            i,
                                                        )
                                                    }
                                                    aria-label="Buang"
                                                    className="rounded bg-red-500/15 p-1 text-red-300 transition-colors hover:bg-red-500/30"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {hud && phase !== 'title' && showHud && (
                                <div
                                    className="[container-type:size] pointer-events-none absolute z-10"
                                    style={{
                                        left: viewBox.l,
                                        top: viewBox.t,
                                        width: viewBox.w,
                                        height: viewBox.h,
                                    }}
                                >
                                    <div
                                        className="absolute inset-x-0 top-0 flex items-stretch justify-between gap-[1.2%] px-[1.5%] pt-[1%] pb-[4%]"
                                        style={{
                                            background:
                                                'linear-gradient(to right, rgba(2,6,23,0.92) 0%, rgba(2,6,23,0.55) 16%, rgba(2,6,23,0) 34%, rgba(2,6,23,0) 66%, rgba(2,6,23,0.55) 84%, rgba(2,6,23,0.92) 100%)',
                                            maskImage:
                                                'linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%)',
                                            WebkitMaskImage:
                                                'linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%)',
                                        }}
                                    >
                                        {/* Left: Brand & Map tag */}
                                        <div className="flex shrink-0 flex-col justify-center border-r border-white/10 pr-[0.8%]">
                                            <div className="flex items-center gap-[0.5cqw]">
                                                <span className="size-[0.7cqw] animate-pulse rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                                                <span
                                                    className="font-pixel tracking-wider text-cyan-300"
                                                    style={{
                                                        fontSize: '1.9cqw',
                                                    }}
                                                >
                                                    F3N
                                                </span>
                                            </div>
                                            <div
                                                className="mt-[0.2cqw] flex items-center gap-[0.3cqw] font-mono text-cyan-200"
                                                style={{ fontSize: '1.1cqw' }}
                                            >
                                                <Compass className="size-[1.1cqw] shrink-0 text-cyan-400" />
                                                <span className="max-w-[10cqw] truncate font-bold text-slate-300 uppercase">
                                                    {hud.mapLabel}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right: Wave pill & Score */}
                                        <div className="flex shrink-0 flex-col items-end justify-center border-l border-white/10 pl-[0.8%]">
                                            <div className="flex items-center gap-[0.4cqw] rounded-full border border-amber-400/40 bg-amber-950/40 px-[0.8cqw] py-[0.2cqw]">
                                                <Flame className="size-[1.2cqw] shrink-0 text-amber-300" />
                                                <span
                                                    className="font-pixel text-amber-300"
                                                    style={{
                                                        fontSize: '1.3cqw',
                                                    }}
                                                >
                                                    W{hud.wave}/{hud.waveTotal}
                                                </span>
                                            </div>
                                            <div
                                                className="mt-[0.3cqw] flex items-center gap-[0.4cqw] font-mono font-black text-white"
                                                style={{ fontSize: '1.8cqw' }}
                                            >
                                                <Trophy className="size-[1.3cqw] text-amber-400" />
                                                <span>
                                                    {hud.score.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Party panel (bottom-left, compact) */}
                                    {!dialog && !mapBig && (
                                        <div
                                            onClick={
                                                partyCompact
                                                    ? () => {
                                                          sound.click();
                                                          setPartyOpen(true);
                                                      }
                                                    : undefined
                                            }
                                            className={`pointer-events-auto absolute left-[1.5%] flex rounded-[0.7cqw] border border-white/10 bg-slate-950/55 px-[0.7cqw] py-[0.6cqw] backdrop-blur-sm ${partyCompact ? 'cursor-pointer' : ''} ${
                                                partyCompact
                                                    ? 'bottom-[8.5rem] flex-row items-end gap-[0.55cqw]'
                                                    : `flex-col gap-[0.4cqw] ${isTouch ? 'bottom-[8.5rem]' : 'bottom-[2%]'}`
                                            }`}
                                        >
                                            {hud.party.map((m, i) => {
                                                const isMe = netActive
                                                    ? i === online?.myHero
                                                    : m.tag === 'P1';
                                                const baseName = netActive
                                                    ? (online?.roster.find(
                                                          (r) => r.hero === i,
                                                      )?.name ?? m.name)
                                                    : m.name;
                                                const pname =
                                                    isMe && playerName.trim()
                                                        ? playerName.trim()
                                                        : baseName;
                                                const hpPct = Math.max(
                                                    0,
                                                    Math.min(1, m.hp / m.maxHp),
                                                );
                                                const isLowHp =
                                                    m.alive && hpPct <= 0.35;
                                                const poster =
                                                    isMe && localPhoto
                                                        ? localPhoto
                                                        : POSTER_IMG[i];

                                                return (
                                                    <div
                                                        key={m.name}
                                                        className={`flex ${partyCompact ? 'flex-col items-center gap-[0.25cqw]' : 'items-center gap-[0.45cqw]'} ${m.alive ? '' : 'opacity-45 grayscale'}`}
                                                    >
                                                        <div
                                                            className={`shrink-0 overflow-hidden rounded-[0.35cqw] border ${partyCompact ? 'size-[2.3cqw]' : 'size-[2.4cqw]'}`}
                                                            style={{
                                                                borderColor:
                                                                    m.color,
                                                                boxShadow: isMe
                                                                    ? `0 0 0.5cqw ${m.color}88`
                                                                    : 'none',
                                                            }}
                                                        >
                                                            {poster ? (
                                                                <img
                                                                    src={poster}
                                                                    alt={pname}
                                                                    className="size-full object-cover object-top"
                                                                    onError={(
                                                                        e,
                                                                    ) => {
                                                                        e.currentTarget.style.display =
                                                                            'none';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="flex size-full items-center justify-center font-pixel text-[1.1cqw] text-slate-950"
                                                                    style={{
                                                                        background:
                                                                            m.color,
                                                                    }}
                                                                >
                                                                    {pname[0]}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {partyCompact ? (
                                                            <div className="h-[0.4cqw] w-[2.3cqw] overflow-hidden rounded-full bg-black/70">
                                                                <div
                                                                    className={`h-full rounded-full transition-all duration-200 ${
                                                                        isLowHp
                                                                            ? 'animate-pulse bg-red-400'
                                                                            : 'bg-emerald-400'
                                                                    }`}
                                                                    style={{
                                                                        width: `${hpPct * 100}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-[10cqw]">
                                                                <div className="flex items-center gap-[0.35cqw]">
                                                                    <span
                                                                        className="truncate font-bold"
                                                                        style={{
                                                                            fontSize:
                                                                                '0.9cqw',
                                                                            color: m.color,
                                                                        }}
                                                                    >
                                                                        {pname}
                                                                    </span>
                                                                    {isMe && (
                                                                        <span
                                                                            className="shrink-0 rounded-[0.2cqw] bg-cyan-400/90 px-[0.3cqw] font-pixel text-slate-950"
                                                                            style={{
                                                                                fontSize:
                                                                                    '0.55cqw',
                                                                            }}
                                                                        >
                                                                            YOU
                                                                        </span>
                                                                    )}
                                                                    <span
                                                                        className="ml-auto shrink-0 font-mono text-slate-400"
                                                                        style={{
                                                                            fontSize:
                                                                                '0.7cqw',
                                                                        }}
                                                                    >
                                                                        {m.role}
                                                                    </span>
                                                                </div>
                                                                <div className="mt-[0.2cqw] h-[0.45cqw] overflow-hidden rounded-full bg-black/60">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all duration-200 ${
                                                                            isLowHp
                                                                                ? 'animate-pulse bg-gradient-to-r from-red-600 to-rose-400'
                                                                                : 'bg-gradient-to-r from-rose-500 to-pink-400'
                                                                        }`}
                                                                        style={{
                                                                            width: `${hpPct * 100}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {isTouch && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        sound.click();
                                                        setPartyOpen((v) => !v);
                                                    }}
                                                    aria-label={
                                                        partyCompact
                                                            ? 'Perluas panel party'
                                                            : 'Ringkas panel party'
                                                    }
                                                    aria-expanded={
                                                        !partyCompact
                                                    }
                                                    className={`absolute flex size-8 items-center justify-center rounded-full border border-cyan-300/40 bg-slate-950/95 text-cyan-200 shadow-[0_2px_8px_rgba(0,0,0,0.5)] active:scale-95 ${partyCompact ? '-top-10 right-0' : '-top-3 -right-3'}`}
                                                >
                                                    {partyCompact ? (
                                                        <ChevronUp className="size-4" />
                                                    ) : (
                                                        <ChevronDown className="size-4" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {hud.quests &&
                                        phase === 'quest' &&
                                        !dialog && (
                                            <div className="pointer-events-auto absolute top-[14%] left-[1.5%] w-[21%] rounded-[0.7cqw] border border-amber-400/30 bg-slate-950/70 px-[0.9cqw] py-[0.7cqw] backdrop-blur-sm">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        sound.click();
                                                        setQuestOpen((v) => !v);
                                                    }}
                                                    className={`flex w-full items-center gap-[0.4cqw] ${
                                                        questOpen
                                                            ? 'border-b border-amber-400/20 pb-[0.4cqw]'
                                                            : ''
                                                    }`}
                                                >
                                                    <Compass className="size-[0.95cqw] shrink-0 text-amber-300" />
                                                    <span
                                                        className="font-pixel tracking-wide text-amber-300"
                                                        style={{
                                                            fontSize: '0.95cqw',
                                                        }}
                                                    >
                                                        QUEST
                                                    </span>
                                                    <span
                                                        className="ml-auto rounded-full bg-amber-400/15 px-[0.4cqw] font-mono text-amber-200"
                                                        style={{
                                                            fontSize: '0.7cqw',
                                                        }}
                                                    >
                                                        {
                                                            hud.quests.filter(
                                                                (q) =>
                                                                    q.done >=
                                                                    q.need,
                                                            ).length
                                                        }
                                                        /{hud.quests.length}
                                                    </span>
                                                    <ChevronDown
                                                        className={`size-[0.8cqw] shrink-0 text-amber-300/80 transition-transform duration-200 ${
                                                            questOpen
                                                                ? ''
                                                                : '-rotate-90'
                                                        }`}
                                                    />
                                                </button>
                                                {questOpen && (
                                                    <>
                                                        <div className="mt-[0.55cqw] space-y-[0.5cqw]">
                                                            {hud.quests.map(
                                                                (q) => {
                                                                    const ok =
                                                                        q.done >=
                                                                        q.need;

                                                                    return (
                                                                        <div
                                                                            key={
                                                                                q.label
                                                                            }
                                                                        >
                                                                            <div className="flex items-center gap-[0.35cqw]">
                                                                                <span
                                                                                    className={`inline-flex size-[0.85cqw] shrink-0 items-center justify-center rounded-full ${
                                                                                        ok
                                                                                            ? 'bg-green-500 text-slate-950'
                                                                                            : 'bg-white/10 text-amber-300'
                                                                                    }`}
                                                                                    style={{
                                                                                        fontSize:
                                                                                            '0.55cqw',
                                                                                    }}
                                                                                >
                                                                                    {ok
                                                                                        ? '✓'
                                                                                        : '•'}
                                                                                </span>
                                                                                <span
                                                                                    className={`truncate font-mono ${ok ? 'text-green-300' : 'text-slate-200'}`}
                                                                                    style={{
                                                                                        fontSize:
                                                                                            '0.9cqw',
                                                                                    }}
                                                                                >
                                                                                    {
                                                                                        q.label
                                                                                    }
                                                                                </span>
                                                                                <span
                                                                                    className={`ml-auto shrink-0 font-mono ${ok ? 'text-green-300' : 'text-amber-300'}`}
                                                                                    style={{
                                                                                        fontSize:
                                                                                            '0.85cqw',
                                                                                    }}
                                                                                >
                                                                                    {
                                                                                        q.done
                                                                                    }

                                                                                    /
                                                                                    {
                                                                                        q.need
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                            <div className="mt-[0.25cqw] h-[0.4cqw] overflow-hidden rounded-full bg-black/60">
                                                                                <div
                                                                                    className={`h-full transition-all duration-300 ${
                                                                                        ok
                                                                                            ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                                                                                            : 'bg-gradient-to-r from-amber-500 to-yellow-300'
                                                                                    }`}
                                                                                    style={{
                                                                                        width: `${(q.done / Math.max(1, q.need)) * 100}%`,
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={skipQuest}
                                                            className="mt-[0.6cqw] flex w-full items-center gap-[0.4cqw] rounded-[0.5cqw] border border-fuchsia-400/40 bg-fuchsia-500/10 px-[0.6cqw] py-[0.35cqw] font-pixel tracking-wide text-fuchsia-200 transition-colors hover:bg-fuchsia-500/25"
                                                            style={{
                                                                fontSize:
                                                                    '0.7cqw',
                                                            }}
                                                        >
                                                            <FastForward
                                                                className="text-fuchsia-300"
                                                                style={{
                                                                    fontSize:
                                                                        '0.85cqw',
                                                                }}
                                                            />
                                                            SKIP SEMUA
                                                            {hud?.skip && (
                                                                <span
                                                                    className="ml-auto rounded-full bg-fuchsia-400/15 px-[0.4cqw] font-mono text-fuchsia-200"
                                                                    style={{
                                                                        fontSize:
                                                                            '0.7cqw',
                                                                    }}
                                                                >
                                                                    {
                                                                        hud.skip
                                                                            ?.votes
                                                                    }
                                                                    /
                                                                    {
                                                                        hud.skip
                                                                            ?.total
                                                                    }
                                                                </span>
                                                            )}
                                                        </button>
                                                        <div
                                                            className="mt-[0.6cqw] flex items-center gap-[0.35cqw] font-mono text-slate-400"
                                                            style={{
                                                                fontSize:
                                                                    '0.75cqw',
                                                            }}
                                                        >
                                                            <span className="shrink-0 font-bold text-amber-400">
                                                                TIPS
                                                            </span>
                                                            <span className="truncate">
                                                                Dekati target,
                                                                tekan E
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    {/* Bottom action bar: heart + hotbar + soul orb */}
                                    {phase === 'combat' && !dialog && (
                                        <div
                                            className="pointer-events-none absolute bottom-[3%] left-1/2 flex -translate-x-1/2 items-center gap-[1.6cqw] rounded-[2cqw] border border-white/12 px-[2.2cqw] py-[1.1cqw] backdrop-blur-md"
                                            style={{
                                                background:
                                                    'linear-gradient(180deg, rgba(15,23,42,0.82), rgba(2,6,23,0.92))',
                                                boxShadow:
                                                    '0 10px 36px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.08)',
                                            }}
                                        >
                                            {(() => {
                                                const meIdx = netActive
                                                    ? (online?.myHero ?? 0)
                                                    : Math.max(
                                                          0,
                                                          hud.party.findIndex(
                                                              (p) =>
                                                                  p.tag ===
                                                                  'P1',
                                                          ),
                                                      );
                                                const me = hud.party[meIdx];
                                                const hp = me
                                                    ? Math.ceil(me.hp)
                                                    : 0;
                                                const low = me
                                                    ? me.alive &&
                                                      me.hp / me.maxHp <= 0.35
                                                    : false;

                                                return (
                                                    <>
                                                        <div
                                                            className="relative grid size-[4.6cqw] place-items-center rounded-full border border-rose-400/25"
                                                            style={{
                                                                background: low
                                                                    ? 'radial-gradient(circle at 50% 40%, rgba(239,68,68,0.45), rgba(2,6,23,0.9) 72%)'
                                                                    : 'radial-gradient(circle at 50% 40%, rgba(244,63,94,0.25), rgba(2,6,23,0.9) 72%)',
                                                                boxShadow: low
                                                                    ? '0 0 1.3cqw rgba(239,68,68,0.75)'
                                                                    : 'inset 0 0 1cqw rgba(244,63,94,0.28)',
                                                            }}
                                                        >
                                                            <Heart
                                                                className={`size-[2.9cqw] ${low ? 'animate-pulse' : ''}`}
                                                                strokeWidth={0}
                                                                style={{
                                                                    fill: low
                                                                        ? '#ef4444'
                                                                        : '#f43f5e',
                                                                    filter: 'drop-shadow(0 0 0.6cqw rgba(244,63,94,0.7))',
                                                                }}
                                                            />
                                                            <span
                                                                className="absolute bottom-[9%] font-mono font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]"
                                                                style={{
                                                                    fontSize:
                                                                        '1.05cqw',
                                                                }}
                                                            >
                                                                {hp}
                                                            </span>
                                                        </div>

                                                        <span className="h-[3cqw] w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />

                                                        <div className="flex items-center gap-[0.8cqw]">
                                                            <HotbarSlot
                                                                label="J"
                                                                color="#ef4444"
                                                                cd={0}
                                                                max={1}
                                                                icon={
                                                                    <Swords className="size-[2.2cqw] text-red-300" />
                                                                }
                                                                onPress={() =>
                                                                    doAction(
                                                                        'atk',
                                                                    )
                                                                }
                                                            />
                                                            <HotbarSlot
                                                                label="⇧"
                                                                color="#22d3ee"
                                                                cd={
                                                                    me?.dodgeCd ??
                                                                    0
                                                                }
                                                                max={
                                                                    me?.dodgeMax ??
                                                                    1.2
                                                                }
                                                                icon={
                                                                    <Wind className="size-[2.2cqw] text-cyan-300" />
                                                                }
                                                                onPress={() =>
                                                                    doAction(
                                                                        'dge',
                                                                    )
                                                                }
                                                            />
                                                            <HotbarSlot
                                                                label="1"
                                                                color="#fbbf24"
                                                                cd={
                                                                    me?.skillCd ??
                                                                    0
                                                                }
                                                                max={
                                                                    me?.skillMax ??
                                                                    1
                                                                }
                                                                cost={
                                                                    SOUL_COST_SKILL
                                                                }
                                                                souls={
                                                                    hud.souls
                                                                }
                                                                icon={
                                                                    <Zap className="size-[2.2cqw] text-amber-300" />
                                                                }
                                                                onPress={() =>
                                                                    doAction(
                                                                        'skl',
                                                                    )
                                                                }
                                                            />
                                                            <HotbarSlot
                                                                label="E"
                                                                color="#4ade80"
                                                                cd={0}
                                                                max={1}
                                                                icon={
                                                                    <Compass className="size-[2.2cqw] text-green-300" />
                                                                }
                                                                onPress={() =>
                                                                    doAction(
                                                                        'itr',
                                                                    )
                                                                }
                                                            />
                                                        </div>

                                                        <div className="flex flex-col items-center gap-[0.3cqw]">
                                                            <SoulOrb
                                                                value={
                                                                    hud.souls
                                                                }
                                                                ratio={
                                                                    hud.soulsMax >
                                                                    0
                                                                        ? hud.souls /
                                                                          hud.soulsMax
                                                                        : 0
                                                                }
                                                            />
                                                            <span
                                                                className="font-mono font-bold tracking-widest text-cyan-200/80 uppercase"
                                                                style={{
                                                                    fontSize:
                                                                        '0.85cqw',
                                                                }}
                                                            >
                                                                Souls
                                                            </span>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}

                            <AnimatePresence mode="wait" initial={false}>
                                {phase === 'title' && tab === 'solo' && (
                                    <motion.div
                                        key="title-solo"
                                        className="absolute inset-0 overflow-y-auto overscroll-contain bg-[#070b16]"
                                        initial={{ opacity: 0, x: 60 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -60 }}
                                        transition={{
                                            duration: 0.28,
                                            ease: 'easeOut',
                                        }}
                                    >
                                        {/* Dungeon: bata, obor, bara, vignette */}
                                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                                            <div className="absolute inset-0 bg-[radial-gradient(rgba(148,163,184,0.1)_1px,transparent_1.6px)] bg-[size:20px_20px]" />
                                            <div className="absolute inset-x-0 top-0 h-5 bg-[repeating-linear-gradient(90deg,#26314d_0px,#26314d_24px,transparent_24px,transparent_40px)] opacity-70" />
                                            <div className="absolute inset-x-0 bottom-0 h-5 bg-[repeating-linear-gradient(90deg,#26314d_0px,#26314d_24px,transparent_24px,transparent_40px)] opacity-70" />
                                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.55)_100%)]" />
                                            {[
                                                { cls: 'left-8', d: 0 },
                                                { cls: 'right-8', d: 0.8 },
                                            ].map((t) => (
                                                <div
                                                    key={t.cls}
                                                    className={`absolute top-1/3 ${t.cls} flex flex-col items-center`}
                                                >
                                                    <motion.div
                                                        className="size-9 rounded-full bg-orange-400 blur-[7px]"
                                                        animate={{
                                                            opacity: [
                                                                0.65, 1, 0.8, 1,
                                                            ],
                                                            scale: [
                                                                1, 1.18, 1.05,
                                                                1,
                                                            ],
                                                        }}
                                                        transition={{
                                                            duration: 1.7,
                                                            repeat: Infinity,
                                                            delay: t.d,
                                                        }}
                                                    />
                                                    <div className="h-24 w-2 rounded bg-gradient-to-b from-amber-700 to-amber-950" />
                                                </div>
                                            ))}
                                            {Array.from({ length: 12 }).map(
                                                (_, i) => (
                                                    <motion.span
                                                        key={i}
                                                        aria-hidden="true"
                                                        className={`absolute bottom-6 size-1.5 ${i % 3 === 0 ? 'bg-amber-300' : i % 3 === 1 ? 'bg-orange-500' : 'bg-red-400'}`}
                                                        style={{
                                                            left: `${6 + ((i * 79) % 88)}%`,
                                                        }}
                                                        animate={{
                                                            y: [0, -280],
                                                            x: [
                                                                0,
                                                                i % 2 === 0
                                                                    ? 18
                                                                    : -18,
                                                                0,
                                                            ],
                                                            opacity: [0, 1, 0],
                                                        }}
                                                        transition={{
                                                            duration:
                                                                4 + (i % 4),
                                                            repeat: Infinity,
                                                            delay:
                                                                (i % 5) * 0.7,
                                                            ease: 'easeOut',
                                                        }}
                                                    />
                                                ),
                                            )}
                                        </div>

                                        <div
                                            className={`relative flex min-h-full flex-col items-center p-3 text-center sm:p-6 ${isTouch ? 'justify-start gap-3' : 'justify-center gap-5'}`}
                                        >
                                            {/* Title logo */}
                                            <motion.div
                                                initial={{ opacity: 0, y: -20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.5,
                                                    ease: 'easeOut',
                                                }}
                                            >
                                                <div
                                                    aria-label="F3N STORY"
                                                    className={`font-pixel text-cyan-300 [text-shadow:0_0_28px_rgba(34,211,238,0.7),0_0_60px_rgba(34,211,238,0.3),4px_4px_0_rgba(2,6,23,1)] sm:text-5xl ${isTouch ? 'text-2xl' : 'text-4xl'}`}
                                                >
                                                    F3N STORY
                                                    <span className="ml-2 inline-block h-7 w-3.5 animate-pulse rounded-sm bg-cyan-300 align-baseline shadow-[0_0_12px_rgba(34,211,238,0.6)] sm:h-10" />
                                                </div>
                                                <motion.div
                                                    className={`mt-2 font-mono text-[10px] tracking-[0.3em] text-amber-300/90 ${isTouch ? 'hidden' : 'mt-3 text-[11px] tracking-[0.35em]'}`}
                                                    animate={{
                                                        opacity: [0.6, 1, 0.6],
                                                    }}
                                                    transition={{
                                                        duration: 3,
                                                        repeat: Infinity,
                                                        ease: 'easeInOut',
                                                    }}
                                                >
                                                    ⚔ GERBANG DUNGEON DIBUKA ⚔
                                                </motion.div>
                                            </motion.div>

                                            {/* Subtitle card */}
                                            <div
                                                className={`relative max-w-md overflow-hidden rounded-lg border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-white/[0.04] to-fuchsia-500/10 backdrop-blur-sm ${isTouch ? 'px-3 py-1.5' : 'px-5 py-2.5'}`}
                                            >
                                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                                                <p className="relative font-mono text-xs leading-5 text-slate-300">
                                                    {isTouch
                                                        ? '4 hero · analog gerak · tombol aksi di layar'
                                                        : 'RPG pixel 4 hero · 1 keyboard khusus pemain solo · 3 AI companion'}
                                                </p>
                                            </div>

                                            {/* Tab switcher */}
                                            <div className="flex gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] p-1 backdrop-blur-sm">
                                                {(
                                                    [
                                                        {
                                                            id: 'solo',
                                                            label: 'Main Sendiri',
                                                            icon: (
                                                                <User className="size-3.5" />
                                                            ),
                                                        },
                                                        {
                                                            id: 'online',
                                                            label: 'Online 2-4 Pemain',
                                                            icon: (
                                                                <Users className="size-3.5" />
                                                            ),
                                                        },
                                                    ] as const
                                                ).map((t) => (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        role="tab"
                                                        aria-selected={
                                                            tab === t.id
                                                        }
                                                        onClick={() =>
                                                            setTab(t.id)
                                                        }
                                                        className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 font-pixel text-[10px] transition-all duration-200 ${
                                                            tab === t.id
                                                                ? 'bg-cyan-400 text-[#06202a] shadow-[0_0_16px_rgba(34,211,238,0.4)]'
                                                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                                        }`}
                                                    >
                                                        {t.icon}
                                                        {t.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Hero showcase cards */}
                                            <div
                                                className={`grid w-full max-w-lg grid-cols-4 ${isTouch ? 'gap-2' : 'gap-3'}`}
                                            >
                                                {HEROES.map((h, i) => {
                                                    const active =
                                                        heroPick === i;

                                                    return (
                                                        <motion.button
                                                            key={h.name}
                                                            type="button"
                                                            onClick={() => {
                                                                sound.click();
                                                                setHeroPick(i);
                                                                setSkinPick(0);
                                                            }}
                                                            className={`group relative overflow-hidden rounded-xl border-2 text-left shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-all duration-300 ${
                                                                active
                                                                    ? 'scale-[1.03] border-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.5)]'
                                                                    : 'border-white/10 bg-gradient-to-b from-white/[0.08] to-transparent hover:border-cyan-300/40'
                                                            }`}
                                                            animate={{
                                                                y: [0, -5, 0],
                                                            }}
                                                            transition={{
                                                                duration: 2.5,
                                                                repeat: Infinity,
                                                                delay: i * 0.25,
                                                                ease: 'easeInOut',
                                                            }}
                                                        >
                                                            <div
                                                                className={`relative overflow-hidden ${isTouch ? 'aspect-square' : 'aspect-[3/4]'}`}
                                                            >
                                                                {POSTER_IMG[
                                                                    i
                                                                ] ? (
                                                                    <img
                                                                        src={
                                                                            POSTER_IMG[
                                                                                i
                                                                            ]
                                                                        }
                                                                        alt={`Poster ${h.name}`}
                                                                        loading="lazy"
                                                                        className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                                                                    />
                                                                ) : (
                                                                    <span
                                                                        className="flex size-full items-center justify-center"
                                                                        style={{
                                                                            background: `linear-gradient(180deg, ${h.color}55, #0b1226)`,
                                                                        }}
                                                                    >
                                                                        <span className="font-pixel text-3xl text-white drop-shadow-[3px_3px_0_rgba(2,6,23,0.9)]">
                                                                            {
                                                                                h
                                                                                    .name[0]
                                                                            }
                                                                        </span>
                                                                    </span>
                                                                )}
                                                                {/* Shimmer sweep */}
                                                                <div
                                                                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                                                                    style={{
                                                                        transform:
                                                                            'skewX(-20deg) translateX(-100%)',
                                                                        animation:
                                                                            'none',
                                                                    }}
                                                                />
                                                                {/* Role badge */}
                                                                <div className="absolute top-1.5 left-1.5">
                                                                    <span
                                                                        className="rounded px-1.5 py-0.5 font-pixel text-[7px] font-black tracking-wider text-slate-950 uppercase shadow-md"
                                                                        style={{
                                                                            background:
                                                                                h.color,
                                                                            boxShadow: `0 0 10px ${h.color}66`,
                                                                        }}
                                                                    >
                                                                        {h.role}
                                                                    </span>
                                                                </div>
                                                                {active && (
                                                                    <div className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-md">
                                                                        <Check className="size-3 stroke-[3]" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="border-t border-white/10 bg-gradient-to-t from-slate-950 to-slate-900/80 px-1.5 py-1.5 text-center">
                                                                <div className="font-pixel text-[8px] tracking-wide text-white">
                                                                    {h.name.toUpperCase()}
                                                                </div>
                                                                <div
                                                                    className="mt-0.5 font-mono text-[8px]"
                                                                    style={{
                                                                        color: h.color,
                                                                    }}
                                                                >
                                                                    ★{' '}
                                                                    {
                                                                        h.skill
                                                                            .name
                                                                    }
                                                                </div>
                                                            </div>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>

                                            {/* Customize: skin + nama + foto */}
                                            <div className="flex w-full max-w-lg flex-col gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-pixel text-[9px] tracking-wider text-slate-400">
                                                        SKIN
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {SKINS[heroPick]?.map(
                                                            (s, i) => (
                                                                <button
                                                                    key={s.name}
                                                                    type="button"
                                                                    title={
                                                                        s.name
                                                                    }
                                                                    onClick={() => {
                                                                        sound.click();
                                                                        setSkinPick(
                                                                            i,
                                                                        );
                                                                    }}
                                                                    className={`size-6 rounded-md border-2 transition-transform duration-150 ${
                                                                        skinPick ===
                                                                        i
                                                                            ? 'scale-115 border-white shadow-[0_0_12px_rgba(255,255,255,0.7)]'
                                                                            : 'border-white/20 opacity-70 hover:border-white/60 hover:opacity-100'
                                                                    }`}
                                                                    style={{
                                                                        background:
                                                                            s.color,
                                                                    }}
                                                                />
                                                            ),
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="shrink-0 font-pixel text-[9px] tracking-wider text-slate-400">
                                                        NAMA
                                                    </span>
                                                    <input
                                                        value={playerName}
                                                        onChange={(e) =>
                                                            setPlayerName(
                                                                e.target.value.slice(
                                                                    0,
                                                                    16,
                                                                ),
                                                            )
                                                        }
                                                        aria-label="Nama pemain"
                                                        placeholder="Nama kamu..."
                                                        className={`min-w-0 flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-slate-400 focus:border-cyan-300/60 focus:outline-none ${isTouch ? 'text-base' : 'text-sm'}`}
                                                    />
                                                    <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 font-pixel text-[9px] text-slate-200 transition-colors hover:border-cyan-300/50">
                                                        {localPhoto
                                                            ? 'GANTI'
                                                            : 'FOTO'}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={
                                                                onPhotoPick
                                                            }
                                                        />
                                                    </label>
                                                    {photoError && (
                                                        <span className="font-mono text-[9px] text-red-300">
                                                            {photoError}
                                                        </span>
                                                    )}
                                                    {localPhoto && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setLocalPhoto(
                                                                    null,
                                                                )
                                                            }
                                                            className="shrink-0 rounded-lg border border-red-400/30 bg-red-500/15 px-2.5 py-2 font-pixel text-[9px] text-red-200 transition-colors hover:bg-red-500/25"
                                                        >
                                                            HAPUS
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* START button */}
                                            <motion.button
                                                type="button"
                                                onClick={() => {
                                                    sound.click();
                                                    startSolo();
                                                }}
                                                className={`group relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl border-2 border-cyan-200 ${isTouch ? 'sticky bottom-2 z-20' : ''} bg-gradient-to-b from-cyan-300 to-cyan-500 ${isTouch ? 'px-8 py-3 text-[11px]' : 'px-10 py-4 text-[13px]'} font-pixel text-[#06202a] shadow-[0_6px_0_#0e7490,0_0_30px_rgba(34,211,238,0.35)] transition-all duration-150 hover:brightness-110 active:translate-y-[3px] active:shadow-[0_3px_0_#0e7490,0_0_20px_rgba(34,211,238,0.25)]`}
                                                animate={{
                                                    boxShadow: [
                                                        '0 6px 0 #0e7490, 0 0 30px rgba(34,211,238,0.35)',
                                                        '0 6px 0 #0e7490, 0 0 50px rgba(34,211,238,0.55)',
                                                        '0 6px 0 #0e7490, 0 0 30px rgba(34,211,238,0.35)',
                                                    ],
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: 'easeInOut',
                                                }}
                                            >
                                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                                <Play className="relative size-5" />
                                                <span className="relative">
                                                    MULAI PETUALANGAN
                                                </span>
                                            </motion.button>

                                            {/* Kontrol */}
                                            {isTouch ? (
                                                <div className="grid w-full max-w-lg grid-cols-2 gap-1.5">
                                                    {[
                                                        [
                                                            'ANALOG',
                                                            'kiri bawah = gerak',
                                                        ],
                                                        [
                                                            'AKSI',
                                                            'tombol kanan layar',
                                                        ],
                                                        [
                                                            'SERANG',
                                                            'ketuk area game',
                                                        ],
                                                        [
                                                            'DIALOG',
                                                            'ketuk untuk lanjut',
                                                        ],
                                                    ].map(([key, label]) => (
                                                        <div
                                                            key={key}
                                                            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5"
                                                        >
                                                            <span className="inline-flex shrink-0 rounded-md border border-cyan-300/30 bg-cyan-400/10 px-1.5 py-0.5 font-pixel text-[7px] text-cyan-200">
                                                                {key}
                                                            </span>
                                                            <span className="font-mono text-[9px] text-slate-400">
                                                                {label}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-3">
                                                    {CONTROLS.map((c) => (
                                                        <div
                                                            key={c.key}
                                                            className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 backdrop-blur-sm transition-colors hover:border-cyan-400/20 hover:bg-white/[0.06]"
                                                        >
                                                            <span className="inline-flex rounded-md border border-white/20 bg-white/10 px-2 py-1 font-mono text-[10px] font-bold text-slate-100 shadow-[0_2px_0_rgba(255,255,255,0.1)]">
                                                                {c.p1}
                                                            </span>
                                                            <span className="font-pixel text-[9px] text-slate-400">
                                                                {c.key}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {phase === 'title' &&
                                    tab === 'online' &&
                                    !online && (
                                        <motion.div
                                            key="title-lobby"
                                            className="absolute inset-0 overflow-y-auto overscroll-contain bg-[#070b16]/95 p-4 sm:p-6"
                                            initial={{ opacity: 0, x: 60 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -60 }}
                                            transition={{
                                                duration: 0.28,
                                                ease: 'easeOut',
                                            }}
                                        >
                                            <div
                                                aria-hidden="true"
                                                className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(148,163,184,0.16)_1.5px,transparent_1.6px)] bg-[size:22px_22px]"
                                            />
                                            <div
                                                aria-hidden="true"
                                                className="pointer-events-none absolute -top-20 left-[10%] size-72 rounded-full bg-cyan-500/20 blur-3xl"
                                            />
                                            <div
                                                aria-hidden="true"
                                                className="pointer-events-none absolute right-[5%] -bottom-24 size-80 rounded-full bg-fuchsia-500/15 blur-3xl"
                                            />
                                            {[
                                                {
                                                    l: '12%',
                                                    t: '20%',
                                                    c: 'bg-cyan-400',
                                                    d: 0,
                                                },
                                                {
                                                    l: '85%',
                                                    t: '30%',
                                                    c: 'bg-fuchsia-400',
                                                    d: 0.8,
                                                },
                                                {
                                                    l: '70%',
                                                    t: '75%',
                                                    c: 'bg-amber-300',
                                                    d: 1.6,
                                                },
                                                {
                                                    l: '20%',
                                                    t: '80%',
                                                    c: 'bg-emerald-300',
                                                    d: 2.4,
                                                },
                                            ].map((s, i) => (
                                                <motion.span
                                                    key={i}
                                                    aria-hidden="true"
                                                    className={`pointer-events-none absolute size-2.5 ${s.c} shadow-[0_0_12px_rgba(255,255,255,0.4)]`}
                                                    style={{
                                                        left: s.l,
                                                        top: s.t,
                                                    }}
                                                    animate={{
                                                        y: [0, -12, 0],
                                                        opacity: [0.5, 1, 0.5],
                                                    }}
                                                    transition={{
                                                        duration: 3,
                                                        repeat: Infinity,
                                                        delay: s.d,
                                                        ease: 'easeInOut',
                                                    }}
                                                />
                                            ))}
                                            <div className="relative mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center">
                                                <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                                                    {/* Header */}
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-[0_0_16px_rgba(34,211,238,0.4)]">
                                                            <Users className="size-4 text-white" />
                                                        </div>
                                                        <span className="font-pixel text-sm tracking-wider text-cyan-300">
                                                            ONLINE 2–4 PEMAIN
                                                        </span>
                                                    </div>

                                                    {/* Tab switcher */}
                                                    <div className="flex gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] p-1">
                                                        {(
                                                            [
                                                                {
                                                                    id: 'solo',
                                                                    label: 'Main Sendiri',
                                                                    icon: (
                                                                        <User className="size-3" />
                                                                    ),
                                                                },
                                                                {
                                                                    id: 'online',
                                                                    label: 'Online',
                                                                    icon: (
                                                                        <Users className="size-3" />
                                                                    ),
                                                                },
                                                            ] as const
                                                        ).map((t) => (
                                                            <button
                                                                key={t.id}
                                                                type="button"
                                                                role="tab"
                                                                aria-selected={
                                                                    tab === t.id
                                                                }
                                                                onClick={() =>
                                                                    setTab(t.id)
                                                                }
                                                                className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 font-pixel text-[10px] transition-all duration-200 ${
                                                                    tab === t.id
                                                                        ? 'bg-cyan-400 text-[#06202a] shadow-[0_0_12px_rgba(34,211,238,0.35)]'
                                                                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                                                }`}
                                                            >
                                                                {t.icon}
                                                                {t.label}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Name input */}
                                                    <div className="w-full">
                                                        <label className="mb-1.5 block text-left font-pixel text-[8px] tracking-wider text-slate-400">
                                                            NAMA WARRIOR
                                                        </label>
                                                        <input
                                                            value={playerName}
                                                            onChange={(e) =>
                                                                setPlayerName(
                                                                    e.target.value.slice(
                                                                        0,
                                                                        16,
                                                                    ),
                                                                )
                                                            }
                                                            aria-label="Nama di room"
                                                            placeholder="Masukkan nama..."
                                                            className={`w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] transition-all placeholder:text-slate-400 focus:border-cyan-300/60 focus:shadow-[inset_0_1px_3px_rgba(0,0,0,0.3),0_0_12px_rgba(34,211,238,0.15)] focus:outline-none ${isTouch ? 'text-base' : 'text-sm'}`}
                                                        />
                                                    </div>

                                                    {/* Info tip */}
                                                    <div className="flex w-full items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-500/[0.08] px-3 py-2 text-left">
                                                        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-amber-300" />
                                                        <p className="font-mono text-[11px] leading-5 text-amber-200/80">
                                                            Masuk lobby dulu —
                                                            hero & skin dipilih
                                                            di dalam. Hero yang
                                                            sudah dipakai teman
                                                            terkunci.
                                                        </p>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex w-full gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={lobbyBusy}
                                                            onClick={() =>
                                                                void handleCreate()
                                                            }
                                                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-cyan-300 to-cyan-500 px-4 py-3 font-pixel text-[10px] text-[#06202a] shadow-[0_3px_0_#0e7490] transition-all hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#0e7490] disabled:opacity-50"
                                                        >
                                                            <Plus className="size-4" />
                                                            BUAT ROOM
                                                        </button>
                                                        <input
                                                            value={joinCode}
                                                            onChange={(e) =>
                                                                setJoinCode(
                                                                    e.target.value
                                                                        .toUpperCase()
                                                                        .slice(
                                                                            0,
                                                                            4,
                                                                        ),
                                                                )
                                                            }
                                                            aria-label="Kode room"
                                                            placeholder="KODE"
                                                            inputMode="text"
                                                            autoCapitalize="characters"
                                                            autoComplete="off"
                                                            className={`w-24 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-center font-mono tracking-[0.3em] text-white shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] placeholder:text-slate-400 focus:border-cyan-300/60 focus:outline-none ${isTouch ? 'text-base' : 'text-sm'}`}
                                                        />
                                                        <button
                                                            type="button"
                                                            disabled={lobbyBusy}
                                                            onClick={() =>
                                                                void handleJoin()
                                                            }
                                                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-4 py-3 font-pixel text-[10px] text-white shadow-[0_3px_0_rgba(255,255,255,0.1)] transition-all hover:bg-white/20 active:translate-y-[2px] active:shadow-none disabled:opacity-50"
                                                        >
                                                            <LogIn className="size-4" />
                                                            JOIN
                                                        </button>
                                                    </div>

                                                    {lobbyError && (
                                                        <div
                                                            aria-live="polite"
                                                            className="flex w-full items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2.5 text-xs text-red-200"
                                                        >
                                                            <Skull className="size-4 shrink-0 text-red-400" />
                                                            {lobbyError}
                                                        </div>
                                                    )}

                                                    {/* Flow info */}
                                                    <div className="flex w-full items-center justify-center gap-3 font-mono text-[10px] text-slate-400">
                                                        <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5">
                                                            1. Room
                                                        </span>
                                                        <span className="text-slate-400">
                                                            →
                                                        </span>
                                                        <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5">
                                                            2. Hero
                                                        </span>
                                                        <span className="text-slate-400">
                                                            →
                                                        </span>
                                                        <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5">
                                                            3. START
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                {phase === 'title' &&
                                    tab === 'online' &&
                                    online &&
                                    online.status !== 'playing' && (
                                        <motion.div
                                            key="title-room"
                                            className="absolute inset-0 overflow-y-auto bg-[#070b16]/95 p-4 sm:p-6"
                                            initial={{ opacity: 0, x: 60 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -60 }}
                                            transition={{
                                                duration: 0.28,
                                                ease: 'easeOut',
                                            }}
                                        >
                                            <div
                                                aria-hidden="true"
                                                className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(148,163,184,0.16)_1.5px,transparent_1.6px)] bg-[size:22px_22px]"
                                            />
                                            <div
                                                aria-hidden="true"
                                                className="pointer-events-none absolute -top-20 right-[10%] size-72 rounded-full bg-emerald-500/15 blur-3xl"
                                            />
                                            <div className="relative mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center">
                                                <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                                                    {/* Room header */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="size-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                                                        <span className="font-pixel text-[10px] tracking-wider text-slate-300">
                                                            ROOM AKTIF
                                                        </span>
                                                    </div>

                                                    {/* Tab switcher */}
                                                    <div className="flex gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] p-1">
                                                        {(
                                                            [
                                                                {
                                                                    id: 'solo',
                                                                    label: 'Solo',
                                                                },
                                                                {
                                                                    id: 'online',
                                                                    label: 'Online',
                                                                },
                                                            ] as const
                                                        ).map((t) => (
                                                            <button
                                                                key={t.id}
                                                                type="button"
                                                                role="tab"
                                                                aria-selected={
                                                                    tab === t.id
                                                                }
                                                                onClick={() =>
                                                                    setTab(t.id)
                                                                }
                                                                className={`rounded-md px-4 py-1.5 font-pixel text-[10px] transition-all duration-200 ${
                                                                    tab === t.id
                                                                        ? 'bg-cyan-400 text-[#06202a] shadow-[0_0_12px_rgba(34,211,238,0.35)]'
                                                                        : 'text-slate-400 hover:bg-white/5'
                                                                }`}
                                                            >
                                                                {t.label}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Room code display */}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void copyCode()
                                                        }
                                                        title="Salin kode"
                                                        className="group relative flex items-center gap-3 overflow-hidden rounded-xl border-2 border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 to-cyan-400/5 px-8 py-4 transition-all hover:border-cyan-300/50 hover:shadow-[0_0_24px_rgba(34,211,238,0.2)]"
                                                    >
                                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent" />
                                                        <span className="relative font-mono text-4xl font-black tracking-[0.4em] text-cyan-200">
                                                            {online.code}
                                                        </span>
                                                        <Copy className="relative size-5 text-cyan-400 transition-transform group-hover:scale-110" />
                                                    </button>
                                                    {copied && (
                                                        <motion.div
                                                            initial={{
                                                                opacity: 0,
                                                                y: -4,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                                y: 0,
                                                            }}
                                                            className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-300"
                                                        >
                                                            <Check className="size-3.5" />
                                                            Tersalin! Bagikan ke
                                                            temanmu.
                                                        </motion.div>
                                                    )}

                                                    {/* Roster */}
                                                    <div className="grid w-full gap-2">
                                                        <div className="mb-1 flex items-center justify-between">
                                                            <span className="font-pixel text-[8px] tracking-wider text-slate-400">
                                                                PEMAIN
                                                            </span>
                                                            <span className="font-mono text-[10px] text-slate-400">
                                                                {
                                                                    online
                                                                        .roster
                                                                        .length
                                                                }
                                                                /4
                                                            </span>
                                                        </div>
                                                        {online.roster.map(
                                                            (p) => {
                                                                const skinColor =
                                                                    SKINS[
                                                                        p.hero
                                                                    ]?.[
                                                                        p.skin ??
                                                                            0
                                                                    ]?.color ??
                                                                    HEROES[
                                                                        p.hero
                                                                    ]?.color ??
                                                                    '#666';
                                                                const isHost =
                                                                    p.id ===
                                                                    online.hostId;
                                                                const poster =
                                                                    POSTER_IMG[
                                                                        p.hero
                                                                    ];

                                                                return (
                                                                    <div
                                                                        key={
                                                                            p.id
                                                                        }
                                                                        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                                                                            isHost
                                                                                ? 'border-amber-400/30 bg-gradient-to-r from-amber-500/10 to-transparent'
                                                                                : 'border-white/10 bg-white/[0.04] hover:border-white/20'
                                                                        }`}
                                                                    >
                                                                        {/* Avatar */}
                                                                        <div
                                                                            className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_0_8px_rgba(0,0,0,0.3)]"
                                                                            style={{
                                                                                background:
                                                                                    skinColor,
                                                                            }}
                                                                        >
                                                                            {poster ? (
                                                                                <img
                                                                                    src={
                                                                                        poster
                                                                                    }
                                                                                    alt=""
                                                                                    className="size-full object-cover object-top"
                                                                                />
                                                                            ) : (
                                                                                (HEROES[
                                                                                    p
                                                                                        .hero
                                                                                ]
                                                                                    ?.name[0] ??
                                                                                '?')
                                                                            )}
                                                                        </div>
                                                                        <div className="flex flex-col items-start text-left">
                                                                            <span className="text-sm font-bold text-white">
                                                                                {
                                                                                    p.name
                                                                                }
                                                                            </span>
                                                                            <span className="font-mono text-[10px] text-slate-400">
                                                                                {
                                                                                    HEROES[
                                                                                        p
                                                                                            .hero
                                                                                    ]
                                                                                        ?.skill
                                                                                        .name
                                                                                }{' '}
                                                                                ·{' '}
                                                                                {SKINS[
                                                                                    p
                                                                                        .hero
                                                                                ]?.[
                                                                                    p.skin ??
                                                                                        0
                                                                                ]
                                                                                    ?.name ??
                                                                                    ''}
                                                                            </span>
                                                                        </div>
                                                                        {isHost && (
                                                                            <div className="ml-auto flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5">
                                                                                <Crown className="size-3.5 text-amber-300" />
                                                                                <span className="font-pixel text-[7px] text-amber-300">
                                                                                    HOST
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>

                                                    <HeroSkinPicker
                                                        taken={takenMap}
                                                        hero={heroPick}
                                                        skin={skinPick}
                                                        onHero={chooseHero}
                                                        onSkin={chooseSkin}
                                                    />

                                                    {lobbyError && (
                                                        <div
                                                            aria-live="polite"
                                                            className="flex w-full items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2.5 text-xs text-red-200"
                                                        >
                                                            <Skull className="size-4 shrink-0 text-red-400" />
                                                            {lobbyError}
                                                        </div>
                                                    )}

                                                    {/* Start / wait */}
                                                    {online.hostId ===
                                                    myPlayerId() ? (
                                                        <motion.button
                                                            type="button"
                                                            onClick={() => {
                                                                sound.click();
                                                                void handleStart();
                                                            }}
                                                            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-emerald-300 to-emerald-500 px-5 py-3.5 font-pixel text-[11px] text-[#06201a] shadow-[0_4px_0_#15803d] transition-all hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_#15803d] ${online.roster.length >= 2 ? '' : 'opacity-60'}`}
                                                            animate={
                                                                online.roster
                                                                    .length >= 2
                                                                    ? {
                                                                          boxShadow:
                                                                              [
                                                                                  '0 4px 0 #15803d, 0 0 20px rgba(74,222,128,0.3)',
                                                                                  '0 4px 0 #15803d, 0 0 40px rgba(74,222,128,0.6)',
                                                                                  '0 4px 0 #15803d, 0 0 20px rgba(74,222,128,0.3)',
                                                                              ],
                                                                      }
                                                                    : {}
                                                            }
                                                            transition={{
                                                                duration: 2,
                                                                repeat: Infinity,
                                                                ease: 'easeInOut',
                                                            }}
                                                        >
                                                            <Play className="size-4" />
                                                            START (
                                                            {
                                                                online.roster
                                                                    .length
                                                            }
                                                            /4)
                                                        </motion.button>
                                                    ) : (
                                                        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                                                            <motion.div
                                                                className="size-2 rounded-full bg-amber-300"
                                                                animate={{
                                                                    opacity: [
                                                                        1, 0.3,
                                                                        1,
                                                                    ],
                                                                }}
                                                                transition={{
                                                                    duration: 1.5,
                                                                    repeat: Infinity,
                                                                }}
                                                            />
                                                            Menunggu host
                                                            menekan START...
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            backToLobby()
                                                        }
                                                        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-400 transition-colors hover:text-red-300"
                                                    >
                                                        <ArrowLeft className="size-3" />
                                                        Keluar room
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                            </AnimatePresence>

                            {dialog && current && (
                                <motion.div
                                    key={`dialog-${dialog.chapter}-${current.speaker}-${current.text.length}`}
                                    role="dialog"
                                    aria-modal="true"
                                    aria-labelledby="dialog-speaker"
                                    onClick={advanceDialog}
                                    className="absolute inset-x-0 bottom-0 cursor-pointer p-3"
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.25,
                                        ease: 'easeOut',
                                    }}
                                >
                                    <div className="overflow-hidden rounded-xl border border-cyan-300/25 bg-gradient-to-r from-[#0b1226]/98 to-[#0f1a35]/98 shadow-[0_-8px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-lg">
                                        {/* Chapter accent bar */}
                                        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                                        <div className="p-4">
                                            <div className="mb-2 flex items-center gap-3">
                                                {/* Speaker avatar */}
                                                <div
                                                    className="flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-black text-[#0b1226] shadow-[0_0_12px_rgba(0,0,0,0.3)]"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${SPEAKER_COLORS[current.speaker] ?? '#94a3b8'}, ${SPEAKER_COLORS[current.speaker] ?? '#94a3b8'}88)`,
                                                        boxShadow: `0 0 16px ${SPEAKER_COLORS[current.speaker] ?? '#94a3b8'}44`,
                                                    }}
                                                >
                                                    {current.speaker[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-pixel text-[8px] tracking-wider text-amber-300/80">
                                                        {dialog.chapter}
                                                    </div>
                                                    <div
                                                        id="dialog-speaker"
                                                        className="text-sm font-bold"
                                                        style={{
                                                            color:
                                                                SPEAKER_COLORS[
                                                                    current
                                                                        .speaker
                                                                ] ?? '#e2e8f0',
                                                        }}
                                                    >
                                                        {current.speaker}
                                                    </div>
                                                </div>
                                                {/* Skip hint */}
                                                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-slate-400">
                                                    {isTouch
                                                        ? 'KETUK'
                                                        : 'SPACE'}
                                                </span>
                                            </div>
                                            <p
                                                aria-live="polite"
                                                className="min-h-10 text-sm leading-7 text-slate-100"
                                            >
                                                {typedText}
                                                <span className="ml-0.5 inline-block h-4 w-2 animate-pulse rounded-sm bg-cyan-300 align-middle shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
                                            </p>
                                            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
                                                <span className="font-mono text-[9px] text-slate-400">
                                                    {isTouch
                                                        ? 'Ketuk kotak dialog untuk lanjut'
                                                        : 'Klik atau tekan Space'}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            advanceDialog();
                                                        }}
                                                        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-gradient-to-b from-cyan-300 to-cyan-500 px-6 py-3 font-pixel text-[10px] text-[#06202a] shadow-[0_3px_0_#0e7490] transition-all hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_#0e7490]"
                                                    >
                                                        LANJUT
                                                        <Compass className="size-3" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            sound.click();
                                                            skipQuest();
                                                        }}
                                                        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-fuchsia-300/40 bg-fuchsia-500/15 px-4 py-3 font-pixel text-[9px] text-fuchsia-200 shadow-[0_3px_0_rgba(192,38,211,0.45)] transition-all hover:bg-fuchsia-500/30 active:translate-y-[2px] active:shadow-none"
                                                    >
                                                        <FastForward
                                                            className="text-fuchsia-300"
                                                            style={{
                                                                fontSize:
                                                                    '0.85cqw',
                                                            }}
                                                        />
                                                        SKIP
                                                        {hud?.skip && (
                                                            <span className="rounded-full bg-fuchsia-400/15 px-1.5 font-mono text-[#e9d5ff]">
                                                                {
                                                                    hud.skip
                                                                        ?.votes
                                                                }
                                                                /
                                                                {
                                                                    hud.skip
                                                                        ?.total
                                                                }
                                                            </span>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {waveBanner > 0 &&
                                phase === 'combat' &&
                                !dialog && (
                                    <div
                                        aria-live="polite"
                                        className="pointer-events-none absolute inset-x-0 top-10 flex justify-center"
                                    >
                                        <motion.div
                                            key={waveBanner}
                                            initial={{
                                                opacity: 0,
                                                scale: 0.6,
                                                y: 20,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                                y: 0,
                                            }}
                                            transition={{
                                                duration: 0.4,
                                                ease: 'backOut',
                                            }}
                                            className="relative overflow-hidden rounded-xl border-2 border-amber-400/40 bg-gradient-to-r from-amber-950/80 via-black/80 to-amber-950/80 px-8 py-3 shadow-[0_0_40px_rgba(251,191,36,0.2)] backdrop-blur-md"
                                        >
                                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent" />
                                            <div className="relative flex items-center gap-3">
                                                <Flame className="size-5 text-orange-400" />
                                                <span
                                                    className="font-pixel text-sm tracking-wider text-amber-300"
                                                    style={{
                                                        textShadow:
                                                            '0 0 12px rgba(251,191,36,0.5)',
                                                    }}
                                                >
                                                    {waveBanner >= 3
                                                        ? '⚔ FINAL — RAJA DEADLINE ⚔'
                                                        : `WAVE ${waveBanner} MULAI!`}
                                                </span>
                                                <Flame className="size-5 text-orange-400" />
                                            </div>
                                        </motion.div>
                                    </div>
                                )}

                            {phase === 'combat' && !dialog && !waveBanner && (
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 overflow-hidden rounded-lg border border-red-400/20 bg-gradient-to-r from-red-950/60 via-black/70 to-red-950/60 px-4 py-1.5 shadow-[0_0_16px_rgba(0,0,0,0.5)] backdrop-blur-sm">
                                    <span className="inline-flex items-center gap-2 font-mono text-[11px]">
                                        <Swords className="size-3.5 text-red-400" />
                                        <span className="text-slate-300">
                                            Sisa musuh:
                                        </span>
                                        <span className="font-pixel text-sm text-red-300">
                                            {hud?.enemiesLeft ?? 0}
                                        </span>
                                    </span>
                                </div>
                            )}

                            {phase === 'victory' && !dialog && (
                                <motion.div
                                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{
                                        duration: 0.5,
                                        ease: 'easeOut',
                                    }}
                                >
                                    {/* Background overlay */}
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-950/40 via-[#070b16]/90 to-[#070b16]/95" />
                                    {/* Victory particles */}
                                    {Array.from({ length: 16 }).map((_, i) => (
                                        <motion.span
                                            key={i}
                                            aria-hidden="true"
                                            className={`pointer-events-none absolute size-1.5 rounded-full ${i % 3 === 0 ? 'bg-amber-300' : i % 3 === 1 ? 'bg-yellow-400' : 'bg-orange-300'}`}
                                            style={{
                                                left: `${5 + ((i * 61) % 90)}%`,
                                                top: `${10 + ((i * 37) % 80)}%`,
                                            }}
                                            animate={{
                                                y: [0, -60, -120],
                                                opacity: [0, 1, 0],
                                                scale: [0.5, 1.2, 0.3],
                                            }}
                                            transition={{
                                                duration: 3 + (i % 3),
                                                repeat: Infinity,
                                                delay: (i % 6) * 0.5,
                                                ease: 'easeOut',
                                            }}
                                        />
                                    ))}
                                    {/* Content */}
                                    <motion.div
                                        className="relative"
                                        initial={{ scale: 0.5, rotate: -10 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{
                                            duration: 0.5,
                                            delay: 0.15,
                                            ease: 'backOut',
                                        }}
                                    >
                                        <Trophy className="size-16 text-amber-300 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]" />
                                    </motion.div>
                                    <div className="relative">
                                        <div
                                            className="font-pixel text-xl text-amber-300"
                                            style={{
                                                textShadow:
                                                    '0 0 20px rgba(251,191,36,0.5), 0 4px 0 rgba(2,6,23,1)',
                                            }}
                                        >
                                            KEMENANGAN!
                                        </div>
                                        <div className="mt-2 flex items-center justify-center gap-2 font-mono text-lg">
                                            <Sparkles className="size-4 text-amber-400" />
                                            <span className="text-amber-200">
                                                Skor:{' '}
                                                <span className="font-black text-white">
                                                    {hud?.score ?? 0}
                                                </span>
                                            </span>
                                            <Sparkles className="size-4 text-amber-400" />
                                        </div>
                                    </div>
                                    {netActive ? (
                                        <motion.button
                                            type="button"
                                            onClick={() => {
                                                sound.click();
                                                backToLobby();
                                            }}
                                            className="relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-cyan-300 to-cyan-500 px-8 py-3.5 font-pixel text-[11px] text-[#06202a] shadow-[0_4px_0_#0e7490,0_0_24px_rgba(34,211,238,0.3)] transition-all hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_#0e7490]"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <RotateCcw className="size-4" />{' '}
                                            KEMBALI KE LOBBY
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            type="button"
                                            onClick={() => {
                                                sound.click();
                                                startSolo();
                                            }}
                                            className="relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-cyan-300 to-cyan-500 px-8 py-3.5 font-pixel text-[11px] text-[#06202a] shadow-[0_4px_0_#0e7490,0_0_24px_rgba(34,211,238,0.3)] transition-all hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_#0e7490]"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <RotateCcw className="size-4" />{' '}
                                            MAIN LAGI
                                        </motion.button>
                                    )}
                                </motion.div>
                            )}

                            {phase === 'defeat' && (
                                <motion.div
                                    className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{
                                        duration: 0.5,
                                        ease: 'easeOut',
                                    }}
                                >
                                    {/* Background overlay */}
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-red-950/40 via-[#070b16]/90 to-[#070b16]/95" />
                                    {/* Blood particles */}
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <motion.span
                                            key={i}
                                            aria-hidden="true"
                                            className={`pointer-events-none absolute size-1 rounded-full ${i % 2 === 0 ? 'bg-red-500' : 'bg-red-700'}`}
                                            style={{
                                                left: `${10 + ((i * 73) % 80)}%`,
                                                top: `${20 + ((i * 41) % 60)}%`,
                                            }}
                                            animate={{
                                                y: [0, 40, 80],
                                                opacity: [0.8, 0.4, 0],
                                                scale: [1, 0.6, 0.2],
                                            }}
                                            transition={{
                                                duration: 4 + (i % 3),
                                                repeat: Infinity,
                                                delay: (i % 5) * 0.8,
                                                ease: 'easeIn',
                                            }}
                                        />
                                    ))}
                                    {/* Content */}
                                    <motion.div
                                        className="relative"
                                        initial={{ scale: 0.5, rotate: 10 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{
                                            duration: 0.5,
                                            delay: 0.15,
                                            ease: 'backOut',
                                        }}
                                    >
                                        <Skull className="size-16 text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.5)]" />
                                    </motion.div>
                                    <div className="relative">
                                        <div
                                            className="font-pixel text-xl text-red-300"
                                            style={{
                                                textShadow:
                                                    '0 0 20px rgba(248,113,113,0.5), 0 4px 0 rgba(2,6,23,1)',
                                            }}
                                        >
                                            PARTY TUMBANG...
                                        </div>
                                        <p className="mt-2 text-sm text-slate-300">
                                            Skor{' '}
                                            <span className="font-black text-white">
                                                {hud?.score ?? 0}
                                            </span>{' '}
                                            — coba lagi, atur dodge-nya!
                                        </p>
                                    </div>
                                    {netActive ? (
                                        <motion.button
                                            type="button"
                                            onClick={() => {
                                                sound.click();
                                                backToLobby();
                                            }}
                                            className="relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-cyan-300 to-cyan-500 px-8 py-3.5 font-pixel text-[11px] text-[#06202a] shadow-[0_4px_0_#0e7490,0_0_24px_rgba(34,211,238,0.3)] transition-all hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_#0e7490]"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <RotateCcw className="size-4" />{' '}
                                            KEMBALI KE LOBBY
                                        </motion.button>
                                    ) : (
                                        <motion.button
                                            type="button"
                                            onClick={() => {
                                                sound.click();
                                                startSolo();
                                            }}
                                            className="relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-cyan-300 to-cyan-500 px-8 py-3.5 font-pixel text-[11px] text-[#06202a] shadow-[0_4px_0_#0e7490,0_0_24px_rgba(34,211,238,0.3)] transition-all hover:brightness-110 active:translate-y-[2px] active:shadow-[0_2px_0_#0e7490]"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <RotateCcw className="size-4" />{' '}
                                            COBA LAGI
                                        </motion.button>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </div>
                    {/* Petunjuk kontekstual sekali per pemain */}
                    <AnimatePresence>
                        {tip && phase !== 'title' && !paused && (
                            <motion.div
                                key="game-tip"
                                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.99 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                className="fixed top-[4.6rem] left-1/2 z-40 flex w-[min(92vw,30rem)] -translate-x-1/2 items-start gap-2 rounded-lg border border-cyan-400/35 bg-slate-950/92 px-3 py-2 text-cyan-100 shadow-[0_10px_30px_rgba(0,0,0,0.55)] backdrop-blur-md"
                            >
                                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-cyan-300" />
                                <p className="flex-1 font-mono text-[11px] leading-4">
                                    {tip}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setTip(null)}
                                    aria-label="Tutup petunjuk"
                                    className="mt-0.5 shrink-0 rounded p-0.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                                >
                                    <X className="size-3.5" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Menu jeda: satu tempat untuk lanjut, ulang, audio, dan kontrol */}
                    <AnimatePresence>
                        {paused && phase !== 'title' && (
                            <motion.div
                                key="pause-overlay"
                                role="dialog"
                                aria-modal="true"
                                aria-label="Jeda permainan"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.16 }}
                                onClick={() => setPaused(false)}
                                className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 p-4 backdrop-blur-sm"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        scale: 1,
                                    }}
                                    exit={{ opacity: 0, y: 8, scale: 0.99 }}
                                    transition={{
                                        type: 'spring',
                                        visualDuration: 0.34,
                                        bounce: 0.16,
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="relative flex max-h-[94dvh] w-full max-w-md flex-col gap-2.5 overflow-y-auto overscroll-contain rounded-2xl border border-cyan-400/25 bg-slate-950/95 p-3 shadow-[0_24px_70px_rgba(0,0,0,0.7)] sm:gap-4 sm:p-5 [@media(max-height:560px)]:grid [@media(max-height:560px)]:max-w-3xl [@media(max-height:560px)]:grid-cols-2 [@media(max-height:560px)]:items-start [@media(max-height:560px)]:gap-4"
                                >
                                    <div className="flex flex-col gap-2.5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-pixel text-sm tracking-[0.18em] text-cyan-200">
                                                    JEDA
                                                </div>
                                                <div className="mt-1 font-mono text-[10px] text-slate-400">
                                                    {hud?.mapLabel ??
                                                        'F3N Story'}{' '}
                                                    &middot;{' '}
                                                    {netActive
                                                        ? 'Online'
                                                        : 'Solo'}{' '}
                                                    &middot;{' '}
                                                    {isTouch
                                                        ? 'ketuk Lanjut'
                                                        : 'Esc untuk lanjut'}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setPaused(false)}
                                                aria-label="Lanjut bermain"
                                                className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                                            >
                                                <X className="size-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                autoFocus
                                                onClick={() => {
                                                    sound.click();
                                                    setPaused(false);
                                                }}
                                                className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-cyan-300 to-cyan-500 px-4 py-2.5 font-pixel text-[10px] tracking-wider text-[#06202a] shadow-[0_3px_0_#0e7490] transition-all hover:brightness-110 active:translate-y-[1px] active:shadow-[0_2px_0_#0e7490]"
                                            >
                                                <Play className="size-4" />{' '}
                                                LANJUT
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    sound.click();
                                                    setPaused(false);

                                                    if (netActive) {
                                                        backToLobby();
                                                    } else {
                                                        startSolo();
                                                    }
                                                }}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 font-pixel text-[9px] tracking-wider text-slate-200 transition-colors hover:bg-white/10"
                                            >
                                                <RotateCcw className="size-3.5" />{' '}
                                                {netActive
                                                    ? 'KE LOBBY'
                                                    : 'ULANG'}
                                            </button>
                                            <Link
                                                href="/"
                                                onClick={() => sound.click()}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 font-pixel text-[9px] tracking-wider text-slate-200 transition-colors hover:bg-white/10"
                                            >
                                                <Home className="size-3.5" />{' '}
                                                KELUAR
                                            </Link>
                                        </div>
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setControlsOpen((v) => !v)
                                                }
                                                aria-expanded={controlsOpen}
                                                className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 transition-colors hover:bg-white/[0.06]"
                                            >
                                                <span className="font-pixel text-[9px] tracking-wider text-slate-400">
                                                    KONTROL
                                                </span>
                                                {controlsOpen ? (
                                                    <ChevronUp className="size-3.5 text-slate-400" />
                                                ) : (
                                                    <ChevronDown className="size-3.5 text-slate-400" />
                                                )}
                                            </button>
                                            {controlsOpen && (
                                                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                                                    {CONTROLS.map((c) => (
                                                        <div
                                                            key={c.key}
                                                            className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1"
                                                        >
                                                            <span className="font-mono text-[10px] text-slate-400">
                                                                {c.key}
                                                            </span>
                                                            <span className="font-pixel text-[8px] text-cyan-100">
                                                                {c.p1}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2.5">
                                        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                            <div className="mb-2.5 font-pixel text-[9px] tracking-wider text-slate-400">
                                                PENGATURAN
                                            </div>
                                            <label className="flex items-center gap-3">
                                                <Music className="size-4 shrink-0 text-cyan-300" />
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={100}
                                                    value={musicVol}
                                                    onChange={(e) => {
                                                        const v = Number(
                                                            e.target.value,
                                                        );
                                                        setMusicVol(v);
                                                        sound.setMusicVolume(
                                                            v / 100,
                                                        );
                                                    }}
                                                    aria-label="Volume musik"
                                                    className="h-1.5 flex-1 accent-cyan-400"
                                                />
                                                <span className="w-9 text-right font-mono text-[10px] text-slate-400">
                                                    {musicVol}%
                                                </span>
                                            </label>
                                            <label className="mt-3 flex items-center gap-3">
                                                <Volume2 className="size-4 shrink-0 text-cyan-300" />
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={100}
                                                    value={sfxVol}
                                                    onChange={(e) => {
                                                        const v = Number(
                                                            e.target.value,
                                                        );
                                                        setSfxVol(v);
                                                        sound.setSfxVolume(
                                                            v / 100,
                                                        );
                                                    }}
                                                    onPointerUp={() =>
                                                        sound.click()
                                                    }
                                                    aria-label="Volume efek suara"
                                                    className="h-1.5 flex-1 accent-cyan-400"
                                                />
                                                <span className="w-9 text-right font-mono text-[10px] text-slate-400">
                                                    {sfxVol}%
                                                </span>
                                            </label>
                                            <div className="mt-3 flex items-center justify-between gap-3">
                                                <span className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                                                    <Wind className="size-4 text-cyan-300" />
                                                    Getar kamera
                                                </span>
                                                <button
                                                    type="button"
                                                    role="switch"
                                                    aria-checked={shakeOn}
                                                    aria-label="Getar kamera"
                                                    onClick={() =>
                                                        setShakeOn((v) => !v)
                                                    }
                                                    className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${shakeOn ? 'border-cyan-300/60 bg-cyan-400/30' : 'border-white/15 bg-white/5'}`}
                                                >
                                                    <span
                                                        className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${shakeOn ? 'left-[1.4rem]' : 'left-0.5'}`}
                                                    />
                                                </button>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between gap-3">
                                                <span className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                                                    {isFullscreen ? (
                                                        <Minimize2 className="size-4 text-cyan-300" />
                                                    ) : (
                                                        <Maximize2 className="size-4 text-cyan-300" />
                                                    )}
                                                    Layar penuh
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={toggleFullscreen}
                                                    className="rounded-md border border-white/15 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] text-slate-200 transition-colors hover:bg-white/10"
                                                >
                                                    {isFullscreen
                                                        ? 'KELUAR'
                                                        : 'AKTIFKAN'}
                                                </button>
                                            </div>
                                        </div>

                                        <p className="hidden text-center font-mono text-[10px] text-slate-500 sm:block">
                                            Progres sesi ini tidak disimpan —
                                            keluar berarti mulai dari awal.
                                        </p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Game wajib landscape di perangkat sentuh */}
                    {isTouch && isPortrait && (
                        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[#070b16] px-8 text-center">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,0.18),transparent_55%)]" />
                            <div className="relative flex size-24 items-center justify-center rounded-3xl border border-cyan-400/30 bg-slate-950/80 shadow-[0_0_40px_rgba(34,211,238,0.25)]">
                                <RotateCw className="size-12 animate-pulse text-cyan-300" />
                            </div>
                            <div className="relative flex flex-col gap-2">
                                <h1 className="font-pixel text-base tracking-wider text-cyan-200">
                                    PUTAR KE LANDSCAPE
                                </h1>
                                <p className="max-w-xs font-mono text-xs leading-5 text-slate-400">
                                    F3N Story hanya bisa dimainkan dalam posisi
                                    horizontal. Putar HP kamu untuk melanjutkan.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => void requestLandscape()}
                                className="relative inline-flex items-center gap-2 rounded-xl border border-cyan-300/50 bg-cyan-400/15 px-5 py-3 font-pixel text-[10px] tracking-wider text-cyan-100 transition-all active:scale-95"
                            >
                                <RotateCw className="size-4" />
                                BUKA LAYAR PENUH
                            </button>
                            <span className="relative max-w-xs font-mono text-[10px] leading-4 text-slate-500">
                                Jika layar tidak berputar, matikan kunci rotasi
                                di pengaturan HP.
                            </span>
                        </div>
                    )}
                </main>
            </MotionConfig>
        </>
    );
}
