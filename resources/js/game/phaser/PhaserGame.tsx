import Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import { SchoolScene } from './SchoolScene';

/** Mount/unmount Phaser sekali per render (aman StrictMode). */
export default function PhaserGame() {
    const hostRef = useRef<HTMLDivElement | null>(null);
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        const host = hostRef.current;

        if (!host) {
            return;
        }

        const game = new Phaser.Game({
            type: Phaser.AUTO,
            parent: host,
            width: 960,
            height: 540,
            backgroundColor: '#437153',
            pixelArt: true,
            roundPixels: true,
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
            },
            scene: [SchoolScene],
        });
        gameRef.current = game;

        return () => {
            game.destroy(true);
            gameRef.current = null;
        };
    }, []);

    return (
        <div
            ref={hostRef}
            className="h-full max-h-full w-full overflow-hidden [&>canvas]:mx-auto [&>canvas]:block"
        />
    );
}
