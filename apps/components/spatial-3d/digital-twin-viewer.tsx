"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  SPATIAL_ASSETS,
  SpatialAsset,
  ViewSpectrum,
  WorkStep,
} from "./spatial-data";

interface DigitalTwinViewerProps {
  spectrum: ViewSpectrum;
  currentStep: WorkStep;
  selectedAsset: SpatialAsset | null;
  onSelectAsset: (asset: SpatialAsset) => void;
  filteredCategory: string;
  environmentMode?: "day" | "night";
}

export const DigitalTwinViewer: React.FC<DigitalTwinViewerProps> = ({
  spectrum,
  currentStep,
  selectedAsset,
  onSelectAsset,
  filteredCategory,
  environmentMode = "day",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredAsset, setHoveredAsset] = useState<SpatialAsset | null>(null);

  // References to keep between renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const assetMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const animatedObjectsRef = useRef<THREE.Object3D[]>([]);
  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);
  const targetLookAtRef = useRef<THREE.Vector3 | null>(null);

  // Initialize Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 30, 48);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground
    controls.minDistance = 8;
    controls.maxDistance = 140;
    controls.target.set(0, 4, 0);
    controlsRef.current = controls;

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    ambientLight.name = "ambient-light";
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 2.0); // Warm sunny daylight
    dirLight.position.set(45, 75, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 180;
    dirLight.shadow.camera.left = -60;
    dirLight.shadow.camera.right = 60;
    dirLight.shadow.camera.top = 60;
    dirLight.shadow.camera.bottom = -60;
    dirLight.shadow.bias = -0.0005;
    dirLight.name = "sun-light";
    scene.add(dirLight);

    // Natural hemisphere sky-and-ground bounce light
    const hemiLight = new THREE.HemisphereLight(0xbde0fe, 0x86efac, 0.75);
    hemiLight.name = "hemi-light";
    scene.add(hemiLight);

    // Blue fill light for crisp modern architectural contrast
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    fillLight.position.set(-40, 20, -40);
    fillLight.name = "fill-light";
    scene.add(fillLight);

    // 6. Build Campus Environment
    buildEnvironment(scene, environmentMode);

    // 7. Build All 3D Assets
    buildAssets(scene, assetMeshesRef.current);

    // 8. Build Utility Networks (Conduits, Water Pipes, Underground Grid)
    buildUtilityNetworks(scene, animatedObjectsRef.current);

    // 9. Build Radiant Thermal Hotspots (FLIR view emitters)
    buildThermalHotspots(scene, animatedObjectsRef.current);

    // Cache default materials on all meshes for non-destructive switching
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && !obj.userData.defaultMaterial) {
        obj.userData.defaultMaterial = obj.material;
      }
    });

    // Initial pass of spectrum and environment
    applySpectrumToScene(scene, spectrum, currentStep, environmentMode);

    // 10. Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // 11. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera transition if target is set
      if (targetCamPosRef.current && cameraRef.current && controlsRef.current) {
        cameraRef.current.position.lerp(targetCamPosRef.current, 0.06);
        controlsRef.current.target.lerp(targetLookAtRef.current || new THREE.Vector3(0, 4, 0), 0.06);

        if (cameraRef.current.position.distanceTo(targetCamPosRef.current) < 0.2) {
          targetCamPosRef.current = null;
          targetLookAtRef.current = null;
        }
      }

      controls.update();

      // Pulse animated objects (pulses, beacon lights, scan lines, thermal radiant halos)
      animatedObjectsRef.current.forEach((obj) => {
        if (obj.userData.animatePulse) {
          const scale = 1 + Math.sin(elapsedTime * 4) * 0.15;
          obj.scale.set(scale, scale, scale);
        }
        if (obj.userData.animateLightPulse && obj instanceof THREE.PointLight) {
          const base = obj.userData.baseIntensity || 2.5;
          obj.intensity = base + Math.sin(elapsedTime * 5) * 0.6;
        }
        if (obj.userData.rotateY) {
          obj.rotation.y += delta * obj.userData.rotateY;
        }
        if (obj.userData.animateOffset) {
          obj.position.y = obj.userData.initialY + Math.sin(elapsedTime * 3) * 0.4;
        }
        if (obj.userData.flowOffset && (obj as any).material?.map) {
          (obj as any).material.map.offset.x -= delta * 0.8;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Update Materials / Shaders on Spectrum or Environment Change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    applySpectrumToScene(scene, spectrum, currentStep, environmentMode);
  }, [spectrum, currentStep, environmentMode]);

  // Focus Camera when Step Changes or Asset is Selected
  useEffect(() => {
    if (selectedAsset) {
      const [x, y, z] = selectedAsset.position;
      targetCamPosRef.current = new THREE.Vector3(x + 14, y + 10, z + 16);
      targetLookAtRef.current = new THREE.Vector3(x, y + 2, z);
    } else if (currentStep) {
      const [cx, cy, cz] = currentStep.cameraPosition;
      const [tx, ty, tz] = currentStep.cameraTarget;
      targetCamPosRef.current = new THREE.Vector3(cx, cy, cz);
      targetLookAtRef.current = new THREE.Vector3(tx, ty, tz);
    }
  }, [currentStep, selectedAsset]);

  // Handle Raycasting / Click
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    if (!container || !camera || !scene) return;

    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / container.clientWidth) * 2 - 1,
      -((event.clientY - rect.top) / container.clientHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const clickableObjects: THREE.Object3D[] = [];
    assetMeshesRef.current.forEach((group) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          clickableObjects.push(child);
        }
      });
    });

    const intersects = raycaster.intersectObjects(clickableObjects, false);
    if (intersects.length > 0) {
      let topGroup: THREE.Object3D | null = intersects[0].object;
      while (topGroup && !topGroup.userData.assetId && topGroup.parent) {
        topGroup = topGroup.parent;
      }
      if (topGroup?.userData.assetId) {
        const found = SPATIAL_ASSETS.find((a) => a.id === topGroup.userData.assetId);
        if (found) {
          onSelectAsset(found);
        }
      }
    }
  };

  // Pointer Move for Hover Tooltip
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    if (!container || !camera) return;

    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / container.clientWidth) * 2 - 1,
      -((event.clientY - rect.top) / container.clientHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const clickableObjects: THREE.Object3D[] = [];
    assetMeshesRef.current.forEach((group) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) clickableObjects.push(child);
      });
    });

    const intersects = raycaster.intersectObjects(clickableObjects, false);
    if (intersects.length > 0) {
      let topGroup: THREE.Object3D | null = intersects[0].object;
      while (topGroup && !topGroup.userData.assetId && topGroup.parent) {
        topGroup = topGroup.parent;
      }
      if (topGroup?.userData.assetId) {
        const found = SPATIAL_ASSETS.find((a) => a.id === topGroup.userData.assetId);
        setHoveredAsset(found || null);
        container.style.cursor = "pointer";
        return;
      }
    }
    setHoveredAsset(null);
    container.style.cursor = "default";
  };

  return (
    <div
      className={`relative w-full h-full select-none overflow-hidden transition-colors duration-500 ${
        spectrum === "heat"
          ? "bg-[#070618]"
          : spectrum === "xray" || spectrum === "night" || environmentMode === "night"
          ? "bg-slate-950"
          : "bg-[#bde0fe]"
      }`}
    >
      {/* 3D Canvas Canvas Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating Hover Indicator Badge */}
      {hoveredAsset && (
        <div className="pointer-events-none absolute top-4 left-4 z-20 flex items-center gap-2.5 rounded-lg border border-cyan-500/30 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 text-xs text-slate-100 shadow-xl shadow-cyan-950/40">
          <div
            className={`size-2.5 rounded-full ${
              hoveredAsset.status === "ACTIVE_WORK"
                ? "bg-amber-400 animate-pulse"
                : hoveredAsset.status === "ANOMALY"
                ? "bg-red-500 animate-ping"
                : "bg-emerald-400"
            }`}
          />
          <div>
            <div className="font-semibold text-slate-100 flex items-center gap-2">
              <span>{hoveredAsset.name}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                {hoveredAsset.code}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{hoveredAsset.categoryLabel}</span>
              <span>•</span>
              <span className="font-mono text-cyan-300">
                {spectrum === "heat"
                  ? `${hoveredAsset.thermalProfile.hotspotTempC}°C Hotspot`
                  : `${hoveredAsset.telemetry.temperatureC}°C`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   3D PROCEDURAL BUILDER HELPERS
   ========================================================================= */

function buildEnvironment(scene: THREE.Scene, environmentMode: "day" | "night" = "day") {
  const isDay = environmentMode === "day";

  // Ground Surface - modern architectural campus paving
  const groundGeo = new THREE.PlaneGeometry(160, 160);
  const groundMat = new THREE.MeshStandardMaterial({
    color: isDay ? 0xe2e8f0 : 0x0f172a, // Slate-200 paving in day, deep slate at night
    roughness: isDay ? 0.75 : 0.85,
    metalness: 0.08,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.name = "ground-plane";
  ground.userData.defaultMaterial = groundMat;
  scene.add(ground);

  // Decorative Grid Matrix
  const gridHelper = new THREE.GridHelper(
    160,
    40,
    isDay ? 0x94a3b8 : 0x0284c7,
    isDay ? 0xcbd5e1 : 0x1e293b
  );
  gridHelper.position.y = 0.02;
  gridHelper.name = "ground-grid";
  scene.add(gridHelper);

  // Main Asphalt Road Spine
  const roadMat = new THREE.MeshStandardMaterial({
    color: isDay ? 0x334155 : 0x1e293b, // Clean dark slate asphalt in day
    roughness: 0.7,
  });
  const roadSpine = new THREE.Mesh(new THREE.PlaneGeometry(12, 140), roadMat);
  roadSpine.rotation.x = -Math.PI / 2;
  roadSpine.position.set(-6, 0.05, 0);
  roadSpine.receiveShadow = true;
  roadSpine.name = "road-spine";
  roadSpine.userData.defaultMaterial = roadMat;
  scene.add(roadSpine);

  // Cross Road
  const roadCross = new THREE.Mesh(new THREE.PlaneGeometry(140, 10), roadMat);
  roadCross.rotation.x = -Math.PI / 2;
  roadCross.position.set(0, 0.04, 6);
  roadCross.receiveShadow = true;
  roadCross.name = "road-cross";
  roadCross.userData.defaultMaterial = roadMat;
  scene.add(roadCross);

  // Road Lane Dashed Markings
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  for (let z = -65; z < 65; z += 6) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 3), dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(-6, 0.06, z);
    scene.add(dash);
  }

  // Green Campus Lawns - lush emerald green in daytime
  const lawnMat = new THREE.MeshStandardMaterial({
    color: isDay ? 0x16a34a : 0x064e3b, // Vibrant emerald in day, deep pine at night
    roughness: 0.85,
  });
  const lawn1 = new THREE.Mesh(new THREE.PlaneGeometry(36, 40), lawnMat);
  lawn1.rotation.x = -Math.PI / 2;
  lawn1.position.set(22, 0.03, -16);
  lawn1.name = "lawn-1";
  lawn1.userData.defaultMaterial = lawnMat;
  scene.add(lawn1);

  const lawn2 = new THREE.Mesh(new THREE.PlaneGeometry(32, 32), lawnMat);
  lawn2.rotation.x = -Math.PI / 2;
  lawn2.position.set(-30, 0.03, -20);
  lawn2.name = "lawn-2";
  lawn2.userData.defaultMaterial = lawnMat;
  scene.add(lawn2);

  // Stylized Low-Poly Campus Trees
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const foliageMat = new THREE.MeshStandardMaterial({
    color: isDay ? 0x15803d : 0x047857,
    roughness: 0.65,
  });

  const treePositions = [
    [-16, 0, 14],
    [-20, 0, 14],
    [-16, 0, 24],
    [8, 0, 12],
    [12, 0, 12],
    [16, 0, 12],
    [10, 0, -32],
    [18, 0, -32],
  ];

  treePositions.forEach(([x, y, z], idx) => {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(x, y, z);
    treeGroup.name = `tree-${idx}`;

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 2.8, 6), trunkMat);
    trunk.position.y = 1.4;
    trunk.castShadow = true;
    trunk.userData.defaultMaterial = trunkMat;
    treeGroup.add(trunk);

    const foliage = new THREE.Mesh(new THREE.ConeGeometry(2, 4.2, 7), foliageMat);
    foliage.position.y = 4.2;
    foliage.castShadow = true;
    foliage.userData.defaultMaterial = foliageMat;
    treeGroup.add(foliage);

    scene.add(treeGroup);
  });
}

function buildThermalHotspots(scene: THREE.Scene, animatedList: THREE.Object3D[]) {
  const thermalGroup = new THREE.Group();
  thermalGroup.name = "thermal-hotspots-group";
  thermalGroup.visible = false; // Activated exclusively in thermal FLIR mode

  // 1. HB-3 Wing B Distribution Board Junction #4 (84.6°C CRITICAL HOTSPOT)
  const hb3Hotspot = new THREE.Group();
  hb3Hotspot.position.set(-13.5, 6.5, -9.8);

  const core1 = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  hb3Hotspot.add(core1);

  const flame1 = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.85 })
  );
  hb3Hotspot.add(flame1);

  const corona1 = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.45, wireframe: true })
  );
  corona1.userData.animatePulse = true;
  hb3Hotspot.add(corona1);

  const heatLight1 = new THREE.PointLight(0xff2200, 3.2, 16);
  heatLight1.userData.animateLightPulse = true;
  heatLight1.userData.baseIntensity = 3.2;
  hb3Hotspot.add(heatLight1);

  thermalGroup.add(hb3Hotspot);

  // 2. Substation Transformer T-2 Core (89.2°C PEAK ANOMALY)
  const subHotspot = new THREE.Group();
  subHotspot.position.set(35.5, 4.0, 12);

  const core2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  subHotspot.add(core2);

  const flame2 = new THREE.Mesh(
    new THREE.SphereGeometry(1.7, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.85 })
  );
  subHotspot.add(flame2);

  const corona2 = new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.4, wireframe: true })
  );
  corona2.userData.animatePulse = true;
  subHotspot.add(corona2);

  const heatLight2 = new THREE.PointLight(0xff3b00, 3.8, 18);
  heatLight2.userData.animateLightPulse = true;
  heatLight2.userData.baseIntensity = 3.8;
  subHotspot.add(heatLight2);

  thermalGroup.add(subHotspot);

  // 3. Streetlight SL-04 LED Driver & Choke (62.5°C)
  const slHotspot = new THREE.Group();
  slHotspot.position.set(-8.3, 7.8, -4);

  const core3 = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xfde047 })
  );
  slHotspot.add(core3);

  const flame3 = new THREE.Mesh(
    new THREE.SphereGeometry(1.0, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.75 })
  );
  flame3.userData.animatePulse = true;
  slHotspot.add(flame3);

  const heatLight3 = new THREE.PointLight(0xf97316, 2.0, 10);
  heatLight3.userData.animateLightPulse = true;
  heatLight3.userData.baseIntensity = 2.0;
  slHotspot.add(heatLight3);

  thermalGroup.add(slHotspot);

  animatedList.push(corona1, corona2, flame3, heatLight1, heatLight2, heatLight3);
  scene.add(thermalGroup);
}

