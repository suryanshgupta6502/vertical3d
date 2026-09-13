import React, { useState } from "react";
import { Palette, Image as ImageIcon, Type, Layers } from "lucide-react";
import SurfacePanel from "../panels/SurfacePanel";
import LogoPanel from "../panels/LogoPanel";
import TextPanel from "../panels/TextPanel";
import LayersPanel from "../panels/LayersPanel";

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState("color");

  const tabs = [
    { id: "color", label: "Color", icon: Palette },
    { id: "logo", label: "Logos", icon: ImageIcon },
    { id: "text", label: "Text", icon: Type },
    { id: "layers", label: "Layers", icon: Layers }
  ];

  return (
    <aside className="sidebar-drawer">
      {/* Category Tabs */}
      <div className="sidebar-tab-row">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${isActive ? "active" : ""}`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Panel Body */}
      <div className="sidebar-scroll-body custom-scrollbar">
        {activeTab === "color" && <SurfacePanel />}
        {activeTab === "logo" && <LogoPanel />}
        {activeTab === "text" && <TextPanel />}
        {activeTab === "layers" && <LayersPanel />}
      </div>
    </aside>
  );
}
