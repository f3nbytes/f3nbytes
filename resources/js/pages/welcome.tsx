import { Head } from '@inertiajs/react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import {
    ArrowRight,
    Code2,
    Database,
    ExternalLink,
    Github,
    Instagram,
    Mail,
    Menu,
    MessageCircle,
    Network,
    Palette,
    ServerCog,
    Sparkles,
    X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

const navItems = [
    { label: 'About', href: '#about' },
    { label: 'Team', href: '#team' },
    { label: 'Projects', href: '#projects' },
    { label: 'Stack', href: '#stack' },
    { label: 'Contact', href: '#contact' },
];

const loadingLines = [
    'Initializing F3N-Bytes...',
    'Loading developers...',
    'System ready.',
];

const targetItems = [
    'Income',
    'CV',
    'Portfolio',
    'Personal Branding',
    'Skills Development',
    'Networking',
    'Achievement',
    'Asset / Investment',
];

const teamMembers = [
    {
        name: 'Fahri',
        role: 'Frontend Developer & UI Designer',
        skills: ['React', 'Tailwind', 'UI/UX'],
        description:
            'Turns ideas into clean interfaces with crisp interactions, strong visual hierarchy, and product-minded detail.',
        accent: 'from-blue-500 to-cyan-300',
        icon: Palette,
    },
    {
        name: 'Nathan',
        role: 'Backend Developer',
        skills: ['Laravel', 'API', 'Database'],
        description:
            'Builds reliable systems, API foundations, and database flows that keep projects fast and scalable.',
        accent: 'from-red-500 to-rose-300',
        icon: ServerCog,
    },
    {
        name: 'Farrel',
        role: 'Fullstack Developer',
        skills: ['React', 'Laravel', 'MySQL'],
        description:
            'Connects frontend polish with backend structure so each product feels complete from screen to server.',
        accent: 'from-sky-400 to-red-400',
        icon: Code2,
    },
    {
        name: 'Fadlan',
        role: 'UI/UX & System Analyst',
        skills: ['Design System', 'Flow', 'UI Concept'],
        description:
            'Maps user flows, structures systems, and shapes concepts into experiences the team can build together.',
        accent: 'from-indigo-400 to-blue-500',
        icon: Network,
    },
];

