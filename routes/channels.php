<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('game-room.{code}', function (): bool {
    // Kode room 4 karakter adalah kuncinya; tamu boleh ikut.
    return true;
});
