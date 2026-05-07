import { Head } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowRight,
    Code2,
    Database,
    ExternalLink,
    Github,
    Instagram,
    Languages,
    Mail,
    Menu,
    MessageCircle,
    Moon,
    Network,
    Palette,
    ServerCog,
    Sparkles,
    Sun,
    X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

type Language = 'en' | 'id' | 'jp';

const languageOptions: { value: Language; label: string }[] = [
    { value: 'en', label: 'EN' },
    { value: 'id', label: 'ID' },
    { value: 'jp', label: 'JP' },
];

const navItems = [
    { label: { en: 'About', id: 'Tentang', jp: '概要' }, href: '#about' },
    { label: { en: 'Team', id: 'Tim', jp: 'チーム' }, href: '#team' },
    {
        label: { en: 'Projects', id: 'Proyek', jp: 'プロジェクト' },
        href: '#projects',
    },
    { label: { en: 'Stack', id: 'Teknologi', jp: '技術' }, href: '#stack' },
    { label: { en: 'Contact', id: 'Kontak', jp: '連絡' }, href: '#contact' },
];

const loadingLines: Record<Language, string[]> = {
    en: ['Initializing F3N-Bytes...', 'Loading developers...', 'System ready.'],
    id: ['Menyalakan F3N-Bytes...', 'Memuat developer...', 'Sistem siap.'],
    jp: [
        'F3N-Bytes を起動中...',
        '開発者を読み込み中...',
        'システム準備完了。',
    ],
};

const targetItems: Record<Language, string[]> = {
    en: [
        'Income',
        'CV',
        'Portfolio',
        'Personal Branding',
        'Skills Development',
        'Networking',
        'Achievement',
        'Asset / Investment',
    ],
    id: [
        'Penghasilan',
        'CV',
        'Portofolio',
        'Personal Branding',
        'Pengembangan Skill',
        'Networking',
        'Pencapaian',
        'Aset / Investasi',
    ],
    jp: [
        '収入',
        '履歴書',
        'ポートフォリオ',
        '個人ブランディング',
        'スキル成長',
        'ネットワーク',
        '実績',
        '資産 / 投資',
    ],
};

const teamMembers = [
    {
        name: 'Fahri',
        role: {
            en: 'Frontend Developer & UI Designer',
            id: 'Frontend Developer & UI Designer',
            jp: 'フロントエンド開発者 & UIデザイナー',
        },
        skills: ['React', 'Tailwind', 'UI/UX'],
        description: {
            en: 'Turns ideas into clean interfaces with crisp interactions, strong visual hierarchy, and product-minded detail.',
            id: 'Mengubah ide menjadi antarmuka rapi dengan interaksi tajam, hierarki visual kuat, dan detail yang product-minded.',
            jp: 'アイデアを洗練されたUIに変え、明確な操作感と強い視覚階層で形にします。',
        },
        accent: 'from-blue-500 to-cyan-300',
        icon: Palette,
        photo: '/foto_fahri.png',
        github: 'https://github.com/Rusherimfa',
        portfolio: 'https://fahri.f3bytes.my.id',
    },
    {
        name: 'Nathan',
        role: {
            en: 'Backend Developer',
            id: 'Backend Developer',
            jp: 'バックエンド開発者',
        },
        skills: ['Laravel', 'API', 'Database'],
        description: {
            en: 'Builds reliable systems, API foundations, and database flows that keep projects fast and scalable.',
            id: 'Membangun sistem andal, fondasi API, dan alur database agar proyek tetap cepat dan scalable.',
            jp: '信頼できるシステム、API基盤、データベース設計で高速で拡張しやすい開発を支えます。',
        },
        accent: 'from-red-500 to-rose-300',
        icon: ServerCog,
        photo: '/foto_nathan.jpg',
        github: 'https://github.com/NathanAndhika',
        portfolio: 'https://nathan.f3bytes.my.id',
    },
    {
        name: 'Farrel',
        role: {
            en: 'Fullstack Developer',
            id: 'Fullstack Developer',
            jp: 'フルスタック開発者',
        },
        skills: ['React', 'Laravel', 'MySQL'],
        description: {
            en: 'Connects frontend polish with backend structure so each product feels complete from screen to server.',
            id: 'Menghubungkan polish frontend dengan struktur backend supaya produk terasa utuh dari layar sampai server.',
            jp: 'フロントエンドの完成度とバックエンド構造をつなぎ、画面からサーバーまで一体感を作ります。',
        },
        accent: 'from-sky-400 to-red-400',
        icon: Code2,
        photo: '/foto_farrel.png',
        github: 'https://github.com/farrelazam0502',
        portfolio: 'https://farrel.f3bytes.my.id',
    },
    {
        name: 'Fadlan',
        role: {
            en: 'UI/UX & System Analyst',
            id: 'UI/UX & System Analyst',
            jp: 'UI/UX & システムアナリスト',
        },
        skills: ['Design System', 'Flow', 'UI Concept'],
        description: {
            en: 'Maps user flows, structures systems, and shapes concepts into experiences the team can build together.',
            id: 'Memetakan user flow, struktur sistem, dan konsep menjadi pengalaman yang bisa dibangun tim bersama.',
            jp: 'ユーザーフローとシステム構造を整理し、チームで実装できる体験へ落とし込みます。',
        },
        accent: 'from-indigo-400 to-blue-500',
        icon: Network,
        photo: '/foto_fadlan.jpg',
        github: 'https://github.com/Fadlan079',
        portfolio: 'https://fadlan.f3bytes.my.id',
    },
];

