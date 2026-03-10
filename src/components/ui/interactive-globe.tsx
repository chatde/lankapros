"use client";

import { cn } from "@/lib/utils";
import { useRef, useEffect, useCallback } from "react";

interface GlobeProps {
  className?: string;
  size?: number;
}

// Sri Lanka at center with connections radiating to/from major cities
const SRI_LANKA: [number, number] = [7.87, 80.77];

const MARKERS = [
  { lat: 7.87, lng: 80.77, label: "Sri Lanka", primary: true },
  { lat: 6.93, lng: 79.85, label: "Colombo" },
  { lat: 51.51, lng: -0.13, label: "London" },
  { lat: 25.2, lng: 55.27, label: "Dubai" },
  { lat: 1.35, lng: 103.82, label: "Singapore" },
  { lat: 37.78, lng: -122.42, label: "San Francisco" },
  { lat: 43.65, lng: -79.38, label: "Toronto" },
  { lat: -33.87, lng: 151.21, label: "Sydney" },
  { lat: 35.68, lng: 139.69, label: "Tokyo" },
  { lat: 52.52, lng: 13.4, label: "Berlin" },
];

const CONNECTIONS: { from: [number, number]; to: [number, number] }[] = [
  { from: SRI_LANKA, to: [51.51, -0.13] },
  { from: SRI_LANKA, to: [25.2, 55.27] },
  { from: SRI_LANKA, to: [1.35, 103.82] },
  { from: SRI_LANKA, to: [37.78, -122.42] },
  { from: SRI_LANKA, to: [43.65, -79.38] },
  { from: SRI_LANKA, to: [-33.87, 151.21] },
  { from: SRI_LANKA, to: [35.68, 139.69] },
  { from: SRI_LANKA, to: [52.52, 13.4] },
];

function latLngToXYZ(lat: number, lng: number, r: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return [
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];
}

function rotateY(x: number, y: number, z: number, a: number): [number, number, number] {
  return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
}

