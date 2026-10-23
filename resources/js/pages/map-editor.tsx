import { Head } from '@inertiajs/react';
import {
    Download,
    Eraser,
    Grid3x3,
    Hand,
    Maximize2,
    PaintBucket,
    Pencil,
    Pipette,
    Redo2,
    Square,
    Undo2,
    Upload,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const TILE = 16;
const TILESET_COLS = 8;
const TILESET_TILES = 16;
const TILESET_SRC = '/game-assets/airlangga_tileset.png';
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 16;
const STORAGE_KEY = 'f3n-map-editor';

type Tool = 'brush' | 'eraser' | 'rect' | 'fill' | 'picker';

interface MapDoc {
    width: number;
    height: number;
    data: Uint16Array;
}

interface TilesetMeta {
    name: string;
    image: string;
    imagewidth: number;
    imageheight: number;
    tilewidth: number;
    tileheight: number;
    columns: number;
    tilecount: number;
    firstgid: number;
}

const TILESET_META: TilesetMeta = {
    name: 'airlangga_tileset',
    image: 'airlangga_tileset.png',
    imagewidth: TILESET_COLS * TILE,
    imageheight: (TILESET_TILES / TILESET_COLS) * TILE,
    tilewidth: TILE,
    tileheight: TILE,
    columns: TILESET_COLS,
    tilecount: TILESET_TILES,
    firstgid: 1,
};

function blank(width: number, height: number): MapDoc {
    return { width, height, data: new Uint16Array(width * height) };
}

function resizeDoc(doc: MapDoc, width: number, height: number): MapDoc {
    const next = blank(width, height);
    const w = Math.min(doc.width, width);
    const h = Math.min(doc.height, height);

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            next.data[y * width + x] = doc.data[y * doc.width + x] ?? 0;
        }
    }

    return next;
}

/** Average color of each tile in the tileset, for a fast minimap. */
function tileColors(img: HTMLImageElement): string[] {
    const cv = document.createElement('canvas');
    cv.width = img.naturalWidth;
    cv.height = img.naturalHeight;
    const ctx = cv.getContext('2d');

    if (!ctx) {
        return [];
    }

    ctx.drawImage(img, 0, 0);
    const out: string[] = [];

    for (let i = 0; i < TILESET_TILES; i++) {
        const sx = (i % TILESET_COLS) * TILE;
        const sy = Math.floor(i / TILESET_COLS) * TILE;
        const px = ctx.getImageData(sx, sy, TILE, TILE).data;
        let r = 0;
        let g = 0;
        let b = 0;
        const n = TILE * TILE;

        for (let p = 0; p < n; p++) {
            r += px[p * 4];
            g += px[p * 4 + 1];
            b += px[p * 4 + 2];
        }

        out.push(
            `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`,
        );
    }

    return out;
}