const projects = [
    {
        title: 'OceanResto',
        description: {
            en: 'Restaurant ordering experience with polished menus, table flows, and business-ready presentation.',
            id: 'Pengalaman pemesanan restoran dengan menu rapi, alur meja, dan presentasi siap bisnis.',
            jp: '洗練されたメニュー、テーブル導線、ビジネス向けの見せ方を備えた飲食店注文体験。',
        },
        technologies: ['React', 'Tailwind', 'Laravel'],
        signal: 'RESTO_UI',
    },
    {
        title: 'UKK Project',
        description: {
            en: 'School competency project built with practical architecture, authentication, and structured data flows.',
            id: 'Proyek kompetensi sekolah dengan arsitektur praktis, autentikasi, dan alur data terstruktur.',
            jp: '実用的な構成、認証、整理されたデータフローで作られた学校の実技プロジェクト。',
        },
        technologies: ['Laravel', 'MySQL', 'PHP'],
        signal: 'EXAM_BUILD',
    },
    {
        title: 'WhatsApp Bot',
        description: {
            en: 'Automation assistant for messages, commands, and lightweight operational workflows.',
            id: 'Asisten otomasi untuk pesan, command, dan workflow operasional ringan.',
            jp: 'メッセージ、コマンド、軽量な運用フローを支える自動化アシスタント。',
        },
        technologies: ['JavaScript', 'API', 'Node'],
        signal: 'BOT_ONLINE',
    },
    {
        title: 'Portfolio Website',
        description: {
            en: 'Personal branding site with project highlights, identity, and focused storytelling for developers.',
            id: 'Website personal branding dengan highlight proyek, identitas, dan storytelling yang fokus untuk developer.',
            jp: '開発者向けに、プロジェクト実績・個性・ストーリーを見せる個人ブランディングサイト。',
        },
        technologies: ['React', 'Tailwind', 'Vite'],
        signal: 'BRAND_LIVE',
    },
];

const techStack = [
    { name: 'React', icon: Code2 },
    { name: 'Laravel', icon: ServerCog },
    { name: 'Tailwind CSS', icon: Sparkles },
    { name: 'MySQL', icon: Database },
    { name: 'JavaScript', icon: Code2 },
    { name: 'PHP', icon: ServerCog },
];

const stats = [
    {
        value: '12+',
        label: {
            en: 'Projects Completed',
            id: 'Proyek Selesai',
            jp: '完了プロジェクト',
        },
    },
    {
        value: '4',
        label: { en: 'Team Members', id: 'Anggota Tim', jp: 'チームメンバー' },
    },
    { value: '6+', label: { en: 'Technologies', id: 'Teknologi', jp: '技術' } },
    {
        value: '720+',
        label: {
            en: 'Hours of Coding',
            id: 'Jam Coding',
            jp: 'コーディング時間',
        },
    },
];

const contactItems = [
    { label: 'Discord', value: 'F3N-Bytes Studio', icon: MessageCircle },
    { label: 'GitHub', value: 'github.com/f3n-bytes', icon: Github },
    { label: 'Instagram', value: '@f3nbytes', icon: Instagram },
    { label: 'Email', value: 'hello@f3nbytes.dev', icon: Mail },
];

