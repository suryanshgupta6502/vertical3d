import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useConfig } from "../../store/ConfigContext";
import { HARDWARE_OPTIONS } from "../../config/productData";
import { Loader2 } from "lucide-react";

const CAMERA_POSITIONS = {
  front: { pos: [0, 1.8, 4.2], target: [0, 1.5, 0] },
  iso: { pos: [3.4, 2.4, 3.4], target: [0, 1.5, 0] },
  back: { pos: [0, 1.8, -4.2], target: [0, 1.5, 0] },
  left: { pos: [-4.2, 1.8, 0], target: [0, 1.5, 0] },
  right: { pos: [4.2, 1.8, 0], target: [0, 1.5, 0] },
  top: { pos: [0, 5.5, 0.1], target: [0, 1.5, 0] }
};

const TentViewer3D = forwardRef(function TentViewer3D({ masterCanvas, onCanvasReady }, ref) {
  const containerRef = useRef(null);
  const { hardware, cameraPreset, autoRotate, textureVersion } = useConfig();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Auto rotate ref to prevent stale closure in animation loop
  const autoRotateRef = useRef(autoRotate);
  useEffect(() => {
    autoRotateRef.current = autoRotate;
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  // Three.js internal references
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const fabricMaterialRef = useRef(null);
  const metalMaterialRef = useRef(null);
  const canvasTextureRef = useRef(null);
  const backWallMeshRef = useRef(null);

  // Helper to apply or update master canvas texture on fabric material
  const applyTexture = useCallback(() => {
    if (!masterCanvas || !fabricMaterialRef.current) return;

    if (!canvasTextureRef.current) {
      const texture = new THREE.CanvasTexture(masterCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.flipY = false;

      canvasTextureRef.current = texture;
      fabricMaterialRef.current.map = texture;
    } else {
      fabricMaterialRef.current.map = canvasTextureRef.current;
      canvasTextureRef.current.image = masterCanvas;
      canvasTextureRef.current.needsUpdate = true;
    }
    fabricMaterialRef.current.needsUpdate = true;
  }, [masterCanvas]);

  // Expose snapshot capture and texture updates to parent
  useImperativeHandle(ref, () => ({
    updateTexture: () => {
      applyTexture();
    },
    captureSnapshot: (angle = "front") => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return null;

      const cam = cameraRef.current;
      const controls = controlsRef.current;
      const target = CAMERA_POSITIONS[angle] || CAMERA_POSITIONS.front;

      cam.position.set(...target.pos);
      controls.target.set(...target.target);
      controls.update();

      rendererRef.current.render(sceneRef.current, cam);
      return rendererRef.current.domElement.toDataURL("image/jpeg", 0.92);
    },
    captureAllSides: () => {
      const sides = ["front", "back", "left", "right"];
      const shots = {};
      sides.forEach((side) => {
        shots[side] = {
          dataUrl: ref.current?.captureSnapshot(side),
          name: `tent_${side}.jpg`,
          type: "image/jpeg"
        };
      });

      const current = CAMERA_POSITIONS[cameraPreset] || CAMERA_POSITIONS.front;
      if (cameraRef.current && controlsRef.current && rendererRef.current && sceneRef.current) {
        cameraRef.current.position.set(...current.pos);
        controlsRef.current.target.set(...current.target);
        controlsRef.current.update();
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      return shots;
    }
  }));

  // Initialize Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Determine initial dimensions
    const width = container.clientWidth || container.parentElement?.clientWidth || 700;
    const height = container.clientHeight || container.parentElement?.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#090d16");
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    const initialCam = CAMERA_POSITIONS.front;
    camera.position.set(...initialCam.pos);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 2.0;
    controls.maxDistance = 10.0;
    controls.target.set(...initialCam.target);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight("#FFFFFF", 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight("#FFFFFF", 2.2);
    dirLight1.position.set(5, 8, 5);
    dirLight1.castShadow = true;
    dirLight1.shadow.mapSize.width = 2048;
    dirLight1.shadow.mapSize.height = 2048;
    dirLight1.shadow.camera.near = 0.5;
    dirLight1.shadow.camera.far = 25;
    dirLight1.shadow.bias = -0.0005;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight("#93c5fd", 1.0);
    dirLight2.position.set(-5, 4, -5);
    scene.add(dirLight2);

    // 6. Shadow Floor
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.4 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(12, 12, "#1e293b", "#0f172a");
    grid.position.y = 0.001;
    scene.add(grid);

    // 7. Load Tent_8_8.glb
    const loader = new GLTFLoader();
    loader.load(
      "/Tent_8_8.glb",
      (gltf) => {
        const root = gltf.scene;
        root.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;

            if (node.material) {
              const mats = Array.isArray(node.material) ? node.material : [node.material];
              mats.forEach((mat) => {
                if (mat.name === "fabric_Mat" || node.name === "fabric") {
                  fabricMaterialRef.current = mat;
                  // If master canvas is already ready, bind texture
                  if (masterCanvas && !canvasTextureRef.current) {
                    const texture = new THREE.CanvasTexture(masterCanvas);
                    texture.colorSpace = THREE.SRGBColorSpace;
                    texture.generateMipmaps = true;
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.flipY = false;
                    canvasTextureRef.current = texture;
                    mat.map = texture;
                    mat.needsUpdate = true;
                  }
                }
                if (mat.name === "Metal_mat") {
                  metalMaterialRef.current = mat;
                }
              });
            }
          }
        });

        // Center model on ground
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        root.position.x -= center.x;
        root.position.z -= center.z;
        root.position.y -= box.min.y;

        scene.add(root);
        setIsLoaded(true);
        applyTexture();

        if (onCanvasReady) onCanvasReady();
      },
      (xhr) => {
        if (xhr.total > 0) {
          setLoadingProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (err) => {
        console.error("Error loading Tent_8_8.glb:", err);
      }
    );

    // 8. Animation loop
    let reqId;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.autoRotate = autoRotateRef.current;
        controlsRef.current.autoRotateSpeed = 2.0;
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || container.parentElement?.clientWidth;
      const h = container.clientHeight || container.parentElement?.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };

    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      cancelAnimationFrame(reqId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Canvas Texture when masterCanvas or isLoaded updates
  useEffect(() => {
    applyTexture();
  }, [applyTexture, isLoaded, masterCanvas, textureVersion]);

  // Update Frame Material based on hardware selection
  useEffect(() => {
    if (!metalMaterialRef.current) return;
    const frameId = hardware?.frameType || "40mm_hex_silver";
    const frameOpt = HARDWARE_OPTIONS.frameTypes.find((f) => f.id === frameId);

    if (frameOpt) {
      metalMaterialRef.current.color = new THREE.Color(frameOpt.finish);
      metalMaterialRef.current.roughness = frameOpt.roughness;
      metalMaterialRef.current.metalness = frameOpt.metalness;
      metalMaterialRef.current.needsUpdate = true;
    }
  }, [hardware.frameType, isLoaded]);

  // Update Wall Mesh (Add or remove Back Wall)
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const wallChoice = hardware?.wallPackage || "none";

    if (backWallMeshRef.current) {
      scene.remove(backWallMeshRef.current);
      backWallMeshRef.current.geometry.dispose();
      backWallMeshRef.current = null;
    }

    if (wallChoice !== "none") {
      const wallGeo = new THREE.PlaneGeometry(2.42, 2.12);
      const wallMat = new THREE.MeshStandardMaterial({
        color: "#FFFFFF",
        roughness: 0.75,
        side: THREE.DoubleSide
      });

      if (canvasTextureRef.current) {
        wallMat.map = canvasTextureRef.current;
      }

      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.set(0, 1.06, -1.21);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      scene.add(wallMesh);
      backWallMeshRef.current = wallMesh;
    }
  }, [hardware.wallPackage, isLoaded]);

  // Camera preset transition
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const target = CAMERA_POSITIONS[cameraPreset] || CAMERA_POSITIONS.front;

    const cam = cameraRef.current;
    const controls = controlsRef.current;

    cam.position.set(...target.pos);
    controls.target.set(...target.target);
    controls.update();
  }, [cameraPreset]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "380px",
        userSelect: "none",
        overflow: "hidden",
        backgroundColor: "var(--bg-darkest)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {/* WebGL Canvas Container */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          cursor: "grab"
        }}
      />

      {/* Loading Overlay */}
      {!isLoaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(9, 13, 22, 0.92)",
            backdropFilter: "blur(6px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            gap: "12px"
          }}
        >
          <Loader2 size={36} color="#3b82f6" style={{ animation: "spin 1s linear infinite" }} />
          <div style={{ color: "var(--text-light)", fontWeight: "700", fontSize: "13px" }}>
            Loading 3D Tent Model ({loadingProgress}%)
          </div>
          <div
            style={{
              width: "180px",
              height: "6px",
              backgroundColor: "var(--bg-card)",
              borderRadius: "9999px",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                width: `${loadingProgress}%`,
                height: "100%",
                backgroundColor: "var(--blue-500)",
                borderRadius: "9999px",
                transition: "width 0.3s ease"
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
});

export default TentViewer3D;
