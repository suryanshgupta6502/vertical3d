/**
 * Master Canvas Generator & UV Map Pipeline
 * Supports full freeform layer positioning across the entire canvas,
 * with visible UV gaps and panel guide boundaries in the 2D editor.
 */

export const TEXTURE_SIZE = 1024;

// Cache the loaded fabric base image
let cachedFabricImage = null;
let isFabricImageLoading = false;

export function getFabricBaseImage() {
  if (typeof window === "undefined") return null;
  if (cachedFabricImage) return cachedFabricImage;

  if (!isFabricImageLoading) {
    isFabricImageLoading = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/fabric_base.png";
    img.onload = () => {
      cachedFabricImage = img;
      isFabricImageLoading = false;
    };
    img.onerror = () => {
      isFabricImageLoading = false;
    };
  }
  return cachedFabricImage;
}

if (typeof window !== "undefined") {
  getFabricBaseImage();
}

/**
 * Creates the master canvas for 3D texture mapping
 */
export function createMasterCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  return canvas;
}

/**
 * Determines which section an (x, y) coordinate [0..1] is closest to (for UI display only)
 */
export function getCanopySection(x, y) {
  const nx = Math.max(0, Math.min(1, x));
  const ny = Math.max(0, Math.min(1, y));

  // Valances (outer edges)
  if (ny >= 0.88) return { id: "valance_front", name: "Front Valance" };
  if (ny <= 0.12) return { id: "valance_back", name: "Back Valance" };
  if (nx <= 0.12) return { id: "valance_left", name: "Left Valance" };
  if (nx >= 0.88) return { id: "valance_right", name: "Right Valance" };

  const dx = nx - 0.5;
  const dy = ny - 0.5;

  if (Math.abs(dx) < 0.08 && Math.abs(dy) < 0.08) {
    return { id: "apex", name: "Apex (Top)" };
  }

  if (dy > Math.abs(dx)) return { id: "peak_front", name: "Front Peak" };
  if (dy < -Math.abs(dx)) return { id: "peak_back", name: "Back Peak" };
  if (dx < -Math.abs(dy)) return { id: "peak_left", name: "Left Peak" };
  return { id: "peak_right", name: "Right Peak" };
}

/**
 * Draws visible UV panel boundaries with gaps between all panels
 */
export function renderUVGuidesWithGaps(ctx, width, height) {
  ctx.save();

  const scale = width / TEXTURE_SIZE;
  ctx.scale(scale, scale);

  // Significantly increased gap dimensions so 2D layout matches 3D model UV geometry
  const GAP = 52;
  const PEAK_GAP = 46;
  const MARGIN = 36;
  const VALANCE_H = 75;

  const innerXMin = MARGIN + VALANCE_H + GAP; // 163
  const innerXMax = TEXTURE_SIZE - (MARGIN + VALANCE_H + GAP); // 861
  const innerYMin = MARGIN + VALANCE_H + GAP; // 163
  const innerYMax = TEXTURE_SIZE - (MARGIN + VALANCE_H + GAP); // 861

  // 1. Solid pure WHITE gaps between all UV panels
  ctx.fillStyle = "#FFFFFF";

  // Outer margin gaps
  ctx.fillRect(0, 0, TEXTURE_SIZE, MARGIN);
  ctx.fillRect(0, TEXTURE_SIZE - MARGIN, TEXTURE_SIZE, MARGIN);
  ctx.fillRect(0, 0, MARGIN, TEXTURE_SIZE);
  ctx.fillRect(TEXTURE_SIZE - MARGIN, 0, MARGIN, TEXTURE_SIZE);

  // 4 Corner cutout areas (where valance panels separate)
  ctx.fillRect(0, 0, innerXMin, innerYMin);
  ctx.fillRect(innerXMax, 0, TEXTURE_SIZE - innerXMax, innerYMin);
  ctx.fillRect(0, innerYMax, innerXMin, TEXTURE_SIZE - innerYMax);
  ctx.fillRect(innerXMax, innerYMax, TEXTURE_SIZE - innerXMax, TEXTURE_SIZE - innerYMax);

  // Horizontal white gaps between valances and peaks
  ctx.fillRect(0, MARGIN + VALANCE_H, TEXTURE_SIZE, GAP);
  ctx.fillRect(0, innerYMax, TEXTURE_SIZE, GAP);

  // Vertical white gaps between valances and peaks
  ctx.fillRect(MARGIN + VALANCE_H, 0, GAP, TEXTURE_SIZE);
  ctx.fillRect(innerXMax, 0, GAP, TEXTURE_SIZE);

  // Diagonal seam white gap channels meeting at the center
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = PEAK_GAP;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(512, 512);
  ctx.lineTo(innerXMin, innerYMin);
  ctx.moveTo(512, 512);
  ctx.lineTo(innerXMax, innerYMin);
  ctx.moveTo(512, 512);
  ctx.lineTo(innerXMin, innerYMax);
  ctx.moveTo(512, 512);
  ctx.lineTo(innerXMax, innerYMax);
  ctx.stroke();

  // Center apex white circle gap
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(512, 512, 44, 0, Math.PI * 2);
  ctx.fill();

  // 2. Panel Outlines (Crisp seam boundary line around each separate panel)
  ctx.strokeStyle = "rgba(15, 23, 42, 0.35)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);

  // Back Valance outline
  ctx.strokeRect(MARGIN, MARGIN, TEXTURE_SIZE - 2 * MARGIN, VALANCE_H);

  // Front Valance outline
  ctx.strokeRect(MARGIN, TEXTURE_SIZE - MARGIN - VALANCE_H, TEXTURE_SIZE - 2 * MARGIN, VALANCE_H);

  // Left Valance outline
  ctx.strokeRect(MARGIN, innerYMin, VALANCE_H, innerYMax - innerYMin);

  // Right Valance outline
  ctx.strokeRect(TEXTURE_SIZE - MARGIN - VALANCE_H, innerYMin, VALANCE_H, innerYMax - innerYMin);

  // Front Peak triangle outline
  ctx.beginPath();
  ctx.moveTo(512, 512 + PEAK_GAP);
  ctx.lineTo(innerXMin + PEAK_GAP, innerYMax);
  ctx.lineTo(innerXMax - PEAK_GAP, innerYMax);
  ctx.closePath();
  ctx.stroke();

  // Back Peak triangle outline
  ctx.beginPath();
  ctx.moveTo(512, 512 - PEAK_GAP);
  ctx.lineTo(innerXMin + PEAK_GAP, innerYMin);
  ctx.lineTo(innerXMax - PEAK_GAP, innerYMin);
  ctx.closePath();
  ctx.stroke();

  // Left Peak triangle outline
  ctx.beginPath();
  ctx.moveTo(512 - PEAK_GAP, 512);
  ctx.lineTo(innerXMin, innerYMin + PEAK_GAP);
  ctx.lineTo(innerXMin, innerYMax - PEAK_GAP);
  ctx.closePath();
  ctx.stroke();

  // Right Peak triangle outline
  ctx.beginPath();
  ctx.moveTo(512 + PEAK_GAP, 512);
  ctx.lineTo(innerXMax, innerYMin + PEAK_GAP);
  ctx.lineTo(innerXMax, innerYMax - PEAK_GAP);
  ctx.closePath();
  ctx.stroke();

  // 3. Panel Label Badges
  ctx.setLineDash([]);
  const labels = [
    { text: "FRONT PEAK", x: 512, y: 715 },
    { text: "FRONT VALANCE", x: 512, y: 950 },
    { text: "BACK PEAK", x: 512, y: 309 },
    { text: "BACK VALANCE", x: 512, y: 74 },
    { text: "LEFT PEAK", x: 309, y: 512 },
    { text: "LEFT VALANCE", x: 74, y: 512, rotate: -90 },
    { text: "RIGHT PEAK", x: 715, y: 512 },
    { text: "RIGHT VALANCE", x: 950, y: 512, rotate: 90 }
  ];

  labels.forEach((lbl) => {
    ctx.save();
    ctx.translate(lbl.x, lbl.y);
    if (lbl.rotate) {
      ctx.rotate((lbl.rotate * Math.PI) / 180);
    }

    const pillW = 110;
    const pillH = 22;

    ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 5);
    } else {
      ctx.rect(-pillW / 2, -pillH / 2, pillW, pillH);
    }
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 10px Montserrat, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(lbl.text, 0, 0);

    ctx.restore();
  });

  ctx.restore();
}