function buildAssets(scene: THREE.Scene, assetMap: Map<string, THREE.Group>) {
  // 1. HB-3 Hall of Residence with Active Scaffolding Work Zone
  const hb3Group = new THREE.Group();
  hb3Group.userData.assetId = "asset-hb3";
  const [hbX, hbY, hbZ] = [-22, 6, -18];
  hb3Group.position.set(hbX, 0, hbZ);

  // Main Building Block (Wing A, B, C)
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // Clean modern architectural slate paneling
    roughness: 0.55,
    metalness: 0.12,
  });

  const mainWing = new THREE.Mesh(new THREE.BoxGeometry(24, 12, 14), wallMat);
  mainWing.position.y = 6;
  mainWing.castShadow = true;
  mainWing.receiveShadow = true;
  mainWing.name = "hb3-body";
  hb3Group.add(mainWing);

  // Windows grid
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.25,
    roughness: 0.1,
    metalness: 0.9,
  });

  for (let floor = 2; floor <= 10; floor += 3) {
    for (let col = -9; col <= 9; col += 3) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.8), windowMat);
      win.position.set(col, floor, 7.02);
      hb3Group.add(win);

      // Back side windows
      const winBack = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.8), windowMat);
      winBack.rotation.y = Math.PI;
      winBack.position.set(col, floor, -7.02);
      hb3Group.add(winBack);
    }
  }

  // Active Work Zone: Exterior Scaffolding Frame at Wing B (Right Face)
  const scaffoldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Construction Yellow
    wireframe: true,
  });
  const scaffold = new THREE.Mesh(new THREE.BoxGeometry(7, 13, 2.5), scaffoldMat);
  scaffold.position.set(8.5, 6.5, 8.2);
  scaffold.name = "hb3-scaffolding";
  hb3Group.add(scaffold);

  // Safety Barrier Amber Flashing Light
  const beaconGeo = new THREE.SphereGeometry(0.4, 8, 8);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.set(10.5, 13.2, 9);
  beacon.userData.animatePulse = true;
  hb3Group.add(beacon);

  scene.add(hb3Group);
  assetMap.set("asset-hb3", hb3Group);

  // 2. CVR Hall of Residence
  const cvrGroup = new THREE.Group();
  cvrGroup.userData.assetId = "asset-cvr";
  cvrGroup.position.set(24, 0, -20);

  const cvrBody = new THREE.Mesh(new THREE.BoxGeometry(22, 11, 14), wallMat.clone());
  cvrBody.position.y = 5.5;
  cvrBody.castShadow = true;
  cvrBody.receiveShadow = true;
  cvrGroup.add(cvrBody);
  scene.add(cvrGroup);
  assetMap.set("asset-cvr", cvrGroup);

  // 3. Central Substation & Transformers
  const subGroup = new THREE.Group();
  subGroup.userData.assetId = "asset-substation";
  subGroup.position.set(32, 0, 12);

  // Fencing Perimeter
  const fenceMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    wireframe: true,
  });
  const fence = new THREE.Mesh(new THREE.BoxGeometry(16, 4, 14), fenceMat);
  fence.position.y = 2;
  subGroup.add(fence);

  // Transformer T-1 (Normal)
  const transMat1 = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 });
  const trans1 = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 4), transMat1);
  trans1.position.set(-3.5, 2.5, 0);
  trans1.castShadow = true;
  subGroup.add(trans1);

  // Transformer T-2 (Active Anomaly / Work Zone)
  const transMat2 = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 });
  const trans2 = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 4), transMat2);
  trans2.position.set(3.5, 2.5, 0);
  trans2.castShadow = true;
  trans2.name = "transformer-t2";
  subGroup.add(trans2);

  // Radiator Cooling Fins on T-2
  for (let f = -1.6; f <= 1.6; f += 0.8) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.2, 5.2), transMat2);
    fin.position.set(3.5 + f, 2.5, 0);
    subGroup.add(fin);
  }

  // Red Pulsing Ring Anomaly on T-2
  const ringGeo = new THREE.RingGeometry(2.4, 2.9, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xef4444,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });
  const alertRing = new THREE.Mesh(ringGeo, ringMat);
  alertRing.rotation.x = -Math.PI / 2;
  alertRing.position.set(3.5, 5.2, 0);
  alertRing.userData.animatePulse = true;
  subGroup.add(alertRing);

  scene.add(subGroup);
  assetMap.set("asset-substation", subGroup);

  // 4. Overhead Water Tower
  const waterGroup = new THREE.Group();
  waterGroup.userData.assetId = "asset-water-tower";
  waterGroup.position.set(-26, 0, 20);

  // 4 Stilt Legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.5 });
  const legPositions = [
    [-3.5, -3.5],
    [3.5, -3.5],
    [-3.5, 3.5],
    [3.5, 3.5],
  ];
  legPositions.forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 12, 8), legMat);
    leg.position.set(lx, 6, lz);
    waterGroup.add(leg);
  });

  // Elevated Cylindrical Tank
  const tankMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7, // Clean water blue
    roughness: 0.4,
    metalness: 0.2,
  });
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 6, 24), tankMat);
  tank.position.y = 15;
  tank.castShadow = true;
  waterGroup.add(tank);

  // Conical Roof
  const tankRoof = new THREE.Mesh(new THREE.ConeGeometry(5.4, 2.2, 24), legMat);
  tankRoof.position.y = 19;
  waterGroup.add(tankRoof);

  scene.add(waterGroup);
  assetMap.set("asset-water-tower", waterGroup);

  // 5. Smart Streetlights (SL-01, SL-02, SL-04)
  const streetlightConfigs = [
    { id: "asset-sl-04", pos: [-10, 0, -4], faulty: true },
    { id: "asset-sl-01", pos: [-28, 0, 18], faulty: false },
    { id: "asset-sl-02", pos: [0, 0, 18], faulty: false },
  ];

  streetlightConfigs.forEach(({ id, pos, faulty }) => {
    const slGroup = new THREE.Group();
    slGroup.userData.assetId = id;
    slGroup.position.set(pos[0], pos[1], pos[2]);

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 8, 12), poleMat);
    pole.position.y = 4;
    pole.castShadow = true;
    slGroup.add(pole);

    // Luminaire Arm
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 0.3), poleMat);
    arm.position.set(0.9, 7.8, 0);
    slGroup.add(arm);

    // Lamp Head
    const lampMat = new THREE.MeshStandardMaterial({
      color: faulty ? 0xef4444 : 0x38bdf8,
      emissive: faulty ? 0x991b1b : 0x38bdf8,
      emissiveIntensity: faulty ? 0.2 : 0.9,
    });
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.5), lampMat);
    lamp.position.set(1.7, 7.7, 0);
    slGroup.add(lamp);

    // Downward Lux Light Cone
    const coneGeo = new THREE.ConeGeometry(3.5, 7.6, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: faulty ? 0xf97316 : 0xfef08a,
      transparent: true,
      opacity: faulty ? 0.08 : 0.25,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(1.7, 3.8, 0);
    cone.name = "light-cone";
    slGroup.add(cone);

    if (faulty) {
      // Work ladder / Scaffolding marker
      const ladderMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, wireframe: true });
      const ladder = new THREE.Mesh(new THREE.BoxGeometry(1, 7.5, 0.8), ladderMat);
      ladder.position.set(0.5, 3.75, 0.5);
      slGroup.add(ladder);
    }

    scene.add(slGroup);
    assetMap.set(id, slGroup);
  });

  // 6. Rooftop Solar Array
  const solarGroup = new THREE.Group();
  solarGroup.userData.assetId = "asset-solar-array";
  solarGroup.position.set(-22, 12.1, -18);

  const solarMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a, // Deep blue silicon PV cell
    metalness: 0.9,
    roughness: 0.1,
  });

  for (let r = -5; r <= 5; r += 2.8) {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(18, 0.2, 2.2), solarMat);
    panel.rotation.x = -0.22; // Tilted towards south sun
    panel.position.set(0, 0.6, r);
    solarGroup.add(panel);
  }

  scene.add(solarGroup);
  assetMap.set("asset-solar-array", solarGroup);
}

