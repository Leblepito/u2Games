"""
RoosterVerse — Automatic Rooster Rigging & Animation Script
============================================================
Blender 4.x Python script.

KULLANIM:
  1. Blender'ı aç
  2. File → Import → glTF 2.0 → aseel.glb seç
  3. Scripting workspace'e geç
  4. Bu script'i aç veya yapıştır
  5. Run Script (Alt+P)
  6. File → Export → glTF 2.0 → "aseel-rigged.glb" olarak kaydet
     - Export ayarları: Format=GLB, Include=Selected Objects OFF,
       Animation=ON, Shape Keys=OFF

Script şunları yapar:
  - Mesh'i analiz eder (bounding box, merkez)
  - 10 kemikli armature oluşturur (spine, neck, head, 2×leg, 2×wing, tail, comb, beak)
  - Automatic weight paint uygular
  - 3 animasyon clip oluşturur: Idle (60f), Walk (24f), Interact (30f)
  - IK constraint ekler (bacaklar)
"""

import bpy
import math
import mathutils
from mathutils import Vector

# ============================================================
# CONFIG
# ============================================================
FRAME_RATE = 24
IDLE_FRAMES = 60      # 2.5 saniye loop
WALK_FRAMES = 24      # 1 saniye loop
INTERACT_FRAMES = 30  # 1.25 saniye once

# ============================================================
# STEP 0: Sahneyi hazırla, mesh'i bul
# ============================================================
def find_rooster_mesh():
    """Sahnedeki en büyük mesh'i horoz olarak kabul et."""
    meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH']
    if not meshes:
        raise RuntimeError("Sahnede mesh bulunamadı! Önce GLB'yi import et.")
    # En büyük mesh'i seç
    biggest = max(meshes, key=lambda m: max(m.dimensions))
    return biggest


def analyze_mesh(mesh_obj):
    """Mesh'in bounding box'ından kemik pozisyonlarını hesapla."""
    bb = [mesh_obj.matrix_world @ Vector(corner) for corner in mesh_obj.bound_box]

    min_x = min(v.x for v in bb)
    max_x = max(v.x for v in bb)
    min_y = min(v.y for v in bb)
    max_y = max(v.y for v in bb)
    min_z = min(v.z for v in bb)
    max_z = max(v.z for v in bb)

    center_x = (min_x + max_x) / 2
    center_y = (min_y + max_y) / 2
    height = max_z - min_z
    width = max_x - min_x
    depth = max_y - min_y

    print(f"Mesh boyutları: {width:.3f} x {depth:.3f} x {height:.3f}")
    print(f"Merkez: ({center_x:.3f}, {center_y:.3f}, {min_z:.3f})")

    return {
        'center_x': center_x,
        'center_y': center_y,
        'min_z': min_z,
        'max_z': max_z,
        'height': height,
        'width': width,
        'depth': depth,
        'min_x': min_x,
        'max_x': max_x,
        'min_y': min_y,
        'max_y': max_y,
    }


