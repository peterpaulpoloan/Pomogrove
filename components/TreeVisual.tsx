import React, { useMemo } from 'react';

interface TreeVisualProps {
  level: number;
}

// Seeded pseudo-random for stable leaf positions
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const TreeVisual: React.FC<TreeVisualProps> = ({ level }) => {
  const clampedLevel = Math.max(1, Math.min(level, 300));

  // ── Stage & milestone ───────────────────────────────────────────────────
  const stage = clampedLevel < 100 ? 'sapling' : clampedLevel < 200 ? 'young' : 'ancient';
  const milestone = Math.floor(clampedLevel / 10); // 0-29, changes every 10 levels

  // ── Colors per milestone ────────────────────────────────────────────────
  const leafColors = useMemo(() => {
    const palettes = [
      // Sapling (0–9 milestones)
      ['#a7f3d0','#6ee7b7'],['#6ee7b7','#34d399'],['#34d399','#10b981'],
      ['#10b981','#059669'],['#059669','#047857'],
      ['#6ee7b7','#34d399'],['#34d399','#10b981'],['#10b981','#059669'],
      ['#a7f3d0','#059669'],['#86efac','#22c55e'],
      // Young (10–19 milestones)
      ['#059669','#065f46'],['#065f46','#064e3b'],['#047857','#134e4a'],
      ['#0d9488','#065f46'],['#115e59','#064e3b'],
      ['#059669','#047857'],['#047857','#065f46'],['#065f46','#064e3b'],
      ['#10b981','#047857'],['#34d399','#065f46'],
      // Ancient (20–29 milestones)
      ['#064e3b','#022c22'],['#022c22','#14532d'],['#14532d','#166534'],
      ['#166534','#15803d'],['#15803d','#16a34a'],
      ['#064e3b','#14532d'],['#14532d','#166534'],['#166534','#15803d'],
      ['#166534','#4ade80'],['#065f46','#4ade80'],
    ];
    return palettes[Math.min(milestone, palettes.length - 1)];
  }, [milestone]);

  const trunkColor = milestone < 10 ? '#92400e' : milestone < 20 ? '#78350f' : '#431407';
  const trunkDark  = milestone < 10 ? '#78350f' : milestone < 20 ? '#431407' : '#1c0701';

  // ── Fruit/flower accent per milestone ──────────────────────────────────
  const accentColor = [
    null, null, null, '#fbbf24', null,
    '#fb7185', null, '#a78bfa', null, '#38bdf8',
    null, '#fde68a', null, '#f97316', null,
    '#c084fc', null, '#67e8f9', null, '#fda4af',
    '#fbbf24', '#fb923c', '#a3e635', '#f472b6', '#818cf8',
    '#22d3ee', '#facc15', '#e879f9', '#4ade80', '#f87171',
  ][milestone] ?? null;

  // ── Leaf cluster count grows with milestone ─────────────────────────────
  const clusterCount = 3 + Math.floor(milestone * 0.8);

  // ── Trunk path: thicker & taller with stage ────────────────────────────
  const trunkH    = stage === 'sapling' ? 55 : stage === 'young' ? 75 : 90;
  const trunkW    = stage === 'sapling' ? 8  : stage === 'young' ? 11 : 15;
  const trunkY    = 185;

  // ── Crown center drifts up as tree grows ──────────────────────────────
  const crownCY = stage === 'sapling' ? 140 : stage === 'young' ? 115 : 90;
  const crownR  = stage === 'sapling'
    ? 28 + (clampedLevel % 100) * 0.15
    : stage === 'young'
    ? 44 + ((clampedLevel - 100) % 100) * 0.18
    : 60 + ((clampedLevel - 200) % 100) * 0.22;

  // ── Generate leaf clusters ─────────────────────────────────────────────
  const clusters = useMemo(() => {
    const rand = seededRand(milestone * 31 + 7);
    const result = [];
    for (let i = 0; i < clusterCount; i++) {
      const angle = (i / clusterCount) * Math.PI * 2 + rand() * 0.4 - 0.2;
      const dist  = crownR * (0.3 + rand() * 0.55);
      const cx    = 100 + Math.cos(angle) * dist;
      const cy    = crownCY + Math.sin(angle) * dist * 0.7;
      const r     = crownR * (0.35 + rand() * 0.35);
      const opacity = 0.72 + rand() * 0.28;
      result.push({ cx, cy, r, opacity });
    }
    return result;
  }, [milestone, clusterCount, crownR, crownCY]);

  // ── Generate fruit/flower dots ─────────────────────────────────────────
  const accents = useMemo(() => {
    if (!accentColor) return [];
    const rand = seededRand(milestone * 13 + 3);
    const count = 3 + Math.floor(milestone * 0.4);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + rand() * 0.5;
      const dist  = crownR * (0.2 + rand() * 0.7);
      return {
        cx: 100 + Math.cos(angle) * dist,
        cy: crownCY + Math.sin(angle) * dist * 0.7,
        r: 3 + rand() * 3,
      };
    });
  }, [milestone, accentColor, crownR, crownCY]);

  // ── Root flares ────────────────────────────────────────────────────────
  const rootFlare = stage !== 'sapling';

  // ── Ground shadow ellipse ──────────────────────────────────────────────
  const shadowRx = 20 + milestone * 1.5;

  // ── Stage label ────────────────────────────────────────────────────────
  const stageLabel =
    clampedLevel < 10  ? 'Seedling' :
    clampedLevel < 30  ? 'Sprout'   :
    clampedLevel < 60  ? 'Sapling'  :
    clampedLevel < 100 ? 'Shrub'    :
    clampedLevel < 130 ? 'Sapling Tree' :
    clampedLevel < 160 ? 'Young Tree'   :
    clampedLevel < 200 ? 'Tree'         :
    clampedLevel < 230 ? 'Tall Tree'    :
    clampedLevel < 270 ? 'Great Tree'   :
                         'Ancient Grove';

  // ── Overall scale (subtle, 0.82→1.0 over 300 levels) ─────────────────
  const scale = 0.82 + (clampedLevel / 300) * 0.18;

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none"
      style={{ width: 240, height: 240 }}
    >
      <svg
        width="220"
        height="220"
        viewBox="0 0 200 200"
        style={{
          transform: `scale(${scale})`,
          transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',
          filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.18))',
          overflow: 'visible',
        }}
      >
        {/* Defs: radial gradient for crown depth */}
        <defs>
          <radialGradient id={`crownGrad-${milestone}`} cx="40%" cy="35%" r="65%">
            <stop offset="0%"   stopColor={leafColors[0]} stopOpacity="1" />
            <stop offset="100%" stopColor={leafColors[1]} stopOpacity="1" />
          </radialGradient>
          <radialGradient id="trunkGrad" cx="30%" cy="50%" r="70%">
            <stop offset="0%"   stopColor={trunkColor} />
            <stop offset="100%" stopColor={trunkDark}  />
          </radialGradient>
          <filter id="leafBlur">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="100" cy="193" rx={shadowRx} ry="5" fill="#00000018" />

        {/* Root flares for young/ancient */}
        {rootFlare && (
          <>
            <path d={`M${100 - trunkW} ${trunkY} Q${100 - trunkW - 14} ${trunkY + 4} ${100 - trunkW - 22} ${trunkY + 8}`}
              stroke={trunkDark} strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d={`M${100 + trunkW} ${trunkY} Q${100 + trunkW + 14} ${trunkY + 4} ${100 + trunkW + 22} ${trunkY + 8}`}
              stroke={trunkDark} strokeWidth="5" fill="none" strokeLinecap="round" />
            {stage === 'ancient' && <>
              <path d={`M${100 - trunkW * 0.5} ${trunkY} Q${100 - 28} ${trunkY + 6} ${100 - 38} ${trunkY + 10}`}
                stroke={trunkColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d={`M${100 + trunkW * 0.5} ${trunkY} Q${100 + 28} ${trunkY + 6} ${100 + 38} ${trunkY + 10}`}
                stroke={trunkColor} strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </>}
          </>
        )}

        {/* Trunk */}
        <path
          d={`M${100 - trunkW} ${trunkY} 
              C${100 - trunkW} ${trunkY - trunkH * 0.4} ${100 - trunkW * 0.7} ${trunkY - trunkH * 0.7} 100 ${trunkY - trunkH}
              C${100 + trunkW * 0.7} ${trunkY - trunkH * 0.7} ${100 + trunkW} ${trunkY - trunkH * 0.4} ${100 + trunkW} ${trunkY} Z`}
          fill="url(#trunkGrad)"
        />

        {/* Bark texture lines */}
        {[0.25, 0.5, 0.72].map((t, i) => (
          <path
            key={i}
            d={`M${100 - trunkW * (1 - t * 0.3) + 2} ${trunkY - trunkH * t} Q100 ${trunkY - trunkH * t - 4} ${100 + trunkW * (1 - t * 0.3) - 2} ${trunkY - trunkH * t}`}
            stroke={trunkDark} strokeWidth="1" fill="none" opacity="0.35"
          />
        ))}

        {/* Branch stubs for young/ancient */}
        {stage !== 'sapling' && (
          <>
            <path d={`M100 ${trunkY - trunkH * 0.6} Q${100 - 18} ${trunkY - trunkH * 0.65} ${100 - 28} ${trunkY - trunkH * 0.72}`}
              stroke={trunkColor} strokeWidth={stage === 'ancient' ? 5 : 3.5} fill="none" strokeLinecap="round" />
            <path d={`M100 ${trunkY - trunkH * 0.55} Q${100 + 16} ${trunkY - trunkH * 0.61} ${100 + 26} ${trunkY - trunkH * 0.69}`}
              stroke={trunkColor} strokeWidth={stage === 'ancient' ? 4.5 : 3} fill="none" strokeLinecap="round" />
          </>
        )}
        {stage === 'ancient' && (
          <>
            <path d={`M100 ${trunkY - trunkH * 0.4} Q${100 - 22} ${trunkY - trunkH * 0.44} ${100 - 36} ${trunkY - trunkH * 0.52}`}
              stroke={trunkDark} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d={`M100 ${trunkY - trunkH * 0.35} Q${100 + 20} ${trunkY - trunkH * 0.39} ${100 + 33} ${trunkY - trunkH * 0.48}`}
              stroke={trunkDark} strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* Soft bloom behind crown for depth */}
        <circle
          cx="100" cy={crownCY}
          r={crownR * 1.18}
          fill={leafColors[1]}
          opacity="0.22"
          filter="url(#leafBlur)"
        />

        {/* Leaf clusters */}
        {clusters.map((c, i) => (
          <circle
            key={i}
            cx={c.cx} cy={c.cy} r={c.r}
            fill={`url(#crownGrad-${milestone})`}
            opacity={c.opacity}
          />
        ))}

        {/* Central crown cap */}
        <circle
          cx="100" cy={crownCY - crownR * 0.12}
          r={crownR * 0.72}
          fill={`url(#crownGrad-${milestone})`}
          opacity="0.95"
        />

        {/* Crown highlight shimmer */}
        <ellipse
          cx={95} cy={crownCY - crownR * 0.3}
          rx={crownR * 0.28} ry={crownR * 0.16}
          fill="white" opacity="0.14"
        />

        {/* Fruit / flowers */}
        {accents.map((a, i) => (
          <g key={i}>
            <circle cx={a.cx} cy={a.cy} r={a.r + 1.5} fill="white" opacity="0.35" />
            <circle cx={a.cx} cy={a.cy} r={a.r} fill={accentColor!} opacity="0.92" />
            <circle cx={a.cx - a.r * 0.3} cy={a.cy - a.r * 0.3} r={a.r * 0.3} fill="white" opacity="0.4" />
          </g>
        ))}

        {/* Milestone sparkle: small star burst every 10 levels */}
        {clampedLevel % 10 === 0 && clampedLevel > 0 && (
          <g transform={`translate(100, ${crownCY - crownR - 12})`}>
            {[0,60,120,180,240,300].map((deg, i) => {
              const r1 = 7, r2 = 3.5;
              const a1 = (deg * Math.PI) / 180;
              const a2 = ((deg + 30) * Math.PI) / 180;
              return (
                <line key={i}
                  x1={Math.cos(a1) * r2} y1={Math.sin(a1) * r2}
                  x2={Math.cos(a1) * r1} y2={Math.sin(a1) * r1}
                  stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round"
                  opacity="0.9"
                />
              );
            })}
            <circle cx="0" cy="0" r="2.5" fill="#fde68a" opacity="0.95" />
          </g>
        )}
      </svg>

      {/* Label */}
      <div className="flex flex-col items-center gap-0.5 mt-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
          {stageLabel}
        </span>
        <span className="text-[9px] text-stone-300 tracking-widest font-mono">
          Lv. {clampedLevel}
        </span>
      </div>
    </div>
  );
};

export default TreeVisual;