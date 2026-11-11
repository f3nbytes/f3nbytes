import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import type { RemoteInput, Snapshot } from './pixel-story';

let echo: Echo<'reverb'> | null = null;

export function getEcho(): Echo<'reverb'> {
    if (!echo) {
        (window as unknown as { Pusher: unknown }).Pusher = Pusher;
        echo = new Echo({
            broadcaster: 'reverb',
            key: import.meta.env.VITE_REVERB_APP_KEY as string,
            wsHost:
                (import.meta.env.VITE_REVERB_HOST as string | undefined) ??
                '127.0.0.1',
            wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8090),
            wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8090),
            forceTLS:
                (import.meta.env.VITE_REVERB_SCHEME as string | undefined) ===
                'https',
            enabledTransports: ['ws', 'wss'],
            // Ganti jaringan (Wi-Fi ↔ seluler) bisa meninggalkan socket
            // "setengah mati". Deteksi lebih cepat dari bawaan 120 dtk
            // supaya tidak menumpuk koneksi & snapshot ganda.
            activityTimeout: 25000,
            pongTimeout: 10000,
        });
    }

    return echo;
}

export interface RoomPlayer {
    id: string;
    name: string;
    hero: number;
    skin: number;
}

export interface RoomState {
    status: string;
    hostId: string;
    players: RoomPlayer[];
}

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
    // fetch tanpa batas waktu bisa menggantung menit-an di jaringan HP yang
    // buruk (atau saat server kehabisan worker). Dulu itu membuat pengirim
    // input/snapshot "macet" permanen: request pertama tidak pernah selesai,
    // jadi tidak ada kiriman berikutnya. Batasi supaya selalu pulih.
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 6000);

    try {
        const res = await fetch(path, {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            signal: ctrl.signal,
            ...init,
        });
        const body = (await res.json()) as T & { message?: string };

        if (!res.ok) {
            throw new ApiError(
                body.message ?? `HTTP ${res.status}`,
                res.status,
            );
        }

        return body;
    } finally {
        window.clearTimeout(timer);
    }
}

const PLAYER_ID_KEY = 'f3n-player-id';

/** Identitas cadangan bila sessionStorage diblokir (stabil per halaman). */
let fallbackPlayerId: string | null = null;

/**
 * Identitas pemain disimpan per-tab (sessionStorage), bukan per-browser.
 * Dengan localStorage, dua tab di browser yang sama memakai id yang sama:
 * tab kedua dianggap host, game-nya berjalan solo dan hero jalan sendiri.
 */
export function myPlayerId(): string {
    try {
        let id = sessionStorage.getItem(PLAYER_ID_KEY);

        if (!id) {
            id = crypto.randomUUID();
            sessionStorage.setItem(PLAYER_ID_KEY, id);
        }

        return id;
    } catch {
        fallbackPlayerId ??= `guest-${Math.floor(Math.random() * 1e9)}`;

        return fallbackPlayerId;
    }
}

/** Simpan id yang diberikan server (host dari createRoom) untuk tab ini. */
export function setMyPlayerId(id: string): void {
    try {
        sessionStorage.setItem(PLAYER_ID_KEY, id);
    } catch {
        fallbackPlayerId = id;
    }
}

