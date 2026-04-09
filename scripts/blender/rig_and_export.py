"""
RoosterVerse — Headless Rigging + Export
=========================================
Blender headless modda çalıştırılır:

  blender --background --python rig_and_export.py -- input.glb output.glb

Otomatik olarak:
  1. GLB import
  2. Armature ekleme (10 kemik)
  3. Automatic weight paint
  4. IK constraints
  5. 3 animasyon klibi (Idle, Walk, Interact)
  6. GLB export (rigged + animated)
"""

import bpy
import sys
import os
import math
import mathutils
from mathutils import Vector

# ============================================================
# ARGS PARSE
# ============================================================
argv = sys.argv
# "--" den sonraki argümanları al
if "--" in argv:
    args = argv[argv.index("--") + 1:]
else:
    args = []

if len(args) < 2:
    print("Kullanım: blender --background --python rig_and_export.py -- input.glb output.glb")
    print("Argüman bulunamadı, varsayılan kullanılıyor...")
    INPUT_GLB = None
    OUTPUT_GLB = None
else:
    INPUT_GLB = args[0]
    OUTPUT_GLB = args[1]

FRAME_RATE = 24
IDLE_FRAMES = 60
WALK_FRAMES = 24
INTERACT_FRAMES = 30


# ============================================================
# CLEANUP
# ============================================================
def clean_scene():
    """Sahneyi temizle."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    # Orphan data temizle
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in bpy.data.armatures:
        if block.users == 0:
            bpy.data.armatures.remove(block)


# ============================================================
# IMPORT
# ============================================================
def import_glb(filepath):
    """GLB dosyasını import et."""
    print(f"Importing: {filepath}")
    bpy.ops.import_scene.gltf(filepath=filepath)
    print("✓ Import tamamlandı")


# ============================================================
# MESH BUL + ANALİZ
# ============================================================
def find_rooster_mesh():
    meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH']
    if not meshes:
        raise RuntimeError("Sahnede mesh bulunamadı!")
    biggest = max(meshes, key=lambda m: max(m.dimensions))
    return biggest


def analyze_mesh(mesh_obj):
    bb = [mesh_obj.matrix_world @ Vector(corner) for corner in mesh_obj.bound_box]
    min_x = min(v.x for v in bb)
    max_x = max(v.x for v in bb)
    min_y = min(v.y for v in bb)
    max_y = max(v.y for v in bb)
    min_z = min(v.z for v in bb)
    max_z = max(v.z for v in bb)

    height = max_z - min_z
    width = max_x - min_x
    depth = max_y - min_y

    print(f"  Boyut: {width:.3f} x {depth:.3f} x {height:.3f}")
    return {
        'center_x': (min_x + max_x) / 2,
        'center_y': (min_y + max_y) / 2,
        'min_z': min_z, 'max_z': max_z,
        'height': height, 'width': width, 'depth': depth,
        'min_x': min_x, 'max_x': max_x,
        'min_y': min_y, 'max_y': max_y,
    }


# ============================================================
# ARMATURE OLUŞTUR
# ============================================================
def create_armature(mesh_obj, dims):
    h = dims['height']
    cx = dims['center_x']
    cy = dims['center_y']
    base_z = dims['min_z']

    body_z = base_z + h * 0.45
    hip_z = base_z + h * 0.35
    knee_z = base_z + h * 0.18
    foot_z = base_z + h * 0.02
    shoulder_z = base_z + h * 0.55
    neck_base_z = base_z + h * 0.60
    neck_top_z = base_z + h * 0.78
    head_top_z = base_z + h * 0.90
    comb_z = base_z + h * 0.95
    tail_z = base_z + h * 0.50
    tail_end_z = base_z + h * 0.65

    leg_spread = dims['width'] * 0.2
    wing_spread = dims['width'] * 0.45

    bpy.ops.object.armature_add(enter_editmode=True, location=(cx, cy, 0))
    arm_obj = bpy.context.active_object
    arm_obj.name = "RoosterArmature"
    arm = arm_obj.data
    arm.name = "RoosterRig"

    bpy.ops.armature.select_all(action='SELECT')
    bpy.ops.armature.delete()

    def bone(name, head, tail, parent=None, connect=False):
        b = arm.edit_bones.new(name)
        b.head = Vector(head)
        b.tail = Vector(tail)
        if parent:
            b.parent = arm.edit_bones[parent]
            b.use_connect = connect
        return b

    spine = bone("Spine", (0, 0, hip_z), (0, 0, neck_base_z))
    bone("Neck", (0, 0, neck_base_z), (0, -dims['depth']*0.15, neck_top_z), "Spine", True)
    bone("Head", (0, -dims['depth']*0.15, neck_top_z), (0, -dims['depth']*0.25, head_top_z), "Neck", True)
    bone("Beak", (0, -dims['depth']*0.25, head_top_z), (0, -dims['depth']*0.4, head_top_z - h*0.05), "Head", True)
    bone("Comb", (0, -dims['depth']*0.15, head_top_z), (0, -dims['depth']*0.1, comb_z), "Head")

    bone("Leg.L", (leg_spread, 0, hip_z), (leg_spread, 0, knee_z), "Spine")
    bone("Shin.L", (leg_spread, 0, knee_z), (leg_spread, 0.02, foot_z), "Leg.L", True)
    bone("Leg.R", (-leg_spread, 0, hip_z), (-leg_spread, 0, knee_z), "Spine")
    bone("Shin.R", (-leg_spread, 0, knee_z), (-leg_spread, 0.02, foot_z), "Leg.R", True)

    bone("Wing.L", (leg_spread, 0, shoulder_z), (wing_spread, -dims['depth']*0.1, shoulder_z - h*0.05), "Spine")
    bone("Wing.R", (-leg_spread, 0, shoulder_z), (-wing_spread, -dims['depth']*0.1, shoulder_z - h*0.05), "Spine")

    bone("Tail", (0, dims['depth']*0.15, tail_z), (0, dims['depth']*0.35, tail_end_z), "Spine")

    bpy.ops.object.mode_set(mode='OBJECT')
    print("✓ Armature: 12 kemik")
    return arm_obj


# ============================================================
# PARENT + WEIGHT PAINT
# ============================================================
def parent_mesh(mesh_obj, arm_obj):
    bpy.ops.object.select_all(action='DESELECT')
    mesh_obj.select_set(True)
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    try:
        bpy.ops.object.parent_set(type='ARMATURE_AUTO')
        print("✓ Weight paint (automatic)")
    except Exception:
        print("  ⚠ Auto weights kısmen başarısız, envelope deneniyor...")
        bpy.ops.object.parent_set(type='ARMATURE_ENVELOPE')
        print("✓ Weight paint (envelope)")


# ============================================================
# IK CONSTRAINTS
# ============================================================
def add_ik(arm_obj):
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='POSE')
    for side in ['L', 'R']:
        name = f"Shin.{side}"
        if name in arm_obj.pose.bones:
            ik = arm_obj.pose.bones[name].constraints.new('IK')
            ik.chain_count = 2
            ik.use_stretch = False
    bpy.ops.object.mode_set(mode='OBJECT')
    print("✓ IK constraints")


# ============================================================
# ANİMASYONLAR
# ============================================================
def reset_pose(arm_obj):
    for b in arm_obj.pose.bones:
        b.location = Vector((0, 0, 0))
        b.rotation_euler = mathutils.Euler((0, 0, 0))
        b.scale = Vector((1, 1, 1))
        b.rotation_mode = 'XYZ'


def kf(bone, frame, dp='rotation_euler'):
    bone.keyframe_insert(data_path=dp, frame=frame)


def make_cyclic(action):
    """F-curve'leri cyclic yap. Blender 5.x uyumlu."""
    try:
        fcurves = action.fcurves if hasattr(action, 'fcurves') else []
        for fc in fcurves:
            m = fc.modifiers.new(type='CYCLES')
            m.mode_before = 'REPEAT'
            m.mode_after = 'REPEAT'
    except Exception as e:
        print(f"  ⚠ Cyclic modifier atlandı: {e}")


