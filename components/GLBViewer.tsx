"use client";

import { useEffect, useRef } from "react";

interface Props {
  src: string;
  width?: number;
  height?: number;
}

export default function GLBViewer({ src, width = 300, height = 300 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: any;
    scene: any;
    camera: any;
    model: any;
    animId: number;
    isDragging: boolean;
    lastX: number;
    lastY: number;
    rotX: number;
    rotY: number;
    zoom: number;
    lastPinchDist: number;
    cleanup: (() => void) | null;
  }>({
    renderer: null, scene: null, camera: null, model: null,
    animId: 0, isDragging: false, lastX: 0, lastY: 0,
    rotX: 0, rotY: 0, zoom: 5, lastPinchDist: 0, cleanup: null,
  });

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const s = stateRef.current;

    // Dynamically import Three.js + GLTFLoader from CDN
    const script1 = document.createElement("script");
    script1.type = "importmap";
    // Check if importmap already exists (avoid duplicate)
    if (!document.querySelector('script[type="importmap"]')) {
      script1.textContent = JSON.stringify({
        imports: {
          "three": "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js",
          "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/"
        }
      });
      document.head.appendChild(script1);
    }

    const script2 = document.createElement("script");
    script2.type = "module";
    script2.textContent = `
      import * as THREE from 'three';
      import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

      const container = document.getElementById('glb-viewer-mount');
      if (!container || container.dataset.initialized) return;
      container.dataset.initialized = 'true';

      const W = ${width}, H = ${height};

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(W, H);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);

      // Scene
      const scene = new THREE.Scene();

      // Camera
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 1000);
      camera.position.set(0, 0, 5);

      // Lights
      const ambient = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambient);
      const dirLight = new THREE.DirectionalLight(0xffffff, 2);
      dirLight.position.set(5, 10, 7);
      scene.add(dirLight);
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
      fillLight.position.set(-5, -5, -5);
      scene.add(fillLight);

      // State
      let model = null;
      let rotX = 0, rotY = 0, zoom = 5;
      let isDragging = false, lastX = 0, lastY = 0, lastPinchDist = 0;

      // Load GLB
      const loader = new GLTFLoader();
      loader.load('${src}', (gltf) => {
        model = gltf.scene;

        // Auto-center and scale
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));

        scene.add(model);
        zoom = 4;
        camera.position.set(0, 0, zoom);
      }, undefined, (err) => console.error('[GLBViewer] load error', err));

      // Animate
      function animate() {
        requestAnimationFrame(animate);
        if (model) {
          model.rotation.y = rotY;
          model.rotation.x = rotX;
        }
        camera.position.z = zoom;
        renderer.render(scene, camera);
      }
      animate();

      // Pointer events — mouse
      renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true; lastX = e.clientX; lastY = e.clientY;
        e.preventDefault();
      }, { passive: false });
      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        rotY += (e.clientX - lastX) * 0.01;
        rotX += (e.clientY - lastY) * 0.01;
        rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
        lastX = e.clientX; lastY = e.clientY;
      });
      window.addEventListener('mouseup', () => { isDragging = false; });
      renderer.domElement.addEventListener('wheel', (e) => {
        zoom += e.deltaY * 0.005;
        zoom = Math.max(1.5, Math.min(10, zoom));
        e.preventDefault();
      }, { passive: false });

      // Touch events
      renderer.domElement.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.touches.length === 1) {
          isDragging = true;
          lastX = e.touches[0].clientX;
          lastY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          isDragging = false;
          lastPinchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      }, { passive: false });

      renderer.domElement.addEventListener('touchmove', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.touches.length === 1 && isDragging) {
          rotY += (e.touches[0].clientX - lastX) * 0.012;
          rotX += (e.touches[0].clientY - lastY) * 0.012;
          rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
          lastX = e.touches[0].clientX;
          lastY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          zoom -= (dist - lastPinchDist) * 0.01;
          zoom = Math.max(1.5, Math.min(10, zoom));
          lastPinchDist = dist;
        }
      }, { passive: false });

      renderer.domElement.addEventListener('touchend', (e) => {
        e.preventDefault();
        isDragging = false;
      }, { passive: false });
    `;
    document.head.appendChild(script2);

    return () => {
      // cleanup: remove canvas if re-mounting
      const canvas = container.querySelector("canvas");
      if (canvas) canvas.remove();
      delete (container as any).dataset.initialized;
    };
  }, [src]);

  return (
    <div
      id="glb-viewer-mount"
      ref={mountRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: "24px",
        overflow: "hidden",
        background: "rgba(255,255,255,0.05)",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    />
  );
}
