<?php

namespace App\Http\Controllers;

use App\Events\GameSnapshot;
use App\Events\GameStarted;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Throwable;

class GameRoomController extends Controller
{
    private const TTL = 7200;

    /**
     * Saat lobby, pemain yang heartbeat-nya basi dibuang. Beri kelonggaran
     * 1 menit: host sering pindah aplikasi sebentar untuk membagikan kode,
     * dan Chrome menjeda timer tab latar sampai 1 menit.
     */
    private const LOBBY_STALE_AFTER = 60;

    /** Room baru dihapus bila host sendiri tidak memberi kabar selama 5 menit. */
    private const HOST_GONE_AFTER = 300;

    /**
     * Host harus lebih cepat diganti: selama host hilang, semua klien membeku.
     * Tiga denyut terlewat (7,5 dtk) sudah cukup yakin.
     */
    private const HOST_STALE_AFTER = 9;

    /** Penanda generasi host (ms). Klien membuang snapshot dari host lama. */
    private static function epoch(): int
    {
        return (int) round(microtime(true) * 1000);
    }

    /** @return array{code: string, hostId: string, status: string, players: array<int, array{id: string, name: string, hero: int, skin: int, lastBeat: int}>} */
    private function blankRoom(string $code, string $hostId): array
    {
        return [
            'code' => $code,
            'hostId' => $hostId,
            'hostEp' => self::epoch(),
            'status' => 'lobby',
            'players' => [],
        ];
    }

    private function key(string $code): string
    {
        return 'f3n-room:'.strtoupper($code);
    }

    /**
     * Housekeeping room di salinan memori: buang pemain basi saat lobby,
     * pulihkan/promosikan host. Null berarti room kosong.
     *
     * @param  array<string, mixed>  $room
     * @return array<string, mixed>|null
     */
    private function freshen(array $room, int $now): ?array
    {
        $hostId = $room['hostId'];
        $lobby = $room['status'] === 'lobby';

        // Saat lobby, pemain yang heartbeat-nya basi boleh dibuang. Saat
        // permainan berjalan jangan: HP yang sempat sleep / pindah app
        // >1 menit akan hilang dari room dan tidak bisa gabung lagi, padahal
        // hero-nya masih ada di layar host. Hero itu cukup diam ('away').
        $room['players'] = array_values(array_filter(
            $room['players'],
            function (array $p) use ($now, $hostId, $lobby): bool {
                $beat = (int) ($p['lastBeat'] ?? 0);

                if ($p['id'] === $hostId) {
                    return ($now - $beat) < self::HOST_GONE_AFTER;
                }

                return ! $lobby || ($now - $beat) < self::LOBBY_STALE_AFTER;
            },
        ));

        if ($room['players'] === []) {
            return null;
        }

        $ids = array_column($room['players'], 'id');

        if (! in_array($room['hostId'], $ids, true)) {
            $room['hostId'] = $room['players'][0]['id'];
            $room['hostEp'] = self::epoch();
        } elseif ($room['status'] === 'playing') {
            // Host hilang / tab-nya sleep: promosikan pemain lain yang masih
            // mengirim heartbeat. Tanpa ini permainan membeku karena semua
            // klien menunggu snapshot dari host yang sudah tidak ada.
            // Di lobby jangan: host yang sedang membagikan kode bisa kehilangan
            // posisinya ke pemain yang kebetulan masih membuka layar.
            $hostBeat = null;

            foreach ($room['players'] as $p) {
                if ($p['id'] === $room['hostId']) {
                    $hostBeat = (int) ($p['lastBeat'] ?? 0);
                }
            }

            if ($hostBeat !== null && ($now - $hostBeat) >= self::HOST_STALE_AFTER) {
                foreach ($room['players'] as $p) {
                    if (
                        $p['id'] !== $room['hostId'] &&
                        ($now - (int) ($p['lastBeat'] ?? 0)) < self::HOST_STALE_AFTER
                    ) {
                        $room['hostId'] = $p['id'];
                        $room['hostEp'] = self::epoch();

                        break;
                    }
                }
            }
        }

        // Room lama (dibuat sebelum ada epoch) tetap bisa dipakai.
        $room['hostEp'] ??= self::epoch();

        return $room;
    }

