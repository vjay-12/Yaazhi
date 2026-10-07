import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | string;
  bodyPadding?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth,
  size = 'md',
  bodyPadding,
}) => {
  const sizeMap: Record<string, string> = {
    sm: '440px',
    md: '580px',
    lg: '760px',
    xl: '960px',
  };
  const effectiveMaxWidth = maxWidth || sizeMap[size] || '580px';
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="yz-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="yz-modal" style={{ maxWidth: effectiveMaxWidth }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--yz-border)',
            backgroundColor: 'var(--yz-bg-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <h2
              id="modal-title"
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: 'var(--yz-text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                margin: 0,
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                style={{
                  fontSize: '11.5px',
                  color: 'var(--yz-text-muted)',
                  marginTop: '2px',
                  fontWeight: 500,
                  lineHeight: 1.35,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--yz-text-muted)',
              padding: '4px',
              borderRadius: 'var(--yz-radius-sm, 8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.12s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--yz-bg-subtle-hover, #E2E8F0)';
              e.currentTarget.style.color = 'var(--yz-text-primary, #0F172A)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--yz-text-muted)';
            }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: bodyPadding || '18px', overflowY: 'auto', flex: 1 }}>{children}</div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid var(--yz-border)',
              backgroundColor: 'var(--yz-bg-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
