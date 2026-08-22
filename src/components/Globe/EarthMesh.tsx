import React, { useEffect, useMemo, useState } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { generateEarthTextures } from './textureGenerator';
import { vector3ToLatLng } from '../../utils/coordinates';

interface EarthMeshProps {
  onCoordinatesPicked?: (coords: { lat: number; lng: number; point: THREE.Vector3 }) => void;
  radius?: number;
}

export const EarthMesh: React.FC<EarthMeshProps> = ({
  onCoordinatesPicked,
  radius = 2.0,
}) => {
  // Generate high-resolution base procedural maps
  const baseTextures = useMemo(() => {
    return generateEarthTextures();
  }, []);

  const [colorMap, setColorMap] = useState<THREE.Texture>(baseTextures.colorMap);
  const [bumpMap, setBumpMap] = useState<THREE.Texture>(baseTextures.bumpMap);
  const [specularMap, setSpecularMap] = useState<THREE.Texture>(baseTextures.specularMap);

  // Attempt to progressively load photorealistic NASA Blue Marble textures
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    // NASA Blue Marble diffuse
    loader.load(
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.generateMipmaps = true;
        setColorMap(tex);
      },
      undefined,
      (err) => {
        console.info('Using high-res procedural Earth map fallback:', err);
      }
    );

    // Surface elevation bump / normal
    loader.load(
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        setBumpMap(tex);
      },
      undefined,
      () => {}
    );

    // Specular ocean gloss
    loader.load(
      'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        setSpecularMap(tex);
      },
      undefined,
      () => {}
    );
  }, []);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    // Handle direct clicks on earth surface
    if (e.point && onCoordinatesPicked) {
      e.stopPropagation();
      const coords = vector3ToLatLng(e.point);
      onCoordinatesPicked({
        lat: coords.lat,
        lng: coords.lng,
        point: e.point.clone(),
      });
    }
  };

  return (
    <mesh
      receiveShadow
      castShadow
      onClick={handleClick}
      onPointerOver={() => {
        document.body.style.cursor = 'grab';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* 64x64 Sphere for smooth photorealistic curvature */}
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial
        map={colorMap}
        bumpMap={bumpMap}
        bumpScale={0.045}
        roughnessMap={specularMap}
        roughness={0.6}
        metalness={0.08}
        envMapIntensity={0.8}
      />
    </mesh>
  );
};
