"""SMK TI Airlangga Samarinda — pixel tilemap (top-down).

Generates:
  airlangga_tileset.png   (16x16 tiles, 8 columns)
  airlangga_map.png       (20x12 tiles = 320x192, 1x master)
  airlangga_map@4x.png    (display scale)
  airlangga_map.json      (Phaser-compatible tilemap JSON)
  preview_tileset.png / preview_map.png
"""

import json
import os
import sys

sys.path.insert(
    0,
    "/home/imfa/.config/opencode/skills/pixel-art-studio/scripts",
)

from pixelstudio import Sprite, PALETTES  # noqa: E402

TILE = 16
COLS = 8
MAP_W = 20
MAP_H = 12

# --- palette -----------------------------------------------------------------
P = {
    "grass_d": "#2f6b3a",
    "grass_m": "#3f8a4a",
    "grass_l": "#58a85e",
    "path_d": "#a8976f",
    "path_m": "#c9b98f",
    "path_l": "#e0d3ab",
    "wall_d": "#c2b8a3",
    "wall_m": "#e8e0cf",
    "brick": "#b45309",
    "roof_d": "#7f2f27",
    "roof_m": "#a8433a",
    "roof_l": "#c25a4a",
    "win": "#7dd3fc",
    "win_d": "#38bdf8",
    "frame": "#0f172a",
    "wood": "#7c4a21",
    "wood_d": "#5f3d1d",
    "leaf_d": "#1f5c33",
    "leaf_m": "#2f8a4a",
    "leaf_l": "#43a85e",
    "trunk": "#6b4a2b",
    "stone": "#94a3b8",
    "stone_d": "#64748b",
    "flag_r": "#ef4444",
    "flag_w": "#f8fafc",
    "pole": "#cbd5e1",
    "shadow": "#1b2430",
}

PALETTE = list(P.values())


def fill(s, ox, oy, x0, y0, x1, y1, c):
    s.rect(ox + x0, oy + y0, ox + x1, oy + y1, c)


