import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T = string> {
  value: T;
  label: string;
}

interface CustomDropdownProps<T = string> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  prefixLabel?: string;
  minWidth?: string;
  maxWidth?: string;
  placeholder?: string;
  disabled?: boolean;
  dropDirection?: 'down' | 'up';
  style?: React.CSSProperties;
  className?: string;
}

export function CustomDropdown<T extends string | number = string>({
  value,
  options,
  onChange,
  prefixLabel,
  minWidth = '120px',
  maxWidth,
  placeholder = 'Select...',
  disabled = false,
  dropDirection = 'down',
  style,
  className = '',
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, selectedIndex]);

  const handleSelect = (val: T) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < options.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : options.length - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        handleSelect(options[highlightedIndex].value);
      }
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        minWidth,
        maxWidth,
        ...style,
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="yz-input"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '6px',
          height: '28px',
          padding: '0 8px',
          fontSize: '11px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: 'var(--yz-bg-surface)',
          border: isOpen ? '1px solid var(--yz-primary, #832729)' : '1px solid var(--yz-border)',
          borderRadius: 'var(--yz-radius-sm)',
          color: 'var(--yz-text-primary)',
          width: '100%',
          userSelect: 'none',
          boxSizing: 'border-box',
          opacity: disabled ? 0.6 : 1,
          transition: 'border-color 0.15s ease',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'left',
            flex: 1,
          }}
        >
          {prefixLabel && (
            <span style={{ color: 'var(--yz-text-muted)', marginRight: '4px' }}>
              {prefixLabel}
            </span>
          )}
          <span style={{ fontWeight: 500 }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown
          size={12}
          style={{
            color: isOpen ? 'var(--yz-primary, #832729)' : 'var(--yz-text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
          }}
        />
      </button>

      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          style={{
            position: 'absolute',
            ...(dropDirection === 'up'
              ? { bottom: 'calc(100% + 4px)', left: 0 }
              : { top: 'calc(100% + 4px)', left: 0 }),
            backgroundColor: 'var(--yz-bg-surface)',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-radius-sm)',
            boxShadow:
              dropDirection === 'up'
                ? '0 -4px 14px rgba(0, 0, 0, 0.08)'
                : '0 4px 14px rgba(0, 0, 0, 0.08)',
            zIndex: 100,
            minWidth: '100%',
            maxWidth: '320px',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '4px 0',
          }}
        >
          {options.map((opt, index) => {
            const isSelected = opt.value === value;
            const isHighlighted = index === highlightedIndex;

            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                onMouseEnter={() => setHighlightedIndex(index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '5px 10px',
                  fontSize: '11px',
                  textAlign: 'left',
                  border: 'none',
                  backgroundColor: isSelected
                    ? '#FEF2F2'
                    : isHighlighted
                    ? 'var(--yz-bg-subtle)'
                    : 'transparent',
                  color: isSelected ? 'var(--yz-primary, #832729)' : 'var(--yz-text-primary)',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  gap: '8px',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.label}</span>
                {isSelected && (
                  <Check size={12} style={{ color: 'var(--yz-primary, #832729)', flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
