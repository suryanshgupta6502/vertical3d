# 3D Model UV Island & Geometry Inspection Tool

A reusable, standalone Node.js tool to inspect **any** 3D model (`.glb` or `.gltf`), discover all connected UV islands, calculate their 2D canvas bounding boxes, detect their 3D facing orientations, and export clean data for 2D-to-3D configurators.

---

## 🚀 Quick Start

### 1. Run on Default Tent Model
```bash
npm run inspect-uv
```
*(Runs against `public/Tent_8_8.glb` with standard 1024x1024 resolution)*

### 2. Run on Any Custom 3D Model
```bash
node scripts/inspectModelUV.cjs path/to/your_model.glb [canvasSize]
```

**Examples:**
```bash
node scripts/inspectModelUV.cjs public/Tent_8_8.glb 1024
node scripts/inspectModelUV.cjs public/Tent_8_8.glb 2048
node scripts/inspectModelUV.cjs assets/custom_product.glb 1024
```

---

## 🔍 How the Algorithm Works

### Step 1: Binary GLB Parsing
The script reads the binary `.glb` container directly without external heavy dependencies:
- Validates the 12-byte header (`magic: 0x46546C67`).
- Extracts the JSON chunk (scene hierarchy, mesh definitions, material slots).
- Decodes the Binary Buffer chunk to read typed arrays for:
  - `POSITION` ($X, Y, Z$ 3D vertex floats)
  - `TEXCOORD_0` ($U, V$ texture floats)
  - `indices` (triangle vertex index arrays)

### Step 2: Connected Component Graph Analysis (UV Islands)
To discover how many separate flat panels exist on the UV map:
1. **Adjacency Mapping**: A hash map groups all triangles that share identical $(U, V)$ coordinates.
2. **Breadth-First Search (BFS)**: Traverses connected triangles. As long as triangles touch in UV space, they belong to the **same UV island**.
3. When a seam or gap is encountered, the BFS ends that island and starts the next one.

### Step 3: Bounding Box & Canvas Transformation
For each discovered island:
- Computes normalized UV bounds: `[minU, maxU]`, `[minV, maxV]` ($0.0 \dots 1.0$).
- Multiplies by `canvasSize` (e.g. 1024) to get exact pixel bounds:
  $$\text{Pixel } X = U \times \text{canvasSize}$$
  $$\text{Pixel } Y = V \times \text{canvasSize}$$
- Computes the center anchor point `(pixelX, pixelY)` for positioning logos or text.

### Step 4: 3D Surface Orientation Detection
The script calculates the cross-product face normal for every triangle in the island:
$$\vec{N} = (\vec{P}_1 - \vec{P}_0) \times (\vec{P}_2 - \vec{P}_0)$$
By analyzing the average vector:
- $+Z \rightarrow$ **Front Face**
- $-Z \rightarrow$ **Back Face**
- $-X \rightarrow$ **Left Face**
- $+X \rightarrow$ **Right Face**
- $+Y \rightarrow$ **Top / Apex**

---

## 📄 Output Files Generated

1. **`scripts/model_uv_inspection_output.json`**:
   Full structured JSON containing every discovered island, vertex count, triangle count, 3D bounds, UV bounds, and canvas coordinates.
2. **`glb_uv_extraction_data.txt`**:
   Human-readable summary report with bounding box tables and sample vertex listings.
