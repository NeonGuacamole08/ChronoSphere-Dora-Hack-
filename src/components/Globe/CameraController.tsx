import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { Capsule } from '../../types';
import { latLngToVector3, vector3ToLatLng } from '../../utils/coordinates';

interface CameraControllerProps {
  selectedCapsule: Capsule | null;
  targetCoordinates?: { lat: number; lng: number } | null;
  flyInTrigger: number;
  onFlyInComplete?: () => void;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  onTriggerCloudDive?: (coords: { lat: number; lng: number }) => void;
  onZoomPastThreshold?: () => void;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  selectedCapsule,
  targetCoordinates,
  flyInTrigger,
  onFlyInComplete,
  controlsRef,
  onTriggerCloudDive,
  onZoomPastThreshold,
}) => {
  const { camera, size } = useThree();
  
  // Animation state
  const isAnimatingRef = useRef<boolean>(true);
  const animProgressRef = useRef<number>(0);
  const animDurationRef = useRef<number>(3.0); // 3.0s dramatic skydiving entry
  const startPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 16, 12));
  const targetEndPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.35, 4.85));
  const isFocusingRef = useRef<boolean>(false);
  const focusTargetPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 5.0));
  const hasTriggeredCloudDiveRef = useRef<boolean>(false);
  const hasDismissedTutorialRef = useRef<boolean>(false);

  // Dynamic aspect ratio & FOV adaptation on viewport resize (tablets, portrait, split-screen)
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const aspect = size.width / Math.max(1, size.height);
      camera.aspect = aspect;

      // When in portrait mode (<1.0) or tablet portrait/split ratio (<1.25), adjust FOV so the 3D globe is never cropped
      if (aspect < 0.85) {
        camera.fov = Math.min(62, 45 / (aspect * 1.05));
      } else if (aspect < 1.2) {
        camera.fov = 49;
      } else {
        camera.fov = 45;
      }

      camera.updateProjectionMatrix();
    }
  }, [size.width, size.height, camera]);

  // Trigger fly-in when component mounts or flyInTrigger increments
  useEffect(() => {
    isAnimatingRef.current = true;
    animProgressRef.current = 0;
    hasTriggeredCloudDiveRef.current = false;
    startPosRef.current = new THREE.Vector3(0, 26, 16);
    camera.position.copy(startPosRef.current);
    camera.lookAt(0, 0, 0);

    if (controlsRef.current) {
      controlsRef.current.enabled = false;
      controlsRef.current.target.set(0, 0, 0);
    }
  }, [flyInTrigger, camera, controlsRef]);

  // When selected capsule changes, smoothly focus camera
  useEffect(() => {
    if (selectedCapsule) {
      const pinPos = latLngToVector3(selectedCapsule.lat, selectedCapsule.lng, 2.0);
      const focusCamPos = pinPos.clone().normalize().multiplyScalar(4.2);
      focusTargetPosRef.current = focusCamPos;
      isFocusingRef.current = true;
      
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
      }
    }
  }, [selectedCapsule, controlsRef]);

  // When target coordinates change (e.g. from Mapbox search), smoothly fly camera
  useEffect(() => {
    if (targetCoordinates) {
      const targetPos = latLngToVector3(targetCoordinates.lat, targetCoordinates.lng, 2.0);
      const focusCamPos = targetPos.clone().normalize().multiplyScalar(3.8);
      focusTargetPosRef.current = focusCamPos;
      isFocusingRef.current = true;

      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
      }
    }
  }, [targetCoordinates, controlsRef]);

  useFrame((_, delta) => {
    // 1. Skydiving Fly-In Entry Animation
    if (isAnimatingRef.current) {
      animProgressRef.current += delta / animDurationRef.current;
      const t = Math.min(1.0, animProgressRef.current);

      // Smooth custom acceleration and decelerating cubic ease
      const easeT = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const currentPos = new THREE.Vector3();
      currentPos.lerpVectors(startPosRef.current, targetEndPosRef.current, easeT);
      
      if (t < 0.8) {
        const spiralAngle = (1 - t) * Math.PI * 1.5;
        currentPos.x += Math.sin(spiralAngle) * (1 - t) * 4.0;
        currentPos.z += Math.cos(spiralAngle) * (1 - t) * 2.0;
      }

      camera.position.copy(currentPos);
      camera.lookAt(0, 0, 0);

      if (t >= 1.0) {
        isAnimatingRef.current = false;
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
          controlsRef.current.update();
        }
        if (onFlyInComplete) {
          onFlyInComplete();
        }
      }
    } 
    // 2. Smooth Focus interpolation to targeted pin / Mapbox location
    else if (isFocusingRef.current) {
      camera.position.lerp(focusTargetPosRef.current, 0.08);
      if (camera.position.distanceTo(focusTargetPosRef.current) < 0.04) {
        isFocusingRef.current = false;
      }
      if (controlsRef.current) {
        controlsRef.current.update();
      }
    }

    // 3. Detect when user zooms in past threshold (z > 4, distance < 4.7) to dismiss gesture tutorial
    if (!isAnimatingRef.current && onZoomPastThreshold && !hasDismissedTutorialRef.current) {
      const dist = camera.position.length();
      if (dist < 4.7) {
        hasDismissedTutorialRef.current = true;
        onZoomPastThreshold();
      }
    }

    // 4. Detect when user zooms in deeply through the atmosphere (distance <= 2.6) to enter Explore Mode
    if (!isAnimatingRef.current && onTriggerCloudDive && !hasTriggeredCloudDiveRef.current) {
      const dist = camera.position.length();
      if (dist <= 2.58) {
        hasTriggeredCloudDiveRef.current = true;
        const targetLatLng = vector3ToLatLng(camera.position);
        onTriggerCloudDive(targetLatLng);
        // Reset flag after small delay
        setTimeout(() => {
          hasTriggeredCloudDiveRef.current = false;
        }, 2000);
      }
    }
  });

  return null;
};
