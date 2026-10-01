"use client";

import { useEffect, useRef } from "react";
import {
  Camera,
  LinearFilter,
  Mesh,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  Timer,
  Vector2,
  WebGLRenderer,
} from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uImage;
  uniform vec2 uResolution;
  uniform vec2 uImageSize;
  uniform vec2 uRippleOrigins[7];
  uniform float uRippleAges[7];
  uniform float uRippleStrengths[7];
  uniform vec2 uHoverOrigin;
  uniform float uHoverActive;
  uniform float uTime;
  uniform float uRightAligned;
  varying vec2 vUv;

  vec2 imageUv(vec2 screenUv) {
    float screenAspect = uResolution.x / uResolution.y;
    float imageAspect = uImageSize.x / uImageSize.y;
    vec2 uv = screenUv;
    if (uRightAligned > 0.5) {
      float visibleWidth = uResolution.x / (uResolution.y * imageAspect);
      uv.x = 1.0 - (1.0 - screenUv.x) * visibleWidth;
    } else if (screenAspect > imageAspect) {
      float visibleHeight = imageAspect / screenAspect;
      uv.y = (screenUv.y - 0.5) * visibleHeight + 0.5;
    } else {
      float visibleWidth = screenAspect / imageAspect;
      uv.x = (screenUv.x - 0.5) * visibleWidth + 0.5;
    }
    return uv;
  }

  void main() {
    vec2 screenUv = vUv;

    // Quiet glass-water drift across the full panorama.
    screenUv.x += sin(screenUv.y * 13.0 + uTime * 0.34) * 0.00032;
    screenUv.y += cos(screenUv.x * 10.0 + uTime * 0.28) * 0.00020;

    // A light breeze only in the upper-right canopy; the trunk stays still.
    float canopy = smoothstep(0.66, 0.82, screenUv.x) * smoothstep(0.48, 0.72, screenUv.y);
    screenUv.x += canopy * sin(uTime * 0.72 + screenUv.y * 19.0) * 0.00135;
    screenUv.y += canopy * cos(uTime * 0.58 + screenUv.x * 17.0) * 0.00052;

    // A small pool of overlapping ripples supports hover wakes and drag trails.
    float aspect = uResolution.x / uResolution.y;

    // A persistent local shimmer makes the hover interaction immediately legible.
    if (uHoverActive > 0.5) {
      vec2 hoverDelta = screenUv - uHoverOrigin;
      hoverDelta.x *= aspect;
      float hoverDistance = length(hoverDelta);
      float hoverRing = sin(hoverDistance * 74.0 - uTime * 3.8);
      hoverRing *= exp(-hoverDistance * 7.2);
      vec2 hoverDirection = normalize(hoverDelta + vec2(0.00001));
      hoverDirection.x /= aspect;
      screenUv += hoverDirection * hoverRing * 0.00235;
    }

    for (int i = 0; i < 7; i++) {
      float age = uRippleAges[i];
      if (age >= 0.0 && age < 3.6) {
        vec2 delta = screenUv - uRippleOrigins[i];
        delta.x *= aspect;
        float distanceFromOrigin = length(delta);
        float radius = age * 0.19;
        float ring = sin((distanceFromOrigin - radius) * 86.0);
        ring *= exp(-abs(distanceFromOrigin - radius) * 20.0);
        ring *= exp(-age * 0.78) * uRippleStrengths[i];
        vec2 direction = normalize(delta + vec2(0.00001));
        direction.x /= aspect;
        screenUv += direction * ring * 0.0052;
      }
    }

    gl_FragColor = texture2D(uImage, imageUv(screenUv));
  }
