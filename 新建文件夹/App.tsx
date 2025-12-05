import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import Experience from './components/Experience';
import Overlay from './components/Overlay';
import { TreeState } from './types';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.FORMED);

  const toggleState = () => {
    setTreeState((prev) => (prev === TreeState.FORMED ? TreeState.CHAOS : TreeState.FORMED));
  };

  return (
    <div className="relative w-full h-full bg-radial-gradient from-luxury-green to-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-luxury-green via-black to-black z-0 pointer-events-none" />
      
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 4, 20], fov: 45 }}
        gl={{ antialias: false, alpha: false, stencil: false, depth: true }}
      >
        <Suspense fallback={null}>
          <Experience treeState={treeState} />
        </Suspense>
      </Canvas>
      
      <Overlay treeState={treeState} onToggle={toggleState} />
      <Loader 
        containerStyles={{ background: '#000' }} 
        innerStyles={{ background: '#D4AF37', height: '2px' }} 
        barStyles={{ background: '#D4AF37', height: '2px' }}
        dataStyles={{ color: '#D4AF37', fontFamily: 'serif' }}
      />
    </div>
  );
};

export default App;