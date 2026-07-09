"""
Blender item icon generator (Batch 1: Beads).

Procedurally models small low-poly 3D items, renders each with an orthographic
3/4 camera at 64×64 px with a transparent background and flat studio lighting,
and writes PNGs to assets/items/icons-png/<id>.png.

The PNGs are later packed into a raster sprite atlas by pack-icon-png-atlas.ts.

Usage:
  blender --background --python scripts/generate-item-icons.py
  blender --background --python scripts/generate-item-icons.py -- --batch beads
"""

import math
import os
import sys

import bpy

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.normpath(os.path.join(SCRIPT_DIR, ".."))
OUT_DIR = os.path.join(PROJECT_ROOT, "assets", "items", "icons-png")

# ---------------------------------------------------------------------------
# Colour palette (desaturated, stylized — matches lowpoly.ts PALETTE)
# ---------------------------------------------------------------------------

C = {
    "iron": (0.45, 0.47, 0.50, 1.0),
    "steel": (0.55, 0.57, 0.60, 1.0),
    "copper": (0.72, 0.45, 0.20, 1.0),
    "bronze": (0.65, 0.48, 0.24, 1.0),
    "gold": (0.78, 0.62, 0.20, 1.0),
    "wood": (0.45, 0.32, 0.18, 1.0),
    "wood_light": (0.58, 0.44, 0.26, 1.0),
    "wood_dark": (0.32, 0.22, 0.12, 1.0),
    "bone": (0.88, 0.84, 0.72, 1.0),
    "leather": (0.42, 0.28, 0.16, 1.0),
    "cloth": (0.50, 0.45, 0.38, 1.0),
    "stone": (0.48, 0.46, 0.42, 1.0),
    "stone_dark": (0.30, 0.29, 0.27, 1.0),
    "clay": (0.55, 0.38, 0.26, 1.0),
    "terracotta": (0.68, 0.38, 0.22, 1.0),
    "ember_orange": (0.82, 0.35, 0.12, 1.0),
    "ember_glow": (1.0, 0.55, 0.15, 1.0),
    "gust_white": (0.82, 0.80, 0.76, 1.0),
    "wit_slate": (0.30, 0.32, 0.38, 1.0),
    "writ_blue": (0.25, 0.35, 0.55, 1.0),
    "tide_teal": (0.22, 0.48, 0.52, 1.0),
    "loam_brown": (0.38, 0.28, 0.16, 1.0),
    "grave_black": (0.12, 0.10, 0.12, 1.0),
    "prayer_wood": (0.40, 0.28, 0.14, 1.0),
    "wax_red": (0.65, 0.20, 0.18, 1.0),
    "moss_green": (0.32, 0.38, 0.22, 1.0),
    "sinew": (0.70, 0.60, 0.45, 1.0),
    "silver": (0.70, 0.72, 0.75, 1.0),
}

# ---------------------------------------------------------------------------
# Render setup
# ---------------------------------------------------------------------------

RENDER_SIZE = 64


def _clear_scene():
    """Remove all objects, meshes, materials, lights, cameras."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.meshes:
        bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        bpy.data.materials.remove(block)
    for block in bpy.data.lights:
        bpy.data.lights.remove(block)
    for block in bpy.data.cameras:
        bpy.data.cameras.remove(block)


def _setup_render():
    """Configure Eevee for fast RGBA rendering with transparent background."""
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = RENDER_SIZE
    scene.render.resolution_y = RENDER_SIZE
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.eevee.taa_render_samples = 32
    # Blender 5.x renamed GTAO to ambient occlusion settings
    if hasattr(scene.eevee, "use_gtao"):
        scene.eevee.use_gtao = True
        scene.eevee.gtao_distance = 0.4
    if hasattr(scene.eevee, "use_soft_shadows"):
        scene.eevee.use_soft_shadows = True
    # World: very dim ambient so shadows aren't pure black
    world = scene.world
    if world is None:
        world = bpy.data.worlds.new("IconWorld")
        scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.15, 0.16, 0.18, 1.0)
        bg.inputs[1].default_value = 0.6


def _setup_camera():
    """Orthographic 3/4 camera looking down at the origin."""
    cam_data = bpy.data.cameras.new("IconCam")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = 1.4
    cam = bpy.data.objects.new("IconCam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    # 3/4 view: elevated, angled front
    cam.location = (1.6, -1.6, 1.8)
    # Point at origin
    direction = -cam.location.normalized()
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam
    return cam


def _setup_lights():
    """Three-point studio lighting: key + fill + rim."""
    # Key light (warm, upper front-right)
    key_data = bpy.data.lights.new("Key", type="AREA")
    key_data.energy = 25
    key_data.size = 2.0
    key_data.color = (1.0, 0.96, 0.88)
    key = bpy.data.objects.new("Key", key_data)
    key.location = (2.0, -1.5, 2.5)
    key.rotation_euler = (math.radians(40), math.radians(20), math.radians(30))
    bpy.context.scene.collection.objects.link(key)

    # Fill light (cool, lower left)
    fill_data = bpy.data.lights.new("Fill", type="AREA")
    fill_data.energy = 10
    fill_data.size = 2.5
    fill_data.color = (0.80, 0.85, 1.0)
    fill = bpy.data.objects.new("Fill", fill_data)
    fill.location = (-1.8, -1.0, 1.2)
    fill.rotation_euler = (math.radians(50), math.radians(-15), math.radians(-30))
    bpy.context.scene.collection.objects.link(fill)

    # Rim light (back top)
    rim_data = bpy.data.lights.new("Rim", type="AREA")
    rim_data.energy = 15
    rim_data.size = 1.5
    rim_data.color = (1.0, 1.0, 1.0)
    rim = bpy.data.objects.new("Rim", rim_data)
    rim.location = (0.0, 1.8, 2.0)
    rim.rotation_euler = (math.radians(120), 0, 0)
    bpy.context.scene.collection.objects.link(rim)


def _make_material(name, color, roughness=0.6, metallic=0.0, emission=0.0):
    """Create a Principled BSDF material with the given colour + properties."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
        if emission > 0:
            bsdf.inputs["Emission Color"].default_value = color
            bsdf.inputs["Emission Strength"].default_value = emission
    return mat


def _add_obj(mesh, name, material):
    """Link a mesh object with a material into the scene."""
    obj = bpy.data.objects.new(name, mesh)
    obj.data.materials.append(material)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def _shade_smooth(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = True


def _shade_flat(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = False


# ---------------------------------------------------------------------------
# Primitive helpers
# ---------------------------------------------------------------------------

def _ico(radius, subdivisions=1, name="Ico"):
    mesh = bpy.data.meshes.new(name)
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdivisions, radius=radius)
    bm.to_mesh(mesh)
    bm.free()
    return mesh


def _uv_sphere(radius, segments=12, rings=8, name="Sphere"):
    mesh = bpy.data.meshes.new(name)
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segments, v_segments=rings, radius=radius)
    bm.to_mesh(mesh)
    bm.free()
    return mesh


def _cube(size, name="Cube"):
    mesh = bpy.data.meshes.new(name)
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=size)
    bm.to_mesh(mesh)
    bm.free()
    return mesh


def _cylinder(radius, depth, vertices=12, name="Cyl"):
    mesh = bpy.data.meshes.new(name)
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_cone(
        bm, cap_ends=True, segments=vertices, radius1=radius, radius2=radius, depth=depth
    )
    bm.to_mesh(mesh)
    bm.free()
    return mesh


def _torus(major, minor, major_seg=12, minor_seg=6, name="Torus"):
    mesh = bpy.data.meshes.new(name)
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=False, segments=major_seg, radius=major)
    # Extrude to form a torus-ish ring
    bmesh.ops.spin(
        bm, geom=bm.verts[:], axis=(0, 0, 1), steps=minor_seg, angle=math.radians(360),
        dvec=(minor, 0, 0), use_merge=True
    )
    bm.to_mesh(mesh)
    bm.free()
    return mesh


def _jitter_verts(mesh, amount=0.02, seed=0):
    """Deterministic per-vertex jitter for a hand-crafted feel."""
    import random
    rng = random.Random(seed)
    for v in mesh.vertices:
        v.co.x += rng.uniform(-amount, amount)
        v.co.y += rng.uniform(-amount, amount)
        v.co.z += rng.uniform(-amount, amount)


# ---------------------------------------------------------------------------
# Batch 1: Beads
# ---------------------------------------------------------------------------

def _bead_sphere(color, radius=0.38, roughness=0.55, metallic=0.0, emission=0.0,
                 jitter=0.0, seed=0, smooth=True, name="Bead"):
    """A simple bead: UV sphere with a drilled hole through it."""
    mat = _make_material(f"{name}_mat", color, roughness=roughness,
                         metallic=metallic, emission=emission)
    mesh = _uv_sphere(radius, segments=14, rings=10, name=name)
    if jitter > 0:
        _jitter_verts(mesh, jitter, seed)
    obj = _add_obj(mesh, name, mat)
    if smooth:
        _shade_smooth(obj)
    else:
        _shade_flat(obj)
    # Drill hole: small dark cylinder through the bead (boolean)
    hole_mesh = _cylinder(radius * 0.12, radius * 3.0, vertices=8, name=f"{name}_hole")
    hole_mat = _make_material(f"{name}_hole_mat", (0.05, 0.04, 0.04, 1.0), roughness=0.9)
    hole_obj = _add_obj(hole_mesh, f"{name}_hole", hole_mat)
    hole_obj.rotation_euler = (0, math.radians(90), 0)
    # Boolean difference
    bool_mod = obj.modifiers.new("Drill", "BOOLEAN")
    bool_mod.operation = "DIFFERENCE"
    bool_mod.object = hole_obj
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier="Drill")
    bpy.data.objects.remove(hole_obj, do_unlink=True)
    return obj


def model_ember_bead():
    """Warm orange bead with a faint glow."""
    obj = _bead_sphere(C["ember_orange"], radius=0.36, roughness=0.35,
                       emission=0.8, smooth=True, name="EmberBead")
    return [obj]


def model_gust_bead():
    """Pale, feather-light bead."""
    obj = _bead_sphere(C["gust_white"], radius=0.34, roughness=0.45,
                       jitter=0.015, seed=1, smooth=True, name="GustBead")
    return [obj]


def model_wit_bead():
    """Dark slate bead, faceted (low-poly icosphere)."""
    mat = _make_material("WitBead_mat", C["wit_slate"], roughness=0.4)
    mesh = _ico(0.36, subdivisions=1, name="WitBead")
    obj = _add_obj(mesh, "WitBead", mat)
    _shade_flat(obj)
    return [obj]


def model_writ_bead():
    """Formal blue bead with a small wax seal dot."""
    obj = _bead_sphere(C["writ_blue"], radius=0.36, roughness=0.3, smooth=True, name="WritBead")
    # Wax seal dot on the front
    seal_mat = _make_material("WritSeal_mat", C["wax_red"], roughness=0.3)
    seal_mesh = _uv_sphere(0.08, segments=8, rings=6, name="WritSeal")
    seal_obj = _add_obj(seal_mesh, "WritSeal", seal_mat)
    seal_obj.location = (0, -0.34, 0.05)
    _shade_smooth(seal_obj)
    return [obj, seal_obj]


def model_tide_bead():
    """Cool teal bead, smooth and slightly glossy."""
    obj = _bead_sphere(C["tide_teal"], radius=0.36, roughness=0.2, smooth=True, name="TideBead")
    return [obj]


def model_loam_bead():
    """Earthy brown bead, rough surface."""
    obj = _bead_sphere(C["loam_brown"], radius=0.36, roughness=0.85,
                       jitter=0.025, seed=2, smooth=False, name="LoamBead")
    return [obj]


def model_bone_bead():
    """Carved bone bead, faceted icosphere."""
    mat = _make_material("BoneBead_mat", C["bone"], roughness=0.5)
    mesh = _ico(0.34, subdivisions=1, name="BoneBead")
    _jitter_verts(mesh, 0.015, seed=3)
    obj = _add_obj(mesh, "BoneBead", mat)
    _shade_flat(obj)
    return [obj]


def model_grave_bead():
    """Dark matte black bead that swallows light."""
    obj = _bead_sphere(C["grave_black"], radius=0.36, roughness=0.95,
                       smooth=True, name="GraveBead")
    return [obj]


def model_prayer_bead():
    """Wooden bead with a carved groove around the middle."""
    obj = _bead_sphere(C["prayer_wood"], radius=0.36, roughness=0.7,
                       smooth=True, name="PrayerBead")
    # Groove: thin torus around the equator (boolean difference)
    groove_mesh = _torus(0.37, 0.04, major_seg=16, minor_seg=4, name="Groove")
    groove_mat = _make_material("Groove_mat", C["wood_dark"], roughness=0.8)
    groove_obj = _add_obj(groove_mesh, "Groove", groove_mat)
    groove_obj.rotation_euler = (math.radians(90), 0, 0)
    bool_mod = obj.modifiers.new("Groove", "BOOLEAN")
    bool_mod.operation = "DIFFERENCE"
    bool_mod.object = groove_obj
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier="Groove")
    bpy.data.objects.remove(groove_obj, do_unlink=True)
    return [obj]


def model_raw_bead():
    """Rough unfired clay bead, uneven surface."""
    obj = _bead_sphere(C["clay"], radius=0.36, roughness=0.9,
                       jitter=0.035, seed=4, smooth=False, name="RawBead")
    return [obj]


def model_fired_bead():
    """Glazed terracotta bead, smooth and slightly shiny."""
    obj = _bead_sphere(C["terracotta"], radius=0.36, roughness=0.15,
                       smooth=True, name="FiredBead")
    return [obj]


def model_bead_clay():
    """A lump of raw clay (irregular, not yet shaped into a bead)."""
    mat = _make_material("ClayLump_mat", C["clay"], roughness=0.95)
    mesh = _ico(0.34, subdivisions=2, name="ClayLump")
    _jitter_verts(mesh, 0.06, seed=5)
    obj = _add_obj(mesh, "ClayLump", mat)
    _shade_flat(obj)
    return [obj]


def model_bead_drill():
    """A small hand-drill tool for making beads: wooden handle + metal bit."""
    # Handle
    handle_mat = _make_material("DrillHandle_mat", C["wood"], roughness=0.7)
    handle_mesh = _cylinder(0.08, 0.5, vertices=8, name="DrillHandle")
    handle_obj = _add_obj(handle_mesh, "DrillHandle", handle_mat)
    handle_obj.location = (0, 0, 0.25)
    handle_obj.rotation_euler = (math.radians(30), 0, 0)
    _shade_smooth(handle_obj)

    # Metal bit
    bit_mat = _make_material("DrillBit_mat", C["steel"], roughness=0.3, metallic=0.8)
    bit_mesh = _cylinder(0.03, 0.35, vertices=6, name="DrillBit")
    bit_obj = _add_obj(bit_mesh, "DrillBit", bit_mat)
    bit_obj.location = (0, 0, -0.15)
    bit_obj.rotation_euler = (math.radians(30), 0, 0)
    _shade_smooth(bit_obj)

    # Bow string crossbar
    bow_mat = _make_material("DrillBow_mat", C["wood_light"], roughness=0.6)
    bow_mesh = _cylinder(0.015, 0.4, vertices=5, name="DrillBow")
    bow_obj = _add_obj(bow_mesh, "DrillBow", bow_mat)
    bow_obj.location = (0, 0, 0.45)
    bow_obj.rotation_euler = (0, math.radians(90), 0)
    _shade_smooth(bow_obj)

    return [handle_obj, bit_obj, bow_obj]


# ---------------------------------------------------------------------------
# Batch 2: Pouches & Containers
# ---------------------------------------------------------------------------

def _pouch_body(color, radius=0.42, height=0.55, roughness=0.75, name="Pouch"):
    """A drawstring pouch body: UV sphere squashed vertically, top flattened."""
    mat = _make_material(f"{name}_mat", color, roughness=roughness)
    mesh = _uv_sphere(radius, segments=16, rings=12, name=name)
    # Squash vertically and stretch downward
    for v in mesh.vertices:
        v.co.z *= height / radius
        # Flatten the top slightly (cinch area)
        if v.co.z > height * 0.6:
            v.co.z = height * 0.6 + (v.co.z - height * 0.6) * 0.3
        # Round the bottom
        if v.co.z < -height * 0.5:
            v.co.z *= 0.9
    obj = _add_obj(mesh, name, mat)
    _shade_smooth(obj)
    return obj


def _drawstring_cord(color, radius=0.42, height=0.55, name="Cord"):
    """A thin cord looped around the pouch neck."""
    mat = _make_material(f"{name}_mat", color, roughness=0.6)
    mesh = _torus(radius * 0.7, 0.018, major_seg=20, minor_seg=4, name=name)
    obj = _add_obj(mesh, name, mat)
    obj.location = (0, 0, height * 0.55)
    obj.rotation_euler = (math.radians(90), 0, 0)
    _shade_smooth(obj)
    return obj


def _toggle(color, x, z, name="Toggle"):
    """A small bone/wood toggle bead on a cord."""
    mat = _make_material(f"{name}_mat", color, roughness=0.5)
    mesh = _cylinder(0.04, 0.1, vertices=6, name=name)
    obj = _add_obj(mesh, name, mat)
    obj.location = (x, -0.35, z)
    obj.rotation_euler = (math.radians(80), 0, math.radians(15))
    _shade_smooth(obj)
    return obj


def model_false_bottom_pouch():
    """A small leather pouch with a cunning false bottom — slightly lumpy."""
    body = _pouch_body(C["leather"], radius=0.38, height=0.48, roughness=0.8,
                       name="FalseBottomPouch")
    _jitter_verts(body.data, 0.015, seed=10)
    cord = _drawstring_cord(C["sinew"], radius=0.38, height=0.48, name="FBCord")
    # A subtle seam line showing the false bottom compartment
    seam_mat = _make_material("FBSeam_mat", C["wood_dark"], roughness=0.85)
    seam_mesh = _torus(0.36, 0.008, major_seg=16, minor_seg=3, name="FBSeam")
    seam_obj = _add_obj(seam_mesh, "FBSeam", seam_mat)
    seam_obj.location = (0, 0, -0.05)
    seam_obj.rotation_euler = (math.radians(90), 0, 0)
    _shade_smooth(seam_obj)
    return [body, cord, seam_obj]


def model_threadbare_bead_pouch():
    """A worn, patched leather pouch — the starter bead container."""
    body = _pouch_body(C["leather"], radius=0.40, height=0.50, roughness=0.9,
                       name="ThreadbarePouch")
    _jitter_verts(body.data, 0.02, seed=11)
    cord = _drawstring_cord(C["sinew"], radius=0.40, height=0.50, name="TBCord")
    # Patch stitch: a thin darker line across the body
    stitch_mat = _make_material("TBPatch_mat", C["wood_dark"], roughness=0.85)
    stitch_mesh = _cylinder(0.01, 0.3, vertices=4, name="TBPatch")
    stitch_obj = _add_obj(stitch_mesh, "TBPatch", stitch_mat)
    stitch_obj.location = (0, -0.30, -0.05)
    stitch_obj.rotation_euler = (math.radians(90), 0, 0)
    _shade_smooth(stitch_obj)
    return [body, cord, stitch_obj]