/**
 * Renders the canvas configuration
 * @param {CanvasRenderingContext2D} ctx - Context to render onto
 * @param {Object} config - Configuration state
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @param {Object} options - { includeGuides: boolean }
 */
export function renderCanvasConfig(
  ctx,
  config,
  width = TEXTURE_SIZE,
  height = TEXTURE_SIZE,
  options = {}
) {
  const { includeGuides = false } = options;

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // 1. Background color
  ctx.fillStyle = config.backgroundColor || "#FACC15";
  ctx.fillRect(0, 0, width, height);

  // 2. Draw fabric texture base image with multiply blending for realistic seams
  const fabricImg = getFabricBaseImage();
  if (fabricImg && fabricImg.complete && fabricImg.naturalWidth > 0) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(fabricImg, 0, 0, width, height);
    ctx.restore();
  }

  // 3. Draw visible UV panel guide lines with gaps (for 2D editor view)
  if (includeGuides) {
    renderUVGuidesWithGaps(ctx, width, height);
  }

  // 4. Render all artwork layers freely across the canvas (no artificial boundary lock)
  const layers = config.layers || [];
  layers.forEach((layer) => {
    ctx.save();
    const lx = (layer.x ?? 0.5) * width;
    const ly = (layer.y ?? 0.5) * height;
    const rotation = ((layer.rotation || 0) * Math.PI) / 180;
    const scale = layer.scale || 1.0;
    const opacity = layer.opacity ?? 1.0;

    ctx.translate(lx, ly);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.globalAlpha = opacity;

    if (layer.type === "image" && layer.imageElement) {
      const img = layer.imageElement;
      const targetW = layer.width || 340;
      const targetH =
        layer.height ||
        (img.naturalHeight ? (img.naturalHeight / img.naturalWidth) * targetW : 160);
      ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
    } else if (layer.type === "text" && layer.content) {
      const fontSize = layer.fontSize || 38;
      const fontFamily = layer.fontFamily || "Montserrat, sans-serif";
      const fontWeight = layer.fontWeight || "bold";
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = layer.color || "#0F172A";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (layer.stroke) {
        ctx.strokeStyle = layer.strokeColor || "#FFFFFF";
        ctx.lineWidth = layer.strokeWidth || 4;
        ctx.strokeText(layer.content, 0, 0);
      }
      ctx.fillText(layer.content, 0, 0);
    }

    ctx.restore();
  });

  ctx.restore();
}