def draw_tile(s, ox, oy, kind):
    """Draw one 16x16 tile with its top-left at (ox, oy)."""
    if kind == "grass":
        fill(s, ox, oy, 0, 0, 15, 15, P["grass_m"])
        # subtle clusters (keep center quieter than edges)
        fill(s, ox, oy, 3, 4, 4, 4, P["grass_l"])
        fill(s, ox, oy, 11, 10, 12, 10, P["grass_d"])
        fill(s, ox, oy, 7, 12, 8, 12, P["grass_l"])
    elif kind == "grass2":
        fill(s, ox, oy, 0, 0, 15, 15, P["grass_m"])
        fill(s, ox, oy, 2, 2, 2, 3, P["grass_l"])
        fill(s, ox, oy, 13, 6, 13, 7, P["grass_d"])
        fill(s, ox, oy, 5, 13, 5, 13, P["grass_l"])
        # flower
        fill(s, ox, oy, 10, 3, 10, 3, "#fde68a")
        fill(s, ox, oy, 9, 4, 11, 4, "#fde68a")
        fill(s, ox, oy, 10, 5, 10, 5, "#fde68a")
    elif kind == "path":
        fill(s, ox, oy, 0, 0, 15, 15, P["path_m"])
        fill(s, ox, oy, 1, 1, 14, 1, P["path_l"])
        fill(s, ox, oy, 0, 14, 15, 15, P["path_d"])
        fill(s, ox, oy, 5, 7, 9, 7, P["path_d"])
        fill(s, ox, oy, 11, 3, 12, 3, P["path_d"])
    elif kind == "path2":
        fill(s, ox, oy, 0, 0, 15, 15, P["path_m"])
        fill(s, ox, oy, 1, 1, 14, 1, P["path_l"])
        fill(s, ox, oy, 0, 14, 15, 15, P["path_d"])
        fill(s, ox, oy, 2, 5, 3, 5, P["path_d"])
        fill(s, ox, oy, 12, 11, 14, 11, P["path_d"])
    elif kind == "wall":
        fill(s, ox, oy, 0, 0, 15, 15, P["wall_m"])
        # bricks
        for by in (2, 7, 12):
            fill(s, ox, oy, 0, by, 15, by, P["wall_d"])
        fill(s, ox, oy, 4, 2, 4, 6, P["wall_d"])
        fill(s, ox, oy, 11, 3, 11, 6, P["wall_d"])
        fill(s, ox, oy, 7, 8, 7, 11, P["wall_d"])
        fill(s, ox, oy, 2, 8, 2, 11, P["wall_d"])
        fill(s, ox, oy, 0, 0, 15, 1, P["brick"])
    elif kind == "window":
        fill(s, ox, oy, 0, 0, 15, 15, P["wall_m"])
        fill(s, ox, oy, 0, 0, 15, 1, P["brick"])
        fill(s, ox, oy, 2, 4, 13, 13, P["frame"])
        fill(s, ox, oy, 3, 5, 12, 12, P["win"])
        fill(s, ox, oy, 3, 5, 12, 6, P["win_d"])
        fill(s, ox, oy, 7, 4, 8, 13, P["frame"])
        fill(s, ox, oy, 3, 8, 12, 9, P["frame"])
        fill(s, ox, oy, 3, 5, 4, 6, "#e0f2fe")
    elif kind == "door":
        fill(s, ox, oy, 0, 0, 15, 15, P["wall_m"])
        fill(s, ox, oy, 0, 0, 15, 1, P["brick"])
        fill(s, ox, oy, 3, 3, 12, 15, P["wood_d"])
        fill(s, ox, oy, 4, 4, 11, 14, P["wood"])
        fill(s, ox, oy, 6, 4, 9, 14, P["wood_d"])
        fill(s, ox, oy, 10, 8, 10, 9, "#fde68a")
        fill(s, ox, oy, 3, 3, 12, 4, "#3b2413")
    elif kind == "roof":
        fill(s, ox, oy, 0, 0, 15, 15, P["roof_m"])
        fill(s, ox, oy, 0, 0, 15, 3, P["roof_l"])
        fill(s, ox, oy, 0, 12, 15, 15, P["roof_d"])
        for x in (3, 8, 13):
            fill(s, ox, oy, x, 0, x, 15, P["roof_d"])
        fill(s, ox, oy, 0, 4, 2, 4, P["roof_l"])
    elif kind == "tree":
        fill(s, ox, oy, 0, 0, 15, 15, P["grass_m"])
        fill(s, ox, oy, 6, 10, 9, 15, P["trunk"])
        fill(s, ox, oy, 5, 11, 10, 12, P["wood_d"])
        # canopy
        fill(s, ox, oy, 3, 1, 12, 10, P["leaf_m"])
        fill(s, ox, oy, 1, 3, 14, 8, P["leaf_m"])
        fill(s, ox, oy, 4, 0, 11, 6, P["leaf_l"])
        fill(s, ox, oy, 2, 2, 5, 4, P["leaf_l"])
        fill(s, ox, oy, 6, 8, 13, 10, P["leaf_d"])
        fill(s, ox, oy, 9, 4, 12, 7, P["leaf_d"])
    elif kind == "bush":
        fill(s, ox, oy, 0, 0, 15, 15, P["grass_m"])
        fill(s, ox, oy, 3, 7, 12, 13, P["leaf_m"])
        fill(s, ox, oy, 5, 5, 10, 10, P["leaf_l"])
        fill(s, ox, oy, 9, 10, 12, 13, P["leaf_d"])
    elif kind == "bench":
        fill(s, ox, oy, 0, 0, 15, 15, P["grass_m"])
        fill(s, ox, oy, 2, 5, 13, 8, P["wood"])
        fill(s, ox, oy, 2, 5, 13, 5, P["wood_d"])
        fill(s, ox, oy, 3, 9, 4, 12, P["wood_d"])
        fill(s, ox, oy, 11, 9, 12, 12, P["wood_d"])
    elif kind == "fence":
        fill(s, ox, oy, 0, 0, 15, 15, P["grass_m"])
        fill(s, ox, oy, 0, 5, 15, 6, P["wood"])
        fill(s, ox, oy, 0, 10, 15, 11, P["wood"])
        for x in (2, 8, 13):
            fill(s, ox, oy, x, 2, x + 1, 14, P["wood_d"])
            fill(s, ox, oy, x, 2, x, 3, P["wood"])
    elif kind == "flag":
        fill(s, ox, oy, 0, 0, 15, 15, P["grass_m"])
        fill(s, ox, oy, 7, 2, 8, 15, P["pole"])
        fill(s, ox, oy, 9, 2, 14, 5, P["flag_r"])
        fill(s, ox, oy, 9, 2, 12, 2, P["flag_w"])
        fill(s, ox, oy, 9, 5, 12, 5, P["flag_w"])
        fill(s, ox, oy, 5, 14, 10, 15, P["stone_d"])
    elif kind == "path_v":
        fill(s, ox, oy, 0, 0, 15, 15, P["path_m"])
        fill(s, ox, oy, 1, 0, 1, 15, P["path_l"])
        fill(s, ox, oy, 14, 0, 15, 15, P["path_d"])
        fill(s, ox, oy, 7, 3, 8, 4, P["path_d"])
        fill(s, ox, oy, 7, 10, 8, 11, P["path_d"])
    elif kind == "stone":
        fill(s, ox, oy, 0, 0, 15, 15, P["grass_m"])
        fill(s, ox, oy, 3, 8, 12, 14, P["stone_d"])
        fill(s, ox, oy, 4, 7, 11, 13, P["stone"])
        fill(s, ox, oy, 4, 7, 7, 8, "#cbd5e1")
    elif kind == "shadow_t":
        fill(s, ox, oy, 0, 0, 15, 15, P["shadow"])


