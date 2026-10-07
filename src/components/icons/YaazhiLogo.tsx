import React from 'react';

interface YaazhiLogoProps {
  collapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const YaazhiLogo: React.FC<YaazhiLogoProps> = ({ collapsed = false, size = 'md' }) => {
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 32 : 26;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : '8px' }}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, display: 'block' }}
      >
        <rect x="0.5" y="0.5" width="47" height="47" rx="7.5" fill="#852237" stroke="#6E1B2D" strokeWidth="1" />
        {/* Heritage Yaazhi Arch & Weave motif */}
        <path
          d="M12 36C12 26 17 21 24 21C31 21 36 26 36 36"
          stroke="#FDE68A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M24 10C27 10 30.5 12 31.5 15C33.5 13 36 14.5 36 17.5C36 21.5 31 23.5 27 23.5C23.5 23.5 20.5 21 20.5 18C20.5 14 24 10 24 10Z"
          fill="#FAF5EB"
          stroke="#C59B4E"
          strokeWidth="1"
        />
        <circle cx="28" cy="15.5" r="1.5" fill="#852237" />
        <path d="M16 29H32" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
        <circle cx="24" cy="33.5" r="1.5" fill="#FDE68A" />
      </svg>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span
            style={{
              fontFamily: "var(--yz-font-display)",
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.05em',
              color: 'var(--yz-text-primary)',
            }}
          >
            YAAZHI
          </span>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'var(--yz-gold)',
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

