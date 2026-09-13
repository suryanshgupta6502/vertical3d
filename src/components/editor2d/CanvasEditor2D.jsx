import React, { useRef, useEffect, useState, useCallback } from "react";
import { useConfig } from "../../store/ConfigContext";
import { renderCanvasConfig } from "../../services/canvasSync";
import { Trash2, Move, RotateCw, ZoomIn, ZoomOut } from "lucide-react";

export default function CanvasEditor2D({ onCanvasUpdated }) {
  const { canvasConfig, activeLayerId, setActiveLayerId, updateLayer, removeLayer } = useConfig();

  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialLayerX: 0, initialLayerY: 0 });

  const CANVAS_SIZE = 1024;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    // Render background and all layers
    renderCanvasConfig(ctx, canvasConfig, CANVAS_SIZE, CANVAS_SIZE);

    // Active layer outline & handles
    if (activeLayerId) {
      const activeLayer = canvasConfig.layers.find((l) => l.id === activeLayerId);
      if (activeLayer) {
        ctx.save();
        const lx = (activeLayer.x ?? 0.5) * CANVAS_SIZE;
        const ly = (activeLayer.y ?? 0.5) * CANVAS_SIZE;
        const rot = ((activeLayer.rotation || 0) * Math.PI) / 180;
        const scale = activeLayer.scale || 1.0;

        ctx.translate(lx, ly);
        ctx.rotate(rot);
        ctx.scale(scale, scale);

        let boxW = 400;
        let boxH = 120;
        if (activeLayer.type === "image" && activeLayer.imageElement) {
          boxW = activeLayer.width || 600;
          boxH = activeLayer.height || 300;
        } else if (activeLayer.type === "text") {
          ctx.font = `${activeLayer.fontWeight || "bold"} ${activeLayer.fontSize || 48}px ${activeLayer.fontFamily || "Montserrat"}`;
          const metrics = ctx.measureText(activeLayer.content || "Text");
          boxW = metrics.width + 40;
          boxH = (activeLayer.fontSize || 48) + 30;
        }

        ctx.strokeStyle = "#3B82F6";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(-boxW / 2 - 10, -boxH / 2 - 10, boxW + 20, boxH + 20);

        // Scale handle
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#2563EB";
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(boxW / 2 + 10, boxH / 2 + 10, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }
    }

    if (onCanvasUpdated) {
      onCanvasUpdated(canvas);
    }
  }, [canvasConfig, activeLayerId, onCanvasUpdated]);

  useEffect(() => {
    render();
  }, [render]);

  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleFactor = CANVAS_SIZE / rect.width;

    const clickX = (e.clientX - rect.left) * scaleFactor;
    const clickY = (e.clientY - rect.top) * scaleFactor;

    const layers = canvasConfig.layers || [];
    let clickedLayer = null;

    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      const lx = (l.x ?? 0.5) * CANVAS_SIZE;
      const ly = (l.y ?? 0.5) * CANVAS_SIZE;
      const s = l.scale || 1.0;

      let boundW = (l.width || 400) * s;
      let boundH = (l.height || 120) * s;

      if (
        clickX >= lx - boundW / 2 - 30 &&
        clickX <= lx + boundW / 2 + 30 &&
        clickY >= ly - boundH / 2 - 30 &&
        clickY <= ly + boundH / 2 + 30
      ) {
        clickedLayer = l;
        break;
      }
    }

    if (clickedLayer) {
      setActiveLayerId(clickedLayer.id);
      setIsDragging(true);
      dragStartRef.current = {
        x: clickX,
        y: clickY,
        initialLayerX: clickedLayer.x ?? 0.5,
        initialLayerY: clickedLayer.y ?? 0.5
      };
    } else {
      setActiveLayerId(null);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !activeLayerId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleFactor = CANVAS_SIZE / rect.width;

    const currentX = (e.clientX - rect.left) * scaleFactor;
    const currentY = (e.clientY - rect.top) * scaleFactor;

    const dx = currentX - dragStartRef.current.x;
    const dy = currentY - dragStartRef.current.y;

    const newX = Math.max(0.05, Math.min(0.95, dragStartRef.current.initialLayerX + dx / CANVAS_SIZE));
    const newY = Math.max(0.05, Math.min(0.95, dragStartRef.current.initialLayerY + dy / CANVAS_SIZE));
    updateLayer(activeLayerId, { x: newX, y: newY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const activeLayer = canvasConfig.layers.find((l) => l.id === activeLayerId);

  return (
    <div
      className="editor-pane-container"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Top Bar with title & quick layer tools */}
      <div className="editor-surface-title-row">
        <div className="editor-title-col">
          <span className="editor-badge">Full Tent Texture Canvas</span>
          <h2 className="editor-surface-name">Canopy Print Layout</h2>
          <p className="editor-surface-desc">
            Single unified canvas mapping live across the entire 3D tent model.
          </p>
        </div>

        {activeLayer && (
          <div className="layer-fast-actions">
            <span className="layer-tag-label">
              {activeLayer.type === "text" ? `"${activeLayer.content}"` : activeLayer.name || "Image"}
            </span>

            <div className="scale-control-group">
              <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>Scale:</span>
              <button
                onClick={() =>
                  updateLayer(activeLayer.id, {
                    scale: Math.max(0.2, (activeLayer.scale || 1) - 0.1)
                  })
                }
                className="btn-scale-step"
              >
                -
              </button>
              <span className="scale-value-text">
                {Math.round((activeLayer.scale || 1) * 100)}%
              </span>
              <button
                onClick={() =>
                  updateLayer(activeLayer.id, {
                    scale: Math.min(3.0, (activeLayer.scale || 1) + 0.1)
                  })
                }
                className="btn-scale-step"
              >
                +
              </button>
            </div>

            <button
              onClick={() => updateLayer(activeLayer.id, { x: 0.5, y: 0.5 })}
              className="btn-center-layer"
            >
              Center
            </button>

            <button
              onClick={() => removeLayer(activeLayer.id)}
              className="btn-delete-layer"
              title="Delete Element"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* The Single Square Canvas Frame */}
      <div className="canvas-frame">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          className="canvas-element"
          style={{
            width: "500px",
            height: "500px",
            maxWidth: "80vw",
            maxHeight: "56vh",
            objectFit: "contain"
          }}
        />
      </div>

      {/* Bottom Guidance */}
      <div className="editor-bottom-hint">
        <span>Click element to select</span>
        <span>•</span>
        <span>Drag anywhere to position on tent</span>
        <span>•</span>
        <span>1:1 Live 3D Mapping</span>
      </div>
    </div>
  );
}
