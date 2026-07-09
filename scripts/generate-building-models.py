"""
Old Town — Blender building model generator.

Procedurally models every unique building archetype (22) from
docs/world/starter-buildings-visual-spec.md as stylized low-poly meshes,
bakes per-region vertex colours, and exports each as a compressed binary
.glb into assets/buildings/models/, plus a manifest.json.

Run headless:

    /Applications/Blender.app/Contents/MacOS/Blender --background --python \
        scripts/generate-building-models.py -- [archetype ...] [--previews DIR]

Modelling convention (Blender space, Z-up — VERIFIED against the weapon
pipeline's export settings and a loaded weapon):
  - Ground contact at z=0; the model extends +Z.
  - Origin at the center of the tile footprint. 1 tile = 1.0 unit.
  - The door/front faces +Y in Blender. export_yup=True maps Blender
    (x, y, z) -> glTF (x, z, -y), so the front faces -Z in Three.js (south).
  - Walls inset 0.05 from the footprint edge so tile collision matches visuals.

Vertex colours are baked per palette region as a "Color" point attribute
(exports as COLOR_0). Buildings have no runtime tier tint; colours are final.

Budgets (asserted, build fails when exceeded):
  prop <= 400 tris, house <= 900 tris, landmark <= 2000 tris.
"""

import math
import os
import random
import sys

import bpy

# --------------------------------------------------------------------------- #
# Palette — docs/world/starter-buildings-visual-spec.md. Do not add colours
# here without adding them to the doc first.
# --------------------------------------------------------------------------- #
def _hex(h):
    return (int(h[0:2], 16) / 255.0, int(h[2:4], 16) / 255.0, int(h[4:6], 16) / 255.0, 1.0)


STONE = _hex("8A8578")        # stone_wall
STONE_DARK = _hex("6E6A5E")   # stone_dark
CHALK = _hex("D9D2C0")        # chalk_wash
TIMBER = _hex("7A5A3A")       # timber_frame
TIMBER_DARK = _hex("5A4028")  # timber_dark
WATTLE = _hex("C9BFA4")       # wattle_infill
THATCH = _hex("A08448")       # roof_thatch
SLATE = _hex("5C6470")        # roof_slate
CLAY = _hex("96604A")         # roof_clay
IRON = _hex("4A4E55")         # metal_iron
BRONZE = _hex("8C6B3F")       # metal_bronze
SOOT = _hex("3A3733")         # soot_black
CANVAS = _hex("C7B98F")       # canvas_awning
MOSS = _hex("6F7D4A")         # accent_moss
EMBER = _hex("D97A3A")        # glow_ember
LOAM = _hex("5D4A33")         # garden soil (spec §garden_plot)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "buildings", "models")

BUDGETS = {"prop": 400, "house": 900, "landmark": 2000}


# --------------------------------------------------------------------------- #
# Primitive + paint helpers (same mechanisms as generate-weapon-models.py)
# --------------------------------------------------------------------------- #
def _paint(obj, rgba):
    mesh = obj.data
    while mesh.color_attributes:
        mesh.color_attributes.remove(mesh.color_attributes[0])
    attr = mesh.color_attributes.new(name="Color", type="FLOAT_COLOR", domain="POINT")
    cols = []
    for _ in attr.data:
        cols.extend(rgba)
    attr.data.foreach_set("color", cols)
    attr.data.update()


def _jitter(obj, amount, seed):
    rng = random.Random(seed)
    for v in obj.data.vertices:
        v.co.x += (rng.random() - 0.5) * amount
        v.co.y += (rng.random() - 0.5) * amount
        v.co.z += (rng.random() - 0.5) * amount


