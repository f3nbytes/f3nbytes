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

async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(path, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        ...init,
    });
    const body = (await res.json()) as T & { message?: string };

    if (!res.ok) {
        throw new Error(body.message ?? `HTTP ${res.status}`);
    }

    return body;
}

export function myPlayerId(): string {
    let id: string | null = null;

    try {
        id = localStorage.getItem('f3n-player-id');

        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem('f3n-player-id', id);
        }
    } catch {
        id = `guest-${Math.floor(Math.random() * 1e9)}`;
    }

    return id;
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
): Promise<{ playerId: string; hostId: string }> {
    return api(`/api/game/rooms/${code}/join`, {
        method: 'POST',
        body: JSON.stringify({ name, playerId }),
    });
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
): Promise<void> {
    return api(`/api/game/rooms/${code}/state`, {
        method: 'POST',
        body: JSON.stringify({ playerId, snap }),
    })
        .then(() => undefined)
        .catch(() => undefined);
}

export function pullState(
    code: string,
    playerId: string,
): Promise<{ snapshot: Snapshot | null }> {
    return api(
        `/api/game/rooms/${code}/state?playerId=${encodeURIComponent(playerId)}`,
    );
}

export function pushInput(
    code: string,
    playerId: string,
    input: RemoteInput,
): Promise<void> {
    return api(`/api/game/rooms/${code}/input`, {
        method: 'POST',
        body: JSON.stringify({ playerId, input }),
    })
        .then(() => undefined)
        .catch(() => undefined);
}

export interface BufferedInput {
    id: string;
    input: RemoteInput;
    at: number;
}

export function pullInputs(
    code: string,
    playerId: string,
): Promise<{ inputs: BufferedInput[] }> {
    return api<{ inputs: BufferedInput[] }>(`/api/game/rooms/${code}/inputs`, {
        method: 'POST',
        body: JSON.stringify({ playerId }),
    }).catch(() => ({ inputs: [] }));
}

export type { RemoteInput, Snapshot };
