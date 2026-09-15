/**
 * Reusable GLB/GLTF UV Island & Geometry Inspector
 * 
 * Analyzes any 3D model (.glb), extracts materials, meshes, and computes
 * all connected UV Islands, bounding boxes, 3D normal orientations, and canvas mappings.
 * 
 * Usage:
 *   node scripts/inspectModelUV.cjs [path/to/model.glb] [canvasSize]
 *   npm run inspect-uv
 */

const fs = require('fs');
const path = require('path');

// 1. Command-line arguments
const modelPath = process.argv[2] || 'public/Tent_8_8.glb';
const canvasSize = parseInt(process.argv[3] || '1024', 10);

if (!fs.existsSync(modelPath)) {
  console.error(`Error: File not found: ${modelPath}`);
  process.exit(1);
}

console.log(`\n================================================================`);
console.log(`        GLB UV ISLAND & GEOMETRY INSPECTOR`);
console.log(`================================================================`);
console.log(`Inspecting file: ${modelPath}`);
console.log(`Target Canvas Size: ${canvasSize}x${canvasSize} px\n`);

// 2. Binary GLB Parsing
const fileBuffer = fs.readFileSync(modelPath);

// Header validation (magic: 0x46546C67 = "glTF")
const magic = fileBuffer.readUInt32LE(0);
if (magic !== 0x46546c67) {
  console.error('Error: Invalid GLB magic number. File is not a valid binary glTF.');
  process.exit(1);
}

const version = fileBuffer.readUInt32LE(4);
const totalLength = fileBuffer.readUInt32LE(8);
const jsonChunkLength = fileBuffer.readUInt32LE(12);
const jsonChunkType = fileBuffer.readUInt32LE(16); // 0x4E4F534A = "JSON"

const jsonString = fileBuffer.slice(20, 20 + jsonChunkLength).toString('utf8');
const gltf = JSON.parse(jsonString);

const binHeaderOffset = 20 + jsonChunkLength;
const binLength = fileBuffer.readUInt32LE(binHeaderOffset);
const binData = fileBuffer.slice(binHeaderOffset + 8, binHeaderOffset + 8 + binLength);

// 3. Helper to parse accessor data from binary buffer
function getAccessorData(accIndex) {
  if (accIndex === undefined) return null;
  const acc = gltf.accessors[accIndex];
  const bv = gltf.bufferViews[acc.bufferView];
  const offset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const count = acc.count;
  const stride = bv.byteStride || 0;

  // Unsigned Short indices (componentType: 5123)
  if (acc.componentType === 5123) {
    const arr = new Uint16Array(count);
    const step = stride || 2;
    for (let i = 0; i < count; i++) {
      arr[i] = binData.readUInt16LE(offset + i * step);
    }
    return arr;
  }

  // Unsigned Int indices (componentType: 5125)
  if (acc.componentType === 5125) {
    const arr = new Uint32Array(count);
    const step = stride || 4;
    for (let i = 0; i < count; i++) {
      arr[i] = binData.readUInt32LE(offset + i * step);
    }
    return arr;
  }

  // Float VEC3 (POSITION / NORMAL)
  if (acc.type === 'VEC3') {
    const arr = new Float32Array(count * 3);
    const step = stride || 12;
    for (let i = 0; i < count; i++) {
      arr[i * 3] = binData.readFloatLE(offset + i * step);
      arr[i * 3 + 1] = binData.readFloatLE(offset + i * step + 4);
      arr[i * 3 + 2] = binData.readFloatLE(offset + i * stride + 8);
    }
    return arr;
  }

  // Float VEC2 (TEXCOORD_0)
  if (acc.type === 'VEC2') {
    const arr = new Float32Array(count * 2);
    const step = stride || 8;
    for (let i = 0; i < count; i++) {
      arr[i * 2] = binData.readFloatLE(offset + i * step);
      arr[i * 2 + 1] = binData.readFloatLE(offset + i * step + 4);
    }
    return arr;
  }

  return null;
}

// 4. Inspect meshes & materials
console.log(`Meshes found in GLB: ${gltf.meshes?.length || 0}`);
console.log(`Materials found in GLB: ${gltf.materials?.length || 0}\n`);

const meshReports = [];

