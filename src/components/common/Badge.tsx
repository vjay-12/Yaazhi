import React from 'react';
import type { StockStatus } from '../../types/product';

interface StockBadgeProps {
  status: StockStatus | 'ARCHIVED';
  stockCount?: number;
}

export const StockBadge: React.FC<StockBadgeProps> = ({ status, stockCount }) => {
  if (status === 'ARCHIVED') {
    return (
      <span
        className="yz-badge"
        style={{
          backgroundColor: '#F1F5F9',
          color: '#64748B',
          border: '1px solid #CBD5E1',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
        title="Product archived from active catalog"
      >
        <span className="yz-badge-dot" style={{ backgroundColor: '#94A3B8' }} />
        Archived
      </span>
    );
  }

  if (status === 'OUT_OF_STOCK') {
    return (
      <span className="yz-badge yz-badge-out-stock" title="Inventory depleted">
        <span className="yz-badge-dot" />
        Out of Stock
      </span>
    );
  }

  if (status === 'LOW_STOCK') {
    return (
      <span className="yz-badge yz-badge-low-stock" title="Stock running below reorder threshold">
        <span className="yz-badge-dot" />
        Low Stock {stockCount !== undefined ? `(${stockCount})` : ''}
      </span>
    );
  }

  return (
    <span className="yz-badge yz-badge-in-stock" title="Stock in healthy quantity">
      <span className="yz-badge-dot" />
      In Stock {stockCount !== undefined ? `(${stockCount})` : ''}
    </span>
  );
};

interface CategoryBadgeProps {
  category: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  return (
    <span className="yz-badge yz-badge-category">
      {category}
    </span>
  );
};
