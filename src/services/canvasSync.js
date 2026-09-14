/**
 * Single Master Canvas Generator
 * Renders customer artwork (background color, full print graphics, logos, text)
 * directly onto the texture mapped across the entire 3D tent.
 */

export const TEXTURE_SIZE = 1024;

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
 * Renders the single canvas configuration onto the target 2D context
 */
export function renderCanvasConfig(ctx, config, width = TEXTURE_SIZE, height = TEXTURE_SIZE) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // 1. Background color
  ctx.fillStyle = config.backgroundColor || "#FACC15";
  ctx.fillRect(0, 0, width, height);

  // 2. Render all layers (images and text)
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
      const targetW = layer.width || width * 0.8;
      const targetH = layer.height || (img.naturalHeight ? (img.naturalHeight / img.naturalWidth) * targetW : height * 0.8);
      ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
    } else if (layer.type === "text" && layer.content) {
      const fontSize = layer.fontSize || 42;
      const fontFamily = layer.fontFamily || "Montserrat, sans-serif";
      const fontWeight = layer.fontWeight || "bold";
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = layer.color || "#000000";
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
