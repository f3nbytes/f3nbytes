<?php

namespace App\Http\Controllers;

use App\Events\GameSnapshot;
use App\Events\GameStarted;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class GameRoomController extends Controller
{
    private const TTL = 7200;

    private const STALE_AFTER = 15;

    /** @return array{code: string, hostId: string, status: string, players: array<int, array{id: string, name: string, hero: int, skin: int, lastBeat: int}>} */
    private function blankRoom(string $code, string $hostId): array
    {
        return [
            'code' => $code,
            'hostId' => $hostId,
            'status' => 'lobby',
            'players' => [],
        ];
    }

    private function key(string $code): string
    {
        return 'f3n-room:'.strtoupper($code);
    }

    /** @return array<string, mixed>|null */
    private function freshRoom(string $code): ?array
    {
        $room = Cache::get($this->key($code));

        if (! is_array($room)) {
            return null;
        }

        $now = time();
        $room['players'] = array_values(array_filter(
            $room['players'],
            fn (array $p): bool => ($now - (int) ($p['lastBeat'] ?? 0)) < self::STALE_AFTER,
        ));

        if ($room['players'] === []) {
            Cache::forget($this->key($code));

            return null;
        }

        $ids = array_column($room['players'], 'id');

        if (! in_array($room['hostId'], $ids, true)) {
            $room['hostId'] = $room['players'][0]['id'];
        }

        Cache::put($this->key($code), $room, self::TTL);

        return $room;
    }

    private function code(): string
    {
        $alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

        do {
            $code = implode('', array_map(
                fn (): string => $alphabet[random_int(0, strlen($alphabet) - 1)],
                range(1, 4),
            ));
        } while (Cache::has($this->key($code)));

        return $code;
    }

    private function firstFreeHero(array $players): ?int
    {
        $taken = array_column($players, 'hero');

        for ($hero = 0; $hero < 4; $hero++) {
            if (! in_array($hero, $taken, true)) {
                return $hero;
            }
        }

        return null;
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:16',
        ]);

        $playerId = (string) Str::uuid();
        $code = $this->code();
        $room = $this->blankRoom($code, $playerId);
        $room['players'][] = [
            'id' => $playerId,
            'name' => $data['name'],
            'hero' => 0,
            'skin' => 0,
            'lastBeat' => time(),
        ];
        Cache::put($this->key($code), $room, self::TTL);

        return response()->json([
            'code' => $code,
            'playerId' => $playerId,
            'hostId' => $playerId,
        ]);
    }

    public function join(Request $request, string $code): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:16',
            'playerId' => 'sometimes|string',
        ]);

        return Cache::lock('f3n-join:'.$code, 10)->block(5, function () use ($data, $code) {
            $room = $this->freshRoom($code);

            if ($room === null) {
                return response()->json(['message' => 'Room tidak ditemukan.'], 404);
            }

            if ($room['status'] !== 'lobby') {
                return response()->json(['message' => 'Game sudah mulai.'], 409);
            }

            if (count($room['players']) >= 4) {
                return response()->json(['message' => 'Room penuh (maks 4).'], 409);
            }

            $hero = $this->firstFreeHero($room['players']);

            if ($hero === null) {
                return response()->json(['message' => 'Room penuh (maks 4).'], 409);
            }

            $playerId = $data['playerId'] ?? (string) Str::uuid();
            $room['players'][] = [
                'id' => $playerId,
                'name' => $data['name'],
                'hero' => $hero,
                'skin' => 0,
                'lastBeat' => time(),
            ];
            Cache::put($this->key($code), $room, self::TTL);

            return response()->json([
                'playerId' => $playerId,
                'hostId' => $room['hostId'],
            ]);
        });
    }

    /** Ganti hero/skin selama masih di lobby. */
    public function pick(Request $request, string $code): JsonResponse
    {
        $data = $request->validate([
            'playerId' => 'required|string',
            'hero' => 'required|integer|min:0|max:3',
            'skin' => 'sometimes|integer|min:0|max:2',
        ]);

        return Cache::lock('f3n-join:'.$code, 10)->block(5, function () use ($data, $code) {
            $room = $this->freshRoom($code);

            if ($room === null) {
                return response()->json(['message' => 'Room tidak ditemukan.'], 404);
            }

            if ($room['status'] !== 'lobby') {
                return response()->json(['message' => 'Game sudah mulai.'], 409);
            }

            foreach ($room['players'] as $player) {
                if ($player['id'] !== $data['playerId'] && (int) $player['hero'] === (int) $data['hero']) {
                    return response()->json(['message' => 'Hero sudah dipakai.'], 409);
                }
            }

            foreach ($room['players'] as &$player) {
                if ($player['id'] === $data['playerId']) {
                    $player['hero'] = (int) $data['hero'];
                    $player['skin'] = (int) ($data['skin'] ?? $player['skin'] ?? 0);
                    $player['lastBeat'] = time();
                }
            }

            unset($player);
            Cache::put($this->key($code), $room, self::TTL);

            return response()->json(['ok' => true]);
        });
    }

    public function show(string $code): JsonResponse
    {
        $room = $this->freshRoom($code);

        if ($room === null) {
            return response()->json(['message' => 'Room tidak ditemukan.'], 404);
        }

        return response()->json([
            'status' => $room['status'],
            'hostId' => $room['hostId'],
            'players' => array_map(fn (array $p): array => [
                'id' => $p['id'],
                'name' => $p['name'],
                'hero' => $p['hero'],
                'skin' => $p['skin'] ?? 0,
            ], $room['players']),
        ]);
    }

    public function heartbeat(Request $request, string $code): JsonResponse
    {
        $data = $request->validate(['playerId' => 'required|string']);

        $room = Cache::get($this->key($code));

        if (! is_array($room)) {
            return response()->json(['message' => 'Room tidak ditemukan.'], 404);
        }

        foreach ($room['players'] as &$player) {
            if ($player['id'] === $data['playerId']) {
                $player['lastBeat'] = time();
            }
        }

        unset($player);
        Cache::put($this->key($code), $room, self::TTL);

        return response()->json(['ok' => true]);
    }

    public function leave(Request $request, string $code): JsonResponse
    {
        $data = $request->validate(['playerId' => 'required|string']);

        $room = Cache::get($this->key($code));

        if (is_array($room)) {
            $room['players'] = array_values(array_filter(
                $room['players'],
                fn (array $p): bool => $p['id'] !== $data['playerId'],
            ));

            if ($room['players'] === []) {
                Cache::forget($this->key($code));
            } else {
                Cache::put($this->key($code), $room, self::TTL);
            }
        }

        return response()->json(['ok' => true]);
    }

    public function start(Request $request, string $code): JsonResponse
    {
        $data = $request->validate(['playerId' => 'required|string']);

        $room = $this->freshRoom($code);

        if ($room === null) {
            return response()->json(['message' => 'Room tidak ditemukan.'], 404);
        }

        if ($room['hostId'] !== $data['playerId']) {
            return response()->json(['message' => 'Hanya host yang bisa mulai.'], 403);
        }

        $room['status'] = 'playing';
        Cache::put($this->key($code), $room, self::TTL);

        broadcast(new GameStarted($code, array_map(fn (array $p): array => [
            'id' => $p['id'],
            'name' => $p['name'],
            'hero' => $p['hero'],
            'skin' => $p['skin'] ?? 0,
        ], $room['players'])));

        return response()->json(['ok' => true]);
    }

    /** Host mendorong snapshot → disiarkan ke channel publik. */
    public function pushState(Request $request, string $code): JsonResponse
    {
        $data = $request->validate([
            'playerId' => 'required|string',
            'snap' => 'required|array',
        ]);

        $room = Cache::get($this->key($code));

        if (! is_array($room) || $room['hostId'] !== $data['playerId']) {
            return response()->json(['message' => 'Bukan host.'], 403);
        }

        // Simpan snapshot terakhir: cadangan bila WebSocket klien diblokir.
        Cache::put($this->key($code).':snap', $data['snap'], 30);
        broadcast(new GameSnapshot($code, $data['snap']));

        return response()->json(['ok' => true]);
    }

    /** Client menarik snapshot terakhir via HTTP (fallback tanpa WS). */
    public function pullState(Request $request, string $code): JsonResponse
    {
        $data = $request->validate(['playerId' => 'required|string']);
        $room = Cache::get($this->key($code));

        if (! is_array($room)) {
            return response()->json(['message' => 'Room tidak ditemukan.'], 404);
        }

        $known = false;

        foreach ($room['players'] as $pl) {
            if ($pl['id'] === $data['playerId']) {
                $known = true;

                break;
            }
        }

        if (! $known) {
            return response()->json(['message' => 'Bukan anggota room.'], 403);
        }

        return response()->json([
            'snapshot' => Cache::get($this->key($code).':snap'),
        ]);
    }

    /** Client mendorong input → di-buffer untuk dibaca host. */
    public function pushInput(Request $request, string $code): JsonResponse
    {
        $data = $request->validate([
            'playerId' => 'required|string',
            'input' => 'required|array',
        ]);

        // Simpan state terakhir (bukan antrean). Dengan begitu input tidak
        // pernah hilang walau host membaca di saat yang sama.
        Cache::put(
            $this->key($code).':in:'.$data['playerId'],
            $data['input'],
            60,
        );

        return response()->json(['ok' => true]);
    }

    /** Host membaca state input terakhir semua klien. */
    public function pullInputs(Request $request, string $code): JsonResponse
    {
        $data = $request->validate(['playerId' => 'required|string']);

        $room = Cache::get($this->key($code));

        if (! is_array($room) || $room['hostId'] !== $data['playerId']) {
            return response()->json(['message' => 'Bukan host.'], 403);
        }

        $inputs = [];

        foreach ($room['players'] as $pl) {
            if ($pl['id'] === $data['playerId']) {
                continue;
            }

            $in = Cache::get($this->key($code).':in:'.$pl['id']);

            if (is_array($in)) {
                $inputs[] = ['id' => $pl['id'], 'input' => $in];
            }
        }

        return response()->json(['inputs' => $inputs]);
    }
}
