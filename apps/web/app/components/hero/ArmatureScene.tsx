'use client';

/**
 * BENCHED 2026-06-12 (landing premium pass, founder build-list #1): this
 * component is no longer imported by the hero. The hero now renders a graded
 * dark video/Spline SLOT (HeroComposition.tsx) awaiting a founder-supplied
 * asset. The armature read as a thin "scribble" behind the type at 1440 and
 * undercut the monumental composition. Kept (not deleted) as the fallback /
 * future hero asset slot — re-wire only on founder call.
 *
 * ArmatureScene — Three.js brass gyroscopic armature (elevation-spec §1.3).
 *
 * SCENE_COLORS mirrors token values from tokens.css. Raw hex is unavoidable
 * inside WebGL materials; these are isolated here with comments cross-referencing
 * the design-system token each value maps to. No other file may contain raw hex.
 *
 * Elevation-spec §1.3 geometry changes (vs previous):
 * - TubeGeometry/LineSegments on thin path curves (tube radius 0.007) instead of
 *   thick MeshStandard solid rings — reads 1-2px, precision wireframe.
 * - High tessellation: torus tubularSegments 220, radialSegments 64.
 * - WireframeGeometry on a subdivided torus for the outer ring (thin line grid).
 * - Second concentric graticule ring with radial tick marks every 15° (24 ticks).
 * - Dim brass body lines at opacity 0.32 (~--metador-primary-deep 45% intensity).
 * - ONE bright meridian arc at --metador-primary-bright full strength (the catch-light).
 * - Depth fog so far lines recede — volume, not doodle.
 * - Scene group anchored off-center RIGHT (position.x ≈ +1.4) at 1.4× viewport height
 *   scale so it reads as a backdrop, not a mascot.
 *
 * Engineering contracts (unchanged):
 * - Raw three.js, no react-three-fiber
 * - pixelRatio capped at 1.5, antialias, alpha:true
 * - Full dispose on unmount (geometries, materials, renderer, RAF cancel)
 * - RAF paused when document.hidden OR scrolled past hero (IntersectionObserver)
 * - Pointer parallax ≤6° tilt, eased
 * - Ambient rotation ~40s full revolution
 * - prefers-reduced-motion: component never mounts (handled by parent)
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { DURATIONS_S } from '@metador/design-system';

// ── Scene colors — mirrors design-system tokens (raw hex unavoidable in WebGL) ──
const SCENE_COLORS = {
  /** --metador-primary: #F2A516 — brass brand primary */
  brassPrimary: 0xf2a516,
  /** --metador-primary-bright: #FFC24B — single catch-light meridian */
  brassBright: 0xffc24b,
  /** --metador-primary-deep: #B97908 — dim body lines (~30-45% intensity) */
  brassDeep: 0xb97908,
  /** --metador-bg: #0A0E14 — scene fog color (matches page bg) */
  bgSlate: 0x0a0e14,
} as const;

// Ambient revolution: 2π / 40s ≈ 0.157 rad/s
const AMBIENT_ROT_SPEED = (2 * Math.PI) / 40;
// Breath period: 6s token
const BREATH_PERIOD = DURATIONS_S.ambient;

interface ArmatureSceneProps {
  className?: string;
}

