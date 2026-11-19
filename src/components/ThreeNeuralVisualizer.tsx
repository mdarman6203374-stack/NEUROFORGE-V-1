import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Sparkles, Eye, RotateCw, Pause, Play, Layers, Maximize2, Zap, Info, Grid3X3 } from 'lucide-react';
import { Language } from '../types';
import { AttentionHeatmapExplorer } from './AttentionHeatmapExplorer';

interface ThreeNeuralVisualizerProps {
  language: Language;
}

export const ThreeNeuralVisualizer: React.FC<ThreeNeuralVisualizerProps> = ({ language }) => {
  const [visualMode, setVisualMode] = useState<'3d-core' | 'attention-heatmap'>('3d-core');
  const mountRef = useRef<HTMLDivElement>(null);

  // Floating dock control states
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [explodeLayers, setExplodeLayers] = useState<boolean>(false);
  const [activeHead, setActiveHead] = useState<number>(0);
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);

  const sceneStateRef = useRef({
    isRotating: true,
    explodeLayers: false,
    activeHead: 0,
    wireframeMode: false,
    targetRotationY: 0,
    currentRotationY: 0,
    cameraDist: 14,
    targetCameraDist: 14,
  });

  // Sync ref with states for smooth 60fps animation loop without re-instantiating WebGL
  useEffect(() => {
    sceneStateRef.current.isRotating = isRotating;
    sceneStateRef.current.explodeLayers = explodeLayers;
    sceneStateRef.current.activeHead = activeHead;
    sceneStateRef.current.wireframeMode = wireframeMode;
  }, [isRotating, explodeLayers, activeHead, wireframeMode]);

  useEffect(() => {
    if (visualMode !== '3d-core') return;
    const container = mountRef.current;
    if (!container) return;

    // 1. Software-WebGL Guard (Skill Rule)
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Three.js Scene, Camera, Renderer
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 5, 14);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Studio PBR Environment Reflection via PMREMGenerator & RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x818cf8, 0x0f172a, 1.2);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.5);
    keyLight.position.set(8, 12, 8);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.shadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 25;
      keyLight.shadow.camera.left = -7;
      keyLight.shadow.camera.right = 7;
      keyLight.shadow.camera.top = 7;
      keyLight.shadow.camera.bottom = -7;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-8, 6, -6);
    scene.add(rimLight);

    // 5. Procedural Textures (Zero 404 URLs rule)
    // Procedural Contact Shadow Texture
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const shadowCtx = shadowCanvas.getContext('2d')!;
    const shadowGrad = shadowCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0.85)');
    shadowGrad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    shadowCtx.fillStyle = shadowGrad;
    shadowCtx.fillRect(0, 0, 256, 256);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);

    // Procedural Circuit Bump Map
    const circuitCanvas = document.createElement('canvas');
    circuitCanvas.width = 256;
    circuitCanvas.height = 256;
    const circuitCtx = circuitCanvas.getContext('2d')!;
    circuitCtx.fillStyle = '#222';
    circuitCtx.fillRect(0, 0, 256, 256);
    circuitCtx.strokeStyle = '#888';
    circuitCtx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      circuitCtx.beginPath();
      circuitCtx.moveTo(0, i * 22);
      circuitCtx.lineTo(60, i * 22);
      circuitCtx.lineTo(90, i * 22 + 15);
      circuitCtx.lineTo(256, i * 22 + 15);
      circuitCtx.stroke();
    }
    const circuitTexture = new THREE.CanvasTexture(circuitCanvas);
    circuitTexture.wrapS = THREE.RepeatWrapping;
    circuitTexture.wrapT = THREE.RepeatWrapping;
    circuitTexture.repeat.set(2, 2);

    // 6. Ground Pedestal with Soft Radial Shadow (Pivoted at ground level)
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, 0, 0);

    const shadowGeo = new THREE.PlaneGeometry(12, 12);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.01;
    pedestalGroup.add(shadowMesh);

    const baseRingGeo = new THREE.CylinderGeometry(4.2, 4.4, 0.25, 48);
    const baseRingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.2,
      bumpMap: circuitTexture,
      bumpScale: 0.02,
    });
    const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
    baseRing.position.y = 0.125;
    baseRing.receiveShadow = !isSoftwareGl;
    pedestalGroup.add(baseRing);
    scene.add(pedestalGroup);

    // 7. Composite 3-12 Part Procedural Hero Model: "Transformer Attention Engine" (THREE.Group)
    const heroGroup = new THREE.Group();
    heroGroup.position.set(0, 0.25, 0);

    // Part 1: Primary Silhouette — Embedding Vector Core Column
    const coreColumnGeo = new THREE.CylinderGeometry(1.2, 1.2, 3.8, 32);
    const coreColumnMat = new THREE.MeshStandardMaterial({
      color: 0x312e81,
      metalness: 0.3,
      roughness: 0.65, // Contrast roughness rule
      wireframe: false,
    });
    const coreColumn = new THREE.Mesh(coreColumnGeo, coreColumnMat);
    coreColumn.position.y = 2.0;
    coreColumn.castShadow = !isSoftwareGl;
    heroGroup.add(coreColumn);

    // Part 2: Primary Silhouette — Multi-Head Lathe Torus Attention Halo
    const haloGeo = new THREE.TorusGeometry(2.4, 0.18, 16, 64);
    const haloMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber Gold
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0xd97706,
      emissiveIntensity: 0.35,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = Math.PI / 2;
    haloMesh.position.y = 2.0;
    heroGroup.add(haloMesh);

    // Part 3: Secondary Read — Feed-Forward Highway Ring (Upper Accent)
    const ffnRingGeo = new THREE.TorusGeometry(1.8, 0.1, 16, 48);
    const ffnRingMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Cyan
      metalness: 0.7,
      roughness: 0.25,
      emissive: 0x0891b2,
      emissiveIntensity: 0.4,
    });
    const ffnRing = new THREE.Mesh(ffnRingGeo, ffnRingMat);
    ffnRing.rotation.x = Math.PI / 2;
    ffnRing.position.y = 3.6;
    heroGroup.add(ffnRing);

    // Parts 4, 5, 6: Secondary Read — Q, K, V Orthogonal Satellite Node Orbs
    const qkvGroup = new THREE.Group();
    qkvGroup.position.y = 2.0;

    const nodeColors = [0x6366f1, 0x10b981, 0xf43f5e]; // Q (Indigo), K (Emerald), V (Rose)
    const nodeLabels = ['Query (Q)', 'Key (K)', 'Value (V)'];
    const nodes: THREE.Mesh[] = [];

    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const radius = 2.8;

      const nodePart = new THREE.Group();
      nodePart.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);

      // Main Satellite Sphere
      const sphereGeo = new THREE.SphereGeometry(0.45, 24, 24);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: nodeColors[i],
        metalness: 0.85,
        roughness: 0.15,
        emissive: nodeColors[i],
        emissiveIntensity: 0.45,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.castShadow = !isSoftwareGl;
      nodePart.add(sphere);

      // Part 7, 8, 9: Accent Detail — Equatorial Orbit Ring on each node
      const miniRingGeo = new THREE.TorusGeometry(0.6, 0.04, 12, 32);
      const miniRingMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.95,
        roughness: 0.1,
      });
      const miniRing = new THREE.Mesh(miniRingGeo, miniRingMat);
      miniRing.rotation.x = Math.PI / 3;
      nodePart.add(miniRing);

      qkvGroup.add(nodePart);
      nodes.push(sphere);
    }
    heroGroup.add(qkvGroup);

    // Part 10 & 11: Accent Detail — Synapse Attention Curves (TubeGeometry Splines)
    const curvePoints1 = [
      new THREE.Vector3(0, 0.8, 0),
      new THREE.Vector3(1.5, 1.4, 1.2),
      new THREE.Vector3(2.8 * Math.cos(0), 2.0, 2.8 * Math.sin(0)),
    ];
    const spline1 = new THREE.CatmullRomCurve3(curvePoints1);
    const tubeGeo1 = new THREE.TubeGeometry(spline1, 32, 0.04, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      metalness: 0.4,
      roughness: 0.2,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.5,
    });
    const tubeMesh1 = new THREE.Mesh(tubeGeo1, tubeMat);
    heroGroup.add(tubeMesh1);

    // Part 12: Accent Detail — Floating Glowing Attention Particles (InstancedMesh)
    const particleCount = 40;
    const particleGeo = new THREE.DodecahedronGeometry(0.08, 0);
    const particleMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });
    const instancedParticles = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
    const dummy = new THREE.Object3D();
    const particleAngles: number[] = [];
    const particleRadii: number[] = [];
    const particleHeights: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const rad = 1.6 + Math.random() * 1.8;
      const h = 0.5 + Math.random() * 3.2;
      particleAngles.push(angle);
      particleRadii.push(rad);
      particleHeights.push(h);

      dummy.position.set(Math.cos(angle) * rad, h, Math.sin(angle) * rad);
      dummy.scale.setScalar(0.7 + Math.random() * 0.6);
      dummy.updateMatrix();
      instancedParticles.setMatrixAt(i, dummy.matrix);
    }
    instancedParticles.instanceMatrix.needsUpdate = true;
    heroGroup.add(instancedParticles);

    scene.add(heroGroup);

    // 8. Damped Camera & Lossless 60fps Animation Loop with Scratch Objects
    let animationFrameId: number;
    let clock = new THREE.Clock();

    // Interaction mouse drag
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isMouseDown = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isMouseDown) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;
      prevMouseX = clientX;
      prevMouseY = clientY;

      sceneStateRef.current.targetRotationY += deltaX * 0.007;
      sceneStateRef.current.cameraDist = Math.max(7, Math.min(22, sceneStateRef.current.cameraDist + deltaY * 0.02));
    };

    const onPointerUp = () => {
      isMouseDown = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onPointerDown);
    domElement.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    domElement.addEventListener('touchstart', onPointerDown, { passive: true });
    domElement.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 600;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', onResize);

    // Render loop
    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);
      const dt = clock.getDelta();
      const time = clock.getElapsedTime();

      // Exponential damping on rotation and camera
      const k = 10;
      const factor = 1 - Math.exp(-k * dt);

      if (sceneStateRef.current.isRotating && !isMouseDown) {
        sceneStateRef.current.targetRotationY += dt * 0.45;
      }

      sceneStateRef.current.currentRotationY +=
        (sceneStateRef.current.targetRotationY - sceneStateRef.current.currentRotationY) * factor;
      heroGroup.rotation.y = sceneStateRef.current.currentRotationY;

      // Exploded Layer Animation Mode
      const explodeTarget = sceneStateRef.current.explodeLayers ? 1.8 : 0;
      ffnRing.position.y += (3.6 + explodeTarget * 0.8 - ffnRing.position.y) * factor;
      coreColumn.position.y += (2.0 + explodeTarget * 0.4 - coreColumn.position.y) * factor;

      // Halo breathing rotation
      haloMesh.rotation.z += dt * 0.5;
      haloMesh.rotation.y = Math.sin(time * 1.5) * 0.15;

      // QKV Orbit rotation
      qkvGroup.rotation.y -= dt * 0.35;

      // Active head emphasis
      const headIdx = sceneStateRef.current.activeHead;
      nodes.forEach((n, idx) => {
        const mat = n.material as THREE.MeshStandardMaterial;
        if (headIdx === 0 || headIdx - 1 === idx) {
          mat.emissiveIntensity = 0.5 + Math.sin(time * 4) * 0.2;
        } else {
          mat.emissiveIntensity = 0.15;
        }
      });

      // Wireframe toggle
      const wf = sceneStateRef.current.wireframeMode;
      coreColumnMat.wireframe = wf;
      haloMat.wireframe = wf;
      baseRingMat.wireframe = wf;

      // Particles gentle orbit flow
      for (let i = 0; i < particleCount; i++) {
        particleAngles[i] += dt * (0.3 + (i % 3) * 0.1);
        const rad = particleRadii[i];
        const h = particleHeights[i] + Math.sin(time * 2 + i) * 0.15;
        dummy.position.set(Math.cos(particleAngles[i]) * rad, h, Math.sin(particleAngles[i]) * rad);
        dummy.rotation.x += dt * 0.5;
        dummy.rotation.y += dt * 0.3;
        dummy.updateMatrix();
        instancedParticles.setMatrixAt(i, dummy.matrix);
      }
      instancedParticles.instanceMatrix.needsUpdate = true;

      // Damped camera distance
      camera.position.z += (sceneStateRef.current.cameraDist - camera.position.z) * factor;
      camera.lookAt(0, 2.0, 0);

      renderer.render(scene, camera);
    };

    renderLoop();

    // Cleanup resources (Skill Rule)
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
      domElement.removeEventListener('mousedown', onPointerDown);
      domElement.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      domElement.removeEventListener('touchstart', onPointerDown);
      domElement.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);

      coreColumnGeo.dispose();
      coreColumnMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      ffnRingGeo.dispose();
      ffnRingMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTexture.dispose();
      circuitTexture.dispose();
      baseRingGeo.dispose();
      baseRingMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();

      renderer.dispose();
      if (domElement.parentElement) {
        domElement.parentElement.removeChild(domElement);
      }
    };
  }, [visualMode]);

  if (visualMode === 'attention-heatmap') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Visual Intuition Studio</span>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setVisualMode('3d-core')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3D Transformer Core</span>
            </button>
            <button
              type="button"
              onClick={() => setVisualMode('attention-heatmap')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white shadow-xs cursor-pointer"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Attention Heatmap & BPE Explorer</span>
            </button>
          </div>
        </div>
        <AttentionHeatmapExplorer language={language} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
          <Layers className="w-4 h-4 text-indigo-500" />
          <span>Visual Intuition Studio</span>
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setVisualMode('3d-core')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3D Transformer Core</span>
          </button>
          <button
            type="button"
            onClick={() => setVisualMode('attention-heatmap')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            <span>Attention Heatmap & BPE Explorer</span>
          </button>
        </div>
      </div>

      <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
        {/* 3D WebGL Canvas Container */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Banner Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-xs text-white shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-bold">Transformer 3D Neural Architecture Core</span>
          <span className="text-slate-400 text-[10px]">· PBR Three.js Engine</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5 pl-1 drop-shadow">
          {language === 'hinglish'
            ? 'Drag mouse to rotate. Inspect Self-Attention Halo, Q-K-V Satellites, and Residual Highway.'
            : 'Drag mouse to inspect 3D Attention Halo, Q-K-V Orbs, and Feed-Forward Highway.'}
        </p>
      </div>

      {/* Viewport-First Compact Floating Control Dock (<= 15% footprint rule) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 p-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white shadow-2xl text-xs max-w-[260px]">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>3D Controls</span>
          </span>
          <span className="font-mono text-[10px] text-emerald-400">60 FPS PBR</span>
        </div>

        {/* Rotation & Explode Toggles */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer ${
              isRotating ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {isRotating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isRotating ? 'Pause' : 'Rotate'}</span>
          </button>

          <button
            onClick={() => setExplodeLayers(!explodeLayers)}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer ${
              explodeLayers ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Maximize2 className="w-3 h-3" />
            <span>{explodeLayers ? 'Collapsed' : 'Explode'}</span>
          </button>
        </div>

        {/* Q-K-V Node Highlight */}
        <div className="space-y-1 pt-1 border-t border-slate-800/80">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Highlight Attention Head:</span>
            <span className="font-mono font-bold text-indigo-400">
              {activeHead === 0 ? 'All' : activeHead === 1 ? 'Query' : activeHead === 2 ? 'Key' : 'Value'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {['All', 'Q', 'K', 'V'].map((label, idx) => (
              <button
                key={label}
                onClick={() => setActiveHead(idx)}
                className={`py-1 text-[10px] font-mono rounded font-semibold transition-colors cursor-pointer ${
                  activeHead === idx
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Wireframe toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
          <span className="text-slate-400">Topology Wireframe:</span>
          <button
            onClick={() => setWireframeMode(!wireframeMode)}
            className={`px-2 py-0.5 rounded font-mono font-bold cursor-pointer ${
              wireframeMode ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {wireframeMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