def model_waxed_bead_pouch():
    """A weatherproof pouch sealed with candlewax — slightly glossy."""
    body = _pouch_body(C["leather"], radius=0.40, height=0.52, roughness=0.25,
                       name="WaxedPouch")
    cord = _drawstring_cord(C["sinew"], radius=0.40, height=0.52, name="WaxCord")
    # Wax drip at the neck
    wax_mat = _make_material("WaxDrip_mat", C["wax_red"], roughness=0.2)
    wax_mesh = _uv_sphere(0.05, segments=8, rings=6, name="WaxDrip")
    wax_obj = _add_obj(wax_mesh, "WaxDrip", wax_mat)
    wax_obj.location = (0.12, -0.32, 0.28)
    wax_obj.scale = (1, 1, 1.5)
    _shade_smooth(wax_obj)
    return [body, cord, wax_obj]


def model_warden_bead_pouch():
    """An official licensed pouch with a warden seal clasp."""
    body = _pouch_body(C["cloth"], radius=0.40, height=0.52, roughness=0.55,
                       name="WardenPouch")
    cord = _drawstring_cord(C["sinew"], radius=0.40, height=0.52, name="WPCord")
    # Warden seal clasp: a small medallion on the front
    seal_mat = _make_material("WPSeal_mat", C["silver"], roughness=0.2, metallic=0.9)
    seal_mesh = _cylinder(0.08, 0.03, vertices=16, name="WPSeal")
    seal_obj = _add_obj(seal_mesh, "WPSeal", seal_mat)
    seal_obj.location = (0, -0.38, 0.12)
    seal_obj.rotation_euler = (math.radians(90), 0, 0)
    _shade_smooth(seal_obj)
    # Engraved dot in the center
    dot_mat = _make_material("WPDot_mat", C["steel"], roughness=0.3, metallic=0.8)
    dot_mesh = _uv_sphere(0.02, segments=6, rings=4, name="WPDot")
    dot_obj = _add_obj(dot_mesh, "WPDot", dot_mat)
    dot_obj.location = (0, -0.40, 0.12)
    _shade_smooth(dot_obj)
    return [body, cord, seal_obj, dot_obj]


def model_grave_bead_pouch():
    """A dark crypt-runner pouch with bone toggles and black cord."""
    body = _pouch_body(C["grave_black"], radius=0.40, height=0.50, roughness=0.85,
                       name="GravePouch")
    cord = _drawstring_cord(C["grave_black"], radius=0.40, height=0.50, name="GPCord")
    # Two bone toggles hanging from the cord
    t1 = _toggle(C["bone"], 0.12, 0.20, name="GPToggle1")
    t2 = _toggle(C["bone"], -0.10, 0.18, name="GPToggle2")
    return [body, cord, t1, t2]


def model_starfall_bead_pouch():
    """An endgame omni-pouch with silver clasps and a meteor-dust sheen."""
    body = _pouch_body(C["cloth"], radius=0.40, height=0.52, roughness=0.15,
                       name="StarfallPouch")
    # Subtle emissive sheen
    body.data.materials[0].node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 0.15
    body.data.materials[0].node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (0.5, 0.7, 0.7, 1.0)
    cord = _drawstring_cord(C["silver"], radius=0.40, height=0.52, name="SPCord")
    # Silver clasp brackets on either side
    clasp_mat = _make_material("SPClasp_mat", C["silver"], roughness=0.1, metallic=1.0)
    for i, x in enumerate([0.14, -0.14]):
        clasp_mesh = _cylinder(0.025, 0.12, vertices=8, name=f"SPClasp{i}")
        clasp_obj = _add_obj(clasp_mesh, f"SPClasp{i}", clasp_mat)
        clasp_obj.location = (x, -0.36, 0.10)
        clasp_obj.rotation_euler = (math.radians(90), 0, 0)
        _shade_smooth(clasp_obj)
    # Small glowing gem at the center
    gem_mat = _make_material("SPGem_mat", (0.4, 0.8, 0.75, 1.0), roughness=0.0,
                             metallic=0.0, emission=1.2)
    gem_mesh = _ico(0.04, subdivisions=1, name="SPGem")
    gem_obj = _add_obj(gem_mesh, "SPGem", gem_mat)
    gem_obj.location = (0, -0.39, 0.12)
    _shade_flat(gem_obj)
    return [body, cord, gem_obj]


def model_threadbare_tool_roll():
    """A worn leather tool roll — a flat cylinder lying on its side, tied."""
    # Main roll body
    roll_mat = _make_material("ToolRoll_mat", C["leather"], roughness=0.85)
    roll_mesh = _cylinder(0.28, 0.55, vertices=14, name="ToolRoll")
    roll_obj = _add_obj(roll_mesh, "ToolRoll", roll_mat)
    roll_obj.rotation_euler = (0, math.radians(90), 0)
    roll_obj.location = (0, 0, -0.05)
    _shade_smooth(roll_obj)
    _jitter_verts(roll_obj.data, 0.01, seed=12)

    # Tie cord wrapping around the roll
    tie_mat = _make_material("ToolTie_mat", C["sinew"], roughness=0.6)
    for i, z in enumerate([0.05, -0.15]):
        tie_mesh = _torus(0.29, 0.015, major_seg=16, minor_seg=4, name=f"ToolTie{i}")
        tie_obj = _add_obj(tie_mesh, f"ToolTie{i}", tie_mat)
        tie_obj.location = (0, 0, z)
        tie_obj.rotation_euler = (0, math.radians(90), 0)
        _shade_smooth(tie_obj)

    # A tool handle peeking out one end
    handle_mat = _make_material("ToolHandle_mat", C["wood"], roughness=0.7)
    handle_mesh = _cylinder(0.04, 0.15, vertices=6, name="ToolHandle")
    handle_obj = _add_obj(handle_mesh, "ToolHandle", handle_mat)
    handle_obj.location = (0.28, 0, 0.08)
    handle_obj.rotation_euler = (0, math.radians(90), 0)
    _shade_smooth(handle_obj)

    return [roll_obj, handle_obj]


# ---------------------------------------------------------------------------
# Batch 3: Ores, Ingots & Metals
# ---------------------------------------------------------------------------

def _rock_lump(color, radius=0.38, roughness=0.95, jitter=0.05, seed=0, name="Rock"):
    """An irregular rocky lump — low-poly icosphere with heavy jitter."""
    mat = _make_material(f"{name}_mat", color, roughness=roughness)
    mesh = _ico(radius, subdivisions=2, name=name)
    _jitter_verts(mesh, jitter, seed)
    obj = _add_obj(mesh, name, mat)
    _shade_flat(obj)
    return obj


def _ore_with_veins(base_color, vein_color, radius=0.38, seed=0, name="Ore"):
    """A rock lump with visible metal veins (small bright dots on the surface)."""
    rock = _rock_lump(base_color, radius=radius, roughness=0.95, jitter=0.05,
                      seed=seed, name=name)
    # Add small bright vein bumps on the surface
    import random
    rng = random.Random(seed + 100)
    vein_mat = _make_material(f"{name}_vein_mat", vein_color, roughness=0.3,
                              metallic=0.7)
    veins = []
    for _ in range(6):
        v_mesh = _uv_sphere(0.04, segments=6, rings=4, name=f"{name}_vein")
        v_obj = _add_obj(v_mesh, f"{name}_vein", vein_mat)
        # Place on the upper hemisphere of the rock
        angle = rng.uniform(0, math.radians(360))
        elev = rng.uniform(0.1, 0.35)
        v_obj.location = (
            math.cos(angle) * radius * 0.9,
            math.sin(angle) * radius * 0.9,
            elev,
        )
        _shade_smooth(v_obj)
        veins.append(v_obj)
    return [rock] + veins


def _ingot(color, roughness=0.4, metallic=0.8, name="Ingot"):
    """A trapezoidal ingot bar."""
    mat = _make_material(f"{name}_mat", color, roughness=roughness, metallic=metallic)
    mesh = _cube(1.0, name=name)
    # Scale into an ingot shape: long, narrow, slightly tapered
    obj = _add_obj(mesh, name, mat)
    obj.scale = (0.5, 0.22, 0.12)
    # Taper the top: select top vertices and scale in X/Y
    for v in mesh.vertices:
        if v.co.z > 0.3:
            v.co.x *= 0.85
            v.co.y *= 0.8
    _shade_flat(obj)
    return obj


def model_copper_ore():
    """A chunk of greenish copper ore with bright copper veins."""
    return _ore_with_veins((0.35, 0.40, 0.30, 1.0), C["copper"],
                           radius=0.38, seed=20, name="CopperOre")


def model_tin_ore():
    """A pale grey stone with silvery tin veins."""
    return _ore_with_veins((0.42, 0.43, 0.44, 1.0), C["silver"],
                           radius=0.36, seed=21, name="TinOre")


def model_iron_ore():
    """A heavy dark lump of iron ore with dark metallic veins."""
    return _ore_with_veins((0.28, 0.25, 0.22, 1.0), C["iron"],
                           radius=0.40, seed=22, name="IronOre")


def model_tinstone():
    """A pale grey stone with tin veins — flatter than tin_ore."""
    rock = _rock_lump((0.45, 0.46, 0.47, 1.0), radius=0.36, roughness=0.95,
                      jitter=0.04, seed=23, name="Tinstone")
    rock.scale = (1.0, 1.0, 0.7)
    # A couple of visible tin spots
    vein_mat = _make_material("Tinstone_vein_mat", C["silver"], roughness=0.3,
                              metallic=0.7)
    spots = []
    for i, (x, y, z) in enumerate([(0.15, 0.1, 0.15), (-0.1, -0.15, 0.1), (0.05, -0.2, 0.2)]):
        s_mesh = _uv_sphere(0.035, segments=6, rings=4, name=f"TinSpot{i}")
        s_obj = _add_obj(s_mesh, f"TinSpot{i}", vein_mat)
        s_obj.location = (x, y, z)
        _shade_smooth(s_obj)
        spots.append(s_obj)
    return [rock] + spots


def model_pig_iron_ore():
    """A dark, heavy ore that smells of old forges — rough and pitted."""
    return _ore_with_veins((0.20, 0.18, 0.16, 1.0), (0.35, 0.30, 0.25, 1.0),
                           radius=0.40, seed=24, name="PigIronOre")


def model_pig_iron_scrap():
    """A rough scrap of pig iron — a jagged flat shard."""
    mat = _make_material("PigScrap_mat", (0.32, 0.28, 0.24, 1.0), roughness=0.85,
                         metallic=0.6)
    mesh = _cube(0.5, name="PigScrap")
    _jitter_verts(mesh, 0.08, seed=25)
    obj = _add_obj(mesh, "PigScrap", mat)
    obj.scale = (0.6, 0.35, 0.08)
    obj.rotation_euler = (0, math.radians(15), math.radians(10))
    _shade_flat(obj)
    return [obj]


def model_pig_iron_scrap_bundle():
    """A bundle of pig iron scraps tied with cord."""
    pieces = []
    scrap_mat = _make_material("PigBundle_mat", (0.32, 0.28, 0.24, 1.0),
                               roughness=0.85, metallic=0.6)
    for i in range(3):
        mesh = _cube(0.35, name=f"PigBundlePiece{i}")
        _jitter_verts(mesh, 0.06, seed=26 + i)
        obj = _add_obj(mesh, f"PigBundlePiece{i}", scrap_mat)
        obj.scale = (0.5, 0.25, 0.06)
        obj.rotation_euler = (0, math.radians(10 + i * 5), math.radians(-15 + i * 15))
        obj.location = (0, -0.05 * i, 0.05 * i)
        _shade_flat(obj)
        pieces.append(obj)
    # Tie cord
    tie_mat = _make_material("PigBundleTie_mat", C["sinew"], roughness=0.6)
    tie_mesh = _torus(0.25, 0.015, major_seg=12, minor_seg=4, name="PigBundleTie")
    tie_obj = _add_obj(tie_mesh, "PigBundleTie", tie_mat)
    tie_obj.rotation_euler = (math.radians(90), 0, 0)
    tie_obj.location = (0, 0, 0.0)
    _shade_smooth(tie_obj)
    return pieces + [tie_obj]


def model_pig_iron_hammer():
    """A heavy pig iron hammer for rough forging."""
    # Head
    head_mat = _make_material("PigHammerHead_mat", (0.32, 0.28, 0.24, 1.0),
                              roughness=0.7, metallic=0.7)
    head_mesh = _cube(0.4, name="PigHammerHead")
    obj_head = _add_obj(head_mesh, "PigHammerHead", head_mat)
    obj_head.scale = (0.35, 0.18, 0.15)
    obj_head.location = (0, 0, 0.25)
    _shade_flat(obj_head)

    # Handle
    handle_mat = _make_material("PigHammerHandle_mat", C["wood_dark"], roughness=0.75)
    handle_mesh = _cylinder(0.04, 0.5, vertices=8, name="PigHammerHandle")
    obj_handle = _add_obj(handle_mesh, "PigHammerHandle", handle_mat)
    obj_handle.location = (0, 0, -0.05)
    obj_handle.rotation_euler = (math.radians(15), 0, 0)
    _shade_smooth(obj_handle)

    return [obj_head, obj_handle]


def model_pennywrought_ingot():
    """A small ingot of pennywrought copper — warm brown-gold."""
    ingot = _ingot((0.62, 0.40, 0.18, 1.0), roughness=0.35, metallic=0.85,
                   name="PennywroughtIngot")
    ingot.rotation_euler = (0, 0, math.radians(20))
    return [ingot]


def model_pennywrought_axe():
    """A first real axe — copper-brown head + wooden handle."""
    # Handle
    handle_mat = _make_material("PAxeHandle_mat", C["wood"], roughness=0.7)
    handle_mesh = _cylinder(0.035, 0.7, vertices=8, name="PAxeHandle")
    handle_obj = _add_obj(handle_mesh, "PAxeHandle", handle_mat)
    handle_obj.rotation_euler = (math.radians(90), 0, 0)
    handle_obj.location = (0, 0, -0.05)
    _shade_smooth(handle_obj)

    # Axe head — a wedge shape
    head_mat = _make_material("PAxeHead_mat", (0.62, 0.40, 0.18, 1.0),
                              roughness=0.4, metallic=0.8)
    head_mesh = _cube(0.35, name="PAxeHead")
    head_obj = _add_obj(head_mesh, "PAxeHead", head_mat)
    head_obj.scale = (0.22, 0.12, 0.18)
    head_obj.location = (0.12, 0, 0.15)
    # Taper the blade edge
    for v in head_mesh.vertices:
        if v.co.x > 0.3:
            v.co.y *= 0.3
    _shade_flat(head_obj)

    return [handle_obj, head_obj]


def model_pennywrought_pickaxe():
    """A cheap pickaxe with a copper-brown head and a stubborn point."""
    # Handle
    handle_mat = _make_material("PPickHandle_mat", C["wood"], roughness=0.7)
    handle_mesh = _cylinder(0.035, 0.65, vertices=8, name="PPickHandle")
    handle_obj = _add_obj(handle_mesh, "PPickHandle", handle_mat)
    handle_obj.rotation_euler = (math.radians(90), 0, 0)
    _shade_smooth(handle_obj)

    # Pick head — a double-pointed horizontal bar
    head_mat = _make_material("PPickHead_mat", (0.62, 0.40, 0.18, 1.0),
                              roughness=0.4, metallic=0.8)
    head_mesh = _cube(0.5, name="PPickHead")
    head_obj = _add_obj(head_mesh, "PPickHead", head_mat)
    head_obj.scale = (0.35, 0.08, 0.08)
    head_obj.location = (0, 0, 0.15)
    # Taper both ends to points
    for v in head_mesh.vertices:
        if abs(v.co.x) > 0.3:
            v.co.y *= 0.2
            v.co.z *= 0.5
    _shade_flat(head_obj)

    return [handle_obj, head_obj]


def model_penny_copper_ore():
    """A chunk of copper ore with a dull penny-brown sheen."""
    return _ore_with_veins((0.38, 0.30, 0.20, 1.0), (0.55, 0.38, 0.20, 1.0),
                           radius=0.36, seed=27, name="PennyCopperOre")


def model_penny_arrowheads():
    """Small copper arrowheads — a few stacked triangular points."""
    mat = _make_material("PArrow_mat", (0.62, 0.40, 0.18, 1.0),
                         roughness=0.4, metallic=0.8)
    pieces = []
    for i, (x, y, z, rot) in enumerate([
        (-0.08, -0.05, 0.0, 0),
        (0.06, 0.03, 0.04, math.radians(15)),
        (0.0, -0.08, 0.08, math.radians(-10)),
    ]):
        mesh = _cube(0.18, name=f"PArrow{i}")
        obj = _add_obj(mesh, f"PArrow{i}", mat)
        obj.scale = (0.5, 0.12, 0.05)
        obj.location = (x, y, z)
        obj.rotation_euler = (0, math.radians(30), rot)
        # Taper to a point
        for v in mesh.vertices:
            if v.co.x > 0.3:
                v.co.y *= 0.1
                v.co.z *= 0.3
        _shade_flat(obj)
        pieces.append(obj)
    return pieces


def model_bronze_bar():
    """A bar of bronze, warm and slightly green at the edges."""
    bar = _ingot((0.65, 0.48, 0.24, 1.0), roughness=0.35, metallic=0.85,
                 name="BronzeBar")
    bar.rotation_euler = (0, 0, math.radians(15))
    # Greenish tint at edges (patina) — two small flat bits on the ends
    patina_mat = _make_material("BronzePatina_mat", (0.35, 0.45, 0.30, 1.0),
                                roughness=0.6)
    for i, x in enumerate([0.42, -0.42]):
        p_mesh = _cube(0.08, name=f"BronzePatina{i}")
        p_obj = _add_obj(p_mesh, f"BronzePatina{i}", patina_mat)
        p_obj.scale = (0.08, 0.18, 0.1)
        p_obj.location = (x, 0, 0)
        _shade_flat(p_obj)
    return [bar]


def model_tin_badge():
    """A small tin badge proving warden affiliation — a flat disc with a pin."""
    badge_mat = _make_material("TinBadge_mat", C["silver"], roughness=0.25,
                               metallic=0.9)
    badge_mesh = _cylinder(0.22, 0.03, vertices=16, name="TinBadge")
    badge_obj = _add_obj(badge_mesh, "TinBadge", badge_mat)
    badge_obj.rotation_euler = (math.radians(60), 0, math.radians(20))
    _shade_smooth(badge_obj)

    # Engraved star/cross on the front
    engrave_mat = _make_material("TinBadgeEngr_mat", C["steel"], roughness=0.3,
                                 metallic=0.8)
    for i in range(4):
        a = math.radians(i * 90)
        bar_mesh = _cube(0.15, name=f"TinBadgeBar{i}")
        bar_obj = _add_obj(bar_mesh, f"TinBadgeBar{i}", engrave_mat)
        bar_obj.scale = (0.4, 0.06, 0.05)
        bar_obj.location = (
            math.cos(a) * 0.12,
            math.sin(a) * 0.12,
            0.02,
        )
        bar_obj.rotation_euler = (0, 0, a)
        _shade_flat(bar_obj)

    return [badge_obj]


def model_foundry_token():
    """A stamped iron token earned for working the foundry."""
    token_mat = _make_material("FoundryToken_mat", C["iron"], roughness=0.4,
                               metallic=0.8)
    token_mesh = _cylinder(0.24, 0.04, vertices=20, name="FoundryToken")
    token_obj = _add_obj(token_mesh, "FoundryToken", token_mat)
    token_obj.rotation_euler = (math.radians(55), 0, math.radians(15))
    _shade_smooth(token_obj)

    # Stamped mark: a small raised square in the center
    stamp_mat = _make_material("FoundryTokenStamp_mat", C["steel"], roughness=0.3,
                               metallic=0.9)
    stamp_mesh = _cube(0.08, name="FoundryTokenStamp")
    stamp_obj = _add_obj(stamp_mesh, "FoundryTokenStamp", stamp_mat)
    stamp_obj.scale = (0.5, 0.5, 0.08)
    stamp_obj.location = (0, 0, 0.03)
    _shade_flat(stamp_obj)

    return [token_obj, stamp_obj]


