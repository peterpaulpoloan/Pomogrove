
import React from 'react';

interface TreeVisualProps {
  level: number;
}

const TreeVisual: React.FC<TreeVisualProps> = ({ level }) => {
  // Level thresholds
  // 1-100: Sapling
  // 101-200: Small Tree
  // 201-300: Large Tree
  
  const getScale = () => {
    if (level < 100) return 0.5 + (level / 100) * 0.5; // Starts at 0.5x, reaches 1.0x at 100
    if (level < 200) return 1.0 + ((level - 100) / 100) * 0.5; // Reaches 1.5x
    return 1.5 + ((level - 200) / 100) * 0.5; // Reaches 2.0x
  };

  const getTreeColor = () => {
    if (level < 100) return '#10b981'; // Emerald 500
    if (level < 200) return '#059669'; // Emerald 600
    return '#065f46'; // Emerald 800
  };

  const scale = getScale();

  return (
    <div className="relative w-64 h-64 flex items-center justify-center transition-transform duration-500 ease-out" style={{ transform: `scale(${scale})` }}>
      <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-xl">
        {/* Trunk */}
        <path d="M90 190 L110 190 L105 140 L95 140 Z" fill="#5d4037" />
        
        {/* Leaves - Simple geometric representations for performance/clarity */}
        {level < 100 && (
          <g>
            <circle cx="100" cy="130" r="30" fill={getTreeColor()} opacity="0.9" />
            <circle cx="85" cy="145" r="20" fill={getTreeColor()} opacity="0.8" />
            <circle cx="115" cy="145" r="20" fill={getTreeColor()} opacity="0.8" />
          </g>
        )}

        {level >= 100 && level < 200 && (
          <g>
            <circle cx="100" cy="100" r="50" fill={getTreeColor()} opacity="0.9" />
            <circle cx="70" cy="130" r="40" fill={getTreeColor()} opacity="0.8" />
            <circle cx="130" cy="130" r="40" fill={getTreeColor()} opacity="0.8" />
            <circle cx="100" cy="140" r="30" fill={getTreeColor()} opacity="0.7" />
          </g>
        )}

        {level >= 200 && (
          <g>
            <circle cx="100" cy="80" r="60" fill={getTreeColor()} opacity="1" />
            <circle cx="60" cy="120" r="50" fill={getTreeColor()} opacity="0.9" />
            <circle cx="140" cy="120" r="50" fill={getTreeColor()} opacity="0.9" />
            <circle cx="80" cy="150" r="40" fill={getTreeColor()} opacity="0.8" />
            <circle cx="120" cy="150" r="40" fill={getTreeColor()} opacity="0.8" />
            {/* Added Fruit/Flowers for high level */}
            <circle cx="100" cy="60" r="5" fill="#f87171" />
            <circle cx="70" cy="100" r="5" fill="#f87171" />
            <circle cx="130" cy="100" r="5" fill="#f87171" />
          </g>
        )}
      </svg>
      <div className="absolute bottom-0 text-stone-400 font-mono text-xs uppercase tracking-widest">
        Level {level}
      </div>
    </div>
  );
};

export default TreeVisual;
