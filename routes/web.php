<?php

use App\Http\Controllers\GameRoomController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::inertia('projects', 'projects')->name('projects');

Route::inertia('game', 'game')->name('game');

Route::inertia('game/phaser', 'game-phaser')->name('game.phaser');

Route::inertia('map-editor', 'map-editor')->name('map.editor');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

Route::prefix('api/game')->group(function () {
    Route::post('rooms', [GameRoomController::class, 'store']);
    Route::post('rooms/{code}/join', [GameRoomController::class, 'join']);
    Route::post('rooms/{code}/pick', [GameRoomController::class, 'pick']);
    Route::get('rooms/{code}', [GameRoomController::class, 'show']);
    Route::post('rooms/{code}/heartbeat', [GameRoomController::class, 'heartbeat']);
    Route::post('rooms/{code}/leave', [GameRoomController::class, 'leave']);
    Route::post('rooms/{code}/start', [GameRoomController::class, 'start']);
    Route::post('rooms/{code}/state', [GameRoomController::class, 'pushState']);
    Route::get('rooms/{code}/state', [GameRoomController::class, 'pullState']);
    Route::post('rooms/{code}/input', [GameRoomController::class, 'pushInput']);
    Route::post('rooms/{code}/inputs', [GameRoomController::class, 'pullInputs']);
});

require __DIR__.'/settings.php';
