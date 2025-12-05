import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Instance, Instances } from '@react-three/drei';
import { TreeState } from '../types';
import * as maath from 'maath/random/dist/maath-random.esm';

interface ChristmasTreeProps {
  state: TreeState;
}

// Shader for the Foliage (Needles)
// Allows GPU-based interpolation between chaos and target positions
const FoliageMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uProgress: { value: 0 }, // 0 = Chaos, 1 = Formed
    uColor: { value: new THREE.Color('#004225') }, // Deep Green
    uColor2: { value: new THREE.Color('#0B6623') }, // Lighter Green
  },
  vertexShader: `
    uniform float uTime;
    uniform float uProgress;
    attribute vec3 aChaosPos;
    attribute vec3 aTargetPos;
    attribute float aRandom;
    varying vec2 vUv;
    varying float vRandom;

    // Cubic easing out
    float easeOutCubic(float x) {
      return 1.0 - pow(1.0 - x, 3.0);
    }

    void main() {
      vUv = uv;
      vRandom = aRandom;
      
      // Interpolate position
      // Add some noise to the progress based on randomness for organic movement
      float effectiveProgress = smoothstep(0.0, 1.0, uProgress * (0.8 + aRandom * 0.4));
      
      vec3 pos = mix(aChaosPos, aTargetPos, easeOutCubic(effectiveProgress));
      
      // Add subtle wind sway when formed
      if (uProgress > 0.8) {
        float sway = sin(uTime * 2.0 + pos.y) * 0.05 * (1.0 - effectiveProgress);
        pos.x += sway;
      }

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation
      gl_PointSize = (60.0 * aRandom + 20.0) / -mvPosition.z;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform vec3 uColor2;
    varying float vRandom;
    
    void main() {
      // Circular particle
      vec2 xy = gl_PointCoord.xy - vec2(0.5);
      float ll = length(xy);
      if(ll > 0.5) discard;
      
      // Mix colors based on random attribute
      vec3 finalColor = mix(uColor, uColor2, vRandom);
      
      // Add a gold specular dot
      float specular = 0.0;
      if (ll < 0.1) specular = 1.0;

      gl_FragColor = vec4(finalColor + specular * 0.5, 1.0);
    }
  `
};