# ---------------------------------------------------------------------------
# Batch 4: Food & Cooking
# ---------------------------------------------------------------------------

def _loaf(color, roughness=0.8, name="Loaf"):
    """A bread loaf — an elongated sphere with a slit on top."""
    mat = _make_material(f"{name}_mat", color, roughness=roughness)
    mesh = _uv_sphere(0.32, segments=14, rings=10, name=name)
    # Stretch into a loaf shape
    for v in mesh.vertices:
        v.co.x *= 1.5
        v.co.z *= 0.7
    obj = _add_obj(mesh, name, mat)
    _shade_smooth(obj)
    # Slit on top
    slit_mat = _make_material(f"{name}_slit_mat", (0.35, 0.22, 0.10, 1.0), roughness=0.9)
    slit_mesh = _cube(0.3, name=f"{name}_slit")
    slit_obj = _add_obj(slit_mesh, f"{name}_slit", slit_mat)
    slit_obj.scale = (0.6, 0.04, 0.03)
    slit_obj.location = (0, 0, 0.2)
    _shade_flat(slit_obj)
    return [obj, slit_obj]


def model_bread():
    """A simple baked loaf — golden brown."""
    return _loaf((0.72, 0.52, 0.28, 1.0), roughness=0.75, name="Bread")


def model_crusty_loaf():
    """A stale crusty loaf — darker, rougher."""
    loaf_objs = _loaf((0.58, 0.40, 0.20, 1.0), roughness=0.95, name="CrustyLoaf")
    _jitter_verts(loaf_objs[0].data, 0.015, seed=30)
    return loaf_objs


def model_bellbread():
    """A warm loaf baked to the sound of the market bell — slightly glossy."""
    loaf_objs = _loaf((0.78, 0.58, 0.32, 1.0), roughness=0.5, name="Bellbread")
    # A small bell-shaped scoring on top
    return loaf_objs


def model_raw_fish():
    """A small raw fish — elongated body with a tail fin."""
    mat = _make_material("RawFish_mat", (0.55, 0.58, 0.62, 1.0), roughness=0.3)
    mesh = _uv_sphere(0.22, segments=12, rings=8, name="RawFish")
    for v in mesh.vertices:
        v.co.x *= 2.0
        v.co.z *= 0.6
        # Taper the tail end
        if v.co.x < -0.2:
            v.co.y *= 0.3
    obj = _add_obj(mesh, "RawFish", mat)
    obj.rotation_euler = (0, math.radians(20), math.radians(90))
    _shade_smooth(obj)
    # Tail fin
    fin_mat = _make_material("RawFishFin_mat", (0.45, 0.48, 0.52, 1.0), roughness=0.4)
    fin_mesh = _cube(0.15, name="RawFishFin")
    fin_obj = _add_obj(fin_mesh, "RawFishFin", fin_mat)
    fin_obj.scale = (0.06, 0.25, 0.03)
    fin_obj.location = (-0.42, 0, 0)
    fin_obj.rotation_euler = (0, math.radians(20), math.radians(90))
    _shade_flat(fin_obj)
    # Eye
    eye_mat = _make_material("RawFishEye_mat", (0.1, 0.1, 0.1, 1.0), roughness=0.2)
    eye_mesh = _uv_sphere(0.025, segments=6, rings=4, name="RawFishEye")
    eye_obj = _add_obj(eye_mesh, "RawFishEye", eye_mat)
    eye_obj.location = (0.32, 0.12, 0.04)
    eye_obj.rotation_euler = (0, math.radians(20), math.radians(90))
    _shade_smooth(eye_obj)
    return [obj, fin_obj, eye_obj]


def model_cooked_fish():
    """A basic cooked fish — warmer brown tones, flaky edges."""
    mat = _make_material("CookedFish_mat", (0.68, 0.48, 0.28, 1.0), roughness=0.55)
    mesh = _uv_sphere(0.22, segments=12, rings=8, name="CookedFish")
    for v in mesh.vertices:
        v.co.x *= 2.0
        v.co.z *= 0.6
        if v.co.x < -0.2:
            v.co.y *= 0.3
    obj = _add_obj(mesh, "CookedFish", mat)
    obj.rotation_euler = (0, math.radians(20), math.radians(90))
    _shade_smooth(obj)
    # Tail fin
    fin_mat = _make_material("CookedFishFin_mat", (0.55, 0.38, 0.20, 1.0), roughness=0.6)
    fin_mesh = _cube(0.15, name="CookedFishFin")
    fin_obj = _add_obj(fin_mesh, "CookedFishFin", fin_mat)
    fin_obj.scale = (0.06, 0.25, 0.03)
    fin_obj.location = (-0.42, 0, 0)
    fin_obj.rotation_euler = (0, math.radians(20), math.radians(90))
    _shade_flat(fin_obj)
    return [obj, fin_obj]


def model_burnt_fish():
    """Charred enough to teach a lesson — dark and cracked."""
    mat = _make_material("BurntFish_mat", (0.15, 0.12, 0.10, 1.0), roughness=0.95)
    mesh = _uv_sphere(0.22, segments=12, rings=8, name="BurntFish")
    for v in mesh.vertices:
        v.co.x *= 2.0
        v.co.z *= 0.6
        if v.co.x < -0.2:
            v.co.y *= 0.3
    _jitter_verts(mesh, 0.02, seed=31)
    obj = _add_obj(mesh, "BurntFish", mat)
    obj.rotation_euler = (0, math.radians(20), math.radians(90))
    _shade_flat(obj)
    # Tail fin
    fin_mat = _make_material("BurntFishFin_mat", (0.10, 0.08, 0.06, 1.0), roughness=0.95)
    fin_mesh = _cube(0.15, name="BurntFishFin")
    fin_obj = _add_obj(fin_mesh, "BurntFishFin", fin_mat)
    fin_obj.scale = (0.06, 0.25, 0.03)
    fin_obj.location = (-0.42, 0, 0)
    fin_obj.rotation_euler = (0, math.radians(20), math.radians(90))
    _shade_flat(fin_obj)
    return [obj, fin_obj]


def model_raw_tinfin():
    """A silvery river fish with tough scales."""
    mat = _make_material("RawTinfin_mat", (0.60, 0.62, 0.65, 1.0), roughness=0.2,
                         metallic=0.4)
    mesh = _uv_sphere(0.24, segments=14, rings=10, name="RawTinfin")
    for v in mesh.vertices:
        v.co.x *= 2.2
        v.co.z *= 0.55
        if v.co.x < -0.2:
            v.co.y *= 0.25
    obj = _add_obj(mesh, "RawTinfin", mat)
    obj.rotation_euler = (0, math.radians(15), math.radians(90))
    _shade_smooth(obj)
    # Scales: small overlapping dots along the body
    scale_mat = _make_material("TinfinScale_mat", (0.70, 0.72, 0.75, 1.0),
                               roughness=0.15, metallic=0.5)
    scales = []
    import random
    rng = random.Random(32)
    for _ in range(8):
        s_mesh = _uv_sphere(0.02, segments=4, rings=3, name="TinfinScale")
        s_obj = _add_obj(s_mesh, "TinfinScale", scale_mat)
        s_obj.location = (
            rng.uniform(-0.3, 0.3),
            rng.uniform(-0.12, 0.12),
            rng.uniform(0.05, 0.15),
        )
        _shade_smooth(s_obj)
        scales.append(s_obj)
    # Tail fin
    fin_mat = _make_material("TinfinFin_mat", (0.50, 0.52, 0.55, 1.0), roughness=0.3)
    fin_mesh = _cube(0.18, name="TinfinFin")
    fin_obj = _add_obj(fin_mesh, "TinfinFin", fin_mat)
    fin_obj.scale = (0.05, 0.28, 0.03)
    fin_obj.location = (-0.48, 0, 0)
    fin_obj.rotation_euler = (0, math.radians(15), math.radians(90))
    _shade_flat(fin_obj)
    return [obj, fin_obj] + scales


def model_snapper_meat():
    """A slab of meat from the Old Snapper — a reddish cut."""
    mat = _make_material("SnapperMeat_mat", (0.55, 0.25, 0.20, 1.0), roughness=0.6)
    mesh = _cube(0.5, name="SnapperMeat")
    _jitter_verts(mesh, 0.03, seed=33)
    obj = _add_obj(mesh, "SnapperMeat", mat)
    obj.scale = (0.5, 0.35, 0.18)
    obj.rotation_euler = (math.radians(10), 0, math.radians(15))
    _shade_flat(obj)
    # A bone visible in the meat
    bone_mat = _make_material("SnapperBone_mat", C["bone"], roughness=0.5)
    bone_mesh = _cylinder(0.03, 0.3, vertices=6, name="SnapperBone")
    bone_obj = _add_obj(bone_mesh, "SnapperBone", bone_mat)
    bone_obj.location = (0.1, 0.05, 0.08)
    bone_obj.rotation_euler = (0, math.radians(90), math.radians(15))
    _shade_smooth(bone_obj)
    return [obj, bone_obj]


def model_ditch_shrimp():
    """A tiny shrimp from the town ditches — curled, pinkish-grey."""
    mat = _make_material("DitchShrimp_mat", (0.55, 0.48, 0.42, 1.0), roughness=0.5)
    mesh = _uv_sphere(0.12, segments=10, rings=6, name="DitchShrimp")
    # Curl the shrimp
    for v in mesh.vertices:
        v.co.x *= 2.5
        # Curve along X
        v.co.y += v.co.x * 0.15
        v.co.z *= 0.7
    obj = _add_obj(mesh, "DitchShrimp", mat)
    obj.rotation_euler = (0, 0, math.radians(30))
    _shade_smooth(obj)
    # Tail fan
    tail_mat = _make_material("DitchShrimpTail_mat", (0.48, 0.40, 0.35, 1.0),
                              roughness=0.5)
    tail_mesh = _cube(0.08, name="DitchShrimpTail")
    tail_obj = _add_obj(tail_mesh, "DitchShrimpTail", tail_mat)
    tail_obj.scale = (0.08, 0.15, 0.02)
    tail_obj.location = (0.25, 0.06, 0)
    tail_obj.rotation_euler = (0, 0, math.radians(30))
    _shade_flat(tail_obj)
    return [obj, tail_obj]


def model_ditch_shrimp_skewer():
    """Grilled ditch shrimp on a stick — pink shrimp on a wooden skewer."""
    # Skewer stick
    stick_mat = _make_material("SkewerStick_mat", C["wood_light"], roughness=0.7)
    stick_mesh = _cylinder(0.015, 0.7, vertices=5, name="SkewerStick")
    stick_obj = _add_obj(stick_mesh, "SkewerStick", stick_mat)
    stick_obj.rotation_euler = (math.radians(70), 0, math.radians(20))
    _shade_smooth(stick_obj)

    # Three grilled shrimp along the stick
    shrimp_mat = _make_material("GrilledShrimp_mat", (0.65, 0.35, 0.25, 1.0),
                                roughness=0.55)
    shrimp_objs = []
    for i, z in enumerate([0.12, 0.0, -0.12]):
        s_mesh = _uv_sphere(0.10, segments=8, rings=6, name=f"GrilledShrimp{i}")
        for v in s_mesh.vertices:
            v.co.x *= 1.8
            v.co.y += v.co.x * 0.12
            v.co.z *= 0.7
        s_obj = _add_obj(s_mesh, f"GrilledShrimp{i}", shrimp_mat)
        s_obj.location = (0.05 * i - 0.05, 0, z)
        s_obj.rotation_euler = (0, 0, math.radians(30))
        _shade_smooth(s_obj)
        shrimp_objs.append(s_obj)

    return [stick_obj] + shrimp_objs


def model_tinfin_pie():
    """A flaky pie filled with river tinfin and herbs."""
    # Pie crust
    crust_mat = _make_material("TinfinPie_mat", (0.72, 0.55, 0.30, 1.0), roughness=0.7)
    crust_mesh = _cylinder(0.35, 0.18, vertices=14, name="TinfinPie")
    pie_obj = _add_obj(crust_mesh, "TinfinPie", crust_mat)
    _shade_flat(pie_obj)
    # Lattice top: a few crossed strips
    strip_mat = _make_material("PieStrip_mat", (0.68, 0.50, 0.26, 1.0), roughness=0.65)
    strips = []
    for i, angle in enumerate([0, math.radians(45), math.radians(90), math.radians(135)]):
        s_mesh = _cube(0.6, name=f"PieStrip{i}")
        s_obj = _add_obj(s_mesh, f"PieStrip{i}", strip_mat)
        s_obj.scale = (0.5, 0.04, 0.03)
        s_obj.location = (0, 0, 0.11)
        s_obj.rotation_euler = (0, 0, angle)
        _shade_flat(s_obj)
        strips.append(s_obj)
    return [pie_obj] + strips


def model_favour_cordial():
    """A sweet cordial offered at the shrine — a small bottle with liquid."""
    # Bottle body
    bottle_mat = _make_material("CordialBottle_mat", (0.45, 0.55, 0.40, 1.0),
                                roughness=0.15, metallic=0.1)
    bottle_mesh = _uv_sphere(0.22, segments=12, rings=10, name="CordialBottle")
    for v in bottle_mesh.vertices:
        if v.co.z > 0.1:
            v.co.z *= 1.3
    bottle_obj = _add_obj(bottle_mesh, "CordialBottle", bottle_mat)
    _shade_smooth(bottle_obj)

    # Neck
    neck_mat = _make_material("CordialNeck_mat", (0.40, 0.50, 0.35, 1.0),
                              roughness=0.15)
    neck_mesh = _cylinder(0.06, 0.18, vertices=8, name="CordialNeck")
    neck_obj = _add_obj(neck_mesh, "CordialNeck", neck_mat)
    neck_obj.location = (0, 0, 0.32)
    _shade_smooth(neck_obj)

    # Cork
    cork_mat = _make_material("CordialCork_mat", C["wood"], roughness=0.8)
    cork_mesh = _cylinder(0.05, 0.06, vertices=6, name="CordialCork")
    cork_obj = _add_obj(cork_mesh, "CordialCork", cork_mat)
    cork_obj.location = (0, 0, 0.42)
    _shade_smooth(cork_obj)

    return [bottle_obj, neck_obj, cork_obj]


def model_warden_ration():
    """A compact ration issued to town wardens on patrol — a wrapped block."""
    # Ration block
    ration_mat = _make_material("WardenRation_mat", C["cloth"], roughness=0.8)
    ration_mesh = _cube(0.45, name="WardenRation")
    ration_obj = _add_obj(ration_mesh, "WardenRation", ration_mat)
    ration_obj.scale = (0.6, 0.4, 0.25)
    ration_obj.rotation_euler = (math.radians(10), 0, math.radians(15))
    _shade_flat(ration_obj)

    # Wrapping string around it
    string_mat = _make_material("RationString_mat", C["sinew"], roughness=0.6)
    strings = []
    for i, axis in enumerate(["x", "y"]):
        s_mesh = _torus(0.28, 0.012, major_seg=12, minor_seg=3, name=f"RationString{i}")
        s_obj = _add_obj(s_mesh, f"RationString{i}", string_mat)
        if axis == "x":
            s_obj.rotation_euler = (0, math.radians(90), 0)
        else:
            s_obj.rotation_euler = (math.radians(90), 0, 0)
        s_obj.scale = (1.0, 0.8, 1.0)
        _shade_smooth(s_obj)
        strings.append(s_obj)

    # Warden seal stamp on top
    seal_mat = _make_material("RationSeal_mat", C["wax_red"], roughness=0.3)
    seal_mesh = _cylinder(0.05, 0.02, vertices=8, name="RationSeal")
    seal_obj = _add_obj(seal_mesh, "RationSeal", seal_mat)
    seal_obj.location = (0, 0, 0.13)
    seal_obj.rotation_euler = (math.radians(10), 0, math.radians(15))
    _shade_smooth(seal_obj)

    return [ration_obj] + strings + [seal_obj]


# ---------------------------------------------------------------------------
# Batch 5: Hides, Leather & Scales
# ---------------------------------------------------------------------------

def _hide(color, roughness=0.85, jitter=0.03, seed=0, name="Hide"):
    """A draped animal hide — a flattened, irregular shape with edges."""
    mat = _make_material(f"{name}_mat", color, roughness=roughness)
    mesh = _uv_sphere(0.38, segments=14, rings=10, name=name)
    # Flatten into a hide shape
    for v in mesh.vertices:
        v.co.z *= 0.15
        v.co.x *= 1.2
        v.co.y *= 0.9
    _jitter_verts(mesh, jitter, seed)
    obj = _add_obj(mesh, name, mat)
    obj.rotation_euler = (math.radians(10), 0, math.radians(15))
    _shade_flat(obj)
    return obj


def model_cow_hide():
    """A thick hide from a town cow — large, brown, folded."""
    hide = _hide((0.42, 0.30, 0.18, 1.0), roughness=0.85, jitter=0.025,
                 seed=40, name="CowHide")
    # A few darker spots
    spot_mat = _make_material("CowSpot_mat", (0.25, 0.18, 0.12, 1.0), roughness=0.85)
    spots = []
    for i, (x, y) in enumerate([(0.12, 0.08), (-0.1, -0.05), (0.05, -0.12)]):
        s_mesh = _uv_sphere(0.06, segments=6, rings=4, name=f"CowSpot{i}")
        s_obj = _add_obj(s_mesh, f"CowSpot{i}", spot_mat)
        s_obj.location = (x, y, 0.04)
        s_obj.scale = (1, 1, 0.3)
        _shade_smooth(s_obj)
        spots.append(s_obj)
    return [hide] + spots


def model_fox_hide():
    """A reddish hide from a bog fox — smaller, warmer tone."""
    hide = _hide((0.55, 0.32, 0.18, 1.0), roughness=0.8, jitter=0.02,
                 seed=41, name="FoxHide")
    hide.scale = (0.85, 0.85, 1)
    return [hide]


def model_rabbit_hide():
    """A soft hide from a river rabbit — small and pale."""
    hide = _hide((0.62, 0.55, 0.42, 1.0), roughness=0.75, jitter=0.015,
                 seed=42, name="RabbitHide")
    hide.scale = (0.7, 0.7, 1)
    return [hide]


def model_warm_scale():
    """A warm scale from something that should not be warm — a single large scale."""
    mat = _make_material("WarmScale_mat", (0.65, 0.40, 0.20, 1.0), roughness=0.25,
                         metallic=0.3, emission=0.3)
    mesh = _uv_sphere(0.28, segments=10, rings=8, name="WarmScale")
    # Flatten into a scale shape
    for v in mesh.vertices:
        v.co.z *= 0.25
        v.co.y *= 0.7
    obj = _add_obj(mesh, "WarmScale", mat)
    obj.rotation_euler = (math.radians(20), 0, math.radians(30))
    _shade_smooth(obj)
    return [obj]