def create_idle(arm_obj):
    action = bpy.data.actions.new("Idle")
    arm_obj.animation_data_create()
    arm_obj.animation_data.action = action
    bones = arm_obj.pose.bones
    reset_pose(arm_obj)
    F = IDLE_FRAMES
    PI2 = 2 * math.pi

    s = bones.get("Spine")
    if s:
        for f in range(F + 1):
            t = f / F
            s.location.z = math.sin(t * PI2) * 0.005
            s.keyframe_insert('location', frame=f)

    h = bones.get("Head")
    if h:
        for f in range(F + 1):
            t = f / F
            h.rotation_euler.z = math.sin(t * PI2 * 0.5) * 0.08
            h.rotation_euler.x = math.sin(t * PI2 + 1.5) * 0.03
            kf(h, f)

    tail = bones.get("Tail")
    if tail:
        for f in range(F + 1):
            t = f / F
            tail.rotation_euler.z = math.sin(t * PI2 * 0.7) * 0.05
            kf(tail, f)

    for side in ['L', 'R']:
        w = bones.get(f"Wing.{side}")
        if w:
            sg = 1 if side == 'L' else -1
            for f in range(F + 1):
                t = f / F
                w.rotation_euler.y = sg * math.sin(t * PI2) * 0.02
                kf(w, f)

    make_cyclic(action)
    tr = arm_obj.animation_data.nla_tracks.new()
    tr.name = "Idle"
    tr.strips.new("Idle", 0, action)
    print("  ✓ Idle (60f loop)")


