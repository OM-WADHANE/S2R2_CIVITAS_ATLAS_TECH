// components/CiviAIIcon.tsx
// Hexagon with rotating Gemini star inside - purple themed, glowing
"use client";

interface CiviAIIconProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export default function CiviAIIcon({ size = 32, className = "", animated = true }: CiviAIIconProps) {
  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="civi-icon"
      >
        {/* Dark background circle */}
        <circle cx="28" cy="28" r="27" fill="#0a0a0a" />
        
        {/* Outer glow */}
        <circle cx="28" cy="28" r="26" fill="url(#civiGlow)" opacity="0.3" />
        
        {/* Static Hexagon border - thick, glowing */}
        <path
          d="M 28 6 L 44 15 L 44 35 L 28 44 L 12 35 L 12 15 Z"
          stroke="url(#hexGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="hex-glow"
        />
        
        {/* Rotating Gemini star inside */}
        <g className={animated ? "star-rotate" : ""} style={{ transformOrigin: "28px 28px" }}>
          {/* Main star shape - 4-pointed diamond */}
          <path
            d="M 28 12 
               C 30 16, 36 22, 44 28
               C 36 34, 30 40, 28 44
               C 26 40, 20 34, 12 28
               C 20 22, 26 16, 28 12 Z"
            fill="url(#starGradient)"
          />
          
          {/* Inner highlight on star */}
          <path
            d="M 28 16
               C 29 19, 32 23, 38 28
               C 32 33, 29 37, 28 40
               C 27 37, 24 33, 18 28
               C 24 23, 27 19, 28 16 Z"
            fill="url(#starHighlight)"
            opacity="0.5"
          />
        </g>
        
        {/* Center sparkle - always on top */}
        <circle cx="28" cy="28" r="3" fill="white" opacity="0.95" className={animated ? "sparkle" : ""} />
        
        {/* Gradient definitions */}
        <defs>
          {/* Hexagon gradient */}
          <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
          
          {/* Star gradient - purple theme */}
          <radialGradient id="starGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#c084fc" />
          </radialGradient>
          
          {/* Star highlight */}
          <radialGradient id="starHighlight" cx="50%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#e9d5ff" />
            <stop offset="100%" stopColor="#c084fc" />
          </radialGradient>
          
          {/* Outer glow */}
          <radialGradient id="civiGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#7c3aed" opacity="0" />
          </radialGradient>
        </defs>
      </svg>
      
      <style jsx>{`
        .civi-icon {
          filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.7)) 
                  drop-shadow(0 0 20px rgba(124, 58, 237, 0.5));
        }
        
        .hex-glow {
          filter: drop-shadow(0 0 4px rgba(168, 85, 247, 0.8));
        }
        
        @keyframes star-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 0.95; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        
        .star-rotate {
          animation: star-rotate 8s linear infinite;
        }
        
        .sparkle {
          animation: sparkle 2s ease-in-out infinite;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
}