def box(w, d, h, x=0.0, y=0.0, z=0.0, color=STONE, jitter=0.0, seed=1, rot=(0, 0, 0)):
    """Axis-aligned box, BASE at z (not center), centered on (x, y)."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.scale = (w, d, h)
    obj.rotation_euler = rot
    obj.location = (x, y, z + h / 2)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    _paint(obj, color)
    if jitter:
        _jitter(obj, jitter, seed)
    return obj


def _top_verts(obj):
    zmax = max(v.co.z for v in obj.data.vertices)
    return [v for v in obj.data.vertices if abs(v.co.z - zmax) < 1e-4]


def gable(w, d, h, x=0.0, y=0.0, z=0.0, ridge="y", color=THATCH, overhang=0.15, jitter=0.0, seed=1):
    """Triangular-prism roof, base at z, ridge along `ridge` axis through (x, y)."""
    obj = box(w + overhang * 2, d + overhang * 2, h, x, y, z, color, jitter=jitter, seed=seed)
    for v in _top_verts(obj):
        if ridge == "y":
            v.co.x = x
        else:
            v.co.y = y
    return obj


def hip(w, d, h, x=0.0, y=0.0, z=0.0, color=SLATE, overhang=0.15, flat=0.25):
    """Hip roof: top face shrunk toward the center from both axes."""
    obj = box(w + overhang * 2, d + overhang * 2, h, x, y, z, color)
    for v in _top_verts(obj):
        v.co.x = x + (v.co.x - x) * flat
        v.co.y = y + (v.co.y - y) * flat
    return obj


def pyramid(w, d, h, x=0.0, y=0.0, z=0.0, color=SLATE, overhang=0.1):
    return hip(w, d, h, x, y, z, color, overhang, flat=0.02)


def cyl(r, h, seg=8, x=0.0, y=0.0, z=0.0, color=STONE_DARK, rot=(0, 0, 0), jitter=0.0, seed=1):
    """Cylinder, BASE at z when unrotated (axis +Z)."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=seg, radius=r, depth=h, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.rotation_euler = rot
    obj.location = (x, y, z + (h / 2 if rot == (0, 0, 0) else 0))
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    _paint(obj, color)
    if jitter:
        _jitter(obj, jitter, seed)
    return obj


def dome(r, x=0.0, y=0.0, z=0.0, color=CHALK):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=r, location=(x, y, z))
    obj = bpy.context.active_object
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    _paint(obj, color)
    return obj


def post(s, h, x, y, z=0.0, color=TIMBER):
    return box(s, s, h, x, y, z, color)


def door(w, h, x, y, color=TIMBER_DARK, proud=0.06):
    """Door panel proud of a wall plane facing +Y at wall-outer-y `y`."""
    return box(w, proud, h, x, y, 0.02, color)


def crenellations(w, d, h, x, y, z, color=STONE_DARK, n=3, merlon=0.28):
    """Merlons along the +Y and -Y edges of a tower top."""
    parts = []
    step = (w - merlon) / (n - 1) if n > 1 else 0
    for i in range(n):
        mx = x - (w - merlon) / 2 + i * step
        for sy in (-1, 1):
            parts.append(box(merlon, merlon, h, mx, y + sy * (d / 2 - merlon / 2), z, color))
    return parts


def _compose(parts):
    bpy.ops.object.select_all(action="DESELECT")
    for o in parts:
        o.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    joined = bpy.context.active_object
    bpy.ops.object.shade_flat()
    if joined.data.color_attributes:
        joined.data.color_attributes.active_index = 0
    return joined


# --------------------------------------------------------------------------- #
# Archetypes. Footprints/heights per the visual spec; front (door) faces +Y.
# W = x extent, L = y extent. Walls inset 0.05 (use W-0.1 style dims).
# --------------------------------------------------------------------------- #
def market_bell_tower():  # 3x3, H 7.5 — landmark
    parts = [
        box(2.9, 2.9, 0.5, color=STONE_DARK, jitter=0.01, seed=41),        # plinth
        box(2.6, 2.6, 2.6, z=0.5, color=STONE, jitter=0.012, seed=42),     # tier 1
        box(2.75, 2.75, 0.15, z=3.1, color=STONE_DARK),                    # cornice
        box(2.2, 2.2, 2.0, z=3.25, color=STONE, jitter=0.012, seed=43),    # tier 2
        box(2.35, 2.35, 0.15, z=5.25, color=STONE_DARK),                   # cornice
    ]
    # Belfry: 4 slim corner posts, wide open arches, a big visible bronze bell.
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(post(0.22, 1.45, sx * 0.9, sy * 0.9, 5.4, color=STONE))
    parts.append(cyl(0.52, 0.62, seg=8, z=5.75, color=BRONZE))             # bell body
    parts.append(cyl(0.58, 0.1, seg=8, z=5.7, color=BRONZE))               # bell lip
    parts.append(cyl(0.1, 0.18, seg=5, z=5.55, color=SOOT))                # clapper
    parts.append(box(0.14, 1.9, 0.14, 0, 0, 6.45, color=TIMBER_DARK))      # bell beam
    parts.append(pyramid(2.5, 2.5, 1.0, z=6.85, color=SLATE, overhang=0.2))
    return _compose(parts), "landmark"


