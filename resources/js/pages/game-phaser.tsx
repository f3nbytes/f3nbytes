import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import PhaserGame from '@/game/phaser/PhaserGame';

export default function GamePhaser() {
    return (
        <>
            <Head title="Lab Phaser — Demo Map Sekolah" />
            <main className="flex h-screen flex-col overflow-hidden bg-[#070b16] font-sans text-slate-100">
                <div className="relative mx-auto flex h-full min-h-0 w-full flex-col gap-3 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <Link
                            href="/game"
                            className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/50 hover:text-white"
                        >
                            <ArrowLeft className="size-4" /> Game
                        </Link>
                        <div className="flex items-center gap-2 font-pixel text-[11px] text-fuchsia-300">
                            <FlaskConical className="size-4" /> LAB PHASER —
                            DEMO MAP SEKOLAH
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href="/map-editor"
                                className="inline-flex items-center gap-1.5 rounded-md border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 font-pixel text-[10px] text-cyan-200 transition hover:bg-cyan-400/20"
                            >
                                <FlaskConical className="size-3.5" /> Map Editor
                            </Link>
                            <span className="rounded-md border border-white/15 bg-white/5 px-3 py-2 font-mono text-xs text-slate-400">
                                WASD jalan · E bicara · M minimap
                            </span>
                        </div>
                    </div>
                    <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border-2 border-fuchsia-400/30 bg-black shadow-[0_0_60px_rgba(232,121,249,0.15)]">
                        <PhaserGame />
                    </div>
                    <p className="text-center font-mono text-[11px] text-slate-500">
                        Scaffold migrasi Phaser: scene sekolah + sprite Fadlan +
                        kamera + NPC dialog. Game utama tetap di /game.
                    </p>
                </div>
            </main>
        </>
    );
}