    /**
     * Satu-satunya jalur baca-ubah-tulis room, di bawah lock per room.
     *
     * Tanpa lock, tulisan saling menimpa ("lost update"): heartbeat yang
     * membaca room sebelum join bisa menulis balik daftar pemain lama dan
     * menghapus pemain yang baru masuk. Akibatnya host tidak lagi punya
     * pemetaan input untuk pemain itu (hero-nya diam di tempat) sampai
     * permainan selesai.
     *
     * @param  callable(array<string, mixed>&): mixed  $mutate
     * @return array{room: array<string, mixed>|null, result: mixed}
     */
    private function withRoom(string $code, callable $mutate): array
    {
        $lock = Cache::lock($this->key($code).':lock', 10);

        // Non-blocking acquire dengan pendek pendek: block(5) bisa menunggu
        // lock di MySQL terlalu lama saat banyak request bersamaan, dan
        // menumpuk semua worker PHP. Coba non-blocking beberapa kali dengan
        // jeda pendek; kalau gagal, sembunyikan room (panggilnya akan coba
        // lagi di poll berikutnya).
        for ($attempt = 0; $attempt < 20; $attempt++) {
            if (! $lock->get()) {
                usleep(50000);

                continue;
            }

            try {
                $room = Cache::get($this->key($code));

                if (! is_array($room)) {
                    return ['room' => null, 'result' => null];
                }

                $room = $this->freshen($room, time());

                if ($room === null) {
                    Cache::forget($this->key($code));

                    return ['room' => null, 'result' => null];
                }

                $result = $mutate($room);

                if ($room['players'] === []) {
                    Cache::forget($this->key($code));

                    return ['room' => null, 'result' => $result];
                }

                Cache::put($this->key($code), $room, self::TTL);

                return ['room' => $room, 'result' => $result];
            } finally {
                $lock->release();
            }
        }

        return ['room' => null, 'result' => null];
    }

    /** @return array<string, mixed>|null */
    private function freshRoom(string $code): ?array
    {
        return $this->withRoom($code, static function (array &$room): void {})['room'];
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

        $res = $this->withRoom($code, function (array &$room) use ($data): JsonResponse {
            $playerId = $data['playerId'] ?? null;
            $existingIdx = null;

            foreach ($room['players'] as $i => $pl) {
                if ($playerId !== null && $pl['id'] === $playerId) {
                    $existingIdx = $i;

                    break;
                }
            }

            // Sudah di room (refresh / HP bangun dari sleep / sinyal jelek):
            // perbarui nama + denyut, jangan buat hero kedua.
            if ($existingIdx !== null) {
                $room['players'][$existingIdx]['name'] = $data['name'];
                $room['players'][$existingIdx]['lastBeat'] = time();

                return response()->json([
                    'playerId' => $room['players'][$existingIdx]['id'],
                    'hostId' => $room['hostId'],
                    'hero' => (int) $room['players'][$existingIdx]['hero'],
                ]);
            }

            if (count($room['players']) >= 4) {
                return response()->json(['message' => 'Room penuh (maks 4).'], 409);
            }

            $hero = $this->firstFreeHero($room['players']);

            if ($hero === null) {
                return response()->json(['message' => 'Room penuh (maks 4).'], 409);
            }

            // Pemain baru boleh masuk walau permainan sudah berjalan: teman
            // yang telat mengetik kode dulu terkunci selamanya ("Game sudah
            // mulai."). Server tetap menentukan hero kosong, jadi tidak ada
            // dua pemain yang menggerakkan hero yang sama.
            $playerId ??= (string) Str::uuid();
            $room['players'][] = [
                'id' => $playerId,
                'name' => $data['name'],
                'hero' => $hero,
                'skin' => 0,
                'lastBeat' => time(),
            ];

            return response()->json([
                'playerId' => $playerId,
                'hostId' => $room['hostId'],
                'hero' => $hero,
            ]);
        });

        return $res['result'] ?? response()->json(['message' => 'Room tidak ditemukan.'], 404);
    }

    /** Ganti hero/skin selama masih di lobby. */
    public function pick(Request $request, string $code): JsonResponse
    {
        $data = $request->validate([
            'playerId' => 'required|string',
            'hero' => 'required|integer|min:0|max:3',
            'skin' => 'sometimes|integer|min:0|max:2',
        ]);

        $res = $this->withRoom($code, function (array &$room) use ($data): JsonResponse {
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

            return response()->json(['ok' => true]);
        });

        return $res['result'] ?? response()->json(['message' => 'Room tidak ditemukan.'], 404);
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

        $res = $this->withRoom($code, function (array &$room) use ($data): JsonResponse {
            foreach ($room['players'] as &$player) {
                if ($player['id'] === $data['playerId']) {
                    $player['lastBeat'] = time();
                }
            }

            unset($player);

            return response()->json(['ok' => true]);
        });

        return $res['result'] ?? response()->json(['message' => 'Room tidak ditemukan.'], 404);
    }