def counting_house():  # 4x3, H 4.5 — landmark
    parts = [
        box(3.9, 2.9, 0.35, color=STONE_DARK, jitter=0.01, seed=51),       # plinth
        box(3.7, 2.7, 2.85, z=0.35, color=STONE, jitter=0.012, seed=52),   # body
    ]
    for sx in (-1, 1):                                                     # quoins
        for sy in (-1, 1):
            parts.append(post(0.28, 3.0, sx * 1.72, sy * 1.22, 0.2, color=STONE_DARK))
    parts.append(door(0.55, 1.5, -0.3, 1.36, color=IRON))                  # iron double door
    parts.append(door(0.55, 1.5, 0.3, 1.36, color=IRON))
    parts.append(box(1.3, 0.1, 0.18, 0, 1.38, 1.55, color=STONE_DARK))     # door lintel
    for wx in (-1.2, 1.2):                                                 # barred slit windows
        parts.append(box(0.16, 0.08, 0.7, wx, 1.36, 1.6, color=SOOT))
        parts.append(box(0.05, 0.1, 0.74, wx, 1.37, 1.58, color=IRON))
    parts.append(hip(3.7, 2.7, 1.3, z=3.2, color=SLATE))
    return _compose(parts), "landmark"


def gatehouse():  # 5x3, H 6 — landmark. Passage x in (-0.8, 0.8) MUST stay clear to z=2.5.
    parts = []
    for sx in (-1, 1):
        tx = sx * 1.65
        parts.append(box(1.7, 2.9, 0.4, tx, 0, 0, color=STONE_DARK, jitter=0.01, seed=61))
        parts.append(box(1.5, 2.7, 4.4, tx, 0, 0.4, color=STONE, jitter=0.012, seed=62 + sx))
        parts.append(box(1.7, 2.9, 0.15, tx, 0, 4.8, color=STONE_DARK))
        parts.extend(crenellations(1.6, 2.8, 0.4, tx, 0, 4.95, n=2))
        parts.append(pyramid(1.2, 1.2, 0.9, tx, 0, 5.1, color=SLATE))
    parts.append(box(1.8, 2.5, 1.0, 0, 0, 2.6, color=STONE, jitter=0.01, seed=64))  # lintel span
    parts.append(box(1.9, 0.5, 0.3, 0, 1.1, 3.6, color=STONE_DARK))                 # front parapet
    # Portcullis, half-raised: entirely above z=2.5 (walkable passage clearance).
    for bx in (-0.5, 0.0, 0.5):
        parts.append(box(0.07, 0.07, 0.9, bx, 1.05, 2.55, color=IRON))
    parts.append(box(1.3, 0.07, 0.08, 0, 1.05, 2.55, color=IRON))
    parts.append(box(1.3, 0.07, 0.08, 0, 1.05, 3.35, color=TIMBER_DARK))
    return _compose(parts), "landmark"


def shrine_hall():  # 3x4, H 5 — landmark
    parts = [
        box(2.9, 3.9, 0.3, color=STONE_DARK, jitter=0.01, seed=71),
        box(2.7, 3.7, 2.5, z=0.3, color=STONE, jitter=0.012, seed=72),
    ]
    g = gable(2.7, 3.7, 2.2, z=2.8, ridge="y", color=SLATE)                # steep gable
    parts.append(g)
    parts.append(cyl(0.4, 0.1, seg=8, y=1.87, z=3.3, rot=(math.pi / 2, 0, 0), color=SOOT))
    parts.append(cyl(0.5, 0.06, seg=8, y=1.84, z=3.3, rot=(math.pi / 2, 0, 0), color=CHALK))
    parts.append(door(0.8, 1.7, 0, 1.86, color=TIMBER_DARK))               # door
    parts.append(box(0.6, 0.05, 1.1, 0, 1.83, 0.25, color=EMBER))          # hearth glow in doorway
    for ny in (-1.1, 0, 1.1):                                              # candle niches
        for sx in (-1, 1):
            parts.append(box(0.06, 0.22, 0.3, sx * 1.36, ny, 1.5, color=STONE_DARK))
    return _compose(parts), "landmark"


def graveyard_crypt():  # 3x3 + 1x3 stair apron, H 3 — landmark
    parts = [
        box(2.9, 2.9, 2.0, y=-0.5, color=STONE_DARK, jitter=0.015, seed=81),
        box(2.95, 2.95, 0.2, y=-0.5, z=2.0, color=STONE_DARK, jitter=0.01, seed=82),  # cap slab
        box(1.3, 1.0, 0.1, -0.6, -1.0, 2.2, color=MOSS, jitter=0.02, seed=85),  # moss patches
        box(0.9, 1.2, 0.1, 0.8, 0.1, 2.2, color=MOSS, jitter=0.02, seed=86),
        box(1.4, 0.3, 2.2, 0, 1.0, 0, color=STONE, jitter=0.01, seed=83),      # lintel face
        box(1.6, 0.25, 0.35, 0, 1.0, 2.2, color=STONE_DARK),                   # lintel cap
        box(0.8, 0.1, 1.5, 0, 1.02, 0.1, color=SOOT),                          # doorway void
    ]
    for bx in (-0.22, 0.0, 0.22):                                              # iron gate bars
        parts.append(box(0.05, 0.06, 1.45, bx, 1.06, 0.12, color=IRON))
    for i, (sd, sh) in enumerate([(1.35, 0.30), (1.65, 0.20), (1.95, 0.10)]):  # steps down->door
        parts.append(box(1.2, 0.3, sh, 0, sd, 0, color=STONE, jitter=0.008, seed=84 + i))
    return _compose(parts), "landmark"


