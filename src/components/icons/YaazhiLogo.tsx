import React from 'react';

interface YaazhiLogoProps {
  collapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const YaazhiLogo: React.FC<YaazhiLogoProps> = ({ collapsed = false, size = 'md' }) => {
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 42 : 34;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <rect width="48" height="48" rx="10" fill="#241C1B" stroke="#3D3130" strokeWidth="1.5" />
        {/* Ornate Dravidian Arch */}
        <path
          d="M12 36C12 26 17 21 24 21C31 21 36 26 36 36"
          stroke="#BD8D39"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Heritage Yaazhi Crest Motif */}
        <path
          d="M24 10C27 10 30.5 12 31.5 15C33.5 13 36 14.5 36 17.5C36 21.5 31 23.5 27 23.5C23.5 23.5 20.5 21 20.5 18C20.5 14 24 10 24 10Z"
          fill="#852237"
          stroke="#C59B4E"
          strokeWidth="1"
        />
        <circle cx="28" cy="15.5" r="1.5" fill="#FAF5EB" />
        <path d="M16 29H32" stroke="#BD8D39" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        <circle cx="24" cy="33.5" r="1.5" fill="#C59B4E" />
      </svg>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span
            style={{
              fontFamily: "var(--yz-font-display)",
              fontWeight: 700,
              fontSize: size === 'sm' ? '1rem' : size === 'lg' ? '1.4rem' : '1.18rem',
              letterSpacing: '0.06em',
              color: '#FFFFFF',
            }}
          >
            YAAZHI
          </span>
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: 'var(--yz-gold)',
              marginTop: '0.15rem',
              textTransform: 'uppercase',
            }}
          >
            Boutique & Atelier
          </span>
        </div>
      )}
    </div>
  );
};
