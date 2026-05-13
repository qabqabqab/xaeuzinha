"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface Props {
  src: string;
  width?: number;
  height?: number;
}

// Holds all Three.js state — lives outside React lifecycle
interface ThreeInstance {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  animId: number;
  model: THREE.Group | null;
  rotX: number; rotY: number; zoom: number;
  isDragging: boolean; lastX: number; lastY: number; lastPinchDist: number;
  dispose: () => void;
}

function createThreeInstance(container: HTMLDivElement, src: string, width: number, height: number): ThreeInstance {
  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // Scene + Camera
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
  camera.position.set(0, 0, 5);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const dir = new THREE.DirectionalLight(0xffffff, 2);
  dir.position.set(5, 10, 7); scene.add(dir);
  const fill = new THREE.DirectionalLight(0xffffff, 0.8);
  fill.position.set(-5, -5, -5); scene.add(fill);

  const inst: ThreeInstance = {
    renderer, scene, camera, animId: 0, model: null,
    rotX: 0, rotY: 0, zoom: 5,
    isDragging: false, lastX: 0, lastY: 0, lastPinchDist: 0,
    dispose: () => {},
  };

  // Load GLB
  const loader = new GLTFLoader();
  loader.load(src, (gltf) => {
    inst.model = gltf.scene;
    const box = new THREE.Box3().setFromObject(inst.model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.5 / maxDim;
    inst.model.scale.setScalar(scale);
    inst.model.position.sub(center.multiplyScalar(scale));
    scene.add(inst.model);
    inst.zoom = 4;
  }, undefined, (err) => console.error("[GLBViewer]", err));

  // Render loop
  function animate() {
    inst.animId = requestAnimationFrame(animate);
    if (inst.model) {
      inst.model.rotation.y = inst.rotY;
      inst.model.rotation.x = inst.rotX;
    }
    camera.position.z = inst.zoom;
    renderer.render(scene, camera);
  }
  animate();

  const el = renderer.domElement;

  // ── Mouse ──
  const onMouseDown = (e: MouseEvent) => {
    inst.isDragging = true; inst.lastX = e.clientX; inst.lastY = e.clientY;
    e.preventDefault();
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!inst.isDragging) return;
    inst.rotY += (e.clientX - inst.lastX) * 0.01;
    inst.rotX += (e.clientY - inst.lastY) * 0.01;
    inst.rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, inst.rotX));
    inst.lastX = e.clientX; inst.lastY = e.clientY;
  };
  const onMouseUp = () => { inst.isDragging = false; };
  const onWheel = (e: WheelEvent) => {
    inst.zoom += e.deltaY * 0.005;
    inst.zoom = Math.max(1.5, Math.min(10, inst.zoom));
    e.preventDefault();
  };
  el.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  el.addEventListener("wheel", onWheel, { passive: false });

  // ── Touch ──
  const onTouchStart = (e: TouchEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.touches.length === 1) {
      inst.isDragging = true;
      inst.lastX = e.touches[0].clientX; inst.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      inst.isDragging = false;
      inst.lastPinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  };
  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.touches.length === 1 && inst.isDragging) {
      inst.rotY += (e.touches[0].clientX - inst.lastX) * 0.012;
      inst.rotX += (e.touches[0].clientY - inst.lastY) * 0.012;
      inst.rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, inst.rotX));
      inst.lastX = e.touches[0].clientX; inst.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      inst.zoom -= (dist - inst.lastPinchDist) * 0.01;
      inst.zoom = Math.max(1.5, Math.min(10, inst.zoom));
      inst.lastPinchDist = dist;
    }
  };
  const onTouchEnd = (e: TouchEvent) => {
    e.preventDefault(); inst.isDragging = false;
  };
  el.addEventListener("touchstart", onTouchStart, { passive: false });
  el.addEventListener("touchmove", onTouchMove, { passive: false });
  el.addEventListener("touchend", onTouchEnd, { passive: false });

  inst.dispose = () => {
    cancelAnimationFrame(inst.animId);
    el.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
    el.removeEventListener("wheel", onWheel);
    el.removeEventListener("touchstart", onTouchStart);
    el.removeEventListener("touchmove", onTouchMove);
    el.removeEventListener("touchend", onTouchEnd);
    renderer.dispose();
    container.querySelectorAll("canvas").forEach(c => c.remove());
  };

  return inst;
}

export default function GLBViewer({ src, width = 300, height = 300 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  // Keep Three.js instance in a ref — survives React StrictMode double-invoke
  const instRef = useRef<ThreeInstance | null>(null);
  // Track whether we're truly mounted (not just StrictMode first-pass)
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // StrictMode calls useEffect twice — only init once per real mount
    if (mountedRef.current && instRef.current) return;
    mountedRef.current = true;

    // Clean up any previous instance (e.g. src changed)
    if (instRef.current) {
      instRef.current.dispose();
      instRef.current = null;
    }

    instRef.current = createThreeInstance(mountRef.current, src, width, height);

    // No cleanup return — we manage lifecycle manually via instRef
    // This prevents StrictMode from destroying the instance on first unmount
  }, [src, width, height]);

  // Only truly dispose when the component is removed from the DOM for real
  useEffect(() => {
    return () => {
      // This runs on actual unmount (page navigation, component removal)
      // In StrictMode it runs first, but mountedRef guards re-init
      if (instRef.current) {
        instRef.current.dispose();
        instRef.current = null;
      }
      mountedRef.current = false;
    };
  }, []);

  return (
    <div
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
        cursor: "grab",
      }}
    />
  );
}