def create_walk(arm_obj):
    action = bpy.data.actions.new("Walk")
    arm_obj.animation_data.action = action
    bones = arm_obj.pose.bones
    reset_pose(arm_obj)
    F = WALK_FRAMES
    PI2 = 2 * math.pi

    s = bones.get("Spine")
    if s:
        for f in range(F + 1):
            t = f / F
            s.location.z = abs(math.sin(t * PI2)) * 0.008
            s.rotation_euler.z = math.sin(t * PI2) * 0.04
            s.keyframe_insert('location', frame=f)
            kf(s, f)

    neck = bones.get("Neck")
    if neck:
        for f in range(F + 1):
            t = f / F
            neck.rotation_euler.x = math.sin(t * PI2) * 0.15
            kf(neck, f)

    head = bones.get("Head")
    if head:
        for f in range(F + 1):
            t = f / F
            head.rotation_euler.x = math.sin(t * PI2 + 0.5) * 0.1
            kf(head, f)

    for i, side in enumerate(['L', 'R']):
        leg = bones.get(f"Leg.{side}")
        shin = bones.get(f"Shin.{side}")
        ph = i * math.pi
        if leg:
            for f in range(F + 1):
                t = f / F
                leg.rotation_euler.x = math.sin(t * PI2 + ph) * 0.25
                kf(leg, f)
        if shin:
            for f in range(F + 1):
                t = f / F
                v = math.sin(t * PI2 + ph + 0.5)
                shin.rotation_euler.x = max(0, v) * 0.3
                kf(shin, f)

    tail = bones.get("Tail")
    if tail:
        for f in range(F + 1):
            t = f / F
            tail.rotation_euler.z = math.sin(t * PI2) * 0.08
            kf(tail, f)

    for i, side in enumerate(['L', 'R']):
        w = bones.get(f"Wing.{side}")
        if w:
            sg = 1 if side == 'L' else -1
            for f in range(F + 1):
                t = f / F
                w.rotation_euler.y = sg * math.sin(t * PI2) * 0.06
                kf(w, f)

    make_cyclic(action)
    tr = arm_obj.animation_data.nla_tracks.new()
    tr.name = "Walk"
    tr.strips.new("Walk", 0, action)
    print("  ✓ Walk (24f loop)")


