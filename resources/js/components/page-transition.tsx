import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/*
 * Transisi pindah halaman ala liquid glass.
 * Setiap Inertia visit: tirai kaca frosted menyapu masuk (cover),
 * lalu tersibak ke atas setelah halaman baru dirender (navigate).
 * Dihormati: prefers-reduced-motion → tanpa tirai.
 */
export default function PageTransition() {
    const [cover, setCover] = useState(false);
    const timer = useRef<number | null>(null);
    const startedAt = useRef<number>(0);

    useEffect(() => {
        if (
            typeof window === 'undefined' ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
            return;
        }

        const clear = (): void => {
            if (timer.current !== null) {
                window.clearTimeout(timer.current);
                timer.current = null;
            }
        };

        const offStart = router.on('start', () => {
            clear();
            startedAt.current = Date.now();
            setCover(true);
            // Pengaman: jangan biarkan tirai nyangkut kalau event navigate terlewat.
            timer.current = window.setTimeout(() => setCover(false), 6000);
        });
        const offNavigate = router.on('navigate', () => {
            clear();
            // Tahan minimum 650ms supaya transisinya terbaca smooth.
            const wait = Math.max(0, 650 - (Date.now() - startedAt.current));
            timer.current = window.setTimeout(() => setCover(false), wait);
        });

        return () => {
            clear();
            offStart();
            offNavigate();
        };
    }, []);

    return (
        <AnimatePresence>
            {cover && (
                <motion.div
                    aria-hidden="true"
                    className="fixed inset-0 z-[80] overflow-hidden bg-white/60 backdrop-blur-2xl backdrop-saturate-150 dark:bg-[#14102a]/75"
                    initial={{ clipPath: 'inset(0 0 100% 0)' }}
                    animate={{ clipPath: 'inset(0% 0 0% 0)' }}
                    exit={{ clipPath: 'inset(0 0 100% 0)' }}
                    transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                >
                    {/* Blob cair */}
                    <motion.div
                        className="absolute -top-20 -left-20 size-96 rounded-full bg-cyan-400/30 blur-3xl dark:bg-cyan-500/20"
                        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                    <motion.div
                        className="absolute -right-20 -bottom-20 size-96 rounded-full bg-red-400/25 blur-3xl dark:bg-red-500/15"
                        animate={{ x: [0, -50, 0], y: [0, -40, 0] }}
                        transition={{
                            duration: 3.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                    {/* Kilau kaca diagonal */}
                    <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.35)_45%,transparent_60%)] dark:bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,0.07)_45%,transparent_60%)]" />

                    {/* Loader pixel */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-6 py-4 shadow-[0_8px_32px_rgba(59,130,246,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                            <div className="flex gap-1.5">
                                {[0, 1, 2].map((i) => (
                                    <span
                                        key={i}
                                        className="size-2 animate-bounce bg-cyan-500 dark:bg-cyan-300"
                                        style={{
                                            animationDelay: `${i * 0.15}s`,
                                        }}
                                    />
                                ))}
                            </div>
                            <div className="font-pixel text-[9px] tracking-wider text-slate-700 dark:text-slate-200">
                                LOADING
                            </div>
                            <div className="h-1 w-32 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10">
                                <motion.div
                                    className="h-full w-1/2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
