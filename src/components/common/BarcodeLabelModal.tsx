import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import type { YaazhiProduct } from '../../types/product';

interface BarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: YaazhiProduct | null;
}

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [copies, setCopies] = useState<number>(4);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [includeHsn, setIncludeHsn] = useState<boolean>(true);

  if (!product) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Print Boutique Hangtags & Barcodes"
      subtitle={`Generate thermal/shelf labels for ${product.name}`}
      maxWidth="520px"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="sm" icon={<Printer size={13} />} onClick={handlePrint}>
            Print {copies} Labels
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Controls */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '8px',
            padding: '8px 10px',
            backgroundColor: 'var(--yz-bg-subtle)',
            borderRadius: 'var(--yz-radius-sm)',
          }}
        >
          <div className="yz-field" style={{ margin: 0 }}>
            <label className="yz-label">Copies</label>
            <input
              type="number"
              min="1"
              max="50"
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
              className="yz-input"
              style={{ height: '26px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showPrice}
                onChange={(e) => setShowPrice(e.target.checked)}
              />
              Include Retail Price
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeHsn}
                onChange={(e) => setIncludeHsn(e.target.checked)}
              />
              Include HSN Code
            </label>
          </div>
        </div>

        {/* Label Preview Grid */}
        <div>
          <div className="yz-label" style={{ marginBottom: '0.5rem' }}>
            Label Tag Preview (50mm × 35mm Standard Boutique Format)
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '0.5rem',
              border: '1px solid var(--yz-border)',
              borderRadius: 'var(--yz-radius-md)',
              background: 'var(--yz-bg-canvas, #EAE6DF)',
            }}
          >
            {Array.from({ length: Math.min(copies, 6) }).map((_, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #1C1917',
                  borderRadius: '4px',
                  padding: '0.65rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                  fontFamily: 'var(--yz-font-body)',
                  color: '#1C1917',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E5E5', paddingBottom: '3px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--yz-primary)' }}>
                    YAAZHI BOUTIQUE
                  </span>
                  {includeHsn && (
                    <span style={{ fontSize: '0.6rem', color: '#666' }}>
                      HSN: {product.hsnCode}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.2, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {product.name}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#555' }}>
                  <span>SKU: {product.sku}</span>
                  <span>{product.category}</span>
                </div>

                {/* Simulated Barcode */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0' }}>
                  <div
                    style={{
                      height: '24px',
                      width: '85%',
                      background: 'repeating-linear-gradient(to right, #000 0, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 7px, transparent 7px, transparent 8px)',
                    }}
                  />
                  <span style={{ fontSize: '0.625rem', fontFamily: 'monospace', letterSpacing: '2px' }}>
                    {product.barcode}
                  </span>
                </div>

                {showPrice && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #EEE', paddingTop: '2px' }}>
                    <span style={{ fontSize: '0.6rem', color: '#666' }}>MRP Incl. GST</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1C1917' }}>
                      ₹{product.sellPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {copies > 6 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--yz-text-muted)', marginTop: '0.4rem' }}>
              Showing 6 of {copies} copies in preview. All {copies} will be printed.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