def foundry_forge():  # 4x4, H 5.5 — landmark. Open front (+Y).
    parts = [
        box(3.9, 3.9, 0.25, color=STONE_DARK, jitter=0.01, seed=91),           # slab
        box(0.35, 3.5, 2.8, -1.75, -0.2, 0.25, color=STONE, jitter=0.012, seed=92),  # left wall
        box(0.35, 3.5, 2.8, 1.75, -0.2, 0.25, color=STONE, jitter=0.012, seed=93),   # right wall
        box(3.9, 0.35, 2.8, 0, -1.75, 0.25, color=STONE, jitter=0.012, seed=94),     # back wall
        box(3.0, 0.06, 2.2, 0, -1.55, 0.5, color=EMBER),                       # interior glow
        post(0.28, 3.0, -1.6, 1.75, 0.25, color=TIMBER),                       # front posts
        post(0.28, 3.0, 1.6, 1.75, 0.25, color=TIMBER),
        gable(3.9, 3.9, 1.6, z=3.05, ridge="x", color=CLAY),
    ]
    parts.append(box(0.8, 0.8, 4.6, -1.3, -1.3, 0.25, color=STONE, jitter=0.012, seed=95))  # chimney
    parts.append(box(0.95, 0.95, 0.45, -1.3, -1.3, 4.85, color=SOOT))          # soot top
    return _compose(parts), "landmark"


def anvil_shed():  # 2x2, H 2.5 — prop
    parts = [
        post(0.18, 2.3, -0.8, 0.8, color=TIMBER),
        post(0.18, 2.3, 0.8, 0.8, color=TIMBER),
        post(0.18, 1.9, -0.8, -0.8, color=TIMBER),
        post(0.18, 1.9, 0.8, -0.8, color=TIMBER),
        box(2.1, 2.1, 0.14, 0, 0, 2.05, color=CLAY, rot=(math.radians(-11), 0, 0)),  # mono-pitch
        cyl(0.22, 0.5, seg=8, x=0.1, y=0, z=0, color=TIMBER_DARK, jitter=0.01, seed=101),  # stump
        box(0.55, 0.2, 0.18, 0.1, 0, 0.5, color=IRON),                          # anvil body
        box(0.3, 0.14, 0.1, 0.32, 0, 0.56, color=IRON),                         # anvil horn
    ]
    return _compose(parts), "prop"


def bowyer_workshop():  # 3x3, H 4 — house
    parts = [
        box(2.9, 2.9, 0.25, color=STONE_DARK, jitter=0.008, seed=111),
        box(2.7, 2.7, 2.15, z=0.25, color=WATTLE, jitter=0.008, seed=112),
    ]
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(post(0.2, 2.2, sx * 1.3, sy * 1.3, 0.25, color=TIMBER))
    parts.append(box(2.75, 0.12, 0.14, 0, 1.32, 1.3, color=TIMBER))         # front rail
    parts.append(door(1.0, 1.7, -0.4, 1.4, color=TIMBER_DARK))              # wide workshop door
    parts.append(gable(2.7, 2.7, 1.4, z=2.4, ridge="x", color=CLAY))
    for i, oy in enumerate((-0.7, 0.0, 0.7)):                               # bow-stave rack (+X)
        parts.append(cyl(0.035, 1.7, seg=5, x=1.42, y=oy, z=0.3,
                         rot=(math.radians(12), 0, 0), color=TIMBER_DARK, seed=113 + i))
    return _compose(parts), "house"


def tannery():  # 4x2, H 3 — house
    parts = [
        box(3.9, 1.9, 0.2, color=STONE_DARK, jitter=0.008, seed=121),
        box(3.7, 1.7, 1.8, z=0.2, color=TIMBER, jitter=0.01, seed=122),
        box(4.0, 2.1, 0.16, 0, -0.1, 2.05, color=CLAY, rot=(math.radians(9), 0, 0)),  # mono-pitch
        door(0.8, 1.4, 0.9, 0.86, color=TIMBER_DARK),
    ]
    for fx in (-1.1, 0.3):                                                  # drying frames (north)
        parts.append(post(0.1, 1.6, fx - 0.5, -1.35, color=TIMBER_DARK))
        parts.append(post(0.1, 1.6, fx + 0.5, -1.35, color=TIMBER_DARK))
        parts.append(box(0.9, 0.05, 0.9, fx, -1.35, 0.45, color=WATTLE, jitter=0.012, seed=123))
    return _compose(parts), "house"


