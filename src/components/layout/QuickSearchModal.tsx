import React, { useState, useEffect } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { Modal } from '../common/Modal';
import type { YaazhiProduct } from '../../types/product';
import { productService } from '../../services/productService';
import { StockBadge } from '../common/Badge';
import { ProductImage } from '../common/ProductImage';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: YaazhiProduct) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YaazhiProduct[]>([]);
  const [allProducts, setAllProducts] = useState<YaazhiProduct[]>([]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      productService.list().then((prods) => {
        setAllProducts(prods);
        setResults(prods.slice(0, 5));
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(allProducts.slice(0, 5));
      return;
    }
    const q = query.toLowerCase().trim();
    const filtered = allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.fabric && p.fabric.toLowerCase().includes(q))
    );
    setResults(filtered.slice(0, 8));
  }, [query, allProducts]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Boutique Quick Search"
      subtitle="Search sarees, apparel, fabrics, SKUs, or barcodes"
      maxWidth="640px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--yz-text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Type product name, SKU, or scan barcode..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="yz-input"
            autoFocus
            style={{ paddingLeft: '2.5rem', fontSize: '1rem' }}
          />
        </div>

        {/* Results List */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxHeight: '340px',
            overflowY: 'auto',
          }}
        >
          {results.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--yz-text-muted)' }}>
              No boutique products matched "{query}".
            </div>
          ) : (
            results.map((product) => {
              const status = productService.getStockStatus(product);
              return (
                <div
                  key={product.id}
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--yz-border)',
                    borderRadius: 'var(--yz-radius-lg, 12px)',
                    backgroundColor: 'var(--yz-bg-surface)',
                    cursor: 'pointer',
                    boxShadow: 'var(--yz-shadow-2xs)',
                    transition: 'all 0.14s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--yz-primary)';
                    e.currentTarget.style.backgroundColor = 'var(--yz-bg-surface-hover)';
                    e.currentTarget.style.boxShadow = 'var(--yz-shadow-xs)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--yz-border)';
                    e.currentTarget.style.backgroundColor = 'var(--yz-bg-surface)';
                    e.currentTarget.style.boxShadow = 'var(--yz-shadow-2xs)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      productName={product.name}
                      category={product.category}
                      width={40}
                      height={40}
                      rounded="sm"
                      iconSize={18}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--yz-text-primary)' }}>{product.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', display: 'flex', gap: '6px', marginTop: '1px' }}>
                        <span style={{ fontFamily: 'var(--yz-font-mono)', fontWeight: 600 }}>SKU: {product.sku}</span>
                        <span>•</span>
                        <span>{product.category}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '14px', fontFamily: 'var(--yz-font-mono)', color: 'var(--yz-text-primary)' }}>
                        ₹{product.sellPrice.toLocaleString('en-IN')}
                      </div>
                      <StockBadge status={status} stockCount={product.currentStock} />
                    </div>
                    <ArrowRight size={15} color="var(--yz-text-muted)" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
