# Rooster Rigging Pipeline

## Otomatik Script

```bash
# 1. Blender'ı aç (4.x)
# 2. File → Import → glTF 2.0 → aseel.glb
# 3. Scripting workspace → scripts/blender/rig_rooster.py aç
# 4. Alt+P (Run Script)
# 5. Konsolu kontrol et — "Script tamamlandı" mesajı
```

## Export Ayarları

```
File → Export → glTF 2.0 (.glb)
  - Format: glTF Binary (.glb)
  - Include → Limit to: hepsini kaldır
  - Transform → +Y Up: ON
  - Mesh → Apply Modifiers: ON
  - Animation → Export Animations: ON
  - Animation → Group by NLA Track: ON
  - Animation → Export NLA Strips: ON
  - Shape Keys: OFF
```

## Dosya Adları

| Kaynak | Çıktı | Konum |
|--------|-------|-------|
| aseel.glb | aseel-rigged.glb | public/models/roosters/ |
| shamo.glb | shamo-rigged.glb | public/models/roosters/ |

## Script Ne Yapar

1. Sahnedeki en büyük mesh'i bulur
2. Bounding box'tan anatomik oranları hesaplar
3. 10 kemikli armature oluşturur:
   - Spine, Neck, Head, Beak, Comb
   - Leg.L, Shin.L, Leg.R, Shin.R
   - Wing.L, Wing.R, Tail
4. Automatic weight paint uygular
5. Bacaklara IK constraint ekler
6. 3 animasyon klibi oluşturur:
   - **Idle** (60 frame, loop): nefes + kafa bakınma + kuyruk sallama
   - **Walk** (24 frame, loop): tavuk yürüyüşü + baş atma + bacak hareketi
   - **Interact** (30 frame, once): gagalama + kanat açma + kuyruk kaldırma

## R3F Entegrasyonu

Rigged GLB export edildikten sonra PlayerRooster.tsx'te:

```tsx
import { useGLTF } from "@react-three/drei";
import { useRoosterAnimation } from "./useRoosterAnimation";

const gltf = useGLTF("/models/roosters/aseel-rigged.glb");
const { group, setAnimation } = useRoosterAnimation(gltf.animations, gltf.scene);

// useFrame içinde:
setAnimation(isMoving ? "walk" : "idle");
// NPC etkileşimde:
setAnimation("interact");
```

## Manuel Düzeltme (Gerekirse)

Script otomatik weight paint kullanır. Eğer bazı bölgeler yanlış hareket ederse:

1. Mesh'i seç → Weight Paint mode
2. Vertex Groups listesinden ilgili kemiği seç
3. Fırça ile weight'i düzelt (mavi=0, kırmızı=1)
4. Özellikle boyun-gövde ve kanat-gövde geçişlerini kontrol et