`;

export function HeroWaterScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    const scene = new Scene();
    const camera = new Camera();
    const texture = new TextureLoader().load("/images/cinematic-hero.png");
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;

    const uniforms = {
      uImage: { value: texture },
      uResolution: { value: new Vector2(1, 1) },
      uImageSize: { value: new Vector2(2172, 724) },
      uRippleOrigins: { value: Array.from({ length: 7 }, () => new Vector2(0.5, 0.5)) },
      uRippleAges: { value: Array(7).fill(99) as number[] },
      uRippleStrengths: { value: Array(7).fill(0) as number[] },
      uHoverOrigin: { value: new Vector2(0.5, 0.5) },
      uHoverActive: { value: 0 },
      uTime: { value: 0 },
      uRightAligned: { value: 0 },
    };

    const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader });
    const mesh = new Mesh(new PlaneGeometry(2, 2), material);
    scene.add(mesh);
    const timer = new Timer();
    timer.connect(document);
    const rippleStartedAt = Array(7).fill(-99) as number[];
    let nextTrailRipple = 1;
    let frame = 0;
    let pointerDown = false;
    let lastEmitTime = -Infinity;
    let lastEmitX = -Infinity;
    let lastEmitY = -Infinity;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      uniforms.uResolution.value.set(rect.width, rect.height);
      const rightAlignedArtwork = window.innerWidth < 1024 || (window.innerWidth < 1180 && window.innerHeight < 700);
      uniforms.uRightAligned.value = rightAlignedArtwork ? 1 : 0;
    };

    const emitRipple = (event: PointerEvent, strength: number, requestedSlot?: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = 1 - (event.clientY - rect.top) / rect.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      const slot = requestedSlot ?? nextTrailRipple;
      uniforms.uRippleOrigins.value[slot].set(x, y);
      uniforms.uRippleStrengths.value[slot] = strength;
      rippleStartedAt[slot] = timer.getElapsed();
      if (requestedSlot === undefined) nextTrailRipple = nextTrailRipple >= 6 ? 1 : nextTrailRipple + 1;
      lastEmitTime = event.timeStamp;
      lastEmitX = event.clientX;
      lastEmitY = event.clientY;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if ((event.target as HTMLElement).closest("a, button")) return;
      pointerDown = true;
      emitRipple(event, 1, 0);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && !pointerDown) return;
      const rect = canvas.getBoundingClientRect();
      const hoverX = (event.clientX - rect.left) / rect.width;
      const hoverY = 1 - (event.clientY - rect.top) / rect.height;
      const isOverArtwork = hoverX >= 0 && hoverX <= 1 && hoverY >= 0 && hoverY <= 1;
      uniforms.uHoverActive.value = event.pointerType === "mouse" && isOverArtwork ? 1 : 0;
      if (isOverArtwork) uniforms.uHoverOrigin.value.set(hoverX, hoverY);
      const elapsedSinceEmit = event.timeStamp - lastEmitTime;
      const distanceSinceEmit = Math.hypot(event.clientX - lastEmitX, event.clientY - lastEmitY);
      const interval = pointerDown ? 58 : 115;
      const distance = pointerDown ? 11 : 22;
      if (elapsedSinceEmit >= interval && distanceSinceEmit >= distance) {
        emitRipple(event, pointerDown ? 0.52 : 0.22);
      }
    };

    const onPointerUp = () => { pointerDown = false; };
    const onPointerLeave = () => {
      pointerDown = false;
      uniforms.uHoverActive.value = 0;
    };

    const render = (timestamp: number) => {
      timer.update(timestamp);
      const elapsed = timer.getElapsed();
      uniforms.uTime.value = elapsed;
      for (let index = 0; index < 7; index += 1) {
        uniforms.uRippleAges.value[index] = elapsed - rippleStartedAt[index];
      }
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(render);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const interactionSurface = canvas.closest<HTMLElement>(".hero") ?? canvas;
    interactionSurface.addEventListener("pointerdown", onPointerDown);
    interactionSurface.addEventListener("pointermove", onPointerMove, { passive: true });
    interactionSurface.addEventListener("pointerup", onPointerUp);
    interactionSurface.addEventListener("pointercancel", onPointerUp);
    interactionSurface.addEventListener("pointerleave", onPointerLeave);
    resize();
    frame = window.requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      interactionSurface.removeEventListener("pointerdown", onPointerDown);
      interactionSurface.removeEventListener("pointermove", onPointerMove);
      interactionSurface.removeEventListener("pointerup", onPointerUp);
      interactionSurface.removeEventListener("pointercancel", onPointerUp);
      interactionSurface.removeEventListener("pointerleave", onPointerLeave);
      window.cancelAnimationFrame(frame);
      mesh.geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      timer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-water-canvas" aria-hidden="true" />;
}