def chalkhouse():  # 3x3, H 4.5 — house
    parts = [
        box(2.9, 2.9, 0.25, color=STONE_DARK, jitter=0.008, seed=131),
        box(2.7, 2.7, 2.35, z=0.25, color=CHALK, jitter=0.008, seed=132),
    ]
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(post(0.18, 2.4, sx * 1.3, sy * 1.3, 0.25, color=TIMBER_DARK))
    parts.append(door(0.8, 1.6, 0, 1.4, color=TIMBER_DARK))
    parts.append(gable(2.7, 2.7, 1.5, z=2.6, ridge="y", color=THATCH))
    parts.append(dome(0.75, 1.5, 0.2, 0.75, color=CHALK))                   # kiln bulge (+X wall)
    parts.append(box(0.34, 0.4, 0.5, 1.85, 0.2, 0.15, color=BRONZE))        # kiln door
    parts.append(cyl(0.12, 0.5, seg=6, x=1.5, y=0.2, z=1.4, color=SOOT))    # kiln vent
    return _compose(parts), "house"


def bead_loom_hall():  # 5x2, H 3.5 — house
    parts = [
        box(4.9, 1.9, 0.2, color=STONE_DARK, jitter=0.008, seed=141),
        box(4.7, 1.7, 2.0, z=0.2, color=CHALK, jitter=0.008, seed=142),
        gable(4.7, 1.7, 1.2, z=2.2, ridge="x", color=THATCH),
        door(0.7, 1.5, -1.9, 0.86, color=TIMBER_DARK),
    ]
    for i in range(5):                                                      # loom windows (+Y)
        wx = -1.0 + i * 0.7
        parts.append(box(0.45, 0.08, 0.45, wx, 0.87, 0.9, color=TIMBER))
        parts.append(box(0.33, 0.1, 0.33, wx, 0.88, 0.96, color=SOOT))
    return _compose(parts), "house"


def river_fishmonger():  # 2x2, H 3 — house (stilts)
    parts = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(cyl(0.07, 0.6, seg=6, x=sx * 0.8, y=sy * 0.8, z=0, color=TIMBER_DARK))
    parts.append(box(1.9, 1.9, 0.12, z=0.6, color=TIMBER_DARK, jitter=0.006, seed=151))  # deck
    parts.append(box(0.14, 0.9, 0.05, 0.3, 0, 0.7, color=TIMBER))           # worn lighter plank
    for sx in (-1, 1):                                                      # awning poles
        parts.append(post(0.12, 1.85, sx * 0.8, 0.8, 0.72, color=TIMBER))   # front (tall)
        parts.append(post(0.12, 1.45, sx * 0.8, -0.8, 0.72, color=TIMBER))  # back (short)
    # Canvas rests on the pole tops: front edge high (+10 deg about X).
    parts.append(box(2.2, 2.3, 0.08, 0, 0, 2.5, color=CANVAS, rot=(math.radians(10), 0, 0)))
    parts.append(box(1.9, 0.32, 0.08, 0, 0.9, 1.5, color=TIMBER_DARK))      # counter top
    parts.append(box(1.9, 0.1, 0.75, 0, 0.99, 0.72, color=TIMBER))          # counter front panel
    return _compose(parts), "house"


def kitchen_hearth():  # 3x2, H 3.5 — house
    parts = [
        box(2.9, 1.9, 0.2, color=STONE_DARK, jitter=0.008, seed=161),
        box(2.7, 1.7, 2.0, z=0.2, color=STONE, jitter=0.01, seed=162),
        gable(2.7, 1.7, 1.1, z=2.2, ridge="x", color=THATCH),
        box(1.2, 0.1, 0.9, -0.3, 0.87, 0.9, color=SOOT),                    # serving hatch void
        box(1.35, 0.08, 0.12, -0.3, 0.88, 1.8, color=TIMBER),               # hatch lintel
        box(1.35, 0.14, 0.1, -0.3, 0.92, 0.82, color=TIMBER_DARK),          # hatch counter
        box(1.15, 0.05, 0.8, -0.3, 0.9, 0.95, color=EMBER),                 # glow inside hatch
        box(0.5, 0.5, 3.1, 1.0, -0.4, 0.2, color=STONE, jitter=0.01, seed=163),  # squat chimney
        box(0.62, 0.62, 0.3, 1.0, -0.4, 3.2, color=SOOT),
    ]
    return _compose(parts), "house"


