import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Capsule } from '../../types';

interface HeatmapLayerProps {
  capsules: Capsule[];
  visible: boolean;
  radius?: number;
}

export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({
  capsules,
  visible,
  radius = 2.016,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate heatmap texture based on capsule density
  const heatmapTexture = useMemo(() => {
    const width = 1024;
    const height = 512;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Transparent base
    ctx.clearRect(0, 0, width, height);

    if (capsules.length === 0) {
      return new THREE.CanvasTexture(canvas);
    }

    // Convert lat/lng to texture coordinates
    capsules.forEach((cap) => {
      const x = ((cap.lng + 180) / 360) * width;
      const y = ((90 - cap.lat) / 180) * height;

      // Draw warm glowing radial gradient
      // Outer soft yellow (#fef08a) -> Amber (#f59e0b) -> Deep Orange/Red (#ea580c / #991b1b)
      const gradRadius = 45;
      const radGrad = ctx.createRadialGradient(x, y, 0, x, y, gradRadius);
      radGrad.addColorStop(0, 'rgba(185, 28, 28, 0.9)'); // Deep crimson center
      radGrad.addColorStop(0.35, 'rgba(234, 88, 12, 0.85)'); // Vibrant terracotta orange
      radGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.6)'); // Amber
      radGrad.addColorStop(1, 'rgba(254, 240, 138, 0)'); // Soft yellow fade out

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(x, y, gradRadius, 0, Math.PI * 2);
      ctx.fill();

      // Handle texture edge wrapping for longitude seams
      if (x - gradRadius < 0) {
        const wrapX = x + width;
        const wrapGrad = ctx.createRadialGradient(wrapX, y, 0, wrapX, y, gradRadius);
        wrapGrad.addColorStop(0, 'rgba(185, 28, 28, 0.9)');
        wrapGrad.addColorStop(0.35, 'rgba(234, 88, 12, 0.85)');
        wrapGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.6)');
        wrapGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = wrapGrad;
        ctx.beginPath();
        ctx.arc(wrapX, y, gradRadius, 0, Math.PI * 2);
        ctx.fill();
      } else if (x + gradRadius > width) {
        const wrapX = x - width;
        const wrapGrad = ctx.createRadialGradient(wrapX, y, 0, wrapX, y, gradRadius);
        wrapGrad.addColorStop(0, 'rgba(185, 28, 28, 0.9)');
        wrapGrad.addColorStop(0.35, 'rgba(234, 88, 12, 0.85)');
        wrapGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.6)');
        wrapGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = wrapGrad;
        ctx.beginPath();
        ctx.arc(wrapX, y, gradRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, [capsules]);

  // Gentle breathing pulse animation for heatmap glow
  useFrame(({ clock }) => {
    if (meshRef.current && visible) {
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      const pulse = 0.75 + Math.sin(clock.getElapsedTime() * 2.0) * 0.15;
      material.opacity = pulse;
    }
  });

  if (!visible) return null;

  return (
    <mesh ref={meshRef} raycast={() => null}>
      <sphereGeometry args={[radius, 48, 48]} />
      <meshBasicMaterial
        map={heatmapTexture}
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