export default function MapEditor() {
    const [tool, setTool] = useState<Tool>('brush');
    const [selected, setSelected] = useState(1);
    const [zoom, setZoom] = useState(2);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [width, setWidth] = useState(20);
    const [height, setHeight] = useState(12);
    const [version, setVersion] = useState(0);
    const [cursor, setCursor] = useState({ x: 0, y: 0 });
    const [status, setStatus] = useState('');
    const [hoverPreview, setHoverPreview] = useState<{
        x: number;
        y: number;
        w: number;
        h: number;
    } | null>(null);
    const [showGrid, setShowGrid] = useState(true);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const mapCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const colorsRef = useRef<string[]>([]);
    const docRef = useRef<MapDoc>(blank(20, 12));
    const undoRef = useRef<Uint16Array[]>([]);
    const redoRef = useRef<Uint16Array[]>([]);
    const paintingRef = useRef(false);
    const panningRef = useRef(false);
    const panStartRef = useRef({ x: 0, y: 0, px: 0, py: 0 });
    const rectStartRef = useRef<{ x: number; y: number } | null>(null);
    const [imageReady, setImageReady] = useState(false);

    const bump = useCallback(() => setVersion((v) => v + 1), []);

    // Load tileset image once.
    useEffect(() => {
        const img = new Image();
        img.src = TILESET_SRC;
        img.onload = () => {
            imgRef.current = img;
            colorsRef.current = tileColors(img);
            setImageReady(true);
        };
    }, []);

    // Restore from localStorage.
    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return;
        }

        try {
            const parsed = JSON.parse(raw) as {
                width: number;
                height: number;
                data: number[];
            };
            docRef.current = {
                width: parsed.width,
                height: parsed.height,
                data: Uint16Array.from(parsed.data),
            };
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setWidth(parsed.width);
            setHeight(parsed.height);
            bump();
        } catch {
            // ignore corrupt storage
        }
    }, [bump]);

    const pushUndo = useCallback(() => {
        undoRef.current.push(new Uint16Array(docRef.current.data));

        if (undoRef.current.length > 60) {
            undoRef.current.shift();
        }

        redoRef.current = [];
    }, []);

    const undo = useCallback(() => {
        const prev = undoRef.current.pop();

        if (!prev) {
            return;
        }

        redoRef.current.push(new Uint16Array(docRef.current.data));
        docRef.current.data = prev;
        bump();
    }, [bump]);

    const redo = useCallback(() => {
        const next = redoRef.current.pop();

        if (!next) {
            return;
        }

        undoRef.current.push(new Uint16Array(docRef.current.data));
        docRef.current.data = next;
        bump();
    }, [bump]);

    const setTile = useCallback((x: number, y: number, value: number) => {
        const doc = docRef.current;

        if (x < 0 || y < 0 || x >= doc.width || y >= doc.height) {
            return false;
        }

        const i = y * doc.width + x;

        if (doc.data[i] === value) {
            return false;
        }

        doc.data[i] = value;

        return true;
    }, []);

    const floodFill = useCallback((x: number, y: number, value: number) => {
        const doc = docRef.current;

        if (x < 0 || y < 0 || x >= doc.width || y >= doc.height) {
            return;
        }

        const target = doc.data[y * doc.width + x];

        if (target === value) {
            return;
        }

        const stack: [number, number][] = [[x, y]];

        while (stack.length > 0) {
            const [cx, cy] = stack.pop() as [number, number];

            if (
                cx < 0 ||
                cy < 0 ||
                cx >= doc.width ||
                cy >= doc.height ||
                doc.data[cy * doc.width + cx] !== target
            ) {
                continue;
            }

            doc.data[cy * doc.width + cx] = value;
            stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }
    }, []);

    const commit = useCallback(() => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                width: docRef.current.width,
                height: docRef.current.height,
                data: Array.from(docRef.current.data),
            }),
        );
        setStatus('Tersimpan ke browser');
        window.setTimeout(() => setStatus(''), 1200);
    }, []);

    // --- coordinate helpers -------------------------------------------------
    const screenToTile = useCallback(
        (clientX: number, clientY: number): { x: number; y: number } => {
            const canvas = canvasRef.current;

            if (!canvas) {
                return { x: 0, y: 0 };
            }

            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((clientX - rect.left - pan.x) / (TILE * zoom));
            const y = Math.floor((clientY - rect.top - pan.y) / (TILE * zoom));

            return { x, y };
        },
        [pan.x, pan.y, zoom],
    );

    const applyTool = useCallback(
        (x: number, y: number) => {
            if (tool === 'brush') {
                return setTile(x, y, selected);
            }

            if (tool === 'eraser') {
                return setTile(x, y, 0);
            }

            if (tool === 'fill') {
                floodFill(x, y, selected);

                return true;
            }

            return false;
        },
        [floodFill, selected, setTile, tool],
    );

    // --- canvas drawing -----------------------------------------------------
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const wrap = wrapRef.current;
        const img = imgRef.current;

        if (!canvas || !wrap) {
            return;
        }

        const dpr = window.devicePixelRatio || 1;
        const cw = wrap.clientWidth;
        const ch = wrap.clientHeight;
        canvas.width = Math.floor(cw * dpr);
        canvas.height = Math.floor(ch * dpr);
        canvas.style.width = `${cw}px`;
        canvas.style.height = `${ch}px`;

        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return;
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#050914';
        ctx.fillRect(0, 0, cw, ch);

        const doc = docRef.current;
        const size = TILE * zoom;
        const startX = Math.max(0, Math.floor(-pan.x / size));
        const startY = Math.max(0, Math.floor(-pan.y / size));
        const endX = Math.min(doc.width, Math.ceil((cw - pan.x) / size));
        const endY = Math.min(doc.height, Math.ceil((ch - pan.y) / size));

        // map bounds
        ctx.fillStyle = '#0b1226';
        ctx.fillRect(pan.x, pan.y, doc.width * size, doc.height * size);

        if (img) {
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    const v = doc.data[y * doc.width + x];

                    if (!v) {
                        continue;
                    }

                    const idx = v - 1;
                    const sx = (idx % TILESET_COLS) * TILE;
                    const sy = Math.floor(idx / TILESET_COLS) * TILE;
                    ctx.drawImage(
                        img,
                        sx,
                        sy,
                        TILE,
                        TILE,
                        pan.x + x * size,
                        pan.y + y * size,
                        size,
                        size,
                    );
                }
            }
        }

        if (showGrid && size >= 8) {
            ctx.strokeStyle = 'rgba(148,163,184,0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();

            for (let x = startX; x <= endX; x++) {
                ctx.moveTo(pan.x + x * size, pan.y + startY * size);
                ctx.lineTo(pan.x + x * size, pan.y + endY * size);
            }

            for (let y = startY; y <= endY; y++) {
                ctx.moveTo(pan.x + startX * size, pan.y + y * size);
                ctx.lineTo(pan.x + endX * size, pan.y + y * size);
            }

            ctx.stroke();
        }

        // cursor / rect preview
        if (hoverPreview) {
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                pan.x + hoverPreview.x * size,
                pan.y + hoverPreview.y * size,
                hoverPreview.w * size,
                hoverPreview.h * size,
            );
        } else if (cursor.x >= 0 && cursor.y >= 0) {
            ctx.strokeStyle = 'rgba(34,211,238,0.9)';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                pan.x + cursor.x * size,
                pan.y + cursor.y * size,
                size,
                size,
            );
        }

        // 1px border on full map
        ctx.strokeStyle = 'rgba(34,211,238,0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(pan.x, pan.y, doc.width * size, doc.height * size);
    }, [cursor.x, cursor.y, hoverPreview, pan.x, pan.y, showGrid, zoom]);

    // minimap
    const drawMinimap = useCallback(() => {
        const canvas = mapCanvasRef.current;
        const colors = colorsRef.current;
        const doc = docRef.current;

        if (!canvas || colors.length === 0) {
            return;
        }

        const ctx = canvas.getContext('2d');

        if (!ctx) {
            return;
        }

        canvas.width = doc.width;
        canvas.height = doc.height;
        ctx.clearRect(0, 0, doc.width, doc.height);

        for (let y = 0; y < doc.height; y++) {
            for (let x = 0; x < doc.width; x++) {
                const v = doc.data[y * doc.width + x];

                if (!v) {
                    ctx.fillStyle = '#0b1226';
                } else {
                    ctx.fillStyle = colors[v - 1] ?? '#334155';
                }

                ctx.fillRect(x, y, 1, 1);
            }
        }
    }, []);

    useEffect(() => {
        draw();
    }, [draw, version, imageReady]);

    useEffect(() => {
        drawMinimap();
    }, [drawMinimap, version, imageReady]);

    useEffect(() => {
        const onResize = () => draw();
        window.addEventListener('resize', onResize);

        return () => window.removeEventListener('resize', onResize);
    }, [draw]);

    // keyboard shortcuts
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const mod = e.ctrlKey || e.metaKey;

            if (mod && e.key.toLowerCase() === 'z') {
                e.preventDefault();

                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }

            if (mod && e.key.toLowerCase() === 's') {
                e.preventDefault();
                commit();
            }

            if (e.key === 'b') {
                setTool('brush');
            }

            if (e.key === 'e') {
                setTool('eraser');
            }

            if (e.key === 'g') {
                setTool('fill');
            }

            if (e.key === 'i') {
                setTool('picker');
            }

            if (e.key === 'r') {
                setTool('rect');
            }
        };

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [commit, redo, undo]);

    // --- pointer handlers ----------------------------------------------------
    const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const isPan = e.button === 1 || e.shiftKey;

        if (isPan) {
            panningRef.current = true;
            panStartRef.current = {
                x: e.clientX,
                y: e.clientY,
                px: pan.x,
                py: pan.y,
            };
            (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);

            return;
        }

        const { x, y } = screenToTile(e.clientX, e.clientY);

        if (tool === 'picker') {
            const v = docRef.current.data[y * docRef.current.width + x];

            if (v) {
                setSelected(v);
            }

            setTool('brush');

            return;
        }

        if (tool === 'rect') {
            rectStartRef.current = { x, y };
            setHoverPreview({ x, y, w: 1, h: 1 });
            (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);

            return;
        }

        pushUndo();
        paintingRef.current = true;
        applyTool(x, y);
        bump();
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (panningRef.current) {
            setPan({
                x: panStartRef.current.px + (e.clientX - panStartRef.current.x),
                y: panStartRef.current.py + (e.clientY - panStartRef.current.y),
            });

            return;
        }

        const { x, y } = screenToTile(e.clientX, e.clientY);
        setCursor({ x, y });

        if (rectStartRef.current) {
            const sx = Math.min(rectStartRef.current.x, x);
            const sy = Math.min(rectStartRef.current.y, y);
            const ex = Math.max(rectStartRef.current.x, x);
            const ey = Math.max(rectStartRef.current.y, y);
            setHoverPreview({ x: sx, y: sy, w: ex - sx + 1, h: ey - sy + 1 });

            return;
        }

        if (paintingRef.current && (tool === 'brush' || tool === 'eraser')) {
            applyTool(x, y);
            bump();
        }
    };

    const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        panningRef.current = false;

        if (rectStartRef.current && hoverPreview) {
            pushUndo();
            const doc = docRef.current;

            for (
                let y = hoverPreview.y;
                y < hoverPreview.y + hoverPreview.h;
                y++
            ) {
                for (
                    let x = hoverPreview.x;
                    x < hoverPreview.x + hoverPreview.w;
                    x++
                ) {
                    if (x >= 0 && y >= 0 && x < doc.width && y < doc.height) {
                        doc.data[y * doc.width + x] = selected;
                    }
                }
            }

            rectStartRef.current = null;
            setHoverPreview(null);
            bump();
            commit();
        }

        paintingRef.current = false;
        (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    };

    const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.25 : 0.8;
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor));
        const k = next / zoom;

        // keep the tile under the cursor anchored
        setPan({
            x: mx - (mx - pan.x) * k,
            y: my - (my - pan.y) * k,
        });
        setZoom(next);
    };

    // --- file actions --------------------------------------------------------
    const exportJson = useCallback(() => {
        const doc = docRef.current;
        const map = {
            compressionlevel: -1,
            height: doc.height,
            infinite: false,
            layers: [
                {
                    data: Array.from(doc.data),
                    height: doc.height,
                    id: 1,
                    name: 'ground',
                    opacity: 1,
                    type: 'tilelayer',
                    visible: true,
                    width: doc.width,
                    x: 0,
                    y: 0,
                },
            ],
            nextlayerid: 2,
            nextobjectid: 1,
            orientation: 'orthogonal',
            renderorder: 'right-down',
            tiledversion: '1.10.2',
            tileheight: TILE,
            tilesets: [TILESET_META],
            tilewidth: TILE,
            type: 'map',
            version: '1.10',
            width: doc.width,
        };
        const blob = new Blob([JSON.stringify(map, null, 2)], {
            type: 'application/json',
        });
        downloadBlob(blob, 'airlangga_map.json');
    }, []);

    const exportPng = useCallback(() => {
        const doc = docRef.current;
        const img = imgRef.current;

        if (!img) {
            return;
        }

        const cv = document.createElement('canvas');
        cv.width = doc.width * TILE;
        cv.height = doc.height * TILE;
        const ctx = cv.getContext('2d');

        if (!ctx) {
            return;
        }

        ctx.imageSmoothingEnabled = false;

        for (let y = 0; y < doc.height; y++) {
            for (let x = 0; x < doc.width; x++) {
                const v = doc.data[y * doc.width + x];

                if (!v) {
                    continue;
                }

                const idx = v - 1;
                const sx = (idx % TILESET_COLS) * TILE;
                const sy = Math.floor(idx / TILESET_COLS) * TILE;
                ctx.drawImage(
                    img,
                    sx,
                    sy,
                    TILE,
                    TILE,
                    x * TILE,
                    y * TILE,
                    TILE,
                    TILE,
                );
            }
        }

        cv.toBlob((blob) => {
            if (blob) {
                downloadBlob(blob, 'airlangga_map.png');
            }
        });
    }, []);

    const importJson = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];

            if (!file) {
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const map = JSON.parse(String(reader.result)) as {
                        width: number;
                        height: number;
                        layers: { data: number[] }[];
                    };
                    const data = Uint16Array.from(map.layers[0]?.data ?? []);
                    pushUndo();
                    docRef.current = {
                        width: map.width,
                        height: map.height,
                        data,
                    };
                    setWidth(map.width);
                    setHeight(map.height);
                    bump();
                    commit();
                    setStatus('Map diimpor');
                } catch {
                    setStatus('Gagal membaca JSON');
                }
            };
            reader.readAsText(file);
        },
        [bump, commit, pushUndo],
    );

    const applyResize = useCallback(() => {
        pushUndo();
        docRef.current = resizeDoc(docRef.current, width, height);
        bump();
        commit();
    }, [bump, commit, height, pushUndo, width]);

    const clearMap = useCallback(() => {
        pushUndo();
        docRef.current = blank(docRef.current.width, docRef.current.height);
        bump();
        commit();
    }, [bump, commit, pushUndo]);

    const palette = useMemo(
        () =>
            Array.from({ length: TILESET_TILES }, (_, i) => ({
                index: i + 1,
                col: i % TILESET_COLS,
                row: Math.floor(i / TILESET_COLS),
            })),
        [],
    );

    const tools: {
        id: Tool;
        label: string;
        icon: React.ReactNode;
        key: string;
    }[] = [
        {
            id: 'brush',
            label: 'Brush',
            icon: <Pencil className="size-4" />,
            key: 'B',
        },
        {
            id: 'eraser',
            label: 'Eraser',
            icon: <Eraser className="size-4" />,
            key: 'E',
        },
        {
            id: 'rect',
            label: 'Rect',
            icon: <Square className="size-4" />,
            key: 'R',
        },
        {
            id: 'fill',
            label: 'Fill',
            icon: <PaintBucket className="size-4" />,
            key: 'G',
        },
        {
            id: 'picker',
            label: 'Picker',
            icon: <Pipette className="size-4" />,
            key: 'I',
        },
    ];

    return (
        <>
            <Head title="Map Editor — F3N Bytes" />
            <main className="flex h-screen flex-col overflow-hidden bg-[#070b16] font-sans text-slate-100">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-950/80 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Grid3x3 className="size-5 text-cyan-300" />
                        <span className="font-pixel text-xs tracking-wider text-cyan-200">
                            MAP EDITOR
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                            {width}×{height} tile · {zoom.toFixed(1)}x
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={undo}
                            className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-xs hover:bg-white/10"
                        >
                            <Undo2 className="size-3.5" /> Undo
                        </button>
                        <button
                            type="button"
                            onClick={redo}
                            className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-xs hover:bg-white/10"
                        >
                            <Redo2 className="size-3.5" /> Redo
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowGrid((v) => !v)}
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs ${
                                showGrid
                                    ? 'border-cyan-300/50 bg-cyan-400/10 text-cyan-200'
                                    : 'border-white/15 bg-white/5 hover:bg-white/10'
                            }`}
                        >
                            Grid
                        </button>
                        <button
                            type="button"
                            onClick={commit}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2 py-1.5 text-xs text-emerald-200 hover:bg-emerald-400/20"
                        >
                            Simpan
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1 text-xs text-slate-300">
                            W
                            <input
                                type="number"
                                min={1}
                                max={512}
                                value={width}
                                onChange={(e) =>
                                    setWidth(Number(e.target.value))
                                }
                                className="w-16 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs"
                            />
                        </label>
                        <label className="inline-flex items-center gap-1 text-xs text-slate-300">
                            H
                            <input
                                type="number"
                                min={1}
                                max={512}
                                value={height}
                                onChange={(e) =>
                                    setHeight(Number(e.target.value))
                                }
                                className="w-16 rounded border border-white/15 bg-white/5 px-2 py-1 text-xs"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={applyResize}
                            className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-xs hover:bg-white/10"
                        >
                            <Maximize2 className="size-3.5" /> Resize
                        </button>
                        <button
                            type="button"
                            onClick={clearMap}
                            className="rounded-md border border-red-400/30 bg-red-500/10 px-2 py-1.5 text-xs text-red-200 hover:bg-red-500/20"
                        >
                            Kosongkan
                        </button>
                        <button
                            type="button"
                            onClick={exportJson}
                            className="inline-flex items-center gap-1 rounded-md border border-cyan-400/40 bg-cyan-400/10 px-2 py-1.5 text-xs text-cyan-200 hover:bg-cyan-400/20"
                        >
                            <Download className="size-3.5" /> JSON
                        </button>
                        <button
                            type="button"
                            onClick={exportPng}
                            className="inline-flex items-center gap-1 rounded-md border border-cyan-400/40 bg-cyan-400/10 px-2 py-1.5 text-xs text-cyan-200 hover:bg-cyan-400/20"
                        >
                            <Download className="size-3.5" /> PNG
                        </button>
                        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-xs hover:bg-white/10">
                            <Upload className="size-3.5" /> Import
                            <input
                                type="file"
                                accept="application/json"
                                className="hidden"
                                onChange={importJson}
                            />
                        </label>
                    </div>
                </header>

                <div className="flex min-h-0 flex-1">
                    {/* Palette */}
                    <aside className="flex w-56 shrink-0 flex-col gap-3 border-r border-white/10 bg-slate-950/60 p-3">
                        <div className="font-pixel text-[10px] tracking-wider text-cyan-300">
                            TILE PALETTE
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                            {palette.map((t) => (
                                <button
                                    key={t.index}
                                    type="button"
                                    onClick={() => {
                                        setSelected(t.index);
                                        setTool('brush');
                                    }}
                                    aria-label={`Tile ${t.index}`}
                                    className={`size-11 rounded border-2 transition ${
                                        selected === t.index
                                            ? 'border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                                            : 'border-white/15 hover:border-white/40'
                                    }`}
                                    style={{
                                        backgroundImage: `url(${TILESET_SRC})`,
                                        backgroundSize: `${TILESET_COLS * 44}px ${
                                            (TILESET_TILES / TILESET_COLS) * 44
                                        }px`,
                                        backgroundPosition: `-${t.col * 44}px -${
                                            t.row * 44
                                        }px`,
                                        imageRendering: 'pixelated',
                                    }}
                                />
                            ))}
                        </div>

                        <div className="mt-2 font-pixel text-[10px] tracking-wider text-cyan-300">
                            TOOLS
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {tools.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setTool(t.id)}
                                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-2 text-xs ${
                                        tool === t.id
                                            ? 'border-cyan-300/60 bg-cyan-400/10 text-cyan-100'
                                            : 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                                    }`}
                                >
                                    {t.icon} {t.label}
                                    <span className="ml-auto font-mono text-[9px] text-slate-400">
                                        {t.key}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-auto rounded-lg border border-white/10 bg-white/5 p-2 text-[11px] leading-5 text-slate-300">
                            <div className="flex items-center gap-1 text-slate-200">
                                <Hand className="size-3.5" /> Shift+drag = geser
                            </div>
                            <div>Scroll = zoom</div>
                            <div>Klik kanan = hapus</div>
                            <div>Ctrl+Z / Ctrl+Shift+Z</div>
                            <div>Ctrl+S simpan</div>
                        </div>
                    </aside>

                    {/* Canvas */}
                    <div
                        ref={wrapRef}
                        className="relative min-h-0 flex-1 overflow-hidden"
                    >
                        <canvas
                            ref={canvasRef}
                            role="img"
                            aria-label="Area edit map"
                            className="absolute inset-0 touch-none"
                            onPointerDown={onPointerDown}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                            onPointerLeave={() => {
                                paintingRef.current = false;
                                setCursor({ x: -1, y: -1 });
                            }}
                            onWheel={onWheel}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                const { x, y } = screenToTile(
                                    e.clientX,
                                    e.clientY,
                                );
                                pushUndo();
                                setTile(x, y, 0);
                                bump();
                            }}
                        />

                        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-white/10 bg-black/60 px-2 py-1 font-mono text-[10px] text-cyan-200">
                            {cursor.x >= 0
                                ? `(${cursor.x}, ${cursor.y})`
                                : 'geser map'}
                        </div>

                        {status && (
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-md border border-cyan-300/30 bg-cyan-500/15 px-3 py-1 font-mono text-[11px] text-cyan-100">
                                {status}
                            </div>
                        )}

                        {/* Minimap */}
                        <div className="absolute top-3 right-3 rounded-lg border border-cyan-300/25 bg-slate-950/85 p-2 shadow-lg backdrop-blur-md">
                            <div className="mb-1 flex items-center justify-between gap-4 font-mono text-[9px] text-slate-400">
                                <span>MINIMAP</span>
                                <span>
                                    {width}×{height}
                                </span>
                            </div>
                            <canvas
                                ref={mapCanvasRef}
                                className="block h-32 w-48 [image-rendering:pixelated]"
                                style={{
                                    imageRendering: 'pixelated',
                                }}
                                onClick={(e) => {
                                    const rect =
                                        e.currentTarget.getBoundingClientRect();
                                    const fx =
                                        (e.clientX - rect.left) / rect.width;
                                    const fy =
                                        (e.clientY - rect.top) / rect.height;
                                    const tx = fx * width;
                                    const ty = fy * height;
                                    setPan({
                                        x: -tx * TILE * zoom + 200,
                                        y: -ty * TILE * zoom + 150,
                                    });
                                }}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

function downloadBlob(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}