export function createRoom(
    name: string,
): Promise<{ code: string; playerId: string; hostId: string }> {
    return api('/api/game/rooms', {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
}

export function joinRoom(
    code: string,
    name: string,
    playerId: string,
): Promise<{ playerId: string; hostId: string; hero?: number }> {
    return api(`/api/game/rooms/${code}/join`, {
        method: 'POST',
        body: JSON.stringify({ name, playerId }),
    });
}

const ROOM_KEY = 'f3n-room';

/** Ingat room supaya refresh / tab yang dibunuh browser bisa lanjut sendiri. */
export function rememberRoom(code: string, name: string): void {
    try {
        sessionStorage.setItem(
            ROOM_KEY,
            JSON.stringify({ code, name, at: Date.now() }),
        );
    } catch {
        // sessionStorage diblokir: reconnect otomatis tidak tersedia.
    }
}

export function forgetRoom(): void {
    try {
        sessionStorage.removeItem(ROOM_KEY);
    } catch {
        // abaikan
    }
}

/** Room yang terakhir dimasuki di tab ini (kedaluwarsa 30 menit). */
export function rememberedRoom(): { code: string; name: string } | null {
    try {
        const raw = sessionStorage.getItem(ROOM_KEY);

        if (!raw) {
            return null;
        }

        const v = JSON.parse(raw) as {
            code?: unknown;
            name?: unknown;
            at?: unknown;
        };

        if (
            typeof v.code !== 'string' ||
            typeof v.name !== 'string' ||
            typeof v.at !== 'number' ||
            Date.now() - v.at > 30 * 60 * 1000
        ) {
            forgetRoom();

            return null;
        }

        return { code: v.code, name: v.name };
    } catch {
        return null;
    }
}

export function roomState(code: string): Promise<RoomState> {
    return api(`/api/game/rooms/${code}`);
}

export function heartbeat(code: string, playerId: string): Promise<void> {
    return api(`/api/game/rooms/${code}/heartbeat`, {
        method: 'POST',
        body: JSON.stringify({ playerId }),
    }).then(() => undefined);
}

export function leaveRoom(code: string, playerId: string): Promise<void> {
    return api(`/api/game/rooms/${code}/leave`, {
        method: 'POST',
        body: JSON.stringify({ playerId }),
    })
        .then(() => undefined)
        .catch(() => undefined);
}

export function pickHero(
    code: string,
    playerId: string,
    hero: number,
    skin: number,
): Promise<void> {
    return api(`/api/game/rooms/${code}/pick`, {
        method: 'POST',
        body: JSON.stringify({ playerId, hero, skin }),
    }).then(() => undefined);
}

export function startRoom(code: string, playerId: string): Promise<void> {
    return api(`/api/game/rooms/${code}/start`, {
        method: 'POST',
        body: JSON.stringify({ playerId }),
    }).then(() => undefined);
}

export function pushState(
    code: string,
    playerId: string,
    snap: Snapshot,
): Promise<BufferedInput[]> {
    return api<{ ok: boolean; inputs: BufferedInput[] }>(
        `/api/game/rooms/${code}/state`,
        {
            method: 'POST',
            body: JSON.stringify({ playerId, snap }),
        },
    ).then((res) => res.inputs ?? []);
}

export function pullState(
    code: string,
    playerId: string,
): Promise<{ snapshot: Snapshot | null }> {
    return api(
        `/api/game/rooms/${code}/state?playerId=${encodeURIComponent(playerId)}`,
    );
}

/**
 * Cadangan: host menarik input klien terpisah bila push snapshot gagal
 * (mis. endpoint /state diblokir jaringan / proxy).
 */
export function pullInputs(
    code: string,
    playerId: string,
): Promise<{ inputs: BufferedInput[] }> {
    return api<{ inputs: BufferedInput[] }>(`/api/game/rooms/${code}/inputs`, {
        method: 'POST',
        body: JSON.stringify({ playerId }),
    });
}

export function pushInput(
    code: string,
    playerId: string,
    input: RemoteInput,
    opts?: { keepalive?: boolean },
): Promise<void> {
    return api(`/api/game/rooms/${code}/input`, {
        method: 'POST',
        body: JSON.stringify({ playerId, input }),
        // keepalive: tetap terkirim saat tab ditutup / app dipindah.
        keepalive: opts?.keepalive === true,
    })
        .then(() => undefined)
        .catch(() => undefined);
}

export interface BufferedInput {
    id: string;
    input: RemoteInput;
    at: number;
    /** Hero milik pemain ini menurut server (otoritatif). */
    hero?: number;
    /** Usia input (ms) menurut server. */
    age?: number;
}

export type { RemoteInput, Snapshot };