def model_tallow_drake_scale():
    """A rare tallow drake scale — thick, dark, with a waxy sheen."""
    mat = _make_material("TallowScale_mat", (0.30, 0.25, 0.18, 1.0), roughness=0.2,
                         metallic=0.4)
    mesh = _uv_sphere(0.30, segments=12, rings=8, name="TallowScale")
    for v in mesh.vertices:
        v.co.z *= 0.3
        v.co.y *= 0.65
    obj = _add_obj(mesh, "TallowScale", mat)
    obj.rotation_euler = (math.radians(25), 0, math.radians(20))
    _shade_smooth(obj)
    # Ridge line down the center
    ridge_mat = _make_material("TallowRidge_mat", (0.20, 0.16, 0.12, 1.0),
                               roughness=0.3, metallic=0.5)
    ridge_mesh = _cylinder(0.02, 0.4, vertices=5, name="TallowRidge")
    ridge_obj = _add_obj(ridge_mesh, "TallowRidge", ridge_mat)
    ridge_obj.rotation_euler = (0, math.radians(90), math.radians(20))
    ridge_obj.location = (0, 0, 0.06)
    _shade_smooth(ridge_obj)
    return [obj, ridge_obj]


def model_drake_tooth():
    """A tooth from a young drake — a curved fang."""
    mat = _make_material("DrakeTooth_mat", C["bone"], roughness=0.4)
    mesh = _cylinder(0.06, 0.4, vertices=8, name="DrakeTooth")
    # Taper to a point
    for v in mesh.vertices:
        if v.co.z > 0.1:
            v.co.x *= 0.3
            v.co.y *= 0.3
        # Curve the tooth
        v.co.x += v.co.z * 0.15
    obj = _add_obj(mesh, "DrakeTooth", mat)
    obj.rotation_euler = (math.radians(30), 0, math.radians(15))
    _shade_smooth(obj)
    return [obj]


def model_river_tooth():
    """A tooth from a river creature — shorter, bluer-tinged."""
    mat = _make_material("RiverTooth_mat", (0.72, 0.74, 0.70, 1.0), roughness=0.4)
    mesh = _cylinder(0.05, 0.3, vertices=8, name="RiverTooth")
    for v in mesh.vertices:
        if v.co.z > 0.1:
            v.co.x *= 0.3
            v.co.y *= 0.3
        v.co.x += v.co.z * 0.1
    obj = _add_obj(mesh, "RiverTooth", mat)
    obj.rotation_euler = (math.radians(25), 0, math.radians(20))
    _shade_smooth(obj)
    return [obj]


def model_bat_mother_claw():
    """A claw from the Bell Bat Mother — a curved, dark trophy claw."""
    mat = _make_material("BatClaw_mat", (0.20, 0.18, 0.16, 1.0), roughness=0.5,
                         metallic=0.3)
    mesh = _cylinder(0.05, 0.45, vertices=8, name="BatClaw")
    for v in mesh.vertices:
        if v.co.z > 0.1:
            v.co.x *= 0.2
            v.co.y *= 0.2
        # Strong curve
        v.co.x += v.co.z * 0.25
    obj = _add_obj(mesh, "BatClaw", mat)
    obj.rotation_euler = (math.radians(40), 0, math.radians(10))
    _shade_smooth(obj)
    # Base socket
    base_mat = _make_material("BatClawBase_mat", (0.35, 0.30, 0.25, 1.0), roughness=0.6)
    base_mesh = _uv_sphere(0.06, segments=6, rings=4, name="BatClawBase")
    base_obj = _add_obj(base_mesh, "BatClawBase", base_mat)
    base_obj.location = (0.08, 0, -0.18)
    _shade_smooth(base_obj)
    return [obj, base_obj]


def model_rat_tail():
    """A thin tail from a common rat — a long, thin, pinkish cylinder."""
    mat = _make_material("RatTail_mat", (0.55, 0.42, 0.35, 1.0), roughness=0.6)
    mesh = _cylinder(0.03, 0.5, vertices=6, name="RatTail")
    # Taper and curve
    for v in mesh.vertices:
        if v.co.z < -0.1:
            v.co.x *= 0.5
            v.co.y *= 0.5
        v.co.x += v.co.z * 0.1
    obj = _add_obj(mesh, "RatTail", mat)
    obj.rotation_euler = (math.radians(60), 0, math.radians(20))
    _shade_smooth(obj)
    return [obj]