TILE_ORDER = [
    "grass",
    "grass2",
    "path",
    "path2",
    "wall",
    "window",
    "door",
    "roof",
    "tree",
    "bush",
    "bench",
    "fence",
    "flag",
    "path_v",
    "stone",
    "shadow_t",
]

TILE_INDEX = {name: i + 1 for i, name in enumerate(TILE_ORDER)}

# --- map layout --------------------------------------------------------------
# F=fence  R=roof  W=window  D=door  P=path  V=path_v  G=grass  g=grass2
# T=tree   B=bush   b=bench  S=stone  X=flag  .=grass (implicit)
LAYOUT = [
    "FFFFFFFFFFFFFFFFFFFF",
    "FGGGGGGGGGGGGGGGGGGF",
    "FGGRRRRRRRRRRRRRRGGGF",
    "FGGWWWWWDWWWWWWGGGFG",
    "FGGGGGGGGGGGGGGGGGGF",
    "FPPPPPPPPPPPPPPPPPPF",
    "FGGTGGGGGGGGGGGTGGGF",
    "FGGGGGBBGGGGGGGGGGGF",
    "FGGGGGGGGGGGGbGGGGGF",
    "FPPPPPPPPPPPPPPPPPPF",
    "FGGGGXGGGGGTTGGGGGGF",
    "FFFFFFFFFFFFFFFFFFFF",
]

CHARMAP = {
    "F": "fence",
    "R": "roof",
    "W": "window",
    "D": "door",
    "P": "path",
    "V": "path_v",
    "G": "grass",
    "g": "grass2",
    "T": "tree",
    "B": "bush",
    "b": "bench",
    "S": "stone",
    "X": "flag",
}


def build_tileset(path):
    rows = (len(TILE_ORDER) + COLS - 1) // COLS
    t = Sprite(COLS * TILE, rows * TILE, palette=PALETTE)
    for i, name in enumerate(TILE_ORDER):
        ox = (i % COLS) * TILE
        oy = (i // COLS) * TILE
        draw_tile(t, ox, oy, name)
    t.save_png(path, scale=1)
    t.preview("preview_tileset.png", scale=6)
    return {
        "name": "airlangga_tileset",
        "image": os.path.basename(path),
        "imagewidth": COLS * TILE,
        "imageheight": rows * TILE,
        "tilewidth": TILE,
        "tileheight": TILE,
        "columns": COLS,
        "tilecount": len(TILE_ORDER),
        "firstgid": 1,
    }


def build_map(tileset_meta, png_path, json_path):
    m = Sprite(MAP_W * TILE, MAP_H * TILE, palette=PALETTE)
    data = []
    for row in LAYOUT:
        # pad row to MAP_W
        row = (row + "G" * MAP_W)[:MAP_W]
        for ch in row:
            name = CHARMAP.get(ch, "grass")
            data.append(TILE_INDEX[name])
        for x, ch in enumerate(row):
            name = CHARMAP.get(ch, "grass")
            draw_tile(m, x * TILE, (len(data) // MAP_W - 1) * TILE, name)
    m.save_png(png_path, scale=1)
    m.save_png(png_path.replace(".png", "@4x.png"), scale=4)
    m.preview("preview_map.png", scale=4, grid=False)

    tilemap = {
        "compressionlevel": -1,
        "height": MAP_H,
        "infinite": False,
        "layers": [
            {
                "data": data,
                "height": MAP_H,
                "id": 1,
                "name": "ground",
                "opacity": 1,
                "type": "tilelayer",
                "visible": True,
                "width": MAP_W,
                "x": 0,
                "y": 0,
            }
        ],
        "nextlayerid": 2,
        "nextobjectid": 1,
        "orientation": "orthogonal",
        "renderorder": "right-down",
        "tiledversion": "1.10.2",
        "tileheight": TILE,
        "tilesets": [tileset_meta],
        "tilewidth": TILE,
        "type": "map",
        "version": "1.10",
        "width": MAP_W,
    }
    with open(json_path, "w") as fh:
        json.dump(tilemap, fh, indent=2)
    return data


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    os.chdir(here)
    meta = build_tileset("airlangga_tileset.png")
    build_map(meta, "airlangga_map.png", "airlangga_map.json")

    # stats + validation
    ts = Sprite.from_png("airlangga_tileset.png")
    ts.stats()
    print("tiles:", len(TILE_ORDER), "map:", MAP_W, "x", MAP_H)