# ============================================================
# STEP 1: Armature oluştur
# ============================================================
def create_armature(mesh_obj, dims):
    """Horoz anatomisine uygun 10 kemikli armature oluştur."""

    h = dims['height']
    cx = dims['center_x']
    cy = dims['center_y']
    base_z = dims['min_z']

    # Oranlar (horoz anatomisi)
    body_center_z = base_z + h * 0.45      # Gövde merkezi
    hip_z = base_z + h * 0.35              # Kalça
    knee_z = base_z + h * 0.18             # Diz
    foot_z = base_z + h * 0.02             # Ayak
    shoulder_z = base_z + h * 0.55         # Omuz
    neck_base_z = base_z + h * 0.60        # Boyun başlangıcı
    neck_top_z = base_z + h * 0.78         # Boyun üstü
    head_top_z = base_z + h * 0.90         # Kafa üstü
    comb_z = base_z + h * 0.95             # İbik
    tail_z = base_z + h * 0.50             # Kuyruk başlangıcı
    tail_end_z = base_z + h * 0.65         # Kuyruk sonu

    leg_spread = dims['width'] * 0.2       # Bacak açıklığı
    wing_spread = dims['width'] * 0.45     # Kanat açıklığı

    # Armature oluştur
    bpy.ops.object.armature_add(enter_editmode=True, location=(cx, cy, 0))
    armature_obj = bpy.context.active_object
    armature_obj.name = "RoosterArmature"
    armature = armature_obj.data
    armature.name = "RoosterRig"

    # Varsayılan kemiği sil
    bpy.ops.armature.select_all(action='SELECT')
    bpy.ops.armature.delete()

    # --- Kemikleri oluştur ---

    # 1. Root / Spine
    spine = armature.edit_bones.new("Spine")
    spine.head = Vector((0, 0, hip_z))
    spine.tail = Vector((0, 0, shoulder_z))

    # 2. Neck
    neck = armature.edit_bones.new("Neck")
    neck.head = Vector((0, 0, neck_base_z))
    neck.tail = Vector((0, -dims['depth'] * 0.15, neck_top_z))
    neck.parent = spine
    neck.use_connect = True
    # Spine tail'ı neck head'e ayarla
    spine.tail = neck.head

    # 3. Head
    head = armature.edit_bones.new("Head")
    head.head = neck.tail.copy()
    head.tail = Vector((0, -dims['depth'] * 0.25, head_top_z))
    head.parent = neck
    head.use_connect = True

    # 4. Beak (gagamouth)
    beak = armature.edit_bones.new("Beak")
    beak.head = head.tail.copy()
    beak.tail = Vector((0, -dims['depth'] * 0.4, head_top_z - h * 0.05))
    beak.parent = head
    beak.use_connect = True

    # 5. Comb (ibik)
    comb = armature.edit_bones.new("Comb")
    comb.head = Vector((0, -dims['depth'] * 0.15, head_top_z))
    comb.tail = Vector((0, -dims['depth'] * 0.1, comb_z))
    comb.parent = head

    # 6. Left Leg
    leg_l = armature.edit_bones.new("Leg.L")
    leg_l.head = Vector((leg_spread, 0, hip_z))
    leg_l.tail = Vector((leg_spread, 0, knee_z))
    leg_l.parent = spine

    shin_l = armature.edit_bones.new("Shin.L")
    shin_l.head = leg_l.tail.copy()
    shin_l.tail = Vector((leg_spread, 0.02, foot_z))
    shin_l.parent = leg_l
    shin_l.use_connect = True

    # 7. Right Leg
    leg_r = armature.edit_bones.new("Leg.R")
    leg_r.head = Vector((-leg_spread, 0, hip_z))
    leg_r.tail = Vector((-leg_spread, 0, knee_z))
    leg_r.parent = spine

    shin_r = armature.edit_bones.new("Shin.R")
    shin_r.head = leg_r.tail.copy()
    shin_r.tail = Vector((-leg_spread, 0.02, foot_z))
    shin_r.parent = leg_r
    shin_r.use_connect = True

    # 8. Left Wing
    wing_l = armature.edit_bones.new("Wing.L")
    wing_l.head = Vector((leg_spread, 0, shoulder_z))
    wing_l.tail = Vector((wing_spread, -dims['depth'] * 0.1, shoulder_z - h * 0.05))
    wing_l.parent = spine

    # 9. Right Wing
    wing_r = armature.edit_bones.new("Wing.R")
    wing_r.head = Vector((-leg_spread, 0, shoulder_z))
    wing_r.tail = Vector((-wing_spread, -dims['depth'] * 0.1, shoulder_z - h * 0.05))
    wing_r.parent = spine

    # 10. Tail
    tail = armature.edit_bones.new("Tail")
    tail.head = Vector((0, dims['depth'] * 0.15, tail_z))
    tail.tail = Vector((0, dims['depth'] * 0.35, tail_end_z))
    tail.parent = spine

    # Edit mode'dan çık
    bpy.ops.object.mode_set(mode='OBJECT')

    return armature_obj


