# Commercial Canopy Tent 3D Configurator

## Project Overview
An interactive 3D/2D product configurator developed for commercial event canopy tents. The solution allows users to customize fabric colors, place text and logos, select hardware configurations, view live dynamic pricing, and export production-ready specifications.

---

## Architecture Overview

The application follows a decoupled, modular client-side architecture divided into four primary components:

### 1. State Management Layer
A centralized React context serves as the single source of truth across the application. It manages design attributes, active layers (position, scaling, rotation, opacity), hardware selections, camera states, and real-time cost calculation.

### 2. 2D Canvas Engine
An HTML5 Canvas system responsible for rendering custom artwork, vector text typography, uploaded logos, and fabric base colors. Pointer interactions allow direct manipulation (dragging, scaling, centering, and layer reordering) while keeping texture coordinate data consistent.

### 3. 3D WebGL Visualization (Three.js)
A real-time WebGL rendering pipeline that loads the tent GLTF model (`Tent_8_8.glb`), manages physically based rendering (PBR) materials, directional lighting, and soft ground contact shadows. The 2D master canvas is bound directly to the tent fabric material via a dynamic canvas texture that updates on each change.

### 4. Integration & Export Pipeline
- **E-Commerce Bridge**: Communicates with host storefronts (such as Shopify) using the asynchronous HTML5 `postMessage` protocol, passing custom attributes, print texture blobs, and 3D preview snapshots to the cart.
- **Production Specsheet Export**: Generates client-side multi-page PDF job tickets containing order metadata, technical specifications, color swatch values, and 3D perspective renders.

---

## Key Technical Decisions

- **Single Master Canvas Texture Pipeline**: Rather than managing multiple disconnected materials across canopy surfaces, customer artwork and colors are rendered onto a single high-resolution texture map. This prevents visible seams along geometry edges, minimizes WebGL draw calls, and delivers instant synchronization.
- **Native Three.js over Third-Party Wrappers**: Direct Three.js integration was selected to ensure full control over rendering loops, tone mapping, OrbitControls constraints, and camera preset transitions without relying on proprietary 3D SaaS dependencies.
- **Cross-Window postMessage Integration**: Using standard browser message passing allows the configurator to be embedded in any e-commerce theme or CMS via an iframe without cross-origin (CORS) script conflicts or dependencies on store-specific frontend frameworks.
- **Client-Side Asset Generation**: Processing high-resolution print files, 3D perspective captures, and PDF specsheets entirely in the browser eliminates backend processing overhead, ensuring low latency and straightforward static hosting.
- **Vanilla CSS Design System**: Pure CSS with design tokens was implemented rather than utility frameworks (e.g., Tailwind) to prevent stylesheet conflicts with host storefronts, reduce bundle footprint, and facilitate seamless theme adjustments.