gltf.meshes.forEach((mesh, meshIdx) => {
  mesh.primitives.forEach((prim, primIdx) => {
    const matName = prim.material !== undefined ? gltf.materials[prim.material].name : 'DefaultMaterial';
    const hasUV = prim.attributes.TEXCOORD_0 !== undefined;
    const hasPos = prim.attributes.POSITION !== undefined;
    const hasIndices = prim.indices !== undefined;

    if (!hasUV || !hasPos) return;

    const pos = getAccessorData(prim.attributes.POSITION);
    const uv = getAccessorData(prim.attributes.TEXCOORD_0);
    const indices = hasIndices ? getAccessorData(prim.indices) : null;
    const vertCount = pos.length / 3;
    const triCount = indices ? indices.length / 3 : vertCount / 3;

    console.log(`----------------------------------------------------------------`);
    console.log(`Mesh [${meshIdx}] "${mesh.name || 'Unnamed'}" -> Primitive [${primIdx}]`);
    console.log(`Material: "${matName}" | Vertices: ${vertCount} | Triangles: ${triCount}`);

    // ========================================================================
    // 5. CONNECTED COMPONENT ALGORITHM (UV ISLAND DISCOVERY)
    // ========================================================================
    // Build adjacency graph of triangles sharing identical UV points
    const triNeighbors = Array.from({ length: triCount }, () => []);
    const uvVertexToTriangles = new Map();

    const QUANTIZE_SCALE = 10000; // Quantize UV to 4 decimal places for robust float keying
    function makeUVKey(u, v) {
      return `${Math.round(u * QUANTIZE_SCALE)},${Math.round(v * QUANTIZE_SCALE)}`;
    }

    for (let t = 0; t < triCount; t++) {
      const i0 = indices ? indices[t * 3] : t * 3;
      const i1 = indices ? indices[t * 3 + 1] : t * 3 + 1;
      const i2 = indices ? indices[t * 3 + 2] : t * 3 + 2;

      const keys = [
        makeUVKey(uv[i0 * 2], uv[i0 * 2 + 1]),
        makeUVKey(uv[i1 * 2], uv[i1 * 2 + 1]),
        makeUVKey(uv[i2 * 2], uv[i2 * 2 + 1])
      ];

      keys.forEach((k) => {
        if (!uvVertexToTriangles.has(k)) {
          uvVertexToTriangles.set(k, []);
        }
        const sharedTris = uvVertexToTriangles.get(k);
        sharedTris.forEach((otherTri) => {
          if (otherTri !== t) {
            triNeighbors[t].push(otherTri);
            triNeighbors[otherTri].push(t);
          }
        });
        sharedTris.push(t);
      });
    }

    // Breadth-First Search (BFS) to group connected UV triangles into Islands
    const visited = new Uint8Array(triCount);
    const islands = [];

    for (let t = 0; t < triCount; t++) {
      if (visited[t]) continue;

      const islandTris = [];
      const queue = [t];
      visited[t] = 1;

      while (queue.length > 0) {
        const curr = queue.pop();
        islandTris.push(curr);

        for (const n of triNeighbors[curr]) {
          if (!visited[n]) {
            visited[n] = 1;
            queue.push(n);
          }
        }
      }

      // Collect all vertices and bounding box for this island
      let minU = 1, maxU = 0, minV = 1, maxV = 0;
      let minX = 999, maxX = -999, minY = 999, maxY = -999, minZ = 999, maxZ = -999;
      let sumNormalX = 0, sumNormalY = 0, sumNormalZ = 0;
      const uniqueVertIndices = new Set();

      islandTris.forEach((triIdx) => {
        const idxs = [
          indices ? indices[triIdx * 3] : triIdx * 3,
          indices ? indices[triIdx * 3 + 1] : triIdx * 3 + 1,
          indices ? indices[triIdx * 3 + 2] : triIdx * 3 + 2
        ];

        // Triangle face normal
        const p0 = [pos[idxs[0] * 3], pos[idxs[0] * 3 + 1], pos[idxs[0] * 3 + 2]];
        const p1 = [pos[idxs[1] * 3], pos[idxs[1] * 3 + 1], pos[idxs[1] * 3 + 2]];
        const p2 = [pos[idxs[2] * 3], pos[idxs[2] * 3 + 1], pos[idxs[2] * 3 + 2]];

        const vA = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
        const vB = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
        const fn = [
          vA[1] * vB[2] - vA[2] * vB[1],
          vA[2] * vB[0] - vA[0] * vB[2],
          vA[0] * vB[1] - vA[1] * vB[0]
        ];

        sumNormalX += fn[0];
        sumNormalY += fn[1];
        sumNormalZ += fn[2];

        idxs.forEach((vi) => {
          uniqueVertIndices.add(vi);
          const uVal = uv[vi * 2];
          const vVal = uv[vi * 2 + 1];
          const xVal = pos[vi * 3];
          const yVal = pos[vi * 3 + 1];
          const zVal = pos[vi * 3 + 2];

          minU = Math.min(minU, uVal);
          maxU = Math.max(maxU, uVal);
          minV = Math.min(minV, vVal);
          maxV = Math.max(maxV, vVal);

          minX = Math.min(minX, xVal);
          maxX = Math.max(maxX, xVal);
          minY = Math.min(minY, yVal);
          maxY = Math.max(maxY, yVal);
          minZ = Math.min(minZ, zVal);
          maxZ = Math.max(maxZ, zVal);
        });
      });

      // Normalize average normal direction to detect 3D facing orientation
      const normLen = Math.hypot(sumNormalX, sumNormalY, sumNormalZ) || 1;
      const normal = [sumNormalX / normLen, sumNormalY / normLen, sumNormalZ / normLen];

      // Determine human-readable 3D orientation
      let orientation = 'Unknown';
      if (Math.abs(normal[1]) > 0.8) {
        orientation = normal[1] > 0 ? 'Top (Up)' : 'Bottom (Down)';
      } else if (Math.abs(normal[2]) > Math.abs(normal[0])) {
        orientation = normal[2] > 0 ? 'Front (+Z)' : 'Back (-Z)';
      } else {
        orientation = normal[0] > 0 ? 'Right (+X)' : 'Left (-X)';
      }

      islands.push({
        id: islands.length + 1,
        triangleCount: islandTris.length,
        vertexCount: uniqueVertIndices.size,
        uvBounds: { minU, maxU, minV, maxV },
        canvasBounds: {
          xMin: Math.round(minU * canvasSize),
          xMax: Math.round(maxU * canvasSize),
          yMin: Math.round(minV * canvasSize),
          yMax: Math.round(maxV * canvasSize),
          width: Math.round((maxU - minU) * canvasSize),
          height: Math.round((maxV - minV) * canvasSize)
        },
        center: {
          u: Number(((minU + maxU) / 2).toFixed(4)),
          v: Number(((minV + maxV) / 2).toFixed(4)),
          pixelX: Math.round(((minU + maxU) / 2) * canvasSize),
          pixelY: Math.round(((minV + maxV) / 2) * canvasSize)
        },
        posBounds: {
          minX: Number(minX.toFixed(2)),
          maxX: Number(maxX.toFixed(2)),
          minY: Number(minY.toFixed(2)),
          maxY: Number(maxY.toFixed(2)),
          minZ: Number(minZ.toFixed(2)),
          maxZ: Number(maxZ.toFixed(2))
        },
        orientation
      });
    }

    // Sort islands by canvas area descending
    islands.sort((a, b) => (b.canvasBounds.width * b.canvasBounds.height) - (a.canvasBounds.width * a.canvasBounds.height));

    console.log(`=> Discovered ${islands.length} DISTINCT UV ISLANDS for "${matName}":\n`);
    islands.forEach((isl, i) => {
      console.log(`  Island #${i + 1} (${isl.orientation}):`);
      console.log(`    • Triangles: ${isl.triangleCount} | Vertices: ${isl.vertexCount}`);
      console.log(`    • UV Box:    U: [${isl.uvBounds.minU.toFixed(4)}, ${isl.uvBounds.maxU.toFixed(4)}]  V: [${isl.uvBounds.minV.toFixed(4)}, ${isl.uvBounds.maxV.toFixed(4)}]`);
      console.log(`    • Canvas:    X: [${isl.canvasBounds.xMin}, ${isl.canvasBounds.xMax}] (${isl.canvasBounds.width}px)  Y: [${isl.canvasBounds.yMin}, ${isl.canvasBounds.yMax}] (${isl.canvasBounds.height}px)`);
      console.log(`    • Center:    (${isl.center.pixelX}px, ${isl.center.pixelY}px)\n`);
    });

    meshReports.push({
      meshIndex: meshIdx,
      meshName: mesh.name || `Mesh_${meshIdx}`,
      materialName: matName,
      islandCount: islands.length,
      islands
    });
  });
});

// 6. Save results to structured JSON and report file
const outputPath = path.resolve('scripts', 'model_uv_inspection_output.json');
fs.writeFileSync(outputPath, JSON.stringify({ model: modelPath, canvasSize, meshReports }, null, 2), 'utf8');

console.log(`================================================================`);
console.log(`SUCCESS: Full inspection analysis saved to:`);
console.log(`  -> ${outputPath}`);
console.log(`================================================================\n`);