const ChristmasTree: React.FC<ChristmasTreeProps> = ({ state }) => {
  const foliageRef = useRef<THREE.ShaderMaterial>(null);
  const ornamentGroupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(1); // 0 = Chaos, 1 = Formed
  
  // --- Data Generation ---
  const { foliageData, ornamentData } = useMemo(() => {
    const foliageCount = 15000;
    const baseOrnamentCount = 150;
    const extraBottomOrnamentCount = 120; // Extra balls for the bottom
    
    // Arrays for Foliage Attributes
    const foliageChaos = new Float32Array(foliageCount * 3);
    const foliageTarget = new Float32Array(foliageCount * 3);
    const foliageRandom = new Float32Array(foliageCount);
    
    // Arrays for Ornaments
    const ornaments = [];

    const treeHeight = 12;
    const maxRadius = 4;

    // Generate Foliage
    for (let i = 0; i < foliageCount; i++) {
      // 1. Target Position (Cone)
      const y = Math.random() * treeHeight; // 0 to 12
      const r = (1 - y / treeHeight) * maxRadius; // Radius decreases as y increases
      const angle = Math.random() * Math.PI * 2;
      const radiusOffset = Math.random() * r; // Fill inside the cone
      
      const tx = Math.cos(angle) * radiusOffset;
      const ty = y - treeHeight / 2 + 2; // Center Y
      const tz = Math.sin(angle) * radiusOffset;

      foliageTarget[i * 3] = tx;
      foliageTarget[i * 3 + 1] = ty;
      foliageTarget[i * 3 + 2] = tz;

      // 2. Chaos Position (Sphere shell)
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const chaosRadius = 15 + Math.random() * 5;
      
      foliageChaos[i * 3] = chaosRadius * Math.sin(phi) * Math.cos(theta);
      foliageChaos[i * 3 + 1] = chaosRadius * Math.sin(phi) * Math.sin(theta);
      foliageChaos[i * 3 + 2] = chaosRadius * Math.cos(phi);

      // 3. Random attribute
      foliageRandom[i] = Math.random();
    }

    // Generate Ornaments
    // Helper to generate a single ornament data
    const generateOrnament = (yVal: number, forceType?: 'ball' | 'gift' | 'light') => {
      const r = (1 - yVal / treeHeight) * maxRadius;
      const angle = Math.random() * Math.PI * 2;
      
      const tx = Math.cos(angle) * r; // On surface
      const ty = yVal - treeHeight / 2 + 2;
      const tz = Math.sin(angle) * r;

      // Chaos pos
      const cx = (Math.random() - 0.5) * 40;
      const cy = (Math.random() - 0.5) * 40;
      const cz = (Math.random() - 0.5) * 40;

      let type = forceType;
      if (!type) {
        type = Math.random() > 0.7 ? 'gift' : Math.random() > 0.4 ? 'ball' : 'light';
      }

      let color = '#D4AF37'; // Gold
      if (type === 'gift') color = Math.random() > 0.5 ? '#8B0000' : '#D4AF37'; // Red or Gold
      if (type === 'ball') color = Math.random() > 0.5 ? '#C0C0C0' : '#D4AF37'; // Silver or Gold
      if (type === 'light') color = '#FFFFFF';

      return {
        target: new THREE.Vector3(tx, ty, tz),
        chaos: new THREE.Vector3(cx, cy, cz),
        type,
        color,
        scale: type === 'gift' ? 0.6 : type === 'ball' ? 0.4 : 0.1,
        lerpSpeed: type === 'gift' ? 0.02 : type === 'ball' ? 0.05 : 0.1, // Heavy items move slower
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0]
      };
    };

    // 1. Base Random Distribution
    for (let i = 0; i < baseOrnamentCount; i++) {
      const y = Math.random() * treeHeight;
      ornaments.push(generateOrnament(y));
    }

    // 2. Extra Bottom Density (Gold & Silver Balls)
    for (let i = 0; i < extraBottomOrnamentCount; i++) {
      // Concentrate in bottom 35% of the tree
      const y = Math.random() * (treeHeight * 0.35);
      // Force 'ball' type, random Gold or Silver
      ornaments.push(generateOrnament(y, 'ball'));
    }

    return {
      foliageData: { chaos: foliageChaos, target: foliageTarget, random: foliageRandom },
      ornamentData: ornaments
    };
  }, []);

  // --- Animation Loop ---
  useFrame((r3fState, delta) => {
    // Update State Progress
    // We access the 'state' prop from the component closure, not the r3f state.
    const targetProgress = state === TreeState.CHAOS ? 0 : 1;
    // Foliage lerp (Uniform update)
    const step = delta * 0.8;
    
    // Animate progressRef towards targetProgress
    const current = progressRef.current;
    if (Math.abs(targetProgress - current) > 0.001) {
        const diff = targetProgress - current;
        progressRef.current += diff * step * 2.0; // Speed of transformation
        
        // Clamp
        if (targetProgress === 1 && progressRef.current > 1) progressRef.current = 1;
        if (targetProgress === 0 && progressRef.current < 0) progressRef.current = 0;
    } else {
        progressRef.current = targetProgress;
    }

    // Update Foliage Shader
    if (foliageRef.current) {
      foliageRef.current.uniforms.uTime.value = r3fState.clock.elapsedTime;
      foliageRef.current.uniforms.uProgress.value = progressRef.current;
    }

    // Update Ornaments (CPU Lerp for InstanceMesh-like behavior via Group)
    // We use a Group of meshes for simplicity in reading, or separate Instance Meshes.
    // Given React 19 / R3F, creating mapping inside component is fine for < 200 items.
    if (ornamentGroupRef.current) {
       ornamentGroupRef.current.children.forEach((child, i) => {
         const data = ornamentData[i];
         const p = progressRef.current; // Current global progress
         
         // Custom easing based on weight (lerpSpeed)
         // We construct a local progress that lags or leads
         // Heavier items (lower lerpSpeed) should arrive last
         
         // Simple linear interpolation between chaos and target vectors
         const currentPos = new THREE.Vector3().lerpVectors(data.chaos, data.target, p);
         
         // Add some noise/hover when in Chaos mode
         if (p < 0.1) {
            currentPos.y += Math.sin(r3fState.clock.elapsedTime + i) * 0.02;
         }

         child.position.copy(currentPos);
         
         // Rotate gifts
         if (data.type === 'gift') {
            child.rotation.x += 0.01;
            child.rotation.y += 0.01;
         }
       });
    }
  });

  return (
    <group>
      {/* Foliage System */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position" // This acts as base, but shader mixes
            count={foliageData.target.length / 3}
            array={foliageData.target}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aChaosPos"
            count={foliageData.chaos.length / 3}
            array={foliageData.chaos}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aTargetPos"
            count={foliageData.target.length / 3}
            array={foliageData.target}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aRandom"
            count={foliageData.random.length}
            array={foliageData.random}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={foliageRef}
          attach="material"
          args={[FoliageMaterial]}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Ornaments System */}
      <group ref={ornamentGroupRef}>
        {ornamentData.map((o, i) => (
          <mesh key={i} castShadow receiveShadow scale={o.scale}>
            {o.type === 'gift' ? <boxGeometry /> : <sphereGeometry args={[1, 16, 16]} />}
            <meshStandardMaterial 
              color={o.color} 
              roughness={0.2} 
              metalness={0.9} 
              emissive={o.type === 'light' ? o.color : '#000000'}
              emissiveIntensity={o.type === 'light' ? 2 : 0}
            />
          </mesh>
        ))}
      </group>

      {/* Tree Star */}
      <mesh position={[0, 8.5, 0]} scale={progressRef.current > 0.8 ? 1 : 0}>
         <octahedronGeometry args={[1, 0]} />
         <meshStandardMaterial color="#F9DF86" emissive="#F9DF86" emissiveIntensity={2} />
      </mesh>
    </group>
  );
};

export default ChristmasTree;