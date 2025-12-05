import React from 'react';
import { TreeState } from '../types';

interface OverlayProps {
  treeState: TreeState;
  onToggle: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ treeState, onToggle }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 flex flex-col justify-between p-8">
      {/* Header */}
      <div className="text-center mt-4">
        <h1 className="font-serif text-4xl md:text-6xl text-luxury-gold tracking-widest uppercase drop-shadow-[0_0_15px_rgba(212,175,55,0.6)]">
          Grand Luxury
        </h1>
        <h2 className="font-serif text-xl md:text-2xl text-luxury-gold-light tracking-[0.3em] mt-2 border-b border-luxury-gold inline-block pb-2 px-8">
          CHRISTMAS REVEAL
        </h2>
      </div>

      {/* Controls */}
      <div className="mb-8 flex flex-col items-center pointer-events-auto">
        <button
          onClick={onToggle}
          className="group relative px-8 py-3 bg-luxury-green/80 backdrop-blur-md border border-luxury-gold text-luxury-gold font-serif tracking-widest uppercase transition-all duration-500 hover:bg-luxury-gold hover:text-luxury-green overflow-hidden"
        >
          <span className="relative z-10">
            {treeState === TreeState.CHAOS ? 'ASSEMBLE' : 'SHATTER'}
          </span>
          <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-luxury-gold shadow-[0_0_10px_#D4AF37]" />
        </button>
        
        <p className="mt-4 text-xs text-luxury-gold/50 font-serif tracking-widest uppercase">
          {treeState === TreeState.CHAOS ? 'Chaos Mode Active' : 'Formed Mode Active'}
        </p>
      </div>
    </div>
  );
};

export default Overlay;