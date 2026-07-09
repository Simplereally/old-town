"""
Old Town — Blender weapon model generator.

Procedurally models every weapon family (12 melee, 18 ranged, 6 magic = 36) as
stylized low-poly meshes using the bpy API, bakes per-region vertex colours, and
exports each family as a compressed binary .glb into assets/items/models/.

Run headless:

    /Applications/Blender.app/Contents/MacOS/Blender --background --python \
        scripts/generate-weapon-models.py

Modelling convention (Blender space, Z-up):
  - Grip base sits at the origin (0, 0, 0).
  - The functional end (blade tip, spear point, bow limb top) extends along +Z.
  - The weapon's flat face lies in the XZ plane; thickness is along Y.
  - export_yup=True maps Blender +Z -> Three.js +Y, so the blade points +Y in the
    client, matching the existing procedural weapon orientation.

Vertex colours are baked per region (metal / wood / bronze / gem …) as a
"Color" point attribute. At runtime the client multiplies them by the tier
tint colour, so a single geometry per family serves all 13 tiers.
"""

import math
import os
import random
import sys

import bpy

# --------------------------------------------------------------------------- #
# Region colour palette (linear-ish sRGB, 0..1). Bright enough that the runtime
# tier tint (multiplied in the shader) still reads clearly.
# --------------------------------------------------------------------------- #
METAL = (0.78, 0.80, 0.83, 1.0)
METAL_DARK = (0.45, 0.47, 0.50, 1.0)
WOOD = (0.58, 0.42, 0.26, 1.0)
WOOD_LIGHT = (0.70, 0.55, 0.36, 1.0)
BRONZE = (0.72, 0.55, 0.28, 1.0)
GOLD = (0.85, 0.70, 0.28, 1.0)
SILVER = (0.82, 0.84, 0.86, 1.0)
CLOTH_RED = (0.62, 0.28, 0.24, 1.0)
CREAM = (0.82, 0.75, 0.58, 1.0)
BONE = (0.84, 0.80, 0.70, 1.0)
GEM = (0.45, 0.70, 0.85, 1.0)
STRING = (0.88, 0.85, 0.78, 1.0)
SHADOW = (0.30, 0.27, 0.25, 1.0)

# Humanoid hand scale (matches the procedural factories).
GRIP_R = 0.04
GRIP_H_1H = 0.22
GRIP_H_2H = 0.42
GRIP_H_POLE = 1.1
POMMEL_R = 0.05

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "items", "models")


# --------------------------------------------------------------------------- #
# Primitive + paint helpers
# --------------------------------------------------------------------------- #
def _paint(obj, rgba):
    """Bake a flat vertex colour onto every vertex of `obj` as a "Color" point
    attribute (the attribute glTF exports as COLOR_0)."""
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
    """Deterministic per-vertex nudge for a hand-carved low-poly feel."""
    rng = random.Random(seed)
    for v in obj.data.vertices:
        v.co.x += (rng.random() - 0.5) * amount
        v.co.y += (rng.random() - 0.5) * amount
        v.co.z += (rng.random() - 0.5) * amount


def _taper_top(obj, fx=0.2, fy=1.0):
    """Narrow the +Z face of a box to taper a blade tip."""
    mesh = obj.data
    zmax = max(v.co.z for v in mesh.vertices)
    for v in mesh.vertices:
        if abs(v.co.z - zmax) < 1e-4:
            v.co.x *= fx
            v.co.y *= fy