const copy = {
    en: {
        contact: 'Contact',
        themeLabel: 'Theme',
        languageLabel: 'Language',
        light: 'Light',
        dark: 'Dark',
        eyebrow: 'Young digital developer team',
        tagline: 'Built by passion, powered by bytes.',
        mission: 'Grow together, build something bigger.',
        exploreProjects: 'Explore Projects',
        meetTeam: 'Meet The Team',
        live: 'LIVE',
        demo: 'Live Demo',
        source: 'GitHub',
        crafted: 'status: crafted by F3N-Bytes',
        footerVision: 'Four minds. One vision.',
        about: {
            eyebrow: 'About The Team',
            title: 'Four minds growing through one shared system.',
            description:
                'F3N-Bytes is focused on building projects, improving skills, growing together, and creating digital experiences with startup energy and studio discipline.',
            cards: [
                [
                    'Personal Growth',
                    'Every member builds visible skills, stronger habits, and a portfolio that compounds.',
                ],
                [
                    'Team Growth',
                    'The team learns through shipping, reviewing, experimenting, and solving real problems together.',
                ],
                [
                    'Vision & Mission',
                    'Create practical digital products while becoming a trusted young developer studio.',
                ],
            ],
        },
        team: {
            eyebrow: 'Team Showcase',
            title: 'A compact squad with complementary strengths.',
            description:
                'F3N stands for three members with F and one member with N: Fahri, Fadlan, Farrel, and Nathan.',
        },
        projects: {
            eyebrow: 'Portfolio',
            title: 'Projects that turn practice into proof.',
            description:
                'A project showcase for experiments, school builds, product ideas, and portfolio work that keeps the team moving forward.',
        },
        stack: {
            eyebrow: 'Tech Stack',
            title: 'Tools for fast interfaces and reliable systems.',
            description:
                "React, Tailwind, Vite, and Laravel form the team's core workflow for building modern digital products.",
        },
        contactSection: {
            eyebrow: 'Contact',
            title: 'Build, collaborate, or grow with F3N-Bytes.',
            description:
                'Reach the team for project ideas, portfolio collaboration, learning partnerships, or digital studio opportunities.',
        },
    },
    id: {
        contact: 'Kontak',
        themeLabel: 'Tema',
        languageLabel: 'Bahasa',
        light: 'Terang',
        dark: 'Gelap',
        eyebrow: 'Tim developer digital muda',
        tagline: 'Dibangun dengan passion, digerakkan oleh bytes.',
        mission: 'Tumbuh bersama, bangun sesuatu yang lebih besar.',
        exploreProjects: 'Lihat Proyek',
        meetTeam: 'Kenali Tim',
        live: 'AKTIF',
        demo: 'Demo Live',
        source: 'GitHub',
        crafted: 'status: dibuat oleh F3N-Bytes',
        footerVision: 'Empat pikiran. Satu visi.',
        about: {
            eyebrow: 'Tentang Tim',
            title: 'Empat pikiran tumbuh dalam satu sistem bersama.',
            description:
                'F3N-Bytes fokus membangun proyek, meningkatkan skill, tumbuh bersama, dan menciptakan pengalaman digital dengan energi startup serta disiplin studio.',
            cards: [
                [
                    'Pertumbuhan Personal',
                    'Setiap anggota membangun skill yang terlihat, kebiasaan yang kuat, dan portofolio yang terus berkembang.',
                ],
                [
                    'Pertumbuhan Tim',
                    'Tim belajar lewat shipping, review, eksperimen, dan menyelesaikan masalah nyata bersama.',
                ],
                [
                    'Visi & Misi',
                    'Menciptakan produk digital praktis sambil menjadi studio developer muda yang dipercaya.',
                ],
            ],
        },
        team: {
            eyebrow: 'Showcase Tim',
            title: 'Skuad ringkas dengan kekuatan yang saling melengkapi.',
            description:
                'F3N berarti tiga anggota berawalan F dan satu anggota berawalan N: Fahri, Fadlan, Farrel, dan Nathan.',
        },
        projects: {
            eyebrow: 'Portofolio',
            title: 'Proyek yang mengubah latihan menjadi bukti.',
            description:
                'Showcase proyek untuk eksperimen, tugas sekolah, ide produk, dan portofolio yang menjaga tim terus bergerak.',
        },
        stack: {
            eyebrow: 'Tech Stack',
            title: 'Tools untuk interface cepat dan sistem yang andal.',
            description:
                'React, Tailwind, Vite, dan Laravel menjadi workflow utama tim untuk membangun produk digital modern.',
        },
        contactSection: {
            eyebrow: 'Kontak',
            title: 'Bangun, kolaborasi, atau tumbuh bersama F3N-Bytes.',
            description:
                'Hubungi tim untuk ide proyek, kolaborasi portofolio, partner belajar, atau peluang studio digital.',
        },
    },
    jp: {
        contact: '連絡',
        themeLabel: 'テーマ',
        languageLabel: '言語',
        light: 'ライト',
        dark: 'ダーク',
        eyebrow: '若いデジタル開発チーム',
        tagline: '情熱で作り、バイトで動かす。',
        mission: '共に成長し、より大きなものを作る。',
        exploreProjects: 'プロジェクトを見る',
        meetTeam: 'チームを見る',
        live: '公開中',
        demo: 'ライブデモ',
        source: 'GitHub',
        crafted: 'status: F3N-Bytes が制作',
        footerVision: '四つの頭脳。一つのビジョン。',
        about: {
            eyebrow: 'チーム概要',
            title: '一つの仕組みで成長する四つの視点。',
            description:
                'F3N-Bytes はプロジェクト制作、スキル向上、共同成長、そしてスタジオらしい規律を持つデジタル体験づくりに集中しています。',
            cards: [
                [
                    '個人の成長',
                    '各メンバーが見えるスキル、強い習慣、積み上がるポートフォリオを作ります。',
                ],
                [
                    'チームの成長',
                    'リリース、レビュー、実験、実課題の解決を通してチームで学びます。',
                ],
                [
                    'ビジョン & ミッション',
                    '実用的なデジタルプロダクトを作り、信頼される若い開発スタジオを目指します。',
                ],
            ],
        },
        team: {
            eyebrow: 'チーム紹介',
            title: '互いの強みを補い合うコンパクトなチーム。',
            description:
                'F3N は、F で始まる3人と N で始まる1人、Fahri、Fadlan、Farrel、Nathan を表しています。',
        },
        projects: {
            eyebrow: 'ポートフォリオ',
            title: '練習を実績に変えるプロジェクト。',
            description:
                '実験、学校制作、プロダクト案、ポートフォリオを通してチームを前へ進めるプロジェクト紹介です。',
        },
        stack: {
            eyebrow: '技術スタック',
            title: '速いUIと信頼できるシステムのためのツール。',
            description:
                'React、Tailwind、Vite、Laravel が、現代的なデジタルプロダクトを作るための中心的なワークフローです。',
        },
        contactSection: {
            eyebrow: '連絡',
            title: 'F3N-Bytes と作り、協力し、成長する。',
            description:
                'プロジェクト案、ポートフォリオ協力、学習パートナー、デジタルスタジオの機会についてご連絡ください。',
        },
    },
} satisfies Record<Language, Record<string, unknown>>;

