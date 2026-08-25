import React, { useMemo } from 'react';
import * as THREE from 'three';

const AtmosphereShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform vec3 glowColor;
    uniform float coefficient;
    uniform float power;
    void main() {
      vec3 viewCameraDir = normalize(-vPosition);
      float intensity = pow(coefficient - dot(vNormal, viewCameraDir), power);
      intensity = clamp(intensity, 0.0, 1.0);
      gl_FragColor = vec4(glowColor, intensity * 0.55);
    }
  `,
};

interface AtmosphereGlowProps {
  radius?: number;
}

export const AtmosphereGlow: React.FC<AtmosphereGlowProps> = ({ radius = 2.0 }) => {
  const uniforms = useMemo(() => ({
    glowColor: { value: new THREE.Color('#7ec8f8') }, // Soft azure sunlight atmospheric glow
    coefficient: { value: 0.85 },
    power: { value: 2.4 },
  }), []);

  return (
    <mesh scale={[1.06, 1.06, 1.06]} raycast={() => null}>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        vertexShader={AtmosphereShader.vertexShader}
        fragmentShader={AtmosphereShader.fragmentShader}
        uniforms={uniforms}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
};