def model_cellar_fur_bundle():
    """A bundle of fur from the Sootcellar rats — a fluffy, dark cluster."""
    mat = _make_material("CellarFur_mat", (0.28, 0.24, 0.22, 1.0), roughness=0.95)
    pieces = []
    for i in range(4):
        mesh = _uv_sphere(0.12, segments=6, rings=4, name=f"CellarFur{i}")
        _jitter_verts(mesh, 0.04, seed=43 + i)
        obj = _add_obj(mesh, f"CellarFur{i}", mat)
        obj.location = (
            (i % 2) * 0.12 - 0.06,
            (i // 2) * 0.1 - 0.05,
            i * 0.03,
        )
        obj.scale = (1, 1, 0.6)
        _shade_flat(obj)
        pieces.append(obj)
    # Tie cord
    tie_mat = _make_material("CellarFurTie_mat", C["sinew"], roughness=0.6)
    tie_mesh = _torus(0.15, 0.01, major_seg=10, minor_seg=3, name="CellarFurTie")
    tie_obj = _add_obj(tie_mesh, "CellarFurTie", tie_mat)
    tie_obj.rotation_euler = (math.radians(90), 0, 0)
    _shade_smooth(tie_obj)
    return pieces + [tie_obj]


def model_cellar_king_whisker():
    """A whisker from the Cellar King — a long, stiff, silvery whisker."""
    mat = _make_material("CellarWhisker_mat", (0.70, 0.68, 0.62, 1.0), roughness=0.3)
    mesh = _cylinder(0.012, 0.6, vertices=5, name="CellarWhisker")
    # Slight curve
    for v in mesh.vertices:
        v.co.x += v.co.z * 0.08
    obj = _add_obj(mesh, "CellarWhisker", mat)
    obj.rotation_euler = (math.radians(70), 0, math.radians(25))
    _shade_smooth(obj)
    # Base bulb
    base_mat = _make_material("WhiskerBase_mat", (0.40, 0.35, 0.30, 1.0), roughness=0.5)
    base_mesh = _uv_sphere(0.025, segments=6, rings=4, name="WhiskerBase")
    base_obj = _add_obj(base_mesh, "WhiskerBase", base_mat)
    base_obj.location = (0.08, 0, -0.25)
    base_obj.rotation_euler = (math.radians(70), 0, math.radians(25))
    _shade_smooth(base_obj)
    return [obj, base_obj]


def model_wing_hide_roll():
    """A roll of hide from bat wings — a thin leather scroll shape."""
    # Roll body
    roll_mat = _make_material("WingHide_mat", (0.25, 0.20, 0.18, 1.0), roughness=0.85)
    roll_mesh = _cylinder(0.12, 0.5, vertices=10, name="WingHideRoll")
    roll_obj = _add_obj(roll_mesh, "WingHideRoll", roll_mat)
    roll_obj.rotation_euler = (0, math.radians(90), 0)
    _shade_smooth(roll_obj)
    # Tie cord
    tie_mat = _make_material("WingHideTie_mat", C["sinew"], roughness=0.6)
    tie_mesh = _torus(0.13, 0.01, major_seg=10, minor_seg=3, name="WingHideTie")
    tie_obj = _add_obj(tie_mesh, "WingHideTie", tie_mat)
    tie_obj.rotation_euler = (0, math.radians(90), 0)
    tie_obj.location = (0.1, 0, 0)
    _shade_smooth(tie_obj)
    return [roll_obj, tie_obj]


# ---------------------------------------------------------------------------
# Batch 6: Tokens, Marks & Coins
# ---------------------------------------------------------------------------

def _coin(color, roughness=0.3, metallic=0.9, radius=0.24, name="Coin"):
    """A flat coin disc with a slight tilt."""
    mat = _make_material(f"{name}_mat", color, roughness=roughness, metallic=metallic)
    mesh = _cylinder(radius, 0.025, vertices=20, name=name)
    obj = _add_obj(mesh, name, mat)
    obj.rotation_euler = (math.radians(55), 0, math.radians(15))
    _shade_smooth(obj)
    return obj


def _token_stamp(color, stamp_color, radius=0.24, name="Token"):
    """A token coin with a stamped mark in the center."""
    token = _coin(color, roughness=0.35, metallic=0.7, radius=radius, name=name)
    # Stamped mark: a small raised shape
    stamp_mat = _make_material(f"{name}_stamp_mat", stamp_color, roughness=0.3,
                               metallic=0.85)
    stamp_mesh = _cylinder(radius * 0.3, 0.015, vertices=8, name=f"{name}_stamp")
    stamp_obj = _add_obj(stamp_mesh, f"{name}_stamp", stamp_mat)
    stamp_obj.rotation_euler = (math.radians(55), 0, math.radians(15))
    # Place on the face of the coin
    stamp_obj.location = (0.05, -0.08, 0.02)
    _shade_smooth(stamp_obj)
    return [token, stamp_obj]


def model_coin():
    """A small Old Town coin, bright where many hands have worn it."""
    coin = _coin((0.72, 0.65, 0.35, 1.0), roughness=0.25, metallic=0.95,
                 name="Coin")
    # Wear mark: a slightly darker patch
    wear_mat = _make_material("CoinWear_mat", (0.55, 0.48, 0.25, 1.0),
                              roughness=0.4, metallic=0.85)
    wear_mesh = _uv_sphere(0.06, segments=6, rings=4, name="CoinWear")
    wear_obj = _add_obj(wear_mesh, "CoinWear", wear_mat)
    wear_obj.location = (0.08, -0.05, 0.02)
    wear_obj.scale = (1, 1, 0.3)
    _shade_smooth(wear_obj)
    return [coin, wear_obj]


def model_bell_token():
    """A token earned by ringing the Market Bell — brass with a bell mark."""
    return _token_stamp((0.65, 0.50, 0.20, 1.0), C["steel"],
                        radius=0.25, name="BellToken")


def model_warden_mark():
    """A mark of service to the Warden's Board — silver with a cross."""
    token = _coin(C["silver"], roughness=0.2, metallic=0.95, radius=0.25,
                  name="WardenMark")
    # Cross engraving
    cross_mat = _make_material("WardenCross_mat", C["steel"], roughness=0.3,
                               metallic=0.9)
    cross_parts = []
    for i, angle in enumerate([0, math.radians(90)]):
        c_mesh = _cube(0.12, name=f"WardenCross{i}")
        c_obj = _add_obj(c_mesh, f"WardenCross{i}", cross_mat)
        c_obj.scale = (0.5, 0.06, 0.04)
        c_obj.location = (0.05, -0.08, 0.02)
        c_obj.rotation_euler = (math.radians(55), 0, math.radians(15) + angle)
        _shade_flat(c_obj)
        cross_parts.append(c_obj)
    return [token] + cross_parts


def model_ledger_seven():
    """The seventh ledger — a small bound book."""
    # Book cover
    cover_mat = _make_material("Ledger7_mat", (0.35, 0.20, 0.15, 1.0), roughness=0.7)
    cover_mesh = _cube(0.5, name="Ledger7")
    book_obj = _add_obj(cover_mesh, "Ledger7", cover_mat)
    book_obj.scale = (0.5, 0.35, 0.12)
    book_obj.rotation_euler = (math.radians(15), 0, math.radians(10))
    _shade_flat(book_obj)
    # Spine
    spine_mat = _make_material("Ledger7Spine_mat", (0.25, 0.15, 0.10, 1.0),
                               roughness=0.6)
    spine_mesh = _cube(0.35, name="Ledger7Spine")
    spine_obj = _add_obj(spine_mesh, "Ledger7Spine", spine_mat)
    spine_obj.scale = (0.06, 0.35, 0.13)
    spine_obj.location = (-0.22, 0, 0)
    spine_obj.rotation_euler = (math.radians(15), 0, math.radians(10))
    _shade_flat(spine_obj)
    # Number 7 mark on cover — a thin vertical + horizontal line
    mark_mat = _make_material("Ledger7Mark_mat", C["silver"], roughness=0.3,
                              metallic=0.8)
    v_mesh = _cube(0.1, name="Ledger7MarkV")
    v_obj = _add_obj(v_mesh, "Ledger7MarkV", mark_mat)
    v_obj.scale = (0.015, 0.15, 0.02)
    v_obj.location = (0.05, 0, 0.07)
    v_obj.rotation_euler = (math.radians(15), 0, math.radians(10))
    _shade_flat(v_obj)
    return [book_obj, spine_obj, v_obj]


def model_bell_token_proof():
    """Proof that the bell was rung — a wax-sealed paper note."""
    # Paper
    paper_mat = _make_material("BellProof_mat", (0.82, 0.78, 0.65, 1.0),
                               roughness=0.85)
    paper_mesh = _cube(0.4, name="BellProof")
    paper_obj = _add_obj(paper_mesh, "BellProof", paper_mat)
    paper_obj.scale = (0.5, 0.35, 0.02)
    paper_obj.rotation_euler = (math.radians(10), 0, math.radians(5))
    _shade_flat(paper_obj)
    # Wax seal
    seal_mat = _make_material("BellProofSeal_mat", C["wax_red"], roughness=0.25)
    seal_mesh = _cylinder(0.08, 0.03, vertices=10, name="BellProofSeal")
    seal_obj = _add_obj(seal_mesh, "BellProofSeal", seal_mat)
    seal_obj.location = (0.08, -0.05, 0.03)
    seal_obj.rotation_euler = (math.radians(10), 0, math.radians(5))
    _shade_smooth(seal_obj)
    return [paper_obj, seal_obj]


def model_torn_ledger_scrap():
    """A scrap of torn ledger from the Sootcellar — a ripped piece of paper."""
    paper_mat = _make_material("LedgerScrap_mat", (0.72, 0.68, 0.55, 1.0),
                               roughness=0.9)
    mesh = _cube(0.35, name="LedgerScrap")
    _jitter_verts(mesh, 0.04, seed=50)
    obj = _add_obj(mesh, "LedgerScrap", paper_mat)
    obj.scale = (0.5, 0.3, 0.02)
    obj.rotation_euler = (math.radians(15), 0, math.radians(20))
    # Torn edge: scale one side irregularly
    for v in mesh.vertices:
        if v.co.x < -0.2:
            v.co.y *= 0.5 + abs(v.co.z) * 2
    _shade_flat(obj)
    # A few ink lines
    ink_mat = _make_material("ScrapInk_mat", (0.15, 0.12, 0.10, 1.0), roughness=0.8)
    lines = []
    for i, z in enumerate([0.05, 0.0, -0.05]):
        l_mesh = _cube(0.2, name=f"ScrapInk{i}")
        l_obj = _add_obj(l_mesh, f"ScrapInk{i}", ink_mat)
        l_obj.scale = (0.4, 0.01, 0.01)
        l_obj.location = (0, 0, z)
        l_obj.rotation_euler = (math.radians(15), 0, math.radians(20))
        _shade_flat(l_obj)
        lines.append(l_obj)
    return [obj] + lines


def model_quarry_token():
    """A token earned from quarry work — iron with a pick mark."""
    return _token_stamp((0.40, 0.35, 0.30, 1.0), C["iron"],
                        radius=0.25, name="QuarryToken")


def model_wax_seal():
    """A stick of red sealing wax."""
    mat = _make_material("WaxSeal_mat", C["wax_red"], roughness=0.2)
    mesh = _cylinder(0.05, 0.5, vertices=8, name="WaxSeal")
    obj = _add_obj(mesh, "WaxSeal", mat)
    obj.rotation_euler = (math.radians(70), 0, math.radians(15))
    _shade_smooth(obj)
    # Wax drip at the tip
    drip_mat = _make_material("WaxSealDrip_mat", C["wax_red"], roughness=0.15)
    drip_mesh = _uv_sphere(0.06, segments=6, rings=4, name="WaxSealDrip")
    drip_obj = _add_obj(drip_mesh, "WaxSealDrip", drip_mat)
    drip_obj.location = (0.12, 0, -0.22)
    drip_obj.rotation_euler = (math.radians(70), 0, math.radians(15))
    drip_obj.scale = (1, 1, 1.5)
    _shade_smooth(drip_obj)
    return [obj, drip_obj]


def model_soot_mark():
    """A soot-stained mark proving labour in the Sootcellar — dark, smudged."""
    token = _coin((0.25, 0.22, 0.20, 1.0), roughness=0.6, metallic=0.4,
                  radius=0.25, name="SootMark")
    # Soot smudge
    soot_mat = _make_material("SootSmudge_mat", (0.10, 0.08, 0.07, 1.0),
                              roughness=0.95)
    soot_mesh = _uv_sphere(0.08, segments=6, rings=4, name="SootSmudge")
    soot_obj = _add_obj(soot_mesh, "SootSmudge", soot_mat)
    soot_obj.location = (0.05, -0.05, 0.02)
    soot_obj.scale = (1.2, 1, 0.3)
    _shade_smooth(soot_obj)
    return [token, soot_obj]


def model_ledger_sort_voucher():
    """A small voucher earned from sorting ledgers — a folded paper slip."""
    paper_mat = _make_material("SortVoucher_mat", (0.85, 0.82, 0.70, 1.0),
                               roughness=0.8)
    mesh = _cube(0.35, name="SortVoucher")
    obj = _add_obj(mesh, "SortVoucher", paper_mat)
    obj.scale = (0.5, 0.2, 0.02)
    obj.rotation_euler = (math.radians(20), 0, math.radians(10))
    _shade_flat(obj)
    # Fold crease
    crease_mat = _make_material("VoucherCrease_mat", (0.65, 0.62, 0.50, 1.0),
                                roughness=0.8)
    crease_mesh = _cube(0.2, name="VoucherCrease")
    crease_obj = _add_obj(crease_mesh, "VoucherCrease", crease_mat)
    crease_obj.scale = (0.02, 0.2, 0.015)
    crease_obj.location = (0, 0, 0.01)
    crease_obj.rotation_euler = (math.radians(20), 0, math.radians(10))
    _shade_flat(crease_obj)
    return [obj, crease_obj]


def model_market_token():
    """A small brass token earned from market deliveries."""
    return _token_stamp((0.60, 0.45, 0.15, 1.0), C["steel"],
                        radius=0.24, name="MarketToken")


def model_grave_token():
    """A small token earned from tending the graveyard flowers — dark with a flower mark."""
    token = _coin((0.30, 0.28, 0.25, 1.0), roughness=0.5, metallic=0.5,
                  radius=0.24, name="GraveToken")
    # Flower mark: 5 small dots in a ring
    petal_mat = _make_material("GravePetal_mat", (0.50, 0.40, 0.45, 1.0),
                               roughness=0.4)
    petals = []
    for i in range(5):
        a = math.radians(i * 72)
        p_mesh = _uv_sphere(0.025, segments=4, rings=3, name=f"GravePetal{i}")
        p_obj = _add_obj(p_mesh, f"GravePetal{i}", petal_mat)
        p_obj.location = (
            0.05 + math.cos(a) * 0.05,
            -0.08 + math.sin(a) * 0.05,
            0.02,
        )
        _shade_smooth(p_obj)
        petals.append(p_obj)
    return [token] + petals


def model_kiln_token():
    """A stamped clay token earned from firing the kiln — terracotta."""
    token = _coin(C["terracotta"], roughness=0.7, metallic=0.0,
                  radius=0.25, name="KilnToken")
    # Flame mark
    flame_mat = _make_material("KilnFlame_mat", (0.65, 0.35, 0.15, 1.0),
                               roughness=0.5, emission=0.4)
    flame_mesh = _ico(0.04, subdivisions=0, name="KilnFlame")
    flame_obj = _add_obj(flame_mesh, "KilnFlame", flame_mat)
    flame_obj.location = (0.05, -0.08, 0.02)
    flame_obj.rotation_euler = (math.radians(55), 0, math.radians(15))
    _shade_flat(flame_obj)
    return [token, flame_obj]


def model_river_token():
    """A small brass token earned from river fishing — with a wave mark."""
    token = _coin((0.55, 0.48, 0.20, 1.0), roughness=0.3, metallic=0.85,
                  radius=0.24, name="RiverToken")
    # Wave mark: two small curved lines
    wave_mat = _make_material("RiverWave_mat", C["steel"], roughness=0.3,
                              metallic=0.9)
    waves = []
    for i, z in enumerate([0.03, -0.02]):
        w_mesh = _torus(0.04, 0.008, major_seg=6, minor_seg=3, name=f"RiverWave{i}")
        w_obj = _add_obj(w_mesh, f"RiverWave{i}", wave_mat)
        w_obj.location = (0.05, -0.08 + i * 0.04, 0.02 + z)
        w_obj.rotation_euler = (math.radians(55), 0, math.radians(15))
        w_obj.scale = (1, 0.3, 1)
        _shade_smooth(w_obj)
        waves.append(w_obj)
    return [token] + waves


# ---------------------------------------------------------------------------
# Batch 7: Tools & Crafting
# ---------------------------------------------------------------------------

def model_flintbox():
    """A small tin box with flint and striker for starting fires."""
    # Box body
    box_mat = _make_material("Flintbox_mat", (0.35, 0.32, 0.28, 1.0),
                             roughness=0.5, metallic=0.7)
    box_mesh = _cube(0.4, name="Flintbox")
    box_obj = _add_obj(box_mesh, "Flintbox", box_mat)
    box_obj.scale = (0.5, 0.35, 0.2)
    box_obj.rotation_euler = (math.radians(15), 0, math.radians(10))
    _shade_flat(box_obj)
    # Lid seam
    seam_mat = _make_material("FlintboxSeam_mat", (0.20, 0.18, 0.15, 1.0),
                              roughness=0.6)
    seam_mesh = _cube(0.35, name="FlintboxSeam")
    seam_obj = _add_obj(seam_mesh, "FlintboxSeam", seam_mat)
    seam_obj.scale = (0.5, 0.35, 0.01)
    seam_obj.location = (0, 0, 0.1)
    seam_obj.rotation_euler = (math.radians(15), 0, math.radians(10))
    _shade_flat(seam_obj)
    # Flint stone on top
    flint_mat = _make_material("Flint_mat", (0.30, 0.28, 0.25, 1.0), roughness=0.7)
    flint_mesh = _ico(0.08, subdivisions=1, name="Flint")
    _jitter_verts(flint_mesh, 0.02, seed=60)
    flint_obj = _add_obj(flint_mesh, "Flint", flint_mat)
    flint_obj.location = (0.05, 0, 0.15)
    flint_obj.rotation_euler = (math.radians(15), 0, math.radians(10))
    _shade_flat(flint_obj)
    return [box_obj, seam_obj, flint_obj]


def model_bone_needle():
    """A slender needle carved from bone."""
    mat = _make_material("BoneNeedle_mat", C["bone"], roughness=0.4)
    mesh = _cylinder(0.015, 0.5, vertices=6, name="BoneNeedle")
    # Taper to a point at one end
    for v in mesh.vertices:
        if v.co.z > 0.15:
            v.co.x *= 0.2
            v.co.y *= 0.2
    # Slight curve
    for v in mesh.vertices:
        v.co.x += v.co.z * 0.05
    obj = _add_obj(mesh, "BoneNeedle", mat)
    obj.rotation_euler = (math.radians(70), 0, math.radians(20))
    _shade_smooth(obj)
    # Eye hole: a tiny dark dot near the back end
    eye_mat = _make_material("BoneNeedleEye_mat", (0.1, 0.1, 0.1, 1.0), roughness=0.8)
    eye_mesh = _uv_sphere(0.015, segments=4, rings=3, name="BoneNeedleEye")
    eye_obj = _add_obj(eye_mesh, "BoneNeedleEye", eye_mat)
    eye_obj.location = (-0.1, 0, -0.18)
    eye_obj.rotation_euler = (math.radians(70), 0, math.radians(20))
    _shade_smooth(eye_obj)
    return [obj, eye_obj]


def model_whittling_knife():
    """A small knife for carving wood and feathering shafts."""
    # Blade
    blade_mat = _make_material("WhittleBlade_mat", C["steel"], roughness=0.25,
                               metallic=0.9)
    blade_mesh = _cube(0.35, name="WhittleBlade")
    blade_obj = _add_obj(blade_mesh, "WhittleBlade", blade_mat)
    blade_obj.scale = (0.4, 0.08, 0.03)
    blade_obj.location = (0.15, 0, 0.05)
    # Taper to a point
    for v in blade_mesh.vertices:
        if v.co.x > 0.3:
            v.co.y *= 0.1
            v.co.z *= 0.3
    _shade_flat(blade_obj)

    # Handle
    handle_mat = _make_material("WhittleHandle_mat", C["wood"], roughness=0.7)
    handle_mesh = _cylinder(0.04, 0.3, vertices=8, name="WhittleHandle")
    handle_obj = _add_obj(handle_mesh, "WhittleHandle", handle_mat)
    handle_obj.rotation_euler = (0, math.radians(90), 0)
    handle_obj.location = (-0.12, 0, 0.05)
    _shade_smooth(handle_obj)

    return [blade_obj, handle_obj]


def model_market_pot():
    """A sturdy iron pot for boiling and stewing."""
    pot_mat = _make_material("MarketPot_mat", C["iron"], roughness=0.5, metallic=0.7)
    # Pot body: a cylinder, hollow-looking
    pot_mesh = _cylinder(0.35, 0.3, vertices=14, name="MarketPot")
    pot_obj = _add_obj(pot_mesh, "MarketPot", pot_mat)
    _shade_flat(pot_obj)
    # Rim: a slightly wider ring at the top
    rim_mat = _make_material("PotRim_mat", (0.25, 0.22, 0.20, 1.0), roughness=0.5,
                             metallic=0.7)
    rim_mesh = _torus(0.35, 0.03, major_seg=14, minor_seg=4, name="PotRim")
    rim_obj = _add_obj(rim_mesh, "PotRim", rim_mat)
    rim_obj.location = (0, 0, 0.15)
    rim_obj.rotation_euler = (math.radians(90), 0, 0)
    _shade_smooth(rim_obj)
    # Handle: a side loop
    handle_mat = _make_material("PotHandle_mat", C["iron"], roughness=0.5, metallic=0.7)
    handle_mesh = _torus(0.1, 0.02, major_seg=8, minor_seg=3, name="PotHandle")
    handle_obj = _add_obj(handle_mesh, "PotHandle", handle_mat)
    handle_obj.location = (0.38, 0, 0.05)
    handle_obj.rotation_euler = (0, math.radians(90), 0)
    _shade_smooth(handle_obj)
    return [pot_obj, rim_obj, handle_obj]


def model_tongs():
    """Blacksmith tongs — two arms joined at a pivot."""
    arm_mat = _make_material("Tongs_mat", C["iron"], roughness=0.5, metallic=0.7)
    arms = []
    for i, angle in enumerate([math.radians(15), math.radians(-15)]):
        mesh = _cylinder(0.025, 0.6, vertices=6, name=f"TongsArm{i}")
        obj = _add_obj(mesh, f"TongsArm{i}", arm_mat)
        obj.location = (0, 0, 0)
        obj.rotation_euler = (angle, 0, 0)
        _shade_smooth(obj)
        arms.append(obj)
    # Pivot rivet
    rivet_mat = _make_material("TongsRivet_mat", C["steel"], roughness=0.3, metallic=0.9)
    rivet_mesh = _cylinder(0.03, 0.06, vertices=6, name="TongsRivet")
    rivet_obj = _add_obj(rivet_mesh, "TongsRivet", rivet_mat)
    rivet_obj.rotation_euler = (0, math.radians(90), 0)
    _shade_smooth(rivet_obj)
    return arms + [rivet_obj]


def model_basic_mould():
    """A simple clay mould for casting metal shapes."""
    mat = _make_material("Mould_mat", C["terracotta"], roughness=0.85)
    mesh = _cube(0.4, name="BasicMould")
    obj = _add_obj(mesh, "BasicMould", mat)
    obj.scale = (0.5, 0.4, 0.2)
    obj.rotation_euler = (math.radians(15), 0, math.radians(10))
    _shade_flat(obj)
    # Cavity: a dark indentation on top
    cavity_mat = _make_material("MouldCavity_mat", (0.15, 0.12, 0.10, 1.0),
                                roughness=0.9)
    cavity_mesh = _cube(0.2, name="MouldCavity")
    cavity_obj = _add_obj(cavity_mesh, "MouldCavity", cavity_mat)
    cavity_obj.scale = (0.4, 0.25, 0.05)
    cavity_obj.location = (0.02, 0, 0.11)
    cavity_obj.rotation_euler = (math.radians(15), 0, math.radians(10))
    _shade_flat(cavity_obj)
    return [obj, cavity_obj]


def model_blacksealed_pickset():
    """A professional set of lockpicks stamped with a black seal."""
    # Two pick tools
    pick_mat = _make_material("Pickset_mat", C["steel"], roughness=0.3, metallic=0.9)
    picks = []
    for i, curve in enumerate([0.1, -0.05]):
        mesh = _cylinder(0.012, 0.5, vertices=5, name=f"PicksetPick{i}")
        for v in mesh.vertices:
            v.co.x += v.co.z * curve
        obj = _add_obj(mesh, f"PicksetPick{i}", pick_mat)
        obj.rotation_euler = (math.radians(60 + i * 10), 0, math.radians(15))
        obj.location = (i * 0.06 - 0.03, 0, 0)
        _shade_smooth(obj)
        picks.append(obj)
    # Black seal case
    case_mat = _make_material("PicksetCase_mat", (0.10, 0.08, 0.07, 1.0),
                              roughness=0.6)
    case_mesh = _cube(0.25, name="PicksetCase")
    case_obj = _add_obj(case_mesh, "PicksetCase", case_mat)
    case_obj.scale = (0.3, 0.15, 0.06)
    case_obj.location = (-0.15, 0, -0.1)
    case_obj.rotation_euler = (math.radians(60), 0, math.radians(15))
    _shade_flat(case_obj)
    # Black wax seal on case
    seal_mat = _make_material("PicksetSeal_mat", (0.05, 0.04, 0.03, 1.0),
                              roughness=0.3)
    seal_mesh = _cylinder(0.04, 0.02, vertices=8, name="PicksetSeal")
    seal_obj = _add_obj(seal_mesh, "PicksetSeal", seal_mat)
    seal_obj.location = (-0.15, 0, -0.07)
    seal_obj.rotation_euler = (math.radians(60), 0, math.radians(15))
    _shade_smooth(seal_obj)
    return picks + [case_obj, seal_obj]


def model_awl():
    """A leather worker's awl — a pointed spike with a handle."""
    # Spike
    spike_mat = _make_material("AwlSpike_mat", C["steel"], roughness=0.25, metallic=0.9)
    spike_mesh = _cylinder(0.025, 0.35, vertices=6, name="AwlSpike")
    for v in spike_mesh.vertices:
        if v.co.z > 0.1:
            v.co.x *= 0.2
            v.co.y *= 0.2
    spike_obj = _add_obj(spike_mesh, "AwlSpike", spike_mat)
    spike_obj.location = (0, 0, 0.2)
    _shade_smooth(spike_obj)
    # Handle
    handle_mat = _make_material("AwlHandle_mat", C["wood"], roughness=0.7)
    handle_mesh = _cylinder(0.04, 0.3, vertices=8, name="AwlHandle")
    handle_obj = _add_obj(handle_mesh, "AwlHandle", handle_mat)
    handle_obj.location = (0, 0, -0.08)
    _shade_smooth(handle_obj)
    return [spike_obj, handle_obj]


def model_bent_pick():
    """A bent lockpick — a thin metal pick with a curve."""
    mat = _make_material("BentPick_mat", C["steel"], roughness=0.35, metallic=0.85)
    mesh = _cylinder(0.012, 0.5, vertices=5, name="BentPick")
    # Strong bend in the middle
    for v in mesh.vertices:
        if v.co.z > 0:
            v.co.x += v.co.z * 0.2
    obj = _add_obj(mesh, "BentPick", mat)
    obj.rotation_euler = (math.radians(50), 0, math.radians(20))
    _shade_smooth(obj)
    return [obj]


def model_arrow_shafts():
    """A bundle of wooden arrow shafts."""
    mat = _make_material("ArrowShaft_mat", C["wood_light"], roughness=0.7)
    shafts = []
    for i in range(5):
        mesh = _cylinder(0.012, 0.55, vertices=5, name=f"ArrowShaft{i}")
        obj = _add_obj(mesh, f"ArrowShaft{i}", mat)
        obj.rotation_euler = (math.radians(80), 0, math.radians(10 + i * 3))
        obj.location = (i * 0.04 - 0.08, 0, 0)
        _shade_smooth(obj)
        shafts.append(obj)
    # Binding cord
    cord_mat = _make_material("ShaftCord_mat", C["sinew"], roughness=0.6)
    cord_mesh = _torus(0.06, 0.008, major_seg=8, minor_seg=3, name="ShaftCord")
    cord_obj = _add_obj(cord_mesh, "ShaftCord", cord_mat)
    cord_obj.rotation_euler = (math.radians(80), 0, math.radians(10))
    cord_obj.location = (0, 0, 0)
    _shade_smooth(cord_obj)
    return shafts + [cord_obj]


def model_thread():
    """A spool of thread."""
    # Spool core
    core_mat = _make_material("ThreadSpool_mat", C["wood_light"], roughness=0.7)
    core_mesh = _cylinder(0.08, 0.3, vertices=10, name="ThreadSpool")
    core_obj = _add_obj(core_mesh, "ThreadSpool", core_mat)
    core_obj.rotation_euler = (math.radians(70), 0, math.radians(15))
    _shade_smooth(core_obj)
    # Thread wrapped around
    thread_mat = _make_material("Thread_mat", (0.55, 0.45, 0.30, 1.0), roughness=0.8)
    thread_mesh = _cylinder(0.11, 0.22, vertices=10, name="ThreadWrap")
    thread_obj = _add_obj(thread_mesh, "ThreadWrap", thread_mat)
    thread_obj.rotation_euler = (math.radians(70), 0, math.radians(15))
    _shade_smooth(thread_obj)
    # Spool caps
    cap_mat = _make_material("SpoolCap_mat", C["wood_light"], roughness=0.7)
    caps = []
    for i, z in enumerate([0.15, -0.15]):
        cap_mesh = _cylinder(0.1, 0.03, vertices=10, name=f"SpoolCap{i}")
        cap_obj = _add_obj(cap_mesh, f"SpoolCap{i}", cap_mat)
        cap_obj.rotation_euler = (math.radians(70), 0, math.radians(15))
        cap_obj.location = (z * 0.3, 0, 0)
        _shade_smooth(cap_obj)
        caps.append(cap_obj)
    return [core_obj, thread_obj] + caps


def model_patch_leather():
    """A small patch of leather — a flat, irregular piece."""
    mat = _make_material("PatchLeather_mat", C["leather"], roughness=0.85)
    mesh = _cube(0.35, name="PatchLeather")
    _jitter_verts(mesh, 0.03, seed=61)
    obj = _add_obj(mesh, "PatchLeather", mat)
    obj.scale = (0.5, 0.4, 0.03)
    obj.rotation_euler = (math.radians(10), 0, math.radians(15))
    _shade_flat(obj)
    return [obj]


def model_glaze_bowl():
    """A bowl for holding glaze — a shallow ceramic dish."""
    mat = _make_material("GlazeBowl_mat", (0.50, 0.45, 0.40, 1.0), roughness=0.3)
    mesh = _cylinder(0.3, 0.12, vertices=14, name="GlazeBowl")
    obj = _add_obj(mesh, "GlazeBowl", mat)
    _shade_smooth(obj)
    # Glaze inside: a lighter disc
    glaze_mat = _make_material("GlazeInside_mat", (0.35, 0.50, 0.55, 1.0),
                               roughness=0.15)
    glaze_mesh = _cylinder(0.26, 0.02, vertices=14, name="GlazeInside")
    glaze_obj = _add_obj(glaze_mesh, "GlazeInside", glaze_mat)
    glaze_obj.location = (0, 0, 0.06)
    _shade_smooth(glaze_obj)
    return [obj, glaze_obj]


def model_offering_bowl():
    """A shallow offering bowl — dark wood with a rim."""
    mat = _make_material("OfferingBowl_mat", C["wood_dark"], roughness=0.6)
    mesh = _cylinder(0.32, 0.1, vertices=14, name="OfferingBowl")
    obj = _add_obj(mesh, "OfferingBowl", mat)
    _shade_smooth(obj)
    # Rim ring
    rim_mat = _make_material("OfferingRim_mat", (0.15, 0.10, 0.08, 1.0), roughness=0.5)
    rim_mesh = _torus(0.32, 0.02, major_seg=14, minor_seg=4, name="OfferingRim")
    rim_obj = _add_obj(rim_mesh, "OfferingRim", rim_mat)
    rim_obj.location = (0, 0, 0.05)
    rim_obj.rotation_euler = (math.radians(90), 0, 0)
    _shade_smooth(rim_obj)
    return [obj, rim_obj]


def model_reed_rod():
    """A fishing reed rod — a long thin cane."""
    mat = _make_material("ReedRod_mat", (0.55, 0.52, 0.30, 1.0), roughness=0.7)
    mesh = _cylinder(0.018, 0.7, vertices=6, name="ReedRod")
    # Slight taper
    for v in mesh.vertices:
        if v.co.z > 0.2:
            v.co.x *= 0.6
            v.co.y *= 0.6
    obj = _add_obj(mesh, "ReedRod", mat)
    obj.rotation_euler = (math.radians(75), 0, math.radians(15))
    _shade_smooth(obj)
    # Tip
    tip_mat = _make_material("ReedTip_mat", (0.45, 0.42, 0.22, 1.0), roughness=0.7)
    tip_mesh = _cylinder(0.008, 0.1, vertices=4, name="ReedTip")
    tip_obj = _add_obj(tip_mesh, "ReedTip", tip_mat)
    tip_obj.location = (0.3, 0, 0.3)
    tip_obj.rotation_euler = (math.radians(75), 0, math.radians(15))
    _shade_smooth(tip_obj)
    return [obj, tip_obj]


def model_small_net():
    """A small fishing net — a loop with mesh."""
    # Loop frame
    frame_mat = _make_material("NetFrame_mat", C["wood"], roughness=0.7)
    frame_mesh = _torus(0.25, 0.02, major_seg=14, minor_seg=4, name="NetFrame")
    frame_obj = _add_obj(frame_mesh, "NetFrame", frame_mat)
    frame_obj.rotation_euler = (math.radians(60), 0, math.radians(15))
    _shade_smooth(frame_obj)
    # Net mesh: a few crossed thin lines
    net_mat = _make_material("Net_mat", (0.55, 0.50, 0.40, 1.0), roughness=0.8)
    lines = []
    for i in range(4):
        angle = math.radians(i * 45)
        l_mesh = _cylinder(0.005, 0.45, vertices=4, name=f"NetLine{i}")
        l_obj = _add_obj(l_mesh, f"NetLine{i}", net_mat)
        l_obj.rotation_euler = (math.radians(60), angle, math.radians(15))
        _shade_smooth(l_obj)
        lines.append(l_obj)
    # Handle
    handle_mat = _make_material("NetHandle_mat", C["wood"], roughness=0.7)
    handle_mesh = _cylinder(0.02, 0.3, vertices=6, name="NetHandle")
    handle_obj = _add_obj(handle_mesh, "NetHandle", handle_mat)
    handle_obj.location = (-0.2, 0, -0.15)
    handle_obj.rotation_euler = (math.radians(60), 0, math.radians(15))
    _shade_smooth(handle_obj)
    return [frame_obj] + lines + [handle_obj]


def model_bait_jar():
    """A small jar for holding fishing bait."""
    # Jar body
    jar_mat = _make_material("BaitJar_mat", (0.45, 0.50, 0.42, 1.0), roughness=0.2,
                             metallic=0.1)
    jar_mesh = _cylinder(0.18, 0.35, vertices=12, name="BaitJar")
    jar_obj = _add_obj(jar_mesh, "BaitJar", jar_mat)
    _shade_smooth(jar_obj)
    # Lid
    lid_mat = _make_material("BaitJarLid_mat", C["iron"], roughness=0.5, metallic=0.7)
    lid_mesh = _cylinder(0.17, 0.05, vertices=12, name="BaitJarLid")
    lid_obj = _add_obj(lid_mesh, "BaitJarLid", lid_mat)
    lid_obj.location = (0, 0, 0.2)
    _shade_smooth(lid_obj)
    return [jar_obj, lid_obj]


# ---------------------------------------------------------------------------
# Batch 8: Potions, Remedies & Shrine
# ---------------------------------------------------------------------------

def _phial(color, liquid_color, roughness=0.15, name="Phial"):
    """A small glass phial with liquid inside."""
    # Bottle body
    bottle_mat = _make_material(f"{name}_mat", color, roughness=roughness,
                                metallic=0.1)
    bottle_mesh = _uv_sphere(0.18, segments=10, rings=8, name=name)
    for v in bottle_mesh.vertices:
        if v.co.z > 0.1:
            v.co.z *= 1.4
    bottle_obj = _add_obj(bottle_mesh, name, bottle_mat)
    _shade_smooth(bottle_obj)
    # Liquid inside
    liquid_mat = _make_material(f"{name}_liquid_mat", liquid_color, roughness=0.1,
                                emission=0.1)
    liquid_mesh = _uv_sphere(0.14, segments=8, rings=6, name=f"{name}_liquid")
    for v in liquid_mesh.vertices:
        if v.co.z > 0.0:
            v.co.z *= 0.8
        if v.co.z < -0.1:
            v.co.z *= 1.2
    liquid_obj = _add_obj(liquid_mesh, f"{name}_liquid", liquid_mat)
    _shade_smooth(liquid_obj)
    # Neck
    neck_mat = _make_material(f"{name}_neck_mat", color, roughness=roughness)
    neck_mesh = _cylinder(0.05, 0.15, vertices=8, name=f"{name}_neck")
    neck_obj = _add_obj(neck_mesh, f"{name}_neck", neck_mat)
    neck_obj.location = (0, 0, 0.28)
    _shade_smooth(neck_obj)
    # Cork
    cork_mat = _make_material(f"{name}_cork_mat", C["wood"], roughness=0.8)
    cork_mesh = _cylinder(0.045, 0.05, vertices=6, name=f"{name}_cork")
    cork_obj = _add_obj(cork_mesh, f"{name}_cork", cork_mat)
    cork_obj.location = (0, 0, 0.36)
    _shade_smooth(cork_obj)
    return [bottle_obj, liquid_obj, neck_obj, cork_obj]


def model_antidote():
    """An antidote — a green phial."""
    return _phial((0.35, 0.45, 0.35, 1.0), (0.25, 0.55, 0.25, 1.0), name="Antidote")


def model_arms_tincture():
    """An arms tincture — a reddish-brown phial."""
    return _phial((0.40, 0.35, 0.30, 1.0), (0.55, 0.25, 0.15, 1.0), name="ArmsTincture")


def model_cleanblood_salve():
    """A cleanblood salve — a pale pink phial."""
    return _phial((0.42, 0.48, 0.45, 1.0), (0.70, 0.45, 0.50, 1.0), name="CleanbloodSalve")


def model_cleanroot_wash():
    """A cleanroot wash — a clear phial with pale liquid."""
    return _phial((0.40, 0.45, 0.42, 1.0), (0.60, 0.58, 0.45, 1.0), name="CleanrootWash")


def model_empty_phial():
    """An empty glass phial."""
    mat = _make_material("EmptyPhial_mat", (0.45, 0.50, 0.48, 1.0), roughness=0.1,
                         metallic=0.1)
    mesh = _uv_sphere(0.18, segments=10, rings=8, name="EmptyPhial")
    for v in mesh.vertices:
        if v.co.z > 0.1:
            v.co.z *= 1.4
    obj = _add_obj(mesh, "EmptyPhial", mat)
    _shade_smooth(obj)
    # Neck
    neck_mat = _make_material("EmptyPhialNeck_mat", (0.45, 0.50, 0.48, 1.0),
                              roughness=0.1)
    neck_mesh = _cylinder(0.05, 0.15, vertices=8, name="EmptyPhialNeck")
    neck_obj = _add_obj(neck_mesh, "EmptyPhialNeck", neck_mat)
    neck_obj.location = (0, 0, 0.28)
    _shade_smooth(neck_obj)
    return [obj, neck_obj]


def model_shrine_candle():
    """A shrine candle — a tall wax candle with a flame."""
    # Candle body
    candle_mat = _make_material("ShrineCandle_mat", (0.85, 0.82, 0.70, 1.0),
                                roughness=0.5)
    candle_mesh = _cylinder(0.08, 0.45, vertices=10, name="ShrineCandle")
    candle_obj = _add_obj(candle_mesh, "ShrineCandle", candle_mat)
    _shade_smooth(candle_obj)
    # Wick
    wick_mat = _make_material("CandleWick_mat", (0.15, 0.12, 0.08, 1.0), roughness=0.8)
    wick_mesh = _cylinder(0.005, 0.04, vertices=4, name="CandleWick")
    wick_obj = _add_obj(wick_mesh, "CandleWick", wick_mat)
    wick_obj.location = (0, 0, 0.25)
    _shade_smooth(wick_obj)
    # Flame
    flame_mat = _make_material("CandleFlame_mat", (0.9, 0.6, 0.2, 1.0), roughness=0.0,
                               emission=1.5)
    flame_mesh = _uv_sphere(0.03, segments=6, rings=4, name="CandleFlame")
    for v in flame_mesh.vertices:
        if v.co.z > 0:
            v.co.z *= 2.0
            v.co.x *= 0.5
            v.co.y *= 0.5
    flame_obj = _add_obj(flame_mesh, "CandleFlame", flame_mat)
    flame_obj.location = (0, 0, 0.29)
    _shade_smooth(flame_obj)
    return [candle_obj, wick_obj, flame_obj]


def model_prayer_knot():
    """A prayer knot — a loop of knotted cord with beads."""
    cord_mat = _make_material("PrayerKnot_mat", (0.55, 0.45, 0.30, 1.0), roughness=0.8)
    # Main loop
    loop_mesh = _torus(0.22, 0.012, major_seg=16, minor_seg=4, name="PrayerKnot")
    loop_obj = _add_obj(loop_mesh, "PrayerKnot", cord_mat)
    _shade_smooth(loop_obj)
    # Knot: a small bulge on the loop
    knot_mat = _make_material("PrayerKnotKnot_mat", (0.45, 0.38, 0.25, 1.0),
                              roughness=0.8)
    knot_mesh = _uv_sphere(0.04, segments=6, rings=4, name="PrayerKnotKnot")
    knot_obj = _add_obj(knot_mesh, "PrayerKnotKnot", knot_mat)
    knot_obj.location = (0.22, 0, 0)
    _shade_smooth(knot_obj)
    # Beads along the loop
    bead_mat = _make_material("PrayerBead_mat", C["wood_dark"], roughness=0.5)
    beads = []
    for i in range(5):
        a = math.radians(i * 72 + 36)
        b_mesh = _uv_sphere(0.025, segments=5, rings=4, name=f"PrayerBead{i}")
        b_obj = _add_obj(b_mesh, f"PrayerBead{i}", bead_mat)
        b_obj.location = (math.cos(a) * 0.22, math.sin(a) * 0.22, 0)
        _shade_smooth(b_obj)
        beads.append(b_obj)
    return [loop_obj, knot_obj] + beads


def model_quest_point():
    """A quest point — a small glowing star medallion."""
    mat = _make_material("QuestPoint_mat", (0.75, 0.65, 0.25, 1.0), roughness=0.15,
                         metallic=0.9, emission=0.5)
    mesh = _ico(0.22, subdivisions=1, name="QuestPoint")
    obj = _add_obj(mesh, "QuestPoint", mat)
    obj.rotation_euler = (math.radians(20), 0, math.radians(30))
    _shade_flat(obj)
    # Cord
    cord_mat = _make_material("QPCord_mat", (0.55, 0.45, 0.30, 1.0), roughness=0.8)
    cord_mesh = _torus(0.25, 0.01, major_seg=12, minor_seg=3, name="QPCord")
    cord_obj = _add_obj(cord_mesh, "QPCord", cord_mat)
    cord_obj.rotation_euler = (math.radians(90), 0, 0)
    cord_obj.location = (0, 0, 0.15)
    _shade_smooth(cord_obj)
    return [obj, cord_obj]


# ---------------------------------------------------------------------------
# Batch 9: Raw Materials
# ---------------------------------------------------------------------------

def _log(color, roughness=0.85, name="Log"):
    """A wooden log — a cylinder lying on its side with bark texture."""
    mat = _make_material(f"{name}_mat", color, roughness=roughness)
    mesh = _cylinder(0.18, 0.55, vertices=12, name=name)
    _jitter_verts(mesh, 0.015, seed=hash(name) % 100)
    obj = _add_obj(mesh, name, mat)
    obj.rotation_euler = (0, math.radians(90), math.radians(10))
    _shade_flat(obj)
    # End grain: a slightly different colored disc
    end_mat = _make_material(f"{name}_end_mat", (color[0]*0.7, color[1]*0.7, color[2]*0.7, 1.0),
                             roughness=roughness)
    for i, x in enumerate([0.28, -0.28]):
        end_mesh = _cylinder(0.17, 0.01, vertices=12, name=f"{name}_end{i}")
        end_obj = _add_obj(end_mesh, f"{name}_end{i}", end_mat)
        end_obj.location = (x, 0, 0)
        end_obj.rotation_euler = (0, math.radians(90), math.radians(10))
        _shade_flat(end_obj)
    return [obj]

def model_dry_log():
    """A dry log — pale, cracked wood."""
    return _log((0.55, 0.45, 0.30, 1.0), roughness=0.9, name="DryLog")

def model_oak_log():
    """An oak log — rich brown."""
    return _log((0.40, 0.28, 0.15, 1.0), roughness=0.8, name="OakLog")

def model_oldroad_oak_log():
    """An oldroad oak log — darker oak."""
    return _log((0.32, 0.22, 0.12, 1.0), roughness=0.85, name="OldroadOakLog")

def model_riverwillow_log():
    """A riverwillow log — pale, greenish."""
    return _log((0.48, 0.42, 0.28, 1.0), roughness=0.8, name="RiverwillowLog")

def model_blackcoal():
    """A lump of black coal — dark, jagged."""
    mat = _make_material("Blackcoal_mat", (0.08, 0.07, 0.06, 1.0), roughness=0.95,
                         metallic=0.2)
    mesh = _ico(0.3, subdivisions=2, name="Blackcoal")
    _jitter_verts(mesh, 0.06, seed=62)
    obj = _add_obj(mesh, "Blackcoal", mat)
    _shade_flat(obj)
    return [obj]

def model_blackcoal_bundle():
    """A bundle of blackcoal lumps."""
    mat = _make_material("CoalBundle_mat", (0.08, 0.07, 0.06, 1.0), roughness=0.95,
                         metallic=0.2)
    lumps = []
    for i in range(3):
        mesh = _ico(0.18, subdivisions=1, name=f"CoalBundle{i}")
        _jitter_verts(mesh, 0.05, seed=63+i)
        obj = _add_obj(mesh, f"CoalBundle{i}", mat)
        obj.location = ((i-1)*0.15, 0, i*0.03)
        _shade_flat(obj)
        lumps.append(obj)
    # Tie
    tie_mat = _make_material("CoalTie_mat", C["sinew"], roughness=0.6)
    tie_mesh = _torus(0.22, 0.01, major_seg=10, minor_seg=3, name="CoalTie")
    tie_obj = _add_obj(tie_mesh, "CoalTie", tie_mat)
    tie_obj.rotation_euler = (math.radians(90), 0, 0)
    _shade_smooth(tie_obj)
    return lumps + [tie_obj]

def model_blackcoal_ash():
    """A pile of blackcoal ash — grey, fine."""
    mat = _make_material("CoalAsh_mat", (0.35, 0.33, 0.30, 1.0), roughness=0.95)
    mesh = _uv_sphere(0.25, segments=10, rings=6, name="CoalAsh")
    for v in mesh.vertices:
        v.co.z *= 0.4
    _jitter_verts(mesh, 0.03, seed=64)
    obj = _add_obj(mesh, "CoalAsh", mat)
    _shade_flat(obj)
    return [obj]

def model_soot_ash():
    """A pile of soot ash — darker than coal ash."""
    mat = _make_material("SootAsh_mat", (0.20, 0.18, 0.16, 1.0), roughness=0.95)
    mesh = _uv_sphere(0.25, segments=10, rings=6, name="SootAsh")
    for v in mesh.vertices:
        v.co.z *= 0.4
    _jitter_verts(mesh, 0.03, seed=65)
    obj = _add_obj(mesh, "SootAsh", mat)
    _shade_flat(obj)
    return [obj]

def model_ashling_ember():
    """An ashling ember — a small glowing coal."""
    mat = _make_material("AshlingEmber_mat", (0.55, 0.25, 0.10, 1.0), roughness=0.4,
                         emission=0.8)
    mesh = _ico(0.12, subdivisions=1, name="AshlingEmber")
    _jitter_verts(mesh, 0.03, seed=66)
    obj = _add_obj(mesh, "AshlingEmber", mat)
    _shade_flat(obj)
    # Ash crust
    crust_mat = _make_material("EmberCrust_mat", (0.25, 0.22, 0.20, 1.0), roughness=0.9)
    crust_mesh = _ico(0.14, subdivisions=1, name="EmberCrust")
    _jitter_verts(crust_mesh, 0.04, seed=67)
    crust_obj = _add_obj(crust_mesh, "EmberCrust", crust_mat)
    _shade_flat(crust_obj)
    return [obj, crust_obj]

def model_sinew_cord():
    """A coil of sinew cord."""
    mat = _make_material("SinewCord_mat", C["sinew"], roughness=0.6)
    cord = []
    for i in range(3):
        mesh = _torus(0.2 - i*0.03, 0.02, major_seg=12, minor_seg=4, name=f"SinewCord{i}")
        obj = _add_obj(mesh, f"SinewCord{i}", mat)
        obj.location = (0, 0, i * 0.03)
        _shade_smooth(obj)
        cord.append(obj)
    return cord

def model_soft_leather():
    """A piece of soft leather — a folded sheet."""
    mat = _make_material("SoftLeather_mat", (0.50, 0.38, 0.25, 1.0), roughness=0.7)
    mesh = _cube(0.4, name="SoftLeather")
    _jitter_verts(mesh, 0.02, seed=68)
    obj = _add_obj(mesh, "SoftLeather", mat)
    obj.scale = (0.5, 0.4, 0.04)
    obj.rotation_euler = (math.radians(10), 0, math.radians(15))
    _shade_flat(obj)
    return [obj]

def model_leather():
    """A piece of tanned leather — darker, stiffer."""
    mat = _make_material("Leather_mat", (0.35, 0.25, 0.15, 1.0), roughness=0.8)
    mesh = _cube(0.4, name="Leather")
    _jitter_verts(mesh, 0.02, seed=69)
    obj = _add_obj(mesh, "Leather", mat)
    obj.scale = (0.5, 0.4, 0.05)
    obj.rotation_euler = (math.radians(10), 0, math.radians(15))
    _shade_flat(obj)
    return [obj]

def model_glass_sand():
    """A pouch of glass sand — fine white sand."""
    mat = _make_material("GlassSand_mat", (0.80, 0.75, 0.65, 1.0), roughness=0.95)
    mesh = _uv_sphere(0.25, segments=10, rings=8, name="GlassSand")
    for v in mesh.vertices:
        v.co.z *= 0.7
    obj = _add_obj(mesh, "GlassSand", mat)
    _shade_flat(obj)
    # Pouch tie at top
    tie_mat = _make_material("SandTie_mat", C["sinew"], roughness=0.6)
    tie_mesh = _torus(0.15, 0.01, major_seg=10, minor_seg=3, name="SandTie")
    tie_obj = _add_obj(tie_mesh, "SandTie", tie_mat)
    tie_obj.location = (0, 0, 0.12)
    tie_obj.rotation_euler = (math.radians(90), 0, 0)
    _shade_smooth(tie_obj)
    return [obj, tie_obj]

def model_small_bones():
    """A pile of small bones."""
    mat = _make_material("SmallBones_mat", C["bone"], roughness=0.5)
    bones = []
    for i in range(4):
        mesh = _cylinder(0.02, 0.2, vertices=5, name=f"SmallBone{i}")
        obj = _add_obj(mesh, f"SmallBone{i}", mat)
        obj.location = ((i-1.5)*0.1, (i%2)*0.06-0.03, i*0.02)
        obj.rotation_euler = (math.radians(30+i*15), math.radians(i*20), 0)
        _shade_smooth(obj)
        bones.append(obj)
    return bones

def model_bone_chips():
    """A pile of bone chips — small fragments."""
    mat = _make_material("BoneChips_mat", C["bone"], roughness=0.6)
    chips = []
    for i in range(5):
        mesh = _ico(0.05, subdivisions=0, name=f"BoneChip{i}")
        _jitter_verts(mesh, 0.02, seed=70+i)
        obj = _add_obj(mesh, f"BoneChip{i}", mat)
        obj.location = ((i-2)*0.08, (i%2)*0.05-0.02, i*0.015)
        _shade_flat(obj)
        chips.append(obj)
    return chips


# ---------------------------------------------------------------------------
# Batch 10: Graveyard & Quest Items
# ---------------------------------------------------------------------------

def model_grave_dust():
    """A pinch of grave dust — dark, fine powder."""
    mat = _make_material("GraveDust_mat", (0.30, 0.27, 0.22, 1.0), roughness=0.95)
    mesh = _uv_sphere(0.18, segments=8, rings=6, name="GraveDust")
    for v in mesh.vertices:
        v.co.z *= 0.5
    _jitter_verts(mesh, 0.02, seed=71)
    obj = _add_obj(mesh, "GraveDust", mat)
    _shade_flat(obj)
    return [obj]

def model_grave_dust_bundle():
    """A bundle of grave dust in a pouch."""
    pouch = _pouch_body((0.25, 0.22, 0.18, 1.0), radius=0.30, height=0.40,
                        roughness=0.9, name="GraveDustBundle")
    cord = _drawstring_cord(C["sinew"], radius=0.30, height=0.40, name="GDBCord")
    return [pouch, cord]

def model_grave_flower():
    """A single grave flower — a pale bloom on a thin stem."""
    # Stem
    stem_mat = _make_material("GraveFlowerStem_mat", (0.35, 0.40, 0.25, 1.0),
                              roughness=0.7)
    stem_mesh = _cylinder(0.01, 0.4, vertices=5, name="GraveFlowerStem")
    stem_obj = _add_obj(stem_mesh, "GraveFlowerStem", stem_mat)
    _shade_smooth(stem_obj)
    # Flower head: 5 petals
    petal_mat = _make_material("GraveFlowerPetal_mat", (0.70, 0.65, 0.75, 1.0),
                               roughness=0.5)
    petals = []
    for i in range(5):
        a = math.radians(i * 72)
        p_mesh = _uv_sphere(0.05, segments=6, rings=4, name=f"GFlowerPetal{i}")
        p_obj = _add_obj(p_mesh, f"GFlowerPetal{i}", petal_mat)
        p_obj.location = (math.cos(a)*0.05, math.sin(a)*0.05, 0.22)
        p_obj.scale = (1, 0.5, 0.5)
        _shade_smooth(p_obj)
        petals.append(p_obj)
    # Center
    center_mat = _make_material("GFlowerCenter_mat", (0.50, 0.45, 0.40, 1.0),
                                roughness=0.5)
    center_mesh = _uv_sphere(0.025, segments=5, rings=4, name="GFlowerCenter")
    center_obj = _add_obj(center_mesh, "GFlowerCenter", center_mat)
    center_obj.location = (0, 0, 0.22)
    _shade_smooth(center_obj)
    return [stem_obj] + petals + [center_obj]

def model_grave_flower_bundle():
    """A bundle of grave flowers — three stems tied together."""
    flowers = []
    for i in range(3):
        stem_mat = _make_material(f"GFBStem{i}_mat", (0.35, 0.40, 0.25, 1.0), roughness=0.7)
        stem_mesh = _cylinder(0.008, 0.35, vertices=4, name=f"GFBStem{i}")
        stem_obj = _add_obj(stem_mesh, f"GFBStem{i}", stem_mat)
        stem_obj.location = ((i-1)*0.05, 0, 0)
        stem_obj.rotation_euler = (0, math.radians((i-1)*10), 0)
        _shade_smooth(stem_obj)
        # Petal head
        petal_mat = _make_material(f"GFBPetal{i}_mat", (0.70, 0.65, 0.75, 1.0), roughness=0.5)
        head_mesh = _uv_sphere(0.04, segments=5, rings=4, name=f"GFBHead{i}")
        head_obj = _add_obj(head_mesh, f"GFBHead{i}", petal_mat)
        head_obj.location = ((i-1)*0.05, 0, 0.2)
        _shade_smooth(head_obj)
        flowers.extend([stem_obj, head_obj])
    # Tie
    tie_mat = _make_material("GFBTie_mat", C["sinew"], roughness=0.6)
    tie_mesh = _torus(0.04, 0.008, major_seg=8, minor_seg=3, name="GFBTie")
    tie_obj = _add_obj(tie_mesh, "GFBTie", tie_mat)
    tie_obj.location = (0, 0, -0.1)
    _shade_smooth(tie_obj)
    return flowers + [tie_obj]

def model_grave_flower_seed():
    """A grave flower seed — a small dark seed."""
    mat = _make_material("GraveFlowerSeed_mat", (0.25, 0.20, 0.15, 1.0), roughness=0.8)
    mesh = _uv_sphere(0.06, segments=6, rings=4, name="GraveFlowerSeed")
    for v in mesh.vertices:
        v.co.z *= 1.5
    obj = _add_obj(mesh, "GraveFlowerSeed", mat)
    _shade_smooth(obj)
    return [obj]

def model_graveyard_moss():
    """A clump of graveyard moss — greenish, damp."""
    mat = _make_material("GraveyardMoss_mat", (0.30, 0.38, 0.22, 1.0), roughness=0.9)
    mesh = _uv_sphere(0.2, segments=8, rings=6, name="GraveyardMoss")
    for v in mesh.vertices:
        v.co.z *= 0.4
    _jitter_verts(mesh, 0.04, seed=72)
    obj = _add_obj(mesh, "GraveyardMoss", mat)
    _shade_flat(obj)
    return [obj]

def model_wrong_flower_petal():
    """A wrong flower petal — an off-color single petal."""
    mat = _make_material("WrongPetal_mat", (0.60, 0.35, 0.40, 1.0), roughness=0.5)
    mesh = _uv_sphere(0.1, segments=6, rings=4, name="WrongPetal")
    for v in mesh.vertices:
        v.co.z *= 0.3
        v.co.y *= 0.5
    obj = _add_obj(mesh, "WrongPetal", mat)
    obj.rotation_euler = (math.radians(30), 0, math.radians(20))
    _shade_smooth(obj)
    return [obj]

def model_polite_root():
    """A polite root — a clean, pale root."""
    mat = _make_material("PoliteRoot_mat", (0.65, 0.58, 0.42, 1.0), roughness=0.7)
    mesh = _cylinder(0.04, 0.4, vertices=6, name="PoliteRoot")
    # Branching curve
    for v in mesh.vertices:
        v.co.x += v.co.z * 0.1
        if v.co.z < -0.1:
            v.co.y += v.co.z * 0.05
    obj = _add_obj(mesh, "PoliteRoot", mat)
    obj.rotation_euler = (math.radians(60), 0, math.radians(20))
    _shade_smooth(obj)
    return [obj]

def model_listening_clay():
    """A lump of listening clay — grey, soft, with an ear-like shape."""
    mat = _make_material("ListeningClay_mat", (0.45, 0.42, 0.38, 1.0), roughness=0.8)
    mesh = _uv_sphere(0.25, segments=10, rings=8, name="ListeningClay")
    _jitter_verts(mesh, 0.03, seed=73)
    obj = _add_obj(mesh, "ListeningClay", mat)
    _shade_flat(obj)
    # Ear-like flap
    ear_mat = _make_material("ClayEar_mat", (0.45, 0.42, 0.38, 1.0), roughness=0.8)
    ear_mesh = _uv_sphere(0.08, segments=6, rings=4, name="ClayEar")
    for v in ear_mesh.vertices:
        v.co.z *= 0.3
    ear_obj = _add_obj(ear_mesh, "ClayEar", ear_mat)
    ear_obj.location = (0.15, 0, 0.1)
    ear_obj.rotation_euler = (0, math.radians(30), 0)
    _shade_smooth(ear_obj)
    return [obj, ear_obj]

def model_sooted_receipt():
    """A sooted receipt — a darkened paper slip."""
    mat = _make_material("SootedReceipt_mat", (0.35, 0.32, 0.28, 1.0), roughness=0.9)
    mesh = _cube(0.3, name="SootedReceipt")
    _jitter_verts(mesh, 0.02, seed=74)
    obj = _add_obj(mesh, "SootedReceipt", mat)
    obj.scale = (0.5, 0.25, 0.02)
    obj.rotation_euler = (math.radians(15), 0, math.radians(10))
    _shade_flat(obj)
    # Soot smudge
    soot_mat = _make_material("ReceiptSoot_mat", (0.15, 0.12, 0.10, 1.0), roughness=0.95)
    soot_mesh = _uv_sphere(0.08, segments=5, rings=4, name="ReceiptSoot")
    soot_obj = _add_obj(soot_mesh, "ReceiptSoot", soot_mat)
    soot_obj.location = (0.05, 0, 0.01)
    soot_obj.scale = (1.2, 0.8, 0.2)
    _shade_smooth(soot_obj)
    return [obj, soot_obj]

def model_baker_oven_key():
    """The baker oven key — a large iron key."""
    # Shaft
    shaft_mat = _make_material("OvenKey_mat", C["iron"], roughness=0.5, metallic=0.7)
    shaft_mesh = _cylinder(0.03, 0.4, vertices=6, name="OvenKey")
    shaft_obj = _add_obj(shaft_mesh, "OvenKey", shaft_mat)
    shaft_obj.rotation_euler = (math.radians(90), 0, 0)
    _shade_smooth(shaft_obj)
    # Head: a ring
    head_mat = _make_material("OvenKeyHead_mat", C["iron"], roughness=0.5, metallic=0.7)
    head_mesh = _torus(0.07, 0.02, major_seg=10, minor_seg=4, name="OvenKeyHead")
    head_obj = _add_obj(head_mesh, "OvenKeyHead", head_mat)
    head_obj.location = (0, 0, 0.25)
    head_obj.rotation_euler = (math.radians(90), 0, 0)
    _shade_smooth(head_obj)
    # Teeth: two small cubes at the end
    teeth_mat = _make_material("OvenKeyTeeth_mat", C["iron"], roughness=0.5, metallic=0.7)
    teeth = []
    for i, z in enumerate([0.1, 0.0]):
        t_mesh = _cube(0.05, name=f"OvenKeyTooth{i}")
        t_obj = _add_obj(t_mesh, f"OvenKeyTooth{i}", teeth_mat)
        t_obj.scale = (0.08, 0.04, 0.03)
        t_obj.location = (0.04, 0, z)
        _shade_flat(t_obj)
        teeth.append(t_obj)
    return [shaft_obj, head_obj] + teeth

def model_old_town_bread():
    """Old Town bread — a large round loaf for the quest."""
    loaf = _loaf((0.70, 0.50, 0.25, 1.0), roughness=0.7, name="OldTownBread")
    # Make it rounder
    loaf[0].scale = (0.9, 0.9, 1.0)
    return loaf

def model_ratcatcher_tail():
    """A ratcatcher's trophy tail — a bundle of rat tails tied together."""
    mat = _make_material("RatcatcherTail_mat", (0.50, 0.38, 0.30, 1.0), roughness=0.6)
    tails = []
    for i in range(3):
        mesh = _cylinder(0.02, 0.35, vertices=5, name=f"RTail{i}")
        for v in mesh.vertices:
            v.co.x += v.co.z * 0.08
        obj = _add_obj(mesh, f"RTail{i}", mat)
        obj.rotation_euler = (math.radians(60+i*5), 0, math.radians(15+i*5))
        obj.location = ((i-1)*0.04, 0, 0)
        _shade_smooth(obj)
        tails.append(obj)
    # Tie
    tie_mat = _make_material("RTailTie_mat", C["sinew"], roughness=0.6)
    tie_mesh = _torus(0.05, 0.008, major_seg=8, minor_seg=3, name="RTailTie")
    tie_obj = _add_obj(tie_mesh, "RTailTie", tie_mat)
    tie_obj.rotation_euler = (math.radians(60), 0, math.radians(15))
    _shade_smooth(tie_obj)
    return tails + [tie_obj]

def model_cellar_rat_tail():
    """A cellar rat tail — a single tail, darker."""
    mat = _make_material("CellarRatTail_mat", (0.35, 0.28, 0.22, 1.0), roughness=0.6)
    mesh = _cylinder(0.025, 0.4, vertices=5, name="CellarRatTail")
    for v in mesh.vertices:
        if v.co.z < -0.1:
            v.co.x *= 0.5
            v.co.y *= 0.5
        v.co.x += v.co.z * 0.1
    obj = _add_obj(mesh, "CellarRatTail", mat)
    obj.rotation_euler = (math.radians(60), 0, math.radians(20))
    _shade_smooth(obj)
    return [obj]


# ---------------------------------------------------------------------------
# Batch 11: Charms, Trophies & Misc
# ---------------------------------------------------------------------------

def model_bent_nail_ring():
    """A bent nail ring — a crude ring made from a bent nail."""
    mat = _make_material("NailRing_mat", C["iron"], roughness=0.5, metallic=0.6)
    mesh = _torus(0.12, 0.015, major_seg=12, minor_seg=4, name="NailRing")
    obj = _add_obj(mesh, "NailRing", mat)
    _shade_smooth(obj)
    # Nail head: a small flat bit
    head_mat = _make_material("NailHead_mat", (0.25, 0.22, 0.18, 1.0), roughness=0.5)
    head_mesh = _cylinder(0.03, 0.02, vertices=6, name="NailHead")
    head_obj = _add_obj(head_mesh, "NailHead", head_mat)
    head_obj.location = (0.12, 0, 0)
    head_obj.rotation_euler = (0, math.radians(90), 0)
    _shade_smooth(head_obj)
    return [obj, head_obj]

def model_mudhook_charm():
    """A mudhook charm — a small hook on a cord."""
    # Hook: a curved cylinder
    hook_mat = _make_material("MudhookCharm_mat", C["iron"], roughness=0.5, metallic=0.6)
    hook_mesh = _torus(0.08, 0.015, major_seg=10, minor_seg=4, name="MudhookCharm")
    # Only use half torus by squashing bottom
    for v in hook_mesh.vertices:
        if v.co.z < 0:
            v.co.z *= 0.3
    hook_obj = _add_obj(hook_mesh, "MudhookCharm", hook_mat)
    _shade_smooth(hook_obj)
    # Cord
    cord_mat = _make_material("MudhookCord_mat", C["sinew"], roughness=0.6)
    cord_mesh = _cylinder(0.008, 0.25, vertices=4, name="MudhookCord")
    cord_obj = _add_obj(cord_mesh, "MudhookCord", cord_mat)
    cord_obj.location = (0, 0, 0.15)
    _shade_smooth(cord_obj)
    return [hook_obj, cord_obj]

def model_crude_hookblade():
    """A crude hookblade — a knife with a hooked tip."""
    # Blade
    blade_mat = _make_material("Hookblade_mat", C["iron"], roughness=0.5, metallic=0.7)
    blade_mesh = _cube(0.35, name="Hookblade")
    blade_obj = _add_obj(blade_mesh, "Hookblade", blade_mat)
    blade_obj.scale = (0.4, 0.06, 0.03)
    blade_obj.location = (0.12, 0, 0.05)
    # Hook the tip
    for v in blade_mesh.vertices:
        if v.co.x > 0.2:
            v.co.z += (v.co.x - 0.2) * 0.5
    _shade_flat(blade_obj)
    # Handle
    handle_mat = _make_material("HookbladeHandle_mat", C["wood"], roughness=0.7)
    handle_mesh = _cylinder(0.035, 0.25, vertices=8, name="HookbladeHandle")
    handle_obj = _add_obj(handle_mesh, "HookbladeHandle", handle_mat)
    handle_obj.rotation_euler = (0, math.radians(90), 0)
    handle_obj.location = (-0.12, 0, 0.05)
    _shade_smooth(handle_obj)
    return [blade_obj, handle_obj]

def model_mudhook_jaw():
    """A mudhook jaw — a jagged jawbone trophy."""
    mat = _make_material("MudhookJaw_mat", C["bone"], roughness=0.5)
    mesh = _cylinder(0.04, 0.4, vertices=8, name="MudhookJaw")
    # Curve into a jaw shape
    for v in mesh.vertices:
        v.co.y += abs(v.co.x) * 0.15
    _jitter_verts(mesh, 0.02, seed=75)
    obj = _add_obj(mesh, "MudhookJaw", mat)
    obj.rotation_euler = (math.radians(20), 0, math.radians(15))
    _shade_smooth(obj)
    # Teeth: small cones along the edge
    teeth_mat = _make_material("JawTeeth_mat", (0.85, 0.82, 0.72, 1.0), roughness=0.4)
    teeth = []
    for i in range(4):
        t_mesh = _cylinder(0.015, 0.05, vertices=4, name=f"JawTooth{i}")
        for v in t_mesh.vertices:
            if v.co.z > 0:
                v.co.x *= 0.3
                v.co.y *= 0.3
        t_obj = _add_obj(t_mesh, f"JawTooth{i}", teeth_mat)
        t_obj.location = ((i-1.5)*0.08, 0.05, 0.04)
        t_obj.rotation_euler = (0, math.radians(180), 0)
        _shade_smooth(t_obj)
        teeth.append(t_obj)
    return [obj] + teeth

def model_bellfeathers():
    """A single bellfeather — a feather with a bell-like curl."""
    # Shaft
    shaft_mat = _make_material("Bellfeather_mat", (0.65, 0.60, 0.45, 1.0), roughness=0.6)
    shaft_mesh = _cylinder(0.008, 0.5, vertices=4, name="Bellfeather")
    shaft_obj = _add_obj(shaft_mesh, "Bellfeather", shaft_mat)
    shaft_obj.rotation_euler = (math.radians(75), 0, math.radians(15))
    _shade_smooth(shaft_obj)
    # Barb: a flat elongated shape
    barb_mat = _make_material("BellfeatherBarb_mat", (0.70, 0.65, 0.50, 1.0), roughness=0.5)
    barb_mesh = _uv_sphere(0.1, segments=8, rings=6, name="BellfeatherBarb")
    for v in barb_mesh.vertices:
        v.co.z *= 0.15
        v.co.y *= 2.5
    barb_obj = _add_obj(barb_mesh, "BellfeatherBarb", barb_mat)
    barb_obj.location = (0.1, 0, 0.15)
    barb_obj.rotation_euler = (math.radians(75), 0, math.radians(15))
    _shade_smooth(barb_obj)
    return [shaft_obj, barb_obj]

def model_bellfeather_bundle():
    """A bundle of bellfeathers — three feathers tied."""
    feathers = []
    for i in range(3):
        shaft_mat = _make_material(f"BFB{i}_mat", (0.65, 0.60, 0.45, 1.0), roughness=0.6)
        shaft_mesh = _cylinder(0.006, 0.4, vertices=4, name=f"BFBShaft{i}")
        shaft_obj = _add_obj(shaft_mesh, f"BFBShaft{i}", shaft_mat)
        shaft_obj.rotation_euler = (math.radians(70+i*5), 0, math.radians(15+i*5))
        shaft_obj.location = ((i-1)*0.04, 0, 0)
        _shade_smooth(shaft_obj)
        barb_mat = _make_material(f"BFBBarb{i}_mat", (0.70, 0.65, 0.50, 1.0), roughness=0.5)
        barb_mesh = _uv_sphere(0.08, segments=6, rings=4, name=f"BFBBarb{i}")
        for v in barb_mesh.vertices:
            v.co.z *= 0.15
            v.co.y *= 2.5
        barb_obj = _add_obj(barb_mesh, f"BFBBarb{i}", barb_mat)
        barb_obj.location = ((i-1)*0.04+0.08, 0, 0.12)
        barb_obj.rotation_euler = (math.radians(70+i*5), 0, math.radians(15+i*5))
        _shade_smooth(barb_obj)
        feathers.extend([shaft_obj, barb_obj])
    # Tie
    tie_mat = _make_material("BFBTie_mat", C["sinew"], roughness=0.6)
    tie_mesh = _torus(0.04, 0.008, major_seg=8, minor_seg=3, name="BFBTie")
    tie_obj = _add_obj(tie_mesh, "BFBTie", tie_mat)
    tie_obj.location = (0, 0, -0.1)
    _shade_smooth(tie_obj)
    return feathers + [tie_obj]

def model_bellfang_charm():
    """A bellfang charm — a small fang on a cord."""
    # Fang
    fang_mat = _make_material("BellfangCharm_mat", C["bone"], roughness=0.4)
    fang_mesh = _cylinder(0.03, 0.15, vertices=6, name="BellfangCharm")
    for v in fang_mesh.vertices:
        if v.co.z > 0:
            v.co.x *= 0.3
            v.co.y *= 0.3
    fang_obj = _add_obj(fang_mesh, "BellfangCharm", fang_mat)
    _shade_smooth(fang_obj)
    # Cord loop
    cord_mat = _make_material("BellfangCord_mat", C["sinew"], roughness=0.6)
    cord_mesh = _torus(0.1, 0.01, major_seg=10, minor_seg=3, name="BellfangCord")
    cord_obj = _add_obj(cord_mesh, "BellfangCord", cord_mat)
    cord_obj.rotation_euler = (math.radians(90), 0, 0)
    cord_obj.location = (0, 0, 0.12)
    _shade_smooth(cord_obj)
    return [fang_obj, cord_obj]

def model_shell_chip_bundle():
    """A bundle of shell chips — small fragments tied together."""
    mat = _make_material("ShellChip_mat", (0.75, 0.72, 0.65, 1.0), roughness=0.4)
    chips = []
    for i in range(5):
        mesh = _ico(0.06, subdivisions=0, name=f"ShellChip{i}")
        _jitter_verts(mesh, 0.02, seed=76+i)
        obj = _add_obj(mesh, f"ShellChip{i}", mat)
        obj.location = ((i-2)*0.08, (i%2)*0.04-0.02, i*0.015)
        _shade_flat(obj)
        chips.append(obj)
    # Tie
    tie_mat = _make_material("ShellChipTie_mat", C["sinew"], roughness=0.6)
    tie_mesh = _torus(0.05, 0.008, major_seg=8, minor_seg=3, name="ShellChipTie")
    tie_obj = _add_obj(tie_mesh, "ShellChipTie", tie_mat)
    _shade_smooth(tie_obj)
    return chips + [tie_obj]

def model_old_snapper_shell():
    """A shell from the Old Snapper — a large, ridged shell."""
    mat = _make_material("SnapperShell_mat", (0.55, 0.50, 0.40, 1.0), roughness=0.3,
                         metallic=0.2)
    mesh = _uv_sphere(0.3, segments=12, rings=8, name="SnapperShell")
    # Flatten into a shell dome
    for v in mesh.vertices:
        if v.co.z < 0:
            v.co.z *= 0.1
        v.co.y *= 0.8
    obj = _add_obj(mesh, "SnapperShell", mat)
    obj.rotation_euler = (math.radians(20), 0, math.radians(15))
    _shade_smooth(obj)
    # Ridge lines
    ridge_mat = _make_material("ShellRidge_mat", (0.40, 0.35, 0.28, 1.0), roughness=0.4)
    ridges = []
    for i in range(3):
        r_mesh = _torus(0.25-i*0.06, 0.008, major_seg=10, minor_seg=3, name=f"ShellRidge{i}")
        r_obj = _add_obj(r_mesh, f"ShellRidge{i}", ridge_mat)
        r_obj.rotation_euler = (math.radians(20), 0, math.radians(15))
        r_obj.scale = (1, 0.8, 0.3)
        _shade_smooth(r_obj)
        ridges.append(r_obj)
    return [obj] + ridges

def model_snapped_hook():
    """A snapped hook — a broken fishing hook."""
    mat = _make_material("SnappedHook_mat", C["iron"], roughness=0.5, metallic=0.7)
    mesh = _torus(0.08, 0.015, major_seg=10, minor_seg=4, name="SnappedHook")
    # Break: squash one side
    for v in mesh.vertices:
        if v.co.x > 0.05:
            v.co.z += 0.1
            v.co.x *= 0.5
    obj = _add_obj(mesh, "SnappedHook", mat)
    _shade_smooth(obj)
    return [obj]

def model_echo_dust():
    """Echo dust — a small glowing pile of dust."""
    mat = _make_material("EchoDust_mat", (0.45, 0.50, 0.55, 1.0), roughness=0.3,
                         emission=0.6)
    mesh = _uv_sphere(0.12, segments=8, rings=6, name="EchoDust")
    for v in mesh.vertices:
        v.co.z *= 0.4
    _jitter_verts(mesh, 0.02, seed=77)
    obj = _add_obj(mesh, "EchoDust", mat)
    _shade_smooth(obj)
    return [obj]


# ---------------------------------------------------------------------------
# Batch 12: Documents, Maps & Wearables
# ---------------------------------------------------------------------------

def model_blank_map():
    """A blank map — a rolled parchment."""
    mat = _make_material("BlankMap_mat", (0.82, 0.78, 0.65, 1.0), roughness=0.8)
    mesh = _cylinder(0.1, 0.4, vertices=10, name="BlankMap")
    obj = _add_obj(mesh, "BlankMap", mat)
    obj.rotation_euler = (0, math.radians(90), math.radians(10))
    _shade_smooth(obj)
    # Tie cord
    tie_mat = _make_material("BlankMapTie_mat", C["sinew"], roughness=0.6)
    tie_mesh = _torus(0.11, 0.008, major_seg=10, minor_seg=3, name="BlankMapTie")
    tie_obj = _add_obj(tie_mesh, "BlankMapTie", tie_mat)
    tie_obj.rotation_euler = (0, math.radians(90), math.radians(10))
    _shade_smooth(tie_obj)
    return [obj, tie_obj]

def model_old_town_map():
    """An Old Town map — a partially unrolled parchment."""
    # Rolled part
    roll_mat = _make_material("OTMapRoll_mat", (0.80, 0.75, 0.60, 1.0), roughness=0.8)
    roll_mesh = _cylinder(0.08, 0.25, vertices=10, name="OTMapRoll")
    roll_obj = _add_obj(roll_mesh, "OTMapRoll", roll_mat)
    roll_obj.rotation_euler = (0, math.radians(90), math.radians(10))
    roll_obj.location = (-0.1, 0, 0)
    _shade_smooth(roll_obj)
    # Unrolled part: a flat sheet
    sheet_mat = _make_material("OTMapSheet_mat", (0.82, 0.78, 0.65, 1.0), roughness=0.8)
    sheet_mesh = _cube(0.3, name="OTMapSheet")
    sheet_obj = _add_obj(sheet_mesh, "OTMapSheet", sheet_mat)
    sheet_obj.scale = (0.4, 0.3, 0.015)
    sheet_obj.location = (0.1, 0, 0.02)
    sheet_obj.rotation_euler = (0, 0, math.radians(10))
    _shade_flat(sheet_obj)
    # A few ink marks
    ink_mat = _make_material("OTMapInk_mat", (0.15, 0.12, 0.10, 1.0), roughness=0.8)
    marks = []
    for i, (x, y) in enumerate([(0.05, 0.03), (0.12, -0.02), (0.0, -0.05)]):
        m_mesh = _uv_sphere(0.015, segments=4, rings=3, name=f"OTMapInk{i}")
        m_obj = _add_obj(m_mesh, f"OTMapInk{i}", ink_mat)
        m_obj.location = (x, y, 0.04)
        _shade_smooth(m_obj)
        marks.append(m_obj)
    return [roll_obj, sheet_obj] + marks

def model_warden_contract_book():
    """A warden contract book — a small bound ledger."""
    cover_mat = _make_material("WardenContract_mat", (0.20, 0.15, 0.12, 1.0), roughness=0.6)
    cover_mesh = _cube(0.4, name="WardenContract")
    book_obj = _add_obj(cover_mesh, "WardenContract", cover_mat)
    book_obj.scale = (0.4, 0.3, 0.1)
    book_obj.rotation_euler = (math.radians(15), 0, math.radians(10))
    _shade_flat(book_obj)
    # Spine
    spine_mat = _make_material("WCSpine_mat", (0.12, 0.08, 0.06, 1.0), roughness=0.5)
    spine_mesh = _cube(0.3, name="WCSpine")
    spine_obj = _add_obj(spine_mesh, "WCSpine", spine_mat)
    spine_obj.scale = (0.05, 0.3, 0.11)
    spine_obj.location = (-0.18, 0, 0)
    spine_obj.rotation_euler = (math.radians(15), 0, math.radians(10))
    _shade_flat(spine_obj)
    # Warden seal on cover
    seal_mat = _make_material("WCSeal_mat", C["silver"], roughness=0.2, metallic=0.9)
    seal_mesh = _cylinder(0.05, 0.02, vertices=8, name="WCSeal")
    seal_obj = _add_obj(seal_mesh, "WCSeal", seal_mat)
    seal_obj.location = (0.05, 0, 0.06)
    seal_obj.rotation_euler = (math.radians(15), 0, math.radians(10))
    _shade_smooth(seal_obj)
    return [book_obj, spine_obj, seal_obj]

def model_blank_writ():
    """A blank writ — a flat parchment with a wax seal."""
    mat = _make_material("BlankWrit_mat", (0.85, 0.80, 0.68, 1.0), roughness=0.8)
    mesh = _cube(0.4, name="BlankWrit")
    obj = _add_obj(mesh, "BlankWrit", mat)
    obj.scale = (0.5, 0.3, 0.02)
    obj.rotation_euler = (math.radians(10), 0, math.radians(5))
    _shade_flat(obj)
    # Wax seal
    seal_mat = _make_material("BlankWritSeal_mat", C["wax_red"], roughness=0.25)
    seal_mesh = _cylinder(0.06, 0.025, vertices=8, name="BlankWritSeal")
    seal_obj = _add_obj(seal_mesh, "BlankWritSeal", seal_mat)
    seal_obj.location = (0.1, -0.05, 0.03)
    seal_obj.rotation_euler = (math.radians(10), 0, math.radians(5))
    _shade_smooth(seal_obj)
    return [obj, seal_obj]

def model_blank_parchment():
    """A blank parchment — a flat sheet."""
    mat = _make_material("BlankParchment_mat", (0.88, 0.83, 0.70, 1.0), roughness=0.8)
    mesh = _cube(0.4, name="BlankParchment")
    obj = _add_obj(mesh, "BlankParchment", mat)
    obj.scale = (0.5, 0.35, 0.015)
    obj.rotation_euler = (math.radians(10), 0, math.radians(8))
    _shade_flat(obj)
    # Curl one corner
    for v in mesh.vertices:
        if v.co.x > 0.3 and v.co.y > 0.3:
            v.co.z += 0.1
    return [obj]

def model_rope_belt():
    """A rope belt — a coiled length of rope."""
    mat = _make_material("RopeBelt_mat", (0.60, 0.52, 0.35, 1.0), roughness=0.85)
    coils = []
    for i in range(3):
        mesh = _torus(0.2-i*0.03, 0.025, major_seg=14, minor_seg=4, name=f"RopeBelt{i}")
        obj = _add_obj(mesh, f"RopeBelt{i}", mat)
        obj.location = (0, 0, i*0.04)
        _shade_smooth(obj)
        coils.append(obj)
    # Fringe end
    fringe_mat = _make_material("RopeFringe_mat", (0.55, 0.48, 0.32, 1.0), roughness=0.85)
    fringe_mesh = _cylinder(0.01, 0.08, vertices=4, name="RopeFringe")
    fringe_obj = _add_obj(fringe_mesh, "RopeFringe", fringe_mat)
    fringe_obj.location = (0.2, 0, 0)
    fringe_obj.rotation_euler = (0, math.radians(60), 0)
    _shade_smooth(fringe_obj)
    return coils + [fringe_obj]


# ---------------------------------------------------------------------------
# Batch registry
# ---------------------------------------------------------------------------

BATCHES = {
    "beads": {
        "ember_bead": model_ember_bead,
        "gust_bead": model_gust_bead,
        "wit_bead": model_wit_bead,
        "writ_bead": model_writ_bead,
        "tide_bead": model_tide_bead,
        "loam_bead": model_loam_bead,
        "bone_bead": model_bone_bead,
        "grave_bead": model_grave_bead,
        "prayer_bead": model_prayer_bead,
        "raw_bead": model_raw_bead,
        "fired_bead": model_fired_bead,
        "bead_clay": model_bead_clay,
        "bead_drill": model_bead_drill,
    },
    "pouches": {
        "false_bottom_pouch": model_false_bottom_pouch,
        "threadbare_bead_pouch": model_threadbare_bead_pouch,
        "waxed_bead_pouch": model_waxed_bead_pouch,
        "warden_bead_pouch": model_warden_bead_pouch,
        "grave_bead_pouch": model_grave_bead_pouch,
        "starfall_bead_pouch": model_starfall_bead_pouch,
        "threadbare_tool_roll": model_threadbare_tool_roll,
    },
    "metals": {
        "copper_ore": model_copper_ore,
        "tin_ore": model_tin_ore,
        "iron_ore": model_iron_ore,
        "tinstone": model_tinstone,
        "pig_iron_ore": model_pig_iron_ore,
        "pig_iron_scrap": model_pig_iron_scrap,
        "pig_iron_scrap_bundle": model_pig_iron_scrap_bundle,
        "pig_iron_hammer": model_pig_iron_hammer,
        "pennywrought_ingot": model_pennywrought_ingot,
        "pennywrought_axe": model_pennywrought_axe,
        "pennywrought_pickaxe": model_pennywrought_pickaxe,
        "penny_copper_ore": model_penny_copper_ore,
        "penny_arrowheads": model_penny_arrowheads,
        "bronze_bar": model_bronze_bar,
        "tin_badge": model_tin_badge,
        "foundry_token": model_foundry_token,
    },
    "food": {
        "bread": model_bread,
        "crusty_loaf": model_crusty_loaf,
        "bellbread": model_bellbread,
        "raw_fish": model_raw_fish,
        "cooked_fish": model_cooked_fish,
        "burnt_fish": model_burnt_fish,
        "raw_tinfin": model_raw_tinfin,
        "snapper_meat": model_snapper_meat,
        "ditch_shrimp": model_ditch_shrimp,
        "ditch_shrimp_skewer": model_ditch_shrimp_skewer,
        "tinfin_pie": model_tinfin_pie,
        "favour_cordial": model_favour_cordial,
        "warden_ration": model_warden_ration,
    },
    "hides": {
        "cow_hide": model_cow_hide,
        "fox_hide": model_fox_hide,
        "rabbit_hide": model_rabbit_hide,
        "warm_scale": model_warm_scale,
        "tallow_drake_scale": model_tallow_drake_scale,
        "drake_tooth": model_drake_tooth,
        "river_tooth": model_river_tooth,
        "bat_mother_claw": model_bat_mother_claw,
        "rat_tail": model_rat_tail,
        "cellar_fur_bundle": model_cellar_fur_bundle,
        "cellar_king_whisker": model_cellar_king_whisker,
        "wing_hide_roll": model_wing_hide_roll,
    },
    "tokens": {
        "coin": model_coin,
        "bell_token": model_bell_token,
        "warden_mark": model_warden_mark,
        "ledger_seven": model_ledger_seven,
        "bell_token_proof": model_bell_token_proof,
        "torn_ledger_scrap": model_torn_ledger_scrap,
        "quarry_token": model_quarry_token,
        "wax_seal": model_wax_seal,
        "soot_mark": model_soot_mark,
        "ledger_sort_voucher": model_ledger_sort_voucher,
        "market_token": model_market_token,
        "grave_token": model_grave_token,
        "kiln_token": model_kiln_token,
        "river_token": model_river_token,
    },
    "tools": {
        "flintbox": model_flintbox,
        "bone_needle": model_bone_needle,
        "whittling_knife": model_whittling_knife,
        "market_pot": model_market_pot,
        "tongs": model_tongs,
        "basic_mould": model_basic_mould,
        "blacksealed_pickset": model_blacksealed_pickset,
        "awl": model_awl,
        "bent_pick": model_bent_pick,
        "arrow_shafts": model_arrow_shafts,
        "thread": model_thread,
        "patch_leather": model_patch_leather,
        "glaze_bowl": model_glaze_bowl,
        "offering_bowl": model_offering_bowl,
        "reed_rod": model_reed_rod,
        "small_net": model_small_net,
        "bait_jar": model_bait_jar,
    },
    "potions": {
        "antidote": model_antidote,
        "arms_tincture": model_arms_tincture,
        "cleanblood_salve": model_cleanblood_salve,
        "cleanroot_wash": model_cleanroot_wash,
        "empty_phial": model_empty_phial,
        "shrine_candle": model_shrine_candle,
        "prayer_knot": model_prayer_knot,
        "quest_point": model_quest_point,
    },
    "materials": {
        "dry_log": model_dry_log,
        "oak_log": model_oak_log,
        "oldroad_oak_log": model_oldroad_oak_log,
        "riverwillow_log": model_riverwillow_log,
        "blackcoal": model_blackcoal,
        "blackcoal_bundle": model_blackcoal_bundle,
        "blackcoal_ash": model_blackcoal_ash,
        "soot_ash": model_soot_ash,
        "ashling_ember": model_ashling_ember,
        "sinew_cord": model_sinew_cord,
        "soft_leather": model_soft_leather,
        "leather": model_leather,
        "glass_sand": model_glass_sand,
        "small_bones": model_small_bones,
        "bone_chips": model_bone_chips,
    },
    "graveyard": {
        "grave_dust": model_grave_dust,
        "grave_dust_bundle": model_grave_dust_bundle,
        "grave_flower": model_grave_flower,
        "grave_flower_bundle": model_grave_flower_bundle,
        "grave_flower_seed": model_grave_flower_seed,
        "graveyard_moss": model_graveyard_moss,
        "wrong_flower_petal": model_wrong_flower_petal,
        "polite_root": model_polite_root,
        "listening_clay": model_listening_clay,
        "sooted_receipt": model_sooted_receipt,
        "smoke_over_old_town_baker_oven_key": model_baker_oven_key,
        "smoke_over_old_town_old_town_bread": model_old_town_bread,
        "ratcatcher_tail": model_ratcatcher_tail,
        "smoke_over_old_town_cellar_rat_tail": model_cellar_rat_tail,
    },
    "charms": {
        "bent_nail_ring": model_bent_nail_ring,
        "mudhook_charm": model_mudhook_charm,
        "crude_hookblade": model_crude_hookblade,
        "mudhook_jaw": model_mudhook_jaw,
        "bellfeathers": model_bellfeathers,
        "bellfeather_bundle": model_bellfeather_bundle,
        "bellfang_charm": model_bellfang_charm,
        "shell_chip_bundle": model_shell_chip_bundle,
        "old_snapper_shell": model_old_snapper_shell,
        "snapped_hook": model_snapped_hook,
        "echo_dust": model_echo_dust,
    },
    "documents": {
        "blank_map": model_blank_map,
        "old_town_map": model_old_town_map,
        "warden_contract_book": model_warden_contract_book,
        "blank_writ": model_blank_writ,
        "blank_parchment": model_blank_parchment,
        "rope_belt": model_rope_belt,
    },
}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def render_batch(batch_name, items):
    os.makedirs(OUT_DIR, exist_ok=True)
    ok = 0
    failed = 0
    for item_id, model_fn in items.items():
        _clear_scene()
        _setup_render()
        _setup_camera()
        _setup_lights()
        try:
            model_fn()
            out_path = os.path.join(OUT_DIR, f"{item_id}.png")
            bpy.context.scene.render.filepath = out_path
            bpy.ops.render.render(write_still=True)
            print(f"[item-icons] rendered {item_id} -> {out_path}")
            ok += 1
        except Exception as exc:
            print(f"[item-icons] FAILED {item_id}: {exc}")
            failed += 1
    print(f"[item-icons] batch '{batch_name}' done. {ok} ok, {failed} failed.")


def main():
    # Parse --batch argument
    batch_name = "beads"
    args = sys.argv
    if "--" in args:
        post = args[args.index("--") + 1:]
        for i, a in enumerate(post):
            if a == "--batch" and i + 1 < len(post):
                batch_name = post[i + 1]

    if batch_name == "all":
        for name, items in BATCHES.items():
            render_batch(name, items)
    else:
        items = BATCHES.get(batch_name)
        if not items:
            print(f"[item-icons] unknown batch '{batch_name}'. Available: {list(BATCHES.keys())}")
            sys.exit(1)
        render_batch(batch_name, items)


if __name__ == "__main__":
    main()
    bpy.ops.wm.quit_blender()
