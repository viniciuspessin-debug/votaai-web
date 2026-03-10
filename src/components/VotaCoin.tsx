export default function VotaCoin({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="coinGold" cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#FFF176" />
          <stop offset="35%" stopColor="#FFD700" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#92400E" />
        </radialGradient>
        <radialGradient id="coinShine" cx="30%" cy="25%" r="45%">
          <stop offset="0%" stopColor="white" stopOpacity="0.6" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <filter id="coinShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#92400E" floodOpacity="0.5" />
        </filter>
      </defs>
      {/* Shadow */}
      <ellipse cx="16" cy="18" rx="12" ry="3" fill="rgba(0,0,0,0.3)" />
      {/* Coin body */}
      <circle cx="16" cy="15" r="13" fill="url(#coinGold)" filter="url(#coinShadow)" />
      {/* Rim */}
      <circle cx="16" cy="15" r="13" fill="none" stroke="#B45309" strokeWidth="1" />
      {/* Inner ring */}
      <circle cx="16" cy="15" r="10.5" fill="none" stroke="#FDE68A" strokeWidth="0.7" opacity="0.7" />
      {/* V$ text */}
      <text x="16" y="20.5" textAnchor="middle" fill="#7C2D12" fontSize="9.5" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif">V$</text>
      {/* Shine */}
      <circle cx="16" cy="15" r="13" fill="url(#coinShine)" />
    </svg>
  );
}
