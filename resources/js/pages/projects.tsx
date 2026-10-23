import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowUpRight,
    Bot,
    Code2,
    ExternalLink,
    Gamepad2,
    Github,
    GraduationCap,
    LayoutDashboard,
    Utensils,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';

const projects = [
    {
        title: 'OceanResto',
        category: 'Restaurant Platform',
        status: 'Preview Ready',
        description:
            'Restaurant ordering experience with polished menus, table flows, checkout structure, and business-ready presentation.',
        technologies: ['React', 'Tailwind', 'Laravel', 'MySQL'],
        highlights: ['Menu showcase', 'Table flow', 'Order-ready UI'],
        signal: 'RESTO_UI',
        accent: 'from-cyan-400 to-blue-500',
        icon: Utensils,
    },
    {
        title: 'UKK Project',
        category: 'School Competency',
        status: 'Completed',
        description:
            'Practical competency build with authentication, structured data flows, and a Laravel foundation made for assessment.',
        technologies: ['Laravel', 'PHP', 'MySQL', 'Blade'],
        highlights: ['Auth flow', 'CRUD modules', 'Assessment build'],
        signal: 'EXAM_BUILD',
        accent: 'from-red-400 to-rose-500',
        icon: GraduationCap,
    },
    {
        title: 'WhatsApp Bot',
        category: 'Automation',
        status: 'Prototype',
        description:
            'Message automation assistant for commands, replies, and lightweight operational workflows.',
        technologies: ['JavaScript', 'Node', 'API'],
        highlights: ['Command handler', 'Auto replies', 'Workflow helper'],
        signal: 'BOT_ONLINE',
        accent: 'from-emerald-400 to-cyan-500',
        icon: Bot,
    },
    {
        title: 'Portfolio Website',
        category: 'Personal Branding',
        status: 'Live Concept',
        description:
            'Developer portfolio experience with project highlights, identity, and focused storytelling.',
        technologies: ['React', 'Tailwind', 'Vite'],
        highlights: ['Project showcase', 'Personal identity', 'Responsive UI'],
        signal: 'BRAND_LIVE',
        accent: 'from-indigo-400 to-sky-500',
        icon: LayoutDashboard,
    },
];

const stats = [
    { value: '4', label: 'Published Projects' },
    { value: '12+', label: 'Project Modules' },
    { value: '8', label: 'Core Technologies' },
];