    public function leave(Request $request, string $code): JsonResponse
    {
        $data = $request->validate(['playerId' => 'required|string']);

        $this->withRoom($code, function (array &$room) use ($data): void {
            $room['players'] = array_values(array_filter(
                $room['players'],
                fn (array $p): bool => $p['id'] !== $data['playerId'],
            ));
        });

        return response()->json(['ok' => true]);
    }

    public function start(Request $request, string $code): JsonResponse
    {
        $data = $request->validate(['playerId' => 'required|string']);

        // Siaran dilakukan di luar lock: Reverb bisa lambat/mati dan lock
        // dipakai heartbeat semua pemain.
        $res = $this->withRoom($code, function (array &$room) use ($data): bool {
            if ($room['hostId'] !== $data['playerId']) {
                return false;
            }

            $room['status'] = 'playing';

            return true;
        });

        if ($res['room'] === null) {
            return response()->json(['message' => 'Room tidak ditemukan.'], 404);
        }

        if ($res['result'] !== true) {
            return response()->json(['message' => 'Hanya host yang bisa mulai.'], 403);
        }

        // Snapshot lama (dari permainan sebelumnya di room yang sama) tidak
        // boleh dipakai klien yang baru masuk.
        Cache::forget($this->key($code).':snap');

        broadcast(new GameStarted($code, array_map(fn (array $p): array => [
            'id' => $p['id'],
            'name' => $p['name'],
            'hero' => $p['hero'],
            'skin' => $p['skin'] ?? 0,
        ], $res['room']['players'])));

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

        // Cap generasi host: klien membuang snapshot dari host lama yang
        // masih sempat terkirim sesudah host baru dipilih. Tanpa ini nomor
        // urut (q) dari dua host saling menimpa dan klien bisa membeku.
        $snap = $data['snap'];
        $ep = (int) ($room['hostEp'] ?? 0);

        if ($ep > 0) {
            $snap['ep'] = $ep;
        }

        // Simpan snapshot terakhir: cadangan bila WebSocket klien diblokir.
        Cache::put($this->key($code).':snap', $snap, 30);

        // Reverb bisa mati / tidak terjangkau. Jangan sampai snapshot + input
        // ikut gagal: klien masih bisa mengambil snapshot lewat HTTP.
        try {
            broadcast(new GameSnapshot($code, $snap));
        } catch (Throwable $e) {
            // Laporkan sekali per menit; snapshot datang 12x/detik sehingga
            // melaporkan semuanya hanya membanjiri log.
            if (Cache::add($this->key($code).':warn:cast', 1, 60)) {
                report($e);
            }
        }

        // Balasan sekaligus membawa input klien: host tidak perlu polling
        // input terpisah ~20x/detik. Satu request untuk kirim + terima.
        return response()->json([
            'ok' => true,
            'inputs' => $this->collectInputs($code, $room, $data['playerId']),
        ]);
    }

    /**
     * Input terbaru dari semua klien (host dikecualikan).
     *
     * @return array<int, array{id: string, hero: int, input: array<string, mixed>, age: int}>
     */
    private function collectInputs(string $code, array $room, string $hostId): array
    {
        $inputs = [];

        foreach ($room['players'] as $pl) {
            if ($pl['id'] === $hostId) {
                continue;
            }

            $in = Cache::get($this->key($code).':in:'.$pl['id']);

            if (is_array($in) && isset($in['input']) && is_array($in['input'])) {
                $inputs[] = [
                    'id' => $pl['id'],
                    // Hero ditentukan server: host memakai ini langsung, jadi
                    // roster host yang sempat basi tidak bisa menggerakkan
                    // hero milik pemain lain.
                    'hero' => (int) $pl['hero'],
                    'input' => $in['input'],
                    // Usia input dalam milidetik: host memakainya untuk
                    // menghentikan hero yang kliennya berhenti mengirim
                    // (tab ditutup / jaringan putus) supaya tidak berjalan
                    // sendiri dengan arah terakhir.
                    'age' => (int) round((microtime(true) - (float) $in['at']) * 1000),
                ];
            }
        }

        return $inputs;
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
            ['at' => microtime(true), 'input' => $data['input']],
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

        return response()->json([
            'inputs' => $this->collectInputs($code, $room, $data['playerId']),
        ]);
    }
}
