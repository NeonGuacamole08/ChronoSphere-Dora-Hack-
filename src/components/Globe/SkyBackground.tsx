import React from 'react';

export const SkyBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#0d223f]">
      {/* 1. Upper Celestial Blue Space Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1b4374] via-[#102d52] to-[#0a1b32]" />

      {/* 2. Sweeping Dark Cosmic Event Horizon Arc (Behind the Globe) */}
      <div
        className="absolute w-[220vw] h-[120vh] -left-[60vw] top-[42%] rounded-[100%] bg-gradient-to-b from-[#040810] to-[#010308] border-t-2 border-cyan-500/20 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] pointer-events-none"
        style={{
          transform: 'rotate(-4deg)',
        }}
      />

      {/* 3. Glowing Atmospheric Azure Edge along the Cosmic Horizon */}
      <div
        className="absolute w-[220vw] h-[40px] -left-[60vw] top-[41.8%] rounded-[100%] bg-gradient-to-b from-cyan-500/15 to-transparent blur-md pointer-events-none"
        style={{
          transform: 'rotate(-4deg)',
        }}
      />

      {/* 4. Scattered Starfield & Delicate Space Dust */}
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage: `
            radial-gradient(2px 2px at 8% 15%, #ffffff 100%, transparent),
            radial-gradient(2.5px 2.5px at 18% 45%, #ffffff 100%, transparent),
            radial-gradient(1.5px 1.5px at 12% 70%, #bae6fd 100%, transparent),
            radial-gradient(2px 2px at 28% 22%, #ffffff 100%, transparent),
            radial-gradient(3px 3px at 22% 80%, #ffffff 100%, transparent),
            radial-gradient(1.5px 1.5px at 35% 60%, #7dd3fc 100%, transparent),
            radial-gradient(2px 2px at 72% 18%, #ffffff 100%, transparent),
            radial-gradient(2.5px 2.5px at 82% 38%, #ffffff 100%, transparent),
            radial-gradient(1.5px 1.5px at 92% 25%, #bae6fd 100%, transparent),
            radial-gradient(2px 2px at 88% 65%, #ffffff 100%, transparent),
            radial-gradient(3px 3px at 78% 75%, #ffffff 100%, transparent),
            radial-gradient(2px 2px at 95% 82%, #ffffff 100%, transparent),
            radial-gradient(1.5px 1.5px at 52% 12%, #ffffff 100%, transparent),
            radial-gradient(2px 2px at 62% 28%, #bae6fd 100%, transparent),
            radial-gradient(2.5px 2.5px at 4% 52%, #ffffff 100%, transparent),
            radial-gradient(1.5px 1.5px at 15% 92%, #ffffff 100%, transparent)
          `,
          backgroundSize: '100% 100%',
        }}
      />

      {/* 5. Soft Atmospheric Glows */}
      <div className="absolute top-10 left-1/3 w-[500px] h-[300px] rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-10 w-[450px] h-[350px] rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
    </div>
  );
};
