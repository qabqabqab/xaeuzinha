"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface Props {
  src: string;
  width?: number;
  height?: number;
}

export default function GLBViewer({ src, width = 300, height = 300 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    let animId = 0;
    let cancelled = false;

    // Remove any stale canvas from previous mount
    container.querySelectorAll("canvas").forEach(c => c.remove());

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
    dir.position.set(5, 10, 7);
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0xffffff, 0.8);
    fill.position.set(-5, -5, -5);
    scene.add(fill);

    // Interaction state
    let rotX = 0, rotY = 0, zoom = 5;
    let isDragging = false, lastX = 0, lastY = 0, lastPinchDist = 0;
    let model: THREE.Group | null = null;

    // Load GLB
    const loader = new GLTFLoader();
    loader.load(
      src,
      (gltf) => {
        if (cancelled) return;
        model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        scene.add(model);
        zoom = 4;
      },
      undefined,
      (err) => console.error("[GLBViewer] load error:", err)
    );

    // Render loop
    function animate() {
      animId = requestAnimationFrame(animate);
      if (model) {
        model.rotation.y = rotY;
        model.rotation.x = rotX;
      }
      camera.position.z = zoom;
      renderer.render(scene, camera);
    }
    animate();

    const el = renderer.domElement;

    // ── Mouse ──
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true; lastX = e.clientX; lastY = e.clientY;
      e.preventDefault();
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      rotY += (e.clientX - lastX) * 0.01;
      rotX += (e.clientY - lastY) * 0.01;
      rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotX));
      lastX = e.clientX; lastY = e.clientY;
    };
    const onMouseUp = () => { isDragging = false; };
    const onWheel = (e: WheelEvent) => {
      zoom += e.deltaY * 0.005;
      zoom = Math.max(1.5, Math.min(10, zoom));
      e.preventDefault();
    };
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    // ── Touch ──
    const onTouchStart = (e: TouchEvent) => {
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
    };
    const onTouchMove = (e: TouchEvent) => {
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
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      isDragging = false;
    };
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      cancelled = true;
      cancelAnimationFrame(animId);
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
  }, [src, width, height]);

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