const projects = [
    {
        title: 'OceanResto',
        description:
            'Restaurant ordering experience with polished menus, table flows, and business-ready presentation.',
        technologies: ['React', 'Tailwind', 'Laravel'],
        signal: 'RESTO_UI',
    },
    {
        title: 'UKK Project',
        description:
            'School competency project built with practical architecture, authentication, and structured data flows.',
        technologies: ['Laravel', 'MySQL', 'PHP'],
        signal: 'EXAM_BUILD',
    },
    {
        title: 'WhatsApp Bot',
        description:
            'Automation assistant for messages, commands, and lightweight operational workflows.',
        technologies: ['JavaScript', 'API', 'Node'],
        signal: 'BOT_ONLINE',
    },
    {
        title: 'Portfolio Website',
        description:
            'Personal branding site with project highlights, identity, and focused storytelling for developers.',
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
    { value: '12+', label: 'Projects Completed' },
    { value: '4', label: 'Team Members' },
    { value: '6+', label: 'Technologies' },
    { value: '720+', label: 'Hours of Coding' },
];

const contactItems = [
    { label: 'Discord', value: 'F3N-Bytes Studio', icon: MessageCircle },
    { label: 'GitHub', value: 'github.com/f3n-bytes', icon: Github },
    { label: 'Instagram', value: '@f3nbytes', icon: Instagram },
    { label: 'Email', value: 'hello@f3nbytes.dev', icon: Mail },
];

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

function useLoadingSequence() {
    const [isLoading, setIsLoading] = useState(true);
    const [lineIndex, setLineIndex] = useState(0);

    useEffect(() => {
        const lineTimer = window.setInterval(() => {
            setLineIndex((current) =>
                Math.min(current + 1, loadingLines.length - 1),
            );
        }, 650);

        const loadingTimer = window.setTimeout(() => setIsLoading(false), 2300);

        return () => {
            window.clearInterval(lineTimer);
            window.clearTimeout(loadingTimer);
        };
    }, []);

    return { isLoading, lineIndex };
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
}: {
    isLoading: boolean;
    lineIndex: number;
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
                    {loadingLines.map((line, index) => (
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
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                {title}
            </h2>
            <p className="text-base leading-7 text-slate-300">{description}</p>
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
    const progress = useScrollProgress();
    const { isLoading, lineIndex } = useLoadingSequence();
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
            <LoadingScreen isLoading={isLoading} lineIndex={lineIndex} />
            <CursorGlow />

            <div
                className="fixed top-0 left-0 z-50 h-1 bg-gradient-to-r from-blue-500 via-sky-300 to-red-500"
                style={{ width: `${progress * 100}%` }}
            />

            <main className="min-h-screen scroll-smooth bg-[#0b0f19] font-sans text-[#f9fafb] selection:bg-blue-500/30">
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(59,130,246,0.16),transparent_36%,rgba(239,68,68,0.12)_68%,transparent)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.18),transparent_42%)]" />
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
                    <nav className="mx-auto flex max-w-7xl items-center justify-between border border-white/10 bg-[#0b0f19]/70 px-4 py-3 shadow-[0_0_40px_rgba(59,130,246,0.08)] backdrop-blur-xl">
                        <a href="#" className="flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-md border border-blue-400/40 bg-blue-400/10 text-sm font-bold text-blue-100">
                                F3N
                            </span>
                            <span className="text-sm font-semibold text-white">
                                F3N-Bytes
                            </span>
                        </a>

                        <div className="hidden items-center gap-7 md:flex">
                            {navItems.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className="text-sm text-slate-300 transition hover:text-white"
                                >
                                    {item.label}
                                </a>
                            ))}
                        </div>

                        <a
                            href="#contact"
                            className="hidden items-center gap-2 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:border-red-300 hover:bg-red-500/20 md:flex"
                        >
                            Contact <ArrowRight className="size-4" />
                        </a>

                        <button
                            type="button"
                            className="rounded-md border border-white/10 p-2 text-white md:hidden"
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
                            className="mx-auto mt-2 flex max-w-7xl flex-col gap-2 border border-white/10 bg-[#111827]/95 p-3 backdrop-blur-xl md:hidden"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {navItems.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className="rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {item.label}
                                </a>
                            ))}
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
                            <div className="flex w-fit items-center gap-2 border border-blue-400/30 bg-blue-400/10 px-3 py-2 text-sm text-blue-100">
                                <Sparkles className="size-4" />
                                Young digital developer team
                            </div>

                            <div className="flex flex-col gap-5">
                                <h1 className="max-w-4xl text-5xl leading-none font-bold text-white sm:text-7xl lg:text-8xl">
                                    F3N-Bytes
                                </h1>
                                <p className="max-w-2xl text-xl leading-8 text-slate-200 sm:text-2xl">
                                    Built by passion, powered by bytes.
                                </p>
                                <p className="max-w-2xl border-l-2 border-red-400 pl-5 text-lg font-medium text-red-100">
                                    Grow together, build something bigger.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <a
                                    href="#projects"
                                    className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-500 px-5 py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(59,130,246,0.35)] transition hover:bg-blue-400"
                                >
                                    Explore Projects{' '}
                                    <ArrowRight className="size-4" />
                                </a>
                                <a
                                    href="#team"
                                    className="inline-flex items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:border-red-300/60 hover:bg-red-500/10"
                                >
                                    Meet The Team
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
                                <div className="relative overflow-hidden rounded-md bg-[#111827]/80 p-5 shadow-2xl backdrop-blur-xl">
                                    <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                                        <div className="flex gap-2">
                                            <span className="size-3 rounded-full bg-red-400" />
                                            <span className="size-3 rounded-full bg-blue-400" />
                                            <span className="size-3 rounded-full bg-slate-400" />
                                        </div>
                                        <span className="font-mono text-xs text-slate-400">
                                            team.kernel.ts
                                        </span>
                                    </div>
                                    <div className="grid gap-4 font-mono text-sm text-slate-200">
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
                                                        className="flex aspect-square items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-3xl font-bold text-white"
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
                            eyebrow="About The Team"
                            title="Four minds growing through one shared system."
                            description="F3N-Bytes is focused on building projects, improving skills, growing together, and creating digital experiences with startup energy and studio discipline."
                        />

                        <div className="grid gap-5 md:grid-cols-3">
                            {[
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
                            ].map(([title, description], index) => (
                                <motion.div
                                    key={title}
                                    className="rounded-md border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl transition hover:border-blue-300/40 hover:bg-white/[0.07]"
                                    variants={reveal}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: '-80px' }}
                                    transition={{
                                        duration: 0.6,
                                        delay: index * 0.08,
                                    }}
                                >
                                    <h3 className="mb-3 text-xl font-semibold text-white">
                                        {title}
                                    </h3>
                                    <p className="leading-7 text-slate-300">
                                        {description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {targetItems.map((item, index) => (
                                <motion.div
                                    key={item}
                                    className="rounded-md border border-blue-400/20 bg-[#111827]/60 px-4 py-4 text-sm font-semibold text-slate-100 shadow-[0_0_24px_rgba(59,130,246,0.06)] backdrop-blur"
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
                            eyebrow="Team Showcase"
                            title="A compact squad with complementary strengths."
                            description="F3N stands for three members with F and one member with N: Fahri, Fadlan, Farrel, and Nathan."
                        />

                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                            {teamMembers.map((member, index) => {
                                const Icon = member.icon;

                                return (
                                    <motion.article
                                        key={member.name}
                                        className="group rounded-md border border-white/10 bg-white/[0.045] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-blue-300/40 hover:bg-white/[0.07]"
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
                                            <div className="flex size-full flex-col items-center justify-center rounded-md bg-[#0b0f19]/80">
                                                <Icon className="mb-3 size-8 text-white" />
                                                <span className="text-4xl font-bold text-white">
                                                    {member.name.charAt(0)}
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-semibold text-white">
                                            {member.name}
                                        </h3>
                                        <p className="mt-1 text-sm font-medium text-blue-200">
                                            {member.role}
                                        </p>
                                        <p className="mt-4 min-h-24 text-sm leading-6 text-slate-300">
                                            {member.description}
                                        </p>
                                        <div className="mt-5 flex flex-wrap gap-2">
                                            {member.skills.map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="mt-5 flex items-center gap-3">
                                            <a
                                                href={`#portfolio-${member.name.toLowerCase()}`}
                                                className="inline-flex size-9 items-center justify-center rounded-md border border-white/10 text-slate-200 transition hover:border-blue-300 hover:text-blue-200"
                                                aria-label={`${member.name} portfolio`}
                                            >
                                                <ExternalLink className="size-4" />
                                            </a>
                                            <a
                                                href={`#github-${member.name.toLowerCase()}`}
                                                className="inline-flex size-9 items-center justify-center rounded-md border border-white/10 text-slate-200 transition hover:border-red-300 hover:text-red-200"
                                                aria-label={`${member.name} GitHub`}
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
                            eyebrow="Portfolio"
                            title="Projects that turn practice into proof."
                            description="A project showcase for experiments, school builds, product ideas, and portfolio work that keeps the team moving forward."
                        />

                        <div className="grid gap-5 md:grid-cols-2">
                            {projects.map((project, index) => (
                                <motion.article
                                    key={project.title}
                                    className="group overflow-hidden rounded-md border border-white/10 bg-[#111827]/70 backdrop-blur-xl transition hover:border-red-300/40"
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
                                                    LIVE
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
                                                    status: crafted by F3N-Bytes
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-2xl font-semibold text-white">
                                            {project.title}
                                        </h3>
                                        <p className="mt-3 leading-7 text-slate-300">
                                            {project.description}
                                        </p>
                                        <div className="mt-5 flex flex-wrap gap-2">
                                            {project.technologies.map(
                                                (tech) => (
                                                    <span
                                                        key={tech}
                                                        className="rounded-md border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-100"
                                                    >
                                                        {tech}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                        <div className="mt-6 flex flex-wrap gap-3">
                                            <a
                                                href={`#demo-${project.title.toLowerCase().replaceAll(' ', '-')}`}
                                                className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-bold text-[#0b0f19] transition hover:bg-blue-100"
                                            >
                                                Live Demo{' '}
                                                <ExternalLink className="size-4" />
                                            </a>
                                            <a
                                                href={`#source-${project.title.toLowerCase().replaceAll(' ', '-')}`}
                                                className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-2 text-sm font-bold text-white transition hover:border-red-300 hover:bg-red-500/10"
                                            >
                                                GitHub{' '}
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
                            eyebrow="Tech Stack"
                            title="Tools for fast interfaces and reliable systems."
                            description="React, Tailwind, Vite, and Laravel form the team's core workflow for building modern digital products."
                        />

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                            {techStack.map((tech, index) => {
                                const Icon = tech.icon;

                                return (
                                    <motion.div
                                        key={tech.name}
                                        className="group flex min-h-36 flex-col items-center justify-center gap-4 rounded-md border border-white/10 bg-white/[0.045] p-5 text-center backdrop-blur transition hover:border-blue-300/40 hover:bg-blue-400/10"
                                        animate={{ y: [0, -6, 0] }}
                                        transition={{
                                            duration: 3.5,
                                            repeat: Infinity,
                                            delay: index * 0.18,
                                            ease: 'easeInOut',
                                        }}
                                    >
                                        <Icon className="size-8 text-blue-200 transition group-hover:text-red-200" />
                                        <span className="text-sm font-semibold text-white">
                                            {tech.name}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="grid gap-4 md:grid-cols-4">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    className="rounded-md border border-white/10 bg-[#111827]/70 p-6 text-center backdrop-blur"
                                    initial={{ opacity: 0, y: 18 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        duration: 0.45,
                                        delay: index * 0.06,
                                    }}
                                >
                                    <motion.div
                                        className="text-4xl font-bold text-white"
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
                                    <div className="mt-2 text-sm text-slate-300">
                                        {stat.label}
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
                            <span className="w-fit border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-100">
                                Contact
                            </span>
                            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
                                Build, collaborate, or grow with F3N-Bytes.
                            </h2>
                            <p className="leading-7 text-slate-300">
                                Reach the team for project ideas, portfolio
                                collaboration, learning partnerships, or digital
                                studio opportunities.
                            </p>
                        </motion.div>

                        <GradientBorder>
                            <div className="grid gap-4 rounded-md bg-[#111827]/85 p-5 backdrop-blur-xl sm:grid-cols-2">
                                {contactItems.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <a
                                            key={item.label}
                                            href={`#${item.label.toLowerCase()}`}
                                            className="group rounded-md border border-white/10 bg-white/[0.04] p-5 transition hover:border-blue-300/40 hover:bg-white/[0.07]"
                                        >
                                            <Icon className="mb-5 size-7 text-blue-200 transition group-hover:text-red-200" />
                                            <div className="text-sm font-semibold text-slate-400">
                                                {item.label}
                                            </div>
                                            <div className="mt-1 text-base font-semibold break-words text-white">
                                                {item.value}
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        </GradientBorder>
                    </div>
                </section>

                <footer className="relative border-t border-white/10 px-4 py-8">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-sm text-slate-400 sm:flex-row">
                        <span>F3N-Bytes © 2026</span>
                        <span className="text-slate-200">
                            Four minds. One vision.
                        </span>
                    </div>
                </footer>
            </main>
        </>
    );
}
