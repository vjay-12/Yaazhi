import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import type { YaazhiProduct } from '../../types/product';

export interface ProductSearchDropdownProps {
  products: YaazhiProduct[];
  selectedProductId: string;
  onSelect: (product: YaazhiProduct) => void;
  disabledProductIds?: string[];
  placeholder?: string;
  disabled?: boolean;
}

export const ProductSearchDropdown: React.FC<ProductSearchDropdownProps> = ({
  products,
  selectedProductId,
  onSelect,
  disabledProductIds = [],
  placeholder = 'Select product from catalog...',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Alphabetically sorted products
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    );
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return sortedProducts;
    const q = searchQuery.toLowerCase().trim();
    return sortedProducts.filter((p) => {
      const sku = (p.sku || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      const category = (p.category || '').toLowerCase();
      const craft = (p.craft || '').toLowerCase();
      return sku.includes(q) || name.includes(q) || category.includes(q) || craft.includes(q);
    });
  }, [sortedProducts, searchQuery]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Click outside to close
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

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-product-option]');
      if (items[highlightedIndex]) {
        (items[highlightedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        filteredProducts.length === 0 ? 0 : (prev + 1) % filteredProducts.length
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        filteredProducts.length === 0
          ? 0
          : (prev - 1 + filteredProducts.length) % filteredProducts.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const prod = filteredProducts[highlightedIndex];
      if (prod && !disabledProductIds.includes(prod.id)) {
        onSelect(prod);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      style={{ position: 'relative', width: '100%' }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          height: 'var(--yz-control-height-md, 34px)',
          padding: '0 10px',
          borderRadius: 'var(--yz-input-radius, 12px)',
          border: isOpen ? '1px solid var(--yz-primary, #852237)' : '1px solid var(--yz-border)',
          backgroundColor: 'var(--yz-bg-surface)',
          boxShadow: isOpen ? '0 0 0 2px rgba(133, 34, 55, 0.12)' : 'var(--yz-shadow-2xs)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          fontSize: '12px',
          color: 'var(--yz-text-primary)',
          boxSizing: 'border-box',
          transition: 'all 0.14s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            minWidth: 0,
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {selectedProduct ? (
            <>
              <span
                style={{
                  fontFamily: 'var(--yz-font-mono)',
                  fontWeight: 700,
                  fontSize: '10px',
                  color: 'var(--yz-primary, #852237)',
                  backgroundColor: 'var(--yz-primary-subtle, #FDF2F4)',
                  padding: '2px 6px',
                  borderRadius: 'var(--yz-radius-xs, 6px)',
                  flexShrink: 0,
                }}
              >
                {selectedProduct.sku}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={selectedProduct.name}
              >
                {selectedProduct.name}
              </span>
              <span
                style={{
                  fontSize: '10.5px',
                  color: 'var(--yz-text-muted)',
                  flexShrink: 0,
                }}
              >
                • {selectedProduct.currentStock} in stock
              </span>
            </>
          ) : (
            <span style={{ color: 'var(--yz-text-muted)', fontStyle: 'italic' }}>
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          size={13}
          style={{
            flexShrink: 0,
            color: 'var(--yz-text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--yz-bg-surface)',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-dropdown-radius, 12px)',
            boxShadow: 'var(--yz-shadow-lg)',
            zIndex: 90,
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            maxHeight: '270px',
            minWidth: '280px',
          }}
        >
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--yz-text-muted)',
              }}
            />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search product name, SKU, weave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="yz-input"
              style={{
                height: '30px',
                fontSize: '11.5px',
                paddingLeft: '28px',
                borderRadius: 'var(--yz-radius-sm, 8px)',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* List of Products */}
          <div
            ref={listRef}
            style={{
              overflowY: 'auto',
              maxHeight: '190px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            {filteredProducts.length === 0 ? (
              <div
                style={{
                  padding: '8px',
                  fontSize: '11px',
                  color: 'var(--yz-text-muted)',
                  textAlign: 'center',
                }}
              >
                No matching products in catalog
              </div>
            ) : (
              filteredProducts.map((p, idx) => {
                const isSelected = selectedProductId === p.id;
                const isAlreadyAdded = disabledProductIds.includes(p.id) && !isSelected;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={p.id}
                    data-product-option
                    type="button"
                    disabled={isAlreadyAdded}
                    onClick={() => {
                      if (!isAlreadyAdded) {
                        onSelect(p);
                        setIsOpen(false);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: 'var(--yz-radius-sm, 8px)',
                      border: 'none',
                      backgroundColor: isSelected
                        ? 'var(--yz-primary-subtle, #FDF2F4)'
                        : isHighlighted
                        ? 'var(--yz-bg-subtle)'
                        : 'transparent',
                      cursor: isAlreadyAdded ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      fontSize: '11.5px',
                      opacity: isAlreadyAdded ? 0.45 : 1,
                      color: isSelected ? 'var(--yz-primary, #852237)' : 'var(--yz-text-primary)',
                      gap: '8px',
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '2px',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--yz-font-mono)',
                            fontWeight: 700,
                            fontSize: '9.5px',
                            color: isSelected ? 'var(--yz-primary, #852237)' : 'var(--yz-text-secondary)',
                            backgroundColor: '#F1F5F9',
                            padding: '2px 5px',
                            borderRadius: 'var(--yz-radius-xs, 6px)',
                          }}
                        >
                          {p.sku}
                        </span>
                        <span
                          style={{
                            fontWeight: isSelected ? 600 : 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {p.name}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'var(--yz-text-muted)',
                          display: 'flex',
                          gap: '6px',
                        }}
                      >
                        <span>{p.category}</span>
                        <span>•</span>
                        <span>Stock: {p.currentStock}</span>
                        <span>•</span>
                        <span style={{ fontFamily: 'var(--yz-font-mono)' }}>
                          Cost: ₹{p.costPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      {isAlreadyAdded ? (
                        <span
                          style={{
                            fontSize: '9.5px',
                            color: 'var(--yz-text-muted)',
                            backgroundColor: '#E2E8F0',
                            padding: '1px 4px',
                            borderRadius: '2px',
                          }}
                        >
                          Added
                        </span>
                      ) : isSelected ? (
                        <Check size={13} style={{ color: 'var(--yz-primary, #832729)' }} />
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