# ============================================================
# STEP 2: Mesh'i armature'a bağla (automatic weight paint)
# ============================================================
def parent_mesh_to_armature(mesh_obj, armature_obj):
    """Automatic weights ile mesh'i armature'a bağla."""

    # Önce tüm seçimi kaldır
    bpy.ops.object.select_all(action='DESELECT')

    # Mesh'i seç, sonra armature'ı seç (parent olacak)
    mesh_obj.select_set(True)
    armature_obj.select_set(True)
    bpy.context.view_layer.objects.active = armature_obj

    # Automatic weights ile parent yap
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')

    print("✓ Automatic weight paint tamamlandı")


# ============================================================
# STEP 3: IK Constraints ekle
# ============================================================
def add_ik_constraints(armature_obj):
    """Bacaklara IK constraint ekle (ayaklar yere bassın)."""

    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='POSE')

    for side in ['L', 'R']:
        shin_name = f"Shin.{side}"
        if shin_name in armature_obj.pose.bones:
            shin_bone = armature_obj.pose.bones[shin_name]
            ik = shin_bone.constraints.new('IK')
            ik.chain_count = 2
            ik.use_stretch = False
            print(f"✓ IK constraint eklendi: {shin_name}")

    bpy.ops.object.mode_set(mode='OBJECT')


# ============================================================
# STEP 4: Animasyonları oluştur
# ============================================================
def create_animations(armature_obj):
    """Idle, Walk ve Interact animasyon kliplerini oluştur."""

    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='POSE')

    scene = bpy.context.scene
    scene.render.fps = FRAME_RATE

    # --- IDLE ANIMASYOnu ---
    create_idle_animation(armature_obj)

    # --- WALK ANIMASYOnu ---
    create_walk_animation(armature_obj)

    # --- INTERACT ANIMASYOnu ---
    create_interact_animation(armature_obj)

    bpy.ops.object.mode_set(mode='OBJECT')
    print("✓ 3 animasyon klibi oluşturuldu")


def reset_pose(armature_obj):
    """Tüm kemikleri rest pozisyonuna döndür."""
    for bone in armature_obj.pose.bones:
        bone.location = Vector((0, 0, 0))
        bone.rotation_quaternion = mathutils.Quaternion((1, 0, 0, 0))
        bone.rotation_euler = mathutils.Euler((0, 0, 0))
        bone.scale = Vector((1, 1, 1))


def set_keyframe(bone, frame, data_path='rotation_euler'):
    """Belirli frame'de keyframe ekle."""
    bone.keyframe_insert(data_path=data_path, frame=frame)


