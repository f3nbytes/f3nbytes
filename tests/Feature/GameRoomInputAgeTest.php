<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Cache;

/**
 * Helper: buat room dengan host + satu pemain client, status = 'playing'.
 *
 * @return array{code: string, hostId: string, clientId: string}
 */
function seedRoom(): array
{
    $hostId = 'host-1';
    $clientId = 'client-1';
    $code = 'ABCD';
    $key = 'f3n-room:ABCD';

    Cache::put($key, [
        'code' => $code,
        'hostId' => $hostId,
        'status' => 'playing',
        'players' => [
            ['id' => $hostId, 'name' => 'Host', 'hero' => 0, 'skin' => 0, 'lastBeat' => time()],
            ['id' => $clientId, 'name' => 'Client', 'hero' => 1, 'skin' => 0, 'lastBeat' => time()],
        ],
    ], 7200);

    return compact('code', 'hostId', 'clientId');
}

test('pushInput stores input with timestamp', function () {
    $r = seedRoom();

    $this->postJson("/api/game/rooms/{$r['code']}/input", [
        'playerId' => $r['clientId'],
        'input' => ['x' => 1, 'y' => 0],
    ])->assertOk();

    $cached = Cache::get("f3n-room:{$r['code']}:in:{$r['clientId']}");

    expect($cached)
        ->toBeArray()
        ->toHaveKeys(['at', 'input'])
        ->and($cached['input'])->toBe(['x' => 1, 'y' => 0])
        ->and($cached['at'])->toBeFloat();
});

test('pullInputs returns age in milliseconds for each client input', function () {
    $r = seedRoom();

    // Klien kirim input.
    $this->postJson("/api/game/rooms/{$r['code']}/input", [
        'playerId' => $r['clientId'],
        'input' => ['x' => 1, 'y' => 0],
    ])->assertOk();

    // Host tarik input segera — age harus sangat kecil.
    $resp = $this->postJson("/api/game/rooms/{$r['code']}/inputs", [
        'playerId' => $r['hostId'],
    ]);

    $resp->assertOk()
        ->assertJsonStructure(['inputs' => [['id', 'input', 'age']]]);

    $inputs = $resp->json('inputs');

    expect($inputs)->toHaveCount(1)
        ->and($inputs[0]['id'])->toBe($r['clientId'])
        ->and($inputs[0]['input'])->toBe(['x' => 1, 'y' => 0])
        ->and($inputs[0]['age'])->toBeInt()
        ->and($inputs[0]['age'])->toBeLessThan(2000); // pasti < 2 detik.
});

test('pullInputs age grows when client stops sending', function () {
    $r = seedRoom();

    // Simulasikan input lama: tulis cache manual dengan timestamp 3 detik lalu.
    Cache::put(
        "f3n-room:{$r['code']}:in:{$r['clientId']}",
        ['at' => microtime(true) - 3.0, 'input' => ['x' => 1, 'y' => 0]],
        60,
    );

    $resp = $this->postJson("/api/game/rooms/{$r['code']}/inputs", [
        'playerId' => $r['hostId'],
    ]);

    $inputs = $resp->json('inputs');

    // Age harus sekitar 3000 ms — pasti lebih dari INPUT_STALE_MS (1500).
    expect($inputs[0]['age'])->toBeGreaterThan(1500);
});

test('pullInputs excludes host own input', function () {
    $r = seedRoom();

    // Host juga pushInput (seharusnya tidak terjadi, tapi defensif).
    $this->postJson("/api/game/rooms/{$r['code']}/input", [
        'playerId' => $r['hostId'],
        'input' => ['x' => 0, 'y' => 1],
    ])->assertOk();

    $resp = $this->postJson("/api/game/rooms/{$r['code']}/inputs", [
        'playerId' => $r['hostId'],
    ]);

    // Host tidak muncul di hasil pullInputs.
    expect($resp->json('inputs'))->toBeEmpty();
});

test('pushState tetap sukses saat Reverb mati', function () {
    $r = seedRoom();

    Broadcast::shouldReceive('queue')->andThrow(new RuntimeException('Reverb mati'));

    $this->postJson("/api/game/rooms/{$r['code']}/state", [
        'playerId' => $r['hostId'],
        'snap' => ['v' => 1, 'q' => 9],
    ])->assertOk()
        ->assertJsonPath('ok', true);

    // Snapshot terakhir tetap tersimpan untuk jalur cadangan HTTP.
    expect(Cache::get("f3n-room:{$r['code']}:snap"))
        ->toBe(['v' => 1, 'q' => 9]);
});

test('pushState returns client inputs in the same response', function () {
    $r = seedRoom();

    $this->postJson("/api/game/rooms/{$r['code']}/input", [
        'playerId' => $r['clientId'],
        'input' => ['x' => -1, 'y' => 0],
    ])->assertOk();

    $resp = $this->postJson("/api/game/rooms/{$r['code']}/state", [
        'playerId' => $r['hostId'],
        'snap' => ['v' => 1, 'q' => 1],
    ]);

    $resp->assertOk()
        ->assertJsonStructure(['ok', 'inputs' => [['id', 'input', 'age']]]);

    $inputs = $resp->json('inputs');

    expect($inputs)->toHaveCount(1)
        ->and($inputs[0]['id'])->toBe($r['clientId'])
        ->and($inputs[0]['hero'])->toBe(1)
        ->and($inputs[0]['input'])->toBe(['x' => -1, 'y' => 0]);
});

test('pullInputs rejects non-host player', function () {
    $r = seedRoom();

    $this->postJson("/api/game/rooms/{$r['code']}/inputs", [
        'playerId' => $r['clientId'],
    ])->assertStatus(403);
});