def market_stall():  # 2x2, H 2.6 — prop
    parts = [
        post(0.12, 2.3, -0.85, 0.85, color=TIMBER),
        post(0.12, 2.3, 0.85, 0.85, color=TIMBER),
        post(0.12, 2.0, -0.85, -0.85, color=TIMBER),
        post(0.12, 2.0, 0.85, -0.85, color=TIMBER),
        gable(1.9, 1.9, 0.55, z=2.05, ridge="x", color=CANVAS, overhang=0.2),
        box(1.9, 0.4, 0.12, 0, 0.85, 0.95, color=TIMBER_DARK),              # counter
        box(0.6, 0.5, 0.5, -0.4, -0.4, 0, color=TIMBER_DARK, jitter=0.01, seed=171),  # crate
    ]
    return _compose(parts), "prop"


def warden_post():  # 2x2, H 3.2 — house
    parts = [
        box(1.9, 1.9, 1.2, color=STONE, jitter=0.01, seed=181),             # stone base
        box(1.7, 1.7, 1.0, z=1.2, color=TIMBER, jitter=0.008, seed=182),    # timber upper
        pyramid(1.9, 1.9, 0.9, z=2.2, color=SLATE),
        door(0.7, 1.0, -0.3, 0.96, color=TIMBER_DARK),
        box(0.9, 0.08, 0.7, 0.45, 0.97, 1.3, color=TIMBER_DARK),            # notice board frame
        box(0.74, 0.1, 0.54, 0.45, 0.98, 1.38, color=WATTLE),               # notices
    ]
    return _compose(parts), "house"


def generic_house_a():  # 3x3, H 4 — wide thatch gable, ridge N-S
    parts = [
        box(2.9, 2.9, 0.2, color=STONE_DARK, jitter=0.008, seed=191),
        box(2.7, 2.7, 2.2, z=0.2, color=WATTLE, jitter=0.008, seed=192),
    ]
    for sx in (-1, 1):
        for sy in (-1, 1):
            parts.append(post(0.18, 2.25, sx * 1.3, sy * 1.3, 0.2, color=TIMBER))
    parts.append(door(0.75, 1.6, 0.3, 1.4, color=TIMBER_DARK))
    for wx, wy, wr in ((-1.37, 0.2, 1), (1.37, -0.2, 1)):                   # shuttered windows
        parts.append(box(0.08, 0.5, 0.55, wx, wy, 1.1, color=TIMBER_DARK))
    parts.append(gable(2.7, 2.7, 1.6, z=2.4, ridge="y", color=THATCH))
    return _compose(parts), "house"


def generic_house_b():  # 3x2, H 3.6 — stone lower, ridge E-W, lean-to woodstore
    parts = [
        box(2.9, 1.9, 1.2, color=STONE, jitter=0.01, seed=201),
        box(2.7, 1.7, 1.0, z=1.2, color=WATTLE, jitter=0.008, seed=202),
        box(2.75, 1.75, 0.1, z=1.15, color=TIMBER),                          # jetty band
        door(0.7, 1.05, -0.6, 0.96, color=TIMBER_DARK),
        gable(2.7, 1.7, 1.4, z=2.2, ridge="x", color=THATCH),
        box(0.75, 1.5, 0.1, 1.62, 0, 1.05, color=THATCH, rot=(0, math.radians(28), 0)),  # lean-to
        post(0.1, 0.85, 1.95, -0.6, color=TIMBER_DARK),                      # lean-to props
        post(0.1, 0.85, 1.95, 0.6, color=TIMBER_DARK),
        cyl(0.11, 0.9, seg=5, x=1.68, y=0.25, z=0.1, rot=(math.pi / 2, 0, 0), color=TIMBER_DARK),
        cyl(0.11, 0.9, seg=5, x=1.68, y=0.25, z=0.32, rot=(math.pi / 2, 0, 0), color=TIMBER),
    ]
    return _compose(parts), "house"


def generic_house_c():  # 2x2, H 4.2 — tall two-storey, jettied, X-brace
    parts = [
        box(1.9, 1.9, 1.6, color=WATTLE, jitter=0.008, seed=211),
        box(2.2, 2.2, 1.4, z=1.6, color=WATTLE, jitter=0.008, seed=212),     # jettied upper
        box(2.24, 2.24, 0.1, z=1.55, color=TIMBER_DARK),                     # jetty sill
        door(0.65, 1.35, 0, 0.96, color=TIMBER_DARK),
        # X-brace lies flat on the +Y wall plane: long in Z, tilted about Y.
        box(0.1, 0.06, 1.3, 0, 1.13, 1.75, color=TIMBER, rot=(0, math.radians(-38), 0)),
        box(0.1, 0.06, 1.3, 0, 1.13, 1.75, color=TIMBER, rot=(0, math.radians(38), 0)),
        gable(2.2, 2.2, 1.2, z=3.0, ridge="y", color=THATCH),
    ]
    return _compose(parts), "house"


