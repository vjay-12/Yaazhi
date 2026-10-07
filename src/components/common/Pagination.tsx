import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Check,
} from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  itemLabel?: string;
  className?: string;
  showFirstLast?: boolean;
  style?: React.CSSProperties;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  itemLabel = 'records',
  className = '',
  showFirstLast = true,
  style,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Calculate pages and safe bounds
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // Auto-clamp page if currentPage exceeds totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      onPageChange(totalPages);
    }
  }, [currentPage, totalPages, onPageChange]);

  // Click outside to close rows-per-page dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  // Range calculation
  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate page numbers with smart ellipsis matching Invenaro
  const getPageNumbers = (): (number | 'ellipsis-left' | 'ellipsis-right')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis-left' | 'ellipsis-right')[] = [];
    const showLeftEllipsis = safeCurrentPage > 3;
    const showRightEllipsis = safeCurrentPage < totalPages - 2;

    // Always include page 1
    pages.push(1);

    if (showLeftEllipsis) {
      pages.push('ellipsis-left');
    }

    // Determine window around current page
    let start = Math.max(2, safeCurrentPage - 1);
    let end = Math.min(totalPages - 1, safeCurrentPage + 1);

    if (safeCurrentPage <= 3) {
      end = 4;
    } else if (safeCurrentPage >= totalPages - 2) {
      start = totalPages - 3;
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (showRightEllipsis) {
      pages.push('ellipsis-right');
    }

    // Always include last page
    pages.push(totalPages);

    return pages;
  };

  const handleSelectPageSize = (size: number) => {
    setIsDropdownOpen(false);
    onPageSizeChange(size);
    // Determine new safe page
    const newTotalPages = Math.max(1, Math.ceil(totalItems / size));
    if (safeCurrentPage > newTotalPages) {
      onPageChange(newTotalPages);
    }
  };

  return (
    <div
      className={`yz-pagination-footer ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '7px 12px',
        backgroundColor: 'var(--yz-bg-surface)',
        borderTop: '1px solid var(--yz-border)',
        fontSize: '11px',
        color: 'var(--yz-text-secondary)',
        userSelect: 'none',
        gap: '12px',
        flexWrap: 'wrap',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Left side: Range information and Rows per page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span className="tabular-nums" style={{ color: 'var(--yz-text-secondary)' }}>
          Showing{' '}
          <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
            {totalItems === 0 ? '0' : `${startIndex}–${endIndex}`}
          </strong>{' '}
          of{' '}
          <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
            {totalItems}
          </strong>{' '}
          {itemLabel}
        </span>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            paddingLeft: '10px',
            borderLeft: '1px solid var(--yz-border)',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', whiteSpace: 'nowrap' }}>
            Rows per page:
          </span>

          {/* Upward-Opening Dropup Selector */}
          <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="listbox"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '5px',
                height: '28px',
                padding: '0 8px',
                minWidth: '64px',
                fontSize: '11.5px',
                fontFamily: 'var(--yz-font-mono)',
                fontWeight: 600,
                color: 'var(--yz-text-primary)',
                backgroundColor: 'var(--yz-bg-surface)',
                border: isDropdownOpen
                  ? '1px solid var(--yz-primary, #852237)'
                  : '1px solid var(--yz-border)',
                borderRadius: 'var(--yz-radius-sm, 8px)',
                boxShadow: isDropdownOpen ? '0 0 0 2px rgba(133, 34, 55, 0.12)' : 'var(--yz-shadow-2xs)',
                cursor: 'pointer',
                transition: 'all 0.14s ease',
              }}
            >
              <span>{pageSize}</span>
              <ChevronDown
                size={12}
                style={{
                  color: isDropdownOpen ? 'var(--yz-primary, #852237)' : 'var(--yz-text-muted)',
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                }}
              />
            </button>

            {/* Dropup Menu: Opens Upward with 12px curvature */}
            {isDropdownOpen && (
              <div
                role="listbox"
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: 'calc(100% + 4px)',
                  width: '100px',
                  backgroundColor: 'var(--yz-bg-surface)',
                  border: '1px solid var(--yz-border)',
                  borderRadius: 'var(--yz-radius-lg, 12px)',
                  boxShadow: 'var(--yz-shadow-lg)',
                  zIndex: 100,
                  padding: '4px',
                }}
              >
                <div
                  style={{
                    padding: '3px 8px',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    color: 'var(--yz-text-muted)',
                    borderBottom: '1px solid var(--yz-border)',
                    marginBottom: '2px',
                  }}
                >
                  Page Size
                </div>
                {pageSizeOptions.map((opt) => {
                  const isSelected = opt === pageSize;
                  return (
                    <button
                      key={opt}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectPageSize(opt)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '5px 8px',
                        fontSize: '11px',
                        fontFamily: 'var(--yz-font-mono)',
                        border: 'none',
                        borderRadius: 'var(--yz-radius-xs, 6px)',
                        backgroundColor: isSelected ? 'var(--yz-primary-subtle, #FDF2F4)' : 'transparent',
                        color: isSelected ? 'var(--yz-primary, #852237)' : 'var(--yz-text-primary)',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.1s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--yz-bg-subtle)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span>{opt} rows</span>
                      {isSelected && (
                        <Check size={11} style={{ color: 'var(--yz-primary, #852237)' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Compact Pagination Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        {/* First Page button */}
        {showFirstLast && (
          <button
            type="button"
            disabled={safeCurrentPage <= 1}
            onClick={() => onPageChange(1)}
            title="First page"
            aria-label="First page"
            style={{
              width: '28px',
              height: '28px',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--yz-border)',
              borderRadius: 'var(--yz-radius-sm, 8px)',
              backgroundColor: 'var(--yz-bg-surface)',
              color: safeCurrentPage <= 1 ? 'var(--yz-text-muted)' : 'var(--yz-text-primary)',
              opacity: safeCurrentPage <= 1 ? 0.35 : 1,
              cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.12s ease',
            }}
          >
            <ChevronsLeft size={13} />
          </button>
        )}

        {/* Previous Page button */}
        <button
          type="button"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          title="Previous page"
          aria-label="Previous page"
          style={{
            width: '28px',
            height: '28px',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-radius-sm, 8px)',
            backgroundColor: 'var(--yz-bg-surface)',
            color: safeCurrentPage <= 1 ? 'var(--yz-text-muted)' : 'var(--yz-text-primary)',
            opacity: safeCurrentPage <= 1 ? 0.35 : 1,
            cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.12s ease',
          }}
        >
          <ChevronLeft size={13} />
        </button>

        {/* Numeric Page Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', margin: '0 2px' }}>
          {getPageNumbers().map((pageItem, idx) => {
            if (typeof pageItem === 'string') {
              return (
                <span
                  key={`${pageItem}-${idx}`}
                  style={{
                    padding: '0 2px',
                    color: 'var(--yz-text-muted)',
                    fontSize: '11px',
                    fontFamily: 'var(--yz-font-mono)',
                    userSelect: 'none',
                  }}
                >
                  …
                </span>
              );
            }

            const isCurrent = safeCurrentPage === pageItem;
            return (
              <button
                key={pageItem}
                type="button"
                onClick={() => onPageChange(pageItem)}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Page ${pageItem}`}
                style={{
                  minWidth: '28px',
                  height: '28px',
                  padding: '0 5px',
                  borderRadius: 'var(--yz-radius-sm, 8px)',
                  fontSize: '11px',
                  fontFamily: 'var(--yz-font-mono)',
                  fontWeight: isCurrent ? 700 : 600,
                  backgroundColor: isCurrent ? 'var(--yz-primary, #852237)' : 'var(--yz-bg-surface)',
                  color: isCurrent ? '#ffffff' : 'var(--yz-text-primary)',
                  border: isCurrent
                    ? '1px solid var(--yz-primary, #852237)'
                    : '1px solid var(--yz-border)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isCurrent ? 'var(--yz-shadow-2xs)' : 'none',
                  transition: 'all 0.12s ease',
                }}
              >
                {pageItem}
              </button>
            );
          })}
        </div>

        {/* Next Page button */}
        <button
          type="button"
          disabled={safeCurrentPage >= totalPages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          title="Next page"
          aria-label="Next page"
          style={{
            width: '28px',
            height: '28px',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-radius-sm, 8px)',
            backgroundColor: 'var(--yz-bg-surface)',
            color: safeCurrentPage >= totalPages ? 'var(--yz-text-muted)' : 'var(--yz-text-primary)',
            opacity: safeCurrentPage >= totalPages ? 0.35 : 1,
            cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
            transition: 'all 0.12s ease',
          }}
        >
          <ChevronRight size={13} />
        </button>

        {/* Last Page button */}
        {showFirstLast && (
          <button
            type="button"
            disabled={safeCurrentPage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            title="Last page"
            aria-label="Last page"
            style={{
              width: '28px',
              height: '28px',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--yz-border)',
              borderRadius: 'var(--yz-radius-sm, 8px)',
              backgroundColor: 'var(--yz-bg-surface)',
              color: safeCurrentPage >= totalPages ? 'var(--yz-text-muted)' : 'var(--yz-text-primary)',
              opacity: safeCurrentPage >= totalPages ? 0.35 : 1,
              cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
              transition: 'all 0.12s ease',
            }}
          >
            <ChevronsRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
};
