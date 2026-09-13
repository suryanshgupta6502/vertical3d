# Interactive 3D/2D Canopy Tent Product Configurator

A high-performance, responsive, and embeddable 3D/2D product configurator for commercial pop-up canopy event tents (8x8 and customizable). Built with **React 18**, **Three.js**, and **Vanilla CSS**.

---

## 🌟 Key Features

1. **3D Real-Time WebGL Viewport (Three.js)**:
   - Loads commercial `Tent_8_8.glb` model with realistic PBR materials, shadows, and soft ambient lighting.
   - Smooth `OrbitControls` with camera presets (Front, 3D Iso, Back, Left, Right, Top).
   - 360° auto-spin toggle and instant high-res snapshot capture.

2. **Interactive 2D Canvas Editor**:
   - Multi-surface navigation across all 8 canopy faces (Front Peak, Front Valance, Back Peak, Back Valance, Left Peak, Left Valance, Right Peak, Right Valance) plus optional Full Backdrop Wall.
   - Real-time 2D Canvas $\to$ `THREE.CanvasTexture` synchronization onto the 3D model's `fabric_Mat`.
   - Text tool with Google Fonts typography, font size sliders, colors, and outline strokes.
   - Logo and artwork tool with drag-and-drop file upload (PNG/JPG/SVG) and 1-click test brand badges.
   - Interactive handles to drag, reposition, scale, center, and delete layers.

3. **Dynamic Pricing Engine**:
   - Real-time pricing calculations based on selected hardware options:
     - Base package: $599.00 (includes 2 printed panels).
     - Frame upgrades: Commercial 40mm Silver Hex vs 50mm Pro Heavy-Duty Matte Black (+$149.00).
     - Backdrop wall packages: None, Full Back Wall single-sided (+$119.00), Full Back Wall double-sided (+$179.00).
     - Accessories: Heavy-duty roller bag (+$49.00), sandbag weight anchors (+$39.00).
     - Additional print zone setup fees calculated dynamically.

4. **Shopify Integration & Cart Pipeline**:
   - Compiles standard Shopify **Line Item Properties (`properties`)**:
     - Customer-visible: `Design ID`, `Tent Size`, `Frame Finish`, `Canopy Color`, `Wall Package`, `Design Preview` thumbnail.
     - Hidden Admin/Production properties (prefixed with `_`): `_Print File`, `_UV Layout`, `_Panel Colors`, `_Design Texts`.
   - Built-in slide-out **Shopify Cart Drawer** simulating the cart addition experience.
   - Built-in **Shopify Storefront Demo** view demonstrating how the configurator is embedded in an e-commerce theme.
   - Dispatches `window.parent.postMessage` (`CONFIGURATOR_SAVE`) for iframe embedding and compatibility with Shopify bridge scripts (such as `test.js`).

5. **Production Job Specsheet PDF Export**:
   - Multi-page commercial print production PDF generated via `jspdf`:
     - **Page 1**: 3D rendered perspective shot, order reference ID, hardware technical specifications, color swatch table, and itemized pricing breakdown.
     - **Page 2**: 2D flat-pattern UV layout, inventory of applied logos/text, and manufacturing quality control sign-off section.

---

## 🏗️ Architecture & Technical Decisions

```
src/
├── config/
│   └── productData.js       # Product catalog, surfaces, colors, fonts, hardware options
├── store/
│   └── ConfigContext.jsx    # Central React Context for state management & undo/redo
├── services/
│   ├── pricingService.js    # Dynamic pricing calculation logic
│   ├── shopifyService.js    # Shopify Line Item Properties & postMessage dispatcher
│   ├── pdfGenerator.js      # jsPDF commercial production job ticket generator
│   └── canvasSync.js        # Master 2048x2048 UV texture baking & coordinate mapping
├── components/
│   ├── layout/
│   │   ├── Header.jsx       # View mode switchers, live price bar, cart & PDF buttons
│   │   ├── Sidebar.jsx      # Tabbed customization drawer (Color, Logo, Text, Frame, Layers)
│   │   ├── ShopifyCartDrawer.jsx # Slide-out cart drawer simulator
│   │   └── ShopifyStorefrontDemo.jsx # Mock Shopify theme product showcase page
│   ├── viewer3d/
│   │   ├── TentViewer3D.jsx # Three.js WebGL canvas, GLTFLoader, CanvasTexture sync
│   │   └── ViewportToolbar.jsx # Camera angle presets, auto-rotate, screenshot capture
│   ├── editor2d/
│   │   ├── CanvasEditor2D.jsx # 2D canvas with direct element drag, scale & rotate
│   │   └── SurfaceNav.jsx   # Surface selection bar with color indicators
│   └── panels/
│       ├── SurfacePanel.jsx # Color palette swatches & custom HEX input
│       ├── LogoPanel.jsx    # Image/SVG upload & quick test logo badges
│       ├── TextPanel.jsx    # Typography, sizing, color & stroke outline controls
│       ├── HardwarePanel.jsx# Frame types, wall additions, and accessories
│       └── LayersPanel.jsx  # Layer stack management & deletion
├── index.css                # Pure Vanilla CSS styling (no Tailwind dependency)
├── App.jsx                  # Root layout orchestration
└── main.jsx                 # React entry point
```

### Key Technical Decisions:
1. **Model Loading vs Procedural**:
   - Loaded the provided `Tent_8_8.glb` using Three.js `GLTFLoader`.
   - Identified the `fabric_Mat` material on the tent canopy mesh and bound dynamic `THREE.CanvasTexture` directly to `fabric_Mat.map` with `needsUpdate = true`.
2. **2D-to-3D Texture Pipeline**:
   - Each surface (Front Peak, Front Valance, etc.) has its own interactive 2D canvas.
   - `canvasSync.js` maps and bakes individual surfaces into a 2048x2048 unfolded UV layout texture, eliminating seam distortion.
3. **Pure JavaScript / JSX & Vanilla CSS**:
   - Built cleanly without TypeScript or Tailwind CSS, ensuring maximum performance, zero build bloat, and complete styling flexibility.
4. **Shopify PostMessage Protocol**:
   - Fully compatible with standard Shopify theme iframe blocks and existing bridge scripts (`test.js`), capturing preview files, UV layouts, side angle views, and line item properties.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev
```

Visit `http://localhost:3000/` in your browser.

### Test Iframe Embed Demo
To test iframe embedding and `postMessage` event capture:
Open `http://localhost:3000/embed-demo.html` in your browser.