export function ArmatureScene({ className }: ArmatureSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const containerOrNull = mountRef.current;
    if (!containerOrNull) return;
    const container = containerOrNull;

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ── Scene ────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    // Depth fog: bgSlate color, near=4, far=18. Far lines fade to bg — volume.
    scene.fog = new THREE.Fog(SCENE_COLORS.bgSlate, 4, 18);

    // ── Camera ───────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      38,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    // Pull camera back enough to frame the monumental scale
    camera.position.set(0, 0, 6.5);

    // ── Armature group — anchored off-center right per spec §1.3 ────────────
    const armatureGroup = new THREE.Group();
    // Offset right so instrument bleeds off frame (backdrop, not mascot)
    armatureGroup.position.x = 1.4;
    scene.add(armatureGroup);

    // ── Line material factory ────────────────────────────────────────────────
    // Dim body lines: deep brass at 45% opacity
    function dimLineMat(): THREE.LineBasicMaterial {
      return new THREE.LineBasicMaterial({
        color: SCENE_COLORS.brassDeep,
        opacity: 0.32,
        transparent: true,
        depthWrite: false,
      });
    }

    // Bright catch-light: primary-bright at full opacity
    function brightLineMat(): THREE.LineBasicMaterial {
      return new THREE.LineBasicMaterial({
        color: SCENE_COLORS.brassBright,
        opacity: 1.0,
        transparent: false,
        depthWrite: false,
      });
    }

    // Mid-intensity secondary lines
    function midLineMat(opacity = 0.55): THREE.LineBasicMaterial {
      return new THREE.LineBasicMaterial({
        color: SCENE_COLORS.brassPrimary,
        opacity,
        transparent: true,
        depthWrite: false,
      });
    }

    // ── Helper: build a wireframe ring from a TorusGeometry ─────────────────
    // Returns a THREE.LineSegments so it renders thin (1px on most hardware).
    function makeWireframeRing(
      radius: number,
      tube: number,
      radialSegs: number,
      tubularSegs: number,
      mat: THREE.LineBasicMaterial,
    ): THREE.LineSegments {
      const geo = new THREE.TorusGeometry(radius, tube, radialSegs, tubularSegs);
      const wireGeo = new THREE.WireframeGeometry(geo);
      const lines = new THREE.LineSegments(wireGeo, mat);
      geo.dispose(); // source mesh geo no longer needed
      return lines;
    }

    // ── Outer primary ring — large, tilted ~20° off horizontal ──────────────
    // High tessellation: radialSegs 64, tubularSegs 220 (spec §1.3)
    const outerMat = dimLineMat();
    const outerRing = makeWireframeRing(1.35, 0.007, 64, 220, outerMat);
    outerRing.rotation.x = Math.PI * 0.22;
    outerRing.scale.set(1, 0.62, 1); // yRatio 0.62 — elliptical projection
    armatureGroup.add(outerRing);

    // ── Inner ring — smaller, steeply tilted (~70°, more vertical) ──────────
    const innerMat = dimLineMat();
    const innerRing = makeWireframeRing(0.92, 0.007, 64, 220, innerMat);
    innerRing.rotation.z = Math.PI * 0.08;
    innerRing.rotation.x = Math.PI * 0.72;
    innerRing.scale.set(1, 0.58, 1);
    armatureGroup.add(innerRing);

    // ── Graticule ring — concentric, tick marks every 15° (§1.3) ────────────
    // The graticule is a slightly larger ring with radial tick line segments
    // around the equatorial plane — reads as naval-blueprint precision.
    const graticuleMat = midLineMat(0.28);
    const graticuleRing = makeWireframeRing(1.58, 0.004, 48, 180, graticuleMat);
    graticuleRing.rotation.x = Math.PI * 0.18;
    graticuleRing.scale.set(1, 0.55, 1);
    armatureGroup.add(graticuleRing);

    // Tick marks — 24 radial line segments (every 15°) in the equatorial plane
    const tickPositions: number[] = [];
    const TICK_COUNT = 24;
    const RING_R = 1.58;
    const TICK_INNER = 0.07; // tick length inward from ring radius
    for (let t = 0; t < TICK_COUNT; t++) {
      const angle = (t / TICK_COUNT) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      // Outer point (on ring)
      tickPositions.push(RING_R * cos, RING_R * sin, 0);
      // Inner point (tick inward)
      tickPositions.push((RING_R - TICK_INNER) * cos, (RING_R - TICK_INNER) * sin, 0);
    }
    const tickGeo = new THREE.BufferGeometry();
    tickGeo.setAttribute('position', new THREE.Float32BufferAttribute(tickPositions, 3));
    const tickMat = midLineMat(0.35);
    const ticks = new THREE.LineSegments(tickGeo, tickMat);
    ticks.rotation.x = Math.PI * 0.18;
    ticks.scale.set(1, 0.55, 1);
    armatureGroup.add(ticks);

    // ── ONE bright meridian catch-light — a single vertical arc (§1.3) ──────
    // This is the lone bright edge. Built as a TubeGeometry along an arc path.
    const meridianCurve = new THREE.ArcCurve(0, 0, 1.36, 0, Math.PI * 2, false);
    const meridianPoints = meridianCurve.getPoints(180);
    const meridianPath = new THREE.CatmullRomCurve3(
      meridianPoints.map((p) => new THREE.Vector3(p.x, p.y, 0)),
      true,
    );
    const meridianGeo = new THREE.TubeGeometry(meridianPath, 220, 0.006, 8, true);
    const meridianWireGeo = new THREE.WireframeGeometry(meridianGeo);
    const meridianMat = brightLineMat();
    const meridianArc = new THREE.LineSegments(meridianWireGeo, meridianMat);
    meridianGeo.dispose();
    // Rotate into the near-vertical plane so it reads as the bright meridian
    meridianArc.rotation.y = Math.PI * 0.5;
    meridianArc.rotation.x = Math.PI * 0.08;
    meridianArc.scale.set(1, 0.62, 1);
    armatureGroup.add(meridianArc);

    // ── Metador spine blade — thin vertical pair of line segments ──────────────
    // Two faint dim lines forming the structural spine
    const spinePositions = new Float32Array([
      0, -2.0, 0,
      0, 2.0, 0,
    ]);
    const spineGeo = new THREE.BufferGeometry();
    spineGeo.setAttribute('position', new THREE.BufferAttribute(spinePositions, 3));
    const spineMat = dimLineMat();
    const spine = new THREE.Line(spineGeo, spineMat);
    armatureGroup.add(spine);

    // ── Subtle warm point light — warms the scene (mostly affects fog color) ─
    const light = new THREE.PointLight(SCENE_COLORS.brassPrimary, 0.8, 14);
    light.position.set(2, 2.5, 3);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.04));

    // ── Pointer parallax state ───────────────────────────────────────────────
    let pointerX = 0;
    let pointerY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;
    const MAX_TILT_RAD = (6 * Math.PI) / 180;
    const PARALLAX_EASE = 0.05;

    function onPointerMove(e: PointerEvent) {
      const rect = container.getBoundingClientRect();
      pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }
    container.addEventListener('pointermove', onPointerMove);

    // ── Pause-on-hidden / pause-on-scroll-past ───────────────────────────────
    let isPaused = false;

    function onVisibilityChange() {
      isPaused = document.hidden;
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) isPaused = !entry.isIntersecting;
      },
      { threshold: 0.01 },
    );
    observer.observe(container);

    // ── Resize handler ───────────────────────────────────────────────────────
    function onResize() {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    // ── Animation loop ───────────────────────────────────────────────────────
    let rafId: number;
    let lastTime = performance.now();

    function animate(now: number) {
      rafId = requestAnimationFrame(animate);
      if (isPaused) return;

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Ambient rotation — whole group slow ~40s revolution
      armatureGroup.rotation.y += AMBIENT_ROT_SPEED * dt;

      // Rings counter-rotate for gyroscopic feel
      outerRing.rotation.y += AMBIENT_ROT_SPEED * 0.65 * dt;
      innerRing.rotation.y -= AMBIENT_ROT_SPEED * 0.45 * dt;
      graticuleRing.rotation.y += AMBIENT_ROT_SPEED * 0.3 * dt;
      ticks.rotation.y += AMBIENT_ROT_SPEED * 0.3 * dt;

      // Subtle breath on meridian catch-light opacity only (no scale change)
      const breathPhase = (now / (BREATH_PERIOD * 1000)) * Math.PI * 2;
      const breathAmp = 0.5 + 0.5 * Math.sin(breathPhase);
      // Meridian mat opacity pulses slightly between 0.88 and 1.0
      meridianMat.opacity = 0.88 + breathAmp * 0.12;

      // Pointer parallax — ease toward target tilt
      currentTiltX += (pointerY * MAX_TILT_RAD - currentTiltX) * PARALLAX_EASE;
      currentTiltY += (pointerX * MAX_TILT_RAD - currentTiltY) * PARALLAX_EASE;
      camera.position.x = currentTiltY * 1.2;
      camera.position.y = currentTiltX * 1.2;
      camera.lookAt(armatureGroup.position.x, 0, 0);

      renderer.render(scene, camera);
    }

    rafId = requestAnimationFrame(animate);

    // ── Full dispose on unmount ───────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      container.removeEventListener('pointermove', onPointerMove);

      // Dispose geometries (wireGeo is held by LineSegments.geometry)
      outerRing.geometry.dispose();
      innerRing.geometry.dispose();
      graticuleRing.geometry.dispose();
      tickGeo.dispose();
      meridianWireGeo.dispose();
      spineGeo.dispose();

      // Dispose materials
      const matsToDispose: THREE.Material[] = [
        outerMat, innerMat, graticuleMat, tickMat,
        meridianMat, spineMat,
      ];
      matsToDispose.forEach((m) => m.dispose());

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
      aria-hidden="true"
    />
  );
}
