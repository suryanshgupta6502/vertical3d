import React, { useRef, useState, useEffect, useCallback } from "react";
import { ConfigProvider, useConfig } from "./store/ConfigContext";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import CanvasEditor2D from "./components/editor2d/CanvasEditor2D";
import TentViewer3D from "./components/viewer3d/TentViewer3D";
import ViewportToolbar from "./components/viewer3d/ViewportToolbar";
import { createMasterCanvas, renderCanvasConfig } from "./services/canvasSync";
import { generateProductionPDF } from "./services/pdfGenerator";

function ConfiguratorContent() {
  const { canvasConfig, hardware, pricing, viewMode, designId } = useConfig();

  const tentViewerRef = useRef(null);
  const masterCanvasRef = useRef(null);

  // Synchronously initialize master canvas with default color & config
  if (!masterCanvasRef.current) {
    masterCanvasRef.current = createMasterCanvas();
    const ctx = masterCanvasRef.current.getContext("2d");
    renderCanvasConfig(ctx, canvasConfig, 1024, 1024);
  }

  // PDF Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState(false);
  const [cartSuccessMessage, setCartSuccessMessage] = useState(false);

  // Synchronize master canvas whenever canvasConfig updates
  useEffect(() => {
    if (masterCanvasRef.current) {
      const ctx = masterCanvasRef.current.getContext("2d");
      renderCanvasConfig(ctx, canvasConfig, 1024, 1024);
      if (tentViewerRef.current?.updateTexture) {
        tentViewerRef.current.updateTexture();
      }
    }
  }, [canvasConfig]);

  // Callback when 2D canvas is updated by editor drag/resize
  const handleCanvasUpdated = useCallback((editorCanvas) => {
    if (masterCanvasRef.current && editorCanvas) {
      const masterCtx = masterCanvasRef.current.getContext("2d");
      masterCtx.clearRect(0, 0, masterCanvasRef.current.width, masterCanvasRef.current.height);
      masterCtx.drawImage(
        editorCanvas,
        0,
        0,
        masterCanvasRef.current.width,
        masterCanvasRef.current.height
      );

      // Update 3D model texture immediately
      if (tentViewerRef.current?.updateTexture) {
        tentViewerRef.current.updateTexture();
      }
    }
  }, []);

  // Post message to Shopify parent window when embedded in iframe
  const   handleAddToCart = useCallback(() => {
    let preview3d = null;
    let uvLayout = null;

    if (tentViewerRef.current) {
      preview3d = tentViewerRef.current.captureSnapshot("iso");
    }
    if (masterCanvasRef.current) {
      uvLayout = masterCanvasRef.current.toDataURL("image/png");
    }

    const payload = {
      type: "CONFIGURATOR_ADD_TO_CART",
      designId,
      pricing,
      finalPrice: pricing.subtotal,
      formattedPrice: `$${pricing.subtotal.toFixed(2)}`,
      color: canvasConfig.backgroundColor,
      textureData: uvLayout,
      snapshotData: preview3d
    };

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, "*");
    }

    setCartSuccessMessage(true);
    setTimeout(() => setCartSuccessMessage(false), 3500);
  }, [designId, pricing, canvasConfig]);

  // Handle PDF Generation
  const handleExportPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      let preview3d = null;
      let uvLayout = null;

      if (tentViewerRef.current) {
        preview3d = tentViewerRef.current.captureSnapshot("iso");
      }
      if (masterCanvasRef.current) {
        uvLayout = masterCanvasRef.current.toDataURL("image/png");
      }

      const config = { designId, hardware, canvasConfig };
      const res = await generateProductionPDF(config, pricing, { preview3d, uvLayout });
      if (res?.success) {
        setPdfSuccessMessage(true);
        setTimeout(() => setPdfSuccessMessage(false), 3500);
      }
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header Bar */}
      <Header
        onExportPdf={handleExportPdf}
        isGeneratingPdf={isGeneratingPdf}
        pdfSuccessMessage={pdfSuccessMessage}
        onAddToCart={handleAddToCart}
        cartSuccessMessage={cartSuccessMessage}
      />

      {/* Main Workspace */}
      <main className="app-main">
        <div className="workspace-split">
          {/* 3D Viewport */}
          {(viewMode === "split" || viewMode === "3d") && (
            <div className="workspace-pane">
              <TentViewer3D
                ref={tentViewerRef}
                masterCanvas={masterCanvasRef.current}
              />
              <ViewportToolbar
                onTakeSnapshot={() => {
                  const snap = tentViewerRef.current?.captureSnapshot("iso");
                  if (snap) {
                    const link = document.createElement("a");
                    link.href = snap;
                    link.download = `tent_screenshot_${Date.now()}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
              />
            </div>
          )}

          {/* Divider in split view */}
          {viewMode === "split" && <div className="workspace-divider" />}

          {/* 2D Canvas Editor */}
          {(viewMode === "split" || viewMode === "2d") && (
            <div className="workspace-pane">
              <div style={{ flex: 1, position: "relative" }}>
                <CanvasEditor2D onCanvasUpdated={handleCanvasUpdated} />
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar Customization Panel */}
        <Sidebar />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <ConfiguratorContent />
    </ConfigProvider>
  );
}