const reveal = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0 },
};

function useScrollProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            const scrollable =
                document.documentElement.scrollHeight - window.innerHeight;
            setProgress(scrollable > 0 ? window.scrollY / scrollable : 0);
        };

        updateProgress();
        window.addEventListener('scroll', updateProgress, { passive: true });

        return () => window.removeEventListener('scroll', updateProgress);
    }, []);

    return progress;
}

function useLoadingSequence(lines: string[]) {
    const [isLoading, setIsLoading] = useState(true);
    const [lineIndex, setLineIndex] = useState(0);

    useEffect(() => {
        setLineIndex(0);

        const lineTimer = window.setInterval(() => {
            setLineIndex((current) => Math.min(current + 1, lines.length - 1));
        }, 650);

        const loadingTimer = window.setTimeout(() => setIsLoading(false), 2300);

        return () => {
            window.clearInterval(lineTimer);
            window.clearTimeout(loadingTimer);
        };
    }, [lines]);

    return { isLoading, lineIndex };
}

function useLanguage() {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        const storedLanguage = localStorage.getItem('site-language');

        if (
            storedLanguage === 'en' ||
            storedLanguage === 'id' ||
            storedLanguage === 'jp'
        ) {
            setLanguageState(storedLanguage);
            document.documentElement.lang = storedLanguage;
        }
    }, []);

    const setLanguage = (nextLanguage: Language): void => {
        setLanguageState(nextLanguage);
        localStorage.setItem('site-language', nextLanguage);
        document.documentElement.lang = nextLanguage;
    };

    return { language, setLanguage } as const;
}

function CursorGlow() {
    const cursorX = useMotionValue(-200);
    const cursorY = useMotionValue(-200);
    const springX = useSpring(cursorX, { damping: 28, stiffness: 180 });
    const springY = useSpring(cursorY, { damping: 28, stiffness: 180 });

    useEffect(() => {
        const moveCursor = (event: PointerEvent) => {
            cursorX.set(event.clientX - 160);
            cursorY.set(event.clientY - 160);
        };

        window.addEventListener('pointermove', moveCursor);

        return () => window.removeEventListener('pointermove', moveCursor);
    }, [cursorX, cursorY]);

    return (
        <motion.div
            aria-hidden="true"
            className="pointer-events-none fixed z-50 hidden size-80 bg-[radial-gradient(circle,rgba(59,130,246,0.18)_0%,rgba(239,68,68,0.10)_40%,transparent_70%)] blur-2xl lg:block"
            style={{ x: springX, y: springY }}
        />
    );
}

