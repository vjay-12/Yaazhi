import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface ThemeToggleProps {
  style?: React.CSSProperties;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ style, className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`yz-btn yz-btn-secondary yz-btn-sm ${className}`}
      style={{
        width: '32px',
        height: '32px',
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--yz-text-secondary)',
        borderRadius: 'var(--yz-radius-md, 10px)',
        flexShrink: 0,
        cursor: 'pointer',
        boxSizing: 'border-box',
        ...style,
      }}
      title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      aria-label="Toggle dark/light theme"
    >
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
};