function buildUtilityNetworks(scene: THREE.Scene, animatedList: THREE.Object3D[]) {
  // 1. Electrical Conduit (Underground & Riser to HB-3)
  const conduitCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(32, 0.3, 12), // Substation
    new THREE.Vector3(10, 0.3, 12),
    new THREE.Vector3(-6, 0.3, 6),
    new THREE.Vector3(-14, 0.3, -4),
    new THREE.Vector3(-22, 0.3, -10),
    new THREE.Vector3(-22, 6, -10), // Climbs inside HB-3 riser!
  ]);

  const conduitGeo = new THREE.TubeGeometry(conduitCurve, 40, 0.22, 8, false);
  const conduitMat = new THREE.MeshStandardMaterial({
    color: 0xf97316, // High voltage orange
    emissive: 0xea580c,
    emissiveIntensity: 0.6,
  });
  const conduitMesh = new THREE.Mesh(conduitGeo, conduitMat);
  conduitMesh.name = "electrical-conduit-network";
  scene.add(conduitMesh);

  // 2. High-Pressure Water Pipeline from Water Tower to HB-3 and CVR
  const waterCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-26, 0.2, 20), // Water tower base
    new THREE.Vector3(-26, 0.2, 4),
    new THREE.Vector3(-22, 0.2, -6),
    new THREE.Vector3(-22, 4, -14), // HB-3 inlet
  ]);

  const waterGeo = new THREE.TubeGeometry(waterCurve, 30, 0.28, 8, false);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4, // Cyan blue water pipe
    emissive: 0x0891b2,
    emissiveIntensity: 0.5,
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.name = "water-pipeline-network";
  scene.add(waterMesh);
}

