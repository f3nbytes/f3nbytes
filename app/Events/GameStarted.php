<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

class GameStarted implements ShouldBroadcastNow
{
    /**
     * @param  array<int, array{id: string, name: string, hero: int, skin: int}>  $players
     */
    public function __construct(
        public string $code,
        public array $players,
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('game-room.'.$this->code);
    }

    public function broadcastAs(): string
    {
        return 'game.started';
    }
}