def cellar_ruin():  # 3x3, H 1.8 — broken walls, hatch inside
    rng = random.Random(221)
    parts = [box(2.9, 2.9, 0.15, color=STONE_DARK, jitter=0.01, seed=222)]   # rubble slab
    segs = [(-1.35, -0.6, 0.0, 0.35), (-1.35, 0.7, 0.0, 0.35),               # (x, y, rotZ?, w)…
            (0.9, -1.35, 1, 0.35), (-0.5, -1.35, 1, 0.35),
            (1.35, 0.3, 0.0, 0.35), (0.2, 1.35, 1, 0.35)]
    for i, (sx, sy, vert, w) in enumerate(segs):
        h = 0.5 + rng.random() * 1.3
        bw, bd = (w, 1.1) if not vert else (1.1, w)
        parts.append(box(bw, bd, h, sx, sy, 0.15, color=STONE, jitter=0.02, seed=223 + i))
        if h > 1.0:
            parts.append(box(bw * 0.9, bd * 0.9, 0.08, sx, sy, 0.15 + h, color=MOSS))
    parts.append(box(0.8, 0.8, 0.1, 0.3, 0.2, 0.15, color=TIMBER_DARK))      # cellar hatch
    parts.append(box(0.2, 0.08, 0.06, 0.3, 0.2, 0.25, color=IRON))           # hatch handle
    return _compose(parts), "house"


def well():  # 1x1, H 2.2 — prop
    parts = [
        cyl(0.36, 0.65, seg=8, color=STONE_DARK, jitter=0.012, seed=231),
        cyl(0.28, 0.02, seg=8, z=0.64, color=SOOT),                          # dark water disc
        post(0.09, 1.75, -0.4, 0, color=TIMBER),
        post(0.09, 1.75, 0.4, 0, color=TIMBER),
        gable(0.9, 0.5, 0.35, z=1.75, ridge="x", color=THATCH, overhang=0.08),
        cyl(0.04, 0.9, seg=5, x=0, y=0, z=1.45, rot=(0, math.pi / 2, 0), color=TIMBER_DARK),
        box(0.16, 0.16, 0.14, 0, 0, 0.9, color=TIMBER_DARK),                 # bucket
    ]
    return _compose(parts), "prop"


def garden_plot():  # 2x1, H 0.4 — prop
    parts = [
        box(1.9, 0.14, 0.3, 0, 0.43, 0, color=TIMBER_DARK),
        box(1.9, 0.14, 0.3, 0, -0.43, 0, color=TIMBER_DARK),
        box(0.14, 1.0, 0.3, -0.88, 0, 0, color=TIMBER_DARK),
        box(0.14, 1.0, 0.3, 0.88, 0, 0, color=TIMBER_DARK),
        box(1.72, 0.78, 0.24, color=LOAM, jitter=0.015, seed=241),
    ]
    rng = random.Random(242)
    for i in range(6):
        sx = -0.7 + (i % 3) * 0.7 + (rng.random() - 0.5) * 0.1
        sy = (-0.2 if i < 3 else 0.2) + (rng.random() - 0.5) * 0.1
        parts.append(box(0.1, 0.1, 0.12 + rng.random() * 0.08, sx, sy, 0.24, color=MOSS))
    return _compose(parts), "prop"


def dock():  # 3x1, H 0.7 — prop
    parts = [box(2.9, 0.9, 0.1, z=0.6, color=TIMBER_DARK, jitter=0.006, seed=251)]
    parts.append(box(0.5, 0.8, 0.04, 0.6, 0, 0.7, color=TIMBER))             # worn plank
    for px in (-1.25, 0, 1.25):
        for py in (-0.35, 0.35):
            parts.append(cyl(0.06, 0.6, seg=5, x=px, y=py, z=0, color=TIMBER_DARK))
    parts.append(cyl(0.08, 1.0, seg=6, x=1.35, y=0.35, z=0.6, color=TIMBER_DARK))  # mooring
    parts.append(cyl(0.08, 1.0, seg=6, x=1.35, y=-0.35, z=0.6, color=TIMBER_DARK))
    return _compose(parts), "prop"


