<?php

use Illuminate\Support\Facades\Cache;

/**
 * @return array{code: string, hostId: string, clientId: string}
 */
function seedRejoinRoom(string $status = 'playing'): array
{
    $hostId = 'host-rejoin';
    $clientId = 'client-rejoin';
    $code = 'RJN1';

    Cache::put('f3n-room:'.$code, [
        'code' => $code,
        'hostId' => $hostId,
        'status' => $status,
        'players' => [
            ['id' => $hostId, 'name' => 'Host', 'hero' => 0, 'skin' => 0, 'lastBeat' => time()],
            ['id' => $clientId, 'name' => 'Client', 'hero' => 1, 'skin' => 0, 'lastBeat' => time() - 60],
        ],
    ], 7200);

    return compact('code', 'hostId', 'clientId');
}

test('pemain basi dibuang saat lobby', function () {
    $r = seedRejoinRoom('lobby');

    $resp = $this->getJson("/api/game/rooms/{$r['code']}");

    $resp->assertOk();

    // Hanya host yang heartbeat-nya masih segar.
    expect($resp->json('players'))->toHaveCount(1)
        ->and($resp->json('players.0.id'))->toBe($r['hostId']);
});

test('pemain basi tetap disimpan saat permainan berjalan', function () {
    $r = seedRejoinRoom('playing');

    $resp = $this->getJson("/api/game/rooms/{$r['code']}");

    $resp->assertOk();

    expect($resp->json('players'))->toHaveCount(2);
});

test('pemain lama boleh gabung lagi saat permainan berjalan', function () {
    $r = seedRejoinRoom('playing');

    $this->postJson("/api/game/rooms/{$r['code']}/join", [
        'name' => 'Client Lagi',
        'playerId' => $r['clientId'],
    ])
        ->assertOk()
        ->assertJsonPath('playerId', $r['clientId'])
        ->assertJsonPath('hostId', $r['hostId']);

    // Tidak menambah slot / duplikat.
    $players = $this->getJson("/api/game/rooms/{$r['code']}")->json('players');
    expect($players)->toHaveCount(2);

    $client = collect($players)->firstWhere('id', $r['clientId']);
    expect($client['name'])->toBe('Client Lagi');
});

test('join ulang di lobby tidak membuat hero kedua', function () {
    $r = seedRejoinRoom('lobby');
    $newId = 'client-baru';

    for ($i = 0; $i < 2; $i++) {
        $this->postJson("/api/game/rooms/{$r['code']}/join", [
            'name' => 'Teman',
            'playerId' => $newId,
        ])->assertOk()->assertJsonPath('playerId', $newId);
    }

    $players = $this->getJson("/api/game/rooms/{$r['code']}")->json('players');

    expect($players)->toHaveCount(2)
        ->and(collect($players)->where('id', $newId))->toHaveCount(1);
});

test('host basi digantikan pemain lain yang masih aktif', function () {
    $r = seedRejoinRoom('playing');

    $room = Cache::get('f3n-room:'.$r['code']);
    $room['players'][0]['lastBeat'] = time() - 60; // host mati
    $room['players'][1]['lastBeat'] = time();      // client masih hidup
    Cache::put('f3n-room:'.$r['code'], $room, 7200);

    $resp = $this->getJson("/api/game/rooms/{$r['code']}");

    $resp->assertOk();
    expect($resp->json('hostId'))->toBe($r['clientId']);
    expect($resp->json('players'))->toHaveCount(2);
});

test('pemain baru boleh gabung saat permainan berjalan dan dapat hero kosong', function () {
    $r = seedRejoinRoom('playing');

    $this->postJson("/api/game/rooms/{$r['code']}/join", [
        'name' => 'Orang Baru',
        'playerId' => 'someone-new',
    ])
        ->assertOk()
        ->assertJsonPath('playerId', 'someone-new')
        ->assertJsonPath('hostId', $r['hostId'])
        ->assertJsonPath('hero', 2);

    $players = $this->getJson("/api/game/rooms/{$r['code']}")->json('players');

    expect($players)->toHaveCount(3)
        ->and(collect($players)->firstWhere('id', 'someone-new')['name'])->toBe('Orang Baru');
});

test('pemain baru ditolak saat semua hero sudah terpakai', function () {
    $r = seedRejoinRoom('playing');

    $room = Cache::get('f3n-room:'.$r['code']);
    $room['players'][] = ['id' => 'x2', 'name' => 'X2', 'hero' => 2, 'skin' => 0, 'lastBeat' => time()];
    $room['players'][] = ['id' => 'x3', 'name' => 'X3', 'hero' => 3, 'skin' => 0, 'lastBeat' => time()];
    Cache::put('f3n-room:'.$r['code'], $room, 7200);

    $this->postJson("/api/game/rooms/{$r['code']}/join", [
        'name' => 'Kepalang',
        'playerId' => 'someone-new',
    ])->assertStatus(409);
});

test('pemain lobby tidak dibuang hanya karena jeda 20 detik', function () {
    $r = seedRejoinRoom('lobby');

    $room = Cache::get('f3n-room:'.$r['code']);
    $room['players'][1]['lastBeat'] = time() - 20;
    Cache::put('f3n-room:'.$r['code'], $room, 7200);

    $resp = $this->getJson("/api/game/rooms/{$r['code']}");

    $resp->assertOk();
    expect($resp->json('players'))->toHaveCount(2);
});

test('host lobby tidak diganti walau heartbeat-nya sempat basi', function () {
    $r = seedRejoinRoom('lobby');

    $room = Cache::get('f3n-room:'.$r['code']);
    $room['players'][0]['lastBeat'] = time() - 30;
    $room['players'][1]['lastBeat'] = time();
    Cache::put('f3n-room:'.$r['code'], $room, 7200);

    $resp = $this->getJson("/api/game/rooms/{$r['code']}");

    $resp->assertOk();
    expect($resp->json('hostId'))->toBe($r['hostId']);
});

test('snapshot host diberi cap generasi host', function () {
    $r = seedRejoinRoom('playing');

    $room = Cache::get('f3n-room:'.$r['code']);
    $room['hostEp'] = 123456;
    Cache::put('f3n-room:'.$r['code'], $room, 7200);

    $this->postJson("/api/game/rooms/{$r['code']}/state", [
        'playerId' => $r['hostId'],
        'snap' => ['v' => 1, 'q' => 7, 'ph' => 'roam', 'w' => 0, 's' => 0, 'mp' => 0, 'p' => [], 'e' => [], 'pr' => []],
    ])->assertOk();

    expect(Cache::get('f3n-room:'.$r['code'].':snap')['ep'])->toBe(123456);
});
