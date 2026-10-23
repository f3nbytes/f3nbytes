<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

class GameSnapshot implements ShouldBroadcastNow
{
    /** @param  array<string, mixed>  $snapshot */
    public function __construct(
        public string $code,
        public array $snapshot,
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('game-room.'.$this->code);
    }

    public function broadcastAs(): string
    {
        return 'game.snapshot';
    }
}
