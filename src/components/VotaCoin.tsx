export default function VotaCoin({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="coinGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="50%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#14532D" />
        </radialGradient>
        <radialGradient id="shineGrad" cx="35%" cy="30%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.35" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Coin shadow */}
      <ellipse cx="16" cy="17" rx="13" ry="3" fill="rgba(0,0,0,0.25)" />
      {/* Coin body */}
      <circle cx="16" cy="15" r="13" fill="url(#coinGrad)" />
      {/* Coin edge */}
      <circle cx="16" cy="15" r="13" fill="none" stroke="#15803D" strokeWidth="1" />
      {/* Inner ring */}
      <circle cx="16" cy="15" r="10" fill="none" stroke="#22C55E" strokeWidth="0.8" opacity="0.6" />
      {/* R$ symbol */}
      <text x="16" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="900" fontFamily="Arial, sans-serif" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>R$</text>
      {/* Shine overlay */}
      <circle cx="16" cy="15" r="13" fill="url(#shineGrad)" />
    </svg>
  );
}
