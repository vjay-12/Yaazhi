import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'warning';
  isLoading?: boolean;
  maxWidth?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  maxWidth = '420px',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element to restore focus on close
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Prevent body scrolling
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus first interactive element in modal after render
    const timer = setTimeout(() => {
      if (dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          // Focus the cancel or confirm button
          const target = focusable[focusable.length - 1] || focusable[0];
          target?.focus();
        }
      }
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        e.preventDefault();
        onClose();
        return;
      }

      // Trap focus inside modal
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const buttonVariant = variant === 'danger' ? 'danger' : 'primary';

  return createPortal(
    <div
      className="yz-modal-backdrop"
      style={{ zIndex: 1100 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <div
        ref={dialogRef}
        className="yz-modal"
        style={{
          maxWidth,
          backgroundColor: 'var(--yz-bg-surface, #ffffff)',
          borderRadius: 'var(--yz-radius-md, 8px)',
          boxShadow: 'var(--yz-shadow-modal, 0 10px 25px -4px rgba(15, 23, 42, 0.16))',
          border: '1px solid var(--yz-border, #E2E8F0)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--yz-border, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {variant === 'danger' && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  flexShrink: 0,
                }}
              >
                <AlertCircle size={14} />
              </span>
            )}
            <h2
              id="confirm-dialog-title"
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--yz-text-primary, #0F172A)',
                margin: 0,
              }}
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              color: 'var(--yz-text-muted, #94A3B8)',
              padding: '0.25rem',
              borderRadius: 'var(--yz-radius-sm, 4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease',
            }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div
          id="confirm-dialog-description"
          style={{
            padding: '1.25rem',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            color: 'var(--yz-text-secondary, #475569)',
          }}
        >
          {description && (
            <div style={{ margin: 0, color: 'var(--yz-text-primary, #0F172A)' }}>
              {description}
            </div>
          )}
          {children && <div style={{ marginTop: description ? '0.5rem' : 0 }}>{children}</div>}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid var(--yz-border, #E2E8F0)',
            backgroundColor: 'var(--yz-bg-subtle, #F8FAFC)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.5rem',
          }}
        >
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={buttonVariant}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