/* =========================================================================
   SPECTRUM SHADER & THEME TRANSFORMATION
   ========================================================================= */

function applySpectrumToScene(
  scene: THREE.Scene,
  spectrum: ViewSpectrum,
  step: WorkStep,
  environmentMode: "day" | "night" = "day"
) {
  const ambientLight = scene.getObjectByName("ambient-light") as THREE.AmbientLight;
  const sunLight = scene.getObjectByName("sun-light") as THREE.DirectionalLight;
  const hemiLight = scene.getObjectByName("hemi-light") as THREE.HemisphereLight;
  const ground = scene.getObjectByName("ground-plane") as THREE.Mesh;
  const groundGrid = scene.getObjectByName("ground-grid") as THREE.GridHelper;
  const lawn1 = scene.getObjectByName("lawn-1") as THREE.Mesh;
  const lawn2 = scene.getObjectByName("lawn-2") as THREE.Mesh;
  const roadSpine = scene.getObjectByName("road-spine") as THREE.Mesh;
  const roadCross = scene.getObjectByName("road-cross") as THREE.Mesh;
  const conduit = scene.getObjectByName("electrical-conduit-network") as THREE.Mesh;
  const waterPipe = scene.getObjectByName("water-pipeline-network") as THREE.Mesh;
  const thermalHotspots = scene.getObjectByName("thermal-hotspots-group") as THREE.Group;

  // Toggle thermal hotspots group (only active in Thermal FLIR mode)
  if (thermalHotspots) {
    thermalHotspots.visible = spectrum === "heat";
  }

  if (spectrum === "heat") {
    // -------------------------------------------------------------
    // ADVANCED FLIR THERMAL IRONBOW HEATMAP MODE:
    // High-contrast thermography with ambient structural absorption & radiant hotspots
    // -------------------------------------------------------------
    scene.background = new THREE.Color(0x070618); // Deep FLIR dark violet
    scene.fog = new THREE.FogExp2(0x070618, 0.005);

    if (ambientLight) {
      ambientLight.color.setHex(0x312e81);
      ambientLight.intensity = 0.55;
    }
    if (sunLight) {
      sunLight.intensity = 0.15;
    }
    if (hemiLight) {
      hemiLight.color.setHex(0x1e1b4b);
      hemiLight.groundColor.setHex(0x070618);
      hemiLight.intensity = 0.35;
    }

    if (ground && ground.material instanceof THREE.MeshStandardMaterial) {
      ground.material.color.setHex(0x090720); // Cold terrain absorption ~22°C
      ground.material.roughness = 0.95;
    }
    if (groundGrid) {
      groundGrid.visible = true;
    }
    if (lawn1 && lawn1.material instanceof THREE.MeshStandardMaterial) {
      lawn1.material.color.setHex(0x0d0928); // Cool vegetative signature ~24°C
    }
    if (lawn2 && lawn2.material instanceof THREE.MeshStandardMaterial) {
      lawn2.material.color.setHex(0x0d0928);
    }
    if (roadSpine && roadSpine.material instanceof THREE.MeshStandardMaterial) {
      roadSpine.material.color.setHex(0x17103a); // Pavement thermal mass ~29°C
    }
    if (roadCross && roadCross.material instanceof THREE.MeshStandardMaterial) {
      roadCross.material.color.setHex(0x17103a);
    }

    // Apply FLIR false-color gradient to building structures and assets
    SPATIAL_ASSETS.forEach((asset) => {
      const group = scene.children.find((c) => c.userData.assetId === asset.id);
      if (!group) return;

      const hotspotTemp = asset.thermalProfile.hotspotTempC;

      group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name !== "light-cone") {
          // Distinct heat mapping for various structural components
          if (child.name.includes("body")) {
            // Main building envelope (cooler ambient envelope 28-32°C: deep indigo to blue)
            child.material = new THREE.MeshStandardMaterial({
              color: 0x1e1b4b,
              emissive: 0x312e81,
              emissiveIntensity: 0.35,
              roughness: 0.6,
            });
          } else if (child.geometry instanceof THREE.PlaneGeometry && child.scale.y < 3) {
            // Windows: internal heat transmission through glazing (38-44°C: warm cyan to green)
            child.material = new THREE.MeshStandardMaterial({
              color: 0x06b6d4,
              emissive: 0x10b981,
              emissiveIntensity: 0.65,
              roughness: 0.3,
            });
          } else if (child.name.includes("t2") || child.parent?.name.includes("t2")) {
            // Transformer T-2 with overheating anomaly (89.2°C: blazing crimson / white-hot)
            child.material = new THREE.MeshStandardMaterial({
              color: 0xef4444,
              emissive: 0xfacc15,
              emissiveIntensity: 0.95,
              roughness: 0.2,
            });
          } else if (asset.id === "asset-water-tower") {
            // Cold water reservoir (21.8°C: deep cool azure blue)
            child.material = new THREE.MeshStandardMaterial({
              color: 0x0284c7,
              emissive: 0x0369a1,
              emissiveIntensity: 0.4,
              roughness: 0.5,
            });
          } else if (asset.id === "asset-solar-array") {
            // Solar PV heat absorption (56.4°C: warm amber/orange)
            child.material = new THREE.MeshStandardMaterial({
              color: 0xf59e0b,
              emissive: 0xd97706,
              emissiveIntensity: 0.65,
              roughness: 0.4,
            });
          } else {
            // General equipment components based on hotspot temp
            let heatHex = 0x06b6d4;
            if (hotspotTemp > 80) heatHex = 0xef4444;
            else if (hotspotTemp > 60) heatHex = 0xf97316;
            else if (hotspotTemp > 45) heatHex = 0xfacc15;
            else if (hotspotTemp > 30) heatHex = 0x10b981;

            child.material = new THREE.MeshStandardMaterial({
              color: heatHex,
              emissive: heatHex,
              emissiveIntensity: hotspotTemp > 75 ? 0.8 : 0.35,
              roughness: 0.4,
            });
          }
        }
      });
    });

    // Conduits under electrical load glow bright thermal orange-red
    if (conduit && conduit.material instanceof THREE.MeshStandardMaterial) {
      conduit.material.color.setHex(0xef4444);
      conduit.material.emissive.setHex(0xf97316);
      conduit.material.emissiveIntensity = 1.4;
      conduit.scale.set(1.15, 1.15, 1.15);
    }
    // Water pipes show cold thermal flow
    if (waterPipe && waterPipe.material instanceof THREE.MeshStandardMaterial) {
      waterPipe.material.color.setHex(0x0284c7);
      waterPipe.material.emissive.setHex(0x0369a1);
      waterPipe.material.emissiveIntensity = 0.8;
      waterPipe.scale.set(1.1, 1.1, 1.1);
    }

  } else if (spectrum === "xray") {
    // -------------------------------------------------------------
    // X-RAY / BLUEPRINT HOLOGRAPHIC MODE:
    // -------------------------------------------------------------
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, 0.005);

    if (ambientLight) {
      ambientLight.color.setHex(0xffffff);
      ambientLight.intensity = 0.85;
    }
    if (sunLight) sunLight.intensity = 0.3;
    if (hemiLight) hemiLight.intensity = 0.3;

    if (ground && ground.material instanceof THREE.MeshStandardMaterial) {
      ground.material.color.setHex(0x020617);
      ground.material.roughness = 0.95;
    }

    // Translucent holographic cyan for buildings
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (
          obj.name.includes("body") ||
          obj.parent?.userData.assetId === "asset-cvr" ||
          obj.parent?.userData.assetId === "asset-hb3"
        ) {
          obj.material = new THREE.MeshStandardMaterial({
            color: 0x0891b2,
            emissive: 0x06b6d4,
            emissiveIntensity: 0.35,
            transparent: true,
            opacity: 0.22,
            wireframe: false,
            roughness: 0.1,
          });
        }
      }
    });

    if (conduit && conduit.material instanceof THREE.MeshStandardMaterial) {
      conduit.material.emissiveIntensity = 1.4;
      conduit.material.color.setHex(0xfbbf24);
      conduit.scale.set(1.2, 1.2, 1.2);
    }
    if (waterPipe && waterPipe.material instanceof THREE.MeshStandardMaterial) {
      waterPipe.material.emissiveIntensity = 1.2;
      waterPipe.material.color.setHex(0x38bdf8);
      waterPipe.scale.set(1.2, 1.2, 1.2);
    }

  } else if (spectrum === "night" || environmentMode === "night") {
    // -------------------------------------------------------------
    // NIGHT ENVIRONMENT / LUX SENSOR MODE:
    // -------------------------------------------------------------
    scene.background = new THREE.Color(0x020617);
    scene.fog = new THREE.FogExp2(0x020617, 0.006);

    if (ambientLight) {
      ambientLight.color.setHex(0xffffff);
      ambientLight.intensity = 0.18;
    }
    if (sunLight) {
      sunLight.color.setHex(0x93c5fd);
      sunLight.intensity = 0.25; // Soft moonlight
    }
    if (hemiLight) {
      hemiLight.color.setHex(0x1e293b);
      hemiLight.groundColor.setHex(0x020617);
      hemiLight.intensity = 0.2;
    }

    if (ground && ground.material instanceof THREE.MeshStandardMaterial) {
      ground.material.color.setHex(0x0a0f1d);
      ground.material.roughness = 0.9;
    }
    if (lawn1 && lawn1.material instanceof THREE.MeshStandardMaterial) {
      lawn1.material.color.setHex(0x064e3b);
    }
    if (lawn2 && lawn2.material instanceof THREE.MeshStandardMaterial) {
      lawn2.material.color.setHex(0x064e3b);
    }

    restoreDefaultMaterials(scene);

    // Streetlight cones become luminous
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.name === "light-cone") {
        if (obj.material instanceof THREE.MeshBasicMaterial) {
          obj.material.opacity = 0.45;
        }
      }
    });

  } else {
    // -------------------------------------------------------------
    // CRISP SUNNY DAYTIME ARCHITECTURAL ENVIRONMENT (DEFAULT):
    // -------------------------------------------------------------
    scene.background = new THREE.Color(0xbde0fe); // Clear sunny sky blue
    scene.fog = new THREE.FogExp2(0xbde0fe, 0.0035); // Soft atmospheric haze

    if (ambientLight) {
      ambientLight.color.setHex(0xffffff);
      ambientLight.intensity = 0.75;
    }
    if (sunLight) {
      sunLight.color.setHex(0xfffaed); // Warm direct sunlight
      sunLight.intensity = 2.0;
    }
    if (hemiLight) {
      hemiLight.color.setHex(0xbde0fe); // Sky dome down
      hemiLight.groundColor.setHex(0x86efac); // Grass bounce up
      hemiLight.intensity = 0.75;
    }

    if (ground && ground.material instanceof THREE.MeshStandardMaterial) {
      ground.material.color.setHex(0xe2e8f0); // Clean modern architectural stone
      ground.material.roughness = 0.75;
    }
    if (lawn1 && lawn1.material instanceof THREE.MeshStandardMaterial) {
      lawn1.material.color.setHex(0x16a34a); // Lush emerald green
    }
    if (lawn2 && lawn2.material instanceof THREE.MeshStandardMaterial) {
      lawn2.material.color.setHex(0x16a34a);
    }
    if (roadSpine && roadSpine.material instanceof THREE.MeshStandardMaterial) {
      roadSpine.material.color.setHex(0x334155);
    }
    if (roadCross && roadCross.material instanceof THREE.MeshStandardMaterial) {
      roadCross.material.color.setHex(0x334155);
    }

    restoreDefaultMaterials(scene);

    if (conduit && conduit.material instanceof THREE.MeshStandardMaterial) {
      conduit.material.emissiveIntensity = 0.4;
      conduit.material.color.setHex(0xf97316);
      conduit.scale.set(1, 1, 1);
    }
    if (waterPipe && waterPipe.material instanceof THREE.MeshStandardMaterial) {
      waterPipe.material.emissiveIntensity = 0.35;
      waterPipe.material.color.setHex(0x06b6d4);
      waterPipe.scale.set(1, 1, 1);
    }

    // Streetlight cones are faint in daytime
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.name === "light-cone") {
        if (obj.material instanceof THREE.MeshBasicMaterial) {
          obj.material.opacity = 0.06;
        }
      }
    });
  }

  // Step-Specific Work Visuals (Scaffolding visibility)
  const scaffold = scene.getObjectByName("hb3-scaffolding") as THREE.Mesh;
  if (scaffold) {
    scaffold.visible = step.stepNumber >= 2 && step.stepNumber <= 4;
  }
}

function restoreDefaultMaterials(scene: THREE.Scene) {
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.userData.defaultMaterial) {
      obj.material = obj.userData.defaultMaterial;
    }
  });
}