ARCHETYPES = {
    "market_bell_tower": market_bell_tower,
    "counting_house": counting_house,
    "gatehouse": gatehouse,
    "shrine_hall": shrine_hall,
    "graveyard_crypt": graveyard_crypt,
    "foundry_forge": foundry_forge,
    "anvil_shed": anvil_shed,
    "bowyer_workshop": bowyer_workshop,
    "tannery": tannery,
    "chalkhouse": chalkhouse,
    "bead_loom_hall": bead_loom_hall,
    "river_fishmonger": river_fishmonger,
    "kitchen_hearth": kitchen_hearth,
    "market_stall": market_stall,
    "warden_post": warden_post,
    "generic_house_a": generic_house_a,
    "generic_house_b": generic_house_b,
    "generic_house_c": generic_house_c,
    "cellar_ruin": cellar_ruin,
    "well": well,
    "garden_plot": garden_plot,
    "dock": dock,
}


# --------------------------------------------------------------------------- #
# Validation, export, previews
# --------------------------------------------------------------------------- #
def _tri_count(obj):
    obj.data.calc_loop_triangles()
    return len(obj.data.loop_triangles)


def _assert_passage_clear(obj):
    """Gatehouse: passage volume |x|<0.5, |y|<1.5, 0.05<z<2.5 must be empty."""
    for v in obj.data.vertices:
        if abs(v.co.x) < 0.5 and abs(v.co.y) < 1.5 and 0.05 < v.co.z < 2.5:
            raise AssertionError(
                f"gatehouse passage blocked by vertex at ({v.co.x:.2f}, {v.co.y:.2f}, {v.co.z:.2f})"
            )


def _export(obj, archetype_id):
    path = os.path.join(OUT_DIR, f"{archetype_id}.glb")
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        use_selection=True,
        export_materials="NONE",
        export_cameras=False,
        export_lights=False,
        export_skins=False,
        export_animations=False,
    )
    return path


def _render_preview(obj, archetype_id, preview_dir):
    """Isometric-ish workbench render with vertex colours, front (+Y) visible."""
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "VERTEX"
    scene.display.shading.show_cavity = True
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.render.film_transparent = False

    bb = [obj.matrix_world @ v.co for v in obj.data.vertices]
    zmax = max(v.z for v in bb)
    extent = max(max(abs(v.x) for v in bb), max(abs(v.y) for v in bb)) * 2
    target_z = zmax / 2

    cam_data = bpy.data.cameras.new("preview_cam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = max(extent, zmax) * 1.35
    cam = bpy.data.objects.new("preview_cam", cam_data)
    scene.collection.objects.link(cam)
    d = max(extent, zmax) * 3 + 4
    cam.location = (0.6 * d, 0.6 * d, target_z + 0.5 * d)
    cam.rotation_euler = (math.radians(60), 0, math.radians(135))
    scene.camera = cam

    scene.render.filepath = os.path.join(preview_dir, f"{archetype_id}.png")
    bpy.ops.render.render(write_still=True)


def _build(archetype_id, preview_dir=None):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    obj, budget_class = ARCHETYPES[archetype_id]()
    obj.name = archetype_id

    tris = _tri_count(obj)
    budget = BUDGETS[budget_class]
    if tris > budget:
        raise AssertionError(f"{archetype_id}: {tris} tris exceeds {budget_class} budget {budget}")
    if archetype_id == "gatehouse":
        _assert_passage_clear(obj)
    if not obj.data.color_attributes:
        raise AssertionError(f"{archetype_id}: missing Color attribute")

    path = _export(obj, archetype_id)
    if preview_dir:
        _render_preview(obj, archetype_id, preview_dir)
    print(f"[building-models] exported {archetype_id} ({budget_class}, {tris} tris) -> {path}")
    return tris


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    preview_dir = None
    if "--previews" in args:
        i = args.index("--previews")
        preview_dir = args[i + 1]
        args = args[:i] + args[i + 2 :]
        os.makedirs(preview_dir, exist_ok=True)

    targets = args if args else list(ARCHETYPES.keys())
    failed = []
    for aid in targets:
        if aid not in ARCHETYPES:
            print(f"[building-models] unknown archetype: {aid}")
            failed.append(aid)
            continue
        try:
            _build(aid, preview_dir)
        except Exception as exc:  # noqa: BLE001
            print(f"[building-models] FAILED {aid}: {exc}")
            failed.append(aid)

    if not args and not failed:  # full build → write the manifest
        import json

        manifest_path = os.path.join(OUT_DIR, "manifest.json")
        with open(manifest_path, "w") as f:
            json.dump({"archetypes": sorted(ARCHETYPES.keys())}, f, indent=2)
            f.write("\n")
        print(f"[building-models] wrote manifest ({len(ARCHETYPES)} archetypes)")

    print(f"[building-models] done. {len(targets) - len(failed)} ok, {len(failed)} failed.")
    if failed:
        print(f"[building-models] failed: {failed}")
        sys.exit(1)
    bpy.ops.wm.quit_blender()


if __name__ == "__main__":
    main()
