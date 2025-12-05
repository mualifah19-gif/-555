import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface GoldDustProps {
  count: number;
}

const GoldDust: React.FC<GoldDustProps> = ({ count }) => {
  const mesh = useRef<THREE.Points>(null);
  const { viewport, mouse, camera } = useThree();

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30; // z
    }
    return positions;
  }, [count]);

  const particlesData = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      velocity: new THREE.Vector3(),
      originalPos: new THREE.Vector3(),
    }));
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;

    // Convert mouse screen pos to world 3D ray
    // A simple approximation for "attraction": 
    // Project mouse to a plane at z=0 (or somewhat near center)
    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    const targetPos = camera.position.clone().add(dir.multiplyScalar(distance));
    
    // For a cooler effect, let's keep the target Z somewhat dynamic or fixed near tree center
    targetPos.z = 5; 

    const positions = mesh.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];

      const currentPos = new THREE.Vector3(x, y, z);
      
      // Attraction Force
      const distToMouse = currentPos.distanceTo(targetPos);
      const force = Math.max(0, (10 - distToMouse) / 10); // Stronger when closer
      
      // Movement Logic:
      // 1. Natural drift (Simplex noise simulation via sin/cos)
      const t = state.clock.elapsedTime;
      const driftX = Math.sin(t * 0.5 + i) * 0.02;
      const driftY = Math.cos(t * 0.3 + i * 2) * 0.02 - 0.01; // Slight gravity
      
      // 2. Attraction
      // If mouse is close, pull towards it
      let attractX = 0, attractY = 0, attractZ = 0;
      if (distToMouse < 8) {
        const dirToMouse = targetPos.clone().sub(currentPos).normalize();
        const strength = 0.2 * force;
        attractX = dirToMouse.x * strength;
        attractY = dirToMouse.y * strength;
        attractZ = dirToMouse.z * strength;
      }

      positions[i3] += driftX + attractX;
      positions[i3 + 1] += driftY + attractY;
      positions[i3 + 2] += attractZ;

      // Respawn if too low or too far
      if (positions[i3 + 1] < -10) positions[i3 + 1] = 15;
    }

    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        color="#F9DF86" // Light Gold
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default GoldDust;