function LoadingScreen({
    isLoading,
    lineIndex,
    lines,
}: {
    isLoading: boolean;
    lineIndex: number;
    lines: string[];
}) {
    if (!isLoading) {
        return null;
    }

    return (
        <motion.div
            className="fixed inset-0 z-60 flex items-center justify-center bg-[#0b0f19]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
        >
            <div className="w-[min(90vw,420px)] border border-blue-400/30 bg-[#111827]/70 p-6 shadow-[0_0_60px_rgba(59,130,246,0.18)] backdrop-blur-xl">
                <div className="mb-5 flex items-center gap-3 text-sm text-blue-200">
                    <span className="size-2 animate-pulse bg-blue-400" />
                    boot.sequence
                </div>
                <div className="flex flex-col gap-3 font-mono text-sm text-slate-200">
                    {lines.map((line, index) => (
                        <motion.span
                            key={line}
                            className={
                                index <= lineIndex
                                    ? 'text-slate-100'
                                    : 'text-slate-600'
                            }
                            initial={{ opacity: 0, x: -8 }}
                            animate={{
                                opacity: index <= lineIndex ? 1 : 0.35,
                                x: 0,
                            }}
                        >
                            <span className="text-red-400">&gt;</span> {line}
                        </motion.span>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

function PreferenceControls({
    language,
    setLanguage,
}: {
    language: Language;
    setLanguage: (language: Language) => void;
}) {
    const { appearance, updateAppearance } = useAppearance();
    const themeOptions: {
        value: Appearance;
        label: string;
        icon: LucideIcon;
    }[] = [
        { value: 'light', label: copy[language].light, icon: Sun },
        { value: 'dark', label: copy[language].dark, icon: Moon },
    ];

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div
                aria-label={copy[language].themeLabel}
                className="inline-flex rounded-md border border-slate-300/70 bg-white/80 p-1 text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            >
                {themeOptions.map(({ value, label, icon: Icon }) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => updateAppearance(value)}
                        className={`inline-flex min-h-8 items-center gap-1.5 rounded px-2.5 text-xs font-semibold transition ${
                            appearance === value
                                ? 'bg-slate-950 text-white shadow-sm dark:bg-white dark:text-[#0b0f19]'
                                : 'hover:bg-slate-200/70 dark:hover:bg-white/10'
                        }`}
                    >
                        <Icon className="size-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            <div
                aria-label={copy[language].languageLabel}
                className="inline-flex rounded-md border border-slate-300/70 bg-white/80 p-1 text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            >
                <span className="flex min-h-8 items-center px-2 text-slate-500 dark:text-slate-400">
                    <Languages className="size-3.5" />
                </span>
                {languageOptions.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => setLanguage(option.value)}
                        className={`min-h-8 rounded px-2.5 text-xs font-semibold transition ${
                            language === option.value
                                ? 'bg-cyan-500 text-white shadow-sm'
                                : 'hover:bg-slate-200/70 dark:hover:bg-white/10'
                        }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function SectionHeading({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description: string;
}) {
    return (
        <motion.div
            className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center"
            variants={reveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
        >
            <span className="border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-200">
                {eyebrow}
            </span>
            <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
                {title}
            </h2>
            <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
                {description}
            </p>
        </motion.div>
    );
}

function GradientBorder({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`group relative overflow-hidden rounded-md bg-gradient-to-br from-blue-500/50 via-white/10 to-red-500/50 p-px ${className}`}
        >
            <div className="absolute inset-0 opacity-0 blur-xl transition duration-500 group-hover:opacity-70" />
            {children}
        </div>
    );
}

export default function Welcome() {
    const { language, setLanguage } = useLanguage();
    const text = copy[language];
    const progress = useScrollProgress();
    const currentLoadingLines = useMemo(
        () => loadingLines[language],
        [language],
    );
    const { isLoading, lineIndex } = useLoadingSequence(currentLoadingLines);
    const [menuOpen, setMenuOpen] = useState(false);
    const particles = useMemo(
        () =>
            Array.from({ length: 34 }, (_, index) => ({
                id: index,
                left: `${(index * 37) % 100}%`,
                top: `${(index * 19) % 100}%`,
                delay: (index % 8) * 0.25,
                duration: 5 + (index % 7),
            })),
        [],
    );

    return (
        <>
            <Head title="F3N-Bytes" />
            <LoadingScreen
                isLoading={isLoading}
                lineIndex={lineIndex}
                lines={currentLoadingLines}
            />
            <CursorGlow />

            <div
                className="fixed top-0 left-0 z-50 h-1 bg-gradient-to-r from-blue-500 via-sky-300 to-red-500"
                style={{ width: `${progress * 100}%` }}
            />

            <main className="min-h-screen scroll-smooth bg-[#f6fbff] font-sans text-slate-950 selection:bg-blue-500/20 dark:bg-[#0b0f19] dark:text-[#f9fafb] dark:selection:bg-blue-500/30">
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(14,165,233,0.18),transparent_36%,rgba(239,68,68,0.08)_68%,transparent)] dark:bg-[linear-gradient(120deg,rgba(59,130,246,0.16),transparent_36%,rgba(239,68,68,0.12)_68%,transparent)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-[size:72px_72px] dark:bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.18),transparent_42%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.18),transparent_42%)]" />
                    {particles.map((particle) => (
                        <motion.span
                            key={particle.id}
                            className="absolute size-1 bg-blue-300/50 shadow-[0_0_12px_rgba(59,130,246,0.7)]"
                            style={{ left: particle.left, top: particle.top }}
                            animate={{
                                y: [-12, 18, -12],
                                opacity: [0.25, 1, 0.25],
                            }}
                            transition={{
                                duration: particle.duration,
                                repeat: Infinity,
                                delay: particle.delay,
                                ease: 'easeInOut',
                            }}
                        />
                    ))}
                </div>

                <header className="fixed inset-x-0 top-4 z-40 px-4">
                    <nav className="mx-auto flex max-w-7xl items-center justify-between border border-slate-200/80 bg-white/75 px-4 py-3 shadow-[0_0_40px_rgba(14,165,233,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0f19]/70 dark:shadow-[0_0_40px_rgba(59,130,246,0.08)]">
                        <a href="#" className="flex items-center gap-3">
                            <span className="flex size-11 items-center justify-center rounded-md border border-cyan-300/30 bg-[#07101f] shadow-[0_0_24px_rgba(34,211,238,0.2)]">
                                <AppLogoIcon className="size-10" />
                            </span>
                            <span className="text-sm font-semibold text-slate-950 dark:text-white">
                                F3N-Bytes
                            </span>
                        </a>

                        <div className="hidden items-center gap-7 lg:flex">
                            {navItems.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className="text-sm text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                                >
                                    {item.label[language]}
                                </a>
                            ))}
                        </div>

                        <div className="hidden items-center gap-3 md:flex">
                            <PreferenceControls
                                language={language}
                                setLanguage={setLanguage}
                            />
                        </div>

                        <a
                            href="#contact"
                            className="hidden items-center gap-2 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-500/20 lg:flex dark:text-red-100"
                        >
                            {text.contact} <ArrowRight className="size-4" />
                        </a>

                        <button
                            type="button"
                            className="rounded-md border border-slate-300/80 p-2 text-slate-900 md:hidden dark:border-white/10 dark:text-white"
                            onClick={() => setMenuOpen((open) => !open)}
                            aria-label="Toggle navigation"
                        >
                            {menuOpen ? (
                                <X className="size-5" />
                            ) : (
                                <Menu className="size-5" />
                            )}
                        </button>
                    </nav>

                    {menuOpen && (
                        <motion.div
                            className="mx-auto mt-2 flex max-w-7xl flex-col gap-2 border border-slate-200/80 bg-white/95 p-3 backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-[#111827]/95"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {navItems.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {item.label[language]}
                                </a>
                            ))}
                            <div className="pt-2">
                                <PreferenceControls
                                    language={language}
                                    setLanguage={setLanguage}
                                />
                            </div>
                        </motion.div>
                    )}
                </header>

                <section className="relative flex min-h-screen items-center overflow-hidden px-4 pt-32 pb-20">
                    <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
                        <motion.div
                            className="flex flex-col gap-7"
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.8,
                                ease: 'easeOut',
                                delay: 0.15,
                            }}
                        >
                            <div className="flex w-fit items-center gap-2 border border-blue-400/30 bg-blue-400/10 px-3 py-2 text-sm text-blue-700 dark:text-blue-100">
                                <Sparkles className="size-4" />
                                {text.eyebrow}
                            </div>

                            <div className="flex flex-col gap-5">
                                <AppLogoIcon className="h-28 w-44 drop-shadow-[0_0_32px_rgba(34,211,238,0.32)] sm:h-32 sm:w-56" />
                                <h1 className="max-w-4xl text-5xl leading-none font-bold text-slate-950 sm:text-7xl lg:text-8xl dark:text-white">
                                    F3N-Bytes
                                </h1>
                                <p className="max-w-2xl text-xl leading-8 text-slate-700 sm:text-2xl dark:text-slate-200">
                                    {text.tagline}
                                </p>
                                <p className="max-w-2xl border-l-2 border-red-400 pl-5 text-lg font-medium text-red-700 dark:text-red-100">
                                    {text.mission}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <a
                                    href="#projects"
                                    className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-500 px-5 py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(59,130,246,0.35)] transition hover:bg-blue-400"
                                >
                                    {text.exploreProjects}{' '}
                                    <ArrowRight className="size-4" />
                                </a>
                                <a
                                    href="#team"
                                    className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300/80 bg-white/70 px-5 py-3 text-sm font-bold text-slate-950 backdrop-blur transition hover:border-red-300/60 hover:bg-red-500/10 dark:border-white/15 dark:bg-white/5 dark:text-white"
                                >
                                    {text.meetTeam}
                                </a>
                            </div>
                        </motion.div>

                        <motion.div
                            className="relative"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                duration: 0.9,
                                ease: 'easeOut',
                                delay: 0.3,
                            }}
                        >
                            <GradientBorder>
                                <div className="relative overflow-hidden rounded-md bg-white/85 p-5 shadow-2xl backdrop-blur-xl dark:bg-[#111827]/80">
                                    <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-white/10">
                                        <div className="flex gap-2">
                                            <span className="size-3 rounded-full bg-red-400" />
                                            <span className="size-3 rounded-full bg-blue-400" />
                                            <span className="size-3 rounded-full bg-slate-400" />
                                        </div>
                                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                                            team.kernel.ts
                                        </span>
                                    </div>
                                    <div className="grid gap-4 font-mono text-sm text-slate-700 dark:text-slate-200">
                                        <span>
                                            <span className="text-blue-300">
                                                const
                                            </span>{' '}
                                            team = ['Fahri', 'Fadlan', 'Farrel',
                                            'Nathan'];
                                        </span>
                                        <span>
                                            <span className="text-red-300">
                                                mission
                                            </span>
                                            .push('build digital experiences');
                                        </span>
                                        <span>
                                            growth.sync({'{'} passion: true,
                                            skills: 'daily' {'}'});
                                        </span>
                                        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                            {['F', 'F', 'F', 'N'].map(
                                                (letter, index) => (
                                                    <motion.div
                                                        key={`${letter}-${index}`}
                                                        className="flex aspect-square items-center justify-center rounded-md border border-slate-200 bg-white/70 text-3xl font-bold text-slate-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                                                        animate={{
                                                            y: [0, -8, 0],
                                                        }}
                                                        transition={{
                                                            duration: 3,
                                                            repeat: Infinity,
                                                            delay: index * 0.2,
                                                        }}
                                                    >
                                                        {letter}
                                                    </motion.div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </GradientBorder>
                        </motion.div>
                    </div>
                </section>

                <section id="about" className="relative px-4 py-24">
                    <div className="mx-auto flex max-w-7xl flex-col gap-12">
                        <SectionHeading
                            eyebrow={text.about.eyebrow}
                            title={text.about.title}
                            description={text.about.description}
                        />

                        <div className="grid gap-5 md:grid-cols-3">
                            {text.about.cards.map(
                                ([title, description], index) => (
                                    <motion.div
                                        key={title}
                                        className="rounded-md border border-slate-200/80 bg-white/75 p-6 backdrop-blur-xl transition hover:border-blue-300/60 hover:bg-white dark:border-white/10 dark:bg-white/[0.045] dark:hover:border-blue-300/40 dark:hover:bg-white/[0.07]"
                                        variants={reveal}
                                        initial="hidden"
                                        whileInView="visible"
                                        viewport={{
                                            once: true,
                                            margin: '-80px',
                                        }}
                                        transition={{
                                            duration: 0.6,
                                            delay: index * 0.08,
                                        }}
                                    >
                                        <h3 className="mb-3 text-xl font-semibold text-slate-950 dark:text-white">
                                            {title}
                                        </h3>
                                        <p className="leading-7 text-slate-600 dark:text-slate-300">
                                            {description}
                                        </p>
                                    </motion.div>
                                ),
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {targetItems[language].map((item, index) => (
                                <motion.div
                                    key={item}
                                    className="rounded-md border border-blue-400/20 bg-white/80 px-4 py-4 text-sm font-semibold text-slate-800 shadow-[0_0_24px_rgba(59,130,246,0.08)] backdrop-blur dark:bg-[#111827]/60 dark:text-slate-100"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        duration: 0.45,
                                        delay: index * 0.04,
                                    }}
                                >
                                    {item}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="team" className="relative px-4 py-24">
                    <div className="mx-auto flex max-w-7xl flex-col gap-12">
                        <SectionHeading
                            eyebrow={text.team.eyebrow}
                            title={text.team.title}
                            description={text.team.description}
                        />

                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                            {teamMembers.map((member, index) => {
                                return (
                                    <motion.article
                                        key={member.name}
                                        className="group rounded-md border border-slate-200/80 bg-white/75 p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-blue-300/60 hover:bg-white dark:border-white/10 dark:bg-white/[0.045] dark:hover:border-blue-300/40 dark:hover:bg-white/[0.07]"
                                        initial={{ opacity: 0, y: 28 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{
                                            once: true,
                                            margin: '-80px',
                                        }}
                                        transition={{
                                            duration: 0.55,
                                            delay: index * 0.08,
                                        }}
                                    >
                                        <div
                                            className={`mb-5 flex aspect-square items-center justify-center rounded-md bg-gradient-to-br ${member.accent} p-px`}
                                        >
                                            <img
                                                src={member.photo}
                                                alt={member.name}
                                                className="size-full rounded-md object-cover object-center"
                                                loading="lazy"
                                            />
                                        </div>
                                        <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
                                            {member.name}
                                        </h3>
                                        <p className="mt-1 text-sm font-medium text-blue-700 dark:text-blue-200">
                                            {member.role[language]}
                                        </p>
                                        <p className="mt-4 min-h-24 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                            {member.description[language]}
                                        </p>
                                        <div className="mt-5 flex flex-wrap gap-2">
                                            {member.skills.map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="rounded-md border border-slate-200 bg-white/70 px-3 py-1 text-xs text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="mt-5 flex items-center gap-3">
                                            <a
                                                href={member.portfolio}
                                                className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:text-slate-200 dark:hover:text-blue-200"
                                                aria-label={`${member.name} portfolio`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <ExternalLink className="size-4" />
                                            </a>
                                            <a
                                                href={member.github}
                                                className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:border-red-300 hover:text-red-700 dark:border-white/10 dark:text-slate-200 dark:hover:text-red-200"
                                                aria-label={`${member.name} GitHub`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <Github className="size-4" />
                                            </a>
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section id="projects" className="relative px-4 py-24">
                    <div className="mx-auto flex max-w-7xl flex-col gap-12">
                        <SectionHeading
                            eyebrow={text.projects.eyebrow}
                            title={text.projects.title}
                            description={text.projects.description}
                        />

                        <div className="grid gap-5 md:grid-cols-2">
                            {projects.map((project, index) => (
                                <motion.article
                                    key={project.title}
                                    className="group overflow-hidden rounded-md border border-slate-200/80 bg-white/80 backdrop-blur-xl transition hover:border-red-300/60 dark:border-white/10 dark:bg-[#111827]/70 dark:hover:border-red-300/40"
                                    initial={{ opacity: 0, y: 28 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-80px' }}
                                    transition={{
                                        duration: 0.55,
                                        delay: index * 0.08,
                                    }}
                                >
                                    <div className="relative aspect-video overflow-hidden bg-[#0b0f19]">
                                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.35),transparent_45%,rgba(239,68,68,0.28))]" />
                                        <div className="absolute inset-5 rounded-md border border-white/10 bg-black/30 p-4 font-mono text-xs text-slate-200 shadow-[inset_0_0_30px_rgba(59,130,246,0.08)]">
                                            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                                                <span>{project.signal}</span>
                                                <span className="text-blue-300">
                                                    {text.live}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <span className="text-red-300">
                                                    npm run build
                                                </span>
                                                <span>
                                                    deploy: preview-ready
                                                </span>
                                                <span className="text-blue-200">
                                                    {text.crafted}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-2xl font-semibold text-slate-950 dark:text-white">
                                            {project.title}
                                        </h3>
                                        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
                                            {project.description[language]}
                                        </p>
                                        <div className="mt-5 flex flex-wrap gap-2">
                                            {project.technologies.map(
                                                (tech) => (
                                                    <span
                                                        key={tech}
                                                        className="rounded-md border border-blue-300/30 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-300/20 dark:text-blue-100"
                                                    >
                                                        {tech}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                        <div className="mt-6 flex flex-wrap gap-3">
                                            <a
                                                href={`#demo-${project.title.toLowerCase().replaceAll(' ', '-')}`}
                                                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-[#0b0f19] dark:hover:bg-blue-100"
                                            >
                                                {text.demo}{' '}
                                                <ExternalLink className="size-4" />
                                            </a>
                                            <a
                                                href={`#source-${project.title.toLowerCase().replaceAll(' ', '-')}`}
                                                className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:border-red-300 hover:bg-red-500/10 dark:border-white/15 dark:text-white"
                                            >
                                                {text.source}{' '}
                                                <Github className="size-4" />
                                            </a>
                                        </div>
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="stack" className="relative px-4 py-24">
                    <div className="mx-auto flex max-w-7xl flex-col gap-12">
                        <SectionHeading
                            eyebrow={text.stack.eyebrow}
                            title={text.stack.title}
                            description={text.stack.description}
                        />

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                            {techStack.map((tech, index) => {
                                const Icon = tech.icon;

                                return (
                                    <motion.div
                                        key={tech.name}
                                        className="group flex min-h-36 flex-col items-center justify-center gap-4 rounded-md border border-slate-200/80 bg-white/75 p-5 text-center backdrop-blur transition hover:border-blue-300/60 hover:bg-blue-400/10 dark:border-white/10 dark:bg-white/[0.045] dark:hover:border-blue-300/40"
                                        animate={{ y: [0, -6, 0] }}
                                        transition={{
                                            duration: 3.5,
                                            repeat: Infinity,
                                            delay: index * 0.18,
                                            ease: 'easeInOut',
                                        }}
                                    >
                                        <Icon className="size-8 text-blue-600 transition group-hover:text-red-500 dark:text-blue-200 dark:group-hover:text-red-200" />
                                        <span className="text-sm font-semibold text-slate-950 dark:text-white">
                                            {tech.name}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="grid gap-4 md:grid-cols-4">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.label[language]}
                                    className="rounded-md border border-slate-200/80 bg-white/80 p-6 text-center backdrop-blur dark:border-white/10 dark:bg-[#111827]/70"
                                    initial={{ opacity: 0, y: 18 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        duration: 0.45,
                                        delay: index * 0.06,
                                    }}
                                >
                                    <motion.div
                                        className="text-4xl font-bold text-slate-950 dark:text-white"
                                        initial={{ scale: 0.85 }}
                                        whileInView={{ scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 180,
                                        }}
                                    >
                                        {stat.value}
                                    </motion.div>
                                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                        {stat.label[language]}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="contact" className="relative px-4 py-24">
                    <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                        <motion.div
                            className="flex flex-col justify-center gap-5"
                            variants={reveal}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.65 }}
                        >
                            <span className="w-fit border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-100">
                                {text.contactSection.eyebrow}
                            </span>
                            <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl dark:text-white">
                                {text.contactSection.title}
                            </h2>
                            <p className="leading-7 text-slate-600 dark:text-slate-300">
                                {text.contactSection.description}
                            </p>
                        </motion.div>

                        <GradientBorder>
                            <div className="grid gap-4 rounded-md bg-white/85 p-5 backdrop-blur-xl sm:grid-cols-2 dark:bg-[#111827]/85">
                                {contactItems.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <a
                                            key={item.label}
                                            href={`#${item.label.toLowerCase()}`}
                                            className="group rounded-md border border-slate-200 bg-white/70 p-5 transition hover:border-blue-300/60 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-blue-300/40 dark:hover:bg-white/[0.07]"
                                        >
                                            <Icon className="mb-5 size-7 text-blue-600 transition group-hover:text-red-500 dark:text-blue-200 dark:group-hover:text-red-200" />
                                            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                                                {item.label}
                                            </div>
                                            <div className="mt-1 text-base font-semibold break-words text-slate-950 dark:text-white">
                                                {item.value}
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        </GradientBorder>
                    </div>
                </section>

                <footer className="relative border-t border-slate-200 px-4 py-8 dark:border-white/10">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-sm text-slate-500 sm:flex-row dark:text-slate-400">
                        <span>F3N-Bytes © 2026</span>
                        <span className="text-slate-700 dark:text-slate-200">
                            {text.footerVision}
                        </span>
                    </div>
                </footer>
            </main>
        </>
    );
}