def create_idle_animation(armature_obj):
    """Idle: Nefes + hafif kafa hareketi, 60 frame loop."""

    action = bpy.data.actions.new(name="Idle")
    armature_obj.animation_data_create()
    armature_obj.animation_data.action = action

    bones = armature_obj.pose.bones

    # Tüm kemikleri Euler'a çevir
    for bone in bones:
        bone.rotation_mode = 'XYZ'

    reset_pose(armature_obj)

    # Nefes — Spine hafif yukarı-aşağı
    spine = bones.get("Spine")
    if spine:
        for f in range(IDLE_FRAMES + 1):
            t = f / IDLE_FRAMES
            # Sinüs dalga — nefes alma/verme
            spine.location.z = math.sin(t * 2 * math.pi) * 0.005
            spine.keyframe_insert(data_path='location', frame=f)

    # Kafa — yavaş sağa-sola bakınma
    head = bones.get("Head")
    if head:
        for f in range(IDLE_FRAMES + 1):
            t = f / IDLE_FRAMES
            # Yavaş Y-rotation (sağa-sola)
            head.rotation_euler.z = math.sin(t * 2 * math.pi * 0.5) * 0.08
            # Hafif tilt
            head.rotation_euler.x = math.sin(t * 2 * math.pi + 1.5) * 0.03
            set_keyframe(head, f)

    # Kuyruk — hafif sallantı
    tail = bones.get("Tail")
    if tail:
        for f in range(IDLE_FRAMES + 1):
            t = f / IDLE_FRAMES
            tail.rotation_euler.z = math.sin(t * 2 * math.pi * 0.7) * 0.05
            set_keyframe(tail, f)

    # Kanatlar — hafif nefes genişlemesi
    for side in ['L', 'R']:
        wing = bones.get(f"Wing.{side}")
        if wing:
            sign = 1 if side == 'L' else -1
            for f in range(IDLE_FRAMES + 1):
                t = f / IDLE_FRAMES
                wing.rotation_euler.y = sign * math.sin(t * 2 * math.pi) * 0.02
                set_keyframe(wing, f)

    # Tüm F-curve'leri cyclic yap
    if action.fcurves:
        for fc in action.fcurves:
            mod = fc.modifiers.new(type='CYCLES')
            mod.mode_before = 'REPEAT'
            mod.mode_after = 'REPEAT'

    # NLA track olarak pushla
    track = armature_obj.animation_data.nla_tracks.new()
    track.name = "Idle"
    track.strips.new("Idle", 0, action)

    print("  ✓ Idle animasyonu (60 frame, loop)")


def create_walk_animation(armature_obj):
    """Walk: Tavuk yürüyüşü — baş atma + bacak hareketi, 24 frame loop."""

    action = bpy.data.actions.new(name="Walk")
    armature_obj.animation_data.action = action

    bones = armature_obj.pose.bones
    reset_pose(armature_obj)

    # Spine — yürürken hafif yukarı-aşağı hop
    spine = bones.get("Spine")
    if spine:
        for f in range(WALK_FRAMES + 1):
            t = f / WALK_FRAMES
            spine.location.z = abs(math.sin(t * 2 * math.pi)) * 0.008
            # Hafif sallantı (yalpalama)
            spine.rotation_euler.z = math.sin(t * 2 * math.pi) * 0.04
            spine.keyframe_insert(data_path='location', frame=f)
            set_keyframe(spine, f)

    # Boyun — ileri-geri "tavuk baş atma"
    neck = bones.get("Neck")
    if neck:
        for f in range(WALK_FRAMES + 1):
            t = f / WALK_FRAMES
            # Klasik tavuk baş atma hareketi
            neck.rotation_euler.x = math.sin(t * 2 * math.pi) * 0.15
            set_keyframe(neck, f)

    # Kafa — neck ile senkron ama hafif gecikme
    head = bones.get("Head")
    if head:
        for f in range(WALK_FRAMES + 1):
            t = f / WALK_FRAMES
            head.rotation_euler.x = math.sin(t * 2 * math.pi + 0.5) * 0.1
            set_keyframe(head, f)

    # Bacaklar — zıt fazda yürüyüş
    for side_idx, side in enumerate(['L', 'R']):
        leg = bones.get(f"Leg.{side}")
        shin = bones.get(f"Shin.{side}")
        phase = side_idx * math.pi  # Zıt faz

        if leg:
            for f in range(WALK_FRAMES + 1):
                t = f / WALK_FRAMES
                # Üst bacak ileri-geri
                leg.rotation_euler.x = math.sin(t * 2 * math.pi + phase) * 0.25
                set_keyframe(leg, f)

        if shin:
            for f in range(WALK_FRAMES + 1):
                t = f / WALK_FRAMES
                # Alt bacak — sadece geriye (diz bükülmesi)
                val = math.sin(t * 2 * math.pi + phase + 0.5)
                shin.rotation_euler.x = max(0, val) * 0.3
                set_keyframe(shin, f)

    # Kuyruk — yürürken hafif sallantı
    tail = bones.get("Tail")
    if tail:
        for f in range(WALK_FRAMES + 1):
            t = f / WALK_FRAMES
            tail.rotation_euler.z = math.sin(t * 2 * math.pi) * 0.08
            tail.rotation_euler.x = math.sin(t * 4 * math.pi) * 0.03
            set_keyframe(tail, f)

    # Kanatlar — yürürken hafif denge hareketi
    for side_idx, side in enumerate(['L', 'R']):
        wing = bones.get(f"Wing.{side}")
        if wing:
            sign = 1 if side == 'L' else -1
            for f in range(WALK_FRAMES + 1):
                t = f / WALK_FRAMES
                wing.rotation_euler.y = sign * math.sin(t * 2 * math.pi) * 0.06
                wing.rotation_euler.x = math.sin(t * 4 * math.pi) * 0.03
                set_keyframe(wing, f)

    # Cyclic
    if action.fcurves:
        for fc in action.fcurves:
            mod = fc.modifiers.new(type='CYCLES')
            mod.mode_before = 'REPEAT'
            mod.mode_after = 'REPEAT'

    # NLA push
    track = armature_obj.animation_data.nla_tracks.new()
    track.name = "Walk"
    track.strips.new("Walk", 0, action)

    print("  ✓ Walk animasyonu (24 frame, loop)")


