import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial, Sphere } from "@react-three/drei";
import * as THREE from "three";

/* ── Floating Particles ─────────────────────────────────────────── */
function ParticleField({ count = 1800 }) {
  const ref = useRef();

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.6 + Math.random() * 2.4;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.04;
      ref.current.rotation.x += delta * 0.012;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#8b9c86"
        size={0.014}
        sizeAttenuation
        depthWrite={false}
        opacity={0.7}
      />
    </Points>
  );
}

/* ── Globe Mesh ─────────────────────────────────────────────────── */
function GlobeMesh() {
  const meshRef = useRef();
  const wireRef = useRef();
  const glowRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.12;
    }
    if (wireRef.current) {
      wireRef.current.rotation.y = -t * 0.07;
      wireRef.current.rotation.x = Math.sin(t * 0.15) * 0.08;
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.12 + Math.sin(t * 0.8) * 0.04;
    }
  });

  // Globe texture: dot grid using canvas
  const texture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Dark base
    ctx.fillStyle = "#1a2318";
    ctx.fillRect(0, 0, size, size);

    // Dot grid pattern
    const spacing = 18;
    for (let x = 0; x < size; x += spacing) {
      for (let y = 0; y < size; y += spacing) {
        const alpha = 0.3 + Math.random() * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,156,134,${alpha})`;
        ctx.fill();
      }
    }

    // Continent-like patches (simplified blobs)
    const continents = [
      { x: 100, y: 180, rx: 60, ry: 40 },
      { x: 220, y: 150, rx: 80, ry: 55 },
      { x: 340, y: 200, rx: 50, ry: 35 },
      { x: 400, y: 280, rx: 40, ry: 30 },
      { x: 160, y: 320, rx: 35, ry: 25 },
      { x: 270, y: 330, rx: 45, ry: 30 },
      { x: 460, y: 180, rx: 30, ry: 22 },
    ];
    continents.forEach(({ x, y, rx, ry }) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
      grad.addColorStop(0, "rgba(139,156,134,0.45)");
      grad.addColorStop(1, "rgba(139,156,134,0)");
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });

    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <group>
      {/* Outer glow sphere */}
      <mesh ref={glowRef} scale={1.18}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#4a7c59"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main globe */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.85}
          metalness={0.1}
          color="#8b9c86"
        />
      </mesh>

      {/* Wireframe overlay */}
      <mesh ref={wireRef}>
        <sphereGeometry args={[1.005, 32, 16]} />
        <meshBasicMaterial
          color="#8b9c86"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Equatorial ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.12, 0.004, 2, 120]} />
        <meshBasicMaterial color="#ebdcb9" transparent opacity={0.35} />
      </mesh>

      {/* Orbit ring */}
      <mesh rotation={[Math.PI / 4, 0, Math.PI / 6]}>
        <torusGeometry args={[1.22, 0.003, 2, 100]} />
        <meshBasicMaterial color="#8b9c86" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

/* ── Floating Location Pins ─────────────────────────────────────── */
function LocationPin({ lat, lon, color = "#ebdcb9", pulse = false }) {
  const ref = useRef();
  const [x, y, z] = useMemo(() => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const r = 1.05;
    return [
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta),
    ];
  }, [lat, lon]);

  useFrame(({ clock }) => {
    if (ref.current && pulse) {
      const t = clock.getElapsedTime();
      ref.current.scale.setScalar(1 + Math.sin(t * 2.5) * 0.25);
    }
  });

  return (
    <mesh ref={ref} position={[x, y, z]}>
      <sphereGeometry args={[0.022, 8, 8]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

/* ── Scene lighting ─────────────────────────────────────────────── */
function Lights() {
  return (
    <>
      <ambientLight intensity={0.4} color="#8b9c86" />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ebdcb9" />
      <directionalLight position={[-5, -3, -2]} intensity={0.3} color="#4a6741" />
      <pointLight position={[3, 2, 4]} intensity={0.6} color="#b5c4b1" distance={8} />
    </>
  );
}

/* ── Auto-rotate camera ─────────────────────────────────────────── */
function CameraRig() {
  const { camera } = useThree();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.06) * 0.35;
    camera.position.y = Math.cos(t * 0.04) * 0.15;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ── Main Export ────────────────────────────────────────────────── */
export default function Globe3D({ className = "" }) {
  const PINS = [
    { lat: 35.68, lon: 139.69, color: "#f9a8d4", pulse: true },  // Tokyo
    { lat: 36.39, lon: 25.46, color: "#93c5fd", pulse: false }, // Santorini
    { lat: -8.34, lon: 115.09, color: "#6ee7b7", pulse: true }, // Bali
    { lat: 48.85, lon: 2.35, color: "#fcd34d", pulse: false },  // Paris
    { lat: 40.71, lon: -74.0, color: "#c4b5fd", pulse: false }, // NYC
    { lat: -33.86, lon: 151.21, color: "#fb923c", pulse: false }, // Sydney
    { lat: 51.5, lon: -0.12, color: "#f0abfc", pulse: false },   // London
  ];

  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
      >
        <Lights />
        <CameraRig />
        <GlobeMesh />
        <ParticleField count={1600} />
        {PINS.map((pin, i) => (
          <LocationPin key={i} {...pin} />
        ))}
      </Canvas>
    </div>
  );
}
