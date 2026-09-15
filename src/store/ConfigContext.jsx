import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { PRODUCT_INFO, HARDWARE_OPTIONS } from "../config/productData";
import { calculatePricing } from "../services/pricingService";

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [designId] = useState(() => `TENT-8X8-${Date.now().toString(36).toUpperCase()}`);

  // Single unified canvas configuration
  const [canvasConfig, setCanvasConfig] = useState({
    backgroundColor: "#FACC15",
    layers: []
  });

  const [activeLayerId, setActiveLayerId] = useState(null);

  // Hardware selections
  const [hardware, setHardware] = useState({
    frameType: "40mm_hex_silver",
    wallPackage: "none",
    accessories: []
  });

  // UI View Mode: 'split' | '3d' | '2d' | 'storefront'
  const [viewMode, setViewMode] = useState("split");

  // Camera preset & controls
  const [cameraPreset, setCameraPreset] = useState("iso");
  const [autoRotate, setAutoRotate] = useState(false);

  // Set Background Color
  const setBackgroundColor = useCallback((hexColor) => {
    setCanvasConfig((prev) => ({
      ...prev,
      backgroundColor: hexColor
    }));
  }, []);

  // Add text layer to canvas
  const addTextLayer = useCallback((text = "YOUR BRAND NAME") => {
    const newLayer = {
      id: `text-${Date.now()}`,
      type: "text",
      content: text,
      color: "#0F172A",
      fontSize: 38,
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: "800",
      x: 0.5,
      y: 0.70,
      scale: 1.0,
      rotation: 0,
      opacity: 1.0,
      stroke: true,
      strokeColor: "#FFFFFF",
      strokeWidth: 4
    };

    setCanvasConfig((prev) => ({
      ...prev,
      layers: [...prev.layers, newLayer]
    }));

    setActiveLayerId(newLayer.id);
  }, []);

  // Add image / full artwork layer
  const addImageLayer = useCallback((imgElement, fileName = "artwork.png") => {
    // Default size to fit front peak cleanly
    const targetW = 340;
    const targetH = (imgElement.naturalHeight / (imgElement.naturalWidth || 1)) * targetW;

    const newLayer = {
      id: `img-${Date.now()}`,
      type: "image",
      name: fileName,
      imageElement: imgElement,
      width: targetW,
      height: targetH,
      x: 0.5,
      y: 0.70,
      scale: 1.0,
      rotation: 0,
      opacity: 1.0
    };

    setCanvasConfig((prev) => ({
      ...prev,
      layers: [...prev.layers, newLayer]
    }));

    setActiveLayerId(newLayer.id);
  }, []);

  // Update layer properties
  const updateLayer = useCallback((layerId, updates) => {
    setCanvasConfig((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === layerId ? { ...l, ...updates } : l))
    }));
  }, []);

  // Remove layer
  const removeLayer = useCallback((layerId) => {
    setCanvasConfig((prev) => ({
      ...prev,
      layers: prev.layers.filter((l) => l.id !== layerId)
    }));
    setActiveLayerId(null);
  }, []);

  // Update hardware option
  const updateHardware = useCallback((category, value) => {
    setHardware((prev) => {
      if (category === "accessories") {
        const exists = prev.accessories.includes(value);
        return {
          ...prev,
          accessories: exists ? prev.accessories.filter((a) => a !== value) : [...prev.accessories, value]
        };
      }
      return {
        ...prev,
        [category]: value
      };
    });
  }, []);

  // Compute live dynamic pricing
  const pricing = useMemo(() => {
    return calculatePricing({ hardware, canvasConfig });
  }, [hardware, canvasConfig]);

  const value = {
    designId,
    canvasConfig,
    activeLayerId,
    setActiveLayerId,
    setBackgroundColor,
    addTextLayer,
    addImageLayer,
    updateLayer,
    removeLayer,
    hardware,
    updateHardware,
    viewMode,
    setViewMode,
    cameraPreset,
    setCameraPreset,
    autoRotate,
    setAutoRotate,
    pricing
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
}
