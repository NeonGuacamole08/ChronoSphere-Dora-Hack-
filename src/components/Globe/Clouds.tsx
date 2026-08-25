import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CloudsProps {
  texture: THREE.CanvasTexture;
  radius?: number;
}

export const Clouds: React.FC<CloudsProps> = ({ texture, radius = 2.028 }) => {
  const cloudsRef = useRef<THREE.Mesh>(null);
  const outerCloudsRef = useRef<THREE.Mesh>(null);
  const [cloudTexture, setCloudTexture] = useState<THREE.Texture>(texture);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        setCloudTexture(tex);
      },
      undefined,
      () => {
        // Keeps procedural fallback
      }
    );
  }, [texture]);

  useFrame((_, delta) => {
    // 1. Rotate primary Earth cloud layer smoothly around the globe
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.016;
      cloudsRef.current.rotation.x += delta * 0.0008;
    }

    // 2. Rotate outer wispy cloud shell in gentle counter-direction for dynamic realism
    if (outerCloudsRef.current) {
      outerCloudsRef.current.rotation.y -= delta * 0.010;
      outerCloudsRef.current.rotation.z += delta * 0.0012;
    }
  });

  return (
    <group>
      {/* 1. Primary Smooth Low-Altitude Moving Cloud Layer */}
      <mesh ref={cloudsRef} scale={[1.015, 1.015, 1.015]} raycast={() => null}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={cloudTexture}
          transparent
          opacity={0.65}
          blending={THREE.NormalBlending}
          depthWrite={false}
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* 2. Secondary Smooth High-Altitude Wispy Moving Cloud Layer */}
      <mesh ref={outerCloudsRef} scale={[1.025, 1.025, 1.025]} raycast={() => null}>
        <sphereGeometry args={[radius * 1.012, 64, 64]} />
        <meshStandardMaterial
          map={cloudTexture}
          transparent
          opacity={0.32}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          roughness={1.0}
          color="#e0f2fe"
        />
      </mesh>
    </group>
  );
};