def _add_cube(w, d, h, loc=(0, 0, 0), rot=(0, 0, 0), color=METAL, jitter=0.0, seed=1,
              taper=(1.0, 1.0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.scale = (w, d, h)
    obj.rotation_euler = rot
    obj.location = loc
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if taper != (1.0, 1.0):
        _taper_top(obj, taper[0], taper[1])
    _paint(obj, color)
    if jitter:
        _jitter(obj, jitter, seed)
    return obj


def _add_cyl(r, h, seg=6, loc=(0, 0, 0), rot=(0, 0, 0), color=WOOD, jitter=0.0, seed=1):
    bpy.ops.mesh.primitive_cylinder_add(vertices=seg, radius=r, depth=h, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.rotation_euler = rot
    obj.location = loc
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    _paint(obj, color)
    if jitter:
        _jitter(obj, jitter, seed)
    return obj


def _add_cone(r1, r2, h, seg=4, loc=(0, 0, 0), rot=(0, 0, 0), color=METAL, jitter=0.0, seed=1):
    bpy.ops.mesh.primitive_cone_add(
        vertices=seg, radius1=r1, radius2=r2, depth=h, location=(0, 0, 0)
    )
    obj = bpy.context.active_object
    obj.rotation_euler = rot
    obj.location = loc
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    _paint(obj, color)
    if jitter:
        _jitter(obj, jitter, seed)
    return obj


def _add_ico(r, sub=0, loc=(0, 0, 0), color=BRONZE, jitter=0.0, seed=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=loc)
    obj = bpy.context.active_object
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    _paint(obj, color)
    if jitter:
        _jitter(obj, jitter, seed)
    return obj


def _add_torus(R, r, maj=8, minr=4, loc=(0, 0, 0), rot=(0, 0, 0), color=WOOD):
    bpy.ops.mesh.primitive_torus_add(
        major_segments=maj, minor_segments=minr, major_radius=R, minor_radius=r,
        location=(0, 0, 0),
    )
    obj = bpy.context.active_object
    obj.rotation_euler = rot
    obj.location = loc
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    _paint(obj, color)
    return obj


def _grip(h, y, color=WOOD):
    return _add_cyl(GRIP_R, h, seg=6, loc=(0, 0, y), color=color)


def _pommel(y, color=BRONZE):
    return _add_cyl(POMMEL_R, 0.04, seg=6, loc=(0, 0, y), color=color)


def _guard(w, y, color=BRONZE):
    return _add_cube(w, 0.06, 0.04, loc=(0, 0, y), color=color)


def _compose(parts):
    """Join a list of primitive objects into one flat-shaded mesh."""
    bpy.ops.object.select_all(action="DESELECT")
    for o in parts:
        o.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    joined = bpy.context.active_object
    bpy.ops.object.shade_flat()
    # Ensure the merged "Color" attribute is the active one for glTF export.
    if joined.data.color_attributes:
        joined.data.color_attributes.active_index = 0
    return joined


def _export(obj, family_id):
    path = os.path.join(OUT_DIR, f"{family_id}.glb")
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


def _build(family_id, builder):
    """Reset the scene, run a builder, export, and clean up."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    obj = builder()
    obj.name = family_id
    path = _export(obj, family_id)
    print(f"[weapon-models] exported {family_id} -> {path}")


# --------------------------------------------------------------------------- #
# Melee families (12)
# --------------------------------------------------------------------------- #
def melee_sticker():
    # Dagger: tapered 4-sided blade, small guard, grip, round pommel.
    blade = _add_cone(0.05, 0.01, 0.22, seg=4, loc=(0, 0, 0.33), color=METAL, jitter=0.004, seed=2)
    return _compose([blade, _guard(0.12, 0.22), _grip(GRIP_H_1H, 0.11), _pommel(0.0)])


def melee_shortblade():
    blade = _add_cube(0.05, 0.02, 0.30, loc=(0, 0, 0.37), color=METAL, taper=(0.15, 1.0),
                      jitter=0.004, seed=3)
    return _compose([blade, _guard(0.16, 0.22), _grip(GRIP_H_1H, 0.11), _pommel(0.0)])


def melee_longblade():
    blade = _add_cube(0.05, 0.022, 0.42, loc=(0, 0, 0.43), color=METAL, taper=(0.12, 1.0),
                      jitter=0.004, seed=4)
    return _compose([blade, _guard(0.18, 0.22), _grip(GRIP_H_1H, 0.11), _pommel(0.0)])


def melee_greatblade():
    blade = _add_cube(0.07, 0.025, 0.56, loc=(0, 0, 0.50), color=METAL, taper=(0.1, 1.0),
                      jitter=0.005, seed=5)
    return _compose([blade, _guard(0.24, 0.22), _grip(GRIP_H_2H, 0.0), _pommel(-0.22)])


def melee_sabre():
    # Curved blade: a tapered box rotated slightly about Z for the curve.
    blade = _add_cube(0.04, 0.02, 0.36, loc=(0, 0, 0.40), rot=(0, 0, 0.15), color=METAL,
                      taper=(0.15, 1.0), jitter=0.004, seed=6)
    return _compose([blade, _guard(0.16, 0.22), _grip(GRIP_H_1H, 0.11), _pommel(0.0)])


def melee_handaxe():
    # Axe head: a wedge box offset on +X, plus a short haft.
    head = _add_cube(0.14, 0.04, 0.12, loc=(0.06, 0, 0.30), color=METAL, taper=(0.4, 1.0),
                     jitter=0.005, seed=7)
    return _compose([head, _grip(0.32, 0.16), _pommel(0.0)])


def melee_fellaxe():
    # Big two-handed axe head with a flared wedge + secondary spike.
    head = _add_cube(0.22, 0.05, 0.16, loc=(0.09, 0, 0.34), color=METAL, taper=(0.35, 1.0),
                     jitter=0.005, seed=8)
    spike = _add_cone(0.04, 0.0, 0.08, seg=4, loc=(0.0, 0, 0.42), color=METAL_DARK)
    return _compose([head, spike, _guard(0.10, 0.22), _grip(GRIP_H_2H, 0.0), _pommel(-0.22)])


def melee_cudgel():
    # Blunt: a faceted cylindrical head on a short grip.
    head = _add_cyl(0.08, 0.12, seg=6, loc=(0, 0, 0.32), color=WOOD_LIGHT, jitter=0.006, seed=9)
    band = _add_cyl(0.085, 0.03, seg=6, loc=(0, 0, 0.30), color=BRONZE)
    return _compose([head, band, _grip(0.28, 0.14), _pommel(0.0)])


def melee_maul():
    # Heavy two-handed hammer: big square head on a long grip.
    head = _add_cube(0.16, 0.16, 0.16, loc=(0, 0, 0.34), color=METAL_DARK, jitter=0.006, seed=10)
    band = _add_cube(0.17, 0.04, 0.17, loc=(0, 0, 0.34), color=BRONZE)
    return _compose([head, band, _grip(GRIP_H_2H, 0.0), _pommel(-0.22)])


def melee_spear():
    # Polearm: long shaft + leaf spear tip.
    tip = _add_cone(0.05, 0.01, 0.16, seg=4, loc=(0, 0, 0.66), color=METAL, jitter=0.004, seed=11)
    socket = _add_cyl(0.05, 0.04, seg=6, loc=(0, 0, 0.58), color=BRONZE)
    return _compose([tip, socket, _grip(GRIP_H_POLE, 0.0, color=WOOD_LIGHT), _pommel(-0.56)])


def melee_billhook():
    # Polearm with a hooked blade head.
    hook = _add_cube(0.14, 0.04, 0.10, loc=(0.06, 0, 0.64), rot=(0, 0, 0.3), color=METAL,
                     taper=(0.3, 1.0), jitter=0.005, seed=12)
    spike = _add_cone(0.04, 0.0, 0.08, seg=4, loc=(-0.04, 0, 0.60), rot=(0, 0, -0.5),
                      color=METAL_DARK)
    return _compose([hook, spike, _grip(GRIP_H_POLE, 0.0, color=WOOD_LIGHT), _pommel(-0.56)])


def melee_glaive():
    # Polearm with a long single-edged curved blade.
    blade = _add_cube(0.06, 0.03, 0.24, loc=(0, 0, 0.62), rot=(0, 0, 0.2), color=METAL,
                      taper=(0.12, 1.0), jitter=0.005, seed=13)
    return _compose([blade, _grip(GRIP_H_POLE, 0.0, color=WOOD_LIGHT), _pommel(-0.56)])


# --------------------------------------------------------------------------- #
# Ranged families (18)
# --------------------------------------------------------------------------- #
def _bow(height, limb_thick):
    # A bow is a half-torus limb + string + grip, lying in the XZ plane.
    limb = _add_torus(height / 2, limb_thick, maj=10, minr=4, loc=(0, 0, height / 2),
                      rot=(0, 0, 0), color=WOOD)
    # Torus lies in XY; rotate so the half-arc opens toward -X in the XZ plane.
    limb.rotation_euler = (math.pi / 2, 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    _paint(limb, WOOD)
    string = _add_cyl(0.008, height, seg=3, loc=(-height / 2, 0, height / 2), color=STRING)
    grip = _add_cyl(0.04, 0.16, seg=6, loc=(0, 0, height / 2), color=WOOD_LIGHT)
    nock = _add_cyl(0.03, 0.02, seg=6, loc=(0, 0, height / 2 - 0.1), color=BRONZE)
    return _compose([limb, string, grip, nock])


def ranged_bentbow():
    return _bow(0.70, 0.025)


def ranged_shortbow():
    return _bow(0.80, 0.030)


def ranged_longbow():
    return _bow(1.10, 0.030)


def ranged_recurve():
    return _bow(0.85, 0.028)


def ranged_warbow():
    return _bow(1.00, 0.045)


def ranged_quickbow():
    return _bow(0.72, 0.022)


def ranged_stillbow():
    return _bow(1.05, 0.025)


def ranged_starbow():
    return _bow(1.15, 0.030)


def _crossbow(prod_w, stock_h):
    stock = _add_cube(0.08, 0.06, stock_h, loc=(0, 0, stock_h / 2), color=WOOD)
    prod = _add_cyl(0.03, prod_w, seg=6, loc=(0, 0, stock_h * 0.8), rot=(0, math.pi / 2, 0),
                    color=WOOD_LIGHT)
    string = _add_cyl(0.008, 0.12, seg=3, loc=(0, 0, stock_h * 0.8 - 0.06), color=STRING)
    mech = _add_cube(0.06, 0.05, 0.04, loc=(0, 0, stock_h * 0.65), color=BRONZE)
    return _compose([stock, prod, string, mech])


def ranged_latchbow():
    return _crossbow(0.50, 0.40)


def ranged_crossbow():
    return _crossbow(0.60, 0.45)


def ranged_arbalest():
    return _crossbow(0.70, 0.50)


def ranged_crankbow():
    return _crossbow(0.60, 0.45)


def ranged_handbow():
    return _crossbow(0.40, 0.30)


def ranged_greatbow():
    return _crossbow(0.85, 0.55)


def ranged_knife():
    blade = _add_cone(0.04, 0.01, 0.12, seg=4, loc=(0, 0, 0.20), color=METAL, jitter=0.003, seed=20)
    grip = _add_cyl(0.03, 0.10, seg=6, loc=(0, 0, 0.09), color=WOOD_LIGHT)
    pommel = _add_cone(0.03, 0.0, 0.04, seg=4, loc=(0, 0, 0.02), color=BRONZE)
    return _compose([blade, grip, pommel])


def ranged_dart():
    tip = _add_cone(0.03, 0.01, 0.08, seg=4, loc=(0, 0, 0.22), color=METAL, jitter=0.003, seed=21)
    shaft = _add_cyl(0.015, 0.20, seg=5, loc=(0, 0, 0.08), color=WOOD_LIGHT)
    fletch = _add_cone(0.04, 0.0, 0.06, seg=3, loc=(0, 0, -0.04), rot=(math.pi, 0, 0),
                       color=CLOTH_RED)
    return _compose([tip, shaft, fletch])


def ranged_javelin():
    tip = _add_cone(0.05, 0.01, 0.14, seg=4, loc=(0, 0, 0.30), color=METAL, jitter=0.003, seed=22)
    shaft = _add_cyl(0.025, 0.40, seg=6, loc=(0, 0, 0.03), color=WOOD_LIGHT)
    fletch = _add_cone(0.05, 0.0, 0.08, seg=3, loc=(0, 0, -0.20), rot=(math.pi, 0, 0),
                       color=CLOTH_RED)
    return _compose([tip, shaft, fletch])


def ranged_throwing_axe():
    head = _add_cube(0.14, 0.04, 0.10, loc=(0.05, 0, 0.20), color=METAL, taper=(0.35, 1.0),
                     jitter=0.004, seed=23)
    haft = _add_cyl(0.025, 0.20, seg=6, loc=(0, 0, 0.12), color=WOOD)
    return _compose([head, haft])


# --------------------------------------------------------------------------- #
# Magic families (6)
# --------------------------------------------------------------------------- #
def magic_wand():
    shaft = _add_cyl(0.02, 0.40, seg=6, loc=(0, 0, 0.20), color=WOOD_LIGHT, jitter=0.004, seed=30)
    bead = _add_ico(0.05, sub=0, loc=(0, 0, 0.42), color=BRONZE)
    core = _add_ico(0.035, sub=0, loc=(0, 0, 0.42), color=GEM)
    return _compose([shaft, bead, core])


def magic_staff():
    shaft = _add_cyl(0.03, 1.20, seg=6, loc=(0, 0, 0.60), color=WOOD_LIGHT, jitter=0.005, seed=31)
    crown = _add_cone(0.08, 0.02, 0.12, seg=5, loc=(0, 0, 1.22), color=BRONZE)
    gem = _add_ico(0.06, sub=0, loc=(0, 0, 1.28), color=GEM)
    return _compose([shaft, crown, gem])


def magic_rod():
    shaft = _add_cyl(0.035, 1.00, seg=6, loc=(0, 0, 0.50), color=WOOD_LIGHT, jitter=0.005, seed=32)
    cap = _add_cone(0.06, 0.01, 0.10, seg=4, loc=(0, 0, 1.02), color=METAL)
    gem = _add_ico(0.05, sub=0, loc=(0, 0, 1.08), color=GEM)
    return _compose([shaft, cap, gem])


def magic_focus():
    # Off-hand disc: a flat cylinder lens with a rim.
    disc = _add_cyl(0.12, 0.04, seg=12, loc=(0, 0, 0.15), rot=(0, 0, 0), color=BRONZE)
    lens = _add_cyl(0.10, 0.02, seg=12, loc=(0, 0, 0.15), color=GEM)
    return _compose([disc, lens])


def magic_primer():
    # Small book: cover + page block + binding stud.
    cover = _add_cube(0.14, 0.04, 0.18, loc=(0, 0, 0.15), color=SHADOW)
    pages = _add_cube(0.12, 0.02, 0.16, loc=(0, 0.01, 0.15), color=CREAM)
    stud = _add_cyl(0.025, 0.02, seg=8, loc=(0, 0.03, 0.15), rot=(0, 0, 0), color=GOLD)
    return _compose([cover, pages, stud])


def magic_codex():
    # Larger dark book with gilded face.
    cover = _add_cube(0.18, 0.05, 0.22, loc=(0, 0, 0.18), color=SHADOW, jitter=0.004, seed=33)
    pages = _add_cube(0.16, 0.03, 0.20, loc=(0, 0.01, 0.18), color=CREAM)
    boss = _add_cyl(0.035, 0.02, seg=8, loc=(0, 0.04, 0.18), color=GOLD)
    return _compose([cover, pages, boss])


# --------------------------------------------------------------------------- #
# Build + export everything
# --------------------------------------------------------------------------- #
FAMILIES = {
    # Melee
    "sticker": melee_sticker,
    "shortblade": melee_shortblade,
    "longblade": melee_longblade,
    "greatblade": melee_greatblade,
    "sabre": melee_sabre,
    "handaxe": melee_handaxe,
    "fellaxe": melee_fellaxe,
    "cudgel": melee_cudgel,
    "maul": melee_maul,
    "spear": melee_spear,
    "billhook": melee_billhook,
    "glaive": melee_glaive,
    # Ranged — bows
    "bentbow": ranged_bentbow,
    "shortbow": ranged_shortbow,
    "longbow": ranged_longbow,
    "recurve": ranged_recurve,
    "warbow": ranged_warbow,
    "quickbow": ranged_quickbow,
    "stillbow": ranged_stillbow,
    "starbow": ranged_starbow,
    # Ranged — crossbows
    "latchbow": ranged_latchbow,
    "crossbow": ranged_crossbow,
    "arbalest": ranged_arbalest,
    "crankbow": ranged_crankbow,
    "handbow": ranged_handbow,
    "greatbow": ranged_greatbow,
    # Ranged — thrown
    "knife": ranged_knife,
    "dart": ranged_dart,
    "javelin": ranged_javelin,
    "throwing_axe": ranged_throwing_axe,
    # Magic
    "wand": magic_wand,
    "staff": magic_staff,
    "rod": magic_rod,
    "focus": magic_focus,
    "primer": magic_primer,
    "codex": magic_codex,
}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    only = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    targets = only if only else list(FAMILIES.keys())
    failed = []
    for fid in targets:
        builder = FAMILIES.get(fid)
        if not builder:
            print(f"[weapon-models] unknown family: {fid}")
            failed.append(fid)
            continue
        try:
            _build(fid, builder)
        except Exception as exc:  # noqa: BLE001
            print(f"[weapon-models] FAILED {fid}: {exc}")
            failed.append(fid)
    print(f"[weapon-models] done. {len(targets) - len(failed)} ok, {len(failed)} failed.")
    if failed:
        print(f"[weapon-models] failed: {failed}")
    bpy.ops.wm.quit_blender()


if __name__ == "__main__":
    main()
