import React, { useRef, useEffect, useState, useCallback } from "react";
import { useConfig } from "../../store/ConfigContext";
import { renderCanvasConfig, getCanopySection } from "../../services/canvasSync";
import { Trash2, Eye, EyeOff, MapPin, Layers, MousePointer } from "lucide-react";

export default function CanvasEditor2D({ onCanvasUpdated }) {
  const { canvasConfig, activeLayerId, setActiveLayerId, updateLayer, removeLayer } = useConfig();

  const canvasRef = useRef(null);
  const cleanCanvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const dragStartRef = useRef({
    clientX: 0,
    clientY: 0,
    initialLayerX: 0.5,
    initialLayerY: 0.5,
    rectWidth: 520,
    rectHeight: 520
  });

  const CANVAS_SIZE = 1024;

  // Offscreen canvas for 3D texture mapping (clean without guide labels/handles)
  if (!cleanCanvasRef.current && typeof document !== "undefined") {
    cleanCanvasRef.current = document.createElement("canvas");
    cleanCanvasRef.current.width = CANVAS_SIZE;
    cleanCanvasRef.current.height = CANVAS_SIZE;
  }

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    // 1. Render 2D Editor Canvas with visual UV gaps & panel boundaries
    renderCanvasConfig(ctx, canvasConfig, CANVAS_SIZE, CANVAS_SIZE, {
      includeGuides: showGuides
    });

    // 2. Active layer outline & handles
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

        let boxW = 340;
        let boxH = 100;
        if (activeLayer.type === "image" && activeLayer.imageElement) {
          boxW = activeLayer.width || 340;
          boxH = activeLayer.height || 160;
        } else if (activeLayer.type === "text") {
          ctx.font = `${activeLayer.fontWeight || "800"} ${activeLayer.fontSize || 38}px ${activeLayer.fontFamily || "Montserrat"}`;
          const metrics = ctx.measureText(activeLayer.content || "Text");
          boxW = metrics.width + 48;
          boxH = (activeLayer.fontSize || 38) + 24;
        }

        ctx.strokeStyle = "#2563EB";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(-boxW / 2 - 8, -boxH / 2 - 8, boxW + 16, boxH + 16);

        // Scale handle
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#1D4ED8";
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(boxW / 2 + 8, boxH / 2 + 8, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }
    }

    // 3. Render clean canvas (artwork only) for 3D model texture (no 3D mapping changes)
    if (cleanCanvasRef.current && onCanvasUpdated) {
      const cleanCtx = cleanCanvasRef.current.getContext("2d");
      renderCanvasConfig(cleanCtx, canvasConfig, CANVAS_SIZE, CANVAS_SIZE, {
        includeGuides: false
      });
      onCanvasUpdated(cleanCanvasRef.current);
    }
  }, [canvasConfig, activeLayerId, showGuides, onCanvasUpdated]);

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

    const ctx = canvas.getContext("2d");

    for (let i = layers.length - 1; i >= 0; i--) {
      const l = layers[i];
      const lx = (l.x ?? 0.5) * CANVAS_SIZE;
      const ly = (l.y ?? 0.5) * CANVAS_SIZE;
      const s = l.scale || 1.0;

      let boundW = 340;
      let boundH = 100;

      if (l.type === "image" && l.imageElement) {
        boundW = (l.width || 340) * s;
        boundH = (l.height || 160) * s;
      } else if (l.type === "text") {
        ctx.font = `${l.fontWeight || "800"} ${l.fontSize || 38}px ${l.fontFamily || "Montserrat"}`;
        const metrics = ctx.measureText(l.content || "Text");
        boundW = (metrics.width + 48) * s;
        boundH = ((l.fontSize || 38) + 24) * s;
      }

      const hitPadding = 28;
      if (
        clickX >= lx - boundW / 2 - hitPadding &&
        clickX <= lx + boundW / 2 + hitPadding &&
        clickY >= ly - boundH / 2 - hitPadding &&
        clickY <= ly + boundH / 2 + hitPadding
      ) {
        clickedLayer = l;
        break;
      }
    }

    if (clickedLayer) {
      setActiveLayerId(clickedLayer.id);
      setIsDragging(true);
      dragStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        initialLayerX: clickedLayer.x ?? 0.5,
        initialLayerY: clickedLayer.y ?? 0.5,
        rectWidth: rect.width,
        rectHeight: rect.height
      };
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (_) {}
    } else {
      setActiveLayerId(null);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !activeLayerId) return;
    const { clientX, clientY, initialLayerX, initialLayerY, rectWidth, rectHeight } = dragStartRef.current;
    if (!rectWidth || !rectHeight) return;

    const deltaX = (e.clientX - clientX) / rectWidth;
    const deltaY = (e.clientY - clientY) / rectHeight;

    const newX = Math.max(0.02, Math.min(0.98, initialLayerX + deltaX));
    const newY = Math.max(0.02, Math.min(0.98, initialLayerY + deltaY));
    updateLayer(activeLayerId, { x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        canvasRef.current?.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  const activeLayer = canvasConfig.layers.find((l) => l.id === activeLayerId);
  const activeSection = activeLayer ? getCanopySection(activeLayer.x ?? 0.5, activeLayer.y ?? 0.5) : null;

  return (
    <div
      className="editor-pane-container"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* 1. Header Bar: Fixed 44px Height (Never Jumps or Wraps) */}
      <div
        style={{
          width: "100%",
          height: "44px",
          minHeight: "44px",
          maxHeight: "44px",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border-subtle)",
          background: "var(--bg-dark)",
          zIndex: 10,
          boxSizing: "border-box",
          overflow: "hidden"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--text-white)",
              whiteSpace: "nowrap",
              flexShrink: 0
            }}
          >
            <Layers size={15} color="var(--blue-600)" />
            <span>Canopy UV Map</span>
          </div>

          {activeSection && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                background: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: "18px"
              }}
            >
              <MapPin size={11} style={{ flexShrink: 0 }} />
              <span>Location: <strong>{activeSection.name}</strong></span>
            </span>
          )}
        </div>

        {/* Toggle UV Guides */}
        <button
          onClick={() => setShowGuides(!showGuides)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "11px",
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            background: showGuides ? "#eff6ff" : "var(--bg-card)",
            color: showGuides ? "var(--blue-600)" : "var(--text-muted)",
            cursor: "pointer",
            whiteSpace: "nowrap",
            flexShrink: 0
          }}
          title="Show or hide UV panel boundaries and labels"
        >
          {showGuides ? <Eye size={13} /> : <EyeOff size={13} />}
          <span>UV Gaps: {showGuides ? "ON" : "OFF"}</span>
        </button>
      </div>

      {/* 2. Layer Action Bar: Fixed 40px Height (Always Present to Prevent Any Height Jumping) */}
      <div
        style={{
          width: "100%",
          height: "40px",
          minHeight: "40px",
          maxHeight: "40px",
          padding: "0 14px",
          background: "var(--bg-darkest)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          zIndex: 10,
          boxSizing: "border-box",
          overflowX: "auto",
          overflowY: "hidden",
          whiteSpace: "nowrap"
        }}
      >
        {activeLayer ? (
          <>
            {/* Quick Positioning Helpers */}
            <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Move to:
              </span>
              {[
                { label: "Front Peak", x: 0.5, y: 0.70 },
                { label: "Front Valance", x: 0.5, y: 0.928 },
                { label: "Back Peak", x: 0.5, y: 0.30 },
                { label: "Back Valance", x: 0.5, y: 0.072 },
                { label: "Left Peak", x: 0.30, y: 0.5 },
                { label: "Right Peak", x: 0.70, y: 0.5 }
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => updateLayer(activeLayer.id, { x: preset.x, y: preset.y })}
                  style={{
                    padding: "3px 7px",
                    fontSize: "10px",
                    fontWeight: 600,
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--bg-card)",
                    color: "var(--text-light)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Scale & Delete */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              <div className="scale-control-group" style={{ margin: 0, padding: "2px 6px" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>Scale:</span>
                <button
                  onClick={() =>
                    updateLayer(activeLayer.id, {
                      scale: Math.max(0.2, (activeLayer.scale || 1) - 0.1)
                    })
                  }
                  className="btn-scale-step"
                  style={{ padding: "0 6px", height: "20px", minWidth: "20px" }}
                >
                  -
                </button>
                <span className="scale-value-text" style={{ fontSize: "11px", minWidth: "34px" }}>
                  {Math.round((activeLayer.scale || 1) * 100)}%
                </span>
                <button
                  onClick={() =>
                    updateLayer(activeLayer.id, {
                      scale: Math.min(3.0, (activeLayer.scale || 1) + 0.1)
                    })
                  }
                  className="btn-scale-step"
                  style={{ padding: "0 6px", height: "20px", minWidth: "20px" }}
                >
                  +
                </button>
              </div>

              <button
                onClick={() => removeLayer(activeLayer.id)}
                className="btn-delete-layer"
                title="Delete Element"
                style={{ cursor: "pointer", padding: "4px 8px" }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              color: "var(--text-muted)",
              userSelect: "none"
            }}
          >
            <MousePointer size={12} style={{ color: "var(--blue-600)" }} />
            <span>Click any logo or text on the canvas to drag, position, or scale.</span>
          </div>
        )}
      </div>

      {/* 3. Canvas Frame: Stable, minHeight 0, Never Shifts */}
      <div
        style={{
          flex: 1,
          width: "100%",
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          overflow: "hidden",
          boxSizing: "border-box"
        }}
      >
        <div className="canvas-frame" style={{ position: "relative" }}>
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="canvas-element"
            style={{
              width: "520px",
              height: "520px",
              maxWidth: "82vw",
              maxHeight: "60vh",
              objectFit: "contain",
              cursor: isDragging ? "grabbing" : "grab",
              touchAction: "none",
              userSelect: "none"
            }}
          />
        </div>
      </div>
    </div>
  );
}
