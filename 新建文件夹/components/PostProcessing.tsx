import React from 'react';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

const PostProcessingEffects: React.FC = () => {
  return (
    <EffectComposer disableNormalPass>
      <Bloom 
        luminanceThreshold={0.8} 
        mipmapBlur 
        intensity={1.2} 
        radius={0.6}
      />
      <Vignette eskil={false} offset={0.1} darkness={0.6} />
    </EffectComposer>
  );
};

export default PostProcessingEffects;