export default function Projects() {
    return (
        <>
            <Head title="All Projects" />

            <main className="min-h-screen bg-[#fffdf5] font-sans text-slate-950 selection:bg-blue-500/20 dark:bg-[#0d0a1f] dark:text-white dark:selection:bg-blue-500/30">
                <div className="pointer-events-none fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(14,165,233,0.16),transparent_34%,rgba(239,68,68,0.08)_70%,transparent)] dark:bg-[linear-gradient(120deg,rgba(59,130,246,0.14),transparent_34%,rgba(239,68,68,0.1)_70%,transparent)]" />
                    <div className="absolute -top-24 right-[10%] size-96 rounded-full bg-cyan-300/40 blur-3xl dark:bg-cyan-500/15" />
                    <div className="absolute top-[45%] -left-24 size-[26rem] rounded-full bg-red-300/30 blur-3xl dark:bg-red-500/10" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.055)_1px,transparent_1px)] bg-[size:72px_72px] dark:bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)]" />
                </div>

                <header className="relative z-10 px-4 pt-6">
                    <nav className="glass mx-auto flex max-w-7xl items-center justify-between px-4 py-3 dark:border dark:border-white/10 dark:bg-[#0b0f19]/70">
                        <Link
                            href={home()}
                            className="flex items-center gap-3"
                            prefetch
                        >
                            <span className="pixel-corners-sm flex size-11 items-center justify-center rounded-md border border-cyan-300/30 bg-[#07101f] shadow-[0_0_24px_rgba(34,211,238,0.2)]">
                                <AppLogoIcon className="size-10" />
                            </span>
                            <span className="font-pixel text-[11px]">
                                F3N-Bytes
                            </span>
                        </Link>

                        <div className="flex items-center gap-2">
                            <a
                                href="/game"
                                className="pixel-btn hidden items-center justify-center gap-2 rounded-md bg-cyan-400 px-4 py-2 text-sm font-bold text-[#06202a] sm:inline-flex"
                            >
                                <Gamepad2 className="size-4" />
                                Game
                            </a>
                            <Link
                                href={home()}
                                className="pixel-btn inline-flex items-center justify-center gap-2 rounded-md bg-white/80 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-red-500/10 dark:border dark:border-white/15 dark:bg-white/5 dark:text-white"
                                prefetch
                            >
                                <ArrowLeft className="size-4" />
                                Home
                            </Link>
                        </div>
                    </nav>
                </header>

                <section className="relative z-10 px-4 pt-20 pb-12">
                    <div className="mx-auto flex max-w-7xl flex-col gap-10">
                        <div className="max-w-3xl">
                            <span className="pixel-corners-sm inline-flex bg-blue-500/15 px-4 py-2 text-xs font-semibold text-blue-800 dark:border dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-100">
                                Project Archive
                            </span>
                            <h1 className="mt-5 text-4xl leading-tight font-bold text-slate-950 sm:text-6xl dark:text-white">
                                All projects from the F3N-Bytes build log.
                            </h1>
                            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                                A focused archive of experiments, school builds,
                                automation tools, and portfolio work shipped by
                                the team.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            {stats.map((stat) => (
                                <div
                                    key={stat.label}
                                    className="glass rounded-md p-5 dark:border dark:border-white/10 dark:bg-white/[0.045]"
                                >
                                    <div className="font-pixel text-2xl text-slate-950 dark:text-white">
                                        {stat.value}
                                    </div>
                                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="relative z-10 px-4 pb-24">
                    <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
                        {projects.map((project) => {
                            const Icon = project.icon;

                            return (
                                <article
                                    key={project.title}
                                    className="glass glass-lift group overflow-hidden rounded-md dark:border dark:border-white/10 dark:bg-[#111827]/70 dark:hover:border-blue-300/40"
                                >
                                    <div
                                        className={`relative min-h-48 overflow-hidden bg-gradient-to-br ${project.accent} p-5`}
                                    >
                                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.28),transparent_44%,rgba(15,23,42,0.28))]" />
                                        <div className="relative flex h-full min-h-38 flex-col justify-between rounded-md border border-white/20 bg-black/25 p-4 text-white shadow-[inset_0_0_30px_rgba(255,255,255,0.08)]">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="font-mono text-xs">
                                                    {project.signal}
                                                </span>
                                                <Icon className="size-7" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-white/75">
                                                    {project.category}
                                                </div>
                                                <h2 className="mt-1 text-3xl font-bold">
                                                    {project.title}
                                                </h2>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <span className="pixel-corners-sm rounded-md bg-blue-500/15 px-3 py-1.5 text-xs font-semibold text-blue-800 dark:border dark:border-blue-300/20 dark:text-blue-100">
                                                {project.status}
                                            </span>
                                            <Code2 className="size-5 text-slate-400" />
                                        </div>

                                        <p className="mt-5 leading-7 text-slate-600 dark:text-slate-300">
                                            {project.description}
                                        </p>

                                        <div className="mt-5 flex flex-wrap gap-2">
                                            {project.technologies.map(
                                                (tech) => (
                                                    <span
                                                        key={tech}
                                                        className="pixel-corners-sm rounded-md bg-slate-900/[0.06] px-3 py-1.5 text-xs text-slate-700 dark:border dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                                                    >
                                                        {tech}
                                                    </span>
                                                ),
                                            )}
                                        </div>

                                        <div className="mt-6 grid gap-2">
                                            {project.highlights.map(
                                                (highlight) => (
                                                    <div
                                                        key={highlight}
                                                        className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
                                                    >
                                                        <ArrowUpRight className="size-4 text-blue-600 dark:text-blue-200" />
                                                        {highlight}
                                                    </div>
                                                ),
                                            )}
                                        </div>

                                        <div className="mt-6 flex flex-wrap gap-3">
                                            <a
                                                href={`#demo-${project.title.toLowerCase().replaceAll(' ', '-')}`}
                                                className="pixel-btn inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-[#0b0f19] dark:hover:bg-blue-100"
                                            >
                                                Live Demo
                                                <ExternalLink className="size-4" />
                                            </a>
                                            <a
                                                href={`#source-${project.title.toLowerCase().replaceAll(' ', '-')}`}
                                                className="pixel-btn inline-flex items-center gap-2 rounded-md bg-white/80 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-red-500/10 dark:border dark:border-white/15 dark:bg-transparent dark:text-white"
                                            >
                                                GitHub
                                                <Github className="size-4" />
                                            </a>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>
            </main>
        </>
    );
}
