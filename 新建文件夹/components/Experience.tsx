import React, { useRef } from 'react';
import { Environment, ContactShadows } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import ChristmasTree from './ChristmasTree';
import GoldDust from './GoldDust';
import PostProcessingEffects from './PostProcessing';
import { TreeState } from '../types';

interface ExperienceProps {
  treeState: TreeState;
}

const Experience: React.FC<ExperienceProps> = ({ treeState }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Physics-based Rotation Logic (Inertia)
  const angularVelocity = useRef(0);
  const lastPointerX = useRef(0);
  const isDragging = useRef(false);
  
  // Used to ensure responsiveness
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { size, viewport } = useThree();

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastPointerX.current = e.clientX;
    // Stop auto-rotation or damping momentarily if you want strict control
    // But keeping momentum feels better
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging.current) {
      const deltaX = e.clientX - lastPointerX.current;
      lastPointerX.current = e.clientX;
      
      // Sensitivity factor
      const sensitivity = 0.005;
      angularVelocity.current += deltaX * sensitivity;
    }
  };

  useFrame(() => {
    if (groupRef.current) {
      // Apply Velocity
      groupRef.current.rotation.y += angularVelocity.current;

      // Apply Friction (Damping)
      const friction = 0.95; // 0.95 = slippery, 0.8 = stiff
      angularVelocity.current *= friction;

      // Minimal auto-rotation if stopped
      if (!isDragging.current && Math.abs(angularVelocity.current) < 0.001) {
         groupRef.current.rotation.y += 0.0005;
      }
    }
  });

  return (
    <>
      <color attach="background" args={['#000500']} />
      
      {/* Lighting Setup for Luxury Look */}
      <Environment preset="lobby" environmentIntensity={1.5} />
      <ambientLight intensity={0.5} color="#00241B" />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.25} 
        penumbra={1} 
        intensity={200} 
        color="#F9DF86" 
        castShadow 
      />
      <pointLight position={[-10, 5, -10]} intensity={50} color="#D4AF37" />
      
      {/* Interaction Zone - Invisible Mesh to catch events */}
      <mesh 
        visible={false} 
        position={[0, 5, 0]} 
        scale={[15, 15, 15]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        <sphereGeometry />
        <meshBasicMaterial side={THREE.BackSide} />
      </mesh>

      {/* Tree Group: Scaled down (0.8) and moved down (-2.5) to clear header text */}
      <group ref={groupRef} scale={0.8} position={[0, -2.5, 0]}>
        <ChristmasTree state={treeState} />
      </group>

      <GoldDust count={300} />

      {/* Shadow moved down to match new tree bottom */}
      <ContactShadows opacity={0.7} scale={20} blur={2} far={4} color="#000000" position={[0, -5.5, 0]} />
      
      <PostProcessingEffects />
    </>
  );
};

export default Experience;