def create_interact(arm_obj):
    action = bpy.data.actions.new("Interact")
    arm_obj.animation_data.action = action
    bones = arm_obj.pose.bones
    reset_pose(arm_obj)

    def kfs(bone, frames_rots, dp='rotation_euler'):
        for frame, rot in frames_rots.items():
            bone.rotation_euler = mathutils.Euler(rot)
            kf(bone, frame, dp)

    s = bones.get("Spine")
    if s:
        kfs(s, {0:(0,0,0), 5:(0.05,0,0), 10:(-0.12,0,0), 15:(0.08,0,0), 20:(0,0,0), 30:(0,0,0)})

    neck = bones.get("Neck")
    if neck:
        kfs(neck, {0:(0,0,0), 3:(0.1,0,0), 8:(-0.35,0,0), 12:(-0.35,0,0), 16:(0.2,0,0), 22:(0.1,0,0), 30:(0,0,0)})

    head = bones.get("Head")
    if head:
        kfs(head, {0:(0,0,0), 5:(0.05,0,0), 8:(-0.2,0,0), 12:(-0.15,0,0.1), 16:(0.15,0,0), 22:(0.05,0,0), 30:(0,0,0)})

    for i, side in enumerate(['L', 'R']):
        w = bones.get(f"Wing.{side}")
        if w:
            sg = 1 if side == 'L' else -1
            kfs(w, {0:(0,0,0), 10:(0,0,0), 14:(-0.15,sg*0.4,0), 18:(-0.1,sg*0.35,0), 24:(0,sg*0.05,0), 30:(0,0,0)})

    tail = bones.get("Tail")
    if tail:
        kfs(tail, {0:(0,0,0), 8:(-0.1,0,0), 14:(-0.2,0,0.1), 20:(-0.1,0,0), 30:(0,0,0)})

    tr = arm_obj.animation_data.nla_tracks.new()
    tr.name = "Interact"
    tr.strips.new("Interact", 0, action)
    print("  ✓ Interact (30f once)")


# ============================================================
# EXPORT
# ============================================================
def export_glb(filepath):
    print(f"Exporting: {filepath}")
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_animations=True,
        export_nla_strips=True,
        export_nla_strips_merged_animation_name='Idle',
    )
    size_mb = os.path.getsize(filepath) / (1024 * 1024)
    print(f"✓ Export tamamlandı: {filepath} ({size_mb:.1f} MB)")


# ============================================================
# MAIN
# ============================================================
def main():
    if not INPUT_GLB or not OUTPUT_GLB:
        print("ERROR: input ve output GLB yolları gerekli")
        print("Kullanım: blender --background --python rig_and_export.py -- input.glb output.glb")
        sys.exit(1)

    if not os.path.exists(INPUT_GLB):
        print(f"ERROR: Dosya bulunamadı: {INPUT_GLB}")
        sys.exit(1)

    print(f"\n🐓 RoosterVerse Rigging Pipeline")
    print(f"   Input:  {INPUT_GLB}")
    print(f"   Output: {OUTPUT_GLB}")
    print("=" * 50)

    clean_scene()
    import_glb(INPUT_GLB)

    mesh_obj = find_rooster_mesh()
    print(f"✓ Mesh: {mesh_obj.name}")

    dims = analyze_mesh(mesh_obj)

    # Origin düzelt
    bpy.ops.object.select_all(action='DESELECT')
    mesh_obj.select_set(True)
    bpy.context.view_layer.objects.active = mesh_obj
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')

    arm_obj = create_armature(mesh_obj, dims)
    parent_mesh(mesh_obj, arm_obj)
    add_ik(arm_obj)

    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='POSE')
    create_idle(arm_obj)
    create_walk(arm_obj)
    create_interact(arm_obj)
    bpy.ops.object.mode_set(mode='OBJECT')

    # Export dizini oluştur
    os.makedirs(os.path.dirname(OUTPUT_GLB), exist_ok=True)
    export_glb(OUTPUT_GLB)

    print("\n✅ Pipeline tamamlandı!\n")


main()