function rotateX(x: number, y: number, z: number, a: number): [number, number, number] {
  return [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
}

function project(x: number, y: number, z: number, cx: number, cy: number, fov = 600): [number, number] {
  const scale = fov / (fov + z);
  return [x * scale + cx, y * scale + cy];
}

export function InteractiveGlobe({ className, size = 480 }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotYRef = useRef(-1.4); // Start rotated so Sri Lanka faces viewer
  const rotXRef = useRef(0.15);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startRotY: 0, startRotX: 0 });
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const dotsRef = useRef<[number, number, number][]>([]);

  useEffect(() => {
    const dots: [number, number, number][] = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < 1400; i++) {
      const theta = (2 * Math.PI * i) / goldenRatio;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 1400);
      dots.push([
        Math.cos(theta) * Math.sin(phi),
        Math.cos(phi),
        Math.sin(theta) * Math.sin(phi),
      ]);
    }
    dotsRef.current = dots;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.4;

    if (!dragRef.current.active) {
      rotYRef.current += 0.0015;
    }
    timeRef.current += 0.012;
    const t = timeRef.current;
    const ry = rotYRef.current;
    const rx = rotXRef.current;

    ctx.clearRect(0, 0, w, h);

    // Outer ambient glow — use LankaPros gold
    const glow = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius * 1.6);
    glow.addColorStop(0, "rgba(212, 168, 67, 0.04)");
    glow.addColorStop(1, "rgba(212, 168, 67, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Globe outline
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(212, 168, 67, 0.08)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dots
    for (const dot of dotsRef.current) {
      let [x, y, z] = [dot[0] * radius, dot[1] * radius, dot[2] * radius];
      [x, y, z] = rotateX(x, y, z, rx);
      [x, y, z] = rotateY(x, y, z, ry);
      if (z > 0) continue;
      const [sx, sy] = project(x, y, z, cx, cy);
      const depth = Math.max(0.08, 1 - (z + radius) / (2 * radius));
      ctx.beginPath();
      ctx.arc(sx, sy, 0.9 + depth * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212, 168, 67, ${(depth * 0.45).toFixed(2)})`;
      ctx.fill();
    }

    // Connections / arcs
    for (const conn of CONNECTIONS) {
      let [x1, y1, z1] = latLngToXYZ(conn.from[0], conn.from[1], radius);
      let [x2, y2, z2] = latLngToXYZ(conn.to[0], conn.to[1], radius);
      [x1, y1, z1] = rotateX(x1, y1, z1, rx);
      [x1, y1, z1] = rotateY(x1, y1, z1, ry);
      [x2, y2, z2] = rotateX(x2, y2, z2, rx);
      [x2, y2, z2] = rotateY(x2, y2, z2, ry);

      if (z1 > radius * 0.4 && z2 > radius * 0.4) continue;

      const [sx1, sy1] = project(x1, y1, z1, cx, cy);
      const [sx2, sy2] = project(x2, y2, z2, cx, cy);

      // Elevated control point for arc
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const midZ = (z1 + z2) / 2;
      const len = Math.sqrt(midX * midX + midY * midY + midZ * midZ);
      const [scx, scy] = project(
        (midX / len) * radius * 1.3,
        (midY / len) * radius * 1.3,
        (midZ / len) * radius * 1.3,
        cx, cy
      );

      // Arc line
      ctx.beginPath();
      ctx.moveTo(sx1, sy1);
      ctx.quadraticCurveTo(scx, scy, sx2, sy2);
      ctx.strokeStyle = "rgba(212, 168, 67, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Traveling dot (data packet animation)
      const tPos = (Math.sin(t * 1.1 + conn.to[0] * 0.08) + 1) / 2;
      const tdx = (1 - tPos) * (1 - tPos) * sx1 + 2 * (1 - tPos) * tPos * scx + tPos * tPos * sx2;
      const tdy = (1 - tPos) * (1 - tPos) * sy1 + 2 * (1 - tPos) * tPos * scy + tPos * tPos * sy2;
      ctx.beginPath();
      ctx.arc(tdx, tdy, 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(212, 168, 67, 0.9)";
      ctx.fill();
    }

    // Markers
    for (const marker of MARKERS) {
      let [x, y, z] = latLngToXYZ(marker.lat, marker.lng, radius);
      [x, y, z] = rotateX(x, y, z, rx);
      [x, y, z] = rotateY(x, y, z, ry);
      if (z > radius * 0.15) continue;

      const [sx, sy] = project(x, y, z, cx, cy);
      const pulse = Math.sin(t * 2.2 + marker.lat) * 0.5 + 0.5;

      if (marker.primary) {
        // Sri Lanka — large pulsing ring
        ctx.beginPath();
        ctx.arc(sx, sy, 7 + pulse * 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(212, 168, 67, ${0.25 + pulse * 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(212, 168, 67, 1)";
        ctx.fill();
      } else {
        // Other cities — smaller pulse
        ctx.beginPath();
        ctx.arc(sx, sy, 3 + pulse * 3, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(212, 168, 67, ${0.15 + pulse * 0.12})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(212, 168, 67, 0.8)";
        ctx.fill();
      }

      // Label
      if (marker.label) {
        ctx.font = marker.primary ? "bold 11px system-ui" : "10px system-ui";
        ctx.fillStyle = marker.primary ? "rgba(212, 168, 67, 0.9)" : "rgba(212, 168, 67, 0.55)";
        ctx.fillText(marker.label, sx + 8, sy + 4);
      }
    }

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startRotY: rotYRef.current, startRotX: rotXRef.current };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    rotYRef.current = dragRef.current.startRotY + (e.clientX - dragRef.current.startX) * 0.005;
    rotXRef.current = Math.max(-1, Math.min(1, dragRef.current.startRotX + (e.clientY - dragRef.current.startY) * 0.005));
  }, []);

  const onPointerUp = useCallback(() => { dragRef.current.active = false; }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn("cursor-grab active:cursor-grabbing", className)}
      style={{ width: size, height: size }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  );
}