def create_interact_animation(armature_obj):
    """Interact: Gagalama/selamlama — hızlı kafa eğme + kanat açma, 30 frame once."""

    action = bpy.data.actions.new(name="Interact")
    armature_obj.animation_data.action = action

    bones = armature_obj.pose.bones
    reset_pose(armature_obj)

    # Frame keyframe'leri:
    # 0-5: Hazırlık (hafif geri çekilme)
    # 5-12: Hızlı kafa eğme (gagalama)
    # 12-18: Kafa yukarı + kanatları aç
    # 18-25: Kanatları kapat
    # 25-30: Rest pozisyonuna dön

    neck = bones.get("Neck")
    head = bones.get("Head")
    spine = bones.get("Spine")

    # Spine hareketi
    if spine:
        keyframes = {
            0: (0, 0, 0),
            5: (0.05, 0, 0),      # Hafif geri
            10: (-0.12, 0, 0),     # İleri atılma
            15: (0.08, 0, 0),      # Geri çekilme
            20: (0, 0, 0),         # Normal
            30: (0, 0, 0),
        }
        for frame, rot in keyframes.items():
            spine.rotation_euler = mathutils.Euler(rot)
            set_keyframe(spine, frame)

    # Boyun — gagalama hareketi
    if neck:
        keyframes = {
            0: (0, 0, 0),
            3: (0.1, 0, 0),        # Hafif yukarı
            8: (-0.35, 0, 0),      # Hızlı aşağı (gagalama!)
            12: (-0.35, 0, 0),     # Tutma
            16: (0.2, 0, 0),       # Yukarı (zafer)
            22: (0.1, 0, 0),       # Yavaş inme
            30: (0, 0, 0),
        }
        for frame, rot in keyframes.items():
            neck.rotation_euler = mathutils.Euler(rot)
            set_keyframe(neck, frame)

    # Kafa — gagalama detayı
    if head:
        keyframes = {
            0: (0, 0, 0),
            5: (0.05, 0, 0),
            8: (-0.2, 0, 0),       # Gaga aşağı
            12: (-0.15, 0, 0.1),   # Hafif yana çevirme
            16: (0.15, 0, 0),      # Yukarı bakış
            22: (0.05, 0, 0),
            30: (0, 0, 0),
        }
        for frame, rot in keyframes.items():
            head.rotation_euler = mathutils.Euler(rot)
            set_keyframe(head, frame)

    # Kanatlar — interact sırasında aç-kapa
    for side_idx, side in enumerate(['L', 'R']):
        wing = bones.get(f"Wing.{side}")
        if wing:
            sign = 1 if side == 'L' else -1
            keyframes = {
                0: (0, 0, 0),
                10: (0, 0, 0),
                14: (-0.15, sign * 0.4, 0),   # Kanatları aç
                18: (-0.1, sign * 0.35, 0),    # Hafif tutma
                24: (0, sign * 0.05, 0),       # Kapatma
                30: (0, 0, 0),
            }
            for frame, rot in keyframes.items():
                wing.rotation_euler = mathutils.Euler(rot)
                set_keyframe(wing, frame)

    # Kuyruk — interact sırasında yukarı kalkma
    tail = bones.get("Tail")
    if tail:
        keyframes = {
            0: (0, 0, 0),
            8: (-0.1, 0, 0),
            14: (-0.2, 0, 0.1),    # Yukarı + yana
            20: (-0.1, 0, 0),
            30: (0, 0, 0),
        }
        for frame, rot in keyframes.items():
            tail.rotation_euler = mathutils.Euler(rot)
            set_keyframe(tail, frame)

    # NLA push
    track = armature_obj.animation_data.nla_tracks.new()
    track.name = "Interact"
    track.strips.new("Interact", 0, action)

    print("  ✓ Interact animasyonu (30 frame, once)")


# ============================================================
# STEP 5: Export ayarları bilgisi
# ============================================================
def print_export_instructions():
    """Export talimatlarını konsola yazdır."""
    print("\n" + "=" * 60)
    print("RoosterVerse Rigging Tamamlandı!")
    print("=" * 60)
    print()
    print("EXPORT TALİMATLARI:")
    print("  1. File → Export → glTF 2.0 (.glb)")
    print("  2. Dosya adı: aseel-rigged.glb")
    print("  3. Ayarlar:")
    print("     - Format: glTF Binary (.glb)")
    print("     - Include → Limit to: DESELECT ALL")
    print("     - Transform → +Y Up: ON")
    print("     - Mesh → Apply Modifiers: ON")
    print("     - Animation → Export Animations: ON")
    print("     - Animation → Group by NLA Track: ON")
    print("     - Animation → Export NLA Strips: ON")
    print("     - Shape Keys: OFF")
    print()
    print("  4. Kaydet")
    print("  5. Aynı işlemi shamo.glb için de tekrarla")
    print()
    print("DOSYALARI KOPYALA:")
    print("  → u2Games/public/models/roosters/aseel-rigged.glb")
    print("  → u2Games/public/models/roosters/shamo-rigged.glb")
    print("=" * 60)


# ============================================================
# MAIN
# ============================================================
def main():
    print("\n🐓 RoosterVerse — Otomatik Rigging Başlıyor...")
    print("=" * 60)

    # Mesh'i bul
    mesh_obj = find_rooster_mesh()
    print(f"✓ Mesh bulundu: {mesh_obj.name}")

    # Analiz et
    dims = analyze_mesh(mesh_obj)

    # Mesh origin'i düzelt (center of mass)
    bpy.ops.object.select_all(action='DESELECT')
    mesh_obj.select_set(True)
    bpy.context.view_layer.objects.active = mesh_obj
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')

    # Armature oluştur
    armature_obj = create_armature(mesh_obj, dims)
    print("✓ Armature oluşturuldu (10 kemik)")

    # Mesh'i armature'a bağla
    parent_mesh_to_armature(mesh_obj, armature_obj)

    # IK constraints
    add_ik_constraints(armature_obj)
    print("✓ IK constraints eklendi")

    # Animasyonları oluştur
    create_animations(armature_obj)

    # Export talimatları
    print_export_instructions()

    print("\n✅ Script tamamlandı. Şimdi export yapabilirsin.\n")


# Çalıştır
if __name__ == "__main__":
    main()
else:
    main()
